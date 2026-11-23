const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const H = { country: 'none', dates: [], bank_closed: [] };
function sc(o) { return Object.assign({ currency: 'JPY', holidays: H, income: [], bills: [], goals: [], events: [] }, o); }
const bank = (id, date, amount, extra) => Object.assign({ id, name: id, kind: 'bank', currency: 'JPY', minimum: 0, opening: { date, amount } }, extra || {});
const show = (label, got, right) => console.log((got === right ? 'OK   ' : 'WRONG') + ' ' + label + ': model ' + got + ', right ' + right);
module.exports = { lookahead, sc, bank, H, show };
