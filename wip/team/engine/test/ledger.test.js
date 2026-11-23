'use strict';
const { t, done, eq, ok } = require('./t.js');
const L = require('../ledger.js');

const home = { curs: [{ from: '2026-11-01', cur: 'JPY' }], mode: { v: 'track' }, main: { v: { acct: 'b', min: null } } };
const accounts = [
  { id: 'b', type: 'bank', cur: 'JPY' }, { id: 'w', type: 'ewallet', cur: 'JPY' }, { id: 'cash', type: 'cash', cur: 'JPY' },
  { id: 'ca', type: 'card', cur: 'JPY', inFull: true }, { id: 'pl', type: 'paylater', cur: 'JPY' },
  { id: 'usd', type: 'ewallet', cur: 'USD' }, { id: 'loan', type: 'loan', cur: 'JPY' },
];
const book = events => ({ v: 3, home, accounts, places: [{ id: 'trip', kind: 'goal', keptIn: { acct: 'b', mode: 'inBank' } }], events });
const ev = (id, k, more) => Object.assign({ id, k, date: '2026-11-20' }, more);

t('an opening split by place, the rest in Waiting [B2, B6]', () => {
  const p = L.placesOf(book([ev('o', 'open', { acct: 'b', a: 300000, split: { places: { trip: 50000 }, lines: { food: 20000 }, free: 30000 } })]));
  eq(p.places.trip, 50000); eq(p.places.free, 30000); eq(p.places.bills, 20000); eq(p.places.waiting, 200000);
  eq(p.total, 300000);
});
t('the one rule holds for every kind [LEDGER_DESIGN]', () => {
  const list = [
    ev('o1', 'open', { acct: 'b', a: 300000 }), ev('o2', 'open', { acct: 'ca', a: 12000 }), ev('o3', 'open', { acct: 'usd', a: 5000 }),
    ev('e1', 'in', { acct: 'b', a: 250000 }), ev('e2', 'spend', { acct: 'b', a: 3000, place: 'free' }),
    ev('e3', 'spend', { acct: 'ca', a: 4000, place: 'free' }), ev('e4', 'repay', { acct: 'b', acct2: 'ca', a: 16000 }),
    ev('e5', 'transfer', { acct: 'b', acct2: 'w', a: 10150, a2: 10000 }), ev('e6', 'spend', { acct: 'b', a: 150, of: 'e5', line: 'fees' }),
    ev('e7', 'borrow', { acct: 'ca', acct2: 'cash', a: 2000 }), ev('e8', 'borrow', { acct: 'loan', acct2: 'b', a: 50000 }),
    ev('e9', 'spend', { acct: 'pl', a: 9000 }), ev('e10', 'repay', { acct: 'b', acct2: 'pl', a: 3000 }),
    ev('e11', 'convert', { acct: 'b', acct2: 'usd', a: 15000, a2: 10000 }), ev('e12', 'move', { place: 'waiting', place2: 'trip', a: 7000 }),
    ev('e13', 'adjust', { acct: 'b', a: -1200 }), ev('e14', 'in', { acct: 'ca', a: 500 }), ev('e15', 'repay', { acct2: 'ca', a: 1000 }),
    ev('e16', 'spend', { acct: 'b', a: 2000, place: 'trip' }), ev('e17', 'check', { acct: 'b', a: 1 }),
  ];
  for (let i = 1; i <= list.length; i++) {
    const r = L.proof(book(list.slice(0, i)));
    ok(r.ok, `after ${list[i - 1].id}: total ${r.total}, have ${r.have}, cards ${r.cards}`);
  }
});
t('a fee comes out of the place its record names, else Free to spend; the account moves by `a` once [Q2, S5]', () => {
  const base = [ev('o', 'open', { acct: 'b', a: 100000, split: { free: 20000, places: { trip: 10000 } } })];
  let p = L.placesOf(book(base.concat([ev('t', 'transfer', { acct: 'b', acct2: 'w', a: 1015, a2: 1000 }), ev('fee:t', 'spend', { acct: 'b', a: 15, of: 't', line: 'fees' })])));
  eq(p.accounts.b, 98985); eq(p.accounts.w, 1000); eq(p.places.free, 19985);
  p = L.placesOf(book(base.concat([ev('t', 'transfer', { acct: 'b', acct2: 'w', a: 1015, a2: 1000 }), ev('fee:t', 'spend', { acct: 'b', a: 15, of: 't', line: 'fees', place: 'trip' })])));
  eq(p.places.free, 20000); eq(p.places.trip, 9985); eq(p.accounts.b, 98985);
});
t('a borrow raises the card or loan and the account it lands in [O5, Q3]', () => {
  const p = L.placesOf(book([ev('e7', 'borrow', { acct: 'ca', acct2: 'cash', a: 2000 }), ev('e8', 'borrow', { acct: 'loan', acct2: 'b', a: 50000 })]));
  eq(p.accounts.ca, 2000); eq(p.accounts.cash, 2000); eq(p.accounts.loan, 50000); eq(p.accounts.b, 50000);
});
t('a repay with no paying account lowers what is owed and takes nothing from the person [Q watch]', () => {
  const p = L.placesOf(book([ev('o', 'open', { acct: 'ca', a: 5000 }), ev('r', 'repay', { acct2: 'ca', a: 5000 })]));
  eq(p.accounts.ca, 0); eq(p.total, 0);
});
t('a removed event counts for nothing; a filler moves no account', () => {
  const p = L.placesOf(book([ev('o', 'open', { acct: 'b', a: 1000 }), ev('s', 'spend', { acct: 'b', a: 100, gone: '2026-11-21' }), ev('f', 'filler', { acct: 'b' })]));
  eq(p.accounts.b, 1000);
});
t('the change one event makes to an account, in its own sign (owed accounts: what is owed)', () => {
  const by = { b: accounts[0], ca: accounts[3], loan: accounts[6], w: accounts[1] };
  eq(L.accountMoves(ev('x', 'spend', { acct: 'ca', a: 400 }), by), [['ca', 400]]);
  eq(L.accountMoves(ev('x', 'transfer', { acct: 'b', acct2: 'w', a: 1015, a2: 1000 }), by), [['b', -1015], ['w', 1000]]);
  eq(L.accountMoves(ev('x', 'repay', { acct: 'b', acct2: 'ca', a: 400 }), by), [['b', -400], ['ca', -400]]);
  eq(L.accountMoves(ev('x', 'borrow', { acct: 'loan', acct2: 'b', a: 9 }), by), [['loan', 9], ['b', 9]]);
  eq(L.accountMoves(ev('x', 'spend', { acct: 'b', a: 15, of: 't' }), by), []);
});
done('ledger');
