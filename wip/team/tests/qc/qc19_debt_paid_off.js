/* QC round 7 money accuracy blocker 2: Plan > All months marked a debt burrow "full" ("Oct 2027 Loan from Sam full") while Plan > Burrows said
   "Paid off Oct 2027". A debt reads "paid off" there too; a savings goal still reads "full".
   Made-up numbers.  Run: node tests/qc/qc19_debt_paid_off.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.cur = '$';
    S.cfg.bankStart = 3000; S.cfg.minBank = 0; S.steps = { a: [{ from: '2026-11', v: 2000 }] }; S.once = {}; S.items = {};
    const defs = { 'bill:rent': 900, 'bill:food': 300 }; S.plan.lines.forEach(l => { l.def = defs[l.key] || 0; });
    S.plan.goals = S.plan.goals.filter(g => g.emergency); const eg = S.plan.goals[0]; eg.target = 600; eg.start = 0; eg.monthly = 100; eg.stretch = 0;
    S.plan.goals.push({ id: 'sam1', name: 'Loan from Sam', target: 1200, start: 0, due: '', monthly: 100, slot: 3 });
    S.ui.gk = Object.assign({}, S.ui.gk, { sam1: 'debt' });
    S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-month'); await L.clickText(p, 'All months'); await w(600);
  const t = await p.evaluate(() => { const e = document.querySelector('#monthTable'); return { txt: e ? e.innerText.replace(/\s+/g, ' ') : '', labels: e ? [...e.querySelectorAll('tr[aria-label]')].map(r => r.getAttribute('aria-label')).filter(a => /Sam|Emergency/.test(a)) : [] }; });
  ck('All months: the debt is never "full"', !/Loan from Sam full/.test(t.txt) && !t.labels.some(a => /Loan from Sam full/.test(a)), t.txt.match(/.{20}Loan from Sam.{12}/g));
  ck('All months: the debt reads "Loan from Sam paid off"', /Loan from Sam paid off/.test(t.txt), t.txt.match(/.{20}Loan from Sam.{12}/g));
  ck('All months: the row label says paid off too', t.labels.some(a => /Loan from Sam paid off/.test(a)), t.labels);
  ck('All months: a savings goal still reads "full"', /Emergency fund full/.test(t.txt), t.txt.match(/.{20}Emergency fund.{12}/g));
  await L.clickText(p, 'Burrows'); await w(600);
  const g = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  ck('Plan > Burrows says the same: paid off', /Paid off/i.test(g), g.match(/.{40}Loan from Sam.{80}/));
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc19_debt_paid_off: ${bad} FAIL` : 'qc19_debt_paid_off: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc19_debt_paid_off: FAIL'); process.exit(1); });
