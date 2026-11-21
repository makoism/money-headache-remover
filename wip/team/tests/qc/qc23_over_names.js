/* 38.31 number gate round 8, finding 3: the message after logging named only Free to spend, Bills and basics and the piles. Other and
   Investing were left out, so the places named did not add up to what the bank fell by. Every place that went past the plan is named,
   from the model's overBits, with its amount, and the amounts add up to what went past the plan this month (overNow).
   Sample numbers, Nov 2026: Free to spend 25,000 (plan 20,000), Food 41,000 (plan 31,000), Other 3,000 (no plan), then Investing 50,000.
   Made-up numbers.  Run: node tests/qc/qc23_over_names.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const cheer = p => p.evaluate(() => { const e = document.getElementById('cheer'); return e ? e.textContent.replace(/⁠/g, '') : ''; });
const overNow = p => p.evaluate(() => { const C = __t.calcAll(__t.S); return C.byYm['2026-11'].overNow; });
const parts = s => (s.match(/¥[\d,]+ over/g) || []).map(x => +x.replace(/[¥, a-z]/g, ''));
const sum = a => a.reduce((x, y) => x + y, 0);
(async () => {
  const { b, p, errs } = await R.phone({ w: 400, h: 860, dpr: 1, mobile: true });
  await clock(p, '2026-11-20T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.rc(p, 25000, 'envelope', '2026-11-10', 'Made-up a');
  await L.rc(p, 41000, 'bill:food', '2026-11-10', 'Made-up b');
  await L.rc(p, 3000, 'other', '2026-11-10', 'Made-up c');
  const a = await cheer(p), oa = await overNow(p);
  ck('after Other: the message names Other with its amount', /Other is ¥3,000 over/.test(a), a);
  ck('after Other: Free to spend and Bills and basics named with amounts', /Free to spend is ¥5,000 over/.test(a) && /Bills and basics are ¥10,000 over/.test(a), a);
  ck('after Other: the named amounts add up to what went past the plan (18,000)', oa === 18000 && sum(parts(a)) === oa, { a, oa });
  await L.rc(p, 50000, 'invest', '2026-11-11', 'Made-up d');
  const c = await cheer(p), oc = await overNow(p);
  ck('after Investing: the message names Investing with its amount', /Investing is ¥30,000 over/.test(c), c);
  ck('after Investing: Other is still named', /Other is ¥3,000 over/.test(c), c);
  ck('after Investing: the named amounts add up to what went past the plan', sum(parts(c)) === oc, { c, oc });
  /* own numbers: the status line on Home names Other and Investing too (it reads the same overBits) */
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; S.receipts = []; __t.persist(); __t.restructure(); });
  await L.rc(p, 4000, 'other', '2026-11-12', 'Made-up e');
  await L.rc(p, 26000, 'invest', '2026-11-12', 'Made-up f');
  const d = await cheer(p);
  ck('own numbers: the message names Other and Investing', /Other is ¥4,000 over/.test(d) && /Investing is ¥6,000 over/.test(d), d);
  await L.tab(p, 'tab-home'); await w(400);
  const st = await p.evaluate(() => { const e = document.querySelector('#hStatus'); return e ? e.innerText.replace(/\u2060/g, '').replace(/\s+/g, ' ') : ''; });
  ck('own numbers: the status line names Other and Investing', /Other is ¥4,000 over/.test(st) && /Investing is ¥6,000 over/.test(st), st);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc23_over_names: ${bad} FAIL` : 'qc23_over_names: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc23_over_names: FAIL'); process.exit(1); });
