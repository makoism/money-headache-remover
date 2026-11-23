#!/usr/bin/env node
/* The north-star review's small fixes (NS-FIX), made-up Mako book.
   - The background glow is drawn on the whole page, so at 1280 wide it never ends in a hard edge beside "This pay
     period" (/tmp/qc/north-star/rs_1280.png): it sits on the page itself, as tall as everything on it, not on a layer
     fixed to one screen's height. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
(async () => {
  const { b, p, errs } = await T.open({ w: 1280, h: 800 });
  /* the glow */
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(400);
  const glow = await p.evaluate(() => {
    const html = document.documentElement, st = getComputedStyle(html), before = getComputedStyle(document.body, '::before');
    return { img: /radial-gradient/.test(st.backgroundImage), layer: before.content === 'none' || before.position !== 'fixed', tall: html.getBoundingClientRect().height >= html.scrollHeight - 1, scroll: html.scrollHeight };
  });
  ck('the glow is on the page itself, as tall as the page, with no layer fixed to one screen', glow.img && glow.layer && glow.tall && glow.scroll > 800, JSON.stringify(glow));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_ns');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
