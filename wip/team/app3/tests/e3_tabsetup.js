#!/usr/bin/env node
/* [qc-data-safety confirming run 4, 26 Nov, blocker 1; M61, M69] Setup on the screens left open in a second tab of one
   phone after setup was finished in the first. Tab 1 finishes setup (Main bank 286,000, pay 240,000) and sees Home. Tab 2,
   opened on setup before that, then saves a bank of 777,000 and a pay of 100,000 and presses See my money. Before: tab 2's book replaced tab
   1's whole, with no word and no Undo. Now: a page with no book takes in the book another tab made, and setup never
   writes over a book that is there; the finished book stays (286,000 in both tabs, after a reload), and tab 2 says
   setup was finished in another tab. Made-up yen, 24 Nov. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const DAY = '2026-11-24';
const typeIn = (p, sel, v) => p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const save = (p, sec) => p.$eval(`[data-save=${sec}]`, e => e.click());
const bankOnHome = p => T.figs(p).then(f => f.filter(x => x.fig === 'bank').map(x => x.amt));
async function opened(p) { await p.goto(T.URL0 + '?today=' + DAY); await T.w(700); await p.$eval('#a3SetupGo', e => e.click()); await T.w(500); }
(async () => {
  const { b, p: p1, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3tabsetup-') });
  try {
    await opened(p1);
    const p2 = await b.newPage(); await p2.setViewport({ width: 390, height: 844 }); await opened(p2);
    await typeIn(p1, '#s3BankName', 'Main bank'); await typeIn(p1, '#s3Bank', '286000'); await save(p1, 'bank'); await T.w(500);
    await typeIn(p1, '#s3PayAmt', '240000'); await save(p1, 'pay'); await T.w(500);
    for (const sec of ['free', 'min']) { if (await p1.$(`[data-save=${sec}]`)) { await save(p1, sec); await T.w(300); } }
    await p1.$eval('#a3SetupSave', e => e.click()); await T.w(900);
    const err1 = await p1.$eval('#a3SetupErr', e => e.textContent).catch(() => '');
    ck('tab 1 finished setup: Home shows Main bank 286,000', JSON.stringify(await bankOnHome(p1)) === '[286000]', err1 + ' ' + JSON.stringify(await bankOnHome(p1)));
    /* tab 2, still on its setup screens */
    await T.w(500);
    if (await p2.$('#s3Bank')) {
      await typeIn(p2, '#s3BankName', 'Main bank').catch(() => {}); await typeIn(p2, '#s3Bank', '777000').catch(() => {});
      await save(p2, 'bank').catch(() => {}); await T.w(500);
      await typeIn(p2, '#s3PayAmt', '100000').catch(() => {}); await save(p2, 'pay').catch(() => {}); await T.w(500);
      for (const sec of ['free', 'min']) { if (await p2.$(`[data-save=${sec}]`)) { await save(p2, sec).catch(() => {}); await T.w(300); } }
      await p2.$eval('#a3SetupSave', e => e.click()).catch(() => {}); await T.w(900);
    }
    const said = await p2.evaluate(() => document.body.innerText);
    ck('tab 2 says the money was set up in another tab, and that what was typed there was not saved', /Your money was set up in another tab, so this tab shows it now\. What you typed here was not saved/.test(said), said.slice(0, 300));
    /* [qc-data-safety run 5 CONFUSING 2] the line stays until tapped away (a tab in the background is found later) */
    await T.w(4000);
    const later = await p2.evaluate(() => document.body.innerText);
    ck('tab 2: the line is still there 4 s later', /Your money was set up in another tab/.test(later), later.slice(0, 300));
    await p2.evaluate(() => { const x = [...document.querySelectorAll('.burrow-msg button')].find(b => b.textContent === 'Close'); if (x) x.click(); }); await T.w(300);
    ck('tab 2: Close takes the line away', !/Your money was set up in another tab/.test(await p2.evaluate(() => document.body.innerText)));
    ck('tab 2 shows the finished book: Main bank 286,000', JSON.stringify(await bankOnHome(p2)) === '[286000]', JSON.stringify(await bankOnHome(p2)));
    for (const [n, p] of [['tab 1', p1], ['tab 2', p2]]) {
      await p.reload(); await T.w(900);
      ck(`${n} after a reload: Main bank 286,000, never 777,000`, JSON.stringify(await bankOnHome(p)) === '[286000]', JSON.stringify(await bankOnHome(p)));
    }
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the check ran to its end', false, e.stack); }
  finally { await b.close(); }
  /* second case: tab 2 is on the first screen, the setup chat (coordinator 17): it takes in the finished book as soon as
     tab 1 saves it, says so, and a reload of tab 2 shows the same */
  {
    const { b, p: p1, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3tabsetup-') });
    try {
      await opened(p1);
      const p2 = await b.newPage(); await p2.setViewport({ width: 390, height: 844 });
      await p2.goto(T.URL0 + '?today=' + DAY); await T.w(700);
      ck('chat: tab 2 is on the setup chat', !!(await p2.$('#a3Home #a3ChatIn')));
      await typeIn(p1, '#s3BankName', 'Main bank'); await typeIn(p1, '#s3Bank', '286000'); await save(p1, 'bank'); await T.w(500);
      await typeIn(p1, '#s3PayAmt', '240000'); await save(p1, 'pay'); await T.w(500);
      for (const sec of ['free', 'min']) { if (await p1.$(`[data-save=${sec}]`)) { await save(p1, sec); await T.w(300); } }
      await p1.$eval('#a3SetupSave', e => e.click()); await T.w(1500);
      const said = await p2.evaluate(() => document.body.innerText);
      ck('chat: tab 2 says the money was set up in another tab (nothing was typed there, so nothing about typing)', /Your money was set up in another tab, so this tab shows it now/.test(said) && !/What you typed here/.test(said), said.slice(0, 300));
      /* [qc-foundation 1] a start asked after the book was taken in never writes over it, whatever the screens do */
      const st = await p2.evaluate(async () => { const E3 = BurrowApp3.E3, b = JSON.parse(JSON.stringify(E3.book)); b.events = []; const ok = await E3.start(b); return { ok, why: E3.startWhy, evs: E3.book.events.length }; });
      ck('chat: a start after the take-in is refused as there, and the book is kept', st.ok === false && st.why === 'there' && st.evs > 0, JSON.stringify(st));
      ck('chat: tab 2 shows the finished book without a reload', JSON.stringify(await bankOnHome(p2)) === '[286000]', JSON.stringify(await bankOnHome(p2)));
      await p2.reload(); await T.w(900);
      ck('chat: tab 2 after a reload: Main bank 286,000', JSON.stringify(await bankOnHome(p2)) === '[286000]', JSON.stringify(await bankOnHome(p2)));
      ck('chat: no page errors', !errs.length, errs.join(' | '));
    } catch (e) { ck('chat: the check ran to its end', false, e.stack); }
    finally { await b.close(); }
  }
  /* [qc-foundation point 7 on TABSETUP_PLAN] third case: tab 2 is on the setup screens while tab 1, with no book yet,
     restores a backup file. The book the restore wrote is taken in by tab 2, and tab 2's setup never writes over it */
  {
    globalThis.window = globalThis; require('../../store/guard.js'); require('../../store/pack.js');
    const Bk = require('../src/backup3.js'), path = require('path');
    const { b, p: p1, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3tabsetup-') });
    try {
      const tmp = fs.mkdtempSync(os.tmpdir() + '/a3tabbk-'), file = path.join(tmp, 'burrow-backup.json');
      fs.writeFileSync(file, (await Bk.make(T.book())).text);
      const want = JSON.stringify(T.L.lookahead(T.book(), DAY).accounts ? Object.values(T.L.lookahead(T.book(), DAY).accounts).filter(a => a.spendFrom).map(a => a.bank) : []);
      const p2 = await b.newPage(); await p2.setViewport({ width: 390, height: 844 }); await opened(p2);
      await p1.bringToFront(); await p1.goto(T.URL0 + '?today=' + DAY); await T.w(700);
      await p1.click('#a3SetGo'); await T.w(300);
      await (await p1.$('#a3BkFile')).uploadFile(file); await T.w(500);
      await p1.click('#a3BkGo'); await T.w(900);
      ck('restore: tab 1 restored the backup', /Restored/.test(await p1.$eval('#a3SetMsg', e => e.textContent).catch(() => '')));
      await p2.bringToFront();
      if (await p2.$('#s3Bank')) {
        await typeIn(p2, '#s3BankName', 'Main bank').catch(() => {}); await typeIn(p2, '#s3Bank', '777000').catch(() => {});
        await save(p2, 'bank').catch(() => {}); await T.w(500);
        await p2.$eval('#a3SetupSave', e => e.click()).catch(() => {}); await T.w(900);
      }
      const said = await p2.evaluate(() => document.body.innerText);
      /* [qc-data-safety run 5 CONFUSING 3] a restore is said as a restore, never as "set up" and "not saved" */
      ck('restore: tab 2 says a backup was restored in another tab and what was entered here was replaced', /A backup was restored in another tab, so this tab shows it now\. What you had entered here in setup was replaced/.test(said) && !/set up in another tab|was not saved/.test(said), said.slice(0, 300));
      for (const [n, p] of [['tab 1', p1], ['tab 2', p2]]) {
        await p.bringToFront(); await p.goto(T.URL0 + '?today=' + DAY); await T.w(900);
        const got = JSON.stringify(await bankOnHome(p));
        ck(`restore: ${n} after a reload shows the restored book, never 777,000`, !/777000/.test(got) && got === want, got + ' wanted ' + want);
      }
      ck('restore: no page errors', !errs.length, errs.join(' | '));
    } catch (e) { ck('restore: the check ran to its end', false, e.stack); }
    finally { await b.close(); }
  }
  T.done('e3_tabsetup');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
