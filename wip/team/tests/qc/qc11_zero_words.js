/* QC round 4 wording 2: after Clear my plan and then pay typed on Plan, Settings still said "Everything starts at zero, so type over it."
   and "Everything is at zero now, start with your pay". These lines show only while the plan really is empty. Made-up numbers.
   Run: node tests/qc/qc11_zero_words.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const words = async p => { await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await L.settings(p); await w(400); return p.evaluate(() => ({ cap: (document.getElementById('makeCap') || {}).textContent || '', msg: (document.getElementById('bkMsg') || {}).textContent || '' })); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await w(400);
  const a = await words(p);
  ck('right after Clear my plan: Settings says everything is at zero', /zero/.test(a.cap + ' ' + a.msg), a);
  await p.evaluate(() => { const S = __t.S; S.steps.a = [{ from: '2026-11', v: 3000 }]; S.ui.done = Object.assign({}, S.ui.done, { pay: true }); __t.persist(); __t.restructure(); }); await w(500);
  const c = await words(p);
  ck('with pay typed: Settings no longer says everything starts at zero', !/Everything starts at zero/.test(c.cap), c.cap);
  ck('with pay typed: no "Everything is at zero now" message', !/Everything is at zero now/.test(c.msg), c.msg);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_zero_words: ${bad} FAIL` : 'qc11_zero_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_zero_words: FAIL'); process.exit(1); });
