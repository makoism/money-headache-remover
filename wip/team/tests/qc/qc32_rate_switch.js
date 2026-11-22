/* QC round 12 money accuracy 9: on a saved card, switching "a year" / "a month" saved the rate before the box was converted, so the rate
   changed (one run saved 100% a year while the box showed 288, with no message). Switching the unit never changes a saved rate, and a rate
   over 100% a year is refused with words, never cut to 100 in silence. Made-up numbers. Run: node tests/qc/qc32_rate_switch.js */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x === undefined ? '' : JSON.stringify(x)))); if (!c) bad++; };
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'light');
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(600);
  await runTour(p, P.a); await w(1200);
  await p.evaluate(() => { window.__t.S.ui.toured = true; document.querySelector('[data-tab-go=goals], .tabs [role=tab]:nth-child(3)').click(); }); await w(400);
  await p.evaluate(() => { const b = document.querySelector('#addDebtBtn'); b.scrollIntoView({ block: 'center' }); b.click(); }); await w(400);
  const set = async (sel, v) => { await p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v); };
  const per = async (v, root) => p.evaluate((v, root) => { const e = document.querySelector((root || '') + ' [data-per]'); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, v, root);
  await set('[data-d=name]', 'Test card'); await set('[data-d=balance]', '30000'); await set('[data-d=min]', '1500');
  /* a new card: 288 a year is refused with words */
  await set('[data-d=apr]', '288');
  await p.evaluate(() => document.querySelector('[data-dsave]').click()); await w(600);
  const m1 = await p.evaluate(() => ({ n: (window.__t.S.plan.debts || []).length, msg: (document.getElementById('de-new-msg') || {}).textContent || '' }));
  ck('a new card at 288% a year is not added', m1.n === 0, m1);
  ck('it says the rate is over 100% a year', /100%/.test(m1.msg), m1.msg);
  await set('[data-d=apr]', '24');
  await p.evaluate(() => document.querySelector('[data-dsave]').click()); await w(700);
  const d0 = await p.evaluate(() => window.__t.S.plan.debts && window.__t.S.plan.debts[0]);
  ck('24 a year is saved as 24', d0 && d0.apr === 24, d0);
  /* the saved card: switching the unit converts the box and keeps the rate */
  await p.evaluate(id => { const e = document.querySelector(`[data-dedit="${id}"]`); e.scrollIntoView({ block: 'center' }); e.click(); }, d0.id); await w(500);
  const root = `.dform[data-did="${d0.id}"]`;
  await per('month', root); await w(400);
  const a1 = await p.evaluate(r => ({ apr: window.__t.S.plan.debts[0].apr, box: document.querySelector(r + ' [data-d=apr]').value }), root);
  ck('switching to "a month": the saved rate stays 24 a year', a1.apr === 24, a1);
  ck('and the box shows 2 a month', a1.box === '2', a1);
  await per('year', root); await w(400);
  const a2 = await p.evaluate(r => ({ apr: window.__t.S.plan.debts[0].apr, box: document.querySelector(r + ' [data-d=apr]').value }), root);
  ck('switching back to "a year": still 24, box 24', a2.apr === 24 && a2.box === '24', a2);
  /* the saved card: typing 288 a year is refused with words, the rate stays */
  await set(root + ' [data-d=apr]', '288'); await w(400);
  const a3 = await p.evaluate(() => ({ apr: window.__t.S.plan.debts[0].apr, toast: [...document.querySelectorAll('.cheer,#cheer,[role=status]')].map(e => e.innerText).join(' | ') }));
  ck('288 a year on a saved card: the rate stays 24', a3.apr === 24, a3.apr);
  ck('288 a year on a saved card: it says why', /100%/.test(a3.toast), a3.toast.slice(-200));
  ck('no page errors', errs.length === 0, errs);
  console.log(bad ? `qc32_rate_switch: ${bad} FAIL` : 'qc32_rate_switch: ALL PASS'); process.exitCode = bad ? 1 : 0;
  await b.close();
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc32_rate_switch: FAIL'); process.exit(1); });
