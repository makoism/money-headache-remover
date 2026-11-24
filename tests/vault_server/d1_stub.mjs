/* A small stand-in for Cloudflare D1 over node's own SQLite (node 22: node:sqlite), so the vault handlers run here with a
   real SQL engine and no wrangler. It copies the D1 calls the server uses: prepare(sql).bind(...).first() / .run() / .all(),
   and db.batch([...]) as one transaction (D1 runs a batch all or nothing). */
import { DatabaseSync } from 'node:sqlite';

export function makeD1(file = ':memory:') {
  const raw = new DatabaseSync(file);
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    async first(col) { const r = raw.prepare(sql).get(...args); return r === undefined ? null : col ? r[col] : Object.assign({}, r); },
    async all() { return { results: raw.prepare(sql).all(...args).map(r => Object.assign({}, r)), success: true }; },
    async run() { const r = raw.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes) } }; },
    _exec() { const p = raw.prepare(sql); if (/^\s*(select|with)|returning/i.test(sql)) return { results: p.all(...args) }; p.run(...args); return { results: [] }; },
  });
  return {
    raw,
    prepare: sql => stmt(sql),
    async batch(list) {
      raw.exec('BEGIN');
      try { const out = list.map(s => s._exec()); raw.exec('COMMIT'); return out; }
      catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
}

/* the live database as it stands before this change (functions/_lib.js ensureSchema at 38.28) */
export const TODAY_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS usage (day TEXT NOT NULL, k TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0, tokens INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`,
  `CREATE TABLE IF NOT EXISTS vault (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, blob TEXT NOT NULL, iv TEXT NOT NULL, rev INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_at INTEGER NOT NULL, prev_blob TEXT, prev_iv TEXT, prev_rev INTEGER, size INTEGER NOT NULL DEFAULT 0, writes_day TEXT, writes INTEGER NOT NULL DEFAULT 0)`,
];
