/* QC round 5 north-star gate 1: with a typed bank lower than the bills still to pay and Free to spend, the Free to spend card said
   "not safe to spend yet" while the status box at the top of Home said "You are okay ... X is free to spend". One verdict on Home.
   Made-up numbers.  Run: node tests/qc/qc12_status_safe.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const home = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => { const e = document.querySelector('#hStatus'); return { st: e ? e.innerText.replace(/\s+/g, ' ').trim() : '', all: document.body.innerText.replace(/\s+/g, ' ') }; }); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.rc(p, 2000, 'envelope', '2026-11-19', 'Made-up coffee'); await w(400);
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '290000'); await click(p, '#mpBankSave');
  const a = await home(p);
  ck('covered: the status box may say Free to spend money is free to spend', /You are okay/.test(a.st) && /is free to spend/.test(a.st), a.st);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
  const c = await home(p);
  ck('not covered: the status box does not say "You are okay"', !/You are okay/.test(c.st), c.st);
  ck('not covered: Home never says Free to spend money "is free to spend"', !/is free to spend/.test(c.all), c.all.match(/.{80}is free to spend.{40}/));
  ck('not covered: the status box says not safe to spend yet', /not safe to spend yet/i.test(c.st), c.st);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc12_status_safe: ${bad} FAIL` : 'qc12_status_safe: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc12_status_safe: FAIL'); process.exit(1); });
