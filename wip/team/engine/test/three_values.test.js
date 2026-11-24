'use strict';
// Three values in the look ahead's answer, one meaning in every life (THREE_VALUES_PLAN; MAKO_SAYS M7, M12, M36, M51,
// Not settled 8): canSpare (what the accounts can spare, not reduced by everyday money up to lastDay), everyday (the
// everyday money for this stretch: full, counts, spent, left, lastDay, kind) and noJob (canSpare less everyday left,
// never below zero). And one headline rule: max(0, min(canSpare, everyday left)), or max(0, canSpare) with no everyday
// amount. Every figure below was worked by hand by qc-foundation on 24 Nov 2026 (made-up yen).
//
// KAI, no fixed pay: rent 85,000 on the 27th, everyday 60,000 a month, set up 1 Dec 2026.
//   2026 and 2027 have 365 days: everyday by the day is floor(60,000 x 12 / 365) = 1,972.
//   Seen 1 Dec the walk looks to 27 Jan: two rents (170,000) and January's everyday held by the walk, 27 x 1,972 =
//   53,244. canSpare = 420,000 - 170,000 - 53,244 = 196,756. Everyday left 60,000 to 31 Dec. No job 136,756.
//   Before the fix the headline took December's everyday money off twice: with 300,000 in the bank it read 17,578
//   where 60,000 is right, and with 250,000 it read 0 where 26,756 is right.
// PAY PERIOD: pay 300,000 on the 25th, rent 85,000 on the 27th, everyday 60,000, bank 182,400, set up 24 Nov 2026.
//   One day of the 31 before the first pay counts: floor(60,000 / 31) = 1,935.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), CI = require('../checkin.js'), IDS = require('../ids.js');

function make(o) {
  const newId = IDS.idMaker(o.dev || 'k3f9aq');
  const banks = [{ key: 'bank1', name: 'Main bank', amount: o.bank, main: true, min: o.min == null ? null : o.min }];
  if (o.cash) banks.push({ key: 'acct1', name: 'Cash', type: 'cash', amount: o.cash });
  const out = BB.buildBook({ day: o.day, told: o.day + 'T09:00:00.000+09:00', currency: 'JPY', country: 'JP', banks,
    pays: [o.pay ? { key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 25, shift: 'none', startsPeriod: true } : { key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }],
    cards: [], bills: [{ key: 'bill1', name: 'Rent', from: 'bank1', amount: 85000, day: 27, shift: 'none' }], free: o.free === undefined ? 60000 : o.free }, { newId });
  let book = out.book || out;
  const bank = book.accounts.find(a => a.type === 'bank').id;
  const api = {
    get book() { return book; }, bank,
    spend(day, a) { book = Object.assign({}, book, { events: book.events.concat([{ id: newId(), k: 'spend', date: day, a, acct: bank, line: 'free', told: day + 'T12:00:00.000+09:00', src: { type: 'typed' } }]) }); return api; },
    check(day, figure) {
      const r = LA.lookahead(book, day), expected = {}, lands = {};
      for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
      book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000+09:00', newId, figures: { [bank]: figure }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
      return api;
    },
    see(day) { return LA.lookahead(book, day); },
  };
  return api;
}
const three = r => [r.canSpare.amount, r.everyday ? r.everyday.left : null, r.noJob.amount, r.safeToSpend.headline];
/* in every life: canSpare = everyday left + no job when nothing is short and everyday is not over; and the one headline rule */
function ties(r) {
  const c = r.canSpare.amount, e = r.everyday;
  eq(r.safeToSpend.headline, e ? Math.max(0, Math.min(c, e.left)) : Math.max(0, c));
  eq(r.noJob.amount, Math.max(0, c - (e ? Math.max(0, e.left) : 0)));
  if (e) eq(e.counts - e.spent, e.left);
}
const kai = (bank, o) => make(Object.assign({ day: '2026-12-01', bank }, o || {}));
const paid = (o) => make(Object.assign({ day: '2026-11-24', bank: 182400, pay: true }, o || {}));

