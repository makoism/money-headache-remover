// A card with a known close day (25th, paid 10th next month from bank) and no typed last statement at the opening.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = {
  currency: 'JPY', holidays: {}, main_bank: 'bank',
  accounts: [
    { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-11-20', amount: 300000 } },
    { id: 'card', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 25,
      payment: { day: 10, months_after_close: 1, from: 'bank', weekend_holiday: 'none' },
      opening: { date: '2026-11-20', current: 50000 } } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 15 }, weekend_holiday: 'none', starts_period: true } ],
  bills: [], goals: [],
  events: [ { id: 's1', kind: 'spend', account: 'card', date: '2026-11-22', amount: 20000, told: '2026-11-22' } ]
};
for (const d of ['2026-11-23', '2026-12-01', '2027-01-05']) {
  const r = lookahead(sc, d);
  console.log(d, 'card next', JSON.stringify(r.cards.card.next), 'owed', r.cards.card.owedNow, 'bank headroom', r.accounts.bank.headroom, '\n  why', r.accounts.bank.why);
}
