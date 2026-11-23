#!/usr/bin/env node
/* The Plan tab's steps (app3/src/plan3_write.js) through act3, in node, on the made-up Mako book (no plan yet) on
   Wed 25 Nov 2026 (period 10 Nov to 9 Dec). Each step writes plan records with ids, told, at, by and grp; a change is a
   new entry from a date (its own at and by), never an edit of the past; the engine's figures follow. Amounts made up. */
'use strict';
const path = require('path'), fs = require('fs');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), I = require(E + 'ids.js'), PE = require(E + 'periods.js');
const A3 = require('../src/act3.js'), W = require('../src/plan3_write.js');
let DAY = '2026-11-25';
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const mako = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
function setup(book) {
  let b = book || mako();
  const h = { get book() { return b; } };
  h.A = A3.make({ book: () => b, put: async x => { b = x; return true; }, told: () => DAY + 'T12:00+09:00',
    newId: I.idMaker('p3wrtd', Math.random), today: () => DAY, queue: { post: () => {} }, check: x => L.lookahead(x, DAY) });
  h.go = (name, ...args) => h.A.run(name, w => W[name](w, ...args));
  return h;
}
const view = b => L.lookahead(b, DAY);
const BANK = 'k7m2qa-f3n8p1x6wd-1', CARD_A = 'k7m2qa-f3n8p1x6wd-2', RENT = 'k7m2qa-f3n8p1x6wd-6';
const stamped = (r, step) => { ok(I.isOrdinary(r.id), 'ordinary id ' + r.id); eq([r.told, r.by, r.grp], [DAY + 'T12:00+09:00', 'p3wrtd', step.id], 'told by grp'); ok(/[+-]\d\d:\d\d$/.test(r.at), 'at ' + r.at); };

