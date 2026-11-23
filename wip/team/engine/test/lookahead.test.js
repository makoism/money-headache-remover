'use strict';
// The look ahead on small made-up copies, for rules the scenario files do not ask about (yet).
const { t, done, eq, ok } = require('./t.js');
const { lookahead } = require('../lookahead.js');

const TZ = '+09:00';
// A bank opened Tue 1 Dec 2026 with 400,000 (Free to spend 50,000 typed), pay 250,000 on the 25th (moved earlier)
// starting periods, Food 30,000 a month on the bank. Every amount made up.
function base(more) {
  const b = { v: 3, home: { curs: [{ from: '2026-01-01', cur: 'JPY' }], country: { v: 'JP' }, main: { v: { acct: 'bank', min: null } } },
    accounts: [{ id: 'bank', name: 'Bank', type: 'bank', cur: 'JPY' }, { id: 'old', name: 'Old bank', type: 'bank', cur: 'JPY' }],
    schedules: [{ id: 'pay', kind: 'income', name: 'Pay', acct: 'bank', cur: 'JPY', startsPeriod: true, shift: 'before', rules: [{ rule: { every: 'month', days: [25] } }], steps: [{ amount: 250000 }] }],
    plan: { shares: [{ id: 'sh', cur: 'JPY', per: { free: 'month' }, free: 50000 }], budgets: [{ id: 'food', name: 'Food', cur: 'JPY', per: 'month', steps: [{ amount: 30000 }] }] },
    events: [
      { id: 'o', k: 'open', acct: 'bank', date: '2026-12-01', a: 400000, told: '2026-12-01T10:00' + TZ, grp: 's', split: { free: 50000, lines: { food: 30000 } } },
      { id: 'c', k: 'check', acct: 'bank', date: '2026-12-01', a: 400000, told: '2026-12-01T10:00' + TZ, grp: 's' },
      { id: 'o2', k: 'open', acct: 'old', date: '2026-12-01', a: 0, told: '2026-12-01T10:00' + TZ, grp: 's' },
      { id: 'c2', k: 'check', acct: 'old', date: '2026-12-01', a: 0, told: '2026-12-01T10:00' + TZ, grp: 's' },
    ] };
  return more ? more(b) || b : b;
}
const run = (b, day) => lookahead(b, day, { deviceOffset: TZ });

