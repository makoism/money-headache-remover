'use strict';
const { t, done, eq, ok } = require('./t.js');
const D = require('../dates.js');
const S = require('../schedules.js');
const n = D.dayNum, s = D.dayStr;

t('Japan: the 2026 holidays, a substitute and a citizens holiday', () => {
  const h = S.holidays('JP', 2026);
  eq(h, ['2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20', '2026-04-29', '2026-05-03', '2026-05-04',
    '2026-05-05', '2026-05-06', '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12',
    '2026-11-03', '2026-11-23']);
});
t('Japan: 2027 equinox on a Sunday moves the holiday to Monday', () => {
  const h = S.holidays('JP', 2027);
  ok(h.includes('2027-03-21') && h.includes('2027-03-22'));
  ok(h.includes('2027-01-11') && h.includes('2027-09-20') && h.includes('2027-09-23'));
});
t('Japan: banks are closed 31 Dec and 2 and 3 Jan', () => {
  eq(S.bankClosed('JP', 2027), ['2027-01-02', '2027-01-03', '2027-12-31']);
});
t('Philippines: Holy Week from Easter, National Heroes Day, fixed days; marked partial (Eid and proclaimed days)', () => {
  const h = S.holidays('PH', 2027);
  ok(h.includes('2027-03-25') && h.includes('2027-03-26') && h.includes('2027-03-27'));   // Easter 2027 is 28 Mar
  ok(h.includes('2027-08-30'));   // last Monday of August
  ok(h.includes('2027-06-12') && h.includes('2027-11-30') && h.includes('2027-12-30'));
  eq(S.calendar('PH').partial, true);
});
t('a country with no table falls back to weekends only, and says so', () => {
  const c = S.calendar('US');
  eq(c.fallback, true);
  ok(c.working(n('2026-11-26')));   // a Thursday: no table, so a working day
  ok(!c.working(n('2026-11-28')));
});
t('a table given for a country replaces the built-in one', () => {
  const c = S.calendar('JP', { holidays: ['2026-11-24'], bankClosed: [] });
  ok(!c.working(n('2026-11-24'))); ok(c.working(n('2026-11-23')));
});
t('the weekend and holiday rule: before, after, none [F17]', () => {
  const c = S.calendar('JP');
  eq(s(c.shift(n('2027-01-10'), 'before')), '2027-01-08');   // Sun, then Mon 11 Jan is a holiday
  eq(s(c.shift(n('2027-01-10'), 'after')), '2027-01-12');
  eq(s(c.shift(n('2027-01-10'), 'none')), '2027-01-10');
});
t('working days added and taken away, and the last working day', () => {
  const c = S.calendar('JP');
  eq(s(c.addWorking(n('2026-11-20'), 1)), '2026-11-24');   // Fri, then the weekend and Mon 23 Nov
  eq(s(c.subWorking(n('2026-11-24'), 1)), '2026-11-20');
  eq(s(c.lastWorking(2027, 1)), '2027-01-29');
});

