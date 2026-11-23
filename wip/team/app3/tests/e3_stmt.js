#!/usr/bin/env node
/* Add statements through the page, made-up Mako book, shown as on 16 Dec 2026. No real AI is called: the AI's answers
   are made-up replies given to the page by a stand-in for the viewer's Claude (window.claude) and, for the relay, by
   answering the page's own requests to a made-up relay address. The card payment amounts are the ones the book
   expects (from the engine), so the test follows the made-up book when it changes.
   1. The privacy line says what really happens (E7), and nothing is sent before Read.
   2. Read with the AI (two CSV files: the bank, Card A); the review shows what was read, the card statement, the shops;
      a tap on a shop shows its lines and what each meets; a category change is kept.
   3. Add: Home's figures are the engine's for the same records written in node; Undo is offered.
   4. The same files again: nothing new to add (duplicates once).
   5. Any AI: the request carries the answer's shape; a pasted answer is checked and reviewed.
   6. The relay: the request has the rows shape as a tool and the file's text; no key is kept on the device.
   Screenshots: app3/shots/stmt_*.png */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const T = require('./lib3.js'), { ck } = T;
const old = new Function(fs.readFileSync(path.join(__dirname, '../../stmt.js'), 'utf8') + '\nreturn { stmtCleanRows, stmtNorm, stmtNumbers, STMT_CATS };')();
const R = require('../src/stmt3_read.js'); R.use(old);
const P = require('../src/stmt3_plan.js'); P.use(old);
const DAY = '2026-12-16';
const bk = T.book();
const acc = n => bk.accounts.find(a => a.name === n).id, BANK = acc('Main bank'), CA = acc('Card A'), CB = acc('Card B');
const due = T.L.lookahead(bk, DAY).checkIn.toConfirm, payOf = id => (due.find(o => o.item.startsWith(id + '@')) || {}).amount;
/* the made-up replies, one per file */
const REPLY = {
  'bank.csv': { account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-21', to: '2026-12-15' }, closing_balance: null, statement: null, rows: [
    { date: '2026-11-26', text: 'DENKI POWER CO', amount: 7400, dir: 'out', cat: 'util' },
    { date: '2026-11-27', text: 'RENT HOUSE', amount: 72000, dir: 'out', cat: 'rent' },
    { date: '2026-11-27', text: 'NET HIKARI', amount: 5200, dir: 'out', cat: 'net' },
    { date: '2026-12-01', text: 'SUPER MARKET', amount: 2480, dir: 'out', cat: 'food' },
    { date: '2026-12-10', text: 'SALARY MAIN JOB', amount: 180000, dir: 'in', cat: 'pay' },
    { date: '2026-12-10', text: 'CARD A PAYMENT', amount: payOf(CA), dir: 'out', cat: 'card_payment' },
    { date: '2026-12-11', text: 'CARD B PAYMENT', amount: payOf(CB), dir: 'out', cat: 'card_payment' }] },
  'cardA.csv': { account: 'Card A', kind: 'card', currency: 'JPY', period: { from: '2026-11-16', to: '2026-12-15' }, closing_balance: null,
    statement: { close: '2026-12-15', due: '2027-01-12', total: 2930 }, rows: [
    { date: '2026-12-03', posted: '2026-12-05', text: 'BOOKS', amount: 2930, dir: 'out', cat: 'play' },
    { date: '2026-12-10', text: 'PAYMENT THANK YOU', amount: payOf(CA), dir: 'in', cat: 'card_payment' }] }
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e3stmt-'));
for (const f of Object.keys(REPLY)) fs.writeFileSync(path.join(dir, f), 'made-up file for the test: ' + f + '\n');
async function stub(p) {
  await p.evaluateOnNewDocument(replies => {
    window.__asked = [];
    const fn = async () => ({ text: '' });
    fn.form = async (prompt, opts) => { window.__asked.push({ prompt, schema: opts && opts.schema }); const m = /THE FILE \(([^)]+)\)/.exec(prompt); return JSON.parse(JSON.stringify(replies[m ? m[1] : ''] || { kind: 'bank', rows: [] })); };
    window.claude = { use: async () => fn };
  }, REPLY);
}
async function pick(p) {
  await p.click('#a3StmtGo'); await T.w(200);
  (await p.$(`[data-files="${BANK}"]`)).uploadFile(path.join(dir, 'bank.csv'));
  (await p.$(`[data-files="${CA}"]`)).uploadFile(path.join(dir, 'cardA.csv'));
  await T.w(300);
}
(async () => {
  /* the same records in node: what Home must show after Add */
  const reads = [R.cleanRead(REPLY['bank.csv'], 'bank.csv', DAY), R.cleanRead(REPLY['cardA.csv'], 'cardA.csv', DAY)];
  const plan = P.plan(bk, reads, { today: DAY, assign: [BANK, CA], cats: {} });
  const out = P.records(bk, plan, { told: DAY + 'T12:00+09:00' });
  const after = JSON.parse(JSON.stringify(bk)); after.events = after.events.concat(out.events); after.checkins = (after.checkins || []).concat(out.checkins);
  const want = T.L.lookahead(after, DAY);
  ck('the made-up reply pays what the book expects of each card', payOf(CA) > 0 && payOf(CB) > 0, JSON.stringify(due));

  const { b, p, errs, requests } = await T.open();
  await stub(p);
  await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
  ck('Home shows Add statements', !(await p.$eval('#a3StmtBar', e => e.hidden)));
  await pick(p);
  const priv = await p.$eval('[data-privacy=ai]', e => e.textContent);
  ck('[E7] the privacy line says the whole file goes to the AI, names Anthropic and when it is sent', /sends the whole file to the AI/.test(priv) && /Anthropic/.test(priv) && /Nothing is sent until you tap Read/.test(priv), priv);
  ck('no false line that statements stay on the device', !/stay(s)? (on|in) (this|your) (device|phone)|never leave/i.test(await p.$eval('#a3Stmt', e => e.textContent)));
  ck('nothing asked of the AI before Read', (await p.evaluate(() => window.__asked.length)) === 0);
  await T.shot(p, 'stmt_pick');
  await p.click('#a3StmtRead'); await T.w(800);
  const asked = await p.evaluate(() => window.__asked);
  ck('one job per file, with the rows shape and the Japanese guide', asked.length === 2 && asked.every(a => a.schema && a.schema.properties.rows && /令和8 = 2026/.test(a.prompt)), asked.length);
  ck('the review: every line read', /9 lines/.test(await p.$eval('#a3Stmt h2', e => e.textContent)), await p.$eval('#a3Stmt h2', e => e.textContent));
  const sum = await p.$eval('[data-fig=stmtsum]', e => e.textContent);
  ck('the review says what the lines are', /expected/.test(sum) && /read twice/.test(sum), sum);
  ck('the card statement is shown with its amount', (await p.$eval('[data-stmt] [data-amt]', e => +e.dataset.amt)) === 2930);
  const rent = R.key('RENT HOUSE');
  ck('shops start closed', (await p.$$eval('[data-rowsof]', us => us.filter(u => getComputedStyle(u).display !== 'none').length)) === 0);
  ck('the Add statements button is not shown over the sheet', await p.$eval('#a3StmtBar', e => getComputedStyle(e).display === 'none'));
  await p.click(`[data-mx="${rent}"]`); await T.w(100);
  const rentRow = await p.$eval(`[data-rowsof="${rent}"]`, e => ({ hidden: e.hidden, shown: getComputedStyle(e).display !== 'none', text: e.textContent }));
  ck('a tap on a shop shows its lines and what each meets', !rentRow.hidden && rentRow.shown && /Rent due 27 Nov/.test(rentRow.text), JSON.stringify(rentRow));
  await p.select(`[data-cat="${R.key('BOOKS')}"]`, 'other'); await T.w(200);
  ck('a category change is kept and the open shop stays open', (await p.$eval(`[data-cat="${R.key('BOOKS')}"]`, e => e.value)) === 'other' && !(await p.$eval(`[data-rowsof="${rent}"]`, e => e.hidden)));
  const addTxt = await p.$eval('#a3StmtAdd', e => e.textContent);
  ck('Add counts the lines to add', addTxt === 'Add 9 lines', addTxt);
  await T.shot(p, 'stmt_review');
  await p.click('#a3StmtAdd'); await T.w(600);
  ck('the sheet closed and Home is back', await p.$eval('#a3Stmt', e => e.hidden) && !(await p.$eval('#a3Home', e => e.hidden)));
  const f = await T.figs(p), one = k => f.filter(x => x.fig === k)[0];
  ck('safe to spend is the engine\'s for the same records', one('safe') && one('safe').amt === want.safeToSpend.headline, (one('safe') || {}).amt + ' vs ' + want.safeToSpend.headline);
  const owed = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-cardid]')].map(e => [e.dataset.cardid, Number(e.querySelector('[data-fig=owed] [data-amt]').dataset.amt)])));
  ck('each card owes what the engine says', owed[CA] === want.cards[CA].owedNow && owed[CB] === want.cards[CB].owedNow, JSON.stringify(owed) + ' vs ' + want.cards[CA].owedNow + ',' + want.cards[CB].owedNow);
  ck('rent, power and internet are no longer "not seen yet"', (await p.$$('[data-card=notseen] li')).length === ((want.notSeenYet || {}).items || []).length);
  const msgs = await p.$eval('#a3Msg', e => e.textContent);
  ck('Undo is offered', /Added 8 lines from statements/.test(msgs) && /Undo/.test(msgs), msgs);
  await T.shot(p, 'stmt_home_after');
  /* the same files again */
  await pick(p); await p.click('#a3StmtRead'); await T.w(800);
  ck('the same files again: nothing new to add', (await p.$eval('#a3StmtAdd', e => e.disabled && e.textContent)) === 'Nothing new to add');
  await p.click('#a3StmtBack'); await T.w(150);
  /* any AI */
  await p.click('#a3StmtAny summary'); await T.w(100);
  const ask = await p.$eval('#a3StmtAsk', e => e.value);
  ck('the any-AI request carries the answer\'s shape', ask.indexOf(R.PASTE_FORMAT) > 0);
  ck('[E7] the any-AI line says the person sends the files themselves', /send the files to an AI of your choosing yourself/.test(await p.$eval('[data-privacy=any]', e => e.textContent)));
  await p.type('#a3StmtPaste', 'not an answer'); await p.click('#a3StmtCheck'); await T.w(100);
  ck('a bad paste says so in plain words', /Copy the whole reply/.test(await p.$eval('#a3StmtPasteErr', e => e.textContent)));
  await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify({ statements: [{ account: 'Card B', kind: 'card', rows: [{ date: '2026-12-12', text: 'TRAIN', amount: 640, dir: 'out', cat: 'gas' }] }] }));
  await p.click('#a3StmtCheck'); await T.w(300);
  ck('a good paste goes to the review, on the account it names', /1 line/.test(await p.$eval('#a3Stmt h2', e => e.textContent)) && (await p.$eval('[data-readacct]', e => e.value)) === CB);
  await T.shot(p, 'stmt_paste_review');
  ck('no outside requests on the Claude route', requests.length === 0, requests.join(' '));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();

  /* the relay */
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
        const body = JSON.parse(rq.postData()); sent.push(body);
        const m = /THE FILE \(([^)]+)\)/.exec(body.messages[0].content[0].text);
        return rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'statement_rows', input: REPLY[m[1]] }] }) });
      }
      rq.continue();
    });
    await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
    await pick(p); await p.click('#a3StmtRead'); await T.w(900);
    ck('the relay got one request per file, the rows shape as its tool, the file\'s text in the words', sent.length === 2 && sent.every(s => s.tools[0].name === 'statement_rows' && s.tools[0].input_schema.properties.rows && /made-up file for the test/.test(s.messages[0].content[0].text)), JSON.stringify(sent.map(s => s.tools && s.tools[0].name)));
    ck('the relay\'s answer reaches the review', /9 lines/.test(await p.$eval('#a3Stmt h2', e => e.textContent)));
    ck('no key kept on the device (one anonymous id per open, nothing in localStorage)', (await p.evaluate(() => localStorage.length)) === 0 && sent[0].anon === sent[1].anon);
    ck('no page errors (relay)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  fs.rmSync(dir, { recursive: true, force: true });
  T.done('e3_stmt');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
