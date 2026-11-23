// S1: ATM cash. Typed as a transfer bank -> cash 10,000 on Wed 6 Jan. A week later the bank statement
// shows "ATM 10,000 out" on 6 Jan (a statement reader sees only money out of the bank).
// S1b: Mako ticks the card payment at the check-in (repay 50,000 bank -> card), then imports the bank
// statement, which shows the 50,000 debit as a line out.
const { lookahead, sc, bank, show } = require('./base');
const cash = { id: 'cash', name: 'cash', kind: 'cash', currency: 'JPY', minimum: 0, opening: { date: '2027-01-04', amount: 0 } };
let s = sc({ accounts: [bank('b', '2027-01-04', 100000), cash], events: [
  { id: 't1', date: '2027-01-06', told: '2027-01-06T12:00', kind: 'transfer', from: 'b', to: 'cash', amount: 10000 },
  { id: 'i1', date: '2027-01-06', posted: '2027-01-06', told: '2027-01-13T09:00', kind: 'spend', account: 'b', amount: 10000, source: 'statement' } ] });
let r = lookahead(s, '2027-01-14');
show('S1 bank after the statement', r.accounts.b.bank, 90000);
show('S1 cash', r.accounts.cash.bank, 10000);
// card
const card = { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
  payment: { day: 10, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'move later' },
  opening: { date: '2027-01-04', statement: { closed: '2026-12-15', amount: 50000, paid: false }, current: 50000 } };
s = sc({ accounts: [bank('b', '2027-01-04', 300000), card], events: [
  { id: 'set:c@2027-01-10', date: '2027-01-11', told: '2027-01-11T20:00', kind: 'repay', from: 'b', to: 'c', amount: 50000, settles: 'c@2027-01-10' },
  { id: 'i2', date: '2027-01-11', posted: '2027-01-11', told: '2027-01-18T09:00', kind: 'spend', account: 'b', amount: 50000, source: 'statement', note: 'JCB debit' } ] });
r = lookahead(s, '2027-01-18');
show('S1b bank after the statement', r.accounts.b.bank, 250000);
show('S1b card owed', r.cards.c.owedNow, 0);
// same with the import typed as a repay line (a reader that knows it is the card)
s.events[1] = { id: 'i2', date: '2027-01-11', posted: '2027-01-11', told: '2027-01-18T09:00', kind: 'repay', from: 'b', to: 'c', amount: 50000, source: 'statement' };
r = lookahead(s, '2027-01-18');
show('S1c (import read as a repay) bank', r.accounts.b.bank, 250000);
show('S1c card owed', r.cards.c.owedNow, 0);
