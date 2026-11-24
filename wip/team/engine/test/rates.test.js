// Stage 2 slice S5 (STAGE2_PLAN 2.4 step 1, corrections 2, 3 and 2'): an account in another currency, a dated rate the
// person types, and the Total in the home currency. The shape gains one shared list (SCHEMA_V3 section 2.1):
//   rates: [ { id, from, cur, to, rate, src, told, at, by, gone } ]   1 `cur` is `rate` `to` from day `from`
// `rate` is a decimal string kept at full precision and rounded only for display. The rate in force for a pair on a
// day is the latest by `from` (on or before the day) in either direction, inverted when only the other direction is
// there; ties by `from`, then `at`, then id; a `gone` record is never read. Converting works in whole numbers with each
// currency's minor-unit exponent (units.js) and rounds half up (half away from zero below zero).
// Made-up amounts; worked by hand beside each check.
'use strict';
const path = require('path');
const { t, done, eq, ok, throws } = require('./t.js');
const U = require('../units.js'), Lg = require('../ledger.js');
const { lookahead } = require('../lookahead.js');
const B = require('../build_book.js'), I = require('../ids.js');
const SY = require('../sync.js');

const TOLD = '2026-11-24T10:00:00+09:00';
const rate = (id, from, cur, to, r, o = {}) => Object.assign({ id, from, cur, to, rate: r, src: 'typed', told: o.at || TOLD, at: o.at || TOLD, by: 'rt5m2x' }, o);

// ----- converting -----
t('USD 1,000.00 (100,000 cents) at 150.25 is 150,250 yen: 100,000 x 15,025 / (100 x 100)', () => eq(U.convert(100000, 'USD', 'JPY', '150.25'), 150250));
t('the inverse: 100,000 cents read through a JPY to USD rate of 0.0066555740 is 150,250 yen (150,250.0007 rounded)', () => eq(U.convert(100000, 'USD', 'JPY', '0.0066555740', true), 150250));
t('yen to dollars: 150,250 yen at 0.0066555740 is 99,999.99985 cents, so 100,000 cents', () => eq(U.convert(150250, 'JPY', 'USD', '0.0066555740'), 100000));
t('half up: 1 cent at 150 is 1.5 yen, so 2; -1 cent is -2 (half away from zero); 1 cent at 149.9 is 1.499, so 1', () => {
  eq([U.convert(1, 'USD', 'JPY', '150'), U.convert(-1, 'USD', 'JPY', '150'), U.convert(1, 'USD', 'JPY', '149.9')], [2, -2, 1]);
});
t('three decimals: 1 dinar (1,000 fils) at 490.5 is 490.5 yen, so 491; pesos to yen: 1,000.00 PHP (100,000 centavos) at 2.6 is 2,600 yen', () => {
  eq([U.convert(1000, 'KWD', 'JPY', '490.5'), U.convert(100000, 'PHP', 'JPY', '2.6')], [491, 2600]);
});
t('full precision: 100,000 cents at 151.515151515 is 151,515 yen (151.52 would give 151,520)', () => {
  eq([U.convert(100000, 'USD', 'JPY', '151.515151515'), U.convert(100000, 'USD', 'JPY', '151.52')], [151515, 151520]);
});
t('a rate that is not a positive decimal is refused', () => {
  for (const r of ['', 'abc', '0', '-150', '1e3', '150,25', null]) throws(() => U.convert(100, 'USD', 'JPY', r), /rate/);
});
t('the same currency needs no rate', () => eq(U.convert(1234, 'JPY', 'JPY', null), 1234));

