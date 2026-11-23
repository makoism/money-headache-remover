#!/usr/bin/env node
/* A card with an overdue payment never says "Nothing to pay yet" (numbers review S2). The made-up Mako book on 11 Dec
   with no check-in since setup: card A's 54,000 of 10 Dec is not ticked. Home's card A line names that payment, the
   same one the overdue list shows; on 10 Dec (not overdue yet) it still says when it comes out. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
(async () => {
  const bk = T.book(), cardA = bk.accounts.find(a => a.name === 'Card A').id;
  const { b, p, errs } = await T.open();
  await p.goto(T.URL0 + '?try=mako&today=2026-12-11'); await T.w(400);
  const r = T.L.lookahead(bk, '2026-12-11');
  ck('the engine has card A\'s 10 Dec payment overdue, and nothing next yet', r.cards[cardA].overdue.length === 1 && r.cards[cardA].overdue[0].amount === 54000 && !(r.cards[cardA].next && r.cards[cardA].next.amount), JSON.stringify(r.cards[cardA]));
  const line = await p.$eval(`[data-cardid="${cardA}"] .when`, e => e.textContent);
  ck('card A\'s line does not say nothing to pay yet', !/Nothing to pay yet/.test(line), line);
  ck('it names the overdue payment: 54,000 due 10 Dec', /¥54,000/.test(line) && /10 Dec/.test(line), line);
  await p.goto(T.URL0 + '?try=mako&today=2026-12-10'); await T.w(400);
  const line10 = await p.$eval(`[data-cardid="${cardA}"] .when`, e => e.textContent);
  ck('on 10 Dec it still says when it comes out', line10 === 'Comes out on 10 Dec, the day your pay lands', line10);
  /* [BL5] a card paid more than it owed: set up Mon 23 Nov with Visa 30,000 paid on the 24th, ticked at Check your bank
     on 25 Nov with 31,500. Visa is 1,500 in credit: Home and Plan say "in credit ¥1,500", never as owed or with a minus */
  {
    const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js'), newId = I.idMaker('bl5crd', () => 0.5);
    const built = B.buildBook({ day: '2026-11-23', told: '2026-11-23T09:00+09:00', country: 'JP', currency: 'JPY',
      banks: [{ key: 'b', name: 'Main bank', amount: 300000 }],
      pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: 200000, day: 25, shift: 'none', startsPeriod: true }],
      cards: [{ key: 'visa', name: 'Visa', owed: 30000, payDay: 24, closeDay: 'not sure', payFrom: 'b', shift: 'none' }] }, { newId });
    const bk2 = built.book, visa = built.ids.visa;
    bk2.events.push({ id: newId(), k: 'repay', acct: built.ids.b, acct2: visa, a: 31500, a2: 31500, date: '2026-11-24', told: '2026-11-25T09:00+09:00', at: '2026-11-25T09:00+09:00', by: 'bl5crd', settles: [{ s: visa, due: '2026-11-24' }] });
    const rr = T.L.lookahead(bk2, '2026-11-25');
    ck('BL5: the engine has Visa 1,500 in credit', rr.cards[visa].owedNow === -1500 && rr.cards[visa].credit === 1500, JSON.stringify(rr.cards[visa]));
    await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk2);
    await p.goto(T.URL0 + '?today=2026-11-25'); await T.w(500);
    const row = (await p.$eval(`[data-cardid="${visa}"]`, e => e.textContent)).replace(/⁠/g, '');
    ck('BL5: Home says in credit ¥1,500, no minus', /in credit ¥1,500/.test(row) && !/−/.test(row), row);
    await p.$eval('[data-tab=plan]', el => el.click()); await T.w(500);
    const prow = (await p.$eval(`[data-owed="${visa}"]`, e => e.textContent)).replace(/⁠/g, '');
    ck('BL5: Plan says in credit ¥1,500, never still owed', /in credit ¥1,500/.test(prow) && !/still owed/i.test(prow) && !/−/.test(prow), prow);
    /* [BM4] Check your bank writes it the way Home does: "Expected now in credit ¥1,500", never "−¥1,500" */
    await p.$eval('[data-tab=home]', el => el.click()); await T.w(300);
    await p.click('#a3CheckGo'); await T.w(500);
    const exp = (await p.$eval(`[data-expected="${visa}"]`, e => e.textContent).catch(() => '')).replace(/\u2060/g, '');
    ck('BM4: Check your bank says Expected now in credit ¥1,500, no minus', /^Expected now in credit ¥1,500/.test(exp) && !/−/.test(exp), exp);
  }
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_cardline');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
