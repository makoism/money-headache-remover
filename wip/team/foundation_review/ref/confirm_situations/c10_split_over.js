// A moved 38.31 copy: bankNow 100,000; a goal "Moving" with start (saved so far) 300,000, kept in a savings account
// 38.31 never knew about. 11.1 puts every goal start into the bank's opening split.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = { currency: 'JPY', holidays: {}, main_bank: 'bank',
  accounts: [ { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-12-01', amount: 100000, split: { goals: { move: 300000 }, free: 40000 } } } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true } ],
  bills: [], goals: [ { id: 'move', name: 'Moving', kept_in: 'bank', due: '2027-06-30' } ], plan: { lines: [], free: { amount: 60000, per: 'month' } }, events: [] };
const r = lookahead(sc, '2026-12-01');
console.log('headline', r.safeToSpend.headline, 'shortfall', r.safeToSpend.shortfall, r.warnings.map(w => w.code + ' ' + (w.short || '')).join(','), '\n', r.accounts.bank.why);
