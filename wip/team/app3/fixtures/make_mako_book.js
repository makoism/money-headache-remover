#!/usr/bin/env node
/* Makes app3/fixtures/mako_madeup_book.json: Mako's shape with MADE-UP yen (WIRING_PLAN 1.4 step 6). No real figures.
   The shape (DECISIONS "Mako's own money"): one bank; pay on the 10th as two incomes (180,000 and 60,000); two cards paid
   in full from the bank on the 10th and the 11th, close days "not sure" (each card is due in full on its payment day, H4);
   bills on their due days (rent, power, phone, internet); no minimum (M1: skipped means none); set up Fri 20 Nov 2026,
   after the November pay and card payments.
   The weekend where a card leaves before pay lands (WIRING_PLAN "Watch"): pay moves to the next working day and card B
   is taken the working day before. In January 2027 the 10th is a Sunday and the 11th a holiday, so card B leaves on
   Fri 8 Jan while both pays and card A land on Tue 12 Jan. Card spending after setup is dated ahead (22 Nov to 29 Dec),
   so the cards fill up as the shown day moves on.
   The scenario is turned into the saved shape by the engine's own converter, then every id is rewritten into the
   ordinary form the app makes (`<6>-<10>-<n>`, SCHEMA_V3 section 0; LESSONS lesson 3, second addendum).
   Run: node app3/fixtures/make_mako_book.js   (writes the file; --check only compares) */
'use strict';
const fs = require('fs'), path = require('path');
const conv = require('../../engine/test/scenario_to_book.js');

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
  ],
  // card spending after setup, dated ahead: the look ahead sees each one only from its day on
  events: [
    { id: 'sp1', date: '2026-11-22', kind: 'spend', account: 'card_b', amount: 3200 },
    { id: 'sp2', date: '2026-11-25', kind: 'spend', account: 'card_a', amount: 6800 },
    { id: 'sp3', date: '2026-12-04', kind: 'spend', account: 'card_a', amount: 12500 },
    { id: 'sp4', date: '2026-12-13', kind: 'spend', account: 'card_a', amount: 18000 },
    { id: 'sp5', date: '2026-12-15', kind: 'spend', account: 'card_b', amount: 9500 },
    { id: 'sp6', date: '2026-12-29', kind: 'spend', account: 'card_b', amount: 7400 }
  ]
};

// a fixed, made-up device part and session part, so the file is the same every time it is made
function ordinaryIds(book) {
  const map = {}; let n = 0;
  const idOf = old => (old == null ? old : map[old] || (map[old] = 'k7m2qa-' + 'f3n8p1x6wd' + '-' + (++n)));
  for (const a of book.accounts) { a.id = idOf(a.id); }
  for (const a of book.accounts) if (a.payFrom) a.payFrom = idOf(a.payFrom);
  for (const s of book.schedules) { s.id = idOf(s.id); s.acct = idOf(s.acct); }
  for (const e of book.events) { e.id = idOf(e.id); e.acct = idOf(e.acct); }
  const ex = JSON.stringify(book.events).match(/"(sp\d)"/); if (ex) throw new Error('a made-up short id is left: ' + ex[0]);
  book.home.main.v.acct = idOf(book.home.main.v.acct);
  const left = JSON.stringify(book).replace(/"type":"bank"/g, '').match(/"(bank|card_a|card_b|pay_main|pay_side|rent|power|phone|internet)"/);
  if (left) throw new Error('a made-up short id is left: ' + left[0]);
  return book;
}

const { book } = conv.convert ? conv.convert(SC) : conv(SC);
book.home.main = { v: { acct: 'bank', min: null } };
const out = ordinaryIds(book);
const file = path.join(__dirname, 'mako_madeup_book.json');
const text = JSON.stringify(out, null, 1) + '\n';
if (process.argv.includes('--check')) { const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text; console.log(same ? 'MAKO BOOK SAME' : 'MAKO BOOK DIFFERS'); process.exit(same ? 0 : 1); }
fs.writeFileSync(file, text); console.log('wrote ' + file + ' (' + text.length + ' bytes)');
