// S2: a closed card with a credit (refund after the last statement was paid); the card company sends the credit to the bank.
// Also: a cash advance from the card into the bank.
const { lookahead, sc, bank } = require('./base');
const card = { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
  payment: { day: 10, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'move later' },
  opening: { date: '2027-01-04', statement: { closed: '2026-12-15', amount: 0, paid: true }, current: 0 } };
const s = sc({ accounts: [bank('b', '2027-01-04', 100000), card], events: [
  { id: 'r1', date: '2027-01-20', kind: 'refund', account: 'c', amount: 3000, note: 'refund after the card was closed' },
  { id: 'x1', date: '2027-02-20', kind: 'transfer', from: 'c', to: 'b', amount: 3000, note: 'card company returns the credit to the bank' } ] });
let r = lookahead(s, '2027-02-25');
console.log('S2a credit sent to bank: bank', r.accounts.b.bank, '(103000 right); card owed', r.cards.c.owedNow, '(0 right); total after cards', r.total.afterCards, '(103000 right)');
const s2 = sc({ accounts: [bank('b', '2027-01-04', 100000), card], events: [
  { id: 'a1', date: '2027-01-20', kind: 'transfer', from: 'c', to: 'b', amount: 20000, note: 'cash advance into the bank' } ] });
r = lookahead(s2, '2027-01-25');
console.log('S2b cash advance: bank', r.accounts.b.bank, '(120000 right); card owed', r.cards.c.owedNow, '(20000 right); afterCards', r.total.afterCards, '(100000 right); headroom', r.accounts.b.headroom, '; card next', JSON.stringify(r.cards.c.next));
