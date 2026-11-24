#!/usr/bin/env node
/* Moved with only one account of your own (SORTED K18). The made-up Mako book has one bank and two cards, and money is
   moved only between your own accounts (a bank, cash, an e-wallet), so there is nowhere to move it to. Before, Moved
   showed an empty To list and Save failed. Now Moved shows one line saying a second account is needed first, with no
   To list and no Save, so nothing can fail and nothing is written; Money went out still works after it, with the amount typed before. The app has no
   way to add an account after setup yet (CONTROLS_PLAN), so the line names none; when one exists it goes here.
   At 320 and 390 px. Made-up yen. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const DAY = '2026-11-25';
const bk0 = T.book();
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
(async () => {
  for (const w of [320, 390]) {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3moved1-');
    const { b, p, errs } = await T.open({ profile: prof, w });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk0);
    await p.reload(); await T.w(400);
    const n0 = (await saved(p)).events.length;
    await p.tap('[data-tab="receipts"]'); await T.w(200);
    await p.$eval('#rcAmt', e => { e.value = '3400'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.tap('[data-mode=moved]'); await T.w(200);
    const line = await p.$eval('#rcNoTo', e => ({ text: e.textContent, shown: !e.hidden && e.getBoundingClientRect().height > 0 })).catch(() => null);
    ck(w + ': Moved says a second account is needed first', line && line.shown && line.text === 'Moving money needs a second account of your own, like savings, cash or an e-wallet. You have one, so there is nowhere to move it to yet', JSON.stringify(line));
    ck(w + ': no empty To list', !(await p.$('#rcTo')));
    ck(w + ': no Save to fail', !(await p.$('#rcSave')));
    ck(w + ': nothing written', (await saved(p)).events.length === n0);
    await p.tap('[data-mode=spend]'); await T.w(200);
    ck(w + ': Money went out still has its form and Save', !!(await p.$('#rcSave')) && !(await p.$('#rcNoTo')));
    ck(w + ': the amount typed before is still there', (await p.$eval('#rcAmt', e => e.value)).replace(/\D/g, '') === '3400', await p.$eval('#rcAmt', e => e.value));
    ck(w + ': no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_moved1');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
