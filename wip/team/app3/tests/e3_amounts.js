#!/usr/bin/env node
/* Every amount box in the app goes through the one input behaviour (screens/inputs.js, LESSONS.md lesson 2): a tap, a
   click or Tab into the box selects what is in it, so the digits typed next replace the old value; a box a form puts
   in focus by itself is selected too, and the person's first click or tap after that still selects ("Change this": 12,000 then
   12000 typed must give 12000, never 121,200).
   The shared marker: each amount box is written with data-amount, and inputs.js marks each box it binds with
   data-input="amount". The source scan below fails on a new text box that is neither marked as an amount nor as text
   (a3-text, a3-txt); the page walk fails on a marked box that is not bound, or a decimal box that is not marked.
   Walked: Receipts (log in each mode, Change this, Log a spend from Home), Check your bank (item amounts, bank and card
   figures), every Plan form (add and change: lines, Free to spend, bills, pays, goals, cards, loans), Setup (with a
   second pay, a card and a bill). Ask has no amount box. Made-up amounts only. */
'use strict';
const fs = require('fs'), path = require('path');
const T = require('./lib3.js'), { ck } = T;
const { actBook } = require('./e3_act_book.js');
const DIGITS = '4321';

/* ---- the source: a text box is an amount box (data-amount) or a text box (a3-text, a3-txt), never neither ---- */
{
  const SRC = path.join(__dirname, '../src'), odd = [];
  for (const f of fs.readdirSync(SRC).filter(f => /\.(js|html)$/.test(f))) {
    const tags = fs.readFileSync(path.join(SRC, f), 'utf8').match(/<input\b[^>]*>/g) || [];
    for (const t of tags) {
      const type = (t.match(/\btype="([^"]+)"/) || [, 'text'])[1];
      if (!['text', 'number'].includes(type) || /inputmode="numeric"/.test(t)) continue;   // dates, times, ticks, codes; the day box
      if (!/\bdata-amount\b/.test(t) && !/\ba3-(text|txt)\b/.test(t)) odd.push(f + ': ' + t.slice(0, 90));
    }
  }
  ck('every text box in src/ is marked as an amount box (data-amount) or a text box', odd.length === 0, odd.join(' | '));
}

/* ---- the page: every visible input under root ---- */
async function boxesIn(p, root) {
  return p.evaluate(root => {
    const host = document.querySelector(root);
    return [...host.querySelectorAll('input')].filter(e => e.getClientRects().length > 0 && !e.disabled).map((e, i) => {
      e.setAttribute('data-walk', root + i);
      return { w: root + i, amount: e.hasAttribute('data-amount'), bound: e.getAttribute('data-input'), mode: e.getAttribute('inputmode'), name: e.id || e.getAttribute('aria-label') };
    });
  }, root);
}
/* out of the box, so the next way in opens it afresh (Escape would close the check sheet) */
const leave = p => p.evaluate(() => { const e = document.activeElement; if (e && e.blur) e.blur(); });
async function walk(p, where, root) {
  const all = await boxesIn(p, root), amounts = all.filter(x => x.amount);
  ck(where + ': has amount boxes', amounts.length > 0, JSON.stringify(all));
  ck(where + ': every amount box is bound through inputs.js', amounts.every(x => x.bound === 'amount'), JSON.stringify(amounts.filter(x => x.bound !== 'amount')));
  ck(where + ': every decimal box is marked as an amount box', all.every(x => x.mode !== 'decimal' || x.amount), JSON.stringify(all.filter(x => x.mode === 'decimal' && !x.amount)));
  const bad = [];
  for (const x of amounts) {
    const sel = `[data-walk="${x.w}"]`;
    for (const how of ['tap', 'click', 'Tab']) {
      if (how === 'Tab') {
        await p.click(sel); await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift'); await p.keyboard.press('Tab');
      } else await p[how](sel);
      await T.w(30);   // then up to 2 s more for the focus to land when other tests load the machine (still checked below)
      await p.waitForFunction(s => document.activeElement === document.querySelector(s), { timeout: 2000 }, sel).catch(() => {});
      const on = await p.$eval(sel, e => document.activeElement === e);
      await p.keyboard.type(DIGITS);
      const v = await p.$eval(sel, e => e.value);
      if (!on || v !== DIGITS) bad.push(`${x.name} by ${how}: ${on ? v : 'not focused'}`);
      await leave(p);
    }
  }
  ck(where + `: tap, click and Tab into each of ${amounts.length} amount boxes, then typing, gives only the typed digits`, bad.length === 0, bad.join(' | '));
}
/* a box the form put in focus by itself: selected, and the first click still selects */
async function fromCode(p, where, typed) {
  const st = await p.evaluate(() => { const e = document.activeElement; return e && e.hasAttribute('data-amount') ? { v: e.value, s: e.selectionStart, e: e.selectionEnd, id: e.id } : null; });
  if (!st) return false;
  ck(where + ': the box the form focused has what is in it selected', st.s === 0 && st.e === st.v.length, JSON.stringify(st));
  const sel = st.id ? '#' + st.id : null;
  if (sel) {
    /* a click: puppeteer's phone tap sends no press to a box already in focus (screens/test/browser.test.js taps it) */
    await p.click(sel); await T.w(30); await p.keyboard.type(typed || DIGITS);
    const v = await p.$eval(sel, e => e.value);
    ck(where + ': the first click after that still selects, so typing replaces' + (st.v ? ` (was ${st.v})` : ''), v === (typed || DIGITS), v);
    await leave(p);
  }
  return true;
}

