# Sources

**Verification status: NONE of these endpoints could be reached from the build environment** (egress policy returned
HTTP 403 for every host, including WebFetch). URLs below come from memory or public listings found via search and are
**unverified**. First real run will show which work (`/admin` → Connectors). Nothing here bypasses login/CAPTCHA/limits.

| Source | Connector | Access | Status | Limits / terms to check |
|---|---|---|---|---|
| data.gov.il (CKAN) | `CkanConnector` — `package_search` then `datastore_search` on datastore-active resources; resource ids discovered, not hard-coded | Official open API, no key | Unverified. A web search suggested the companies-registrar data exists there; a search on tenders found **no** machine-readable Israeli procurement dataset (2015 OKI index said tender awards/exemptions aren't open data — may be outdated) | Dataset-specific licence (usually CC-BY/Israeli open licence); be polite on rate |
| Globes RSS | `RssConnector` | Public RSS | `FeederKeyword?iID=1397` (startups) seen in a public listing; `FeederNode?iID=2` guessed. Unverified | Publisher ToS: headlines/snippets only, link back; no body copying |
| Calcalist RSS | `RssConnector` | Public RSS | URL from memory. Unverified | same |
| Google News RSS search | `SearchDiscoveryConnector` + `GoogleNewsRssSearch` | Public RSS search feed | Unverified. Discovery only: we store title/link/snippet/publisher as pointers; links are Google redirect URLs | Google ToS — if this becomes a product use a licensed search API (Brave/Serper/CSE) via `SearchProvider` |
| Fixtures | `FixtureConnector` | local | Works | **Synthetic**, flagged, excluded from real counts |

## Researched, NOT built (and why)
- **mr.gov.il / gov.il tender portals** — HTML/JS portals; no documented public API found; scraping not attempted (possible anti-bot, ToS). Best next target if an official feed/dataset is confirmed.
- **MAYA (TASE) company filings** — valuable (public-company events) but site is bot-protected; look for an official/licensed feed.
- **Municipality sites** — no uniform feed; needs per-site connectors; only where robots.txt/terms allow.
- **Companies registrar changes** — only as snapshot open data on data.gov.il (no change feed verified).
- **LinkedIn/Facebook/Telegram groups** — login/ToS walls; Telegram only for public channels via official API with consent, later.

## Known gaps in the source mix
No source is *verified* to carry buyer intent in Hebrew at volume. News RSS gives events (openings, funding) → predicted needs.
Tenders/קולות קוראים give explicit needs but I could not confirm a legal machine-readable feed.
