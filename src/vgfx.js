/* ---------- the drawing kit for the layered world ----------
   Everything the realms are painted from. Rules taken from the pixel-art games it is modelled on:
   a small hand-picked ramp per material (dark to light, shadows pushed toward plum and highlights toward warm, never plain black or white),
   light from the upper left (lit left edge, shaded right edge, a lit rim along the top), clusters not single pixels, outlines only where a
   shape has to read against its own colour, and detail falls off with distance: far layers are plain shapes lost in haze, near layers carry
   every leaf. Painters work on a context in "viewport units" (one unit = one chunky pixel); the engine moves the origin so x runs from
   -pad to W+pad. Nothing here knows about a particular realm: a realm hands in colours. */
const VG = (() => {
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const h2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => h2(v + (B[i] - v) * t)).join(''); };
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hsh = (a, b, c) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
  /* smooth 1D value noise, and a few octaves of it */
  const sm = t => t * t * (3 - 2 * t);
  const n1 = (x, s) => { const i = Math.floor(x), f = x - i; return hsh(i, s, 1) * (1 - sm(f)) + hsh(i + 1, s, 1) * sm(f); };
  const fbm = (x, s, o) => { let a = 0, m = 0, w = 1; for (let i = 0; i < (o || 3); i++) { a += n1(x * (1 << i), s + i) * w; m += w; w *= .5; } return a / m; };
  const px = (c, x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const disk = (c, x0, y0, rad, col) => { c.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(Math.max(0, rad * rad - y * y))); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  const ell = (c, x0, y0, rx, ry, col) => { c.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + .01)))); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  /* a soft glow: smooth radial gradient (used on the light canvases, which are scaled up smoothly, never on the crisp layers) */
  const soft = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); const [R, G, B] = hx(col); g.addColorStop(0, `rgba(${R},${G},${B},${a})`); g.addColorStop(.45, `rgba(${R},${G},${B},${a * .38})`); g.addColorStop(1, `rgba(${R},${G},${B},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  /* ordered dither: 4x4 Bayer. blends a toward b by k (0..1) with a fixed pattern, so gradients keep the pixel look */
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => (BAY[((y & 3) << 2) | (x & 3)] + .5) / 16;
  function dith(c, x0, y0, w, h, a, b, fn) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const k = fn(x, y); c.fillStyle = k <= bay(x, y) ? a : b; c.fillRect(x, y, 1, 1); } }
  /* a vertical gradient through any number of stops, dithered between neighbours */
  function vgrad(c, x0, x1, y0, y1, stops) {
    const n = stops.length - 1; for (let y = y0; y < y1; y++) { const u = (y - y0) / Math.max(1, y1 - y0 - 1) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i; c.fillStyle = mix(stops[i], stops[i + 1], f); c.fillRect(x0, y, x1 - x0, 1); }
  }
  /* fade a layer's lower edge into the haze: dithered, so it reads as mist and not as a ruler line */
  function hazeBottom(c, x0, x1, y0, y1, col, a0, a1) { const [R, G, B] = hx(col); for (let y = y0; y < y1; y++) { const u = (y - y0) / Math.max(1, y1 - y0 - 1), a = a0 + (a1 - a0) * u * u * (3 - 2 * u); c.fillStyle = `rgba(${R},${G},${B},${a.toFixed(3)})`; c.fillRect(x0, y, x1 - x0, 1); } }
  /* a ridge line: a silhouette from y(x) down to the layer bottom. cols: {body, top (rim light), shade (right-facing slopes)} */
  function ridge(c, x0, x1, bottom, yf, cols, o) {
    o = o || {}; let prev = yf(x0);
    for (let x = x0; x < x1; x++) { const y = Math.round(yf(x)), nx = Math.round(yf(x + 2)), slope = nx - y; c.fillStyle = cols.body; c.fillRect(x, y, 1, bottom - y);
      if (cols.shade && slope > 0) { c.fillStyle = cols.shade; c.fillRect(x, y + 1, 1, Math.min(bottom - y, 3 + slope * 3)); }
      if (cols.top) { c.fillStyle = cols.top; c.fillRect(x, y, 1, 1); if (slope < 0 && o.rim !== false) c.fillRect(x, y + 1, 1, 1); } prev = y; }
  }
  /* a clump of leaves: three overlapping blobs (shade, body, light) with ragged edges. r is the radius in units. */
  function crown(c, x, y, r, cols, R) {
    ell(c, x + 1, y + 1, r, Math.max(2, Math.round(r * .8)), cols[0]);
    ell(c, x - Math.round(r * .12), y, Math.round(r * .92), Math.max(2, Math.round(r * .72)), cols[1]);
    ell(c, x - Math.round(r * .3), y - Math.round(r * .22), Math.round(r * .55), Math.max(1, Math.round(r * .42)), cols[2]);
    for (let i = 0, n = Math.round(r * 1.3); i < n; i++) { const a = R() * 6.283, d = r * (.95 + R() * .22); px(c, x + Math.cos(a) * d, y + Math.sin(a) * d * .78, a > 3.4 && a < 5.9 ? cols[2] : cols[1]); }
    for (let i = 0, n = Math.round(r * .6); i < n; i++) px(c, x - r * .5 + R() * r, y + r * .35 + R() * r * .4, cols[0]);
  }
  /* a broad-leaf tree: tapering trunk with a lit left edge, flared roots, a couple of limbs and crowns. cols: {trunk:[dark,mid,light], leaf:[dark,mid,light]} */
  function broadTree(c, x, base, h, w, cols, R, o) {
    o = o || {}; const lean = (R() - .5) * .22, T = cols.trunk, top = base - h, ph = R() * 6;
    for (let y = top; y <= base; y++) { const u = (base - y) / h, ww = Math.max(1, Math.round(w * (1 - u * .45) + (y > base - 6 ? (y - (base - 6)) * .7 : 0))), cx = x + Math.round(lean * (base - y) + Math.sin(u * 5 + ph) * w * .35);
      rect(c, cx - Math.floor(ww / 2), y, ww, 1, T[1]); px(c, cx - Math.floor(ww / 2), y, T[2]); if (ww > 2) px(c, cx + ww - Math.floor(ww / 2) - 1, y, T[0]); if (ww > 4 && (y + ph | 0) % 5 === 0) px(c, cx + 1, y, T[0]); }
    const tx = x + Math.round(lean * h), nl = o.limbs == null ? 2 + Math.floor(R() * 2) : o.limbs, ends = [{ x: tx, y: top }];
    for (let i = 0; i < nl; i++) { const sd = i % 2 ? 1 : -1, ln = Math.round(h * (.18 + R() * .16)), y0 = top + Math.round(h * (.12 + R() * .3)); let bx = x + Math.round(lean * (base - y0)), by = y0;
      for (let j = 0; j < ln; j++) { bx += sd * .9; by -= .55 + R() * .2; px(c, bx, by, T[1]); if (w > 3) px(c, bx, by + 1, T[0]); } ends.push({ x: Math.round(bx), y: Math.round(by) }); }
    const cr = Math.max(3, Math.round(o.crown || w * 2.1)); for (const e of ends) crown(c, e.x, e.y - 1, cr + Math.floor(R() * 2), cols.leaf, R);
    if (o.under) for (const e of ends) for (let i = 0; i < 3; i++) px(c, e.x - cr + R() * cr * 2, e.y + cr * .7 + R() * 2, cols.leaf[0]);
  }
  /* a conifer: stacked tiers, lit on the left, shaded on the right, snow on the tier edges when snow is a colour */
  function pine(c, x, base, h, w, cols, R, snow) {
    const top = base - h, tier = Math.max(5, Math.round(h / 7)), L = cols[2], M = cols[1], D = cols[0];
    for (let y = top; y <= base; y++) { const u = (y - top) / h, t = (y - top) % tier, hw = Math.max(0, Math.round(w * u * (.55 + (t / tier) * .55)));
      rect(c, x - hw, y, hw * 2 + 1, 1, M); rect(c, x + Math.floor(hw * .35), y, hw - Math.floor(hw * .35) + 1, 1, D); px(c, x - hw, y, L); if (t < 2 && hw > 2) { rect(c, x - hw + 1, y, Math.min(3, hw), 1, L); if (snow) { rect(c, x - hw, y, Math.max(2, hw * 2 - 1), 1, snow); px(c, x + hw, y, snow); } }
      if (t === tier - 1 && hw > 2) { rect(c, x - hw - 1, y, 1, 1, D); rect(c, x + hw + 1, y, 1, 1, D); } }
    rect(c, x - 1, base, 2, 3, cols[0]);
  }
  /* a giant mushroom: shaded stem, a cap lit at the top-left with a gilled underside, spots */
  function shroom(c, x, base, h, rx, cols, R, o) {
    o = o || {}; const sw = Math.max(2, Math.round(rx * .28)), capY = base - h, ry = Math.max(3, Math.round(rx * .42)), S = cols.stem, C = cols.cap;
    for (let y = capY; y <= base; y++) { const fl = y > base - 4 ? (y - (base - 4)) : 0, bend = Math.round(Math.sin((y - capY) / 9) * .8); rect(c, x - sw - fl + bend, y, sw * 2 + fl * 2, 1, S[1]); px(c, x - sw - fl + bend, y, S[2]); px(c, x + sw + fl - 1 + bend, y, S[0]); px(c, x + sw + fl - 2 + bend, y, S[0]); }
    for (let j = -ry; j <= 2; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / ry) * (j / ry)))) ; if (j > 0) { rect(c, x - rx + Math.round(j * 1.2), capY + j, (rx - Math.round(j * 1.2)) * 2, 1, C[0]); continue; } rect(c, x - w, capY + j, w * 2, 1, j < -ry + 2 ? C[2] : C[1]); px(c, x - w, capY + j, C[2]); px(c, x + w - 1, capY + j, C[0]); px(c, x + w - 2, capY + j, C[0]); }
    rect(c, x - rx + 1, capY + 1, rx * 2 - 2, 1, S[0]);
    for (let i = 0, n = o.spots == null ? 2 + Math.floor(rx / 5) : o.spots; i < n; i++) { const sx = x + Math.round((R() - .5) * rx * 1.3), sy = capY - 1 - Math.floor(R() * Math.max(1, ry - 2)); px(c, sx, sy, o.spot || C[2]); px(c, sx + 1, sy, o.spot || C[2]); }
  }
  /* a boulder: a lit top-left, shaded bottom-right, a dark seam underneath, optional moss cap */
  function boulder(c, x, y, rx, ry, cols, R, o) {
    o = o || {}; for (let j = -ry; j <= 0; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / ry) * (j / ry)))); for (let i = -w; i <= w; i++) { const sh = (i / Math.max(1, rx)) * .7 + (j / ry) * -.1 + (j / ry) * .5; const k = sh < -.45 ? 2 : sh < .1 ? 1 : sh < .5 ? 0 : 0; c.fillStyle = k === 2 ? cols[3] || cols[2] : k === 1 ? cols[2] : cols[1]; c.fillRect(Math.round(x + i), Math.round(y + j), 1, 1); } }
    rect(c, x - rx + 1, y, rx * 2 - 1, 1, cols[0]);
    for (let i = 0, n = Math.round(rx * .5); i < n; i++) px(c, x - rx * .6 + R() * rx * 1.2, y - ry * .7 + R() * ry * .6, cols[0]);
    if (o.moss) { for (let i = -Math.round(rx * .7); i < rx * .7; i++) { const t = Math.round(-ry * Math.sqrt(Math.max(0, 1 - (i / rx) * (i / rx)))); px(c, x + i, y + t, o.moss[R() < .5 ? 1 : 0]); if (R() < .5) px(c, x + i, y + t + 1, o.moss[0]); } }
  }
  /* a tuft of grass blades fanning out, leaning with `sway` */
  function tuft(c, x, y, h, cols, R, sway) {
    for (let i = -2; i <= 2; i++) { const bh = Math.max(2, Math.round(h * (1 - Math.abs(i) * .22) + R() * 2)); for (let j = 0; j < bh; j++) { const bx = x + i * 2 + Math.round(i * j * .22) + Math.round(sway * (j / bh)); px(c, bx, y - j, j > bh * .75 ? cols[2] : j > bh * .3 ? cols[1] : cols[0]); } }
  }
  /* a soft cloud bank: flat-bottomed, lit on top */
  function cloud(c, x, y, w, h, cols, R) {
    const n = Math.max(3, Math.round(w / 9)); for (let i = 0; i < n; i++) { const cx = x + (i / (n - 1) - .5) * w * .8, r = h * (.55 + Math.sin(i / (n - 1) * Math.PI) * .6 + R() * .2); ell(c, cx, y - r * .3, r * 1.4, r * .75, cols[1]); }
    for (let i = 0; i < n; i++) { const cx = x + (i / (n - 1) - .5) * w * .8 - 2, r = h * (.5 + Math.sin(i / (n - 1) * Math.PI) * .5); ell(c, cx, y - r * .55, r * 1.1, r * .5, cols[2]); }
    rect(c, x - w * .5, y + 1, w, 1, cols[0]); dith(c, Math.round(x - w * .45), y - 1, Math.round(w * .9), 3, cols[0], 'rgba(0,0,0,0)', (xx, yy) => yy === y + 1 ? 0 : yy === y ? .5 : 1);
  }
  /* depth: how far a colour sinks into the fog. z 0 = here, 1 = lost in the haze. Desaturates a little as it goes. */
  const haze = (col, fog, z) => mix(col, fog, Math.max(0, Math.min(1, z)));
  /* a reflection: the strip above a waterline is copied flipped below it, row by row, each row nudged sideways by wob(j) and fading with depth.
     Works on the layer's own pixels (g.pad / g.padY say where the origin is), so it only mirrors what is already painted. */
  function reflect(c, g, yw, h, a0, wob, tint) {
    const cv = c.canvas, ox = g.pad, oy = g.padY, w = cv.width; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    for (let j = 0; j < h; j++) { const sy = Math.round(yw + oy - 1 - j * 1), dy = Math.round(yw + oy + j); if (sy < 0 || dy >= cv.height) continue; const dx = wob ? Math.round(wob(j)) : 0; c.globalAlpha = a0 * (1 - j / h); c.drawImage(cv, 0, sy, w, 1, dx, dy, w, 1); }
    c.globalAlpha = 1; c.restore();
  }
  return { reflect, hx, mix, rnd, hsh, n1, fbm, px, rect, disk, ell, soft, bay, dith, vgrad, hazeBottom, ridge, crown, broadTree, pine, shroom, boulder, tuft, cloud, haze };
})();
