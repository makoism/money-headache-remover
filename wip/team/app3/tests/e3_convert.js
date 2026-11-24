#!/usr/bin/env node
/* Stage 2 slice S6 (STAGE2_PLAN 2.4 step 2, corrections 2 and 2'): the rate from the person's own conversion, walked
   through the real page. Made-up amounts.

   24 Nov setup as e3_rates.js: Main bank ¥286,000, Dollar account $1,000.00 (100,000 cents), Main job ¥180,000 on the
          10th. Settings, Rates: 1 USD = 150.25 JPY from 24 Nov. Total 286,000 + 150,250 = ¥436,250.
   1 Dec  Receipts, Moved: ¥150,000 from Main bank to the Dollar account; what arrived: $990.00. Main bank 136,000; the
          Dollar account 199,000 cents ($1,990.00). The conversion's rate: 1 USD = 150,000 / 990 = 151.5151... JPY, shown
          151.52, used exactly: 199,000 x 150,000 / 99,000 = 301,515.15, so 301,515 (151.52 would give 301,525). Total
          136,000 + 301,515 = ¥437,515, "from your own conversion". Safe to spend 136,000 (the dollars never count).
          The same after a reload.
   30 Nov the 24 Nov typed rate still: ¥436,250.
   2 Dec  Settings, Rates: 152 from 2 Dec takes over: 199,000 x 152 / 100 = 302,480; Total ¥438,480, typed by you.
   A move between two currencies with nothing typed for what arrived is refused with words. */
'use strict';
const L = require('./lives3.js').make('e3_convert');
const { ck, go, tab, typeIn, w, txt, selByText } = L;
const figOf = (p, sel) => p.$eval(sel, e => { const a = e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]'); return a ? Number(a.dataset.amt) : null; }).catch(() => null);
const textOf = (p, sel) => p.$eval(sel, e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()).catch(() => null);
async function typeRate(p, rate, from) {
  await p.click('#a3SetGo'); await w(300);
  if (from) await p.fill('#a3RateFrom', from);
  await p.fill('#a3Rate', rate); await p.click('#a3RateSave'); await w(400);
  const err = await txt(p, '#a3RateErr');
  ck(`the rate ${rate} is kept`, !err || err === '(none)', err);
  await p.click('#a3SetClose'); await w(300);
}
async function total(p, what, amount, part) {
  await p.click('[data-tab=home]'); await w(200);
  const a = await figOf(p, '#a3Home [data-fig=totalhome]'), t = await textOf(p, '#a3Home [data-fig=totalpart]');
  ck(`${what}: the Total in yen is about ${amount}`, a === amount, a);
  ck(`${what}: the dollars line`, t === part, t);
}
async function move(p, a, arrived) {
  await tab(p, 'receipts');
  await p.click('[data-mode=moved]'); await w(150);
  await selByText(p, '#rcFrom', 'Main bank'); await w(150);
  await p.fill('#rcAmt', String(a)); await selByText(p, '#rcTo', 'Dollar account'); await w(150);
  const shown = await p.$eval('#rcForm [data-q=arrived]', e => !e.hidden).catch(() => false);
  ck('Moved between yen and dollars asks what arrived', shown);
  if (arrived != null) await p.fill('#rcAmt2', String(arrived));
  await p.fill('#rcNote', 'to dollars'); await w(120); await p.click('#rcSave'); await w(450);
  return txt(p, '#rcErr');
}
(async () => {
  const t0 = Date.now();
  const { c, p } = await L.open();
  await go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3Bank', '286000');
  await p.click('#s3AddAcct'); await typeIn(p, '[data-row=acct2] [data-f=name]', 'Dollar account');
  await p.selectOption('[data-row=acct2] [data-f=cur]', 'USD'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '1000');
  await p.selectOption('#s3PayDay', '10'); await typeIn(p, '#s3PayName', 'Main job'); await typeIn(p, '#s3PayAmt', '180000');
  await p.click('#a3SetupSave'); await w(700);
  await typeRate(p, '150.25');
  await total(p, '24 Nov', 436250, 'Dollar account $1,000 at 1 USD = 150.25 JPY from 24 Nov, typed by you: ¥150,250');
  await go(p, '2026-12-01');
  const bad = await move(p, 150000, null);
  ck('nothing typed for what arrived is refused with words', /arrived/.test(bad), bad);
  const err = await move(p, 150000, 990);
  ck('1 Dec: the move into dollars is kept', !err || err === '(none)', err);
  const banks = await p.evaluate(() => { const o = {}; for (const c of document.querySelectorAll('#a3Home [data-card=bank]')) o[c.querySelector('h2').textContent.replace(/^[^:]*:\s*/, '')] = c.querySelector('[data-fig=bank]').textContent.replace(/[⁠\s]+/g, ''); return o; });
  await tab(p, 'home');
  const banks2 = await p.evaluate(() => { const o = {}; for (const c of document.querySelectorAll('#a3Home [data-card=bank]')) o[c.querySelector('h2').textContent.replace(/^[^:]*:\s*/, '')] = c.querySelector('[data-fig=bank]').textContent.replace(/[⁠\s]+/g, ''); return o; });
  ck('1 Dec: Main bank ¥136,000 and the Dollar account $1,990.00', banks2['Main bank'] === '¥136,000' && banks2['Dollar account'] === '$1,990', JSON.stringify(banks2 || banks));
  ck('1 Dec: safe to spend 136,000 (the dollars never count)', (await figOf(p, '#a3Home [data-fig=safe]')) === 136000);
  await total(p, '1 Dec after the conversion', 437515, 'Dollar account $1,990 at 1 USD = 151.52 JPY from 1 Dec, from your own conversion: ¥301,515');
  await p.reload(); await w(500);
  await total(p, '1 Dec after a reload', 437515, 'Dollar account $1,990 at 1 USD = 151.52 JPY from 1 Dec, from your own conversion: ¥301,515');
  await tab(p, 'receipts');
  const rows = await p.$$eval('#rcList [data-rc]', rs => rs.map(r => r.textContent.replace(/\s+/g, ' ')));
  ck('Receipts lists the move to the Dollar account', rows.some(r => /Moved to Dollar account/.test(r)), rows.join(' | '));
  await go(p, '2026-11-30');
  await total(p, '30 Nov (the typed rate of 24 Nov)', 436250, 'Dollar account $1,000 at 1 USD = 150.25 JPY from 24 Nov, typed by you: ¥150,250');
  await go(p, '2026-12-02'); await typeRate(p, '152', '2026-12-02');
  await total(p, '2 Dec after typing 152', 438480, 'Dollar account $1,990 at 1 USD = 152.00 JPY from 2 Dec, typed by you: ¥302,480');
  await c.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 180)`, secs < 180);
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
