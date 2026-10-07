import type { SourceConnector, SearchProvider } from '../types.js';
import { RssConnector, type FeedDef } from './rss.js';
import { CkanConnector } from './ckan.js';
import { SearchDiscoveryConnector, DISCOVERY_QUERIES } from './search.js';
import { FixtureConnector } from './fixture.js';
import { GoogleNewsRssSearch } from '../providers/search.js';
import { config } from '../config.js';

/** Endpoints below could NOT be verified from the build sandbox (egress blocked). See docs/SOURCES.md. */
export const FEEDS: FeedDef[] = [
  { name: 'Globes - startups', url: 'https://www.globes.co.il/WebService/Rss/RssFeeder.asmx/FeederKeyword?iID=1397', note: 'URL seen in public listings; unverified' },
  { name: 'Globes - news', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=2', note: 'unverified' },
  { name: 'Calcalist - news', url: 'https://www.calcalist.co.il/GeneralRSS/0,16335,L-8,00.xml', note: 'unverified' },
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
