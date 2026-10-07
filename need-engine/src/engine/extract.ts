import type { Extraction, NeedExtractor, RawSignal, LLMProvider, EventType, PredictedNeed } from '../types.js';
import { parseJsonLoose } from '../providers/llm.js';
import { CATEGORIES, CAT, PLAYBOOKS, detectCategories, detectLocation, norm } from './taxonomy.js';

const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(n)));
const addDays = (iso: string | null, d: number) => new Date((iso ? +new Date(iso) : Date.now()) + d * 864e5).toISOString();

/** Sentence containing the first match — guarantees evidence is a verbatim substring of the source. */
function sentenceAround(text: string, idx: number): string {
  const start = Math.max(text.lastIndexOf('.', idx - 1), text.lastIndexOf('\n', idx - 1)) + 1;
  let end = text.indexOf('.', idx); if (end < 0) end = text.length; else end += 1;
  return text.slice(start, Math.min(end, start + 300)).trim();
}

const VERBS = 'פותחת|פותח|תפתח|יפתח|מגייסת|מגייס|גייסה|גייס|רוכשת|רכשה|משיקה|משיק|השיקה|הודיעה|הודיע|מרחיבה|מרחיב|מקימה|תקים|נבחרה|מפרסמת|פרסמה|פרסם|מתכננת|עוברת|מעבירה|מוכרת|חונכת|תחנוך|חנכה|חתמה|פתחה|מסרה|מסר|תמסור|מוסרת|רכש|משיקים|פותחים|מגייסים|גייסו|הודיעו|חונך|נחנך|תשיק|ישיק|מקים|הקימה|מציעה|מפרסם|מזמינה|מבקשת|מבקש|יוצאת|יוצא|מכריזה|מכריז|עוברת|עובר';
export function guessEntity(title: string): string | null {
  const t = title.replace(/^[\s"'“”]+/, '').split(/\s[-–|:]\s/)[0];
  const m = t.match(new RegExp(`^(.{2,45}?)\\s+(?:${VERBS})(?=\\s|$)`));
  if (m) return m[1].replace(/[,"״']+$/, '').trim();
  const m2 = title.match(/(?:של|מטעם|עבור)\s+((?:[א-תA-Z][^\s,.:;]*\s?){1,4})/);
  return m2 ? m2[1].trim() : null;
}

const moneyRe = /(?:בהיקף|בשווי|בסך|היקף)(?: של| כולל)?\s*(?:כ-?|כ)?\s*([\d.,]+)\s*(מיליון|אלף|מיליארד)?\s*(?:₪|ש"ח|ש״ח|שקלים|שקל|דולר|\$)/;
function statedValue(text: string): { amount_ils: number; basis: 'stated' } | null {
  const m = text.match(moneyRe); if (!m) return null;
  let n = Number(m[1].replace(/,/g, '')); if (!isFinite(n)) return null;
  if (m[2] === 'מיליון') n *= 1e6; else if (m[2] === 'אלף') n *= 1e3; else if (m[2] === 'מיליארד') n *= 1e9;
  if (/דולר|\$/.test(m[0])) n *= 3.7; // coarse FX; marker 'stated' means amount was in the source
  return { amount_ils: Math.round(n), basis: 'stated' };
}
export function findDeadline(text: string): string | null {
  const m = text.match(/(?:עד|מועד אחרון[^\d]{0,25}|הגשה[^\d]{0,25})\s*(?:ה-?)?(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (!m) return null;
  const y = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[1])));
  return isNaN(+d) ? null : d.toISOString();
}
const EXPLICIT_ASK = /(מחפש(?:ת|ים)? (?:ספק|קבלן|חברה|פתרון)|מבקש(?:ת)? הצעות|דרוש(?:ה|ים)? (?:ספק|קבלן)|מעוניין(?:ת)? לקבל הצעות)/;

/** Offline, deterministic extractor: playbook regexes + taxonomy. Same output contract as the LLM extractor. */
export class RuleBasedExtractor implements NeedExtractor {
  id = 'rules-v1';
  async extract(raw: RawSignal): Promise<Extraction> {
    const full = `${raw.title}. ${raw.text}`.replace(/\s+/g, ' ');
    const n = norm(full);
    let best: { pb: (typeof PLAYBOOKS)[number]; idx: number; hits: number } | null = null;
    for (const pb of PLAYBOOKS) {
      const hits = pb.patterns.map((p) => p.exec(n)).filter(Boolean) as RegExpExecArray[];
      if (hits.length && (!best || hits.length > best.hits || (pb.type === 'TENDER_PUBLISHED' && hits.length === best.hits))) best = { pb, idx: Math.min(...hits.map((h) => h.index)), hits: hits.length };
    }
    const ask = EXPLICIT_ASK.exec(n);
    if (!best && !ask) return { is_opportunity: false, reject_reason: 'no_event_pattern' };
    const type: EventType = best?.pb.type ?? 'EXPLICIT_REQUEST';
    const pb = best?.pb;

    const entity = raw.entity_hint?.trim() || guessEntity(raw.title);
    if (!entity) return { is_opportunity: false, reject_reason: 'entity_unresolved' };
    const quote = sentenceAround(full, ask && !best ? ask.index : best!.idx);
    if (!full.includes(quote) || quote.length < 15) return { is_opportunity: false, reject_reason: 'evidence_too_short' };

    const location = raw.location_hint || detectLocation(full);
    // For tenders/requests the subject is the tender NAME; attachment file names ("נוסח לפרסום") must not set the category
    const explicitKind = type === 'TENDER_PUBLISHED' || type === 'EXPLICIT_REQUEST';
    const titleCats = explicitKind ? detectCategories(raw.title) : [];
    const cats = titleCats.length ? titleCats : detectCategories(explicitKind ? raw.title : full);
    let explicit: Extraction['explicit_need'] = null;
    let predicted: PredictedNeed[] = [];
    if (type === 'TENDER_PUBLISHED' || type === 'EXPLICIT_REQUEST') {
      const c = cats[0] ?? 'other';
      explicit = { need: `${type === 'TENDER_PUBLISHED' ? 'מכרז/קול קורא' : 'בקשה לספק'}: ${CAT[c].he}`, category: c, quote };
      predicted = cats.slice(1, 4).map((k) => ({ need: CAT[k].he, category: k, confidence: 0.5, rationale: 'נושא נוסף שמוזכר בטקסט המקור' }));
    } else {
      predicted = pb!.needs.map((x) => ({ ...x, confidence: x.confidence * (cats.includes(x.category) ? 1.05 : 1) })).map((x) => ({ ...x, confidence: Math.min(0.97, +x.confidence.toFixed(2)) }));
      if (ask) { const c = cats[0] ?? 'other'; explicit = { need: `בקשה לספק: ${CAT[c].he}`, category: c, quote: sentenceAround(full, ask.index) }; }
    }
    const official = ['ckan', 'gov'].includes(raw.source_type);
    const conf = clamp(((pb?.base_confidence ?? 0.7) + (entity ? 0.08 : 0) + (location ? 0.04 : 0) + (official ? 0.08 : 0) + (best && best.hits > 1 ? 0.04 : 0)) * 100, 20, 95);
    const dl = findDeadline(full);
    const expires = dl ?? addDays(raw.published_at, pb?.horizon_days ?? 30);
    const daysToExpiry = (+new Date(expires) - Date.now()) / 864e5;
    return {
      is_opportunity: true, entity, event_type: type, what_happened: raw.title,
      explicit_need: explicit, predicted_needs: predicted,
      category: explicit?.category ?? predicted.sort((a, b) => b.confidence - a.confidence)[0]?.category ?? 'other',
      location, intent_score: clamp(pb?.intent ?? 80 + (explicit ? 10 : 0)), confidence_score: conf,
      estimated_value: statedValue(full), evidence_quote: quote, expires_at: expires,
      urgency: type === 'TENDER_PUBLISHED' ? (daysToExpiry < 14 ? 'high' : 'medium') : type === 'NEW_LOCATION' || type === 'CONSTRUCTION_PROJECT' ? 'high' : 'medium',
    };
  }
}

const SYSTEM = `You are the Signal Engine of "Need Engine". You receive ONE public item (title+text). Decide whether it reveals a business NEED/OPPORTUNITY for a service provider.
STRICT RULES:
- Use ONLY facts present in the item. Never invent entities, places, dates, amounts.
- "evidence_quote" MUST be copied verbatim from the item text.
- explicit_need: only if the item literally states a need/tender/request. Otherwise null.
- predicted_needs: needs that plausibly FOLLOW from the event. confidence is YOUR confidence 0..1 (not a statistic).
- estimated_value: only if an amount is stated in the item, else null.
- category/needs categories must be keys from: ${CATEGORIES.map((c) => c.key).join(', ')}
- event_type one of: NEW_LOCATION, FUNDING_ROUND, TENDER_PUBLISHED, HIRING_SURGE, NEW_COMPANY, PRODUCT_LAUNCH, EXPANSION, MERGER_ACQUISITION, CONSTRUCTION_PROJECT, REBRAND, EXPLICIT_REQUEST
- If not an opportunity: {"is_opportunity":false,"reject_reason":"..."}.
Return ONLY JSON: {"is_opportunity":bool,"reject_reason":str?,"entity":str,"event_type":str,"what_happened":str,"explicit_need":{"need":str,"category":str,"quote":str}|null,"predicted_needs":[{"need":str,"category":str,"confidence":0..1,"rationale":str}],"category":str,"location":str|null,"intent_score":0..100,"confidence_score":0..100,"estimated_value":{"amount_ils":num,"basis":"stated"}|null,"urgency":"low|medium|high","evidence_quote":str,"expires_at":ISO|null}`;

export class LLMExtractor implements NeedExtractor {
  constructor(private llm: LLMProvider, private fallback = new RuleBasedExtractor()) {}
  get id() { return `llm:${this.llm.id}`; }
  async extract(raw: RawSignal): Promise<Extraction> {
    const user = `source: ${raw.source}\npublished_at: ${raw.published_at}\nurl: ${raw.source_url}\ntitle: ${raw.title}\ntext: ${raw.text.slice(0, 3500)}`;
    try {
      const out = parseJsonLoose<Extraction>(await this.llm.complete({ system: SYSTEM, user, json: true }));
      // keep rule-based facts (deadline/value) only if LLM omitted them; never trust unchecked fields
      if (out.is_opportunity) {
        out.predicted_needs = (out.predicted_needs ?? []).filter((p) => CAT[p.category]).map((p) => ({ ...p, confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0)) }));
        if (out.explicit_need && !CAT[out.explicit_need.category]) out.explicit_need.category = 'other';
      }
      return out;
    } catch (e) {
      const r = await this.fallback.extract(raw);
      return { ...r, reject_reason: r.reject_reason ?? undefined, ...(r.is_opportunity ? {} : { reject_reason: `${r.reject_reason}|llm_error:${(e as Error).message.slice(0, 80)}` }) };
    }
  }
}
