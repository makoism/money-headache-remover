// g3: X8 with a removed `amounts` key (AE1 keeps removed keys with `gone` forever). After AH3 a removed key names nothing.
// Cases: rules/edits.json ed-32 to ed-34; scenarios/keyed_removed_x8.json krx-01, krx-02; the money: keyed_removed.json kr-01 to kr-06.
const path = require('path');
const E = require(path.join(__dirname, '..', '..', 'rules', 'edits_ref.js'));
const amounts = { '2026-12-25': { amount: 0, gone: '2026-11-24', at: '2026-11-24T10:00:00.000+09:00', by: 'phn001' } };
console.log(JSON.stringify(E.ask('change_from', { schedule: 'pay', wanted: '2026-12-01', amounts })), '(hand answer: ok, the key is removed)');
