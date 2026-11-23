// e1: one-occurrence `amounts` and a budget line's `once` changed on two devices before they sync.
const { merge } = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const base = { id: 'pay1', kind: 'income', name: 'Salary', per: 'pay', told: '2026-11-01T09:00:00.000+09:00', at: '2026-11-01T09:00:00.000+09:00', by: 'aaaaaa',
  rules: [{ from: '2026-11-01', rule: { monthly: 25 }, at: '2026-11-01T09:00:00.000+09:00', by: 'aaaaaa' }],
  steps: [{ from: '2026-11-01', amount: 300000, at: '2026-11-01T09:00:00.000+09:00', by: 'aaaaaa' }] };
const phone = JSON.parse(JSON.stringify(base)); Object.assign(phone, { amounts: { '2026-12-25': 0 }, at: '2026-11-24T10:00:00.000+09:00', by: 'phn001' }); // unpaid leave in Dec
const desk = JSON.parse(JSON.stringify(base)); Object.assign(desk, { name: 'Salary (Acme)', at: '2026-11-24T10:05:00.000+09:00', by: 'dsk001' });
const line0 = { id: 'food', name: 'Food', per: 'month', steps: [{ from: '2026-11-01', amount: 40000, at: base.at, by: 'aaaaaa' }], told: base.at, at: base.at, by: 'aaaaaa' };
const lp = JSON.parse(JSON.stringify(line0)); Object.assign(lp, { once: { 'pay1@2026-12-25': 70000 }, at: '2026-11-24T10:00:00.000+09:00', by: 'phn001' }); // Dec: family visit
const ld = JSON.parse(JSON.stringify(line0)); Object.assign(ld, { once: { 'pay1@2027-01-25': 20000 }, at: '2026-11-24T10:05:00.000+09:00', by: 'dsk001' });
const mk = (s, l) => ({ schedules: [s], plan: { budgets: [l], shares: [] }, events: [], accounts: [], places: [], people: [], ui: {} });
const m = merge(mk(phone, lp), mk(desk, ld));
const s = m.schedules[0], l = m.plan.budgets[0];
console.log('pay amounts after merge:', JSON.stringify(s.amounts || null), ' expected {"2026-12-25":0}');
console.log('food once after merge:', JSON.stringify(l.once || null), ' expected both Dec 70,000 and Jan 20,000');
// A loan's planned extra payments (`extraSteps`) changed on two devices: steps-shaped, but not merged by entry.
const L0 = { id: 'car', type: 'loan', told: base.at, at: base.at, by: 'aaaaaa', extraSteps: [{ from: '2026-11-24', amount: 0, at: base.at, by: 'aaaaaa' }] };
const La = JSON.parse(JSON.stringify(L0)); La.extraSteps.push({ from: '2027-01-01', amount: 30000, at: '2026-11-24T10:00:00.000+09:00', by: 'phn001' }); Object.assign(La, { at: '2026-11-24T10:00:00.000+09:00', by: 'phn001' });
const Lb = JSON.parse(JSON.stringify(L0)); Lb.extraSteps.push({ from: '2027-04-01', amount: 10000, at: '2026-11-24T10:05:00.000+09:00', by: 'dsk001' }); Object.assign(Lb, { at: '2026-11-24T10:05:00.000+09:00', by: 'dsk001' });
const m2 = merge({ accounts: [La] }, { accounts: [Lb] });
console.log('loan extraSteps after merge:', JSON.stringify(m2.accounts[0].extraSteps.map(e => [e.from, e.amount])), ' expected Jan 30,000 and Apr 10,000');
