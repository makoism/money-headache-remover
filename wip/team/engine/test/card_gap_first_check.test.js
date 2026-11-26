'use strict';
// Two faults found in the first card gap fix by the grown tests (24 Nov), fixed the same day and now green and in
// run_all.js. Each row is a real life from CARDGAP_PLAN "The grown test must also cover". The inputs are natural and
// were not changed to make a row pass (LESSONS 3, addendum).
// Made-up yen, Mako's shape (see card_gap_lives.test.js): set up Tue 24 Nov 2026, bank 300,000, pay 300,000 on the
// 10th, Card A owing 20,000 paid on the 10th, Card B owing 10,000 paid on the 11th, Free to spend 60,000.
//
// FAULT 1. The first check of a card after its opening has a stretch of one day, the day of the check.
//   CARDGAP_PLAN fix 1: "The stretch runs from the day after that card's check before this one (its opening check at
//   the earliest)"; "Set up mid-period: the first stretch starts the day after the opening check". A bank's first gap
//   does start the day after its opening (lookahead.js bankInfo, base = openingOf). The card loop (lookahead.js about
//   line 609) looks for the check before among records that leave out the opening's own check, so it finds none.
//   Seen by a person: set up before pay day, first card check after it, and ALL the card spending since setup lands
//   in the new period. The old period reads 0 spent and the new one starts deep in the red.
// [CHECKGAP, coordinator 15, 26 Nov 2026] A check's gap is now the check's period's, WHOLE: the stretch below is kept
// for the words (`from`, `to`: the days it covers) and the count is one part on the check's day. So "ALL the card
// spending since setup lands in the new period" in FAULT 1 is now the ruled behaviour; the stretches still start
// where these faults said, and the figures below are reworked by hand to the ruling.
// FAULT 2. A second check of one card on the same day is spread back over the whole stretch of the first.
//   CARDGAP_PLAN fix 1: "A check on the same day as the one before has a stretch of that one day." The loop takes
//   the check before as the latest one on an EARLIER day, so the second check of a day reaches back as far as the first.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), P = require('../periods.js'), IDS = require('../ids.js');
const A3 = require('../../app3/src/act3.js'), PW = require('../../app3/src/plan3_write.js'), SP = require('../../app3/src/stmt3_plan.js');

