'use strict';
// CA6 (coordinator, 25 Nov 2026; MONTHRULE_PLAN "The month a change is made in"; MAKO_SAYS M36, M51, M13): with no
// fixed pay the Plan screen says a change to a monthly amount counts from today, and the engine must say the same:
// this month's amount is the one in force today, less everything spent on it this month. (Before: the month kept the
// amount it began with until the 1st, so the screen and the figures disagreed.)
// qc-foundation passed the plan on 25 Nov (qc_reports/2026-11-25_monthrule/foundation_plan_ca6.md); its hand-worked
// walk is the cases below. Made-up yen: no fixed pay, bank 2,000,000, everyday
// 40,000 a month, Food 30,000 a month, set up 1 Nov 2026.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
function life(day) {
  day = day || '2026-11-01';
  const newId = IDS.idMaker('q8w3hz');
  const out = BB.buildBook({ day, told: day + 'T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 2000000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free: 40000 }, { newId });
  const b = out.book || out, bank = b.accounts.find(a => a.type === 'bank').id, food = newId();
  const st = (r, told) => Object.assign(r, { told, at: told, by: 'q8w3hz' });
  b.plan.budgets.push(st({ id: food, name: 'Food', place: 'bills', cur: 'JPY', per: 'month', from: day, steps: [{ from: null, amount: 30000 }] }, day + 'T09:05:00.000+09:00'));
  return {
    b, bank, food,
    spend(day, a, line) { b.events.push(st(Object.assign({ id: newId(), k: 'spend', date: day, a, acct: bank, src: { type: 'typed' } }, line ? { line } : { line: 'free' }), day + 'T19:20:00.000+09:00')); },
    everyday(day, a) { b.plan.shares.push(st({ id: newId(), from: day, cur: 'JPY', per: { free: 'month' }, free: a, goals: {} }, day + 'T20:10:00.000+09:00')); },
    foodTo(day, a) { const l = b.plan.budgets.find(x => x.id === food); l.steps = l.steps.concat([{ from: day, amount: a, at: day + 'T20:15:00.000+09:00', by: 'q8w3hz' }]); },
  };
}
const ev = r => [r.everyday.full, r.everyday.counts, r.everyday.spent, r.everyday.left, r.safeToSpend.headline];
t('everyday 40,000 raised to 60,000 on 16 Dec with 25,000 spent: December is 60,000 from that day, 35,000 left', () => {
  const x = life(); x.spend('2026-12-10', 25000); x.everyday('2026-12-16', 60000);
  eq(ev(LA.lookahead(x.b, '2026-12-15')), [40000, 40000, 25000, 15000, 15000]);   // the day before: still the old amount
  eq(ev(LA.lookahead(x.b, '2026-12-16')), [60000, 60000, 25000, 35000, 35000]);
});
t('everyday 40,000 lowered to 20,000 on 16 Dec with 25,000 spent: December is 5,000 over, headline 0', () => {
  const x = life(); x.spend('2026-12-10', 25000); x.everyday('2026-12-16', 20000);
  eq(ev(LA.lookahead(x.b, '2026-12-16')), [20000, 20000, 25000, -5000, 0]);
});
t('Food 30,000 raised to 45,000 on 16 Dec with 12,000 spent: 33,000 is held for the rest of December. Can spare 1,872,770', () => {
  // seen 16 Dec the walk reaches 30 Jan. Bank 2,000,000 - 12,000 = 1,988,000. Held: Food left this month 45,000 -
  // 12,000 = 33,000; Food 1 to 30 Jan at floor(45,000 / 31) = 1,451: 43,530; everyday 1 to 30 Jan at 1,290: 38,700.
  // 1,988,000 - 33,000 - 43,530 - 38,700 = 1,872,770
  const x = life(); x.spend('2026-12-08', 12000, x.food); x.foodTo('2026-12-16', 45000);
  const r = LA.lookahead(x.b, '2026-12-16');
  eq([r.horizon, r.canSpare.amount], ['2027-01-30', 1872770]);
});
t('a line ended partway through the month holds nothing more: Food ended 16 Dec with 12,000 spent, can spare 1,949,300', () => {
  // seen 16 Dec the walk reaches 30 Jan. Bank 1,988,000. Held: Food 0 (ended: a step to 0 dated today); everyday 1 to
  // 30 Jan 30 x 1,290 = 38,700. 1,988,000 - 38,700 = 1,949,300 (before CA6 the 18,000 left of Food was held to the 1st)
  const x = life(); x.spend('2026-12-08', 12000, x.food); x.foodTo('2026-12-16', 0);
  eq(LA.lookahead(x.b, '2026-12-16').canSpare.amount, 1949300);
});
t('Food lowered to 10,000 with 12,000 spent: nothing is held, never a minus', () => {
  // 1,988,000 - Food 1 to 30 Jan 30 x floor(10,000 / 31) = 30 x 322 = 9,660 - 38,700 = 1,939,640
  const x = life(); x.spend('2026-12-08', 12000, x.food); x.foodTo('2026-12-16', 10000);
  eq(LA.lookahead(x.b, '2026-12-16').canSpare.amount, 1939640);
});
t('two changes in one month, and two on one day: the one in force that day counts, the later written wins a tie, in any order', () => {
  const x = life(); x.spend('2026-12-10', 25000); x.everyday('2026-12-12', 60000); x.everyday('2026-12-16', 30000);
  eq(ev(LA.lookahead(x.b, '2026-12-14')).slice(0, 4), [60000, 60000, 25000, 35000]);
  eq(ev(LA.lookahead(x.b, '2026-12-16')).slice(0, 4), [30000, 30000, 25000, 5000]);
  const y = life(); y.spend('2026-12-10', 25000); y.everyday('2026-12-16', 60000);
  y.b.plan.shares.push(Object.assign({}, y.b.plan.shares[y.b.plan.shares.length - 1], { id: 'q8w3hz-n4k7c2m9xs-41', free: 50000, told: '2026-12-16T21:40:00.000+09:00', at: '2026-12-16T21:40:00.000+09:00' }));
  const want = [50000, 50000, 25000, 25000, 25000];
  eq(ev(LA.lookahead(y.b, '2026-12-16')), want);
  eq(ev(LA.lookahead(Object.assign({}, y.b, { plan: Object.assign({}, y.b.plan, { shares: y.b.plan.shares.slice().reverse() }), events: y.b.events.slice().reverse() }), '2026-12-16')), want);
});
t('Undo of the change (the entry marked gone): back to 40,000, 15,000 left', () => {
  const x = life(); x.spend('2026-12-10', 25000); x.everyday('2026-12-16', 60000);
  const last = x.b.plan.shares[x.b.plan.shares.length - 1]; last.gone = '2026-12-16';
  eq(ev(LA.lookahead(x.b, '2026-12-16')), [40000, 40000, 25000, 15000, 15000]);
});
t('a change on the last day of the month counts that day; the 1st starts a whole new month', () => {
  const x = life(); x.spend('2026-12-10', 25000); x.everyday('2026-12-31', 60000);
  eq(ev(LA.lookahead(x.b, '2026-12-31')).slice(0, 4), [60000, 60000, 25000, 35000]);
  eq(ev(LA.lookahead(x.b, '2027-01-01')).slice(0, 4), [60000, 60000, 0, 60000]);
});
t('an amount dated ahead does nothing until its day: 50,000 from 20 Dec, seen 16 Dec and 20 Dec', () => {
  const x = life(); x.spend('2026-12-10', 25000); x.everyday('2026-12-20', 50000);
  eq(ev(LA.lookahead(x.b, '2026-12-16')).slice(0, 4), [40000, 40000, 25000, 15000]);
  eq(ev(LA.lookahead(x.b, '2026-12-20')).slice(0, 4), [50000, 50000, 25000, 25000]);
});
t('the month a person starts in still counts by days left (I4), from the amount in force today: set up 20 Nov, raised on 25 Nov', () => {
  // 20 to 30 Nov is 11 days of 30: 60,000 x 11 / 30 = 22,000 counts; 5,000 spent: 17,000 left. On 1 Dec a whole 60,000
  const x = life('2026-11-20'); x.spend('2026-11-22', 5000); x.everyday('2026-11-25', 60000);
  eq(ev(LA.lookahead(x.b, '2026-11-25')).slice(0, 4), [60000, 22000, 5000, 17000]);
  eq(ev(LA.lookahead(x.b, '2026-12-01')).slice(0, 4), [60000, 60000, 0, 60000]);
});
done('month_change.test.js');
