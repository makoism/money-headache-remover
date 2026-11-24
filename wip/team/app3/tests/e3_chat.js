#!/usr/bin/env node
/* The assistant panel on the page (chat3.js), with a stand-in for its core (CHAT3C) so that only the panel is tested here:
   the conversation itself is chat3_core's (its own node tests) and the whole setup chat is e3_chatwalk. No real AI is
   called: the relay is a made-up address answered by this test. Tue 24 Nov 2026, made-up amounts.
   1. Before setup the panel is the whole first screen: the welcome, the box, the privacy line, "See what is sent", the
      ways in that were there before; no bar. With the site's AI off: "Set up on the screens" and "Use any AI".
   2. "Use any AI": the questions as one request to copy; the answer pasted back goes section by section through the
      core's draft checks and shows the draft card; an answer with no JSON is refused in words.
   3. "Set up on the screens": setup3 opens, filled from the draft (ANSWERS3.toForm).
   4. With the relay on: no ways card; a message goes through the relay (the page's own request, x-app, the core's body)
      and the answer shows; a relay that fails says so, puts the message back and shows the ways.
   5. The chat is kept on this device: the same turns after a reload.
   6. With a book: a bar at the foot of a phone that opens to a sheet; a column on the right at 1280.
   7. Cards: a change made shows its lines and the engine's figures before and after with Undo; one that asks first has
      Do it and Not now; the fill card has Undo while the fill can be undone and Start over (asked first) after.
   8. Before a file: the upload notice. No page errors; no sideways scroll at 320. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const DAY = '2026-11-24';
const MAKO = {
  day: DAY, currency: 'JPY', country: 'JP',
  banks: [{ key: 'bank1', name: 'Main bank', amount: 286000, main: true, min: null }],
  pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 240000, every: 'month', day: 10, shift: 'before', startsPeriod: true }],
  cards: [], bills: [{ key: 'bill1', name: 'Rent', from: 'bank1', amount: 72000, day: 27, shift: 'after' }], free: null,
};
/* the stand-in core: each call is noted; turns, cards and the draft are made up */
function fake() {
  window.__calls = [];
  const clone = x => JSON.parse(JSON.stringify(x));
  const tid = st => 't' + st.turns.length;
  const card = (st, c) => st.turns.push({ id: tid(st), who: 'card', text: '', card: c });
  const setCard = (st, id, f) => { st = clone(st); const t = st.turns.find(x => x.id === id); if (t) f(t.card); return st; };
  Object.assign(CHAT3C, {
    sentText: (st, m) => 'WHAT IS SENT: ' + m,
    turn: async (st0, msg, deps) => {
      window.__calls.push(['turn', msg, deps.mode(), !!deps.door]);
      const st = clone(st0);
      st.turns.push({ id: tid(st), who: 'person', text: msg });
      const res = await deps.send({ v: 1, anon: deps.anon, invite: deps.invite, tier: 'default', max_tokens: 2000, messages: [{ role: 'user', content: [{ type: 'text', text: msg }] }] });
      const words = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      if (msg === 'change') card(st, { kind: 'change', status: 'done', lines: ['Log 1,200 on Free to spend from Main bank, today'], rows: [{ label: 'Safe to spend', before: 201400, after: 200200 }], steps: ['s1'] });
      if (msg === 'big') card(st, { kind: 'change', status: 'ask', ask: 'large', lines: ['Log 300,000 on Free to spend from Main bank, today'], rows: [{ label: 'Safe to spend', before: 201400, after: 0 }] });
      if (msg === 'fill') card(st, { kind: 'fill', status: 'done', figures: { safe: 201400, bank: 286000 } });
      st.turns.push({ id: tid(st), who: 'ai', text: words });
      return { state: st, shown: [], stop: 'words' };
    },
    undo: async (st, id) => { window.__calls.push(['undo', id]); return { state: setCard(st, id, c => { c.status = 'undone'; }), shown: [], ok: true }; },
    confirm: async (st, id) => { window.__calls.push(['confirm', id]); return { state: setCard(st, id, c => { c.status = 'done'; }), shown: [], ok: true }; },
    notNow: async (st, id) => { window.__calls.push(['notNow', id]); return { state: setCard(st, id, c => { c.status = 'not now'; }), shown: [], ok: true }; },
    startOver: async st => { window.__calls.push(['startOver']); const s = clone(st); s.turns.filter(t => t.card && t.card.kind === 'fill').forEach(t => { t.card.status = 'start over'; }); return { state: s, shown: [], ok: true }; },
    draftEdit: (st0, section, value) => {
      window.__calls.push(['draftEdit', section, value]);
      if (section === 'min' && value === 'lots') return { state: st0, shown: [], ok: false, text: 'Keep at least needs an amount' };
      const st = clone(st0);
      st.draft = Object.assign({}, st.draft, { [section]: value });
      st.turns = st.turns.filter(t => !(t.card && t.card.kind === 'draft'));
      card(st, { kind: 'draft', sections: Object.keys(st.draft).map(k => ({ key: k, title: k, lines: [JSON.stringify(st.draft[k])] })), need: ['your pay'], ready: false });
      return { state: st, shown: [], ok: true };
    },
  });
}
const shows = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0).catch(() => false);
const turns = p => p.$$eval('#a3ChatLog > [data-turn]', e => e.map(x => x.textContent.trim().replace(/\s+/g, ' ')));
async function relay(p, fail) {
  await p.evaluateOnNewDocument(() => { window.STMT3_RELAY = 'https://relay.example'; });
  await p.setRequestInterception(true);
  p.__sent = [];
  p.on('request', rq => {
    const u = rq.url();
    if (u === 'https://relay.example/api/health') return rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ai: true }) });
    if (u === 'https://relay.example/api/ai') {
      if (rq.method() === 'OPTIONS') return rq.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app' } });
      const body = JSON.parse(rq.postData()); p.__sent.push({ body, headers: rq.headers() });
      const msg = body.messages[0].content[0].text;
      if (fail.on) return rq.respond({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
      return rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Heard: ' + msg }] }) });
    }
    rq.continue();
  });
}
async function say(p, text) { await p.$eval('#a3ChatIn', (e, v) => { e.value = v; }, text); await p.click('#a3ChatSend'); await T.w(400); }
(async () => {
  const all = [];
  /* ---- 1 to 3: before setup, the AI off (a plain file, no relay) ---- */
  {
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chat1-') });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(500);
    await p.evaluate(fake);
    const home = await p.$eval('#a3Home', e => e.textContent);
    ck('before setup the welcome is the first screen', /Welcome to the burrow/.test(home) && /I'll set up your Burrow with you/.test(home) && /safe to spend until your next pay/.test(home));
    ck('the box to type in is on it', await shows(p, '#a3Home #a3ChatIn') && await shows(p, '#a3Home #a3ChatSend'));
    ck('the ways in that were there before are kept', await shows(p, '#a3SetupGo') && await shows(p, '#a3TryGo') && await shows(p, '#a3OtherGo'));
    ck('no bar or column before setup', !(await shows(p, '#a3Chat')));
    ck('the privacy line says what goes and that names of accounts, bills and income are sent', /names of your accounts, bills and income/.test(await p.$eval('[data-privacy=chat]', e => e.textContent)));
    await p.click('#a3Home details.a3-ask-sent summary'); await T.w(100);
    ck('"See what is sent" shows the core\'s own text', (await p.$eval('#a3ChatSent', e => e.textContent)) === 'WHAT IS SENT: ');
    ck('with the AI off the two ways show', /assistant is off/.test(await p.$eval('[data-card=chat-off]', e => e.textContent)) && await shows(p, '#a3ChatScreens') && await shows(p, '#a3ChatAny'));
    await say(p, 'hello');
    ck('a message with the AI off says so and keeps the message', /didn't go through: the assistant is off/.test(await p.$eval('#a3ChatLog', e => e.textContent)) && (await p.$eval('#a3ChatIn', e => e.value)) === 'hello');
    /* 2 */
    await p.click('#a3ChatAny'); await T.w(100);
    const ask = await p.$eval('#a3ChatAnyAsk', e => e.value);
    ck('"Use any AI" gives one request with the answer shape', /ONE JSON object/.test(ask) && /payToday/.test(ask) && ask.includes(DAY));
    await p.$eval('#a3ChatAnyPaste', e => { e.value = 'no json here'; }); await p.click('#a3ChatAnyCheck'); await T.w(100);
    ck('an answer with no JSON is refused in words', /no JSON object/.test(await p.$eval('#a3ChatAnyErr', e => e.textContent)));
    await p.$eval('#a3ChatAnyPaste', e => { e.value = 'Here you go:\n{"country":"JP","banks":[{"name":"Main bank","amount":286000}],"pays":[{"name":"Pay","amount":240000,"every":"month","day":10}],"bills":[{"name":"Rent","amount":72000,"day":27}],"min":"lots"}'; }); await p.click('#a3ChatAnyCheck'); await T.w(300);
    const calls = await p.evaluate(() => window.__calls.filter(c => c[0] === 'draftEdit'));
    ck('each section went through the core\'s draft checks', JSON.stringify(calls.map(c => c[1])) === '["country","banks","pays","bills","min"]', JSON.stringify(calls));
    ck('the draft card shows', /Your answers so far/.test(await p.$eval('[data-card=chat-draft]', e => e.textContent)) && /286000/.test(await p.$eval('[data-card=chat-draft]', e => e.textContent)));
    ck('a section refused is said', /Not taken: Keep at least needs an amount/.test(await p.$eval('#a3ChatLog', e => e.textContent)));
    /* 3 */
    await p.$eval('#a3ChatScreens', e => e.click()); await T.w(300);
    ck('"Set up on the screens" opens setup filled from the draft', await shows(p, '#a3Setup') && (await p.$eval('#s3BankName', e => e.value)) === 'Main bank' && /^286,?000$/.test(await p.$eval('#s3Bank', e => e.value))
      && /^240,?000$/.test(await p.$eval('#s3PayAmt', e => e.value)) && (await p.$eval('#s3PayDay', e => e.value)) === '10'
      && (await p.$eval('[data-row=bill1] [data-f=name]', e => e.value)) === 'Rent' && /^72,?000$/.test(await p.$eval('[data-row=bill1] [data-f=amount]', e => e.value)), await p.$eval('#s3Bank', e => e.value));
    all.push(...errs); await b.close();
  }
  /* ---- 4 to 7: the relay on ---- */
  {
    const prof = fs.mkdtempSync(os.tmpdir() + '/a3chat2-');
    const fail = { on: false };
    const { b, p, errs } = await T.open({ profile: prof });
    p.on('dialog', d => { p.__dialog = d.message(); d.accept(); });
    await relay(p, fail);
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(600);
    await p.evaluate(fake);
    ck('with the relay on, no ways card', !(await p.$('[data-card=chat-off]')));
    await say(p, 'hi there');
    ck('the message went through the page\'s relay, with x-app and the core\'s body', p.__sent.length === 1 && p.__sent[0].headers['x-app'] === 'mhr2000' && p.__sent[0].body.max_tokens === 2000 && /^[a-z0-9]{20}$/.test(p.__sent[0].body.anon), JSON.stringify(p.__sent[0] && p.__sent[0].body).slice(0, 200));
    ck('the person\'s words and the answer show', JSON.stringify(await turns(p)) === '["hi there","Heard: hi there"]', JSON.stringify(await turns(p)));
    fail.on = true;
    await say(p, 'are you there');
    ck('a relay that fails says so, puts the message back and shows the ways', /didn't go through: the assistant did not answer \(500\)/.test(await p.$eval('#a3ChatLog', e => e.textContent)) && (await p.$eval('#a3ChatIn', e => e.value)) === 'are you there' && await shows(p, '#a3ChatAny'));
    fail.on = false;
    /* 5 */
    await p.reload(); await T.w(600); await p.evaluate(fake);
    ck('the chat is kept on this device', JSON.stringify(await turns(p)) === '["hi there","Heard: hi there"]', JSON.stringify(await turns(p)));
    /* 6: a book, filled (as the chat's fill does) */
    await p.evaluate(async a => { const { E3 } = BurrowApp3; await E3.fill(BurrowEngine.build.buildBook(Object.assign({}, a, { told: E3.told() }), { newId: E3.newId }).book); BurrowApp3.chat.redraw(); }, MAKO);
    await T.w(300);
    ck('with a book Home shows the money', await shows(p, '[data-fig=safe]'));
    const bar = await p.$eval('#a3Chat', e => { const r = e.getBoundingClientRect(); return { pos: getComputedStyle(e).position, bottom: r.bottom, h: r.height, open: e.hasAttribute('data-open') }; });
    ck('on a phone a bar at the foot of the screen, below the page (which scrolls above it)', bar.bottom === 844 && bar.h < 80 && !bar.open, JSON.stringify(bar));
    ck('the bar is the box to type in', await shows(p, '#a3Chat #a3ChatIn') && !(await shows(p, '#a3Chat #a3ChatLog')));
    await p.focus('#a3ChatIn'); await T.w(200);
    const sheet = await p.$eval('#a3Chat', e => ({ open: e.hasAttribute('data-open'), h: e.getBoundingClientRect().height }));
    ck('a tap on it opens the sheet over the lower part, Home still above', sheet.open && sheet.h > 400 && sheet.h < 600, JSON.stringify(sheet));
    ck('the sheet has the chat so far', await shows(p, '#a3Chat #a3ChatLog') && /Heard: hi there/.test(await p.$eval('#a3ChatLog', e => e.textContent)));
    /* 7: cards */
    await say(p, 'change');
    const ch = '[data-card=chat-change][data-status=done]';
    ck('a change made: its lines and the engine\'s figures before and after', /Log 1,200 on Free to spend/.test(await p.$eval(ch, e => e.textContent)) && JSON.stringify(await p.$$eval(ch + ' [data-amt]', e => e.map(x => Number(x.dataset.amt)))) === '[201400,200200]');
    await p.click(ch + ' [data-chatundo]'); await T.w(300);
    ck('Undo is one tap, through the core', (await p.evaluate(() => window.__calls.filter(c => c[0] === 'undo').length)) === 1 && /Taken back/.test(await p.$eval('[data-card=chat-change][data-status=undone]', e => e.textContent)));
    await say(p, 'big');
    ck('a large change asks first, with Do it and Not now', /more than safe to spend/.test(await p.$eval('[data-card=chat-change][data-status=ask]', e => e.textContent)) && !!(await p.$('[data-chatok]')) && !!(await p.$('[data-chatnot]')));
    await p.click('[data-chatnot]'); await T.w(300);
    ck('Not now leaves it', /Not done/.test(await p.$eval('[data-card=chat-change][data-status="not now"]', e => e.textContent)));
    await say(p, 'fill');
    ck('the fill card shows safe to spend and the bank', JSON.stringify(await p.$$eval('[data-card=chat-fill] [data-amt]', e => e.map(x => Number(x.dataset.amt)))) === '[201400,286000]');
    ck('while the fill can be undone its button is Undo', (await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.textContent)) === 'Undo');
    await p.evaluate(async () => { const { E3, ACT3 } = BurrowApp3; await ACT3.logSpend({ date: E3.today(), a: 500, acct: E3.book.accounts[0].id, line: 'free' }); });
    await T.w(400);
    ck('once something else is written it is Start over', (await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.textContent)) === 'Start over');
    await p.click('[data-card=chat-fill] [data-chatundo]'); await T.w(400);
    ck('Start over asks first, then goes through the core', /^Start over\?/.test(p.__dialog || '') && (await p.evaluate(() => window.__calls.filter(c => c[0] === 'startOver').length)) === 1);
    /* 8 */
    await p.click('#a3Chat #a3ChatFile'); await T.w(100);
    ck('before a file: the whole file goes, with name, address, employer, account number; crop out My Number', /whole file goes to the AI, with your name, address, employer and account number/.test(await p.$eval('[data-privacy=upload]', e => e.textContent)) && /My Number/.test(await p.$eval('[data-privacy=upload]', e => e.textContent)));
    await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await T.w(200);
    ck('no sideways scroll at 320', await p.evaluate(() => document.documentElement.scrollWidth <= 320));
    await p.setViewport({ width: 1280, height: 800 }); await T.w(200);
    const col = await p.$eval('#a3Chat', e => { const r = e.getBoundingClientRect(); return { left: r.left, w: r.width, h: r.height }; });
    const main = await p.$eval('#a3', e => e.getBoundingClientRect().right);
    ck('at 1280 a column on the right, beside the page', col.w === 360 && col.left === 920 && col.h === 800 && main <= 920 && await shows(p, '#a3Chat #a3ChatLog'), JSON.stringify([col, main]));
    all.push(...errs); await b.close();
  }
  const bad = all.filter(e => !/status of 500/.test(e));   // the relay made to fail on purpose
  ck('no page errors', !bad.length, bad.join(' | '));
  T.done('e3_chat');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
