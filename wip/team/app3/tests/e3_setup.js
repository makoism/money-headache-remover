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
  /* [BL1] a pay of 0 is refused with words and saves nothing */
  await typeIn(p, '#s3PayAmt', '0'); await p.click('#a3SetupSave'); await T.w(300);
  ck('a pay of 0 is refused with words', (await p.$eval('#a3SetupErr', e => e.textContent)) === 'A pay needs an amount. If it comes when it comes, pick No fixed pay' && !(await p.$eval('#a3Setup', e => e.hidden)), await p.$eval('#a3SetupErr', e => e.textContent));
  ck('the pay box is the one asked about', await p.evaluate(() => document.activeElement && document.activeElement.id === 's3PayAmt'));
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
  /* [BL6] US dollars, set up Mon 23 Nov: Visa $300.10 on it now, closes on the 20th, paid on the 5th (the working day after
     a weekend). Set up between the 20 Nov close and its payment, setup asks how much was on that statement; $250 typed.
     5 Dec is a Saturday, so the $250 comes out Mon 7 Dec; the other $50.10 comes out on 5 Jan with the next statement. */
  {
    const prof2 = require('fs').mkdtempSync(require('os').tmpdir() + '/a3setup6-');
    const o = await T.open({ profile: prof2 }), q = o.p;
    await q.goto(T.URL0 + '?today=2026-11-23'); await T.w(400);
    await q.click('#a3SetupGo'); await T.w(300);
    await q.select('#s3Cur', 'USD');
    await typeIn(q, '#s3Bank', '1234.56'); await typeIn(q, '#s3PayAmt', '2500'); await q.select('#s3PayDay', '10');
    await q.click('#s3AddCard'); await T.w(100);
    const r = '[data-row=card1] ';
    await typeIn(q, r + '[data-f=name]', 'Visa'); await typeIn(q, r + '[data-f=owed]', '300.10'); await q.select(r + '[data-f=payDay]', '5');
    ck('BL6: not asked while the close day is not sure', await q.$eval(r + '[data-q=stmt]', e => e.hidden));
    await q.select(r + '[data-f=closeDay]', '20'); await T.w(200);
    const ask = await q.$eval(r + '[data-q=stmt]', e => ({ hidden: e.hidden, label: e.querySelector('label').textContent, hint: e.querySelector('[data-hint=stmt]').textContent }));
    ck('BL6: asks how much was on the statement that closed on 20 Nov', !ask.hidden && ask.label === 'How much of it was on the statement that closed on 20 Nov?', JSON.stringify(ask));
    ck('BL6: says when that part comes out', /comes out on 7 Dec/.test(ask.hint), ask.hint);
    await typeIn(q, r + '[data-f=statement]', '250');
    await q.click('#a3SetupSave'); await T.w(700);
    ck('BL6: saved', await q.$eval('#a3Setup', e => e.hidden), await q.$eval('#a3SetupErr', e => e.textContent).catch(() => ''));
    const line = (await q.$eval('[data-cardid] .when', e => e.textContent)).replace(/⁠/g, '');
    ck('BL6: Home says $250.00 comes out on 7 Dec', /\$250\.00 comes out on 7 Dec/.test(line), line);
    const due = (await q.$eval('[data-card=due]', e => e.textContent)).replace(/⁠/g, '');
    ck('BL6: the $250.00 is due before next pay', /Visa/.test(due) && /\$250\.00/.test(due), due);
    ck('BL6: no page errors', o.errs.length === 0, o.errs.join(' | '));
    await o.b.close();
  }
  /* [north star F1, BJ2] setup asks about food and everyday things. Thu 5 Nov 2026, bank 320,000, pay 250,000 on the 25th
     (the working day before a weekend): the 25 Oct pay landed Fri 23 Oct, the next lands Wed 25 Nov, so the period is
     23 Oct to 24 Nov (33 days) and 5 to 24 Nov is 20 of them. 40,000 a period: this period counts 40,000 x 20 / 33 =
     24,242, and that is safe to spend, not the whole bank. Left blank: Home asks for it in place of "Fine for now". */
  for (const free of ['40000', '']) {
    const prof3 = require('fs').mkdtempSync(require('os').tmpdir() + '/a3setupfree-');
    const o = await T.open({ profile: prof3 }), q = o.p, tag = free ? 'everyday 40,000' : 'everyday blank';
    await q.goto(T.URL0 + '?today=2026-11-05'); await T.w(400);
    await q.click('#a3SetupGo'); await T.w(300);
    const lab = await q.$eval('label[for=s3Free]', e => e.textContent).catch(() => '');
    ck(tag + ': setup asks about everyday spending', lab === 'About how much do you spend on food and everyday things each pay period?', lab);
    await typeIn(q, '#s3Bank', '320000'); await typeIn(q, '#s3PayAmt', '250000'); await q.select('#s3PayDay', '25'); await q.select('#s3PayShift', 'before');
    if (free) await typeIn(q, '#s3Free', free);
    await q.click('#a3SetupSave'); await T.w(700);
    ck(tag + ': saved', await q.$eval('#a3Setup', e => e.hidden), await q.$eval('#a3SetupErr', e => e.textContent).catch(() => ''));
    const f = await T.figs(q), safe = f.find(x => x.fig === 'safe');
    const st = await q.$eval('[data-card=status]', e => ({ level: e.dataset.level, text: e.textContent.replace(/\s+/g, ' ') }));
    if (free) {
      ck(tag + ': safe to spend leaves the share for 5 to 24 Nov: 24,242, not the bank', safe && safe.amt === 24242, JSON.stringify(safe));
      ck(tag + ': the status is fine, no prompt', /Fine for now/.test(st.text) && !(await q.$('#a3FreeGo')), st.text);
      await q.click('[data-tab=plan]'); await T.w(400);
      const fr = await q.$eval('[data-fig=free-amount]', e => Number(e.querySelector('[data-amt]') ? e.querySelector('[data-amt]').dataset.amt : e.dataset.amt)).catch(() => null);
      ck(tag + ': Plan shows Free to spend counting 24,242 of it now', fr === 24242, fr);
    } else {
      ck(tag + ': safe to spend is the bank (nothing told yet)', safe && safe.amt === 320000, JSON.stringify(safe));
      ck(tag + ': the prompt shows in place of "Fine for now"', !/Fine for now/.test(st.text) && /Add what you spend on everyday things so safe to spend leaves room for it/.test(st.text), st.text);
      await q.click('#a3FreeGo'); await T.w(400);
      const form = await q.evaluate(() => ({ plan: !document.querySelector('[data-panel=plan]').hidden, title: (document.querySelector('[data-card=plan-form] h2') || {}).textContent }));
      ck(tag + ': the prompt opens Plan\'s Set Free to spend', form.plan && form.title === 'Free to spend', JSON.stringify(form));
      await typeIn(q, '#pl-amount', '40000'); await q.click('[data-plbtn="0"]'); await T.w(500);
      await q.click('[data-tab=home]'); await T.w(400);
      const s2 = (await T.figs(q)).find(x => x.fig === 'safe');
      ck(tag + ': set there, safe to spend is the same 24,242', s2 && s2.amt === 24242, JSON.stringify(s2));
      ck(tag + ': and the prompt is gone', !(await q.$('#a3FreeGo')));
    }
    ck(tag + ': no page errors', o.errs.length === 0, o.errs.join(' | '));
    await o.b.close();
  }
  T.done('e3_setup');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
