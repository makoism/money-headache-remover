#!/usr/bin/env node
/* [M48 "Cents where the currency has them. Yen whole.", M51, qc-numbers run 1 B1] Every dollar and peso amount on
   screen is written with its cents, everywhere: "$300.00" and never "$300" next to it, Home "$0.00" and Receipts
   "$0.00". Yen stays whole. Walked on the real page with a dollar book and a peso book (made-up, whole amounts only, so
   nothing on screen happens to have cents): Home, Receipts after a spend of 5 and its message, Free to spend used up,
   Plan, Check your bank, Settings, and the assistant's change card with the fake AI (tests/fake_ai_page.js). A last
   pass on a yen book checks no yen amount has cents. Made-up figures only. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require(process.env.QC_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const { openWithFakeAI, tell } = require('./fake_ai_page.js');
const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js');
const PAGE = 'file://' + path.join(__dirname, '../index.html');
const w = ms => new Promise(r => setTimeout(r, ms));
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 600))); if (!ok) bad++; };
const DAY = '2026-12-03';

function usBook() {
  return B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00-05:00', country: 'US', currency: 'USD',
    banks: [{ key: 'chk', name: 'Checking', amount: 200000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 150000, day: 25, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'cc', name: 'Visa', owed: 30000, payDay: 20, closeDay: 'not sure', payFrom: 'chk', shift: 'none' }],
    bills: [{ key: 'rent', name: 'Rent', from: 'chk', amount: 90000, day: 15, shift: 'none' }],
    free: 30000 }, { newId: I.idMaker('cnt001', () => 0.3) });
}
function phBook() {
  return B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00+08:00', country: 'PH', currency: 'PHP',
    banks: [{ key: 'bk', name: 'Savings', amount: 5000000 }],
    pays: [{ key: 'pay', name: 'Salary', bank: 'bk', amount: 2500000, day: 15, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'cc', name: 'Card', owed: 800000, payDay: 20, closeDay: 'not sure', payFrom: 'bk', shift: 'none' }],
    bills: [{ key: 'rent', name: 'Rent', from: 'bk', amount: 1200000, day: 10, shift: 'none' }],
    free: 1000000 }, { newId: I.idMaker('cnt002', () => 0.4) });
}
function jpBook() {
  return B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00+09:00', country: 'JP', currency: 'JPY',
    banks: [{ key: 'bk', name: 'Main bank', amount: 286000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'bk', amount: 240000, day: 10, shift: 'before', startsPeriod: true }],
    bills: [{ key: 'rent', name: 'Rent', from: 'bk', amount: 72000, day: 27, shift: 'none' }],
    free: 30000 }, { newId: I.idMaker('cnt003', () => 0.5) });
}

const dirs = [], errs = [];
async function open(bk, day) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a3cents-')); dirs.push(dir);
  const ctx = await chromium.launchPersistentContext(dir, { executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const p = ctx.pages()[0] || await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGE ERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|status of 401/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(PAGE + '?today=' + day); await w(300);
  const saved = await p.evaluate(async b => { const s = await BurrowStore.open(); const r = await s.save(b, { full: true }); s.db && s.db.close(); return r; }, bk);
  ck('the made-up book is saved through the store', saved && saved.ok, JSON.stringify(saved));
  await p.reload(); await w(450);
  return { p, close: () => ctx.close() };
}

/* every amount in a sign the person sees (what is on screen, not what is typed in a box) */
const SIGNS = { USD: '\\$', PHP: '₱', JPY: '¥' };
async function amountsOn(p, cur) {
  const text = await p.evaluate(() => {
    const vis = e => e && !e.hidden && e.offsetParent !== null || (e && getComputedStyle(e).position === 'fixed' && !e.hidden);
    return ['#a3Home', '#a3Rc', '#a3Plan', '#a3Check', '#a3Set', '#a3Msg', '#a3Chat', '#a3Rem'].map(s => document.querySelector(s)).filter(vis).map(e => e.innerText).join('\n');
  });
  return (text.match(new RegExp(SIGNS[cur] + '\\s?\\d[\\d,]*(?:\\.\\d+)?', 'g')) || []);
}
async function look(p, cur, where) {
  const all = await amountsOn(p, cur);
  const whole = all.filter(a => (cur === 'JPY' ? /\./.test(a) : !/\.\d\d$/.test(a)));
  ck(`${cur}, ${where}: amounts found on screen`, all.length > 0, 'none');
  ck(`${cur}, ${where}: every amount ${cur === 'JPY' ? 'whole' : 'has its cents'}`, !whole.length, `${whole.length} of ${all.length}: ${[...new Set(whole)].slice(0, 12).join(' ')}`);
  return all;
}
const tab = async (p, t) => { await p.click(`.a3-tabs [data-tab=${t}]`); await w(250); };
const shut = async p => { if (await p.$('#a3Chat[data-open] #a3ChatClose')) { await p.$eval('#a3ChatClose', e => e.click()); await w(150); } };

