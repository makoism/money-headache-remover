#!/usr/bin/env node
/* The assistant's bank and card figure with what was expected (LISTED_PLAN rules 5 to 8, N1 to N6; M1, M4, M6, M7, M12,
   M36, M37, M98). The chat core's real handle with the fake model, made-up yen. Mako's shape: Main 286,000 known, Rent
   72,000 due 27 Nov, Card A paid from Main on the 10th. On Mon 30 Nov he says "my bank shows 204,000".
   1. N1, N4: the figure is written at once (one check-in, listed none) and the result asks, in the same reply, about
      Rent with its amount and day, where to look, Yes / Not yet / I don't know, and both readings (48,000 left if it has
      gone; 24,000 over if not).
   2. Rules 5 and 7, N6: said with "rent came out, it was 73,000": one check-in, Rent ticked on 27 Nov at 73,000, listed
      [Rent]; the card names it; Undo removes the whole step.
   3. N2 Yes after the figure (afterFigure false): Rent on 27 Nov, Main 204,000, Free to spend 48,000 left, and the card
      and the result say why safe to spend rose.
   4. N2 Not yet: a check-in answering the figure, listing Rent; a later "rent came out" is dated 1 Dec with no question.
   5. N3: a later "rent came out" after the unanswered figure asks the day from the bank app; with 27 Nov it lands inside
      the figure; with I don't know (afterFigure true) the day after it.
   6. N5: a card figure asks in the card's words; F1: answered not yet, the later tick lands after the card figure.
   7. A weekly earner back after three weeks: the question names all three pays. */
