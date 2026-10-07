import type { SourceConnector, RawSignal } from '../types.js';

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString();
/**
 * SYNTHETIC test data written by the developers to exercise the pipeline offline.
 * NOT real. Rows are flagged synthetic=1 and excluded from every "real" count and from the default UI.
 */
export class FixtureConnector implements SourceConnector {
  id = 'fixture:synthetic'; sourceType = 'fixture'; synthetic = true;
  async fetch(): Promise<RawSignal[]> {
    const now = new Date().toISOString();
    const mk = (n: number, source: string, title: string, text: string, ago: number, extra: Partial<RawSignal> = {}): RawSignal => ({
      source, source_type: 'fixture', source_url: `fixture://synthetic/${n}`, title, text, published_at: d(ago), fetched_at: now, entity_hint: null, location_hint: null, raw_metadata: { synthetic: true }, ...extra });
    return [
      mk(1, 'חדשות-דמו א', 'סופר-דמו פותחת סניף חדש בבאר שבע', 'רשת סופר-דמו הודיעה על פתיחת סניף חדש בבאר שבע בשטח של 1,200 מ"ר. הפתיחה צפויה בעוד חודשיים.', 3),
      mk(2, 'חדשות-דמו ב', 'סופר-דמו תפתח סניף בבאר שבע בקרוב', 'סופר-דמו מתכננת לפתוח סניף חדש בבאר שבע. הסניף יעסיק כ-60 עובדים.', 2),
      mk(3, 'חדשות-דמו ג', 'סטארטאפ-דמו גייס 25 מיליון דולר בסבב א׳', 'חברת סטארטאפ-דמו מתל אביב הודיעה על סבב גיוס הון בהובלת קרן השקעות. החברה תכפיל את צוות הפיתוח.', 5),
      mk(4, 'פורטל מכרזים דמו', 'עיריית דמוסיטי מפרסמת מכרז לשירותי ניקיון ואחזקה במוסדות חינוך', 'עיריית דמוסיטי מפרסמת מכרז לשירותי ניקיון ואחזקה בבתי ספר, בהיקף של 2 מיליון ₪ לשנה. הגשת הצעות עד ' + new Date(Date.now() + 20 * 864e5).toLocaleDateString('en-GB') + '.', 4, { entity_hint: 'עיריית דמוסיטי', location_hint: 'חיפה' }),
      mk(5, 'פורטל מכרזים דמו', 'משרד-דמו מבקש הצעות לבניית אתר אינטרנט חדש ומערכת ניהול תוכן', 'משרד-דמו מפרסם בקשה להצעות לבניית אתר אינטרנט חדש וקידום דיגיטלי. מועד אחרון להגשה ' + new Date(Date.now() + 12 * 864e5).toLocaleDateString('en-GB') + '.', 6, { entity_hint: 'משרד-דמו' }),
      mk(6, 'חדשות-דמו ד', 'בנייני-דמו מסרה מפתחות בפרויקט חדש בנתניה', 'חברת בנייני-דמו הודיעה על מסירת מפתחות ל-180 דירות בפרויקט חדש בנתניה. הפרויקט כולל לובי ושטחים משותפים.', 7),
      mk(7, 'חדשות-דמו ה', 'קופי-דמו משיקה אפליקציה חדשה לשירות לקוחות', 'רשת קופי-דמו משיקה אפליקציה חדשה. החברה מצפה לעומס פניות ומחפשת פתרון אוטומטי לשירות לקוחות.', 8),
      mk(8, 'חדשות-דמו ו', 'טכנו-דמו רוכשת את חברת דאטה-דמו', 'טכנו-דמו הודיעה על רכישת חברת דאטה-דמו בעסקה שהושלמה השבוע.', 9),
      mk(9, 'חדשות-דמו ז', 'מזג האוויר: שרב כבד צפוי בסוף השבוע', 'שרב כבד צפוי ברחבי הארץ בסוף השבוע עם טמפרטורות גבוהות.', 1),
      mk(10, 'חדשות-דמו ח', 'קליניקה-דמו פותחת קליניקה חדשה ברעננה', 'רשת קליניקה-דמו פותחת קליניקה חדשה ברעננה ומגייסת עשרות עובדים.', 400),
    ];
  }
}
