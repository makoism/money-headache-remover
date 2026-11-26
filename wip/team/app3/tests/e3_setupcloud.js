#!/usr/bin/env node
/* [qc-data-safety run 5 CONFUSING 4, the same loss by another door; M61, M14] A person part way through setup on a new
   phone (Your bank 777,000 and Your pay 100,000 saved, no book yet) remembers they already use the app on another device
   and types the cloud code in Settings. The cloud copy's money arrives. Before: the saved setup answers stayed in the
   device record where nothing showed them again. Now: they are put aside, Settings' kept list has a row for them
   ("Setup answers from before this device joined the cloud copy"), still there after a reload, and the cloud copy's
   money is on Home. Made-up yen, local fake vault. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const typeIn = (p, sel, v) => p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const save = (p, sec) => p.$eval(`[data-save=${sec}]`, e => e.click());
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const device = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { return (await s.getDevice()) || {}; } finally { s.close(); } });
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3scA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3scB-')) });
  try {
    const book = T.book();
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    /* B: part way through setup */
    await B.p.goto(URL); await T.w(700);
    await B.p.$eval('#a3SetupGo', e => e.click()); await T.w(500);
    await typeIn(B.p, '#s3BankName', 'Main bank'); await typeIn(B.p, '#s3Bank', '777000'); await save(B.p, 'bank'); await T.w(500);
    await typeIn(B.p, '#s3PayAmt', '100000'); await save(B.p, 'pay'); await T.w(500);
    ck('(B: Your bank and Your pay saved)', /Saved/.test(await B.p.$eval('[data-saved=bank]', e => e.textContent)) && /Saved/.test(await B.p.$eval('[data-saved=pay]', e => e.textContent)));
    await B.p.$eval('#a3SetupX', e => e.click()); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code: the cloud copy\'s money is here)', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await T.w(800);
    const d = await device(B.p);
    ck('the setup answers are not lost: kept aside whole', !d.setup && Array.isArray(d.setupAside) && d.setupAside.length === 1 && !!(d.setupAside[0].draft.sections || {}).bank && !!(d.setupAside[0].draft.sections || {}).pay, JSON.stringify(d).slice(0, 300));
    await B.p.reload(); await T.w(900);
    await B.p.click('#a3SetGo'); await T.w(500);
    const row = await B.p.$eval('[data-set=aside]', e => e.textContent).catch(() => '');
    ck('after a reload Settings\' kept list shows them: "Setup answers from before this device joined the cloud copy"', /^Setup answers from before this device joined the cloud copy, /.test(row), row);
    const note = await B.p.$eval('[data-set=asidenote]', e => e.textContent).catch(() => '');
    ck('the note above the rows does not say "restore" for a cloud join', !!note && !/before a restore/.test(note), note);
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_setupcloud');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
