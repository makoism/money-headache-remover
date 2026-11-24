/* Shared pieces for the QC scripts (QC_ROLES.md "Scripts beat reviewers" b, c, d): e3_boxwalk.js, e3_always.js and
   e3_fit.js. One table, PLACES, names every screen, sheet and form of the built page and how a person gets there, so the
   three scripts walk the same list and a new sheet in the page shell with no row here fails all three.
   A place is { name, state, sheet, open(p), root, out }:
     state  'empty' (a new device), 'try' (the made-up numbers) or 'book' (a made-up book built through the page: setup,
            then a line, a goal, a loan and one spend, so every Plan form and the receipt form have something to show)
     sheet  the id of the .a3-sheet it lives in, or null for a tab panel
     root   where its boxes are (a selector)
     out    the button that leaves it, or 'tab' when it is a tab panel (the way out is another tab)
   Made-up amounts only. Playwright, one browser per state, closed and its profile removed by finish(). */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require(process.env.TOOLS_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const FILE = process.env.APP3 || path.join(__dirname, '../index.html');
const PAGE = 'file://' + FILE;
const w = ms => new Promise(r => setTimeout(r, ms));
const DAY0 = '2026-12-01', DAY = '2026-12-12';   // the book is set up on 1 Dec and walked on 12 Dec (pay and the card's day are past)

/* ck with a KNOWN table: a check that finds a real fault in the app stays failing and is listed in the test's KNOWN
   table with its reason. It prints "KNOWN FAIL"; the test passes only when the failures are exactly the KNOWN set (a
   KNOWN check that passes again is a FAIL until it is taken out of the table). */
function make(label, KNOWN = {}) {
  let bad = 0, n = 0, known = 0;
  const errs = [], dirs = [], ctxs = [], seen = new Set();
  const ck = (name, ok, extra) => {
    n++; seen.add(name);
    const more = ok || extra === undefined ? '' : ' ' + String(extra).replace(/\s+/g, ' ').slice(0, 500);
    if (name in KNOWN) {
      if (ok) { bad++; console.log('FAIL ' + name + ' (listed in KNOWN but it passes now: take it out of KNOWN and QCSCRIPTS_FOUND.md)'); }
      else { known++; console.log('KNOWN FAIL ' + name + more + ' [' + KNOWN[name] + ']'); }
      return ok;
    }
    console.log((ok ? 'PASS ' : 'FAIL ') + name + more); if (!ok) bad++;
    return ok;
  };
  const watch = p => { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.text()); }); };
  async function open(o = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a3qc-')); dirs.push(dir);
    const c = await chromium.launchPersistentContext(dir, Object.assign({ executablePath: '/usr/bin/google-chrome', headless: true, acceptDownloads: true,
      viewport: { width: o.w || 390, height: o.h || 844 }, colorScheme: o.scheme || 'dark', args: ['--no-sandbox', '--disable-gpu'] }, o.touch ? { hasTouch: true, isMobile: true } : {}));
    ctxs.push(c); c.on('page', watch); for (const p of c.pages()) watch(p);
    const p = c.pages()[0] || await c.newPage();
    p.setDefaultTimeout(o.timeout || 4000);   // a thing a person cannot press is known in seconds, not half a minute
    return { c, p };
  }
  const finish = async () => {
    for (const k of Object.keys(KNOWN)) if (!seen.has(k)) { bad++; console.log('FAIL ' + k + ' (listed in KNOWN but no check has that name any more)'); }
    for (const c of ctxs) await c.close().catch(() => {});
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    console.log(bad ? `${label}: ${bad} FAIL of ${n}` + (known ? ` (and ${known} KNOWN FAIL)` : '') : `${label}: ALL PASS (${n - known})` + (known ? ` and ${known} KNOWN FAIL (the faults in this test's KNOWN table, each in tests/QCSCRIPTS_FOUND.md)` : ''));
    process.exit(bad ? 1 : 0);
  };
  return { ck, open, finish, errs };
}

const go = async (p, day, q) => { await p.goto(PAGE + '?today=' + day + (q || '')); await w(450); };
const tap = async (p, sel, ms) => { await p.click(sel); await w(ms || 220); };
const typeIn = async (p, sel, v) => { await p.fill(sel, String(v)); await p.$eval(sel, e => e.dispatchEvent(new Event('blur'))); };
const tabTo = (p, name) => tap(p, `[data-tab=${name}]`);

/* a section of setup at a time, as a person does (tests/setup_sections.js) */
const { saveSections } = require('./setup_sections.js');

