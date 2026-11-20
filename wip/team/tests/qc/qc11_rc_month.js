/* QC round 4 north-star gate 1: after picking Dec on Plan, Receipts said "Receipts, December 2026 / No receipts this month." and showed a
   "Last month, Nov 2026" review card while Nov was still running ("$385 went to goals"). The review card shows only for a month that has
   ended, and a later month is named, not called "this month". Made-up numbers.  Run: node tests/qc/qc11_rc_month.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const pick = async (p, ym) => { await L.tab(p, 'tab-receipts'); await p.evaluate(ym => { const e = document.getElementById('rcMonth'); e.value = ym; e.dispatchEvent(new Event('change', { bubbles: true })); }, ym); await w(600); };
const look = p => p.evaluate(() => { const b = document.getElementById('rcBack'); return { back: !!(b && !b.hidden && b.getClientRects().length), backTxt: b ? b.innerText.replace(/\s+/g, ' ').slice(0, 120) : '', sum: document.getElementById('rcSum').innerText.trim() }; });
const open = async iso => {
  const x = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true }), p = x.p;
  await clock(p, iso); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, tT: 600, tM: 100, eT: 4500, eS: 0, eM: 385 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.rc(p, 45, 'envelope', '2026-11-18', 'Made-up lunch');
  return x;
};
(async () => {
  /* 20 Nov: Nov is running */
  const A = await open('2026-11-20T10:00:00');
  await pick(A.p, '2026-12'); const a = await look(A.p);
  ck('Dec picked on 20 Nov: no "Last month" review card for Nov, which has not ended', !a.back, a);
  ck('Dec picked on 20 Nov: the empty line names Dec, not "this month"', !/this month/.test(a.sum) && /Dec/.test(a.sum), a.sum);
  await pick(A.p, '2026-11'); const b = await look(A.p);
  ck('Nov (today\'s month): it still says what is spent this month', /\$45/.test(b.sum), b.sum);
  /* 5 Dec: Nov has ended, so Dec shows the review card for Nov */
  const B = await open('2026-12-05T10:00:00');
  await pick(B.p, '2026-12'); const c = await look(B.p);
  ck('5 Dec: Receipts for Dec shows the "Last month, Nov 2026" card', c.back && /Last month/.test(c.backTxt), c);
  ck('5 Dec: Dec with no receipts says "No receipts this month."', /No receipts this month/.test(c.sum), c.sum);
  const errs = A.errs.concat(B.errs).filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); await B.b.close();
  console.log(bad ? `qc11_rc_month: ${bad} FAIL` : 'qc11_rc_month: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_rc_month: FAIL'); process.exit(1); });
