#!/usr/bin/env node
/* The code word for the AI (the relay's INVITE_CODES): a made-up relay address answered by the test, never the real one.
   The made-up relay says invite:true on /api/health and answers /api/ai only when the call's `invite` is "otter"; any
   other word gets the relay's own 401 invite_required.
   1. One place sends every relay call (STMT3_AI.post): the assistant and Add statements both carry the kept word in `invite`.
   2. When the relay asks for a word and none is kept here, the assistant (on a message) and Add statements show the box
      "Code word for the AI (ask the owner)"; nothing goes to the AI until a word is typed. The word is kept on this device only
      (localStorage burrow3.invite), never in the book, its kept copies or anything saved for the backup or cloud copy.
   3. A 401 invite_required says "The code word didn't match. Type it again" with the box, never "(401)".
   4. Settings has a line to change or clear the word.
   5. A relay that asks for no word shows no box. No page errors. Every word and amount is made up.
   [AI_JOIN_FIXES G] The old Ask sheet is gone: the header Ask opens the assistant panel, so each check that used the
   sheet now goes through the panel, on a book kept on this device (the made-up numbers keep no chat). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const T = require('./lib3.js'), { ck } = T;
const DAY = '2026-12-16', GOOD = 'otter', BAD_WORDS = "The code word didn't match. Type it again";
const bk = T.book(), BANK = bk.accounts.find(a => a.name === 'Main bank').id;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e3invite-'));
fs.writeFileSync(path.join(dir, 'bank.csv'), 'made-up file for the test\n');
const ROWS = { kind: 'bank', rows: [{ date: '2026-12-01', text: 'SUPER MARKET', amount: 2480, dir: 'out', cat: 'food' }] };

/* the made-up relay: health says what it is told; /api/ai wants the word "otter" */
async function relay(p, health) {
  await p.evaluateOnNewDocument(() => { window.STMT3_RELAY = 'https://relay.example'; });
  await p.setRequestInterception(true);
  const sent = [], H = { 'access-control-allow-origin': '*' };
  p.on('request', rq => {
    const u = rq.url();
    if (u === 'https://relay.example/api/health') return rq.respond({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify(health) });
    if (u === 'https://relay.example/api/ai') {
      if (rq.method() === 'OPTIONS') return rq.respond({ status: 204, headers: Object.assign({ 'access-control-allow-headers': 'content-type, x-app' }, H) });
      const body = JSON.parse(rq.postData()); sent.push(body);
      /* [C5] the relay's own refusals, as functions/api/ai.js words them: { status, message } set by the test */
      if (health.fail) return rq.respond({ status: health.fail.status, contentType: 'application/json', headers: H, body: JSON.stringify(health.fail.message ? { error: { code: 'x', message: health.fail.message } } : {}) });
      if (health.invite && String(body.invite || '').trim().toLowerCase() !== GOOD) return rq.respond({ status: 401, contentType: 'application/json', headers: H, body: JSON.stringify({ error: { code: 'invite_required', message: 'This page needs the code word from its owner.' } }) });
      const tool = body.tools[0].name;
      /* the assistant's request (chat3_core): plain words back */
      if (tool !== 'statement_rows') return rq.respond({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Rent is 72,000 on 27 Nov.' }] }) });
      const input = ROWS;
      return rq.respond({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: tool, input }] }) });
    }
    rq.continue();
  });
  return sent;
}
const kept = p => p.evaluate(() => localStorage.getItem('burrow3.invite'));
const hasBox = async p => !!(await p.$('#a3Word')) && /Code word for the AI \(ask the owner\)/.test(await p.$eval('#a3Word label', e => e.textContent));
async function typeWord(p, w) { await p.$eval('#a3WordIn', (e, v) => { e.value = v; }, w); await p.click('#a3WordKeep'); await T.w(150); }
/* the assistant panel: the header Ask opens it; a message is typed in its box and sent */
async function ask(p, q) { await p.$eval('#a3ChatIn', (e, v) => { e.value = v; }, q); await p.$eval('#a3ChatSend', e => e.click()); await T.w(700); }
const lastAi = p => p.$$eval('#a3ChatLog > *', e => (e[e.length - 1] || {}).textContent || '');
const askBox = p => p.$eval('#a3ChatIn', e => e.value);
/* a book kept on this device (the made-up numbers keep no chat), then the page again */
async function withBook(p) {
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); await s.save(bk0, { full: true }); s.close(); }, bk);
  await p.reload(); await T.w(600);
}
async function pick(p) {
  await p.click('#a3StmtGo'); await T.w(300);
  (await p.$(`[data-files="${BANK}"]`)).uploadFile(path.join(dir, 'bank.csv'));
  await T.w(300);
}
/* every IndexedDB database on the page, as text: the book, its kept copies, anything waiting for the cloud copy */
const idbText = p => p.evaluate(async () => {
  const out = [];
  for (const d of await indexedDB.databases()) {
    const db = await new Promise((res, rej) => { const r = indexedDB.open(d.name); r.onsuccess = () => res(r.result); r.onerror = rej; });
    for (const s of db.objectStoreNames) {
      const all = await new Promise(res => { const g = db.transaction(s).objectStore(s).getAll(); g.onsuccess = () => res(g.result); g.onerror = () => res([]); });
      out.push(s + ':' + JSON.stringify(all));
    }
    db.close();
  }
  return out.join('\n');
});

