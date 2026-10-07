import type { Extraction, NeedExtractor, RawSignal, LLMProvider, EventType, PredictedNeed } from '../types.js';
import { parseJsonLoose } from '../providers/llm.js';
import { CATEGORIES, CAT } from './taxonomy.js';

/** Normalisation used on BOTH sides of every verbatim check: whitespace, quote marks, dashes. */
export const flatForMatch = (s: string) => s.replace(/[״“”„"]/g, '"').replace(/[׳‘’`´']/g, "'").replace(/[–—־]/g, '-').replace(/\s+/g, ' ').trim();
export const isVerbatim = (quote: string | undefined | null, source: string) => !!quote && quote.trim().length >= 8 && flatForMatch(source).includes(flatForMatch(quote));

const EVENT_TYPES: EventType[] = ['TENDER_PUBLISHED', 'EXPLICIT_REQUEST', 'NEW_LOCATION', 'FUNDING_ROUND', 'HIRING_SURGE', 'NEW_COMPANY', 'PRODUCT_LAUNCH',
  'EXPANSION', 'MERGER_ACQUISITION', 'CONSTRUCTION_PROJECT', 'PERMIT_OR_OCCUPANCY', 'CONTRACT_WIN', 'EVENT_CONFERENCE', 'REBRAND', 'OTHER_EVENT'];


const S = { type: 'string' }, N = { type: 'number' }, NS = { type: ['string', 'null'] };
/** JSON Schema passed to the model as structured output (no hand-written JSON to break). */
export const EXTRACTION_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['is_business_event', 'event_type', 'entity', 'event_summary', 'explicit_needs', 'predicted_needs', 'commercial_actions', 'evidence_quotes', 'deadline', 'location', 'confidence', 'reject_reason'],
  properties: {
    is_business_event: { type: 'boolean' }, event_type: { type: 'string', enum: EVENT_TYPES }, entity: S, event_summary: S,
    explicit_needs: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['need', 'category', 'quote'], properties: { need: S, category: { type: 'string', enum: CATEGORIES.map((c) => c.key) }, quote: S } } },
    predicted_needs: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['need', 'category', 'reason', 'confidence', 'quote'], properties: { need: S, category: { type: 'string', enum: CATEGORIES.map((c) => c.key) }, reason: S, confidence: N, quote: S } } },
    commercial_actions: { type: 'array', items: S }, evidence_quotes: { type: 'array', items: S }, deadline: NS, location: NS, confidence: N, reject_reason: NS,
  },
};

const SYSTEM = `You are the validation + extraction step of "Need Engine". Input: ONE public item from an Israeli source (Hebrew or English).
Decide whether it is a real BUSINESS EVENT and which commercial NEEDS follow from it. Output ONLY one JSON object, no prose:
{"is_business_event":bool,"event_type":"<one of ${EVENT_TYPES.join('|')}>","entity":"<who; copied exactly as written in the item>","event_summary":"<one Hebrew sentence, facts from the item only>",
"explicit_needs":[{"need":"<Hebrew>","category":"<key>","quote":"<verbatim>"}],
"predicted_needs":[{"need":"<Hebrew>","category":"<key>","reason":"<how it follows from THIS event>","confidence":0.0,"quote":"<verbatim sentence describing the event>"}],
"commercial_actions":["<Hebrew: concrete thing a vendor can do now>"],"evidence_quotes":["<verbatim>"],"deadline":"<YYYY-MM-DD or null>","location":"<city as written or null>","confidence":0.0,"reject_reason":null}

DEFINITIONS
- EXPLICIT need: the body itself says it is seeking / buying / ordering / inviting offers or proposals for something (tender, RFQ, RFP, call for proposals to suppliers, "מבקשת הצעות", "דרוש ספק").
- PREDICTIVE need: an event happened (opening, permit, occupancy, funding, expansion, win...) from which a purchase need of THAT entity can be reasoned. Include only if confidence >= 0.5 and the reason is specific to this event.

STRICT RULES
- Use only facts in the item. Never invent names, amounts, dates or places.
- Every "quote" and every evidence_quotes entry MUST be copied character-for-character from the item (max ~200 chars). If you cannot quote it, do not claim it.
- "deadline" only if a submission/response deadline is written in the item; otherwise null.
- NOT explicit needs: tenders that are awarded/closed/cancelled; civil-service or staff job tenders (מכרז כ"א / משרות); the body SELLING or leasing out its own assets/land (it is selling, not buying); grants paid TO the public. Put the reason in reject_reason and leave explicit_needs empty.
- An auction, an opinion piece, market/stock movement, crime, politics, gossip => is_business_event false (or no needs) with reject_reason.
- category keys (choose by meaning, not by a word that happens to appear, e.g. "נוסח לפרסום" in a file name is not advertising): ${CATEGORIES.map((c) => `${c.key}=${c.he}`).join('; ')}
- If there is no explicit and no predicted need: return empty arrays and a reject_reason.
- "confidence" (0..1) is your own confidence that this is a real, current, actionable opportunity. It is a model score, not a statistic.`;

export const decode = (s: string) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const clamp01 = (n: unknown) => Math.max(0, Math.min(1, Number(n) || 0));
const addDays = (iso: string | null, d: number) => new Date((iso ? +new Date(iso) : Date.now()) + d * 864e5).toISOString();

