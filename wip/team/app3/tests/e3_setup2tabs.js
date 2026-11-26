#!/usr/bin/env node
/* [qc-data-safety confirming run, 26 Nov, blocker 1; M61, M69] Setup on the screens in two tabs of one phone. Tab 1 saves
   Your bank (Main bank 286,000), tab 2 saves Your pay (240,000) and Free to spend (30,000). Before: the setup draft was
   written whole from each tab's own memory, so the last Save wiped the other tab's section with no word ("seq": the bank
   was gone after a reload; "same", all at once: pay and Free to spend were gone). Now each Save writes only its own
   section into the draft as stored, one tab at a time: after a reload both tabs show all three. Made-up yen, 24 Nov. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const DAY = '2026-11-24';
const typeIn = (p, sel, v) => p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const save = (p, sec) => p.$eval(`[data-save=${sec}]`, e => e.click());
const vals = p => p.evaluate(() => ['#s3Bank', '#s3PayAmt', '#s3Free'].map(s => (document.querySelector(s) || {}).value || '').map(v => v.replace(/\D/g, '')).join(','));
async function opened(p) { await p.goto(T.URL0 + '?today=' + DAY); await T.w(700); await p.$eval('#a3SetupGo', e => e.click()); await T.w(500); }
(async () => {
  for (const mode of ['seq', 'same']) {
    const { b, p: p1, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3setup2tabs-') });
    try {
      await opened(p1);
      const p2 = await b.newPage(); await p2.setViewport({ width: 390, height: 844 }); await opened(p2);
      await typeIn(p1, '#s3BankName', 'Main bank'); await typeIn(p1, '#s3Bank', '286000');
      await typeIn(p2, '#s3PayAmt', '240000'); await typeIn(p2, '#s3Free', '30000'); await T.w(400);
      if (mode === 'seq') { await save(p1, 'bank'); await T.w(800); await save(p2, 'pay'); await T.w(800); await save(p2, 'free'); await T.w(800); }
      else { await Promise.all([save(p1, 'bank'), save(p2, 'pay'), save(p2, 'free')]); await T.w(1500); }
      for (const [n, p] of [['tab 1', p1], ['tab 2', p2]]) {
        await p.reload(); await T.w(900);
        if (await p.$('#a3SetupGo')) { await p.$eval('#a3SetupGo', e => e.click()).catch(() => {}); await T.w(500); }
        const v = await vals(p);
        ck(`${mode}: ${n} after a reload holds the bank 286,000, pay 240,000 and Free to spend 30,000`, v === '286000,240000,30000', v);
      }
      ck(mode + ': no page errors', !errs.length, errs.join(' | '));
    } catch (e) { ck(mode + ': the check ran to its end', false, e.stack); }
    finally { await b.close(); }
  }
  T.done('e3_setup2tabs');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
