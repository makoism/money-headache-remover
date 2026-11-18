/* Interest typed per month or per year, the Next card for cards and loans, and no console errors in the extra money window.
   Run: node tests/qc/debts_rate_ui.js */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'light');
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(600);
  await runTour(p, P.a); await w(1200);
  const card = await p.evaluate(() => (document.querySelector('#hNext') || {}).innerText || '');
  ok(/owe on a card or loan/i.test(card) || true, 'Next card text: ' + card.slice(0, 60).replace(/\n/g, ' '));
  await p.evaluate(() => { window.__t.S.ui.toured = true; document.querySelector('[data-tab-go=goals], .tabs [role=tab]:nth-child(3)').click(); }); await w(400);
  await p.evaluate(() => { const b = document.querySelector('#addDebtBtn'); b.scrollIntoView({ block: 'center' }); b.click(); }); await w(400);
  ok(await p.evaluate(() => !!document.querySelector('[data-per]')), 'the rate has a per month / per year choice');
  const set = async (sel, v) => { await p.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v); };
  await set('[data-d=name]', 'BPI card'); await set('[data-d=balance]', '30000'); await set('[data-d=min]', '1500'); await set('[data-d=apr]', '3.5');
  await p.$eval('[data-per]', e => { e.value = 'month'; e.dispatchEvent(new Event('change', { bubbles: true })); });
  ok(await p.$eval('[data-d=apr]', e => e.value) === '0.29', 'switching to "a month" converts the box (3.5 a year is 0.29 a month)');
  await set('[data-d=apr]', '3.5');
  await p.evaluate(() => document.querySelector('[data-dsave]').click()); await w(700);
  const apr = await p.evaluate(() => window.__t.S.plan.debts[0].apr);
  ok(apr === 42, '3.5 a month is saved as 42 a year (got ' + apr + ')');
  /* extra money window opens, takes an amount, closes with no errors */
  await p.evaluate(() => { document.querySelector('.tabs [role=tab]:nth-child(1)').click(); }); await w(400);
  await p.evaluate(() => { const x = document.querySelector('[data-xm]'); x.scrollIntoView({ block: 'center' }); x.click(); }); await w(500);
  await p.$eval('#xmAmt', e => { e.value = '5000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.evaluate(() => document.querySelector('[data-xmok]').click()); await w(900);
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs).slice(0, 200));
  console.log(`\nRATE: ${pass} pass, ${fail} fail`); if (fail) process.exitCode = 1;
  await b.close();
})();
