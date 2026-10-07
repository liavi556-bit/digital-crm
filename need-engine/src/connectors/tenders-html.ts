import type { SourceConnector, RawSignal, ConnectorContext } from '../types.js';
import { stripHtml } from '../providers/search.js';
import { decode } from '../engine/llm-extract.js';
import { parseIlDate } from './ckan.js';

const txt = (html: string) => decode(stripHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')));
const iso = (d: Date | null) => (d ? d.toISOString() : null);

/**
 * Dekel "bids" — shared public-procurement board used by Jerusalem municipality, Netivei Ayalon, Israel Airports
 * Authority, Moriah, and others. robots.txt: none (2026-10-07). Only the PUBLIC list on the home page is read,
 * then each listed item page; IDs are never enumerated (non-public IDs redirect to a login).
 */
export class DekelBidsConnector implements SourceConnector {
  id = 'html:dekel-bids'; sourceType = 'html';
  private base = 'https://bids.dekel.co.il';
  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const list = await ctx.http.getText(`${this.base}/`, { respectRobots: true });
    const ids = [...new Set([...list.matchAll(/Item\.aspx\?ID=(\d+)/g)].map((m) => m[1]))];
    const now = new Date().toISOString();
    const out: RawSignal[] = [];
    for (const id of ids) {
      const url = `${this.base}/Item.aspx?ID=${id}`;
      try {
        const t = txt(await ctx.http.getText(url, { respectRobots: true }));
        const title = t.match(/(?:צפייה ב(?:מכרז|קול קורא)[^:]*:)?\s*([^]*?)\s+מכרז:\s/)?.[1]?.trim()
          ?? (list.match(new RegExp(`title="צפייה ב[^:]+:\\s*([^"]+)"[^>]*>[^<]*</a>`))?.[1] ?? '').trim();
        const card = list.slice(Math.max(0, list.indexOf(`ID=${id}"`) - 1500), list.indexOf(`ID=${id}"`));
        const cardTitle = decode(card.match(/<h3 class="my-0">([^<]+)<\/h3>(?![\s\S]*<h3)/)?.[1] ?? '').trim();
        const publisher = t.match(/מפרסם (?:ה)?(?:מכרז|קול קורא|הקול קורא)\s*:\s*(.+?)\s+(?:תיאור כללי|הגשת הצעות|מועד|מסמכים)/)?.[1]?.trim()
          ?? decode(card.match(/מפרסם\s+ה?(?:מכרז|קול קורא)[^:]*:\s*([^<]+)</)?.[1] ?? '').trim();
        const desc = t.match(/תיאור כללי[^:]*:\s*(.+?)\s+(?:הגשת הצעות החל|מפגש מציעים|מועד אחרון להגשת הצעות)/)?.[1] ?? '';
        const deadline = t.match(/מועד אחרון להגשת הצעות\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4}(?: \d{1,2}:\d{2})?)/)?.[1] ?? null;
        // publication date is not shown; the earliest uploaded tender-document date is the best stated proxy
        const docDates = [...t.matchAll(/\.pdf\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi)].map((m) => parseIlDate(m[1])).filter(Boolean) as Date[];
        const published = docDates.length ? new Date(Math.min(...docDates.map((d) => +d))) : null;
        const name = cardTitle || title;
        out.push({
          source: 'Dekel bids (public tenders board)', source_type: 'html', source_url: url,
          title: name, text: [publisher && `מפרסם: ${publisher}`, desc && `תיאור: ${desc}`, deadline && `מועד אחרון להגשת הצעות: ${deadline}`].filter(Boolean).join('. '),
          published_at: iso(published), fetched_at: now, entity_hint: publisher || null, location_hint: null,
          raw_metadata: { list_url: `${this.base}/`, deadline_raw: deadline, date_basis: published ? 'earliest_document_upload' : 'none' },
        });
      } catch (e) { ctx.log.warn('dekel item failed', { url, err: String((e as Error).message) }); }
    }
    return out;
  }
}

