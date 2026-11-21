/* QC round 6 money accuracy blocker 1 and confusing 3: a starting balance below zero with no saved day (older saved data has no cfg.bankAt)
   gave Home "Free to spend ¥30,000 safe to spend" and no below-zero warning, while the same balance with a day gave "left, not safe to spend
   yet". One fact, one answer: a start below zero is not safe to spend, on Home, the status box, Receipts and Plan > Month. The status box
   never says "your bills are covered" next to "not safe". Made-up numbers.  Run: node tests/qc/qc13_neg_start.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const txt = p => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const home = async p => { await L.tab(p, 'tab-home'); await w(400); return p.evaluate(() => { const e = document.querySelector('#hStatus'); return { st: e ? e.innerText.replace(/\s+/g, ' ').trim() : '', all: document.body.innerText.replace(/\s+/g, ' ') }; }); };
const safeAlone = s => /(?<!not )safe to spend(?! yet)/.test(s.replace(/How is this worked out\?/g, ''));   /* "safe to spend" said as a yes */
const setBank = async (p, v, at) => { await p.evaluate((v, at) => { const S = __t.S; S.cfg.bankStart = v; if (at) S.cfg.bankAt = at; else delete S.cfg.bankAt; delete S.cfg.bankNow; delete S.cfg.bankNowAt; __t.persist(); __t.restructure(); }, v, at); await w(600); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 280000, bank: -15000, min: 0, noTrip: true, eT: 0, eS: 0, eM: 0, defs: { 'bill:rent': 140000, 'bill:food': 0, envelope: 30000, education: 0, invest: 0, give: 0 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  /* older saved data: no day with the balance, then a reload */
  await setBank(p, -15000, null);
  await p.reload(); await w(1500); await skip(p);
  ck('the reloaded copy starts at -15,000 with no saved day', await p.evaluate(() => __t.S.cfg.bankStart === -15000 && !__t.S.cfg.bankAt), await p.evaluate(() => __t.S.cfg));
  await L.rc(p, 2000, 'envelope', '2026-11-19', 'Made-up coffee'); await w(400);   /* Receipts and Plan > Month name the amount left once something is logged */
  const a = await home(p);
  ck('no day: the Free to spend card says not safe to spend yet', /Free to spend[^]{0,80}not safe to spend yet/.test(a.all), (a.all.match(/Free to spend.{0,120}/) || [])[0]);
  ck('no day: Home never calls Free to spend "safe to spend"', !safeAlone(a.all), a.all.match(/.{60}safe to spend.{20}/g));
  ck('no day: the status box does not say "You are okay"', !/You are okay/.test(a.st), a.st);
  ck('no day: the status box says not safe to spend yet', /not safe to spend yet/i.test(a.st), a.st);
  ck('no day: the status box warns the plan starts below zero', /below zero/.test(a.st) && /−\u2060?¥15,000|-¥15,000/.test(a.st), a.st);
  ck('no day: the status box never says the bills are covered next to "not safe"', !/bills are covered|Bills are covered/.test(a.st), a.st);
  ck('no day: the status box says the bank starts the month below zero', /Your bank starts the month below zero/.test(a.st), a.st);   /* QC round 7 wording, confusing 1 */
  await L.tab(p, 'tab-receipts'); await w(500); const rc = await txt(p);
  ck('no day: Receipts says not safe to spend yet', /not safe to spend yet/.test(rc) && !safeAlone(rc), rc.match(/.{60}safe to spend.{20}/g));
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(500); const pm = await txt(p);
  ck('no day: Plan > Month says not safe to spend yet', /not safe to spend yet/.test(pm) && !safeAlone(pm), pm.match(/.{60}safe to spend.{20}/g));
  /* the same balance with a day: the same answer as before */
  await setBank(p, -15000, '2026-11-18');
  const d = await home(p);
  ck('with a day: the Free to spend card still says not safe to spend yet', /Free to spend[^]{0,80}not safe to spend yet/.test(d.all) && !safeAlone(d.all), (d.all.match(/Free to spend.{0,120}/) || [])[0]);
  ck('with a day: the status box says not safe to spend yet', /not safe to spend yet/i.test(d.st) && !/You are okay/.test(d.st), d.st);
  ck('with a day: no "bills are covered" next to "not safe"', !/bills are covered|Bills are covered/.test(d.st), d.st);
  /* a start at or above zero with no day: safe, as before */
  await setBank(p, 15000, null);
  const e = await home(p);
  ck('15,000 with no day: You are okay and safe to spend', /You are okay/.test(e.st) && /is free to spend/.test(e.st) && !/not safe/.test(e.all), e.st);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc13_neg_start: ${bad} FAIL` : 'qc13_neg_start: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_neg_start: FAIL'); process.exit(1); });
