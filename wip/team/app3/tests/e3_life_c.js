#!/usr/bin/env node
/* Life C (slice 6): Kai, a freelancer in Japan with no fixed pay, walked through the real page from setup on Tue 1 Dec
   2026 to a check-in on Tue 2 Mar 2027. Made-up yen. Figures worked by hand below; the page must show them.

   Setup: Bank ¥420,000, Cash ¥20,000 (an account of its own); yen, Japan; pay "Client work": no fixed pay, amount blank;
   no cards; Phone ¥5,000 on the 20th and Rent ¥85,000 on the 27th, from Bank (the working day after). The 20 Nov phone
   and 27 Nov rent are asked about and have gone out (the default).
   Days that move (Japan): 20 Dec Sun -> Mon 21 Dec; 27 Dec Sun -> Mon 28 Dec; 20 Feb Sat -> Mon 22 Feb; 27 Feb Sat ->
   Mon 1 Mar; 20 Mar Sat -> Tue 23 Mar (21 Mar is the spring equinox, a Sunday, so Mon 22 Mar is its substitute day);
   27 Mar Sat -> Mon 29 Mar. 20 Jan, 27 Jan, 20 Apr and 27 Apr are weekdays.
   With no fixed pay there are no pay periods. The walk runs to its horizon: 45 days, or to the second coming one of
   each bill if later. Safe to spend is the lowest point of each account's walk, added up (Bank and Cash).
   "Due" means the next 30 days (F13).

   1 Dec  setup. Horizon 27 Jan (rent's second). Bank 420,000 - phone 21 Dec 5,000 - rent 28 Dec 85,000 - phone 20 Jan
          5,000 - rent 27 Jan 85,000 = 240,000; Cash 20,000. Safe 260,000. Due in the next 30 days (to 30 Dec): phone
          5,000 and rent 85,000.
   3 Dec  money in: client payment 150,000 to Bank. Bank 570,000; safe 390,000 + 20,000 = 410,000.
   5 Dec  spends: groceries 12,000 from Bank, lunch 3,000 cash. Bank 558,000, Cash 17,000; safe 378,000 + 17,000 = 395,000.
   7 Dec  Plan: a line, Food ¥40,000 a month.
          [The month rule, CA4 and CA5, 25 Nov 2026: every figure from here on was reworked by hand. Before, Food came
          off at 40,000 x 12 / 365 = 1,315 a day in every month, from tomorrow, whatever was spent on it.]
          With no pay day: this month the walk holds what is left of Food (the month's 40,000 less what was spent on
          Food; Kai logs nothing on Food in this walk, so 40,000 every month; the month of setup counts from the setup
          day, 1 Dec, so December is a whole month). A later month comes off by the day at the month's amount over its
          days, rounded down, the last day carrying the rest: January and March 1,290 a day, February 1,428, April
          1,333. A whole later month is exactly 40,000.
          Horizon 27 Jan. Food left in December 40,000; 1 to 27 Jan 27 x 1,290 = 34,830; together 74,830.
          Bank 558,000 - 180,000 (the four bills) - 74,830 = 303,170; safe 303,170 + 17,000 = 320,170.
   29 Dec check-in: phone (21 Dec) and rent (28 Dec) ticked; Bank shows 468,000 (558,000 - 90,000), Cash 17,000.
          Horizon 1 Mar (rent's second, 27 Feb moved). Bills 20 Jan 5,000, 27 Jan 85,000, 22 Feb 5,000, 1 Mar 85,000 =
          180,000. Food left in December 40,000; January 40,000; February 40,000; 1 Mar 1,290; together 121,290.
          Bank 468,000 - 180,000 - 121,290 = 166,710; safe 166,710 + 17,000 = 183,710.
   2 Jan  money in: a new year gift 10,000 into Cash: Cash 27,000. Horizon 1 Mar; Food left in January 40,000,
          February 40,000, 1 Mar 1,290 = 81,290. Bank 468,000 - 180,000 - 81,290 = 206,710; safe 233,710.
   15 Jan money in: client payment 200,000 to Bank: Bank 668,000. The same 81,290 held.
          Bank 668,000 - 180,000 - 81,290 = 406,710; safe 406,710 + 27,000 = 433,710.
   2 Feb  check-in: phone (20 Jan) and rent (27 Jan) ticked; Bank 578,000, Cash 27,000. Horizon 29 Mar (rent's second).
          Bills 22 Feb, 1 Mar, 23 Mar, 29 Mar = 180,000. Food left in February 40,000; 1 to 29 Mar 29 x 1,290 =
          37,410; together 77,410. Bank 578,000 - 180,000 - 77,410 = 320,590; safe 320,590 + 27,000 = 347,590.
   20 Feb spend: a bag 20,000 from Bank: Bank 558,000. Horizon 6 Apr (45 days). Bills 180,000. Food left in February
          40,000; March 40,000; 1 to 6 Apr 6 x 1,333 = 7,998; together 87,998. Bank 558,000 - 180,000 - 87,998 =
          290,002; safe 290,002 + 27,000 = 317,002.
   2 Mar  check-in: phone (22 Feb) and rent (1 Mar) ticked; Bank 468,000, Cash 27,000. Horizon 27 Apr. Bills 23 Mar,
          29 Mar, 20 Apr, 27 Apr = 180,000. Food left in March 40,000; 1 to 27 Apr 27 x 1,333 = 35,991; together
          75,991. Bank 468,000 - 180,000 - 75,991 = 212,009; safe 212,009 + 27,000 = 239,009.
          Due in the next 30 days (to 31 Mar): phone 23 Mar 5,000, rent 29 Mar 85,000.
          Lasts about: Bank from 468,000 with food and bills: March's Food 40,000 and bills 90,000: end of March
          338,000; end of April 208,000; end of May 78,000; 21 Jun 78,000 - 21 x 1,333 - 5,000 = 45,007; 28 Jun
          78,000 - 28 x 1,333 - 5,000 - 85,000 = -49,324: below zero on 28 Jun, 118 days away: 16 weeks. Cash never
          goes below zero. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const L = require('./lives3.js').make('e3_life_c');
const { ck, go, tab, typeIn, log, checkin, home, w } = L;
(async () => {
  const t0 = Date.now();
  const { c, p } = await L.open();
  /* 1 Dec: setup */
  await go(p, '2026-12-01');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3BankName', 'Bank'); await typeIn(p, '#s3Bank', '420000');
  await p.click('#s3AddAcct'); await typeIn(p, '[data-row=acct2] [data-f=name]', 'Cash'); await p.selectOption('[data-row=acct2] [data-f=type]', 'cash'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '20000');
  await typeIn(p, '#s3PayName', 'Client work'); await p.selectOption('#s3PayEvery', 'none');
  let k = 0;
  for (const [name, amt, day] of [['Phone', 5000, '20'], ['Rent', 85000, '27']]) {
    k++; await p.click('#s3AddBill'); const r = `[data-row=bill${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.selectOption(r + '[data-f=day]', day);
  }
  await w(200);
  const asked = await p.$$eval('#a3Setup [data-q=takenOut]:not([hidden]) label', ls => ls.map(l => l.textContent));
  ck('setup asks about the phone of 20 Nov and the rent of 27 Nov', asked.join(' | ') === 'Did the Phone of 20 Nov leave your bank? | Did the Rent of 27 Nov leave your bank?', asked.join(' | '));
  await finishSetup3(p); await w(700);
  await home(p, '1 Dec after setup', 260000, { Bank: 420000, Cash: 20000 });
  const due = await p.$eval('[data-card=due]', e => e.innerText.replace(/\s+/g, ' '));
  ck('1 Dec: due in the next 30 days, phone 21 Dec and rent 28 Dec', /^Due in the next 30 days/.test(due) && /Phone 21 Dec ¥5,000/.test(due) && /Rent 28 Dec ¥85,000/.test(due) && /Together ¥90,000/.test(due), due);
  const head = await p.$eval('[data-card=safe] h2', e => e.textContent);
  ck('1 Dec: safe to spend says what it looks at with no pay day', /no fixed pay/.test(head), head);
  /* 3 Dec: a client payment */
  await go(p, '2026-12-03'); await log(p, 150000, 'Bank', { mode: 'in', note: 'Client A' });
  await home(p, '3 Dec after a client payment', 410000, { Bank: 570000, Cash: 20000 });
  /* 5 Dec: two spends */
  await go(p, '2026-12-05'); await log(p, 12000, 'Bank', { note: 'groceries' }); await log(p, 3000, 'Cash', { note: 'lunch' });
  await home(p, '5 Dec after two spends', 395000, { Bank: 558000, Cash: 17000 });
  /* 7 Dec: a line with no pay day */
  await go(p, '2026-12-07');
  await tab(p, 'plan'); await p.click('#plAddLine'); await w(200);
  const lab = await p.$eval('label[for=pl-amount]', e => e.textContent).catch(() => '');
  ck('7 Dec: with no pay day a line is asked for each month', lab === 'Each month', lab);
  await p.fill('#pl-name', 'Food'); await p.fill('#pl-amount', '40000'); await p.click('[data-plbtn="0"]'); await w(400);
  const row = await p.$eval('[data-card=plan-period]', e => e.innerText.replace(/\s+/g, ' ')).catch(() => '');
  ck('7 Dec: Plan shows Food ¥40,000 a month, coming off by the day', /Food/.test(row) && /¥40,000 a month/.test(row) && /by the day/.test(row), row);
  await home(p, '7 Dec with Food 40,000 a month', 320170, { Bank: 558000, Cash: 17000 });
  /* 29 Dec: check-in */
  await go(p, '2026-12-29');
  const list = await checkin(p, { Bank: 468000, Cash: 17000 });
  ck('29 Dec: the check-in lists the phone and the rent', list.length === 2 && /Phone/.test(list[0]) && /Rent/.test(list[1]), list.join(' | '));
  await home(p, '29 Dec after the check', 183710, { Bank: 468000, Cash: 17000 });
  /* 2 Jan: a gift into cash */
  await go(p, '2027-01-02'); await log(p, 10000, 'Cash', { mode: 'in', note: 'new year gift' });
  await home(p, '2 Jan after a gift', 233710, { Bank: 468000, Cash: 27000 });
  /* 15 Jan: a client payment */
  await go(p, '2027-01-15'); await log(p, 200000, 'Bank', { mode: 'in', note: 'Client B' });
  await home(p, '15 Jan after a client payment', 433710, { Bank: 668000, Cash: 27000 });
  /* 2 Feb: check-in */
  await go(p, '2027-02-02'); await checkin(p, { Bank: 578000, Cash: 27000 });
  await home(p, '2 Feb after the check', 347590, { Bank: 578000, Cash: 27000 });
  /* 20 Feb: a spend */
  await go(p, '2027-02-20'); await log(p, 20000, 'Bank', { note: 'bag' });
  await home(p, '20 Feb after a spend', 317002, { Bank: 558000, Cash: 27000 });
  /* 2 Mar: check-in */
  await go(p, '2027-03-02'); await checkin(p, { Bank: 468000, Cash: 27000 });
  await home(p, '2 Mar after the check', 239009, { Bank: 468000, Cash: 27000 });
  const due2 = await p.$eval('[data-card=due]', e => e.innerText.replace(/\s+/g, ' '));
  ck('2 Mar: due in the next 30 days, phone 23 Mar and rent 29 Mar', /^Due in the next 30 days/.test(due2) && /Phone 23 Mar ¥5,000/.test(due2) && /Rent 29 Mar ¥85,000/.test(due2), due2);
  const lasts = await p.$eval('[data-fig=lasts]', e => e.textContent.replace(/\s+/g, ' ')).catch(() => '(none)');
  ck('2 Mar: at this rate the money lasts about 16 weeks', /about 16 weeks/.test(lasts), lasts);
  const rc = await (async () => { await tab(p, 'receipts'); return p.$$eval('#rcList [data-rc]', rs => rs.map(r => r.textContent.replace(/\s+/g, ' '))); })();
  ck('Receipts lists the money in as Money in', rc.some(x => /^Money in/.test(x.trim()) && /Client B/.test(x)), rc.join(' | '));
  await c.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 240)`, secs < 240);
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
