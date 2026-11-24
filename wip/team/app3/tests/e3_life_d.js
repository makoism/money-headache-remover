#!/usr/bin/env node
/* Life D (slice 6b): Noa, paid on two days a month, changes to no fixed pay in the middle of a pay period. Walked
   through the real page from setup on Tue 1 Dec 2026 to a check-in on Mon 4 Jan 2027. Made-up dollars, country other
   (weekends only, no holidays). Figures worked by hand in cents below; the page must show them, and every check-in
   reloads the page and checks every figure is the same.

   Setup Tue 1 Dec: Checking $5,500.00; Pay $1,500.00 on the 15th and the last day (on a weekend, the working day
   before); Free to spend $500.00 each pay; Rent $1,200.00 on the 1st (1 Dec has gone out, the default) and Phone $50.00
   on the 20th (on a weekend, the working day after). Days that move: Sun 20 Dec -> Mon 21 Dec; Sun 31 Jan -> Fri 29 Jan
   (pay); Sat 20 Feb -> Mon 22 Feb.
   1 Dec  The pay of Mon 30 Nov starts the period holding setup: 30 Nov to 14 Dec, 15 days, 14 of them from setup.
          Free to spend counts 50,000 x 14 / 15 = 46,666. Checking can spare far more, so safe to spend is 46,666.
   3 Dec  Plan: a line, Food $200.00 each pay: 20,000 x 14 / 15 = 18,666.67 counts in this period (I4, BP2), 18,666,
          and the 10 left over (280,000 - 18,666 x 15) go to Free to spend [J4]: (700,000 + 10) / 15 = 46,667. Safe 46,667.
   5 Dec  spend $40.00 on Free to spend: left 42,667; Checking 546,000. Safe 42,667.
   6 Dec  spend $30.00 on Food: Food left 15,666; Checking 543,000. Safe 42,667.
   10 Dec the pay changes to no fixed pay from 10 Dec. The form proposes each line as the same money a year, a month:
          Food $200 twice a month is $400 a month; Free to spend $500 twice a month is $1,000 a month (BP3; whole dollars
          are written without cents on that screen, BL4).
          From now: no pay period, each line comes off by the day (B4), and Free to spend starts again each calendar
          month (BQ3); in December it counts from the change day, its share by days left: 100,000 x 22 / 31 = 70,967
          (10 to 31 Dec, rounded down). By the day: Food 40,000 x 12 / 365 = 1,315 a day, a 31-day month's share 40,767, so
          2 more on its last day; Free to spend 3,287 a day, a 31-day month 101,917, so 20 more on its last day.
          The walk runs to its horizon: 45 days, or the second coming one of each bill if later. 10 Dec + 45 = 24 Jan;
          rent's second is Mon 1 Feb: horizon 1 Feb. Bills: phone 21 Dec 5,000, rent 1 Jan 120,000, phone 20 Jan
          5,000, rent 1 Feb 120,000 = 250,000. Food 11 to 31 Dec 21 x 1,315 + 2 = 27,617, January 40,767, 1 Feb 1,315 =
          69,699; Free to spend 21 x 3,287 + 20 = 69,047, 101,917, 3,287 = 174,251; together 243,950.
          543,000 - 250,000 - 243,950 = 49,050, under Free to spend left (70,967): safe to spend 49,050.
   12 Dec spend $25.00 on Free to spend: Checking 540,500; Free to spend left 70,967 - 2,500 = 68,467. Horizon 1 Feb. By the day 13 Dec
          to 1 Feb: Food 19 x 1,315 + 2 + 40,767 + 1,315 = 67,069; Free 19 x 3,287 + 20 + 101,917 + 3,287 = 167,677;
          together 234,746. 540,500 - 250,000 - 234,746 = 55,754: safe 55,754.
   15 Dec check-in (no pay is expected now): Checking shows $5,405.00. Horizon 1 Feb. By the day 16 Dec to 1 Feb:
          Food 16 x 1,315 + 2 + 40,767 + 1,315 = 63,124; Free 16 x 3,287 + 20 + 101,917 + 3,287 = 157,816; together
          220,940. 540,500 - 250,000 - 220,940 = 69,560, over Free to spend left: safe 68,467.
   18 Dec money in: a client payment $900.00 to Checking: 630,500. Horizon 1 Feb. By the day 19 Dec to 1 Feb: Food 13 x
          1,315 + 2 + 40,767 + 1,315 = 59,179; Free 13 x 3,287 + 20 + 101,917 + 3,287 = 147,955; together 207,134.
          630,500 - 250,000 - 207,134 = 173,366, over Free to spend left: safe 68,467.
   22 Dec check-in: phone (21 Dec) ticked; Checking shows $6,255.00 (630,500 - 5,000). 22 Dec + 45 = 5 Feb; phone's
          second is Mon 22 Feb: horizon 22 Feb. Bills: rent 1 Jan, phone 20 Jan, rent 1 Feb, phone 22 Feb = 250,000.
          By the day 23 Dec to 22 Feb: Food 9 x 1,315 + 2 + 40,767 + 22 x 1,315 = 81,534; Free 9 x 3,287 + 20 + 101,917
          + 22 x 3,287 = 203,834; together 285,368. 625,500 - 250,000 - 285,368 = 90,132, over Free to spend left:
          safe 68,467.
          Lasts about: from 625,500, 4,602 a day (22 more on a 31-day month's last day; February's shares 36,821 and
          92,054): end of December 584,060; January - 120,000 - 142,684 - 5,000 = 316,376; February - 120,000 - 128,875
          - 5,000 = 62,501; 1 Mar rent 120,000: below zero on 1 Mar, 69 days away: 9 weeks.
   2 Jan  money in: a client payment $1,200.00: Checking 745,500.
   4 Jan  check-in: rent (1 Jan) ticked; Checking shows $6,255.00 (745,500 - 120,000). 4 Jan + 45 = 18 Feb; rent's
          second is Mon 1 Mar: horizon 1 Mar. Bills: phone 20 Jan, rent 1 Feb, phone 22 Feb, rent 1 Mar = 250,000. By
          the day 5 Jan to 1 Mar: Food 27 x 1,315 + 2 + 36,821 + 1,315 = 73,643; Free 27 x 3,287 + 20 + 92,054 + 3,287
          = 184,110; together 257,753. 625,500 - 250,000 - 257,753 = 117,747, over Free to spend left, which starts
          again in January (BQ3): 100,000, nothing spent on it yet: safe 100,000. */
