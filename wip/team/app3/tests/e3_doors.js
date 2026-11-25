#!/usr/bin/env node
/* Receipts' two doors (MAKO_SAYS M22: "One simple door: Money came in and Money went out"). At 320 px wide on a kept
   made-up book (e3_act_book.js), 25 Nov 2026: the form opens on two main doors, "Money went out" and "Money came in",
   side by side, whole and in view, each at least 44 px high; Refund and Moved sit under them as smaller choices, still at
   least 44 px to tap. Their ids are the same as before (data-mode spend, in, refund, moved) and so are the records they
   save. One of each door is walked to a saved record: 1,800 out of the main bank, 12,000 into the main bank. Made-up yen. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const bk0 = actBook(), bank = bk0.home.main.v.acct;
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3doors-');
  const { b, p, errs } = await T.open({ profile: prof, w: 320, h: 640 });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk0);
  await p.reload(); await T.w(400);
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  const look = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#rcForm [data-mode]')].map(b => {
    const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
    return [b.dataset.mode, { text: b.textContent.trim(), x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, font: parseFloat(cs.fontSize), door: b.dataset.door === 'main', cut: b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1 }];
  })));
  const d = await look(), vw = await p.evaluate(() => document.documentElement.clientWidth);
  ck('320: the two main doors read Money went out and Money came in', d.spend && d.spend.text === 'Money went out' && d.in && d.in.text === 'Money came in', JSON.stringify(d));
  ck('320: they are the main doors', d.spend && d.spend.door && d.in.door && !d.refund.door && !d.moved.door, JSON.stringify(d));
  ck('320: side by side, whole and in view', d.spend && Math.abs(d.spend.y - d.in.y) < 2 && d.spend.x >= 0 && d.in.right <= vw && !d.spend.cut && !d.in.cut, JSON.stringify(d));
  ck('320: Refund and Moved sit under them', d.refund && d.refund.text === 'Refund' && d.moved && d.moved.text === 'Moved' && d.refund.y > d.spend.y + d.spend.h - 1 && d.moved.y > d.in.y + d.in.h - 1 && d.moved.right <= vw && !d.refund.cut && !d.moved.cut, JSON.stringify(d));
  ck('320: Refund and Moved are smaller choices', d.refund.font < d.spend.font && d.refund.h < d.spend.h, JSON.stringify([d.spend, d.refund]));
  ck('320: every one is at least 44 px to tap', Object.values(d).every(x => x.h >= 44 && x.w >= 44), JSON.stringify(d));
  ck('320: the page does not scroll sideways', await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth) <= document.documentElement.clientWidth));
  ck('Money went out is chosen when the form opens', (await p.$eval('[data-mode=spend]', e => e.getAttribute('aria-pressed'))) === 'true');

  /* Money went out: 1,800 from the main bank */
  await p.tap('[data-mode=spend]'); await T.w(150);
  await p.$eval('#rcAmt', e => { e.value = '1800'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.select('#rcAcct', bank); await p.$eval('#rcNote', e => { e.value = 'door out'; });
  await p.tap('#rcSave'); await T.w(500);
  let bk = await saved(p);
  const out = bk.events.find(x => x.note === 'door out');
  ck('Money went out saves a spend, the same record as before', out && out.k === 'spend' && out.acct === bank && out.a === 1800 && out.date === DAY, JSON.stringify(out));

  /* Money came in: 12,000 into the main bank */
  await p.tap('[data-mode=in]'); await T.w(150);
  ck('Money came in is chosen', (await p.$eval('[data-mode=in]', e => e.getAttribute('aria-pressed'))) === 'true');
  await p.$eval('#rcAmt', e => { e.value = '12000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.select('#rcAcct', bank); await p.$eval('#rcNote', e => { e.value = 'door in'; });
  await p.tap('#rcSave'); await T.w(500);
  bk = await saved(p);
  const inn = bk.events.find(x => x.note === 'door in');
  ck('Money came in saves money in, the same record as before', inn && inn.k === 'in' && !inn.sub && inn.acct === bank && inn.a === 12000 && inn.date === DAY, JSON.stringify(inn));
  await p.reload(); await T.w(400);
  bk = await saved(p);
  ck('both are still there after a reload', bk.events.some(x => x.note === 'door out') && bk.events.some(x => x.note === 'door in'));
  await T.shot(p, 'doors_320');
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_doors');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
