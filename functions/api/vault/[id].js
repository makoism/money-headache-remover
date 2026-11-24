/* /api/vault/<id>  GET | PUT | DELETE
   The encrypted cloud copy of one person's numbers.
   The page encrypts everything before it leaves the browser (AES-GCM with a key made from the person's recovery code);
   this server sees only ciphertext. The id and the write token are also made from the code, so the code is the only key.
   One record per id, plus the previous version as a safety net. Nobody here can read a record, the owner included. */
import { json, fail, preflight, dayKey, minuteKey, clientIp, num, ensureSchema, bump, sha256hex, timingSafeEqual } from '../../_lib.js';

const ID_RE = /^[a-f0-9]{32,64}$/, TOKEN_RE = /^[a-f0-9]{32,128}$/;
const MAX_BLOB = 3_000_000; /* characters of base64, about 2.2 MB: hundreds of times a normal plan */

/* Two kinds of copy share this table. The old app (ui42.js) sends AES-GCM ciphertext in base64, which never reads as JSON.
   app3 (wip/team/app3/src/cloud3.js) sends the pack envelope { fmt, v, enc, iv, data } as JSON in base64, so its fmt and v
   are read here without decrypting anything (DECISIONS_ROUND2 E3). The rules added for app3 (FOR_MAKO, the five server
   changes) apply only to app3's copies; the old app's copies keep the rules they had. Gives the envelope, or null. */
export function envelopeOf(blob) {
  if (typeof blob !== 'string' || blob.slice(0, 2) !== 'ey') return null;   // base64 of '{"' starts 'ey'
  try {
    const e = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(blob), c => c.charCodeAt(0))));
    return e && typeof e === 'object' && !Array.isArray(e) ? e : null;
  } catch (e) { return null; }
}

export const onRequestOptions = () => preflight();

async function gate({ request, env, params }) {
  if (!env.DB) return { err: fail(503, 'vault_unconfigured', 'Cloud backup is not set up on this server.') };
  const id = String(params.id || '').toLowerCase(), token = String(request.headers.get('x-vault-token') || '').toLowerCase();
  if (!ID_RE.test(id)) return { err: fail(400, 'invalid_request', 'Bad vault id.') };
  if (!TOKEN_RE.test(token)) return { err: fail(400, 'invalid_request', 'Missing vault token.') };
  try { await ensureSchema(env.DB); } catch (e) { return { err: fail(503, 'vault_unconfigured', 'Database not ready.') }; }
  try {
    const m = await bump(env.DB, `v:${clientIp(request)}:${minuteKey()}`, 1, 0, dayKey());
    if (m.calls > num(env.VAULT_IP_PER_MINUTE, 60)) return { err: fail(429, 'rate_limited', 'Too many requests. Wait a minute.') };
  } catch (e) { /* counting never blocks */ }
  const row = await env.DB.prepare('SELECT id, token_hash, blob, iv, rev, updated_at, created_at, prev_blob, prev_iv, prev_rev, size, writes_day, writes FROM vault WHERE id = ?1').bind(id).first();
  if (row && !timingSafeEqual(row.token_hash, await sha256hex(token))) return { err: fail(403, 'forbidden', 'Wrong recovery code for this vault.') };
  return { id, token, row };
}

/* [change 2] the newest shape this server takes (store/pack.js pageV: 3). Raised by the VAULT_MAX_V variable, no code change. */
const MAX_V = env => num(env.VAULT_MAX_V, 3);
function shapeRefusal(e, env) {
  if (e.fmt !== 'gz1' || e.enc !== 'aes-gcm' || typeof e.data !== 'string') return fail(422, 'unknown_format', 'This copy is not in a format this server takes.');
  if (typeof e.v !== 'number' || !isFinite(e.v)) return fail(422, 'unknown_format', 'This copy has no shape number.');
  if (e.v > MAX_V(env)) return fail(422, 'newer_shape', 'This copy is from a newer version than this server knows.');
  return null;
}

