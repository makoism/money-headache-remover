#!/usr/bin/env node
/* A spend larger than the account it comes from asks first (north star F5: a typo of 120,012,000 saved with no
   question). Made-up yen, set up Mon 23 Nov 2026 with Main bank 320,000 and pay on the 25th.
   - 12,000 from Main bank: saved with no question;
   - changed to 120,012,000: "That is more than Main bank holds (¥320,000). Save it anyway?" (what it holds without
     that spend); nothing is saved until the person says so; "Change the amount" keeps the form; 1,200 then saves;
   - a new 400,000: asks with ¥318,800 (320,000 less the 1,200); "Save it anyway" saves it. */
'use strict';
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const T = require('./lib3.js'), { ck } = T;
const typeIn = async (p, sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, String(v)); };
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
const spends = async p => (await saved(p)).events.filter(e => e.k === 'spend' && !e.gone).map(e => e.a);
const ask = p => p.evaluate(() => { const a = document.getElementById('rcAsk'); return a && !a.hidden ? a.innerText.replace(/⁠/g, '').replace(/\s+/g, ' ').trim() : null; });
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3big-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=2026-11-23'); await T.w(400);
  await p.click('#a3SetupGo'); await T.w(300);
  await typeIn(p, '#s3Bank', '320000'); await typeIn(p, '#s3PayAmt', '250000'); await p.select('#s3PayDay', '25');
  await finishSetup3(p); await T.w(700);
  await p.click('#a3LogGo'); await T.w(300);
  await typeIn(p, '#rcAmt', '12000'); await p.click('#rcSave'); await T.w(500);
  ck('12,000 is saved with no question', JSON.stringify(await spends(p)) === '[12000]' && (await ask(p)) === null, JSON.stringify(await spends(p)));
  const id = (await saved(p)).events.find(e => e.k === 'spend').id;
  await p.click(`[data-rc="${id}"] button`); await T.w(300);
  await typeIn(p, '#rcAmt', '120012000'); await p.click('#rcSave'); await T.w(500);
  ck('changed to 120,012,000: it asks first, naming what Main bank holds without it', (await ask(p)) === 'That is more than Main bank holds (¥320,000). Save it anyway? Save it anyway Change the amount', await ask(p));
  ck('nothing is saved yet', JSON.stringify(await spends(p)) === '[12000]', JSON.stringify(await spends(p)));
  await p.click('#rcAskNo'); await T.w(300);
  ck('"Change the amount" keeps the form with what was typed, and saves nothing', (await ask(p)) === null && (await p.$eval('#rcAmt', e => e.value)).replace(/,/g, '') === '120012000' && JSON.stringify(await spends(p)) === '[12000]');
  await typeIn(p, '#rcAmt', '1200'); await p.click('#rcSave'); await T.w(500);
  ck('1,200 saves with no question', JSON.stringify(await spends(p)) === '[1200]' && (await ask(p)) === null, JSON.stringify(await spends(p)));
  await typeIn(p, '#rcAmt', '400000'); await p.click('#rcSave'); await T.w(500);
  ck('a new 400,000 asks, with what Main bank holds now', (await ask(p)) === 'That is more than Main bank holds (¥318,800). Save it anyway? Save it anyway Change the amount', await ask(p));
  ck('typing again takes the question away', await (async () => { await p.type('#rcAmt', '0'); await T.w(200); const gone = (await ask(p)) === null; await typeIn(p, '#rcAmt', '400000'); return gone; })());
  await p.click('#rcSave'); await T.w(500);
  await p.click('#rcAskYes'); await T.w(500);
  ck('"Save it anyway" saves it', JSON.stringify((await spends(p)).sort()) === JSON.stringify([1200, 400000].sort()) && (await ask(p)) === null, JSON.stringify(await spends(p)));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_bigspend');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
