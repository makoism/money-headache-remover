#!/usr/bin/env node
/* The assistant's error log (AI_JOIN_FIXES J), on the real page with the real core (tests/chat_real.js: the fake model
   behind a made-up relay). Tue 24 Nov 2026, setup by chat, made-up amounts.
   1. Three failed messages: no connection, a 429, a 503. Each lands in the log on this device: when, the kind of ask
      (a setup answer here), the error words shown, the server's status. Never the person's words, and no digits from
      the message (the messages carry 286,000 and 54,000).
   2. A message that goes through adds nothing.
   3. Settings, "Copy the assistant's error log": plain text to the clipboard, one first line saying what is in it and that
      it holds no figures, then one line a failure.
   4. It is kept after a reload. It is in the device record only: never in the book, which is what a backup file and the
      cloud copy are made of.
   5. Clear empties it, with Undo that puts it back. The last 20 only. */
'use strict';
const T = require('./lib3.js'), { ck } = T, R = require('./chat_real.js');
const fs = require('fs'), os = require('os');
const logOf = p => p.evaluate(async () => (await BurrowApp3.E3.rec('aiLog')) || []);
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3ailog-') });
  await p.evaluateOnNewDocument(() => { window.__copied = null; try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } } }); } catch (e) { /* none */ } });
  const ai = await R.relay(p);
  try {
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(700);
    /* 1 */
    for (const [mode, words] of [['down', 'Main bank has 286,000'], [429, 'Card A has 54,000'], [503, 'Main bank has 286,000']]) {
      ai.mode = mode; await R.tell(p, words);
    }
    let log = await logOf(p);
    ck('J: three failed messages, three entries', log.length === 3, JSON.stringify(log));
    ck('J: each says when, the kind (a setup answer), the error words shown and the server status', log.every(e => e.at && e.kind === 'a setup answer' && e.error) && JSON.stringify(log.map(e => e.status)) === '[0,429,503]', JSON.stringify(log));
    ck('J: the words shown are there: no connection, too many requests, the daily limit', /no connection/i.test(log[0].error) && /Too many requests/i.test(log[1].error) && /Daily limit/i.test(log[2].error), JSON.stringify(log.map(e => e.error)));
    const text = JSON.stringify(log);
    ck('J: never the person\'s words, and no digits from the message', !/Main bank has|Card A has|286|54,?000/.test(text) && log.every(e => !/\d/.test(e.error)), text);
    /* 2 */
    ai.mode = 'ok'; ai.push(R.say('Which country do you bank in?'));
    await R.tell(p, 'hello');
    ck('J: a message that goes through adds nothing', (await logOf(p)).length === 3);
    /* 3 */
    await p.$eval('#a3OtherGo', e => e.click()).catch(() => {}); await T.w(200);
    if (!(await p.$('#a3Set:not([hidden])'))) { await p.$eval('#a3SetGo', e => e.click()); await T.w(400); }
    await p.$eval('#a3AiLogCopy', e => e.click()); await T.w(300);
    const copied = await p.evaluate(() => window.__copied) || '';
    const lines = copied.split('\n');
    ck('J: Copy gives plain text: a first line saying what is in it and that it holds no figures, then one line a failure', /error log/i.test(lines[0]) && /no money figures/i.test(lines[0]) && lines.length === 4 && /no connection/i.test(lines[1]) && /429/.test(lines[2]) && /503/.test(lines[3]), copied);
    ck('J: the copy holds none of the person\'s words', !/Main bank has|286/.test(copied));
    /* 4 */
    await p.reload(); await T.w(800);
    ck('J: kept after a reload', (await logOf(p)).length === 3);
    const shared = await p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return JSON.stringify(r.copy || null); });
    ck('J: never in the book (what a backup file and the cloud copy are made of)', !/no connection|Too many requests|aiLog/i.test(shared), shared.slice(0, 200));
    /* 5 */
    await p.$eval('#a3OtherGo', e => e.click()).catch(() => {}); await T.w(200);
    if (!(await p.$('#a3Set:not([hidden])'))) { await p.$eval('#a3SetGo', e => e.click()); await T.w(400); }
    await p.$eval('#a3AiLogClear', e => e.click()); await T.w(400);
    ck('J: Clear empties it', (await logOf(p)).length === 0);
    const undo = await p.$$eval('#a3Msg button', bs => bs.map(x => x.textContent));
    ck('J: with Undo', undo.includes('Undo'), JSON.stringify(undo));
    await p.evaluate(() => [...document.querySelectorAll('#a3Msg button')].find(x => x.textContent === 'Undo').click()); await T.w(400);
    ck('J: Undo puts it back', (await logOf(p)).length === 3);
    await p.evaluate(async () => { const { E3 } = BurrowApp3; const l = await E3.rec('aiLog'); await E3.rec('aiLog', l.concat(Array.from({ length: 30 }, () => l[0]))); });
    ai.mode = 429; await p.$eval('#a3SetClose', e => e.click()).catch(() => {}); await T.w(200);
    await R.tell(p, 'Main bank has 286,000');
    ck('J: the last 20 only', (await logOf(p)).length === 20, String((await logOf(p)).length));
    const bad = errs.filter(e => !/status of (429|503)|ERR_INTERNET_DISCONNECTED/.test(e));
    ck('no page errors', !bad.length, bad.join(' | '));
  } catch (e) { ck('the test ran to its end', false, e.stack); }
  await b.close();
  T.done('e3_ailog');
})();
