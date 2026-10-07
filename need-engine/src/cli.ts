import { writeFileSync, mkdirSync } from 'node:fs';
import { createApp } from './app.js';
import { logger } from './logger.js';
import { buildConnectors } from './connectors/registry.js';
import { ingest, processNew, loadOpportunities } from './engine/pipeline.js';
import { buildProfile } from './engine/profile.js';
import { POC_PROFILES } from './profiles/poc.js';
import { pipelineStats } from './stats.js';
import { config } from './config.js';

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
  default: console.error('usage: ingest | process | poc [--fixtures] | report');
}
