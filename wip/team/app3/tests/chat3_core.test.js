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
    const f = FAKE.make([say('', [call('change', { steps: [{ do: 'change_card', ref: 'A2', payDay: 12 }] })]), say('ok'), say('ok')]);
    const deps = Object.assign(h.deps(f), { door: d0.door, screen: () => 'plan' });
    const r = await K.turn(state, 'Card A is paid on the 12th now', deps);
    const sent = JSON.stringify(f.bodies[0].messages);
    ok(/SCREEN: the person has Plan open/.test(sent), 'the open screen is sent');
    const res = FAKE.results(f.bodies[1])[0].text;
    ok(/^Nothing changed: /.test(res) && /Plan, tap the card/.test(res), res);
    ok(/WHERE ON THE SCREENS/.test(K.SYSTEM) && /Add a loan/.test(K.SYSTEM) && /Receipts, tap it/.test(K.SYSTEM) && /Settings/.test(K.SYSTEM), 'the map of the screens');
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
  console.log(bad ? `chat3_core: ${bad} of ${n} FAILED` : `chat3_core: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})();
