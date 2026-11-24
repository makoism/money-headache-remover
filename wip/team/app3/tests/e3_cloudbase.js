#!/usr/bin/env node
/* The base is saved only together with the book that holds it (DECISIONS_ROUND2 CS3; M61, M20). Two devices through the
   page on the local fake vault, made-up money. In each part the other device changed one spend and removed another, and
   both devices renamed the same pay. Whatever goes wrong on this device in the middle, afterwards both devices hold the
   changed spend, the removal, and the "which to keep" question with both names kept.
   (a) this device refuses the save while it takes the cloud copy (no space left), then is opened again;
   (b) this device's write is refused, and the retry cannot reach the cloud, then it sends again.
   Every tap is the person's own (Receipts, Settings, Send now); only the pay names are written through the store. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const rename = (p, id, name, at, by) => p.evaluate(async (id0, n, a, b) => { const s = await BurrowStore.open(); try { const r = await s.load(); const x = r.copy.schedules.find(y => y.id === id0); Object.assign(x, { name: n, at: a, by: b }); return (await s.save(r.copy)).ok; } finally { s.close(); } }, id, name, at, by);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
async function type(p, sel, text) { await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function log(p, amt, note) { await type(p, '#rcAmt', amt); await type(p, '#rcNote', note); await p.tap('#rcSave'); await T.w(400); }
async function change(p, id, amt) { await p.tap(`#rcList [data-rc="${id}"]`); await T.w(200); await p.$eval('#rcAmt', e => { e.value = ''; }); await type(p, '#rcAmt', amt); await p.tap('#rcSave'); await T.w(400); }
async function remove(p, id) { await p.tap(`#rcList [data-rc="${id}"]`); await T.w(200); await p.tap('#rcRemove'); await T.w(400); }
/* a device that can be made to refuse every save of the book (as when its space ran out); its own small device record still saves */
const NO_SAVE = () => {
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...a) { if (window.__noSave && this.name !== 'device') throw new DOMException('no space left', 'QuotaExceededError'); return put.apply(this, a); };
};
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3bA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3bB-')) });
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  const real = vault.handle;
  const down = () => { vault.handle = (m, id, tok, body, q) => { vault.log.push({ method: m, down: true }); return { status: 503, j: { error: { code: 'down' } } }; }; };
  const up = () => { vault.handle = real; };
  /* Settings, Send now, and wait until this sync is over (the button's own words come back) */
  const sendNow = async X => {
    if (!(await X.p.$('#a3CloudNow'))) { await X.p.click('#a3SetGo'); await until(async () => !!(await X.p.$('#a3CloudNow'))); }
    const n = vault.log.length;
    await X.p.click('#a3CloudNow');
    await until(() => vault.log.length > n, 4000); await T.w(900);
  };
  const closeSet = async X => { if (await X.p.$('#a3SetClose')) { await X.p.click('#a3SetClose'); await T.w(200); } };
  const receipts = async X => { await closeSet(X); await X.p.tap('[data-tab="receipts"]'); await T.w(250); };
  try {
    await A.p.evaluateOnNewDocument(NO_SAVE);
    const book = T.book(), sid = book.schedules[0].id;
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await receipts(A);
    await log(A.p, '1200', 'coffee one'); await log(A.p, '800', 'tea two'); await log(A.p, '1500', 'lunch three'); await log(A.p, '600', 'bun four');
    const ids = {}; for (const e of (await stored(A.p)).events) if (e.note) ids[e.note] = e.id;
    ck('(four spends are logged on A)', Object.keys(ids).length === 4, JSON.stringify(ids));
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    await T.w(600); await closeSet(A);
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.events.some(e => e.note === 'bun four'); }));
    await T.w(600); await closeSet(B);

    /* ---- both rename the same pay with no signal; B changes one spend and removes another; then B sends ---- */
    down();
    await rename(A.p, sid, 'Main job (desk)', '2026-12-10T09:00:00.000+09:00', 'dsk001'); await A.p.reload(); await T.w(500);
    await rename(B.p, sid, 'Main job (phone)', '2026-12-10T09:05:00.000+09:00', 'phn002'); await B.p.reload(); await T.w(500);
    await receipts(B);
    await change(B.p, ids['coffee one'], '2100'); await remove(B.p, ids['tea two']);
    up();
    await sendNow(B); await sendNow(B); await closeSet(B);
    ck('(B\'s changes are in the cloud)', (await stored(B.p)).events.find(e => e.id === ids['coffee one']).a === 2100);

    /* ---- (a) A takes the copy while it cannot save its book, then is opened again ---- */
    await A.p.evaluate(() => { window.__noSave = true; });
    await sendNow(A);
    ck('(a) while the save is refused, A\'s book is not replaced', (await stored(A.p)).events.find(e => e.id === ids['coffee one']).a === 1200);
    await A.p.evaluate(() => { window.__noSave = false; });
    await A.p.reload(); await T.w(1500);
    await sendNow(A); await sendNow(B); await sendNow(A); await sendNow(B);
    const kp = c => (c.keptVersions || []).find(k => k.of === sid);
    const names = c => (kp(c) ? kp(c).versions.map(v => v.name).sort().join('|') : 'none');
    let a = await stored(A.p), b = await stored(B.p);
    const amt = (c, n) => c.events.find(e => e.id === ids[n]).a, gone = (c, n) => !!c.events.find(e => e.id === ids[n]).gone;
    ck('(a) the spend B changed is 2,100 on both devices', amt(a, 'coffee one') === 2100 && amt(b, 'coffee one') === 2100, amt(a, 'coffee one') + ' ' + amt(b, 'coffee one'));
    ck('(a) the spend B removed stays removed on both devices', gone(a, 'tea two') && gone(b, 'tea two'), gone(a, 'tea two') + ' ' + gone(b, 'tea two'));
    ck('(a) the pay renamed on both is asked on both, both names kept (M20)', [a, b].every(c => kp(c) && kp(c).ask === true && names(c) === 'Main job (desk)|Main job (phone)'), names(a) + ' / ' + names(b));
    ck('(a) A\'s Settings shows the question', await until(async () => !!(await A.p.$('[data-cloudq=which]')), 3000));

    /* ---- (b) A's write is refused, and the retry cannot reach the cloud ---- */
    await closeSet(A); await closeSet(B);
    /* A is in the background while B works (it takes nothing by itself there) */
    await A.p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await receipts(B);
    await change(B.p, ids['lunch three'], '1900'); await remove(B.p, ids['bun four']);
    await sendNow(B); await sendNow(B); await closeSet(B);
    let armed = 2;   // the next write is refused as if another write landed first; the read after it finds no signal
    vault.handle = (m, id, tok, body, q) => {
      const plain = !q || !q.toString();
      if (armed === 2 && m === 'PUT') { armed = 1; vault.log.push({ method: m, refused: true }); return { status: 409, j: { error: { code: 'conflict' }, rev: rev() } }; }
      if (armed === 1 && m === 'GET' && plain) { armed = 0; vault.log.push({ method: m, down: true }); return { status: 503, j: { error: { code: 'down' } } }; }
      return real(m, id, tok, body, q);
    };
    await receipts(A);
    await log(A.p, '450', 'pen five');
    await T.w(1000);
    await sendNow(A);
    ck('(b) A\'s write was refused and its retry found no signal', await until(() => armed === 0, 5000), 'armed ' + armed);
    up();
    await A.p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); });
    await sendNow(A); await sendNow(B); await sendNow(A); await sendNow(B);
    a = await stored(A.p); b = await stored(B.p);
    ck('(b) the spend B changed is 1,900 on both devices', amt(a, 'lunch three') === 1900 && amt(b, 'lunch three') === 1900, amt(a, 'lunch three') + ' ' + amt(b, 'lunch three'));
    ck('(b) the spend B removed stays removed on both devices', gone(a, 'bun four') && gone(b, 'bun four'), gone(a, 'bun four') + ' ' + gone(b, 'bun four'));
    ck('(b) A\'s own new spend is on both devices', [a, b].every(c => c.events.some(e => e.note === 'pen five' && e.a === 450 && !e.gone)));
    ck('(b) the first part\'s changes are still there', amt(a, 'coffee one') === 2100 && gone(b, 'tea two'));
    ck('(b) the pay question is still asked on both, both names kept (M20)', [a, b].every(c => kp(c) && kp(c).ask === true && names(c) === 'Main job (desk)|Main job (phone)'), names(a) + ' / ' + names(b));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource|no space left/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_cloudbase');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
