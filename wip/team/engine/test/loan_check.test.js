'use strict';
// [LOAN_CHECK_PLAN.md, coordinator's engine ruling 26 Nov 2026] a check on a loan sets what is owed from its day, as
// for cards. Made-up yen, Kenji's car loan: 900,000 owed when added on 20 Nov 2026, 30,000 on the 27th from Main bank,
// no interest. Pay 400,000 on the 10th. 27 Nov and 27 Dec ticked on their days. On 3 Feb the lender's app says 812,400.
// Worked by hand: from the opening, 900,000 - 30,000 - 30,000 = 840,000 after 27 Dec; the lender's 812,400 holds the
// 27 Jan payment off (Yes) or not (No), and some interest the app does not know.
const { t, done, eq, ok } = require('./t.js');
const BB = require('../build_book.js'), LA = require('../lookahead.js'), IDS = require('../ids.js'), CK = require('../checkin.js');
function kenji() {
  const newId = IDS.idMaker('k3f9aq');
  const out = BB.buildBook({ day: '2026-11-20', told: '2026-11-20T03:00:00.000+00:00', currency: 'JPY', country: 'JP', banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 400000, every: 'month', day: 10, shift: 'none', startsPeriod: true }], cards: [], bills: [], free: 60000 }, { newId });
  const book = out.book || out, bank = book.accounts[0].id, loan = newId(), grp = newId();
  book.accounts.push({ id: loan, name: 'Car loan', type: 'loan', cur: 'JPY', owner: null, payDay: 27, shift: 'none', payFrom: bank, amount: 30000 });
  const told = '2026-11-20T04:00:00.000+00:00';
  book.events.push({ id: newId(), k: 'open', acct: loan, date: '2026-11-20', a: 900000, told, at: told, grp }, { id: newId(), k: 'check', acct: loan, date: '2026-11-20', a: 900000, told, at: told, grp });
  const h = { book, bank, loan, newId };
  h.checkIn = (day, x) => { const r = CK.checkIn(h.book, Object.assign({ day, told: day + 'T03:00:00.000+00:00', newId, figures: {}, ticked: [], unticked: [], expected: {} }, x)); h.book.events.push(...r.events); (h.book.checkins = h.book.checkins || []).push(...r.checkins); return r; };
  h.tick = (day, due) => h.checkIn(day, { ticked: [loan + '@' + due], expected: { [loan + '@' + due]: 30000 } });
  h.tick('2026-11-27', '2026-11-27'); h.tick('2026-12-27', '2026-12-27');
  return h;
}
const L = (h, day) => LA.lookahead(h.book, day).owed[h.loan];
t('before any loan check: 840,000 owed on 3 Feb with the 27 Jan payment unpaid (the opening walk, as today)', () => {
  const h = kenji(), o = L(h, '2027-02-03');
  eq([o.owedNow, o.overdue.map(x => [x.payment_date, x.amount])], [840000, [['2027-01-27', 30000]]]);
});
t('Yes: 27 Jan ticked in the same step as the check of 812,400: owed 812,400, nothing overdue, next 27 Feb 30,000', () => {
  const h = kenji();
  h.checkIn('2027-02-03', { ticked: [h.loan + '@2027-01-27'], expected: { [h.loan + '@2027-01-27']: 30000 }, figures: { [h.loan]: 812400 } });
  const o = L(h, '2027-02-03');
  eq([o.owedNow, o.overdue.length, o.next && [o.next.payment_date, o.next.amount]], [812400, 0, ['2027-02-27', 30000]]);
});
t('Yes with the bank checked after the payment day: the tick dated after it by landedFrom is still inside the check (same step)', () => {
  const h = kenji();
  h.checkIn('2027-01-29', { figures: { [h.bank]: 500000 } });
  const r = h.checkIn('2027-02-03', { ticked: [h.loan + '@2027-01-27'], expected: { [h.loan + '@2027-01-27']: 30000 }, figures: { [h.loan]: 812400 } });
  ok(r.events.find(e => e.k === 'repay').date > '2027-01-27', 'the tick is dated after the payment day');
  eq(L(h, '2027-02-03').owedNow, 812400);
});
t('No: the check of 812,400 carries notYet for 27 Jan: owed 812,400 with 27 Jan still to tick; ticked on 10 Feb after a 5 Feb bank check, owed 782,400 once', () => {
  const h = kenji(), occ = h.loan + '@2027-01-27';
  h.checkIn('2027-02-03', { figures: { [h.loan]: 812400 }, notYet: { [h.loan]: [occ] } });
  let o = L(h, '2027-02-03');
  eq([o.owedNow, o.overdue.map(x => x.payment_date)], [812400, ['2027-01-27']]);
  h.checkIn('2027-02-05', { figures: { [h.bank]: 500000 } });
  h.checkIn('2027-02-10', { ticked: [occ], expected: { [occ]: 30000 } });
  o = L(h, '2027-02-10');
  eq([o.owedNow, o.overdue.length, o.next && [o.next.payment_date, o.next.amount]], [782400, 0, ['2027-02-27', 30000]]);
});
t('a check of 0 ends the payments; Undo (the check marked gone) brings the walk from the opening back', () => {
  const h = kenji();
  h.checkIn('2027-01-05', { figures: { [h.loan]: 0 } });
  let o = L(h, '2027-01-05');
  eq([o.owedNow, o.next, o.overdue.length], [0, null, 0]);
  for (const e of h.book.events) if (e.k === 'check' && e.acct === h.loan && e.date === '2027-01-05') e.gone = true;
  o = L(h, '2027-01-05');
  eq(o.owedNow, 840000);
});
t('two checks: the latest by day wins; the earlier stays as history', () => {
  const h = kenji();
  h.checkIn('2027-01-05', { figures: { [h.loan]: 845000 } });
  h.checkIn('2027-01-20', { figures: { [h.loan]: 843000 } });
  eq(L(h, '2027-01-20').owedNow, 843000);
});
t('a payment day after the check comes off the check\'s figure: check 845,000 on 5 Jan, 27 Jan ticked: 815,000', () => {
  const h = kenji();
  h.checkIn('2027-01-05', { figures: { [h.loan]: 845000 } });
  h.tick('2027-01-27', '2027-01-27');
  eq(L(h, '2027-02-01').owedNow, 815000);
});
// [LOAN_CHECK_PLAN "Saved data", finding 3] old books already hold checks on a loan: a moved debt's mv:check:debt:* (no
// grp, the same day and amount as its opening) and closeLoan's check of 0. Owed and the payment items are the same as the
// engine gave before the rule (a9d4aa75^, run on these books by hand and pinned here).
const MV = require('../move.js');
function movedDebt() {
  const copy = { v: 1, rev: 412, steps: { a: [{ from: '2026-11', v: 310000 }] }, once: {}, items: {}, cfg: { bankStart: 480000, minBank: 50000 },
    ui: { cur: '¥', name: 'Sample person', done: { pay: true, bills: true, goals: true }, accts: [{ id: 'ac1', name: 'Main bank', kind: 'bank' }] },
    plan: { lines: [{ id: 'rent', key: 'bill:rent', jar: 'nec', name: 'Rent or mortgage', def: 90000 }, { id: 'loan', key: 'bill:loan', jar: 'nec', name: 'Loan or debt payment', def: 0 }],
      goals: [], debts: [{ id: 'car', name: 'Car loan', kind: 'loan', balance: 640000, apr: 0, min: 25000, extra: 0 }], recurring: [] }, receipts: [] };
  return MV.move({ copy, now: '2026-11-24T09:00:00.000+09:00', answers: { cur: 'JPY', pay: { a: { every: 'month', days: [10] } }, billDay: { rent: { every: 'month', days: [27] } }, loanLine: 'drop', debtDay: { car: 27 } } });
}
const brief = o => [o.owedNow, o.next && [o.next.payment_date, o.next.amount], o.overdue.map(x => [x.payment_date, x.amount, x.state])];
t('old book: a moved debt with its mv:check:debt check gives the same owed and items as before the rule', () => {
  const b = movedDebt(), id = 'mv:debt:car';
  ok(b.events.some(e => e.id === 'mv:check:debt:car' && e.k === 'check' && e.a === 640000), 'the moved check is there');
  eq(brief(LA.lookahead(b, '2026-11-24').owed[id]), [640000, ['2026-11-27', 25000], []]);
  eq(brief(LA.lookahead(b, '2027-01-05').owed[id]), [640000, ['2027-01-27', 25000], [['2026-11-27', 25000, 'notSeen'], ['2026-12-27', 25000, 'notSeen']]]);
  const r = CK.checkIn(b, { day: '2027-01-05', told: '2027-01-05T03:00:00.000+00:00', newId: IDS.idMaker('m7c2px'), figures: {}, ticked: [id + '@2026-11-27', id + '@2026-12-27'], expected: { [id + '@2026-11-27']: 25000, [id + '@2026-12-27']: 25000 }, unticked: [] });
  const b2 = CK.apply(b, r);
  eq(brief(LA.lookahead(b2, '2027-01-05').owed[id]), [590000, ['2027-01-27', 25000], []]);
});
t('old book: closeLoan\'s check of 0 on a paid-off loan gives the same owed and items as before the rule (0, none)', () => {
  const h = kenji();
  h.book.accounts.find(a => a.id === h.loan).amount = 30000;
  for (const e of h.book.events) if (e.acct === h.loan && (e.k === 'open' || e.k === 'check')) e.a = 60000;
  const told = '2026-12-28T05:00:00.000+00:00';
  h.book.events.push({ id: h.newId(), k: 'check', acct: h.loan, date: '2026-12-28', a: 0, told, at: told, grp: h.newId() });
  h.book.accounts.find(a => a.id === h.loan).closed = '2026-12-28';
  for (const d of ['2026-12-28', '2027-02-03']) eq(brief(L(h, d)), [0, null, []]);
});
// [qc-foundation loancheck_build finding 1, plan rule 2b] two loan checks: a payment day after the first check takes what
// was owed then from the first check's walk, not the opening's. Made-up yen: a 100,000 loan, 30,000 on the 27th, 27 Nov
// and 27 Dec ticked (40,000 left by the opening walk); 5 Jan the lender says 25,000 (paid extra); 27 Jan not ticked;
// 3 Feb the lender still says 25,000, answered No for 27 Jan. By hand: 27 Jan asks the 25,000 left, never 30,000;
// ticked, nothing is owed (never -5,000).
const small = (pay, minRule) => {
  const h = kenji();
  const a = h.book.accounts.find(x => x.id === h.loan); a.amount = pay; if (minRule) a.minRule = minRule;
  for (const e of h.book.events) if (e.acct === h.loan && (e.k === 'open' || (e.k === 'check' && e.date === '2026-11-20'))) e.a = 100000;
  return h;
};
t('two loan checks, No at the second: 27 Jan asks 25,000 from the first check, and once ticked nothing is owed', () => {
  const h = small(30000), occ = h.loan + '@2027-01-27';
  h.checkIn('2027-01-05', { figures: { [h.loan]: 25000 } });
  eq(L(h, '2027-02-03').overdue.map(x => [x.payment_date, x.amount]), [['2027-01-27', 25000]]);
  h.checkIn('2027-02-03', { figures: { [h.loan]: 25000 }, notYet: { [h.loan]: [occ] } });
  let o = L(h, '2027-02-03');
  eq([o.owedNow, o.overdue.map(x => [x.payment_date, x.amount])], [25000, [['2027-01-27', 25000]]]);
  h.checkIn('2027-02-05', { ticked: [occ], expected: { [occ]: 25000 } });
  o = L(h, '2027-02-05');
  eq([o.owedNow, o.overdue.length, o.next], [0, 0, null]);
});
t('two loan checks with a 2% minimum: 27 Jan asks 2% of the first check\'s 50,000 (1,000), not of the opening walk', () => {
  const h = small(null, { pct: 2, floor: 0 }), occ = h.loan + '@2027-01-27';
  // ticks of the opening walk's own minimums: 2,000 then 1,960
  h.book.events = h.book.events.filter(e => !(e.k === 'repay' && e.acct2 === h.loan) && !(e.settles && String(e.settles).startsWith(h.loan)));
  h.book.checkins = [];
  h.checkIn('2026-11-27', { ticked: [h.loan + '@2026-11-27'], expected: { [h.loan + '@2026-11-27']: 2000 } });
  h.checkIn('2026-12-27', { ticked: [h.loan + '@2026-12-27'], expected: { [h.loan + '@2026-12-27']: 1960 } });
  h.checkIn('2027-01-05', { figures: { [h.loan]: 50000 } });
  h.checkIn('2027-02-03', { figures: { [h.loan]: 50000 }, notYet: { [h.loan]: [occ] } });
  const o = L(h, '2027-02-03');
  eq([o.owedNow, o.overdue.map(x => [x.payment_date, x.amount])], [50000, [['2027-01-27', 1000]]]);
});
done();
