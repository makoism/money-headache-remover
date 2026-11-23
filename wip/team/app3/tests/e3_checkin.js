#!/usr/bin/env node
/* Check your bank through the page (WIRING_PLAN step 9), made-up Mako book.
   Try book, 10 Dec: the list has both pays and card A ticked; Mako unticks the three late November bills, changes the
   side pay to 58,000 (a tap selects the old amount, so typing replaces it) and types 339,000 for the bank. Home then
   shows 339,000 checked today and every figure equals the engine's for the same records written in node; card B still
   leaves on 11 Dec; nothing is written anywhere (a try book).
   Kept book: the same book saved through the store (store/idb.js, IndexedDB burrow3); a check-in is saved there and is
   still there after a reload and a browser restart;
   the old app's copies are byte for byte the same after hide, pagehide and reload. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const W = require('../../engine/checkin.js'), I = require('../../engine/ids.js');
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
    ck('the sum behind it is the engine\'s, without a minimum of 0', one('why')[0].text === r.accounts[bank].why.replace(' - 0 (minimum) =', ' ='), one('why')[0].text);
    const cardB = bk.accounts.find(a => a.name === 'Card B').id, cardA = bk.accounts.find(a => a.name === 'Card A').id;
    const owed = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cardid]')].map(e => [e.dataset.cardid, { amt: Number(e.querySelector('[data-fig=owed] [data-amt]').dataset.amt), text: e.textContent }])));
    ck('card A is paid', owed[cardA] && owed[cardA].amt === 0 && r.cards[cardA].owedNow === 0, JSON.stringify(owed[cardA]));
    ck('card B still leaves on 11 Dec', owed[cardB] && /on 11 Dec/.test(owed[cardB].text), JSON.stringify(owed[cardB]));
    ck('the next pay is in January', /Jan/.test(one('nextpay')[0].text), one('nextpay')[0].text);
    ck('the late bills are still not seen yet', (await p.$$('[data-card=notseen] li')).length === 3);
    await T.shot(p, 'home_after_checkin_' + DAY);
    /* the check-in went through act3, the one write door: its Undo bar takes the whole check-in back */
    const bar = await p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'); return m ? { text: m.querySelector('span').textContent, button: (m.querySelector('button') || {}).textContent } : null; });
    ck('the check-in has an Undo bar (act3)', bar && bar.button === 'Undo' && /[Bb]ank/.test(bar.text), JSON.stringify(bar));
    await p.click('#a3Msg .burrow-msg button'); await T.w(400);
    const back = (await T.figs(p)).filter(x => x.fig === 'bank');
    ck('Undo takes the check-in back: the bank is the setup figure again', back.length === 1 && back[0].amt === 286000, JSON.stringify(back));
    ck('and the items are on the list again', (await p.$$('[data-card=notseen] li')).length === 3 && /Next pay 10 Dec/.test(await p.$eval('[data-card=period]', e => e.textContent)));
    const stored = await p.evaluate(() => new Promise(res => indexedDB.databases ? indexedDB.databases().then(d => res({ dbs: d.map(x => x.name), ls: localStorage.length })) : res({ dbs: [], ls: localStorage.length })));
    ck('a try book writes nothing', !stored.dbs.includes('burrow3') && stored.ls === 0, JSON.stringify(stored));   // ?try=mako never opens the store
    ck('no page errors (try)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- a kept book, and the old app's copies ---- */
  {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
    let { b, p, errs } = await T.open({ profile: prof });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    ck('with nothing kept, the first screen offers the made-up numbers', !!(await p.$('#a3TryGo')));
    await T.seedOld(p);
    const saved = await p.evaluate(async bk0 => { const s = await BurrowStore.open(); const r = await s.save(bk0, { full: true }); s.db && s.db.close(); return r; }, bk);
    ck('the book is saved through the store', saved && saved.ok, JSON.stringify(saved));
    await p.reload(); await T.w(400);
    await walk(p, bk);
    await p.click('#a3CheckSave'); await T.w(500);
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); dispatchEvent(new PageTransitionEvent('pagehide')); });
    await p.reload(); await T.w(400);
    let f = await T.figs(p);
    ck('the check-in is kept in burrow3 after a reload', f.filter(x => x.fig === 'bank')[0].amt === 339000, JSON.stringify(f.filter(x => x.fig === 'bank')));
    /* the store hands events back sorted by id; the engine keeps a check-in's records inside its check whatever that
       order (lookahead `sameMoment`), so the page writes them with one `told` and the reload counts each pay once */
    const kept = await p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); s.close(); return r.copy.events.filter(e => e.grp && e.date >= '2026-12-10').map(e => ({ k: e.k, told: e.told, grp: e.grp })); });
    const ck1 = kept.find(e => e.k === 'check');
    ck('the check and the items it holds are told at one moment, and the reload counts each pay once', !!ck1 && kept.length > 1 && kept.every(e => e.grp === ck1.grp && e.told === ck1.told), JSON.stringify(kept));
    await b.close();
    ({ b, p, errs } = await T.open({ profile: prof }));
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
    f = await T.figs(p);
    ck('and after the browser is closed and opened again', f.filter(x => x.fig === 'bank')[0].amt === 339000);
    const old = await T.readOld(p);
    ck('the old app\'s copies are byte for byte the same after hide, pagehide and reload', old.ls === T.OLD_TEXT && old.idb === T.OLD_IDB, JSON.stringify(old).slice(0, 300));
    const keys = await p.evaluate(() => Object.keys(localStorage));
    ck('app3 writes only the store\'s small device keys (burrow3.*) in localStorage', keys.every(k => k === T.OLD_KEY || /^burrow3\./.test(k)), keys.join(','));
    ck('no page errors (kept)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_checkin');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
