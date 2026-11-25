'use strict';
// A card's unlogged spending found at a check is spending in the period the CHECK is in, whole (MAKO_SAYS M11 logs
// weekly, M30 nearly all spending on cards, M36, M38; DECISIONS_ROUND2 T2 and CHECKGAP: coordinator 15, 26 Nov 2026,
// replacing the split by days at the pay that qc-foundation asked for on 24 Nov). A closed period never changes by it.
// Made-up yen, Mako's shape: one bank, pay 300,000 on the 10th, two cards paid in full on the 10th and 11th (close
// days not sure), Free to spend 60,000, cards checked about weekly.
//   24 Nov  setup: bank 300,000, Card A owes 20,000, Card B owes 10,000
//    6 Dec  cards checked: A at 50,000 (30,000 not logged), B at 24,000 (14,000 not logged), all in the period to 9 Dec
//   10 Dec  pay lands, Card A's 50,000 leaves the bank; 11 Dec Card B's 24,000 leaves
//   13 Dec  all three ticked, bank checked at 526,000 (300,000 + 300,000 - 50,000 - 24,000, no gap of its own),
//           A checked at 21,000 and B at 7,000: not logged over 7 Dec to 13 Dec, seven days, found on 13 Dec.
// [CHECKGAP] Both gaps are the period from 10 Dec's, whole: the old period's Free to spend spent is 30,000 + 14,000 =
// 44,000 (what the 6 Dec checks found) and the new period's 21,000 + 7,000 = 28,000. (By days it was 56,000 and 16,000.)
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
t('[CHECKGAP] the old period holds what was found on 6 Dec, 44,000, and nothing of what was found on 13 Dec', () => {
  eq(spentOf(life().book).old.free.spent, 44000);
});
t('[CHECKGAP] the new period holds all 28,000 found on 13 Dec', () => {
  eq(spentOf(life().book).now.free.spent, 28000);
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
  for (const o of orders) { const s = spentOf(life(o).book); eq([s.old.free.spent, s.now.free.spent], [44000, 28000]); }
});
// ---- no fixed pay: the plan runs by the calendar month; a gap found on 5 Dec is December's, whole [CHECKGAP] ----
// Made-up yen: a bank at 420,000, no fixed pay, Free to spend 60,000 a month, set up 1 Nov 2026.
//   28 Nov  bank checked at 420,000 (no gap); on 5 Dec it shows 406,000: 14,000 not logged over 29 Nov to 5 Dec,
//           found on 5 Dec, so December's whole: Free to spend left this month is 60,000 - 14,000 = 46,000 (never
//           nowhere, which gave 60,000; by days it was 50,000). The same with the 14,000 found on a card.
function byDayLife(where) {
  const newId = IDS.idMaker('p7m2xd');
  const out = BB.buildBook({ day: '2026-11-01', told: '2026-11-01T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 420000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }],
    cards: [{ key: 'card1', name: 'Card A', owed: 0, payDay: 27, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 60000 }, { newId });
  let book = out.book || out;
  const card = book.accounts.find(a => a.type === 'card').id, bank = book.accounts.find(a => a.type !== 'card').id;
  const check = (day, figures) => {
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const o of r.checkIn.toConfirm) { expected[o.item] = o.amount; lands[o.item] = o.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures, ticked: r.checkIn.toConfirm.map(o => o.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  check('2026-11-28', { [bank]: 420000, [card]: 0 });
  check('2026-12-05', where === 'card' ? { [bank]: 420000, [card]: 14000 } : { [bank]: 406000, [card]: 0 });
  return { book, card, bank };
}
t('[CHECKGAP] no fixed pay, a bank gap across the 1st found on 5 Dec: all 14,000 is December\'s, so 46,000 is left', () => {
  const { book, bank } = byDayLife('bank'), r = LA.lookahead(book, '2026-12-05'), f = r.accounts[bank].fillers.slice(-1)[0];
  eq([f.from, f.to], ['2026-11-29', '2026-12-05']);   // the days it covers, for the words
  eq(f.parts.map(p => [p.from, p.to, p.amount]), [['2026-12-05', '2026-12-05', 14000]]);
  ok(r.safeToSpend.cappedByFreeToSpend); eq(r.safeToSpend.headline, 46000);   // the headline is Free to spend left this month
});
t('[CHECKGAP] no fixed pay, a card gap across the 1st: the same, all 14,000 on 5 Dec, 46,000 left', () => {
  const { book, card } = byDayLife('card'), r = LA.lookahead(book, '2026-12-05'), f = r.cards[card].fillers.slice(-1)[0];
  eq([f.from, f.to], ['2026-11-29', '2026-12-05']);
  eq(f.parts.map(p => [p.from, p.to, p.amount]), [['2026-12-05', '2026-12-05', 14000]]);
  ok(r.safeToSpend.cappedByFreeToSpend); eq(r.safeToSpend.headline, 46000);   // the headline is Free to spend left this month
});
t('every card gap\'s parts add up to the gap, and none is dated after its check or has no days', () => {
  for (const b of [life().book, byDayLife('card').book]) {
    const r = LA.lookahead(b, '2026-12-13');
    for (const id of Object.keys(r.cards)) for (const f of r.cards[id].fillers) {
      eq(f.parts.reduce((t, p) => t + p.amount, 0), f.amount);
      for (const p of f.parts) ok(p.to <= f.day && p.days >= 1 && p.from <= p.to, JSON.stringify(p));
    }
  }
});
done('card_gap_period.test.js');
