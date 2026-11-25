'use strict';
// The bank after the cards are paid covers every card's next payment (MAKO_SAYS M40: "what is on each now, when it is
// paid, and the bank after the cards are paid"). Found by qc-north-star on candidate 2, 24 Nov 2026: the figure ran
// only to the first counted pay after the first card day (BK1, BK5), so adding a third card paid on the 27th dropped
// the card paid on 11 Dec out of it, and a new debt of 12,000 RAISED the figure by 11,000.
// Made-up yen, set up 24 Nov 2026: bank 168,000, pay 300,000 on the 10th, close days not sure.
//   Two cards: Card A 54,000 paid on the 10th, Card B 23,000 paid on the 11th.
//     168,000 + 300,000 (pay, 10 Dec) - 54,000 - 23,000 = 391,000, after 10 and 11 Dec.
//   With Card C 12,000 paid on the 27th as well: its next payment is 27 Nov.
//     168,000 - 12,000 (27 Nov) + 300,000 - 54,000 - 23,000 = 379,000, after 27 Nov, 10 Dec and 11 Dec.
//   Before the fix the three-card figure is 402,000 "on 27 Nov and 10 Dec": Card B is left out.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
const card = (key, name, owed, payDay) => ({ key, name, owed, payDay, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true });
const PAY = { key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true };
function after(cards, o) {
  o = o || {};
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 168000, main: true, min: null }],
    pays: [o.pay || PAY], cards, bills: o.bills || [], free: null }, { newId: IDS.idMaker('k3f9aq') });
  let book = out.book || out;
  /* a spend on a card, typed by the person: { card: 'Card C', day, a } */
  for (const sp of o.spends || []) book = Object.assign({}, book, { events: book.events.concat([{ id: 'k3f9aq-sp' + sp.day.replace(/-/g, '') + sp.a, k: 'spend', date: sp.day, a: sp.a,
    acct: book.accounts.find(a => a.name === sp.card).id, line: 'free', told: sp.day + 'T12:00:00.000+09:00', src: { type: 'typed' } }]) });
  const r = LA.lookahead(book, o.seen || '2026-11-24'), bank = book.accounts.find(a => a.type !== 'card').id;
  const x = r.bankAfterCards[bank];
  if (x) x.names = x.cards.map(c => book.accounts.find(a => a.id === c).name).sort();
  return x;
}
const A = card('card1', 'Card A', 54000, 10), B = card('card2', 'Card B', 23000, 11), C = card('card3', 'Card C', 12000, 27);
t('two cards: 391,000 after 10 and 11 Dec', () => {
  const x = after([A, B]);
  eq([x.amount, x.cardDays], [391000, ['2026-12-10', '2026-12-11']]);
});
t('a third card paid on the 27th: 379,000 after 27 Nov, 10 Dec and 11 Dec, every card in it', () => {
  const x = after([A, B, C]);
  eq([x.amount, x.cardDays], [379000, ['2026-11-27', '2026-12-10', '2026-12-11']]);
});
t('a new debt never raises the figure', () => {
  eq(after([A, B, C]).amount <= after([A, B]).amount, true);
});
t('the same whichever order the cards were typed in', () => {
  eq(after([C, B, A]).amount, after([A, B, C]).amount);
});
// ---- more lives, each worked by hand by qc-foundation on 24 Nov (made-up yen, the same bank and pay unless said) ----
const rent = (amount, day) => ({ key: 'bill1', name: 'Rent', from: 'bank1', amount, day, shift: 'none' });
t('one card paid after the pay: 445,000 on 11 Dec with the 10 Dec pay in it; one paid before: 156,000 on 27 Nov, no pay', () => {
  let x = after([B]); eq([x.amount, x.cardDays, x.pays], [445000, ['2026-12-11'], ['2026-12-10']]);
  x = after([C]); eq([x.amount, x.cardDays, x.pays], [156000, ['2026-11-27'], []]);
});
t('a card owing nothing is left out: 391,000 and only A and B named', () => {
  const x = after([A, B, card('card5', 'Card E', 0, 27)]);
  eq([x.amount, x.names], [391000, ['Card A', 'Card B']]);
});
t('seen 28 Nov with nothing ticked: Card C is overdue and taken today, 379,000 after 28 Nov, 10 and 11 Dec', () => {
  const x = after([A, B, C], { seen: '2026-11-28' }); eq([x.amount, x.cardDays], [379000, ['2026-11-28', '2026-12-10', '2026-12-11']]);
});
t('seen on pay day, 10 Dec: today\'s pay counted first, 379,000 after 10 and 11 Dec', () => {
  const x = after([A, B, C], { seen: '2026-12-10' }); eq([x.amount, x.cardDays], [379000, ['2026-12-10', '2026-12-11']]);
});
t('seen 12 Dec with nothing ticked: 79,000 on 12 Dec, no pay in it, the 10 Dec pay named as not counted', () => {
  const x = after([A, B, C], { seen: '2026-12-12' });
  eq([x.amount, x.cardDays, x.pays, x.paysNotCounted.map(p => p.due)], [79000, ['2026-12-12'], [], ['2026-12-10']]);
});
t('rent 60,000 on the 1st is taken: 319,000, one bill, no dip; rent 160,000: 219,000 with a dip of 4,000 on 1 Dec', () => {
  let x = after([A, B, C], { bills: [rent(60000, 1)] }); eq([x.amount, x.billsTaken, x.dip], [319000, 1, null]);
  x = after([A, B, C], { bills: [rent(160000, 1)] }); eq([x.amount, x.dip], [219000, { day: '2026-12-01', amount: 4000 }]);
});
// Card D: 40,000 owed, closes the 5th, paid the 15th, nothing on its closed statement: its next payment is 15 Jan, past
// the walk's usual end. 168,000 + 300,000 + 300,000 - 54,000 - 23,000 - 40,000 = 651,000 after 10 Dec, 11 Dec and 15 Jan,
// with the pays of 10 Dec and 10 Jan in it. Cards A and B are paid again on 10 and 11 Jan, inside the stretch, with no
// amount known yet: they are named in laterCardDays, never silently left out. With rent 70,000 on the 12th: two rents
// by 15 Jan, 511,000.
const D = { key: 'card4', name: 'Card D', owed: 40000, payDay: 15, closeDay: 5, payFrom: 'bank1', shift: 'none', inFull: true, statement: 0 };
t('a card whose next payment is after the next pay as well: 651,000 after 10 Dec, 11 Dec and 15 Jan, two pays in it', () => {
  const x = after([A, B, D]);
  eq([x.amount, x.cardDays, x.pays, x.day], [651000, ['2026-12-10', '2026-12-11', '2027-01-15'], ['2026-12-10', '2027-01-10'], '2027-01-15']);
  eq(x.laterCardDays.map(l => l.day).sort(), ['2027-01-10', '2027-01-11']);
});
t('the same with rent 70,000 on the 12th: both rents by 15 Jan are taken, 511,000', () => {
  const x = after([A, B, D], { bills: [rent(70000, 12)] }); eq([x.amount, x.billsTaken], [511000, 2]);
});
t('weekly pay of 70,000 from 27 Nov: 168 + 210 - 12 - 54 - 23 = 289,000, three pays in it (it read 226,000 with one card)', () => {
  const x = after([A, B, C], { pay: { key: 'pay1', name: 'Pay', bank: 'bank1', amount: 70000, every: 'weeks', n: 1, start: '2026-11-27', shift: 'none', startsPeriod: true } });
  eq([x.amount, x.pays], [289000, ['2026-11-27', '2026-12-04', '2026-12-11']]);
});
t('paid twice a month (150,000 on the 10th and 25th), cards A and C: 402,000 after 27 Nov and 10 Dec, pays 25 Nov and 10 Dec', () => {
  const x = after([A, C], { pay: { key: 'pay1', name: 'Pay', bank: 'bank1', amount: 150000, every: 'month', days: [10, 25], shift: 'none', startsPeriod: true } });
  eq([x.amount, x.cardDays, x.pays], [402000, ['2026-11-27', '2026-12-10'], ['2026-11-25', '2026-12-10']]);
});
t('the days and the cards named are the same whichever order the cards were typed in', () => {
  const x = after([A, B, C]), y = after([C, B, A]), z = after([B, C, A]);
  eq([y.cardDays, y.names, y.amount], [x.cardDays, x.names, x.amount]); eq([z.cardDays, z.names, z.amount], [x.cardDays, x.names, x.amount]);
});
// [qc-numbers monthrule2 blocker 4, coordinator 26 Nov 07:57] close days not sure: the words say "It counts everything
// on the cards now", so a new spend on a card whose payment is overdue is in the figure too, taken with the overdue
// payment today. Seen 28 Nov, nothing ticked, Card C 12,000 overdue (27 Nov) and a new 5,000 on Card C on 28 Nov:
//   168,000 - 12,000 - 5,000 (today) + 300,000 (10 Dec) - 54,000 - 23,000 = 374,000. Before the fix 379,000 (the 5,000 left out).
t('an overdue card with a new spend: everything on it is counted today, 374,000', () => {
  const x = after([A, B, C], { seen: '2026-11-28', spends: [{ card: 'Card C', day: '2026-11-28', a: 5000 }] });
  eq([x.amount, x.cardDays, x.ifAllTaken], [374000, ['2026-11-28', '2026-12-10', '2026-12-11'], true]);
});
t('a new spend never raises the figure, and with no overdue payment it is in the next payment as before', () => {
  const x = after([A, B, C], { spends: [{ card: 'Card A', day: '2026-11-24', a: 5000 }] });
  eq(x.amount, 374000);
});
done('bank_after_cards.test.js');
