// Stage 2 slice S1 (STAGE2_PLAN 2.1 and its corrections 5 and 5'): "If no more pay came, your money lasts about N
// weeks". lookahead(book, day, { runway: true }) gives res.runway: every future pay left out, transfers in from your own
// accounts kept (they are not income), each line and Free to spend by the day at the step in force (never a `once`),
// converted from its own `per` by the units rule (a per-pay amount uses the pay's pays in that year), no "left this
// period" at the start, goal set-asides per pay left out, goal money kept in the bank taken off and named. The headline
// is the first day the bank ends under its minimum; with several accounts, the one that runs out first is named.
// Made-up yen, worked by hand below. Every date is a whole day; rent has no weekend rule so it lands on the 27th.
'use strict';
const path = require('path');
const { t, done, eq, ok } = require('./t.js');
const { lookahead } = require('../lookahead.js');
const B = require('../build_book.js'), I = require('../ids.js');

const DAY = '2026-11-24', TOLD = '2026-11-24T10:00:00+09:00';
function make(o = {}) {
  const ans = {
    day: DAY, told: TOLD, currency: 'JPY', country: 'JP',
    banks: [{ key: 'b', name: 'Main bank', amount: 300000, min: o.min }].concat(o.banks || []),
    pays: o.noPay ? [] : [o.pay || { key: 'p', name: 'Main job', bank: 'b', amount: 250000, day: 10, shift: 'after', startsPeriod: true }],
    bills: [{ key: 'rent', name: 'Rent', from: 'b', amount: 90000, day: 27, shift: 'none' }].concat(o.bills || []),
    free: o.free == null ? 73000 : o.free
  };
  const r = B.buildBook(ans, { newId: I.idMaker('rw7k3q') });
  return r;
}
const rw = (book, day) => lookahead(book, day || DAY, { runway: true }).runway;
const total = parts => parts.reduce((s, p) => s + p.amount, 0);

