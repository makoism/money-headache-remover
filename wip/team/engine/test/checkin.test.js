'use strict';
// The check-in writer (engine/checkin.js; SCHEMA_V3 7.1 to 7.3, A2, AS5, AS6, AP6, O2), on Mako's shape with made-up yen.
// Taken over from app3/src/checkin_write.js and its tests (WIRING_PLAN step 8). Mako on 10 Dec ticks both pays and
// card A and types the bank; the look ahead then shows the new bank figure as of 10 Dec, card B still due on the 11th,
// and no ticked item left on the check-in list.
const { t, done, eq, ok } = require('./t.js');
const assert = require('assert');
const L = require('../lookahead.js'), G = require('../ledger.js'), I = require('../ids.js');
const W = require('../checkin.js');
const { scenarioBook } = require('./mako_madeup.js');

const book0 = scenarioBook();
const clone = x => JSON.parse(JSON.stringify(x));
const bank = 'bank', cardA = 'card_a', cardB = 'card_b', payMain = 'pay_main', paySide = 'pay_side';
const newId = I.idMaker('q4zt8m', () => 0.5);

const DAY = '2026-12-10';
const before = L.lookahead(book0, DAY);
const list = before.checkIn.toConfirm;
const known = { expected: Object.fromEntries(list.map(o => [o.item, o.amount])), lands: Object.fromEntries(list.map(o => [o.item, o.lands])) };
const pick = list.filter(o => [payMain, paySide, cardA].includes(I.scheduleOf(o.item)));
const rest = list.filter(o => !pick.includes(o));

t('the 10 Dec list has both pays and card A', () => eq(pick.length, 3));
const book = clone(book0);
const out = W.checkIn(book, Object.assign({}, known, { day: DAY, told: DAY + 'T19:30+09:00', newId,
  figures: { [bank]: 341000 }, ticked: pick.map(o => o.item), amounts: {} }));
