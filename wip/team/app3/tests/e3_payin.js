#!/usr/bin/env node
/* [qc-novice B1, coordinator 18's ruling; M22 M36 M45] A pay logged through Receipts' "Money came in" must not be counted
   twice. On an account with an expected pay not yet ticked (due on or before today or within the next 5 days), Money came
   in asks once "Is this your <pay> of <day>?" before anything is saved. Yes ticks that pay with the amount typed (the same
   tick Check your bank writes, one step with Undo); No logs money in as before. Another account, a pay more than 5 days
   away, or a change to an old Money in asks nothing. With two pays due, one button per pay. The worked example: bank
   286,000, pay of 175,000 typed, the bank ends at 461,000 (never 636,000), and Check your bank no longer lists that pay.
   Made-up book (e3_act_book.js), made-up yen. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const { actBook, SAVINGS } = require('./e3_act_book.js');
const ID = n => 'k7m2qa-f3n8p1x6wd-' + n;
const MAIN = ID(4), SIDE = ID(5);
const oneJob = () => { const b = actBook(); b.schedules.find(s => s.id === SIDE).gone = '2026-11-20'; return b; };
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
const homeBank = (p, id) => p.$eval(`#a3Home [data-card=bank][data-acct="${id}"] [data-fig=bank] [data-amt]`, e => Number(e.dataset.amt));
const vis = (p, sel) => p.$eval(sel, e => !e.hidden && !!e.offsetParent).catch(() => false);
const live = bk => bk.events.filter(e => !e.gone);
async function start(p, bk, day) {
  await p.goto(T.URL0 + '?today=' + day); await T.w(300);
  /* each case starts from its own book only: the store keeps records by id, so the last case's are wiped first */
  await p.evaluate(async () => { for (const d of await indexedDB.databases()) await new Promise(r => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }); localStorage.clear(); });
  await p.reload(); await T.w(300);
  await p.evaluate(async b => { const s = await BurrowStore.open(); await s.save(b, { full: true }); if (s.db) s.db.close(); }, bk);
  await p.reload(); await T.w(400);
}
async function logIn(p, amt, acct, note) {
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  await p.tap('[data-mode=in]'); await T.w(150);
  await p.$eval('#rcAmt', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, String(amt));
  if (acct) await p.select('#rcAcct', acct);
  if (note) await p.$eval('#rcNote', (e, v) => { e.value = v; }, note);
  await p.tap('#rcSave'); await T.w(500);
}
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3pi-');
  const { b, p, errs } = await T.open({ profile: prof });
  const bank = actBook().home.main.v.acct;

  /* A: one pay, two days late; Yes ticks it with the amount typed */
  let D = '2026-12-12', bk0 = oneJob();
  await start(p, bk0, D);
  const r0 = T.L.lookahead(bk0, D), occ = MAIN + '@2026-12-10';
  ck('A: the pay is expected and not ticked before', r0.checkIn.toConfirm.some(o => o.item === occ) && r0.accounts[bank].bank === 286000, r0.accounts[bank].bank);
  await logIn(p, 175000, null, 'my pay');
  ck('A: asked first: "Is this your Main job pay of 10 Dec?"', await vis(p, '#rcPay') && /^Is this your Main job pay of 10 Dec\?/.test(await p.$eval('#rcPayText', e => e.textContent)), await p.$eval('#rcPayText', e => e.textContent).catch(() => 'no question'));
  let bk = await saved(p);
  ck('A: nothing saved before the answer', live(bk).length === live(bk0).length);
  await p.tap('[data-payyes]'); await T.w(500);
  bk = await saved(p);
  const tick = live(bk).find(e => e.id === 'set:' + occ);
  ck('A: Yes ticks the pay with the amount typed (the check-in tick)', tick && tick.k === 'in' && tick.sub === 'pay' && tick.a === 175000 && tick.acct === bank && tick.note === 'my pay', JSON.stringify(tick));
  ck('A: no plain money in was logged', !live(bk).some(e => e.k === 'in' && !e.sub && e.a === 175000));
  let r = T.L.lookahead(bk, D);
  ck('A: the bank goes up once: 286,000 + 175,000 = 461,000', r.accounts[bank].bank === 461000, r.accounts[bank].bank);
  ck('A: Check your bank no longer lists the pay', !r.checkIn.toConfirm.some(o => o.item === occ));
  ck('A: the Undo bar says the pay was ticked', /Main job of 10 Dec/.test(await p.$eval('body', e => e.textContent)));
  await p.tap('[data-tab="home"]'); await T.w(250);
  ck('A: Home shows the bank at 461,000', (await homeBank(p, bank)) === 461000);
  ck('A: Home no longer says the pay was not seen', !/Main job[^.]{0,40}not been seen/.test(await p.$eval('#a3Home', e => e.textContent)));
  /* Undo takes the tick back */
  const undo = await p.evaluateHandle(() => [...document.querySelectorAll('.burrow-msg button')].find(x => x.textContent === 'Undo') || null);
  const hasUndo = await undo.evaluate(x => !!x);
  if (hasUndo) { await undo.evaluate(x => x.click()); await T.w(500); bk = await saved(p); }
  ck('A: Undo takes the tick back', hasUndo && !live(bk).some(e => e.id === 'set:' + occ));

  /* B: No logs money in, the pay stays expected */
  await start(p, oneJob(), D);
  await logIn(p, 20000, null, 'gift');
  ck('B: asked', await vis(p, '#rcPay'));
  await p.tap('[data-payno]'); await T.w(500);
  bk = await saved(p); r = T.L.lookahead(bk, D);
  ck('B: No logs plain money in', live(bk).some(e => e.k === 'in' && !e.sub && e.a === 20000 && e.note === 'gift'));
  ck('B: the pay is still expected', r.checkIn.toConfirm.some(o => o.item === occ) && !live(bk).some(e => e.id === 'set:' + occ));
  ck('B: the question is gone after the answer', !(await vis(p, '#rcPay')));
  /* F: a change to that Money in asks nothing */
  const gift = live(bk).find(e => e.note === 'gift');
  await p.tap(`[data-rc="${gift.id}"] button`); await T.w(250);
  await p.$eval('#rcAmt', x => { x.value = '21000'; }); await p.tap('#rcSave'); await T.w(500);
  bk = await saved(p);
  ck('F: a change to an old Money in asks nothing and saves', !(await vis(p, '#rcPay')) && live(bk).some(e => e.id === gift.id && e.a === 21000));

  /* C: pay in 3 days (within 5): asked; Yes ticks it early and the new pay period starts today */
  D = '2026-12-07';
  await start(p, oneJob(), D);
  await logIn(p, 180000);
  ck('C: a pay due in 3 days is asked about', await vis(p, '#rcPay') && /Main job pay of 10 Dec/.test(await p.$eval('#rcPayText', e => e.textContent)));
  await p.tap('[data-payyes]'); await T.w(500);
  bk = await saved(p); r = T.L.lookahead(bk, D);
  ck('C: Yes ticks it, dated today, and the pay period starts today', live(bk).some(e => e.id === 'set:' + occ && e.date === D && e.a === 180000) && r.period.start === D, r.period.start);

  /* D: more than 5 days away: no question */
  D = '2026-12-03';
  await start(p, oneJob(), D);
  await logIn(p, 30000, null, 'client');
  bk = await saved(p);
  ck('D: a pay 7 days away: no question, money in logged', !(await vis(p, '#rcPay')) && live(bk).some(e => e.k === 'in' && !e.sub && e.a === 30000));

  /* E: into another account (Savings), no pay lands there: no question */
  D = '2026-12-12';
  await start(p, oneJob(), D);
  await logIn(p, 9000, SAVINGS, 'interest');
  bk = await saved(p);
  ck('E: another account: no question, money in logged', !(await vis(p, '#rcPay')) && live(bk).some(e => e.k === 'in' && !e.sub && e.a === 9000 && e.acct === SAVINGS));

  /* G: two pays due on that account: one button per pay, and No */
  await start(p, actBook(), D);
  await logIn(p, 60000);
  const btns = await p.$$eval('[data-payyes]', bs => bs.map(x => x.textContent));
  ck('G: two pays due: a button for each', btns.length === 2 && btns.some(x => /Main job/.test(x)) && btns.some(x => /Side job/.test(x)) && !!(await p.$('[data-payno]')), JSON.stringify(btns));
  await p.tap(`[data-payyes="${SIDE}@2026-12-10"]`); await T.w(500);
  bk = await saved(p);
  ck('G: the pay picked is ticked', live(bk).some(e => e.id === 'set:' + SIDE + '@2026-12-10' && e.a === 60000) && !live(bk).some(e => e.id === 'set:' + occ));

  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_payin');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
