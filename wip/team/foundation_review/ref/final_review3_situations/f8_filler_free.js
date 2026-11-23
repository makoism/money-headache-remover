// F8. The person never logs spends; they check in each weekend (A: the check-in is the product). Bank 500,000
// (savings in it) set up Thu 10 Dec, pay day; Free to spend 60,000 a month (split 60,000), no budget lines.
// Sat 19 Dec check-in: bank 450,000. Nothing was logged and no bill was due, so 50,000 went out unlogged: the
// filler, the rest of the spending in the stretch (6.2: it carries `place`, Free to spend unless the person says).
// Right on 19 Dec: Free to spend left 60,000 - 50,000 = 10,000; the headline is 10,000.
const { lookahead, H, show } = require('./base');
const sc = { currency: 'JPY', main_bank: 'b', holidays: H, goals: [], bills: [],
  accounts: [{ id: 'b', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-12-10', amount: 500000, split: { free: 60000 } } }],
  plan: { free: { per: 'month', amount: 60000 } },
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 300000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
  events: [{ id: 'c1', kind: 'check', account: 'b', amount: 450000, date: '2026-12-19', told: '2026-12-19T10:00' }] };
const r = lookahead(sc, '2026-12-19');
console.log('     filler', JSON.stringify(r.accounts.b.fillers));
show('headline on 19 Dec', r.safeToSpend.headline, 10000);
