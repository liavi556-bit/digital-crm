import type { DB } from '../db.js';
import { nowIso } from '../db.js';
import { createHash } from 'node:crypto';
import type { SourceConnector, ConnectorContext, NeedExtractor, Extraction, Opportunity, RawSignal, Evidence } from '../types.js';
import { config } from '../config.js';
import { CAT } from './taxonomy.js';
import { candidateHit } from './candidate.js';
import { decode, flatForMatch, isVerbatim } from './llm-extract.js';
import { findDeadline } from './extract.js';
import { sameEntity, jaccard, tokens, dedupeKey, normEntity } from './dedupe.js';

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32);
const decide = (db: DB, raw_id: number, stage: string, verdict: string, reason: string, detail?: unknown) =>
  db.prepare('INSERT INTO decisions(raw_id,stage,verdict,reason,detail,created_at) VALUES(?,?,?,?,?,?)').run(raw_id, stage, verdict, reason, detail ? JSON.stringify(detail) : null, nowIso());

// ---------- 1. INGEST ----------
export async function ingest(db: DB, connectors: SourceConnector[], ctx: ConnectorContext) {
  for (const c of connectors) {
    const run = db.prepare('INSERT INTO connector_runs(connector,started_at,status) VALUES(?,?,?)').run(c.id, nowIso(), 'running');
    const runId = Number(run.lastInsertRowid);
    try {
      const items = await c.fetch(ctx);
      let inserted = 0;
      for (const r of items) {
        const h = hash(`${r.source_url}|${r.title}`);
        const res = db.prepare(`INSERT OR IGNORE INTO raw_items(source,source_type,source_url,title,text,published_at,fetched_at,entity_hint,location_hint,raw_metadata,synthetic,content_hash)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(r.source, r.source_type, r.source_url, r.title, r.text, r.published_at, r.fetched_at, r.entity_hint, r.location_hint, JSON.stringify(r.raw_metadata), c.synthetic ? 1 : 0, h);
        inserted += Number(res.changes);
      }
      db.prepare('UPDATE connector_runs SET finished_at=?,status=?,fetched=?,inserted=? WHERE id=?').run(nowIso(), 'ok', items.length, inserted, runId);
      ctx.log.info(`connector ${c.id}: fetched=${items.length} new=${inserted}`);
    } catch (e) {
      db.prepare('UPDATE connector_runs SET finished_at=?,status=?,error=? WHERE id=?').run(nowIso(), 'error', String((e as Error).message).slice(0, 500), runId);
      ctx.log.error(`connector ${c.id} failed`, { err: String((e as Error).message) }); // graceful: continue with next
    }
  }
}

// ---------- 2-4. PROCESS: prefilter -> extract -> validate -> dedupe ----------
const rowToRaw = (r: any): RawSignal & { id: number; synthetic: number } => ({ ...r, raw_metadata: JSON.parse(r.raw_metadata ?? '{}') });

export async function processNew(db: DB, extractor: NeedExtractor, log: ConnectorContext['log'], concurrency = Number(process.env.PROCESS_CONCURRENCY) || 4) {
  const rows = db.prepare("SELECT * FROM raw_items WHERE status='new' ORDER BY id").all().map(rowToRaw);
  let idx = 0;
  const worker = async () => {
    while (idx < rows.length) {
      const raw = rows[idx++];
      try { await processOne(db, extractor, raw); } catch (e) { log.error('process failed', { id: raw.id, err: String((e as Error).message) }); }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return rows.length;
}

async function processOne(db: DB, extractor: NeedExtractor, raw: RawSignal & { id: number; synthetic: number }) {
  const setStatus = (s: string) => db.prepare('UPDATE raw_items SET status=? WHERE id=?').run(s, raw.id);
  const full = decode(`${raw.title}. ${raw.text}`).replace(/\s+/g, ' ');
  // 1. prefilter: length + freshness. An open, stated deadline overrides publication age (a live tender is not stale).
  if ((raw.title + raw.text).length < 25) { decide(db, raw.id, 'prefilter', 'rejected', 'too_short'); return setStatus('rejected'); }
  if (raw.published_at && Date.now() - +new Date(raw.published_at) > config.maxAgeDays * 864e5) {
    const dl = findDeadline(full);
    if (!dl || +new Date(dl) < Date.now()) { decide(db, raw.id, 'prefilter', 'rejected', 'stale', { published_at: raw.published_at, deadline: dl }); return setStatus('rejected'); }
    decide(db, raw.id, 'prefilter', 'passed', 'open_deadline_overrides_age', { published_at: raw.published_at, deadline: dl });
  } else decide(db, raw.id, 'prefilter', 'passed', 'ok');

  // 2. cheap candidate filter (keyword retrieval only) -> only candidates reach the extractor / LLM
  const hitWord = raw.raw_metadata?.source_is_prefiltered ? 'source_is_prefiltered' : candidateHit(full);
  if (!hitWord) { decide(db, raw.id, 'candidate', 'rejected', 'not_candidate'); return setStatus('rejected'); }
  decide(db, raw.id, 'candidate', 'passed', hitWord);

  // 3. extract (LLM or rules)
  const ex: Extraction = await extractor.extract(raw);
  if (!ex.is_opportunity) { decide(db, raw.id, 'extract', 'rejected', ex.reject_reason ?? 'not_an_opportunity'); return setStatus('rejected'); }

  // 4. anti-hallucination validation (same normalisation as the extractor's checks)
  if (!ex.evidence_quote || !isVerbatim(ex.evidence_quote, full)) { decide(db, raw.id, 'validate', 'rejected', 'evidence_not_verbatim_in_source', { quote: ex.evidence_quote }); return setStatus('rejected'); }
  if (!ex.entity || !ex.event_type || !raw.source_url) { decide(db, raw.id, 'validate', 'rejected', 'missing_entity_or_url'); return setStatus('rejected'); }
  if (ex.entity.length > 3 && !flatForMatch(full).includes(flatForMatch(ex.entity)) && !raw.entity_hint) { decide(db, raw.id, 'validate', 'rejected', 'entity_not_in_source', { entity: ex.entity }); return setStatus('rejected'); }
  if (ex.estimated_value && !/\d/.test(full)) ex.estimated_value = null;
  if (ex.expires_at && +new Date(ex.expires_at) < Date.now()) { decide(db, raw.id, 'validate', 'rejected', 'already_expired', { expires_at: ex.expires_at }); return setStatus('rejected'); }
  db.prepare('INSERT OR REPLACE INTO signals(raw_id,extractor,extraction,created_at) VALUES(?,?,?,?)').run(raw.id, extractor.id, JSON.stringify(ex), nowIso());
  decide(db, raw.id, 'extract', 'passed', `${ex.event_type}${ex.explicit_need ? '+explicit' : ''}`, { predicted: ex.predicted_needs?.length });

  // dedupe / entity resolution
  const cands = db.prepare('SELECT id, data, synthetic FROM opportunities WHERE event_type=? AND synthetic=?').all(ex.event_type, raw.synthetic) as { id: number; data: string }[];
  const rawTok = tokens(raw.title);
  const hit = cands.find((c) => {
    const o = JSON.parse(c.data) as Opportunity;
    const sameE = sameEntity(o.entity, ex.entity!);
    const locOk = !o.location || !ex.location || o.location === ex.location;
    const near = !o.published_at || !raw.published_at || Math.abs(+new Date(o.published_at) - +new Date(raw.published_at)) < 21 * 864e5;
    const titleSim = jaccard(tokens(o.what_happened), rawTok) >= 0.6 && locOk;
    // Two tenders/requests from the same buyer are different needs: they must also match on title
    const explicitKind = ex.event_type === 'TENDER_PUBLISHED' || ex.event_type === 'EXPLICIT_REQUEST';
    return near && (explicitKind ? titleSim : (sameE && locOk) || titleSim);
  });
  if (hit) {
    const o = JSON.parse((cands.find((c) => c.id === hit.id)!).data) as Opportunity;
    o.confidence_score = Math.min(97, Math.max(o.confidence_score, ex.confidence_score ?? 0) + 4); // corroboration bump
    if (!o.explicit_need && ex.explicit_need) o.explicit_need = ex.explicit_need;
    for (const p of ex.predicted_needs ?? []) if (!o.predicted_needs.some((q) => q.category === p.category)) o.predicted_needs.push(p);
    if (!o.estimated_value && ex.estimated_value) o.estimated_value = ex.estimated_value;
    if (!o.location && ex.location) o.location = ex.location;
    db.prepare('INSERT OR IGNORE INTO opportunity_evidence(opp_id,raw_id,quote) VALUES(?,?,?)').run(hit.id, raw.id, ex.evidence_quote);
    db.prepare('UPDATE opportunities SET data=?, updated_at=? WHERE id=?').run(JSON.stringify(o), nowIso(), hit.id);
    decide(db, raw.id, 'dedupe', 'merged', `duplicate_of_opportunity_${hit.id}`, { entity: o.entity });
    return setStatus('duplicate');
  }
  const base: Omit<Opportunity, 'id' | 'evidence' | 'high_quality'> = {
    entity: ex.entity, event_type: ex.event_type, what_happened: ex.what_happened ?? raw.title,
    explicit_need: ex.explicit_need ?? null, predicted_needs: ex.predicted_needs ?? [],
    category: ex.category ?? 'other', location: ex.location ?? null,
    intent_score: ex.intent_score ?? 50, confidence_score: ex.confidence_score ?? 50,
    estimated_value: ex.estimated_value ?? null, urgency: ex.urgency ?? 'medium',
    source_url: raw.source_url, source_name: raw.source, published_at: raw.published_at, expires_at: ex.expires_at ?? null,
    possible_solutions: [], allowed_actions: ['open_source', 'investigate', 'prepare_outreach', 'prepare_action_plan'],
    synthetic: !!raw.synthetic, extractor: extractor.id,
    explicit_needs: ex.explicit_needs ?? (ex.explicit_need ? [ex.explicit_need] : []), commercial_actions: ex.commercial_actions ?? [], deadline_at: ex.deadline_at ?? null,
  };
  const cats = new Set([base.category, ...base.predicted_needs.map((p) => p.category)]);
  base.possible_solutions = [...cats].flatMap((c) => CAT[c]?.solutions.slice(0, 1) ?? []);
  const res = db.prepare('INSERT INTO opportunities(dedupe_key,entity_norm,event_type,data,synthetic,created_at,updated_at) VALUES(?,?,?,?,?,?,?)')
    .run(dedupeKey(ex.entity, ex.event_type, ex.location ?? null), normEntity(ex.entity), ex.event_type, JSON.stringify(base), raw.synthetic, nowIso(), nowIso());
  db.prepare('INSERT INTO opportunity_evidence(opp_id,raw_id,quote) VALUES(?,?,?)').run(res.lastInsertRowid, raw.id, ex.evidence_quote);
  decide(db, raw.id, 'dedupe', 'new_opportunity', `opportunity_${res.lastInsertRowid}`);
  setStatus('opportunity');
}

// ---------- read model ----------
export function loadOpportunities(db: DB, opts: { includeSynthetic?: boolean } = {}): Opportunity[] {
  const rows = db.prepare('SELECT id, data FROM opportunities' + (opts.includeSynthetic ? '' : ' WHERE synthetic=0')).all() as { id: number; data: string }[];
  const evStmt = db.prepare(`SELECT e.raw_id, e.quote, r.source, r.source_url, r.published_at FROM opportunity_evidence e JOIN raw_items r ON r.id=e.raw_id WHERE e.opp_id=? ORDER BY r.published_at DESC`);
  return rows.map((r) => {
    const o = JSON.parse(r.data) as Opportunity;
    const evidence: Evidence[] = (evStmt.all(r.id) as any[]).map((e) => ({ raw_id: e.raw_id, quote: e.quote, source_name: e.source, source_url: e.source_url, published_at: e.published_at }));
    o.id = r.id; o.evidence = evidence;
    o.high_quality = isHighQuality(o);
    return o;
  });
}
export function isHighQuality(o: Opportunity): boolean {
  const fresh = !o.published_at || Date.now() - +new Date(o.published_at) < config.maxAgeDays * 864e5;
  return !o.synthetic && o.confidence_score / 100 >= config.hqMinConfidence && o.evidence.length > 0 && !!o.source_url && !!o.entity && fresh && (!o.expires_at || +new Date(o.expires_at) > Date.now());
}
