// e1: one-occurrence `amounts` and a budget line's `once` changed on two devices before they sync.
// [AE1] Each key is an entry with its own `at`, `by` and `gone`, and merges key by key like `steps` (rules/merge.json mg-100 to mg-104).
const path = require('path');
const { merge } = require(path.join(__dirname, '..', '..', 'rules', 'merge_ref.js'));
const T0 = '2026-11-01T09:00:00.000+09:00', P = '2026-11-24T10:00:00.000+09:00', D = '2026-11-24T10:05:00.000+09:00';
const base = { id: 'pay1', kind: 'income', name: 'Salary', per: 'pay', told: T0, at: T0, by: 'aaaaaa',
  rules: [{ from: '2026-11-01', rule: { monthly: 25 }, at: T0, by: 'aaaaaa' }],
  steps: [{ from: '2026-11-01', amount: 300000, at: T0, by: 'aaaaaa' }] };
const phone = JSON.parse(JSON.stringify(base)); Object.assign(phone, { amounts: { '2026-12-25': { amount: 0, at: P, by: 'phn001' } }, at: P, by: 'phn001' }); // unpaid leave in Dec
const desk = JSON.parse(JSON.stringify(base)); Object.assign(desk, { name: 'Salary (Acme)', at: D, by: 'dsk001' });
const line0 = { id: 'food', name: 'Food', per: 'month', steps: [{ from: '2026-11-01', amount: 40000, at: T0, by: 'aaaaaa' }], told: T0, at: T0, by: 'aaaaaa' };
const lp = JSON.parse(JSON.stringify(line0)); Object.assign(lp, { once: { 'pay1@2026-12-25': { amount: 70000, at: P, by: 'phn001' } }, at: P, by: 'phn001' }); // Dec: family visit
const ld = JSON.parse(JSON.stringify(line0)); Object.assign(ld, { once: { 'pay1@2027-01-25': { amount: 20000, at: D, by: 'dsk001' } }, at: D, by: 'dsk001' });
const mk = (s, l) => ({ schedules: [s], plan: { budgets: [l], shares: [] }, events: [], accounts: [], places: [], people: [], ui: {} });
const m = merge(mk(phone, lp), mk(desk, ld));
const s = m.schedules[0], l = m.plan.budgets[0];
const amt = x => Object.fromEntries(Object.entries(x || {}).map(([k, v]) => [k, v.amount]));
console.log('pay amounts after merge:', JSON.stringify(amt(s.amounts)), ' expected {"2026-12-25":0}');
console.log('food once after merge:', JSON.stringify(amt(l.once)), ' expected both Dec 70,000 and Jan 20,000');
// A loan's planned extra payments (`extraSteps`) changed on two devices: merged by `from`, like `steps`.
const L0 = { id: 'car', type: 'loan', told: T0, at: T0, by: 'aaaaaa', extraSteps: [{ from: '2026-11-24', amount: 0, at: T0, by: 'aaaaaa' }] };
const La = JSON.parse(JSON.stringify(L0)); La.extraSteps.push({ from: '2027-01-01', amount: 30000, at: P, by: 'phn001' }); Object.assign(La, { at: P, by: 'phn001' });
const Lb = JSON.parse(JSON.stringify(L0)); Lb.extraSteps.push({ from: '2027-04-01', amount: 10000, at: D, by: 'dsk001' }); Object.assign(Lb, { at: D, by: 'dsk001' });
const m2 = merge({ accounts: [La] }, { accounts: [Lb] });
console.log('loan extraSteps after merge:', JSON.stringify(m2.accounts[0].extraSteps.map(e => [e.from, e.amount])), ' expected Jan 30,000 and Apr 10,000');
