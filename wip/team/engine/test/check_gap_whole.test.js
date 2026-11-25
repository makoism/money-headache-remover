'use strict';
// [CHECKGAP] The gap a check finds goes WHOLE to the period the check is in (coordinator 15's ruling, 26 Nov 2026,
// replacing BZ1's and CARDGAP's by-days sharing; DECISIONS_ROUND2 section CHECKGAP). A closed period is never changed
// by it. A spend told after the check and dated before it only explains part of that gap (the gap shrinks by it), so
// it counts in the check's period and never moves safe to spend up. The bank today stays the checked figure. The same
// for a card check. MAKO_SAYS M11 (logs weekly), M36, M37, M44, M45, M38.
// Found by qc-numbers on lane/monthrule (qc_reports/2026-11-26_monthrule2, blocker 3): a 1,000 gain at a check made
// "spent -143" this period and moved a closed period from 5,000 to 4,143; a forgotten spend raised safe to spend.
//
// Made-up yen, Mako's shape: one bank, pay 300,000 on the 10th, a card paid on the 10th (close day not sure, owes
// nothing), Free to spend 60,000. Periods: 10 Nov to 9 Dec (closed by 13 Dec), and from 10 Dec.
//    5 Dec  a 5,000 spend from the bank on Free to spend: the old period's spent is 5,000
//    6 Dec  bank checked at 295,000, card at 0: no gap
//   10 Dec  pay 300,000 lands
//   13 Dec  pay ticked; the app expects 595,000; the person types 596,000: 1,000 more than expected.
//           The stretch 7 to 13 Dec crosses the 10th; by days it was 3 of 7 old (-429) and 4 of 7 new (-571).
//           Ruled: all 1,000 is this period's: spent -1,000, Free to spend left 61,000; the old period stays 5,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), P = require('../periods.js'), IDS = require('../ids.js');
const TZ = '+09:00';

function life(o) {
  o = o || {};
  const newId = IDS.idMaker('w4c8zt');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'card1', name: 'Card A', owed: 0, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 60000 }, { newId });
  let book = out.book || out;
  const card = book.accounts.find(a => a.type === 'card').id, bank = book.accounts.find(a => a.type !== 'card').id;
  const spend = (id, acct, a, date, told) => book.events.push({ id, k: 'spend', acct, a, date, line: 'free', note: 'shop', src: { type: 'typed' }, told: told + TZ, at: told + TZ });
  const check = (day, figures) => {
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000' + TZ, newId, figures, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  spend('sp5dec', bank, 5000, '2026-12-05', '2026-12-05T18:00:00.000');
  if (o.cardSpend) spend('cs8dec', card, o.cardSpend, '2026-12-08', '2026-12-08T18:00:00.000');
  check('2026-12-06', { [bank]: 295000, [card]: 0 });
  check('2026-12-13', { [bank]: o.bank13 != null ? o.bank13 : 596000, [card]: o.card13 || 0 });
  for (const s of o.late || []) spend(s.id, s.acct === 'card' ? card : bank, s.a, s.date, s.told);
  if (o.order) book = Object.assign({}, book, { events: o.order(book.events.slice()) });
  return { book, card, bank };
}
const view = (book, day) => { const p = P.periods(book, day); return { old: p.past[p.past.length - 1], now: p.current, r: LA.lookahead(book, day) }; };

