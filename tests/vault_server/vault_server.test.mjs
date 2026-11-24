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

console.log(bad ? `vault_server: ${bad} FAIL of ${n}` : `vault_server: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
