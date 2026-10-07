import { openDb } from './db.js';
import { logger } from './logger.js';
import { createHttp } from './http.js';
import { createLLM } from './providers/llm.js';
import { LLMExtractor, RuleBasedExtractor } from './engine/extract.js';
import { buildConnectors } from './connectors/registry.js';
import { ingest, processNew } from './engine/pipeline.js';
import { DraftActionProvider } from './actions/provider.js';
import { WeightedMatchScorer } from './engine/match.js';

export function createApp(dbPath?: string) {
  const db = openDb(dbPath);
  const http = createHttp(db, logger);
  const llm = createLLM();
  const extractor = llm ? new LLMExtractor(llm) : new RuleBasedExtractor();
  const actions = new DraftActionProvider(llm);
  const scorer = new WeightedMatchScorer();
  const ctx = { http, log: logger };
  async function runPipeline(enabled?: string[]) {
    await ingest(db, buildConnectors(enabled), ctx);
    return processNew(db, extractor, logger);
  }
  return { db, http, llm, extractor, actions, scorer, ctx, runPipeline };
}
