#!/usr/bin/env node
/* The north-star review's small fixes (NS-FIX), made-up Mako book.
   - The background glow is drawn on the whole page, so at 1280 wide it never ends in a hard edge beside "This pay
     period" (/tmp/qc/north-star/rs_1280.png): it sits on the page itself, as tall as everything on it, not on a layer
     fixed to one screen's height.
   - The cards box shows the day each card's figure was checked ("checked 20 Nov"), and after a card figure is typed
     at a check-in on 23 Nov, "checked 23 Nov".
   - Home has "Log a spend": it opens Receipts' own log form (no second form), with the amount box ready.
   - A "?" beside safe to spend, the status line and the pay period (with why its dates moved for a weekend or a
     holiday) opens one or two plain lines from the one help piece, screens/help.js. */
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
    return { img: /radial-gradient/.test(st.backgroundImage), layer: before.content === 'none' || before.position !== 'fixed', tall: html.getBoundingClientRect().height >= html.scrollHeight - 1, scroll: html.scrollHeight, inner: document.getElementById('a3').scrollHeight };
  });
  ck('the glow is on the page itself, as tall as the page, with no layer fixed to one screen', glow.img && glow.layer && glow.tall && glow.scroll >= 800 && glow.inner > 800, JSON.stringify(glow));   // since the message band has its own slot the long page scrolls inside #a3: the document is one screen tall and the glow, on the document, covers all of it
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
  /* [NS-FIX 5] a "?" with one or two plain lines beside safe to spend, the status line, the pay period (and why its
     dates moved), from the one help piece (screens/help.js); the heading's own words stay as they were */
  const H = require('../../screens/help.js');
  await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(400);
  const helpOf = card => p.evaluate(c => { const b = document.querySelector(`[data-card=${c}] .burrow-help`), t = document.querySelector(`[data-card=${c}] .burrow-help-text`); return b ? { btn: b.textContent, open: b.getAttribute('aria-expanded'), shown: t && !t.hidden, text: t ? t.textContent : null, head: document.querySelector(`[data-card=${c}] h2`).textContent } : null; }, card);
  let h = await helpOf('safe');
  ck('safe to spend has a "?" with its lines hidden, beside an unchanged heading', h && h.btn === '?' && h.open === 'false' && !h.shown && h.head === 'Safe to spend until next pay on 10 Dec', JSON.stringify(h));
  await p.click('[data-card=safe] .burrow-help'); await T.w(100); h = await helpOf('safe');
  ck('a tap opens the lines: the help piece\'s words', h.shown && h.open === 'true' && h.text === H.words('safeToSpend').join(' '), JSON.stringify(h));
  await p.click('[data-card=safe] .burrow-help'); await T.w(100); h = await helpOf('safe');
  ck('a second tap closes them', !h.shown && h.open === 'false', JSON.stringify(h));
  h = await helpOf('period');
  ck('the pay period has its "?", and on 23 Nov nothing moved', h && h.text === H.words('period').join(' '), JSON.stringify(h));
  /* a kept book: the status line has its "?"; on 5 Jan the next pay is due 10 Jan (a Sunday) and lands Fri 8 Jan, the working day before */
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-');
  const k = await T.open({ profile: prof });
  await k.p.goto(T.URL0 + '?today=2026-12-10'); await T.w(300);
  await k.p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk);
  await k.p.reload(); await T.w(400);
  await k.p.click('#a3CheckGo'); await T.w(300); await k.p.tap('[data-bankfig]'); await k.p.keyboard.type('387,400'); await k.p.click('#a3CheckSave'); await T.w(400);
  await k.p.goto(T.URL0 + '?today=2027-01-05'); await T.w(400);
  const ks = await k.p.evaluate(() => ({ st: (document.querySelector('[data-card=status] .burrow-help-text') || {}).textContent, per: (document.querySelector('[data-card=period] .burrow-help-text') || {}).textContent }));
  ck('the status line has its "?"', ks.st === H.words('status').join(' '), JSON.stringify(ks));
  ck('the pay period says why its dates moved: due 10 Jan, lands 8 Jan', ks.per === H.words('period').concat(H.words('periodMoved', { due: '10 Jan', landed: '8 Jan' })).join(' '), JSON.stringify(ks));
  ck('no page errors (kept book)', k.errs.length === 0, k.errs.join(' | '));
  await k.b.close();
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_ns');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