(async () => {
  /* ---- a kept made-up book: Receipts and Plan ---- */
  {
    const DAY = '2026-11-25';
    const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3amt-');
    const { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, actBook());
    await p.reload(); await T.w(400);

    await p.tap('#a3LogGo'); await T.w(300);
    ck('Home\'s Log a spend: the amount box is the one in focus', await fromCode(p, 'Log a spend from Home'));
    await walk(p, 'Receipts, log a spend', '#rcForm');
    for (const m of ['refund', 'moved', 'spend']) {
      await p.tap(`[data-mode="${m}"]`); await T.w(200);
      await fromCode(p, 'Receipts, ' + m + ' picked');
      await walk(p, 'Receipts, ' + m, '#rcForm');
    }
    /* Change this: the reviewer's case, 12,000 then 12000 typed */
    await p.tap('#rcAmt'); await p.keyboard.type('12000'); await p.tap('#rcSave'); await T.w(400);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    const row = await p.$('#rcList [data-rc] button');
    ck('a spend is there to change', !!row);
    if (row) {
      await row.tap(); await T.w(300);
      ck('Change this is open', /Change this/.test(await p.$eval('#rcForm', e => e.textContent)));
      ck('Change this: the amount box is the one in focus', await fromCode(p, 'Change this', '12000'));
      await walk(p, 'Receipts, Change this', '#rcForm');
      await p.tap('#rcCancel'); await T.w(200);
    }

    await p.tap('[data-tab="plan"]'); await T.w(300);
    const openers = await p.evaluate(() => {
      const out = ['#plAddLine', '#plSetFree', '#plAddBill', '#plAddGoal', '#plAddCard', '#plAddLoan'].filter(s => document.querySelector(s));
      for (const a of ['line', 'bill', 'pay', 'goal', 'owed']) { const e = document.querySelector(`#a3Plan [data-${a}]`); if (e) out.push(`#a3Plan [data-${a}="${e.getAttribute('data-' + a)}"]`); }
      return out;
    });
    ck('Plan: the forms to walk are there (adds and changes)', openers.length >= 9, openers.join(' '));
    for (const o of openers) {
      await p.click(o); await T.w(300);
      const title = await p.$eval('[data-card=plan-form] h2', e => e.textContent).catch(() => o);
      await fromCode(p, 'Plan, ' + title);
      const n = (await boxesIn(p, '#a3Plan')).filter(x => x.amount).length;
      if (n) await walk(p, 'Plan, ' + title, '#a3Plan');
      else ck('Plan, ' + title + ': no amount box, and no decimal box either', (await boxesIn(p, '#a3Plan')).every(x => x.mode !== 'decimal'));
      await p.click('#plBack'); await T.w(200);
    }
    ck('no page errors (kept book)', errs.length === 0, errs.join(' | '));
    await b.close();
  }

  /* ---- Check your bank, the try book on 10 Dec (items to confirm, a bank and two cards) ---- */
  {
    const { b, p, errs } = await T.open();
    await p.goto(T.URL0 + '?try=mako&today=2026-12-10'); await T.w(400);
    await p.click('#a3CheckGo'); await T.w(300);
    ck('Check your bank: the first bank figure is the one in focus', await fromCode(p, 'Check your bank'));
    const kinds = await p.evaluate(() => ['data-amt', 'data-bankfig', 'data-cardfig'].map(a => document.querySelectorAll(`#a3Check [${a}]`).length));
    ck('Check your bank has item amounts, bank figures and card figures to walk', kinds.every(n => n > 0), kinds.join(','));
    await walk(p, 'Check your bank', '#a3Check');
    ck('no page errors (check)', errs.length === 0, errs.join(' | '));
    await b.close();
  }

  /* ---- Setup, with a second pay, a card and a bill ---- */
  {
    const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3amts-');
    const { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=2026-11-20'); await T.w(400);
    await p.click('#a3SetupGo'); await T.w(300);
    ck('Setup: the bank figure is the one in focus', await fromCode(p, 'Setup'));
    for (const s of ['#s3AddPay', '#s3AddCard', '#s3AddBill']) { await p.click(s); await T.w(100); }
    await walk(p, 'Setup', '#a3Setup');
    ck('no page errors (setup)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_amounts');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack)); process.exit(1); });
