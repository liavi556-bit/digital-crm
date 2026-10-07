import type { Opportunity, BusinessProfile, Match, OpportunityScorer } from '../types.js';
import { CAT, regionOf } from './taxonomy.js';

const W = { service_fit: 0.35, location: 0.15, intent: 0.15, confidence: 0.15, freshness: 0.1, value: 0.1 };

export class WeightedMatchScorer implements OpportunityScorer {
  score(opps: Opportunity[], p: BusinessProfile): Match[] {
    const out: Match[] = [];
    for (const o of opps) {
      const matched: Match['matched_categories'] = [];
      if (o.explicit_need && p.services.includes(o.explicit_need.category)) matched.push({ category: o.explicit_need.category, kind: 'explicit', confidence: 1 });
      for (const n of o.predicted_needs) if (p.services.includes(n.category) && !matched.some((m) => m.category === n.category)) matched.push({ category: n.category, kind: 'predicted', confidence: n.confidence });
      if (!matched.length) continue;
      const best = matched.reduce((a, b) => (b.kind === 'explicit' ? b : a.kind === 'explicit' ? a : b.confidence > a.confidence ? b : a));
      const service_fit = best.kind === 'explicit' ? 1 : Math.min(0.9, best.confidence);

      const nationwide = p.regions.includes('כל הארץ');
      const pr = new Set(p.regions.flatMap((r) => [r, regionOf(r)].filter(Boolean) as string[]));
      let location = 0.5; // unknown location -> neutral
      if (nationwide) location = 1;
      else if (o.location) location = pr.has(o.location) || pr.has(regionOf(o.location) ?? '#') ? 1 : 0.1;

      const ageDays = o.published_at ? (Date.now() - +new Date(o.published_at)) / 864e5 : 30;
      const freshness = Math.pow(0.5, Math.max(0, ageDays) / 14);

      let value = 0.5, valueNote = 'שווי לא צוין במקור';
      const typ = CAT[best.category]?.typical_deal_ils;
      if (o.estimated_value) {
        const v = o.estimated_value.amount_ils;
        value = (p.deal_min == null || v >= p.deal_min) && (p.deal_max == null || v <= p.deal_max) ? 1 : 0.2;
        valueNote = `שווי שצוין במקור: ₪${v.toLocaleString('he-IL')}`;
      } else if (typ && (p.deal_min != null || p.deal_max != null)) {
        const overlap = (p.deal_max ?? Infinity) >= typ[0] && (p.deal_min ?? 0) <= typ[1];
        value = overlap ? 0.6 : 0.25;
        valueNote = 'טווח עסקה טיפוסי בקטגוריה (היוריסטי, לא הערכה לעסקה זו)';
      }
      const breakdown = { service_fit, location, intent: o.intent_score / 100, confidence: o.confidence_score / 100, freshness, value };
      const score = Math.round(100 * Object.entries(W).reduce((s, [k, w]) => s + w * (breakdown as any)[k], 0));
      const why = [
        best.kind === 'explicit' ? `צורך מפורש במקור בתחום ${CAT[best.category].he}` : `צורך חזוי בתחום ${CAT[best.category].he} (ציון מודל ${Math.round(best.confidence * 100)}%, לא סטטיסטיקה)`,
        o.location ? `מיקום: ${o.location}${location === 1 ? ' — תואם לאזורי הפעילות' : location < 0.5 ? ' — מחוץ לאזורי הפעילות' : ''}` : 'מיקום לא צוין',
        `טריות: ${ageDays < 1 ? 'היום' : `לפני ${Math.round(ageDays)} ימים`}`, valueNote,
      ];
      out.push({ opportunity: o, score, breakdown, why, matched_categories: matched });
    }
    return out.sort((a, b) => b.score - a.score);
  }
}
