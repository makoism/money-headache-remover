#!/usr/bin/env node
/* answers3, the ONE answers-to-book function (AI_FIRST_PLAN corrections BV1, BV2.8, BV2.10, BV2.13), in node.
   1. Mako's made-up shape (24 Nov 2026: Main bank 286,000; pay 240,000 on the 10th, the working day before; Card A
      54,000 paid on the 10th, Card B 23,000 on the 11th the day before; Rent, Power, Phone (already out), Internet):
      the hidden fields are filled (keys, day, told, currency, weekend rules, startsPeriod) and the book's look ahead
      gives safe to spend 201,400, next pay 10 Dec.
   2. Same answers, same book: the answers as setup3 collects them today (its answers3(true) for the same form, written
      out from setup3.js) and the chat's answers give the same saved records, field for field.
   3. Answers back into setup3's form and back again give the same answers.
   4. The questions for a day: bills due since the last pay, card statements between close and payment, a pay landing
      today; each answer sits on its item by key, with the days it answered, and a fill on another day with other
      days is refused (BV2.8). A "not sure" statement is all owed (BV2.10). A pay not landed yet is still to come. */
'use strict';
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const B = require(E + 'build_book.js'), L = require(E + 'lookahead.js'), I = require(E + 'ids.js');
const A = require('../src/answers3.js');
let bad = 0, n = 0;
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const DAY = '2026-11-24', TOLD = DAY + 'T10:00:00.000+09:00';

/* Mako's shape as the chat's draft holds it (what he said; nothing hidden) */
const mako = () => ({
  country: 'JP', currency: 'JPY',
  banks: [{ name: 'Main bank', amount: 286000, on: DAY }],
  pays: [{ name: 'Pay', amount: 240000, every: 'month', day: 10, shift: 'before' }],
  cards: [{ name: 'Card A', owed: 54000, on: DAY, payDay: 10, closeDay: 'not sure', shift: 'after' },
    { name: 'Card B', owed: 23000, on: DAY, payDay: 11, closeDay: 'not sure', shift: 'before' }],
  bills: [{ name: 'Rent', amount: 72000, day: 27 }, { name: 'Power', amount: 7400, day: 26 },
    { name: 'Phone', amount: 4800, day: 20, out: { out: true, days: ['2026-11-20'] } }, { name: 'Internet', amount: 5200, day: 27 }],
  free: null, min: null,
});
/* the same answers as setup3.js's answers3(true) returns them for the same form today (read from setup3.js: keys bank1,
   pay1, card1.., bill1..; the main bank's min; pay shift from its select; first fixed pay starts the period; bills
   'after'; takenOut only when "No, not yet") */
const setup3Today = () => ({
  day: DAY, told: TOLD, currency: 'JPY', country: 'JP',
  banks: [{ key: 'bank1', name: 'Main bank', amount: 286000, main: true, min: null }],
  pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 240000, shift: 'before', every: 'month', day: 10, startsPeriod: true }],
  cards: [{ key: 'card1', name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'after' },
    { key: 'card2', name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', payFrom: 'bank1', shift: 'before' }],
  bills: [{ key: 'bill1', name: 'Rent', from: 'bank1', amount: 72000, shift: 'after', day: 27 },
    { key: 'bill2', name: 'Power', from: 'bank1', amount: 7400, shift: 'after', day: 26 },
    { key: 'bill3', name: 'Phone', from: 'bank1', amount: 4800, shift: 'after', day: 20 },
    { key: 'bill4', name: 'Internet', from: 'bank1', amount: 5200, shift: 'after', day: 27 }],
  free: null,
});
const ids = seed => I.idMaker(seed || 'ans3te', () => 0.5);
const build = (input, seed) => B.buildBook(input, { newId: ids(seed) });

