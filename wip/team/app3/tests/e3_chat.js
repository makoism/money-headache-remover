#!/usr/bin/env node
/* The assistant panel on the page (chat3.js), with a stand-in for its core (CHAT3C) so that only the panel is tested here:
   the conversation itself is chat3_core's (its own node tests) and the whole setup chat is e3_chatwalk. No real AI is
   called: the relay is a made-up address answered by this test. Tue 24 Nov 2026, made-up amounts.
   1. Before setup the panel is the whole first screen: the welcome, the box, the privacy line, "See what is sent", the
      ways in that were there before; no bar. With the site's AI off: "Set up on the screens" and "Use any AI".
   2. "Use any AI": the core's request to copy (the real core); the answer pasted back goes through its draft checks and
      the draft card shows; an answer with nothing to read is refused in words.
   3. "Set up on the screens": setup3 opens, filled from the draft (ANSWERS3.toForm).
   4. With the relay on: no ways card; a message goes through the relay (the page's own request, x-app, the core's body)
      and the answer shows; a relay that fails says so, puts the message back and shows the ways.
   5. The chat is kept on this device: the same turns after a reload.
   6. With a book: a bar at the foot of a phone that opens to a sheet; a column on the right at 1280.
   7. Cards: a change made shows its lines and the engine's figures before and after with Undo; one that asks first has
      Do it and Not now; the fill card has Undo while the fill can be undone, and after that says how to change things.
   8. Before a file: the upload notice. No page errors; no sideways scroll at 320.
   9. The code word (stmt3_ai's box, reused): asked before the first message when none is kept; a wrong one asked again.
   11. One failed call does not turn the assistant off (AI_JOIN_FIXES E), with the real core: the connection dropped for
      one message, then back: the next send makes a call; the same after a 429 and after a daily limit (503). Only the
      relay's own "off" answer (503 relay_unconfigured) shows "the assistant is off", and then nothing more is sent. */
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
      if (msg === 'refuse') card(st, { kind: 'change', status: 'refused', why: 'Card A: the app refused it', lines: ['Card A paid on the 12th'], rows: [] });
      st.turns.push(Object.assign({ id: tid(st), who: 'ai', text: words }, msg === 'guess' ? { check: ['9,999'] } : {}));
      return { state: st, shown: [], stop: 'words' };
    },
    undo: async (st, id) => { window.__calls.push(['undo', id]); return { state: setCard(st, id, c => { c.status = 'undone'; }), shown: [], ok: true }; },
    confirm: async (st, id) => { window.__calls.push(['confirm', id]); return { state: setCard(st, id, c => { c.status = 'done'; }), shown: [], ok: true }; },
    notNow: async (st, id) => { window.__calls.push(['notNow', id]); return { state: setCard(st, id, c => { c.status = 'not now'; }), shown: [], ok: true }; },
    startOver: async st => { window.__calls.push(['startOver']); const s = clone(st); s.turns.filter(t => t.card && t.card.kind === 'fill').forEach(t => { t.card.status = 'start over'; }); return { state: s, shown: [], ok: true }; },
  });
}
const shows = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0).catch(() => false);
const turns = p => p.$$eval('#a3ChatLog > [data-turn]', e => e.map(x => x.textContent.trim().replace(/\s+/g, ' ')));
async function relay(p, fail, word) {
  await p.evaluateOnNewDocument(() => { window.STMT3_RELAY = 'https://relay.example'; });
  await p.setRequestInterception(true);
  p.__sent = [];
  p.on('request', rq => {
    const u = rq.url();
    if (u === 'https://relay.example/api/health') return rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ai: true, invite: !!word }) });
    if (u === 'https://relay.example/api/ai') {
      if (rq.method() === 'OPTIONS') return rq.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app' } });
      const body = JSON.parse(rq.postData()); p.__sent.push({ body, headers: rq.headers() });
      const msg = body.messages[0].content[0].text;
      if (word && body.invite !== word) return rq.respond({ status: 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: { code: 'invite_required' } }) });
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
    ck('H2: the first screen already asks the first question', /Which country do you bank in, and in which currency\?/.test(home) && !/Ask or tell me something/.test(await p.$eval('#a3Home', e => e.innerText)));
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
    ck('"Use any AI" gives the core\'s request: the questions and the answer shape', /ANSWER SHAPE/.test(ask) && /QUESTIONS/.test(ask) && /Which bank does your pay go into/.test(ask));
    await p.$eval('#a3ChatAnyPaste', e => { e.value = 'no json here'; }); await p.click('#a3ChatAnyCheck'); await T.w(100);
    ck('an answer with nothing to read is refused in words', /no answers I can read/.test(await p.$eval('#a3ChatAnyErr', e => e.textContent)));
    await p.$eval('#a3ChatAnyPaste', e => { e.value = 'Here you go:\n{"country":"JP","currency":"JPY","free":null,"min":null,"banks":[{"name":"Main bank","amount":286000}],"pays":[{"name":"Pay","amount":240000,"every":"month","day":10,"shift":"before","afterTax":true}],"bills":[{"name":"Rent","amount":72000,"day":27}]}'; }); await p.click('#a3ChatAnyCheck'); await T.w(300);
    ck('the answer went through the core\'s draft checks: a Saved line', /Saved: /.test(await p.$eval('#a3ChatLog', e => e.textContent)));
    const dc = await p.$eval('[data-card=chat-draft]', e => e.textContent);
    ck('the draft card shows the answers, ready to fill in', /Your answers so far/.test(dc) && /286,000 on 24 Nov/.test(dc) && /240,000 after tax/.test(dc) && /Fill in my Burrow/.test(dc), dc.replace(/\s+/g, ' ').slice(0, 300));
    /* 3 */
    await p.$eval('#a3ChatScreens', e => e.click()); await T.w(300);
    ck('"Set up on the screens" opens setup filled from the draft', await shows(p, '#a3Setup') && (await p.$eval('#s3BankName', e => e.value)) === 'Main bank' && /^286,?000$/.test(await p.$eval('#s3Bank', e => e.value))
      && /^240,?000$/.test(await p.$eval('#s3PayAmt', e => e.value)) && (await p.$eval('#s3PayDay', e => e.value)) === '10'
      && (await p.$eval('[data-row=bill1] [data-f=name]', e => e.value)) === 'Rent' && /^72,?000$/.test(await p.$eval('[data-row=bill1] [data-f=amount]', e => e.value)), await p.$eval('#s3Bank', e => e.value));
    /* [AI_JOIN_FIXES I3] which sections still need Save, and why, in one line at the top */
    const todo = () => p.$eval('#a3SetupTodo', e => (e.hidden ? '(hidden) ' : '') + e.textContent).catch(() => '(none)');
    ck('I3: one line at the top says which sections still need Save, and why', (await todo()) === 'Filled in from the chat, not saved yet: Your bank, Your pay, Your bills. Press Save under each'
      && await p.evaluate(() => { const t = document.querySelector('#a3SetupTodo'), s = document.querySelector('#a3Setup [data-sec]'); return !!t && !!(t.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING); }), await todo());
    await p.$eval('#a3Setup [data-save=bank]', e => e.click()); await T.w(500);
    ck('I3: a section saved leaves the line', (await todo()) === 'Filled in from the chat, not saved yet: Your pay, Your bills. Press Save under each', await todo());
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
    ck('a relay that fails says so, puts the message back and shows the ways', /didn't go through: the AI did not answer \(500\)/.test(await p.$eval('#a3ChatLog', e => e.textContent)) && (await p.$eval('#a3ChatIn', e => e.value)) === 'are you there' && await shows(p, '#a3ChatAny'));
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
    await say(p, 'refuse');
    ck('H4: a refused card is headed Not changed', (await p.$eval('[data-card=chat-change][data-status=refused] h3', e => e.textContent).catch(() => '')) === 'Not changed');
    await say(p, 'fill');
    ck('the fill card shows safe to spend and the bank', JSON.stringify(await p.$$eval('[data-card=chat-fill] [data-amt]', e => e.map(x => Number(x.dataset.amt)))) === '[201400,286000]');
    ck('while the fill can be undone its button is Undo', (await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.textContent)) === 'Undo');
    await p.evaluate(async () => { const { E3, ACT3 } = BurrowApp3; await ACT3.logSpend({ date: E3.today(), a: 500, acct: E3.book.accounts[0].id, line: 'free' }); });
    await T.w(400);
    /* [AI_JOIN_FIXES D] Start over is retired: it could never work once the hold was gone (the two checks here used a
       stand-in core and never met the store). The card now says how to change things; e3_fillcard walks it with the real core */
    ck('once something else is written the fill card has no button and says how to change things', !(await p.$('[data-card=chat-fill] button')) && /To change something, tell me or change it on its screen/.test(await p.$eval('[data-card=chat-fill]', e => e.textContent)));
    await say(p, 'guess');
    ck('an amount the AI made up is marked Check this', /Check this: 9,999 is the AI's own figure/.test(await p.$eval('#a3ChatLog', e => e.textContent)));
    /* 8 */
    await p.click('#a3Chat #a3ChatFile'); await T.w(100);
    ck('before a file: the whole file goes, with name, address, employer, account number; crop out My Number', /whole file goes to the AI, with your name, address, employer and account number/.test(await p.$eval('[data-privacy=upload]', e => e.textContent)) && /My Number/.test(await p.$eval('[data-privacy=upload]', e => e.textContent)));
    await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await T.w(200);
    ck('no sideways scroll at 320', await p.evaluate(() => document.documentElement.scrollWidth <= 320));
    /* the desktop check on a fresh page: leaving the phone size makes puppeteer reload the page, and a reload of the app with
       the file notice open (its file box) timed out once under load. The notice is closed and the size changed on a blank
       page, then the app opens at 1280 with the same book and chat kept on this device */
    await p.click('#a3ChatFileX'); await T.w(100);
    ck('the file notice closes', !(await p.$('#a3ChatFileBox [data-privacy=upload]')));
    await p.goto('about:blank');
    await p.setViewport({ width: 1280, height: 800 });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(700);
    const col = await p.$eval('#a3Chat', e => { const r = e.getBoundingClientRect(); return { left: r.left, w: r.width, h: r.height }; });
    const main = await p.$eval('#a3', e => e.getBoundingClientRect().right);
    ck('at 1280 a column on the right, beside the page', col.w === 360 && col.left === 920 && col.h === 800 && main <= 920 && await shows(p, '#a3Chat #a3ChatLog'), JSON.stringify([col, main]));
    all.push(...errs); await b.close();
  }
  /* ---- 9: the relay asks for a code word (the word box is stmt3_ai's, reused) ---- */
  {
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chat3-') });
    await relay(p, { on: false }, 'acorn');
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(600);
    await p.evaluate(fake);
    await say(p, 'hello');
    ck('with no word kept: the word box shows, nothing is sent, the message stays', !!(await p.$('#a3ChatWord #a3WordIn')) && p.__sent.length === 0 && (await p.$eval('#a3ChatIn', e => e.value)) === 'hello');
    await p.type('#a3WordIn', 'oak'); await p.click('#a3WordKeep'); await T.w(100);
    await p.click('#a3ChatSend'); await T.w(500);
    ck('a word that does not match: its box again, said, the message back, nothing kept in the chat', p.__sent.length === 1 && p.__sent[0].body.invite === 'oak' && /didn't match/.test(await p.$eval('#a3WordErr', e => e.textContent)) && (await p.$eval('#a3ChatIn', e => e.value)) === 'hello' && (await turns(p)).length === 0, JSON.stringify(await turns(p)));
    await p.type('#a3WordIn', 'acorn'); await p.click('#a3WordKeep'); await T.w(100);
    await p.click('#a3ChatSend'); await T.w(500);
    ck('the right word: sent in invite and answered', p.__sent.length === 2 && p.__sent[1].body.invite === 'acorn' && JSON.stringify(await turns(p)) === '["hello","Heard: hello"]', JSON.stringify(await turns(p)));
    all.push(...errs); await b.close();
  }
  /* ---- 10: the phone's back button on the open panel (K34, the shared piece src/back3.js), and the Undo bar (K37) ---- */
  {
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chat4-') });
    const depth = () => p.evaluate(() => (history.state && history.state.a3) || 0);
    const back = async () => { await p.evaluate(() => { setTimeout(() => history.back(), 0); }); await T.w(450); };
    const isOpen = () => p.$eval('#a3Chat', e => e.hasAttribute('data-open')).catch(() => null);
    await p.goto('about:blank');
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(500);
    await p.evaluate(fake);
    await p.evaluate(async a => { const { E3 } = BurrowApp3; await E3.fill(BurrowEngine.build.buildBook(Object.assign({}, a, { told: E3.told() }), { newId: E3.newId }).book); BurrowApp3.chat.redraw(); }, MAKO);
    await T.w(300);
    ck('the bar closed holds no history entry', (await isOpen()) === false && (await depth()) === 0, await depth());
    /* an Undo bar from before the panel opens: a spend logged through the one write door */
    await p.evaluate(async () => { const { E3, ACT3 } = BurrowApp3; await ACT3.logSpend({ date: E3.today(), a: 500, acct: E3.book.accounts[0].id, line: 'free' }); });
    await p.click('[data-tab=receipts]'); await T.w(200);
    await p.focus('#a3ChatIn'); await T.w(300);
    ck('the open panel holds one history entry', (await isOpen()) === true && (await depth()) === 1, await depth());
    await p.$eval('#a3ChatIn', e => { e.value = 'half a thought'; });
    await back();
    ck('back closes the panel', (await isOpen()) === false);
    ck('the app is still there, on the tab it was on, with what was typed in the box', /index\.html/.test(await p.url()) && await shows(p, '#a3Rc') && (await p.$eval('#a3ChatIn', e => e.value)) === 'half a thought', await p.url());
    ck('no entry left behind', (await depth()) === 0, await depth());
    await p.focus('#a3ChatSend'); await p.focus('#a3ChatIn'); await T.w(300);
    ck('it opens again', (await isOpen()) === true && (await depth()) === 1, await depth());
    await p.click('#a3ChatClose'); await T.w(450);
    ck('its own Close takes its entry with it', (await isOpen()) === false && (await depth()) === 0, await depth());
    /* a sheet opened from the page while the panel is open is the one on top: back closes it first, then the panel */
    await p.click('[data-tab=home]'); await T.w(150);
    await p.focus('#a3ChatSend'); await p.focus('#a3ChatIn'); await T.w(300);
    await p.$eval('#a3SetGo', e => e.click()); await T.w(350);
    ck('Settings over the open panel: two entries', await shows(p, '#a3Set') && (await isOpen()) === true && (await depth()) === 2, await depth());
    await back();
    ck('back closes Settings first, the panel stays open', !(await shows(p, '#a3Set')) && (await isOpen()) === true && (await depth()) === 1, await depth());
    await back();
    ck('then back closes the panel, and the app stays', (await isOpen()) === false && /index\.html/.test(await p.url()) && (await depth()) === 0, await depth());
    /* [K37] the Undo bar is in the page above the panel, never over it: with the panel open it still shows, whole, above */
    await p.evaluate(async () => { const { E3, ACT3 } = BurrowApp3; await ACT3.logSpend({ date: E3.today(), a: 700, acct: E3.book.accounts[0].id, line: 'free' }); });
    await T.w(300);
    await p.focus('#a3ChatSend'); await p.focus('#a3ChatIn'); await T.w(300);
    const over = await p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'), c = document.querySelector('#a3Chat').getBoundingClientRect(); if (!m) return { none: true }; const r = m.getBoundingClientRect(); return { msgBottom: r.bottom, msgTop: r.top, chatTop: c.top, undo: !!m.querySelector('button') }; });
    ck('an Undo bar from before the panel opened is still there and not under or over the panel', !over.none && over.undo && over.msgBottom <= over.chatTop && over.msgTop >= 0, JSON.stringify(over));
    await p.click('#a3ChatClose'); await T.w(450);
    await back();
    ck('nothing open: back leaves the app, as before', (await p.url()) === 'about:blank', await p.url());
    /* at 1280 the panel is a column that is always there: typing in it holds no entry */
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(500);
    await p.setViewport({ width: 1280, height: 800 }); await T.w(200);
    await p.focus('#a3ChatIn'); await T.w(300);
    ck('at 1280 the column holds no history entry', (await depth()) === 0, await depth());
    all.push(...errs); await b.close();
  }
  /* ---- 11: one failed call never turns the assistant off (AI_JOIN_FIXES E); the real core (tests/chat_real.js) ---- */
  {
    const R = require('./chat_real.js');
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chat5-') });
    const ai = await R.relay(p, { steps: [R.say('Hi. Which country do you bank in?')] });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(600);
    await R.tell(p, 'hello');
    ck('E: a first message is answered', /Which country do you bank in/.test(await R.log(p)) && ai.calls === 1, ai.calls);
    const offShown = () => p.evaluate(() => /assistant is off/.test(document.body.innerText));   // what shows, not the page's own script
    for (const [mode, name] of [['down', 'no connection'], [429, 'a 429'], [503, 'a daily limit (503)']]) {
      ai.mode = mode;
      const before = ai.calls;
      await R.tell(p, 'Japan');
      ck('E: ' + name + ': the call was made and failed in words', ai.calls === before + 1 && /did not answer/.test(await R.log(p)), String(ai.calls));
      ck('E: after ' + name + ' the page does not say the assistant is off', !(await offShown()));
      ai.mode = 'ok'; ai.push(R.say('Got it.'));
      const n = (await R.log(p)).split('Got it.').length;
      await R.tell(p, 'Japan');
      ck('E: after ' + name + ' the next send makes a call and is answered', ai.calls === before + 2 && (await R.log(p)).split('Got it.').length === n + 1, String(ai.calls - before));
    }
    ai.mode = 'off';
    let before = ai.calls;
    await R.tell(p, 'Japan');
    ck('E: the relay\'s own "off" answer: the page says the assistant is off', ai.calls === before + 1 && await offShown());
    before = ai.calls; ai.mode = 'ok';
    await R.tell(p, 'Japan');
    ck('E: once it is off, nothing more is sent this visit', ai.calls === before);
    /* [AI_JOIN_FIXES G] one wording for "the assistant is off", in the panel and in Settings */
    await p.$eval('#a3SetGo', e => e.click()); await T.w(500);
    const setOff = await p.$eval('[data-set=aioff]', e => e.textContent).catch(() => null);
    ck('G: Settings says it in the same words as the panel: "The assistant is off right now"', setOff === 'The assistant is off right now. Everything else still works' && /The assistant is off right now/.test(await p.$eval('[data-card=chat-off]', e => e.textContent).catch(() => '')), setOff);
    all.push(...errs); await b.close();
  }
  /* ---- 12: one assistant (AI_JOIN_FIXES G): the header "Ask" opens the panel; the old Ask sheet is gone ---- */
  {
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chat6-') });
    await relay(p, { on: false });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(600);
    ck('G: the page has no old Ask sheet', !(await p.$('#a3Ask')) && !(await p.$('#a3AskIn')));
    await p.click('#a3AskGo'); await T.w(300);
    ck('G: before setup, Ask puts the cursor in the welcome\'s chat box', await p.evaluate(() => document.activeElement && document.activeElement.id === 'a3ChatIn' && !!document.activeElement.closest('#a3Home')));
    await p.evaluate(async a => { const { E3 } = BurrowApp3; await E3.fill(BurrowEngine.build.buildBook(Object.assign({}, a, { told: E3.told() }), { newId: E3.newId }).book); BurrowApp3.chat.redraw(); }, MAKO);
    await T.w(300);
    await p.click('[data-tab=plan]'); await T.w(200);
    await p.click('#a3AskGo'); await T.w(400);
    ck('G: with a book, the header Ask opens the assistant panel, the cursor in its box', await p.evaluate(() => document.querySelector('#a3Chat').hasAttribute('data-open') && document.activeElement && document.activeElement.id === 'a3ChatIn' && !!document.activeElement.closest('#a3Chat')));
    ck('G: and the tab it was on stays under it', await shows(p, '#a3Plan'));
    await p.$eval('#a3Chat #a3ChatIn', e => { e.value = 'what is this screen?'; }); await p.$eval('#a3Chat #a3ChatSend', e => e.click()); await T.w(600);
    ck('H4: the message tells the AI which screen is open (Plan)', /SCREEN: the person has Plan open/.test(JSON.stringify((p.__sent[p.__sent.length - 1] || {}).body || {})));
    await p.click('#a3ChatClose'); await T.w(300);
    await p.click('#a3SetGo'); await T.w(300);
    await p.click('#a3AskGo'); await T.w(400);
    ck('G: Ask from Settings: Settings closes and the panel opens', !(await shows(p, '#a3Set')) && await p.evaluate(() => document.querySelector('#a3Chat').hasAttribute('data-open')));
    all.push(...errs); await b.close();
  }
  /* ---- 13: the bar is there in the made-up numbers and on "Set up on the screens" (AI_JOIN_FIXES I4) ---- */
  {
    const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3chat7-') });
    await relay(p, { on: false });
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(600);
    const boxes = () => p.$$eval('#a3ChatIn', es => es.map(e => !!e.closest('#a3Chat') ? 'bar' : 'home'));
    ck('I4: in the made-up numbers the assistant\'s bar is there', await shows(p, '#a3Chat #a3ChatIn') && JSON.stringify(await boxes()) === '["bar"]', JSON.stringify(await boxes()));
    await p.click('#a3AskGo'); await T.w(400);
    ck('I4: and the header Ask opens it there', await p.evaluate(() => document.querySelector('#a3Chat').hasAttribute('data-open')) && await shows(p, '#a3Try'));
    await p.click('#a3ChatClose'); await T.w(300);
    await p.click('#a3TryOut'); await T.w(600);
    ck('I4: leaving the made-up numbers with no book lands on the assistant: one chat box, in the welcome', JSON.stringify(await boxes()) === '["home"]' && await shows(p, '#a3Home #a3ChatIn') && !(await shows(p, '#a3Setup')), JSON.stringify(await boxes()));
    await p.click('#a3SetupGo'); await T.w(500);
    ck('I4: on "Set up on the screens" the bar is there, the one chat box', await shows(p, '#a3Setup') && await shows(p, '#a3Chat #a3ChatIn') && JSON.stringify(await boxes()) === '["bar"]', JSON.stringify(await boxes()));
    await p.$eval('#a3Chat #a3ChatIn', e => { e.value = 'what goes in the bank box?'; }); await p.$eval('#a3Chat #a3ChatSend', e => e.click()); await T.w(700);
    ck('I4: a message from the bar on the setup screens goes through and is answered', p.__sent.length === 1 && /what goes in the bank box\?Heard: /.test(await p.$eval('#a3Chat', e => e.textContent)), String(p.__sent.length));
    await p.click('#a3SetupX'); await T.w(500);
    ck('I4: Back from the setup screens: the welcome again, one chat box', JSON.stringify(await boxes()) === '["home"]' && !(await shows(p, '#a3Chat')), JSON.stringify(await boxes()));
    all.push(...errs); await b.close();
  }
  const bad = all.filter(e => !/status of (500|401|429|503)|ERR_INTERNET_DISCONNECTED/.test(e));   // the relay made to fail on purpose
  ck('no page errors', !bad.length, bad.join(' | '));
  T.done('e3_chat');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
