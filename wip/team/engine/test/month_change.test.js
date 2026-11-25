'use strict';
// CA6 (coordinator, 25 Nov 2026; MONTHRULE_PLAN "The month a change is made in"; MAKO_SAYS M36, M51, M13): with no
// fixed pay the Plan screen says a change to a monthly amount counts from today, and the engine must say the same:
// this month's amount is the one in force today, less everything spent on it this month. (Before: the month kept the
// amount it began with until the 1st, so the screen and the figures disagreed.)
// RED on purpose and not in run_all until the plan's review. Made-up yen: no fixed pay, bank 2,000,000, everyday
// 40,000 a month, Food 30,000 a month, set up 1 Nov 2026.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
function life() {
  const newId = IDS.idMaker('q8w3hz');
  const out = BB.buildBook({ day: '2026-11-01', told: '2026-11-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 2000000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free: 40000 }, { newId });
  const b = out.book || out, bank = b.accounts.find(a => a.type === 'bank').id, food = newId();
  const st = (r, told) => Object.assign(r, { told, at: told, by: 'q8w3hz' });
  b.plan.budgets.push(st({ id: food, name: 'Food', place: 'bills', cur: 'JPY', per: 'month', from: '2026-11-01', steps: [{ from: null, amount: 30000 }] }, '2026-11-01T09:05:00.000+09:00'));
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
t('the month a person starts in still counts by days left (I4), from the amount in force today', () => {
  // set up 1 Nov; seen in November: everyday 40,000 from the 1st is the whole month. Raised to 60,000 on 20 Nov: 60,000
  const x = life(); x.everyday('2026-11-20', 60000);
  eq(ev(LA.lookahead(x.b, '2026-11-20')).slice(0, 2), [60000, 60000]);
});
done('month_change.test.js');
