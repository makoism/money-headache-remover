/* A stand-in for Cloudflare D1 made from node's own SQLite, so the vault server can be tested in plain node with no wrangler.
   It covers only what functions/ uses: prepare().bind().first() / .all() / .run(), and batch() as one transaction.
   Also: call(), which sends one request straight to the vault handlers. Test use only. */
process.removeAllListeners('warning'); process.on('warning', w => { if (w.name !== 'ExperimentalWarning') console.warn(w); });
const { DatabaseSync } = require('node:sqlite');
const path = require('path'), { pathToFileURL } = require('url');

class Stmt {
  constructor(raw, sql, args) { this.raw = raw; this.sql = sql; this.args = args || []; }
  bind(...a) { return new Stmt(this.raw, this.sql, a); }
  _all() { const st = this.raw.prepare(this.sql); const rows = st.all(...this.args).map(r => Object.assign({}, r)); return rows; }
  _run() { const st = this.raw.prepare(this.sql); const reads = /^\s*(SELECT|PRAGMA)/i.test(this.sql) || /\bRETURNING\b/i.test(this.sql);
    if (reads) { const rows = st.all(...this.args).map(r => Object.assign({}, r)); return { success: true, results: rows, meta: { changes: 0 } }; }
    const r = st.run(...this.args); return { success: true, results: [], meta: { changes: Number(r.changes) } }; }
  async first() { const rows = this._all(); return rows.length ? rows[0] : null; }
  async all() { return { success: true, results: this._all(), meta: {} }; }
  async run() { return this._run(); }
}
function makeDb() {
  const raw = new DatabaseSync(':memory:');
  return {
    raw,
    prepare: sql => new Stmt(raw, sql),
    async batch(list) { raw.exec('BEGIN'); try { const out = list.map(s => s._run()); raw.exec('COMMIT'); return out; } catch (e) { raw.exec('ROLLBACK'); throw e; } },
  };
}
/* the table exactly as the 38.28 server made it, for the upgrade test */
const LEGACY_VAULT = `CREATE TABLE IF NOT EXISTS vault (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, blob TEXT NOT NULL, iv TEXT NOT NULL, rev INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_at INTEGER NOT NULL, prev_blob TEXT, prev_iv TEXT, prev_rev INTEGER, size INTEGER NOT NULL DEFAULT 0, writes_day TEXT, writes INTEGER NOT NULL DEFAULT 0)`;

let mod = null;
const handlers = async () => mod || (mod = await import(pathToFileURL(path.join(__dirname, '..', 'functions', 'api', 'vault', '[id].js')).href));
const METHOD = { GET: 'onRequestGet', PUT: 'onRequestPut', POST: 'onRequestPost', DELETE: 'onRequestDelete', OPTIONS: 'onRequestOptions' };
/* one request, the way worker/index.js hands it over. Returns { status, j }. */
async function call(env, method, id, token, body, query, opt) {
  const m = await handlers(), fn = m[METHOD[method]];
  if (!fn) return { status: 405, j: { error: { code: 'method_not_allowed' } } };
  const headers = Object.assign({ 'cf-connecting-ip': (opt && opt.ip) || '10.0.0.1' }, (opt && opt.headers) || {}); if (token) headers['x-vault-token'] = token; if (body !== undefined) headers['content-type'] = 'application/json';
  const request = new Request('http://test.local/api/vault/' + id + (query || ''), { method, headers, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const waits = [];
  const res = await fn({ request, env, params: { id }, waitUntil: p => waits.push(p) });
  await Promise.all(waits);
  let j = null; try { j = await res.json(); } catch (e) { j = null; }
  return { status: res.status, j: j || {} };
}
/* a fetch() for the page code under test: same handlers, same routing rule as the Worker */
const fetchFor = env => async (url, opt = {}) => {
  const u = new URL(url), m = u.pathname.match(/^\/api\/vault\/([^/]+)\/?$/); if (!m) return new Response('{}', { status: 404 });
  const h = opt.headers || {}; const r = await call(env, opt.method || 'GET', m[1], h['x-vault-token'], opt.body, u.search);
  return new Response(JSON.stringify(r.j), { status: r.status, headers: { 'content-type': 'application/json' } });
};
module.exports = { makeDb, call, fetchFor, LEGACY_VAULT };
