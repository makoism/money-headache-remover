// S9: a laptop of 120,000 bought on the card on 20 Jan 2027 in 12 monthly parts of 10,000 (0% plan, common on
// Philippine and Japanese cards). Each statement asks only for that month's part. The card closes on the 15th,
// paid on the 10th of the next month. The shape has `of` (an instalment plan: the card's id) and no rule or ask.
const { lookahead, sc, bank, show } = require('./base');
const card = { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
  payment: { day: 10, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'move later' },
  opening: { date: '2027-01-04', statement: { closed: '2026-12-15', amount: 0, paid: true }, current: 0 } };
const s = sc({ accounts: [bank('b', '2027-01-04', 300000), card], events: [
  { id: 'e1', date: '2027-01-20', told: '2027-01-20T12:00', kind: 'spend', account: 'c', amount: 120000, note: 'laptop, 12 parts' } ] });
let r = lookahead(s, '2027-02-16');
show('S9 card due 10 Mar', r.cards.c.next.amount, 10000);
s.events.push({ id: 'set:c@2027-03-10', date: '2027-03-10', told: '2027-03-10T20:00', kind: 'repay', from: 'b', to: 'c', amount: 10000, settles: 'c@2027-03-10' });
r = lookahead(s, '2027-03-16');
show('S9 card due 12 Apr after paying the first part', r.cards.c.next.amount, 10000);
console.log('     card owed now', r.cards.c.owedNow, '(110,000 still owed on the plan)', ' bank headroom', r.accounts.b.headroom, '(right 290,000 - 10,000 = 280,000 before pay)');
