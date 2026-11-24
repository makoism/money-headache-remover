#!/usr/bin/env node
/* The reviewers' way to the assistant (tests/fake_ai_page.js): a plain copy of the built page, opened with Playwright the
   way wip/team/qc/qc3.js opens it, then openWithFakeAI. Made-up figures only.
   1. Before: the panel says the assistant is off. After: it is on, and any words get the made-up echo.
   2. MAKO_SETUP typed line by line fills the book: safe to spend 201,400, Main bank 286,000.
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
    ck('MAKO_SETUP by chat: safe to spend 201,400, Main bank 286,000, every reply used', safe === MAKO_SETUP.safe && bank === MAKO_SETUP.bank && ai.left() === 0, JSON.stringify({ safe, bank, left: ai.left() }));
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
