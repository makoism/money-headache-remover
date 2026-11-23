// S6: gym 8,000 logs itself on 1 Feb. The phone (offline) and the laptop each write the spend on their next open.
const { lookahead, sc, bank } = require('./base');
const s = sc({ accounts: [bank('b', '2027-01-04', 100000)],
  bills: [{ id: 'gym', name: 'Gym', kind: 'auto_spend', account: 'b', amount: 8000, schedule: { frequency: 'monthly', day: 1 }, weekend_holiday: 'none' }],
  events: [ { id: 'phone-aaa-1', date: '2027-02-01', kind: 'spend', account: 'b', amount: 8000, settles: 'gym@2027-02-01' },
            { id: 'laptop-bbb-1', date: '2027-02-01', kind: 'spend', account: 'b', amount: 8000, settles: 'gym@2027-02-01' } ] });
const r = lookahead(s, '2027-02-03');
console.log('S6 bank', r.accounts.b.bank, '(right 92,000: 100,000 - 8,000)');
