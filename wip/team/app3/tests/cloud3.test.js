#!/usr/bin/env node
/* The cloud copy's core (src/cloud3.js) in node, against the local fake vault (tests/fake_vault.js), never the real server.
   Two devices with the made-up Mako book: turning on sends only ciphertext under the new shape's own id (not the id the old
   app makes from the same code); a second device with nothing takes the copy and sends nothing back; edits to different
   records on two devices join; the same record changed on both is asked and both versions are kept in keptVersions; a
   write based on an old revision is refused by the vault and joined again (AW5); a newer shape in the cloud is refused
   and nothing changes; a wrong code is said; a device with its own copy and no base asks which whole copy to keep (AW2); a copy deleted on another
   device (410) is said as deleted and nothing is sent. */
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

  // ---- the cloud copy deleted on another device: said as such, never a server error, nothing sent [410] ----
  {
    const v3 = makeVault(), api3 = C.client({ fetch: v3.fetch, base: () => 'http://vault.test' });
    let ra = await C.syncOnce({ api: api3, pack, S, keys, device: {}, copy: clone(BOOK) });
    const putsBefore = v3.log.filter(x => x.method === 'PUT').length;
    await api3.del(keys);
    const mine = clone(ra.copy); mine.schedules[0].name = 'Changed after the delete';
    r = await C.syncOnce({ api: api3, pack, S, keys, device: ra.device, copy: mine });
    ck('a copy deleted on another device is said as deleted (410), not a server error', !r.ok && r.why === 'deleted', JSON.stringify(r).slice(0, 200));
    ck('nothing is sent after the delete, and the copy here stays', v3.log.filter(x => x.method === 'PUT').length === putsBefore && !v3.rows.size && r.copy.schedules[0].name === 'Changed after the delete');
    // deleted between the read and the write: the write's 410 is said the same way
    const v4 = makeVault(), api4 = C.client({ fetch: v4.fetch, base: () => 'http://vault.test' });
    ra = await C.syncOnce({ api: api4, pack, S, keys, device: {}, copy: clone(BOOK) });
    const mine2 = clone(ra.copy); mine2.schedules[0].name = 'Changed here';
    const apiGone = { get: k => api4.get(k), del: k => api4.del(k), put: async (k, b) => { await api4.del(k); return api4.put(k, b); } };
    r = await C.syncOnce({ api: apiGone, pack, S, keys, device: ra.device, copy: mine2 });
    ck('a write refused because the copy was just deleted is said as deleted too', !r.ok && r.why === 'deleted' && !v4.rows.size, JSON.stringify(r).slice(0, 200));
  }

  // ---- CS3: the base is never ahead of the book. A write is refused, then the retry fails: the device keeps the base it
  //      started with, so the next sync joins again. The other device changed one spend, removed another, and renamed
  //      the pay this device renamed too (M20): all of it survives on both, and the question is asked ----
  {
    const v5 = makeVault(), api5 = C.client({ fetch: v5.fetch, base: () => 'http://vault.test' });
    const bank = BOOK.accounts[0].id, sid = BOOK.schedules[0].id;
    const sp = (id, a, at) => ({ id, k: 'spend', acct: bank, date: '2026-12-06', a, told: at.slice(0, 16) + '+09:00', at, by: 'dsk001' });
    const start = clone(BOOK); start.events.push(sp('dsk001-q4w8e2r6t1-1', 1200, '2026-12-06T10:00:00.000+09:00'), sp('dsk001-q4w8e2r6t1-2', 800, '2026-12-06T10:05:00.000+09:00'));
    let a = await C.syncOnce({ api: api5, pack, S, keys, device: {}, copy: start });
    let Aa = { copy: a.copy, dev: a.device };
    let b = await C.syncOnce({ api: api5, pack, S, keys, device: {}, copy: null });
    let Bb = { copy: b.copy, dev: b.device };
    // the other device: one spend changed, one removed, the pay renamed
    const x = Bb.copy.events.find(e => e.id === 'dsk001-q4w8e2r6t1-1'); Object.assign(x, { a: 2100, at: '2026-12-07T09:00:00.000+09:00', by: 'phn002' });
    const y = Bb.copy.events.find(e => e.id === 'dsk001-q4w8e2r6t1-2'); Object.assign(y, { gone: '2026-12-07', at: '2026-12-07T09:01:00.000+09:00', by: 'phn002' });
    Object.assign(Bb.copy.schedules.find(s => s.id === sid), { name: 'Main job (phone)', at: '2026-12-07T09:02:00.000+09:00', by: 'phn002' });
    b = await C.syncOnce({ api: api5, pack, S, keys, device: Bb.dev, copy: Bb.copy }); Bb = { copy: b.copy, dev: b.device };
    // this device renamed the same pay; its write is refused once (as when another write lands first), then the cloud cannot be reached
    Object.assign(Aa.copy.schedules.find(s => s.id === sid), { name: 'Main job (desk)', at: '2026-12-07T08:00:00.000+09:00', by: 'dsk001' });
    let refusedOnce = false, down = false;
    const apiA = { del: k => api5.del(k), rev: k => api5.rev(k),
      get: k => (down ? Promise.resolve({ status: 0, ok: false, j: {} }) : api5.get(k)),
      put: async (k, body, ka) => { if (!refusedOnce) { refusedOnce = true; down = true; return { status: 409, ok: false, j: { error: { code: 'conflict' } } }; } return api5.put(k, body, ka); } };
    const mine = clone(Aa.copy);
    const f = await C.syncOnce({ api: apiA, pack, S, keys, device: Aa.dev, copy: mine });
    ck('CS3: a refused write then a failed retry is a failed sync', !f.ok && f.why === 'net');
    ck('CS3: the device keeps the base it started with, never the one it took on the way', f.device.baseRev === Aa.dev.baseRev && canon(f.device.base) === canon(Aa.dev.base), 'baseRev ' + f.device.baseRev + ' started ' + Aa.dev.baseRev);
    // the page keeps its book and whatever base the failed sync handed it; the next sync, online again
    down = false;
    a = await C.syncOnce({ api: api5, pack, S, keys, device: f.device, copy: mine }); Aa = { copy: a.copy, dev: a.device };
    b = await C.syncOnce({ api: api5, pack, S, keys, device: Bb.dev, copy: Bb.copy }); Bb = { copy: b.copy, dev: b.device };
    const amt = c => c.events.find(e => e.id === 'dsk001-q4w8e2r6t1-1').a, gone = c => !!c.events.find(e => e.id === 'dsk001-q4w8e2r6t1-2').gone;
    ck('CS3: the other device\'s changed spend survives on both', amt(Aa.copy) === 2100 && amt(Bb.copy) === 2100, amt(Aa.copy) + ' ' + amt(Bb.copy));
    ck('CS3: the other device\'s removed spend stays removed on both', gone(Aa.copy) && gone(Bb.copy));
    const kp = c => (c.keptVersions || []).find(k => k.id === 'kept:' + sid);
    ck('CS3: the pay renamed on both is still asked, both names kept (M20)', [Aa.copy, Bb.copy].every(c => kp(c) && kp(c).ask === true && kp(c).versions.map(v => v.name).sort().join('|') === 'Main job (desk)|Main job (phone)'), JSON.stringify(kp(Aa.copy)));
    ck('CS3: both devices hold the same copy', canon(Aa.copy) === canon(Bb.copy));
  }

  // ---- CS2: asking only for the revision (no copy comes back), for the timed take ----
  {
    const v6 = makeVault(), api6 = C.client({ fetch: v6.fetch, base: () => 'http://vault.test' });
    let rv = await C.revOnly({ api: api6, keys });
    ck('revOnly: nothing stored reads as revision 0', rv.ok && rv.rev === 0, JSON.stringify(rv));
    const ra = await C.syncOnce({ api: api6, pack, S, keys, device: {}, copy: clone(BOOK) });
    const before = v6.log.length;
    rv = await C.revOnly({ api: api6, keys });
    ck('revOnly: after a send the cloud\'s revision is this device\'s baseRev', rv.ok && rv.rev === ra.device.baseRev, JSON.stringify(rv));
    const call = v6.log[v6.log.length - 1];
    ck('revOnly: one call, asking for versions only, and no copy in the answer', v6.log.length === before + 1 && call.method === 'GET' && call.query === 'versions=1' && !('blob' in v6.handle('GET', keys.id, keys.token, null, new URLSearchParams('versions=1')).j));
    const rb = await C.syncOnce({ api: api6, pack, S, keys, device: {}, copy: null });
    ck('revOnly: after a take too', (await C.revOnly({ api: api6, keys })).rev === rb.device.baseRev);
    rv = await C.revOnly({ api: api6, keys: Object.assign({}, keys, { token: 'ab'.repeat(32) }) });
    ck('revOnly: a token the vault does not accept is a code problem', !rv.ok && rv.why === 'code', JSON.stringify(rv));
    await api6.del(keys);
    rv = await C.revOnly({ api: api6, keys });
    ck('revOnly: a copy deleted on another device is said as deleted (410), as a full sync says it', !rv.ok && rv.why === 'deleted', JSON.stringify(rv));
    const off = C.client({ fetch: async () => { throw new TypeError('Failed to fetch'); }, base: () => 'http://vault.test' });
    rv = await C.revOnly({ api: off, keys });
    ck('revOnly: no connection is said as such', !rv.ok && rv.why === 'net');
  }

  // ---- CS1, B3: a book as the store loads it (an empty keptVersions list, its revision and save time) with nothing
  //      changed is not a change: no write. Found by e3_cloudsend: every reload sent one copy and counted one send ----
  {
    const v9 = makeVault(), api9 = C.client({ fetch: v9.fetch, base: () => 'http://vault.test' });
    const b0 = clone(BOOK); delete b0.keptVersions;
    const first = await C.syncOnce({ api: api9, pack, S, keys, device: {}, copy: b0 });
    const loaded = Object.assign(clone(first.copy), { keptVersions: [], rev: 7, at: '2026-12-01T10:00:00.000+09:00' });
    const puts9 = v9.log.filter(x => x.method === 'PUT').length;
    const again = await C.syncOnce({ api: api9, pack, S, keys, device: first.device, copy: loaded });
    ck('a book loaded from the store with an empty keptVersions list and nothing changed is not sent', again.ok && !again.pushed && v9.log.filter(x => x.method === 'PUT').length === puts9, JSON.stringify({ pushed: again.pushed }));
    ck('and noRev drops an empty keptVersions list, as it drops the store\'s marks', !('keptVersions' in C.noRev({ keptVersions: [], rev: 1 })) && C.noRev({ keptVersions: [{ id: 'kept:x' }] }).keptVersions.length === 1);
  }

  // ---- CS1: a leaving send too big to outlive the page goes as a plain send; a take that must not send ----
  {
    const v7 = makeVault();
    const seen = [];
    // as the browser does: a send that outlives the page (keepalive) is refused at once when its body is over 64 KB
    const fetch7 = async (url, o) => { o = o || {}; if (o.method === 'PUT') seen.push({ keepalive: !!o.keepalive, size: (o.body || '').length }); if (o.keepalive && (o.body || '').length > 65536) throw new TypeError('Failed to fetch'); return v7.fetch(url, o); };
    const api7 = C.client({ fetch: fetch7, base: () => 'http://vault.test' });
    const big = clone(BOOK);
    const rnd = n => require('crypto').randomBytes(n).toString('hex');
    for (let i = 1; i <= 900; i++) big.events.push({ id: 'dsk001-b7n3k9s2x4-' + i, k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-01', a: 100 + i, note: rnd(40), told: '2026-12-01T10:00:00.000+09:00', at: '2026-12-01T10:00:00.000+09:00', by: 'dsk001' });
    let r7 = await C.syncOnce({ api: api7, pack, S, keys, device: {}, copy: big, keepalive: true });
    ck('a leaving send over 64 KB is sent as a plain send, and lands', r7.ok && r7.pushed && seen.length === 1 && seen[0].size > 65536 && seen[0].keepalive === false && v7.rows.size === 1, JSON.stringify(seen));
    const small = makeVault(), seen2 = [];
    const api8 = C.client({ fetch: async (url, o) => { if (o && o.method === 'PUT') seen2.push(!!o.keepalive); return small.fetch(url, o); }, base: () => 'http://vault.test' });
    let r8 = await C.syncOnce({ api: api8, pack, S, keys, device: {}, copy: clone(BOOK), keepalive: true });
    ck('a small leaving send still goes as one that outlives the page', r8.ok && seen2.length === 1 && seen2[0] === true);
    // a take that must not send (the day's guard is reached): the cloud's news comes in, this device's change stays here
    const other = await C.syncOnce({ api: api8, pack, S, keys, device: {}, copy: null });
    other.copy.events.push({ id: 'phn002-m2c8v5z1q7-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-08', a: 640, told: '2026-12-08T09:00:00.000+09:00', at: '2026-12-08T09:00:00.000+09:00', by: 'phn002' });
    const o2 = await C.syncOnce({ api: api8, pack, S, keys, device: other.device, copy: other.copy });
    const mine = clone(r8.copy); mine.events.push({ id: 'dsk001-b7n3k9s2x4-901', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-08', a: 310, told: '2026-12-08T09:30:00.000+09:00', at: '2026-12-08T09:30:00.000+09:00', by: 'dsk001' });
    const putsBefore = small.log.filter(x => x.method === 'PUT').length;
    const t = await C.syncOnce({ api: api8, pack, S, keys, device: r8.device, copy: mine, take: true });
    ck('a take that must not send: nothing is written to the cloud', t.ok && !t.pushed && small.log.filter(x => x.method === 'PUT').length === putsBefore);
    ck('it brings the other device\'s spend and keeps this device\'s own', t.copy.events.some(e => e.id === 'phn002-m2c8v5z1q7-1') && t.copy.events.some(e => e.id === 'dsk001-b7n3k9s2x4-901'));
    ck('its base is the cloud\'s copy, so this device\'s spend is still waiting', t.device.baseRev === o2.device.baseRev && !t.device.base.events.some(e => e.id === 'dsk001-b7n3k9s2x4-901') && t.waiting === true);
    const later = await C.syncOnce({ api: api8, pack, S, keys, device: t.device, copy: t.copy });
    ck('and it is sent by the next sync that may send', later.ok && later.pushed && later.copy.events.some(e => e.id === 'dsk001-b7n3k9s2x4-901'));
  }

  console.log(bad ? `cloud3: ${bad} FAIL of ${n}` : `cloud3: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
