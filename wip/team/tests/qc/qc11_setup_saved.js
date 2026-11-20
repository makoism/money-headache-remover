/* QC round 4 north-star gate 6 (two reviewers): with "Already saved" left blank, setup's last screen said "$385 of $4,500 so far", as if
   $385 were saved already. It is this month's planned deposit. The screen says what is saved now and what the month brings:
   "$0 saved now, $385 by the end of Nov". Made-up numbers.  Run: node tests/qc/qc11_setup_saved.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
  await clock(p, '2026-11-20T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1500); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  const step = async () => { await p.evaluate(() => { const n = document.getElementById('tourNext'); n && n.click(); }); await w(700); };
  for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.getElementById('tourPay'))); i++) await step();
  await p.evaluate(() => { const e = document.getElementById('tourPay'); e.value = ''; e.focus(); }); await p.keyboard.type('3200'); await p.keyboard.press('Tab'); await w(300);
  let line = '', saved = null;
  for (let i = 0; i < 20; i++) {
    line = await p.evaluate(() => { const e = document.querySelector('#tour .tour-goal-l'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; });
    if (line) break;
    if (await p.evaluate(() => { const t = document.getElementById('tour'); return !t || t.hidden; })) break;
    if (await p.evaluate(() => { const e = document.getElementById('tourGCost'); return !!e && !e.value; })) { await p.evaluate(() => { const e = document.getElementById('tourGCost'); e.focus(); }); await p.keyboard.type('4500'); await p.keyboard.press('Tab'); await w(300); }   /* the emergency fund: $4,500 to hold, "Already saved" left blank */
    await step();
  }
  saved = await p.evaluate(() => { const S = __t.S, id = S.ui.main || (S.plan.goals[0] || {}).id, g = S.plan.goals.find(x => x.id === id) || S.plan.goals[0]; return g ? g.start || 0 : null; });
  ck('the last setup screen shows the main goal line', !!line, line);
  ck('nothing saved yet: it says "$0 saved now"', /\$0 saved now/.test(line), { line, saved });
  ck('it says what the end of Nov brings ("by the end of Nov")', /by the end of Nov/.test(line), line);
  ck('it no longer reads "$x of $y so far" as if saved already', !/so far/.test(line), line);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_setup_saved: ${bad} FAIL` : 'qc11_setup_saved: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_setup_saved: FAIL'); process.exit(1); });
