/* ---------- NK.forest: the painted-forest toolkit ----------
   The reference look: a wide side view of an enchanted wood. Giant mossy trunks frame both sides, their roots run along the ground as
   mossy ridges, glowing spotted mushrooms nest in the roots, layers of gnarled teal trees stand in fog behind, a dirt path covered
   in fallen leaves runs through the middle, ferns and big leaves fill the bottom corners.
   All painters here draw at twice the usual pixel density (the layer def says res:2), so coordinates are viewport units but a pixel is
   half a unit. Colours come from one palette per mood (NK.forest.pal), so every realm in this style is the same kit with other colours. */
NK.forest = (() => {
  const { mix, hsh } = VG, vn = (x, y, s, seed) => NK2.vn(x, y, s, seed);
  const q = v => Math.round(v * 2) / 2;
  const R_ = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(q(x), q(y), Math.max(.5, q(w)), Math.max(.5, q(h))); };
  const rnd = seed => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dth = (x, y) => (B4[((Math.floor(x * 2)) & 3) + (((Math.floor(y * 2)) & 3) << 2)] + .5) / 16;
  /* pick from a ramp (dark..light) at value k in 0..1, dithered in half-unit pixels */
  const pick = (K, k, x, y) => { const v = Math.max(0, Math.min(.9999, k)) * (K.length - 1), i = Math.floor(v), f = v - i; return f > dth(x, y) ? K[i + 1] : K[i]; };
  const gradCol = (st, t) => { t = Math.max(0, Math.min(1, t)); const v = t * (st.length - 1), i = Math.min(st.length - 2, Math.floor(v)); return mix(st[i], st[i + 1], v - i); };
  function blob(c, x, y, rx, ry, col) { for (let yy = -ry; yy <= ry + .01; yy += .5) { const w = rx * Math.sqrt(Math.max(0, 1 - (yy / ry) * (yy / ry))); R_(c, x - w, y + yy, 2 * w, .5, col); } }

  /* ---- palettes ---- */
  const tintAll = (o, col, a) => { if (typeof o === 'string') return mix(o, col, a); if (Array.isArray(o)) return o.map(v => tintAll(v, col, a)); return o; };
  const NIGHT = {
    sky: ['#03171f', '#082e3c', '#0f4e5e', '#1f7f8c'], glow: ['#c8fff8', '#4cc4cc'], glowA: .95, fog: '#0e4a58', farA: '#1c6678', farB: '#10505e', farC: '#08323e', rimC: '#3a9ca8', land: ['#05201f', '#0a3a32', '#12503e'],
    bark: ['#150a08', '#2c1a12', '#4a2e1c', '#6c4528', '#8e5e34'], moss: ['#06200e', '#0e421a', '#1c6420', '#3a8a2c', '#6cb640'], dirt: ['#120b0b', '#231510', '#3a2418', '#573522', '#6e452a'], verge: ['#04161a', '#0a2c26', '#124434', '#1c5c40'],
    leafO: ['#a8480e', '#d86a14', '#f09a24', '#ffc850'], fern: ['#04201c', '#0c3c30', '#165c3e', '#2a8048', '#54ac60'], cap: ['#a8480c', '#e07418', '#f89a28', '#ffd060'], stem: ['#7a7468', '#b8b4a4', '#e4e2d0', '#ffffff'], dot: '#fff2c4',
    beetle: ['#0a1230', '#22408c', '#6a8cf0'], water: ['#082c44', '#10607e', '#3aa8c4', '#bff4f8'], shroomA: .5, rim: 'cool',
  };
  const DAY = {
    sky: ['#4aa8c0', '#7ccccc', '#b4e4c8', '#eaf6c0'], glow: ['#fffbe0', '#fff0a8'], glowA: .8, fog: '#9ed4bc', farA: '#86c4b0', farB: '#5aa090', farC: '#2e7260', rimC: '#d4f2b8', land: ['#2a6a4a', '#3a8a58', '#58aa66'],
    bark: ['#2a1a12', '#4c3224', '#7a5638', '#a47c4c', '#cfa670'], moss: ['#1a5a22', '#34862e', '#5eb23c', '#98d858', '#d6f47c'], dirt: ['#3a2418', '#5a3a26', '#82583a', '#a87a50', '#c89a68'], verge: ['#164a30', '#246a3e', '#38904c', '#58b460'],
    leafO: ['#b8501a', '#e07a22', '#f8a838', '#ffd060'], fern: ['#0e4a34', '#1e7a48', '#38a85a', '#68d070', '#a8f090'], cap: ['#c05a12', '#ee8a22', '#ffb23a', '#ffe27a'], stem: ['#8a8478', '#c8c4b4', '#ecead8', '#ffffff'], dot: '#fff6d0',
    beetle: ['#0c1636', '#24408a', '#6a8ae8'], water: ['#2a7ab0', '#5ab8d4', '#a8e8f0', '#f0ffff'], shroomA: .12, rim: 'warm',
  };
  function pal(mood) {
    if (mood === 'night') return NIGHT; if (mood === 'day') return DAY;
    const P = Object.assign({}, DAY);
    if (mood === 'morning') { for (const k of ['fog', 'farA', 'farB', 'farC', 'land', 'bark', 'moss', 'dirt', 'verge', 'fern']) P[k] = tintAll(DAY[k], '#ffe6b0', .12); P.sky = ['#5ab0c8', '#98d4c8', '#d8ecb8', '#fff4c0']; P.shroomA = .2; return P; }
    for (const k of ['bark', 'moss', 'dirt', 'verge', 'fern', 'land']) P[k] = tintAll(tintAll(DAY[k], '#7a3a4a', .24), '#ff9050', .1);
    Object.assign(P, { sky: ['#2a2a5c', '#8a4a70', '#e88a58', '#ffc888'], glow: ['#fff0c0', '#ffb060'], glowA: 1, fog: '#b87c82', farA: '#a8788c', farB: '#74506e', farC: '#442e4e', rimC: '#ffb878', shroomA: .3 });
    return P;
  }

  /* ---- sky: banded gradient and a bright haze where the light comes from ---- */
  function sky(c, g, P, L, gx, gy) {
    const H = g.H, w = g.x1 - g.x0;
    for (let y = g.y0; y < g.y1; y += .5) R_(c, g.x0, y, w, .5, gradCol(P.sky, Math.round(y / (H * .62) * 16) / 16));
    const r = H * .62, gr = c.createRadialGradient(gx, gy, 0, gx, gy, r); gr.addColorStop(0, P.glow[0]); gr.addColorStop(.18, mix(P.glow[1], P.sky[3], .3) + 'cc'); gr.addColorStop(1, P.glow[1] + '00');
    c.save(); c.globalAlpha = P.glowA; c.fillStyle = gr; c.fillRect(g.x0, g.y0, w, g.y1 - g.y0); c.restore();
    if (P === NIGHT) { c.save(); c.globalAlpha = .55; for (let i = 0; i < 60; i++) { const x = g.x0 + hsh(i, 3, 91) * w, y = g.y0 + hsh(i, 5, 92) * H * .3; R_(c, x, y, .5, .5, '#cfeef0'); } c.restore(); }
  }

  /* ---- gnarled far trees: a trunk that wanders, limbs that fork and curl, and tufts of leaf at the ends ---- */
  function limb(c, x, y, ang, len, w0, w1, col, rim, lightX, R, depth, tuft) {
    const n = Math.max(2, Math.ceil(len / .7)); let cx = x, cy = y, a = ang; const curl = (R() - .5) * .05;
    for (let i = 0; i < n; i++) {
      const t = i / n, w = w0 + (w1 - w0) * t; a += curl + (R() - .5) * .12; cx += Math.cos(a) * .7; cy += Math.sin(a) * .7;
      if (rim) blob(c, cx + lightX * w * .15, cy, w, w, rim); blob(c, cx - lightX * (rim ? w * .22 : 0), cy, rim ? w * .8 : w, rim ? w * .8 : w, col);
      if (depth > 0 && (i === Math.floor(n * .42) || i === Math.floor(n * .7)) && R() < .9) limb(c, cx, cy, a + (R() < .5 ? -1 : 1) * (.5 + R() * .7), len * (.5 + R() * .3), w * .62, Math.max(.4, w1 * .6), col, rim, lightX, R, depth - 1, tuft);
    }
    if (tuft && depth === 0 && R() < .5) { for (let k = 0; k < 2; k++) blob(c, cx + (R() - .5) * 3, cy + (R() - .5) * 2, .8 + R() * 1.1, .6 + R() * .8, tuft); }
  }
  function tree(c, x, base, h, w, col, rim, lightX, seed, tuft, depth) {
    const R = rnd(seed), lean = (R() - .5) * .3; limb(c, x, base + 3, -Math.PI / 2 + lean, h * .6, w * 1.2, w * .42, col, rim, lightX, R, depth == null ? 3 : depth, tuft);
    for (let i = 0; i < 4; i++) { const d = i < 2 ? -1 : 1; limb(c, x + d * w * .7, base + 1, d < 0 ? Math.PI - .25 - R() * .3 : .25 + R() * .3, w * 2.2 + R() * 6, w * .65, w * .2, col, null, lightX, R, 0, null); }
  }
  /* a far tree in mist: one tall tapering trunk, a flared foot, three or four boughs that curve up and thin to nothing */
  function bough(c, x, y, ang, len, w0, w1, col, rim, ld, R, depth) {
    const n = Math.max(2, Math.ceil(len / .6)); let cx = x, cy = y, a = ang; const side = Math.cos(ang) >= 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const t = i / n, w = Math.max(.3, w0 + (w1 - w0) * t); a += (-Math.PI / 2 - a) * .018 + (R() - .5) * .03; cx += Math.cos(a) * .6; cy += Math.sin(a) * .6;
      if (rim) blob(c, cx + ld * w * .2, cy, w * .9, w * .9, rim); blob(c, cx - ld * (rim ? w * .15 : 0), cy, rim ? w * .8 : w, rim ? w * .8 : w, col);
      if (depth > 0 && (i === Math.floor(n * .5) || i === Math.floor(n * .75)) && R() < .8) bough(c, cx, cy, a + side * (.45 + R() * .5) * (i % 2 ? -1 : 1), len * (.35 + R() * .2), w * .55, .3, col, rim, ld, R, depth - 1);
    }
  }
  function ftree(c, x, base, h, w, col, rim, lightX, seed, tuft, depth) {
    const R = rnd(seed), lean = (R() - .5) * .08, th = h * (.55 + R() * .15);
    bough(c, x, base + 3, -Math.PI / 2 + lean, th, w * 1.25, w * .32, col, rim, lightX, R, 0);
    for (const d of [-1, 1]) bough(c, x + d * w * .5, base + 2, d < 0 ? Math.PI - .35 - R() * .2 : .35 + R() * .2, w * 1.8 + R() * w, w * .7, .4, col, null, lightX, R, 0);
    const nb = 3 + (R() < .5 ? 1 : 0);
    for (let i = 0; i < nb; i++) { const t = .42 + i * .17 + R() * .06, d = i % 2 ? 1 : -1; bough(c, x + Math.sin(t * 3 + seed) * w * .1 + lean * th * t, base - th * t, -Math.PI / 2 + d * (.75 + R() * .5), th * (.55 - t * .3) + R() * 6, w * (.62 - t * .25), .3, col, rim, lightX, R, depth == null ? 1 : Math.min(1, depth)); }
  }
  /* a row of trees in fog: gaps are left in the middle where the light comes through */
  function treeRow(c, g, P, o) {
    const R = rnd(o.seed), n = o.n, span = g.x1 - g.x0;
    for (let i = 0; i < n; i++) {
      let x = g.x0 + (i + .5) * span / n + (R() - .5) * span / n * .8; const gap = Math.abs(x - o.gx) / (span * .12); if (gap < 1 && R() < .5) x += (x < o.gx ? -1 : 1) * span * .1 * (1 - gap);
      (o.fn || tree)(c, x, o.base + (R() - .5) * o.jit, o.h * (.7 + R() * .5), o.w * (.7 + R() * .6), o.col, o.rim, x < o.gx ? 1 : -1, o.seed * 100 + i, o.tuft, o.depth);
    }
  }
  function fogBand(c, g, col, y0, y1, a0, a1) { const [r, gg, b] = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)); for (let y = y0; y < y1; y += .5) { const t = (y - y0) / (y1 - y0), a = a0 + (a1 - a0) * t * t * (3 - 2 * t); R_(c, g.x0, y, g.x1 - g.x0, .5, `rgba(${r},${gg},${b},${a.toFixed(3)})`); } }

  /* ---- the ground: soil, path, moss, scattered leaves ---- */
  const pathX = (L, y, sw) => L.cx + Math.sin((y - sw) / 21 + .6) * 22 - (y - sw) * .22;
  function floor(c, g, P, L, top) {
    const H = g.H, sw = L.sw, x0 = g.x0, x1 = g.x1;
    for (let y = top - 4; y < g.y1; y += .5) {
      const t = Math.max(0, (y - sw + 6) / (H - sw + 14)), yb = y;
      for (let x = x0; x < x1; x += .5) {
        const bump = Math.sin(x / 9 + 1.3) * 1.6 + Math.sin(x / 4.1) * .7; if (y < top + bump) continue;
        const n = vn(x * 2.1, y * 3.1, 7, 3), n2 = vn(x * 6, y * 8, 5, 9), px = pathX(L, y, sw), hw = 4 + Math.max(0, y - sw + 10) * .95 + (n - .5) * 7, onPath = Math.abs(x - px) < hw && y > sw - 12;
        let col;
        if (onPath) { const e = Math.abs(x - px) / hw; col = pick(P.dirt, .18 + t * .5 + (n - .5) * .5 - e * e * .3 + (n2 - .5) * .15, x, y); }
        else { const m = vn(x * 1.5, y * 2.2, 9, 5); col = gradCol(P.verge, .25 + (n - .5) * .5 + t * .15 + (m > .6 ? .35 : 0)); if (m > .66 && n2 > .45) col = gradCol(P.moss, .15 + (n2 - .4) * .8); }
        R_(c, x, y, .5, .5, col);
      }
    }
  }
  /* a maple-ish fallen leaf: five lobes flattened into the ground plane */
  function leaf(c, x, y, s, K, R) {
    const rot = R() * 6.28, col = K[1 + Math.floor(R() * 3)], hi = K[Math.min(3, 2 + Math.floor(R() * 2))];
    for (let i = 0; i < 5; i++) { const a = rot + i * 1.2566, len = s * (i % 2 ? .52 : .66); for (let k = 0; k < len; k += .35) { const w = Math.max(.25, (1 - k / len) * s * .2 + .2), cx = x + Math.cos(a) * k, cy = y + Math.sin(a) * k * .55; R_(c, cx - w, cy, w * 2, .5, k < len * .5 ? col : hi); } }
    R_(c, x - s * .12, y, s * .24, .5, K[0]);
  }
  function leaves(c, g, P, L, n, seed, top) {
    const R = rnd(seed), sw = L.sw, H = g.H;
    for (let i = 0; i < n; i++) { const y = top + R() * (H + 8 - top), t = Math.max(0, (y - top) / (H - top)), x = g.x0 + R() * (g.x1 - g.x0); leaf(c, x, y, 1.6 + t * 3.8 + R() * 1.2, P.leafO, R); }
  }
  function beetle(c, x, y, P, d) { blob(c, x, y, 1.4, .9, P.beetle[0]); R_(c, x - .5 * d, y - .5, 1, .5, P.beetle[1]); R_(c, x + d, y - .5, .5, .5, P.beetle[2]); R_(c, x - 1.5, y + .5, .5, .5, P.beetle[0]); R_(c, x + 1, y + .5, .5, .5, P.beetle[0]); }

  /* ---- a giant trunk: ridged bark lit from one side, moss in the folds and on every upward face ---- */
  function trunk(c, g, P, o) {
    const R = rnd(o.seed), top = g.y0, base = o.base, ld = o.light || 1;
    for (let y = top; y <= base + 6; y += .5) {
      const t = (y - top) / (base - top), cx = o.x + Math.sin(y / 34 + o.seed) * (o.sway || 2) + (o.lean || 0) * (1 - t), fl = Math.pow(Math.max(0, (y - (base - 34)) / 34), 2.2) * o.flare, hw = o.w0 + (o.w1 - o.w0) * t + fl;
      for (let x = cx - hw; x <= cx + hw; x += .5) {
        const u = (x - cx) / hw, e = Math.abs(u), n = vn(x * 3.1, y * .55, 6, o.seed), r2 = vn(x * 1.4, y * 2.2, 8, o.seed + 4), ridge = Math.sin((x - cx) * 1.1 + n * 4 + Math.sin(y / 17 + o.seed) * 1.2) > .4 ? -.3 : (Math.sin((x - cx) * 2.3 + n * 5) > .8 ? .14 : 0);
        let k = .52 + ld * u * .32 + (n - .5) * .55 + ridge + (r2 - .5) * .18 - e * e * .22; let col = pick(P.bark, k, x, y);
        if (e > .94) col = P.bark[0];
        const moss = vn(x * 1.1, y * .6, 7, o.seed + 3) + Math.max(0, (y - (base - 56)) / 56) * .45 + (u * ld > .25 ? .12 : 0) + (o.moss || 0) - e * .12 + (hsh(Math.floor(x * 2), Math.floor(y * 2), 5) - .5) * .22;
        if (moss > .72 && e <= .94) col = pick(P.moss, (moss - .7) * 1.6 + (n - .5) * .5 + (u * -ld < 0 ? .1 : -.05), x, y);
        R_(c, x, y, .5, .5, col);
      }
    }
  }
  /* a root: leaves the trunk, arches, runs along the ground and dives. Bark first, then a moss cap on the upward side */
  function root(c, P, o) {
    const pts = [], n = Math.ceil(o.len / .8), R = rnd(o.seed);
    for (let i = 0; i <= n; i++) { const t = i / n, x = o.x + o.dir * o.len * t + Math.sin(t * 7 + o.seed) * .8, y = o.y - Math.sin(Math.PI * Math.pow(t, .7)) * o.arch + t * o.drop + Math.sin(t * 5 + o.seed) * .8; pts.push([x, y, Math.max(1, o.w * Math.pow(1 - t, .75) + .8)]); }
    for (const [x, y, r] of pts) blob(c, x, y, r, r * .85, P.bark[1]);
    for (const [x, y, r] of pts) blob(c, x - o.dir * r * .2, y + r * .18, r * .7, r * .55, P.bark[0]);
    if (o.moss !== false) {
      for (const [x, y, r] of pts) blob(c, x, y - r * .35, r * .98, r * .62, P.moss[1]);
      for (const [x, y, r] of pts) blob(c, x - o.dir * r * .1, y - r * .52, r * .8, r * .4, P.moss[2]);
      for (const [x, y, r] of pts) { if (R() < .6) R_(c, x - r * .5 + R() * r, y - r * .8, 1 + R(), .5, P.moss[3]); }
      for (const [x, y, r] of pts) { if (R() < .22) R_(c, x + (R() - .5) * r * 1.4, y - r * 1.05, .5 + R(), .5, P.moss[4]); }
    }
  }
  /* a spotted mushroom cap and stem. big ones get a pale gill rim and a ring */
  function shroom(c, x, y, r, h, P, seed, lit) {
    const R = rnd(seed), sw = Math.max(.7, r * .2), top = y - h, ry = r * .74;
    for (let j = 0; j < h; j += .5) { const t = j / h, w = sw * (1 + (1 - t) * .5 + (t > .86 ? .3 : 0)); R_(c, x - w, y - j, w * 2, .5, P.stem[1]); R_(c, x - w, y - j, w * .62, .5, P.stem[3]); R_(c, x + w * .45, y - j, w * .55, .5, P.stem[0]); }
    R_(c, x - sw * 1.8, y - .5, sw * 3.6, .5, P.stem[0]);
    if (r > 4) { R_(c, x - sw * 1.3, top + h * .32, sw * 2.6, .5, P.stem[0]); R_(c, x - sw * 1.3, top + h * .32 - .5, sw * 2.6, .5, P.stem[3]); }
    blob(c, x, top + ry * .22, r * .98, ry * .4, mix(P.stem[1], '#7a5a86', .5)); blob(c, x, top + ry * .14, r * .9, ry * .3, mix(P.stem[2], '#d0b0c8', .4));
    blob(c, x, top - ry * .1, r + .5, ry + .5, P.cap[0]); blob(c, x, top - ry * .12, r, ry, P.cap[1]); blob(c, x - r * .08, top - ry * .26, r * .84, ry * .72, P.cap[2]); blob(c, x - r * .34, top - ry * .5, r * .3, ry * .22, P.cap[3]);
    if (lit) blob(c, x + r * .3, top - ry * .3, r * .4, ry * .26, P.cap[2]);
    for (let i = 0; i < Math.round(r * 2.6); i++) { const a = R() * 3.14, rr = Math.sqrt(R()) * .86, dx = Math.cos(a) * r * rr, dy = -Math.sin(a) * ry * rr * .92 - ry * .08; R_(c, x + dx, top + dy, r > 6 ? 1 : .5, .5 + (r > 6 && R() < .5 ? .5 : 0), P.dot); }
    R_(c, x - r, top + ry * .02, r * 2, .5, P.cap[0]);
  }
  /* a fern frond: a curved rib with leaflets that shorten toward the tip */
  function frond(c, P, x, y, ang, len, seed, K) {
    K = K || P.fern; const R = rnd(seed), n = Math.ceil(len / .7); let cx = x, cy = y, a = ang; const curl = (R() < .5 ? -1 : 1) * (.018 + R() * .02);
    for (let i = 0; i < n; i++) {
      const t = i / n; a += curl; cx += Math.cos(a) * .7; cy += Math.sin(a) * .7; R_(c, cx, cy, .5, .5, K[2]);
      if (i % 2 === 0) { const ll = (1 - t * .85) * len * .22 + .8; for (const s of [-1, 1]) { const la = a + s * 1.15; for (let j = 1; j < ll * 2; j++) { const lx = cx + Math.cos(la) * j * .5, ly = cy + Math.sin(la) * j * .5 + j * .08; R_(c, lx, ly, .5, .5, j > ll * 1.3 ? K[3] : (s < 0 ? K[2] : K[1])); } R_(c, cx + Math.cos(a + s * 1.15) * ll * .9, cy + Math.sin(a + s * 1.15) * ll * .9 - .5, .5, .5, K[4] || K[3]); } }
    }
  }
  /* a broad veined leaf: curved axis, width swelling to a point, lit along one edge */
  function bigLeaf(c, P, x, y, ang, len, wid, seed) {
    const R = rnd(seed), n = Math.ceil(len / .6); let cx = x, cy = y, a = ang; const curl = (R() < .5 ? -1 : 1) * (.02 + R() * .02);
    for (let i = 0; i < n; i++) {
      const t = i / n, w = Math.sin(Math.PI * Math.pow(t, .8)) * wid; a += curl; cx += Math.cos(a) * .6; cy += Math.sin(a) * .6; const nx = -Math.sin(a), ny = Math.cos(a);
      for (let s = -w; s <= w; s += .5) { const e = Math.abs(s) / Math.max(.5, w), v = .5 + (s > 0 ? .22 : -.1) - e * .25 + (hsh(Math.floor(cx * 2 + s), Math.floor(cy * 2), 9) - .5) * .25; R_(c, cx + nx * s, cy + ny * s, .5, .5, pick(P.fern, v + .1, cx + nx * s, cy + ny * s)); }
      R_(c, cx, cy, .5, .5, P.fern[4]); if (i % 7 === 3) for (const sg of [-1, 1]) for (let j = 1; j < w * 1.6; j++) R_(c, cx + nx * sg * j * .55 + Math.cos(a) * j * .35, cy + ny * sg * j * .55 + Math.sin(a) * j * .35, .5, .5, P.fern[3]);
    }
  }
  /* soft rim of moss along the near ground edge, lit mounds in the mid distance */
  function mound(c, P, x, y, w, h, seed) { const R = rnd(seed); blob(c, x, y, w, h, P.moss[0]); blob(c, x, y - h * .1, w * .96, h * .85, P.moss[1]); blob(c, x - w * .08, y - h * .3, w * .78, h * .55, P.moss[2]); for (let i = 0; i < w; i++) R_(c, x - w * .7 + R() * w * 1.4, y - h * (.65 + R() * .1), .5 + R(), .5, P.moss[3]); }


  /* a faceted crystal: three flat faces lit from the left, tapering to a point, with a bright edge and an inner streak */
  function prism(c, x, base, w, h, lean, K, glow) {
    const tipH = Math.min(h * .3, w * 1.2);
    for (let y = base; y > base - h; y -= .5) {
      const t = (base - y) / h, cx = x + lean * (base - y), tp = Math.max(0, (t * h - (h - tipH)) / tipH), ww = w * (1 - t * .12) * (1 - tp * tp * .98) / 2; if (ww < .25) break;
      const x0 = cx - ww, x1 = cx + ww, a = x0 + ww * .5, b = x0 + ww * 1.25;
      R_(c, x0 - .5, y, ww * 2 + 1, .5, K[0]); R_(c, x0, y, a - x0, .5, K[1]); R_(c, a, y, b - a, .5, K[2]); R_(c, b, y, x1 - b, .5, K[1]);
      R_(c, x0, y, .5, .5, K[3]); if (glow) R_(c, a + (b - a) * .4, y, .5, .5, K[3]);
      if (((base - y) | 0) % 31 === 0) R_(c, a, y, b - a, .5, K[3]);
    }
  }
  function crystalCluster(c, x, base, s, K, K2, seed) {
    const R = rnd(seed); for (let i = 0; i < 6; i++) { const d = (i - 2.5) * s * .22 + (R() - .5) * s * .1, h = s * (.5 + R() * .7) * (1 - Math.abs(i - 2.5) * .12); prism(c, x + d, base - Math.abs(i - 2.5) * .6, s * (.14 + R() * .1), h, (R() - .5) * .22 + d * .012, i % 3 ? K : K2, i % 2); }
  }

  /* depth for everything on the stage: a dark outline round every shape, a light edge on the top-left, a shaded edge on the bottom-right.
     Works on the finished stage canvas, so plants, folk, animals and the house all get it without being redrawn. */
  let _t1 = null, _t2 = null;
  function depth(c, mood) {
    const cv = c.canvas, w = cv.width, h = cv.height; if (!_t1 || _t1.width !== w || _t1.height !== h) { _t1 = document.createElement('canvas'); _t2 = document.createElement('canvas'); _t1.width = _t2.width = w; _t1.height = _t2.height = h; }
    const a = _t1.getContext('2d'), b = _t2.getContext('2d'), night = mood === 'night', dark = night ? '#020c10' : mood === 'sunset' ? '#1a0e1c' : '#0e1c14', lite = night ? '#9ae8ff' : mood === 'sunset' ? '#ffd2a0' : '#fffbe0';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    /* outline behind */
    a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, w, h); a.drawImage(cv, 0, 0); a.globalCompositeOperation = 'source-in'; a.fillStyle = dark; a.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-over'; c.globalAlpha = night ? .85 : .7; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.drawImage(_t1, dx, dy); c.globalAlpha = 1;
    /* light edge: pixels whose up-left neighbour is empty */
    c.globalCompositeOperation = 'source-over'; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, w, h); b.drawImage(cv, 0, 0); b.globalCompositeOperation = 'destination-out'; b.drawImage(cv, 1, 1); b.globalCompositeOperation = 'source-atop'; b.fillStyle = lite; b.fillRect(0, 0, w, h);
    c.globalAlpha = night ? .3 : .38; c.drawImage(_t2, 0, 0);
    /* shaded edge: pixels whose down-right neighbour is empty */
    b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, w, h); b.drawImage(cv, 0, 0); b.globalCompositeOperation = 'destination-out'; b.drawImage(cv, -1, -1); b.globalCompositeOperation = 'source-atop'; b.fillStyle = dark; b.fillRect(0, 0, w, h);
    c.globalAlpha = .4; c.drawImage(_t2, 0, 0); c.globalAlpha = 1; c.restore();
  }

  /* keep the stage calm: three crops, one of each other plant, three folk, two sprites */
  function calm(D) {
    const seen = new Set(), crops = D.plants.filter(p => p.crop).slice(0, 3); crops.forEach(p => seen.add(p.k));
    D.plants = crops.concat(D.plants.filter(p => !p.crop && !seen.has(p.k) && (seen.add(p.k), true)));
    if (D.folk.length > 3) D.folk = D.folk.filter((fd, i) => i !== 2); if (D.sprites.n > 2) D.sprites.n = 2;
  }

  /* a layered pine for cold wood rows: tiers of boughs getting wider toward the ground, snow on the upper edge of each */
  function pine(c, x, base, h, w, col, rim, lightX, seed, tuft) {
    const R = rnd(seed), tiers = Math.max(4, Math.round(h / 14)); R_(c, x - w * .3, base - h * .1, w * .6, h * .1 + 3, col);
    for (let i = 0; i < tiers; i++) { const t = i / tiers, y = base - h * .1 - h * .9 * (1 - t) + h * .05, ww = w * (1.2 + t * 3.6) * (.85 + R() * .3), th = h / tiers * 1.5;
      for (let j = 0; j < th; j += .5) { const u = j / th, hw = ww * u; R_(c, x - hw, y + j, hw * 2, .5, col); if (rim && j < 1.6 + t) R_(c, x - hw, y + j, hw * 2 * .82, .5, rim); } }
  }
  /* a stream across the ground: banks, a body of water with the light on it, ripples */
  function stream(c, g, P, y0, h, seed) {
    const R = rnd(seed), x0 = g.x0, x1 = g.x1;
    for (let y = y0 - 1; y < y0 + h + 1; y += .5) for (let x = x0; x < x1; x += .5) { const wob = Math.sin(x / 17 + seed) * 1.4 + Math.sin(x / 6) * .5, t = (y - y0 - wob) / h; if (t < -.08 || t > 1.08) continue; if (t < 0 || t > 1) { R_(c, x, y, .5, .5, P.moss[1]); continue; }
      const n = vn(x * 2, y * 7, 5, 4); R_(c, x, y, .5, .5, pick(P.water, .15 + t * .25 + n * .5 + (Math.abs(x - g.W * .62) < 18 ? .25 : 0), x, y)); }
    for (let i = 0; i < 70; i++) { const x = x0 + R() * (x1 - x0), y = y0 + 1 + R() * (h - 2); R_(c, x, y, 2 + R() * 5, .5, P.water[3]); }
  }
  /* a column of carved glyphs: short strokes on a 3 by 5 grid, in a bright colour with a darker echo */
  function runes(c, x, y0, y1, col, echo, seed, w) {
    const R = rnd(seed); for (let y = y0; y < y1; y += 8.5 + R() * 2) { const gx = x + (R() - .5) * (w || 1.5); R_(c, gx - 1.5, y, 3.5, 5.5, echo); for (let k = 0; k < 4; k++) { const a = Math.floor(R() * 5); if (R() < .5) R_(c, gx - 1.5 + Math.floor(R() * 3) * 1, y + a, 2 + (R() < .5 ? 1 : 0), .5, col); else R_(c, gx - 1.5 + Math.floor(R() * 3) * 1, y + Math.min(4, a), .5, 1.5, col); } R_(c, gx - 1.5, y, 3, .5, col); }
  }
  /* the goal house, in eight stages, for any realm: marker, footing, frame, low walls, high walls, roof frame, roof, finishing touches */
  function cabin(c, x, base, st, T, S) {
    const W = 38, cx = x + W / 2, wl = S.wall, rf = S.roof, tr = S.trim, lit = T.mood !== 'day', rect = VG.rect, px = VG.px, disk = VG.disk, ell = VG.ell;
    NK.shadow(c, cx, base, W / 2 + 4, .3);
    if (st === 0) { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, mx = Math.round(cx + Math.cos(a) * 15), my = Math.round(base - 1 + Math.sin(a) * 3); rect(c, mx - 1, my - 2, 3, 2, S.stone[i % 2 ? 1 : 2]); px(c, mx - 1, my - 2, S.stone[3]); } rect(c, cx - 1, base - 14, 1, 14, tr[1]); rect(c, cx, base - 14, 6, 3, rf[2]); rect(c, cx, base - 14, 6, 1, rf[3]); return; }
    for (let i = 0; i < 7; i++) { const sx = x + 4 + i * 4 + (i % 2), sy = base - 3 - (i % 3 === 1 ? 1 : 0); rect(c, sx, sy, 5, 4, S.stone[i % 2 ? 1 : 2]); px(c, sx, sy, S.stone[3]); rect(c, sx, sy + 3, 5, 1, S.stone[0]); }
    if (st === 1) return;
    const top = base - 22; for (const p of [7, 15, 23, 31]) { rect(c, x + p, top, 2, 19, tr[1]); rect(c, x + p, top, 1, 19, tr[2]); } rect(c, x + 7, top, 26, 2, tr[0]); rect(c, x + 7, base - 4, 26, 2, tr[0]);
    if (st === 2) return;
    const hh = st === 3 ? 8 : 18;
    for (let j = 0; j < hh; j++) for (let i = 8; i < 32; i++) { const e = i < 11 ? wl[3] : i > 29 ? wl[0] : (S.logs ? (j % 3 === 2 ? wl[0] : wl[2]) : ((j * 5 + i) % 9 === 0 ? wl[1] : wl[2])); px(c, x + i, base - 5 - j, e); }
    if (S.logs) for (let j = 0; j < hh; j += 3) { px(c, x + 8, base - 5 - j, wl[3]); px(c, x + 31, base - 5 - j, wl[1]); }
    if (st < 5) { if (st === 4) { for (const wx of [10, 24]) rect(c, x + wx, base - 18, 6, 6, tr[0]); } return; }
    if (st === 5) { for (let k = 0; k < 7; k++) { const px_ = x + 4 + k * 5; for (let j = 0; j < 12; j++) px(c, Math.round(px_ + (cx - px_) * j / 12 * .5), top - j, tr[1 + (j & 1)]); } rect(c, x + 3, top + 1, W - 6, 2, tr[0]); return; }
    const ph = S.dome ? 14 : 15;
    for (let j = 0; j < ph; j++) { const w = S.dome ? Math.round((W / 2 + 3) * Math.sqrt(Math.max(0, 1 - Math.pow((j - 2) / ph, 2)))) : Math.round((W / 2 + 3) * (1 - j / (ph + 1))), y = top - j + 1; rect(c, cx - w, y, w * 2, 1, j < 3 ? rf[0] : (j + (S.dome ? 0 : 1)) % 3 === 0 ? rf[1] : rf[2]); px(c, cx - w, y, rf[3]); px(c, cx + w - 1, y, rf[0]); if (S.shingle && j % 2 === 0) for (let i = -w + 1; i < w; i += 3) px(c, cx + i, y, rf[1]); }
    if (S.snow) { for (let j = 0; j < ph; j++) { const w = Math.round((W / 2 + 3) * (1 - j / (ph + 1))), y = top - j + 1; if (j > ph * .3) rect(c, cx - w + 1, y, w * 2 - 2, 1, '#f4faff'); else if (j > 1) { for (let i = -w; i < w; i += 3) rect(c, cx + i, y, 2, 1, '#f4faff'); } } rect(c, x - 3, top + 1, W + 6, 1, '#dcecf8'); } else rect(c, x - 2, top + 1, W + 4, 2, rf[0]);
    if (S.chimney) { rect(c, x + 27, top - 14, 4, 9, S.stone[1]); rect(c, x + 27, top - 14, 1, 9, S.stone[2]); rect(c, x + 26, top - 15, 6, 2, S.stone[0]); }
    if (st === 6) return;
    for (const wx of [10, 24]) { NK.window(c, x + wx, base - 18, 6, 6, lit, [tr[0], '#8ad0f0', tr[1], S.glow || '#ffd88a']); rect(c, x + wx - 1, base - 11, 8, 2, tr[1]); if (S.flowers) for (let i = 0; i < 4; i++) px(c, x + wx + i * 2, base - 12, S.flowers[i % S.flowers.length]); }
    ell(c, cx, base - 9, 4, 6, '#06141a'); ell(c, cx, base - 9, 3, 5, S.door || '#6a4a2a'); rect(c, cx, base - 12, 1, 7, tr[0]); px(c, cx + 2, base - 8, '#f0d070');
    rect(c, x + W + 3, base - 14, 1, 14, tr[1]); rect(c, x + W + 1, base - 18, 5, 5, lit ? '#ffe8a0' : '#9ad0e8'); rect(c, x + W + 1, base - 18, 5, 1, tr[0]); px(c, x + W + 2, base - 17, '#ffffff');
  }
  function shed(c, x, base, T, S) {
    const rect = VG.rect, px = VG.px; NK.shadow(c, x + 8, base, 12, .3);
    for (let j = 0; j < 10; j++) rect(c, x, base - 10 + j, 16, 1, j < 2 ? S.wall[3] : j > 7 ? S.wall[0] : S.wall[2]); for (let j = 0; j < 10; j += 3) rect(c, x + 1, base - 9 + j, 14, 1, S.wall[0]);
    rect(c, x - 1, base - 12, 18, 3, S.roof[1]); rect(c, x - 1, base - 12, 18, 1, S.roof[3]); rect(c, x - 1, base - 10, 18, 1, S.roof[0]); if (S.snow) { rect(c, x - 1, base - 13, 18, 1, '#f4faff'); rect(c, x + 2, base - 14, 12, 1, '#f4faff'); }
    VG.ell(c, x + 8, base - 4, 3, 4, '#06141a'); VG.ell(c, x + 8, base - 4, 2, 3, S.door || '#2a1608'); NK.window(c, x + 12, base - 8, 3, 3, T.mood !== 'day', [S.trim[0], '#9ad0e8', S.trim[1], S.glow || '#ffd890']);
    rect(c, x + 1, base - 3, 4, 3, S.trim[1]); px(c, x + 1, base - 3, S.trim[2]);
  }

  /* the shared skeleton for a realm in this style: sky, three far rows, floor, stage, near, blurred leaves */
  function compose(D, FS) {
    calm(D);
    D.ground = () => { }; D.liveExtra = null; D.rim = null;
    D.geom = (L, G0, H) => { const sw = L.sw; L.lx = L.wide ? L.x0 - 40 : L.x0 - 18; L.lamps = []; L.heart = { x: L.spirit.x, y: sw - (FS.heartDy || 10) }; if (FS.waterDy) L.water.y = sw + FS.waterDy; if (FS.waterU != null) L.water.x = NK.u(L, FS.waterU); if (FS.geom) FS.geom(L, sw); };
    D.rays = (g, L) => { if (g.mood === 'night' && !FS.nightRays) return []; const gx = Math.round(g.W * .62), out = []; for (let i = 0; i < 4; i++) out.push({ x: gx - 26 + i * 14, w: 6 + i * 2, sk: .35, a: g.T.shaftA * (g.mood === 'night' ? .8 : 1.3), d: i * 2.2, col: g.T.shaft }); return out; };
    D.lights = (f, g, L) => FS.lights(f, g, L);
    D.layersFn = (g, { T, L, H, stageLayer }) => {
      const P = FS.pal(g.mood), gx = Math.round(g.W * .62), gy = Math.round(H * .15), out = [{ id: 'sky', k: .04, res: 2, paint: (c, g2) => { sky(c, g2, P, L, gx, gy); if (FS.skyExtra) FS.skyExtra(c, g2, P, L, gx, gy); } }];
      FS.far(P, L, H, gx).forEach((r, i) => out.push({ id: 'far' + i, k: r.k, res: 2, blur: r.blur, paint: (c, g2) => { if (r.trees) treeRow(c, g2, P, Object.assign({ gx }, r.trees)); if (r.paint) r.paint(c, g2, P, L, H); if (r.fog) fogBand(c, g2, r.fog[2] || P.fog, H * r.fog[0], H * r.fog[1], 0, r.fog[3] == null ? .5 : r.fog[3]); } }));
      out.push({ id: 'floor', k: .56, res: 2, paint: (c, g2) => FS.floor(c, g2, P, L, H) }, stageLayer, { id: 'near', k: 1.1, res: 2, paint: (c, g2) => FS.near(c, g2, P, L, H) }, { id: 'fg', k: 1.8, blur: 2.6, op: FS.fgOp || .55, paint: (c, g2) => D.fg(c, g2, T, L, H, g.W) });
      return out;
    };
  }
  /* shared pieces of a floor: dew pool, plot of rich soil, scattered beetles */
  function pool(c, P, L, W_) { const wp = L.water, pr = L.wide ? 13 : 9; blob(c, wp.x, wp.y + .5, pr + 1.5, 4.5, P.bark[0]); blob(c, wp.x, wp.y, pr, 3.6, W_[0]); blob(c, wp.x, wp.y - .5, pr - 1.5, 2.6, W_[1]); blob(c, wp.x - 2, wp.y - 1, pr * .5, 1.2, W_[2]); R_(c, wp.x - pr * .4, wp.y - 1, pr * .5, .5, W_[3]); for (let i = 0; i < 9; i++) mound(c, P, wp.x - pr - 1 + i * (pr * 2 + 2) / 8, wp.y + 1.5 + (i % 2) * .5, 2.4, 1.1, 90 + i); }
  function plot(c, P, L) { const px0 = L.patch.x0, px1 = L.patch.x1, pcx = (px0 + px1) / 2, sw = L.sw; blob(c, pcx, sw + 17, (px1 - px0) / 2 + 6, 13, P.dirt[0]); blob(c, pcx, sw + 16.5, (px1 - px0) / 2 + 4, 11.5, P.dirt[1]); blob(c, pcx, sw + 16, (px1 - px0) / 2 + 1, 9.5, P.dirt[2]); for (let i = 0; i < 12; i++) mound(c, P, px0 - 3 + i * (px1 - px0 + 6) / 11, sw + 27 - (i % 2), 3.2, 1.4, 120 + i); }
  function farGround(c, g, P, H, y0f) { const y0 = H * (y0f || .6); for (let y = y0 - 3; y < g.y1; y += .5) for (let x = g.x0; x < g.x1; x += .5) { const yt = y0 + Math.sin(x / 13) * 2 + Math.sin(x / 5.3) * .8; if (y < yt) continue; R_(c, x, y, .5, .5, pick(P.land, (y - yt) / 30 + (vn(x * 3, y * 3, 6, 2) - .5) * .4, x, y)); } for (let i = 0; i < 9; i++) mound(c, P, g.x0 + 14 + i * (g.x1 - g.x0 - 28) / 8, y0 + 3, 12 + (i % 3) * 4, 3.5, 20 + i); }
  /* a broad-leaved tree in layers of fog: a short trunk and a heap of round crowns, lighter on top */
  function oak(c, x, base, h, w, col, rim, lightX, seed, tuft) {
    const R = rnd(seed); limb(c, x, base + 3, -Math.PI / 2 + (R() - .5) * .1, h * .5, w, w * .8, col, null, lightX, R, 0, null); const cy = base - h * .56;
    for (let i = 0; i < 10; i++) blob(c, x + (R() - .5) * w * 9, cy + (R() - .3) * h * .24, w * (2.6 + R() * 2.4), w * (1.7 + R() * 1.6), col);
    for (let i = 0; i < 7; i++) blob(c, x + (R() - .5) * w * 8, cy - h * .1 + (R() - .5) * h * .16, w * (1.8 + R() * 1.8), w * (1 + R() * 1.1), rim || col);
  }
  /* a straight tall trunk with a heavy crown, for the deep-wood rows */
  function pillar(c, x, base, h, w, col, rim, lightX, seed, tuft) { const R = rnd(seed); limb(c, x, base + 3, -Math.PI / 2 + (R() - .5) * .06, h, w, w * .9, col, rim, lightX, R, 0, null); for (let i = 0; i < 7; i++) blob(c, x + (R() - .5) * w * 7, base - h * (.82 + R() * .22), w * (1.8 + R() * 2.6), w * (1 + R() * 1.1), tuft || col); }

  return { ftree, pine, stream, runes, cabin, shed, depth, oak, calm, prism, crystalCluster, compose, pool, plot, farGround, pillar, pal, sky, tree, treeRow, fogBand, floor, leaves, leaf, beetle, trunk, root, shroom, frond, bigLeaf, mound, blob, R_, rnd, pick, gradCol, dth, vn };
})();
