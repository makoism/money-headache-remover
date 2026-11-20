/* QC round 4 money accuracy (polish): "That amount is too big. The most is 1,000,000,000. Type it again." stayed on the Bills step after
   a valid pay, and "Only two digits after the point..." still showed on Setup done. A message about a box goes when the step changes.
   Made-up numbers.  Run: node tests/qc/qc11_old_errors.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 300)); } };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
const tap = async (p, id) => { await p.evaluate(id => { const n = document.getElementById(id); n && n.click(); }, id); await w(500); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1500);
  for (let i = 0; i < 6 && !(await p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]'))); i++) await tap(p, 'tourNext');
  await p.evaluate(() => { const i = [...document.querySelectorAll('#tourBody input[name=tourCur]')].find(x => x.value === '$'); i && i.click(); }); await w(400);
  for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.getElementById('tourPay'))); i++) await tap(p, 'tourNext');
  await p.focus('#tourPay'); await p.keyboard.type('99999999999'); await w(300);
  const said = await p.evaluate(() => (document.getElementById('cheer') || {}).textContent || '');
  ck('typing a too big pay says so', /too big/.test(said), said);
  await p.evaluate(() => { const e = document.getElementById('tourPay'); e.value = ''; }); await p.focus('#tourPay'); await p.keyboard.type('3000.505'); await w(150);   /* a second message, then Next at once */
  await p.evaluate(() => { const n = document.getElementById('tourNext'); n && n.click(); }); await w(250);
  const left = await p.evaluate(() => { const c = document.getElementById('cheer'); return c && c.classList.contains('on') ? c.textContent : ''; });
  ck('on the next step the old message is gone', !/too big|two digits/.test(left), left);
  ck('no page errors', errs.length === 0, errs.slice(0, 2));
  await b.close();
  console.log(bad ? `qc11_old_errors: ${bad} FAIL` : 'qc11_old_errors: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_old_errors: FAIL'); process.exit(1); });