t('the hidden fields are filled: keys, day, told, currency from the country, weekend rules, startsPeriod', () => {
  const x = A.toBuild(mako(), { day: DAY, told: TOLD });
  eq(x.day, DAY); eq(x.told, TOLD); eq(x.currency, 'JPY'); eq(x.country, 'JP');
  eq(x.banks.map(b => [b.key, b.main]), [['bank1', true]]);
  eq(x.pays[0].startsPeriod, true); eq(x.pays[0].bank, 'bank1');
  eq(x.cards.map(c => [c.key, c.shift, c.payFrom]), [['card1', 'after', 'bank1'], ['card2', 'before', 'bank1']]);
  eq(x.bills.map(b => [b.key, b.shift, b.from]), [['bill1', 'after', 'bank1'], ['bill2', 'after', 'bank1'], ['bill3', 'after', 'bank1'], ['bill4', 'after', 'bank1']]);
});
t('weekend rules left out: pay the working day before, cards and bills the day after (BV1, BV2.10)', () => {
  const m = mako(); delete m.pays[0].shift; delete m.cards[0].shift; delete m.cards[1].shift;
  const x = A.toBuild(m, { day: DAY, told: TOLD });
  eq(x.pays[0].shift, 'before'); eq(x.cards.map(c => c.shift), ['after', 'after']);
});
t('Mako\'s book: safe to spend 201,400 on 24 Nov, next pay 10 Dec, Main bank 286,000, cards 54,000 and 23,000', () => {
  const r = A.build(mako(), { day: DAY, told: TOLD, newId: I.idMaker('ans3te') });
  const v = L.lookahead(r.book, DAY), bank = r.ids.bank1;
  eq(v.safeToSpend.headline, 201400, 'safe'); eq(v.daysToNextPay.next_pay, '2026-12-10'); eq(v.accounts[bank].bank, 286000);
  eq(v.dueBeforeNextPay.total, 84600, 'due before pay');
  eq(Object.values(v.cards).map(c => c.owedNow), [54000, 23000]);
});
t('same answers, same book: the chat\'s answers and setup3\'s give the same saved records', () => {
  const a = build(A.toBuild(mako(), { day: DAY, told: TOLD }), 'same01').book;
  const b = build(setup3Today(), 'same01').book;
  eq(a, b);
});
t('answers back into setup3\'s form and back again: the same answers and the same book', () => {
  const f = A.toForm(mako(), { day: DAY });
  eq(f.bankName, 'Main bank'); eq(f.bank, 286000); eq(f.cur, 'JPY'); eq(f.country, 'JP');
  eq([f.pay.every, f.pay.day, f.pay.shift, f.pay.amount], ['month', 10, 'before', 240000]);
  eq(f.cards.map(c => [c.name, c.owed, c.payDay, c.closeDay, c.shift, c.payFrom]), [['Card A', 54000, 10, 'not sure', 'after', 'bank1'], ['Card B', 23000, 11, 'not sure', 'before', 'bank1']]);
  eq(f.bills.map(b => [b.name, b.amount, b.every, b.day, b.from, b.takenOut]), [['Rent', 72000, 'month', 27, 'bank1', 'yes'], ['Power', 7400, 'month', 26, 'bank1', 'yes'], ['Phone', 4800, 'month', 20, 'bank1', 'yes'], ['Internet', 5200, 'month', 27, 'bank1', 'yes']]);
  eq(f.free, null); eq(f.min, null);
  const back = A.fromForm(f, { day: DAY });
  eq(build(A.toBuild(back, { day: DAY, told: TOLD }), 's2').book, build(A.toBuild(mako(), { day: DAY, told: TOLD }), 's2').book);
});
t('the form\'s other lives: two banks, a second income on its own days, every 2 weeks, no fixed pay, a yearly bill', () => {
  const m = { country: 'PH', banks: [{ name: 'BDO', amount: 50000, on: DAY }, { name: 'GCash', amount: 3000, type: 'ewallet', on: DAY }],
    pays: [{ name: 'Pay', amount: 20000, every: 'weeks', n: 2, start: '2026-11-20' }, { name: 'Gigs', amount: null, every: 'none', bank: 'GCash' }],
    cards: [], bills: [{ name: 'Insurance', amount: 12000, every: 'year', month: 3, day: 15, from: 'BDO' }], free: 8000, min: 5000 };
  const f = A.toForm(m, { day: DAY });
  eq([f.pay.every, f.pay.start], ['weeks2', '2026-11-20']); eq([f.pays[0].every, f.pays[0].acct], ['none', 'acct2']);
  eq(f.accts, [{ name: 'GCash', amount: 3000, type: 'ewallet' }]); eq([f.bills[0].every, f.bills[0].month, f.bills[0].day], ['year', '03', 15]);
  const x = A.toBuild(A.fromForm(f, { day: DAY }), { day: DAY, told: TOLD });
  eq(x.currency, 'PHP');
  eq(x.pays, [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 20000, shift: 'before', every: 'weeks', n: 2, start: '2026-11-20', startsPeriod: true },
    { key: 'pay2', name: 'Gigs', bank: 'acct2', shift: 'none', every: 'none' }]);
  eq(x.bills[0], { key: 'bill1', name: 'Insurance', from: 'bank1', amount: 12000, shift: 'after', every: 'year', date: '03-15' });
  eq(x.banks[0].min, 5000); eq(x.free, 8000);
  build(x);
});
t('the questions for a day: Phone due 20 Nov since the pay of 10 Nov; nothing else', () => {
  const q = A.questions(mako(), { day: DAY });
  eq(q.asked, { [A.keyOf('bills', 'Phone')]: ['2026-11-20'] }); eq(q.statements, {}); eq(q.payToday, false);
});
t('answers sit on their item by key: a fill is refused while one is missing or answered for other days (BV4, BV2.8)', () => {
  const m = mako(); delete m.bills[2].out;
  eq(A.need(m, { day: DAY }), ['Has Phone, due 20 Nov, come out of Main bank already?']);
  m.bills[2].out = { out: false, days: ['2026-10-20'] };
  eq(A.need(m, { day: DAY }), ['Has Phone, due 20 Nov, come out of Main bank already?']);
  m.bills[2].out = { out: false, days: ['2026-11-20'] };
  eq(A.need(m, { day: DAY }), []);
  /* the bills reordered: the answer stays with Phone */
  m.bills.reverse();
  eq(A.need(m, { day: DAY }), []);
  const r = A.build(m, { day: DAY, told: TOLD, newId: I.idMaker('ans3te') });
  eq(L.lookahead(r.book, DAY).safeToSpend.headline, 201400 - 4800, 'Phone still to come is taken off');
});
t('figures given on another day are asked again on the fill day (BV3)', () => {
  const m = mako();
  eq(A.need(m, { day: '2026-11-26' }).slice(0, 3), ['What does Main bank show today?', 'What is on Card A today?', 'What is on Card B today?']);
});
t('a card set up between its close and its payment: its statement asked, "not sure" is all owed (BV2.10)', () => {
  const m = mako(); m.cards[0].closeDay = 15;   // closed 15 Nov, paid 10 Dec
  const q = A.questions(m, { day: DAY });
  eq(q.statements, { [A.keyOf('cards', 'Card A')]: { closed: '2026-11-15', payment: '2026-12-10' } });
  eq(A.need(m, { day: DAY }), ['How much of Card A was on the statement that closed on 15 Nov?']);
  m.cards[0].statement = { a: 'not sure', closed: '2026-11-15' };
  eq(A.need(m, { day: DAY }), []);
  eq(A.toBuild(m, { day: DAY, told: TOLD }).cards[0].statement, 54000);
  m.cards[0].statement = { a: 30000, closed: '2026-11-15' };
  eq(A.toBuild(m, { day: DAY, told: TOLD }).cards[0].statement, 30000);
  m.cards[0].statement = { a: 30000, closed: '2026-10-15' };
  eq(A.need(m, { day: DAY }), ['How much of Card A was on the statement that closed on 15 Nov?']);
});
t('a bank figure given on a day a pay lands: "has today\'s pay already landed in that figure?" (BV2.13)', () => {
  const m = mako(); m.pays[0].day = 25; m.banks[0].on = '2026-11-25'; m.cards.forEach(c => { c.on = '2026-11-25'; });
  const q = A.questions(m, { day: '2026-11-25' });
  eq(q.payToday, true);
  eq(A.need(m, { day: '2026-11-25' }).filter(x => /pay/.test(x)), ["Has today's pay already landed in Main bank's figure?"]);
  m.banks[0].payToday = { landed: true, day: '2026-11-25' };
  const yes = L.lookahead(A.build(m, { day: '2026-11-25', told: '2026-11-25T10:00:00.000+09:00', newId: I.idMaker('ans3te') }).book, '2026-11-25');
  m.banks[0].payToday = { landed: false, day: '2026-11-25' };
  const no = L.lookahead(A.build(m, { day: '2026-11-25', told: '2026-11-25T10:00:00.000+09:00', newId: I.idMaker('ans3te') }).book, '2026-11-25');
  eq(no.daysToNextPay.next_pay, '2026-11-25', 'not landed yet: the next pay is today\'s');
  eq(yes.daysToNextPay.next_pay, '2026-12-25', 'landed: inside the figure, the next pay is the one after');
});
t('wrong answers are refused with words, never guessed', () => {
  const m = mako(); m.pays[0].bank = 'Nope bank';
  let msg = ''; try { A.toBuild(m, { day: DAY, told: TOLD }); } catch (e) { msg = e.message; }
  eq(msg, 'Pay lands in Nope bank, which is not one of your accounts');
});
t('fromForm: a blank day of one pay is refused, never turned into today; the pay-today answer goes on every bank a pay lands in today (qc-foundation WATCH)', () => {
  const f = A.toForm({ country: 'JP', banks: [{ name: 'Main bank', amount: 100000, on: DAY }, { name: 'Second', amount: 5000, on: DAY }],
    pays: [{ name: 'Pay', amount: 20000, every: 'weeks', n: 2, start: '2026-11-20' }], cards: [], bills: [], free: null, min: null }, { day: DAY });
  f.pay.start = null;
  let msg = ''; try { A.fromForm(f, { day: DAY }); } catch (e) { msg = e.message; }
  eq(msg, 'Type the day of one pay, the last one or the next one');
  f.pays = [{ name: 'Side', amount: 9000, every: 'weeks1', start: '', acct: 'acct2' }]; f.pay.start = '2026-11-20';
  msg = ''; try { A.fromForm(f, { day: DAY }); } catch (e) { msg = e.message; }
  eq(msg, 'Type the day of one pay, the last one or the next one');
  /* both banks get a pay on 24 Nov: the answer sits on each */
  const g = A.toForm({ country: 'JP', banks: [{ name: 'Main bank', amount: 100000, on: DAY }, { name: 'Second', amount: 5000, on: DAY }],
    pays: [{ name: 'Pay', amount: 20000, every: 'month', day: 24 }, { name: 'Side', amount: 9000, every: 'month', day: 24, bank: 'Second' }], cards: [], bills: [], free: null, min: null }, { day: DAY });
  g.payToday = 'no';
  const back = A.fromForm(g, { day: DAY });
  eq(back.banks.map(b => b.payToday), [{ landed: false, day: DAY }, { landed: false, day: DAY }]);
  eq(A.need(back, { day: DAY }), []);
});
/* [AI_JOIN_FIXES F] "Set up on the screens" never carries an old figure as today's (qc-foundation 7; M36, M37) */
t('toForm on a later day: a bank, account or card figure not from today leaves its box empty; the rest is kept (AI_JOIN_FIXES F)', () => {
  const m = mako(); m.banks.push({ name: 'GCash', amount: 3000, type: 'ewallet', on: '2026-11-23' });
  m.banks[0].on = '2026-11-23'; m.cards[0].on = '2026-11-23';
  m.banks[0].payToday = { landed: true, day: '2026-11-23' };
  const f = A.toForm(m, { day: DAY });
  eq([f.bankName, f.bank], ['Main bank', null], 'main bank');
  eq(f.accts, [{ name: 'GCash', amount: null, type: 'ewallet' }], 'second account');
  eq(f.cards.map(c => [c.name, c.owed, c.payDay]), [['Card A', null, 10], ['Card B', 23000, 11]], 'cards');
  eq(f.payToday, null, 'the pay-today answer was for another day');
  eq([f.pay.amount, f.bills.length], [240000, 4], 'pay and bills kept');
  /* and fromForm never stamps an empty box with today: the answers still ask for it */
  const back = A.fromForm(f, { day: DAY });
  ok(A.need(back, { day: DAY }).includes('What does Main bank show today?'), JSON.stringify(A.need(back, { day: DAY })));
  ok(A.need(back, { day: DAY }).includes('What is on Card A today?'));
  /* the same draft on its own day: every figure in its box */
  const g = A.toForm(mako(), { day: DAY });
  eq([g.bank, g.cards[0].owed], [286000, 54000]);
});
console.log(bad ? `answers3: ${bad} of ${n} FAILED` : `answers3: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
