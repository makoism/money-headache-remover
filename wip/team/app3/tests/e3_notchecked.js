#!/usr/bin/env node
/* [qc-novice C7, coordinator 18's ruling; M36 M7] an account added as money moved from the main bank opens at 0 the day
   before the move: nobody has looked at it, so it never reads "checked <that day>". Home, Check your bank and the
   figures sent to the assistant say "not checked yet" until a figure is typed for it; then the usual words come back.
   An account added with what it holds today keeps "checked today". Made-up book (e3_act_book.js), 25 Nov 2026. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const ASK = require('../src/ask3_core.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(require('os').tmpdir() + '/a3nc-') });
  const bk0 = actBook();
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); await s.save(bk, { full: true }); s.close(); }, bk0);
  await p.reload(); await T.w(400);
  const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
  const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
  const add = async (name, amt, moved) => {
    await p.tap('[data-tab="plan"]'); await T.w(300);
    await p.click('#plAddAcct'); await T.w(300);
    await fill('#pl-name', name); await fill('#pl-amount', amt); await p.select('#pl-source', moved ? 'moved' : 'new');
    if (moved) await p.$eval('#pl-date', e => { e.value = '2026-11-23'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await btn('Add'); await T.w(500);
  };
  await add('Trip savings', '20000', true);
  await add('Gift jar', '3000', false);
  let bk = await saved(p);
  const ts = bk.accounts.find(a => a.name === 'Trip savings' && !a.gone).id, gj = bk.accounts.find(a => a.name === 'Gift jar' && !a.gone).id;
  const age = async id => { await p.tap('[data-tab="home"]'); await T.w(300); return p.$eval(`#a3Home [data-card=bank][data-acct="${id}"] [data-fig=age]`, e => e.textContent); };
  let t = await age(ts);
  ck('C7: Home says the moved account is not checked yet', /not checked yet/i.test(t) && !/checked 22 Nov|checked 2 days|\(checked/.test(t), t);
  t = await age(gj);
  ck('C7: an account added with what it holds today still says checked today', /checked today/.test(t), t);
  /* Check your bank */
  await p.click('#a3CheckGo'); await T.w(400);
  t = await p.$eval(`#a3Check [data-expected="${ts}"]`, e => e.textContent).catch(() => 'no row');
  ck('C7: Check your bank says not checked yet for it', /not checked yet/.test(t) && !/last checked/.test(t), t);
  /* the figures sent to the assistant */
  const sum = ASK.summary(bk, DAY).text, line = sum.split('\n').find(l => / Trip savings /.test(l)) || '';
  ck('C7: the assistant is told it is not checked yet', /not checked yet/.test(line) && !/checked \d+ days ago/.test(line), line);
  /* a figure typed for it: the usual words come back */
  await p.$eval(`#a3Check [data-bankfig="${ts}"]`, e => { e.value = '20000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.click('#a3CheckSave'); await T.w(600);
  t = await age(ts);
  ck('C7: once checked, Home says checked today', /checked today/.test(t) && !/not checked/.test(t), t);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_notchecked');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
