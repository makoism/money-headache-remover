/* 38.31 number gate round 8, finding 1: with sample numbers on, an ended month on Plan > Month said "¥13,000 safe to spend" for Free to
   spend the plan already counted as spent. A month that is over never says "safe to spend": it says "not logged as spent yet", the words
   used once your own numbers are in, whatever the sample state. The month of today still says "safe to spend".
   Made-up numbers.  Run: node tests/qc/qc23_ended_month.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/[\s⁠]+/g, ' ').trim() : ''; }, sel);
const pick = async (p, ym) => { await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(300); await p.select('#monthSel', ym); await w(600); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
  await clock(p, '2027-01-20T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  const sample = await p.evaluate(() => !__t.S.ui.sampleHidden);
  ck('sample numbers are on', sample, sample);
  for (const [i, a] of [2000, 3000, 2000].entries()) await L.rc(p, a, 'envelope', '2026-11-10', 'Made-up lunch ' + i);
  await L.rc(p, 1000, 'bill:food', '2026-11-11', 'Made-up food');
  await pick(p, '2026-11');
  const pl = await t(p, '#rcLine');
  ck('Plan > Month, Nov 2026 (ended): no "safe to spend"', !/safe to spend/.test(pl), pl);
  ck('Plan > Month, Nov 2026: "not logged as spent yet"', /¥7,000 spent, ¥13,000 not logged as spent yet/.test(pl), pl);
  await L.tab(p, 'tab-receipts'); await w(300);
  const rcs = await t(p, '#rcSum');
  ck('Receipts, Nov 2026 (ended): no "safe to spend"', !/safe to spend/.test(rcs), rcs);
  ck('Receipts, Nov 2026: "not logged as spent yet"', /¥13,000 not logged as spent yet/.test(rcs), rcs);
  /* the month of today still says safe to spend */
  await L.rc(p, 1000, 'envelope', '2027-01-15', 'Made-up tea');
  await pick(p, '2027-01');
  const pj = await t(p, '#rcLine');
  ck('Plan > Month, Jan 2027 (today): still "safe to spend"', /safe to spend/.test(pj) && !/not logged/.test(pj), pj);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc23_ended_month: ${bad} FAIL` : 'qc23_ended_month: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc23_ended_month: FAIL'); process.exit(1); });
