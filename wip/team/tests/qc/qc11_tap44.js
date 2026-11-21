/* QC round 4 layout and touch (confusing 2): controls under 44px: the month-end "Which goal" picker (select.inp.sm in .hn-b, 34px), the
   burrow Add money chips (42px), the Add a burrow window's close x (40x40), setup's "Use the longer setup" link (42px); and the Plan
   bar pieces (16px tall) were Tab stops for numbers the rows below already list. Each control is built in its real container and
   measured; the bar pieces are out of the Tab order. QC round 6 layout 3: Plan > Details > Monthly bills, "Rename, remove or add lines"
   was 182x42; it is measured where it really sits, at 390 and 1300 wide. Sample numbers.  Run: node tests/qc/qc11_tap44.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  const m = await p.evaluate(() => {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:400px;z-index:99999;background:#000'; document.body.appendChild(host);
    host.innerHTML = '<div class="hn-b"><select class="inp sm"><option>Trip</option></select></div><div class="bv-chips"><button type="button" class="chip">¥5,000</button></div><button type="button" class="ask-x">&times;</button><p class="cap"><button type="button" class="link" id="tourFull">Use the longer setup</button></p>';
    const h = sel => { const e = host.querySelector(sel), r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const out = { picker: h('select'), chip: h('.chip'), close: h('.ask-x'), longer: h('#tourFull') }; host.remove(); return out; });
  ck('the month-end goal picker is at least 44px tall', m.picker[1] >= 44, m.picker);
  ck('the burrow Add money chips are at least 44px tall', m.chip[1] >= 44, m.chip);
  ck('the Add a burrow close x is at least 44 by 44', m.close[0] >= 44 && m.close[1] >= 44, m.close);
  ck('"Use the longer setup" is at least 44px tall', m.longer[1] >= 44, m.longer);
  await L.tab(p, 'tab-month'); await w(400);
  /* Plan > Details > Monthly bills open: the real button, at a phone width and a desktop width */
  for (const vw of [390, 1300]) {
    await p.setViewport({ width: vw, height: 900, deviceScaleFactor: 1, isMobile: vw < 500, hasTouch: vw < 500 }); await w(900);
    await skip(p); await L.tab(p, 'tab-month'); await w(400);   /* a change of phone or desktop can reload the page */
    await p.evaluate(() => { const shown = [...document.querySelectorAll('button.link[data-edit]')].some(b => /Rename, remove or add lines/.test(b.innerText) && b.getClientRects().length); const t = document.getElementById('rt-nec'); if (t && !shown) t.click(); }); await w(500);
    const measure = () => p.evaluate(() => { const e = [...document.querySelectorAll('button.link[data-edit]')].find(b => /Rename, remove or add lines/.test(b.innerText) && b.getClientRects().length);
      if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; });
    let ed = await measure(); if (!ed) { await p.evaluate(() => document.getElementById('rt-nec').click()); await w(500); ed = await measure(); }
    ck(`Plan > Monthly bills: "Rename, remove or add lines" is at least 44px tall at ${vw}`, !!ed && ed[1] >= 44, ed);
  }
  await p.setViewport({ width: 412, height: 915, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await w(900); await skip(p); await L.tab(p, 'tab-month'); await w(400);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#bar .seg-b')].filter(e => e.tabIndex >= 0).length);
  ck('the Plan bar pieces are not Tab stops (the rows below list the same numbers)', tabs === 0, tabs);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_tap44: ${bad} FAIL` : 'qc11_tap44: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_tap44: FAIL'); process.exit(1); });
