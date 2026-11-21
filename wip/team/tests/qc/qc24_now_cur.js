/* QC round 8 north-star gate finding 4: Home's "What does your bank app show today?" box and "What's on the card now" box showed no currency
   sign, while every other amount box does. Both carry the sign in the same .inp wrapper and .yen span, and follow a change of currency.
   Made-up numbers.  Run: node tests/qc/qc24_now_cur.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const sign = (p, id) => p.evaluate(id => { const i = document.getElementById(id); if (!i || !i.offsetParent) return { shown: false }; const box = i.parentElement, y = box && box.classList.contains('inp') ? box.querySelector(':scope > .yen') : null; return { shown: true, inp: !!(box && box.classList.contains('inp')), yen: y ? y.textContent.trim() : null, seen: y ? !!y.offsetParent && y.getBoundingClientRect().width > 0 : false }; }, id);
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 2000, bank: 1000, min: 0, defs: { 'bill:rent': 800, 'bill:food': 300, envelope: 200, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 5000, eS: 0, eM: 100 });
  await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(400);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  let a = await sign(p, 'mpBankIn');
  ck('bank box: shown in an .inp box with a visible "$"', a.shown && a.inp && a.yen === '$' && a.seen, a);
  await L.typeIn(p, '#mpBankIn', '900'); await click(p, '#mpBankSave');
  await click(p, '#mpCardAdd');
  let c = await sign(p, 'mpCardOwed');
  ck('card box: shown in an .inp box with a visible "$"', c.shown && c.inp && c.yen === '$' && c.seen, c);
  /* another currency: both boxes follow it */
  await p.evaluate(() => { __t.S.ui.cur = '¥'; __t.persist(); __t.restructure(); }); await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400);
  if (!(await p.$('#mpCardOwed'))) await click(p, '#mpCardAdd');
  c = await sign(p, 'mpCardOwed');
  ck('card box after a change to yen: "¥"', c.shown && c.yen === '¥', c);
  await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(e => e.offsetParent && /^Cancel$/.test(e.innerText.trim()) && e.closest('.mp-cardf')); if (x) x.click(); }); await w(500);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  a = await sign(p, 'mpBankIn');
  ck('bank box after a change to yen: "¥"', a.shown && a.yen === '¥', a);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc24_now_cur: ${bad} FAIL` : 'qc24_now_cur: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc24_now_cur: FAIL'); process.exit(1); });
