// F3. Home currency yen. Bank (JPY) and GCash (PHP). Food 40,000 yen a month on the main bank. Set up Thu 10 Dec,
// the pay day, split Food 40,000, Free to spend 60,000. Sat 12 Dec, on a trip home, she buys groceries with
// GCash for 2,000.00 pesos and picks the Food line (the only food line she has).
// Right until stage 2 (F11: other currencies are never converted): the peso spend cannot come off a yen line as
// yen. Either it is left out of the yen line (Food left 40,000) with a warning, or it is converted (about
// 5,300 yen at 2.65). It must never take 200,000 "yen" (the peso minor units) off.
const { lookahead, H, show } = require('./base');
const sc = { currency: 'JPY', main_bank: 'b', holidays: H, goals: [], bills: [],
  accounts: [{ id: 'b', name: 'Bank', kind: 'bank', currency: 'JPY', minimum: 0, opening: { date: '2026-12-10', amount: 400000, split: { lines: { food: 40000 }, free: 60000 } } },
             { id: 'g', name: 'GCash', kind: 'ewallet', currency: 'PHP', minimum: 0, opening: { date: '2026-12-10', amount: 5000 } }],
  plan: { lines: [{ id: 'food', name: 'Food', per: 'month', amount: 40000 }], free: { per: 'month', amount: 60000 } },
  income: [{ id: 'pay', name: 'Pay', account: 'b', amount: 300000, schedule: { frequency: 'monthly', day: 10 }, weekend_holiday: 'move earlier', starts_period: true }],
  events: [{ id: 'e1', kind: 'spend', account: 'g', amount: 2000, line: 'food', date: '2026-12-12', told: '2026-12-12T12:00' }] };
const r = lookahead(sc, '2026-12-12', { });
const why = r.accounts.b.why;
console.log('     bank why:', why);
show('bank lowest (400,000 less Food 40,000 reserved, nothing in yen spent)', r.accounts.b.lowest, 360000);
// and a Free to spend spend in pesos lowers the yen cap the same way
sc.events[0].line = 'free'; sc.events[0].amount = 300;
const r2 = lookahead(sc, '2026-12-12');
show('headline after a 300.00 peso Free-to-spend spend (no yen spent)', r2.safeToSpend.headline, 60000);
