#!/usr/bin/env node
/* [ENDPERIOD ruling 5, slice 0 part 2] A goal that has given out more than it holds: the question in Settings offers only
   what can be done, and "count this spend as everyday money instead" for a spend made from the goal. Made-up yen on the
   made-up Mako book (fixtures), 10 Dec: a goal Trip holding 9,000 (an adjust), a 12,000 spend from Trip on 9 Dec.
   Trip is 3,000 over. Nothing to undo (no move out of it), so no Undo button is offered; one button counts the spend as
   everyday money (written through the door, with Undo): then the spend is on Free to spend, the question is gone, and
   Undo puts it back on Trip with the question. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const DAY = '2026-12-10', TOLD = '2026-12-09T20:00:00.000+09:00';
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct, by = 'q8w3hz';
  const st = r => Object.assign(r, { told: TOLD, at: TOLD, by });
  bk.places = bk.places || [];
  bk.places.push(st({ id: by + '-trip0goal1-1', name: 'Trip', kind: 'goal', target: 200000, cur: 'JPY', keptIn: { acct: bank, mode: 'inBank' } }));
  bk.events.push(st({ id: by + '-trip0goal1-2', k: 'adjust', date: '2026-12-01', a: 9000, acct: bank, place: by + '-trip0goal1-1', src: { type: 'typed' } }));
  bk.events.push(st({ id: by + '-trip0goal1-3', k: 'spend', date: '2026-12-09', a: 12000, acct: bank, place: by + '-trip0goal1-1', note: 'hotel', src: { type: 'typed' } }));
  const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-') }), p = o.p;
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async x => { const s = await BurrowStore.open(); await s.save(x, { full: true }); s.db && s.db.close(); }, bk);
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
  await p.click('#a3SetGo'); await T.w(400);
  const q = () => p.evaluate(() => { const b = document.querySelector('[data-cloudq="shares"]'); return b ? { text: b.textContent.replace(/\s+/g, ' ').trim(), picks: [...b.querySelectorAll('[data-pick]')].map(x => [x.dataset.pick, x.textContent.trim()]) } : null; });
  const ev = () => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); s.close(); const e = r.copy.events.find(x => x.id === 'q8w3hz-trip0goal1-3'); return { place: e.place || null, line: e.line || null }; });
  let x = await q();
  ck('the question shows, naming Trip and the 3,000 it is over', !!x && /Trip/.test(x.text) && /¥3,000/.test(x.text), JSON.stringify(x));
  ck('only what can be done: one button, count the spend as everyday money', !!x && JSON.stringify(x.picks) === JSON.stringify([['spends', 'Count the spend as everyday money instead']]), JSON.stringify(x && x.picks));
  await p.click('[data-cloudq="shares"] [data-pick="spends"]'); await T.w(500);
  ck('the spend is on Free to spend, its goal taken off', JSON.stringify(await ev()) === JSON.stringify({ place: null, line: 'free' }), JSON.stringify(await ev()));
  ck('the question is gone', !(await q()));
  await p.click('#a3Msg .burrow-msg button'); await T.w(500);
  ck('Undo puts the spend back on Trip, and the question with it', JSON.stringify(await ev()) === JSON.stringify({ place: 'q8w3hz-trip0goal1-1', line: null }) && !!(await q()), JSON.stringify(await ev()));
  await o.b.close();
  ck('no page errors', !o.errs.length, o.errs.join(' | '));
  T.done('e3_goalover');
})().catch(e => { console.error(e); process.exit(1); });
