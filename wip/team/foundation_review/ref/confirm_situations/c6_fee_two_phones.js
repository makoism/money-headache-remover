// fee_place, but the top-up t1 is a ticked transfer schedule occurrence written on two phones: one `set:` transfer
// (merged), and each phone wrote its own fee record with an ordinary id (no built id for fee records in SCHEMA_V3 section 0).
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = JSON.parse(JSON.stringify(require('/home/user/money-headache-remover/wip/team/foundation_review/scenarios/fee_place.json')));
const fee1 = sc.events.find(e => e.id === 'fee1');
sc.events.splice(2, 0, Object.assign({}, fee1, { id: 'phone2-abc-1', told: '2027-01-05T12:05' }));
const r = lookahead(sc, '2027-01-06');
console.log('trip kept (hand: 1,985.00, the fee is paid once):', r.places.trip.kept, '| bank', r.accounts.b.bank);
