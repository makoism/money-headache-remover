/* QC round 7 wording, confusing 1: with the bank below zero at the start of the month, Home's status box said "Not safe to spend yet" and
   then "...not placed yet, so give that a goal or a place or just leave it in the bank" and "The next 3 months look fine." One box, two
   answers. Now it says "Your bank starts the month below zero. Leave the X not placed yet in the bank until it is back above zero." and
   never "look fine" next to it. Checked with no saved day and with one. Made-up numbers.  Run: node tests/qc/qc16_neg_unplaced.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const st = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => { const e = document.querySelector('#hStatus'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }); };
const setBank = async (p, v, at) => { await p.evaluate((v, at) => { const S = __t.S; S.cfg.bankStart = v; if (at) S.cfg.bankAt = at; else delete S.cfg.bankAt; delete S.cfg.bankNow; delete S.cfg.bankNowAt; __t.persist(); __t.restructure(); }, v, at); await w(600); };
const leave = /Your bank starts the month below zero\. Leave the ¥[\d,]+ not placed yet in the bank until it is back above zero\./;
const check = (tag, s) => {
  ck(tag + ': the status box says not safe to spend yet', /not safe to spend yet/i.test(s), s);
  ck(tag + ': it says to leave the pay not placed yet in the bank until it is back above zero', leave.test(s), s);
  ck(tag + ': it never says to give that a goal or a place', !/give that a goal or a place/.test(s), s);
  ck(tag + ': it never says the next 3 months look fine', !/look fine/.test(s), s);
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 280000, bank: -15000, min: 0, noTrip: true, eT: 0, eS: 0, eM: 0, defs: { 'bill:rent': 140000, 'bill:food': 0, envelope: 30000, education: 0, invest: 0, give: 0 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await setBank(p, -15000, null);
  check('no day', await st(p));
  await setBank(p, -15000, '2026-11-18');
  check('with a day', await st(p));
  /* a start above zero keeps the old advice */
  await setBank(p, 15000, null);
  const e = await st(p);
  ck('15,000: the pay not placed yet can still be given a goal or a place', /give that a goal or a place/.test(e) && !/starts the month below zero/.test(e), e);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc16_neg_unplaced: ${bad} FAIL` : 'qc16_neg_unplaced: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc16_neg_unplaced: FAIL'); process.exit(1); });
