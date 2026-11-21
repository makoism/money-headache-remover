/* QC round 8 layout polish 3: in Log spend there was a 70px gap between "Add a date or a note" and "Scan receipt" (an empty message
   row sat between them), and the two links had two left edges and two sizes. Both are the same kind of action (a small link under
   the form), so they share one green, one size and one left edge, with normal spacing between them. Checked at 320, 390 and 1280,
   light and dark.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc26_log_gap.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const probe = p => p.evaluate(() => {
  const s = document.querySelector('#hQuick .hmore > summary'), sc = document.getElementById('hScan');
  if (!s || !sc || !s.getClientRects().length || !sc.getClientRects().length) return null;
  const tr = e => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { l: b.left, t: b.top, b: b.bottom }; };
  const a = tr(s), c = tr(sc), bs = s.getBoundingClientRect(), bc = sc.getBoundingClientRect();
  const ss = getComputedStyle(s), cs = getComputedStyle(sc);
  return { textGap: Math.round(c.t - a.b), boxGap: Math.round(bc.top - bs.bottom), leftA: Math.round(a.l), leftC: Math.round(c.l), colA: ss.color, colC: cs.color, fsA: ss.fontSize, fsC: cs.fontSize };
});
(async () => {
  for (const W of [320, 390, 1280]) {
    const { b, p, errs } = await L.start({ w: W, h: 900, dpr: 1, mobile: W < 600 });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home');
    await p.evaluate(() => document.getElementById('hMoreBtn').click()); await w(500);
    for (const theme of ['light', 'dark']) {
      await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme); await w(200);
      const r = await probe(p);
      ck(`${W} ${theme}: both links are on Home`, !!r, r);
      if (!r) continue;
      ck(`${W} ${theme}: normal spacing between the two links (words 36px apart or less, boxes not overlapping)`, r.textGap <= 36 && r.boxGap >= 0, r);
      ck(`${W} ${theme}: one left edge (within 1px)`, Math.abs(r.leftA - r.leftC) <= 1, r);
      ck(`${W} ${theme}: one green and one size`, r.colA === r.colC && r.fsA === r.fsC, r);
    }
    /* after a spend is logged the message shows, and the links still do not overlap it */
    await p.evaluate(() => { document.getElementById('hAmt').value = '300'; document.getElementById('hSave').click(); }); await w(600);
    const m = await p.evaluate(() => { const g = document.getElementById('hMsg'), s = document.querySelector('#hQuick .hmore'); const a = g.getBoundingClientRect(), c = s.getBoundingClientRect(); return { msg: g.textContent, overlap: a.bottom > c.top + 1 && c.bottom > a.top + 1 }; });
    ck(`${W}: the message after logging shows and does not overlap the links`, m.msg.length > 0 && !m.overlap, m);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc26_log_gap: ${bad} FAIL` : 'qc26_log_gap: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc26_log_gap: FAIL'); process.exit(1); });
