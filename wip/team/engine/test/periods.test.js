'use strict';
// Past periods built from what happened (engine/periods.js; WIRING_PLAN Q4, slice 2). Every amount made up.
const { t, done, eq, ok } = require('./t.js');
const { lookahead } = require('../lookahead.js');
const { periods } = require('../periods.js');
const { buildBook } = require('../build_book.js');
const { ANSWERS } = require('./mako_madeup.js');

const TZ = '+09:00';
// A bank opened Tue 1 Dec 2026 with 400,000 (Free to spend 50,000 and Food 30,000 typed), pay 250,000 on the 25th
// starting periods, a Rent bill on the 27th.
function base(more) {
  const b = { v: 3, home: { curs: [{ from: '2026-01-01', cur: 'JPY' }], country: { v: 'JP' }, main: { v: { acct: 'bank', min: null } } },
    accounts: [{ id: 'bank', name: 'Bank', type: 'bank', cur: 'JPY' }],
    schedules: [{ id: 'pay', kind: 'income', name: 'Pay', acct: 'bank', cur: 'JPY', startsPeriod: true, shift: 'before', rules: [{ rule: { every: 'month', days: [25] } }], steps: [{ amount: 250000 }] },
      { id: 'rent', kind: 'bill', name: 'Rent', acct: 'bank', cur: 'JPY', shift: 'after', rules: [{ rule: { every: 'month', days: [27] } }], steps: [{ amount: 70000 }] }],
    plan: { shares: [{ id: 'sh', cur: 'JPY', per: { free: 'month' }, free: 50000 }], budgets: [{ id: 'food', name: 'Food', cur: 'JPY', per: 'month', steps: [{ amount: 30000 }] }] },
    events: [
      { id: 'o', k: 'open', acct: 'bank', date: '2026-12-01', a: 400000, told: '2026-12-01T10:00' + TZ, grp: 's', split: { free: 50000, lines: { food: 30000 } } },
      { id: 'c', k: 'check', acct: 'bank', date: '2026-12-01', a: 400000, told: '2026-12-01T10:00' + TZ, grp: 's' },
      { id: 'f1', k: 'spend', acct: 'bank', date: '2026-12-05', a: 5000, line: 'food', told: '2026-12-05T12:00' + TZ },
      // logged late: dated in the first period, told after the pay
      { id: 'f2', k: 'spend', acct: 'bank', date: '2026-12-20', a: 8000, line: 'food', told: '2026-12-27T09:00' + TZ },
      { id: 'set:pay@2026-12-25', k: 'in', sub: 'pay', acct: 'bank', date: '2026-12-25', a: 250000, stream: 'pay', settles: [{ s: 'pay', due: '2026-12-25' }], told: '2026-12-26T19:00' + TZ, grp: 'ci' },
      { id: 'x1', k: 'spend', acct: 'bank', date: '2026-12-26', a: 3000, told: '2026-12-26T12:00' + TZ },
      // the check-in on 26 Dec: the app had 634,000, the bank shows 630,000: a filler of 4,000 over 2 to 26 Dec
      { id: 'c3', k: 'check', acct: 'bank', date: '2026-12-26', a: 630000, told: '2026-12-26T20:00' + TZ, grp: 'ci' },
      { id: 'set:rent@2026-12-27', k: 'spend', acct: 'bank', date: '2026-12-28', a: 70000, settles: [{ s: 'rent', due: '2026-12-27' }], told: '2026-12-28T09:00' + TZ },
    ],
    checkins: [{ id: 'ci', date: '2026-12-26', from: '2026-12-02', told: '2026-12-26T20:00' + TZ, figures: [{ acct: 'bank', check: 'c3', typedA: 630000 }], settled: ['set:pay@2026-12-25'] }] };
  return more ? more(b) || b : b;
}
const opt = { deviceOffset: TZ };

