#!/usr/bin/env node
/* [qc-data-safety run 5, CONFUSING 4; M61, M14, M91] A person part way through setup (Your bank 777,000 and Your pay
   100,000 saved, no book yet) restores a backup file in Settings. Before: the question said only "This puts the money
   from the backup on this device", the saved setup answers stayed in the device record where nothing ever showed them
   again, and there was no Put it back for them. Now: the question names the saved sections and says they are put aside;
   after the restore Settings' kept list has a row for them ("Setup answers from before the restore", with Put it back),
   still there after a reload; Put it back asks first in one line, keeps the backup's money as a whole copy, and opens
   setup with 777,000 and 100,000 back; the backup's money is then in the kept list with its own Put it back, and that
   brings the backup back and puts the answers aside again. Two tabs: a second tab on setup takes in the restored book
   and never writes over it. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
globalThis.window = globalThis;
require('../../store/guard.js'); require('../../store/pack.js');
const B = require('../src/backup3.js');
const DAY = '2026-12-10';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'a3aside-'));
const typeIn = (p, sel, v) => p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const save = (p, sec) => p.$eval(`[data-save=${sec}]`, e => e.click());
const amt = (p, sel) => p.$eval(sel, e => Number(String(e.value).replace(/[^0-9]/g, ''))).catch(() => null);
const bankOnHome = p => T.figs(p).then(f => f.filter(x => x.fig === 'bank').map(x => x.amt));
const msg = p => p.$eval('#a3SetMsg', e => (e.hidden ? '' : e.textContent)).catch(() => '');
const device = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { return (await s.getDevice()) || {}; } finally { s.close(); } });
const stored = (p, key) => p.evaluate(async k => { const s = await BurrowStore.open(); try { if (k === 'book') { const r = await s.load(); return r.copy ? { book: r.copy } : null; } if (k === 'copies') return (await s.keptCopies()).sort((x, y) => (x.id < y.id ? 1 : -1)); return await s.keptCopy(k); } finally { s.close(); } }, key);
const bare = c => { const o = Object.assign({}, c); delete o.rev; delete o.at; if (Array.isArray(o.keptVersions) && !o.keptVersions.length) delete o.keptVersions; return require('../../engine/sync.js').canon(o); };
const shown = (p, sel) => p.$eval(sel, e => !e.hidden).catch(() => false);
async function setupHalf(p) {
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
  await p.$eval('#a3SetupGo', e => e.click()); await T.w(500);
  await typeIn(p, '#s3BankName', 'Main bank'); await typeIn(p, '#s3Bank', '777000'); await save(p, 'bank'); await T.w(500);
  await typeIn(p, '#s3PayAmt', '100000'); await save(p, 'pay'); await T.w(500);
}
(async () => {
  const bk = T.book();
  const file = path.join(tmp, 'backup.json'); fs.writeFileSync(file, (await B.make(bk)).text);
  /* ---- one tab ---- */
  {
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3aside-p-')) });
    try {
      await setupHalf(p);
      ck('setup: Your bank and Your pay are saved', /Saved/.test(await p.$eval('[data-saved=bank]', e => e.textContent)) && /Saved/.test(await p.$eval('[data-saved=pay]', e => e.textContent)));
      await p.$eval('#a3SetupX', e => e.click()); await T.w(400);
      await p.click('#a3SetGo'); await T.w(300);
      await (await p.$('#a3BkFile')).uploadFile(file); await T.w(500);
      const ask = await p.$eval('[data-set=restoreask]', e => e.textContent).catch(() => '');
      ck('the restore question names the saved setup answers and says Put it back brings them back', ask.includes('This puts the money from the backup on this device.') && ask.includes('Your saved setup answers (Your bank, Your pay) are put aside, and Put it back brings them back.'), ask);
      await p.click('#a3BkGo'); await T.w(700);
      ck('restored', /Restored/.test(await msg(p)), await msg(p));
      const d1 = await device(p);
      ck('the setup draft is no longer the open draft, and is kept aside whole', !d1.setup && Array.isArray(d1.setupAside) && d1.setupAside.length === 1 && d1.setupAside[0].draft && d1.setupAside[0].draft.sections && !!d1.setupAside[0].draft.sections.bank && !!d1.setupAside[0].draft.sections.pay, JSON.stringify(d1).slice(0, 400));
      ck('the kept list shows the setup answers row with Put it back', /Setup answers from before the restore, /.test(await p.$eval('[data-set=aside]', e => e.textContent).catch(() => '')) && !!(await p.$('[data-aside] [data-asideback]')));
      await p.click('#a3SetClose'); await T.w(300);
      const homeBank = await bankOnHome(p);
      ck('Home shows the backup\'s money', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)) && homeBank.length > 0 && !homeBank.includes(777000), JSON.stringify(homeBank));
      await p.reload(); await T.w(800);
      ck('after a reload: Home still shows the backup\'s money, setup does not open', JSON.stringify(await bankOnHome(p)) === JSON.stringify(homeBank) && !(await shown(p, '#a3Setup')));
      await p.click('#a3SetGo'); await T.w(400);
      const row = await p.$eval('[data-set=aside]', e => e.textContent).catch(() => '');
      ck('after a reload the kept row is still there', /^Setup answers from before the restore, /.test(row), row);
      await p.click('[data-aside] [data-asideback]'); await T.w(400);
      const q = await p.$eval('[data-set=asideask]', e => e.textContent).catch(() => '');
      ck('Put it back asks first, in one line, and says what happens to the backup\'s money', q === 'Go back to your setup answers (Your bank, Your pay)? The money here now is kept first as a whole copy, with its own Put it back, and setup opens where you left it.', q);
      const restored = await stored(p, 'book');
      ck('nothing changes while it asks', !!restored);
      await p.click('#a3BkAsideGo'); await T.w(900);
      ck('setup opens', await shown(p, '#a3Setup') && !(await shown(p, '#a3Set')));
      ck('setup has Your bank 777,000 back', await amt(p, '#s3Bank') === 777000, await amt(p, '#s3Bank'));
      ck('setup has Your pay 100,000 back', await amt(p, '#s3PayAmt') === 100000, await amt(p, '#s3PayAmt'));
      ck('both sections say Saved', /Saved/.test(await p.$eval('[data-saved=bank]', e => e.textContent)) && /Saved/.test(await p.$eval('[data-saved=pay]', e => e.textContent)));
      ck('no book is kept now', !(await stored(p, 'book')) && !(await p.evaluate(() => !!BurrowApp3.E3.book)));
      const copies = await stored(p, 'copies'), top = copies && copies[0] ? await stored(p, copies[0].id) : null;
      ck('the backup\'s money (as restored here) is kept whole as a copy', !!top && bare(top.copy) === bare(restored.book) && /setup answers/.test(top.why), JSON.stringify((copies || []).map(c => c.why)));
      const d2 = await device(p);
      ck('the answers are the open draft again and no longer aside', !!(d2.setup && d2.setup.sections && d2.setup.sections.bank) && !(d2.setupAside || []).length, JSON.stringify(d2).slice(0, 300));
      await p.reload(); await T.w(900);
      ck('after a reload setup opens again with 777,000 and 100,000', await shown(p, '#a3Setup') && await amt(p, '#s3Bank') === 777000 && await amt(p, '#s3PayAmt') === 100000);
      await p.$eval('#a3SetupX', e => e.click()); await T.w(400);
      await p.click('#a3SetGo'); await T.w(400);
      const kept = await p.$$eval('[data-kept] [data-set=kept]', es => es.map(e => e.textContent));
      ck('the backup\'s money is in the kept list with its own Put it back', kept.some(t => /setup answers were put back/.test(t)) && !!(await p.$('#a3BkBack')), JSON.stringify(kept));
      ck('the setup answers row is gone (they are back in setup)', !(await p.$('[data-aside]')));
      /* M14 the other way: the backup's money back, and the answers aside again */
      await p.click('#a3BkBack'); await T.w(400);
      ck('Put it back of the backup\'s money asks first and names the setup answers', /Your saved setup answers \(Your bank, Your pay\) are put aside, and Put it back brings them back/.test(await p.$eval('[data-set=backask]', e => e.textContent).catch(() => '')), await p.$eval('[data-set=backask]', e => e.textContent).catch(() => ''));
      await p.click('#a3BkBackGo'); await T.w(800);
      ck('the backup\'s money is back', !!(await stored(p, 'book')) && /Put back/.test(await msg(p)), await msg(p));
      ck('and the setup answers are aside again, with their row', ((await device(p)).setupAside || []).length === 1 && !!(await p.$('[data-aside]')));
      ck('no page errors', !errs.length, errs.join(' | '));
    } catch (e) { ck('the one-tab walk ran to its end', false, e.stack); }
    finally { await b.close(); }
  }
  /* ---- two tabs: tab 2 is on setup (it opened the draft), tab 1 restores ---- */
  {
    const { b, p: p1, errs } = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3aside-2-')) });
    try {
      await setupHalf(p1);
      await p1.$eval('#a3SetupX', e => e.click()); await T.w(400);
      const p2 = await b.newPage(); await p2.setViewport({ width: 390, height: 844 });
      await p2.goto(T.URL0 + '?today=' + DAY); await T.w(900);
      ck('two tabs: tab 2 opens on setup with the saved answers', await shown(p2, '#a3Setup') && await amt(p2, '#s3Bank') === 777000);
      await p1.bringToFront(); await p1.click('#a3SetGo'); await T.w(300);
      await (await p1.$('#a3BkFile')).uploadFile(file); await T.w(500);
      await p1.click('#a3BkGo'); await T.w(1200);
      const want = JSON.stringify(await (async () => { await p1.click('#a3SetClose'); await T.w(300); return bankOnHome(p1); })());
      ck('two tabs: tab 2 takes in the restored book and leaves setup', !(await shown(p2, '#a3Setup')) && JSON.stringify(await bankOnHome(p2)) === want, JSON.stringify(await bankOnHome(p2)) + ' vs ' + want);
      await p2.bringToFront(); await p2.reload(); await T.w(900);
      ck('two tabs: after a reload tab 2 shows the backup\'s money, never 777,000', JSON.stringify(await bankOnHome(p2)) === want);
      ck('two tabs: the setup answers are still aside', ((await device(p1)).setupAside || []).length === 1);
      /* tab 1 brings the answers back: tab 2 has no book any more, and a reload there opens setup with them */
      await p1.bringToFront(); await p1.click('#a3SetGo'); await T.w(400);
      await p1.click('[data-aside] [data-asideback]'); await T.w(300); await p1.click('#a3BkAsideGo'); await T.w(1200);
      ck('two tabs: tab 1 is on setup with 777,000', await shown(p1, '#a3Setup') && await amt(p1, '#s3Bank') === 777000);
      await p2.bringToFront(); await p2.reload(); await T.w(900);
      ck('two tabs: tab 2 after a reload opens setup with 777,000 and 100,000', await shown(p2, '#a3Setup') && await amt(p2, '#s3Bank') === 777000 && await amt(p2, '#s3PayAmt') === 100000);
      ck('two tabs: no page errors', !errs.length, errs.join(' | '));
    } catch (e) { ck('the two-tab walk ran to its end', false, e.stack); }
    finally { await b.close(); }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  T.done('e3_setupaside');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
