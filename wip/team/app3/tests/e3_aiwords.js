#!/usr/bin/env node
/* What the assistant is told, seen on the real page with the real core (AI_JOIN_FIXES H5 and H6). Only the model is
   made up (tests/chat_real.js: the fake model behind a made-up relay). Phone, 390 wide, Tue 24 Nov 2026, Mako's
   made-up shape set up by chat (safe to spend 124,400, Main bank 286,000, Card A and Card B).
   H5. "My bank shows 3,000,000" (an extra zero): the card asks first, with the gap in words, and nothing changes until
       Do it. Home stays at 124,400 and 286,000. Do it: Main bank 3,000,000. Undo: 286,000 again.
   H6. "I bought lunch, 900" with no account named, while cards exist: nothing is logged, the AI is told to ask "card or
       bank?" once, naming them. "Card A": the spend goes on Card A. "Coffee 400" next: Card A again, without asking,
       because the answer is kept for the chat. */
'use strict';
const T = require('./lib3.js'), { ck } = T, R = require('./chat_real.js');
const fs = require('fs'), os = require('os');
const cardOf = p => p.evaluate(() => { const c = [...document.querySelectorAll('[data-card=chat-change]')].pop(); return c ? { status: c.dataset.status, text: c.textContent.replace(/\s+/g, ' '), ask: (c.querySelector('[data-ask]') || {}).dataset ? c.querySelector('[data-ask]').dataset.ask : null } : null; });
const owed = (p, name) => p.evaluate(n => { const { E3 } = BurrowApp3, a = E3.book.accounts.find(x => x.name === n); return BurrowEngine.lookahead.lookahead(E3.book, E3.today()).cards[a.id].owedNow; }, name);
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3aiwords-') });
  p.on('dialog', d => d.accept());
  const ai = await R.relay(p);
  try {
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(700);
    await R.setup(p, ai);
    let h = await R.home(p);
    ck('set up by chat: 124,400 and 286,000', h.safe === 124400 && h.bank === 286000, JSON.stringify(h));
    /* H5 */
    ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'bank_figure', account: R.ref(body, 'Main bank'), amount: 3000000 }] })]), R.say('That is a lot more than I expected. Is it right?'));
    await R.tell(p, 'my bank shows 3,000,000');
    let c = await cardOf(p);
    ck('H5: the card asks first, the gap in words', c && c.status === 'ask' && c.ask === 'gap' && /The app expected ¥286,000: ¥2,714,000 more than it had/.test(c.text) && /far from what the app expected/.test(c.text), JSON.stringify(c));
    h = await R.home(p);
    ck('H5: nothing changed before the OK: 124,400 and 286,000', h.safe === 124400 && h.bank === 286000, JSON.stringify(h));
    await p.evaluate(() => [...document.querySelectorAll('[data-chatok]')].pop().click()); await R.idle(p); await T.w(400);
    h = await R.home(p);
    ck('H5: Do it: Main bank 3,000,000', h.bank === 3000000, JSON.stringify(h));
    await p.evaluate(() => [...document.querySelectorAll('[data-card=chat-change][data-status=done] [data-chatundo]')].pop().click()); await R.idle(p); await T.w(400);
    h = await R.home(p);
    ck('H5: Undo: 124,400 and 286,000 again', h.safe === 124400 && h.bank === 286000, JSON.stringify(h));
    /* H6 */
    let res = '';
    ai.push(R.say('', [R.call('change', { steps: [{ do: 'log_spend', amount: 900, note: 'lunch' }] })]), body => { res = (R.results(body)[0] || {}).text || ''; return R.say('Card or bank? Card A, Card B or Main bank'); });
    await R.tell(p, 'I bought lunch, 900');
    ck('H6: no account named while cards exist: nothing is logged, the AI is told to ask card or bank, naming them', /^Nothing changed: /.test(res) && /Card A, Card B or Main bank/.test(res), res);
    h = await R.home(p);
    ck('H6: Home unchanged', h.safe === 124400 && h.bank === 286000, JSON.stringify(h));
    ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'log_spend', amount: 900, note: 'lunch', account: R.ref(body, 'Card A') }] })]), R.say('Logged on Card A.'));
    await R.tell(p, 'Card A');
    c = await cardOf(p);
    ck('H6: "Card A": the lunch goes on Card A', c && c.status === 'done' && /Log ¥900 on Free to spend from Card A/.test(c.text), JSON.stringify(c));
    ck('H6: Card A owes 54,900', (await owed(p, 'Card A')) === 54900, String(await owed(p, 'Card A')));
    ai.push(R.say('', [R.call('change', { steps: [{ do: 'log_spend', amount: 400, note: 'coffee' }] })]), R.say('Logged.'));
    await R.tell(p, 'coffee 400');
    c = await cardOf(p);
    ck('H6: the next spend with no account goes on Card A without asking again', c && c.status === 'done' && /Log ¥400 on Free to spend from Card A/.test(c.text), JSON.stringify(c));
    ck('H6: Card A owes 55,300', (await owed(p, 'Card A')) === 55300, String(await owed(p, 'Card A')));
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the test ran to its end', false, e.stack); }
  await b.close();
  T.done('e3_aiwords');
})();
