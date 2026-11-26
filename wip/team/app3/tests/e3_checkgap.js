#!/usr/bin/env node
/* Check your bank says the gap before and after saving (NS-FIX 2), made-up Mako book on 10 Dec, everything ticked.
   Hand-worked: the bank was checked at 286,000 on 20 Nov; ticked since then: the Nov bills (84,600 out), both pays
   (240,000 in) and card A (54,000 out), so the app expects 286,000 - 84,600 + 240,000 - 54,000 = 387,400.
   1. Under the bank box: "Expected now ¥387,400" with "last checked ¥286,000 on 20 Nov" beside it.
   2. Typed 386,550: card A's close day is not sure, so first "Was Card A's payment ¥54,000?" (BK4); answered yes,
      "¥850 more left your bank than you logged. It counts as spending", with an option to log it as a spend on a line. Saved without it: the Undo bar says the same, and the engine's gap is 850.
   3. Typed 386,550 again with "log it as a spend" on Free to spend: [CHECKFIX F2] no fixed spend is written; the check-in
      keeps the place picked (fillerPlace; Free to spend is where a gap goes when nothing is picked), so the engine's gap
      of 850 counts there and follows any later change of either check. Undo takes the check-in back.
   4. Typed 388,250: "¥850 more came into your bank than you logged", never spending (a gain goes to the gain question).
   5. A card: card B was 23,000 at setup and is not paid until 11 Dec, so the app expects 23,000. Typed 23,850: "¥850
      more on Card B than you logged. It counts as spending"; typed 22,150: "¥850 less on Card B than the app had. It
      comes off your spending". The label reads "Expected now ¥23,000". */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const DAY = '2026-12-10';
