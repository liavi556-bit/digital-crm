import type { SourceConnector, SearchProvider } from '../types.js';
import { RssConnector, type FeedDef } from './rss.js';
import { CkanConnector } from './ckan.js';
import { SearchDiscoveryConnector, DISCOVERY_QUERIES } from './search.js';
import { FixtureConnector } from './fixture.js';
import { DekelBidsConnector, HaifaTendersConnector, TlvConstructionSitesConnector } from './tenders-html.js';
import { GoogleNewsRssSearch } from '../providers/search.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

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
  // DISABLED by owner decision 2026-10-07 (code kept for reference, see docs/SOURCES.md):
  //  - search: Google News RSS is "personal, non-commercial use" -> not a product source
  //  - ckan:   data.gov.il robots.txt has `Disallow: /api/` and no allowed bulk-download path was found
  for (const off of ['search', 'ckan']) if (enabled.includes(off)) logger.warn(`connector family "${off}" is disabled (see docs/SOURCES.md) - ignored`);
  void createSearchProvider; void DISCOVERY_QUERIES; void SearchDiscoveryConnector; void CkanConnector; void CKAN_QUERIES;
  // Top-3 sources by measured Opportunity Density (docs/SOURCE-BENCHMARK.md)
  if (enabled.includes('dekel')) out.push(new DekelBidsConnector());
  if (enabled.includes('haifa')) out.push(new HaifaTendersConnector());
  if (enabled.includes('tlv-sites')) out.push(new TlvConstructionSitesConnector());
  if (enabled.includes('fixture')) out.push(new FixtureConnector());
  return out;
}
