#!/usr/bin/env node
/* Moved INTO the main bank (qc-numbers monthrule2 blocker 2, coordinator 26 Nov 07:57; M13, M23). A person with a main
   bank, a savings account and a cash wallet tops up the main bank from savings. Before: To was worked out once from the
   main bank and never changed with From, so it was always "Savings, Wallet" and Savings to Main bank could not be logged.
   Now To lists every own account except the one in From, and follows From. Made-up yen: Main bank 286,000, Savings
   100,000 and Wallet 20,000 opened 20 Nov; move 30,000 Savings to Main bank on 25 Nov: Main bank 316,000, Savings 70,000.
   At 390 and 1300 px. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const DAY = '2026-11-25';
function bookWith() {
  const bk = T.book(), id = n => 'k7m2qa-f3n8p1x6wd-9' + n;
  bk.accounts.push({ id: id(1), name: 'Savings', type: 'bank', cur: 'JPY', owner: null, minBank: null }, { id: id(2), name: 'Wallet', type: 'cash', cur: 'JPY', owner: null, minBank: null });
  for (const [n, a] of [[1, 100000], [2, 20000]]) for (const k of ['open', 'check'])
    bk.events.push({ id: id(n) + k, k, acct: id(n), date: '2026-11-20', a, told: '2026-11-20T24:00', grp: 'setup' });
  return bk;
}
const opts = (p, sel) => p.$eval(sel, e => [...e.options].map(o => o.textContent));
const selByText = (p, sel, t) => p.$eval(sel, (e, t) => { const o = [...e.options].find(o => o.textContent === t); e.value = o.value; e.dispatchEvent(new Event('change', { bubbles: true })); }, t);
(async () => {
  for (const w of [390, 1300]) {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3moved2-');
    const { b, p, errs } = await T.open({ profile: prof, w });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bookWith());
    await p.reload(); await T.w(400);
    await p.click('[data-tab="receipts"]'); await T.w(200);
    await p.click('[data-mode=moved]'); await T.w(200);
    ck(w + ': from Main bank, To is Savings and Wallet', JSON.stringify(await opts(p, '#rcTo')) === '["Savings","Wallet"]', JSON.stringify(await opts(p, '#rcTo')));
    await p.$eval('#rcAmt', e => { e.value = '30000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await selByText(p, '#rcFrom', 'Savings'); await T.w(200);
    ck(w + ': from Savings, To is Main bank and Wallet', JSON.stringify(await opts(p, '#rcTo')) === '["Main bank","Wallet"]', JSON.stringify(await opts(p, '#rcTo')));
    ck(w + ': From stays Savings', (await p.$eval('#rcFrom', e => e.options[e.selectedIndex].textContent)) === 'Savings');
    ck(w + ': the amount typed is kept', (await p.$eval('#rcAmt', e => e.value)).replace(/\D/g, '') === '30000');
    await selByText(p, '#rcFrom', 'Wallet'); await T.w(200);
    ck(w + ': from Wallet, To is Main bank and Savings', JSON.stringify(await opts(p, '#rcTo')) === '["Main bank","Savings"]', JSON.stringify(await opts(p, '#rcTo')));
    await selByText(p, '#rcFrom', 'Savings'); await T.w(200);
    await selByText(p, '#rcTo', 'Main bank'); await T.w(100);
    await p.click('#rcSave'); await T.w(400);
    const r = await p.evaluate(async day => { const s = await BurrowStore.open(); const bk = (await s.load()).copy; if (s.db) s.db.close(); const r = BurrowEngine.lookahead.lookahead(bk, day); return Object.fromEntries(Object.keys(r.accounts).map(id => [bk.accounts.find(a => a.id === id).name, r.accounts[id].bank])); }, DAY);
    ck(w + ': Savings to Main bank 30,000: Main bank 316,000, Savings 70,000, Wallet 20,000', r['Main bank'] === 316000 && r.Savings === 70000 && r.Wallet === 20000, JSON.stringify(r));
    ck(w + ': no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_moved2');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
