/* QC round 4 novice B1 (rest): with nothing saved yet, an open burrow said "$385 of $4,500, 8% full", the More card "$385 of $4,500 ...
   +$385 this month", and Plan > Burrows "$385 of $4,500" next to "Saved so far: $0" on the same card. The $385 is this month's plan.
   Saved means saved now; this month's planned money is named as planned. Made-up numbers.  Run: node tests/qc/qc11_saved_now.js */
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
  await L.base(p, { pay: 3200, bank: 1500, min: 0, noTrip: true, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, eT: 4500, eS: 0, eM: 385 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  const id = await p.evaluate(() => (__t.S.plan.goals.find(g => g.emergency) || {}).id);
  /* the More card (main goal) */
  const more = await p.evaluate(() => { const e = document.querySelector('.hwin .hw-nums'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; });
  ck('More card: "$0 saved now", not "$385 of $4,500"', /\$0 saved now/.test(more) && !/^\$385 of/.test(more), more);
  /* the open burrow */
  await p.evaluate(id => { const x = document.querySelector(`#hBur .hb-b[data-b="${id}"]`); x && x.click(); }, id); await w(1600);
  const pop = await p.evaluate(() => { const e = document.querySelector('#burrowView .bv-pop'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; });
  ck('open burrow: "$0 saved now"', /\$0 saved now/.test(pop), pop);
  ck('open burrow: the $385 is named as planned for the end of Nov', /\$385 by the end of Nov, as planned/.test(pop), pop);
  await p.evaluate(() => { const s = document.querySelector('.bv-sign'); s && s.click(); }); await w(800);
  /* Plan > Burrows */
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Burrows'); await w(600);
  const card = await p.evaluate(id => { const a = document.getElementById('jv-' + id), s = document.getElementById('gs-' + id); return (a ? a.textContent : '') + ' | ' + (s ? s.textContent : ''); }, id);
  ck('Plan > Burrows: "$385 of $4,500 by the end of Nov" next to "Saved so far: $0"', /\$385 of \$4,500 by the end of Nov/.test(card) && /Saved so far: \$0/.test(card), card);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_saved_now: ${bad} FAIL` : 'qc11_saved_now: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_saved_now: FAIL'); process.exit(1); });
