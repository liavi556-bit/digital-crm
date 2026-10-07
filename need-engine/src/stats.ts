import type { DB } from './db.js';
import { loadOpportunities } from './engine/pipeline.js';

export function pipelineStats(db: DB, synthetic: 0 | 1) {
  const q = (sql: string, ...a: any[]) => db.prepare(sql).all(...a) as any[];
  const bySource = q(`SELECT source_type, source, COUNT(*) raw,
      SUM(status='rejected') rejected, SUM(status='duplicate') duplicates, SUM(status='opportunity') opportunities, SUM(status='new') pending
      FROM raw_items WHERE synthetic=? GROUP BY source_type, source ORDER BY raw DESC`, synthetic);
  const reasons = q(`SELECT d.stage, d.verdict, d.reason, COUNT(*) n FROM decisions d JOIN raw_items r ON r.id=d.raw_id
      WHERE r.synthetic=? GROUP BY d.stage, d.verdict, d.reason ORDER BY d.stage, n DESC`, synthetic);
  const connectors = q(`SELECT connector, status, fetched, inserted, error, finished_at FROM connector_runs
      WHERE id IN (SELECT MAX(id) FROM connector_runs GROUP BY connector) ORDER BY connector`).filter((c) => synthetic ? c.connector.startsWith('fixture') : !c.connector.startsWith('fixture'));
  const raw = q('SELECT COUNT(*) n FROM raw_items WHERE synthetic=?', synthetic)[0].n;
  const signals = q('SELECT COUNT(*) n FROM signals s JOIN raw_items r ON r.id=s.raw_id WHERE r.synthetic=?', synthetic)[0].n;
  const opps = loadOpportunities(db, { includeSynthetic: !!synthetic }).filter((o) => o.synthetic === !!synthetic);
  const explicit = opps.filter((o) => o.explicit_need && !o.predicted_needs.length).length;
  const both = opps.filter((o) => o.explicit_need && o.predicted_needs.length).length;
  const predicted = opps.filter((o) => !o.explicit_need).length;
  return {
    synthetic: !!synthetic,
    totals: {
      raw_items: raw, rejected: bySource.reduce((a, s) => a + (s.rejected ?? 0), 0), signals,
      opportunities: opps.length, explicit_only: explicit, explicit_plus_predicted: both, predicted_only: predicted,
      duplicates_merged: bySource.reduce((a, s) => a + (s.duplicates ?? 0), 0), high_quality: opps.filter((o) => o.high_quality).length,
    },
    connectors, bySource, reasons,
  };
}

export function rawItemsWithDecisions(db: DB, synthetic: 0 | 1, status?: string, limit = 200) {
  const rows = db.prepare(`SELECT id, source, source_type, source_url, title, published_at, status FROM raw_items WHERE synthetic=? ${status ? 'AND status=?' : ''} ORDER BY id DESC LIMIT ${limit}`)
    .all(...(status ? [synthetic, status] : [synthetic])) as any[];
  const dec = db.prepare('SELECT stage, verdict, reason, detail FROM decisions WHERE raw_id=? ORDER BY id');
  return rows.map((r) => ({ ...r, decisions: dec.all(r.id) }));
}
