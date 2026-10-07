# Real-world evaluation — round 2 "Opportunity Density" (2026-10-07)

Sources = the top-3 by measured density (`docs/SOURCE-BENCHMARK.md`): **Dekel bids**, **Haifa municipality tenders**,
**Tel Aviv GIS construction sites (layer 499)**. Pipeline: SOURCE → prefilter (freshness; open deadline overrides age) →
cheap candidate filter → **LLM validation + extraction** (`claude-cli:haiku`, structured JSON schema) → verbatim/entity/deadline
validators → dedupe → opportunity → human review (by me, item by item).
Confidence/intent are model scores, not statistics.

## Funnel
| source | raw | stale | candidates | LLM rejected | signals | merged | opportunities |
|---|---|---|---|---|---|---|---|
| Dekel bids | 18 | 1 | 17 | 0 | 17 | 0 | 17 |
| Haifa muni tenders | 12 | 0 | 12 | 4 | 8 | 0 | 8 |
| TLV construction sites | 53 | 34 | 19 | 2 | 17 | 2 | 15 |
| **total** | **83** | **35** | **48** | **6** | **42** | **2** | **40** |

9 tenders passed only because of the new rule "open deadline overrides publication age" (Dekel 7, Haifa 2).
LLM technical failures in the final run: 0 (3 timeouts re-run sequentially).

## Results vs. targets
| metric | target | result |
|---|---|---|
| quality sources | ≥3 | **3** |
| candidate items | ≥100 | **48 — NOT met** |
| opportunities | ≥20 | **40 — met** |
| precision after LLM (TP / all opportunities; UNCLEAR counted as not-TP) | ≥70% | **27/40 = 67.5% — NOT met** |
| precision excluding UNCLEAR (TP / (TP+FP)) | — | 27/33 = 81.8% |
| explicit-need opportunities (Dekel + Haifa) | — | 22 TP / 25 = **88%** |
| predictive opportunities (TLV permits) | — | 5 TP / 15 = **33%** (7 unclear, 3 FP) |

## Verdict definitions
**TP** = real, current, the body (or for predictive: the named developer) is identifiable, and at least one stated need is correct
and actionable now. **FP** = not open to vendors / duplicate / needs that don't follow. **UNCLEAR** = real event, but the
predicted needs are generic (e.g. "construction contracting" for a developer who has *already* started works).

