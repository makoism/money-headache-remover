#!/usr/bin/env node
/* Walk 4 fixes, made-up yen.
   Plan: a late or outstanding pay shows its own amount, not the next one's. Main job rises to 185,000 from 1 Jan; on
   11 Jan the 10 Dec pay of 180,000 is still not seen, so its row says 180,000 (scheduleView outstanding[].amount).
   Receipts: a statement row that stands for a typed record shows the typed note beside the statement's words,
   "SUPER (groceries)", and search finds the typed note (walk 2's book, 15 Dec). */
'use strict';
const fs = require('fs'), path = require('path');
const T = require('./lib3.js'), { ck } = T;
async function keep(p, bk) { return p.evaluate(async b => { const s = await BurrowStore.open(); const r = await s.save(b, { full: true }); if (s.db) s.db.close(); return r; }, bk); }
(async () => {
  /* ---- Plan: the outstanding pay's own amount ---- */
  {
    const DAY = '2027-01-11', bk = T.book();
    const job = bk.schedules.find(s => s.name === 'Main job');
    job.steps.push({ from: '2027-01-01', amount: 185000 });
    const v = require('../../engine/periods.js').scheduleView(bk, DAY)[job.id];
    ck('the case: the 10 Dec pay of 180,000 is outstanding, the pays after it are 185,000', v.outstanding.length && v.outstanding[0].amount === 180000 && v.next.amount === 185000, JSON.stringify(v));
    const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3w4p-');
    const { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await keep(p, bk); await p.reload(); await T.w(400);
    await p.tap('[data-tab="plan"]'); await T.w(300);
    const row = await p.$eval(`[data-pay="${job.id}"]`, e => ({ text: e.textContent.replace(/\s+/g, ' '), amt: Number((e.querySelector('[data-amt]') || {}).dataset.amt) })).catch(e => ({ err: e.message }));
    ck('the row shows the outstanding pay\'s 180,000, not the next 185,000', row.amt === 180000, JSON.stringify(row));
    ck('the words name the outstanding pay with its own amount, and the next with its own', /due 10 Dec 2026, not seen yet, ¥180,000, due 8 Jan \(10 Jan is a Sunday, so the working day before\), late, ¥185,000, next 10 Feb, ¥185,000/.test(row.text), row.text);
    await T.shot(p, 'walk4_plan_outstanding');
    ck('no page errors (plan)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- Receipts: the typed note beside the statement's words ---- */
  {
    const DAY = '2026-12-15';
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../walk/v2/bookJan7.json'), 'utf8'));
    const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3w4r-');
    const { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await keep(p, raw.book || raw); await p.reload(); await T.w(400);
    await p.tap('[data-tab="receipts"]'); await T.w(300);
    await p.click('#rcOlder'); await T.w(300);
    const rows = await p.$$eval('#rcList [data-rc]', rs => rs.map(r => r.textContent.replace(/\s+/g, ' ').trim()));
    ck('the statement row shows the typed note: "SUPER (groceries)"', rows.some(t => /SUPER \(groceries\)/.test(t)), rows.join(' | '));
    ck('and "FOOD MART (food)"', rows.some(t => /FOOD MART \(food\)/.test(t)), rows.join(' | '));
    await p.type('#rcSearch', 'groceries'); await T.w(300);
    const found = await p.$$eval('#rcList [data-rc]', rs => rs.map(r => r.textContent.replace(/\s+/g, ' ').trim()));
    ck('search finds the row by the typed note', found.length === 1 && /SUPER \(groceries\)/.test(found[0]), found.join(' | '));
    await T.shot(p, 'walk4_receipts_note');
    ck('no page errors (receipts)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_walk4');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
