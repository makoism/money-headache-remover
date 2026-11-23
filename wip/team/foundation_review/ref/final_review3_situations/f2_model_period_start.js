// F2. The reference model knows no periodStart (SCHEMA 9: a period runs from a periodStart's date). Bank 400,000
// set up Fri 20 Nov, pay 300,000 due the 10th, window 3 working days. Free to spend 60,000 a month, Food 40,000.
// Pay due Thu 10 Dec is late. Mon 14 Dec the person starts the new period (ps:2026-12-14). Mon 14: 5,000 of
// food and 3,000 Free to spend. Tue 15: the pay arrives and is ticked. Wed 16 asked.
// Right: the period began 14 Dec (M7): Free to spend left 57,000, Food 35,000. The 14 Dec spends belong to it.
const { lookahead, H, show } = require('./base');
const sc = { currency: 'JPY', main_bank: 'b', holidays: H, goals: [], bills: [],
  accounts: [{ id: 'b', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, posting_days: 3, opening: { date: '2026-11-20', amount: 400000, split: { lines: { food: 20000 }, free: 30000 } } }],
  plan: { lines: [{ id: 'food', name: 'Food', per: 'month', amount: 40000 }], free: { per: 'month', amount: 60000 } },
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 300000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
  events: [
    { id: 'ps:2026-12-14', kind: 'period_start', date: '2026-12-14', told: '2026-12-14T08:00' },
    { id: 'e1', kind: 'spend', account: 'b', amount: 5000, line: 'food', date: '2026-12-14', told: '2026-12-14T12:00' },
    { id: 'e2', kind: 'spend', account: 'b', amount: 3000, line: 'free', date: '2026-12-14', told: '2026-12-14T19:00' },
    { id: 'set:pay@2026-12-10', kind: 'pay_in', account: 'b', amount: 300000, date: '2026-12-15', told: '2026-12-15T09:00', settles: 'pay@2026-12-10' } ] };
let r = lookahead(sc, '2026-12-14');
show('14 Dec headline (new period began today, 3,000 of it spent)', r.safeToSpend.headline, 57000);
r = lookahead(sc, '2026-12-16');
show('16 Dec headline', r.safeToSpend.headline, 57000);
