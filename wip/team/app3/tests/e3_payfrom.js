#!/usr/bin/env node
/* [E1b, M13, M23] which account pays a card, a loan or a bill, chosen and changed after setup (qc-controls controls1
   blockers 3 and 4; coordinator's ruling: with the weekend rule). On the kept made-up book (e3_act_book.js: the main bank,
   Wallet, Savings, Card A paid on the 10th, Card B on the 11th, Rent on the 27th), phone size:
   - Add a card and Add a loan ask which account pays it (the main bank first) and, for a card, the weekend rule;
   - a card's and a loan's sheet change the paying account and the weekend rule; a bill's sheet changes its paying account;
   - Plan says the new account at once; Undo puts the old one back; after a reload it is kept;
   - a payment that has gone by and is not ticked off stops the change, with words that say what to do, nothing written
     (it would move a payment that may already have left the old account). Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook, SAVINGS, WALLET } = require('./e3_act_book.js');
const DAY = '2026-11-25', LATER = '2026-12-12';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3payfrom-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook(), bank = bk0.home.main.v.acct, cardA = bk0.accounts.find(a => a.name === 'Card A').id, rent = bk0.schedules.find(s => s.name === 'Rent').id;
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); if (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
    const err = () => p.$eval('#plErr', e => e.textContent);
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const row = sel => p.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
    const opts = sel => p.$eval(sel, e => [...e.options].map(o => o.textContent));
    const acc = (bk, id) => bk.accounts.find(a => a.id === id);
    await plan();
    /* Add a card */
    await p.click('#plAddCard'); await T.w(300);
    ck('Add a card asks which account pays it, the main bank first, no card or loan in the list', JSON.stringify(await opts('#pl-payFrom')) === JSON.stringify(['Main bank', 'Wallet', 'Savings']), JSON.stringify(await opts('#pl-payFrom')));
    ck('and the weekend rule', !!(await p.$('#pl-shift')));
    ck('its words no longer say it is always paid from the main bank', !/paid in full from your main bank/.test(await row('[data-card="plan-form"]')));
    await fill('#pl-name', 'Card C'); await fill('#pl-owed', '3000'); await fill('#pl-payDay', '15'); await p.select('#pl-payFrom', SAVINGS); await p.select('#pl-shift', 'before');
    await btn('Add'); await T.w(500);
    let bk = await saved(p), cc = bk.accounts.find(a => a.name === 'Card C' && !a.gone);
    ck('the card is saved paid from Savings, the working day before', cc && cc.payFrom === SAVINGS && cc.shift === 'before', JSON.stringify(cc));
    ck('Plan says it is paid from Savings', /Card C.*from Savings/.test(await row(`[data-owed="${cc && cc.id}"]`) || ''), await row(`[data-owed="${cc && cc.id}"]`));
    /* a card's sheet */
    await p.click(`#a3Plan [data-owed="${cardA}"]`); await T.w(300);
    ck('a card\'s sheet shows its paying account and weekend rule', (await p.$eval('#pl-payFrom', e => e.value)) === bank && (await p.$eval('#pl-shift', e => e.value)) === 'after');
    await p.select('#pl-payFrom', WALLET); await p.select('#pl-shift', 'before'); await btn('Save'); await T.w(500);
    bk = await saved(p);
    ck('Card A: paid from Wallet, the working day before', acc(bk, cardA).payFrom === WALLET && acc(bk, cardA).shift === 'before', JSON.stringify(acc(bk, cardA)));
    ck('Plan says from Wallet at once', /Card A.*from Wallet/.test(await row(`[data-owed="${cardA}"]`) || ''), await row(`[data-owed="${cardA}"]`));
    ck('Undo puts the main bank back', await undo()); await T.w(500);
    bk = await saved(p);
    ck('after Undo: from the main bank, the working day after', acc(bk, cardA).payFrom === bank && acc(bk, cardA).shift === 'after', JSON.stringify(acc(bk, cardA)));
    await p.click(`#a3Plan [data-owed="${cardA}"]`); await T.w(300);
    await p.select('#pl-payFrom', SAVINGS); await btn('Save'); await T.w(500);
    /* a loan */
    await p.click('#plAddLoan'); await T.w(300);
    ck('Add a loan asks which account pays it', JSON.stringify(await opts('#pl-payFrom')) === JSON.stringify(['Main bank', 'Wallet', 'Savings']));
    await fill('#pl-name', 'Bike loan'); await fill('#pl-owed', '90000'); await fill('#pl-amount', '10000'); await fill('#pl-payDay', '5'); await p.select('#pl-payFrom', SAVINGS);
    await btn('Add'); await T.w(500);
    bk = await saved(p); const bl = bk.accounts.find(a => a.name === 'Bike loan' && !a.gone);
    ck('the loan is saved paid from Savings', bl && bl.payFrom === SAVINGS, JSON.stringify(bl));
    await p.click(`#a3Plan [data-owed="${bl.id}"]`); await T.w(300);
    await p.select('#pl-payFrom', bank); await btn('Save'); await T.w(500);
    ck('a loan\'s sheet changes it to the main bank', acc(await saved(p), bl.id).payFrom === bank);
    /* a bill's sheet */
    await p.click(`#a3Plan [data-bill="${rent}"]`); await T.w(300);
    ck('a bill\'s sheet shows Paid from, with the main bank chosen', (await p.$eval('#pl-acct', e => e.value)) === bank);
    await p.select('#pl-acct', SAVINGS); await btn('Save'); await T.w(500);
    bk = await saved(p);
    ck('Rent is paid from Savings', bk.schedules.find(s => s.id === rent).acct === SAVINGS, JSON.stringify(bk.schedules.find(s => s.id === rent).acct));
    ck('Undo puts the main bank back', await undo()); await T.w(500);
    ck('after Undo: from the main bank', (await saved(p)).schedules.find(s => s.id === rent).acct === bank);
    /* after a reload */
    await p.reload(); await T.w(500); await plan();
    bk = await saved(p);
    ck('after a reload Card A is still paid from Savings and Card C is there', acc(bk, cardA).payFrom === SAVINGS && /Card A.*from Savings/.test(await row(`[data-owed="${cardA}"]`) || ''));
    /* a payment gone by and not ticked off: Card A's of 10 Dec, Rent's of 27 Nov, on 12 Dec */
    await p.goto(T.URL0 + '?today=' + LATER); await T.w(1500); await plan(); await T.w(500);
    const before = JSON.stringify(await saved(p));
    await p.evaluate(id => document.querySelector(`#a3Plan [data-owed="${id}"]`).click(), cardA); await T.w(300);
    await p.select('#pl-payFrom', bank); await btn('Save'); await T.w(500);
    const e1 = await err();
    ck('a card with a payment not ticked off: it says to tick it at Check your bank first', /Check your bank/.test(e1) && /10 Dec/.test(e1), e1);
    await p.click('#plBack'); await T.w(200);
    await p.evaluate(id => document.querySelector(`#a3Plan [data-bill="${id}"]`).click(), rent); await T.w(300);
    await p.select('#pl-acct', SAVINGS); await btn('Save'); await T.w(500);
    const e2 = await err();
    ck('a bill with one not ticked off: the same', /Check your bank/.test(e2) && /27 Nov/.test(e2), e2);
    ck('nothing was written', JSON.stringify(await saved(p)) === before);
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_payfrom');
})();
