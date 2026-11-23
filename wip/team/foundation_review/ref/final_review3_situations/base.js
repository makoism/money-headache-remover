const R = '/home/user/money-headache-remover/wip/team/foundation_review/';
const { lookahead } = require(R + 'ref/lookahead_ref.js');
const pe = require(R + 'rules/period_end_ref.js');
const H = { country: 'none', dates: [], bank_closed: [] };
const show = (label, got, right) => console.log((JSON.stringify(got) === JSON.stringify(right) ? 'OK   ' : 'WRONG') + ' ' + label + ': ref ' + JSON.stringify(got) + ', right ' + JSON.stringify(right));
module.exports = { lookahead, pe, H, show };
