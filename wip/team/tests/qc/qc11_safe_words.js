/* QC round 4 numbers gate B1 (and north-star gate 4, money accuracy C1): with a typed bank lower than the bills still to pay and Free to
   spend, Home said "Free to spend ... left, not safe to spend yet" while Receipts and Plan > Month said "... safe to spend", and the Free to
   spend "How is this worked out?" panel gave a per week and per day figure with no warning. One rule everywhere: the model's notCovered.
   Made-up numbers.  Run: node tests/qc/qc11_safe_words.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const look = async p => {
  await L.tab(p, 'tab-home'); await w(400);
  const home = await p.evaluate(() => { const r = document.querySelector('#mpRooms [data-room="play"]'); return r ? r.getAttribute('aria-label') : ''; });
  await L.tab(p, 'tab-receipts'); await w(400); const rc = await t(p, '#rcSum');
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400); const plan = await t(p, '#rcLine');
  await L.tab(p, 'tab-home'); await w(300);
  await p.evaluate(() => { const x = document.createElement('button'); x.dataset.why = 'free'; document.body.appendChild(x); x.click(); x.remove(); }); await w(500); const why = await t(p, '#why .gw-card');
  await p.evaluate(() => { const e = document.querySelector('#why [data-whyno]'); e && e.click(); }); await w(400);
  return { home, rc, plan, why };
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.rc(p, 2000, 'envelope', '2026-11-19', 'Made-up coffee'); await w(400);
  /* a bank that covers everything: every screen says safe to spend */
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '290000'); await click(p, '#mpBankSave');
  const a = await look(p);
  ck('covered: Home says safe to spend', /safe to spend/.test(a.home) && !/not safe/.test(a.home), a.home);
  ck('covered: Receipts says safe to spend', /¥38,000 safe to spend/.test(a.rc), a.rc);
  ck('covered: Plan > Month says safe to spend', /¥38,000 safe to spend/.test(a.plan), a.plan);
  ck('covered: the panel gives a per day figure', /Per day/.test(a.why), a.why);
  /* a bank under bills still to pay (¥150,000) plus Free to spend left (¥38,000) */
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
  const c = await look(p);
  ck('not covered: Home says not safe to spend yet', /not safe to spend yet/.test(c.home), c.home);
  ck('not covered: Receipts says not safe to spend yet, never "safe to spend" alone', /¥38,000 left, not safe to spend yet/.test(c.rc) && !/¥38,000 safe to spend/.test(c.rc), c.rc);
  ck('not covered: Plan > Month says not safe to spend yet', /¥38,000 left, not safe to spend yet/.test(c.plan) && !/¥38,000 safe to spend/.test(c.plan), c.plan);
  ck('not covered: the panel says not safe yet and what makes it safe', /not safe to spend yet/i.test(c.why) && /Check your bank/.test(c.why), c.why);
  ck('not covered: the panel gives no per week or per day figure to spend', !/Per week|Per day/.test(c.why), c.why);
  /* another month: Home's rule is about today's bank, so a later month keeps its plan words */
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_safe_words: ${bad} FAIL` : 'qc11_safe_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_safe_words: FAIL'); process.exit(1); });
