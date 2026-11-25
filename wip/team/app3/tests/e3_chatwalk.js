#!/usr/bin/env node
/* The setup chat, walked through the real page (AI_FIRST_PLAN section 5, the slice 1 gate; DECISIONS new foundation 12
   to 14). Mako's made-up shape on Tue 24 Nov 2026, set up by talking to the assistant. The AI is the fake model
   (tests/fake_ai.js) behind a made-up relay address that this test answers, so the page's own requests, the core and
   the panel all run for real. No real AI, no real figures.
   The answers: Japan; one bank, Main bank 286,000; pay on the 10th (the working day before), 240,000, "after tax"; no
   side job; Card A 54,000 paid on the 10th (the day after), Card B 23,000 on the 11th (the day before), close days not
   sure; Rent 72,000 on the 27th, Power 7,400 on the 26th, Phone 4,800 on the 20th (already out), Internet 5,200 on the
   27th; Free to spend blank; no minimum; "fill it in".
   Worked by hand: next pay Thu 10 Dec 2026 (a weekday, so not moved). Due before it from Main bank: Power 7,400 (Thu 26
     Nov), Rent 72,000 and Internet 5,200 (Fri 27 Nov), together 7,400 + 72,000 + 5,200 = 84,600. Phone (20 Nov) is
     already out, inside the 286,000. The cards come out on 10 and 11 Dec, the pay lands on 10 Dec: neither is before
     the pay, so neither is in the sum. Safe to spend 286,000 - 84,600 = 201,400. Main bank today 286,000.
   Then: Undo the fill (back to the first screen, the answers kept), fill again from the draft card (201,400), a reload
   (the same figures, the chat kept), one spend by chat, "I spent 1,200 on lunch": safe to spend 201,400 - 1,200 =
   200,200, Main bank 286,000 - 1,200 = 284,800; a reload (the same); Undo on its card: 201,400 and 286,000 again; the
   fill's card has no button now. Every request: max_tokens 2,000, the invite field, no record id.
   The same answers typed on the setup screens (setup3) on another device make the same book, record for record: ids,
   moments and devices aside, every account, schedule, record, check-in, plan entry and setting is the same. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const { finishSetup: finishSetup3 } = require('./setup_sections.js');   // setup is saved one section at a time (item 14)
const fs = require('fs'), os = require('os');
const K = require('../src/chat3_core.js'), FAKE = require('./fake_ai.js');
const DAY = '2026-11-24';
const say = (words, calls) => ({ words, calls });
const call = (name, input) => ({ name, input });
const MAKO = {
  banks: [{ name: 'Main bank', amount: 286000 }],
  pays: [{ name: 'Pay', amount: 240000, every: 'month', day: 10, shift: 'before', afterTax: true }],
  cards: [{ name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', shift: 'after' }, { name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', shift: 'before' }],
  bills: [{ name: 'Rent', amount: 72000, day: 27 }, { name: 'Power', amount: 7400, day: 26 }, { name: 'Phone', amount: 4800, day: 20 }, { name: 'Internet', amount: 5200, day: 27 }],
};
const seen = {};   // what the fake model read in the tool results, by the turn
const note = key => body => { seen[key] = (FAKE.results(body)[0] || {}).text || ''; return null; };
const after = (key, words) => body => { note(key)(body); return say(words); };
/* [what Mako types, the AI's recorded replies for that turn] */
const SETUP = [
  ['hi', [say(K.GUIDE[0].ask + ' ' + K.GUIDE[1].ask + ' ' + K.GUIDE[2].ask)]],
  ['Japan, yen', [say('', [call('draft_set', { section: 'country', value: 'JP' }), call('draft_set', { section: 'currency', value: 'JPY' })]), say(K.GUIDE[3].ask)]],
  ['Just one, Main bank', [say(K.GUIDE[4].ask)]],
  ['what does safe to spend mean?', [say('', [call('explain', { topic: 'safeToSpend' })]), body => say(FAKE.results(body)[0].text + ' So, what does Main bank show right now?')]],
  ['286,000', [say('', [call('draft_set', { section: 'banks', value: MAKO.banks })]), say(K.GUIDE[5].ask)]],
  ['once a month, on the 10th', [say(K.GUIDE[6].ask)]],
  ['the day before', [say('How much lands in your bank each time?')]],
  ['240,000', [say('Is that before or after tax?')]],
  ['after tax', [say('', [call('draft_set', { section: 'pays', value: MAKO.pays })]), say(K.GUIDE[8].ask)]],
  ['no side job', [say(K.GUIDE[9].ask)]],
  ['Card A has 54,000, paid on the 10th, the day after. Card B 23,000 on the 11th, the day before. Not sure about close days', [say('', [call('draft_set', { section: 'cards', value: MAKO.cards })]), say(K.GUIDE[10].ask)]],
  ['Rent 72,000 on the 27th, power 7,400 on the 26th, phone 4,800 on the 20th, internet 5,200 on the 27th', [say('', [call('draft_set', { section: 'bills', value: MAKO.bills })]), after('bills', 'Phone was due on 20 Nov. Has it come out of your bank already?')]],
  ['yes', [say('', [call('draft_set', { section: 'asked', value: [{ name: 'Phone', out: true }] })]), say(K.GUIDE[12].ask)]],
  ['not sure yet', [say('', [call('draft_set', { section: 'free', value: null })]), say(K.GUIDE[13].ask)]],
  ['no minimum', [say('', [call('draft_set', { section: 'min', value: null })]), after('min', 'That is everything. Shall I fill in your Burrow?')]],
  ['yes fill it in', [say('', [call('fill_book', {})]), after('fill', "Done. Here's Home. Check each tab, tell me anything that's wrong.")]],
];
const SPEND = [say('', [call('change', { steps: [{ do: 'log_spend', amount: 1200, note: 'lunch' }] })]), after('spend', 'Logged. Safe to spend is now 200,200.')];
const fake = FAKE.make([].concat(...SETUP.map(x => x[1]), SPEND));
async function relay(p) {
  await p.evaluateOnNewDocument(() => { window.STMT3_RELAY = 'https://relay.example'; });
  await p.setRequestInterception(true);
  p.on('request', async rq => {
    const u = rq.url(), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app' };
    if (u === 'https://relay.example/api/health') return rq.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ ok: true, ai: true }) });
    if (u === 'https://relay.example/api/ai') {
      if (rq.method() === 'OPTIONS') return rq.respond({ status: 204, headers: cors });
      let out;
      try { out = JSON.stringify(await fake.send(JSON.parse(rq.postData()))); } catch (e) { return rq.respond({ status: 502, contentType: 'application/json', headers: cors, body: JSON.stringify({ error: { message: String(e.message) } }) }); }
      return rq.respond({ status: 200, contentType: 'application/json', headers: cors, body: out });
    }
    rq.continue();
  });
}
const idle = async p => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !document.querySelector('#a3ChatWait') && !BurrowApp3.chat.CHAT3.busy)) return true; await T.w(100); } return false; };
async function tell(p, words) { await p.$eval('#a3ChatIn', (e, v) => { e.value = v; }, words); await p.$eval('#a3ChatSend', e => e.click()); await T.w(150); await idle(p); await T.w(150); }
const fig = (p, sel) => p.$eval(sel, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
const home = async p => ({ safe: await fig(p, '#a3Home [data-fig=safe]'), bank: await fig(p, '#a3Home [data-card=bank] [data-fig=bank]'), due: await fig(p, '#a3Home [data-fig=duetotal]'),
  next: await p.$eval('#a3Home [data-fig=nextpay]', e => e.textContent).catch(() => null),
  cards: await p.$$eval('#a3Home [data-cardid] [data-fig=owed] [data-amt]', e => e.map(x => Number(x.dataset.amt))) });
/* a book with its ids named by what they are, and the moments, devices and steps that differ between two setups left out */
const DROP = { told: 1, at: 1, by: 1, grp: 1, rev: 1 };
function same(book) {
  const b = JSON.parse(JSON.stringify(book)), names = {};
  for (const a of b.accounts || []) names[a.id] = 'acct:' + a.name;
  for (const x of b.schedules || []) names[x.id] = 'sched:' + x.name;
  for (const x of b.places || []) names[x.id] = 'place:' + x.name;
  const key = e => JSON.stringify([e.k, names[e.acct] || e.acct, e.date, e.a, e.sub || '']);
  (b.events || []).slice().sort((x, y) => (key(x) < key(y) ? -1 : 1)).forEach((e, i) => { names[e.id] = 'event:' + i; });
  (b.checkins || []).forEach((c, i) => { names[c.id] = 'checkin:' + i; });
  const strip = v => Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().filter(k => !DROP[k]).map(k => [k, strip(v[k])])) : v;
  let t = JSON.stringify(strip(b));
  for (const id of Object.keys(names).sort((x, y) => y.length - x.length)) t = t.split(id).join(names[id]);
  const out = JSON.parse(t);
  out.events = (out.events || []).sort((x, y) => (x.id < y.id ? -1 : 1));
  return out;
}
const diff = (x, y, at) => { if (JSON.stringify(x) === JSON.stringify(y)) return null; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set(Object.keys(x).concat(Object.keys(y)))) { const d = diff(x[k], y[k], at + '.' + k); if (d) return d; } } return at + ': ' + JSON.stringify(x) + ' vs ' + JSON.stringify(y); };
/* the same answers on the setup screens, in a browser of its own */
async function byScreens() {
  const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chatwalk2-') }), p = o.p;
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(500);
  await p.$eval('#a3SetupGo', e => e.click()); await T.w(200);
  const put = (sel, v) => p.$eval(sel, (e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(v));
  const click = sel => p.$eval(sel, e => e.click());
  await put('#s3Bank', '286000'); await put('#s3PayAmt', '240000'); await put('#s3PayDay', '10'); await put('#s3PayShift', 'before');
  let k = 0;
  for (const c of MAKO.cards) { k++; await click('#s3AddCard'); const r = `[data-row=card${k}] `; await put(r + '[data-f=name]', c.name); await put(r + '[data-f=owed]', c.owed); await put(r + '[data-f=payDay]', c.payDay); await put(r + '[data-f=shift]', c.shift); }
  k = 0;
  for (const x of MAKO.bills) { k++; await click('#s3AddBill'); const r = `[data-row=bill${k}] `; await put(r + '[data-f=name]', x.name); await put(r + '[data-f=amount]', x.amount); await put(r + '[data-f=day]', x.day); }
  await T.w(200);
  const asked = await p.$$eval('[data-q=takenOut]:not([hidden]) label', e => e.map(x => x.textContent));
  await finishSetup3(p); await T.w(700);   // each section's own Save, then See my money (item 14)
  const book = await p.evaluate(() => BurrowApp3.E3.book);
  const safe = await fig(p, '#a3Home [data-fig=safe]');
  await o.b.close();
  return { book, safe, asked, errs: o.errs };
}
const log = p => p.$eval('#a3ChatLog', e => e.textContent.replace(/\s+/g, ' '));
(async () => {
  const prof = fs.mkdtempSync(os.tmpdir() + '/a3chatwalk-');
  const { b, p, errs, requests } = await T.open({ profile: prof });
  p.on('dialog', d => d.accept());
  await relay(p);
  try {
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
    ck('the first screen is the assistant\'s welcome, with the box to type in', /Welcome to the burrow/.test(await p.$eval('#a3Home', e => e.textContent)) && !!(await p.$('#a3Home #a3ChatIn')));
    ck('the site\'s AI is on: no ways card', !(await p.$('[data-card=chat-off]')));

    /* the setup chat, one message at a time */
    for (const [words] of SETUP.slice(0, -1)) await tell(p, words);
    const l1 = await log(p);
    ck('the questions came in order, one per message', [K.GUIDE[3].ask, K.GUIDE[5].ask, 'Is that before or after tax?', K.GUIDE[10].ask, K.GUIDE[12].ask, K.GUIDE[13].ask].every(q => l1.includes(q)));
    ck('the question about the app was answered in the middle', /So, what does Main bank show right now\?/.test(l1));
    const saved = await p.$$eval('#a3ChatLog .a3-chat-saved', e => e.map(x => x.textContent));
    ck('each section answered says Saved, on its own line', ['country', 'bank', 'pay', 'card', 'bill', 'free', 'keep'].every(k => saved.some(s => s.toLowerCase().startsWith('saved') && s.toLowerCase().includes(k))), JSON.stringify(saved));
    ck('the Phone bill already due was asked about by name and day', /Has Phone, due 20 Nov, come out of Main bank already\?/.test(seen.bills || ''), seen.bills);
    ck('nothing was still needed before the fill', /NEEDED now: nothing/.test(seen.min || ''), seen.min);
    const dc = await p.$eval('[data-card=chat-draft]', e => e.textContent.replace(/\s+/g, ' '));
    ck('the draft card shows the answers and Fill in my Burrow', /286,000/.test(dc) && /240,000 after tax/.test(dc) && /Fill in my Burrow/.test(dc), dc.slice(0, 300));
    ck('nothing kept on the device yet', await p.evaluate(() => BurrowApp3.E3.mode === 'none'));

    /* fill */
    await tell(p, SETUP[SETUP.length - 1][0]);
    ck('the fill: the core read back the engine\'s figures', /Filled in\. Safe to spend ¥201,400, Main bank ¥286,000\./.test(seen.fill || ''), seen.fill);
    const chatBook = await p.evaluate(() => BurrowApp3.E3.book);
    let h = await home(p);
    ck('Home: safe to spend 201,400 (286,000 - 84,600 due before pay)', h.safe === 201400, JSON.stringify(h));
    ck('Home: Main bank 286,000', h.bank === 286000);
    ck('Home: due before next pay 84,600 (Power 7,400, Rent 72,000, Internet 5,200)', h.due === 84600);
    ck('Home: next pay 10 Dec', /10 Dec/.test(h.next || ''), h.next);
    ck('Home: Card A 54,000 and Card B 23,000', JSON.stringify(h.cards.slice().sort()) === '[23000,54000]', JSON.stringify(h.cards));
    ck('the panel is the bar now, with the chat', !!(await p.$('#a3Chat:not([hidden]) #a3ChatIn')) && /Done\. Here's Home/.test(await log(p)));
    ck('the fill card has the figures and Undo', JSON.stringify(await p.$$eval('[data-card=chat-fill] [data-amt]', e => e.map(x => Number(x.dataset.amt)))) === '[201400,286000]' && (await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.textContent)) === 'Undo');

    /* Undo the fill, fill again */
    await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.click()); await idle(p); await T.w(300);
    ck('Undo of the fill: no book, the first screen again', await p.evaluate(() => BurrowApp3.E3.mode === 'none') && /Welcome to the burrow/.test(await p.$eval('#a3Home', e => e.textContent)));
    ck('the answers are kept: the draft card with Fill in my Burrow', !!(await p.$('#a3Home [data-chatfill]')));
    await p.$eval('#a3Home [data-chatfill]', e => e.click()); await idle(p); await T.w(400);
    h = await home(p);
    ck('filled again from the draft card: 201,400 and 286,000', h.safe === 201400 && h.bank === 286000, JSON.stringify(h));

    /* a reload */
    await p.reload(); await T.w(900);
    h = await home(p);
    ck('after a reload: the same figures', h.safe === 201400 && h.bank === 286000 && h.due === 84600, JSON.stringify(h));
    ck('after a reload: the chat is kept', /Done\. Here's Home/.test(await log(p)));

    /* one spend by chat */
    await p.$eval('#a3Chat #a3ChatIn', e => e.focus());
    await tell(p, 'I spent 1,200 on lunch');
    ck('the change was made at once and said Done', /^Done/.test(seen.spend || ''), seen.spend);
    const cc = '[data-card=chat-change][data-status=done]';
    ck('its card: what changed, and safe to spend 201,400 before and 200,200 after', /Log ¥1,200 on Free to spend from Main bank, today \(lunch\)/.test(await p.$eval(cc, e => e.textContent)) && (await p.$$eval(cc + ' [data-amt]', e => e.map(x => Number(x.dataset.amt)))).slice(0, 2).join() === '201400,200200');
    h = await home(p);
    ck('Home: safe to spend 200,200 (201,400 - 1,200), Main bank 284,800 (286,000 - 1,200)', h.safe === 200200 && h.bank === 284800, JSON.stringify(h));
    ck('the fill can no longer be undone: its card has no button now (AI_JOIN_FIXES D)', !(await p.$('[data-card=chat-fill] button')));
    await p.reload(); await T.w(900);
    h = await home(p);
    ck('after a reload: 200,200 and 284,800', h.safe === 200200 && h.bank === 284800, JSON.stringify(h));
    await p.$eval(cc + ' [data-chatundo]', e => e.click()); await idle(p); await T.w(400);
    h = await home(p);
    ck('Undo on the spend\'s card: 201,400 and 286,000 again', h.safe === 201400 && h.bank === 286000, JSON.stringify(h));
    await p.reload(); await T.w(900);
    h = await home(p);
    ck('after a reload: still 201,400 and 286,000', h.safe === 201400 && h.bank === 286000, JSON.stringify(h));

    /* the same answers on the setup screens: the same book */
    const scr = await byScreens();
    ck('on the setup screens the same answers ask only about the Phone of 20 Nov, and give 201,400', JSON.stringify(scr.asked) === '["Did the Phone of 20 Nov leave your bank?"]' && scr.safe === 201400, JSON.stringify([scr.asked, scr.safe]));
    const d = diff(same(chatBook), same(scr.book), 'book');
    ck('the chat\'s book and the screens\' book are the same, record for record', !d && chatBook.events.length === scr.book.events.length && chatBook.events.length > 0, d);
    const other = JSON.parse(JSON.stringify(scr.book)); other.events.find(e => e.k === 'check').a = 285000;
    ck('(the comparison sees one record that differs)', !!diff(same(chatBook), same(other), 'book'));
    ck('no page errors on the screens', !scr.errs.length, scr.errs.join(' | '));

    /* what was sent */
    const book = await p.evaluate(() => BurrowApp3.E3.book);
    const ids = [].concat(...['accounts', 'schedules', 'events'].map(k => (book[k] || []).map(x => x.id)));
    const sent = JSON.stringify(fake.bodies);
    ck('every request: max_tokens 2,000, the invite field, tools offered, tool_choice auto', fake.bodies.length > 20 && fake.bodies.every(x => x.max_tokens === 2000 && typeof x.invite === 'string' && x.tool_choice && x.tool_choice.type === 'auto' && x.tools.length === 5));
    ck('no record id was ever sent', !ids.some(id => sent.includes(id)));
    ck('every recorded reply was used', fake.left() === 0, fake.left());
    ck('only the relay was asked, nothing else outside the page', requests.every(u => u.startsWith('https://relay.example/')), JSON.stringify(requests.filter(u => !u.startsWith('https://relay.example/'))));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); }
  T.done('e3_chatwalk');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
