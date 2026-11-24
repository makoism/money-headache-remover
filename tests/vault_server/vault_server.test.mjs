/* The vault server (functions/api/vault/[id].js through worker/index.js) run here in node, on a D1 stand-in over SQLite
   (d1_stub.mjs). No wrangler and no network.   node tests/vault_server/vault_server.test.mjs
   Part A sends exactly what the old app sends (src/ui42.js, the live 38.28 on main; wip/team/ui42.js, 38.31) and checks the
   answers it reads are the same as before. The later parts are the five changes Mako approved (app3/FOR_MAKO.md). */
import worker from '../../worker/index.js';
import { makeD1, TODAY_SCHEMA } from './d1_stub.mjs';
import { createHash, randomBytes } from 'node:crypto';

let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 400))); if (!ok) bad++; };
const hex = k => randomBytes(k).toString('hex');
const sha = s => createHash('sha256').update(s).digest('hex');
export const envOf = (db, extra) => Object.assign({ DB: db, VAULT_IP_PER_MINUTE: '1000000', ASSETS: { fetch: async () => new Response('page') } }, extra || {});
async function call(env, method, id, token, body, query) {
  const req = new Request('https://the-burrow.test/api/vault/' + id + (query || ''), { method, headers: Object.assign({ 'x-vault-token': token }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
  const r = await worker.fetch(req, env, { waitUntil() {} });
  let j = null; try { j = await r.json(); } catch (e) { j = null; }
  return { status: r.status, ok: r.ok, j: j || {} };
}
/* the old app's blob: AES-GCM ciphertext in base64 (ui42.js vaultEncrypt) */
const oldBlob = () => randomBytes(300).toString('base64');
const ivOf = () => randomBytes(12).toString('base64');
/* app3's blob: the pack envelope as JSON, in base64 (cloud3.js wrap) */
const envBlob = (over) => { const iv = ivOf(); const e = Object.assign({ fmt: 'gz1', v: 3, enc: 'aes-gcm', iv, data: randomBytes(200).toString('base64') }, over || {}); return { blob: Buffer.from(JSON.stringify(e)).toString('base64'), iv }; };
const fresh = () => { const db = makeD1(); return { db, env: envOf(db), id: hex(32), token: hex(32) }; };

// ---------------- A. the old app's calls, unchanged ----------------
{
  const { db, env, id, token } = fresh();
  let r = await call(env, 'GET', id, token);
  ck('A1 GET with nothing stored: 404 (ui42 vaultCheck then sends its copy)', r.status === 404, r);
  const b1 = { blob: oldBlob(), iv: ivOf(), rev: 1764000000000 };
  r = await call(env, 'PUT', id, token, b1);
  ck('A2 first PUT { blob, iv, rev } (38.28): 200 { rev, updated, created: true }', r.status === 200 && r.j.rev === b1.rev && r.j.created === true && typeof r.j.updated === 'number', r);
  r = await call(env, 'GET', id, token);
  ck('A3 GET: 200 with exactly blob, iv, rev, updated, created, size, hasPrev', r.status === 200 && r.j.blob === b1.blob && r.j.iv === b1.iv && r.j.rev === b1.rev && r.j.size === b1.blob.length && r.j.hasPrev === false && JSON.stringify(Object.keys(r.j).sort()) === JSON.stringify(['blob', 'created', 'hasPrev', 'iv', 'rev', 'size', 'updated']), r.j);
  const b2 = { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 5000 };
  r = await call(env, 'PUT', id, token, b2);
  ck('A4 a later PUT with no base and a higher rev (38.28 sends no base): 200, not created', r.status === 200 && r.j.rev === b2.rev && r.j.created === false, r);
  r = await call(env, 'PUT', id, token, { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 10 });
  ck('A5 a PUT with a rev not above the stored one: 409 { error, rev, updated } (ui42 shows "newer copy")', r.status === 409 && r.j.rev === b2.rev && typeof r.j.updated === 'number' && r.j.error && r.j.error.code === 'conflict', r);
  const b3 = { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 20, force: true };
  r = await call(env, 'PUT', id, token, b3);
  ck('A6 PUT with force: true (keep this device\'s copy): 200 even with a lower rev', r.status === 200 && r.j.rev === b3.rev, r);
  r = await call(env, 'GET', id, token);
  ck('A7 GET after force: the forced copy, hasPrev true', r.status === 200 && r.j.blob === b3.blob && r.j.hasPrev === true, r.j);
  // 38.31 (wip/team/ui42.js) also sends base: the revision it last loaded or sent
  const b4 = { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 30, base: b3.rev };
  r = await call(env, 'PUT', id, token, b4);
  ck('A8 PUT with the right base (38.31): 200', r.status === 200 && r.j.rev === b4.rev, r);
  r = await call(env, 'PUT', id, token, { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 40, base: b3.rev });
  ck('A9 PUT with an old base (38.31): 409 with the stored rev', r.status === 409 && r.j.rev === b4.rev, r);
  r = await call(env, 'PUT', id, hex(32), { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 50 });
  ck('A10 a wrong token: 403 forbidden', r.status === 403 && r.j.error.code === 'forbidden', r);
  r = await call(env, 'GET', id, hex(32));
  ck('A11 GET with a wrong token: 403', r.status === 403, r);
  r = await call(env, 'DELETE', id, token);
  ck('A12 DELETE (Turn off and delete): 200 { deleted: true }', r.status === 200 && r.j.deleted === true, r);
  r = await call(env, 'GET', id, token);
  ck('A13 GET after delete: 404, as before', r.status === 404, r);
  r = await call(env, 'PUT', id, token, { blob: oldBlob(), iv: ivOf(), rev: b1.rev + 60 });
  ck('A14 an old-app copy can be sent again after a delete (the old app keeps today\'s rules)', r.status === 200 && r.j.created === true, r);
  r = await call(env, 'DELETE', hex(32), token);
  ck('A15 DELETE of nothing: 200 { deleted: false }', r.status === 200 && r.j.deleted === false, r);
  r = await call(env, 'OPTIONS', id, token);
  ck('A16 OPTIONS: 204 with the CORS headers', r.status === 204);
  r = await call(env, 'PUT', id, token, { blob: 'not base64!', iv: ivOf(), rev: 5 });
  ck('A17 a bad blob: 400', r.status === 400, r);
}

// ---------------- B. the live database as it stands today ----------------
/* the tables made by 38.28's ensureSchema, with a copy already in them (and its previous version), as on the live D1 */
function todayDb() {
  const db = makeD1();
  TODAY_SCHEMA.forEach(s => db.raw.exec(s));
  const id = hex(32), token = hex(32), blob = oldBlob(), iv = ivOf(), pblob = oldBlob(), piv = ivOf();
  db.raw.prepare('INSERT INTO vault (id, token_hash, blob, iv, rev, updated_at, created_at, prev_blob, prev_iv, prev_rev, size, writes_day, writes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, sha(token), blob, iv, 1763000000000, 1763000000500, 1762000000000, pblob, piv, 1762900000000, blob.length, '2026-11-20', 7);
  db.raw.prepare('INSERT INTO usage (day, k, calls, tokens) VALUES (?,?,?,?)').run('2026-11-20', 'a:x', 3, 900);
  return { db, env: envOf(db), id, token, blob, iv, pblob, piv };
}
{
  const t = todayDb();
  let r = await call(t.env, 'GET', t.id, t.token);
  ck('B1 a copy already in today\'s database reads back unchanged', r.status === 200 && r.j.blob === t.blob && r.j.iv === t.iv && r.j.rev === 1763000000000 && r.j.hasPrev === true, r);
  r = await call(t.env, 'GET', t.id, t.token, null, '?prev=1');
  ck('B2 its previous version too (?prev=1)', r.status === 200 && r.j.prev && r.j.prev.blob === t.pblob && r.j.prev.rev === 1762900000000, r.j.prev);
  r = await call(t.env, 'PUT', t.id, t.token, { blob: oldBlob(), iv: ivOf(), rev: 1763000001000 });
  ck('B3 a write to it works', r.status === 200, r);
  const u = t.db.raw.prepare('SELECT calls, tokens FROM usage WHERE k = ?').get('a:x');
  ck('B4 the usage counts are untouched', u.calls === 3 && u.tokens === 900, u);
  const t2 = fresh();
  r = await call(t2.env, 'PUT', t2.id, t2.token, { blob: oldBlob(), iv: ivOf(), rev: 5 });
  ck('B5 an empty second database in the same process gets its tables too (the schema check is kept per database)', r.status === 200, r);
}

// ---------------- C. change 1: a write that names no base is refused when a copy exists ----------------
/* only for app3's copies (the blob is the pack envelope); the old app's copies keep today's rules (A4) */
{
  const { env, id, token } = fresh();
  let r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 1 }));
  ck('C1 the first app3 copy needs no base', r.status === 200 && r.j.created === true, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 2 }));
  ck('C2 a later app3 write with no base: 409 conflict with the stored rev (cloud3 takes it, joins, sends again)', r.status === 409 && r.j.error.code === 'conflict' && r.j.rev === 1, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 2, base: 0 }));
  ck('C3 base 0 counts as no base', r.status === 409, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 2, force: true }));
  ck('C4 force does not get round it for an app3 copy (app3 never sends force)', r.status === 409, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 2, base: 1 }));
  ck('C5 the same write naming the stored rev as its base: 200', r.status === 200 && r.j.rev === 2, r);
  r = await call(env, 'GET', id, token);
  ck('C6 and it is the copy kept', r.status === 200 && r.j.rev === 2, r);
}

