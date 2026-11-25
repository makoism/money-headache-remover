#!/usr/bin/env node
/* Pay day in two steps (slice 6, G4): on a pay day whose pay covers what leaves that day, safe to spend counts the pay,
   and the bank's lowest point is the start of the day, so the sum alone reads only "bank today". Home then shows the
   pay and what it covers as their own steps, ending at the bank at the end of the day. Made-up yen: Main bank ¥286,000
   set up Wed 9 Dec 2026; Main job ¥180,000 and Side job ¥60,000 land Thu 10 Dec; Card A ¥54,000 comes out that day.
   10 Dec: 286,000 + 180,000 + 60,000 - 54,000 = 472,000 at the end of the day. Safe to spend stays 286,000 (G4).
   No play amount is set, so the cards-now walk is used (R1): Card A's 54,000 is everything owed now and comes off
   today, which is also its payment day, so every figure is the same as before; only its step is named "owed now"
   (was "all owed", the dated walk's name for a card with no close day). The lowest point is still the start of the
   day, 286,000, so safe to spend is unchanged.
   9 Dec: nothing lands that day, so no such line. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const path = require('path');
const B = require(path.join(__dirname, '../../engine/build_book.js')), I = require(path.join(__dirname, '../../engine/ids.js'));
const { book } = B.buildBook({ day: '2026-12-09', told: '2026-12-09T10:00:00+09:00', currency: 'JPY', country: 'JP',
  banks: [{ key: 'b', name: 'Main bank', amount: 286000 }],
  pays: [{ key: 'p1', name: 'Main job', bank: 'b', amount: 180000, day: 10, shift: 'before', startsPeriod: true }, { key: 'p2', name: 'Side job', bank: 'b', amount: 60000, day: 10, shift: 'before' }],
  cards: [{ key: 'c1', name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'b', shift: 'after' }] }, { newId: I.idMaker('pdy5k2') });
const today = p => p.$eval('#a3Home [data-fig=today]', e => e.textContent.replace(/[⁠\s]+/g, ' ').trim()).catch(() => null);
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3pd-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=2026-12-09'); await T.w(300);
  await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, book);
  await p.reload(); await T.w(400);
  ck('9 Dec: no "Today" line (nothing lands)', (await today(p)) === null);
  await p.goto(T.URL0 + '?today=2026-12-10'); await T.w(400);
  const line = await today(p);
  // old "Card A, all owed"; now "Card A, owed now": no play amount, so the cards-now walk names the step (R1); the figures are the same
  ck('10 Dec: the pay and the card payment as their own steps, to the end of the day',
    line === 'Today: ¥286,000 (Main bank today) + ¥180,000 (Main job 10 Dec) + ¥60,000 (Side job 10 Dec) − ¥54,000 (Card A, owed now, paid 10 Dec) = ¥472,000 at the end of the day. Safe to spend counts on this pay coming in today', line);
  const f = await T.figs(p), safe = f.find(x => x.fig === 'safe');
  ck('10 Dec: safe to spend is still 286,000 (G4)', safe && safe.amt === 286000, JSON.stringify(safe));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_payday');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
