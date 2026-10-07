# Architecture

```
SourceConnector[] ──fetch──▶ RawSignal ──▶ raw_items (sqlite, dedup by hash)
                                              │ prefilter (too_short / stale)
                                              ▼
                              NeedExtractor (rules | LLM) ──▶ Extraction
                                              │ validate (verbatim evidence, entity∈source, not expired, has URL)
                                              ▼
                              signals ──▶ Resolver/Dedupe ──▶ opportunities + opportunity_evidence
                                              ▼
                  BusinessProfile ──▶ OpportunityScorer ──▶ Match[] ──▶ UI ──▶ ActionProvider (draft only)
```
Every stage writes a row to `decisions(raw_id, stage, verdict, reason)`; `/admin` is built from it.

## Abstractions (`src/types.ts`)
| Interface | Impl in POC | Add later |
|---|---|---|
| `SourceConnector` | `RssConnector`, `SearchDiscoveryConnector`, `CkanConnector`, `FixtureConnector` | Telegram, job boards, MAYA, gov.il collectors, events |
| `LLMProvider` | `AnthropicProvider`, `OpenAICompatProvider` (OpenAI/Gemini-compat/Ollama/OpenRouter) | any |
| `SearchProvider` | `GoogleNewsRssSearch` (discovery only) | Brave, Serper, CSE |
| `NeedExtractor` | `RuleBasedExtractor`, `LLMExtractor` (falls back to rules on error) | fine-tuned model |
| `OpportunityScorer` | `WeightedMatchScorer` | learned ranker |
| `ActionProvider` | `DraftActionProvider` (never sends) | email/WhatsApp/CRM after approval |

Adding a source = one class returning `RawSignal[]` + one line in `connectors/registry.ts`.

## Need prediction
`taxonomy.ts` holds per-event playbooks (event regex → predicted needs with prior confidence + rationale).
Explicit need = literally stated (tender/RFP/"מבקשים הצעות"); everything else is **PREDICTED** and rendered separately.
Percentages are heuristic priors (rules mode) or the model's self-reported confidence (LLM mode) — never statistics.
They were hand-set by the developer, not calibrated on data; calibration is a next step once real outcomes exist.

## Anti-hallucination
1. `evidence_quote` must be a verbatim substring of title+text, else rejected (`evidence_not_verbatim_in_source`).
2. Entity must appear in the source (or come from a structured `entity_hint`).
3. `estimated_value` only from an amount stated in the text; otherwise `null` (no invented values).
4. LLM categories are filtered to the taxonomy; confidences clamped to 0..1.

## Dedupe / entity resolution (`engine/dedupe.ts`)
Same `event_type` AND (entity equal after normalisation / containment / token-Jaccard ≥ 0.6, with compatible location,
within 21 days) OR title Jaccard ≥ 0.6. Merge adds an evidence row, unions predicted needs, bumps confidence +4 for
corroboration. Known weakness: no alias table / no company-registry IDs yet.

## Matching
`score = 100·(0.35 service_fit + 0.15 location + 0.15 intent + 0.15 confidence + 0.10 freshness + 0.10 value)`;
service_fit=1 for explicit, ≤0.9 for predicted (its confidence); location via city→region map; freshness half-life 14 d;
value uses a stated amount if present, else a coarse per-category band (labelled heuristic). Opportunities with no service overlap are dropped.

## "High quality" (used in POC-RESULTS)
non-synthetic ∧ confidence ≥ `HQ_MIN_CONFIDENCE` ∧ ≥1 verified evidence ∧ source URL ∧ fresh ∧ not expired.
This is a mechanical gate, **not** a human judgement that someone would pay — that still needs manual review of real data.

## Ops
Retries (exp. backoff, 429/5xx), per-host min interval, sqlite cache with stale fallback, robots.txt check for HTML,
identifying User-Agent, per-connector isolation, structured stderr logs. DB: sqlite (`DB_PATH`) — swap for Postgres if multi-user.
