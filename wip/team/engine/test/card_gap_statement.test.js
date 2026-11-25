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
done('card_gap_statement.test.js');
