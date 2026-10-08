/**
 * End-to-end opportunity report: SOURCE -> NEED -> OPPORTUNITY -> MONEY PATH -> MATCH -> DRAFT ACTION.
 * Reads the round DB + human verdicts + monetization + synthesis; writes docs/OPPORTUNITY-REPORT.md.
 * Money numbers are model estimates unless marked "stated". Nothing is sent anywhere.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { openDb } from './db.js';
import { loadOpportunities } from './engine/pipeline.js';
import { buildProfile } from './engine/profile.js';
import { WeightedMatchScorer } from './engine/match.js';
import { POC_PROFILES } from './profiles/poc.js';
import type { Monetization } from './engine/monetize.js';

const dbPath = process.argv[2] ?? 'data/round2/ne.db';
const db = openDb(dbPath);
const verdicts: Record<string, { verdict: string; reason: string | null }> = existsSync('benchmark/round2-verdicts.json') ? JSON.parse(readFileSync('benchmark/round2-verdicts.json', 'utf8')).verdicts : {};
const opps = loadOpportunities(db);
const mon = new Map<number, Monetization>((db.prepare('SELECT opp_id, data FROM monetization').all() as any[]).map((r) => [r.opp_id, JSON.parse(r.data)]));
const syn = (db.prepare('SELECT data FROM synthesis ORDER BY id DESC LIMIT 1').get() as any)?.data;
const insights: any[] = syn ? JSON.parse(syn).insights : [];

const ils = (n: number | null | undefined) => (n == null ? '—' : `₪${Math.round(n).toLocaleString('he-IL')}`);
const cell = (s: unknown) => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const best = (m?: Monetization) => (m && m.monetizable ? m.paths[m.best_path_index] : undefined);

// rank: human-verified first, then estimated revenue to us, then speed to cash
const rows = opps.map((o) => ({ o, v: verdicts[o.id]?.verdict ?? 'unreviewed', m: mon.get(o.id), b: best(mon.get(o.id)) }))
  .sort((a, b) => (a.v === 'TP' ? 0 : a.v === 'UNCLEAR' ? 1 : 2) - (b.v === 'TP' ? 0 : b.v === 'UNCLEAR' ? 1 : 2)
    || (b.b?.our_revenue_ils ?? -1) - (a.b?.our_revenue_ils ?? -1) || (a.b?.days_to_cash ?? 999) - (b.b?.days_to_cash ?? 999));
const tp = rows.filter((r) => r.v === 'TP');
const monetizableTp = tp.filter((r) => r.b);
const pipelineValue = monetizableTp.reduce((a, r) => a + (r.b!.our_revenue_ils ?? 0), 0);
const byModel = monetizableTp.reduce<Record<string, number>>((a, r) => ({ ...a, [r.b!.model]: (a[r.b!.model] ?? 0) + 1 }), {});
const typeCount = rows.filter((r) => r.v !== 'FP').reduce<Record<string, number>>((a, r) => { for (const t of r.m?.opportunity_types ?? []) a[t] = (a[t] ?? 0) + 1; return a; }, {});

// Money opportunities live in the sibling project (not rebuilt here)
let moneyLine = 'לא נקרא';
const moe = 'C:/Users/liavi/Desktop/פרויקטים/money-opportunity-engine/_מצב.md';
if (existsSync(moe)) { const t = readFileSync(moe, 'utf8'); const m = t.match(/IL-2026-0001[^\n]*/); moneyLine = m ? cell(m[0]) : 'קיים, ללא שורה פעילה'; }

const out: string[] = [];
out.push(`# דוח הזדמנויות — מקצה לקצה`, '', `נוצר: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · DB: \`${dbPath}\` · מקורות: דקל מכרזים, מכרזי עיריית חיפה, אתרי בנייה ת"א`, '',
  `> **גבול הדוח:** המנוע מגיע עד "טיוטת פעולה". שליחה, חתימה וגבייה הם צעדים של אדם — שום דבר לא נשלח.`,
  `> סכומים הם **הערכות מודל** (אלא אם מסומן "stated"). פסיקות TP/FP/UNCLEAR הן בדיקה ידנית, פריט-פריט.`, '');
