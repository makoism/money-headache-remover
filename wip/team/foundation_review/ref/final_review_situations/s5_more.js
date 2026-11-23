const { lookahead, sc, bank } = require('./base');
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const U = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/units_ref.js');
// S5 ids: session part 3 letters per page open, counter from 1. Expected colliding session pairs on one device.
for (const [opens, alpha] of [[365*3, 26], [365*5, 26], [365*5, 36]]) {
  const N = alpha ** 3, pairs = opens * (opens - 1) / 2;
  console.log(`S5 ${opens} page opens a year, ${alpha} letters: expected colliding sessions ${(pairs / N).toFixed(1)}; chance of at least one ${(100 * (1 - Math.exp(-pairs / N))).toFixed(1)}%`);
}
// a collision: Monday's lunch k7qzpa-m2x-1 and Thursday's rent k7qzpa-m2x-1. Merge keeps one.
const m = M.merge({ events: [{ id: 'k7qzpa-m2x-1', k: 'spend', a: 1200, date: '2027-01-04', at: '2027-01-04T12:00:00.000+09:00', by: 'k7qzpa' }] },
                  { events: [{ id: 'k7qzpa-m2x-1', k: 'spend', a: 80000, date: '2027-01-07', at: '2027-01-07T09:00:00.000+09:00', by: 'k7qzpa' }] });
console.log('S5 after merge:', m.events.length, 'event(s):', JSON.stringify(m.events.map(e => e.a)), '(right: both, 1,200 and 80,000)');

// S7 goal deleted with money in it, no Free to spend set (cap null)
const g = { id: 'trip', name: 'Trip', kept_in: 'b', opening: { date: '2027-01-04', amount: 100000 } };
const base = () => sc({ accounts: [bank('b', '2027-01-04', 150000)], goals: [g] });
let r1 = lookahead(base(), '2027-01-05'); const s7 = base(); s7.goals = [];
let r2 = lookahead(s7, '2027-01-05');
console.log('S7 goal kept 100,000: headline', r1.safeToSpend.headline, '-> goal removed:', r2.safeToSpend.headline, '(the 100,000 is not spending money until the person says where it goes)');

// S9 pay every two weeks Jan to June, then monthly from July: does the year add up?
const biw = { every: 'weeks', n: 2, from: '2027-01-01' };
const n = U.paysInYear(biw, 2027); const per = Math.floor(50000 * 12 / n);
let h1 = 0; for (let d = 0; d < 181; d += 14) h1++;   // pays 1 Jan .. 30 Jun
console.log(`S9 food 50,000 a month: ${h1} two-weekly pays Jan to Jun at ${per} = ${h1 * per}, then 6 monthly x 50,000 = 300000; year ${h1 * per + 300000} (right 600,000). paysInYear takes one rule only.`);

// S12 rent paid twice by mistake, refund later
const s12 = sc({ accounts: [bank('b', '2027-01-04', 300000)],
  bills: [{ id: 'rent', name: 'Rent', account: 'b', amount: 80000, schedule: { frequency: 'monthly', day: 27 }, weekend_holiday: 'move later' }],
  events: [ { id: 'r1', date: '2027-01-27', kind: 'bill_paid', account: 'b', amount: 80000, settles: 'rent@2027-01-27' },
            { id: 'r2', date: '2027-01-27', kind: 'bill_paid', account: 'b', amount: 80000, settles: 'rent@2027-01-27' },
            { id: 'r3', date: '2027-02-03', kind: 'refund', account: 'b', amount: 80000 } ] });
let r = lookahead(s12, '2027-01-28');
console.log('S12 rent twice: bank', r.accounts.b.bank, '(140,000 right); due', JSON.stringify(r.dueBeforeNextPay.items.map(i=>i.item)));
r = lookahead(s12, '2027-02-04'); console.log('S12 after refund: bank', r.accounts.b.bank, '(220,000 right)');

// S13 pay split: 200,000 to the bank, 50,000 to the e-wallet, one pay
const s13 = sc({ currency: 'PHP', accounts: [Object.assign(bank('b', '2027-01-04', 1000), { currency: 'PHP' }), { id: 'w', name: 'GCash', kind: 'ewallet', currency: 'PHP', minimum: 0, opening: { date: '2027-01-04', amount: 100 } }],
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 20000, schedule: { frequency: 'monthly', day: 15 }, weekend_holiday: 'move earlier', starts_period: true },
           { id: 'payw', name: 'Pay to GCash', account: 'w', amount: 5000, schedule: { frequency: 'monthly', day: 15 }, weekend_holiday: 'move earlier' }],
  bills: [{ id: 'load', name: 'Phone load', account: 'w', amount: 5100, schedule: { frequency: 'monthly', day: 16 }, weekend_holiday: 'none' }] });
r = lookahead(s13, '2027-01-10');
console.log('S13 pay split: next pay', JSON.stringify(r.daysToNextPay), 'GCash lowest', r.accounts.w.lowest, 'on', r.accounts.w.lowestDay, '(right: 0 on 16 Jan: 100 + 5,000 - 5,100)');
