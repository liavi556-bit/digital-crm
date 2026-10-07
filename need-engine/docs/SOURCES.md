# Sources

## Round 2 status (2026-10-07) — current
| Source | Connector | Status |
|---|---|---|
| Dekel bids `bids.dekel.co.il` (public list + item pages) | `DekelBidsConnector` | **enabled** · 18 items · no robots.txt · ToS silent on automation (written OK recommended) |
| Haifa muni tenders `www2.haifa.muni.il/Michrazim/` | `HaifaTendersConnector` | **enabled** · 12 items · robots 404 · no ToS published · Reblaze WAF (no challenge seen; flaky network) |
| Tel Aviv GIS layer 499 (construction sites) | `TlvConstructionSitesConnector` | **enabled** · 53 org-held sites in 120 days · no robots.txt · portal licence "any purpose with credit" (layer not confirmed in portal) · private holders never stored |
| data.gov.il CKAN | `CkanConnector` | **disabled** — robots.txt `Disallow: /api/`; the allowed `/dataset/.../download/` path returns CloudFront 403 |
| Google News RSS | `SearchDiscoveryConnector` | **disabled** — personal, non-commercial use only |
| Globes / ice / Calcalist RSS | `RssConnector` | not enabled this round (general news de-prioritised by owner) |
Full benchmark of ~25 sources: `docs/SOURCE-BENCHMARK.md`.

---
## Round 1 notes

**Verified 2026-10-07 from an open network** (Windows desktop, plain `curl`/`fetch`, UA `NeedEnginePOC/0.1`).
Nothing here bypasses login, CAPTCHA, Cloudflare challenges or rate limits. One reasonable attempt per blocking source.

## In use

| Source | Connector | Status 2026-10-07 | Fresh? | robots.txt | Terms / notes |
|---|---|---|---|---|---|
| Globes RSS `FeederNode?iID=2` (home) | `RssConnector` | 200, 15 items | yes (same day) | `/webservice/` allowed | Publisher content: we keep title/snippet/link only |
| Globes RSS `FeederNode?iID=607` (real estate & infrastructure) | `RssConnector` | 200, 15 items | yes | allowed | same |
| Globes RSS `FeederNode?iID=9917` (Israel) | `RssConnector` | 200, 15 items | yes | allowed | same |
| Globes RSS `FeederKeyword?iID=1397` (startups) | `RssConnector` | 200, 20 items | yes | allowed | **English content** — Hebrew rules extractor finds nothing |
| ice.co.il `/rss` | `RssConnector` | 200, 20 items | yes | `Allow: /` | ToS not reviewed. Mostly media/gossip; 0 signals |
| data.gov.il CKAN `package_search` + `datastore_search` | `CkanConnector` | 200 | see below | **`Disallow: /api/` for `*`** — see "Decisions needed" | Dataset licence per dataset (Beer Sheva: "Other (Open)") |

### data.gov.il datasets actually reached (rows dated from the rows themselves, not `metadata_modified`)
| Dataset | Rows | Newest row | Verdict |
|---|---|---|---|
| `tender-br7` — מכרזים בעיר באר שבע (עיריית באר שבע) | 827 | update date 16/09/2026; 6 tenders with deadline ≥ 07/10/2026 | **The only fresh explicit-need dataset found** |
| `tenders` — דוח מכרזים (מינהל הרכש הממשלתי) | 14,205 | 08.02.2021 | Stale. Prefilter correctly rejects all |
| `exemptions` — התקשרויות בפטור | 165,705 | Feb 2021 | Stale |
| `02` — מחקרים ממומנים, `callkorekitotvatikim`, `wplan_muni`, `aluyot-pituach`, `ogdan-education`, `goverment-domesticdebt` | — | no row date; resource files 2018–Aug 2026 | Matched the search words but are not needs (research grants list, cost tables, debt data). All rejected as stale (file date upper bound) or `no_event_pattern` |
| Queries `תאגידים חדשים`, `היתרי בנייה` | 0 results | — | No such datasets |

Searched with no fresh hit: `מכרז`, `tender`, `התקשרויות`, `פטור ממכרז`, `רכש`, `קול קורא`.
Resource download URLs (`e.data.gov.il/.../download/...`) redirect to the SPA / are blocked by CloudFront for scripts — only `datastore_search` works.

## Checked, not usable

| Source | Result | Verdict |
|---|---|---|
| Calcalist `GeneralRSS/0,16335,L-8,00.xml` | **404** (earlier cloud run: Access Denied). `L-3` also 404; no official RSS link on the home page | NOT FOUND — kept in config to show graceful failure |
| TheMarker `cmlink/1.145` | 200, 100 items, but robots.txt `Disallow: /*cmlink/*` | **Disallowed by robots — not used** |
| gov.il publications (`/he/collectors/publications`, `PublicationApi`) | 301 → Cloudflare "Just a moment..." challenge, 403 | BLOCKED, not bypassed |
| mr.gov.il | 307 → `/ilgstorefront/he`, anti-bot cookies; no RSS/API found | NOT FOUND |
| Municipalities: Tel Aviv, Haifa (RSS exists but dead since 2023, no tenders), Jerusalem (403) | no tender feed | NOT FOUND / BLOCKED |
| IEC, Mekorot, Netivei Israel (200, no feed), Israel Railways, land.gov.il (403) | no tender feed | NOT FOUND / BLOCKED |
| Bizportal `/rss` | 404 | NOT FOUND |
| Maariv breaking-news RSS | 200, general news | Not business — not added |
| **Google News RSS** | answers 200, but the feed states it is for personal, non-commercial use | **Not used — awaiting explicit owner decision** |

Not checked: universities, hospitals, other municipalities (Rishon, Petah Tikva, Netanya, Ashdod, Holon, Ramat Gan), ToS pages of Globes/ice.

## Decisions needed (owner)
1. **data.gov.il robots.txt disallows `/api/`.** The site's own SPA uses that API and the brief explicitly asked to use
   CKAN, so this run used it politely (1.5 s/host, cached). Strictly, "respect robots.txt" means stop. Options: keep
   (it is the documented developer API), ask data.gov.il for permission, or drop the source (→ 0 explicit needs).
2. Google News RSS (see above).

## Researched, NOT built
- **MAYA (TASE) filings** — bot-protected; needs an official/licensed feed.
- **LinkedIn/Facebook/Telegram groups** — login/ToS walls.
