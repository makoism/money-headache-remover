#!/usr/bin/env node
/* act3, the one write door (app3/src/act3.js), in node on a made-up book (e3_act_book.js), on 25 Nov 2026.
   Each named action writes records with ids, told, at, by and grp; the engine's figures move by what was typed;
   remove and Undo only mark (`gone`, `goneBy`), never delete; Undo takes back one step and keeps later ones, and is
   refused when a later step changed the same record; a refused save or an engine refusal changes nothing; only the
   records a step touched get a new `at` (so store/idb writes only those, BD4). Every amount is made up. */
'use strict';
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), I = require(E + 'ids.js'), G = require(E + 'ledger.js'), CI = require(E + 'checkin.js');
const A3 = require('../src/act3.js');
const { actBook, WALLET, SAVINGS, LOAN, FOOD, NEW_FOOD, endedFoodBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 2).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const clone = x => JSON.parse(JSON.stringify(x));

/* a page-like holder: the book in memory, a save that can be made to fail, a message queue that records posts */
function setup(opts = {}) {
  let book = opts.book || actBook(), saves = 0;
  const posts = [];
  const h = {
    get book() { return book; }, get saves() { return saves; }, posts, failNext: false,
  };
  h.A = A3.make({
    book: () => book,
    put: async b => { if (h.failNext) { h.failNext = false; return false; } book = b; saves++; return true; },
    told: () => DAY + 'T12:00+09:00',
    newId: opts.newId || I.idMaker('t3actd', () => 0.3),
    today: () => DAY,
    queue: { post: m => posts.push(m) },
    check: b => L.lookahead(b, DAY),
  });
  return h;
}
const view = b => L.lookahead(b, DAY);
const bank = actBook().home.main.v.acct, cardA = actBook().accounts.find(a => a.name === 'Card A').id;
const ev = (b, id) => b.events.find(e => e.id === id);

