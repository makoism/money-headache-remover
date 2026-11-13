/* ---------- The Dreaming: islands that float, a sea that is a mirror, and a moon that sleeps ----------
   Back to front: a sky of aurora and stars; far islands with waterfalls that fall upward; nearer islands with a clock tower and doors that
   open onto nothing; the stage (a shore of pale grass, the mirror, your house and the garden); star lanterns on strings at the glass.
   The Spirit is the Sleeper, a great moon with a closed eye. Silver threads hang from it to every plant and every home, like a loom. When
   something in the world is touched, a pulse runs down its thread, and now and then the Sleeper opens one eye and looks around. */
(() => {
  const V = window.__VSET, MC = V.moodCol, { mix, rnd, hsh, px, rect, disk, ell, vgrad, hazeBottom, haze, crown, ridge, cloud } = VG;
  const SKY = { morning: ['#7a6ac8', '#c88ac8', '#f8b8b0', '#ffe8c8'], day: ['#4a5ac8', '#7a8ae0', '#b8c8f0', '#f0e8ff'], sunset: ['#2a1a6a', '#8a3a9a', '#e86a8a', '#ffb878'], night: ['#06041a', '#140a3a', '#2a1a62', '#4a2a82'] };
  const FOG = { morning: '#e8b8d0', day: '#c8d0f4', sunset: '#d87aa8', night: '#2a1a5a' };
  const RAMPS = {
    grass: ['#2a8a8a', '#5ad0b0', '#b8ffd8'], rock: ['#4a3a82', '#7a68b8', '#b8a8e8'], sand: ['#8a6aa0', '#c8a8d8', '#f4e0ff'], wood: ['#4a3a6a', '#7a68a0', '#b0a0d8'], water: ['#1a1262', '#3a2a98', '#7a6ae0'],
    pink: ['#c84a8a', '#f880b8', '#ffc8e4'], gold: ['#b88a3a', '#ffd070', '#fff4c0'], teal: ['#1a8a9a', '#5ae0e0', '#c8ffff'], cloud: ['#a8a0e0', '#ece8ff', '#ffffff'], plaster: ['#c8a8d8', '#f0e0ff', '#ffffff'], roof: ['#7a3a9a', '#c860b8', '#ff9ad8'],
  };
  const pal = mood => { const T = { mood }, m = c => MC(c, mood); T.sky = SKY[mood].slice(); T.fog = FOG[mood]; for (const k in RAMPS) T[k] = RAMPS[k].map(m); T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .6 : mood === 'morning' ? .3 : .15; T.moon = ['#c8c0f0', '#f4f0ff', '#ffffff'].map(m); T.shaft = mood === 'sunset' ? '#ffc0d8' : '#fff0ff'; T.shaftA = ({ morning: .16, day: .12, sunset: .2, night: .07 })[mood]; return T; };

  function sky(c, g, T, L) {
    const R = rnd(5), hz = L.hz; vgrad(c, g.x0, g.x1, g.y0, g.y1, T.sky);
    for (let i = 0; i < 160; i++) { const sx = g.x0 + Math.floor(R() * (g.x1 - g.x0)), sy = g.y0 + Math.floor(R() * hz * 1.4), b = R(); px(c, sx, sy, T.mood === 'day' || T.mood === 'morning' ? (b > .9 ? '#ffffff' : T.sky[2]) : b > .85 ? '#ffffff' : b > .5 ? '#c8b8ff' : '#7a68d8'); }
    /* aurora ribbons */
    for (let k = 0; k < 3; k++) for (let x = g.x0; x < g.x1; x++) { const y = Math.round(hz * (.28 + k * .12) + Math.sin(x / (36 + k * 9) + k * 2) * 10 + Math.sin(x / 13 + k) * 3), col = [T.teal[1], T.pink[1], T.grass[1]][k]; c.globalAlpha = (T.mood === 'night' ? .3 : .14) * (.6 + .4 * Math.sin(x / 50 + k)); for (let j = 0; j < 16; j++) { c.globalAlpha = (T.mood === 'night' ? .3 : .14) * (1 - j / 16); c.fillStyle = col; c.fillRect(x, y + j, 1, 1); } } c.globalAlpha = 1;
    const n = Math.round((g.x1 - g.x0) / 110); for (let i = 0; i < n; i++) { const u = R(), y = Math.round(hz * (.7 + u * .5)), w = Math.round(22 + u * 34 + R() * 16), x = g.x0 + Math.round((i + R() * .8) / n * (g.x1 - g.x0)); cloud(c, x, y, w, Math.round(5 + u * 6), T.cloud, R); }
  }
  /* a floating island: grass cap, a hanging body of rock that tapers, roots, and optionally a waterfall that rises */
  function island(c, x, y, w, T, z, R, o) {
    o = o || {}; const fog = T.fog, h_ = q => haze(q, fog, z), dep = Math.round(w * .6);
    for (let j = 0; j < dep; j++) { const u = j / dep, ww = Math.round(w / 2 * (1 - Math.pow(u, .8)) * (1 + Math.sin(j / 3 + x) * .06)); rect(c, x - ww, y + 3 + j, ww * 2, 1, j % 5 === 4 ? h_(T.rock[0]) : h_(T.rock[1])); px(c, x - ww, y + 3 + j, h_(T.rock[2])); rect(c, x + ww - 2, y + 3 + j, 2, 1, h_(T.rock[0])); }
    ell(c, x, y + 2, Math.round(w / 2) + 1, 4, h_(T.grass[1])); ell(c, x, y + 1, Math.round(w / 2), 3, h_(T.grass[2]));
    for (let i = 0; i < 5; i++) { const rx = x - w / 3 + Math.floor(R() * w * .66), len = 4 + Math.floor(R() * (dep * .5)); for (let j = 0; j < len; j++) px(c, rx + Math.round(Math.sin(j / 3 + i)), y + 5 + j, h_(T.grass[0])); }
    if (o.tree !== false) for (let i = 0; i < Math.max(1, Math.round(w / 26)); i++) { const tx = x - w / 3 + Math.floor(R() * w * .66); rect(c, tx, y - 6, 2, 6, h_(T.wood[1])); crown(c, tx + 1, y - 7, 4 + Math.floor(R() * 2), [h_(T.grass[0]), h_(T.pink[1]), h_(T.pink[2])], R); }
    if (o.fall) { for (let j = 0; j < 46; j++) { c.globalAlpha = (1 - j / 46) * (z < .5 ? .6 : .4); px(c, x + Math.round(Math.sin(j / 5) * 2), y - j, h_(T.teal[2])); px(c, x + 1 + Math.round(Math.sin(j / 5) * 2), y - j, h_(T.teal[1])); } c.globalAlpha = 1; }
  }
  function far(c, g, T, L) {
    const R = rnd(3), fog = T.fog;
    for (let x = g.x0 + 20; x < g.x1; x += 80 + Math.floor(R() * 70)) island(c, x, L.hz - 8 + Math.floor(R() * 40), 36 + Math.floor(R() * 44), T, .66, R, { fall: R() < .5, tree: true });
    hazeBottom(c, g.x0, g.x1, L.hz - 20, L.hz + 60, fog, 0, .5);
  }
  function door(c, x, y, T, z) { const h_ = q => haze(q, T.fog, z); rect(c, x - 6, y - 24, 12, 24, h_(T.wood[1])); for (let j = 0; j < 4; j++) rect(c, x - 5 + j, y - 26 - 2 + (j > 1 ? 1 : 0) , 10 - j * 2 , 1, h_(T.wood[1])); disk(c, x, y - 24, 6, h_(T.wood[1])); disk(c, x, y - 24, 4, h_(T.gold[2])); rect(c, x - 4, y - 22, 8, 22, h_(T.gold[1])); rect(c, x - 3, y - 20, 6, 20, h_(T.gold[2])); px(c, x + 2, y - 10, h_(T.wood[0])); }
  function clockTower(c, x, y, T, z) {
    const h_ = q => haze(q, T.fog, z); for (let j = 0; j < 50; j++) { const w = j < 44 ? 6 - (j > 28 ? 1 : 0) : 8; rect(c, x - w, y - j, w * 2, 1, j % 7 === 6 ? h_(T.plaster[0]) : h_(T.plaster[1])); px(c, x - w, y - j, h_(T.plaster[2])); } for (let j = 0; j < 14; j++) rect(c, x - 8 + Math.floor(j / 2), y - 56 + j, 16 - Math.floor(j / 2) * 2, 1, j % 3 ? h_(T.roof[1]) : h_(T.roof[0]));
    disk(c, x, y - 36, 5, h_(T.plaster[2])); disk(c, x, y - 36, 4, h_(T.gold[2])); for (let k = 0; k < 4; k++) px(c, x, y - 36 - 1 - k, h_(T.wood[0])); for (let k = 0; k < 3; k++) px(c, x + 1 + k, y - 36, h_(T.wood[0])); rect(c, x - 1, y - 8, 3, 8, h_(T.wood[1]));
  }
  function mid(c, g, T, L) {
    const R = rnd(21), W = g.W;
    island(c, Math.round(W * .18), L.hz2 - 8, 70, T, .34, R, { fall: true }); island(c, Math.round(W * .52), L.hz2 + 6, 88, T, .3, R, { tree: true }); island(c, Math.round(W * .84), L.hz2 - 14, 76, T, .36, R, { fall: true });
    clockTower(c, Math.round(W * .84) + 16, L.hz2 - 12, T, .36); door(c, Math.round(W * .18) + 14, L.hz2 - 4, T, .34); door(c, Math.round(W * .84) - 16, L.hz2 - 10, T, .36);
    for (let i = 0; i < 12; i++) { const bx = Math.round(W * (.02 + .92 * R())), by = Math.round(L.hz2 - 40 + R() * 70); for (let k = 0; k < 4; k++) px(c, bx + k, by + (k === 1 || k === 2 ? 1 : 0), haze(T.pink[2], T.fog, .4)); }
    hazeBottom(c, g.x0, g.x1, L.hz2 - 16, L.hz2 + 40, T.fog, 0, .3);
  }
  function house(c, x, base, st, T, R) {
    const W2 = 34, wl = T.plaster, rf = T.roof, wd = T.wood, lit = T.mood !== 'day';
    rect(c, x - 3, base, W2 + 8, 2, 'rgba(0,0,0,.2)');
    if (st === 0) { rect(c, x + 12, base - 20, 10, 20, wd[1]); for (let j = 0; j < 5; j++) rect(c, x + 13 + j, base - 24 + j, 8 - j * 2, 1, wd[1]); rect(c, x + 14, base - 18, 6, 18, T.gold[2]); disk(c, x + 20, base - 9, 1, wd[0]); for (let i = 0; i < 6; i++) px(c, x + 2 + i * 5, base - 1 - (i % 2), T.sand[2]); return; }
    ell(c, x + W2 / 2, base - 2, W2 / 2 + 5, 3, T.cloud[1]); ell(c, x + W2 / 2, base - 3, W2 / 2 + 3, 2, T.cloud[2]); if (st === 1) { rect(c, x + 10, base - 9, 14, 6, T.sand[1]); return; }
    const top = base - 30; for (const p of [2, 16, 30]) { rect(c, x + p, top, 2, 27, wd[1]); px(c, x + p, top, wd[2]); } if (st === 2) { rect(c, x, top, W2 + 4, 2, wd[0]); return; }
    const hh = st === 3 ? 12 : 26; for (let j = 0; j < hh; j++) for (let i = 3; i < W2 - 1; i++) { px(c, x + i, base - 4 - j, (i * 3 + j * 5) % 11 === 0 ? wl[0] : wl[1]); } for (let j = 0; j < hh; j++) px(c, x + 3, base - 4 - j, wl[2]);
    if (st === 3) return;
    if (st === 4) { for (let k = 0; k < 10; k++) { rect(c, x + 2 + k * 2, top - k, 2, 1, wd[1]); rect(c, x + W2 - 2 - k * 2, top - k, 2, 1, wd[1]); } return; }
    for (let j = 0; j < 20; j++) { const w = Math.round((W2 / 2 + 5) * Math.sqrt(Math.max(0, 1 - Math.pow(j / 19, 2)))); rect(c, x + W2 / 2 - w, top - j, w * 2, 1, j % 4 === 3 ? rf[0] : j % 2 ? rf[1] : rf[2]); px(c, x + W2 / 2 - w, top - j, rf[2]); } disk(c, x + W2 / 2, top - 22, 2, T.gold[1]); rect(c, x + W2 / 2, top - 30, 1, 8, wd[1]); rect(c, x + W2 / 2 + 1, top - 30, 5, 3, rf[2]);
    if (st === 5) return;
    for (const wx of [6, 22]) { disk(c, x + wx + 2, base - 18, 4, wd[0]); disk(c, x + wx + 2, base - 18, 3, lit ? T.gold[2] : T.teal[1]); px(c, x + wx + 1, base - 19, '#ffffff'); }
    disk(c, x + 16, base - 10, 5, wd[0]); rect(c, x + 11, base - 10, 11, 10, wd[0]); disk(c, x + 16, base - 10, 4, T.teal[1]); rect(c, x + 12, base - 10, 9, 10, T.teal[1]); px(c, x + 19, base - 5, T.gold[2]);
    if (st === 6) return;
    for (let i = 0; i < 6; i++) { const lx = x - 4 + i * 8; rect(c, lx, base - 34 - (i % 2) * 2, 1, 6, wd[1]); disk(c, lx, base - 28 - (i % 2) * 2, 2, [T.pink[2], T.gold[2], T.teal[2]][i % 3]); } for (let k = 0; k < 14; k++) px(c, x + W2 + 2 + k, base - 6 - Math.round(Math.sin(k / 3) * 2) - Math.floor(k / 4), T.pink[2]);
  }
  function stage(c, g, T, L, st) {
    const R = rnd(11), W = g.W, sw = L.sw, x0 = g.x0, x1 = g.x1, H = g.H;
    for (let y = sw; y < g.y1; y++) { const u = Math.min(1, (y - sw) / (H - sw + 6)); c.fillStyle = mix(T.water[2], T.water[0], Math.pow(u, .6)); c.fillRect(x0, y, x1 - x0, 1); }
    /* reflected sky: stars and the moon's glitter */
    for (let i = 0; i < 90; i++) { const sx = x0 + Math.floor(R() * (x1 - x0)), sy = sw + 6 + Math.floor(R() * (H - sw)); c.globalAlpha = .55; px(c, sx, sy, '#ffffff'); } c.globalAlpha = 1;
    const mx = L.moon.x; for (let y = sw + 5; y < g.y1; y += 2) { const u = (y - sw) / (H - sw), w = 4 + u * 10; c.globalAlpha = .45 * (1 - u * .5); c.fillStyle = T.moon[1]; c.fillRect(Math.round(mx + Math.sin(y * .9) * w * .4 - w / 2), y, Math.round(w * (.4 + hsh(y, 1, 1) * .6)), 1); } c.globalAlpha = 1;
    for (let y = sw + 4; y < g.y1; y += 4) for (let x = x0 + (y * 13) % 17; x < x1; x += 21 + (y % 7)) { c.globalAlpha = .35; c.fillStyle = T.water[2]; c.fillRect(x, y, 6 + (x % 5), 1); } c.globalAlpha = 1;
    /* the shore */
    for (let x = x0; x < x1; x++) { const d = 4 + Math.round(Math.sin(x / 17) * 1.5 + Math.sin(x / 6) * .6); c.fillStyle = T.sand[1]; c.fillRect(x, sw - 1, 1, d); c.fillStyle = T.sand[2]; c.fillRect(x, sw - 1, 1, 1); c.fillStyle = T.sand[0]; c.fillRect(x, sw + d - 2, 1, 2); if (hsh(x, 1, 1) < .4) { c.fillStyle = T.grass[2]; c.fillRect(x, sw - 2, 1, 1); } if (hsh(x, 2, 2) < .12) { c.fillStyle = T.grass[1]; c.fillRect(x, sw - 3, 1, 2); } }
    for (let i = 0; i < 10; i++) { const sx = x0 + Math.floor(R() * (x1 - x0)); ell(c, sx, sw + 10 + Math.floor(R() * (H - sw - 10)), 6 + Math.floor(R() * 8), 2, T.sand[R() < .5 ? 0 : 1]); }
    house(c, L.house.x, sw + 1, st, T, R);
    if (L.wide) { for (let i = 0; i < 5; i++) { const sx = L.stones.x + i * 11; ell(c, sx, sw + 8 + (i % 2) * 2, 4, 2, T.rock[1]); ell(c, sx, sw + 7 + (i % 2) * 2, 4, 1, T.rock[2]); } }
  }

  const PL = {
    lily: (c, n, f, T) => { const e = n.en || 0, sw = ECO.sway(n.x, f, .3) * .5; for (const [dx, h, r] of [[-6, 8, 4], [0, 13, 6], [7, 7, 4]]) { for (let j = 0; j < h; j++) px(c, n.x + dx, n.y - j, T.grass[1]); for (let a = 0; a < 6; a++) { const an = -1.57 + (a - 2.5) * .5, L2 = r + (a % 2 ? 0 : 2); for (let k = 2; k < L2; k++) px(c, n.x + dx + Math.cos(an) * k, n.y - h + Math.sin(an) * k * 1.2, k > L2 - 3 ? T.moon[2] : T.moon[1]); } px(c, n.x + dx, n.y - h, e > .2 ? T.gold[2] : T.gold[1]); } },
    clock: (c, n, f, T) => { const e = n.en || 0, sw = ECO.sway(n.x, f, .5) + n.kick; for (const [dx, h, r] of [[-5, 10, 3], [3, 15, 4], [9, 8, 3]]) { for (let j = 0; j < h; j++) px(c, n.x + dx + Math.round(sw * j / h * .6), n.y - j, T.grass[1]); const cx = n.x + dx + Math.round(sw * .6), cy = n.y - h; disk(c, cx, cy, r + 1, T.wood[1]); disk(c, cx, cy, r, T.plaster[2]); const a = f / 50 + dx; px(c, cx, cy, T.wood[0]); px(c, cx + Math.round(Math.cos(a) * (r - 1)), cy + Math.round(Math.sin(a) * (r - 1)), T.wood[0]); px(c, cx, cy - 1, T.wood[0]); } },
    feather: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .9) + n.kick * 2, e = n.en || 0; for (let k = -4; k <= 4; k++) { const h = 12 + ((k * 5) & 3) * 2 + Math.round(e * 4); for (let j = 0; j < h; j++) { const t = j / h; px(c, n.x + k * 2 + Math.round(sw * t * 1.4 + k * t * 1.5), n.y - j, j > h - 6 ? (j % 2 ? T.pink[2] : T.moon[1]) : T.grass[1]); } } },
    pod: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .4) + n.kick, e = n.en || 0; for (const [dx, h] of [[-5, 14], [3, 20], [9, 11]]) { for (let j = 0; j < h; j++) px(c, n.x + dx + Math.round(sw * j / h * .5), n.y - j, T.wood[2]); const cx = n.x + dx + Math.round(sw * .5); disk(c, cx, n.y - h - 3, 4, T.teal[1]); disk(c, cx - 1, n.y - h - 4, 2, T.teal[2]); px(c, cx - 1, n.y - h - 5, '#ffffff'); if (e > .2 || T.lit > .5) { c.globalAlpha = .4; disk(c, cx, n.y - h - 3, 7, T.teal[2]); c.globalAlpha = 1; } } },
    startree: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .3), e = n.en || 0; rect(c, n.x - 1, n.y - 16, 3, 16, T.wood[1]); rect(c, n.x - 1, n.y - 16, 1, 16, T.wood[2]); const R = rnd(n.seed + 4); for (const [dx, dy, r] of [[-6, -20, 6], [6, -20, 6], [0, -26, 7]]) crown(c, n.x + dx + Math.round(sw), n.y + dy, r, [T.grass[0], T.pink[1], T.pink[2]], R); for (let i = 0; i < 6; i++) { const fx = n.x - 9 + Math.floor(R() * 18), fy = n.y - 30 + Math.floor(R() * 14); rect(c, fx, fy, 2, 2, T.gold[2]); px(c, fx + 1, fy - 1, T.gold[2]); px(c, fx - 1, fy + 0, T.gold[1]); } },
    glasstulip: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2, e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 9 + (k & 1) * 3 + Math.round(e * 3), tx = n.x + k * 3 + Math.round(sw); for (let j = 0; j < h; j++) px(c, n.x + k * 3 + Math.round(sw * j / h), n.y - j, T.grass[1]); rect(c, tx - 1, n.y - h - 3, 3, 3, T.teal[2]); px(c, tx - 1, n.y - h - 4, T.teal[1]); px(c, tx + 1, n.y - h - 4, T.teal[1]); px(c, tx, n.y - h - 2, '#ffffff'); } },
    ribbon: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .8) + n.kick, e = n.en || 0, h = 24; for (let j = 0; j < h; j++) { const xx = n.x + Math.round(Math.sin(j / 3 + f / 18) * 3 + sw * j / h); rect(c, xx, n.y - j, 2, 1, j % 6 < 3 ? T.pink[1] : T.pink[2]); } for (let k = 0; k < 4; k++) { const j = 5 + k * 5, xx = n.x + Math.round(Math.sin(j / 3 + f / 18) * 3 + sw * j / h); px(c, xx + 3, n.y - j, T.gold[2]); px(c, xx - 2, n.y - j - 1, T.gold[2]); } },
    dshroom: (c, n, f, T) => { const e = n.en || 0; for (const [dx, h, w] of [[-6, 6, 4], [1, 10, 5], [8, 5, 3]]) { rect(c, n.x + dx, n.y - h, 2, h, T.plaster[1]); const cx = n.x + dx + 1, cy = n.y - h; for (let j = 0; j < w; j++) rect(c, cx - w + j, cy - j, w * 2 - j * 2, 1, j ? T.pink[1] : T.pink[0]); px(c, cx - 1, cy - w + 1, T.plaster[2]); px(c, cx + 1, cy - 2, T.plaster[2]); px(c, cx - w + 1, cy - 1, T.plaster[2]); if (e > .2) { c.globalAlpha = e * .5; disk(c, cx, cy - 2, w + 3, T.pink[2]); c.globalAlpha = 1; } } },
    reed: (c, n, f, T) => { const sw = ECO.sway(n.x, f, 1) + n.kick * 2, e = n.en || 0; for (let k = -3; k <= 3; k++) { const h = 13 + ((k * 3) & 3) * 2 + Math.round(e * 3); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(sw * (j / h)), n.y - j, T.grass[1]); disk(c, n.x + k * 2 + Math.round(sw), n.y - h, 1, T.moon[2]); } },
  };
  const PLN = { lily: 'Moon lilies', clock: 'Clock flowers', feather: 'Feather grass', pod: 'Lantern pods', startree: 'Star tree', glasstulip: 'Glass tulips', ribbon: 'Ribbon vine', dshroom: 'Dream caps', reed: 'Whisper reeds' };
  const PLS = { lily: ['chime', 4], clock: ['tick'], feather: ['rustle'], pod: ['hum', 2], startree: ['chime', 9], glasstulip: ['glass'], ribbon: ['whoosh'], dshroom: ['soft'], reed: ['rustle'] };

  function buildPolys(L, links) {
    let i = 0, m = L.moon;
    for (const l of links) { if (l.kind !== 'root') continue; const b = l.b, k = i++, ax = m.x + (k % 7 - 3) * 3, ay = m.y + m.r - 2, bx = b.x, by = L.sw - (b.kind === 'plant' ? 20 : 22), pts = [], sag = 14 + (k % 5) * 3; for (let j = 0; j <= 20; j++) { const t = j / 20; pts.push([ax + (bx - ax) * t + Math.sin(t * Math.PI) * ((k % 3) - 1) * 6, ay + (by - ay) * t + Math.sin(t * Math.PI) * sag]); } const ls = [0]; for (let q = 1; q < pts.length; q++) ls.push(ls[q - 1] + Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1])); l.pts = pts; l.ls = ls; l.len = ls[ls.length - 1]; }
  }
  function build(g) {
    const W = g.W, H = g.H, T = g.T, L = g.L, R = rnd(61), sw = L.sw, m = L.moon;
    const S = (id, o) => ECO.add(Object.assign({ id, kind: 'creature', hw: 7, hh: 7 }, o));
    ECO.begin(g, {
      pulse: '#f4e8ff', wave: '#e8d8ff', bubble: { bg: '#fcf4ff', edge: '#2a1a62', ink: ['#7a4ad8', '#e84a8a', '#2aa8c8', '#d89a2a'] },
      route(l, u) { if (!l.pts) return null; let d = u * l.len, k = 1; while (k < l.ls.length - 1 && d > l.ls[k]) k++; const t = (d - l.ls[k - 1]) / Math.max(.001, l.ls[k] - l.ls[k - 1]), A = l.pts[k - 1], B = l.pts[k]; return { x: A[0] + (B[0] - A[0]) * Math.min(1, t), y: A[1] + (B[1] - A[1]) * Math.min(1, t) }; },
      link(c, l, at, f) {
        if (l.kind === 'root') { const n = Math.max(12, Math.round(l.len * 1.2)); for (let i = 0; i <= n; i++) { const q = at(l, i / n); c.globalAlpha = l.fl > .1 ? .6 + l.fl * .4 : (T.mood === 'night' ? .5 : .32); c.fillStyle = l.fl > .1 ? '#ffffff' : T.moon[1]; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; return; }
        if (l.fl > .12) { const n = Math.max(8, Math.round(Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y) * .5)); c.fillStyle = '#f4e8ff'; for (let i = 0; i <= n; i += 2) { const q = at(l, i / n); c.globalAlpha = l.fl * .7; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; }
      },
    });
    ECO.add({ id: 'spirit', kind: 'spirit', name: 'The Sleeper', x: m.x, y: m.y + m.r, hw: m.r + 4, hh: m.r + 4, snd: 'hum', sndK: 2, magic: true, say: ['moon', 'eye', 'star', 'heart'], z: 2, lift: 0, noReflect: true, eye: 0,
      step(n, f) { if (f % 420 === 200) n.eye = 1; if (n.eye > 0) n.eye -= .006; if ((n.fl || 0) > .5) n.eye = Math.max(n.eye, .8); },
      draw(c, n, f) { const x = m.x, y = m.y, r = m.r, b = Math.sin(f / 60) * .5; for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283; } for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); rect(c, x - w, y + j, w * 2, 1, T.moon[1]); rect(c, x - w, y + j, Math.max(1, Math.round(w * .35)), 1, T.moon[2]); rect(c, x + w - Math.round(w * .3), y + j, Math.round(w * .3), 1, T.moon[0]); } for (const [dx, dy, rr] of [[-r * .4, -r * .3, 3], [r * .35, r * .35, 4], [r * .1, -r * .6, 2], [-r * .1, r * .55, 3]]) { disk(c, x + dx, y + dy, rr, T.moon[0]); px(c, x + dx - 1, y + dy - 1, T.moon[2]); }
        const open = Math.max(0, Math.min(1, n.eye * 2)), ex = x - Math.round(r * .12), ey = y + 2; if (open < .1) { for (let k = -5; k <= 5; k++) px(c, ex + k, ey + Math.round(Math.abs(k) * .3 + 1 + b * .3), T.moon[0]); for (let k = -4; k <= 4; k += 2) px(c, ex + k, ey + 3 + Math.round(Math.abs(k) * .2), T.moon[0]); } else { const hh = Math.round(open * 4); disk(c, ex, ey, 5, '#ffffff'); disk(c, ex + Math.round(Math.sin(f / 30) * 2), ey, 3, T.sky[1]); px(c, ex + Math.round(Math.sin(f / 30) * 2) - 1, ey - 1, '#ffffff'); rect(c, ex - 6, ey - 6, 12, 6 - hh, T.moon[1]); }
        const bx = x + r * .5, by = y + r * .45; for (let k = 0; k < 3; k++) px(c, bx + k, by - k - Math.round((f / 20) % 3), T.moon[0]); },
      glow: { col: '#d8c8ff', r: 70, a: T.mood === 'night' ? .22 : .1, dy: -m.r } });
    const homes = [ECO.add({ id: 'house', kind: 'house', name: 'Your house', x: L.house.x + 17, y: sw, hw: 24, hh: 26, z: sw - 1, snd: 'knock', draw() {}, lift: -2, glow: () => (g.tk.stage() >= 6 ? { col: '#ffe8a0', r: 30, a: T.lit * .5 + .1, dy: 12 } : null) })];
    const plants = [], P = (kind, x, o) => { if (L.wide && x < L.house.x + 48) return null; const seed = Math.floor(R() * 9), nd = ECO.add(Object.assign({ id: kind + plants.length, kind: 'plant', pk: kind, name: PLN[kind], x, y: sw + 2, hw: 8, hh: 12, snd: PLS[kind][0], sndK: PLS[kind][1], seed, z: sw + (seed % 4), en: 0, lift: -2, draw: (c, n, f) => PL[kind](c, n, f, T), step(n) { n.en = Math.max(0, (n.en || 0) - .02); } }, o || {})); plants.push(nd); return nd; };
    const fx = v => Math.round(W * v);
    P('lily', fx(.3)); P('lily', fx(.6)); P('lily', fx(.92)); P('clock', fx(.34)); P('clock', fx(.5)); P('clock', fx(.74)); P('feather', fx(.28)); P('feather', fx(.56)); P('feather', fx(.88)); P('pod', fx(.38)); P('pod', fx(.66)); P('pod', fx(.96)); P('startree', fx(.45)); P('startree', fx(.8)); P('glasstulip', fx(.31)); P('glasstulip', fx(.52)); P('glasstulip', fx(.7)); P('ribbon', fx(.4)); P('ribbon', fx(.84)); P('dshroom', fx(.47)); P('dshroom', fx(.62)); P('reed', fx(.25)); P('reed', fx(.78));
    const sp = ECO.spirit();
    for (const p of plants.concat(homes)) ECO.link(sp, p, { kind: 'root' });
    buildPolys(L, ECO.links());
    mkCreatures(g, S, L, sp, plants, homes);
    ECO.autoLinks({ noRoots: true });
  }
  function mkCreatures(g, S, L, sp, plants, homes) {
    const T = g.T, W = g.W, sw = L.sw, say = ['moon', 'star', 'heart', 'eye', 'note'], rnd_ = a => a[Math.floor(Math.random() * a.length)];
    S('whale', { name: 'Moon whale', x: W * .3, y: L.hz * 1.3, hw: 24, hh: 12, magic: true, say, snd: 'whale', z: 3, noReflect: true,
      step(n, f) { n.x = W * .5 + Math.sin(f / 240) * W * .4; n.y = L.hz * 1.3 + Math.sin(f / 90) * 8; n.dd = Math.cos(f / 240) > 0 ? 1 : -1; },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd || 1, wv = Math.sin(f / 14); for (let j = -9; j <= 9; j++) { const w = Math.round(22 * Math.sqrt(1 - Math.pow(j / 10, 2))); rect(c, x - w, y + j, w * 2, 1, j < -2 ? T.teal[1] : j < 5 ? T.teal[0] : T.moon[1]); } for (let i = 0; i < 8; i++) px(c, x - 14 + i * 4, y - 4 + (i % 3), T.moon[2]); for (let k = 0; k < 12; k++) { const tx = x - d * (20 + k), ty = y - 2 + Math.round(wv * k * .5); rect(c, tx, ty, 1, 3 - (k > 8 ? 1 : 0), T.teal[1]); } for (let k = 0; k < 6; k++) { rect(c, x - d * (30 + k * 1.2), y - 3 + Math.round(wv * 5) - 3 + k, 3, 1, T.teal[1]); rect(c, x - d * (30 + k * 1.2), y - 3 + Math.round(wv * 5) + 3 - k, 3, 1, T.teal[1]); } px(c, x + d * 16, y - 3, '#101028'); for (const [dx, dy] of [[-8, -8], [0, -9], [8, -8]]) px(c, x + dx, y + dy - 2 - Math.round(Math.sin(f / 10 + dx) * 1), T.moon[2]); },
      glow: { col: '#a8f0ff', r: 40, a: T.lit * .24 + .06, dy: 0 } });
    for (let i = 0; i < 3; i++) S('crane' + i, { name: 'Paper crane', x: W * .5, y: L.hz * .6, hw: 8, hh: 6, magic: true, say, snd: 'flutter', sndK: i, z: sw - 6, ph: i * 2, noReflect: true,
      step(n, f) { n.x = W * (.3 + i * .18) + Math.sin(f / (60 + i * 13) + n.ph) * W * .16; n.y = L.hz * (.5 + i * .12) + Math.sin(f / (33 + i * 9)) * 14 + Math.sin(f / 5) * 1.5; n.dd = Math.cos(f / (60 + i * 13) + n.ph) > 0 ? 1 : -1; },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd || 1, up = (f + i * 3) % 12 < 6; for (let k = 0; k < 6; k++) { px(c, x - k * d, y + Math.floor(k * .4), k < 2 ? T.pink[2] : '#ffffff'); } for (let k = 1; k <= 5; k++) { px(c, x - d * 2 + (up ? 0 : -d) * 0, y - (up ? k : Math.floor(k * .3)), k > 3 ? T.pink[1] : '#ffffff'); px(c, x - d * 3, y - (up ? k - 1 : Math.floor(k * .3)), '#ffffff'); } px(c, x + d * 2, y - 1, '#ffffff'); px(c, x + d * 3, y, T.gold[1]); },
      glow: { col: '#ffd8f0', r: 12, a: T.lit * .25 + .05, dy: 0 } });
    S('owl', { name: 'Clock owl', x: L.owl.x, y: sw - 4, hw: 8, hh: 12, say: ['eye', 'moon', 'star'], snd: 'hoot', z: sw - 3, noReflect: false, refl: true,
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), bl = f % 80 < 3; rect(c, x - 5, y - 16, 10, 14, T.wood[1]); rect(c, x - 5, y - 16, 2, 14, T.wood[2]); rect(c, x - 5, y - 18, 3, 3, T.wood[1]); rect(c, x + 2, y - 18, 3, 3, T.wood[1]); disk(c, x, y - 7, 4, T.plaster[2]); disk(c, x, y - 7, 3, T.gold[2]); const a = f / 40; px(c, x, y - 7, T.wood[0]); px(c, x + Math.round(Math.cos(a) * 2), y - 7 + Math.round(Math.sin(a) * 2), T.wood[0]); for (const dx of [-4, 1]) { rect(c, x + dx, y - 15, 4, 4, bl ? T.wood[1] : T.gold[2]); if (!bl) px(c, x + dx + 1, y - 14, '#101018'); } px(c, x, y - 12, T.pink[1]); rect(c, x - 4, y - 2, 3, 2, T.pink[1]); rect(c, x + 1, y - 2, 3, 2, T.pink[1]); } });
    S('deer', { name: 'Glass fawn', x: W * .66, y: sw + 3, hw: 10, hh: 16, say, snd: 'glass', z: sw + 4, refl: true, dd: -1, x0: W * .58, x1: W * .72,
      step(n, f) { if (f % 4 === 0 && n.fl < .3) { n.x += n.dd * .3; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd; for (const lx of [-6, -3, 3, 6]) { rect(c, x + lx, y - 10, 1, 10, T.teal[1]); } for (let j = 0; j < 6; j++) rect(c, x - 8, y - 16 + j, 16, 1, j < 2 ? T.teal[2] : T.teal[1]); for (let j = 0; j < 6; j++) rect(c, x + d * (7 + j * .4), y - 22 + j, 3, 1, T.teal[2]); rect(c, x + d * 10, y - 23, 3, 3, T.teal[2]); px(c, x + d * 11, y - 23, '#101028'); for (let k = 0; k < 4; k++) { px(c, x + d * 9 - 1 + k * d, y - 27 - k, T.pink[2]); px(c, x + d * 9 + 1 + k * d, y - 25 - k, T.pink[1]); } for (let i = 0; i < 5; i++) px(c, x - 5 + i * 3, y - 14, '#ffffff'); } });
    [0, 1].forEach(i => S('sheep' + i, { name: 'Cloud sheep', x: W * (.44 + i * .2), y: sw - 8 - i * 4, hw: 9, hh: 8, say: ['moon', 'heart', 'note'], snd: 'soft', z: sw + 1, noReflect: false, refl: true, ph: i * 3,
      step(n, f) { n.y = sw - 9 - i * 5 + Math.sin(f / 40 + n.ph) * 2; },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y); for (const [dx, dy, r] of [[-5, -4, 4], [0, -6, 5], [5, -4, 4], [-2, -9, 3], [3, -9, 3]]) disk(c, x + dx, y + dy, r, T.cloud[2]); for (const [dx, dy] of [[-3, -3], [4, -2]]) px(c, x + dx, y + dy, T.cloud[0]); rect(c, x + 6, y - 7, 4, 4, T.moon[0]); px(c, x + 8, y - 6, '#101028'); if (f % 90 < 45) { px(c, x + 9, y - 12 - (f % 90) / 10, T.moon[2]); px(c, x + 11, y - 15 - (f % 90) / 10, T.moon[2]); } } }));
    S('frog', { name: 'Umbrella frog', x: W * .36, y: sw + 6, hw: 8, hh: 10, say: ['drop', 'moon', 'note'], snd: 'bloop', z: sw + 7,
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), bl = f % 70 < 5; for (let j = 0; j < 5; j++) rect(c, x - 7 + j, y - 16 + j, 14 - j * 2, 1, j ? T.pink[1] : T.pink[0]); rect(c, x, y - 11, 1, 9, T.wood[1]); disk(c, x, y - 4, 3, T.grass[1]); disk(c, x - 1, y - 5, 2, T.grass[2]); rect(c, x - 3, y - 8, 2, 2, T.grass[1]); rect(c, x + 1, y - 8, 2, 2, T.grass[1]); px(c, x - 2, y - 7, bl ? T.grass[0] : '#101028'); px(c, x + 2, y - 7, bl ? T.grass[0] : '#101028'); } });
    S('snail', { name: 'Lamp snail', x: W * .58, y: sw + 7, hw: 6, hh: 7, say: ['moon', 'star', 'drop'], snd: 'bloop', z: sw + 8, dd: 1, x0: W * .53, x1: W * .6,
      step(n, f) { if (f % 6 === 0 && n.fl < .3) { n.x += n.dd * .4; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), d = n.dd; rect(c, x - 4, y - 1, 8, 2, T.plaster[1]); rect(c, x + 3 * d, y - 3, 2, 3, T.plaster[1]); px(c, x + 4 * d, y - 4, '#101018'); disk(c, x - d, y - 5, 4, T.wood[1]); disk(c, x - d, y - 5, 2, T.gold[2]); } , glow: { col: '#ffe8a0', r: 14, a: T.lit * .35 + .08, dy: 4 } });
  }

  VISTA.reg('dream', {
    stageK: .55, eco: true,
    pal(mood) { return pal(mood); },
    layout(g) {
      const W = g.W, H = g.H, wide = W > 210, sw = Math.round(H * .72), hz = Math.round(H * .34);
      g.L = { W, H, wide, sw, hz, hz2: Math.round(H * .48), house: { x: wide ? Math.round(W * .04) : 2 }, moon: { x: Math.round(W * .5), y: Math.round(hz * .55), r: Math.round(Math.min(26, H * .1)) }, stones: { x: Math.round(W * .24) }, owl: { x: Math.round(W * .245) } };
      g.L.fairies = []; ECO.end(); build(g);
    },
    rays(g) { const W = g.W, out = []; for (let i = 0; i < 4; i++) out.push({ x: W * (.2 + i * .2), w: 5 + (i * 3) % 5, sk: -.2, a: g.T.shaftA * (g.mood === 'night' ? .9 : .8), d: i * 2.4, col: g.T.shaft }); return out; },
    weather: { dir: 'up', cols: ['#ffffff', '#f4e0ff', '#c8f0ff'], glow: true, depths: [{ n: 10, size: 1, dur: 52, z: 1, seed: 9, op: .85 }, { n: 3, size: 2, dur: 34, z: 3, seed: 4, op: .75, blur: 1.2 }] },
    layers(g) {
      const T = g.T, L = g.L, st = () => g.tk.stage();
      return [
        { id: 'sky', k: .04, paint: (c, g2) => sky(c, g2, T, L) },
        { id: 'far', k: .1, blur: 1.2, paint: (c, g2) => far(c, g2, T, L) },
        { id: 'mid', k: .3, paint: (c, g2) => mid(c, Object.assign({ W: g.W }, g2), T, L) },
        { id: 'stage', k: .55, stage: true, live: true, paint: (c, g2) => stage(c, Object.assign({ W: g.W, H: g.H }, g2), T, L, st()), live(c, f, g2) { ECO.draw(c, f, g2); } },
        { id: 'near', k: .95, paint(c, g2) {
          const Rr = rnd(37);
          for (let i = 0; i < 7; i++) { const x = Math.round(g2.x0 + (i + .5) / 7 * (g2.x1 - g2.x0) + (Rr() - .5) * 20), len = 6 + Math.floor(Rr() * 26); for (let j = 0; j < len; j++) px(c, x, g2.y0 + j, T.wood[2]); for (let k = 0; k < 5; k++) px(c, x - 2 + k, g2.y0 + len + (k === 0 || k === 4 ? 2 : k === 1 || k === 3 ? 0 : -2) + 3, T.gold[2]); disk(c, x, g2.y0 + len + 3, 3, T.gold[1]); px(c, x - 1, g2.y0 + len + 2, '#ffffff'); }
        } },
        { id: 'fg', k: 1.8, blur: 2.8, op: .9, paint(c, g2) {
          const Rr = rnd(7), H = g.H;
          for (let i = 0; i < 6; i++) { const x = g2.x0 + 8 + Math.floor(Rr() * (g2.x1 - g2.x0 - 16)), y = H - 6 - Math.floor(Rr() * 14); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) px(c, x + dx, y + dy, i % 2 ? T.pink[2] : '#ffffff'); px(c, x, y, T.gold[2]); }
        } },
      ];
    },
    lights(f, g) {
      const L = g.L, out = [{ x: L.moon.x, y: L.moon.y, r: 120, col: '#d8c8ff', a: g.mood === 'night' ? .14 : .08 }];
      if (g.mood === 'sunset') out.push({ x: g.W * .2, y: L.hz, r: 90, col: '#ff9ab8', a: .2 });
      return out;
    },
  });
})();
