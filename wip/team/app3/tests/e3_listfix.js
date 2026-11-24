#!/usr/bin/env node
/* The LISTFIX lane's fixes (app3/LISTFIX.md), each on the real page, on the made-up Mako book.
   A1. A gap found at Check your bank is spending (T2), so Receipts lists it in the period it counts in, beside what was
       logged, and the list never says "Nothing logged" while the spent figure holds a gap. Hand-worked: the bank was
       checked at 286,000 on 20 Nov and the app expects 387,400 on 10 Dec; typed 386,550, the gap is 850. The stretch is
       21 Nov to 10 Dec (20 days), cut at the period start of 10 Dec: 19 days in the period before (850 x 19 / 20 = 807.5,
       808) and 1 day in this one (850 - 808 = 42). Receipts shows the 42 in this period and the 808 under Earlier, each
       named as found at the bank check of 10 Dec, on Free to spend, and not a button (it changes only at a check). */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const txt = (p, sel) => p.$eval(sel, e => (e.hidden ? '' : e.textContent.trim())).catch(() => null);
async function typeIn(p, sel, v) { await p.tap(sel); await p.keyboard.type(v); await T.w(250); }
const rows = p => p.$$eval('#rcList li', es => es.map(e => ({ gap: e.dataset.gap !== undefined, text: e.textContent.replace(/\s+/g, ' ').trim(), button: !!e.querySelector('button') })));
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct;
  const errLists = [];
  let b, p;
  const go = async day => { await p.goto(T.URL0 + '?today=' + day); await T.w(400); };
  /* a fresh device with a kept book (the made-up one unless another is given), saved through the store */
  const fresh = async bk0 => {
    if (b) await b.close();
    const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-') });
    b = o.b; p = o.p; errLists.push(o.errs);
    await go('2026-12-10');
    await p.evaluate(async x => { const s = await BurrowStore.open(); await s.save(x, { full: true }); s.db && s.db.close(); }, bk0 || T.book());
  };
  await fresh(bk);

  /* A1 */
  await go('2026-12-10');
  await p.click('#a3CheckGo'); await T.w(300);
  await typeIn(p, `[data-bankfig="${bank}"]`, '386,550');
  await p.click(`[data-gapyes="${bank}"]`); await T.w(200);
  await p.click('#a3CheckSave'); await T.w(500);
  await p.tap('[data-tab="receipts"]'); await T.w(300);
  let rs = await rows(p);
  const now = rs.filter(r => r.gap);
  ck('A1: this period lists the gap found at the check, ¥42, on Free to spend', now.length === 1 && /Found at your bank check on 10 Dec/.test(now[0].text) && /Free to spend/.test(now[0].text) && /¥42$/.test(now[0].text), JSON.stringify(rs));
  ck('A1: the gap row is not a button (it changes only at a check)', now.length === 1 && !now[0].button, JSON.stringify(now));
  ck('A1: never "Nothing logged" beside a gap', !/Nothing logged/.test(await txt(p, '#rcList')), await txt(p, '#rcList'));
  await p.click('#rcOlder'); await T.w(300);
  rs = await rows(p);
  const before = rs.filter(r => r.gap);
  ck('A1: the period before lists its part, ¥808, from the same check', before.length === 1 && /Found at your bank check on 10 Dec/.test(before[0].text) && /¥808$/.test(before[0].text), JSON.stringify(rs));
  await T.shot(p, 'listfix_a1');


  const errs = [].concat(...errLists); ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_listfix');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
