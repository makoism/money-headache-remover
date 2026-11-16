/* The pay helper: weekly, every two weeks, twice a month → one monthly number that lands in the Plan.
   Run: node tests/qc/pay_ui.js */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'light');
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(600);
  await runTour(p, P.a); await w(900);
  for (const [f, per, want] of [['twice', 15000, 30000], ['two', 10000, 21667], ['week', 5000, 21667], ['month', 42000, 42000]]) {
    await p.evaluate(() => document.querySelector('.tabs [role=tab]:nth-child(4), [data-tab=plan]').click()); await w(300);
    await p.evaluate(() => { const b = document.querySelector('#payBtn'); b.scrollIntoView({ block: 'center' }); b.click(); }); await w(400);
    await p.select('#payF', f); await p.$eval('#payA', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, String(per)); await w(150);
    const txt = await p.$eval('#payRes', e => e.textContent);
    ok(txt.includes('about') && /\d/.test(txt), f + ': says what it comes to (' + txt.slice(0, 60) + ')');
    await p.evaluate(() => document.querySelector('[data-payok]').click()); await w(700);
    const got = await p.evaluate(() => window.__t.calcAll(window.__t.S).months[0].a);
    ok(got === want, f + ': monthly pay is ' + want + ' (got ' + got + ')');
  }
  await p.evaluate(() => document.querySelector('#payBtn').click()); await w(300);
  await p.$eval('#payA', e => { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.evaluate(() => document.querySelector('[data-payok]').click()); await w(300);
  ok(await p.evaluate(() => !document.querySelector('#pay').hidden), 'no amount: the box stays open');
  await p.keyboard.press('Escape'); await w(400);
  ok(await p.evaluate(() => document.querySelector('#pay').hidden), 'Escape closes it');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  console.log(`\nPAY: ${pass} pass, ${fail} fail`); if (fail) process.exitCode = 1;
  await b.close();
})();
