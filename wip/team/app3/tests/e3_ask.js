#!/usr/bin/env node
/* Ask on the page: the made-up Mako book with a plan (a Food line, Free to spend, a Trip goal with money set aside),
   kept on this device, on Wed 25 Nov 2026. No real AI is called: the AI's answers are made-up recorded replies given
   by a stand-in for the viewer's Claude (window.claude) and, for the relay, by answering the page's own requests to a
   made-up relay address.
   1. Opening Ask sends nothing; the line on what is sent is there, and "See what is sent" is the exact summary.
   2. A question: the request carries the summary (no record id, no note, no shop) and the question; the answer shows
      in plain words; nothing is written.
   3. A reply with changes: ticked steps with the engine's figures before and after; unticking one redraws them;
      Apply writes through ACT3 (Home shows the engine's figure for the saved book); Undo takes all of it back.
   4. A reply with a change the app does not do: it is left out and said; nothing to apply.
   5. The relay: the request has the answer's shape as a tool and the summary; the answer reaches the page.
   6. No page errors; no sideways scroll at 320. Every amount is made up. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const I = require('../../engine/ids.js');
const A3 = require('../src/act3.js'), W = require('../src/plan3_write.js'), K = require('../src/ask3_core.js');
const DAY = '2026-11-25', BANK = 'k7m2qa-f3n8p1x6wd-1';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
async function planned() {
  let b = T.book();
  const A = A3.make({ book: () => b, put: async x => { b = x; return true; }, told: () => DAY + 'T09:00+09:00', newId: I.idMaker('e3askb', Math.random), today: () => DAY, queue: { post: () => {} }, check: x => T.L.lookahead(x, DAY) });
  await A.run('l', w => W.addLine(w, { name: 'Food', amount: 30000 }));
  await A.run('f', w => W.setFree(w, { amount: 20000, when: 'now' }));
  await A.run('g', w => W.addGoal(w, { name: 'Trip', target: 100000, due: '2027-06-01' }));
  await A.run('s', w => W.setAside(w, b.places[0].id, { amount: 10000 }));
  await A.logSpend({ date: DAY, a: 1200, acct: BANK, line: b.plan.budgets[0].id, note: 'secret coffee at Blue Door' });
  return b;
}
/* the recorded replies, by the question */
const REPLY = {
  'How much can I spend before pay day?': { answer: 'Safe to spend is 13,333 until pay on 10 Dec.', actions: [] },
  'I spent 9,000 on dinner and want to put 5,000 toward the trip': { answer: 'Logged the dinner on Food and 5,000 for the Trip, if you apply it.', actions: [
    { do: 'log_spend', amount: 9000, line: 'L1', note: 'dinner' }, { do: 'set_aside', goal: 'G1', amount: 5000 }] },
  'Delete my rent': { answer: 'I can\'t remove a bill from here.', actions: [{ do: 'remove_bill', bill: 'Rent' }] }
};
async function stub(p) {
  await p.evaluateOnNewDocument(replies => {
    window.__asked = [];
    const fn = async () => ({ text: '' });
    fn.form = async (prompt, opts) => { window.__asked.push({ prompt, opts }); const q = prompt.split('THE QUESTION\n')[1]; return JSON.parse(JSON.stringify(replies[q] || { answer: 'I don\'t know', actions: [] })); };
    window.claude = { use: async () => fn };
  }, REPLY);
}
async function ask(p, q) { await p.$eval('#a3AskIn', (e, v) => { e.value = v; }, q); await p.click('#a3AskSend'); await T.w(500); }

