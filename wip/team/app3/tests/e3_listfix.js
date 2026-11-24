#!/usr/bin/env node
/* The LISTFIX lane's fixes (app3/LISTFIX.md), each on the real page, on the made-up Mako book.
   A1. A gap found at Check your bank is spending (T2), so Receipts lists it in the period it counts in, beside what was
       logged, and the list never says "Nothing logged" while the spent figure holds a gap. Hand-worked: the bank was
       checked at 286,000 on 20 Nov and the app expects 387,400 on 10 Dec; typed 386,550, the gap is 850. The stretch is
       21 Nov to 10 Dec (20 days), cut at the period start of 10 Dec: 19 days in the period before (850 x 19 / 20 = 807.5,
       808) and 1 day in this one (850 - 808 = 42). Receipts shows the 42 in this period and the 808 under Earlier, each
       named as found at the bank check of 10 Dec, on Free to spend, and not a button (it changes only at a check).
   A2. Plan lines alone needing more than the bank can spare: Home says so, by how much, and what to do (worked below).
   C1. A second bank going below zero while the main one can spare it: Home says to move the money, how much and from where.
   B1. A gap saved while the card question shows: the Undo bar still says it counts as spending.
   B2. Right after setup, Home says why safe to spend is small: Free to spend counts its share for the days left.
   B3. The cap step in the sum under safe to spend says it is held back, and why. */
