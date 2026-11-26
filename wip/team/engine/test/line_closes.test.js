'use strict';
// One rule for "does this line take a spend dated on this day" (qc-foundation second confirm on monthrule, 26 Nov,
// coordinator 18; MAKO_SAYS M3, M4, M7, M27, M31, M51). The engine says it once, on each line of the period or the
// month: `closes`, the first day the line takes no spend (null while it is open), and LA.lineTakes(res, id, day).
// With fixed pay a line that ended stays open to the end of the pay period it ended in (the engine still holds that
// period's amount for it: "Ends after this pay period"); with no fixed pay it closes on its end day.
// Made-up yen. Mako: paid on the 10th, Food 40,000 a month from 20 Nov, ended 22 Nov, a new Food 30,000 added that day.
// Kai: no fixed pay, Food 31,000 a month from 18 Dec, ended 22 Dec, a new Food 20,000 added that day.
const { t, done, eq, ok } = require('./t.js');
const path = require('path');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js');
const { endedFoodBook, FOOD, NEW_FOOD } = require(path.join(__dirname, '../../app3/tests/e3_act_book.js'));
const lineOf = (r, id) => ((r.period || r.month).lines || []).find(l => l.id === id);

t('Mako on 25 Nov: the old Food holds 26,666 and takes spends up to 9 Dec; closes on 10 Dec, his pay day', () => {
  const r = LA.lookahead(endedFoodBook(), '2026-11-25'), old = lineOf(r, FOOD), now = lineOf(r, NEW_FOOD);
  eq([old.left, old.closes, now.closes], [26666, '2026-12-10', null]);
  eq(['2026-11-22', '2026-11-25', '2026-12-09', '2026-12-10'].map(d => LA.lineTakes(r, FOOD, d)), [true, true, true, false]);
  ok(LA.lineTakes(r, NEW_FOOD, '2026-12-10'), 'the new Food takes it');
});
t('Mako on 25 Nov: a spend of 5,000 on the old Food dated 25 Nov comes off it (26,666 to 21,666)', () => {
  const b = endedFoodBook(), bank = b.home.main.v.acct;
  b.events.push({ id: 'k7m2qa-f3n8p1x6wd-9950', date: '2026-11-25', told: '2026-11-25T12:00:00.000+09:00', at: '2026-11-25T12:00:00.000+09:00', by: 'k7m2qa', k: 'spend', acct: bank, a: 5000, line: FOOD, src: { type: 'typed' } });
  eq(lineOf(LA.lookahead(b, '2026-11-25'), FOOD).left, 21666);
});
t('Mako after the 10 Dec pay is ticked, on 15 Dec: the old Food still closes on 10 Dec (the period it ended in)', () => {
  const b = endedFoodBook(), bank = b.home.main.v.acct, at = '2026-12-10T09:00:00.000+09:00';
  for (const [n, s, a] of [[9960, 'k7m2qa-f3n8p1x6wd-4', 180000], [9961, 'k7m2qa-f3n8p1x6wd-5', 60000]])
    b.events.push({ id: 'k7m2qa-f3n8p1x6wd-' + n, k: 'in', sub: 'pay', acct: bank, date: '2026-12-10', a, told: at, at, by: 'k7m2qa', settles: [s + '@2026-12-10'] });
  const r = LA.lookahead(b, '2026-12-15');
  eq(r.period.start, '2026-12-10');
  eq([lineOf(r, FOOD).closes, LA.lineTakes(r, FOOD, '2026-12-15'), LA.lineTakes(r, NEW_FOOD, '2026-12-15')], ['2026-12-10', false, true]);
});
t('Kai, no fixed pay: Food ended 22 Dec closes on 23 Dec, the day after its end day', () => {
  const newId = IDS.idMaker('k4i9pz');
  const out = BB.buildBook({ day: '2026-11-01', told: '2026-11-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 2000000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free: 60000 }, { newId });
  const b = out.book || out, food = newId(), food2 = newId();
  const st = (x, told) => Object.assign(x, { told, at: told, by: 'k4i9pz' });
  b.plan.budgets.push(st({ id: food, name: 'Food', place: 'bills', cur: 'JPY', per: 'month', from: '2026-12-18', steps: [{ from: null, amount: 31000 }, { from: '2026-12-22', amount: 0 }], ends: '2026-12-22' }, '2026-12-22T20:00:00.000+09:00'));
  b.plan.budgets.push(st({ id: food2, name: 'Food', place: 'bills', cur: 'JPY', per: 'month', from: '2026-12-22', steps: [{ from: null, amount: 20000 }] }, '2026-12-22T20:00:00.000+09:00'));
  const r = LA.lookahead(b, '2026-12-24');
  eq([r.period, lineOf(r, food).closes, lineOf(r, food2).closes], [null, '2026-12-23', null]);
  eq(['2026-12-22', '2026-12-23'].map(d => LA.lineTakes(r, food, d)), [true, false]);
});
t('a line the engine does not list, or no answer at all, is not refused here (the door checks the plan itself)', () => {
  const r = LA.lookahead(endedFoodBook(), '2026-11-25');
  eq([LA.lineTakes(r, 'nope', '2026-11-25'), LA.lineTakes(r, 'free', '2026-12-30')], [true, true]);
});
done('line_closes');
