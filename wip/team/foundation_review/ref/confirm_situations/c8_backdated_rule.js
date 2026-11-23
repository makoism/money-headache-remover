// pay_day_moves, but on Tue 15 Dec the person corrects the pay day "from 1 Dec, the 25th" (a rules entry dated before
// the 10 Dec pay that is already settled). H2 lets a change start from any date.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = JSON.parse(JSON.stringify(require('/home/user/money-headache-remover/wip/team/foundation_review/scenarios/pay_day_moves.json')));
sc.income[0].changes[0].from = '2026-12-01';
sc.events = sc.events.filter(e => e.date <= '2026-12-15');
const r = lookahead(sc, '2026-12-15');
console.log('next pay', JSON.stringify(r.daysToNextPay), '| bank', r.accounts.bank.bank, '| headroom', r.accounts.bank.headroom, '\n why', r.accounts.bank.why);
const r0 = lookahead(JSON.parse(JSON.stringify(require('/home/user/money-headache-remover/wip/team/foundation_review/scenarios/pay_day_moves.json'))), '2026-12-15');
console.log('unchanged copy: next pay', JSON.stringify(r0.daysToNextPay), 'headroom', r0.accounts.bank.headroom);
