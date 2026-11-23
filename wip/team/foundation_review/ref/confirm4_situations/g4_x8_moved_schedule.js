// X8 on a moved schedule (id `mv:pay:steps.a`): the occurrence-name pattern only allows [a-z0-9_].
const E = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js');
const s = 'mv:pay:steps.a';
console.log('amounts key  :', JSON.stringify(E.ask('change_from', { schedule: s, wanted: '2026-12-01', amounts: { '2027-01-25': { amount: 0 } } })));
console.log('settled pay  :', JSON.stringify(E.ask('change_from', { schedule: s, wanted: '2026-12-01', settles: [s + '@2026-12-25'] })));
console.log('plain id     :', JSON.stringify(E.ask('change_from', { schedule: 'pay', wanted: '2026-12-01', settles: ['pay@2026-12-25'] })));
console.log('hand answer for the moved pay: refused, offer 2026-12-26 (settled) / 2027-01-26 (amounts)');
