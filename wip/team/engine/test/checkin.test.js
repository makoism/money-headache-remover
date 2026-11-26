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
// [LISTED_PLAN, 26 Nov] A check-in remembers what it listed (`listed: [occ]`). A later tick is dated after a check only
// when that check's check-in listed the item (rule 2); a card payment reads the checks of the card and its paying bank
// (2b); after a check that did not list it, the day is asked (2c, N3: `afterFigure`, "I don't know" = after); a check
// with no check-in record, or a check-in with no `listed`, bounds everything as before (2d). Mako's 30 Nov moment with
// made-up yen: Main 286,000 known, Rent 72,000 really left 27 Nov, 10,000 spent unlogged, "my bank shows 204,000".
{
  const BB = require('../build_book.js'), P = require('../periods.js');
  const TZ = '+09:00';
  const mk = (cardOwed, setupDay, bills) => {
    const nid = I.idMaker('q7k2zx');
    const S = { newId: nid, book: BB.buildBook({ day: setupDay || '2026-11-11', told: (setupDay || '2026-11-11') + 'T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
      banks: [{ key: 'b', name: 'Main', amount: 286000, main: true, min: null }],
      pays: [{ key: 'p', name: 'Pay', bank: 'b', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
      cards: [{ key: 'c', name: 'Card A', owed: cardOwed || 0, payDay: 10, closeDay: 'not sure', payFrom: 'b', shift: 'none', inFull: true }],
      bills: bills || [{ key: 'r', name: 'Rent', from: 'b', amount: 72000, day: 27, shift: 'none' }], free: 60000 }, { newId: nid }).book };
    S.bank = S.book.accounts.find(x => x.type !== 'card').id; S.card = S.book.accounts.find(x => x.type === 'card').id;
    return S;
  };
  // one check-in as the screen or the assistant writes it, from the list the look ahead gives that day
  const ci = (S, day, hhmm, o) => {
    const li = L.lookahead(S.book, day).checkIn.toConfirm;
    const out = W.checkIn(S.book, Object.assign({ day, told: day + 'T' + hhmm + ':00.000' + TZ, newId: S.newId, figures: {}, ticked: [], amounts: {},
      expected: Object.fromEntries(li.map(x => [x.item, x.amount])), lands: Object.fromEntries(li.map(x => [x.item, x.lands])) }, o));
    S.book = W.apply(S.book, out);
    return out;
  };
  const rentOf = (S, day) => L.lookahead(S.book, day).checkIn.toConfirm.find(x => x.amount === 72000).item;
  const dateOf = (out, occ) => out.events.find(e => e.id === 'set:' + occ).date;
  const view = (S, day) => { const r = L.lookahead(S.book, day), p = P.periods(S.book, day).current;
    return { main: r.accounts[S.bank].bank, freeSpent: p.free.spent, freeLeft: p.free.left }; };

  t('[listed] the check-in record saves what it listed', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    const out = ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 204000 }, listed: [rent] });
    eq(out.checkins[0].listed, [rent]);
    const o2 = W.checkIn(S.book, { day: '2026-11-30', told: '2026-11-30T13:00:00.000' + TZ, newId: S.newId, figures: {} });
    eq('listed' in o2.checkins[0], false);   // not given: not written (an old-style record)
  });
  t('[listed, a] figure with nothing listed, Rent ticked next day with its bank-app day 27 Nov: inside the figure', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 204000 }, listed: [] });
    eq(view(S, '2026-11-30'), { main: 204000, freeSpent: 82000, freeLeft: -24000 });   // before the answer: the whole gap
    eq(W.landedFrom(S.book, { day: '2026-12-01' }, rent), '2026-11-12');   // only the opening bounds it now
    const o = ci(S, '2026-12-01', '09:00', { ticked: [rent], landed: { [rent]: '2026-11-27' } });
    eq(dateOf(o, rent), '2026-11-27');
    eq(view(S, '2026-12-01'), { main: 204000, freeSpent: 10000, freeLeft: 48000 });
  });
  t('[listed, F2] after an unlisted figure a tick with no day and no answer is refused; it names the figure day', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 276000 }, listed: [] });
    eq(W.askAfter(S.book, { day: '2026-12-01', lands: { [rent]: '2026-11-27' } }, rent), '2026-11-30');
    assert.throws(() => ci(S, '2026-12-01', '20:00', { ticked: [rent] }), /before or after/);
  });
  t('[listed, F2/N3] afterFigure true (also "I don\'t know"): the day after the figure; Main 204,000, Free to spend 48,000 left', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 276000 }, listed: [] });
    const o = ci(S, '2026-12-01', '20:00', { ticked: [rent], afterFigure: { [rent]: true } });
    eq(dateOf(o, rent), '2026-12-01');
    eq(view(S, '2026-12-01'), { main: 204000, freeSpent: 10000, freeLeft: 48000 });
  });
  t('[listed, F2] afterFigure false: its landing day, inside the figure', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 204000 }, listed: [] });
    const o = ci(S, '2026-12-01', '20:00', { ticked: [rent], afterFigure: { [rent]: false } });
    eq(dateOf(o, rent), '2026-11-27');
    eq(view(S, '2026-12-01'), { main: 204000, freeSpent: 10000, freeLeft: 48000 });
  });
  t('[listed, N3] a typed day after the unlisted figure lands after it; on its day, inside it', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 276000 }, listed: [] });
    eq(dateOf(W.checkIn(S.book, { day: '2026-12-01', told: '2026-12-01T20:00:00.000' + TZ, newId: S.newId, ticked: [rent], expected: { [rent]: 72000 }, landed: { [rent]: '2026-12-01' } }), rent), '2026-12-01');
    const o = W.checkIn(S.book, { day: '2026-12-01', told: '2026-12-01T20:00:00.000' + TZ, newId: S.newId, ticked: [rent], expected: { [rent]: 72000 }, landed: { [rent]: '2026-11-30' } });
    eq(o.events[0].dayInside, true);
  });
  t('[listed] the same check-in as the figure: Rent ticked with it is dated 27 Nov, Main 204,000, 48,000 left', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    const o = ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 204000 }, ticked: [rent], listed: [rent] });
    eq(dateOf(o, rent), '2026-11-27');
    eq(view(S, '2026-11-30'), { main: 204000, freeSpent: 10000, freeLeft: 48000 });
  });
  t('[listed, b] a figure that listed Rent unticked still bounds it: the tick is dated the day after (BI1)', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 276000 }, listed: [rent] });
    eq(W.askAfter(S.book, { day: '2026-12-01', lands: { [rent]: '2026-11-27' } }, rent), null);
    eq(dateOf(ci(S, '2026-12-01', '20:00', { ticked: [rent] }), rent), '2026-12-01');
  });
  t('[listed, N2] "Not yet" said after the figure (a check-in answering it, listing Rent) bounds it too', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    const f = ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 276000 }, listed: [] });
    ci(S, '2026-11-30', '12:01', { listed: [rent], answers: f.checkins[0].id });
    eq(dateOf(ci(S, '2026-12-01', '20:00', { ticked: [rent] }), rent), '2026-12-01');
  });
  t('[listed, c] an old check-in with no `listed` keeps the old rule', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 204000 } });
    eq(W.askAfter(S.book, { day: '2026-12-01' }, rent), null);
    eq(dateOf(ci(S, '2026-12-01', '09:00', { ticked: [rent] }), rent), '2026-12-01');
  });
  t('[listed, F1/2b] a card figure that listed its payment unticked bounds the payment: 14 Dec tick dated 13 Dec', () => {
    const S = mk(31000), L12 = L.lookahead(S.book, '2026-12-12').checkIn.toConfirm;
    const pay = L12.find(x => x.amount === 300000).item, cp = L12.find(x => x.amount === 31000).item;
    ci(S, '2026-12-11', '09:00', { ticked: [pay] });
    ci(S, '2026-12-12', '12:00', { figures: { [S.card]: 31000 }, listed: [cp] });
    eq(W.landedFrom(S.book, { day: '2026-12-14' }, cp), '2026-12-13');
    const o = ci(S, '2026-12-14', '09:00', { ticked: [cp] });
    eq(dateOf(o, cp), '2026-12-13');
    const r = L.lookahead(S.book, '2026-12-14');
    eq([r.cards[S.card].owedNow, r.accounts[S.bank].bank], [0, 555000]);
    eq(P.periods(S.book, '2026-12-14').current.free.left, 60000);
  });
  t('[listed, 2b/2c] a card figure that did not list its payment asks before or after', () => {
    const S = mk(31000), L12 = L.lookahead(S.book, '2026-12-12').checkIn.toConfirm;
    const cp = L12.find(x => x.amount === 31000).item;
    ci(S, '2026-12-12', '12:00', { figures: { [S.card]: 31000 }, listed: [] });
    eq(W.askAfter(S.book, { day: '2026-12-14', lands: { [cp]: '2026-12-10' } }, cp), '2026-12-12');
    assert.throws(() => ci(S, '2026-12-14', '09:00', { ticked: [cp] }), /before or after/);
    eq(dateOf(ci(S, '2026-12-14', '09:00', { ticked: [cp], afterFigure: { [cp]: true } }), cp), '2026-12-13');
  });
  t('[listed, 2d/C1] a "not yet" bill at setup ticked later lands after the opening check, as today', () => {
    const S = mk(0, '2026-11-28', [{ key: 'r', name: 'Rent', from: 'b', amount: 72000, day: 27, shift: 'none', takenOut: false }]);
    const rent = rentOf(S, '2026-11-30');
    eq(W.askAfter(S.book, { day: '2026-11-30', lands: { [rent]: '2026-11-27' } }, rent), null);
    eq(dateOf(ci(S, '2026-11-30', '09:00', { ticked: [rent] }), rent), '2026-11-29');
  });
  t('[listed, 2d] a check with no check-in record (Plan, a move, an import) bounds everything', () => {
    for (const extra of [{ id: 'q7k2zx-zz' }, { id: 'mv:check:cfg.bank' }, { id: 'imp:x:ref:owed-2026-11-29', grp: 'stmt:x:2026-11-29' }]) {
      const S = mk(), rent = rentOf(S, '2026-11-30');
      S.book.events.push(Object.assign({ k: 'check', acct: S.bank, date: '2026-11-29', a: 204000, told: '2026-11-29T10:00:00.000' + TZ }, extra));
      eq(W.askAfter(S.book, { day: '2026-11-30', lands: { [rent]: '2026-11-27' } }, rent), null);
      eq(dateOf(ci(S, '2026-11-30', '09:00', { ticked: [rent] }), rent), '2026-11-30');
    }
  });
  t('[listed, d] nine record orders give the same days', () => {
    const S = mk(), rent = rentOf(S, '2026-11-30');
    ci(S, '2026-11-30', '12:00', { figures: { [S.bank]: 276000 }, listed: [] });
    const f2 = ci(S, '2026-11-30', '12:05', { figures: { [S.bank]: 276000 }, listed: [rent] });
    const base = S.book, want = [];
    const run = b => [W.landedFrom(b, { day: '2026-12-01' }, rent), W.askAfter(b, { day: '2026-12-01', lands: { [rent]: '2026-11-27' } }, rent),
      W.checkIn(b, { day: '2026-12-01', told: '2026-12-01T20:00:00.000' + TZ, newId: S.newId, ticked: [rent], expected: { [rent]: 72000 }, lands: { [rent]: '2026-11-27' } }).events[0].date];
    want.push(...run(base));
    eq(want, ['2026-12-01', null, '2026-12-01']);
    const orders = [x => x, x => x.slice().reverse(), x => x.slice().sort((a, b) => String(a.id).localeCompare(String(b.id))),
      x => x.slice().sort((a, b) => String(b.id).localeCompare(String(a.id))), x => x.slice(1).concat(x.slice(0, 1)), x => x.slice(-1).concat(x.slice(0, -1)),
      x => x.filter((_, i) => i % 2).concat(x.filter((_, i) => !(i % 2))), x => x.filter((_, i) => !(i % 2)).concat(x.filter((_, i) => i % 2)).reverse(),
      x => x.slice().sort((a, b) => String(a.told).localeCompare(String(b.told)))];
    eq(orders.length, 9);
    for (const o of orders) eq(run(Object.assign({}, base, { events: o(base.events), checkins: o(base.checkins) })), want);
    eq(f2.checkins[0].listed, [rent]);
  });
}
done('checkin');
