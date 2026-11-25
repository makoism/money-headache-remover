#!/usr/bin/env node
/* [E2] Close, reopen and remove a bank, cash or e-wallet on the screens (M13 "remove different things", M6 removes ask
   first, M14 Undo, M45 never counted twice, M61 nothing deleted). On the kept made-up book (e3_act_book.js: the main bank,
   a cash Wallet 10,000, Savings 50,000), 25 Nov 2026, phone size:
   - Wallet > Close this account opens its own sheet saying what it holds; Close asks first (nothing written, No keeps
     it); Yes closes it: the main bank shows 10,000 more, Wallet moves to Closed with its history; Undo takes it back;
   - closed with "not there any more", then Reopen from the Closed list;
   - Remove this account on Savings (it has history) says to close it instead and writes nothing; an account added by
     mistake is removed after a yes, as if never added, and Undo brings it back;
   - after a reload the closed account is still listed as closed. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook, WALLET, SAVINGS } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const rows = p => p.$$eval('[data-card="plan-accounts"] [data-acct]', bs => bs.map(b => ({ id: b.dataset.acct, text: b.textContent.replace(/\s+/g, ' ').trim() })));
const closedRows = p => p.$$eval('[data-card="plan-accounts"] [data-acctclosed]', bs => bs.map(b => ({ id: b.dataset.acctclosed, text: b.textContent.replace(/\s+/g, ' ').trim() })));
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3close-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook(), bank = bk0.home.main.v.acct;
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); while (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const q = () => p.$eval('[data-sure]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
    const fig = async id => Number(((await rows(p)).find(x => x.id === id) || { text: '' }).text.replace(/^.*¥([\d,]+)bank today$/, '$1').replace(/,/g, ''));
    const bare = bk => JSON.stringify([bk.events.filter(e => !e.gone).length, bk.accounts.map(a => [a.id, a.closed || null, a.gone || null])]);
    await plan();
    const bank0 = await fig(bank);
    /* close, moving its money */
    await p.click(`#a3Plan [data-acct="${WALLET}"]`); await T.w(300);
    ck('the account\'s sheet offers Close this account and Remove this account', await p.evaluate(() => ['Close this account', 'Remove this account'].every(l => [...document.querySelectorAll('[data-plbtn]')].some(y => y.textContent.trim() === l))));
    await btn('Close this account'); await T.w(300);
    const sheet = await p.$eval('[data-card="plan-form"]', e => e.textContent.replace(/\s+/g, ' '));
    ck('Close opens its own sheet saying what it holds', /Close Wallet/.test(sheet) && /holds ¥10,000 today/.test(sheet), sheet);
    let before = bare(await saved(p));
    await btn('Close this account'); await T.w(300);
    ck('Close asks first, naming where the money goes, and writes nothing', /Close Wallet\? What it holds moves to Main bank/.test(await q()) && bare(await saved(p)) === before, await q());
    await p.$eval('[data-sure] [data-sureno]', e => e.click()); await T.w(300);
    ck('No writes nothing', bare(await saved(p)) === before);
    await btn('Close this account'); await T.w(300);
    await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(600);
    let bk = await saved(p);
    ck('Yes closes it today', bk.accounts.find(a => a.id === WALLET).closed === DAY);
    ck('the main bank shows 10,000 more (its money moved, not lost or counted twice)', await fig(bank) === bank0 + 10000, String(await fig(bank)));
    ck('Wallet leaves the open list and shows under Closed with its history', !(await rows(p)).some(x => x.id === WALLET) && /Wallet.*Closed.*history stays/.test(((await closedRows(p))[0] || {}).text || ''), JSON.stringify(await closedRows(p)));
    ck('Undo takes the close back', await undo()); await T.w(600);
    bk = await saved(p);
    ck('after Undo: open, its money back', !bk.accounts.find(a => a.id === WALLET).closed && await fig(WALLET) === 10000 && await fig(bank) === bank0);
    /* close as spent, then reopen */
    await p.click(`#a3Plan [data-acct="${WALLET}"]`); await T.w(300); await btn('Close this account'); await T.w(300);
    await p.select('#pl-to', 'spent'); await btn('Close this account'); await T.w(300);
    ck('spent: the question says it counts as spent', /counts as spent/.test(await q()), await q());
    await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(600);
    bk = await saved(p);
    ck('spent: closed, the main bank unchanged', bk.accounts.find(a => a.id === WALLET).closed === DAY && await fig(bank) === bank0);
    await p.click(`#a3Plan [data-acctclosed="${WALLET}"]`); await T.w(300);
    await btn('Reopen'); await T.w(600);
    ck('Reopen opens it again', !(await saved(p)).accounts.find(a => a.id === WALLET).closed && (await rows(p)).some(x => x.id === WALLET));
    /* remove: refused with history; allowed for one added by mistake */
    await p.click(`#a3Plan [data-acct="${SAVINGS}"]`); await T.w(300);
    before = bare(await saved(p));
    await btn('Remove this account'); await T.w(300);
    ck('Remove on an account with history says to close it instead, and asks nothing', /has history\. Close it instead/.test(await p.$eval('#plErr', e => e.textContent)) && !(await p.$('[data-sure]')) && bare(await saved(p)) === before, await p.$eval('#plErr', e => e.textContent));
    await p.click('#plBack'); await T.w(200);
    await p.click('#plAddAcct'); await T.w(300);
    await p.type('#pl-name', 'Oops'); await p.type('#pl-amount', '3000'); await btn('Add'); await T.w(600);
    const oops = (await saved(p)).accounts.find(a => a.name === 'Oops').id;
    await p.click(`#a3Plan [data-acct="${oops}"]`); await T.w(300);
    await btn('Remove this account'); await T.w(300);
    ck('Remove asks first', /Remove Oops\? .*added by mistake/.test(await q()), await q());
    await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(600);
    bk = await saved(p);
    ck('Yes removes it as if never added (marked gone, nothing deleted)', bk.accounts.find(a => a.id === oops).gone && bk.events.filter(e => e.acct === oops).every(e => e.gone) && !(await rows(p)).some(x => x.id === oops));
    ck('Undo brings it back', await undo()); await T.w(600);
    ck('after Undo it is listed with 3,000', await fig(oops) === 3000);
    /* close Wallet again, reload */
    await p.click(`#a3Plan [data-acct="${WALLET}"]`); await T.w(300); await btn('Close this account'); await T.w(300); await btn('Close this account'); await T.w(300);
    await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(600);
    await p.reload(); await T.w(600); await plan();
    ck('after a reload Wallet is still under Closed', (await closedRows(p)).some(x => x.id === WALLET) && !(await rows(p)).some(x => x.id === WALLET));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_acctclose');
})();
