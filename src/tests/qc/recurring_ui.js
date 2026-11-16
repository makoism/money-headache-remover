/* Repeating spending: added in Receipts, logged for every due day when the page opens, never twice.
   Run: node tests/qc/recurring_ui.js */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'light');
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(600);
  await runTour(p, P.a); await w(900);
  const key = 'money-map-template-v2';
  await p.evaluate(() => sessionStorage.setItem('__keep', '1'));
  /* plant a weekly repeat that started 3 weeks ago, then reopen the page */
  await p.evaluate(() => {
    const S = window.__t.S, d = new Date(); d.setDate(d.getDate() - 21);
    const from = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    S.plan.recurring = [{ id: 'r1', a: 250, c: S.plan.lines[0].key, n: 'Coffee', every: 'week', on: d.getDay(), from, last: '' }];
    S.receipts = []; window.__t.persist();
  }); await w(1200);
  await p.reload({ waitUntil: 'load' }); await w(1800);
  const n1 = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).receipts.filter(r => r.n === 'Coffee').length, key);
  ok(n1 >= 3 && n1 <= 4, 'opening the page logged the repeats that came due (' + n1 + ')');
  const dates = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).receipts.filter(r => r.n === 'Coffee').map(r => r.d), key);
  ok(new Set(dates).size === dates.length, 'one per day');
  await p.reload({ waitUntil: 'load' }); await w(1800);
  const n2 = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).receipts.filter(r => r.n === 'Coffee').length, key);
  ok(n2 === n1, 'opening again adds nothing (' + n2 + ')');
  await p.evaluate(() => document.querySelector('[data-tab=receipts], #tabReceipts, .tabs [role=tab]:nth-child(3)').click()); await w(500);
  const txt = await p.evaluate(() => (document.querySelector('#rcRepeat') || {}).innerText || '');
  ok(/250/.test(txt) && /Coffee|week/i.test(txt), 'the Receipts tab lists the repeat');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  console.log(`\nRECURRING: ${pass} pass, ${fail} fail`); if (fail) process.exitCode = 1;
  await b.close();
})();
