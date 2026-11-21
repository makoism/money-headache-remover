/* QC round 8 art director confusing 6: at 1280 the held tiles on Home ("no goal yet", "left after it was paid") have no bar, so their text sat
   about 20px higher than the other tiles in the row. Held tiles keep an empty slot the height of the bar, so a row's amount lines line up.
   The situation the art report made: the sample plan, Trip with no goal amount and ¥30,000 in it, Yearly cost paid on 2026-11-05 with ¥6,000 left.
   Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc20_held_align.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 700)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
(async () => {
  const { b, p, errs } = await R.phone({ w: 1280, h: 900, dpr: 1, mobile: false, keep: true });
  await clock(p, '2026-11-21T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  await p.evaluate(() => { const S = __t.S, G = id => S.plan.goals.find(g => g.id === id);
    Object.assign(G('travel'), { target: 0, start: 30000 }); Object.assign(G('car'), { start: 26000, due: '2026-11-05' }); __t.persist(); __t.restructure(); });
  await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(500);   /* Finish later */
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  const tiles = await p.evaluate(() => [...document.querySelectorAll('#hBur .hb-b')].map(t => { const r = t.getBoundingClientRect(), a = t.querySelector('.hb-p').getBoundingClientRect();
    return { t: t.innerText.replace(/\s+/g, ' ').trim().slice(0, 50), held: t.classList.contains('hb-held'), top: Math.round(r.top), amt: Math.round(a.top * 10) / 10 }; }));
  ck('the grid has the two held tiles', tiles.filter(t => t.held).length === 2, tiles);
  const rows = {}; tiles.forEach(t => { (rows[t.top] = rows[t.top] || []).push(t); });
  const mixed = Object.values(rows).filter(r => r.some(t => t.held) && r.some(t => !t.held));
  ck('a held tile shares a row with other tiles at 1280', mixed.length > 0, rows);
  Object.values(rows).forEach(r => { const a = r.map(t => t.amt);
    ck(`row at ${r[0].top}px: the amount lines have the same top (within 2px)`, Math.max(...a) - Math.min(...a) <= 2, r); });
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc20_held_align: ${bad} FAIL` : 'qc20_held_align: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc20_held_align: FAIL'); process.exit(1); });
