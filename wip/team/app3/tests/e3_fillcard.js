#!/usr/bin/env node
/* The draft card and the fill card on the real page with the real core (AI_JOIN_FIXES C and D; qc-foundation 3 and 4,
   qc-assistant blocker 7). Only the model is made up (tests/chat_real.js). Phone, 390 wide, Tue 24 Nov 2026.
   1. The bank answer alone: the draft card says what is still needed and does not offer Fill in my Burrow (C).
   2. Mako's made-up shape filled by chat (safe to spend 201,400). The fill card has Undo. One tap: no book, one welcome
      with ONE chat box, the old sheet gone, the answers kept with Fill in my Burrow (D).
   3. Filled again, then one spend by chat (1,200 on lunch). The fill can no longer be taken back, so its card offers
      neither Undo nor Start over (Start over could never work: the store refuses once the hold is gone). It says how
      to change things instead. No question pops up, and the book stays: safe to spend 200,200. */
'use strict';
const T = require('./lib3.js'), { ck } = T, R = require('./chat_real.js');
const fs = require('fs'), os = require('os');
const seen = sel => p => p.$$eval(sel, e => e.filter(x => x.getClientRects().length > 0 && getComputedStyle(x).visibility !== 'hidden').length);
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3fillcard-') });
  let asked = 0; p.on('dialog', d => { asked++; d.accept(); });
  const ai = await R.relay(p);
  try {
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(700);
    /* 1 */
    ai.push(R.say('', [R.call('draft_set', { section: 'banks', value: R.MAKO.banks })]), R.say('Which country do you bank in?'));
    await R.tell(p, 'Main bank has 286,000');
    const dc = await p.$eval('[data-card=chat-draft]', e => e.textContent.replace(/\s+/g, ' '));
    ck('the bank alone: the draft card does not offer Fill in my Burrow', !(await p.$('[data-chatfill]')) && !/Fill in my Burrow/.test(dc), dc.slice(-200));
    ck('it says what is still needed: the country, the currency, the pay, everyday money, the minimum', /Still needed:.*country.*currency.*paid.*everyday.*Keep at least/.test(dc), dc.slice(-400));
    /* 2 */
    await R.setup(p, ai);
    ck('filled by chat: safe to spend 201,400', (await R.home(p)).safe === 201400, (await R.log(p)).slice(-300));
    await p.$eval('#a3Chat #a3ChatIn', e => e.focus()); await T.w(200);
    ck('the fill card has Undo', (await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.textContent)) === 'Undo');
    await p.$eval('[data-card=chat-fill] [data-chatundo]', e => e.click()); await R.idle(p); await T.w(500);
    ck('Undo: no book on this device', await p.evaluate(() => BurrowApp3.E3.mode === 'none' && !BurrowApp3.E3.book));
    ck('one welcome', (await seen('.a3-welcome')(p)) === 1 && /Welcome to the burrow/.test(await p.$eval('#a3Home', e => e.textContent)));
    ck('one chat box, in the welcome', (await p.$$('#a3ChatIn')).length === 1 && !!(await p.$('#a3Home #a3ChatIn')), String((await p.$$('#a3ChatIn')).length));
    ck('the old sheet is gone', await p.$eval('#a3Chat', e => e.hidden && !e.innerHTML.trim() && !e.hasAttribute('data-open')) && !(await p.evaluate(() => document.body.classList.contains('a3-has-chat'))));
    ck('the answers are kept, with Fill in my Burrow', (await seen('#a3Home [data-chatfill]')(p)) === 1);
    /* 3 */
    await p.$eval('#a3Home [data-chatfill]', e => e.click()); await R.idle(p); await T.w(500);
    ai.push(R.say('', [R.call('change', { steps: [{ do: 'log_spend', amount: 1200, note: 'lunch' }] })]), R.say('Logged.'));
    await R.tell(p, 'I spent 1,200 on lunch');
    ck('a spend by chat: safe to spend 200,200', (await R.home(p)).safe === 200200);
    const fc = await p.$$eval('[data-card=chat-fill][data-status=done]', e => e.map(x => x.textContent.replace(/\s+/g, ' ')));
    ck('the fill card offers neither Undo nor Start over now', fc.length === 1 && !(await p.$('[data-card=chat-fill][data-status=done] button')) && !/Start over/.test(fc[0]), JSON.stringify(fc));
    ck('it says how to change things instead', /To change something, tell me or change it on its screen/.test(fc[0] || ''), JSON.stringify(fc));
    await p.reload(); await T.w(900);
    ck('after a reload: the same card, no button, the book kept', !(await p.$('[data-card=chat-fill][data-status=done] button')) && (await R.home(p)).safe === 200200);
    ck('no question popped up anywhere', asked === 0, String(asked));
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the test ran to its end', false, e.stack); }
  await b.close();
  T.done('e3_fillcard');
})();
