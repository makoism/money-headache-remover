/* QC round 4 north-star gate 2: at 390 and 412 the Receipts "Last month" table showed only the category names (Planned and Spent sat
   outside a box that scrolled sideways with nothing to say so), and at 320x640 Plan > All months cut figures in half ("−$5" for −$515)
   with the Status column off screen. Every figure in both tables shows whole, inside the screen, with no sideways scrolling.
   Made-up numbers.  Run: node tests/qc/qc11_tables_narrow.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 600)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
/* every cell of the table: inside the screen, its text not cut, and the table not wider than the box around it */
const fits = (p, sel) => p.evaluate(sel => {
  const t = document.querySelector(sel); if (!t || !t.getClientRects().length) return { shown: false };
  const box = t.parentElement, vw = document.documentElement.clientWidth, out = [];
  if (t.scrollWidth > box.clientWidth + 1) out.push('table ' + t.scrollWidth + ' wider than its box ' + box.clientWidth);
  for (const c of t.querySelectorAll('th, td')) { const r = c.getBoundingClientRect(); if (!c.innerText.trim()) continue;
    if (r.right > vw + 0.5 || r.left < -0.5) out.push('off screen: ' + c.innerText.trim().slice(0, 30) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
    else if (c.scrollWidth > c.clientWidth + 1) out.push('cut: ' + c.innerText.trim().slice(0, 30)); }
  return { shown: true, ok: !out.length, out: out.slice(0, 6), vw };
}, sel);
(async () => {
  for (const [W, H] of [[320, 640], [390, 844], [412, 915]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true, keep: true });
    await clock(p, '2026-12-05T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
    await L.base(p, { pay: 3200, bank: 1500, min: 300, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, tT: 600, tM: 100, eT: 4500, eS: 0, eM: 385 }); await w(300); await skip(p);
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; S.items['2026-12'] = [{ id: 'xmade', label: 'Made-up laptop', amount: 2400 }]; __t.persist(); __t.restructure(); });
    await L.rc(p, 1234.56, 'envelope', '2026-11-18', 'Made-up lunch'); await L.rc(p, 451.25, 'bill:food', '2026-11-19', 'Made-up shop');
    await L.tab(p, 'tab-receipts'); await p.evaluate(() => { const e = document.getElementById('rcMonth'); e.value = '2026-12'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await w(600);
    const a = await fits(p, '#rcBack table');
    ck(`${W} wide: Receipts "Last month" table shows every figure whole`, a.shown && a.ok, a);
    await L.tab(p, 'tab-month'); await L.clickText(p, 'All months'); await w(600);
    const c = await fits(p, '#monthTable table');
    ck(`${W} wide: Plan > All months shows every figure whole, Status column included`, c.shown && c.ok, c);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W} wide: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc11_tables_narrow: ${bad} FAIL` : 'qc11_tables_narrow: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_tables_narrow: FAIL'); process.exit(1); });
