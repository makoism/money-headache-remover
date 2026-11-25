'use strict';
// Cards in the headline, built only where no play amount is in force (CARDS_IN_HEADLINE_PLAN.md sections 1 to 6, in
// the scope of CASH_PLAN.md sections 14 R1 and R5, 15, 16, 17; MAKO_SAYS M30, M40, M45, M77, M90, M91).
//   - No play amount (Free to spend) in force today: everything owed now on a card paid in full comes off today, in
//     place of its dated payment steps (never on top of them). A bill charged to the card and still to come stays on
//     its card's payment day.
//   - A play amount in force: every figure is what today's engine gives, byte for byte (the golden answers below).
//   - A dated Free to spend entry `free: 'none'` stops play money from the period holding its `from` (CASH_PLAN 17 F1).
//
// Every figure here is worked by hand in the comment beside it, never copied from the new engine. Made-up yen.
// Base life (cards plan section 4): Main bank 168,000, pay 300,000 on the 10th, set up Tue 24 Nov 2026, no bills, no
// minimum, no play amount, close days "not sure" unless said. Card A 54,000 paid on the 10th, Card B 23,000 on the
// 11th, Card C 12,000 on the 27th, all paid in full from Main bank, weekend rule none. Next pay Thu 10 Dec 2026.
//
// The independent checker (wip/team/checker/oracle_v2.js, kept on lane/checker-b) holds F14 for every life (each card
// statement on its payment day). It is not edited on this branch (LESSONS 4: one rule, not three copies), so
// run_against_checker.js differs from the engine on this rule by design, only in lives with a card paid in full and no
// play amount. The count is written in DIFFERS_BY_DESIGN below once the engine is built (slice 1, commit 4).
//
// Run with --write-golden to write fixtures/cards_golden.json from the engine as it is now. It was written once, from
// today's engine, before the change (commit 2), and is never written again by the new engine.
const fs = require('fs');
const path = require('path');
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), IDS = require('../ids.js');
const { ANSWERS } = require('./mako_madeup.js');
const { convert } = require('./scenario_to_book.js');
const STATUS = require('../../screens/status.js');

const GOLDEN = path.join(__dirname, 'fixtures', 'cards_golden.json');
const DIFFERS_BY_DESIGN = null;   // filled in commit 4: { seeds, asks } of run_against_checker that differ on this rule

