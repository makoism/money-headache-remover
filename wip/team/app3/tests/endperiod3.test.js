#!/usr/bin/env node
/* What waits at the end of a pay period (app3/src/endperiod3.js, ENDPERIOD_PLAN slice 1; MAKO_SAYS M24 "Choose where
   unspent planned money goes, or 'Decide later'", M46 "Unspent planned money never drops out silently", M36, M38, M43,
   M45, M11, M30). EP3.waiting(book, day) works out, from the engine only, which pay periods gone by still have planned
   money nobody decided about, and the most each place may send to a goal; EP3.answer(w, x) is the one write step for
   an answer, through act3. Nothing here is saved by waiting(); every answer is one `periodEnd` record per place.

   Mako's shape with made-up yen (never real figures): pay 240,000 on the 10th (his two incomes as one number, M28),
   Food 40,000 and Free to spend 60,000 a pay, a goal Trip kept in the bank (M43), two cards paid in full on the 10th and
   11th with close days "not sure" (M27, M32), nothing set up before. Set up on Tue 10 Nov 2026 with 400,000 in the
   bank and nothing on either card, so the pay period 10 Nov to 9 Dec counts the full amounts.
   Ids are made by the engine's idMaker, as the app makes them (LESSONS 3, second addendum).

   THE MAIN TIMELINE (worked by hand):
     14 Nov  Food 12,000 logged on Card A        24 Nov  Food 9,000 logged on Card A
      4 Dec  cards checked: Card A 46,000 (21,000 logged, 25,000 not), Card B 14,000 (all not logged). The stretch is
             11 Nov to 4 Dec, all inside 10 Nov to 9 Dec, so Free to spend has spent 25,000 + 14,000 = 39,000.
     10 Dec  pay ticked (240,000) and Card A's 46,000 ticked; bank 400,000 + 240,000 - 46,000 = 594,000. Cards not
             checked since 4 Dec. Food left 40,000 - 21,000 = 19,000, Free left 60,000 - 39,000 = 21,000.
     12 Dec  Food 10,000 dated 5 Dec logged on Card A (he logs weekly, M11)
     13 Dec  Card B's 14,000 ticked; bank 594,000 - 14,000 = 580,000; Card A checked at 19,000 (10,000 logged, so
             9,000 not), Card B at 9,000 (all not logged). Each gap covers 5 Dec to 13 Dec, nine days; 5 to 9 Dec
             (five of nine) are the old period's: 5,000 of each, 10,000 in all (the day split, CA1).
             Food left 40,000 - 31,000 = 9,000. Free left 60,000 - 39,000 - 10,000 = 11,000.
             (The reviewer's run, foundation_plan4: Food 9,000, Free 11,000.) What the period can give: 20,000. */
'use strict';
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const BB = require(E + 'build_book.js'), LA = require(E + 'lookahead.js'), CI = require(E + 'checkin.js'), PE = require(E + 'periods.js'), IDS = require(E + 'ids.js');
const A3 = require('../src/act3.js'), W = require('../src/plan3_write.js');
const EP3 = require('../src/endperiod3.js');
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const clone = x => JSON.parse(JSON.stringify(x));
const T = d => d + 'T12:00:00.000+09:00';

/* one life: setup through build_book, the plan through PLAN3W (act3), spends as Receipts writes them, check-ins through
   the engine's check-in writer, answers through act3 with EP3.answer */
