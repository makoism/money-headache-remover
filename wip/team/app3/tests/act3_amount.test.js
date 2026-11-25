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
  console.log(bad ? `act3_amount: ${bad} of ${n} FAILED` : `act3_amount: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