/* ---- lives ---- */
const CARD = {
  A: { key: 'A', name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'main', shift: 'none' },
  B: { key: 'B', name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', payFrom: 'main', shift: 'none' },
  C: { key: 'C', name: 'Card C', owed: 12000, payDay: 27, closeDay: 'not sure', payFrom: 'main', shift: 'none' },
};
/* a seeded random, so the ids (and so the golden answers) are the same on every run */
const seeded = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
function life(answers, dev) {
  const newId = IDS.idMaker(dev || 'k3f9aq', seeded(dev === 'b3n7qz' ? 97 : 31));
  const out = BB.buildBook(answers, { newId });
  let book = out.book;
  const ids = out.ids;
  const api = {
    get book() { return book; }, ids, newId,
    add(list, rec) { book = Object.assign({}, book, { [list]: (book[list] || []).concat([rec]) }); return api; },
    spend(day, a, acctKey, extra) { return api.add('events', Object.assign({ id: newId(), k: 'spend', date: day, a, acct: ids[acctKey], told: day + 'T12:00:00.000+09:00', src: { type: 'typed' } }, extra || {})); },
    share(rec) { book = Object.assign({}, book, { plan: Object.assign({}, book.plan, { shares: book.plan.shares.concat([rec]) }) }); return api; },
    unshare(id) { book = Object.assign({}, book, { plan: Object.assign({}, book.plan, { shares: book.plan.shares.map(s => (s.id === id ? Object.assign({}, s, { gone: true }) : s)) }) }); return api; },
    /* a check-in on `day`: every item listed is ticked, the bank figure typed */
    check(day, figure, acctKey) {
      const r = LA.lookahead(book, day), expected = {}, lands = {};
      for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
      book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures: { [ids[acctKey || 'main']]: figure }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
      return api;
    },
    see(day, opts) { return LA.lookahead(book, day, opts); },
  };
  return api;
}
const base = o => life(Object.assign({ day: '2026-11-24', told: '2026-11-24T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
  banks: [{ key: 'main', name: 'Main bank', amount: 168000, main: true }].concat(o.banks || []),
  pays: o.pays || [{ key: 'pay', name: 'Pay', bank: 'main', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
  cards: (o.cards || []).map(c => (typeof c === 'string' ? CARD[c] : c)), bills: o.bills || [], free: o.free }, {}));
/* Mako's made-up shape (mako_madeup.js), set up Tue 24 Nov 2026: Phone (20 Nov) is already out of the 286,000 */
const mako = free => life(Object.assign({}, ANSWERS, { day: '2026-11-24', told: '2026-11-24T21:00+09:00' }, free != null ? { free } : {}));
/* Ben (CASH_PLAN scene 3, cut down): set up Sun 20 Dec 2026 on his pay day; Main bank 300,000; pay 230,000 on the 20th;
   Rent 80,000 on the 27th; Card A 30,000, paid in full on the 25th, close day not sure; play money 40,000 each pay */
const ben = () => life({ day: '2026-12-20', told: '2026-12-20T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
  banks: [{ key: 'main', name: 'Main bank', amount: 300000, main: true }],
  pays: [{ key: 'pay', name: 'Pay', bank: 'main', amount: 230000, every: 'month', day: 20, shift: 'none', startsPeriod: true }],
  cards: [{ key: 'A', name: 'Card A', owed: 30000, payDay: 25, closeDay: 'not sure', payFrom: 'main', shift: 'none' }],
  bills: [{ key: 'rent', name: 'Rent', from: 'main', amount: 80000, day: 27, shift: 'none' }], free: 40000 }, 'b3n7qz');
/* Kai (three_values.test.js), no fixed pay, with a card: Main bank 420,000, rent 85,000 on the 27th, everyday 60,000 a
   month, Card A 40,000 paid in full on the 10th, set up 1 Dec 2026 */
const kai = (bank, o) => life(Object.assign({ day: '2026-12-01', told: '2026-12-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
  banks: [{ key: 'main', name: 'Main bank', amount: bank, main: true }],
  pays: [{ key: 'pay', name: 'Work', bank: 'main', amount: null, every: 'none' }],
  cards: [{ key: 'A', name: 'Card A', owed: 40000, payDay: 10, closeDay: 'not sure', payFrom: 'main', shift: 'none' }],
  bills: [{ key: 'rent', name: 'Rent', from: 'main', amount: 85000, day: 27, shift: 'none' }], free: 60000 }, o || {}));
/* the cash-only lives of three_values.test.js: no card at all */
const cashOnly = (o) => life({ day: o.day, told: o.day + 'T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
  banks: [{ key: 'main', name: 'Main bank', amount: o.bank, main: true }].concat(o.cash ? [{ key: 'cash', name: 'Cash', type: 'cash', amount: o.cash }] : []),
  pays: [o.pay ? { key: 'pay', name: 'Pay', bank: 'main', amount: 300000, every: 'month', day: 25, shift: 'none', startsPeriod: true } : { key: 'pay', name: 'Work', bank: 'main', amount: null, every: 'none' }],
  cards: [], bills: [{ key: 'rent', name: 'Rent', from: 'main', amount: 85000, day: 27, shift: 'none' }], free: o.free });

const main = r => r.accounts[Object.keys(r.accounts).find(id => r.accounts[id].bank != null && r.accounts[id].spendFrom)];
const three = r => [r.safeToSpend.headline, r.canSpare.amount, r.noJob.amount];
const part = (r, label) => (main(r).whyParts.find(p => p.label === label) || {}).amount;
/* the one headline rule, in every life (cards plan 6 item 11) */
function ties(r) {
  const c = r.canSpare.amount, e = r.everyday;
  eq(r.safeToSpend.headline, e ? Math.max(0, Math.min(c, e.left)) : Math.max(0, c));
  eq(r.noJob.amount, Math.max(0, c - (e ? Math.max(0, e.left) : 0)));
}

/* ---- 1 and 2: Mako's shape, no play amount ---- */
t('Mako, 24 Nov, no play amount: 124,400, the cards named in the sum, bank after the cards 364,400 [M90, M30, M40]', () => {
  // 286,000 - 54,000 (Card A owed now, paid 10 Dec) - 23,000 (Card B owed now, paid 11 Dec) - 7,400 (Power 26 Nov)
  //   - 72,000 (Rent 27 Nov) - 5,200 (Internet 27 Nov) = 124,400, the lowest point before the pay of 10 Dec.
  // Bank after the cards (dated, BK6, unchanged): 286,000 - 84,600 + 240,000 (both pays 10 Dec) - 54,000 - 23,000 = 364,400
  const m = mako(), r = m.see('2026-11-24');
  eq(three(r), [124400, 124400, 124400]);
  eq(r.everyday, null);
  eq(part(r, 'Card A, owed now, paid 10 Dec'), -54000);
  eq(part(r, 'Card B, owed now, paid 11 Dec'), -23000);
  eq(r.bankAfterCards[m.ids.bank].amount, 364400);
  ties(r);
});
t('Mako, lunch 900 on Card A: 123,500, Card A owes 54,900, bank after the cards 363,500', () => {
  // 124,400 - 900 = 123,500 (the 900 is owed now on Card A: 54,000 + 900 = 54,900); BK6: 364,400 - 900 = 363,500
  const m = mako().spend('2026-11-24', 900, 'card_a'), r = m.see('2026-11-24');
  eq(three(r), [123500, 123500, 123500]);
  eq(r.cards[m.ids.card_a].owedNow, 54900);
  eq(part(r, 'Card A, owed now, paid 10 Dec'), -54900);
  eq(r.bankAfterCards[m.ids.bank].amount, 363500);
  ties(r);
});
t('the same answer with the records in nine orders (LESSONS 4 addendum)', () => {
  const m = mako().spend('2026-11-24', 900, 'card_a').spend('2026-11-24', 1200, 'bank').spend('2026-11-24', 300, 'card_b');
  // 124,400 - 900 (Card A) - 1,200 (from the bank) - 300 (Card B) = 122,000
  const ev = m.book.events;
  for (let k = 0; k < 9; k++) {
    const order = ev.map((e, i) => [((i + 1) * (k + 3) * 7919) % 104729, e]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    if (k % 2) order.reverse();
    eq(LA.lookahead(Object.assign({}, m.book, { events: order }), '2026-11-24').safeToSpend.headline, 122000);
  }
});

/* ---- 3: the double count cases (cards plan section 5) ---- */
t('case A, a card paid before the next pay: 79,000, Card C taken once', () => {
  // 168,000 - 54,000 (A) - 23,000 (B) - 12,000 (C, paid 27 Nov, before the pay) = 79,000. Today's engine: 156,000.
  // Bank after the cards (dated): 168,000 - 12,000 + 300,000 - 54,000 - 23,000 = 379,000 under both
  const L = base({ cards: ['A', 'B', 'C'] }), r = L.see('2026-11-24');
  eq(three(r), [79000, 79000, 79000]);
  eq(r.bankAfterCards[L.ids.main].amount, 379000);
  ties(r);
});
t('case B, both cards after the next pay: 91,000', () => {
  // 168,000 - 54,000 - 23,000 = 91,000 (today's engine 168,000). Bank after: 168,000 + 300,000 - 77,000 = 391,000
  const L = base({ cards: ['A', 'B'] }), r = L.see('2026-11-24');
  eq(three(r), [91000, 91000, 91000]);
  eq(r.bankAfterCards[L.ids.main].amount, 391000);
});
t('case C, 900 spent today on either card: 78,100 both ways', () => {
  // 79,000 - 900 = 78,100 on Card C (paid 27 Nov) and on Card A (paid 10 Dec). Today's: 155,100 and 156,000
  eq(base({ cards: ['A', 'B', 'C'] }).spend('2026-11-24', 900, 'C').see('2026-11-24').safeToSpend.headline, 78100);
  eq(base({ cards: ['A', 'B', 'C'] }).spend('2026-11-24', 900, 'A').see('2026-11-24').safeToSpend.headline, 78100);
});
t('case E, Card C ticked at a check-in on its day: 79,000 before and after', () => {
  // before, seen 27 Nov: 168,000 - 12,000 (C due today) - 54,000 - 23,000 = 79,000
  // after the tick with 156,000 typed: 156,000 - 54,000 - 23,000 = 79,000 (C owes 0 now)
  const L = base({ cards: ['A', 'B', 'C'] });
  eq(L.see('2026-11-27').safeToSpend.headline, 79000);
  eq(L.check('2026-11-27', 156000).see('2026-11-27').safeToSpend.headline, 79000);
});

/* ---- 5: other cards ---- */
t('a card in credit adds nothing: 114,000', () => {
  // Card D is 5,000 in credit (paid on the 20th): max(0, -5,000) = 0 taken. 168,000 - 54,000 (A) = 114,000
  const D = { key: 'D', name: 'Card D', owed: -5000, payDay: 20, closeDay: 'not sure', payFrom: 'main', shift: 'none' };
  eq(base({ cards: ['A', D] }).see('2026-11-24').safeToSpend.headline, 114000);
});
t('a card paid from Savings counts the same as one paid from Main: 591,000', () => {
  // Savings 500,000 pays Card A, Main pays Card B: (500,000 - 54,000) + (168,000 - 23,000) = 446,000 + 145,000 = 591,000.
  // Today's engine 614,000 (Card A already off Savings, which has no pay; Card B after Main's pay).
  const A = Object.assign({}, CARD.A, { payFrom: 'sav' });
  eq(base({ cards: [A, 'B'], banks: [{ key: 'sav', name: 'Savings', amount: 500000 }] }).see('2026-11-24').safeToSpend.headline, 591000);
});
t('a known close day: statement and not yet billed both owed now, 114,000, then 113,100 after 900', () => {
  // Card A closes on the 15th: 30,000 on the statement closed 15 Nov (paid 10 Dec), 24,000 not yet billed (paid 10 Jan).
  // 168,000 - 30,000 - 24,000 = 114,000; 900 spent today: 113,100 (today's engine 168,000 both)
  const A = Object.assign({}, CARD.A, { closeDay: 15, statement: 30000 });
  eq(base({ cards: [A] }).see('2026-11-24').safeToSpend.headline, 114000);
  eq(base({ cards: [A] }).spend('2026-11-24', 900, 'A').see('2026-11-24').safeToSpend.headline, 113100);
});
t('a card paid two months after its close, far out: 94,000', () => {
  // Card E 20,000, closes on the 5th, paid on the 27th two months after: 168,000 - 54,000 (A) - 20,000 (E) = 94,000
  const E = { key: 'E', name: 'Card E', owed: 20000, payDay: 27, closeDay: 5, payMonths: 2, payFrom: 'main', shift: 'none' };
  eq(base({ cards: ['A', E] }).see('2026-11-24').safeToSpend.headline, 94000);
});
t('a card that carries a balance stays dated: 168,000 (for Mako\'s run)', () => {
  // inFull false: its planned payment (10 Dec, after the pay) stays on its day, so the lowest point is today: 168,000
  const A = Object.assign({}, CARD.A, { inFull: false });
  eq(base({ cards: [A] }).see('2026-11-24').safeToSpend.headline, 168000);
});

/* ---- 6: paid weekly or every two weeks [R1] ---- */
t('paid weekly (Fridays, 80,000) with A and B: 91,000, nothing short', () => {
  // 168,000 - 54,000 - 23,000 = 91,000 today; every later step is a pay coming in. Today's engine 168,000
  const r = base({ cards: ['A', 'B'], pays: [{ key: 'pay', name: 'Pay', bank: 'main', amount: 80000, every: 'weeks', n: 1, start: '2026-11-27', shift: 'none', startsPeriod: true }] }).see('2026-11-24');
  eq(three(r), [91000, 91000, 91000]); eq(r.safeToSpend.shortfall, 0);
});
t('paid every two weeks (150,000) with A and B: 91,000, nothing short', () => {
  const r = base({ cards: ['A', 'B'], pays: [{ key: 'pay', name: 'Pay', bank: 'main', amount: 150000, every: 'weeks', n: 2, start: '2026-11-27', shift: 'none', startsPeriod: true }] }).see('2026-11-24');
  eq(three(r), [91000, 91000, 91000]); eq(r.safeToSpend.shortfall, 0);
});
t('Ramil (weekly.json), 2 Dec: the e-wallet 700 under, the cash covers it, headline 1,000, nothing short', () => {
  // E-wallet: 5,000 + 4,000 (27 Nov) - 1,500 (to cash 28 Nov) - 6,000 (rent 1 Dec) = 1,500; the card owes 2,000 now
  //   (paid 15 Dec): 1,500 - 2,000 - 200 (minimum) = -700 (the ask's alt.Q14).
  // Cash: 1,000 - 800 (22 Nov) + 1,500 (28 Nov) = 1,700, nothing due, minimum 0: 1,700.
  // Headline: 1,700 - 700 (the e-wallet's shortfall) = 1,000. The real walk is never under: short null.
  // (The cards plan's "headline 0, shortfall 700" left the cash out.) Today's engine: 1,300 + 1,700 = 3,000.
  const sc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'foundation_review', 'scenarios', 'weekly.json'), 'utf8'));
  const r = LA.lookahead(convert(sc).book, '2026-12-02');
  eq(r.accounts.ewallet.headroom, -70000);
  eq(r.accounts.cash.headroom, 170000);
  eq([r.safeToSpend.headline, r.safeToSpend.shortfall, r.safeToSpend.short], [100000, 0, null]);
});
t('cards alone take more than the bank can spare before pay: headline 0, short by the cards, status cards_over', () => {
  // Main bank 60,000 with A, B and C: 60,000 - 54,000 - 23,000 - 12,000 = -29,000: headline 0, shortfall 29,000.
  // The dated walk: 60,000 - 12,000 (C 27 Nov) = 48,000, then the pay of 10 Dec covers A and B: no shortfall, and the
  // real money never goes under (short null, no below-zero warning). So the reason is the cards, never "the plan".
  const L = life({ day: '2026-11-24', told: '2026-11-24T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'main', name: 'Main bank', amount: 60000, main: true }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'main', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [CARD.A, CARD.B, CARD.C], bills: [] });
  const r = L.see('2026-11-24');
  eq([r.safeToSpend.headline, r.safeToSpend.shortfall, r.safeToSpend.short], [0, 29000, null]);
  eq(r.warnings.filter(w => w.code === 'below_minimum'), []);
  eq(r.safeToSpend.cardsNow, { owed: 89000, datedShortfall: 0 });
  const s = STATUS.statusOf(r, { currency: 'JPY', origin: 'typed' });
  eq(s.state, 'cards_over');
  eq(s.reason.code, 'cards_over');
  eq(s.next, { code: 'set_play' });
});

/* ---- play amount set: nothing changes from today's engine ---- */
t('Free to spend 30,000 with A and B: headline 16,000, can spare 168,000 (as today) [R1 scope]', () => {
  // counts: 30,000 x 16 / 30 (24 Nov to 10 Dec of the period 10 Nov to 10 Dec) = 16,000; can spare: the lowest point is
  // today, 168,000 (A and B after the pay, as today); no job 168,000 - 16,000 = 152,000
  const r = base({ cards: ['A', 'B'], free: 30000 }).see('2026-11-24');
  eq(three(r), [16000, 168000, 152000]); eq(r.everyday.left, 16000); ties(r);
  eq(r.safeToSpend.cardsNow, undefined);
});
t('Kai, no fixed pay, everyday 60,000, a card: 156,756 / 60,000 / 96,756, headline 60,000 (as today)', () => {
  // three_values Kai 1 Dec: 196,756 can spare; the card's 40,000 (paid 10 Dec) is inside the 45 day walk: 156,756.
  // Everyday left 60,000; no job 156,756 - 60,000 = 96,756; headline min(156,756, 60,000) = 60,000
  const r = kai(420000).see('2026-12-01');
  eq([r.canSpare.amount, r.everyday.left, r.noJob.amount, r.safeToSpend.headline], [156756, 60000, 96756, 60000]); ties(r);
});

/* ---- CASH_PLAN 17 F1: stopping play money on a later day, with Undo ---- */
t('Ben stops play money on 20 Jan: before, the play money left; after, can spare with the cards off; past unchanged; Undo', () => {
  const B = ben();
  // 10 Jan check: 300,000 - 30,000 (Card A, 25 Dec) - 80,000 (Rent, 27 Dec) = 190,000, both ticked. Then 12,000 on Card A.
  B.check('2027-01-10', 190000).spend('2027-01-10', 12000, 'A');
  // Seen 10 Jan, play money 40,000 in force (the period 20 Dec to 19 Jan, set up on its pay day so all of it counts):
  //   left 40,000 - 12,000 = 28,000. Can spare (dated, as today): 190,000 today is the lowest point (20 Jan +230,000 and
  //   the next period's play 40,000, 25 Jan Card A 12,000, 27 Jan rent 80,000: 288,000). Headline min(190,000, 28,000).
  let r = B.see('2027-01-10');
  eq(three(r), [28000, 190000, 162000]); eq(r.everyday.left, 28000);
  // Ben stops play money from 20 Jan (written that day). Check on 20 Jan: 190,000 + 230,000 = 420,000, the pay ticked.
  const stop = { id: B.newId(), from: '2027-01-20', cur: 'JPY', per: { free: 'pay' }, free: 'none', goals: {}, told: '2027-01-20T10:00:00.000+09:00', at: '2027-01-20T10:00:00.000+09:00', by: 'b3n7qz' };
  B.share(stop).check('2027-01-20', 420000);
  // Check on 26 Jan: 420,000 - 12,000 (Card A, 25 Jan) = 408,000, ticked. Then 6,000 on Card A (paid 25 Feb).
  B.check('2027-01-26', 408000).spend('2027-01-26', 6000, 'A');
  // Seen 26 Jan, no play amount: 408,000 - 6,000 (Card A owed now) - 80,000 (rent 27 Jan) = 322,000; then 20 Feb
  //   +230,000 with no play held, 27 Feb rent: never lower. Headline = can spare = no job = 322,000.
  //   (The dated reading would give 328,000: the 6,000 waits for 25 Feb, after the 20 Feb pay.)
  r = B.see('2027-01-26', { periods: true });
  eq(three(r), [322000, 322000, 322000]); eq(r.everyday, null); eq(r.period.free, null);
  // the past period keeps its play money: 40,000, spent 12,000, left 28,000
  const past = r.periods.find(p => p.start === '2026-12-20');
  eq([past.free.amount, past.free.spent, past.free.left], [40000, 12000, 28000]);
  ok(r.playOn('2026-12-25') && !r.playOn('2027-01-26') && !r.playOn('2027-02-21'));
  // Undo the stop: play money 40,000 again for the period from 20 Jan, spent 6,000, left 34,000. Can spare (dated):
  //   408,000 - 80,000 (27 Jan) = 328,000; 20 Feb +230,000 - 40,000 (next play) = 518,000; 25 Feb -6,000: lowest 328,000.
  B.unshare(stop.id);
  r = B.see('2027-01-26', { periods: true });
  eq(three(r), [34000, 328000, 294000]); eq(r.everyday.left, 34000);
  eq(r.periods.find(p => p.start === '2026-12-20').free.left, 28000);
  ok(r.playOn('2027-01-26'));
});

/* ---- golden answers: the lives with a play amount, and the cash-only lives, byte for byte ---- */
const GOLD = [
  ['base A B, Free to spend 30,000, 24 Nov', () => base({ cards: ['A', 'B'], free: 30000 }).see('2026-11-24')],
  ['base A B C, Free to spend 30,000, 900 on A, 24 Nov', () => base({ cards: ['A', 'B', 'C'], free: 30000 }).spend('2026-11-24', 900, 'A').see('2026-11-24')],
  ['base A B C, Free to spend 30,000, 27 Nov after the tick', () => base({ cards: ['A', 'B', 'C'], free: 30000 }).check('2026-11-27', 156000).see('2026-11-27', { periods: true })],
  ['Mako, Free to spend 30,000, lunch 900 on Card A, 24 Nov', () => mako(30000).spend('2026-11-24', 900, 'card_a').see('2026-11-24')],
  ['Mako, Free to spend 30,000, 10 Dec pay day', () => mako(30000).see('2026-12-10')],
  ['Kai with a card, 1 Dec', () => kai(420000).see('2026-12-01')],
  ['Kai with a card, 15 Dec', () => kai(420000).spend('2026-12-10', 25000, 'A').see('2026-12-15')],
  ['Ben before the stop, 10 Jan', () => ben().check('2027-01-10', 190000).spend('2027-01-10', 12000, 'A').see('2027-01-10', { periods: true })],
  ['weekly A B, Free to spend 20,000', () => base({ cards: ['A', 'B'], free: 20000, pays: [{ key: 'pay', name: 'Pay', bank: 'main', amount: 80000, every: 'weeks', n: 1, start: '2026-11-27', shift: 'none', startsPeriod: true }] }).see('2026-11-24')],
  ['cash only, pay period, 24 Nov', () => cashOnly({ day: '2026-11-24', bank: 182400, pay: true, free: 60000 }).see('2026-11-24')],
  ['cash only, pay period, no Free to spend, 24 Nov', () => cashOnly({ day: '2026-11-24', bank: 182400, pay: true, free: null }).see('2026-11-24')],
  ['cash only, Kai, 1 Dec', () => cashOnly({ day: '2026-12-01', bank: 420000, free: 60000 }).see('2026-12-01')],
  ['cash only, Kai, no everyday amount, 1 Dec', () => cashOnly({ day: '2026-12-01', bank: 420000, free: null }).see('2026-12-01')],
  ['cash only, Kai with cash, 200,000, 15 Dec', () => cashOnly({ day: '2026-12-01', bank: 200000, cash: 30000, free: 60000 }).see('2026-12-15')],
];
if (process.argv.includes('--write-golden')) {
  const out = {}; for (const [name, f] of GOLD) out[name] = JSON.stringify(f());
  fs.writeFileSync(GOLDEN, JSON.stringify(out, null, 1) + '\n');
  console.log('wrote ' + GOLDEN + ' (' + GOLD.length + ' lives)');
}
const gold = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
for (const [name, f] of GOLD) t('golden, byte for byte: ' + name, () => { eq(JSON.stringify(f()), gold[name]); });
t('every golden life is in the golden file', () => eq(Object.keys(gold).sort(), GOLD.map(g => g[0]).sort()));

done('cards_in_headline.test.js');
