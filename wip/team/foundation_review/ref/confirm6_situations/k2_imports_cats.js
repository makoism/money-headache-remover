// Two devices each teach the statement reader one merchant; imports is a single record with one `at`.
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const base = { imports: { cats: {}, at: '2026-11-24T09:00:00.000+09:00', by: 'phonea' } };
const phone = { imports: { cats: { 'seven eleven': 'food' }, at: '2026-12-01T08:00:00.000+09:00', by: 'phonea' } };
const desk = { imports: { cats: { 'amazon co jp': 'shopping' }, at: '2026-12-01T09:00:00.000+09:00', by: 'deskaa' } };
console.log(JSON.stringify(M.merge(phone, desk).imports.cats), '(hand: both lessons kept)');
// plan.limits: aims edited on the phone, ceiling on the desktop
const p = { plan: { limits: { ceiling: 50000, aims: { play: 0.1, give: 0.08 }, cur: 'JPY', at: '2026-12-01T08:00:00.000+09:00', by: 'phonea' } } };
const d = { plan: { limits: { ceiling: 40000, aims: { play: 0.1, give: 0.05 }, cur: 'JPY', at: '2026-12-01T09:00:00.000+09:00', by: 'deskaa' } } };
console.log(JSON.stringify(M.merge(p, d).plan.limits), '(phone aims give 0.08 lost)');
