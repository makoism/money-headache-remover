'use strict';
// [BZ2, qc-foundation finding 1 on CONTROLS_PLAN, finding 1 on ai-core] Which pay starts the pay periods, by date.
// `startsPeriod` is `true` (every book saved before BZ2: held since the pay's start) or dated entries [{ from, at, by }].
// The pay holding it on a day has the newest entry on or before that day; each period is drawn from the pay that held
// it then. The life: the made-up Mako book with the main pay moved to the 25th, Food 40,000 each pay; on 5 Jan 2027
// "the old job ended, the new one pays on the 10th" (qc-foundation's jobchange.js). Every amount is made up.
const { t, done, eq, ok } = require('./t.js');
const fs = require('fs'), path = require('path');
const { lookahead } = require('../lookahead.js');
const S = require('../schedules.js');

const ID = n => 'k7m2qa-f3n8p1x6wd-' + n;
const MAIN = ID(4), BANK = ID(1), FOOD = ID(40), NEW = ID(90);
const AT = '2027-01-05T20:00:00.000+09:00';
function life() {
  const b = JSON.parse(fs.readFileSync(path.join(__dirname, '../../app3/fixtures/mako_madeup_book.json'), 'utf8'));
  b.schedules = b.schedules.filter(s => s.id !== ID(5));
  b.schedules.find(s => s.id === MAIN).rules[0].rule.days = [25];
  b.events = b.events.filter(e => e.k === 'open' || e.k === 'check');
  b.plan.budgets = [{ id: FOOD, name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 40000 }] }];
  b.plan.shares = [{ id: ID(41), from: '2026-11-20', cur: 'JPY', per: { free: 'pay' }, free: 30000, goals: {} }];
  for (const d of ['2026-11-25', '2026-12-25']) b.events.push({ id: 'set:' + MAIN + '@' + d, k: 'in', sub: 'pay', acct: BANK, a: 180000, stream: MAIN, date: d, told: d + 'T20:00+09:00', settles: [{ s: MAIN, due: d }] });
  let n = 50;
  for (const [d, a] of [['2026-11-28', 12000], ['2026-12-05', 15000], ['2026-12-27', 9000], ['2027-01-03', 8000]]) b.events.push({ id: ID(n++), k: 'spend', acct: BANK, a, line: FOOD, date: d, told: d + 'T20:00+09:00' });
  return b;
}
// 5 Jan: the old job ends that day, the new job (200,000 on the 10th) starts the periods from 5 Jan
function changed(entry) {
  const b = life();
  b.schedules.find(s => s.id === MAIN).ends = '2027-01-05';
  b.schedules.push({ id: NEW, kind: 'income', name: 'New job', acct: BANK, cur: 'JPY', shift: 'after', from: '2027-01-05',
    rules: [{ from: null, rule: { every: 'month', days: [10] } }], steps: [{ from: null, amount: 200000 }],
    startsPeriod: entry === undefined ? [{ from: '2027-01-05', at: AT, by: 'k7m2qa' }] : entry });
  return b;
}
const past = r => (r.periods || []).map(p => [p.start, p.end, p.lines.map(l => l.left)]);
const DAY = '2027-01-05';

t('the pay holding the flag on a day: a bare true is held since the pay\'s start; the newest dated entry wins from its day', () => {
  const b = changed();
  eq(S.periodHolder(b.schedules, '2026-11-01').id, MAIN);
  eq(S.periodHolder(b.schedules, '2027-01-04').id, MAIN);
  eq(S.periodHolder(b.schedules, '2027-01-05').id, NEW);
  eq(S.periodHolder(b.schedules, '2027-03-01').id, NEW);
  eq(S.periodHolder(life().schedules.filter(s => s.kind !== 'income'), DAY), null);
});
t('the job change on 5 Jan: past periods stay as they were, the current period runs from the last pay to the day before the new pay', () => {
  const before = lookahead(life(), DAY, { periods: true }), after = lookahead(changed(), DAY, { periods: true });
  eq([before.period.start, before.period.end], ['2026-12-25', '2027-01-24']);
  eq(past(after), past(before), 'past periods unchanged');
  eq(past(after).length, 2);
  eq(after.period.start, '2026-12-25');
  eq(after.period.end, '2027-01-11', 'the day before the new pay lands (10 Jan is a Sunday and 11 Jan a holiday, so it lands on Tue 12 Jan)');
});
t('the job change on 5 Jan: Food shows 23,000 left, not a false overspend', () => {
  const r = lookahead(changed(), DAY, { periods: true });
  eq(r.period.lines.map(l => [l.name, l.spent, l.left, l.over]), [['Food', 17000, 23000, 0]]);
});
t('after the new pay lands on 12 Jan, its period starts then, and the period before it is kept with Food 23,000 left', () => {
  const b = changed();
  b.events.push({ id: 'set:' + NEW + '@2027-01-10', k: 'in', sub: 'pay', acct: BANK, a: 200000, stream: NEW, date: '2027-01-12', told: '2027-01-12T20:00+09:00', settles: [{ s: NEW, due: '2027-01-10' }] });
  b.events.push({ id: ID(70), k: 'spend', acct: BANK, a: 6000, line: FOOD, date: '2027-01-12', told: '2027-01-12T20:00+09:00' });
  const r = lookahead(b, '2027-01-15', { periods: true });
  eq([r.period.start, r.period.end], ['2027-01-12', '2027-02-09']);
  eq(r.period.lines.map(l => l.left), [34000]);
  eq(past(r).slice(-1), [['2026-12-25', '2027-01-11', [23000]]]);
  eq(past(r).length, 3);
});
t('[BZ2 migration] a book saved before BZ2 (bare true) reads the same as one entry from the pay\'s start', () => {
  const a = life(), b = life();
  b.schedules.find(s => s.id === MAIN).startsPeriod = [{ from: null }];
  eq(JSON.stringify(lookahead(b, DAY, { periods: true })), JSON.stringify(lookahead(a, DAY, { periods: true })));
});
t('[BZ2] an entry marked gone (an Undo, or the sync) holds nothing: the old pay holds the flag again', () => {
  const b = changed([{ from: '2027-01-05', at: AT, by: 'k7m2qa', gone: '2027-01-05' }]);
  eq(S.periodHolder(b.schedules, DAY).id, MAIN);
});
t('[BZ2] the order the pays are saved in never decides which pay holds it: the new pay first gives the same periods', () => {
  const a = changed(), b = changed();
  b.schedules.reverse();
  const pp = r => JSON.stringify([r.period, r.periods, r.safeToSpend.headline]);
  eq(pp(lookahead(b, DAY, { periods: true })), pp(lookahead(a, DAY, { periods: true })));
});
done('starts_period.test.js');
