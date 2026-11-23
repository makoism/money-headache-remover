// fee_place, but the top-up t1 is a ticked transfer schedule occurrence written on two phones. Field names as SCHEMA_V3
// (decision Z): a fee record's id is built from its transfer, `fee:<transfer id>` [X2], so each phone writes `fee:t1` and
// the merge keeps one record (the earliest `told`, as merge_ref keeps). Before X2 each phone wrote its own ordinary id
// (`fee1`, `phone2-abc-1`) and the fee was taken twice.
const path = require('path');
const { lookahead } = require(path.join(__dirname, '..', 'lookahead_ref.js'));
const sc = JSON.parse(JSON.stringify(require(path.join(__dirname, '..', '..', 'scenarios', 'fee_place.json'))));
const fee1 = sc.events.find(e => e.id === 'fee:t1');
const phone2 = Object.assign({}, fee1, { told: '2027-01-05T12:05' });   // the second phone's copy: the same built id
const byId = new Map();
for (const e of sc.events.concat([phone2])) { const had = byId.get(e.id); if (!had || had.told > e.told) byId.set(e.id, e); }
sc.events = [...byId.values()];
const r = lookahead(sc, '2027-01-06');
console.log('fee records after the merge:', sc.events.filter(e => e.of === 't1').length, '| trip kept (hand: 1,985.00, the fee is paid once):', r.places.trip.kept, '| bank', r.accounts.b.bank);
