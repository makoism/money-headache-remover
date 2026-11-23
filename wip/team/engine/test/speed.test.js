'use strict';
// SCHEMA_V3 section 10 [D8]: a copy with 30,000 events must stay quick. This builds a made-up copy (about four years of
// daily spending on a bank, a card and cash, monthly pay and bills, a weekly check-in) and times one look ahead.
// The page's own speed test runs it under 4x CPU slowdown; here the budget is 1,000 ms on this machine.
const { t, done, ok } = require('./t.js');
const { lookahead } = require('../lookahead.js');
const D = require('../dates.js');

function bigBook(n) {
  const start = D.dayNum('2023-01-01'), events = [];
  const tz = '+09:00';
  events.push({ id: 'o:b', k: 'open', acct: 'b', date: '2023-01-01', a: 500000, told: '2023-01-01T09:00' + tz, grp: 's' });
  events.push({ id: 'c:b', k: 'check', acct: 'b', date: '2023-01-01', a: 500000, told: '2023-01-01T09:00' + tz, grp: 's' });
  events.push({ id: 'o:c', k: 'open', acct: 'c', date: '2023-01-01', a: 0, told: '2023-01-01T09:00' + tz, grp: 's' });
  events.push({ id: 'c:c', k: 'check', acct: 'c', date: '2023-01-01', a: 0, told: '2023-01-01T09:00' + tz, grp: 's' });
  events.push({ id: 'o:w', k: 'open', acct: 'w', date: '2023-01-01', a: 20000, told: '2023-01-01T09:00' + tz, grp: 's' });
  events.push({ id: 'c:w', k: 'check', acct: 'w', date: '2023-01-01', a: 20000, told: '2023-01-01T09:00' + tz, grp: 's' });
  let i = 0;
  for (let d = start + 1; events.length < n; d++) {
    const ds = D.dayStr(d);
    const [y, m, dd] = D.ymdOf(d);
    for (const [acct, a] of [['b', 1200], ['c', 2500], ['w', 800], ['b', 600], ['c', 900], ['w', 300], ['b', 450]])
      events.push({ id: 'e' + (++i), k: 'spend', acct, a, line: 'free', date: ds, told: ds + 'T20:00' + tz });
    if (dd === 25) events.push({ id: 'set:pay@' + ds, k: 'in', sub: 'pay', acct: 'b', a: 350000, date: ds, told: ds + 'T21:00' + tz, settles: [{ s: 'pay', due: ds }] });
    if (dd === 27) events.push({ id: 'set:rent@' + ds, k: 'spend', acct: 'b', a: 90000, date: ds, told: ds + 'T21:00' + tz, settles: [{ s: 'rent', due: ds }] });
    if (D.weekday(d) === 0) events.push({ id: 'k' + (++i), k: 'check', acct: 'b', a: 300000, date: ds, told: ds + 'T22:00' + tz });
    if (dd === 10 && m) events.push({ id: 'r' + (++i), k: 'repay', acct: 'b', acct2: 'c', a: 70000, a2: 70000, date: ds, told: ds + 'T21:00' + tz });
  }
  const last = events[events.length - 1].date;
  return { asOf: last, book: { v: 3, home: { curs: [{ from: '2023-01-01', cur: 'JPY' }], country: { v: 'JP' }, main: { v: { acct: 'b', min: { a: 10000, cur: 'JPY' } } } },
    accounts: [{ id: 'b', name: 'Bank', type: 'bank', cur: 'JPY' }, { id: 'w', name: 'Cash', type: 'cash', cur: 'JPY' },
      { id: 'c', name: 'Card', type: 'card', cur: 'JPY', cutDay: 15, payDay: 10, payMonths: 1, shift: 'after', payFrom: 'b' }],
    schedules: [{ id: 'pay', kind: 'income', name: 'Pay', acct: 'b', cur: 'JPY', startsPeriod: true, shift: 'before', rules: [{ rule: { every: 'month', days: [25] } }], steps: [{ amount: 350000 }] },
      { id: 'rent', kind: 'bill', name: 'Rent', acct: 'b', cur: 'JPY', shift: 'after', rules: [{ rule: { every: 'month', days: [27] } }], steps: [{ amount: 90000 }] }],
    plan: { shares: [{ id: 'sh', cur: 'JPY', per: { free: 'month' }, free: 100000 }], budgets: [] },
    events } };
}

t('a 30,000-event copy is looked ahead within its budget', () => {
  const { book, asOf } = bigBook(30000);
  const t0 = process.hrtime.bigint();
  const r = lookahead(book, asOf, { deviceOffset: '+09:00' });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`speed: ${book.events.length} events, one look ahead in ${Math.round(ms)} ms`);
  ok(typeof r.accounts.b.bank === 'number');
  ok(ms < 1000, `took ${Math.round(ms)} ms`);
});
done('speed');
