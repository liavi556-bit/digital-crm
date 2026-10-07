# POC Results

Real run on 2026-10-07 from an open network (`CONNECTORS=rss,ckan npm run poc`, empty DB), plus `npm test` (9/9 pass).
Extractor: `rules-v1` — **LLM mode still not run** (no key available).

## Headline
**1,395 real raw items → 8 opportunities → 3 true positives (human review). Precision 37.5%. Target of 10 TPs not reached.**
All 3 TPs are open Beer Sheva municipal tenders (deadline 20/10/2026). Per-item verdicts: `docs/REAL-WORLD-EVAL.md`.

## Real data
| raw items | stale | signals | opportunities | explicit | predicted only | duplicates | TP | FP | unclear | precision |
|---|---|---|---|---|---|---|---|---|---|---|
| 1,395 | 1,105 | 8 | 8 | 7 | 1 | 0 | 3 | 5 | 0 | 37.5% |

By source: data.gov.il 1,320 rows → 6 opps (3 TP, 3 FP) · Globes 60 items → 2 opps (0 TP) · ice 20 → 0 · Calcalist: HTTP 404.
Synthetic fixtures: not loaded in this run, not counted anywhere.

Profile matching (step 9) was **not run as an evaluation** — the brief gates it on ≥10 TPs.

## Bug fixes (not tuning) — connector `src/connectors/ckan.ts`
Each covered by a test in `src/test.ts`.
1. **dd.mm.yyyy / dd/mm/yyyy dates** were parsed by `new Date()` (wrong or invalid) → fell back to `metadata_modified`. Now parsed explicitly (`parseIlDate`).
2. **Date column choice**: `/date|תאריך|פרסום/` hit `מספר פרסום` (a number) or `תאריך אחרון להגשה` (the deadline!). Now prefers `תאריך פרסום` → `תאריך עדכון`, never deadline/submission columns.
3. **Title column**: picked `נושאים` instead of `שם הליך`. Now `שם הליך` → `שם מכרז` → title/subject → description/topics.
4. **entity_hint**: `/(שם|...)/` picked `שם מכרז` (the tender name) as the buyer. Now `שם המשרד`/publisher columns, else the dataset's organisation.
5. **Resource budget was global (3)**: for query `מכרזים` the first hit (government debt, 8 resources) used all slots, so Beer Sheva tenders were never read. Now 1 resource per package.
6. **`sort=_id desc` assumed newest-first**: false for Beer Sheva (newest at `_id` 1). Now reads 100 rows from each end.
7. **Undated rows**: never use `metadata_modified`; use the resource file's `last_modified` as an upper bound on the row's age (a row can't be newer than its file). This removed ~45 bogus "explicit tenders" from undated reference tables. Limitation: it cannot catch old rows inside a freshly re-uploaded file (→ FP #3–5).
8. Source URL now uses the row's own `URL` column when present (direct link to the tender page). HTML stripped from values.

## Bug fix (not tuning) — engine `src/engine/pipeline.ts` (dedupe)
9. **Different tenders from the same buyer were merged** (same entity + `TENDER_PUBLISHED` + within 21 days): the first real run collapsed 6 Beer Sheva tenders into one opportunity whose parent was a 2015 tender. For `TENDER_PUBLISHED`/`EXPLICIT_REQUEST`, dedupe now also requires title similarity.

## Config changes
`FEEDS` (registry.ts): added Globes 607 and 9917 and ice.co.il (verified 200 + robots); notes updated. `.env` (local, not committed): `CONNECTORS=rss,ckan`, `SEARCH_PROVIDER=none`.

## NOT changed (deliberately) — weaknesses seen on real data
Extractor and taxonomy rules were not touched. Observed:
- `/מכרז/` matches "המכרזנית" (auctioneer) → FP.
- Category keywords match attachment file names ("נוסח לפרסום" → local_advertising) → 2 of 3 TPs mis-categorised.
- Awarded tenders (`זוכה במכרז` non-empty) are not recognised as closed.
- `guessEntity` breaks on "X: Y" headlines ("ב־100 מיליון שקל: קרסו").
- Land purchase for a new site is typed as M&A.
- Stale prefilter uses row date only, so open tenders older than 45 days are dropped (2 real needs missed: elevator maintenance 67/2026, parking קול קורא 34/2026).
- English feeds are invisible to the Hebrew rules.

## Decisions needed (owner)
1. data.gov.il `robots.txt: Disallow: /api/` — keep using the official API, request permission, or drop it (see SOURCES.md).
2. Google News RSS — "personal, non-commercial use" — not used.
3. Should an open deadline override the 45-day staleness for tenders? (+2 TPs on this data.)
4. Provide an LLM key to test LLM extraction on the same 1,395 items.

## What would actually reach 10 TPs
Not more tuning on this data — there are only ~8 open tenders in it. It needs more **fresh explicit-need sources**:
an official/licensed tender feed (gov.il publications or a paid aggregator with API and terms), more municipalities
publishing to data.gov.il, or an LLM pass over news to turn events into usable predicted needs (unverified).
