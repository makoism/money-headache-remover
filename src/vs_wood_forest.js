/* ---------- Fairy Woods: the enchanted night forest (reference look) ----------
   Seen through ferns and two huge trunks: a mossy clearing, a toadstool cottage that you build, a pantry in a hollow log, a ring of glowing
   mushrooms and bluebells that the fairies tend, a stream with stepping stones, and the Whisper Willow whose hanging lantern-buds are the
   fairies' homes. Fairies carry dew in acorn cups from the stream, light the lanterns, bring berries to the pantry, and go in at dusk.
   Will-o-wisps from the willow's hollow wake a flower or feed a fox. A fawn with blossom antlers and a luna moth are the realm's magic. */
(() => {
  const RAMPX = { wall: ['#4a3042', '#64424c', '#84605a', '#a8806c', '#c8a48a'], floor: ['#1c5a4c', '#2a7a5a', '#3a9a64', '#5cb874', '#86d68c'], ring: ['#06040a', '#110a15', '#1d1321', '#32213c'], door: ['#8a6a5a', '#b08a74', '#d8b898'] };
  const SKY = { morning: ['#6ea8a0', '#a8d0b8', '#e8e8b8', '#fff4c8'], day: ['#4aa0b8', '#7cc8c4', '#b8e4cc', '#e4f4c8'], sunset: ['#40306a', '#9a5a8a', '#f09a6a', '#ffcc88'], night: ['#04081c', '#0c1838', '#183050', '#264462'] };
  const FOG = { morning: '#c8dcc8', day: '#b4d8d0', sunset: '#d89aa0', night: '#142a48' };
  const RAMPS = {
    moss: ['#0c3430', '#1a6648', '#38985a', '#86d07a'], leaf: ['#06231f', '#0e4a3a', '#1f7a50', '#6cc870'], bark: ['#1e1420', '#46303a', '#745256', '#ad8a80'], water: ['#103a62', '#2a78a0', '#6cbcd0', '#c8f4f0'],
    stone: ['#3c4650', '#76848c', '#aab8b8', '#dce8e4'], soil: ['#22160e', '#42281a', '#6a4428', '#946a40'], cream: ['#8c7a6a', '#d8c8aa', '#f0e4c8', '#fffaec'], cap: ['#7a1a28', '#c83a34', '#f0624a', '#ffa890'],
    glow: ['#1a7ab0', '#3ab8e0', '#8ae8f8', '#e8ffff'], bloom: ['#4a2a8a', '#8a5ad0', '#b896f0', '#e8d8ff'], wood: ['#2a1e18', '#5a4030', '#8a6644', '#c09a68'], petal: ['#a83a6a', '#f070a0', '#ffc4dc', '#ffffff'],
  };
  const WING = ['#a8e8f8', '#e8ffff'];
  const DRESS = [['#7a2a5a', '#d05a98', '#ff9ac8'], ['#2a4a8a', '#4a8ad0', '#8ac4ff'], ['#7a6a14', '#d8b838', '#fff08a'], ['#4a2a7a', '#8a5ac8', '#c8a4ff']];
  const BUBBLE = { bg: '#f0fff4', edge: '#103a30', ink: ['#2a9a7a', '#d05a98', '#e0902a', '#3a8ad8'] };
  const OL = '#071e1c';
  const { mix, rnd, px, rect, disk, ell, vgrad, hazeBottom, haze, hsh } = VG;
  const hz_ = (K, fog, z) => K.map(c => haze(c, fog, z));

  function paintSky(c, g, T, L) {
    const R = rnd(5), hz = L.hz; vgrad(c, g.x0, g.x1, g.y0, g.y1, [T.sky[0], T.sky[1], T.sky[2], T.sky[3]]);
    if (T.mood === 'night') { for (let i = 0; i < 80; i++) px(c, g.x0 + Math.floor(R() * (g.x1 - g.x0)), g.y0 + Math.floor(R() * hz), R() > .85 ? '#ffffff' : '#8fa4d8'); disk(c, L.cx + 14, 30, 6, '#f4f2dc'); disk(c, L.cx + 17, 28, 5, T.sky[1]); }
    else if (T.mood === 'sunset') { disk(c, L.cx - 20, hz - 6, 8, '#fff0b0'); disk(c, L.cx - 20, hz - 6, 5, '#ffffe0'); }
    else { disk(c, L.cx - 18, 30, 6, '#fffbe4'); disk(c, L.cx - 18, 30, 4, '#ffffff'); }
  }
  /* a far wood: paler trunks in mist, a glimpse of a lit hollow */
  function paintFar(c, g, T, L) {
    const R = rnd(3), fog = T.fog, base = L.hz + 30, z = .55;
    for (let x = g.x0; x < g.x1; x++) { const ry = base - Math.round(10 * (Math.sin(x / 26 + .6) * .5 + Math.sin(x / 11 + 2) * .25 + .6)); for (let y = ry; y < g.y1; y++) { c.fillStyle = haze(y - ry < 1 ? T.moss[3] : T.moss[1], fog, z); c.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < 16; i++) { const x = g.x0 + 6 + i * ((g.x1 - g.x0 - 12) / 16) + Math.floor(R() * 5), w = 2 + Math.floor(R() * 3), top = 4 + Math.floor(R() * 40); for (let y = top; y < base + 4; y++) { rect(c, x, y, w, 1, haze(y % 7 < 1 ? T.bark[1] : T.bark[2], fog, z + (y / L.hz) * .1)); rect(c, x, y, 1, 1, haze(T.bark[3], fog, z)); } }
    for (let i = 0; i < 7; i++) { const x = g.x0 + 10 + Math.floor(R() * (g.x1 - g.x0 - 20)), y = base - 4 - Math.floor(R() * 14); disk(c, x, y, 2, haze(T.glow[2], fog, .3)); px(c, x, y, '#ffffff'); }
    hazeBottom(c, g.x0, g.x1, L.hz - 6, L.hz + 36, fog, 0, .75);
  }
  const wallK = (T, z, dark) => hz_(T.leaf, T.fog, z).map(col => dark ? mix(col, '#020c0c', dark) : col);
  const hang = T => (c, x, y, R) => { const len = 6 + Math.floor(R() * 24); for (let j = 0; j < len; j++) px(c, x + Math.round(Math.sin(j / 4 + x) * 1.2), y + j, j % 5 === 4 ? T.leaf[3] : T.leaf[1]); if (R() < .7) { disk(c, x, y + len, 1, T.glow[2]); px(c, x, y + len - 1, '#ffffff'); } };
  /* ancient trunks standing on the rim of the opening, with roots and shelf fungus */
  function trunks(c, g, T, L, layer) {
    if (layer < 2) return; const R = rnd(31 + layer), K = T.bark;
    for (const side of [-1, 1]) {
      const bx = L.cx + side * Math.round(L.cw * .62), w = 9 + Math.floor(R() * 3);
      for (let y = g.y0; y < g.y1; y++) { const lean = Math.round(Math.sin(y / 30 + side) * 2), x0 = bx - w + lean; rect(c, x0, y, w * 2, 1, K[1]); rect(c, x0, y, Math.round(w * .5), 1, K[2]); px(c, x0, y, K[3]); rect(c, x0 + w * 2 - 4, y, 4, 1, K[0]); if (hsh(y, bx, 5) < .16) px(c, x0 + 2 + Math.floor(hsh(y, 3, bx) * (w * 2 - 4)), y, K[0]); }
      for (let k = 0; k < 4; k++) { const sy = L.sw - 60 + k * 26 + Math.floor(R() * 8), sx = bx + side * (w - 2); rect(c, sx - (side < 0 ? 5 : 0), sy, 6, 2, T.cap[1]); rect(c, sx - (side < 0 ? 5 : 0), sy, 6, 1, T.cap[3]); px(c, sx - (side < 0 ? 3 : 0), sy + 1, '#ffffff'); }
      for (let j = 0; j < 9; j++) { const d = side; rect(c, bx + d * (w + j) - (d < 0 ? 1 : 0), L.sw + 1 - Math.floor(j / 3), 1, 4 + Math.floor((9 - j) / 3), j > 4 ? K[0] : K[1]); }
    }
  }
  function ground(c, g, T, L, H) {
    const R = rnd(11), sw = L.sw;
    NK.floor(c, g, L, H, T.moss); NK.tuftRows(c, g, L, H, [T.moss[0], T.moss[2], T.moss[3]], R);
    for (let i = 0; i < 70; i++) { const x = L.x0 - 10 + Math.floor(R() * (L.x1 - L.x0 + 20)), y = sw + 4 + Math.floor(R() * (H - sw - 8)); rect(c, x, y, 2, 1, T.soil[2]); px(c, x + 1, y, T.soil[3]); }
    NK.sprinkle(c, L, H, ['#8ae8f8', '#e8d8ff', '#ffffff', '#fff08a'], 26, 7);
    NK.path(c, g, L, H, [T.stone[0], T.stone[1], T.stone[2], T.stone[3]], { stepping: true });
    NK.stream(c, g, L, H, T.water, { stones: T.stone, bank: [T.soil[1], T.moss[3]] }); NK.bridge(c, L, T.wood);
    NK.bed(c, L, T.soil); NK.fence(c, L, T.wood);
    for (let x = L.patch.x0 + 3; x < L.patch.x1 - 2; x += 9) { ell(c, x, sw + 6, 6, 3, T.moss[1]); }
  }
  function spiritPaint(c, L, T) {
    const x = L.spirit.x, base = L.sw + 2, h = L.spirit.h, R = rnd(77), K = T.bark, sc = h / 60;
    NK.shadow(c, x, base, 26, .3); NK.trunk(c, x, base, Math.round(h * .62), 8, K, R, { flare: .6, sway: 1 });
    for (const d of [-1, 1]) for (let j = 0; j < 22; j++) rect(c, x + d * (6 + j * .9), base - Math.round(h * .6) + Math.round(j * .55), 3, 2, K[j % 3 ? 1 : 2]);
    /* the hollow: an arched door lit from within */
    const hy = base - 10;
    for (let j = -8; j <= 8; j++) { const w = j < -3 ? Math.round(2 + (j + 8) * .5) : 4; rect(c, x - w - 1, hy + j, w * 2 + 2, 1, OL); }
    for (let j = -7; j <= 8; j++) { const w = j < -3 ? Math.round(1 + (j + 8) * .5) : 3; rect(c, x - w, hy + j, w * 2, 1, mix('#e8ffff', '#5ac8e8', Math.max(0, (j + 7) / 15))); }
    rect(c, x - 1, hy - 4, 1, 3, '#ffffff'); rect(c, x - 4, hy + 9, 9, 1, T.stone[1]);
    /* weeping crown: a dome of leaves and long strands */
    const ty = base - Math.round(h * .62);
    for (const [dx, dy, r] of [[-30, 10, 15], [-14, -4, 19], [2, -10, 21], [20, -4, 19], [34, 10, 15], [-4, 6, 18]]) NK.leaves(c, Math.round(x + dx * sc), Math.round(ty + dy * sc), Math.round(r * sc), T.leaf, R);
    for (let i = 0; i < 26; i++) { const sx = x - 38 * sc + i * (76 * sc / 26) + Math.floor(R() * 3), len = Math.round((18 + R() * 28) * sc); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 5 + i) * .8), ty + 12 * sc + j, j % 6 === 5 ? T.leaf[3] : (j % 2 ? T.leaf[1] : T.leaf[2])); if (i % 4 === 0) { disk(c, sx, ty + 12 * sc + len, 1, T.glow[2]); px(c, sx, ty + 12 * sc + len - 1, '#ffffff'); } }
  }
  function hutPaint(c, x, base, T) {
    if (window.__WOODPIC) return; /* no folk on the picture, so no store hut */
    NK.shadow(c, x + 8, base, 12, .3);
    for (let j = 0; j < 10; j++) { const w = 8 - Math.abs(j - 5) * .15; rect(c, x, base - 10 + j, 16, 1, j < 2 ? T.bark[2] : j > 7 ? T.bark[0] : T.bark[1]); }
    for (let j = 0; j < 10; j += 3) rect(c, x + 1, base - 9 + j, 14, 1, T.bark[0]);
    rect(c, x - 1, base - 9, 2, 8, T.bark[2]); rect(c, x + 15, base - 9, 2, 8, T.bark[0]); ell(c, x - 1, base - 5, 1, 4, T.bark[3]);
    ell(c, x + 8, base - 4, 3, 4, OL); ell(c, x + 8, base - 4, 2, 3, '#2a1608'); NK.window(c, x + 12, base - 8, 3, 3, T.mood !== 'day', [T.bark[0], '#9ad0e8', T.bark[1], '#ffd88a']);
    for (const dx of [2, 5, 11]) { rect(c, x + dx, base - 12, 3, 2, T.cap[1]); px(c, x + dx, base - 12, T.cap[3]); px(c, x + dx + 1, base - 11, '#ffffff'); }
    rect(c, x + 3, base - 14, 10, 2, T.moss[2]); rect(c, x + 3, base - 14, 10, 1, T.moss[3]);
  }
  /* the toadstool cottage in eight stages: ring, stones, posts, stalk, cap ribs, cap, door and windows, lanterns */
  function housePaint(c, x, base, st, T0) {
    const T = window.__WOODPIC ? Object.assign({}, T0, { wood: ['#2a1a10', '#5a3a22', '#7a5230', '#a07a48'], cap: WP(T0.mood).cap, cream: ['#8a7656', '#b8a47c', '#e0d0a8', '#f6ecd0'] }) : T0;
    const W2 = 38, cx = x + W2 / 2, cm = T.cream, cp = T.cap, lit = T.mood !== 'day';
    if (window.__WOODPIC) { /* on the picture the site starts as a ring of little orange toadstools, then brown stones */
      const SO = ['#2a1a10', '#5a3a22', '#7a5230', '#b08a54'], PP = WP(T.mood);
      if (st <= 1) { NK.shadow(c, cx, base, W2 / 2 + 2, .22); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, mx = Math.round(cx + Math.cos(a) * 15), my = Math.round(base + Math.sin(a) * 3); NK.forest.shroom(c, mx, my, 2.5, 4 + (i % 3), PP, i * 7, false); }
        if (st === 1) for (let i = 0; i < 5; i++) { const sx = Math.round(cx - 8 + i * 4), sy = Math.round(base + 3 + (i % 2)); disk(c, sx, sy, 2, SO[1]); disk(c, sx, sy - 1, 2, SO[2]); px(c, sx - 1, sy - 2, SO[3]); px(c, sx + 1, sy - 2, T.moss[2]); }
        return; }
    }
    NK.shadow(c, cx, base, W2 / 2 + 4, .3);
    if (st === 0) { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, mx = Math.round(cx + Math.cos(a) * 15), my = Math.round(base - 1 + Math.sin(a) * 3); rect(c, mx, my - 3, 1, 3, cm[2]); rect(c, mx - 1, my - 4, 3, 1, cp[1]); px(c, mx, my - 4, '#ffffff'); } rect(c, cx - 1, base - 14, 1, 14, T.wood[1]); rect(c, cx - 4, base - 15, 8, 5, cm[2]); rect(c, cx - 4, base - 15, 8, 1, cm[3]); px(c, cx - 2, base - 13, T.cap[1]); return; }
    if (!window.__WOODPIC) for (let i = 0; i < 7; i++) { const sx = x + 4 + i * 4 + (i % 2), sy = base - 3 - (i % 3 === 1 ? 1 : 0); rect(c, sx, sy, 5, 4, i % 2 ? T.stone[1] : T.stone[2]); px(c, sx, sy, T.stone[3]); rect(c, sx, sy + 3, 5, 1, T.stone[0]); }
    if (st === 1) return;
    const top = base - 22; for (const p of [7, 15, 23, 31]) { rect(c, x + p, top, 2, 19, T.wood[1]); rect(c, x + p, top, 1, 19, T.wood[2]); } rect(c, x + 7, top, 26, 2, T.wood[0]); rect(c, x + 7, base - 4, 26, 2, T.wood[0]);
    if (st === 2) return;
    const hh = st === 3 ? 8 : 18; for (let j = 0; j < hh; j++) for (let i = 8; i < 32; i++) { const e = i < 11 ? cm[3] : i > 29 ? cm[0] : (j * 5 + i) % 9 === 0 ? cm[1] : cm[2]; px(c, x + i, base - 5 - j, e); }
    for (let j = 0; j < hh; j += 4) rect(c, x + 8, base - 5 - j, 24, 1, cm[1]);
    if (st < 4) return;
    if (st === 4) { for (let k = 0; k < 7; k++) { const ang = -2.4 + k * .8; for (let r = 0; r < 20; r++) px(c, Math.round(cx + Math.cos(ang) * r * .95), Math.round(top - 1 + Math.sin(ang) * r * .5), T.wood[1 + (r & 1)]); } return; }
    for (let j = 0; j < 14; j++) { const w = Math.round((W2 / 2 + 2) * Math.sqrt(Math.max(0, 1 - Math.pow((j - 2) / 15, 2)))), y = top - j + 1; rect(c, cx - w, y, w * 2, 1, j < 3 ? cp[0] : j < 6 ? cp[1] : j < 11 ? cp[1] : cp[2]); px(c, cx - w, y, cp[3]); px(c, cx + w - 1, y, cp[0]); }
    rect(c, x - 2, top + 1, W2 + 4, 2, cp[0]); rect(c, x - 2, top + 1, W2 + 4, 1, cp[1]);
    for (const [dx, dy, r] of [[-9, 8, 3], [3, 11, 2], [11, 6, 3], [-1, 4, 2], [-15, 3, 2], [17, 11, 2]]) { disk(c, cx + dx, top - dy, r, cm[2]); px(c, cx + dx - 1, top - dy - 1, '#ffffff'); }
    if (st === 5) return;
    for (const wx of [10, 24]) { NK.window(c, x + wx, base - 18, 6, 6, lit, [T.wood[0], '#8ad0f0', T.wood[1], '#ffd88a']); rect(c, x + wx - 1, base - 11, 8, 2, T.wood[1]); }
    ell(c, cx, base - 9, 4, 6, OL); ell(c, cx, base - 9, 3, 5, '#6a4a2a'); rect(c, cx, base - 12, 1, 7, T.wood[0]); px(c, cx + 2, base - 8, '#f0d070');
    if (st === 6) return;
    for (const [dx, col] of [[-12, T.bloom[2]], [-8, T.petal[1]], [10, T.glow[2]], [14, T.bloom[2]]]) { px(c, x + W2 / 2 + dx, base - 5, T.leaf[2]); px(c, x + W2 / 2 + dx, base - 6, col); px(c, x + W2 / 2 + dx, base - 7, '#ffffff'); }
    rect(c, x + W2 + 3, base - 14, 1, 14, T.wood[1]); rect(c, x + W2 + 1, base - 18, 5, 5, lit ? '#ffe8a0' : T.glow[1]); rect(c, x + W2 + 1, base - 18, 5, 1, T.wood[0]); px(c, x + W2 + 2, base - 17, '#ffffff');
  }


  /* the picture is 1080 x 544; it covers the scene and keeps the mushroom side in view on narrow screens */
  function picMap(W, H) { const s = Math.max(W / 1080, H / 544), ox = Math.min(0, Math.max(W - 1080 * s, W < H * 1.2 ? W * .5 - 340 * s : W * .4 - 400 * s)), oy = Math.min(0, (H - 544 * s) * .8); return { s, ox, oy }; }
  function picPaint(c, g2, mood, W, H) {
    const im = window.__WOODPIC, M = picMap(W, H), x0 = g2.x0, x1 = g2.x1, y0 = g2.y0, y1 = g2.y1;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.fillStyle = '#06222c'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    /* beyond the edges the picture's own border is stretched, so a shift never shows a gap */
    const dw = 1080 * M.s, dh = 544 * M.s;
    c.drawImage(im, 0, 0, 3, 544, x0, M.oy, M.ox - x0 + 1, dh); c.drawImage(im, 1077, 0, 3, 544, M.ox + dw - 1, M.oy, x1 - (M.ox + dw) + 2, dh);
    c.drawImage(im, 0, 0, 1080, 544, M.ox, M.oy, dw, dh);
    if (M.oy > y0) c.drawImage(im, 0, 0, 1080, 3, M.ox, y0, dw, M.oy - y0 + 1);
    if (M.oy + dh < y1) c.drawImage(im, 0, 541, 1080, 3, M.ox, M.oy + dh - 1, dw, y1 - M.oy - dh + 2);
    const tint = (op, col, a) => { c.save(); c.globalCompositeOperation = op; c.globalAlpha = a; c.fillStyle = col; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore(); };
    if (mood === 'day') { tint('overlay', '#b4f0b8', .6); tint('screen', '#3c6a52', .3); }
    else if (mood === 'morning') { tint('overlay', '#c8ecff', .45); tint('screen', '#2c5058', .2); }
    else if (mood === 'sunset') { tint('overlay', '#ff9a58', .5); tint('screen', '#4a2a30', .16); }
  }
  /* ---- the painted forest: ground, trunks, roots, mushrooms, ferns (NK.forest) ---- */
  function strands(c, L, T) {
    const x = L.spirit.x, R = rnd(41);
    for (let i = 0; i < 34; i++) { const sx = x - 40 + i * 2.4 + Math.floor(R() * 3), len = Math.max(6, 10 + Math.floor(R() * 40) * (1 - Math.abs(sx - x) / 60)); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 5 + i) * .8), j, j % 6 === 5 ? T.leaf[3] : (j % 2 ? T.leaf[1] : T.leaf[2])); }
  }
  function farGround(c, g, P, H) {
    const F = NK.forest, y0 = H * .6;
    for (let y = y0 - 3; y < g.y1; y += .5) for (let x = g.x0; x < g.x1; x += .5) { const yt = y0 + Math.sin(x / 13) * 2 + Math.sin(x / 5.3) * .8; if (y < yt) continue; F.R_(c, x, y, .5, .5, F.pick(P.land, (y - yt) / 30 + (F.vn(x * 3, y * 3, 6, 2) - .5) * .4, x, y)); }
    for (let i = 0; i < 9; i++) F.mound(c, P, g.x0 + 14 + i * (g.x1 - g.x0 - 28) / 8, y0 + 3, 12 + (i % 3) * 4, 3.5, 20 + i);
  }
  function floorPaint(c, g, P, L, H) {
    const F = NK.forest, sw = L.sw, top = sw - 8, lx = L.lx, rx = L.spirit.x;
    F.floor(c, g, P, L, top); F.fogBand(c, g, P.fog, top - 10, top + 8, 0, .5);
    /* mossy mounds along the back edge of the ground */
    for (let i = 0; i < 12; i++) F.mound(c, P, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 11, top + 2 + (i % 2) * 2, 7 + (i * 7) % 6, 2.2, 40 + i);
    F.leaves(c, g, P, L, 85, 17, top + 3);
    /* the dew pool where the fairies fill their cups, and the soil plot they tend */
    const wp = L.water, W_ = P.water, pr = L.wide ? 13 : 9; F.blob(c, wp.x, wp.y + .5, pr + 1.5, 4.5, P.bark[0]); F.blob(c, wp.x, wp.y, pr, 3.6, W_[0]); F.blob(c, wp.x, wp.y - .5, pr - 1.5, 2.6, W_[1]); F.blob(c, wp.x - 2, wp.y - 1, pr * .5, 1.2, W_[2]); F.R_(c, wp.x - pr * .4, wp.y - 1, pr * .5, .5, W_[3]);
    for (let i = 0; i < 9; i++) F.mound(c, P, wp.x - pr - 1 + i * (pr * 2 + 2) / 8, wp.y + 1.5 + (i % 2) * .5, 2.4, 1.1, 90 + i);
    const px0 = L.patch.x0, px1 = L.patch.x1, pcx = (px0 + px1) / 2; F.blob(c, pcx, sw + 17, (px1 - px0) / 2 + 6, 13, P.dirt[0]); F.blob(c, pcx, sw + 16.5, (px1 - px0) / 2 + 4, 11.5, P.dirt[1]); F.blob(c, pcx, sw + 16, (px1 - px0) / 2 + 1, 9.5, P.dirt[2]);
    for (let i = 0; i < 12; i++) F.mound(c, P, px0 - 3 + i * (px1 - px0 + 6) / 11, sw + 27 - (i % 2), 3.2, 1.4, 120 + i);
    /* left giant trunk, its roots, the hollow and the mushrooms that nest in it */
    F.trunk(c, g, P, { x: lx, base: sw + 6, w0: 16, w1: 30, flare: 40, seed: 4, light: 1, lean: -2, sway: 2, moss: .1 });
    F.blob(c, lx + 32, sw + 7, 14, 6, P.verge[0]); F.blob(c, lx + 33, sw + 7.5, 11, 4.5, '#0a0604');
    F.root(c, P, { x: lx + 20, y: sw - 4, dir: 1, len: 70, arch: 16, drop: 12, w: 8, seed: 3 }); F.root(c, P, { x: lx + 22, y: sw + 12, dir: 1, len: 120, arch: 5, drop: 22, w: 7, seed: 12 });
    F.root(c, P, { x: lx + 11, y: sw + 8, dir: 1, len: 34, arch: 5, drop: 6, w: 4.2, seed: 5 });
    F.root(c, P, { x: lx + 8, y: sw + 13, dir: -1, len: 30, arch: 4, drop: 5, w: 4.5, seed: 6 });
    F.root(c, P, { x: lx + 4, y: sw - 14, dir: 1, len: 22, arch: 7, drop: 8, w: 3.2, seed: 7 });
    for (const m of L.shrooms.slice().sort((a, b) => a.y - b.y)) F.shroom(c, m.x, m.y, m.r, m.h, P, Math.round(m.x * 7), m.r > 6);
    for (let i = 0; i < 5; i++) F.mound(c, P, lx + 20 + i * 11, sw + 14 + (i % 2), 4, 1.4, 130 + i);
    /* right giant trunk (the Spirit tree), roots running left along the ground and off to the right */
    F.trunk(c, g, P, { x: rx, base: sw + 6, w0: 15, w1: 28, flare: 30, seed: 8, light: -1, lean: 3, sway: 2, moss: .22 });
    F.root(c, P, { x: rx - 16, y: sw + 3, dir: -1, len: 80, arch: 11, drop: 12, w: 7, seed: 9 }); F.root(c, P, { x: rx - 14, y: sw + 14, dir: -1, len: 110, arch: 4, drop: 20, w: 6, seed: 13 });
    F.root(c, P, { x: rx - 8, y: sw + 9, dir: -1, len: 30, arch: 3, drop: 5, w: 3.6, seed: 10 });
    F.root(c, P, { x: rx + 12, y: sw + 4, dir: 1, len: 44, arch: 8, drop: 7, w: 5.2, seed: 11 });
    const R = F.rnd(77); for (let i = 0; i < 7; i++) { const x = L.cx - 36 + R() * 88, y = sw + 12 + R() * (H - sw - 22); F.beetle(c, x, y, P, R() < .5 ? -1 : 1); }
  }
  function nearPaint(c, g, P, L, H) {
    const F = NK.forest, wide = L.wide, lx = Math.max(g.x0 + 10, L.x0 - 24), rx = Math.min(g.x1 - 10, L.x1 + 34);
    F.root(c, P, { x: g.x1 + 6, y: H - 14, dir: -1, len: wide ? 80 : 40, arch: 4, drop: 5, w: 5.5, seed: 21 });
    for (let i = 0; i < 9; i++) F.bigLeaf(c, P, rx + (i - 4) * 6, H + 4, -Math.PI / 2 + (i - 4) * .3, 22 + (i % 3) * 5, 5 + (i % 2) * 1.4, 30 + i);
    for (let i = 0; i < 12; i++) F.frond(c, P, lx + (i - 6) * 2.2, H + 4, -Math.PI / 2 + (i - 6) * .2, 22 + (i % 4) * 5, 50 + i);
    for (let i = 0; i < 5; i++) F.bigLeaf(c, P, g.x0 + 4 + i * 4, H - 2 - i * 3, -.9 - i * .12, 12, 3, 70 + i);
    F.leaves(c, { x0: g.x0, x1: g.x1, H: g.H }, P, L, 26, 33, H - 14);
  }

  /* plants */
  const sw_ = (n, f, a) => ECO.sway(n.x, f, a == null ? 1 : a) + n.kick * 1.5;
  const stalk = (c, n, sw, k, h, col) => { for (let j = 0; j < h; j++) px(c, n.x + k + Math.round(sw * j / h), n.y - j, col); };
  const PSYC = NK2.PSY;
  const PD = {
    glowcap: (c, n, f, T) => { const e = n.en || 0; for (const [dx, h, r] of [[-7, 4, 3], [0, 7, 5], [7, 5, 3]]) { rect(c, n.x + dx, n.y - h, 1, h, T.cream[2]); const cy = n.y - h - 1; ell(c, n.x + dx, cy, r, Math.ceil(r * .7), OL); ell(c, n.x + dx, cy, r - 1, Math.ceil(r * .7) - 1, e > .3 ? T.orange[3] : T.orange[2]); px(c, n.x + dx - 1, cy - 1, '#ffffff'); px(c, n.x + dx + 1, cy, T.orange[1]); } },
    toadstool: (c, n, f, T) => { const e = n.en || 0; for (const [dx, h, r, s] of [[-7, 5, 4, 1], [1, 9, 6, 2], [9, 5, 3, 3]]) PSYC.shroom(c, n.x + dx, n.y, h + Math.round(e * 2), r + (e > .3 ? 1 : 0), f, n.seed + s, { speed: 150 }); if (e > .3) for (let i = 0; i < 6; i++) { const a = f / 7 + i * 1.05; px(c, n.x + Math.cos(a) * (9 + i), n.y - 12 - i * 2 + Math.sin(a * 1.3) * 2, PSYC.col(i / 6 + f / 80, .9, .72)); } },
    bluebell: (c, n, f, T) => { const sw = sw_(n, f), e = n.en || 0; for (let k = -3; k <= 3; k++) { const h = 8 + (k & 1) * 3 + Math.round(e * 3); stalk(c, n, sw, k * 2, h, T.moss[2]); const bx = n.x + k * 2 + Math.round(sw), by = n.y - h; px(c, bx, by, T.bloom[1]); px(c, bx - 1, by + 1, T.bloom[2]); px(c, bx + 1, by + 1, T.bloom[1]); px(c, bx, by + 2, T.bloom[2]); if (e > .3) px(c, bx, by - 1, '#ffffff'); } },
    moonflower: (c, n, f, T) => { const sw = sw_(n, f, .6), e = n.en || 0, h = 12 + Math.round(e * 3); stalk(c, n, sw, 0, h, T.moss[2]); stalk(c, n, sw, 1, h, T.moss[1]); const hx = n.x + Math.round(sw), hy = n.y - h; for (let a = 0; a < 8; a++) { const an = a / 8 * 6.28; px(c, hx + Math.round(Math.cos(an) * 3), hy + Math.round(Math.sin(an) * 3), e > .3 ? '#ffffff' : T.glow[3]); } disk(c, hx, hy, 1, '#fff08a'); if (e > .3) { c.globalAlpha = .3; disk(c, hx, hy, 6, T.glow[3]); c.globalAlpha = 1; } rect(c, n.x - 3, n.y - 3, 3, 1, T.moss[3]); rect(c, n.x + 1, n.y - 4, 3, 1, T.moss[3]); },
    foxglove: (c, n, f, T) => { const sw = sw_(n, f, .7), e = n.en || 0, h = 22 + Math.round(e * 3); stalk(c, n, sw, 0, h, T.moss[2]); for (let j = 5; j < h; j += 3) { const bx = n.x + Math.round(sw * j / h) + ((j / 3 | 0) % 2 ? 1 : -2); rect(c, bx, n.y - j, 2, 3, T.petal[1]); px(c, bx, n.y - j, T.petal[2]); px(c, bx + 1, n.y - j + 2, T.petal[0]); } },
    fern: (c, n, f, T) => { const sw = sw_(n, f, .8); for (const [dx, len, dir] of [[-6, 14, -1], [0, 18, 0], [6, 14, 1]]) for (let j = 0; j < len; j++) { const x = n.x + dx + Math.round(dir * j * .45 + sw * j / len), y = n.y - Math.round(j * (dir ? .8 : 1) - j * j * .02); px(c, x, y, T.moss[j % 3 ? 2 : 1]); if (j % 2 === 0 && j > 2) { px(c, x - 1, y + 1, T.moss[2]); px(c, x + 1, y + 1, T.moss[3]); } } },
    lily: (c, n, f, T) => { const sw = sw_(n, f), e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 5 + (k & 1) * 2 + Math.round(e * 2); stalk(c, n, sw, k * 3, h, T.moss[2]); for (let j = 0; j < 4; j++) px(c, n.x + k * 3 + Math.round(sw) + 1, n.y - h + j, T.moss[1]); px(c, n.x + k * 3 + Math.round(sw), n.y - h - 1, '#ffffff'); px(c, n.x + k * 3 + Math.round(sw) + 1, n.y - h - 1, '#ffffff'); } },
    bramble: (c, n, f, T) => { const e = n.en || 0; NK.leaves(c, n.x, n.y - 5, 7, T.leaf, rnd(n.seed)); for (let i = 0; i < 7; i++) { const bx = n.x - 6 + (i * 7 % 13), by = n.y - 9 + (i * 3 % 8); px(c, bx, by, e > .3 ? '#d83a8a' : '#7a2a6a'); px(c, bx + 1, by, e > .3 ? '#ff9ac8' : '#a04a8a'); } },
    primrose: (c, n, f, T) => { const sw = sw_(n, f), e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 3 + (k & 1) + Math.round(e * 2), bx = n.x + k * 3 + Math.round(sw * .5); stalk(c, n, sw * .5, k * 3, h, T.moss[2]); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(c, bx + dx, n.y - h + dy, '#fff08a'); px(c, bx, n.y - h, '#f0a030'); } },
    clover: (c, n, f, T) => { for (let k = -4; k <= 4; k += 2) { const bx = n.x + k * 2, by = n.y - 1 - ((k * 3) & 1); for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]]) px(c, bx + dx, by + dy, T.moss[(k & 2) ? 3 : 2]); px(c, bx, by, T.moss[1]); } },
    vine: (c, n, f, T) => { const sw = sw_(n, f, .4), e = n.en || 0; for (let j = 0; j < 16; j++) { const x = n.x + Math.round(Math.sin(j / 3) * 2 + sw * j / 16); px(c, x, n.y - j, T.moss[2]); if (j % 4 === 1) { px(c, x - 1, n.y - j, T.moss[3]); px(c, x + 1, n.y - j - 1, T.moss[1]); } if (j % 5 === 4) { px(c, x, n.y - j - 1, e > .3 ? T.glow[3] : T.bloom[2]); } } },
  };
  /* a fairy: outlined so she reads on moss, wings that flutter, a dress that is her trade */
  function fairy(c, n, f, T) {
    const x = Math.round(n.x), y = Math.round(n.y - 3 + Math.sin(f / 5 + n.x * .2) * (n.mvk ? 1 : .6)), d = n.dir, cl = T.dress[n.cloth || 0], rk = n.rank || 2, bend = n.pose === 'tend' ? 3 : 0, fl = (f >> 1) & 1;
    NK.shadow(c, x, n.y, 4, .25 * (1 - Math.abs(y - n.y + 3) / 8));
    const by = y - 8 + bend, hx = x + (bend ? d : 0), hy = by - 4, sit = n.pose === 'sit';
    /* wings behind */
    const ws = fl ? 5 : 4; for (const s of [-1, 1]) { c.globalAlpha = .85; for (let j = 0; j < ws; j++) { const w = Math.round((j < 2 ? j + 2 : ws - j + 1)); rect(c, x + (s < 0 ? -2 - w : 2), by - 2 + j + (fl ? -1 : 0), w, 1, WING[j % 2]); } c.globalAlpha = 1; px(c, x + s * 3, by - 3 + (fl ? -1 : 0), '#ffffff'); }
    disk(c, hx, hy, 3, OL); rect(c, x - 3, by - 1, 7, 9, OL);
    /* dress */
    for (let j = 0; j < 7; j++) { const w = 2 + Math.floor(j * .5); rect(c, x - w + 1, by + j, w * 2 - 1, 1, j < 1 ? cl[2] : j < 4 ? cl[1] : cl[0]); } px(c, x - 1, by + 1, cl[2]); px(c, x, by + 3, '#fff08a');
    if (!sit) { rect(c, x - 1, by + 7, 1, 2, '#f4d8c0'); rect(c, x + 1, by + 7, 1, 2, '#f4d8c0'); }
    /* head, hair tuft, face */
    disk(c, hx, hy, 2, '#f8dcc4'); px(c, hx - 1, hy - 1, '#ffffff'); const hr = [['#4a2a1a', '#2a1a10'], ['#e8c850', '#b8962a'], ['#d85a4a', '#a83a2a'], ['#e8e8f8', '#a8a8c8']][(n.cloth || 0) % 4];
    rect(c, hx - 2, hy - 3, 5, 2, hr[0]); px(c, hx - 2, hy - 1, hr[1]); px(c, hx + 2, hy - 1, hr[1]); px(c, hx, hy - 4, hr[0]); px(c, hx + d, hy - 5, T.petal[2]);
    px(c, hx + d, hy, '#2a1a10'); if (n.elder) { for (let k = 0; k < 3; k++) px(c, hx - 1 + k, hy + 2, '#f4fff0'); }
    px(c, x + d * 2, by + 3 + (n.pose === 'tend' ? 2 : 0), '#f8dcc4'); if (n.pose === 'talk' && f % 4 < 2) px(c, x + d * 3, by + 1, '#f8dcc4');
    const cr = n.carry; if (cr) { const cx_ = x + d * 4, cy_ = by + 5; if (cr === 'dew') { disk(c, cx_, cy_ + 1, 3, OL); disk(c, cx_, cy_ + 1, 2, '#c09a68'); rect(c, cx_ - 1, cy_ - 1, 3, 1, T.water[3]); } else if (cr === 'berries') { rect(c, cx_ - 3, cy_ - 1, 7, 5, OL); rect(c, cx_ - 2, cy_, 5, 3, T.wood[2]); px(c, cx_ - 1, cy_ - 1, '#d83a8a'); px(c, cx_ + 1, cy_ - 1, '#8a3ac8'); px(c, cx_, cy_ - 2, '#d83a8a'); } else if (cr === 'lantern') { rect(c, cx_ - 2, cy_ - 1, 5, 6, OL); rect(c, cx_ - 1, cy_, 3, 4, '#ffe8a0'); px(c, cx_, cy_, '#ffffff'); } }
  }
  const FSTYLE = { glow: T => ({ col: '#c8f4ff', r: 10, a: T.lit * .25 }) };

  /* animals */
  const A = {
    fox: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd, head = n.gz < 5; NK.shadow(c, x, y, 8, .28); for (const [dx, dy, w, h, col] of [[-6, -6, 10, 5, '#d8762a'], [-8, -4, 4, 4, '#f4ecd8'], [-12, -7, 5, 4, '#d8762a'], [-14, -8, 3, 3, '#f4ecd8'], [-4, -2, 2, 3, '#2a1a14'], [3, -2, 2, 3, '#2a1a14']]) rect(c, x + dx * d - (d < 0 ? w - 1 : 0), y + dy, w, h, col); const hx = x + 6 * d, hy = y - (head ? 6 : 3); rect(c, hx - 2, hy - 2, 5, 4, '#e8822e'); rect(c, hx + (d > 0 ? 1 : -4), hy, 3, 2, '#f4ecd8'); px(c, hx + 2 * d, hy - 1, '#101018'); rect(c, hx - 2, hy - 4, 2, 2, '#e8822e'); rect(c, hx + 1, hy - 4, 2, 2, '#2a1a14'); },
    hedgehog: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd; NK.shadow(c, x, y, 6, .28); for (let j = 0; j < 6; j++) { const w = Math.round(6 * Math.sqrt(1 - Math.pow((j - 5) / 6, 2))); rect(c, x - w + (d > 0 ? -1 : 1), y - j - 1, w * 2, 1, j % 2 ? '#6a4a30' : '#8a6a46'); } for (let i = 0; i < 6; i++) px(c, x - 6 + i * 2 - (d > 0 ? 1 : -1), y - 7 + (i % 2), '#3a2a1c'); rect(c, x + 5 * d - 1, y - 3, 3, 3, '#d8b890'); px(c, x + 7 * d, y - 2, '#101018'); },
    rabbit: (c, n) => { const x = Math.round(n.x), y = Math.round(n.y); NK.shadow(c, x, y, 5, .25); if (!n.st) { rect(c, x - 2, y - 5, 5, 4, '#8a7a6a'); px(c, x, y - 7, '#6a5a4a'); return; } for (const [dx, dy, w, h, col] of [[-3, -5, 7, 5, '#b8aa98'], [2, -8, 4, 4, '#b8aa98'], [3, -12, 1, 4, '#b8aa98'], [5, -12, 1, 4, '#b8aa98'], [-4, -3, 3, 3, '#f4f0e8'], [3, -7, 1, 1, '#101018'], [5, -6, 1, 1, '#e89aa6']]) rect(c, x + dx, y + dy, w, h, col); },
    owl: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), blink = f % 70 < 3; rect(c, x - 8, y + 1, 18, 2, T.bark[1]); rect(c, x - 8, y + 1, 18, 1, T.bark[2]); for (const [dx, dy, w, h, col] of [[-3, -9, 7, 9, '#9a7a5a'], [-2, -3, 5, 4, '#e8d8b8'], [-3, -11, 2, 2, '#9a7a5a'], [2, -11, 2, 2, '#9a7a5a'], [-4, -7, 2, 6, '#7a5a3a'], [4, -7, 2, 6, '#7a5a3a']]) rect(c, x + dx, y + dy, w, h, col); for (const ex of [-2, 1]) { rect(c, x + ex, y - 8, 3, 3, '#fff0a0'); if (!blink) px(c, x + ex + 1, y - 7, '#101018'); else rect(c, x + ex, y - 7, 3, 1, '#7a5a3a'); } px(c, x, y - 5, '#f0a030'); if (T.lit > .4) { c.globalAlpha = .3; disk(c, x, y - 7, 6, '#fff0a0'); c.globalAlpha = 1; } },
    toad: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), up = n.st; NK.shadow(c, x, y, 5, .25); for (const [dx, dy, w, h, col] of [[-4, up ? -6 : -4, 8, up ? 6 : 4, '#6a8a3a'], [-3, up ? -5 : -3, 6, 2, '#a8c870'], [-5, -2, 3, 2, '#5a7a2a'], [3, -2, 3, 2, '#5a7a2a']]) rect(c, x + dx, y + dy, w, h, col); for (const ex of [-3, 1]) { rect(c, x + ex, y - (up ? 8 : 6), 3, 2, '#f0d060'); px(c, x + ex + 1, y - (up ? 8 : 6), '#101018'); } px(c, x - 2, y - 4, '#4a6a2a'); px(c, x + 2, y - 3, '#4a6a2a'); },
    snail: (c, n) => { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd; rect(c, x - 4, y - 1, 8, 2, '#d8c8a8'); rect(c, x + 3 * d, y - 3, 2, 3, '#d8c8a8'); px(c, x + 4 * d, y - 4, '#101018'); disk(c, x - d, y - 4, 3, '#8a5a8a'); disk(c, x - d, y - 4, 1, '#c8a0c8'); },
    fawn: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd, head = n.gz < 5, step = n.gz > 4 && (f >> 1) & 1; NK.shadow(c, x, y, 9, .28); for (const lx of [-6, -3, 3, 6]) rect(c, x + lx * d - (d < 0 ? 1 : 0), y - 6, 1, 6 - ((lx & 1) && step ? 1 : 0), '#a8744a'); for (const [dx, dy, w, h, col] of [[-8, -11, 15, 6, '#c8905a'], [-8, -8, 14, 2, '#e8c08a'], [-9, -12, 3, 3, '#f4e8d0']]) rect(c, x + dx * d - (d < 0 ? w - 1 : 0), y + dy, w, h, col); for (let k = 0; k < 6; k++) px(c, x - 5 + k * 2 + (k & 1), y - 10 + (k % 3), '#fff0d8'); const hx = x + 8 * d, hy = y - (head ? 14 : 8); rect(c, hx - 2, hy - 2, 5, 5, '#c8905a'); rect(c, hx + (d > 0 ? 1 : -3), hy + 1, 3, 2, '#e8c08a'); px(c, hx + d, hy - 1, '#101018'); rect(c, hx - 1, hy - 4, 1, 2, '#a8744a'); rect(c, hx + 1, hy - 4, 1, 2, '#a8744a'); for (const [ax, ay] of [[-2, -6], [-3, -8], [-1, -9], [2, -6], [3, -8], [1, -10]]) { px(c, hx + ax, hy + ay, '#8a5a3a'); } for (const [ax, ay, col] of [[-3, -9, T.petal[1]], [3, -9, T.bloom[2]], [-1, -10, '#ffffff'], [1, -11, T.petal[2]]]) px(c, hx + ax, hy + ay, col); },
    moth: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), w = (f >> 1) % 3; c.globalAlpha = .9; for (const s of [-1, 1]) { for (let j = 0; j < 5; j++) rect(c, x + (s < 0 ? -(4 - (w === 1 ? 1 : 0)) - 1 : 1), y - 3 + j, 4 - (w === 1 ? 1 : 0) - (j > 3 ? 2 : 0), 1, j % 2 ? '#c8f8c8' : '#e8ffe8'); px(c, x + s * 3, y - 1, '#6ad06a'); } c.globalAlpha = 1; rect(c, x, y - 3, 1, 5, '#f4f4e0'); px(c, x, y - 4, '#f4f4e0'); },
    fly: (c, n, f) => { const x = Math.round(n.x), y = Math.round(n.y), b = f % 20 < 12; disk(c, x, y, 2, 'rgba(255,240,140,.35)'); px(c, x, y, b ? '#fff8c0' : '#d8d880'); },
  };
  const wisp = (c, n, f, T, i) => { const x = Math.round(n.x), y = Math.round(n.y), b = Math.round(Math.sin(f / 4 + i)); c.globalAlpha = .35; disk(c, x, y + b, 4, T.glow[2]); c.globalAlpha = 1; disk(c, x, y + b, 2, T.glow[3]); px(c, x, y + b, '#ffffff'); for (let j = 1; j < 6; j++) { c.globalAlpha = .5 - j * .08; px(c, x - j - 1, y + b + Math.round(Math.sin(f / 4 + i + j) * 1) + (j > 2 ? 1 : 0), T.glow[2]); } c.globalAlpha = 1; };


  const P = NK2.PSY;
  /* the reference night: dark teal trunks against a bright misty glow, warm brown path */
  const WP = mood => { const B = NK.forest.pal(mood); if (mood !== 'night') return B; return Object.assign({}, B, { isNight: true, farA: '#0f4a5a', farB: '#093a48', farC: '#052a36', fog: '#117486', rimC: '#2a8a98', land: ['#04181c', '#082a2a', '#0e3c34'], leafO: ['#8a3a0a', '#c4561a', '#e07a2a', '#f89a3a'], cap: ['#7a2406', '#c8480e', '#ee6c18', '#ffa83a'], dot: '#fffaf0' }); };
  function willow(c, L, T) {
    const x = L.spirit.x, R = rnd(41);
    NK.bigTrunk(c, x, L.sw + 2, T.bark, T.moss, { w: 6 });
    for (let i = 0; i < 40; i++) { const sx = x - 44 + i * 2.2 + Math.floor(R() * 3), len = 14 + Math.floor(R() * 44) * (1 - Math.abs(sx - x) / 70); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 5 + i) * .8), j, j % 6 === 5 ? T.leaf[3] : (j % 2 ? T.leaf[1] : T.leaf[2])); }
  }
  function willowEmit(c, L, T) {
    const x = L.spirit.x, hy = L.sw - 10;
    for (let j = -8; j <= 8; j++) { const w = j < -3 ? Math.round(2 + (j + 8) * .5) : 4; rect(c, x - w - 1, hy + j, w * 2 + 2, 1, OL); }
    for (let j = -7; j <= 8; j++) { const w = j < -3 ? Math.round(1 + (j + 8) * .5) : 3; rect(c, x - w, hy + j, w * 2, 1, mix('#e8ffff', '#5ac8e8', Math.max(0, (j + 7) / 15))); }
    rect(c, x - 4, hy + 9, 9, 1, T.stone[1]);
  }
  const wallDeco = (c, g, T, L, E, R) => {
    const sw = L.sw, rx0 = E.cx + 18, ry0 = sw - 34;
    /* the tree's rings: one growing circle, each year a band a shade further round the spectrum */
    for (let y = g.y0; y < g.y1; y++) for (let x = g.x0; x < g.x1; x++) { if (E.cav(x, y) > 1 || E.inDoor(x, y) < 1.3) continue; const dx = x - rx0, dy = (y - ry0) * 1.08, r = Math.sqrt(dx * dx + dy * dy) + NK2.vn(x, y, 7, 3) * 4; const ring = Math.floor(r / 3.4), band = (ring + Math.floor(r / 1.7)) & 1; if (r > 118) continue; const hc = P.hsl(P.hue(ring * .05 + .1), .34, band ? .36 : .3); c.fillStyle = hc; c.globalAlpha = .62; c.fillRect(x, y, 1, 1); c.globalAlpha = 1; }
    for (let i = 0; i < 18; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 6 + Math.floor(R() * (sw + 4)); if (E.cav(x, y) > .95 || E.inDoor(x, y) < 1.4) continue; NK2.blob(c, x, y, 2 + Math.floor(R() * 4), 3 + Math.floor(R() * 4), [T.bark[0], T.bark[1], T.bark[2], T.bark[2]], { outline: T.bark[0], hi: false }); }
    for (let i = 0; i < 30; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 4 + Math.floor(R() * (sw + 8)), s = E.cav(x, y); if (s > .97 || E.inDoor(x, y) < 1.4) continue; NK2.blob(c, x, y, 3 + Math.floor(R() * 5), 2, T.moss, { outline: false, hi: false }); }
    for (let i = 0; i < 12; i++) { const x = E.cx - E.rx + 10 + Math.round(R() * (E.rx * 2 - 20)); let y = 0; while (y < 60 && E.cav(x, y) >= 1) y++; if (y >= 60) continue; NK2.root(c, x, y - 2, 12 + Math.floor(R() * 30), 1.57 + (R() - .5) * .6, 1.5 + R() * 1.5, [T.bark[0], T.bark[1], T.bark[2], T.bark[3]], R, { wob: .3, fork: R() < .4 }); }
  };
  const FOLKS = [
      { id: 'dewer', name: 'Dew fairy', rank: 2, cloth: 1, draw: fairy, u: .5, glow: FSTYLE.glow, tasks: [{ to: 'water', act: 'carry', take: 'dew', t: 5 }, { to: { crop: 0 }, act: 'tend', t: 8, say: 'drop' }, { to: 'water', act: 'carry', take: 'dew', t: 5 }, { to: { crop: 1 }, act: 'tend', t: 8 }, { to: 'water', act: 'carry', take: 'dew', t: 5 }, { to: { crop: 2 }, act: 'tend', t: 8, say: 'drop' }, { to: { crop: 4 }, act: 'tend', t: 8 }] },
      { id: 'lighter', name: 'Lantern fairy', rank: 3, cloth: 2, draw: fairy, u: .55, glow: FSTYLE.glow, tasks: [{ to: { crop: 3 }, act: 'tend', t: 8, say: 'star' }, { to: { crop: 5 }, act: 'tend', t: 8 }, { to: { nest: 1 }, act: 'look', t: 10, say: 'moon' }, { to: { u: .45 }, act: 'carry', take: 'lantern', t: 4 }, { to: 'store', act: 'give', t: 5 }, { to: 'store', act: 'enter', t: 16 }] },
      { id: 'gatherer', name: 'Berry fairy', rank: 4, cloth: 0, draw: fairy, u: .62, glow: FSTYLE.glow, tasks: [{ to: { plant: 'bramble' }, act: 'carry', take: 'berries', t: 6, say: 'heart' }, { to: 'store', act: 'give', t: 5 }, { to: { plant: 'lily' }, act: 'tend', t: 8 }, { to: { nest: 0 }, act: 'look', t: 8 }, { to: 'house', act: 'enter', t: 18 }] },
      { id: 'elder', name: 'Old Moss fairy', rank: 5, cloth: 3, draw: fairy, u: .84, lane: 1, elder: true, glow: FSTYLE.glow, tasks: [{ to: { u: .8 }, act: 'sit', t: 40 }, { to: { u: .8 }, act: 'talk', t: 10, say: 'leaf', reply: 'heart' }, { to: 'spirit', act: 'tend', t: 12, say: 'star' }] },
    ];
  const D = {
    id: 'wood', houseName: 'Your toadstool cottage', hutName: 'The pantry log', spiritH: .6, houseW: 38, hutW: 16, windowCol: '#ffd890',
    sky: SKY, fog: FOG, ramps: Object.assign({}, RAMPS, RAMPX), bubble: BUBBLE, pal: (T, mood, MC) => { T.dress = DRESS.map(r => r.map(h => MC(h, mood))); T.orange = ['#c85a12', '#f08a20', '#ffc050', '#fff0c0']; return T; }, pulse: '#a8f0ff', waveCol: '#a8f0ff',
    wall: { clump: 'leaf', ramps: T => [T.leaf, T.leaf, T.leaf] },
    cav: { rx: 124, ry: .47, bump: .09, ph: [3.1, 1.2, 5.2] },
    door: (L, H) => ({ x: NK.u(L, .56), y: Math.round(H * .3), rx: L.wide ? 19 : 15, ry: L.wide ? 31 : 25 }),
    geom(L, G0, H) { const sw = L.sw, lx = L.wide ? L.x0 - 40 : L.x0 - 18; L.lx = lx; L.lamps = []; L.heart = { x: L.spirit.x, y: sw - 10 };
      if (!window.__WOODPIC && window.__WOODWIDE && window.__WOODWIDE()) window.__needPic = true;
      if (window.__WOODPIC) { const M = picMap(L.W, L.H); L.pic = M; /* the three big mushrooms of the picture are the menu: Home, Receipts, Plan */
        const wx = ix => Math.round(M.ox + ix * M.s); L.cw = Math.round(G0.W * .74); L.x0 = L.cx - Math.round(L.cw / 2); L.x1 = L.x0 + L.cw; L.sw = Math.round(M.oy + 392 * M.s); L.water.y = L.sw + Math.round((G0.H - L.sw) * .5) - 1; L.hut.x = wx(660) - 8; L.house.x = wx(860) - 19; L.spirit.x = wx(565); L.heart = { x: L.spirit.x, y: L.sw - 10 };
        document.body.classList.add('pic-world');
        const MS = ([cx, cy, hw, by]) => { const r = hw * M.s, y = M.oy + by * M.s, ry = r * .74; return { x: Math.round(M.ox + cx * M.s), y: Math.round(y), r, h: Math.round(y - (M.oy + cy * M.s) - ry * .1) }; };
        L.tools = [[318, 197, 36, 240], [347, 330, 33, 390], [140, 220, 17, 250], [112, 268, 22, 298], [216, 205, 10, 222], [396, 323, 10, 336]].map(MS);
        L.shrooms = [[267, 142, 62, 240], [250, 300, 40, 372], [432, 352, 48, 412]].map(([cx, cy, hw, by]) => { const r = hw * M.s, y = M.oy + by * M.s, ry = r * .74; return { x: Math.round(M.ox + cx * M.s), y: Math.round(y), r, h: Math.round(y - (M.oy + cy * M.s) - ry * .1) }; }); return; }
      L.shrooms = [{ x: lx + 26, y: sw - 12, r: 10, h: 22 }, { x: lx + 41, y: sw - 5, r: 6, h: 12 }, { x: lx + 9, y: sw - 9, r: 3.5, h: 6 }, { x: lx + 49, y: sw - 7, r: 2.5, h: 4 },
        { x: lx + 22, y: sw + 9, r: 7, h: 14 }, { x: lx + 37, y: sw + 11, r: 5.5, h: 11 }, { x: lx + 46, y: sw + 10, r: 3, h: 6 }, { x: lx + 58, y: sw + 14, r: 8.5, h: 10 }, { x: lx + 67, y: sw + 15, r: 3, h: 5 }, { x: lx + 15, y: sw + 13, r: 3, h: 6 }, { x: lx + 4, y: sw + 5, r: 3.5, h: 6 }, { x: lx - 8, y: sw - 2, r: 3, h: 5 }]; },
    lit(T, L, H) {
      const m = T.mood, dr = L.E.door, sw = L.sw, k = { morning: { amb: [.46, .56, .56], dc: [.9, 1, .8], da: .7 }, day: { amb: [.5, .62, .6], dc: [.85, 1, .85], da: .7 }, sunset: { amb: [.4, .32, .44], dc: [1, .6, .5], da: .8 }, night: { amb: [.15, .2, .38], dc: [.4, .75, 1], da: .55 } }[m];
      const la = m === 'night' ? 1.2 : m === 'sunset' ? 1 : .8, ha = m === 'night' ? 1.1 : .8, Ls = [{ x: dr.x, y: dr.y + 8, r: 96, a: k.da, col: k.dc, sy: 1.15 }, { x: dr.x + 6, y: sw + 16, r: 60, a: k.da * .8, col: k.dc, sy: .45 }];
      for (const l of L.lamps) { Ls.push({ x: l.x, y: l.y, r: 46, a: la, col: [.55, .95, 1] }); Ls.push({ x: l.x, y: sw + 12, r: 50, a: la * .5, col: [.55, .95, 1], sy: .4 }); }
      Ls.push({ x: L.heart.x, y: L.heart.y, r: 80, a: ha, col: [.7, .95, 1] }); Ls.push({ x: L.heart.x - 12, y: sw + 14, r: 66, a: ha * .6, col: [.7, .95, 1], sy: .45 });
      return { Ls, amb: k.amb, ambStage: k.amb.map(v => v * .8 + .06) };
    },
    wallK: T => T.wall, floorK: T => T.floor, ringK: T => T.ring, doorFrame: T => [T.wood[3], T.wood[2], T.wood[1]],
    wallDeco,
    wallEmit(c, g, T, L, E, R) {
      for (const l of L.lamps) { const x = l.x, y = l.y; for (let j = 0; j < Math.max(0, y - 6); j++) px(c, x, j, T.leaf[1]); disk(c, x, y, 5, '#1a3a4a'); disk(c, x, y, 4, '#8ae8f8'); disk(c, x, y + 1, 2, '#e8ffff'); px(c, x - 2, y - 2, '#ffffff'); }
      for (let i = 0; i < 26; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 10 + Math.floor(R() * (L.sw + 6)); if (E.cav(x, y) > .94 || E.inDoor(x, y) < 1.5) continue; px(c, x, y, P.col(hsh(x, y, 5), .9, .66)); }
    },
    paintSky, paintFar,
    groundDeco(c, g, T, L, H) {
      const R = rnd(11), sw = L.sw;
      NK.tuftRows(c, g, L, H, [T.moss[0], T.moss[2], T.moss[3]], R);
      for (let i = 0; i < 70; i++) { const x = L.x0 - 10 + Math.floor(R() * (L.x1 - L.x0 + 20)), y = sw + 4 + Math.floor(R() * (H - sw - 8)); rect(c, x, y, 2, 1, T.soil[2]); px(c, x + 1, y, T.soil[3]); }
      NK.sprinkle(c, L, H, ['#8ae8f8', '#e8d8ff', '#ffffff', '#fff08a'], 26, 7);
      NK.path(c, g, L, H, [T.stone[0], T.stone[1], T.stone[2], T.stone[3]], { stepping: true });
      NK.stream(c, g, L, H, T.water, { stones: T.stone, bank: [T.soil[1], T.moss[3]] }); NK.bridge(c, L, T.wood); NK.bed(c, L, T.soil); NK.fence(c, L, T.wood);
      for (let x = L.patch.x0 + 3; x < L.patch.x1 - 2; x += 9) ell(c, x, sw + 6, 6, 3, T.moss[1]);
    },
    spiritPaint: (c, L, T) => { if (!window.__WOODPIC) willowEmit(c, L, T); }, hutPaint, housePaint, ground() {},
    stageEmit(c, g, T, L) { willowEmit(c, L, T); },
    ringDeco(c, g, T, L, E, R) {
      const K = [T.leaf[0], T.leaf[1], T.leaf[1], T.leaf[2]];
      for (let i = 0; i < 44; i++) { const a = R() * 6.283, x = Math.round(E.cx + Math.cos(a) * E.rx * 1.02), y = Math.round(E.cy + Math.sin(a) * E.ry * 1.02); if (E.cav(x, y) < .99) continue; NK.leaves(c, x, y, 3 + Math.floor(R() * 4), K, R); }
      for (let i = 0; i < 7; i++) { const x = E.cx - E.rx + 10 + Math.round(R() * (E.rx * 2 - 20)); let y = 0; while (y < 60 && E.cav(x, y) >= 1) y++; if (y >= 60) continue; for (let j = 0; j < 8 + R() * 24; j++) { px(c, x + Math.round(Math.sin(j / 4 + x) * 1.2), y + j, j % 5 === 4 ? T.glow[2] : T.leaf[1]); } }
    },
    fg(c, g2, T, L, H, W) {
      const Rr = rnd(7), K = [T.leaf[0], T.leaf[1], T.leaf[1], T.leaf[2]];
      for (const side of [-1, 1]) for (let i = 0; i < 5; i++) NK.leaves(c, side < 0 ? g2.x0 + 4 + i * 5 : g2.x1 - 4 - i * 5, H - 6 + Math.floor(Rr() * 14) - i * 7, 10 + Math.floor(Rr() * 6), K, Rr);
      for (let i = 0; i < 8; i++) NK.leaves(c, L.x0 + Math.floor(Rr() * (L.x1 - L.x0)), H + 8 + Math.floor(Rr() * 6), 8 + Math.floor(Rr() * 5), K, Rr);
    },
    spirit: { name: 'The Whisper Willow', snd: 'hum', sndK: 2, say: ['leaf', 'star', 'heart', 'moon'], hw: 30, hh: 70, glow: T => ({ col: '#a8f0ff', r: 44, a: T.mood === 'night' ? .16 : .06, dy: 14 }),
      draw(c, n, f, T, L) { const x = L.spirit.x, y = L.sw - 10;
        if (window.__WOODPIC) { /* in the picture the Willow is a drifting light */ const bob = Math.sin(f / 11) * 1.5, yy = y + bob; c.save(); c.globalCompositeOperation = 'lighter'; const g0 = c.createRadialGradient(x, yy, 0, x, yy, 16 + (n.fl > .1 ? 6 : 0)); g0.addColorStop(0, 'rgba(210,255,255,.9)'); g0.addColorStop(.25, 'rgba(120,230,250,.45)'); g0.addColorStop(1, 'rgba(60,180,220,0)'); c.fillStyle = g0; c.fillRect(x - 24, yy - 24, 48, 48); c.fillStyle = '#ffffff'; c.fillRect(x - 1, Math.round(yy) - 1, 2, 2); for (let i = 0; i < 5; i++) { const a = f / 24 + i * 1.26, r = 8 + 3 * Math.sin(f / 9 + i); c.globalAlpha = .7; c.fillStyle = '#d8ffff'; c.fillRect(Math.round(x + Math.cos(a) * r), Math.round(yy + Math.sin(a) * r * .6), 1, 1); } c.restore(); return; } P.mandala(c, x, y - 1, 5, f, { step: 1, petals: 6, speed: 80, wave: .6, spin: 2 }); if (n.fl > .1) for (let i = 0; i < 6; i++) { const a = f / 5 + i * 1.05; px(c, x + Math.cos(a) * (14 + i * 3), y + Math.sin(a * 1.3) * 14, P.col(i / 6 + f / 60, .9, .8)); } } },
    get nests() { return window.__WOODPIC ? [] : [{ dx: -26, yf: .62, name: 'Fairy lantern' }, { dx: 2, yf: .5, name: 'Fairy lantern' }, { dx: 26, yf: .58, name: 'Fairy lantern' }]; },
    get depth() { return window.__WOODPIC ? false : undefined; },
    after() { if (!window.__WOODPIC) return; for (const n of ECO.kind('plant')) { n.hw = 0; n.hh = 0; n.draw = (c, nn, f) => { if (nn.en || nn.fl > .2) { c.globalAlpha = Math.min(1, nn.fl + .3); VG.px(c, Math.round(nn.x + Math.sin(f / 5) * 2), Math.round(nn.y - 4 - (f % 12) / 3), '#fff4c0'); c.globalAlpha = 1; } }; n.glow = undefined; } for (const n of ECO.kind('creature')) if (/owl/i.test(n.id + n.name)) { n.hidden = true; n.hw = 0; n.hh = 0; n.draw = () => {}; } },
    nestDraw(c, n, f, T, i, lit) { const x = Math.round(n.x), y = Math.round(n.y), sw = Math.round(Math.sin(f / 14 + i) * .7); for (let j = 0; j < 7; j++) px(c, x + sw, y - 15 + j, T.leaf[3]); for (let j = -5; j <= 6; j++) { const w = Math.round(5 * Math.sqrt(1 - Math.pow(j / 7, 2))); rect(c, x - w + sw, y + j - 5, w * 2, 1, OL); } for (let j = -4; j <= 5; j++) { const w = Math.round(4 * Math.sqrt(1 - Math.pow(j / 6.5, 2))); rect(c, x - w + sw, y + j - 5, w * 2, 1, lit ? mix('#fff2b8', '#ffa850', (j + 4) / 9) : T.bloom[1 + (j > 0 ? 0 : 1)]); } rect(c, x - 1 + sw, y - 11, 3, 1, T.bark[1]); px(c, x - 1 + sw, y - 3, lit ? '#ffffff' : T.bloom[3]); },
    plants: [
      { k: 'glowcap', name: 'Glowcap mushrooms', p: .15, row: 10, snd: 'chime', sndK: 4, crop: true, draw: PD.glowcap }, { k: 'bluebell', name: 'Bluebells', p: .5, row: 10, snd: 'chime', sndK: 2, crop: true, draw: PD.bluebell }, { k: 'moonflower', name: 'Moonflower', p: .85, row: 10, snd: 'chime', sndK: 6, crop: true, draw: PD.moonflower },
      { k: 'toadstool', name: 'Toadstools', p: .15, row: 18, snd: 'knock', crop: true, draw: PD.toadstool }, { k: 'moonflower', name: 'Moonflower', p: .5, row: 18, snd: 'chime', sndK: 6, crop: true, draw: PD.moonflower }, { k: 'glowcap', name: 'Glowcap mushrooms', p: .85, row: 18, snd: 'chime', sndK: 4, crop: true, draw: PD.glowcap },
      { k: 'foxglove', name: 'Foxglove', u: .05, row: 24, snd: 'chime', sndK: 3, draw: PD.foxglove }, { k: 'fern', name: 'Fern', u: .2, row: 6, draw: PD.fern }, { k: 'fern', name: 'Fern', u: .12, row: 27, draw: PD.fern }, { k: 'lily', name: 'Lily of the valley', u: .27, row: 22, snd: 'chime', sndK: 5, draw: PD.lily }, { k: 'bramble', name: 'Bramble', u: .31, row: 9, draw: PD.bramble },
      { k: 'primrose', name: 'Primroses', u: .44, row: 24, snd: 'chime', sndK: 1, draw: PD.primrose }, { k: 'foxglove', name: 'Foxglove', u: .8, row: 26, snd: 'chime', sndK: 3, draw: PD.foxglove }, { k: 'vine', name: 'Hanging vine', u: .78, row: 8, draw: PD.vine }, { k: 'clover', name: 'Clover', u: .62, row: 26, draw: PD.clover }, { k: 'bramble', name: 'Bramble', u: .96, row: 16, draw: PD.bramble }, { k: 'primrose', name: 'Primroses', u: .02, row: 16, snd: 'chime', sndK: 1, draw: PD.primrose },
    ],
    animals: [
      { id: 'fox', name: 'Fox', mode: 'walk', u: .22, row: 15, range: 18, hw: 9, hh: 9, say: ['moon', 'heart', 'leaf'], snd: 'yip', draw: A.fox }, { id: 'hedgehog', name: 'Hedgehog', mode: 'walk', u: .62, row: 22, range: 10, spd: .5, every: 2, hw: 7, hh: 6, say: ['leaf', 'drop', 'moon'], draw: A.hedgehog },
      { id: 'rabbit', name: 'Rabbit', mode: 'hop', u: .09, row: 11, hw: 6, hh: 8, say: ['leaf', 'heart', 'drop'], snd: 'squeak', draw: A.rabbit }, { id: 'owl', name: 'Owl', mode: 'still', u: .78, dy: -34, hw: 8, hh: 11, say: ['moon', 'star', 'heart'], snd: 'hoot', air: true, draw: A.owl },
      { id: 'toad', name: 'Toad', mode: 'hop', u: .55, row: 27, hw: 6, hh: 7, say: ['drop', 'leaf', 'note'], snd: 'ribbit', draw: A.toad }, { id: 'snail', name: 'Snail', mode: 'crawl', u: .27, row: 29, range: 8, hw: 5, hh: 5, say: ['leaf', 'drop', 'moon'], snd: 'bloop', draw: A.snail },
      { id: 'fawn', name: 'Blossom fawn', mode: 'walk', u: .7, row: 14, range: 14, spd: .8, magic: true, hw: 10, hh: 14, say: ['star', 'heart', 'moon', 'sun'], snd: 'chime', sndK: 7, glow: T => ({ col: '#ffc4dc', r: 16, a: T.lit * .3 + .1, dy: 10 }), draw: A.fawn },
      { id: 'moth', name: 'Luna moth', mode: 'hover', u: .5, dy: -44, magic: true, air: true, hw: 6, hh: 5, hover: { dy: -44, rx: 40, ry: 14, sx: 36, sy: 21, jy: 1 }, say: ['star', 'moon', 'heart'], snd: 'flutter', glow: T => ({ col: '#c8ffc8', r: 14, a: T.lit * .35 + .1, dy: 2 }), draw: A.moth },
      { id: 'fly0', name: 'Firefly', mode: 'hover', u: .3, dy: -16, air: true, hw: 4, hh: 4, hover: { dy: -16, rx: 28, ry: 10, sx: 17, sy: 11 }, say: ['star', 'sun'], snd: 'chime', sndK: 5, glow: T => ({ col: '#fff8a0', r: 9, a: T.lit * .5 + .08, dy: 0 }), draw: A.fly },
      { id: 'fly1', name: 'Firefly', mode: 'hover', u: .72, dy: -22, air: true, hw: 4, hh: 4, hover: { dy: -22, rx: 26, ry: 12, sx: 15, sy: 9 }, say: ['star', 'sun'], snd: 'chime', sndK: 3, glow: T => ({ col: '#fff8a0', r: 9, a: T.lit * .5 + .08, dy: 0 }), draw: A.fly },
    ],
    get folk() { return window.__WOODPIC ? [] : FOLKS; }, set folk(v) { FOLKS.splice(0, FOLKS.length, ...v); },
    sprites: { n: 4, name: 'Will-o-wisp', col: '#a8f0ff', r: 12, a: .22, draw: wisp, say: ['leaf', 'drop', 'star', 'heart', 'moon'] },
    weather: { dir: 'up', cols: ['#e8ffff', '#a8f0ff', '#fff6c8'], glow: true, depths: [{ n: 10, size: 1, dur: 36, z: 1, seed: 4, op: .8 }, { n: 3, size: 1, dur: 24, z: 3, seed: 8, op: .7, blur: 1 }] },
    rays(g, L) { if (g.mood === 'night') return []; const gx = Math.round(g.W * .62), out = []; for (let i = 0; i < 4; i++) out.push({ x: gx - 26 + i * 14, w: 6 + i * 2, sk: .35, a: g.T.shaftA * 1.3, d: i * 2.2, col: g.T.shaft }); return out; },
    lights(f, g, L) { const o = []; const a = g.mood === 'night' ? .3 : g.mood === 'sunset' ? .22 : .1; for (const m of L.shrooms) o.push({ x: m.x, y: m.y - m.h * .7, r: m.r * 4.4, col: '#ff9a30', a: a * (.88 + .12 * Math.sin(f / 8 + m.x)) }); o.push({ x: L.spirit.x, y: L.sw - 10, r: 38, col: '#8ae8f8', a: a * .9 }); return o; },
    layersFn(g, { T, L, H, stageLayer }) {
      if (window.__WOODPIC) return [{ id: 'photo', k: .56, res: 2, paint: (c, g2) => picPaint(c, g2, g.mood, g.W, g.H) }, stageLayer];
      const F = NK.forest, P = WP(g.mood), gx = Math.round(g.W * .62), gy = Math.round(H * .15), base = Math.round(H * .56);
      return [
        { id: 'sky', k: .04, res: 2, paint: (c, g2) => { F.sky(c, g2, P, L, gx, gy); if (P.isNight) { c.save(); c.globalAlpha = .55; for (let i = 0; i < 60; i++) F.R_(c, g2.x0 + VG.hsh(i, 3, 91) * (g2.x1 - g2.x0), g2.y0 + VG.hsh(i, 5, 92) * H * .3, .5, .5, '#cfeef0'); c.restore(); } } },
        { id: 'farA', k: .09, res: 2, blur: 1.4, paint: (c, g2) => { F.treeRow(c, g2, P, { fn: F.ftree, seed: 3, n: 8, depth: 1, base: Math.round(H * .52), jit: 4, h: 150, w: 6, col: P.farA, gx }); F.fogBand(c, g2, P.fog, H * .2, H * .58, 0, .5); } },
        { id: 'farB', k: .16, res: 2, blur: 1, paint: (c, g2) => { F.treeRow(c, g2, P, { fn: F.ftree, seed: 5, n: 6, depth: 1, base: Math.round(H * .57), jit: 5, h: 165, w: 8, col: P.farB, gx }); F.fogBand(c, g2, P.fog, H * .38, H * .64, 0, .42); } },
        { id: 'farC', k: .26, res: 2, blur: .4, paint: (c, g2) => { F.treeRow(c, g2, P, { fn: F.ftree, seed: 8, n: 4, depth: 1, base: Math.round(H * .6), jit: 5, h: 175, w: 11, col: P.farC, rim: P.rimC, gx }); farGround(c, g2, P, H); F.fogBand(c, g2, P.fog, H * .5, H * .68, 0, .34); } },
        { id: 'floor', k: .56, res: 2, paint: (c, g2) => floorPaint(c, g2, P, L, H) },
        stageLayer,
        { id: 'near', k: 1.1, res: 2, paint: (c, g2) => nearPaint(c, g2, P, L, H) },
        { id: 'fg', k: 1.8, blur: 2.6, op: .55, paint: (c, g2) => D.fg(c, g2, T, L, H, g.W) },
      ];
    },
  };
  NK.lib = Object.assign(NK.lib || {}, { wd: { PD, A, fairy, wisp, FSTYLE, DRESS, RAMPS, willowEmit, strands, floorPaint, hutPaint, housePaint } });
  NK.forest.calm(D);
  NK.realm(D);
})();
