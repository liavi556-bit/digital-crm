# Source Benchmark — Opportunity Density (2026-10-07)

**Opportunity Density = actionable opportunities / items inspected**, judged by hand on real items (no connector yet).
Two research passes: (1) three internal research agents, (2) the owner's external research tool (`benchmark/external-research-report.md`).
Raw items + per-item verdicts: `benchmark/raw/*.json`. Counts below were **recounted from those files**, not copied from summaries.
Two items were spot-checked against the live source (Geektime feed, Tel Aviv GIS layer 499): they match.

"Actionable" = a vendor could approach an identifiable body now: open/recent, URL, not awarded/closed, not a staff/job tender,
not the body selling its own assets, not a private individual.

## Results

| Source | Access method | Commercial/legal status | Freshness | Items inspected | Business events | Explicit needs | Predictive needs | Actionable | Density | Recommended |
|---|---|---|---|---|---|---|---|---|---|---|
| **Maccabi — bids/RFQ** | HTML `maccabi4u.co.il/bids/` | robots OK for `/bids/`; **ToS: no copying/distribution without Maccabi's prior written consent** | newest 30/09/2026; 7/9 published in Sept | 9 (all) | 9 | 9 | 0 | 9 | **100%** (tiny) | YES on density, **NO until written consent** |
| **Dekel bids** (Jerusalem muni, Netivei Ayalon, Israel Airports, Moriah, Binyamin EDC…) | HTML list `bids.dekel.co.il/` + item pages | no robots.txt; ToS silent on automation ("© all rights reserved") — written OK recommended | newest 07/10/2026; ~8 new/month; 18 open | 18 (all) | 17 | 16 | 0 | 14 | **78%** | **YES** |
| **Tel Aviv GIS — construction sites (layer 499)** | ArcGIS REST JSON `gisn.tel-aviv.gov.il/.../MapServer/499/query` | no robots.txt; open-data portal licence: "free to share and adapt… for any purpose, with credit" — not confirmed that layer 499 is a portal dataset | works-start approvals daily, newest 05/10/2026 | 20 | 20 | 0 | 15 | 14 | **70%** | **YES** (predictive) |
| **Haifa municipality tenders** | HTML table `www2.haifa.muni.il/Michrazim/Default.aspx` | robots none (www2 404); no ToS published; behind Reblaze WAF (works without challenge) | newest upload 07/09/2026; 4–8/month | 12 (all) | 12 | 8 | 0 | 8 | **67%** | **YES** |
| Ichilov health corp. tenders | HTML | robots OK; ToS not reviewed | 2 open | 3 | 3 | 3 | 0 | 2 | 67% (n=3) | NO — negligible volume |
| Geektime — funding category RSS | RSS `/category/funding/feed/` | robots OK; **ToS: no copying/distribution without prior written consent** | ~0.7/day | 20 | 19 | 0 | 16 | 13 | 65% | NO until written consent |
| Geektime — "אקזיט" tag RSS | RSS | same ToS | ~1.5/week | 20 | 15 | 0 | 12 | 12 | 60% | NO until written consent |
| Labour Ministry "active construction sites" (Haifa open-data mirror) | CSV download (allowed path) | **ODbL — commercial use allowed** with attribution/share-alike | mirror stale (Feb 2026), no row date | 20 | 20 | 0 | 20 | 20* | 100%* | mirror NO; **national source YES if reachable** |
| Same, national file on data.gov.il | CSV download path (robots allows `/dataset/.../download/`) | "Other (Open)" | daily, 10,953 rows | 0 | – | – | – | – | – | **blocked: CloudFront 403** from here and from the research box (not bypassed) |
| TLV GIS — businesses (layer 925) | ArcGIS REST | as layer 499 | daily | 20 | 20 | 0 | 19 | 3 | 15% | secondary |
| TLV GIS — permits/occupancy (layer 772) | ArcGIS REST | as layer 499 | daily | 20 | 20 | 0 | 5 | 2 | 10% | NO (address only, no owner) |
| GlobeNewswire Israel | RSS | robots OK | ~3/day | 20 | 16 | 0 | 5 | 5 | 25% | NO |
| tv10 real estate | RSS | robots OK | ~2/week | 20 | 10 | 0 | 6 | 6 | 30% | NO |
| Innovation Authority calls | HTML + RSS | ToS forbids commercial redistribution | 20 open | 21 | 21 | 5 | 0 | 4 | 19% | NO |
| TAU / Bar-Ilan tenders | HTML | robots OK (TAU crawl-delay 10) | 1–3/month | 20 / 10 | 20 / 10 | 20 / 10 | 0 | 4 / 2 | 20% | NO (mostly closed items, low volume) |
| Globes 594 / 821 / 607 | RSS | robots OK | daily | 15 / 15 / 15 | 5 / 6 / 7 | 0 | 3 / 2 / 1 | 3 / 2 / 1 | 20% / 13% / 7% | NO |
| TheMarker technation / real-estate | RSS `/srv/…` | robots OK | daily | 20 / 20 | 5 / 3 | 0 | 2 / 0 | 2 / 0 | 10% / 0% | NO |
| Expo Tel Aviv events / tenders | WP REST JSON | robots OK | monthly | 20 / 6 | 20 / 6 | 0 / 5 | 0 | 0 / 0 | 0% | NO |
| ice general RSS | RSS | robots OK | minutes | 20 | 6 | 0 | 0 | 0 | 0% | NO |
| Drushim jobs | sitemap + JSON-LD | no API | minutes | 19 | 1 | 0 | 0 | 0 | 0% | NO |
| iplan national plans | ArcGIS REST | robots unclear | daily | 20 | 20 | 0 | 6 | 0 | 0% | NO (no applicant; years away) |
| mr.gov.il ilgstorefront (gov. procurement portal) | HTML + official sitemap | robots allows publication pages, **Crawl-delay 10, Visit-time 04:00–08:45 UTC** | – | 1 | 1 | 1 | 0 | 1 | n/a | **PENDING**: sample 20 inside the allowed window |