/** Deadline accepted only if its day+month also appear as numbers in the source (no invented dates). */
function verifiedDeadline(d: unknown, source: string): string | null {
  const m = String(d ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, y, mo, da] = m.map(Number) as unknown as number[];
  const re = new RegExp(`(^|\\D)0?${da}[./-]0?${mo}([./-](${y}|${String(y).slice(2)}))?(\\D|$)`);
  return re.test(source) ? new Date(Date.UTC(y, mo - 1, da, 23, 59)).toISOString() : null;
}

interface LlmOut {
  is_business_event?: boolean; event_type?: string; entity?: string; event_summary?: string;
  explicit_needs?: { need: string; category: string; quote: string }[];
  predicted_needs?: { need: string; category: string; reason: string; confidence: number; quote: string }[];
  commercial_actions?: string[]; evidence_quotes?: string[]; deadline?: string | null; location?: string | null;
  confidence?: number; reject_reason?: string | null;
}

export class LLMNeedExtractorV2 implements NeedExtractor {
  constructor(private llm: LLMProvider) {}
  get id() { return `llm-v2:${this.llm.id}`; }

  async extract(raw: RawSignal): Promise<Extraction> {
    const title = decode(raw.title), text = decode(raw.text);
    const source = `${title}. ${text}`;
    const user = `source: ${raw.source}\npublished_at: ${raw.published_at ?? 'unknown'}\nurl: ${raw.source_url}\n${raw.entity_hint ? `publisher/buyer (structured field): ${raw.entity_hint}\n` : ''}title: ${title}\ntext: ${text.slice(0, 3500)}`;
    let out: LlmOut;
    try { out = parseJsonLoose<LlmOut>(await this.llm.complete({ system: SYSTEM, user, json: true, schema: EXTRACTION_SCHEMA })); }
    catch {
      try { out = parseJsonLoose<LlmOut>(await this.llm.complete({ system: SYSTEM, user: `${user}

Return strictly valid JSON (escape every " inside strings as \\").`, json: true, schema: EXTRACTION_SCHEMA })); }
      catch (e) { return { is_opportunity: false, reject_reason: `llm_error:${(e as Error).message.slice(0, 80)}` }; }
    }

    const dropped: string[] = [];
    if (!out.is_business_event) return { is_opportunity: false, reject_reason: `llm:not_business_event:${out.reject_reason ?? ''}`.slice(0, 160) };
    const explicit = (out.explicit_needs ?? []).filter((n) => { const ok = isVerbatim(n.quote, source); if (!ok) dropped.push(`explicit_quote_not_verbatim:${n.need}`); return ok; })
      .map((n) => ({ need: n.need, category: CAT[n.category] ? n.category : 'other', quote: n.quote }));
    const predOk = (out.predicted_needs ?? []).filter((n) => {
      const ok = isVerbatim(n.quote, source) && clamp01(n.confidence) >= 0.5 && !!n.reason;
      if (!ok) dropped.push(`predicted_rejected:${n.need}`); return ok;
    });
    const predicted: PredictedNeed[] = predOk.map((n) => ({ need: n.need, category: CAT[n.category] ? n.category : 'other', confidence: +clamp01(n.confidence).toFixed(2), rationale: `${n.reason} | ציטוט: "${n.quote}"` }));
    const quotes = (out.evidence_quotes ?? []).filter((q) => isVerbatim(q, source));
    if (!explicit.length && !predicted.length) return { is_opportunity: false, reject_reason: `llm:no_need:${out.reject_reason ?? dropped.join(',')}`.slice(0, 160) };
    const entity = (out.entity ?? '').trim();
    if (!entity || !(flatForMatch(source).includes(flatForMatch(entity)) || (raw.entity_hint && flatForMatch(raw.entity_hint).includes(flatForMatch(entity)))))
      return { is_opportunity: false, reject_reason: `entity_not_in_source:${entity.slice(0, 40)}` };
    const type = (EVENT_TYPES as string[]).includes(out.event_type ?? '') ? out.event_type as EventType : 'OTHER_EVENT';
    const deadline = verifiedDeadline(out.deadline, source);
    const conf = clamp01(out.confidence);
    const maxPred = Math.max(0, ...predicted.map((p) => p.confidence));
    return {
      is_opportunity: true, entity, event_type: type, what_happened: out.event_summary || title,
      explicit_need: explicit[0] ?? null, explicit_needs: explicit, predicted_needs: predicted,
      category: explicit[0]?.category ?? [...predicted].sort((a, b) => b.confidence - a.confidence)[0]?.category ?? 'other',
      location: out.location && source.includes(out.location) ? out.location : null,
      // model scores, not statistics: intent is higher when the body states the need itself
      intent_score: Math.round(explicit.length ? 90 : maxPred * 70), confidence_score: Math.round(conf * 100),
      estimated_value: null, urgency: deadline && +new Date(deadline) - Date.now() < 14 * 864e5 ? 'high' : explicit.length ? 'medium' : 'low',
      evidence_quote: explicit[0]?.quote ?? quotes[0] ?? predOk[0]?.quote,
      evidence_quotes: quotes, commercial_actions: (out.commercial_actions ?? []).slice(0, 5),
      deadline_at: deadline, expires_at: deadline ?? addDays(raw.published_at, explicit.length ? 30 : 60), llm_dropped: dropped,
    };
  }
}
