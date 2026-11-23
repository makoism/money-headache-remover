// Set up on pay day (Fri 25 Dec... use Fri 25 Jun 2027) at 08:00, the pay of 250,000 has not landed yet; it lands that afternoon.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
function sc(notOut, events) { return {
  currency: 'JPY', holidays: {}, main_bank: 'bank',
  accounts: [ { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0,
    opening: Object.assign({ date: '2027-06-25', told: '2027-06-25T08:00', amount: 40000 }, notOut ? { not_gone_out: ['pay@2027-06-25'] } : {}) } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 25 }, weekend_holiday: 'move earlier', starts_period: true } ],
  bills: [ { id: 'rent', name: 'Rent', account: 'bank', amount: 80000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'move later' } ],
  goals: [], plan: { lines: [], free: { amount: 60000, per: 'month' } }, events };
}
for (const [label, s, d] of [
  ['no answer stored, setup day', sc(false, []), '2027-06-25'],
  ['not_gone_out, setup day', sc(true, []), '2027-06-25'],
  ['no answer, check-in 26 Jun 290,000', sc(false, [{ id: 'c1', kind: 'check', account: 'bank', date: '2027-06-26', told: '2027-06-26T09:00', amount: 290000 }]), '2027-06-26'],
]) { const r = lookahead(s, d); console.log(label, '| headline', r.safeToSpend.headline, 'shortfall', r.safeToSpend.shortfall, '| next pay', JSON.stringify(r.daysToNextPay), '| toConfirm', JSON.stringify(r.checkIn.toConfirm), '| warn', r.warnings.map(w=>w.code).join(','), '\n   why', r.accounts.bank.why); }
