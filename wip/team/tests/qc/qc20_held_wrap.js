/* QC round 8 art director polish 10: at 390, "¥6,000, left after it was paid" widened its tile to 160px while the others were 132px, shifting the
   pair. The line wraps instead, so every tile in the Burrows grid has the same width.
   The situation the art report made: the sample plan, Trip with no goal amount and ¥30,000 in it, Yearly cost paid on 2026-11-05 with ¥6,000 left.
   Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc20_held_wrap.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 700)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-21T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  await p.evaluate(() => { const S = __t.S, G = id => S.plan.goals.find(g => g.id === id);
    Object.assign(G('travel'), { target: 0, start: 30000 }); Object.assign(G('car'), { start: 26000, due: '2026-11-05' }); __t.persist(); __t.restructure(); });
  await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(500);   /* Finish later */
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  const v = await p.evaluate(() => { const sc = document.querySelector('#hBur .hb-scene');
    return { scene: sc ? Math.round(sc.getBoundingClientRect().width) : 0, page: document.documentElement.scrollWidth,
      tiles: [...document.querySelectorAll('#hBur .hb-b')].map(t => { const r = t.getBoundingClientRect(); return { t: t.innerText.replace(/\s+/g, ' ').trim().slice(0, 50), w: Math.round(r.width * 10) / 10, left: Math.round(r.left), right: Math.round(r.right) }; }) }; });
  const yc = v.tiles.find(t => /^Yearly cost/.test(t.t));
  ck('the paid tile is there with its words', !!yc && /6,000, left after it was paid/.test(yc.t), v.tiles);
  const ws = v.tiles.map(t => t.w);
  ck('every tile in the grid has the same width (within 1px)', ws.length > 1 && Math.max(...ws) - Math.min(...ws) <= 1, v.tiles);
  ck('no tile runs past the screen', v.tiles.every(t => t.left >= 0 && t.right <= 390), v.tiles);
  ck('no sideways scroll at 390', v.page <= 390, v.page);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc20_held_wrap: ${bad} FAIL` : 'qc20_held_wrap: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc20_held_wrap: FAIL'); process.exit(1); });
