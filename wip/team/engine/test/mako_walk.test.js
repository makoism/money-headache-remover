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
done('mako_walk');
