#!/usr/bin/env node
/* The device takes the cloud copy by itself (DECISIONS_ROUND2 CS2; SYNC_PULL_PLAN B1, B3; M67, M61, M36). Two devices
   through the page on the local fake vault, made-up money.
   The clocks: the page's own cloud timers run 20 times faster here (a take every 3 s for 60 s, and so on), set by a value
   this harness puts in the page before its scripts run. Nothing else is changed, and no wait hides a step.
   1. B logs a spend and sends it; A, in view and untouched, shows it by itself.
   2. With nothing changed the timer asks only for the revision: no copy fetched, nothing sent, nothing written on the device.
   3. A in the background takes nothing; back in view it takes at once.
   4. Two tabs: "Stop here" in one tab is not undone by the other tab.
   5. A newer version's copy, then a code the cloud does not accept: the timer stops and Home says so once.
   6. B1: a device with its own numbers joins while it cannot save: at most one write in three minutes, and Home says so once.
   7. B3: logged with no signal, the page killed, opened with signal: sent with no tap.
   8. The copy deleted on another device is found by the timed check and said as a full sync says it. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10', SPEED = 20, TICK = 60000 / SPEED;
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const device = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { return ((await s.getDevice()) || {}).cloud || null; } finally { s.close(); } });
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
async function type(p, sel, text) { await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function log(p, amt, note) { await type(p, '#rcAmt', amt); await type(p, '#rcNote', note); await p.tap('#rcSave'); await T.w(300); }
const rowsText = p => p.$$eval('#rcList [data-rc]', rs => rs.map(r => r.textContent.replace(/\s+/g, ' ').trim()).join(' | ')).catch(() => '');
const view = (p, on) => p.evaluate(v => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') }); document.dispatchEvent(new Event('visibilitychange')); }, on);
const band = p => p.$eval('#a3Msg', e => e.textContent).catch(() => '');
const FAST = sp => { window.__burrow3CloudSpeed = sp; };
const NO_SAVE = () => {
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...a) { if (window.__noSave && this.name !== 'device') throw new DOMException('no space left', 'QuotaExceededError'); return put.apply(this, a); };
};
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3tA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3tB-')) });
  let C = null;
  const real = vault.handle;
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  const calls = (from, f) => vault.log.slice(from).filter(f);
  const isRev = x => x.method === 'GET' && x.query === 'versions=1', isCopy = x => x.method === 'GET' && !x.query, isPut = x => x.method === 'PUT';
  const sendNow = async X => {
    if (!(await X.p.$('#a3CloudNow'))) { await X.p.click('#a3SetGo'); await until(async () => !!(await X.p.$('#a3CloudNow'))); }
    const n = vault.log.length;
    await X.p.click('#a3CloudNow');
    await until(() => vault.log.length > n, 4000); await T.w(700);
    await X.p.click('#a3SetClose'); await T.w(200);
  };
  const receipts = async X => { await X.p.tap('[data-tab="receipts"]'); await T.w(250); };
  try {
    for (const X of [A, B]) await X.p.evaluateOnNewDocument(FAST, SPEED);
    const book = T.book();
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    await T.w(500); await A.p.click('#a3SetClose');
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await T.w(500); await B.p.click('#a3SetClose'); await T.w(200);

    /* ---- 1. B logs and sends; A shows it by itself ---- */
    await receipts(A); await receipts(B);
    await log(B.p, '1200', 'coffee one'); await sendNow(B);
    ck('1. A shows B\'s spend in Receipts with no tap, within three timed checks', await until(async () => /coffee one/.test(await rowsText(A.p)), 3 * TICK + 1500), await rowsText(A.p));
    ck('1. A\'s saved book holds it', (await stored(A.p)).events.some(e => e.note === 'coffee one' && e.a === 1200));
    await A.p.tap('[data-tab="home"]'); await T.w(200);

    /* ---- 2. nothing changed: only the revision is asked, nothing is written ---- */
    await T.w(TICK + 500);
    let from = vault.log.length; const dev0 = JSON.stringify(await device(A.p)), rev0 = rev();
    await T.w(3 * TICK + 500);
    ck('2. the timer asked for the revision (both devices, at least four calls in three checks)', calls(from, isRev).length >= 4, calls(from, isRev).length);
    ck('2. no copy was fetched and nothing was sent', calls(from, isCopy).length === 0 && calls(from, isPut).length === 0 && rev() === rev0, JSON.stringify(vault.log.slice(from).map(x => x.method + ' ' + x.query)));
    ck('2. nothing was written on the device', JSON.stringify(await device(A.p)) === dev0);

    /* ---- 3. in the background nothing is asked; back in view it takes at once ---- */
    await view(A.p, false); await view(B.p, false); await T.w(300);
    from = vault.log.length;
    await T.w(2 * TICK);
    ck('3. no call from a page in the background', vault.log.length === from, vault.log.length - from);
    await view(B.p, true); await receipts(B); await log(B.p, '700', 'tea two'); await sendNow(B);
    await view(B.p, false);
    await view(A.p, true);
    ck('3. back in view, A takes B\'s spend at once (well inside one timed check)', await until(async () => (await stored(A.p)).events.some(e => e.note === 'tea two'), TICK / 2), 'not within ' + TICK / 2 + ' ms');
    await view(B.p, true);

    /* ---- 4. two tabs: Stop here in one tab is not undone by the other ---- */
    const A2 = await A.b.newPage();
    await A2.evaluateOnNewDocument(FAST, SPEED);
    await A2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await A2.goto(URL); await T.w(600);
    await A.p.bringToFront();
    await A.p.click('#a3SetGo'); await until(async () => !!(await A.p.$('#a3CloudOff'))); await A.p.click('#a3CloudOff'); await T.w(100); await A.p.click('#a3CloudStop'); await T.w(400);
    ck('(tab one stopped the cloud copy here)', (await device(A.p)).on === false);
    await A.p.click('#a3SetClose');
    const puts4 = calls(0, isPut).length;
    await A2.bringToFront(); await A2.tap('[data-tab="receipts"]'); await T.w(250); await log(A2, '300', 'gum three');
    await T.w(7000);
    ck('4. the other tab does not turn it on again', (await device(A.p)).on === false, JSON.stringify(await device(A.p)).slice(0, 80));
    ck('4. and sends nothing after the stop', calls(0, isPut).length === puts4, calls(0, isPut).length - puts4);
    await A2.close(); await A.p.bringToFront();
    /* A joins again with the code, for the parts below */
    await A.p.click('#a3SetGo'); await until(async () => !!(await A.p.$('#a3CloudHave'))); await A.p.click('#a3CloudHave'); await A.p.type('#a3CloudCode', code); await A.p.click('#a3CloudUse');
    await until(async () => !!(await A.p.$('#a3CloudJoinYes')), 3000); if (await A.p.$('#a3CloudJoinYes')) await A.p.click('#a3CloudJoinYes');
    ck('(A joined again)', await until(async () => { const d = await device(A.p); return !!d && d.on === true && d.baseRev === rev(); }), JSON.stringify(await device(A.p)).slice(0, 80));
    await T.w(500); if (await A.p.$('#a3SetClose')) await A.p.click('#a3SetClose');
    await sendNow(A); await T.w(TICK);

    /* ---- 5. a newer version's copy, then a code the cloud does not accept: the timer stops, Home says so once ---- */
    const newer = Buffer.from(JSON.stringify({ fmt: 'gz1', v: 4, enc: 'aes-gcm', iv: 'AAAAAAAAAAAAAAAA', data: 'AAAA' })).toString('base64');
    await view(B.p, false);
    vault.handle = (m, id, tok, body, q) => { vault.log.push({ method: m, query: q ? q.toString() : '', fake: 'newer' }); return m === 'GET' ? { status: 200, j: q && q.get('versions') === '1' ? { rev: rev() + 5, versions: [] } : { blob: newer, iv: 'AAAAAAAAAAAAAAAA', rev: rev() + 5 } } : { status: 422, j: { error: { code: 'newer_shape' } } }; };
    ck('5. a copy saved by a newer version: Home says the cloud copy has stopped until the app is updated', await until(async () => /stopped on this device until the app is updated/.test(await band(A.p)), 2 * TICK + 1500), await band(A.p));
    from = vault.log.length; await T.w(3 * TICK);
    ck('5. and the timer has stopped (no more calls)', vault.log.length === from, vault.log.length - from);
    await A.p.evaluate(() => { const b = [...document.querySelectorAll('#a3Msg button')].find(x => /Close/.test(x.textContent)); if (b) b.click(); }); await T.w(200);
    ck('5. it is said once: closed, it does not come back', !/stopped/.test(await band(A.p)));
    vault.handle = real;
    await sendNow(A);
    from = vault.log.length; await T.w(2 * TICK + 500);
    ck('5. after the person sends, the timer runs again', calls(from, isRev).length >= 1, calls(from, isRev).length);
    vault.handle = (m, id, tok, body, q) => { vault.log.push({ method: m, query: q ? q.toString() : '', fake: 'forbidden' }); return { status: 403, j: { error: { code: 'forbidden' } } }; };
    ck('5. a code the cloud does not accept: Home says so', await until(async () => /does not accept this code/.test(await band(A.p)), 2 * TICK + 1500), await band(A.p));
    from = vault.log.length; await T.w(3 * TICK);
    ck('5. and the timer has stopped (no more calls)', vault.log.length === from, vault.log.length - from);
    vault.handle = real;
    await A.p.evaluate(() => { const b = [...document.querySelectorAll('#a3Msg button')].find(x => /Close/.test(x.textContent)); if (b) b.click(); });
    await sendNow(A); await view(B.p, true);

    /* ---- 6. B1: a device with its own numbers joins while it cannot save ---- */
    C = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3tC-')) });
    await C.p.evaluateOnNewDocument(FAST, SPEED); await C.p.evaluateOnNewDocument(NO_SAVE);
    const own = T.book(); own.schedules[1].name = 'Typed on this one'; own.schedules[1].at = '2026-12-09T09:00:00.000+09:00'; own.schedules[1].by = 'tab003';
    await C.p.goto(URL); await T.w(300); await seed(C.p, own); await C.p.reload(); await T.w(400);
    await view(A.p, false); await view(B.p, false);
    await C.p.click('#a3SetGo'); await T.w(200); await C.p.click('#a3CloudHave'); await C.p.type('#a3CloudCode', code);
    await C.p.evaluate(() => { window.__noSave = true; });
    const puts6 = calls(0, isPut).length;
    await C.p.click('#a3CloudUse'); await until(async () => !!(await C.p.$('#a3CloudJoinYes')), 3000); await C.p.click('#a3CloudJoinYes');
    await T.w(1500); if (await C.p.$('#a3SetClose')) await C.p.click('#a3SetClose');
    await T.w(3 * TICK);   // three minutes on the page's clocks
    ck('6. B1: at most one write in three minutes while the book cannot be saved', calls(0, isPut).length - puts6 <= 1, calls(0, isPut).length - puts6);
    ck('6. B1: Home says the cloud copy has stopped here', /could not be saved on this device/.test(await band(C.p)), await band(C.p));
    ck('6. B1: the device keeps its own numbers and no base', (await stored(C.p)).schedules[1].name === 'Typed on this one' && (await device(C.p)).baseRev == null, JSON.stringify(await device(C.p)).slice(0, 80));
    await C.b.close(); C = null;
    await view(A.p, true); await view(B.p, true); await T.w(TICK);

    /* ---- 7. B3: logged with no signal, the page killed, opened with signal: sent with no tap ---- */
    vault.handle = (m, id, tok, body, q) => { vault.log.push({ method: m, down: true }); return { status: 503, j: { error: { code: 'down' } } }; };
    await receipts(A); await log(A.p, '950', 'bread four'); await T.w(400);
    const rev7 = rev();
    await A.p.close();
    vault.handle = real;
    A.p = await A.b.newPage();
    await A.p.evaluateOnNewDocument(FAST, SPEED);
    await A.p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await A.p.goto(URL);
    ck('7. B3: opened again with signal, the spend is sent with no tap', await until(() => rev() > rev7, 4000));
    await receipts(B);
    ck('7. B3: and the other device shows it', await until(async () => /bread four/.test(await rowsText(B.p)), 3 * TICK + 1500), await rowsText(B.p));

    /* ---- 8. deleted on another device: found by the timed check ---- */
    await B.p.click('#a3SetGo'); await until(async () => !!(await B.p.$('#a3CloudOff'))); await B.p.click('#a3CloudOff'); await T.w(100); await B.p.click('#a3CloudDel'); await T.w(200); await B.p.click('#a3CloudDelYes');
    ck('(B deleted the cloud copy)', await until(() => vault.rows.size === 0));
    ck('8. A finds it at a timed check and turns off, keeping its money', await until(async () => { const d = await device(A.p); return !!d && d.on === false && !!d.gone; }, 3 * TICK + 1500) && (await stored(A.p)).events.some(e => e.note === 'bread four'));
    ck('8. A says it was deleted on another device', await until(async () => /deleted on another device/.test(await band(A.p)), 2000), await band(A.p));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource|no space left/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); if (C) await C.b.close(); await s.close(); }
  T.done('e3_cloudtake');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
