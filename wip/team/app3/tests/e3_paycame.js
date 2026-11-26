#!/usr/bin/env node
/* When did the pay come in? (qc-numbers monthrule2 blocker 1b, coordinator's ruling 26 Nov: way c; M31, M38, M44).
   Person: Mako checks weekly, so he often ticks a pay days after it came. Made-up Mako book, opened Mon 14 Dec: Main job
   and Side job were due Thu 10 Dec. At Check your bank each pay ticked after its due day asks "When did it come in?" with
   "Thu 10 Dec (the due day)" picked, "Today, Mon 14 Dec" and "Another day" (a date box). A bill or a card payment never
   asks. One tap on Today dates the pay 14 Dec, so the period starts 14 Dec; Another day 12 Dec dates it 12 Dec; the due
   day left as it is dates it 10 Dec, as before. 390 px. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const I = require('../../engine/ids.js');
const DAY = '2026-12-14';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
(async () => {
  const bk0 = T.book(), nm = it => (bk0.schedules.find(s => s.id === I.scheduleOf(it)) || bk0.accounts.find(a => a.id === I.scheduleOf(it)) || {}).name;
  for (const pick of ['due', 'today', 'other']) {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3paycame-');
    const { b, p, errs } = await T.open({ profile: prof, w: 390 });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk0);
    await p.reload(); await T.w(400);
    await p.click('#a3CheckGo'); await T.w(300);
    const asks = await p.$$eval('[data-camein]', xs => xs.map(x => ({ item: x.dataset.camein, q: x.querySelector('legend, .a3-q').textContent, opts: [...x.querySelectorAll('[data-came]')].map(b => [b.textContent, b.getAttribute('aria-pressed')]) })));
    const named = asks.map(a => nm(a.item)).sort();
    ck(pick + ': the two pays ask, nothing else does', JSON.stringify(named) === '["Main job","Side job"]', JSON.stringify(named));
    const main = asks.find(a => nm(a.item) === 'Main job');
    ck(pick + ': the question and its three answers, the due day picked', main && main.q === 'When did it come in?' && JSON.stringify(main.opts) === JSON.stringify([['Thu 10 Dec (the due day)', 'true'], ['Today, Mon 14 Dec', 'false'], ['Another day', 'false']]), JSON.stringify(main));
    ck(pick + ': no date box until Another day', !(await p.$(`[data-camein="${main.item}"] input[type=date]:not([hidden])`)));
    if (pick === 'today') await p.click(`[data-camein="${main.item}"] [data-came=today]`);
    if (pick === 'other') {
      await p.click(`[data-camein="${main.item}"] [data-came=other]`); await T.w(100);
      ck('other: the date box shows', !!(await p.$(`[data-camein="${main.item}"] input[type=date]:not([hidden])`)));
      await p.$eval(`[data-camein="${main.item}"] input[type=date]`, e => { e.value = '2026-12-12'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    }
    await p.tap('[data-bankfig]'); await p.keyboard.type('500000');
    await p.click('#a3CheckSave'); await T.w(500);
    const bk = await saved(p), want = { due: '2026-12-10', today: '2026-12-14', other: '2026-12-12' }[pick];
    const rec = bk.events.find(e => e.k === 'in' && (e.settles || []).some(s => s.s + '@' + s.due === main.item));
    ck(pick + ': Main job is dated ' + want, rec && rec.date === want, JSON.stringify(rec));
    const per = T.L.lookahead(bk, DAY).period;
    ck(pick + ': the period starts ' + want, per && per.start === want, JSON.stringify(per && [per.start, per.end]));
    ck(pick + ': no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_paycame');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
