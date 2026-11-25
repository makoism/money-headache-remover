/* The assistant on the built page with the fake model answering (for QC reviewers and tests; Playwright).
   A plain copy of the page has no AI, so the panel only shows "The assistant is off". This puts the fake model
   (tests/fake_ai.js) behind a made-up relay address, https://relay.example, the way e3_chatwalk does: the page's own
   requests, the core (chat3_core.js) and the panel all run for real. Nothing leaves the machine, no real AI, no real figures.

     const Q = require('<repo>/wip/team/qc/qc3.js');
     const { openWithFakeAI, MAKO_SETUP, tell } = require('<repo>/wip/team/app3/tests/fake_ai_page.js');
     const d = await Q.open({ today: '2026-11-24' });
     const ai = await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps });   // the page reloads with the assistant on
     for (const line of MAKO_SETUP.lines) await tell(d.p, line);           // Mako's setup, by chat
     // Home now shows safe to spend 201,400 and Main bank 286,000; ai.bodies holds every request the page sent
     await d.close();

   openWithFakeAI(page, opts) -> { fake, bodies, left() }
     page            a Playwright page (Q.open's d.p). Call it before or after the first goto; it reloads the page.
     opts.steps      the fake model's recorded replies, one per call (see fake_ai.js). Default none.
     opts.echo       when the steps run out (or none were given) reply "(made-up AI) I heard: <their words>",
                     so a reviewer can type anything. Default true. false: the relay answers 502, as a failed call.
     opts.invite     a code word the made-up relay asks for (a wrong or missing one gets 401 invite_required).
     opts.url        go here instead of reloading (a served address from Q.serve()).
   tell(page, words)  types words into the panel, sends, and waits until the answer is shown.
   MAKO_SETUP         { lines, steps }: Mako's made-up shape on Tue 24 Nov 2026 (the same answers as e3_chatwalk).
                      Each line is what he types; steps are the model's replies to them, in order. After the last
                      line ("yes fill it in") the book is filled: safe to spend 201,400, Main bank 286,000. */
'use strict';
const FAKE = require('./fake_ai.js');
const K = require('../src/chat3_core.js');
const RELAY = 'https://relay.example';
const w = ms => new Promise(r => setTimeout(r, ms));

async function openWithFakeAI(page, opts = {}) {
  const echo = opts.echo !== false;
  const fake = FAKE.make(opts.steps || []);
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
  const json = (route, status, j) => route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(j) });
  await page.addInitScript(base => { window.STMT3_RELAY = base; }, RELAY);
  await page.route(RELAY + '/api/**', async route => {
    const rq = route.request(), u = rq.url();
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (u === RELAY + '/api/health') return json(route, 200, { ok: true, ai: true, invite: !!opts.invite });
    if (u !== RELAY + '/api/ai') return json(route, 404, { error: { message: 'not here' } });
    let body; try { body = JSON.parse(rq.postData() || '{}'); } catch (e) { return json(route, 400, { error: { message: 'bad body' } }); }
    if (opts.invite && body.invite !== opts.invite) return json(route, 401, { error: { code: 'invite_required' } });
    if (fake.left()) {
      try { return json(route, 200, await fake.send(body)); } catch (e) { return json(route, 502, { error: { message: String(e.message) } }); }
    }
    fake.bodies.push(JSON.parse(JSON.stringify(body)));
    if (!echo) return json(route, 502, { error: { message: 'the fake AI has no recorded reply left' } });
    const said = FAKE.said(body) || '...';
    return json(route, 200, { content: [{ type: 'text', text: '(made-up AI) I heard: ' + said }], stop_reason: 'end_turn', usage: { input: 0, output: 0 }, model: 'fake' });
  });
  if (opts.url) await page.goto(opts.url); else await page.reload();
  await page.waitForTimeout(500);
  return { fake, bodies: fake.bodies, left: () => fake.left() };
}

/* types words into the panel, sends, and waits until the answer is shown (up to 10 s) */
async function tell(page, words) {
  await page.$eval('#a3ChatIn', (e, v) => { e.value = v; }, words);
  await page.$eval('#a3ChatSend', e => e.click());
  await w(150);
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(() => !document.querySelector('#a3ChatWait') && !(window.BurrowApp3 && BurrowApp3.chat.CHAT3.busy))) break;
    await w(100);
  }
  await w(150);
}

/* Mako's made-up shape, by chat (the same answers as tests/e3_chatwalk.js) */
const say = (words, calls) => ({ words, calls });
const call = (name, input) => ({ name, input });
const MAKO = {
  banks: [{ name: 'Main bank', amount: 286000 }],
  pays: [{ name: 'Pay', amount: 240000, every: 'month', day: 10, shift: 'before', afterTax: true }],
  cards: [{ name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', shift: 'after' }, { name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', shift: 'before' }],
  bills: [{ name: 'Rent', amount: 72000, day: 27 }, { name: 'Power', amount: 7400, day: 26 }, { name: 'Phone', amount: 4800, day: 20 }, { name: 'Internet', amount: 5200, day: 27 }],
};
const TURNS = [
  ['hi', [say(K.GUIDE[0].ask + ' ' + K.GUIDE[1].ask + ' ' + K.GUIDE[2].ask)]],
  ['Japan, yen', [say('', [call('draft_set', { section: 'country', value: 'JP' }), call('draft_set', { section: 'currency', value: 'JPY' })]), say(K.GUIDE[3].ask)]],
  ['Just one, Main bank', [say(K.GUIDE[4].ask)]],
  ['286,000', [say('', [call('draft_set', { section: 'banks', value: MAKO.banks })]), say(K.GUIDE[5].ask)]],
  ['once a month, on the 10th', [say(K.GUIDE[6].ask)]],
  ['the day before', [say('How much lands in your bank each time?')]],
  ['240,000', [say('Is that before or after tax?')]],
  ['after tax', [say('', [call('draft_set', { section: 'pays', value: MAKO.pays })]), say(K.GUIDE[8].ask)]],
  ['no side job', [say(K.GUIDE[9].ask)]],
  ['Card A has 54,000, paid on the 10th, the day after. Card B 23,000 on the 11th, the day before. Not sure about close days', [say('', [call('draft_set', { section: 'cards', value: MAKO.cards })]), say(K.GUIDE[10].ask)]],
  ['Rent 72,000 on the 27th, power 7,400 on the 26th, phone 4,800 on the 20th, internet 5,200 on the 27th', [say('', [call('draft_set', { section: 'bills', value: MAKO.bills })]), say('Phone was due on 20 Nov. Has it come out of your bank already?')]],
  ['yes', [say('', [call('draft_set', { section: 'asked', value: [{ name: 'Phone', out: true }] })]), say(K.GUIDE[12].ask)]],
  ['not sure yet', [say('', [call('draft_set', { section: 'free', value: null })]), say(K.GUIDE[13].ask)]],
  ['no minimum', [say('', [call('draft_set', { section: 'min', value: null })]), say('That is everything. Shall I fill in your Burrow?')]],
  ['yes fill it in', [say('', [call('fill_book', {})]), say("Done. Here's Home. Check each tab, tell me anything that's wrong.")]],
];
const MAKO_SETUP = { lines: TURNS.map(t => t[0]), steps: [].concat(...TURNS.map(t => t[1])), safe: 201400, bank: 286000 };

module.exports = { openWithFakeAI, tell, MAKO_SETUP, RELAY };
