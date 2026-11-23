// e2: AD5's withdrawn first sentence ("apply a waiting entry only when the record it would change has an older `at`").
// [AE2] Now each waiting entry is applied once, by the device that applies it; the keys it writes carry the entry's `at`
// and are judged key by key (rules/move.json mv-109). One device, no merge. 38.31 copy last saved 23 Nov 20:00, holds
// January 2027 pay of 0 (unpaid leave) and Food 70,000.
const path = require('path');
const R = path.join(__dirname, '..', '..', 'rules', 'move_ref.js');
const { move, stamp, applyWaiting } = require(R);
const copy = { v: 1, cfg: { bankStart: 200000, bankAt: '2026-11-22' }, ui: { cur: '¥', preset: '¥', done: { pay: true, bills: true, goals: true } },
  steps: { a: [{ from: '2026-11', v: 250000 }] }, once: { '2027-01': { a: 0, 'bill:food': 70000 } }, plan: { lines: [{ id: 'food', key: 'bill:food', jar: 'nec', name: 'Food', def: 40000 }] }, receipts: [] };
const out = move({ copy, answers: { cur: 'JPY' }, now: '2026-11-24T09:00:00.000+09:00', by: 'phn001', idb: { t: '2026-11-23T20:00:00.000+09:00' } });
const m = stamp(out, '2026-11-24T09:00:00.000+09:00', 'phn001', out.saved);
console.log('waiting entries:', JSON.stringify(m.pendingMove.map(p => [p.id, p.at])));
// 26 Nov 21:00 he renames Food "Groceries" (the line's at becomes 26 Nov). 28 Nov 08:00 he answers the pay day, the 25th:
// the answer itself adds a rules entry to the pay schedule, so its at becomes 28 Nov.
const food = m.plan.budgets.find(b => /food/.test(b.id)); Object.assign(food, { name: 'Groceries', at: '2026-11-26T21:00:00.000+09:00' });
const after = applyWaiting({ copy: m, rules: { 'mv:pay:steps.a': { every: 'month', days: [25] } }, moveDay: '2026-11-24', answeredAt: '2026-11-28T08:00:00.000+09:00', by: 'phn001' });
const pay = after.schedules.find(s => s.id === 'mv:pay:steps.a'), line = after.plan.budgets.find(b => /food/.test(b.id));
console.log('January pay key:', JSON.stringify(pay.amounts), ' expected 2027-01-25 amount 0, at 23 Nov 20:00');
console.log('Food once:', JSON.stringify(line.once), ' expected mv:pay:steps.a@2027-01-25 amount 70,000, at 23 Nov 20:00');
console.log('entries gone:', JSON.stringify(after.pendingMove.map(p => [p.id, p.gone || null])));
