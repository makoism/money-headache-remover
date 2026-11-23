// to_place: on Thu 7 Jan both phones (a couple) place the trip's 100,000 in Free to spend before syncing.
// Each writes a place_money with an ordinary id. Hand: only 100,000 was to place; Free to spend can grow by 100,000 at most.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = JSON.parse(JSON.stringify(require('/home/user/money-headache-remover/wip/team/foundation_review/scenarios/to_place.json')));
sc.events = [
  { id: 'phoneA-1', date: '2027-01-07', told: '2027-01-07T12:00', kind: 'place_money', account: 'b', to_place_of: 'trip', into: 'free', amount: 100000 },
  { id: 'phoneB-1', date: '2027-01-07', told: '2027-01-07T12:03', kind: 'place_money', account: 'b', to_place_of: 'trip', into: 'free', amount: 100000 } ];
const r = lookahead(sc, '2027-01-07');
console.log('headline (hand: 20,000 + 100,000 = 120,000):', r.safeToSpend.headline, '| Free to spend left', r.safeToSpend.cappedByFreeToSpend, '| bank headroom', r.accounts.b.headroom, '| to place', JSON.stringify(r.toPlace));
