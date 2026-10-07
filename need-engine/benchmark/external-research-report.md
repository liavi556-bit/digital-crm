# Opportunity Density – דוח מאוחד

## חלק 1: מכרזים
# Opportunity Density: מכרזים, RFQ/RFP וקולות קוראים (עדיפות 1)
נבדק ב-07/10/2026, 19:15-20:00 IDT. הבדיקה רצה מה-box (curl בלבד, יציאה דרך AWS us-west-2 / Cloudflare, כלומר IP בארה"ב). לא נעשה שימוש בדפדפן, לא היה login ולא נעקף שום anti-bot.

## טבלת סיכום

| Source | Access method (URL מדויק + סוג: RSS/JSON/HTML/API בתשלום) | Commercial/legal status (robots + ToS) | Freshness (פריט אחרון + קצב) | Items inspected | Business events | Explicit needs | Predictive needs | Actionable | Density | Recommend YES/NO |
|---|---|---|---|---|---|---|---|---|---|---|
| **דקל מכרז**: פלטפורמה משותפת (עיריית ירושלים, נתיבי איילון, רש"ת, מוריה, חכ"ל בנימין, צוות תוכנית אב לתחבורה ירושלים) | HTML: `https://bids.dekel.co.il/` (רשימת הליכים פומביים פתוחים), דף פריט `https://bids.dekel.co.il/Item.aspx?ID={id}`, ודף לקוח למשל `/jerusalemMuni`. אין RSS/API | robots: אין קובץ (מחזיר HTML), כלומר אין הגבלה. אין anti-bot. ToS (`/Terms.aspx`): אין סעיף על סריקה או שימוש מסחרי, רק "© כל הזכויות שמורות לחברת דקל". שימוש מסחרי לא מוסדר, מומלץ אישור בכתב | פריט אחרון 07/10/2026. כ-8 פריטים חדשים בספטמבר. 18 פתוחים כרגע | 18 (כל הרשימה הפומבית) | 17 | 16 | 0 | 14 | **78%** | **YES** |
| **עיריית חיפה, מערכת מכרזים** | HTML סטטי: `https://www2.haifa.muni.il/Michrazim/Default.aspx`, PDF לכל מכרז ב-`/Michrazim/TendersFiles/{n}-2026First.pdf` (רק https) | robots: אין ב-www2 (404). ב-www.haifa.muni.il יש `User-agent: *` בלי Disallow. ToS: לא נבדק (לא נמצא מסמך תנאי שימוש, רק מדיניות פרטיות) | פריט אחרון הועלה 07/09/2026. כ-4-8 בחודש | 12 (כל הרשימה) | 12 | 8 | 0 | 8 | **67%** | **YES** |
| **מכבי, בקשות להצעות מחיר/מידע** | HTML: `https://www.maccabi4u.co.il/bids/`. כל הבקשות הפעילות מרונדרות בדף, עם PDF ב-`/media/...` | robots: `/bids/` ו-`/media/` מותרים. `Disallow: /umbraco/` חוסם את לשונית "מכרזים", את "טען עוד" ואת דפי הפרטים (לא השתמשתי בהם). ToS: "אין להעתיק, להציג, להפיץ, לשכפל או למסור לצד שלישי… ללא קבלת הסכמתה של מכבי מראש ובכתב" | פריט אחרון 30/09/2026. 7 מתוך 9 הפעילים פורסמו בספטמבר | 9 (כל הפעילים) | 9 | 9 | 0 | 9 | **100%** (נפח קטן) | **YES** (שימוש מסחרי באישור בכתב) |
| **mr.gov.il ilgstorefront** (פורטל מינהל הרכש הממשלתי החדש: משרדים ובתי חולים ממשלתיים כמו שיבא) | HTML: `https://www.mr.gov.il/ilgstorefront/he/p/{publication_no}`. יש sitemap רשמי ב-`/ilgstorefront/he/sitemap.xml` (לא נמשך). ההגשה דרך quickbid.gpa.gov.il | robots (`/ilgstorefront/robots.txt`): רק cart/checkout/my-account אסורים, **`Crawl-delay: 10`, `Visit-time: 0400-0845` UTC (07:00-11:45 IDT)**. נבדקתי ב-19:26 IDT, מחוץ לחלון, ולכן עצרתי אחרי פריט אחד. ToS: לא נבדק | פריט שנבדק: פורסם 09/09/2026, הגשה 14-19/10/2026 | 1 | 1 | 1 | 0 | 1 | n/a (מדגם 1) | **PENDING**: לדגום 20 פריטים מה-sitemap בתוך חלון ה-robots |
| רשות החדשנות, קולות קוראים | HTML: `https://innovationisrael.org.il/kol_kore/` (20 פתוחים עם מועדים) + RSS `.../kol_kore/feed/` (10 פריטים, הסדר לא כרונולוגי) | robots: `Disallow:` ריק, כלומר הכל מותר. ToS (`/termsofuse`): "אין להעתיק… ללא הסכמת הרשות מראש ובכתב… שימוש הוגן, שלא למטרות הפצה מסחרית… מותר" | פריט אחרון פורסם 16/09/2026, עודכן 05/10/2026 | 21 | 21 | 5 | 0 | 4 | 19% | NO: רוב הפריטים הם מענקים ולא רכש של הגוף. רק 4 קריאות להצטרפות למאגדים הן צורך מפורש של חברות מזוהות. ה-ToS אוסר הפצה מסחרית |
| אוניברסיטת תל אביב, מכרזים | HTML: `https://tenders.tau.ac.il/tenders` | robots: מותר עם `Crawl-delay: 10`. ToS: לא נבדק | מועד אחרון רחוק ביותר 29/11/2026. כ-1-3 בחודש | 20 | 20 | 20 | 0 | 4 | 20% | NO: הרשימה כוללת מכרזים שנסגרו. אפשר לסנן לפי "פעיל" ומועד, אבל הנפח קטן |
| בר-אילן, אגף תפעול | HTML: `https://tiful.biu.ac.il/michrazim` | robots: מותר. ToS: לא נבדק | פריט אחרון 09/09/2026 | 10 | 10 | 10 | 0 | 2 | 20% | NO: נפח קטן |
| טכניון, יחידת מכרזים | WP sitemap: `https://michrazim.technion.ac.il/wp-sitemap-posts-tenders-1.xml` (472 פריטים עם lastmod). ה-RSS מחזיר 500 | robots: מותר. ToS: לא נבדק | lastmod אחרון 23/09/2026. כ-2 בחודש | triage בלבד | - | - | - | - | <20% (משוער) | NO: נפח קטן. ה-sitemap שימושי כמוניטור זול |
| איכילוב, תאגיד הבריאות | HTML: `https://www.tasmc.org.il/all/michrazim-health-corp/`. ההגשה דרך משיק/SourcingVision | robots: `/all/` מותר. ToS: לא נבדק | 3 הליכים מפורסמים, 2 פתוחים (14/10/2026) | 3 | 3 | 3 | 0 | 2 | 67% (n=3) | NO: נפח זניח |

## מקורות שנבדקו ב-triage ונדחו (שורה לכל מקור)
**אגרגטורים מסחריים**
- **OPENBIDS** (openbids.co.il): robots מתיר ויש sitemap עם 3,983 URL ו-lastmod. מצהיר על 403 מקורות, 796 גופים ו-2,306 מכרזים פתוחים. אבל ה-ToS (28.07.2026) קובע: "ללא הסכמתנו מראש ובכתב, אסור: לקצור, לסרוק או לשאוב את השירות באמצעים אוטומטיים; להקים מאגר מתחרה, למכור מחדש…". NO לסריקה. מועמד טוב לשיחת רישוי (lifefoldapp@gmail.com).
- **מכרזי ישראל** (michrazim.org.il): מחיר מפורסם "₪99/חודש או ₪999/שנה", 14 יום ניסיון. ה-ToS אוסר "שימוש אוטומטי (scrapers, bots…) ללא אישור מפורש בכתב" ו"שימוש מסחרי בנתוני הפלטפורמה… ללא רישיון מתאים". כלומר אפשר רישוי, אבל אין API מפורסם.
- **RFP Cafe** (rfpcafe.com): חינמי, robots מתיר הכל חוץ מ-/api/. ה-ToS: "השימוש בשירות מיועד לשימוש עסקי סביר של משתמשים אנושיים" ו"ללא הסכמתנו מראש ובכתב, אסור:" (הרשימה לא מרונדרת ב-HTML). NO לאוטומציה בלי אישור.
- **יפעת מכרזים** (tenders.co.il / ifat.co.il): המחיר לא מפורסם (השירות דרך אנשי מכירות), ולא נמצא API פומבי. tenders.co.il מנתק את חיבור ה-TLS מה-IP האמריקאי.
- **מאגרים** (portal.maagarim.city, tenders.maagarim.city): מוצג דף challenge ("One moment, please…"), כלומר blocked. לפי תוצאות החיפוש המחיר הוא ₪89/חודש, אבל לא אומת בדף.
- **מכרזיה** (michraziya.co.il), **GOVO** (govo.co.il): Cloudflare, כלומר blocked.
- **Tendy** (tendy.co.il): robots מתיר, אבל המחיר מרונדר ב-JS ולא נבדק.
- **WizBid**: מכרזי רמ"י בלבד (מכירת קרקע, לא actionable), ו-`/tenders?` אסור ב-robots.
- **Pipeworx MCP** (israel_search_tenders): פרוקסי ל-data.gov.il /api/, שאסור ב-robots. לא השתמשתי.

**עיריות ורשויות**
- תל אביב (472 Access Denied); ירושלים (Akamai 403, אבל המכרזים שלה זמינים דרך דקל); נתניה, בני ברק, רחובות, בת ים, כפר סבא, הרצליה (Cloudflare challenge); ראשון לציון, אשדוד, באר שבע, חולון, אשקלון, בית שמש, חדרה, נצרת (ניתוק TLS, כנראה חסימה גאוגרפית ל-IP זר, או hostname שגוי); פתח תקווה (petah-tikva.muni.il לא קיים ב-DNS); רמת גן (`/tenders/` הוא SPA, אין רשימה סטטית). רשויות עם נתיב `/bids/` (בת ים, בית שמש) נראות כמו ספק אתרים משותף, אבל כולן מאחורי Cloudflare.
- ספקי SaaS למכרזים: **דקל** (YES, מעל). **Mashik/SourcingVision** (איכילוב, חח"י) דורש login. **Conwize**, **EasyBid** ו-**ONE City** הם מערכות סגורות בלי לוח ציבורי.

**חברות ממשלתיות**
- חח"י: הדף `.../tenders/active-tenders` מרונדר ב-JS, והתוכן מגיע מ-`/api/` שאסור ב-robots. NO.
- נתיבי ישראל (Incapsula); רכבת ישראל (403 "Page Capture"); מקורות (403); נתיבי איילון ורש"ת (האתרים חוסמים או נתקעים, אבל המכרזים שלהם זמינים דרך דקל); נמלי ישראל ונמל אשדוד (ניתוק TLS).
- נמל חיפה: ה-RSS ב-`/feed/?post_type=annonce` מותר אבל הפריט האחרון מ-2023, והדף `/tenders/` מרונדר ב-JS. NO.
- דואר ישראל: `services.israelpost.co.il/mihrazim.nsf/*` הוא מעטפת JS ריקה. NO.
- רפאל, תע"א: אין רשימת מכרזים פומבית באתר.

**אוניברסיטאות ובתי חולים**
- בן-גוריון: ב-`w3.bgu.ac.il/robots.txt` יש `User-agent: * / Disallow: /`, כלומר אסור. משכתי את דף הרשימה פעם אחת לפני שקראתי את ה-robots ולא השתמשתי בו.
- העברית: tenders.huji.ac.il מציג challenge, והאתר הראשי מנתק TLS. blocked.
- אוניברסיטת חיפה: tender.haifa.ac.il נגיש אבל הנפח קטן (לא נדגם).
- רייכמן: לא נמצא דף מכרזים.
- כללית (Incapsula); הדסה (Cloudflare); שיבא (`/general/employees/tenders` כמעט ריק, והמכרזים בפועל ב-mr.gov.il).

**ועדי בתים וחברות ניהול**: לא נמצא לוח פתוח. בקשות להצעות מחיר של ועדים וחברות ניהול נמצאות בתוך SaaS סגור (Build App, Madeus, EasyBid) בלי רשימה ציבורית.

## הערות
- **חסימה גאוגרפית**: חלק גדול מאתרי הרשויות שמתארחים בתשתית ממשלתית מנתקים חיבורים מ-IP זר. מנוע שרץ מ-IP ישראלי כנראה יגיע לעוד עיריות. זו לא עקיפה של anti-bot, אבל לא בדקתי את זה.
- **mr.gov.il ilgstorefront** הוא כנראה המקור החשוב ביותר לצרכים מפורשים ממשלתיים. ה-robots מתיר את דפי הפרסום ומפרסם sitemap, אבל דורש לגשת רק ב-07:00-11:45 IDT ובקצב של בקשה אחת ל-10 שניות. צריך לדגום 20 פריטים מחר בבוקר בתוך החלון.
- המדד של מקורות שמציגים רק הליכים פתוחים (דקל, מכבי) גבוה כמעט באופן מובנה. ברשימות של גוף בודד (אוניברסיטאות) יש גם הליכים סגורים, ולכן המדד בהן נמוך.
- לגבי ToS: אף אחד ממקורות ה-YES לא מתיר במפורש שימוש מסחרי. דקל שותק בנושא, חיפה לא פרסמה תנאי שימוש, ומכבי דורשת אישור בכתב.

## חלקים 2-4: היתרים, בורסה, פידים
# Opportunity Density – סעיפים 2, 3, 4 (נבדק 2026-10-07, שעון ישראל)

| Source | Access method (URL מדויק + סוג: RSS/JSON/HTML/API בתשלום) | Commercial/legal status (robots + ToS) | Freshness (פריט אחרון + קצב) | Items inspected | Business events | Explicit needs | Predictive needs | Actionable | Density | Recommend YES/NO |
|---|---|---|---|---|---|---|---|---|---|---|
| משרד העבודה – "אתרי בנייה פעילים", מראה עיריית חיפה | CSV (קובץ CKAN, לא /api/): https://opendata.haifa.muni.il/dataset/c179a8bf-6ca1-4502-8bbe-fbc6ce3c39df/resource/69844ee1-1868-410d-add2-a8e44d8bd47c/download/b072e36c-a53b-49e1-be08-4a608fcf4638.csv | robots: רק /api/ ועוד כמה נתיבים חסומים, נתיב ההורדה מותר. ToS: "Open Data Commons Open Database License (ODbL)" (מצוטט), כלומר שימוש מסחרי מותר עם ייחוס ו-share-alike | המטא-דאטה מראה "עדכון אחרון 4 פברואר, 2026" (442 שורות) מול 396 אתרים בחיפה במקור הלאומי ל-4.10.2026, כלומר המראה כנראה מיושן. אין תאריך ברמת השורה | 20 | 20 | 0 | 20 | 20* | 100%* | YES למקור הלאומי (ראו שורה הבאה). המראה עצמו מתאים להוכחת איכות בלבד, לא כמקור חי |
| משרד העבודה – "אתרי בנייה פעילים", המקור הלאומי (כל 10 הערים) | CSV: https://data.gov.il/dataset/bddf37d6-5300-4179-bc0b-f2577fbc3a30/resource/b072e36c-a53b-49e1-be08-4a608fcf4638/download/b072e36c-a53b-49e1-be08-4a608fcf4638.csv | robots: "Allow: / Disallow: /api/", כלומר נתיב ה-download מותר. ToS: govil.ai מציין "Other (Open)". את דף התנאים של data.gov.il לא הצלחתי לקרוא, אז לא נבדק | "נכון ל-4 באוקטובר 2026", 10,953 רשומות, עדכון יומי (י-ם 766, חיפה 396, ר"ג 319, פ"ת 276, ראשל"צ 251, אשדוד 242, הרצליה 200, ב"ש 177, נתניה 154) | 0 (חסום מה-box: CloudFront 403) | – | – | – | – | – | YES בתנאי שיש גישה מרשת ישראלית/רגילה (בלי עקיפה) |
| אשדוד GIS – portal/urben_renewal שכבה 0 "בקשות להיתר – תמ"א 38" | ArcGIS REST JSON: https://gis.ashdod.muni.il/arcgis/rest/services/portal/urben_renewal/MapServer/0/query | robots.txt לא קיים (404). ToS לא נבדק | 515 שורות. השדות: מספר בקשה, תאריכים, שלב, רחוב, גוש/חלקה. אין שם מבקש או יזם | triage (סכמה + 3 שורות) | – | 0 | – | 0 (אין גוף מזוהה) | ~0% | NO |
| ירושלים GIS (gisviewer.jerusalem.muni.il) | ArcGIS REST | חסום: 403 Access Denied (Akamai) | – | 0 | – | – | – | – | – | NO (חסום) |
| חיפה / באר שבע – אתרי Complot ("איתור בקשות") | HTML, טופס חיפוש: https://br7.complot.co.il/iturbakashot/ , https://haifa.complot.co.il/ | robots: WordPress/Yoast, הנתיבים מותרים. ToS לא נבדק | חיפוש לפי בקשה בלבד, אין רשימה או פיד | 0 | – | – | – | – | – | NO (אין רשימה פתוחה) |
| ראשל"צ, פ"ת, נתניה, הרצליה, ר"ג, חולון | לא נמצא ArcGIS REST ציבורי (בדקתי gis.<city>.muni.il ובחיפוש). לרובן יש צופי Complot GIS V5 קנייניים | – | – | 0 | – | – | – | – | – | NO (מכוסות דרך המקור הלאומי) |
| Geektime – פיד תגית "אקזיט" | RSS: https://www.geektime.co.il/tag/%D7%90%D7%A7%D7%96%D7%99%D7%98/feed/ | robots: רק /search/ חסום. ToS: "נאסר עלייך להעתיק, להפיץ... ללא קבלת הסכמתה מראש ובכתב", כלומר שימוש מסחרי בתוכן דורש אישור בכתב | אחרון ב-1.10.2026, כ-1.5 פריטים בשבוע (20 פריטים = 1.7–1.10) | 20 | 15 | 0 | 12 | 12 | 60% | YES (בכפוף ל-ToS) |
| GlobeNewswire – פיד ישראל | RSS: https://www.globenewswire.com/RssFeed/country/Israel | robots: /RssFeed/ לא חסום, /news-release/ מותר. ה-box לא מצליח להתחבר (Akamai), WebFetch עבד. ToS לא נבדק | אחרון ב-7.10.2026, כ-3 ביום | 20 | 16 | 0 | 5 | 5 | 25% | NO |
| TheMarker – /srv/tm-technation | RSS: https://www.themarker.com/srv/tm-technation | robots: /srv/ לא חסום. ToS לא נבדק | אחרון ב-7.10.2026, יומי | 20 | 5 | 0 | 2 | 2 | 10% | NO |
| TheMarker – /srv/tm-real-estate | RSS: https://www.themarker.com/srv/tm-real-estate | robots: /srv/ לא חסום. ToS לא נבדק | אחרון ב-7.10.2026, יומי | 20 | 3 | 0 | 0 | 0 | 0% | NO |
| TheMarker – tag RSS (cmlink/tag-rss-*) | RSS: https://www.themarker.com/cmlink/tag-rss-<tag-id> | robots: "Allow: /*cmlink/tag-rss-*". השרת מחזיר HTTP 403 (Varnish) מה-box | – | 0 | – | – | – | – | – | NO (חסום) |
| Globes – FeederNode 594 (טכנולוגיה) | RSS: https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=594 | robots: /webservice/ לא חסום. ToS לא נבדק | אחרון ב-7.10.2026, 15 פריטים | 15 | 5 | 0 | 3 | 3 | 20% | NO |
| Globes – FeederNode 821 (שיווק ופרסום) | RSS: https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=821 | כנ"ל | אחרון ב-7.10.2026, 15 פריטים | 15 | 6 | 0 | 2 | 2 | 13% | NO |
| ערוץ 10 (tv10) – נדל"ן | RSS: https://tv10.co.il/real-estate/feed/ | robots: "Disallow:" ריק, כלומר הכל מותר. ToS לא נבדק | אחרון ב-4.10.2026, כ-2 בשבוע (300 פריטים בפיד) | 20 | 10 | 0 | 6 | 6 | 30% | NO |
| IVC Data Feed | API/מנוי בתשלום: https://www.ivc-online.com/Products-and-Solutions | robots: האתר מותר (חוץ מ-/admin וכו'). מסחרי בתשלום | מתעדכן שוטף (סבבים, "Companies Actively Seeking Capital") | 0 (מאחורי login) | – | – | – | – | – | לשקול כרישוי בתשלום (לא נדגם) |
| Startup Nation Central / Finder | finder.startupnationcentral.org; https://startupnationcentral.org/feed/ | Finder: Cloudflare challenge (חסום). /feed/ מפנה לדף הבית | – | 0 | – | – | – | – | – | NO |
| FinSMEs – tag israel | RSS: https://www.finsmes.com/tag/israel/feed | robots מותר, אבל יש Cloudflare challenge | – | 0 | – | – | – | – | – | NO (חסום) |
| Bizportal | HTML בלבד (/rss מחזיר 404) | robots: "Allow: /" | – | 0 | – | – | – | – | – | NO (אין פיד צר) |
| מרכז הנדל"ן (nadlancenter) | HTML בלבד (/feed/ מחזיר 404) | robots מותר בעיקרו | – | 0 | – | – | – | – | – | NO |
| PR Newswire ישראל | HTML: https://www.prnewswire.com/il/news-releases/ | robots מותר | יומי | 0 (סקירה בלבד, תמהיל IR דומה ל-GNW) | – | – | – | – | – | NO (צפוי כמו GNW) |

\* בשורת המראה של חיפה: 20/20 זה ציון מבני. בכל שורה יש קבלן מבצע מזוהה (חברה) ופרויקט ספציפי. התאריך הוא תאריך עדכון המטא-דאטה (4.2.2026), לא תאריך לשורה, ולא בדקתי אם האתרים עדיין פעילים. במקור הלאומי (מעודכן יומית) הצפיפות צפויה להיות דומה.

קבצים: yes_buildingsites_moital_haifa_mirror.json, yes_geektime_exit_tag.json, rejected_sources.md, section3_licensing.md, tlv_terms.md

# סעיף 3 – רישוי דיווחי חברות ציבוריות (TASE/MAYA, MAGNA)

## TASE DATA HUB (הרשמי)
- מחירון רשמי (PDF, נקרא בפועל): https://content.tase.co.il/media/4imn13pz/2001_api_pricelist_2026_eng.pdf
  - "Data Products Price List of Tel Aviv Stock Exchange – Monthly Fee (excluding VAT)". "Prices are denominated in U.S dollars and are based on a monthly subscription".
  - **Market Announcements feed "MAYA"**: $145 לחודש לשימוש פנימי (Internal Use), $290 לחודש להפצה (Distribution). זמין דרך TASE DATA HUB (API).
  - מוצרים קשורים: Payments and Corporate Events ($375 פנימי / $2,000 הפצה), Interested Parties Transactions ($375 / $600), Board & Management ($145 / $215), Public Company Reports (PDF בלבד, $75 לשימוש פנימי).
- פורטל המפתחים: https://datahubapi.tase.co.il/ (Base URL לפי תיעוד צד ג': https://datawise.tase.co.il). כדי לגשת צריך חשבון מפתח, ליצור Application ולקבל apikey, ואז לבצע "Register" לכל מוצר. מוצרים חינמיים מאושרים אוטומטית, ואחרים "require manual approval from TASE". קריאה למוצר שלא נרשמת אליו מחזירה HTTP 403. (מקור: README של @skills-il/tase-mcp ב-npm, https://registry.npmjs.org/@skills-il/tase-mcp)
- מגבלה חשובה: בדף Data Vendors של TASE כתוב: "market data that is disseminated through third-party data vendors is intended solely for personal use of the recipient and no other commercial or other use is to be made of it, except in accordance with a license..." (https://www.tase.co.il/en/content/about/data_vendors). זה ציטוט מאינדקס החיפוש, כי הדף הוא SPA וה-curl החזיר שלד בלבד. כלומר, שימוש מסחרי במנוע דורש רישיון ישיר מ-TASE (מסלול Internal Use $145 לחודש, או Distribution אם מציגים ללקוחות).
- תנאי שימוש כלליים: https://www.tase.co.il/en/content/about/terms_of_service . לא נקרא (SPA), לא נבדק.
- מפיצים מורשים שאומתו:
  - IntelliTrade: "TASE have partnered with IntelliTrade as an official data vendor" (https://www.intellitrade.info/tel-aviv-stock-exchange). מחיר לא פורסם.
  - TNS: "status as a registered data vendor with TASE" (https://tnsi.com/resource/waypoint/tns-launches-market-data-services-for-tel-aviv-stock-exchange-press-release/, 6.12.2022). מתמקד בנתוני מסחר, לא בדיווחים. מחיר לא פורסם.
  - לפי סיכום חיפוש, ברשימת הספקים של TASE מופיעים גם Bloomberg, Refinitiv/LSEG ו-BMLL. לא אימתתי (הדף SPA).
  - Exsys DataBridge (https://www.exsys.co.il/edb-q-and-a) הופיע בחיפוש. האתר עובד ב-JS ולא אומת.
- הערה: דפי maya.tase.co.il לא נגעתי בהם (Incapsula, לפי הבריף).

## MAGNA (רשות ניירות ערך)
- www.magna.isa.gov.il: 403 עם reCAPTCHA מה-box. חסום, לא עקפתי.
- יש "פורטל מפיצי מידע" רשמי: https://portal.api.magna.isa.gov.il/ ("מגנא - פורטל מפיצי מידע"). בקוד הפורטל מופיעים קישורים ל-"מפיצי מידע (סביבת יצור)" בכתובת https://commercial.api.magna.isa.gov.il, וגם לסביבת בדיקות. הכניסה דורשת אימות OTP במייל/טלפון, תעודה דיגיטלית בתוקף לשנה, רשימת כתובות IP מורשות, "מדריך למתכנת", "סכמות JSON" ו"טבלאות פענוח XML".
- מסקנה: יש API מסחרי רשמי למפיצי מידע רשומים בלבד. תנאי ההצטרפות והמחיר לא פורסמו בשום מקום שמצאתי. צריך לפנות לרשות ני"ע (יחידת IT/מגנא).

## שורה תחתונה
המסלול הזול והרשמי הוא TASE DATA HUB, מוצר MAYA feed, ב-$145 לחודש + מע"מ (שימוש פנימי). כך מקבלים את כל הדיווחים המיידיים (זכייה במכרז, הסכם מהותי וכו') ב-API, ואז מסננים לפי סוג דיווח. אם מציגים תוכן ללקוחות צריך מסלול Distribution ב-$290 לחודש. MAGNA API פתוח רק למפיצים רשומים, והתנאים לא ציבוריים.

# תנאי שימוש – תל אביב (GIS / Open Data)
- פורטל המידע הפתוח, שאלות נפוצות (נקרא בפועל): https://opendatasource.tel-aviv.gov.il/he/Pages/FAQ.aspx
  - "מה אפשר לעשות עם הנתונים? ניתן לשתף את המידע ולעשות בו כל שימוש ובלבד שהוא עומד בתנאי בהתאם לרישיון השימוש של האתר."
  - "מובהר כי המידע מועמד לרשות הציבור על פי רישיון זה "כמות שהוא" (AS-IS)..."
- הגרסה האנגלית (נקרא בפועל): https://opendatasource.tel-aviv.gov.il/en/Pages/faq.aspx
  - "Under our data policies, you are free to share and adapt our data for any purpose, provided you give the appropriate credit."
  - robots של opendatasource: חוסם רק /_layouts/, /_vti_bin/, /_catalogs/
- שרת ה-GIS (gisn.tel-aviv.gov.il, שכבה 499 "אתרי בניה"): בשכבה "copyrightText": "" ולא מצאתי תנאי שימוש ייעודיים. robots.txt לא קיים (404).
- תנאי השימוש הכלליים של אתר העירייה (https://www.tel-aviv.gov.il/About/Pages/TermsofService.aspx) חסומים מה-box (472 Access Denied). לפי קטע מאינדקס החיפוש, הם אוסרים להעתיק או להפיץ את תוכן האתר "לכל מטרה, בין מסחרית ובין שאינה מסחרית" שחורגת מהמטרות המותרות. אלה תנאים לאתר, לא לפורטל הנתונים.
- מסקנה: מאגרי הפורטל מותרים לשימוש "לכל מטרה" עם ייחוס. לא אימתתי שהשכבה 499 עצמה מופיעה כמאגר בפורטל. אם היא זמינה רק דרך שרת ה-GIS, המצב המשפטי עמום, ומומלץ לבקש אישור ב-tlvopendata@tel-aviv.gov.il.

# מקורות שנדחו (שורה אחת לכל מקור)
- אשדוד GIS urben_renewal/0 (בקשות להיתר תמ"א 38): 515 שורות, אין שם מבקש או יזם (כתובת וגוש/חלקה בלבד), כלומר כמו שכבה 772 בת"א.
- אשדוד GIS (Map, ashdod_octopus): בשירותים יש רק שכבת רובעים, ואין שכבות היתרים.
- ירושלים GIS (gisviewer.jerusalem.muni.il): 403 Access Denied (Akamai). חסום, לא ניסיתי לעקוף.
- data.gov.il (קובץ download של buildingsites): robots מתיר את הנתיב, אבל ה-box מקבל CloudFront 403. חסום מהרשת שלנו, לא עקפתי.
- Complot (br7/haifa .complot.co.il): טופס חיפוש לפי בקשה, אין רשימה או פיד. rishonlezion.complot.co.il מחזיר 403.
- ראשל"צ/פ"ת/נתניה/הרצליה/ר"ג/חולון: לא נמצא ArcGIS REST ציבורי (gis.<city>.muni.il לא עונה), ויש רק צופי Complot GIS V5.
- פורטלי datacity (netanya/rishonlezion/jerusalem/kfar-saba/rehovot): אין מאגר אתרי בנייה או היתרים.
- פורטל חיפה – חיפוש "היתר": 0 מאגרים.
- TheMarker tag RSS (cmlink/tag-rss-*): מותר ב-robots, אבל השרת מחזיר HTTP 403 (Varnish) מה-box.
- TheMarker /srv/tm-technation: 10%. רוב הפריטים גלובליים או דעה.
- TheMarker /srv/tm-real-estate: 0%. צרכנות דיור, משפט ומכרזי קרקע.
- TheMarker /srv/tm-small-business: הפריט האחרון ממרץ 2026, תוכן טיפים. מת.
- Globes FeederNode 594 / 821: 20% / 13%. מדורים רחבים. ("נדל"ן" 607 כבר נבדק בבריף.)
- tv10 נדל"ן RSS: 30%. כחצי מהפריטים סטטיסטיקה, סלבס או חו"ל.
- GlobeNewswire ישראל: 25%. הרבה הודעות IR (כנסים, מחקר קליני) ומעט צורך רכש בישראל.
- PR Newswire ישראל: תמהיל IR דומה, לא דגמתי.
- Startup Nation Central: Finder מאחורי Cloudflare, ו-/feed/ מפנה לדף הבית.
- FinSMEs tag israel: Cloudflare challenge.
- Calcalistech /ctechnews/rss: 404. קבוצת כלכליסט מסומנת בבריף כחסומה (Akamai), אז לא המשכתי.
- Bizportal: אין RSS (/rss מחזיר 404). דפי HTML בלבד.
- nadlancenter.co.il: אין /feed/.
- IVC: מוצר בתשלום. אין פיד פתוח (דף data-feed מציג דוגמה ישנה מיולי). לא דגמתי, ואפשר לשקול רישוי.
- MAGNA (www.magna.isa.gov.il): 403 עם reCAPTCHA. חסום.