t('without a once key the next period plans the usual line', () => {
  const r = run(base(), '2026-12-02');
  // 400,000 - 30,000 food left - (Free 50,000 is not in the walk: it is spending money) ; lowest after the 25 Dec pay is
  // the start: 370,000; then +250,000 - 30,000 - 50,000 on 25 Dec; 24 Jan 2027 the next.
  eq(r.accounts.bank.lowest, 370000);
});
t('a budget line once key for the period its pay starts replaces the usual amount there [B8, T1]', () => {
  const b = base(x => { x.plan.budgets[0].once = { 'pay@2026-12-25': { amount: 900000, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } }; });
  const r = run(b, '2026-12-02');
  // 400,000 - 30,000 + 250,000 (25 Dec) - 900,000 (food for that period) - 50,000 (free) = -330,000
  eq(r.accounts.bank.lowest, -330000);
});
t('a removed once key is not read [AE1]', () => {
  const b = base(x => { x.plan.budgets[0].once = { 'pay@2026-12-25': { amount: 900000, gone: '2026-12-01', at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } }; });
  eq(run(b, '2026-12-02').accounts.bank.lowest, 370000);
});
t('a once key waiting for add or replace counts on the safe side, the larger, for a spending line [AO4, AR1]', () => {
  const b = base(x => {
    x.plan.budgets[0].once = { 'pay@2026-12-25': { amount: 40000, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' } };
    x.pendingMove = [{ id: 'p1', waits: 'pick', to: 'once', line: 'food', key: 'pay@2026-12-25', a: 70000, told: '2026-12-01T10:00' + TZ, at: '2026-12-01T10:00' + TZ, by: 'aaaaaa' }];
  });
  // the larger of 40,000 written and 70,000 waiting: 400,000 - 30,000 + 250,000 - 70,000 - 50,000 = 500,000; lowest 370,000
  eq(run(b, '2026-12-02').accounts.bank.lowest, 370000);
  // large enough to be the lowest point: the larger, 700,000, is what the walk takes
  const b2 = base(x => { x.plan.budgets[0].once = { 'pay@2026-12-25': { amount: 400000, at: 'x', by: 'y' } };
    x.pendingMove = [{ id: 'p1', waits: 'pick', to: 'once', line: 'food', key: 'pay@2026-12-25', a: 700000, at: 'x', by: 'y' }]; });
  eq(run(b2, '2026-12-02').accounts.bank.lowest, 400000 - 30000 + 250000 - 700000 - 50000);
});
t('a share once key changes Free to spend for that period only [B8, T1]', () => {
  const b = base(x => { x.plan.shares[0].once = { 'pay@2026-12-25': { free: 500000, at: 'x', by: 'y' } }; });
  eq(run(b, '2026-12-02').accounts.bank.lowest, 400000 - 30000 + 250000 - 30000 - 500000);
});
t('a check other than zero dated after the closing day reopens a closed account [AP1, AO6, AR3]', () => {
  const b = base(x => {
    x.accounts[1].closed = '2026-12-05';
    x.events.push({ id: 'k', k: 'check', acct: 'old', date: '2026-12-07', a: 1500, told: '2026-12-07T09:00' + TZ });
  });
  const r = run(b, '2026-12-08');
  ok(r.warnings.some(w => w.account === 'old' && w.code === 'reopened'));
  eq(r.accounts.old.bank, 1500);
});
t('a check of zero, or an event on the closing day, reopens nothing [AO6]', () => {
  const b = base(x => {
    x.accounts[1].closed = '2026-12-05';
    x.events.push({ id: 'k', k: 'check', acct: 'old', date: '2026-12-07', a: 0, told: '2026-12-07T09:00' + TZ });
  });
  const r = run(b, '2026-12-08');
  ok(!r.warnings.some(w => w.account === 'old' && w.code === 'reopened'));
  eq(r.accounts.old.spendFrom, false);
});
t('any event dated after the closing day reopens it, money out too [AP1]', () => {
  const b = base(x => {
    x.accounts[1].closed = '2026-12-05';
    x.events.push({ id: 'sp1', k: 'spend', acct: 'old', date: '2026-12-07', a: 200, told: '2026-12-07T09:00' + TZ });
  });
  const r = run(b, '2026-12-08');
  ok(r.warnings.some(w => w.account === 'old' && w.code === 'reopened'));
  eq(r.accounts.old.bank, -200);
});
t('a removed place keeps its money to place when the app wrote its rm: move to Waiting [O, P1, Q7]', () => {
  const b = base(x => {
    x.places = [{ id: 'trip', name: 'Trip', kind: 'goal', keptIn: { acct: 'bank', mode: 'inBank' }, gone: '2026-12-03' }];
    x.events[0].split.places = { trip: 60000 };
    x.events.push({ id: 'rm:trip', k: 'move', place: 'trip', place2: 'waiting', a: 60000, toPlace: true, date: '2026-12-03', told: '2026-12-03T09:00' + TZ });
    x.events.push({ id: 'pl1', k: 'move', place: 'waiting', place2: 'free', a: 10000, placed: 'rm:trip', acct: 'bank', date: '2026-12-04', told: '2026-12-04T09:00' + TZ });
  });
  const r = run(b, '2026-12-05');
  eq(r.toPlace.trip.amount, 50000);
  ok(/50,000 \(Trip's money, in Waiting to place\)/.test(r.accounts.bank.why));
});
t("a filler's place is the check-in's fillerPlace for that account, that check-in only [AS6]", () => {
  const b = base(x => {
    x.events.push({ id: 'k1', k: 'check', acct: 'bank', date: '2026-12-03', a: 395000, told: '2026-12-03T09:00' + TZ, grp: 'ci1' },
      { id: 'k2', k: 'check', acct: 'bank', date: '2026-12-03', a: 393000, told: '2026-12-03T18:00' + TZ, grp: 'ci2' });
    x.checkins = [{ id: 'ci1', date: '2026-12-03', fillerPlace: { bank: 'food' } }, { id: 'ci2', date: '2026-12-03' }];
  });
  const r = run(b, '2026-12-03');
  // food 30,000 less the first check-in's 5,000 filler; the second check-in's 2,000 picked nothing, so Free to spend
  eq(r.accounts.bank.headroom, 393000 - 25000);
  eq(r.safeToSpend.headline, 48000);
});
// [AU4, AU5] A pay that starts a period, counted on its day or late but still counted, takes that period's budget
// lines and Free to spend with it. Rent 300,000 on the 25th too.
const withRent = () => base(x => { x.schedules.push({ id: 'rent', kind: 'bill', name: 'Rent', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [25] } }], steps: [{ amount: 300000 }] }); });
t('a pay due today and not ticked brings its period\'s lines and Free to spend [AU4]', () => {
  const r = run(withRent(), '2026-12-25');
  // 400,000 - 30,000 food left; 25 Dec: + 250,000 pay - 300,000 rent - 30,000 food - 50,000 free = 240,000;
  // 25 Jan: + 250,000 - 300,000 - 30,000 - 50,000 = 110,000
  eq(r.accounts.bank.lowest, 110000);
});
t('a late pay still counted brings its period\'s lines and Free to spend [AU5, H8]', () => {
  const r = run(withRent(), '2026-12-28');
  eq(r.accounts.bank.lowest, 110000);
});
// [WIRING_PLAN 1.4 step 2] the period in the answer: start, end (the day before the next period-starting pay),
// the pay that started it, and what is left of each plan line and of Free to spend
const { convert } = require('./scenario_to_book.js');
const mako = convert(JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'foundation_review', 'scenarios', 'mako_shape.json'), 'utf8')));
const makoOn = day => lookahead(mako.book, day, mako.opts).period;
t("the period: Mako's shape on Mon 23 Nov runs 10 Nov to 9 Dec", () => {
  const p = makoOn('2026-11-23');
  eq([p.start, p.end, p.startsWith], ['2026-11-10', '2026-12-09', 'pay_main@2026-11-10']);
});
t('the period: on 10 Dec, the pay ticked, 10 Dec to 7 Jan (the January pay lands early on Fri 8 Jan)', () => {
  const p = makoOn('2026-12-10');
  eq([p.start, p.end, p.startsWith], ['2026-12-10', '2027-01-07', 'pay_main@2026-12-10']);
});
t('the period: the January pay landing early on Fri 8 Jan starts the period that day [F8]', () => {
  const p = makoOn('2027-01-08');
  eq([p.start, p.end, p.startsWith], ['2027-01-08', '2027-02-09', 'pay_main@2027-01-10']);
});
t('the period carries its plan lines and Free to spend, with what is left of each', () => {
  const b = base(x => { x.events.push({ id: 's1', k: 'spend', acct: 'bank', date: '2026-12-02', a: 4000, told: '2026-12-02T12:00' + TZ, line: 'food' }); });
  const p = run(b, '2026-12-03').period;
  eq(p.lines.map(l => [l.id, l.amount, l.left]), [['food', 30000, 26000]]);
  eq([p.free.amount, p.free.left], [50000, 50000]);
  eq([p.start, p.end, p.waitingForPay], ['2026-11-25', '2026-12-24', false]);
});
t('the period while its next pay is due and not ticked runs to today and says it waits for the pay [AU4]', () => {
  const p = run(base(), '2026-12-25').period;
  eq([p.start, p.end, p.waitingForPay], ['2026-11-25', '2026-12-25', true]);
});
// [WIRING_PLAN F4, H8, F3, G4] the period's next pay: coming, late (inside its posting window, still counted) or not
// seen (after the window, no longer counted); the period never ends before today and days to next pay is never below 0
t("the period's next pay on 10 Dec before the pay is ticked: coming, today [G4]", () => {
  const r = lookahead(mako.book, '2026-12-10', Object.assign({}, mako.opts, { at: 'start of day' }));
  eq(r.period.nextPay, { occ: 'pay_main@2026-12-10', due: '2026-12-10', state: 'coming' });
  eq([r.period.end, r.daysToNextPay.days], ['2026-12-10', 0]);
});
t("the period's next pay one day late, inside its posting window: late, still counted [H8]", () => {
  const r = run(base(), '2026-12-26');
  eq(r.period.nextPay, { occ: 'pay@2026-12-25', due: '2026-12-25', state: 'late' });
  eq([r.period.start, r.period.end, r.daysToNextPay.days, r.daysToNextPay.late], ['2026-11-25', '2026-12-26', 0, true]);
});
t('30 Dec with nothing ticked since the 10 Nov pay: the December pay is not seen, the period runs to today [H8, F3]', () => {
  const b = base(x => {
    x.schedules[0].rules = [{ rule: { every: 'month', days: [10] } }];
    for (const e of x.events) e.date = '2026-11-20', e.told = '2026-11-20T10:00' + TZ;
  });
  const r = run(b, '2026-12-30');
  eq(r.period.nextPay, { occ: 'pay@2026-12-10', due: '2026-12-10', state: 'notSeen' });
  eq([r.period.start, r.period.end], ['2026-11-10', '2026-12-30']);
  ok(r.daysToNextPay.days >= 0);
});
// A card closing on the 10th, paid on the 7th two months later, in full from the bank, opened Tue 1 Jun 2027 owing 0
function cardBook(more) {
  return base(x => {
    x.accounts.push({ id: 'card', name: 'Card', type: 'card', cur: 'JPY', inFull: true, cutDay: 10, payDay: 7, payMonths: 2, shift: 'none', payFrom: 'bank' });
    x.events.push({ id: 'oc', k: 'open', acct: 'card', date: '2027-06-01', a: 0, told: '2027-06-01T10:00' + TZ, grp: 's2' },
      { id: 'cc', k: 'check', acct: 'card', date: '2027-06-01', a: 0, told: '2027-06-01T10:00' + TZ, grp: 's2' });
    if (more) more(x);
  });
}
t('a credit statement carries to the next statement at its close, before its own payment day [AU6, H3]', () => {
  const b = cardBook(x => x.events.push(
    { id: 'rf', k: 'in', sub: 'refund', acct: 'card', date: '2027-06-20', a: 14900, told: '2027-06-20T12:00' + TZ },
    { id: 'sp', k: 'spend', acct: 'card', date: '2027-07-20', a: 81000, told: '2027-07-20T12:00' + TZ }));
  // the 10 Jul statement is a credit of 14,900; the 10 Aug one is 81,000 - 14,900, as the open amount was on 31 Jul
  eq(run(b, '2027-07-31').cards.card.next.amount, 66100);
  const n = run(b, '2027-08-12').cards.card.next;
  eq([n.amount, n.payment_date, n.statement], [66100, '2027-10-07', 'closed']);
});
t('a part-paid remainder carried on again is asked once along the carry chain [AU3, I3]', () => {
  // A bank and a card opened Tue 1 Jun 2027; the card closes on the 5th and is paid on the 22nd of the same month
  const ev = (id, k, date, more) => Object.assign({ id, k, date, told: date + 'T12:00' + TZ }, more);
  const b = { v: 3, home: { curs: [{ from: '2026-01-01', cur: 'JPY' }], country: { v: 'JP' }, main: { v: { acct: 'bank', min: null } } },
    accounts: [{ id: 'bank', name: 'Bank', type: 'bank', cur: 'JPY' },
      { id: 'card', name: 'Card', type: 'card', cur: 'JPY', inFull: true, cutDay: 5, payDay: 22, payMonths: 0, shift: 'none', payFrom: 'bank' }],
    schedules: [],
    events: [ev('o', 'open', '2027-06-01', { acct: 'bank', a: 400000, grp: 's' }), ev('c', 'check', '2027-06-01', { acct: 'bank', a: 400000, grp: 's' }),
      ev('oc', 'open', '2027-06-01', { acct: 'card', a: 0, grp: 's' }), ev('cc', 'check', '2027-06-01', { acct: 'card', a: 0, grp: 's' }),
      ev('s1', 'spend', '2027-06-15', { acct: 'card', a: 50000 }),
      ev('p1', 'repay', '2027-07-22', { acct: 'bank', acct2: 'card', a: 41712, a2: 41712 }),   // 8,288 of the July statement left, its item open
      ev('s2', 'spend', '2027-08-01', { acct: 'card', a: 100000 }),
      ev('p2', 'repay', '2027-08-22', { acct: 'bank', acct2: 'card', a: 85700, a2: 85700, settles: [{ s: 'card', due: '2027-08-22' }] }),   // August ticked, 22,588 carried
      ev('s3', 'spend', '2027-09-01', { acct: 'card', a: 74800 })] };
  const r = run(b, '2027-09-12');
  // 272,588 - 8,288 (the July item, late) - 89,100 (September's 97,388 less the 8,288 July already asks) = 175,200
  eq(r.accounts.bank.headroom, 175200);
});
t('a pay inside the opening that lands after the setup day: its period starts by the setup day [AU7]', () => {
  // set up Sat 20 Feb 2027; pay due that day is moved later to Mon 22 Feb, and is already in the opening figure
  const b = base(x => {
    x.schedules[0].rules = [{ rule: { every: 'month', days: [20] } }];
    x.schedules[0].shift = 'after';
    for (const e of x.events) { e.date = '2027-02-20'; e.told = '2027-02-20T10:00' + TZ; delete e.split; }
  });
  const r = run(b, '2027-02-20');
  eq([r.period.start, r.period.end, r.period.startsWith], ['2027-02-20', '2027-03-22', 'pay@2027-02-20']);
  // to Tue 23 Mar (20 Mar is a Saturday, 22 Mar the equinox's substitute holiday); Free to spend by days left: all of it
  eq(r.safeToSpend.headline, 50000);
});
t('in a life with a plan, a spend with no line counts against Free to spend; a bill paid does not [AU]', () => {
  const b = base(x => {
    x.schedules.push({ id: 'gym', kind: 'bill', name: 'Gym', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [2] } }], steps: [{ amount: 7000 }] });
    x.events.push({ id: 'n1', k: 'spend', acct: 'bank', date: '2026-12-02', a: 5000, told: '2026-12-02T12:00' + TZ },
      { id: 'g1', k: 'spend', acct: 'bank', date: '2026-12-02', a: 7000, told: '2026-12-02T12:00' + TZ, settles: ['gym@2026-12-02'] });
  });
  eq(run(b, '2026-12-03').safeToSpend.headline, 45000);
});
t('a waiting once amount for Free to spend counts the smaller [AV3]', () => {
  const b = base(x => { x.pendingMove = [{ id: 'pm', waits: 'pick', to: 'once', share: 'sh', key: 'pay@2026-12-25', a: 30000, told: '2026-12-01T10:00' + TZ }];
    x.events.push({ id: 'p1', k: 'in', sub: 'pay', acct: 'bank', date: '2026-12-25', a: 250000, told: '2026-12-25T09:00' + TZ, settles: ['pay@2026-12-25'], stream: 'pay' }); });
  eq(run(b, '2026-12-26').safeToSpend.headline, 30000);
});
t('a refund never settles a pay, whatever its size [AV4]', () => {
  const b = base(x => { x.events.push({ id: 'imp:bank:1', k: 'in', sub: 'refund', acct: 'bank', date: '2026-12-25', a: 250000, told: '2026-12-26T08:00' + TZ, src: { type: 'statement' } }); });
  const d = run(b, '2026-12-26').daysToNextPay;
  eq([d.item, d.late], ['pay@2026-12-25', true]);
});
t('while a money question waits, the walk counts the safe side across the kept versions [AW7, AR1]', () => {
  const b = base(x => {
    x.schedules.push({ id: 'rent', kind: 'bill', name: 'Rent', acct: 'bank', cur: 'JPY', shift: 'none', rules: [{ rule: { every: 'month', days: [27] } }], steps: [{ amount: 300000 }] });
    const ver = (id, amount) => Object.assign({}, x.schedules.find(y => y.id === id), { steps: [{ amount }] });
    x.keptVersions = [{ id: 'kept:pay', of: 'pay', in: 'schedules', ask: true, versions: [ver('pay', 240000), ver('pay', 250000)] },
      { id: 'kept:rent', of: 'rent', in: 'schedules', ask: true, versions: [ver('rent', 300000), ver('rent', 310000)] }];
  });
  // 400,000 - 30,000 food left + 240,000 (pay 25 Dec, the smaller) - 30,000 - 50,000 (next period) - 310,000 (rent 27 Dec, the larger) = 220,000
  eq(run(b, '2026-12-02').accounts.bank.lowest, 220000);
  b.keptVersions.forEach(k => { k.ask = false; });
  eq(run(b, '2026-12-02').accounts.bank.lowest, 240000);   // picked: what shows, 250,000 and 300,000
});
t("a step dated on the first day of the period holding the setup day counts in that period [T watch, V]", () => {
  const b = base(x => {
    delete x.events[0].split;
    x.plan.budgets[0].steps.push({ from: '2026-11-25', amount: 60000 });
  });
  const p = run(b, '2026-12-02').period;
  // the period runs 25 Nov to 24 Dec (30 days); set up 1 Dec, so Food's share is 24 of 30 days of 60,000
  eq(p.lines.map(l => [l.id, l.amount, l.left]), [['food', 60000, 48000]]);
});
t('a goal: what is needed each period to reach its target by its date, from what is really set aside', () => {
  const b = base(x => {
    x.places = [{ id: 'trip', name: 'Trip', kind: 'goal', target: 100000, due: '2027-03-31', keptIn: { acct: 'bank', mode: 'inBank' } }];
    x.events[0].split.places = { trip: 10000 };
    x.events.push({ id: 'g1', k: 'move', place: 'waiting', place2: 'trip', a: 15000, date: '2026-12-02', told: '2026-12-02T12:00' + TZ });
  });
  const g = run(b, '2026-12-03').places.trip;
  // 25,000 set aside, 75,000 to go; pays starting periods by 31 Mar: 25 Dec, 25 Jan, 25 Feb, 25 Mar (4): 18,750 each
  eq([g.kept, g.target, g.toGo, g.periodsLeft, g.perPeriod], [25000, 100000, 75000, 4, 18750]);
  // past its date, or with no pay left before it: all of what is to go, now
  eq(run(b, '2027-03-27').places.trip.periodsLeft, 0);
  eq(run(b, '2027-03-27').places.trip.perPeriod, 75000);
});
// [F4 for payments, H8, AU] a card or loan payment past its day and not ticked is late (inside the paying bank's posting
// window) or not seen; it is never the "next payment" with a past date
t('a card payment past its day and not ticked: late, then not seen, never the next payment', () => {
  const b = cardBook(x => x.events.push({ id: 'sp', k: 'spend', acct: 'card', date: '2027-06-20', a: 81000, told: '2027-06-20T12:00' + TZ }));
  const on = day => run(b, day).cards.card;
  eq(on('2027-09-06').next.payment_date, '2027-09-07');   // coming
  const late = on('2027-09-08');
  ok(late.next === null || late.next.payment_date >= '2027-09-08');
  eq(late.overdue.map(o => [o.item, o.amount, o.payment_date, o.state]), [['card@2027-09-07', 81000, '2027-09-07', 'late']]);
  eq(on('2027-09-10').overdue.map(o => o.state), ['notSeen']);
});
t('a loan payment past its day and not ticked: late, never the next payment', () => {
  const b = base(x => {
    x.accounts.push({ id: 'loan', name: 'Loan', type: 'loan', cur: 'JPY', payDay: 27, shift: 'none', payFrom: 'bank', amount: 20000 });
    x.events.push({ id: 'ol', k: 'open', acct: 'loan', date: '2026-12-01', a: 200000, told: '2026-12-01T10:00' + TZ, grp: 's' },
      { id: 'cl', k: 'check', acct: 'loan', date: '2026-12-01', a: 200000, told: '2026-12-01T10:00' + TZ, grp: 's' });
  });
  const o = run(b, '2026-12-28').owed.loan;
  eq(o.overdue.map(x => [x.item, x.payment_date, x.state]), [['loan@2026-12-27', '2026-12-27', 'late']]);
  ok(o.next.payment_date > '2026-12-28');
});
done('lookahead');
