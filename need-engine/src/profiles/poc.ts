import type { ProfileInput } from '../engine/profile.js';
/** The three POC profiles requested for evaluation. */
export const POC_PROFILES: Record<string, ProfileInput> = {
  'ניקיון/פוליש': { description: 'חברת ניקיון ופוליש לעסקים: ניקיון סוף בנייה, פוליש ושטיפה, אחזקה שוטפת של משרדים, חנויות ומוסדות. פועלים בכל הארץ.', services: ['cleaning'], regions: ['כל הארץ'], customer_types: ['עסקים (B2B)', 'רשויות ומוסדות'], deal_min: 3000, deal_max: 300000 },
  'בניית אתרים/שיווק': { description: 'סוכנות לבניית אתרים, חנויות אונליין, מיתוג וקידום דיגיטלי לעסקים קטנים ובינוניים במרכז הארץ.', services: ['web_development', 'digital_marketing'], regions: ['מרכז'], customer_types: ['עסקים (B2B)'], deal_min: 4000, deal_max: 150000 },
  'AI/אוטומציות': { description: 'סטודיו לאוטומציות ו-AI לעסקים: צ׳אטבוטים לשירות לקוחות, אוטומציית תהליכים ושילוב בינה מלאכותית בארגון. עובדים מול חברות ברחבי הארץ.', services: ['ai_automation', 'software_dev'], regions: ['כל הארץ'], customer_types: ['עסקים (B2B)'], deal_min: 8000, deal_max: 250000 },
};
