/* QC round 11 layout 3: after Finish later, focus goes to the Home tab (on purpose, so keyboard and screen reader users land somewhere),
   and its focus ring was drawn outside the tab, bulging past the tab bar like a second selected style. A tab's focus ring now sits
   inside the tab. Run: node tests/qc/qc31_tab_ring.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 300)); if (!c) bad++; };
const L = require('./lib_r12.js'), w = L.R.w;
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true }); await w(400);
  await p.evaluate(() => document.getElementById('tab-home').focus()); await w(200);
  const r = await p.evaluate(() => { const t = document.getElementById('tab-home'), cs = getComputedStyle(t); return { id: document.activeElement && document.activeElement.id, off: parseFloat(cs.outlineOffset), w: parseFloat(cs.outlineWidth), style: cs.outlineStyle }; });
  ck('the Home tab has the focus', r.id === 'tab-home', r);
  ck('its ring is inside the tab (outline offset at most minus its width)', r.style === 'none' || r.off <= -r.w, r);
  ck('no page errors', errs.length === 0, errs);
  await b.close(); console.log(bad ? 'qc31_tab_ring: ' + bad + ' FAIL' : 'qc31_tab_ring: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc31_tab_ring: FAIL'); process.exit(1); });
