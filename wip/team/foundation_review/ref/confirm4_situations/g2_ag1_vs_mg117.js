// g2: AG1 read as written ("every write made now, including a waiting entry applied ... uses nextAt") against mg-117.
// [AH4] AG1 is withdrawn as worded: an applied entry's keys carry the entry's own `at` (AE2); only an entry a restore
// brought back takes the D4 clock (mv-117, mv-118). This script still shows what the withdrawn reading would do.
// Cases: rules/merge.json mg-117; rules/move.json mv-122 (the other way round).
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'rules', 'merge_ref.js'));
const c = require(path.join(__dirname, '..', '..', 'rules', 'merge.json')).cases.find(x => x.id === 'mg-117');
console.log('as AE2 and AH4 stand:', JSON.stringify(M.merge(c.input.mine, c.input.theirs).schedules[0].amounts['2027-01-25']), ' (hand answer 120000, the desktop edit of 27 Nov)');
const mine = JSON.parse(JSON.stringify(c.input.mine));
mine.schedules[0].amounts['2027-01-25'].at = M.nextAt('2026-11-28T08:00:00.000+09:00', '2026-11-28T08:00:00.000+09:00');
console.log('read as AG1 was worded (withdrawn):', JSON.stringify(M.merge(mine, c.input.theirs).schedules[0].amounts['2027-01-25']));
