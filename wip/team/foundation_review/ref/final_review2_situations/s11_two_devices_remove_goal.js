// S11: a goal holding 50,000 is removed on the phone and, before the copies meet, on the laptop. Each writes O's
// move of 50,000 to Waiting with an ordinary id (O2 builds ids only for set:, auto:, pe:, ps:). The merge keeps both.
const m = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const phone = [{ id: 'k7qzpa-a1b2c3d4e5-3', k: 'move', place: 'trip', place2: 'waiting', a: 50000, at: '2027-03-01T10:00:00+09:00', by: 'k7qzpa' }];
const laptop = [{ id: 'p9x2mm-z9y8x7w6v5-8', k: 'move', place: 'trip', place2: 'waiting', a: 50000, at: '2027-03-01T21:00:00+09:00', by: 'p9x2mm' }];
const merged = m.mergeList(phone, laptop);
const toWaiting = merged.filter(e => !e.gone && e.place2 === 'waiting').reduce((t, e) => t + e.a, 0);
console.log((toWaiting === 50000 ? 'OK   ' : 'WRONG') + ' S11 moved to Waiting after the merge: ' + toWaiting + ', right 50000 (the goal held 50,000)');
try { m.idFor({ k: 'rm', place: 'trip' }); } catch (e) { console.log('     idFor:', e.message); }
