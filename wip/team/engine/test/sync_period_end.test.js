'use strict';
// End of pay period, slice 0 (foundation_review/ENDPERIOD_PLAN.md section 7 and its fourth review; MAKO_SAYS M24, M46, M20): the sync check
// "a place cannot give out more than it holds" [X5] judges kept places only: the goals in `book.places`, and Waiting.
// A plan line (Food) is not a kept place: its money is worked out by the engine each period, like Free to spend. So an
// end-of-period answer that sends a line's unspent money to a goal, or leaves it in the bank, raises no question.
// "Kept place" is read from `book.places`, never from the list of plan lines, so a line that has ended is skipped too.
// The goal side of the sum stays: a goal filled by an answer still cannot give out more than it holds.
// Mako's shape with made-up yen (test/mako_madeup.js): pay on the 10th; a Food line of 40,000 a pay; a goal, Trip, kept
// in the bank. The period 10 Nov to 9 Dec left 9,000 in Food. Ids are the kind the app makes.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), IDS = require('../ids.js'), S = require('../sync.js'), M = require('./mako_madeup.js');
const TOLD = '2026-11-20T21:05:00.000+09:00', stamp = (r, told) => Object.assign(r, { told: told || TOLD, at: told || TOLD, by: 'q8w3hz' });
function base() {
  const newId = IDS.idMaker('q8w3hz');
  const { book } = BB.buildBook(Object.assign({}, M.ANSWERS, { free: 60000 }), { newId });
  const bank = book.accounts.find(a => a.type === 'bank').id, pay = book.schedules.find(s => s.startsPeriod).id;
  const food = newId(), old = newId(), trip = newId();
  book.plan.budgets.push(stamp({ id: food, name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 40000 }] }));
  book.plan.budgets.push(stamp({ id: old, name: 'Gym', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 8000 }, { from: '2026-12-10', amount: 0 }], ends: '2026-12-10' }));
  book.places.push(stamp({ id: trip, name: 'Trip', kind: 'goal', target: 200000, cur: 'JPY', keptIn: { acct: bank, mode: 'inBank' } }));
  const pe = (place, moves, told) => stamp({ id: IDS.built.pe(IDS.occName(pay, '2026-11-10'), place), k: 'periodEnd', date: '2026-12-09', place, moves }, told || '2026-12-10T08:30:00.000+09:00');
  return { book, bank, food, old, trip, pe, newId };
}
const asks = b => S.sharesQuestions(b).map(q => [q.place, q.over, q.undo]);

