// Card with opening statement closed 25 Oct 2026; spend in May 2029; ask in June 2029.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = {
  currency: 'JPY', holidays: {}, main_bank: 'bank',
  accounts: [
    { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-11-20', amount: 300000 } },
    { id: 'card', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 25,
      payment: { day: 10, months_after_close: 1, from: 'bank', weekend_holiday: 'none' },
      opening: { date: '2026-11-20', current: 0, statement: { closed: '2026-10-25', amount: 0, paid: true } } } ],
  income: [], bills: [], goals: [],
  events: [ { id: 's1', kind: 'spend', account: 'card', date: '2029-05-02', amount: 20000, told: '2029-05-02' },
            { id: 'ck', kind: 'check', account: 'bank', date: '2029-05-01', amount: 300000, told: '2029-05-01T09:00' } ]
};
for (const d of ['2029-03-01', '2029-05-03', '2029-06-01']) { const r = lookahead(sc, d); console.log(d, JSON.stringify(r.cards.card.next), r.cards.card.owedNow, r.accounts.bank.headroom); }
