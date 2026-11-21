/* QC round 4 numbers gate B2: the "How is this worked out?" panel (Where you stand) left out spending past the plan, so its rows did not
   add up: start + left in the month was not the end balance. It names "Spent past the plan so far", and the rows add up to the cent.
   Made-up numbers.  Run: node tests/qc/qc11_why_rows.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 600)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const num = s => { const m = String(s).replace(/,/g, '').match(/(−|-)?\u2060?\$?([\d.]+)/); return m ? (m[1] ? -1 : 1) * +m[2] : NaN; };
const panel = async p => {
  await L.tab(p, 'tab-home'); await w(300);
  await p.evaluate(() => { const x = document.createElement('button'); x.dataset.why = 'month'; document.body.appendChild(x); x.click(); x.remove(); }); await w(500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#why .whyl > div')].map(d => [d.querySelector('dt').innerText.trim(), d.querySelector('dd').innerText.trim()]));
  await p.evaluate(() => { const e = document.querySelector('#why [data-whyno]'); e && e.click(); }); await w(300);
  return rows;
};
const adds = rows => { const g = k => { const r = rows.find(x => x[0] === k); return r ? num(r[1]) : 0; };
  const start = g('Balance at the start'), left = g('Left in the month'), over = g('Spent past the plan in Nov'), back = g('Free to spend not spent, back in the bank'), end = g('Balance at the end');
  return { ok: Math.abs(start + left + over + back - end) < 0.005, start, left, over, back, end }; };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1450, min: 0, defs: { 'bill:rent': 1200, 'bill:food': 420.5, envelope: 389.5, education: 100, invest: 100, give: 50 }, tT: 600, tM: 100, eT: 3000, eS: 500, eM: 100 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const r0 = await panel(p);
  ck('no receipts: the rows add up', adds(r0).ok, r0);
  ck('no receipts: no "Spent past the plan" row', !r0.some(r => /Spent past the plan/.test(r[0])), r0);
  await L.rc(p, 420, 'envelope', '2026-11-19', 'Made-up shoes');
  await L.rc(p, 450.25, 'bill:food', '2026-11-19', 'Made-up shop');
  await L.rc(p, 12.34, 'other', '2026-11-19', 'Made-up thing');
  const r1 = await panel(p), a1 = adds(r1);
  ck('past the plan: the panel names "Spent past the plan in Nov" −$72.59 (QC round 5: it covers this month only)', r1.some(r => r[0] === 'Spent past the plan in Nov' && /^−\u2060?\$72\.59$/.test(r[1])), r1);
  ck('past the plan: start + left + past the plan = end, to the cent', a1.ok, a1);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_why_rows: ${bad} FAIL` : 'qc11_why_rows: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_why_rows: FAIL'); process.exit(1); });
