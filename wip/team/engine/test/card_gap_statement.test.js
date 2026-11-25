'use strict';
// A card with a known close day: spending that was not logged and is found at a check goes on the statement its days
// fall in, not on the statement of the day the card was checked (MAKO_SAYS M40 "what is on each now, when it is paid,
// and the bank after the cards are paid", M41, M36). Found by qc-foundation on the engine branch, 25 Nov 2026: the
// gap was split by days for the pay periods but still put whole on the check's day for the statements, so spending
// from before a close landed after it and the next payment read too low.
// Made-up yen. Set up Tue 24 Nov 2026: bank 500,000, pay 300,000 on the 25th, one card that closes on the 15th and is
// paid on the 10th of the month after, nothing on it and nothing on its closed statement. From 25 Nov she spends
// 2,000 a day on the card and logs nothing; she types the card's figure each Saturday.
//   28 Nov  8,000 (25 to 28 Nov)        5 Dec 22,000        12 Dec 36,000        19 Dec 50,000        26 Dec 64,000
//   The statement that closes 15 Dec really holds 25 Nov to 15 Dec, 21 days: 42,000, paid 10 Jan.
//   The check of 19 Dec finds 14,000 over 13 to 19 Dec: 13, 14 and 15 Dec (3 of 7 days: 6,000) are before the close,
//   so the closed statement is 36,000 + 6,000 = 42,000 and the open one holds the other 8,000.
//   Before the fix the whole 14,000 sat on 19 Dec: the 10 Jan payment read 36,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), IDS = require('../ids.js');
function life(upTo) {
  const newId = IDS.idMaker('m4t8zc');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 500000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 25, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'card1', name: 'Card A', owed: 0, payDay: 10, closeDay: 15, payFrom: 'bank1', shift: 'none', inFull: true, statement: 0 }],
    bills: [], free: 80000 }, { newId });
  let book = out.book || out;
  const card = book.accounts.find(a => a.type === 'card').id;
  for (const [day, fig] of [['2026-11-28', 8000], ['2026-12-05', 22000], ['2026-12-12', 36000], ['2026-12-19', 50000], ['2026-12-26', 64000]]) {
    if (day > upTo) break;
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures: { [card]: fig }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  }
  return { book, card };
}
t('before the close: on 12 Dec the card owes the 36,000 typed and nothing is due yet from a closed statement', () => {
  const { book, card } = life('2026-12-12'), k = LA.lookahead(book, '2026-12-12').cards[card];
  eq(k.owedNow, 36000);
});
t('after the 19 Dec check the statement closed 15 Dec is 42,000, due 10 Jan (3 of 7 days of the 14,000 are before the close)', () => {
  const { book, card } = life('2026-12-19'), k = LA.lookahead(book, '2026-12-20').cards[card];
  eq([k.owedNow, k.next.amount, k.next.payment_date], [50000, 42000, '2027-01-10']);
});
t('a week later the same statement is still 42,000, and the card owes the 64,000 typed', () => {
  const { book, card } = life('2026-12-26'), k = LA.lookahead(book, '2026-12-27').cards[card];
  eq([k.owedNow, k.next.amount, k.next.payment_date], [64000, 42000, '2027-01-10']);
});
t('the gap\'s parts still add up to the gap, and the pay periods read as before (cut at the 25 Dec pay only)', () => {
  const { book, card } = life('2026-12-26'), r = LA.lookahead(book, '2026-12-27');
  for (const f of r.cards[card].fillers) eq(f.parts.reduce((s, p) => s + p.amount, 0), f.amount);
  const last = r.cards[card].fillers.slice(-1)[0];
  eq(last.parts.map(p => [p.from, p.to, p.amount]), [['2026-12-20', '2026-12-24', 10000], ['2026-12-25', '2026-12-26', 4000]]);
});
// ---- more lives, each worked by hand by qc-foundation on the plan (25 Nov). The same bank, pay and card unless said;
//      the first three checks are always 28 Nov 8,000, 5 Dec 22,000 and 12 Dec 36,000. ----
const W = [['2026-11-28', 8000], ['2026-12-05', 22000], ['2026-12-12', 36000]];
const RATE = { inFull: false, apr: 18, minRule: { pct: 10, floor: 1000 } };
// checks: [day, card figure, { noTick }]; the bank is never typed, every listed item is ticked unless noTick
function walk(checks, cardOver) {
  const newId = IDS.idMaker('m4t8zc');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 500000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 25, shift: 'none', startsPeriod: true }],
    cards: [Object.assign({ key: 'card1', name: 'Card A', owed: 0, payDay: 10, closeDay: 15, payFrom: 'bank1', shift: 'none', inFull: true, statement: 0 }, cardOver && cardOver.inFull === false ? { inFull: false } : {}, cardOver && cardOver.closeDay ? { closeDay: cardOver.closeDay, payDay: cardOver.payDay } : {})],
    bills: [], free: 80000 }, { newId });
  let book = out.book || out;
  const card = book.accounts.find(a => a.type === 'card').id;
  if (cardOver && cardOver.apr) Object.assign(book.accounts.find(a => a.id === card), { apr: cardOver.apr, minRule: cardOver.minRule });
  const seen = {};
  for (const [day, fig, o] of checks) {
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    const ticked = o && o.noTick ? r.checkIn.toConfirm.filter(x => IDS.occurrence(x.item).schedule !== card).map(x => x.item) : r.checkIn.toConfirm.map(x => x.item);
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures: { [card]: fig }, ticked, unticked: [], amounts: {}, expected, lands, landed: {} }));
    seen[day] = LA.lookahead(book, day).cards[card];
  }
  return { book, card, seen, at: d => LA.lookahead(book, d).cards[card] };
}
const stmt = (k, closed) => (k.statements.find(x => x.closed === closed) || {}).amount;
const overdue = k => (k.overdue || []).map(x => x.amount);

