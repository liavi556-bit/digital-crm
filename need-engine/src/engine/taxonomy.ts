import type { EventType } from '../types.js';

export interface Category { key: string; he: string; keywords: string[]; solutions: string[]; typical_deal_ils: [number, number] }
// typical_deal_ils is a coarse HEURISTIC band used only to sanity-check deal range fit; never shown as an estimate of a specific deal.
export const CATEGORIES: Category[] = [
  { key: 'cleaning', he: 'ניקיון ותחזוקה', keywords: ['ניקיון', 'ניקוי', 'פוליש', 'שטיפה', 'אחזקה', 'תחזוקה', 'חברת ניקיון', 'cleaning', 'janitorial'], solutions: ['חברת ניקיון', 'ניקיון סוף בנייה / פוליש', 'חוזה תחזוקה שוטפת'], typical_deal_ils: [2000, 150000] },
  { key: 'signage', he: 'שילוט', keywords: ['שילוט', 'שלט', 'שלטים', 'signage'], solutions: ['יצרן שילוט', 'שילוט חוץ/פנים', 'מיתוג חלל'], typical_deal_ils: [3000, 80000] },
  { key: 'internet_telecom', he: 'אינטרנט ותקשורת', keywords: ['אינטרנט', 'תקשורת', 'סיבים', 'טלפוניה', 'רשת תקשורת'], solutions: ['ספק אינטרנט עסקי', 'תשתיות רשת', 'מרכזיית ענן'], typical_deal_ils: [3000, 120000] },
  { key: 'local_advertising', he: 'פרסום מקומי', keywords: ['פרסום', 'פרסומת', 'שלטי חוצות', 'מדיה', 'קמפיין'], solutions: ['קמפיין מקומי', 'מדיה חוצות', 'פרסום ממומן'], typical_deal_ils: [5000, 200000] },
  { key: 'photography', he: 'צילום והפקה', keywords: ['צילום', 'סרטון', 'וידאו', 'הפקה', 'צלם'], solutions: ['צילום מוצר/חלל', 'סרטון תדמית', 'הפקת תוכן'], typical_deal_ils: [2000, 60000] },
  { key: 'web_development', he: 'בניית אתרים ואפליקציות', keywords: ['אתר', 'אתרים', 'בניית אתר', 'וורדפרס', 'אפליקציה', 'חנות אונליין', 'איקומרס', 'website', 'web development'], solutions: ['אתר תדמית / חנות אונליין', 'דף נחיתה', 'אפליקציה'], typical_deal_ils: [4000, 150000] },
  { key: 'digital_marketing', he: 'שיווק דיגיטלי ומיתוג', keywords: ['שיווק', 'שיווק דיגיטלי', 'קידום', 'מיתוג', 'יחסי ציבור', 'סושיאל', 'רשתות חברתיות', 'ממומן', 'seo', 'תוכן שיווקי', 'מותג'], solutions: ['ניהול קמפיינים', 'מיתוג ויחסי ציבור', 'קידום אורגני (SEO)'], typical_deal_ils: [3000, 200000] },
  { key: 'ai_automation', he: 'AI ואוטומציות', keywords: ['בינה מלאכותית', 'ai', 'אוטומציה', 'אוטומציות', 'צ׳אטבוט', "צ'אטבוט", 'צאטבוט', 'בוט', 'סוכן חכם', 'machine learning', 'למידת מכונה', 'דיגיטציה', 'תהליכים אוטומטיים', 'שירות לקוחות'], solutions: ['אוטומציית תהליכים', 'צ׳אטבוט שירות לקוחות', 'שילוב AI בתהליכי עבודה'], typical_deal_ils: [5000, 250000] },
  { key: 'it_support', he: 'IT וסייבר', keywords: ['תמיכה טכנית', 'מחשוב', 'it', 'סייבר', 'הגנת סייבר', 'ענן', 'תשתיות מחשוב', 'ציוד מחשוב'], solutions: ['שירותי IT מנוהלים', 'הקמת תשתית משרד', 'אבטחת מידע'], typical_deal_ils: [4000, 200000] },
  { key: 'security', he: 'אבטחה', keywords: ['אבטחה', 'מצלמות', 'שמירה', 'מערכות אבטחה', 'מאבטחים'], solutions: ['מצלמות ובקרת כניסה', 'שירותי שמירה'], typical_deal_ils: [4000, 150000] },
  { key: 'construction_fitout', he: 'שיפוץ, התאמות ועיצוב', keywords: ['שיפוץ', 'בנייה', 'בניה', 'אדריכלות', 'עיצוב פנים', 'ריהוט', 'מיזוג', 'חשמל', 'אינסטלציה', 'עבודות גמר', 'התאמות'], solutions: ['קבלן גמרים', 'עיצוב והלבשת חלל', 'ריהוט משרדי'], typical_deal_ils: [20000, 1000000] },
  { key: 'recruiting', he: 'גיוס והשמה', keywords: ['גיוס', 'השמה', 'כוח אדם', 'משאבי אנוש', 'מגייסים', 'דרושים'], solutions: ['חברת השמה', 'גיוס טכנולוגי', 'מיקור חוץ HR'], typical_deal_ils: [8000, 200000] },
  { key: 'legal_accounting', he: 'משפט וחשבונאות', keywords: ['משפטי', 'עורך דין', 'עורכי דין', 'רואה חשבון', 'הנהלת חשבונות', 'ייעוץ מס', 'רגולציה'], solutions: ['ליווי משפטי', 'הנהלת חשבונות', 'ייעוץ מס'], typical_deal_ils: [3000, 100000] },
  { key: 'logistics', he: 'לוגיסטיקה והובלה', keywords: ['הובלה', 'לוגיסטיקה', 'שילוח', 'אחסון', 'מחסן'], solutions: ['חברת הובלות', 'פתרון אחסון ולוגיסטיקה'], typical_deal_ils: [3000, 200000] },
  { key: 'training', he: 'הדרכה והכשרה', keywords: ['הדרכה', 'הכשרה', 'סדנה', 'סדנאות', 'קורס'], solutions: ['הכשרת עובדים', 'סדנאות ארגוניות'], typical_deal_ils: [3000, 100000] },
  { key: 'software_dev', he: 'פיתוח תוכנה', keywords: ['פיתוח תוכנה', 'מערכת ממוחשבת', 'crm', 'erp', 'תוכנה', 'מערכת מידע'], solutions: ['בית תוכנה', 'התאמת CRM/ERP'], typical_deal_ils: [15000, 800000] },
  { key: 'other', he: 'אחר', keywords: [], solutions: ['לפי הנדרש'], typical_deal_ils: [1000, 1000000] },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<string, Category>;

const kwHit = (norm: string, kw: string) =>
  /^[\x00-\x7f]+$/.test(kw) ? new RegExp(`(^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(norm) : norm.includes(kw);

export const norm = (s: string) => s.replace(/[֑-ׇ]/g, '').replace(/[״"]/g, '"').replace(/[׳’`´]/g, "'").toLowerCase();

