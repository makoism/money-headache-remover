'use strict';
// A plan line ADDED partway through a month, with no fixed pay (coordinator's ruling, 26 Nov 2026, after qc-numbers on
// the month rule build, blocker 2; DECISIONS_ROUND2 CA9; MAKO_SAYS M36, M45, M48, M51). For the rest of the month it
// was added in, the line holds a by-days share of its monthly amount: the days left including the day added, over the
// days in the month, rounded down to the currency's smallest unit (whole yen; cents where the currency has them). From
// the next month it is charged in full, by the day from the 1st (CA4). Before: the whole month's amount was held at once
// (Food 3,100 added on 18 Dec held 3,100 for 14 days), because the share counted from the setup day only.
// Made-up figures: no fixed pay, bank 2,000,000, everyday 40,000 a month, set up 1 Nov 2026 unless a case says otherwise.
// Walk seen 18 Dec reaches 1 Feb. By the day: Food 3,100 in January floor(3,100 / 31) = 100 a day (31 days: 3,100);
// in February floor(3,100 / 28) = 110. Everyday in January 40,000; in February floor(40,000 / 28) = 1,428 a day.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
function life(opt) {
  opt = opt || {};
  const day = opt.day || '2026-11-01', currency = opt.currency || 'JPY';
  const newId = IDS.idMaker('q8w3hz');
  const out = BB.buildBook({ day, told: day + 'T09:00:00.000+09:00', currency, country: opt.country || 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: opt.bank || 2000000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free: opt.free || 40000 }, { newId });
  const b = out.book || out, bank = b.accounts.find(a => a.type === 'bank').id;
  const st = (r, told) => Object.assign(r, { told, at: told, by: 'q8w3hz' });
  return {
    b, bank,
    add(dayAdded, name, a, per) { const id = newId(); b.plan.budgets.push(st({ id, name, place: 'bills', cur: currency, per: per || 'month', from: dayAdded, steps: [{ from: null, amount: a }] }, dayAdded + 'T20:00:00.000+09:00')); return id; },
    change(id, dayOf, a) { const l = b.plan.budgets.find(x => x.id === id); l.steps = l.steps.concat([{ from: dayOf, amount: a, at: dayOf + 'T21:00:00.000+09:00', by: 'q8w3hz' }]); },
    spend(dayOf, a, line) { b.events.push(st({ id: newId(), k: 'spend', date: dayOf, a, acct: bank, line, src: { type: 'typed' } }, dayOf + 'T19:20:00.000+09:00')); },
  };
}
const part = (r, label) => r.accounts[Object.keys(r.accounts)[0]].whyParts.filter(p => p.label === label).map(p => 0 - p.amount);
t('Food 3,100 added on 18 Dec: 14 of 31 days left, 1,400 is held for the rest of December. Can spare 1,953,962', () => {
  // 3,100 x 14 / 31 = 1,400. Held: Food left in December 1,400; January 3,100; 1 Feb 110. Everyday: January 40,000;
  // 1 Feb 1,428. 2,000,000 - 1,400 - 3,100 - 110 - 40,000 - 1,428 = 1,953,962 (before the ruling 1,952,262: 3,100 held)
  const x = life(); x.add('2026-12-18', 'Food', 3100);
  const r = LA.lookahead(x.b, '2026-12-18');
  eq([r.horizon, part(r, 'Food left this month'), r.canSpare.amount], ['2027-02-01', [1400], 1953962]);
});
t('the share is rounded down: Food 3,000 added on 18 Dec holds 1,354 (3,000 x 14 / 31 = 1,354.8)', () => {
  const x = life(); x.add('2026-12-18', 'Food', 3000);
  eq(part(LA.lookahead(x.b, '2026-12-18'), 'Food left this month'), [1354]);
});
t('spent on the new line: Food 3,100 added 18 Dec, 2,000 spent on 20 Dec, nothing is held for December, never a minus', () => {
  // seen 20 Dec the walk reaches 3 Feb. Bank 1,998,000. Held: Food December 0 (1,400 - 2,000); January 3,100; Feb 3 x
  // 110 = 330. Everyday January 40,000; 3 x 1,428 = 4,284. 1,998,000 - 3,100 - 330 - 40,000 - 4,284 = 1,950,286
  const x = life(), food = x.add('2026-12-18', 'Food', 3100); x.spend('2026-12-20', 2000, food);
  const r = LA.lookahead(x.b, '2026-12-20');
  eq([r.horizon, part(r, 'Food left this month'), r.canSpare.amount], ['2027-02-03', [0], 1950286]);
});
t('a part spent: 500 on 20 Dec leaves 900 of the 1,400 held', () => {
  const x = life(), food = x.add('2026-12-18', 'Food', 3100); x.spend('2026-12-20', 500, food);
  eq(part(LA.lookahead(x.b, '2026-12-20'), 'Food left this month'), [900]);
});
t('seen later in the month the share stays 1,400 (it is the days left on the day added, not on the day seen)', () => {
  const x = life(); x.add('2026-12-18', 'Food', 3100);
  eq(part(LA.lookahead(x.b, '2026-12-28'), 'Food left this month'), [1400]);
});
t('from the next month it is charged in full: seen 1 Jan, Food left this month 3,100', () => {
  const x = life(); x.add('2026-12-18', 'Food', 3100);
  eq(part(LA.lookahead(x.b, '2027-01-01'), 'Food left this month'), [3100]);
});
t('added on the 1st: the whole month; added on the last day: one day of 31, 100', () => {
  const x = life(); x.add('2026-12-01', 'Food', 3100);
  eq(part(LA.lookahead(x.b, '2026-12-01'), 'Food left this month'), [3100]);
  const y = life(); y.add('2026-12-31', 'Food', 3100);
  eq(part(LA.lookahead(y.b, '2026-12-31'), 'Food left this month'), [100]);
});
t('added in the month of setup, after the setup day: from the day added. Set up 20 Nov, Food 3,000 added 25 Nov: 6 of 30 days, 600', () => {
  const x = life({ day: '2026-11-20' }); x.add('2026-11-25', 'Food', 3000);
  eq(part(LA.lookahead(x.b, '2026-11-25'), 'Food left this month'), [600]);
});
t('a line set on the setup day still shares from the setup day (I4): set up 20 Nov, Food 3,000: 11 of 30 days, 1,100', () => {
  const x = life({ day: '2026-11-20' }); x.add('2026-11-20', 'Food', 3000);
  eq(part(LA.lookahead(x.b, '2026-11-20'), 'Food left this month'), [1100]);
});
t('added 18 Dec then raised on 20 Dec to 6,200: the share is of the amount in force today (CA6), 2,800', () => {
  const x = life(), food = x.add('2026-12-18', 'Food', 3100); x.change(food, '2026-12-20', 6200);
  eq(part(LA.lookahead(x.b, '2026-12-18'), 'Food left this month'), [1400]);
  eq(part(LA.lookahead(x.b, '2026-12-20'), 'Food left this month'), [2800]);
});
t('a line made before this month keeps its whole month (unchanged): Food 3,100 added 18 Nov, seen 18 Dec, 3,100', () => {
  const x = life(); x.add('2026-11-18', 'Food', 3100);
  eq(part(LA.lookahead(x.b, '2026-12-18'), 'Food left this month'), [3100]);
});
t('cents: US$45.67 a month added on 18 Dec holds US$20.62 (4,567 cents x 14 / 31 = 2,062.5, rounded down)', () => {
  const x = life({ currency: 'USD', country: 'US', bank: 500000, free: 60000 }); x.add('2026-12-18', 'Food', 4567);
  eq(part(LA.lookahead(x.b, '2026-12-18'), 'Food left this month'), [2062]);
});
t('the same book in reverse order gives the same share', () => {
  const x = life(), food = x.add('2026-12-18', 'Food', 3100); x.spend('2026-12-20', 500, food);
  const rev = Object.assign({}, x.b, { plan: Object.assign({}, x.b.plan, { budgets: x.b.plan.budgets.slice().reverse() }), events: x.b.events.slice().reverse() });
  eq(part(LA.lookahead(rev, '2026-12-20'), 'Food left this month'), [900]);
});
done('month_added.test.js');
