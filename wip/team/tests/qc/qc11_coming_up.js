/* QC round 4 north-star gate 3: a $2,400 one-time cost in Dec took the bank below zero from Dec on, yet Home said only "Free to spend
   $340 safe to spend", nothing about Dec. "Coming up" showed only on a plan already in trouble: Home hides the status card when this
   month is fine. Home names a later month that ends below zero or under the minimum, also one more than three months away.
   38.31 (QC round 6): a month in the next 3 reads "Coming up: Dec ...", one further away reads "Later on: May 2027 ...".
   Made-up numbers.  Run: node tests/qc/qc11_coming_up.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
/* what a person sees on Home: visible text only */
const home = async p => { await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600); return p.evaluate(() => { const h = document.getElementById('home') || document.querySelector('[data-tab="home"]') || document.body; return document.body.innerText.replace(/\s+/g, ' '); }); };
const cost = (p, ym, amt) => p.evaluate((ym, amt) => { const S = __t.S; S.items[ym] = [{ id: 'xmade', label: 'Made-up laptop', amount: amt }]; __t.persist(); __t.restructure(); }, ym, amt);
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-20T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 0, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, tT: 600, tM: 100, eT: 4500, eS: 0, eM: 385 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const t0 = await home(p);
  ck('a plan with every month fine says nothing is coming up short', !/Coming up/.test(t0), t0.match(/.{0,60}Coming up.{0,80}/));
  await cost(p, '2026-12', 9000);
  const t1 = await home(p);
  ck('a cost that takes Dec below zero: Home says "Coming up: Dec ends below zero"', /Coming up: Dec ends below zero/.test(t1), t1.slice(0, 600));
  ck('a month in the next 3 never reads "Later on"', !/Later on/.test(t1), t1.match(/.{0,60}Later on.{0,80}/));
  await cost(p, '2026-12', 0); await cost(p, '2027-05', 9000);
  const t2 = await home(p);
  ck('a month more than three months away: Home still names it (May)', /(Coming up|Later on):[^.]*May[^.]*(below zero|under your minimum)/.test(t2), t2.slice(0, 600));
  /* QC round 6 regression, confusing 1: "Coming up: Jun 2028 ends below zero." under "You are okay" read as soon. A month past the next 3 reads "Later on" */
  ck('that far month reads "Later on: May 2027 ends below zero. Open Plan to see why."', /Later on: May 2027 ends below zero\. Open Plan to see why\./.test(t2), t2.match(/.{0,60}(Coming up|Later on).{0,80}/));
  ck('and it does not say "Coming up"', !/Coming up/.test(t2), t2.match(/.{0,60}Coming up.{0,80}/));
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_coming_up: ${bad} FAIL` : 'qc11_coming_up: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_coming_up: FAIL'); process.exit(1); });
