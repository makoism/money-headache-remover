#!/usr/bin/env node
/* [qc-novice C6, coordinator 18's ruling; M13 M23 M52 M53] Add an account asks plainly whether the money was moved:
   "Did you move this money from <main bank> after <its figure's day>?" with Yes and No (no more "Not taken from ... since
   its figure of ..." / "Moved from ... after its figure of ..."). Yes moves it out of the main bank on the day picked
   (never counted twice), No adds it as new money. Made-up book (e3_act_book.js), 25 Nov 2026, made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(require('os').tmpdir() + '/a3ask-') });
  const bk0 = actBook(), bank = bk0.home.main.v.acct, bankName = bk0.accounts.find(a => a.id === bank).name;
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); await s.save(bk, { full: true }); s.close(); }, bk0);
  await p.reload(); await T.w(400);
  const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
  const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plAddAcct'); await T.w(300);
  const q = await p.$eval('label[for="pl-source"]', e => e.textContent.trim());
  ck('C6: the question is plain: "Did you move this money from <bank> after 20 Nov?"', q === `Did you move this money from ${bankName} after 20 Nov?`, q);
  const opts = await p.$$eval('#pl-source option', os => os.map(o => [o.value, o.textContent.trim()]));
  ck('C6: the answers are No and Yes', JSON.stringify(opts) === JSON.stringify([['new', 'No'], ['moved', 'Yes']]), JSON.stringify(opts));
  const form = await p.$eval('[data-card="plan-form"]', e => e.textContent);
  ck('C6: no "Not taken from" or "its figure of" words', !/Not taken from|its figure of/.test(form), form.slice(0, 300));
  /* Yes: moved on 23 Nov, out of the main bank once */
  await fill('#pl-name', 'Trip savings'); await fill('#pl-amount', '20000'); await p.select('#pl-source', 'moved');
  await p.$eval('#pl-date', e => { e.value = '2026-11-23'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await btn('Add'); await T.w(500);
  let bk = await saved(p);
  const ts = bk.accounts.find(a => a.name === 'Trip savings' && !a.gone);
  ck('C6: Yes moves it from the main bank on the day picked', ts && bk.events.filter(e => !e.gone && e.k === 'transfer' && e.acct === bank && e.acct2 === ts.id && e.a === 20000 && e.date === '2026-11-23').length === 1);
  /* No: new money, nothing taken off */
  await p.click('#plAddAcct'); await T.w(300);
  await fill('#pl-name', 'Gift jar'); await p.select('#pl-type', 'cash'); await fill('#pl-amount', '3000'); await p.select('#pl-source', 'new');
  await btn('Add'); await T.w(500);
  bk = await saved(p);
  const gj = bk.accounts.find(a => a.name === 'Gift jar' && !a.gone);
  ck('C6: No adds it as new money', gj && bk.events.some(e => !e.gone && e.k === 'open' && e.acct === gj.id && e.a === 3000) && !bk.events.some(e => e.k === 'transfer' && e.acct2 === gj.id));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_addask');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
