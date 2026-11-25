/* A helper, not a test: the assistant on the built page with the REAL core (chat3_core.js) and the real panel, the
   fake model (tests/fake_ai.js) answering behind a made-up relay address that the test itself answers. Nothing here
   stands in for the core, E3, act3 or the store: a test that crosses the join between the assistant and the app uses
   this (AI_JOIN_FIXES: each lane's tests had faked the other side). No real AI, made-up amounts only.
     const R = require('./chat_real.js');
     const ai = await R.relay(p, { steps });      before the first goto. ai.bodies, ai.mode, ai.health, ai.calls
        ai.mode = 'ok' | 'down' (the connection drops) | 429 | 503 | 500 | 'off'   how the next /api/ai calls are answered
                                                 ('off': the relay's own 503 relay_unconfigured, the AI switched off)
        ai.health = { ok, ai }                   what /api/health says (asked once per page open)
        ai.push(...steps)                        more recorded replies
     await R.tell(p, words)                      type, Send, wait for the answer
     await R.setup(p, ai, over)                  Mako's made-up shape set up by chat in one message, then filled
     R.ref(body, name)                           the ref (B1, P1, A1 ...) the request's FIGURES give that name */
'use strict';
const T = require('./lib3.js');
const FAKE = require('./fake_ai.js');
const say = (words, calls) => ({ words, calls });
const call = (name, input) => ({ name, input });
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app' };
async function relay(p, opts = {}) {
  const ai = { mode: 'ok', health: { ok: true, ai: true }, calls: 0, steps: (opts.steps || []).slice(), bodies: [] };
  ai.push = (...steps) => { ai.steps.push(...steps); };
  const next = async body => {
    ai.bodies.push(JSON.parse(JSON.stringify(body)));
    if (!ai.steps.length) throw new Error('the fake AI has no recorded reply left');
    return FAKE.make([ai.steps.shift()]).send(body);
  };
  await p.evaluateOnNewDocument(() => { window.STMT3_RELAY = 'https://relay.example'; });
  await p.setRequestInterception(true);
  p.on('request', async rq => {
    const u = rq.url(), json = (status, j) => rq.respond({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(j) });
    if (u === 'https://relay.example/api/health') return json(200, ai.health);
    if (u === 'https://relay.example/api/ai') {
      if (rq.method() === 'OPTIONS') return rq.respond({ status: 204, headers: CORS });
      ai.calls++;
      if (ai.mode === 'down') return rq.abort('internetdisconnected');
      if (ai.mode === 429) return json(429, { error: { message: 'Too many requests. Wait a minute.' } });
      if (ai.mode === 503) return json(503, { error: { message: 'Daily limit for this device reached. Try again tomorrow.' } });
      if (ai.mode === 500) return json(500, { error: {} });
      if (ai.mode === 'off') return json(503, { error: { code: 'relay_unconfigured', message: 'The relay has no API key yet.' } });
      try { return json(200, await next(JSON.parse(rq.postData()))); } catch (e) { return json(502, { error: { message: String(e.message) } }); }
    }
    if (opts.other && (await opts.other(rq))) return;
    rq.continue();
  });
  return ai;
}
const idle = async p => { for (let i = 0; i < 150; i++) { if (await p.evaluate(() => !document.querySelector('#a3ChatWait') && !BurrowApp3.chat.CHAT3.busy)) return true; await T.w(100); } return false; };
async function tell(p, words) {
  await p.evaluate(v => { const e = [...document.querySelectorAll('#a3ChatIn')].pop(); e.value = v; }, words);
  await p.evaluate(() => [...document.querySelectorAll('#a3ChatSend')].pop().click());
  await T.w(150); await idle(p); await T.w(150);
}
const MAKO = {
  country: 'JP', currency: 'JPY',
  banks: [{ name: 'Main bank', amount: 286000 }],
  pays: [{ name: 'Pay', amount: 240000, every: 'month', day: 10, shift: 'before', afterTax: true }],
  cards: [{ name: 'Card A', owed: 54000, payDay: 10, closeDay: 'not sure', shift: 'after' }, { name: 'Card B', owed: 23000, payDay: 11, closeDay: 'not sure', shift: 'before' }],
  bills: [{ name: 'Rent', amount: 72000, day: 27 }, { name: 'Power', amount: 7400, day: 26 }, { name: 'Phone', amount: 4800, day: 20 }, { name: 'Internet', amount: 5200, day: 27 }],
  asked: [{ name: 'Phone', out: true }], free: null, min: null,
};
/* Mako's shape said in one message (24 Nov 2026: safe to spend 201,400, Main bank 286,000). `over` replaces sections;
   a section set to undefined is left out; over.fill === false stops before the fill */
const SAID = 'Japan, yen. Main bank 286,000. Pay 240,000 after tax on the 10th, the day before. Card A 54,000 on the 10th, Card B 23,000 on the 11th. Rent 72,000 on the 27th, power 7,400 on the 26th, phone 4,800 on the 20th and it is out, internet 5,200 on the 27th. Nothing for everyday yet, no minimum. Fill it in';
function setupSteps(over = {}) {
  const a = Object.assign({}, MAKO, over), one = s => (a[s] === undefined ? [] : [call('draft_set', { section: s, value: a[s] })]);
  const steps = [say('', [].concat(one('country'), one('currency'), one('banks'), one('pays'), one('cards'), one('bills'))), say('', [].concat(one('asked'), one('free'), one('min')))];
  if (over.fill !== false) steps.push(say('', [call('fill_book', {})]));
  steps.push(say('That is all of it.'));
  return steps;
}
async function setup(p, ai, over) { ai.push(...setupSteps(over)); await tell(p, (over && over.said) || SAID); }
const esc = s => s.replace(/[^A-Za-z0-9 ]/g, '.');
const ref = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + esc(name) + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
const fig = (p, sel) => p.$eval(sel, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
const home = async p => ({ safe: await fig(p, '#a3Home [data-fig=safe]'), bank: await fig(p, '#a3Home [data-card=bank] [data-fig=bank]') });
const log = p => p.evaluate(() => [...document.querySelectorAll('#a3ChatLog')].map(e => e.textContent.replace(/\s+/g, ' ')).join(' || '));
module.exports = { relay, tell, idle, setup, setupSteps, MAKO, SAID, say, call, ref, fig, home, log, results: FAKE.results, said: FAKE.said };
