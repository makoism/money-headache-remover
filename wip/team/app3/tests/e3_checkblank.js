#!/usr/bin/env node
/* Check your bank with a box left empty (qc-controls run 1 blocker 3, coordinator 16's ruling B; M13, M16).
   Made-up Mako book with a second place, Wallet cash 8,000. On 10 Dec the person types what Main bank shows (339,000)
   and leaves Wallet cash empty because they have not counted it: Save saves the bank, nothing is written for the wallet
   (blank means not looked today, as cards already allow), and Home still shows the wallet's older figure with its own
   day. Every box says it may be left blank. With every box empty and nothing ticked there is nothing to save, and the
   sheet says so in words, with Cancel still there. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const DAY = '2026-12-10';
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct, wallet = 'k7m2qa-f3n8p1x6wd-90';
  bk.accounts.push({ id: wallet, name: 'Wallet cash', type: 'cash', cur: 'JPY', owner: null, minBank: null });
  for (const k of ['open', 'check']) bk.events.push({ id: wallet + k, k, acct: wallet, date: '2026-11-20', a: 8000, told: '2026-11-20T24:00', grp: 'setup' });
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  const saved = await p.evaluate(async bk0 => { const s = await BurrowStore.open(); const r = await s.save(bk0, { full: true }); s.db && s.db.close(); return r; }, bk);
  ck('the book is saved through the store', saved && saved.ok, JSON.stringify(saved));
  await p.reload(); await T.w(400);
  await p.click('#a3CheckGo'); await T.w(300);
  const boxes = await p.$$eval('[data-bankfig]', es => es.map(e => ({ id: e.dataset.bankfig, hint: e.closest('.a3-field').textContent })));
  ck('both places have a box', boxes.length === 2, JSON.stringify(boxes.map(x => x.id)));
  ck('every bank and cash box says it may be left blank', boxes.every(x => /Leave it blank if you have not looked/.test(x.hint)), JSON.stringify(boxes.map(x => x.hint.slice(0, 120))));
  await p.tap(`[data-bankfig="${bank}"]`); await p.keyboard.type('339,000');
  await p.click('#a3CheckSave'); await T.w(500);
  ck('Save saved with the wallet left empty: the sheet closed', await p.$eval('#a3Check', e => e.hidden), await p.$eval('#a3CheckErr', e => e.textContent).catch(() => ''));
  await p.reload(); await T.w(400);
  const kept = await p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); s.close(); return r.copy.events.filter(e => e.k === 'check' && e.date === '2026-12-10').map(e => ({ acct: e.acct, a: e.a })); });
  ck('one check was written, for Main bank, 339,000', kept.length === 1 && kept[0].acct === bank && kept[0].a === 339000, JSON.stringify(kept));
  const f = await T.figs(p);
  const bankFig = f.filter(x => x.fig === 'bank').map(x => x.amt);
  ck('Home shows the bank figure typed', bankFig.includes(339000), JSON.stringify(bankFig));
  const text = await p.$eval('#a3Home', e => e.textContent);
  ck('Home still shows the wallet\'s older figure', /Wallet cash/.test(text) && /8,000/.test(text), text.slice(0, 300));
  /* every box empty and nothing ticked: nothing to save, said in words; Cancel is there */
  await p.click('#a3CheckGo'); await T.w(300);
  for (const box of await p.$$('.a3-tick input[type=checkbox]')) if (await box.evaluate(e => e.checked)) await box.click();
  await p.click('#a3CheckSave'); await T.w(300);
  const err = await p.$eval('#a3CheckErr', e => e.textContent);
  ck('with nothing typed or ticked the sheet says there is nothing to save', /Nothing to save/.test(err), err);
  ck('and it stays open with its close button', !(await p.$eval('#a3Check', e => e.hidden)) && !!(await p.$('#a3CheckX')));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_checkblank');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