// ---------------- D. change 2: a copy in an unknown format or a newer shape is refused ----------------
{
  const { env, id, token } = fresh();
  let r = await call(env, 'PUT', id, token, Object.assign(envBlob({ fmt: 'gz2' }), { rev: 1 }));
  ck('D1 fmt not gz1: 422 unknown_format', r.status === 422 && r.j.error.code === 'unknown_format', r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob({ v: 4 }), { rev: 1 }));
  ck('D2 v newer than the server knows (3): 422 newer_shape', r.status === 422 && r.j.error.code === 'newer_shape', r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob({ v: 'x' }), { rev: 1 }));
  ck('D3 v that is not a number: 422 unknown_format', r.status === 422 && r.j.error.code === 'unknown_format', r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob({ enc: undefined }), { rev: 1 }));
  ck('D4 an envelope that is not encrypted is refused: never plain numbers on the server', r.status === 422 && r.j.error.code === 'unknown_format', r);
  r = await call(env, 'GET', id, token);
  ck('D5 nothing was stored by the refused writes', r.status === 404, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob({ v: 2 }), { rev: 1 }));
  ck('D6 an older v is taken', r.status === 200, r);
  r = await call(env, 'PUT', id, token, { blob: oldBlob(), iv: ivOf(), rev: 2, base: 1 });
  ck('D7 a blob that is not an envelope over an app3 copy: 422 unknown_format', r.status === 422 && r.j.error.code === 'unknown_format', r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob({ v: 4 }), { rev: 2, base: 1 }));
  ck('D8 a newer shape over an app3 copy: 422, and the copy stays', r.status === 422 && (await call(env, 'GET', id, token)).j.rev === 1, r);
  const env4 = envOf(env.DB, { VAULT_MAX_V: '4' });
  r = await call(env4, 'PUT', id, token, Object.assign(envBlob({ v: 4 }), { rev: 2, base: 1 }));
  ck('D9 VAULT_MAX_V raises the newest shape taken, with no code change', r.status === 200, r);
}

