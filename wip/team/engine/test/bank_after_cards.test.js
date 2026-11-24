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
function after(cards) {
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 168000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards, bills: [], free: null }, { newId: IDS.idMaker('k3f9aq') });
  const book = out.book || out, r = LA.lookahead(book, '2026-11-24'), bank = book.accounts.find(a => a.type !== 'card').id;
  return r.bankAfterCards[bank];
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
done('bank_after_cards.test.js');
