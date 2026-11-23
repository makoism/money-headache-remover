// F5. Kinds the saved shape has (6.2) that no ask or case reads: `adjust`, `hand` (Wallet mode), and a `move`
// OUT of a place (taking 10,000 back from the trip fund to the emergency fund). Bank 300,000 set up 10 Dec with
// the trip 50,000 and emergency 20,000 inside it. Free to spend 60,000 (split 60,000).
const { lookahead, H, show } = require('./base');
const mk = ev => ({ currency: 'JPY', main_bank: 'b', holidays: H, bills: [],
  accounts: [{ id: 'b', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-12-10', amount: 300000, split: { goals: { trip: 50000, em: 20000 }, free: 60000 } } },
             { id: 'w', name: 'Wallet', kind: 'wallet', currency: 'JPY', tracked: false, minimum: 0, opening: { date: '2026-12-10', amount: 0 } }],
  goals: [{ id: 'trip', name: 'Trip', kept_in: 'b' }, { id: 'em', name: 'Emergency', kept_in: 'b' }],
  plan: { free: { per: 'month', amount: 60000 } },
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 300000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
  events: ev });
let r = lookahead(mk([{ id: 'm1', kind: 'set_aside', from: 'trip', goal: 'em', amount: 10000, date: '2026-12-12', told: '2026-12-12T10:00' }]), '2026-12-12');
show('trip after 10,000 moved to emergency', r.places.trip.kept, 40000);
show('emergency after the move', r.places.em.kept, 30000);
r = lookahead(mk([{ id: 'a1', kind: 'adjust', account: 'b', amount: -3000, date: '2026-12-12', told: '2026-12-12T10:00' }]), '2026-12-12');
show('bank after an accepted difference of -3,000', r.accounts.b.bank, 297000);
r = lookahead(mk([{ id: 'h1', kind: 'hand', from: 'b', to: 'w', amount: 20000, date: '2026-12-12', told: '2026-12-12T10:00' }]), '2026-12-12');
show('bank after 20,000 handed to the wallet (ATM)', r.accounts.b.bank, 280000);
