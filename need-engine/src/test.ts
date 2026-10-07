import assert from 'node:assert/strict';
import { openDb } from './db.js';
import { logger } from './logger.js';
import { ingest, processNew, loadOpportunities } from './engine/pipeline.js';
import { RuleBasedExtractor } from './engine/extract.js';
import { RssConnector } from './connectors/rss.js';
import { FixtureConnector } from './connectors/fixture.js';
import { CkanConnector, parseIlDate } from './connectors/ckan.js';
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

t('CKAN connector: Israeli dates, title/entity/date columns, per-package budget', async () => {
  assert.equal(parseIlDate('08.02.2021')?.toISOString(), '2021-02-08T00:00:00.000Z');
  assert.equal(parseIlDate('20/10/2026 12:00:00')?.toISOString(), '2026-10-20T12:00:00.000Z');
  assert.equal(parseIlDate('4000529050'), null);
  const pkgs = { result: { results: [
    { name: 'noise', title: 'רעש', organization: { title: 'משרד א' }, resources: [{ id: 'n1', datastore_active: true }, { id: 'n2', datastore_active: true }, { id: 'n3', datastore_active: true }] },
    { name: 'gov', title: 'דוח מכרזים', organization: { title: 'מינהל הרכש' }, resources: [{ id: 'g1', datastore_active: true }] },
    { name: 'muni', title: 'מכרזים בעיר', organization: { title: 'עיריית דמו' }, resources: [{ id: 'm1', datastore_active: true }] } ] } };
  const rows: Record<string, any[]> = {
    n1: [{ _id: 1, x: 'y' }], n2: [{ _id: 1, x: 'y' }], n3: [{ _id: 1, x: 'y' }],
    g1: [{ _id: 7, 'מספר פרסום': '4000529050', 'שם המשרד': 'משטרת ישראל', 'שם הליך': 'רכש אולר', 'תאריך פרסום': '08.02.2021', 'תאריך אחרון להגשת השגות': '07.03.2021', 'נושאים': 'ציוד' }],
    m1: [{ _id: 1, 'שם מכרז': 'שירותי ניקיון', 'תאריך אחרון להגשה': '20/10/2026 12:00:00', 'תאריך עדכון': '16/09/2026 00:00:00', URL: 'http://muni.test/t/1' }],
  };
  const http: HttpClient = { getText: async () => '', getJson: async (u: string) => (u.includes('package_search') ? pkgs : { result: { records: rows[new URL(u).searchParams.get('resource_id')!] } }) as any };
  const items = await new CkanConnector('מכרזים').fetch({ http, log: quiet });
  const gov = items.find((i) => i.source.includes('דוח'))!, muni = items.find((i) => i.source.includes('בעיר'))!;
  assert.ok(gov && muni, 'later packages reached despite a noisy first package');
  assert.equal(gov.title, 'רכש אולר'); assert.equal(gov.entity_hint, 'משטרת ישראל'); assert.equal(gov.published_at, '2021-02-08T00:00:00.000Z');
  assert.equal(muni.title, 'שירותי ניקיון'); assert.equal(muni.entity_hint, 'עיריית דמו');
  assert.equal(muni.published_at, '2026-09-16T00:00:00.000Z', 'update date, not the submission deadline');
  assert.equal(muni.source_url, 'http://muni.test/t/1');
});

t('CKAN undated rows use resource last_modified as upper bound (old file => stale)', async () => {
  const pkgs = { result: { results: [{ name: 'calls', title: 'קול קורא - ישן', organization: { title: 'משרד ב' }, resources: [{ id: 'c1', datastore_active: true, last_modified: '2018-12-02T05:53:38.748666' }] }] } };
  const http: HttpClient = { getText: async () => '', getJson: async (u: string) => (u.includes('package_search') ? pkgs : { result: { records: [{ _id: 1, 'שם': 'עמותה' }] } }) as any };
  const [row] = await new CkanConnector('קול קורא').fetch({ http, log: quiet });
  assert.equal(row.published_at, '2018-12-02T05:53:38.748Z');
  assert.equal(row.raw_metadata.date_basis, 'resource_last_modified(upper bound)');
});

t('dedupe: two different tenders from the same buyer stay separate', async () => {
  const db = openDb(':memory:');
  const ago = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
  const mk = (n: number, title: string) => ({ source: 's', source_type: 'ckan', source_url: `https://x.test/${n}`, title, text: `שם מכרז: ${title}. תאריך אחרון להגשה: 20/12/2099`, published_at: ago(2), fetched_at: ago(0), entity_hint: 'עיריית דמו', location_hint: null, raw_metadata: {} });
  const conn = { id: 'c', sourceType: 'ckan', fetch: async () => [mk(1, 'מכרז לשירותי ניקיון מוסדות חינוך'), mk(2, 'מכרז לתחזוקת מעליות במבני ציבור'), mk(3, 'מכרז לשירותי ניקיון מוסדות חינוך - הבהרה')] };
  await ingest(db, [conn], { http: null as any, log: quiet });
  await processNew(db, new RuleBasedExtractor(), quiet, 1);
  const opps = loadOpportunities(db);
  assert.equal(opps.length, 2, 'cleaning tender + elevator tender; the clarification merges into the cleaning one');
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
