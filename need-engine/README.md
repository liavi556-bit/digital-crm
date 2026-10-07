# Need Engine — POC

`SOURCE → SIGNAL → NEED → SOLUTION → ACTION → TRANSACTION`

Takes public/legal Israeli business data, extracts **needs & purchase intent**, predicts follow-on needs, dedupes
events across sources, matches them to a business profile, and prepares (never auto-sends) an action.

> ## ⚠️ Status of this POC — read first
> The code is built and tested end-to-end, **but 0 real opportunities were produced**: the sandbox it was built in
> blocks all outbound traffic to the target sources (HTTP 403 from the egress policy), so no real data could be fetched.
> The pipeline was validated on **synthetic fixtures** (clearly flagged, hidden from the UI by default, excluded from
> real counts). To get real data, allow the hosts in `docs/SOURCES.md` and run `npm run poc`. See `docs/POC-RESULTS.md`.
> The source endpoints are **unverified** — treat them as hypotheses until a run succeeds.

## Run
```bash
cd need-engine
npm install
cp .env.example .env        # optional: add an LLM key
npm test                    # 6 tests: dedupe, anti-hallucination, parsing, graceful failure, matching
npm run poc                 # real connectors -> pipeline -> data/poc-report.json
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
