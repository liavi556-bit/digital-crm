import type { SourceConnector, RawSignal, ConnectorContext } from '../types.js';

const BASE = 'https://data.gov.il/api/3/action';
interface CkanPkg { title: string; name: string; metadata_modified?: string; resources: { id: string; name?: string; format?: string; datastore_active?: boolean }[] }

/**
 * data.gov.il (CKAN) connector. We do NOT hard-code resource ids (unverified from the build sandbox):
 * we discover datasets by query, then read the newest rows of datastore-active resources.
 * Each row becomes a RawSignal whose text is "field: value" pairs, so provenance stays intact.
 */
export class CkanConnector implements SourceConnector {
  sourceType = 'ckan';
  constructor(private query: string, private maxResources = 3, private rowsPerResource = 50) {}
  get id() { return `ckan:${this.query}`; }

  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const search = await ctx.http.getJson<{ result: { results: CkanPkg[] } }>(`${BASE}/package_search?q=${encodeURIComponent(this.query)}&rows=5&sort=metadata_modified+desc`);
    const out: RawSignal[] = [];
    const now = new Date().toISOString();
    let used = 0;
    for (const pkg of search.result.results) {
      for (const res of pkg.resources.filter((r) => r.datastore_active)) {
        if (used++ >= this.maxResources) return out;
        try {
          const data = await ctx.http.getJson<{ result: { records: Record<string, unknown>[] } }>(
            `${BASE}/datastore_search?resource_id=${res.id}&limit=${this.rowsPerResource}&sort=_id+desc`);
          for (const rec of data.result.records) {
            const entries = Object.entries(rec).filter(([k, v]) => k !== '_id' && v !== null && v !== '');
            const dateKey = entries.find(([k]) => /date|תאריך|פרסום/i.test(k));
            const nameKey = entries.find(([k]) => /(שם|name|גוף|מזמין|entity|publisher)/i.test(k));
            const d = dateKey ? new Date(String(dateKey[1])) : null;
            const title = String(entries.find(([k]) => /(נושא|title|subject|תיאור|מכרז)/i.test(k))?.[1] ?? nameKey?.[1] ?? `${pkg.title} #${rec._id}`);
            out.push({
              source: `data.gov.il: ${pkg.title}`, source_type: 'ckan',
              source_url: `https://data.gov.il/dataset/${pkg.name}#row-${res.id}-${rec._id}`,
              title, text: entries.map(([k, v]) => `${k}: ${v}`).join('. '),
              published_at: d && !isNaN(+d) ? d.toISOString() : (pkg.metadata_modified ? new Date(pkg.metadata_modified).toISOString() : null),
              fetched_at: now, entity_hint: nameKey ? String(nameKey[1]) : null, location_hint: null,
              raw_metadata: { package: pkg.name, resource_id: res.id, record: rec },
            });
          }
        } catch (e) { ctx.log.warn('ckan resource failed', { res: res.id, err: String((e as Error).message) }); }
      }
    }
    return out;
  }
}
