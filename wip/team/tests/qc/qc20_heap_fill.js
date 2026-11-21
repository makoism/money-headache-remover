/* QC round 8 art director blocker 1: the Home Burrows tiles for a burrow with money but no goal ("no goal yet") and for money left after a goal
   was paid always drew the same coin heap (fixed fill .3), so "Trip ¥30,000, no goal yet" and "Yearly cost ¥6,000, left after it was paid" looked
   the same. ART_GUIDE 9: coins equal the money. The heap is now sized by the model: that burrow's money against the largest burrow on Home.
   The situation the art report made: the sample plan, Trip with no goal amount and ¥30,000 in it, Yearly cost paid on 2026-11-05 with ¥6,000 left.
   Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc20_heap_fill.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
(async () => {
  const { b, p, errs } = await R.phone({ w: 1280, h: 900, dpr: 1, mobile: false, keep: true });
  await clock(p, '2026-11-21T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  await p.evaluate(() => { const S = __t.S, G = id => S.plan.goals.find(g => g.id === id);
    Object.assign(G('travel'), { target: 0, start: 30000 }); Object.assign(G('car'), { start: 26000, due: '2026-11-05' }); __t.persist(); __t.restructure(); });
  await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(500);   /* Finish later */
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  const v = await p.evaluate(() => {
    const T = e => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
    /* coin pixels: the gold in the hole of the 24 x 18 mound */
    const gold = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) { const [r, g, bl, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]]; if (a > 200 && r > 180 && g > 120 && bl < 110 && r - bl > 110) n++; } return n; };
    return [...document.querySelectorAll('#hBur .hb-b')].map(t => ({ goal: !!(t.dataset.b || t.dataset.h), t: T(t), fill: t.dataset.fill === undefined ? null : +t.dataset.fill, gold: gold(t.querySelector('canvas')) }));
  });
  const trip = v.find(x => /^Trip/.test(x.t)), yc = v.find(x => /^Yearly cost/.test(x.t));
  ck('Trip shows ¥30,000, no goal yet', !!trip && /30,000, no goal yet/.test(trip.t), v.map(x => x.t));
  ck('Yearly cost shows ¥6,000, left after it was paid', !!yc && /6,000, left after it was paid/.test(yc.t), v.map(x => x.t));
  ck('each held tile says how full its heap is drawn', !!trip && !!yc && trip.fill > 0 && yc.fill > 0, [trip, yc]);
  ck('the two held heaps are not the same fill', !!trip && !!yc && trip.fill !== yc.fill, [trip, yc]);
  ck('the larger amount has the larger heap', !!trip && !!yc && trip.fill > yc.fill, [trip, yc]);
  /* against the largest burrow on Home (goal and held tiles; the rooms are not burrows that hold saved money) */
  const amt = x => +((x.t.match(/¥([\d,]+)/) || [0, '0'])[1].replace(/,/g, '')), top = Math.max(...v.filter(x => x.goal).map(amt));
  ck('the Trip heap is its money against the largest burrow on Home', !!trip && Math.abs(trip.fill - Math.min(1, 30000 / top)) < 0.01, { trip, top });
  ck('no heap is drawn past full', v.every(x => x.fill === null || x.fill <= 1), v);
  ck('the small one still shows some coins', !!yc && yc.gold > 0, yc);
  ck('the larger one shows at least as many coins', !!trip && !!yc && trip.gold >= yc.gold, [trip, yc]);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc20_heap_fill: ${bad} FAIL` : 'qc20_heap_fill: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc20_heap_fill: FAIL'); process.exit(1); });