t('the periods are 10 Nov to 9 Dec and from 10 Dec', () => {
  const { old, now } = view(life().book, '2026-12-13');
  eq([old.end, now.start], ['2026-12-09', '2026-12-10']);
});
t('case 1: 1,000 more than expected at the 13 Dec check is all this period\'s: spent -1,000, never a by-days share', () => {
  const { book, bank } = life(), { now, r } = view(book, '2026-12-13');
  const f = r.accounts[bank].fillers.slice(-1)[0];
  eq(f.amount, -1000);
  eq(f.parts.map(p => [p.from, p.amount]), [['2026-12-13', -1000]]);   // one part, on the check's own day
  eq(now.free.spent, -1000);
  eq(now.free.left, 61000);
  eq(r.safeToSpend.headline, 61000);
});
t('case 2: the closed period keeps its 5,000 (by days it became 4,571)', () => {
  eq(view(life().book, '2026-12-13').old.free.spent, 5000);
});
t('case 1 in every order the records can arrive in', () => {
  const orders = [e => e.reverse(), e => e.sort((x, y) => (x.id < y.id ? -1 : 1)), e => e.sort((x, y) => (String(x.date) < String(y.date) ? 1 : -1))];
  for (const order of orders) { const v = view(life({ order }).book, '2026-12-13'); eq([v.old.free.spent, v.now.free.spent], [5000, -1000]); }
});
t('case 3: a forgotten 6,300 spend dated 8 Dec, told on 14 Dec, only explains part of the gap: safe to spend, the closed period and the bank do not move', () => {
  const before = view(life().book, '2026-12-14');
  const { book, bank } = life({ late: [{ id: 'late8', acct: 'bank', a: 6300, date: '2026-12-08', told: '2026-12-14T09:00:00.000' }] });
  const after = view(book, '2026-12-14');
  eq(after.r.accounts[bank].fillers.slice(-1)[0].amount, -7300);   // the gap grows by it: 7,300 more than the records say
  eq(after.r.accounts[bank].bank, 596000);                          // the bank today is still the checked figure
  eq(after.old.free.spent, before.old.free.spent);                  // 5,000 both
  eq(after.now.free.spent, before.now.free.spent);                  // -1,000 both
  eq(after.r.safeToSpend.headline, before.r.safeToSpend.headline);  // 61,000 both
  ok(after.r.safeToSpend.headline <= 61000);
});
t('case 3, dated in the closed period before an earlier check in it (3 Dec, before the 6 Dec check): it stays in that period, which nets to 5,000', () => {
  const { book } = life({ late: [{ id: 'late3', acct: 'bank', a: 6300, date: '2026-12-03', told: '2026-12-14T09:00:00.000' }] });
  const v = view(book, '2026-12-14');
  eq([v.old.free.spent, v.now.free.spent, v.r.safeToSpend.headline], [5000, -1000, 61000]);
});
t('a spend told after the check and dated after it is new spending this period, as always', () => {
  const { book } = life({ late: [{ id: 'new14', acct: 'bank', a: 2000, date: '2026-12-14', told: '2026-12-14T09:00:00.000' }] });
  const v = view(book, '2026-12-14');
  eq([v.old.free.spent, v.now.free.spent, v.r.safeToSpend.headline], [5000, 1000, 59000]);
});
// ---- the card twin ----
// The bank matches on 13 Dec (595,000) and Card A, which the app thinks owes nothing, is checked at 1,000: 1,000 of
// spending not logged over 7 to 13 Dec. All of it is this period's: spent 1,000, 59,000 left; the old period keeps 5,000.
t('card twin of case 1: a card check\'s 1,000 gap is all this period\'s, the closed period keeps 5,000', () => {
  const { book, card } = life({ bank13: 595000, card13: 1000 }), v = view(book, '2026-12-13');
  const f = v.r.cards[card].fillers.slice(-1)[0];
  eq(f.amount, 1000);
  eq(f.parts.map(p => [p.from, p.amount]), [['2026-12-13', 1000]]);
  eq([v.old.free.spent, v.now.free.spent, v.r.safeToSpend.headline], [5000, 1000, 59000]);
  eq(v.r.cards[card].owedNow, 1000);
});
t('card twin of case 3: a 400 card spend dated 8 Dec told after the card check explains part of its gap, nothing moves', () => {
  const { book, card } = life({ bank13: 595000, card13: 1000, late: [{ id: 'latec', acct: 'card', a: 400, date: '2026-12-08', told: '2026-12-14T09:00:00.000' }] });
  const v = view(book, '2026-12-14');
  eq(v.r.cards[card].fillers.slice(-1)[0].amount, 600);
  eq(v.r.cards[card].owedNow, 1000);
  eq([v.old.free.spent, v.now.free.spent, v.r.safeToSpend.headline], [5000, 1000, 59000]);
});
t('a card spend logged on time (8 Dec, before the check) stays in its own period when the check matches', () => {
  const { book } = life({ bank13: 595000, card13: 2000, cardSpend: 2000 }), v = view(book, '2026-12-13');
  eq([v.old.free.spent, v.now.free.spent], [7000, 0]);
});
t('every gap\'s parts add up to the gap, one part on the check\'s day', () => {
  for (const o of [{}, { bank13: 595000, card13: 1000 }, { late: [{ id: 'l', acct: 'bank', a: 6300, date: '2026-12-08', told: '2026-12-14T09:00:00.000' }] }]) {
    const r = LA.lookahead(life(o).book, '2026-12-14');
    for (const kind of ['accounts', 'cards']) for (const id of Object.keys(r[kind])) for (const f of r[kind][id].fillers || []) {
      eq(f.parts.reduce((s, p) => s + p.amount, 0), f.amount);
      for (const p of f.parts) ok(p.from === p.to && p.days === 1, JSON.stringify(p));
    }
  }
});
done('check_gap_whole.test.js');
