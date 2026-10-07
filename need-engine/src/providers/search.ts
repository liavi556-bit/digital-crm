import { XMLParser } from 'fast-xml-parser';
import type { SearchProvider, SearchHit, ConnectorContext } from '../types.js';

const xml = new XMLParser({ ignoreAttributes: false, textNodeName: '#text' });
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/**
 * Discovery layer ONLY: Google News publishes public RSS search feeds. We keep title/link/snippet/publisher
 * as pointers (provenance), we do not copy article bodies.
 */
export class GoogleNewsRssSearch implements SearchProvider {
  id = 'google-news-rss';
  async search(query: string, ctx: ConnectorContext): Promise<SearchHit[]> {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:30d')}&hl=he&gl=IL&ceid=IL:he`;
    const body = await ctx.http.getText(url);
    const items = [xml.parse(body)?.rss?.channel?.item ?? []].flat();
    return items.map((it: any): SearchHit => ({
      title: String(it.title ?? ''),
      url: String(it.link ?? ''),
      snippet: stripHtml(String(it.description ?? '')),
      source: it.source?.['#text'] ?? null,
      published_at: it.pubDate ? new Date(it.pubDate).toISOString() : null,
    }));
  }
}

export { stripHtml };
