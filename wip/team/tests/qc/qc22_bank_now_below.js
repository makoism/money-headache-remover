/* QC round 8 money accuracy blocker 1: Check your bank to a figure below zero gave no below-zero warning. Home said "Bank updated: -500,000
   today." and then "The next 3 months look fine." with only "Your bank is less than your bills still to pay and Free to spend". The bank
   today below zero gets the plain below-zero line on Home, Free to spend stays not safe to spend yet, and "look fine" goes. The figure the
   plan starts from stays as it is (Mako's open question, MAKO_RUN 1.1). Made-up numbers.  Run: node tests/qc/qc22_bank_now_below.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const home = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => { const e = document.querySelector('#hStatus'); return { st: e ? e.innerText.replace(/\s+/g, ' ').trim() : '', all: document.body.innerText.replace(/\s+/g, ' ') }; }); };
const typeBank = async (p, v) => { await L.tab(p, 'tab-home'); await w(300); if (await p.$('#mpCheck')) await click(p, '#mpCheck'); await L.typeIn(p, '#mpBankIn', v); await click(p, '#mpBankSave'); };
const MINUS = /[−-]⁠?¥500,000/;
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 250000, bank: 300000, min: 0, noTrip: true, eT: 0, eS: 0, eM: 0, defs: { 'bill:rent': 100000, 'bill:food': 40000, envelope: 30000, education: 0, invest: 0, give: 0 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.cfg.bankAt = '2026-11-01'; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const a0 = await home(p);
  ck('before: the bank is above zero and nothing says below zero', !/below zero/.test(a0.st), a0.st);
  await typeBank(p, '-500000');
  ck('the bank today is saved as -500,000', await p.evaluate(() => __t.S.cfg.bankNow === -500000), await p.evaluate(() => __t.S.cfg));
  ck('the plan still starts from 300,000 (the start figure is not changed)', await p.evaluate(() => __t.S.cfg.bankStart === 300000), await p.evaluate(() => __t.S.cfg));
  const a = await home(p);
  ck('the status box says the bank is below zero today, with the amount', /Your bank is below zero today/.test(a.st) && MINUS.test(a.st), a.st);
  ck('the status box says to wait for pay before spending', /Wait for pay before spending/.test(a.st), a.st);
  ck('the status box does not say "The next 3 months look fine."', !/look fine/.test(a.st), a.st);
  ck('the status box does not say "You are okay"', !/You are okay/.test(a.st), a.st);
  ck('Free to spend is not safe to spend yet', /Free to spend[^]{0,80}not safe to spend yet/.test(a.all), (a.all.match(/Free to spend.{0,120}/) || [])[0]);
  ck('Home never calls Free to spend money "free to spend" as a yes', !/is free to spend/.test(a.all), a.all.match(/.{60}is free to spend.{20}/g));
  ck('the bank card says the bank is below zero, not only "less than your bills"', /Your bank is below zero today/.test(await p.evaluate(() => { const e = document.querySelector('.mp-now'); return e ? e.innerText.replace(/\s+/g, ' ') : ''; })), await p.evaluate(() => { const e = document.querySelector('.mp-now'); return e ? e.innerText.replace(/\s+/g, ' ') : ''; }));
  /* back above zero: the warning goes */
  await typeBank(p, '290000');
  const c = await home(p);
  ck('back above zero: no below-zero line', !/below zero today/.test(c.st) && !/below zero today/.test(c.all), c.st);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc22_bank_now_below: ${bad} FAIL` : 'qc22_bank_now_below: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc22_bank_now_below: FAIL'); process.exit(1); });
