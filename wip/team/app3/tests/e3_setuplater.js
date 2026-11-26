#!/usr/bin/env node
/* Setup on the screens says where loans, goals and budget lines are added (qc-controls run 1 blocker 2, coordinator
   16's ruling B; M13): setup has no step for them, so its last step says they are added on Plan, naming the buttons. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
(async () => {
  for (const w of [390, 1300]) {
    const { b, p, errs } = await T.open({ w });
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(300);
    await p.click('#a3SetupGo'); await T.w(300);
    const later = await p.$eval('#a3Setup [data-hint=later]', e => e.textContent).catch(() => '');
    ck(w + ': setup says loans, goals and budget lines are added on Plan, with the buttons', /Loans, goals and budget lines/.test(later) && /Plan/.test(later) && /Add a loan/.test(later) && /Add a goal/.test(later) && /Add a line/.test(later), later);
    const order = await p.evaluate(() => { const h = document.querySelector('#a3Setup [data-hint=later]'), s = document.querySelector('#a3SetupSave'); return !!h && !!s && !!(h.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING); });
    ck(w + ': it is just before See my money', order);
    ck(w + ': no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_setuplater');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
