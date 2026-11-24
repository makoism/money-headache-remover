'use strict';
// Past periods built from what happened (engine/periods.js; WIRING_PLAN Q4, slice 2). Every amount made up.
const { t, done, eq, ok } = require('./t.js');
const { lookahead } = require('../lookahead.js');
const { periods } = require('../periods.js');
const { buildBook } = require('../build_book.js');
const { ANSWERS } = require('./mako_madeup.js');

const TZ = '+09:00';
// A bank opened Tue 1 Dec 2026 with 400,000 (Free to spend 50,000 and Food 30,000 typed), pay 250,000 on the 25th
// starting periods, a Rent bill on the 27th.
function base(more) {
  const b = { v: 3, home: { curs: [{ from: '2026-01-01', cur: 'JPY' }], country: { v: 'JP' }, main: { v: { acct: 'bank', min: null } } },
    accounts: [{ id: 'bank', name: 'Bank', type: 'bank', cur: 'JPY' }],
    schedules: [{ id: 'pay', kind: 'income', name: 'Pay', acct: 'bank', cur: 'JPY', startsPeriod: true, shift: 'before', rules: [{ rule: { every: 'month', days: [25] } }], steps: [{ amount: 250000 }] },
      { id: 'rent', kind: 'bill', name: 'Rent', acct: 'bank', cur: 'JPY', shift: 'after', rules: [{ rule: { every: 'month', days: [27] } }], steps: [{ amount: 70000 }] }],
    plan: { shares: [{ id: 'sh', cur: 'JPY', per: { free: 'month' }, free: 50000 }], budgets: [{ id: 'food', name: 'Food', cur: 'JPY', per: 'month', steps: [{ amount: 30000 }] }] },
    events: [
      { id: 'o', k: 'open', acct: 'bank', date: '2026-12-01', a: 400000, told: '2026-12-01T10:00' + TZ, grp: 's', split: { free: 50000, lines: { food: 30000 } } },
      { id: 'c', k: 'check', acct: 'bank', date: '2026-12-01', a: 400000, told: '2026-12-01T10:00' + TZ, grp: 's' },
      { id: 'f1', k: 'spend', acct: 'bank', date: '2026-12-05', a: 5000, line: 'food', told: '2026-12-05T12:00' + TZ },
      // logged late: dated in the first period, told after the pay
      { id: 'f2', k: 'spend', acct: 'bank', date: '2026-12-20', a: 8000, line: 'food', told: '2026-12-27T09:00' + TZ },
      { id: 'set:pay@2026-12-25', k: 'in', sub: 'pay', acct: 'bank', date: '2026-12-25', a: 250000, stream: 'pay', settles: [{ s: 'pay', due: '2026-12-25' }], told: '2026-12-26T19:00' + TZ, grp: 'ci' },
      { id: 'x1', k: 'spend', acct: 'bank', date: '2026-12-26', a: 3000, told: '2026-12-26T12:00' + TZ },
      // the check-in on 26 Dec: the app had 634,000, the bank shows 630,000: a filler of 4,000 over 2 to 26 Dec
      { id: 'c3', k: 'check', acct: 'bank', date: '2026-12-26', a: 630000, told: '2026-12-26T20:00' + TZ, grp: 'ci' },
      { id: 'set:rent@2026-12-27', k: 'spend', acct: 'bank', date: '2026-12-28', a: 70000, settles: [{ s: 'rent', due: '2026-12-27' }], told: '2026-12-28T09:00' + TZ },
    ],
    checkins: [{ id: 'ci', date: '2026-12-26', from: '2026-12-02', told: '2026-12-26T20:00' + TZ, figures: [{ acct: 'bank', check: 'c3', typedA: 630000 }], settled: ['set:pay@2026-12-25'] }] };
  return more ? more(b) || b : b;
}
const opt = { deviceOffset: TZ };

