// S3: a loan of 500,000 taken on 1 Mar 2027, landing in the bank, paid back 25,000 on the 27th. The person
// already had the loan account from setup (a credit line, opened at 0) and draws on it.
// S3b: a pay-later account (opened at setup with 0 owed) is used for a second buy of 30,000 in 3 parts.
const { lookahead, sc, bank, show } = require('./base');
const loan = { id: 'L', name: 'Credit line', kind: 'loan', currency: 'JPY', apr: 0,
  payment: { day: 27, from: 'b', amount: 25000, weekend_holiday: 'none' }, opening: { date: '2027-01-04', owed: 0 } };
let s = sc({ accounts: [bank('b', '2027-01-04', 100000), loan], events: [
  { id: 'd1', date: '2027-03-01', told: '2027-03-01T12:00', kind: 'borrow', from: 'L', to: 'b', amount: 500000 } ] });
let r = lookahead(s, '2027-03-02');
show('S3 bank', r.accounts.b.bank, 600000);
show('S3 loan owed', r.owed.L.owedNow, 500000);
console.log('     loan next:', JSON.stringify(r.owed.L.next), ' headroom', r.accounts.b.headroom);
const pl = { id: 'P', name: 'Pay-later', kind: 'paylater', currency: 'JPY', apr: 0,
  payment: { day: 20, from: 'b', amount: 10000, weekend_holiday: 'none' }, opening: { date: '2027-01-04', owed: 0 } };
s = sc({ accounts: [bank('b', '2027-01-04', 100000), pl], events: [
  { id: 'p1', date: '2027-02-05', told: '2027-02-05T12:00', kind: 'spend', account: 'P', amount: 30000, note: 'a fridge in three parts' } ] });
r = lookahead(s, '2027-02-06');
show('S3b pay-later owed', r.owed.P.owedNow, 30000);
console.log('     pay-later next:', JSON.stringify(r.owed.P.next), ' headroom', r.accounts.b.headroom, '(right 70,000 after three parts in the horizon or 90,000 with one)');
