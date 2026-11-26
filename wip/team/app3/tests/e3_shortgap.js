#!/usr/bin/env node
/* A second bank that will be short, on the real page (SHORTGAP, coordinator 16 and 18; foundation_review/SHORTGAP_PLAN.md;
   MAKO_SAYS M7, M12, M23, M36, M45, M91). The repro walk of the beta trace (LANE J), with the real core and panel and a
   made-up model (tests/chat_real.js). Made-up yen.
   Tue 24 Nov, set up by chat: Main bank 286,000 and Beta Bank 32,000; Card A (54,000, paid 10 Dec) from Beta.
   Tue 1 Dec: Power, Rent and Internet of late Nov came out (Main bank 201,400). Beta goes 22,000 under on 10 Dec, so Home
   says to move 22,000 from Main bank to Beta Bank by 9 Dec; safe to spend 179,400. Rent to Beta by chat, then Power:
   safe to spend stays 179,400 (it said 107,400 and 100,000 before) and the line adds 72,000, then 79,400, by 27 Dec.
   Later hides the line until the next day. Sat 5 Dec: Done records the 22,000 as money moved, with Undo: Main bank
   179,400, the line says 79,400 by 27 Dec, safe to spend still 179,400 (never counted twice). Undo puts it back. */
'use strict';
const T = require('./lib3.js'), { ck } = T, R = require('./chat_real.js');
const fs = require('fs'), os = require('os');
const line = p => p.$eval('#a3Home [data-fig=move-help]', e => e.textContent.trim()).catch(() => '');
const homeText = p => p.$eval('#a3Home', e => e.innerText).catch(() => '');
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3shortgap-') });
  p.on('dialog', d => d.accept());
  const ai = await R.relay(p);
  try {
    await p.goto(T.URL0 + '?today=2026-11-24'); await T.w(700);
    const cards = R.MAKO.cards.map(c => (c.name === 'Card A' ? Object.assign({}, c, { payFrom: 'Beta Bank' }) : c));
    await R.setup(p, ai, { banks: [{ name: 'Main bank', amount: 286000 }, { name: 'Beta Bank', amount: 32000 }], cards });
    await p.goto(T.URL0 + '?today=2026-12-01'); await T.w(900);
    for (const n of ['Power', 'Rent', 'Internet']) { ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'landed', ref: R.ref(body, n) }] })]), R.say('Ticked.')); await R.tell(p, n + ' came out'); }
    let h = await R.home(p);
    ck('1 Dec: Main bank 201,400, safe to spend 179,400', h.bank === 201400 && h.safe === 179400, JSON.stringify(h));
    let l = await line(p), all = await homeText(p);
    ck('the move line: 22,000 from Main bank to Beta Bank by 9 Dec', l === 'Move ¥22,000 from Main bank to Beta Bank by 9 Dec', l);
    ck('one line for Beta: no warning, no short, no sum of its own beside it, never "cover"', !/Beta Bank goes|Short by|Beta Bank today\) −|cover/i.test(all) && !/Under a minimum/.test(all), all.slice(0, 900));

    ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'change_bill', ref: R.ref(body, 'Rent'), account: R.ref(body, 'Beta Bank') }] })]), R.say('Done.'));
    await R.tell(p, 'pay rent from Beta Bank');
    h = await R.home(p); l = await line(p);
    ck('Rent to Beta: safe to spend stays 179,400 (it said 107,400)', h.safe === 179400, JSON.stringify(h));
    ck('Rent to Beta: the line names both amounts and days', l === 'Move ¥22,000 from Main bank to Beta Bank by 9 Dec, and ¥72,000 more by 27 Dec', l);
    ai.push(body => R.say('', [R.call('change', { steps: [{ do: 'change_bill', ref: R.ref(body, 'Power'), account: R.ref(body, 'Beta Bank') }] })]), R.say('Power is paid from Beta Bank from its next one.'));
    await R.tell(p, 'pay power from Beta Bank');
    h = await R.home(p); l = await line(p);
    ck('Power too: safe to spend stays 179,400 (it said 100,000)', h.safe === 179400, JSON.stringify(h));
    ck('Power too: 22,000 by 9 Dec and 79,400 more by 27 Dec', l === 'Move ¥22,000 from Main bank to Beta Bank by 9 Dec, and ¥79,400 more by 27 Dec', l);

    /* Later: hidden until the next day, also after a reload */
    await p.$eval('#a3Home [data-helplater]', e => e.click()); await T.w(400);
    ck('Later hides the line today', (await line(p)) === '');
    await p.reload(); await T.w(900);
    ck('still hidden after a reload the same day', (await line(p)) === '');
    await p.goto(T.URL0 + '?today=2026-12-02'); await T.w(900);
    ck('back the next day', /^Move ¥22,000 from Main bank to Beta Bank by 9 Dec/.test(await line(p)), await line(p));

    /* Done on 5 Dec: the move is recorded once, with Undo */
    await p.goto(T.URL0 + '?today=2026-12-05'); await T.w(900);
    await p.$eval('#a3Home [data-helpdone]', e => e.click()); await T.w(800);
    h = await R.home(p); l = await line(p);
    ck('Done: Main bank 179,400 and safe to spend still 179,400 (never counted twice)', h.bank === 179400 && h.safe === 179400, JSON.stringify(h));
    ck('Done: the line says what is left, 79,400 by 27 Dec', l === 'Move ¥79,400 from Main bank to Beta Bank by 27 Dec', l);
    const moved = await p.evaluate(() => BurrowApp3.E3.book.events.filter(e => e.k === 'transfer' && !e.gone).map(e => [e.date, e.a]));
    ck('Done wrote one move between your own accounts, today', JSON.stringify(moved) === '[["2026-12-05",22000]]', JSON.stringify(moved));
    const undo = await p.$$eval('#a3Msg button', bs => { const u = bs.find(x => x.textContent === 'Undo'); if (u) u.click(); return !!u; }); await T.w(800);
    h = await R.home(p); l = await line(p);
    ck('Undo puts it back: Main bank 201,400, 22,000 by 9 Dec again, safe to spend 179,400', undo && h.bank === 201400 && h.safe === 179400 && /^Move ¥22,000 from Main bank to Beta Bank by 9 Dec/.test(l), JSON.stringify([undo, h, l]));
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the test ran to its end', false, e.stack); }
  await b.close();
  T.done('e3_shortgap');
})();
