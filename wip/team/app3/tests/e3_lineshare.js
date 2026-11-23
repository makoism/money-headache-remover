#!/usr/bin/env node
/* A line added mid-period (QC F5, numbers review B2). Made-up Mako book, kept, on Wed 25 Nov (period 10 Nov to 9 Dec,
   set up 20 Nov): Food of 30,000 each pay period. Only the part for the days left counts in this period, 20 of 30 days:
   30,000 x 20 / 30 = 20,000. The row shows one amount for the period, the one that counts now (20,000), and a sentence
   gives the full 30,000. After 35,000 is spent on Food: 20,000 - 35,000 = -15,000, and the sentence says
   "Spent ¥35,000 of ¥20,000: ¥15,000 over Food. It comes out of what your bank can spare". Receipts says the same words when a spend
   takes a line over (1,076 more: "¥16,076 over Food. It comes out of what your bank can spare"). Every figure is the engine's. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const DAY = '2026-11-25', BANK = 'k7m2qa-f3n8p1x6wd-1';
const fill = (p, vals) => p.evaluate(v => { for (const [k, x] of Object.entries(v)) { const e = document.getElementById('pl-' + k); e.focus(); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); } }, vals);
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const row = (p, id) => p.$eval(`[data-line="${id}"]`, e => ({ left: Number(e.querySelector('[data-fig=line-left] [data-amt]').dataset.amt), amount: Number(e.querySelector('[data-fig=line-amount] [data-amt]').dataset.amt), text: e.textContent }));
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3line-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); await s.save(bk0, { full: true }); s.close(); }, T.book());
  await p.reload(); await T.w(400);
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plAddLine'); await T.w(200);
  await fill(p, { name: 'Food', amount: '30000' }); await p.click('[data-plbtn="0"]'); await T.w(400);
  let bk = await saved(p), r = T.L.lookahead(bk, DAY);
  const food = bk.plan.budgets[0], l = r.period.lines.find(x => x.id === food.id);
  ck('the engine: 30,000 a period, 20,000 counts now (20 of 30 days)', l.amount === 30000 && l.counts === 20000 && l.left === 20000, JSON.stringify(l));
  let x = await row(p, food.id);
  ck('the row shows one amount for the period, the one that counts now: 20,000 left of 20,000', x.left === 20000 && x.amount === 20000, JSON.stringify(x));
  ck('a sentence says only the part for the days left counts now, with the full 30,000', /¥30,000/.test(x.text) && /days left in this pay period/.test(x.text) && !/[.]$/.test(x.text.trim()), x.text);
  /* [NS-FIX 5] the part-period sentence has its "?", with the help piece's words */
  const hs = await p.$eval(`[data-line="${food.id}"]`, x => { const e = x.closest('li'), b = e.querySelector('.burrow-help[data-help=lineShare]'); if (!b) return null; b.click(); const t = e.querySelector('.burrow-help-text'); return { shown: t && !t.hidden, text: t && t.textContent }; });
  ck('the part-period sentence has a "?" that opens the help piece\'s words', hs && hs.shown && hs.text === require('../../screens/help.js').words('lineShare').join(' '), JSON.stringify(hs));
  /* 35,000 spent on Food, kept in the store as Receipts would keep it */
  await p.evaluate(async (acct, line, day) => { const s = await BurrowStore.open(); const r = await s.load(); const t = day + 'T13:00:00.000+09:00';
    r.copy.events.push({ id: 'k7m2qa-zzzzzzzzzz-901', k: 'spend', acct, date: day, a: 35000, line, told: t, at: t, by: 'k7m2qa' }); await s.save(r.copy, { full: true }); s.close(); }, BANK, food.id, DAY);
  await p.reload(); await T.w(400); await p.tap('[data-tab="plan"]'); await T.w(300);
  bk = await saved(p); r = T.L.lookahead(bk, DAY);
  const l2 = r.period.lines.find(y => y.id === food.id);
  ck('the engine after 35,000 spent: -15,000 left, 15,000 over', l2.spent === 35000 && l2.left === -15000 && l2.over === 15000, JSON.stringify(l2));
  x = await row(p, food.id);
  ck('the row: -15,000 left of 20,000, which adds up', x.left === -15000 && x.amount === 20000, JSON.stringify(x));
  ck('and says how far over: Spent ¥35,000 of ¥20,000: ¥15,000 over Food. It comes out of what your bank can spare', /Spent ¥35,000 of ¥20,000: ¥15,000 over Food. It comes out of what your bank can spare/.test(x.text), x.text);
  /* [NS-FIX 4] Receipts says the same words (one shared function) when a spend takes a line over: 1,076 more on Food
     makes it 15,000 + 1,076 = 16,076 over, the engine's figure, before saving and after */
  await p.tap('[data-tab="receipts"]'); await T.w(300);
  await p.tap('#rcAmt'); await p.keyboard.type('1076');
  await p.select('#rcFor', 'line:' + food.id); await T.w(300);
  const dry = T.L.lookahead(bk, DAY).period.lines.find(y => y.id === food.id);   // before; after is the engine's below
  const pre = await p.$eval('[data-fig="rc-over"]', e => e.textContent).catch(() => null);
  ck('before saving, Receipts says: ¥16,076 over Food. It comes out of what your bank can spare', pre === '\u00a516,076 over Food. It comes out of what your bank can spare' && dry.over === 15000, pre);
  await p.click('#rcSave'); await T.w(400);
  const bar = await p.evaluate(() => (document.querySelector('#a3Msg .burrow-msg span') || {}).textContent || '');
  bk = await saved(p);
  const l3 = T.L.lookahead(bk, DAY).period.lines.find(y => y.id === food.id);
  ck('after saving, the Undo bar says it too, the engine\'s figure', l3.over === 16076 && bar === 'Logged \u00a51,076 on Food. \u00a516,076 over Food. It comes out of what your bank can spare', bar + ' / ' + l3.over);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_lineshare');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
