#!/usr/bin/env node
/* [E1] Plan > Accounts after setup (M13 "add, remove different things", M23 several accounts; LANE_E_STATE slice 1). On
   the kept made-up book (e3_act_book.js: the main bank, a cash Wallet 10,000, Savings 50,000, two cards, a car loan), 25 Nov
   2026, at phone size: the Accounts card lists every bank, cash and e-wallet with what it holds today, and no card or
   loan; Add an account adds new money as it is, and money moved from the main bank as a move (never counted twice);
   each shows on the list at once and after a reload; Undo takes it back; a row opens its sheet, which renames it and sets
   its own Keep at least, and an empty name says what to do and loses nothing. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook, WALLET, SAVINGS, LOAN } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const rows = p => p.$$eval('[data-card="plan-accounts"] [data-acct]', bs => bs.map(b => ({ id: b.dataset.acct, text: b.textContent.replace(/\s+/g, ' ').trim() })));
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3acct-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook(), bank = bk0.home.main.v.acct, cards = bk0.accounts.filter(a => a.type === 'card').map(a => a.id);
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); if (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    await plan();
    let r = await rows(p);
    ck('the Accounts card lists the main bank, Wallet and Savings', [bank, WALLET, SAVINGS].every(id => r.some(x => x.id === id)), JSON.stringify(r));
    ck('no card or loan in it', !r.some(x => cards.includes(x.id) || x.id === LOAN), JSON.stringify(r));
    ck('each with what it holds today', /¥10,000/.test((r.find(x => x.id === WALLET) || {}).text) && /¥50,000/.test((r.find(x => x.id === SAVINGS) || {}).text), JSON.stringify(r));
    ck('the main bank says pay lands there', /main bank, where pay lands/.test((r.find(x => x.id === bank) || {}).text));
    /* add new money */
    await p.click('#plAddAcct'); await T.w(300);
    ck('Add an account opens its sheet', /Add an account/.test(await p.$eval('[data-card="plan-form"] h2', e => e.textContent)));
    await btn('Add'); await T.w(300);
    ck('empty: it says what to do and stays open', /Type a name/.test(await p.$eval('#plErr', e => e.textContent)) && !!(await p.$('#plBack')), await p.$eval('#plErr', e => e.textContent));
    await fill('#pl-name', 'PayPay'); await p.select('#pl-type', 'ewallet'); await fill('#pl-amount', '5000');
    await btn('Add'); await T.w(500);
    let bk = await saved(p), pp = bk.accounts.find(a => a.name === 'PayPay' && !a.gone);
    ck('new money: the e-wallet is saved with an opening of 5,000 and nothing taken off the main bank', pp && pp.type === 'ewallet' && bk.events.some(e => e.acct === pp.id && e.k === 'open' && e.a === 5000 && !e.gone) && !bk.events.some(e => e.k === 'transfer' && e.acct2 === pp.id), JSON.stringify(pp));
    r = await rows(p);
    ck('it shows on the list at once, with E-wallet and 5,000', /PayPay.*E-wallet.*¥5,000/.test((r.find(x => pp && x.id === pp.id) || {}).text), JSON.stringify(r));
    ck('Undo is offered and takes it back', await undo()); await T.w(500);
    bk = await saved(p);
    ck('after Undo it is gone from the book and the list', bk.accounts.find(a => a.id === pp.id).gone && !(await rows(p)).some(x => x.id === pp.id));
    /* add money moved from the main bank */
    const fig = async id => Number(((await rows(p)).find(x => x.id === id) || { text: '' }).text.replace(/^.*¥([\d,]+)bank today$/, '$1').replace(/,/g, ''));
    const bankBefore = await fig(bank);
    await p.click('#plAddAcct'); await T.w(300);
    await fill('#pl-name', 'Trip savings'); await fill('#pl-amount', '20000'); await p.select('#pl-source', 'moved');
    await btn('Add'); await T.w(500);
    bk = await saved(p);
    const ts = bk.accounts.find(a => a.name === 'Trip savings' && !a.gone);
    ck('moved: one move of 20,000 from the main bank', ts && bk.events.filter(e => e.k === 'transfer' && e.acct === bank && e.acct2 === ts.id && e.a === 20000 && !e.gone).length === 1, JSON.stringify(ts));
    const nb = await fig(bank), nt = ts && await fig(ts.id);
    ck('moved: the main bank shows 20,000 less and the new one 20,000 (never counted twice)', bankBefore > 0 && nb === bankBefore - 20000 && nt === 20000, JSON.stringify([bankBefore, nb, nt]));
    /* rename and Keep at least */
    await p.click(`[data-card="plan-accounts"] [data-acct="${WALLET}"]`); await T.w(300);
    ck('a row opens its own sheet', /Wallet/.test(await p.$eval('[data-card="plan-form"] h2', e => e.textContent)) && !!(await p.$('#pl-min')));
    await fill('#pl-name', ''); await btn('Save'); await T.w(300);
    ck('an empty name says what to do and changes nothing', /Type a name/.test(await p.$eval('#plErr', e => e.textContent)) && (await saved(p)).accounts.find(a => a.id === WALLET).name === 'Wallet');
    await fill('#pl-name', 'Wallet cash'); await fill('#pl-min', '2000'); await btn('Save'); await T.w(500);
    bk = await saved(p);
    const wa = bk.accounts.find(a => a.id === WALLET);
    ck('renamed and its Keep at least saved', wa.name === 'Wallet cash' && wa.minBank && wa.minBank.a === 2000, JSON.stringify(wa));
    ck('the list shows the new name and Keep at least', /Wallet cash.*Cash.*Keep at least ¥2,000/.test(((await rows(p)).find(x => x.id === WALLET) || {}).text));
    await p.click(`[data-card="plan-accounts"] [data-acct="${bank}"]`); await T.w(300);
    ck('the main bank\'s sheet has no Keep at least box (it is in Settings)', !(await p.$('#pl-min')) && !!(await p.$('#pl-name')));
    await p.click('#plBack'); await T.w(200);
    /* after a reload */
    await p.reload(); await T.w(500); await plan();
    r = await rows(p);
    ck('after a reload: the new account and the new name are there', r.some(x => x.id === ts.id) && /Wallet cash/.test((r.find(x => x.id === WALLET) || {}).text), JSON.stringify(r));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_accounts');
})();