// ---------------- E. change 3: the last 10 dated versions, and reading one ----------------
import { SCHEMA } from '../../functions/_lib.js';
{
  const { db, env, id, token } = fresh();
  const sent = [];
  for (let i = 1; i <= 13; i++) {
    const b = Object.assign(envBlob(), { rev: i }, i > 1 ? { base: i - 1 } : {});
    const r = await call(env, 'PUT', id, token, b); sent.push(Object.assign({ updated: r.j.updated }, b));
  }
  let r = await call(env, 'GET', id, token, null, '?versions=1');
  const vs = r.j.versions || [];
  ck('E1 ?versions=1 lists the 10 earlier versions, newest first, each with its rev, date and size', r.status === 200 && vs.length === 10 && vs.map(v => v.rev).join() === '12,11,10,9,8,7,6,5,4,3' && vs.every(v => typeof v.updated === 'number' && v.size > 0), r.j);
  ck('E2 each version carries the date it was written', vs[0].updated === sent[11].updated && vs[9].updated === sent[2].updated, [vs[0], sent[11].updated]);
  r = await call(env, 'GET', id, token, null, '?rev=5');
  ck('E3 ?rev=5 reads that version: blob, iv, rev, updated', r.status === 200 && r.j.blob === sent[4].blob && r.j.iv === sent[4].iv && r.j.rev === 5 && r.j.updated === sent[4].updated, r.j);
  r = await call(env, 'GET', id, token, null, '?rev=2');
  ck('E4 an 11th earlier version is no longer kept: 404', r.status === 404 && r.j.error.code === 'not_found', r);
  r = await call(env, 'GET', id, token, null, '?rev=13');
  ck('E5 ?rev= the current one gives the current copy', r.status === 200 && r.j.blob === sent[12].blob, r.j);
  r = await call(env, 'GET', id, token);
  ck('E6 a plain GET still gives exactly the keys the old app reads', r.status === 200 && r.j.rev === 13 && JSON.stringify(Object.keys(r.j).sort()) === JSON.stringify(['blob', 'created', 'hasPrev', 'iv', 'rev', 'size', 'updated']), Object.keys(r.j));
  r = await call(env, 'GET', id, hex(32), null, '?versions=1');
  ck('E7 a wrong token cannot list versions: 403', r.status === 403, r);
  r = await call(env, 'GET', id, hex(32), null, '?rev=5');
  ck('E8 nor read one: 403', r.status === 403, r);
  r = await call(env, 'DELETE', id, token);
  const left = db.raw.prepare('SELECT COUNT(*) c FROM vault_versions WHERE id = ?').get(id).c;
  ck('E9 deleting the cloud copy deletes its versions too', r.j.deleted === true && left === 0, left);
}
{
  const t = todayDb();
  const before = t.db.raw.prepare('PRAGMA table_info(vault)').all().map(c => c.name).join();
  let r = await call(t.env, 'PUT', t.id, t.token, { blob: oldBlob(), iv: ivOf(), rev: 1763000001000 });
  r = await call(t.env, 'GET', t.id, t.token, null, '?versions=1');
  const vs = r.j.versions || [];
  ck('E10 on today\'s database the first write keeps both the copy it replaced and the previous one already stored', r.status === 200 && vs.length === 2 && vs[0].rev === 1763000000000 && vs[0].updated === 1763000000500 && vs[1].rev === 1762900000000 && vs[1].updated === null, vs);
  r = await call(t.env, 'GET', t.id, t.token, null, '?rev=1762900000000');
  ck('E11 and the previous one reads back', r.status === 200 && r.j.blob === t.pblob && r.j.iv === t.piv, r.j);
  ck('E12 the vault table\'s columns are as they were (no column added, changed or dropped)', t.db.raw.prepare('PRAGMA table_info(vault)').all().map(c => c.name).join() === before);
  const count = () => ['vault', 'vault_versions', 'usage'].map(tb => t.db.raw.prepare('SELECT COUNT(*) c FROM ' + tb).get().c).join();
  const c0 = count();
  await t.db.batch(SCHEMA.map(s => t.db.prepare(s))); await t.db.batch(SCHEMA.map(s => t.db.prepare(s)));
  ck('E13 the schema statements run again on a live database change nothing', count() === c0, [c0, count()]);
  ck('E14 every schema statement only creates if missing: nothing is dropped, altered or deleted', SCHEMA.every(s => /^CREATE (TABLE|INDEX) IF NOT EXISTS /.test(s) && !/\b(DROP|ALTER|DELETE|UPDATE)\b/i.test(s)));
  r = await call(t.env, 'GET', t.id, t.token, null, '?versions=1');
  ck('E15 an old-app copy GET with ?prev=1 still answers as before', (await call(t.env, 'GET', t.id, t.token, null, '?prev=1')).j.prev.rev === 1763000000000);
}
{
  /* two writes at once: another device's write lands between this write's read and its store */
  const { db, env, id, token } = fresh();
  await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 1 }));
  const other = envBlob();
  const sneaky = Object.assign(Object.create(db), { batch: async list => {
    if (list.length === 4) db.raw.prepare('UPDATE vault SET blob = ?, rev = 2, updated_at = updated_at + 1 WHERE id = ?').run(other.blob, id);
    return db.batch(list);
  } });
  const r = await call(envOf(sneaky), 'PUT', id, token, Object.assign(envBlob(), { rev: 2, base: 1 }));
  const g = await call(env, 'GET', id, token, null, '?versions=1');
  ck('E16 a write that lost the race is refused 409 and changes nothing (no version added, the other write kept)', r.status === 409 && (await call(env, 'GET', id, token)).j.blob === other.blob && g.j.versions.length === 0, [r, g.j]);
}

