/* QC round 4 layout and touch 1, art director 1: on a burrow screen the page dots sat on top of the painted BACK HOME sign (412x915:
   dots y791..835, sign y804..900), hid part of BACK at 390 and 430, and a tap on a dot went home instead. The dots never overlap the sign,
   and a tap on a dot opens that burrow. Sample numbers (they have several burrows).  Run: node tests/qc/qc11_dots_sign.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const rects = p => p.evaluate(() => { const r = e => { if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const v = document.getElementById('burrowView'), dots = document.querySelector('.bv-dots'); return { open: !!(v && !v.hidden), sign: r(document.querySelector('.bv-sign')), dots: r(dots), cur: dots ? [...dots.querySelectorAll('button')].findIndex(b => b.getAttribute('aria-current') === 'true') : -1, n: dots ? dots.querySelectorAll('button').length : 0 }; });
const meet = (a, b) => !!(a && b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b);
(async () => {
  for (const [W, H] of [[360, 780], [390, 844], [412, 915], [414, 896], [430, 932]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    await L.tab(p, 'tab-home'); await w(500);
    const ids = await p.evaluate(() => [...document.querySelectorAll('#hBur .hb-b[data-b]')].map(x => x.dataset.b));
    for (const id of ids.slice(0, 4)) {
      await p.evaluate(id => { const x = document.querySelector(`#hBur .hb-b[data-b="${id}"]`); x && x.click(); }, id); await w(1600);
      const r = await rects(p);
      ck(`${W}x${H} ${id}: the page dots do not overlap the BACK HOME sign`, r.open && r.sign && r.dots && !meet(r.sign, r.dots), r);
      if (r.dots && r.n > 1) {
        const k = r.cur === 0 ? 1 : 0, x = r.dots.l + (r.dots.r - r.dots.l) * (k + 0.5) / r.n, y = (r.dots.t + r.dots.b) / 2;
        await p.touchscreen.tap(Math.round(x), Math.round(y)); await w(1200);
        const r2 = await rects(p);
        ck(`${W}x${H} ${id}: a tap on a dot opens that burrow, not Home`, r2.open && r2.cur === k, r2);
      }
      /* QC round 5 art director 1: Add money makes the card taller; the dots must move with it, clear of the Amount box (MAIN 12) */
      if (await p.evaluate(() => { const a = document.querySelector('#burrowView .bv-add'); if (a && a.offsetParent) { a.click(); return true; } return false; })) {
        await w(700);
        const q = await p.evaluate(() => { const r = e => { if (!e || !e.offsetParent) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
          const d = document.querySelector('#burrowView .bv-dots'); return { dots: d && !d.hidden ? r(d) : null, amt: r(document.querySelector('#burrowView .bv-amt input')), go: r(document.querySelector('#burrowView .bv-go')), pop: r(document.querySelector('#burrowView .bv-pop')) }; });
        ck(`${W}x${H} ${id}: after Add money the page dots stay clear of the add form`, !q.dots || (!meet(q.dots, q.amt) && !meet(q.dots, q.go) && !meet(q.dots, q.pop)), q);
        await p.evaluate(() => { const n = document.querySelector('#burrowView .bv-no'); n && n.click(); }); await w(500);
      }
      await p.evaluate(() => { const s = document.querySelector('.bv-sign'); s && s.click(); }); await w(800);
    }
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc11_dots_sign: ${bad} FAIL` : 'qc11_dots_sign: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_dots_sign: FAIL'); process.exit(1); });
