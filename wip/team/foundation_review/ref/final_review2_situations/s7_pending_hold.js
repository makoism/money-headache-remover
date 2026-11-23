// S7: a petrol station holds 15,000 on the debit card on Sat 6 Feb; the real fill is 4,200, typed that day.
// The check-in on Sun 7 Feb types the bank app's "available" 80,800 (100,000 - 4,200 - the 15,000 hold).
// On Wed 10 Feb the hold is gone; the bank shows 95,800. Pay starts a period on the 25th; Free to spend 30,000.
const { lookahead, sc, bank, show } = require('./base');
const s = sc({ accounts: [bank('b', '2027-01-25', 100000)],
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 200000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true }],
  plan: { free: { per: 'month', amount: 30000 } }, main_bank: 'b',
  events: [
    { id: 'f1', date: '2027-02-06', told: '2027-02-06T10:00', kind: 'spend', account: 'b', amount: 4200, line: 'free' },
    { id: 'k1', date: '2027-02-07', told: '2027-02-07T20:00', kind: 'check', account: 'b', amount: 80800, avail: 'available' } ] });
let r = lookahead(s, '2027-02-08');
console.log('S7 on 8 Feb: bank', r.accounts.b.bank, 'filler', JSON.stringify(r.accounts.b.fillers.map(f => f.amount)), 'headline', r.safeToSpend.headline);
s.events.push({ id: 'k2', date: '2027-02-10', told: '2027-02-10T20:00', kind: 'check', account: 'b', amount: 95800, avail: 'available' });
r = lookahead(s, '2027-02-10');
console.log('S7 on 10 Feb: bank', r.accounts.b.bank, 'fillers', JSON.stringify(r.accounts.b.fillers.map(f => f.amount)), 'warnings', JSON.stringify(r.warnings.map(w => w.code)), 'headline', r.safeToSpend.headline);
