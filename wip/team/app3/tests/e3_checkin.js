#!/usr/bin/env node
/* Check your bank through the page (WIRING_PLAN step 9), made-up Mako book.
   Try book, 10 Dec: the list has both pays and card A ticked; Mako unticks the three late November bills, changes the
   side pay to 58,000 (a tap selects the old amount, so typing replaces it) and types 339,000 for the bank. Home then
   shows 339,000 checked today and every figure equals the engine's for the same records written in node; card B still
   leaves on 11 Dec; nothing is written anywhere (a try book).
   Kept book: the same book put in IndexedDB burrow3; a check-in is saved there and is still there after a reload;
   the old app's copies are byte for byte the same after hide, pagehide and reload. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const W = require('../src/checkin_write.js'), I = require('../../engine/ids.js');
const DAY = '2026-12-10';
async function walk(p, bk) {
  await p.click('#a3CheckGo'); await T.w(300);
  const items = await p.$$eval('.a3-tick', rs => rs.map(r => r.dataset.item));
  const sched = it => I.scheduleOf(it);
  const name = id => (bk.accounts.find(a => a.id === id) || bk.schedules.find(s => s.id === id) || {}).name;
  for (const it of items) if (['Rent', 'Power', 'Internet'].includes(name(sched(it)))) await p.click(`.a3-tick[data-item="${it}"] input[type=checkbox]`);
  const side = items.find(it => name(sched(it)) === 'Side job');
  await p.tap(`.a3-tick[data-item="${side}"] [data-amt]`); await T.w(100);
  await p.keyboard.type('58000');
  await p.tap('[data-bankfig]'); await p.keyboard.type('339,000');
  return { items, side };
}
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct;
  /* ---- the try book ---- */
  {
    const { b, p, errs } = await T.open();
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
    const { items, side } = await walk(p, bk);
    const listed = T.L.lookahead(bk, DAY).checkIn.toConfirm.map(o => o.item);
    ck('the list is the engine\'s check-in list', JSON.stringify(items) === JSON.stringify(listed), items.join(','));
    ck('a tap on the side pay amount selected it, so typing replaced it', await p.$eval(`.a3-tick[data-item="${side}"] [data-amt]`, e => e.value) === '58000');
    await T.shot(p, 'checkin_' + DAY);
    await p.click('#a3CheckSave'); await T.w(400);
    ck('the sheet closed', await p.$eval('#a3Check', e => e.hidden));
    // the same records written in node
    const r0 = T.L.lookahead(bk, DAY), li = r0.checkIn.toConfirm;
    const keep = li.filter(o => !['Rent', 'Power', 'Internet'].includes((bk.schedules.find(s => s.id === I.scheduleOf(o.item)) || {}).name));
    const out = W.checkIn(bk, { day: DAY, told: DAY + 'T12:00+00:00', newId: I.idMaker('t3stdv', () => 0.2), figures: { [bank]: 339000 }, ticked: keep.map(o => o.item), amounts: { [side]: 58000 },
      expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) });
    const r = T.L.lookahead(W.apply(bk, out), DAY), f = await T.figs(p), one = k => f.filter(x => x.fig === k);
    ck('Home shows the typed bank figure', one('bank').length === 1 && one('bank')[0].amt === 339000, JSON.stringify(one('bank')));
    ck('checked today', one('age')[0] && one('age')[0].text === 'checked today, on 10 Dec', one('age')[0] && one('age')[0].text);
    ck('safe to spend is the engine\'s after the check-in', one('safe')[0].amt === r.safeToSpend.headline, one('safe')[0].amt + ' vs ' + r.safeToSpend.headline);
    ck('the sum behind it is the engine\'s', one('why')[0].text === r.accounts[bank].why, one('why')[0].text);
    const cardB = bk.accounts.find(a => a.name === 'Card B').id, cardA = bk.accounts.find(a => a.name === 'Card A').id;
    const owed = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cardid]')].map(e => [e.dataset.cardid, { amt: Number(e.querySelector('[data-fig=owed] [data-amt]').dataset.amt), text: e.textContent }])));
    ck('card A is paid', owed[cardA] && owed[cardA].amt === 0 && r.cards[cardA].owedNow === 0, JSON.stringify(owed[cardA]));
    ck('card B still leaves on 11 Dec', owed[cardB] && /on 11 Dec/.test(owed[cardB].text), JSON.stringify(owed[cardB]));
    ck('the next pay is in January', /Jan/.test(one('nextpay')[0].text), one('nextpay')[0].text);
    ck('the late bills are still not seen yet', (await p.$$('[data-card=notseen] li')).length === 3);
    await T.shot(p, 'home_after_checkin_' + DAY);
    const stored = await p.evaluate(() => new Promise(res => indexedDB.databases ? indexedDB.databases().then(d => res({ dbs: d.map(x => x.name), ls: localStorage.length })) : res({ dbs: [], ls: localStorage.length })));
    ck('a try book writes nothing', !stored.dbs.includes('burrow3') && stored.ls === 0, JSON.stringify(stored));
    ck('no page errors (try)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- a kept book, and the old app's copies ---- */
  {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
    let { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    ck('with nothing kept, Home says so and offers the try book', /Nothing here yet/.test(await p.$eval('#a3Home', e => e.textContent)));
    await T.seedOld(p);
    await p.evaluate(bk0 => new Promise(res => { const rq = indexedDB.open('burrow3', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('slice1'); rq.onsuccess = () => { const db = rq.result, tx = db.transaction('slice1', 'readwrite'); tx.objectStore('slice1').put({ v: 1, book: bk0, t: 1 }, 'book'); tx.oncomplete = () => { db.close(); res(); }; }; }), bk);
    await p.reload(); await T.w(400);
    await walk(p, bk);
    await p.click('#a3CheckSave'); await T.w(500);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); dispatchEvent(new PageTransitionEvent('pagehide')); });
    await p.reload(); await T.w(400);
    let f = await T.figs(p);
    ck('the check-in is kept in burrow3 after a reload', f.filter(x => x.fig === 'bank')[0].amt === 339000, JSON.stringify(f.filter(x => x.fig === 'bank')));
    await b.close();
    ({ b, p, errs } = await T.open({ profile: prof }));
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
    f = await T.figs(p);
    ck('and after the browser is closed and opened again', f.filter(x => x.fig === 'bank')[0].amt === 339000);
    const old = await T.readOld(p);
    ck('the old app\'s copies are byte for byte the same after hide, pagehide and reload', old.ls === T.OLD_TEXT && old.idb === T.OLD_IDB, JSON.stringify(old).slice(0, 300));
    const keys = await p.evaluate(() => Object.keys(localStorage));
    ck('app3 writes no localStorage key', keys.length === 1 && keys[0] === T.OLD_KEY, keys.join(','));
    ck('no page errors (kept)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_checkin');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
