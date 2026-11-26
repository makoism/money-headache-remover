#!/usr/bin/env node
/* [qc-north-star on the AI-first candidate, B1 to B3] Made-up yen, set up 1 Dec 2026: Main bank 300,000, pay 250,000
   on the 10th, no Free to spend; opened 3 Dec.
   B1. Home's first card for a person with no Free to spend ("Add your everyday spending") has a "?" that says what Free
       to spend is, never the status card's general words ("How things stand today, in one line").
   B2. A bank check (Main 100,000) leaves its Undo bar; a backup restored after it clears that bar, so no Undo is left
       on screen for a check the restore took away.
   B3. At 320 wide the chat box shows its whole placeholder: nothing is cut off. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const DAY = '2026-12-03';
const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js');
const book = () => B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00+09:00', country: 'JP', currency: 'JPY',
  banks: [{ key: 'b', name: 'Main bank', amount: 300000 }],
  pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: 250000, day: 10, shift: 'none', startsPeriod: true }], bills: [] }, { newId: I.idMaker('nsfixbk', () => 0.3) }).book;
async function load(o, bk) {
  await o.p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await o.p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk);
  await o.p.reload(); await T.w(500);
}
(async () => {
  const bk = book();
  {
    const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3nsfix-') });
    try {
      await load(o, bk);
      const head = await o.p.$eval('[data-card=status] h2', e => e.textContent).catch(() => '');
      ck('B1: Home\'s first card asks for Free to spend', /everyday spending/i.test(head), head);
      await o.p.$eval('[data-card=status] .burrow-help', e => e.click()).catch(() => {}); await T.w(200);
      const help = await o.p.$eval('[data-card=status] .burrow-help-text', e => e.hidden ? '' : e.textContent).catch(() => '');
      ck('B1: its "?" says what Free to spend is', /Free to spend/.test(help) && !/How things stand today/.test(help), help);
      /* B2 */
      await o.p.click('#a3CheckGo'); await T.w(300);
      await o.p.tap('[data-bankfig]'); await o.p.keyboard.type('100000');
      await o.p.click('#a3CheckSave'); await T.w(600);
      const before = await o.p.evaluate(() => [...document.querySelectorAll('.burrow-msg')].map(e => e.textContent).join(' | '));
      ck('B2: the bank check leaves its Undo bar', /Undo/.test(before), before);
      globalThis.window = globalThis; require('../../store/guard.js'); require('../../store/pack.js');
      const Bk = require('../src/backup3.js');
      const tmp = fs.mkdtempSync(os.tmpdir() + '/a3nsfixbk-'), file = path.join(tmp, 'burrow-backup.json');
      fs.writeFileSync(file, (await Bk.make(bk)).text);
      await o.p.click('#a3SetGo'); await T.w(300);
      await (await o.p.$('#a3BkFile')).uploadFile(file); await T.w(500);
      await o.p.click('#a3BkGo'); await T.w(900);
      await o.p.click('#a3SetClose'); await T.w(400);   // the sheet held messages back while open (K37); Home now
      const after = await o.p.evaluate(() => [...document.querySelectorAll('.burrow-msg')].map(e => e.textContent).join(' | '));
      ck('B2: after the restore no Undo bar is left for the bank check it took away', !/Bank checked/.test(after) && !/Undo$/.test(after), after);
      ck('no page errors', !o.errs.length, o.errs.join(' | '));
    } catch (e) { ck('the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  {
    const o = await T.open({ w: 320, profile: fs.mkdtempSync(os.tmpdir() + '/a3nsfix320-') });
    try {
      await load(o, bk);
      const box = await o.p.$eval('#a3ChatIn', e => ({ sh: e.scrollHeight, ch: e.clientHeight, ph: e.placeholder }));
      ck('B3: at 320 the chat box shows its whole placeholder', box.sh <= box.ch + 1, JSON.stringify(box));
    } catch (e) { ck('B3: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  /* [latelist, coordinator 18] Home's late list is the one the AI is told (tests/latelist.test.js): Power, Rent, Internet */
  {
    const o = await T.open();
    try {
      await o.p.goto(T.URL0 + '?try=mako&today=2026-11-28'); await T.w(500);
      const late = await o.p.$$eval('[data-fig=duelate] li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()));
      const ok = late.length === 3 && /^Power/.test(late[0]) && /^Rent/.test(late[1]) && /^Internet/.test(late[2]);
      ck('Home lists Power, Rent, Internet as late, as the AI is told', ok, JSON.stringify(late));
    } catch (e) { ck('late: the check ran to its end', false, e.stack); }
    finally { await o.b.close(); }
  }
  T.done('e3_nsfix');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