t('Kai, 1 Dec: can spare 196,756, everyday left 60,000 to 31 Dec, no job 136,756, headline 60,000', () => {
  const r = kai(420000).see('2026-12-01');
  eq(three(r), [196756, 60000, 136756, 60000]);
  eq([r.everyday.full, r.everyday.counts, r.everyday.spent, r.everyday.lastDay, r.everyday.kind], [60000, 60000, 0, '2026-12-31', 'month']);
  eq([r.canSpare.lastDay, r.canSpare.through], ['2026-12-31', r.horizon]);
  ties(r);
});
t('Kai, seen 15 Dec, nothing logged: 192,812, 60,000, 132,812', () => { const r = kai(420000).see('2026-12-15'); eq(three(r), [192812, 60000, 132812, 60000]); ties(r); });
t('Kai, 25,000 spent on 10 Dec, seen 15 Dec: 167,812, 35,000 left, 132,812, headline 35,000', () => {
  const r = kai(420000).spend('2026-12-10', 25000).see('2026-12-15');
  eq(three(r), [167812, 35000, 132812, 35000]); eq(r.everyday.spent, 25000); ties(r);
});
t('Kai, 75,000 spent, seen 21 Dec: 105,962, 15,000 over, no job 105,962, headline 0', () => {
  const r = kai(420000).spend('2026-12-10', 75000).see('2026-12-21');
  eq(three(r), [105962, -15000, 105962, 0]); ties(r);
});
t('Kai set up 20 Dec: everyday counts 23,225 of 60,000, can spare 182,934, no job 159,709', () => {
  const r = make({ day: '2026-12-20', bank: 420000 }).see('2026-12-20');
  eq([r.everyday.full, r.everyday.counts], [60000, 23225]); eq(three(r), [182934, 23225, 159709, 23225]); ties(r);
});
t('Kai with 300,000: 76,756, 60,000, 16,756, and the headline is 60,000 (it read 17,578)', () => { const r = kai(300000).see('2026-12-01'); eq(three(r), [76756, 60000, 16756, 60000]); ties(r); });
t('Kai with 250,000: 26,756, no job 0, and the headline is 26,756 (it read 0)', () => { const r = kai(250000).see('2026-12-01'); eq(three(r), [26756, 60000, 0, 26756]); ties(r); });
t('Kai with 200,000: short, can spare -23,244, no job 0, headline 0', () => { const r = kai(200000).see('2026-12-01'); eq(three(r), [-23244, 60000, 0, 0]); ties(r); });
t('an everyday amount of 0 is an amount: can spare 250,000, no job 250,000, headline 0', () => {
  const r = kai(420000, { free: 0 }).see('2026-12-01');
  eq(three(r), [250000, 0, 250000, 0]); eq([r.everyday.full, r.everyday.counts, r.everyday.spent], [0, 0, 0]); ties(r);
});
t('no everyday amount: everyday is null, no job 250,000, headline 250,000', () => {
  const r = kai(420000, { free: null }).see('2026-12-01');
  eq(r.everyday, null); eq([r.canSpare.amount, r.noJob.amount, r.safeToSpend.headline], [250000, 250000, 250000]); ties(r);
});
t('Kai, 25,000 spent, seen 31 Dec (three rents ahead): 25,606, 35,000, no job 0, headline 25,606', () => {
  const r = kai(420000).spend('2026-12-10', 25000).see('2026-12-31'); eq(three(r), [25606, 35000, 0, 25606]); ties(r);
});
t('the same, seen 1 Jan: 86,756, a new month\'s 60,000, no job 26,756, headline 60,000', () => {
  const r = kai(420000).spend('2026-12-10', 25000).see('2027-01-01'); eq(three(r), [86756, 60000, 26756, 60000]); eq(r.everyday.lastDay, '2027-01-31'); ties(r);
});

t('pay period, 24 Nov, the day before pay: 182,400, 1,935, 180,465, headline 1,935 (unchanged)', () => {
  const r = paid().see('2026-11-24');
  eq(three(r), [182400, 1935, 180465, 1935]); eq([r.everyday.full, r.everyday.counts, r.everyday.lastDay, r.everyday.kind], [60000, 1935, '2026-11-24', 'pay']); ties(r);
});
t('25 Nov, the pay not ticked: the same three, to 24 Dec', () => { const r = paid().see('2026-11-25'); eq(three(r), [182400, 1935, 180465, 1935]); eq(r.everyday.lastDay, '2026-12-24'); ties(r); });
t('26 Nov and 16 Dec, the pay never ticked: 97,400, 1,935, 95,465', () => {
  for (const d of ['2026-11-26', '2026-12-16']) { const r = paid().see(d); eq(three(r), [97400, 1935, 95465, 1935]); ties(r); }
});
t('pay ticked on 25 Nov, bank 482,400: 397,400, 60,000, 337,400', () => { const r = paid().check('2026-11-25', 482400).see('2026-11-25'); eq(three(r), [397400, 60000, 337400, 60000]); ties(r); });
t('then 22,000 spent, seen 10 Dec: 375,400, 38,000, 337,400', () => { const r = paid().check('2026-11-25', 482400).spend('2026-12-05', 22000).see('2026-12-10'); eq(three(r), [375400, 38000, 337400, 38000]); ties(r); });
t('72,000 spent, seen 15 Dec: 325,400, 12,000 over, 325,400, headline 0', () => { const r = paid().check('2026-11-25', 482400).spend('2026-12-05', 72000).see('2026-12-15'); eq(three(r), [325400, -12000, 325400, 0]); ties(r); });
t('bank 50,000 and the pay late, seen 26 Nov: can spare -35,000, no job 0, headline 0, short by 35,000', () => {
  const r = paid({ bank: 50000 }).see('2026-11-26'); eq([r.canSpare.amount, r.noJob.amount, r.safeToSpend.headline, r.safeToSpend.shortfall], [-35000, 0, 0, 35000]); ties(r);
});
t('with 20,000 cash as a second account: 202,400 and 200,465; with a 30,000 minimum: 152,400 and 150,465', () => {
  let r = paid({ cash: 20000 }).see('2026-11-24'); eq([r.canSpare.amount, r.noJob.amount], [202400, 200465]); ties(r);
  r = paid({ min: 30000 }).see('2026-11-24'); eq([r.canSpare.amount, r.noJob.amount], [152400, 150465]); ties(r);
});
t('the same in every order the records arrive in', () => {
  const k = kai(420000).spend('2026-12-10', 25000), want = three(k.see('2026-12-15'));
  for (const f of [e => e.reverse(), e => e.sort((x, y) => (x.id < y.id ? 1 : -1)), e => e.slice(2).concat(e.slice(0, 2))])
    eq(three(LA.lookahead(Object.assign({}, k.book, { events: f(k.book.events.slice()) }), '2026-12-15')), want);
});
done('three_values.test.js');
