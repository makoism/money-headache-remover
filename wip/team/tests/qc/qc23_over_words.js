/* 38.31 number gate round 8, finding 2: one over amount was written "−¥5,000 / over" on Home, "over ¥5,000" on Receipts and
   "¥5,000 over" in the status line. "−¥5,000 over" reads as a double negative. Wherever the word "over" goes with an amount it reads
   "¥5,000 over", with no minus; the Plan hero, where the amount stands alone as a balance, keeps its minus.
   Sample numbers, Nov 2026: Free to spend 25,000 (plan 20,000), Food 41,000 (plan 31,000), Other 3,000 (no plan).
   Made-up numbers.  Run: node tests/qc/qc23_over_words.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const body = p => p.evaluate(() => document.body.innerText.replace(/⁠/g, '').replace(/\s+/g, ' '));
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/⁠/g, '').replace(/\s+/g, ' ').trim() : ''; }, sel);
/* a minus amount next to the word "over", either way round, and "over" before an amount */
const dbl = s => s.match(/−¥[\d,]+(\.\d\d)?,? (\/ )?over|over −¥[\d,]+|over ¥[\d,]+/g);
(async () => {
  const { b, p, errs } = await R.phone({ w: 400, h: 860, dpr: 1, mobile: true });
  await clock(p, '2026-11-20T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.rc(p, 25000, 'envelope', '2026-11-10', 'Made-up a');
  await L.rc(p, 41000, 'bill:food', '2026-11-10', 'Made-up b');
  await L.rc(p, 3000, 'other', '2026-11-10', 'Made-up c');
  await L.tab(p, 'tab-home'); await w(400);
  const h = await body(p);
  ck('Home: no "−¥X over" and no "over ¥X"', !dbl(h), dbl(h));
  ck('Home: the Free to spend tile reads "¥5,000 over"', /Free to spend ¥5,000 over/.test(h), (h.match(/.{20}¥5,000.{20}/g) || []));
  ck('Home: the four numbers read "¥5,000 over in Nov"', /(^|[^−])¥5,000 over in Nov/.test(h), (h.match(/.{30}over in Nov/g) || []));
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400);
  const pl = await body(p);
  ck('Plan: no "−¥X over" and no "over ¥X"', !dbl(pl), dbl(pl));
  const hero = await t(p, '#heroNum');
  ck('Plan hero: the amount alone keeps its minus "−¥5,000"', hero === '−¥5,000', hero);
  await L.tab(p, 'tab-receipts'); await w(400);
  const rc = await body(p), cats = await t(p, '#rcCats');
  ck('Receipts: no "−¥X over" and no "over ¥X"', !dbl(rc), dbl(rc));
  ck('Receipts: rows read "¥10,000 over", "¥5,000 over", "¥3,000 over"', /¥10,000 over/.test(cats) && /¥5,000 over/.test(cats) && /¥3,000 over/.test(cats), cats);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc23_over_words: ${bad} FAIL` : 'qc23_over_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc23_over_words: FAIL'); process.exit(1); });
