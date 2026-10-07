import { norm } from './taxonomy.js';

const SUFFIX = /\s*(בע"מ|בעמ|בע''מ|ltd\.?|inc\.?|corp\.?|חברה|קבוצת|קבוצה|רשת)\s*/gi;
export function normEntity(e: string): string {
  return norm(e).replace(SUFFIX, ' ').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
}
const STOP = new Set(['של', 'את', 'על', 'עם', 'חדש', 'חדשה', 'the', 'a', 'in', 'of']);
export const tokens = (s: string) => new Set(normEntity(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t)));
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let i = 0; for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i);
}
/** Entity resolution: equal after normalisation, or one name contained in the other, or high token overlap. */
export function sameEntity(a: string, b: string): boolean {
  const na = normEntity(a), nb = normEntity(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (Math.min(na.length, nb.length) >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  return jaccard(tokens(a), tokens(b)) >= 0.6;
}
export const dedupeKey = (entity: string, type: string, loc: string | null) => `${type}|${normEntity(entity)}|${loc ?? ''}`;
