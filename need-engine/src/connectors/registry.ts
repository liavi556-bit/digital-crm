import type { SourceConnector, SearchProvider } from '../types.js';
import { RssConnector, type FeedDef } from './rss.js';
import { CkanConnector } from './ckan.js';
import { SearchDiscoveryConnector, DISCOVERY_QUERIES } from './search.js';
import { FixtureConnector } from './fixture.js';
import { GoogleNewsRssSearch } from '../providers/search.js';
import { config } from '../config.js';

/** Verified 2026-10-07 from an open network (see docs/SOURCES.md for status, robots and ToS notes). */
export const FEEDS: FeedDef[] = [
  { name: 'Globes - startups', url: 'https://www.globes.co.il/WebService/Rss/RssFeeder.asmx/FeederKeyword?iID=1397', note: '200 OK; content is ENGLISH (Globes English) - Hebrew rules extractor gets ~0 recall here' },
  { name: 'Globes - news', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=2', note: '200 OK, home page feed' },
  { name: 'Globes - real estate & infrastructure', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=607', note: '200 OK' },
  { name: 'Globes - Israel', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=9917', note: '200 OK' },
  { name: 'ice - business', url: 'https://www.ice.co.il/rss', note: '200 OK; robots Allow: /; mostly media/business gossip' },
  { name: 'Calcalist - news', url: 'https://www.calcalist.co.il/GeneralRSS/0,16335,L-8,00.xml', note: 'HTTP 404 on 2026-10-07; no current official RSS URL found. Kept to show graceful failure' },
];
export const CKAN_QUERIES = ['מכרזים', 'קול קורא', 'תאגידים חדשים', 'היתרי בנייה'];

export function createSearchProvider(): SearchProvider | null {
  return config.searchProvider === 'google-news-rss' ? new GoogleNewsRssSearch() : null;
}
export function buildConnectors(enabled = config.connectors): SourceConnector[] {
  const out: SourceConnector[] = [];
  if (enabled.includes('rss')) out.push(...FEEDS.map((f) => new RssConnector(f)));
  const sp = createSearchProvider();
  if (enabled.includes('search') && sp) out.push(...DISCOVERY_QUERIES.map((q) => new SearchDiscoveryConnector(sp, q)));
  if (enabled.includes('ckan')) out.push(...CKAN_QUERIES.map((q) => new CkanConnector(q)));
  if (enabled.includes('fixture')) out.push(new FixtureConnector());
  return out;
}
