#!/usr/bin/env node
/* A check-in remembers what it listed (LISTED_PLAN rules 1 to 3 and N3; M36, M37, M44, M45, M98).
   Person: Mako told the assistant on Sun 13 Dec "my bank shows 286,000" and said he didn't know about Rent, so that
   figure was saved with nothing listed. On Mon 14 Dec he opens Check your bank. Made-up Mako book.
   1. Each row of an item in or out of Main (card payments from Main too) due before that figure asks "What day does your bank app show next to it?", "I don't know"
      picked; no "When did it come in?" and no "Landed on" beside it.
   2. Saved as it is: Rent is dated 14 Dec, the day after the 13 Dec figure (the safe side), and the saved check-in lists
      every row of the sheet (rule 3).
   3. "Pick the day" 27 Nov: Rent is dated 27 Nov, inside the 13 Dec figure.
   4. A book with no such figure asks nothing new, and its check-in still lists every row. 390 px. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const I = require('../../engine/ids.js');
const W = require('../../engine/checkin.js');
const DAY = '2026-12-14', FIG = '2026-12-13';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
(async () => {
  const bk0 = T.book(), nm = it => (bk0.schedules.find(s => s.id === I.scheduleOf(it)) || bk0.accounts.find(a => a.id === I.scheduleOf(it)) || {}).name;
  const main = bk0.accounts.find(a => a.type !== 'card' && /main/i.test(a.name)) || bk0.accounts.find(a => a.type !== 'card');
  const nid = I.idMaker('t3lst7');
  const withFig = W.apply(bk0, W.checkIn(bk0, { day: FIG, told: FIG + 'T12:00:00.000+09:00', newId: nid, figures: { [main.id]: 286000 }, listed: [] }));
  for (const run of ['unsure', 'day', 'plain']) {
    const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3listed-');
    const { b, p, errs } = await T.open({ profile: prof, w: 390 });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, run === 'plain' ? bk0 : withFig);
    await p.reload(); await T.w(400);
    await p.click('#a3CheckGo'); await T.w(300);
    const rows = await p.$$eval('.a3-tick', xs => xs.map(x => x.dataset.item));
    const asks = await p.$$eval('[data-dayask]', xs => xs.map(x => ({ item: x.dataset.dayask, q: x.querySelector('legend').textContent, sub: x.querySelector('.a3-sub').textContent, opts: [...x.querySelectorAll('[data-dayk]')].map(b => [b.textContent, b.getAttribute('aria-pressed')]) })));
    const rent = rows.find(it => nm(it) === 'Rent');
    if (run === 'plain') {
      ck('plain: no row asks the day', asks.length === 0, JSON.stringify(asks));
    } else {
      const mainRows = rows.filter(it => { const s = bk0.schedules.find(x => x.id === I.scheduleOf(it)), c = bk0.accounts.find(x => x.id === I.scheduleOf(it)); return (s && s.acct === main.id) || (c && c.payFrom === main.id); });
      ck(run + ': every row paid in or out of Main (card payments too) asks the day', mainRows.length > 0 && JSON.stringify(asks.map(a => a.item).sort()) === JSON.stringify(mainRows.sort()), JSON.stringify([asks.map(a => nm(a.item)), mainRows.map(nm)]));
      const a = asks.find(x => x.item === rent);
      ck(run + ': the question, its two answers, I don\'t know picked', a && a.q === 'What day does your bank app show next to it?' && JSON.stringify(a.opts) === JSON.stringify([["I don't know", 'true'], ['Pick the day', 'false']]) && /13 Dec/.test(a.sub), JSON.stringify(a));
      ck(run + ': no other day question beside it', !(await p.$('[data-camein]')) && !(await p.$('[data-landed]')));
      if (run === 'day') {
        await p.click(`[data-dayask="${rent}"] [data-dayk=day]`); await T.w(100);
        await p.$eval(`[data-dayask="${rent}"] input[type=date]`, e => { e.value = '2026-11-27'; e.dispatchEvent(new Event('change', { bubbles: true })); });
      }
    }
    await p.click('#a3CheckSave'); await T.w(500);
    const bk = await saved(p);
    const ci = bk.checkins.filter(c => c.date === DAY).pop();
    ck(run + ': the saved check-in lists every row of the sheet', ci && JSON.stringify((ci.listed || []).slice().sort()) === JSON.stringify(rows.slice().sort()), JSON.stringify(ci));
    const rec = bk.events.find(e => e.id === 'set:' + rent);
    const want = { unsure: DAY, day: '2026-11-27', plain: '2026-11-27' }[run];
    ck(run + ': Rent is dated ' + want, rec && rec.date === want, JSON.stringify(rec));
    ck(run + ': no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_listed');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
