import type { DB } from '../db.js';
import type { LLMProvider, Opportunity } from '../types.js';
import { parseJsonLoose } from '../providers/llm.js';

/**
 * MONETIZATION LAYER: for every opportunity, how does it become money, for whom, and what is the first step.
 * Money figures are MODEL ESTIMATES unless the amount is written in the source (basis = "stated").
 * Nothing here contacts anyone; "first_step" is a draft action for a human.
 */
export const OPP_TYPES = ['DEMAND', 'MATCHING', 'MARKET_GAP', 'PRODUCT', 'MONEY'] as const;
export const REVENUE_MODELS = ['LEAD_SUBSCRIPTION', 'REFERRAL_FEE', 'BID_PREP_SERVICE', 'SERVICE_DELIVERY', 'AFFILIATE', 'PRODUCT_SALE', 'NONE'] as const;

const S = { type: 'string' }, N = { type: ['number', 'null'] };
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['opportunity_types', 'paths', 'best_path_index', 'monetizable', 'why_not'],
  properties: {
    opportunity_types: { type: 'array', items: { type: 'string', enum: OPP_TYPES } },
    paths: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['model', 'who_pays', 'what_we_sell', 'target_buyers', 'deal_value_ils', 'deal_value_basis', 'our_revenue_ils', 'our_revenue_logic', 'first_step', 'days_to_cash', 'competition', 'legal_or_ethical_risk'],
      properties: {
        model: { type: 'string', enum: REVENUE_MODELS }, who_pays: S, what_we_sell: S, target_buyers: { type: 'array', items: S },
        deal_value_ils: N, deal_value_basis: { type: 'string', enum: ['stated', 'estimate', 'unknown'] },
        our_revenue_ils: N, our_revenue_logic: S, first_step: S, days_to_cash: N, competition: S, legal_or_ethical_risk: S,
      } } },
    best_path_index: { type: 'number' }, monetizable: { type: 'boolean' }, why_not: { type: ['string', 'null'] },
  },
};

const SYSTEM = `You are the MONETIZATION step of "Need Engine". Input: ONE validated opportunity (who needs what, evidence, deadline, source).
Goal: concrete, legal paths by which a small Israeli operator ("we") turns THIS opportunity into revenue. Think like a business owner, not a consultant.
Revenue models: LEAD_SUBSCRIPTION (sell the alert/lead to vendors who can supply), REFERRAL_FEE (vendor pays us when connected/won — vendor side only),
BID_PREP_SERVICE (we prepare the vendor's tender/RFI response with AI for a fee), SERVICE_DELIVERY (we deliver it ourselves, e.g. AI/automation, marketing),
AFFILIATE, PRODUCT_SALE, NONE.
Rules:
- Use only facts from the opportunity. deal_value_ils: if an amount is written in the evidence use it with basis "stated"; otherwise a rough estimate with basis "estimate", or null + "unknown". Never present an estimate as fact.
- our_revenue_logic must show the arithmetic (e.g. "3 vendors x ₪300 alert fee", "8% of ₪40k bid-prep").
- Public tenders: never suggest paying or charging the PUBLIC BODY a finder's fee, never influence on officials; revenue comes from vendors or from delivering the work.
- Huge infrastructure tenders (₪100M+) are usually reachable only by large contractors: say so; prefer subcontractor/supplier angles.
- competition: name the type of incumbent (e.g. paid tender-alert services, general contractors) — do not invent company names.
- first_step: one concrete action a person can do this week (a draft, not an automatic send).
- 1-3 paths, best first. monetizable=false if no realistic path for a small operator, with why_not.
- opportunity_types: DEMAND (existing demand to supply), MATCHING (two sides to connect), MARKET_GAP, PRODUCT (something worth building), MONEY (money/right to claim).
Write text fields in Hebrew.`;

export interface Monetization {
  opportunity_types: string[]; monetizable: boolean; why_not: string | null; best_path_index: number;
  paths: { model: string; who_pays: string; what_we_sell: string; target_buyers: string[]; deal_value_ils: number | null; deal_value_basis: string;
    our_revenue_ils: number | null; our_revenue_logic: string; first_step: string; days_to_cash: number | null; competition: string; legal_or_ethical_risk: string }[];
}

export function ensureMonetizationTables(db: DB) {
  db.exec(`CREATE TABLE IF NOT EXISTS monetization(opp_id INTEGER PRIMARY KEY, model TEXT, data TEXT, created_at TEXT);
           CREATE TABLE IF NOT EXISTS synthesis(id INTEGER PRIMARY KEY AUTOINCREMENT, model TEXT, data TEXT, created_at TEXT);`);
}

