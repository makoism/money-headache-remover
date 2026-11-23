const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const base = () => ({
  currency: 'JPY', holidays: { dates: [], bank_closed: [] },
  accounts: [ { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-11-20', amount: 300000 } } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true } ],
  bills: [], goals: [], events: [] });
// 13. trip goal 100k in bank, then the trip is paid from the goal money
{ const sc = base(); sc.goals.push({ id: 'trip', name: 'Trip', kept_in: 'bank', opening: { date: '2026-11-20', amount: 100000 } });
  sc.events.push({ date: '2026-11-25', kind: 'spend', account: 'bank', amount: 100000, place: 'trip', goal: 'trip', note: 'the trip, paid from trip money' });
  const r = lookahead(sc, '2026-11-26'); console.log('13 goal used:', r.accounts.bank.bank, r.accounts.bank.headroom, r.accounts.bank.why); }
// 14. partial payment of a pay-in-full card: statement 50,000, paid 40,000
{ const sc = base(); sc.accounts.push({ id: 'card', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
    payment: { day: 5, months_after_close: 1, from: 'bank', weekend_holiday: 'none' },
    opening: { date: '2026-11-20', current: 50000, statement: { closed: '2026-11-15', amount: 50000, paid: false } } });
  sc.events.push({ date: '2026-12-05', kind: 'card_payment', from: 'bank', card: 'card', amount: 40000, settles: 'card@2026-12-05' },
                 { date: '2026-12-01', kind: 'spend', account: 'card', amount: 20000 });
  const r = lookahead(sc, '2026-12-16'); console.log('14 partial pay:', JSON.stringify({ owed: r.cards.card.owedNow, next: r.cards.card.next })); }
