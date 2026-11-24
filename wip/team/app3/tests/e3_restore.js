#!/usr/bin/env node
/* A backup restored while the cloud copy is on, through the page, two devices, the made-up Mako book, the local fake vault
   (tests/fake_vault.js), never the real server (FOR_MAKO "Open: a restore while the cloud copy is on"; src/backup3.js
   restamp).
   A and B share the cloud copy. A saves a backup file, then checks the bank (339,000) and logs nothing else; B takes it.
   A restores the backup: before, it says the restore replaces what is on the other devices too after the next send; the
   copy here is kept first. A sends; B takes it and Home shows exactly the figures of the backup. Put it back on A says the
   same, brings back what was there, and B takes that too. No outside requests, no page errors. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
globalThis.window = globalThis;
require('../../store/guard.js'); require('../../store/pack.js');
const Bk = require('../src/backup3.js');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const book = T.book();
const OTHERS = 'This replaces what is on your other devices too after the next send.';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
/* Home's figures, by name and amount */
const homeFigs = async p => JSON.stringify((await T.figs(p)).filter(f => f.amt !== null).map(f => [f.fig, f.card, f.amt]));
(async () => {
  const vault = makeVault();
  const s = await serve(vault, () => fs.readFileSync(path.join(__dirname, '../index.html')));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const own = r => r.startsWith(`http://127.0.0.1:${s.port}/`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'a3rs-'));
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3rA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3rB-')) });
  const rev = () => vault.rows.values().next().value.rev;
  try {
    /* ---- A turns the cloud copy on, B uses the code ---- */
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200);
    await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('A sends its copy', await until(async () => vault.rows.size === 1 && /^On\./.test(await A.p.$eval('#a3CloudState', e => e.textContent))));
    await A.p.click('#a3SetClose'); await T.w(200);
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200);
    await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('B takes the cloud copy', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await B.p.click('#a3SetClose'); await T.w(300);
    const figs0 = await homeFigs(A.p);
    ck('both show the same figures to start', figs0 === await homeFigs(B.p) && figs0.length > 10, figs0);

    /* ---- A saves a backup file (the book as it is now), then checks the bank; B takes the check ---- */
    const backupFile = path.join(tmp, 'burrow-backup.json');
    fs.writeFileSync(backupFile, (await Bk.make(await stored(A.p))).text);
    const r0 = rev();
    await A.p.click('#a3CheckGo'); await T.w(300);
    await A.p.tap('[data-bankfig]'); await A.p.keyboard.type('339,000');
    await A.p.click('#a3CheckSave'); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudNow');
    ck('A sends the bank check', await until(() => rev() > r0));
    await B.p.reload(); await T.w(300);
    ck('B takes it: the bank figure A typed', await until(async () => { const f = await T.figs(B.p); const b = f.find(x => x.fig === 'bank'); return !!b && b.amt === 339000; }));
    const figs1 = await homeFigs(B.p);
    ck('the figures moved', figs1 !== figs0);

    /* ---- A restores the backup: told first that the other devices follow ---- */
    await (await A.p.$('#a3BkFile')).uploadFile(backupFile); await T.w(400);
    const ask = await A.p.$eval('[data-set=restoreask]', e => e.textContent);
    ck('before the restore it says the other devices are replaced too after the next send', ask.includes(OTHERS), ask);
    await A.p.click('#a3BkGo'); await T.w(500);
    ck('restored', /Restored/.test(await A.p.$eval('#a3SetMsg', e => e.textContent)));
    const r1 = rev();
    await A.p.click('#a3CloudNow');
    ck('A sends the restored copy', await until(() => rev() > r1));
    await A.p.click('#a3SetClose'); await T.w(300);
    ck('A\'s Home shows the figures of the backup', await homeFigs(A.p) === figs0, await homeFigs(A.p));
    await B.p.reload(); await T.w(300);
    ck('B takes it and shows exactly the figures of the backup', await until(async () => await homeFigs(B.p) === figs0), await homeFigs(B.p));
    const bBook = await stored(B.p);
    ck('the bank check made after the backup is gone on B, kept as a gone record', bBook.events.filter(e => e.k === 'check' && e.a === 339000).every(e => e.gone) && bBook.events.some(e => e.k === 'check' && e.a === 339000));

    /* ---- Put it back on A: the same words, and B follows ---- */
    await A.p.click('#a3SetGo'); await T.w(300);
    ck('Put it back says the other devices follow too', (await A.p.$eval('[data-set=kept]', e => e.textContent)).includes(OTHERS));
    await A.p.click('#a3BkBack'); await T.w(500);
    ck('put back', /Put back/.test(await A.p.$eval('#a3SetMsg', e => e.textContent)));
    const r2 = rev();
    await A.p.click('#a3CloudNow');
    ck('A sends what it put back', await until(() => rev() > r2));
    await A.p.click('#a3SetClose'); await T.w(300);
    ck('A shows what was there before the restore', await homeFigs(A.p) === figs1, await homeFigs(A.p));
    await B.p.reload(); await T.w(300);
    ck('B takes it too: the figures from before the restore', await until(async () => await homeFigs(B.p) === figs1), await homeFigs(B.p));

    /* ---- the cloud's earlier versions: listed in Settings, the oldest restored, and B follows ---- */
    await A.p.click('#a3SetGo'); await T.w(300);
    await A.p.click('#a3CloudVers');
    ck('Earlier versions lists the copies the cloud keeps, newest first', await until(async () => (await A.p.$$('[data-cloudver]')).length >= 3));
    const vers = await A.p.$$eval('[data-cloudver]', ls => ls.map(l => +l.dataset.cloudver));
    ck('each with its own revision, newest first', vers.every((v, i) => i === 0 || v < vers[i - 1]), vers.join(','));
    ck('the list says the other devices follow too', (await A.p.$eval('[data-cloud=versions]', e => e.textContent)).includes(OTHERS));
    await A.p.click(`[data-cloudver="${vers[vers.length - 1]}"] button`);
    ck('restoring one asks first, with the same words', await until(async () => !!(await A.p.$('#a3CloudVerGo'))) && (await A.p.$eval('[data-cloud=verask]', e => e.textContent)).includes(OTHERS));
    await A.p.click('#a3CloudVerGo');
    ck('restored from the cloud\'s earlier copy, the copy here kept first', await until(async () => /earlier copy/.test(await A.p.$eval('#a3SetMsg', e => e.textContent))) && !!(await A.p.$('#a3BkBack')));
    const r3 = rev();
    await A.p.click('#a3CloudNow');
    ck('A sends it', await until(() => rev() > r3));
    await A.p.click('#a3SetClose'); await T.w(300);
    ck('A shows the figures of the first copy sent', await homeFigs(A.p) === figs0, await homeFigs(A.p));
    await B.p.reload(); await T.w(300);
    ck('B takes it too', await until(async () => await homeFigs(B.p) === figs0), await homeFigs(B.p));

    /* ---- kept copies are listed by moment, not by their id as text (each `at` carries its own offset) ---- */
    {
      await A.p.evaluate(async () => {
        const db = await new Promise((ok, no) => { const q = indexedDB.open('burrow3'); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
        await new Promise((ok, no) => { const tx = db.transaction(['kept'], 'readwrite'), k = tx.objectStore('kept');
          k.put({ id: 'copy:2030-01-01T10:00:00.000+09:00', why: 'Tokyo 10:00', at: '2030-01-01T10:00:00.000+09:00', copy: { events: [] } });
          k.put({ id: 'copy:2030-01-01T02:00:00.000-05:00', why: 'New York 02:00 (16:00 in Tokyo)', at: '2030-01-01T02:00:00.000-05:00', copy: { events: [] } });
          tx.oncomplete = ok; tx.onerror = () => no(tx.error); });
        db.close();
      });
      await A.p.click('#a3SetGo'); await T.w(400);
      const first = await A.p.$eval('[data-set=kept]', e => e.textContent);
      ck('kept copies are listed newest first by moment, whatever the offset', /^New York 02:00/.test(first), first);
      await A.p.click('#a3SetClose'); await T.w(200);
    }

    const outside = A.requests.concat(B.requests).filter(r => !own(r));
    ck('every request went to the page\'s own address', outside.length === 0, outside.join(' '));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  T.done('e3_restore');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
