#!/usr/bin/env node
/* [AMOUNT_HISTORY_PLAN] the write door keeps an event's amount history: a changed amount and a removal each add
   { a, told } to `was` with the step's `told`; an Undo takes the entry back and adds none; after a reload too (the saved
   journal). And the figures: a removal the same afternoon as the bank check agrees with a correction to 0 (qc-foundation
   confirm on the plan). Made-up yen, Mako's shape as engine/test/amount_history.test.js. */
'use strict';
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const BB = require(E + 'build_book.js'), LA = require(E + 'lookahead.js'), CI = require(E + 'checkin.js'), P = require(E + 'periods.js'), IDS = require(E + 'ids.js');
const A3 = require('../src/act3.js');
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const clone = x => JSON.parse(JSON.stringify(x));
const TZ = '+09:00';
function world() {
  const newId = IDS.idMaker('a3m7tq');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [], bills: [], free: 60000 }, { newId });
  const w = { book: out.book || out, day: '2026-11-24', told: null };
  w.bank = w.book.accounts.find(a => a.type !== 'card').id;
  w.door = () => A3.make({ book: () => w.book, put: async x => { w.book = x; return true; }, told: () => w.told || w.day + 'T12:00:00.000' + TZ, newId, today: () => w.day, queue: { post: () => {} }, check: x => LA.lookahead(x, w.day) });
  w.A = w.door();
  w.at = (day, hhmm) => { w.day = day; w.told = day + 'T' + hhmm + ':00.000' + TZ; };
  w.check = (day, fig) => {
    const r = LA.lookahead(w.book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    w.book = CI.apply(w.book, CI.checkIn(w.book, { day, told: day + 'T12:00:00.000' + TZ, newId, figures: { [w.bank]: fig }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  return w;
}
const lunch = w => w.book.events.find(e => e.note === 'lunch');
async function base() {
  const w = world();
  w.at('2026-12-05', '18:00'); ok((await w.A.logSpend({ date: '2026-12-05', a: 5000, acct: w.bank, line: 'free', note: 'shop' })).ok);
  w.check('2026-12-06', 295000);
  w.at('2026-12-08', '13:00'); ok((await w.A.logSpend({ date: '2026-12-08', a: 700, acct: w.bank, line: 'free', note: 'lunch' })).ok);
  w.check('2026-12-13', 594300);
  return w;
}
const fig = w => { const p = P.periods(w.book, w.day); return [p.past[p.past.length - 1].free.spent, p.current.free.spent, LA.lookahead(w.book, w.day).safeToSpend.headline]; };
(async () => {
  await t('a changed amount keeps the old one with the step\'s told; Undo takes it back and adds none', async () => {
    const w = await base(); w.at('2026-12-14', '09:00');
    const r = await w.A.edit(lunch(w).id, { a: 7000 }); ok(r.ok, JSON.stringify(r));
    eq(lunch(w).was, [{ a: 700, told: '2026-12-14T09:00:00.000' + TZ }]);
    eq(fig(w), [5700, 0, 60000]);
    const u = await w.A.undo(r.step.id); ok(u.ok, JSON.stringify(u));
    eq([lunch(w).a, lunch(w).was], [700, undefined]);
  });
  await t('a change of the note only keeps no history', async () => {
    const w = await base(); w.at('2026-12-14', '09:00');
    const id = lunch(w).id, r = await w.A.edit(id, { note: 'lunch at work' }); ok(r.ok, JSON.stringify(r));
    eq(w.book.events.find(e => e.id === id).was, undefined);
  });
  await t('a removal keeps the amount it had with the step\'s told; Undo after a reload takes it back', async () => {
    const w = await base(); w.at('2026-12-14', '09:00');
    const r = await w.A.remove(lunch(w).id); ok(r.ok, JSON.stringify(r));
    eq([lunch(w).gone, lunch(w).was], ['2026-12-14', [{ a: 700, told: '2026-12-14T09:00:00.000' + TZ }]]);
    eq(fig(w), [5700, 0, 60000]);
    w.book = clone(w.book); const fresh = w.door();
    const u = await fresh.undo(r.step.id); ok(u.ok, JSON.stringify(u));
    eq([lunch(w).gone, lunch(w).was], [undefined, undefined]);
  });
  await t('removed the same afternoon as the 13 Dec check (after it) equals corrected to 0 the same afternoon', async () => {
    const a = await base(); a.at('2026-12-13', '15:00'); ok((await a.A.remove(lunch(a).id)).ok);
    const b = await base(); b.at('2026-12-13', '15:00');
    const e = lunch(b); e.was = [{ a: 700, told: b.told }]; e.a = 0;   // a correction to 0 as the engine reads it
    a.day = b.day = '2026-12-14';
    eq(fig(a), fig(b)); eq(fig(a), [5700, 0, 60000]);
  });
  await t('[coordinator 16 ruling (a)] removing a whole check-in writes no was on its records (the step says so: removed with its check-in)', async () => {
    const w = await base();
    w.check('2026-12-13', 594300);
    const recs = w.book.events.filter(e => !e.gone && String(e.told || '').startsWith('2026-12-13') && e.note !== 'lunch');
    ok(recs.length > 0, 'the check-in has records');
    w.at('2026-12-14', '09:00');
    const r = await w.A.run('Remove the check', wr => { for (const e of recs) wr.remove('events', e.id, { withCheckIn: true }); }, {});
    ok(r.ok, JSON.stringify(r));
    eq(w.book.events.filter(e => recs.some(x => x.id === e.id)).map(e => [!!e.gone, e.was === undefined]), recs.map(() => [true, true]));
  });
  /* [coordinator ruled finding 2, qc-numbers amounthist] the one amount history rule covers money in too. The reviewer's
     three accounts life, made-up yen: set up 2 Dec, Main bank 200,000, Savings 500,000, Wallet (cash) 15,000, pay on the
     25th, Free to spend 40,000. A 2,000 cash spend, 20,000 moved Main to Wallet, a 3,000 gift into Main bank, 50,000
     moved Savings to Main. 15 Dec check: 233,000 / 450,000 / 31,000. 20 Dec the gift is removed (or corrected).
     Hand-worked: the period is 25 Nov to 24 Dec; Free to spend from the setup day is 40,000 x 23 / 30 = 30,666.
     Expected at the check: Main 200,000 - 20,000 + 3,000 + 50,000 = 233,000 (no gap), Savings 450,000 (no gap),
     Wallet 15,000 + 20,000 - 2,000 = 33,000, typed 31,000: 2,000 more went out. Spent 2,000 + 2,000 = 4,000, safe to
     spend 30,666 - 4,000 = 26,666. Removing the gift on 20 Dec: the 15 Dec check held it, so it keeps its 3,000 there
     and the change (-3,000) counts on the check's day, beside the Main bank gap it now opens (3,000 less went out than
     logged): spent 2,000 + 2,000 - 3,000 + 3,000 = 4,000, safe to spend stays 26,666 (today it reads 29,666). Corrected
     to 1,000 instead: the same, 26,666. Undo: 26,666. */
  async function three() {
    const newId = IDS.idMaker('a3g2ft');
    const out = BB.buildBook({ day: '2026-12-02', told: '2026-12-02T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
      banks: [{ key: 'bank1', name: 'Main bank', amount: 200000, main: true, min: null }, { key: 'bank2', name: 'Savings', amount: 500000 }, { key: 'bank3', name: 'Wallet', amount: 15000, type: 'cash' }],
      pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 250000, every: 'month', day: 25, shift: 'none', startsPeriod: true }],
      cards: [], bills: [], free: 40000 }, { newId });
    const w = { book: out.book || out, day: '2026-12-02', told: null };
    const [main, sav, wal] = ['Main bank', 'Savings', 'Wallet'].map(n => w.book.accounts.find(a => a.name === n).id);
    w.A = A3.make({ book: () => w.book, put: async x => { w.book = x; return true; }, told: () => w.told, newId, today: () => w.day, queue: { post: () => {} }, check: x => LA.lookahead(x, w.day) });
    w.at = (day, hhmm) => { w.day = day; w.told = day + 'T' + hhmm + ':00.000' + TZ; };
    w.at('2026-12-02', '13:00');
    ok((await w.A.logSpend({ date: '2026-12-02', a: 2000, acct: wal, line: 'free', note: 'cash' })).ok);
    ok((await w.A.moveMoney({ date: '2026-12-02', a: 20000, from: main, to: wal })).ok);
    ok((await w.A.moneyIn({ date: '2026-12-02', a: 3000, acct: main, note: 'gift' })).ok);
    ok((await w.A.moveMoney({ date: '2026-12-02', a: 50000, from: sav, to: main })).ok);
    w.at('2026-12-15', '12:00');
    const r = LA.lookahead(w.book, '2026-12-15'), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    w.book = CI.apply(w.book, CI.checkIn(w.book, { day: '2026-12-15', told: w.told, newId, figures: { [main]: 233000, [sav]: 450000, [wal]: 31000 }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
    w.gift = () => w.book.events.find(e => e.note === 'gift');
    w.safe = () => LA.lookahead(w.book, w.day).safeToSpend.headline;
    return w;
  }
  await t('[finding 2] money in held by a check, removed later: safe to spend stays 26,666; Undo 26,666', async () => {
    const w = await three();
    eq(w.safe(), 26666, '15 Dec after the check');
    w.at('2026-12-20', '09:00');
    const r = await w.A.remove(w.gift().id); ok(r.ok, JSON.stringify(r));
    eq(w.gift().was, [{ a: 3000, told: '2026-12-20T09:00:00.000' + TZ }], 'the door keeps the gift\'s amount');
    eq(w.safe(), 26666, '20 Dec after the removal');
    ok((await w.A.undo(r.step.id)).ok);
    eq([w.gift().gone, w.gift().was, w.safe()], [undefined, undefined, 26666], 'after Undo');
  });
  await t('[finding 2] money in held by a check, corrected later (3,000 to 1,000): safe to spend stays 26,666', async () => {
    const w = await three();
    w.at('2026-12-20', '09:00');
    ok((await w.A.edit(w.gift().id, { a: 1000 })).ok);
    eq(w.safe(), 26666, '20 Dec after the correction');
  });
  /* [coordinator ruled (B), qc-foundation confirm2 on CHECKFIX] decided by the step, not the record's shape: every removal
     of a money record that is not the removal of a whole check-in keeps `was`, and the engine holds it at a check
     written before. Made-up yen, Mako's shape (world): pay 300,000 on the 10th, Free to spend 60,000, set up 24 Nov,
     Main bank 300,000; Savings 100,000 added here; Rent 72,000 on the 27th.
     Hand-worked: the period is 10 Nov to 9 Dec; Free to spend from the setup day is 60,000 x 16 / 30 = 32,000.
     (1) A logged bill payment: Rent 72,000 paid 27 Nov (settles the 27 Nov rent), 28 Nov check 228,000: no gap, safe
         to spend 32,000. Removed 1 Dec: the check held it, so the rent stays paid and the 72,000 stays in the check's
         figure; the change (-72,000) counts on the check's day beside the 72,000 gap it opens: safe to spend 32,000
         (today 0: the gap is spending and the rent is due again).
     (2) A move of 20,000 Main bank to Savings on 27 Nov, the 28 Nov check of Main bank only, 280,000: no gap, 32,000.
         Removed 1 Dec: the change (+20,000 back in Main bank) counts on the check's day beside the 20,000 gap: 32,000
         (today 12,000). */
  async function own(kind) {
    const newId = IDS.idMaker('a3b7own');
    const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
      banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }, { key: 'bank2', name: 'Savings', amount: 100000 }],
      pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
      cards: [], bills: [{ key: 'b1', name: 'Rent', from: 'bank1', amount: 72000, day: 27, shift: 'none' }], free: 60000 }, { newId });
    const w = { book: out.book || out, day: '2026-11-27', told: '2026-11-27T18:00:00.000' + TZ };
    const [main, sav] = ['Main bank', 'Savings'].map(n => w.book.accounts.find(a => a.name === n).id);
    const rent = w.book.schedules.find(x => x.name === 'Rent');
    w.A = A3.make({ book: () => w.book, put: async x => { w.book = x; return true; }, told: () => w.told, newId, today: () => w.day, queue: { post: () => {} }, check: x => LA.lookahead(x, w.day) });
    if (kind === 'bill') ok((await w.A.run('Rent paid', wr => { wr.add('events', { k: 'spend', acct: main, a: 72000, date: '2026-11-27', settles: [{ s: rent.id, due: '2026-11-27' }], note: 'rent', src: { type: 'typed' } }); }, {})).ok);
    else ok((await w.A.moveMoney({ date: '2026-11-27', a: 20000, from: main, to: sav, note: 'rent' })).ok);
    const r = LA.lookahead(w.book, '2026-11-28'), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    w.book = CI.apply(w.book, CI.checkIn(w.book, { day: '2026-11-28', told: '2026-11-28T12:00:00.000' + TZ, newId, figures: { [main]: kind === 'bill' ? 228000 : 280000 }, ticked: [], unticked: [], amounts: {}, expected, lands, landed: {} }));
    w.rec = () => w.book.events.find(e => e.note === 'rent');
    w.safe = () => LA.lookahead(w.book, w.day).safeToSpend.headline;
    w.day = '2026-11-29'; eq(w.safe(), 32000, kind + ': after the check');
    w.day = '2026-12-01'; w.told = '2026-12-01T09:00:00.000' + TZ;
    const rm = await w.A.remove(w.rec().id); ok(rm.ok, JSON.stringify(rm));
    eq(w.rec().was, [Object.assign({ a: w.rec().a }, kind === 'bill' ? {} : { a2: w.rec().a2 != null ? w.rec().a2 : undefined }, { told: w.told })].map(x => JSON.parse(JSON.stringify(x))), kind + ': the door keeps its amount');
    eq(w.safe(), 32000, kind + ': removed after the check that held it');
    ok((await w.A.undo(rm.step.id)).ok);
    eq([w.rec().gone, w.rec().was, w.safe()], [undefined, undefined, 32000], kind + ': after Undo');
  }
  await t('[ruling (B)] a logged bill payment removed after the check that held it: the rent stays paid, safe to spend stays 32,000', () => own('bill'));
  await t('[ruling (B)] a move between own accounts removed after the check that held it: safe to spend stays 32,000', () => own('move'));
  await t('[ruling (A)] a bank check figure changed keeps the old one in was; Undo takes it back', async () => {
    const w = await base(); w.at('2026-12-14', '09:00');
    const c = w.book.events.find(e => e.k === 'check' && e.date === '2026-12-13' && !e.gone);
    const r = await w.A.edit(c.id, { a: 590000 }); ok(r.ok, JSON.stringify(r));
    eq(w.book.events.find(e => e.id === c.id).was, [{ a: 594300, told: '2026-12-14T09:00:00.000' + TZ }]);
    ok((await w.A.undo(r.step.id)).ok);
    eq([w.book.events.find(e => e.id === c.id).a, w.book.events.find(e => e.id === c.id).was], [594300, undefined]);
  });
  console.log(bad ? `act3_amount: ${bad} of ${n} FAILED` : `act3_amount: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
