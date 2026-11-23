#!/usr/bin/env node
/* Setup, short (setup3, WIRING_PLAN 1.1 item 1 and step 10), through the page as a plain file, made-up yen.
   The first screen offers "Set up with your own numbers". Mako's made-up answers on Fri 20 Nov 2026: the bank shows
   286,000; pay on the 10th as two incomes (180,000 and 60,000, the working day after a weekend); card A 54,000 owed,
   paid on the 10th, close day not sure; card B 23,000, paid on the 11th, the working day before, close day not sure;
   rent, power, phone and internet on their due days; no minimum. Saved through engine/build_book.js and the store.
   Home then shows the same figures as the made-up try book on that day, after a reload too. A missing bank figure is
   refused with words and saves nothing. The old app's copies stay the same. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const DAY = '2026-11-20';
const typeIn = async (p, sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct;
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3setup-');
  let { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
  await T.seedOld(p);
  ck('the first screen offers setup', !!(await p.$('#a3SetupGo')) && !!(await p.$('#a3TryGo')));
  await p.click('#a3SetupGo'); await T.w(300);
  ck('setup asks what the bank shows today', /What does your bank show today/.test(await p.$eval('#a3Setup', e => e.textContent)));
  /* nothing typed: refused, nothing saved */
  await p.click('#a3SetupSave'); await T.w(300);
  ck('a missing bank figure is refused with words', /bank/i.test(await p.$eval('#a3SetupErr', e => e.textContent)) && !(await p.$eval('#a3Setup', e => e.hidden)));
  await typeIn(p, '#s3Bank', '286000');
  await p.select('#s3PayDay', '10'); await p.select('#s3PayShift', 'after');
  await typeIn(p, '#s3PayAmt', '180000'); await typeIn(p, '#s3PayName', 'Main job');
  await p.click('#s3AddPay'); await T.w(100);
  await typeIn(p, '[data-row=pay2] [data-f=name]', 'Side job'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '60000');
  for (const [n, name, owed, day, shift] of [[1, 'Card A', 54000, '10', 'after'], [2, 'Card B', 23000, '11', 'before']]) {
    await p.click('#s3AddCard'); await T.w(100);
    const r = `[data-row=card${n}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed);
    await p.select(r + '[data-f=payDay]', day); await p.select(r + '[data-f=shift]', shift);
    ck(name + ': the close day starts as "not sure"', (await p.$eval(r + '[data-f=closeDay]', e => e.value)) === 'not sure');
    ck(name + ': one why line under the close day, read with it', await p.$eval(r + '[data-f=closeDay]', e => { const h = document.getElementById(e.getAttribute('aria-describedby')); return !!h && h.dataset.hint === 'closeDay' && /next payment$/.test(h.textContent); }));
  }
  let n = 0;
  for (const [name, amt, day] of [['Rent', 72000, '27'], ['Power', 7400, '26'], ['Phone', 4800, '20'], ['Internet', 5200, '27']]) {
    n++; await p.click('#s3AddBill'); await T.w(100);
    const r = `[data-row=bill${n}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.select(r + '[data-f=day]', day);
  }
  ck('the minimum starts blank (skipped means none)', (await p.$eval('#s3Min', e => e.value)) === '');
  ck('one why line under Keep at least, read with it', await p.$eval('#s3Min', e => { const h = document.getElementById(e.getAttribute('aria-describedby')); return !!h && h.dataset.hint === 'min' && /^Safe to spend /.test(h.textContent) && !/\.$/.test(h.textContent); }));
  await T.shot(p, 'setup_' + DAY);
  await p.click('#a3SetupSave'); await T.w(600);
  const r = T.L.lookahead(bk, DAY);
  const check = async when => {
    const f = await T.figs(p), one = k => f.filter(x => x.fig === k);
    ck(when + ': Home shows the bank typed', one('bank').length === 1 && one('bank')[0].amt === 286000, JSON.stringify(one('bank')));
    ck(when + ': safe to spend is the same as the try book\'s on that day', one('safe')[0] && one('safe')[0].amt === r.safeToSpend.headline, JSON.stringify(one('safe')) + ' vs ' + r.safeToSpend.headline);
    ck(when + ': the sum behind it reads the same', one('why')[0] && one('why')[0].text === require('../../screens/money.js').sumLine(r.accounts[bank].whyParts, r.accounts[bank].headroom, r.accounts[bank].currency), one('why')[0] && one('why')[0].text);
    ck(when + ': the period is 10 Nov to 9 Dec', (await p.$eval('[data-fig=period]', e => e.textContent)) === '10 Nov to 9 Dec');
    const owed = await p.$$eval('[data-cardid]', es => es.map(e => e.textContent));
    ck(when + ': both cards with what they owe', owed.length === 2 && /Card A/.test(owed[0]) && /54,000/.test(owed[0]) && /Card B/.test(owed[1]) && /23,000/.test(owed[1]), owed.join(' | '));
    ck(when + ': the person\'s own numbers carry no made-up band', await p.$eval('#a3Try', e => e.hidden));
  };
  await check('after setup');
  await T.shot(p, 'home_after_setup_' + DAY);
  await p.reload(); await T.w(500);
  await check('after a reload');
  const old = await T.readOld(p);
  ck('the old app\'s copies are byte for byte the same', old.ls === T.OLD_TEXT && old.idb === T.OLD_IDB);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_setup');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