export async function onRequestGet(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  if (!g.row) return fail(404, 'not_found', 'No cloud copy with this code.');
  const r = g.row, prev = ctx.request.url.indexOf('prev=1') >= 0 && r.prev_blob ? { blob: r.prev_blob, iv: r.prev_iv, rev: r.prev_rev } : undefined;
  return json({ blob: r.blob, iv: r.iv, rev: r.rev, updated: r.updated_at, created: r.created_at, size: r.size, hasPrev: !!r.prev_blob, prev });
}

export async function onRequestPut(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  let b; try { b = await ctx.request.json(); } catch (e) { return fail(400, 'invalid_request', 'Body must be JSON.'); }
  if (!b || typeof b.blob !== 'string' || !b.blob || b.blob.length > MAX_BLOB || !/^[A-Za-z0-9+/=]+$/.test(b.blob)) return fail(400, 'invalid_request', 'Bad blob.');
  if (typeof b.iv !== 'string' || !/^[A-Za-z0-9+/=]{12,32}$/.test(b.iv)) return fail(400, 'invalid_request', 'Bad iv.');
  const rev = Math.floor(+b.rev); if (!(rev > 0) || rev > 1e14) return fail(400, 'invalid_request', 'Bad rev.');
  const now = Date.now(), db = ctx.env.DB, today = dayKey();
  /* [change 2] an app3 copy is read before anything is stored: an unknown format, a copy that is not encrypted, or a newer
     shape is refused; over an app3 copy, a blob that is not an envelope at all is refused too */
  const incoming = envelopeOf(b.blob);
  if (incoming) { const no = shapeRefusal(incoming, ctx.env); if (no) return no; }
  else if (g.row && envelopeOf(g.row.blob)) return fail(422, 'unknown_format', 'This copy is not in a format this server takes.');
  if (!g.row) {
    await db.prepare('INSERT INTO vault (id, token_hash, blob, iv, rev, updated_at, created_at, size, writes_day, writes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?8, 1)')
      .bind(g.id, await sha256hex(g.token), b.blob, b.iv, rev, now, b.blob.length, today).run();
    return json({ rev, updated: now, created: true });
  }
  const r = g.row, isNew = !!(envelopeOf(b.blob) || envelopeOf(r.blob));
  /* [change 1] an app3 write must name the revision it is based on once a copy exists, so a second device can never write
     over the first device's copy without taking it first (AQ1). force is the old app's "keep this device's copy"; app3
     never sends it and it does not get round this. 409 makes cloud3 take the latest, join and send again (AW5). */
  const force = !!b.force && !isNew;
  if (isNew && !(Math.floor(+b.base || 0) > 0)) return fail(409, 'conflict', 'Name the copy this is based on.', { rev: r.rev, updated: r.updated_at });
  /* the copy on the server is newer: tell the page, which asks the person which one to keep */
  /* or the page sent changes made on an older copy (base: the revision it last loaded or sent) while another device wrote since: ask too */
  const base = Math.floor(+b.base || 0);
  if (!force && (rev <= r.rev || (base > 0 && base !== r.rev))) return fail(409, 'conflict', 'The server has a newer copy.', { rev: r.rev, updated: r.updated_at });
  const writes = r.writes_day === today ? r.writes + 1 : 1;
  if (writes > num(ctx.env.VAULT_WRITES_PER_DAY, 400)) return fail(429, 'rate_limited', 'Too many saves today for this vault.');
  await db.prepare('UPDATE vault SET blob = ?2, iv = ?3, rev = ?4, updated_at = ?5, prev_blob = ?6, prev_iv = ?7, prev_rev = ?8, size = ?9, writes_day = ?10, writes = ?11 WHERE id = ?1')
    .bind(g.id, b.blob, b.iv, rev, now, r.blob, r.iv, r.rev, b.blob.length, today, writes).run();
  return json({ rev, updated: now, created: false });
}

export async function onRequestDelete(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  if (g.row) await ctx.env.DB.prepare('DELETE FROM vault WHERE id = ?1').bind(g.id).run();
  return json({ deleted: !!g.row });
}
