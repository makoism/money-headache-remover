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
// The one rule (DECISIONS_ROUND2 BZ2 with CA2): the mark carries its date; the pay holding it on a day has the newest
// entry on or before that day, by `from`, then `at`, then a fixed day, and last the greater id. Never the list's order.
const S = require('../schedules.js');
const pays = b => { const inc = b.schedules.filter(s => s.kind === 'income'); return { first: inc.find(s => s.name === 'Pay'), second: inc.find(s => s.name === 'Second pay') }; };
t('two bare marks (an old book): the greater id holds it, the same in both list orders', () => {
  const b = book(), { first, second } = pays(b), want = String(first.id) > String(second.id) ? first.id : second.id;
  for (const x of [b, swapped(b)]) eq(S.periodHolder(x.schedules, '2026-12-20').id, want);
});
t('a dated move: the second pay holds it from 20 Dec, so the periods follow the first pay before and the second after', () => {
  const b = book(), { first, second } = pays(b);
  first.startsPeriod = true;
  second.startsPeriod = [{ from: '2026-12-20', at: '2026-12-20T09:00:00.000+09:00', by: 'k3f9aq' }];
  for (const x of [b, swapped(b)]) {
    eq([S.periodHolder(x.schedules, '2026-12-19').id, S.periodHolder(x.schedules, '2026-12-20').id, S.periodHolder(x.schedules, '2027-03-01').id], [first.id, second.id, second.id]);
    // before the move the period runs to the first pay's next day, the 10th
    eq(IDS.scheduleOf(LA.lookahead(x, '2026-12-05').period.nextPay.occ), first.id);
  }
  for (const d of ['2026-12-27', '2027-01-12']) eq(shape(swapped(b), d), shape(b, d));
});
t('two moves dated the same day: the one written later (its `at`) holds it; written at the same moment, the greater id', () => {
  const b = book(), { first, second } = pays(b);
  first.startsPeriod = [{ from: '2026-12-20', at: '2026-12-20T09:00:00.000+09:00' }];
  second.startsPeriod = [{ from: '2026-12-20', at: '2026-12-20T09:05:00.000+09:00' }];
  for (const x of [b, swapped(b)]) eq(S.periodHolder(x.schedules, '2026-12-21').id, second.id);
  second.startsPeriod = [{ from: '2026-12-20', at: '2026-12-20T09:00:00.000+09:00' }];
  const want = String(first.id) > String(second.id) ? first.id : second.id;
  for (const x of [b, swapped(b)]) eq(S.periodHolder(x.schedules, '2026-12-21').id, want);
});
t('a job change mid-year, fed in six list orders: the same periods and the same safe to spend every time', () => {
  const b = book(), { second } = pays(b);
  second.startsPeriod = [{ from: '2027-06-01', at: '2027-06-01T09:00:00.000+09:00' }];
  const orders = [x => x, x => x.reverse(), x => x.sort((p, q) => (p.id < q.id ? -1 : 1)), x => x.sort((p, q) => (p.id < q.id ? 1 : -1)), x => x.slice(1).concat(x.slice(0, 1)), x => x.slice(2).concat(x.slice(0, 2))];
  for (const day of ['2027-05-20', '2027-06-02', '2027-07-12']) {
    const want = [shape(b, day), LA.lookahead(b, day).safeToSpend.headline];
    for (const o of orders) { const x = Object.assign({}, b, { schedules: o(b.schedules.slice()), events: o(b.events.slice()) }); eq([shape(x, day), LA.lookahead(x, day).safeToSpend.headline], want); }
  }
});
done('two_pays_order.test.js');
