/* SF5 (QC8_NUMBERS_SHOULD_FIX.md): "Keep saving" on the longer emergency goal changed months already over. With the clock in January,
   the yes made November and December save toward the longer goal too (three times the monthly amount, two in months that had ended).
   The one right answer: a yes counts from the month it is said in. Months before it keep the Emergency fund at its target, exactly as
   they were before the yes. A copy saved before this rule (yes with no month) keeps working as it did. Made-up numbers.
   Part 1 runs the model in node; part 2 taps Keep saving on Home with the clock in January.
   Run: node tests/qc/qc10_stretch_from.js */
const fs = require('fs'), path = require('path');
const TEAM = path.resolve(__dirname, '../..');
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const src = fs.readFileSync(TEAM + '/model.js', 'utf8');
const M = new Function(src + ';return {presetState,calcAll,MONTHS,cleanPlan,goalInfo,proofOf};')();
const { presetState, calcAll, MONTHS, cleanPlan } = M;
const [NOV, DEC, JAN, FEB] = MONTHS;
const base = () => { const S = presetState('¥'), g = S.plan.goals.find(x => x.emergency); g.start = g.target; g.stretch = g.target * 3; g.monthly = 8900; return { S, g }; };
const pick = (C, ym, id) => { const m = C.byYm[ym]; return { bal: m.bal[id], saved: m.g[id] ? m.g[id].actual : 0, bankEnd: m.bankEnd, left: m.left }; };

/* ---------- part 1: the model ---------- */
{ const { S, g } = base(); const before = calcAll(S);
  ck('no answer yet: the fund stays at its target in Nov, Dec, Jan', [NOV, DEC, JAN].every(ym => before.byYm[ym].bal[g.id] === g.target), [NOV, DEC, JAN].map(ym => before.byYm[ym].bal[g.id]));
  g.stretchOn = true; g.stretchFrom = JAN; const after = calcAll(S);
  ck('yes in Jan: Nov and Dec are exactly as before (balance, saving, bank)', [NOV, DEC].every(ym => JSON.stringify(pick(after, ym, g.id)) === JSON.stringify(pick(before, ym, g.id))), [NOV, DEC].map(ym => [pick(before, ym, g.id), pick(after, ym, g.id)]));
  ck('yes in Jan: Jan saves toward the longer goal (8,900 more)', after.byYm[JAN].bal[g.id] === g.target + 8900, after.byYm[JAN].bal[g.id]);
  ck('yes in Jan: Feb keeps going (17,800 more)', after.byYm[FEB].bal[g.id] === g.target + 17800, after.byYm[FEB].bal[g.id]);
  const gi = M.goalInfo(S, after, g.id, DEC), gj = M.goalInfo(S, after, g.id, JAN);
  ck('Dec is judged against the target, Jan against the longer goal', gi.target === g.target && gj.target === g.stretch, { dec: gi.target, jan: gj.target });
  let proofOk = true; try { for (const ym of [NOV, DEC, JAN, FEB]) { const pf = M.proofOf(S, after, ym); if (pf && pf.ok === false) proofOk = false; } } catch (e) { proofOk = 'error ' + e.message; }
  ck('the proof still adds up in every month', proofOk === true, proofOk);
  /* QC10 numbers blocker 1: the fund reached its first target in Nov; after the yes in Jan it is not "full Nov" any more, it is on its
     way to the longer goal (a full date is only a month when the goal in force now is reached) */
  ck('after the yes: no full date before the month of the yes', !after.reached[g.id] || after.reached[g.id] >= JAN, after.reached[g.id]);
  ck('after the yes: Jan is not called full while it is under the longer goal', gj.state !== 'full' && gj.state !== 'paid', gj.state); }
{ const { S, g } = base(); g.stretchOn = true; const C = calcAll(S);
  ck('a copy saved before this rule (yes, no month): saves from the first month, as it did', C.byYm[NOV].bal[g.id] > g.target, C.byYm[NOV].bal[g.id]); }
{ const { S, g } = base(); g.stretchOn = true; g.stretchFrom = DEC;
  const P = cleanPlan(JSON.parse(JSON.stringify(S.plan))); const e = P.goals.find(x => x.emergency);
  ck('a saved copy keeps the month of the yes', e.stretchFrom === DEC, e);
  const bad1 = JSON.parse(JSON.stringify(S.plan)); bad1.goals.find(x => x.emergency).stretchFrom = 'soon'; const e1 = cleanPlan(bad1).goals.find(x => x.emergency);
  ck('a broken month in a saved copy is dropped, never used', !('stretchFrom' in e1), e1);
  const bad2 = JSON.parse(JSON.stringify(S.plan)); bad2.goals.find(x => x.emergency).stretchFrom = 12; const e2 = cleanPlan(bad2).goals.find(x => x.emergency);
  ck('a number for the month is dropped too', !('stretchFrom' in e2), e2); }

/* ---------- part 2: Keep saving on Home, the clock in January 2027 ---------- */
(async () => {
  const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
  process.env.BUILD = PAGE;
  const L = require('./lib_r12.js'); const R = L.R, w = R.w;
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2027-01-10T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0, eT: 200000, eS: 200000, eM: 8900 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; const eg = S.plan.goals.find(g => g.emergency); eg.stretch = 600000; delete eg.stretchOn; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  const bal = () => p.evaluate(() => { const C = __t.calcAll(__t.S), eg = __t.S.plan.goals.find(g => g.emergency); return ['2026-11', '2026-12', '2027-01', '2027-02'].map(ym => C.byYm[ym].bal[eg.id]); });
  const b0 = await bal();
  const has = await p.evaluate(() => !!document.querySelector('#hNext [data-stretch="yes"]'));
  ck('Home asks "Keep saving" once the fund is full', has);
  if (has) { await p.evaluate(() => document.querySelector('#hNext [data-stretch="yes"]').click()); await w(700); }
  const b1 = await bal(), eg = await p.evaluate(() => { const g = __t.S.plan.goals.find(g => g.emergency); return { on: g.stretchOn, from: g.stretchFrom }; });
  ck('the yes is kept with the month it was said in (2027-01)', eg.on === true && eg.from === '2027-01', eg);
  ck('Nov and Dec 2026 are unchanged by the yes', b1[0] === b0[0] && b1[1] === b0[1], { before: b0, after: b1 });
  ck('Jan 2027 saves 8,900 toward the longer goal', b1[2] === b0[2] + 8900, { before: b0, after: b1 });
  await p.reload(); await w(1500);
  const eg2 = await p.evaluate(() => { const g = __t.S.plan.goals.find(g => g.emergency); return { on: g.stretchOn, from: g.stretchFrom }; });
  ck('after a reload the month of the yes is still there', eg2.on === true && eg2.from === '2027-01', eg2);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_stretch_from: ${bad} FAIL` : 'qc10_stretch_from: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_stretch_from: FAIL'); process.exit(1); });
