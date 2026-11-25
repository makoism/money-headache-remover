'use strict';
// End of pay period, slice 0 (foundation_review/ENDPERIOD_PLAN.md section 7; MAKO_SAYS M24, M46, M20): the sync check
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
done('sync_period_end.test.js');