// 2.1: 300,000; rent 90,000 on the 27th; Free to spend 73,000 a pay, pay monthly on the 10th: 73,000 x 12 / 365 =
// 2,400 a day (no month's rest). 25 to 27 Nov 7,200, rent: 202,800. 28 Nov to 27 Dec 72,000, rent: 40,800. 17 more
// days: 0 at the end of 13 Jan, under it on 14 Jan: 51 days, 7 weeks.
t('2.1: 300,000, rent 90,000 on the 27th, 2,400 a day: under zero on 14 Jan, 51 days, about 7 weeks', () => {
  const { book, ids } = make();
  const r = rw(book);
  eq([r.weeks, r.days, r.day, r.account, r.several, r.minimum], [7, 51, '2027-01-14', ids.b, false, 0]);
  eq(r.parts.map(p => [p.label, p.amount]), [['Main bank today', 300000], ['Rent 27 Nov', -90000], ['Rent 27 Dec', -90000], ['Free to spend, 51 days', -122400], ['minimum', 0]]);
  eq(r.total, -2400);
  eq(total(r.parts), r.total);
});
// With a minimum of 40,800: 40,800 at the end of 27 Dec is not under it; 28 Dec 38,400 is: 34 days, 4 weeks.
t('2.1: with a minimum of 40,800, under it on 28 Dec: 34 days, about 4 weeks (the first day under the minimum, not zero)', () => {
  const r = rw(make({ min: 40800 }).book);
  eq([r.weeks, r.days, r.day, r.minimum], [4, 34, '2026-12-28', 40800]);
  eq(r.parts.map(p => p.amount), [300000, -90000, -90000, -81600, -40800]);
  eq(r.total, -2400);
  eq(total(r.parts), r.total);
});
t('the option is off by default: no runway in the result', () => {
  eq(lookahead(make().book, DAY).runway, undefined);
});
t('the same book with and without the pay on the 10th gives the same weeks', () => {
  const a = rw(make().book), b = rw(make({ noPay: true }).book);
  const noPay = make().book; noPay.schedules = noPay.schedules.filter(s => s.kind !== 'income');
  const c = rw(noPay);
  eq([b.weeks, b.day, c.weeks, c.day], [a.weeks, a.day, a.weeks, a.day]);
  eq(c.parts, a.parts);
});
t('the same weeks on later days of the period: what was spent this period is not taken again (no "left this period")', () => {
  const { book } = make();
  const r = rw(book, '2026-11-25');
  ok(!r.parts.some(p => /left this period/.test(p.label)), JSON.stringify(r.parts));
  eq(total(r.parts), r.total);
  // 25 Nov: still 300,000; 26 and 27 Nov 4,800, rent: 205,200 at the end of 27 Nov, one day more than from 24 Nov:
  // under on 15 Jan, 51 days, 7 weeks
  eq([r.day, r.days, r.weeks], ['2027-01-15', 51, 7]);
});
// The same book in nine orders gives the same runway (LESSONS lesson 4 addendum).
t('the same book in nine orders of its events gives the same runway', () => {
  const { book } = make({ min: 40800 });
  const want = JSON.stringify(rw(book));
  const shuffle = seed => l => { let s = seed; const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const orders = [l => l, l => l.sort((x, y) => (x.id < y.id ? -1 : 1)), l => l.reverse()].concat([1, 7, 42, 99, 1234, 31337].map(shuffle));
  eq(orders.length, 9);
  for (const f of orders) eq(JSON.stringify(rw(Object.assign({}, book, { events: f(book.events.slice()), accounts: f(book.accounts.slice()), schedules: f(book.schedules.slice()) }))), want);
});
// A transfer in from your own savings is not income: it stays. Savings 100,000 (not spent from), 50,000 to the bank
// on 1 Dec. 0 at the end of 13 Jan becomes 50,000; 14 to 26 Jan 31,200: 18,800; 27 Jan 2,400 and rent 90,000: under
// on 27 Jan, 64 days, 9 weeks.
t('a transfer in from your own savings is not income: it is kept (under on 27 Jan, 64 days, 9 weeks)', () => {
  const { book, ids } = make({ banks: [{ key: 's', name: 'Savings', amount: 100000 }] });
  book.accounts.find(a => a.id === ids.s).spendFrom = false;
  book.schedules.push({ id: I.idMaker('rw7k3q')() + 'x', kind: 'transfer', name: 'To bank', acct: ids.s, acct2: ids.b, cur: 'JPY', shift: 'none',
    rules: [{ from: null, rule: { every: 'once', date: '2026-12-01' } }], steps: [{ from: null, amount: 50000 }], told: TOLD, at: TOLD, by: 'rw7k3q' });
  const r = rw(book);
  ok(r.parts.some(p => p.amount === 50000), JSON.stringify(r.parts));
  eq([r.day, r.days, r.weeks, r.account, r.several], ['2027-01-27', 64, 9, ids.b, false]);
});
// Several accounts: an e-wallet with 4,000 and a phone bill of 5,000 on 1 Dec goes under zero on 1 Dec (7 days): it is
// the one named, before the bank's 14 Jan.
t('several accounts: the one that runs out first is named', () => {
  const { book, ids } = make({ banks: [{ key: 'w', name: 'E-wallet', type: 'ewallet', amount: 4000 }], bills: [{ key: 'ph', name: 'Phone', from: 'w', amount: 5000, day: 1, shift: 'none' }] });
  const r = rw(book);
  eq([r.account, r.several, r.day, r.days, r.weeks], [ids.w, true, '2026-12-01', 7, 1]);
  eq(r.accounts[ids.b].day, '2027-01-14');
  eq(r.parts.map(p => p.amount), [4000, -5000, 0]);
});
// A `once` override of this period's (and the next period's) Free to spend is never used: the step in force is.
t('a once override of Free to spend is not used: the step in force is (still 14 Jan)', () => {
  const { book, ids } = make();
  book.plan.shares[0].once = { [I.occName(ids.p, '2026-11-10')]: { free: 10000, at: TOLD, by: 'rw7k3q' }, [I.occName(ids.p, '2026-12-10')]: { free: 5000, at: TOLD, by: 'rw7k3q' } };
  const r = rw(book);
  eq([r.day, r.weeks], ['2027-01-14', 7]);
});
// A step from 1 Jan: 109,500 a pay (3,600 a day). End of 31 Dec: 40,800 - 4 x 2,400 = 31,200; 1 to 8 Jan 28,800:
// 2,400 at the end of 8 Jan, under on 9 Jan: 46 days, 6 weeks.
t('a step from 1 Jan counts from 1 Jan by the day (under on 9 Jan, 46 days)', () => {
  const { book } = make();
  book.plan.shares.push(Object.assign({}, book.plan.shares[0], { id: book.plan.shares[0].id + 'b', from: '2027-01-01', free: 109500 }));
  const r = rw(book);
  eq([r.day, r.days, r.weeks], ['2027-01-09', 46, 6]);
});
// Goal set-asides per pay stop when pay stops: left out. A goal and an emergency place, each 20,000 a pay: the same 14
// Jan; and no place carries a runway figure.
t('goal set-asides per pay are left out, and no place (the emergency one too) carries a runway figure', () => {
  const { book } = make();
  book.places.push({ id: 'pl' + 1, name: 'Trip', kind: 'goal', target: 200000, told: TOLD, at: TOLD, by: 'rw7k3q' },
    { id: 'pl' + 2, name: 'Emergency fund', kind: 'emergency', emergency: true, target: 500000, told: TOLD, at: TOLD, by: 'rw7k3q' });
  book.plan.shares[0].goals = { pl1: 20000, pl2: 20000 };
  const res = lookahead(book, DAY, { runway: true });
  eq([res.runway.day, res.runway.weeks], ['2027-01-14', 7]);
  for (const id in res.places) ok(!('runway' in res.places[id]) && !('runwayWeeks' in res.places[id]), id);
});
// Pay every two weeks from Fri 20 Nov 2026, Free to spend 30,000 a pay. 2026 holds 26 such pays (2 Jan to 18 Dec),
// 2027 holds 27 (1 Jan to 31 Dec). 2026: 780,000 a year, 2,136 a day, the rest on the month's last day: November
// 64,109 - 30 x 2,136 = 29, December 66,246 - 31 x 2,136 = 30. 2027: 810,000, 2,219 a day.
// 25 to 30 Nov 6 x 2,136 + 29 = 12,845, rent: 197,155 at the end of November. December 66,246 and rent: 40,909.
// January: 40,909 - 18 x 2,219 = 967 at the end of 18 Jan, under on 19 Jan: 56 days, 8 weeks.
// (Read as a month, 30,000 x 12 / 365 = 986 a day, it would last months longer: version one's mistake.)
t('pay every two weeks: a per-pay Free to spend uses the pays in each year (26, then 27): under on 19 Jan, 56 days, 8 weeks', () => {
  const { book } = make({ free: 30000, pay: { key: 'p', name: 'Main job', bank: 'b', amount: 120000, every: 'weeks', n: 2, start: '2026-11-20', shift: 'before', startsPeriod: true } });
  const r = rw(book);
  eq([r.day, r.days, r.weeks], ['2027-01-19', 56, 8]);
  eq(r.parts.find(p => /Free to spend/.test(p.label)).amount, -(12845 + 66246 + 19 * 2219));
  eq(total(r.parts), r.total);
});
// A budget line a week (7,000) beside Free to spend: 1,000 a day more. 3,400 a day: 25 to 27 Nov 10,200, rent:
// 199,800. 30 days 102,000 and rent: 7,800 at the end of 27 Dec; 28 Dec 4,400, 29 Dec 1,000, 30 Dec under: 36 days.
t('a weekly line counts a seventh a day beside Free to spend (under on 30 Dec, 36 days, 5 weeks)', () => {
  const { book } = make();
  book.plan.budgets.push({ id: 'bl1', name: 'Food', place: 'free', cur: 'JPY', per: 'week', from: '2026-11-25', steps: [{ from: null, amount: 7000 }], told: TOLD, at: TOLD, by: 'rw7k3q' });
  const r = rw(book);
  eq([r.day, r.days, r.weeks], ['2026-12-30', 36, 5]);
  eq(total(r.parts), r.total);
});
t('no Free to spend and no lines: no runway (nothing says how fast the money goes)', () => {
  const { book } = make();
  book.plan.shares = [];
  eq(rw(book), null);
});
done(path.basename(__filename));
