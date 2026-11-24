#!/usr/bin/env node
/* The pay form changes how often pay lands to and from two days a month and no fixed pay (slice 6b, item 1; BP3).
   Made-up yen, Japan. Set up Tue 1 Dec 2026: Bank ¥500,000, Pay ¥150,000 on the 15th and the last day, Free to spend
   ¥50,000 each pay, Rent ¥80,000 on the 27th.
   10 Dec, the pay form: "How often it lands" offers two days and no fixed pay, and shows "On two days each month" with
   15 and the last day. No fixed pay proposes Free to spend as ¥100,000 a month (50,000 x 24 / 12) and says so; back to
   two days it is ¥50,000 again. Saved as no fixed pay: Plan has no pay period, Free to spend ¥100,000 a month; Home
   says how long the money lasts.
   12 Dec, the pay form again: it shows no fixed pay, Free to spend ¥100,000 a month. Two days a month (15 and the last
   day) proposes ¥50,000 each pay (100,000 x 12 / 24); the second day box shows only for two days, the day of one pay
   only for every few weeks. Saved: the rule starts with the first pay, Tue 15 Dec; Free to spend ¥50,000 each pay from
   then. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const L = require('./lives3.js').make('e3_paychange');
const { ck, go, tab, typeIn, w } = L;
const num = v => Number(String(v).replace(/[^\d.]/g, ''));
(async () => {
  const { c, p } = await L.open();
  await go(p, '2026-12-01');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3BankName', 'Bank'); await typeIn(p, '#s3Bank', '500000');
  await typeIn(p, '#s3PayAmt', '150000'); await p.selectOption('#s3PayEvery', 'days'); await p.selectOption('#s3PayDay', '15'); await p.selectOption('#s3PayDay2', 'last');
  await typeIn(p, '#s3Free', '50000');
  await p.click('#s3AddBill'); await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '80000'); await p.selectOption('[data-row=bill1] [data-f=day]', '27');
  await finishSetup3(p); await w(700);
  const box = () => p.evaluate(() => { const l = [...document.querySelectorAll('#a3Plan label')].find(x => /^Free to spend /.test(x.textContent)); const i = l && document.getElementById(l.getAttribute('for')); return i ? { label: l.textContent, v: i.value, hint: (i.parentElement.querySelector('.a3-sub') || {}).textContent || '' } : null; });
  const shown = k => p.$eval('#pl-' + k, e => !e.closest('.a3-field').hidden);
  const openPay = async () => { await tab(p, 'plan'); await p.click('[data-pay]'); await w(250); };

  await go(p, '2026-12-10'); await openPay();
  const opts = await p.$$eval('#pl-every option', os => os.map(o => o.value));
  ck('pay form offers two days a month and no fixed pay', opts.includes('days') && opts.includes('none'), opts.join(','));
  ck('pay form shows two days a month, 15 and the last day', await p.$eval('#pl-every', e => e.value) === 'days' && await p.$eval('#pl-day', e => e.value) === '15' && await p.$eval('#pl-day2', e => e.value) === 'last');
  ck('two days: the second day shows, the day of one pay does not', await shown('day2') && !(await shown('start')));
  let b = await box();
  ck('Free to spend ¥50,000 each pay, as now', !!b && num(b.v) === 50000 && /each pay from the change/.test(b.label), JSON.stringify(b));
  await p.selectOption('#pl-every', 'none'); await w(200);
  b = await box();
  ck('no fixed pay: Free to spend proposed as ¥100,000 a month, with the reason', !!b && num(b.v) === 100000 && b.label === 'Free to spend a month from the change'
    && /¥50,000 twice a month is ¥100,000 a month, the same money a year/.test(b.hint), JSON.stringify(b));
  ck('no fixed pay: no day boxes', !(await shown('day')) && !(await shown('day2')) && !(await shown('start')));
  await p.selectOption('#pl-every', 'days'); await w(200);
  b = await box();
  ck('back to two days: ¥50,000 again, no reason', !!b && num(b.v) === 50000 && !b.hint.trim(), JSON.stringify(b));
  await p.selectOption('#pl-every', 'none'); await w(150);
  await p.click('[data-plbtn="0"]'); await w(600);
  ck('saved with no error', !(await L.txt(p, '#plErr')).replace('(none)', '').trim(), await L.txt(p, '#plErr'));
  const plan = await L.txt(p, '#a3Plan');
  ck('Plan: no pay period, Free to spend ¥100,000 a month', /Your plan, with no fixed pay/.test(plan) && /¥100,000 a month/.test(plan), plan);
  ck('Plan: the pay has no fixed day', /no fixed day/i.test(await L.txt(p, '[data-pay]')), await L.txt(p, '[data-pay]'));
  await tab(p, 'home');
  ck('Home: how long the money lasts', /lasts about/i.test(await L.txt(p, '#a3Home')), await L.txt(p, '#a3Home'));

  await go(p, '2026-12-12'); await openPay();
  ck('pay form shows no fixed pay', await p.$eval('#pl-every', e => e.value) === 'none');
  b = await box();
  ck('Free to spend ¥100,000 a month, as now', !!b && num(b.v) === 100000 && b.label === 'Free to spend a month from the change', JSON.stringify(b));
  await p.selectOption('#pl-every', 'weeks2'); await w(150);
  ck('every 2 weeks: the day of one pay shows, no day boxes', await shown('start') && !(await shown('day')) && !(await shown('day2')));
  await p.selectOption('#pl-every', 'days'); await p.fill('#pl-day', '15'); await p.selectOption('#pl-day2', 'last'); await w(200);
  b = await box();
  ck('two days a month: Free to spend proposed as ¥50,000 each pay, with the reason', !!b && num(b.v) === 50000 && b.label === 'Free to spend each pay from the change'
    && /¥100,000 a month is ¥50,000 twice a month, the same money a year/.test(b.hint), JSON.stringify(b));
  await p.click('[data-plbtn="0"]'); await w(600);
  ck('saved with no error', !(await L.txt(p, '#plErr')).replace('(none)', '').trim(), await L.txt(p, '#plErr'));
  const bk = await L.readBook(p), ps = bk.schedules.find(x => x.kind === 'income'), sh = bk.plan.shares.filter(x => !x.gone).slice(-1)[0];
  const saved = { rule: ps.rules.slice(-1)[0], startsPeriod: ps.startsPeriod, share: [sh.from, sh.per, sh.free] };
  ck('saved: two days a month from the first pay, Tue 15 Dec; Free to spend ¥50,000 each pay from then', saved.rule.from === '2026-12-15' && JSON.stringify(saved.rule.rule) === JSON.stringify({ every: 'month', days: [15, 'last'] })
    && saved.startsPeriod === true && JSON.stringify(saved.share) === JSON.stringify(['2026-12-15', { free: 'pay' }, 50000]), JSON.stringify(saved));
  await c.close();
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