export function detectCategories(text: string): string[] {
  const n = norm(text);
  return CATEGORIES.filter((c) => c.keywords.some((k) => kwHit(n, norm(k)))).map((c) => c.key);
}

// ---- Event playbooks: event -> predicted needs. Confidences are heuristic priors (model-style scores), NOT statistics. ----
export interface Playbook {
  type: EventType; patterns: RegExp[]; base_confidence: number; intent: number; horizon_days: number;
  needs: { category: string; need: string; confidence: number; rationale: string }[];
}
export const PLAYBOOKS: Playbook[] = [
  { type: 'TENDER_PUBLISHED', base_confidence: 0.8, intent: 90, horizon_days: 30,
    // whole-word, optional ו/ה/ב/ל/מ/ש/כ prefix: "המכרזנית" (auctioneer) is not "מכרז"
    patterns: [/(?<![א-ת])[והבלמשכ]{0,2}מכרז(?:ים|י|ה|ו)?(?![א-ת])/, /קול קורא/, /בקשה להצעות/, /הזמנה להציע הצעות/, /הליך תחרותי/, /\brfp\b/i, /\brfi\b/i],
    needs: [] },
  { type: 'NEW_LOCATION', base_confidence: 0.7, intent: 70, horizon_days: 60,
    patterns: [/(פותח|פותחת|תפתח|יפתח|נפתח|נפתחה|פתיחת|פתחה|פתחו|עוברת|עבר|מעבירה|מעביר).{0,25}(סניף|חנות|מרכז|משרד|קליניקה|מסעדה|מפעל|אולם|בית ?קפה|מחסן|מרכז לוגיסטי|אתר)/, /(סניף|חנות|משרדים|מפעל|מרכז לוגיסטי) חדש/],
    needs: [
      { category: 'signage', need: 'שילוט לסניף/לחלל החדש', confidence: 0.85, rationale: 'חלל חדש מחייב שילוט חוץ ופנים לפני פתיחה' },
      { category: 'internet_telecom', need: 'אינטרנט ותקשורת בחלל החדש', confidence: 0.85, rationale: 'כל אתר חדש דורש קו אינטרנט וטלפוניה' },
      { category: 'cleaning', need: 'ניקיון/פוליש לפני פתיחה ותחזוקה שוטפת', confidence: 0.8, rationale: 'ניקיון סוף עבודות והמשך תחזוקה' },
      { category: 'local_advertising', need: 'פרסום מקומי לפתיחה', confidence: 0.7, rationale: 'עסקים חדשים מפרסמים פתיחה באזור' },
      { category: 'security', need: 'מצלמות ואבטחה', confidence: 0.55, rationale: 'התקנת אבטחה בסניפים חדשים נפוצה' },
      { category: 'photography', need: 'צילום החלל/המוצרים', confidence: 0.5, rationale: 'תוכן לאתר ולרשתות לקראת פתיחה' },
      { category: 'web_development', need: 'עדכון אתר/דף סניף', confidence: 0.45, rationale: 'הוספת הסניף החדש לנוכחות הדיגיטלית' },
    ] },
  { type: 'FUNDING_ROUND', base_confidence: 0.7, intent: 70, horizon_days: 75,
    patterns: [/גייס(ה|ו)? .{0,40}(מיליון|מיליארד)/, /סבב (גיוס|השקעה)/, /גיוס הון/, /(raised|funding round|series [a-d])/i, /השקעה של .{0,20}(מיליון|מיליארד)/],
    needs: [
      { category: 'recruiting', need: 'גיוס עובדים בהיקף גדל', confidence: 0.85, rationale: 'חברות שגייסו הון מרחיבות צוותים' },
      { category: 'digital_marketing', need: 'שיווק ומיתוג להאצת צמיחה', confidence: 0.7, rationale: 'הון מוקצה לצמיחה ולהגברת חשיפה' },
      { category: 'ai_automation', need: 'אוטומציה ויעילות תפעולית', confidence: 0.55, rationale: 'התרחבות מעלה צורך בתהליכים אוטומטיים' },
      { category: 'construction_fitout', need: 'משרדים גדולים יותר/התאמות', confidence: 0.5, rationale: 'צמיחת צוות מחייבת שטח' },
      { category: 'legal_accounting', need: 'ליווי משפטי ופיננסי', confidence: 0.6, rationale: 'סבב גיוס כרוך במסמכים והתאמות משפטיות' },
      { category: 'web_development', need: 'רענון אתר ומוצר', confidence: 0.45, rationale: 'חשיפה למשקיעים/לקוחות חדשים' },
    ] },
  { type: 'HIRING_SURGE', base_confidence: 0.6, intent: 55, horizon_days: 45,
    patterns: [/(מגייס|מגייסת|מחפש|מחפשת|תגייס|יגייס).{0,25}(עובדים|מאות|עשרות|אלפי|מפתחים|צוות)/, /גיוס המוני/],
    needs: [
      { category: 'recruiting', need: 'השמה וגיוס', confidence: 0.8, rationale: 'גיוס מוצהר בהיקף משמעותי' },
      { category: 'it_support', need: 'ציוד ותשתית IT לעובדים חדשים', confidence: 0.55, rationale: 'כל עובד חדש דורש ציוד וחשבונות' },
      { category: 'training', need: 'הדרכת קליטה', confidence: 0.45, rationale: 'קליטה של עובדים חדשים' },
    ] },
  { type: 'NEW_COMPANY', base_confidence: 0.55, intent: 55, horizon_days: 90,
    patterns: [/(הוקמה|נרשמה|התאגדה) חברה/, /חברה חדשה/, /תאגיד חדש/, /רישום חברה/],
    needs: [
      { category: 'web_development', need: 'אתר ונוכחות דיגיטלית ראשונית', confidence: 0.7, rationale: 'עסק חדש צריך אתר' },
      { category: 'digital_marketing', need: 'מיתוג ושיווק התחלתי', confidence: 0.65, rationale: 'בניית מותג והשגת לקוחות ראשונים' },
      { category: 'legal_accounting', need: 'הנהלת חשבונות וליווי משפטי', confidence: 0.7, rationale: 'חברה חדשה חייבת בדיווח וחשבונאות' },
      { category: 'ai_automation', need: 'אוטומציה בסיסית של תהליכים', confidence: 0.35, rationale: 'הקמת תהליכי עבודה מההתחלה' },
    ] },
  { type: 'PRODUCT_LAUNCH', base_confidence: 0.6, intent: 60, horizon_days: 45,
    patterns: [/(משיק|משיקה|השיקה|השיק|תשיק|ישיק|השקת).{0,25}(מוצר|שירות|אפליקציה|אתר|פלטפורמה|קו|מותג|מערכת)/],
    needs: [
      { category: 'digital_marketing', need: 'קמפיין השקה', confidence: 0.8, rationale: 'השקה מצריכה חשיפה' },
      { category: 'photography', need: 'צילום ותוכן להשקה', confidence: 0.65, rationale: 'חומרי שיווק למוצר חדש' },
      { category: 'web_development', need: 'דף נחיתה/אתר למוצר', confidence: 0.6, rationale: 'יעד לתנועה מהקמפיין' },
      { category: 'ai_automation', need: 'אוטומציית שירות לקוחות', confidence: 0.4, rationale: 'עומס פניות צפוי אחרי השקה' },
    ] },
  { type: 'EXPANSION', base_confidence: 0.6, intent: 60, horizon_days: 60,
    patterns: [/(מרחיבה|מרחיב|הרחבת|תרחיב|יתרחב).{0,30}(פעילות|שוק|שווקים|מפעל|קו ייצור|חו"ל|אירופה|ארה"ב)/, /כניסה לשוק/],
    needs: [
      { category: 'logistics', need: 'לוגיסטיקה והובלה', confidence: 0.6, rationale: 'הרחבה כרוכה בהעברת סחורה/ציוד' },
      { category: 'digital_marketing', need: 'שיווק בשוק החדש', confidence: 0.65, rationale: 'הצגת המותג בשוק חדש' },
      { category: 'recruiting', need: 'גיוס עובדים', confidence: 0.55, rationale: 'הרחבה כרוכה בכוח אדם' },
      { category: 'legal_accounting', need: 'ליווי רגולטורי ומשפטי', confidence: 0.55, rationale: 'התאמה לרגולציה בשוק חדש' },
    ] },
  { type: 'MERGER_ACQUISITION', base_confidence: 0.6, intent: 55, horizon_days: 90,
    patterns: [/(רכשה|רוכשת|תרכוש|מיזוג|התמזגה|מתמזגת|הושלמה (העסקה|רכישת))/, /רכישת .{0,30}(חברת|חברה)/],
    needs: [
      { category: 'it_support', need: 'איחוד מערכות ותשתיות IT', confidence: 0.7, rationale: 'מיזוג דורש איחוד מערכות' },
      { category: 'legal_accounting', need: 'ליווי משפטי ופיננסי לאחר העסקה', confidence: 0.75, rationale: 'התחייבויות לאחר סגירה' },
      { category: 'digital_marketing', need: 'מיתוג מחדש/תקשורת', confidence: 0.55, rationale: 'מסרים ללקוחות ולשוק' },
      { category: 'signage', need: 'שילוט ומיתוג חדשים', confidence: 0.4, rationale: 'החלפת מיתוג בסניפים' },
    ] },
  { type: 'CONSTRUCTION_PROJECT', base_confidence: 0.6, intent: 55, horizon_days: 90,
    patterns: [/(מסירת מפתחות|אכלוס|היתר בנייה|היתר בניה|הנחת אבן פינה|הושלמה בניית|נחנך|חנוכת|פרויקט חדש)/],
    needs: [
      { category: 'cleaning', need: 'ניקיון סוף בנייה / פוליש', confidence: 0.8, rationale: 'סיום בנייה מחייב ניקיון יסודי וליטוש' },
      { category: 'signage', need: 'שילוט', confidence: 0.6, rationale: 'שילוט לפרויקט/לדיירים' },
      { category: 'security', need: 'אבטחה ובקרת כניסה', confidence: 0.5, rationale: 'מערכות לפרויקט חדש' },
      { category: 'construction_fitout', need: 'התאמות וגמרים', confidence: 0.55, rationale: 'עבודות גמר והתאמות דיירים' },
    ] },
  { type: 'REBRAND', base_confidence: 0.6, intent: 60, horizon_days: 60,
    patterns: [/(מיתוג מחדש|שינוי שם|לוגו חדש|זהות מותגית חדשה|ריברנדינג)/i],
    needs: [
      { category: 'signage', need: 'החלפת שילוט', confidence: 0.8, rationale: 'מיתוג חדש מחליף שילוט' },
      { category: 'web_development', need: 'עדכון אתר', confidence: 0.75, rationale: 'אתר חייב להתאים למותג' },
      { category: 'digital_marketing', need: 'קמפיין מיתוג', confidence: 0.7, rationale: 'הכרזה על המותג החדש' },
    ] },
];

