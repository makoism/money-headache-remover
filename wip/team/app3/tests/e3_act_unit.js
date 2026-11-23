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
const { actBook, WALLET, SAVINGS, LOAN, FOOD } = require('./e3_act_book.js');
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
  console.log(bad ? `e3_act_unit: ${bad} FAIL of ${n}` : `e3_act_unit: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
