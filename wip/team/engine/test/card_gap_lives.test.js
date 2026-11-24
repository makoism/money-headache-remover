'use strict';
// Real lives for the card gap rule (CARDGAP_PLAN "The grown test must also cover"; MAKO_SAYS M11, M30, M36, M38, M44,
// M45, M48, M77). A card's unlogged spending found at a check is split by days over the stretch it covers, cut at
// every day a reader counts from. Every figure below is worked by hand in the comment above its life, then asserted.
// All amounts are made up. Every life is written by the real writers: buildBook (setup), the check-in writer
// (engine/checkin.js), the statement import's records (app3/src/stmt3_plan.js) and the Plan steps through act3
// (app3/src/plan3_write.js changeBill and addCard, act3 logSpend).
//
// The base is Mako's shape (M26 to M32): one bank at 300,000, pay 300,000 on the 10th, Card A owing 20,000 paid in
// full on the 10th, Card B owing 10,000 paid in full on the 11th, close days not sure, Free to spend 60,000, set up
// Tue 24 Nov 2026. The period running is 10 Nov to 9 Dec; the next starts with the pay on Thu 10 Dec.
//
// What is NOT asserted here on purpose: where the FIRST check of a card after its opening starts its stretch, and how
// a second check on the same day is spread. The engine and the plan disagree on both; those rows are in
// card_gap_lives_faults.test.js (red, outside run_all) until the lane decides.
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

// the gaps of one card as [check day, gap, [[first day, last day, days, amount] of each part]]
const gaps = (book, day, card) => LA.lookahead(book, day).cards[card].fillers.map(f => [f.day, f.amount, f.parts.map(p => [p.from, p.to, p.days, p.amount])]);
const gapOn = (book, day, card, on) => gaps(book, day, card).filter(g => g[0] === on);
// Free to spend spent in each period, newest first: [[first day, spent], ...]
const spent = (book, day) => { const p = P.periods(book, day); return [[p.current.start, p.current.free.spent]].concat(p.past.map(x => [x.start, x.free.spent])); };
const shuffle = seed => list => { let s = seed; const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
// nine orders the records can arrive in (as reload_order.test.js): as written, by id as the store hands them, reversed, six shuffles
const ORDERS = { written: l => l, 'by id': l => l.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)), reversed: l => l.reverse() };
for (const seed of [1, 7, 42, 99, 1234, 31337]) ORDERS['shuffled ' + seed] = shuffle(seed);
const inOrder = (book, f) => Object.assign({}, book, { events: f(book.events.slice()), checkins: f((book.checkins || []).slice()) });
const all = {};   // every life built here, for the last test

