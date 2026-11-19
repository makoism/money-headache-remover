/* /api/vault/<id>  GET | PUT | POST | DELETE
   The encrypted cloud copy of one person's numbers.
   The page encrypts everything before it leaves the browser (AES-GCM with a key made from the person's recovery code);
   this server sees only ciphertext. The id and the write token are also made from the code, so the code is the only key.
   Nobody here can read a record, the owner included.

   What the server keeps for each id:
   - the latest copy (table vault), stamped with the server's own time and a version counter (ver) that goes up by one on every save;
   - older copies (table vault_versions): the last copy of each of the last 7 days that had a save, plus the last 5 copies that a
     forced save ("Keep mine") or a delete replaced;
   - after a delete, all of it for 30 more days, so the delete can be undone.

   GET                 the latest copy                       { blob, iv, rev, updated, created, size, ver, now, hasPrev }
   GET ?versions=1     the list of copies, no content        { ver, rev, updated, size, now, keepDays, deleted?, versions: [{ ver, rev, saved, day, size, kind }] }
   GET ?ver=N          one copy                              { blob, iv, rev, updated, size, ver, kind }
   PUT  { blob, iv, rev, base?, force?, invite? }            { rev, updated, created, ver, now }   or 409 { rev, updated, ver, now }
                                                              413 too_large over 1,800,000 characters; 429 for too many new copies in a day
   POST { action: 'undelete' }                               { restored, ver, rev, updated }
   DELETE              hides the copy, keeps it 30 days      { deleted, until, keepDays }

   Pages from before the version counter (38.28, 38.31) send no base and read only rev and updated: every answer they relied on
   is unchanged (tests/vault_clients.test.js runs their real code against this file). */
import { json, fail, preflight, dayKey, minuteKey, clientIp, num, ensureSchema, bump, sha256hex, timingSafeEqual, inviteOk } from '../../_lib.js';

const ID_RE = /^[a-f0-9]{32,64}$/, TOKEN_RE = /^[a-f0-9]{32,128}$/;
/* Characters of base64, about 1.3 MB of numbers. D1 holds at most 2 MB in one row, so a copy must fit a row on its own;
   above ROW_ROOM the in-row previous copy (prev_*) is left empty, the versions table has it anyway. */
const MAX_BLOB = 1_800_000, ROW_ROOM = 1_900_000;
const DAY_MS = 86400000;
const keepDays = env => Math.max(1, num(env.VAULT_KEEP_DAYS, 30));        /* how long a deleted copy can be brought back */
const dailyCopies = env => Math.max(1, num(env.VAULT_DAILY_COPIES, 7));   /* how many days keep their last copy */
const keptCopies = env => Math.max(1, num(env.VAULT_KEPT_COPIES, 5));     /* how many replaced-by-force copies are kept */

export const onRequestOptions = () => preflight();

/* everything that belongs to ids whose keeping time has passed */
const sweep = (db, cutoff) => db.batch([
  db.prepare('DELETE FROM vault_versions WHERE id IN (SELECT id FROM vault WHERE deleted_at IS NOT NULL AND deleted_at < ?1)').bind(cutoff),
  db.prepare('DELETE FROM vault WHERE deleted_at IS NOT NULL AND deleted_at < ?1').bind(cutoff),
]);

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
  let row = await env.DB.prepare('SELECT id, token_hash, blob, iv, rev, updated_at, created_at, prev_blob, prev_iv, prev_rev, size, writes_day, writes, ver, deleted_at FROM vault WHERE id = ?1').bind(id).first();
  if (row && !timingSafeEqual(row.token_hash, await sha256hex(token))) return { err: fail(403, 'forbidden', 'Wrong recovery code for this vault.') };
  const now = Date.now(), keepMs = keepDays(env) * DAY_MS;
  /* deleted longer ago than the keeping time: really gone now */
  if (row && row.deleted_at && row.deleted_at + keepMs < now) { await sweep(env.DB, now - keepMs); row = null; }
  const deleted = row && row.deleted_at ? { at: row.deleted_at, until: row.deleted_at + keepMs } : undefined;
  return { id, token, row, now, deleted, query: new URL(request.url).searchParams };
}

