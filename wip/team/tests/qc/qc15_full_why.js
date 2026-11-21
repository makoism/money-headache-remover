/* QC round 6 numbers gate 2: after "Keep saving" on the full Emergency fund and "Put it toward Emergency fund", the month-end card said
   "¥18,000 put toward Emergency fund / ¥318,000 to go ... The other ¥12,000 stays in the bank." with no reason why ¥12,000 did not go in.
   It now says "November's goal was full at ¥360,000, so the other ¥12,000 stays in the bank.", amounts and month from the model.
   Made-up numbers.  Run: node tests/qc/qc15_full_why.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const card = p => p.evaluate(() => { const n = document.querySelector('#hNext'); return n && !n.hidden ? n.innerText.replace(/\s+/g, ' ').trim() : ''; });
const yen = v => '¥' + Math.round(v).toLocaleString('en-US');
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-12-05T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0, noTrip: true, eT: 360000, eS: 300000, eM: 42000, defs: { 'bill:rent': 80000, 'bill:food': 40000, envelope: 30000, education: 0, invest: 0, give: 0 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true;
    const eg = S.plan.goals.find(g => g.emergency); eg.stretch = 720000; delete eg.stretchOn; delete eg.stretchFrom; S.ui.main = eg.id; __t.persist(); __t.restructure(); });
  await L.rc(p, 9000, 'envelope', '2026-11-21', 'Made-up lunch'); await w(400);
  await L.tab(p, 'tab-home'); await w(400);
  await p.evaluate(() => { const e = document.querySelector('#hNext [data-stretch="yes"]'); e && e.click(); }); await w(700);
  const q = await card(p);
  ck('setup: the month-end question is on Home after Keep saving', /put it toward/i.test(q), q);
  await p.evaluate(() => { const e = document.querySelector('#hNext [data-sweep]'); e && e.click(); }); await w(900);
  const c = await card(p);
  const m = await p.evaluate(() => { const C = __t.calcAll(__t.S), mm = C.byYm['2026-11']; return { used: mm.topup && mm.topup.used, rest: mm.credit, cap: mm.topup && mm.topup.cap, full: mm.topup && mm.topup.full }; });
  ck('the model says November\'s goal was full at ¥360,000 and some money stays in the bank', m.cap === 360000 && m.full === true && m.rest > 0 && m.used > 0, m);
  ck('the card says the amount put toward the Emergency fund', c.includes(yen(m.used) + ' put toward Emergency fund'), c);
  ck('the card says why the rest stays: "November\'s goal was full at ¥360,000, so the other ' + yen(m.rest) + ' stays in the bank."',
    c.includes(`November's goal was full at ${yen(m.cap)}, so the other ${yen(m.rest)} stays in the bank.`), c);
  ck('the old line with no reason is gone', !/to go\.[^.]*\. The other ¥[\d,]+ stays in the bank\./.test(c) && !/Full [A-Z][a-z]+ \d{4}\. The other/.test(c), c);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc15_full_why: ${bad} FAIL` : 'qc15_full_why: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc15_full_why: FAIL'); process.exit(1); });
