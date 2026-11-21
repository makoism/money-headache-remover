/* QC round 7 novice C2: with Free to spend not safe yet, the status box's "How is this worked out?" sheet said only "Everything planned
   fits in your pay". It now carries the Free to spend sheet's sentence on why it is not safe and when it becomes safe.
   Made-up numbers.  Run: node tests/qc/qc17_status_sheet_safe.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const SENT = 'Not safe to spend yet: your bank is less than your bills still to pay and Free to spend. It becomes safe to spend when your pay lands: then tap Check your bank on Home and type the new balance.';
const sheet = async (p, k) => { await click(p, `[data-why="${k}"]`); const s = await t(p, '#why'); await click(p, '#why [data-whyno].btn'); return s; };
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
  await home(p);
  const sa = await sheet(p, 'status');
  ck('covered: the status sheet opens', /Where you stand in/.test(sa), sa);
  ck('covered: the status sheet does not say not safe', !/Not safe to spend yet/.test(sa), sa);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
  const c = await home(p);
  ck('not covered: the status box says not safe to spend yet', /not safe to spend yet/i.test(c.st), c.st);
  const sc = await sheet(p, 'status'), sf = await sheet(p, 'free');
  ck('not covered: the status sheet says why and when it becomes safe', sc.includes(SENT), sc);
  ck('not covered: the Free to spend sheet says the same sentence', sf.includes(SENT), sf);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc17_status_sheet_safe: ${bad} FAIL` : 'qc17_status_sheet_safe: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc17_status_sheet_safe: FAIL'); process.exit(1); });
