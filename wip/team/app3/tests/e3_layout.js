#!/usr/bin/env node
/* The layout holds on a stress book, at every size (qc-layout candidate 2, blockers 1 and 3 to 6; MAKO_SAYS M52 "even a
   kid can figure it out", M33 his Android phone, M21; LESSONS lesson 2: one rule for every date box, every drop-down,
   every name and every figure, and lesson 3: every screen is counted, not sampled).

   Books, made-up figures only:
     stress   dollars; every name is 60 letters with one unbroken 28-letter word; 999,999,999.99 everywhere;
              6 accounts, 2 incomes, 12 bills, 2 plan lines, 2 goals, receipts. Kept on the device, so the assistant shows.
     yen      Mako's made-up shape with a line of 1,000,000 yen and a spend of 12,345,678 yen (ordinary names).
     new      a device with no book: the welcome, and setup with every kind of row added.
   Sizes: 320x640, 390x844, 412x915 and 1300x900.

   On every main screen and sheet (the list is printed with the result) these four hold:
     1. no sideways scroll (the page, the scrolling area #a3, the assistant's panel) and nothing runs off its card;
     2. no drop-down cuts its own words: the longest option fits the box, on as many lines as the box shows;
     3. no date box is too narrow to show its date;
     4. nothing to tap is under 44 by 44, except a tick box whose label is 44 high (the label is the target).
   The header's "Ask" link is left out of 4: it is being replaced (the assistant is the bar and the panel now).

   APP3=<path to another index.html> runs it on that page (it was run once on the page before the fixes: every fault
   above showed). */
'use strict';
const path = require('path');
const L = require('./lives3.js').make('e3_layout');
const { ck, w } = L;
const PAGE = 'file://' + (process.env.APP3 || path.join(__dirname, '../index.html'));
const BOOK = require('../fixtures/mako_madeup_book.json');
const SIZES = [[320, 640], [390, 844], [412, 915], [1300, 900]];
const WORD28 = 'Abcdefghijklmnopqrstuvwxyzab';
const BIG = 99999999999;   // 999,999,999.99 in cents
const long = (what, i) => (`${what}${i} ${WORD28} with more words after it to make sixty letters`).slice(0, 60);

function stressBook() {
  const b = JSON.parse(JSON.stringify(BOOK));
  const walk = o => { if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (k === 'cur' && o[k] === 'JPY') o[k] = 'USD'; else walk(o[k]); } };
  walk(b);
  const id = n => 'k7m2qa-f3n8p1x6wd-' + n, bank = b.accounts[0].id;
  let n = 100;
  /* 6 accounts: the bank, two cards, and a second bank, cash and an e-wallet, each opened with a big figure */
  for (const type of ['bank', 'cash', 'ewallet']) {
    const a = Object.assign({}, b.accounts[0], { id: id(++n), type });
    b.accounts.push(a);
    b.events.push({ id: id(++n), k: 'open', acct: a.id, date: '2026-11-20', a: BIG, told: '2026-11-20T24:00', grp: 'setup' }, { id: id(++n), k: 'check', acct: a.id, date: '2026-11-20', a: BIG, told: '2026-11-20T24:00', grp: 'setup' });
  }
  /* 12 bills */
  const bills = b.schedules.filter(s => s.kind === 'bill');
  for (let i = 0; i < 8; i++) b.schedules.push(Object.assign(JSON.parse(JSON.stringify(bills[i % bills.length])), { id: id(++n) }));
  b.accounts.forEach((a, i) => { a.name = long(a.type === 'card' ? 'Card' : 'Bank', i); });
  b.schedules.forEach((s, i) => { s.name = long(s.kind === 'income' ? 'Pay' : 'Bill', i); for (const st of s.steps) st.amount = s.kind === 'income' ? BIG : 1234567; });
  for (const e of b.events) e.a = e.acct === bank || e.k === 'spend' ? BIG : e.a;
  b.plan.budgets.push({ id: id(++n), name: long('Line', 1), place: 'bills', cur: 'USD', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: BIG - 1 }] },
    { id: id(++n), name: long('Line', 2), place: 'bills', cur: 'USD', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 49999999999 }] });
  b.places.push({ id: id(++n), name: long('Goal', 1), kind: 'goal', target: BIG, cur: 'USD', keptIn: { acct: bank, mode: 'inBank' } },
    { id: id(++n), name: long('Goal', 2), kind: 'goal', target: BIG, cur: 'USD', keptIn: { acct: bank, mode: 'inBank' }, due: '2027-06-30' });
  return b;
}
function yenBook() {
  const b = JSON.parse(JSON.stringify(BOOK));
  b.plan.budgets.push({ id: 'k7m2qa-f3n8p1x6wd-201', name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 1000000 }] });
  return b;
}

