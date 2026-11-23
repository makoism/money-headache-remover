'use strict';
// engine/build_book.js: setup answers into a book (SCHEMA_V3 sections 2 to 5, B6, B7, H1, H4, AN3, O3). Mako's made-up
// shape built from its answers gives the same look ahead as the same life written as a scenario, on every day asked.
const { t, done, eq, ok } = require('./t.js');
const assert = require('assert');
const D = require('../dates.js'), I = require('../ids.js');
const { lookahead } = require('../lookahead.js');
const B = require('../build_book.js');
const { ANSWERS, scenarioBook } = require('./mako_madeup.js');

const newId = I.idMaker('q4zt8m', () => 0.25);
const clone = x => JSON.parse(JSON.stringify(x));
const built = B.buildBook(clone(ANSWERS), { newId });
const book = built.book, id = built.ids;
const ref = scenarioBook();

t('every record has an ordinary id, and each answer key names one', () => {
  for (const list of [book.accounts, book.schedules, book.events]) for (const r of list) ok(I.isOrdinary(r.id), r.id);
  eq(Object.keys(id).sort(), ['bank', 'card_a', 'card_b', 'internet', 'pay_main', 'pay_side', 'phone', 'power', 'rent']);
});
t('every record carries told, at and by [SCHEMA 0]', () => {
  for (const list of [book.accounts, book.schedules, book.events]) for (const r of list) ok(r.told && r.at && r.by, r.id);
  eq(book.home.main.v, { acct: id.bank, min: null });
  ok(book.home.main.at && book.home.country.v === 'JP');
});
t('each account opens with one open and one check the same day, in the setup group [B6, B7, H1]', () => {
  for (const a of book.accounts) {
    const evs = book.events.filter(e => e.acct === a.id);
    eq(evs.map(e => e.k), ['open', 'check']);
    eq(evs[0].grp, evs[1].grp);
    eq(evs[0].date, '2026-11-20');
  }
});
t('a card with its close day "not sure" is saved without one [H4]', () => {
  const ca = book.accounts.find(a => a.id === id.card_a);
  eq([ca.type, ca.cutDay, ca.payDay, ca.payFrom, ca.inFull, ca.shift], ['card', null, 10, id.bank, true, 'after']);
});
const days = [];
for (let d = D.dayNum('2026-11-20'); d <= D.dayNum('2027-02-20'); d += 3) days.push(D.dayStr(d));
const back = {}; for (const k in id) back[id[k]] = k;
const short = s => String(s).replace(/[a-z0-9]{6}-[a-z0-9]{10}-\d+/g, m => back[m] || m);
const view = r => short(JSON.stringify({ accounts: Object.fromEntries(Object.entries(r.accounts).map(([k, a]) => [k, [a.bank, a.headroom, a.lowestDay]])),
  head: r.safeToSpend.headline, next: r.daysToNextPay, due: r.dueBeforeNextPay, cards: Object.fromEntries(Object.entries(r.cards).map(([k, c]) => [k, c.next])),
  period: r.period, list: r.checkIn.toConfirm }));
