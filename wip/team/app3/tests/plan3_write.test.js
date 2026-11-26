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
/* [BZ2] the pay that holds the flag on a day (today by default) */
const holderOn = (b, d) => (require(E + 'schedules.js').periodHolder(b.schedules, d || DAY) || {}).id || null;
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
    // [slice 6] changed from a day between two pays: the new amounts start with the pay period holding that day. Every
    // 2 weeks from Fri 4 Dec, changed on Thu 10 Dec to the 25th each month: the 4 Dec pay starts the period holding it
    const h3 = setup();
    await h3.go('addLine', { name: 'Food', amount: 40000 });
    r = await h3.go('changeBill', MAIN, { every: 'weeks2', start: '2026-12-04', from: '2026-12-04', lines: { [h3.book.plan.budgets[0].id]: 20000 } }); ok(r.ok, JSON.stringify(r));
    r = await h3.go('changeBill', MAIN, { every: 'month', day: 25, from: '2026-12-10', lines: { [h3.book.plan.budgets[0].id]: 45000 } }); ok(r.ok, JSON.stringify(r));
    eq(h3.book.plan.budgets[0].steps.map(x => [x.from, x.amount]), [[null, 40000], ['2026-12-04', 20000], ['2026-12-04', 45000]]);
    // [qc-foundation] the next pay given as the day of one pay: saved stepped back to on or before the change day
    const h4 = setup();
    r = await h4.go('changeBill', MAIN, { every: 'weeks2', start: '2026-12-18', from: '2026-12-04' }); ok(r.ok, JSON.stringify(r));
    eq(h4.book.schedules.find(x => x.id === MAIN).rules[1].rule, { every: 'weeks', n: 2, from: '2026-12-04' });
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
  /* [slice 6b] the pay that starts the period changed to two days a month, to no fixed pay, and back from no fixed pay.
     The made-up Mako book on Wed 25 Nov: Main job on the 10th, the period 10 Nov to 9 Dec. Food 40,000 and Free to
     spend 60,000 each pay. */
  await t('[slice 6b] to two days a month and to no fixed pay: each line asked about, a month for no fixed pay, from the change day', async () => {
    const h = setup(), MAIN = 'k7m2qa-f3n8p1x6wd-4';
    await h.go('addLine', { name: 'Food', amount: 40000 }); await h.go('setFree', { amount: 60000 });
    const food = h.book.plan.budgets[0].id;
    // two days a month: the second day is asked for; then each line each pay, as every other rhythm change
    let r = await h.go('changeBill', MAIN, { every: 'days', day: 10, from: DAY, lines: { [food]: 20000, free: 30000 } });
    ok(!r.ok && r.text === 'Pick the second day it lands', JSON.stringify(r));
    r = await h.go('changeBill', MAIN, { every: 'days', day: 10, day2: 'last', from: DAY });
    ok(!r.ok && r.text === 'Your pay will land on two days each month. How much each pay from then for Food and Free to spend?', JSON.stringify(r));
    const h2 = setup(); await h2.go('addLine', { name: 'Food', amount: 40000 }); await h2.go('setFree', { amount: 60000 });
    r = await h2.go('changeBill', MAIN, { every: 'days', day: 10, day2: 'last', from: DAY, lines: { [h2.book.plan.budgets[0].id]: 20000, free: 30000 } }); ok(r.ok, JSON.stringify(r));
    eq(h2.book.schedules.find(x => x.id === MAIN).rules.slice(-1).map(x => [x.from, x.rule]), [[DAY, { every: 'month', days: [10, 'last'] }]]);
    eq(h2.book.plan.budgets[0].steps.map(x => [x.from, x.amount]), [[null, 40000], ['2026-11-10', 20000]], 'from the pay starting the period holding the change');
    eq(view(h2.book).period.end, '2026-11-29', 'the period now ends before the pay on the last day (30 Nov)');
    // to no fixed pay: asked as an amount a month
    r = await h.go('changeBill', MAIN, { every: 'none', from: DAY });
    ok(!r.ok && r.text === 'Your pay will have no fixed day. How much a month from then for Food and Free to spend?', JSON.stringify(r));
    r = await h.go('changeBill', MAIN, { every: 'none', from: DAY, lines: { [food]: 40000, free: 60000 } }); ok(r.ok, JSON.stringify(r));
    eq(h.book.schedules.find(x => x.id === MAIN).rules.slice(-1).map(x => [x.from, x.rule]), [[DAY, { every: 'none' }]]);
    eq(h.book.plan.budgets[0].steps.length, 1, 'Food at the same amount: no new step');
    eq(h.book.plan.shares.filter(x => !x.gone).map(x => [x.from, x.per, x.free]), [[DAY, { free: 'pay' }, 60000], [DAY, { free: 'month' }, 60000]], 'Free to spend a month from the change day');
    eq(view(h.book).period, null, 'no pay periods from the change');
  });
  await t('[slice 6b] from no fixed pay to two days a month: starts with its first pay, asked each pay, a line a month becomes each pay', async () => {
    const h = setup(), MAIN = 'k7m2qa-f3n8p1x6wd-4';
    await h.go('changeBill', MAIN, { every: 'none', from: DAY });
    let r = await h.go('addLine', { name: 'Food', amount: 40000 }); ok(r.ok, JSON.stringify(r));
    eq(h.book.plan.budgets[0].per, 'month', 'with no fixed pay a line is a month');
    await h.go('setFree', { amount: 60000 });
    const food = h.book.plan.budgets[0].id;
    DAY = '2026-12-01';
    r = await h.go('changeBill', MAIN, { every: 'days', day: 15, day2: 'last', amount: 150000, from: '2026-12-01' });
    ok(!r.ok && r.text === 'Your pay will land on two days each month. How much each pay from then for Food and Free to spend?', JSON.stringify(r));
    r = await h.go('changeBill', MAIN, { every: 'days', day: 15, day2: 'last', amount: 150000, from: '2026-12-01', lines: { [food]: 20000, free: 30000 } });
    ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.id === MAIN);
    eq([s.rules.slice(-1)[0].from, s.rules.slice(-1)[0].rule, s.steps.slice(-1).map(x => [x.from, x.amount])[0], s.startsPeriod], ['2026-12-15', { every: 'month', days: [15, 'last'] }, ['2026-12-15', 150000], true]);
    eq([h.book.plan.budgets[0].per, h.book.plan.budgets[0].steps.slice(-1).map(x => [x.from, x.amount])[0]], ['pay', ['2026-12-15', 20000]]);
    eq(h.book.plan.shares.filter(x => !x.gone).slice(-1).map(x => [x.from, x.per, x.free])[0], ['2026-12-15', { free: 'pay' }, 30000]);
    eq(view(h.book).period, null, 'by the day until the first pay is ticked');
    DAY = '2026-11-25';
  });
  /* [BQ2] Free to spend set on 25 Nov (its entry from 25 Nov); the pay changed the same day to two days a month: the
     period holding the change started 10 Nov, but the new entry is written from 25 Nov, the newest entry's day, so from
     the next period it is the one in force (an entry from 10 Nov would lose to the one from 25 Nov for good). */
  await t('[slice 6b, BQ2] a rhythm change writes its entry from the later of the period start and the newest entry', async () => {
    const h = setup(), MAIN = 'k7m2qa-f3n8p1x6wd-4';
    await h.go('setFree', { amount: 60000 });
    const r = await h.go('changeBill', MAIN, { every: 'days', day: 10, day2: 'last', from: DAY, lines: { free: 30000 } }); ok(r.ok, JSON.stringify(r));
    eq(h.book.plan.shares.filter(x => !x.gone).map(x => [x.from, x.free]), [[DAY, 60000], [DAY, 30000]]);
    eq(W.linesEachMonth({ book: h.book, today: '2026-12-01' }).map(l => [l.key, l.amount]), [['free', 30000]], 'the newest entry of that day is in force (by from, then at)');
  });
  await t('[slice 6b] every 3 weeks: the day of one stepped back, the lines asked about', async () => {
    const h = setup(), MAIN = 'k7m2qa-f3n8p1x6wd-4';
    await h.go('addLine', { name: 'Food', amount: 40000 });
    let r = await h.go('changeBill', MAIN, { every: 'weeks3', start: '2026-12-18', from: '2026-12-04' });
    ok(!r.ok && r.text === 'Your pay will land every 3 weeks. How much each pay from then for Food?', JSON.stringify(r));
    r = await h.go('changeBill', MAIN, { every: 'weeks3', start: '2026-12-18', from: '2026-12-04', lines: { [h.book.plan.budgets[0].id]: 27692 } }); ok(r.ok, JSON.stringify(r));
    eq(h.book.schedules.find(x => x.id === MAIN).rules.slice(-1)[0].rule, { every: 'weeks', n: 3, from: '2026-11-27' });
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
  /* ---- slice 4 actions the assistant needs early (AI_FIRST_PLAN corrections BV5, BV2.11, BV2.12) ---- */
  await t('addPay: a second income from today on its own day; the pay that starts the period stays the same', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.go('addPay', { name: 'Tutoring', amount: 30000, every: 'month', day: 1 });
    ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.slice(-1)[0];
    stamped(s, r.step);
    eq([s.kind, s.name, s.acct, s.cur, s.shift, s.from, !!s.startsPeriod, s.rules.map(x => [x.from, x.rule]), s.steps.map(x => [x.from, x.amount])],
      ['income', 'Tutoring', BANK, 'JPY', 'before', DAY, false, [[null, { every: 'month', days: [1] }]], [[null, 30000]]]);
    const r1 = view(h.book);
    eq(r1.period.start, r0.period.start); eq(r1.daysToNextPay.next_pay, r0.daysToNextPay.next_pay);
    const again = await h.go('addPay', { name: 'tutoring', amount: 1, every: 'month', day: 2 }); ok(!again.ok && /already one/.test(again.text), JSON.stringify(again));
    const zero = await h.go('addPay', { name: 'Gig', amount: 0, every: 'month', day: 2 }); ok(!zero.ok && zero.text === 'A pay needs an amount. If it comes when it comes, pick No fixed pay', JSON.stringify(zero));
  });
  await t('addPay: no fixed day needs no amount and never starts the period; every 2 weeks steps back to a day on or before today', async () => {
    const h = setup();
    ok((await h.go('addPay', { name: 'Gigs', every: 'none' })).ok);
    let s = h.book.schedules.slice(-1)[0];
    eq([s.shift, s.rules[0].rule, s.steps[0].amount, !!s.startsPeriod], ['none', { every: 'none' }, null, false]);
    ok((await h.go('addPay', { name: 'Shifts', amount: 9000, every: 'weeks2', start: '2026-12-03' })).ok);
    s = h.book.schedules.slice(-1)[0];
    eq(s.rules[0].rule, { every: 'weeks', n: 2, from: '2026-11-19' });
  });
  await t('addPay: the first fixed pay in a book with none starts the period, lines asked each pay from its first pay (as changeBill does)', async () => {
    const h = setup(), b = h.book;
    b.schedules = b.schedules.filter(x => x.kind !== 'income');
    ok((await h.go('setFree', { amount: 40000, when: 'now' })).ok);
    eq(view(h.book).period, null, 'no pay periods yet');
    const ask = await h.go('addPay', { name: 'Pay', amount: 240000, every: 'month', day: 10 });
    ok(!ask.ok && /How much each pay from then for Free to spend/.test(ask.text), JSON.stringify(ask));
    const r = await h.go('addPay', { name: 'Pay', amount: 240000, every: 'month', day: 10, lines: { free: 40000 } });
    ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.name === 'Pay');
    eq([!!s.startsPeriod, s.shift], [true, 'before']);
    eq([s.rules.map(x => [x.from, x.rule]), s.steps.map(x => [x.from, x.amount])], [[[null, { every: 'month', days: [10] }]], [[null, 240000]]]);
    eq(h.book.plan.shares.filter(x => !x.gone).slice(-1)[0].from, '2026-12-10', 'Free to spend each pay from its first pay');
    eq(view(h.book).daysToNextPay.next_pay, '2026-12-10');
    eq(h.book.plan.shares.filter(x => !x.gone).slice(-1)[0].per, { free: 'pay' });
  });
  await t('addAccount: new money opens with its amount and a check, both today; a card or a loan is refused', async () => {
    const h = setup();
    const r = await h.go('addAccount', { name: 'Cash', type: 'cash', amount: 12000, moved: false });
    ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.slice(-1)[0], ev = h.book.events.filter(e => e.acct === a.id);
    stamped(a, r.step);
    eq([a.name, a.type, a.cur, a.owner], ['Cash', 'cash', 'JPY', null]);
    eq(ev.map(e => [e.k, e.date, e.a]), [['open', DAY, 12000], ['check', DAY, 12000]]);
    eq(h.book.events.filter(e => e.k === 'transfer'), [], 'nothing moved');
    eq(view(h.book).accounts[a.id].bank, 12000);
    for (const type of ['card', 'loan', 'paylater']) { const z = await h.go('addAccount', { name: 'X ' + type, type, amount: 1, moved: false }); ok(!z.ok, type); }
  });
  await t('addAccount: the question names the day of the main bank\'s last figure; money moved before it is not taken off again (qc-foundation F3a)', async () => {
    const h = setup(), b0 = view(h.book).accounts[BANK].bank;
    eq(b0, 286000);
    const ask = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000 });
    ok(!ask.ok && ask.text === 'Is this new money, or moved from Main bank since 20 Nov?', JSON.stringify(ask));
    /* "not moved since 20 Nov": it opens with its amount; Main bank's figure of 20 Nov already left it out */
    const r = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: false });
    ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.slice(-1)[0], v = view(h.book);
    eq([v.accounts[a.id].bank, v.accounts[BANK].bank], [50000, 286000]);
  });
  await t('addAccount: money moved since the main bank\'s last figure opens at 0 at the end of the day before the move, then one move on its day; no money lost; a day before that figure is refused (qc-foundation F3b, F3c, BV2.12)', async () => {
    const h = setup();
    const early = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true, date: '2026-11-19' });
    ok(!early.ok && /before Main bank's figure of 20 Nov/.test(early.text), JSON.stringify(early));
    const r = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true, date: '2026-11-22', min: 10000 });
    ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.slice(-1)[0];
    eq(a.minBank, { a: 10000, cur: 'JPY' });
    eq(h.book.events.filter(e => e.acct === a.id || e.acct2 === a.id).map(e => [e.k, e.acct === a.id ? 'it' : e.acct === BANK ? 'main' : e.acct, e.acct2 === a.id ? 'it' : e.acct2, e.date, e.a]),
      [['open', 'it', undefined, '2026-11-21', 0], ['check', 'it', undefined, '2026-11-21', 0], ['transfer', 'main', 'it', '2026-11-22', 50000]]);
    const v = view(h.book);
    eq([v.accounts[a.id].bank, v.accounts[BANK].bank], [50000, 236000], 'the 50,000 moved, none lost');
    /* moved today: the same */
    const h2 = setup();
    ok((await h2.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true })).ok);
    const a2 = h2.book.accounts.slice(-1)[0], v2 = view(h2.book);
    eq([v2.accounts[a2.id].bank, v2.accounts[BANK].bank], [50000, 236000], 'moved today');
    /* Undo takes all of it back */
    const h3 = setup(), r3 = await h3.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true, date: '2026-11-22' });
    ok((await h3.A.undo(r3.step.id)).ok); eq(view(h3.book).accounts[BANK].bank, 286000);
  });
  await t('the pay that starts periods moves to the pay with a fixed day: the old pay changed to no fixed pay, then addPay Job 300,000 on the 25th; periods run from the 25th (qc-foundation F4, BY)', async () => {
    const h = setup(), MAIN = h.book.schedules.find(s => s.name === 'Main job').id, SIDE = h.book.schedules.find(s => s.name === 'Side job').id;
    let r = await h.go('changeBill', SIDE, { every: 'none' }); ok(r.ok, JSON.stringify(r));
    r = await h.go('changeBill', MAIN, { every: 'none' }); ok(r.ok, JSON.stringify(r));
    eq(view(h.book).period, null, 'no fixed pay: no periods');
    r = await h.go('addPay', { name: 'Job', amount: 300000, every: 'month', day: 25 }); ok(r.ok, JSON.stringify(r));
    const job = h.book.schedules.find(s => s.name === 'Job');
    /* [BZ2] the flag moves as a dated entry on the new pay; the old pay keeps its own, so its past periods stay */
    eq(holderOn(h.book), job.id, 'the flag moved');
    eq([job.startsPeriod.map(x => [x.from, x.by]), h.book.schedules.find(s => s.id === MAIN).startsPeriod], [[[DAY, 'p3wrtd']], true]);
    eq([job.from, job.rules.map(x => [x.from, x.rule])], ['2026-11-25', [[null, { every: 'month', days: [25] }]]]);
    eq(view(h.book).daysToNextPay.next_pay, '2026-11-25', 'the Job pay is the next pay');
    /* ticked at a check-in: it starts the period from the 25th */
    const CK = require(E + 'checkin.js'), occ = job.id + '@2026-11-25';
    const out = CK.checkIn(h.book, { day: DAY, told: DAY + 'T13:00+09:00', newId: I.idMaker('p3wrck', Math.random), ticked: [occ], expected: { [occ]: 300000 }, lands: { [occ]: DAY } });
    ok((await h.A.addRecords('Check your bank', out)).ok);
    const p = L.lookahead(h.book, '2026-11-26').period;
    eq([p.start, p.end], ['2026-11-25', '2026-12-24']);
    ok((await h.A.undo(h.A.steps().slice(-1)[0].id)).ok);
    /* Undo puts the flag back where it was */
    ok((await h.A.undo(r.step.id)).ok);
    eq(holderOn(h.book), MAIN);
  });
  await t('changeBill from no fixed pay back to a day takes the flag when the pay holding it has no fixed day now (qc-foundation F4)', async () => {
    const h = setup(), MAIN = h.book.schedules.find(s => s.name === 'Main job').id, SIDE = h.book.schedules.find(s => s.name === 'Side job').id;
    ok((await h.go('changeBill', SIDE, { every: 'none' })).ok);
    ok((await h.go('changeBill', MAIN, { every: 'none' })).ok);
    const r = await h.go('changeBill', SIDE, { every: 'month', day: 25, amount: 70000 }); ok(r.ok, JSON.stringify(r));
    /* [BZ2] from its first pay on the 25th (today); before it the old pay held it */
    eq([holderOn(h.book, '2026-11-24'), holderOn(h.book), h.book.schedules.find(s => s.id === SIDE).startsPeriod.map(x => x.from)], [MAIN, SIDE, ['2026-11-25']]);
  });
  await t('addBill takes how often: a yearly 12,000 counts once a year, every 3 months 4 times; a day the month lacks is refused (qc-foundation confirm, yearly bills)', async () => {
    const S = require(E + 'schedules.js'), D = require(E + 'dates.js'), cal = S.calendar('JP');
    const count = (b, name) => { const s = b.schedules.find(x => x.name === name); return S.occurrences(s, cal, D.dayNum('2026-11-25'), D.dayNum('2027-11-24')).length; };
    const h = setup();
    let r = await h.go('addBill', { name: 'Insurance', amount: 12000, every: 'year', month: 3, day: 15 }); ok(r.ok, JSON.stringify(r));
    const s = h.book.schedules.find(x => x.name === 'Insurance');
    eq(s.rules.map(x => [x.from, x.rule]), [[null, { every: 'year', date: '03-15' }]]);
    eq(count(h.book, 'Insurance'), 1, 'once a year');
    r = await h.go('addBill', { name: 'Water', amount: 6000, every: 'months', n: 3, start: '2026-12-05' }); ok(r.ok, JSON.stringify(r));
    eq(count(h.book, 'Water'), 4);
    r = await h.go('addBill', { name: 'Gym', amount: 8000, day: 1 }); ok(r.ok);
    eq(count(h.book, 'Gym'), 12, 'a day each month as before');
    r = await h.go('addBill', { name: 'Bad', amount: 1, every: 'year', month: 2, day: 30 }); ok(!r.ok && r.why === 'bad', JSON.stringify(r));
  });
  await t('addAccount the same day the main bank was checked: moved before or after looking is asked; before is not taken off twice (qc-foundation confirm 4)', async () => {
    const CK = require(E + 'checkin.js');
    const h = setup();
    ok((await h.A.addRecords('Check your bank', CK.checkIn(h.book, { day: DAY, told: DAY + 'T09:00+09:00', newId: I.idMaker('p3wrck', Math.random), figures: { [BANK]: 286000 } }))).ok);
    const ask = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true });
    ok(!ask.ok && ask.text === 'Was it moved before or after you looked at Main bank today?', JSON.stringify(ask));
    const before = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true, afterFigure: false });
    ok(before.ok, JSON.stringify(before));
    let v = view(h.book), a = h.book.accounts.slice(-1)[0];
    eq([v.accounts[a.id].bank, v.accounts[BANK].bank], [50000, 286000], 'moved before the figure: already out of it');
    ok((await h.A.undo(before.step.id)).ok);
    const after = await h.go('addAccount', { name: 'Savings 2', type: 'bank', amount: 50000, moved: true, afterFigure: true });
    ok(after.ok, JSON.stringify(after));
    v = view(h.book); a = h.book.accounts.slice(-1)[0];
    eq([v.accounts[a.id].bank, v.accounts[BANK].bank], [50000, 236000], 'moved after the figure: taken off once');
  });
  await t('addAccount: money moved from any live bank, not only the main one (qc-foundation confirm, watch)', async () => {
    const h = setup();
    ok((await h.go('addAccount', { name: 'Second bank', type: 'bank', amount: 80000, moved: false })).ok);
    const second = h.book.accounts.slice(-1)[0].id;
    const ask = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 30000, from: second });
    ok(!ask.ok && ask.text === 'Is this new money, or moved from Second bank since today?', JSON.stringify(ask));
    const r = await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 30000, from: second, moved: true, afterFigure: true });
    ok(r.ok, JSON.stringify(r));
    const v = view(h.book), a = h.book.accounts.slice(-1)[0];
    eq([v.accounts[a.id].bank, v.accounts[second].bank, v.accounts[BANK].bank], [30000, 50000, 286000]);
    const card = await h.go('addAccount', { name: 'X', type: 'bank', amount: 1, from: CARD_A, moved: true }); ok(!card.ok && /Pick the bank the money came from/.test(card.text), JSON.stringify(card));
  });
  /* ---- [BZ2, BZ1] the job change through the named steps, and Undo after a reload (qc-foundation confirm on ai-core,
     findings 1 and 2: t5.js and t7.js) ---- */
  const CKW = require(E + 'checkin.js');
  const MAINJ = 'k7m2qa-f3n8p1x6wd-4', SIDEJ = 'k7m2qa-f3n8p1x6wd-5';
  const reloadOf = h => setup(JSON.parse(JSON.stringify(h.book)));
  async function jobLife() {
    const b = mako(); b.events = b.events.filter(e => e.k === 'open' || e.k === 'check');
    const h = setup(b);
    ok((await h.go('addLine', { name: 'Food', amount: 40000 })).ok);
    const F = h.book.plan.budgets[0].id;
    h.tick = async (day, occs) => { DAY = day; const exp = {}, lands = {}; for (const [o, a, l] of occs) { exp[o] = a; lands[o] = l; }
      const out = CKW.checkIn(h.book, { day, told: day + 'T13:00+09:00', newId: I.idMaker('p3wrck', Math.random), ticked: occs.map(x => x[0]), expected: exp, lands });
      const r = await h.A.addRecords('Check your bank', out); ok(r.ok, 'tick ' + r.text); };
    h.spend = async (day, a) => { DAY = day; const r = await h.A.logSpend({ date: day, a, acct: CARD_A, line: F }); ok(r.ok, 'spend ' + r.text); };
    await h.spend('2026-12-04', 15000);
    await h.tick('2026-12-10', [[MAINJ + '@2026-12-10', 180000, '2026-12-10'], [SIDEJ + '@2026-12-10', 60000, '2026-12-10']]);
    await h.spend('2026-12-20', 12000); await h.spend('2027-01-03', 9000);
    DAY = '2027-01-05';
    return h;
  }
  const at = (b, d) => { const r = L.lookahead(b, d, { periods: true }); return { period: r.period && [r.period.start, r.period.end], food: r.period && r.period.lines.map(l => l.left), past: (r.periods || []).map(p => [p.start, p.end, p.lines.map(l => l.left)]) }; };
  /* [M77, M36, M51] Mako's shape, a full pay period with a spend in it: each of the three choices does what its words
     say, in this period and in the next. No change counts "from today" or by the calendar month when pay has a fixed day */
  await t('[M36, M51] a line and Free to spend changed on 25 Dec, 15 days into the period 10 Dec to 7 Jan: now, next, once', async () => {
    for (const [when, nowLeft, nextFull, freeNow, freeNext] of [['now', 20000, 50000, 80000, 80000], ['next', 10000, 50000, 60000, 80000], ['once', 20000, 40000, 80000, 60000]]) {
      DAY = '2026-11-25';
      const b = mako(); b.events = b.events.filter(e => e.k === 'open' || e.k === 'check');
      const h = setup(b);
      ok((await h.go('addLine', { name: 'Food', amount: 40000 })).ok); ok((await h.go('setFree', { amount: 60000 })).ok);
      const F = h.book.plan.budgets[0].id;
      const tick = async (day, due) => { DAY = day; const o1 = MAINJ + '@' + due, o2 = SIDEJ + '@' + due;
        const out = CKW.checkIn(h.book, { day, told: day + 'T13:00+09:00', newId: I.idMaker('p3wrck', Math.random), ticked: [o1, o2], expected: { [o1]: 180000, [o2]: 60000 }, lands: { [o1]: day, [o2]: day } });
        ok((await h.A.addRecords('Check your bank', out)).ok, 'tick ' + day); };
      await tick('2026-12-10', '2026-12-10');
      DAY = '2026-12-15'; ok((await h.A.logSpend({ date: DAY, a: 30000, acct: CARD_A, line: F })).ok);
      DAY = '2026-12-25';
      let p = view(h.book).period;
      eq([p.start, p.end, p.lines[0].left, p.free.left], ['2026-12-10', '2027-01-07', 10000, 60000], when + ' before');
      ok((await h.go('changeLine', F, { amount: 50000, when })).ok); ok((await h.go('setFree', { amount: 80000, when })).ok);
      const r = view(h.book); p = r.period;
      eq([p.lines[0].left, p.free.left, r.safeToSpend.headline], [nowLeft, freeNow, freeNow], when + ' this period');
      await tick('2027-01-08', '2027-01-10');
      DAY = '2027-01-09'; p = view(h.book).period;
      eq([p.start, p.lines[0].amount, p.lines[0].left, p.free.left], ['2027-01-08', nextFull, nextFull, freeNext], when + ' next period');
    }
    DAY = '2026-11-25';
  });
  await t('[BZ2] "my job ended, the new one pays 300,000 on the 25th" on 5 Jan: end both pays, add the new one; each period follows the pay that held the flag then', async () => {
    const h = await jobLife(), before = at(h.book, '2027-01-05');
    eq(before.period, ['2026-12-10', '2027-01-07']);   // the made-up book's pay moves to the working day before since homefix (b75f0258): 10 Jan 2027 is a Sunday, so pay lands Fri 8 Jan (it was Tue 12 Jan when this test was written on lane/controls-base)
    ok((await h.go('endBill', MAINJ, {})).ok);
    eq([holderOn(h.book, '2027-01-05'), holderOn(h.book, '2027-01-06')], [MAINJ, SIDEJ], 'ending the pay holding it moves it to the other pay with a fixed day, from the day after');
    ok((await h.go('endBill', SIDEJ, {})).ok);
    const r = await h.go('addPay', { name: 'New job', amount: 300000, every: 'month', day: 25 }); ok(r.ok, JSON.stringify(r));
    const NJ = h.book.schedules.find(s => s.name === 'New job').id;
    eq(holderOn(h.book, '2027-01-06'), NJ, 'the new pay holds it after the ended ones');
    const d5 = at(h.book, '2027-01-05');
    eq([d5.period, d5.food, d5.past], [['2026-12-10', '2027-01-24'], [19000], before.past], 'on 5 Jan: this period runs to the day before the new pay; Food 19,000 left; past periods as they were');
    await h.spend('2027-01-20', 8000);
    await h.tick('2027-01-26', [[NJ + '@2027-01-25', 300000, '2027-01-25']]);
    await h.spend('2027-02-10', 7000);
    const j26 = at(h.book, '2027-01-26'), f15 = at(h.book, '2027-02-15');
    eq([j26.period, j26.food], [['2027-01-25', '2027-02-24'], [40000]], 'a new period starts with the new pay');
    eq(j26.past.slice(-1), [['2026-12-10', '2027-01-24', [11000]]], 'the period before it keeps Food 11,000 left');
    eq([f15.period, f15.food], [['2027-01-25', '2027-02-24'], [33000]]);
    DAY = '2026-11-25';
  });
  await t('[BZ1, BZ2] ending the pay holding the flag, then a reload and Undo: the end and the flag move both come back', async () => {
    const h = await jobLife();
    const r = await h.go('endBill', MAINJ, {}); ok(r.ok);
    const h2 = reloadOf(h), u = await h2.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    const m = h2.book.schedules.find(s => s.id === MAINJ), sd = h2.book.schedules.find(s => s.id === SIDEJ);
    eq([m.ends, sd.startsPeriod, holderOn(h2.book, '2027-02-01')], [undefined, undefined, MAINJ]);
    DAY = '2026-11-25';
  });
  await t('[BZ1] rent changed to 80,000, then a reload and Undo: rent is 72,000 again (t7.js)', async () => {
    const h = setup(), RENTJ = 'k7m2qa-f3n8p1x6wd-6';
    const r = await h.go('changeBill', RENTJ, { amount: 80000 }); ok(r.ok, JSON.stringify(r));
    const h2 = reloadOf(h), u = await h2.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    eq(h2.book.schedules.find(s => s.id === RENTJ).steps.map(x => [x.from, x.amount]), [[null, 72000]]);
  });
  await t('[BZ1, BZ2] an added pay that took the flag, then a reload and Undo: the pay is gone and the old pay holds the flag again (t7.js)', async () => {
    const h = setup();
    ok((await h.go('changeBill', SIDEJ, { every: 'none' })).ok); ok((await h.go('changeBill', MAINJ, { every: 'none' })).ok);
    const r = await h.go('addPay', { name: 'Job', amount: 300000, every: 'month', day: 25 }); ok(r.ok, JSON.stringify(r));
    const job = h.book.schedules.find(s => s.name === 'Job').id;
    eq(holderOn(h.book), job);
    const h2 = reloadOf(h), u = await h2.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    eq([h2.book.schedules.find(s => s.id === job).gone, holderOn(h2.book)], [DAY, MAINJ]);
  });
  await t('[E1, M13] changeAccount: a bank, cash or e-wallet renamed, and its own Keep at least set and cleared; Undo after a reload brings both back', async () => {
    const h = setup();
    const r0 = await h.go('addAccount', { name: 'Cash', type: 'cash', amount: 12000, moved: false }); ok(r0.ok, JSON.stringify(r0));
    const cash = h.book.accounts.find(a => a.name === 'Cash').id;
    const r = await h.go('changeAccount', cash, { name: 'Wallet cash', min: 2000 }); ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.find(x => x.id === cash);
    eq([a.name, a.minBank], ['Wallet cash', { a: 2000, cur: 'JPY' }]);
    eq(view(h.book).accounts[cash].bank, 12000, 'the figure is not touched');
    const r2 = await h.go('changeAccount', cash, { name: 'Wallet cash', min: null }); ok(r2.ok, JSON.stringify(r2));
    ok(!h.book.accounts.find(x => x.id === cash).minBank, 'cleared');
    const h2 = reloadOf(h); ok((await h2.A.undo(r2.step.id)).ok); ok((await h2.A.undo(r.step.id)).ok, 'undo after a reload');
    const b = h2.book.accounts.find(x => x.id === cash);
    eq([b.name, b.minBank || null], ['Cash', null]);
  });
  await t('[E1] changeAccount refuses: a name already used, an empty name, nothing changed, a card or loan, and Keep at least on the main bank (Settings, E5)', async () => {
    const h = setup();
    ok((await h.go('addAccount', { name: 'Cash', type: 'cash', amount: 12000, moved: false })).ok);
    const cash = h.book.accounts.find(a => a.name === 'Cash').id, bankName = h.book.accounts.find(a => a.id === BANK).name;
    for (const [id, x, words] of [[cash, { name: bankName }, 'There is already one called'], [cash, { name: '  ' }, 'Type a name'], [cash, { name: 'Cash' }, 'Nothing changed'],
      [CARD_A, { name: 'New' }, 'Plan, under Cards and loans'], [BANK, { name: bankName, min: 5000 }, 'Keep at least for your main bank is in Settings']]) {
      const z = await h.go('changeAccount', id, x); ok(!z.ok && z.text.includes(words), JSON.stringify([x, z.text]));
    }
    const r = await h.go('changeAccount', BANK, { name: 'Everyday bank' }); ok(r.ok, 'the main bank renames ' + JSON.stringify(r));
    eq(h.book.accounts.find(a => a.id === BANK).name, 'Everyday bank');
  });
  /* [E2, M13, M14, M45, M61] closing and removing a bank, cash or e-wallet (CONTROLS_PLAN section 3) */
  const withCash = async (h, x) => { const r = await h.go('addAccount', Object.assign({ name: 'Cash', type: 'cash', amount: 12000, moved: false }, x || {})); ok(r.ok, JSON.stringify(r)); return h.book.accounts.find(a => a.name === 'Cash' && !a.gone).id; };
  await t('[E2] closeAccount, money moved: one move of all of it to the account picked, closed today; the bank gains exactly that; Undo after a reload puts it all back', async () => {
    const h = setup(), cash = await withCash(h), bank0 = view(h.book).accounts[BANK].bank;
    const r = await h.go('closeAccount', cash, { to: BANK, now: 12000 }); ok(r.ok, JSON.stringify(r));
    const a = h.book.accounts.find(x => x.id === cash), ev = h.book.events.filter(e => !e.gone && e.grp === r.step.id);
    eq(a.closed, DAY, 'closed today');
    eq(ev.filter(e => e.k === 'transfer').map(e => [e.acct, e.acct2, e.date, e.a]), [[cash, BANK, DAY, 12000]], 'one move');
    const v = view(h.book);
    eq(v.accounts[BANK].bank, bank0 + 12000, 'the main bank gains exactly what it held');
    ok(!v.accounts[cash] || v.accounts[cash].bank === 0, 'it holds nothing');
    const h2 = reloadOf(h), u = await h2.A.undo(r.step.id); ok(u.ok, JSON.stringify(u));
    eq([h2.book.accounts.find(x => x.id === cash).closed || null, view(h2.book).accounts[cash].bank, view(h2.book).accounts[BANK].bank], [null, 12000, bank0]);
  });
  await t('[LANE J, qc-foundation controls2to5 F3, M36, M95] closing cash the app thinks holds 12,000 that really holds 5,000: asked what is in it now; 5,000 moves, the 7,000 not there counts as spent, it holds nothing; without the figure it is refused', async () => {
    const h = setup(), cash = await withCash(h), v0 = view(h.book), bank0 = v0.accounts[BANK].bank;
    const z = await h.go('closeAccount', cash, { to: BANK }); ok(!z.ok && /^Type what is in Cash now/.test(z.text), z.text);
    const r = await h.go('closeAccount', cash, { to: BANK, now: 5000 }); ok(r.ok, JSON.stringify(r));
    eq(h.book.events.filter(e => !e.gone && e.grp === r.step.id && e.k === 'transfer').map(e => [e.acct, e.acct2, e.a]), [[cash, BANK, 5000]], 'what is really there moves');
    const v = view(h.book);
    eq(v.accounts[BANK].bank, bank0 + 5000, 'the bank gains 5,000, not 12,000');
    ok(!v.accounts[cash] || v.accounts[cash].bank === 0, 'it holds nothing');
    ok(v.safeToSpend.headline <= v0.safeToSpend.headline, 'the 7,000 gap never raises safe to spend');
  });
  await t('[E2] closeAccount, money not there any more: a final check of nothing (the gap counts as spending, as at Check your bank), closed', async () => {
    const h = setup(), cash = await withCash(h), safe0 = view(h.book).safeToSpend.headline;
    const r = await h.go('closeAccount', cash, { to: 'spent' }); ok(r.ok, JSON.stringify(r));
    eq(h.book.events.filter(e => !e.gone && e.grp === r.step.id).map(e => [e.k, e.acct, e.a]), [['check', cash, 0]]);
    ok(!h.book.events.some(e => !e.gone && e.grp === r.step.id && e.k === 'transfer'), 'no move');
    eq(h.book.accounts.find(x => x.id === cash).closed, DAY);
    ok(view(h.book).safeToSpend.headline <= safe0, 'safe to spend never rises');
  });
  await t('[E2] closeAccount refuses: the main bank, one already closed, a move to itself, a card or a closed account, below zero, and a goal kept in it; a bill paid from it moves to the account picked', async () => {
    const h = setup(), cash = await withCash(h);
    const z = async (id, x, words) => { const r = await h.go('closeAccount', id, x); ok(!r.ok && r.text.includes(words), JSON.stringify([x, r.text])); };
    await z(BANK, { to: cash }, 'main bank');
    await z(cash, { to: cash }, 'Pick where its money goes');
    await z(cash, { to: CARD_A }, 'Pick where its money goes');
    await z(cash, {}, 'Pick where its money goes');
    ok((await h.go('addBill', { name: 'Gym', amount: 3000, day: 5, acct: cash })).ok);
    const gym = h.book.schedules.find(s => s.name === 'Gym').id;
    const r = await h.go('closeAccount', cash, { to: BANK, now: 12000 }); ok(r.ok, JSON.stringify(r));
    eq(h.book.schedules.find(s => s.id === gym).acct, BANK, 'the bill now comes from the account picked');
    await z(cash, { to: BANK, now: 0 }, 'already closed');
    const h3 = setup(), c3 = await withCash(h3);
    ok((await h3.A.logSpend({ date: DAY, a: 15000, acct: c3, line: 'free' })).ok);
    const r3 = await h3.go('closeAccount', c3, { to: 'spent' }); ok(!r3.ok && /below zero/.test(r3.text), r3.text);
    ok((await h3.go('closeAccount', c3, { to: BANK, now: 0 })).ok, 'with what is in it now typed, the app\'s own figure below zero does not stop it');
    const h4 = setup(); ok((await h4.go('addAccount', { name: 'Trip bank', type: 'bank', amount: 0, moved: false })).ok);
    const tb = h4.book.accounts.find(a => a.name === 'Trip bank').id;
    ok((await h4.go('addGoal', { name: 'Trip', target: 50000, mode: 'ownAccount', acct: tb })).ok, 'a goal kept in it');
    const r4 = await h4.go('closeAccount', tb, { to: BANK, now: 0 }); ok(!r4.ok && /Trip is kept in Trip bank/.test(r4.text), r4.text);
  });
  await t('[E2] reopenAccount: a closed account opens again with its history kept; refused when it is not closed', async () => {
    const h = setup(), cash = await withCash(h);
    const r = await h.go('closeAccount', cash, { to: BANK, now: 12000 }); ok(r.ok);
    const n = h.book.events.filter(e => !e.gone).length;
    const o = await h.go('reopenAccount', cash); ok(o.ok, JSON.stringify(o));
    eq([h.book.accounts.find(x => x.id === cash).closed || null, h.book.events.filter(e => !e.gone).length], [null, n], 'open, every record kept');
    const z = await h.go('reopenAccount', cash); ok(!z.ok && /not closed/.test(z.text), z.text);
  });
  await t('[E2] removeAccount: one added by mistake goes whole (its opening, its check, and the move that filled it), as if never added; one with history, a bill or the main bank is refused', async () => {
    const h = setup(), bank0 = view(h.book).accounts[BANK].bank;
    const cash = await withCash(h);
    const r = await h.go('removeAccount', cash); ok(r.ok, JSON.stringify(r));
    ok(h.book.accounts.find(x => x.id === cash).gone && h.book.events.filter(e => e.acct === cash).every(e => e.gone), 'all of it gone');
    const sv = await h.go('addAccount', { name: 'Savings2', type: 'bank', amount: 30000, moved: true, afterFigure: true });
    ok(sv.ok, JSON.stringify(sv));
    const sid = h.book.accounts.find(a => a.name === 'Savings2').id;
    eq(view(h.book).accounts[BANK].bank, bank0 - 30000, 'the move took it off the main bank');
    ok((await h.go('removeAccount', sid)).ok);
    eq(view(h.book).accounts[BANK].bank, bank0, 'removed: the move is gone too, the main bank as before');
    const c2 = await withCash(h);
    ok((await h.A.logSpend({ date: DAY, a: 500, acct: c2, line: 'free' })).ok);
    const z = await h.go('removeAccount', c2); ok(!z.ok && /Close it instead/.test(z.text), z.text);
    const z2 = await h.go('removeAccount', BANK); ok(!z2.ok && /main bank/.test(z2.text), z2.text);
    const h3 = setup(), c3 = await withCash(h3);
    ok((await h3.go('addBill', { name: 'Gym', amount: 3000, day: 5, acct: c3 })).ok);
    const z3 = await h3.go('removeAccount', c3); ok(!z3.ok && /Gym/.test(z3.text), z3.text);
    const h4 = setup(), c4 = await withCash(h4), r4 = await h4.go('removeAccount', c4), h5 = reloadOf(h4);
    ok((await h5.A.undo(r4.step.id)).ok, 'Undo after a reload');
    eq(view(h5.book).accounts[c4].bank, 12000, 'back whole');
  });
  /* [E3, M13, M27, M40] cards and loans: pay off, close, remove one added by mistake, a loan's still owed today */
  await t('[E3] payOff, worked example on Mako\'s shape (25 Nov: Main bank 286,000, Card A owes 54,000 due 10 Dec): one payment of 54,000 from Main bank today; the bank reads 232,000, Card A 0 with nothing due; safe to spend never rises; Undo after a reload puts it back', async () => {
    const h = setup(), v0 = view(h.book);
    eq([v0.accounts[BANK].bank, v0.cards[CARD_A].owedNow], [286000, 54000], 'the starting figures');
    const r = await h.go('payOff', CARD_A); ok(r.ok, JSON.stringify(r));
    eq(h.book.events.filter(e => !e.gone && e.grp === r.step.id).map(e => [e.k, e.acct, e.acct2, e.date, e.a]), [['repay', BANK, CARD_A, DAY, 54000]]);
    const v = view(h.book);
    eq([v.accounts[BANK].bank, v.cards[CARD_A].owedNow], [232000, 0]);
    ok(!v.cards[CARD_A].next || !v.cards[CARD_A].next.amount, 'nothing due on it');
    ok(v.safeToSpend.headline <= v0.safeToSpend.headline, 'safe to spend never rises');
    const z = await h.go('payOff', CARD_A); ok(!z.ok && /Nothing is owed/.test(z.text), z.text);
    const h2 = reloadOf(h); ok((await h2.A.undo(r.step.id)).ok);
    eq(view(h2.book).cards[CARD_A].owedNow, 54000);
  });
  await t('[LANE J, qc-foundation controls2to5 F1, M45] 12 Dec, Card A\'s 10 Dec payment not ticked: Pay it off and Close are refused with words (tick it first), nothing written; the loan the same', async () => {
    const was = DAY; DAY = '2026-12-12';
    try {
      const h = setup(), before = JSON.stringify(h.book);
      ok((view(h.book).cards[CARD_A].overdue || []).length, 'the 10 Dec payment is overdue');
      const z = await h.go('payOff', CARD_A); ok(!z.ok && /^Card A's 10 Dec payment is not ticked off yet: tick it at Check your bank, then try again/.test(z.text), z.text);
      const c = await h.go('closeAccount', CARD_A, {}); ok(!c.ok && /10 Dec payment is not ticked off yet/.test(c.text), c.text);
      eq(JSON.stringify(h.book), before, 'nothing written');
    } finally { DAY = was; }
  });
  await t('[LANE J, qc-foundation controls2to5 F2, M46] a card that pays a bill is not closed: it names the bill to move first', async () => {
    const h = setup();
    { const b = await h.go('addBill', { name: 'Streaming', amount: 1500, day: 5, acct: CARD_A }); ok(b.ok, JSON.stringify(b)); }
    ok((await h.go('payOff', CARD_A)).ok);
    const z = await h.go('closeAccount', CARD_A, {}); ok(!z.ok && /^Streaming is paid by Card A\. Change it to another card or account first/.test(z.text), z.text);
    ok(!h.book.accounts.find(a => a.id === CARD_A).closed, 'not closed');
  });
  await t('[LANE P, qc-foundation controls2to5 N1, M13, M46] a bill paid by the card that was removed (a cancelled subscription) does not block closing it; the removed bill stays in the list for Undo', async () => {
    const h = setup();
    { const b = await h.go('addBill', { name: 'Streaming', amount: 1500, day: 5, acct: CARD_A }); ok(b.ok, JSON.stringify(b)); }
    const sid = h.book.schedules.find(s => s.name === 'Streaming').id;
    const rm = await h.A.remove(sid); ok(rm.ok, JSON.stringify(rm));
    ok((await h.go('payOff', CARD_A)).ok);
    const r = await h.go('closeAccount', CARD_A, {}); ok(r.ok, JSON.stringify(r));
    eq(h.book.accounts.find(a => a.id === CARD_A).closed, DAY);
    const s = h.book.schedules.find(x => x.id === sid); ok(s && s.gone && s.acct === CARD_A, 'the removed bill is still kept, marked gone, for Undo');
  });
  await t('[E3] closeAccount for a card: refused while something is on it (pay it off or tick its payment first); at zero: a check of 0 and closed; its payment day stops; Reopen', async () => {
    const h = setup();
    const z = await h.go('closeAccount', CARD_A, {}); ok(!z.ok && /still has ¥54,000 on it/.test(z.text), z.text);
    ok((await h.go('payOff', CARD_A)).ok);
    const r = await h.go('closeAccount', CARD_A, {}); ok(r.ok, JSON.stringify(r));
    eq(h.book.events.filter(e => !e.gone && e.grp === r.step.id).map(e => [e.k, e.acct, e.a]), [['check', CARD_A, 0]]);
    eq(h.book.accounts.find(a => a.id === CARD_A).closed, DAY);
    ok(!view(h.book).cards[CARD_A] || !view(h.book).cards[CARD_A].next || !view(h.book).cards[CARD_A].next.amount, 'no payment due');
    ok((await h.go('reopenAccount', CARD_A)).ok, 'reopen');
  });
  await t('[E3] a loan paid off early and closed, in two steps, each with Undo (its Still owed today is not changed here: the engine reads a loan from its opening; asked of the coordinator)', async () => {
    const h = setup();
    ok((await h.go('addLoan', { name: 'Car loan', owed: 300000, amount: 20000, payDay: 27 })).ok);
    const loan = h.book.accounts.find(a => a.name === 'Car loan').id;
    const z = await h.go('closeLoan', loan); ok(!z.ok && /still owes/.test(z.text), z.text);
    const bank0 = view(h.book).accounts[BANK].bank;
    const p = await h.go('payOff', loan); ok(p.ok, JSON.stringify(p));
    eq([view(h.book).owed[loan].owedNow, view(h.book).accounts[BANK].bank], [0, bank0 - 300000]);
    const r = await h.go('closeAccount', loan, {}); ok(r.ok, JSON.stringify(r));
    eq(h.book.accounts.find(a => a.id === loan).closed, DAY);
    const h2 = reloadOf(h); ok((await h2.A.undo(r.step.id)).ok); ok((await h2.A.undo(p.step.id)).ok);
    eq([h2.book.accounts.find(a => a.id === loan).closed || null, view(h2.book).owed[loan].owedNow], [null, 300000]);
  });
  await t('[E3] removeAccount for a card or a loan added by mistake: as if never added; one with history (Card A from setup, a spend on it) is refused', async () => {
    const h = setup();
    ok((await h.go('addCard', { name: 'Oops card', owed: 5000, payDay: 15 })).ok);
    const oc = h.book.accounts.find(a => a.name === 'Oops card').id;
    const r = await h.go('removeAccount', oc); ok(r.ok, JSON.stringify(r));
    ok(h.book.accounts.find(a => a.id === oc).gone && h.book.events.filter(e => e.acct === oc).every(e => e.gone));
    ok(!view(h.book).cards[oc], 'not counted');
    const z = await h.go('removeAccount', CARD_A); ok(!z.ok && /Close it instead/.test(z.text), z.text);
    ok((await h.go('addLoan', { name: 'Oops loan', owed: 1000, amount: 100, payDay: 3 })).ok);
    const ol = h.book.accounts.find(a => a.name === 'Oops loan').id;
    ok((await h.go('removeAccount', ol)).ok, 'a loan added by mistake');
  });
  /* [E5, M13, M42] Keep at least for the main bank and the country, after setup */
  await t('[E5] setKeep: Keep at least for the main bank set, changed and cleared (never set for the person); safe to spend leaves room for it; Undo after a reload', async () => {
    const h = setup(), safe0 = view(h.book).safeToSpend.headline;
    const r = await h.go('setKeep', { min: 20000 }); ok(r.ok, JSON.stringify(r));
    eq(h.book.home.main.v, { acct: BANK, min: { a: 20000, cur: 'JPY' } });
    ok(view(h.book).safeToSpend.headline <= safe0, 'safe to spend never rises when a minimum is set');
    const z = await h.go('setKeep', { min: 20000 }); ok(!z.ok && /Nothing changed/.test(z.text), z.text);
    const c = await h.go('setKeep', { min: null }); ok(c.ok);
    eq(h.book.home.main.v.min, null);
    eq(view(h.book).safeToSpend.headline, safe0, 'cleared: as before');
    const h2 = reloadOf(h); ok((await h2.A.undo(c.step.id)).ok); eq(h2.book.home.main.v.min, { a: 20000, cur: 'JPY' });
    const b = await h.go('setKeep', { min: -5 }); ok(!b.ok, 'a negative amount is refused');
  });
  await t('[E5] setCountry: Japan, the Philippines or somewhere else; anything else refused; Undo', async () => {
    const h = setup();
    const r = await h.go('setCountry', { country: 'PH' }); ok(r.ok, JSON.stringify(r));
    eq(h.book.home.country.v, 'PH');
    const z = await h.go('setCountry', { country: 'FR' }); ok(!z.ok && /Pick/.test(z.text), z.text);
    const y = await h.go('setCountry', { country: 'PH' }); ok(!y.ok && /Nothing changed/.test(y.text));
    ok((await h.A.undo(r.step.id)).ok); eq(h.book.home.country.v, 'JP');
  });
  console.log(bad ? `plan3_write: ${bad} FAIL of ${n}` : `plan3_write: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
