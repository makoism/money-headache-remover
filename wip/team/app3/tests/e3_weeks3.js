#!/usr/bin/env node
/* Pay every 3 weeks, in setup and in the pay form (slice 6b, item 3). Made-up yen, Japan. Set up Tue 1 Dec 2026:
   Bank ¥500,000, Pay ¥240,000 every 3 weeks, given by its next one, Fri 18 Dec; Free to spend ¥60,000 each pay.
   The day of one is stepped back to on or before setup (BP1): 18 Dec less 3 weeks is Fri 27 Nov. The period holding
   setup is 27 Nov to 17 Dec, 21 days, 17 of them from setup: Free to spend counts 60,000 x 17 / 21 = 48,571 (rounded
   down). The bank can spare far more, so safe to spend is 48,571.
   Plan: "every 3 weeks, on Fridays, next 18 Dec". The pay form shows every 3 weeks; a day each month proposes Free to
   spend as the same money a year: 60,000 x 52 / 3 / 12 = 86,666.67, rounded half up 86,667, and says so. Every 3 weeks
   is also offered for a second income in setup. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const L = require('./lives3.js').make('e3_weeks3');
const { ck, go, tab, typeIn, home, w } = L;
const num = v => Number(String(v).replace(/[^\d.]/g, ''));
(async () => {
  const { c, p } = await L.open();
  await go(p, '2026-12-01');
  await p.click('#a3SetupGo'); await w(200);
  ck('setup offers every 3 weeks for the pay', (await p.$$eval('#s3PayEvery option', os => os.map(o => o.value))).includes('weeks3'));
  await p.click('#s3AddPay'); await w(100);
  ck('setup offers every 3 weeks for a second income', (await p.$$eval('[data-row=pay2] [data-f=every] option', os => os.map(o => o.value))).includes('weeks3'));
  await p.reload(); await w(400); await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3BankName', 'Bank'); await typeIn(p, '#s3Bank', '500000');
  await typeIn(p, '#s3PayAmt', '240000'); await p.selectOption('#s3PayEvery', 'weeks3'); await p.fill('#s3PayStart', '2026-12-18');
  await typeIn(p, '#s3Free', '60000');
  await finishSetup3(p); await w(700);
  const bk = await L.readBook(p), s = bk.schedules.find(x => x.kind === 'income');
  ck('saved every 3 weeks from Fri 27 Nov', JSON.stringify(s.rules[0].rule) === '{"every":"weeks","n":3,"from":"2026-11-27"}' && s.startsPeriod === true, JSON.stringify(s.rules));
  await home(p, '1 Dec after setup', 48571, { Bank: 500000 });
  ck('the period is 27 Nov to 17 Dec', (await p.$eval('[data-fig=period]', e => e.textContent).catch(() => '')) === '27 Nov to 17 Dec');
  await tab(p, 'plan');
  const row = await L.txt(p, '[data-pay]');
  ck('Plan: every 3 weeks, on Fridays, next 18 Dec', /every 3 weeks, on Fridays, next 18 Dec/.test(row), row);
  await p.click('[data-pay]'); await w(250);
  ck('pay form shows every 3 weeks, from Fri 27 Nov', await p.$eval('#pl-every', e => e.value) === 'weeks3' && await p.$eval('#pl-start', e => e.value) === '2026-11-27');
  await p.selectOption('#pl-every', 'month'); await w(200);
  const b = await p.evaluate(() => { const l = [...document.querySelectorAll('#a3Plan label')].find(x => /^Free to spend /.test(x.textContent)); const i = l && document.getElementById(l.getAttribute('for')); return i ? { v: i.value, hint: (i.parentElement.querySelector('.a3-sub') || {}).textContent || '' } : null; });
  ck('a day each month: Free to spend proposed as ¥86,667, with the reason', !!b && num(b.v) === 86667 && /¥60,000 every 3 weeks is ¥86,667 a month/.test(b.hint), JSON.stringify(b));
  await p.click('#plBack'); await w(200);
  await c.close();
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