export const CITIES = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 'חולון', 'בני ברק', 'רמת גן', 'אשקלון', 'רחובות', 'בת ים', 'הרצליה', 'כפר סבא', 'חדרה', 'מודיעין', 'לוד', 'רעננה', 'רמלה', 'נס ציונה', 'קריית גת', 'עכו', 'נהריה', 'טבריה', 'אילת', 'עפולה', 'כרמיאל', 'נצרת', 'קריית שמונה', 'צפת', 'הוד השרון', 'יבנה', 'דימונה', 'נתיבות', 'שדרות', 'אופקים', 'עפולה', 'בית שמש', 'אור יהודה', 'גבעתיים', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'מעלה אדומים', 'יהוד', 'ראש העין', 'רמת השרון', 'קיסריה', 'זכרון יעקב', 'עומר', 'להבים', 'ערד', 'מצפה רמון', 'יקנעם', 'מגדל העמק', 'בית שאן', 'אריאל', 'מודיעין עילית', 'ביתר עילית'];
const REGION: Record<string, string[]> = {
  'דרום': ['באר שבע', 'אשדוד', 'אשקלון', 'קריית גת', 'אילת', 'דימונה', 'נתיבות', 'שדרות', 'אופקים', 'ערד', 'מצפה רמון', 'עומר', 'להבים', 'יבנה'],
  'צפון': ['חיפה', 'עכו', 'נהריה', 'טבריה', 'עפולה', 'כרמיאל', 'נצרת', 'קריית שמונה', 'צפת', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'יקנעם', 'מגדל העמק', 'בית שאן', 'זכרון יעקב', 'קיסריה'],
  'מרכז': ['תל אביב', 'ראשון לציון', 'פתח תקווה', 'נתניה', 'חולון', 'בני ברק', 'רמת גן', 'רחובות', 'בת ים', 'הרצליה', 'כפר סבא', 'חדרה', 'מודיעין', 'לוד', 'רעננה', 'רמלה', 'נס ציונה', 'הוד השרון', 'אור יהודה', 'גבעתיים', 'יהוד', 'ראש העין', 'רמת השרון', 'מודיעין עילית'],
  'ירושלים והסביבה': ['ירושלים', 'בית שמש', 'מעלה אדומים', 'ביתר עילית'],
};
export function regionOf(place: string | null): string | null {
  if (!place) return null;
  for (const [r, cs] of Object.entries(REGION)) if (r === place || cs.includes(place)) return r;
  return null;
}
export function detectLocation(text: string): string | null {
  const hit = CITIES.map((c) => ({ c, i: text.indexOf(c) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i)[0];
  return hit?.c ?? null;
}
export function detectAllLocations(text: string): string[] {
  const out = CITIES.filter((c) => text.includes(c));
  for (const r of Object.keys(REGION)) if (text.includes(r)) out.push(r);
  if (/כל הארץ|ארצי|בפריסה ארצית/.test(text)) out.push('כל הארץ');
  return [...new Set(out)];
}
