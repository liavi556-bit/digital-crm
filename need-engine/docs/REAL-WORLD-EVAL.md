# Real-world evaluation — 2026-10-07

First run on **real data only** (no fixtures). Open network (Windows desktop, Node 24.19). Extractor: `rules-v1`
(**no LLM key was available, so LLM mode is still untested**). Connectors: `rss,ckan`. Google News search connector
**disabled** (its feed says "personal, non-commercial use" — needs an explicit decision, not taken).

## Numbers (final run, `npm run poc` from an empty DB)

| metric | value |
|---|---|
| raw items | **1,395** (75 RSS + 1,320 data.gov.il rows) |
| rejected at prefilter as stale | 1,105 |
| rejected at extract (`no_event_pattern`) | 272 |
| rejected at extract (`entity_unresolved`) | 6 |
| rejected at validate (`already_expired`) | 4 |
| signals | 8 |
| opportunities | **8** |
| explicit | 7 |
| predicted (only) | 1 |
| duplicates merged | 0 |
| **true positives** (human, need-level) | **3** |
| false positives | 5 |
| unclear | 0 |
| **precision** (TP / opportunities) | **3/8 = 37.5%** |
| precision incl. correct category | 1/8 = 12.5% (2 of the 3 TPs got the wrong category) |
| stale (prefilter) | 1,105 |

**The goal of 10 true positives was NOT reached: 3 TPs out of 1,395 real items.** See "Why" below. Nothing was
invented or padded. Confidence/intent columns are model/heuristic scores, not statistics.

Verdict definition: TRUE POSITIVE = a real, currently open need by an identifiable buyer, correctly evidenced by the
source, that a service provider could act on now. Category correctness is judged separately because it drives matching.

## Opportunities, reviewed by hand

| # | source | title | event | need (engine) | explicit/predicted | intent | confidence | evidence (verbatim) | URL | human verdict | reason |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | data.gov.il: מכרזים בעיר באר שבע (row date 16/09/2026) | לפרסום מודעות בעיתונות הכתובה עבור עיריית באר שבע | TENDER_PUBLISHED | מכרז/קול קורא: פרסום מקומי | explicit | 90 | 95 | "שם מכרז: לפרסום מודעות בעיתונות הכתובה עבור עיריית באר שבע." | http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=887 | **TRUE POSITIVE** | Tender 54/2026, open until 20/10/2026, buyer and scope clear, category correct. |
| 7 | data.gov.il: מכרזים בעיר באר שבע (row date 03/09/2026) | הפעלת מרכז חירום לסיוע ויעוץ למשפחות... באר שבע | TENDER_PUBLISHED | מכרז/קול קורא: פרסום מקומי | explicit | 90 | 95 | "שם מכרז: הפעלת מרכז חירום לסיוע ויעוץ למשפחות, למניעה וטיפול בתופעת האלימות במשפחה בעיר באר שבע." | http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=886 | **TRUE POSITIVE** (category wrong) | Tender 44/2026, open until 20/10/2026 — real need (social-services operator). Category is wrong: "פרסום" matched the attachment name "...לפרסום". Would be mis-routed to advertisers. |
| 8 | data.gov.il: מכרזים בעיר באר שבע (row date 31/08/2026) | הפעלת מרכזי יום טיפוליים לאנשים עם מוגבלויות... | TENDER_PUBLISHED | מכרז/קול קורא: פרסום מקומי | explicit | 90 | 95 | "שם מכרז: הפעלת מרכזי יום טיפוליים לאנשים עם מוגבלויות ברמות תמיכה גבוהות בעיר באר-שבע." | http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=884 | **TRUE POSITIVE** (category wrong) | Tender 23/2026, open until 20/10/2026. Same category error ("נוסח לפרסום" in file names). |
| 3 | data.gov.il: מכרזים בעיר באר שבע (undated row) | מכרז מס' 23/2015 - אספקה והתקנה של ציוד תקשורת... | TENDER_PUBLISHED | אינטרנט ותקשורת | explicit | 90 | 95 | "מכרז מס' 23/2015 - אספקה והתקנה של ציוד תקשורת למרכז טכנולוגי בבאר שבע." | http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=78 | **FALSE POSITIVE** | 2015 tender, already awarded (`זוכה במכרז` filled). Row has no date; the file's upload date (2026-10-05) was the only bound, so it passed as fresh. |
| 4 | same (undated row) | מכרז מס' 35/2015 – קיום יוזמות סביבתיות בית ספריות | TENDER_PUBLISHED | אחר | explicit | 90 | 95 | "מכרז מס' 35/2015 – קיום יוזמות סביבתיות בית ספריות." | http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=73 | **FALSE POSITIVE** | 2015, awarded to החברה להגנת הטבע. Same cause. |
| 5 | same (undated row) | מכרז פומבי מס' 11/2015 להפעלת מערך יום לימודים ארוך... | TENDER_PUBLISHED | אחר | explicit | 90 | 95 | "מכרז פומבי מס' 11/2015 להפעלת מערך יום לימודים ארוך [צהרונים] בגני ילדים בעיר באר שבע." | http://www.beer-sheva.muni.il/City/FreeInfo/Lists/List3/DispForm.aspx?ID=65 | **FALSE POSITIVE** | 2015, awarded. Same cause. |
| 2 | Globes - real estate & infrastructure (04/10/2026) | כולם ניסו לגלות מי רכש את אחד הבתים המפורסמים בלוס אנג׳לס | TENDER_PUBLISHED | מכרז/קול קורא: אחר | explicit | 90 | 88 | "...המכרזנית ישבה על כיסא מתקפל ליד מזרקה..." | https://www.globes.co.il/news/article.aspx?did=1001558311 | **FALSE POSITIVE** | Foreclosure auction of an LA mansion. `/מכרז/` matched "המכרזנית" (auctioneer). Entity is garbage ("כולם ניסו לגלות מי"). |
| 1 | Globes - news (07/10/2026) | ב־100 מיליון שקל: קרסו רוכשת קרקע בנשר למרכז המכירות והשירות של פריסבי | MERGER_ACQUISITION | legal 0.75, IT 0.7, marketing 0.55, signage 0.4 | predicted | 55 | 68 | "ב־100 מיליון שקל: קרסו רוכשת קרקע בנשר למרכז המכירות והשירות של פריסבי." | https://www.globes.co.il/news/article.aspx?did=1001558707 | **FALSE POSITIVE** | The event is real and interesting (30-dunam auto sales+service center in Nesher → construction, signage, later cleaning). But the engine output is wrong: it's a land purchase, not M&A; entity string is "ב־100 מיליון שקל: קרסו"; predicted needs (post-merger legal/IT integration) don't follow. Not usable as produced. |

