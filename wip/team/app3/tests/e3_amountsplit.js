#!/usr/bin/env node
/* [AMOUNT_HISTORY_PLAN 4] Receipts and the spent figure agree when an amount is corrected after the bank check that held
   it. Made-up yen, Mako's shape (engine/test/amount_history.test.js): pay 300,000 on the 10th, Free to spend 60,000; a
   5,000 spend on 5 Dec, the bank matched on 6 Dec; a 700 lunch on 8 Dec; 13 Dec pay ticked and the bank typed 594,300
   (no gap). Periods: 10 Nov to 9 Dec, and from 10 Dec. 14 Dec the lunch is corrected to 7,000 (was: 700, told 14 Dec).
   Hand-worked: the old period's Free to spend spent 5,000 + 700 = 5,700; this period 6,300 (the change) - 6,300 (the
   13 Dec check's gap) = 0.
   1. This period: a row "Changed on 14 Dec" for the lunch, found at the 13 Dec check, ¥6,300, not a button, beside the
      gap row of ¥6,300 less; spent ¥0.
   2. The old period: the lunch at ¥700 (as it stood at the check), its row saying it is now ¥7,000; spent ¥5,700.
   3. Searching: the lunch at ¥7,000 (what it is now), no change row.
   4. Removed on 14 Dec instead: the old period still lists it at ¥700 as removed later (not a button); this period a
      row "Removed on 14 Dec", ¥700 back. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const E = require('path').join(__dirname, '../../engine/');
const BB = require(E + 'build_book.js'), LA = require(E + 'lookahead.js'), CI = require(E + 'checkin.js'), IDS = require(E + 'ids.js');
const TZ = '+09:00', T14 = '2026-12-14T09:00:00.000' + TZ, DAY = '2026-12-14';
function life(after) {
  const newId = IDS.idMaker('h3s7qa');
  const out = BB.buildBook({ day: '2026-11-24', told: '2026-11-24T12:00:00.000' + TZ, currency: 'JPY', country: 'JP',
    banks: [{ key: 'bank1', name: 'Main bank', amount: 300000, main: true, min: null }],
    pays: [{ key: 'pay1', name: 'Pay', bank: 'bank1', amount: 300000, every: 'month', day: 10, shift: 'none', startsPeriod: true }],
    cards: [], bills: [], free: 60000 }, { newId });
  let book = out.book || out;
  const bank = book.accounts.find(a => a.type !== 'card').id;
  const spend = (id, a, date, told, note) => book.events.push({ id, k: 'spend', acct: bank, a, date, line: 'free', note, src: { type: 'typed' }, told: told + TZ, at: told + TZ });
  const check = (day, fig) => {
    const r = LA.lookahead(book, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    book = CI.apply(book, CI.checkIn(book, { day, told: day + 'T12:00:00.000' + TZ, newId, figures: { [bank]: fig }, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  spend('sp5dec', 5000, '2026-12-05', '2026-12-05T18:00:00.000', 'shop');
  check('2026-12-06', 295000);
  spend('lunch8', 700, '2026-12-08', '2026-12-08T13:00:00.000', 'lunch');
  check('2026-12-13', 594300);
  after(book.events.find(e => e.id === 'lunch8'));
  return book;
}
const corrected = life(e => { e.was = [{ a: 700, told: T14 }]; e.a = 7000; e.at = T14; });
const removed = life(e => { e.was = [{ a: 700, told: T14 }]; e.gone = DAY; e.goneBy = 'stepx'; e.at = T14; });
const txt = (p, sel) => p.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
const rows = p => p.$$eval('#rcList li', ls => ls.map(l => ({ rc: l.dataset.rc || null, split: l.dataset.split || null, gap: l.dataset.gap || null, button: !!l.querySelector('button'), text: l.textContent.replace(/\s+/g, ' ').trim() })));
(async () => {
  let b, p; const errLists = [];
  const fresh = async bk0 => {
    if (b) await b.close();
    const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-') });
    b = o.b; p = o.p; errLists.push(o.errs);
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async x => { const s = await BurrowStore.open(); await s.save(x, { full: true }); s.db && s.db.close(); }, bk0);
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(400);
    await p.tap('[data-tab="receipts"]'); await T.w(300);
  };
  await fresh(corrected);
  /* 1 */
  let rs = await rows(p);
  const ch = rs.filter(r => r.split === 'lunch8');
  ck('1: this period lists the change: Changed on 14 Dec, found at the 13 Dec check, ¥6,300, not a button', ch.length === 1 && /Changed on 14 Dec/.test(ch[0].text) && /bank check on 13 Dec/.test(ch[0].text) && /¥6,300$/.test(ch[0].text) && !ch[0].button, JSON.stringify(rs));
  ck('1: the lunch itself is not listed in this period', !rs.some(r => r.rc === 'lunch8'), JSON.stringify(rs));
  ck('1: Free to spend spent ¥0 this period', /spent ¥0 of/.test(await txt(p, '[data-fig="rc-spent"]')), await txt(p, '[data-fig="rc-spent"]'));
  await T.shot(p, 'amountsplit_now');
  /* 2 */
  await p.click('#rcOlder'); await T.w(300);
  rs = await rows(p);
  const l8 = rs.filter(r => r.rc === 'lunch8');
  ck('2: the old period lists the lunch at ¥700, as it stood at the check, and says it is ¥7,000 now', l8.length === 1 && /¥700$/.test(l8[0].text) && /now ¥7,000/.test(l8[0].text) && l8[0].button, JSON.stringify(rs));
  ck('2: no change row in the old period', !rs.some(r => r.split), JSON.stringify(rs));
  ck('2: the old period spent ¥5,700', /spent ¥5,700 of/.test(await txt(p, '[data-fig="rc-spent"]')), await txt(p, '[data-fig="rc-spent"]'));
  /* 3 */
  await p.evaluate(() => { const s = document.querySelector('#rcSearch'); s.value = 'lunch'; s.dispatchEvent(new Event('input')); }); await T.w(300);
  rs = await rows(p);
  ck('3: searching lists the lunch at ¥7,000, what it is now, and no change row', rs.length === 1 && rs[0].rc === 'lunch8' && /¥7,000$/.test(rs[0].text) && !/now ¥/.test(rs[0].text), JSON.stringify(rs));
  /* 4 */
  await fresh(removed);
  rs = await rows(p);
  const rm = rs.filter(r => r.split === 'lunch8');
  ck('4: this period lists the removal: Removed on 14 Dec, found at the 13 Dec check, ¥700 back, not a button', rm.length === 1 && /Removed on 14 Dec/.test(rm[0].text) && /bank check on 13 Dec/.test(rm[0].text) && /back ¥700$/.test(rm[0].text) && !rm[0].button, JSON.stringify(rs));
  await p.click('#rcOlder'); await T.w(300);
  rs = await rows(p);
  const g8 = rs.filter(r => r.split === 'lunch8' || r.rc === 'lunch8');
  ck('4: the old period still lists the lunch at ¥700, removed later, not a button', g8.length === 1 && /¥700$/.test(g8[0].text) && /removed on 14 Dec/i.test(g8[0].text) && !g8[0].button, JSON.stringify(rs));
  ck('4: the old period spent ¥5,700', /spent ¥5,700 of/.test(await txt(p, '[data-fig="rc-spent"]')), await txt(p, '[data-fig="rc-spent"]'));
  await b.close();
  const errs = [].concat(...errLists);
  ck('no page errors', !errs.length, errs.join(' | '));
  T.done('e3_amountsplit');
})().catch(e => { console.error(e); process.exit(1); });