out.push(`## שורה תחתונה`, '',
  `| שלב | מספר |`, `|---|---|`,
  `| פריטים גולמיים → מועמדים → הזדמנויות | 83 → 48 → ${opps.length} |`,
  `| הזדמנויות אמיתיות (בדיקה ידנית) | **${tp.length}** |`,
  `| מהן עם מסלול הכנסה ריאלי (לפי המודל) | **${monetizableTp.length}** |`,
  `| הכנסה פוטנציאלית מצטברת לנו (סכום הערכות המודל, לא תחזית) | ${ils(pipelineValue)} |`,
  `| מודלי הכנסה מובילים | ${Object.entries(byModel).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(' · ') || '—'} |`,
  `| סוגי הזדמנות (בלי FP) | ${Object.entries(typeCount).map(([k, n]) => `${k} ${n}`).join(' · ') || '—'} |`, '');

out.push(`## ביקורת שלי על התוצאה (לקרוא לפני הטבלאות)`, '',
  `- **"${monetizableTp.length} מתוך ${tp.length} ניתנות למונטיזציה" זה דגל אדום, לא הישג.** המודל אופטימי מדי; הוא כמעט לא אומר "לא".`,
  `- **הסכומים מנופחים בקצה העליון.** הכנת הצעה לטרמינל 3 ב-₪75K לא ריאלית לגוף קטן — קבלנים בסדר הגודל הזה מחזיקים צוות מכרזים פנימי (המודל עצמו מציין זאת בסינתזה). ה-₪${Math.round(pipelineValue / 1000)}K המצטבר הוא תקרה תאורטית, לא תחזית.`,
  `- **"ימים לכסף" אופטימי.** מכרזים שנסגרים בעוד 3–7 ימים לא ישאירו זמן למכור שירות, להכין הצעה ולגבות.`,
  `- **חלק מ"הצעדים הראשונים" הם ספאם** (הודעות המוניות לקבוצות וואטסאפ). לא לבצע כך; פנייה אישית בלבד.`,
  `- **מה כן נראה אמיתי:** (1) הכנת הצעות/RFI למכרזי IT בינוניים (ERP, מערכות עירוניות, RFI תחבורה) — ערך גבוה לספק בינוני, מעט מתחרים ישירים; (2) מוצר "עוזר AI למענה על מכרזים" כמנוי — אבל שוק ההתראות כבר רווי ב-₪89–99/חודש, ולכן הערך חייב להיות בכתיבת ההצעה ולא בהתראה.`,
  `- **מה עדיין לא הוכח:** שמישהו ישלם. זה נבדק רק מול לקוחות אמיתיים.`, '');
out.push(`## 10 ההזדמנויות המובילות — עם מסלול כסף וצעד ראשון`, '',
  `| # | גוף | מה צריך | מועד | מי משלם | מודל | הכנסה לנו (הערכה) | איך חושב | ימים לכסף | צעד ראשון | קישור |`, `|---|---|---|---|---|---|---|---|---|---|---|`);
for (const r of monetizableTp.slice(0, 10)) {
  const need = r.o.explicit_needs?.[0]?.need ?? r.o.predicted_needs[0]?.need ?? r.o.what_happened;
  out.push(`| ${r.o.id} | ${cell(r.o.entity)} | ${cell(need)} | ${r.o.deadline_at?.slice(0, 10) ?? '—'} | ${cell(r.b!.who_pays)} | ${r.b!.model} | ${ils(r.b!.our_revenue_ils)} | ${cell(r.b!.our_revenue_logic)} | ${r.b!.days_to_cash ?? '—'} | ${cell(r.b!.first_step)} | ${r.o.source_url} |`);
}
out.push('');

