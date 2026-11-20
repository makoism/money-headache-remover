/* QC round 4 money accuracy B3: "Loan from mum", 1,200 owed, 300 paid off, due 15 Dec, checked on 20 Nov. Home said "Loan from mum is
   paid off.", More said "Done", and the Halfway and Goal full badges were earned, while 900 is still owed today: the end of month figure
   is the plan, not what happened. A goal is called done, and earns a badge, only from what it holds at the start of this month; until
   then Home says it is paid off at the end of the month, as planned. Made-up numbers.  Run: node tests/qc/qc11_debt_planned.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const look = async p => { await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(700);
  return p.evaluate(() => ({ bur: (document.getElementById('hBur') || {}).textContent || '', goals: (document.getElementById('hGoals') || document.body).textContent.replace(/\s+/g, ' '), bd: Object.keys(__t.S.ui.bd || {}) })); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-20T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0, noTrip: true, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 300, education: 50, invest: 50, give: 50 }, eT: 4500, eS: 900, eM: 100 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.plan.goals.unshift({ id: 'mum', name: 'Loan from mum', target: 1200, start: 300, due: '2026-12-15', monthly: 900, slot: 4 }); S.ui.gk = Object.assign({}, S.ui.gk, { mum: 'debt' }); S.ui.main = 'mum';
    S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; delete S.ui.bd; __t.persist(); __t.restructure(); });
  const a = await look(p);
  const g = await p.evaluate(() => { const C = __t.calcAll(__t.S), m = C.byYm['2026-11']; return { start: m.balBefore.mum, end: m.bal.mum }; });
  ck('the plan pays the loan off by the end of Nov (start ' + g.start + ', end ' + g.end + ')', g.start === 300 && g.end >= 1200, g);
  ck('Home does not say the loan "is paid off." while 900 is still owed', !/Loan from mum is paid off\./.test(a.bur), a.bur.slice(0, 300));
  ck('Home says it is paid off at the end of Nov, as planned', /Loan from mum is paid off at the end of Nov, as planned/.test(a.bur), a.bur.slice(0, 300));
  ck('no "Goal full" badge for a planned payment', !a.bd.includes('full'), a.bd);
  ck('no "Halfway" badge: 300 of 1,200 is paid today (the emergency fund is at 20%)', !a.bd.includes('half'), a.bd);
  /* on 5 Dec the Nov payment has happened: now it is paid off, and the badge is earned */
  const B = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(B.p, '2026-12-05T10:00:00'); await B.p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(B.p);
  await B.p.evaluate(s => { const S = __t.S, d = JSON.parse(JSON.stringify(s)); Object.keys(d).forEach(k => { S[k] = d[k]; }); delete S.ui.bd; __t.persist(); __t.restructure(); }, await p.evaluate(() => JSON.parse(JSON.stringify(__t.S))));
  const c = await look(B.p);
  ck('5 Dec: the Goal full badge is earned once the loan is paid off', c.bd.includes('full'), c.bd);
  const e2 = errs.concat(B.errs).filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close(); await B.b.close();
  console.log(bad ? `qc11_debt_planned: ${bad} FAIL` : 'qc11_debt_planned: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_debt_planned: FAIL'); process.exit(1); });