const oppBrief = (o: Opportunity) => JSON.stringify({
  entity: o.entity, event_type: o.event_type, what_happened: o.what_happened, source: o.source_name, url: o.source_url,
  published_at: o.published_at, deadline: o.deadline_at ?? null,
  explicit_needs: o.explicit_needs ?? (o.explicit_need ? [o.explicit_need] : []),
  predicted_needs: o.predicted_needs.map((p) => ({ need: p.need, category: p.category, confidence: p.confidence, rationale: p.rationale })),
  evidence: o.evidence.map((e) => e.quote),
});

/** Validation: a "stated" amount must literally appear in the evidence, otherwise it is downgraded to "estimate". */
export function validateMonetization(m: Monetization, o: Opportunity): Monetization {
  const text = [o.what_happened, ...o.evidence.map((e) => e.quote), ...(o.explicit_needs ?? []).map((n) => n.quote)].join(' ').replace(/[,\s]/g, '');
  for (const p of m.paths ?? []) {
    if (p.deal_value_basis === 'stated' && p.deal_value_ils != null && !text.includes(String(Math.round(p.deal_value_ils)))) p.deal_value_basis = 'estimate';
    if (p.deal_value_ils == null) p.deal_value_basis = 'unknown';
  }
  if (!m.paths?.length) { m.monetizable = false; m.why_not = m.why_not ?? 'no path returned'; }
  m.best_path_index = Math.max(0, Math.min((m.paths?.length ?? 1) - 1, Math.round(m.best_path_index || 0)));
  return m;
}

export async function monetizeAll(db: DB, llm: LLMProvider, opps: Opportunity[], log: { info(m: string): void; warn(m: string, x?: unknown): void }, concurrency = 3) {
  ensureMonetizationTables(db);
  const todo = opps.filter((o) => !db.prepare('SELECT 1 FROM monetization WHERE opp_id=?').get(o.id));
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const o = todo[i++];
      try {
        const m = validateMonetization(parseJsonLoose<Monetization>(await llm.complete({ system: SYSTEM, user: oppBrief(o), json: true, schema: SCHEMA })), o);
        db.prepare('INSERT OR REPLACE INTO monetization(opp_id,model,data,created_at) VALUES(?,?,?,?)').run(o.id, llm.id, JSON.stringify(m), new Date().toISOString());
        log.info(`monetized #${o.id} ${m.monetizable ? m.paths[m.best_path_index]?.model : 'NOT monetizable'}`);
      } catch (e) { log.warn(`monetize #${o.id} failed`, String((e as Error).message).slice(0, 120)); }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ---------- SYNTHESIS: patterns across many opportunities -> PRODUCT / MARKET_GAP / MATCHING opportunities ----------
const SYN_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['insights'],
  properties: { insights: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['type', 'title', 'pattern', 'supporting_opportunity_ids', 'who_pays', 'revenue_model', 'price_point_logic', 'build_effort', 'first_step', 'why_it_might_fail'],
    properties: { type: { type: 'string', enum: ['PRODUCT', 'MARKET_GAP', 'MATCHING', 'DEMAND'] }, title: S, pattern: S,
      supporting_opportunity_ids: { type: 'array', items: { type: 'number' } }, who_pays: S, revenue_model: { type: 'string', enum: REVENUE_MODELS },
      price_point_logic: S, build_effort: { type: 'string', enum: ['S', 'M', 'L'] }, first_step: S, why_it_might_fail: S } } } },
};
const SYN_SYSTEM = `You receive a list of validated, human-reviewed business opportunities found in Israeli public sources, each with its monetization paths.
Find PATTERNS ACROSS opportunities that reveal a bigger opportunity: a PRODUCT or AI agent worth building, a MARKET_GAP, a recurring MATCHING play, or a DEMAND cluster.
Rules: every insight must cite >= 2 supporting_opportunity_ids from the input and only describe what those items show. No invented market sizes or company names.
price_point_logic must show reasoning, labelled as an estimate. why_it_might_fail must be honest (e.g. incumbents such as paid tender-alert services already exist).
Return 3-6 insights, strongest first. Hebrew text.`;

export async function synthesize(db: DB, llm: LLMProvider, items: { id: number; verdict: string; brief: unknown; monetization: unknown }[]) {
  ensureMonetizationTables(db);
  const out = parseJsonLoose<{ insights: { supporting_opportunity_ids: number[] }[] }>(await llm.complete({ system: SYN_SYSTEM, user: JSON.stringify(items), json: true, schema: SYN_SCHEMA }));
  const ids = new Set(items.map((x) => x.id));
  out.insights = out.insights.map((x) => ({ ...x, supporting_opportunity_ids: x.supporting_opportunity_ids.filter((id) => ids.has(id)) }))
    .filter((x) => x.supporting_opportunity_ids.length >= 2); // cited evidence must exist
  db.prepare('INSERT INTO synthesis(model,data,created_at) VALUES(?,?,?)').run(llm.id, JSON.stringify(out), new Date().toISOString());
  return out;
}
