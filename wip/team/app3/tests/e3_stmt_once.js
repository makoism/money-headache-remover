#!/usr/bin/env node
/* BI2 on the page: after a statement is read, Receipts lists each record once. Walk 2's made-up book
   (walk/v2/bookJan7.json) kept through the store, shown as on 15 Dec 2026: the statement's SUPER 3,000 and FOOD MART
   4,000 are the groceries and food typed before, and its two "TO TRIP ACCT" lines are the two moves. Receipts lists
   through the engine's countOnce, so each pair is one row and the moves stay moves. */
'use strict';
const fs = require('fs'), path = require('path');
const T = require('./lib3.js'), { ck } = T;
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../walk/v2/bookJan7.json'), 'utf8'));
const book = raw.book || raw;
const DAY = '2026-12-15';
(async () => {
  const res = T.L.lookahead(book, DAY), away = Object.keys(res.dropped || {});
  ck('the engine sets the pairs aside (groceries, food, two trip lines, the ticked items)', away.length >= 11, away.length);
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3once-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  const put = await p.evaluate(async bk => { const s = await BurrowStore.open(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, book);
  ck('the walk\'s book is kept through the store', put && put.ok, JSON.stringify(put));
  await p.reload(); await T.w(400);
  await p.tap('[data-tab="receipts"]'); await T.w(300);
  const list = () => p.$$eval('#rcList [data-rc]', rs => rs.map(r => ({ id: r.dataset.rc, text: r.textContent.replace(/\s+/g, ' ').trim() })));
  const rows = await list();
  await p.click('#rcOlder'); await T.w(300);   // the period before pay, 10 Nov to 9 Dec, where the statement's lines fall
  rows.push(...await list());
  ck('Receipts lists rows', rows.length > 0, rows.length);
  ck('no row the engine set aside is listed', rows.every(r => !away.includes(r.id)), rows.filter(r => away.includes(r.id)).map(r => r.text).join(' | '));
  ck('no "TO TRIP ACCT" line beside the two moves', !rows.some(r => /TO TRIP/.test(r.text)) && rows.filter(r => /Moved to/.test(r.text)).length === 2, rows.map(r => r.text).join(' | '));
  const n = re => rows.filter(r => re.test(r.text)).length;
  ck('the 3,000 groceries is one row', n(/3,000/) === 1, rows.filter(r => /3,000/.test(r.text)).map(r => r.text).join(' | '));
  ck('the 4,000 food is one row', n(/4,000/) === 1, rows.filter(r => /4,000/.test(r.text)).map(r => r.text).join(' | '));
  await T.shot(p, 'stmt_once_receipts');
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_stmt_once');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
