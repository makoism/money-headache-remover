/* QC round 7 layout and touch, polish 1: in Settings, light theme, the red "Restore samples" text on its grey button was 4.25:1, under the
   4.5:1 that small text needs. It is at least 4.5:1 in the light and the dark theme, measured against the button's own background laid
   over what is behind it, at 390 and 320 wide. Sample numbers.  Run: node tests/qc/qc16_restore_contrast.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const K = require('./script_lib.js'); const L = K.L, w = K.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const measure = p => p.evaluate(() => {
  const e = document.getElementById('bkReset'); if (!e || !e.getClientRects().length) return null; e.scrollIntoView({ block: 'center', behavior: 'instant' });
  const rgba = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [a[0], a[1], a[2], a[3] === undefined ? 1 : a[3]]; };
  const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); if (!a) return [0, 0, 0, 0]; return [0, 1, 2].map(i => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a); };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  /* every layer under the text's middle, as script_contrast.js stacks them: the button and its parents, then what lies under that point */
  const q = e.getBoundingClientRect(), stack = document.elementsFromPoint(q.left + q.width / 2, q.top + q.height / 2);
  const chain = []; let a = e; while (a && !stack.includes(a)) { chain.push(a); a = a.parentElement; }
  const layers = chain.concat(a ? stack.slice(stack.indexOf(a)) : []);
  let bg = [0, 0, 0, 0], art = false;
  for (const s of layers) { if (bg[3] >= 0.999) break; if (/^(CANVAS|IMG|VIDEO|svg)$/.test(s.tagName)) { art = true; break; } const c = rgba(getComputedStyle(s).backgroundColor); if (c && c[3] > 0) bg = over(bg, c); }
  const root = rgba(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255, 1];
  if (bg[3] < 0.999) bg = over(bg, root); if (bg[3] < 0.999) bg = over(bg, [255, 255, 255, 1]);
  const fg = over(rgba(getComputedStyle(e).color), bg), x = lum(fg), y = lum(bg);
  return { art, layers: layers.slice(0, 6).map(x => x.tagName + (x.id ? '#' + x.id : '') + '.' + String(x.className).slice(0, 20)), text: e.innerText, ratio: +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2), fg: fg.slice(0, 3).map(Math.round), bg: bg.slice(0, 3).map(Math.round), px: parseFloat(getComputedStyle(e).fontSize) };
});
(async () => {
  for (const theme of ['light', 'dark']) for (const W of [390, 320]) {
    const { b, p, errs } = await K.open({ theme, w: W, h: 844, plan: 'samples' });
    await L.settings(p); await w(500);
    const m = await measure(p);
    ck(`${theme} ${W}: Settings "${m && m.text}" red text on its button is at least 4.5:1`, !!m && m.ratio >= 4.5, m);
    /* with the pointer on it the button turns a shade darker (.btn:hover): still at least 4.5:1 (the 4.25:1 QC measured) */
    await p.hover('#bkReset'); await w(400); const h = await measure(p);
    ck(`${theme} ${W}: with the pointer on it, still at least 4.5:1`, !!h && h.ratio >= 4.5, h);
    await p.mouse.move(1, 1); await w(300);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${theme} ${W}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc16_restore_contrast: ${bad} FAIL` : 'qc16_restore_contrast: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc16_restore_contrast: FAIL'); process.exit(1); });
