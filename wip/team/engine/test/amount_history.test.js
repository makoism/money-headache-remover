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
const view = (book, day) => { const p = P.periods(book, day); return { old: p.past.length ? p.past[p.past.length - 1].free.spent : null, now: p.current.free.spent, safe: LA.lookahead(book, day).safeToSpend.headline, r: LA.lookahead(book, day) }; };
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
// [AMOUNT_HISTORY_PLAN 4] the engine names each split so Receipts can list the record in its own period at its amount at
// the check and the change as its own row in the check's period: { id, check, atCheck, after, more, less, told } (more and less: the change as a positive amount, for the words)
t('res.splits: the correction after the 13 Dec check names 700 at the check and +6,300 after, changed on 14 Dec', () => {
  const { book } = life({ after: e => fix(e, 7000, T14) });
  eq(LA.lookahead(book, '2026-12-14').splits, [{ id: 'lunch8', check: '2026-12-13', atCheck: 700, after: 6300, more: 6300, less: 0, told: '2026-12-14' }]);
});
t('res.splits: a removal after the check is a correction to 0 (-700); none before a correction or for one made before the check', () => {
  const rm = life({ after: e => { e.was = [{ a: 700, told: T14 }]; e.gone = '2026-12-14'; e.goneBy = 'stepx'; } }).book;
  eq(LA.lookahead(rm, '2026-12-14').splits, [{ id: 'lunch8', check: '2026-12-13', atCheck: 700, after: -700, more: 0, less: 700, told: '2026-12-14' }]);
  eq(LA.lookahead(life().book, '2026-12-14').splits, []);
  eq(LA.lookahead(life({ before: e => fix(e, 7000, T9), bank13: 588000 }).book, '2026-12-14').splits, []);
});
t('res.splits: two corrections, 900 stood at the check, +6,100 after', () => {
  const { book } = life({ before: e => fix(e, 900, T9), bank13: 594100, after: e => fix(e, 7000, T14) });
  eq(LA.lookahead(book, '2026-12-14').splits, [{ id: 'lunch8', check: '2026-12-13', atCheck: 900, after: 6100, more: 6100, less: 0, told: '2026-12-14' }]);
});
// [coordinator 16, ruling (a)] a removed record is held only by a check written BEFORE the removal: removed on 9 Dec,
// before the 13 Dec check (which then matches the bank without it, 595,000), it counts nowhere: the old period keeps
// 5,000, nothing minus today, safe to spend 60,000
t('removed before any check held it, then a new check: nothing in the closed period, nothing minus today', () => {
  const { book } = life({ before: e => { e.was = [{ a: 700, told: T9 }]; e.gone = '2026-12-09'; e.goneBy = 'stepx'; }, bank13: 595000 }), v = view(book, '2026-12-14');
  eq([v.old, v.now, v.safe], [5000, 0, 60000]);
  eq(v.r.splits, []);
});
// [coordinator ruled (A), qc-foundation confirm2 on CHECKFIX point FB] a bank check's figure corrected later counts its
// change on the day of the fix in both gaps beside that check: plus in the gap before it, minus in the gap after it;
// with a later check the two cancel; when the fixed check is the latest, only the plus part, in the fix's period.
// Kenji, made-up yen: set up 24 Nov, bank 200,000 (C0), pay 300,000 on the 10th, Free to spend 100,000 (from the setup
// day 100,000 x 16 / 30 = 53,333 in the first period). Nothing logged.
//   C1 5 Dec typed 182,400 (really 128,400): the first period spent 17,600.
//   C2 12 Dec, pay ticked, 182,400 + 300,000 - 62,400 = 420,000: this period spent 62,400, left 37,600.
//   Fixed 14 Dec to 128,400: the first period stays 17,600; this period 62,400 + 54,000 (plus, C1's gap, on 14 Dec)
//   - 54,000 (minus, C2's gap, on 14 Dec) = 62,400; safe to spend unchanged. Today nothing reads a check's was:
//   71,600 and 8,400, safe to spend up 54,000.
function kenji(withC2, fixDay, which) {
  const newId = IDS.idMaker('k3n7ji');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 200000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [], bills: [], free: 100000 }, { newId });
  let book = out.book || out;
  const bank = book.accounts.find(a => a.type !== 'card').id;
  const check = (day, fig) => {
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000' + TZ, newId, figures: { [bank]: fig }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  check('2026-12-05', 182400);
  if (withC2) check('2026-12-12', 420000);
  const c = d => book.events.find(e => e.k === 'check' && e.date === d && !e.gone);
  const before = view(book, fixDay);
  if (which === 'c2') fix(c('2026-12-12'), 410000, fixDay + 'T09:00:00.000' + TZ); else fix(c('2026-12-05'), 128400, fixDay + 'T09:00:00.000' + TZ);
  return { before, after: view(book, fixDay), bank, book };
}
t('[ruling (A)] a check in the closed period fixed, a later check in this one (Kenji): 17,600 and 62,400 stay, safe to spend unchanged', () => {
  const { before, after } = kenji(true, '2026-12-14');
  eq([before.old, before.now], [17600, 62400]);
  eq([after.old, after.now, after.safe], [17600, 62400, before.safe]);
});
t('[ruling (A)] the fixed check is the latest (C2 420,000 fixed to 410,000 on 14 Dec): only the plus part, 10,000 more spent this period; the closed period stays 17,600', () => {
  const k = kenji(true, '2026-12-14', 'c2'), { before, after, bank } = k;
  eq([after.old, after.now, after.safe], [17600, 72400, before.safe - 10000]);
  eq(after.r.accounts[bank].bank, 410000);   // the bank today is the fixed figure
});
t('[ruling (A)] the check and its fix in the same period (C1 fixed on 7 Dec, no later check): spent as if 128,400 was typed, 71,600', () => {
  const { before, after } = kenji(false, '2026-12-07');
  eq([before.now, after.now], [17600, 71600]);
});
done('amount_history.test.js');