## Per-opportunity review
| # | source | entity | event | explicit/predicted | main need (LLM) | deadline | verdict | reason |
|---|---|---|---|---|---|---|---|---|
| 1 | Dekel | מוריה חברה לפיתוח בירושלים | tender 42/2026 | explicit | infrastructure works, Issawiya interchange | 15/10 | TP | open public tender |
| 2 | Dekel | מוריה | tender 47/2026 | explicit | public-space & finishing works, Arnona | 15/10 | TP | |
| 3 | Dekel | חברה כלכלית בנימין | tender 03/2026 | explicit | school construction (Adam) | 18/10 | TP | |
| 4 | Dekel | עיריית ירושלים | tender 135.2026 | explicit | cardboard collection | 26/10 | TP | |
| 5 | Dekel | צוות תכנית אב לתחבורה י-ם | RFP | explicit | Priority ERP implementation | 28/10 | TP | |
| 6 | Dekel | רשות שדות התעופה | tender 200007161 | explicit | Terminal 3 expansion works | 29/10 | TP | (large contractors only) |
| 7 | Dekel | נתיבי איילון | tender 60/26 | explicit | Sharon trail works + bridges | 21/10 | TP | |
| 8 | Dekel | נתיבי איילון | framework tender 62/26 | explicit | surveying services | 10/11 | TP | |
| 9 | Dekel | נתיבי איילון | e-tender 36/26 | explicit | MUTC traffic-control system | 16/11 | TP | published April, still open |
| 10 | Dekel | צוות תכנית אב לתחבורה י-ם | RFI (Hebrew) | explicit | demand-forecasting models/tools | 25/11 | TP | RFI = pre-procurement, respond now |
| 11 | Dekel | same | RFI (English version) | explicit | same | 25/11 | **FP** | **duplicate of #10** — dedupe misses cross-language twins |
| 12 | Dekel | נתיבי איילון | pre-qualification 41/26 | explicit | Tzir HaNofesh tunnel/roads | 18/10 | TP | |
| 13 | Dekel | נתיבי איילון | call 71/26 | explicit | follow-on projects | 11/11 | **FP** | open only to TrackMakers alumni; predicted need invented-generic |
| 14 | Dekel | נתיבי איילון | RFI | explicit | e-bus charging infrastructure | 30/11 | TP | |
| 38 | Dekel | מרכז מעיין החינוך התורני | single-supplier intent | explicit | managers' training | 08/10 | **FP** | notice of intent to contract a specific supplier (LLM correctly rejected the same pattern in Haifa — inconsistent) |
| 39 | Dekel | עיריית ירושלים | tender 151.2026 | explicit | book supply pool | 13/10 | TP | |
| 40 | Dekel | עיריית ירושלים | tender 164.2026 | explicit | Bit payment clearing | 13/10 | TP | narrow vendor set; predicted needs weak |
| 15 | Haifa | עיריית חיפה | tender 40/2026 | explicit | bulk mail delivery | 26/10 | TP | |
| 16 | Haifa | עיריית חיפה | tender 39/2026 | explicit | managed software services | 21/12 | TP | |
| 17 | Haifa | עיריית חיפה | tender 38/2026 | explicit | grants-management system | 19/10 | TP | |
| 18 | Haifa | עיריית חיפה | tender 36/2026 | explicit | generators supply & maintenance | 19/10 | TP | category "fit-out" is loose |
| 19 | Haifa | עיריית חיפה | tender 35/2026 | explicit | **cleaning & maintenance of public toilets** | 19/10 | TP | fits the cleaning profile |
| 20 | Haifa | עיריית חיפה | tender 37/2026 | explicit | investigations / process serving | 26/10 | TP | |
| 21 | Haifa | עיריית חיפה | tender 41/2026 | explicit | printing + digital mailing | 19/10 | TP | |
| 22 | Haifa | עיריית חיפה | tender 34/2026 | explicit | operating a seniors day centre | 19/10 | TP | |
| 23 | TLV | אור-של החזקות | works start 05/10 | predicted | demolition / shoring | – | **FP** | permit amendment; predicted needs are the works already contracted |
| 24 | TLV | אבינו פרויקטים | works start 17/09, +15 units | predicted | contractor / logistics / security | – | UNCLEAR | generic needs |
| 25 | TLV | אשטרום מגורים יזמות | works start 24/09, 34 units | predicted | AC, emergency generator, solar, gas tank (all in the permit) | – | TP | needs grounded in permit text → subcontractor procurement |
| 26 | TLV | קבוצת גבאי פאדובה 17 | works start 17/09, 101 units | predicted | AC/mechanical, site security, materials | – | TP | large project, grounded |
| 27 | TLV | אחים עופר | works start 16/09, 24 units | predicted | demolition, waste, security, legal, cleaning | – | UNCLEAR | mostly generic |
| 28 | TLV | אחים עופר + העיר הלבנה | works start 16/09, 26 units | predicted | gas tank; **marketing & photography of 26 new units** | – | TP | unit marketing is a real developer purchase |
| 29 | TLV | בלגיה ישראל בויתקין | works start 10/09, 11 units | predicted | security, logistics, photography | – | UNCLEAR | generic |
| 30 | TLV | אשכול מגורים | works start 16/09, 62 units + retail | predicted | gas system, elevators | – | TP | grounded, large |
| 31 | TLV | ארכוד ברודי | works start 14/09 | predicted | **elevator** (explicitly in permit) | – | TP | |
| 32 | TLV | צליח-רוטשילד | works start 02/09, 47 units | predicted | security, logistics, recruiting, legal | – | UNCLEAR | big project, generic needs |
| 33 | TLV | גני יהושוע | works start 08/09, kindergarten | predicted | interior fit-out, security systems | – | UNCLEAR | one quote refers to another project in the same file |
| 34 | TLV | יעז יזמות | works start 27/08, 17 units | predicted | contractor, demolition, waste | – | UNCLEAR | generic |
| 35 | TLV | אחוזת בית נדל"ן | works start 27/08, +5 units | predicted | contractor, recruiting, signage | – | **FP** | small private build, generic |
| 36 | TLV | שינבר חכשורי צידון 4 | works start 26/08, +5 units | predicted | contractor, recruiting, legal | – | **FP** | small, generic |
| 37 | TLV | יצחק עפר חברה לבנין | works start 25/08, 30 units | predicted | demolition, recruiting, materials | – | UNCLEAR | generic |

URLs: Dekel `https://bids.dekel.co.il/Item.aspx?ID=…`, Haifa tender PDF under `https://www2.haifa.muni.il/Michrazim/TendersFiles/…`,
TLV public record query (see `data/round2` DB / `/admin`). Full evidence quotes are stored per opportunity.

## Where the thesis holds and where it breaks
**Holds — explicit needs from procurement boards:** 88% precision, every item has an identifiable buyer, a deadline, a URL and a
verbatim quote. The LLM correctly rejected all four Haifa non-purchases (2 asset leases, 1 single-supplier notice, 1 expired).

**Breaks 1 — volume.** The three allowed sources hold 83 items, only 48 are fresh candidates. The 100-candidate target is not
reachable from them. The big explicit pools (OPENBIDS ~2,300 open tenders, mr.gov.il, MAYA) are gated by ToS, a time window or a licence.

**Breaks 2 — predictive needs from permits.** "Works started" is a real, dated, attributable event, but the LLM mostly predicts the
works themselves (contracting, demolition) — which are already contracted at that stage. Only items whose permit text names concrete
systems (elevator, gas tank, AC, solar) or a sales need (new units to market) are genuinely actionable. Precision 33%.

**Engine weaknesses found (not fixed in this round):**
- cross-language duplicates (Hebrew/English versions of one RFI) are not merged (#10/#11);
- "single-supplier intent" notices handled inconsistently (rejected in Haifa, accepted in Dekel #38);
- eligibility restrictions (#13) not detected;
- predicted needs ignore project stage.

## Bugs found and fixed during the round (not tuning)
1. LLM JSON broke on unescaped Hebrew abbreviations (`בע"מ`) → structured output via `--json-schema` + gershayim repair + 1 retry.
2. TLV `url_archion_tik` is an intranet link (`http://handasa-archive/...`) → replaced with the public ArcGIS record query.
3. `.env` CRLF parsing (inline comments leaked into values on Windows).
4. A stopped background run kept processing in parallel and created duplicate opportunities → processing state was reset and the whole round re-run from the same raw data.