t('a period gone by: its dates, named by its pay [T1]', () => {
  const r = periods(base(), '2027-01-05', opt);
  eq(r.past.length, 1);
  eq([r.past[0].start, r.past[0].end, r.past[0].startsWith], ['2026-11-25', '2026-12-24', 'pay@2026-11-25']);
  eq([r.current.start, r.current.startsWith], ['2026-12-25', 'pay@2026-12-25']);
});
t('a line in a period gone by counts what is dated inside it, a spend logged late too', () => {
  const food = periods(base(), '2027-01-05', opt).past[0].lines.find(l => l.id === 'food');
  // the opening share typed 30,000; 5,000 + 8,000 spent
  eq([food.start, food.spent, food.left], [30000, 13000, 17000]);
});
t('the check-in gap is spending, split by days at the pay [T2, A4]', () => {
  const r = periods(base(), '2027-01-05', opt);
  // 4,000 over 25 days: 23 days (2 to 24 Dec) to the first period, 3,680; the rest, 320, to the second
  eq(r.past[0].free.spent, 3680);
  eq(r.past[0].free.left, 46320);
  eq(r.current.free.spent, 3320);
});
t('the period running now agrees with the look ahead (one engine)', () => {
  const b = base(), r = periods(b, '2027-01-05', opt), la = lookahead(b, '2027-01-05', opt).period;
  eq(r.current.free.left, la.free.left);
  eq(r.current.lines.map(l => [l.id, l.amount, l.left]), la.lines.map(l => [l.id, l.amount, l.left]));
  eq([r.current.start, r.current.end], [la.start, la.end]);
});
t('what happened in each period: money in, bills paid, totals', () => {
  const r = periods(base(), '2027-01-05', opt);
  eq(r.past[0].moneyIn.total, 0);
  eq(r.current.moneyIn.items.map(x => [x.date, x.amount, x.schedule]), [['2026-12-25', 250000, 'pay']]);
  eq(r.current.billsPaid.items.map(x => [x.date, x.amount, x.schedule]), [['2026-12-28', 70000, 'rent']]);
  eq(r.current.billsPaid.total, 70000);
});
t('newest first, and `from` leaves out periods that ended before it', () => {
  const b = base(x => {
    x.events.push({ id: 'set:pay@2027-01-25', k: 'in', sub: 'pay', acct: 'bank', date: '2027-01-25', a: 250000, stream: 'pay', settles: [{ s: 'pay', due: '2027-01-25' }], told: '2027-01-25T19:00' + TZ });
  });
  const r = periods(b, '2027-02-01', opt);
  eq(r.past.map(p => p.start), ['2026-12-25', '2026-11-25']);
  eq(periods(b, '2027-02-01', Object.assign({ from: '2026-12-25' }, opt)).past.map(p => p.start), ['2026-12-25']);
});
t('a period gone by gets its own amount: a once key for its pay [B8]', () => {
  const b = base(x => { x.plan.budgets[0].once = { 'pay@2026-12-25': { amount: 45000, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } };
    x.events.push({ id: 'set:pay@2027-01-25', k: 'in', sub: 'pay', acct: 'bank', date: '2027-01-25', a: 250000, stream: 'pay', settles: [{ s: 'pay', due: '2027-01-25' }], told: '2027-01-25T19:00' + TZ }); });
  const r = periods(b, '2027-02-01', opt);
  eq(r.past[0].lines.find(l => l.id === 'food').amount, 45000);
  eq(r.current.lines.find(l => l.id === 'food').amount, 30000);
});
t('no fixed pay: no periods [B4]', () => {
  const b = base(x => { x.schedules[0].rules = [{ rule: { every: 'none' } }]; });
  const r = periods(b, '2027-01-05', opt);
  eq([r.current, r.past], [null, []]);
});
t('Mako\'s made-up shape before any pay is ticked: only the period running now', () => {
  let n = 0;
  const { book } = buildBook(ANSWERS, { newId: () => 'k7m2qa-f3n8p1x6wd-' + (++n) });
  const r = periods(book, '2026-11-23');
  eq(r.past, []);
  eq([r.current.start, r.current.end], ['2026-11-10', '2026-12-09']);
  ok(r.current.moneyIn.total === 0);
});
const { scheduleView } = require('../periods.js');
t('each schedule on a day: its amount, rule, next occurrence (moved off the weekend)', () => {
  const v = scheduleView(base(), '2027-01-05');
  eq([v.rent.kind, v.rent.amount, v.rent.rule], ['bill', 70000, { every: 'month', days: [27] }]);
  eq(v.rent.next, { due: '2027-01-27', land: '2027-01-27', amount: 70000 });
  // 25 Jan 2027 is a Monday: no move; 25 Dec 2027 is a Saturday, moved before
  eq(scheduleView(base(), '2027-12-01').pay.next, { due: '2027-12-25', land: '2027-12-24', amount: 250000 });
});
t('a change may start only after the latest occurrence a record names [X8]', () => {
  const v = scheduleView(base(), '2026-12-27');
  // the 27 Dec rent was paid (settled) on 28 Dec: a change from 27 Dec would no longer make it
  eq([v.rent.lastNamed, v.rent.changeFrom], ['2026-12-27', '2026-12-28']);
  eq([v.pay.lastNamed, v.pay.changeFrom], ['2026-12-25', '2026-12-27']);
  const b = base(x => { x.schedules[1].amounts = { '2027-01-27': { amount: 71000, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } }; });
  eq(scheduleView(b, '2027-01-05').rent.changeFrom, '2027-01-28');
});
t('the next occurrence is the first one no record dated by the day has settled', () => {
  // the 27 Dec rent was paid on 28 Dec: from 28 Dec the next one to come is 27 Jan; on 27 Dec it is still that one
  eq(scheduleView(base(), '2026-12-28').rent.next.due, '2027-01-27');
  eq(scheduleView(base(), '2026-12-27').rent.next.due, '2026-12-27');
});
t('an ended bill has no next occurrence after its end', () => {
  const b = base(x => { x.schedules[1].ends = '2027-01-31'; });
  eq(scheduleView(b, '2027-02-01').rent.next, null);
});
t('what happened is what the app had heard of by the day asked: dated in the period, told by then', () => {
  // a bill paid dated 24 Dec but told on 30 Dec belongs to the first period by its date [section 9: a change regroups,
  // it moves nothing], and is listed only once the app has heard of it, as the look ahead counts it
  const b = base(x => { x.events.push({ id: 'late', k: 'spend', acct: 'bank', date: '2026-12-24', a: 1200, settles: [{ s: 'rent', due: '2026-11-27' }], told: '2026-12-30T09:00' + TZ }); });
  const ids = (r, i) => r.past[i].billsPaid.items.map(x => x.id);
  eq(ids(periods(b, '2026-12-28', opt), 0), []);
  eq(ids(periods(b, '2026-12-30', opt), 0), ['late']);
});
t('Free to spend set for the first time on 15 Jan: no period before it has a Free to spend amount [BJ2, V]', () => {
  const b = base(x => { x.plan.shares = [{ id: 'sh', from: '2027-01-15', cur: 'JPY', per: { free: 'month' }, free: 50000 }]; delete x.events[0].split.free; });
  const r = periods(b, '2027-01-20', opt);
  eq(r.past.map(p => p.free), [null]);
  eq(r.current.free.amount, 50000);   // set first in the period running since 25 Dec: that period has it
});
t('scheduleView lists an outstanding occurrence (late, not seen or unticked) before the next one [BJ5]', () => {
  const { scheduleView } = require('../periods.js');
  const b = base(x => { x.schedules.push({ id: 'phone', kind: 'bill', name: 'Phone', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [2] } }], steps: [{ amount: 4800 }] }); });
  const v = scheduleView(b, '2026-12-20').phone;
  eq(v.outstanding, [{ due: '2026-12-02', land: '2026-12-02', amount: 4800, state: 'notSeen' }]);
  eq(v.next.due, '2027-01-02');
  const v2 = scheduleView(b, '2026-12-03').phone;   // inside its posting window: late
  eq(v2.outstanding.map(o => o.state), ['late']);
  eq(scheduleView(b, '2026-12-20').rent.outstanding, []);
});
// [S5, X3, QC numbers] One rule on Plan and Home: setup's figure is read at the end of the setup day, so a bill due that
// day is inside it (gone out) unless setup was told it has not gone out yet. Phone 4,800 due 1 Dec, the setup day.
t('a bill due on the setup day is inside the setup figure on Plan as on Home: the next one is a month on [S5]', () => {
  const { scheduleView } = require('../periods.js');
  const b = base(x => { x.schedules.push({ id: 'phone', kind: 'bill', name: 'Phone', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [1] } }], steps: [{ amount: 4800 }] }); });
  const r = lookahead(b, '2026-12-01', opt);
  ok(!r.dueBeforeNextPay.items.some(o => o.item === 'phone@2026-12-01'), 'Home does not take it off');
  const v = scheduleView(b, '2026-12-01', opt).phone;
  eq([v.outstanding, v.next.due], [[], '2027-01-01']);
});
t('a bill due on the setup day that setup was told has not gone out yet: Plan and Home both still count it [S5, X3]', () => {
  const { scheduleView } = require('../periods.js');
  const b = base(x => {
    x.schedules.push({ id: 'phone', kind: 'bill', name: 'Phone', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [1] } }], steps: [{ amount: 4800 }] });
    x.events[1].notYet = ['phone@2026-12-01'];   // on the opening check, as build_book writes it
  });
  const r = lookahead(b, '2026-12-01', opt);
  ok(r.dueBeforeNextPay.items.some(o => o.item === 'phone@2026-12-01'), JSON.stringify(r.dueBeforeNextPay.items));
  const v = scheduleView(b, '2026-12-01', opt).phone;   // listed as outstanding (on the check-in list), before the next one [BJ5]
  eq([v.outstanding.map(o => o.due), v.next.due], [['2026-12-01'], '2027-01-01']);
});
// [slice 6] setting money aside ahead for a cost that comes once a year (or every few months, or once). Sam (made-up
// dollars, weekends only) is set up Mon 7 Dec 2026, paid $1,600 every 2 weeks from Fri 4 Dec: the pays before car
// insurance's $480 on Mon 1 Mar 2027 are 18 Dec, 1 Jan, 15 Jan, 29 Jan, 12 Feb and 26 Feb: 6 pays of $80. Water $62
// every 2 months from 15 Dec lands Tue 15 Dec, before the next pay, so it is not listed (it is due before next pay).
t('aheadFor: a yearly cost spread over the pays before it; monthly bills and one due before the next pay are not listed', () => {
  const { aheadFor } = require('../periods.js'), I = require('../ids.js');
  const sam = more => buildBook(Object.assign({ day: '2026-12-07', told: '2026-12-07T09:00:00-05:00', country: 'XX', currency: 'USD',
    banks: [{ key: 'chk', name: 'Checking', amount: 185000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 160000, every: 'weeks', n: 2, start: '2026-12-04', startsPeriod: true }],
    bills: [{ key: 'rent', name: 'Rent', from: 'chk', amount: 90000, day: 1, shift: 'after' },
      { key: 'car', name: 'Car insurance', from: 'chk', amount: 48000, every: 'year', date: '03-01', shift: 'after' },
      { key: 'water', name: 'Water', from: 'chk', amount: 6200, every: 'months', n: 2, start: '2026-12-15', shift: 'after' }] }, more || {}), { newId: I.idMaker('ahd4k1') });
  const b = sam();
  eq(aheadFor(b.book, '2026-12-07'), [{ schedule: b.ids.car, name: 'Car insurance', amount: 48000, due: '2027-03-01', pays: 6, perPay: 8000 }]);
  // on 20 Dec the 18 Dec pay is past: 5 pays left, $96 each; water's next (15 Feb) now has pays before it: 4 ($15.50)
  const r = aheadFor(b.book, '2026-12-20');
  eq(r.map(x => [x.name, x.due, x.pays, x.perPay]), [['Water', '2027-02-15', 4, 1550], ['Car insurance', '2027-03-01', 5, 9600]]);
  // no fixed pay: no pays to spread over (null), the cost and its day still listed
  const k = sam({ pays: [{ key: 'pay', name: 'Client work', bank: 'chk', every: 'none' }] });
  eq(aheadFor(k.book, '2026-12-07').map(x => [x.name, x.pays, x.perPay]), [['Water', null, null], ['Car insurance', null, null]]);
});
t('lastLanding: the last pay landing on or before a day, by the rules as saved', () => {
  const { lastLanding } = require('../periods.js'), I = require('../ids.js');
  const b = buildBook({ day: '2026-12-07', told: '2026-12-07T09:00:00-05:00', country: 'XX', currency: 'USD', banks: [{ key: 'chk', name: 'Checking', amount: 185000 }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 160000, every: 'weeks', n: 2, start: '2026-12-04', startsPeriod: true }] }, { newId: I.idMaker('lst2k9') });
  eq([lastLanding(b.book, b.ids.pay, '2027-02-01'), lastLanding(b.book, b.ids.pay, '2027-01-29'), lastLanding(b.book, 'nope', '2027-01-29')], ['2027-01-29', '2027-01-29', null]);
});
// [slice 6, qc-foundation 2] an amount each pay carried across a change of how often pay lands, by pays a year: every
// 2 weeks is 26 a year, every week 52, every 4 weeks 13, a day a month 12, two days a month 24. Rounded half up to the
// minor unit. $400 every 2 weeks = $400 x 26 / 12 = $866.666 -> $866.67 a month; $866.67 monthly back = $400.00.
t('perPayAcross: an amount each pay under one rhythm, the same money a year under another', () => {
  const { perPayAcross } = require('../periods.js');
  const w2 = { every: 'weeks', n: 2, from: '2026-12-04' }, m = { every: 'month', days: [25] };
  eq(perPayAcross(40000, w2, m), 86667);
  eq(perPayAcross(86667, m, w2), 40000);
  eq(perPayAcross(10000, { every: 'weeks', n: 1, from: '2026-12-04' }, { every: 'weeks', n: 4, from: '2026-12-04' }), 40000);
  eq(perPayAcross(30000, { every: 'month', days: [15, 'last'] }, m), 60000);
  eq(perPayAcross(40000, w2, w2), 40000);
  eq(perPayAcross(40000, w2, { every: 'none' }), null);
});