/** Haifa municipality tenders table (static ASP.NET page). robots.txt on www2: 404 (2026-10-07). */
export class HaifaTendersConnector implements SourceConnector {
  id = 'html:haifa-muni-tenders'; sourceType = 'html';
  private url = 'https://www2.haifa.muni.il/Michrazim/Default.aspx';
  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const html = await ctx.http.getText(this.url, { respectRobots: true });
    const rows = html.split(/<tr[^>]*>\s*<td[^>]*>\s*<font color="Black">/).slice(1);
    const now = new Date().toISOString();
    return rows.map((r): RawSignal | null => {
      const t = txt(r).replace(/×.*$/, '').trim(); // drop the e-mail registration modal
      const m = t.match(/^(\S+)\s+(\d{4}\s*\/\s*\d+)\s+(.+?)\s+ת\. העלאה:\s*(\S+)\s+ת\. אחרון להגשה:\s*(\S+)/);
      if (!m) return null;
      const pdf = r.match(/href="(https?:\/\/www2\.haifa\.muni\.il\/Michrazim\/TendersFiles\/[^"]+)"/)?.[1]?.replace(/^http:/, 'https:');
      const [, kind, num, title, uploaded, deadline] = m;
      return {
        source: 'Haifa municipality tenders', source_type: 'html', source_url: pdf ?? `${this.url}#${num.replace(/\s/g, '')}`,
        title, text: `סוג: ${kind}. מספר מכרז: ${num}. מפרסם: עיריית חיפה. ת. העלאה: ${uploaded}. מועד אחרון להגשה: ${deadline}`,
        published_at: iso(parseIlDate(uploaded)), fetched_at: now, entity_hint: 'עיריית חיפה', location_hint: 'חיפה',
        raw_metadata: { list_url: this.url, tender_no: num, kind },
      };
    }).filter((x): x is RawSignal => !!x);
  }
}

/**
 * Tel Aviv-Yafo GIS, layer 499 "אתרי בניה" (construction sites with works-start approval and permit holders).
 * ArcGIS REST, no robots.txt (404). Privacy: rows are kept only if a permit holder is an organisation
 * (company/partnership/association/public body); private individuals' names are never stored.
 */
export class TlvConstructionSitesConnector implements SourceConnector {
  id = 'gis:tlv-construction-sites'; sourceType = 'gis';
  constructor(private days = 120) {}
  static ORG = /בע"?מ|בעמ|חברה|חברת|שותפות|עמותה|עירי|רשות|קבוצת|ltd|limited/i;
  async fetch(ctx: ConnectorContext): Promise<RawSignal[]> {
    const since = new Date(Date.now() - this.days * 864e5).toISOString().slice(0, 10);
    const q = new URLSearchParams({ where: `tr_tchilat_avoda >= DATE '${since}'`, returnGeometry: 'false', orderByFields: 'tr_tchilat_avoda DESC', f: 'json',
      outFields: 'tik_tipul,tr_tchilat_avoda,matzav_bniya,shimush,sug_bakasha,tochen_bakasha,ktovet,baalei_heter,url_archion_tik,status_pikuach' });
    const url = `https://gisn.tel-aviv.gov.il/arcgis/rest/services/IView2/MapServer/499/query?${q}`;
    const j = await ctx.http.getJson<{ features?: { attributes: Record<string, any> }[]; error?: unknown }>(url);
    if (!j.features) throw new Error(`arcgis error ${JSON.stringify(j.error).slice(0, 200)}`);
    const now = new Date().toISOString();
    const seen = new Set<string>();
    const out: RawSignal[] = [];
    for (const { attributes: a } of j.features) {
      const orgs = String(a.baalei_heter ?? '').split(/\s*,\s*/).map((s) => s.trim()).filter((s) => TlvConstructionSitesConnector.ORG.test(s));
      if (!orgs.length || seen.has(a.tik_tipul)) continue; // private holders only -> skipped, nothing stored
      seen.add(a.tik_tipul);
      const d = a.tr_tchilat_avoda ? new Date(a.tr_tchilat_avoda) : null;
      const day = d ? d.toISOString().slice(0, 10).split('-').reverse().join('/') : '';
      const address = String(a.ktovet ?? '').replace(/\s+/g, ' ').trim().replace(/,$/, '');
      out.push({
        source: 'Tel Aviv-Yafo GIS: construction sites (layer 499)', source_type: 'gis',
        // url_archion_tik is an INTRANET link (http://handasa-archive/...) - not reachable publicly; use the public record query
        source_url: `https://gisn.tel-aviv.gov.il/arcgis/rest/services/IView2/MapServer/499/query?where=${encodeURIComponent(`tik_tipul='${a.tik_tipul}'`)}&outFields=*&returnGeometry=false&f=html`,
        // title is COMPOSED from record fields (no free text exists in the record)
        title: `אישור התחלת עבודות ${day}: ${String(a.sug_bakasha ?? '').trim()} — ${address}, תל אביב-יפו`,
        text: [`בעלי היתר (גופים): ${orgs.join(', ')}`, `כתובת: ${address}`, `שלב בנייה: ${a.matzav_bniya ?? ''}`, `סטטוס: ${a.status_pikuach ?? ''}`,
          `מהות: ${a.sug_bakasha ?? ''}`, `שימוש: ${a.shimush ?? ''}`, `תוכן הבקשה: ${String(a.tochen_bakasha ?? '').replace(/\s+/g, ' ')}`, `תאריך אישור התחלת עבודות: ${day}`].join('. '),
        published_at: d ? d.toISOString() : null, fetched_at: now, entity_hint: orgs[0], location_hint: 'תל אביב',
        raw_metadata: { tik_tipul: a.tik_tipul, query_url: url, title_composed_from_fields: true, source_is_prefiltered: true },
      });
    }
    return out;
  }
}
