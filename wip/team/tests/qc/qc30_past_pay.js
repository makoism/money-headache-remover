/* QC round 10 numbers gate blocker 2: All months said "¥20,000 past pay" for a month whose own view says "This month you spend ¥53,800
   more than your pay, ¥33,800 of it borrowed. Your balance covers the other ¥20,000". ¥20,000 is past pay and borrowing. All months now
   gives the month's own figure: "¥53,800 past pay". And a month covered only by borrowing ("¥300 more planned than your pay, ¥400
   borrowed") no longer reads ¥0 under Not placed. Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc30_past_pay.js */
const PAGE = process.env.PAGE || process.env.BUILD || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 600)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const t = s => (s || '').replace(/⁠/g, '').replace(/\s+/g, ' ').trim();
const month = async p => { await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400); return p.evaluate(() => { const t = s => (s || '').replace(/⁠/g, '').replace(/\s+/g, ' ').trim(); return { verdict: t(document.getElementById('verdict').textContent), dock: t(document.getElementById('dockNum').textContent) + ' ' + t(document.getElementById('dockTxt').textContent), btns: [...document.querySelectorAll('#fixBtns button')].map(b => t(b.textContent)) }; }); };
const allMonths = async (p, ym) => { await L.tab(p, 'tab-month'); await L.clickText(p, 'All months'); await w(500); const r = await p.evaluate(ym => { const tr = document.querySelector(`#monthTable tr[data-ym="${ym}"]`); return tr ? [...tr.children].map(td => td.textContent) : []; }, ym); await L.clickText(p, 'Month'); await w(300); return r.map(t); };
const setup = async (p, o) => {
  await L.zero(p); await p.evaluate(c => { __t.S.ui.cur = c; }, o.cur);
  await L.base(p, o);
  await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  /* 1. pay 300,000, bills 353,800, bank 50,000, minimum 30,000, 100,000 in the emergency fund: the bank would end at -3,800, so 33,800 is borrowed */
  await setup(p, { cur: '¥', pay: 300000, bank: 50000, min: 30000, defs: { 'bill:rent': 300000, 'bill:food': 53800, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 1000000, eS: 100000, eM: 0 });
  let m = await month(p);
  ck('setup: Plan offers "Borrow ¥33,800 from emergency fund"', m.btns.includes('Borrow ¥33,800 from emergency fund'), m.btns);
  await p.evaluate(() => { const x = document.querySelector('[data-fx="borrow"]'); x && x.click(); }); await w(500);
  m = await month(p);
  ck('the month says the plan spends ¥53,800 more than pay, ¥33,800 of it borrowed', /¥53,800 more than your pay, ¥33,800 of it borrowed/.test(m.verdict), m.verdict);
  let row = await allMonths(p, '2026-11');
  ck('All months gives the month\'s own figure: "¥53,800 past pay"', row[1] === '¥53,800 past pay', row);
  ck('All months never says "¥20,000 past pay" (that part is past pay and borrowing)', !/¥20,000/.test(row.join(' ')), row);
  /* 2. a month covered only by borrowing: pay 2,000, bills 2,300, bank 100, minimum 200: 400 borrowed, the plan passes pay by 300 */
  await setup(p, { cur: '$', pay: 2000, bank: 100, min: 200, defs: { 'bill:rent': 1800, 'bill:food': 500, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 10000, eS: 3000, eM: 0 });
  await month(p); await p.evaluate(() => { const x = document.querySelector('[data-fx="borrow"]'); x && x.click(); }); await w(500);
  m = await month(p);
  ck('the month\'s line says $300 more planned than your pay, $400 borrowed', /^\$300 more planned than your pay in Nov, \$400 borrowed/.test(m.dock), m.dock);
  row = await allMonths(p, '2026-11');
  ck('All months says "$300 past pay", not $0 under Not placed', row[1] === '$300 past pay', row);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc30_past_pay: ${bad} FAIL` : 'qc30_past_pay: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc30_past_pay: FAIL'); process.exit(1); });