// [slice 6b] the pay that starts periods changed to no fixed pay, and back. Made-up yen, Japan. Set up Tue 1 Dec 2026:
// Bank 500,000, Pay 150,000 on the 15th and the last day (the working day before), Rent 80,000 on the 27th (the working
// day after), Free to spend 50,000 each pay. The period holding setup: 30 Nov to 14 Dec. A spend of 3,000 on 5 Dec.
// On Thu 10 Dec the pay changes to no fixed pay from 10 Dec, and Free to spend to 100,000 a month (50,000 x 24 / 12).
// A spend of 4,000 on 12 Dec. On 12 Dec: no period; Free to spend counts from the change day [BQ3]: its share of
// December by days left, 100,000 x 22 / 31 = 70,967 (10 to 31 Dec, rounded down), less 4,000 = 66,967 (not the setup
// amount less every spend since setup). The walk, no money in: Bank 493,000; rent 28 Dec (27 Dec is a
// Sunday) and 27 Jan 160,000; Free to spend by the day 13 Dec to 27 Jan (the horizon, rent's second): 100,000 x 12 / 365
// = 3,287 a day, December's share 100,000 x 12 x 31 / 365 = 101,917, so 20 more on 31 Dec: 19 x 3,287 + 20 = 62,473,
// January 27 x 3,287 = 88,749; together 151,222. 493,000 - 160,000 - 151,222 = 181,778; capped at 66,967.
// [BQ3] On 5 Jan it starts again: 100,000 for January less a 6,000 spend on 3 Jan = 94,000 (without the restart it
// would be 70,967 - 4,000 - 6,000 = 60,967). The bank can spare less: 487,000 - rent 28 Dec (not ticked, still
// expected) 80,000 - rent 27 Jan and 1 Mar 160,000 - Free to spend by the day 6 Jan to 1 Mar (horizon, rent's second)
// 26 x 3,287 + 20 + 92,054 + 3,287 = 180,823 = 66,177, under 94,000: not capped.
function sixB(pays) {
  const I = require('../ids.js');
  return buildBook({ day: '2026-12-01', told: '2026-12-01T09:00' + TZ, country: 'JP', currency: 'JPY', banks: [{ key: 'bank', name: 'Bank', amount: 500000 }],
    pays, bills: [{ key: 'rent', name: 'Rent', from: 'bank', amount: 80000, day: 27, shift: 'after' }], free: 50000 }, { newId: I.idMaker('sixb2k') });
}
const at6 = d => ({ at: d + 'T09:00' + TZ, by: 'sixb2k', told: d + 'T09:00' + TZ });
t('[slice 6b] pay on two days a month changed to no fixed pay mid-period: by day from the change, Free to spend from the change', () => {
  const b = sixB([{ key: 'pay', name: 'Pay', bank: 'bank', amount: 150000, every: 'month', days: [15, 'last'], shift: 'before', startsPeriod: true }]), bank = b.ids.bank;
  b.book.events.push(Object.assign({ id: 'sixb2k-aaaaaaaaaa-1', k: 'spend', acct: bank, a: 3000, date: '2026-12-05' }, at6('2026-12-05')));
  eq(lookahead(b.book, '2026-12-10').period.start, '2026-11-30');
  const pay = b.book.schedules.find(s => s.id === b.ids.pay);
  pay.rules.push(Object.assign({ from: '2026-12-10', rule: { every: 'none' } }, at6('2026-12-10')));
  b.book.plan.shares.push(Object.assign({ id: 'sixb2k-aaaaaaaaaa-2', from: '2026-12-10', cur: 'JPY', per: { free: 'month' }, free: 100000, goals: {} }, at6('2026-12-10')));
  b.book.events.push(Object.assign({ id: 'sixb2k-aaaaaaaaaa-3', k: 'spend', acct: bank, a: 4000, date: '2026-12-12' }, at6('2026-12-12')));
  const r = lookahead(b.book, '2026-12-12');
  eq([r.period, r.daysToNextPay.days, r.horizon, r.accounts[bank].bank], [null, null, '2027-01-27', 493000]);
  eq([r.safeToSpend.headline, r.safeToSpend.cappedByFreeToSpend], [66967, true]);
  eq(r.safeToSpend.whyParts, [{ label: 'what your accounts can spare', amount: 181778 }, { label: 'more than Free to spend left this period', amount: -114811 }]);
  b.book.events.push(Object.assign({ id: 'sixb2k-aaaaaaaaaa-5', k: 'spend', acct: bank, a: 6000, date: '2027-01-03' }, at6('2027-01-03')));
  const j = lookahead(b.book, '2027-01-05').safeToSpend;
  eq([j.headline, j.cappedByFreeToSpend], [66177, false], 'January starts again');
  ok(Number.isInteger(r.lastsAboutWeeks), 'lasts about N weeks: ' + r.lastsAboutWeeks);
  // the period history before the change is not lost from the book: the day before the change still has its period
  eq(lookahead(b.book, '2026-12-09').period.start, '2026-11-30');
});
t('[slice 6b] no fixed pay changed to two days a month: by day until the first pay is ticked, then its period', () => {
  const { firstLanding } = require('../periods.js');
  const b = sixB([{ key: 'pay', name: 'Client work', bank: 'bank', every: 'none' }]), bank = b.ids.bank;
  const pay = b.book.schedules.find(s => s.id === b.ids.pay);
  Object.assign(pay, { startsPeriod: true, shift: 'before' });
  pay.rules.push(Object.assign({ from: '2026-12-15', rule: { every: 'month', days: [15, 'last'] } }, at6('2026-12-10')));
  pay.steps.push(Object.assign({ from: '2026-12-15', amount: 150000 }, at6('2026-12-10')));
  b.book.plan.shares.push(Object.assign({ id: 'sixb2k-aaaaaaaaaa-4', from: '2026-12-15', cur: 'JPY', per: { free: 'pay' }, free: 25000, goals: {} }, at6('2026-12-10')));
  eq([firstLanding(b.book, pay.id, '2026-12-10'), firstLanding(b.book, pay.id, '2026-12-16'), firstLanding(b.book, 'nope', '2026-12-10')], ['2026-12-15', '2026-12-30', null]);
  eq([lookahead(b.book, '2026-12-14').period, lookahead(b.book, '2026-12-15').period], [null, null], 'no period before the first pay is ticked');
  b.book.events.push(Object.assign({ id: 'set:' + pay.id + '@2026-12-15', k: 'in', sub: 'pay', acct: bank, a: 150000, stream: pay.id, date: '2026-12-15', settles: [{ s: pay.id, due: '2026-12-15' }] }, at6('2026-12-15')));
  const p = lookahead(b.book, '2026-12-16').period;
  // 31 Dec is a bank-closed day in Japan: the pay lands Wed 30 Dec, so the period is 15 to 29 Dec
  eq([p.start, p.end, p.free.amount, p.free.left], ['2026-12-15', '2026-12-29', 25000, 25000]);
});