(async () => {
  // ---- 1. A change to no fixed pay in the middle of a stretch: cut at that day ----
  //   28 Nov  bank 300,000, Card A 28,000, Card B 10,000
  //    3 Dec  the pay is changed to no fixed pay from 3 Dec (Plan, changeBill), Free to spend 60,000 a month from then
  //    6 Dec  bank 300,000, Card A 44,000: 16,000 not logged over 29 Nov to 6 Dec, eight days, 2,000 a day.
  //           The plan runs by the day from 3 Dec, so readers count from 1 Dec (a month start) and from 3 Dec (the
  //           change): 29 and 30 Nov 4,000; 1 and 2 Dec 4,000; 3 to 6 Dec 8,000.
  //   Free to spend from the change is December's 60,000 by the days left, 3 to 31 Dec, 29 of 31: 56,129 (and 0.03).
  //   Only the 8,000 dated from the change comes off it: 48,129 left. The bank can spare far more, so that is the headline.
  const none = mako('k3f9aq');
  none.check('2026-11-28', { [none.bank]: 300000, [none.A]: 28000, [none.B]: 10000 });
  await none.step('2026-12-03', 'changeBill', none.pay, { every: 'none', from: '2026-12-03', lines: { free: 60000 } });
  none.check('2026-12-06', { [none.bank]: 300000, [none.A]: 44000, [none.B]: 10000 });
  all.none = [none.book, '2026-12-06'];
  t('no fixed pay from 3 Dec, mid stretch: the 16,000 is cut at 1 Dec and at the day of the change (4,000, 4,000, 8,000)', () => {
    eq(gapOn(none.book, '2026-12-06', none.A, '2026-12-06'), [['2026-12-06', 16000, [['2026-11-29', '2026-11-30', 2, 4000], ['2026-12-01', '2026-12-02', 2, 4000], ['2026-12-03', '2026-12-06', 4, 8000]]]]);
  });
  t('no fixed pay from 3 Dec: only the 8,000 from the change comes off December\'s share, 48,129 left', () => {
    const r = LA.lookahead(none.book, '2026-12-06');
    eq(r.period, null);
    ok(r.safeToSpend.cappedByFreeToSpend); eq(r.safeToSpend.headline, 48129);
  });

  // ---- 2. A statement import after two card checks, its close day between them ----
  //   28 Nov  Card A checked at 28,000;  6 Dec  Card A checked at 50,000: 22,000 not logged over 29 Nov to 6 Dec
  //    8 Dec  Card A's statement is read: closed 30 Nov at 33,000. The import writes two checks on 30 Nov.
  //           Now 33,000 - 28,000 = 5,000 belongs to 29 and 30 Nov, and the 6 Dec check starts the day after the
  //           close: 50,000 - 33,000 = 17,000 over 1 to 6 Dec. 5,000 + 17,000 is the 22,000 it was.
  //   13 Dec  pay, A's 50,000 and B's 10,000 ticked, bank 540,000 (300,000 + 300,000 - 50,000 - 10,000), Card A at
  //           21,000: 21,000 over 7 to 13 Dec, 3 of 7 days old (9,000) and 4 of 7 new (12,000).
  //   Old period: 8,000 (found 28 Nov) + 5,000 + 17,000 + 9,000 = 39,000. New: 12,000.
  const mid = mako('m4c8ye');
  mid.check('2026-11-28', { [mid.A]: 28000 });
  mid.check('2026-12-06', { [mid.A]: 50000 });
  const midBefore = gapOn(mid.book, '2026-12-06', mid.A, '2026-12-06');
  mid.importStatement('2026-12-08', mid.A, '2026-11-30', 33000);
  const midBook8 = mid.book;
  mid.check('2026-12-13', { [mid.bank]: 540000, [mid.A]: 21000 });
  all.mid = [mid.book, '2026-12-13'];
  t('before the import the 6 Dec gap is 22,000 over 29 Nov to 6 Dec', () => {
    eq(midBefore, [['2026-12-06', 22000, [['2026-11-29', '2026-12-06', 8, 22000]]]]);
  });
  t('a statement closing 30 Nov read later: 5,000 on 29 and 30 Nov, and the 6 Dec stretch starts the day after the close with 17,000', () => {
    eq(gapOn(midBook8, '2026-12-08', mid.A, '2026-11-30'), [['2026-11-30', 5000, [['2026-11-29', '2026-11-30', 2, 5000]]]]);
    eq(gapOn(midBook8, '2026-12-08', mid.A, '2026-12-06'), [['2026-12-06', 17000, [['2026-12-01', '2026-12-06', 6, 17000]]]]);
    eq(LA.lookahead(midBook8, '2026-12-08').cards[mid.A].owedNow, 50000);
  });
  t('the import, then a check across pay day: old period 39,000, new period 12,000', () => {
    eq(spent(mid.book, '2026-12-13'), [['2026-12-10', 12000], ['2026-11-10', 39000]]);
  });

  // ---- 3. An import whose close day is on or before the check before it ----
  // a) The statement closed on 28 Nov, the day Card A was checked at 28,000, and says 29,500. The check before it is
  //    that same day's, so the 1,500 is one day, the close day. The 6 Dec check then finds 50,000 - 29,500 = 20,500
  //    over 29 Nov to 6 Dec.
  // b) The statement closed on 26 Nov at 25,000, before both checks: 28 Nov then finds 28,000 - 25,000 = 3,000 over
  //    27 and 28 Nov, and 6 Dec still 22,000 over 29 Nov to 6 Dec. In all 5,000 + 3,000 + 22,000 = 30,000, as typed.
  const same = mako('s2h7vb');
  same.check('2026-11-28', { [same.A]: 28000 }); same.check('2026-12-06', { [same.A]: 50000 });
  same.importStatement('2026-12-08', same.A, '2026-11-28', 29500);
  all.same = [same.book, '2026-12-08'];
  const early = mako('e9d3kt');
  early.check('2026-11-28', { [early.A]: 28000 }); early.check('2026-12-06', { [early.A]: 50000 });
  early.importStatement('2026-12-08', early.A, '2026-11-26', 25000);
  all.early = [early.book, '2026-12-08'];
  t('a statement closing on the day of a check: its 1,500 is that one day, and 6 Dec finds 20,500 from 29 Nov', () => {
    const on28 = gapOn(same.book, '2026-12-08', same.A, '2026-11-28');
    eq(on28.map(g => g[1]).sort((x, y) => x - y), [1500, 8000]);
    eq(on28.find(g => g[1] === 1500)[2], [['2026-11-28', '2026-11-28', 1, 1500]]);
    eq(gapOn(same.book, '2026-12-08', same.A, '2026-12-06'), [['2026-12-06', 20500, [['2026-11-29', '2026-12-06', 8, 20500]]]]);
    eq(spent(same.book, '2026-12-08'), [['2026-11-10', 30000]]);
  });
  t('a statement closing before both checks: 28 Nov finds 3,000 over 27 and 28 Nov, 6 Dec 22,000, 30,000 in all', () => {
    eq(gapOn(early.book, '2026-12-08', early.A, '2026-11-26').map(g => g[1]), [5000]);
    eq(gapOn(early.book, '2026-12-08', early.A, '2026-11-28'), [['2026-11-28', 3000, [['2026-11-27', '2026-11-28', 2, 3000]]]]);
    eq(gapOn(early.book, '2026-12-08', early.A, '2026-12-06'), [['2026-12-06', 22000, [['2026-11-29', '2026-12-06', 8, 22000]]]]);
    eq(spent(early.book, '2026-12-08'), [['2026-11-10', 30000]]);
  });

  // ---- 4. A statement that closes the day before pay day ----
  //    6 Dec  bank 300,000, Card A 50,000 (30,000 not logged), Card B 24,000 (14,000 not logged)
  //   13 Dec  pay, A's 50,000 and B's 24,000 ticked, bank 526,000, A at 21,000, B at 7,000
  //   14 Dec  Card A's statement is read: closed 9 Dec at 61,000. So 61,000 - 50,000 = 11,000 was spent on 7, 8 and
  //           9 Dec, all before the pay; after the 50,000 payment the card held 11,000, and the 13 Dec check finds
  //           21,000 - 11,000 = 10,000 over 10 to 13 Dec, all after the pay. No part has zero days.
  //           Card B, no statement: 7,000 over 7 to 13 Dec by days, 3,000 old and 4,000 new.
  //   Old period: 30,000 + 14,000 + 11,000 + 3,000 = 58,000. New: 10,000 + 4,000 = 14,000. (By days alone: 56,000, 16,000.)
  const eve = mako('v6p1jn');
  eve.check('2026-12-06', { [eve.bank]: 300000, [eve.A]: 50000, [eve.B]: 24000 });
  eve.check('2026-12-13', { [eve.bank]: 526000, [eve.A]: 21000, [eve.B]: 7000 });
  eve.importStatement('2026-12-14', eve.A, '2026-12-09', 61000);
  all.eve = [eve.book, '2026-12-14'];
  t('a statement closing 9 Dec, the day before pay: 11,000 on 7 to 9 Dec and 10,000 on 10 to 13 Dec, no empty part', () => {
    eq(gapOn(eve.book, '2026-12-14', eve.A, '2026-12-09'), [['2026-12-09', 11000, [['2026-12-07', '2026-12-09', 3, 11000]]]]);
    eq(gapOn(eve.book, '2026-12-14', eve.A, '2026-12-13'), [['2026-12-13', 10000, [['2026-12-10', '2026-12-13', 4, 10000]]]]);
    eq(gapOn(eve.book, '2026-12-14', eve.B, '2026-12-13'), [['2026-12-13', 7000, [['2026-12-07', '2026-12-09', 3, 3000], ['2026-12-10', '2026-12-13', 4, 4000]]]]);
  });
  t('the statement the day before pay: old period 58,000, new period 14,000, 72,000 in all', () => {
    eq(spent(eve.book, '2026-12-14'), [['2026-12-10', 14000], ['2026-11-10', 58000]]);
  });

  // ---- 5. A card check dated earlier than one told before it (told order is not day order) ----
  //   13 Dec  the check-in on his desktop: pay ticked, A's payment ticked and typed as 50,000, B's as 24,000 (what
  //           really left), bank 526,000, A at 21,000, B at 7,000
  //   14 Dec  his phone, which was offline, hands over the check he made on 6 Dec: A 50,000, B 24,000 (dated 6 Dec,
  //           told 14 Dec at 8:30)
  //   By day: A 30,000 and B 14,000 found on 6 Dec; then A 21,000 and B 7,000 over 7 to 13 Dec: 9,000 + 3,000 old and
  //   12,000 + 4,000 new. Old period 56,000, new 16,000, the same as when the checks were told in day order.
  const late = mako('t8q5wm');
  late.check('2026-12-13', { [late.bank]: 526000, [late.A]: 21000, [late.B]: 7000 }, { amounts: l => { const o = {}; for (const x of l) if (x.statement) o[x.item] = x.amount === 20000 ? 50000 : 24000; return o; } });
  late.check('2026-12-06', { [late.A]: 50000, [late.B]: 24000 }, { told: '2026-12-14T08:30:00.000+09:00' });
  all.late = [late.book, '2026-12-14'];
  const lateWant = { A: [['2026-12-06', 30000], ['2026-12-13', 21000, [['2026-12-07', '2026-12-09', 3, 9000], ['2026-12-10', '2026-12-13', 4, 12000]]]],
    B: [['2026-12-06', 14000], ['2026-12-13', 7000, [['2026-12-07', '2026-12-09', 3, 3000], ['2026-12-10', '2026-12-13', 4, 4000]]]] };
  const lateGot = book => ({ A: gaps(book, '2026-12-14', late.A).map((g, i) => (i ? g : g.slice(0, 2))), B: gaps(book, '2026-12-14', late.B).map((g, i) => (i ? g : g.slice(0, 2))) });
  t('a 6 Dec check told after the 13 Dec one: the 13 Dec stretch is 7 to 13 Dec, old period 56,000, new 16,000', () => {
    eq(lateGot(late.book), lateWant);
    eq(spent(late.book, '2026-12-14'), [['2026-12-10', 16000], ['2026-11-10', 56000]]);
    const r = LA.lookahead(late.book, '2026-12-14');
    eq([r.cards[late.A].owedNow, r.cards[late.B].owedNow, r.accounts[late.bank].bank], [21000, 7000, 526000]);
  });
  for (const [name, f] of Object.entries(ORDERS)) t('told out of day order, records ' + name + ': the same amounts and stretches', () => {
    const b = inOrder(late.book, f);
    eq(lateGot(b), lateWant);
    eq(spent(b, '2026-12-14'), [['2026-12-10', 16000], ['2026-11-10', 56000]]);
  });

  // ---- 6. Two checks of one card on one day (two devices) ----
  //    6 Dec  bank 300,000, A 50,000, B 24,000;  13 Dec at noon  all ticked, bank 526,000, A 21,000, B 7,000
  //   13 Dec at 21:10, the other device: A at 22,400, so 1,400 more.
  //   Whatever the split of the second check (the faults file holds the plan's answer), nothing is lost: the two
  //   periods hold 44,000 + 21,000 + 7,000 + 1,400 = 73,400, the card owes 22,400, and no order of the records moves a yen.
  const twice = mako('w3g6xr');
  twice.check('2026-12-06', { [twice.bank]: 300000, [twice.A]: 50000, [twice.B]: 24000 });
  twice.check('2026-12-13', { [twice.bank]: 526000, [twice.A]: 21000, [twice.B]: 7000 });
  twice.check('2026-12-13', { [twice.A]: 22400 }, { told: '2026-12-13T21:10:00.000+09:00' });
  all.twice = [twice.book, '2026-12-13'];
  const twiceFig = book => JSON.stringify([gaps(book, '2026-12-13', twice.A), gaps(book, '2026-12-13', twice.B), spent(book, '2026-12-13')]);
  t('two checks of Card A on 13 Dec: gaps of 21,000 and 1,400 that day, 22,400 owed, 73,400 over the two periods', () => {
    eq(gapOn(twice.book, '2026-12-13', twice.A, '2026-12-13').map(g => g[1]), [21000, 1400]);
    eq(LA.lookahead(twice.book, '2026-12-13').cards[twice.A].owedNow, 22400);
    eq(spent(twice.book, '2026-12-13').reduce((s, x) => s + x[1], 0), 73400);
  });
  for (const [name, f] of Object.entries(ORDERS)) t('two checks on one day, records ' + name + ': the same to the yen', () => eq(twiceFig(inOrder(twice.book, f)), twiceFig(twice.book)));

  // ---- 7. His card payments on the 10th and 11th left UNTICKED at the 13 Dec check ----
  //    6 Dec  bank 300,000, A 50,000 (30,000 not logged), B 24,000 (14,000 not logged)
  //   13 Dec  the pay is ticked, the two card payments are not. He types what he sees: bank 526,000, A 21,000, B 7,000.
  //   What truly happened: 50,000 and 24,000 left the bank, and 21,000 and 7,000 were spent on the cards (old period
  //   56,000, new 16,000). What the app knows: no payment. So
  //     the bank should hold 600,000 and shows 526,000: 74,000 "not logged" over 7 to 13 Dec:
  //         3 of 7 days 31,714 (and 0.29), the rest 42,286
  //     Card A should hold 50,000 and shows 21,000: a gap of MINUS 29,000: 3 of 7 is -12,429 (-12,428.57), rest -16,571
  //     Card B should hold 24,000 and shows 7,000: MINUS 17,000: 3 of 7 is -7,286 (-7,285.71), rest -9,714
  //   Old period: 44,000 + 31,714 - 12,429 - 7,286 = 55,999. New: 42,286 - 16,571 - 9,714 = 16,001.
  //   So with the bank and the cards checked on the same days the minus on the cards and the plus on the bank cancel
  //   day for day, and each period is right to one yen of rounding. Spreading the minus is what makes that so: all of
  //   it on 13 Dec would give old 75,714 and new -3,714.
  //   The payments stay asked for: 50,000 and 24,000 are still on the list to tick at the next check.
  const unt = mako('n7y2bd');
  unt.check('2026-12-06', { [unt.bank]: 300000, [unt.A]: 50000, [unt.B]: 24000 });
  unt.check('2026-12-13', { [unt.bank]: 526000, [unt.A]: 21000, [unt.B]: 7000 }, { tick: x => !x.statement });
  all.unt = [unt.book, '2026-12-13'];
  t('card payments left unticked: minus gaps of 29,000 and 17,000, spread over 7 to 13 Dec like the bank\'s 74,000', () => {
    eq(gapOn(unt.book, '2026-12-13', unt.A, '2026-12-13'), [['2026-12-13', -29000, [['2026-12-07', '2026-12-09', 3, -12429], ['2026-12-10', '2026-12-13', 4, -16571]]]]);
    eq(gapOn(unt.book, '2026-12-13', unt.B, '2026-12-13'), [['2026-12-13', -17000, [['2026-12-07', '2026-12-09', 3, -7286], ['2026-12-10', '2026-12-13', 4, -9714]]]]);
    const bankGap = LA.lookahead(unt.book, '2026-12-13').accounts[unt.bank].fillers.filter(f => f.amount);
    eq(bankGap.map(f => [f.amount, f.parts.map(p => [p.from, p.to, p.days, p.amount])]), [[74000, [['2026-12-07', '2026-12-09', 3, 31714], ['2026-12-10', '2026-12-13', 4, 42286]]]]);
  });
  t('card payments left unticked, bank and cards checked on the same days: old period 55,999, new 16,001 (truth 56,000 and 16,000)', () => {
    eq(spent(unt.book, '2026-12-13'), [['2026-12-10', 16001], ['2026-11-10', 55999]]);
  });
  t('card payments left unticked: both are still asked for, 50,000 and 24,000, and the cards owe what was typed', () => {
    const r = LA.lookahead(unt.book, '2026-12-13');
    eq(r.checkIn.toConfirm.map(x => [x.lands, x.amount]), [['2026-12-10', 50000], ['2026-12-11', 24000]]);
    eq([r.cards[unt.A].owedNow, r.cards[unt.B].owedNow, r.accounts[unt.bank].bank], [21000, 7000, 526000]);
  });
  // The same, but on 6 Dec he typed only the cards (the bank was last seen at setup, 24 Nov). The bank's 74,000 is
  // then spread over 25 Nov to 13 Dec, 19 days: 15 old days 58,421 (and 0.05), 4 new days 15,579. The cards' minus
  // is still over 7 to 13 Dec. Old: 44,000 + 58,421 - 12,429 - 7,286 = 82,706. New: 15,579 - 16,571 - 9,714 = -10,706.
  // The two stretches no longer match, so the old period reads 26,706 too high and the new one reads BELOW ZERO spent
  // (70,706 left of 60,000). Asserted as what the rule gives today, a choice for the lane to confirm, not an accident.
  const unt2 = mako('h4z9ls');
  unt2.check('2026-12-06', { [unt2.A]: 50000, [unt2.B]: 24000 });
  unt2.check('2026-12-13', { [unt2.bank]: 526000, [unt2.A]: 21000, [unt2.B]: 7000 }, { tick: x => !x.statement });
  all.unt2 = [unt2.book, '2026-12-13'];
  t('card payments left unticked, the bank last checked at setup: old period 82,706, new period minus 10,706 (72,000 in all)', () => {
    eq(spent(unt2.book, '2026-12-13'), [['2026-12-10', -10706], ['2026-11-10', 82706]]);
  });

  // ---- 8. Odd amounts and a minus gap, in yen ----
  //    6 Dec  bank 300,000, A 50,000 (30,000 not logged), B 10,000
  //   11 Dec  a coat on Card A, 30,000, logged on Free to spend
  //   13 Dec  pay, A's 50,000 and B's 10,000 ticked, bank 540,000. Card A shows 19,999 where the app has 30,000 (a
  //           refund he never logged): MINUS 10,001 over 7 to 13 Dec: 3 of 7 is -4,286 (-4,286.14), the rest -5,715.
  //           Card B shows 7,003: 3 of 7 is 3,001 (3,001.29), the rest 4,002.
  //   Old period: 30,000 - 4,286 + 3,001 = 28,715. New: the coat 30,000 - 5,715 + 4,002 = 28,287. In all 57,002.
  const odd = mako('b5r8fc');
  odd.check('2026-12-06', { [odd.bank]: 300000, [odd.A]: 50000, [odd.B]: 10000 });
  await odd.spend('2026-12-11', { a: 30000, acct: odd.A, line: 'free', note: 'Coat' });
  odd.check('2026-12-13', { [odd.bank]: 540000, [odd.A]: 19999, [odd.B]: 7003 });
  all.odd = [odd.book, '2026-12-13'];
  t('yen, odd amounts: minus 10,001 is -4,286 and -5,715; 7,003 is 3,001 and 4,002; each adds up to its gap', () => {
    eq(gapOn(odd.book, '2026-12-13', odd.A, '2026-12-13'), [['2026-12-13', -10001, [['2026-12-07', '2026-12-09', 3, -4286], ['2026-12-10', '2026-12-13', 4, -5715]]]]);
    eq(gapOn(odd.book, '2026-12-13', odd.B, '2026-12-13'), [['2026-12-13', 7003, [['2026-12-07', '2026-12-09', 3, 3001], ['2026-12-10', '2026-12-13', 4, 4002]]]]);
    eq(spent(odd.book, '2026-12-13'), [['2026-12-10', 28287], ['2026-11-10', 28715]]);
  });

  // ---- 9. A cents currency (M48): US dollars, every amount in cents ----
  //   Set up 24 Nov: checking $3,000.00, pay $3,000.00 on the 10th, one card owing $200.00 paid in full on the 10th,
  //   Free to spend $600.00.   6 Dec  checking $3,000.00, card $500.00 ($300.00 not logged)
  //   13 Dec  pay and the card's $500.00 ticked, checking $5,500.00, card $100.01: 10,001 cents over 7 to 13 Dec:
  //           3 of 7 is 4,286 cents (4,286.14), the rest 5,715 cents. No cent is lost or made.
  //   Old period: 30,000 + 4,286 = 34,286 cents ($342.86). New: 5,715 cents ($57.15).
  const usd = world({ day: '2026-11-24', told: noon('2026-11-24', '-05:00'), currency: 'USD', country: 'US',
    banks: [{ key: 'bank1', name: 'Checking', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'card1', name: 'Card A', owed: 20000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 60000 }, 'u8w4nz');
  usd.check('2026-12-06', { [usd.bank]: 300000, [usd.A]: 50000 });
  usd.check('2026-12-13', { [usd.bank]: 550000, [usd.A]: 10001 });
  all.usd = [usd.book, '2026-12-13'];
  t('US dollars: $100.01 not logged is $42.86 before the pay and $57.15 after, to the cent', () => {
    eq(gapOn(usd.book, '2026-12-13', usd.A, '2026-12-13'), [['2026-12-13', 10001, [['2026-12-07', '2026-12-09', 3, 4286], ['2026-12-10', '2026-12-13', 4, 5715]]]]);
    eq(spent(usd.book, '2026-12-13'), [['2026-12-10', 5715], ['2026-11-10', 34286]]);
  });

  // ---- 10. Paid every two weeks and away three weeks: two period starts in one stretch, three parts ----
  //   Set up Mon 16 Nov 2026: bank 200,000, pay 140,000 every two weeks on a Friday (13 Nov, 27 Nov, 11 Dec), one
  //   card owing 15,000 paid in full on the 27th, Free to spend 30,000 each pay. Periods: 13 to 26 Nov, 27 Nov to
  //   10 Dec, from 11 Dec.
  //   20 Nov  bank 200,000, card 21,000 (6,000 not logged, in the first period)
  //   then away.  12 Dec  both pays and the card's 21,000 (27 Nov) ticked, bank 459,000 (200,000 + 280,000 - 21,000),
  //           card 33,005: 33,005 over 21 Nov to 12 Dec, 22 days:
  //             21 to 26 Nov, 6 days:      9,001 (9,001.36)
  //             27 Nov to 10 Dec, 14 days: 21,003 (21,003.18)
  //             11 and 12 Dec, the rest:   3,001
  //   First period 6,000 + 9,001 = 15,001; second 21,003; the one running 3,001, so 26,999 of its 30,000 is left.
  const two = world({ day: '2026-11-16', told: noon('2026-11-16'), currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 200000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 140000, every: 'weeks', n: 2, start: '2026-11-13', shift: 'none', startsPeriod: true }],
    cards: [{ key: 'card1', name: 'Card A', owed: 15000, payDay: 27, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 30000 }, 'j5t8rc');
  two.check('2026-11-20', { [two.bank]: 200000, [two.A]: 21000 });
  two.check('2026-12-12', { [two.bank]: 459000, [two.A]: 33005 });
  all.two = [two.book, '2026-12-12'];
  t('paid every two weeks, away three: 33,005 in three parts, 9,001 then 21,003 then 3,001', () => {
    eq(gapOn(two.book, '2026-12-12', two.A, '2026-12-12'), [['2026-12-12', 33005, [['2026-11-21', '2026-11-26', 6, 9001], ['2026-11-27', '2026-12-10', 14, 21003], ['2026-12-11', '2026-12-12', 2, 3001]]]]);
  });
  t('paid every two weeks, away three: the periods hold 15,001, 21,003 and 3,001, and 26,999 is left', () => {
    eq(spent(two.book, '2026-12-12'), [['2026-12-11', 3001], ['2026-11-27', 21003], ['2026-11-13', 15001]]);
    const r = LA.lookahead(two.book, '2026-12-12');
    eq([r.period.free.left, r.accounts[two.bank].bank, r.cards[two.A].owedNow], [26999, 459000, 33005]);
    eq(r.accounts[two.bank].fillers.filter(f => f.amount).length, 0);
  });

  // ---- every life above: a gap's parts add up to it, none is dated after its check, none has zero or fewer days ----
  t('in all ' + Object.keys(all).length + ' lives every card gap\'s parts add up to the gap, none dated after its check, none with no days', () => {
    let n = 0;
    for (const k of Object.keys(all)) {
      const [book, day] = all[k], r = LA.lookahead(book, day);
      for (const id of Object.keys(r.cards)) for (const f of r.cards[id].fillers) {
        eq(f.parts.reduce((s, p) => s + p.amount, 0), f.amount, k + ' ' + f.day);
        for (const p of f.parts) { n++; ok(p.to <= f.day && p.days >= 1 && p.from <= p.to && p.amount !== 0, k + ' ' + JSON.stringify(p)); }
      }
    }
    ok(n >= 30, 'parts looked at: ' + n);
  });
  done('card_gap_lives.test.js');
})().catch(e => { console.log('FAIL card_gap_lives.test.js could not build a life: ' + (e && e.stack || e)); process.exitCode = 1; });
