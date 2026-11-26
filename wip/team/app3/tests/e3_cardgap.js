#!/usr/bin/env node
/* A card's unlogged spending found at a check belongs to the days it covers (CARDGAP_PLAN; MAKO_SAYS M11 he logs
   weekly, M30 nearly all spending on cards, M36, M38 periods run pay to pay, M45 no coin counted twice), through the
   built page as a person uses it. Made-up yen only.

   Mako's shape, typed into the real setup screen on Tue 24 Nov 2026: Main bank 300,000, pay 300,000 on the 10th, Card A
   with 20,000 on it paid on the 10th, Card B with 10,000 on it paid on the 11th (close days not sure), and 60,000 each
   pay period on food, transport and small things (Free to spend). No bills.

   Worked by hand:
     24 Nov  The period running is 10 Nov to 9 Dec, 30 days; 16 of them are left (24 Nov to 9 Dec), so Free to spend
             counts 60,000 x 16 / 30 = 32,000. The bank can spare all 300,000 (the cards leave after the pay lands),
             far more, so safe to spend is the 32,000.
      6 Dec  Check your bank: bank 300,000, Card A 50,000, Card B 24,000. Not logged: 30,000 and 14,000, all before
             the pay. Free to spend left 32,000 - 44,000 = -12,000, so safe to spend is 0.
     13 Dec  Check your bank: the pay (10 Dec), Card A's 50,000 (10 Dec) and Card B's 24,000 (11 Dec) are ticked, bank
             526,000 (300,000 + 300,000 - 50,000 - 24,000, no gap of its own), Card A 21,000, Card B 7,000.
             Not logged over 7 to 13 Dec, found at the 13 Dec check. [CHECKGAP, coordinator 15, 26 Nov] A check's gap is
             the period the check is in, whole (by days it was 9,000 + 3,000 before the pay and 12,000 + 4,000 after):
             The period from 10 Dec: spent 21,000 + 7,000 = 28,000 of 60,000, so 32,000 left; safe to spend 32,000
             (the bank can spare all 526,000).
             The period 10 Nov to 9 Dec keeps what its own check found: 30,000 + 14,000 = 44,000 of 32,000.
     Receipts shows each card's 13 Dec gap as two rows, one in each period, and the rows of a period add up to that
     period's spent figure. Plan and Home say the same 32,000. A reload changes nothing. */
'use strict';
const path = require('path');
const LA = require(path.join(__dirname, '../../engine/lookahead.js'));
const L = require('./lives3.js').make('e3_cardgap');
const { ck, go, tab, typeIn, txt, w } = L;
const { finishSetup } = require('./setup_sections.js');
const BANK = 'Main bank';

/* Receipts as it is drawn: the period's dates, the Free to spend row of its spent figure, and every row of the list */
const receipts = p => p.evaluate(() => {
  const yen = s => { const m = /([−-])?\s*⁠?\s*¥\s*([\d,]+)/.exec(s.replace(/⁠/g, '')); return m ? (m[1] ? -1 : 1) * Number(m[2].replace(/,/g, '')) : null; };
  const per = document.querySelector('#a3Rc [data-fig=rc-period]');
  const free = [...document.querySelectorAll('#a3Rc [data-fig=rc-spent] li')].find(li => /^Free to spend/.test(li.textContent.trim()));
  const amts = free ? [...free.querySelectorAll('[data-amt]')].map(a => Number(a.dataset.amt)) : [];
  const rows = [...document.querySelectorAll('#rcList li')].map(li => ({ gap: li.dataset.gap !== undefined, k: li.dataset.k || null, check: li.dataset.check || null,
    text: li.textContent.replace(/\s+/g, ' ').trim(), amount: yen((li.querySelector('.amt') || li).textContent) }));
  return { start: per ? per.dataset.start : null, end: per ? per.dataset.end : null, spent: amts[0], of: amts[1], rows };
});
const gapRows = (r, card) => r.rows.filter(x => x.gap && x.text.includes(card));
const figAmt = (p, sel) => p.$eval(sel, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);

/* Check your bank as a person fills it: every item left ticked, then the bank's box and each card's box by name
   (lives3's own check-in types the bank boxes only). Then a reload must change no figure. */
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

/* everything the test reads on 13 Dec, so the same reading can be made again after a reload */
async function read13(p) {
  await tab(p, 'receipts');
  const now = await receipts(p);
  await p.click('#rcOlder'); await w(250);
  const old = await receipts(p);
  await p.click('#rcNewer'); await w(250);
  await tab(p, 'plan');
  const plan = { left: await figAmt(p, '#a3Plan [data-line=free] [data-fig=free-left]'), amount: await figAmt(p, '#a3Plan [data-line=free] [data-fig=free-amount]') };
  await tab(p, 'home');
  const home = { safe: await figAmt(p, '#a3Home [data-fig=safe]'), cap: await txt(p, '#a3Home [data-fig=cap]') };
  return { now, old, plan, home };
}

