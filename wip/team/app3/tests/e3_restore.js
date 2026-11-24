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
    ck('before the restore it says in one line that money logged after the backup goes on every device, and how to get it back', ask.includes('Anything you logged after this backup was made goes, on every device: 7 things here now are not in it (money in or out: 6, bank checks: 1). Put it back brings it back.'), ask);
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

    /* ---- Put it back on A: the same words, it asks first with what goes and how to get it back, and B follows ---- */
    // after the restore A checks the bank again: one bank figure added since the copy was kept, and the 6 pays and bills that check ticks differ from the kept ones
    await A.p.click('#a3CheckGo'); await T.w(300);
    await A.p.tap('[data-bankfig]'); await A.p.keyboard.type('300,000');
    await A.p.click('#a3CheckSave'); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(300);
    ck('Put it back says the other devices follow too', (await A.p.$eval('#a3BkKept', e => e.textContent)).includes(OTHERS));
    const evs = async () => JSON.stringify((await stored(A.p)).events.map(e => [e.id, !!e.gone]));
    const bookWas = await evs();
    await A.p.click('#a3BkBack'); await T.w(400);
    const backAsk = await A.p.$eval('[data-set=backask]', e => e.textContent).catch(() => '');
    ck('Put it back asks first: one line with how many things logged since go, on every device, and how to get them back',
      backAsk === 'Put this copy back? 1 thing added since it was kept goes (bank checks: 1), and 6 things changed since go back to how they were, on every device after the next send. What is here now is kept first, and its own Put it back brings them back.', backAsk);
    ck('nothing has changed while it asks', (await evs()) === bookWas && !/Put back/.test(await A.p.$eval('#a3SetMsg', e => e.textContent)));
    await A.p.click('#a3BkBackNo').catch(() => {}); await T.w(200);
    ck('Cancel changes nothing and the question goes', (await evs()) === bookWas && !(await A.p.$('[data-set=backask]')));
    await A.p.click('#a3BkBack'); await T.w(300);
    await A.p.click('#a3BkBackGo').catch(() => {}); await T.w(500);
    ck('put back', /Put back/.test(await A.p.$eval('#a3SetMsg', e => e.textContent)));
    ck('the bank check logged since is marked gone, not deleted', (await stored(A.p)).events.some(e => e.k === 'check' && e.a === 300000 && e.gone));
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
    ck('and says money logged after that version goes on every device, and how to get it back', (await A.p.$eval('[data-cloud=verask]', e => e.textContent)).includes('Anything you logged after this version was sent goes, on every device. Put it back brings it back.'));
    await A.p.click('#a3CloudVerGo');
    ck('restored from the cloud\'s earlier copy, the copy here kept first', await until(async () => /earlier copy/.test(await A.p.$eval('#a3SetMsg', e => e.textContent))) && !!(await A.p.$('#a3BkBack')), await A.p.$eval('#a3SetMsg', e => e.textContent) + ' / ' + A.errs.join(' / '));
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

    /* ---- many restores: every kept copy is listed with its own Put it back and time, and the copy from before the
       first restore stays (pinned) until the person drops it, past the store's 5 ---- */
    await A.p.click('#a3SetGo'); await T.w(300);
    for (let i = 0; i < 6; i++) {
      await A.p.$eval('#a3BkFile', e => { e.value = ''; }); await (await A.p.$('#a3BkFile')).uploadFile(backupFile); await A.p.waitForSelector('#a3BkGo', { timeout: 8000 });
      await A.p.click('#a3BkGo'); await until(async () => /Restored/.test(await A.p.$eval('#a3SetMsg', e => e.textContent)));
      await A.p.$eval('#a3SetMsg', e => { e.textContent = ''; }); await T.w(150);
    }
    const rows = await A.p.$$eval('[data-kept]', ls => ls.map(l => ({ pin: l.dataset.pin === '1', text: l.textContent, back: !!l.querySelector('[data-back]') })));
    ck('every kept copy is listed, each with its own Put it back and time', rows.length >= 6 && rows.every(r => r.back && /\d\d:\d\d/.test(r.text)), JSON.stringify(rows).slice(0, 400));
    ck('the copy from before the first restore is still there, pinned, after six more restores', rows.filter(r => r.pin).length === 1 && /Before a backup was restored/.test(rows.find(r => r.pin).text), JSON.stringify(rows.filter(r => r.pin)));
    await A.p.click('[data-kept][data-pin="1"] [data-back]'); await T.w(300);
    ck('with nothing logged since, it still asks, and says so', /^Put this copy back\? Nothing was added/.test(await A.p.$eval('[data-set=backask]', e => e.textContent).catch(() => '')), await A.p.$eval('#a3BkKept', e => e.textContent));
    await A.p.click('#a3BkBackGo').catch(() => {});
    ck('its Put it back brings back the money from before the first restore', await until(async () => /Put back/.test(await A.p.$eval('#a3SetMsg', e => e.textContent))));
    await A.p.click('#a3SetClose'); await T.w(300);
    ck('A shows the figures from before the first restore', await homeFigs(A.p) === figs1, await homeFigs(A.p));
    await A.p.click('#a3SetGo'); await T.w(300);
    ck('it stays pinned after it was put back, until dropped', !!(await A.p.$('[data-kept][data-pin="1"] [data-drop]')));
    // A restores the backup once more, so the pinned copy holds the bank check (339,000) that the money here now lacks
    await A.p.$eval('#a3BkFile', e => { e.value = ''; }); await (await A.p.$('#a3BkFile')).uploadFile(backupFile); await A.p.waitForSelector('#a3BkGo', { timeout: 8000 });
    await A.p.click('#a3BkGo'); await until(async () => /Restored/.test(await A.p.$eval('#a3SetMsg', e => e.textContent))); await T.w(200);
    const pinText = await A.p.$eval('[data-kept][data-pin="1"] [data-set=kept]', e => e.textContent);
    const rowsWas = (await A.p.$$('[data-kept]')).length;
    await A.p.click('[data-kept][data-pin="1"] [data-drop]'); await T.w(300);
    const dropAsk = await A.p.$eval('[data-set=dropask]', e => e.textContent).catch(() => '');
    ck('Drop it asks first: one line with what goes and how to get it back',
      dropAsk === 'Drop this copy? It is the only copy of the money from before your first restore, with 7 things that are not in the money here now (money in or out: 6, bank checks: 1). Undo brings it back while Settings stays open, and after that nothing can.', dropAsk);
    ck('nothing is dropped while it asks', !!(await A.p.$('[data-kept][data-pin="1"]')));
    await A.p.click('#a3BkDropNo').catch(() => {}); await T.w(200);
    ck('Cancel keeps it and the question goes', !!(await A.p.$('[data-kept][data-pin="1"]')) && !(await A.p.$('[data-set=dropask]')));
    await A.p.click('[data-kept][data-pin="1"] [data-drop]'); await T.w(300);
    await A.p.click('#a3BkDropGo').catch(() => {});
    ck('Drop it removes it from the list', await until(async () => !(await A.p.$('[data-kept][data-pin="1"]'))));
    ck('and offers Undo', !!(await A.p.$('#a3BkUndrop')) && /Dropped/.test(await A.p.$eval('[data-set=dropped]', e => e.textContent).catch(() => '')));
    await A.p.click('#a3BkUndrop').catch(() => {});
    ck('Undo brings the dropped copy back as it was: pinned, with its own time', await until(async () => !!(await A.p.$('[data-kept][data-pin="1"]'))) && (await A.p.$eval('[data-kept][data-pin="1"] [data-set=kept]', e => e.textContent)) === pinText && !(await A.p.$('#a3BkUndrop')), pinText);
    const rowsNow = (await A.p.$$('[data-kept]')).length;
    ck('and no other kept copy went for it', rowsNow === rowsWas, rowsNow + ' of ' + rowsWas);
    await A.p.click('[data-kept][data-pin="1"] [data-back]'); await T.w(300); await A.p.click('#a3BkBackGo').catch(() => {});
    ck('the copy that was dropped and brought back still puts the money back', await until(async () => /Put back/.test(await A.p.$eval('#a3SetMsg', e => e.textContent))) && (await stored(A.p)).events.some(e => e.k === 'check' && e.a === 339000 && !e.gone));
    await A.p.click('[data-kept][data-pin="1"] [data-drop]'); await T.w(300); await A.p.click('#a3BkDropGo').catch(() => {});
    ck('dropped again, it is gone from the list', await until(async () => !(await A.p.$('[data-kept][data-pin="1"]'))));
    await A.p.click('#a3SetClose'); await T.w(200);

    const outside = A.requests.concat(B.requests).filter(r => !own(r));
    ck('every request went to the page\'s own address', outside.length === 0, outside.join(' '));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  T.done('e3_restore');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
