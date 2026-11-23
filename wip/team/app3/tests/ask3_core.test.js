#!/usr/bin/env node
/* Ask, the pure half (app3/src/ask3_core.js), in node, on the made-up Mako book with a plan (a Food line, Free to spend,
   a Trip goal with money set aside) on Wed 25 Nov 2026 (period 10 Nov to 9 Dec). No AI is called: the AI's answers are
   made-up recorded replies. What is checked:
   1. The summary sent to the AI: the engine's figures in plain words, short refs (A1, L1, G1) and never a record id,
      no notes, no shop names, no single spends; and it stays short.
   2. A reply's proposed changes are checked against the book and turned into steps in plain words; anything not
      understood is left out and said; the AI's refs never reach a record unless they are in the summary's refs.
   3. The steps run through act3 (the one write door), each as one named step; a step refused by act3 takes back the
      ones before it; Undo takes back all of them; the preview gives the engine's figures before and after. */
'use strict';
const path = require('path'), fs = require('fs');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), I = require(E + 'ids.js');
const A3 = require('../src/act3.js'), W = require('../src/plan3_write.js'), K = require('../src/ask3_core.js');
const DAY = '2026-11-25';
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const mako = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const BANK = 'k7m2qa-f3n8p1x6wd-1', CARD_A = 'k7m2qa-f3n8p1x6wd-2';
function door(start) {
  let b = start;
  const h = { get book() { return b; }, ctx: null };
  h.A = A3.make({ book: () => b, put: async x => { b = x; return true; }, told: () => DAY + 'T12:00+09:00',
    newId: I.idMaker('ask3te', Math.random), today: () => DAY, queue: { post: () => {} }, check: x => L.lookahead(x, DAY) });
  return h;
}
/* the book with a plan, made through the Plan tab's own steps, and one coffee with a note and a shop name */
async function planned() {
  const h = door(mako());
  await h.A.run('l', w => W.addLine(w, { name: 'Food', amount: 30000 }));
  await h.A.run('f', w => W.setFree(w, { amount: 20000, when: 'now' }));
  await h.A.run('g', w => W.addGoal(w, { name: 'Trip', target: 100000, due: '2027-06-01' }));
  await h.A.run('s', w => W.setAside(w, h.book.places[0].id, { amount: 10000 }));
  await h.A.logSpend({ date: DAY, a: 1200, acct: BANK, line: h.book.plan.budgets[0].id, note: 'secret coffee at Blue Door' });
  return h;
}
const ctxOf = h => ({ book: h.book, today: DAY });

