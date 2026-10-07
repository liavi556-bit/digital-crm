import { XMLParser } from 'fast-xml-parser';
import type { SourceConnector, RawSignal, ConnectorContext } from '../types.js';
import { stripHtml } from '../providers/search.js';

const xml = new XMLParser({ ignoreAttributes: false, textNodeName: '#text' });

export interface FeedDef { name: string; url: string; note?: string }

/** Generic RSS/Atom connector. One instance per feed so failures are isolated and counted per source. */
export class RssConnector implements SourceConnector {
  sourceType = 'rss';
  constructor(private def: FeedDef) {}
  get id() { return `rss:${this.def.name}`; }

  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const body = await ctx.http.getText(this.def.url);
    const doc = xml.parse(body);
    const items = [doc?.rss?.channel?.item ?? doc?.feed?.entry ?? []].flat();
    const now = new Date().toISOString();
    return items.map((it: any): RawSignal => {
      const link = typeof it.link === 'object' ? it.link?.['@_href'] ?? '' : String(it.link ?? it.guid?.['#text'] ?? it.guid ?? '');
      const date = it.pubDate ?? it.published ?? it.updated ?? it['dc:date'];
      const d = date ? new Date(date) : null;
      return {
        source: this.def.name, source_type: 'rss', source_url: link,
        title: stripHtml(String(it.title?.['#text'] ?? it.title ?? '')),
        text: stripHtml(String(it.description ?? it.summary?.['#text'] ?? it.summary ?? it['content:encoded'] ?? '')),
        published_at: d && !isNaN(+d) ? d.toISOString() : null,
        fetched_at: now, entity_hint: null, location_hint: null,
        raw_metadata: { feed: this.def.url, categories: it.category ?? null },
      };
    }).filter((r) => r.source_url && r.title);
  }
}
