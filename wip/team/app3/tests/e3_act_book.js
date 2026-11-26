/* A made-up book for the act3 and Receipts tests: the made-up Mako book (fixtures/mako_madeup_book.json) plus a plan
   (Free to spend 60,000 a month and Food 40,000 a month, both on the main bank), a cash wallet holding 10,000, a small
   savings bank holding 50,000 and a car loan, set up the same day. Every amount is made up. */
'use strict';
const path = require('path'), fs = require('fs');
const AT = '2026-11-20T21:00:00.000+09:00';
const ID = n => 'k7m2qa-f3n8p1x6wd-' + n;
const WALLET = ID(81), SAVINGS = ID(82), LOAN = ID(83), FOOD = ID(91);
function actBook() {
  const b = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
  const bank = b.home.main.v.acct, rec = x => Object.assign({ told: AT, at: AT, by: 'k7m2qa' }, x);
  b.accounts.push(rec({ id: WALLET, name: 'Wallet', type: 'cash', cur: 'JPY', owner: null }));
  b.accounts.push(rec({ id: SAVINGS, name: 'Savings', type: 'bank', cur: 'JPY', owner: null, spendFrom: false }));
  b.accounts.push(rec({ id: LOAN, name: 'Car loan', type: 'loan', cur: 'JPY', owner: null }));
  for (const [n, acct, a] of [[84, WALLET, 10000], [86, SAVINGS, 50000]]) {
    b.events.push(rec({ id: ID(n), k: 'open', acct, date: '2026-11-20', a, told: '2026-11-20T24:00', grp: 'setup' }));
    b.events.push(rec({ id: ID(n + 1), k: 'check', acct, date: '2026-11-20', a, told: '2026-11-20T24:00', grp: 'setup' }));
  }
  b.plan = b.plan || {};
  b.plan.shares = [rec({ id: ID(90), from: '2026-11-20', cur: 'JPY', acct: bank, per: { free: 'month' }, free: 60000 })];
  b.plan.budgets = [rec({ id: FOOD, name: 'Food', place: 'bills', cur: 'JPY', acct: bank, per: 'month', from: '2026-11-20', steps: [{ from: null, amount: 40000 }] })];
  return b;
}

/* [qc-foundation confirm on monthrule, 26 Nov; M4, M7, M51] Food ended on 22 Nov and a new Food was added that day:
   two lines called Food in the book, only one of them live. Made-up figures (the act book's Food 40,000; the new one
   30,000). */
const NEW_FOOD = 'k7m2qa-f3n8p1x6wd-92';
function endedFoodBook() {
  const b = actBook(), old = b.plan.budgets.find(l => l.id === FOOD), AT2 = '2026-11-22T20:00:00.000+09:00';
  old.steps = old.steps.concat([{ from: '2026-11-22', amount: 0 }]); old.ends = '2026-11-22';
  b.plan.budgets.push({ id: NEW_FOOD, name: 'Food', place: 'bills', cur: 'JPY', acct: old.acct, per: 'month', from: '2026-11-22', steps: [{ from: null, amount: 30000 }], told: AT2, at: AT2, by: 'k7m2qa' });
  return b;
}
module.exports = { actBook, WALLET, SAVINGS, LOAN, FOOD, NEW_FOOD, endedFoodBook };