\* structural score: every row names a contractor and a project, but rows have no date and liveness was not verified.

## Not usable / blocked (one attempt each, nothing bypassed)
MAYA (Incapsula; robots disallows `/api/`; TASE Data Hub licence **$145/month internal, $290 distribution**) · Magna (reCAPTCHA; official
commercial API for registered distributors only, terms not public) · data.gov.il `/api/` (robots) · gov.il (Cloudflare) · Calcalist (Akamai) ·
Jerusalem muni & GIS (Akamai) · govmap · Tel Aviv muni site (472) · Netanya, Bnei Brak, Rehovot, Bat Yam, Kfar Saba, Herzliya (Cloudflare) ·
Rishon, Ashdod, Beer Sheva, Holon, Ashkelon… (TLS reset from a foreign IP — **not tested from Israel**) · IEC (`/api/` disallowed) · Netivei Israel,
Israel Railways, Mekorot (403) · HUJI, Clalit, Hadassah (challenge) · BGU (robots `Disallow: /`) · Google News (non-commercial).
Aggregators: **OPENBIDS** (2,306 open tenders, ToS forbids scraping — **licence conversation candidate**), michrazim.org.il (₪99/month, ToS forbids
automation without licence), RFP Cafe, Ifat (sales-led, no public API).

## Selection for this round (top-3 by density that are usable now)
1. **Dekel bids** — explicit, 78%.
2. **Tel Aviv GIS construction sites** — predictive, 70%.
3. **Haifa municipality tenders** — explicit, 67%.

Maccabi (100%) and Geektime (65%) are excluded only because their ToS require prior written consent.

## The structural finding
High density exists, **but only in small or closed pools**. The best explicit-need sources each publish ~5–20 open items at a time.
The large pools (OPENBIDS ~2,300 open tenders, mr.gov.il, MAYA) are behind a licence, a time window, or a ToS that forbids automation.
At the 3 selected sources there are **~83 items in total, of which only ~53 are fresh**. A 100-candidate run is not possible from them
without lowering freshness or using sources whose terms forbid it.
