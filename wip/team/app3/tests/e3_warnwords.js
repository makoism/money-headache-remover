#!/usr/bin/env node
/* Home words the engine's warnings itself (screens/status.js, money.js, names.js), never printing the engine's text:
   with no minimum it says "below zero", with one it names it, and no raw ISO day or "2027-03" month is ever shown.
   Made-up US dollars, set up 1 Dec 2026, seen on 2 Dec: pay $2,500.00 on the 25th, rent $3,000.00 on the 1st.
   A. $400.00 in Checking, no minimum: 400 + 2,500 - 3,000 = -100 on 1 Jan, "Checking goes $100 below zero on 1 Jan".
   B. The same with a minimum of $50.00: "Checking goes $150 below its minimum of $50 on 1 Jan".
   C. $1,000.00, no minimum: 1 Jan 500, 1 Feb 0, 1 Mar -500, past the safe to spend walk: "Later on: Checking goes below
      zero in Mar 2027". */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js');
const DAY = '2026-12-02', ISO = /\d{4}-\d{2}/;
const usBook = (open, min) => B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00-05:00', country: 'US', currency: 'USD',
  banks: [{ key: 'chk', name: 'Checking', amount: open, min }],
  pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 250000, day: 25, shift: 'none', startsPeriod: true }],
  bills: [{ key: 'rent', name: 'Rent', from: 'chk', amount: 300000, day: 1, shift: 'none' }] }, { newId: I.idMaker('usd003', () => 0.5) }).book;
async function warns(bk, day) {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + (day || DAY)); await T.w(300);
  await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk);
  await p.reload(); await T.w(400);
  const clean = x => x.replace(/⁠/g, '');
  const out = (await p.$$eval('[data-warn]', es => es.map(e => ({ code: e.dataset.warn, text: e.textContent })))).map(x => ({ code: x.code, text: clean(x.text) }));
  const short = await p.$eval('[data-fig=short]', e => e.textContent).then(clean).catch(() => null);
  const status = clean(await p.$eval('[data-card=status]', e => e.textContent).catch(() => ''));
  const all = await p.$eval('#a3Home', e => e.textContent);
  const cap = await p.$eval('[data-fig=cap]', e => e.textContent).then(clean).catch(() => null);
  await b.close();
  return { out, status, all, errs, short, cap };
}
(async () => {
  {
    const { out, status, all, errs } = await warns(usBook(40000));
    const w = out.find(x => x.code === 'below_minimum');
    ck('A: no minimum, below zero in words', w && w.text === 'Checking goes $100 below zero on 1 Jan', JSON.stringify(out));
    ck('A: the status line never speaks of a minimum there is not', /1 Jan/.test(status) && !/minimum/.test(status), status);
    ck('A: no raw ISO day on Home', !ISO.test(all), (all.match(/.{20}\d{4}-\d{2}.{10}/) || [])[0]);
    ck('A: no page errors', errs.length === 0, errs.join(' | '));
  }
  {
    const { out, all, errs } = await warns(usBook(40000, 5000));
    const w = out.find(x => x.code === 'below_minimum');
    ck('B: a minimum is named with its amount', w && w.text === 'Checking goes $150 below its minimum of $50 on 1 Jan', JSON.stringify(out));
    ck('B: no raw ISO day on Home', !ISO.test(all));
    ck('B: no page errors', errs.length === 0, errs.join(' | '));
  }
  {
    const { out, all, errs } = await warns(usBook(100000));
    const l = out.find(x => x.code === 'later');
    ck('C: later on by month, in words', l && l.text === 'Later on: Checking goes below zero in Mar 2027', JSON.stringify(out));
    ck('C: no "2027-03" on Home', !ISO.test(all));
    ck('C: no page errors', errs.length === 0, errs.join(' | '));
  }
  /* D. [B1] Yen, set up Mon 23 Nov with 30,000, Rent 60,000 on the 24th, Pay 50,000 on the 25th: -30,000 on 24 Nov,
     before the pay; 20,000 on 25 Nov; -40,000 on 24 Dec. Short by 30,000 on 24 Nov, and the lower point later with its day.
     E. [B1] Pay 0, 100,000, Rent on the 28th: 40,000 on 28 Nov, -20,000 on 28 Dec; no pay brings anything. */
  const jpBook = (bank, pay, rentDay) => B.buildBook({ day: '2026-11-23', told: '2026-11-23T09:00+09:00', country: 'JP', currency: 'JPY',
    banks: [{ key: 'b', name: 'Main bank', amount: bank }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: pay, day: 25, shift: 'none', startsPeriod: true }],
    bills: [{ key: 'rent', name: 'Rent', from: 'b', amount: 60000, day: rentDay, shift: 'none' }] }, { newId: I.idMaker('b1home', () => 0.5) }).book;
  {
    const { out, status, short, errs } = await warns(jpBook(30000, 50000, 24), '2026-11-23');
    ck('D: short by the first day under and how much then, before the pay', short === 'Short by ¥30,000 on 24 Nov, before the pay on 25 Nov', short);
    const w = out.find(x => x.code === 'below_minimum');
    ck('D: the warning names 24 Nov and 30,000', w && w.text === 'Main bank goes ¥30,000 below zero on 24 Nov', JSON.stringify(out));
    const l = out.find(x => x.code === 'later_low');
    ck('D: the lower point later, with its own day', l && l.text === 'Later on: Main bank goes ¥40,000 below zero on 24 Dec', JSON.stringify(out));
    ck('D: the status names 24 Nov and 30,000', /30,000 on 24 Nov/.test(status), status);
    ck('D: no page errors', errs.length === 0, errs.join(' | '));
  }
  {
    const { short, all, errs } = await warns(jpBook(100000, 0, 28), '2026-11-23');
    ck('E: pay 0, short on its day with no pay named', short === 'Short by ¥20,000 on 28 Dec', short);
    ck('E: never "before then" or "before the pay"', !/before then|before the pay/.test(all), (all.match(/.{30}before.{30}/) || [])[0]);
    ck('E: no page errors', errs.length === 0, errs.join(' | '));
  }
  /* F. [S6] Free to spend over: set up Mon 23 Nov with 300,000, Pay 250,000 on the 25th, Free to spend 50,000 a month
     from 23 Nov, 70,000 spent from it on 26 Nov. Seen on 27 Nov: Free to spend left is below zero, and the sum under
     safe to spend says by how much, never hides it. */
  {
    const bk = jpBook(300000, 250000, 30), acct = bk.accounts[0].id;
    bk.plan.shares.push({ id: 's6sh', from: '2026-11-23', cur: 'JPY', per: { free: 'month' }, free: 50000 });
    bk.events.push({ id: 's6sp', k: 'spend', acct, date: '2026-11-26', a: 70000, told: '2026-11-26T12:00+09:00' });
    const r = T.L.lookahead(bk, '2026-11-27'), over = r.safeToSpend.freeOver;
    ck('F: the engine says Free to spend is over', over > 0 && r.period.free.left === -over, JSON.stringify(r.safeToSpend));
    const { cap, errs } = await warns(bk, '2026-11-27');
    ck('F: the sum on Home names the overspend', cap && cap.includes(`(Free to spend is ¥${over.toLocaleString("en")} over this period) = ¥0`), cap);
    ck('F: no page errors', errs.length === 0, errs.join(' | '));
  }
  T.done('e3_warnwords');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
