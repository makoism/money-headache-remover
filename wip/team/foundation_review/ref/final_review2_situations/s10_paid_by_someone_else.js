// S10: a parent pays the 40,000 card statement due 10 Feb directly to the card company. The person records a
// card payment from no account of theirs (outside). Right: bank unchanged 300,000; card owed 0; nothing due.
const { lookahead, sc, bank, show } = require('./base');
const card = { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
  payment: { day: 10, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'move later' },
  opening: { date: '2027-01-04', statement: { closed: '2026-12-15', amount: 0, paid: true }, current: 0 } };
const s = sc({ accounts: [bank('b', '2027-01-04', 300000), card], events: [
  { id: 'e1', date: '2027-01-08', told: '2027-01-08T12:00', kind: 'spend', account: 'c', amount: 40000 },
  { id: 'p1', date: '2027-02-09', told: '2027-02-09T12:00', kind: 'repay', to: 'c', amount: 40000, settles: 'c@2027-02-10', note: 'paid by a parent' } ] });
const r = lookahead(s, '2027-02-12');
show('S10 bank', r.accounts.b.bank, 300000);
show('S10 card owed', r.cards.c.owedNow, 0);
console.log('     not seen', JSON.stringify(r.notSeenYet.items), ' headroom', r.accounts.b.headroom);
