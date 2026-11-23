// F7. A phone bill of 8,000 is charged to the card on the 20th each month (a bill whose account is the card; the
// person did not mark it as logging itself). The card closes on the 25th and is paid in full on the 5th of the
// next month from the bank. Bank 100,000 set up Fri 11 Dec (the day after pay); card owes 0. Rent 95,000 on 27 Dec. Pay on the 10th.
// Right: the 20 Dec phone bill is in the statement closing 25 Dec, paid Tue 5 Jan before pay on 10 Jan:
// 100,000 - 95,000 (rent) - 8,000 (card, 5 Jan) = -3,000, the lowest point. Safe to spend 0, 3,000 short.
const { lookahead, H, show } = require('./base');
const sc = { currency: 'JPY', main_bank: 'b', holidays: H, goals: [],
  accounts: [{ id: 'b', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-12-11', amount: 100000 } },
    { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 25, payment: { day: 5, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'none' },
      opening: { date: '2026-12-11', statement: { closed: '2026-11-25', amount: 0, paid: true }, current: 0 } }],
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 250000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'none', starts_period: true }],
  bills: [{ id: 'rent', name: 'Rent', account: 'b', amount: 95000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'none' },
          { id: 'phone', name: 'Phone', account: 'c', amount: 8000, schedule: { frequency: 'monthly', day: 20 }, weekend_holiday: 'none' }],
  events: [] };
const r = lookahead(sc, '2026-12-11');
console.log('     why:', r.accounts.b.why);
show('bank lowest point before pay', r.accounts.b.lowest, -3000);
show('headline', r.safeToSpend.headline, 0);
