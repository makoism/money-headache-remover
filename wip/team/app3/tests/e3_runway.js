#!/usr/bin/env node
/* Stage 2 slice S1 (STAGE2_PLAN 2.1, corrections 5 and 5'): "If no more pay came, your money lasts about N weeks" on
   Home, walked through the real page from setup on Tue 24 Nov 2026 to pay day on Thu 10 Dec. Mako's shape with made-up
   yen: pay on the 10th, a card paid in full on the 10th (close day not sure), rent on the 27th (the working day after),
   Free to spend 73,000 a pay, no minimum. An e-wallet with 10,000 and nothing on it, so there are two accounts and the
   line names the one that runs out first. Every pay is left out; Free to spend comes off by the day: 73,000 x 12 / 365
   = 2,400 a day (no month's rest in these months). Days that move: Sun 27 Dec -> Mon 28 Dec.

   24 Nov setup: Main bank 300,000. 25 to 27 Nov 7,200 and rent 27 Nov 90,000: 202,800. 28 Nov to 10 Dec 13 days
          31,200 and Card A 54,000 on 10 Dec: 117,600. 11 to 27 Dec 17 days 40,800: 76,800. 28 Dec 2,400 and rent 90,000:
          -15,600, below zero on 28 Dec, 34 days: about 4 weeks. Sum: 300,000 - 90,000 - 54,000 - 90,000 - 81,600 (34
          days) = -15,600. The e-wallet never goes below zero.
   26 Nov a spend of 20,000 from Main bank: 280,000. 27 Nov 2,400 and rent: 187,600. 13 days and the card: 102,400. 17
          days: 61,600. 28 Dec: -30,800, 32 days: 4 weeks. Sum: 280,000 - 90,000 - 54,000 - 90,000 - 76,800 (32 days) =
          -30,800 (what was spent this period is not taken again).
   30 Nov check-in: rent ticked, Main bank shows 188,000, E-wallet 10,000. 1 to 10 Dec 24,000 and the card: 110,000. 17
          days: 69,200. 28 Dec: -23,200, 28 days: 4 weeks. Sum: 188,000 - 54,000 - 90,000 - 67,200 (28 days) = -23,200.
   10 Dec pay day check-in: Main job 250,000 and Card A 54,000 ticked, Main bank shows 360,000. 11 to 27 Dec 40,800:
          319,200. 28 Dec 2,400 and rent: 226,800. 29 to 31 Dec 7,200: 219,600. 1 to 26 Jan 62,400: 157,200. 27 Jan (a
          Wednesday) 2,400 and rent: 64,800. 28 to 31 Jan 9,600: 55,200. 1 to 23 Feb 55,200: 0 at the end of 23 Feb, below
          on 24 Feb: 76 days, about 10 weeks. Sum: 360,000 - 90,000 - 90,000 - 182,400 (76 days) = -2,400. The pay on 10
          Jan is not in it. */
'use strict';
const L = require('./lives3.js').make('e3_runway');
const { ck, go, typeIn, log, checkin, w } = L;
const line = p => p.$eval('#a3Home [data-fig=runway]', e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()).catch(() => null);
const why = p => p.$eval('#a3Home [data-fig=runwaywhy]', e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()).catch(() => null);
async function runway(p, what, weeks, sum) {
  await p.click('[data-tab=home]'); await w(200);
  const l = await line(p), s = await why(p);
  ck(`${what}: "If no more pay came, your money lasts about ${weeks} weeks", Main bank named`, l === `If no more pay came, your money lasts about ${weeks} weeks. Main bank runs out first`, l);
  ck(`${what}: the sum behind it`, s === sum, s);
  const wk = await p.$eval('#a3Home [data-fig=runway]', e => e.dataset.weeks).catch(() => null);
  ck(`${what}: the line sits in the safe to spend card, weeks ${weeks}`, wk === String(weeks) && !!(await p.$('#a3Home [data-card=safe] [data-fig=runway]')), wk);
  await p.reload(); await w(500);
  ck(`${what}: the same after a reload`, (await line(p)) === l && (await why(p)) === s, `${await line(p)} | ${await why(p)}`);
}
(async () => {
  const t0 = Date.now();
  const { c, p } = await L.open();
  await go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3Bank', '300000');
  await p.click('#s3AddAcct'); await typeIn(p, '[data-row=acct2] [data-f=name]', 'E-wallet'); await p.selectOption('[data-row=acct2] [data-f=type]', 'ewallet'); await typeIn(p, '[data-row=acct2] [data-f=amount]', '10000');
  await p.selectOption('#s3PayDay', '10'); await p.selectOption('#s3PayShift', 'before');
  await typeIn(p, '#s3PayName', 'Main job'); await typeIn(p, '#s3PayAmt', '250000');
  await p.click('#s3AddCard'); await typeIn(p, '[data-row=card1] [data-f=name]', 'Card A'); await typeIn(p, '[data-row=card1] [data-f=owed]', '54000');
  await p.selectOption('[data-row=card1] [data-f=payDay]', '10'); await p.selectOption('[data-row=card1] [data-f=shift]', 'after');
  await p.click('#s3AddBill'); await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '90000'); await p.selectOption('[data-row=bill1] [data-f=day]', '27');
  await p.click('#a3SetupSave'); await w(700);
  ck('24 Nov before Free to spend: no runway line (nothing says how fast the money goes)', (await line(p)) === null, await line(p));
  /* Free to spend through Plan's own form, as Home's prompt opens it */
  await p.click('#a3FreeGo'); await w(300); await p.fill('#pl-amount', '73000'); await p.click('[data-plbtn="0"]'); await w(400);
  await runway(p, '24 Nov after setup', 4, 'Main bank would run out on 28 Dec: ¥300,000 (Main bank today) − ¥90,000 (Rent 27 Nov) − ¥54,000 (Card A, all owed, paid 10 Dec) − ¥90,000 (Rent 28 Dec) − ¥81,600 (Free to spend, 34 days) = − ¥15,600');
  await go(p, '2026-11-26'); await log(p, 20000, 'Main bank', { note: 'groceries' });
  await runway(p, '26 Nov after a spend', 4, 'Main bank would run out on 28 Dec: ¥280,000 (Main bank today) − ¥90,000 (Rent 27 Nov) − ¥54,000 (Card A, all owed, paid 10 Dec) − ¥90,000 (Rent 28 Dec) − ¥76,800 (Free to spend, 32 days) = − ¥30,800');
  await go(p, '2026-11-30'); await checkin(p, { 'Main bank': 188000, 'E-wallet': 10000 });
  await runway(p, '30 Nov after a check-in', 4, 'Main bank would run out on 28 Dec: ¥188,000 (Main bank today) − ¥54,000 (Card A, all owed, paid 10 Dec) − ¥90,000 (Rent 28 Dec) − ¥67,200 (Free to spend, 28 days) = − ¥23,200');
  await go(p, '2026-12-10'); await checkin(p, { 'Main bank': 360000, 'E-wallet': 10000 }, { 'Card A': 54000 });
  await runway(p, '10 Dec after the pay day check-in', 10, 'Main bank would run out on 24 Feb 2027: ¥360,000 (Main bank today) − ¥90,000 (Rent 28 Dec) − ¥90,000 (Rent 27 Jan) − ¥182,400 (Free to spend, 76 days) = − ¥2,400');
  const help = await p.$eval('#a3Home [data-helptext=runway]', e => e.textContent).catch(() => null);
  ck('the "?" beside it explains it', !!help && /no more pay/.test(help), help);
  await c.close();
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 180)`, secs < 180);
  await L.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
