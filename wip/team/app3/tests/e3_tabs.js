#!/usr/bin/env node
/* Two tabs of app3 on one device, one kept book (store/idb.js; DECISIONS_ROUND2 D1, BD2; MAIN 15's real-page walk:
   once tab 1 had saved, tab 2 said "could not be saved" on every try and kept showing the old figures).
   - Tab 1 logs a spend: tab 2, open all along, shows it without a reload.
   - Tab 2 misses tab 1's next save (its tab messages are held back, as when a phone puts a tab to sleep), then logs its
     own: the store refuses it as behind, tab 2 catches up and saves the same step again; both spends are kept and shown.
   - Both tabs change the same spend to different amounts (tab 2 again not hearing tab 1): tab 2's change is not saved
     over tab 1's; it says "Nothing was saved, because this changed somewhere else while it was open", shows tab 1's amount, and keeps the typed
     amount in the box. Trying again then saves it.
   Nothing is lost on reload; no page errors. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const bk0 = actBook();
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { return (await s.load()).copy; } finally { s.close(); } });
const rows = p => p.$$eval('#rcList [data-rc]', rs => rs.map(r => ({ id: r.dataset.rc, text: r.textContent.replace(/\s+/g, ' ').trim() })));
async function type(p, sel, text) { await p.bringToFront(); await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function clearType(p, sel, text) { await p.$eval(sel, e => { e.value = ''; }); await type(p, sel, text); }
const until = async (f, ms) => { for (let i = 0; i < (ms || 6000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
/* a tab whose BroadcastChannel messages can be held back (window.__deaf = true drops them, as a sleeping tab misses them) */
const DEAFABLE = () => {
  const B = window.BroadcastChannel;
  window.BroadcastChannel = function (name) {
    const ch = new B(name); let h = null;
    Object.defineProperty(ch, 'onmessage', { configurable: true, get: () => h, set: f => { h = f; B.prototype.__lookupSetter__('onmessage').call(ch, e => { if (!window.__deaf) f.call(ch, e); }); } });
    return ch;
  };
  window.BroadcastChannel.prototype = B.prototype;
};
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'a3tabs-'));
  const { b, p: p1, errs } = await T.open({ profile: prof });
  const errs2 = [];
  try {
    await p1.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p1.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); await s.save(bk, { full: true }); s.close(); }, bk0);
    await p1.reload(); await T.w(400);
    const p2 = await b.newPage();
    p2.on('pageerror', e => errs2.push('PAGEERR ' + e.message));
    p2.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs2.push('console: ' + m.text()); });
    await p2.evaluateOnNewDocument(DEAFABLE);
    await p2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await p2.goto(T.URL0 + '?today=' + DAY); await T.w(400);
    for (const p of [p1, p2]) { await p.bringToFront(); await p.tap('[data-tab="receipts"]'); await T.w(200); }

    /* 1. tab 1 saves: tab 2 shows it without a reload */
    await type(p1, '#rcAmt', '1200'); await type(p1, '#rcNote', 'coffee one'); await p1.tap('#rcSave'); await T.w(300);
    ck('tab 2 shows tab 1\'s spend without a reload', await until(async () => (await rows(p2)).some(r => /coffee one/.test(r.text))), JSON.stringify(await rows(p2)));

    /* 2. tab 2 misses tab 1's save, then saves its own: refused as behind, caught up, the same step saved again */
    await p2.evaluate(() => { window.__deaf = true; });
    await type(p1, '#rcAmt', '700'); await type(p1, '#rcNote', 'tea two'); await p1.tap('#rcSave'); await T.w(400);
    ck('(tab 2 did not hear it)', !(await rows(p2)).some(r => /tea two/.test(r.text)));
    await type(p2, '#rcAmt', '450'); await type(p2, '#rcNote', 'bun three'); await p2.tap('#rcSave'); await T.w(600);
    let bk = await saved(p1);
    ck('tab 2\'s spend is saved after catching up', bk.events.some(e => e.note === 'bun three' && e.a === 450 && !e.gone), bk.events.map(e => e.note).join(','));
    ck('tab 1\'s spend is still there', bk.events.some(e => e.note === 'tea two' && !e.gone));
    ck('tab 2 said nothing about a failed save', !/could not|Changed in another tab/.test(await p2.$eval('#rcErr', e => e.textContent)));
    ck('tab 2 shows all three spends', await until(async () => { const r = await rows(p2); return ['coffee one', 'tea two', 'bun three'].every(n => r.some(x => x.text.includes(n))); }), JSON.stringify(await rows(p2)));
    ck('tab 1 shows tab 2\'s spend', await until(async () => (await rows(p1)).some(r => /bun three/.test(r.text))));

    /* 3. the same spend changed in both tabs */
    const coffee = bk.events.find(e => e.note === 'coffee one').id;
    await p1.bringToFront(); await p1.tap(`#rcList [data-rc="${coffee}"]`); await T.w(200); await clearType(p1, '#rcAmt', '1300'); await p1.tap('#rcSave'); await T.w(400);
    ck('(tab 1 changed it to 1,300)', (await saved(p1)).events.find(e => e.id === coffee).a === 1300);
    await p2.bringToFront(); await p2.tap(`#rcList [data-rc="${coffee}"]`); await T.w(200);
    ck('(tab 2 still shows 1,200 in its box)', await p2.$eval('#rcAmt', e => e.value) === '1200');
    await clearType(p2, '#rcAmt', '1250'); await p2.tap('#rcSave'); await T.w(700);
    bk = await saved(p1);
    ck('tab 2\'s change is not saved over tab 1\'s', bk.events.find(e => e.id === coffee).a === 1300);
    const err = await p2.$eval('#rcErr', e => e.textContent);
    ck('it says nothing was saved because it changed somewhere else', /^Nothing was saved, because this changed somewhere else while it was open/.test(err), err);
    ck('the typed amount stays in the box', await p2.$eval('#rcAmt', e => e.value) === '1250');
    ck('tab 2 shows tab 1\'s amount again', (await rows(p2)).some(r => r.id === coffee && /1,300/.test(r.text)), JSON.stringify(await rows(p2)));
    await p2.tap('#rcSave'); await T.w(600);
    ck('trying again saves it', (await saved(p1)).events.find(e => e.id === coffee).a === 1250);
    await p2.evaluate(() => { window.__deaf = false; });

    await p2.reload(); await T.w(400);
    const bk2 = await saved(p2);
    ck('nothing is lost after a reload', ['coffee one', 'tea two', 'bun three'].every(n => bk2.events.some(e => e.note === n && !e.gone)));
    const all = errs.concat(errs2);
    ck('no page errors', all.length === 0, all.join(' | '));
  } finally { await b.close(); }
  T.done('e3_tabs');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
