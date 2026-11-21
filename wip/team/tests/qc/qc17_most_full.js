/* QC round 7 novice C5: Home said "Lisbon trip is the most full, 8%" the moment the burrow was added with nothing in it. The percent is
   what the plan will have by the end of this month, so the line says so. With no saving planned this month it stays as it was.
   Made-up numbers.  Run: node tests/qc/qc17_most_full.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const home = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => { const e = document.querySelector('#hStatus'); return { st: e ? e.innerText.replace(/\s+/g, ' ').trim() : '', all: document.body.innerText.replace(/\s+/g, ' ') }; }); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0, eT: 200000, eS: 0, eM: 0, tT: 60000, tM: 5000 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const bur = async () => { await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400); return t(p, '#hBur'); };
  const a = await bur();
  ck('nothing saved yet, saving planned this month: says the percent is by the end of Nov, as planned', /Trip is the most full, 8% by the end of Nov, as planned\./.test(a), a);
  await p.evaluate(() => { const S = __t.S, g = S.plan.goals.find(x => x.id === 'trip1'); g.start = 6000; g.monthly = 0; S.plan.goals.find(x => x.emergency).monthly = 0; __t.persist(); __t.restructure(); });
  const c = await bur();
  ck('already in the burrow, nothing planned this month: the plain line', /Trip is the most full, 10%\./.test(c) && !/as planned/.test(c), c);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc17_most_full: ${bad} FAIL` : 'qc17_most_full: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc17_most_full: FAIL'); process.exit(1); });
