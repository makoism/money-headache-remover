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
export const clientIp = req => req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0';
export const num = (v, def) => { const n = parseInt(v, 10); return isFinite(n) && n >= 0 ? n : def; };

/* ---- D1: the tables are created on first use, so no migration step is needed ---- */
let schemaReady = null;
export async function ensureSchema(db) {
  if (!db) return false;
  if (!schemaReady) schemaReady = db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS usage (day TEXT NOT NULL, k TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0, tokens INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS vault (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, blob TEXT NOT NULL, iv TEXT NOT NULL, rev INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_at INTEGER NOT NULL, prev_blob TEXT, prev_iv TEXT, prev_rev INTEGER, size INTEGER NOT NULL DEFAULT 0, writes_day TEXT, writes INTEGER NOT NULL DEFAULT 0)`),
  ]).then(() => true).catch(e => { schemaReady = null; throw e; });
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
