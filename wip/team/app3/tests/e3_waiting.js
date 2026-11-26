#!/usr/bin/env node
/* [qc-novice C4; M13 M36 M51] a pay or bill change saved for a later day is shown as waiting: the Plan row says
   "Changes on <day>: <amount>, <rhythm>", and the sheet opened again says the same above the boxes (which keep showing what
   is in force today). Made-up book (e3_act_book.js), 25 Nov 2026: Main job 180,000 on day 10; changed from 15 Dec to
   245,000 on day 15. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25', MAIN = 'k7m2qa-f3n8p1x6wd-4', RENT = 'k7m2qa-f3n8p1x6wd-6';
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(require('os').tmpdir() + '/a3wt-') });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); await s.save(bk, { full: true }); s.close(); }, actBook());
  await p.reload(); await T.w(400);
  const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
  const fill = async (sel, v) => { await p.$eval(sel, (e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, v); };
  const row = id => p.$eval(`[data-pay="${id}"], [data-bill="${id}"]`, e => e.textContent.replace(/\s+/g, ' '));
  await p.tap('[data-tab="plan"]'); await T.w(300);
  ck('C4: before, no change waiting on the row', !/Changes on/.test(await row(MAIN)), await row(MAIN));
  await p.click(`[data-pay="${MAIN}"]`); await T.w(300);
  await fill('#pl-amount', '245000'); await fill('#pl-day', '15'); await fill('#pl-from', '2026-12-15');
  await btn('Save'); await T.w(600);
  let t = await row(MAIN);
  ck('C4: the Plan row says the change is waiting', /Changes on 15 Dec: ¥245,000, day 15 each month/.test(t), t);
  ck('C4: the row still shows the next pay as it is', /next 10 Dec/.test(t), t);
  await p.click(`[data-pay="${MAIN}"]`); await T.w(300);
  const form = await p.$eval('[data-card="plan-form"]', e => e.textContent.replace(/\s+/g, ' '));
  ck('C4: the sheet opened again says a change is waiting', /A change is waiting: from 15 Dec, ¥245,000, day 15 each month/.test(form), form.slice(0, 300));
  ck('C4: its boxes show what is in force today', (await p.$eval('#pl-amount', e => e.value)).replace(/\D/g, '') === '180000' && (await p.$eval('#pl-day', e => e.value)) === '10');
  await p.click('#plBack'); await T.w(200);
  /* a bill too */
  await p.click(`[data-bill="${RENT}"]`); await T.w(300);
  await fill('#pl-amount', '75000'); await fill('#pl-from', '2027-01-01');
  await btn('Save'); await T.w(600);
  t = await row(RENT);
  ck('C4: a bill change for later shows on its row', /Changes on 1 Jan 2027: ¥75,000/.test(t), t);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_waiting');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
