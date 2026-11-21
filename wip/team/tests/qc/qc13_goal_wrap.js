/* QC round 6 layout and touch 6: on Home > More at 320 wide the goal names were cut ("Emergenc...", 14 characters) while "21 months"
   beside them had room. A goal name wraps instead, two lines at most, at every width: a short name is shown whole, words are never split,
   and a very long name ("Grandmother Kiyoko seventieth birthday surprise trip") still lays out: no sideways scroll, it stays in its row and
   clear of the months, at most two lines. Sample numbers.  Run: node tests/qc/qc13_goal_wrap.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const LONG = 'Grandmother Kiyoko seventieth birthday surprise trip';
const rows = p => p.evaluate(() => [...document.querySelectorAll('.gd summary')].filter(s => s.getClientRects().length).map(s => {
  const b = s.querySelector('.gd-t b'), m = s.querySelector('.gd-m'), rb = b.getBoundingClientRect(), rm = m.getBoundingClientRect(), rs = s.getBoundingClientRect(), cs = getComputedStyle(b);
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25;
  /* words split across lines */
  const split = []; const walk = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let n; while ((n = walk.nextNode())) { const re = /\S+/g; let x; while ((x = re.exec(n.textContent))) { const r = document.createRange(); r.setStart(n, x.index); r.setEnd(n, x.index + x[0].length); const tops = new Set([...r.getClientRects()].filter(q => q.width > 0).map(q => Math.round(q.top))); if (tops.size > 1) split.push(x[0]); } }
  return { name: b.textContent, lines: Math.round(rb.height / lh), cutX: b.scrollWidth > b.clientWidth + 1, cutY: b.scrollHeight > b.clientHeight + 1, inRow: rb.left >= rs.left - 0.5 && rb.right <= rs.right + 0.5 && rb.top >= rs.top - 0.5 && rb.bottom <= rs.bottom + 0.5, clearM: rb.right <= rm.left + 0.5, mText: m.textContent, mOne: rm.height < 30, split };
}));
(async () => {
  for (const [W, H] of [[320, 640], [360, 780], [390, 844], [1300, 900]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: W < 600 });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    const more = async () => { await L.tab(p, 'tab-home'); await p.evaluate(() => { const m = document.getElementById('hMoreBtn'); if (m && m.getAttribute('aria-expanded') !== 'true') m.click(); }); await w(700); };
    await more();
    let r = await rows(p);
    ck(`${W}x${H}: Home > More shows the goal rows`, r.length >= 3, r);
    for (const g of r) {
      ck(`${W}x${H}: "${g.name}" is shown whole, at most two lines, no word split`, !g.cutX && !g.cutY && g.lines <= 2 && g.split.length === 0, g);
      ck(`${W}x${H}: "${g.name}" stays in its row, clear of "${g.mText}" (one line)`, g.inRow && g.clearM && g.mOne, g);
    }
    if (W === 320) { const e = r.find(g => /^Emergency/.test(g.name)); ck('320: "Emergency fund" is not cut', e && !e.cutX && !e.cutY, e); }
    await p.evaluate(L => { const g = __t.S.plan.goals.find(x => !x.emergency && !x.debt) || __t.S.plan.goals[0]; g.name = L; __t.persist(); __t.restructure(); }, LONG); await w(400);
    await L.tab(p, 'tab-receipts'); await more();
    r = await rows(p); const g = r.find(x => x.name === LONG);
    ck(`${W}x${H}: the long name has a row`, !!g, r.map(x => x.name));
    if (g) {
      ck(`${W}x${H}: the long name is at most two lines, no word split`, g.lines <= 2 && g.split.length === 0, g);
      ck(`${W}x${H}: the long name stays in its row, clear of "${g.mText}" (one line)`, g.inRow && g.clearM && g.mOne, g);
    }
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ck(`${W}x${H}: no sideways scroll`, sw <= 0, sw);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc13_goal_wrap: ${bad} FAIL` : 'qc13_goal_wrap: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_goal_wrap: FAIL'); process.exit(1); });
