// AG1 read as written ("every write made now, including a waiting entry applied ... uses nextAt") against mg-117.
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const c = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge.json').cases.find(x => x.id === 'mg-117');
const mine = JSON.parse(JSON.stringify(c.input.mine));
mine.schedules[0].amounts['2027-01-25'].at = M.nextAt('2026-11-28T08:00:00.000+09:00', '2026-11-28T08:00:00.000+09:00');
const out = M.merge(mine, c.input.theirs);
console.log('Jan 2027 pay key now:', JSON.stringify(out.schedules[0].amounts['2027-01-25']), ' mg-117 expects 120000 (the desktop edit of 27 Nov)');
