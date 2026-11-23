#!/usr/bin/env node
/* Settings and the backup file through the page, made-up Mako book (DECISIONS_ROUND2 D2, D5, D6, D7, BE3).
   Try book: Settings shows the currency and says nothing is saved; no backup controls; nothing written.
   Kept book: the storage line is shown; Save a backup file downloads burrow-backup-<day>.json, which reads back as the same
   book; a locked one needs its code (a short code is refused first). Restoring a different backup asks first, keeps the
   copy here whole, replaces the book, and survives a reload; Put it back brings the kept copy back. A copy saved by a
   newer version and an old app backup are refused and change nothing. A device with nothing restores a backup as its way
   in. The old app's copies never change; no outside requests; no page errors. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
globalThis.window = globalThis;
require('../../store/guard.js'); require('../../store/pack.js');
const B = require('../src/backup3.js');
const DAY = '2026-12-10';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'a3bk-'));
const fileOf = (name, text) => { const f = path.join(tmp, name); fs.writeFileSync(f, text); return f; };
/* the book kept through the store (store/idb.js), as the page keeps it */
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
/* 'book': { book } as stored; 'copies': the kept whole copies, newest first; 'copy:...': one kept copy */
const stored = (p, key) => p.evaluate(async k => { const s = await BurrowStore.open(); try { if (k === 'book') { const r = await s.load(); return r.copy ? { book: r.copy } : null; } if (k === 'copies') return (await s.keptCopies()).sort((x, y) => (x.id < y.id ? 1 : -1)); return await s.keptCopy(k); } finally { s.close(); } }, key);
/* a copy without what the store adds when it saves (its own revision and save time) */
const bare = c => { const o = Object.assign({}, c); delete o.rev; delete o.at; if (Array.isArray(o.keptVersions) && !o.keptVersions.length) delete o.keptVersions; return require('../../engine/sync.js').canon(o); };   // records compared by id, in any order
const msg = p => p.$eval('#a3SetMsg', e => (e.hidden ? '' : e.textContent));
async function download(p, dir, click) {
  const before = new Set(fs.readdirSync(dir));
  await click();
  for (let i = 0; i < 50; i++) { await T.w(100); const f = fs.readdirSync(dir).filter(x => !before.has(x) && !x.endsWith('.crdownload')); if (f.length) return path.join(dir, f[0]); }
  return null;
}
(async () => {
  const bk = T.book();
  /* ---- try book ---- */
  {
    const { b, p, errs } = await T.open();
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(300);
    await p.click('#a3SetGo'); await T.w(200);
    ck('try book: Settings opens over Home', !(await p.$eval('#a3Set', e => e.hidden)) && await p.$eval('#a3Home', e => e.hidden));
    ck('try book: the currency is shown', await p.$eval('[data-set=cur]', e => e.textContent) === 'JPY');
    ck('try book: it says nothing is saved, and has no backup or cloud controls', !!(await p.$('[data-set=trynote]')) && !(await p.$('#a3BkSave')) && !(await p.$('[data-card=cloud]')));
    await p.keyboard.press('Escape'); await T.w(100);
    ck('Escape closes it and Home is back', await p.$eval('#a3Set', e => e.hidden) && !(await p.$eval('#a3Home', e => e.hidden)));
    const dbs = await p.evaluate(() => indexedDB.databases().then(d => d.map(x => x.name)));
    ck('try book: nothing written', !dbs.includes('burrow3'), dbs.join(','));
    ck('no page errors (try)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- kept book ---- */
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'a3prof-')), dl = fs.mkdtempSync(path.join(os.tmpdir(), 'a3dl-'));
  {
    const { b, p, errs, requests } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await T.seedOld(p); await seed(p, bk);
    await p.reload(); await T.w(400);
    const cdp = await p.createCDPSession(); await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
    await p.click('#a3SetGo'); await T.w(300);
    ck('the storage line says what this device keeps', /device|browser/.test(await p.$eval('#a3Space', e => e.textContent)), await p.$eval('#a3Space', e => e.textContent));
    // a plain backup
    const f1 = await download(p, dl, () => p.click('#a3BkSave'));
    ck('Save a backup file downloads burrow-backup-<day>.json', !!f1 && path.basename(f1) === 'burrow-backup-' + DAY + '.json', f1);
    const r1 = f1 ? await B.read(new File([fs.readFileSync(f1)], 'x.json')) : { ok: false };
    ck('the file reads back as the same book', r1.ok && bare(r1.copy) === bare(bk));
    ck('the page says where it went', /Saved burrow-backup/.test(await msg(p)));
    // a locked backup
    await p.click('#a3BkLock'); await p.type('#a3BkCode', 'abc'); await p.click('#a3BkSave'); await T.w(200);
    ck('a code shorter than 6 is refused', /at least 6/.test(await msg(p)));
    await p.$eval('#a3BkCode', e => { e.value = ''; }); await p.type('#a3BkCode', 'acorn tree 7');
    fs.rmSync(f1);
    const f2 = await download(p, dl, () => p.click('#a3BkSave'));
    const env2 = f2 ? JSON.parse(fs.readFileSync(f2, 'utf8')) : {};
    ck('a locked backup is encrypted', env2.enc === 'aes-gcm' && !!env2.kdf);
    const locked = fileOf('locked.json', fs.readFileSync(f2));
    // a different book, to restore
    const other = JSON.parse(JSON.stringify(bk)); other.schedules[0].name = 'Main job (from backup)';
    const otherFile = fileOf('other.json', (await B.make(other)).text);
    await (await p.$('#a3BkFile')).uploadFile(otherFile); await T.w(400);
    ck('restoring asks first and says what is here is kept', /replaces the money on this device.*kept/.test(await p.$eval('[data-set=restoreask]', e => e.textContent)));
    await p.click('#a3BkGo'); await T.w(500);
    ck('restored', /Restored/.test(await msg(p)));
    ck('the book is the backup now', (await stored(p, 'book')).book.schedules[0].name === 'Main job (from backup)');
    const copies = await stored(p, 'copies');
    const kept = copies && copies[0] ? await stored(p, copies[0].id) : null;
    ck('the copy that was here is kept whole first [D2]', !!kept && bare(kept.copy) === bare(bk), JSON.stringify(copies));
    ck('Put it back is offered', !!(await p.$('#a3BkBack')));
    // a locked file: asks the code
    await (await p.$('#a3BkFile')).uploadFile(locked); await T.w(400);
    ck('a locked file asks for its code', !!(await p.$('#a3BkOpen')));
    await p.type('#a3BkOpen', 'wrong code'); await p.click('#a3BkOpenGo'); await p.waitForFunction(() => /code/.test((document.getElementById('a3BkOpenErr') || {}).textContent || ''), { timeout: 8000 }).catch(() => {});
    ck('a wrong code is said', /could not be opened with this code/.test(await p.$eval('#a3BkOpenErr', e => e.textContent)));
    await p.$eval('#a3BkOpen', e => { e.value = ''; }); await p.type('#a3BkOpen', 'acorn tree 7'); await p.click('#a3BkOpenGo'); await p.waitForSelector('#a3BkGo', { timeout: 8000 }).catch(() => {});
    ck('the right code opens it and asks before restoring', !!(await p.$('#a3BkGo')), await p.$eval('#a3BkAsk', e => e.innerHTML) + ' / ' + await msg(p));
    await p.click('#a3BkNo'); await T.w(100);
    ck('Cancel changes nothing', (await stored(p, 'book')).book.schedules[0].name === 'Main job (from backup)');
    // refused files
    const newer = fileOf('newer.json', (await B.make(Object.assign({}, bk, { v: 4 }))).text);
    await (await p.$('#a3BkFile')).uploadFile(newer); await T.w(400);
    ck('a copy saved by a newer version is refused', /newer version/.test(await msg(p)) && (await stored(p, 'book')).book.schedules[0].name === 'Main job (from backup)');
    const oldApp = fileOf('old.json', T.OLD_TEXT);
    await (await p.$('#a3BkFile')).uploadFile(oldApp); await T.w(400);
    ck('an old app backup is refused: version one starts empty', /old app/.test(await msg(p)) && !(await p.$('#a3BkGo')));
    // put it back
    await p.click('#a3BkBack'); await T.w(600);
    ck('Put it back brings the kept copy back', (await stored(p, 'book')).book.schedules[0].name === bk.schedules[0].name && /Put back/.test(await msg(p)));
    await p.click('#a3SetClose'); await T.w(200);
    await p.reload(); await T.w(400);
    ck('Home draws after a reload', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
    const old = await T.readOld(p);
    ck('the old app\'s copies are byte for byte the same', old.ls === T.OLD_TEXT && old.idb === T.OLD_IDB);
    ck('no outside requests', requests.length === 0, requests.join(' '));
    ck('no page errors (kept)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- a device with nothing: a backup is a way in ---- */
  {
    const { b, p, errs } = await T.open();
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.click('#a3SetGo'); await T.w(200);
    ck('with nothing here, Save is off and Restore is offered', await p.$eval('#a3BkSave', e => e.disabled) && !!(await p.$('#a3BkLoad')));
    await (await p.$('#a3BkFile')).uploadFile(fileOf('fresh.json', (await B.make(bk)).text)); await T.w(400);
    ck('it says it puts the money from the backup here', /puts the money from the backup on this device/.test(await p.$eval('[data-set=restoreask]', e => e.textContent)));
    await p.click('#a3BkGo'); await T.w(500);
    await p.click('#a3SetClose'); await T.w(200);
    ck('Home shows the restored book', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
    await p.reload(); await T.w(400);
    ck('and keeps it after a reload', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
    ck('no page errors (fresh)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(dl, { recursive: true, force: true });
  T.done('e3_backup');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
