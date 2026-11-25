#!/usr/bin/env node
/* Life B (slice 6): Lia in the Philippines, paid on the 15th and the last day, with a side income on the 5th into an
   e-wallet, two banks and a card paid from each, walked through the real page from setup on Tue 1 Dec 2026 to a
   check-in on Mon 1 Mar 2027. Made-up pesos; figures worked by hand below in centavos; the page must show them.

   Setup: pesos, country the Philippines. Bank A ₱18,000 (main), Bank B ₱6,000, GCash ₱1,500 (an e-wallet). Salary
   ₱15,000 on the 15th and the last day into Bank A (the working day before). Side gig ₱4,000 on the 5th into GCash.
   Card A ₱3,000 on it, paid on the 20th from Bank A; Card B ₱1,200, paid on the 25th from Bank B (both the working day
   after, close day not sure). Rent ₱8,000 on the 1st from Bank A; Internet ₱1,500 on the 10th from Bank B. The 1 Dec
   rent is asked about and has gone out.
   Days (Philippine holidays: 30 Nov, 8 Dec, 25 Dec, 30 Dec, 31 Dec, 1 Jan): salary 15 Dec, 29 Dec (31 and 30 Dec are
   holidays), 15 Jan, 29 Jan (31 Jan a Sunday), 15 Feb, 26 Feb (28 Feb a Sunday), 15 Mar, 31 Mar; the 30 Nov pay
   landed Fri 27 Nov, so the period at setup is 27 Nov to 14 Dec. Side gig Fri 4 Dec (5 Dec a Saturday), 5 Jan, 5 Feb,
   5 Mar. Card A Mon 21 Dec, 20 Jan, Mon 22 Feb. Card B Mon 28 Dec (25 Dec a holiday), 25 Jan. Rent Mon 4 Jan (1 Jan a
   holiday), 1 Feb, 1 Mar, 1 Apr. Internet 10 Dec, Mon 11 Jan, 10 Feb, 10 Mar, Mon 12 Apr (9 Apr a holiday).
   Each account is walked on its own to the horizon (the second next pay, at least 45 days); safe to spend adds each
   one's lowest point and takes off any account that goes below zero. The bank after the cards (BK3) is per bank.

   No play amount is set, so everything on each card comes off its bank today (M90, R1), in place of its dated payment.
   It moves Bank A only while card A's payment lands after a salary (1 to 14 Dec); Bank B has no income, so card B
   always counted in its lowest point; from 15 Dec every figure is as it was.
   1 Dec  Bank A 1,800,000 - card A 300,000 (owed now) = 1,500,000, the lowest (was 1,800,000 at the start, with pay
          15 Dec before card A 21 Dec). Bank B 600,000 - card B 120,000 (owed now) - internet 150,000 (10 Dec) - internet
          150,000 (11 Jan) = 180,000. GCash 150,000. Safe 1,500,000 + 180,000 + 150,000 = 1,830,000 (was 2,130,000).
          After the cards: Bank A on 21 Dec 1,800,000 + 1,500,000 - 300,000 = 3,000,000; Bank B on 28 Dec 600,000 -
          150,000 - 120,000 = 330,000.
   3 Dec  money in: a client payment ₱2,500 into GCash: 400,000. Safe 1,830,000 + 250,000 = 2,080,000 (was 2,380,000).
   6 Dec  spends: ₱1,200 groceries on Card B, ₱500 from GCash. Card B now 240,000 on 28 Dec: Bank B 600,000 - 150,000 -
          240,000 - 150,000 = 60,000. GCash 350,000 (the side gig of 4 Dec is not ticked, so not counted). Safe 1,800,000 +
          60,000 + 350,000 = 2,210,000 before the rule; now Bank A is 1,500,000 (card A off today), so 1,500,000 + 60,000 +
          350,000 = 1,910,000. Bank B after its card: 210,000.
   15 Dec check-in: side gig, internet and salary ticked; Bank A 3,300,000, Bank B 450,000, GCash 750,000.
          Bank A 3,300,000 - card A 300,000 = 3,000,000 (lowest); Bank B 450,000 - 240,000 - 150,000 = 60,000; GCash
          750,000. Safe 3,810,000. After the cards: Bank A 3,000,000 on 21 Dec, Bank B 210,000 on 28 Dec.
   29 Dec check-in: card A, card B and salary ticked; Bank A 4,500,000, Bank B 210,000, GCash 750,000. Horizon 12 Feb.
          Bank A 4,500,000 - rent 800,000 (4 Jan) = 3,700,000 (lowest). Bank B 210,000 - 150,000 (11 Jan) - 150,000
          (10 Feb) = -90,000: Bank B goes below zero on 10 Feb. Safe 3,700,000 + 750,000 - 90,000 = 4,360,000.
   5 Jan  money moved: ₱3,000 from Bank A to Bank B. Bank A 4,200,000, Bank B 510,000. Rent of 4 Jan is not ticked and
          comes off today: Bank A 3,400,000 (lowest). Bank B 510,000 - 150,000 - 150,000 = 210,000. GCash 750,000 at the
          start of the day (the side gig lands today). Safe 3,400,000 + 210,000 + 750,000 = 4,360,000.
   15 Jan check-in: rent, side gig, internet and salary ticked; Bank A 4,900,000, Bank B 360,000, GCash 1,150,000.
          Then ₱2,000 on Card A (out 20 Jan): Bank A 4,900,000 - 200,000 = 4,700,000 (lowest); Bank B 360,000 - 150,000 =
          210,000; GCash 1,150,000. Safe 6,060,000. After the cards: Bank A 4,700,000 on 20 Jan; card B owes nothing.
   1 Feb  check-in: card A, salary (29 Jan) and rent (1 Feb) ticked; Bank A 5,400,000, Bank B 360,000, GCash 1,150,000.
          Bank A lowest at the start; Bank B 360,000 - 150,000 - 150,000 = 60,000. Safe 5,400,000 + 60,000 + 1,150,000 =
          6,610,000.
   1 Mar  check-in: side gig (5 Feb), internet (10 Feb), salary (15 and 26 Feb), rent (1 Mar) ticked; Bank A 7,600,000,
          Bank B 210,000, GCash 1,550,000. Horizon 15 Apr: Bank B 210,000 - 150,000 (10 Mar) - 150,000 (12 Apr) =
          -90,000. Safe 7,600,000 + 1,550,000 - 90,000 = 9,060,000. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const L = require('./lives3.js').make('e3_life_b');
const { ck, go, typeIn, log, checkin, home, w } = L;
const after = p => p.$$eval('#a3Home [data-fig=aftercards]', es => es.map(e => e.querySelector('span').firstChild.textContent.replace(/[⁠\s]+/g, ' ').trim() + ' = ' + e.querySelector('[data-amt]').dataset.amt));
const A = { 'Bank A': 0, 'Bank B': 0, GCash: 0 };
const banks = (a, b, g) => Object.assign({}, A, { 'Bank A': a, 'Bank B': b, GCash: g });
(async () => {
  const t0 = Date.now();
  const { c, p } = await L.open();
  /* 1 Dec: setup */
  await go(p, '2026-12-01');
  await p.click('#a3SetupGo'); await w(200);
  await p.selectOption('#s3Cur', 'PHP');
  await typeIn(p, '#s3BankName', 'Bank A'); await typeIn(p, '#s3Bank', '18000');
  for (const [k, name, amt, type] of [[2, 'Bank B', 6000, 'bank'], [3, 'GCash', 1500, 'ewallet']]) {
    await p.click('#s3AddAcct'); const r = `[data-row=acct${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await p.selectOption(r + '[data-f=type]', type); await typeIn(p, r + '[data-f=amount]', amt);
  }
  await typeIn(p, '#s3PayName', 'Salary'); await typeIn(p, '#s3PayAmt', '15000');
  await p.selectOption('#s3PayEvery', 'days'); await p.selectOption('#s3PayDay', '15'); await p.selectOption('#s3PayDay2', 'last'); await p.selectOption('#s3PayShift', 'before');
  await p.selectOption('#s3PayAcct', 'bank1');
  await p.click('#s3AddPay'); await typeIn(p, '[data-row=pay2] [data-f=name]', 'Side gig'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '4000');
  await p.selectOption('[data-row=pay2] [data-f=every]', 'month'); await p.selectOption('[data-row=pay2] [data-f=day]', '5'); await p.selectOption('[data-row=pay2] [data-f=acct]', 'acct3');
  for (const [k, name, owed, day, from] of [[1, 'Card A', 3000, '20', 'bank1'], [2, 'Card B', 1200, '25', 'acct2']]) {
    await p.click('#s3AddCard'); const r = `[data-row=card${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed); await p.selectOption(r + '[data-f=payDay]', day); await p.selectOption(r + '[data-f=payFrom]', from);
  }
  for (const [k, name, amt, day, from] of [[1, 'Rent', 8000, '1', 'bank1'], [2, 'Internet', 1500, '10', 'acct2']]) {
    await p.click('#s3AddBill'); const r = `[data-row=bill${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.selectOption(r + '[data-f=day]', day); await p.selectOption(r + '[data-f=from]', from);
  }
  await w(200);
  const asked = await p.$$eval('#a3Setup [data-q=takenOut]:not([hidden]) label', ls => ls.map(l => l.textContent));
  ck('setup asks about the rent of 1 Dec only', asked.join(' | ') === 'Did the Rent of 1 Dec leave your bank?', asked.join(' | '));
  await finishSetup3(p); await w(700);
  // old 2,130,000; now 1,830,000 because no play amount, so card A's 300,000 comes off Bank A today, not on 21 Dec
  // after the salary of 15 Dec (R1): 1,500,000 + Bank B 180,000 (unchanged, card B had no salary before it) + 150,000
  await home(p, '1 Dec after setup', 1830000, banks(1800000, 600000, 150000));
  ck('1 Dec: the period is 27 Nov to 14 Dec', (await p.$eval('[data-fig=period]', e => e.textContent).catch(() => '')) === '27 Nov to 14 Dec');
  let ac = await after(p);
  ck('1 Dec: each bank after its own cards: Bank A on 21 Dec 3,000,000, Bank B on 28 Dec 330,000', ac.join(' | ') === 'After your cards are paid on 21 Dec: Bank A = 3000000 | After your cards are paid on 28 Dec: Bank B = 330000', ac.join(' | '));
  /* 3 Dec: a client payment into GCash */
  await go(p, '2026-12-03'); await log(p, 2500, 'GCash', { mode: 'in', note: 'logo job' });
  // old 2,380,000; now 2,080,000: 1,830,000 + 250,000 into GCash (card A still off today, R1)
  await home(p, '3 Dec after a client payment', 2080000, banks(1800000, 600000, 400000));
  /* 6 Dec */
  await go(p, '2026-12-06'); await log(p, 1200, 'Card B', { note: 'groceries' }); await log(p, 500, 'GCash', { note: 'load' });
  // old 2,210,000; now 1,910,000: Bank A 1,500,000 (card A off today, R1) + Bank B 60,000 + GCash 350,000
  await home(p, '6 Dec after two spends', 1910000, banks(1800000, 600000, 350000));
  ac = await after(p);
  ck('6 Dec: Bank B after card B is 210,000', ac.some(x => x === 'After your cards are paid on 28 Dec: Bank B = 210000'), ac.join(' | '));
  /* 15 Dec */
  await go(p, '2026-12-15');
  let list = await checkin(p, { 'Bank A': '33000', 'Bank B': '4500', GCash: '7500' });
  ck('15 Dec: the check-in lists the side gig, the internet and the salary', list.length === 3, list.join(' | '));
  await home(p, '15 Dec after the check', 3810000, banks(3300000, 450000, 750000));
  ac = await after(p);
  ck('15 Dec: after the cards, Bank A 3,000,000 on 21 Dec and Bank B 210,000 on 28 Dec', ac.join(' | ') === 'After your cards are paid on 21 Dec: Bank A = 3000000 | After your cards are paid on 28 Dec: Bank B = 210000', ac.join(' | '));
  /* 29 Dec */
  await go(p, '2026-12-29'); await checkin(p, { 'Bank A': '45000', 'Bank B': '2100', GCash: '7500' });
  await home(p, '29 Dec after the check (Bank B goes below zero on 10 Feb)', 4360000, banks(4500000, 210000, 750000));
  const warn = await p.$$eval('#a3Home [data-warn]', es => es.map(e => e.textContent)).catch(() => []);
  ck('29 Dec: Home warns that Bank B goes below zero on 10 Feb', warn.some(x => /Bank B/.test(x) && /10 Feb/.test(x)), warn.join(' | '));
  /* 5 Jan: money moved to Bank B */
  await go(p, '2027-01-05'); await log(p, 3000, 'Bank A', { mode: 'moved', to: 'Bank B', note: 'top up' });
  await home(p, '5 Jan after moving 3,000 to Bank B', 4360000, banks(4200000, 510000, 750000));
  /* 15 Jan */
  await go(p, '2027-01-15'); await checkin(p, { 'Bank A': '49000', 'Bank B': '3600', GCash: '11500' });
  await log(p, 2000, 'Card A', { note: 'shoes' });
  await home(p, '15 Jan after the check and a card spend', 6060000, banks(4900000, 360000, 1150000));
  ac = await after(p);
  ck('15 Jan: after the cards, Bank A 4,700,000 on 20 Jan; Bank B has no card to pay', ac.join(' | ') === 'After your cards are paid on 20 Jan: Bank A = 4700000', ac.join(' | '));
  /* 1 Feb */
  await go(p, '2027-02-01'); await checkin(p, { 'Bank A': '54000', 'Bank B': '3600', GCash: '11500' });
  await home(p, '1 Feb after the check', 6610000, banks(5400000, 360000, 1150000));
  /* 1 Mar */
  await go(p, '2027-03-01');
  list = await checkin(p, { 'Bank A': '76000', 'Bank B': '2100', GCash: '15500' });
  ck('1 Mar: the check-in lists the side gig, the internet, two salaries and the rent', list.length === 5, list.join(' | '));
  await home(p, '1 Mar after the check (Bank B below zero on 12 Apr)', 9060000, banks(7600000, 210000, 1550000));
  await c.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 240)`, secs < 240);
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
