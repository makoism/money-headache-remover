// S4: an e-wallet top-up of 1,000 PHP from the bank costs a 15 fee each time (bank out 1,015, e-wallet in 1,000).
// A schedule tops up on the 1st and 16th. The person ticks the top-up at the check-in and edits the amount to
// what left the bank (1,015), as the check-in lets them. SCHEMA_V3 6.2: between two accounts in one currency
// `a2` is left out, so the record cannot say 1,000 arrived.
const { lookahead, sc, show } = require('./base');
const H = { country: 'none', dates: [], bank_closed: [] };
const acc = (id, kind, amt) => ({ id, name: id, kind, currency: 'PHP', minimum: 0, opening: { date: '2027-01-04', amount: amt } });
let s = { currency: 'PHP', holidays: H, income: [], goals: [],
  accounts: [acc('b', 'bank', 20000), acc('g', 'ewallet', 0)],
  bills: [{ id: 'top', name: 'Top-up', kind: 'transfer', account: 'b', to: 'g', amount: 1000, schedule: { frequency: 'monthly', days: [1, 16] }, weekend_holiday: 'none' }],
  events: [ { id: 'set:top@2027-01-16', date: '2027-01-16', told: '2027-01-17T09:00', kind: 'transfer', from: 'b', to: 'g', amount: 1015, settles: 'top@2027-01-16' } ] };
let r = lookahead(s, '2027-01-17');
show('S4 bank', r.accounts.b.bank, 1898500);
show('S4 e-wallet', r.accounts.g.bank, 100000);
// with a2 given (the model reads amount_in), the shape forbids it in one currency
s.events[0] = Object.assign({}, s.events[0], { amount_out: 1015, amount_in: 1000 });
r = lookahead(s, '2027-01-17');
show('S4b with a2 (forbidden by 6.2 in one currency) e-wallet', r.accounts.g.bank, 100000);
// the next top-up in the walk: expected 1,000 off the bank, really 1,015
console.log('     bank safe to spend', r.accounts.b.headroom, '(each future top-up is 15 short: the schedule has one amount for both sides)');
