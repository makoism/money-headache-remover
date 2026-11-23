// e2: AD5 as written ("apply a waiting entry only when the record it would change has an older `at` than the entry").
// One device, no merge. 38.31 copy last saved 23 Nov 20:00, holds January 2027 pay of 0 (unpaid leave) and Food 70,000.
const { ask } = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/move_ref.js');
const { stamp } = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/move_ref.js');
const copy = { v: 1, cfg: { bankStart: 200000, bankAt: '2026-11-22' }, ui: { cur: '¥', preset: '¥', done: { pay: true, bills: true, goals: true } },
  steps: { a: [{ from: '2026-11', v: 250000 }] }, once: { '2027-01': { a: 0, 'bill:food': 70000 } }, plan: { lines: [{ id: 'food', key: 'bill:food', jar: 'nec', name: 'Food', def: 40000 }] }, receipts: [] };
const out = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/move_ref.js').move({ copy, answers: { cur: 'JPY' }, now: '2026-11-24T09:00:00.000+09:00', by: 'phn001', idb: { t: '2026-11-23T20:00:00.000+09:00' } });
const m = stamp(out, '2026-11-24T09:00:00.000+09:00', 'phn001', out.saved);
const ent = m.pendingMove.map(p => [p.id, p.at]);
console.log('waiting entries:', JSON.stringify(ent));
// 26 Nov 21:00 he renames Food "Groceries" (the line's at becomes 26 Nov). 28 Nov he answers the pay day: the answer itself
// adds a rules entry to the pay schedule, so its at becomes 28 Nov.
const food = m.plan.budgets.find(b => /food/.test(b.id)); food.at = '2026-11-26T21:00:00.000+09:00';
const pay = m.schedules.find(s => s.id === 'mv:pay:steps.a'); pay.at = '2026-11-28T08:00:00.000+09:00';
for (const p of m.pendingMove) {
  const rec = p.waits === 'mv:pay:steps.a' && p.to === 'amounts' ? pay : p.to === 'once' ? food : null;
  if (!rec) continue;
  const apply = Date.parse(rec.at) < Date.parse(p.at);
  console.log(p.id, '-> AD5', apply ? 'applies' : 'SKIPS', '(record at', rec.at + ', entry at', p.at + ')');
}
console.log('Hand answer: January pay 0 and Food 70,000 must still be written; skipped, the engine counts a 250,000 January pay that never comes.');
