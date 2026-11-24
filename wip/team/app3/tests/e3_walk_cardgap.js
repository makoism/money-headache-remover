#!/usr/bin/env node
/* The real-page walk, a step beside tests/e3_walk.js (which stays as it is): Mako's month across a pay day with the
   cards checked every week (CARDGAP_PLAN slice 4; MAKO_SAYS M11 he logs weekly, M27 two cards paid on the 10th and 11th,
   M30 nearly all spending on the cards, M36, M37, M38 pay to pay, M45; LESSONS 4 addendum: chain the days the way a
   person does). Through the built page as a person uses it, from the real setup screen. After every step Home's safe to
   spend and the main bank's figure must be the ones worked out by hand below; every check-in also reloads the page and
   every figure on Home, Plan and Receipts must be the same. Made-up yen only.

   Setup, Tue 24 Nov 2026: Main bank 412,000; pay 285,000 on the 10th; Card A with 38,000 on it, paid on the 10th; Card B
   with 12,000 on it, paid on the 11th (close days not sure); rent 85,000 on the 27th; 60,000 each pay period on food,
   transport and small things (Free to spend).

   By hand. In this walk the bank can always spare far more than Free to spend has left (the least it can spare is
   412,000 - 85,000 rent = 327,000), so safe to spend is Free to spend left at every step.
     24 Nov  The period is 10 Nov to 9 Dec, 30 days, 16 left (24 Nov to 9 Dec): Free to spend counts
             60,000 x 16 / 30 = 32,000.                                              safe 32,000   bank 412,000
     28 Nov  (Sat) Check your bank: the rent (27 Nov) ticked, bank 327,000 (412,000 - 85,000, no gap), Card A 44,300
             (6,300 not logged), Card B 12,000 (nothing).  32,000 - 6,300 =          safe 25,700   bank 327,000
     30 Nov  groceries 4,200 on Card A, logged.  25,700 - 4,200 =                    safe 21,500   bank 327,000
      5 Dec  (Sat) check: bank 327,000; Card A 55,000: the app has 44,300 + 4,200 = 48,500, so 6,500 not logged;
             Card B 19,700: 7,700 not logged. Both over 29 Nov to 5 Dec, before the pay.
             21,500 - 6,500 - 7,700 =                                                safe 7,300    bank 327,000
     10 Dec  pay day, opened before anything is ticked: the bank still reads 327,000 and safe to spend is 7,300.
     12 Dec  (Sat) check: the pay (10 Dec), Card A's 55,000 (10 Dec) and Card B's 19,700 (11 Dec) ticked; bank 537,300
             (327,000 + 285,000 - 55,000 - 19,700, no gap); Card A 14,700 and Card B 5,005, not logged over 6 to
             12 Dec, seven days: 6 to 9 Dec are before the pay (4 of 7), 10 to 12 Dec after (3 of 7).
               Card A 14,700: 8,400 before, 6,300 after.  Card B 5,005: 2,860 before, the rest 2,145 after.
             The period from 10 Dec: 60,000 - 6,300 - 2,145 =                        safe 51,555   bank 537,300
             (With the whole gap dated on the check's day, as before the fix, it would read 40,295.)
             The period 10 Nov to 9 Dec, gone by: 6,300 + 4,200 + 6,500 + 7,700 + 8,400 + 2,860 = 35,960 of 32,000.
     19 Dec  (Sat) check: bank 537,300 (the rent leaves on the 28th); Card A 23,100 (8,400 not logged over 13 to
             19 Dec), Card B 5,005 (nothing).  51,555 - 8,400 =                      safe 43,155   bank 537,300
             This period on Receipts: 6,300 + 2,145 + 8,400 = 16,845 of 60,000. */
'use strict';
const L = require('./lives3.js').make('e3_walk_cardgap');
const { ck, go, tab, typeIn, txt, w } = L;
const { finishSetup } = require('./setup_sections.js');
const BANK = 'Main bank';

/* Check your bank as a person fills it: every item left ticked, the bank's box and each card's box by name, Save;
   then a reload must change no figure on Home, Plan or Receipts */
