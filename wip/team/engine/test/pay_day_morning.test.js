'use strict';
// Pay-day morning (found by qc-numbers on 25 Nov 2026 in the owner's own shape; MAKO_SAYS M31, M38, M51, M36): on the
// day a pay is due, before it is ticked as in the bank, the engine's answer held two periods at once. The everyday
// figure and the period shown were the old period's (10 Nov to today), while the day the figure "runs to"
// (everyday.lastDay, canSpare.lastDay, safeToSpend.until) and the list of what is due before the next pay ran to the pay
// AFTER today's. Home then said "safe to spend until the pay after today's" over what was left of the old period, and
// listed the coming period's bills under "due before next pay" beside "next pay: today".
// The check here does not pick which period pay-day morning belongs to (that is the coordinator's ruling): it says that
// every part of one answer reads the SAME period, on the evening before, on pay-day morning, and after the pay lands.
// Mako's shape, made-up yen: bank 400,000, keep 10,000; pay 250,000 on the 10th; everyday 50,000 a pay; Card A 60,000
// paid on the 10th, Card B 30,000 on the 11th, close days not sure; rent 70,000 on the 27th. Set up 1 Dec 2026.
// 3 Dec: 5,000 on Card A. 5 Dec: 2,000 refunded to Card A. So the old period's everyday money left is 15,000 (the part
// that counts from setup) - 5,000 + 2,000 = 12,000.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js'), CI = require('../checkin.js'), D = require('../dates.js');
function life() {
  const newId = IDS.idMaker('q8w3hz');
  let { book } = BB.buildBook({ day: '2026-12-01', told: '2026-12-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank', name: 'Main bank', amount: 400000, main: true, min: 10000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'bank', amount: 250000, every: 'month', day: 10, shift: 'after', startsPeriod: true }],
    cards: [{ key: 'ca', name: 'Card A', owed: 60000, payDay: 10, closeDay: 'not sure', payFrom: 'bank', shift: 'after' }, { key: 'cb', name: 'Card B', owed: 30000, payDay: 11, closeDay: 'not sure', payFrom: 'bank', shift: 'before' }],
    bills: [{ key: 'rent', name: 'Rent', from: 'bank', amount: 70000, day: 27, shift: 'after' }], free: 50000 }, { newId });
  const ca = book.accounts.find(a => a.name === 'Card A').id, bank = book.accounts.find(a => a.type === 'bank').id;
  const st = (r, at) => Object.assign(r, { told: at, at, by: 'q8w3hz' });
  book.events.push(st({ id: newId(), k: 'spend', date: '2026-12-03', a: 5000, acct: ca, line: 'free', src: { type: 'typed' } }, '2026-12-03T12:10:00.000+09:00'));
  book.events.push(st({ id: newId(), k: 'in', sub: 'refund', date: '2026-12-05', a: 2000, acct: ca, line: 'free', src: { type: 'typed' } }, '2026-12-05T18:40:00.000+09:00'));
  const landed = () => {   // 10 Dec evening: the pay and Card A's payment are ticked, the bank shows 400,000 + 250,000 - 63,000
    const r = LA.lookahead(book, '2026-12-10'), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    return CI.apply(book, CI.checkIn(book, { day: '2026-12-10', told: '2026-12-10T20:00:00.000+09:00', newId, figures: { [bank]: 587000 }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  return { book, landed };
}
const next = d => D.dayStr(D.dayNum(d) + 1);
/* one answer, one period: the day the everyday figure runs to is the shown period's last day; safe to spend runs to
   the day after it; and nothing listed as due before the next pay lands after it */
function onePeriod(r, when) {
  const end = r.period.end;
  eq([when, r.everyday.lastDay, r.canSpare.lastDay], [when, end, end]);
  eq([when, r.safeToSpend.until, r.dueBeforeNextPay.until], [when, next(end), next(end)]);
  const lateItems = r.dueBeforeNextPay.items.filter(o => o.lands > end).map(o => o.lands);
  eq([when, lateItems], [when, []]);
}
t('the evening before pay day (9 Dec): the old period, 12,000 left, all of the answer reads 10 Nov to 9 Dec', () => {
  const r = LA.lookahead(life().book, '2026-12-09');
  eq([r.period.start, r.period.end, r.everyday.left, r.safeToSpend.headline], ['2026-11-10', '2026-12-09', 12000, 12000]);
  onePeriod(r, '9 Dec');
});
t('pay-day morning (10 Dec, the pay not ticked yet): every part of the answer reads one period', () => {
  const r = LA.lookahead(life().book, '2026-12-10');
  onePeriod(r, '10 Dec morning');
  ok(r.safeToSpend.headline === r.everyday.left || r.safeToSpend.headline === r.canSpare.amount, 'the headline is the smaller of the two it is made from');
});
t('after the pay lands (10 Dec, ticked): the new period, 50,000, all of the answer reads 10 Dec to 11 Jan', () => {
  const x = life(), r = LA.lookahead(x.landed(), '2026-12-10');
  eq([r.period.start, r.period.end, r.everyday.left, r.safeToSpend.headline], ['2026-12-10', '2027-01-11', 50000, 50000]);
  onePeriod(r, '10 Dec after');
});
done('pay_day_morning.test.js');
