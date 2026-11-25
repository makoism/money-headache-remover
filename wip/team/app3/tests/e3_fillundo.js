#!/usr/bin/env node
/* The setup chat's fill and its Undo, on the page and the store (AI_FIRST_PLAN corrections 2 and 9; BV2.9), with two
   tabs on one device and the cloud copy on (a local fake vault serves the page; the real server is never called).
   Mako's made-up shape on Tue 24 Nov 2026, built in the page by build_book.
   1. E3.fill keeps a book only when this device keeps none; the fill is marked as one that can still be undone.
   3. With the cloud copy off: tab B (same device) has the book. A's Undo (E3.discard): the book and its records go, the device record (the
      cloud copy's state) and the kept copies stay; B's next write is refused and B shows the first screen; nothing
      was ever sent.
   4. E3.discard refuses when the book was not a fill (a book set up on the screens), and when anything else was written.
   2. Fill again, then the cloud copy is turned on while the fill can be undone: the first copy is sent and the fill
      can no longer be undone (AI_JOIN_FIXES B, 25 Nov: before it, nothing was sent and nothing said so, and a second
      device with the code found an empty cloud. This replaces BV2.9's "held back until Start over").
   5. Then a spend through act3: the cloud copy sends it.
   Every amount is made up. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-11-24';
const ANS = {
  day: DAY, currency: 'JPY', country: 'JP',
  banks: [{ key: 'bank1', name: 'Main bank', amount: 286000, main: true, min: null }],
  pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 240000, every: 'month', day: 10, shift: 'before', startsPeriod: true }],
  cards: [{ key: 'card1', name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'after' },
    { key: 'card2', name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', payFrom: 'bank1', shift: 'before' }],
  bills: [{ key: 'bill1', name: 'Rent', from: 'bank1', amount: 72000, day: 27, shift: 'after' }, { key: 'bill2', name: 'Power', from: 'bank1', amount: 7400, day: 26, shift: 'after' },
    { key: 'bill3', name: 'Phone', from: 'bank1', amount: 4800, day: 20, shift: 'after' }, { key: 'bill4', name: 'Internet', from: 'bank1', amount: 5200, day: 27, shift: 'after' }],
  free: null,
};
const fill = p => p.evaluate(async a => { const { E3 } = BurrowApp3; const b = BurrowEngine.build.buildBook(Object.assign({}, a, { told: E3.told() }), { newId: E3.newId }).book; return E3.fill(b); }, ANS);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return { empty: r.empty, device: r.device, copies: (await s.keptCopies()).length }; } finally { s.close(); } });
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
(async () => {
  const vault = makeVault();
  const s = await serve(vault, () => fs.readFileSync(path.join(__dirname, '../index.html')));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'a3fill-'));
  const A = await T.open({ profile: prof });
  try {
    await A.p.goto(URL); await T.w(500);
    /* 1 */
    ck('the fill keeps a book on a device with none', await fill(A.p) === true);
    ck('it is marked as a fill that can still be undone', await A.p.evaluate(() => BurrowApp3.E3.held() && BurrowApp3.E3.mode === 'kept'));
    ck('a second fill over a kept book is refused', await fill(A.p) === false);
    await A.p.reload(); await T.w(200);
    // old 201,400; now 124,400 because free is null (no play amount), so everything on the cards comes off now (M90, R1):
    // 286,000 - 84,600 due before the pay of Thu 10 Dec (Power 7,400 Thu 26 Nov, Rent 72,000 and Internet 5,200 Fri 27 Nov;
    // Phone on 20 Nov is already out) - 54,000 Card A - 23,000 Card B = 124,400. After the pay the bank only rises above it
    ck('Home shows the filled book', (await A.p.$eval('[data-fig=safe] [data-amt]', e => Number(e.dataset.amt))) === 124400);
    /* 3 (the cloud copy is off) */
    await A.p.evaluate(async () => { const { E3 } = BurrowApp3; await E3.rec('copy', { copy: E3.book, why: 'made-up kept copy' }); await E3.rec('madeUpDeviceThing', { on: true }); });
    const Bp = await A.b.newPage(); const bErr = [];
    Bp.on('pageerror', e => bErr.push(e.message));
    await Bp.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await Bp.goto(URL); await T.w(600);
    ck('tab B has the book', await Bp.evaluate(() => BurrowApp3.E3.mode === 'kept' && !!BurrowApp3.E3.book));
    ck('the fill\'s Undo takes the book back', await A.p.evaluate(() => BurrowApp3.E3.discard()) === true);
    ck('after it this page keeps no book and is not held', await A.p.evaluate(() => BurrowApp3.E3.mode === 'none' && !BurrowApp3.E3.book && !BurrowApp3.E3.held()));
    const st = await stored(A.p);
    ck('the store has no book; the device record and the kept copy stay', st.empty && st.device && st.device.madeUpDeviceThing && st.device.madeUpDeviceThing.on === true && !st.device.fillHold && st.copies === 1, JSON.stringify(st).slice(0, 300));
    await T.w(400);
    const bw = await Bp.evaluate(async () => { const { E3, ACT3 } = BurrowApp3; const r = E3.book ? await ACT3.logSpend({ date: E3.today(), a: 500, acct: E3.book.accounts[0].id, line: 'free' }) : { ok: false, why: 'gone' }; return [r.ok, E3.mode]; });
    ck('tab B cannot write the book back: it learns the book is gone', bw[0] === false && bw[1] === 'none', JSON.stringify(bw));
    ck('tab B shows the first screen', /Welcome to the burrow/.test(await Bp.$eval('#a3Home', e => e.textContent)));
    ck('the store is still empty after B tried', (await stored(A.p)).empty);
    await Bp.close();
    /* 4 */
    ck('discard with no book is refused', await A.p.evaluate(() => BurrowApp3.E3.discard()) === false);
    ck('fill again', await fill(A.p) === true);
    /* 2 [AI_JOIN_FIXES B] the cloud copy turned on while the fill could be undone: the first copy is sent, the Undo is over */
    await A.p.reload(); await T.w(300);
    ck('held again after the second fill and a reload', await A.p.evaluate(() => BurrowApp3.E3.held()));
    await A.p.click('#a3SetGo'); await T.w(200);
    await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    await A.p.click('#a3CloudSaved');
    ck('the cloud copy is on and the first copy is sent', await until(() => vault.rows.size === 1, 6000), JSON.stringify(vault.log.map(x => x.method)));
    ck('the fill can no longer be undone', await A.p.evaluate(() => !BurrowApp3.E3.held()) && await A.p.evaluate(() => BurrowApp3.E3.discard()) === false);
    await A.p.click('#a3SetClose'); await T.w(100);
    const rev1 = vault.rows.values().next().value.rev;
    /* 5 */
    const sp = await A.p.evaluate(async () => { const { E3, ACT3 } = BurrowApp3; return (await ACT3.logSpend({ date: E3.today(), a: 1200, acct: E3.book.accounts.find(x => x.type === 'bank').id, line: 'free', note: 'lunch' })).ok; });
    ck('a spend after the fill is kept', sp);
    ck('then the fill can no longer be undone', await until(() => A.p.evaluate(() => !BurrowApp3.E3.held()), 3000));
    ck('discard is refused once something else was written', await A.p.evaluate(() => BurrowApp3.E3.discard()) === false);
    await A.p.evaluate(() => dispatchEvent(new Event('pagehide')));   // a second send within 90 seconds waits; leaving the page sends at once
    ck('and the cloud copy sends the spend when the page is left', await until(() => vault.rows.values().next().value.rev > rev1, 10000));
    await A.p.reload(); await T.w(600);
    ck('after a reload it is still not held', await A.p.evaluate(() => BurrowApp3.E3.mode === 'kept' && !BurrowApp3.E3.held()));
    const errs = A.errs.concat(bErr).filter(e => !/Failed to load resource/.test(e));   // the vault's 404 when nothing is stored yet
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await A.b.close(); s.close(); }
  T.done('e3_fillundo');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