## What the engine missed (known false negatives)
Found by reading the Beer Sheva dataset directly (827 rows; the connector reads 100 from each end = 200):
- **67/2026 — "לקבלת שירותי תחזוקת מעליות במוסדות חינוך ובמוסדות עירוניים"**, deadline 20/10/2026, row date 04/08/2026.
- **קול קורא 34/2026 — "הזמנה למתן שירותי הסדרי חניה מקומיים"**, deadline 20/10/2026, row date 29/07/2026.
- 65/2026 — sale of land plots (deadline 10/11/2026) — not a service need, correctly not a TP either way.

The first two are real open needs, rejected as `stale` because the prefilter measures age from the row's date
(> `MAX_AGE_DAYS`=45) and ignores the still-open deadline. **I did not change this** — it is a product decision
(see POC-RESULTS "Decisions needed"). With it changed, TPs would be 5, still below 10.

## Why 10 was not reached
1. **Only one fresh, machine-readable, explicit-need source exists among those I could legally reach**: Beer Sheva
   municipality tenders on data.gov.il (6 open tenders on 2026-10-07). The national procurement datasets
   (`tenders`, `exemptions`) end in February 2021. gov.il publications sit behind a Cloudflare challenge (403, one try,
   not bypassed). No municipality / government-company RSS of tenders was found (Tel Aviv, Haifa, Jerusalem, IEC,
   Mekorot, Netivei Israel, Israel Railways, land.gov.il checked; details in SOURCES.md).
2. **News RSS gives events, not needs, and the rules extractor barely reads them**: 75 news items → 2 signals, both
   wrong. The Globes "startups" feed is in English, so the Hebrew rules see nothing in it. An LLM extractor would
   likely do better on news but was not run (no key) — not verified.
3. **The rules extractor's weak points on real data** (documented, NOT tuned): `/מכרז/` matches "המכרזנית";
   category keywords match attachment file names ("לפרסום"); awarded tenders (`זוכה במכרז` filled) are not
   recognised; entity guessing from headlines breaks on "X: Y" headline patterns.
