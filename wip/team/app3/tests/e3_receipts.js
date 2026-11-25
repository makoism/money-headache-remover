#!/usr/bin/env node
/* Receipts through the page, on a kept made-up book (e3_act_book.js: the Mako book plus Free to spend 60,000 and
   Food 40,000 a month, a wallet, savings and a car loan), shown as on 25 Nov 2026.
   Log a spend fast (amount only: Free to spend, the main bank and today are already picked), and the figures before
   and after are the engine's; a spend on a card on Food; Undo from the bar takes back only that one; change a row
   (same record, new amount); remove with Undo; a refund given back to Free to spend; money moved to the wallet;
   search; the earlier period; refused input says what to do and saves nothing; everything is still there after a
   reload. Every figure on the screen is checked against the engine run in node on the book the page saved. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const { actBook, WALLET, FOOD } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const bk0 = actBook(), bank = bk0.home.main.v.acct, cardA = bk0.accounts.find(a => a.name === 'Card A').id;
/* the book as the page saved it, read back through the store (store/idb.js) */
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
const fig = (p, k) => p.evaluate(k => { const e = document.querySelector(`[data-fig="${k}"] [data-amt]`); return e ? Number(e.dataset.amt) : null; }, k);
const rows = p => p.$$eval('#rcList [data-rc]', rs => rs.map(r => ({ id: r.dataset.rc, k: r.dataset.k, text: r.textContent.replace(/\s+/g, ' ').trim() })));
const bar = p => p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'); return m ? { text: m.querySelector('span').textContent, button: (m.querySelector('button') || {}).textContent || null } : null; });
async function type(p, sel, text) { await p.tap(sel); await T.w(60); await p.keyboard.type(text); }
async function setVal(p, sel, v) { await p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, v); }
async function figsMatch(p, book, what) {
  const r = T.L.lookahead(book, DAY);
  ck(what + ': Free to spend left is the engine\'s', await fig(p, 'rc-free') === r.period.free.left, (await fig(p, 'rc-free')) + ' vs ' + r.period.free.left);
  ck(what + ': safe to spend is the engine\'s', await fig(p, 'rc-safe') === r.safeToSpend.headline, (await fig(p, 'rc-safe')) + ' vs ' + r.safeToSpend.headline);
  return r;
}
(async () => {
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3rc-');
  let { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  const put = await p.evaluate(async bk => { const s = await BurrowStore.open(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, bk0);
  ck('the made-up book is kept through the store', put && put.ok, JSON.stringify(put));
  await p.reload(); await T.w(400);

  /* [C2] Free to spend left caps safe to spend here (the engine: the accounts can spare 158,334, Free to spend has 40,000
     left), and Home says so in one plain line a first-time reader can repeat, with the engine's two figures */
  {
    const r0 = T.L.lookahead(bk0, DAY), say = await p.$eval('#a3Home [data-fig=capsay]', e => e.textContent.replace(/\u2060/g, '')).catch(() => null);
    ck('C2: the engine caps safe to spend by Free to spend left', r0.safeToSpend.cappedByFreeToSpend === true && r0.safeToSpend.headline === 40000 && r0.safeToSpend.whyParts[0].amount === 158334, JSON.stringify(r0.safeToSpend));
    ck('C2: Home says why the figure is what it is, in one line', say === 'Your accounts can spare ¥158,334, but only ¥40,000 of your Free to spend is left this period, so ¥40,000 is safe to spend', say);
    const order = await p.$$eval('#a3Home [data-card=safe] [data-fig]', es => es.map(e => e.dataset.fig));
    ck('C2: the line sits right under the big figure, above the sums', order.indexOf('capsay') === order.indexOf('safe') + 1, order.join());
  }
  /* the tab */
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  ck('the Receipts tab shows its panel and hides Home', await p.$eval('#a3Rc', e => !e.hidden) && await p.$eval('#a3Home', e => e.hidden));
  ck('the tab is marked as the current page', await p.$eval('[data-tab="receipts"]', e => e.getAttribute('aria-current')) === 'page');
  let r = await figsMatch(p, bk0, 'at first');
  ck('the day is today, the account the main bank, the line Free to spend', await p.$eval('#rcDate', e => e.value) === DAY && await p.$eval('#rcAcct', e => e.value) === bank && await p.$eval('#rcFor', e => e.value) === 'line:free');
  await T.shot(p, 'receipts_empty_' + DAY);

  /* log a spend fast: the amount, a note, Enter */
  await type(p, '#rcAmt', '1200'); await type(p, '#rcNote', 'coffee'); await T.w(100);
  const after = await fig(p, 'rc-free-after');
  ck('before saving, the page says what it would leave (the engine on the draft)', after === r.period.free.left - 1200, after);
  await p.tap('#rcSave'); await T.w(400);
  let bk = await saved(p);
  const spend = bk.events.find(e => e.k === 'spend' && e.a === 1200);
  ck('the spend is kept with its id, told, at and by', !!spend && /^[a-z0-9]{6}-[a-z0-9]{10}-\d+$/.test(spend.id) && spend.told.startsWith(DAY) && !!spend.at && !!spend.by && spend.line === 'free' && spend.note === 'coffee', JSON.stringify(spend));
  r = await figsMatch(p, bk, 'after the spend');
  ck('the figures say what they were', await fig(p, 'rc-free-was') === T.L.lookahead(bk0, DAY).period.free.left);
  let m = await bar(p);
  /* [C2] while Free to spend left caps safe to spend, the bar says the spend lowers both, and why */
  ck('the Undo bar says what was logged, and that safe to spend goes down with it (C2)', !!m && m.text === 'Logged ¥1,200 on Free to spend. Safe to spend goes down with it, it\'s what\'s left of your Free to spend' && m.button === 'Undo', JSON.stringify(m));
  ck('the list shows it in this period', (await rows(p)).some(x => x.id === spend.id && /Free to spend/.test(x.text) && /coffee/.test(x.text) && /¥1,200/.test(x.text)), JSON.stringify(await rows(p)));
  ck('under the list: Tap a spend to change it', await p.$eval('#rcList', e => { const h = e.querySelector('[data-hint=rc-tap]'); return !!h && h.textContent === 'Tap a spend to change it' && h.previousElementSibling && h.previousElementSibling.matches('ul'); }));
  ck('the amount box is empty and ready for the next one', await p.$eval('#rcAmt', e => e.value) === '' && await p.evaluate(() => document.activeElement.id) === 'rcAmt');
  await T.shot(p, 'receipts_logged_' + DAY);

  /* a spend on the card, on Food, then Undo from the bar: only that one goes */
  await type(p, '#rcAmt', '3000'); await setVal(p, '#rcFor', 'line:' + FOOD); await setVal(p, '#rcAcct', cardA);
  await p.tap('#rcSave'); await T.w(400);
  bk = await saved(p);
  const food = bk.events.find(e => e.k === 'spend' && e.a === 3000);
  ck('the card spend is on Food and the card', !!food && food.acct === cardA && food.line === FOOD, JSON.stringify(food));
  await p.tap('[data-tab="home"]'); await T.w(200);
  const owed = await p.evaluate(id => { const e = document.querySelector(`[data-cardid="${id}"] [data-fig=owed] [data-amt]`); return e ? Number(e.dataset.amt) : null; }, cardA);
  ck('Home shows the card owing the engine\'s figure', owed === T.L.lookahead(bk, DAY).cards[cardA].owedNow, owed);
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  await p.click('#a3Msg .burrow-msg button'); await T.w(400);
  bk = await saved(p);
  ck('Undo marked the card spend gone (never deleted) and kept the coffee', bk.events.find(e => e.id === food.id).gone === DAY && !bk.events.find(e => e.id === spend.id).gone);
  ck('the list no longer shows it', !(await rows(p)).some(x => x.id === food.id));
  await figsMatch(p, bk, 'after Undo');

  /* change a row: the same record, a new amount */
  await p.tap(`[data-rc="${spend.id}"] button`); await T.w(200);
  ck('a tap on a row opens it to change, filled in', await p.$eval('#rcAmt', e => e.value) === '1200' && await p.$eval('#rcNote', e => e.value) === 'coffee' && !!(await p.$('#rcRemove')));
  await type(p, '#rcAmt', '1500'); await p.tap('#rcSave'); await T.w(400);
  bk = await saved(p);
  const ch = bk.events.find(e => e.id === spend.id);
  ck('the change is on the same record, told kept, at moved', ch.a === 1500 && ch.told === spend.told && ch.at !== spend.at && !ch.gone, JSON.stringify(ch));
  await figsMatch(p, bk, 'after the change');

  /* remove, with Undo */
  await p.tap(`[data-rc="${spend.id}"] button`); await T.w(200);
  await p.tap('#rcRemove'); await T.w(400); if (await p.$('[data-sureyes]')) { await p.$eval('[data-sureyes]', e => e.click()); await T.w(400); }
  bk = await saved(p);
  ck('remove marks it gone', bk.events.find(e => e.id === spend.id).gone === DAY);
  m = await bar(p);
  ck('the bar offers Undo for the removal', !!m && /^Removed ¥1,500/.test(m.text) && m.button === 'Undo', JSON.stringify(m));
  await p.click('#a3Msg .burrow-msg button'); await T.w(400);
  bk = await saved(p);
  ck('Undo puts it back', !bk.events.find(e => e.id === spend.id).gone && (await rows(p)).some(x => x.id === spend.id));

  /* a refund given back to Free to spend */
  await p.tap('[data-mode="refund"]'); await T.w(150);
  await type(p, '#rcAmt', '500'); await setVal(p, '#rcFor', 'line:free'); await type(p, '#rcNote', 'sent back');
  const before = T.L.lookahead(bk, DAY);
  await p.tap('#rcSave'); await T.w(400);
  bk = await saved(p);
  const ref = bk.events.find(e => e.k === 'in' && e.sub === 'refund');
  ck('the refund is money in with sub refund, given back to Free to spend', !!ref && ref.a === 500 && ref.line === 'free' && ref.acct === bank, JSON.stringify(ref));
  r = await figsMatch(p, bk, 'after the refund');
  ck('Free to spend left went up by the refund (the engine says so)', r.period.free.left === before.period.free.left + 500);

  /* money moved to the wallet */
  await p.tap('[data-mode="moved"]'); await T.w(150);
  await type(p, '#rcAmt', '4000'); await setVal(p, '#rcTo', WALLET);
  await p.tap('#rcSave'); await T.w(400);
  bk = await saved(p);
  const mv = bk.events.find(e => e.k === 'transfer');
  ck('the move is a transfer from the bank to the wallet', !!mv && mv.acct === bank && mv.acct2 === WALLET && mv.a === 4000, JSON.stringify(mv));
  ck('the list says where it went', (await rows(p)).some(x => x.id === mv.id && /Moved to Wallet/.test(x.text)));
  await p.tap('[data-tab="home"]'); await T.w(200);
  const banks = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-card=bank]')].map(c => [c.dataset.acct, Number(c.querySelector('[data-fig=bank] [data-amt]').dataset.amt)])));
  const rv = T.L.lookahead(bk, DAY);
  ck('Home shows each account as the engine has it after the move', banks[bank] === rv.accounts[bank].bank && banks[WALLET] === rv.accounts[WALLET].bank, JSON.stringify(banks));
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  await T.shot(p, 'receipts_list_' + DAY);

  /* search, and the earlier period */
  await type(p, '#rcSearch', 'coff'); await T.w(200);
  let rs = await rows(p);
  ck('search finds the coffee only', rs.length === 1 && rs[0].id === spend.id, JSON.stringify(rs));
  ck('search says it looks at everything', await p.$eval('[data-fig=rc-period]', e => e.dataset.search) === '1');
  await p.$eval('#rcSearch', e => { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); }); await T.w(200);
  const per = await p.$eval('[data-fig=rc-period]', e => [e.dataset.start, e.dataset.end, e.textContent]);
  ck('the list goes by the engine\'s period, named by its dates', per[0] === rv.period.start && per[1] === rv.period.end && per[2] === '10 Nov to 9 Dec', JSON.stringify(per));
  const P = require('../../engine/periods.js'), pp = P.periods(bk, DAY);
  ck('Earlier is offered only when the engine has a period gone by (none before the setup day)', await p.$eval('#rcOlder', e => e.disabled) === (pp.past.length === 0), pp.past.length);
  const sp = await p.$$eval('[data-fig=rc-spent] li', ls => ls.map(l => [...l.querySelectorAll('[data-amt]')].map(x => Number(x.dataset.amt))));
  ck('each line\'s spent this period is the engine\'s (periods.js)', JSON.stringify(sp) === JSON.stringify([[pp.current.free.spent, pp.current.free.start]].concat(pp.current.lines.map(l => [l.spent, l.start]))), JSON.stringify(sp));

  /* refused input: says what to do, saves nothing */
  const n0 = (await saved(p)).events.length;
  await p.tap('[data-mode="spend"]'); await T.w(150);
  await p.tap('#rcSave'); await T.w(200);
  ck('no amount: it says to type one', /Type the amount/.test(await p.$eval('#rcErr', e => e.textContent)));
  await type(p, '#rcAmt', '800'); await setVal(p, '#rcDate', '2026-11-26');
  await p.tap('#rcSave'); await T.w(300);
  ck('a day after today: it says so', /not come yet/.test(await p.$eval('#rcErr', e => e.textContent)), await p.$eval('#rcErr', e => e.textContent));
  ck('nothing was saved', (await saved(p)).events.length === n0);

  /* a reload keeps it all */
  await p.reload(); await T.w(400);
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  rs = await rows(p);
  ck('after a reload the list is the same (coffee, refund, move)', rs.length === 3, JSON.stringify(rs));
  await figsMatch(p, await saved(p), 'after a reload');
  ck('no page errors', errs.length === 0, errs.join(' | '));

  /* a new period: the 10 Dec pays ticked at a check-in (engine/checkin.js, written here), shown as on 15 Dec */
  {
    const CI = require('../../engine/checkin.js'), I = require('../../engine/ids.js'), D2 = '2026-12-10', D3 = '2026-12-15';
    const kb = await saved(p), r10 = T.L.lookahead(kb, D2), pays = r10.checkIn.toConfirm.filter(o => kb.schedules.some(s => s.kind === 'income' && s.id === I.scheduleOf(o.item)));
    const out = CI.checkIn(kb, { day: D2, told: D2 + 'T20:00+09:00', newId: I.idMaker('t3rcpt', () => 0.6), figures: {}, ticked: pays.map(o => o.item),
      expected: Object.fromEntries(pays.map(o => [o.item, o.amount])), lands: Object.fromEntries(pays.map(o => [o.item, o.lands])) });
    const nb = CI.apply ? CI.apply(kb, out) : Object.assign({}, kb, { events: kb.events.concat(out.events), checkins: (kb.checkins || []).concat(out.checkins) });
    const put2 = await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, nb);
    ck('the book with the check-in is kept through the store', put2 && put2.ok, JSON.stringify(put2));
    await p.goto(T.URL0 + '?today=' + D3); await T.w(400);
    await p.tap('[data-tab="receipts"]'); await T.w(200);
    const q = P.periods(nb, D3);
    const cur = await p.$eval('[data-fig=rc-period]', e => [e.dataset.start, e.dataset.end, e.textContent]);
    ck('on 15 Dec the list shows the period the 10 Dec pay started', cur[0] === q.current.start && cur[0] === '2026-12-10' && cur[1] === q.current.end, JSON.stringify(cur));
    ck('nothing logged in it yet', (await rows(p)).length === 0, JSON.stringify(await rows(p)));
    ck('Earlier is offered', await p.$eval('#rcOlder', e => !e.disabled));
    await p.tap('#rcOlder'); await T.w(200);
    const old = await p.$eval('[data-fig=rc-period]', e => [e.dataset.start, e.dataset.end, e.textContent]);
    ck('Earlier shows the engine\'s period gone by, 10 Nov to 9 Dec', old[0] === q.past[0].start && old[1] === q.past[0].end && old[2] === '10 Nov to 9 Dec', JSON.stringify(old));
    ck('with what was logged in it (coffee, refund, move)', (await rows(p)).length === 3);
    const sp2 = await p.$$eval('[data-fig=rc-spent] li', ls => ls.map(l => Number(l.querySelector('[data-amt]').dataset.amt)));
    ck('its spent figures are the engine\'s for that period', JSON.stringify(sp2) === JSON.stringify([q.past[0].free.spent].concat(q.past[0].lines.map(l => l.spent))), JSON.stringify(sp2) + ' vs ' + JSON.stringify(q.past[0].free));
    ck('Later goes back to the running period', await p.$eval('#rcNewer', e => !e.disabled) && !(await p.$eval('#rcOlder', e => !e.disabled)));
    await T.shot(p, 'receipts_earlier_' + D3);
    await p.tap('#rcNewer'); await T.w(200);
    ck('and back', await p.$eval('[data-fig=rc-period]', e => e.dataset.start) === '2026-12-10');
    ck('no page errors (15 Dec)', errs.length === 0, errs.join(' | '));
  }
  await b.close();

  /* a narrow phone, and the try book: logging works and writes nothing */
  ({ b, p, errs } = await T.open({ w: 320, h: 700 }));
  await p.goto(T.URL0 + '?try=mako&today=2026-12-10'); await T.w(400);
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  const wide = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth));
  ck('at 320 wide nothing runs off the side', wide <= 320, wide);
  await type(p, '#rcAmt', '900'); await p.tap('#rcSave'); await T.w(300);
  ck('the try book logs in memory', (await rows(p)).length === 1);
  const dbs = await p.evaluate(() => indexedDB.databases().then(d => d.map(x => x.name)));
  ck('the try book writes nothing', !dbs.includes('burrow3'), dbs.join(','));
  await T.shot(p, 'receipts_try_320');
  ck('no page errors (try)', errs.length === 0, errs.join(' | '));
  await b.close();
  /* [S3, AN4, O1] a spend told after a check but dated before it is inside that check's figure: the bank stays, and the
     row says so. Set up Mon 23 Nov with 300,000, Pay 250,000 on the 25th; a check of 550,000 on 28 Nov at 20:00; then
     1,000 dated 24 Nov told at 21:00, and 2,000 dated 28 Nov told 29 Nov (after the check: not inside it, AN4). */
  {
    const B = require('../../engine/build_book.js'), I = require('../../engine/ids.js'), nid = I.idMaker('s3rcpt', () => 0.3);
    const bk = B.buildBook({ day: '2026-11-23', told: '2026-11-23T09:00+09:00', country: 'JP', currency: 'JPY',
      banks: [{ key: 'b', name: 'Main bank', amount: 300000 }],
      pays: [{ key: 'pay', name: 'Pay', bank: 'b', amount: 250000, day: 25, shift: 'none', startsPeriod: true }], bills: [] }, { newId: I.idMaker('s3book', () => 0.5) }).book;
    const acct = bk.accounts[0].id, pay = bk.schedules[0].id, late = nid(), after = nid();
    bk.events.push({ id: nid(), k: 'in', acct, date: '2026-11-25', a: 250000, settles: [pay + '@2026-11-25'], told: '2026-11-25T20:00+09:00' },
      { id: nid(), k: 'check', acct, date: '2026-11-28', a: 550000, told: '2026-11-28T20:00+09:00' },
      { id: late, k: 'spend', acct, date: '2026-11-24', a: 1000, told: '2026-11-28T21:00+09:00' },
      { id: after, k: 'spend', acct, date: '2026-11-28', a: 2000, told: '2026-11-29T09:00+09:00' });
    const r = T.L.lookahead(bk, '2026-11-29');
    ck('S3: the engine names the 24 Nov spend as inside the 28 Nov check, the bank stays 550,000 less the 2,000',
      JSON.stringify(r.heldByCheck) === JSON.stringify([{ id: late, account: acct, check: '2026-11-28' }]) && r.accounts[acct].bank === 548000, JSON.stringify([r.heldByCheck, r.accounts[acct].bank]));
    const prof2 = require('fs').mkdtempSync(require('os').tmpdir() + '/a3rc3-');
    ({ b, p, errs } = await T.open({ profile: prof2 }));
    await p.goto(T.URL0 + '?today=2026-11-29'); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk);
    await p.reload(); await T.w(400);
    await p.tap('[data-tab="receipts"]'); await T.w(200);
    await p.$eval('#rcSearch', e => { e.value = '000'; e.dispatchEvent(new Event('input', { bubbles: true })); }); await T.w(200);
    const rs = await rows(p), one = rs.find(x => x.id === late), two = rs.find(x => x.id === after);
    ck('S3: the 24 Nov row says it is already in the 28 Nov bank figure', one && /already in your bank figure of 28 Nov/.test(one.text), JSON.stringify(rs));
    ck('S3: the 28 Nov row told after the check says nothing of it', two && !/already in/.test(two.text), JSON.stringify(two));
    ck('no page errors (S3)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  /* [M7, M61; qc-data-safety B2] a record dated or told after today (a backup from a phone whose clock was ahead) is in
     the book and does not count yet: Receipts shows it under "Dated after today", search finds it, and it can be opened
     and removed, with Undo. Nothing the book holds is hidden */
  {
    const prof2 = require('fs').mkdtempSync(require('os').tmpdir() + '/a3rc2-');
    const { b, p, errs } = await T.open({ profile: prof2 });
    const bk = actBook(), CLOCK = 'k7m2qa-f3n8p1x6wd-9901';
    bk.events.push({ id: CLOCK, date: '2027-03-15', told: '2027-03-15T10:00+09:00', at: '2027-03-15T10:00:00.000+09:00', by: 'zzclok', k: 'spend', acct: bank, a: 6060, line: 'free' });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, bk);
    await p.reload(); await T.w(400);
    await p.tap('[data-tab=receipts]'); await T.w(300);
    const ahead = () => p.$$eval('#rcList [data-rcahead]', rs => rs.map(r => ({ id: r.dataset.rcahead, text: r.textContent.replace(/\s+/g, ' ').trim() })));
    const head = () => p.$eval('#rcList [data-fig=rc-ahead]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
    let a = await ahead();
    ck('B2: Receipts lists what is dated after today: the 4 in this book', a.length === 4 && /4 things are dated after today/.test(await head()), (await head()) + ' ' + JSON.stringify(a));
    const one = a.find(x => x.id === CLOCK);
    ck('B2: the spend from the phone whose clock was ahead is there, with its amount and day', one && /¥6,060/.test(one.text) && /15 Mar 2027/.test(one.text), JSON.stringify(one));
    ck('B2: the words say they do not count yet and what to do', /do not count until their day/.test(await head()) && /remove it and log it again/.test(await head()), await head());
    ck('B2: the usual rows are as before (none dated ahead among them)', (await rows(p)).every(x => x.id !== CLOCK));
    await type(p, '#rcSearch', '6060'); await T.w(200);
    a = await ahead();
    ck('B2: search finds it', a.length === 1 && a[0].id === CLOCK, JSON.stringify(a));
    await p.$eval('[data-rcahead="' + CLOCK + '"] button', e => e.click()); await T.w(200);
    ck('B2: a tap opens it', await p.$eval('#rcAmt', e => e.value.replace(/,/g, '')) === '6060');
    await p.$eval('#rcRemove', e => e.click()); await T.w(300);
    await p.$eval('[data-sureyes]', e => e.click()); await T.w(300);
    let sv = await saved(p);
    ck('B2: Remove marks it gone in the book', !!sv.events.find(e => e.id === CLOCK).gone, JSON.stringify(sv.events.find(e => e.id === CLOCK)));
    await p.$eval('#rcSearch', e => { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); }); await T.w(200);
    ck('B2: and it leaves the list', (await ahead()).length === 3, JSON.stringify(await ahead()));
    await p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); }); await T.w(400);
    sv = await saved(p);
    ck('B2: Undo brings it back', !sv.events.find(e => e.id === CLOCK).gone && (await ahead()).length === 4);
    ck('no page errors (B2)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_receipts');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
