#!/usr/bin/env node
/* "Which to keep": stale answers and Undo right after Keep (coordinator rulings, 25 Nov; M20, M61, M14). Devices through
   the page on the local fake vault, made-up money. Each clash is made the way e3_cloudwhich makes one: each device's
   store gets its own change with its own device part, then the devices sync.
   A. Stale answers. Device B has two tabs that both show the same row.
      (a) Keep one in tab 1, then answer the OTHER way in tab 2, which still shows the old row.
      (b) A new clash; the item is changed again in tab 1 through the Plan screen; then tab 2 answers its old row.
      PASS: the stale answer is refused with a plain message, OR it applies with Undo and neither version is lost; and in
      (b) the newer change is not overwritten.
   B. Undo right after Keep, for each kind of question: a plan item, a settings item, a whole copy. Keep one, tap Undo
      on the message at once: the question and both versions are back as before. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const setAmount = (p, id, amount, at) => p.evaluate(async (id0, a0, at0) => {
  const by = BurrowStore.local.deviceIdPart(), s = await BurrowStore.open();
  try { const r = await s.load(); const x = r.copy.schedules.find(y => y.id === id0); x.steps = [{ from: null, amount: a0 }]; Object.assign(x, { at: at0, by }); return (await s.save(r.copy)).ok; } finally { s.close(); }
}, id, amount, at);
const setCountry = (p, v, at) => p.evaluate(async (v0, at0) => {
  const by = BurrowStore.local.deviceIdPart(), s = await BurrowStore.open();
  try { const r = await s.load(); r.copy.home.country = { v: v0, at: at0, by }; return (await s.save(r.copy)).ok; } finally { s.close(); }
}, v, at);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
const amountOf = (b, id) => b.schedules.find(x => x.id === id).steps.slice(-1)[0].amount;
const keptOf = (b, of) => (b.keptVersions || []).find(k => k.of === of);
const rowsOf = p => p.$$eval('[data-cloudq=which] li', ls => ls.map(l => l.querySelector('span').textContent.replace(/\s+/g, ' ').trim())).catch(() => []);
const said = p => p.evaluate(() => [...document.querySelectorAll('#a3Msg, #a3Set')].map(e => e.textContent).join(' | ').replace(/\s+/g, ' ')).catch(() => '');
const undoShown = p => p.evaluate(() => !![...document.querySelectorAll('#a3Msg button')].find(x => /Undo/.test(x.textContent)));
const tapUndo = p => p.evaluate(() => { const b = [...document.querySelectorAll('#a3Msg button')].find(x => /Undo/.test(x.textContent)); if (b) b.click(); return !!b; });
async function settingsOpen(p) { await p.bringToFront(); if (!(await p.$('#a3SetClose'))) await p.click('#a3SetGo'); await until(async () => !!(await p.$('#a3CloudState'))); await T.w(300); }
async function settingsClose(p) { await p.bringToFront(); if (await p.$('#a3SetClose')) { await p.click('#a3SetClose'); await T.w(200); } }
async function pickRow(p, re) {
  await p.bringToFront();
  const rows = await rowsOf(p), i = rows.findIndex(t => re.test(t));
  if (i < 0) return false;
  await (await p.$$('[data-cloudq=which] li button'))[i].click();
  return true;
}
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3w2A-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3w2B-')) });
  let C = null, B2 = null;
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  try {
    const book = T.book();
    const id = n => book.schedules.find(x => x.name === n).id;
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    await T.w(500); await settingsClose(A.p);
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await T.w(500); await settingsClose(B.p);
    B2 = await B.b.newPage(); await B2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); await B2.goto(URL); await T.w(600);
    let minute = 0;
    const at = () => `2026-12-10T${String(9 + Math.floor(minute / 60)).padStart(2, '0')}:${String(minute++ % 60).padStart(2, '0')}:00.000+09:00`;
    /* a clash on one item, asked on B: A's change sent first, then B's */
    const clash = async (change, of) => {
      await change(A.p, 'a', at()); await change(B.p, 'b', at());
      const r0 = rev(); await A.p.bringToFront(); await A.p.reload(); await until(() => rev() > r0); await T.w(400);
      await B.p.bringToFront(); await B.p.reload(); await T.w(300);
      const asked = await until(async () => { const k = keptOf(await stored(B.p), of); return !!k && k.ask; });
      if (B2) { await B2.bringToFront(); await B2.reload(); await T.w(600); await B.p.bringToFront(); }
      return asked;
    };

    /* ---- A(a): two tabs, kept in tab 1, the other way in tab 2 ---- */
    const RENT = id('Rent');
    ck('(A(a): Rent changed on both, B is asked)', await clash((p, w, t) => setAmount(p, RENT, w === 'a' ? 75000 : 78000, t), RENT));
    await settingsOpen(B.p); await B2.bringToFront(); await settingsOpen(B2); await B.p.bringToFront();
    ck('(both tabs show the row)', (await rowsOf(B.p)).length === 2 && (await rowsOf(B2)).length === 2, JSON.stringify([await rowsOf(B.p), await rowsOf(B2)]));
    await pickRow(B.p, /¥75,000/);
    ck('(tab 1 kept 75,000)', await until(async () => amountOf(await stored(B.p), RENT) === 75000));
    await B2.bringToFront(); await T.w(300);
    const stale2 = (await rowsOf(B2)).length === 2;
    const tapped = stale2 && await pickRow(B2, /¥78,000/);
    await T.w(1500);
    const bkA = await stored(B2), amtA = amountOf(bkA, RENT), kA = keptOf(bkA, RENT), msgA = await said(B2);
    const refusedA = amtA === 75000 && (!tapped || /nothing changed/i.test(msgA));
    const appliedA = amtA === 78000 && (await undoShown(B2)) && !!kA && [75000, 78000].every(a => kA.versions.some(v => v.steps && v.steps.slice(-1)[0].amount === a));
    console.log(`(A(a): tab 2 ${stale2 ? 'still showed the old row and it was tapped' : 'no longer showed the old row'}; Rent is now ${amtA}; said: ${msgA.slice(0, 160)})`);
    ck('A(a): the stale answer in tab 2 is refused with a plain message, or applies with Undo and neither version is lost', refusedA || appliedA, `amount ${amtA}`);
    await settingsClose(B2); await B.p.bringToFront(); await settingsClose(B.p);

    /* ---- A(b): a new clash, changed again on the Plan screen in tab 1, then tab 2 answers its old row ---- */
    const POWER = id('Power');
    ck('(A(b): Power changed on both, B is asked)', await clash((p, w, t) => setAmount(p, POWER, w === 'a' ? 7600 : 7900, t), POWER));
    await B2.bringToFront(); await settingsOpen(B2);
    ck('(tab 2 shows the Power row)', (await rowsOf(B2)).some(t => /Power/.test(t)), JSON.stringify(await rowsOf(B2)));
    await B.p.bringToFront();
    await B.p.tap('[data-tab="plan"]'); await T.w(300);
    await B.p.click(`[data-bill="${POWER}"]`); await T.w(300);
    await B.p.$eval('#pl-amount', e => { e.focus(); e.value = '9100'; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); });
    await B.p.click('[data-plbtn="0"]'); await T.w(600);
    const pw = (await stored(B.p)).schedules.find(x => x.id === POWER);
    ck('(tab 1 changed Power to 9,100 on the Plan screen)', pw.steps.some(x => x.amount === 9100), JSON.stringify(pw.steps));
    await B2.bringToFront(); await T.w(300);
    const stale3 = (await rowsOf(B2)).some(t => /Power/.test(t));
    const tapped3 = stale3 && await pickRow(B2, /¥7,600/);
    await T.w(1500);
    const pw2 = (await stored(B2)).schedules.find(x => x.id === POWER);
    console.log(`(A(b): tab 2 ${stale3 ? 'still showed the old row' + (tapped3 ? ' and it was tapped' : '') : 'no longer showed the old row'}; Power steps now ${JSON.stringify(pw2.steps.map(x => x.amount))}; said: ${(await said(B2)).slice(0, 160)})`);
    ck('A(b): the newer change (9,100) is not overwritten by the stale answer', pw2.steps.slice(-1)[0].amount === 9100 || (pw2.steps.some(x => x.amount === 9100) && !pw2.steps.some(x => x.amount === 7600)), JSON.stringify(pw2.steps));
    await settingsClose(B2); await B2.close(); B2 = null; await B.p.bringToFront();
    await B.p.tap('[data-tab="home"]'); await T.w(200);

    /* ---- B: Undo right after Keep, each kind ---- */
    const undoKind = async (p, of, re, name) => {
      await settingsOpen(p);
      const k0 = keptOf(await stored(p), of), rows0 = await rowsOf(p);
      const tapped = await pickRow(p, re);
      const kept = await until(async () => { const k = keptOf(await stored(p), of); return !!k && !k.ask; }, 4000);
      await T.w(200);
      const hadUndo = await tapUndo(p);
      await T.w(1200);
      const k1 = keptOf(await stored(p), of), rows1 = await rowsOf(p);
      console.log(`(B ${name}: tapped ${tapped}, kept ${kept}, an Undo on the message ${hadUndo}; rows after: ${rows1.length})`);
      ck(`B ${name}: Keep, then Undo at once: an Undo is offered`, hadUndo);
      ck(`B ${name}: after Undo the question is back with both versions`, !!k1 && k1.ask === true && k1.versions.length === k0.versions.length && rows1.length === rows0.length, JSON.stringify(k1 && { ask: k1.ask, n: k1.versions.length }));
      await settingsClose(p);
      return k1;
    };
    const NET = id('Internet');
    ck('(B, a plan item: Internet changed on both, B is asked)', await clash((p, w, t) => setAmount(p, NET, w === 'a' ? 5500 : 5800, t), NET));
    const before = amountOf(await stored(B.p), NET);
    await undoKind(B.p, NET, /¥5,500/, 'a plan item');
    ck('B a plan item: and the amount is back as before', amountOf(await stored(B.p), NET) === before, amountOf(await stored(B.p), NET));
    ck('(B, a settings item: the country changed on both, B is asked)', await clash((p, w, t) => setCountry(p, w === 'a' ? 'GB' : 'US', t), 'home.country'));
    const c0 = (await stored(B.p)).home.country.v;
    await undoKind(B.p, 'home.country', /GB|from your other device/, 'a settings item');
    ck('B a settings item: and the value is back as before', (await stored(B.p)).home.country.v === c0, (await stored(B.p)).home.country.v);
    /* a whole copy: a device with its own numbers joins */
    C = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3w2C-')) });
    const own = T.book(); own.schedules[1].name = 'Typed on this one'; own.schedules[1].at = '2026-12-09T09:00:00.000+09:00';
    await C.p.goto(URL); await T.w(300); await seed(C.p, own); await C.p.reload(); await T.w(400);
    await C.p.click('#a3SetGo'); await T.w(200); await C.p.click('#a3CloudHave'); await C.p.type('#a3CloudCode', code); await C.p.click('#a3CloudUse');
    await until(async () => !!(await C.p.$('#a3CloudJoinYes')), 3000); await C.p.click('#a3CloudJoinYes');
    ck('(B, a whole copy: C joined with its own numbers and is asked)', await until(async () => { const k = keptOf(await stored(C.p), 'copy'); return !!k && k.ask; }, 8000));
    await T.w(500);
    const name0 = (await stored(C.p)).schedules[1].name;
    await undoKind(C.p, 'copy', /records/, 'a whole copy');
    ck('B a whole copy: and the money shown is back as before', (await stored(C.p)).schedules[1].name === name0, (await stored(C.p)).schedules[1].name);
    const errs = A.errs.concat(B.errs, C ? C.errs : []).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); if (C) await C.b.close(); await s.close(); }
  T.done('e3_cloudwhich2');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
