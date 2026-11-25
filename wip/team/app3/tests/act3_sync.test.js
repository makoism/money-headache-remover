#!/usr/bin/env node
/* The cloud copy's answers through the one write door (foundation_review/WHICH_DOOR_PLAN.md; M61, M14, M20). The engine
   makes the answer (engine/sync.js answer, answerCheck, unchanged); act3's answerSync carries it into the book item by
   item through the writer, so it gets the door's engine check, the saved Undo journal and the queue like every other
   write. Made-up Mako book (fixtures/mako_madeup_book.json), ids as the app makes them. Amounts made up. */
'use strict';
const path = require('path'), fs = require('fs');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), I = require(E + 'ids.js'), S = require(E + 'sync.js');
const A3 = require('../src/act3.js');
const DAY = '2026-12-10';
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const clone = x => JSON.parse(JSON.stringify(x));
const mako = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const RENT = 'k7m2qa-f3n8p1x6wd-6', DEV_A = 'r4t8wq', DEV_B = 'h2n6vz';
const T1 = '2026-12-09T20:10:00.000+09:00', T2 = '2026-12-09T20:12:00.000+09:00';
/* a clash on Rent's amount: device A 75,000, device B 78,000, joined on B */
function clash(change) {
  const base = mako();
  const mine = clone(base), theirs = clone(base);
  change(mine, 'b', T2, DEV_B); change(theirs, 'a', T1, DEV_A);
  return S.sync(base, mine, theirs);
}
const rentTo = (b, w, at, by) => { const x = b.schedules.find(y => y.id === RENT); x.steps = [{ from: null, amount: w === 'a' ? 75000 : 78000 }]; Object.assign(x, { at, by }); };
const countryTo = (b, w, at, by) => { b.home.country = { v: w === 'a' ? 'GB' : 'US', at, by }; };
function door(book) {
  let b = book;
  const h = { get book() { return b; }, set book(x) { b = x; } };
  h.A = A3.make({ book: () => b, put: async x => { b = x; return true; }, told: () => DAY + 'T12:00:00.000+09:00',
    newId: I.idMaker(DEV_B, Math.random), today: () => DAY, queue: { post: () => {} }, check: x => L.lookahead(x, DAY) });
  return h;
}
const without = (b, ...keys) => { const o = clone(b); for (const k of keys) delete o[k]; return o; };
const canonJ = x => (Array.isArray(x) ? '[' + x.map(canonJ).join(',') + ']' : x && typeof x === 'object' ? '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonJ(x[k])).join(',') + '}' : JSON.stringify(x));
const canonList = b => { const o = without(b, 'journal'); for (const k of Object.keys(o)) if (Array.isArray(o[k]) && o[k].every(r => r && typeof r.id === 'string')) o[k] = o[k].filter(r => !r.gone).sort((x, y) => (x.id < y.id ? -1 : 1)); return o; };
const answerWith = (of, pick) => (book, o) => S.answer({ copy: book, of, pick, now: o ? o.now : '2026-12-10T12:00:00.000+09:00', by: o ? o.by : DEV_B });
const keptOf = (b, of) => (b.keptVersions || []).find(k => k.of === of);
const rentAmount = b => b.schedules.find(x => x.id === RENT).steps.slice(-1)[0].amount;