(async () => {
  const bk = await planned(), S = K.summary(bk, DAY);
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3ask-');
  const { b, p, errs, requests } = await T.open({ profile: prof });
  await stub(p);
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await seed(p, bk); await p.reload(); await T.w(500);

  /* 1. opening sends nothing */
  await p.click('#a3AskGo'); await T.w(300);
  ck('Ask opens as its own sheet over the tabs', await p.$eval('#a3Ask', e => !e.hidden) && await p.$eval('#a3Home', e => e.hidden));
  ck('the line on what is sent: the question and a short summary, never notes, shops or single spends', /question and a short summary/.test(await p.$eval('#a3AskWhat', e => e.textContent)) && /never sent/.test(await p.$eval('#a3AskWhat', e => e.textContent)));
  ck('"See what is sent" is the exact summary, the same as in node', await p.$eval('#a3AskSent', e => e.textContent) === S.text, (await p.$eval('#a3AskSent', e => e.textContent)).slice(0, 200));
  ck('nothing is sent on opening', (await p.evaluate(() => window.__asked.length)) === 0 && requests.length === 0, JSON.stringify(requests));

  /* 2. a question and its answer */
  const before = JSON.stringify(await saved(p));
  await ask(p, 'How much can I spend before pay day?');
  const asked = await p.evaluate(() => window.__asked);
  ck('one request, through the viewer\'s Claude, in the fixed answer shape', asked.length === 1 && asked[0].opts.name === 'money_answer' && asked[0].opts.schema.required.join() === 'answer,actions');
  ck('the request carries the summary and the question', asked[0].prompt.includes(S.text) && asked[0].prompt.endsWith('How much can I spend before pay day?'));
  const ids = [].concat(...['accounts', 'schedules', 'places', 'events'].map(k => bk[k].map(x => x.id)), bk.plan.budgets.map(x => x.id));
  ck('no record id, note or shop in what was sent', !ids.some(id => asked[0].prompt.includes(id)) && !/coffee|Blue Door/.test(asked[0].prompt));
  ck('the answer shows in plain words', (await p.$$eval('.a3-ask-ai', e => e.map(x => x.textContent))).includes('Safe to spend is 13,333 until pay on 10 Dec.'));
  ck('no change card for a plain answer, nothing written', !(await p.$('[data-card="ask-change"]')) && JSON.stringify(await saved(p)) === before);
  ck('the question box is empty again', (await p.$eval('#a3AskIn', e => e.value)) === '');

  /* 3. a reply with changes */
  await ask(p, 'I spent 9,000 on dinner and want to put 5,000 toward the trip'); await T.w(300);
  const stepTxt = await p.$$eval('[data-askstep]', e => e.map(x => x.parentNode.textContent.trim()));
  ck('two ticked steps in plain words', stepTxt.join('|') === 'Log a spend of ¥9,000 on Food from Main bank, today (dinner)|Set aside ¥5,000 for Trip, today', stepTxt.join('|'));
  ck('the second turn carried the first one', (await p.evaluate(() => window.__asked[1].prompt)).includes('Person: How much can I spend before pay day?'));
  const figs = () => p.$$eval('[data-askfig]', e => e.map(x => [x.dataset.askfig, ...[...x.querySelectorAll('[data-amt]')].map(a => Number(a.dataset.amt))]));
  const pv = await K.preview(bk, K.check(REPLY['I spent 9,000 on dinner and want to put 5,000 toward the trip'], S.refs, { book: bk, today: DAY }).steps, { today: DAY, told: () => DAY + 'T09:00+09:00', newId: I.idMaker('e3askp', Math.random) });
  ck('before and after are the engine\'s for the book the changes would make', JSON.stringify(await figs()) === JSON.stringify(pv.rows.map(r => [r.key, r.before, r.after].filter(x => x != null))), JSON.stringify(await figs()) + ' vs ' + JSON.stringify(pv.rows));
  ck('Apply names how many', (await p.$eval('[data-ask="apply"]', e => e.textContent)) === 'Apply 2 changes');
  await p.click('[data-askstep="1"]'); await T.w(300);
  ck('unticking one redraws: no goal row, one change', !(await figs()).some(r => r[0] === 'goal:G1') && (await p.$eval('[data-ask="apply"]', e => e.textContent)) === 'Apply');
  await p.click('[data-askstep="1"]'); await T.w(300);
  ck('still nothing written before Apply', JSON.stringify(await saved(p)) === before);
  await p.click('[data-ask="apply"]'); await T.w(600);
  let kept = await saved(p);
  const dinner = kept.events.find(e => !e.gone && e.k === 'spend' && e.a === 9000);
  ck('Apply writes the spend through ACT3: typed, told, at, by, on Food with its note', dinner && dinner.line === bk.plan.budgets[0].id && dinner.note === 'dinner' && dinner.src.type === 'typed' && dinner.told && dinner.at && dinner.by, JSON.stringify(dinner));
  ck('and the set aside for the Trip', kept.events.some(e => !e.gone && e.k === 'move' && e.a === 5000 && e.place2 === bk.places[0].id));
  ck('the card says Applied, with Undo', !!(await p.$('[data-ask="applied"]')) && !!(await p.$('[data-ask="undo"]')));
  await p.click('#a3AskClose'); await T.w(300);
  const safe = await p.$eval('[data-fig="safe"] [data-amt]', e => Number(e.dataset.amt)).catch(() => null);
  ck('Home shows the engine\'s safe to spend for the saved book', safe === T.L.lookahead(kept, DAY).safeToSpend.headline, safe + ' vs ' + T.L.lookahead(kept, DAY).safeToSpend.headline);
  ck('the Undo bar is in the message band', /2 changes from Ask/.test(await p.$eval('#a3Msg', e => e.textContent)));
  await p.click('#a3AskGo'); await T.w(300);
  ck('the chat is kept while the page is open', (await p.$$eval('.a3-ask-me', e => e.map(x => x.textContent))).includes('How much can I spend before pay day?'));
  await p.click('#a3AskClose'); await T.w(200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('#a3Msg button')].find(x => x.textContent === 'Undo'); b.click(); }); await T.w(700);
  kept = await saved(p);
  ck('Undo takes both back', !kept.events.some(e => !e.gone && (e.a === 9000 || (e.k === 'move' && e.a === 5000))));
  ck('Home is back to the figure before', await p.$eval('[data-fig="safe"] [data-amt]', e => Number(e.dataset.amt)) === T.L.lookahead(bk, DAY).safeToSpend.headline);

  /* 4. a change the app does not do */
  await p.click('#a3AskGo'); await T.w(300);
  await ask(p, 'Delete my rent');
  ck('a change the app does not do is left out and said, with nothing to apply', /Left out/.test(await p.$eval('[data-ask="dropped"]', e => e.textContent)) && (await p.$$eval('[data-card="ask-change"]', c => !c[c.length - 1].querySelector('[data-ask="apply"]'))));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await T.w(200);
  ck('no sideways scroll at 320', await p.evaluate(() => document.documentElement.scrollWidth <= 320), await p.evaluate(() => document.documentElement.scrollWidth));
  await T.shot(p, 'ask_card');
  await b.close();

  /* 5. the relay */
  {
    const { b, p, errs } = await T.open();
    await p.evaluateOnNewDocument(() => { window.STMT3_RELAY = 'https://relay.example'; });
    await p.setRequestInterception(true);
    const sent = [];
    p.on('request', rq => {
      const u = rq.url();
      if (u === 'https://relay.example/api/health') return rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ai: true }) });
      if (u === 'https://relay.example/api/ai') {
        if (rq.method() === 'OPTIONS') return rq.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app' } });
        sent.push(JSON.parse(rq.postData()));
        return rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'money_answer', input: { answer: 'Rent is 72,000 on 27 Nov.', actions: [] } }] }) });
      }
      rq.continue();
    });
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
    await p.click('#a3AskGo'); await T.w(300);
    ck('relay: nothing sent on opening', sent.length === 0);
    await ask(p, 'What is due before next pay?'); await T.w(300);
    const s0 = sent[0] || {}, txt = ((s0.messages || [{}])[0].content || [{}])[0].text || '';
    ck('relay: one request with the answer\'s shape as its tool, the summary and the question', sent.length === 1 && s0.tools[0].name === 'money_answer' && s0.tools[0].input_schema.properties.actions && txt.includes('FIGURES\nToday is 25 Nov 2026') && txt.includes('What is due before next pay?'), JSON.stringify(s0).slice(0, 300));
    ck('relay: no record id in the request', !/k7m2qa-f3n8p1x6wd/.test(JSON.stringify(s0)));
    ck('relay: the answer reaches the page and the line names the page\'s own server', (await p.$$eval('.a3-ask-ai', e => e.map(x => x.textContent))).includes('Rent is 72,000 on 27 Nov.') && /this page's own server/.test(await p.$eval('#a3AskWhat', e => e.textContent)));
    ck('relay: no key kept on the device', (await p.evaluate(() => localStorage.length)) === 0);
    ck('no page errors (relay)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_ask');
})();
