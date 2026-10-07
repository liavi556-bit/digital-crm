import type { Logger } from './types.js';
const fmt = (lvl: string, msg: string, extra?: unknown) =>
  console.error(`${new Date().toISOString()} ${lvl} ${msg}${extra !== undefined ? ' ' + JSON.stringify(extra) : ''}`);
export const logger: Logger = {
  info: (m, e) => fmt('INFO ', m, e),
  warn: (m, e) => fmt('WARN ', m, e),
  error: (m, e) => fmt('ERROR', m, e),
};
