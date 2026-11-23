// confirm_review_5 h2: lists inside a record that are not `steps`, `rules` or `extraSteps`.
const m = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref');
const T = h => '2026-11-24T' + h + ':00:00.000+09:00';
// 1. home.curs (SCHEMA_V3 2.1: "Entries merge by `from` like `rules` entries"). Phone: moving home in April, adds PHP.
//    Desktop, not yet synced: sets the country. Hand answer: both entries kept (JPY, PHP).
const a = { home: { curs: [{ from: '2026-11-01', cur: 'JPY', at: T('09'), by: 'phn001' }, { from: '2027-04-01', cur: 'PHP', at: T(10), by: 'phn001' }], at: T(10), by: 'phn001' } };
const b = { home: { curs: [{ from: '2026-11-01', cur: 'JPY', at: T('09'), by: 'phn001' }], country: 'PH', at: T(11), by: 'dsk001' } };
console.log('home.curs after merge:', m.merge(a, b).home.curs.map(x => x.cur).join(','), '(hand: JPY,PHP)');
// 2. pay-later `plans` (SCHEMA_V3 3: a list of { id, amount, count, first, at, by }). Phone (offline) adds a 3 x 3,000
//    plan; desktop adds a 6 x 5,000 plan on the same account. Hand answer: both plans; 8,000 due on 5 Dec.
const p1 = { accounts: [{ id: 'gg', kind: 'paylater', at: T(10), by: 'phn001', plans: [{ id: 'pl1', amount: 3000, count: 3, first: '2026-12-05', at: T(10), by: 'phn001' }] }] };
const p2 = { accounts: [{ id: 'gg', kind: 'paylater', at: T(11), by: 'dsk001', plans: [{ id: 'pl2', amount: 5000, count: 6, first: '2026-12-05', at: T(11), by: 'dsk001' }] }] };
const plans = m.merge(p1, p2).accounts[0].plans;
console.log('plans after merge:', plans.map(x => x.id).join(','), 'due 5 Dec:', plans.reduce((s, x) => s + x.amount, 0), '(hand: pl1,pl2 and 8000)');
