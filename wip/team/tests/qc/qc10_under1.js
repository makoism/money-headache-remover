/* QC10 numbers should-fix 3: a piece of Plan's list with money in it read "0%" ("Used for spending past plan $19.99 0%"). A piece with
   money reads "under 1%"; the percents still add up as before. Made-up numbers in dollars.
   Run: node tests/qc/qc10_under1.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2026-11-19T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3000, bank: 1000, min: 0, defs: { 'bill:rent': 1000, 'bill:food': 400, envelope: 200, education: 100, invest: 100, give: 50 }, noTrip: true, eT: 3000, eS: 100, eM: 100 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true;
    S.receipts = [{ id: 'u1', d: '2026-11-04', a: 200, c: 'envelope', cn: 'Free to spend', n: '' }, { id: 'u2', d: '2026-11-05', a: 9.99, c: 'envelope', cn: 'Free to spend', n: '' }]; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#legend .lg')].map(e => ({ name: e.querySelector('span').childNodes[0].textContent.trim(), v: e.querySelector('b').innerText, pct: e.querySelector('em').innerText })));
  const zero = rows.filter(r => r.pct === '0%' && !/^\$0(\.00)?$/.test(r.v));
  ck('no row with money in it reads 0%', zero.length === 0, zero);
  const used = rows.find(r => /spending past plan/i.test(r.name));
  ck('the $9.99 spent past plan reads "under 1%"', !!used && /9\.99/.test(used.v) && used.pct === 'under 1%', rows);
  /* QC10 round 2 numbers should-fix 5: when spending past plan used up all the pay that had no place, Plan said "All of your pay has a
     place" next to the row "came out of pay with no place" */
  await p.evaluate(() => { const S = __t.S; S.receipts.push({ id: 'u3', d: '2026-11-06', a: 1100, c: 'envelope', cn: 'Free to spend', n: '' }); __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(500);
  const words = await p.evaluate(() => document.getElementById('dockTxt').innerText + ' || ' + document.getElementById('verdict').innerText);
  ck('pay with no place all used by spending past plan: Plan does not say it all has a place', !/has a place/.test(words) && !/All pay is placed/.test(words) && /used/.test(words), words);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_under1: ${bad} FAIL` : 'qc10_under1: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_under1: FAIL'); process.exit(1); });
