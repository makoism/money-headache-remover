#!/usr/bin/env node
/* Life A (slice 6): Sam, paid every 2 weeks, walked through the real page from setup on Mon 7 Dec 2026 to a check-in on
   Mon 8 Mar 2027. Made-up US dollars, banked "somewhere else" (weekends only, no holidays). Figures worked by hand
   below in cents; the page must show them.

   Setup: Checking $1,850.00, Cash $120.00 (its own account). Pay $1,600.00 every 2 weeks, one pay on Fri 4 Dec. Visa
   $230.00 on it, paid on the 20th from Checking (the working day after), close day not sure (all of it each time).
   Bills from Checking: Rent $900.00 on the 1st, Phone $45.00 on the 15th, Car insurance $480.00 once a year on 1 Mar.
   Pays: 4 Dec, 18 Dec, 1 Jan, 15 Jan, 29 Jan, 12 Feb, 26 Feb (Fridays). Visa: Sun 20 Dec -> Mon 21 Dec; 20 Jan; Sat
   20 Feb -> Mon 22 Feb. Rent 1 Jan (Fri), 1 Feb, 1 Mar (Mon). Phone 15 Dec, 15 Jan, 15 Feb, 15 Mar.
   Safe to spend is the lowest point of Checking's walk (bank, less each line left this period, then pays, bills, card
   payments and each period's lines on its pay day), to the horizon (the second next pay, at least 45 days), plus Cash.

   No play amount is set (Groceries is a burrow line, not Free to spend), so everything on the Visa comes off today
   (M90, R1), in place of its dated payment; from 18 Dec on that changes nothing, as the Visa was due before each next
   pay anyway.
   7 Dec  setup. Period 4 to 17 Dec. Checking 185,000 - 23,000 (Visa, owed now) = 162,000; 15 Dec phone -4,500 =
          157,500 (lowest); 18 Dec +160,000; ... Safe 157,500 + 12,000 = 169,500 (was 192,500 with the Visa on 21 Dec,
          after the pay of 18 Dec).
          Plan: the pay "every 2 weeks, on Fridays"; car insurance "each year on 1 Mar". Nudge: the pays before 1 Mar are
          18 Dec, 1 Jan, 15 Jan, 29 Jan, 12 Feb, 26 Feb: $480 / 6 = $80.00 each pay.
   8 Dec  Plan: a line, Groceries $300.00 each pay. In the period that holds the setup day a line counts its share from
          the setup day [I4]: 7 to 17 Dec is 11 of the period's 14 days, so 30,000 x 11 / 14 = 23,571 counts now.
          Checking 185,000 - 23,000 (Visa) - 23,571 = 138,429; 15 Dec 133,929 (lowest); 18 Dec +160,000 - 30,000 (the
          next period's groceries). Safe 133,929 + 12,000 = 145,929 (was 168,929).
   10 Dec spends on Groceries: $45.50 on Visa, $20.00 cash. Groceries left 23,571 - 4,550 - 2,000 = 17,021; Visa owes
          27,550, all of it off today; Cash 10,000. Checking 185,000 - 27,550 - 17,021 = 140,429; 15 Dec 135,929
          (lowest). Safe 135,929 + 10,000 = 145,929 (was 173,479): the Visa spend moves 4,550 from Groceries left to the
          Visa, so Checking's walk is the same as on 8 Dec, and only the cash spend's 2,000 leaves Cash.
   18 Dec check-in: phone (15 Dec) and pay (18 Dec) ticked; Checking 185,000 - 4,500 + 160,000 = 340,500; Cash 10,000.
          Period 18 to 31 Dec, Groceries 30,000. 340,500 - 30,000 = 310,500; 21 Dec Visa -27,550 = 282,950 (lowest);
          1 Jan +160,000 - 90,000 - 30,000; ... Safe 282,950 + 10,000 = 292,950.
   24 Dec spend: $60.00 from Checking (a gift, on nothing). Checking 334,500.
   1 Jan  pay day and rent day, before the check: the Visa payment of 21 Dec is not ticked and comes off today too. The
          day ends higher than it starts, so the sum is only "Checking today" and Home shows today in two steps:
          334,500 + 160,000 (pay) - 90,000 (rent) - 27,550 (Visa) = 376,950 at the end of the day (G4).
          Check-in: Visa, rent and pay ticked; Checking 376,950, Cash 10,000. Period 1 to 14 Jan, Groceries 30,000:
          376,950 - 30,000 = 346,950, the lowest (every later day is higher). Safe 346,950 + 10,000 = 356,950.
   15 Jan check-in: pay and phone ticked; Checking 376,950 + 160,000 - 4,500 = 532,450. Period 15 to 28 Jan:
          532,450 - 30,000 = 502,450, the lowest. Safe 512,450.
   20 Jan Plan: the pay changes to $3,400.00 on the 25th each month from 1 Feb; Groceries each pay from the change
          $650.00 (the form proposes it: $300 x 26 pays / 12 months, the same money a year). The last pay every 2 weeks is 29 Jan; the period holding 1 Feb starts then, so Groceries is 65,000
          from 29 Jan. Today: 532,450 - 30,000 = 502,450 is still the lowest. Safe 512,450.
   29 Jan check-in: pay ticked; Checking 692,450. Period 29 Jan to 24 Feb, Groceries 65,000. 692,450 - 65,000 =
          627,450; 1 Feb rent -90,000 = 537,450; 15 Feb phone -4,500 = 532,950 (lowest); 25 Feb +340,000 - 65,000.
          Safe 532,950 + 10,000 = 542,950. Plan: the pay "day 25 each month".
   12 Feb spend: $120.00 groceries from Checking: Checking 680,450, Groceries left 53,000. Rent of 1 Feb is not ticked
          and comes off today: 680,450 - 53,000 - 90,000 = 537,450; 15 Feb 532,950 (lowest). Safe 542,950.
   26 Feb check-in: rent (1 Feb), phone (15 Feb) and pay (25 Feb) ticked; Checking 680,450 - 90,000 - 4,500 + 340,000 =
          925,950. Period 25 Feb to 24 Mar, Groceries 65,000: 860,950; 1 Mar rent and car insurance -138,000 = 722,950;
          15 Mar phone 718,450 (lowest). Safe 718,450 + 10,000 = 728,450. Car insurance is due before next pay now, so
          no nudge.
   (Plan names the pay by the rule in force on the day: every 2 weeks until 31 Jan, the 25th each month from 1 Feb.)
   8 Mar  check-in: rent and car insurance ticked; Checking 787,950: 787,950 - 65,000 = 722,950; 15 Mar 718,450
          (lowest). Safe 728,450. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const L = require('./lives3.js').make('e3_life_a');
const { ck, go, tab, typeIn, log, checkin, home, w } = L;
const plan = async (p, sel) => p.$eval(sel, e => e.innerText.replace(/\s+/g, ' ')).catch(() => '(none)');
const row = (p, attr, name) => p.evaluate(([a, n]) => { const b = [...document.querySelectorAll(`[${a}]`)].find(x => x.innerText.startsWith(n + '\n')); return b ? b.parentElement.innerText.replace(/\s+/g, ' ') : '(none)'; }, [attr, name]);
(async () => {
  const t0 = Date.now();
  const { c, p } = await L.open();
  /* 7 Dec: setup */
  await go(p, '2026-12-07');
  await p.click('#a3SetupGo'); await w(200);
  await p.selectOption('#s3Cur', 'USD');
  ck('dollars: somewhere else, weekends only', (await p.$eval('#s3Country', e => e.value)) === 'XX');
  await typeIn(p, '#s3BankName', 'Checking'); await typeIn(p, '#s3Bank', '1850');
  await p.click('#s3AddAcct'); await typeIn(p, '[data-row=acct2] [data-f=name]', 'Cash'); await p.selectOption('[data-row=acct2] [data-f=type]', 'cash'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '120');
  await typeIn(p, '#s3PayAmt', '1600'); await p.selectOption('#s3PayEvery', 'weeks2'); await p.fill('#s3PayStart', '2026-12-04');
  await p.click('#s3AddCard'); await typeIn(p, '[data-row=card1] [data-f=name]', 'Visa'); await typeIn(p, '[data-row=card1] [data-f=owed]', '230'); await p.selectOption('[data-row=card1] [data-f=payDay]', '20');
  let k = 0;
  for (const [name, amt, day, month] of [['Rent', 900, '1'], ['Phone', 45, '15'], ['Car insurance', 480, '1', '03']]) {
    k++; await p.click('#s3AddBill'); const r = `[data-row=bill${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt);
    if (month) { await p.selectOption(r + '[data-f=every]', 'year'); await p.selectOption(r + '[data-f=month]', month); }
    await p.selectOption(r + '[data-f=day]', day);
  }
  await finishSetup3(p); await w(700);
  // old 192,500; now 169,500 because no play amount, so the Visa's 23,000 comes off today (R1): 185,000 - 23,000 - 4,500 + 12,000
  await home(p, '7 Dec after setup', 169500, { Checking: 185000, Cash: 12000 });
  ck('7 Dec: the period is 4 Dec to 17 Dec', (await p.$eval('[data-fig=period]', e => e.textContent).catch(() => '')) === '4 Dec to 17 Dec');
  await tab(p, 'plan');
  ck('7 Dec Plan: the pay every 2 weeks, on Fridays', /every 2 weeks, on Fridays/.test(await row(p, 'data-pay', 'Pay')), await row(p, 'data-pay', 'Pay'));
  const car = await row(p, 'data-bill', 'Car insurance');
  ck('7 Dec Plan: car insurance each year on 1 Mar, with the nudge: $80.00 each pay', /each year on 1 Mar/.test(car) && /Set aside about \$80 each pay to have \$480 ready by 1 Mar 2027 \(6 pays before it\)/.test(car), car);
  /* 8 Dec: a line each pay */
  await go(p, '2026-12-08');
  await tab(p, 'plan'); await p.click('#plAddLine'); await w(200);
  await p.fill('#pl-name', 'Groceries'); await p.fill('#pl-amount', '300'); await p.click('[data-plbtn="0"]'); await w(400);
  // old 168,929; now 145,929 because the Visa's 23,000 comes off today (R1): 185,000 - 23,000 - 23,571 - 4,500 + 12,000
  await home(p, '8 Dec with Groceries $300 each pay', 145929, { Checking: 185000, Cash: 12000 });
  /* 10 Dec: groceries on the card and in cash */
  await go(p, '2026-12-10');
  await log(p, '45.50', 'Visa', { for: 'Groceries', note: 'market' }); await log(p, '20', 'Cash', { for: 'Groceries', note: 'bakery' });
  // old 173,479; now 145,929 because the Visa's 27,550 comes off today (R1): 185,000 - 27,550 - 17,021 - 4,500 + 10,000
  await home(p, '10 Dec after two grocery spends', 145929, { Checking: 185000, Cash: 10000 });
  /* 18 Dec: pay day check-in */
  await go(p, '2026-12-18');
  let list = await checkin(p, { Checking: '3405', Cash: '100' });
  ck('18 Dec: the check-in lists the phone and the pay', list.length === 2 && list.some(x => /Phone/.test(x)) && list.some(x => /Pay/.test(x)), list.join(' | '));
  await home(p, '18 Dec after the check', 292950, { Checking: 340500, Cash: 10000 });
  await go(p, '2026-12-24'); await log(p, 60, 'Checking', { note: 'gift' });
  /* 1 Jan: pay day and rent day */
  await go(p, '2027-01-01'); await tab(p, 'home');
  const today = await p.$eval('#a3Home [data-fig=today]', e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()).catch(() => '(none)');
  ck('1 Jan: today in two steps, the pay and what it covers, to $3,769.50', /^Today: \$3,345\.00 \(Checking today\) \+ \$1,600\.00 \(Pay 1 Jan\) − \$900\.00 \(Rent 1 Jan\) − \$275\.50 \(Visa[^)]*\) = \$3,769\.50 at the end of the day/.test(today), today);
  list = await checkin(p, { Checking: '3769.50', Cash: '100' });
  ck('1 Jan: the check-in lists the Visa payment, the rent and the pay', list.length === 3, list.join(' | '));
  await home(p, '1 Jan after the check', 356950, { Checking: 376950, Cash: 10000 });
  /* 15 Jan */
  await go(p, '2027-01-15'); await checkin(p, { Checking: '5324.50', Cash: '100' });
  await home(p, '15 Jan after the check', 512450, { Checking: 532450, Cash: 10000 });
  /* 20 Jan: the pay changes to the 25th each month from 1 Feb; Groceries is asked about */
  await go(p, '2027-01-20'); await tab(p, 'plan');
  await p.click(`[data-pay="${await p.$eval('[data-pay]', e => e.dataset.pay)}"]`); await w(250);
  await p.selectOption('#pl-every', 'month'); await p.fill('#pl-day', '25'); await p.fill('#pl-amount', '3400'); await p.fill('#pl-from', '2027-02-01');
  const lineBox = await p.evaluate(() => { const l = [...document.querySelectorAll('#a3Plan label')].find(x => /^Groceries each pay from the change/.test(x.textContent)); return l ? l.getAttribute('for') : null; });
  ck('20 Jan: the pay form asks about Groceries each pay and proposes $650 ($300 x 26 / 12, the same money a year)', !!lineBox && Number((await p.$eval('#' + lineBox, e => e.value)).replace(/[^\d.]/g, '')) === 650, lineBox);
  await p.fill('#' + lineBox, '650'); await p.click('[data-plbtn="0"]'); await w(400);
  ck('20 Jan: the change is saved', (await L.txt(p, '#plErr')) === '(none)' || !(await L.txt(p, '#plErr')).trim(), await L.txt(p, '#plErr'));
  await home(p, '20 Jan after the pay change', 512450, { Checking: 532450, Cash: 10000 });
  /* 29 Jan: the last pay every 2 weeks */
  await go(p, '2027-01-29'); await checkin(p, { Checking: '6924.50', Cash: '100' });
  await home(p, '29 Jan after the check', 542950, { Checking: 692450, Cash: 10000 });
  await tab(p, 'plan');
  ck('29 Jan Plan: the pay still every 2 weeks until 1 Feb, next 25 Feb ($3,400)', /every 2 weeks, on Fridays, next 25 Feb/.test(await row(p, 'data-pay', 'Pay')), await row(p, 'data-pay', 'Pay'));
  const gr = await plan(p, '[data-line]');
  ck('29 Jan Plan: Groceries $650.00 for the period from 29 Jan', /Groceries/.test(gr) && /\$650\.00 left of \$650\.00/.test(gr), gr);
  /* 12 Feb */
  await go(p, '2027-02-12'); await log(p, 120, 'Checking', { for: 'Groceries', note: 'market' });
  await home(p, '12 Feb after a grocery spend', 542950, { Checking: 680450, Cash: 10000 });
  await tab(p, 'plan');
  ck('12 Feb Plan: the pay is day 25 each month, next 25 Feb', /day 25 each month, next 25 Feb/.test(await row(p, 'data-pay', 'Pay')), await row(p, 'data-pay', 'Pay'));
  /* 26 Feb */
  await go(p, '2027-02-26'); await checkin(p, { Checking: '9259.50', Cash: '100' });
  await home(p, '26 Feb after the check', 728450, { Checking: 925950, Cash: 10000 });
  await tab(p, 'plan');
  ck('26 Feb Plan: no nudge for car insurance (due before next pay)', !/Set aside about/.test(await row(p, 'data-bill', 'Car insurance')), await row(p, 'data-bill', 'Car insurance'));
  /* 8 Mar */
  await go(p, '2027-03-08'); await checkin(p, { Checking: '7879.50', Cash: '100' });
  await home(p, '8 Mar after the check', 728450, { Checking: 787950, Cash: 10000 });
  await c.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 240)`, secs < 240);
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