/* the made-up book, built through the page: two accounts, a pay on the 10th, a card paid on the 10th, a bill on the
   27th, Free to spend, then on Plan a line, a goal and a loan, and one spend on Receipts. Gives '' or what went wrong. */
async function buildBook(p) {
  await go(p, DAY0);
  await tap(p, '#a3SetupGo', 300);
  await typeIn(p, '#s3Bank', '300000'); await typeIn(p, '#s3PayAmt', '240000'); await p.selectOption('#s3PayDay', '10');
  await tap(p, '#s3AddAcct', 120); await typeIn(p, '#s3-acct2-a', '5000');
  await tap(p, '#s3AddCard', 120); await typeIn(p, '#s3-card1-o', '20000');
  await tap(p, '#s3AddBill', 120); await typeIn(p, '#s3-bill1-a', '8000');
  await typeIn(p, '#s3Free', '40000');
  const e = await saveSections(p);
  if (e) return 'setup: ' + e;
  await tap(p, '#a3SetupSave', 800);
  if (!(await p.$eval('#a3Setup', x => x.hidden))) return 'setup did not close: ' + await p.$eval('#a3SetupErr', x => x.textContent);
  const plan = async (opener, vals) => {
    await tabTo(p, 'plan'); await tap(p, opener);
    for (const k of Object.keys(vals)) await p.fill('#pl-' + k, vals[k]);
    await tap(p, '[data-plbtn="0"]', 350);
    return (await p.$('#plErr')) ? opener + ': ' + await p.$eval('#plErr', x => x.textContent) : '';
  };
  const e2 = (await plan('#plAddLine', { name: 'Food', amount: '30000' })) || (await plan('#plAddGoal', { name: 'Trip', target: '100000' }))
    || (await plan('#plAddLoan', { name: 'Car loan', owed: '90000', amount: '9000', payDay: '20' }));
  if (e2) return e2;
  await tabTo(p, 'receipts'); await tap(p, '[data-mode=spend]', 150);
  await p.fill('#rcAmt', '1200'); await p.fill('#rcNote', 'lunch'); await tap(p, '#rcSave', 400);
  const e3 = await p.$eval('#rcErr', x => x.textContent);
  if (e3) return 'receipt: ' + e3;
  await go(p, DAY);
  return '';
}

