/* QC round 6 money accuracy polish 7: a goal holding more than its amount read "Trip ¥150,000 of ¥100,000" and never said it was over.
   Home and Plan > Burrows now say "¥50,000 over the goal", a figure the model gives (goalRows .over), and the numbers stay the same.
   All months marked "Trip full" in Nov though Trip was full before Nov: only the month a goal first fills is marked.
   Made-up numbers.  Run: node tests/qc/qc15_goal_over.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const flat = s => String(s || '').replace(/\s+/g, ' ').trim();
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0, tT: 100000, tM: 15000, eT: 200000, eS: 50000, eM: 10000 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.plan.goals.find(g => g.id === 'trip1').start = 150000; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400);

  /* the model gives the figure; the numbers do not change */
  const m = await p.evaluate(() => { const C = __t.calcAll(__t.S), ym = C.months.find(x => !x.before).ym, rows = goalRows(__t.S, C, ym);
    const t = rows.find(r => r.id === 'trip1'), e = rows.find(r => r.emergency); return { ym, t: { saved: t.saved, savedNow: t.savedNow, target: t.target, over: t.over, overNow: t.overNow, pct: t.pct }, e: { over: e.over, saved: e.saved }, reached: C.reached }; });
  ck('model: Trip holds ¥150,000 of ¥100,000 (numbers unchanged)', m.t.saved === 150000 && m.t.savedNow === 150000 && m.t.target === 100000 && m.t.pct === 100, m.t);
  ck('model: Trip is ¥50,000 over the goal (over and overNow)', m.t.over === 50000 && m.t.overNow === 50000, m.t);
  ck('model: a goal below its amount is 0 over', m.e.over === 0, m.e);

  /* Home: the Trip tile and its open burrow say how much over */
  const tile = flat(await p.evaluate(() => { const b = document.querySelector('#hBur .hb-b[data-b="trip1"]'); return b ? b.innerText : ''; }));
  ck('Home tile: "Trip ¥150,000, ¥50,000 over the goal"', /¥150,000/.test(tile) && /¥50,000 over the goal/.test(tile), tile);
  const etile = flat(await p.evaluate(() => { const b = [...document.querySelectorAll('#hBur .hb-b[data-b]')].find(x => /Emergency/.test(x.innerText)); return b ? b.innerText : ''; }));
  ck('Home tile: a goal not yet full says no "over the goal"', etile && !/over the goal/.test(etile), etile);
  await p.evaluate(() => { const b = document.querySelector('#hBur .hb-b[data-b="trip1"]'); b && b.click(); }); await w(1500);
  const pop = flat(await p.evaluate(() => { const e = document.querySelector('.bv-pop'); return e ? e.innerText : ''; }));
  ck('Open Trip burrow: says "¥50,000 over the goal"', /¥150,000/.test(pop) && /¥50,000 over the goal/.test(pop), pop);
  await p.evaluate(() => { const s = document.querySelector('.bv-sign'); s && s.click(); }); await w(900);

  /* Plan > Burrows */
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Burrows'); await w(600);
  const jv = flat(await p.evaluate(() => { const e = document.getElementById('jv-trip1'); return e ? e.innerText : ''; }));
  ck('Plan > Burrows: Trip says "¥50,000 over the goal"', /¥150,000 of ¥100,000/.test(jv) && /¥50,000 over the goal/.test(jv), jv);
  const ejv = flat(await p.evaluate(() => { const g = __t.S.plan.goals.find(g => g.emergency), e = document.getElementById('jv-' + g.id); return e ? e.innerText : ''; }));
  ck('Plan > Burrows: Emergency fund says no "over the goal"', ejv && !/over the goal/.test(ejv), ejv);

  /* All months: Trip was full before the plan's first month, so no month is marked; the emergency fund is marked in the month it fills */
  await L.tab(p, 'tab-month'); await L.clickText(p, 'All months'); await w(600);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#monthTable tbody tr')].map(r => ({ ym: r.dataset.ym, t: r.innerText.replace(/\s+/g, ' ') })));
  const tripRows = rows.filter(r => /Trip full/.test(r.t));
  ck('All months: no month says "Trip full" (it was full before Nov)', tripRows.length === 0, tripRows);
  const eRows = rows.filter(r => /Emergency fund full/.test(r.t)), eFill = m.reached[await p.evaluate(() => __t.S.plan.goals.find(g => g.emergency).id)];
  ck('All months: "Emergency fund full" only in the month it first fills (' + eFill + ')', eRows.length === 1 && eRows[0].ym === eFill && eFill > m.ym, eRows);

  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc15_goal_over: ${bad} FAIL` : 'qc15_goal_over: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc15_goal_over: FAIL'); process.exit(1); });
