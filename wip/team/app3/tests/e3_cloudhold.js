#!/usr/bin/env node
/* Held takes (DECISIONS_ROUND2 CS4; SYNC_PULL_PLAN version 3 F3, B2, B4; M67, M61, M36). Two devices through the page
   on the local fake vault, made-up money. The page's own cloud timers run 20 times faster here (a timed check every 3 s),
   set by a value this harness puts in the page before its scripts run. Nothing else is changed.
   1. F3: the assistant open on A, B logs a spend: Home under the chat shows it (the chat does not hold a take back).
   2. B2: a Plan form half typed on A, the chat opened over it, B logs a spend. While the form is open or covered the book
      does not change, only the revision is asked (no copy fetched, nothing sent), and "Last checked" does not move (B4).
      The chat closed: the typing is there. The form closed: Home shows the spend, and "Last checked" moves. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10', SPEED = 20, TICK = 60000 / SPEED;
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
async function type(p, sel, text) { await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function log(p, amt, note) { await type(p, '#rcAmt', amt); await type(p, '#rcNote', note); await p.tap('#rcSave'); await T.w(300); }
const view = (p, on) => p.evaluate(v => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') }); document.dispatchEvent(new Event('visibilitychange')); }, on);
const homeText = p => p.$eval('[data-panel=home]', e => e.textContent.replace(/\s+/g, ' '));
const has = async (p, note) => ((await stored(p)) || { events: [] }).events.some(e => e.note === note && !e.gone);
const FAST = sp => { window.__burrow3CloudSpeed = sp; };
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3hA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3hB-')) });
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  const calls = (from, f) => vault.log.slice(from).filter(f);
  const isRev = x => x.method === 'GET' && x.query === 'versions=1', isCopy = x => x.method === 'GET' && !x.query, isPut = x => x.method === 'PUT';
  /* B logs a spend with A untouched: B is in view only while it logs and sends, so every call after is A's */
  const bLogs = async (amt, note) => {
    const r0 = rev();
    await view(B.p, true); await B.p.tap('[data-tab="receipts"]'); await T.w(250); await log(B.p, amt, note);
    const sent = await until(() => rev() > r0, 6000), at = Date.now();   // within 100 ms of the cloud moving
    await T.w(500); await view(B.p, false); await T.w(300);
    return sent && at;
  };
  const checked = p => p.$eval('#a3CloudState', e => +(e.dataset.checked || 0)).catch(() => -1);
  const settingsOpen = async p => { await p.click('#a3SetGo'); await until(async () => !!(await p.$('#a3CloudNow'))); await T.w(200); };
  try {
    for (const X of [A, B]) await X.p.evaluateOnNewDocument(FAST, SPEED);
    const book = T.book();
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    await T.w(500); await A.p.click('#a3SetClose');
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await T.w(500); await B.p.click('#a3SetClose'); await T.w(200); await view(B.p, false);
    await T.w(TICK);

    /* ---- 1. F3: the chat open, B logs: Home under the chat shows it ---- */
    await A.p.tap('[data-tab="home"]'); await T.w(200);
    const home0 = await homeText(A.p);
    await A.p.click('#a3AskGo'); await T.w(300);
    ck('(the chat is open on A)', !!(await A.p.$('#a3Chat[data-open]:not([hidden])')));
    ck('(B logged a spend and it was sent)', await bLogs('1200', 'coffee one'));
    ck('1. F3: with the chat open, A takes the spend', await until(() => has(A.p, 'coffee one'), 3 * TICK + 1500));
    ck('1. F3: Home under the chat shows it (drawn again while the chat is open)', await until(async () => (await homeText(A.p)) !== home0, 2000), home0.slice(0, 120));
    ck('1. the chat is still open, as it was', !!(await A.p.$('#a3Chat[data-open]:not([hidden])')));
    await A.p.click('#a3ChatClose'); await T.w(300);

    /* ---- 2. B2: a Plan form half typed, the chat over it ---- */
    await A.p.tap('[data-tab="plan"]'); await T.w(250);
    await A.p.click('#plAddBill'); await T.w(300);
    await A.p.type('#pl-name', 'Gym'); await A.p.type('#pl-amount', '7000'); await T.w(200);
    await T.w(TICK + 500);   // a timed check while the form is open and the cloud has not moved: in step
    await settingsOpen(A.p);
    const c0 = await checked(A.p);
    ck('(Settings over the form says when A last checked)', c0 > 0 && /last checked at/.test(await A.p.$eval('#a3CloudState', e => e.textContent)), await A.p.$eval('#a3CloudState', e => e.textContent));
    await A.p.click('#a3SetClose'); await T.w(300);
    await A.p.click('#a3AskGo'); await T.w(300);
    const tSent = await bLogs('700', 'tea two');
    ck('(B logged a second spend and it was sent)', !!tSent);
    const from = vault.log.length;   // from here every call is A's (B is in the background)
    await T.w(3 * TICK);
    ck('2. B2: with the form covered by the chat, the book does not change', !(await has(A.p, 'tea two')));
    ck('2. B1: only the revision is asked: no copy fetched, nothing sent', calls(from, isRev).length >= 2 && calls(from, isCopy).length === 0 && calls(from, isPut).length === 0, JSON.stringify(vault.log.slice(from).map(x => x.method + ' ' + x.query)));
    await A.p.click('#a3ChatClose'); await T.w(400);
    ck('2. B2: the chat closed, the form shows with the typing still there', !!(await A.p.$('[data-card=plan-form]')) && (await A.p.$eval('#pl-name', e => e.value)) === 'Gym' && (await A.p.$eval('#pl-amount', e => e.value)) === '7000', await A.p.$eval('#pl-name', e => e.value).catch(() => 'no form'));
    await T.w(2 * TICK);
    ck('2. the form still open: still not taken, and the typing stays', !(await has(A.p, 'tea two')) && (await A.p.$eval('#pl-amount', e => e.value)) === '7000');
    await settingsOpen(A.p);
    const c1 = await checked(A.p);
    ck('2. B4: "Last checked" did not move for the take that was held', c1 > 0 && c1 < tSent, `${c1} vs ${tSent}`);
    ck('2. Settings says what is waiting', /comes in when you finish/.test(await A.p.$eval('#a3CloudState', e => e.textContent)), await A.p.$eval('#a3CloudState', e => e.textContent));
    await A.p.click('#a3SetClose'); await T.w(300);
    await A.p.click('#plBack'); await T.w(300);
    ck('(the form is closed)', !(await A.p.$('[data-card=plan-form]')));
    ck('2. the form closed: A takes the spend at once', await until(() => has(A.p, 'tea two'), TICK));
    await A.p.tap('[data-tab="receipts"]'); await T.w(300);
    ck('2. and shows it', /tea two/.test(await A.p.$eval('[data-panel=receipts]', e => e.textContent)));
    await A.p.tap('[data-tab="home"]'); await T.w(200);
    await settingsOpen(A.p);
    ck('2. B4: now "Last checked" moves', (await checked(A.p)) > tSent, `${await checked(A.p)} vs ${tSent}`);
    await A.p.click('#a3SetClose'); await T.w(200);
    await A.p.tap('[data-tab="plan"]'); await T.w(250); await A.p.click('#plAddBill'); await T.w(300);
    /* [STALE_SHEET_PLAN, M61] once the cloud's copy came in, typing kept from the closed form is dropped (back3), so an
       old figure is never put back: the form opens empty. While the form was open its typing stayed (checked above) */
    ck('2. after the take landed, the closed form\'s kept typing is dropped (stale sheet rule)', (await A.p.$eval('#pl-name', e => e.value)) === '');
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_cloudhold');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
