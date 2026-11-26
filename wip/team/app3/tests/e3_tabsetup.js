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
    ck('tab 2 says setup was finished in another tab', /Setup was finished in another tab/.test(said), said.slice(0, 300));
    ck('tab 2 shows the finished book: Main bank 286,000', JSON.stringify(await bankOnHome(p2)) === '[286000]', JSON.stringify(await bankOnHome(p2)));
    for (const [n, p] of [['tab 1', p1], ['tab 2', p2]]) {
      await p.reload(); await T.w(900);
      ck(`${n} after a reload: Main bank 286,000, never 777,000`, JSON.stringify(await bankOnHome(p)) === '[286000]', JSON.stringify(await bankOnHome(p)));
    }
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the check ran to its end', false, e.stack); }
  finally { await b.close(); }
  T.done('e3_tabsetup');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