function life(o) {
  o = Object.assign({ day: '2026-11-10', bank: 400000, owedA: 0, dev: 'm4k8zq', pay: true }, o || {});
  const newId = IDS.idMaker(o.dev);
  const out = BB.buildBook({ day: o.day, told: o.day + 'T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: o.bank, main: true, min: null }],
    pays: [o.pay ? { key: 'pay1', name: 'Pay', bank: 'bank1', amount: 240000, every: 'month', day: 10, shift: 'none', startsPeriod: true }
      : { key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }],
    cards: [{ key: 'card1', name: 'Card A', owed: o.owedA, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true },
      { key: 'card2', name: 'Card B', owed: 0, payDay: 11, closeDay: 'not sure', payFrom: 'bank1', shift: 'none', inFull: true }],
    bills: [], free: 60000 }, { newId });
  let book = out.book, DAY = o.day;
  const h = { get book() { return book; }, set book(b) { book = b; }, newId,
    bank: out.ids.bank1, cardA: out.ids.card1, cardB: out.ids.card2, pay: out.ids.pay1 };
  h.A = A3.make({ book: () => book, put: async x => { book = x; return true; }, told: () => T(DAY), newId,
    today: () => DAY, queue: { post: () => {} }, check: x => LA.lookahead(x, DAY) });
  h.on = d => { DAY = d; return h; };
  h.plan = async (name, ...args) => { const r = await h.A.run(name, w => W[name](w, ...args)); if (!r.ok) throw new Error(name + ': ' + r.text); return r.step.out; };
  h.answer = x => h.A.run('Period end', w => EP3.answer(w, x));
  h.spend = (date, a, acct, line, told, place) => {
    const e = { id: newId(), k: 'spend', date, a, acct, told: T(told || date), src: { type: 'typed' } };
    if (place) e.place = place; else e.line = line || 'free';
    book = Object.assign({}, book, { events: book.events.concat([e]) });
  };
  h.check = (day, figures) => {
    DAY = day;
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: T(day), newId, figures, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  h.see = d => LA.lookahead(book, d || DAY);
  h.occ = due => IDS.occName(h.pay, due);
  return h;
}
/* the main timeline above, to the day asked; `owedA` and `bank` change the money in the bank only (case d) */
async function mako(until, o) {
  const h = life(o);
  h.food = await h.plan('addLine', { name: 'Food', amount: 40000 });
  h.trip = await h.plan('addGoal', { name: 'Trip', target: 300000 });
  const owedA = (o && o.owedA) || 0, bank0 = (o && o.bank) || 400000;
  h.spend('2026-11-14', 12000, h.cardA, h.food);
  h.spend('2026-11-24', 9000, h.cardA, h.food);
  h.check('2026-12-04', { [h.bank]: bank0, [h.cardA]: owedA + 46000, [h.cardB]: 14000 });
  if (until === '2026-12-04') return h;
  h.check('2026-12-10', { [h.bank]: bank0 + 240000 - owedA - 46000 });
  if (until === '2026-12-10') return h;
  h.spend('2026-12-05', 10000, h.cardA, h.food, '2026-12-12');
  h.check('2026-12-13', { [h.bank]: bank0 + 240000 - owedA - 46000 - 14000, [h.cardA]: 19000, [h.cardB]: 9000 });
  return h;
}
const place = (p, id) => p.places.find(x => x.place === id);
const pe = (h, id) => h.book.events.filter(e => e.id === id);

(async () => {
  /* ---- (a) the reviewer's run: checked on 13 Dec ---- */
  await t('(a) 13 Dec: 10 Nov to 9 Dec waits, Food left 9,000 and Free 11,000, offered up to 9,000 and 11,000, Trip offered', async () => {
    const h = await mako('2026-12-13'), w = EP3.waiting(h.book, '2026-12-13');
    eq(w.length, 1, 'one period');
    const p = w[0];
    eq([p.id, p.start, p.end, p.over, p.fresh, p.takeBack], [h.occ('2026-11-10'), '2026-11-10', '2026-12-09', 0, true, false]);
    const past = PE.periods(h.book, '2026-12-13').past[0];
    eq(p.end, past.end, 'the end is the engine\'s, never worked out');
    eq(['free', h.food].map(id => [place(p, id).left, place(p, id).sent, place(p, id).decided, place(p, id).fresh, place(p, id).offer]),
      [[11000, 0, false, true, 11000], [9000, 0, false, true, 9000]]);
    // what the period can give: 9,000 + 11,000 = 20,000, nothing sent yet
    eq([p.can, p.sent], [20000, 0]);
    eq(p.goals.map(g => g.id), [h.trip]);
    eq([place(p, 'free').goals, place(p, h.food).goals], [[h.trip], [h.trip]]);
    // nothing is saved, and the same twice
    eq(EP3.waiting(h.book, '2026-12-13'), w, 'the same answer twice');
    ok(!h.book.events.some(e => e.k === 'periodEnd'), 'nothing written');
  });

  /* ---- (b) Food's 9,000 to Trip ---- */
  await t('(b) Food 9,000 to Trip: Trip holds 9,000, canSpare falls by exactly 9,000, Food decided, Free still offered 11,000', async () => {
    const h = await mako('2026-12-13');
    const before = h.see('2026-12-13').canSpare.amount;
    const r = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 9000 });
    ok(r.ok, JSON.stringify(r));
    const id = IDS.built.pe(h.occ('2026-11-10'), h.food);
    const recs = pe(h, id);
    eq(recs.length, 1, 'one record');
    eq([recs[0].k, recs[0].date, recs[0].place, recs[0].moves], ['periodEnd', '2026-12-09', h.food, [{ to: h.trip, a: 9000 }]]);
    const v = h.see('2026-12-13');
    eq(v.places[h.trip].kept, 9000, 'Trip holds 9,000');
    eq(before - v.canSpare.amount, 9000, 'canSpare falls by 9,000');
    const p = EP3.waiting(h.book, '2026-12-13')[0];
    // can give 20,000, sent 9,000: Free's offer is the least of 11,000 (its own), 11,000 (20,000 - 9,000), noJob, canSetAside
    eq([p.can, p.sent], [20000, 9000]);
    eq([place(p, h.food).decided, place(p, h.food).sent, place(p, h.food).offer], [true, 9000, 0]);
    eq([place(p, 'free').decided, place(p, 'free').offer, place(p, 'free').goals], [false, 11000, [h.trip]]);
    // over the cap is refused: Free 11,001 (more than its own left)
    const z = await h.answer({ period: h.occ('2026-11-10'), place: 'free', to: h.trip, a: 11001 });
    ok(!z.ok && z.why === 'bad' && /11,000/.test(z.text), JSON.stringify(z));
    // a goal kept in its own account is never offered, and an answer to it is refused in plain words
    const car = await h.plan('addGoal', { name: 'Car', target: 500000, mode: 'ownAccount' });
    const p2 = EP3.waiting(h.book, '2026-12-13')[0];
    eq(p2.goals.map(g => g.id), [h.trip], 'Car not offered');
    const zc = await h.answer({ period: h.occ('2026-11-10'), place: 'free', to: car, a: 1000 });
    ok(!zc.ok && zc.why === 'bad' && /Car/.test(zc.text) && /Main bank/.test(zc.text), JSON.stringify(zc));
  });

  /* ---- (c) the stale case, then the figures arrive ---- */
  await t('(c) 10 Dec, cards last checked 4 Dec: not fresh, no goal offered; "Leave it in my bank" for Food; 13 Dec Free still offered its full 11,000', async () => {
    const h = await mako('2026-12-10');
    // before the pay is ticked there is no period gone by, so nothing is asked (L q2)
    const h0 = await mako('2026-12-04');
    eq(EP3.waiting(h0.book, '2026-12-10'), [], 'nothing before the pay is ticked');
    // 10 Dec: Food 19,000 and Free 21,000 left on the figures so far (worked above); the cards were last checked 4 Dec
    let p = EP3.waiting(h.book, '2026-12-10')[0];
    eq([p.fresh, place(p, h.food).left, place(p, 'free').left], [false, 19000, 21000]);
    eq(['free', h.food].map(id => [place(p, id).fresh, place(p, id).offer, place(p, id).goals]), [[false, 0, []], [false, 0, []]]);
    // a goal answer on stale figures is refused; "Leave it in my bank" is not
    const z = await h.on('2026-12-10').answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 19000 });
    ok(!z.ok && z.why === 'bad' && /check/i.test(z.text), JSON.stringify(z));
    const r = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: 'waiting', a: 19000 });
    ok(r.ok, JSON.stringify(r));
    eq(pe(h, IDS.built.pe(h.occ('2026-11-10'), h.food)).map(e => [e.date, e.moves]), [['2026-12-09', [{ to: 'waiting', a: 19000 }]]]);
    // 13 Dec: the figures arrive (the same steps as the main timeline)
    h.spend('2026-12-05', 10000, h.cardA, h.food, '2026-12-12');
    h.check('2026-12-13', { [h.bank]: 580000, [h.cardA]: 19000, [h.cardB]: 9000 });
    p = EP3.waiting(h.book, '2026-12-13')[0];
    // Food 9,000 and Free 11,000; the waiting answer of 19,000 takes nothing off: can give 20,000, sent 0
    eq([p.fresh, p.can, p.sent, p.takeBack], [true, 20000, 0, false]);
    eq([place(p, h.food).decided, place(p, h.food).left, place(p, h.food).sent], [true, 9000, 0]);
    eq([place(p, 'free').decided, place(p, 'free').offer, place(p, 'free').goals], [false, 11000, [h.trip]]);
  });

  /* ---- (d) a bank with only 10,000 ----
     The same timeline with Card A owing 250,000 at setup (a big buy before setup) and 80,000 in the bank: Card A's
     10 Dec payment is 250,000 + 46,000 = 296,000, so the bank is 80,000 + 240,000 - 296,000 = 24,000 on 10 Dec and
     24,000 - 14,000 = 10,000 on 13 Dec. Food and Free left are as before (the opening owed is not spending). The
     engine: noJob 0 (the next pay's lines are more than the bank can spare), canSetAside 10,000. So no goal. */
  await t('(d) a bank with 10,000 on 13 Dec: no goal offered for any place, waiting still possible, an answer to Trip refused in plain words', async () => {
    const h = await mako('2026-12-13', { bank: 80000, owedA: 250000 });
    const v = h.see('2026-12-13');
    eq([v.accounts[h.bank].bank, v.noJob.amount, v.accounts[h.bank].canSetAside], [10000, 0, 10000]);
    const p = EP3.waiting(h.book, '2026-12-13')[0];
    eq([p.fresh, place(p, h.food).left, place(p, 'free').left], [true, 9000, 11000]);
    eq(['free', h.food].map(id => [place(p, id).offer, place(p, id).goals]), [[0, []], [0, []]]);
    const z = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 9000 });
    ok(!z.ok && z.why === 'bad' && /Trip|goal/.test(z.text) && !/undefined|NaN/.test(z.text), JSON.stringify(z));
    const r = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: 'waiting', a: 9000 });
    ok(r.ok, JSON.stringify(r));
  });

  /* ---- (e) the period went over as a whole ----
     No Food logged; 4 Dec Card A 70,000 and Card B 44,000, none logged: Free to spend spent 114,000. 10 Dec pay and
     Card A's 70,000 ticked, bank 400,000 + 240,000 - 70,000 = 570,000; 13 Dec Card B's 44,000 ticked, bank 526,000,
     both cards checked at 0. Food left 40,000, Free left 60,000 - 114,000 = -54,000: 14,000 over, nothing asked. */
  await t('(e) Food 40,000 untouched and Free 54,000 over: nothing asked, over 14,000', async () => {
    const h = life();
    h.food = await h.plan('addLine', { name: 'Food', amount: 40000 });
    h.trip = await h.plan('addGoal', { name: 'Trip', target: 300000 });
    h.check('2026-12-04', { [h.bank]: 400000, [h.cardA]: 70000, [h.cardB]: 44000 });
    h.check('2026-12-10', { [h.bank]: 570000 });
    h.check('2026-12-13', { [h.bank]: 526000, [h.cardA]: 0, [h.cardB]: 0 });
    const past = PE.periods(h.book, '2026-12-13').past[0];
    eq([past.lines[0].left, past.free.left], [40000, -54000], 'the engine\'s lefts');
    const w = EP3.waiting(h.book, '2026-12-13');
    eq(w.length, 1);
    eq([w[0].over, w[0].can, w[0].places, w[0].takeBack], [14000, 0, [], false]);
    const z = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 1000 });
    ok(!z.ok && z.why === 'bad', JSON.stringify(z));
  });

  /* ---- (f) over after an answer ----
     After (b), on 20 Dec a Free to spend receipt of 27,000 dated 8 Dec is logged on Card A. Card A's 13 Dec figure
     already held it, so the 13 Dec gap on Card A becomes 9,000 - 27,000 = -18,000; five of its nine days are the old
     period's: -10,000. Free spent 39,000 + 27,000 + 5,000 (Card B) - 10,000 = 61,000, left -1,000. The period can give
     9,000 - 1,000 = 8,000, and 9,000 was sent to Trip: 1,000 more than it had. Nothing is taken back by itself. */
  await t('(f) 9,000 sent to Trip, later figures leave the period 8,000: takeBack, 1,000 over, nothing taken back', async () => {
    const h = await mako('2026-12-13');
    ok((await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 9000 })).ok);
    h.on('2026-12-20').spend('2026-12-08', 27000, h.cardA, 'free', '2026-12-20');
    const past = PE.periods(h.book, '2026-12-20').past[0];
    eq([past.lines[0].left, past.free.left], [9000, -1000], 'the engine\'s lefts');
    const p = EP3.waiting(h.book, '2026-12-20')[0];
    eq([p.can, p.sent, p.takeBack, p.takeBackBy, p.over], [8000, 9000, true, 1000, 0]);
    eq(place(p, 'free').offer, 0);
    eq(h.see('2026-12-20').places[h.trip].kept, 9000, 'Trip still holds 9,000');
    eq(pe(h, IDS.built.pe(h.occ('2026-11-10'), h.food))[0].moves, [{ to: h.trip, a: 9000 }], 'the record is as it was');
  });

  /* ---- (g) Take back, and answering again ---- */
  await t('(g) Take back keeps the record with moves []; answering again edits that one record', async () => {
    const h = await mako('2026-12-13');
    const id = IDS.built.pe(h.occ('2026-11-10'), h.food);
    ok((await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 9000 })).ok);
    const r = await h.on('2026-12-14').answer({ period: h.occ('2026-11-10'), place: h.food, to: 'takeBack' });
    ok(r.ok, JSON.stringify(r));
    eq(pe(h, id).map(e => [e.date, e.moves, !!e.gone]), [['2026-12-09', [], false]]);
    eq(h.see('2026-12-14').places[h.trip].kept, 0, 'Trip back to 0');
    let p = EP3.waiting(h.book, '2026-12-14')[0];
    eq([place(p, h.food).decided, place(p, h.food).offer, p.sent], [false, 9000, 0], 'the question returns');
    const again = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 5000 });
    ok(again.ok, JSON.stringify(again));
    eq([again.step.added.length, again.step.edited.map(x => x.id)], [0, [id]], 'an edit, not an add');
    eq(pe(h, id).map(e => e.moves), [[{ to: h.trip, a: 5000 }]], 'one record with that id');
    // a change from Trip to "Leave it in my bank" is an edit too, and Trip gives the 5,000 back
    const ch = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: 'waiting', a: 9000 });
    ok(ch.ok && ch.step.added.length === 0, JSON.stringify(ch));
    eq([pe(h, id).length, pe(h, id)[0].moves, h.see('2026-12-14').places[h.trip].kept], [1, [{ to: 'waiting', a: 9000 }], 0]);
    // a change to a goal works the cap out without its own old answer: Food's whole 9,000 may go to Trip
    ok((await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 9000 })).ok);
    eq(pe(h, id).length, 1);
    p = EP3.waiting(h.book, '2026-12-14')[0];
    eq([p.sent, place(p, 'free').offer], [9000, 11000]);
    // Take back of nothing is refused
    const h2 = await mako('2026-12-13');
    const z = await h2.answer({ period: h2.occ('2026-11-10'), place: h2.food, to: 'takeBack' });
    ok(!z.ok && z.why === 'bad', JSON.stringify(z));
  });

  /* ---- (h) Take back refused once Trip's money is spent ---- */
  await t('(h) Take back refused when Trip no longer holds the money (9,000 spent from Trip)', async () => {
    const h = await mako('2026-12-13');
    ok((await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: h.trip, a: 9000 })).ok);
    h.on('2026-12-15').spend('2026-12-15', 9000, h.bank, null, '2026-12-15', h.trip);
    eq(h.see('2026-12-15').places[h.trip].kept, 0, 'Trip spent');
    const z = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: 'takeBack' });
    ok(!z.ok && z.why === 'bad' && /Trip/.test(z.text), JSON.stringify(z));
    const z2 = await h.answer({ period: h.occ('2026-11-10'), place: h.food, to: 'waiting', a: 9000 });
    ok(!z2.ok && z2.why === 'bad' && /Trip/.test(z2.text), 'a change away from Trip too: ' + JSON.stringify(z2));
    eq(pe(h, IDS.built.pe(h.occ('2026-11-10'), h.food))[0].moves, [{ to: h.trip, a: 9000 }]);
  });

  /* ---- (i) other lives ---- */
  /* Set up mid-period, Fri 20 Nov: the pay period holding setup is 10 Nov to 9 Dec (30 days), counted from 20 Nov, 20
     days: Food 40,000 x 20 / 30 = 26,666 (rounded down), Free 60,000 x 20 / 30 = 40,000. Nothing spent; 10 Dec pay
     ticked and 13 Dec everything checked with nothing new. */
  await t('(i) set up mid-period: the part period is asked about with its day shares', async () => {
    const h = life({ day: '2026-11-20' });
    h.food = await h.plan('addLine', { name: 'Food', amount: 40000 });
    h.trip = await h.plan('addGoal', { name: 'Trip', target: 300000 });
    h.check('2026-12-10', { [h.bank]: 640000 });
    h.check('2026-12-13', { [h.bank]: 640000, [h.cardA]: 0, [h.cardB]: 0 });
    const w = EP3.waiting(h.book, '2026-12-13');
    eq(w.length, 1);
    eq([w[0].id, w[0].end, place(w[0], h.food).left, place(w[0], 'free').left, w[0].can], [h.occ('2026-11-10'), '2026-12-09', 26666, 40000, 66666]);
    eq([place(w[0], h.food).offer, place(w[0], 'free').offer], [26666, 40000]);
  });
  /* Two periods gone by: the main timeline to 13 Dec, then 13 Jan: pay and both card payments ticked (Card A 19,000 on
     10 Jan, Card B 9,000 on 11 Jan), bank 580,000 + 240,000 - 19,000 - 9,000 = 792,000, both cards at 0. 10 Dec to 9 Jan:
     Food 40,000 untouched; Free 60,000 less four of nine days of the 13 Dec gaps (4,000 + 4,000) = 52,000. */
  await t('(i) two periods gone by, oldest first', async () => {
    const h = await mako('2026-12-13');
    h.check('2027-01-13', { [h.bank]: 792000, [h.cardA]: 0, [h.cardB]: 0 });
    const w = EP3.waiting(h.book, '2027-01-13');
    eq(w.map(p => [p.id, p.start, p.end]), [[h.occ('2026-11-10'), '2026-11-10', '2026-12-09'], [h.occ('2026-12-10'), '2026-12-10', '2027-01-09']]);
    eq(w.map(p => [place(p, h.food).left, place(p, 'free').left]), [[9000, 11000], [40000, 52000]]);
    // answering every place of the first leaves only the second
    ok((await h.on('2027-01-13').answer({ period: h.occ('2026-11-10'), place: h.food, to: 'waiting', a: 9000 })).ok);
    ok((await h.answer({ period: h.occ('2026-11-10'), place: 'free', to: h.trip, a: 11000 })).ok);
    eq(EP3.waiting(h.book, '2027-01-13').map(p => p.id), [h.occ('2026-12-10')]);
  });
  await t('(i) no fixed pay: no periods gone by, an empty list', async () => {
    const h = life({ pay: false });
    await h.plan('addLine', { name: 'Food', amount: 40000 });
    h.check('2026-12-13', { [h.bank]: 400000, [h.cardA]: 0, [h.cardB]: 0 });
    eq(EP3.waiting(h.book, '2026-12-13'), []);
  });
  /* A line removed after its period: the main timeline with a line Gym 10,000 a pay, never spent, so 10 Nov to 9 Dec
     can give 9,000 + 11,000 + 10,000 = 30,000. Gym's 10,000 goes to Trip on 13 Dec, then Gym is removed. A removed
     line no spend names drops out of the period's lines (the engine keeps one a live spend names, ledger.js revive), so
     the places are Food and Free: they can give 20,000, and Gym's 10,000 still counts by its record: 10,000 still to
     give. Free is offered 10,000 of its 11,000, Food its 9,000. */
  await t('(i) a line removed after the period still counts its answer', async () => {
    const h = await mako('2026-12-04');
    h.gym = await h.on('2026-11-10').plan('addLine', { name: 'Gym', amount: 10000 });
    h.check('2026-12-10', { [h.bank]: 594000 });
    h.spend('2026-12-05', 10000, h.cardA, h.food, '2026-12-12');
    h.check('2026-12-13', { [h.bank]: 580000, [h.cardA]: 19000, [h.cardB]: 9000 });
    let p = EP3.waiting(h.book, '2026-12-13')[0];
    eq([p.can, place(p, h.gym).left, place(p, h.gym).offer], [30000, 10000, 10000]);
    ok((await h.answer({ period: h.occ('2026-11-10'), place: h.gym, to: h.trip, a: 10000 })).ok);
    const rm = await h.A.remove(h.gym);
    ok(rm.ok, JSON.stringify(rm));
    eq(h.see('2026-12-13').places[h.trip].kept, 10000, 'Trip still holds it');
    p = EP3.waiting(h.book, '2026-12-13')[0];
    eq([p.places.map(x => x.place), p.can, p.sent, place(p, 'free').offer, place(p, h.food).offer], [['free', h.food], 20000, 10000, 10000, 9000]);
  });

  /* ---- rule 1: the order an over comes off ----
     Lines Food 40,000, Gym 10,000 and Books 5,000, all added on 10 Nov. Logged from the bank: Food 50,000 (10,000 over)
     and Free to spend 57,000 (3,000 left). The over comes off Free first (3,000, leaving 7,000 to take), then each line
     by when it was told, then by id. Gym first: Gym 10,000 - 7,000 = 3,000, Books 5,000. Books first: Books 0, Gym
     10,000 - 2,000 = 8,000. Either way the period can give 3,000 + 10,000 + 5,000 - 10,000 = 8,000. */
  async function three() {
    const h = life();
    h.food = await h.plan('addLine', { name: 'Food', amount: 40000 });
    h.gym = await h.plan('addLine', { name: 'Gym', amount: 10000 });
    h.books = await h.plan('addLine', { name: 'Books', amount: 5000 });
    h.trip = await h.plan('addGoal', { name: 'Trip', target: 300000 });
    h.bike = await h.plan('addGoal', { name: 'Bike', target: 90000 });
    h.on('2026-11-20'); await h.plan('setFree', { amount: 65000, when: 'next' });
    h.spend('2026-11-20', 50000, h.bank, h.food);
    h.spend('2026-11-21', 57000, h.bank, 'free');
    h.check('2026-12-10', { [h.bank]: 400000 - 107000 + 240000 });
    h.check('2026-12-13', { [h.bank]: 533000, [h.cardA]: 0, [h.cardB]: 0 });
    return h;
  }
  const net = (p, h) => [place(p, 'free').net, place(p, h.food).net, place(p, h.gym).net, place(p, h.books).net];
  await t('rule 1: an over comes off Free to spend first, then each line by told, then id; never list order', async () => {
    const h = await three();
    const budgets = h.book.plan.budgets, gym = budgets.find(l => l.id === h.gym), books = budgets.find(l => l.id === h.books);
    // told: the one with the larger id told first, so told and id disagree
    const [small, big] = [gym, books].sort((x, y) => (x.id < y.id ? -1 : 1));
    big.told = '2026-11-10T08:00:00.000+09:00'; small.told = '2026-11-10T12:00:00.000+09:00';
    let p = EP3.waiting(h.book, '2026-12-13')[0];
    eq(p.can, 8000);
    eq(net(p, h), big === gym ? [0, 0, 3000, 5000] : [0, 0, 8000, 0], 'told first');
    const order = p.places.map(x => x.place);
    eq([order[0], order.indexOf(big.id) < order.indexOf(small.id)], ['free', true], 'places listed in the same order');
    // the same told: by id
    big.told = small.told;
    p = EP3.waiting(h.book, '2026-12-13')[0];
    eq(net(p, h), small === gym ? [0, 0, 3000, 5000] : [0, 0, 8000, 0], 'then id');
    // the list's own order changes nothing
    h.book.plan.budgets.reverse();
    eq(net(EP3.waiting(h.book, '2026-12-13')[0], h), net(p, h), 'reversed list');
    // an over place offers nothing; the others offer by rule 3
    eq([place(p, h.food).offer, place(p, h.gym).offer, place(p, h.books).offer, place(p, 'free').offer], [0, 8000, 5000, 3000]);
  });

  /* ---- rule 9: nine orders of the records give the same answer ---- */
  await t('rule 9: events, plan.budgets, plan.shares and places in nine orders give the same answer', async () => {
    const h = await three();
    ok((await h.on('2026-12-13').answer({ period: h.occ('2026-11-10'), place: h.gym, to: h.trip, a: 4000 })).ok);
    ok((await h.answer({ period: h.occ('2026-11-10'), place: h.books, to: 'waiting', a: 5000 })).ok);
    ok(h.book.plan.shares.length === 2, 'two shares entries');
    const base = JSON.stringify(EP3.waiting(h.book, '2026-12-13'));
    ok(JSON.parse(base).length === 1, 'a period');
    const orders = [x => x, x => x.reverse(), x => x.sort((p, q) => (p.id < q.id ? -1 : 1)), x => x.sort((p, q) => (p.id < q.id ? 1 : -1)),
      x => x.slice(1).concat(x.slice(0, 1)), x => x.slice(3).concat(x.slice(0, 3)), x => x.sort((p, q) => (String(p.date) < String(q.date) ? 1 : -1)),
      x => x.filter((_, i) => i % 2).concat(x.filter((_, i) => !(i % 2))), x => x.sort((p, q) => (String(p.told) < String(q.told) ? 1 : String(p.told) > String(q.told) ? -1 : p.id < q.id ? 1 : -1))];
    eq(orders.length, 9);
    for (const [i, o] of orders.entries()) {
      const b = clone(h.book);
      b.events = o(b.events.slice()); b.plan.budgets = o(b.plan.budgets.slice()); b.plan.shares = o(b.plan.shares.slice()); b.places = o(b.places.slice());
      eq(JSON.stringify(EP3.waiting(b, '2026-12-13')), base, 'order ' + i);
    }
  });

  console.log(bad ? `endperiod3: ${bad} FAIL of ${n}` : `endperiod3: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
