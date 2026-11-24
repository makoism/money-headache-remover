#!/usr/bin/env node
/* The cloud copy's core (src/cloud3.js) in node, against the local fake vault (tests/fake_vault.js), never the real server.
   Two devices with the made-up Mako book: turning on sends only ciphertext under the new shape's own id (not the id the old
   app makes from the same code); a second device with nothing takes the copy and sends nothing back; edits to different
   records on two devices join; the same record changed on both is asked and both versions are kept in keptVersions; a
   write based on an old revision is refused by the vault and joined again (AW5); a newer shape in the cloud is refused
   and nothing changes; a wrong code is said; a device with its own copy and no base asks which whole copy to keep (AW2). */
'use strict';
const path = require('path');
globalThis.window = globalThis;   // pack.js and guard.js are browser files
require('../../store/guard.js'); require('../../store/pack.js');
const C = require('../src/cloud3.js');
const S = require('../../engine/sync.js');
const { makeVault } = require('./fake_vault.js');
const BOOK = require('../fixtures/mako_madeup_book.json');
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 400))); if (!ok) bad++; };
const clone = x => JSON.parse(JSON.stringify(x));
const canon = x => S.canon(x);

(async () => {
  const vault = makeVault();
  const api = C.client({ fetch: vault.fetch, base: () => 'http://vault.test' });
  const pack = window.BurrowPack;
  const code = C.newCode();
  ck('a new code is 20 letters and digits that are hard to misread', C.codeValid(code) && !/[01OIL]/.test(code), code);
  ck('the code is shown in groups of four, with no prefix', C.codeShow(code) === code.match(/.{4}/g).join('-'), C.codeShow(code));
  ck('a typed code is read back however it was written', C.codeClean(' ' + C.codeShow(code).toLowerCase() + ' ') === code);
  ck('an older code written with MHR- in front is still read', C.codeClean('MHR-' + C.codeShow(code)) === code && C.codeClean(' mhr ' + code.toLowerCase()) === code);
  ck('a code that itself starts with MHR keeps those letters', C.codeClean('MHRA-BCDE-FGHJ-KMNP-QRST') === 'MHRABCDEFGHJKMNPQRST');
  const keys = await C.keysFor(code);
  ck('the code makes a vault id, a token and a key', /^[a-f0-9]{64}$/.test(keys.id) && /^[a-f0-9]{64}$/.test(keys.token) && !!keys.key);

  // the old app's id for the same code (ui42.js keysFor: HKDF info 'id'): never the same record [E3]
  {
    const sub = crypto.subtle, enc = new TextEncoder();
    const base = await sub.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
    const bits = await sub.deriveBits({ name: 'PBKDF2', salt: enc.encode('mhr2000-vault-v1'), iterations: 150000, hash: 'SHA-256' }, base, 256);
    const hk = await sub.importKey('raw', bits, 'HKDF', false, ['deriveBits']);
    const oldId = Buffer.from(await sub.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode('id') }, hk, 256)).toString('hex');
    ck('the new shape\'s copy sits under its own id, not the old app\'s [E3]', oldId !== keys.id && oldId.length === 64);
  }

  // ---- device A turns it on ----
  const by = { a: 'dsk001', b: 'phn002' };
  let A = { copy: clone(BOOK), dev: {} }, B = { copy: null, dev: {} };
  let r = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy });
  ck('A sends its copy', r.ok && r.pushed && vault.rows.get(keys.id) && vault.rows.get(keys.id).rev === r.device.baseRev, JSON.stringify(r).slice(0, 200));
  A = { copy: r.copy, dev: r.device };
  {
    const sent = vault.log.filter(x => x.method === 'PUT').map(x => JSON.stringify(x.body)).join(' ');
    const names = BOOK.schedules.map(s => s.name).concat(BOOK.accounts.map(a => a.name));
    ck('only ciphertext leaves the device (no name or amount in what was sent)', names.every(nm => !sent.includes(nm)) && !sent.includes('286000'));
    const env = C.unwrap(vault.rows.get(keys.id).blob);
    ck('the cloud copy is the pack envelope: fmt gz1, v 3, aes-gcm, read before decrypting', env.fmt === 'gz1' && env.v === 3 && env.enc === 'aes-gcm' && typeof env.data === 'string');
  }

  // ---- device B, empty, takes it ----
  const putsBefore = vault.log.filter(x => x.method === 'PUT').length;
  r = await C.syncOnce({ api, pack, S, keys, device: B.dev, copy: B.copy });
  ck('B with nothing takes the cloud copy and sends nothing back', r.ok && !r.pushed && canon(r.copy) === canon(A.copy) && vault.log.filter(x => x.method === 'PUT').length === putsBefore);
  B = { copy: r.copy, dev: r.device };

  // ---- different records on two devices: joined ----
  const sched = BOOK.schedules[0].id, sched2 = BOOK.schedules[1].id;
  const evA = { id: 'dsk001-a1b2c3d4e5-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-02', a: 1200, told: '2026-12-02T12:00+09:00', at: '2026-12-02T12:00:00.000+09:00', by: by.a };
  A.copy.events.push(evA);
  const s2 = B.copy.schedules.find(s => s.id === sched2); s2.name = 'Side work'; s2.at = '2026-12-02T13:00:00.000+09:00'; s2.by = by.b;
  r = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy }); A = { copy: r.copy, dev: r.device };
  ck('A sends its new spend', r.ok && r.pushed);
  r = await C.syncOnce({ api, pack, S, keys, device: B.dev, copy: B.copy }); B = { copy: r.copy, dev: r.device };
  ck('B joins A\'s spend with its own rename and sends the join', r.ok && r.merged && r.pushed && B.copy.events.some(e => e.id === evA.id) && B.copy.schedules.find(s => s.id === sched2).name === 'Side work');
  r = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy }); A = { copy: r.copy, dev: r.device };
  ck('A takes the join: both devices hold the same copy', r.ok && !r.pushed && canon(A.copy) === canon(B.copy));
  ck('no question when different records changed', r.questions.length === 0, JSON.stringify(r.questions));

  // ---- the same record changed two ways: asked, both kept [AQ3, AW7] ----
  const sa = A.copy.schedules.find(s => s.id === sched); sa.name = 'Main job (desk)'; sa.at = '2026-12-03T09:00:00.000+09:00'; sa.by = by.a;
  const sb = B.copy.schedules.find(s => s.id === sched); sb.name = 'Main job (phone)'; sb.at = '2026-12-03T09:05:00.000+09:00'; sb.by = by.b;
  r = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy }); A = { copy: r.copy, dev: r.device };
  r = await C.syncOnce({ api, pack, S, keys, device: B.dev, copy: B.copy }); B = { copy: r.copy, dev: r.device };
  const kept = (B.copy.keptVersions || []).find(k => k.id === 'kept:' + sched);
  ck('the same record changed on two devices is asked', r.questions.some(q => q.q === 'which' && q.of === sched), JSON.stringify(r.questions));
  ck('both versions are kept in keptVersions', kept && kept.ask === true && kept.versions.map(v => v.name).sort().join('|') === 'Main job (desk)|Main job (phone)', JSON.stringify(kept));
  ck('until the person picks, the newer shows', B.copy.schedules.find(s => s.id === sched).name === 'Main job (phone)');
  // the person picks the desk's on B; A takes it
  const pick = kept.versions.findIndex(v => v.name === 'Main job (desk)');
  B.copy = S.answer({ copy: B.copy, of: sched, pick, now: '2026-12-03T10:00:00.000+09:00', by: by.b });
  r = await C.syncOnce({ api, pack, S, keys, device: B.dev, copy: B.copy }); B = { copy: r.copy, dev: r.device };
  r = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy }); A = { copy: r.copy, dev: r.device };
  ck('the pick reaches the other device and the question is gone', A.copy.schedules.find(s => s.id === sched).name === 'Main job (desk)' && r.questions.length === 0 && canon(A.copy) === canon(B.copy), JSON.stringify(r.questions));
  ck('the version not picked stays kept, so Undo can bring it back', A.copy.keptVersions.find(k => k.id === 'kept:' + sched).versions.some(v => v.name === 'Main job (phone)'));

  // ---- compare and swap: a write based on an old revision is refused, then joined [AQ1, AW5] ----
  {
    const evB = { id: 'phn002-z9y8x7w6v5-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-04', a: 800, told: '2026-12-04T08:00+09:00', at: '2026-12-04T08:00:00.000+09:00', by: by.b };
    const evA2 = { id: 'dsk001-a1b2c3d4e5-2', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-04', a: 450, told: '2026-12-04T08:01+09:00', at: '2026-12-04T08:01:00.000+09:00', by: by.a };
    B.copy.events.push(evB); A.copy.events.push(evA2);
    let sneaked = false, refused = 0;
    const apiB = { get: k => api.get(k), del: k => api.del(k), put: async (k, b) => {
      if (!sneaked) { sneaked = true; const ra = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy }); A = { copy: ra.copy, dev: ra.device }; }
      const p = await api.put(k, b); if (p.status === 409) refused++; return p; } };
    r = await C.syncOnce({ api: apiB, pack, S, keys, device: B.dev, copy: B.copy }); B = { copy: r.copy, dev: r.device };
    ck('B\'s write based on the old revision was refused by the vault', refused === 1);
    ck('B joined the latest and wrote: both spends are there, once each', r.ok && r.pushed && [evA2.id, evB.id].every(id => B.copy.events.filter(e => e.id === id).length === 1));
    r = await C.syncOnce({ api, pack, S, keys, device: A.dev, copy: A.copy }); A = { copy: r.copy, dev: r.device };
    ck('A takes it: the same copy on both', canon(A.copy) === canon(B.copy));
  }

  // ---- a newer shape in the cloud: refused, nothing changes [D6] ----
  {
    const v2 = makeVault(), api2 = C.client({ fetch: v2.fetch, base: () => 'http://vault.test' });
    const env = await pack.pack(Object.assign(clone(BOOK), { v: 4 }), { key: keys.key });
    const p = await api2.put(keys, Object.assign(C.wrap(env), { rev: 9 }));
    ck('the vault itself refuses a copy of a newer shape (422 newer_shape)', p.status === 422 && p.j.error.code === 'newer_shape' && !v2.rows.size, JSON.stringify(p));
    // a newer version's copy already there (written by a server that knows v 4): planted as that server would hold it
    v2.rows.set(keys.id, Object.assign({ token_hash: require('crypto').createHash('sha256').update(keys.token).digest('hex'), rev: 9, updated: 1, created: 1, versions: [] }, C.wrap(env)));
    const mine = clone(BOOK);
    r = await C.syncOnce({ api: api2, pack, S, keys, device: {}, copy: mine });
    ck('a copy saved by a newer version is refused and nothing is sent over it', !r.ok && r.why === 'newer' && v2.rows.get(keys.id).rev === 9 && canon(mine) === canon(BOOK), JSON.stringify(r).slice(0, 200));
  }
  // ---- a wrong code ----
  {
    const k2 = Object.assign({}, keys, { token: 'ab'.repeat(32) });
    r = await C.syncOnce({ api, pack, S, keys: k2, device: A.dev, copy: A.copy });
    ck('a token the vault does not accept is said as a code problem', !r.ok && r.why === 'code');
  }
  // ---- no connection ----
  {
    const off = C.client({ fetch: async () => { throw new TypeError('Failed to fetch'); }, base: () => 'http://vault.test' });
    r = await C.syncOnce({ api: off, pack, S, keys, device: A.dev, copy: A.copy });
    ck('no connection is said as such and the device keeps its base', !r.ok && r.why === 'net' && r.device.baseRev === A.dev.baseRev);
  }
  // ---- AW2: a device with its own copy and no base meets a cloud copy ----
  {
    const own = clone(BOOK); own.schedules[0].name = 'Typed here'; own.schedules[0].at = '2026-12-05T09:00:00.000+09:00'; own.schedules[0].by = 'tab003';
    r = await C.syncOnce({ api, pack, S, keys, device: {}, copy: own });
    const k = (r.copy.keptVersions || []).find(x => x.id === 'kept:copy');
    ck('a device with its own copy and no base asks which whole copy to keep [AW2]', r.ok && r.firstJoin && r.questions.some(q => q.q === 'which' && q.of === 'copy') && k && k.versions.length === 2, JSON.stringify(r.questions));
    ck('meanwhile the cloud\'s copy shows', r.copy.schedules[0].name === A.copy.schedules[0].name);
  }

  console.log(bad ? `cloud3: ${bad} FAIL of ${n}` : `cloud3: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
