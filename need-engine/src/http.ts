import type { DB } from './db.js';
import type { HttpClient, Logger } from './types.js';
import { config } from './config.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polite HTTP client: per-host rate limit, retries with backoff, sqlite cache, robots.txt for HTML. */
export function createHttp(db: DB, log: Logger): HttpClient {
  const lastHit = new Map<string, number>();
  const robots = new Map<string, string[]>();

  async function throttle(host: string) {
    const wait = (lastHit.get(host) ?? 0) + config.httpMinIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastHit.set(host, Date.now());
  }

  async function robotsAllows(u: URL): Promise<boolean> {
    if (!robots.has(u.host)) {
      const dis: string[] = [];
      try {
        await throttle(u.host);
        const r = await fetch(`${u.protocol}//${u.host}/robots.txt`, { headers: { 'user-agent': config.userAgent }, signal: AbortSignal.timeout(10000) });
        if (r.ok) {
          let applies = false;
          for (const line of (await r.text()).split('\n')) {
            const [k, ...v] = line.split(':');
            const key = k.trim().toLowerCase(), val = v.join(':').trim();
            if (key === 'user-agent') applies = val === '*';
            else if (applies && key === 'disallow' && val) dis.push(val);
          }
        }
      } catch { /* robots unreachable -> allow */ }
      robots.set(u.host, dis);
    }
    return !robots.get(u.host)!.some((p) => u.pathname.startsWith(p));
  }

  const getText: HttpClient['getText'] = async (url, opts = {}) => {
    const ttl = (opts.ttlS ?? config.httpCacheTtlS) * 1000;
    const hit = db.prepare('SELECT body, fetched_at FROM http_cache WHERE url=?').get(url) as { body: string; fetched_at: number } | undefined;
    if (hit && Date.now() - hit.fetched_at < ttl) return hit.body;
    const u = new URL(url);
    if (opts.respectRobots && !(await robotsAllows(u))) throw new Error(`robots.txt disallows ${url}`);
    let lastErr: unknown;
    for (let attempt = 1; attempt <= config.httpRetries; attempt++) {
      try {
        await throttle(u.host);
        const res = await fetch(url, {
          headers: { 'user-agent': config.userAgent, accept: '*/*', ...opts.headers },
          signal: AbortSignal.timeout(20000),
        });
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
        if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} ${url}`), { permanent: true });
        const body = await res.text();
        db.prepare('INSERT OR REPLACE INTO http_cache(url, body, fetched_at) VALUES(?,?,?)').run(url, body, Date.now());
        return body;
      } catch (e) {
        lastErr = e;
        if ((e as { permanent?: boolean }).permanent) break;
        log.warn(`fetch attempt ${attempt}/${config.httpRetries} failed`, { url, err: String((e as Error).message) });
        await sleep(2 ** attempt * 500);
      }
    }
    // serve stale cache rather than fail hard
    if (hit) { log.warn('serving stale cache', { url }); return hit.body; }
    throw new Error(`fetch failed: ${url}: ${String((lastErr as Error)?.message ?? lastErr)}${(lastErr as Error)?.cause ? ' (' + String(((lastErr as Error).cause as Error).message) + ')' : ''}`);
  };

  return {
    getText,
    async getJson<T>(url: string, opts?: { ttlS?: number }) {
      return JSON.parse(await getText(url, { ...opts, headers: { accept: 'application/json' } })) as T;
    },
  };
}
