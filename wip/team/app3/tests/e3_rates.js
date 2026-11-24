#!/usr/bin/env node
/* Stage 2 slice S5 (STAGE2_PLAN 2.4 step 1, corrections 2, 3 and 2'): an account in another currency, a rate the person
   types with its day, and the Total in the home currency on Home. Walked through the real page. Made-up amounts.

   24 Nov setup: yen, Japan. Main bank ¥286,000; a second account "Dollar account", a bank in US dollars, holding
          $1,000.00 (100,000 cents). Main job ¥180,000 on the 10th. Home: the Dollar account shows $1,000 (no cents on a screen of whole amounts, BL4); the Total
          in yen is ¥286,000 and says the dollars are not counted (no rate yet). Safe to spend never counts the dollars.
   24 Nov Settings, Rates: 1 USD is 150.25 JPY from 24 Nov. Total: 286,000 + 100,000 x 150.25 / 100 = 286,000 + 150,250
          = ¥436,250, "at 1 USD = 150.25 JPY from 24 Nov, typed by you". The same after a reload (the store keeps it).
   1 Dec  Settings, Rates: 151.52 from 1 Dec. Total 286,000 + 151,520 = ¥437,520.
   30 Nov the page opened on 30 Nov: the 24 Nov rate is still the one in force, ¥436,250.
   2 Jan  the 1 Dec rate is 32 days old: the line says it is over 30 days old. Still ¥437,520.
   A rate that is not a number ("150,25", "abc", "0") is refused with words and nothing is kept. */
'use strict';
const L = require('./lives3.js').make('e3_rates');
const { ck, go, typeIn, w, txt } = L;
const figOf = (p, sel) => p.$eval(sel, e => { const a = e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]'); return a ? Number(a.dataset.amt) : null; }).catch(() => null);
const textOf = (p, sel) => p.$eval(sel, e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()).catch(() => null);
async function typeRate(p, rate, from, wantErr) {
  await p.click('#a3SetGo'); await w(300);
  if (from) await p.fill('#a3RateFrom', from);
  await p.fill('#a3Rate', rate); await p.click('#a3RateSave'); await w(400);
  const err = await txt(p, '#a3RateErr');
  if (wantErr) ck(`the rate "${rate}" is refused with words`, err && err !== '(none)' && /number/.test(err), err);
  else ck(`the rate ${rate} from ${from || 'today'} is kept`, !err || err === '(none)', err);
  await p.click('#a3SetClose'); await w(300);
}
async function total(p, what, amount, part) {
  await p.click('[data-tab=home]'); await w(200);
  const a = await figOf(p, '#a3Home [data-fig=totalhome]'), t = await textOf(p, '#a3Home [data-fig=totalpart]');
  ck(`${what}: the Total in yen is about ${amount}`, a === amount, a);
  ck(`${what}: the dollars line`, t === part, t);
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
  const err = await txt(p, '#a3SetupErr');
  ck('setup with a dollar account is kept', !err || err === '(none)', err);
  const banks = await p.$$eval('#a3Home [data-card=bank]', cs => cs.map(c => c.innerText.replace(/[⁠\s]+/g, ' ')));
  ck('24 Nov: Home shows the Dollar account as $1,000 (whole dollars, no cents shown)', banks.some(b => /Dollar account/.test(b) && /\$1,000/.test(b)), banks.join(' | '));
  const safe = await figOf(p, '#a3Home [data-fig=safe]');
  ck('24 Nov: safe to spend counts only the yen (286,000, no bills)', safe === 286000, safe);
  ck('24 Nov: with no rate, the Total in yen is the yen alone', (await figOf(p, '#a3Home [data-fig=totalhome]')) === 286000);
  const miss = await textOf(p, '#a3Home [data-fig=totalmissing]');
  ck('24 Nov: the dollars are named as not counted, with where to type a rate', miss === 'Dollar account $1,000 is not counted: no rate yet. Type one in Settings, Rates', miss);
  for (const bad of ['150,25', 'abc', '0']) await typeRate(p, bad, null, true);
  ck('a refused rate keeps nothing', (await textOf(p, '#a3Home [data-fig=totalmissing]')) === miss);
  await typeRate(p, '150.25');
  await total(p, '24 Nov after typing 150.25', 436250, 'Dollar account $1,000 at 1 USD = 150.25 JPY from 24 Nov, typed by you: ¥150,250');
  await p.reload(); await w(500);
  await total(p, '24 Nov after a reload', 436250, 'Dollar account $1,000 at 1 USD = 150.25 JPY from 24 Nov, typed by you: ¥150,250');
  await go(p, '2026-12-01'); await typeRate(p, '151.52', '2026-12-01');
  await total(p, '1 Dec after typing 151.52', 437520, 'Dollar account $1,000 at 1 USD = 151.52 JPY from 1 Dec, typed by you: ¥151,520');
  await go(p, '2026-11-30');
  await total(p, '30 Nov (the 24 Nov rate still in force)', 436250, 'Dollar account $1,000 at 1 USD = 150.25 JPY from 24 Nov, typed by you: ¥150,250');
  await go(p, '2027-01-02');
  await total(p, '2 Jan (the rate is 32 days old)', 437520, 'Dollar account $1,000 at 1 USD = 151.52 JPY from 1 Dec 2026, typed by you, over 30 days old: ¥151,520');
  await p.click('#a3SetGo'); await w(300);
  const list = await p.$$eval('#a3Set [data-set=rate]', es => es.map(e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()));
  ck('Settings lists the rates typed, latest first', list.length === 2 && /151\.52/.test(list[0]) && /150\.25/.test(list[1]), list.join(' | '));
  await p.click('#a3SetClose'); await w(200);
  await c.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 180)`, secs < 180);
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
