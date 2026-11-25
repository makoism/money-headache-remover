#!/usr/bin/env node
/* [E4, M14 "Undo everywhere"] Undo after a reload for changes made on the screens, from the saved journal. On the kept
   made-up book (e3_act_book.js), 25 Nov 2026, phone size:
   - rename Wallet on Plan, reload: Settings > Recent changes names it ("Wallet changed", today at a time) with Undo;
     Undo puts the old name back, after a reload too, and the row leaves the list;
   - log a spend of 1,500 on Receipts, then change it to 1,800, reload: Undo on the spend is refused with words (a later
     change touched it) and changes nothing; Undo on the change, then on the spend, takes both back;
   - an account added on Plan, reload, Undo from the list: gone from Plan. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook, WALLET } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3undor-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook();
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); while (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const reload = async () => { await p.reload(); await T.w(600); };
    const settings = async () => { await p.click('#a3SetGo'); await T.w(400); };
    const done = async () => { await p.click('#a3SetClose'); await T.w(200); };
    const list = () => p.$$eval('#a3SetChanges [data-changes] li', ls => ls.map(l => ({ text: l.textContent.replace(/\s+/g, ' ').trim(), id: (l.querySelector('[data-undoj]') || {}).dataset.undoj })));
    const undoRow = re => p.evaluate(src => { const re = new RegExp(src); const li = [...document.querySelectorAll('#a3SetChanges [data-changes] li')].find(l => re.test(l.textContent)); if (!li) return false; li.querySelector('[data-undoj]').click(); return true; }, re.source);
    const msg = () => p.$eval('#a3SetMsg', e => e.textContent).catch(() => '');
    /* rename, reload, undo */
    await plan(); await p.click(`#a3Plan [data-acct="${WALLET}"]`); await T.w(300);
    await p.$eval('#pl-name', e => { e.value = ''; }); await p.type('#pl-name', 'Wallet cash'); await btn('Save'); await T.w(500);
    await reload(); await settings();
    let l = await list();
    ck('after a reload, Settings > Recent changes names the change with when', /^Wallet changed\s*today at \d\d:\d\d/.test((l[0] || {}).text || ''), JSON.stringify(l));
    ck('each with its own Undo', l.length >= 1 && l.every(x => x.id));
    ck('Undo puts the old name back', await undoRow(/Wallet changed/)); await T.w(600);
    ck('saved: the name is Wallet again', (await saved(p)).accounts.find(a => a.id === WALLET).name === 'Wallet');
    ck('it says so, and the row leaves the list', /Undone: Wallet changed/.test(await msg()) && !(await list()).some(x => /Wallet changed/.test(x.text)), await msg());
    await done(); await reload();
    ck('after another reload it stays undone', (await saved(p)).accounts.find(a => a.id === WALLET).name === 'Wallet');
    /* a spend, then a change to it: the older one is refused while the newer stands */
    await p.tap('[data-tab="receipts"]'); await T.w(300);
    await p.tap('#rcAmt'); await p.keyboard.type('1500'); await p.tap('#rcSave'); await T.w(600);
    const sp = (await saved(p)).events.find(e => e.k === 'spend' && e.a === 1500 && !e.gone).id;
    await p.$eval(`#rcList [data-rc="${sp}"] button`, e => e.click()); await T.w(300);
    const amtSel = (await p.$('#rcEditAmt')) ? '#rcEditAmt' : '#rcAmt';
    await p.$eval(amtSel, e => { e.value = ''; }); await p.type(amtSel, '1800');
    const saveSel = (await p.$('#rcEditSave')) ? '#rcEditSave' : '#rcSave';
    await p.$eval(saveSel, e => e.click()); await T.w(600);
    ck('the spend now reads 1,800', (await saved(p)).events.find(e => e.id === sp).a === 1800);
    await reload(); await settings();
    l = await list();
    ck('both are in the list, newest first', l.length >= 2 && /^Changed/.test(l[0].text) && /^Logged ¥1,500/.test(l[1].text), JSON.stringify(l.slice(0, 3)));
    const before = JSON.stringify((await saved(p)).events);
    await undoRow(/^Logged ¥1,500/); await T.w(600);
    ck('Undo on the spend is refused with words while the change stands', /Something changed it since\. Undo that change first/.test(await msg()) && JSON.stringify((await saved(p)).events) === before, await msg());
    await undoRow(/^Changed/); await T.w(600);
    ck('Undo on the change: 1,500 again', (await saved(p)).events.find(e => e.id === sp).a === 1500);
    await undoRow(/^Logged ¥1,500/); await T.w(600);
    ck('then Undo on the spend: gone (marked, not deleted)', !!(await saved(p)).events.find(e => e.id === sp).gone);
    await done();
    /* an account added, reload, undo */
    await plan(); await p.click('#plAddAcct'); await T.w(300);
    await p.type('#pl-name', 'PayPay'); await p.select('#pl-type', 'ewallet'); await p.type('#pl-amount', '4000'); await btn('Add'); await T.w(600);
    await reload(); await settings();
    ck('the added account is in the list', await undoRow(/Account added/)); await T.w(600);
    await done(); await plan();
    ck('after Undo it is gone from Plan', !(await p.$$eval('#a3Plan [data-acct]', bs => bs.map(x => x.textContent))).some(t => /PayPay/.test(t)));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_undoreload');
})();