// ----- the rate in force -----
const book0 = rates => ({ v: 3, rates });
t('the latest from on or before the day; before the first, none', () => {
  const b = book0([rate('r1', '2026-11-24', 'USD', 'JPY', '150.25'), rate('r2', '2026-12-01', 'USD', 'JPY', '151.52')]);
  eq(Lg.rateOn(b, 'USD', 'JPY', '2026-11-23'), null);
  eq([Lg.rateOn(b, 'USD', 'JPY', '2026-11-30').rate, Lg.rateOn(b, 'USD', 'JPY', '2026-12-01').rate], ['150.25', '151.52']);
  const r = Lg.rateOn(b, 'USD', 'JPY', '2026-12-05');
  eq([r.id, r.from, r.src, r.inverse], ['r2', '2026-12-01', 'typed', false]);
});
t('either direction: a later JPY to USD rate wins and is read inverted', () => {
  const b = book0([rate('r1', '2026-11-24', 'USD', 'JPY', '150.25'), rate('r2', '2026-12-01', 'JPY', 'USD', '0.0066')]);
  const r = Lg.rateOn(b, 'USD', 'JPY', '2026-12-02');
  eq([r.id, r.inverse], ['r2', true]);
  eq(Lg.rateOn(b, 'JPY', 'USD', '2026-11-25').inverse, true);
});
t('a tie on from goes to the later at, then the larger id; a gone record is never read; other pairs are ignored', () => {
  const b = book0([rate('r1', '2026-11-24', 'USD', 'JPY', '150', { at: '2026-11-24T12:00:00+09:00' }), rate('r2', '2026-11-24', 'USD', 'JPY', '151', { at: '2026-11-24T11:00:00+09:00' })]);
  eq(Lg.rateOn(b, 'USD', 'JPY', '2026-11-24').id, 'r1');
  b.rates.push(rate('r3', '2026-11-24', 'JPY', 'USD', '0.0066', { at: '2026-11-24T12:00:00+09:00' }));
  eq(Lg.rateOn(b, 'USD', 'JPY', '2026-11-24').id, 'r3');
  b.rates.push(rate('r4', '2026-11-25', 'USD', 'JPY', '152', { gone: true }), rate('r5', '2026-11-25', 'EUR', 'JPY', '160'));
  eq(Lg.rateOn(b, 'USD', 'JPY', '2026-11-26').id, 'r3');
});
t('the same pair in nine orders gives the same rate', () => {
  const list = [rate('r1', '2026-11-24', 'USD', 'JPY', '150'), rate('r2', '2026-11-24', 'USD', 'JPY', '151'), rate('r3', '2026-11-20', 'JPY', 'USD', '0.0066'), rate('r4', '2026-11-24', 'JPY', 'USD', '0.0067', { gone: true })];
  const want = Lg.rateOn(book0(list), 'USD', 'JPY', '2026-11-30').id;
  eq(want, 'r2');
  const perms = [[0, 1, 2, 3], [3, 2, 1, 0], [1, 0, 3, 2], [2, 3, 0, 1], [0, 2, 1, 3], [3, 1, 2, 0], [1, 3, 0, 2], [2, 0, 3, 1], [0, 3, 2, 1]];
  for (const p of perms) eq(Lg.rateOn(book0(p.map(i => list[i])), 'USD', 'JPY', '2026-11-30').id, want);
});

