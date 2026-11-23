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
done('build_book');
