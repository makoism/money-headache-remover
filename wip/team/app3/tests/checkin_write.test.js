#!/usr/bin/env node
/* The check-in writer (app3/src/checkin_write.js), pure, on the made-up Mako book (WIRING_PLAN 1.4 step 8, SCHEMA_V3 7.1, 7.2).
   Mako on 10 Dec ticks both pays and card A and types the bank; the look ahead then shows the new bank figure as of
   10 Dec, card B still due on the 11th, and no ticked item left on the check-in list. Made-up yen. */
'use strict';
const assert = require('assert');
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), G = require(E + 'ledger.js'), I = require(E + 'ids.js');
const W = require('../src/checkin_write.js');
const book0 = require('../fixtures/mako_madeup_book.json');
let bad = 0, n = 0;
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + e.message.split('\n')[0]); } };
const clone = x => JSON.parse(JSON.stringify(x));
const bank = book0.home.main.v.acct;
const cardA = book0.accounts.find(a => a.name === 'Card A').id, cardB = book0.accounts.find(a => a.name === 'Card B').id;
const payMain = book0.schedules.find(s => s.name === 'Main job').id, paySide = book0.schedules.find(s => s.name === 'Side job').id;
const newId = I.idMaker('q4zt8m', () => 0.5);

const DAY = '2026-12-10';
const before = L.lookahead(book0, DAY);
const list = before.checkIn.toConfirm;
const known = { expected: Object.fromEntries(list.map(o => [o.item, o.amount])), lands: Object.fromEntries(list.map(o => [o.item, o.lands])) };
const pick = list.filter(o => [payMain, paySide, cardA].includes(I.scheduleOf(o.item)));
const rest = list.filter(o => !pick.includes(o));

t('the 10 Dec list has both pays and card A', () => assert.strictEqual(pick.length, 3));
const book = clone(book0);
const out = W.checkIn(book, { ...known, day: DAY, told: DAY + 'T19:30+09:00', newId,
  figures: { [bank]: 341000 },
  ticked: pick.map(o => o.item), unticked: rest.map(o => o.item), amounts: {} });
t('it writes one check-in record, one check and three settles', () => {
  assert.strictEqual(out.checkins.length, 1);
  assert.strictEqual(out.events.filter(e => e.k === 'check').length, 1);
  assert.deepStrictEqual(out.events.filter(e => e.k !== 'check').map(e => e.id).sort(), pick.map(o => 'set:' + o.item).sort());
});
t('a pay is written as income with its stream, card A as a repay from the bank', () => {
  const p = out.events.find(e => e.id === 'set:' + payMain + '@2026-12-10');
  assert.strictEqual(p.k, 'in'); assert.strictEqual(p.sub, 'pay'); assert.strictEqual(p.stream, payMain); assert.strictEqual(p.a, 180000);
  const c = out.events.find(e => e.id === 'set:' + cardA + '@2026-12-10');
  assert.strictEqual(c.k, 'repay'); assert.strictEqual(c.acct, bank); assert.strictEqual(c.acct2, cardA); assert.strictEqual(c.a, 54000); assert.strictEqual(c.a2, 54000);
});
t('every record carries the check-in as grp, and the check-in lists what it settled', () => {
  const id = out.checkins[0].id;
  for (const e of out.events) assert.strictEqual(e.grp, id);
  assert.deepStrictEqual(out.checkins[0].settled.slice().sort(), pick.map(o => 'set:' + o.item).sort());
  assert.deepStrictEqual(out.checkins[0].figures.map(f => f.acct), [bank]);
});
t('the writer does not change the book it is given', () => assert.deepStrictEqual(book, book0));
const after = W.apply(book, out);
const res = L.lookahead(after, DAY);
t('the bank shows the typed figure, as of 10 Dec', () => { assert.strictEqual(res.accounts[bank].bank, 341000); assert.strictEqual(res.accounts[bank].asOf, DAY); });
t('nothing ticked is left on the check-in list', () => assert.ok(!res.checkIn.toConfirm.some(o => pick.some(p => p.item === o.item))));
t('card B is still due on the 11th, card A is paid', () => {
  assert.strictEqual(res.cards[cardB].next.payment_date, '2026-12-11');
  assert.strictEqual(res.cards[cardA].owedNow, 0);
});
t('the next pay is in January', () => assert.ok(res.daysToNextPay.next_pay > '2027-01-01', res.daysToNextPay.next_pay));
t('the ledger still adds up', () => assert.ok(G.proof(after).ok));
t('a changed amount is written as typed', () => {
  const o2 = W.checkIn(clone(book0), { ...known, day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 341000 }, ticked: [pick[0].item], unticked: [], amounts: { [pick[0].item]: 175000 } });
  assert.strictEqual(o2.events.find(e => e.id === 'set:' + pick[0].item).a, 175000);
});
t('an amount that is not whole minor units is refused', () => assert.throws(() => W.checkIn(clone(book0), { ...known, day: DAY, told: DAY + 'T19:30+09:00', newId, figures: { [bank]: 12.5 }, ticked: [], unticked: [], amounts: {} })));
/* the weekend in the try book: with everything due by 11 Dec ticked, card B leaves on Fri 8 Jan, before pay lands Tue 12 Jan */
t('the try book has the weekend where card B leaves before pay lands', () => {
  const li = L.lookahead(book0, '2026-12-11').checkIn.toConfirm;
  const paid = W.apply(book0, W.checkIn(book0, { day: '2026-12-11', told: '2026-12-11T20:00+09:00', newId, figures: { [bank]: 300000 }, ticked: li.map(o => o.item), amounts: {},
    expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) }));
  const jan = L.lookahead(paid, '2027-01-07');
  assert.strictEqual(jan.cards[cardB].next.payment_date, '2027-01-08');
  assert.strictEqual(jan.daysToNextPay.next_pay, '2027-01-12');
});
console.log(bad ? 'CHECKIN WRITE FAIL ' + bad + ' of ' + n : 'CHECKIN WRITE PASS ' + n);
process.exit(bad ? 1 : 0);
