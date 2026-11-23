#!/usr/bin/env node
/* Receipts' Money in (slice 6): money that is not a pay or a refund, like a client payment or a gift, logged through the
   page on a kept made-up book (e3_act_book.js) on 25 Nov 2026. It goes into one of the person's own accounts (never a
   card), raises that account by the amount, shows in the list as "Money in", opens again as Money in to change, and is
   still there after a reload. Every figure is the engine's on the book the page saved. Made-up yen. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const { actBook, WALLET } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const bk0 = actBook(), bank = bk0.home.main.v.acct;
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
const rows = p => p.$$eval('#rcList [data-rc]', rs => rs.map(r => ({ id: r.dataset.rc, text: r.textContent.replace(/\s+/g, ' ').trim() })));
const homeBank = (p, id) => p.$eval(`#a3Home [data-card=bank][data-acct="${id}"] [data-fig=bank] [data-amt]`, e => Number(e.dataset.amt));
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3in-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk0);
  await p.reload(); await T.w(400);
  const r0 = T.L.lookahead(bk0, DAY);
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  await p.tap('[data-mode=in]'); await T.w(150);
  ck('Money in: its own heading', /client payment or a gift/.test(await p.$eval('#rcForm h2', e => e.textContent)));
  const opts = await p.$$eval('#rcAcct option', os => os.map(o => o.textContent));
  ck('Money in: it comes into your own accounts, never a card', opts.length > 1 && !opts.some(o => /Card/.test(o)), opts.join(','));
  ck('Money in: no "what it was for"', !(await p.$('#rcFor')));
  await p.$eval('#rcAmt', e => { e.value = '25000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.$eval('#rcNote', e => { e.value = 'client payment'; });
  await p.tap('#rcSave'); await T.w(500);
  let bk = await saved(p);
  const e = bk.events.find(x => x.note === 'client payment');
  ck('saved as money in to the main bank', e && e.k === 'in' && !e.sub && e.acct === bank && e.a === 25000, JSON.stringify(e));
  let list = await rows(p);
  ck('the list shows it as Money in', list.some(x => x.id === e.id && /^Money in/.test(x.text)), JSON.stringify(list));
  await p.tap('[data-tab="home"]'); await T.w(200);
  let r = T.L.lookahead(bk, DAY);
  ck('Home: the bank is up by 25,000, as the engine says', (await homeBank(p, bank)) === r0.accounts[bank].bank + 25000 && r.accounts[bank].bank === r0.accounts[bank].bank + 25000);
  /* a gift in cash, into the wallet */
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  await p.tap('[data-mode=in]'); await T.w(150);
  await p.$eval('#rcAmt', e => { e.value = '5000'; }); await p.select('#rcAcct', WALLET); await p.$eval('#rcNote', e => { e.value = 'birthday gift'; });
  await p.tap('#rcSave'); await T.w(500);
  bk = await saved(p);
  ck('a gift into the wallet', bk.events.some(x => x.note === 'birthday gift' && x.acct === WALLET && x.k === 'in' && x.a === 5000));
  /* tapped, it opens as Money in; changed to 30,000 */
  await p.tap(`[data-rc="${e.id}"] button`); await T.w(250);
  ck('tapped, it opens as Money in with its amount', (await p.$eval('[data-mode=in]', x => x.getAttribute('aria-pressed'))) === 'true' && (await p.$eval('#rcAmt', x => x.value)).replace(/\D/g, '') === '25000');
  await p.$eval('#rcAmt', x => { x.value = '30000'; }); await p.tap('#rcSave'); await T.w(500);
  bk = await saved(p);
  ck('changed in place to 30,000', bk.events.filter(x => x.note === 'client payment' && !x.gone).map(x => [x.id, x.a]).join() === [e.id, 30000].join());
  await p.reload(); await T.w(400);
  r = T.L.lookahead(bk, DAY);
  ck('after a reload: the bank is up by 30,000', (await homeBank(p, bank)) === r0.accounts[bank].bank + 30000 && r.accounts[bank].bank === r0.accounts[bank].bank + 30000);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_moneyin');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
