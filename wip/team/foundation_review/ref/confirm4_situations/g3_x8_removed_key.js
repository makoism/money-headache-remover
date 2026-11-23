// X8 with a removed `amounts` key (AE1 keeps removed keys with `gone` forever).
const E = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js');
const amounts = { '2026-12-25': { amount: 0, gone: '2026-11-24', at: '2026-11-24T10:00:00.000+09:00', by: 'phn001' } };
console.log(JSON.stringify(E.ask ? E.ask('change_from', { schedule: 'pay', wanted: '2026-12-01', amounts }) : 'no ask'));
