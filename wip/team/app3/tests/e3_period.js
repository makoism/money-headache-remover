#!/usr/bin/env node
/* The period on Home by its dates, from the engine's res.period (WIRING_PLAN step 2, F4), made-up Mako book.
   23 Nov: 10 Nov to 9 Dec, next pay coming. 11 Dec with the pay not ticked: late. 16 Dec: not seen yet. 10 Dec after
   ticking both pays at Check your bank: the new period starts that day and runs to the day before the January pay. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const SN = require('../../screens/names.js');
(async () => {
  const bk = T.book();
  const { b, p, errs } = await T.open();
  const period = () => p.evaluate(() => { const e = document.querySelector('[data-fig=period]'), n = document.querySelector('[data-fig=nextpay]'); return { start: e && e.dataset.start, end: e && e.dataset.end, text: e && e.textContent, state: n && n.dataset.state, next: n && n.textContent }; });
  for (const [day, state] of [['2026-11-23', 'coming'], ['2026-12-11', 'late'], ['2026-12-16', 'notSeen']]) {
    await p.goto(T.URL0 + '?try=mako&today=' + day); await T.w(300);
    const r = T.L.lookahead(bk, day), got = await period();
    ck(day + ' the period is the engine\'s', got.start === r.period.start && got.end === r.period.end && got.text === SN.periodLabel(r.period.start, r.period.end), JSON.stringify(got));
    ck(day + ' the next pay is ' + state, r.period.nextPay.state === state && got.state === state, JSON.stringify(got) + ' engine ' + r.period.nextPay.state);
    /* one next pay on Home, from res.period.nextPay: never a later pay's date while this one is late or not seen */
    const head = await p.$eval('[data-card=safe] h2', e => e.textContent), all = await p.$eval('#a3Home', e => e.textContent);
    const want = { coming: 'Safe to spend until next pay on 10 Dec', late: 'Safe to spend, not counting the 10 Dec pay yet (late)', notSeen: 'Safe to spend, not counting the 10 Dec pay (not seen yet)' }[state];
    ck(day + ' the safe to spend heading names that pay', head === want, head);
    ck(day + ' no later pay date is named as the next pay', !/(next pay on|Next pay) \d+ Jan/.test(all), all.match(/.{0,30}Jan.{0,10}/g));
    const said = (all.match(/10 Dec pay|Pay due 10 Dec|Next pay 10 Dec|next pay on 10 Dec/g) || []).length;
    ck(day + ' the pay is named twice at most: the heading and the period card', said <= 2, said);
  }
  const first = await (async () => { await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(200); return period(); })();
  ck('23 Nov reads 10 Nov to 9 Dec', first.text === '10 Nov to 9 Dec', first.text);
  await p.goto(T.URL0 + '?try=mako&today=2026-12-10'); await T.w(300);
  {   /* [S1] on pay day, before the check: the pay counts today (G4), so safe to spend runs to the January pay (on
         Tue 12 Jan in the try book), and the period running now is written as running to today's pay */
    const got = await period(), head = await p.$eval('[data-card=safe] h2', e => e.textContent);
    ck('10 Dec: the period runs to today\'s pay, never 10 Nov to 10 Dec', got.text === '10 Nov to today\'s pay', got.text);
    /* [C8, M51] "next pay" is today's pay on this screen (the period card), so the heading names the one after it as that */
    ck('10 Dec: safe to spend runs to the pay after today\'s, and says so', head === 'Safe to spend until the pay after today\'s, on 12 Jan 2027, includes today\'s pay of ¥180,000, not in your bank yet', head);   // [BV2.13] counted, not seen yet
    ck('10 Dec: "next pay" means one pay on Home: today\'s', /Next pay 10 Dec, today/.test(got.next) && !/next pay on/i.test(await p.$eval('#a3Home', e => e.textContent)), got.next);   // the try book's January pay lands Tue 12 Jan (Sun 10, holiday Mon 11)
  }
  await p.click('#a3CheckGo'); await T.w(200);
  const names = await p.$$eval('.a3-tick', rs => rs.map(r => [r.dataset.item, r.querySelector('label span').textContent]));
  for (const [it, nm] of names) if (!/job/.test(nm)) await p.click(`.a3-tick[data-item="${it}"] input[type=checkbox]`);
  await p.tap('[data-bankfig]'); await p.keyboard.type('526000');
  await p.click('#a3CheckSave'); await T.w(300);
  const after = await period();
  ck('after both pays are ticked on 10 Dec, the period starts that day', after.start === '2026-12-10' && after.end === '2027-01-11' && after.text === '10 Dec 2026 to 11 Jan 2027', JSON.stringify(after));
  ck('and the next pay is coming', after.state === 'coming', after.next);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_period');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