(async () => {
  await t('a budget line: one record, per pay period, its first step with its own at and by; the period shows it, safe to spend makes room', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.go('addLine', { name: ' Food ', amount: 40000 });
    ok(r.ok, JSON.stringify(r));
    const l = h.book.plan.budgets[0];
    stamped(l, r.step);
    eq([l.name, l.place, l.cur, l.per, l.from, l.steps.map(s => [s.from, s.amount, s.at, s.by])], ['Food', 'bills', 'JPY', 'pay', DAY, [[null, 40000, l.at, 'p3wrtd']]]);
    const r1 = view(h.book);
    // in the period holding the setup day (20 Nov) the line starts with its share by days left: 20 of 30 days [I4]
    eq(r1.period.lines.map(x => [x.name, x.amount, x.left]), [['Food', 40000, 26666]]);
    ok(r1.safeToSpend.headline < r0.safeToSpend.headline, 'safe to spend makes room for the line');
    const again = await h.go('addLine', { name: 'food', amount: 100 });
    ok(!again.ok && /already one/.test(again.text), JSON.stringify(again));
    for (const x of [{ name: '', amount: 5 }, { name: 'Gym', amount: 0 }, { name: 'Gym', amount: 12.5 }, { name: 'Free to spend', amount: 5 }]) {
      const z = await h.go('addLine', x); ok(!z.ok && z.why === 'bad', JSON.stringify(x) + ' ' + JSON.stringify(z));
    }
  });
  await t('a line changed now, from the next period, or for this period only', async () => {
    const h = setup(); await h.go('addLine', { name: 'Food', amount: 40000 });
    const id = h.book.plan.budgets[0].id;
    let r = await h.go('changeLine', id, { amount: 45000, when: 'next' });
    ok(r.ok, JSON.stringify(r));
    eq(h.book.plan.budgets[0].steps.slice(-1).map(s => [s.from, s.amount, s.by]), [[DAY, 45000, 'p3wrtd']]);
    eq(view(h.book).period.lines[0].amount, 40000, 'this period keeps its amount');
    r = await h.go('changeLine', id, { amount: 38000, when: 'now' });
    eq(h.book.plan.budgets[0].steps.slice(-1).map(s => [s.from, s.amount]), [['2026-11-10', 38000]], 'one step from the period start (BF, the engine counts it in the setup period)');
    eq(h.book.plan.budgets[0].once, undefined, 'no once key for a change from now');
    eq(view(h.book).period.lines[0].amount, 38000, 'this period follows');
    r = await h.go('changeLine', id, { amount: 50000, when: 'once' });
    const p = view(h.book).period;
    eq(Object.keys(h.book.plan.budgets[0].once), [p.startsWith]);
    eq([h.book.plan.budgets[0].once[p.startsWith].amount, typeof h.book.plan.budgets[0].once[p.startsWith].at], [50000, 'string']);
    eq(p.lines[0].amount, 50000);
    eq(h.book.plan.budgets[0].steps.length, 3, 'once adds no step');
    const pd = PE.periods(h.book, DAY).current; eq(pd.lines[0].amount, 50000, 'periods() agrees');
  });
  await t('a line ended: kept with ends, nothing from the next period, this one keeps its amount', async () => {
    const h = setup(); await h.go('addLine', { name: 'Food', amount: 40000 });
    const id = h.book.plan.budgets[0].id;
    const r = await h.go('endLine', id); ok(r.ok, JSON.stringify(r));
    const l = h.book.plan.budgets[0];
    eq([l.ends, l.gone, l.steps.slice(-1)[0].amount], [DAY, undefined, 0]);
    eq(view(h.book).period.lines[0].amount, 40000);
  });
  await t('Free to spend: a share entry; a change from a date is a new entry; one period only is a once key', async () => {
    const h = setup();
    let r = await h.go('setFree', { amount: 60000 }); ok(r.ok, JSON.stringify(r));
    const s = h.book.plan.shares[0]; stamped(s, r.step);
    eq([s.from, s.free, s.per, s.cur], [DAY, 60000, { free: 'pay' }, 'JPY']);   // [BJ2] the first amount carries its day
    eq(view(h.book).period.free.amount, 60000);
    r = await h.go('setFree', { amount: 70000, when: 'next' });
    eq(h.book.plan.shares.map(x => [x.from, x.free]), [[DAY, 60000], [DAY, 70000]]);
    eq(view(h.book).period.free.amount, 60000);
    r = await h.go('setFree', { amount: 65000, when: 'now' });
    eq(view(h.book).period.free.amount, 65000);
    eq([h.book.plan.shares.slice(-1)[0].from, h.book.plan.shares.slice(-1)[0].once], ['2026-11-10', undefined], 'a share from the period start, no once key');
    r = await h.go('setFree', { amount: 20000, when: 'once' }); ok(r.ok, JSON.stringify(r));
    eq(view(h.book).period.free.amount, 20000);
  });
  await t('a bill: a schedule from today, due on its day; its next one shows; due before next pay counts it', async () => {
    const h = setup();
    const r = await h.go('addBill', { name: 'Gym', amount: 8000, day: 1 }); ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.slice(-1)[0]; stamped(s, r.step);
    eq([s.kind, s.acct, s.from, s.rules[0].rule, s.steps[0].amount, typeof s.rules[0].at], ['bill', BANK, DAY, { every: 'month', days: [1] }, 8000, 'string']);
    eq(PE.scheduleView(h.book, DAY)[s.id].next, { due: '2026-12-01', land: '2026-12-01', amount: 8000 });
    ok(view(h.book).dueBeforeNextPay.items.some(o => o.item === s.id + '@2026-12-01'), 'due before next pay');
  });
  await t('a bill changed from a date: new step and rule entries; never on or before one already paid [X8]', async () => {
    const h = setup();
    // the rent of 27 Nov ticked as paid on 27 Nov
    DAY = '2026-11-28';
    const b = h.book; b.events.push({ id: 'set:' + RENT + '@2026-11-27', k: 'spend', acct: BANK, date: '2026-11-27', a: 72000, settles: [{ s: RENT, due: '2026-11-27' }], told: '2026-11-28T09:00+09:00', at: '2026-11-28T09:00+09:00', by: 'p3wrtd' });
    let r = await h.go('changeBill', RENT, { amount: 75000, day: 25, from: '2026-11-27' });
    ok(!r.ok && /2026-11-28 at the earliest/.test(r.text), JSON.stringify(r));
    r = await h.go('changeBill', RENT, { amount: 75000, day: 25 }); ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.id === RENT);
    eq(s.steps.map(x => [x.from, x.amount]), [[null, 72000], ['2026-11-28', 75000]]);
    eq(s.rules.map(x => [x.from, x.rule.days]), [[null, [27]], ['2026-11-28', [25]]]);
    eq(PE.scheduleView(h.book, DAY)[RENT].next, { due: '2026-12-25', land: '2026-12-25', amount: 75000 });
    r = await h.go('changeBill', RENT, { name: 'Flat' }); ok(r.ok, JSON.stringify(r));
    eq(h.book.schedules.find(x => x.id === RENT).name, 'Flat');
    r = await h.go('endBill', RENT, { last: '2026-11-20' }); ok(!r.ok && /earliest/.test(r.text), JSON.stringify(r));
    r = await h.go('endBill', RENT, { last: '2026-12-31' }); ok(r.ok, JSON.stringify(r));
    eq(PE.scheduleView(h.book, '2027-01-01')[RENT].next, null);
    DAY = '2026-11-25';
  });
  await t('a pay changed to 0 is refused with words; a bill too; nothing is written [BL1]', async () => {
    const h = setup(), before = JSON.stringify(h.book);
    let r = await h.go('changeBill', 'k7m2qa-f3n8p1x6wd-4', { amount: 0 });
    ok(!r.ok && r.text === 'A pay needs an amount. If it comes when it comes, pick No fixed pay', JSON.stringify(r));
    r = await h.go('changeBill', RENT, { amount: 0 });
    ok(!r.ok && /above zero/.test(r.text), JSON.stringify(r));
    eq(JSON.stringify(h.book), before, 'nothing written');
  });
  await t('a goal kept in the bank: setting money aside is a move into it; the goal holds it and safe to spend is lower by it', async () => {
    const h = setup();
    let r = await h.go('addGoal', { name: 'Trip', target: 150000, due: '2027-08-01' }); ok(r.ok, JSON.stringify(r));
    const g = h.book.places[0]; stamped(g, r.step);
    eq([g.kind, g.target, g.due, g.keptIn], ['goal', 150000, '2027-08-01', { acct: BANK, mode: 'inBank' }]);
    const r0 = view(h.book);
    r = await h.go('setAside', g.id, { amount: 20000 }); ok(r.ok, JSON.stringify(r));
    const e = h.book.events.slice(-1)[0];
    eq([e.k, e.a, e.acct, e.place2, e.date], ['move', 20000, BANK, g.id, DAY]);
    const r1 = view(h.book);
    eq(r1.places[g.id].kept, 20000);
    eq(r1.safeToSpend.headline, r0.safeToSpend.headline - 20000);
    eq(r1.accounts[BANK].bank, r0.accounts[BANK].bank, 'the bank figure does not move');
    r = await h.go('addGoal', { name: 'Old', target: 100, due: '2026-11-01' }); ok(!r.ok && /after today/.test(r.text), JSON.stringify(r));
    r = await h.go('changeGoal', g.id, { target: 180000, due: '' }); ok(r.ok, JSON.stringify(r));
    eq([h.book.places[0].target, h.book.places[0].due], [180000, undefined]);
  });
  await t('setting aside never takes more than the bank can spare through the next pay: the real walk\'s lowest point less what is set aside [BM2, replaces BL2]', async () => {
    const h = setup();
    let r = await h.go('addGoal', { name: 'Trip', target: 10000000 }); ok(r.ok, JSON.stringify(r));
    const g = h.book.places[0], a0 = view(h.book).accounts[BANK], spare = a0.canSetAside;
    // the bills and card payments before the 10 Dec pay come off first: less than today's figure
    ok(spare > 0 && spare < a0.bank && spare === a0.real.lowest, JSON.stringify([spare, a0.bank, a0.real]));
    const words = x => 'Main bank can spare ¥' + x.toLocaleString('en') + ' to set aside before your next pay: what it holds at its lowest until then, less what is already set aside in it';
    r = await h.go('setAside', g.id, { amount: spare + 1 });
    eq([r.ok, r.text], [false, words(spare)], 'refused with how much is possible');
    eq(view(h.book).places[g.id].kept, 0, 'nothing written');
    r = await h.go('setAside', g.id, { amount: 20000 }); ok(r.ok, JSON.stringify(r));
    eq(view(h.book).accounts[BANK].canSetAside, spare - 20000);
    r = await h.go('setAside', g.id, { amount: spare - 20000 + 1 }); eq([r.ok, r.text], [false, words(spare - 20000)]);
    r = await h.go('setAside', g.id, { amount: spare - 20000 }); ok(r.ok, JSON.stringify(r));
    eq([view(h.book).places[g.id].kept, view(h.book).accounts[BANK].canSetAside], [spare, 0]);
    // kept in its own account: the money comes from the bank, so the bank's spare figure is the limit
    r = await h.go('addGoal', { name: 'House', target: 1000000, mode: 'ownAccount' }); ok(r.ok, JSON.stringify(r));
    r = await h.go('setAside', h.book.places[1].id, { amount: 1 }); ok(!r.ok && /can spare ¥0 /.test(r.text), JSON.stringify(r));
  });
  await t('setting aside past a goal\'s target asks first; nothing is written until "anyway" [BM2]', async () => {
    const h = setup();
    let r = await h.go('addGoal', { name: 'Trip', target: 20000 }); ok(r.ok, JSON.stringify(r));
    const g = h.book.places[0], n0 = h.book.events.length;
    r = await h.go('setAside', g.id, { amount: 25000 });
    eq([r.ok, r.why, r.text], [false, 'ask', 'That is more than Trip needs (¥20,000). Set aside ¥25,000 anyway?']);
    eq(h.book.events.length, n0, 'nothing written');
    r = await h.go('setAside', g.id, { amount: 25000, anyway: true }); ok(r.ok, JSON.stringify(r));
    eq(view(h.book).places[g.id].kept, 25000);
    // up to the target never asks; past it, the words name what is still needed (nothing now)
    r = await h.go('addGoal', { name: 'Gift', target: 10000 }); ok(r.ok, JSON.stringify(r));
    const gift = h.book.places[1];
    r = await h.go('setAside', gift.id, { amount: 6000 }); ok(r.ok, JSON.stringify(r));
    r = await h.go('setAside', gift.id, { amount: 4000 }); ok(r.ok, JSON.stringify(r));
    r = await h.go('setAside', gift.id, { amount: 1 });
    eq([r.ok, r.why, r.text], [false, 'ask', 'Gift already has all it needs (¥10,000). Set aside ¥1 anyway?']);
  });
  await t('a goal in its own account: a new account opened with nothing; money moved there and set aside; that account is not spent from', async () => {
    const h = setup();
    let r = await h.go('addGoal', { name: 'House', target: 1000000, mode: 'ownAccount' }); ok(r.ok, JSON.stringify(r));
    const g = h.book.places[0], acct = h.book.accounts.find(a => a.id === g.keptIn.acct);
    eq([acct.name, acct.type, g.keptIn.mode], ['House account', 'bank', 'ownAccount']);
    const opens = h.book.events.filter(e => e.acct === acct.id);
    eq(opens.map(e => [e.k, e.a, e.date, e.grp]), [['open', 0, DAY, r.step.id], ['check', 0, DAY, r.step.id]]);
    const r0 = view(h.book);
    r = await h.go('setAside', g.id, { amount: 30000 }); ok(r.ok, JSON.stringify(r));
    const r1 = view(h.book);
    eq([r1.places[g.id].kept, r1.accounts[acct.id].bank, r1.accounts[acct.id].spendFrom], [30000, 30000, false]);
    eq(r1.accounts[BANK].bank, r0.accounts[BANK].bank - 30000);
    eq(r1.safeToSpend.headline, r0.safeToSpend.headline - 30000);
  });
  await t('a loan: an account that owns its payment day, opened with what is owed; its next payment is the usual amount [E6]', async () => {
    const h = setup();
    const r = await h.go('addLoan', { name: 'Car loan', owed: 900000, amount: 25000, payDay: 27 }); ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.slice(-1)[0]; stamped(a, r.step);
    eq([a.type, a.payDay, a.payFrom, a.amount], ['loan', 27, BANK, 25000]);
    const v = view(h.book);
    eq([v.owed[a.id].owedNow, v.owed[a.id].next.amount, v.owed[a.id].next.payment_date], [900000, 25000, '2026-11-27']);
    ok(v.dueBeforeNextPay.items.some(o => o.item === a.id + '@2026-11-27'), 'due before next pay');
    const c = await h.go('changeOwed', a.id, { amount: 30000 }); ok(c.ok, JSON.stringify(c));
    eq(view(h.book).owed[a.id].next.amount, 30000);
  });
  await t('a card added after setup (QC F1): an account that owns its payment day, opened with what is on it now, close day or not sure, weekend rule', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.go('addCard', { name: ' Card C ', owed: 12000, payDay: 27, cutDay: null, shift: 'after' }); ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.slice(-1)[0]; stamped(a, r.step);
    eq([a.name, a.type, a.cur, a.payDay, a.cutDay, a.shift, a.payFrom, a.inFull, a.payMonths], ['Card C', 'card', 'JPY', 27, null, 'after', BANK, true, 1]);
    const opens = h.book.events.filter(e => e.acct === a.id).map(e => [e.k, e.date, e.a]);
    eq(opens, [['open', DAY, 12000], ['check', DAY, 12000]], 'opened and checked with what is on it today');
    const v = view(h.book);
    // not sure of the close day: all that is on it, 12,000, comes out on Fri 27 Nov, before the next pay on 10 Dec
    eq([v.cards[a.id].owedNow, v.cards[a.id].next.amount, v.cards[a.id].next.payment_date], [12000, 12000, '2026-11-27']);
    ok(v.dueBeforeNextPay.items.some(o => o.item === a.id + '@2026-11-27'), 'due before next pay');
    eq(v.safeToSpend.headline, r0.safeToSpend.headline - 12000, 'safe to spend takes it off');
    const r2 = await h.go('addCard', { name: 'Card D', owed: 0, payDay: 5, cutDay: 'last', shift: 'before' }); ok(r2.ok, JSON.stringify(r2));
    eq([h.book.accounts.slice(-1)[0].cutDay, h.book.accounts.slice(-1)[0].shift], ['last', 'before']);
    for (const [x, why] of [[{ name: 'card c', owed: 1, payDay: 5 }, /already/], [{ name: 'E', owed: -1, payDay: 5 }, /zero/], [{ name: 'E', owed: 1, payDay: 0 }, /day/],
      [{ name: 'E', owed: 1, payDay: 5, cutDay: 40 }, /day/], [{ name: 'E', owed: 1, payDay: 5, shift: 'sideways' }, /weekend/], [{ name: '', owed: 1, payDay: 5 }, /name/]]) {
      const b = await h.go('addCard', x); ok(!b.ok && why.test(b.text), JSON.stringify(x) + ' ' + JSON.stringify(b));
    }
  });
  await t('a card\'s payment day and close day change on its record; the engine still reads the book', async () => {
    const h = setup();
    let r = await h.go('changeOwed', CARD_A, { payDay: 12, cutDay: 25 }); ok(r.ok, JSON.stringify(r));
    const c = h.book.accounts.find(a => a.id === CARD_A);
    eq([c.payDay, c.cutDay], [12, 25]);
    ok(view(h.book).cards[CARD_A], 'the card is read');
    r = await h.go('changeOwed', CARD_A, { cutDay: null }); ok(r.ok, JSON.stringify(r));
    eq(h.book.accounts.find(a => a.id === CARD_A).cutDay, undefined, 'not sure again');
  });
  await t('pay changed from a date: a new rule and step; the period ends before the new day; the period running stays as it started', async () => {
    const h = setup(), MAIN = 'k7m2qa-f3n8p1x6wd-4', SIDE = 'k7m2qa-f3n8p1x6wd-5';
    const p0 = view(h.book).period;
    let r = await h.go('changeBill', MAIN, { day: 27, amount: 190000 }); ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.id === MAIN);
    eq(s.rules.map(x => [x.from, x.rule.days]), [[null, [10]], [DAY, [27]]]);
    eq(s.steps.map(x => [x.from, x.amount]), [[null, 180000], [DAY, 190000]]);
    eq(PE.scheduleView(h.book, DAY)[MAIN].next, { due: '2026-11-27', land: '2026-11-27', amount: 190000 });
    const p1 = view(h.book).period;
    eq([p1.start, p1.startsWith], [p0.start, p0.startsWith], 'the period running keeps its start');
    eq(p1.end, '2026-11-26', 'it ends before the new pay day');
    r = await h.go('changeBill', SIDE, { name: 'Main job' }); ok(!r.ok && /already one/.test(r.text), JSON.stringify(r));
  });
  await t('[slice 6] the pay that starts the period changed to every 2 weeks: each line each pay is asked about, a new step from the change', async () => {
    const h = setup(), MAIN = 'k7m2qa-f3n8p1x6wd-4';
    let r = await h.go('addLine', { name: 'Food', amount: 40000 }); ok(r.ok, JSON.stringify(r));
    r = await h.go('setFree', { amount: 60000 }); ok(r.ok, JSON.stringify(r));
    const food = h.book.plan.budgets[0].id;
    // the rhythm changes and no line is answered: refused, naming each line
    r = await h.go('changeBill', MAIN, { every: 'weeks2', start: '2026-12-04', from: '2026-12-04' });
    ok(!r.ok && r.text === 'Your pay will land every 2 weeks. How much each pay from then for Food and Free to spend?', JSON.stringify(r));
    // every 2 weeks with no day of one pay: refused
    r = await h.go('changeBill', MAIN, { every: 'weeks2', from: '2026-12-04', lines: { [food]: 20000, free: 30000 } });
    ok(!r.ok && /day of one pay/.test(r.text), JSON.stringify(r));
    r = await h.go('changeBill', MAIN, { every: 'weeks2', start: '2026-12-04', from: '2026-12-04', lines: { [food]: 20000, free: 30000 } });
    ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.id === MAIN);
    eq(s.rules.map(x => [x.from, x.rule]), [[null, { every: 'month', days: [10] }], ['2026-12-04', { every: 'weeks', n: 2, from: '2026-12-04' }]]);
    eq(h.book.plan.budgets[0].steps.map(x => [x.from, x.amount]), [[null, 40000], ['2026-12-04', 20000]], 'Food from the change');
    eq(h.book.plan.shares.filter(x => !x.gone).map(x => [x.from, x.free]), [[DAY, 60000], ['2026-12-04', 30000]], 'Free to spend from the change');
    eq(PE.scheduleView(h.book, DAY)[MAIN].next.land, '2026-12-04');
    // a line left at its amount keeps it (no new step); the rhythm the same: the lines are not touched
    const h2 = setup();
    await h2.go('addLine', { name: 'Food', amount: 40000 });
    r = await h2.go('changeBill', MAIN, { every: 'weeks2', start: '2026-12-04', from: '2026-12-04', lines: { [h2.book.plan.budgets[0].id]: 40000 } });
    ok(r.ok, JSON.stringify(r));
    eq(h2.book.plan.budgets[0].steps.length, 1, 'kept as it was');
    r = await h2.go('changeBill', MAIN, { amount: 185000, lines: { [h2.book.plan.budgets[0].id]: 1 } });
    ok(r.ok, JSON.stringify(r));
    eq(h2.book.plan.budgets[0].steps.length, 1, 'the rhythm the same: lines not touched');
  });
  await t('one bill changed once: an amounts key on its due date; the next one goes back to the usual amount', async () => {
    const h = setup();
    let r = await h.go('changeOnce', RENT, { due: '2026-11-27', amount: 80000 }); ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.id === RENT);
    eq([s.amounts['2026-11-27'].amount, typeof s.amounts['2026-11-27'].at, s.amounts['2026-11-27'].by], [80000, 'string', 'p3wrtd']);
    eq(PE.scheduleView(h.book, DAY)[RENT].next.amount, 80000);
    eq(PE.scheduleView(h.book, '2026-11-28')[RENT].next.amount, 72000);
    r = await h.go('changeOnce', RENT, { due: '2026-12-26', amount: 1 }); ok(!r.ok && /not a day/.test(r.text), JSON.stringify(r));
    r = await h.go('changeOnce', RENT, { due: '2026-10-27', amount: 1 }); ok(!r.ok, JSON.stringify(r));
  });
  await t('money taken back out of a goal: a move out of it; never more than it holds; from its own account back to the bank', async () => {
    const h = setup();
    await h.go('addGoal', { name: 'Trip', target: 150000 });
    const g = h.book.places[0];
    await h.go('setAside', g.id, { amount: 20000 });
    const r0 = view(h.book);
    let r = await h.go('takeOut', g.id, { amount: 5000 }); ok(r.ok, JSON.stringify(r));
    const e = h.book.events.slice(-1)[0];
    eq([e.k, e.a, e.place, e.place2, e.acct], ['move', 5000, g.id, undefined, BANK]);
    const r1 = view(h.book);
    eq(r1.places[g.id].kept, 15000);
    eq(r1.accounts[BANK].headroom, r0.accounts[BANK].headroom + 5000);
    r = await h.go('takeOut', g.id, { amount: 15001 }); ok(!r.ok && /holds/.test(r.text), JSON.stringify(r));
    await h.go('addGoal', { name: 'House', target: 900000, mode: 'ownAccount' });
    const hg = h.book.places[1];
    await h.go('setAside', hg.id, { amount: 30000 });
    const b0 = view(h.book).accounts[BANK].bank;
    r = await h.go('takeOut', hg.id, { amount: 10000 }); ok(r.ok, JSON.stringify(r));
    const v = view(h.book);
    eq([v.places[hg.id].kept, v.accounts[hg.keptIn.acct].bank, v.accounts[BANK].bank], [20000, 20000, b0 + 10000]);
  });
  await t('a paid-off loan closes: a final check of nothing and its closing day; a loan still owing is refused', async () => {
    const h = setup();
    await h.go('addLoan', { name: 'Car loan', owed: 25000, amount: 25000, payDay: 27 });
    const id = h.book.accounts.slice(-1)[0].id;
    let r = await h.go('closeLoan', id); ok(!r.ok && /still owes/.test(r.text), JSON.stringify(r));
    // the last payment, ticked on 27 Nov
    DAY = '2026-11-27';
    h.book.events.push({ id: 'set:' + id + '@2026-11-27', k: 'repay', acct: BANK, acct2: id, a: 25000, a2: 25000, date: '2026-11-27', settles: [{ s: id, due: '2026-11-27' }], told: '2026-11-27T09:00+09:00', at: '2026-11-27T09:00+09:00', by: 'p3wrtd' });
    eq(view(h.book).owed[id].owedNow, 0);
    r = await h.go('closeLoan', id); ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.find(x => x.id === id), last = h.book.events.slice(-1)[0];
    eq([a.closed, last.k, last.acct, last.a, last.date], [DAY, 'check', id, 0, DAY]);
    const v = view(h.book);
    ok(!v.dueBeforeNextPay.items.some(o => o.item.startsWith(id + '@')), 'nothing more is due');
    ok(!v.warnings.some(w => w.code === 'reopened'), 'not reopened');
    DAY = '2026-11-25';
  });
  await t('Undo of a plan step marks what it added gone; the period no longer shows it', async () => {
    const h = setup();
    const r = await h.go('addLine', { name: 'Food', amount: 40000 });
    const u = await h.A.undo(r.step.id); ok(u.ok, JSON.stringify(u));
    eq(typeof h.book.plan.budgets[0].gone, 'string');
    eq(view(h.book).period.lines, []);
  });
  console.log(bad ? `plan3_write: ${bad} FAIL of ${n}` : `plan3_write: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
