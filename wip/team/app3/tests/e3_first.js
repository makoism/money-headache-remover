#!/usr/bin/env node
/* The ways out of the first screen and the made-up numbers. The first screen's "I already use the burrow on another
   device": Settings with the cloud code box open and Restore from a file beside it, nothing written by looking.
   The try band's "Set up with my own numbers": out of the try book (from ?try=mako and from the first screen's
   made-up numbers), nothing of it written, setup opens; with a book this device already keeps, that book shows and
   setup does not. Made-up numbers only. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const DAY = '2026-11-25';
const kept = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.empty ? null : r.copy; });
const shows = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0).catch(() => false);
async function fresh(url) {
  const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3first-') });
  await o.p.goto(T.URL0 + url); await T.w(400);
  return o;
}
(async () => {
  /* 1. from ?try=mako, on Receipts with a spend half typed */
  {
    const { b, p, errs } = await fresh('?try=mako&today=' + DAY);
    ck('the try band offers to set up with your own numbers', /Set up with my own numbers/.test(await p.$eval('#a3Try', e => e.textContent)));
    await p.tap('[data-tab="receipts"]'); await T.w(200);
    await p.tap('#a3TryOut'); await T.w(500);
    ck('setup opens', await shows(p, '#a3Setup') && /Save and see my money/.test(await p.$eval('#a3Setup', e => e.textContent)));
    ck('the band is gone', !(await shows(p, '#a3Try')));
    ck('no panel shows under setup', !(await shows(p, '#a3Home')) && !(await shows(p, '#a3Rc')) && !(await shows(p, '#a3Plan')));
    ck('nothing of the try book is written', (await kept(p)) === null);
    ck('the address no longer asks for the try book', !/try=/.test(await p.evaluate(() => location.search)), await p.evaluate(() => location.search));
    await p.tap('#a3SetupX'); await T.w(300);
    ck('Back from setup is the first screen, not the made-up numbers', /Welcome to the burrow/.test(await p.$eval('#a3Home', e => e.textContent)) && !/Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
    ck('no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* 2. from the first screen's made-up numbers */
  {
    const { b, p, errs } = await fresh('?today=' + DAY);
    await p.tap('#a3TryGo'); await T.w(300);
    ck('the first screen\'s made-up numbers show with the band', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)) && await shows(p, '#a3TryOut'));
    await p.tap('#a3SetGo'); await T.w(200);
    await p.tap('#a3TryOut'); await T.w(500);
    ck('from over Settings: setup opens and Settings is closed', await shows(p, '#a3Setup') && !(await shows(p, '#a3Set')));
    ck('nothing of the try book is written (first screen route)', (await kept(p)) === null);
    ck('no page errors (first screen route)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* 3. this device already keeps a book: leaving the made-up numbers shows it, setup does not open */
  {
    const { b, p, errs } = await fresh('?today=' + DAY);
    const bk = T.book();
    const put = await p.evaluate(async bk => { const s = await BurrowStore.open(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, bk);
    ck('a made-up book is kept through the store', put && put.ok, JSON.stringify(put));
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
    await p.tap('#a3TryOut'); await T.w(500);
    ck('the kept book shows on Home', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)) && await shows(p, '#a3Home'));
    ck('setup does not open over a kept book', !(await shows(p, '#a3Setup')));
    const k = await kept(p);
    ck('the kept book is as it was', k && k.events.length === bk.events.length);
    ck('no page errors (kept book)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* 4. the first screen's "I already use the burrow on another device": the cloud code box, with Restore beside it */
  {
    const { b, p, errs } = await fresh('?today=' + DAY);
    ck('the first screen offers it', (await p.$eval('#a3OtherGo', e => e.textContent).catch(() => '')) === 'I already use the burrow on another device');
    await p.tap('#a3OtherGo'); await T.w(500);
    ck('Settings opens over the first screen', await shows(p, '#a3Set') && !(await shows(p, '#a3Home')));
    ck('it says what to do', /cloud code from your other device, or restore a backup file/.test(await p.$eval('[data-set=other]', e => e.textContent).catch(() => '')));
    ck('the cloud code box is open and ready to type in', await p.evaluate(() => !!document.querySelector('#a3CloudCode') && document.activeElement === document.querySelector('#a3CloudCode')));
    ck('Restore from a file is there', await shows(p, '#a3BkLoad'));
    ck('nothing written by looking', (await kept(p)) === null);
    await p.tap('#a3SetClose'); await T.w(300);
    ck('Done is the first screen again', await shows(p, '#a3Home') && /Welcome to the burrow/.test(await p.$eval('#a3Home', e => e.textContent)) && !(await shows(p, '#a3Set')));
    await p.tap('#a3SetGo'); await T.w(300);
    ck('Settings opened from the header has no from-another-device line', !(await p.$('[data-set=other]')));
    ck('no page errors (another device)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_first');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