const LOSS = '¥850 more left your bank than you logged. It counts as spending';
async function openSheet(p) {
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
  await p.click('#a3CheckGo'); await T.w(300);
}
const txt = (p, sel) => p.$eval(sel, e => (e.hidden ? '' : e.textContent.trim())).catch(() => null);
async function typeIn(p, sel, v) { await p.tap(sel); await p.keyboard.type(v); await T.w(250); }
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct, cardB = bk.accounts.find(a => a.name === 'Card B').id;
  /* a kept book (the made-up one, saved through the store), so what was written can be read back */
  let b, p; const errLists = [];
  const fresh = async () => {
    const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-') });
    b = o.b; p = o.p; errLists.push(o.errs);
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.save(bk0, { full: true }); s.db && s.db.close(); }, bk);
  };
  await fresh();
  const kept = async () => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); s.close(); return r.copy; });
  const view = async () => { const c = await kept(); const r = T.L.lookahead(c, DAY); return { c, r }; };
  /* 1 and 2 */
  await openSheet(p);
  const exp = await txt(p, `[data-expected="${bank}"]`);
  ck('the bank box says what the app expects now, and the last typed figure with its day', exp === 'Expected now ¥387,400, last checked ¥286,000 on 20 Nov', exp);
  ck('"Last time" is gone', !/Last time/.test(await p.$eval('#a3Check', e => e.textContent)));
  ck('no gap line before a figure is typed', !(await txt(p, `[data-gap="${bank}"]`)));
  await typeIn(p, `[data-bankfig="${bank}"]`, '386,550');
  /* [BK4] card A's close day is not sure and its payment is ticked: asked about first, not yet called spending */
  ck('first: was card A\'s payment 54,000?', await txt(p, `[data-gapq="${bank}"]`) === 'Was Card A\'s payment \u00a554,000?' && await txt(p, `[data-gap="${bank}"]`) === '\u00a5850 more left your bank than you logged', await txt(p, `[data-gapq="${bank}"]`) + ' / ' + await txt(p, `[data-gap="${bank}"]`));
  ck('no "log it as a spend" until that is answered', await p.$eval(`[data-gapopt="${bank}"]`, e => e.hidden));
  await p.click(`[data-gapyes="${bank}"]`); await T.w(200);
  ck('before saving: the gap is said as spending', await txt(p, `[data-gap="${bank}"]`) === LOSS, await txt(p, `[data-gap="${bank}"]`));
  ck('with an option to log it as a spend on a line now', !!(await p.$(`[data-gapspend="${bank}"]`)) && !!(await p.$(`[data-gapline="${bank}"] option[value="line:free"]`)));
  await T.shot(p, 'checkgap_before');
  await p.click('#a3CheckSave'); await T.w(500);
  const bar = await p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'); return m ? m.querySelector('span').textContent : ''; });
  ck('after saving: the Undo bar says it too', bar.includes(LOSS), bar);
  const ckOut = await view().then(({ r }) => ({ bank: r.accounts[bank].bank, gap: r.accounts[bank].fillers.slice(-1)[0].amount }));
  ck('the engine counts 850 as the gap and the bank is 386,550', ckOut.gap === 850 && ckOut.bank === 386550, JSON.stringify(ckOut));
  /* Undo, so 3 starts from the same records, in the same page: the check-in's set: records are left gone, and the
     check-in in 3 writes fresh ones in their place (act3), each counted once */
  await p.click('#a3Msg .burrow-msg button'); await T.w(400);
  const undone = await kept().then(c => ({ checks: c.events.filter(e => e.k === 'check' && !e.gone && e.date === DAY).length, sets: c.events.filter(e => String(e.id).startsWith('set:') && e.date >= '2026-11-21').map(e => !!e.gone) }));
  ck('Undo takes the check-in back: its set: records are gone', undone.checks === 0 && undone.sets.length > 0 && undone.sets.every(Boolean), JSON.stringify(undone));
  /* 3 */
  await openSheet(p);
  await typeIn(p, `[data-bankfig="${bank}"]`, '386,550');
  await p.click(`[data-gapyes="${bank}"]`); await T.w(200);
  await p.click(`[data-gapspend="${bank}"]`); await T.w(100);
  await p.click('#a3CheckSave'); await T.w(500);
  const bar3 = await p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'); return m ? m.querySelector('span').textContent : ''; });
  ck('logged as a spend: the Undo bar says where it went', /logged as a spend on Free to spend/.test(bar3), bar3);
  const out3 = await view().then(({ c, r }) => ({ bank: r.accounts[bank].bank, gap: r.accounts[bank].fillers.slice(-1)[0].amount, spends: c.events.filter(e => e.k === 'spend' && !e.gone && e.date === DAY && !(e.settles || []).length).map(e => [e.a, e.date, e.line, e.dayInside]) }));
  { const c = await kept(), ids = c.events.filter(e => String(e.id).startsWith('set:')).map(e => e.id);
    ck('a check-in after an undone one: each set: record once, live again, no clash', ids.length === new Set(ids).size && c.events.filter(e => String(e.id).startsWith('set:') && e.date >= '2026-11-21').every(e => !e.gone), JSON.stringify(ids.length)); }
  ck('[F2] the engine: the gap of 850 stays the gap (it counts on Free to spend), the bank is 386,550, no fixed spend written', out3.gap === 850 && out3.bank === 386550 && JSON.stringify(out3.spends) === '[]', JSON.stringify(out3));
  await p.click('#a3Msg .burrow-msg button'); await T.w(400);
  const back = await kept().then(c => ({ spends: c.events.filter(e => e.k === 'spend' && !e.gone && e.date === DAY && !(e.settles || []).length).length, checks: c.events.filter(e => e.k === 'check' && !e.gone && e.date === DAY).length }));
  ck('Undo takes the check-in back', back.spends === 0 && back.checks === 0, JSON.stringify(back));
  /* 4 */
  await openSheet(p);
  await typeIn(p, `[data-bankfig="${bank}"]`, '388,250');
  ck('a gain is said as money in', await txt(p, `[data-gap="${bank}"]`) === '¥850 more came into your bank than you logged', await txt(p, `[data-gap="${bank}"]`));
  ck('no "log it as a spend" for a gain', !(await p.$(`[data-gapspend="${bank}"]:not([hidden])`)) || await p.$eval(`[data-gapspend="${bank}"]`, e => e.closest('[hidden]') !== null));
  /* 5 */
  const cexp = await txt(p, `[data-expected="${cardB}"]`);
  ck('a card box says what the app expects now', /^Expected now ¥23,000/.test(cexp || ''), cexp);
  await typeIn(p, `[data-cardfig="${cardB}"]`, '23,850');
  ck('a card figure above: counts as spending', await txt(p, `[data-gap="${cardB}"]`) === '¥850 more on Card B than you logged. It counts as spending', await txt(p, `[data-gap="${cardB}"]`));
  await p.$eval(`[data-cardfig="${cardB}"]`, e => { e.value = ''; }); await typeIn(p, `[data-cardfig="${cardB}"]`, '22,150');
  ck('a card figure below: comes off spending', await txt(p, `[data-gap="${cardB}"]`) === '¥850 less on Card B than the app had. It comes off your spending', await txt(p, `[data-gap="${cardB}"]`));
  const errs = [].concat(...errLists); ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_checkgap');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
