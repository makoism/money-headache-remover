'use strict';
// Mako's made-up shape walked through check-ins, as the real page does (the reviewer's walk1 to walk6). Pay on the 10th
// moved earlier, so January's lands Fri 8 Jan; card A on the 10th moved later, card B on the 11th moved earlier.
const { t, done, eq, ok } = require('./t.js');
const L = require('../lookahead.js'), W = require('../checkin.js'), B = require('../build_book.js'), I = require('../ids.js');
const { ANSWERS } = require('./mako_madeup.js');

function life() {
  const newId = I.idMaker('q4zt8m', () => 0.25);
  const a = JSON.parse(JSON.stringify(ANSWERS));
  a.pays.forEach(p => { p.shift = 'before'; });
  const { book, ids } = B.buildBook(a, { newId });
  const w = { book, ids };
  const of = key => o => o.item.startsWith(ids[key] + '@');
  // a check-in on `day`: everything on the list ticked except the keys in `leave`; `lands` changes a landing day
  w.ci = (day, leave, lands) => {
    const li = L.lookahead(w.book, day).checkIn.toConfirm;
    const tick = li.filter(o => !(leave || []).some(k => of(k)(o)));
    const ticked = W.apply(w.book, W.checkIn(w.book, { day, told: day + 'T20:00+09:00', newId, ticked: tick.map(o => o.item), figures: {},
      expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.assign(Object.fromEntries(li.map(o => [o.item, o.lands])), lands || {}) }));
    // the bank figure typed is what the app then has (no gap), so the check-in moves the bank's "as of" day
    w.book = W.apply(ticked, W.checkIn(ticked, { day, told: day + 'T20:01+09:00', newId, figures: { [ids.bank]: L.lookahead(ticked, day).accounts[ids.bank].bank } }));
    return li;
  };
  w.on = day => L.lookahead(w.book, day);
  w.of = of;
  return w;
}

