// S5c: a remote worker in the Philippines paid 200,000 JPY a month, converted on arrival into a PHP bank (about 75,000.00 PHP).
const { lookahead, show } = require('./base');
const H = { country: 'none', dates: [], bank_closed: [] };
const s = { currency: 'PHP', holidays: H, goals: [],
  accounts: [{ id: 'b', name: 'b', kind: 'bank', currency: 'PHP', minimum: 0, opening: { date: '2027-01-04', amount: 10000 } }],
  bills: [{ id: 'rent', name: 'Rent', account: 'b', amount: 20000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'none' }],
  income: [ { id: 'pay', name: 'Pay (JPY)', account: 'b', currency: 'JPY', amount: 200000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true } ],
  events: [] };
const r = lookahead(s, '2027-01-20');
console.log('S5c', r.accounts.b.why);
console.log('     right: the yen pay is not a peso figure; the walk cannot count 200,000 of it as pesos (stage 2 converts; until then not counted, with a warning)');
