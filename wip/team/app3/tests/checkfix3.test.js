#!/usr/bin/env node
/* [CHECKFIX_PLAN, slice 10] Change or remove a bank check later (plan3_write.js changeCheck, removeCheck), through act3,
   in node. MAKO_SAYS M13, M14, M6, M36, M37, M45, M47, M61. The person (M98): Kenji typed 182,400 on Saturday, it was
   128,400; another day he typed his savings figure into the main bank's box and wants that check gone. Made-up yen.
   The worked examples, by hand (coordinator 17's FB ruling, LANE L's bankInfo):
     Kenji: set up 24 Nov with 200,000 (C0), pay 300,000 on the 10th, Free to spend 100,000, nothing logged.
     C1 5 Dec typed 182,400 (really 128,400): the period to 9 Dec spent 17,600.
     C2 12 Dec, pay ticked, 420,000 (128,400 + 300,000 - 8,400 would be the truth; 182,400 + 300,000 - 62,400 as typed):
       this period spent 62,400.
     Fixed 14 Dec to 128,400: C1's gap gets +54,000 and C2's gap -54,000, both on 14 Dec: the closed period stays
       17,600, this period stays 62,400, safe to spend unchanged. 80,000 spent in all.
     C1 latest, fixed in its own period (7 Dec): spent as if 128,400 was typed: 71,600.
     B2: C1 latest, its period closed by the pay ticked on its own on 10 Dec (no figure), fixed 14 Dec: the closed
       period stays 17,600, the plus 54,000 lands in the new period. */
'use strict';
const path = require('path'), fs = require('fs');
const E = path.join(__dirname, '../../engine/');
const LA = require(E + 'lookahead.js'), CK = require(E + 'checkin.js'), BB = require(E + 'build_book.js'), P = require(E + 'periods.js'), IDS = require(E + 'ids.js'), LG = require(E + 'ledger.js'), SY = require(E + 'sync.js');
const A3 = require('../src/act3.js'), W = require('../src/plan3_write.js');
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const TZ = '+09:00';
const clone = x => JSON.parse(JSON.stringify(x));

