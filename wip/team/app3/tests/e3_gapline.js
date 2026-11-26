#!/usr/bin/env node
/* [qc-novice C2; M7 M36 M45] a gap found at a bank check counts whole in the pay period the check is in (settled rule,
   CHECKGAP). Home says so on that bank's card, in the period it counts in: "¥37,400 you didn't log, found at your bank
   check of 10 Dec, counts as spending this pay period". Not said for a gain, nor once that period is over. Made-up book
   (e3_act_book.js): a check on pay day 10 Dec ticks everything due and finds the bank 37,400 lower. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const CK = require('../../engine/checkin.js');
const { actBook } = require('./e3_act_book.js');
function checked(day, fig) {
  const b = actBook(), bank = b.home.main.v.acct, tc = T.L.lookahead(b, day).checkIn.toConfirm;
  let n = 0;
  const out = CK.checkIn(b, { day, told: day + 'T01:00:00.000+09:00', newId: () => 'k7m2qa-zzzzzzzzzz-' + (n++), ticked: tc.map(o => o.item), expected: Object.fromEntries(tc.map(o => [o.item, o.amount])), lands: Object.fromEntries(tc.map(o => [o.item, o.lands])), figures: { [bank]: fig }, unticked: [] });
  return { b: CK.apply(b, out), bank };
}
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(require('os').tmpdir() + '/a3gl-') });
  const show = async (bk, day) => {
    await p.goto(T.URL0 + '?today=' + day); await T.w(300);
    await p.evaluate(async () => { for (const d of await indexedDB.databases()) await new Promise(r => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = () => r(); }); localStorage.clear(); });
    await p.reload(); await T.w(300);
    await p.evaluate(async x => { const s = await BurrowStore.open(); await s.load(); await s.save(x, { full: true }); s.close(); }, bk);
    await p.reload(); await T.w(400);
  };
  const line = id => p.$eval(`#a3Home [data-card=bank][data-acct="${id}"] [data-fig=gapcame]`, e => e.textContent).catch(() => null);
  let { b: bk, bank } = checked('2026-12-10', 350000);
  const f = T.L.lookahead(bk, '2026-12-10').accounts[bank].fillers;
  ck('the engine: a gap of 37,400 found at the check, in the period from 10 Dec', f.length === 1 && f[0].amount === 37400 && T.L.lookahead(bk, '2026-12-10').period.start === '2026-12-10', JSON.stringify(f));
  await show(bk, '2026-12-10');
  let t = await line(bank);
  ck('C2: Home says the gap counts as spending this pay period', t === "¥37,400 you didn't log, found at your bank check of 10 Dec, counts as spending this pay period", t);
  await show(bk, '2026-12-20');
  ck('C2: still said later in the same period', /¥37,400 you didn't log/.test(await line(bank) || ''));
  /* the next pay ticked on 12 Jan: a new period from 8 Jan (10 Jan is a Sunday) */
  { const D = '2027-01-12', tc = T.L.lookahead(bk, D).checkIn.toConfirm; let n = 50;
    bk = CK.apply(bk, CK.checkIn(bk, { day: D, told: D + 'T01:00:00.000+09:00', newId: () => 'k7m2qa-zzzzzzzzzz-' + (n++), ticked: tc.map(o => o.item), expected: Object.fromEntries(tc.map(o => [o.item, o.amount])), lands: Object.fromEntries(tc.map(o => [o.item, o.lands])), unticked: [] }));
    ck('the next period has started (the 10 Jan pay, moved before the weekend)', T.L.lookahead(bk, D).period.start === '2027-01-08', T.L.lookahead(bk, D).period.start); }
  await show(bk, '2027-01-12');
  ck('C2: not said once that period is over', (await line(bank)) === null, await line(bank));
  ({ b: bk, bank } = checked('2026-12-10', 400000));
  await show(bk, '2026-12-10');
  ck('C2: a bank higher than expected is not called spending', (await line(bank)) === null, await line(bank));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_gapline');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
