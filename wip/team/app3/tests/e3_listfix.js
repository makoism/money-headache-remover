#!/usr/bin/env node
/* The LISTFIX lane's fixes (app3/LISTFIX.md), each on the real page, on the made-up Mako book.
   A1. A gap found at Check your bank is spending (T2), so Receipts lists it in the period it counts in, beside what was
       logged, and the list never says "Nothing logged" while the spent figure holds a gap. Hand-worked: the bank was
       checked at 286,000 on 20 Nov and the app expects 387,400 on 10 Dec; typed 386,550, the gap is 850. The stretch is
       21 Nov to 10 Dec (20 days), cut at the period start of 10 Dec: 19 days in the period before (850 x 19 / 20 = 807.5,
       808) and 1 day in this one (850 - 808 = 42). Receipts shows the 42 in this period and the 808 under Earlier, each
       named as found at the bank check of 10 Dec, on Free to spend, and not a button (it changes only at a check).
   A2. Plan lines alone needing more than the bank can spare: Home says so, by how much, and what to do (worked below). */
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

  /* A2: a fresh copy of the made-up book on 12 Dec: safe to spend 35,000 until pay on 12 Jan. The 10 Dec pay is not
     ticked, so the period holding setup (20 Nov) still runs, and Food of 100,000 each pay period, added on Plan, counts
     its share from the setup day (I4): 100,000 x 20 / 30 = 66,666. The plan needs 66,666 - 35,000 = 31,666 more than
     the bank can spare. The bank itself never goes under, so Home says the plan
     is the cause, with the amount, and what to do; never "It turns safe once your pay is in". */
  await fresh();
  await go('2026-12-12');
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plAddLine'); await T.w(200);
  await p.evaluate(v => { for (const [k, x] of Object.entries(v)) { const e = document.getElementById('pl-' + k); e.focus(); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); } }, { name: 'Food', amount: '100000' });
  await p.click('[data-plbtn="0"]'); await T.w(400);
  await p.tap('[data-tab="home"]'); await T.w(300);
  const st2 = await p.$eval('[data-card="status"]', e => e.textContent.replace(/\s+/g, ' ').trim());
  ck('A2: Home says the plan lines need ¥31,666 more than the bank can spare before pay on 12 Jan', /Your plan lines need ¥31,666 more than your bank can spare before pay on 12 Jan/.test(st2), st2);
  ck('A2: and what to do: Lower a plan line, or move money in', /Lower a plan line, or move money in/.test(st2), st2);
  ck('A2: never "until pay" as if the pay fixes it', !/Nothing's safe to spend until pay/.test(st2), st2);
  ck('A2: safe to spend is 0', (await p.$eval('[data-fig="safe"] [data-amt]', e => e.dataset.amt)) === '0');
  await T.shot(p, 'listfix_a2');

  const errs = [].concat(...errLists); ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_listfix');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