t("Mako's answers give the same look ahead as his scenario, every third day from setup to 20 Feb", () => {
  for (const day of days) assert.strictEqual(view(lookahead(book, day)), view(lookahead(ref, day)), day);
});
t('a minimum on the main bank is kept in home.main with its currency [AN3]; on another bank in its minBank', () => {
  const a = clone(ANSWERS);
  a.banks[0].min = 30000;
  a.banks.push({ key: 'wallet', name: 'E-wallet', type: 'ewallet', amount: 5000, min: 1000 });
  const b = B.buildBook(a, { newId }).book;
  eq(b.home.main.v.min, { a: 30000, cur: 'JPY' });
  eq(b.accounts.find(x => x.name === 'E-wallet').minBank, { a: 1000, cur: 'JPY' });
  eq(b.accounts.find(x => x.name === 'Main bank').minBank, undefined);
});
t('pay every two weeks, a card with a close day, a bill paid by card', () => {
  const a = clone(ANSWERS);
  a.pays = [{ key: 'pay', name: 'Pay', bank: 'bank', amount: 90000, every: 'weeks', n: 2, from: '2026-11-27', startsPeriod: true }];
  a.cards[0].closeDay = 15; a.cards[0].payMonths = 1;
  a.bills.push({ key: 'gym', name: 'Gym', from: 'card_a', amount: 6000, day: 5 });
  const r = B.buildBook(a, { newId });
  const p = r.book.schedules.find(s => s.id === r.ids.pay);
  eq([p.rules[0].rule, p.startsPeriod], [{ every: 'weeks', n: 2, from: '2026-11-27' }, true]);
  eq(r.book.accounts.find(x => x.id === r.ids.card_a).cutDay, 15);
  eq(r.book.schedules.find(s => s.id === r.ids.gym).acct, r.ids.card_a);
  eq(lookahead(r.book, '2026-11-21').daysToNextPay.next_pay, '2026-11-27');
});
t('wrong answers are refused, not guessed', () => {
  const bad = f => { const a = clone(ANSWERS); f(a); assert.throws(() => B.buildBook(a, { newId })); };
  bad(a => { a.banks[0].amount = 12.5; });            // not whole minor units
  bad(a => { a.bills[0].day = 32; });                  // no such day
  bad(a => { a.bills[0].from = 'nowhere'; });          // no such account
  bad(a => { a.pays[0].every = 'fortnight'; });        // no such rhythm
  bad(a => { a.banks.push({ key: 'bank', name: 'Again', amount: 1 }); });   // a key used twice
  bad(a => { a.pays.forEach(p => { p.startsPeriod = true; }); });           // two pays starting periods
});
t('a pay of 0 is refused with words: a pay that exists always has an amount [BL1]', () => {
  const a = clone(ANSWERS); a.pays[0].amount = 0;
  assert.throws(() => B.buildBook(a, { newId }), /^Error: A pay needs an amount\. No fixed pay comes later$/);
});
t('the builder does not change the answers it is given', () => {
  const a = clone(ANSWERS); B.buildBook(a, { newId }); assert.deepStrictEqual(a, ANSWERS);
});
t('a bill due between the last pay and the setup day: taken out already (inside the bank figure) or still to go [X3]', () => {
  // set up Fri 20 Nov after the 10 Nov pay; the phone bill of 4,800 is due that day
  const occ = k => r => r.checkIn.toConfirm.some(o => o.item === k);
  const a1 = clone(ANSWERS);   // no answer: taken out already, as before
  const b1 = B.buildBook(a1, { newId });
  ok(!occ(b1.ids.phone + '@2026-11-20')(lookahead(b1.book, '2026-11-21')));
  const a2 = clone(ANSWERS); a2.bills.find(b => b.key === 'phone').takenOut = false;
  const b2 = B.buildBook(a2, { newId });
  const r2 = lookahead(b2.book, '2026-11-21');
  ok(occ(b2.ids.phone + '@2026-11-20')(r2));
  eq(r2.accounts[b2.ids.bank].headroom, lookahead(b1.book, '2026-11-21').accounts[b1.ids.bank].headroom - 4800);
  eq(b2.book.events.find(e => e.k === 'check' && e.acct === b2.ids.bank).notYet, [b2.ids.phone + '@2026-11-20']);
  // a bill with no day since the last pay has nothing to mark
  const a3 = clone(ANSWERS); a3.bills.find(b => b.key === 'rent').takenOut = false;
  eq(B.buildBook(a3, { newId }).book.events.find(e => e.k === 'check').notYet, undefined);
});
t('setup asks only about bills landing after the last pay and on or before the setup day, each with its own day (QC F3)', () => {
  // set up Fri 20 Nov; the last pay landed Tue 10 Nov. Gym on the 10th landed with the pay: not asked. Water on the 5th:
  // before the pay, not asked. Club on the 15th (a Sunday, moved after): lands Mon 16 Nov, asked by that day. Phone on
  // the 20th, the setup day: asked. TV on the 21st: still to come, not asked. Rent on the 27th: 27 Oct, before the pay.
  const a = clone(ANSWERS);
  a.bills.push({ key: 'gym', name: 'Gym', from: 'bank', amount: 3000, day: 10, shift: 'after' }, { key: 'water', name: 'Water', from: 'bank', amount: 2000, day: 5, shift: 'after' },
    { key: 'club', name: 'Club', from: 'bank', amount: 1000, day: 15, shift: 'after' }, { key: 'tv', name: 'TV', from: 'bank', amount: 1500, day: 21, shift: 'after' });
  const b = B.buildBook(a, { newId });
  eq(b.asked, { phone: ['2026-11-20'], club: ['2026-11-16'] });
  // the same whatever the answers so far: it says which bills to ask about
  a.bills.forEach(x => { x.takenOut = false; });
  eq(B.buildBook(a, { newId }).asked, { phone: ['2026-11-20'], club: ['2026-11-16'] });
});
// [BL6, AB3, J5] a card with a known close day, set up between that close and its payment day: setup asks how much of what
// is on it was on the statement just closed; that part is due on the coming payment day, the rest on the next one.
// Made-up US dollars: set up Mon 23 Nov 2026, Visa $300.10 on it, closes on the 20th, paid on the 5th (the working day
// after a weekend), $250 on the statement closed 20 Nov. 5 Dec is a Saturday, so it comes out Mon 7 Dec; the other
// $50.10 is in the statement closing 20 Dec, out Tue 5 Jan 2027.
const usCard = (day, closeDay, more) => Object.assign({ day, told: day + 'T09:00-05:00', country: 'US', currency: 'USD',
  banks: [{ key: 'chk', name: 'Checking', amount: 123456 }],
  pays: [{ key: 'pay', name: 'Pay', bank: 'chk', amount: 250000, day: 1, shift: 'none', startsPeriod: true }],
  cards: [Object.assign({ key: 'visa', name: 'Visa', owed: 30010, payDay: 5, closeDay, payFrom: 'chk', shift: 'after' }, more || {})] });