'use strict';
const T = require('./lib3.js');
const { ck } = T;
const txt = (p, sel) => p.$eval(sel, e => (e.hidden ? '' : e.textContent.trim())).catch(() => null);
async function typeIn(p, sel, v) { await p.tap(sel); await p.keyboard.type(v); await T.w(250); }
const rows = p => p.$$eval('#rcList li', es => es.map(e => ({ gap: e.dataset.gap !== undefined, text: e.textContent.replace(/\s+/g, ' ').trim(), button: !!e.querySelector('button') })));
(async () => {
  const bk = T.book(), bank = bk.home.main.v.acct;
  const errLists = [];
  let b, p;
  const go = async day => { await p.goto(T.URL0 + '?today=' + day); await T.w(400); };
  /* a fresh device with a kept book (the made-up one unless another is given), saved through the store */
  const fresh = async bk0 => {
    if (b) await b.close();
    const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3prof-') });
    b = o.b; p = o.p; errLists.push(o.errs);
    await go('2026-12-10');
    await p.evaluate(async x => { const s = await BurrowStore.open(); await s.save(x, { full: true }); s.db && s.db.close(); }, bk0 || T.book());
  };
  await fresh(bk);

  /* A1 */
  await go('2026-12-10');
  await p.click('#a3CheckGo'); await T.w(300);
  await typeIn(p, `[data-bankfig="${bank}"]`, '386,550');
  await p.click(`[data-gapyes="${bank}"]`); await T.w(200);
  await p.click('#a3CheckSave'); await T.w(500);
  await p.tap('[data-tab="receipts"]'); await T.w(300);
  let rs = await rows(p);
  const now = rs.filter(r => r.gap);
  ck('A1: this period lists the gap found at the check, ¥42, on Free to spend', now.length === 1 && /Found at your bank check on 10 Dec/.test(now[0].text) && /Free to spend/.test(now[0].text) && /¥42$/.test(now[0].text), JSON.stringify(rs));
  ck('A1: the gap row is not a button (it changes only at a check)', now.length === 1 && !now[0].button, JSON.stringify(now));
  ck('A1: never "Nothing logged" beside a gap', !/Nothing logged/.test(await txt(p, '#rcList')), await txt(p, '#rcList'));
  await p.click('#rcOlder'); await T.w(300);
  rs = await rows(p);
  const before = rs.filter(r => r.gap);
  ck('A1: the period before lists its part, ¥808, from the same check', before.length === 1 && /Found at your bank check on 10 Dec/.test(before[0].text) && /¥808$/.test(before[0].text), JSON.stringify(rs));
  await T.shot(p, 'listfix_a1');

  /* A2: a fresh copy of the made-up book on 12 Dec: safe to spend 35,000 until pay on 12 Jan. The 10 Dec pay is not
     ticked, so the period holding setup (20 Nov) still runs, and Food of 100,000 each pay period, added on Plan, counts
     its share from the setup day (I4): 100,000 x 20 / 30 = 66,666. The plan needs 66,666 - 35,000 = 31,666 more than
     the bank can spare. The bank itself never goes under, so Home says the plan
     is the cause, with the amount, and what to do; never "It turns safe once your pay is in". */
  await fresh();
  await go('2026-12-12');
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plAddLine'); await T.w(200);
  await p.evaluate(v => { for (const [k, x] of Object.entries(v)) { const e = document.getElementById('pl-' + k); e.focus(); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); } }, { name: 'Food', amount: '100000' });
  await p.click('[data-plbtn="0"]'); await T.w(400);
  await p.tap('[data-tab="home"]'); await T.w(300);
  const st2 = await p.$eval('[data-card="status"]', e => e.textContent.replace(/\s+/g, ' ').trim());
  ck('A2: Home says the plan lines need ¥31,666 more than the bank can spare before pay on 12 Jan', /Your plan lines need ¥31,666 more than your bank can spare before pay on 12 Jan/.test(st2), st2);
  ck('A2: and what to do: Lower a plan line, or move money in', /Lower a plan line, or move money in/.test(st2), st2);
  ck('A2: never "until pay" as if the pay fixes it', !/Nothing's safe to spend until pay/.test(st2), st2);
  ck('A2: safe to spend is 0', (await p.$eval('[data-fig="safe"] [data-amt]', e => e.dataset.amt)) === '0');
  await T.shot(p, 'listfix_a2');

  /* C1: the made-up book with a second bank, Bank B, ¥10,000 at setup on 20 Nov, and a Gym bill of 15,000 on the 15th
     from it, with no pay into it. On 12 Dec: 10,000 - 15,000 = -5,000 on 15 Dec, and -20,000 after 15 Jan. Main bank
     can spare 35,000 (as A2 before Food). Home warns that Bank B goes below zero and says where the money can come from:
     "Move ¥20,000 from Main bank to Bank B by 15 Dec. Main bank can spare it" (the lowest it goes, by the first day under). */
  const bkB = T.book(), B = 'k7m2qa-f3n8p1x6wd-81';
  bkB.accounts.push({ id: B, name: 'Bank B', type: 'bank', cur: 'JPY', owner: null, minBank: null });
  bkB.events.push({ id: 'k7m2qa-f3n8p1x6wd-82', k: 'open', acct: B, date: '2026-11-20', a: 10000, told: '2026-11-20T24:00', grp: 'setup' }, { id: 'k7m2qa-f3n8p1x6wd-83', k: 'check', acct: B, date: '2026-11-20', a: 10000, told: '2026-11-20T24:00', grp: 'setup' });
  bkB.schedules.push({ id: 'k7m2qa-f3n8p1x6wd-84', kind: 'bill', name: 'Gym', acct: B, cur: 'JPY', shift: 'after', rules: [{ from: null, rule: { every: 'month', days: [15] } }], steps: [{ from: null, amount: 15000 }] });
  await fresh(bkB);
  await go('2026-12-12');
  const warnC = await p.$$eval('#a3Home [data-warn]', es => es.map(e => e.textContent));
  ck('C1: Home warns that Bank B goes ¥5,000 below zero on 15 Dec', warnC.some(x => x === 'Bank B goes ¥5,000 below zero on 15 Dec'), warnC.join(' | '));
  const mv = await txt(p, '#a3Home [data-fig="move-from"]');
  ck('C1: and says where from: Move ¥20,000 from Main bank to Bank B by 15 Dec. Main bank can spare it', mv === 'Move ¥20,000 from Main bank to Bank B by 15 Dec. Main bank can spare it', mv);
  await T.shot(p, 'listfix_c1');

  /* B1: the same check as A1 on a fresh device, saved while "Was Card A's payment ¥54,000?" is still showing: the gap
     is counted as spending all the same (the engine's filler, 850), so the Undo bar says "It counts as spending" too. */
  await fresh(bk);
  await go('2026-12-10');
  await p.click('#a3CheckGo'); await T.w(300);
  await typeIn(p, `[data-bankfig="${bank}"]`, '386,550');
  ck('B1: the card question is showing', !!(await txt(p, `[data-gapq="${bank}"]`)));
  await p.click('#a3CheckSave'); await T.w(500);
  const barB1 = await p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'); return m ? m.querySelector('span').textContent : ''; });
  ck('B1: the Undo bar says ¥850 more left your bank than you logged. It counts as spending', barB1.includes('¥850 more left your bank than you logged. It counts as spending'), barB1);
  const gapB1 = await p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); s.close(); return r.copy; }).then(c => T.L.lookahead(c, '2026-12-10').accounts[bank].fillers.slice(-1)[0].amount);
  ck('B1: and the engine counts the 850', gapB1 === 850, gapB1);

  /* B2: the made-up book on 25 Nov, set up on 20 Nov in the period 10 Nov to 9 Dec. Free to spend of 60,000 each pay,
     set on Plan, counts 20 of 30 days now: 60,000 x 20 / 30 = 40,000, and it caps safe to spend at 40,000. Home says
     why: "Free to spend counts ¥40,000 of ¥60,000 this pay period, because you started partway through it. The full
     ¥60,000 counts from your next pay", with the same "?" as Plan's "Why only part?". */
  await fresh(bk);
  await go('2026-11-25');
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plSetFree'); await T.w(200);
  await p.evaluate(() => { const e = document.getElementById('pl-amount'); e.focus(); e.value = '60000'; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); });
  await p.click('[data-plbtn="0"]'); await T.w(400);
  await p.tap('[data-tab="home"]'); await T.w(300);
  ck('B2: safe to spend is 40,000 (Free to spend left caps it)', (await p.$eval('[data-fig="safe"] [data-amt]', e => e.dataset.amt)) === '40000');
  const sh = await p.$eval('#a3Home [data-fig="freeshare"]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
  ck('B2: Home says why: Free to spend counts ¥40,000 of ¥60,000 this pay period, because you started partway through it', sh.startsWith('Free to spend counts ¥40,000 of ¥60,000 this pay period, because you started partway through it. The full ¥60,000 counts from your next pay'), sh);
  ck('B2: with the "?" of Plan\'s "Why only part?"', !!(await p.$('#a3Home [data-fig="freeshare"] .burrow-help[data-help=lineShare]')));
  await T.shot(p, 'listfix_b2');

  /* B3: the same Home. The sum under safe to spend ends with the cap (BJ5); its step says what it is: "(held back: Free
     to spend has only ¥40,000 left this period) = ¥40,000", never "(more than Free to spend left this period)". */
  const cap = await p.$eval('#a3Home [data-fig="cap"]', e => e.textContent.trim()).catch(() => '');
  ck('B3: the cap step reads (held back: Free to spend has only ¥40,000 left this period) = ¥40,000', /\(held back: Free to spend has only ¥40,000 left this period\) = ¥40,000$/.test(cap) && !/more than Free to spend/.test(cap), cap);

  const errs = [].concat(...errLists); ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_listfix');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
