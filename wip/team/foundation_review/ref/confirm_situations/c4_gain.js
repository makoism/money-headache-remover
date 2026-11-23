const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = require('/home/user/money-headache-remover/wip/team/foundation_review/scenarios/check_gain.json');
const r = lookahead(sc, '2027-01-08');
console.log('headline', r.safeToSpend.headline, 'capped', r.safeToSpend.cappedByFreeToSpend, 'warnings', r.warnings.map(w => w.account + ' ' + w.code).join(', '));
