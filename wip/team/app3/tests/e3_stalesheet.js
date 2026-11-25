#!/usr/bin/env node
/* A sheet left open while the same thing is changed somewhere else (qc-data-safety, 25 Nov 2026, blocker 1; MAKO_SAYS
   M61 "Nobody loses data", M14, M20; STALE_SHEET_PLAN). Two tabs of app3 on one device, one kept book.
   Tab 2 opens Plan > Rent and leaves the sheet open (amount 72,000). Tab 1 changes Rent to 76,000 and saves; tab 2 hears
   it. In tab 2 only the name is changed, and Save is tapped. Before the fix the sheet's old 72,000 was saved over the
   76,000, with no question and no Undo in tab 1.
   The rule: a save from a sheet whose item changed since the sheet opened is refused; the sheet says so, shows the item
   as it is now, and nothing is written. Saving again from the fresh sheet works. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const bk0 = actBook(), RENT = bk0.schedules.find(s => s.name === 'Rent').id;
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { return (await s.load()).copy; } finally { s.close(); } });
const rent = bk => { const s = bk.schedules.find(x => x.id === RENT); return { name: s.name, amount: s.steps.filter(x => !x.gone).slice(-1)[0].amount }; };
const until = async (f, ms) => { for (let i = 0; i < (ms || 6000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
async function retype(p, sel, text) { await p.bringToFront(); await p.$eval(sel, e => { e.value = ''; }); await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'a3stale-'));
  const { b, p: p1, errs } = await T.open({ profile: prof });
  const errs2 = [];
  try {
    await p1.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p1.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); await s.save(bk, { full: true }); s.close(); }, bk0);
    await p1.reload(); await T.w(400);
    const p2 = await b.newPage();
    p2.on('pageerror', e => errs2.push('PAGEERR ' + e.message));
    await p2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await p2.goto(T.URL0 + '?today=' + DAY); await T.w(400);

    /* tab 2 opens the Rent sheet and leaves it open */
    await p2.bringToFront(); await p2.tap('[data-tab="plan"]'); await T.w(250); await p2.tap(`[data-bill="${RENT}"]`); await T.w(250);
    ck('(tab 2: the Rent sheet shows 72,000)', (await p2.$eval('#pl-amount', e => e.value)).replace(/\D/g, '') === '72000');
    /* tab 1 changes Rent to 76,000 */
    await p1.bringToFront(); await p1.tap('[data-tab="plan"]'); await T.w(250); await p1.tap(`[data-bill="${RENT}"]`); await T.w(250);
    await retype(p1, '#pl-amount', '76000'); await p1.tap('[data-plbtn="0"]'); await T.w(500);
    ck('(tab 1 saved 76,000)', rent(await saved(p1)).amount === 76000, JSON.stringify(rent(await saved(p1))));
    await T.w(600);   // tab 2 hears it
    /* tab 2: only the name is changed in the sheet that was open all along */
    await p2.bringToFront();
    const open2 = !!(await p2.$('#pl-name'));
    if (open2) { await retype(p2, '#pl-name', 'Rent flat'); await p2.tap('[data-plbtn="0"]'); await T.w(700); }
    let bk = await saved(p1);
    ck('tab 1\'s 76,000 is not written over', rent(bk).amount === 76000, JSON.stringify(rent(bk)));
    const said = await p2.$eval('#a3Plan', e => e.textContent).catch(() => '');
    ck('tab 2 is told the item changed somewhere else', !open2 || /changed (somewhere else|in another tab)/i.test(said), said.slice(0, 300));
    ck('nothing was written by the refused save: the name is still Rent', rent(bk).name === 'Rent', rent(bk).name);
    ck('tab 2 now shows the amount as it is, 76,000', await until(async () => ((await p2.$eval('#pl-amount', e => e.value).catch(() => '')) || (await p2.$eval('#a3Plan', e => e.textContent))).replace(/[^\d]/g, '').includes('76000')));
    /* trying again from the fresh sheet saves the name and keeps 76,000 */
    if (!(await p2.$('#pl-name'))) { await p2.tap(`[data-bill="${RENT}"]`); await T.w(250); }
    await retype(p2, '#pl-name', 'Rent flat'); await p2.tap('[data-plbtn="0"]'); await T.w(700);
    bk = await saved(p1);
    ck('trying again saves the name and keeps 76,000', rent(bk).name === 'Rent flat' && rent(bk).amount === 76000, JSON.stringify(rent(bk)));
    ck('no page errors', !errs.length && !errs2.length, errs.concat(errs2).join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_stalesheet');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