t('a check on the close day itself: all of its gap is before the close, 42,000 due 10 Jan; four days on, still 42,000', () => {
  const w = walk(W.concat([['2026-12-15', 42000], ['2026-12-19', 50000]]));
  eq([w.seen['2026-12-15'].next.amount, w.seen['2026-12-15'].next.payment_date], [42000, '2027-01-10']);
  eq([w.at('2026-12-19').owedNow, w.at('2026-12-19').next.amount], [50000, 42000]);
});
t('away five weeks, the 10 Jan payment ticked at 36,000: the paid statement is not reopened, the next is 62,172 due 10 Feb', () => {
  const k = walk(W.concat([['2027-01-16', 64000]])).at('2027-01-16');
  eq([k.owedNow, overdue(k), k.next.amount, k.next.payment_date], [64000, [], 62172, '2027-02-10']);
});
t('the same with the payment left unticked: 38,400 overdue (36,000 and 2,400 of the gap), 63,200 on the next statement', () => {
  const k = walk(W.concat([['2027-01-16', 64000, { noTick: true }]])).at('2027-01-16');
  eq([k.owedNow, overdue(k), stmt(k, '2027-01-15')], [64000, [38400], 63200]);
});
t('a first check eight weeks after the card was opened: nothing falsely overdue, 65,684 on the 15 Jan statement', () => {
  const k = walk([['2027-01-20', 72000]]).at('2027-01-20');
  eq([k.owedNow, overdue(k), stmt(k, '2027-01-15')], [72000, [], 65684]);
});
t('a card with a rate, away five weeks, unticked: the card owes exactly the 106,000 typed (interest moved by the parts is taken up)', () => {
  const k = walk(W.concat([['2027-01-16', 106000, { noTick: true }]]), RATE).at('2027-01-16');
  eq(k.owedNow, 106000);
  eq([overdue(k), k.next.amount], [[4195], 10411]);
});
t('the same card with the 10 Jan payment ticked (3,600), 102,000 typed: owes 102,000, next 10,003', () => {
  const k = walk(W.concat([['2027-01-16', 102000]]), RATE).at('2027-01-16');
  eq([k.owedNow, k.next.amount], [102000, 10003]);
});
t('a payment ticked later never rewrites what an earlier check found (rate card, checks to 13 Feb)', () => {
  const w = walk(W.concat([['2026-12-19', 50000], ['2026-12-26', 64000], ['2027-01-16', 101800], ['2027-02-13', 150000]]), RATE);
  eq(stmt(w.seen['2026-12-19'], '2026-12-15'), 42000);
  const end = w.at('2027-02-13'), r = LA.lookahead(w.book, '2027-02-13');
  eq([stmt(end, '2026-12-15'), stmt(end, '2027-01-15')], [42000, 99827]);
  eq(r.cards[w.card].fillers.find(f => f.day === '2027-01-16').amount, 41433);
  eq(end.owedNow, 150000);
});
t('in every life the card owes the figure typed on the day it was typed', () => {
  for (const [checks, over] of [[W.concat([['2026-12-19', 50000], ['2026-12-26', 64000]])], [W.concat([['2027-01-16', 64000]])], [W.concat([['2027-01-16', 106000, { noTick: true }]]), RATE], [[['2027-01-20', 72000]]]]) {
    const w = walk(checks, over);
    for (const [day, fig] of checks) eq(w.seen[day].owedNow, fig);
  }
});
// A minus gap across a close: on 19 Dec the card shows 29,000 where the app had 36,000 (a refund nobody logged), 7,000
// less over 13 to 19 Dec. By days: 3 of 7 (3,000) before the close, the other 4,000 after. The 15 Dec statement is
// 36,000 - 3,000 = 33,000, due 10 Jan, and the card owes the 29,000 typed.
t('a minus gap across a close is split the same way: the closed statement reads 33,000', () => {
  const k = walk(W.concat([['2026-12-19', 29000]])).at('2026-12-19');
  eq([k.owedNow, k.next.amount, k.next.payment_date], [29000, 33000, '2027-01-10']);
});
t('the same in every order the records arrive in', () => {
  const w = walk(W.concat([['2026-12-19', 50000], ['2026-12-26', 64000], ['2027-01-16', 92000]]));
  const pick = b => { const k = LA.lookahead(b, '2027-01-16').cards[w.card]; return [k.owedNow, k.next.amount, k.statements.map(x => [x.closed, x.amount]), k.fillers.map(f => f.amount)]; };
  const want = pick(w.book);
  const orders = [e => e.reverse(), e => e.sort((x, y) => (x.id < y.id ? -1 : 1)), e => e.sort((x, y) => (x.id < y.id ? 1 : -1)), e => e.sort((x, y) => (String(x.date) < String(y.date) ? 1 : -1)),
    e => e.slice(1).concat(e.slice(0, 1)), e => e.slice(3).concat(e.slice(0, 3)), e => e.filter((_, i) => i % 2).concat(e.filter((_, i) => !(i % 2))), e => e.sort((x, y) => (String(x.k) < String(y.k) ? -1 : 1)), e => e.sort((x, y) => (x.a || 0) - (y.a || 0))];
  for (const o of orders) eq(pick(Object.assign({}, w.book, { events: o(w.book.events.slice()) })), want);
});
// Away across TWO payment days (qc-foundation on the build, 25 Nov). Checks to 12 Dec (36,000), then back on 20 Feb.
// She really spent 2,000 a day for 88 days, 176,000; the bank really paid 42,000 on 10 Jan and 62,000 on 10 Feb, so the
// card shows 72,000. The app asks only about the 10 Jan payment (36,000, what it knew); she ticks it and types 72,000.
// The part of the gap whose days fall before the 15 Dec close cannot go on that paid statement, and the 15 Jan
// statement's payment day (10 Feb) has also passed with nothing on it: the part carries on, close by close, to the
// first statement not already paid as of the check. Nothing is overdue; the 15 Feb statement, due 10 Mar, is 66,858.
// Before this the part stopped on the 15 Jan statement and showed as "overdue 10 Feb: 3,086", a payment that never was.
t('away across two payment days: no false overdue, 66,858 due 10 Mar, the card owes the 72,000 typed', () => {
  const k = walk(W.concat([['2027-02-20', 72000]])).at('2027-02-20');
  eq([k.owedNow, overdue(k), k.next.amount, k.next.payment_date], [72000, [], 66858, '2027-03-10']);
});
// A card that closes on the last day and is paid on the 27th, first checked twelve weeks after setup (16 Feb, 100,000
// typed, nothing ticked because nothing was known to be due): nothing was ever asked, so nothing can be overdue.
t('a first check after two payment days on a card that closes the 31st: no false overdue', () => {
  const k = walk([['2027-02-16', 100000]], { closeDay: 31, payDay: 27 }).at('2027-02-16');
  eq([k.owedNow, overdue(k)], [100000, []]);
});
done('card_gap_statement.test.js');
