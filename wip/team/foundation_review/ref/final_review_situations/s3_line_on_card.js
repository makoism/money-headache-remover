// S3: Mako's life: Food line 50,000 a month, every food buy is on the card (paid in full from the bank).
// Bank 400,000 at setup on Fri 11 Dec 2026, right after pay (pay 300,000 on the 10th). Card closes the 15th, paid 10th next month.
const { lookahead, sc, bank } = require('./base');
const card = { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
  payment: { day: 10, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'move later' },
  opening: { date: '2026-12-11', statement: { closed: '2026-11-15', amount: 0, paid: true }, current: 0 } };
function run(lineAcct) {
  const s = sc({ accounts: [bank('b', '2026-12-11', 400000, { opening: { date: '2026-12-11', amount: 400000, split: { lines: { food: 50000 }, free: 0 } } }), card],
    income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 300000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
    plan: { lines: [{ id: 'food', name: 'Food', account: lineAcct, per: 'month', amount: 50000 }], free: { account: 'b', per: 'month', amount: 0 } },
    events: [ { id: 'f1', date: '2026-12-12', kind: 'spend', account: 'c', amount: 30000, line: 'food' } ] });
  const r = lookahead(s, '2026-12-13');
  const food = r.accounts.b.why;
  return r.accounts.b.headroom + ' | ' + food;
}
console.log('line on bank:', run('b'));
console.log('line on card:', run('c'));
console.log('Right: 400,000 - 20,000 food still to spend - 30,000 card payment 12 Jan ... (food bought on the card counts once)');
