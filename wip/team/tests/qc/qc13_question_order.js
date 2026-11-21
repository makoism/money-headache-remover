/* QC round 6 numbers gate 1: Home said "¥30,000 of Free to spend is left out until you answer the question on Home." while the only card
   on Home was "Emergency fund is full ... Keep saving / Stop here"; the November month-end question came only after that one was answered.
   Home keeps one card at a time, so the sentence says the month-end question comes after the Emergency fund question.
   Made-up numbers.  Run: node tests/qc/qc13_question_order.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const home = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => {
  const n = document.querySelector('#hNext'), pr = document.querySelector('.mp-proof');
  return { card: n && !n.hidden ? n.innerText.replace(/\s+/g, ' ').trim() : '', monthEnd: !!(n && !n.hidden && n.querySelector('[data-sweepbank]')),
    stretch: !!(n && !n.hidden && n.querySelector('[data-stretch]')), proof: pr ? pr.innerText.replace(/\s+/g, ' ').trim() : '' }; }); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-12-05T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0, noTrip: true, eT: 360000, eS: 300000, eM: 42000, defs: { 'bill:rent': 80000, 'bill:food': 40000, envelope: 30000, education: 0, invest: 0, give: 0 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true;
    const eg = S.plan.goals.find(g => g.emergency); eg.stretch = 720000; delete eg.stretchOn; delete eg.stretchFrom; S.ui.main = eg.id; __t.persist(); __t.restructure(); });
  await L.rc(p, 9000, 'envelope', '2026-11-21', 'Made-up lunch'); await w(400);
  const a = await home(p);
  ck('setup: Home shows the Emergency fund question first', a.stretch && !a.monthEnd, a.card);
  ck('setup: Home leaves out November\'s Free to spend', /left out until you answer/.test(a.proof), a.proof);
  ck('the sentence does not point at a question that is not on Home', !/until you answer the question on Home\./.test(a.proof), a.proof);
  ck('the sentence says the month-end question comes after the Emergency fund question', /until you answer the month-end question, which comes after the Emergency fund question on Home\./.test(a.proof), a.proof);
  await p.evaluate(() => { const e = document.querySelector('#hNext [data-stretch="no"]'); e && e.click(); }); await w(700);
  const c = await home(p);
  ck('after Stop here: the month-end question is on Home', c.monthEnd, c.card);
  ck('after Stop here: the sentence points at the question on Home', /left out until you answer the question on Home\./.test(c.proof), c.proof);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc13_question_order: ${bad} FAIL` : 'qc13_question_order: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_question_order: FAIL'); process.exit(1); });
