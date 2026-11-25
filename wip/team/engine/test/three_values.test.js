'use strict';
// Three values in the look ahead's answer, one meaning in every life (THREE_VALUES_PLAN; MAKO_SAYS M7, M12, M36, M51,
// Not settled 8): canSpare (what the accounts can spare, not reduced by everyday money up to lastDay), everyday (the
// everyday money for this stretch: full, counts, spent, left, lastDay, kind) and noJob (canSpare less everyday left,
// never below zero). And one headline rule: max(0, min(canSpare, everyday left)), or max(0, canSpare) with no everyday
// amount. Every figure below was worked by hand by qc-foundation on 24 Nov 2026 (made-up yen).
//
// KAI, no fixed pay: rent 85,000 on the 27th, everyday 60,000 a month, set up 1 Dec 2026.
//   The month rule (CA4, 25 Nov 2026; MONTHRULE_PLAN): a later month's everyday money comes off by the day at
//   floor(amount / the month's days), its last day carrying the rest. January (31 days): floor(60,000 / 31) = 1,935 a
//   day, the 31st 60,000 - 30 x 1,935 = 1,950. February 2027 (28 days): floor(60,000 / 28) = 2,142 a day.
//   (Before CA4 the rate was floor(60,000 x 12 / 365) = 1,972 every day; each figure below was reworked by hand.)
//   Seen 1 Dec the walk looks to 27 Jan: two rents (170,000) and January's everyday held by the walk, 27 x 1,935 =
//   52,245. canSpare = 420,000 - 170,000 - 52,245 = 197,755. Everyday left 60,000 to 31 Dec. No job 137,755.
//   Seen 15 Dec the walk looks to 29 Jan: 29 x 1,935 = 56,115. canSpare = 420,000 - 170,000 - 56,115 = 193,885.
//   Seen 21 Dec (75,000 spent) it looks to 4 Feb: all of January, 60,000, and 4 x 2,142 = 8,568, so 68,568 held.
//     canSpare = 420,000 - 75,000 - 170,000 - 68,568 = 106,432.
//   Set up 20 Dec it looks to 3 Feb: 60,000 + 3 x 2,142 = 66,426. canSpare = 420,000 - 170,000 - 66,426 = 183,574;
//     December counts floor(60,000 x 12 / 31) = 23,225 (12 days of 31, I4, unchanged), so no job is 160,349.
//   Seen 31 Dec (25,000 spent) it looks to 27 Feb, three rents (255,000): 60,000 + 27 x 2,142 = 57,834, so 117,834
//     held. canSpare = 420,000 - 25,000 - 255,000 - 117,834 = 22,166. Seen 1 Jan January's money caps instead and only
//     February's 57,834 is held: 395,000 - 255,000 - 57,834 = 82,166, no job 82,166 - 60,000 = 22,166.
//   Before the three-values fix the headline took December's everyday money off twice: with 300,000 in the bank it
//   read 17,578 where 60,000 is right, and with 250,000 it read 0.
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

t('Kai, 1 Dec: can spare 197,755, everyday left 60,000 to 31 Dec, no job 137,755, headline 60,000', () => {
  const r = kai(420000).see('2026-12-01');
  eq(three(r), [197755, 60000, 137755, 60000]);
  eq([r.everyday.full, r.everyday.counts, r.everyday.spent, r.everyday.lastDay, r.everyday.kind], [60000, 60000, 0, '2026-12-31', 'month']);
  eq([r.canSpare.lastDay, r.canSpare.through], ['2026-12-31', r.horizon]);
  ties(r);
});
t('Kai, seen 15 Dec, nothing logged: 193,885, 60,000, 133,885', () => { const r = kai(420000).see('2026-12-15'); eq(three(r), [193885, 60000, 133885, 60000]); ties(r); });
t('Kai, 25,000 spent on 10 Dec, seen 15 Dec: 168,885, 35,000 left, 133,885, headline 35,000', () => {
  const r = kai(420000).spend('2026-12-10', 25000).see('2026-12-15');
  eq(three(r), [168885, 35000, 133885, 35000]); eq(r.everyday.spent, 25000); ties(r);
});
t('Kai, 75,000 spent, seen 21 Dec: 106,432, 15,000 over, no job 106,432, headline 0', () => {
  const r = kai(420000).spend('2026-12-10', 75000).see('2026-12-21');
  eq(three(r), [106432, -15000, 106432, 0]); ties(r);
});
t('Kai set up 20 Dec: everyday counts 23,225 of 60,000, can spare 183,574, no job 160,349', () => {
  const r = make({ day: '2026-12-20', bank: 420000 }).see('2026-12-20');
  eq([r.everyday.full, r.everyday.counts], [60000, 23225]); eq(three(r), [183574, 23225, 160349, 23225]); ties(r);
});
t('Kai with 300,000: 77,755, 60,000, 17,755, and the headline is 60,000 (it read 17,578)', () => { const r = kai(300000).see('2026-12-01'); eq(three(r), [77755, 60000, 17755, 60000]); ties(r); });
t('Kai with 250,000: 27,755, no job 0, and the headline is 27,755 (it read 0)', () => { const r = kai(250000).see('2026-12-01'); eq(three(r), [27755, 60000, 0, 27755]); ties(r); });
t('Kai with 200,000: short, can spare -22,245, no job 0, headline 0', () => { const r = kai(200000).see('2026-12-01'); eq(three(r), [-22245, 60000, 0, 0]); ties(r); });
t('an everyday amount of 0 is an amount: can spare 250,000, no job 250,000, headline 0', () => {
  const r = kai(420000, { free: 0 }).see('2026-12-01');
  eq(three(r), [250000, 0, 250000, 0]); eq([r.everyday.full, r.everyday.counts, r.everyday.spent], [0, 0, 0]); ties(r);
});
t('no everyday amount: everyday is null, no job 250,000, headline 250,000', () => {
  const r = kai(420000, { free: null }).see('2026-12-01');
  eq(r.everyday, null); eq([r.canSpare.amount, r.noJob.amount, r.safeToSpend.headline], [250000, 250000, 250000]); ties(r);
});
t('Kai, 25,000 spent, seen 31 Dec (three rents ahead): 22,166, 35,000, no job 0, headline 22,166', () => {
  const r = kai(420000).spend('2026-12-10', 25000).see('2026-12-31'); eq(three(r), [22166, 35000, 0, 22166]); ties(r);
});
t('the same, seen 1 Jan: 82,166, a new month\'s 60,000, no job 22,166, headline 60,000', () => {
  const r = kai(420000).spend('2026-12-10', 25000).see('2027-01-01'); eq(three(r), [82166, 60000, 22166, 60000]); eq(r.everyday.lastDay, '2027-01-31'); ties(r);
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