// ----- the Total in the home currency (2.4 walk to 24 Nov, then 1 Dec) -----
function walkBook() {
  const { book, ids } = B.buildBook({ day: '2026-11-24', told: TOLD, currency: 'JPY', country: 'JP',
    banks: [{ key: 'b', name: 'Main bank', amount: 286000 }, { key: 'u', name: 'Dollar account', amount: 100000, cur: 'USD' }] }, { newId: I.idMaker('rt5m2x') });
  return { book, ids };
}
t('setup can open an account in another currency: its amount is in its own minor units', () => {
  const { book, ids } = walkBook();
  eq(book.accounts.find(a => a.id === ids.u).cur, 'USD');
  const r = lookahead(book, '2026-11-24');
  eq([r.accounts[ids.u].bank, r.accounts[ids.u].currency, r.total.amount, r.total.beside], [100000, 'USD', 286000, { USD: 100000 }]);
});
t('no rate yet: the Total in yen counts the yen and names the dollars it could not count', () => {
  const { book, ids } = walkBook();
  const x = lookahead(book, '2026-11-24').total.inHome;
  eq([x.amount, x.parts, x.missing], [286000, [], [{ account: ids.u, currency: 'USD', amount: 100000 }]]);
});
t('24 Nov, 150.25 typed: Total 286,000 + 150,250 = 436,250, with the rate, its day and who gave it', () => {
  const { book, ids } = walkBook();
  book.rates = [rate('rt5m2x-1', '2026-11-24', 'USD', 'JPY', '150.25')];
  const r = lookahead(book, '2026-11-24'), x = r.total.inHome;
  eq(x.amount, 436250);
  eq(x.parts, [{ account: ids.u, currency: 'USD', amount: 100000, converted: 150250, rate: '150.25', inverse: false, rateFrom: '2026-11-24', src: 'typed', old: false }]);
  eq(x.missing, []);
  eq(r.total.amount, 286000);   // the home figure itself is unchanged
});
t('1 Dec, 151.52 typed from 1 Dec: the Total uses it from 1 Dec; 30 Nov still uses 150.25', () => {
  const { book } = walkBook();
  book.rates = [rate('rt5m2x-1', '2026-11-24', 'USD', 'JPY', '150.25'), rate('rt5m2x-2', '2026-12-01', 'USD', 'JPY', '151.52', { at: '2026-12-01T09:00:00+09:00' })];
  eq([lookahead(book, '2026-11-30').total.inHome.amount, lookahead(book, '2026-12-01').total.inHome.amount], [436250, 437520]);
});
t('a rate more than 30 days old says so: 24 Dec is 30 days (not old), 25 Dec is 31 (old)', () => {
  const { book } = walkBook();
  book.rates = [rate('rt5m2x-1', '2026-11-24', 'USD', 'JPY', '150.25')];
  eq([lookahead(book, '2026-12-24').total.inHome.parts[0].old, lookahead(book, '2026-12-25').total.inHome.parts[0].old], [false, true]);
});
t('no account in another currency: no inHome (nothing to convert)', () => {
  const { book } = B.buildBook({ day: '2026-11-24', told: TOLD, currency: 'JPY', country: 'JP', banks: [{ key: 'b', name: 'Main bank', amount: 286000 }] }, { newId: I.idMaker('rt5m2x') });
  eq(lookahead(book, '2026-11-24').total.inHome, undefined);
});

// ----- the list joins like every list of records (version one sync), and survives a copy -----
t('two devices each typing a rate: the sync keeps both; a rate made gone on one side stays gone', () => {
  const base = { v: 3, rates: [rate('r1', '2026-11-24', 'USD', 'JPY', '150.25')] };
  const mine = JSON.parse(JSON.stringify(base)), theirs = JSON.parse(JSON.stringify(base));
  mine.rates.push(rate('r2', '2026-12-01', 'USD', 'JPY', '151.52', { at: '2026-12-01T09:00:00+09:00' }));
  theirs.rates.push(rate('r3', '2026-12-02', 'EUR', 'JPY', '160', { at: '2026-12-02T09:00:00+09:00' }));
  theirs.rates[0] = Object.assign({}, theirs.rates[0], { gone: true, at: '2026-11-30T09:00:00+09:00' });
  const out = SY.sync(base, mine, theirs);
  eq(out.rates.map(r => [r.id, !!r.gone]), [['r1', true], ['r2', false], ['r3', false]]);
  eq(Lg.rateOn(out, 'USD', 'JPY', '2026-11-30'), null);
});
t('a rate keeps its string through JSON (never a float)', () => {
  const b = JSON.parse(JSON.stringify(book0([rate('r1', '2026-11-24', 'USD', 'JPY', '151.515151515')])));
  eq(typeof b.rates[0].rate, 'string');
  eq(Lg.rateOn(b, 'USD', 'JPY', '2026-11-24').rate, '151.515151515');
});
done(path.basename(__filename));
