#!/usr/bin/env node
/* A change is sent by itself (DECISIONS_ROUND2 CS1; SYNC_PULL_PLAN B5; M67, M11, M4, M66). Two devices through the page
   on the local fake vault, made-up money. Device A runs on the page's real clocks: no timer is shortened for it. Device B
   only looks, with its timed check 20 times faster so the test does not wait a minute for it.
   1. The owner's way: log once, close the page one second later. The other device shows it.
   2. The first change goes at once, a burst again 5 seconds after its last change, never two sends inside 10 seconds:
      three spends in 20 seconds, the page hidden at 25, with a copy over 64 KB. The other device shows all three.
   3. Leaving with a change still waiting and a copy over 64 KB: a plain send carries it.
   4. The day's guard: after 1,200 sends in a day this device sends no more by itself, Settings says so, and what the
      other device changes still arrives.
   5. B5: the server's "too many saves today" stops sends with the same words, not "the cloud is busy". */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10', SPEED = 20, TICK = 60000 / SPEED;
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const device = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { return ((await s.getDevice()) || {}).cloud || null; } finally { s.close(); } });
const setSends = (p, n) => p.evaluate(async n0 => { const s = await BurrowStore.open(); try { const d = (await s.getDevice()) || {}; d.cloud = Object.assign({}, d.cloud, { sends: { day: new Date().toISOString().slice(0, 10), n: n0 } }); return await s.putDevice(d); } finally { s.close(); } }, n);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
async function type(p, sel, text) { await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function log(p, amt, note) { await type(p, '#rcAmt', amt); await type(p, '#rcNote', note); await p.tap('#rcSave'); }
const has = async (p, note) => ((await stored(p)) || { events: [] }).events.some(e => e.note === note && !e.gone);
const view = (p, on) => p.evaluate(v => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') }); document.dispatchEvent(new Event('visibilitychange')); }, on);
const state = p => p.$eval('#a3CloudState', e => e.textContent);
const FAST = sp => { window.__burrow3CloudSpeed = sp; };
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3sA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3sB-')) });
  const real = vault.handle, puts = [];
  const stamp = (m, id, tok, body, q) => { const r = real(m, id, tok, body, q); if (m === 'PUT') puts.push({ t: Date.now(), size: JSON.stringify(body).length, status: r.status }); return r; };
  vault.handle = stamp;
  const newA = async () => { A.p = await A.b.newPage(); await A.p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); await A.p.goto(URL); await T.w(600); await A.p.tap('[data-tab="receipts"]'); await T.w(250); };
  try {
    await B.p.evaluateOnNewDocument(FAST, SPEED);
    /* made-up spends from the ten months before this book opens, so the copy is over 64 KB as it is sent. They are dated
       before the opening on purpose: 900 spends inside the open period make every save on the page take about 9 seconds
       (found here, reported to the main session; not a cloud fault), and this test is about the clocks of the send */
    const book = T.book();
    for (let i = 1; i <= 900; i++) book.events.push({ id: 'k7m2qa-h4t9w2c6ye-' + i, k: 'spend', acct: book.accounts[0].id, date: '2026-' + String(1 + (i % 10)).padStart(2, '0') + '-' + String(1 + (i % 28)).padStart(2, '0'), a: 100 + i, note: crypto.randomBytes(40).toString('hex').match(/.{8}/g).join(' '), told: '2026-10-29T10:00:00.000+09:00', at: '2026-10-29T10:00:00.000+09:00', by: 'k7m2qa' });
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(500);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on, and the copy sent is over 64 KB)', await until(() => vault.rows.size === 1) && puts[0].size > 65536, puts[0] && puts[0].size);
    await T.w(500); await A.p.click('#a3SetClose');
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.events.length >= 900; }, 15000));
    await T.w(500); await B.p.click('#a3SetClose'); await T.w(200);
    await A.p.tap('[data-tab="receipts"]'); await T.w(250);
    await T.w(11000);   // a quiet stretch: the sends of turning on are well behind

    /* ---- 1. log once, close one second later ---- */
    await log(A.p, '1200', 'coffee one');
    await T.w(1000);
    await A.p.close();
    ck('1. logged, closed after one second: the other device shows it', await until(() => has(B.p, 'coffee one'), 2 * TICK + 2000));
    await newA();
    await T.w(11000);

    /* ---- 2. three spends in 20 seconds, hidden at 25 ---- */
    const n2 = puts.length, t0 = Date.now();
    await log(A.p, '700', 'tea two');
    await T.w(Math.max(0, 9000 - (Date.now() - t0))); await log(A.p, '450', 'bun three');
    await T.w(Math.max(0, 19000 - (Date.now() - t0))); await log(A.p, '300', 'gum four');
    await T.w(Math.max(0, 25000 - (Date.now() - t0))); await view(A.p, false);
    ck('2. three spends in 20 seconds, hidden at 25: the other device shows all three', await until(async () => (await has(B.p, 'tea two')) && (await has(B.p, 'bun three')) && (await has(B.p, 'gum four')), 2 * TICK + 3000));
    const mine = puts.slice(n2).filter(x => x.status === 200);
    ck('2. the first change was sent at once (inside 2 seconds)', mine.length >= 1 && mine[0].t - t0 < 2000, mine.map(x => x.t - t0).join(','));
    const timed = mine.filter(x => x.t - t0 < 25000);
    ck('2. never two sends inside 10 seconds while the page was in view', timed.every((x, i) => i === 0 || x.t - timed[i - 1].t >= 9900), timed.map(x => x.t - t0).join(','));
    ck('2. the burst was sent again by itself, 5 seconds after a change or as soon as 10 seconds had passed', timed.length >= 2 && timed.length <= 3, timed.map(x => x.t - t0).join(','));
    await view(A.p, true); await T.w(11000);

    /* ---- 3. leaving with a change waiting and a big copy: a plain send ---- */
    const t3 = Date.now(), n3 = puts.length;
    await log(A.p, '250', 'pen five'); await T.w(1000); await log(A.p, '350', 'ink six'); await T.w(1000);
    ck('(the second spend is still waiting two seconds in)', puts.slice(n3).filter(x => x.status === 200).length === 1, puts.slice(n3).length);
    await view(A.p, false);
    ck('3. leaving sends the waiting spend, though the copy is too big to outlive the page', await until(() => puts.slice(n3).filter(x => x.status === 200).length >= 2, 4000) && Date.now() - t3 < 8000, (Date.now() - t3) + ' ms');
    ck('3. the other device shows both', await until(async () => (await has(B.p, 'pen five')) && (await has(B.p, 'ink six')), 2 * TICK + 3000));
    await view(A.p, true);

    /* ---- 4. the day's guard at 1,200 sends ---- */
    await T.w(1500); await setSends(A.p, 1199); await A.p.reload(); await T.w(800); await A.p.tap('[data-tab="receipts"]'); await T.w(250);
    await T.w(10500);
    let n4 = puts.length;
    await log(A.p, '500', 'jam seven');
    ck('4. the 1,200th send of the day goes', await until(() => puts.length > n4, 3000) && await until(async () => (await device(A.p)).sends.n === 1200, 2000), JSON.stringify((await device(A.p)).sends));
    await T.w(10500); n4 = puts.length;
    await log(A.p, '600', 'nut eight');
    await T.w(12000);
    ck('4. after 1,200 sends in a day this device sends no more by itself', puts.length === n4, puts.length - n4);
    await A.p.click('#a3SetGo'); await until(async () => !!(await A.p.$('#a3CloudNow')));
    ck('4. Settings says so, with the number', /1,200/.test(await state(A.p)) && /tomorrow/.test(await state(A.p)), await state(A.p));
    await A.p.click('#a3SetClose'); await T.w(200);
    await B.p.tap('[data-tab="receipts"]'); await T.w(250); await log(B.p, '900', 'oat nine');
    ck('4. what the other device changes still arrives here', await until(() => has(A.p, 'oat nine'), 75000));
    ck('4. and this device\'s own spend is kept, still waiting', (await has(A.p, 'nut eight')) && !(await has(B.p, 'nut eight')));
    ck('4. still nothing sent by this device', puts.filter(x => x.status === 200).length === puts.slice(0, n4).filter(x => x.status === 200).length + 1, 'B sent one');

    /* ---- 5. B5: the server says "too many saves today" ---- */
    await setSends(A.p, 3); await A.p.reload(); await T.w(800);
    ck('(a new count: the waiting spend is sent on opening)', await until(() => has(B.p, 'nut eight'), 2 * TICK + 3000));
    vault.handle = (m, id, tok, body, q) => (m === 'PUT' ? { status: 429, j: { error: { code: 'rate_limited', message: 'Too many saves today for this vault.' } } } : stamp(m, id, tok, body, q));
    await T.w(10500);
    await A.p.tap('[data-tab="receipts"]'); await T.w(250); await log(A.p, '800', 'pea ten');
    await T.w(1500);
    await A.p.click('#a3SetGo'); await until(async () => !!(await A.p.$('#a3CloudNow')));
    ck('5. B5: the server\'s daily limit is said with the guard\'s words', await until(async () => /most it sends in one day/.test(await state(A.p)) && /tomorrow/.test(await state(A.p)), 3000), await state(A.p));
    ck('5. B5: never as "the cloud is busy"', !/busy/.test(await state(A.p)));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_cloudsend');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