t('a period gone by: its dates, named by its pay [T1]', () => {
  const r = periods(base(), '2027-01-05', opt);
  eq(r.past.length, 1);
  eq([r.past[0].start, r.past[0].end, r.past[0].startsWith], ['2026-11-25', '2026-12-24', 'pay@2026-11-25']);
  eq([r.current.start, r.current.startsWith], ['2026-12-25', 'pay@2026-12-25']);
});
t('a line in a period gone by counts what is dated inside it, a spend logged late too', () => {
  const food = periods(base(), '2027-01-05', opt).past[0].lines.find(l => l.id === 'food');
  // the opening share typed 30,000; 5,000 + 8,000 spent
  eq([food.start, food.spent, food.left], [30000, 13000, 17000]);
});
t('the check-in gap is spending, split by days at the pay [T2, A4]', () => {
  const r = periods(base(), '2027-01-05', opt);
  // 4,000 over 25 days: 23 days (2 to 24 Dec) to the first period, 3,680; the rest, 320, to the second
  eq(r.past[0].free.spent, 3680);
  eq(r.past[0].free.left, 46320);
  eq(r.current.free.spent, 3320);
});
t('the period running now agrees with the look ahead (one engine)', () => {
  const b = base(), r = periods(b, '2027-01-05', opt), la = lookahead(b, '2027-01-05', opt).period;
  eq(r.current.free.left, la.free.left);
  eq(r.current.lines.map(l => [l.id, l.amount, l.left]), la.lines.map(l => [l.id, l.amount, l.left]));
  eq([r.current.start, r.current.end], [la.start, la.end]);
});
t('what happened in each period: money in, bills paid, totals', () => {
  const r = periods(base(), '2027-01-05', opt);
  eq(r.past[0].moneyIn.total, 0);
  eq(r.current.moneyIn.items.map(x => [x.date, x.amount, x.schedule]), [['2026-12-25', 250000, 'pay']]);
  eq(r.current.billsPaid.items.map(x => [x.date, x.amount, x.schedule]), [['2026-12-28', 70000, 'rent']]);
  eq(r.current.billsPaid.total, 70000);
});
t('newest first, and `from` leaves out periods that ended before it', () => {
  const b = base(x => {
    x.events.push({ id: 'set:pay@2027-01-25', k: 'in', sub: 'pay', acct: 'bank', date: '2027-01-25', a: 250000, stream: 'pay', settles: [{ s: 'pay', due: '2027-01-25' }], told: '2027-01-25T19:00' + TZ });
  });
  const r = periods(b, '2027-02-01', opt);
  eq(r.past.map(p => p.start), ['2026-12-25', '2026-11-25']);
  eq(periods(b, '2027-02-01', Object.assign({ from: '2026-12-25' }, opt)).past.map(p => p.start), ['2026-12-25']);
});
t('a period gone by gets its own amount: a once key for its pay [B8]', () => {
  const b = base(x => { x.plan.budgets[0].once = { 'pay@2026-12-25': { amount: 45000, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } };
    x.events.push({ id: 'set:pay@2027-01-25', k: 'in', sub: 'pay', acct: 'bank', date: '2027-01-25', a: 250000, stream: 'pay', settles: [{ s: 'pay', due: '2027-01-25' }], told: '2027-01-25T19:00' + TZ }); });
  const r = periods(b, '2027-02-01', opt);
  eq(r.past[0].lines.find(l => l.id === 'food').amount, 45000);
  eq(r.current.lines.find(l => l.id === 'food').amount, 30000);
});
t('no fixed pay: no periods [B4]', () => {
  const b = base(x => { x.schedules[0].rules = [{ rule: { every: 'none' } }]; });
  const r = periods(b, '2027-01-05', opt);
  eq([r.current, r.past], [null, []]);
});
t('Mako\'s made-up shape before any pay is ticked: only the period running now', () => {
  let n = 0;
  const { book } = buildBook(ANSWERS, { newId: () => 'k7m2qa-f3n8p1x6wd-' + (++n) });
  const r = periods(book, '2026-11-23');
  eq(r.past, []);
  eq([r.current.start, r.current.end], ['2026-11-10', '2026-12-09']);
  ok(r.current.moneyIn.total === 0);
});
const { scheduleView } = require('../periods.js');
t('each schedule on a day: its amount, rule, next occurrence (moved off the weekend)', () => {
  const v = scheduleView(base(), '2027-01-05');
  eq([v.rent.kind, v.rent.amount, v.rent.rule], ['bill', 70000, { every: 'month', days: [27] }]);
  eq(v.rent.next, { due: '2027-01-27', land: '2027-01-27', amount: 70000 });
  // 25 Jan 2027 is a Monday: no move; 25 Dec 2027 is a Saturday, moved before
  eq(scheduleView(base(), '2027-12-01').pay.next, { due: '2027-12-25', land: '2027-12-24', amount: 250000 });
});
t('a change may start only after the latest occurrence a record names [X8]', () => {
  const v = scheduleView(base(), '2026-12-27');
  // the 27 Dec rent was paid (settled) on 28 Dec: a change from 27 Dec would no longer make it
  eq([v.rent.lastNamed, v.rent.changeFrom], ['2026-12-27', '2026-12-28']);
  eq([v.pay.lastNamed, v.pay.changeFrom], ['2026-12-25', '2026-12-27']);
  const b = base(x => { x.schedules[1].amounts = { '2027-01-27': { amount: 71000, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } }; });
  eq(scheduleView(b, '2027-01-05').rent.changeFrom, '2027-01-28');
});
t('the next occurrence is the first one no record dated by the day has settled', () => {
  // the 27 Dec rent was paid on 28 Dec: from 28 Dec the next one to come is 27 Jan; on 27 Dec it is still that one
  eq(scheduleView(base(), '2026-12-28').rent.next.due, '2027-01-27');
  eq(scheduleView(base(), '2026-12-27').rent.next.due, '2026-12-27');
});
t('an ended bill has no next occurrence after its end', () => {
  const b = base(x => { x.schedules[1].ends = '2027-01-31'; });
  eq(scheduleView(b, '2027-02-01').rent.next, null);
});
t('what happened is what the app had heard of by the day asked: dated in the period, told by then', () => {
  // a bill paid dated 24 Dec but told on 30 Dec belongs to the first period by its date [section 9: a change regroups,
  // it moves nothing], and is listed only once the app has heard of it, as the look ahead counts it
  const b = base(x => { x.events.push({ id: 'late', k: 'spend', acct: 'bank', date: '2026-12-24', a: 1200, settles: [{ s: 'rent', due: '2026-11-27' }], told: '2026-12-30T09:00' + TZ }); });
  const ids = (r, i) => r.past[i].billsPaid.items.map(x => x.id);
  eq(ids(periods(b, '2026-12-28', opt), 0), []);
  eq(ids(periods(b, '2026-12-30', opt), 0), ['late']);
});
t('Free to spend set for the first time on 15 Jan: no period before it has a Free to spend amount [BJ2, V]', () => {
  const b = base(x => { x.plan.shares = [{ id: 'sh', from: '2027-01-15', cur: 'JPY', per: { free: 'month' }, free: 50000 }]; delete x.events[0].split.free; });
  const r = periods(b, '2027-01-20', opt);
  eq(r.past.map(p => p.free), [null]);
  eq(r.current.free.amount, 50000);   // set first in the period running since 25 Dec: that period has it
});
t('scheduleView lists an outstanding occurrence (late, not seen or unticked) before the next one [BJ5]', () => {
  const { scheduleView } = require('../periods.js');
  const b = base(x => { x.schedules.push({ id: 'phone', kind: 'bill', name: 'Phone', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [2] } }], steps: [{ amount: 4800 }] }); });
  const v = scheduleView(b, '2026-12-20').phone;
  eq(v.outstanding, [{ due: '2026-12-02', land: '2026-12-02', amount: 4800, state: 'notSeen' }]);
  eq(v.next.due, '2027-01-02');
  const v2 = scheduleView(b, '2026-12-03').phone;   // inside its posting window: late
  eq(v2.outstanding.map(o => o.state), ['late']);
  eq(scheduleView(b, '2026-12-20').rent.outstanding, []);
});
done('periods.test.js');
