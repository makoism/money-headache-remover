/* script_contrast: guards the layout and art finding that came back in rounds 1 to 4 (layout and touch, art director): text too faint to
   read. Every piece of visible text on the first screen, every tab and Plan view, Home with More open, Settings and the Help menu, in
   the light and the dark theme at 390 wide (a tall window, so text below the fold is measured too), has a contrast of at least 4.5:1 against what is behind it (3:1 for large text, 24px, or
   18.66px bold, as WCAG AA allows). The colour behind is found by stacking the backgrounds under the text's centre, opacity included.
   A gradient counts at its worst stop. Text over pictures (the scene, a canvas, an image) cannot be measured this way and is counted as skipped, not passed;
   the count is printed. Disabled controls are exempt, as in WCAG. Made-up numbers. Run: node tests/qc/script_contrast.js */
const K = require('./script_lib.js'); const { ck, done } = K.report();
const measure = (p, root = 'body') => p.evaluate(root => {
  const rgba = s => { let m = s.match(/rgba?\(([^)]+)\)/); if (m) { const a = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [a[0], a[1], a[2], a[3] === undefined ? 1 : a[3]]; }
    m = s.match(/color\(srgb ([^)]+)\)/); if (m) { const a = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [a[0] * 255, a[1] * 255, a[2] * 255, a[3] === undefined ? 1 : a[3]]; } return null; };
  const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); if (!a) return [0, 0, 0, 0]; return [0, 1, 2].map(i => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a); };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const opac = e => { let o = 1; for (let a = e; a && a.nodeType === 1; a = a.parentElement) o *= +getComputedStyle(a).opacity; return o; };
  const bad = [], seen = new Set(); let skipped = 0, measured = 0;
  const walker = document.createTreeWalker(document.querySelector(root), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim(); if (!t || !/[\w$¥€£%]/.test(t)) continue;
    const e = n.parentElement; if (!e || seen.has(e)) continue; seen.add(e);
    const rg = document.createRange(); rg.selectNodeContents(n); const rr = [...rg.getClientRects()].find(r => r.width > 1 && r.height > 1); if (!rr) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue;
    const op = opac(e); if (op < 0.05) continue;
    if (e.closest('button:disabled,[aria-disabled=true],input:disabled,select:disabled')) continue;
    const x = rr.left + rr.width / 2, y = rr.top + rr.height / 2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { continue; }
    const stack = document.elementsFromPoint(x, y);
    const iMine = stack.findIndex(s => s === e || e.contains(s) || s.contains(e));
    if (stack.slice(0, iMine < 0 ? stack.length : iMine).some(s => getComputedStyle(s).pointerEvents !== 'none' && !e.contains(s))) continue;   /* covered by a bar or sheet at this point */
    /* the layers behind the text: the text's own element and its parents up to the first one hit-testing sees (pointer-events: none
       parts such as a toast are not in elementsFromPoint), then everything under that point */
    const chain = []; let a = e; while (a && !stack.includes(a)) { chain.push(a); a = a.parentElement; }
    const layersEl = chain.concat(a ? stack.slice(stack.indexOf(a)) : []);
    /* two stacks: one taking the darkest stop of every gradient, one the lightest, so the worst case of a gradient is measured.
       A blur behind a panel (backdrop-filter) keeps roughly the colour of what is under it, so the layers under it still count. */
    let bgs = [[0, 0, 0, 0], [0, 0, 0, 0]], art = false;
    for (let i = 0; i < layersEl.length && bgs.some(x => x[3] < 0.999); i++) {
      const s = layersEl[i], sc = getComputedStyle(s), o = opac(s);
      if (/^(CANVAS|IMG|VIDEO|svg|IFRAME)$/.test(s.tagName)) { art = true; break; }
      const bi = sc.backgroundImage;
      if (bi && bi !== 'none') {
        if (/url\(/.test(bi)) { art = true; break; }
        const stops = (bi.match(/rgba?\([^)]+\)|color\(srgb [^)]+\)/g) || []).map(rgba).filter(c => c[3] > 0.05); if (!stops.length) { art = true; break; }   /* a see-through stop shows the layer under it, which is measured next */
        const by = stops.slice().sort((x, y) => lum(x) - lum(y));
        bgs = [over(bgs[0], [...by[0].slice(0, 3), by[0][3] * o]), over(bgs[1], [...by[by.length - 1].slice(0, 3), by[by.length - 1][3] * o])];
      }
      const c = rgba(sc.backgroundColor); if (c && c[3] > 0) bgs = bgs.map(x => over(x, [c[0], c[1], c[2], c[3] * o]));
    }
    if (art) { skipped++; continue; }
    const root = rgba(getComputedStyle(document.documentElement).backgroundColor) || [0, 0, 0, 0];
    bgs = bgs.map(x => { if (x[3] < 0.999) x = over(x, root); if (x[3] < 0.999) x = over(x, [255, 255, 255, 1]); return x; });
    const fc = rgba(cs.color); if (!fc) continue;
    const rs = bgs.map(bg => { const fg = over([fc[0], fc[1], fc[2], fc[3] * op], bg); return [ratio(fg, bg), fg, bg]; }).sort((x, y) => x[0] - y[0]);
    const [r, fg, bg] = rs[0];
    const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700 || cs.fontWeight === 'bold';
    const need = px >= 24 || (bold && px >= 18.66) ? 3 : 4.5; measured++;
    if (r < need - 0.005) bad.push(`"${t.replace(/\s+/g, ' ').slice(0, 30)}" ${r.toFixed(2)}:1 (needs ${need}, ${px}px, text ${fg.slice(0, 3).map(Math.round)} on ${bg.slice(0, 3).map(Math.round)})`);
  }
  return { bad: [...new Set(bad)], skipped, measured };
}, root);
(async () => {
  let skipped = 0, measured = 0;
  for (const theme of ['light', 'dark']) {
    let tour;
    const { b, p, errs } = await K.open({ theme, h: 2600, onTour: async p => { tour = await measure(p); } });
    ck(`${theme}, first screen (tour): text contrast`, tour.bad.length === 0, tour.bad.join(' | ')); skipped += tour.skipped; measured += tour.measured;
    await K.sweep(p, async name => { const r = await measure(p); skipped += r.skipped; measured += r.measured; ck(`${theme}, ${name}: text contrast (${r.measured} measured, ${r.skipped} over art)`, r.bad.length === 0, r.bad.join(' | ')); });
    await p.evaluate(() => { const h = document.getElementById('helpBtn'); h && h.click(); }); await K.w(500);
    const hm = await measure(p, '#help'); ck(`${theme}, Help menu: text contrast`, hm.bad.length === 0 && hm.measured > 0, hm.bad.join(' | ') || 'nothing measured');
    ck(`${theme}: no page errors`, errs.length === 0, errs.join(' | ')); await b.close();
  }
  console.log(`(${measured} texts measured, ${skipped} over pictures skipped)`);
  done();
})();
