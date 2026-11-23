#!/usr/bin/env node
/* Home, the new top, on the made-up Mako book (WIRING_PLAN step 7). On 23 Nov, 9, 10, 11 and 12 Dec,,
   and Fri 8 Jan 2027, every figure on screen is the engine's figure for that day: bank
   today and its age, safe to spend and the sum behind it, the next pay, due before next pay, each card, all the money
   after the cards. One bank figure on the page. No page errors, no outside requests, the old app's copies untouched. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const SN0 = require('../../screens/names.js');
const DAYS = ['2026-11-23', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12', '2027-01-08'];
(async () => {
  const { b, p, errs, requests } = await T.open();
  await p.goto(T.URL0 + '?try=mako'); await T.w(300);
  await T.seedOld(p);
  const bk = T.book(), bank = bk.home.main.v.acct;
  for (const day of DAYS) {
    await p.goto(T.URL0 + '?try=mako&today=' + day); await T.w(400);
    const r = T.L.lookahead(bk, day), f = await T.figs(p);
    const one = k => f.filter(x => x.fig === k);
    const bankFigs = one('bank');
    ck(day + ' one bank figure, the engine\'s', bankFigs.length === 1 && bankFigs[0].amt === r.accounts[bank].bank, JSON.stringify(bankFigs));
    ck(day + ' its age', one('age')[0] && one('age')[0].text === (r.accounts[bank].ageDays === 0 ? 'checked today' : r.accounts[bank].ageDays === 1 ? 'checked yesterday' : 'checked ' + r.accounts[bank].ageDays + ' days ago') + ', on 20 Nov' + (day.startsWith('2027') ? ' 2026' : ''), one('age')[0] && one('age')[0].text);
    ck(day + ' safe to spend is the engine\'s headline', one('safe')[0] && one('safe')[0].amt === r.safeToSpend.headline, JSON.stringify(one('safe')) + ' vs ' + r.safeToSpend.headline);
    ck(day + ' the sum behind it is the engine\'s', one('why')[0] && one('why')[0].text === r.accounts[bank].why, one('why')[0] && one('why')[0].text);
    const npDay = r.period.nextPay.state === 'notSeen' ? r.period.nextPay.due : r.daysToNextPay.next_pay;
    ck(day + ' the next pay (' + r.period.nextPay.state + ')', one('nextpay')[0] && one('nextpay')[0].text.indexOf(SN0.dayLabel(npDay)) > 0, one('nextpay')[0] && one('nextpay')[0].text);
    const dt = one('duetotal');
    ck(day + ' due before next pay', r.dueBeforeNextPay.items.length ? dt.length === 1 && dt[0].amt === r.dueBeforeNextPay.total : dt.length === 0, JSON.stringify(dt) + ' vs ' + r.dueBeforeNextPay.total);
    const owed = one('owed');
    ck(day + ' each card', owed.length === Object.keys(r.cards).length && Object.keys(r.cards).every((id, i) => owed[i].amt === r.cards[id].owedNow), JSON.stringify(owed));
    ck(day + ' all the money after the cards', one('aftercards')[0] && one('aftercards')[0].amt === r.total.afterCards);
    const shown = await p.evaluate(() => [...document.querySelectorAll('[data-amt]')].every(e => e.textContent.replace(/[^\d]/g, '') === String(Math.abs(Number(e.dataset.amt)))));
    ck(day + ' every amount written is the amount it stands for', shown);
    const audit = await p.evaluate(() => BurrowScreens.provenance.audit(document.getElementById('a3Home')));
    ck(day + ' every figure is marked sample on the sample screen (provenance audit)', audit.length === 0 && (await p.$$('[data-figure]')).length > 5, audit.join('; '));
    const st = await p.evaluate(() => document.querySelector('[data-card=status] h2').textContent);
    ck(day + ' the one status says these are sample numbers', st === 'Sample numbers', st);
    if (day === '2026-11-23' || day === '2027-01-08' || day === '2026-12-10') await T.shot(p, 'home_' + day);
  }
  /* the phone width: no sideways scroll at 320 */
  await p.setViewport({ width: 320, height: 700, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(T.URL0 + '?try=mako&today=2026-12-10'); await T.w(300);
  ck('no sideways scroll at 320 px', await p.evaluate(() => document.documentElement.scrollWidth <= 320), await p.evaluate(() => document.documentElement.scrollWidth));
  /* every label beside a figure is the name table's name for that figure */
  const SN = require('../../screens/names.js');
  const shown = await p.evaluate(() => [['[data-card=safe] h2', 'safeToSpend.headline'], ['[data-card=due] h2', 'dueBeforeNextPay.total'], ['[data-card=period] h2', 'period.start']].map(([s, f]) => ({ label: document.querySelector(s) ? document.querySelector(s).textContent : '', figure: f })));
  const labelOnly = shown.map(x => ({ label: x.label.replace(/ until next pay on .*$/, ''), figure: x.figure }));
  ck('labels come from the name table', SN.check(labelOnly).length === 0, SN.check(labelOnly).join('; '));
  const old = await T.readOld(p);
  ck('the old app\'s copy is byte for byte the same', old.ls === T.OLD_TEXT && old.idb === T.OLD_IDB, JSON.stringify(old).slice(0, 200));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  ck('no outside requests', requests.length === 0, requests.join(' '));
  await b.close(); T.done('e3_home');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
