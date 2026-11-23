const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const base = () => ({
  currency: 'JPY', holidays: { dates: [ { date: '2026-11-23' }, { date: '2027-01-11' } ], bank_closed: [] },
  accounts: [ { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-11-20', amount: 300000 } } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true } ],
  bills: [ { id: 'rent', name: 'Rent', account: 'bank', amount: 80000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'move later' } ],
  goals: [], events: [] });
const show = (t, f) => { try { console.log('\n== ' + t + '\n' + JSON.stringify(f(), null, 0)); } catch (e) { console.log('\n== ' + t + '\nCRASH ' + e.message); } };
const card = (o) => Object.assign({ id: 'card', name: 'Card', kind: 'card', currency: 'JPY',
  payment: { day: 26, months_after_close: 1, from: 'bank', weekend_holiday: 'move later' } }, o);

// 5. Card close day "not sure" (A8 default), no statement known
show('5a cutDay null, no statement', () => { const sc = base(); sc.accounts.push(card({ statement_close_day: null, opening: { date: '2026-11-20', current: 30000 } })); return lookahead(sc, '2026-11-21').cards; });
// 5b with a statement given, after first payment is made
show('5b cutDay null, after first payment', () => { const sc = base();
  sc.accounts.push(card({ statement_close_day: null, opening: { date: '2026-11-20', current: 30000, statement: { closed: '2026-10-31', amount: 30000, paid: false } } }));
  sc.events.push({ date: '2026-11-26', kind: 'card_payment', from: 'bank', card: 'card', amount: 30000, settles: 'card@2026-11-26' },
    { date: '2026-11-28', kind: 'spend', account: 'card', amount: 40000 });
  const r = lookahead(sc, '2026-12-20'); return { owed: r.cards.card.owedNow, next: r.cards.card.next, due: r.dueBeforeNextPay.items, head: r.accounts.bank.headroom, why: r.accounts.bank.why };
});
show('5c same, 28 Dec (payment day 26 Dec passed, unpaid?)', () => { const sc = base();
  sc.accounts.push(card({ statement_close_day: null, opening: { date: '2026-11-20', current: 30000, statement: { closed: '2026-10-31', amount: 30000, paid: false } } }));
  sc.events.push({ date: '2026-11-26', kind: 'card_payment', from: 'bank', card: 'card', amount: 30000, settles: 'card@2026-11-26' },
    { date: '2026-11-28', kind: 'spend', account: 'card', amount: 40000 });
  const r = lookahead(sc, '2026-12-29'); return { notSeen: r.notSeenYet.items, toConfirm: r.checkIn.toConfirm, owed: r.cards.card.owedNow };
});
// 6. USD card paid from JPY bank
show('6 USD card from JPY bank', () => { const sc = base();
  sc.accounts.push(card({ currency: 'USD', statement_close_day: 15, payment: { day: 5, months_after_close: 1, from: 'bank', weekend_holiday: 'move later' },
    opening: { date: '2026-11-20', current: 500, statement: { closed: '2026-11-15', amount: 500, paid: false } } }));
  const r = lookahead(sc, '2026-11-21'); return { head: r.accounts.bank.headroom, why: r.accounts.bank.why, afterCards: r.total };
});
// 7. Refund bigger than statement
show('7 refund larger than statement', () => { const sc = base();
  sc.accounts.push(card({ statement_close_day: 15, payment: { day: 10, months_after_close: 1, from: 'bank', weekend_holiday: 'move later' },
    opening: { date: '2026-11-20', current: 10000, statement: { closed: '2026-11-15', amount: 10000, paid: false } } }));
  sc.events.push({ date: '2026-11-25', kind: 'refund', account: 'card', amount: 30000, note: 'returned a 30,000 jacket bought in Oct' },
    { date: '2026-12-10', kind: 'card_payment', from: 'bank', card: 'card', amount: 10000, settles: 'card@2026-12-10' },
    { date: '2026-12-20', kind: 'spend', account: 'card', amount: 25000 });
  const r1 = lookahead(sc, '2026-12-16'); const r2 = lookahead(sc, '2027-01-16');
  return { dec16: { owed: r1.cards.card.owedNow, next: r1.cards.card.next, st: r1.cards.card.statements }, jan16: { owed: r2.cards.card.owedNow, next: r2.cards.card.next, notSeen: r2.notSeenYet, toConfirm: r2.checkIn.toConfirm.map(x=>x.item+' '+x.amount) } };
});
// 8. Pay day changes from the 10th to the 25th from January (rule edited in place, as A5 says)
show('8 pay day edited 10th -> 25th', () => { const sc = base();
  sc.events.push({ date: '2026-12-10', kind: 'pay_in', account: 'bank', amount: 250000, settles: 'pay@2026-12-10' });
  sc.income[0].schedule = { frequency: 'monthly', day: 25 };
  const r = lookahead(sc, '2027-01-05'); return { notSeen: r.notSeenYet.items, toConfirm: r.checkIn.toConfirm, next: r.daysToNextPay };
});
// 9. Yearly bill (car tax 40,000 every 31 May) and every-3-months as in schema
show('9 yearly bill', () => { const sc = base(); sc.bills.push({ id: 'tax', name: 'Car tax', account: 'bank', amount: 400000, schedule: { frequency: 'yearly', date: '05-31' }, weekend_holiday: 'move later' });
  const r = lookahead(sc, '2027-05-20'); return { due: r.dueBeforeNextPay.items, laterOn: r.laterOn, head: r.accounts.bank.headroom }; });
// 10. bill skipped once
show('10 bill skipped', () => { const sc = base(); sc.events.push({ date: '2026-12-27', kind: 'skip', account: 'bank', settles: 'rent@2026-12-27' });
  const r = lookahead(sc, '2026-12-30'); return { notSeen: r.notSeenYet.items, bank: r.accounts.bank.bank }; });
// 11. e-wallet top-up scheduled from bank, ewallet opens later than the bank (B7)
show('11 top-up, ewallet opened later', () => { const sc = base();
  sc.accounts.push({ id: 'ew', name: 'E-wallet', kind: 'ewallet', currency: 'JPY', minimum: 0, opening: { date: '2026-11-25', amount: 1000 } });
  sc.bills.push({ id: 'top', kind: 'transfer', name: 'Top-up', account: 'bank', to: 'ew', amount: 5000, schedule: { frequency: 'monthly', day: 1 }, weekend_holiday: 'none' });
  sc.events.push({ date: '2026-11-24', kind: 'transfer', from: 'bank', to: 'ew', amount: 3000, note: 'extra top-up before ewallet set up' });
  const r = lookahead(sc, '2026-11-26'); return { bank: r.accounts.bank.bank, ew: r.accounts.ew.bank, total: r.total }; });
// 12. Goal in own account that is overdrawn
show('12 goal own account overdrawn', () => { const sc = base();
  sc.accounts.push({ id: 'sav', name: 'Savings', kind: 'bank', currency: 'JPY', spend_from: false, minimum: 0, opening: { date: '2026-11-20', amount: 50000 } });
  sc.goals.push({ id: 'trip', name: 'Trip', kept_in: 'sav', opening: { date: '2026-11-20', amount: 50000 } });
  sc.events.push({ date: '2026-11-22', kind: 'spend', account: 'sav', amount: 60000, note: 'emergency vet, from savings, overdraft' });
  const r = lookahead(sc, '2026-11-23'); return { sav: r.accounts.sav, stsBank: r.accounts.bank.headroom, sts: r.safeToSpend }; });