const noon = (day, zone) => day + 'T12:00:00.000' + (zone || '+09:00');
function world(ans, seed) {
  const newId = IDS.idMaker(seed);
  const out = BB.buildBook(ans, { newId });
  const zone = ans.told.slice(-6);
  const w = { book: out.book || out };
  let DAY = ans.day;
  const A = A3.make({ book: () => w.book, put: async x => { w.book = x; return true; }, told: () => noon(DAY, zone), newId, today: () => DAY,
    queue: { post: () => {} }, check: x => LA.lookahead(x, DAY) });
  // Check your bank: the figures typed, every item ticked unless `tick` says no, `amounts` for an amount typed on an item
  w.check = (day, figures, o) => {
    o = o || {};
    const told = o.told || noon(day, zone);
    const r = LA.lookahead(w.book, told.slice(0, 10)), list = r.checkIn.toConfirm.filter(x => (o.tick ? o.tick(x) : true));
    const expected = {}, lands = {}; for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    w.book = CI.apply(w.book, CI.checkIn(w.book, { day, told, newId, figures, ticked: list.map(x => x.item), unticked: [], amounts: o.amounts ? o.amounts(list) : {}, expected, lands, landed: {} }));
  };
  w.step = async (day, name, ...args) => { DAY = day; const r = await A.run(name, x => PW[name](x, ...args)); if (!r.ok) throw new Error(name + ': ' + JSON.stringify(r)); };
  w.spend = async (day, x) => { DAY = day; const r = await A.logSpend(Object.assign({ date: day }, x)); if (!r.ok) throw new Error('spend: ' + JSON.stringify(r)); };
  // a card statement read on `day`: the two checks the import writes, both dated its close day (stmt3_plan.js records)
  w.importStatement = (day, card, close, a) => {
    const plan = { today: day, lines: [], reads: [], statements: [{ acct: card, close, a, file: 'card-' + close.slice(0, 7) + '.csv', id: 'imp:' + card + ':ref:stmt-' + close }] };
    w.book = CI.apply(w.book, SP.records(w.book, plan, { told: noon(day, zone), newId }));
  };
  const cards = () => w.book.accounts.filter(a => a.type === 'card').map(a => a.id);
  Object.defineProperties(w, { A: { get: () => cards()[0] }, B: { get: () => cards()[1] }, C: { get: () => cards()[2] },
    bank: { get: () => w.book.accounts.find(a => a.type !== 'card').id }, pay: { get: () => w.book.schedules.find(s => s.kind === 'income').id } });
  return w;
}
const mako = seed => world({ day: '2026-11-24', told: noon('2026-11-24'), currency: 'JPY', country: 'JP',
  banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
  pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
  cards: [{ key: 'card1', name: 'Card A', owed: 20000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true },
    { key: 'card2', name: 'Card B', owed: 10000, payDay: 11, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
  bills: [], free: 60000 }, seed);


const gapOn = (book, day, card, on) => LA.lookahead(book, day).cards[card].fillers.filter(f => f.day === on).map(f => [f.day, f.amount, [f.from, f.to], f.parts.map(p => [p.from, p.to, p.days, p.amount])]);
const spent = (book, day) => { const p = P.periods(book, day); return [[p.current.start, p.current.free.spent]].concat(p.past.map(x => [x.start, x.free.spent])); };

(async () => {
  // ---- FAULT 1a. The first card check after setup is across pay day ----
  //   24 Nov set up. No check until 13 Dec: pay, A's 20,000 and B's 10,000 ticked, bank 570,000 (300,000 + 300,000
  //   - 20,000 - 10,000), Card A at 19,000, Card B at 0.
  //   19,000 not logged over 25 Nov to 13 Dec, 19 days, 1,000 a day: 25 Nov to 9 Dec is 15 days, 15,000, in the old
  //   period; 10 to 13 Dec is 4 days, 4,000, in the new one.
  //   The engine today: one part, 13 Dec only, 19,000. Old period 0, new period 19,000 (41,000 left where 56,000 is right).
  const first = mako('f2k7pd');
  first.check('2026-12-13', { [first.bank]: 570000, [first.A]: 19000, [first.B]: 0 });
  t('FAULT 1a: the first check after setup covers the days from the day after the opening; all 19,000 is the new period\'s [CHECKGAP]', () => {
    eq(gapOn(first.book, '2026-12-13', first.A, '2026-12-13'), [['2026-12-13', 19000, ['2026-11-25', '2026-12-13'], [['2026-12-13', '2026-12-13', 1, 19000]]]]);
    eq(spent(first.book, '2026-12-13'), [['2026-12-10', 19000], ['2026-11-10', 0]]);
  });

  // ---- FAULT 1b. A card added after setup (Plan, addCard) ----
  //   28 Nov  Card C added, 12,000 on it now, paid on the 27th, close day not sure.
  //   13 Dec  pay, A's 20,000 and B's 10,000 ticked, bank 570,000, Card C at 27,000: 15,000 not logged over 29 Nov
  //           (the day after it was opened) to 13 Dec, 15 days, 1,000 a day: 29 Nov to 9 Dec is 11 days, 11,000 old;
  //           10 to 13 Dec 4,000 new. (From the setup day instead it would be 11,842 and 3,158: also wrong.)
  //   The engine today: 13 Dec only, 15,000. Old period 0, new 15,000.
  const added = mako('a6v3hm');
  await added.step('2026-11-28', 'addCard', { name: 'Card C', owed: 12000, payDay: 27, cutDay: 'not sure', shift: 'none' });
  added.check('2026-12-13', { [added.bank]: 570000, [added.C]: 27000 });
  t('FAULT 1b: a card added on 28 Nov, first checked 13 Dec: its stretch starts 29 Nov; all 15,000 is the new period\'s [CHECKGAP]', () => {
    eq(gapOn(added.book, '2026-12-13', added.C, '2026-12-13'), [['2026-12-13', 15000, ['2026-11-29', '2026-12-13'], [['2026-12-13', '2026-12-13', 1, 15000]]]]);
    eq(spent(added.book, '2026-12-13'), [['2026-12-10', 15000], ['2026-11-10', 0]]);
  });

  // ---- FAULT 1c. The same cause where told order is not day order, before the late check arrives ----
  //   13 Dec  his desktop: pay ticked, A's payment ticked and typed as 50,000, B's as 24,000, bank 526,000, A at
  //           21,000, B at 7,000. His phone's 6 Dec check has not arrived yet, so these are the cards' first checks.
  //   Card A: 20,000 - 50,000 + what was spent = 21,000, so 51,000 not logged over 25 Nov to 13 Dec, 19 days:
  //           15 days 40,263 (40,263.16), the rest 10,737.   Card B: 10,000 - 24,000 + spent = 7,000, so 21,000:
  //           15 days 16,579 (16,578.95), the rest 4,421.
  //   Old period 40,263 + 16,579 = 56,842. New 10,737 + 4,421 = 15,158, so 44,842 of 60,000 is left.
  //   The engine today: old 0, new 72,000, and safe to spend reads 0 three days after pay day.
  const late = mako('t8q5wm');
  late.check('2026-12-13', { [late.bank]: 526000, [late.A]: 21000, [late.B]: 7000 }, { amounts: l => { const o = {}; for (const x of l) if (x.statement) o[x.item] = x.amount === 20000 ? 50000 : 24000; return o; } });
  t('FAULT 1c: first checks on 13 Dec with the payments typed: all 72,000 found on 13 Dec is the new period\'s [CHECKGAP]', () => {
    eq(spent(late.book, '2026-12-13'), [['2026-12-10', 72000], ['2026-11-10', 0]]);
    eq(LA.lookahead(late.book, '2026-12-13').safeToSpend.headline, 0);   // 60,000 - 72,000: nothing left, never below 0
  });

  // ---- FAULT 1d. A statement that closed before the card's first typed check ----
  //   28 Nov  Card A checked at 28,000;  6 Dec at 50,000;  8 Dec its statement is read: closed 26 Nov at 25,000.
  //   The check before the close is the opening (24 Nov, 20,000): 5,000 over 25 and 26 Nov, two days.
  //   The engine today: 26 Nov only. No period figure moves here (all of it is before pay day); the stretch is wrong.
  const early = mako('e9d3kt');
  early.check('2026-11-28', { [early.A]: 28000 }); early.check('2026-12-06', { [early.A]: 50000 });
  early.importStatement('2026-12-08', early.A, '2026-11-26', 25000);
  t('FAULT 1d: a statement closing 26 Nov, two days after setup: its 5,000 covers 25 and 26 Nov', () => {
    eq(gapOn(early.book, '2026-12-08', early.A, '2026-11-26'), [['2026-11-26', 5000, ['2026-11-25', '2026-11-26'], [['2026-11-26', '2026-11-26', 1, 5000]]]]);
  });

  // ---- FAULT 2. Two checks of one card on one day ----
  //    6 Dec  bank 300,000, A 50,000, B 24,000 (44,000 not logged, old period)
  //   13 Dec at noon  all ticked, bank 526,000, A 21,000 (9,000 old, 12,000 new), B 7,000 (3,000 old, 4,000 new)
  //   13 Dec at 21:10, the other device: A at 22,400. The 1,400 was spent after the noon check, on 13 Dec: one day.
  //   Old period 44,000 + 9,000 + 3,000 = 56,000. New 12,000 + 4,000 + 1,400 = 17,400.
  //   The engine today: the 1,400 is spread over 7 to 13 Dec again (600 old, 800 new): old 56,600, new 16,800. An
  //   evening spend after pay day moves 600 back into a period that ended four days before.
  const twice = mako('w3g6xr');
  twice.check('2026-12-06', { [twice.bank]: 300000, [twice.A]: 50000, [twice.B]: 24000 });
  twice.check('2026-12-13', { [twice.bank]: 526000, [twice.A]: 21000, [twice.B]: 7000 });
  twice.check('2026-12-13', { [twice.A]: 22400 }, { told: '2026-12-13T21:10:00.000+09:00' });
  t('FAULT 2: a second check the same day is that one day: 1,400 on 13 Dec; old period 44,000, new 28,000 + 1,400 [CHECKGAP]', () => {
    eq(gapOn(twice.book, '2026-12-13', twice.A, '2026-12-13')[1], ['2026-12-13', 1400, ['2026-12-13', '2026-12-13'], [['2026-12-13', '2026-12-13', 1, 1400]]]);
    eq(spent(twice.book, '2026-12-13'), [['2026-12-10', 29400], ['2026-11-10', 44000]]);
  });
  done('card_gap_first_check.test.js');
})().catch(e => { console.log('FAIL card_gap_first_check.test.js could not build a life: ' + (e && e.stack || e)); process.exitCode = 1; });
