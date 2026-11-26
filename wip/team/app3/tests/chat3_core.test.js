#!/usr/bin/env node
/* The assistant's pure core (app3/src/chat3_core.js) in node with the fake model (tests/fake_ai.js) and recorded
   replies. No real AI. What is checked (AI_FIRST_PLAN section 5 and both Corrections sections; BU, BV, BW):
   1. The whole setup chat for Mako's made-up shape on Tue 24 Nov 2026, the 15 questions in order with a question about
      the app in the middle: Japan; one bank, Main bank 286,000 (where to find it first); pay on the 10th, the working day
      before, 240,000 after tax; no side job; Card A 54,000 paid on the 10th (day after), Card B 23,000 on the 11th
      (day before), close days not sure; Rent 72,000 on the 27th, Power 7,400 on the 26th, Phone 4,800 on the 20th
      (already out), Internet 5,200 on the 27th; Free to spend blank; no minimum; fill. The book: safe to spend 201,400,
      next pay 10 Dec, Main bank 286,000, cards 54,000 and 23,000. Then Undo the fill (no book, the draft kept), fill
      again, a spend by chat ("I spent 1,200 on lunch": safe 200,200, Undo: 201,400), a delete asks first.
   2. What is sent: every round carries fresh figures and the draft (BU2), never an id, a note or a shop (BV6), the
      relay's fields (max_tokens 2,000, invite, tool_choice auto), the last 10 turns only, no figures or draft tool.
   3. "Before tax": a pay is not saved until it is after tax (new foundation 13).
   4. A side job not the same each time is saved with no fixed day (BV7).
   5. A stale draft filled days later: today's figures and the newly due bills are asked again (BV3, BV2.8).
   6. A skipped "has it come out" question: fill refused (BV4); on a device that has a book, refused (BV2.9).
   7. The turn stops after 6 rounds; a relay error keeps everything; a change larger than safe to spend asks first. */
'use strict';
const path = require('path');
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js'), I = require(E + 'ids.js');
const A3 = require('../src/act3.js'), K = require('../src/chat3_core.js'), FAKE = require('./fake_ai.js');
let bad = 0, n = 0;
const t = async (name, fn) => { n++; try { await fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 4).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };

/* the page's side, in memory: the book, its act3 door, E3.start and the discard */
function page(day) {
  const h = { day, book: null, starts: 0, discards: 0 };
  h.deps = (fake) => ({
    send: fake.send, today: () => h.day, told: () => h.day + 'T10:00:00.000+09:00', newId: I.idMaker('chat3t', Math.random),
    book: () => h.book, mode: () => (h.book ? 'kept' : 'none'), anon: 'device0123456789', invite: 'acorn',
    door: A3.make({ book: () => h.book, put: async x => { h.book = x; return true; }, told: () => h.day + 'T11:00:00.000+09:00', newId: I.idMaker('chat3t', Math.random), today: () => h.day, check: x => L.lookahead(x, h.day) }),
    start: async b => { h.book = b; h.starts++; return true; },
    discard: async () => { h.book = null; h.discards++; return true; },
  });
  return h;
}
const say = (words, calls) => ({ words, calls });
const call = (name, input) => ({ name, input });
const edits2 = (h, st0, list) => { let st = st0; const deps = h.deps(FAKE.make([])); for (const [sec, v] of list) { const r = K.draftEdit(st, sec, v, deps); ok(r.ok, sec + ': ' + r.text); st = r.state; } return st; };
const lastNote = r => r.shown.filter(x => x.who === 'note').map(x => x.text);
const safe = h => L.lookahead(h.book, h.day).safeToSpend.headline;

const MAKO = {
  banks: [{ name: 'Main bank', amount: 286000 }],
  pays: [{ name: 'Pay', amount: 240000, every: 'month', day: 10, shift: 'before', afterTax: true }],
  cards: [{ name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', shift: 'after' }, { name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', shift: 'before' }],
  bills: [{ name: 'Rent', amount: 72000, day: 27 }, { name: 'Power', amount: 7400, day: 26 }, { name: 'Phone', amount: 4800, day: 20 }, { name: 'Internet', amount: 5200, day: 27 }],
};
/* the whole setup conversation: [what Mako says, the AI's recorded replies for that turn] */
const SETUP = [
  ['hi', [say(K.GUIDE[0].ask + ' ' + K.GUIDE[1].ask + ' ' + K.GUIDE[2].ask)]],
  ['Japan, yen', [say('', [call('draft_set', { section: 'country', value: 'JP' }), call('draft_set', { section: 'currency', value: 'JPY' })]), say(K.GUIDE[3].ask)]],
  ['Just one, Main bank', [say(K.GUIDE[4].ask)]],
  ['what does safe to spend mean?', [say('', [call('explain', { topic: 'safeToSpend' })]), (body) => say(FAKE.results(body)[0].text + ' So, what does Main bank show right now?')]],
  ['286,000', [say('', [call('draft_set', { section: 'banks', value: MAKO.banks })]), say(K.GUIDE[5].ask)]],
  ['once a month, on the 10th', [say(K.GUIDE[6].ask)]],
  ['the day before', [say('How much lands in your bank each time?')]],
  ['240,000', [say('Is that before or after tax?')]],
  ['after tax', [say('', [call('draft_set', { section: 'pays', value: MAKO.pays })]), say(K.GUIDE[8].ask)]],
  ['no side job', [say(K.GUIDE[9].ask)]],
  ['Card A has 54,000, paid on the 10th, the day after. Card B 23,000 on the 11th, the day before. Not sure about close days', [say('', [call('draft_set', { section: 'cards', value: MAKO.cards })]), say(K.GUIDE[10].ask)]],
  ['Rent 72,000 on the 27th, power 7,400 on the 26th, phone 4,800 on the 20th, internet 5,200 on the 27th', [say('', [call('draft_set', { section: 'bills', value: MAKO.bills })]),
    body => { ok(/Has Phone, due 20 Nov, come out of Main bank already\?/.test(FAKE.results(body)[0].text), 'the result names the asked bill'); return say('Phone was due on 20 Nov. Has it come out of your bank already?'); }]],
  ['yes', [say('', [call('draft_set', { section: 'asked', value: [{ name: 'Phone', out: true }] })]), say(K.GUIDE[12].ask)]],
  ['not sure yet', [say('', [call('draft_set', { section: 'free', value: null })]), say(K.GUIDE[13].ask)]],
  ['no minimum', [say('', [call('draft_set', { section: 'min', value: null })]), body => { ok(/NEEDED now: nothing/.test(FAKE.results(body)[0].text), 'nothing needed'); return say('That is everything. Shall I fill in your Burrow?'); }]],
  ['yes fill it in', [say('', [call('fill_book', {})]), body => { ok(/Filled in\. Safe to spend ¥201,400, Main bank ¥286,000\./.test(FAKE.results(body)[0].text), FAKE.results(body)[0].text); return say("Done. Here's Home. Check each tab, tell me anything that's wrong."); }]],
];
async function runSetup(h, fake, upTo) {
  let state = K.fresh();
  const deps = h.deps(fake), outs = [];
  for (const [words] of SETUP.slice(0, upTo == null ? SETUP.length : upTo)) { const r = await K.turn(state, words, deps); state = r.state; outs.push(r); }
  return { state, deps, outs };
}
const steps = list => [].concat(...list.map(([, r]) => r));