/* ---- the places ---- */
const plForm = (name, opener) => ({ name: 'Plan: ' + name, state: 'book', sheet: null, root: '#a3Plan', out: '#plBack', open: async p => { await tabTo(p, 'plan'); await tap(p, opener); } });
const rc = mode => ({ name: 'Receipts: ' + ({ spend: 'Money went out', in: 'Money came in', refund: 'Refund', moved: 'Moved' })[mode], state: 'book', sheet: null, root: '#a3Rc', out: 'tab', open: async p => { await tabTo(p, 'receipts'); await tap(p, `[data-mode=${mode}]`, 160); } });
const sheet = (name, state, id, go3, out, more) => ({ name, state, sheet: id, root: '#' + id, out, open: async p => { await tap(p, go3, 300); if (more) await more(p); } });
const setupRows = async p => { for (const b of ['#s3AddAcct', '#s3AddPay', '#s3AddCard', '#s3AddBill']) await tap(p, b, 120); };
const PLACES = [
  { name: 'First screen', state: 'empty', sheet: null, root: '#a3Home', out: 'tab', open: async () => {} },
  sheet('Setup', 'empty', 'a3Setup', '#a3SetupGo', '#a3SetupX', setupRows),
  sheet('Setup: pay on two days, a second income every 2 weeks, a card with its close day, a bill once a year', 'empty', 'a3Setup', '#a3SetupGo', '#a3SetupX', async p => {
    await setupRows(p); await p.selectOption('#s3PayEvery', 'days'); await p.selectOption('#s3-pay2-e', 'weeks2'); await p.selectOption('#s3-card1-c', '25'); await p.selectOption('#s3-bill1-e', 'year'); await w(150); }),
  sheet('Setup: pay every 2 weeks, a second income on two days', 'empty', 'a3Setup', '#a3SetupGo', '#a3SetupX', async p => {
    await setupRows(p); await p.selectOption('#s3PayEvery', 'weeks2'); await p.selectOption('#s3-pay2-e', 'days'); await w(150); }),
  sheet('Setup: pay lands today', 'empty', 'a3Setup', '#a3SetupGo', '#a3SetupX', async p => { await p.selectOption('#s3PayDay', '1'); await w(150); }),
  sheet('Settings from "I already use the burrow on another device"', 'empty', 'a3Set', '#a3OtherGo', '#a3SetClose', async p => { await p.waitForSelector('#a3CloudCode', { timeout: 3000 }).catch(() => {}); }),
  sheet('Settings (new device)', 'empty', 'a3Set', '#a3SetGo', '#a3SetClose'),
  { name: 'Home (made-up numbers)', state: 'try', sheet: null, root: '#a3', out: 'tab', open: async () => {} },
  { name: 'Home', state: 'book', sheet: null, root: '#a3Home', out: 'tab', open: async () => {} },
  rc('spend'), rc('in'), rc('refund'), rc('moved'),
  { name: 'Receipts: a receipt opened to change', state: 'book', sheet: null, root: '#a3Rc', out: 'tab', open: async p => { await tabTo(p, 'receipts'); await tap(p, '#a3Rc .a3-rcrow'); } },
  { name: 'Plan', state: 'book', sheet: null, root: '#a3Plan', out: 'tab', open: async p => { await tabTo(p, 'plan'); } },
  plForm('Free to spend', '[data-line=free]'), plForm('Add a line', '#plAddLine'), plForm('a line', '[data-line]:not([data-line=free])'),
  plForm('the pay', '[data-pay]'), plForm('a bill', '[data-bill]'), plForm('Add a bill', '#plAddBill'),
  plForm('Add a goal', '#plAddGoal'), plForm('a goal', '[data-goal]'),
  plForm('a card', 'button[data-owed]:has-text("Card")'), plForm('Add a card', '#plAddCard'),
  plForm('Add a loan', '#plAddLoan'), plForm('a loan', 'button[data-owed]:has-text("Car loan")'),
  sheet('Check your bank', 'book', 'a3Check', '#a3CheckGo', '#a3CheckX'),
  sheet('Settings', 'book', 'a3Set', '#a3SetGo', '#a3SetClose'),
  sheet('Settings: a backup file locked with a code', 'book', 'a3Set', '#a3SetGo', '#a3SetClose', async p => { await p.check('#a3BkLock'); await w(120); }),
  sheet('Settings: I have a code', 'book', 'a3Set', '#a3SetGo', '#a3SetClose', async p => { await p.waitForSelector('#a3CloudHave', { timeout: 3000 }); await tap(p, '#a3CloudHave'); }),
  sheet('Reminders', 'book', 'a3Rem', '#a3RemGo', '#a3RemClose'),
  sheet('Ask', 'book', 'a3Ask', '#a3AskGo', '#a3AskClose'),
  sheet('Add statements', 'book', 'a3Stmt', '#a3StmtGo', '#a3StmtX'),
  sheet('Add statements: any AI instead', 'book', 'a3Stmt', '#a3StmtGo', '#a3StmtX', async p => { await tap(p, '#a3Stmt summary'); }),
];
/* a fresh start of one state, then the place: the page is loaded again each time, so no place leans on the one before */
async function reach(p, place) {
  await go(p, place.state === 'empty' ? DAY0 : DAY, place.state === 'try' ? '&try=mako' : '');
  /* a new device stays new: a setup left half way is kept as a draft and opens by itself (DECISIONS new foundation 14),
     so the draft a place before left is taken out of the device record here (a test's step, not a person's) */
  if (place.state === 'empty' && await p.evaluate(() => new Promise(res => {
    const rq = indexedDB.open('burrow3');
    rq.onerror = () => res(false);
    rq.onsuccess = () => { const db = rq.result; if (!db.objectStoreNames.contains('device')) { db.close(); res(false); return; }
      const tx = db.transaction('device', 'readwrite'), st = tx.objectStore('device'), g = st.get('device'); let had = false;
      g.onsuccess = () => { const d = g.result; if (d && d.setup) { had = true; delete d.setup; st.put(d, 'device'); } };
      tx.oncomplete = () => { db.close(); res(had); }; };
  }))) await go(p, DAY0);
  await place.open(p);
}
/* the sheets the page shell holds, read from the page, and each one's rows in PLACES */
const shellSheets = p => p.$$eval('.a3-sheet', es => es.map(e => e.id));
/* what a person sees: which panels and sheets have a box on screen */
const seen = p => p.evaluate(() => {
  const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0;
  return { panels: [...document.querySelectorAll('[data-panel]')].filter(vis).map(e => e.dataset.panel), sheets: [...document.querySelectorAll('.a3-sheet')].filter(vis).map(e => e.id) };
});
module.exports = { make, PLACES, reach, buildBook, shellSheets, seen, go, tap, typeIn, tabTo, w, PAGE, FILE, DAY, DAY0 };