(async () => {
  await t('a spend on Free to spend: one record with an ordinary id, told, at, by, grp and src typed', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.A.logSpend({ date: DAY, a: 1200, acct: bank, note: ' coffee ' });
    ok(r.ok, JSON.stringify(r));
    const id = r.step.added[0].id, e = ev(h.book, id);
    ok(I.isOrdinary(id), 'ordinary id ' + id);
    eq([e.k, e.a, e.acct, e.line, e.date, e.note, e.src], ['spend', 1200, bank, 'free', DAY, 'coffee', { type: 'typed' }]);
    eq([e.told, e.by, e.grp], [DAY + 'T12:00+09:00', 't3actd', r.step.id]);
    ok(typeof e.at === 'string' && /[+-]\d\d:\d\d$/.test(e.at), 'at with its offset ' + e.at);
    const r1 = view(h.book);
    eq(r1.period.free.left, r0.period.free.left - 1200, 'Free to spend left');
    eq(r1.safeToSpend.headline, r0.safeToSpend.headline - 1200, 'safe to spend');
    eq(h.saves, 1, 'one save');
  });
  await t('a spend on a card counts on its line, and the card owes it', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.A.logSpend({ date: DAY, a: 3000, acct: cardA, line: FOOD });
    ok(r.ok, JSON.stringify(r));
    const r1 = view(h.book);
    eq(r1.period.lines[0].left, r0.period.lines[0].left - 3000, 'Food left');
    eq(r1.cards[cardA].owedNow, r0.cards[cardA].owedNow + 3000, 'card owes');
  });
  await t('what is refused, in plain words, and nothing is saved', async () => {
    const h = setup(), before = clone(h.book);
    const cases = [
      [{ date: DAY, a: 0, acct: bank }, /above zero/], [{ date: DAY, a: -500, acct: bank }, /above zero/], [{ date: DAY, a: 12.5, acct: bank }, /above zero/],
      [{ date: '2026-11-26', a: 100, acct: bank }, /not come yet/], [{ date: '25/11', a: 100, acct: bank }, /day/],
      [{ date: DAY, a: 100, acct: 'nope' }, /Pick the account/], [{ date: DAY, a: 100, acct: LOAN }, /can not be used/],
      [{ date: DAY, a: 100, acct: bank, line: 'k7m2qa-f3n8p1x6wd-999' }, /not in your plan/],
      [{ date: DAY, a: 100, acct: bank, place: 'trip' }, /not there any more/],
    ];
    for (const [x, words] of cases) { const r = await h.A.logSpend(x); ok(!r.ok && r.why === 'bad' && words.test(r.text), JSON.stringify(x) + ' gave ' + JSON.stringify(r)); }
    const m = await h.A.moveMoney({ date: DAY, a: 100, from: bank, to: bank }); ok(!m.ok && /two different/.test(m.text), JSON.stringify(m));
    const c = await h.A.moveMoney({ date: DAY, a: 100, from: bank, to: cardA }); ok(!c.ok && /can not be used/.test(c.text), JSON.stringify(c));
    eq(h.book, before, 'book'); eq(h.saves, 0, 'saves'); eq(h.posts.length, 0, 'no Undo bar');
  });
  await t('remove marks gone with the step id and moves at; the engine stops counting it; told never changes', async () => {
    const h = setup(), r0 = view(h.book);
    const add = await h.A.logSpend({ date: DAY, a: 5000, acct: bank }), id = add.step.added[0].id, told = ev(h.book, id).told;
    const rm = await h.A.remove(id);
    ok(rm.ok, JSON.stringify(rm));
    const e = ev(h.book, id);
    eq([e.gone, e.goneBy, e.told], [DAY, rm.step.id, told]);
    ok(e.at !== add.step.at && Date.parse(e.at) >= Date.parse(add.step.at), 'at moved');
    eq(view(h.book).period.free.left, r0.period.free.left, 'Free to spend back');
    ok(h.book.events.length === actBook().events.length + 1, 'nothing deleted');
  });
  await t('Undo of a removal puts it back (both marks cleared, at moved again)', async () => {
    const h = setup();
    const add = await h.A.logSpend({ date: DAY, a: 5000, acct: bank }), id = add.step.added[0].id;
    const rm = await h.A.remove(id), goneAt = ev(h.book, id).at;
    const u = await h.A.undo(rm.step.id);
    ok(u.ok, JSON.stringify(u));
    const e = ev(h.book, id);
    ok(!('gone' in e) && !('goneBy' in e), 'marks cleared');
    ok(Date.parse(e.at) > Date.parse(goneAt), 'Undo is newer than the removal');
  });
  await t('Undo keeps later changes: log A, log B, undo A; B stays', async () => {
    const h = setup(), r0 = view(h.book);
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), b = await h.A.logSpend({ date: DAY, a: 2000, acct: WALLET });
    const u = await h.A.undo(a.step.id);
    ok(u.ok, JSON.stringify(u));
    ok(ev(h.book, a.step.added[0].id).gone === DAY && ev(h.book, a.step.added[0].id).goneBy === u.step.id, 'A gone by the Undo');
    ok(!ev(h.book, b.step.added[0].id).gone, 'B live');
    eq(view(h.book).period.free.left, r0.period.free.left - 2000, 'only B counts');
  });
  await t('an edit changes the record in place (same id and told, at moved); its Undo gives the old values back', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank, note: 'lunch' }), id = a.step.added[0].id;
    const e1 = await h.A.edit(id, { a: 1500, line: FOOD, note: '' });
    ok(e1.ok, JSON.stringify(e1));
    let e = ev(h.book, id);
    eq([e.a, e.line, 'note' in e, e.told, e.id], [1500, FOOD, false, DAY + 'T12:00+09:00', id]);
    const e2 = await h.A.edit(id, { place: 'bills' });
    ok(!e2.ok && /not there/.test(e2.text), 'a place that does not exist is refused: ' + JSON.stringify(e2));
    const u = await h.A.undo(e1.step.id);
    ok(u.ok, JSON.stringify(u));
    e = ev(h.book, id);
    eq([e.a, e.line, e.note], [1000, 'free', 'lunch']);
  });
  await t('Undo is refused when a later step changed the same record, and works once that one is undone', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), id = a.step.added[0].id;
    const e1 = await h.A.edit(id, { a: 1100 });
    const u0 = await h.A.undo(a.step.id);
    ok(!u0.ok && u0.why === 'later', JSON.stringify(u0));
    eq(ev(h.book, id).a, 1100, 'nothing changed');
    ok((await h.A.undo(e1.step.id)).ok, 'undo the edit');
    ok((await h.A.undo(a.step.id)).ok, 'then the spend');
    eq(ev(h.book, id).gone, DAY);
  });
  await t('a refund on the card given back to Food: Food left goes up, the card owes less', async () => {
    const h = setup();
    await h.A.logSpend({ date: DAY, a: 3000, acct: cardA, line: FOOD });
    const r0 = view(h.book);
    const r = await h.A.refund({ date: DAY, a: 1000, acct: cardA, line: FOOD, note: 'sent back' });
    ok(r.ok, JSON.stringify(r));
    const e = ev(h.book, r.step.added[0].id);
    eq([e.k, e.sub, e.line], ['in', 'refund', FOOD]);
    const r1 = view(h.book);
    eq(r1.period.lines[0].left, r0.period.lines[0].left + 1000, 'Food left');
    eq(r1.cards[cardA].owedNow, r0.cards[cardA].owedNow - 1000, 'card');
  });
  await t('[slice 6] money in (a client payment, a gift) to the bank: `in` with no sub, the bank goes up by it; never onto a card', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.A.moneyIn({ date: DAY, a: 25000, acct: bank, note: 'client payment' });
    ok(r.ok, JSON.stringify(r));
    const e = ev(h.book, r.step.added[0].id);
    eq([e.k, e.sub, e.line, e.acct, e.a, e.note, e.src], ['in', undefined, undefined, bank, 25000, 'client payment', { type: 'typed' }]);
    eq(view(h.book).accounts[bank].bank, r0.accounts[bank].bank + 25000, 'bank');
    ok(h.posts.some(m => /Money in logged/.test(JSON.stringify(m))), JSON.stringify(h.posts));
    const c = await h.A.moneyIn({ date: DAY, a: 500, acct: cardA });
    ok(!c.ok && /can not be used/.test(c.text), JSON.stringify(c));
  });
  await t('money moved from the bank to the wallet: a transfer; the bank goes down, the wallet up, Free to spend is the same', async () => {
    const h = setup(), r0 = view(h.book);
    const r = await h.A.moveMoney({ date: DAY, a: 4000, from: bank, to: WALLET });
    ok(r.ok, JSON.stringify(r));
    const e = ev(h.book, r.step.added[0].id);
    eq([e.k, e.acct, e.acct2, e.a, 'a2' in e], ['transfer', bank, WALLET, 4000, false]);
    const r1 = view(h.book);
    eq(r1.accounts[bank].bank, r0.accounts[bank].bank - 4000, 'bank');
    eq(r1.accounts[WALLET].bank, r0.accounts[WALLET].bank + 4000, 'wallet');
    eq(r1.period.free.left, r0.period.free.left, 'Free to spend');
    ok(G.proof(h.book).ok, 'places add up to the accounts');
  });
  await t('a save that is refused changes nothing and says so', async () => {
    const h = setup(), before = clone(h.book);
    h.failNext = true;
    const r = await h.A.logSpend({ date: DAY, a: 100, acct: bank });
    ok(!r.ok && r.why === 'save' && /could not be saved/.test(r.text), JSON.stringify(r));
    eq(h.book, before); eq(h.posts.length, 0, 'no Undo bar'); eq(h.A.steps().length, 0, 'no step');
  });
  await t('a book the engine refuses is never kept (an edit that makes a closed account hold money)', async () => {
    const h = setup();
    const b = h.book;
    b.accounts.find(a => a.id === WALLET).closed = '2026-11-21';
    b.events.push({ id: 'k7m2qa-f3n8p1x6wd-95', k: 'transfer', acct: WALLET, acct2: bank, a: 10000, date: '2026-11-21', told: '2026-11-21T10:00+09:00', at: '2026-11-21T10:00:00.000+09:00', by: 'k7m2qa' });
    L.lookahead(b, DAY);   // the closing is sound before the edit
    const before = clone(b);
    const r = await h.A.edit('k7m2qa-f3n8p1x6wd-95', { a: 9000 });
    ok(!r.ok && r.why === 'engine' && /refuses/.test(r.text), JSON.stringify(r));
    eq(h.book, before);
  });
  await t('only the records a step touched get a new at, so the store writes only those', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), mid = clone(h.book);
    const b = await h.A.edit(a.step.added[0].id, { a: 900 });
    const changed = h.book.events.filter(e => { const m = mid.events.find(x => x.id === e.id); return !m || m.at !== e.at; }).map(e => e.id);
    eq(changed, [a.step.added[0].id]);
    eq(JSON.stringify(h.book.accounts) + JSON.stringify(h.book.schedules) + JSON.stringify(h.book.plan), JSON.stringify(mid.accounts) + JSON.stringify(mid.schedules) + JSON.stringify(mid.plan));
    ok(b.ok);
  });
  await t('after a reload (a new door, no memory) Undo still finds what a step added and removed', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), x = await h.A.logSpend({ date: DAY, a: 700, acct: bank });
    const rm = await h.A.remove(x.step.added[0].id);
    const h2 = setup({ book: clone(h.book), newId: I.idMaker('t3actd', () => 0.7) });
    ok((await h2.A.undo(a.step.id)).ok, 'undo the add');
    ok((await h2.A.undo(rm.step.id)).ok, 'undo the removal');
    eq([ev(h2.book, a.step.added[0].id).gone, ev(h2.book, x.step.added[0].id).gone], [DAY, undefined]);
  });
  await t('dry gives the book an action would make, without saving or posting', async () => {
    const h = setup(), before = clone(h.book);
    const b = h.A.dry('logSpend', { date: DAY, a: 2500, acct: bank });
    eq(view(b).period.free.left, view(before).period.free.left - 2500);
    eq(h.book, before); eq(h.saves, 0); eq(h.posts.length, 0);
    let threw = null; try { h.A.dry('logSpend', { date: DAY, a: 0, acct: bank }); } catch (e) { threw = e; }
    ok(threw instanceof A3.Bad && /above zero/.test(threw.message), 'a bad draft throws its words');
  });
  await t('each step posts one Undo bar through the message queue; its button takes the step back', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }, { undo: 'Logged 1,000 on Free to spend' });
    eq(h.posts.length, 1);
    eq([h.posts[0].kind, h.posts[0].text, h.posts[0].action.label], ['undo', 'Logged 1,000 on Free to spend', 'Undo']);
    await h.posts[0].action.run();
    await new Promise(r => setTimeout(r, 10));
    eq(ev(h.book, a.step.added[0].id).gone, DAY);
    eq(h.posts[1].kind + ' ' + h.posts[1].text, 'toast Undone');
    await h.A.logSpend({ date: DAY, a: 1000, acct: bank }, { quiet: true });
    eq(h.posts.length, 2, 'quiet posts nothing');
  });
  await t('a check-in written by engine/checkin.js goes in as one step, and its Undo takes it all back', async () => {
    const h = setup(), b0 = clone(h.book);
    const r0 = view(b0), occ = r0.checkIn.toConfirm.map(o => o.item);
    const out = CI.checkIn(b0, { day: DAY, told: DAY + 'T12:00+09:00', newId: I.idMaker('t3actc', () => 0.4), figures: { [bank]: 280000 }, ticked: occ,
      expected: Object.fromEntries(r0.checkIn.toConfirm.map(o => [o.item, o.amount])), lands: Object.fromEntries(r0.checkIn.toConfirm.map(o => [o.item, o.lands])) });
    const r = await h.A.addRecords('Check your bank', out);
    ok(r.ok, JSON.stringify(r));
    eq(view(h.book).accounts[bank].bank, 280000);
    ok((await h.A.undo(r.step.id)).ok, 'undo');
    eq(view(h.book).accounts[bank].bank, r0.accounts[bank].bank);
    ok(h.book.checkins.every(c => c.gone) && out.events.every(e => ev(h.book, e.id).gone), 'all marked gone');
  });
  /* a check-in taken back with Undo leaves its `set:<occ>` records gone; a new check-in the same day writes the same
     ids. The new step writes fresh records in their place (no clash, one record each), its own Undo puts the gone ones
     back as they were, and the first step's history stays whole */
  await t('check in, Undo, check in again the same day: fresh records in place of the gone ones, each counted once', async () => {
    /* the made-up Mako book on 10 Dec: both pays, card A and the November bills to tick */
    const D = '2026-12-10', mk = JSON.parse(require('fs').readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
    const mb = mk.home.main.v.acct, at = b => L.lookahead(b, D);
    let book = mk;
    const A = A3.make({ book: () => book, put: async b => { book = b; return true; }, told: () => D + 'T12:00+09:00', newId: I.idMaker('t3actu', () => 0.3),
      today: () => D, queue: { post: () => {} }, check: b => at(b) });
    const li = at(mk).checkIn.toConfirm;
    ok(li.length >= 5, 'pays, card A and the bills to tick');
    const ci = (fig, n) => CI.checkIn(book, { day: D, told: D + 'T12:0' + n + '+09:00', newId: I.idMaker('t3actr' + n, () => 0.4), figures: { [mb]: fig }, ticked: li.map(o => o.item),
      expected: Object.fromEntries(li.map(o => [o.item, o.amount])), lands: Object.fromEntries(li.map(o => [o.item, o.lands])) });
    const a = await A.addRecords('Check your bank', ci(387000, 1));
    ok(a.ok, a.text);
    const setIds = book.events.filter(e => String(e.id).startsWith('set:') && !e.gone).map(e => e.id);
    eq(setIds.length, li.length, 'one set: record per item');
    ok((await A.undo(a.step.id)).ok, 'undo 1');
    ok(setIds.every(id => ev(book, id).gone), 'undone: the set: records are gone');
    const goneCopy = clone(setIds.map(id => ev(book, id)));
    const b = await A.addRecords('Check your bank', ci(386000, 2));
    ok(b.ok, 'the second check-in is saved: ' + b.text);
    for (const id of setIds) {
      const recs = book.events.filter(e => e.id === id);
      eq(recs.length, 1, id + ' once');
      ok(!recs[0].gone && !recs[0].goneBy && recs[0].told === D + 'T12:02+09:00', id + ' is fresh: ' + JSON.stringify(recs[0]));
    }
    const r = at(book);
    eq(r.accounts[mb].bank, 386000, 'the bank is the second figure');
    eq(r.checkIn.toConfirm.length, 0, 'every item ticked once');
    eq(r.accounts[mb].fillers.length, at(mk).accounts[mb].fillers.length + 1, 'one new check, the undone one counts nowhere');
    /* Undo of the second puts the gone records back as they were; a third check-in still works */
    ok((await A.undo(b.step.id)).ok, 'undo 2');
    const strip = x => { const y = clone(x); delete y.at; return y; };
    eq(setIds.map(id => strip(ev(book, id))), goneCopy.map(strip), 'the gone records are back as they were');
    eq(at(book).accounts[mb].bank, at(mk).accounts[mb].bank, 'the bank is the setup figure again');
    ok((await A.addRecords('Check your bank', ci(385000, 3))).ok, 'a third check-in');
    eq(at(book).accounts[mb].bank, 385000);
  });
  await t('the door never writes into the book it was given (a step works on a copy until it is saved)', async () => {
    const h = setup(), given = h.book, before = clone(given);
    await h.A.logSpend({ date: DAY, a: 1000, acct: bank });
    eq(given, before);
  });
  /* ---- [BZ1, qc-foundation finding 2] the saved Undo journal: Undo after a reload undoes edits too ---- */
  const reload = (h, r) => setup({ book: clone(h.book), newId: I.idMaker('t3actd', () => r || 0.7) });
  await t('[BZ1] each step saves a journal entry in the same save: step id, label, moment, what it added, removed and edited (old values)', async () => {
    const h = setup();
    ok(!('journal' in h.book), 'a book saved today has no journal');
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank });
    const b = await h.A.edit(a.step.added[0].id, { a: 900 });
    const c = await h.A.remove(a.step.added[0].id);
    eq(h.saves, 3, 'one save each, the journal inside it');
    eq(h.book.journal.map(j => [j.id, j.label, j.moment, j.day]), [[a.step.id, 'logSpend', a.step.at, DAY], [b.step.id, 'edit', b.step.at, DAY], [c.step.id, 'remove', c.step.at, DAY]]);
    eq(h.book.journal[0].added, [{ list: 'events', id: a.step.added[0].id }]);
    eq(h.book.journal[1].edited.map(x => [x.list, x.id, x.before.a, x.before.at]), [['events', a.step.added[0].id, 1000, a.step.at]]);
    eq(h.book.journal[2].removed.map(x => [x.list, x.id]), [['events', a.step.added[0].id]]);
  });
  await t('[BZ1] a step that only edits, then a reload, then Undo: the old value is back', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), sp = a.step.added[0].id;
    const r0 = view(h.book);
    const b = await h.A.edit(sp, { a: 900, note: 'lunch' });
    const ren = await h.A.run('Renamed', w => { w.edit('accounts', WALLET, { name: 'Purse' }); });
    ok(b.ok && ren.ok);
    const h2 = reload(h);
    const u1 = await h2.A.undo(ren.step.id);
    ok(u1.ok, JSON.stringify(u1));
    eq(h2.book.accounts.find(x => x.id === WALLET).name, 'Wallet', 'the rename undone after a reload');
    const u2 = await h2.A.undo(b.step.id);
    ok(u2.ok, JSON.stringify(u2));
    const e = ev(h2.book, sp);
    eq([e.a, 'note' in e], [1000, false], 'the old amount back, the note taken away');
    eq(view(h2.book).safeToSpend.headline, r0.safeToSpend.headline, 'safe to spend as before the edit');
    eq(h2.book.journal.filter(j => j.undone).map(j => j.id).sort(), [b.step.id, ren.step.id].sort(), 'both marked undone');
    const again = await h2.A.undo(b.step.id);
    ok(!again.ok && /undone already/.test(again.text), 'a second Undo of the same step is refused: ' + JSON.stringify(again));
  });
  await t('[BZ1] two edits of one record: after a reload the newer is undone, then the older', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), sp = a.step.added[0].id;
    const b = await h.A.edit(sp, { a: 900 }), c = await h.A.edit(sp, { a: 800 });
    const h2 = reload(h);
    const early = await h2.A.undo(b.step.id);
    ok(!early.ok && early.why === 'later', 'the older first is refused: a later step changed it');
    ok((await h2.A.undo(c.step.id)).ok, 'the newer');
    eq(ev(h2.book, sp).a, 900);
    const h3 = reload(h2, 0.9);
    ok((await h3.A.undo(b.step.id)).ok, 'then the older, after another reload');
    eq(ev(h3.book, sp).a, 1000);
  });
  /* the close shape (controls slice 5): a final check, the money moved out as `close:<account>`, `closed` on the account */
  const closeWallet = w => {
    w.add('events', { k: 'check', acct: WALLET, date: DAY, a: 10000, src: { type: 'typed' } });
    w.add('events', { id: 'close:' + WALLET, k: 'transfer', acct: WALLET, acct2: bank, date: DAY, a: 10000, src: { type: 'typed' } });
    w.edit('accounts', WALLET, { closed: DAY });
  };
  await t('[BZ1] the close shape: transfer plus close, then a reload and Undo: all of it back, nothing half done', async () => {
    const h = setup(), before = clone(h.book), r0 = view(h.book);
    const c = await h.A.run('Closed', closeWallet);
    ok(c.ok, JSON.stringify(c));
    const r1 = view(h.book);
    eq(r1.accounts[bank].bank, r0.accounts[bank].bank + 10000, 'the money moved to the bank');
    const h2 = reload(h);
    const u = await h2.A.undo(c.step.id);
    ok(u.ok, JSON.stringify(u));
    const w = h2.book.accounts.find(x => x.id === WALLET);
    ok(!('closed' in w), 'not closed');
    ok(ev(h2.book, 'close:' + WALLET).gone && c.step.added.every(x => ev(h2.book, x.id).gone), 'the transfer and the check gone');
    const r2 = view(h2.book);
    eq([r2.accounts[bank].bank, r2.accounts[WALLET].bank, r2.safeToSpend.headline], [r0.accounts[bank].bank, r0.accounts[WALLET].bank, r0.safeToSpend.headline], 'the figures as before the close');
    const strip = b => JSON.stringify(Object.assign({}, b, { journal: undefined, events: b.events.filter(e => !e.gone).map(e => e.id).sort(), accounts: b.accounts.map(x => { const y = Object.assign({}, x); delete y.at; delete y.by; return y; }) }));
    eq(strip(h2.book), strip(before), 'live records as before');
  });
  await t('[BZ1] the close shape: a later step touched the account, so Undo after a reload is refused whole and changes nothing', async () => {
    const h = setup();
    const c = await h.A.run('Closed', closeWallet);
    ok((await h.A.run('Renamed', w => { w.edit('accounts', WALLET, { name: 'Old wallet' }); })).ok);
    const h2 = reload(h), mid = clone(h2.book);
    const u = await h2.A.undo(c.step.id);
    ok(!u.ok && u.why === 'later', JSON.stringify(u));
    eq(h2.book, mid, 'nothing half done: the transfer, the check and closed all stay');
    eq(h2.saves, 0);
  });
  await t('[BZ1 migration] a step made before the journal still undoes what it can after a reload (adds and removes); an edit-only one is refused, nothing changed', async () => {
    const h = setup();
    const a = await h.A.logSpend({ date: DAY, a: 1000, acct: bank }), sp = a.step.added[0].id;
    const b = await h.A.edit(sp, { a: 900 });
    const x = await h.A.logSpend({ date: DAY, a: 700, acct: bank }), rm = await h.A.remove(x.step.added[0].id);
    const old = clone(h.book); delete old.journal;   // as a book saved before the journal
    const h2 = setup({ book: old, newId: I.idMaker('t3actd', () => 0.7) });
    const ub = await h2.A.undo(b.step.id);
    ok(!ub.ok, 'an old edit-only step cannot be found: ' + JSON.stringify(ub));
    eq(ev(h2.book, sp).a, 900, 'and nothing changed');
    ok((await h2.A.undo(rm.step.id)).ok, 'an old removal is put back');
    ok((await h2.A.undo(a.step.id)).ok, 'an old add is taken back');
    eq([ev(h2.book, sp).gone, ev(h2.book, x.step.added[0].id).gone], [DAY, undefined]);
    ok(!h2.book.journal || h2.book.journal.length === 0, 'Undo steps are not journaled: ' + JSON.stringify(h2.book.journal));
  });
  await t('[BZ1 migration] the engine reads a book with a journal the same as without one', async () => {
    const h = setup();
    await h.A.logSpend({ date: DAY, a: 1000, acct: bank });
    await h.A.run('Closed', closeWallet);
    const no = clone(h.book); delete no.journal;
    eq(JSON.stringify(view(h.book)), JSON.stringify(view(no)));
  });
  await t('[BZ1] the journal keeps the latest 200 steps', async () => {
    const h = setup();
    let first = null, last = null;
    for (let i = 0; i < 203; i++) { const r = await h.A.logSpend({ date: DAY, a: 10 + i, acct: bank }, { quiet: true }); if (!first) first = r; last = r; }
    eq(h.book.journal.length, 200);
    ok(!h.book.journal.some(j => j.id === first.step.id) && h.book.journal[199].id === last.step.id, 'the oldest dropped');
  });
  /* ---- a sheet left open (STALE_SHEET_PLAN; M61): the door takes a note of what was seen, and refuses an edit or a
     remove of a record that changed since the note. Rent is 72,000 in the made-up book. ---- */
  const RENT = actBook().schedules.find(x => x.name === 'Rent').id, POWER = actBook().schedules.find(x => x.name === 'Power').id;
  const rentOf = b => b.schedules.find(x => x.id === RENT);
  const setAmount = (w, id, a) => w.edit('schedules', id, { steps: [{ from: null, amount: a }] });
  await t('[stale sheet] a note, then the record changes, then an edit with the old note: refused, why other, nothing written', async () => {
    const h = setup(), seen = h.A.seen();
    ok((await h.A.run('changeBill', w => setAmount(w, RENT, 76000))).ok, 'the other change is kept');
    const before = JSON.stringify(h.book), saves = h.saves;
    const r = await h.A.run('changeBill', w => w.edit('schedules', RENT, { name: 'Rent flat', steps: [{ from: null, amount: 72000 }] }), { seen });
    eq([r.ok, r.why], [false, 'other']); ok(/changed somewhere else/.test(r.text), r.text);
    eq([JSON.stringify(h.book) === before, h.saves, rentOf(h.book).steps[0].amount, rentOf(h.book).name], [true, saves, 76000, 'Rent']);
  });
  await t('[stale sheet] with a fresh note the same edit is kept', async () => {
    const h = setup();
    await h.A.run('changeBill', w => setAmount(w, RENT, 76000));
    const r = await h.A.run('changeBill', w => w.edit('schedules', RENT, { name: 'Rent flat' }), { seen: h.A.seen() });
    eq([r.ok, rentOf(h.book).name, rentOf(h.book).steps[0].amount], [true, 'Rent flat', 76000]);
  });
  await t('[stale sheet] a remove with an old note is refused; an edit of another record with the same note is kept', async () => {
    const h = setup(), seen = h.A.seen();
    await h.A.run('changeBill', w => setAmount(w, RENT, 76000));
    const r = await h.A.run('endBill', w => w.remove('schedules', RENT), { seen });
    eq([r.ok, r.why, !!rentOf(h.book).gone], [false, 'other', false]);
    const r2 = await h.A.run('changeBill', w => setAmount(w, POWER, 7900), { seen });
    eq([r2.ok, h.book.schedules.find(x => x.id === POWER).steps[0].amount], [true, 7900]);
  });
  await t('[stale sheet] a record made after the note was taken: an edit of it with that note is refused; adding is never refused', async () => {
    const h = setup(), seen = h.A.seen();
    const s = await h.A.logSpend({ date: DAY, a: 1200, acct: bank, note: 'coffee' });
    const id = s.step.added[0].id;
    const r = await h.A.edit(id, { a: 1300 }, { seen });
    eq([r.ok, r.why, ev(h.book, id).a], [false, 'other', 1200]);
    const add = await h.A.logSpend({ date: DAY, a: 450, acct: bank, note: 'bun' }, { seen });
    eq(add.ok, true);
  });
  await t('[stale sheet] no note: as before; and the note does not depend on the order of the lists', async () => {
    const h = setup(), b2 = clone(h.book); b2.schedules.reverse(); b2.events.reverse();
    const h2 = setup({ book: b2 });
    eq(Object.keys(h.A.seen()).sort().map(k => [k, h.A.seen()[k]]), Object.keys(h2.A.seen()).sort().map(k => [k, h2.A.seen()[k]]));
    await h.A.run('changeBill', w => setAmount(w, RENT, 76000));
    eq((await h.A.run('changeBill', w => setAmount(w, RENT, 72000))).ok, true);
  });
  await t('[stale sheet] Undo is not touched by a note: the step that changed Rent can still be undone', async () => {
    const h = setup();
    const r = await h.A.run('changeBill', w => setAmount(w, RENT, 76000));
    eq((await h.A.undo(r.step.id)).ok, true); eq(rentOf(h.book).steps[0].amount, 72000);
  });
  /* from qc-foundation's review of the plan (qc_reports/2026-11-25_stalesheet/foundation_plan.md) */
  const share = a => ({ from: DAY, cur: 'JPY', per: { free: 'pay' }, free: a, goals: {} });
  await t('[stale sheet] Free to spend is changed by ADDING an entry: with an old note the add is refused when the list moved (30,000 open, 20,000 saved elsewhere)', async () => {
    const h = setup(), seen = h.A.seen();
    ok((await h.A.run('setFree', w => w.add('shares', share(20000)))).ok);
    const n0 = h.book.plan.shares.length;
    const r = await h.A.run('setFree', w => w.add('shares', share(30000)), { seen });
    eq([r.ok, r.why, h.book.plan.shares.length], [false, 'other', n0]);
    eq((await h.A.run('setFree', w => w.add('shares', share(30000)), { seen: h.A.seen() })).ok, true);
    const add = await h.A.run('addBill', w => w.add('schedules', { kind: 'bill', name: 'Gym', acct: bank, cur: 'JPY', rules: [{ from: null, rule: { every: 'month', days: [5] } }], steps: [{ from: null, amount: 7000 }] }), { seen });
    eq(add.ok, true, 'an add to any other list is never refused');
  });
  await t('[stale sheet] one note, two steps of the same caller on the same record: the second is kept (the note follows the caller\'s own steps)', async () => {
    const h = setup(), seen = h.A.seen();
    eq((await h.A.run('changeBill', w => w.edit('schedules', RENT, { name: 'Rent flat' }), { seen })).ok, true);
    eq((await h.A.run('changeBill', w => setAmount(w, RENT, 76000), { seen })).ok, true);
    const a = await h.A.run('setFree', w => w.add('shares', share(20000)), { seen }), id = a.step.added[0].id;
    eq((await h.A.run('setFree', w => w.edit('shares', id, { free: 25000 }), { seen })).ok, true, 'a record the caller added itself');
    await h.A.run('changeBill', w => setAmount(w, RENT, 77000));   // then someone else
    eq((await h.A.run('changeBill', w => setAmount(w, RENT, 78000), { seen })).why, 'other');
  });
  await t('[stale sheet] the whole-book mark: a step with an old mark is refused, with the mark of now it is kept; the mark does not depend on record order', async () => {
    const h = setup(), v0 = h.A.ver();
    ok(typeof v0 === 'string' && v0.length > 2 && v0.length < 24 && !/\d{5,}/.test(v0.split('.')[0]), 'short: ' + v0);
    const b2 = clone(h.book); b2.schedules.reverse(); b2.events.reverse(); b2.accounts.reverse();
    eq(setup({ book: b2 }).A.ver(), v0);
    eq((await h.A.logSpend({ date: DAY, a: 450, acct: bank, note: 'bun' }, { ver: v0 })).ok, true, 'nothing changed since the mark');
    const before = JSON.stringify(h.book);
    const r = await h.A.logSpend({ date: DAY, a: 900, acct: bank, note: 'tea' }, { ver: v0 });
    eq([r.ok, r.why, r.text, JSON.stringify(h.book) === before], [false, 'other', A3.OTHER, true]);
    eq((await h.A.logSpend({ date: DAY, a: 900, acct: bank, note: 'tea' }, { ver: h.A.ver() })).ok, true);
    ok(h.A.ver() !== v0);
  });
  await t('[stale sheet] the same thing added twice (a bill ticked in two tabs) is a plain refusal, not a crash', async () => {
    const h = setup();
    const occ = 'set:' + I.occName(RENT, '2026-11-27');
    const rec = () => ({ id: occ, k: 'settle', item: I.occName(RENT, '2026-11-27'), date: DAY, a: 72000, acct: bank });
    eq((await h.A.run('tick', w => w.add('events', rec()))).ok, true);
    const r = await h.A.run('tick', w => w.add('events', rec()));
    eq([r.ok, r.why], [false, 'bad']); ok(/there already/.test(r.text), r.text);
  });
  /* [qc-foundation second confirm on monthrule, coordinator 18; M4, M7, M27, M31, M51] Mako is paid on the 10th: Food
     (40,000) ended on 22 Nov still holds its part of this pay period (26,666), so it takes spends dated up to 9 Dec, and
     the door says so from the engine's rule (LA.lineTakes). A spend dated 10 Dec, his next pay day, is refused in plain
     words. A receipt filed to it can still be changed, but not moved to 10 Dec */
  await t('[ended line, fixed pay] Food ended 22 Nov: a spend on it dated 25 Nov is kept and comes off it; dated 10 Dec it is refused', async () => {
    const h = setup({ book: endedFoodBook() });
    const left = b => L.lookahead(b, DAY).period.lines.find(l => l.id === FOOD).left;
    eq(left(h.book), 26666);
    const r = await h.A.logSpend({ date: DAY, a: 1000, acct: bank, line: FOOD });
    ok(r.ok, JSON.stringify(r));
    eq(left(h.book), 25666, 'the old Food\'s left goes down');
    ok((await h.A.refund({ date: '2026-11-23', a: 500, acct: bank, line: FOOD })).ok, 'a refund to it is kept too');
    ok((await h.A.logSpend({ date: DAY, a: 1000, acct: bank, line: NEW_FOOD })).ok, 'the new Food takes it');
    /* on 12 Dec (the 10 Dec pay not ticked yet), a late receipt dated 9 Dec is kept, one dated 10 Dec is refused */
    let book = h.book;
    const A = A3.make({ book: () => book, put: async b => { book = b; return true; }, told: () => '2026-12-12T12:00+09:00', newId: I.idMaker('t3actx', () => 0.4),
      today: () => '2026-12-12', queue: { post: () => {} }, check: b => L.lookahead(b, '2026-12-12') });
    const before = JSON.stringify(book);
    const r10 = await A.logSpend({ date: '2026-12-10', a: 1000, acct: bank, line: FOOD });
    eq([r10.ok, r10.text, JSON.stringify(book) === before], [false, 'Food ended on 22 Nov 2026 and takes spends dated up to 9 Dec 2026. Pick another line', true]);
    ok((await A.logSpend({ date: '2026-12-09', a: 700, acct: bank, line: FOOD })).ok, 'dated 9 Dec, the last day of the pay period it ended in');
    const id = book.events.find(e => e.a === 700 && e.line === FOOD).id;
    ok((await A.edit(id, { a: 800 })).ok, 'a receipt filed to it can still be changed');
    const moved = await A.edit(id, { date: '2026-12-11' });
    eq([moved.ok, moved.text], [false, 'Food ended on 22 Nov 2026 and takes spends dated up to 9 Dec 2026. Pick another line']);
  });
  /* [qc-foundation confirm on monthrule, 26 Nov; M7, M51] Kai, no fixed pay: a line closes on its end day */
  await t('[ended line, no fixed pay] Kai\'s Food ended 22 Dec: a spend dated 22 Dec is kept, 23 Dec is refused', async () => {
    const BB = require(E + 'build_book.js'), newId = I.idMaker('k4i9pz');
    const out = BB.buildBook({ day: '2026-11-01', told: '2026-11-01T09:00:00.000+09:00', currency: 'JPY', country: 'JP',
      banks: [{ key: 'bank1', name: 'Main bank', amount: 2000000, main: true, min: null }],
      pays: [{ key: 'pay1', name: 'Work', bank: 'bank1', amount: null, every: 'none' }], cards: [], bills: [], free: 60000 }, { newId });
    let book = out.book || out;
    const kb = book.accounts.find(a => a.type === 'bank').id, food = newId(), at = '2026-12-22T20:00:00.000+09:00';
    book.plan.budgets.push({ id: food, name: 'Food', place: 'bills', cur: 'JPY', acct: kb, per: 'month', from: '2026-12-18', steps: [{ from: null, amount: 31000 }, { from: '2026-12-22', amount: 0 }], ends: '2026-12-22', told: at, at, by: 'k4i9pz' });
    const A = A3.make({ book: () => book, put: async b => { book = b; return true; }, told: () => '2026-12-24T12:00+09:00', newId: I.idMaker('t3actk', () => 0.5),
      today: () => '2026-12-24', queue: { post: () => {} }, check: b => L.lookahead(b, '2026-12-24') });
    const r = await A.logSpend({ date: '2026-12-23', a: 1000, acct: kb, line: food });
    eq([r.ok, r.text], [false, 'Food ended on 22 Dec 2026. Pick another line']);
    ok((await A.logSpend({ date: '2026-12-22', a: 1000, acct: kb, line: food })).ok, 'on the day it ended');
  });
  console.log(bad ? `e3_act_unit: ${bad} FAIL of ${n}` : `e3_act_unit: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