const cal = S.calendar('JP');
const occ = (sch, from, to) => S.occurrences(sch, cal, n(from), n(to)).map(o => `${o.id} ${s(o.land)} ${o.amount}`);
t('monthly on the 10th, moved earlier', () => {
  const sch = { id: 'pay', rules: [{ from: null, rule: { every: 'month', days: [10] } }], shift: 'before', steps: [{ from: null, amount: 300000 }] };
  eq(occ(sch, '2026-12-01', '2027-01-31'), ['pay@2026-12-10 2026-12-10 300000', 'pay@2027-01-10 2027-01-08 300000']);
});
t('two days a month, unequal amounts by day, 31 the last day', () => {
  const sch = { id: 'p', rules: [{ rule: { every: 'month', days: [15, 31] } }], steps: [{ amount: 0 }], byDay: { 15: 18000, 31: 12000 } };
  eq(occ(sch, '2027-02-01', '2027-02-28'), ['p@2027-02-15 2027-02-15 18000', 'p@2027-02-28 2027-02-28 12000']);
});
t('every two weeks from a date', () => {
  const sch = { id: 'p', rules: [{ rule: { every: 'weeks', n: 2, from: '2026-11-12' } }], steps: [{ amount: 100 }] };
  eq(occ(sch, '2026-11-20', '2026-12-31').map(x => x.split(' ')[0]), ['p@2026-11-26', 'p@2026-12-10', 'p@2026-12-24']);
});
t('every three months, some months of the year, a yearly date, once, none', () => {
  const r = (rule, from, to) => occ({ id: 'x', rules: [{ rule }], steps: [{ amount: 1 }] }, from, to).map(x => x.split(' ')[0]);
  eq(r({ every: 'months', n: 3, day: 5, from: '2026-12-05' }, '2026-12-01', '2027-06-30'), ['x@2026-12-05', 'x@2027-03-05', 'x@2027-06-05']);
  eq(r({ every: 'monthsList', months: [6, 11], day: 15 }, '2026-12-01', '2027-12-31'), ['x@2027-06-15', 'x@2027-11-15']);
  eq(r({ every: 'year', date: '05-31' }, '2026-12-01', '2028-12-31'), ['x@2027-05-31', 'x@2028-05-31']);
  eq(r({ every: 'once', date: '2027-03-14' }, '2026-12-01', '2027-12-31'), ['x@2027-03-14']);
  eq(r({ every: 'none' }, '2026-12-01', '2027-12-31'), []);
});
t('the last working day is never moved', () => {
  const sch = { id: 'x', rules: [{ rule: { every: 'lastWorkday' } }], shift: 'after', steps: [{ amount: 1 }] };
  eq(occ(sch, '2027-01-01', '2027-01-31'), ['x@2027-01-29 2027-01-29 1']);
});
t('rules from a date never rewrite an occurrence before it [H2]', () => {
  const sch = { id: 'p', rules: [{ rule: { every: 'month', days: [10] } }, { from: '2027-01-01', rule: { every: 'month', days: [25] } }],
    steps: [{ amount: 100 }, { from: '2027-01-01', amount: 120 }] };
  eq(occ(sch, '2026-12-01', '2027-02-28'), ['p@2026-12-10 2026-12-10 100', 'p@2027-01-25 2027-01-25 120', 'p@2027-02-25 2027-02-25 120']);
});
t('first occurrence, ends, a count; a removed step or rule entry counts for nothing', () => {
  const sch = { id: 'p', shift: 'before', from: '2027-01-10', ends: '2027-04-10', rules: [{ rule: { every: 'month', days: [10] } }, { from: '2027-03-01', rule: { every: 'month', days: [20] }, gone: '2026-12-01' }],
    steps: [{ amount: 100 }, { from: '2027-02-01', amount: 999, gone: '2026-12-01' }] };
  eq(occ(sch, '2026-12-01', '2027-06-30'), ['p@2027-01-10 2027-01-08 100', 'p@2027-02-10 2027-02-10 100', 'p@2027-03-10 2027-03-10 100', 'p@2027-04-10 2027-04-09 100']);
  eq(occ(Object.assign({}, sch, { count: 2 }), '2026-12-01', '2027-06-30').length, 2);
});
t('one occurrence changed by its keyed override; a removed key is not read [B8, AE1]', () => {
  const sch = { id: 'p', shift: 'before', rules: [{ rule: { every: 'month', days: [10] } }], steps: [{ amount: 100 }],
    amounts: { '2027-01-10': { amount: 0, at: 'x', by: 'y' }, '2027-02-10': { amount: 50, gone: '2026-12-01', at: 'x', by: 'y' } } };
  eq(occ(sch, '2027-01-01', '2027-02-28'), ['p@2027-01-10 2027-01-08 0', 'p@2027-02-10 2027-02-10 100']);
});
t('a key not in the keyed override shape is refused [AE1, AH3]', () => {
  const sch = { id: 'p', rules: [{ rule: { every: 'month', days: [10] } }], steps: [{ amount: 100 }], amounts: { '2027-01-10': 0 } };
  let threw = false; try { occ(sch, '2027-01-01', '2027-01-31'); } catch (e) { threw = /keyed override/.test(e.message); }
  ok(threw);
});
t('a monthly amount per pay: monthly x 12 over the pays of the year [per month, H9]', () => {
  const sch = { id: 'p', per: 'month', rules: [{ rule: { every: 'weeks', n: 2, from: '2027-01-01' } }], steps: [{ amount: 50000 }] };
  const list = S.occurrences(sch, cal, n('2027-01-01'), n('2027-12-31'));
  eq(list.length, 27);
  eq(list.reduce((a, o) => a + o.amount, 0), 600000);
  eq(list[0].amount, 22223);
});

// [H9, L units q4, q5, P4, R2] a monthly amount per pay: each rule its own months, spread over that rule's pays
const cal0 = S.calendar('none', { holidays: [], bankClosed: [] });
const sched = rules => ({ id: 'pay', rules: rules.map(r => ({ from: r.from, rule: r.rule })) });
const twoWeekly = { from: '2027-01-01', rule: { every: 'weeks', n: 2, from: '2027-01-01' } };
t('the first year of a schedule counts the whole year by its rhythm [L units q5]', () => {
  const sp = S.monthShare(sched([{ from: null, rule: { every: 'weeks', n: 2, from: '2026-11-13' } }]), cal0, n('2026-11-13'), 50000);
  eq(sp.pays, 26);
});
t('two-weekly to June, then monthly: each rule its own months [P4]', () => {
  const sc = sched([twoWeekly, { from: '2027-07-01', rule: { every: 'month', days: [25] } }]);
  eq(S.monthShare(sc, cal0, n('2027-06-18'), 50000), { pays: 13, pay: 13, months: 6, amount: 23076 });
  eq(S.monthShare(sc, cal0, n('2027-07-25'), 50000), { pays: 6, pay: 1, months: 6, amount: 50000 });
});
t('a rule changing on the 15th: that month is the old rule\'s, the new rule\'s pays from its from [R2]', () => {
  const sc = sched([twoWeekly, { from: '2027-07-15', rule: { every: 'month', days: [10] } }]);
  eq(S.monthShare(sc, cal0, n('2027-07-02'), 50000), { pays: 14, pay: 14, months: 7, amount: 25000 });
  eq(S.monthShare(sc, cal0, n('2027-08-10'), 50000), { pays: 5, pay: 1, months: 5, amount: 50000 });
  const sc2 = sched([twoWeekly, { from: '2027-07-15', rule: { every: 'month', days: [25] } }]);
  eq(S.monthShare(sc2, cal0, n('2027-07-25'), 50000), { pays: 6, pay: 1, months: 5, amount: 41667 });
});
done('schedules');
