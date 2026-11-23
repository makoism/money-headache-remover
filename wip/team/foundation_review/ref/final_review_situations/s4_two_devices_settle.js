// S4: Jun and Tess each open the check-in on their own phone after pay on Fri 25 Dec and tick "Pay 250,000".
// Two `in` events with different ids settle pay@2026-12-25. After the merge (union by id) both are live.
const { lookahead, sc, bank } = require('./base');
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const X = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/matching_ref.js');
const P = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/period_end_ref.js');
const ev = (id, by, a) => ({ id, k: 'in', date: '2026-12-25', a, acct: 'b', stream: 'pay', settles: [{ s: 'pay', due: '2026-12-25' }], told: '2026-12-26T08:0' + by + ':00.000+09:00', at: '2026-12-26T08:0' + by + ':00.000+09:00', by: by === '1' ? 'jjjjjj' : 'tttttt' });
const merged = M.merge({ events: [ev('jjjjjj-abc-1', '1', 250000)] }, { events: [ev('tttttt-xyz-1', '2', 248000)] });
console.log('S4 merged live pay events:', merged.events.filter(e => !e.gone).length, '(right: 1; the occurrence was settled twice)');
const lines = merged.events.map(e => ({ id: e.id, date: e.date, a: e.a, dir: 'in', told: e.told }));
console.log('S4 offered as possible double:', JSON.stringify(X.possibleDoubles(lines)), '(Tess edited the amount to the real 248,000, so not offered)');
const s = sc({ accounts: [bank('b', '2026-12-20', 50000)],
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 250000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true }],
  events: [ { id: 'p1', date: '2026-12-25', kind: 'pay_in', account: 'b', amount: 250000, settles: 'pay@2026-12-25' },
            { id: 'p2', date: '2026-12-25', kind: 'pay_in', account: 'b', amount: 248000, settles: 'pay@2026-12-25' } ] });
const r = lookahead(s, '2026-12-27');
console.log('S4 bank today', r.accounts.b.bank, '(right 298,000); headroom', r.accounts.b.headroom);
// Period end answered on both phones: each moves the 20,000 left in Free to spend to the trip goal.
const a1 = P.leftovers({ periodTo: '2026-12-24', places: [{ id: 'free', left: 20000 }], answers: [{ place: 'free', to: 'trip', a: 20000 }] });
const a2 = P.leftovers({ periodTo: '2026-12-24', places: [{ id: 'free', left: 20000 }], answers: [{ place: 'free', to: 'trip', a: 20000 }] });
console.log('S4 period end: each phone writes', a1.moves.length, '+', a2.moves.length, 'moves of 20,000; after the merge 40,000 left Free to spend that held 20,000. Refused on one phone?',
  JSON.stringify(P.leftovers({ periodTo: '2026-12-24', places: [{ id: 'free', left: 20000 }], answers: [{ place: 'free', to: 'trip', a: 20000 }, { place: 'free', to: 'trip', a: 20000 }] })));
