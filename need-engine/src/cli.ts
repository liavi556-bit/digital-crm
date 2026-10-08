import { writeFileSync, mkdirSync } from 'node:fs';
import { createApp } from './app.js';
import { logger } from './logger.js';
import { buildConnectors } from './connectors/registry.js';
import { ingest, processNew, loadOpportunities } from './engine/pipeline.js';
import { buildProfile } from './engine/profile.js';
import { POC_PROFILES } from './profiles/poc.js';
import { pipelineStats } from './stats.js';
import { config } from './config.js';
import { readFileSync, existsSync } from 'node:fs';
import { monetizeAll, synthesize, ensureMonetizationTables } from './engine/monetize.js';

const [cmd = 'poc', ...flags] = process.argv.slice(2);
const app = createApp();

async function report() {
  const out: any = { generated_at: new Date().toISOString(), extractor: app.extractor.id, real: pipelineStats(app.db, 0), synthetic: pipelineStats(app.db, 1), profiles: {} as any };
  for (const synth of [false, true]) {
    const opps = loadOpportunities(app.db, { includeSynthetic: synth }).filter((o) => o.synthetic === synth);
    for (const [name, input] of Object.entries(POC_PROFILES)) {
      const p = await buildProfile(input);
      const ms = app.scorer.score(opps, p);
      (out.profiles[`${synth ? 'synthetic' : 'real'}:${name}`] = { matches: ms.length, top: ms.slice(0, 5).map((m) => ({ score: m.score, entity: m.opportunity.entity, what: m.opportunity.what_happened, url: m.opportunity.source_url, kinds: m.matched_categories })) });
    }
  }
  mkdirSync('data', { recursive: true });
  writeFileSync('data/poc-report.json', JSON.stringify(out, null, 2));
  return out;
}

switch (cmd) {
  case 'ingest': await ingest(app.db, buildConnectors(), app.ctx); break;
  case 'process': console.log('processed', await processNew(app.db, app.extractor, logger)); break;
  case 'poc': {
    const enabled = flags.includes('--fixtures') ? [...config.connectors, 'fixture'] : config.connectors;
    console.log('processed', await app.runPipeline(enabled));
    const r = await report();
    console.log(JSON.stringify({ real: r.real.totals, synthetic: r.synthetic.totals, connectors: r.real.connectors.map((c: any) => `${c.connector}: ${c.status}${c.error ? ' — ' + c.error.slice(0, 90) : ` (${c.fetched})`}`).slice(0, 6) }, null, 2));
    break;
  }
  case 'report': console.log(JSON.stringify(await report(), null, 2)); break;
  case 'monetize': {
    if (!app.llm) throw new Error('monetize needs an LLM (LLM_PROVIDER)');
    const opps = loadOpportunities(app.db);
    await monetizeAll(app.db, app.llm, opps, logger, Number(process.env.PROCESS_CONCURRENCY) || 3);
    break;
  }
  case 'synthesize': {
    if (!app.llm) throw new Error('synthesize needs an LLM (LLM_PROVIDER)');
    ensureMonetizationTables(app.db);
    const verdicts = existsSync('benchmark/round2-verdicts.json') ? JSON.parse(readFileSync('benchmark/round2-verdicts.json', 'utf8')).verdicts : {};
    const items = loadOpportunities(app.db).filter((o) => (verdicts[o.id]?.verdict ?? 'TP') !== 'FP').map((o) => ({
      id: o.id, verdict: verdicts[o.id]?.verdict ?? 'unreviewed',
      brief: { entity: o.entity, event: o.event_type, what: o.what_happened, deadline: o.deadline_at, needs: (o.explicit_needs ?? []).map((n) => n.need).concat(o.predicted_needs.map((p) => `(predicted) ${p.need}`)), source: o.source_name },
      monetization: JSON.parse((app.db.prepare('SELECT data FROM monetization WHERE opp_id=?').get(o.id) as any)?.data ?? 'null'),
    }));
    console.log(JSON.stringify(await synthesize(app.db, app.llm, items), null, 2));
    break;
  }
  case 'match': {
    const verdicts = existsSync('benchmark/round2-verdicts.json') ? JSON.parse(readFileSync('benchmark/round2-verdicts.json', 'utf8')).verdicts : {};
    const opps = loadOpportunities(app.db);
    const out: any = {};
    for (const [name, input] of Object.entries(POC_PROFILES)) {
      const ms = app.scorer.score(opps, await buildProfile(input));
      out[name] = ms.map((m) => ({ id: m.opportunity.id, score: m.score, entity: m.opportunity.entity, what: m.opportunity.what_happened, kinds: m.matched_categories, verdict: verdicts[m.opportunity.id]?.verdict ?? 'unreviewed' }));
    }
    console.log(JSON.stringify(out, null, 2));
    break;
  }
  default: console.error('usage: ingest | process | poc [--fixtures] | report | monetize | synthesize | match');
}
