import assert from 'node:assert/strict';
import { openDb } from './db.js';
import { logger } from './logger.js';
import { ingest, processNew, loadOpportunities } from './engine/pipeline.js';
import { RuleBasedExtractor } from './engine/extract.js';
import { RssConnector } from './connectors/rss.js';
import { FixtureConnector } from './connectors/fixture.js';
import { buildProfile } from './engine/profile.js';
import { WeightedMatchScorer } from './engine/match.js';
import { sameEntity } from './engine/dedupe.js';
import type { NeedExtractor, HttpClient } from './types.js';

const quiet = { info() {}, warn() {}, error() {} };
const tests: [string, () => Promise<void>][] = [];
const t = (n: string, f: () => Promise<void>) => tests.push([n, f]);

t('entity resolution', async () => {
  assert.ok(sameEntity('סופר-דמו בע"מ', 'סופר-דמו'));
  assert.ok(!sameEntity('סופר-דמו', 'קופי-דמו'));
});

t('fixtures: dedupe, stale, non-event, explicit/predicted split', async () => {
  const db = openDb(':memory:');
  await ingest(db, [new FixtureConnector()], { http: null as any, log: quiet });
  await processNew(db, new RuleBasedExtractor(), quiet);
  const opps = loadOpportunities(db, { includeSynthetic: true });
  assert.equal(opps.length, 7);
  const branch = opps.find((o) => o.entity.includes('סופר'))!;
  assert.equal(branch.evidence.length, 2, 'two sources merged into one opportunity');
  assert.equal(branch.explicit_need, null);
  assert.ok(branch.predicted_needs.some((n) => n.category === 'signage'));
  const tender = opps.find((o) => o.event_type === 'TENDER_PUBLISHED' && o.entity.includes('עיריית'))!;
  assert.equal(tender.explicit_need?.category, 'cleaning');
  assert.equal(tender.estimated_value?.amount_ils, 2_000_000);
  assert.ok(opps.every((o) => o.evidence.length && o.source_url));
  assert.equal(loadOpportunities(db).length, 0, 'synthetic hidden by default');
  assert.ok(opps.every((o) => !o.high_quality), 'synthetic is never high quality');
});

t('hallucinated evidence is rejected', async () => {
  const db = openDb(':memory:');
  await ingest(db, [new FixtureConnector()], { http: null as any, log: quiet });
  const liar: NeedExtractor = { id: 'liar', extract: async () => ({ is_opportunity: true, entity: 'סופר-דמו', event_type: 'NEW_LOCATION', evidence_quote: 'משפט שלא קיים במקור בכלל', predicted_needs: [], confidence_score: 90, intent_score: 90 }) };
  await processNew(db, liar, quiet);
  assert.equal(loadOpportunities(db, { includeSynthetic: true }).length, 0);
  const n = (db.prepare("SELECT COUNT(*) n FROM decisions WHERE reason='evidence_not_verbatim_in_source'").get() as any).n;
  assert.ok(n >= 8);
});

t('RSS connector parses RSS 2.0', async () => {
  const xml = `<rss><channel><item><title>חברה-דמו פותחת סניף חדש בחיפה</title><link>https://ex.test/a</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate><description>&lt;p&gt;פרטים&lt;/p&gt;</description></item></channel></rss>`;
  const http: HttpClient = { getText: async () => xml, getJson: async () => ({}) as any };
  const items = await new RssConnector({ name: 'x', url: 'https://ex.test/feed' }).fetch({ http, log: logger });
  assert.equal(items.length, 1); assert.equal(items[0].text, 'פרטים'); assert.ok(items[0].published_at);
});

t('connector failure is graceful', async () => {
  const db = openDb(':memory:');
  const http: HttpClient = { getText: async () => { throw new Error('boom'); }, getJson: async () => { throw new Error('boom'); } };
  await ingest(db, [new RssConnector({ name: 'bad', url: 'https://x.test' }), new FixtureConnector()], { http, log: quiet });
  const runs = db.prepare('SELECT status FROM connector_runs ORDER BY id').all().map((r: any) => r.status);
  assert.deepEqual(runs, ['error', 'ok']);
});

t('matching ranks explicit+fit above unrelated, respects location', async () => {
  const db = openDb(':memory:');
  await ingest(db, [new FixtureConnector()], { http: null as any, log: quiet });
  await processNew(db, new RuleBasedExtractor(), quiet);
  const opps = loadOpportunities(db, { includeSynthetic: true });
  const clean = await buildProfile({ description: 'חברת ניקיון ופוליש בכל הארץ' });
  const m = new WeightedMatchScorer().score(opps, clean);
  assert.equal(m[0].opportunity.entity, 'עיריית דמוסיטי');
  assert.ok(m.every((x) => x.matched_categories.length));
  const south = await buildProfile({ description: 'חברת ניקיון בדרום', services: ['cleaning'], regions: ['דרום'] });
  const ms = new WeightedMatchScorer().score(opps, south);
  const beer = ms.find((x) => x.opportunity.entity.includes('סופר'))!, netanya = ms.find((x) => x.opportunity.entity.includes('בנייני'))!;
  assert.ok(beer.breakdown.location > netanya.breakdown.location);
});

let fail = 0;
for (const [n, f] of tests) { try { await f(); console.log('✓', n); } catch (e) { fail++; console.log('✗', n, '\n ', (e as Error).message); } }
process.exit(fail ? 1 : 0);
