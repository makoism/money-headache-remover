// F9. Switching banks. The main bank `old` holds 200,000 and carries Food (40,000 a month) and Free to spend
// (60,000 a month), both naming no account, so they are on home.mainBank [O4]. Set up Mon 11 Jan 2027 (pay day,
// split Food 40,000, Free 60,000). A new bank `b` opens the same day at 0. Pay 250,000 on the 10th lands in `old`
// (the person will move it later). Fri 15 Jan they close `old`: the closing transfers its 200,000 to `b`. R4 asks
// for a new account for cards paid from it and places kept in it, but nothing moves home.mainBank, the budget lines'
// `acct` or the Free to spend share's `acct`.
// Right on 15 Jan: nothing was spent; 200,000 in `b`; Food 40,000 held; headline 60,000 (Free to spend).
const { lookahead, H, show } = require('./base');
const sc = { currency: 'JPY', main_bank: 'old', holidays: H, goals: [], bills: [],
  accounts: [{ id: 'old', name: 'Old bank', kind: 'bank', currency: 'JPY', minimum: 0, closed: '2027-01-15', opening: { date: '2027-01-11', amount: 200000, split: { lines: { food: 40000 }, free: 60000 } } },
             { id: 'b', name: 'New bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2027-01-11', amount: 0 } }],
  plan: { lines: [{ id: 'food', name: 'Food', per: 'month', amount: 40000 }], free: { per: 'month', amount: 60000 } },
  income: [{ id: 'pay', name: 'Pay', account: 'old', amount: 250000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
  events: [{ id: 'close:old', kind: 'transfer', from: 'old', to: 'b', amount: 200000, date: '2027-01-15', told: '2027-01-15T10:00' }] };
const r = lookahead(sc, '2027-01-15');
console.log('     old:', r.accounts.old.why, '| new:', r.accounts.b.why);
show('headline on 15 Jan', r.safeToSpend.headline, 60000);
