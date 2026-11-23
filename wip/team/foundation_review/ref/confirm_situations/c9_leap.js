// Leap day and year boundary: yearly bill on 29 Feb (paid from a refill place), pay on the last day (31), card closing the last day.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = { currency: 'JPY', holidays: { dates: [{ date: '2028-01-03' }, { date: '2027-12-31' }] }, main_bank: 'bank',
  accounts: [ { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2027-12-20', amount: 100000 } },
    { id: 'card', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 'last', payment: { day: 27, months_after_close: 1, from: 'bank', weekend_holiday: 'move later' },
      opening: { date: '2027-12-20', current: 10000, statement: { closed: '2027-11-30', amount: 0, paid: true } } } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 31 }, weekend_holiday: 'move earlier', starts_period: true } ],
  bills: [ { id: 'ins', name: 'Insurance', account: 'bank', amount: 36000, schedule: { frequency: 'yearly', date: '02-29' }, weekend_holiday: 'move later' } ],
  goals: [], events: [] };
const r = lookahead(sc, '2027-12-20');
console.log(JSON.stringify(r.daysToNextPay), r.horizon, JSON.stringify(r.cards.card.next), '\n', r.accounts.bank.why);
const r2 = lookahead(sc, '2028-02-01');
console.log(JSON.stringify(r2.dueBeforeNextPay.items), JSON.stringify(r2.notSeenYet.items.map(i=>i.item)));
