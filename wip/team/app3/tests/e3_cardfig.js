#!/usr/bin/env node
/* A card's figure typed at a check-in (DECISIONS.md "Mako's own money": what is on each card now, typed like the bank
   figure). Check your bank asks "What is on <card> now?" for each card, optional: blank means not checked. A typed figure
   is written through the engine check-in writer as a check on the card, so Home's card owed, due before next pay and
   safe to spend all follow it.
   1. US dollars, made-up numbers. Set up 1 Dec: Checking $2,000.00, pay $1,500.00 on the 10th, rent $900.00 on the 15th,
      Visa owing $300.25 paid on the 5th from Checking (close day not sure, so each payment is all owed). Away until
      16 Dec, card spending not logged. At the 16 Dec check-in everything is ticked, Checking shows $1,500.00 and the Visa
      $812.40. Worked by hand: Visa owed $812.40, all of it comes out on 5 Jan, before the next pay on 10 Jan, so due
      before next pay is $812.40 and safe to spend is $1,500.00 - $812.40 = $687.60. Left blank, the Visa is not checked
      and the app still says it owes nothing.
   2. Mako's shape (the made-up try book), the 10 Dec check-in: card B typed as 31,500 (it was 23,000 at setup). Card B
      owes 31,500 and all of it leaves on 11 Dec; every figure is the engine's for the same records. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const E = '../../engine/';
const B = require(E + 'build_book.js'), W = require(E + 'checkin.js'), I = require(E + 'ids.js');
const DAY = '2026-12-16';
function usBook() {
  return B.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00-05:00', country: 'US', currency: 'USD',
    banks: [{ key: 'chk', name: 'Checking', amount: 200000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 150000, day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'cc', name: 'Visa', owed: 30025, payDay: 5, closeDay: 'not sure', payFrom: 'chk', shift: 'none' }],
    bills: [{ key: 'rent', name: 'Rent', from: 'chk', amount: 90000, day: 15, shift: 'none' }] }, { newId: I.idMaker('usd001', () => 0.3) });
}
const owedOn = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cardid]')].map(e => [e.dataset.cardid, { amt: Number(e.querySelector('[data-fig=owed] [data-amt]').dataset.amt), text: e.textContent }])));
async function keptPage(bk, day) {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
  const o = await T.open({ profile: prof });
  await o.p.goto(T.URL0 + '?today=' + day); await T.w(300);
  const saved = await o.p.evaluate(async bk0 => { const s = await BurrowStore.open(); const r = await s.save(bk0, { full: true }); s.db && s.db.close(); return r; }, bk);
  ck('the made-up book is saved through the store', saved && saved.ok, JSON.stringify(saved));
  await o.p.reload(); await T.w(400);
  return o;
}
(async () => {
  /* ---- 1. US dollars, away until 16 Dec ---- */
  {
    const { book: bk, ids } = usBook();
    const { b, p, errs } = await keptPage(bk, DAY);
    await p.click('#a3CheckGo'); await T.w(300);
    const label = await p.evaluate(id => { const el = document.querySelector(`[data-cardfig="${id}"]`); return el ? document.querySelector(`label[for="${el.id}"]`).textContent : null; }, ids.cc);
    ck('Check your bank asks what is on the Visa now', label === 'What is on Visa now?', label);
    ck('it starts blank', await p.$eval(`[data-cardfig="${ids.cc}"]`, e => e.value) === '');
    await p.tap(`[data-bankfig="${ids.chk}"]`); await p.keyboard.type('1,500.00');
    /* left blank first: saved, the Visa is not checked */
    const blank = await p.evaluate(() => { const items = [...document.querySelectorAll('.a3-tick')].map(r => r.dataset.item); return items; });
    ck('the list holds the 10 Dec pay, the 15 Dec rent and the 5 Dec Visa payment', blank.length === 3, blank.join(','));
    await p.tap(`[data-cardfig="${ids.cc}"]`); await p.keyboard.type('812.40');
    await p.click('#a3CheckSave'); await T.w(500);
    ck('the sheet closed', await p.$eval('#a3Check', e => e.hidden));
    const f = await T.figs(p), one = k => f.filter(x => x.fig === k);
    const owed = await owedOn(p);
    ck('Home: the Visa owes $812.40 (the typed figure)', owed[ids.cc] && owed[ids.cc].amt === 81240 && /\$812\.40/.test(owed[ids.cc].text), JSON.stringify(owed[ids.cc]));
    ck('Home: it comes out on 5 Jan', owed[ids.cc] && /5 Jan/.test(owed[ids.cc].text), owed[ids.cc] && owed[ids.cc].text);
    const dueRows = await p.$$eval('[data-card=due] [data-figure="dueBeforeNextPay.items"]', es => es.map(e => Number(e.dataset.amt)));
    ck('Home: due before next pay holds the Visa payment, $812.40', JSON.stringify(dueRows) === '[81240]' && one('duetotal')[0] && one('duetotal')[0].amt === 81240, JSON.stringify(dueRows) + ' ' + JSON.stringify(one('duetotal')));
    ck('Home: safe to spend is $1,500.00 - $812.40 = $687.60', one('safe')[0] && one('safe')[0].amt === 68760 && one('safe')[0].text === '$687.60', JSON.stringify(one('safe')));
    /* the same records written in node */
    const r0 = T.L.lookahead(bk, DAY), li = r0.checkIn.toConfirm;
    const out = W.checkIn(bk, { day: DAY, told: DAY + 'T12:00-05:00', newId: I.idMaker('usd002', () => 0.4), figures: { [ids.chk]: 150000, [ids.cc]: 81240 }, ticked: li.map(o => o.item),
      amounts: {}, expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) });
    const r = T.L.lookahead(W.apply(bk, out), DAY);
    ck('and those are the engine\'s figures for the same records', r.cards[ids.cc].owedNow === 81240 && r.safeToSpend.headline === 68760 && r.dueBeforeNextPay.total === 81240, JSON.stringify([r.cards[ids.cc].owedNow, r.safeToSpend.headline, r.dueBeforeNextPay.total]));
    const kept = await p.evaluate(async () => { const s = await BurrowStore.open(); const k = await s.load(); s.close(); return k.copy.events.filter(e => e.k === 'check' && e.date === '2026-12-16').map(e => ({ acct: e.acct, a: e.a, grp: e.grp })); });
    ck('the card figure is kept as a check on the card, in the same check-in as the bank figure', kept.length === 2 && kept.some(e => e.acct === ids.cc && e.a === 81240) && kept[0].grp === kept[1].grp, JSON.stringify(kept));
    await T.shot(p, 'cardfig_us_' + DAY);
    ck('no page errors (US)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- 1b. the same, with the card left blank: not checked, nothing written for it ---- */
  {
    const { book: bk, ids } = usBook();
    const { b, p, errs } = await keptPage(bk, DAY);
    await p.click('#a3CheckGo'); await T.w(300);
    await p.tap(`[data-bankfig="${ids.chk}"]`); await p.keyboard.type('1,500.00');
    await p.click('#a3CheckSave'); await T.w(500);
    ck('blank card: the sheet closed', await p.$eval('#a3Check', e => e.hidden));
    const kept = await p.evaluate(async () => { const s = await BurrowStore.open(); const k = await s.load(); s.close(); return k.copy.events.filter(e => e.k === 'check' && e.date === '2026-12-16').map(e => e.acct); });
    ck('blank card: only the bank is checked', JSON.stringify(kept) === JSON.stringify([ids.chk]), JSON.stringify(kept));
    ck('no page errors (blank)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* ---- 2. Mako's shape: card B typed at the 10 Dec check-in ---- */
  {
    const D2 = '2026-12-10', bk = T.book(), bank = bk.home.main.v.acct;
    const cardB = bk.accounts.find(a => a.name === 'Card B').id;
    const { b, p, errs } = await T.open();
    await p.goto(T.URL0 + '?try=mako&today=' + D2); await T.w(400);
    await p.click('#a3CheckGo'); await T.w(300);
    const asks = await p.$$eval('[data-cardfig]', es => es.map(e => document.querySelector(`label[for="${e.id}"]`).textContent));
    ck('Mako: both cards are asked, each optional', JSON.stringify(asks) === JSON.stringify(['What is on Card A now?', 'What is on Card B now?']), JSON.stringify(asks));
    await p.tap('[data-bankfig]'); await p.keyboard.type('339,000');
    await p.tap(`[data-cardfig="${cardB}"]`); await p.keyboard.type('31,500');
    await p.click('#a3CheckSave'); await T.w(400);
    ck('Mako: the sheet closed', await p.$eval('#a3Check', e => e.hidden));
    const r0 = T.L.lookahead(bk, D2), li = r0.checkIn.toConfirm;
    const out = W.checkIn(bk, { day: D2, told: D2 + 'T12:00+09:00', newId: I.idMaker('t3stdv', () => 0.2), figures: { [bank]: 339000, [cardB]: 31500 }, ticked: li.map(o => o.item), amounts: {},
      expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) });
    const r = T.L.lookahead(W.apply(bk, out), D2), f = await T.figs(p), one = k => f.filter(x => x.fig === k);
    const owed = await owedOn(p);
    ck('Mako: card B owes the typed 31,500', owed[cardB] && owed[cardB].amt === 31500 && r.cards[cardB].owedNow === 31500, JSON.stringify(owed[cardB]));
    ck('Mako: and all of it leaves on 11 Dec', r.cards[cardB].next.amount === 31500 && /on 11 Dec/.test(owed[cardB].text), JSON.stringify(r.cards[cardB].next) + ' ' + owed[cardB].text);
    ck('Mako: safe to spend is the engine\'s with the card figure', one('safe')[0].amt === r.safeToSpend.headline, one('safe')[0].amt + ' vs ' + r.safeToSpend.headline);
    const without = T.L.lookahead(W.apply(bk, W.checkIn(bk, { day: D2, told: D2 + 'T12:00+09:00', newId: I.idMaker('t3stdv', () => 0.2), figures: { [bank]: 339000 }, ticked: li.map(o => o.item), amounts: {},
      expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) })), D2);
    ck('Mako: the 8,500 more on card B comes off safe to spend', without.safeToSpend.headline - r.safeToSpend.headline === 8500, without.safeToSpend.headline + ' ' + r.safeToSpend.headline);
    ck('no page errors (Mako)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_cardfig');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
