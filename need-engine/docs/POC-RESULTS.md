# POC Results

Generated from a real run on 2026-10-07 (`HTTP_RETRIES=1 npm run demo`), plus `npm test` (6/6 pass).

## Headline
**Real opportunities found: 0.** Real data could not be fetched: all 19 real connector runs failed with
HTTP 403 from the sandbox's egress policy (hosts: data.gov.il, globes.co.il, calcalist.co.il, news.google.com,
mr.gov.il, gov.il, themarker.com). I did not route around the block. The target of 30 real opportunities was **not tested at all**,
so nothing can be concluded yet about whether real data yields opportunities worth paying for.

## Real data
| raw items | signals | opportunities | high-quality |
|---|---|---|---|
| 0 | 0 | 0 | 0 |

## Synthetic fixtures (pipeline validation ONLY — written by me, not real, not evidence of product value)
| raw items | rejected | signals | opportunities | explicit only | explicit+predicted | predicted only | duplicates merged | high-quality |
|---|---|---|---|---|---|---|---|---|
| 10 | 2 (1 stale, 1 non-event) | 8 | 7 | 1 | 2 | 4 | 1 | 0 (by design: synthetic) |

Matches per POC profile on fixtures: cleaning/polish 4 · web/marketing 5 · AI/automation 2.
What this does show: ingestion, prefilter, extraction, evidence validation, entity dedupe (2 reports of one branch opening → 1 opportunity, 2 evidence),
explicit/predicted split, matching, draft-only actions and the admin trail all work. It says **nothing** about recall/precision on real Hebrew text:
fixtures were written alongside the rules, so passing them is expected. The first real run is the actual test.

## Bugs found while running (fixed)
- JS `\b` doesn't work with Hebrew → entity extraction failed on 6/8 items (recall 2/8 → 8/8 on fixtures).

## Not verified
LLM mode (no key) · every external endpoint · robots.txt logic against a live site · profile-from-URL · rules-mode recall on real news.

## Next 3 connectors (recommended)
1. **Verified official tender/קול קורא feed** (gov.il/mr.gov.il publication data if an official export or open dataset exists; otherwise a licensed aggregator) — the only source family giving *explicit* needs.
2. **MAYA/TASE filings via an official or licensed feed** — public-company expansions, M&A, funding, new sites: clean, dated, attributable events.
3. **Municipal & planning (building permits / ועדות תכנון) open data** — construction completion → cleaning/polish/signage/security needs; strongest fit for the cleaning profile.
Alternative if licensing allows: a paid news/Press-release API with full text, because RSS snippets are often too short for evidence.