'use strict';
const L = require('./lives3.js').make('e3_life_d');
const { ck, go, tab, typeIn, log, checkin, home, w } = L;
const num = v => Number(String(v).replace(/[^\d.]/g, ''));
(async () => {
  const { c, p } = await L.open();
  /* 1 Dec: setup */
  await go(p, '2026-12-01');
  await p.click('#a3SetupGo'); await w(200);
  await p.selectOption('#s3Cur', 'USD');
  await typeIn(p, '#s3BankName', 'Checking'); await typeIn(p, '#s3Bank', '5500');
  await typeIn(p, '#s3PayAmt', '1500'); await p.selectOption('#s3PayEvery', 'days'); await p.selectOption('#s3PayDay', '15'); await p.selectOption('#s3PayDay2', 'last');
  await typeIn(p, '#s3Free', '500');
  let k = 0;
  for (const [name, amt, day] of [['Rent', 1200, '1'], ['Phone', 50, '20']]) {
    k++; await p.click('#s3AddBill'); const r = `[data-row=bill${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.selectOption(r + '[data-f=day]', day);
  }
  await p.click('#a3SetupSave'); await w(700);
  await home(p, '1 Dec after setup', 46666, { Checking: 550000 });
  ck('1 Dec: the period is 30 Nov to 14 Dec', (await p.$eval('[data-fig=period]', e => e.textContent).catch(() => '')) === '30 Nov to 14 Dec');
  /* 3 Dec: Food $200.00 each pay */
  await go(p, '2026-12-03'); await tab(p, 'plan');
  await p.click('#plAddLine'); await w(200); await typeIn(p, '#pl-name', 'Food'); await typeIn(p, '#pl-amount', '200'); await p.click('[data-plbtn="0"]'); await w(500);
  ck('3 Dec Plan: Food counts $186.66 of $200.00 in this period', /Food.*\$186\.66/.test(await L.txt(p, '[data-card=plan-period]')), await L.txt(p, '[data-card=plan-period]'));
  await home(p, '3 Dec with Food', 46667, { Checking: 550000 });
  await go(p, '2026-12-05'); await log(p, 40, 'Checking', { note: 'groceries' });
  await home(p, '5 Dec after $40.00 on Free to spend', 42667, { Checking: 546000 });
  await go(p, '2026-12-06'); await log(p, 30, 'Checking', { for: 'Food', note: 'market' });
  await home(p, '6 Dec after $30.00 on Food', 42667, { Checking: 543000 });
  ck('6 Dec Plan: Food $156.66 left', /Food.*\$156\.66/.test(await L.txt(p, '[data-card=plan-period]')) || /\$156\.66/.test((await tab(p, 'plan'), await L.txt(p, '[data-card=plan-period]'))), await L.txt(p, '[data-card=plan-period]'));

  /* 10 Dec: the pay changes to no fixed pay */
  await go(p, '2026-12-10'); await tab(p, 'plan'); await p.click('[data-pay]'); await w(250);
  await p.selectOption('#pl-every', 'none'); await w(200);
  const boxes = await p.evaluate(() => [...document.querySelectorAll('#a3Plan label')].filter(l => / from the change$/.test(l.textContent)).map(l => { const i = document.getElementById(l.getAttribute('for')); return { label: l.textContent, v: i.value, hint: (i.parentElement.querySelector('.a3-sub') || {}).textContent }; }));
  const food = boxes.find(b => /^Food/.test(b.label)), free = boxes.find(b => /^Free to spend/.test(b.label));
  ck('10 Dec pay form, no fixed pay: Food $400 a month, with the reason', !!food && food.label === 'Food a month from the change' && num(food.v) === 400 && /\$200 twice a month is \$400 a month/.test(food.hint), JSON.stringify(food));
  ck('10 Dec pay form, no fixed pay: Free to spend $1,000 a month, with the reason', !!free && num(free.v) === 1000 && /\$500 twice a month is \$1,000 a month/.test(free.hint), JSON.stringify(free));
  await p.click('[data-plbtn="0"]'); await w(600);
  ck('10 Dec saved', !(await L.txt(p, '#plErr')).replace('(none)', '').trim(), await L.txt(p, '#plErr'));
  const plan = await L.txt(p, '#a3Plan');
  ck('10 Dec Plan: no pay period, Food $400 and Free to spend $1,000 a month', /Your plan, with no fixed pay/.test(plan) && /Food[^|]*\| Comes off by the day \| \$400 a month/.test(plan) && /\$1,000 a month/.test(plan), plan);
  await home(p, '10 Dec, no fixed pay from today', 49050, { Checking: 543000 });
  ck('10 Dec Home: no period', !(await p.$('#a3Home [data-fig=period]')));
  await L.sameAfterReload(p, '10 Dec after the change');

  await go(p, '2026-12-12'); await log(p, 25, 'Checking', { note: 'lunch' });
  await home(p, '12 Dec after $25.00 on Free to spend', 55754, { Checking: 540500 });
  await go(p, '2026-12-15');
  const list15 = await checkin(p, { Checking: '5405' });
  ck('15 Dec check-in: no pay is asked about', !list15.some(t => /Pay/.test(t)), list15.join(' | '));
  await home(p, '15 Dec after the check', 68467, { Checking: 540500 });
  await go(p, '2026-12-18'); await log(p, 900, 'Checking', { mode: 'in', note: 'client' });
  await home(p, '18 Dec after $900.00 in', 68467, { Checking: 630500 });
  await go(p, '2026-12-22');
  await checkin(p, { Checking: '6255' });
  await home(p, '22 Dec after the check, phone ticked', 68467, { Checking: 625500 });
  ck('22 Dec Home: lasts about 9 weeks', /Lasts about 9 weeks at this rate/.test(await L.txt(p, '#a3Home')), await L.txt(p, '#a3Home'));
  await go(p, '2027-01-02'); await log(p, 1200, 'Checking', { mode: 'in', note: 'client' });
  await go(p, '2027-01-04');
  await checkin(p, { Checking: '6255' });
  await home(p, '4 Jan after the check, rent ticked', 100000, { Checking: 625500 });
  await c.close();
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
