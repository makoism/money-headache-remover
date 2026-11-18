/* ---------- The Green: a hidden meadow behind a hedge, where the Greenlings keep house ----------
   You push through the hedge and find a small round meadow: a cottage that you build, a garden behind a fence, a brook with a plank over it,
   and the Heart Tree with the Greenlings' leaf-pod homes hanging in it. The Greenlings are the folk here, little people made of green, in
   shades that are their rank. One waters from the brook, one tends and harvests, one carries the harvest to the store, the old one sits by the
   Heart Tree and talks to whoever passes. Energy sprites, the Tree's own light, drift from its hollow to wake a plant or feed an animal.
   Sheep, hens, a rabbit and a hedgehog live off what the garden and meadow give. Nothing here is alone; it all feeds what is next to it. */
(() => {
  const V = window.__VSET, MC = V.moodCol, { mix, rnd, hsh, px, rect, disk, ell, vgrad, hazeBottom, haze, crown, cloud } = VG;
  const SKY = { morning: ['#9ad0e8', '#d8ecdc', '#ffe8c0', '#fff4d8'], day: ['#5ab4f0', '#92d0f4', '#cae8f0', '#eef6dc'], sunset: ['#4a4a9a', '#c0709a', '#f4a468', '#ffd890'], night: ['#060e2a', '#0e204a', '#1a3860', '#2a4a70'] };
  const FOG = { morning: '#e0ecd8', day: '#cbe6e4', sunset: '#e8a898', night: '#1a2e56' };
  const RAMPS = {
    hedge: ['#0b3228', '#16603a', '#34943f', '#9ad85a'], grass: ['#1e5a34', '#3f9a44', '#78cc54', '#c4f07a'], bark: ['#2a1e1c', '#5a3e2e', '#8a6444', '#c09868'], thatch: ['#6a4a1c', '#b88a38', '#e8c460', '#fff0a0'],
    plaster: ['#9c8a74', '#d8c8a4', '#f4e8c8', '#fffbe8'], stone: ['#4e5a64', '#8a98a0', '#c0cac8', '#e8f0ee'], soil: ['#2a1a14', '#4a2e20', '#704a30', '#9a6a44'], water: ['#1a4a8a', '#3a82c8', '#78bef0', '#c8f0ff'],
    wood: ['#3a281c', '#6a4a30', '#a07848', '#d0aa70'],
  };
  const GREEN = ['#0f5a2a', '#1f8a3a', '#3aaa4a', '#6ad25a', '#a8f070', '#e8ffb0'];
  const CLOTH = [['#6a2a22', '#c0553a', '#f09a62'], ['#22407a', '#4a78c0', '#8ab4f0'], ['#7a5a14', '#d4a030', '#f8d870'], ['#4a2a6a', '#8a5ac0', '#c8a4f0']];
  const pal = mood => { const T = { mood }, m = c => MC(c, mood); T.sky = SKY[mood].slice(); T.fog = FOG[mood]; for (const k in RAMPS) T[k] = RAMPS[k].map(m); T.green = GREEN.map(c => MC(c, mood, .3)); T.cloth = CLOTH.map(r => r.map(m)); T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .55 : mood === 'morning' ? .2 : 0; T.cloud = ['#a8c4dc', '#f4f8fa', '#ffffff'].map(m); T.shaft = mood === 'sunset' ? '#ffc888' : '#fff6c8'; T.shaftA = ({ morning: .2, day: .16, sunset: .24, night: .06 })[mood]; return T; };
  const hz_ = (K, fog, z) => K.map(c => haze(c, fog, z));

  function sky(c, g, T, L) {
    const R = rnd(5), hz = L.hz; vgrad(c, g.x0, g.x1, g.y0, g.y1, [T.sky[0], T.sky[1], T.sky[2], T.sky[3]]);
    if (T.mood === 'night') { for (let i = 0; i < 90; i++) px(c, g.x0 + Math.floor(R() * (g.x1 - g.x0)), g.y0 + Math.floor(R() * hz * 1.1), R() > .85 ? '#ffffff' : '#8fa4d8'); disk(c, L.cx + 18, 34, 7, '#f4f2dc'); disk(c, L.cx + 21, 32, 6, T.sky[1]); }
    else if (T.mood === 'sunset') { disk(c, L.cx - 24, hz - 4, 8, '#fff0b0'); disk(c, L.cx - 24, hz - 4, 5, '#ffffe0'); }
    else { disk(c, L.cx - 20, 34, 6, '#fffbe4'); disk(c, L.cx - 20, 34, 4, '#ffffff'); }
    for (let i = 0; i < 6; i++) cloud(c, L.cx - 70 + i * 28 + Math.floor(R() * 10), Math.round(L.hz * (.35 + R() * .5)), 28 + Math.floor(R() * 24), 5 + Math.floor(R() * 4), T.cloud, R);
  }
  /* what you glimpse through the opening: a patchwork hill, a mill */
  function far(c, g, T, L) {
    const R = rnd(3), fog = T.fog, base = L.hz + 22, yf = x => base - 14 * (Math.sin(x / 34 + .8) * .5 + Math.sin(x / 15 + 2) * .25 + .6), z = .55;
    for (let x = g.x0; x < g.x1; x++) { const ry = Math.round(yf(x)); for (let y = ry; y < g.y1; y++) { const band = Math.floor((y - ry) / 5), cell = Math.floor((x + band * 7) / (10 + band * 3)); const cols = [T.grass[1], T.grass[2], T.thatch[1], T.grass[0], T.thatch[2]]; c.fillStyle = haze(y - ry < 1 ? T.grass[3] : cols[(((band * 3 + cell) % 5) + 5) % 5], fog, z); c.fillRect(x, y, 1, 1); } }
    for (let x = g.x0 + 6; x < g.x1; x += 9 + Math.floor(R() * 12)) crown(c, x, Math.round(yf(x)) + 1, 3, hz_(T.hedge, fog, z + .05).slice(0, 3), R);
    const mx = L.cx - 8, my = Math.round(yf(mx)) + 6; for (let j = 0; j < 14; j++) { const w = 4 - Math.floor(j / 6); rect(c, mx - w, my - j, w * 2, 1, haze(j % 3 ? T.plaster[2] : T.plaster[1], fog, z)); } for (let k = 0; k < 4; k++) { const a = .4 + k * 1.57; for (let r = 1; r < 10; r++) px(c, mx + Math.cos(a) * r, my - 13 + Math.sin(a) * r, haze(T.wood[1], fog, z)); } for (let j = 0; j < 4; j++) rect(c, mx - 4 + j, my - 17 + j, 8 - j * 2, 1, haze(T.thatch[1], fog, z));
    hazeBottom(c, g.x0, g.x1, L.hz - 6, L.hz + 34, fog, 0, .8);
  }
  const wallK = (T, z, dark) => hz_(T.hedge, T.fog, z).map(col => dark ? mix(col, '#02140e', dark) : col);
  const vines = T => (c, x, y, R) => { const len = 5 + Math.floor(R() * 20); for (let j = 0; j < len; j++) px(c, x + Math.round(Math.sin(j / 4 + x) * 1.2), y + j, j % 5 === 4 ? T.hedge[3] : T.hedge[1]); if (R() < .6) { disk(c, x, y + len, 1, '#ffe8a0'); px(c, x, y + len - 1, '#ffffff'); } };

  /* the goal cottage, 8 stages: plot, footing, frame, walls, roof frame, thatch, windows and door, flowers and sign */
  function cottage(c, x, base, st, T) {
    const W2 = 38, wl = T.plaster, th = T.thatch, wd = T.wood, lit = T.mood !== 'day';
    NK.shadow(c, x + W2 / 2, base, W2 / 2 + 4, .3);
    if (st === 0) { for (const sx of [x + 2, x + W2 - 2]) { rect(c, sx, base - 9, 1, 9, wd[1]); px(c, sx, base - 10, th[3]); } rect(c, x + 2, base - 8, W2 - 3, 1, wd[2]); for (let i = 0; i < W2; i += 3) px(c, x + i, base - 1 - (i % 6 ? 0 : 1), T.soil[3]); rect(c, x + 13, base - 15, 1, 15, wd[1]); rect(c, x + 11, base - 16, 7, 4, wl[2]); rect(c, x + 11, base - 16, 7, 1, wl[3]); px(c, x + 13, base - 14, T.soil[1]); return; }
    for (let i = 0; i < W2 + 2; i += 5) { rect(c, x - 1 + i, base - 4, 5, 4, i % 10 ? T.stone[1] : T.stone[2]); px(c, x - 1 + i, base - 4, T.stone[3]); rect(c, x - 1 + i, base - 1, 5, 1, T.stone[0]); }
    if (st <= 3) { for (let k = 0; k < 3; k++) { rect(c, x + W2 + 3 - (k % 2), base - 2 - k * 2, 9, 2, k % 2 ? wd[1] : wd[2]); px(c, x + W2 + 3 - (k % 2), base - 2 - k * 2, wd[3]); px(c, x + W2 + 11 - (k % 2), base - 2 - k * 2, wd[0]); } }
    if (st === 1) return;
    const top = base - 4 - 17; for (const p of [0, 11, 22, 33]) { rect(c, x + p, top, 2, 17, wd[1]); rect(c, x + p, top, 1, 17, wd[2]); } rect(c, x, top, W2, 2, wd[0]);
    if (st >= 3) { const hh = st === 3 ? 7 : 16; for (let j = 0; j < hh; j++) for (let i = 2; i < W2 - 1; i++) { if ([11, 12, 22, 23, 33, 34].includes(i)) continue; px(c, x + i, base - 5 - j, (i * 3 + j * 5) % 13 === 0 ? wl[0] : (j * 7 + i) % 17 === 0 ? wl[2] : wl[1]); } for (let j = 0; j < hh; j++) px(c, x + 2, base - 5 - j, wl[3]); for (let j = 0; j < hh; j++) px(c, x + W2 - 2, base - 5 - j, wl[0]); }
    if (st < 4) return;
    if (st === 4) { for (let k = 0; k < 7; k++) { rect(c, x - 3 + k * 3, top - k, 2, 1, wd[1]); rect(c, x + W2 + 1 - k * 3, top - k, 2, 1, wd[1]); } rect(c, x + W2 / 2 - 1, top - 9, 2, 9, wd[1]); return; }
    const rH = 15; for (let j = 0; j < rH; j++) { const w = Math.round((W2 / 2 + 7) * (1 - j / (rH + 3))); rect(c, x + W2 / 2 - w, top - j, w * 2, 1, j % 3 === 0 ? th[0] : j % 3 === 1 ? th[1] : th[2]); px(c, x + W2 / 2 - w, top - j, th[3]); px(c, x + W2 / 2 + w - 1, top - j, th[0]); for (let i = -w + 2; i < w - 2; i += 3) if ((i * 7 + j * 3) % 8 === 0) px(c, x + W2 / 2 + i, top - j, th[0]); }
    rect(c, x + W2 - 9, top - 14, 5, 12, T.stone[1]); rect(c, x + W2 - 10, top - 15, 7, 2, T.stone[0]); rect(c, x + W2 - 9, top - 14, 1, 12, T.stone[2]);
    if (st === 5) return;
    for (const wx of [4, 25]) { NK.window(c, x + wx, base - 15, 8, 8, lit, [T.wood[0], '#9ad0e8', T.wood[1], '#ffd88a']); rect(c, x + wx - 1, base - 7, 10, 2, wd[1]); for (let k = 0; k < 4; k++) px(c, x + wx + k * 2, base - 8, ['#ff7aa8', '#ffe27a', '#ffffff', '#b88aff'][k]); }
    rect(c, x + 15, base - 15, 8, 11, '#3a7a42'); rect(c, x + 15, base - 15, 8, 1, '#6ab05a'); rect(c, x + 15, base - 15, 1, 11, wd[0]); rect(c, x + 22, base - 15, 1, 11, wd[0]); disk(c, x + 21, base - 9, 1, th[2]);
    if (st === 6) return;
    for (let i = 0; i < 7; i++) { const fx = x + 1 + i * 6; px(c, fx, base - 5, T.hedge[2]); px(c, fx, base - 6, ['#ff7aa8', '#ffe27a', '#ffffff', '#b88aff'][i & 3]); px(c, fx + 1, base - 5, T.hedge[3]); }
    rect(c, x + W2 + 4, base - 12, 1, 12, wd[1]); rect(c, x + W2 + 1, base - 16, 7, 5, th[2]); rect(c, x + W2 + 1, base - 16, 7, 1, th[3]); rect(c, x + W2 + 1, base - 12, 7, 1, th[0]);
  }
  function heartTree(c, x, base, T, h) {
    const R = rnd(77), K = T.bark;
    NK.shadow(c, x, base, 26, .3);
    NK.trunk(c, x, base, h, 8, K, R, { flare: .5, sway: 2 });
    for (const [dx, y0, len, dir] of [[-6, h * .6, 16, -1], [6, h * .66, 18, 1], [-3, h * .8, 12, -1]]) for (let j = 0; j < len; j++) rect(c, x + dx + dir * j, base - y0 - Math.round(j * .55), 3, 2, K[j % 3 ? 1 : 2]);
    const hy = base - 11;
    for (let j = -7; j <= 7; j++) { const w = j < -3 ? Math.round(2 + (j + 7) * .5) : 4; rect(c, x - w - 1, hy + j, w * 2 + 2, 1, '#0e2a1a'); }
    for (let j = -6; j <= 7; j++) { const w = j < -3 ? Math.round(1 + (j + 7) * .5) : 3; rect(c, x - w, hy + j, w * 2, 1, mix('#fff2b8', '#ffa850', Math.max(0, (j + 6) / 14))); }
    rect(c, x - 1, hy - 3, 1, 3, '#ffffff'); rect(c, x - 4, hy + 8, 9, 1, T.stone[1]); rect(c, x - 4, hy + 8, 9, 1, T.stone[1]); px(c, x - 4, hy + 8, T.stone[3]);
    const ty = base - h;
    const s = h / 69;
    for (const [dx, dy, r] of [[-34, 16, 17], [-18, 2, 21], [2, -6, 24], [24, 0, 22], [38, 14, 17], [-4, 20, 20], [18, 22, 16], [-26, 28, 12], [30, 30, 12]]) NK.leaves(c, Math.round(x + dx * s), Math.round(ty + dy * s), Math.round(r * s), T.hedge, R);
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, rr = 10 + R() * 28; px(c, x + Math.cos(a) * rr * 1.4 * s, ty + 4 + Math.sin(a) * rr * .8 * s, T.hedge[3]); }
  }
  function stage(c, g, T, L, st) {
    const R = rnd(11), sw = L.sw, H = g.H, x0 = g.x0, x1 = g.x1, cx = L.cx;
    for (let y = sw - 3; y < g.y1; y++) {
      const hw = L.cw * .5 + 14 + (y - sw) * 1.25, u_ = Math.min(1, Math.max(0, (y - sw) / (H - sw + 6)));
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { const nn = hsh(x >> 2, y >> 1, 3), lx = Math.sin(x / 23 + y / 9) * .12, k = u_ * .75 + lx + (nn - .5) * .22; c.fillStyle = k < .16 ? T.grass[3] : k < .42 ? T.grass[2] : k < .7 ? T.grass[1] : T.grass[0]; c.fillRect(x, y, 1, 1); }
    }
    for (let y = sw + 3; y < g.y1; y += 4) NK.tufts(c, cx - L.cw * .6 - (y - sw), cx + L.cw * .6 + (y - sw), y, [T.grass[0], T.grass[2], T.grass[3]], R, .025 + (y - sw) * .0012, 2 + Math.floor((y - sw) / 14));
    for (let i = 0; i < 26; i++) { const fx = L.x0 + Math.floor(R() * (L.x1 - L.x0)), fy = sw + 5 + Math.floor(R() * (H - sw - 5)); px(c, fx, fy, ['#ffffff', '#ffe27a', '#ff9ac0', '#b8a0ff'][i & 3]); }
    for (let y = sw + 1; y < g.y1; y++) { const t = (y - sw) / (H - sw), pw = 4 + t * 10, pcx = NK.u(L, .36 + Math.sin(t * 2.2) * .06); for (let x = Math.round(pcx - pw); x < pcx + pw; x++) { const e = Math.abs(x - pcx) / pw; c.fillStyle = e > .85 ? T.soil[2] : hsh(x, y, 8) < .25 ? T.soil[3] : T.soil[2]; c.fillRect(x, y, 1, 1); } }
    const by = sw + Math.round((H - sw) * .5), bh = 6;
    for (let y = by; y < by + bh; y++) for (let x = x0; x < x1; x++) { const k = (y - by) / bh, w = hsh(x >> 2, y, 4); c.fillStyle = k < .2 ? T.water[3] : w < .15 ? T.water[3] : k < .6 ? T.water[2] : T.water[1]; c.fillRect(x, y, 1, 1); if (hsh(x, y, 5) < .05) { c.fillStyle = '#ffffff'; c.fillRect(x, y, 2, 1); } }
    for (let x = x0; x < x1; x++) { c.fillStyle = T.grass[3]; c.fillRect(x, by - 1, 1, 1); c.fillStyle = T.soil[1]; c.fillRect(x, by + bh, 1, 1); }
    for (let i = 0; i < 9; i++) { const sx = L.x0 - 10 + Math.floor(R() * (L.x1 - L.x0 + 20)); NK.rock(c, sx, by + bh + 1, 2 + Math.floor(R() * 2), T.stone, R); }
    const bx = NK.u(L, .36); for (let i = 0; i < 6; i++) { rect(c, bx - 10 + i * 4, by - 2, 4, bh + 3, i % 2 ? T.wood[1] : T.wood[2]); rect(c, bx - 10 + i * 4, by - 2, 4, 1, T.wood[3]); rect(c, bx - 10 + i * 4 + 3, by - 2, 1, bh + 3, T.wood[0]); }
    const gx0 = L.garden.x0, gx1 = L.garden.x1; for (let r = 0; r < 4; r++) { const yy = sw + 6 + r * 4; for (let x = gx0; x < gx1; x++) { c.fillStyle = (x + r) % 3 ? T.soil[1] : T.soil[2]; c.fillRect(x, yy, 1, 3); c.fillStyle = T.soil[0]; c.fillRect(x, yy + 3, 1, 1); } }
    for (let x = gx0 - 2; x <= gx1 + 2; x += 4) { rect(c, x, sw - 3, 2, 9, T.wood[1]); rect(c, x, sw - 3, 1, 9, T.wood[2]); px(c, x, sw - 4, T.wood[3]); } rect(c, gx0 - 2, sw - 1, gx1 - gx0 + 6, 1, T.wood[2]); rect(c, gx0 - 2, sw + 2, gx1 - gx0 + 6, 1, T.wood[1]);
    heartTree(c, L.tree.x, sw + 2, T, L.tree.h);
    cottage(c, L.house.x, sw + 1, st, T);
    const sx = L.store.x, sb = sw + 2; NK.shadow(c, sx + 8, sb, 11, .3); rect(c, sx, sb - 10, 16, 10, T.wood[1]); for (let i = 0; i < 16; i += 3) rect(c, sx + i, sb - 10, 1, 10, T.wood[0]); rect(c, sx, sb - 10, 16, 1, T.wood[2]);
    for (let j = 0; j < 7; j++) rect(c, sx - 2 + Math.floor(j * .5), sb - 17 + j, 20 - j, 1, j % 2 ? T.thatch[1] : T.thatch[2]); rect(c, sx + 5, sb - 8, 6, 8, T.wood[0]); rect(c, sx + 6, sb - 7, 4, 7, '#2a1a10'); NK.window(c, sx + 12, sb - 8, 3, 3, T.mood !== 'day', [T.wood[0], '#9ad0e8', T.wood[1], '#ffd88a']);
    for (const side of [-1, 1]) for (let i = 0; i < 26; i++) { const ex = side < 0 ? L.x0 - 16 : L.x1 + 16, xx = ex + side * (i * 3.6 + (R() - .5) * 3), r = 7 + Math.floor(R() * 7), yy = sw + 10 - Math.round(i * 1.3) + Math.floor(R() * 8); NK.leaves(c, Math.round(xx), yy, r, T.hedge, R); }
  }

  const PL = {
    carrot: (c, n, f, T) => { const e = n.en || 0, sw = ECO.sway(n.x, f, .4) * .4; for (let k = -3; k <= 3; k++) { const h = 3 + (k & 1) + Math.round(e * 2); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(sw * j / h), n.y - j, j > 1 ? T.grass[2] : T.grass[1]); px(c, n.x + k * 2, n.y + 1, e > .3 ? '#ff8a2a' : '#d06a1a'); } },
    cabbage: (c, n, f, T) => { const e = n.en || 0; for (const dx of [-8, 0, 8]) { const r = 3 + (e > .3 ? 1 : 0); ell(c, n.x + dx, n.y - r + 1, r + 1, r, T.hedge[1]); ell(c, n.x + dx - 1, n.y - r, r, r - 1, T.hedge[2]); px(c, n.x + dx - 2, n.y - r - 1, T.hedge[3]); rect(c, n.x + dx - 1, n.y - r, 1, r, T.hedge[3]); } },
    bean: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) * .3, e = n.en || 0; for (const dx of [-7, 0, 7]) { rect(c, n.x + dx, n.y - 14, 1, 14, T.wood[2]); for (let j = 0; j < 12; j++) { const xx = n.x + dx + Math.round(Math.sin(j / 2) * 1.5 + sw * j / 12); px(c, xx, n.y - 1 - j, T.hedge[2]); if (j % 4 === 2) px(c, xx + 1, n.y - 1 - j, T.hedge[3]); if (j % 5 === 3) px(c, xx - 1, n.y - 1 - j, e > .3 ? '#ff7a5a' : '#c85a4a'); } } },
    corn: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick, e = n.en || 0; for (const [dx, h] of [[-6, 16], [0, 20], [6, 15]]) { for (let j = 0; j < h; j++) { px(c, n.x + dx + Math.round(sw * j / h * .6), n.y - j, T.grass[1]); if (j % 5 === 3) { px(c, n.x + dx + 1 + Math.round(sw * j / h * .6), n.y - j, T.grass[2]); px(c, n.x + dx - 1, n.y - j, T.grass[2]); } } rect(c, n.x + dx - 1 + Math.round(sw * .6), n.y - h * .6, 2, 4, e > .3 ? '#ffe45a' : '#d8b83a'); } },
    daisy: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 5 + (k & 1) * 3 + Math.round(e * 3), tx = n.x + k * 3 + Math.round(sw); for (let j = 0; j < h; j++) px(c, n.x + k * 3 + Math.round(sw * j / h), n.y - j, T.grass[1]); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(c, tx + dx, n.y - h + dy, '#ffffff'); px(c, tx, n.y - h, '#ffc82a'); } },
    sun: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick, e = n.en || 0, h = 20 + Math.round(e * 4); for (let j = 0; j < h; j++) { rect(c, n.x + Math.round(sw * j / h), n.y - j, 2, 1, T.grass[1]); if (j % 6 === 3) rect(c, n.x - 4 + Math.round(sw * j / h), n.y - j, 4, 1, T.grass[2]); } const hx = n.x + Math.round(sw), hy = n.y - h; for (let a = 0; a < 12; a++) { const an = a / 12 * 6.28; rect(c, hx + Math.cos(an) * 5, hy + Math.sin(an) * 5, 2, 2, a % 2 ? '#ffd23a' : '#ffc01a'); } disk(c, hx, hy, 3, '#6a3a1a'); px(c, hx - 1, hy - 1, '#8a5a2a'); },
    lav: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -3; k <= 3; k++) { const h = 9 + (k & 1) * 3 + Math.round(e * 3); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(sw * j / h), n.y - j, j > h - 5 ? (j % 2 ? '#a890f0' : '#7a5ad0') : T.grass[1]); } },
    holly: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .6) + n.kick, e = n.en || 0, h = 24 + Math.round(e * 4); for (let j = 0; j < h; j++) { rect(c, n.x + Math.round(sw * j / h), n.y - j, 2, 1, T.grass[1]); if (j > 6 && j % 4 === 0) { const col = ['#ff7aa8', '#ffc4dc', '#f0508a'][(j >> 2) % 3], xx = n.x + Math.round(sw * j / h) + ((j >> 2) % 2 ? 2 : -3); disk(c, xx, n.y - j, 2, col); px(c, xx, n.y - j, '#ffe27a'); } } },
    pumpkin: (c, n, f, T) => { const e = n.en || 0, s = 1 + e * .3; for (const [dx, dy, r] of [[-4, 0, 3], [4, 1, 4]]) { ell(c, n.x + dx, n.y - r + dy, Math.round(r * s), Math.round(r * s) + 1, '#c8581a'); ell(c, n.x + dx - 1, n.y - r + dy - 1, Math.round(r * s), Math.max(1, Math.round(r * .75 * s)), '#f08a2a'); for (let k = -1; k <= 1; k++) rect(c, n.x + dx + k * 3, n.y - r * 2 + dy + 1, 1, r * 2 - 2, '#c8581a'); rect(c, n.x + dx, n.y - r * 2 + dy - 1, 2, 2, T.grass[0]); } },
    apple: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .3), e = n.en || 0; rect(c, n.x - 1, n.y - 14, 3, 14, T.bark[1]); rect(c, n.x - 1, n.y - 14, 1, 14, T.bark[2]); const R = rnd(n.seed + 3); for (const [dx, dy, r] of [[-6, -17, 6], [6, -17, 6], [0, -23, 7]]) NK.leaves(c, n.x + dx + Math.round(sw), n.y + dy, r, T.hedge, R); for (let i = 0; i < 6; i++) { const fx = n.x - 10 + Math.floor(R() * 20), fy = n.y - 27 + Math.floor(R() * 14); rect(c, fx, fy, 2, 2, e > .3 ? '#ff5a3a' : '#d8402a'); px(c, fx, fy, '#ffa890'); } },
    berry: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick, e = n.en || 0; NK.leaves(c, n.x, n.y - 5, 6, T.hedge, rnd(n.seed)); for (let i = 0; i < 6; i++) { const bx = n.x - 5 + (i * 7 % 11) + Math.round(sw), by = n.y - 8 + (i * 3 % 7); px(c, bx, by, e > .3 ? '#ff4a8a' : '#a83a8a'); px(c, bx + 1, by, e > .3 ? '#ff9ac0' : '#c85aaa'); } },
    tulip: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 8 + (k & 1) * 3 + Math.round(e * 3), tx = n.x + k * 3 + Math.round(sw), col = ['#ff5a4a', '#ffc01a', '#ff8ac0', '#ffffff', '#a86af0'][(k + 2 + n.seed) % 5]; for (let j = 0; j < h; j++) px(c, n.x + k * 3 + Math.round(sw * j / h), n.y - j, T.grass[1]); rect(c, tx - 1, n.y - h - 3, 3, 3, col); px(c, tx - 1, n.y - h - 4, col); px(c, tx + 1, n.y - h - 4, col); px(c, tx, n.y - h - 3, '#ffffff'); } },
  };
  const PLN = { carrot: 'Carrots', cabbage: 'Cabbages', bean: 'Bean poles', corn: 'Corn', daisy: 'Daisies', sun: 'Sunflower', lav: 'Lavender', holly: 'Hollyhock', pumpkin: 'Pumpkins', apple: 'Apple tree', berry: 'Berry bush', tulip: 'Tulips' };
  const PLS = { carrot: ['rustle'], cabbage: ['rustle'], bean: ['rustle'], corn: ['rustle'], daisy: ['chime', 5], sun: ['chime', 2], lav: ['chime', 7], holly: ['chime', 4], pumpkin: ['knock'], apple: ['rustle'], berry: ['rustle'], tulip: ['chime', 3] };

  /* a Greenling person: shade of green = rank, cloth colour = trade */
  function person(c, n, f, T) {
    const x = Math.round(n.x), y = Math.round(n.y), d = n.dir, K = T.green, rk = Math.min(4, n.rank || 2), cl = T.cloth[n.cloth || 0], bend = n.pose === 'tend' ? 3 : 0, wk = n.mvk ? (f & 1) : 0, sit = n.pose === 'sit', OL = '#082a1c';
    NK.shadow(c, x, y, 5, .32);
    const by = y - (sit ? 9 : 9) + bend, hx = x + (bend ? d * 2 : 0), hy = by - 4;
    /* outline first, so a green person never melts into a green meadow */
    disk(c, hx, hy, 4, OL); rect(c, x - 4, by - 1, 8, 8, OL);
    if (!sit) { rect(c, x - 3 + wk, y - 3, 3, 4, OL); rect(c, x + wk * 0 - 0, y - 3, 3, 4, OL); }
    for (let k = 0; k < 3; k++) px(c, hx - 5 + k * 0, hy - 1 + k, OL);
    /* legs and boots */
    if (sit) rect(c, x - 3, by + 6, 7, 2, cl[0]); else { rect(c, x - 2 + wk, y - 3, 2, 3, K[1]); rect(c, x + 1 - wk, y - 3, 2, 3, K[1]); rect(c, x - 2 + wk, y - 1, 2, 1, '#3a2418'); rect(c, x + 1 - wk, y - 1, 2, 1, '#3a2418'); }
    /* tunic with a belt */
    rect(c, x - 3, by, 6, 6, cl[1]); rect(c, x - 3, by, 6, 1, cl[2]); rect(c, x - 3, by + 3, 6, 1, cl[0]); rect(c, x + 2, by, 1, 6, cl[0]); px(c, x - 1, by + 1, cl[2]); px(c, x, by + 3, '#f0d070');
    /* head, leaf tuft, leaf ears, face */
    disk(c, hx, hy, 3, K[rk + 1]); px(c, hx - 1, hy - 2, K[5]); px(c, hx - 2, hy - 1, K[5]); disk(c, hx - d, hy + 2, 1, K[Math.max(0, rk - 1)]);
    for (let k = 0; k < 4; k++) { px(c, hx + (k % 2 ? d : -d), hy - 4 - k, OL); px(c, hx + (k % 2 ? d : -d) * (k > 1 ? 0 : 1), hy - 4 - k + 1, K[Math.min(5, rk + 2)]); }
    px(c, hx - 4, hy - 1, K[rk]); px(c, hx + 4, hy - 1, K[rk]); px(c, hx - 5, hy - 2, OL); px(c, hx + 5, hy - 2, OL);
    px(c, hx + d, hy, '#ffffff'); px(c, hx + d * 2, hy, '#0a2a10'); px(c, hx - d, hy, '#ffffff'); if (n.elder) { for (let k = 0; k < 4; k++) px(c, hx + (k & 1 ? 1 : -1), hy + 2 + (k >> 1), '#f4fff0'); px(c, hx, hy + 3, '#f4fff0'); }
    const hand = n.pose === 'tend' ? [d * 3, 4] : n.pose === 'give' ? [d * 4, 1] : n.pose === 'talk' ? [d * 3, -1 + (f % 4 < 2 ? 1 : 0)] : [d * 3, 2 + wk];
    rect(c, x + hand[0] - (d < 0 ? 1 : 0), by + hand[1], 2, 2, OL); px(c, x + hand[0], by + hand[1], K[Math.min(5, rk + 2)]);
    const cr = n.carry; if (cr) { const cx_ = x + d * 4, cy_ = by + 4; if (cr === 'basket') { rect(c, cx_ - 3, cy_ - 1, 7, 5, OL); rect(c, cx_ - 2, cy_, 5, 3, T.wood[2]); rect(c, cx_ - 2, cy_, 5, 1, T.wood[3]); px(c, cx_ - 1, cy_ - 1, '#ff8a2a'); px(c, cx_ + 1, cy_ - 1, '#9ad85a'); px(c, cx_, cy_ - 2, '#ff8a2a'); } else if (cr === 'bucket') { rect(c, cx_ - 2, cy_ - 1, 6, 6, OL); rect(c, cx_ - 1, cy_, 4, 4, T.stone[1]); rect(c, cx_ - 1, cy_, 4, 1, T.water[3]); } else if (cr === 'apple') { disk(c, cx_, cy_ + 1, 3, OL); disk(c, cx_, cy_ + 1, 2, '#e8402a'); px(c, cx_ - 1, cy_, '#ffa890'); } }
  }

  function buildAll(g) {
    const H = g.H, T = g.T, L = g.L, R = rnd(61), sw = L.sw;
    const S = (id, o) => ECO.add(Object.assign({ id, kind: 'creature', hw: 7, hh: 7 }, o));
    ECO.begin(g, { pulse: '#d8ffa0', wave: '#c8ff8a', link() {}, bubble: { bg: '#f6ffe8', edge: '#1c4a2a', ink: ['#2a9a4a', '#e0702a', '#d04a8a', '#3a8ad8'] } });
    const tr = L.tree;
    const sp = ECO.add({ id: 'spirit', kind: 'spirit', name: 'The Heart Tree', x: tr.x, y: sw + 2, hw: 30, hh: tr.h * .55, snd: 'hum', sndK: 1, magic: true, say: ['heart', 'leaf', 'sun', 'drop'], z: sw - 4, lift: -2, noReflect: true, draw(c, n, f) { if (n.fl > .1) for (let i = 0; i < 6; i++) { const a = f / 5 + i * 1.05; px(c, tr.x + Math.cos(a) * (20 + i * 3), sw - tr.h + 10 + Math.sin(a * 1.3) * 12, '#e8ffb0'); } }, glow: { col: '#d8ff9a', r: 54, a: T.mood === 'night' ? .4 : .13, dy: 18 } });
    const house = ECO.add({ id: 'house', kind: 'house', name: 'Your cottage', x: L.house.x + 19, y: sw, hw: 24, hh: 17, z: sw - 1, snd: 'knock', draw() {}, lift: -2, glow: () => (g.tk.stage() >= 6 ? { col: '#ffd890', r: 34, a: T.lit ? .6 : .12, dy: 12 } : null) });
    const store = ECO.add({ id: 'store', kind: 'home', name: 'The store', x: L.store.x + 8, y: sw + 2, hw: 10, hh: 8, z: sw - 1, snd: 'knock', draw() {}, lift: -2, glow: n => (n.lit ? { col: '#ffd890', r: 18, a: .5, dy: 5 } : null) });
    const nests = [[-26, .8], [-4, .62], [22, .7]].map(([dx, hf], i) => ECO.add({ id: 'nest' + i, kind: 'home', name: 'Greenling nest', x: tr.x + dx, y: sw - tr.h * hf + 14, hw: 8, hh: 8, z: sw - 2, snd: 'chime', sndK: 5 + i, lit: 0,
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), sw2 = Math.round(Math.sin(f / 14 + i) * .6); for (let j = 0; j < 6; j++) px(c, x + sw2, y - 14 + j, T.bark[1]); for (let j = -6; j <= 6; j++) { const w = Math.round(6 * Math.sqrt(1 - Math.pow(j / 7, 2))); rect(c, x - w + sw2, y + j - 6, w * 2, 1, j < -2 ? T.hedge[2] : j < 3 ? T.hedge[1] : T.hedge[0]); } for (let k = 0; k < 5; k++) px(c, x - 4 + k * 2 + sw2, y - 4 + (k % 2) * 4, T.hedge[3]); const lit = n.lit || T.lit > .4; rect(c, x - 2 + sw2, y - 3, 4, 4, lit ? '#ffe2a0' : T.hedge[0]); px(c, x - 1 + sw2, y - 3, lit ? '#ffffff' : T.hedge[1]); },
      glow: n => ((n.lit || T.lit > .4) ? { col: '#ffe2a0', r: 12, a: .5, dy: 8 } : null) }));
    const plants = [], P = (kind, x, o) => { if (L.wide && x > L.house.x - 2 && x < L.house.x + 44) return null; const seed = Math.floor(R() * 9), nd = ECO.add(Object.assign({ id: kind + plants.length, kind: 'plant', pk: kind, name: PLN[kind], x, y: sw + 2, hw: kind === 'apple' ? 12 : 8, hh: kind === 'apple' ? 14 : 8, snd: PLS[kind][0], sndK: PLS[kind][1], seed, z: sw + (seed % 3), en: 0, lift: -2, draw: (c, n, f) => PL[kind](c, n, f, T), step(n) { n.en = Math.max(0, (n.en || 0) - .012); } }, o || {})); plants.push(nd); return nd; };
    const gx = L.garden.x0, gw = L.garden.x1 - L.garden.x0;
    const crops = [P('carrot', gx + 8, { y: sw + 10, z: sw + 10 }), P('cabbage', gx + gw * .5 + 2, { y: sw + 10, z: sw + 10 }), P('bean', gx + gw - 8, { y: sw + 10, z: sw + 10 }), P('carrot', gx + 10, { y: sw + 18, z: sw + 18 }), P('corn', gx + gw * .5, { y: sw + 18, z: sw + 18 }), P('cabbage', gx + gw - 10, { y: sw + 18, z: sw + 18 })];
    const r = k => sw + k;
    P('sun', NK.u(L, .05), { y: r(24) }); P('holly', NK.u(L, .2), { y: r(6) }); P('apple', NK.u(L, .31), { y: r(9), name: 'Apple tree' }); P('lav', NK.u(L, .44), { y: r(5) }); P('lav', NK.u(L, .2), { y: r(26) }); P('tulip', NK.u(L, .12), { y: r(14) }); P('tulip', NK.u(L, .8), { y: r(26) });
    P('daisy', NK.u(L, .27), { y: r(23) }); P('daisy', NK.u(L, .6), { y: r(27) }); P('berry', NK.u(L, .8), { y: r(15) }); P('berry', NK.u(L, .02), { y: r(8) }); P('pumpkin', NK.u(L, .47), { y: r(22) }); P('daisy', NK.u(L, .93), { y: r(20) });
    const brook = { x: NK.u(L, .5), y: sw + Math.round((H - sw) * .5) - 1 };
    const F = (id, name, rank, cloth, tasks, o) => NK.folk(S, L, Object.assign({ id, name, rank, cloth, tasks, draw: (c, n, f) => person(c, n, f, T), say: ['leaf', 'sun', 'drop', 'heart', 'note'], snd: 'chirp', sndK: rank, hw: 5, hh: 11, glow: null }, o || {}));
    F('farmer', 'Greenling gardener', 3, 0, [{ to: crops[0], act: 'tend', t: 8, say: 'leaf' }, { to: crops[1], act: 'tend', t: 8 }, { to: crops[3], act: 'carry', take: 'basket', t: 4 }, { to: store, act: 'give', t: 5 }, { to: store, act: 'enter', t: 14 }, { to: () => NK.u(L, .45), act: 'talk', t: 8, say: 'sun' }], { x: NK.u(L, .55) });
    F('waterer', 'Greenling waterer', 2, 1, [{ to: brook, act: 'carry', take: 'bucket', t: 5 }, { to: crops[2], act: 'tend', t: 8, say: 'drop' }, { to: brook, act: 'carry', take: 'bucket', t: 5 }, { to: crops[4], act: 'tend', t: 8 }, { to: brook, act: 'carry', take: 'bucket', t: 5 }, { to: crops[5], act: 'tend', t: 8, say: 'drop' }], { x: brook.x });
    F('picker', 'Greenling picker', 4, 2, [{ to: () => plants.find(p => p.pk === 'apple') || store, act: 'carry', take: 'apple', t: 6, say: 'heart' }, { to: store, act: 'give', t: 5 }, { to: () => plants.find(p => p.pk === 'berry') || store, act: 'tend', t: 8 }, { to: nests[1], act: 'look', t: 8 }, { to: house, act: 'enter', t: 18 }], { x: NK.u(L, .6) });
    F('elder', 'Old Greenling', 5, 3, [{ to: () => tr.x - 14, act: 'sit', t: 40 }, { to: () => tr.x - 14, act: 'talk', t: 10, say: 'leaf', reply: 'heart' }, { to: sp, act: 'tend', t: 12, say: 'heart' }], { elder: true, x: tr.x - 14, lane: 1 });
    /* the Tree's own light: sprites that wake a plant or feed an animal, no lines, just flying */
    const say = ['leaf', 'drop', 'sun', 'heart', 'star'], rnd_ = a => a[Math.floor(Math.random() * a.length)], hx = tr.x - 1, hy = sw - 14;
    for (let i = 0; i < (L.wide ? 4 : 2); i++) S('sprite' + i, { name: 'Light sprite', x: hx, y: hy, hw: 5, hh: 7, magic: true, say, snd: 'chime', sndK: i * 2 + 1, z: sw + 8, ph: 'idle', tm: 6 + i * 13, noReflect: true, tgt: null,
      step(n, f) {
        n.tm--; if (n.ph === 'idle') { n.x = hx + Math.sin(f / 13 + i * 1.3) * 10; n.y = hy + Math.sin(f / 7 + i) * 4; if (n.tm <= 0) { const pool = plants.concat(ECO.kind('creature').filter(c2 => !/^sprite/.test(c2.id) && !c2.folk && !c2.hidden)); n.tgt = pool[Math.floor(Math.random() * pool.length)]; n.ph = 'fly'; n.tm = 18; n.fx = n.x; n.fy = n.y; } }
        else if (n.ph === 'fly') { const u = 1 - n.tm / 18, t = n.tgt; n.x = n.fx + (t.x - n.fx) * u + Math.sin(u * 9) * 2; n.y = n.fy + ((t.y - (t.hh || 6)) - n.fy) * u - Math.sin(u * Math.PI) * 10; if (n.tm <= 0) { t.en = 1; t.fl = 1; t.kick = 1; ECO.spark(t.x, t.y - (t.hh || 6), 9, '#d8ffa0', .7, .5); if (t.kind === 'creature') ECO.say(t, rnd_(say), false); n.ph = 'back'; n.tm = 20; n.fx = n.x; n.fy = n.y; } }
        else if (n.ph === 'back') { const u = 1 - n.tm / 20; n.x = n.fx + (hx - n.fx) * u; n.y = n.fy + (hy - n.fy) * u - Math.sin(u * Math.PI) * 8; if (n.tm <= 0) { n.ph = 'idle'; n.tm = 30 + Math.floor(Math.random() * 80); sp.fl = .8; } }
      },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), K = T.green, b = Math.round(Math.sin(f / 4 + i)); c.globalAlpha = .4; disk(c, x, y + b, 4, K[4]); c.globalAlpha = 1; disk(c, x, y + b, 2, K[3]); disk(c, x, y + b, 1, K[5]); px(c, x - 3, y + b - 3, K[4]); px(c, x + 3, y + b - 3, K[4]); px(c, x - 1, y + b, '#0a2a10'); px(c, x + 1, y + b, '#0a2a10'); },
      glow: { col: '#d8ffa0', r: 11, a: T.lit * .4 + .2, dy: 4 } });
    if (/[?&]lifetest\b/.test(location.search)) window.__ECO = ECO;
    /* animals */
    const sheep = (id, x, d) => S(id, { name: 'Sheep', x, y: sw + 11, hw: 8, hh: 7, say: ['leaf', 'heart', 'note'], snd: 'snuffle', z: sw + 11, dd: d, x0: x - 16, x1: x + 16, gz: 0,
      step(n, f) { if (n.fl < .3 && f % 6 === 0) { n.gz = (n.gz + 1) % 8; if (n.gz > 4) { n.x += n.dd * 1.2; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } } },
      draw(c, n, f) { const x_ = Math.round(n.x), y_ = Math.round(n.y), d_ = n.dd, head = n.gz < 5; NK.shadow(c, x_, y_, 8, .28); for (const [dx, dy, r] of [[-4, -6, 4], [0, -7, 5], [4, -6, 4], [-1, -9, 3], [2, -9, 3]]) disk(c, x_ + dx, y_ + dy, r, '#fff6e8'); for (const [dx, dy] of [[-3, -4], [3, -4], [-6, -7]]) px(c, x_ + dx, y_ + dy, '#d8ccb8'); rect(c, x_ - 5, y_ - 2, 2, 3, '#3a2a24'); rect(c, x_ + 3, y_ - 2, 2, 3, '#3a2a24'); const hx_ = x_ + 7 * d_, hy_ = y_ - (head ? 3 : 7); rect(c, hx_ - 2, hy_ - 2, 4, 4, '#3a2a24'); px(c, hx_ + d_, hy_ - 1, '#ffffff'); rect(c, hx_ - 3 * d_, hy_ - 3, 2, 2, '#3a2a24'); if (n.fl > .3) { c.globalAlpha = n.fl * .4; disk(c, x_, y_ - 7, 9, T.green[4]); c.globalAlpha = 1; } } });
    sheep('sheep0', NK.u(L, .3), 1); sheep('sheep1', NK.u(L, .48) + 6, -1);
    S('rabbit', { name: 'Rabbit', x: NK.u(L, .08) + 40, y: sw + 3, hw: 6, hh: 8, say: ['leaf', 'heart', 'drop'], snd: 'squeak', z: sw + 3, st: 0, step(n, f) { if (f % 30 === 0 && n.fl < .3) n.st = Math.random() < .55 ? 1 : 0; },
      draw(c, n) { const x_ = Math.round(n.x), y_ = Math.round(n.y); NK.shadow(c, x_, y_, 5, .25); if (!n.st) { rect(c, x_ - 2, y_ - 5, 5, 4, '#8a6a4a'); px(c, x_, y_ - 7, '#6a4a2a'); return; } for (const [dx, dy, w, h, col] of [[-3, -5, 7, 5, '#c8a478'], [2, -8, 4, 4, '#c8a478'], [3, -12, 1, 4, '#c8a478'], [5, -12, 1, 4, '#c8a478'], [-4, -3, 3, 3, '#fff0d8'], [3, -7, 1, 1, '#101018'], [5, -6, 1, 1, '#e89aa6']]) rect(c, x_ + dx, y_ + dy, w, h, col); } });
    S('hedgehog', { name: 'Hedgehog', x: NK.u(L, .62), y: sw + 9, hw: 7, hh: 6, say: ['leaf', 'drop', 'moon'], snd: 'snuffle', z: sw + 9, dd: 1, x0: NK.u(L, .56), x1: NK.u(L, .72), step(n, f) { if (f % 2 === 0 && n.fl < .3) { n.x += n.dd * .5; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n) { const x_ = Math.round(n.x), y_ = Math.round(n.y), d_ = n.dd; NK.shadow(c, x_, y_, 6, .28); for (let j = 0; j < 6; j++) { const w = Math.round(6 * Math.sqrt(1 - Math.pow((j - 5) / 6, 2))); rect(c, x_ - w + (d_ > 0 ? -1 : 1), y_ - j - 1, w * 2, 1, j % 2 ? '#6a4a30' : '#8a6a46'); } for (let i = 0; i < 6; i++) px(c, x_ - 6 + i * 2 - (d_ > 0 ? 1 : -1), y_ - 7 + (i % 2), '#3a2a1c'); rect(c, x_ + 5 * d_ - 1, y_ - 3, 3, 3, '#d8b890'); px(c, x_ + 7 * d_, y_ - 2, '#101018'); } });
    S('bird', { name: 'Songbird', x: L.garden.x1 - 6, y: sw - 8, hw: 5, hh: 6, say: ['note', 'sun', 'heart'], snd: 'chirp', z: sw - 5, noReflect: true,
      draw(c, n, f) { const x_ = Math.round(n.x), y_ = Math.round(n.y), s = f % 14 < 3; for (const [dx, dy, w, h, col] of [[-3, -5, 6, 4, '#4a8ad8'], [-2, -1, 4, 2, '#f4f0e0'], [2, -7, 3, 3, '#4a8ad8'], [5, -6, 2, 1, '#f0a030'], [-6, -3, 4, 1, '#2a5aa8']]) rect(c, x_ + dx, y_ + dy, w, h, col); px(c, x_ + 3, y_ - 6, '#101018'); rect(c, x_ - 1, y_, 1, 2, '#6a4a2a'); rect(c, x_ + 1, y_, 1, 2, '#6a4a2a'); if (s) { px(c, x_ + 6, y_ - 9, '#e0702a'); px(c, x_ + 8, y_ - 11, '#2a9a4a'); } } });
    [0, 1].forEach(i => S('hen' + i, { name: 'Hen', x: store.x + 16 + i * 10, y: sw + 8 + i * 2, hw: 6, hh: 7, say: ['sun', 'note', 'drop'], snd: 'chitter', z: sw + 8 + i * 2, ph: i * 3, draw(c, n, f) { const x_ = Math.round(n.x), y_ = Math.round(n.y), pk = (f + n.ph * 7) % 16 < 4; NK.shadow(c, x_, y_, 5, .25); for (const [dx, dy, w, h, col] of [[-4, -7, 8, 5, i ? '#c8783a' : '#f4ecd8'], [-6, -9, 3, 4, i ? '#a85a2a' : '#e4dcc4'], [3, pk ? -4 : -9, 3, 4, i ? '#c8783a' : '#f4ecd8'], [3, pk ? -5 : -10, 3, 1, '#e83a2a'], [6, pk ? -3 : -8, 2, 1, '#f0a030'], [-1, -1, 1, 2, '#f0a030'], [2, -1, 1, 2, '#f0a030']]) rect(c, x_ + dx, y_ + dy, w, h, col); px(c, x_ + 5, pk ? y_ - 3 : y_ - 8, '#101018'); } }));
    S('butterfly', { name: 'Butterfly', x: L.cx, y: sw - 14, hw: 5, hh: 4, say: ['sun', 'heart'], snd: 'flutter', z: sw - 10, noReflect: true, step(n, f) { n.x = L.cx + Math.sin(f / 31) * L.cw * .4 + Math.sin(f / 5) * 2; n.y = sw - 16 + Math.sin(f / 17) * 8 + Math.sin(f / 4) * 2; }, draw(c, n, f) { const x_ = Math.round(n.x), y_ = Math.round(n.y), w = f % 2 ? 3 : 1; rect(c, x_ - w, y_ - 2, w, 2, '#ff9a3a'); rect(c, x_ + 1, y_ - 2, w, 2, '#ff9a3a'); rect(c, x_ - w, y_, w - 1 || 1, 2, '#e05a2a'); rect(c, x_ + 1, y_, w - 1 || 1, 2, '#e05a2a'); px(c, x_, y_ - 1, '#2a1a10'); px(c, x_, y_, '#2a1a10'); } });
    [0, 1].forEach(i => S('bee' + i, { name: 'Bee', x: L.cx, y: sw - 8, hw: 4, hh: 4, say: ['sun', 'note'], snd: 'buzz', z: sw - 8, noReflect: true, ph: i * 2, step(n, f) { n.x = NK.u(L, .4 + i * .25) + Math.sin(f / 13 + n.ph) * 16; n.y = sw - 9 + Math.sin(f / 9 + n.ph) * 5; }, draw(c, n, f) { const x_ = Math.round(n.x), y_ = Math.round(n.y); rect(c, x_ - 2, y_, 4, 2, '#ffd23a'); rect(c, x_ - 1, y_, 1, 2, '#2a1a10'); rect(c, x_ + 1, y_, 1, 2, '#2a1a10'); rect(c, x_ - 1, y_ - 2 - (f % 2), 2, 1, '#e8f4ff'); } }));
    S('snail', { name: 'Garden snail', x: NK.u(L, .22), y: sw + 14, hw: 5, hh: 5, say: ['leaf', 'drop', 'moon'], snd: 'bloop', z: sw + 14, dd: 1, x0: NK.u(L, .18), x1: NK.u(L, .27), step(n, f) { if (f % 5 === 0 && n.fl < .3) { n.x += n.dd * .5; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } }, draw(c, n) { const x_ = Math.round(n.x), y_ = Math.round(n.y), d_ = n.dd; rect(c, x_ - 4, y_ - 1, 8, 2, '#d8c8a0'); rect(c, x_ + 3 * d_, y_ - 3, 2, 3, '#d8c8a0'); px(c, x_ + 4 * d_, y_ - 4, '#101018'); disk(c, x_ - d_, y_ - 4, 3, '#b87a4a'); disk(c, x_ - d_, y_ - 4, 1, '#e8b080'); } });
  }

  VISTA.reg('shire', {
    stageK: .55, eco: true,
    pal(mood) { return pal(mood); },
    layout(g) {
      const G0 = NK.geom(g), H = g.H;
      g.L = Object.assign(G0, { house: { x: G0.x0 - 4 }, store: { x: 0 }, garden: { x0: 0, x1: 0 }, tree: { x: 0, h: Math.round(H * .4) }, fairies: [] });
      const L = g.L; L.store.x = NK.u(L, .38); L.garden = { x0: NK.u(L, .47), x1: NK.u(L, .47) + (L.wide ? 42 : 28) }; L.tree.x = NK.u(L, L.wide ? .9 : .84);
      if (!L.wide) { L.house.x = L.x0 - 10; L.store.x = NK.u(L, .4); }
      ECO.end(); buildAll(g);
    },
    rays(g) { const out = []; if (g.mood === 'night') return out; for (let i = 0; i < 3; i++) out.push({ x: g.L.cx - 40 + i * 34, w: 7 + i * 2, sk: .3, a: g.T.shaftA, d: i * 2.2, col: g.T.shaft }); return out; },
    weather: { dir: 'up', cols: ['#fff6c8', '#d8ffa0', '#ffffff'], glow: true, depths: [{ n: 8, size: 1, dur: 40, z: 1, seed: 6, op: .85 }, { n: 3, size: 2, dur: 26, z: 3, seed: 3, op: .75, blur: 1.2 }] },
    layers(g) {
      const T = g.T, L = g.L, H = g.H, st = () => g.tk.stage();
      const frameG = (id, k, o, blur) => ({ id, k, blur, paint: (c, g2) => NK.frame(c, g2, Object.assign({ clump: 'leaf', cx: L.cx }, o)) });
      return [
        { id: 'sky', k: .04, paint: (c, g2) => sky(c, g2, T, L) },
        { id: 'far', k: .12, blur: 1, paint: (c, g2) => far(c, g2, T, L) },
        frameG('wallB', .24, { seed: 5, cy: Math.round(H * .44), rx: Math.round(L.cw * .34), ry: Math.round(H * .3), ramp: wallK(T, .5, 0), bite: .14, r: 4, hang: vines(T), hangN: 5 }, .8),
        frameG('wallM', .4, { seed: 9, cy: Math.round(H * .5), rx: Math.round(L.cw * .5), ry: Math.round(H * .4), ramp: wallK(T, .22, 0), bite: .13, r: 5, hang: vines(T), hangN: 8 }),
        { id: 'stage', k: .56, stage: true, live: true, paint: (c, g2) => stage(c, Object.assign({ W: g.W, H: g.H }, g2), T, L, st()), live(c, f, g2) { ECO.draw(c, f, g2); NK.smoke(c, L.house.x + 29, L.sw - 22, f, T.cloud[1]); } },
        frameG('wallN', .95, { seed: 13, cy: Math.round(H * .56), rx: Math.round(L.cw * .78), ry: Math.round(H * .58), ramp: wallK(T, 0, .35), bite: .1, r: 6, tex: 90, hang: vines(T), hangN: 12 }),
        { id: 'fg', k: 1.8, blur: 2.6, op: .92, paint(c, g2) {
          const Rr = rnd(7), W = g.W;
          for (const x of [g2.x0 + 6, W - 8]) for (let i = -5; i <= 5; i++) { const h = Math.round(16 + (i * 7 & 7) * 2); for (let j = 0; j < h; j++) px(c, x + i * 2 + Math.round(i * j * .06), H + 6 - j, j > h - 4 ? T.grass[3] : T.grass[(i + j) & 1 ? 1 : 0]); }
          for (let i = 0; i < 4; i++) { const x = g2.x0 + 6 + Math.floor(Rr() * 24) + (i > 1 ? g2.x1 - g2.x0 - 36 : 0), y = H - 10 - Math.floor(Rr() * 14); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) px(c, x + dx, y + dy, i % 2 ? '#ff9ac0' : '#ffffff'); px(c, x, y, '#ffe27a'); }
        } },
      ];
    },
    lights(f, g) {
      const L = g.L, out = [];
      if (g.mood === 'sunset') out.push({ x: L.cx - 24, y: L.hz - 4, r: 80, col: '#ff9a62', a: .3 }); if (g.mood === 'morning') out.push({ x: L.cx + 30, y: L.hz - 10, r: 80, col: '#ffe2a0', a: .26 }); if (g.mood === 'day') out.push({ x: L.cx - 20, y: 34, r: 90, col: '#fff6d0', a: .22 });
      return out;
    },
  });
})();
