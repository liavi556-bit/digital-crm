import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { loadOpportunities } from './engine/pipeline.js';
import { buildProfile } from './engine/profile.js';
import { pipelineStats, rawItemsWithDecisions } from './stats.js';
import { nowIso } from './db.js';
import type { BusinessProfile, ActionDraft } from './types.js';

const app = createApp();
let running = false;
const page = (f: string) => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const send = (res: ServerResponse, code: number, body: unknown, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'content-type': type }); res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
const readBody = (req: IncomingMessage) => new Promise<any>((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } }); });
const getProfile = (id: number): BusinessProfile | null => { const r = app.db.prepare('SELECT data FROM profiles WHERE id=?').get(id) as { data: string } | undefined; return r ? { ...JSON.parse(r.data), id } : null; };

createServer(async (req, res) => {
  const u = new URL(req.url ?? '/', 'http://x');
  try {
    if (u.pathname === '/') return send(res, 200, page('index.html'), 'text/html; charset=utf-8');
    if (u.pathname === '/admin') return send(res, 200, page('admin.html'), 'text/html; charset=utf-8');
    const demo = u.searchParams.get('demo') === '1' ? 1 : 0;

    if (u.pathname === '/api/profile' && req.method === 'POST') {
      const b = await readBody(req);
      if (!b.url && !b.description) return send(res, 400, { error: 'url or description required' });
      const p = await buildProfile({ url: b.url || undefined, description: b.description, services: b.services, regions: b.regions, deal_min: b.deal_min ?? undefined, deal_max: b.deal_max ?? undefined }, app.http, app.llm);
      const r = app.db.prepare('INSERT INTO profiles(data,created_at) VALUES(?,?)').run(JSON.stringify(p), nowIso());
      return send(res, 200, { ...p, id: Number(r.lastInsertRowid) });
    }
    if (u.pathname === '/api/feed') {
      const p = getProfile(Number(u.searchParams.get('profile_id')));
      if (!p) return send(res, 404, { error: 'profile not found' });
      const opps = loadOpportunities(app.db, { includeSynthetic: !!demo }).filter((o) => o.synthetic === !!demo);
      const matches = app.scorer.score(opps, p);
      return send(res, 200, { profile: p, demo: !!demo, total_opportunities: opps.length, matches });
    }
    if (u.pathname === '/api/ingest' && req.method === 'POST') {
      if (running) return send(res, 409, { error: 'already running' });
      running = true;
      const b = await readBody(req);
      app.runPipeline(b.connectors).catch((e) => logger.error('pipeline failed', { err: String(e) })).finally(() => (running = false));
      return send(res, 202, { started: true });
    }
    if (u.pathname === '/api/status') return send(res, 200, { running, extractor: app.extractor.id, connectors: config.connectors });
    if (u.pathname === '/api/admin/stats') return send(res, 200, pipelineStats(app.db, demo));
    if (u.pathname === '/api/admin/items') return send(res, 200, rawItemsWithDecisions(app.db, demo, u.searchParams.get('status') ?? undefined));
    if (u.pathname === '/api/action' && req.method === 'POST') {
      const b = await readBody(req);
      const p = getProfile(b.profile_id);
      const o = loadOpportunities(app.db, { includeSynthetic: true }).find((x) => x.id === b.opp_id);
      if (!p || !o) return send(res, 404, { error: 'not found' });
      const draft = await app.actions.prepare(o, p, b.kind === 'action_plan' ? 'action_plan' : 'outreach');
      app.db.prepare('INSERT INTO action_log(opp_id,profile_id,kind,draft,approved,created_at) VALUES(?,?,?,?,?,?)').run(o.id, p.id!, draft.kind, JSON.stringify(draft), 0, nowIso());
      return send(res, 200, draft);
    }
    if (u.pathname === '/api/action/approve' && req.method === 'POST') {
      const b = await readBody(req) as { opp_id: number; profile_id: number; draft: ActionDraft; approved: boolean };
      app.db.prepare('INSERT INTO action_log(opp_id,profile_id,kind,draft,approved,created_at) VALUES(?,?,?,?,?,?)').run(b.opp_id, b.profile_id, b.draft?.kind ?? '', JSON.stringify(b.draft), b.approved ? 1 : 0, nowIso());
      return send(res, 200, await app.actions.execute(b.draft, !!b.approved));
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { logger.error('request failed', { url: req.url, err: String((e as Error).stack ?? e) }); send(res, 500, { error: String((e as Error).message) }); }
}).listen(config.port, () => logger.info(`Need Engine on http://localhost:${config.port}  extractor=${app.extractor.id}`));