// [BQ1, BQ4] Pay on the 25th changed to no fixed pay from Sun 10 Jan 2027, then back to the 25th from its first pay,
// Fri 23 Apr (25 Apr is a Sunday). The rules are saved out of order (the change back first): read by `from`.
// The period started by the 25 Dec pay ends on 9 Jan. On 23 Apr, before that pay is ticked: no period (by the day),
// never "25 Dec to today's pay". Ticked: the period starts 23 Apr; the periods gone by end with 25 Dec to 9 Jan.
t('[slice 6b, BQ1] to no fixed pay and back: the period before the change ends the day before it; by the day until the new pay', () => {
  const b = sixB([{ key: 'pay', name: 'Pay', bank: 'bank', amount: 250000, every: 'month', days: [25], shift: 'before', startsPeriod: true }]), bank = b.ids.bank;
  const pay = b.book.schedules.find(s => s.id === b.ids.pay);
  b.book.events.push(Object.assign({ id: 'set:' + pay.id + '@2026-12-25', k: 'in', sub: 'pay', acct: bank, a: 250000, stream: pay.id, date: '2026-12-25', settles: [{ s: pay.id, due: '2026-12-25' }] }, at6('2026-12-26')));
  pay.rules.push(Object.assign({ from: '2027-04-23', rule: { every: 'month', days: [25] } }, at6('2027-04-10')));
  pay.rules.push(Object.assign({ from: '2027-01-10', rule: { every: 'none' } }, at6('2027-01-10')));
  eq(lookahead(b.book, '2027-01-09').period.start, '2026-12-25');
  eq([lookahead(b.book, '2027-01-10').period, lookahead(b.book, '2027-04-22').period, lookahead(b.book, '2027-04-23').period], [null, null, null]);
  b.book.events.push(Object.assign({ id: 'set:' + pay.id + '@2027-04-25', k: 'in', sub: 'pay', acct: bank, a: 250000, stream: pay.id, date: '2027-04-23', settles: [{ s: pay.id, due: '2027-04-25' }] }, at6('2027-04-23')));
  const r = lookahead(b.book, '2027-04-24');
  eq([r.period.start, r.period.end], ['2027-04-23', '2027-05-24']);
  eq(periods(b.book, '2027-04-24').past.map(x => [x.start, x.end]), [['2026-12-25', '2027-01-09'], ['2026-11-25', '2026-12-24']]);
});
done('periods.test.js');
