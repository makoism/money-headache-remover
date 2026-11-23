// S6: in Hawaii, dinner of 80.00 USD on the yen card on Fri 5 Feb. The person types it as about 12,000 yen
// (est). The card posts it on Fri 12 Feb as 12,830 yen (rate and a 2% fee): 6.9% more, inside 10%.
// S6b: a hotel deposit of 300 USD charged on the yen card on 3 Feb, typed as 45,000 est; refunded and
// re-charged at checkout: the card shows +47,100 then a refund of -47,100 on 9 Feb, and the final 46,900.
const { lookahead, sc, bank, show } = require('./base');
const card = { id: 'c', name: 'Card', kind: 'card', currency: 'JPY', statement_close_day: 15,
  payment: { day: 10, months_after_close: 1, from: 'b', pays: 'in full', weekend_holiday: 'move later' },
  opening: { date: '2027-01-04', statement: { closed: '2026-12-15', amount: 0, paid: true }, current: 0 } };
let s = sc({ accounts: [bank('b', '2027-01-04', 300000), card], events: [
  { id: 't1', date: '2027-02-05', told: '2027-02-05T21:00', kind: 'spend', account: 'c', amount: 12000, est: true, note: 'dinner, 80 USD' },
  { id: 'i1', date: '2027-02-05', posted: '2027-02-12', told: '2027-02-20T09:00', kind: 'spend', account: 'c', amount: 12830, source: 'statement' } ] });
let r = lookahead(s, '2027-02-20');
show('S6 card owed', r.cards.c.owedNow, 12830);
// posted 8 working days later (foreign lines often post late): outside the 7-working-day card window by posted date, buy date is the same day
s.events[1].posted = '2027-02-17';
r = lookahead(s, '2027-02-20');
show('S6 posted 8 working days later, card owed', r.cards.c.owedNow, 12830);
