'use strict';
// BI2: an imported line matched to a typed or ticked record is one record wherever money is listed or summed. The look
// ahead already sets such pairs aside; it now says which (`dropped`, with what holds each one), and countOnce() is the one
// function Receipts and the past periods count through. Walk 2's made-up book (app3/walk/v2/bookJan7.json), seen on
// 15 Dec 2026: the bank statement was read after groceries, food and two moves to the trip account were typed and the
// pay, bills and card payments were ticked.
const fs = require('fs'), path = require('path');
const { t, done, eq, ok } = require('./t.js');
const LA = require('../lookahead.js'), P = require('../periods.js');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../../app3/walk/v2/bookJan7.json'), 'utf8'));
const book = raw.book || raw;
const DAY = '2026-12-15';
const ev = f => book.events.filter(e => !e.gone && f(e));
const imp = (note, date) => ev(e => e.src && e.src.type === 'statement' && e.note === note && e.date === date)[0];
const typed = (note, date) => ev(e => e.note === note && e.date === date && !(e.src && e.src.type === 'statement'))[0];
const res = LA.lookahead(book, DAY);

t('the look ahead says what it set aside, and what holds each', () => {
  ok(res.dropped && typeof res.dropped === 'object');
  eq(res.dropped[typed('groceries', '2026-11-24').id], imp('SUPER', '2026-11-24').id);
  eq(res.dropped[typed('food', '2026-12-06').id], imp('FOOD MART', '2026-12-06').id);
});
t('a bank line moving money to the person\'s own account matches the move [BI2]', () => {
  const moves = ev(e => e.k === 'transfer' && (e.date === '2026-12-01' || e.date === '2026-12-05'));
  eq(moves.length, 2);
  for (const d of ['2026-12-01', '2026-12-05']) ok(moves.some(m => res.dropped[imp('TO TRIP ACCT', d).id] === m.id), d);
});
t('ticked pay, bills and card payments and their statement lines are one each', () => {
  const ticked = ev(e => String(e.id).startsWith('set:') && e.date <= DAY);
  ok(ticked.length >= 7);
  for (const s of ticked) {
    const pair = ev(e => e.src && e.src.type === 'statement' && (res.dropped[e.id] === s.id || res.dropped[s.id] === e.id));
    eq(pair.length, 1, s.id);
  }
});
t('countOnce lists each record once', () => {
  const once = LA.countOnce(book, res);
  const ids = new Set(once.map(e => e.id));
  for (const id of Object.keys(res.dropped)) ok(!ids.has(id), id);
  ok(once.every(e => !e.gone));
});
t('past periods count bills, money in and card payments once', () => {
  const ps = P.periods(book, DAY);
  const past = ps.past.find(p => p.start <= '2026-11-27' && p.end >= '2026-11-27');
  ok(past, 'a past period holding 27 Nov');
  eq(past.billsPaid.total, 72000 + 7400 + 5200);
  eq(ps.current.moneyIn.total, 180000 + 60000);
  eq(ps.current.cardPayments.total, 54000 + 23000);
});
done('count_once.test.js');