t('it writes one check-in record, one check and three settles', () => {
  eq(out.checkins.length, 1);
  eq(out.events.filter(e => e.k === 'check').length, 1);
  eq(out.events.filter(e => e.k !== 'check').map(e => e.id).sort(), pick.map(o => 'set:' + o.item).sort());
});
t('a pay is written as income with its stream, card A as a repay from the bank', () => {
  const p = out.events.find(e => e.id === 'set:' + payMain + '@2026-12-10');
  eq([p.k, p.sub, p.stream, p.a], ['in', 'pay', payMain, 180000]);
  const c = out.events.find(e => e.id === 'set:' + cardA + '@2026-12-10');
  eq([c.k, c.acct, c.acct2, c.a, c.a2], ['repay', bank, cardA, 54000, 54000]);
});
t('every record carries the check-in as grp, and the check-in lists what it settled and its figures', () => {
  const id = out.checkins[0].id;
  for (const e of out.events) eq(e.grp, id);
  eq(out.checkins[0].settled.slice().sort(), pick.map(o => 'set:' + o.item).sort());
  eq(out.checkins[0].figures.map(f => f.acct), [bank]);
});
t('the writer does not change the book it is given', () => assert.deepStrictEqual(book, book0));
const after = W.apply(book, out);
const res = L.lookahead(after, DAY);
t('the bank shows the typed figure, as of 10 Dec', () => eq([res.accounts[bank].bank, res.accounts[bank].asOf], [341000, DAY]));
t('nothing ticked is left on the check-in list', () => ok(!res.checkIn.toConfirm.some(o => pick.some(p => p.item === o.item))));
t('card B is still due on the 11th, card A is paid', () => {
  eq(res.cards[cardB].next.payment_date, '2026-12-11');
  eq(res.cards[cardA].owedNow, 0);
});
t('the next pay is in January', () => ok(res.daysToNextPay.next_pay > '2027-01-01'));
t('the period now runs from the pay ticked today', () => eq(res.period.start, DAY));
t('the ledger still adds up', () => ok(G.proof(after).ok));
t('a changed amount is written as typed', () => {
  const o2 = W.checkIn(clone(book0), Object.assign({}, known, { day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 341000 }, ticked: [pick[0].item], amounts: { [pick[0].item]: 175000 } }));
  eq(o2.events.find(e => e.id === 'set:' + pick[0].item).a, 175000);
});
t('an amount that is not whole minor units is refused', () => assert.throws(() => W.checkIn(clone(book0), Object.assign({}, known, { day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 12.5 }, ticked: [], amounts: {} }))));
t('a ticked item with no amount known is refused', () => assert.throws(() => W.checkIn(clone(book0), { day: DAY, told: DAY + 'T19:30+09:00', newId, ticked: [pick[0].item] })));
t('the weekend where card B leaves before pay lands: Fri 8 Jan, pay Tue 12 Jan', () => {
  const li = L.lookahead(book0, '2026-12-11').checkIn.toConfirm;
  const paid = W.apply(book0, W.checkIn(book0, { day: '2026-12-11', told: '2026-12-11T20:00+09:00', newId, figures: { [bank]: 300000 }, ticked: li.map(o => o.item), amounts: {},
    expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) }));
  const jan = L.lookahead(paid, '2027-01-07');
  eq(jan.cards[cardB].next.payment_date, '2027-01-08');
  eq(jan.daysToNextPay.next_pay, '2027-01-12');
});
// [AS6, T2] the filler's place is saved on the check-in, per account; [AP6] its stretch start; [A4] the split answer
t("the filler's place is saved on the check-in for that account, and the look ahead reads it", () => {
  const o3 = W.checkIn(clone(book0), Object.assign({}, known, { day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 341000 },
    ticked: [], amounts: {}, fillerPlace: { [bank]: 'free' }, from: '2026-11-21', split: 'before' }));
  eq([o3.checkins[0].fillerPlace, o3.checkins[0].from, o3.checkins[0].split], [{ [bank]: 'free' }, '2026-11-21', 'before']);
  const o4 = W.checkIn(clone(book0), { day: DAY, told: DAY + 'T19:30+09:00', newId, figures: {}, fillerPlace: { [cardA]: 'free' } });
  eq(o4.checkins[0].fillerPlace, undefined);   // only an account with a figure in this check-in has a filler
});
t('an imported line unticked on the list is saved in `unticked` [U2, AS5]', () => {
  const o5 = W.checkIn(clone(book0), { day: DAY, told: DAY + 'T19:30+09:00', newId, unticked: ['imp:bank:x1'] });
  eq(o5.checkins[0].unticked, ['imp:bank:x1']);
  eq(o5.events.length, 0);
});
// [BI1] an item left unticked at one check-in and ticked at a later one is dated after the earlier check, never on its
// due day before it: by default the day after that check; a `landed` answer on or before it is refused
t('an item ticked after being left at an earlier check-in is dated the day after that check [BI1]', () => {
  const b1 = W.apply(book0, W.checkIn(book0, Object.assign({}, known, { day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 286000 }, ticked: [] })));
  const occ = payMain + '@2026-12-10';
  const li = L.lookahead(b1, '2026-12-14').checkIn.toConfirm;
  ok(li.some(o => o.item === occ));
  const exp = Object.fromEntries(li.map(o => [o.item, o.amount])), lands = Object.fromEntries(li.map(o => [o.item, o.lands]));
  const o1 = W.checkIn(b1, { day: '2026-12-14', told: '2026-12-14T19:30+09:00', newId, figures: { [bank]: 466000 }, ticked: [occ], expected: exp, lands });
  eq(o1.events.find(e => e.id === 'set:' + occ).date, '2026-12-11');
  const o2 = W.checkIn(b1, { day: '2026-12-14', told: '2026-12-14T19:30+09:00', newId, ticked: [occ], expected: exp, lands, landed: { [occ]: '2026-12-13' } });
  eq(o2.events.find(e => e.id === 'set:' + occ).date, '2026-12-13');
  assert.throws(() => W.checkIn(b1, { day: '2026-12-14', told: '2026-12-14T19:30+09:00', newId, ticked: [occ], expected: exp, lands, landed: { [occ]: '2026-12-10' } }));
  assert.throws(() => W.checkIn(b1, { day: '2026-12-14', told: '2026-12-14T19:30+09:00', newId, ticked: [occ], expected: exp, lands, landed: { [occ]: '2026-12-15' } }));
  // the later check's figure holds the pay: no gap is asked about
  const r = L.lookahead(W.apply(b1, o1), '2026-12-14');
  ok(!r.warnings.some(w => w.code === 'gain_to_ask'));
  eq(r.accounts[bank].bank, 466000);
  eq(W.landedFrom(b1, { day: '2026-12-14' }, occ), '2026-12-11');
});
// The store hands events back sorted by id, not in the order they were written. Records written by one check-in share
// its `told`, and its figure was read after the ticked items went through: they are inside it whatever the list order,
// so a reload never counts a ticked pay twice (also for an item dated before the check-in day, BI1).
t('a check-in counts its ticked pay once whatever order its records come back in', () => {
  const o = W.checkIn(clone(book0), Object.assign({}, known, { day: DAY, told: DAY + 'T19:30:00.000+09:00', newId,
    figures: { [bank]: 341000 }, ticked: pick.map(x => x.item), amounts: {} }));
  const back = clone(o); back.events.reverse();
  eq(back.events[0].k, 'check');
  for (const d of [DAY, '2026-12-11']) eq(L.lookahead(W.apply(book0, back), d).accounts[bank].bank, L.lookahead(W.apply(book0, o), d).accounts[bank].bank);
  eq(L.lookahead(W.apply(book0, back), DAY).accounts[bank].bank, 341000);
  const b1 = W.apply(book0, W.checkIn(book0, Object.assign({}, known, { day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 286000 }, ticked: [] })));
  const occ = payMain + '@2026-12-10';
  const li = L.lookahead(b1, '2026-12-14').checkIn.toConfirm;
  const late = W.checkIn(b1, { day: '2026-12-14', told: '2026-12-14T19:30:00.000+09:00', newId, figures: { [bank]: 466000 }, ticked: [occ],
    expected: Object.fromEntries(li.map(x => [x.item, x.amount])), lands: Object.fromEntries(li.map(x => [x.item, x.lands])) });
  late.events.reverse();
  eq(late.events[0].k, 'check');
  const r = L.lookahead(W.apply(b1, late), '2026-12-14');
  eq(r.accounts[bank].bank, 466000);
  ok(!r.warnings.some(w => w.code === 'gain_to_ask'));
  // a statement line read later that replaces the ticked pay takes its moment too, so it stays inside the check
  const pay = o.events.find(e => e.id === 'set:' + payMain + '@' + DAY);
  const withLine = W.apply(book0, back);
  withLine.events.push({ id: 'imp:' + bank + ':zz1', k: 'in', acct: bank, date: DAY, a: pay.a, told: '2026-12-15T09:00:00.000+09:00', src: { type: 'statement', acct: bank } });
  eq(L.lookahead(withLine, '2026-12-15').accounts[bank].bank, L.lookahead(W.apply(book0, back), '2026-12-15').accounts[bank].bank);
});
// [coordinator, slice 10; loancheck_build CONFUSING 4] the one far rule every door asks by: more than double, less than
// half, or off by more than the usual pay; the usual pay is the largest pay amount in force that day
t('farFigure and usualPay: a loan typed 5,617,000 over 561,700 is far; 540,000 is not', () => {
  eq(W.farFigure(561700, 5617000, 300000), { dir: 'more', by: 5055300 });
  eq(W.farFigure(561700, 999999999, 0), { dir: 'more', by: 999438299 });
  eq(W.farFigure(561700, 540000, 300000), null);
  eq(W.farFigure(561700, 561700, 300000), null);
  eq(W.farFigure(561700, 200000, 0), { dir: 'less', by: 361700 });
  eq(W.usualPay({ schedules: [{ id: 'p', kind: 'income', steps: [{ amount: 280000 }, { amount: 300000, from: '2027-01-01' }] }] }, '2026-12-10'), 280000);
  eq(W.usualPay({ schedules: [] }, '2026-12-10'), 0);
});
done('checkin');
