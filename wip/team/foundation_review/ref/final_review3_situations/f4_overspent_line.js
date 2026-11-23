// F4. Yen only. Bank 100,000 set up Thu 10 Dec (pay day), Food 40,000 a month (split 40,000), Free to spend
// 30,000 (split 30,000). Pay 300,000 on the 10th. Rent 120,000 on the 27th. Sat 12 Dec: 50,000 of food (a big
// shop for a party). Food is 10,000 over.
// Right on 12 Dec: bank 50,000. Food has nothing left to reserve (0, never less). Free to spend 30,000 held.
// Walk: 50,000 - 0 (Food) ... rent 120,000 on 27 Dec, before pay on 8 Jan: 50,000 - 120,000 = -70,000 lowest.
// The overspent 10,000 must not come back into safe to spend.
const { lookahead, H, show } = require('./base');
const sc = { currency: 'JPY', main_bank: 'b', holidays: H, goals: [],
  accounts: [{ id: 'b', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-12-10', amount: 100000, split: { lines: { food: 40000 }, free: 30000 } } }],
  plan: { lines: [{ id: 'food', name: 'Food', per: 'month', amount: 40000 }], free: { per: 'month', amount: 30000 } },
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 300000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
  bills: [{ id: 'rent', name: 'Rent', account: 'b', amount: 120000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'none' }],
  events: [{ id: 'e1', kind: 'spend', account: 'b', amount: 50000, line: 'food', date: '2026-12-12', told: '2026-12-12T12:00' }] };
const r = lookahead(sc, '2026-12-12');
console.log('     why:', r.accounts.b.why);
show('lowest point before pay', r.accounts.b.lowest, -70000);