(async () => {
  const { c, p } = await L.open();
  /* ---- setup, 24 Nov, through the real setup screen ---- */
  await go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await w(250);
  await p.fill('#s3BankName', BANK);
  await typeIn(p, '#s3Bank', '300000');
  await p.selectOption('#s3PayDay', '10'); await typeIn(p, '#s3PayAmt', '300000');
  for (const [k, name, owed, day] of [[1, 'Card A', 20000, '10'], [2, 'Card B', 10000, '11']]) {
    await p.click('#s3AddCard'); const r = `[data-row=card${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed); await p.selectOption(r + '[data-f=payDay]', day);
  }
  await typeIn(p, '#s3Free', '60000');
  const e = await finishSetup(p); await w(800);
  ck('setup: every section saved and Home shows', e === '' && await p.$eval('#a3Setup', x => x.hidden).catch(() => false), e || await txt(p, '#a3SetupErr'));
  await L.home(p, '24 Nov after setup (Free to spend counts 16 of 30 days: 32,000)', 32000, { [BANK]: 300000 });

  /* ---- 6 Dec: the cards checked, before the pay ---- */
  await go(p, '2026-12-06');
  await checkin(p, { [BANK]: 300000, 'Card A': 50000, 'Card B': 24000 });
  await L.home(p, '6 Dec after the check (44,000 not logged, more than the 32,000)', 0, { [BANK]: 300000 });
  await tab(p, 'receipts');
  let r = await receipts(p);
  ck('6 Dec, Receipts: the period is 10 Nov to 9 Dec and Free to spend reads spent 44,000 of 32,000', r.start === '2026-11-10' && r.end === '2026-12-09' && r.spent === 44000 && r.of === 32000, JSON.stringify([r.start, r.end, r.spent, r.of]));
  ck('6 Dec, Receipts: one gap row for each card, 30,000 and 14,000', JSON.stringify([gapRows(r, 'Card A').map(x => x.amount), gapRows(r, 'Card B').map(x => x.amount)]) === '[[30000],[14000]]', JSON.stringify(r.rows));

  /* ---- 13 Dec: the cards checked again, across the pay on the 10th ---- */
  await go(p, '2026-12-13');
  const ticked = await checkin(p, { [BANK]: 526000, 'Card A': 21000, 'Card B': 7000 });
  ck('13 Dec: the check asked about the pay and both card payments (three items, all ticked)', ticked.length === 3 && ticked.some(t => /Card A/.test(t)) && ticked.some(t => /Card B/.test(t)), JSON.stringify(ticked));
  await L.home(p, '13 Dec after the check (28,000 of the 60,000 spent since the pay)', 32000, { [BANK]: 526000 });

  const checks = async (v, when) => {
    const { now, old, plan, home } = v;
    /* the period running now, from 10 Dec */
    ck(`${when}, Receipts: this period starts 10 Dec and Free to spend reads spent 28,000 of 60,000`, now.start === '2026-12-10' && now.spent === 28000 && now.of === 60000, JSON.stringify([now.start, now.end, now.spent, now.of]));
    const nA = gapRows(now, 'Card A'), nB = gapRows(now, 'Card B');
    ck(`${when}, Receipts: this period holds one row of Card A's gap, all 21,000, naming the days it covers, 7 to 13 Dec`, nA.length === 1 && nA[0].amount === 21000 && /Found at your bank check on 13 Dec/.test(nA[0].text) && /7 Dec to 13 Dec/.test(nA[0].text), JSON.stringify(nA));
    ck(`${when}, Receipts: and one row of Card B's, 7,000`, nB.length === 1 && nB[0].amount === 7000 && /7 Dec to 13 Dec/.test(nB[0].text), JSON.stringify(nB));
    const nowGaps = now.rows.filter(x => x.gap), nowSpends = now.rows.filter(x => x.k === 'spend');
    ck(`${when}, Receipts: nothing else in this period is spending (no bank gap, no logged spend)`, nowGaps.length === 2 && nowSpends.length === 0, JSON.stringify(now.rows.map(x => [x.k, x.gap, x.amount])));
    ck(`${when}, Receipts: this period's rows add up to its spent figure (21,000 + 7,000 = 28,000)`, nowGaps.reduce((s, x) => s + x.amount, 0) === now.spent, `${nowGaps.map(x => x.amount)} vs ${now.spent}`);
    /* the period gone by, 10 Nov to 9 Dec */
    ck(`${when}, Receipts, Earlier: 10 Nov to 9 Dec, Free to spend reads spent 44,000 of 32,000, as it closed`, old.start === '2026-11-10' && old.end === '2026-12-09' && old.spent === 44000 && old.of === 32000, JSON.stringify([old.start, old.end, old.spent, old.of]));
    const oA = gapRows(old, 'Card A').map(x => [x.check, x.amount]).sort(), oB = gapRows(old, 'Card B').map(x => [x.check, x.amount]).sort();
    ck(`${when}, Receipts, Earlier: Card A's only row is 30,000 (6 Dec): nothing of the 13 Dec gap`, JSON.stringify(oA) === '[["2026-12-06",30000]]', JSON.stringify(oA));
    ck(`${when}, Receipts, Earlier: Card B's only row is 14,000 (6 Dec)`, JSON.stringify(oB) === '[["2026-12-06",14000]]', JSON.stringify(oB));
    const oldGaps = old.rows.filter(x => x.gap);
    ck(`${when}, Receipts, Earlier: its rows add up to its spent figure (30,000 + 14,000 = 44,000)`, oldGaps.length === 2 && old.rows.filter(x => x.k === 'spend').length === 0 && oldGaps.reduce((s, x) => s + x.amount, 0) === old.spent, `${oldGaps.map(x => x.amount)} vs ${old.spent}`);
    ck(`${when}: the two periods hold 72,000 in all, each card's 13 Dec gap once (21,000 and 7,000)`, now.spent + old.spent === 72000
      && [...gapRows(now, 'Card A'), ...gapRows(old, 'Card A')].filter(x => x.check === '2026-12-13').reduce((s, x) => s + x.amount, 0) === 21000
      && [...gapRows(now, 'Card B'), ...gapRows(old, 'Card B')].filter(x => x.check === '2026-12-13').reduce((s, x) => s + x.amount, 0) === 7000, `${now.spent} ${old.spent}`);
    /* Plan and Home say the same */
    ck(`${when}, Plan: Free to spend left 32,000 of 60,000 (60,000 less this period's 28,000 on Receipts)`, plan.left === 32000 && plan.amount === 60000 && plan.amount - plan.left === now.spent, JSON.stringify(plan));
    ck(`${when}, Home: safe to spend is the same 32,000, and its sum says Free to spend is the limit`, home.safe === 32000 && home.safe === plan.left && home.cap !== '(none)' && /32,000/.test(home.cap), JSON.stringify(home));
  };
  const first = await read13(p);
  await checks(first, '13 Dec');

  /* the page against the engine on the book the store keeps: the same parts, the same card figures */
  const bk = await L.readBook(p), er = LA.lookahead(bk, '2026-12-13');
  const cardId = name => bk.accounts.find(a => a.name === name).id;
  const parts13 = name => er.cards[cardId(name)].fillers.filter(f => f.day === '2026-12-13').map(f => [f.from, f.to, f.parts.map(x => [x.from, x.to, x.amount])]);
  ck('the kept book, through the engine: Card A\'s 13 Dec gap covers 7 to 13 Dec and counts whole, 21,000, on 13 Dec', JSON.stringify(parts13('Card A')) === '[["2026-12-07","2026-12-13",[["2026-12-13","2026-12-13",21000]]]]', JSON.stringify(parts13('Card A')));
  ck('the kept book, through the engine: Card B\'s the same, 7,000', JSON.stringify(parts13('Card B')) === '[["2026-12-07","2026-12-13",[["2026-12-13","2026-12-13",7000]]]]', JSON.stringify(parts13('Card B')));
  ck('the kept book: the cards owe what was typed (21,000 and 7,000) and nothing is still asked for', er.cards[cardId('Card A')].owedNow === 21000 && er.cards[cardId('Card B')].owedNow === 7000 && er.checkIn.toConfirm.length === 0, JSON.stringify(er.checkIn.toConfirm));

  /* ---- a reload changes nothing ---- */
  await L.sameAfterReload(p, '13 Dec');
  const again = await read13(p);
  await checks(again, 'after a reload');
  ck('after a reload: every Receipts row of both periods reads the same', JSON.stringify([again.now.rows, again.old.rows]) === JSON.stringify([first.now.rows, first.old.rows]), JSON.stringify(again.now.rows));

  await c.close();
  await L.finish();
})().catch(async e => { console.log('FAIL e3_cardgap stopped: ' + (e && e.stack || e)); process.exit(1); });
