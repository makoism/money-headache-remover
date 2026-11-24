// Stage 2 slice S6 (STAGE2_PLAN 2.4 step 2, corrections 2 and 2'): the rate from the person's own conversions. A
// `convert` (or a two-currency `transfer` or `repay`, a2 in the other currency) is a rate worked out from the event each
// time, never saved: 1 <what left> is a2 / a <what arrived>, as an exact ratio of whole numbers, with each currency's
// minor-unit exponent. It takes part in the rate in force like a typed one: dated by the event, ties by `at`, then
// id. `shown` is the rate in the asked direction rounded for display only (2 places from 1 up, else 4 significant
// digits, half up); the Total always uses the exact ratio. Made-up amounts, worked by hand beside each check.
'use strict';
const path = require('path');
const { t, done, eq } = require('./t.js');
const U = require('../units.js'), Lg = require('../ledger.js');
const { lookahead } = require('../lookahead.js');
const B = require('../build_book.js'), I = require('../ids.js');

const TOLD = '2026-11-24T10:00:00+09:00';
function walkBook() {
  const { book, ids } = B.buildBook({ day: '2026-11-24', told: TOLD, currency: 'JPY', country: 'JP',
    banks: [{ key: 'b', name: 'Main bank', amount: 286000 }, { key: 'u', name: 'Dollar account', amount: 100000, cur: 'USD' }] }, { newId: I.idMaker('cv6p4z') });
  book.rates = [{ id: 'cv6p4z-r1', from: '2026-11-24', cur: 'USD', to: 'JPY', rate: '150.25', src: 'typed', told: TOLD, at: TOLD, by: 'cv6p4z' }];
  return { book, ids };
}
const AT1 = '2026-12-01T09:00:00+09:00';
const conv = (ids, o = {}) => Object.assign({ id: 'cv6p4z-e1', k: 'convert', date: '2026-12-01', acct: ids.b, acct2: ids.u, a: 150000, a2: 99000, told: AT1, at: AT1, by: 'cv6p4z' }, o);

t('an exact ratio converts exactly: 199,000 cents at 1 USD = 15,000,000 / 99,000 yen is 301,515.15, so 301,515', () => {
  eq(U.convert(199000, 'USD', 'JPY', '15000000/99000'), 301515);
  eq(U.convert(199000, 'USD', 'JPY', '99000/15000000', true), 301515);
});
t('the rate shown is rounded for display only: 151.52 (2 places), 0.006600 (4 significant digits)', () => {
  eq([U.shownRate('15000000/99000'), U.shownRate('99000/15000000'), U.shownRate('150.25'), U.shownRate('1/3')], ['151.52', '0.006600', '150.25', '0.3333']);
});
// 1 Dec: 150,000 yen out of Main bank, $990.00 into the Dollar account. 1 JPY = 99,000 / 15,000,000 USD, read inverted
// for USD into JPY: 1 USD = 151.5151... JPY, shown 151.52. Main bank 136,000, Dollar account 199,000 cents: 301,515.
t('1 Dec, a conversion of 150,000 yen into $990.00: its rate is in force from 1 Dec, from your own conversion', () => {
  const { book, ids } = walkBook();
  book.events.push(conv(ids));
  const r = Lg.rateOn(book, 'USD', 'JPY', '2026-12-01');
  eq([r.src, r.from, r.inverse, r.shown], ['convert', '2026-12-01', true, '151.52']);
  const res = lookahead(book, '2026-12-01');
  eq([res.accounts[ids.b].bank, res.accounts[ids.u].bank], [136000, 199000]);
  eq(res.total.inHome.amount, 136000 + 301515);
  eq(res.total.inHome.parts[0].converted, 301515);   // the exact ratio; 151.52 would give 301,525
  eq([res.total.inHome.parts[0].src, res.total.inHome.parts[0].shown], ['convert', '151.52']);
});
t('30 Nov is still 24 Nov\'s typed 150.25: 286,000 + 150,250 = 436,250', () => {
  const { book, ids } = walkBook();
  book.events.push(conv(ids));
  const x = lookahead(book, '2026-11-30').total.inHome;
  eq([x.amount, x.parts[0].src, x.parts[0].shown], [436250, 'typed', '150.25']);
});
t('a rate typed on 2 Dec takes over from 2 Dec; on 1 Dec the conversion stands', () => {
  const { book, ids } = walkBook();
  book.events.push(conv(ids));
  book.rates.push({ id: 'cv6p4z-r2', from: '2026-12-02', cur: 'USD', to: 'JPY', rate: '152', src: 'typed', told: AT1, at: AT1, by: 'cv6p4z' });
  eq([Lg.rateOn(book, 'USD', 'JPY', '2026-12-01').src, Lg.rateOn(book, 'USD', 'JPY', '2026-12-02').src], ['convert', 'typed']);
});
t('the same day: a rate typed after the conversion wins; typed before it, the conversion wins', () => {
  const { book, ids } = walkBook();
  book.events.push(conv(ids));
  const typed = at => ({ id: 'cv6p4z-r3', from: '2026-12-01', cur: 'USD', to: 'JPY', rate: '152', src: 'typed', told: at, at, by: 'cv6p4z' });
  book.rates.push(typed('2026-12-01T10:00:00+09:00'));
  eq(Lg.rateOn(book, 'USD', 'JPY', '2026-12-01').src, 'typed');
  book.rates[1] = typed('2026-12-01T08:00:00+09:00');
  eq(Lg.rateOn(book, 'USD', 'JPY', '2026-12-01').src, 'convert');
});
t('a two-currency transfer counts; a fee between two yen accounts, a gone conversion and a zero amount do not', () => {
  const { book, ids } = walkBook();
  book.events.push(conv(ids, { k: 'transfer', a2: 100000 }));   // 150,000 yen for $1,000.00: 150 exactly
  eq(Lg.rateOn(book, 'USD', 'JPY', '2026-12-01').shown, '150.00');
  const { book: b2, ids: i2 } = walkBook();
  b2.events.push(conv(i2, { gone: '2026-12-01' }), conv(i2, { id: 'cv6p4z-e2', a2: 0 }));
  eq(Lg.rateOn(b2, 'USD', 'JPY', '2026-12-01').src, 'typed');
});
t('the conversion in nine orders of the events gives the same Total', () => {
  const { book, ids } = walkBook();
  book.events.push(conv(ids), conv(ids, { id: 'cv6p4z-e3', date: '2026-11-28', a: 30000, a2: 20000, told: '2026-11-28T09:00:00+09:00', at: '2026-11-28T09:00:00+09:00' }));
  const want = JSON.stringify(lookahead(book, '2026-12-03').total);
  const rev = Object.assign({}, book, { events: book.events.slice().reverse() });
  eq(JSON.stringify(lookahead(rev, '2026-12-03').total), want);
  for (let s = 1; s <= 8; s++) {
    const ev = book.events.slice(); for (let i = ev.length - 1; i > 0; i--) { const j = (i * 7 + s * 13) % (i + 1); [ev[i], ev[j]] = [ev[j], ev[i]]; }
    eq(JSON.stringify(lookahead(Object.assign({}, book, { events: ev }), '2026-12-03').total), want);
  }
});
done(path.basename(__filename));
