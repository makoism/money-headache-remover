#!/usr/bin/env node
/* The message band (Logged ... Undo, Saved, Changed) is on screen where the person is, at every size (qc-layout
   candidate 2, blocker 2; MAKO_SAYS M14 Undo everywhere, M52, M33; LESSONS lesson 2: the one band, screens/messages.js,
   never per screen). Before, the band sat at the top of the page: after "Log spend" from down a long Receipts page the
   Undo was above the screen and gone in 8 seconds.
   On a kept book (so the assistant's bar is there), at 390x844, 320x640, 1300x900 and 390x420 (the keyboard up):
   log a spend with the button at the foot of the screen, and change the last receipt of a long list. Each time the band
   and its Undo are whole inside the screen, the Undo is what a finger at its middle hits, the band is not over the
   button just pressed, the tabs or the assistant, and Undo works. Made-up numbers only. */
'use strict';
const L = require('./lives3.js').make('e3_band');
const { ck, w, go } = L;
const BOOK = require('../fixtures/mako_madeup_book.json');
const SIZES = [[390, 844], [320, 640], [1300, 900], [390, 420]];
const look = (p, was) => p.evaluate(was => {
  const box = e => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null; };
  const m = document.querySelector('#a3Msg .burrow-msg'), u = m && [...m.querySelectorAll('button')].find(b => b.textContent === 'Undo');
  const hit = (a, b) => !!(a && b && a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5 && a.right > b.left + 0.5 && a.left < b.right - 0.5);
  const rm = box(m), ru = box(u), W = document.documentElement.clientWidth, H = innerHeight;
  const inside = r => !!r && r.top >= 0 && r.left >= 0 && r.bottom <= H && r.right <= W;
  const at = ru && document.elementFromPoint((ru.left + ru.right) / 2, (ru.top + ru.bottom) / 2);
  return { text: m ? m.textContent : '', band: rm, undo: ru, H, W, bandIn: inside(rm), undoIn: inside(ru), tappable: !!u && at === u,
    overPressed: hit(rm, was), overTabs: hit(rm, box(document.querySelector('.a3-tabs'))), overChat: hit(rm, box(document.querySelector('#a3Chat'))) };
}, was);
const rows = p => p.$$eval('#a3Rc li[data-rc][data-k=spend]', es => es.length);
const rect = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; });
(async () => {
  for (const [W, H] of SIZES) {
    const at = `${W}x${H}`;
    const { c, p } = await L.open();
    await p.setViewportSize({ width: W, height: H });
    await go(p, '2026-11-24');
    await p.evaluate(async book => { const { E3, ACT3 } = BurrowApp3; await E3.fill(book); for (let i = 0; i < 24; i++) await ACT3.logSpend({ date: E3.today(), a: 500 + i, acct: E3.book.accounts[0].id, line: 'free' }); }, BOOK);
    await go(p, '2026-11-24');
    await p.click('[data-tab=receipts]'); await w(250);
    const n0 = await rows(p);
    ck(`${at}: a kept book with a long Receipts page, the assistant's bar showing`, n0 >= 24 && await p.$eval('#a3Chat', e => !e.hidden), n0);
    /* 1. log a spend, the button at the foot of the screen */
    await p.fill('#rcAmt', '1200');
    await p.$eval('#rcSave', e => { e.scrollIntoView({ block: 'end' }); const s = document.querySelector('#a3'), own = s.scrollHeight > s.clientHeight && getComputedStyle(s).overflowY === 'auto'; const gap = (own ? s.getBoundingClientRect().bottom : innerHeight) - e.getBoundingClientRect().bottom; if (own) s.scrollTop -= gap; else scrollBy(0, -gap); }); await w(150);   // the button at the very foot, where the band comes
    const was = await rect(p, '#rcSave');
    await p.mouse.click((was.left + was.right) / 2, (was.top + was.bottom) / 2); await w(400);
    let v = await look(p, await rect(p, '#rcSave'));
    ck(`${at}: Log spend: the band says Logged, with Undo`, /Logged/.test(v.text) && !!v.undo, JSON.stringify(v));
    ck(`${at}: Log spend: the band and its Undo are whole inside the screen`, v.bandIn && v.undoIn, JSON.stringify(v));
    ck(`${at}: Log spend: a finger on Undo hits Undo`, v.tappable, JSON.stringify(v));
    ck(`${at}: Log spend: the band is not over the button just pressed, the tabs or the assistant`, !v.overPressed && !v.overTabs && !v.overChat, JSON.stringify(v));
    ck(`${at}: Log spend: the spend is listed`, (await rows(p)) === n0 + 1, await rows(p));
    if (v.undo && v.undoIn) await p.mouse.click((v.undo.left + v.undo.right) / 2, (v.undo.top + v.undo.bottom) / 2); await w(450);
    ck(`${at}: Log spend: Undo takes it back`, (await rows(p)) === n0 && /Undone/.test((await look(p)).text), `${await rows(p)} ${(await look(p)).text}`);
    /* 2. change the last receipt of the list */
    await p.$eval('#a3Rc li[data-rc][data-k=spend]:last-of-type .a3-rcrow', e => e.scrollIntoView({ block: 'end' })); await w(150);
    await p.click('#a3Rc li[data-rc][data-k=spend]:last-of-type .a3-rcrow'); await w(350);
    await p.fill('#rcAmt', '777');
    await p.$eval('#rcSave', e => e.scrollIntoView({ block: 'end' })); await w(150);
    const was2 = await rect(p, '#rcSave');
    await p.mouse.click((was2.left + was2.right) / 2, (was2.top + was2.bottom) / 2); await w(400);
    v = await look(p, await rect(p, '#rcSave'));
    ck(`${at}: Save change: the band shows with Undo`, /hange/.test(v.text) && !!v.undo, JSON.stringify(v));
    ck(`${at}: Save change: the band and its Undo are whole inside the screen`, v.bandIn && v.undoIn, JSON.stringify(v));
    ck(`${at}: Save change: a finger on Undo hits Undo`, v.tappable, JSON.stringify(v));
    ck(`${at}: Save change: the band is not over the button just pressed, the tabs or the assistant`, !v.overPressed && !v.overTabs && !v.overChat, JSON.stringify(v));
    if (v.undo && v.undoIn) await p.mouse.click((v.undo.left + v.undo.right) / 2, (v.undo.top + v.undo.bottom) / 2); await w(450);
    ck(`${at}: Save change: Undo works`, /Undone/.test((await look(p)).text), (await look(p)).text);
    /* 3. the keyboard on a phone that does not make the page shorter: the part in sight is told by visualViewport.
       The band moves into that part (a stand-in visualViewport: the upper 300 of the screen in sight) */
    if (H === 844) {
      await p.evaluate(() => { const t = new EventTarget(); t.offsetTop = 0; t.height = 300; t.width = innerWidth; Object.defineProperty(window, 'visualViewport', { value: t, configurable: true }); });
      await p.fill('#rcAmt', '900'); await p.click('#rcSave'); await w(400);
      const k = await look(p);
      ck(`${at}: keyboard over the lower part: the band is inside the part still in sight`, !!k.band && k.band.top >= 0 && k.band.bottom <= 300.5 && !k.overTabs, JSON.stringify(k));
    }
    await c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL e3_band crashed ' + (e && e.stack || e)); process.exit(1); });
