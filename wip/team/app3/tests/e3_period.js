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
         Fri 8 Jan in the try book, the working day before the weekend), and the period running now is written as running to today's pay */
    const got = await period(), head = await p.$eval('[data-card=safe] h2', e => e.textContent);
    ck('10 Dec: the period runs to today\'s pay, never 10 Nov to 10 Dec', got.text === '10 Nov to today\'s pay', got.text);
    /* [C8, M51] "next pay" is today's pay on this screen (the period card), so the heading names the one after it as that */
    ck('10 Dec: safe to spend runs to the pay after today\'s, and says so', head === 'Safe to spend until the pay after today\'s, on 8 Jan 2027, includes today\'s pay of ¥180,000, not in your bank yet', head);   // [BV2.13] counted, not seen yet
    ck('10 Dec: "next pay" means one pay on Home: today\'s', /Next pay 10 Dec, today/.test(got.next) && !/next pay on/i.test(await p.$eval('#a3Home', e => e.textContent)), got.next);   // the try book's January pay lands Fri 8 Jan (Sun 10, holiday Mon 11: the working day before)
  }
  await p.click('#a3CheckGo'); await T.w(200);
  const names = await p.$$eval('.a3-tick', rs => rs.map(r => [r.dataset.item, r.querySelector('label span').textContent]));
  for (const [it, nm] of names) if (!/job/.test(nm)) await p.click(`.a3-tick[data-item="${it}"] input[type=checkbox]`);
  await p.tap('[data-bankfig]'); await p.keyboard.type('526000');
  await p.click('#a3CheckSave'); await T.w(300);
  const after = await period();
  ck('after both pays are ticked on 10 Dec, the period starts that day', after.start === '2026-12-10' && after.end === '2027-01-07' && after.text === '10 Dec 2026 to 7 Jan 2027', JSON.stringify(after));
  ck('and the next pay is coming', after.state === 'coming', after.next);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  /* [qc-numbers run 1 B5, coordinator 17's ruling (a)] pay-day morning, the pay not ticked, Free to spend left caps safe
     to spend: the figure is what is left of the old period's Free to spend, so the heading names the old period (until
     today's pay is in), never the pay after today's. Set up 1 Dec: bank 300,000, pay 250,000 on the 10th, Free to spend
     60,000; 5,000 spent on 3 Dec */
  {
    const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js'), nid = I.idMaker('b5per', () => 0.4);
    const bk5 = B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00+09:00', country: 'JP', currency: 'JPY',
      banks: [{ key: 'b', name: 'Main bank', amount: 300000 }],
      pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: 250000, day: 10, shift: 'none', startsPeriod: true }], bills: [], free: 60000 }, { newId: I.idMaker('b5book', () => 0.6) }).book;
    bk5.events.push({ id: nid(), k: 'spend', acct: bk5.accounts[0].id, date: '2026-12-03', a: 5000, line: 'free', told: '2026-12-03T12:00+09:00' });
    const r5 = T.L.lookahead(bk5, '2026-12-10');
    ck('B5: on pay day before the tick, the engine caps safe to spend by the old period\'s Free to spend left', r5.safeToSpend.cappedByFreeToSpend && r5.safeToSpend.headline === r5.period.free.left && r5.daysToNextPay.days === 0, JSON.stringify([r5.safeToSpend, r5.period.free]));
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3b5-');
    const o = await T.open({ profile: prof });
    await o.p.goto(T.URL0 + '?today=2026-12-10'); await T.w(300);
    await o.p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk5);
    await o.p.reload(); await T.w(400);
    const h5 = await o.p.$eval('[data-card=safe] h2', e => e.textContent);
    ck('B5: the heading names the old period: until today\'s pay is in', h5 === 'Safe to spend until today\'s pay is in', h5);
    /* [qc-numbers run 2] the list under it runs to the pay after today's (the engine's dueBeforeNextPay), so its heading says so */
    const d5 = await o.p.$eval('[data-card=due] h2', e => e.textContent);
    /* [qc-numbers confirming run 3, CONFUSING] and says when that is */
    ck('B5: the due list is headed as running to the pay after today\'s, with its date', d5 === 'Due before the pay after today\'s, on 10 Jan 2027', d5);
    ck('no page errors (B5)', o.errs.length === 0, o.errs.join(' | '));
    await o.b.close();
  }
  T.done('e3_period');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
