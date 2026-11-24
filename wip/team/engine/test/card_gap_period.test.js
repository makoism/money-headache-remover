'use strict';
// A card's unlogged spending found at a check belongs to the days it covers, not to the day the card was checked
// (MAKO_SAYS M11 logs weekly, M30 nearly all spending on cards, M36, M38; DECISIONS_ROUND2 A4, T2 and period-end q1: a
// gap's stretch is split by days at the pay). Found by qc-foundation on the end-of-period plan, 24 Nov 2026.
// Made-up yen, Mako's shape: one bank, pay 300,000 on the 10th, one card paid on the 27th, Free to spend 60,000.
//   24 Nov  setup: the card owes 20,000
//   27 Nov  the card's payment of 20,000 leaves the bank (ticked at the next check): the card owes 0
//    6 Dec  bank checked at 280,000, card checked at 30,000: 30,000 not logged, all inside the period that ends 9 Dec
//   13 Dec  the pay is ticked, bank checked at 580,000, card checked at 51,000: 21,000 not logged over 7 Dec to 13 Dec,
//           seven days:
//           7, 8 and 9 Dec are in the old period (3 of 7 days: 9,000), 10 to 13 Dec in the new one (4 of 7: 12,000)
// So the old period's Free to spend spent is 30,000 + 9,000 = 39,000 and the new period's is 12,000.
// Before the fix the whole 21,000 is dated 13 Dec: old 30,000, new 21,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), P = require('../periods.js'), IDS = require('../ids.js');

function life(order) {
  const newId = IDS.idMaker('k3f9aq');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'card1', name: 'Card A', owed: 20000, payDay: 27, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 60000 }, { newId });
  let book = out.book || out;
  const card = book.accounts.find(a => a.type === 'card').id, bank = book.accounts.find(a => a.type !== 'card').id;
  const check = (day, figures, tick) => {
    const r = LA.lookahead(book, day), list = r.checkIn.toConfirm.filter(o => tick(o));
    const expected = {}, lands = {}; for (const o of r.checkIn.toConfirm) { expected[o.item] = o.amount; lands[o.item] = o.lands; }
    const o = CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures, ticked: list.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} });
    book = CI.apply(book, o);
  };
  check('2026-12-06', { [bank]: 280000, [card]: 30000 }, () => true);
  check('2026-12-13', { [bank]: 580000, [card]: 51000 }, () => true);
  if (order) book = Object.assign({}, book, { events: order(book.events.slice()) });
  return { book, card, bank };
}
const spentOf = book => { const p = P.periods(book, '2026-12-13'); return { old: p.past[0], now: p.current }; };

t('the periods are 10 Nov to 9 Dec and from 10 Dec', () => {
  const { old, now } = spentOf(life().book);
  ok(old, 'a past period'); eq(old.end, '2026-12-09'); eq(now.start, '2026-12-10');
});
t('the old period holds the 30,000 found on 6 Dec and 3 of 7 days of the 21,000 found on 13 Dec: 39,000', () => {
  eq(spentOf(life().book).old.free.spent, 39000);
});
t('the new period holds 4 of 7 days of the 21,000: 12,000', () => {
  eq(spentOf(life().book).now.free.spent, 12000);
});
t('nothing is lost or counted twice: 51,000 in all', () => {
  const { old, now } = spentOf(life().book);
  eq(old.free.spent + now.free.spent, 51000);
});
t('the card still owes what was typed, 51,000, and the bank has no gap of its own', () => {
  const { book, card, bank } = life();
  const r = LA.lookahead(book, '2026-12-13');
  eq(r.cards[card].owedNow, 51000);
  eq(r.accounts[bank].bank, 580000);
  eq(r.accounts[bank].fillers.filter(f => f.amount).length, 0);
});
t('the same in every order the records can arrive in', () => {
  const orders = [e => e.reverse(), e => e.sort((x, y) => (x.id < y.id ? -1 : 1)), e => e.sort((x, y) => (x.id < y.id ? 1 : -1)),
    e => e.sort((x, y) => (String(x.date) < String(y.date) ? 1 : -1)), e => e.slice(1).concat(e.slice(0, 1))];
  for (const o of orders) { const s = spentOf(life(o).book); eq([s.old.free.spent, s.now.free.spent], [39000, 12000]); }
});
done('card_gap_period.test.js');
