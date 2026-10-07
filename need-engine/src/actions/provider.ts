import type { ActionProvider, ActionDraft, Opportunity, BusinessProfile, LLMProvider } from '../types.js';
import { CAT } from '../engine/taxonomy.js';

/** POC resolver: drafts only. execute() NEVER sends anything — external actions need explicit user approval AND a real provider (future: email/WhatsApp/CRM). */
export class DraftActionProvider implements ActionProvider {
  id = 'draft-only';
  constructor(private llm: LLMProvider | null = null) {}

  async prepare(o: Opportunity, p: BusinessProfile, kind: ActionDraft['kind']): Promise<ActionDraft> {
    const cat = o.explicit_need?.category ?? p.services.find((s) => o.predicted_needs.some((n) => n.category === s)) ?? o.category;
    const need = o.explicit_need?.need ?? o.predicted_needs.find((n) => n.category === cat)?.need ?? CAT[cat]?.he ?? '';
    const steps = [
      `פתח וקרא את המקור: ${o.source_url}`,
      o.explicit_need ? 'ודא את תנאי הסף/מועד ההגשה במקור' : 'ודא עם הלקוח שהצורך אכן רלוונטי (הצורך חזוי, לא מפורש)',
      `מצא איש קשר מתאים ב-${o.entity} (אתר החברה / LinkedIn / מרכזיה)`,
      'שלח את הפנייה רק לאחר אישור שלך — המערכת לא שולחת דבר אוטומטית',
      'קבע תזכורת מעקב ל-3 ימי עסקים',
    ];
    const area = CAT[cat]?.he ?? need;
    let body = `שלום,\n\nראיתי ש${o.what_happened.replace(/\.$/, '')}${o.location ? ` (${o.location})` : ''}.\n` +
      `${o.explicit_need ? `נראה שמדובר בצורך בתחום ${area}.` : `לעיתים קרובות בנסיבות כאלה עולה צורך בתחום ${area}.`}\n\n` +
      `אנחנו עוסקים ב${p.services.map((s) => CAT[s]?.he).filter(Boolean).join(', ')}, ונשמח לשוחח ולהציע מענה מותאם.\n\nבברכה,\n${p.name}`;
    if (this.llm) {
      try {
        body = await this.llm.complete({ system: 'כתוב פנייה קצרה ומנומסת בעברית (עד 90 מילים) מספק לגוף. השתמש רק בעובדות שניתנו. אל תמציא פרטים. אל תבטיח מחירים.',
          user: `גוף: ${o.entity}\nאירוע: ${o.what_happened}\nראיה: ${o.evidence[0]?.quote}\nהצורך (${o.explicit_need ? 'מפורש' : 'חזוי'}): ${need}\nהספק: ${p.name} — ${p.description.slice(0, 300)}` });
      } catch { /* keep template */ }
    }
    return { kind, subject: `בנוגע ל${o.what_happened.slice(0, 60)}`, body, steps, status: 'draft_requires_approval' };
  }
  async execute(_d: ActionDraft, approved: boolean) {
    return { executed: false as const, note: approved ? 'אושר על ידי המשתמש. ב-POC לא מבוצעת שליחה — העתק את הטיוטה ושלח ידנית.' : 'לא אושר — לא בוצעה כל פעולה.' };
  }
}