async function checkin(p, figures) {
  await tab(p, 'home');
  await p.click('#a3CheckGo'); await w(250);
  const ticked = await p.$$eval('#a3Check .a3-tick', rs => rs.filter(r => r.querySelector('input[type=checkbox]').checked).map(r => r.querySelector('label span').textContent + ' ' + r.querySelector('.when').textContent));
  const boxes = await p.$$eval('#a3Check [data-bankfig], #a3Check [data-cardfig]', es => es.map(e => ({ id: e.id, label: document.querySelector(`label[for="${e.id}"]`).textContent })));
  for (const k of Object.keys(figures)) {
    const b = boxes.find(x => x.label.includes(k));
    if (!b) throw new Error('no box for ' + k + ' among ' + boxes.map(x => x.label).join(' / '));
    await p.click('#' + b.id); await p.keyboard.type(String(figures[k]));
  }
  await p.click('#a3CheckSave'); await w(600);
  const err = await txt(p, '#a3CheckErr');
  ck('check-in saved', !err || err === '(none)', err);
  await L.sameAfterReload(p, 'check-in ' + (await p.evaluate(() => location.search)));
  return ticked;
}
/* Receipts as drawn: the period, Free to spend's spent figure, and the rows that are spending (gaps and logged spends) */
const receipts = p => p.evaluate(() => {
  const yen = s => { const m = /([−-])?\s*¥\s*([\d,]+)/.exec(s.replace(/⁠/g, '')); return m ? (m[1] ? -1 : 1) * Number(m[2].replace(/,/g, '')) : null; };
  const per = document.querySelector('#a3Rc [data-fig=rc-period]');
  const free = [...document.querySelectorAll('#a3Rc [data-fig=rc-spent] li')].find(li => /^Free to spend/.test(li.textContent.trim()));
  const amts = free ? [...free.querySelectorAll('[data-amt]')].map(a => Number(a.dataset.amt)) : [];
  const rows = [...document.querySelectorAll('#rcList li')].map(li => ({ gap: li.dataset.gap !== undefined, k: li.dataset.k || null, text: li.textContent.replace(/\s+/g, ' ').trim(), amount: yen((li.querySelector('.amt') || li).textContent) }));
  return { start: per ? per.dataset.start : null, end: per ? per.dataset.end : null, spent: amts[0], of: amts[1],
    gaps: rows.filter(r => r.gap).map(r => r.amount).sort((x, y) => x - y), spends: rows.filter(r => r.k === 'spend' && !/Rent/.test(r.text)).map(r => r.amount) };
});
const sum = l => l.reduce((s, x) => s + x, 0);
const cardsOwed = p => p.$$eval('#a3Home [data-fig=owed]', es => es.map(e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)));

