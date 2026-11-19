/* Shared helpers for the relay and the vault.
   Runs on Cloudflare Pages Functions. No secrets live in this file: the key comes from env.ANTHROPIC_API_KEY. */

export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, cors(), extra),
});
export const fail = (status, code, message, extra) => json(Object.assign({ error: { code, message } }, extra || {}), status);

/* The page may also be opened as a downloaded file (origin "null") or from the Claude mirror (which cannot reach us at all),
   so the relay answers any origin. Safety does not rest on CORS: the key never leaves the server, every call is counted,
   and the owner can require an invite code. */
export const cors = () => ({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, x-vault-token, x-app',
  'access-control-max-age': '86400',
});
export const preflight = () => new Response(null, { status: 204, headers: cors() });

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
export const minuteKey = (d = new Date()) => Math.floor(d.getTime() / 60000);
/* Who is calling, for the per-address limits. The address itself is never stored: this returns a short tag made from it
   (24 bits, so a few hundred addresses share each tag), which is enough to count calls and too little to say who called. */
export const clientIp = req => {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0';
  let h = 0x811c9dc5; for (let i = 0; i < ip.length; i++) { h ^= ip.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return 'a' + ((h ^ (h >>> 24)) & 0xffffff).toString(16).padStart(6, '0');
};
export const num = (v, def) => { const n = parseInt(v, 10); return isFinite(n) && n >= 0 ? n : def; };

/* ---- D1: the tables are created on first use, so no migration step is needed ---- */
let schemaReady = null;
/* Columns added to the vault table after 38.28. Only ever added, each with a default, so rows written by an older server stay valid
   and an older server can still read the table. SQLite has no "ADD COLUMN IF NOT EXISTS", so the list of columns is read first. */
const VAULT_ADDED = [['ver', 'INTEGER NOT NULL DEFAULT 0'], ['deleted_at', 'INTEGER']];
async function addVaultColumns(db) {
  const have = ((await db.prepare(`SELECT name FROM pragma_table_info('vault')`).all()).results || []).map(r => r.name);
  for (const [name, type] of VAULT_ADDED) {
    if (have.includes(name)) continue;
    try { await db.prepare(`ALTER TABLE vault ADD COLUMN ${name} ${type}`).run(); }
    catch (e) { if (!/duplicate column/i.test(String(e && e.message))) throw e; /* another request added it a moment ago */ }
  }
}
export async function ensureSchema(db) {
  if (!db) return false;
  if (!schemaReady) schemaReady = db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS usage (day TEXT NOT NULL, k TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0, tokens INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS vault (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, blob TEXT NOT NULL, iv TEXT NOT NULL, rev INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_at INTEGER NOT NULL, prev_blob TEXT, prev_iv TEXT, prev_rev INTEGER, size INTEGER NOT NULL DEFAULT 0, writes_day TEXT, writes INTEGER NOT NULL DEFAULT 0)`),
    /* older copies of a vault: ver is the copy's own number, saved_at the server time it was stored, day its UTC day,
       kind 'daily' (the last copy of a day) or 'kept' (a copy that a forced save or a delete replaced) */
    db.prepare(`CREATE TABLE IF NOT EXISTS vault_versions (id TEXT NOT NULL, ver INTEGER NOT NULL, blob TEXT NOT NULL, iv TEXT NOT NULL, rev INTEGER NOT NULL, saved_at INTEGER NOT NULL, day TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0, kind TEXT NOT NULL DEFAULT 'daily', PRIMARY KEY (id, ver))`),
  ]).then(() => addVaultColumns(db))
    /* the counters are only ever read for today: clear rows older than a week, so the table neither grows for ever nor keeps a history */
    .then(() => db.prepare(`DELETE FROM usage WHERE day < ?1`).bind(dayKey(new Date(Date.now() - 7 * 86400000))).run().catch(() => {}))
    .then(() => true).catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

/* count one event under a key for today and return the new totals */
export async function bump(db, k, calls = 1, tokens = 0, day = dayKey()) {
  const r = await db.prepare(`INSERT INTO usage (day, k, calls, tokens) VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(day, k) DO UPDATE SET calls = calls + ?3, tokens = tokens + ?4 RETURNING calls, tokens`).bind(day, k, calls, tokens).first();
  return r || { calls, tokens };
}
export async function readUsage(db, k, day = dayKey()) {
  const r = await db.prepare(`SELECT calls, tokens FROM usage WHERE day = ?1 AND k = ?2`).bind(day, k).first();
  return r || { calls: 0, tokens: 0 };
}

/* hex of SHA-256, for vault tokens */
export async function sha256hex(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
}
export const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
};
/* an invite code the owner set (INVITE_CODES="word1, word2"); unset means the page is open */
export function inviteOk(env, given) {
  const list = String(env.INVITE_CODES || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return true;
  const g = String(given || '').trim().toLowerCase();
  return list.some(c => timingSafeEqual(c, g));
}
