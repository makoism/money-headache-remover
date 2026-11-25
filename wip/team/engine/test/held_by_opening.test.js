'use strict';
// A record that falls inside the opening bank figure is named, like one inside a later check (S3), so its row on
// Receipts can say the bank figure already has it and never sits unexplained under a "spent" that leaves it out.
// Found by qc-numbers on 25 Nov 2026: set up on 24 Nov, then a 3,000 spend dated 24 Nov whose told time was earlier
// than the setup's (the page's day was held while the clock passed midnight): the bank stayed 300,000, Free to spend
// spent stayed 0, and nothing said why. The same for a spend dated before setup and typed after it.
// Made-up yen: bank 300,000 at setup on 24 Nov 2026, pay 400,000 on the 10th, Free to spend 60,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js'), P = require('../periods.js');
function life(spend) {
  const newId = IDS.idMaker('k3f9aq');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T23:58:00.000+00:00', currency: 'JPY', country: 'JP', banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 400000, every: 'month', day: 10, shift: 'none', startsPeriod: true }], cards: [], bills: [], free: 60000 }, { newId });
  const book = out.book || out, bank = book.accounts[0].id, id = newId();
  book.events.push(Object.assign({ id, k: 'spend', a: 3000, acct: bank, line: 'free', note: 'lunch', src: { type: 'typed' } }, spend));
  return { book, bank, id };
}
t('a spend on the setup day told before the setup is inside the opening figure, and is named so', () => {
  const { book, bank, id } = life({ date: '2026-11-24', told: '2026-11-24T00:03:00.000+00:00' }), r = LA.lookahead(book, '2026-11-24');
  eq([r.accounts[bank].bank, P.periods(book, '2026-11-24').current.free.spent], [300000, 0]);
  eq(r.heldByCheck.filter(h => h.id === id), [{ id, account: bank, check: '2026-11-24' }]);
});
t('a spend dated before setup and typed two days later: the same, named with the setup day', () => {
  const { book, bank, id } = life({ date: '2026-10-01', told: '2026-11-26T09:00:00.000+00:00' }), r = LA.lookahead(book, '2026-11-26');
  eq(r.accounts[bank].bank, 300000);
  eq(r.heldByCheck.filter(h => h.id === id), [{ id, account: bank, check: '2026-11-24' }]);
});
t('a spend on the setup day told after the setup counts, and is not named as held', () => {
  const { book, bank, id } = life({ date: '2026-11-24', told: '2026-11-25T00:03:00.000+00:00' }), r = LA.lookahead(book, '2026-11-25');
  eq([r.accounts[bank].bank, P.periods(book, '2026-11-25').current.free.spent], [297000, 3000]);
  ok(!r.heldByCheck.some(h => h.id === id));
});
done('held_by_opening.test.js');
