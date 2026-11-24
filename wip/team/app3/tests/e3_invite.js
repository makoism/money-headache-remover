#!/usr/bin/env node
/* The code word for the AI (the relay's INVITE_CODES): a made-up relay address answered by the test, never the real one.
   The made-up relay says invite:true on /api/health and answers /api/ai only when the call's `invite` is "otter"; any
   other word gets the relay's own 401 invite_required.
   1. One place sends every relay call (STMT3_AI.post): Ask and Add statements both carry the kept word in `invite`.
   2. When the relay asks for a word and none is kept here, Ask and Add statements show the box "Code word for the AI
      (ask the owner)"; nothing goes to the AI until a word is typed. The word is kept on this device only
      (localStorage burrow3.invite), never in the book, its kept copies or anything saved for the backup or cloud copy.
   3. A 401 invite_required says "The code word didn't match. Type it again" with the box, never "(401)".
   4. Settings has a line to change or clear the word.
   5. A relay that asks for no word shows no box. No page errors. Every word and amount is made up. */
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
      if (health.invite && String(body.invite || '').trim().toLowerCase() !== GOOD) return rq.respond({ status: 401, contentType: 'application/json', headers: H, body: JSON.stringify({ error: { code: 'invite_required', message: 'This page needs the code word from its owner.' } }) });
      const tool = body.tools[0].name;
      const input = tool === 'money_answer' ? { answer: 'Rent is 72,000 on 27 Nov.', actions: [] } : ROWS;
      return rq.respond({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: tool, input }] }) });
    }
    rq.continue();
  });
  return sent;
}
const kept = p => p.evaluate(() => localStorage.getItem('burrow3.invite'));
const hasBox = async p => !!(await p.$('#a3Word')) && /Code word for the AI \(ask the owner\)/.test(await p.$eval('#a3Word label', e => e.textContent));
async function typeWord(p, w) { await p.$eval('#a3WordIn', (e, v) => { e.value = v; }, w); await p.click('#a3WordKeep'); await T.w(150); }
async function ask(p, q) { await p.$eval('#a3AskIn', (e, v) => { e.value = v; }, q); await p.click('#a3AskSend'); await T.w(500); }
const lastAi = p => p.$$eval('.a3-ask-ai', e => (e[e.length - 1] || {}).textContent || '');
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
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);

    /* the box, once, when no word is kept here */
    await p.click('#a3AskGo'); await T.w(400);
    ck('Ask: the relay asks for a word and none is kept here: the box "Code word for the AI (ask the owner)" shows', await hasBox(p));
    ck('Ask: opening sends nothing to the AI', sent.length === 0);
    await ask(p, 'What is due before next pay?');
    ck('Ask without a word typed: nothing is sent, the box is still there, the question is back', sent.length === 0 && await hasBox(p) && (await p.$eval('#a3AskIn', e => e.value)) === 'What is due before next pay?');

    /* a word that does not match */
    await typeWord(p, 'badger');
    ck('the word typed is kept on this device only (localStorage burrow3.invite), and the box goes', (await kept(p)) === 'badger' && !(await p.$('#a3Word')));
    await ask(p, 'What is due before next pay?');
    ck('[item 3] the relay call carries the word in invite', sent.length === 1 && sent[0].invite === 'badger', JSON.stringify(sent.map(s => s.invite)));
    const bad = await lastAi(p);
    ck('a 401 invite_required has its own words, never "(401)"', bad === BAD_WORDS && !/401|did not answer/.test(await p.$eval('#a3Ask', e => e.textContent)), bad);
    ck('with the box again, and the question back in its box', await hasBox(p) && (await p.$eval('#a3AskIn', e => e.value)) === 'What is due before next pay?');
    ck('the word that did not match is no longer kept', (await kept(p)) === null);

    /* the right word */
    await typeWord(p, GOOD);
    await ask(p, 'What is due before next pay?');
    ck('with the right word the answer reaches the page', (await lastAi(p)) === 'Rent is 72,000 on 27 Nov.' && sent[sent.length - 1].invite === GOOD);
    await p.click('#a3AskClose'); await T.w(200);
    await p.click('#a3AskGo'); await T.w(400);
    ck('Ask again: the word is kept, so no box', !(await p.$('#a3Word')));
    await p.click('#a3AskClose'); await T.w(200);

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
    ck('cleared: Ask shows the box again', await hasBox(p));
    ck('the word went nowhere but the relay\'s invite field', sent.every(s => Object.keys(s).filter(k => JSON.stringify(s[k]).includes(GOOD)).every(k => k === 'invite')));
    ck('no page errors', errs.length === 0, errs.join(' | '));
    await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await T.w(200);
    ck('no sideways scroll at 320 with the box', await p.evaluate(() => document.documentElement.scrollWidth <= 320));
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
    await typeWord(p, GOOD);
    await ask(p, 'What is due before next pay?');
    ck('kept book: the answer came through the relay with the word', sent.length === 1 && sent[0].invite === GOOD);
    await p.click('#a3AskClose'); await T.w(200);
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
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
    await p.click('#a3AskGo'); await T.w(400);
    ck('no word asked for: no box', !(await p.$('#a3Word')));
    await ask(p, 'What is due before next pay?');
    ck('no word asked for: the answer comes, nothing kept on the device', (await lastAi(p)) === 'Rent is 72,000 on 27 Nov.' && sent[0].invite === '' && (await p.evaluate(() => localStorage.length)) === 0);
    ck('no page errors (no word)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  fs.rmSync(dir, { recursive: true, force: true });
  T.done('e3_invite');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
