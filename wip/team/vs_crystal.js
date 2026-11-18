/* ---------- Crystal Deep: an old forest that grew over a city nobody remembers ----------
   Back to front: a canopy so high the light arrives as shafts; huge dark trunks in fog; broken arches and columns; the stage (a stone floor
   with a mirror pool, the Crystal Heart on a dais, your hall under construction); hanging roots and ferns at the glass.
   The Spirit is the Heart, a tall crystal that remembers. Light runs out of it through cracks in the floor, like veins, to every plant and every
   home. The Elders are tall white figures that float: they speak by moving ribbons of light, and they pass what they know along the veins. */
(() => {
  const V = window.__VSET, MC = V.moodCol, { mix, rnd, hsh, px, rect, disk, ell, vgrad, hazeBottom, haze, crown, ridge, cloud } = VG;
  const SKY = { morning: ['#1a3a3e', '#2c5a58', '#5a8a78', '#a8c8a0'], day: ['#143a44', '#245a64', '#3e8a88', '#7ab8a0'], sunset: ['#1a1838', '#3a2a58', '#7a4a70', '#c87a6a'], night: ['#020610', '#06121e', '#0a2230', '#10343c'] };
  const FOG = { morning: '#6a9a8a', day: '#4a8a84', sunset: '#6a4a78', night: '#0c2a38' };
  const RAMPS = {
    moss: ['#0e2e24', '#1c5a3c', '#3c9a56'], stone: ['#2a3638', '#4e6264', '#8aa4a2'], dstone: ['#141e22', '#26363a', '#3e5a5c'], soil: ['#0c1612', '#1a2a22', '#2e4636'], bark: ['#141a18', '#2a3630', '#4a5e50'],
    leaf: ['#0c2c22', '#1a5a3a', '#34905a'], crys: ['#2a6aa8', '#6ad4f0', '#e4ffff'], violet: ['#4a3a98', '#9a82f0', '#e4daff'], white: ['#9ab4c8', '#e0f0f8', '#ffffff'], gold: ['#a8801a', '#e8c040', '#fff0a0'],
  };
  const pal = mood => { const T = { mood }, m = c => MC(c, mood); T.sky = SKY[mood].slice(); T.fog = FOG[mood]; for (const k in RAMPS) T[k] = RAMPS[k].map(k2 => (k === 'crys' || k === 'violet' || k === 'white' || k === 'gold') ? MC(k2, mood, .3) : m(k2)); T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .6 : mood === 'morning' ? .35 : .2; T.shaft = mood === 'sunset' ? '#ffb89a' : '#e0fff0'; T.shaftA = ({ morning: .2, day: .22, sunset: .2, night: .07 })[mood]; return T; };

  function sky(c, g, T, L) {
    const R = rnd(5), hz = L.hz; vgrad(c, g.x0, g.x1, g.y0, g.y1, T.sky);
    for (let i = 0; i < 70; i++) px(c, g.x0 + Math.floor(R() * (g.x1 - g.x0)), g.y0 + Math.floor(R() * hz * .5), T.mood === 'night' ? '#9ad8e8' : '#4a8a98');
    const cx = Math.round(g.W * .5), cy = Math.round(hz * .22), r = 10; for (let q = 4; q >= 0; q--) disk(c, cx, cy, r + q * 3, mix(T.sky[1], '#e8ffff', (T.mood === 'night' ? .55 : .3) * (1 - q / 5) * (q ? .35 : 1)));
  }
  function trunks(c, g, T, o) {
    const R = rnd(o.seed), fog = T.fog, z = o.z, step = o.step;
    for (let x = g.x0 - 10; x < g.x1 + 10; x += step + Math.floor(R() * step * .8)) {
      const w = o.w + Math.floor(R() * o.w * .7), lean = (R() - .5) * 6;
      for (let y = g.y0; y < o.base; y++) { const u = (y - g.y0) / (o.base - g.y0), xx = Math.round(x + lean * (1 - u)), ww = Math.round(w * (.7 + u * .5)); rect(c, xx - ww, y, ww * 2, 1, haze(T.bark[1], fog, z)); rect(c, xx - ww, y, 1, 1, haze(T.bark[2], fog, z)); rect(c, xx + ww - 2, y, 2, 1, haze(T.bark[0], fog, z)); if ((y * 3 + x) % 9 < 1) px(c, xx + Math.round((R() - .5) * ww), y, haze(T.bark[0], fog, z)); }
      for (let k = 0; k < 4; k++) { const yy = g.y0 + Math.floor(R() * (o.base - g.y0)); const ww = Math.round(w * .9); rect(c, x - ww + 1, yy, 3, 2, haze(T.moss[1], fog, z)); }
    }
    hazeBottom(c, g.x0, g.x1, o.base - 36, o.base + 4, fog, 0, o.hz);
  }
  function arch(c, x, base, wd, ht, T, z, ruin) {
    const fog = T.fog, h_ = q => haze(q, fog, z), R = rnd(x);
    for (const sx of [x, x + wd]) { for (let y = 0; y < ht; y++) { const w = 4 + (y < 6 ? 2 : 0); rect(c, sx - w, base - y, w * 2, 1, y % 7 === 6 ? h_(T.dstone[0]) : h_(T.dstone[1])); px(c, sx - w, base - y, h_(T.stone[1])); } }
    for (let i = 0; i <= 22; i++) { const a = Math.PI * i / 22, ax = x + wd / 2 + Math.cos(Math.PI - a) * (wd / 2), ay = base - ht - Math.sin(a) * wd * .3; if (ruin && i > 14 && i < 20) continue; rect(c, Math.round(ax) - 3, Math.round(ay) - 2, 6, 5, h_(T.dstone[1])); px(c, Math.round(ax) - 3, Math.round(ay) - 2, h_(T.stone[1])); }
    for (let k = 0; k < 8; k++) { const vx = x + Math.floor(R() * wd); for (let j = 0; j < 8 + Math.floor(R() * 10); j++) px(c, vx, base - ht - 6 + j, h_(T.moss[1])); }
  }
  function mid(c, g, T, L) {
    const R = rnd(21), fog = T.fog;
    for (let x = g.x0; x < g.x1; x += 120 + Math.floor(R() * 60)) arch(c, x + 16, L.hz2 + 12, 52 + Math.floor(R() * 20), 40 + Math.floor(R() * 24), T, .5, R() < .5);
    for (let x = g.x0 + 40; x < g.x1; x += 100 + Math.floor(R() * 90)) { const h = 22 + Math.floor(R() * 36), by = L.hz2 + 14; for (let y = 0; y < h; y++) rect(c, x - 3, by - y, 6, 1, haze(y % 6 === 5 ? T.dstone[0] : T.dstone[1], fog, .48)); rect(c, x - 5, by - h, 10, 2, haze(T.stone[1], fog, .48)); }
    hazeBottom(c, g.x0, g.x1, L.hz2 - 20, L.hz2 + 20, fog, 0, .3);
  }
  function statue(c, x, base, T, z) {
    const h_ = q => haze(q, T.fog, z); rect(c, x - 6, base - 6, 12, 6, h_(T.dstone[1])); rect(c, x - 4, base - 10, 8, 4, h_(T.dstone[0]));
    for (let y = 0; y < 22; y++) { const w = y < 14 ? 4 - (y > 8 ? 1 : 0) : 2; rect(c, x - w, base - 10 - y, w * 2, 1, h_(y % 5 ? T.stone[0] : T.dstone[1])); } disk(c, x, base - 36, 3, h_(T.stone[1])); px(c, x - 2, base - 24, h_(T.stone[2]));
    for (const d of [-1, 1]) for (let k = 0; k < 9; k++) px(c, x + d * (4 + k), base - 30 - Math.round(k * .5), h_(T.stone[1]));
  }
  /* the Crystal Heart on its dais */
  function heart(c, x, base, T, h, f) {
    const R = rnd(9), a = T.crys, wh = T.white;
    for (let i = 0; i < 5; i++) { rect(c, x - 22 + i * 2, base - i * 2 - 2, 44 - i * 4, 2, i % 2 ? T.stone[1] : T.stone[0]); px(c, x - 22 + i * 2, base - i * 2 - 2, T.stone[2]); }
    const shard = (sx, w, hh, col, edge, lean) => { for (let y = 0; y < hh; y++) { const u = y / hh, ww = Math.max(1, Math.round(w * (u < .8 ? 1 : (1 - u) * 5))), off = Math.round(lean * u); rect(c, sx - ww + off, base - 10 - y, ww * 2, 1, col); px(c, sx - ww + off, base - 10 - y, edge); rect(c, sx + ww - 2 + off, base - 10 - y, 2, 1, a[0]); } };
    shard(x - 11, 4, Math.round(h * .55), a[1], a[2], -4); shard(x + 11, 4, Math.round(h * .5), a[1], a[2], 4); shard(x - 5, 5, Math.round(h * .8), a[1], wh[0], -2); shard(x + 5, 5, Math.round(h * .72), a[1], wh[0], 2); shard(x, 7, h, mix(a[1], wh[1], .3), wh[2], 0);
    for (let y = 8; y < h - 10; y += 4) px(c, x - 1 + (y % 8 ? 0 : 1), base - 10 - y, wh[2]);
  }
  function hall(c, x, base, st, T, R) {
    const W2 = 50, s = T.stone, d = T.dstone, lit = T.mood !== 'day';
    rect(c, x - 3, base, W2 + 8, 2, 'rgba(0,0,0,.3)');
    if (st === 0) { for (let i = 0; i < 6; i++) { const bx = x + 4 + i * 8, by = base - 1 - (i % 3); rect(c, bx, by - 3, 6 + (i & 1), 4, i % 2 ? s[0] : s[1]); px(c, bx, by - 3, s[2]); } rect(c, x + 20, base - 12, 5, 12, s[1]); rect(c, x + 19, base - 13, 7, 2, s[2]); rect(c, x + 22, base - 14, 3, 2, s[0]); return; }
    for (let i = 0; i < W2 + 2; i += 5) { rect(c, x - 1 + i, base - 4, 5, 4, i % 10 ? s[0] : s[1]); px(c, x - 1 + i, base - 4, s[2]); }
    if (st === 1) { rect(c, x + 10, base - 8, 3, 4, s[1]); return; }
    const top = base - 4 - 24; for (const p of [0, 16, 33, W2 - 3]) { for (let y = 0; y < 24; y++) { rect(c, x + p, top + y, 4, 1, y % 6 === 5 ? d[0] : s[1]); px(c, x + p, top + y, s[2]); } rect(c, x + p - 1, top, 6, 2, s[2]); }
    if (st === 2) return;
    const hh = st === 3 ? 10 : 22; for (let y = 0; y < hh; y++) for (let i = 4; i < W2 - 3; i++) { if ((i > 17 && i < 32) && y < 12) continue; px(c, x + i, base - 5 - y, ((i >> 2) + (y >> 2)) % 2 ? d[1] : d[0]); if (y % 4 === 3) px(c, x + i, base - 5 - y, d[0]); }
    if (st === 3) return;
    rect(c, x - 2, top - 3, W2 + 4, 3, s[1]); rect(c, x - 2, top - 3, W2 + 4, 1, s[2]);
    if (st === 4) { for (let k = 0; k < 8; k++) { rect(c, x + k * 3, top - 3 - k, 2, 1, s[1]); rect(c, x + W2 - k * 3 - 2, top - 3 - k, 2, 1, s[1]); } return; }
    for (let j = 0; j < 16; j++) { const w = Math.round((W2 / 2 + 5) * (1 - j / 18)); rect(c, x + W2 / 2 - w, top - 3 - j, w * 2, 1, j % 3 === 0 ? d[0] : d[1]); px(c, x + W2 / 2 - w, top - 3 - j, s[1]); px(c, x + W2 / 2 + w - 1, top - 3 - j, d[0]); } for (let k = -5; k < 6; k += 2) px(c, x + W2 / 2 + k, top - 20, T.crys[k & 2 ? 1 : 2]);
    if (st === 5) return;
    for (const wx of [8, 38]) { rect(c, x + wx, base - 20, 5, 9, lit ? T.gold[2] : T.crys[0]); disk(c, x + wx + 2, base - 21, 2, lit ? T.gold[2] : T.crys[0]); rect(c, x + wx + 2, base - 20, 1, 9, d[0]); }
    for (let y = 0; y < 14; y++) { rect(c, x + 20, base - 5 - y, 10, 1, lit ? T.crys[1] : d[0]); } for (let y = 0; y < 5; y++) rect(c, x + 21 + (y < 2 ? 1 - y : 0), base - 19 - y, 8 - (y < 2 ? 2 - 2 * y : 0), 1, lit ? T.crys[1] : d[0]);
    if (st === 6) return;
    for (const lx of [-3, W2 - 1]) { rect(c, x + lx, base - 14, 1, 9, d[0]); const sh = (lx > 0 ? 1 : 0); disk(c, x + lx + .5, base - 17, 2, T.crys[1]); px(c, x + lx, base - 18, T.crys[2]); }
    for (let i = 0; i < 10; i++) px(c, x + 6 + i * 4, top + 6 + (i % 2) * 7, T.violet[2]);
  }
  function stage(c, g, T, L, st) {
    const R = rnd(11), W = g.W, sw = L.sw, x0 = g.x0, x1 = g.x1, H = g.H;
    for (let y = sw; y < g.y1; y++) { const u = Math.min(1, (y - sw) / (H - sw + 6)); c.fillStyle = mix(T.stone[0], T.dstone[0], u * .9); c.fillRect(x0, y, x1 - x0, 1); }
    for (let y = sw; y < g.y1; y += 6) for (let x = x0 + ((y / 6) % 2) * 9; x < x1; x += 18) { c.fillStyle = T.dstone[0]; c.fillRect(x, y, 1, 6); c.fillRect(x, y, 18, 1); px(c, x + 1, y + 1, T.stone[1]); if (hsh(x, y, 2) < .2) { c.fillStyle = T.moss[1]; c.fillRect(x + 2, y + 1, 6, 1); px(c, x + 3, y, T.moss[2]); } }
    for (let x = x0; x < x1; x++) { c.fillStyle = T.moss[hsh(x, 2, 2) < .3 ? 2 : 1]; c.fillRect(x, sw - (hsh(x, 1, 1) < .3 ? 1 : 0), 1, 2 + (hsh(x, 3, 3) < .2 ? 1 : 0)); }
    /* the mirror pool */
    if (L.pool) { const p = L.pool; ell(c, p.x, p.y, p.rx + 2, p.ry + 2, T.dstone[1]); ell(c, p.x, p.y, p.rx, p.ry, mix(T.sky[2], '#02060a', .5)); ell(c, p.x, p.y - 1, p.rx - 2, p.ry - 1, mix(T.sky[2], '#0a2030', .3)); for (let k = 0; k < 6; k++) px(c, p.x - p.rx + 6 + k * 9, p.y - 1 + (k % 2), T.crys[1]); }
    for (let i = 0; i < 14; i++) { const bx = x0 + Math.floor(R() * (x1 - x0)), by = sw + 6 + Math.floor(R() * (H - sw - 6)); rect(c, bx, by, 3 + Math.floor(R() * 3), 2, T.dstone[1]); px(c, bx, by, T.stone[1]); }
    heart(c, L.tree.x, sw + 2, T, L.tree.h);
    hall(c, L.house.x, sw + 1, st, T, R);
    if (L.statue) statue(c, L.statue.x, sw + 1, T, 0);
  }

  const PL = {
    glowcap: (c, n, f, T) => { const e = n.en || 0, sw = ECO.sway(n.x, f, .2) * .4; for (const [dx, h, w] of [[-5, 6, 3], [0, 9, 4], [6, 5, 3]]) { rect(c, n.x + dx, n.y - h, 2, h, '#c8e8d8'); const cx = n.x + dx + 1, cy = n.y - h; for (let j = 0; j < w; j++) rect(c, cx - w + j, cy - j, w * 2 - j * 2, 1, j ? '#4ad8c8' : '#2a8a8a'); px(c, cx - 1, cy - w + 1, '#ffffff'); if (e > .2) { c.globalAlpha = e * .5; disk(c, cx, cy - 2, w + 3, '#7affe8'); c.globalAlpha = 1; } } },
    fern: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .7) + n.kick * 2, e = n.en || 0; for (let k = -3; k <= 3; k++) { const L2 = 10 + (k & 1) * 4 + Math.round(e * 3); for (let j = 0; j < L2; j++) { const t = j / L2, xx = n.x + Math.round(k * t * 4 + sw * t), yy = n.y - Math.round(Math.sin(t * 1.6) * L2 * .8); px(c, xx, yy, T.leaf[1 + (j % 3 === 0 ? 1 : 0)]); if (j % 2) { px(c, xx - 1, yy + 1, T.leaf[2]); px(c, xx + 1, yy + 1, T.leaf[1]); } } } },
    crystal: (c, n, f, T) => { const e = n.en || 0, a = T.crys; for (const [dx, h, w, l] of [[-6, 12, 2, -2], [0, 18, 3, 0], [6, 10, 2, 2], [3, 7, 2, 1]]) { for (let y = 0; y < h; y++) { const ww = y > h - 4 ? 1 : w; rect(c, n.x + dx - ww + Math.round(l * y / h), n.y - y, ww * 2, 1, e > .3 ? a[2] : a[1]); px(c, n.x + dx - ww, n.y - y, a[2]); rect(c, n.x + dx + ww - 1, n.y - y, 1, 1, a[0]); } } },
    bell: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .9) + n.kick * 2, e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 12 + (k & 1) * 3, bx = n.x + k * 4; for (let j = 0; j < h; j++) px(c, bx + Math.round(sw * j / h * .4 + Math.sin(j / 4) * 1), n.y - j, T.leaf[1]); const tx = bx + Math.round(sw * .4); rect(c, tx - 1, n.y - h, 3, 3, T.violet[1]); px(c, tx - 2, n.y - h + 2, T.violet[2]); px(c, tx + 2, n.y - h + 2, T.violet[2]); px(c, tx, n.y - h + 3, e > .3 ? '#ffffff' : T.violet[2]); } },
    moss: (c, n, f, T) => { const e = n.en || 0; for (const [dx, dy, r] of [[-6, 0, 5], [2, 0, 7], [8, 0, 4]]) { ell(c, n.x + dx, n.y - 2, r + 1, Math.round(r * .6), T.moss[1]); ell(c, n.x + dx, n.y - 3, r, Math.round(r * .5), T.moss[2]); } for (let i = 0; i < 6; i++) px(c, n.x - 8 + i * 3, n.y - 6 - (i % 3), e > .2 || T.lit > .5 ? '#c8ffe0' : T.moss[2]); },
    orchid: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick, e = n.en || 0, h = 16 + Math.round(e * 3); for (let j = 0; j < h; j++) px(c, n.x + Math.round(sw * j / h), n.y - j, T.leaf[1]); for (let k = 0; k < 4; k++) { const yy = n.y - h + k * 3, xx = n.x + Math.round(sw * (h - k * 3) / h); disk(c, xx + (k % 2 ? 2 : -2), yy, 2, T.white[1]); px(c, xx + (k % 2 ? 2 : -2), yy, T.white[2]); px(c, xx + (k % 2 ? 3 : -3), yy + 1, T.violet[1]); } },
    lantern: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .4) + n.kick, e = n.en || 0, h = 22; for (let j = 0; j < h; j++) px(c, n.x + Math.round(sw * j / h * .5), n.y - j, '#bcd8c8'); const tx = n.x + Math.round(sw * .5); c.globalAlpha = .35 + e * .3; disk(c, tx + 3, n.y - h + 4, 7, T.gold[1]); c.globalAlpha = 1; for (let j = 0; j < 4; j++) rect(c, tx - 2 + (j ? 0 : 1) , n.y - h + j * 2, 4, 1, '#c8e8d8'); disk(c, tx + 3, n.y - h + 4, 3, T.gold[2]); px(c, tx + 2, n.y - h + 3, '#ffffff'); rect(c, tx + 3, n.y - h - 1, 1, 3, '#bcd8c8'); },
    ghostpipe: (c, n, f, T) => { const e = n.en || 0; for (const [dx, h] of [[-4, 8], [0, 12], [5, 7]]) { for (let j = 0; j < h; j++) px(c, n.x + dx, n.y - j, '#e8f4f0'); rect(c, n.x + dx - 1, n.y - h - 2, 3, 2, '#ffffff'); px(c, n.x + dx, n.y - h, e > .2 ? '#aaffee' : '#c8d8e0'); } },
    vine: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .6) + n.kick, e = n.en || 0, h = 26; for (let j = 0; j < h; j++) { const xx = n.x + Math.round(Math.sin(j / 4) * 3 + sw * j / h); rect(c, xx, n.y - j, 2, 1, T.leaf[1]); if (j % 5 === 2) { px(c, xx - 2, n.y - j, T.leaf[2]); px(c, xx + 3, n.y - j - 1, T.leaf[2]); } if (j % 6 === 4) { disk(c, xx + (j % 12 ? 3 : -2), n.y - j, 1, e > .2 ? '#d8c8ff' : T.violet[1]); } } },
  };
  const PLN = { glowcap: 'Glowcaps', fern: 'Old fern', crystal: 'Crystal bloom', bell: 'Bellflowers', moss: 'Moss mound', orchid: 'Ghost orchid', lantern: 'Lantern fungus', ghostpipe: 'Ghost pipe', vine: 'Light vine' };
  const PLS = { glowcap: ['chime', 4], fern: ['rustle'], crystal: ['glass'], bell: ['chime', 8], moss: ['soft'], orchid: ['chime', 6], lantern: ['hum', 2], ghostpipe: ['chime', 10], vine: ['rustle'] };

  /* an Elder: tall, white, floating; ribbons of light move when it speaks */
  function elder(c, x, y, f, T, o) {
    x = Math.round(x); y = Math.round(y); const wh = T.white, ph = o.ph || 0, sp = o.spk || 0, sw = Math.sin(f / 11 + ph);
    /* ribbons of light: they are the voice */
    for (let k = 0; k < 4; k++) { const dir = k < 2 ? -1 : 1, off = k % 2; c.globalAlpha = .7; for (let j = 0; j < 26; j++) { const t = j / 26, rx = x + dir * (2 + off * 3 + t * 8) + Math.round(Math.sin(f / (8 - sp * 3) + j / 3 + k + ph) * (1.5 + t * 4 + sp * 3)), ry = y + 6 + j; px(c, rx, ry, j % 6 === 5 ? T.crys[2] : T.crys[1]); } } c.globalAlpha = 1;
    /* the gown */
    for (let j = 0; j < 30; j++) { const w = j < 2 ? 2 : j < 8 ? 3 : j < 13 ? 2 : Math.round(2 + (j - 13) * .32), off = Math.round(sw * j * .05), yy = y + j - 4; c.fillStyle = wh[0]; c.fillRect(x - w + off, yy, w * 2, 1); c.fillStyle = wh[1]; c.fillRect(x - w + 1 + off, yy, w * 2 - 3, 1); c.fillStyle = wh[2]; c.fillRect(x - w + 1 + off, yy, Math.max(1, Math.floor(w * .7)), 1); if (j > 24) { c.globalAlpha = (30 - j) / 6; c.fillStyle = wh[2]; c.fillRect(x - w + off, yy, w * 2, 1); c.globalAlpha = 1; } }
    /* head and hood */
    disk(c, x, y - 8, 4, wh[1]); disk(c, x - 1, y - 9, 3, wh[2]); px(c, x - 1, y - 7, T.crys[0]); px(c, x + 1, y - 7, T.crys[0]); for (let k = 0; k < 5; k++) px(c, x + 3 + k, y - 12 + (k > 2 ? 1 : 0), wh[2]); px(c, x, y - 13, T.crys[2]);
    /* arms: down when listening, raised when speaking */
    for (const d of [-1, 1]) for (let k = 0; k < 8; k++) { const up = sp > .3 ? -1.1 : .5; px(c, x + d * (3 + k * .8), y - 2 + Math.round(k * up + Math.sin(f / 6 + k * .6 + d) * .8), wh[1]); px(c, x + d * (3 + k * .8), y - 1 + Math.round(k * up + Math.sin(f / 6 + k * .6 + d) * .8), wh[0]); }
    /* a halo ring */
    c.globalAlpha = .55; for (let a = 0; a < 16; a++) { const an = a / 16 * 6.283 + f / 50; px(c, x + Math.cos(an) * 7, y - 15 + Math.sin(an) * 2, T.crys[2]); } c.globalAlpha = 1;
  }

  function buildPolys(L, links, T) {
    let i = 0;
    for (const l of links) {
      if (l.kind !== 'root') continue; const a = l.a, b = l.b, sw = L.sw, k = i++, ax = a.x + (k % 5 - 2) * 3, bx = b.x, tx = bx, ty = sw + 3, dep = 3 + (k % 6) * 3 + Math.min(10, Math.abs(bx - ax) * .03), cx = ax + (bx - ax) * .5, cy = sw + 3 + dep * 2, pts = [];
      for (let j = 0; j <= 14; j++) { const t = j / 14, u = 1 - t; pts.push([u * u * ax + 2 * u * t * cx + t * t * tx, u * u * (sw + 3) + 2 * u * t * cy + t * t * ty]); }
      const ls = [0]; for (let q = 1; q < pts.length; q++) ls.push(ls[q - 1] + Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]));
      l.pts = pts; l.ls = ls; l.len = ls[ls.length - 1];
    }
  }
  function build(g) {
    const W = g.W, H = g.H, T = g.T, L = g.L, R = rnd(61), sw = L.sw;
    const S = (id, o) => ECO.add(Object.assign({ id, kind: 'creature', hw: 7, hh: 7 }, o));
    ECO.begin(g, {
      pulse: '#aaf4ff', wave: '#9ae8ff', bubble: { bg: '#e8fcff', edge: '#0a2a3a', ink: ['#1a8aaa', '#7a5ad8', '#2aaa8a', '#d89a2a'] },
      route(l, u) { if (!l.pts) return null; let d = u * l.len, k = 1; while (k < l.ls.length - 1 && d > l.ls[k]) k++; const t = (d - l.ls[k - 1]) / Math.max(.001, l.ls[k] - l.ls[k - 1]), A = l.pts[k - 1], B = l.pts[k]; return { x: A[0] + (B[0] - A[0]) * Math.min(1, t), y: A[1] + (B[1] - A[1]) * Math.min(1, t) }; },
      link(c, l, at, f) {
        if (l.kind === 'root') { const n = Math.max(10, Math.round(l.len)); for (let i = 0; i <= n * 2; i++) { const q = at(l, i / (n * 2)); c.globalAlpha = l.fl > .1 ? .5 + l.fl * .5 : (T.mood === 'night' ? .42 : .26); c.fillStyle = l.fl > .1 ? '#e4ffff' : T.crys[1]; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; return; }
        if (l.fl > .12) { const n = Math.max(8, Math.round(Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y) * .5)); c.fillStyle = '#aaf4ff'; for (let i = 0; i <= n; i += 2) { const q = at(l, i / n); c.globalAlpha = l.fl * .7; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; }
      },
    });
    const tr = L.tree;
    ECO.add({ id: 'spirit', kind: 'spirit', name: 'The Crystal Heart', x: tr.x, y: sw + 2, hw: 20, hh: tr.h * .5, snd: 'glass', sndK: 1, magic: true, say: ['heart', 'eye', 'star', 'drop'], z: sw - 4, lift: -2, noReflect: true, draw(c, n, f) { const p = Math.sin(f / 22) * .5 + .5; for (let i = 0; i < 4; i++) { const a = f / 40 + i * 1.57, rx = tr.x + Math.cos(a) * 22, ry = sw - tr.h * .55 + Math.sin(a) * 6; rect(c, rx, ry, 2, 3, T.crys[2]); px(c, rx, ry - 1, '#ffffff'); } }, glow: { col: '#9ae8ff', r: 58, a: T.mood === 'night' ? .5 : .22, dy: 26 } });
    const homes = [];
    homes.push(ECO.add({ id: 'house', kind: 'house', name: 'Your hall', x: L.house.x + 25, y: sw, hw: 30, hh: 22, z: sw - 1, snd: 'gong', draw() {}, lift: -2, glow: () => (g.tk.stage() >= 6 ? { col: '#9ae8ff', r: 36, a: T.lit * .5 + .15, dy: 14 } : null) }));
    if (L.statue) homes.push(ECO.add({ id: 'statue', kind: 'home', name: 'Old statue', x: L.statue.x, y: sw, hw: 7, hh: 20, z: sw - 2, snd: 'glass', draw() {}, lift: -2, glow: { col: '#7ac8e8', r: 16, a: T.lit * .2, dy: 20 } }));
    const plants = [], P = (kind, x, o) => { if (L.wide && x < L.house.x + 58) return null; const seed = Math.floor(R() * 9), nd = ECO.add(Object.assign({ id: kind + plants.length, kind: 'plant', pk: kind, name: PLN[kind], x, y: sw + 3, hw: 8, hh: 11, snd: PLS[kind][0], sndK: PLS[kind][1], seed, z: sw + (seed % 4), en: 0, lift: -2, draw: (c, n, f) => PL[kind](c, n, f, T), step(n) { n.en = Math.max(0, (n.en || 0) - .015); }, glow: n => (kind === 'glowcap' || kind === 'crystal' || kind === 'lantern' || kind === 'orchid' || kind === 'bell') ? { col: kind === 'lantern' ? '#ffd870' : kind === 'bell' ? '#b8a0ff' : '#7affe8', r: 14 + (n.en || 0) * 12, a: (T.lit * .32 + (n.en || 0) * .4), dy: 8 } : null }, o || {})); plants.push(nd); return nd; };
    const fx = v => Math.round(W * v);
    P('glowcap', fx(.2)); P('glowcap', fx(.55)); P('glowcap', fx(.93)); P('fern', fx(.27)); P('fern', fx(.45)); P('fern', fx(.66)); P('fern', fx(.97)); P('crystal', fx(.34)); P('crystal', fx(.62)); P('crystal', fx(.88));
    P('bell', fx(.24)); P('bell', fx(.5)); P('bell', fx(.72)); P('moss', fx(.4)); P('moss', fx(.8)); P('orchid', fx(.3)); P('orchid', fx(.58)); P('lantern', fx(.37)); P('lantern', fx(.68)); P('ghostpipe', fx(.47)); P('ghostpipe', fx(.84)); P('vine', fx(.42)); P('vine', fx(.76));
    const sp = ECO.spirit();
    for (const p of plants.concat(homes)) ECO.link(sp, p, { kind: 'root' });
    buildPolys(L, ECO.links(), T);
    mkCreatures(g, S, L, sp, plants, homes);
    ECO.autoLinks({ noRoots: true });
  }
  function mkCreatures(g, S, L, sp, plants, homes) {
    const T = g.T, W = g.W, sw = L.sw, tr = L.tree, say = ['eye', 'star', 'heart', 'drop', 'moon'], rnd_ = a => a[Math.floor(Math.random() * a.length)];
    const ne = L.wide ? 3 : 2;
    for (let i = 0; i < ne; i++) S('elder' + i, { name: 'Elder', x: W * (.3 + i * .22), y: sw - 56, hw: 10, hh: 22, magic: true, say, snd: 'chime', sndK: i * 3 + 1, z: sw - 6 + i, noReflect: false, refl: true, ph: i * 2.1, spk: 0,
      step(n, f) { n.x = W * (.34 + i * .2) + Math.sin(f / 70 + i * 2) * 16; n.y = sw - 56 - Math.sin(f / 38 + i) * 5 - i * 3; n.spk = Math.max(0, n.spk - .02); if ((n.fl || 0) > .5) n.spk = 1; if (f % (260 + i * 90) === 0) { n.spk = 1; ECO.say(n, rnd_(say), false); const v = plants[Math.floor(Math.random() * plants.length)]; v.en = 1; v.fl = 1; ECO.spark(v.x, v.y - 10, 8, '#aaf4ff', .6, .5); } },
      draw(c, n, f) { elder(c, n.x, n.y, f, T, { ph: n.ph, spk: n.spk }); } , glow: { col: '#bff4ff', r: 30, a: T.lit * .32 + .1, dy: 8 } });
    S('stag', { name: 'Glass stag', x: W * .64, y: sw + 3, hw: 12, hh: 20, magic: true, say, snd: 'glass', sndK: 3, z: sw + 4, refl: true, dd: -1, x0: W * .56, x1: W * .72,
      step(n, f) { if (f % 3 === 0 && n.fl < .3) { n.x += n.dd * .35; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd, a = T.crys, w = T.white, st = Math.round(Math.sin(f / 7) * 1); for (const lx of [-8, -5, 4, 7]) { rect(c, x + lx, y - 12, 2, 12, w[0]); px(c, x + lx, y - 12, w[1]); } for (let j = 0; j < 8; j++) rect(c, x - 10, y - 20 + j, 20, 1, j < 2 ? w[2] : j < 6 ? w[1] : w[0]); for (let j = 0; j < 9; j++) rect(c, x + d * (8 + j * .4), y - 28 + j * 1.3, 3, 2, w[1]); disk(c, x + d * 12, y - 29, 3, w[2]); px(c, x + d * 13, y - 30, '#101828'); for (const s of [-1, 1]) for (let k = 0; k < 10; k++) { const ax = x + d * 11 + s * (k * .9), ay = y - 33 - k * 1.5 + (k % 3 === 2 ? -2 : 0); px(c, ax, ay, a[1 + (k & 1)]); if (k % 3 === 2) { px(c, ax + s, ay - 2, a[2]); px(c, ax + s * 2, ay - 3, a[2]); } } } });
    S('moth', { name: 'Luna moth', x: W * .4, y: sw - 30, hw: 9, hh: 8, magic: true, say: ['moon', 'star', 'eye'], snd: 'flutter', z: sw - 8, noReflect: true,
      step(n, f) { n.x = W * .5 + Math.sin(f / 52) * W * .3 + Math.sin(f / 7) * 2; n.y = sw - 34 + Math.sin(f / 31) * 14 + Math.sin(f / 6) * 2; },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), w = Math.abs(Math.sin(f / 4)) * 6 + 1; for (const d of [-1, 1]) { for (let k = 0; k < w; k++) rect(c, x + d * k - (d < 0 ? 1 : 0), y - 3 + Math.round(k * .3), 1, 6 - Math.floor(k * .6), k % 3 === 0 ? '#c8ffd8' : '#a8f0c0'); px(c, x + d * Math.floor(w * .6), y - 1, '#e8ff8a'); } rect(c, x - 1, y - 2, 2, 6, '#e8f4e0'); } });
    S('owl', { name: 'Old owl', x: L.arch ? L.arch.x : W * .1, y: sw - 52, hw: 7, hh: 9, say: ['moon', 'eye', 'star'], snd: 'hoot', z: sw - 8, noReflect: true,
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), bl = f % 60 < 3; rect(c, x - 4, y - 10, 8, 10, '#5a4a3a'); rect(c, x - 3, y - 6, 6, 5, '#d8c8a8'); rect(c, x - 4, y - 12, 2, 2, '#5a4a3a'); rect(c, x + 2, y - 12, 2, 2, '#5a4a3a'); for (const dx of [-3, 1]) { rect(c, x + dx, y - 9, 3, 3, bl ? '#5a4a3a' : '#ffe27a'); if (!bl) px(c, x + dx + 1, y - 8, '#101018'); } px(c, x, y - 6, '#e8a030'); rect(c, x - 6, y - 1, 12, 2, '#3a4a40'); } });
    S('fox', { name: 'Pale fox', x: W * .34, y: sw + 4, hw: 9, hh: 8, say: ['star', 'moon', 'eye'], snd: 'yip', z: sw + 5, refl: true, dd: 1, x0: W * .3, x1: W * .4,
      step(n, f) { if (f % 4 === 0 && n.fl < .3) { n.x += n.dd * .5; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd; rect(c, x - 7, y - 9, 12, 5, '#e8e4f0'); rect(c, x + d * 5 - 2, y - 11, 5, 5, '#e8e4f0'); rect(c, x + d * 8, y - 8, 3, 2, '#c8c4d8'); px(c, x + d * 7, y - 10, '#101828'); rect(c, x + d * 4 - 1, y - 14, 2, 3, '#e8e4f0'); rect(c, x - 6, y - 4, 2, 4, '#8a86a0'); rect(c, x + 2, y - 4, 2, 4, '#8a86a0'); for (let k = 0; k < 8; k++) rect(c, x - d * (7 + k), y - 8 + Math.round(Math.sin(f / 10 + k / 2) * 2) - (k > 4 ? 1 : 0), 2, 3 - (k > 5 ? 1 : 0), k > 5 ? '#ffffff' : '#e8e4f0'); for (let i = 0; i < 4; i++) px(c, x - 4 + i * 3, y - 9, T.crys[1]); } });
    S('salamander', { name: 'Ember newt', x: W * .52, y: sw + 8, hw: 8, hh: 4, say: ['drop', 'star', 'heart'], snd: 'bloop', z: sw + 8, dd: 1, x0: W * .48, x1: W * .56,
      step(n, f) { if (f % 6 === 0 && n.fl < .3) { n.x += n.dd * .6; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd; for (let k = 0; k < 9; k++) rect(c, x - d * k + Math.round(Math.sin(f / 6 + k / 2)), y - 2, 2, 2, k % 3 ? '#ff7a3a' : '#2a1a3a'); disk(c, x + d * 2, y - 2, 2, '#ff9a4a'); px(c, x + d * 3, y - 3, '#101018'); } , glow: { col: '#ff8a3a', r: 12, a: T.lit * .3 + .05, dy: 3 } });
    S('toad', { name: 'Mirror toad', x: L.pool ? L.pool.x + L.pool.rx + 6 : W * .3, y: sw + 10, hw: 8, hh: 7, say: ['drop', 'moon', 'note'], snd: 'bloop', z: sw + 9, refl: false,
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), sw2 = f % 70 < 6 ? 1 : 0; disk(c, x, y - 4, 5, '#3a6a4a'); disk(c, x - 1, y - 5, 3, '#5a9a6a'); rect(c, x - 3, y - 9, 2, 2, '#e8d84a'); rect(c, x + 2, y - 9, 2, 2, '#e8d84a'); px(c, x - 2 + sw2, y - 8, '#101018'); px(c, x + 3 - sw2, y - 8, '#101018'); for (let i = 0; i < 3; i++) px(c, x - 3 + i * 3, y - 6, '#9ad8a8'); } });
    S('bat', { name: 'Glass bat', x: W * .3, y: sw - 60, hw: 8, hh: 5, say: ['moon', 'note', 'star'], snd: 'squeak', magic: false, z: sw - 9, noReflect: true,
      step(n, f) { n.x = W * .5 + Math.sin(f / 33) * W * .4; n.y = sw - 70 + Math.sin(f / 17) * 14 + Math.sin(f / 3) * 3; },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), w = f % 6 < 3 ? 4 : 1; for (const d of [-1, 1]) for (let k = 1; k <= 6; k++) px(c, x + d * k, y - (k > 3 ? w - 1 : 0) + (k > 4 ? 1 : 0), k % 2 ? '#2a1a4a' : '#4a3a7a'); rect(c, x - 1, y - 1, 3, 3, '#2a1a4a'); px(c, x - 1, y - 2, '#4a3a7a'); px(c, x + 1, y - 2, '#4a3a7a'); } });
  }

  VISTA.reg('crystal', {
    stageK: .55, eco: true,
    pal(mood) { return pal(mood); },
    layout(g) {
      const W = g.W, H = g.H, wide = W > 210, sw = Math.round(H * .7);
      g.L = { W, H, wide, sw, hz: Math.round(H * .4), hz2: Math.round(H * .56), house: { x: wide ? Math.round(W * .04) : 2 }, tree: { x: wide ? Math.round(W * .76) : Math.round(W * .7), h: Math.round(H * .4) }, statue: wide ? { x: Math.round(W * .62) } : null, arch: { x: Math.round(W * .1) }, pool: wide ? { x: Math.round(W * .33), y: sw + 15, rx: 38, ry: 5 } : null };
      g.L.fairies = []; ECO.end(); build(g);
    },
    rays(g) { const W = g.W, out = []; for (let i = 0; i < 4; i++) out.push({ x: W * (.12 + i * .24), w: 8 + (i * 5) % 8, sk: .35, a: g.T.shaftA * (g.mood === 'night' ? 2 : 1), d: i * 2.7, col: g.T.shaft }); return out; },
    weather: { dir: 'up', cols: ['#aaf4ff', '#d8fff4', '#ffffff'], glow: true, depths: [{ n: 9, size: 1, dur: 46, z: 1, seed: 8, op: .8 }, { n: 3, size: 2, dur: 30, z: 3, seed: 5, op: .7, blur: 1.2 }] },
    layers(g) {
      const T = g.T, L = g.L, st = () => g.tk.stage();
      return [
        { id: 'sky', k: .04, paint: (c, g2) => sky(c, g2, T, L) },
        { id: 'far', k: .1, blur: 1.4, paint: (c, g2) => trunks(c, g2, T, { seed: 3, base: L.hz + 50, z: .7, step: 30, w: 4, hz: .66 }) },
        { id: 'mid1', k: .2, blur: .8, paint: (c, g2) => trunks(c, g2, T, { seed: 8, base: L.hz2 + 6, z: .5, step: 52, w: 6, hz: .5 }) },
        { id: 'mid2', k: .36, paint: (c, g2) => mid(c, Object.assign({ W: g.W }, g2), T, L) },
        { id: 'stage', k: .55, stage: true, live: true, paint: (c, g2) => stage(c, Object.assign({ W: g.W, H: g.H }, g2), T, L, st()), live(c, f, g2) { ECO.draw(c, f, g2); } },
        { id: 'near', k: .95, paint(c, g2) {
          const Rr = rnd(37);
          for (let x = g2.x0; x < g2.x1; x++) { const d = 7 + Math.round(3 * Math.sin(x / 8) + 2 * Math.sin(x / 3.1)); c.fillStyle = T.leaf[0]; c.fillRect(x, g2.y0, 1, d + 2 - g2.y0); c.fillStyle = T.leaf[1]; c.fillRect(x, g2.y0, 1, d - g2.y0); }
          for (let i = 0; i < 6; i++) { const x = Math.round(g2.x0 + Rr() * (g2.x1 - g2.x0)), len = 8 + Math.floor(Rr() * 26); for (let j = 0; j < len; j++) { px(c, x + Math.round(Math.sin(j / 5 + i)), 8 + j, j % 5 === 4 ? T.leaf[2] : T.bark[1]); } if (Rr() < .6) { disk(c, x, 8 + len + 1, 2, T.crys[1]); px(c, x - 1, 8 + len, T.crys[2]); } }
        } },
        { id: 'fg', k: 1.8, blur: 2.8, op: .9, paint(c, g2) {
          const Rr = rnd(7), H = g.H, W = g.W;
          for (const x of [g2.x0 + 8, W - 10]) for (let i = -4; i <= 4; i++) { const h = 14 + (i * 7 & 7) * 3; for (let j = 0; j < h; j++) px(c, x + i * 2 + Math.round(i * j * .15), H + 6 - j, T.leaf[(i + j) & 1 ? 1 : 2]); }
          for (let i = 0; i < 4; i++) { const x = g2.x0 + 10 + Math.floor(Rr() * (g2.x1 - g2.x0 - 20)), y = H - 4 - Math.floor(Rr() * 10); disk(c, x, y, 2, T.crys[0]); px(c, x, y - 1, T.crys[2]); }
        } },
      ];
    },
    lights(f, g) {
      const L = g.L, out = [{ x: g.W * .5, y: L.hz * .22, r: 80, col: '#bff4ff', a: g.mood === 'night' ? .25 : .12 }];
      if (g.mood === 'sunset') out.push({ x: g.W * .8, y: L.hz, r: 90, col: '#ff9a82', a: .18 });
      return out;
    },
  });
})();
