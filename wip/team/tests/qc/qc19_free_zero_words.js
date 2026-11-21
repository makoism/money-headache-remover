/* QC round 7 money accuracy polish 2: with bills above pay, Home said "This counts your planned Free to spend as already spent." even when
   Free to spend was 0. That sentence is only there when some Free to spend is planned (the model's planned amount).
   Made-up numbers.  Run: node tests/qc/qc19_free_zero_words.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const SENT = 'This counts your planned Free to spend as already spent.';
const warnWith = async (p, play) => {
  await p.evaluate(play => { const S = __t.S; S.ui.cur = '$';
    S.cfg.bankStart = 100; S.cfg.minBank = 0; S.steps = { a: [{ from: '2026-11', v: 2000 }] }; S.once = {}; S.items = {};
    const defs = { 'bill:rent': 2200, 'bill:food': 300, envelope: play }; S.plan.lines.forEach(l => { l.def = defs[l.key] || 0; });
    S.plan.goals = S.plan.goals.filter(g => g.emergency); const eg = S.plan.goals[0]; eg.target = 0; eg.start = 0; delete eg.monthly; eg.stretch = 0;
    S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); }, play);
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
  return p.evaluate(() => { const e = document.querySelector('#hMap .mp-warn'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; });
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await w(400); await skip(p);
  const a = await warnWith(p, 0);
  ck('bills above pay, no Free to spend: Home warns the bank ends below zero', /below zero/.test(a), a);
  ck('no Free to spend planned: the sentence about planned Free to spend is left out', a.indexOf(SENT) < 0, a);
  const c = await warnWith(p, 300);
  ck('bills above pay, $300 Free to spend planned: the warning is there', /below zero/.test(c), c);
  ck('Free to spend planned: the sentence stays', c.indexOf(SENT) >= 0, c);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc19_free_zero_words: ${bad} FAIL` : 'qc19_free_zero_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc19_free_zero_words: FAIL'); process.exit(1); });
