# Need Engine — POC

`SOURCE → SIGNAL → NEED → SOLUTION → ACTION → TRANSACTION`

Takes public/legal Israeli business data, extracts **needs & purchase intent**, predicts follow-on needs, dedupes
events across sources, matches them to a business profile, and prepares (never auto-sends) an action.

> ## Status — first real-data run (2026-10-07)
> **1,395 real items → 8 opportunities → 3 true positives** (human-reviewed, precision 37.5%). Goal of 10 TPs **not reached**:
> the only fresh, legally reachable explicit-need source found is Beer Sheva's tender dataset on data.gov.il.
> Rules extractor only (no LLM key). Details: `docs/REAL-WORLD-EVAL.md`, `docs/POC-RESULTS.md`, `docs/SOURCES.md`.
> Open owner decisions: data.gov.il robots.txt disallows `/api/`; Google News RSS is non-commercial only (not used).

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
npm test                    # 9 tests: dedupe, anti-hallucination, RSS+CKAN parsing, graceful failure, matching
npm run poc                 # real connectors (CONNECTORS in .env; this run used rss,ckan) -> data/poc-report.json
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
`anthropic` or `openai` (any OpenAI-compatible endpoint, incl. Ollama) switches extraction, profile building and
outreach drafting to an LLM. Every LLM output goes through the same validators (see ARCHITECTURE.md): evidence must be
a verbatim substring of the source, the entity must appear in the source, amounts only if stated.
**LLM mode has not been run** in this build (no key available) — only the rules path is tested.

## Key guarantees
Provenance (every opportunity → evidence rows → raw item → URL + timestamps) · retries w/ backoff · per-host rate limit ·
sqlite HTTP cache (stale-on-error) · robots.txt respected for HTML fetches · graceful per-connector failure ·
every accept/reject decision stored with a reason (`/admin`).
Confidence/intent numbers are **model/heuristic scores, not statistics**, and labelled so in the UI.

## Layout
`src/connectors/*` SourceConnector impls · `src/providers/*` LLM + Search providers · `src/engine/*` extract, dedupe,
pipeline, profile, match · `src/actions/*` ActionProvider · `src/server.ts` + `public/*` UI · `docs/*`.