(async () => {
  /* Ask and Add statements on a made-up relay that asks for a word */
  {
    const { b, p, errs } = await T.open();
    const sent = await relay(p, { ai: true, invite: true });
    await withBook(p);

    /* the box, once, when no word is kept here */
    await p.click('#a3AskGo'); await T.w(400);
    ck('the assistant: opening sends nothing to the AI', sent.length === 0);
    await ask(p, 'What is due before next pay?');
    ck('the assistant: the relay asks for a word and none is kept here: the box "Code word for the AI (ask the owner)" shows', await hasBox(p));
    ck('a message without a word typed: nothing is sent, the box is there, the message is back in its box', sent.length === 0 && await hasBox(p) && (await askBox(p)) === 'What is due before next pay?');

    /* a word that does not match */
    await typeWord(p, 'badger');
    ck('the word typed is kept on this device only (localStorage burrow3.invite), and the box goes', (await kept(p)) === 'badger' && !(await p.$('#a3Word')));
    await ask(p, 'What is due before next pay?');
    ck('[item 3] the relay call carries the word in invite', sent.length === 1 && sent[0].invite === 'badger', JSON.stringify(sent.map(s => s.invite)));
    const bad = await p.$eval('#a3WordErr', e => e.textContent).catch(() => '');
    ck('a 401 invite_required has its own words, never "(401)"', bad === BAD_WORDS && !/401|did not answer/.test(await p.$eval('#a3Chat', e => e.textContent)), bad);
    ck('with the box again, and the message back in its box', await hasBox(p) && (await askBox(p)) === 'What is due before next pay?');
    ck('the word that did not match is no longer kept', (await kept(p)) === null);

    /* the right word */
    await typeWord(p, GOOD);
    await ask(p, 'What is due before next pay?');
    ck('with the right word the answer reaches the page', (await lastAi(p)) === 'Rent is 72,000 on 27 Nov.' && sent[sent.length - 1].invite === GOOD, await lastAi(p));
    await p.click('#a3ChatClose'); await T.w(200);
    await p.click('#a3AskGo'); await T.w(400);
    await ask(p, 'And after that?');
    ck('the assistant again: the word is kept, so no box', !(await p.$('#a3Word')) && sent[sent.length - 1].invite === GOOD);
    await p.click('#a3ChatClose'); await T.w(200);

    /* Add statements: the same word, from the same place */
    await pick(p);
    ck('Add statements: a word is kept, so no box', !(await p.$('#a3Word')));
    const n0 = sent.length;
    await p.click('#a3StmtRead'); await T.w(900);
    ck('[item 3] Add statements carries the same word in invite', sent.length === n0 + 1 && sent[n0].invite === GOOD && sent[n0].tools[0].name === 'statement_rows');
    ck('and its rows reach the review', /1 line/.test(await p.$eval('#a3Stmt h2', e => e.textContent).catch(() => '')));
    await p.click('#a3StmtBack').catch(() => {}); await T.w(200);
    if (await p.$('#a3StmtX')) { await p.click('#a3StmtX'); await T.w(200); }

    /* Settings: change the word, then the relay refuses it in Add statements */
    await p.click('#a3SetGo'); await T.w(300);
    ck('Settings has a line on the code word: kept on this device only', /kept on this device only/i.test(await p.$eval('[data-set="word"]', e => e.textContent).catch(() => '')));
    await p.$eval('#a3SetWordIn', e => { e.value = 'weasel'; }); await p.click('#a3SetWordKeep'); await T.w(200);
    ck('Settings changes the word', (await kept(p)) === 'weasel');
    await p.click('#a3SetClose'); await T.w(200);
    await pick(p);
    const n1 = sent.length;
    await p.click('#a3StmtRead'); await T.w(900);
    const err = await p.$eval('#a3StmtErr', e => e.textContent);
    ck('Add statements: a 401 invite_required has its own words, with the box', sent.length === n1 + 1 && sent[n1].invite === 'weasel' && err === BAD_WORDS && await hasBox(p), err);
    ck('never "(401)" or "did not answer" on the sheet', !/401|did not answer/.test(await p.$eval('#a3Stmt', e => e.textContent)));
    await typeWord(p, GOOD);
    await p.click('#a3StmtRead'); await T.w(900);
    ck('the word typed again, Read goes through', sent[sent.length - 1].invite === GOOD && /1 line/.test(await p.$eval('#a3Stmt h2', e => e.textContent).catch(() => '')));
    await p.click('#a3StmtBack').catch(() => {}); await T.w(200);
    if (await p.$('#a3StmtX')) { await p.click('#a3StmtX'); await T.w(200); }

    /* Settings: clear it, and the box comes back */
    await p.click('#a3SetGo'); await T.w(300);
    await p.click('#a3SetWordClear'); await T.w(200);
    ck('Settings clears the word', (await kept(p)) === null && /No code word/i.test(await p.$eval('[data-set="word"]', e => e.textContent)));
    await p.click('#a3SetClose'); await T.w(200);
    await p.click('#a3AskGo'); await T.w(400);
    const nC = sent.length;
    await ask(p, 'What is due before next pay?');
    ck('cleared: the assistant shows the box again, and sends nothing', await hasBox(p) && sent.length === nC);
    ck('the word went nowhere but the relay\'s invite field', sent.every(s => Object.keys(s).filter(k => JSON.stringify(s[k]).includes(GOOD)).every(k => k === 'invite')));
    const errs1 = errs.filter(e => !/status of 401 \(Unauthorized\)/.test(e));   // the browser's own line for the relay's 401, not a page error
    ck('no page errors (the browser\'s line for the 401 aside)', errs1.length === 0, errs1.join(' | '));
    await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await T.w(200);
    ck('no sideways scroll at 320 with the box', await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth) <= 320));
    await T.shot(p, 'invite_box');
    await b.close();
  }

  /* a kept book: the word is never in what is saved (the book, its kept copies, the cloud copy's queue) */
  {
    const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'e3invb-'));
    const { b, p, errs } = await T.open({ profile: prof });
    const sent = await relay(p, { ai: true, invite: true });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); await s.save(bk0, { full: true }); s.close(); }, bk);
    await p.reload(); await T.w(500);
    await p.click('#a3AskGo'); await T.w(400);
    await ask(p, 'What is due before next pay?');
    await typeWord(p, GOOD);
    await p.$eval('#a3ChatSend', e => e.click()); await T.w(700);
    ck('kept book: the answer came through the relay with the word', sent.length === 1 && sent[0].invite === GOOD);
    await p.click('#a3ChatClose'); await T.w(200);
    await p.click('#a3SetGo'); await T.w(300);
    await p.click('#a3BkSave').catch(() => {}); await T.w(300);
    ck('the word is in localStorage only, never in the saved book or anything kept with it', (await kept(p)) === GOOD && !(await idbText(p)).includes(GOOD));
    ck('no page errors (kept book)', errs.length === 0, errs.join(' | '));
    await b.close();
    fs.rmSync(prof, { recursive: true, force: true });
  }

  /* a relay that asks for no word: no box, nothing kept */
  {
    const { b, p, errs } = await T.open();
    const sent = await relay(p, { ai: true });
    await withBook(p);
    await p.click('#a3AskGo'); await T.w(400);
    await ask(p, 'What is due before next pay?');
    ck('no word asked for: no box', !(await p.$('#a3Word')));
    ck('no word asked for: the answer comes, nothing kept on the device', (await lastAi(p)) === 'Rent is 72,000 on 27 Nov.' && sent[0].invite === '' && (await p.evaluate(() => localStorage.length)) === 0, await lastAi(p));
    ck('no page errors (no word)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* [C5] the server's own message is shown for 400, 429 and 503 (functions/api/ai.js words each case), never a bare
     "(503)" or "try again in a minute" for a daily limit; a reply with no message keeps the old words. Settings says so
     when /api/health reports the AI is off, and says nothing when it is on. */
  {
    const { b, p, errs } = await T.open();
    const health = { ai: true };
    await relay(p, health);
    await withBook(p);
    await p.click('#a3AskGo'); await T.w(400);
    for (const [status, message] of [[429, 'Daily limit for this device reached. Try again tomorrow.'], [503, 'The AI has no credit left on this page. The owner needs to top it up.'], [400, 'Claude rejected the request.']]) {
      health.fail = { status, message };
      await ask(p, 'What is due before next pay?');
      const got = await lastAi(p);
      ck(`C5: a ${status} shows the server's own message`, got === `The AI did not answer: ${message.replace(/\.$/, '')}. Nothing was lost`, got);
    }
    health.fail = { status: 500 };
    await ask(p, 'What is due before next pay?');
    ck('C5: a reply with no message keeps the plain fallback', /the AI did not answer \(500\)/.test(await lastAi(p)), await lastAi(p));
    health.fail = { status: 429 };
    await ask(p, 'What is due before next pay?');
    ck('C5: a 429 with no message keeps the caller\'s words', /the daily limit is reached, or too many messages at once/.test(await lastAi(p)), await lastAi(p));
    health.fail = { status: 503, message: 'The relay has no API key yet.' };
    await p.click('#a3ChatClose'); await T.w(200);
    await pick(p);
    await p.click('#a3StmtRead'); await T.w(900);
    const sheet = await p.$eval('#a3Stmt', e => e.textContent);
    ck('C5: Add statements shows the server\'s message too, never "(503)"', /The relay has no API key yet/.test(sheet) && !/\(503\)/.test(sheet), sheet.slice(0, 400));
    if (await p.$('#a3StmtX')) { await p.click('#a3StmtX'); await T.w(200); }
    await p.click('#a3SetGo'); await T.w(500);
    ck('C5: the AI is on: Settings has no "AI is off" line', !(await p.$('[data-set=aioff]')));
    const errs1 = errs.filter(e => !/status of (400|429|500|503)/.test(e));   // the browser's own lines for the relay's refusals
    ck('no page errors (C5, the browser\'s lines for the refusals aside)', errs1.length === 0, errs1.join(' | '));
    await b.close();
  }
  {
    const { b, p, errs } = await T.open();
    await relay(p, { ai: false });
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
    await p.click('#a3SetGo'); await T.w(500);
    const off = await p.$eval('[data-set=aioff]', e => e.textContent).catch(() => null);
    ck('C5: /api/health says ai false: Settings says the assistant is off, in the panel\'s words (AI_JOIN_FIXES G)', off === 'The assistant is off right now. Everything else still works', off);
    ck('no page errors (AI off)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  fs.rmSync(dir, { recursive: true, force: true });
  T.done('e3_invite');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
