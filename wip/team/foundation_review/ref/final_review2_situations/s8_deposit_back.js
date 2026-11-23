// S8: pay of about 250,000 on the 25th varies with overtime (vary 0.3). On Mon 22 Mar 2027 the old flat's deposit
// of 200,000 comes back into the bank; the person did not type it, the statement import brings it on 29 Mar,
// along with the real pay of 262,000 that landed Thu 25 Mar.
const { lookahead, sc, bank, show } = require('./base');
const s = sc({ accounts: [bank('b', '2027-03-01', 100000)],
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 250000, vary: 0.3, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true }],
  plan: { free: { per: 'month', amount: 60000 } }, main_bank: 'b',
  events: [
    { id: 'i1', date: '2027-03-22', posted: '2027-03-22', told: '2027-03-29T09:00', kind: 'money_in', account: 'b', amount: 200000, source: 'statement', note: 'deposit back' },
    { id: 'i2', date: '2027-03-25', posted: '2027-03-25', told: '2027-03-29T09:00', kind: 'money_in', account: 'b', amount: 262000, source: 'statement', note: 'salary' } ] });
const r = lookahead(s, '2027-03-29');
show('S8 bank', r.accounts.b.bank, 562000);
console.log('     next pay', JSON.stringify(r.daysToNextPay), ' not seen', JSON.stringify(r.notSeenYet.items.map(i => i.item)));
console.log('     right: the 25 Mar pay is settled by the 262,000 line, not by the deposit (3 days early, 20% under)');
