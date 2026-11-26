#!/usr/bin/env node
/* The Undo bar never sits over a sheet or form opened after it (SORTED K37; MAKO_SAYS M14; LESSONS lesson 2 "messages
   piling up and covering buttons"). Through the built page, made-up numbers only.
   The bar is the one message band (screens/messages.js). An Undo message lives 8 seconds; before, a sheet opened in
   that time still had the old "Spend logged, Undo" over it. Now the layer watcher (src/back3.js) holds Undo messages
   from before back while a layer shows. Closed within the 8 seconds, the bar is back and still works (M14: Undo is
   never taken away). An Undo made inside the open sheet shows there, and one message shows at a time. */
'use strict';
const L = require('./lives3.js').make('e3_undobar');
const { ck, w, go } = L;
const band = p => p.$eval('#a3Msg', e => ({ text: e.textContent.trim(), n: e.querySelectorAll('[data-msg]').length, undo: [...e.querySelectorAll('button')].some(b => b.textContent === 'Undo') }));
const shown = (p, sel) => p.$eval(sel, e => !e.closest('[hidden]')).catch(() => false);
async function spend(p, amt) { await p.click('[data-tab=receipts]'); await w(200); await p.fill('#rcAmt', String(amt)); await p.click('#rcSave'); await w(350); }
(async () => {
  const { c, p } = await L.open();
  await go(p, '2026-11-24&try=mako');
  /* each layer opened right after a logged spend */
  const LAYERS = [
    ['Settings', async () => { await p.click('#a3SetGo'); }, '#a3Set', async () => { await p.click('#a3SetClose'); }],
    ['Reminders', async () => { await p.click('#a3RemGo'); }, '#a3Rem', async () => { await p.click('#a3RemClose'); }],
    /* [AI_JOIN_FIXES G] the old Ask sheet is gone; the assistant panel and the Undo bar are walked in e3_chat part 10 */
    ['a Plan form', async () => { await p.click('[data-tab=plan]'); await w(200); await p.click('#plAddBill'); }, '[data-card=plan-form]', async () => { await p.click('#plBack'); }],
    ['Check your bank', async () => { await p.click('[data-tab=home]'); await w(200); await p.click('#a3CheckGo'); }, '#a3Check', async () => { await p.click('#a3CheckX'); }],
    ['Add statements', async () => { await p.click('[data-tab=home]'); await w(200); await p.click('#a3StmtGo'); }, '#a3Stmt', async () => { await p.click('#a3StmtX'); }],
    ['a receipt being changed', async () => { await p.click('#a3Rc li[data-rc] .a3-rcrow'); }, '#rcCancel', async () => { await p.click('#rcCancel'); }],
  ];
  let amt = 300;
  for (const [name, open, sel, close] of LAYERS) {
    amt += 10;
    await spend(p, amt);
    const b0 = await band(p);
    ck(`${name}: first, a logged spend shows its Undo bar, one message`, b0.undo && b0.n === 1, JSON.stringify(b0));
    await open(); await w(350);
    ck(`${name}: it opens`, await shown(p, sel));
    const b1 = await band(p);
    ck(`${name}: no Undo bar from before over it`, !b1.undo && b1.n === 0, JSON.stringify(b1));
    await close(); await w(350);
    const b2 = await band(p);
    ck(`${name}: closed again within its time, the Undo bar is back, one message`, b2.undo && b2.n === 1 && b2.text === b0.text, JSON.stringify(b2));
  }
  /* the spends are all still there (holding the bar back never undid anything), and the bar that came back works */
  await p.click('[data-tab=receipts]'); await w(250);
  const count = () => p.$$eval('#a3Rc li[data-rc][data-k=spend]', es => es.length);
  const rows = await count();
  ck(`holding the bar back never undid a spend (${LAYERS.length} logged here are listed)`, rows >= LAYERS.length, rows);
  await p.click('#a3Msg button'); await w(450);
  ck('the Undo bar that came back still takes its spend back', (await count()) < rows && /Undone/.test((await band(p)).text), JSON.stringify(await band(p)));
  /* held back past its 8 seconds, it never shows late */
  await spend(p, 990);
  await p.click('#a3SetGo'); await w(8300);
  await p.click('#a3SetClose'); await w(300);
  ck('a bar held back past its 8 seconds does not show late', !(await band(p)).undo, JSON.stringify(await band(p)));
  /* an Undo made inside an open layer shows while it is open: a bill ended on Plan, with no layer opened after */
  await p.click('[data-tab=plan]'); await w(250);
  await p.click('#plAddBill'); await w(300);
  await p.fill('#pl-name', 'Gym'); await p.fill('#pl-amount', '7000'); await p.fill('#pl-day', '15');
  await p.click('[data-plbtn="0"]'); await w(450);
  const b3 = await band(p);
  ck('a step saved from a form: its own Undo bar shows after the form closes', b3.undo && b3.n === 1 && /Bill added/.test(b3.text), JSON.stringify(b3));
  await p.click('#a3Msg button'); await w(450);
  const b4 = await band(p);
  ck('and its Undo still works', /Undone/.test(b4.text) && !b4.undo, JSON.stringify(b4));
  /* [coordinator follow-up, found twice; LESSONS 2] the Undo bar names what changed, its own before and after (the one
     piece the assistant's card reads too, src/change3.js): Rent's amount; then Phone's, whose next one is after pay,
     says why safe to spend stays, only because it is true */
  await p.click('[data-tab=plan]'); await w(250);
  const billId = name => p.$$eval('[data-bill]', (es, n) => (es.find(e => e.textContent.trim().startsWith(n)) || {}).dataset.bill, name);
  const RENT = await billId('Rent'), PHONE = await billId('Phone');
  const safeNow = async () => { await p.click('[data-tab=home]'); await w(250); return p.$eval('#a3Home [data-fig=safe]', e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)); };
  const yen = n => '¥' + n.toLocaleString('en-US');
  const billTo = async (id, a) => { await p.click('[data-tab=plan]'); await w(250); await p.click(`[data-bill="${id}"]`); await w(300); await p.$eval('#pl-amount', (e, v) => { e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); }, String(a)); await p.click('[data-plbtn="0"]'); await w(450); };
  let s0 = await safeNow();
  await billTo(RENT, 92000);
  let s1 = await safeNow();
  const b7 = await band(p);
  ck('Rent made 92,000 on Plan: the Undo bar says Rent, amount 72,000 to 92,000, and safe to spend before and after', b7.undo && b7.text.includes('Rent, amount: ¥72,000 to ¥92,000') && s1 !== s0 && b7.text.includes(`Safe to spend: ${yen(s0)} to ${yen(s1)}`), JSON.stringify([b7, s0, s1]));
  s0 = s1;
  await billTo(PHONE, 5000);
  const b8 = await band(p);
  ck('Phone made 5,000: the bar says Phone, amount 4,800 to 5,000, and why safe to spend stays (the next one is after pay)', b8.undo && b8.text.includes('Phone, amount: ¥4,800 to ¥5,000') && (await safeNow()) === s0 && b8.text.includes(`Safe to spend stays ${yen(s0)}: Phone is not due again before your next pay on 10 Dec`), JSON.stringify([b8, s0]));
  await p.click('#a3Msg button'); await w(450);
  await p.click('[data-tab=plan]'); await w(250);
  ck('and its Undo puts Phone back', await p.$eval(`[data-bill="${PHONE}"]`, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)) === 4800);
  await c.close();
  /* in setup: a row removed inside the open sheet keeps its Undo there */
  {
    const o = await L.open();
    await go(o.p, '2026-11-24');
    await o.p.click('#a3SetupGo'); await w(350);
    await o.p.click('#s3AddBill'); await w(150);
    await o.p.fill('#a3Setup [data-sec=bills] [data-row] [data-f=name]', 'Rent'); await o.p.$eval('#a3Setup [data-sec=bills] [data-row] [data-f=name]', e => e.blur()); await w(150);   // the box is left first: leaving it moves the row's Remove down (told to MAIN 15, setup's own fault)
    await o.p.click('#a3Setup [data-sec=bills] [data-row] [data-remove]'); await w(300);
    const b = await band(o.p);
    ck('setup: a bill row removed shows its Undo while setup is open', b.undo && b.n === 1, JSON.stringify(b));
    await o.p.click('#a3SetGo'); await w(350);
    const b5 = await band(o.p);
    ck('setup: Settings opened over it has no Undo bar from before', !b5.undo, JSON.stringify(b5));
    await o.p.click('#a3SetClose'); await w(350);
    const b6 = await band(o.p);
    ck('setup: Settings closed, setup shows its own Undo again', b6.undo && /Rent removed/.test(b6.text), JSON.stringify(b6));
    await o.c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL e3_undobar crashed ' + (e && e.stack || e)); process.exit(1); });
