#!/usr/bin/env node
/* Life A, given the NEXT pay (slice 6, qc-foundation blocker): Sam as in e3_life_a.js, but setup on Mon 7 Dec 2026 is
   told the pay every 2 weeks by its next day, Fri 18 Dec, and Free to spend is $400.00 each pay. Made-up dollars,
   weekends only; figures worked by hand in cents.

   The pay before setup was Fri 4 Dec (18 Dec less 2 weeks), so the period is 4 to 17 Dec, as when 4 Dec is given.
   7 Dec  Free to spend counts its share from the setup day: 7 to 17 Dec is 11 of 14 days, 40,000 x 11 / 14 = 31,428.
          What Checking and Cash can spare is far more (Checking 185,000 - phone 4,500 on 15 Dec = 180,500, Cash 12,000),
          so safe to spend is capped at Free to spend left: 31,428 ($314.28). Plan and Receipts show the period.
   10 Dec spend $28.00 cash on Free to spend: Free to spend left 31,428 - 2,800 = 28,628; Cash 9,200. Safe 28,628.
   18 Dec check-in: phone (15 Dec) and pay (18 Dec) ticked; Checking 185,000 - 4,500 + 160,000 = 340,500; Cash 9,200.
          Period 18 to 31 Dec, Free to spend 40,000. Checking 340,500; 21 Dec Visa -23,000 = 317,500 (lowest);
          1 Jan +160,000 - 90,000 rent - 40,000 (the next period's Free to spend) = 347,500. Spare 317,500 + 9,200 =
          326,700, so safe to spend is Free to spend left: 40,000. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const L = require('./lives3.js').make('e3_life_a2');
const { ck, go, tab, typeIn, log, checkin, home, w } = L;
(async () => {
  const { c, p } = await L.open();
  await go(p, '2026-12-07');
  await p.click('#a3SetupGo'); await w(200);
  await p.selectOption('#s3Cur', 'USD');
  await typeIn(p, '#s3BankName', 'Checking'); await typeIn(p, '#s3Bank', '1850');
  await p.click('#s3AddAcct'); await typeIn(p, '[data-row=acct2] [data-f=name]', 'Cash'); await p.selectOption('[data-row=acct2] [data-f=type]', 'cash'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '120');
  await typeIn(p, '#s3PayAmt', '1600'); await p.selectOption('#s3PayEvery', 'weeks2'); await p.fill('#s3PayStart', '2026-12-18');
  await typeIn(p, '#s3Free', '400');
  await p.click('#s3AddCard'); await typeIn(p, '[data-row=card1] [data-f=name]', 'Visa'); await typeIn(p, '[data-row=card1] [data-f=owed]', '230'); await p.selectOption('[data-row=card1] [data-f=payDay]', '20');
  let k = 0;
  for (const [name, amt, day] of [['Rent', 900, '1'], ['Phone', 45, '15']]) {
    k++; await p.click('#s3AddBill'); const r = `[data-row=bill${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.selectOption(r + '[data-f=day]', day);
  }
  await finishSetup3(p); await w(700);
  await home(p, '7 Dec after setup with the next pay given', 31428, { Checking: 185000, Cash: 12000 });
  ck('7 Dec: the period is 4 Dec to 17 Dec', (await p.$eval('[data-fig=period]', e => e.textContent).catch(() => '')) === '4 Dec to 17 Dec');
  await tab(p, 'plan');
  ck('7 Dec Plan: the period shows, with Free to spend $314.28 of $400.00', (await p.$eval('[data-fig=plan-period]', e => e.textContent).catch(() => '')) === '4 Dec to 17 Dec'
    && /\$314\.28/.test(await L.txt(p, '[data-card=plan-period]')), await L.txt(p, '[data-card=plan-period]'));
  await tab(p, 'receipts');
  ck('7 Dec Receipts: the period shows', (await p.$eval('[data-fig=rc-period]', e => e.textContent).catch(() => '')) === '4 Dec to 17 Dec', await L.txt(p, '#rcList'));
  await go(p, '2026-12-10'); await log(p, 28, 'Cash', { note: 'lunch' });
  await home(p, '10 Dec after a cash spend', 28628, { Checking: 185000, Cash: 9200 });
  await go(p, '2026-12-18'); await checkin(p, { Checking: '3405', Cash: '92' });
  await home(p, '18 Dec after the check', 40000, { Checking: 340500, Cash: 9200 });
  /* [qc-foundation 2] the pay form, changed from every 2 weeks to a day each month: Free to spend $400.00 each pay is
     proposed as the same money a year, $400 x 26 / 12 = $866.67 each pay (rounded half up), and says so. Back to
     every 2 weeks, it is $400.00 again. Nothing is saved (Back). */
  await tab(p, 'plan'); await p.click(`[data-pay="${await p.$eval('[data-pay]', e => e.dataset.pay)}"]`); await w(250);
  const box = () => p.evaluate(() => { const l = [...document.querySelectorAll('#a3Plan label')].find(x => /^Free to spend each pay from the change/.test(x.textContent)); const i = l && document.getElementById(l.getAttribute('for')); return i ? { v: i.value, hint: (i.parentElement.querySelector('.a3-sub') || {}).textContent || '' } : null; });
  let b = await box();
  ck('18 Dec pay form: Free to spend $400.00 each pay, as now', !!b && Number(b.v.replace(/[^\d.]/g, '')) === 400, JSON.stringify(b));
  await p.selectOption('#pl-every', 'month'); await w(200);
  b = await box();
  ck('18 Dec pay form, monthly: Free to spend proposed as $866.67, with the reason', !!b && Number(b.v.replace(/[^\d.]/g, '')) === 866.67 && /\$400\.00 every 2 weeks is \$866\.67 a month/.test(b.hint), JSON.stringify(b));
  await p.selectOption('#pl-every', 'weeks2'); await w(200);
  b = await box();
  ck('18 Dec pay form, back to every 2 weeks: $400.00 again', !!b && Number(b.v.replace(/[^\d.]/g, '')) === 400, JSON.stringify(b));
  await p.click('#plBack'); await w(200);
  await c.close();
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