(async () => {
  const h = page('2026-11-24'), fake = FAKE.make(steps(SETUP));
  const { state: S1, deps, outs } = await runSetup(h, fake);

  await t('the setup chat for Mako\'s shape ends in a book: safe to spend 201,400 on 24 Nov, next pay 10 Dec, Main bank 286,000', async () => {
    eq(fake.left(), 0, 'every recorded reply used');
    ok(outs.every(o => o.stop === 'words'), 'each turn ends in words');
    const v = L.lookahead(h.book, h.day), main = h.book.home.main.v.acct;
    eq(v.safeToSpend.headline, 201400); eq(v.daysToNextPay.next_pay, '2026-12-10'); eq(v.accounts[main].bank, 286000);
    eq(v.dueBeforeNextPay.total, 84600);
    eq(Object.values(v.cards).map(c => c.owedNow), [54000, 23000]);
    eq(h.book.schedules.filter(s => s.kind === 'income').map(s => [s.name, s.shift, !!s.startsPeriod, s.steps[0].amount]), [['Pay', 'before', true, 240000]]);
    eq(h.book.home.main.v.min, null, 'no minimum was set');
    eq(h.book.plan.shares, [], 'Free to spend left blank');
    const fillCard = S1.turns.filter(x => x.who === 'card' && x.card.kind === 'fill');
    eq(fillCard.map(x => [x.card.status, x.card.figures]), [['done', { safe: 201400, bank: 286000 }]]);
  });
  await t('each section saved on its own with a "Saved" line; the draft card follows the answers', async () => {
    const notes = outs.map(o => lastNote(o)).filter(x => x.length).map(x => x[0]);
    eq(notes, ['Saved: Country', 'Saved: Your bank', 'Saved: Pay', 'Saved: Cards', 'Saved: Bills', 'Saved: Bills since your last pay', 'Saved: Free to spend', 'Saved: Keep at least']);
    const card = outs[14].shown.find(x => x.who === 'card' && x.card.kind === 'draft').card;
    eq(card.ready, true); eq(card.need, []);
    eq(card.sections.find(s => s.key === 'bills').lines[2], 'Phone: ¥4,800 on day 20 each month, the one of 20 Nov already out');
    eq(card.sections.find(s => s.key === 'banks').lines, ['Main bank: ¥286,000 on 24 Nov']);
    eq(S1.turns.filter(x => x.who === 'card' && x.card.kind === 'draft').length, 1, 'one draft card, the latest');
  });
  await t('what is sent: fresh figures and the draft every round, the relay\'s fields, no figures or draft tool (BU2)', async () => {
    for (const b of fake.bodies) {
      eq([b.v, b.anon, b.invite, b.tier, b.max_tokens, b.effort, b.tool_choice], [1, 'device0123456789', 'acorn', 'default', 2000, 'low', { type: 'auto' }]);
      const last = b.messages[b.messages.length - 1];
      eq(last.role, 'user');
      ok(last.content.some(c => c.type === 'text' && /^FIGURES/.test(c.text)), 'fresh figures in the last message');
    }
    eq(fake.bodies[0].tools.map(x => x.name), ['list', 'explain', 'draft_set', 'fill_book', 'change']);
    ok(fake.bodies[0].tools.length <= 16, 'under the relay\'s 16');
    /* after a draft_set, the next round's draft already holds it */
    const after = fake.bodies.find(b => FAKE.results(b).some(r => /Saved: Your bank/.test(r.text)));
    ok(/Your bank: Main bank: ¥286,000 on 24 Nov/.test(JSON.stringify(after.messages.slice(-1))), 'the draft is fresh');
    /* the last 10 turns only */
    const lastBody = fake.bodies[fake.bodies.length - 1], hist = lastBody.messages.map(m => m.content.map(c => c.text || '').join(' ')).join(' ');
    ok(!/^hi$/m.test(hist) && !hist.includes('Just one, Main bank'), 'old turns are not sent');
  });
  await t('the guide: the 15 questions in order, how many banks (one is fine), before or after tax, the side job the same each time', async () => {
    eq(K.GUIDE.map(g => g.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    ok(/How many banks/.test(K.GUIDE[3].ask) && /One is fine/.test(K.GUIDE[3].ask));
    ok(/before or after tax/.test(K.GUIDE[7].ask) && /差引支給額/.test(K.GUIDE[7].ask));
    ok(/same amount each time/.test(K.GUIDE[8].ask));
    ok(/ask anything about the app at any point/.test(K.SYSTEM), 'he can ask anything at any point');
    eq(K.SYSTEM.length < 9000, true, 'the system prompt stays short: ' + K.SYSTEM.length);
  });

  /* day to day: a spend by chat, Undo, a delete that asks first */
  let S2 = S1;
  await t('"I spent 1,200 on lunch": made at once with the engine\'s before and after; safe 200,200; Undo puts back 201,400 (BW)', async () => {
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 1200, note: 'lunch', account: 'A1' }] })]), body => { ok(/^Done/.test(FAKE.results(body)[0].text), FAKE.results(body)[0].text); return say('Logged. Safe to spend is now 200,200.'); }]);
    const r = await K.turn(S2, 'I spent 1,200 on lunch from Main bank', Object.assign(h.deps(f), { door: deps.door }));
    S2 = r.state;
    eq(safe(h), 200200);
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.lines], ['done', ['Log ¥1,200 on Free to spend from Main bank, today (lunch)']]);
    eq(c.rows.find(x => x.key === 'safe'), { key: 'safe', label: 'Safe to spend', before: 201400, after: 200200 });
    const u = await K.undo(S2, r.shown.find(x => x.who === 'card').id, { door: deps.door, told: deps.told, book: () => h.book });
    ok(u.ok, JSON.stringify(u)); S2 = u.state;
    eq(safe(h), 201400);
  });
  await t('what is sent never holds a record id or a note; the list tool gives amounts and dates only (BV6)', async () => {
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, note: 'secret coffee at Blue Door', account: 'A1' }] })]), say('Logged.'),
      say('', [call('list', { what: 'spends', account: 'A1' })]), say('Here they are.')]);
    let r = await K.turn(S2, 'I spent 900 on a coffee from Main bank', Object.assign(h.deps(f), { door: deps.door })); S2 = r.state;
    r = await K.turn(S2, 'what did I spend?', Object.assign(h.deps(f), { door: deps.door })); S2 = r.state;
    const sent = JSON.stringify(f.bodies.slice(2));
    const ids = [].concat(...['accounts', 'schedules', 'events'].map(k => h.book[k].map(x => x.id)));
    eq(ids.filter(id => sent.includes(id)), [], 'ids sent');
    ok(!/Blue Door|secret/.test(sent), 'a note or shop sent');
    ok(/S\d+ \| 24 Nov \| ¥900 \| spend \| Free to spend/.test(sent), 'amount and date');
  });
  await t('a delete asks first; OK carries it out; Not now leaves it', async () => {
    const f = FAKE.make([say('', [call('list', { what: 'bills' })]), body => { const b = FAKE.results(body)[0].text.split('\n').find(l => /Internet/.test(l)).split(' | ')[0]; return say('', [call('change', { steps: [{ do: 'end_bill', ref: b }] })]); }, say('Tap OK to end Internet.')]);
    const r = await K.turn(S2, 'I cancelled the internet', Object.assign(h.deps(f), { door: deps.door })); S2 = r.state;
    const t1 = r.shown.find(x => x.who === 'card');
    eq([t1.card.status, t1.card.ask, t1.card.lines], ['ask', 'delete', ['End Internet from today']]);
    ok(!h.book.schedules.find(s => s.name === 'Internet').ends, 'nothing changed yet');
    const c = await K.confirm(S2, t1.id, Object.assign(h.deps(f), { door: deps.door })); S2 = c.state;
    ok(c.ok, JSON.stringify(c)); eq(h.book.schedules.find(s => s.name === 'Internet').ends, '2026-11-24');
    eq(safe(h), 201400 - 900 + 5200);
  });
  await t('a change larger than safe to spend asks first (BW)', async () => {
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 300000, account: 'A1' }] })]), say('That is more than safe to spend. Tap OK if it is right.')]);
    const before = safe(h);
    const r = await K.turn(S2, 'I spent 300,000 on a sofa', Object.assign(h.deps(f), { door: deps.door }));
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.ask], ['ask', 'large']); eq(safe(h), before);
    const nn = await K.notNow(r.state, r.shown.find(x => x.who === 'card').id); eq(nn.state.turns.find(x => x.card && x.card.ask === 'large').card.status, 'not now');
  });
  await t('an amount the person did not type is a guess and asks first', async () => {
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 1500, account: 'A1' }] })]), say('Is 1,500 right?')]);
    const r = await K.turn(S2, 'I had lunch', Object.assign(h.deps(f), { door: deps.door }));
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.ask, c.lines], ['ask', 'guess', ['Log ¥1,500 on Free to spend from Main bank, today (my guess)']]);
  });

  /* [M6, ruled 26 Nov; qc-assistant blocker 1] an amount counts as typed by the person only from their own messages since
     the assistant's last written change, and an amount a written change already used is not counted again */
  await t('[M6] "another lunch today" with the AI sending the old 900 again is asked first, never written', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const lunch = { do: 'log_spend', amount: 900, account: 'A2' };
    const f = FAKE.make([say('', [call('change', { steps: [lunch] })]), say('Logged.'), say('', [call('change', { steps: [lunch] })]), say('Is 900 right?')]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'I bought lunch, 900 on card A', d);
    eq(r1.shown.find(x => x.who === 'card').card.status, 'done');
    const before = JSON.stringify(hp.book);
    const r2 = await K.turn(r1.state, 'another lunch today', d);
    const c = r2.shown.find(x => x.who === 'card').card;
    eq([c.status, c.ask], ['ask', 'guess']); ok(/\(my guess\)$/.test(c.lines[0]), c.lines[0]);
    eq(JSON.stringify(hp.book), before, 'nothing written');
    /* typed again, it goes in at once */
    const f3 = FAKE.make([say('', [call('change', { steps: [lunch] })]), say('Logged.')]);
    const r3 = await K.turn(r2.state, 'another lunch, 900 again on card A', Object.assign(hp.deps(f3), { door: d.door }));
    eq(r3.shown.find(x => x.who === 'card').card.status, 'done');
  });
  await t('[M6] a goal amount reused from an earlier bank figure is asked first', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', type: 'bank', amount: 100000, moved: false }] })]), say('Added.'),
      say('', [call('change', { steps: [{ do: 'add_goal', name: 'Trip', target: 100000 }] })]), say('Is 100,000 right?')]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'Add a bank called Savings with 100,000 in it, new money', d);
    eq(r1.shown.find(x => x.who === 'card').card.status, 'done');
    const before = JSON.stringify(hp.book);
    const r2 = await K.turn(r1.state, 'add a goal called Trip', d);
    const c = r2.shown.find(x => x.who === 'card').card;
    eq([c.status, c.ask], ['ask', 'guess']); eq(JSON.stringify(hp.book), before, 'nothing written');
  });
  await t('[E1, M3, M13] "rename my bank to Everyday" and "keep at least 5,000 in Savings": change_account, each with a card and Undo; a card or a loan is not changed this way', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', type: 'bank', amount: 40000, moved: false }] })]), say('Added.'),
      say('', [call('change', { steps: [{ do: 'change_account', account: 'A1', name: 'Everyday' }] })]), say('Renamed.'),
      say('', [call('list', { what: 'accounts' })]), body => { const r = FAKE.results(body)[0].text.split('\n').find(l => /Savings/.test(l)).split(' | ')[0]; return say('', [call('change', { steps: [{ do: 'change_account', account: r, min: 5000 }] })]); }, say('Done.'),
      say('', [call('change', { steps: [{ do: 'change_account', account: 'A2', name: 'Shop card' }] })]), say('Hmm.')]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'Add a bank called Savings with 40,000 in it, new money', d);
    const main = hp.book.home.main.v.acct, was = hp.book.accounts.find(a => a.id === main).name;
    const r2 = await K.turn(r1.state, 'rename my bank to Everyday', d);
    const c2 = r2.shown.find(x => x.who === 'card');
    eq([c2.card.status, hp.book.accounts.find(a => a.id === main).name], ['done', 'Everyday'], JSON.stringify(c2.card));
    ok(/Everyday/.test(c2.card.lines.join(' ')), c2.card.lines.join(' | '));
    const r3 = await K.turn(r2.state, 'keep at least 5,000 in Savings', d);
    const sv = hp.book.accounts.find(a => a.name === 'Savings');
    eq([r3.shown.find(x => x.who === 'card').card.status, sv.minBank && sv.minBank.a], ['done', 5000]);
    const u = await K.undo(r3.state, r2.shown.find(x => x.who === 'card').id, d);
    ok(!u.ok || hp.book.accounts.find(a => a.id === main).name === was, 'Undo of an older card is refused or puts it back');
    const u3 = await K.undo(r3.state, r3.shown.find(x => x.who === 'card').id, d); ok(u3.ok, JSON.stringify(u3));
    ok(!hp.book.accounts.find(a => a.name === 'Savings').minBank, 'Undo takes Keep at least off');
    const before = JSON.stringify(hp.book.accounts);
    const r4 = await K.turn(u3.state || r3.state, 'call card A Shop card', d);
    const c4 = r4.shown.find(x => x.who === 'card');
    ok(!c4 || c4.card.status !== 'done', 'a card is not renamed by change_account'); eq(JSON.stringify(hp.book.accounts), before, 'nothing written');
  });
  await t('[E2, M3, M6, M13] "I closed my savings, the money went to my bank": close_account asks first, OK closes it with the money moved; Undo; "reopen it"; remove_account on one added by mistake asks first; one with history is refused with words', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const sref = body => FAKE.results(body)[0].text.split('\n').find(l => /Savings/.test(l)).split(' | ')[0];
    let sv;
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', type: 'bank', amount: 40000, moved: false }] })]), say('Added.'),
      say('', [call('list', { what: 'accounts' })]), body => { sv = sref(body); return say('', [call('change', { steps: [{ do: 'close_account', account: sv, to: 'A1', amount: 40000 }] })]); }, say('Tap OK to close it.'),
      () => say('', [call('change', { steps: [{ do: 'reopen_account', account: sv }] })]), say('Open again.'),
      () => say('', [call('change', { steps: [{ do: 'remove_account', account: sv }] })]), say('Tap OK.'), say('It has history.')]);
    const d = hp.deps(f), main = hp.book.home.main.v.acct;
    const r1 = await K.turn(state, 'Add a bank called Savings with 40,000 in it, new money', d);
    const bank0 = require(E + 'lookahead.js').lookahead(hp.book, '2026-11-24').accounts[main].bank;
    const r2 = await K.turn(r1.state, 'I closed my savings, the 40,000 in it went to my bank', d);
    const c2 = r2.shown.find(x => x.who === 'card');
    eq([c2.card.status, c2.card.ask], ['ask', 'delete'], JSON.stringify(c2.card));
    ok(/Close Savings.*40,000.*Main bank/.test(c2.card.lines.join(' ')), c2.card.lines.join(' | '));
    const savId = hp.book.accounts.find(a => a.name === 'Savings').id;
    ok(!hp.book.accounts.find(a => a.id === savId).closed, 'nothing changed yet');
    const c = await K.confirm(r2.state, c2.id, d); ok(c.ok, JSON.stringify(c));
    eq([hp.book.accounts.find(a => a.id === savId).closed, require(E + 'lookahead.js').lookahead(hp.book, '2026-11-24').accounts[main].bank], ['2026-11-24', bank0 + 40000]);
    const r3 = await K.turn(c.state, 'oh, reopen it', d);
    eq([r3.shown.find(x => x.who === 'card').card.status, hp.book.accounts.find(a => a.id === savId).closed || null], ['done', null]);
    const r4 = await K.turn(r3.state, 'remove savings, it was a mistake', d);
    const c4 = r4.shown.find(x => x.who === 'card');
    eq([c4.card.status, c4.card.ask], ['ask', 'delete']);
    const k4 = await K.confirm(r4.state, c4.id, d);
    ok(!k4.ok && /history/.test(k4.text), 'it has history now (the close and its move): refused with words ' + JSON.stringify(k4.text));
    ok(!hp.book.accounts.find(a => a.id === savId).gone, 'not removed');
  });
  await t('[LANE J, qc-foundation controls2to5 F3] close_account moving money without what is in it now is not made: the assistant is told to ask', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    let told = '';
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Wallet', type: 'cash', amount: 20000, moved: false }] })]), say('Added.'),
      say('', [call('list', { what: 'accounts' })]), body => { const w = FAKE.results(body)[0].text.split('\n').find(l => /Wallet/.test(l)).split(' | ')[0]; return say('', [call('change', { steps: [{ do: 'close_account', account: w, to: 'A1' }] })]); },
      body => { told = JSON.stringify(FAKE.results(body)); return say('How much is in it now?'); }]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'Add cash called Wallet with 20,000, new money', d);
    const before = JSON.stringify(hp.book);
    const r2 = await K.turn(r1.state, 'close my wallet, put it in the bank', d);
    ok(!r2.shown.some(x => x.who === 'card' && x.card.status === 'done'), 'nothing closed');
    ok(/ask what is in Wallet now/.test(told), told);
    eq(JSON.stringify(hp.book), before, 'nothing written');
  });
  await t('[E3, M3, M13, M27] cards and loans by asking: add_loan, change_card, change_loan, pay_off (asks first: the amount was never typed), close_account on a card at zero, remove_account on a loan added by mistake', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const L = require(E + 'lookahead.js');
    const lref = (body, re) => FAKE.results(body)[0].text.split('\n').find(l => re.test(l)).split(' | ')[0];
    let bike;
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_loan', name: 'Bike loan', owed: 100000, amount: 10000, payDay: 27 }] })]), say('Added.'),
      say('', [call('change', { steps: [{ do: 'change_card', account: 'A2', name: 'Shop card', payDay: 12 }] })]), say('Changed.'),
      say('', [call('list', { what: 'accounts' })]), body => { bike = lref(body, /Bike loan/); return say('', [call('change', { steps: [{ do: 'change_loan', account: bike, amount: 12000 }] })]); }, say('Changed.'),
      say('', [call('change', { steps: [{ do: 'pay_off', account: 'A2' }] })]), say('Tap OK if you paid it.'),
      say('', [call('change', { steps: [{ do: 'close_account', account: 'A2' }] })]), say('Tap OK to close it.'),
      say('', [call('list', { what: 'accounts' })]), body => say('', [call('change', { steps: [{ do: 'remove_account', account: lref(body, /Bike loan/) }] })]), say('Tap OK.')]);
    const d = hp.deps(f), card = hp.book.accounts.find(a => a.type === 'card').id, main = hp.book.home.main.v.acct;
    const r1 = await K.turn(state, 'add a bike loan, 100,000 owed, 10,000 a month on the 27th', d);
    eq(r1.shown.find(x => x.who === 'card').card.status, 'done');
    const loan = hp.book.accounts.find(a => a.name === 'Bike loan');
    eq([loan.type, loan.payDay, loan.amount, L.lookahead(hp.book, '2026-11-24').owed[loan.id].owedNow], ['loan', 27, 10000, 100000]);
    const r2 = await K.turn(r1.state, 'rename card A to Shop card, it is paid on the 12th now', d);
    eq([r2.shown.find(x => x.who === 'card').card.status, hp.book.accounts.find(a => a.id === card).name, hp.book.accounts.find(a => a.id === card).payDay], ['done', 'Shop card', 12]);
    const r3 = await K.turn(r2.state, 'the bike loan payment is 12,000 now', d);
    eq([r3.shown.find(x => x.who === 'card').card.status, hp.book.accounts.find(a => a.id === loan.id).amount], ['done', 12000]);
    const owed = L.lookahead(hp.book, '2026-11-24').cards[card].owedNow, bank0 = L.lookahead(hp.book, '2026-11-24').accounts[main].bank;
    const r4 = await K.turn(r3.state, 'I paid off the shop card', d);
    const c4 = r4.shown.find(x => x.who === 'card');
    eq(c4.card.status, 'ask', JSON.stringify(c4.card)); ok(new RegExp('Pay off Shop card').test(c4.card.lines.join(' ')), c4.card.lines.join(' | '));
    const k4 = await K.confirm(r4.state, c4.id, d); ok(k4.ok, JSON.stringify(k4));
    const v = L.lookahead(hp.book, '2026-11-24');
    eq([v.cards[card].owedNow, v.accounts[main].bank], [0, bank0 - owed]);
    const r5 = await K.turn(k4.state, 'close the shop card', d);
    const c5 = r5.shown.find(x => x.who === 'card'); eq([c5.card.status, c5.card.ask], ['ask', 'delete']);
    const k5 = await K.confirm(r5.state, c5.id, d); ok(k5.ok, JSON.stringify(k5));
    eq(hp.book.accounts.find(a => a.id === card).closed, '2026-11-24');
    const r6 = await K.turn(k5.state, 'remove the bike loan, I added it by mistake', d);
    const c6 = r6.shown.find(x => x.who === 'card'); eq([c6.card.status, c6.card.ask], ['ask', 'delete']);
    const k6 = await K.confirm(r6.state, c6.id, d); ok(k6.ok, JSON.stringify(k6));
    ok(hp.book.accounts.find(a => a.id === loan.id).gone, 'removed');
  });
  await t('[E5, M3, M13, M42] "keep at least 30,000 in my bank" and "I bank in the Philippines now": set_keep and set_country, each with a card and Undo; "no minimum" clears it', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'set_keep', amount: 30000 }] })]), say('Set.'),
      say('', [call('change', { steps: [{ do: 'set_country', country: 'PH' }] })]), say('Changed.'),
      say('', [call('change', { steps: [{ do: 'set_keep', amount: 0 }] })]), say('Cleared.')]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'keep at least 30,000 in my bank', d);
    const c1 = r1.shown.find(x => x.who === 'card');
    eq([c1.card.status, hp.book.home.main.v.min && hp.book.home.main.v.min.a], ['done', 30000], JSON.stringify(c1.card));
    ok(/Keep at least/.test(c1.card.lines.join(' ')), c1.card.lines.join(' | '));
    const r2 = await K.turn(r1.state, 'I bank in the Philippines now', d);
    eq([r2.shown.find(x => x.who === 'card').card.status, hp.book.home.country.v], ['done', 'PH']);
    const u = await K.undo(r2.state, r2.shown.find(x => x.who === 'card').id, d); ok(u.ok, JSON.stringify(u));
    eq(hp.book.home.country.v, 'JP');
    const r3 = await K.turn(u.state || r2.state, 'no minimum please', d);
    eq([r3.shown.find(x => x.who === 'card').card.status, hp.book.home.main.v.min], ['done', null]);
  });
  await t('[E1b, M3, M13, M23] "add a card paid from Savings" and "pay rent from Savings": add_card and change_bill take the paying account (and a card its weekend rule), each with a card and Undo', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const sv = () => hp.book.accounts.find(a => a.name === 'Savings' && !a.gone);
    const refOf = (body, re) => FAKE.results(body)[0].text.split('\n').find(l => re.test(l)).split(' | ')[0];
    let rentRef = null;
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', type: 'bank', amount: 40000, moved: false }] })]), say('Added.'),
      say('', [call('list', { what: 'accounts' })]), body => say('', [call('change', { steps: [{ do: 'add_card', name: 'Shop card', owed: 0, payDay: 15, closeDay: 'not sure', account: refOf(body, /Savings/), shift: 'before' }] })]), say('Added.'),
      say('', [call('list', { what: 'bills' })]), body => { rentRef = refOf(body, /Rent/); return say('', [call('list', { what: 'accounts' })]); },
      body => say('', [call('change', { steps: [{ do: 'change_bill', ref: rentRef, account: refOf(body, /Savings/) }] })]), say('Changed.')]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'Add a bank called Savings with 40,000 in it, new money', d);
    const r2 = await K.turn(r1.state, 'add a card called Shop card, 0 on it now, paid on the 15th from Savings, the working day before', d);
    const c2 = r2.shown.find(x => x.who === 'card'), sc = hp.book.accounts.find(a => a.name === 'Shop card');
    eq([c2.card.status, !!sc && sc.payFrom === sv().id, sc && sc.shift], ['done', true, 'before'], JSON.stringify(c2.card) + JSON.stringify(sc));
    ok(/Savings/.test(c2.card.lines.join(' ')), 'the card says Savings: ' + c2.card.lines.join(' | '));
    const rent = hp.book.schedules.find(x => x.name === 'Rent'), main = hp.book.home.main.v.acct;
    const r3 = await K.turn(r2.state, 'pay rent from Savings from now on', d);
    const c3 = r3.shown.find(x => x.who === 'card');
    eq([c3 && c3.card.status, hp.book.schedules.find(x => x.id === rent.id).acct === sv().id], ['done', true], JSON.stringify(c3 && c3.card));
    ok(/Savings/.test(c3.card.lines.join(' ')), 'the card says Savings: ' + c3.card.lines.join(' | '));
    const u = await K.undo(r3.state, c3.id, d); ok(u.ok, JSON.stringify(u));
    eq(hp.book.schedules.find(x => x.id === rent.id).acct, main, 'Undo puts the main bank back');
  });
  await t('[E1b, M13, M23] "card A is paid from Savings now, the working day before": change_card takes payFrom and shift; add_loan takes payFrom; Undo', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const refOf = (body, re) => FAKE.results(body)[0].text.split('\n').find(l => re.test(l)).split(' | ')[0];
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', type: 'bank', amount: 40000, moved: false }] })]), say('Added.'),
      say('', [call('list', { what: 'accounts' })]), body => say('', [call('change', { steps: [{ do: 'change_card', account: 'A2', payFrom: refOf(body, /Savings/), shift: 'before' }] })]), say('Changed.'),
      say('', [call('list', { what: 'accounts' })]), body => say('', [call('change', { steps: [{ do: 'add_loan', name: 'Bike loan', owed: 90000, amount: 10000, payDay: 5, payFrom: refOf(body, /Savings/) }] })]), say('Added.')]);
    const d = hp.deps(f), card = hp.book.accounts.find(a => a.type === 'card').id, main = hp.book.home.main.v.acct;
    const r1 = await K.turn(state, 'Add a bank called Savings with 40,000 in it, new money', d);
    const sv = hp.book.accounts.find(a => a.name === 'Savings').id;
    const r2 = await K.turn(r1.state, 'card A is paid from Savings now, the working day before a weekend', d);
    const c2 = r2.shown.find(x => x.who === 'card'), ca = hp.book.accounts.find(a => a.id === card);
    eq([c2.card.status, ca.payFrom, ca.shift], ['done', sv, 'before'], JSON.stringify(c2.card));
    ok(/paid from Savings/.test(c2.card.lines.join(' ')), c2.card.lines.join(' | '));
    const u = await K.undo(r2.state, c2.id, d); ok(u.ok, JSON.stringify(u));
    eq(hp.book.accounts.find(a => a.id === card).payFrom, main, 'Undo puts the main bank back');
    const r3 = await K.turn(u.state || r2.state, 'add a bike loan, 90,000 owed, 10,000 on the 5th from Savings', d);
    eq([r3.shown.find(x => x.who === 'card').card.status, (hp.book.accounts.find(a => a.name === 'Bike loan') || {}).payFrom], ['done', sv]);
  });
  await t('[M6] an answer to a follow-up question ("from when?") still counts the amount typed just before', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('From when: this one, or the next one?'),
      say('', [call('list', { what: 'bills' })]), body => { const b = FAKE.results(body)[0].text.split('\n').find(l => /Rent/.test(l)).split(' | ')[0]; return say('', [call('change', { steps: [{ do: 'change_bill', ref: b, amount: 75000, when: 'next' }] })]); }, say('Changed.')]);
    const d = hp.deps(f);
    const r1 = await K.turn(state, 'my rent goes up to 75,000', d);
    const r2 = await K.turn(r1.state, 'from the next one', d);
    const c = r2.shown.find(x => x.who === 'card').card;
    eq(c.status, 'done', JSON.stringify(c.lines) + ' ' + c.why);
  });
  await t('[M6] in one turn an amount is used once: 900 and 400 typed go in, a third change with 900 again is asked', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const sp = x => say('', [call('change', { steps: [{ do: 'log_spend', amount: x, account: 'A2' }] })]);
    const r = await K.turn(state, 'lunch 900 and a coffee 400, both on card A', hp.deps(FAKE.make([sp(900), sp(400), sp(900), say('Is the second 900 right?')])));
    eq(r.shown.filter(x => x.who === 'card').map(x => [x.card.status, x.card.ask || '']), [['done', ''], ['done', ''], ['ask', 'guess']]);
    /* typed twice, it is used twice */
    const hq = page('2026-11-24'); const q = await runSetup(hq, FAKE.make(steps(SETUP)));
    const r2 = await K.turn(q.state, 'lunch 900 and dinner 900, both on card A', hq.deps(FAKE.make([sp(900), sp(900), say('Logged both.')])));
    eq(r2.shown.filter(x => x.who === 'card').map(x => x.card.status), ['done', 'done']);
  });
  await t('[M6] a change made by tapping OK uses its amount too: "the same again" is asked as a guess', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const sofa = say('', [call('change', { steps: [{ do: 'log_spend', amount: 300000, account: 'A1' }] })]);
    const d = hp.deps(FAKE.make([sofa, say('Tap OK if it is right.'), sofa, say('Is that right?')]));
    const r1 = await K.turn(state, 'I spent 300,000 on a sofa', d);
    const c1 = await K.confirm(r1.state, r1.shown.find(x => x.who === 'card').id, d); ok(c1.ok, JSON.stringify(c1.text));
    const r2 = await K.turn(c1.state, 'and the same again for a bed', d);
    const c = r2.shown.find(x => x.who === 'card').card;
    eq(c.status, 'ask'); ok(/\(my guess\)$/.test(c.lines[0]), c.lines[0]);
  });
  await t('a new pay, new money, a goal or a card with a figure nobody typed asks first (qc-foundation F2)', async () => {
    const cases = [
      ['I have some cash in my wallet', { do: 'add_account', name: 'Wallet', type: 'cash', amount: 30000, moved: false }],
      ['I started tutoring', { do: 'add_pay', name: 'Tutoring', amount: 40000, every: 'month', day: 1 }],
      ['I got a new card', { do: 'add_card', name: 'Card C', owed: 0, payDay: 5 }],
      ['I want to save for a trip', { do: 'add_goal', name: 'Trip', target: 100000 }],
    ];
    for (const [words, step] of cases) {
      const before = JSON.stringify(h.book);
      const f = FAKE.make([say('', [call('change', { steps: [step] })]), say('Is that right?')]);
      const r = await K.turn(S2, words, Object.assign(h.deps(f), { door: deps.door }));
      const c = r.shown.find(x => x.who === 'card').card;
      eq([c.status, c.ask], ['ask', 'guess'], words);
      ok(/\(my guess\)$/.test(c.lines[0]), c.lines[0]);
      eq(JSON.stringify(h.book), before, words + ': nothing changed');
    }
    /* typed: made at once; a new pay counts toward "larger than safe to spend" */
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_pay', name: 'Tutoring', amount: 40000, every: 'month', day: 1 }] })]), say('Added.')]);
    const r = await K.turn(S2, 'I started tutoring, 40,000 on the 1st', Object.assign(h.deps(f), { door: deps.door }));
    eq(r.shown.find(x => x.who === 'card').card.status, 'done');
    await K.undo(r.state, r.shown.find(x => x.who === 'card').id, { door: deps.door, told: deps.told, book: () => h.book });
    const f2 = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Gift', type: 'cash', amount: 500000, moved: false }] })]), say('Tap OK.')]);
    const r2 = await K.turn(S2, 'I was given 500,000 in cash', Object.assign(h.deps(f2), { door: deps.door }));
    eq([r2.shown.find(x => x.who === 'card').card.status, r2.shown.find(x => x.who === 'card').card.ask], ['ask', 'large']);
  });
  /* [qc-foundation confirm finding 3; M45, M37, M22] what landed, and what the bank or card shows today, go through the
     check-in writer (engine/checkin.js) and ACT3.addRecords, never as money in or a spend */
  await t('"my pay came in" on pay day ticks the pay: counted once, the period starts; money_in is never used for it', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    hp.day = '2026-12-10';
    const v0 = L.lookahead(hp.book, hp.day);
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'landed', ref: 'P1' }] })]), say('Ticked. Your new pay period starts today.')]);
    const d = hp.deps(f);
    const r = await K.turn(state, 'my pay came in', d);
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.lines], ['done', ['Pay of 10 Dec landed: ¥240,000 in Main bank']]);
    const v = L.lookahead(hp.book, hp.day);
    eq(v.period.start, '2026-12-10', 'the period starts');
    eq(v.safeToSpend.headline, 275000, 'counted once (money in would give 515,000)');
    eq(hp.book.events.filter(e => e.k === 'in' && !e.gone).map(e => [e.sub, e.a, e.date]), [['pay', 240000, '2026-12-10']]);
    ok(/landed/.test(K.SYSTEM) && /never money_in or log_spend for it/.test(K.SYSTEM), 'the prompt steers to landed');
    /* Undo takes the tick back */
    const u = await K.undo(r.state, r.shown.find(x => x.who === 'card').id, d); ok(u.ok, JSON.stringify(u));
    eq(L.lookahead(hp.book, hp.day).safeToSpend.headline, v0.safeToSpend.headline);
  });
  await t('"rent came out" ticks Rent: the bank drops 72,000 once and Rent is no longer due; safe to spend does not drop twice', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    hp.day = '2026-11-27';
    const v0 = L.lookahead(hp.book, hp.day), main = hp.book.home.main.v.acct;
    const f = FAKE.make([say('', [call('list', { what: 'bills' })]), body => { const b = FAKE.results(body)[0].text.split('\n').find(l => /Rent/.test(l)).split(' | ')[0]; return say('', [call('change', { steps: [{ do: 'landed', ref: b }] })]); }, say('Ticked.')]);
    const r = await K.turn(state, 'rent came out', hp.deps(f));
    eq(r.shown.find(x => x.who === 'card').card.status, 'done');
    const v = L.lookahead(hp.book, hp.day);
    eq(v.accounts[main].bank, v0.accounts[main].bank - 72000, 'the bank once');
    eq(v.safeToSpend.headline, v0.safeToSpend.headline, 'safe to spend the same: Rent was already set aside');
    ok(!v.dueBeforeNextPay.items.some(o => o.amount === 72000), 'Rent no longer due');
  });
  await t('"my bank shows 250,000" and "Card A shows 60,000": a check of each through the check-in writer, typed figures only', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    hp.day = '2026-11-25';
    const main = hp.book.home.main.v.acct, cardA = hp.book.accounts.find(a => a.name === 'Card A').id;
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'bank_figure', account: 'A1', amount: 250000 }, { do: 'card_figure', account: 'A2', amount: 60000 }] })]), say('Noted.')]);
    const r = await K.turn(state, 'my bank shows 250,000 and Card A shows 60,000', hp.deps(f));
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.lines], ['done', ['Main bank shows ¥250,000 today', 'Card A shows ¥60,000 today']]);
    const v = L.lookahead(hp.book, hp.day);
    eq([v.accounts[main].bank, v.cards[cardA].owedNow], [250000, 60000]);
    eq(hp.book.checkins.length, 2, 'one check-in record each');
    /* a figure nobody typed asks first */
    const f2 = FAKE.make([say('', [call('change', { steps: [{ do: 'bank_figure', account: 'A1', amount: 233000 }] })]), say('Is that right?')]);
    const r2 = await K.turn(r.state, 'I checked my bank', hp.deps(f2));
    eq(r2.shown.find(x => x.who === 'card').card.ask, 'guess');
    /* a card figure on a bank, or a bank figure on a card, is dropped */
    const one = async input => (await K.handle(K.fresh(), { id: 'x', name: 'change', input }, hp.deps(FAKE.make([])))).result;
    ok(/^Nothing changed/.test(await one({ steps: [{ do: 'card_figure', account: 'A1', amount: 1 }] })));
    ok(/^Nothing changed/.test(await one({ steps: [{ do: 'landed', ref: 'B9' }] })));
  });
  await t('a yearly bill by chat: "car insurance 12,000 every March 15th" is added once a year (qc-foundation confirm)', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_bill', name: 'Car insurance', amount: 12000, every: 'year', month: 3, day: 15 }] })]), say('Added.')]);
    const r = await K.turn(state, 'car insurance 12,000 every March 15th', hp.deps(f));
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.lines], ['done', ['Add Car insurance: ¥12,000 once a year on 15 March, from Main bank']]);
    eq(hp.book.schedules.find(x => x.name === 'Car insurance').rules[0].rule, { every: 'year', date: '03-15' });
  });
  /* the fill's Undo (BV2): the book goes, the draft stays; once anything else was written, "start over" */
  await t('Undo of the fill after something else was written becomes "start over"; startOver discards and keeps the draft', async () => {
    const fillId = S2.turns.find(x => x.who === 'card' && x.card.kind === 'fill').id;
    const u = await K.undo(S2, fillId, h.deps(FAKE.make([])));
    eq([u.ok, u.text], [false, 'start over']);
    const s = await K.startOver(u.state, h.deps(FAKE.make([])));
    ok(s.ok); eq(h.book, null); ok(s.state.draft && s.state.draft.banks[0].amount === 286000, 'the draft kept'); eq(s.state.fill, null);
  });
  await t('Undo right after the fill: no book, the draft kept; fill again gives the same figures', async () => {
    const h2 = page('2026-11-24'), f2 = FAKE.make(steps(SETUP));
    const { state } = await runSetup(h2, f2);
    const fillId = state.turns.find(x => x.who === 'card' && x.card.kind === 'fill').id;
    const u = await K.undo(state, fillId, h2.deps(FAKE.make([])));
    ok(u.ok, JSON.stringify(u)); eq(h2.book, null); eq(h2.discards, 1);
    eq(u.state.turns.find(x => x.id === fillId).card.status, 'undone');
    const again = await K.fillNow(u.state, h2.deps(FAKE.make([])));
    ok(again.ok, again.text); eq(safe(h2), 201400);
  });

  await t('"before tax": the pay is not saved until it is what lands, after tax (new foundation 13)', async () => {
    const h3 = page('2026-11-24');
    const f = FAKE.make([...steps(SETUP.slice(0, 7)),
      say('', [call('draft_set', { section: 'pays', value: [{ name: 'Pay', amount: 300000, every: 'month', day: 10, shift: 'before', afterTax: false }] })]),
      body => { ok(/Not saved: ask whether Pay is before or after tax/.test(FAKE.results(body)[0].text)); return say("I need what lands in the bank, after tax. On a Japanese payslip it's 差引支給額 (take-home)."); },
      say('', [call('draft_set', { section: 'pays', value: MAKO.pays })]), say(K.GUIDE[8].ask)]);
    const { state, deps: d3 } = await runSetup(h3, f, 7);
    let r = await K.turn(state, '300,000 before tax', d3);
    eq(r.state.draft.pays, [], 'not saved'); ok(lastNote(r)[0].startsWith('Not saved'));
    r = await K.turn(r.state, 'oh, 240,000 lands', d3);
    eq(r.state.draft.pays.map(p => [p.amount, p.every, p.day]), [[240000, 'month', 10]]);
  });
  await t('a side job not the same each time is saved with no fixed day; asked first when not said (BV7)', async () => {
    const h4 = page('2026-11-24');
    const f = FAKE.make([...steps(SETUP.slice(0, 9)),
      say('', [call('draft_set', { section: 'pays', value: MAKO.pays.concat([{ name: 'Side job', amount: 60000, every: 'month', day: 10, afterTax: true }]) })]),
      body => { ok(/Is Side job the same amount each time\?/.test(FAKE.results(body)[0].text)); return say('Is the side job the same amount each time?'); },
      say('', [call('draft_set', { section: 'pays', value: MAKO.pays.concat([{ name: 'Side job', amount: 60000, every: 'month', day: 10, afterTax: true, same: false }]) })]), say(K.GUIDE[9].ask)]);
    const { state, deps: d4 } = await runSetup(h4, f, 9);
    let r = await K.turn(state, 'a side job, 60,000 on the 10th', d4);
    eq(r.state.draft.pays.length, 1);
    r = await K.turn(r.state, 'no, it changes', d4);
    eq(r.state.draft.pays.map(p => [p.name, p.every, p.amount]), [['Pay', 'month', 240000], ['Side job', 'none', 60000]]);
    const b = require('../src/answers3.js').toBuild(Object.assign({}, r.state.draft, { banks: r.state.draft.banks }), { day: h4.day, told: 'x' });
    eq(b.pays[1], { key: 'pay2', name: 'Side job', bank: 'bank1', amount: 60000, shift: 'none', every: 'none' });
  });
  await t('a stale draft filled days later: today\'s figures and the newly due bills are asked again (BV3, BV2.8)', async () => {
    const h5 = page('2026-11-24'), f = FAKE.make(steps(SETUP.slice(0, 15)));
    const { state } = await runSetup(h5, f, 15);
    h5.day = '2026-11-27';   // Friday: Power (26 Nov), Rent and Internet (27 Nov) are now due since the last pay
    const f2 = FAKE.make([say('', [call('fill_book', {})]), body => { const r = FAKE.results(body)[0].text; ok(/^Not filled in/.test(r), r); return say('Your figures are from 24 Nov. What does Main bank show today?'); },
      say('', [call('draft_set', { section: 'banks', value: [{ name: 'Main bank', amount: 286000, confirmed: true }] }), call('draft_set', { section: 'cards', value: MAKO.cards.map(c => Object.assign({ confirmed: true }, c)) }),
        call('draft_set', { section: 'asked', value: [{ name: 'Phone', out: true }, { name: 'Power', out: true }, { name: 'Rent', out: true }, { name: 'Internet', out: true }] })]),
      say('', [call('fill_book', {})]), say("Done. Here's Home.")]);
    let r = await K.turn(state, 'fill it in', h5.deps(f2));
    eq(h5.book, null, 'refused');
    const need = K.fillCheck(r.state.draft, h5.day, 'none').need;
    eq(need.slice(0, 3), ['What does Main bank show today?', 'What is on Card A today?', 'What is on Card B today?']);
    ok(need.some(x => /Has Power, due 26 Nov/.test(x)) && need.some(x => /Has Rent, due 27 Nov/.test(x)), need.join(' | '));
    r = await K.turn(r.state, 'still 286,000, cards the same, and everything has come out', h5.deps(f2));
    ok(h5.book, 'filled'); eq(L.lookahead(h5.book, h5.day).accounts[h5.book.home.main.v.acct].bank, 286000);
    eq(h5.book.events.filter(e => e.k === 'check' && !e.stmt).map(e => e.date), ['2026-11-27', '2026-11-27', '2026-11-27'], 'figures for the fill day');
  });
  await t('a skipped "has it come out" question: fill refused with the question (BV4); a device with a book refuses (BV2.9)', async () => {
    const h6 = page('2026-11-24');
    const f = FAKE.make([...steps(SETUP.slice(0, 12)), say('', [call('fill_book', {})]), body => { const r = FAKE.results(body)[0].text; ok(/Not filled in: Has Phone, due 20 Nov, come out of Main bank already\?/.test(r), r); return say('Phone was due on 20 Nov. Has it come out of your bank already?'); }]);
    const { state, deps: d6 } = await runSetup(h6, f, 12);
    const r = await K.turn(state, 'skip that, just fill it in', d6);
    eq(h6.book, null); eq(h6.starts, 0);
    eq(K.fillCheck(r.state.draft, h6.day, 'kept'), { ok: false, need: ['There is already a book on this device'] });
    eq(K.fillCheck(r.state.draft, h6.day, 'try').ok, false);
  });
  await t('the turn stops after 6 rounds; a relay error ends the turn with words and loses nothing', async () => {
    const h7 = page('2026-11-24'), loop = []; for (let i = 0; i < 8; i++) loop.push(say('', [call('explain', { topic: 'period' })]));
    const f = FAKE.make(loop);
    const r = await K.turn(K.fresh(), 'hi', h7.deps(f));
    eq([r.stop, f.bodies.length], ['rounds', 6]);
    const f2 = FAKE.make([{ error: 'too many requests right now, try again in a minute' }]);
    const r2 = await K.turn(r.state, 'hello', h7.deps(f2));
    eq(r2.stop, 'error'); ok(/The AI did not answer: too many requests/.test(lastNote(r2)[0]));
    eq(r2.state.turns.filter(x => x.who === 'person').map(x => x.text), ['hi', 'hello']);
  });
  await t('bad replies are dropped with plain words: an unknown ref, an amount in words, a day ahead, a tool not in the list', async () => {
    const h8 = page('2026-11-24'); h8.book = (await (async () => { const hh = page('2026-11-24'); await runSetup(hh, FAKE.make(steps(SETUP))); return hh.book; })());
    const d8 = h8.deps(FAKE.make([]));
    const one = async input => (await K.handle(K.fresh(), { id: 'x', name: 'change', input }, d8)).result;
    ok(/^Nothing changed: a log spend I could not read/.test(await one({ steps: [{ do: 'log_spend', amount: 'twelve hundred', account: 'A1' }] })));
    ok(/^Nothing changed: a log spend I could not read/.test(await one({ steps: [{ do: 'log_spend', amount: 100, date: '2026-12-01', account: 'A1' }] })));
    ok(/^Nothing changed: a end bill for a ref I do not know/.test(await one({ steps: [{ do: 'end_bill', ref: 'B9' }] })));
    ok(/^Nothing changed: a change I can't make \(transfer_all\)/.test(await one({ steps: [{ do: 'transfer_all' }] })));
    const seven = []; for (let i = 0; i < 7; i++) seven.push({ do: 'add_line', name: 'Line ' + i, amount: 100 });
    ok(/Left out: more than 6 at a time/.test(await one({ steps: seven })), 'seven steps');
    eq((await K.handle(K.fresh(), { id: 'y', name: 'figures', input: {} }, d8)).result, 'There is no tool called figures');
  });
  await t('"Use any AI" when the site\'s AI is off: the same questions as one request to copy, the reply pasted back through the same draft checks, then the fill (AI_FIRST_PLAN 4)', async () => {
    const h9 = page('2026-11-24'), d9 = h9.deps(FAKE.make([]));
    const text = K.copyPrompt(K.fresh(), h9.day);
    ok(/before or after tax/.test(text) && /How many banks/.test(text) && /"pays"/.test(text) && /afterTax/.test(text), 'the questions and the answer shape');
    ok(!/[a-z0-9]{6}-[a-z0-9]{10}-\d/.test(text), 'no ids');
    const reply = 'Here you go:\n```json\n' + JSON.stringify({ country: 'JP', currency: 'JPY', banks: MAKO.banks, pays: MAKO.pays, cards: MAKO.cards, bills: MAKO.bills, free: null, min: null }) + '\n```';
    let r = K.pasteBack(K.fresh(), reply, d9);
    ok(r.ok, r.text);
    eq(r.state.draft.banks[0], { name: 'Main bank', amount: 286000, on: '2026-11-24' });
    eq(K.draftCard(r.state.draft, h9.day).need, ['Has Phone, due 20 Nov, come out of Main bank already?']);
    /* the asked answers come next, in a second paste (the copy prompt names them once the bills are in) */
    ok(/Has Phone, due 20 Nov, come out of Main bank already\?/.test(K.copyPrompt(r.state, h9.day)), 'the second request asks it');
    r = K.pasteBack(r.state, '{"asked":[{"name":"Phone","out":true}]}', d9);
    ok(r.ok, r.text);
    const f = await K.fillNow(r.state, d9);
    ok(f.ok, f.text); eq(safe(h9), 201400);
    const badPaste = K.pasteBack(K.fresh(), '{"pays":[{"name":"Pay","amount":300000,"every":"month","day":10}]}', d9);
    ok(!badPaste.ok && /before or after tax/.test(badPaste.text), badPaste.text);
    ok(!K.pasteBack(K.fresh(), 'sorry, I cannot help', d9).ok);
  });
  await t('an amount in the AI\'s words that is not in the figures, the draft or the person\'s words is marked "check this" (AI_FIRST_PLAN 7)', async () => {
    const h10 = page('2026-11-24');
    await runSetup(h10, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('Safe to spend is 201,400 until 10 Dec, so a 9,000 dinner fits. You will have about 150,000 left.')]);
    const r = await K.turn(K.fresh(), 'can I afford a 9,000 dinner?', h10.deps(f));
    eq(r.shown.find(x => x.who === 'ai').check, ['150,000']);
  });
  /* ---- AI_JOIN_FIXES C: "Fill in my Burrow" needs a whole answer (qc-foundation 3 and 6, qc-assistant blocker 6) ---- */
  const edits = (h, list) => { let st = K.fresh(); const deps = h.deps(FAKE.make([])); for (const [sec, v] of list) { const r = K.draftEdit(st, sec, v, deps); ok(r.ok, sec + ': ' + r.text); st = r.state; } return st; };
  await t('[C] the bank answer alone is not enough: the fill waits for the country, the currency, a pay, everyday money and the minimum', async () => {
    const h = page('2026-11-24'), st = edits(h, [['banks', [{ name: 'Main bank', amount: 286000 }]]]);
    const card = K.draftCard(st.draft, h.day);
    eq(card.ready, false);
    eq(card.need, ['Which country do you bank in?', 'Which currency? Yen, pesos, dollars or euros', 'How are you paid? A day each month, every week or two, or no fixed pay', 'How much for food and everyday stuff each pay period? Or skip it', 'Keep at least how much in your bank? Or no minimum']);
    const f = await K.fillNow(st, h.deps(FAKE.make([])));
    ok(!f.ok && h.book === null && /Which country/.test(f.text), f.text);
  });
  /* [qc-assistant run 2 blocker 1; M30, M5] a spend on a card shows the card's own figure before and after, never only
     two equal safe to spend figures */
  await t('[M30] a spend on a card: the change card has a row for that card, Still owed before and after (the engine\'s)', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const cardA = hp.book.accounts.find(a => a.name === 'Card A').id, cardB = hp.book.accounts.find(a => a.name === 'Card B').id;
    const owed0 = L.lookahead(hp.book, hp.day).cards[cardA].owedNow;
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, account: 'A2' }] })]), say('Logged.')]);
    const r = await K.turn(state, 'I bought lunch, 900 on card A', hp.deps(f));
    const c = r.shown.find(x => x.who === 'card').card;
    const row = c.rows.find(x => x.key === 'card:' + cardA);
    eq(row, { key: 'card:' + cardA, label: 'Card A, still owed', before: owed0, after: L.lookahead(hp.book, hp.day).cards[cardA].owedNow });
    eq([row.before, row.after], [54000, 54900]);
    ok(!c.rows.some(x => x.key === 'card:' + cardB), 'a card that did not change has no row');
  });
  /* [M30, M77; the coordinator's ruling 26 Nov] Mako's shape, worked by hand: Main bank 286,000, less Power 7,400, Rent
     72,000 and Internet 5,200 before pay on 10 Dec = 201,400. Card A is paid on the 10th, the pay day, so lunch 900 on it
     leaves the headline at 201,400 when Free to spend is not set: the card says why, in one true line. With Free to
     spend at 30,000 (16,000 counts for the days left) the same lunch takes 900 off both at once, and no such line */
  await t('[M30, M77] lunch 900 on Card A: with no Free to spend the headline stays 201,400 and the card says why; with it set, 16,000 to 15,100', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const lunch = say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, account: 'A2' }] })]);
    const r = await K.turn(state, 'lunch 900 on card A', hp.deps(FAKE.make([lunch, say('Logged.')])));
    const c = r.shown.find(x => x.who === 'card').card;
    eq(c.rows.map(x => [x.label, x.before, x.after]), [['Safe to spend', 201400, 201400], ['Card A, still owed', 54000, 54900]]);
    eq(c.note, 'Safe to spend stays the same: Card A is paid from your bank on or after your next pay');
    const hq = page('2026-11-24'); const q = await runSetup(hq, FAKE.make(steps(SETUP)));
    const d = hq.deps(FAKE.make([say('', [call('change', { steps: [{ do: 'set_free', amount: 30000 }] })]), say('Set.'), lunch, say('Logged.')]));
    const q1 = await K.turn(q.state, 'set Free to spend to 30,000', d);
    const q2 = await K.turn(q1.state, 'lunch 900 on card A', d);
    const c2 = q2.shown.find(x => x.who === 'card').card;
    eq(c2.rows.map(x => [x.label, x.before, x.after]), [['Safe to spend', 16000, 15100], ['Free to spend left', 16000, 15100], ['Card A, still owed', 54000, 54900]]);
    ok(!c2.note, 'no line when the headline moved: ' + c2.note);
    /* a spend from the bank moves the headline: no line */
    const r3 = await K.turn(r.state, 'coffee 400 from Main bank', hp.deps(FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 400, account: 'A1' }] })]), say('Logged.')])));
    ok(!r3.shown.find(x => x.who === 'card').card.note, 'bank spend');
  });
  /* [qc-assistant, confusing] two steps asked, one left out: the card says which was not done, never without a word */
  await t('two steps asked and one left out: the card says which one was not done', async () => {
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_goal', name: 'Trip', target: 100000 }, { do: 'set_aside', goal: 'G1', amount: 5000 }] })]), say('Added the goal.')]);
    const r = await K.turn(state, 'add a goal called Trip for 100,000 and set aside 5,000 for it', hp.deps(f));
    const c = r.shown.find(x => x.who === 'card').card;
    eq([c.status, c.lines.length, c.left], ['done', 1, ['money set aside for a goal']]);
    /* a step that waits on a question says so in plain words, never the note written for the AI */
    const f2 = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 700, account: 'A1' }, { do: 'log_spend', amount: 800 }] })]), say('Card or bank for the 800?')]);
    const r2 = await K.turn(r.state, 'I spent 700 from Main bank and 800 on a taxi', hp.deps(f2));
    const c2 = r2.shown.find(x => x.who === 'card').card;
    eq([c2.status, c2.left], ['done', ['one step that needs an answer from you first']]);
    /* nothing left out: no such line */
    const f3 = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 600, account: 'A1' }] })]), say('Logged.')]);
    const r3 = await K.turn(r2.state, 'I spent 600 from Main bank', hp.deps(f3));
    eq(r3.shown.find(x => x.who === 'card').card.left, []);
  });
  /* [qc-assistant blocker 3; M17] "what does this screen do?": one table with a plain line for every screen and every
     sheet, told to the assistant, and the open sheet's own name with each message */
  await t('[M17] one table says what every screen and sheet is for; the open screen and sheet go with each message', async () => {
    const want = ['home', 'plan', 'receipts', 'settings', 'check', 'stmt', 'reminders', 'setup', 'welcome',
      'free', 'addLine', 'line', 'addBill', 'bill', 'pay', 'addGoal', 'goal', 'addCard', 'card', 'addLoan', 'loan', 'addAccount', 'account', 'closeAccount', 'closedAccount', 'record'];
    eq(Object.keys(K.SCREENS).sort(), want.slice().sort(), 'the rows');
    for (const k of want) {
      const row = K.SCREENS[k];
      ok(row && row.name && row.does && row.does.split(' ').length >= 6, k + ' has a name and a plain line');
      ok(K.SYSTEM.includes(row.name + ': ' + row.does), k + ' is in what the assistant is told');
    }
    const hp = page('2026-11-24'); const { state } = await runSetup(hp, FAKE.make(steps(SETUP)));
    const sent = (screen, sheet) => { const b = K.request(state, 'what does this screen do?', [], { book: hp.book, today: hp.day, screen, sheet }); return b.messages[b.messages.length - 1].content[0].text; };
    ok(sent('plan', { key: 'addCard', title: 'Add a card' }).includes('SCREEN: the person has Plan open, with the sheet "Add a card" on top. ' + K.SCREENS.addCard.does), sent('plan', { key: 'addCard', title: 'Add a card' }).split('\n').find(l => /^SCREEN/.test(l)));
    /* a sheet named after the person's own record says what kind of sheet it is */
    ok(sent('plan', { key: 'card', title: 'Card A' }).includes('with the sheet "Card A" (' + K.SCREENS.card.name + ') on top. ' + K.SCREENS.card.does), 'a card\'s own sheet');
    ok(sent('home', null).includes('SCREEN: the person has Home open. ' + K.SCREENS.home.does), 'no sheet');
    ok(!/SCREEN:/.test(sent(null, null)), 'no screen told, none said');
  });
  await t('[C] a whole answer with "no fixed pay", everyday money skipped and no minimum can be filled', async () => {
    const h = page('2026-11-24'), st = edits(h, [['country', 'XX'], ['currency', 'USD'], ['banks', [{ name: 'Main bank', amount: '1234.56' }]], ['pays', [{ name: 'Work', every: 'none' }]], ['free', null], ['min', null]]);
    eq(K.draftCard(st.draft, h.day).need, []);
    const f = await K.fillNow(st, h.deps(FAKE.make([])));
    ok(f.ok, f.text);
    eq([h.book.home && L.lookahead(h.book, h.day).safeToSpend.headline, JSON.stringify(h.book).includes('"USD"')], [123456, true], 'dollars with cents: 1,234.56 is 123456 cents');
  });
  await t('[C] the currency is its own answer: an amount typed before it changed is asked again, never read in the old currency (50,000 then pesos is not 500.00)', async () => {
    const h = page('2026-11-24');
    let st = edits(h, [['banks', [{ name: 'Main bank', amount: 50000 }]], ['bills', [{ name: 'Rent', amount: 9000, day: 27 }]], ['free', 3000]]);
    const r = K.draftEdit(st, 'country', 'PH', h.deps(FAKE.make([])));
    ok(r.ok && /asked again/.test(r.shown[0].text), r.shown[0].text);
    st = edits2(h, r.state, [['currency', 'PHP']]);
    const u = K.draftEdit(edits2(h, st, [['banks', [{ name: 'Main bank', amount: 700 }]]]), 'currency', 'USD', h.deps(FAKE.make([])));
    ok(u.ok && /asked again/.test(u.shown[0].text) && !/700/.test(JSON.stringify(K.draftCard(u.state.draft, h.day))), 'pesos to dollars asks again too');
    const card = K.draftCard(st.draft, h.day), words = JSON.stringify(card);
    ok(!/500\.00|50,000|9,000|90\.00/.test(words), words);
    ok(card.need.filter(x => x === 'What does Main bank show today?').length === 1 && card.need.some(x => /everyday/.test(x)), JSON.stringify(card.need));
    st = edits2(h, st, [['banks', [{ name: 'Main bank', amount: 50000 }]]]);
    ok(K.draftCard(st.draft, h.day).need.includes('How much is Rent?'), 'then the bill\'s amount is asked again: ' + JSON.stringify(K.draftCard(st.draft, h.day).need));
    ok(/₱50,000 on/.test(JSON.stringify(K.draftCard(st.draft, h.day))), JSON.stringify(K.draftCard(st.draft, h.day).sections[2]));
  });
  await t('[C] saying the currency the amounts were already read in loses nothing (Japan, then 286,000, then "yen")', async () => {
    const h = page('2026-11-24'), st = edits(h, [['country', 'JP'], ['banks', [{ name: 'Main bank', amount: 286000 }]], ['currency', 'JPY']]);
    ok(/¥286,000/.test(JSON.stringify(K.draftCard(st.draft, h.day))));
    ok(!K.draftCard(st.draft, h.day).need.includes('What does Main bank show today?'));
  });
  /* ---- AI_JOIN_FIXES H: what the assistant is told ---- */
  await t('[H1] it never offers to read a file, statement, payslip or screenshot: nothing it is told offers one, and it is told it cannot yet', async () => {
    const told = K.SYSTEM + ' ' + K.GUIDE.map(g => g.ask).join(' ');
    ok(!/send me|I'll read|screenshot|upload|photo/i.test(told), (told.match(/.{0,60}(send me|I'll read|screenshot|upload|photo).{0,60}/i) || [''])[0]);
    ok(/can't read files/i.test(K.SYSTEM) && /type the figures/i.test(K.SYSTEM), 'it is told it cannot read files yet, and to ask for the figures typed');
    const body = (await (async () => { const f = FAKE.make([say('ok')]); await K.turn(K.fresh(), 'hi', page('2026-11-24').deps(f)); return f.bodies[0]; })());
    ok(!/send me|I'll read|screenshot/i.test(body.system), 'what is sent says the same');
  });
  await t('[H2] the first screen already asks the first question: the welcome ends with it, and the first request says it was asked', async () => {
    const w = K.welcome();
    eq(w.length, 3); ok(/^Which country do you bank in, and in which currency\?/.test(w[2]), w[2]);
    const f = FAKE.make([say('ok')]); await K.turn(K.fresh(), 'Japan, yen', page('2026-11-24').deps(f));
    const sent = JSON.stringify(f.bodies[0].messages);
    ok(/The first screen already showed the welcome and asked: Which country do you bank in/.test(sent), 'the first request says the question was asked');
    const f2 = FAKE.make([say('ok'), say('ok')]); const h2 = page('2026-11-24');
    const r1 = await K.turn(K.fresh(), 'Japan, yen', h2.deps(f2)); await K.turn(r1.state, 'Main bank', h2.deps(f2));
    ok(!/The first screen already showed/.test(JSON.stringify(f2.bodies[1].messages)), 'only before the first answer');
  });
  await t('[H3] "I don\'t know" has a way on: the bank figure can be left for later with the draft kept; the close day says where to find it', async () => {
    const h = page('2026-11-24');
    let st = edits2(h, K.fresh(), [['country', 'JP'], ['currency', 'JPY']]);
    const r = K.draftEdit(st, 'banks', [{ name: 'Main bank', amount: null }], h.deps(FAKE.make([])));
    ok(r.ok, r.text); st = r.state;
    ok(/for later/.test(r.shown[0].text), r.shown[0].text);
    eq(st.draft.banks.map(b => [b.name, b.amount]), [['Main bank', null]]);
    const card = K.draftCard(st.draft, h.day);
    ok(card.need.includes('What does Main bank show today?'), 'still asked before the fill');
    eq(card.sections.find(x => x.key === 'banks').lines, ['Main bank: for later']);
    st = edits2(h, st, [['pays', MAKO.pays]]);
    eq(st.draft.banks[0].name, 'Main bank', 'the draft goes on with it');
    st = edits2(h, st, [['banks', [{ name: 'Main bank', amount: 286000 }]]]);
    eq([st.draft.banks[0].amount, st.draft.banks[0].on], [286000, '2026-11-24']);
    ok(/leave it for later/i.test(K.GUIDE[4].ask), K.GUIDE[4].ask);
    ok(/card app|statement/.test(K.GUIDE[9].ask) && /close day/i.test(K.GUIDE[9].ask) && /(find|it's on|it is on)/i.test(K.GUIDE[9].ask), K.GUIDE[9].ask);
    ok(/don't know/i.test(K.SYSTEM) && /for later/.test(K.SYSTEM), 'the AI is told the way on');
  });
  await t('[H4] it is told which screen is open and what the screens can do that it cannot; a refusal says where', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'take_out', goal: 'G1', amount: 5000 }] })]), say('ok'), say('ok')]);
    const deps = Object.assign(h.deps(f), { door: d0.door, screen: () => 'plan' });
    const r = await K.turn(state, 'take 5,000 out of the trip goal', deps);
    const sent = JSON.stringify(f.bodies[0].messages);
    ok(/SCREEN: the person has Plan open/.test(sent), 'the open screen is sent');
    const res = FAKE.results(f.bodies[1])[0].text;
    ok(/^Nothing changed: /.test(res) && /Plan, tap the goal/.test(res), res);
    ok(/WHERE ON THE SCREENS/.test(K.SYSTEM) && /Receipts, tap it/.test(K.SYSTEM) && /Settings/.test(K.SYSTEM), 'the map of the screens');
    eq(r.shown.filter(x => x.who === 'card' && x.card.kind === 'change').length, 0, 'nothing changed, no change card');
    const f2 = FAKE.make([say('ok')]);
    await K.turn(state, 'hi', Object.assign(h.deps(f2), { door: d0.door }));
    ok(!/SCREEN:/.test(JSON.stringify(f2.bodies[0].messages)), 'no screen given, no line');
  });
  await t('[H5] a bank figure far from what the app expected asks first, with the gap in words; a near one goes in', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
    const fig = (amount) => [body => say('', [call('change', { steps: [{ do: 'bank_figure', account: refIn(body, 'Main bank'), amount }] })]), say('ok')];
    const main = h.book.home.main.v.acct, bank = () => L.lookahead(h.book, h.day).accounts[main].bank;
    let f = FAKE.make(fig(3000000));
    let r = await K.turn(state, 'my bank shows 3,000,000', Object.assign(h.deps(f), { door: d0.door }));
    let c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'ask' && c.card.ask === 'gap', JSON.stringify(c && c.card));
    ok(/Main bank shows ¥3,000,000 today\. The app expected ¥286,000: ¥2,714,000 more than it had/.test(c.card.lines[0]), c.card.lines[0]);
    eq(bank(), 286000, 'nothing written before the OK');
    const ok2 = await K.confirm(r.state, c.id, Object.assign(h.deps(FAKE.make([])), { door: d0.door }));
    ok(ok2.ok, ok2.text); eq(bank(), 3000000, 'after Do it');
    await d0.door.undo(ok2.state.turns.find(x => x.id === c.id).card.steps[0], { quiet: true });
    eq(bank(), 286000, 'Undo');
    f = FAKE.make(fig(280000));
    r = await K.turn(state, 'my bank shows 280,000', Object.assign(h.deps(f), { door: d0.door }));
    c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'done', JSON.stringify(c && c.card)); eq(bank(), 280000, 'a figure near what was expected goes in at once');
  });
  await t('[H6] a spend with no account named, when cards exist, asks "card or bank?" once and remembers the answer for the chat', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
    const D = f => Object.assign(h.deps(f), { door: d0.door });
    let res = '';
    let f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, note: 'lunch' }] })]), body => { res = FAKE.results(body)[0].text; return say('Card or bank? Card A, Card B or Main bank'); }]);
    let r = await K.turn(state, 'I bought lunch, 900', D(f));
    ok(/^Nothing changed: /.test(res) && /Card A, Card B or Main bank/.test(res) && /once/.test(res), res);
    eq(r.shown.filter(x => x.who === 'card' && x.card.kind === 'change').length, 0, 'nothing logged');
    eq(safe(h), 201400);
    f = FAKE.make([body => say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, note: 'lunch', account: refIn(body, 'Card A') }] })]), say('Logged on Card A.')]);
    r = await K.turn(r.state, 'Card A', D(f));
    let c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'done' && /from Card A/.test(c.card.lines[0]), JSON.stringify(c && c.card));
    f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 400, note: 'coffee' }] })]), say('Logged.')]);
    r = await K.turn(r.state, 'coffee 400', D(f));
    c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'done' && /Log ¥400 on Free to spend from Card A/.test(c.card.lines[0]), JSON.stringify(c && c.card));
    ok(/pay with Card A/.test(JSON.stringify(f.bodies[0].messages)), 'the AI is told the answer kept for the chat');
    /* a book with no cards: a spend with no account goes on the main bank, as before */
    const h2 = page('2026-11-24'); const { state: s2, deps: d2 } = await runSetup(h2, FAKE.make(steps(SETUP.map(x => x[0].startsWith('Card A') ? [x[0], [say('', [call('draft_set', { section: 'cards', value: [] })]), say(K.GUIDE[10].ask)]] : x))));
    f = FAKE.make([say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, note: 'lunch' }] })]), say('Logged.')]);
    r = await K.turn(s2, 'I bought lunch, 900', Object.assign(h2.deps(f), { door: d2.door }));
    c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'done' && /from Main bank/.test(c.card.lines[0]), JSON.stringify(c && c.card));
  });
  await t('[H7] adding a bank asks both of its questions in one go', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const D = f => Object.assign(h.deps(f), { door: d0.door });
    let res = '';
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', amount: 50000 }] })]), body => { res = FAKE.results(body)[0].text; return say('ok'); }]);
    const r = await K.turn(state, 'add my savings account, it has 50,000', D(f));
    ok(/^Nothing changed: /.test(res), res);
    ok(/Is this new money, or moved from Main bank since today\?/.test(res) && /before or after you looked at Main bank today\?/.test(res) && /one message/.test(res), res);
    eq(r.shown.filter(x => x.who === 'card' && x.card.kind === 'change').length, 0, 'no refused card: the AI asks both first');
    ok(/Adding a bank/.test(K.SYSTEM) && /both/.test(K.SYSTEM), 'the AI is told to ask both at once');
    /* both answered: it goes in */
    const f2 = FAKE.make([say('', [call('change', { steps: [{ do: 'add_account', name: 'Savings', amount: 50000, moved: false }] })]), say('Added.')]);
    const r2 = await K.turn(r.state, 'new money', D(f2));
    const c = r2.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'done', JSON.stringify(c && c.card));
  });
  /* [STALE_SHEET_PLAN, M61] the assistant's changes are made on the book as it was when the figures were sent */
  await t('[stale] a card waiting for OK is not carried out when the book changed somewhere else since it was offered', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
    const main = h.book.home.main.v.acct, bank = () => L.lookahead(h.book, h.day).accounts[main].bank;
    const f = FAKE.make([body => say('', [call('change', { steps: [{ do: 'bank_figure', account: refIn(body, 'Main bank'), amount: 3000000 }] })]), say('ok')]);
    const r = await K.turn(state, 'my bank shows 3,000,000', Object.assign(h.deps(f), { door: d0.door }));
    const c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    ok(c && c.card.status === 'ask' && typeof c.card.ver === 'string' && c.card.ver.length < 24, JSON.stringify(c && c.card).slice(0, 200));
    ok(!JSON.stringify(f.bodies).includes(c.card.ver), 'the mark is never sent');
    ok((await d0.door.logSpend({ date: h.day, a: 1200, acct: main, note: 'lunch' })).ok, 'meanwhile, a spend on the screen');
    const before = JSON.stringify(h.book);
    const res = await K.confirm(r.state, c.id, Object.assign(h.deps(FAKE.make([])), { door: d0.door }));
    eq([res.ok, JSON.stringify(h.book) === before, bank()], [false, true, 284800]);
    ok(/changed somewhere else/.test(res.text), res.text);
  });
  await t('[stale] the book changes while the AI is answering: its change is not carried out and the person is told to say it again', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const main = h.book.home.main.v.acct;
    const f = FAKE.make([body => say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, account: 'A1', note: 'tea' }] })]), say('ok')]);
    const send = async body => { if (f.bodies.length === 0) await d0.door.logSpend({ date: h.day, a: 1200, acct: main, note: 'lunch' }); return f.send(body); };   // another tab or device, during the wait
    const r = await K.turn(state, 'I spent 900 on tea', Object.assign(h.deps(f), { door: d0.door, send }));
    ok(!h.book.events.some(e => e.note === 'tea'), 'nothing carried out');
    ok(lastNote(r).some(x => /Nothing was changed, because something changed somewhere else while I was answering/.test(x)), JSON.stringify(lastNote(r)));
    const f2 = FAKE.make([body => say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, account: 'A1', note: 'tea' }] })]), say('ok')]);
    await K.turn(r.state, 'I spent 900 on tea', Object.assign(h.deps(f2), { door: d0.door }));
    ok(h.book.events.some(e => e.a === 900 && !e.gone), 'said again, it goes in');
  });
  await t('[stale] one card, two steps: its own first step never refuses its second', async () => {
    const h = page('2026-11-24'); const { state, deps: d0 } = await runSetup(h, FAKE.make(steps(SETUP)));
    const f = FAKE.make([body => say('', [call('change', { steps: [{ do: 'log_spend', amount: 900, account: 'A1', note: 'tea' }, { do: 'log_spend', amount: 700, account: 'A1', note: 'bun' }] })]), say('ok')]);
    const r = await K.turn(state, 'I spent 900 on tea and 700 on a bun', Object.assign(h.deps(f), { door: d0.door }));
    const c = r.shown.find(x => x.who === 'card' && x.card.kind === 'change');
    eq([c.card.status, h.book.events.filter(e => e.k === 'spend' && !e.gone && (e.a === 900 || e.a === 700)).length], ['done', 2]);
  });
  await t('[one figure, one source] the pay and bill amounts sent to the AI are the engine\'s own (its schedule view): a change dated later is not quoted as today\'s', async () => {
    const h = page('2026-11-24'); await runSetup(h, FAKE.make(steps(SETUP)));
    const P = require(E + 'periods.js');
    for (const kind of ['income', 'bill']) {
      const x = h.book.schedules.find(s => s && !s.gone && s.kind === kind && (s.steps || []).length);
      ok(x, 'the setup book has a ' + kind);
      const first = x.steps[0];
      /* a change dated later (a rise from June): the last step in the list is not the one in force today */
      x.steps = [first, Object.assign({}, first, { id: first.id + 'z', from: '2027-06-01', amount: first.amount + 11100, at: '2026-11-24T12:00:00.000+09:00' })];
      const view = P.scheduleView(h.book, h.day)[x.id];
      eq(view.amount, first.amount, 'the engine reads the step in force today');
      const line = K.figures(h.book, h.day).text.split('\n').find(l => l.includes('| ' + x.name + ' |'));
      const SMn = require('../../screens/money.js');
      ok(line && line.includes('| ' + SMn.format(view.amount, x.cur || 'JPY') + ' |'), kind + ': the line sent is ' + line + ', the engine says ' + view.amount);
    }
  });
  /* [qc-assistant run 4, fix B ruled 26 Nov] one set of setup answers before the book exists: a section's Save on the
     setup screens writes that section into the chat's draft (K.fromScreens), its Undo puts the draft back
     (K.undoScreens), the newest answer wins both ways (K.chatNewer). Amounts are minor units, never read as typed.
     Made-up: Sora Bank 250,000 told in the chat on Tue 24 Nov 2026, 260,000 saved on the screens, 270,000 told later */
  {
    const AN = require('../src/answers3.js'), DAY2 = '2026-11-24';
    const deps = { today: () => DAY2, told: () => DAY2 + 'T10:00:00.000+09:00', book: () => null };
    const told = (st, sec, v) => { const r = K.draftEdit(st, sec, v, deps); if (!r.ok) throw new Error(r.text); return r.state; };
    const form = (cur, over) => Object.assign({ bankName: 'Sora Bank', bank: 260000, cur, country: cur === 'JPY' ? 'JP' : 'XX', accts: [], payToday: null,
      pay: { name: 'Pay', amount: null, every: 'month', day: 25, day2: null, start: null, shift: 'before', acct: 'bank1' }, pays: [], cards: [], bills: [], free: null, min: null }, over);
    const chat = cur => { let st = K.fresh(); st = told(st, 'country', cur === 'JPY' ? 'JP' : 'XX'); st = told(st, 'currency', cur); st = told(st, 'banks', [{ name: 'Sora Bank', amount: cur === 'JPY' ? '250000' : '2500' }]);
      return told(st, 'pays', [{ name: 'Pay', amount: cur === 'JPY' ? '240000' : '3000', every: 'month', day: 10, afterTax: true }]); };
    await t('[fix B] a bank Save on the screens (250,000 to 260,000) writes the chat\'s draft; the chat\'s other answers stay', async () => {
      ok(typeof K.fromScreens === 'function', 'K.fromScreens is there');
      const r = K.fromScreens(chat('JPY'), 'bank', AN.fromForm(form('JPY'), { day: DAY2 }));
      eq(r.state.draft.banks.map(b => [b.name, b.amount, b.on]), [['Sora Bank', 260000, DAY2]], 'banks');
      eq(r.state.draft.pays.map(p => [p.name, p.amount, p.day]), [['Pay', 240000, 10]], 'the chat\'s pay is not touched');
      ok(K.draftCard(r.state.draft, DAY2).sections.find(x => x.key === 'banks').lines[0].includes('260,000'), '"Your answers so far" reads 260,000');
      eq(K.chatNewer(r.state, 'bank'), false, 'right after the Save the chat holds nothing newer');
    });
    await t('[fix B] Undo of that Save puts the chat\'s draft back to 250,000', async () => {
      const st0 = chat('JPY'), r = K.fromScreens(st0, 'bank', AN.fromForm(form('JPY'), { day: DAY2 }));
      const u = K.undoScreens(r.state, 'bank', r.before, r.wrote);
      eq(u.state.draft, st0.draft, 'the draft as before the Save');
    });
    await t('[fix B] an answer changed in the chat AFTER the screens\' Save wins (270,000), at the fill and against an Undo', async () => {
      const r = K.fromScreens(chat('JPY'), 'bank', AN.fromForm(form('JPY'), { day: DAY2 }));
      const st = told(r.state, 'banks', [{ name: 'Sora Bank', amount: '270000' }]);
      eq(K.chatNewer(st, 'bank'), true, 'the chat holds a newer bank');
      eq(K.chatNewer(st, 'pay'), true, 'a section the screens never saved and the chat holds counts as newer');
      eq(K.chatNewer(st, 'cards'), false, 'a section the chat does not hold is not newer');
      eq(st.draft.banks[0].amount, 270000, 'the draft (what the fill writes) holds 270,000');
      eq(K.undoScreens(st, 'bank', r.before, r.wrote).state.draft.banks[0].amount, 270000, 'Undo of the older screens Save leaves the newer chat answer');
      /* the chat changed another section since: Undo still takes back the bank Save only */
      const st2 = told(r.state, 'min', null), u2 = K.undoScreens(st2, 'bank', r.before, r.wrote).state.draft;
      eq([u2.banks[0].amount, u2.min], [250000, null], 'Undo with another section changed since');
    });
    await t('[fix B] the same in a cents currency: 2,500.00 in the chat, 2,600.50 saved on the screens, Undo', async () => {
      const st0 = chat('USD'), r = K.fromScreens(st0, 'bank', AN.fromForm(form('USD', { bank: 260050 }), { day: DAY2 }));
      eq([r.state.draft.currency, r.state.draft.banks[0].amount, r.state.draft.pays[0].amount], ['USD', 260050, 300000], 'cents kept as minor units');
      ok(K.draftCard(r.state.draft, DAY2).sections.find(x => x.key === 'banks').lines[0].includes('2,600.50'), 'the card reads 2,600.50');
      eq(K.undoScreens(r.state, 'bank', r.before, r.wrote).state.draft.banks[0].amount, 250000, 'Undo');
    });
    await t('[fix B] a currency changed on the screens drops the chat\'s other amounts, as draft_set does; Undo brings them back', async () => {
      const st0 = chat('JPY'), r = K.fromScreens(st0, 'bank', AN.fromForm(form('EUR', { bank: 260000 }), { day: DAY2 }));
      eq([r.state.draft.currency, r.state.draft.banks[0].amount, r.state.draft.pays[0].amount], ['EUR', 260000, null], 'the pay is asked again');
      eq(K.undoScreens(r.state, 'bank', r.before, r.wrote).state.draft, st0.draft, 'Undo');
    });
    await t('[fix B] every section maps: pay, free, cards, bills, min; and nothing is written once the draft became a book', async () => {
      const f = form('JPY', { pay: { name: 'Pay', amount: 245000, every: 'month', day: 10, day2: null, start: null, shift: 'before', acct: 'bank1' }, free: 40000, min: 10000,
        cards: [{ name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'after', statement: null }],
        bills: [{ name: 'Rent', amount: 72000, every: 'month', month: null, day: 27, from: 'bank1', takenOut: 'yes' }] });
      let st = chat('JPY');
      for (const sec of ['pay', 'free', 'cards', 'bills', 'min']) st = K.fromScreens(st, sec, AN.fromForm(f, { day: DAY2 })).state;
      eq([st.draft.pays[0].amount, st.draft.free, st.draft.min, st.draft.cards[0].owed, st.draft.cards[0].on, st.draft.bills[0].amount, st.draft.banks[0].amount], [245000, 40000, 10000, 54000, DAY2, 72000, 250000]);
      const filled = Object.assign({}, st, { fill: { at: 'x', day: DAY2, grp: 'g' } });
      const r = K.fromScreens(filled, 'min', AN.fromForm(form('JPY', { min: 1 }), { day: DAY2 }));
      eq([r.state.draft.min, r.wrote], [10000, null], 'no write after the fill');
    });
    await t('[fix B, qc-foundation 1] an account renamed in place on the screens is renamed in the chat\'s pays, cards and bills', async () => {
      let st = chat('JPY');
      st = told(st, 'banks', [{ name: 'Sora Bank', amount: '250000' }, { name: 'Kumo Bank', amount: '30000' }]);
      st = told(st, 'cards', [{ name: 'Card A', owed: '5000', payDay: 10, closeDay: 'not sure', payFrom: 'Kumo Bank' }]);
      st = told(st, 'bills', [{ name: 'Rent', amount: '72000', day: 27, from: 'Kumo Bank' }]);
      const r = K.fromScreens(st, 'bank', AN.fromForm(form('JPY', { accts: [{ name: 'Kumo Savings', amount: 30000, type: 'bank' }] }), { day: DAY2 }));
      eq([r.state.draft.banks[1].name, r.state.draft.cards[0].payFrom, r.state.draft.bills[0].from], ['Kumo Savings', 'Kumo Savings', 'Kumo Savings']);
    });
    await t('[fix B, qc-foundation 5, 6] null and missing are the same answer; Undo after the fill changes nothing', async () => {
      const r = K.fromScreens(chat('JPY'), 'free', AN.fromForm(form('JPY'), { day: DAY2 }));
      const st = JSON.parse(JSON.stringify(r.state)); delete st.draft.free;
      eq(K.chatNewer(st, 'free'), false, 'free missing against free null');
      const filled = Object.assign({}, r.state, { fill: { at: 'x', day: DAY2, grp: 'g' } });
      const u = K.undoScreens(filled, 'free', r.before, r.wrote);
      eq([u.ok, u.state.draft], [false, filled.draft], 'refused after the fill');
    });
    await t('[fix B, qc-foundation 7] round trip: the chat\'s answers, every section saved on the screens, give the screens\' own book input', async () => {
      const f = form('JPY', { accts: [{ name: 'Wallet', amount: 8000, type: 'cash' }], pay: { name: 'Pay', amount: 245000, every: 'month', day: 10, day2: null, start: null, shift: 'before', acct: 'bank1' }, free: 40000, min: null,
        cards: [{ name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', payFrom: 'bank1', shift: 'after', statement: null }],
        bills: [{ name: 'Rent', amount: 72000, every: 'month', month: null, day: 27, from: 'bank1', takenOut: 'yes' }, { name: 'Phone', amount: 4800, every: 'month', month: null, day: 20, from: 'bank1', takenOut: 'yes' }] });
      const ans = AN.fromForm(f, { day: DAY2 });
      let st = chat('JPY');
      for (const sec of ['bank', 'pay', 'free', 'cards', 'bills', 'min']) st = K.fromScreens(st, sec, ans).state;
      const o = { day: DAY2, told: DAY2 + 'T10:00:00.000+09:00' };
      eq(AN.toBuild(st.draft, o), AN.toBuild(ans, o), 'the same book input');
      eq(K.fillCheck(st.draft, DAY2, 'none').ok, true, 'the chat\'s fill asks nothing more');
    });
  }
  /* [qc-data-safety run 3 CONFUSING 1, coordinator 16's ruling b] setup finished on the screens while the chat was part
     way: the chat's setup card closes (one note says why), every refused step says it was not done, and the AI's own
     "Done" after a turn where nothing was added is marked as not done */
  await t('[CONFUSING 1] setup finished on the screens: the setup card closes, refused steps say not done, never Done', async () => {
    const h = page('2026-11-24');
    let { state } = await runSetup(h, FAKE.make(steps(SETUP.slice(0, 13))), 13);
    ok(state.turns.some(x => x.who === 'card' && x.card.kind === 'draft'), 'a setup card is in the chat before');
    /* the screens finish setup: a book appears that the chat did not make */
    const h2 = page('2026-11-24'); await runSetup(h2, FAKE.make(steps(SETUP)));
    h.book = h2.book;
    const before = JSON.stringify(h.book);
    const fake = FAKE.make([
      say('', [call('draft_set', { section: 'cards', value: [{ name: 'Card C', owed: 10000, payDay: 5, closeDay: 'not sure', shift: 'after' }] }), call('fill_book', {})]),
      say("Done. Here's Home."),
    ]);
    const r = await K.turn(state, 'add Card C, 10,000, paid on the 5th', h.deps(fake));
    eq(JSON.stringify(h.book), before, 'nothing was added to the book');
    eq(K.setupShut(r.state, h.book), true, 'the setup cards are closed while the screens\' book is here');
    ok(!r.shown.some(x => x.who === 'card' && x.card.kind === 'draft'), 'no new setup card');
    const notes = lastNote(r);
    ok(notes.some(n => /finished on the screens/.test(n)), 'one note says setup was finished on the screens: ' + JSON.stringify(notes));
    ok(notes.some(n => /^Not saved: /.test(n)), 'the refused answer says it was not saved: ' + JSON.stringify(notes));
    ok(notes.some(n => /^Not filled in: /.test(n)), 'the refused fill says it was not done: ' + JSON.stringify(notes));
    const ai = r.shown.filter(x => x.who === 'ai').pop();
    eq(ai.notDone, true, 'the AI\'s Done is marked not done');
    /* a second turn does not add the closing note again */
    const r2 = await K.turn(r.state, 'thanks', h.deps(FAKE.make([say('You are welcome')])));
    ok(!lastNote(r2).some(n => /finished on the screens/.test(n)), 'the closing note is said once');
    eq(r2.shown.filter(x => x.who === 'ai').pop().notDone, undefined, 'words with nothing refused are not marked');
    /* the AI is told its own Done was not done */
    const sent = JSON.stringify(K.request(r2.state, 'next', [], { book: h.book, today: h.day }).messages);
    ok(/Done\. Here's Home\. \(the app did not do this: nothing was added\)/.test(sent), 'the AI is sent that its Done was not done');
    /* a change with every step refused says not done too */
    const r3 = await K.turn(r2.state, 'do something odd', h.deps(FAKE.make([say('', [call('change', { steps: [{ do: 'no_such_thing' }] })]), say('Done.')])));
    ok(lastNote(r3).some(n => /^Not done: /.test(n)), 'a change with nothing done says Not done: ' + JSON.stringify(lastNote(r3)));
    eq(r3.shown.filter(x => x.who === 'ai').pop().notDone, true, 'its Done is marked');
    /* a setup the chat filled itself keeps its cards as they were */
    const h3 = page('2026-11-24'); const s3 = await runSetup(h3, FAKE.make(steps(SETUP)));
    const r4 = await K.turn(s3.state, 'hello', h3.deps(FAKE.make([say('Hi')])));
    eq(K.setupShut(r4.state, h3.book), false, 'the chat\'s own fill closes nothing');
    ok(!lastNote(r4).some(n => /finished on the screens/.test(n)), 'and says nothing');
    /* [qc-foundation 1, 2] the chat's book removed elsewhere, then setup finished on the screens: closed, said again */
    h3.book = null;
    const r5 = await K.turn(r4.state, 'hello again', h3.deps(FAKE.make([say('Hi')])));
    eq([r5.state.fill, K.setupShut(r5.state, null)], [null, false], 'no book: the setup answers are open again');
    h3.book = h2.book;
    const r6 = await K.turn(r5.state, 'and now?', h3.deps(FAKE.make([say('Hi')])));
    eq(K.setupShut(r6.state, h3.book), true, 'a book from the screens closes them');
    ok(lastNote(r6).some(n => /finished on the screens/.test(n)), 'the note is said for this book');
  });
  await t('[qc-controls run 1 blocker 2] the fill step tells the AI to say where loans, goals and budget lines are added', async () => {
    const g = K.GUIDE.find(x => x.key === 'fill').ask;
    ok(/loans, goals and budget lines/i.test(g) && /Plan/.test(g) && /Add a loan/.test(g), g);
  });
  await t('[qc-controls run 1 blocker 6] remove is offered only for refs it can remove; a pay or a goal says it cannot be removed yet and where to change it', async () => {
    const desc = K.TOOLS.find(x => x.name === 'change').description;
    ok(/remove takes an S, B or L ref/.test(desc), 'the tool says which refs remove takes');
    const h = page('2026-11-24'); await runSetup(h, FAKE.make(steps(SETUP)));
    const before = JSON.stringify(h.book);
    for (const [ref, what] of [['P1', 'a pay'], ['G1', 'a goal']]) {
      const r = await K.turn(K.fresh(), 'remove it', h.deps(FAKE.make([say('', [call('change', { steps: [{ do: 'remove', ref }] })]), say('OK')])));
      const n = lastNote(r).join(' | ');
      ok(new RegExp('Not done: removing ' + what + ', which the app cannot do yet\\. You can change it on Plan: tap it').test(n), ref + ': ' + n);
      eq(JSON.stringify(h.book), before, ref + ': nothing changed');
    }
  });
  console.log(bad ? `chat3_core: ${bad} of ${n} FAILED` : `chat3_core: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
