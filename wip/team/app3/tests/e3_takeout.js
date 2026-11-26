#!/usr/bin/env node
/* [qc-novice C3; M24 M46 M91] money taken out of a goal says where it went: back in the bank it is kept in, with no job
   yet, and what safe to spend does (goes up, or stays, and why). The words are on the Undo bar; Undo puts it back in
   the goal. Made-up book (e3_act_book.js): Free to spend left 40,000 this period caps safe to spend. 25 Nov 2026. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(require('os').tmpdir() + '/a3to-') });
  const bk0 = actBook(), bankName = bk0.accounts.find(a => a.id === bk0.home.main.v.acct).name;
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); await s.save(bk, { full: true }); s.close(); }, bk0);
  await p.reload(); await T.w(400);
  const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
  const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
  const bar = () => p.$eval('#a3Msg', e => e.textContent).catch(() => '');
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plAddGoal'); await T.w(300);
  await fill('#pl-name', 'Seoul trip'); await fill('#pl-target', '100000'); await btn('Add'); await T.w(500);
  let bk = await saved(p);
  const g = bk.places.find(x => x.name === 'Seoul trip' && !x.gone);
  await p.click(`[data-goal="${g.id}"]`); await T.w(300);
  await fill('#pl-amount', '20000'); await btn('Set aside'); await T.w(500);
  const s0 = T.L.lookahead(await saved(p), DAY).safeToSpend.headline;
  await p.click(`[data-goal="${g.id}"]`); await T.w(300);
  await fill('#pl-amount', '15000'); await btn('Take out'); await T.w(500);
  bk = await saved(p);
  const r = T.L.lookahead(bk, DAY);
  ck('C3: 15,000 is out of the goal', (r.places[g.id] || {}).kept === 5000, JSON.stringify(r.places[g.id]));
  const t = await bar();
  ck('C3: the bar says where it went: back in the bank, with no job yet', new RegExp(`Taken out of Seoul trip: ¥15,000 is back in ${bankName}, with no job yet`).test(t), t);
  const stays = r.safeToSpend.headline === s0;
  ck('C3: the bar says what safe to spend does, as the engine has it', stays ? new RegExp(`Safe to spend stays ¥${s0.toLocaleString('en-US')}, it's what's left of your Free to spend`).test(t) : new RegExp(`Safe to spend goes up to ¥${r.safeToSpend.headline.toLocaleString('en-US')}`).test(t), t + ' | ' + s0 + ' ' + r.safeToSpend.headline);
  await p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); }); await T.w(500);
  ck('C3: Undo puts it back in the goal', (T.L.lookahead(await saved(p), DAY).places[g.id] || {}).kept === 20000);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_takeout');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
