#!/usr/bin/env node
/* A second income in setup can land every n weeks or on two days a month (slice 6b, item 2), as well as on the same
   days as the pay, on a day each month or on no fixed day. Made-up yen, Japan; set up Tue 1 Dec 2026, Bank ¥300,000,
   pay ¥250,000 on the 25th.
   1. Tutoring ¥20,000 every 2 weeks, given by its next one, Fri 11 Dec: saved stepped back to a day on or before setup,
      Fri 27 Nov (11 Dec less 2 weeks, BP1). Plan: "every 2 weeks, on Fridays, next 11 Dec". Check your bank on 11 Dec
      asks about it.
   2. A room let ¥30,000 on the 10th and the 20th: saved as two days each month; Plan: "day 10 and day 20 each month,
      next 10 Dec". With no day of one given for every few weeks, setup asks for it first. */
'use strict';
const L = require('./lives3.js').make('e3_income2');
const { ck, go, tab, typeIn, w } = L;
const shown = (p, s) => p.$eval(s, e => !e.closest('[hidden]')).catch(() => false);
async function setup(p, fill) {
  await go(p, '2026-12-01');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3BankName', 'Bank'); await typeIn(p, '#s3Bank', '300000');
  await typeIn(p, '#s3PayAmt', '250000'); await p.selectOption('#s3PayDay', '25');
  await p.click('#s3AddPay'); await w(100);
  await fill(p);
  await p.click('#a3SetupSave'); await w(700);
}
(async () => {
  {
    const { c, p } = await L.open();
    await setup(p, async p => {
      await typeIn(p, '[data-row=pay2] [data-f=name]', 'Tutoring'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '20000');
      const opts = await p.$$eval('[data-row=pay2] [data-f=every] option', os => os.map(o => o.value));
      ck('a second income offers every n weeks and two days a month', ['same', 'month', 'days', 'weeks1', 'weeks2', 'weeks4', 'none'].every(v => opts.includes(v)), opts.join(','));
      await p.selectOption('[data-row=pay2] [data-f=every]', 'weeks2'); await w(100);
      ck('every 2 weeks: the day of one is asked, no day of the month', await shown(p, '[data-row=pay2] [data-f=start]') && !(await shown(p, '[data-row=pay2] [data-f=day]')) && !(await shown(p, '[data-row=pay2] [data-f=day2]')));
      await p.click('#a3SetupSave'); await w(400);
      ck('no day of one given: asked before saving', (await L.txt(p, '[data-err-for=s3-pay2-st]')) === 'Type the day of one pay, the last one or the next one' && !(await p.$eval('#a3Setup', e => e.hidden)));
      await p.fill('[data-row=pay2] [data-f=start]', '2026-12-11');
    });
    ck('saved', await p.$eval('#a3Setup', e => e.hidden), await L.txt(p, '#a3SetupErr'));
    const bk = await L.readBook(p), s = bk.schedules.find(x => x.name === 'Tutoring');
    ck('Tutoring: every 2 weeks from Fri 27 Nov (the next one stepped back), not starting the period', JSON.stringify(s.rules[0].rule) === '{"every":"weeks","n":2,"from":"2026-11-27"}' && !s.startsPeriod && s.steps[0].amount === 20000, JSON.stringify(s.rules));
    await tab(p, 'plan');
    const row = await L.txt(p, `[data-pay="${s.id}"]`);
    ck('Plan: every 2 weeks, on Fridays, next 11 Dec', /every 2 weeks, on Fridays, next 11 Dec/.test(row), row);
    await go(p, '2026-12-11'); await tab(p, 'home'); await p.click('#a3CheckGo'); await w(250);
    const items = await L.txt(p, '#a3Check');
    ck('Check your bank on 11 Dec asks about Tutoring', /Tutoring/.test(items), items);
    await c.close();
  }
  {
    const { c, p } = await L.open();
    await setup(p, async p => {
      await typeIn(p, '[data-row=pay2] [data-f=name]', 'Room'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '30000');
      await p.selectOption('[data-row=pay2] [data-f=every]', 'days'); await w(100);
      ck('two days a month: both day boxes, no day of one', await shown(p, '[data-row=pay2] [data-f=day]') && await shown(p, '[data-row=pay2] [data-f=day2]') && !(await shown(p, '[data-row=pay2] [data-f=start]')));
      await p.selectOption('[data-row=pay2] [data-f=day]', '10'); await p.selectOption('[data-row=pay2] [data-f=day2]', '20');
    });
    ck('saved', await p.$eval('#a3Setup', e => e.hidden), await L.txt(p, '#a3SetupErr'));
    const bk = await L.readBook(p), s = bk.schedules.find(x => x.name === 'Room');
    ck('Room: the 10th and the 20th each month', JSON.stringify(s.rules[0].rule) === '{"every":"month","days":[10,20]}' && !s.startsPeriod, JSON.stringify(s.rules));
    await tab(p, 'plan');
    const row = await L.txt(p, `[data-pay="${s.id}"]`);
    ck('Plan: day 10 and day 20 each month, next 10 Dec', /day 10 and day 20 each month, next 10 Dec/.test(row), row);
    await c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
