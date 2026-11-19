/* script_tap44: guards the layout finding that came back in rounds 1 to 4 (layout and touch, north-star): a control too small to tap.
   Every visible button, link, select, box, summary, tab and role=button is at least 44px wide and 44px tall at 390 and at 320 wide,
   on the first screen, every tab and Plan view, Home with More open, Settings and the Help menu, with a made-up plan that has cents and
   long amounts. Native inputs hidden behind a drawn control (invisible, or 2px or less) do not count, as in layout_round4.js.
   Run: node tests/qc/script_tap44.js */
const K = require('./script_lib.js'); const { ck, done } = K.report();
const small = (p, root = 'body') => p.evaluate(root => {
  const out = [];
  document.querySelector(root).querySelectorAll('button,a[href],select,input:not([type=hidden]),textarea,summary,[role=button],[role=tab]').forEach(e => {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0 || (r.width <= 2 && r.height <= 2)) return;
    let a = e; while (a && a !== document.body) { if (+getComputedStyle(a).opacity === 0) return; a = a.parentElement; }
    if (r.height < 43.5 || r.width < 43.5) out.push((e.id || String(e.className).split(' ')[0] || e.tagName) + ' "' + (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  return [...new Set(out)];
}, root);
(async () => {
  for (const W of [390, 320]) {
    let tour = [];
    const { b, p, errs } = await K.open({ w: W, h: 780, onTour: async p => { tour = await small(p); } });
    ck(`${W} wide, first screen (tour): no control under 44px`, tour.length === 0, tour.join(' | '));
    await K.sweep(p, async name => { const s = await small(p); ck(`${W} wide, ${name}: no control under 44px`, s.length === 0, s.join(' | ')); });
    await p.evaluate(() => { const h = document.getElementById('helpBtn'); h && h.click(); }); await K.w(500);
    const hm = await small(p, '#help'); ck(`${W} wide, Help menu: no control under 44px`, hm.length === 0 && await p.evaluate(() => !document.getElementById('helpMenu').hidden), hm.join(' | '));
    ck(`${W} wide: no page errors`, errs.length === 0, errs.join(' | ')); await b.close();
  }
  done();
})();
