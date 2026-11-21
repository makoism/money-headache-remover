/* QC round 8 layout polish 1 (rule "text sits on solid panels"): Home's "More: Free to spend, goals, cards, streak" button had a
   see-through background (its words sat on the forest) and sat 4px under the panel above at 320. It gets a solid panel, light and
   dark, and at least 12px from the panel above.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc21_more_panel.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const probe = p => p.evaluate(() => {
  const b = document.getElementById('hMoreBtn'); if (!b || !b.getClientRects().length) return null;
  const bg = getComputedStyle(b).backgroundColor, m = bg.match(/rgba?\(([^)]+)\)/), parts = m ? m[1].split(/[ ,/]+/).filter(Boolean) : [];
  const alpha = parts.length > 3 ? parseFloat(parts[3]) : (m ? 1 : 0);
  let prev = b.previousElementSibling; while (prev && !prev.getClientRects().length) prev = prev.previousElementSibling;
  const gap = prev ? b.getBoundingClientRect().top - prev.getBoundingClientRect().bottom : null;
  return { bg, alpha, gap, prev: prev ? prev.id || prev.className : '' };
});
(async () => {
  for (const W of [320, 390]) {
    const { b, p, errs } = await L.start({ w: W, h: 800, dpr: 1, mobile: true });
    for (const theme of ['light', 'dark']) {
      await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400);
      const r = await probe(p);
      ck(`${W} ${theme}: the More button is on Home`, !!r, r);
      if (!r) continue;
      ck(`${W} ${theme}: its background is solid (alpha 1)`, r.alpha === 1, r);
      ck(`${W} ${theme}: 12px or more from the panel above`, r.gap >= 12, r);
    }
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc21_more_panel: ${bad} FAIL` : 'qc21_more_panel: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc21_more_panel: FAIL'); process.exit(1); });
