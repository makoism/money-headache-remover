/* QC round 6 art director blocker 1: Home had no vines at all and the purple wisteria on Goals was gone (390x844 and 1280x900: 0 .gv canvases).
   The vine plan (garden.js PLAN) was keyed to hHero, hGoals and hBuckets, which version one Home hides (0x0); Home now draws as the card hMap
   and the burrows section hBur. ART_GUIDE 00: "The purple wisteria on Goals stays as it is". Home has vines again, one is the wisteria on the
   burrows, and Receipts and Plan keep theirs.  Run: PAGE=/abs/path/money-map-team.html node tests/qc/qc13_home_vines.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
/* every vine canvas on a page that is showing, with its species, the box it grows on and its drawn size */
const vines = (p, pg) => p.evaluate(pg => [...document.querySelectorAll('#' + pg + ' .gnl .gv')].map(c => { const r = c.getBoundingClientRect(), box = c.closest('.gdh');
  return { sp: c.dataset.sp, k: box ? box.dataset.k : '', w: Math.round(r.width), h: Math.round(r.height), px: c.width * c.height }; }), pg);
const show = async (p, tab, pg) => { await L.tab(p, tab); await w(400); await p.evaluate(pg => { const e = document.getElementById(pg); e && e.scrollIntoView(); window.scrollBy(0, 200); window.scrollTo(0, 0); }, pg); await w(900); return vines(p, pg); };
(async () => {
  for (const [W, H] of [[390, 844], [1280, 900]]) {
    const { b, p, errs } = await L.start({ w: W, h: H, dpr: 1, mobile: W < 600 });
    await L.tab(p, 'tab-home'); await w(1200);
    const home = await show(p, 'tab-home', 'p-home'), sized = home.filter(v => v.w > 0 && v.h > 0 && v.px > 0);
    ck(`${W}x${H} Home: has vine canvases with a real size`, sized.length > 0, home);
    const wis = sized.filter(v => v.sp === 'wisteria');
    ck(`${W}x${H} Home: one vine is the purple wisteria`, wis.length >= 1, home);
    ck(`${W}x${H} Home: the wisteria grows on the burrows part of Home`, wis.some(v => v.k === 'hBur'), wis);
    ck(`${W}x${H} Home: every vine sits on a box that shows (not a hidden 0x0 card)`, await p.evaluate(() => [...document.querySelectorAll('#p-home .gnl .gdh')].every(x => { const e = document.getElementById(x.dataset.k); return !e || (e.offsetWidth > 20 && e.offsetHeight > 20); })));
    const rc = await show(p, 'tab-receipts', 'p-receipts');
    ck(`${W}x${H} Receipts: keeps its vines`, rc.filter(v => v.w > 0 && v.h > 0).length > 0, rc);
    const pl = await show(p, 'tab-month', 'p-month');
    ck(`${W}x${H} Plan: keeps its vines`, pl.filter(v => v.w > 0 && v.h > 0).length > 0, pl);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc13_home_vines: ${bad} FAIL` : 'qc13_home_vines: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_home_vines: FAIL'); process.exit(1); });
