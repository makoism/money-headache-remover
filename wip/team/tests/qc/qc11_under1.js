/* QC round 4 money accuracy (confusing): with a large pay, the Plan row said "$1.01 under 1%" while the sentence under it said "Bills
   and basics are 0% of pay", and the bar's tip said "0% of pay". A place with money never reads 0%: "under 1% of pay" everywhere.
   Made-up numbers.  Run: node tests/qc/qc11_under1.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 300000, bank: 1500, min: 0, defs: { 'bill:rent': 1.01, 'bill:food': 0, envelope: 385, education: 100, invest: 100, give: 50 } }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(500);
  const t = await p.evaluate(() => ({ note: (document.getElementById('jarNote') || {}).textContent || '', tips: [...document.querySelectorAll('#bar [data-tip]')].map(d => d.dataset.tip.replace(/<[^>]+>/g, ' ')).join(' | ') }));
  ck('the sentence says "under 1% of pay", not "0% of pay"', /Bills and basics are under 1% of pay/.test(t.note) && !/\b0% of pay/.test(t.note), t.note);
  ck('the bar tip for Bills and basics says "under 1% of pay"', /Bills and basics[^|]*under 1% of pay/.test(t.tips) && !/\b0% of pay/.test(t.tips), t.tips);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_under1: ${bad} FAIL` : 'qc11_under1: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_under1: FAIL'); process.exit(1); });
