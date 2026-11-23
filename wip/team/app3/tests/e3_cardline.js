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
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_cardline');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
