/* QC10 numbers should-fix 4: with January the current month and November picked on Plan, Burrows said "Goals get X this month" and Plan
   said "Planned X this month", meaning November. Plan names the month it shows. Made-up numbers.
   Run: node tests/qc/qc10_month_words.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2027-01-06T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await p.select('#monthSel', '2026-11'); await w(600);
  await L.clickText(p, 'Month'); await w(400);
  const hero = await p.evaluate(() => document.getElementById('heroWk').innerText);
  await L.clickText(p, 'Burrows'); await w(500);
  const goals = await p.evaluate(() => document.getElementById('goalsSub').innerText);
  ck('Plan, Month: the Free to spend line names November, not "this month"', /(in|of) Nov/.test(hero) && !/this month/.test(hero), hero);
  ck('Plan, Burrows: "Goals get X in Nov", not "this month"', /Goals get .* in Nov/.test(goals) && !/this month/.test(goals), goals);
  /* QC10 round 3 numbers should-fix 5: with no pay, All months showed "−X" under "Not placed"; it is planned past pay and says so */
  await p.evaluate(() => { const S = __t.S; S.steps = { a: [{ from: '2026-11', v: 0 }] }; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await L.tab(p, 'tab-month'); await L.clickText(p, 'All months'); await w(500);
  const nov = await p.evaluate(() => { const r = document.querySelector('#monthTable tr[data-ym="2026-11"]'); return r ? r.cells[1].innerText.trim() : ''; });
  ck('All months, no pay: November reads "X past pay", never a minus under Not placed', /past pay/.test(nov) && !/[−-]/.test(nov), nov);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_month_words: ${bad} FAIL` : 'qc10_month_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_month_words: FAIL'); process.exit(1); });
