# Need Engine — POC

`SOURCE → SIGNAL → NEED → SOLUTION → ACTION → TRANSACTION`

Takes public/legal Israeli business data, extracts **needs & purchase intent**, predicts follow-on needs, dedupes
events across sources, matches them to a business profile, and prepares (never auto-sends) an action.

> ## Status — round 2 (2026-10-07)
> 3 high-density sources (Dekel bids, Haifa muni tenders, Tel Aviv construction sites) → 48 candidates → **40 opportunities**, LLM-validated.
> Human review: **27 TP (67.5% strict, 81.8% excl. unclear)**; explicit tender needs **88%**, predictive permit needs 33%.
> Targets missed: 100 candidates (the allowed sources only hold ~50 fresh items) and 70% strict precision.
> See `docs/REAL-WORLD-EVAL-R2.md`, `docs/SOURCE-BENCHMARK.md`, `docs/POC-RESULTS.md`.
> Disabled by owner decision: data.gov.il `/api/` (robots), Google News (non-commercial).

## Golden Opportunity (real, verified by hand)
| | |
|---|---|
| **Who** | עיריית באר שבע |
| **Looking for** | A supplier to place the municipality's ads in print newspapers — מכרז 54/2026 "לפרסום מודעות בעיתונות הכתובה עבור עיריית באר שבע" |
| **Source** | data.gov.il dataset `tender-br7` (official municipal open data) → tender page http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=887 |
| **Published / updated** | 16/09/2026 (row's `תאריך עדכון`; the dataset has no separate publication date) |
| **Deadline** | 20/10/2026 12:00 |
| **Evidence (verbatim)** | "שם מכרז: לפרסום מודעות בעיתונות הכתובה עבור עיריית באר שבע." |
| **Need** | Explicit — media buying / ad placement in print press (category `local_advertising`) |
| **Intent / confidence** | 90 / 95 — engine scores, not statistics. Human: explicit public tender, so intent is genuinely high |
| **Fits** | Advertising/media-buying agencies, marketing agencies that buy print media |
| **Do now** | Open the tender page, download the tender PDF and pay the document fee via the city's payment link if required, check eligibility conditions, submit before 20/10/2026. The engine only drafts an outreach/action plan; nothing is sent. |

## Run
```bash
cd need-engine
npm install
cp .env.example .env        # optional: add an LLM key
npm test                    # 13 tests: dedupe, anti-hallucination, LLM validators, freshness, parsing, matching
npm run poc                 # real connectors (CONNECTORS in .env; round 2: dekel,haifa,tlv-sites) -> data/poc-report.json
npm run demo                # same + synthetic fixtures (pipeline validation only)
npm run serve               # http://localhost:3000   (/admin = pipeline debug)
```
Requires Node ≥ 22.13 (uses built-in `node:sqlite`; prints an ExperimentalWarning — harmless).

## Using the UI
1. `/` → describe the business (or URL) → **מצא לי הזדמנויות**. Check "נתוני דמו" to see synthetic data.
2. **רענן מקורות** runs ingest+process in the background (progress/errors in `/admin`).
3. Card buttons: **פתח מקור**, **חקור** (all evidence, score breakdown), **הכן פנייה**, **פעל** (action plan).
   Nothing is ever sent: drafts need approval, and even approval only logs it (`DraftActionProvider.execute`).

## LLM
`LLM_PROVIDER=rules` (default) uses a deterministic Hebrew playbook extractor (offline, free, lower recall).
`claude-cli` (round 2) calls the local Claude Code CLI (`claude -p`, no tools, JSON schema) — billed to your Claude
subscription, no API key; on Windows set `CLAUDE_CLI_BIN` to `claude.exe`. `anthropic` or `openai` use an API key.
The LLM runs only on items that pass the cheap candidate filter, and returns the owner's schema (explicit vs predicted needs,
commercial actions, evidence quotes). Validators: every quote verbatim, entity in source, deadline only if its date is in the
source, predicted needs need a reason + quote + confidence ≥ 0.5. Tested on real data in round 2 (`docs/REAL-WORLD-EVAL-R2.md`).

## Key guarantees
Provenance (every opportunity → evidence rows → raw item → URL + timestamps) · retries w/ backoff · per-host rate limit ·
sqlite HTTP cache (stale-on-error) · robots.txt respected for HTML fetches · graceful per-connector failure ·
every accept/reject decision stored with a reason (`/admin`).
Confidence/intent numbers are **model/heuristic scores, not statistics**, and labelled so in the UI.

## Layout
`src/connectors/*` SourceConnector impls · `src/providers/*` LLM + Search providers · `src/engine/*` extract, dedupe,
pipeline, profile, match · `src/actions/*` ActionProvider · `src/server.ts` + `public/*` UI · `docs/*`.
