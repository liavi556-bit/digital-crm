/**
 * CHEAP RETRIEVAL FILTER (runs before the LLM to control cost).
 * Keywords here decide only "is this worth an LLM call?" — never the event type, need or category.
 * Hebrew words are matched as whole words with optional one/two-letter prefixes (ו/ה/ב/ל/מ/ש/כ), so "המכרזנית" ≠ "מכרז".
 */
const P = '(?<![א-ת])[והבלמשכ]{0,2}';
const E = '(?![א-ת])';
const w = (stem: string, suffixes = '') => new RegExp(`${P}${stem}${suffixes ? `(?:${suffixes})?` : ''}${E}`);
export const CANDIDATE_PATTERNS: RegExp[] = [
  // explicit asks
  w('מכרז', 'ים|י|ה|ו'), w('קול(?:ות)? קורא(?:ים)?'), w('הצעות? מחיר'), w('בקשה להצעות'), w('הזמנה להציע'), w('הליך תחרותי'),
  w('התקשרות', 'ה'), w('דרוש', 'ה|ים|ות'), w('מחפש', 'ת|ים|ות'), w('ספק', 'ים|ית'), w('יועץ', 'ים|ת'), w('פתרון', 'ות'),
  /\b(rfp|rfq|rfi|tender|request for proposals?)\b/i,
  // business events (retrieval only)
  w('פרויקט', 'ים'), w('פתיחת'), w('נפתח', 'ה|ו'), w('סניף', 'ים'), w('גייס', 'ה|ו'), w('גיוס'), w('השקעה'), w('רכישת'), w('רוכשת'), w('מיזוג'),
  w('היתר', 'י'), w('אכלוס'), /טופס 4/, w('הקמת'), w('מקימ', 'ה|ים'), w('הרחבת'), w('מרחיב', 'ה|ים'), w('זכה', ''), w('זכתה'), w('זכייה'), w('נבחר', 'ה|ו'),
  w('מפעל', 'ים'), w('כנס', 'ים'), w('תערוכה'), w('משרדים'), w('חנות'), w('מרכז'),
  /\b(raised|funding|series [a-d]|acquire[sd]?|acquisition|opens?|launch(?:es|ed)?|expands?|contract|wins?)\b/i,
];
export function candidateHit(text: string): string | null {
  for (const re of CANDIDATE_PATTERNS) { const m = re.exec(text); if (m) return m[0].trim(); }
  return null;
}
