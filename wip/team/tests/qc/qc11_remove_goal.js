/* QC round 4 data safety 3: Remove goal said "Tap again: removes Emergency fund and its $835 saved." while the same card said "Saved so
   far: $500. Plan adds $335 in Nov." The confirm names what is saved now and what is planned this month. Made-up numbers.
   Run: node tests/qc/qc11_remove_goal.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-20T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0, noTrip: true, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, eT: 4500, eS: 500, eM: 335 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const id = await p.evaluate(() => (__t.S.plan.goals.find(g => g.emergency) || {}).id);
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Burrows'); await w(500);
  await p.evaluate(id => { const c = document.querySelector(`[data-gid="${id}"] [data-edit], [data-gid="${id}"] [data-gedit]`) || [...document.querySelectorAll(`[data-gid="${id}"] button`)].find(x => /Edit goal/.test(x.textContent)); c && c.click(); }, id); await w(500);
  await p.evaluate(id => { const d = document.querySelector(`[data-gid="${id}"] [data-gdel]`); d && d.click(); }, id); await w(400);
  const said = await p.evaluate(id => { const d = document.querySelector(`[data-gid="${id}"] [data-gdel]`); return d ? (d.textContent + ' ' + (d.getAttribute('aria-label') || '') + ' ' + (document.getElementById('cheer') || {}).textContent) : '(no Remove goal)'; }, id);
  ck('the confirm says $500 saved, not $835', /\$500 saved/.test(said) && !/\$835/.test(said), said);
  ck('the confirm names the $335 planned this month', /\$335 planned this month/.test(said), said);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_remove_goal: ${bad} FAIL` : 'qc11_remove_goal: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_remove_goal: FAIL'); process.exit(1); });
