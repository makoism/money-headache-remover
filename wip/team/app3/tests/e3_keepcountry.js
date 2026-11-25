#!/usr/bin/env node
/* [E5] Keep at least for the main bank and where you bank, changed after setup (M13, M42 "never set for the person",
   M14 Undo). On the kept made-up book (e3_act_book.js, no minimum set), 25 Nov 2026, phone size, in Settings > Money:
   the Keep at least box is empty; a wrong value says what to do and saves nothing; 20,000 is saved, Home's safe to
   spend leaves room for it (it does not rise), and Undo takes it off; the country picked is saved and Undo puts it back;
   both are kept after a reload and both show in Recent changes. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3keep-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, actBook());
    await p.reload(); await T.w(400);
    const safe = () => p.$eval('[data-fig="safe"], [data-figure="safeToSpend.headline"]', e => Number(e.dataset.amt || e.textContent.replace(/[^\d-]/g, ''))).catch(() => null);
    const settings = async () => { await p.click('#a3SetGo'); await T.w(400); };
    const done = async () => { await p.click('#a3SetClose'); await T.w(300); };
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const err = () => p.$eval('#a3MoneyErr', e => e.textContent).catch(() => '');
    await p.tap('[data-tab="home"]').catch(() => {}); await T.w(300);
    const safe0 = await safe();
    await settings();
    ck('Keep at least starts empty (never set for the person)', (await p.$eval('#a3Keep', e => e.value)) === '');
    await p.type('#a3Keep', 'abc'); await p.click('#a3MoneySave'); await T.w(300);
    ck('a wrong value says what to do and saves nothing', /Type Keep at least as an amount/.test(await err()) && (await saved(p)).home.main.v.min == null, await err());
    await p.$eval('#a3Keep', e => { e.value = ''; }); await p.type('#a3Keep', '20000'); await p.click('#a3MoneySave'); await T.w(600);
    ck('20,000 is saved for the main bank', JSON.stringify((await saved(p)).home.main.v.min) === JSON.stringify({ a: 20000, cur: 'JPY' }), JSON.stringify((await saved(p)).home.main.v));
    await done(); await p.tap('[data-tab="home"]').catch(() => {}); await T.w(300);
    const safe1 = await safe();
    ck('Home: safe to spend does not rise with a minimum', safe0 != null && safe1 != null && safe1 <= safe0, JSON.stringify([safe0, safe1]));
    ck('Undo takes it off', await undo()); await T.w(600);
    ck('after Undo: no minimum, safe to spend as before', (await saved(p)).home.main.v.min == null && (await safe()) === safe0);
    await settings();
    await p.select('#a3Country', 'PH'); await p.click('#a3MoneySave'); await T.w(600);
    ck('the country is saved', (await saved(p)).home.country.v === 'PH');
    ck('Undo puts it back', await undo()); await T.w(600);
    ck('after Undo: Japan', (await saved(p)).home.country.v === 'JP');
    await p.$eval('#a3Keep', e => { e.value = ''; }).catch(() => {});
    if (!(await p.$('#a3Keep'))) { await done(); await settings(); }
    await p.type('#a3Keep', '15000'); await p.select('#a3Country', 'XX'); await p.click('#a3MoneySave'); await T.w(800);
    await done(); await p.reload(); await T.w(600); await settings();
    ck('after a reload both are kept and shown', (await p.$eval('#a3Keep', e => e.value)).replace(/,/g, '') === '15000' && (await p.$eval('#a3Country', e => e.value)) === 'XX', await p.$eval('#a3Keep', e => e.value));
    const rows = await p.$$eval('#a3SetChanges [data-changes] li', ls => ls.map(l => l.textContent));
    ck('both are in Recent changes', rows.some(t => /Keep at least changed/.test(t)) && rows.some(t => /Where you bank changed/.test(t)), JSON.stringify(rows));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_keepcountry');
})();
