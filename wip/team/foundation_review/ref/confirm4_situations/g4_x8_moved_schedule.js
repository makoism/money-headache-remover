// g4: X8 on a moved schedule (id `mv:pay:steps.a`). After AH2 every occurrence-name reader accepts moved ids.
// Cases: rules/edits.json ed-25 to ed-31.
const path = require('path');
const E = require(path.join(__dirname, '..', '..', 'rules', 'edits_ref.js'));
const s = 'mv:pay:steps.a', key = { amount: 0, at: '2026-11-28T08:00:00.000+09:00', by: 'phn001' };
console.log('amounts key  :', JSON.stringify(E.ask('change_from', { schedule: s, wanted: '2026-12-01', amounts: { '2027-01-25': key } })));
console.log('settled pay  :', JSON.stringify(E.ask('change_from', { schedule: s, wanted: '2026-12-01', settles: [s + '@2026-12-25'] })));
console.log('pe: record   :', JSON.stringify(E.ask('change_from', { schedule: s, wanted: '2026-12-01', pe: ['pe:' + s + '@2026-12-25:free'] })));
console.log('plain id     :', JSON.stringify(E.ask('change_from', { schedule: 'pay', wanted: '2026-12-01', settles: ['pay@2026-12-25'] })));
console.log('hand answer for the moved pay: refused, offer 2027-01-26 (amounts) / 2026-12-26 (settled, pe:)');
