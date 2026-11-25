#!/usr/bin/env node
/* The assistant joined to the app's base (AI_JOIN_FIXES item A; qc-foundation foundational 1 and 2 on lane/ai-merge).
   The real core, the real panel, E3, act3 and the store; only the model is made up (tests/chat_real.js).
   Mako's made-up shape, set up by chat on Tue 24 Nov 2026: Main bank 286,000, pay 240,000 on the 10th, Rent 72,000 on
   the 27th and the rest; safe to spend 124,400.
   1. A bill changed by chat, a reload, Undo on the kept card (M14). "Rent is 80,000 now": the next Rent is Fri 27 Nov,
      before the pay of 10 Dec, so safe to spend is 124,400 - 8,000 = 116,400. The page is reloaded. The card is still
      there with Undo; one tap and Rent is 72,000 again, safe to spend 124,400, and the card says Taken back.
   2. A job change by chat on Tue 5 Jan 2027 and the period on Sat 20 Mar (M31, M38). "My job ended, the new one pays
      300,000 on the 25th", after "my pay came in" on 10 Dec: the old pay ends (asked first: it takes something away), the new one is added. On 5 Jan the
      period that began with the pay of 10 Dec runs to the day before the first new pay: Mon 25 Jan is a weekday, so to
      24 Jan. The new pay is ticked by chat on 26 Jan and 25 Feb. On 20 Mar the period is the one the new pay started on Thu 25 Feb, to the day before Thu 25 Mar: 25 Feb to
      24 Mar. Not 10 Dec to 20 Mar. */
'use strict';
const T = require('./lib3.js'), { ck } = T, R = require('./chat_real.js');
const fs = require('fs'), os = require('os');
const period = p => p.evaluate(() => { const r = BurrowEngine.lookahead.lookahead(BurrowApp3.E3.book, BurrowApp3.E3.today(), { periods: true }); return r.period ? [r.period.start, r.period.end] : null; });
const rent = p => p.evaluate(() => { const s = BurrowApp3.E3.book.schedules.find(x => x.name === 'Rent' && !x.gone); return s.steps.slice(-1)[0].amount; });
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3aijoin-') });
  p.on('dialog', d => d.accept());
  const ai = await R.relay(p);
  try {
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(700);
    await R.setup(p, ai);
    let h = await R.home(p);
    ck('set up by chat: safe to spend 124,400, Main bank 286,000', h.safe === 124400 && h.bank === 286000, JSON.stringify(h) + ' ' + (await R.log(p)).slice(-400));

    /* 1. a bill changed by chat, a reload, Undo on the kept card */
    ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'change_bill', ref: R.ref(body, 'Rent'), amount: 80000 }] })]), R.say('Rent is 80,000 from the next one.'));
    await R.tell(p, 'Rent is 80,000 now');
    h = await R.home(p);
    ck('Rent 80,000 by chat: safe to spend 116,400 (124,400 - 8,000)', h.safe === 116400 && (await rent(p)) === 80000, JSON.stringify(h));
    await p.reload(); await T.w(900);
    const cc = '[data-card=chat-change][data-status=done]';
    ck('after a reload the card is kept, with Undo', !!(await p.$(cc + ' [data-chatundo]')));
    await p.$eval(cc + ' [data-chatundo]', e => e.click()); await R.idle(p); await T.w(400);
    h = await R.home(p);
    ck('Undo on the kept card after the reload: Rent 72,000 again, safe to spend 124,400', (await rent(p)) === 72000 && h.safe === 124400, JSON.stringify([await rent(p), h]));
    ck('the card says Taken back, and has no Undo left', /Taken back/.test(await p.$eval('[data-card=chat-change]', e => e.textContent)) && !(await p.$('[data-card=chat-change] [data-chatundo]')));
    await p.reload(); await T.w(900);
    ck('and after one more reload: still 72,000 and 124,400', (await rent(p)) === 72000 && (await R.home(p)).safe === 124400);

    /* 2. a job change by chat on 5 Jan, the period on 20 Mar */
    const landed = async (day, name, words) => {
      await p.goto(T.URL0 + '?today=' + day); await T.w(900);
      ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'landed', ref: R.ref(body, name) }] })]), R.say('Ticked.'));
      await R.tell(p, words);
      return (await p.$$eval('[data-card=chat-change]', e => e.map(x => x.dataset.status))).slice(-1)[0] === 'done';
    };
    ck('10 Dec: "my pay came in" ticks the pay', await landed('2026-12-10', 'Pay', 'my pay came in'), (await R.log(p)).slice(-300));
    await p.goto(T.URL0 + '?today=2027-01-05'); await T.w(900);
    const before = await period(p);
    ck('5 Jan, before the change: the period began with the pay of 10 Dec and runs to the day before the next (Sun 10 Jan moves to Fri 8 Jan)', JSON.stringify(before) === '["2026-12-10","2027-01-07"]', JSON.stringify(before));
    ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'end_bill', ref: R.ref(body, 'Pay') }, { do: 'add_pay', name: 'New job', amount: 300000, every: 'month', day: 25 }] })]), R.say('Done when you say so.'));
    await R.tell(p, 'my job ended, the new one pays 300,000 on the 25th');
    ck('ending a pay asks first', !!(await p.$('[data-card=chat-change][data-status=ask] [data-chatok]')));
    await p.$eval('[data-card=chat-change][data-status=ask] [data-chatok]', e => e.click()); await R.idle(p); await T.w(400);
    const st = await p.$$eval('[data-card=chat-change]', e => e.map(x => x.dataset.status));
    ck('the job change was made', st.slice(-1)[0] === 'done', JSON.stringify(st) + ' ' + (await R.log(p)).slice(-300));
    ck('5 Jan, after: this period runs to the day before the new pay, 10 Dec to 24 Jan', JSON.stringify(await period(p)) === '["2026-12-10","2027-01-24"]', JSON.stringify(await period(p)));
    ck('26 Jan: the new pay of 25 Jan came in', await landed('2027-01-26', 'New job', 'the new pay came in yesterday'), (await R.log(p)).slice(-300));
    ck('26 Jan: a new period began with the new pay, 25 Jan to 24 Feb', JSON.stringify(await period(p)) === '["2027-01-25","2027-02-24"]', JSON.stringify(await period(p)));
    ck('25 Feb: the pay came in', await landed('2027-02-25', 'New job', 'pay came in'), (await R.log(p)).slice(-300));
    await p.goto(T.URL0 + '?today=2027-03-20'); await T.w(900);
    const mar = await period(p);
    ck('20 Mar: the period follows the new pay, 25 Feb to 24 Mar (not 10 Dec to 20 Mar)', JSON.stringify(mar) === '["2027-02-25","2027-03-24"]', JSON.stringify(mar));
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the test ran to its end', false, e.stack); }
  await b.close();
  T.done('e3_aijoin');
})();
