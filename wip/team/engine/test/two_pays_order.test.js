'use strict';
// Two pays that both start periods (an old pay still on the book beside a new one): which one starts the periods must
// never depend on the order the schedules arrive in (LESSONS, "an order nobody owned"; SCHEMA_V3 2.3: a list's order
// means nothing). Found by qc-foundation on the end-of-period plan, 24 Nov 2026: lookahead.js picks with
// schedules.find, so swapping the two schedules gave different periods, past and present.
// Made-up yen: a bank at 300,000, a pay of 300,000 on the 10th and a second pay of 120,000 on the 25th, both marked as
// starting the period, seen on 20 Dec 2026.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), P = require('../periods.js'), IDS = require('../ids.js');

function book() {
  const newId = IDS.idMaker('k3f9aq');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true },
      { key: 'pay2', name: 'Second pay', bank: 'bank1', amount: 120000, every: 'month', day: 25, shift: 'none', startsPeriod: false }],
    cards: [], bills: [], free: 60000 }, { newId });
  const b = out.book || out;
  /* both marked, as a book holds them once an old pay and a new one live side by side */
  b.schedules.filter(s => s.kind === 'income').forEach(s => { s.startsPeriod = true; });
  return b;
}
const swapped = b => Object.assign({}, b, { schedules: b.schedules.slice().reverse() });
const shape = (b, day) => { const p = P.periods(b, day); return { now: [p.current.start, p.current.end], past: p.past.map(x => [x.start, x.end]) }; };

t('the book holds two pays that start periods', () => {
  eq(book().schedules.filter(s => s.kind === 'income' && s.startsPeriod).length, 2);
});
for (const day of ['2026-12-05', '2026-12-20', '2027-01-12']) {
  t(`on ${day} the periods are the same whichever schedule comes first in the list`, () => {
    const b = book();
    eq(shape(swapped(b), day), shape(b, day));
  });
  t(`on ${day} safe to spend is the same whichever schedule comes first`, () => {
    const b = book();
    eq(LA.lookahead(swapped(b), day).safeToSpend.headline, LA.lookahead(b, day).safeToSpend.headline);
  });
}
done('two_pays_order.test.js');