/* the four rules, read off the page as it is now */
function audit() {
  const out = [], docEl = document.documentElement;
  const vis = e => { if (e.closest('[hidden]')) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '')) + ' "' + String(e.getAttribute('aria-label') || e.textContent || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 22) + '"';
  const px = v => parseFloat(v) || 0;
  /* 1 */
  for (const [n, e] of [['the page', docEl], ['#a3', document.getElementById('a3')], ['the assistant', document.querySelector('.a3-chat-body')]]) if (e && e.scrollWidth > e.clientWidth + 1) out.push(`sideways scroll: ${n} is ${e.scrollWidth} wide in ${e.clientWidth}`);
  for (const card of document.querySelectorAll('.a3-card')) {
    if (!vis(card)) continue;
    const cr = card.getBoundingClientRect();
    for (const e of card.querySelectorAll('*')) { if (!vis(e) || e.closest('.a3-vh')) continue; const r = e.getBoundingClientRect(); if (r.right > cr.right + 1 || r.left < cr.left - 1) { out.push(`runs off its card: ${name(e)} ${Math.round(r.left)} to ${Math.round(r.right)}, the card ${Math.round(cr.left)} to ${Math.round(cr.right)}`); break; } }
  }
  /* 2 and 3 */
  const cv = document.createElement('canvas').getContext('2d');
  const font = cs => `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  for (const s of document.querySelectorAll('select')) {
    if (!vis(s)) continue;
    const cs = getComputedStyle(s); cv.font = font(cs);
    let need = 0, words = ''; for (const o of s.options) { const t = o.textContent.trim(), m = cv.measureText(t).width; if (m > need) { need = m; words = t; } }
    const room = s.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight) - 20;   // 20: the arrow
    const lh = px(cs.lineHeight) || px(cs.fontSize) * 1.2, lines = Math.max(1, Math.floor((s.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom) + 2) / lh));
    const wraps = cs.whiteSpace !== 'nowrap' && cs.whiteSpace !== 'pre';
    const fits = need <= room + 1 || (wraps && need <= room * lines * 0.8 && !words.split(/\s+/).some(x => cv.measureText(x).width > room + 1 && cs.overflowWrap === 'normal' && cs.wordBreak === 'normal'));
    if (!fits) out.push(`drop-down cuts its words: ${name(s)} needs ${Math.round(need)} for "${words.slice(0, 30)}", has ${Math.round(room)} on ${lines} line${lines > 1 ? 's' : ''}`);
  }
  for (const d of document.querySelectorAll('input[type=date]')) {
    if (!vis(d)) continue;
    const cs = getComputedStyle(d); cv.font = font(cs);
    const need = cv.measureText('00/00/0000').width + px(cs.paddingLeft) + px(cs.paddingRight) + 28, has = d.getBoundingClientRect().width;   // 28: the calendar mark
    if (has < need - 1) out.push(`date box too narrow for its date: ${name(d)} is ${Math.round(has)}, needs ${Math.round(need)}`);
  }
  /* 4 */
  for (const e of document.querySelectorAll('button, a[href], select, input:not([type=hidden]), textarea, summary, [role=button]')) {
    if (!vis(e) || e.disabled || e.id === 'a3AskGo') continue;
    const r = e.getBoundingClientRect();
    if (e.type === 'checkbox' || e.type === 'radio') { const lab = [...(e.labels || [])].map(l => l.getBoundingClientRect().height); if (!lab.some(h => h >= 43.5)) out.push(`tap target under 44: tick box ${name(e)} ${Math.round(r.width)}x${Math.round(r.height)}, its label ${lab.map(Math.round).join(',') || 'none'}`); continue; }
    if (r.width < 43.5 || r.height < 43.5) out.push(`tap target under 44: ${name(e)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return out;
}

const seen = [];
let all = 0;
async function look(p, at, screen) {
  await w(120);
  const faults = await p.evaluate(audit);
  seen.push(screen); all++;
  ck(`${at} ${screen}: no sideways scroll, no cut drop-down or date box, no tap target under 44`, faults.length === 0, faults.length + ' faults');
  for (const f of faults) console.log('     ' + f);
}
const has = (p, sel) => p.$eval(sel, e => !e.closest('[hidden]') && e.getBoundingClientRect().width > 0).catch(() => false);
async function tap(p, sel) { if (!(await has(p, sel))) return false; await p.$eval(sel, e => e.click()); await w(300); return true; }
const go = async (p, day) => { await p.goto(PAGE + '?today=' + day); await w(450); };
async function keep(p, book, more) {
  await go(p, '2026-11-24');
  await p.evaluate(async ([book, more]) => {
    const { E3, ACT3 } = BurrowApp3; await E3.fill(book);
    const a = E3.book.accounts;
    for (const [amount, acct] of more) await ACT3.logSpend({ date: E3.today(), a: amount, acct: a[acct].id, line: 'free' });
  }, [book, more]);
  await go(p, '2026-11-24');
}