export async function onRequestGet(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  if (!g.row) return fail(404, 'not_found', 'No cloud copy with this code.');
  const r = g.row, q = g.query, db = ctx.env.DB;
  if (q.has('versions')) {
    const list = (await db.prepare('SELECT ver, rev, saved_at, day, size, kind FROM vault_versions WHERE id = ?1 ORDER BY ver DESC').bind(g.id).all()).results || [];
    return json({ ver: r.ver, rev: r.rev, updated: r.updated_at, created: r.created_at, size: r.size, now: g.now, keepDays: keepDays(ctx.env), deleted: g.deleted,
      versions: list.map(v => ({ ver: v.ver, rev: v.rev, saved: v.saved_at, day: v.day, size: v.size, kind: v.kind })) });
  }
  if (q.has('ver')) {
    const n = Number(q.get('ver')); if (!Number.isInteger(n) || n < 0) return fail(400, 'invalid_request', 'Bad version number.');
    if (n === r.ver) return json({ blob: r.blob, iv: r.iv, rev: r.rev, updated: r.updated_at, size: r.size, ver: r.ver, kind: 'latest', deleted: g.deleted });
    const v = await db.prepare('SELECT ver, blob, iv, rev, saved_at, size, kind FROM vault_versions WHERE id = ?1 AND ver = ?2').bind(g.id, n).first();
    if (!v) return fail(404, 'not_found', 'No such version.');
    return json({ blob: v.blob, iv: v.iv, rev: v.rev, updated: v.saved_at, size: v.size, ver: v.ver, kind: v.kind, deleted: g.deleted });
  }
  /* a deleted copy reads as "not there", which is what a page expects after Turn off; the extra field says it can be brought back */
  if (g.deleted) return fail(404, 'not_found', 'This cloud copy was deleted. It can be brought back for a while.', { deleted: g.deleted });
  const prev = ctx.request.url.indexOf('prev=1') >= 0 && r.prev_blob ? { blob: r.prev_blob, iv: r.prev_iv, rev: r.prev_rev } : undefined;
  return json({ blob: r.blob, iv: r.iv, rev: r.rev, updated: r.updated_at, created: r.created_at, size: r.size, ver: r.ver, now: g.now, hasPrev: !!r.prev_blob, prev });
}

export async function onRequestPut(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  const tooLarge = () => fail(413, 'too_large', 'This copy is too large for the cloud copy.', { max: MAX_BLOB });
  if (num(ctx.request.headers.get('content-length'), 0) > MAX_BLOB + 4096) return tooLarge();   /* refuse before reading it all */
  let b; try { b = await ctx.request.json(); } catch (e) { return fail(400, 'invalid_request', 'Body must be JSON.'); }
  if (b && typeof b.blob === 'string' && b.blob.length > MAX_BLOB) return tooLarge();
  if (!b || typeof b.blob !== 'string' || !b.blob || !/^[A-Za-z0-9+/=]+$/.test(b.blob)) return fail(400, 'invalid_request', 'Bad blob.');
  if (typeof b.iv !== 'string' || !/^[A-Za-z0-9+/=]{12,32}$/.test(b.iv)) return fail(400, 'invalid_request', 'Bad iv.');
  let rev = Math.floor(+b.rev); if (!(rev > 0) || rev > 1e14) return fail(400, 'invalid_request', 'Bad rev.');
  /* rev is the device's own clock. A clock far ahead would make every later save from a right clock look old, for ever; so the stored
     rev is never more than one day past the server's time. (Refusing instead would silently stop that device's cloud copy.) */
  const now = g.now, db = ctx.env.DB, today = dayKey(new Date(now));
  if (rev > now + DAY_MS) rev = now + DAY_MS;
  /* base: the version counter of the copy this device last saw (from its last GET or PUT). Pages from before the counter send none. */
  const hasBase = b.base !== undefined && b.base !== null;
  if (hasBase && !(typeof b.base === 'number' && Number.isInteger(b.base) && b.base >= 0)) return fail(400, 'invalid_request', 'Bad base.');
  if (!g.row) {
    /* a new cloud copy: limited per address and for the whole site per day, so nobody can fill the database with junk */
    if (num(ctx.env.VAULT_NEW_NEEDS_INVITE, 0) && !inviteOk(ctx.env, b.invite)) return fail(401, 'invite_required', 'This page needs the code word from its owner.');
    try {
      const mine = await bump(db, `vnew:${clientIp(ctx.request)}`, 1, 0, today), all = await bump(db, 'vnew:all', 1, 0, today);
      if (mine.calls > num(ctx.env.VAULT_NEW_PER_IP_DAY, 20) || all.calls > num(ctx.env.VAULT_NEW_PER_DAY, 200)) return fail(429, 'rate_limited', 'Too many new cloud copies today. Try again tomorrow.', { now });
    } catch (e) { /* counting never blocks */ }
    const made = await db.prepare('INSERT INTO vault (id, token_hash, blob, iv, rev, updated_at, created_at, size, writes_day, writes, ver) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?8, 1, 1) ON CONFLICT(id) DO NOTHING')
      .bind(g.id, await sha256hex(g.token), b.blob, b.iv, rev, now, b.blob.length, today).run();
    if (!made.meta || made.meta.changes !== 1) return fail(409, 'conflict', 'Another device saved at the same moment.', { rev, updated: now, ver: 1 });
    return json({ rev, updated: now, created: true, ver: 1, now });
  }
  const r = g.row, wasDeleted = !!g.deleted;
  /* the very same save arriving a second time (its answer was lost on the way): say yes again, write nothing */
  if (!wasDeleted && b.blob === r.blob && b.iv === r.iv) return json({ rev: r.rev, updated: r.updated_at, created: false, ver: r.ver, now });
  /* Would this save replace a copy the device has not seen? With a base, the server's own counter decides and the device clock plays
     no part. Without one (older pages), the old rule: the device's rev must be higher than the stored one. */
  const unseen = !wasDeleted && (hasBase ? b.base !== r.ver : rev <= r.rev);
  if (unseen && !b.force) return fail(409, 'conflict', 'The server has a newer copy.', { rev: r.rev, updated: r.updated_at, ver: r.ver, now });
  const writes = r.writes_day === today ? r.writes + 1 : 1;
  if (writes > num(ctx.env.VAULT_WRITES_PER_DAY, 400)) return fail(429, 'rate_limited', 'Too many saves today for this vault.');
  /* The copy being replaced moves to the versions table. A copy the device had not seen, or a deleted one, is 'kept' (only pushed out
     by newer kept copies); any other is the 'daily' copy of the day it was saved, replacing an earlier one from the same day.
     One batch is one transaction, and every statement checks the counter, so two saves at the same moment cannot both win. */
  const kind = unseen || wasDeleted ? 'kept' : 'daily', oldDay = dayKey(new Date(r.updated_at));
  const live = 'EXISTS (SELECT 1 FROM vault WHERE id = ?1 AND ver = ?2)';
  const out = await db.batch([
    db.prepare(`DELETE FROM vault_versions WHERE id = ?1 AND kind = 'daily' AND day = ?3 AND ?4 = 'daily' AND ${live}`).bind(g.id, r.ver, oldDay, kind),
    db.prepare('INSERT OR REPLACE INTO vault_versions (id, ver, blob, iv, rev, saved_at, day, size, kind) SELECT id, ver, blob, iv, rev, updated_at, ?3, size, ?4 FROM vault WHERE id = ?1 AND ver = ?2').bind(g.id, r.ver, oldDay, kind),
    db.prepare('UPDATE vault SET blob = ?3, iv = ?4, rev = ?5, updated_at = ?6, prev_blob = CASE WHEN ?10 = 1 THEN blob END, prev_iv = CASE WHEN ?10 = 1 THEN iv END, prev_rev = CASE WHEN ?10 = 1 THEN rev END, size = ?7, writes_day = ?8, writes = ?9, ver = ver + 1, deleted_at = NULL WHERE id = ?1 AND ver = ?2')
      .bind(g.id, r.ver, b.blob, b.iv, rev, now, b.blob.length, today, writes, r.blob.length + b.blob.length <= ROW_ROOM ? 1 : 0),
    db.prepare(`DELETE FROM vault_versions WHERE id = ?1 AND kind = 'daily' AND day NOT IN (SELECT DISTINCT day FROM vault_versions WHERE id = ?1 AND kind = 'daily' ORDER BY day DESC LIMIT ?2)`).bind(g.id, dailyCopies(ctx.env)),
    db.prepare(`DELETE FROM vault_versions WHERE id = ?1 AND kind = 'kept' AND ver NOT IN (SELECT ver FROM vault_versions WHERE id = ?1 AND kind = 'kept' ORDER BY ver DESC LIMIT ?2)`).bind(g.id, keptCopies(ctx.env)),
  ]);
  if (!out[2] || !out[2].meta || out[2].meta.changes !== 1) {
    const cur = await db.prepare('SELECT rev, updated_at, ver FROM vault WHERE id = ?1').bind(g.id).first() || { rev: r.rev, updated_at: r.updated_at, ver: r.ver };
    return fail(409, 'conflict', 'Another device saved at the same moment.', { rev: cur.rev, updated: cur.updated_at, ver: cur.ver, now });
  }
  return json({ rev, updated: now, created: wasDeleted, ver: r.ver + 1, replaced: kind === 'kept' ? r.ver : undefined, now });
}