// ---------------- F. change 4: a deleted marker ----------------
{
  const { db, env, id, token } = fresh();
  await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 7 }));
  let r = await call(env, 'DELETE', id, token);
  ck('F1 deleting an app3 copy: 200 { deleted: true }', r.status === 200 && r.j.deleted === true, r);
  r = await call(env, 'GET', id, token);
  ck('F2 GET after: 410 deleted, with when (cloud3 sends nothing on an answer that is not 200 or 404)', r.status === 410 && r.j.error.code === 'deleted' && typeof r.j.deleted === 'number', r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 8, base: 7 }));
  ck('F3 a device that still has the old copy cannot send it back (base 7): 410', r.status === 410 && r.j.error.code === 'deleted', r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 8 }));
  ck('F4 nor with no base: 410', r.status === 410, r);
  r = await call(env, 'PUT', id, token, { blob: oldBlob(), iv: ivOf(), rev: 9, force: true });
  ck('F5 nor any other blob, force or not: 410', r.status === 410, r);
  r = await call(env, 'GET', id, hex(32));
  ck('F6 a wrong token gets 403, not the marker', r.status === 403, r);
  r = await call(env, 'DELETE', id, token);
  ck('F7 deleting again: { deleted: false } and the marker stays', r.j.deleted === false && (await call(env, 'GET', id, token)).status === 410, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob({ v: 4 }), { rev: 8, fresh: true }));
  ck('F8 a fresh turn-on still passes the shape check', r.status === 422, r);
  r = await call(env, 'PUT', id, token, Object.assign(envBlob(), { rev: 8, fresh: true }));
  ck('F9 a fresh turn-on (fresh: true) starts the copy again and lifts the marker', r.status === 200 && r.j.created === true && (await call(env, 'GET', id, token)).status === 200, r);
  ck('F10 the marker is gone', db.raw.prepare('SELECT COUNT(*) c FROM vault_gone WHERE id = ?').get(id).c === 0);
}
{
  const { db, env, id, token } = fresh();
  await call(env, 'PUT', id, token, { blob: oldBlob(), iv: ivOf(), rev: 7 });
  await call(env, 'DELETE', id, token);
  ck('F11 deleting an old-app copy leaves no marker (the old app keeps today\'s rules: 404, and a later send is taken)', db.raw.prepare('SELECT COUNT(*) c FROM vault_gone').get().c === 0 && (await call(env, 'GET', id, token)).status === 404);
}
{
  /* two first writes at once */
  const { db, env, id, token } = fresh();
  const other = envBlob();
  const sneaky = Object.assign(Object.create(db), { batch: async list => {
    if (list.length === 2) db.raw.prepare('INSERT INTO vault (id, token_hash, blob, iv, rev, updated_at, created_at) VALUES (?,?,?,?,1,1,1)').run(id, sha(token), other.blob, other.iv);
    return db.batch(list);
  } });
  const r = await call(envOf(sneaky), 'PUT', id, token, Object.assign(envBlob(), { rev: 1 }));
  ck('F12 a first write that lost the race to another first write is refused 409, not a server error', r.status === 409 && (await call(env, 'GET', id, token)).j.blob === other.blob, r);
}

console.log(bad ? `vault_server: ${bad} FAIL of ${n}` : `vault_server: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
