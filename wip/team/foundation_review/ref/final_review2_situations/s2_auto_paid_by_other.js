// S2: the gym fee (8,000 on the 8th) logs itself. This month a parent paid it. The person removes the
// spend the app logged (Undo: the auto record marked gone). Right: bank 100,000; nothing expected.
const { lookahead, sc, bank, show } = require('./base');
const s = sc({ accounts: [bank('b', '2027-01-04', 100000)],
  bills: [{ id: 'gym', name: 'Gym', kind: 'auto_spend', account: 'b', amount: 8000, schedule: { frequency: 'monthly', day: 8 }, weekend_holiday: 'none' }],
  events: [ { id: 'auto:gym@2027-01-08', date: '2027-01-08', told: '2027-01-08T10:00', kind: 'spend', account: 'b', amount: 8000, settles: 'gym@2027-01-08', gone: true } ] });
const r = lookahead(s, '2027-01-12');
show('S2 bank after removing the logged gym fee', r.accounts.b.bank, 100000);
console.log('     check-in list:', JSON.stringify(r.checkIn.toConfirm), ' not seen:', JSON.stringify(r.notSeenYet.items));
// with a skip instead
s.events.push({ id: 'k1', date: '2027-01-08', kind: 'skip', settles: 'gym@2027-01-08' });
show('S2b with a skip', lookahead(s, '2027-01-12').accounts.b.bank, 100000);
