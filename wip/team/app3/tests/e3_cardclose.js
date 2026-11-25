#!/usr/bin/env node
/* [E3] Cards and loans on the screens: pay it off now, close, remove one added by mistake, reopen (M13, M27 two cards,
   M40, M6 asks first, M14 Undo). On the kept made-up book (e3_act_book.js; Card A owes 54,000, paid from Main bank
   286,000), 25 Nov 2026, phone size:
   - Close this card while 54,000 is on it says to pay it off first and asks nothing;
   - Pay it off now asks "Did you pay all ¥54,000 ... today"; No writes nothing; Yes: Card A shows 0 and Main bank
     232,000 (worked example: 286,000 - 54,000); Undo puts both back;
   - paid off, Close this card asks, Yes closes it: listed under Closed; Reopen from there;
   - Remove this card on Card A (it has history) is refused with words; a card added by mistake is removed after a yes;
   - a loan added, paid off now and closed. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3card-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook(), bank = bk0.home.main.v.acct, cardA = bk0.accounts.find(a => a.name === 'Card A').id;
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); while (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const q = () => p.$eval('[data-sure]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
    const err = () => p.$eval('#plErr', e => e.textContent).catch(() => '');
    const yes = async () => { await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(600); };
    const rowText = sel => p.$eval(sel, e => e.textContent.replace(/\s+/g, ' ')).catch(() => '');
    const owedRow = () => rowText(`#a3Plan [data-owed="${cardA}"]`), bankRow = () => rowText(`#a3Plan [data-acct="${bank}"]`);
    const open = async () => { await plan(); await p.click(`#a3Plan [data-owed="${cardA}"]`); await T.w(300); };
    await plan();
    ck('the starting figures: Card A 54,000, Main bank 286,000', /¥54,000/.test(await owedRow()) && /¥286,000/.test(await bankRow()), (await owedRow()) + ' / ' + (await bankRow()));
    await open();
    let before = JSON.stringify((await saved(p)).events.length);
    await btn('Close this card'); await T.w(300);
    ck('Close while 54,000 is on it: pay it off first, nothing asked', /still has ¥54,000 on it\. Pay it off first/.test(await err()) && !(await p.$('[data-sure]')), await err());
    await btn('Pay it off now'); await T.w(300);
    ck('Pay it off now asks, naming the amount and the bank', /Did you pay all ¥54,000 on Card A today, from Main bank\?/.test(await q()), await q());
    await p.$eval('[data-sure] [data-sureno]', e => e.click()); await T.w(300);
    ck('No writes nothing', JSON.stringify((await saved(p)).events.length) === before);
    await btn('Pay it off now'); await T.w(300); await yes();
    await plan();
    ck('Yes: Card A shows 0 and Main bank 232,000', /¥0/.test(await owedRow()) && /¥232,000/.test(await bankRow()), (await owedRow()) + ' / ' + (await bankRow()));
    ck('Undo puts both back', await undo()); await T.w(600); await plan();
    ck('after Undo: 54,000 and 286,000', /¥54,000/.test(await owedRow()) && /¥286,000/.test(await bankRow()));
    await open(); await btn('Pay it off now'); await T.w(300); await yes();
    await open(); await btn('Close this card'); await T.w(300);
    ck('at zero, Close this card asks first', /Close Card A\? Its payment day stops/.test(await q()), await q());
    await yes();
    ck('Yes closes it today', (await saved(p)).accounts.find(a => a.id === cardA).closed === DAY);
    await plan();
    ck('Card A leaves the list and shows under Closed', !(await p.$(`#a3Plan [data-owed="${cardA}"]`)) && !!(await p.$(`#a3Plan [data-card="plan-owed"] [data-acctclosed="${cardA}"]`)));
    await p.click(`#a3Plan [data-acctclosed="${cardA}"]`); await T.w(300); await btn('Reopen'); await T.w(600);
    ck('Reopen brings it back', !(await saved(p)).accounts.find(a => a.id === cardA).closed);
    await open(); before = JSON.stringify((await saved(p)).accounts);
    await btn('Remove this card'); await T.w(300);
    ck('Remove on Card A (it has history) is refused with words, nothing asked', /has history\. Close it instead/.test(await err()) && !(await p.$('[data-sure]')), await err());
    await plan(); await p.click('#plAddCard'); await T.w(300);
    await p.type('#pl-name', 'Oops card'); await p.type('#pl-owed', '0'); await p.type('#pl-payDay', '15'); await btn('Add'); await T.w(600);
    const oops = (await saved(p)).accounts.find(a => a.name === 'Oops card').id;
    await plan(); await p.click(`#a3Plan [data-owed="${oops}"]`); await T.w(300); await btn('Remove this card'); await T.w(300);
    ck('a card added by mistake: Remove asks', /Remove Oops card\?/.test(await q()), await q());
    await yes();
    ck('Yes removes it, marked gone', !!(await saved(p)).accounts.find(a => a.id === oops).gone);
    /* a loan */
    await plan(); await p.click('#plAddLoan'); await T.w(300);
    await p.type('#pl-name', 'Bike loan'); await p.type('#pl-owed', '100000'); await p.type('#pl-amount', '10000'); await p.type('#pl-payDay', '27'); await btn('Add'); await T.w(600);
    const bike = (await saved(p)).accounts.find(a => a.name === 'Bike loan').id;
    await plan(); await p.click(`#a3Plan [data-owed="${bike}"]`); await T.w(300);
    await btn('Pay it off now'); await T.w(300);
    ck('a loan: Pay it off now asks with its amount', /Did you pay all ¥100,000 on Bike loan/.test(await q()), await q());
    await yes();
    await plan(); await p.click(`#a3Plan [data-owed="${bike}"]`); await T.w(300); await btn('Close this loan'); await T.w(300); await yes();
    ck('then Close this loan closes it', (await saved(p)).accounts.find(a => a.id === bike).closed === DAY);
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_cardclose');
})();
