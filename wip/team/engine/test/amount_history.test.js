'use strict';
// [AMOUNT_HISTORY_PLAN, coordinator 15 ruled (a), 16 ruled build after whichdoor] An amount corrected after the bank check
// that first holds it: the amount it had at that check counts in its own period, the change counts in the check's
// period, where it only explains part of the check's gap. Removal after the check is a correction to 0. MAKO_SAYS M36,
// M44, M45, M61; the person (M98): a 700 lunch found to be 7,000 a week later, after a check and a new pay period.
// Made-up yen, Mako's shape as engine/test/check_gap_whole.test.js: pay 300,000 on the 10th, Free to spend 60,000, a
// 5,000 spend on 5 Dec, the bank matched on 6 Dec. A 700 lunch on 8 Dec, logged that day (after the 6 Dec check, so the
// 13 Dec check is the first that holds it). 13 Dec, pay ticked, the bank typed as the app expects: 594,300 (295,000 -
// 700 + 300,000), no gap. Periods: 10 Nov to 9 Dec (closed by then) and from 10 Dec.
//   Before the correction: old period 5,700; this period 0; Free to spend left 60,000.
//   14 Dec the lunch is corrected to 7,000 (the door keeps was: [{ a: 700, told }]). The bank figure stays 594,300, so
//   the 13 Dec check's gap is now 6,300 more than the records (-6,300). Ruled: the old period keeps its 700 (5,700),
//   this period gets the change +6,300 and the gap -6,300: still 0 spent, 60,000 left. Today (before the slice) the
//   7,000 counts in the closed period (11,700) and the gap -6,300 here: 66,300 left, safe to spend UP 6,300.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), P = require('../periods.js'), IDS = require('../ids.js');
const TZ = '+09:00', T14 = '2026-12-14T09:00:00.000' + TZ, T9 = '2026-12-09T09:00:00.000' + TZ;

function life(fix) {
  const newId = IDS.idMaker('h3s7qa');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [], bills: [], free: 60000 }, { newId });
  let book = out.book || out;
  const bank = book.accounts.find(a => a.type !== 'card').id;
  const spend = (id, a, date, told) => book.events.push({ id, k: 'spend', acct: bank, a, date, line: 'free', note: 'shop', src: { type: 'typed' }, told: told + TZ, at: told + TZ });
  const check = (day, fig) => {
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000' + TZ, newId, figures: { [bank]: fig }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  spend('sp5dec', 5000, '2026-12-05', '2026-12-05T18:00:00.000');
  check('2026-12-06', 295000);
  spend('lunch8', 700, '2026-12-08', '2026-12-08T13:00:00.000');
  if (fix && fix.before) fix.before(book.events.find(e => e.id === 'lunch8'));
  check('2026-12-13', fix && fix.bank13 || 594300);
  if (fix && fix.after) fix.after(book.events.find(e => e.id === 'lunch8'));
  return { book, bank };
}
const view = (book, day) => { const p = P.periods(book, day); return { old: p.past[p.past.length - 1].free.spent, now: p.current.free.spent, safe: LA.lookahead(book, day).safeToSpend.headline, r: LA.lookahead(book, day) }; };
const fix = (e, a, told) => { e.was = (e.was || []).concat([{ a: e.a, told }]); e.a = a; e.at = told; };

t('before any correction: old period 5,700, this period 0, 60,000 left', () => {
  const v = view(life().book, '2026-12-14');
  eq([v.old, v.now, v.safe], [5700, 0, 60000]);
});
t('the 700 lunch corrected to 7,000 on 14 Dec, after the 13 Dec check: the old period keeps 5,700, safe to spend stays 60,000', () => {
  const { book, bank } = life({ after: e => fix(e, 7000, T14) }), v = view(book, '2026-12-14');
  eq([v.old, v.now, v.safe], [5700, 0, 60000]);
  eq(v.r.accounts[bank].bank, 594300);   // the bank today stays the checked figure
});
t('removed on 14 Dec instead: a correction to 0, the old period keeps 5,700, this period 0, 60,000', () => {
  const { book } = life({ after: e => { fix(e, e.a, T14); e.was[e.was.length - 1] = { a: 700, told: T14 }; e.gone = '2026-12-14'; e.goneBy = 'stepx'; } }), v = view(book, '2026-12-14');
  eq([v.old, v.now, v.safe], [5700, 0, 60000]);
});
t('corrected on 9 Dec, before any check holds it: the 7,000 is the old period\'s, the 13 Dec check matches 588,000', () => {
  const { book } = life({ before: e => fix(e, 7000, T9), bank13: 588000 }), v = view(book, '2026-12-14');
  eq([v.old, v.now, v.safe], [12000, 0, 60000]);
});
t('two corrections, 700 to 900 on 9 Dec, then 900 to 7,000 on 14 Dec: 900 stays in the old period, the rest explains the gap', () => {
  const { book } = life({ before: e => fix(e, 900, T9), bank13: 594100, after: e => fix(e, 7000, T14) }), v = view(book, '2026-12-14');
  eq([v.old, v.now, v.safe], [5900, 0, 60000]);
});
t('in every order the records can arrive in', () => {
  const { book } = life({ after: e => fix(e, 7000, T14) });
  for (const f of [l => l.reverse(), l => l.sort((x, y) => (x.id < y.id ? -1 : 1))]) {
    const v = view(Object.assign({}, book, { events: f(book.events.slice()) }), '2026-12-14');
    eq([v.old, v.now, v.safe], [5700, 0, 60000]);
  }
});
done('amount_history.test.js');
