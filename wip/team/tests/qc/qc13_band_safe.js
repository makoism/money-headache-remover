/* QC round 6 numbers gate 3: in a month where Free to spend is held back, Plan's top bar said "Free to spend: ¥0 left, Jul" while Receipts
   said "¥0 safe to spend" on the same day. The bar now uses the model's own words from the burrow map ("safe to spend", or "left, not safe
   to spend yet" when the typed bank cannot cover it), never its own.
   Made-up numbers.  Run: node tests/qc/qc13_band_safe.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e && !e.hidden ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const read = async p => { await L.tab(p, 'tab-month'); await w(400); const band = await t(p, '#mgBand .mg-s'); await L.tab(p, 'tab-receipts'); await w(400);
  const rc = await p.evaluate(() => (document.body.innerText.replace(/\s+/g, ' ').match(/Free to spend: [^.]*planned, [^.]*spent, [^.]*\./) || [''])[0]); return { band, rc }; };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  /* the plan is bigger than pay and the bank starts at zero: the month ends below zero, so all of Free to spend is held back */
  await L.base(p, { pay: 300000, bank: 0, min: 0, defs: { 'bill:rent': 280000, 'bill:food': 50000, envelope: 40000 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.rc(p, 1, 'bill:food', '2026-11-19', 'Made-up bread'); await w(400);
  const a = await read(p);
  ck('setup: Receipts says ¥0 safe to spend', /¥0 safe to spend\./.test(a.rc), a.rc);
  ck('held back: the Plan bar says "¥40,000 left, ¥0 safe to spend", as the Home tile does (QC round 10 numbers gate blocker 1; left, not planned, since QC round 13 numbers gate B1)', /Free to spend: ¥40,000 left, ¥0 safe to spend, Nov/.test(a.band), a.band);
  ck('held back: the Plan bar never says just "left" without the safe part', !/¥[\d,]+ left(?!, ¥[\d,]+ safe to spend)/.test(a.band), a.band);
  /* a typed bank lower than the bills still to pay and Free to spend: the map says "left, not safe to spend yet" */
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
  const c = await read(p);
  ck('setup: Receipts says left, not safe to spend yet', /left, not safe to spend yet\./.test(c.rc), c.rc);
  ck('not covered: the Plan bar says "left, not safe to spend yet"', /Free to spend: ¥[\d,]+ left, not safe to spend yet, Nov/.test(c.band), c.band);
  ck('not covered: the bar and Receipts give the same amount', (c.band.match(/¥[\d,]+/) || [])[0] === (c.rc.match(/(¥[\d,]+) left, not safe/) || [])[1], [c.band, c.rc]);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc13_band_safe: ${bad} FAIL` : 'qc13_band_safe: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_band_safe: FAIL'); process.exit(1); });
