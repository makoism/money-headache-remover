/* QC round 4 novice C1: adding a burrow when all of the pay already has a place never said where its monthly money comes from; the
   month quietly became "Tight month ... Plans $95 more than your pay". The Add a burrow window says so before it is added. Made-up numbers.
   Run: node tests/qc/qc11_goal_tight.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(400); };
const wizard = async p => {
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Burrows'); await w(400);
  await L.tab(p, 'tab-home'); await w(300); await p.evaluate(() => { const x = document.querySelector('[data-gw]'); x && x.click(); }); await w(600);
  await p.evaluate(() => { const c = document.querySelector('#gw [data-kind]'); c && c.click(); }); await w(300);
  if (await p.$('#gwName')) { await p.focus('#gwName'); await p.keyboard.type('Made-up bike'); await w(200); }
  await click(p, '#gwNext');
  await p.focus('#gwCost'); await p.keyboard.type('1200'); await w(200);
  await click(p, '#gwNext');
  const t = await p.evaluate(() => (document.getElementById('gwPlan') || {}).textContent || '');
  await p.evaluate(() => { const x = document.querySelector('#gw [data-gwx]'); x && x.click(); }); await w(400);
  return t;
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  /* every dollar of the 3,200 pay has a place: bills 1,600, places 635, emergency fund 965 */
  await L.base(p, { pay: 3200, bank: 1500, min: 0, noTrip: true, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, eT: 20000, eS: 0, eM: 965 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  const a = await wizard(p);
  ck('the window still gives the monthly amount', /a month/.test(a), a);
  ck('all pay placed: it says so, and that the plan would spend more than the pay', /All of your pay has a place/.test(a) && /more than your pay/.test(a), a);
  await p.evaluate(() => { const S = __t.S, g = S.plan.goals.find(x => x.emergency); g.monthly = 465; __t.persist(); __t.restructure(); }); await w(300);
  const c = await wizard(p);
  ck('500 not placed, the goal needs 100: no warning', !/more than your pay/.test(c), c);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_goal_tight: ${bad} FAIL` : 'qc11_goal_tight: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_goal_tight: FAIL'); process.exit(1); });