out.push(`## הזדמנויות מוצר / פער שוק (סינתזה על פני כל ההזדמנויות)`, '')
out.push(`> שמות חברות מתחרות שמופיעים בטקסט הגיעו מהמודל ו**לא אומתו** (חלקם, כמו Govini, כנראה לא רלוונטיים לישראל). מתחרים שכן אומתו במחקר: מכרזי ישראל ₪99/חודש, מאגרים ~₪89/חודש, OPENBIDS, יפעת מכרזים.`, '');
if (!insights.length) out.push('_לא הורצה סינתזה._', '');
for (const [i, x] of insights.entries()) {
  out.push(`### ${i + 1}. [${x.type}] ${x.title}`, `- **הדפוס:** ${x.pattern}`, `- **מבוסס על הזדמנויות:** ${x.supporting_opportunity_ids.map((n: number) => `#${n}`).join(', ')}`,
    `- **מי משלם / מודל:** ${x.who_pays} · ${x.revenue_model}`, `- **תמחור (הערכה):** ${x.price_point_logic}`, `- **מאמץ בנייה:** ${x.build_effort}`,
    `- **צעד ראשון:** ${x.first_step}`, `- **למה זה עלול להיכשל:** ${x.why_it_might_fail}`, '');
}

out.push(`## התאמה לפרופילי עסק (Matching)`, '');
const scorer = new WeightedMatchScorer();
for (const [name, input] of Object.entries(POC_PROFILES)) {
  const ms = scorer.score(opps, await buildProfile(input));
  const c = (v: string) => ms.filter((m) => (verdicts[m.opportunity.id]?.verdict ?? '') === v).length;
  out.push(`**${name}** — ${ms.length} התאמות (TP ${c('TP')}, UNCLEAR ${c('UNCLEAR')}, FP ${c('FP')})`, '');
  for (const m of ms.slice(0, 5)) out.push(`- ${m.score} · #${m.opportunity.id} [${verdicts[m.opportunity.id]?.verdict ?? '?'}] ${cell(m.opportunity.entity)} — ${cell(m.opportunity.what_happened).slice(0, 110)}`);
  out.push('');
}

out.push(`## Money Opportunities (פרויקט אח: money-opportunity-engine)`, '', `לא נבנה מחדש כאן. מצב שם: ${moneyLine}`, '');

out.push(`## כל ההזדמנויות`, '', `| # | פסיקה | גוף | אירוע | מסלול מוביל | הכנסה לנו | ניתן למונטיזציה? |`, `|---|---|---|---|---|---|---|`);
for (const r of rows) out.push(`| ${r.o.id} | ${r.v} | ${cell(r.o.entity)} | ${r.o.event_type} | ${r.b?.model ?? '—'} | ${ils(r.b?.our_revenue_ils)} | ${r.m ? (r.m.monetizable ? 'כן' : `לא — ${cell(r.m.why_not)}`) : 'לא נותח'} |`);
out.push('', `## מה לא נעשה (גבולות)`, '',
  `- לא נשלחה שום פנייה, לא נחתם שום הסכם, לא נגבה כסף. "עסקה → הכנסה" דורש אדם.`,
  `- הסכומים לא אומתו מול שוק. המבחן הבא: להציג 5–10 מההזדמנויות ל-5 ספקים אמיתיים ולשאול אם ישלמו וכמה.`,
  `- מקורות הנפח הגדול (OPENBIDS, mr.gov.il, MAYA) עדיין סגורים — טיוטות פניות ב-\`../טיוטות-פניות-רישוי.md\`.`);
writeFileSync('docs/OPPORTUNITY-REPORT.md', out.join('\n'));
console.log(`written docs/OPPORTUNITY-REPORT.md · opps ${opps.length} · TP ${tp.length} · monetizable TP ${monetizableTp.length} · insights ${insights.length} · monetized ${mon.size}`);