/* POST { action: 'undelete' }: bring a deleted copy back, within the keeping time */
export async function onRequestPost(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  let b; try { b = await ctx.request.json(); } catch (e) { return fail(400, 'invalid_request', 'Body must be JSON.'); }
  if (!b || b.action !== 'undelete') return fail(400, 'invalid_request', 'Unknown action.');
  if (!g.row) return fail(404, 'not_found', 'No cloud copy with this code.');
  const r = g.row;
  if (g.deleted) await ctx.env.DB.prepare('UPDATE vault SET deleted_at = NULL WHERE id = ?1').bind(g.id).run();
  return json({ restored: !!g.deleted, ver: r.ver, rev: r.rev, updated: r.updated_at, now: g.now });
}

/* DELETE hides the copy and starts the keeping time. Nothing is removed until that time has passed. */
export async function onRequestDelete(ctx) {
  const g = await gate(ctx); if (g.err) return g.err;
  const days = keepDays(ctx.env), db = ctx.env.DB;
  if (!g.row) return json({ deleted: false });
  let until = g.deleted && g.deleted.until;
  if (!g.deleted) { await db.prepare('UPDATE vault SET deleted_at = ?2 WHERE id = ?1 AND deleted_at IS NULL').bind(g.id, g.now).run(); until = g.now + days * DAY_MS; }
  /* a delete is also the moment to clear out other people's copies whose keeping time has passed */
  try { await sweep(db, g.now - days * DAY_MS); } catch (e) { /* tidying never fails a delete */ }
  return json({ deleted: true, until, keepDays: days, now: g.now });
}