/* a door over a book, its day moved by h.day */
function door(book, maker) {
  let b = book;
  const h = { day: '2026-11-24', get book() { return b; }, set book(x) { b = x; } };
  h.A = A3.make({ book: () => b, put: async x => { b = x; return true; }, told: () => h.day + 'T09:00:00.000' + TZ,
    newId: IDS.idMaker(maker || 'c7fx3k', Math.random), today: () => h.day, queue: { post: () => {} }, check: x => LA.lookahead(x, h.day) });
  h.go = (name, ...args) => h.A.run(name, w => W[name](w, ...args));
  h.words = (acct) => W.removeCheckWords({ book: b, today: h.day }, acct);
  /* Check your bank, as checkin3 saves it: every expected item ticked, the figures typed, fillerPlace when given */
  h.check = (day, figures, more) => {
    h.day = day;
    const r = LA.lookahead(b, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    const ticked = more && more.ticked ? more.ticked(r.checkIn.toConfirm) : r.checkIn.toConfirm.map(x => x.item);
    const out = CK.checkIn(b, Object.assign({ day, told: day + 'T12:00:00.000' + TZ, newId: IDS.idMaker(maker || 'c7fx3k', Math.random), figures, ticked, unticked: [], amounts: {}, expected, lands, landed: {} }, more && more.fillerPlace ? { fillerPlace: more.fillerPlace } : {}));
    /* an old book: the gap logged as a fixed spend with the check-in (before F2) */
    for (const g of (more && more.gapSpend) || []) out.events.push({ id: IDS.idMaker('o1dgap', Math.random)(), k: 'spend', date: day, a: g.a, acct: g.acct, line: g.line || 'free', note: 'Found at a bank check', src: { type: 'typed' }, dayInside: true, told: out.checkins[0].told, grp: out.checkins[0].id });
    return h.A.addRecords('Check your bank', out).then(x => { ok(x.ok, JSON.stringify(x)); return { ci: out.checkins[0], checks: out.events.filter(e => e.k === 'check') }; });
  };
  return h;
}
function kenji(more) {
  const out = BB.buildBook(Object.assign({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 200000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [], bills: [], free: 100000 }, more || {}), { newId: IDS.idMaker('k3n7ji') });
  const book = out.book || out;
  return { book, bank: book.accounts.find(a => a.type === 'bank').id };
}
const view = (book, day) => { const p = P.periods(book, day), sp = x => (x && x.free ? x.free.spent : null); return { old: p.past.length ? sp(p.past[p.past.length - 1]) : null, now: sp(p.current), safe: LA.lookahead(book, day).safeToSpend.headline, bank: null }; };
const checkOf = (b, id) => b.events.find(e => e.id === id);

(async () => {
  /* ---------- changeCheck ---------- */
  await t('[FB] Kenji: C1 182,400 fixed to 128,400 on 14 Dec, after C2: the closed period stays 17,600, this one 62,400, safe to spend unchanged; was, typedA; Undo puts it all back', async () => {
    const { book, bank } = kenji(), h = door(book);
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 })).checks[0];
    await h.check('2026-12-12', { [bank]: 420000 });
    h.day = '2026-12-14';
    const v0 = view(h.book, h.day);
    eq([v0.old, v0.now], [17600, 62400], 'before');
    const r = await h.go('changeCheck', c1.id, { amount: 128400 });
    ok(r.ok, JSON.stringify(r));
    const v1 = view(h.book, h.day), c = checkOf(h.book, c1.id), ci = h.book.checkins.find(k => k.id === c.grp);
    eq([v1.old, v1.now, v1.safe], [17600, 62400, v0.safe], 'after');
    eq([c.a, c.was.map(x => [x.a, x.told.slice(0, 10)]), ci.figures[0].typedA], [128400, [[182400, '2026-12-14']], 128400]);
    eq(LA.lookahead(h.book, h.day).accounts[bank].bank, 420000, 'today\'s figure is still C2\'s');
    const u = await h.A.undo(r.step.id);
    ok(u.ok, JSON.stringify(u));
    const cu = checkOf(h.book, c1.id);
    eq([cu.a, cu.was, h.book.checkins.find(k => k.id === c.grp).figures[0].typedA], [182400, undefined, 182400], 'Undo');
  });
  await t('[FB] the latest check fixed in its own period (7 Dec): spent as if 128,400 was typed, 71,600; today\'s figure follows', async () => {
    const { book, bank } = kenji(), h = door(book);
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 })).checks[0];
    h.day = '2026-12-07';
    ok((await h.go('changeCheck', c1.id, { amount: 128400 })).ok);
    eq(view(h.book, h.day).now, 71600);
    eq(LA.lookahead(h.book, h.day).accounts[bank].bank, 128400);
  });
  await t('[B2] C1 latest, its period closed by the pay ticked on its own on 10 Dec, fixed on 14 Dec: the closed period stays 17,600, the plus 54,000 lands in the new period', async () => {
    const { book, bank } = kenji(), h = door(book);
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 })).checks[0];
    await h.check('2026-12-10', {});   // the pay ticked, no figure typed
    h.day = '2026-12-14';
    const v0 = view(h.book, h.day);
    eq([v0.old, v0.now], [17600, 0]);
    ok((await h.go('changeCheck', c1.id, { amount: 128400 })).ok);
    const v1 = view(h.book, h.day);
    eq([v1.old, v1.now, v1.safe], [17600, 54000, v0.safe - 54000]);
  });
  await t('[F2 old books] C0, C1 typo and C2 each with a fixed gap spend, C1 fixed: 80,000 logged in all, 17,600 and 62,400 stay, safe to spend unchanged; the old spends are not touched', async () => {
    const { book, bank } = kenji(), h = door(book);
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 }, { gapSpend: [{ acct: bank, a: 17600 }] })).checks[0];
    await h.check('2026-12-12', { [bank]: 420000 }, { gapSpend: [{ acct: bank, a: 62400 }] });
    h.day = '2026-12-14';
    const v0 = view(h.book, h.day), spends = () => h.book.events.filter(e => e.k === 'spend' && !e.gone).map(e => e.a);
    eq([v0.old, v0.now], [17600, 62400]);
    ok((await h.go('changeCheck', c1.id, { amount: 128400 })).ok);
    const v1 = view(h.book, h.day);
    eq([v1.old, v1.now, v1.safe], [17600, 62400, v0.safe]);
    eq(spends(), [17600, 62400], '80,000 logged in all, as logged');
  });
  await t('[F2] an old book with fixed gap spends gives the same figures as the same book with fillerPlace (a line, Food)', async () => {
    const both = [];
    for (const old of [true, false]) {
      const { book, bank } = kenji();
      book.plan.budgets.push({ id: 'k3n7ji-f00dlin3xx-1', name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-24', steps: [{ from: null, amount: 40000 }], told: '2026-11-24T12:00:00.000' + TZ, at: '2026-11-24T12:00:00.000' + TZ, by: 'k3n7ji' });
      const h = door(book), F = 'k3n7ji-f00dlin3xx-1';
      await h.check('2026-12-05', { [bank]: 182400 }, old ? { gapSpend: [{ acct: bank, a: 17600, line: F }] } : { fillerPlace: { [bank]: F } });
      h.day = '2026-12-07';
      const r = LA.lookahead(h.book, h.day), p = P.periods(h.book, h.day);
      both.push([r.safeToSpend.headline, r.accounts[bank].bank, r.period.lines.map(l => [l.name, l.spent]), p.current.free.spent]);
    }
    eq(both[0], both[1]);
  });
  await t('[After confirm 2] where the gap went: changed to a line and back to Free to spend (fillerPlace), the Undo; on an old book the spend\'s line; a spend changed by hand is not overwritten', async () => {
    const { book, bank } = kenji(), F = 'k3n7ji-f00dlin3xx-1';
    book.plan.budgets.push({ id: F, name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-24', steps: [{ from: null, amount: 40000 }], told: '2026-11-24T12:00:00.000' + TZ, at: '2026-11-24T12:00:00.000' + TZ, by: 'k3n7ji' });
    const h = door(clone(book));
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 })).checks[0], ci = () => h.book.checkins.find(k => k.id === c1.grp);
    h.day = '2026-12-07';
    const r = await h.go('changeCheck', c1.id, { place: F });
    ok(r.ok, JSON.stringify(r));
    eq(ci().fillerPlace, { [bank]: F });
    eq(LA.lookahead(h.book, h.day).period.lines.map(l => [l.name, l.spent]), [['Food', 17600]]);
    ok((await h.go('changeCheck', c1.id, { place: null })).ok);
    eq(ci().fillerPlace, undefined, 'back to Free to spend');
    eq((await h.go('changeCheck', c1.id, { place: null })).text, 'Nothing changed');
    // an old book: the spend's line
    const o = door(clone(book));
    const oc = (await o.check('2026-12-05', { [bank]: 182400 }, { gapSpend: [{ acct: bank, a: 17600 }] })).checks[0];
    o.day = '2026-12-07';
    ok((await o.go('changeCheck', oc.id, { place: F })).ok);
    const sp = o.book.events.find(e => e.k === 'spend' && e.grp === oc.grp);
    eq([sp.line, sp.a, o.book.checkins.find(k => k.id === oc.grp).fillerPlace], [F, 17600, undefined]);
    // changed by hand on Receipts since: refused with words
    o.day = '2026-12-08';
    ok((await o.A.edit(sp.id, { note: 'groceries really' })).ok);
    const ref = await o.go('changeCheck', oc.id, { place: null });
    eq([ref.ok, ref.text], [false, 'The spend found at this check was changed on Receipts. Change it there']);
  });
  await t('[F1] an opening typo fixed: open.a and the check\'s a together, today\'s figure follows; a refused remove of it says to change it', async () => {
    const { book, bank } = kenji(), h = door(book);
    h.day = '2026-11-26';
    const c0 = h.book.events.find(e => e.k === 'check' && e.acct === bank);
    ok((await h.go('changeCheck', c0.id, { amount: 210000 })).ok);
    eq([h.book.events.find(e => e.k === 'open' && e.acct === bank).a, checkOf(h.book, c0.id).a], [210000, 210000]);
    eq(LA.lookahead(h.book, h.day).accounts[bank].bank, 210000);
    eq((await h.go('removeCheck', bank)).text, 'This is where Main bank started in the app. Change its figure instead');
  });
  await t('[F1] an account opened at 0 and filled by a move: its opening is changed at the move', async () => {
    const { book, bank } = kenji(), h = door(book);
    h.day = '2026-11-26';
    const id = (await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 50000, moved: true, date: '2026-11-26', afterFigure: true })).step.out;
    const c = h.book.events.find(e => e.k === 'check' && e.acct === id);
    eq((await h.go('changeCheck', c.id, { amount: 40000 })).text, 'It came from Main bank: change that move instead');
  });
  await t('statement checks refused by grp (stmt: and imp:), and a closed account', async () => {
    const { book, bank } = kenji(), h = door(book);
    h.day = '2026-12-01';
    const card = (await h.go('addCard', { name: 'Card A', owed: 30000, payDay: 27 })).step.out;
    h.book.events.push({ id: 'imp:' + card + ':ref:owed-2026-12-01', k: 'check', acct: card, date: '2026-12-01', a: 31000, told: '2026-12-01T24:00', at: '2026-12-01T09:00:00.000' + TZ, grp: 'stmt:' + card + ':2026-12-01' });
    h.book.events.push({ id: 'k3n7ji-stmtchk00x-1', k: 'check', acct: card, date: '2026-11-29', a: 31000, told: '2026-11-29T24:00', at: '2026-12-01T09:00:00.000' + TZ, grp: 'imp:k3n7ji-x' });
    eq((await h.go('changeCheck', 'imp:' + card + ':ref:owed-2026-12-01', { amount: 1 })).text, 'This figure came from your statement of 1 Dec. Change it there');
    eq((await h.go('changeCheck', 'k3n7ji-stmtchk00x-1', { amount: 1 })).text, 'This figure came from your statement of 29 Nov. Change it there');
    eq((await h.go('removeCheck', card)).text, 'This came from your statement. Remove the statement instead');
    const s = (await h.go('addAccount', { name: 'Savings', type: 'bank', amount: 10000, moved: false })).step.out;
    ok((await h.go('closeAccount', s, { to: bank })).ok);
    const sc = h.book.events.find(e => e.k === 'check' && e.acct === s);
    eq((await h.go('changeCheck', sc.id, { amount: 5 })).text, 'Reopen Savings first');
  });
  await t('[M47] a bank figure can be below zero; a card figure cannot; [gain] a change clears a held answer', async () => {
    const { book, bank } = kenji(), h = door(book);
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 })).checks[0];
    ok((await h.go('changeCheck', c1.id, { amount: -3000 })).ok);
    eq(LA.lookahead(h.book, h.day).accounts[bank].bank, -3000);
    const card = (await h.go('addCard', { name: 'Card A', owed: 30000, payDay: 27 })).step.out;
    const cc = h.book.events.find(e => e.k === 'check' && e.acct === card);
    eq((await h.go('changeCheck', cc.id, { amount: -1 })).text, 'Type what was on it, zero or more');
    checkOf(h.book, c1.id).gain = 'wrong';
    ok((await h.go('changeCheck', c1.id, { amount: 190000 })).ok);
    eq(checkOf(h.book, c1.id).gain, undefined, 'gain cleared');
    /* "Was that figure right?" Yes keeps the figure and answers right */
    checkOf(h.book, c1.id).gain = 'asked';
    ok((await h.go('changeCheck', c1.id, { right: true })).ok);
    eq([checkOf(h.book, c1.id).gain, checkOf(h.book, c1.id).a], ['right', 190000]);
  });

  /* ---------- removeCheck ---------- */
  const MAKO = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
  const BANK = 'k7m2qa-f3n8p1x6wd-1', CARD_A = 'k7m2qa-f3n8p1x6wd-2', CARD_B = 'k7m2qa-f3n8p1x6wd-3';
  await t('[section 2, FA] remove the latest bank check: the check, its old gap spend and the bills it ticked go, one goneBy, no was; the record keeps its figures and stays while Card A\'s figure is live; the question names Card A\'s payment that stays', async () => {
    const h = door(MAKO(), 'm4k0ph');
    await h.check('2026-11-28', { [BANK]: 200000 });
    const { ci, checks } = await h.check('2026-12-11', { [BANK]: 150000, [CARD_A]: 0 }, { gapSpend: [{ acct: BANK, a: 1000 }] });
    h.day = '2026-12-12';
    const before = view(h.book, h.day), ticks = h.book.events.filter(e => e.grp === ci.id && (ci.settled || []).includes(e.id));
    ok(ticks.some(e => e.k === 'repay' && e.acct2 === CARD_A) && ticks.some(e => e.k === 'repay' && e.acct2 === CARD_B) && ticks.some(e => e.k === 'in'), 'pay and both card payments ticked');
    eq(h.words(BANK), 'Remove the check of Main bank on 11 Dec? Its figure ¥150,000 goes, and the 3 payments ticked with it go back to not ticked. Card A\'s payment stays ticked: its figure was typed with it. You can Undo it');
    const r = await h.go('removeCheck', BANK);
    ok(r.ok, JSON.stringify(r));
    const by = r.step.id, rec = h.book.checkins.find(k => k.id === ci.id), bc = checks.find(c => c.acct === BANK);
    eq(checkOf(h.book, bc.id).goneBy, by);
    ok(h.book.events.filter(e => e.grp === ci.id && e.gone).every(e => e.goneBy === by && e.was === undefined), 'one goneBy, no was');
    eq(h.book.events.filter(e => e.grp === ci.id && !e.gone).map(e => [e.k, e.acct2 || e.acct]).sort(), [['check', CARD_A], ['repay', CARD_A]].sort(), 'Card A\'s figure and its payment stay');
    ok(!rec.gone && rec.figures.length === 2 && rec.settled.length === ci.settled.length, 'the record is never edited');
    eq(LA.lookahead(h.book, h.day).accounts[BANK].asOf, '2026-11-28', 'today\'s figure is the check before');
    const u = await h.A.undo(r.step.id);
    ok(u.ok);
    eq([view(h.book, h.day).now, view(h.book, h.day).safe], [before.now, before.safe], 'Undo puts every record back');
  });
  await t('[FA] remove the only figure of a check-in: the record goes too; Undo brings it back; re-ticking later takes the gone tick\'s place', async () => {
    const h = door(MAKO(), 'm4k0ph');
    const { ci } = await h.check('2026-11-28', { [BANK]: 200000 });
    h.day = '2026-11-29';
    eq(h.words(BANK), 'Remove the check of Main bank on 28 Nov? Its figure ¥200,000 goes, and the 3 payments ticked with it go back to not ticked. You can Undo it');
    const r = await h.go('removeCheck', BANK);
    ok(r.ok);
    eq(h.book.checkins.find(k => k.id === ci.id).goneBy, r.step.id);
    eq(LA.lookahead(h.book, h.day).checkIn.toConfirm.length, 3, 'the bills are to tick again');
    await h.check('2026-11-29', { [BANK]: 199000 });
    eq(LA.lookahead(h.book, h.day).checkIn.toConfirm.length, 0);
  });
  await t('[FD2 (a)] remove C1 (its gap in a closed period), check again: counted as if C1 never happened, no was', async () => {
    const run = async withC1 => {
      const { book, bank } = kenji(), h = door(book);
      if (withC1) await h.check('2026-12-05', { [bank]: 182400 });
      h.day = '2026-12-14';
      if (withC1) ok((await h.go('removeCheck', bank)).ok);
      await h.check('2026-12-14', { [bank]: 420000 });
      return view(h.book, '2026-12-14');
    };
    const a = await run(true), b = await run(false);
    eq([a.old, a.now, a.safe], [b.old, b.now, b.safe]);
    eq(a.old, 0);
  });
  await t('[B1] C1 came back on the phone (the computer checked after it), the person fixes its figure: its group is put back in the same step, then changed', async () => {
    const { book, bank } = kenji(), h = door(book, 'p4r9zz');
    const c1 = (await h.check('2026-12-05', { [bank]: 182400 })).checks[0];
    const shared = clone(h.book);
    h.day = '2026-12-06';
    ok((await h.go('removeCheck', bank)).ok);
    const comp = door(clone(shared), 'd8sk7q');
    const c2 = (await comp.check('2026-12-06', { [bank]: 120000 })).checks[0];
    eq(c2.prev, c1.id);
    h.book = SY.sync(shared, h.book, comp.book);
    ok(LA.lookahead(h.book, h.day).warnings.some(w => w.code === 'revived' && w.check === c1.id), 'the notice');
    eq(W.latestCheckOf({ book: h.book }, bank).id, c2.id);
    const r = await h.go('changeCheck', c1.id, { amount: 128400 });
    ok(r.ok, JSON.stringify(r));
    const c = checkOf(h.book, c1.id);
    eq([c.gone, c.a, h.book.checkins.find(k => k.id === c.grp).gone], [undefined, 128400, undefined]);
    eq(LA.lookahead(h.book, h.day).warnings.filter(w => w.code === 'revived'), [], 'no longer brought back: it is live');
  });
  await t('[FD1] prev from the Plan steps: closing a card writes its final check naming the check before', async () => {
    const { book } = kenji(), h = door(book);
    h.day = '2026-11-26';
    const card = (await h.go('addCard', { name: 'Card A', owed: 0, payDay: 27 })).step.out;
    const first = h.book.events.find(e => e.k === 'check' && e.acct === card);
    ok(!first.prev, 'a new card has no check before its opening');
    ok((await h.go('closeAccount', card, {})).ok);
    eq(h.book.events.filter(e => e.k === 'check' && e.acct === card).pop().prev, first.id);
  });
  await t('[FD1] a statement import: the first check names the account\'s latest, the second names the first', async () => {
    const S = require('../src/stmt3_plan.js'), { book } = kenji(), h = door(book);
    h.day = '2026-12-01';
    const card = (await h.go('addCard', { name: 'Card A', owed: 30000, payDay: 27 })).step.out;
    const first = h.book.events.find(e => e.k === 'check' && e.acct === card);
    const out = S.records(h.book, { lines: [], reads: [], merchants: [], statements: [{ id: 'imp:' + card + ':ref:stmt-2026-11-30', acct: card, close: '2026-11-30', a: 31000, file: 'a.csv' }] }, { told: '2026-12-01T09:00:00.000' + TZ, grp: 'imp:x' });
    const cs = out.events.filter(e => e.k === 'check');
    eq(cs.map(e => e.prev), [first.id, cs[0].id]);
  });
  console.log(bad ? `checkfix3: ${bad} of ${n} FAILED` : `checkfix3: ALL PASS (${n})`);
  process.exitCode = bad ? 1 : 0;
})();