t('a card set up between its close and its payment day: setup is told which statement to ask about [BL6]', () => {
  eq(B.buildBook(usCard('2026-11-23', 20), { newId }).askedStatements, { visa: { closed: '2026-11-20', payment: '2026-12-07' } });
  // not asked: close day not sure, set up on the close day, or after the payment day
  eq(B.buildBook(usCard('2026-11-23', 'not sure'), { newId }).askedStatements, {});
  eq(B.buildBook(usCard('2026-11-20', 20), { newId }).askedStatements, {});
  eq(B.buildBook(usCard('2026-12-08', 20), { newId }).askedStatements, {});
});
t('the statement figure is written as its own dated check: $250 out on 7 Dec, the rest on 5 Jan [BL6, J5]', () => {
  const r = B.buildBook(usCard('2026-11-23', 20, { statement: 25000 }), { newId });
  const visa = r.ids.visa, evs = r.book.events.filter(e => e.acct === visa);
  eq(evs.map(e => [e.k, e.a, e.stmt || false, e.stmtDate, e.paid]), [['open', 30010, false, undefined, undefined], ['check', 30010, false, undefined, undefined], ['check', 25000, true, '2026-11-20', false]]);
  ok(evs.every(e => e.grp === evs[0].grp), 'one setup group');
  const c = lookahead(r.book, '2026-11-23').cards[visa];
  eq([c.owedNow, c.next.amount, c.next.payment_date], [30010, 25000, '2026-12-07']);
  const c2 = lookahead(r.book, '2026-12-08').cards[visa];   // 7 Dec not ticked: overdue; the rest comes next
  eq([c2.overdue.map(o => [o.amount, o.payment_date]), c2.next.amount, c2.next.payment_date], [[[25000, '2026-12-07']], 5010, '2027-01-05']);
  // nothing on that statement (0): no payment on 7 Dec, all of it next time
  const z = B.buildBook(usCard('2026-11-23', 20, { statement: 0 }), { newId });
  const cz = lookahead(z.book, '2026-11-23').cards[z.ids.visa];
  eq([cz.next.amount, cz.next.payment_date], [30010, '2027-01-05']);
  // a statement figure for a card not in that gap is refused, not guessed
  assert.throws(() => B.buildBook(usCard('2026-12-08', 20, { statement: 25000 }), { newId }), /statement/);
});
// [north star F1, BJ2] setup asks what goes on food and everyday things each pay period: it is Free to spend, the first
// plan amount, from the setup day. Set up Thu 5 Nov 2026, bank 320,000, pay 250,000 on the 25th (the working day
// before a weekend), 40,000 a period. The 25 Oct pay landed Fri 23 Oct, the next lands Wed 25 Nov: the period is 23 Oct
// to 24 Nov, 33 days, and 5 to 24 Nov is 20 of them, so this period counts 40,000 x 20 / 33 = 24,242 (made-up yen).
const everyday = free => ({ day: '2026-11-05', told: '2026-11-05T10:00:00+09:00', country: 'JP', currency: 'JPY',
  banks: [{ key: 'bank', name: 'Main bank', amount: 320000 }],
  pays: [{ key: 'pay', name: 'Pay', bank: 'bank', amount: 250000, day: 25, shift: 'before', startsPeriod: true }], free });
t('the everyday amount from setup is Free to spend from the setup day; this period gets its share for the days left [BJ2]', () => {
  const r = B.buildBook(everyday(40000), { newId });
  eq(r.book.plan.shares.map(x => [x.from, x.free, x.per, x.cur]), [['2026-11-05', 40000, { free: 'pay' }, 'JPY']]);
  ok(r.book.plan.shares.every(x => I.isOrdinary(x.id) && x.told && x.at && x.by), 'an ordinary record');
  const la = lookahead(r.book, '2026-11-05');
  eq([la.period.start, la.period.end, la.period.free.amount, la.period.free.counts], ['2026-10-23', '2026-11-24', 40000, 24242]);
  eq(la.safeToSpend.headline, 24242);
  // left blank: no Free to spend, and the whole bank is the headline (Home asks for it instead of "Fine for now")
  const blank = B.buildBook(everyday(null), { newId });
  eq(blank.book.plan.shares, []);
  eq(lookahead(blank.book, '2026-11-05').safeToSpend.headline, 320000);
  assert.throws(() => B.buildBook(everyday(400.5), { newId }), /whole/);
});
done('build_book');
