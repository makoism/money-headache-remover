'use strict';
// Mako's shape with MADE-UP yen, as a scenario and as setup answers (the same life as app3/fixtures/make_mako_book.js):
// one bank; pay on the 10th as two incomes; two cards paid in full from the bank on the 10th and 11th, close days
// "not sure"; four bills; no minimum; set up Fri 20 Nov 2026. Every amount is made up. Test code only.
const SC = {
  life: 'mako_madeup', currency: 'JPY', holidays: { country: 'JP' }, main_bank: 'bank',
  accounts: [
    { id: 'bank', name: 'Main bank', kind: 'bank', currency: 'JPY', opening: { date: '2026-11-20', amount: 286000 } },
    { id: 'card_a', name: 'Card A', kind: 'card', currency: 'JPY', statement_close_day: null,
      payment: { day: 10, from: 'bank', pays: 'in full', weekend_holiday: 'move later' }, opening: { date: '2026-11-20', current: 54000 } },
    { id: 'card_b', name: 'Card B', kind: 'card', currency: 'JPY', statement_close_day: null,
      payment: { day: 11, from: 'bank', pays: 'in full', weekend_holiday: 'move earlier' }, opening: { date: '2026-11-20', current: 23000 } }
  ],
  income: [
    { id: 'pay_main', name: 'Main job', account: 'bank', amount: 180000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move later', starts_period: true },
    { id: 'pay_side', name: 'Side job', account: 'bank', amount: 60000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move later' }
  ],
  bills: [
    { id: 'rent', name: 'Rent', account: 'bank', amount: 72000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'move later' },
    { id: 'power', name: 'Power', account: 'bank', amount: 7400, schedule: { frequency: 'monthly', day: 26 }, weekend_holiday: 'move later' },
    { id: 'phone', name: 'Phone', account: 'bank', amount: 4800, schedule: { frequency: 'monthly', day: 20 }, weekend_holiday: 'move later' },
    { id: 'internet', name: 'Internet', account: 'bank', amount: 5200, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'move later' }
  ]
};
// The same life as the setup screens give it (engine/build_book.js)
const ANSWERS = {
  day: '2026-11-20', told: '2026-11-20T21:00+09:00', country: 'JP', currency: 'JPY',
  banks: [{ key: 'bank', name: 'Main bank', amount: 286000, main: true }],
  pays: [
    { key: 'pay_main', name: 'Main job', bank: 'bank', amount: 180000, every: 'month', day: 10, shift: 'after', startsPeriod: true },
    { key: 'pay_side', name: 'Side job', bank: 'bank', amount: 60000, every: 'month', day: 10, shift: 'after' }
  ],
  cards: [
    { key: 'card_a', name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'bank', shift: 'after' },
    { key: 'card_b', name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', payFrom: 'bank', shift: 'before' }
  ],
  bills: [
    { key: 'rent', name: 'Rent', from: 'bank', amount: 72000, day: 27, shift: 'after' },
    { key: 'power', name: 'Power', from: 'bank', amount: 7400, day: 26, shift: 'after' },
    { key: 'phone', name: 'Phone', from: 'bank', amount: 4800, day: 20, shift: 'after' },
    { key: 'internet', name: 'Internet', from: 'bank', amount: 5200, day: 27, shift: 'after' }
  ]
};
// the book the scenario converter makes (read with the built-in holiday tables: no opts)
function scenarioBook() {
  const { book } = require('./scenario_to_book.js').convert(SC);
  book.home.main = { v: { acct: 'bank', min: null } };
  return book;
}
module.exports = { SC, ANSWERS, scenarioBook };
