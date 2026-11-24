'use strict';
// A card's unlogged spending found at a check belongs to the days it covers, not to the day the card was checked
// (MAKO_SAYS M11 logs weekly, M30 nearly all spending on cards, M36, M38; DECISIONS_ROUND2 A4, T2 and period-end q1: a
// gap's stretch is split by days at the pay). Found by qc-foundation on the end-of-period plan, 24 Nov 2026.
// Made-up yen, Mako's shape: one bank, pay 300,000 on the 10th, two cards paid in full on the 10th and 11th (close
// days not sure), Free to spend 60,000, cards checked about weekly.
//   24 Nov  setup: bank 300,000, Card A owes 20,000, Card B owes 10,000
//    6 Dec  cards checked: A at 50,000 (30,000 not logged), B at 24,000 (14,000 not logged), all in the period to 9 Dec
//   10 Dec  pay lands, Card A's 50,000 leaves the bank; 11 Dec Card B's 24,000 leaves
//   13 Dec  all three ticked, bank checked at 526,000 (300,000 + 300,000 - 50,000 - 24,000, no gap of its own),
//           A checked at 21,000 and B at 7,000: not logged over 7 Dec to 13 Dec, seven days.
//           7, 8 and 9 Dec are in the old period (3 of 7 days), 10 to 13 Dec in the new one (4 of 7):
//           A 21,000 is 9,000 old and 12,000 new; B 7,000 is 3,000 old and 4,000 new
// So the old period's Free to spend spent is 30,000 + 14,000 + 9,000 + 3,000 = 56,000 and the new period's is 16,000.
// Before the fix both gaps are dated 13 Dec whole: old 44,000, new 28,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), P = require('../periods.js'), IDS = require('../ids.js');

function life(order) {
  const newId = IDS.idMaker('k3f9aq');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'card1', name: 'Card A', owed: 20000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true },
      { key: 'card2', name: 'Card B', owed: 10000, payDay: 11, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 60000 }, { newId });
  let book = out.book || out;
  const [card, cardB] = book.accounts.filter(a => a.type === 'card').map(a => a.id), bank = book.accounts.find(a => a.type !== 'card').id;
  const check = (day, figures, tick) => {
    const r = LA.lookahead(book, day), list = r.checkIn.toConfirm.filter(o => tick(o));
    const expected = {}, lands = {}; for (const o of r.checkIn.toConfirm) { expected[o.item] = o.amount; lands[o.item] = o.lands; }
    const o = CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures, ticked: list.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} });
    book = CI.apply(book, o);
  };
  check('2026-12-06', { [card]: 50000, [cardB]: 24000 }, () => true);
  check('2026-12-13', { [bank]: 526000, [card]: 21000, [cardB]: 7000 }, () => true);
  if (order) book = Object.assign({}, book, { events: order(book.events.slice()) });
  return { book, card, cardB, bank };
}
const spentOf = book => { const p = P.periods(book, '2026-12-13'); return { old: p.past[0], now: p.current }; };

t('the periods are 10 Nov to 9 Dec and from 10 Dec', () => {
  const { old, now } = spentOf(life().book);
  ok(old, 'a past period'); eq(old.end, '2026-12-09'); eq(now.start, '2026-12-10');
});
t('the old period holds what was found on 6 Dec (44,000) and 3 of 7 days of what was found on 13 Dec (12,000): 56,000', () => {
  eq(spentOf(life().book).old.free.spent, 56000);
});
t('the new period holds 4 of 7 days of the 28,000 found on 13 Dec: 16,000', () => {
  eq(spentOf(life().book).now.free.spent, 16000);
});
t('nothing is lost or counted twice: 72,000 in all', () => {
  const { old, now } = spentOf(life().book);
  eq(old.free.spent + now.free.spent, 72000);
});
t('each card still owes what was typed, and the bank has no gap of its own', () => {
  const { book, card, cardB, bank } = life();
  const r = LA.lookahead(book, '2026-12-13');
  eq([r.cards[card].owedNow, r.cards[cardB].owedNow], [21000, 7000]);
  eq(r.accounts[bank].bank, 526000);
  eq(r.accounts[bank].fillers.filter(f => f.amount).length, 0);
});
t('the same in every order the records can arrive in', () => {
  const orders = [e => e.reverse(), e => e.sort((x, y) => (x.id < y.id ? -1 : 1)), e => e.sort((x, y) => (x.id < y.id ? 1 : -1)),
    e => e.sort((x, y) => (String(x.date) < String(y.date) ? 1 : -1)), e => e.slice(1).concat(e.slice(0, 1))];
  for (const o of orders) { const s = spentOf(life(o).book); eq([s.old.free.spent, s.now.free.spent], [56000, 16000]); }
});
done('card_gap_period.test.js');
