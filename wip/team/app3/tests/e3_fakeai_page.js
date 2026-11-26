#!/usr/bin/env node
/* The reviewers' way to the assistant (tests/fake_ai_page.js): a plain copy of the built page, opened with Playwright the
   way wip/team/qc/qc3.js opens it, then openWithFakeAI. Made-up figures only.
   1. Before: the panel says the assistant is off. After: it is on, and any words get the made-up echo.
   2. MAKO_SETUP typed line by line fills the book: safe to spend 124,400, Main bank 286,000.
   3. With a code word: the word box shows first; the right word is sent in invite. No page errors. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const path = require('path'), fs = require('fs'), os = require('os');
const { chromium } = require(process.env.QC_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const { openWithFakeAI, tell, MAKO_SETUP } = require('./fake_ai_page.js');
const PAGE = path.join(__dirname, '../index.html');
async function open(today) {   // as qc3.js open(): one device, empty storage, phone size
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a3fakeai-'));
  const ctx = await chromium.launchPersistentContext(dir, { executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const p = ctx.pages()[0] || await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('PAGE ERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|status of 401/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + PAGE + '?today=' + today); await p.waitForTimeout(400);
  return { p, errs, close: async () => { await ctx.close(); fs.rmSync(dir, { recursive: true, force: true }); } };
}
const log = p => p.$eval('#a3ChatLog', e => e.innerText).catch(() => '');
const fig = (p, sel) => p.$eval(sel, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
(async () => {
  const all = [];
  {
    const d = await open('2026-11-24');
    await tell(d.p, 'hello');
    ck('a plain copy: the assistant is off', /assistant is off/i.test(await d.p.evaluate(() => document.body.innerText)));
    const ai = await openWithFakeAI(d.p);
    await tell(d.p, 'what is safe to spend?');
    ck('with openWithFakeAI: the made-up echo answers, one request sent', /\(made-up AI\) I heard: what is safe to spend\?/.test(await log(d.p)) && ai.bodies.length === 1, await log(d.p));
    all.push(...d.errs); await d.close();
  }
  {
    const d = await open('2026-11-24');
    const ai = await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps });
    for (const line of MAKO_SETUP.lines) await tell(d.p, line);
    await d.p.waitForTimeout(500);
    const safe = await fig(d.p, '#a3Home [data-fig=safe]'), bank = await fig(d.p, '#a3Home [data-card=bank] [data-fig=bank]');
    ck('MAKO_SETUP by chat: safe to spend 124,400, Main bank 286,000, every reply used', safe === MAKO_SETUP.safe && bank === MAKO_SETUP.bank && ai.left() === 0, JSON.stringify({ safe, bank, left: ai.left() }));
    /* [qc-controls run 1 blocker 2, coordinator 16's ruling B] the Filled in card says where loans, goals and budget lines go */
    const later = await d.p.$eval('[data-card=chat-fill] [data-chat=later]', e => e.textContent).catch(() => '');
    ck('the Filled in card says loans, goals and budget lines are added on Plan, with the buttons', /Loans, goals and budget lines/.test(later) && /Plan/.test(later) && /Add a loan/.test(later) && /Add a goal/.test(later) && /Add a line/.test(later), later);
    all.push(...d.errs); await d.close();
  }
  {
    /* M6 (24 Nov 12:20): an amount the person never typed asks first. "I had lunch", and the AI logs 1,200 */
    const d = await open('2026-11-24');
    /* [AI_JOIN_FIXES H6] he has cards, so he names the account; the amount is still the AI's own */
    const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
    await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps.concat([body => ({ calls: [{ name: 'change', input: { steps: [{ do: 'log_spend', amount: 1200, note: 'lunch', account: refIn(body, 'Main bank') }] } }] }), { words: 'Shall I log 1,200 for lunch?' }]) });
    for (const line of MAKO_SETUP.lines) await tell(d.p, line);
    await tell(d.p, 'I had lunch, paid from Main bank');
    const card = '[data-card=chat-change][data-status=ask]';
    const st = await d.p.$eval(card + ' [data-chat=status]', e => ({ ask: e.dataset.ask, text: e.textContent })).catch(() => null);
    ck('an amount not typed: the card asks first, in its own words, with Do it and Not now, nothing written yet', !!st && st.ask === 'guess' && /You didn't type this amount/.test(st.text) && !!(await d.p.$(card + ' [data-chatok]')) && !!(await d.p.$(card + ' [data-chatnot]')) && (await fig(d.p, '#a3Home [data-fig=safe]')) === 124400, JSON.stringify(st));
    await d.p.$eval(card + ' [data-chatok]', e => e.click()); await d.p.waitForTimeout(600);
    ck('Do it writes it: safe to spend 123,200', (await fig(d.p, '#a3Home [data-fig=safe]')) === 123200);
    all.push(...d.errs); await d.close();
  }
  {
    /* [qc-assistant blocker 2; M36, M51] "why is it that much?": every sum Home writes under safe to spend is in what the
       assistant is sent, word for word (the engine's own parts, one source) */
    const d = await open('2026-11-24');
    const ai = await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps.concat([{ calls: [{ name: 'change', input: { steps: [{ do: 'set_free', amount: 30000 }] } }] }, { words: 'Set.' }]) });
    for (const line of MAKO_SETUP.lines) await tell(d.p, line);
    await tell(d.p, 'set Free to spend to 30,000');
    await d.p.waitForTimeout(500);
    const sums = await d.p.$$eval('#a3Home [data-fig=why], #a3Home [data-fig=cap], #a3Home [data-fig=shortwhy]', els => els.map(e => e.dataset.fig + ': ' + e.textContent.trim()));
    await tell(d.p, 'why is it that much?');
    const last = ai.bodies[ai.bodies.length - 1], sent = last.messages.map(m => m.content.map(c => c.text || '').join('\n')).join('\n');
    const missing = sums.filter(x => !sent.includes(x.replace(/^\w+: /, '')));
    ck('Home shows the held-back sum (Free to spend caps safe to spend: 16,000 of the 30,000 counts for the days left)', (await fig(d.p, '#a3Home [data-fig=safe]')) === 16000 && sums.some(x => /^cap: .*held back: Free to spend has only ¥16,000 left this period\) = ¥16,000$/.test(x)), JSON.stringify(sums));
    ck('every sum under safe to spend on Home is sent to the assistant word for word', sums.length >= 2 && !missing.length, 'not sent: ' + JSON.stringify(missing));
    all.push(...d.errs); await d.close();
  }
  {
    /* [qc-assistant blocker 3; M17] the open sheet's own name is sent with each message, and every sheet Plan and
       Receipts can open has its row in the one table */
    const d = await open('2026-11-24');
    const ai = await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps });
    for (const line of MAKO_SETUP.lines) await tell(d.p, line);
    const screenLine = () => (ai.bodies[ai.bodies.length - 1].messages.map(m => m.content.map(c => c.text || '').join('\n')).join('\n').split('\n').filter(l => /^SCREEN: /.test(l)).pop() || '');
    const rows = await d.p.evaluate(() => BurrowApp3.chat.CHAT3C.SCREENS);
    const shut = async () => { if (await d.p.$('#a3Chat[data-open] #a3ChatClose')) await d.p.$eval('#a3ChatClose', e => e.click()); await d.p.waitForTimeout(150); };
    const got = [];
    await shut(); await d.p.$eval('.a3-tabs [data-tab=plan]', e => e.click()); await d.p.waitForTimeout(300);
    for (const [sel, key] of [['#plAddCard', 'addCard'], ['#plAddLoan', 'addLoan'], ['#plAddBill', 'addBill'], ['#plAddGoal', 'addGoal'], ['#plAddLine', 'addLine'], ['#plSetFree', 'free'], ['[data-bill]', 'bill'], ['[data-pay]', 'pay'], ['[data-owed]', 'card'], ['#plAddAcct', 'addAccount'], ['[data-acct]', 'account']]) {
      await shut(); await d.p.$eval('.a3-tabs [data-tab=home]', e => e.click()); await d.p.$eval('.a3-tabs [data-tab=plan]', e => e.click()); await d.p.waitForTimeout(250);
      await d.p.$eval('#a3Plan ' + sel, e => e.click()); await d.p.waitForTimeout(250);
      const title = await d.p.$eval('#a3Plan [data-card=plan-form] h2', e => e.textContent);
      await tell(d.p, 'what does this screen do?');
      const line = screenLine();
      got.push([key, line.includes('"' + title + '"') && line.includes(rows[key].does)]);
      if (!got[got.length - 1][1]) console.log('  ' + key + ': ' + line);
    }
    ck('on each of Plan\'s sheets the assistant is told the sheet\'s own name and what it is for (11 sheets)', got.length === 11 && got.every(x => x[1]), JSON.stringify(got.filter(x => !x[1])));
    await shut(); await d.p.$eval('.a3-tabs [data-tab=home]', e => e.click()); await d.p.waitForTimeout(250);
    await tell(d.p, 'what does this screen do?');
    ck('on Home, with no sheet open, it is told Home and what Home is for', screenLine() === 'SCREEN: the person has Home open. ' + rows.home.does, screenLine());
    all.push(...d.errs); await d.close();
  }
  {
    /* two steps asked, one left out: the card says which was not done */
    const d = await open('2026-11-24');
    await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps.concat([{ calls: [{ name: 'change', input: { steps: [{ do: 'add_goal', name: 'Trip', target: 100000 }, { do: 'set_aside', goal: 'G1', amount: 5000 }] } }] }, { words: 'Added the goal.' }]) });
    for (const line of MAKO_SETUP.lines) await tell(d.p, line);
    await tell(d.p, 'add a goal called Trip for 100,000 and set aside 5,000 for it');
    const left = await d.p.$eval('[data-card=chat-change][data-status=done] [data-chat=left]', e => e.textContent).catch(() => null);
    ck('two steps asked, one left out: the card says "Not done: money set aside for a goal"', left === 'Not done: money set aside for a goal. Say that part again on its own', String(left));
    all.push(...d.errs); await d.close();
  }
  {
    /* [M30, M77, M90] lunch 900 on Card A with no Free to spend set: the card shows Card A's row and safe to spend drops at once */
    const d = await open('2026-11-24');
    const refIn = (body, name) => { const m = new RegExp('(?:^|\\n)([A-Z]\\d+) \\| ' + name + ' \\|').exec(JSON.stringify(body.messages).replace(/\\n/g, '\n')); return m ? m[1] : null; };
    await openWithFakeAI(d.p, { steps: MAKO_SETUP.steps.concat([body => ({ calls: [{ name: 'change', input: { steps: [{ do: 'log_spend', amount: 900, account: refIn(body, 'Card A') }] } }] }), { words: 'Logged.' }]) });
    for (const line of MAKO_SETUP.lines) await tell(d.p, line);
    await tell(d.p, 'lunch 900 on Card A');
    const card = '[data-card=chat-change][data-status=done]';
    const words = await d.p.$eval(card, e => e.innerText).catch(() => '');
    const note = await d.p.$eval(card + ' [data-chat=note]', e => e.textContent).catch(() => null);
    /* [M90, R1] no play amount: 124,400 - 900 = 123,500 at once, so no line is needed */
    ck('a card spend with no play amount comes off at once, 124,400 to 123,500: the card shows Card A still owed 54,000 to 54,900, no note', note === null && /Safe to spend\s*¥124,400\s*¥123,500/.test(words) && /Card A, still owed\s*¥54,000\s*¥54,900/.test(words) && (await fig(d.p, '#a3Home [data-fig=safe]')) === 123500, JSON.stringify([note, words]));
    all.push(...d.errs); await d.close();
  }
  {
    const d = await open('2026-11-24');
    const ai = await openWithFakeAI(d.p, { invite: 'acorn' });
    await d.p.fill('#a3ChatIn', 'hi'); await d.p.click('#a3ChatSend'); await d.p.waitForTimeout(400);
    ck('with a code word: its box shows first, nothing sent', !!(await d.p.$('#a3ChatWord #a3WordIn')) && ai.bodies.length === 0);
    await d.p.fill('#a3WordIn', 'acorn'); await d.p.click('#a3WordKeep');
    await tell(d.p, 'hi');
    ck('the word is sent in invite and answered', ai.bodies.length === 1 && ai.bodies[0].invite === 'acorn' && /I heard: hi/.test(await log(d.p)), await log(d.p));
    all.push(...d.errs); await d.close();
  }
  ck('no page errors', !all.length, all.join(' | '));
  T.done('e3_fakeai_page');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
