import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

export type DB = DatabaseSync;
export function openDb(path = config.dbPath): DB {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
  PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS http_cache(url TEXT PRIMARY KEY, body TEXT, fetched_at INTEGER);
  CREATE TABLE IF NOT EXISTS connector_runs(id INTEGER PRIMARY KEY, connector TEXT, started_at TEXT, finished_at TEXT,
    status TEXT, fetched INTEGER DEFAULT 0, inserted INTEGER DEFAULT 0, error TEXT);
  CREATE TABLE IF NOT EXISTS raw_items(id INTEGER PRIMARY KEY, source TEXT, source_type TEXT, source_url TEXT, title TEXT,
    text TEXT, published_at TEXT, fetched_at TEXT, entity_hint TEXT, location_hint TEXT, raw_metadata TEXT,
    synthetic INTEGER DEFAULT 0, content_hash TEXT UNIQUE, status TEXT DEFAULT 'new');
  CREATE TABLE IF NOT EXISTS decisions(id INTEGER PRIMARY KEY, raw_id INTEGER, stage TEXT, verdict TEXT, reason TEXT, detail TEXT, created_at TEXT);
  CREATE TABLE IF NOT EXISTS signals(id INTEGER PRIMARY KEY, raw_id INTEGER UNIQUE, extractor TEXT, extraction TEXT, created_at TEXT);
  CREATE TABLE IF NOT EXISTS opportunities(id INTEGER PRIMARY KEY, dedupe_key TEXT, entity_norm TEXT, event_type TEXT,
    data TEXT, synthetic INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
  CREATE TABLE IF NOT EXISTS opportunity_evidence(id INTEGER PRIMARY KEY, opp_id INTEGER, raw_id INTEGER UNIQUE, quote TEXT);
  CREATE TABLE IF NOT EXISTS profiles(id INTEGER PRIMARY KEY, data TEXT, created_at TEXT);
  CREATE TABLE IF NOT EXISTS action_log(id INTEGER PRIMARY KEY, opp_id INTEGER, profile_id INTEGER, kind TEXT, draft TEXT, approved INTEGER, created_at TEXT);
  CREATE INDEX IF NOT EXISTS ix_dec_raw ON decisions(raw_id);
  `);
  return db;
}
export const nowIso = () => new Date().toISOString();