t('Food\'s 9,000 sent to Trip at the end of the period raises no question', () => {
  const x = base(); x.book.events.push(x.pe(x.food, [{ to: x.trip, a: 9000 }]));
  eq(asks(x.book), []);
  eq(S.placeFigures(x.book).get(x.trip), 9000);   // the goal's side of the sum is still counted
});
t('Food\'s 9,000 left in the bank ("waiting") raises no question', () => {
  const x = base(); x.book.events.push(x.pe(x.food, [{ to: 'waiting', a: 9000 }]));
  eq(asks(x.book), []);
});
t('a line that has ended is not a kept place either: Gym\'s 3,000 to Trip raises no question', () => {
  const x = base(); x.book.events.push(x.pe(x.old, [{ to: x.trip, a: 3000 }]));
  eq(asks(x.book), []);
});
t('the goal is still judged: Trip got 9,000 from Food and 12,000 was moved out of it, so it is 3,000 over and the move out is offered for undo', () => {
  const x = base(), out = x.newId();
  x.book.events.push(x.pe(x.food, [{ to: x.trip, a: 9000 }]));
  x.book.events.push(stamp({ id: out, k: 'move', date: '2026-12-12', a: 12000, acct: x.bank, place: x.trip, src: { type: 'typed' } }, '2026-12-12T19:00:00.000+09:00'));
  eq(asks(x.book), [[x.trip, 3000, [out]]]);
});
t('the answers do not depend on the order the records arrive in', () => {
  const x = base(), out = x.newId();
  x.book.events.push(x.pe(x.food, [{ to: x.trip, a: 9000 }]), x.pe(x.old, [{ to: 'waiting', a: 3000 }]));
  x.book.events.push(stamp({ id: out, k: 'move', date: '2026-12-12', a: 12000, acct: x.bank, place: x.trip, src: { type: 'typed' } }, '2026-12-12T19:00:00.000+09:00'));
  const want = JSON.stringify(asks(x.book));
  eq(want, JSON.stringify([[x.trip, 3000, [out]]]));
  for (let i = 0; i < 9; i++) {
    const evs = x.book.events.slice(), n = evs.length;
    const turned = evs.map((_, k) => evs[(k * (i + 2) + i) % n]);   // nine other orders, the same every run
    const b = Object.assign({}, x.book, { events: new Set(turned).size === n ? turned : evs.slice().reverse(), places: x.book.places.slice().reverse() });
    eq(JSON.stringify(asks(b)), want);
  }
});
t('a goal that was removed is still judged (the list of places is read with removed ones in it)', () => {
  const x = base(), out = x.newId();
  x.book.events.push(x.pe(x.food, [{ to: x.trip, a: 9000 }]));
  x.book.events.push(stamp({ id: out, k: 'move', date: '2026-12-12', a: 12000, acct: x.bank, place: x.trip, src: { type: 'typed' } }, '2026-12-12T19:00:00.000+09:00'));
  x.book.places.find(p => p.id === x.trip).gone = '2026-12-13';
  eq(asks(x.book), [[x.trip, 3000, [out]]]);
});
// [ruling 5, slice 0 part 2] a goal that has given out more than it holds: the question lists the spends made from that
// goal (newest first, enough to cover what is over) as `spends` beside `undo`, so "count this spend as everyday money
// instead" can be offered; a negative adjust on the goal can be undone like a move out. GRID: every way a goal can go
// below nothing (a move out, a spend from it, a negative adjust, two of them), on one device and after a join of two
// devices (sync.sync of a shared base): the question always has at least one thing to tap. A periodEnd whose own place
// is a goal: not applicable, no writer makes one in version one.
const D1 = 'a7k2mq', D2 = 'z9p4wr';
const mv = (x, a, told, by) => Object.assign(stamp({ id: IDS.idMaker(by || 'q8w3hz')(), k: 'move', date: told.slice(0, 10), a, acct: x.bank, place: x.trip, src: { type: 'typed' } }, told), by ? { by } : {});
const sp = (x, a, told, by) => Object.assign(stamp({ id: IDS.idMaker(by || 'q8w3hz')(), k: 'spend', date: told.slice(0, 10), a, acct: x.bank, place: x.trip, note: 'trip shop', src: { type: 'typed' } }, told), by ? { by } : {});
const adj = (x, a, told, by) => Object.assign(stamp({ id: IDS.idMaker(by || 'q8w3hz')(), k: 'adjust', date: told.slice(0, 10), a, acct: x.bank, place: x.trip, src: { type: 'typed' } }, told), by ? { by } : {});
const T1 = '2026-12-12T19:00:00.000+09:00', T2 = '2026-12-13T09:00:00.000+09:00';
const filled = () => { const x = base(); x.book.events.push(x.pe(x.food, [{ to: x.trip, a: 9000 }])); return x; };   // Trip holds 9,000
const tappable = q => (q.undo || []).length + (q.spends || []).length > 0;
t('a spend of 12,000 from Trip (holds 9,000): 3,000 over, the spend is listed to count as everyday money, nothing to undo', () => {
  const x = filled(), s1 = sp(x, 12000, T1); x.book.events.push(s1);
  const q = S.sharesQuestions(x.book);
  eq(q.map(y => [y.place, y.over, y.undo, y.spends]), [[x.trip, 3000, [], [s1.id]]]);
});
t('two spends from Trip, 6,000 then 5,000: 2,000 over, the newest alone covers it', () => {
  const x = filled(), a = sp(x, 6000, T1), b = sp(x, 5000, T2); x.book.events.push(a, b);
  eq(S.sharesQuestions(x.book).map(y => [y.over, y.spends]), [[2000, [b.id]]]);
});
t('a negative adjust of 10,000 on Trip: 1,000 over, the adjust can be undone', () => {
  const x = filled(), a = adj(x, -10000, T1); x.book.events.push(a);
  eq(S.sharesQuestions(x.book).map(y => [y.over, y.undo, y.spends]), [[1000, [a.id], []]]);
});
t('the answer "spends": each listed spend loses its place and goes on Free to spend, and the question is gone', () => {
  const x = filled(), s1 = sp(x, 12000, T1); x.book.events.push(s1);
  const q = S.sharesQuestions(x.book)[0];
  const out = S.answer({ copy: x.book, question: q, pick: 'spends', now: T2, by: 'q8w3hz' });
  const e = out.events.find(y => y.id === s1.id);
  eq([e.place, e.line, e.a, !!e.gone], [undefined, 'free', 12000, false]);
  eq(S.sharesQuestions(out), []);
});
t('GRID: every way below nothing, on one device and after a join, always has something to tap', () => {
  const ways = { move: mv, spend: sp, adjust: (x, a, t, by) => adj(x, -a, t, by) };
  const cells = [];
  for (const w1 of Object.keys(ways)) for (const w2 of [null].concat(Object.keys(ways))) {
    // one device: 7,000 then 6,000 out of 9,000
    const x = filled(); x.book.events.push(ways[w1](x, 7000, T1)); if (w2) x.book.events.push(ways[w2](x, 6000, T2)); else x.book.events.push(ways[w1](x, 6000, T2));
    cells.push(['one ' + w1 + '+' + (w2 || w1), S.sharesQuestions(x.book)]);
    // after a join: each device takes 7,000 from the same 9,000
    const b = filled(), mine = JSON.parse(JSON.stringify(b.book)), theirs = JSON.parse(JSON.stringify(b.book));
    mine.events.push(ways[w1](b, 7000, T1, D1)); theirs.events.push(ways[w2 || w1](b, 7000, T2, D2));
    const joined = S.sync(b.book, mine, theirs);
    cells.push(['join ' + w1 + '+' + (w2 || w1), S.sharesQuestions(joined.copy || joined)]);
  }
  const bad = cells.filter(([, qs]) => qs.length !== 1 || !tappable(qs[0])).map(([n, qs]) => n + ':' + JSON.stringify(qs));
  eq([cells.length, bad], [24, []]);
});
done('sync_period_end.test.js');
