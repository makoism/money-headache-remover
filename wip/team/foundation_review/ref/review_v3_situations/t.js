const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const base = () => ({
  currency: 'JPY', holidays: { dates: [ { date: '2026-11-23' }, { date: '2027-01-11' } ], bank_closed: [] },
  accounts: [ { id: 'bank', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-11-20', amount: 300000 } } ],
  income: [ { id: 'pay', name: 'Pay', account: 'bank', amount: 250000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true } ],
  bills: [ { id: 'rent', name: 'Rent', account: 'bank', amount: 80000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'move later' } ],
  goals: [], events: [] });
const show = (t, r, keys) => console.log('\n== ' + t + '\n' + JSON.stringify(keys(r), null, 0));
const S = (sc, d, o) => lookahead(sc, d, o);

// 1. Pay a day late after a holiday (Mon 11 Jan 2027 holiday; pay due Sun 10 Jan -> Fri 8 Jan; arrives Tue 12 Jan)
{ const sc = base(); sc.events.push({ date: '2026-11-27', kind: 'bill_paid', account: 'bank', amount: 80000, settles: 'rent@2026-11-27' },
  { date: '2026-12-10', kind: 'pay_in', account: 'bank', amount: 250000, settles: 'pay@2026-12-10' },
  { date: '2026-12-28', kind: 'bill_paid', account: 'bank', amount: 80000, settles: 'rent@2026-12-27' });
  for (const d of ['2027-01-08', '2027-01-09', '2027-01-11']) show('1 late pay asOf ' + d, S(sc, d), r => ({ bank: r.accounts.bank.bank, head: r.accounts.bank.headroom, next: r.daysToNextPay, due: r.dueBeforeNextPay.total, may: r.mayStillPost.map(x => x.item), notSeen: r.notSeenYet.items.map(x => x.item), warn: r.warnings.map(w => w.text) }));
}
// 2. Two check-ins one day, and a spend typed after the morning check
{ const sc = base(); sc.events.push({ date: '2026-11-22', kind: 'check', account: 'bank', amount: 300000 },
  { date: '2026-11-22', kind: 'spend', account: 'bank', amount: 5000, note: 'lunch after the check' });
  show('2a check then spend same day', S(sc, '2026-11-22'), r => ({ bank: r.accounts.bank.bank, fill: r.accounts.bank.fillers }));
  sc.events.push({ date: '2026-11-22', kind: 'check', account: 'bank', amount: 295000 });
  show('2b second check same day', S(sc, '2026-11-22'), r => ({ bank: r.accounts.bank.bank, fill: r.accounts.bank.fillers }));
}
// 3. Spend on setup day after setup
{ const sc = base(); sc.events.push({ date: '2026-11-20', kind: 'spend', account: 'bank', amount: 7000, note: 'dinner after setup' });
  show('3 spend on setup day', S(sc, '2026-11-20'), r => ({ bank: r.accounts.bank.bank }));
}
// 4. Debit spend 20th, posts 23rd; check on 21st shows bank "current" (not yet posted)
{ const sc = base(); sc.events.push({ date: '2026-11-21', kind: 'spend', account: 'bank', amount: 10000, posted: '2026-11-24' },
  { date: '2026-11-22', kind: 'check', account: 'bank', amount: 300000, note: 'bank app does not show it yet' });
  show('4 debit not posted at check; asOf 25th after it posted', S(sc, '2026-11-25'), r => ({ bank: r.accounts.bank.bank, fill: r.accounts.bank.fillers.map(f => f.amount) }));
}