async function walk(bk, ids, cur, spendFrom, unit, name, freeUnits) {
  const d = await open(bk, DAY), p = d.p;
  await shut(p);
  await look(p, cur, 'Home');
  /* a spend of 5 whole units on Receipts: its message and its row */
  await tab(p, 'receipts');
  await p.fill('#rcAmt', '5'); await p.selectOption('#rcAcct', ids[spendFrom]).catch(() => {}); await p.click('#rcSave'); await w(250);
  const said = await p.$eval('#a3Msg', e => e.innerText).catch(() => '');
  ck(`${cur}: the message for a spend of 5 says ${unit}5.00`, said.includes(unit + '5.00'), said);
  await look(p, cur, 'Receipts after a spend of 5');
  /* Free to spend used up: Home and Receipts write the zero the same way */
  await p.fill('#rcAmt', String(freeUnits)); await p.click('#rcSave'); await w(300);
  await look(p, cur, 'Receipts after a second spend');
  await tab(p, 'home'); await look(p, cur, 'Home after the spends');
  await tab(p, 'plan'); await look(p, cur, 'Plan');
  await tab(p, 'home');
  await p.click('#a3CheckGo'); await w(300); await look(p, cur, 'Check your bank');
  await p.keyboard.press('Escape'); await w(200);
  if (!(await p.$eval('#a3Check', e => e.hidden))) { await p.evaluate(() => closeCheck3 && closeCheck3()); await w(150); }
  await p.click('#a3SetGo'); await w(300);
  const setAmts = await amountsOn(p, cur);
  ck(`${cur}, Settings: no amount written without cents`, setAmts.every(a => (cur === 'JPY' ? !/\./.test(a) : /\.\d\d$/.test(a))), setAmts.join(' '));
  await p.click('#a3SetClose').catch(() => {}); await w(200);
  /* the assistant's change card, with the fake AI: "lunch 5 from <account>" logged by chat */
  const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
  const ai = await openWithFakeAI(p, { steps: [body => ({ calls: [{ name: 'change', input: { steps: [{ do: 'log_spend', amount: 5 * (cur === 'JPY' ? 1 : 100), note: 'lunch', account: refIn(body, name) }] } }] }), { words: 'Logged.' }] });
  await tell(p, 'lunch 5 from ' + name);
  const card = await p.$eval('[data-card=chat-change]', e => e.innerText).catch(() => '');
  ck(`${cur}: the assistant's change card was shown`, !!card && ai.left() === 0, card || 'no card');
  await look(p, cur, 'the assistant\'s change card');
  /* what the assistant is sent about the money is written the same way (the summary and the change results) */
  const sent = ai.bodies.map(b => JSON.stringify(b.messages)).join('\n').replace(/\\n/g, '\n');
  const sentAmts = sent.match(new RegExp(SIGNS[cur] + '\\s?\\d[\\d,]*(?:\\.\\d+)?', 'g')) || [];
  const sentWhole = sentAmts.filter(a => (cur === 'JPY' ? /\./.test(a) : !/\.\d\d$/.test(a)));
  ck(`${cur}: what the assistant is sent writes every amount the same way`, sentAmts.length > 0 && !sentWhole.length, `${sentWhole.length} of ${sentAmts.length}: ${[...new Set(sentWhole)].slice(0, 10).join(' ')}`);
  await d.close();
}

(async () => {
  {
    const { book, ids } = usBook();
    await walk(book, ids, 'USD', 'chk', '$', 'Checking', 300);
  }
  {
    const { book, ids } = phBook();
    await walk(book, ids, 'PHP', 'bk', '₱', 'Savings', 10000);
  }
  {
    /* yen stays whole on every screen */
    const { book } = jpBook();
    const d = await open(book, DAY), p = d.p;
    await shut(p);
    for (const t of ['home', 'receipts', 'plan']) { await tab(p, t); await look(p, 'JPY', t); }
    await d.close();
  }
  ck('no page errors', !errs.length, errs.join(' | '));
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
  console.log(bad ? `e3_cents: ${bad} FAIL of ${n}` : `e3_cents: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
