#!/usr/bin/env node
/* The north-star review's small fixes (NS-FIX), made-up Mako book.
   - The background glow is drawn on the whole page, so at 1280 wide it never ends in a hard edge beside "This pay
     period" (/tmp/qc/north-star/rs_1280.png): it sits on the page itself, as tall as everything on it, not on a layer
     fixed to one screen's height.
   - The cards box shows the day each card's figure was checked ("checked 20 Nov"), and after a card figure is typed
     at a check-in on 23 Nov, "checked 23 Nov". */
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
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_ns');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