(async () => {
  const h0 = await planned();
  const S = K.summary(h0.book, DAY);
  const r = L.lookahead(h0.book, DAY);
  await t('the summary: the engine\'s figures in plain words, as the app writes them', async () => {
    ok(S.text.includes('Today is 25 Nov 2026'), 'today');
    ok(S.text.includes('Currency: JPY'), 'currency');
    ok(S.text.includes('This pay period: 10 Nov to 9 Dec'), 'period');
    ok(S.text.includes('Next pay: 10 Dec'), 'next pay');
    ok(S.text.includes('Safe to spend until next pay: ¥' + r.safeToSpend.headline.toLocaleString('en')), 'safe ' + r.safeToSpend.headline);
    ok(S.text.includes('A1 | Main bank | bank | ¥284,800'), 'bank');
    ok(S.text.includes('L1 | Food | ¥20,000 (part of ¥30,000 a period, for the days left) | ¥18,800 left'), 'line');   // [QC F5] 20 of 30 days count
    ok(S.text.includes('Free to spend this pay period: ¥13,333 (part of ¥20,000 a period, for the days left), ¥13,333 left'), 'free ' + (S.text.match(/Free to spend this[^\n]*/) || [])[0]);
    ok(S.text.includes('G1 | Trip | ¥10,000 set aside of ¥100,000 | by 1 Jun 2027 | ¥15,000 each pay period to get there'), 'goal');
    ok(S.text.includes('Rent 27 Nov ¥72,000'), 'due');
    ok(S.text.includes('Card A | ¥54,000 owed | next payment ¥54,000 on 10 Dec'), 'card');
  });
  await t('the summary never carries a record id, a note, a shop name or a single spend; and it is short', async () => {
    const ids = [].concat(...['accounts', 'schedules', 'places', 'events', 'checkins'].map(k => (h0.book[k] || []).map(x => x.id)), h0.book.plan.budgets.map(x => x.id), h0.book.plan.shares.map(x => x.id));
    const found = ids.filter(id => S.text.includes(id));
    eq(found, [], 'ids in the summary');
    ok(!/coffee|Blue Door|secret/i.test(S.text), 'note or shop');
    ok(!/1,200/.test(S.text), 'a single spend');
    ok(S.text.length < 2000, 'length ' + S.text.length);
    eq(S.refs, { A1: BANK, A2: CARD_A, A3: 'k7m2qa-f3n8p1x6wd-3', L1: h0.book.plan.budgets[0].id, G1: h0.book.places[0].id });
  });
  await t('the request: the guide, the summary, the question, the last turns only, and the answer\'s fixed shape', async () => {
    const turns = [];
    for (let i = 0; i < 8; i++) turns.push({ q: 'old question ' + i, a: 'old answer ' + i });
    const rq = K.request(S.text, 'Can I afford a 9,000 yen dinner?', turns);
    ok(rq.prompt.includes(S.text) && rq.prompt.includes('Can I afford a 9,000 yen dinner?'), 'summary and question');
    ok(!rq.prompt.includes('old question 3') && rq.prompt.includes('old question 4') && rq.prompt.includes('old answer 7'), 'last four turns');
    ok(/never change anything yourself/i.test(rq.prompt), 'the AI never writes');
    eq(rq.name, 'money_answer'); eq(rq.schema.required, ['answer', 'actions']);
    eq(rq.schema.properties.actions.items.properties.do.enum, ['log_spend', 'change_line', 'set_free', 'set_aside']);
  });
  await t('a plain answer: no steps', async () => {
    const c = K.check({ answer: 'Yes. Safe to spend is 13,333 until 10 Dec.', actions: [] }, S.refs, ctxOf(h0));
    eq(c.steps, []); eq(c.dropped, []); eq(c.answer, 'Yes. Safe to spend is 13,333 until 10 Dec.');
  });
  await t('each kind of change becomes a step in plain words', async () => {
    const c = K.check({ answer: 'Done.', actions: [
      { do: 'log_spend', amount: 9000, line: 'L1', note: 'dinner' },
      { do: 'change_line', line: 'L1', amount: 25000 },
      { do: 'set_free', amount: 15000, when: 'next' },
      { do: 'set_aside', goal: 'G1', amount: 5000 }] }, S.refs, ctxOf(h0));
    eq(c.dropped, []);
    eq(c.steps.map(s => s.text), [
      'Log a spend of ¥9,000 on Food from Main bank, today (dinner)',
      'Food: ¥30,000 to ¥25,000 each pay period, from this pay period',
      'Free to spend: ¥20,000 to ¥15,000 each pay period, from the next pay period',
      'Set aside ¥5,000 for Trip, today']);
  });
  await t('what is not understood is left out and said: unknown refs, raw ids, bad amounts, a day not come yet, unknown kinds', async () => {
    const c = K.check({ answer: 'x', actions: [
      { do: 'log_spend', amount: -5 }, { do: 'log_spend', amount: 'lots' },
      { do: 'change_line', line: h0.book.plan.budgets[0].id, amount: 100 },
      { do: 'set_aside', goal: 'G9', amount: 100 },
      { do: 'log_spend', amount: 100, date: '2026-12-01' },
      { do: 'delete_everything' }, null] }, S.refs, ctxOf(h0));
    eq(c.steps.length, 0, 'no steps');
    eq(c.dropped.length, 7, JSON.stringify(c.dropped));
  });
  await t('a spend from a card by its ref, on a day before today; a ref the summary gave', async () => {
    const c = K.check({ answer: 'x', actions: [{ do: 'log_spend', amount: '2,500', account: 'A2', date: '2026-11-23' }] }, S.refs, ctxOf(h0));
    eq(c.steps.map(s => s.text), ['Log a spend of ¥2,500 on Free to spend from Card A, 23 Nov']);
  });
  await t('at most four changes at a time', async () => {
    const c = K.check({ answer: 'x', actions: Array.from({ length: 6 }, () => ({ do: 'set_aside', goal: 'G1', amount: 100 })) }, S.refs, ctxOf(h0));
    eq(c.steps.length, 4); eq(c.dropped.length, 2);
  });
  await t('the preview: the engine\'s figures before and after, on a copy; the book is not touched', async () => {
    const h = await planned(), before = JSON.stringify(h.book);
    const c = K.check({ answer: 'x', actions: [{ do: 'log_spend', amount: 9000, line: 'L1' }, { do: 'set_aside', goal: 'G1', amount: 5000 }] }, K.summary(h.book, DAY).refs, ctxOf(h));
    const p = await K.preview(h.book, c.steps, { today: DAY, told: () => DAY + 'T12:00+09:00', newId: I.idMaker('ask3pv', Math.random) });
    eq(JSON.stringify(h.book), before, 'book untouched');
    ok(p.ok, p.text);
    const rb = L.lookahead(h.book, DAY);
    const row = k => p.rows.find(x => x.key === k);
    eq([row('safe').before, row('safe').after], [rb.safeToSpend.headline, p.view.safeToSpend.headline]);
    eq([row('line:L1').label, row('line:L1').before, row('line:L1').after], ['Food left', 18800, 9800]);
    eq([row('goal:G1').label, row('goal:G1').before, row('goal:G1').after], ['Trip set aside', 10000, 15000]);
  });
  await t('the preview says when act3 would refuse a step', async () => {
    const h = await planned();
    const c = K.check({ answer: 'x', actions: [{ do: 'change_line', line: 'L1', amount: 25000 }] }, K.summary(h.book, DAY).refs, ctxOf(h));
    await h.A.run('rm', w => w.remove('budgets', h.book.plan.budgets[0].id));
    const p = await K.preview(h.book, c.steps, { today: DAY, told: () => DAY + 'T12:00+09:00', newId: I.idMaker('ask3pv', Math.random) });
    ok(!p.ok && /Food/.test(p.text), JSON.stringify(p));
  });
  await t('apply: each step through act3, named; Undo all takes every one back and keeps a later change', async () => {
    const h = await planned(), refs = K.summary(h.book, DAY).refs, n0 = h.book.events.length;
    const c = K.check({ answer: 'x', actions: [{ do: 'log_spend', amount: 9000, line: 'L1', note: 'dinner' }, { do: 'set_aside', goal: 'G1', amount: 5000 }, { do: 'change_line', line: 'L1', amount: 25000 }] }, refs, ctxOf(h));
    const res = await K.apply(h.A, c.steps);
    ok(res.ok, res.text); eq(res.steps.length, 3);
    const ev = h.book.events.slice(n0);
    ok(ev.some(e => e.k === 'spend' && e.a === 9000 && e.line === refs.L1 && e.note === 'dinner' && e.src.type === 'typed' && e.told), 'the spend, typed');
    ok(ev.some(e => e.k === 'move' && e.a === 5000 && e.place2 === refs.G1), 'the set aside');
    eq(h.book.plan.budgets[0].steps.slice(-1)[0].amount, 25000, 'the line step');
    await h.A.logSpend({ date: DAY, a: 300, acct: BANK });
    const u = await K.undoAll(h.A, res.steps);
    ok(u.ok, u.text);
    const v = L.lookahead(h.book, DAY);
    eq(v.period.lines[0].amount, 30000, 'line back');
    eq(v.places[refs.G1].kept, 10000, 'goal back');
    ok(h.book.events.some(e => !e.gone && e.a === 300), 'the later spend kept');
    ok(!h.book.events.some(e => !e.gone && e.a === 9000), 'the dinner gone');
  });
  await t('apply: a step act3 refuses takes back the ones before it, and says why', async () => {
    const h = await planned(), refs = K.summary(h.book, DAY).refs;
    const c = K.check({ answer: 'x', actions: [{ do: 'set_aside', goal: 'G1', amount: 5000 }, { do: 'change_line', line: 'L1', amount: 25000 }] }, refs, ctxOf(h));
    await h.A.run('rm', w => w.remove('budgets', refs.L1));
    const kept = L.lookahead(h.book, DAY).places[refs.G1].kept;
    const res = await K.apply(h.A, c.steps);
    ok(!res.ok && /Food/.test(res.text), JSON.stringify(res));
    eq(L.lookahead(h.book, DAY).places[refs.G1].kept, kept, 'set aside taken back');
  });
  /* [B1, QC numbers] short: named by the first day under and how much then, before the pay only when one brings money.
     Set up Mon 23 Nov with 30,000, Rent 60,000 on the 24th, Pay 50,000 on the 25th: -30,000 on 24 Nov, -40,000 on 24 Dec.
     Pay 0 with 100,000 and Rent on the 28th: 40,000 on 28 Nov, -20,000 on 28 Dec, and no pay brings anything. */
  const B = require(E + 'build_book.js');
  const jp = (bank, pay, rentDay) => B.buildBook({ day: '2026-11-23', told: '2026-11-23T09:00+09:00', country: 'JP', currency: 'JPY',
    banks: [{ key: 'b', name: 'Main bank', amount: bank }],
    pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: pay, day: 25, shift: 'none', startsPeriod: true }],
    bills: [{ key: 'rent', name: 'Rent', from: 'b', amount: 60000, day: rentDay, shift: 'none' }] }, { newId: I.idMaker('b1ask0', () => 0.5) }).book;
  await t('the summary names the first day short and how much then, and the lower point later with its own day [B1]', async () => {
    const s = K.summary(jp(30000, 50000, 24), '2026-11-23').text;
    ok(s.includes('Short by ¥30,000 on 24 Nov, before the pay on 25 Nov. Later on it goes ¥40,000 below zero on 24 Dec.'), s);
    ok(!s.includes('before then'), 'no "before then"');
  });
  await t('the summary with pay 0 never says short before a pay that brings nothing [B1]', async () => {
    const s = K.summary(jp(100000, 0, 28), '2026-11-23').text;
    ok(s.includes('Short by ¥20,000 on 28 Dec.'), s);
    ok(!/before the pay|before then/.test(s), s);
  });
  console.log(bad ? `ask3_core: ${bad} FAIL of ${n}` : `ask3_core: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