t('an item left unticked at a check-in stays on the list until it is settled: card A unticked on 10 Dec, on 14 Dec', () => {
  const w = life();
  w.ci('2026-12-10', ['card_a']);
  ok(w.on('2026-12-14').checkIn.toConfirm.some(w.of('card_a')));
  // ticked on 14 Dec, as posted on 11 Dec: it is gone from the list
  w.ci('2026-12-14', [], { [w.ids.card_a + '@2026-12-10']: '2026-12-11' });
  ok(!w.on('2026-12-15').checkIn.toConfirm.some(w.of('card_a')));
});
t('a late pay unticked at two check-ins stays on the list, and ticking it starts its period on the day it landed', () => {
  const w = life();
  w.ci('2026-12-10'); w.ci('2026-12-11'); w.ci('2026-12-28');
  w.ci('2027-01-08', ['pay_main']);
  w.ci('2027-01-11', ['pay_main']);
  const occ = w.ids.pay_main + '@2027-01-10';
  ok(w.on('2027-01-15').checkIn.toConfirm.some(o => o.item === occ));
  w.ci('2027-01-15', [], { [occ]: '2027-01-13' });
  const r = w.on('2027-01-15');
  ok(!r.checkIn.toConfirm.some(o => o.item === occ));
  eq([r.period.start, r.period.startsWith], ['2027-01-13', occ]);
});
t('on pay day before the check-in, due before next pay is what the sum takes off before the pay after it [G4, AU4]', () => {
  const w = life();
  const r = w.on('2026-12-10');
  const bank = r.accounts[w.ids.bank];
  eq(r.dueBeforeNextPay.until, '2027-01-08');
  ok(r.dueBeforeNextPay.items.some(w.of('card_b')) && r.dueBeforeNextPay.items.some(w.of('rent')));
  // bank + both pays today - what is past and not settled (the November bills) - what is due before the January pay
  const pastOut = r.mayStillPost.concat(r.notSeenYet.items).filter(i => i.direction !== 'in' && !i.item.startsWith(w.ids.pay_main) && !i.item.startsWith(w.ids.pay_side)).reduce((t, i) => t + i.amount, 0);
  eq(bank.headroom, bank.bank + 240000 - pastOut - r.dueBeforeNextPay.total);
});
t('while the main pay is late, it does not count: safe to spend is the walk without it, to the pay after it [BH1, BH2]', () => {
  const w = life();
  w.ci('2026-12-10'); w.ci('2026-12-11');
  // 32,000 on card A in December: its payment of Tue 12 Jan (the 10th is a Sunday, the 11th a holiday)
  w.book.events.push({ id: 'q4zt8m-cardspend-1', k: 'spend', acct: w.ids.card_a, date: '2026-12-15', a: 32000, told: '2026-12-15T12:00+09:00' });
  w.ci('2026-12-28');
  w.ci('2027-01-08', ['pay_main']);   // the main pay, expected Fri 8 Jan, has not come
  const r = w.on('2027-01-11'), bank = r.accounts[w.ids.bank];
  // bank - card A 32,000 (12 Jan) - phone 4,800 (20 Jan) - power 7,400 (26 Jan) - rent 72,000 and internet 5,200 (27 Jan)
  // = bank - 121,400; the 10 Feb pay comes after the lowest point
  eq(bank.headroom, bank.bank - 121400);
  eq(r.dueBeforeNextPay.total, 121400);   // late-03 under BH1: the list runs to the pay after the late one
  eq([r.daysToNextPay.item, r.daysToNextPay.late], [w.ids.pay_main + '@2027-01-10', true]);   // still shown as expected, late
  eq(r.period.nextPay.state, 'late');
  // ticked: it counts at once
  w.ci('2027-01-11');
  ok(w.on('2027-01-11').accounts[w.ids.bank].headroom > bank.headroom);
});
t('a pay left unticked at a check-in on its due day is not counted that day [BJ1, BH1 over G4]', () => {
  const w = life();
  const before = w.on('2026-12-10').accounts[w.ids.bank];   // no check-in yet: both pays due today count [G4]
  w.ci('2026-12-10', ['pay_side']);
  const r = w.on('2026-12-10'), bank = r.accounts[w.ids.bank];
  // the main pay was ticked (in the bank figure now); the side job's 60,000 is not counted any more
  eq(bank.headroom, before.headroom - 60000);
  ok(r.checkIn.toConfirm.some(w.of('pay_side')));
  // the next day it is late, and still not counted
  eq(w.on('2026-12-11').accounts[w.ids.bank].why.includes('Side job'), false);
});
t('on pay day safe to spend runs to the pay after it; a main pay left unticked at a check-in that day is named [S1, BJ1]', () => {
  const w = life();
  const r0 = w.on('2026-12-10');   // no check-in yet: the 10 Dec pay counts [G4]
  eq([r0.safeToSpend.until, r0.safeToSpend.notCounting, r0.period.payToday], ['2027-01-08', null, true]);
  w.ci('2026-12-10', ['pay_main']);
  const r = w.on('2026-12-10');
  eq([r.safeToSpend.until, r.safeToSpend.notCounting, r.period.payToday], ['2027-01-08', w.ids.pay_main + '@2026-12-10', false]);
});
// [NORTH_STAR, BK3] the bank after the cards are paid: the walk's own figure, per bank, dated, naming the pays in it.
// The app's made-up book (card spending dated ahead). Hand-worked on 23 Nov, 9 Dec and 10 Dec: D1 is 10 Dec (card A),
// N the 12 Jan pay, the day 11 Dec: 286,000 - 7,400 - 72,000 - 5,200 (Nov bills) + 240,000 (10 Dec pay) - 54,000 (A)
// - 23,000 (B) = 364,400. After ticking the pay and card A on 10 Dec (the bank typed as the app has it, 387,400):
// D1 is 11 Dec, the day 11 Dec, 387,400 - 23,000 = 364,400 with no pay named (it is in the bank already).
const bacBase = { currency: 'JPY', setAside: [], dip: null, paysNotCounted: [], ifAllTaken: true };
t('the bank after the cards are paid: 11 Dec on 23 Nov, 9 Dec and 10 Dec, before and after the tick [BK3]', () => {
  const sc = JSON.parse(JSON.stringify(require('./mako_madeup.js').SC));
  sc.events = [{ id: 'sp1', date: '2026-12-18', kind: 'spend', account: 'card_a', amount: 18000 }, { id: 'sp2', date: '2026-12-20', kind: 'spend', account: 'card_b', amount: 9500 },
    { id: 'sp3', date: '2026-12-29', kind: 'spend', account: 'card_b', amount: 7400 }];
  const book = require('./scenario_to_book.js').convert(sc).book, bank = 'bank';
  book.home.main = { v: { acct: 'bank', min: null } };
  const at = (bk, day) => L.lookahead(bk, day).bankAfterCards[bank];
  for (const day of ['2026-11-23', '2026-12-09', '2026-12-10'])
    eq(at(book, day), Object.assign({ day: '2026-12-11', amount: 364400, cardDays: ['2026-12-10', '2026-12-11'], cards: ['card_a', 'card_b'], pays: ['2026-12-10'], billsTaken: 3 }, bacBase), day);
  ok(L.lookahead(book, '2026-11-23').safeToSpend.headline !== 364400);
  const newId = I.idMaker('q4zt8m', () => 0.25), day = '2026-12-10';
  const li = L.lookahead(book, day).checkIn.toConfirm.filter(o => !o.item.startsWith('card_b'));
  let bk = W.apply(book, W.checkIn(book, { day, told: day + 'T20:00+09:00', newId, ticked: li.map(o => o.item), figures: {}, expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) }));
  bk = W.apply(bk, W.checkIn(bk, { day, told: day + 'T20:01+09:00', newId, figures: { [bank]: L.lookahead(bk, day).accounts[bank].bank } }));
  eq(at(bk, day), Object.assign({ day: '2026-12-11', amount: 364400, cardDays: ['2026-12-11'], cards: ['card_b'], pays: [], billsTaken: 0 }, bacBase));
});
// The walk's life (pay moved earlier: the January pay and card B on Fri 8 Jan, card A on Tue 12 Jan), card spending
// typed on 11 Dec (A 18,000, B 9,500). From 12 Dec to 7 Jan: D1 is 8 Jan (B), N the 10 Feb pay, the day 12 Jan, with the
// 8 Jan pay in it: 364,400 - 89,400 (Dec bills) + 240,000 - 9,500 - 18,000 = 487,500. On 11 Jan, the 8 Jan pay left
// unticked (late or not seen, not counted, BH1) and card B ticked on 8 Jan: the 12 Jan card without the pay:
// 265,500 - 18,000 = 247,500, the pay named as not counted.
t('the bank after the cards are paid: 12 Jan from 12 Dec, and on 11 Jan with the pay late, without it [BK3, BH1]', () => {
  const w = life(), bank = w.ids.bank;
  w.ci('2026-12-10'); w.ci('2026-12-11');
  for (const [k, a] of [['card_a', 18000], ['card_b', 9500]]) w.book.events.push({ id: 'k7m2qa-sp' + k + '-1', k: 'spend', acct: w.ids[k], a, date: '2026-12-11', told: '2026-12-11T21:00+09:00', line: 'free', src: { type: 'typed' } });
  const at = day => L.lookahead(w.book, day).bankAfterCards[bank];
  for (const day of ['2026-12-12', '2026-12-20', '2027-01-07'])
    eq(at(day), Object.assign({ day: '2027-01-12', amount: 487500, cardDays: ['2027-01-08', '2027-01-12'], cards: [w.ids.card_b, w.ids.card_a], pays: ['2027-01-08'], billsTaken: 4 }, bacBase), day);
  w.ci('2026-12-28'); w.ci('2027-01-08', ['pay_main', 'pay_side']);
  const x = at('2027-01-11');
  eq([x.day, x.amount, x.pays, x.cardDays, x.paysNotCounted.map(p => p.due)], ['2027-01-12', 247500, [], ['2027-01-12'], ['2027-01-08', '2027-01-08']]);
});
// goals stay in X and are named; a dip below zero before the day is given with its day [BK3]
t('the bank after the cards are paid keeps goals in it, names them, and gives a dip before its day', () => {
  const w = life(), bank = w.ids.bank;
  w.book.events.push({ id: 'k7m2qa-spbig-1', k: 'spend', acct: bank, a: 300000, date: '2026-11-23', told: '2026-11-23T21:00+09:00', line: 'free', src: { type: 'typed' } });
  const x = L.lookahead(w.book, '2026-11-24').bankAfterCards[bank];
  // 286,000 - 300,000 - 84,600 (Nov bills by 27 Nov) = -98,600 at its lowest, then + 240,000 on 10 Dec pay day
  eq([x.day, x.dip], ['2026-12-11', { day: '2026-11-27', amount: 98600 }]);
  // a goal kept in the bank: 50,000 set aside on 21 Nov is not taken off (safe to spend takes it off) and is named
  const g = life(), gb = g.ids.bank, trip = 'k7m2qa-tripgoal00-1';
  g.book.places = [{ id: trip, name: 'Trip', kind: 'goal', keptIn: { acct: gb, mode: 'inBank' }, told: '2026-11-20T21:00+09:00' }];
  g.book.events.push({ id: 'k7m2qa-tripmove0-1', k: 'move', place: 'waiting', place2: trip, a: 50000, date: '2026-11-21', told: '2026-11-21T12:00+09:00' });
  const y = L.lookahead(g.book, '2026-11-23');
  eq([y.bankAfterCards[gb].amount, y.bankAfterCards[gb].setAside], [364400, [{ place: trip, name: 'Trip', amount: 50000 }]]);
});
// [check your bank gap] a card figure above what the app had is spending not logged (more), below it comes off (less)
t('a card check names its gap as more or less, never a negative to flip', () => {
  const w = life(), A = w.ids.card_a, B = w.ids.card_b;
  const out = W.checkIn(w.book, { day: '2026-11-25', told: '2026-11-25T20:00+09:00', newId: I.idMaker('q4zt8m', () => 0.3), figures: { [A]: 54850, [B]: 22150 } });
  const r = L.lookahead(W.apply(w.book, out), '2026-11-25');
  eq([r.cards[A].fillers.slice(-1)[0].more, r.cards[A].fillers.slice(-1)[0].less, r.cards[B].fillers.slice(-1)[0].more, r.cards[B].fillers.slice(-1)[0].less], [850, 0, 0, 850]);
});
done('mako_walk');
