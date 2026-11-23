// S5: a salary paid partly in dollars: 200,000 JPY to the yen bank and 1,000 USD to a USD account, both on the 25th.
// S5b: an employer pays 1,000 USD as yen into the yen bank (the yen amount moves with the rate). The schedule's
// currency is USD, its account is yen. SCHEMA_V3 5 lets a schedule carry `cur`; nothing says what then.
const { lookahead, sc, bank, show } = require('./base');
const usd = { id: 'u', name: 'USD', kind: 'bank', currency: 'USD', minimum: 0, opening: { date: '2027-01-04', amount: 0 } };
let s = sc({ accounts: [bank('b', '2027-01-04', 100000), usd],
  income: [ { id: 'pay', name: 'Pay', account: 'b', amount: 200000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true },
            { id: 'payu', name: 'Pay USD', account: 'u', currency: 'USD', amount: 1000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier' } ] });
let r = lookahead(s, '2027-01-26');
console.log('S5 total', r.total.amount, 'beside', JSON.stringify(r.total.beside), ' not seen', JSON.stringify(r.notSeenYet.items.map(i => i.item)));
s = sc({ accounts: [bank('b', '2027-01-04', 100000)],
  bills: [{ id: 'rent', name: 'Rent', account: 'b', amount: 120000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'none' }],
  income: [ { id: 'payu', name: 'Pay in USD', account: 'b', currency: 'USD', amount: 1000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true } ] });
r = lookahead(s, '2027-01-20');
console.log('S5b yen bank expects pay of', r.daysToNextPay.next_pay, 'amount as counted in the walk:', r.accounts.b.why);
show('S5b headroom (pay of unknown yen must not count; 100,000 - 120,000 rent = shortfall)', r.accounts.b.headroom, -20000);
