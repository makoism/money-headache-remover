#!/usr/bin/env node
/* The page as a plain file (Mako gets index.html as a file, so no ?try=mako). With nothing saved, the first screen offers
   "See it with made-up numbers first"; that opens the try book with a day box, and stepping the day through 23 Nov,
   10 Dec, 12 Dec and 8 Jan shows the engine's figures for each day. A check-in on 11 Dec, then 7 Jan in the day box:
   card B comes out on Fri 8 Jan, the day pay lands (the working day before the weekend, like Mako's). Nothing is written. Screenshots in app3/shots/. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const setDay = (p, d) => p.evaluate(d => { const e = document.getElementById('a3Day'); e.value = d; e.dispatchEvent(new Event('change', { bubbles: true })); }, d);
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct;
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3file-');
  const { b, p, errs, requests } = await T.open({ profile: prof });
  await p.goto(T.URL0); await T.w(400);
  const first = await p.$eval('#a3Home', e => e.textContent);
  ck('with nothing saved, the first screen offers the made-up numbers', /See it with made-up numbers first/.test(first), first.slice(0, 200));
  await p.click('#a3TryGo'); await T.w(300);
  ck('the try book opens with a day box', !!(await p.$('#a3Day')) && !(await p.$eval('#a3Try', e => e.hidden)));
  for (const day of ['2026-11-23', '2026-12-10', '2026-12-12', '2027-01-08']) {
    await setDay(p, day); await T.w(300);
    const r = T.L.lookahead(bk, day), f = await T.figs(p), one = k => f.filter(x => x.fig === k);
    ck(day + ' bank and safe to spend are the engine\'s for that day', one('bank')[0].amt === r.accounts[bank].bank && one('safe')[0].amt === r.safeToSpend.headline, JSON.stringify([one('bank'), one('safe')]));
    ck(day + ' the period is the engine\'s', (await p.$eval('[data-fig=period]', e => e.dataset.end)) === r.period.end);
    await T.shot(p, 'file_' + day);
  }
  /* the weekend: tick everything on 11 Dec, then look at 7 Jan */
  await setDay(p, '2026-12-11'); await T.w(200);
  await p.click('#a3CheckGo'); await T.w(200);
  await p.tap('[data-bankfig]'); await p.keyboard.type('300000');
  await p.click('#a3CheckSave'); await T.w(300);
  await setDay(p, '2027-01-07'); await T.w(300);
  const lines = await p.$$eval('[data-cardid]', es => es.map(e => e.textContent));
  ck('on 7 Jan card B comes out on 8 Jan, the day pay lands', lines.some(t => /Card B/.test(t) && /Comes out on 8 Jan, the day your pay lands/.test(t)) && lines.some(t => /Card A/.test(t) && /Comes out on 12 Jan/.test(t)), lines.join(' | '));
  await T.shot(p, 'file_2027-01-07_after_checkin');
  const st = await p.evaluate(() => new Promise(res => { const rq = indexedDB.open('burrow3'); rq.onsuccess = () => { const db = rq.result; if (!db.objectStoreNames.length) { db.close(); res({ book: null, ls: localStorage.length }); return; } const tx = db.transaction(db.objectStoreNames[0]); const g = tx.objectStore(db.objectStoreNames[0]).getAll(); g.onsuccess = () => { db.close(); res({ book: g.result.length ? 'saved' : null, ls: localStorage.length }); }; }; rq.onerror = () => res({ book: 'error' }); }));
  ck('nothing written', st.book === null && st.ls === 0, JSON.stringify(st));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  ck('no outside requests', requests.length === 0, requests.join(' '));
  await b.close(); T.done('e3_file');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
