import type { SourceConnector, RawSignal, ConnectorContext, SearchProvider } from '../types.js';

/** Hebrew discovery queries targeting business events that imply needs. */
export const DISCOVERY_QUERIES = [
  'פתיחת סניף חדש', 'נפתח סניף חדש', 'חנות חדשה נפתחה', 'משרדים חדשים עברה חברה',
  'גיוס הון סבב השקעה חברה ישראלית', 'מכרז פורסם רשות מקומית', 'קול קורא פורסם',
  'מפעל חדש הנחת אבן פינה', 'רכישת חברה הושלמה', 'השקת מוצר חדש חברה', 'מרכז לוגיסטי חדש', 'פרויקט חדש מסירת מפתחות',
];

/** SearchProvider-backed discovery connector (one per query for isolation + per-source stats). */
export class SearchDiscoveryConnector implements SourceConnector {
  sourceType = 'search';
  constructor(private provider: SearchProvider, private query: string) {}
  get id() { return `search:${this.provider.id}:${this.query}`; }
  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const hits = await this.provider.search(this.query, ctx);
    const now = new Date().toISOString();
    return hits.map((h): RawSignal => ({
      source: h.source ? `${h.source} (via ${this.provider.id})` : this.provider.id,
      source_type: 'search', source_url: h.url, title: h.title, text: h.snippet || h.title,
      published_at: h.published_at, fetched_at: now, entity_hint: null, location_hint: null,
      raw_metadata: { discovery_query: this.query, publisher: h.source },
    }));
  }
}