async function mainScreens(p, at, book) {
  const full = book === 'stress', B = `${book} book, `;
  await p.click('[data-tab=home]'); await w(200);
  await look(p, at, B + 'Home');
  if (full) {
    for (const h of await p.$$('#a3Home .burrow-help')) await h.evaluate(e => e.click());
    await look(p, at, B + 'Home with its help open');
    for (const h of await p.$$('#a3Home .burrow-help[aria-expanded=true]')) await h.evaluate(e => e.click());
    if (await tap(p, '#a3CheckGo')) { await look(p, at, B + 'Check your bank'); await tap(p, '#a3CheckX'); }
    if (await tap(p, '#a3StmtGo')) { await look(p, at, B + 'Add statements'); await tap(p, '#a3StmtX'); }
  }
  await p.click('[data-tab=receipts]'); await w(200);
  await look(p, at, B + 'Receipts');
  if (full) {
    for (const m of ['refund', 'in', 'moved']) if (await tap(p, `[data-mode=${m}]`)) await look(p, at, B + 'Receipts, ' + m);
    await tap(p, '[data-mode=spend]');
    if (await tap(p, '#a3Rc li[data-rc] .a3-rcrow')) { await look(p, at, B + 'Receipts, a receipt being changed'); await tap(p, '#rcCancel'); }
  }
  await p.click('[data-tab=plan]'); await w(200);
  await look(p, at, B + 'Plan');
  if (full) {
    for (const [sel, what] of [['#plAddLine', 'add a line'], ['#plAddBill', 'add a bill'], ['#plAddGoal', 'add a goal'], ['#plAddCard', 'add a card'], ['#plAddLoan', 'add a loan'], ['#a3Plan [data-bill] .a3-rcrow', 'change a bill'], ['#a3Plan [data-goal] .a3-rcrow', 'change a goal']])
      if (await tap(p, sel)) { await look(p, at, B + 'Plan, ' + what); await tap(p, '#plBack'); }
    for (const [go_, x, what] of [['#a3SetGo', '#a3SetClose', 'Settings'], ['#a3RemGo', '#a3RemClose', 'Reminders'], ['#a3AskGo', '#a3AskClose', 'Ask']])
      if (await tap(p, go_)) { await look(p, at, B + what); await tap(p, x); }
    /* the assistant: its bar, then the panel open with a change card (the app's own card, given a made-up change) */
    if (await has(p, '#a3Chat')) {
      await p.evaluate(([name, big]) => { const c = BurrowApp3.chat; c.CHAT3.state.turns.push({ id: 'tlayout', who: 'card', card: { kind: 'change', status: 'ask', ask: 'large', lines: ['Change ' + name + ' to a new amount'], rows: [{ label: name, before: big, after: big - 1 }, { label: 'Safe to spend', before: -big, after: -big }] } }); c.redraw(); }, [long('Bill', 1), BIG]);
      await p.focus('#a3ChatIn').catch(() => {}); await w(300);
      await look(p, at, B + "the assistant's panel with a change card");
      await tap(p, '#a3ChatClose');
    }
  }
}

(async () => {
  for (const [W, H] of SIZES) {
    const at = `${W}x${H}`;
    /* the stress book, kept */
    { const { c, p } = await L.open(); await p.setViewportSize({ width: W, height: H });
      await keep(p, stressBook(), [[BIG, 0], [BIG, 1], [1234567, 2], [BIG, 3]]);
      const shape = await p.evaluate(() => { const b = BurrowApp3.E3.book; return { accounts: b.accounts.length, bills: b.schedules.filter(s => s.kind === 'bill').length }; });
      ck(`${at} stress book: 6 accounts and 12 bills are kept, the assistant shows`, shape.accounts === 6 && shape.bills === 12 && await has(p, '#a3Chat'), JSON.stringify(shape));
      await mainScreens(p, at, 'stress');
      await c.close(); }
    /* yen: 1,000,000 on a line, 12,345,678 spent */
    if (W < 1000) { const { c, p } = await L.open(); await p.setViewportSize({ width: W, height: H });
      await keep(p, yenBook(), [[12345678, 0], [12345678, 1]]);
      await mainScreens(p, at, 'yen');
      await c.close(); }
    /* a new device: the welcome, then setup with every kind of row */
    { const { c, p } = await L.open(); await p.setViewportSize({ width: W, height: H });
      await go(p, '2026-11-24');
      await look(p, at, 'new device, the welcome');
      if (await tap(p, '#a3SetupGo')) {
        for (const add of ['#s3AddAcct', '#s3AddPay', '#s3AddCard', '#s3AddBill']) await tap(p, add);
        for (const s of await p.$$('#a3Setup select')) await s.evaluate(e => { const q = e.closest('[data-q]'); if (q) q.hidden = false; });   // the boxes a later answer brings up
        await look(p, at, 'new device, setup with every row');
      }
      await c.close(); }
  }
  const names = [...new Set(seen)];
  console.log(`screens and sheets looked at: ${all} (${names.length} kinds at ${SIZES.length} sizes): ${names.join('; ')}`);
  ck('every kind of screen was reached at every size', names.length >= 24 && all >= names.length * 3, `${names.length} kinds, ${all} looks`);
  await L.finish();
})().catch(e => { console.log('FAIL e3_layout crashed ' + (e && e.stack || e)); process.exit(1); });