(async () => {
  const { c, p } = await L.open();
  /* setup on 24 Nov */
  await go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await w(250);
  await p.fill('#s3BankName', BANK);
  await typeIn(p, '#s3Bank', '412000');
  await p.selectOption('#s3PayDay', '10'); await typeIn(p, '#s3PayAmt', '285000');
  for (const [k, name, owed, day] of [[1, 'Card A', 38000, '10'], [2, 'Card B', 12000, '11']]) {
    await p.click('#s3AddCard'); const r = `[data-row=card${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed); await p.selectOption(r + '[data-f=payDay]', day);
  }
  await p.click('#s3AddBill');
  await typeIn(p, '[data-row=bill1] [data-f=name]', 'Rent'); await typeIn(p, '[data-row=bill1] [data-f=amount]', '85000'); await p.selectOption('[data-row=bill1] [data-f=day]', '27');
  await typeIn(p, '#s3Free', '60000');
  const e = await finishSetup(p); await w(800);
  ck('setup: every section saved and Home shows', e === '' && await p.$eval('#a3Setup', x => x.hidden).catch(() => false), e || await txt(p, '#a3SetupErr'));
  await L.home(p, '24 Nov after setup', 32000, { [BANK]: 412000 });

  /* 28 Nov: the first weekly check */
  await go(p, '2026-11-28');
  let ticked = await checkin(p, { [BANK]: 327000, 'Card A': 44300, 'Card B': 12000 });
  ck('28 Nov: the check asked about the rent only', ticked.length === 1 && /Rent/.test(ticked[0]), JSON.stringify(ticked));
  await L.home(p, '28 Nov after the check (6,300 not logged on Card A)', 25700, { [BANK]: 327000 });

  /* 30 Nov: one receipt on a card */
  await go(p, '2026-11-30');
  await L.log(p, 4200, 'Card A', { note: 'groceries' });
  await L.home(p, '30 Nov after groceries 4,200 on Card A', 21500, { [BANK]: 327000 });

  /* 5 Dec: the second check, still before the pay */
  await go(p, '2026-12-05');
  ticked = await checkin(p, { [BANK]: 327000, 'Card A': 55000, 'Card B': 19700 });
  ck('5 Dec: nothing to tick', ticked.length === 0, JSON.stringify(ticked));
  await L.home(p, '5 Dec after the check (6,500 and 7,700 not logged)', 7300, { [BANK]: 327000 });
  await tab(p, 'receipts');
  let r = await receipts(p);
  ck('5 Dec, Receipts: 10 Nov to 9 Dec, spent 24,700 of 32,000, and its rows add up to that (6,300 + 6,500 + 7,700 and the groceries 4,200)',
    r.start === '2026-11-10' && r.end === '2026-12-09' && r.spent === 24700 && r.of === 32000 && JSON.stringify(r.gaps) === '[6300,6500,7700]' && JSON.stringify(r.spends) === '[4200]' && sum(r.gaps) + sum(r.spends) === r.spent, JSON.stringify(r));

  /* 10 Dec: pay day, before anything is ticked */
  await go(p, '2026-12-10');
  await L.home(p, '10 Dec, pay day, nothing ticked yet', 7300, { [BANK]: 327000 });

  /* 12 Dec: the check across the pay day */
  await go(p, '2026-12-12');
  ticked = await checkin(p, { [BANK]: 537300, 'Card A': 14700, 'Card B': 5005 });
  ck('12 Dec: the check asked about the pay and both card payments, 55,000 and 19,700', ticked.length === 3 && ticked.some(t => /Card A/.test(t)) && ticked.some(t => /Card B/.test(t)), JSON.stringify(ticked));
  await L.home(p, '12 Dec after the check across pay day (6,300 and 2,145 fall after the pay)', 51555, { [BANK]: 537300 });
  ck('12 Dec, Home: the cards show what was typed, 14,700 and 5,005', JSON.stringify(await cardsOwed(p)) === '[14700,5005]', JSON.stringify(await cardsOwed(p)));
  await tab(p, 'receipts');
  r = await receipts(p);
  ck('12 Dec, Receipts: the period from 10 Dec, spent 8,445 of 60,000, its two gap rows 2,145 and 6,300 add up to it',
    r.start === '2026-12-10' && r.spent === 8445 && r.of === 60000 && JSON.stringify(r.gaps) === '[2145,6300]' && r.spends.length === 0 && sum(r.gaps) === r.spent, JSON.stringify(r));
  await p.click('#rcOlder'); await w(250);
  r = await receipts(p);
  ck('12 Dec, Receipts, Earlier: 10 Nov to 9 Dec, spent 35,960 of 32,000, with 8,400 and 2,860 from the 12 Dec check',
    r.start === '2026-11-10' && r.end === '2026-12-09' && r.spent === 35960 && r.of === 32000 && JSON.stringify(r.gaps) === '[2860,6300,6500,7700,8400]', JSON.stringify(r));
  ck('12 Dec, Receipts, Earlier: its rows add up to its spent figure (five gap rows and the groceries)', JSON.stringify(r.spends) === '[4200]' && sum(r.gaps) + sum(r.spends) === r.spent, JSON.stringify(r));
  await tab(p, 'plan');
  const left = await p.$eval('#a3Plan [data-line=free] [data-fig=free-left]', x => Number((x.dataset.amt !== undefined ? x : x.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
  ck('12 Dec, Plan: Free to spend left is the same 51,555', left === 51555, left);

  /* 19 Dec: a week into the new period */
  await go(p, '2026-12-19');
  ticked = await checkin(p, { [BANK]: 537300, 'Card A': 23100, 'Card B': 5005 });
  ck('19 Dec: nothing to tick (the rent leaves on the 28th)', ticked.length === 0, JSON.stringify(ticked));
  await L.home(p, '19 Dec after the check (8,400 not logged on Card A)', 43155, { [BANK]: 537300 });
  await tab(p, 'receipts');
  r = await receipts(p);
  ck('19 Dec, Receipts: the period from 10 Dec, spent 16,845 of 60,000, rows 2,145, 6,300 and 8,400',
    r.start === '2026-12-10' && r.spent === 16845 && r.of === 60000 && JSON.stringify(r.gaps) === '[2145,6300,8400]' && sum(r.gaps) + sum(r.spends) === r.spent, JSON.stringify(r));
  await p.click('#rcOlder'); await w(250);
  r = await receipts(p);
  ck('19 Dec, Receipts, Earlier: the period gone by still reads 35,960 of 32,000', r.start === '2026-11-10' && r.spent === 35960 && r.of === 32000, JSON.stringify(r));

  await c.close();
  await L.finish();
})().catch(e => { console.log('FAIL e3_walk_cardgap stopped: ' + (e && e.stack || e)); process.exit(1); });
