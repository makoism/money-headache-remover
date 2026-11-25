'use strict';
// The month rule, second hole found by qc-foundation on the plan (qc_reports/2026-11-25_monthrule/foundation_plan.md,
// blocker 2; MAKO_SAYS M36, M45): with no fixed pay, a plan line's days left in THIS month came off by the day
// whatever was spent, so a line spent in full on the 5th was charged again for the 6th to the 31st.
// The rule (CA5, the coordinator's yes of 25 Nov 2026): this month the walk holds
// what is left of the line, never below zero, as a pay period does; later months come off by the day (CA4).
// Made-up yen: no fixed pay, bank 2,000,000, everyday 40,000 a month, Food 30,000 a month, set up 1 Nov 2026.
// By the day: Food in January floor(30,000 / 31) = 967; in February floor(30,000 / 28) = 1,071. Everyday in January
// floor(40,000 / 31) = 1,290; in February floor(40,000 / 28) = 1,428. This month's everyday money is never held: it caps.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
function life(spends) {
  const newId = IDS.idMaker('q8w3hz');
  const out = BB.buildBook({ day: '2026-11-01', told: '2026-11-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 2000000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free: 40000 }, { newId });
  const b = out.book || out, bank = b.accounts.find(a => a.type === 'bank').id, food = newId();
  const st = (r, told) => Object.assign(r, { told, at: told, by: 'q8w3hz' });
  b.plan.budgets.push(st({ id: food, name: 'Food', place: 'bills', cur: 'JPY', per: 'month', from: '2026-11-01', steps: [{ from: null, amount: 30000 }] }, '2026-11-01T09:05:00.000+09:00'));
  for (const [day, a] of spends) b.events.push(st({ id: newId(), k: 'spend', date: day, a, acct: bank, line: food, src: { type: 'typed' } }, day + 'T19:20:00.000+09:00'));
  return { b, bank };
}
const decFood = r => r.accounts[Object.keys(r.accounts)[0]].whyParts.filter(p => p.label === 'Food (by day)').length;
t('Food spent in full by 5 Dec: nothing more is held for Food in December. Can spare 1,927,117', () => {
  // seen 5 Dec the walk reaches 19 Jan. Bank 2,000,000 - 30,000 = 1,970,000. Held: Food left in December 0; Food 1 to
  // 19 Jan 19 x 967 = 18,373; everyday 1 to 19 Jan 19 x 1,290 = 24,510. 1,970,000 - 18,373 - 24,510 = 1,927,117
  const { b } = life([['2026-12-03', 12000], ['2026-12-05', 18000]]), r = LA.lookahead(b, '2026-12-05');
  eq([r.horizon, r.canSpare.amount, decFood(r)], ['2027-01-19', 1927117, 19]);
});
t('Food overspent (36,000 by 5 Dec): the line holds nothing, never a minus. Can spare 1,921,117', () => {
  // bank 1,964,000 - 18,373 - 24,510 = 1,921,117
  const { b } = life([['2026-12-03', 12000], ['2026-12-05', 24000]]), r = LA.lookahead(b, '2026-12-05');
  eq(r.canSpare.amount, 1921117);
});
t('nothing spent on Food by 30 Dec: all 30,000 is still held for December. Can spare 1,867,513', () => {
  // seen 30 Dec the walk reaches 13 Feb. Held: Food left in December 30,000; January 30,000; 1 to 13 Feb 13 x 1,071 =
  // 13,923. Everyday: January 40,000; 13 x 1,428 = 18,564. 2,000,000 - 73,923 - 58,564 = 1,867,513
  const { b } = life([]), r = LA.lookahead(b, '2026-12-30');
  eq([r.horizon, r.canSpare.amount], ['2027-02-13', 1867513]);
});
t('8,000 of Food spent, seen 20 Dec: 22,000 is held for the rest of December. Can spare 1,892,503', () => {
  // seen 20 Dec the walk reaches 3 Feb. Bank 1,992,000. Held: Food left 22,000; January 30,000; 3 x 1,071 = 3,213.
  // Everyday: January 40,000; 3 x 1,428 = 4,284. 1,992,000 - 55,213 - 44,284 = 1,892,503
  const { b } = life([['2026-12-11', 8000]]), r = LA.lookahead(b, '2026-12-20');
  eq([r.horizon, r.canSpare.amount], ['2027-02-03', 1892503]);
});
done('month_rule_lines.test.js');
