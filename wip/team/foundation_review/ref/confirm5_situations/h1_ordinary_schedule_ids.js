// confirm_review_5 h1: built ids and X8 with the ids the app really makes for a person's own schedule, place, account
// (SCHEMA_V3 section 0: "Everything a person types gets an ordinary id", <device>-<session>-<counter>).
const R = '/home/user/money-headache-remover/wip/team/foundation_review/rules/';
const m = require(R + 'merge_ref'), e = require(R + 'edits_ref');
const pay = 'k7qzpa-m2xq7ab9zt-41', trip = 'k7qzpa-m2xq7ab9zt-9', old = 'k7qzpa-m2xq7ab9zt-3';
const ids = ['set:' + pay + '@2026-12-25', 'auto:' + pay + '@2026-12-25', 'skip:' + pay + '@2026-12-25',
  'pe:' + pay + '@2026-12-25:free', 'pe:pay@2026-12-25:' + trip, 'ps:' + pay + '@2026-12-25',
  'rm:' + trip, 'close:' + old, 'close:' + old + ':2', 'fee:set:' + pay + '@2026-12-25'];
for (const id of ids) console.log('idOk', id, '->', m.idOk(id), '(hand: true)');
console.log('X8 settled 25 Dec, change from 1 Dec ->', JSON.stringify(e.changeFrom({ schedule: pay, wanted: '2026-12-01', settles: [pay + '@2026-12-25'] })), '(hand: refused, offer 2026-12-26)');
console.log('X8 amounts key 25 Dec ->', JSON.stringify(e.changeFrom({ schedule: pay, wanted: '2026-12-01', amounts: { '2026-12-25': { amount: 0, at: '2026-11-24T10:00:00.000+09:00', by: 'k7qzpa' } } })), '(hand: refused)');
console.log('X8 same with id "pay" ->', JSON.stringify(e.changeFrom({ schedule: 'pay', wanted: '2026-12-01', settles: ['pay@2026-12-25'] })));