'use strict';
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), I = require(E + 'ids.js'), BB = require(E + 'build_book.js'), P = require(E + 'periods.js');
const A3 = require('../src/act3.js'), K = require('../src/chat3_core.js'), FAKE = require('./fake_ai.js');
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 4).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const say = (words, calls) => ({ words, calls });
const call = (name, input) => ({ name, input });
let clock = 0;
function page(day, book) {
  const h = { day, book };
  h.deps = fake => ({
    send: fake.send, today: () => h.day, told: () => h.day + 'T1' + (clock++ % 10) + ':00:00.000+09:00', newId: I.idMaker('lst3ch', Math.random),
    book: () => h.book, mode: () => 'kept', anon: 'device0123456789', invite: 'acorn',
    door: A3.make({ book: () => h.book, put: async x => { h.book = x; return true; }, told: () => h.day + 'T19:00:00.000+09:00', newId: I.idMaker('lst3ch', Math.random), today: () => h.day, check: x => L.lookahead(x, h.day) }),
    start: async b => { h.book = b; return true; }, discard: async () => { h.book = null; return true; },
  });
  return h;
}
const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
function mako(owed) {
  const nid = I.idMaker('q7k2zx');
  return BB.buildBook({ day: '2026-11-11', told: '2026-11-11T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
    banks: [{ key: 'b', name: 'Main bank', amount: 286000, main: true, min: null }],
    pays: [{ key: 'p', name: 'Pay', bank: 'b', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [{ key: 'c', name: 'Card A', owed: owed || 0, payDay: 10, closeDay: 'not sure', payFrom: 'b', shift: 'none', inFull: true }],
    bills: [{ key: 'r', name: 'Rent', from: 'b', amount: 72000, day: 27, shift: 'none' }], free: 60000 }, { newId: nid }).book;
}
const main = b => b.accounts.find(a => a.type !== 'card').id, cardOf = b => b.accounts.find(a => a.type === 'card').id;
const rentRec = b => b.events.find(e => /^set:/.test(e.id) && e.a >= 72000 && e.a <= 73000 && e.k === 'spend');
const view = h => { const r = L.lookahead(h.book, h.day), p = P.periods(h.book, h.day).current; return { main: r.accounts[main(h.book)].bank, freeLeft: p.free.left }; };
// one turn: the person's words, the change the fake model makes (a function of the request body), what it says after
async function turnOf(h, state, words, steps) {
  let res = '';
  const f = FAKE.make([body => say('', [call('change', { steps: steps(body) })]), body => { res = FAKE.results(body)[0].text; return say('ok'); }]);
  const r = await K.turn(state, words, h.deps(f));
  return { r, res, card: (r.shown.find(x => x.who === 'card') || {}).card, state: r.state };
}
(async () => {
  await t('1. the figure is written at once with nothing listed, and the same reply asks about Rent with both readings', async () => {
    const h = page('2026-11-30', mako());
    const o = await turnOf(h, K.fresh(), 'my bank shows 204,000', b => [{ do: 'bank_figure', account: refIn(b, 'Main bank'), amount: 204000 }]);
    eq(o.card.status, 'done');
    eq(h.book.checkins.length, 1); eq(h.book.checkins[0].listed, []);
    eq(view(h), { main: 204000, freeLeft: -24000 });
    ok(/ASK NOW/.test(o.res) && /Has Rent \(¥72,000, due 27 Nov\) gone out of Main bank yet\?/.test(o.res), o.res);
    ok(/In your bank app, look at the list around 27 Nov/.test(o.res) && /Yes \/ Not yet \/ I don't know/.test(o.res), o.res);
    ok(/If Rent has gone, about ¥48,000 is left to spend, and if not, you're ¥24,000 over/.test(o.res), o.res);
  });
  await t('2. "204,000, rent came out, it was 73,000": one check-in, Rent ticked 27 Nov at 73,000, listed; Undo takes all of it', async () => {
    const h = page('2026-11-30', mako()), b0 = JSON.stringify(h.book);
    const o = await turnOf(h, K.fresh(), 'my bank shows 204,000, rent came out, it was 73,000', b => [{ do: 'bank_figure', account: refIn(b, 'Main bank'), amount: 204000, landed: [{ ref: refIn(b, 'Rent'), amount: 73000 }] }]);
    eq(o.card.status, 'done');
    eq(h.book.checkins.length, 1);
    const ci = h.book.checkins[0], r = rentRec(h.book);
    eq([ci.listed.length, r.date, r.a, r.grp === ci.id], [1, '2026-11-27', 73000, true]);
    eq(o.card.lines, ['Main bank shows ¥204,000 today, Rent ¥73,000 went on 27 Nov']);
    ok(!/ASK NOW/.test(o.res), 'nothing left to ask');
    eq(view(h), { main: 204000, freeLeft: 49000 });
    const u = await K.undo(o.state, o.r.shown.find(x => x.who === 'card').id, h.deps(FAKE.make([])));
    ok(u.ok, JSON.stringify(u));
    eq([h.book.checkins.filter(c => !c.gone).length, h.book.events.filter(e => !e.gone).length], [JSON.parse(b0).checkins.length, JSON.parse(b0).events.length]);
  });
  await t('3. Yes after the figure: Rent inside it, Main 204,000, 48,000 left, and the change card says why safe to spend rose', async () => {
    const h = page('2026-11-30', mako());
    let o = await turnOf(h, K.fresh(), 'my bank shows 204,000', b => [{ do: 'bank_figure', account: refIn(b, 'Main bank'), amount: 204000 }]);
    o = await turnOf(h, o.state, 'yes', b => [{ do: 'landed', ref: refIn(b, 'Rent'), afterFigure: false }]);
    eq(o.card.status, 'done');
    eq(rentRec(h.book).date, '2026-11-27');
    eq(view(h), { main: 204000, freeLeft: 48000 });
    ok(/^Rent was already in your bank figure \(out on 27 Nov\), so ¥48,000 is back in safe to spend$/.test(o.card.note), o.card.note);
    ok(o.res.includes(o.card.note), o.res);
  });
  await t('4. Not yet: a check-in answering the figure lists Rent; "rent came out" next day lands 1 Dec, no question', async () => {
    const h = page('2026-11-30', mako());
    let o = await turnOf(h, K.fresh(), 'my bank shows 276,000', b => [{ do: 'bank_figure', account: refIn(b, 'Main bank'), amount: 276000 }]);
    o = await turnOf(h, o.state, 'not yet', b => [{ do: 'not_yet', ref: refIn(b, 'Rent') }]);
    eq(o.card.status, 'done');
    const ans = h.book.checkins[1];
    eq([ans.listed.length, ans.answers, ans.figures.length], [1, h.book.checkins[0].id, 0]);
    h.day = '2026-12-01';
    o = await turnOf(h, o.state, 'rent came out', b => [{ do: 'landed', ref: refIn(b, 'Rent') }]);
    eq(o.card.status, 'done', o.res);
    eq(rentRec(h.book).date, '2026-12-01');
    eq(view(h), { main: 204000, freeLeft: 48000 });
  });
  await t('5. N3: "rent came out" after the unanswered figure asks the day; 27 Nov is inside, I don\'t know is the day after', async () => {
    for (const [ans, want, fig, left] of [[{ date: '2026-11-27' }, '2026-11-27', 204000, 48000], [{ afterFigure: true }, '2026-12-01', 276000, 48000]]) {
      const h = page('2026-11-30', mako());
      let o = await turnOf(h, K.fresh(), 'my bank shows ' + fig, b => [{ do: 'bank_figure', account: refIn(b, 'Main bank'), amount: fig }]);
      h.day = '2026-12-01';
      o = await turnOf(h, o.state, 'rent came out', b => [{ do: 'landed', ref: refIn(b, 'Rent') }]);
      ok(/Nothing changed/.test(o.res) && /What day does your bank app show next to Rent\? If you don't know, I'll put it after your figure of 30 Nov/.test(o.res), o.res);
      ok(!rentRec(h.book), 'nothing written yet');
      o = await turnOf(h, o.state, ans.date ? 'it says 27 Nov' : "I don't know", b => [Object.assign({ do: 'landed', ref: refIn(b, 'Rent') }, ans)]);
      eq(o.card.status, 'done', o.res);
      eq(rentRec(h.book).date, want);
      eq(view(h), { main: 204000, freeLeft: left });
    }
  });
  await t('6. a card figure asks in the card\'s words; answered not yet, the later tick lands after the card figure (F1)', async () => {
    const h = page('2026-12-11', mako(31000));
    const pay = L.lookahead(h.book, h.day).checkIn.toConfirm.find(x => x.amount === 300000);
    let o = await turnOf(h, K.fresh(), 'my pay came in', b => [{ do: 'landed', ref: refIn(b, 'Pay') }]);
    eq(o.card.status, 'done', o.res); ok(pay);
    h.day = '2026-12-12';
    o = await turnOf(h, o.state, 'Card A shows 31,000', b => [{ do: 'card_figure', account: refIn(b, 'Card A'), amount: 31000 }]);
    ok(/Has Card A's ¥31,000 bill been paid off yet\?/.test(o.res) && /In your card app/.test(o.res), o.res);
    o = await turnOf(h, o.state, 'not yet', b => [{ do: 'not_yet', ref: refIn(b, 'Card A') }]);
    eq(o.card.status, 'done', o.res);
    h.day = '2026-12-14';
    o = await turnOf(h, o.state, 'the card payment went through', b => [{ do: 'landed', ref: refIn(b, 'Card A') }]);
    eq(o.card.status, 'done', o.res);
    const rp = h.book.events.find(e => e.k === 'repay');
    eq(rp.date, '2026-12-13');
    const r = L.lookahead(h.book, h.day);
    eq([r.cards[cardOf(h.book)].owedNow, P.periods(h.book, h.day).current.free.left], [0, 60000]);
  });
  await t('7. a weekly earner back after three weeks: one question names all three pays', async () => {
    const nid = I.idMaker('w8kq2z');
    const book = BB.buildBook({ day: '2026-11-04', told: '2026-11-04T12:00:00.000+09:00', currency: 'JPY', country: 'JP',
      banks: [{ key: 'b', name: 'Bank', amount: 50000, main: true, min: null }],
      pays: [{ key: 'p', name: 'Wage', bank: 'b', amount: 60000, every: 'weeks', n: 1, start: '2026-11-02', shift: 'none', startsPeriod: true }], cards: [], bills: [], free: 30000 }, { newId: nid }).book;
    const h = page('2026-11-27', book);
    const o = await turnOf(h, K.fresh(), 'bank says 61,000', b => [{ do: 'bank_figure', account: refIn(b, 'Bank'), amount: 61000 }]);
    eq(o.card.status, 'done', o.res);
    const asks = (o.res.match(/Has Wage \(¥60,000, due \d+ Nov\) come into Bank yet\?/g) || []);
    eq(asks.length, 3, o.res);
  });
  console.log(bad ? `chat3_listed: ${bad} of ${n} FAILED` : `chat3_listed: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
