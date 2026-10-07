import { readFileSync, existsSync } from 'node:fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
const num = (k: string, d: number) => (process.env[k] ? Number(process.env[k]) : d);
export const config = {
  llmProvider: process.env.LLM_PROVIDER || 'rules',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicBase: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiBase: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  claudeCliBin: process.env.CLAUDE_CLI_BIN || 'claude', // on Windows point this at claude.exe (spawn without a shell)
  claudeCliModel: process.env.CLAUDE_CLI_MODEL || 'haiku',
  searchProvider: process.env.SEARCH_PROVIDER || 'google-news-rss',
  connectors: (process.env.CONNECTORS || 'rss').split(',').map((s) => s.trim()).filter(Boolean),
  maxAgeDays: num('MAX_AGE_DAYS', 45),
  hqMinConfidence: num('HQ_MIN_CONFIDENCE', 0.6),
  httpMinIntervalMs: num('HTTP_MIN_INTERVAL_MS', 1500),
  httpCacheTtlS: num('HTTP_CACHE_TTL_S', 1800),
  httpRetries: num('HTTP_RETRIES', 3),
  userAgent: process.env.USER_AGENT || 'NeedEnginePOC/0.1',
  port: num('PORT', 3000),
  dbPath: process.env.DB_PATH || 'data/need-engine.db',
};
