/* ---------- The Sunken Dynasty: a drowned court under a bright sea, and the jellyfish who speak in light ----------
   Back to front: the water seen from below, light falling in rays; pagodas and a great gate lost in blue haze; terraces of ruined halls and
   kelp forests; guardian lions, columns and reefs; the stage (a pavilion that you build, a gate that glows, lanterns, plants, creatures,
   and the great old jelly that is the Spirit of the place); big kelp and broken beams close by; and bubbles and blurred fish at the glass.
   The jellyfish are intelligent. They talk by lighting their bells in patterns and by throwing threads of light to each other; the whole
   court listens, and every plant and stone is tied into the same net of light. */
(() => {
  const V = window.__VSET, MC = V.moodCol, { mix, rnd, hsh, px, rect, disk, ell, vgrad, hazeBottom, haze, crown, reflect } = VG;
  const WATER = { morning: ['#8fe0d8', '#4cb8c4', '#1f7a9a', '#0e4a6c'], day: ['#8af0e8', '#3cc0d0', '#1c80a8', '#0a4a74'], sunset: ['#c8a0d8', '#7a78c8', '#3a58a0', '#1a3068'], night: ['#1a4a7a', '#0e3260', '#081e48', '#040e2c'] };
  const FOG = { morning: '#3ea8be', day: '#2aa0c0', sunset: '#4a68b0', night: '#0a2250' };
  const RAMPS = {
    stone: ['#34566a', '#5e8aa0', '#9ec4d0'], sand: ['#8a8a78', '#c4bc98', '#ece4c4'], roof: ['#134a58', '#1f8090', '#5cc4c0'], gold: ['#8a6a1c', '#d8aa3a', '#ffe27a'], red: ['#6a1a22', '#b8322e', '#f26a58'],
    kelp: ['#0c4a3a', '#1c8a5a', '#6ad88a'], coral: ['#8a2a4a', '#e0587a', '#ffb0c0'], coral2: ['#a85a1a', '#f09a3a', '#ffd88a'], jade: ['#0f5a48', '#2ab08a', '#a8f4d0'], wood: ['#3a2418', '#6a4630', '#a87a50'],
  };
  const pal = mood => { const T = { mood }, m = c => MC(c, mood); T.water = WATER[mood].slice(); T.sky = T.water; T.fog = FOG[mood]; for (const k in RAMPS) T[k] = RAMPS[k].map(m); T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .55 : mood === 'morning' ? .2 : 0; T.shaft = mood === 'sunset' ? '#e8c8ff' : '#d8ffff'; T.shaftA = ({ morning: .22, day: .26, sunset: .2, night: .1 })[mood]; T.glow = ['#8af0ff', '#ff8ad8', '#b8a0ff', '#ffe27a', '#9affc8']; return T; };

  /* a jelly: translucent bell that pulses, radial lines that light up when it speaks, trailing tentacles */
  function jelly(c, x, y, r, K, f, o) {
    o = o || {}; const ph = o.ph || 0, p = Math.sin(f / (o.pace || 5) + ph), bw = r * (1 + .1 * p), bh = r * (o.tall || .78) * (1 - .14 * p), pat = o.pat || 0;
    x = Math.round(x); y = Math.round(y);
    const nt = o.tents == null ? 7 : o.tents, tl = o.len || Math.round(r * 2.2);
    for (let i = 0; i < nt; i++) { const bx = x + (i / (nt - 1) - .5) * bw * 1.5; for (let t = 0; t < tl; t++) { const a = (1 - t / tl); c.globalAlpha = a * .55; c.fillStyle = (t + i) % 5 === 0 ? K.w : K.t; c.fillRect(Math.round(bx + Math.sin(f / 9 + t * .32 + i * 1.7) * (1 + t * .08) - p * t * .05), y + 1 + t, 1, 1); } }
    for (let i = 0; i < 4; i++) for (let t = 0; t < tl * .5; t++) { c.globalAlpha = (1 - t / (tl * .5)) * .5; c.fillStyle = K.w; c.fillRect(Math.round(x - bw * .3 + i * bw * .2 + Math.sin(f / 7 + t * .5 + i) * 1.3), y + 1 + t, 2, 1); }
    c.globalAlpha = .62;
    for (let j = -Math.round(bh); j <= 0; j++) { const w = Math.round(bw * Math.sqrt(Math.max(0, 1 - (j / bh) * (j / bh)))); const u = (j + bh) / bh; c.fillStyle = u < .25 ? K.w : u < .6 ? K.a : K.b; c.fillRect(x - w, y + j, w * 2 + 1, 1); }
    c.globalAlpha = .9; for (let i = -Math.round(bw); i <= bw; i++) { const jj = -Math.round(bh * Math.sqrt(Math.max(0, 1 - (i / bw) * (i / bw)))); c.fillStyle = K.w; c.fillRect(x + i, y + jj, 1, 1); }
    c.fillStyle = K.g; c.fillRect(x - Math.round(bw), y, Math.round(bw) * 2 + 1, 1);
    c.globalAlpha = .22 + pat * .7; c.fillStyle = pat > .3 ? '#ffffff' : K.g; for (let k = -2; k <= 2; k++) { c.fillRect(x + Math.round(k * bw * .28), y - Math.round(bh * (.9 - Math.abs(k) * .18)), 1, Math.round(bh * (.55 - Math.abs(k) * .1))); }
    c.globalAlpha = .85; for (const [dx, dy] of [[-.35, .5], [.35, .5], [0, .35]]) { c.fillStyle = K.g; c.fillRect(x + Math.round(dx * bw) - 1, y - Math.round(bh * dy), 3, 2); }
    c.globalAlpha = 1;
  }
  const JK = {
    moon: { a: '#9ad8f4', b: '#5a98d0', w: '#e8fbff', t: '#8ac8e8', g: '#d8ffff' }, lantern: { a: '#ffc470', b: '#e0783a', w: '#fff0c0', t: '#ffb060', g: '#ffe27a' }, pink: { a: '#f4a0e0', b: '#b060b8', w: '#ffe8fa', t: '#e888d0', g: '#ffc8f0' },
    violet: { a: '#b8a8ff', b: '#6a58c8', w: '#f0e8ff', t: '#9a88f0', g: '#e0d4ff' }, great: { a: '#9a8cf0', b: '#4a58c8', w: '#e8e4ff', t: '#8ab8f0', g: '#ffe8ff' },
  };
  const J = (K, T) => { const o = {}; for (const k in K) o[k] = MC(K[k], T.mood, .5); return o; };

  function roofTier(c, cx, y, w, h, T, z, fog) {
    const col = T.roof.map(q => haze(q, fog, z)), gd = haze(T.gold[1], fog, z);
    for (let j = 0; j < h; j++) { const hw = Math.round(w / 2 - j * (w * .2 / h)); rect(c, cx - hw, y + j, hw * 2, 1, j === 0 ? col[2] : j === h - 1 ? col[0] : (j & 1 ? col[1] : col[0])); }
    for (let k = 0; k < 4; k++) { px(c, cx - Math.round(w / 2) - k, y - Math.floor(k / 2) - 1, col[2]); px(c, cx + Math.round(w / 2) + k - 1, y - Math.floor(k / 2) - 1, col[2]); }
    px(c, cx - Math.round(w / 2) - 3, y - 3, gd); px(c, cx + Math.round(w / 2) + 2, y - 3, gd);
  }
  function pagoda(c, x, base, tiers, w, T, z) {
    const fog = T.fog, st = T.stone.map(q => haze(q, fog, z)), rd = haze(T.red[1], fog, z), rd0 = haze(T.red[0], fog, z); let y = base;
    rect(c, x - w / 2 - 3, y - 3, w + 6, 3, st[1]); rect(c, x - w / 2 - 3, y - 3, w + 6, 1, st[2]);
    for (let i = 0; i < tiers; i++) {
      const tw = Math.round(w * (1 - i * .16)), bh = 9 - Math.floor(i / 2); y -= 3 - 3 + 0;
      rect(c, x - tw / 2 + 1, y - bh, tw - 2, bh, rd0); for (let k = 0; k <= 4; k++) rect(c, x - tw / 2 + 1 + Math.round(k * (tw - 4) / 4), y - bh, 2, bh, rd); rect(c, x - tw / 2, y - bh, tw, 1, haze(T.gold[1], fog, z));
      y -= bh; roofTier(c, x, y - 4, tw + 12, 5, T, z, fog); y -= 5;
    }
    rect(c, x, y - 11, 1, 11, haze(T.gold[1], fog, z)); px(c, x, y - 12, haze(T.gold[2], fog, z)); rect(c, x - 1, y - 6, 3, 1, haze(T.gold[1], fog, z));
  }
  function gate(c, x, base, w, h, T, z, R) {
    const fog = T.fog, st = T.stone.map(q => haze(q, fog, z)), rd = T.red.map(q => haze(q, fog, z)), gd = T.gold.map(q => haze(q, fog, z)), kl = T.kelp.map(q => haze(q, fog, z));
    for (const px0 of [0, w - 6]) { rect(c, x + px0, base - h, 6, h, rd[1]); rect(c, x + px0, base - h, 1, h, rd[2]); rect(c, x + px0 + 5, base - h, 1, h, rd[0]); rect(c, x + px0 - 2, base - 4, 10, 4, st[1]); rect(c, x + px0 - 2, base - 4, 10, 1, st[2]); for (let j = 4; j < h; j += 8) rect(c, x + px0, base - h + j, 6, 1, gd[1]); }
    rect(c, x - 4, base - h - 3, w + 8, 4, rd[1]); rect(c, x - 4, base - h - 3, w + 8, 1, rd[2]); roofTier(c, x + w / 2, base - h - 10, w + 18, 6, T, z, fog); rect(c, x + 6, base - h + 6, w - 12, 8, gd[0]); rect(c, x + 7, base - h + 7, w - 14, 6, rd[0]);
    for (let i = 0; i < 5; i++) px(c, x + 10 + i * Math.round((w - 20) / 4), base - h + 10, gd[2]);
    for (let i = 0; i < w / 3; i++) { const sx = x + Math.floor(R() * w), len = 6 + Math.floor(R() * h * .5); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 3 + i)), base - 4 - j, j % 3 ? kl[1] : kl[2]); }
  }
  /* the water, seen from below: a bright skin of surface above, light falling, soft patches of caustic */
  function water(c, g, T, L) {
    const R = rnd(5); vgrad(c, g.x0, g.x1, g.y0, g.y1, T.water);
    for (let i = 0; i < 90; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = g.y0 + Math.floor(R() * (g.y1 - g.y0) * .8); c.globalAlpha = .1 + R() * .2; px(c, x, y, '#ffffff'); } c.globalAlpha = 1;
    for (let x = g.x0; x < g.x1; x++) { const y = 2 + Math.round(Math.sin(x / 7) * 1.3 + Math.sin(x / 2.9) * .7); c.fillStyle = T.mood === 'night' ? '#3a7ac0' : '#ffffff'; c.globalAlpha = T.mood === 'night' ? .5 : .85; c.fillRect(x, g.y0, 1, y - g.y0 + 1); c.globalAlpha = .4; c.fillRect(x, y + 1, 1, 2); c.globalAlpha = 1; }
    for (let i = 0; i < 12; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 12 + Math.floor(R() * 40), w = 14 + Math.floor(R() * 40); c.globalAlpha = .1; rect(c, x, y, w, 1, '#ffffff'); rect(c, x + 4, y + 1, w - 8, 1, '#ffffff'); } c.globalAlpha = 1;
  }
  function far(c, g, T, L) {
    const W = g.W, sf = L.sf, R = rnd(3), fog = T.fog;
    c.fillStyle = haze(T.stone[0], fog, .78); c.fillRect(g.x0, sf - 22, g.x1 - g.x0, g.y1 - sf + 22);
    gate(c, Math.round(W * .46), sf - 18, 74, 54, T, .74, R);
    pagoda(c, Math.round(W * .2), sf - 20, 6, 38, T, .78); pagoda(c, Math.round(W * .78), sf - 18, 5, 32, T, .8); pagoda(c, Math.round(W * .95), sf - 22, 4, 26, T, .84);
    for (let x = g.x0; x < g.x1; x += 18 + Math.floor(R() * 24)) roofTier(c, x, sf - 28 - Math.floor(R() * 8), 24 + Math.floor(R() * 18), 4, T, .8, fog);
    hazeBottom(c, g.x0, g.x1, sf - 60, sf + 4, fog, 0, .62);
  }
  function kelp(c, x, base, h, T, z, R, fog, f) { const K = T.kelp.map(q => z ? haze(q, fog, z) : q); for (let j = 0; j < h; j++) { const xx = x + Math.round(Math.sin(j / 7 + x) * 2 + (f ? Math.sin(f / 10 + j / 8 + x) * (1 + j * .05) : 0)); rect(c, xx, base - j, 2, 1, j % 9 > 6 ? K[2] : K[1]); px(c, xx, base - j, K[2]); if (j % 6 === 3) { rect(c, xx + 2, base - j, 3, 1, K[1]); px(c, xx + 4, base - j - 1, K[2]); } if (j % 6 === 0) { rect(c, xx - 3, base - j - 1, 3, 1, K[0]); } } }
  function mid1(c, g, T, L) {
    const R = rnd(9), sf = L.sf, fog = T.fog, base = sf - 6;
    c.fillStyle = haze(T.stone[0], fog, .5); c.fillRect(g.x0, base - 4, g.x1 - g.x0, g.y1 - base + 4);
    let x = g.x0 + 6; while (x < g.x1) { const w = 36 + Math.floor(R() * 34), h = 18 + Math.floor(R() * 14), st = T.stone.map(q => haze(q, fog, .46)); rect(c, x, base - h, w, h, st[1]); rect(c, x, base - h, w, 1, st[2]); rect(c, x + w - 3, base - h, 3, h, st[0]); for (let i = 2; i < w - 4; i += 7) { rect(c, i + x, base - h + 5, 4, h - 5, st[0]); rect(c, i + x, base - h + 5, 1, h - 5, haze(T.red[1], fog, .46)); } roofTier(c, x + w / 2, base - h - 5, w + 10, 5, T, .46, fog); x += w + 12 + Math.floor(R() * 26); }
    for (let k = g.x0; k < g.x1; k += 24 + Math.floor(R() * 30)) kelp(c, k, base + 4, 20 + Math.floor(R() * 30), T, .5, R, fog);
    for (let k = g.x0; k < g.x1; k += 14 + Math.floor(R() * 20)) crown(c, k, base + 2, 4 + Math.floor(R() * 3), [haze(T.coral[0], fog, .4), haze(T.coral[1], fog, .4), haze(T.coral[2], fog, .4)], R);
    hazeBottom(c, g.x0, g.x1, base - 28, base + 3, fog, 0, .34);
  }
  function lion(c, x, base, s, T, z, R) {
    const fog = T.fog, st = T.stone.map(q => haze(q, fog, z)), kl = T.kelp.map(q => haze(q, fog, z));
    rect(c, x - 10 * s, base - 6 * s, 24 * s, 6 * s, st[1]); rect(c, x - 10 * s, base - 6 * s, 24 * s, 1, st[2]);
    ell(c, x, base - 16 * s, 9 * s, 10 * s, st[1]); ell(c, x - 2 * s, base - 18 * s, 6 * s, 7 * s, st[2]); ell(c, x + 2, base - 14 * s, 9 * s, 9 * s, st[0]); ell(c, x, base - 16 * s, 8 * s, 9 * s, st[1]);
    rect(c, x - 5 * s, base - 19 * s, 3 * s, 3 * s, st[0]); rect(c, x + 2 * s, base - 19 * s, 3 * s, 3 * s, st[0]); px(c, x - 4 * s, base - 18 * s, haze(T.glow[0], fog, z * .5)); px(c, x + 3 * s, base - 18 * s, haze(T.glow[0], fog, z * .5));
    rect(c, x - 4 * s, base - 11 * s, 9 * s, 4 * s, st[0]); for (let i = 0; i < 5; i++) px(c, x - 3 * s + i * 2, base - 10 * s, st[2]);
    for (let i = 0; i < 20; i++) { const sx = x - 8 * s + Math.floor(R() * 18 * s); crown(c, sx, base - 24 * s + Math.floor(R() * 14 * s), 2 + Math.floor(R() * 2), kl, R); }
  }
  function mid2(c, g, T, L) {
    const R = rnd(14), sf = L.sf, fog = T.fog, base = sf + 4, W = g.W;
    c.fillStyle = haze(T.sand[0], fog, .2); c.fillRect(g.x0, base, g.x1 - g.x0, g.y1 - base);
    lion(c, Math.round(W * .43), base + 2, 1.5, T, .2, R);
    for (let x = g.x0 + 20; x < g.x1; x += 58 + Math.floor(R() * 40)) { if (Math.abs(x - W * .43) < 40) continue; const h = 36 + Math.floor(R() * 30), st = T.stone.map(q => haze(q, fog, .2)); rect(c, x, base - h, 8, h, st[1]); rect(c, x, base - h, 2, h, st[2]); rect(c, x + 6, base - h, 2, h, st[0]); rect(c, x - 2, base - h - 2, 12, 3, st[2]); rect(c, x - 1, base - 4, 10, 4, st[1]); if (R() < .5) { c.clearRect(x - 2, base - h - 2, 12, 5); rect(c, x, base - h + 6 - 4, 8, 4, st[0]); } for (let j = 0; j < 8; j++) px(c, x + 1 + (j % 3) * 2, base - h + 4 + j * 4, haze(T.gold[1], fog, .2)); }
    for (let k = g.x0; k < g.x1; k += 8 + Math.floor(R() * 12)) { const hh = R(); if (hh < .25) kelp(c, k, base + 6, 16 + Math.floor(R() * 36), T, .3, R, fog); else crown(c, k, base + 4, 3 + Math.floor(R() * 4), [haze(T.coral2[0], fog, .14), haze(T.coral2[1], fog, .14), haze(T.coral2[2], fog, .14)], R); }
    hazeBottom(c, g.x0, g.x1, base - 24, base + 4, fog, 0, .22);
  }
  function pavilion(c, x, base, st, T, R) {
    const W2 = 44, wl = T.stone, rd = T.red, gd = T.gold, rf = T.roof, lit = T.mood !== 'day';
    rect(c, x - 3, base, W2 + 8, 2, 'rgba(0,0,0,.2)');
    if (st === 0) { for (const sx of [x, x + W2]) { rect(c, sx, base - 9, 1, 10, T.wood[1]); px(c, sx, base - 10, gd[2]); } for (let i = 0; i <= W2; i += 3) px(c, x + i, base - 4 + (i % 6 ? 0 : 1), '#d8c898'); rect(c, x + 16, base - 14, 1, 14, T.wood[1]); rect(c, x + 14, base - 15, 6, 3, T.sand[2]); }
    if (st < 5) { for (let k = 0; k < 4; k++) rect(c, x + W2 + 4, base - 1 - k, 9 - (k % 2), 1, k % 2 ? rf[1] : rf[0]); }
    if (st === 0) return;
    rect(c, x - 3, base - 4, W2 + 6, 4, wl[1]); rect(c, x - 3, base - 4, W2 + 6, 1, wl[2]); rect(c, x - 3, base - 1, W2 + 6, 1, wl[0]); for (let i = 0; i < W2 + 6; i += 5) px(c, x - 3 + i, base - 3, wl[0]);
    if (st === 1) return;
    const top = base - 4 - 17;
    for (const p of [0, 14, 29, W2 - 2]) { rect(c, x + p, top, 3, 17, rd[1]); rect(c, x + p, top, 1, 17, rd[2]); rect(c, x + p + 2, top, 1, 17, rd[0]); px(c, x + p + 1, top + 3, gd[1]); rect(c, x + p - 1, base - 6, 5, 2, wl[1]); }
    rect(c, x - 1, top, W2 + 4, 2, rd[0]); rect(c, x - 1, top + 2, W2 + 4, 1, gd[1]);
    if (st >= 3) { const hh = st === 3 ? 7 : 16; for (let j = 0; j < hh; j++) for (let i = 3; i < W2 - 2; i++) { if ([14, 15, 16, 29, 30, 31].includes(i)) continue; px(c, x + i, base - 5 - j, (i + j) % 9 === 0 ? wl[2] : j % 5 === 4 ? rd[0] : rd[1] === wl[1] ? wl[1] : T.sand[1]); } }
    if (st < 4) return;
    if (st === 4) { for (let k = 0; k < 6; k++) { rect(c, x - 3 + k * 3, top - k, 2, 1, T.wood[1]); rect(c, x + W2 + 2 - k * 3 - 1, top - k, 2, 1, T.wood[1]); } rect(c, x + W2 / 2 - 1, top - 8, 2, 8, T.wood[1]); return; }
    roofTier(c, x + W2 / 2 + 1, top - 5, W2 + 18, 6, T, 0, T.fog); roofTier(c, x + W2 / 2 + 1, top - 10, W2 - 4, 5, T, 0, T.fog); rect(c, x + W2 / 2, top - 17, 2, 7, gd[1]); px(c, x + W2 / 2, top - 18, gd[2]);
    if (st === 5) return;
    for (const wx of [5, 33]) { rect(c, x + wx, base - 16, 7, 11, lit ? '#ffe2a0' : T.jade[2]); rect(c, x + wx, base - 16, 7, 1, gd[1]); for (let k = 0; k < 3; k++) rect(c, x + wx + k * 3, base - 16, 1, 11, rd[0]); }
    rect(c, x + 17, base - 15, 10, 11, rd[0]); rect(c, x + 17, base - 15, 10, 1, gd[1]); rect(c, x + 21, base - 15, 1, 11, gd[1]); rect(c, x + 18, base - 12, 3, 3, gd[2]); rect(c, x + 23, base - 12, 3, 3, gd[2]);
    for (let i = 0; i < 3; i++) { rect(c, x - 4 + i * 20, top + 3, 1, 5, T.wood[1]); ell(c, x - 4 + i * 20, top + 10, 2, 3, rd[1]); px(c, x - 4 + i * 20, top + 9, gd[2]); }
    if (st === 6) return;
    for (let i = 0; i < 5; i++) { const fx = x + 2 + i * 9; px(c, fx, base - 5, T.kelp[1]); px(c, fx, base - 6, T.coral[i % 3 ? 1 : 2]); px(c, fx + 1, base - 5, T.kelp[2]); }
    for (let i = -10; i <= 12; i += 3) rect(c, x + W2 / 2 + i, top - 4, 1, 2, i % 6 ? gd[2] : '#ffffff');
  }
  function stage(c, g, T, L, st) {
    const R = rnd(11), W = g.W, sf = L.sf, x0 = g.x0, x1 = g.x1, base = sf + 4;
    for (let y = base - 4; y < g.y1; y++) { c.fillStyle = y < base - 2 ? T.sand[0] : mix(T.sand[1], T.sand[0], Math.min(1, (y - base) / 40)); c.fillRect(x0, y, x1 - x0, 1); }
    for (let y = base; y < g.y1; y++) for (let x = x0 + (y * 5) % 4; x < x1; x += 4) { const v = hsh(x, y, 2); if (v < .3) { c.fillStyle = v < .13 ? T.sand[0] : T.sand[2]; c.fillRect(x, y, 1, 1); } }
    for (let x = x0 + 4; x < x1; x += 9 + Math.floor(R() * 12)) { c.fillStyle = T.sand[0]; c.fillRect(x, base + 1 + Math.floor(R() * 5), 4 + Math.floor(R() * 5), 1); }
    for (let i = 0; i < 12; i++) { const bx = x0 + Math.floor(R() * (x1 - x0)), by = base + 4 + Math.floor(R() * (g.y1 - base - 6)); disk(c, bx, by, 1 + Math.floor(R() * 2), T.stone[R() < .5 ? 0 : 1]); }
    if (L.wide) { gate(c, L.gate.x, base - 1, 40, 44, T, 0, R); lantern(c, L.lan.x, base, T, R); lantern(c, L.lan.x + 62, base + 1, T, R); clam(c, L.clam.x, base + 6, T); urn(c, L.urn.x, base + 3, T); bell(c, L.bell.x, base + 1, T); }
    pavilion(c, L.house.x, base, st, T, R);
  }
  function lantern(c, x, base, T, R) { rect(c, x, base - 22, 4, 22, T.stone[1]); rect(c, x, base - 22, 1, 22, T.stone[2]); rect(c, x + 3, base - 22, 1, 22, T.stone[0]); rect(c, x - 3, base - 28, 10, 6, T.stone[1]); rect(c, x - 3, base - 28, 10, 1, T.stone[2]); rect(c, x - 1, base - 27, 6, 4, T.mood === 'day' ? T.jade[2] : '#c8fff0'); rect(c, x - 4, base - 31, 12, 3, T.roof[1]); rect(c, x - 4, base - 31, 12, 1, T.roof[2]); px(c, x + 1, base - 33, T.gold[2]); rect(c, x - 2, base - 3, 8, 3, T.stone[1]); }
  function clam(c, x, base, T) { ell(c, x, base - 4, 11, 5, T.coral[0]); ell(c, x, base - 5, 10, 4, T.coral[1]); for (let i = -8; i <= 8; i += 3) rect(c, x + i, base - 9, 1, 5, T.coral[0]); ell(c, x, base - 3, 8, 2, T.jade[0]); ell(c, x, base - 4, 5, 1, '#f4f8ff'); disk(c, x, base - 4, 2, '#ffffff'); px(c, x - 1, base - 5, '#ffffff'); }
  function urn(c, x, base, T) { ell(c, x, base - 8, 7, 9, T.red[0]); ell(c, x, base - 9, 6, 8, T.red[1]); rect(c, x - 4, base - 20, 8, 3, T.red[1]); rect(c, x - 5, base - 20, 10, 1, T.gold[1]); for (let j = 0; j < 3; j++) rect(c, x - 6 + j, base - 12 + j * 3, 12 - j * 2, 1, T.gold[1]); px(c, x - 4, base - 12, T.red[2]); px(c, x - 4, base - 11, T.red[2]); }
  function bell(c, x, base, T) { for (let j = 0; j < 14; j++) { const w = Math.round(9 + j * .5); rect(c, x - w, base - 14 + j, w * 2, 1, j < 2 ? T.gold[2] : T.gold[1]); px(c, x - w, base - 14 + j, T.gold[2]); px(c, x + w - 1, base - 14 + j, T.gold[0]); } rect(c, x - 14, base, 28, 2, T.gold[0]); rect(c, x - 5, base - 17, 10, 3, T.gold[0]); for (let i = 0; i < 4; i++) rect(c, x - 8 + i * 5, base - 9, 3, 1, T.gold[0]); for (let i = 0; i < 6; i++) px(c, x - 9 + i * 4, base - 3, T.kelp[1]); }

  /* ---------- plants ---------- */
  const PL = {
    kelp: (c, n, f, T) => kelp(c, n.x, n.y, n.h, T, 0, rnd(3), T.fog, f + n.kick * 6),
    fan: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick; for (let k = -6; k <= 6; k++) { const hh = 10 - Math.abs(k) * .7; for (let j = 0; j < hh; j++) px(c, n.x + k + Math.round(sw * j / 10 + k * j * .08), n.y - j - 3, (k + j) % 4 === 0 ? T.coral[2] : T.coral[1]); } rect(c, n.x - 1, n.y - 3, 3, 3, T.coral[0]); },
    brain: (c, n, f, T) => { ell(c, n.x, n.y - 4, 8, 5, T.coral2[0]); ell(c, n.x - 1, n.y - 5, 7, 4, T.coral2[1]); for (let k = -6; k <= 6; k += 2) rect(c, n.x + k, n.y - 7 + Math.abs(k) % 3, 1, 4, T.coral2[0]); px(c, n.x - 3, n.y - 8, T.coral2[2]); px(c, n.x - 2, n.y - 8, T.coral2[2]); },
    anemone: (c, n, f, T) => { rect(c, n.x - 3, n.y - 5, 7, 5, n.seed % 2 ? T.coral[0] : T.jade[0]); for (let k = -3; k <= 3; k++) { const hh = 8 + (k & 1) * 3; for (let j = 0; j < hh; j++) px(c, n.x + k + Math.round(Math.sin(f / 7 + j * .4 + k) * (.5 + j * .15) + n.kick * j * .2), n.y - 5 - j, j > hh - 3 ? T.glow[n.seed % 5] : (n.seed % 2 ? T.coral[1] : T.jade[1])); } },
    tube: (c, n, f, T) => { for (let k = -2; k <= 2; k++) { const hh = 7 + (k & 1) * 3; rect(c, n.x + k * 2, n.y - hh, 2, hh, T.sand[1]); const o = Math.round(Math.sin(f / 6 + k) * .6 + n.kick * 2); for (let d = -2; d <= 2; d++) px(c, n.x + k * 2 + 1 + d + o, n.y - hh - 1 - (Math.abs(d) < 2 ? 1 : 0), [T.glow[1], T.glow[2], T.glow[3]][(k + 2) % 3]); } },
    grass: (c, n, f, T) => { for (let k = -4; k <= 4; k++) { const hh = 8 + ((k * 5) & 3) * 2; for (let j = 0; j < hh; j++) px(c, n.x + k + Math.round(Math.sin(f / 9 + j * .3 + k * .5) * (j * .12) + n.kick * j * .15), n.y - j, j > hh - 3 ? T.kelp[2] : T.kelp[1]); } },
    lily: (c, n, f, T) => { const b = Math.round(Math.sin(f / 8 + n.x) * .7 + n.kick); rect(c, n.x, n.y - 14 + b, 1, 14 - b, T.kelp[1]); ell(c, n.x, n.y - 15 + b, 6, 2, T.jade[1]); for (const [dx, dy] of [[-2, -1], [2, -1], [0, -3], [-1, -2], [1, -2]]) px(c, n.x + dx, n.y - 16 + b + dy, dy < -1 ? '#ffd0f0' : T.glow[1]); px(c, n.x, n.y - 16 + b, '#ffffff'); },
    stag: (c, n, f, T) => { for (const [a, hh] of [[-5, 10], [0, 14], [5, 9]]) { for (let j = 0; j < hh; j++) { px(c, n.x + a + Math.round(j * a * .05 + Math.sin(f / 12 + j * .3) * (j * .04 + n.kick * .1)), n.y - j, j > hh - 3 ? T.coral2[2] : T.coral2[1]); if (j % 4 === 3) px(c, n.x + a + 1 + Math.round(j * a * .05), n.y - j - 1, T.coral2[1]); } } },
    lantern: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .6) + n.kick; rect(c, n.x, n.y - 16, 1, 16, T.kelp[0]); for (const [dx, dy] of [[-3, 10], [3, 7], [0, 14]]) { const lx = n.x + dx + Math.round(sw * .5), ly = n.y - dy; ell(c, lx, ly - 3, 2, 3, T.glow[(n.seed + dx) & 3 ? 3 : 4]); px(c, lx, ly - 3, '#ffffff'); rect(c, lx, ly, 1, 3, T.kelp[0]); } },
    pod: (c, n, f, T) => { rect(c, n.x, n.y - 9, 1, 9, T.kelp[1]); for (const [dx, dy, r] of [[0, 10, 3], [-3, 6, 2], [3, 5, 2]]) { disk(c, n.x + dx, n.y - dy, r, T.glow[0]); disk(c, n.x + dx, n.y - dy, r - 1, '#e8ffff'); px(c, n.x + dx - 1, n.y - dy - 1, '#ffffff'); } },
  };
  const PLN = { kelp: 'Kelp', fan: 'Sea fan', brain: 'Brain coral', anemone: 'Anemone', tube: 'Feather worms', grass: 'Eelgrass', lily: 'Glow lily', stag: 'Staghorn coral', lantern: 'Lantern weed', pod: 'Bubble pods' };
  const PLS = { kelp: ['rustle'], fan: ['chime', 4], brain: ['bloop'], anemone: ['bloop'], tube: ['chime', 6], grass: ['rustle'], lily: ['hum', 2], stag: ['glass', 3], lantern: ['glass', 5], pod: ['bloop'] };

  function build(g) {
    const W = g.W, H = g.H, T = g.T, L = g.L, R = rnd(51), sf = L.sf, base = sf + 4;
    const S = (id, o) => ECO.add(Object.assign({ id, kind: 'creature', hw: 8, hh: 8, magic: true }, o));
    ECO.begin(g, {
      pulse: '#bffcff', wave: '#8af0ff', bubble: { bg: '#07304f', edge: '#8af0ff', ink: ['#8af0ff', '#ff9ae0', '#ffe27a', '#b8a8ff', '#9affc8'] },
      sag: -6,
      link(c, l, at, f, G) {
        const a = l.a, b = l.b, len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(8, Math.round(len * .7));
        const hot = l.fl > .12, jelly_ = l.kind === 'talk'; if (!hot && jelly_) return; c.fillStyle = hot ? '#e8ffff' : T.glow[0];
        for (let i = 0; i <= n; i++) { const q = at(l, i / n); c.globalAlpha = hot ? .4 + l.fl * .6 : (l.kind === 'root' ? .22 : .12); if (!hot && i % 2) continue; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1;
      },
    });
    const gj = L.great;
    ECO.add({ id: 'spirit', kind: 'spirit', name: 'The Old Jelly', x: gj.x, y: gj.y, hw: gj.r * 1.1, hh: gj.r * .8, snd: 'whale', magic: true, say: ['eye', 'spiral', 'star', 'moon'], z: gj.y + 40, lift: gj.r * .4, noReflect: true,
      step(n, f) { n.y = gj.y + Math.sin(f / 22) * 3; n.x = gj.x + Math.sin(f / 61) * 6; },
      draw(c, n, f) { jelly(c, n.x, n.y, gj.r, J(JK.great, T), f, { pace: 12, tall: .82, tents: 11, len: 70, pat: n.fl }); jelly(c, n.x, n.y + 4, gj.r * .55, J(JK.great, T), f + 5, { pace: 12, tents: 5, len: 30, pat: n.fl }); },
      glow: { col: '#bfffff', r: 70, a: T.mood === 'night' ? .3 : .12, dy: 6 } });
    const homes = [];
    const H_ = (id, name, x, y, hw, hh, snd, glow) => { const n = ECO.add({ id, kind: 'home', name, x, y, hw, hh, lift: hh * 1.4, z: y, snd, draw() {}, glow }); homes.push(n); return n; };
    const hs = ECO.add({ id: 'house', kind: 'house', name: 'Your pavilion', x: L.house.x + 22, y: base - 1, hw: 28, hh: 17, lift: 30, z: base - 1, snd: 'gong', draw() {}, glow: () => (g.tk.stage() >= 6 ? { col: '#ffe2a0', r: 34, a: T.lit ? .55 : .12, dy: 12 } : null) }); homes.push(hs);
    if (L.wide) {
      H_('gate', 'Dragon gate', L.gate.x + 20, base - 4, 22, 22, 'gong', { col: '#8af0ff', r: 30, a: T.lit ? .35 : .08, dy: 22 });
      H_('lan0', 'Stone lantern', L.lan.x + 2, base - 4, 6, 14, 'glass', { col: '#9affc8', r: 26, a: T.lit ? .55 : .14, dy: 25 });
      H_('lan1', 'Stone lantern', L.lan.x + 64, base - 3, 6, 14, 'glass', { col: '#9affc8', r: 26, a: T.lit ? .55 : .14, dy: 25 });
      H_('clam', 'Giant clam', L.clam.x, base + 2, 11, 6, 'bloop', { col: '#ffffff', r: 16, a: .22, dy: 6 });
      H_('urn', 'Old urn', L.urn.x, base - 1, 7, 10, 'knock', null);
      H_('bell', 'Bronze bell', L.bell.x, base - 1, 12, 10, 'gong', null);
    }
    const plants = [];
    const P = (kind, x, y, o) => { const seed = Math.floor(R() * 9), nd = ECO.add(Object.assign({ id: kind + plants.length, kind: 'plant', pk: kind, name: PLN[kind], x, y, hw: kind === 'kelp' ? 5 : 7, hh: kind === 'kelp' ? 20 : 8, h: 20 + Math.floor(R() * 28), snd: PLS[kind][0], sndK: PLS[kind][1], seed, z: y - 1, draw: (c, n, f) => PL[kind](c, n, f, T) }, o || {})); plants.push(nd); return nd; };
    const fx = v => Math.round(W * v);
    P('kelp', fx(.02), base + 10, { h: 54 }); P('kelp', fx(.215), base + 8); P('kelp', fx(.5), base + 11); P('kelp', fx(.66), base + 7, { h: 44 }); P('kelp', fx(.985), base + 12, { h: 58 });
    P('fan', fx(.26), base + 6); P('fan', fx(.7), base + 10); P('fan', fx(.9), base + 5);
    P('brain', fx(.29), base + 12); P('brain', fx(.61), base + 9);
    P('anemone', fx(.33), base + 14); P('anemone', fx(.56), base + 15); P('anemone', fx(.87), base + 13);
    P('tube', fx(.24), base + 14); P('tube', fx(.74), base + 14); P('tube', fx(.46), base + 16);
    P('grass', fx(.38), base + 12); P('grass', fx(.8), base + 8); P('grass', fx(.58), base + 6);
    P('lily', fx(.4), base + 9); P('lily', fx(.83), base + 13);
    P('stag', fx(.69), base + 6); P('stag', fx(.3), base + 8);
    P('lantern', fx(.35), base + 5); P('lantern', fx(.78), base + 7);
    P('pod', fx(.52), base + 8); P('pod', fx(.92), base + 9);
    const sp = ECO.spirit();
    for (const h of homes) ECO.link(sp, h, { kind: 'root', sag: -8 });
    for (const p of plants) { let best = null, bd = 1e9; for (const h of homes) { const d = Math.hypot(h.x - p.x, (h.y - p.y) * 2); if (d < bd) { bd = d; best = h; } } if (best && bd < 70) ECO.link(best, p, { kind: 'vine', sag: -3 }); else ECO.link(sp, p, { kind: 'root', sag: -6 }); }
    mkCreatures(g, S, L, base, sp);
    ECO.autoLinks({ noRoots: true });
  }
  function mkCreatures(g, S, L, base, spirit) {
    const T = g.T, W = g.W, H = g.H, say = ['spiral', 'eye', 'star', 'wave', 'drop', 'moon', 'fish'];
    const jK = k => J(JK[k], T);
    /* three moon jellies drifting in a loose group, a lantern jelly, a pink one */
    [['moon', .3, .3, 7, 0], ['moon', .38, .45, 6, 2], ['violet', .5, .26, 7, 4], ['lantern', .6, .5, 10, 1], ['pink', .22, .5, 6, 3]].forEach(([k, bx, by, r, ph], i) => {
      S('jelly' + i, { name: k === 'lantern' ? 'Lantern jelly' : k === 'pink' ? 'Rose jelly' : k === 'violet' ? 'Violet jelly' : 'Moon jelly', x: W * bx, y: H * by, hw: r + 2, hh: r, bx: W * bx, by: H * by, ph, r, say, snd: 'hum', sndK: i * 2, z: H * by + 30, noReflect: true,
        step(n, f) { n.x = n.bx + Math.sin(f / 58 + n.ph) * 26; n.y = n.by + Math.sin(f / 33 + n.ph * 2) * 9; },
        talk(n) { n.pat = 1; }, draw(c, n, f) { n.pat = Math.max(0, (n.pat || 0) - .08); jelly(c, n.x, n.y, n.r, jK(k), f, { ph: n.ph, pace: 5 + i % 3, pat: Math.max(n.pat, n.fl) }); },
        glow: { col: ['#8af0ff', '#8af0ff', '#b8a8ff', '#ffc070', '#ff9ae0'][i], r: 18 + r, a: T.lit ? .38 : .1, dy: 4 } });
    });
    /* a comb jelly: a long oval with bands of colour running down it */
    S('comb', { name: 'Comb jelly', x: W * .12, y: H * .38, hw: 6, hh: 8, bx: W * .12, ph: 1.3, say, snd: 'glass', sndK: 4, z: H * .38 + 30, noReflect: true,
      step(n, f) { n.x = n.bx + Math.sin(f / 70 + n.ph) * 12; n.y = H * .38 + Math.sin(f / 41 + n.ph) * 8; },
      draw(c, n, f) { c.globalAlpha = .5; ell(c, n.x, n.y, 5, 9, '#d8f8ff'); c.globalAlpha = 1; for (let j = -8; j <= 8; j++) { const w = Math.round(5 * Math.sqrt(Math.max(0, 1 - (j / 9) * (j / 9)))), hue = ((j + f * 1.3) % 12 + 12) % 12; c.globalAlpha = .85; c.fillStyle = ['#ff8ad8', '#ffe27a', '#8af0ff', '#9affc8', '#b8a8ff', '#ffa8a8'][Math.floor(hue / 2)]; if (j % 3 === 0) { c.fillRect(n.x - w, n.y + j, w * 2 + 1, 1); } } c.globalAlpha = .8; c.fillStyle = '#ffffff'; c.fillRect(n.x, n.y - 9, 1, 18); c.globalAlpha = 1; }, glow: { col: '#ffd0f8', r: 20, a: T.lit ? .3 : .08, dy: 0 } });
    /* a siphonophore: a chain of lights as long as a street */
    S('siph', { name: 'Chain jelly', x: W * .7, y: H * .22, hw: 24, hh: 6, bx: W * .7, say, snd: 'hum', sndK: 3, z: H * .3, noReflect: true,
      step(n, f) { n.x = n.bx + Math.sin(f / 80) * 20; n.y = H * .24 + Math.sin(f / 47) * 6; },
      draw(c, n, f) { for (let i = 0; i < 18; i++) { const x = n.x - 36 + i * 4.2 + Math.sin(f / 9 + i * .5) * 1, y = n.y + Math.sin(i * .5 + f / 12) * 4; c.globalAlpha = .75; disk(c, Math.round(x), Math.round(y), i % 3 === 0 ? 2 : 1, i % 2 ? '#ffc8f0' : '#d8ffff'); c.globalAlpha = 1; if (i % 3 === 0) px(c, x, y, '#ffffff'); if (i % 4 === 1) { for (let t = 0; t < 4; t++) px(c, x, y + 2 + t, '#d8ffff'); } } }, glow: { col: '#ffc8f0', r: 26, a: T.lit ? .3 : .08, dy: 0 } });
    /* the old sea turtle, who has seen all of it */
    S('turtle', { name: 'Old turtle', x: W * .5, y: H * .6, hw: 14, hh: 8, bx: W * .5, say: ['moon', 'eye', 'spiral'], snd: 'whale', z: H * .6 + 20, noReflect: true, dd: 1,
      step(n, f) { const a = f * .012; n.x = W * .5 + Math.sin(a) * W * .3; n.dd = Math.cos(a) > 0 ? 1 : -1; n.y = H * .6 + Math.sin(f / 30) * 4; },
      draw(c, n, f) { const d = n.dd, x = n.x, y = Math.round(n.y), fl = Math.round(Math.sin(f / 5) * 3), K = { sh: [T.jade[0], T.jade[1], T.jade[2]], sk: T.sand[1] }; ell(c, x, y, 11, 6, K.sh[0]); ell(c, x - 1, y - 1, 10, 5, K.sh[1]); for (let k = -6; k <= 6; k += 4) { rect(c, x + k - 1, y - 4, 2, 7, K.sh[0]); } rect(c, x - 8, y - 1, 16, 1, K.sh[0]); px(c, x - 4, y - 4, K.sh[2]); px(c, x - 3, y - 4, K.sh[2]);
        ell(c, x + 12 * d, y - 1, 3, 2, K.sk); px(c, x + 13 * d, y - 2, '#101820'); rect(c, x - 13 * d, y + 1, 3 * d || 3, 1, K.sk); for (const s of [-1, 1]) { rect(c, x + (s * 6 + 4 * d) - 2, y + 4 + fl * s * .3, 5, 2, K.sk); rect(c, x - (s * 6) - 2, y + 4 - fl * s * .3, 4, 2, K.sk); } } });
    /* a seahorse who has anchored to a stalk of kelp */
    S('horse', { name: 'Seahorse', x: W * .215 + 3, y: base - 18, hw: 4, hh: 7, say, snd: 'chirp', z: base + 8, noReflect: true,
      draw(c, n, f) { const x = n.x, y = Math.round(n.y + Math.sin(f / 9) * 1.2); for (const [dx, dy, col] of [[0, 0, '#ffb04a'], [1, 1, '#ffb04a'], [1, 2, '#ff8a3a'], [0, 3, '#ff8a3a'], [0, 4, '#ffb04a'], [1, 5, '#ff8a3a'], [2, 6, '#ffb04a'], [1, 7, '#ff8a3a'], [0, 8, '#ffb04a']]) { rect(c, x + dx, y + dy, 2, 1, col); } rect(c, x - 1, y - 1, 3, 2, '#ffd27a'); rect(c, x + 2, y, 2, 1, '#ffd27a'); px(c, x, y - 1, '#101820'); px(c, x + 3, y + 1 + 1, '#ff8a3a'); px(c, x - 1, y + 1, '#ffe27a'); } });
    /* a crab that wears a temple bell as a hat */
    S('crab', { name: 'Bell crab', x: W * .45, y: base + 12, hw: 7, hh: 6, say: ['bell', 'drop', 'star'], snd: 'jingle', z: base + 11, noReflect: true, dd: 1, x0: W * .4, x1: W * .52,
      step(n, f) { if (n.fl < .3 && f % 2 === 0) { n.x += n.dd * .9; if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), o = '#d8582a', l = '#f0845a'; ell(c, x, y - 3, 6, 3, o); ell(c, x - 1, y - 4, 5, 2, l); for (let k = 0; k < 3; k++) { rect(c, x - 8 + (f % 2) * (k % 2), y - 2 + k, 3, 1, o); rect(c, x + 6 - (f % 2) * (k % 2), y - 2 + k, 3, 1, o); } rect(c, x - 9, y - 7, 3, 3, o); rect(c, x + 7, y - 7, 3, 3, o); px(c, x - 3, y - 7, '#101820'); px(c, x + 3, y - 7, '#101820'); rect(c, x - 3, y - 6, 1, 2, o); rect(c, x + 3, y - 6, 1, 2, o); for (let j = 0; j < 5; j++) rect(c, x - 3 + (j > 3 ? -1 : 0), y - 13 + j, 7 + (j > 3 ? 2 : 0), 1, j === 0 ? T.gold[2] : T.gold[1]); px(c, x, y - 8, T.gold[0]); } });
    /* an octopus in the old urn, curious about everything */
    S('octo', { name: 'Urn octopus', x: L.wide ? L.urn.x : W * .6, y: base - 1, hw: 8, hh: 12, say, snd: 'bloop', z: base + 3, noReflect: true,
      draw(c, n, f) { const x = n.x, y = n.y - 19, peek = Math.round(Math.sin(f / 15) * 2 + 2), col = [T.coral[0], T.coral[1], T.coral[2]], eye = f % 60 < 3 ? col[0] : '#ffffff'; for (let j = 0; j < 4 + peek; j++) { const w = 4 - (j > 2 + peek - 2 ? 1 : 0); rect(c, x - w, y - j, w * 2, 1, j < 2 ? col[2] : col[1]); } for (let t = 0; t < 3; t++) { for (let j = 0; j < 8; j++) px(c, x - 5 + t * 5 + Math.round(Math.sin(f / 6 + j * .6 + t) * (1 + j * .2)), y + 1 + j, j > 6 ? col[2] : col[1]); } px(c, x - 2, y - 2 - peek + 2, eye); px(c, x + 1, y - 2 - peek + 2, eye); px(c, x - 2, y - 1 - peek + 2, '#101820'); px(c, x + 1, y - 1 - peek + 2, '#101820'); }, glow: { col: '#ff9ac0', r: 14, a: T.lit ? .25 : .05, dy: 14 } });
    /* a school of golden carp */
    S('carp', { name: 'Golden carp', x: W * .3, y: H * .66, hw: 14, hh: 8, magic: false, say: ['fish', 'drop', 'wave'], snd: 'splash', z: H * .66 + 10, noReflect: true, dd: 1,
      step(n, f) { const a = f * .02; n.x = W * .5 + Math.sin(a) * W * .38; n.y = H * .68 + Math.sin(a * 2.3) * 8; n.dd = Math.cos(a) > 0 ? 1 : -1; },
      draw(c, n, f) { for (let i = 0; i < 6; i++) { const d = n.dd, x = Math.round(n.x - d * (i % 3) * 9 - d * Math.floor(i / 3) * 5), y = Math.round(n.y + (i % 3) * 4 - Math.floor(i / 3) * 6 + Math.sin(f / 4 + i) * 1), tw = Math.round(Math.sin(f * .9 + i)); for (let j = -3; j <= 3; j++) { const w = Math.round(1.7 * Math.sqrt(Math.max(0, 1 - (j / 3.4) * (j / 3.4)))); rect(c, x + j * d, y - w, 1, w * 2 + 1, j > 0 ? '#ffb040' : '#ff8a30'); } rect(c, x - 4 * d, y - 1 + tw, 2, 3, '#ff8a30'); px(c, x + 2 * d, y - 1, '#101820'); px(c, x + 1 * d, y - 2, '#ffe27a'); } } });
    /* a manta, flying slowly through the court */
    S('manta', { name: 'Manta', x: W * .6, y: H * .42, hw: 18, hh: 6, say: ['wave', 'moon'], snd: 'whale', z: H * .45, noReflect: true, dd: 1,
      step(n, f) { const a = f * .008 + 2; n.x = W * .5 + Math.sin(a) * W * .5; n.y = H * .46 + Math.sin(f / 17) * 3; n.dd = Math.cos(a) > 0 ? 1 : -1; },
      draw(c, n, f) { const x = Math.round(n.x), y = Math.round(n.y), fl = Math.round(Math.sin(f / 6) * 4), d = n.dd, K = ['#1c3458', '#3a5c8a', '#e8f4ff']; for (let i = -16; i <= 16; i++) { const w = Math.max(0, 5 - Math.abs(i) * .26), wy = Math.round(Math.abs(i) * .35 * -fl / 3 - Math.abs(i) * .1); rect(c, x + i, y + wy - Math.round(w / 2), 1, Math.round(w) + 1, K[1]); if (Math.abs(i) < 9) px(c, x + i, y + wy + Math.round(w / 2) + 1, K[2]); } rect(c, x - 2, y - 2, 5, 5, K[1]); rect(c, x - 2 * d, y + 3, 1, 6, K[0]); for (let k = 0; k < 5; k++) px(c, x - d * (2 + k), y + 1 + k, K[0]); px(c, x + 2 * d, y - 1, '#ffffff'); } });
  }

  VISTA.reg('sea', {
    stageK: .55, eco: true,
    pal(mood) { return pal(mood); },
    layout(g) {
      const W = g.W, H = g.H, wide = W > 210, sf = Math.round(H * .76);
      g.L = { W, H, wide, sf, house: { x: wide ? Math.round(W * .04) : 2, y: sf + 4 } };
      g.L.gate = { x: Math.round(W * .43) }; g.L.lan = { x: Math.round(W * .32) }; g.L.clam = { x: Math.round(W * .595) }; g.L.urn = { x: Math.round(W * .66) }; g.L.bell = { x: Math.round(W * .245) };
      const r = wide ? Math.round(W * .085) : Math.round(W * .2); g.L.great = { x: wide ? Math.round(W * .78) : Math.round(W * .62), y: Math.round(H * .33), r };
      g.L.fairies = []; ECO.end(); build(g);
    },
    rays(g) { const W = g.W, out = []; for (let i = 0; i < 7; i++) out.push({ x: W * (.02 + i * .15) + (i % 2) * 10, w: 7 + (i * 5) % 9, sk: .22, a: g.T.shaftA * (g.mood === 'night' ? .4 : .85), d: i * 1.7, col: g.T.shaft }); return out; },
    weather: { dir: 'up', cols: ['#e8ffff', '#bffcff', '#ffffff'], glow: true, depths: [{ n: 10, size: 1, dur: 30, z: 1, seed: 6, op: .8 }, { n: 4, size: 2, dur: 18, z: 3, seed: 3, op: .7, blur: 1 }] },
    layers(g) {
      const T = g.T, L = g.L, st = () => g.tk.stage(), sf = L.sf;
      return [
        { id: 'water', k: .04, paint: (c, g2) => water(c, g2, T, L) },
        { id: 'far', k: .1, blur: 1.4, paint: (c, g2) => far(c, Object.assign({ W: g.W }, g2), T, L) },
        { id: 'mid1', k: .22, blur: .7, paint: (c, g2) => mid1(c, g2, T, L) },
        { id: 'mid2', k: .38, paint: (c, g2) => mid2(c, Object.assign({ W: g.W }, g2), T, L) },
        { id: 'stage', k: .55, stage: true, live: true, paint: (c, g2) => stage(c, Object.assign({ W: g.W }, g2), T, L, st()), live(c, f, g2) { ECO.draw(c, f, g2); } },
        { id: 'near', k: .95, paint(c, g2) {
          const Rr = rnd(37), base = sf + 14;
          for (const x of [g2.x0 + 6, g2.x1 - 10]) { kelp(c, x, g.H + 10, Math.round(g.H * .95), T, 0, Rr, T.fog, 0); kelp(c, x + 7, g.H + 10, Math.round(g.H * .65), T, 0, Rr, T.fog, 0); }
        } },
        { id: 'fg', k: 1.8, blur: 2.8, op: .85, paint(c, g2) { const Rr = rnd(7); for (let i = 0; i < 10; i++) { const x = g2.x0 + Math.floor(Rr() * (g2.x1 - g2.x0)), y = Math.floor(Rr() * g.H), r = 2 + Math.floor(Rr() * 4); c.globalAlpha = .5; disk(c, x, y, r, '#e8ffff'); disk(c, x, y, Math.max(1, r - 1), T.water[1]); px(c, x - 1, y - 1, '#ffffff'); c.globalAlpha = 1; } } },
      ];
    },
    lights(f, g) {
      const T = g.T, L = g.L, n = g.mood === 'night', out = [];
      for (let i = 0; i < 6; i++) out.push({ x: ((i * 61 + f * .6) % (g.W + 60)) - 20, y: L.sf + 8 + (i % 3) * 7, r: 40, col: '#cfffff', a: n ? .05 : .12 + Math.sin(f / 9 + i) * .04 });
      out.push({ x: g.W * .5, y: 6, r: 120, col: '#ffffff', a: n ? .1 : .22 });
      return out;
    },
  });
})();
