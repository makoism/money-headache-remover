#!/usr/bin/env node
/* The LISTFIX lane's fixes (app3/LISTFIX.md), each on the real page, on the made-up Mako book.
   A1. A gap found at Check your bank is spending (T2), so Receipts lists it in the period it counts in, beside what was
       logged, and the list never says "Nothing logged" while the spent figure holds a gap. Hand-worked: the bank was
       checked at 286,000 on 20 Nov and the app expects 387,400 on 10 Dec; typed 386,550, the gap is 850, covering 21 Nov
       to 10 Dec. [CHECKGAP, coordinator 15, 26 Nov] It is the period the check is in (from 10 Dec), whole: Receipts
       shows the 850 in this period, named as found at the bank check of 10 Dec with the days it covers, on Free to
       spend, not a button (it changes only at a check), and nothing of it under Earlier (by days it was 42 and 808).
   A2. Plan lines alone needing more than the bank can spare: Home says so, by how much, and what to do (worked below).
   C1. A second bank going below zero while the main one can spare it: Home says to move the money, how much and from where.
   A2b, C1b and A1b: the three cases qc-foundation found (the day named, money set aside, gaps that are not spending).
   B1. A gap saved while the card question shows: the Undo bar still says it counts as spending.
   B2. Right after setup, Home says why safe to spend is small: Free to spend counts its share for the days left.
   B3. The cap step in the sum under safe to spend says it is held back, and why.
   B4. The bank after the cards in whole sentences, naming that bills due by then are taken off.
   B5. A cloud code used on a device with its own numbers says what happens first, and changes nothing until asked.
   B6. A spend logged on a card says when it leaves the bank. */
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
  ck('A1: this period lists the gap found at the check, all ¥850, the days it covers, on Free to spend', now.length === 1 && /Found at your bank check on 10 Dec/.test(now[0].text) && /21 Nov to 10 Dec/.test(now[0].text) && /Free to spend/.test(now[0].text) && /¥850$/.test(now[0].text), JSON.stringify(rs));
  ck('A1: the gap row is not a button (it changes only at a check)', now.length === 1 && !now[0].button, JSON.stringify(now));
  ck('A1: never "Nothing logged" beside a gap', !/Nothing logged/.test(await txt(p, '#rcList')), await txt(p, '#rcList'));
  await p.click('#rcOlder'); await T.w(300);
  rs = await rows(p);
  const before = rs.filter(r => r.gap);
  ck('A1: the period before lists no part of it: a closed period never changes by a later check [CHECKGAP]', before.length === 0, JSON.stringify(rs));
  await T.shot(p, 'listfix_a1');

  /* A2: a fresh copy of the made-up book on 12 Dec: safe to spend 35,000 until pay on 8 Jan. The 10 Dec pay is not
     ticked, so the period holding setup (20 Nov) still runs, and Food of 100,000 each pay period, added on Plan, counts
     its share from the setup day (I4): 100,000 x 20 / 30 = 66,666. The plan needs 66,666 - 35,000 = 31,666 more than
     the bank can spare. The bank itself never goes under, so Home says the plan is the cause, with the amount, the
     day the plan's walk first runs short (28 Dec, the bills of 28 Dec: 35,000 is left before them and 84,600 goes out,
     with Food's 66,666 held), and what to do; never "It turns safe once your pay is in", never "before pay on". */
  await fresh();
  await go('2026-12-12');
  await p.tap('[data-tab="plan"]'); await T.w(300);
  await p.click('#plAddLine'); await T.w(200);
  await p.evaluate(v => { for (const [k, x] of Object.entries(v)) { const e = document.getElementById('pl-' + k); e.focus(); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); } }, { name: 'Food', amount: '100000' });
  await p.click('[data-plbtn="0"]'); await T.w(400);
  await p.tap('[data-tab="home"]'); await T.w(300);
  const st2 = await p.$eval('[data-card="status"]', e => e.textContent.replace(/\s+/g, ' ').trim());
  ck('A2: Home says the plan lines need ¥31,666 more than the bank can spare, short from 28 Dec', /Your plan lines need ¥31,666 more than your bank can spare\. It runs short from 28 Dec/.test(st2) && !/before pay on/.test(st2), st2);
  ck('A2: and what to do: Lower a plan line, or move money in', /Lower a plan line, or move money in/.test(st2), st2);
  ck('A2: never "until pay" as if the pay fixes it', !/Nothing's safe to spend until pay/.test(st2), st2);
  ck('A2: safe to spend is 0', (await p.$eval('[data-fig="safe"] [data-amt]', e => e.dataset.amt)) === '0');
  await T.shot(p, 'listfix_a2');

  /* A2, second case (qc-foundation): Free to spend of 300,000 each pay period from 21 Nov, on 25 Nov. In the period
     holding setup it counts 300,000 x 20 / 30 = 200,000; the bank can spare 201,400 (real walk), so before the 10 Dec pay
     the plan fits. It runs short only on 28 Dec, after the next pay, when the next period's 300,000 is held as well:
     85,000 short then. Home names that day, never "before pay on 10 Dec". */
  { const bk2 = T.book();
    bk2.plan.shares.push({ id: 'k7m2qa-f3n8p1x6wd-95', from: '2026-11-21', cur: 'JPY', per: { free: 'pay' }, free: 300000, goals: {}, at: '2026-11-21T20:00+09:00', by: 'k7m2qa', told: '2026-11-21T20:00+09:00' });
    await fresh(bk2); await go('2026-11-25');
    const st3 = await p.$eval('[data-card="status"]', e => e.textContent.replace(/\s+/g, ' ').trim());
    ck('A2b: the plan lines need ¥85,000 more, short from 28 Dec, never before pay on 10 Dec', /Your plan lines need ¥85,000 more than your bank can spare\. It runs short from 28 Dec/.test(st3) && !/before pay on 10 Dec/.test(st3), st3); }

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

  /* C1, second case (qc-foundation): the same two banks, and a Trip goal of 30,000 kept in Main bank. Main bank can
     spare only 35,000 - 30,000 = 5,000 (what it can spare counts the money set aside), so it is never advised to move
     20,000 from it: no move line, the warning stays. */
  { const bkG = JSON.parse(JSON.stringify(bkB)), main = bkG.home.main.v.acct, st = { at: '2026-11-21T20:00+09:00', by: 'k7m2qa', told: '2026-11-21T20:00+09:00' };
    bkG.places.push(Object.assign({ id: 'k7m2qa-f3n8p1x6wd-91', name: 'Trip', kind: 'goal', target: 400000, cur: 'JPY', keptIn: { acct: main, mode: 'inBank' } }, st));
    bkG.events.push(Object.assign({ id: 'k7m2qa-f3n8p1x6wd-92', k: 'move', date: '2026-11-21', a: 30000, acct: main, place2: 'k7m2qa-f3n8p1x6wd-91', src: { type: 'typed' } }, st));
    await fresh(bkG); await go('2026-12-12');
    const mvG = await txt(p, '#a3Home [data-fig="move-from"]');
    const warnG = await p.$$eval('#a3Home [data-warn]', es => es.map(e => e.textContent));
    ck('C1b: with 30,000 set aside in Main bank, no advice to move 20,000 from it', !mvG && warnG.some(x => /Bank B goes ¥5,000 below zero on 15 Dec/.test(x)), mvG + ' / ' + warnG.join(' | ')); }

  /* A1, second case (qc-foundation): gaps the engine does not count as spending are not listed as spending. An
     investment, 500,000 at setup, checked at 540,000 on 28 Nov (a rise is never spending, T watch), and a dollar
     wallet, $100.00 at setup, checked at $90.00 on 28 Nov (another currency: not counted until stage 2). On 29 Nov
     Receipts lists neither. */
  { const bkI = T.book(), I = 'k7m2qa-f3n8p1x6wd-71', U = 'k7m2qa-f3n8p1x6wd-76', ev = (id, k, acct, date, a, told, grp) => ({ id, k, acct, date, a, told, grp });
    bkI.accounts.push({ id: I, name: 'Invest', type: 'investment', cur: 'JPY', owner: null, minBank: null }, { id: U, name: 'Dollars', type: 'bank', cur: 'USD', owner: null, minBank: null });
    bkI.events.push(ev('k7m2qa-f3n8p1x6wd-72', 'open', I, '2026-11-20', 500000, '2026-11-20T24:00', 'setup'), ev('k7m2qa-f3n8p1x6wd-73', 'check', I, '2026-11-20', 500000, '2026-11-20T24:00', 'setup'),
      ev('k7m2qa-f3n8p1x6wd-74', 'check', I, '2026-11-28', 540000, '2026-11-28T20:00+09:00', 'k7m2qa-f3n8p1x6wd-75'),
      ev('k7m2qa-f3n8p1x6wd-77', 'open', U, '2026-11-20', 10000, '2026-11-20T24:00', 'setup'), ev('k7m2qa-f3n8p1x6wd-78', 'check', U, '2026-11-20', 10000, '2026-11-20T24:00', 'setup'),
      ev('k7m2qa-f3n8p1x6wd-79', 'check', U, '2026-11-28', 9000, '2026-11-28T20:00+09:00', 'k7m2qa-f3n8p1x6wd-75'));
    await fresh(bkI); await go('2026-11-29');
    await p.tap('[data-tab="receipts"]'); await T.w(300);
    const rI = await rows(p);
    ck('A1b: no gap row for the investment or the dollar account', !rI.some(r => r.gap), JSON.stringify(rI)); }

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

  /* B4: the same Home, the bank after the cards. Both cards' close days are not sure and bills fall due before card B
     is paid on 11 Dec (Rent, Power and Internet of 26 and 27 Nov), so the line says so in whole sentences: "It counts
     everything on the cards now, as their close days are not sure" and "Bills due by then are taken off", never the
     half sentence "If everything on the cards now is taken". */
  const ac = await p.$eval('#a3Home [data-fig="aftercards"]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
  ck('B4: the bank after the cards says it counts everything on the cards now, as their close days are not sure', ac.includes('It counts everything on the cards now, as their close days are not sure'), ac);
  ck('B4: and that bills due by then are taken off', ac.includes('Bills due by then are taken off'), ac);
  ck('B4: never the half sentence', !ac.includes('If everything on the cards now is taken'), ac);

  /* B5: two devices on the local fake vault (tests/fake_vault.js), as e3_cloud. A has the made-up book and turns the
     cloud copy on. B already has its own numbers (the made-up book with its bank figure typed as 300,000 at setup).
     B types A's code: B is told first that this device has its own numbers, that they are kept as a copy and that it
     will choose which to keep. Nothing on B changes until "Use the code"; "Not now" leaves it as it was. After "Use the
     code" B is asked which copy to keep (the engine's whole-copy question), and a whole copy was kept first. */
  {
    const fs = require('fs'), os = require('os'), path = require('path');
    const { makeVault, serve } = require('./fake_vault.js');
    const vault = makeVault(), srv = await serve(vault, () => fs.readFileSync(path.join(__dirname, '../index.html')));
    const URL = `http://127.0.0.1:${srv.port}/?today=2026-12-10`;
    const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
    const seed = (q, x) => q.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); await s.save(bk0, { full: true }); s.close(); }, x);
    const storedB = q => q.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
    const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3lfA-')) });
    const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3lfB-')) });
    errLists.push(A.errs, B.errs);
    try {
      await A.p.goto(URL); await T.w(300); await seed(A.p, T.book()); await A.p.reload(); await T.w(400);
      await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
      await until(async () => !!(await A.p.$('[data-cloud=code]')));
      const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
      await A.p.click('#a3CloudSaved'); await until(() => vault.rows.size === 1);
      const own = T.book(); own.events.filter(e => e.acct === own.home.main.v.acct && (e.k === 'open' || e.k === 'check')).forEach(e => { e.a = 300000; });
      await B.p.goto(URL); await T.w(300); await seed(B.p, own); await B.p.reload(); await T.w(400);
      await B.p.click('#a3SetGo'); await T.w(200);
      await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
      ck('B5: a device with its own numbers is told first', await until(async () => !!(await B.p.$('[data-cloud=joinask]'))));
      const ask = await B.p.$eval('[data-cloud=joinask]', e => e.textContent).catch(() => '');
      ck('B5: it says the numbers here are kept as a copy and it will choose which to keep', /already has its own numbers/.test(ask) && /kept as a copy/.test(ask) && /choose which to keep/.test(ask), ask);
      const openB = c => c.events.find(e => e.k === 'open' && e.acct === own.home.main.v.acct).a;
      ck('B5: nothing on B has changed yet', openB(await storedB(B.p)) === 300000);
      await B.p.click('#a3CloudJoinNo'); await T.w(300);
      ck('B5: "Not now" leaves B as it was, with the cloud copy off', openB(await storedB(B.p)) === 300000 && !(await B.p.$('[data-cloud=joinask]')) && /^Off\./.test(await B.p.$eval('#a3CloudState', e => e.textContent)));
      await B.p.click('#a3CloudUse'); await until(async () => !!(await B.p.$('#a3CloudJoinYes')));
      await B.p.click('#a3CloudJoinYes');
      ck('B5: after "Use the code" B is asked which copy to keep', await until(async () => /Keep this one/.test(await B.p.$eval('#a3Set', e => e.textContent).catch(() => '')), 10000));
      const kept = await B.p.evaluate(async () => { const s = await BurrowStore.open(); try { await s.load(); return (await s.keptCopies()).map(c => c.why); } catch (e) { return String(e); } finally { s.close(); } });
      ck('B5: and a whole copy of its own numbers was kept first', JSON.stringify(kept).includes('Before this device joined the cloud copy'), JSON.stringify(kept));
    } finally {
      /* the vault answers 404 while it holds no copy (as in e3_cloud): that is not a page error */
      for (const l of [A.errs, B.errs]) { const keep = l.filter(e => !/Failed to load resource/.test(e)); l.length = 0; l.push(...keep); }
      await A.b.close(); await B.b.close(); await srv.close();
    }
  }

  /* B6: the made-up book on 25 Nov. ¥1,200 logged on Card A: its close day is not sure, so everything on it is paid on
     its next payment day, 10 Dec. The Undo bar says when it leaves the bank, so a safe to spend that does not drop (or
     rises) has its reason: "Logged ¥1,200 on Free to spend. It goes on Card A and leaves your bank when the card is paid
     on 10 Dec". A spend from the bank says nothing more ("Logged ¥500 on Free to spend").
     With no play amount (the made-up book's plan.shares is empty) everything on the cards comes off safe to spend now
     (M90, R1), so the card's words add ". It comes off safe to spend now": safe to spend drops by the 1,200 at once. */
  await fresh(bk);
  await go('2026-11-25');
  await p.tap('[data-tab="receipts"]'); await T.w(300);
  const pickAcct = name => p.evaluate(n => { const s = document.getElementById('rcAcct'); const o = [...s.options].find(x => x.textContent.trim() === n); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); }, name);
  await pickAcct('Card A'); await T.w(100);
  await p.tap('#rcAmt'); await p.keyboard.type('1200'); await p.click('#rcSave'); await T.w(500);
  const barB6 = await p.evaluate(() => (document.querySelector('#a3Msg .burrow-msg span') || {}).textContent || '');
  // old "... when the card is paid on 10 Dec"; now with ". It comes off safe to spend now" after it: no play amount, so
  // the cards come off safe to spend now (R1); the bank still pays it on 10 Dec
  ck('B6: on a card, the Undo bar says when it leaves the bank', barB6 === 'Logged ¥1,200 on Free to spend. It goes on Card A and leaves your bank when the card is paid on 10 Dec. It comes off safe to spend now', barB6);
  await pickAcct('Main bank'); await T.w(100);
  await p.tap('#rcAmt'); await p.keyboard.type('500'); await p.click('#rcSave'); await T.w(500);
  const barB6b = await p.evaluate(() => (document.querySelector('#a3Msg .burrow-msg span') || {}).textContent || '');
  ck('B6: from the bank, nothing more', barB6b === 'Logged ¥500 on Free to spend', barB6b);

  const errs = [].concat(...errLists); ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_listfix');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
