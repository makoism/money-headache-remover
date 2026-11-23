#!/usr/bin/env node
/* The north-star review's small fixes (NS-FIX), made-up Mako book.
   - The background glow is drawn on the whole page, so at 1280 wide it never ends in a hard edge beside "This pay
     period" (/tmp/qc/north-star/rs_1280.png): it sits on the page itself, as tall as everything on it, not on a layer
     fixed to one screen's height.
   - The cards box shows the day each card's figure was checked ("checked 20 Nov"), and after a card figure is typed
     at a check-in on 23 Nov, "checked 23 Nov".
   - Home has "Log a spend": it opens Receipts' own log form (no second form), with the amount box ready. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
(async () => {
  const bk = T.book(), cardA = bk.accounts.find(a => a.name === 'Card A').id, cardB = bk.accounts.find(a => a.name === 'Card B').id;
  const { b, p, errs } = await T.open({ w: 1280, h: 800 });
  /* the glow */
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(400);
  const glow = await p.evaluate(() => {
    const html = document.documentElement, st = getComputedStyle(html), before = getComputedStyle(document.body, '::before');
    return { img: /radial-gradient/.test(st.backgroundImage), layer: before.content === 'none' || before.position !== 'fixed', tall: html.getBoundingClientRect().height >= html.scrollHeight - 1, scroll: html.scrollHeight };
  });
  ck('the glow is on the page itself, as tall as the page, with no layer fixed to one screen', glow.img && glow.layer && glow.tall && glow.scroll > 800, JSON.stringify(glow));
  /* the day each card figure was checked */
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const checked = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cardid]')].map(e => [e.dataset.cardid, (e.querySelector('[data-fig=cardchecked]') || {}).textContent || null])));
  let c = await checked();
  ck('each card says when its figure was checked: 20 Nov at setup', c[cardA] === 'checked 20 Nov' && c[cardB] === 'checked 20 Nov', JSON.stringify(c));
  await p.click('#a3CheckGo'); await T.w(300);
  await p.tap('[data-bankfig]'); await p.keyboard.type('286,000');
  await p.tap(`[data-cardfig="${cardB}"]`); await p.keyboard.type('23,500');
  await p.click('#a3CheckSave'); await T.w(400);
  c = await checked();
  ck('card B typed on 23 Nov says checked 23 Nov; card A still 20 Nov', c[cardB] === 'checked 23 Nov' && c[cardA] === 'checked 20 Nov', JSON.stringify(c));
  /* Log a spend from Home: Receipts' own form (one form in the page), ready to type */
  await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(400);
  const go = await p.$('#a3LogGo');
  ck('Home has "Log a spend"', !!go && (await p.$eval('#a3LogGo', e => e.textContent)) === 'Log a spend');
  if (go) { await p.click('#a3LogGo'); await T.w(300); }
  const at = await p.evaluate(() => ({ rc: !document.getElementById('a3Rc').hidden, home: document.getElementById('a3Home').hidden, head: (document.querySelector('#rcForm h2') || {}).textContent, focus: document.activeElement && document.activeElement.id, forms: document.querySelectorAll('#rcAmt').length, tab: (document.querySelector('[data-tab][aria-current]') || {}).textContent }));
  ck('it opens Receipts\' log form, the one form, with the amount box ready', at.rc && at.home && at.head === 'Log a spend' && at.focus === 'rcAmt' && at.forms === 1 && at.tab === 'Receipts', JSON.stringify(at));
  await p.keyboard.type('1200'); await p.click('#rcSave'); await T.w(400);
  ck('and the spend is logged through it', /Logged \u00a51,200 on Free to spend/.test(await p.evaluate(() => (document.querySelector('#a3Msg .burrow-msg span') || {}).textContent || '')));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_ns');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
