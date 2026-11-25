'use strict';
// "This pay only" for everyday money (coordinator's ruling, 25 Nov 2026; found by qc-foundation on the stale sheet plan;
// MAKO_SAYS M44 "one dataset", M36; LESSONS 4: no answer may depend on the order records arrive in).
// A `once` amount lives on a plan.shares entry, keyed by the pay that starts the period. Two entries can each carry one
// for the same pay (two devices, or a change of the usual amount in between). The engine read them in list order, so
// the last in the list won and the figure could change with the order the store returned them.
// The rule: the one written last wins (its `at`); written at the same moment, the entry with the greater id.
// Mako's shape with made-up yen (test/mako_madeup.js), set up 20 Nov 2026, everyday 60,000 a pay, seen 25 Nov.
const { t, done, eq } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js'), M = require('./mako_madeup.js');
function life(onceA, onceB) {
  const newId = IDS.idMaker('q8w3hz');
  const { book } = BB.buildBook(Object.assign({}, M.ANSWERS, { free: 60000 }), { newId });
  const pay = book.schedules.find(s => s.startsPeriod).id, occ = IDS.occName(pay, '2026-11-10');
  const a = book.plan.shares[0];
  a.once = { [occ]: Object.assign({ free: onceA.free }, { at: onceA.at, by: 'q8w3hz' }) };
  const b = { id: onceB.id || newId(), from: '2026-11-22', cur: 'JPY', per: { free: 'pay' }, free: 70000, goals: {}, told: '2026-11-22T08:00:00.000+09:00', at: '2026-11-22T08:00:00.000+09:00', by: 'k2m7xd',
    once: { [occ]: { free: onceB.free, at: onceB.at, by: 'k2m7xd' } } };
  book.plan.shares.push(b);
  return { book, a, b };
}
const full = b => LA.lookahead(b, '2026-11-25').everyday.full;
const turned = (book, f) => Object.assign({}, book, { plan: Object.assign({}, book.plan, { shares: f(book.plan.shares.slice()) }) });
t('two "this pay only" amounts for one pay: the one written last wins, whatever the order of the list', () => {
  const x = life({ free: 45000, at: '2026-11-23T09:00:00.000+09:00' }, { free: 52000, at: '2026-11-24T21:30:00.000+09:00' });
  eq([full(x.book), full(turned(x.book, l => l.reverse()))], [52000, 52000]);
  const y = life({ free: 45000, at: '2026-11-24T22:00:00.000+09:00' }, { free: 52000, at: '2026-11-24T21:30:00.000+09:00' });
  eq([full(y.book), full(turned(y.book, l => l.reverse()))], [45000, 45000]);
});
t('written at the same moment: the entry with the greater id, in any order', () => {
  const at = '2026-11-24T21:30:00.000+09:00';
  const x = life({ free: 45000, at }, { free: 52000, at });
  const want = x.a.id > x.b.id ? 45000 : 52000;
  eq([full(x.book), full(turned(x.book, l => l.reverse()))], [want, want]);
});
t('one of the two taken back (gone): the other counts, in any order', () => {
  const x = life({ free: 45000, at: '2026-11-23T09:00:00.000+09:00' }, { free: 52000, at: '2026-11-24T21:30:00.000+09:00' });
  const occ = Object.keys(x.b.once)[0]; x.b.once[occ].gone = '2026-11-25';
  eq([full(x.book), full(turned(x.book, l => l.reverse()))], [45000, 45000]);
});
done('once_order.test.js');
