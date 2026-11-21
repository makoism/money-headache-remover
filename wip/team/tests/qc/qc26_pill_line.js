/* QC round 8 layout polish 6: the "Sample numbers" pill next to Your burrow sat 8px in from the left edge when it wrapped at 320, and a
   "planned" pill (end of "Where your money sits at the end of ...: the bank and your burrows") dropped to a line of its own at 320.
   Now every pill on Home shares its line with words, sits centred on that line, and if the Sample numbers pill ever wraps it starts at
   the heading's left edge. Checked at 320, 390 and 1280.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc26_pill_line.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const probe = p => p.evaluate(() => [...document.querySelectorAll('#p-home .ntag, #p-home .smp-tag')].filter(t => t.getClientRects().length).map(t => {
  /* the block the pill sits in, and the last line of words before the pill */
  let par = t.parentElement; while (par && getComputedStyle(par).display === 'inline') par = par.parentElement;
  const rg = document.createRange(); rg.setStart(par, 0); rg.setEndBefore(t);
  const rs = [...rg.getClientRects()].filter(x => x.width > 1), last = rs[rs.length - 1];
  const all = document.createRange(); all.selectNodeContents(par); const first = [...all.getClientRects()].filter(x => x.width > 1)[0];
  const pb = t.getBoundingClientRect();
  const overlap = last ? Math.min(pb.bottom, last.bottom) - Math.max(pb.top, last.top) : 0;
  return { cls: t.className, words: par.textContent.trim().slice(0, 60), onLine: !!last && overlap >= pb.height / 2, off: last ? Math.round(Math.abs((pb.top + pb.bottom) / 2 - (last.top + last.bottom) / 2)) : null, left: Math.round(pb.left), textLeft: first ? Math.round(first.left) : null };
}));
(async () => {
  for (const W of [320, 390, 1280]) {
    const { b, p, errs } = await L.start({ w: W, h: 900, dpr: 1, mobile: W < 600 });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home');
    await p.evaluate(() => document.getElementById('hMoreBtn').click()); await w(500);
    const r = await probe(p);
    const smp = r.find(x => /smp-tag/.test(x.cls)), plan = r.filter(x => /plan/.test(x.cls));
    ck(`${W}: the Sample numbers pill is on Home`, !!smp, r);
    if (smp) ck(`${W}: Sample numbers sits on the heading's line, centred (within 3px), or starts at its left edge`, (smp.onLine && smp.off <= 3) || (!smp.onLine && Math.abs(smp.left - smp.textLeft) <= 1), smp);
    ck(`${W}: there are planned pills on Home`, plan.length >= 2, r);
    plan.forEach(x => ck(`${W}: "planned" shares its line with words: ${x.words}`, x.onLine, x));
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc26_pill_line: ${bad} FAIL` : 'qc26_pill_line: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc26_pill_line: FAIL'); process.exit(1); });
