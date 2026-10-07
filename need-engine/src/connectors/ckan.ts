import type { SourceConnector, RawSignal, ConnectorContext } from '../types.js';
import { stripHtml } from '../providers/search.js';

const BASE = 'https://data.gov.il/api/3/action';
interface CkanPkg { title: string; name: string; metadata_modified?: string; organization?: { title?: string } | null; resources: { id: string; name?: string; format?: string; datastore_active?: boolean; last_modified?: string | null; created?: string | null }[] }

/** Israeli open-data dates are dd.mm.yyyy or dd/mm/yyyy (optionally with a time). `new Date()` misreads them as mm/dd. */
export function parseIlDate(v: unknown): Date | null {
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0));
    return isNaN(+d) || +m[2] > 12 || +m[1] > 31 ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const d = new Date(s); return isNaN(+d) ? null : d; }
  return null; // anything else (e.g. a publication *number*) is not a date
}

// Column preference lists. Order matters: first existing column wins.
const PUBLISH_KEYS = [/^תאריך פרסום$/, /פרסום/, /^תאריך עדכון$/, /עדכון/, /publish|created/i];
const NOT_PUBLISH_DATE = /(אחרון|הגשה|סיום|תחילת|השגות|deadline)/;
const TITLE_KEYS = [/^שם הליך$/, /^שם מכרז$/, /^title$/i, /^subject$/i, /תיאור/, /נושא/];
const ENTITY_KEYS = [/^שם המשרד$/, /גוף מפרסם|יחידה מפרסמת|מזמין|publisher/i];
const pick = <V,>(entries: [string, V][], keys: RegExp[], exclude?: RegExp) => {
  for (const k of keys) { const e = entries.find(([name]) => k.test(name) && !(exclude && exclude.test(name))); if (e) return e; }
  return undefined;
};
const clean = (v: unknown) => stripHtml(String(v)).replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/**
 * data.gov.il (CKAN) connector. We do NOT hard-code resource ids: we discover datasets by query,
 * then read rows of datastore-active resources. Each row becomes a RawSignal whose text is "field: value"
 * pairs, so provenance stays intact.
 */
export class CkanConnector implements SourceConnector {
  sourceType = 'ckan';
  constructor(private query: string, private maxResourcesPerPkg = 1, private rowsPerEnd = 100) {}
  get id() { return `ckan:${this.query}`; }

  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const search = await ctx.http.getJson<{ result: { results: CkanPkg[] } }>(`${BASE}/package_search?q=${encodeURIComponent(this.query)}&rows=5&sort=metadata_modified+desc`);
    const out: RawSignal[] = [];
    const now = new Date().toISOString();
    for (const pkg of search.result.results) {
      // budget is per package: an irrelevant first hit must not starve the others
      for (const res of pkg.resources.filter((r) => r.datastore_active).slice(0, this.maxResourcesPerPkg)) {
        try {
          // _id order is dataset-specific (newest-first in some, oldest-first in others): read both ends
          const seen = new Set<unknown>();
          const records: Record<string, unknown>[] = [];
          for (const dir of ['desc', 'asc']) {
            const data = await ctx.http.getJson<{ result: { records: Record<string, unknown>[] } }>(
              `${BASE}/datastore_search?resource_id=${res.id}&limit=${this.rowsPerEnd}&sort=_id+${dir}`);
            for (const r of data.result.records) if (!seen.has(r._id)) { seen.add(r._id); records.push(r); }
          }
          for (const rec of records) {
            const entries = Object.entries(rec).filter(([k, v]) => k !== '_id' && v !== null && v !== '').map(([k, v]) => [k, clean(v)] as [string, string]);
            const dateE = pick(entries.filter(([k]) => /date|תאריך|פרסום|עדכון/i.test(k)), PUBLISH_KEYS, NOT_PUBLISH_DATE);
            const rowDate = dateE ? parseIlDate(dateE[1]) : null;
            // Row has no usable date: the resource file's own upload time is an UPPER BOUND on the row's age
            // (a row cannot be newer than the file containing it). If even that is old, the row is certainly stale.
            const fileTs = res.last_modified ?? res.created;
            const fileDate = fileTs ? new Date(fileTs.endsWith('Z') ? fileTs : `${fileTs}Z`) : null;
            const d = rowDate ?? (fileDate && !isNaN(+fileDate) ? fileDate : null);
            const entity = pick(entries, ENTITY_KEYS)?.[1] ?? pkg.organization?.title ?? null;
            const title = pick(entries, TITLE_KEYS)?.[1] ?? `${pkg.title} #${rec._id}`;
            const link = entries.find(([k, v]) => /^(url|link|קישור)$/i.test(k) && /^https?:\/\//.test(v))?.[1];
            out.push({
              source: `data.gov.il: ${pkg.title}`, source_type: 'ckan',
              source_url: link ?? `https://data.gov.il/dataset/${pkg.name}#row-${res.id}-${rec._id}`,
              title, text: entries.map(([k, v]) => `${k}: ${v}`).join('. '),
              // never metadata_modified: a catalogue refresh says nothing about a row's age
              published_at: d ? d.toISOString() : null,
              fetched_at: now, entity_hint: entity, location_hint: null,
              raw_metadata: { package: pkg.name, resource_id: res.id, row_id: rec._id, date_field: rowDate ? dateE![0] : null, date_basis: rowDate ? 'row' : d ? 'resource_last_modified(upper bound)' : 'none', dataset_url: `https://data.gov.il/dataset/${pkg.name}`, record: rec },
            });
          }
        } catch (e) { ctx.log.warn('ckan resource failed', { res: res.id, err: String((e as Error).message) }); }
      }
    }
    return out;
  }
}
