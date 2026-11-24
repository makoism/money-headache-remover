/* app3's fake vault (wip/team/app3/tests/fake_vault.js) must answer as the real server does. The same calls go to both
   (the server through worker/index.js on the D1 stand-in) and the answers are compared: status, error code, rev,
   created, deleted, the versions listed and the blob read back.   node tests/vault_server/fake_parity.test.mjs
   When the fake file is not there (the server-only branch for main), this says so and passes. */
import worker from '../../worker/index.js';
import { makeD1 } from './d1_stub.mjs';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const FAKE = new URL('../../wip/team/app3/tests/fake_vault.js', import.meta.url);
if (!existsSync(FAKE)) { console.log('fake_parity: SKIPPED (no app3 fake in this tree)'); process.exit(0); }
const { makeVault } = createRequire(import.meta.url)(FAKE.pathname);

let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + JSON.stringify(extra).slice(0, 400))); if (!ok) bad++; };
const db = makeD1(), env = { DB: db, VAULT_IP_PER_MINUTE: '1000000', ASSETS: { fetch: async () => new Response('') } };
const fake = makeVault();
async function server(method, id, token, body, query) {
  const r = await worker.fetch(new Request('https://x.test/api/vault/' + id + (query || ''), { method, headers: Object.assign({ 'x-vault-token': token }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined }), env, { waitUntil() {} });
  let j = {}; try { j = await r.json(); } catch (e) { /* none */ }
  return { status: r.status, j };
}
const pick = j => ({ code: j.error && j.error.code, rev: j.rev, created: typeof j.created === 'boolean' ? j.created : undefined, deleted: typeof j.deleted === 'boolean' ? j.deleted : j.deleted != null ? 'time' : undefined, blob: j.blob, hasPrev: j.hasPrev, versions: j.versions && j.versions.map(v => v.rev) });
async function both(name, method, id, token, body, query) {
  const a = await server(method, id, token, body, query);
  const b = fake.handle(method, id, token, body ? JSON.parse(JSON.stringify(body)) : null, new URLSearchParams(query || ''));
  const pa = JSON.stringify([a.status, pick(a.j)]), pb = JSON.stringify([b.status, pick(b.j)]);
  ck(name + ' (' + a.status + ')', pa === pb, { server: pa, fake: pb });
}
const hex = k => randomBytes(k).toString('hex'), ivOf = () => randomBytes(12).toString('base64');
const oldBlob = () => ({ blob: randomBytes(200).toString('base64'), iv: ivOf() });
const envBlob = over => { const iv = ivOf(); return { blob: Buffer.from(JSON.stringify(Object.assign({ fmt: 'gz1', v: 3, enc: 'aes-gcm', iv, data: 'AAAA' }, over || {}))).toString('base64'), iv }; };

{
  const id = hex(32), t = hex(32), o = Object.assign;
  await both('old: GET nothing', 'GET', id, t);
  await both('old: first PUT', 'PUT', id, t, o(oldBlob(), { rev: 10 }));
  await both('old: PUT no base, higher rev', 'PUT', id, t, o(oldBlob(), { rev: 20 }));
  await both('old: PUT lower rev', 'PUT', id, t, o(oldBlob(), { rev: 15 }));
  await both('old: PUT force', 'PUT', id, t, o(oldBlob(), { rev: 15, force: true }));
  await both('old: PUT right base', 'PUT', id, t, o(oldBlob(), { rev: 30, base: 15 }));
  await both('old: PUT old base', 'PUT', id, t, o(oldBlob(), { rev: 40, base: 15 }));
  await both('old: wrong token', 'GET', id, hex(32));
  await both('old: versions', 'GET', id, t, null, '?versions=1');
  await both('old: DELETE', 'DELETE', id, t);
  await both('old: GET after delete', 'GET', id, t);
  await both('old: PUT after delete', 'PUT', id, t, o(oldBlob(), { rev: 50 }));
}
{
  const id = hex(32), t = hex(32), o = Object.assign;
  await both('app3: bad fmt', 'PUT', id, t, o(envBlob({ fmt: 'gz2' }), { rev: 1 }));
  await both('app3: newer v', 'PUT', id, t, o(envBlob({ v: 4 }), { rev: 1 }));
  await both('app3: not encrypted', 'PUT', id, t, o(envBlob({ enc: 'none' }), { rev: 1 }));
  await both('app3: first PUT', 'PUT', id, t, o(envBlob(), { rev: 1 }));
  await both('app3: no base', 'PUT', id, t, o(envBlob(), { rev: 2 }));
  await both('app3: force no base', 'PUT', id, t, o(envBlob(), { rev: 2, force: true }));
  await both('app3: ciphertext over app3', 'PUT', id, t, o(oldBlob(), { rev: 2, base: 1 }));
  for (let i = 2; i <= 13; i++) await both('app3: PUT rev ' + i, 'PUT', id, t, o(envBlob(), { rev: i, base: i - 1 }));
  await both('app3: old base', 'PUT', id, t, o(envBlob(), { rev: 20, base: 5 }));
  await both('app3: versions', 'GET', id, t, null, '?versions=1');
  await both('app3: rev 3 read', 'GET', id, t, null, '?rev=3');
  await both('app3: rev 2 gone', 'GET', id, t, null, '?rev=2');
  await both('app3: plain GET', 'GET', id, t);
  await both('app3: DELETE', 'DELETE', id, t);
  await both('app3: GET deleted', 'GET', id, t);
  await both('app3: PUT deleted, old base', 'PUT', id, t, o(envBlob(), { rev: 14, base: 13 }));
  await both('app3: PUT deleted, no base', 'PUT', id, t, o(envBlob(), { rev: 14 }));
  await both('app3: wrong token on marker', 'GET', id, hex(32));
  await both('app3: DELETE again', 'DELETE', id, t);
  await both('app3: fresh turn-on', 'PUT', id, t, o(envBlob(), { rev: 14, fresh: true }));
  await both('app3: GET after fresh', 'GET', id, t);
}
console.log(bad ? `fake_parity: ${bad} FAIL of ${n}` : `fake_parity: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
