import type { BusinessProfile, LLMProvider, HttpClient } from '../types.js';
import { CATEGORIES, detectCategories, detectAllLocations } from './taxonomy.js';
import { parseJsonLoose } from '../providers/llm.js';
import { stripHtml } from '../providers/search.js';

export interface ProfileInput { url?: string; description?: string; services?: string[]; regions?: string[]; customer_types?: string[]; deal_min?: number; deal_max?: number }

const CUSTOMERS: [string, RegExp][] = [['עסקים (B2B)', /עסק|חברות|ארגונ|b2b|מסחרי/i], ['פרטיים', /פרטי|משפחות|דירות|בתים|b2c/i], ['רשויות ומוסדות', /רשויות|עירי|מוסדות|ממשל|מכרז/i]];

export async function buildProfile(input: ProfileInput, http?: HttpClient, llm?: LLMProvider | null): Promise<BusinessProfile> {
  let text = input.description ?? '';
  let name = input.url ? new URL(input.url).hostname : (text.split(/[.:\n]/)[0].split(' ').slice(0, 5).join(' ') || 'העסק שלי');
  if (input.url && http) {
    try {
      const html = await http.getText(input.url, { respectRobots: true });
      const title = html.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim();
      const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? '';
      text = `${title ?? ''}. ${meta}. ${stripHtml(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')).slice(0, 4000)}\n${text}`;
      if (title) name = title.slice(0, 60);
    } catch { /* fall back to description only */ }
  }
  if (llm && text.trim()) {
    try {
      const out = parseJsonLoose<Partial<BusinessProfile>>(await llm.complete({ json: true,
        system: `Build a BusinessProfile from a business description. Return ONLY JSON {"name":str,"services":[keys],"regions":[Israeli cities/regions or "כל הארץ"],"customer_types":[str]}. services keys must be from: ${CATEGORIES.map((c) => c.key).join(', ')}. Use only facts in the text.`,
        user: text.slice(0, 5000) }));
      const services = (out.services ?? []).filter((s) => CATEGORIES.some((c) => c.key === s));
      if (services.length) return finish({ name: out.name ?? name, services, regions: out.regions ?? [], customer_types: out.customer_types ?? [] });
    } catch { /* fall through to rules */ }
  }
  return finish({ name, services: detectCategories(text), regions: detectAllLocations(text), customer_types: CUSTOMERS.filter(([, r]) => r.test(text)).map(([n]) => n) });

  function finish(p: { name: string; services: string[]; regions: string[]; customer_types: string[] }): BusinessProfile {
    return {
      name: p.name, url: input.url ?? null, description: input.description ?? text.slice(0, 500),
      // explicit services are authoritative; keyword detection only fills in when none were given
      // (e.g. "ניקיון סוף בנייה" must not turn a cleaning company into a construction contractor)
      services: input.services?.length ? [...new Set(input.services)] : [...new Set(p.services)],
      regions: (input.regions?.length ? input.regions : p.regions).length ? (input.regions?.length ? input.regions : p.regions) : ['כל הארץ'],
      customer_types: input.customer_types?.length ? input.customer_types : p.customer_types,
      deal_min: input.deal_min ?? null, deal_max: input.deal_max ?? null,
    };
  }
}
