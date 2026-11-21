/* QC round 6 novice C2: the open Emergency fund burrow had no line on what it is for. One plain line now sits under its name
   (emergency fund only): "Money for surprises, so a broken phone or a vet bill isn't a crisis." (VOICE.md B3: contractions).
   Made-up numbers.  Run: node tests/qc/qc15_fund_why.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const LINE = "Money for surprises, so a broken phone or a vet bill isn't a crisis.";
const openBurrow = async (p, id) => { await L.tab(p, 'tab-home'); await w(300); await p.evaluate(id => { const b = document.querySelector(`#hBur .hb-b[data-b="${id}"]`); b && b.click(); }, id); await w(1500);
  const o = await p.evaluate(() => { const e = document.querySelector('.bv-pop'), h = e && e.querySelector('h2'), nx = h && h.nextElementSibling; return { all: e ? e.innerText.replace(/\s+/g, ' ').trim() : '', afterName: nx ? nx.innerText.trim() : '' }; });
  await p.evaluate(() => { const s = document.querySelector('.bv-sign'); s && s.click(); }); await w(900); return o; };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const eid = await p.evaluate(() => __t.S.plan.goals.find(g => g.emergency).id);
  const e = await openBurrow(p, eid);
  ck('open Emergency fund burrow: the line right under its name says what it is for', e.afterName === LINE, e);
  ck('the line has no em dash and no "AI" comfort words', !/—|–|no guilt|calm|gentle/.test(LINE));
  const t = await openBurrow(p, 'trip1');
  ck('open Trip burrow: no emergency fund line', t.all && !t.all.includes('Money for surprises'), t);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc15_fund_why: ${bad} FAIL` : 'qc15_fund_why: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc15_fund_why: FAIL'); process.exit(1); });