(async () => {
  await t('the difference: a plan item answer swaps the item and its kept record, nothing else', async () => {
    const b = clash(rentTo);
    ok(keptOf(b, RENT) && keptOf(b, RENT).ask, 'asked');
    const next = answerWith(RENT, 0)(b);
    const d = A3.syncDiff(b, next).map(x => [x.where, x.of]).sort();
    eq(d, [['keptVersions', 'kept:' + RENT], ['schedules', RENT]]);
  });
  await t('a plan item answer through the door: the book is the engine\'s answer, the question is gone, one journal entry', async () => {
    const h = door(clash(rentTo)), want = keptOf(h.book, RENT).versions[0];
    const r = await h.A.answerSync('Kept', answerWith(RENT, 0));
    ok(r.ok, JSON.stringify(r));
    eq(rentAmount(h.book), want.steps.slice(-1)[0].amount);
    eq(keptOf(h.book, RENT).ask, false);
    eq(S.afterSync(h.book).questions.filter(q => q.q === 'which').length, 0);
    const j = h.book.journal.slice(-1)[0];
    eq([j.id, j.label, j.swapped.map(x => x.of).sort()], [r.step.id, 'Kept', [RENT, 'kept:' + RENT]]);
  });
  await t('Undo right after: the question and both versions are back, the item as before, stamped newer', async () => {
    const h = door(clash(rentTo)), before = clone(h.book);
    const r = await h.A.answerSync('Kept', answerWith(RENT, 1));
    const u = await h.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    const k0 = keptOf(before, RENT), k1 = keptOf(h.book, RENT);
    eq([k1.ask, k1.versions.length], [true, k0.versions.length]);
    eq(rentAmount(h.book), rentAmount(before));
    ok(Date.parse(h.book.schedules.find(x => x.id === RENT).at) > Date.parse(before.schedules.find(x => x.id === RENT).at), 'the Undo moves at, so other devices take it');
    eq(S.afterSync(h.book).questions.filter(q => q.q === 'which').map(q => q.of), [RENT]);
  });
  await t('Undo after a reload: a new door over the saved book finds the step in the journal', async () => {
    const h = door(clash(rentTo)), amount0 = rentAmount(h.book);
    const r = await h.A.answerSync('Kept', answerWith(RENT, 1));
    const h2 = door(clone(h.book));
    const u = await h2.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    eq([rentAmount(h2.book), keptOf(h2.book, RENT).ask], [amount0, true]);
  });
  await t('Undo refused after the item changed since (a later step on Rent)', async () => {
    const h = door(clash(rentTo));
    const r = await h.A.answerSync('Kept', answerWith(RENT, 0));
    const r2 = await h.A.run('Rent changed', w => w.edit('schedules', RENT, { steps: [{ from: null, amount: 80000 }] }));
    ok(r2.ok, JSON.stringify(r2));
    const u = await h.A.undo(r.step.id);
    eq([u.ok, u.why], [false, 'later']);
    eq(rentAmount(h.book), 80000);
  });
  await t('a settings item (the country): swapped at home.country; Undo puts the question back', async () => {
    const h = door(clash(countryTo)), was = clone(h.book.home.country);
    ok(keptOf(h.book, 'home.country') && keptOf(h.book, 'home.country').ask, 'asked');
    const r = await h.A.answerSync('Kept', answerWith('home.country', 0));
    ok(r.ok, JSON.stringify(r));
    eq(A3.syncDiff(clash(countryTo), answerWith('home.country', 0)(clash(countryTo))).map(x => [x.where, x.of]).sort(), [['home', 'home.country'], ['keptVersions', 'kept:home.country']]);
    eq(h.book.home.country.v, keptOf(h.book, 'home.country').versions[0].v);
    const u = await h.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    eq([h.book.home.country.v, keptOf(h.book, 'home.country').ask], [was.v, true]);
  });
  await t('"Keep both" and "Use the other one" are the same door action', async () => {
    const h = door(clash(rentTo));
    const k = keptOf(h.book, RENT);
    if (k.both) { const r = await h.A.answerSync('Kept both', answerWith(RENT, 'both')); ok(r.ok, JSON.stringify(r)); }
    else { const r = await h.A.answerSync('Kept', answerWith(RENT, 0)); ok(r.ok, JSON.stringify(r)); }
    const other = keptOf(h.book, RENT).versions.findIndex(v => S.same(v, keptOf(h.book, RENT).versions[1]));
    const r2 = await h.A.answerSync('The other one is back', answerWith(RENT, other));
    ok(r2.ok, JSON.stringify(r2));
    eq(rentAmount(h.book), keptOf(h.book, RENT).versions[other].steps.slice(-1)[0].amount);
  });
  await t('a whole copy: the door gives the engine\'s book exactly (apart from the journal and the stamps it moves), Undo in the same visit brings the first copy back', async () => {
    const mine = mako(), cloud = clone(mine);
    cloud.events = cloud.events.concat([{ id: DEV_A + '-q7k2m9x4ws-1', k: 'spend', date: '2026-12-08', a: 1200, acct: 'k7m2qa-f3n8p1x6wd-1', line: 'free', src: { type: 'typed' }, told: T1, at: T1, by: DEV_A }]);
    const joined = S.syncDevice({ copy: mine, base: null }, { rev: 3, copy: cloud }).device.copy;
    ok(keptOf(joined, 'copy') && keptOf(joined, 'copy').ask, 'the whole copy is asked');
    const h = door(joined), before = clone(h.book);
    const next = answerWith('copy', 1)(clone(h.book));
    const r = await h.A.answerSync('Kept', answerWith('copy', 1));
    ok(r.ok, JSON.stringify(r));
    eq(canonJ(canonList(without(h.book, 'keptVersions'))), canonJ(canonList(without(next, 'keptVersions'))));
    eq(keptOf(h.book, 'copy').ask, false);
    const u = await h.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    eq(h.book.events.length, before.events.length);
  });
  await t('[F1] a whole copy: a record of the copy not kept is marked gone (never taken out), stamped, so a reload and a join keep it gone; Undo marks back', async () => {
    const mine = mako(), cloud = clone(mine), SP = DEV_A + '-q7k2m9x4ws-1';
    cloud.events = cloud.events.concat([{ id: SP, k: 'spend', date: '2026-12-08', a: 1200, acct: 'k7m2qa-f3n8p1x6wd-1', line: 'free', src: { type: 'typed' }, told: T1, at: T1, by: DEV_A }]);
    const h = door(S.syncDevice({ copy: mine, base: null }, { rev: 3, copy: cloud }).device.copy);
    const own = keptOf(h.book, 'copy').versions.findIndex(v => !v.events.some(e => e.id === SP));
    const r = await h.A.answerSync('Kept', answerWith('copy', own));
    ok(r.ok, JSON.stringify(r));
    const e = h.book.events.find(x => x.id === SP);
    ok(e && e.gone && e.goneBy === r.step.id, 'marked gone: ' + JSON.stringify(e));
    ok(Date.parse(e.at) > Date.parse(T1), 'stamped');
    eq(h.book.journal.slice(-1)[0].swapped.every(x => x.big), true, 'the whole copy keeps no old values in the journal');
    const u = await h.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    ok(!h.book.events.find(x => x.id === SP).gone, 'back after Undo');
    const r2 = await h.A.answerSync('Kept', answerWith('copy', own));
    const u2 = await door(clone(h.book)).A.undo(r2.step.id);
    eq([u2.ok, /only until the app is closed/.test(u2.text)], [false, true]);
  });
  await t('an answer the engine refuses is not saved, in plain words', async () => {
    const h = door(clash(rentTo)), before = clone(h.book);
    h.A2 = A3.make({ book: () => h.book, put: async x => { h.book = x; return true; }, told: () => DAY + 'T12:00:00.000+09:00',
      newId: I.idMaker(DEV_B, Math.random), today: () => DAY, queue: { post: () => {} }, check: () => { throw new Error('made-up refusal'); } });
    const r = await h.A2.answerSync('Kept', answerWith(RENT, 0));
    eq([r.ok, r.why], [false, 'engine']);
    eq(h.book, before);
  });
  await t('the same answer on the book with its lists reversed writes the same swaps', async () => {
    const b = clash(rentTo), rev = clone(b);
    for (const k of Object.keys(rev)) if (Array.isArray(rev[k])) rev[k].reverse();
    const d = x => A3.syncDiff(x, answerWith(RENT, 0)(x)).map(s => [s.where, s.of]).sort();
    eq(d(rev), d(b));
  });
  await t('a check answer (the minimum, when asked) goes through the same door', async () => {
    const qs = S.afterSync(clash(rentTo)).questions.filter(q => q.q !== 'which');
    ok(qs.length === 0, 'no check question in this clash: the check answers are checked through e3_cloudwhich and the page');
  });
  console.log(bad ? `act3_sync: ${bad} of ${n} FAILED` : `act3_sync: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
