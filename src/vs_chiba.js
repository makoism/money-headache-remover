/* ---------- Chiba, After: the overgrown ruins of Chiba, Japan, and the cats who kept the lights on ----------
   Back to front: a big painterly sky with cumulus; the bay with the glass tower of the port and a skyline gone to green; long danchi
   apartment blocks drowned in ivy; the suspended monorail with one car stopped forever mid-span; the stage (a sidewalk with a konbini,
   vending machines, a torii, utility poles and the house you are building, in front of a flooded street that mirrors all of it); poles,
   cables and kudzu close by; and big blurred pampas almost on the glass. The Spirit is the Great Cat, a hill that breathes. The wires
   are the realm's nerves: messages (glyphs) run along them between cats, machines, plants and the hill. The cats have strange physics. */
(() => {
  const V = window.__VSET, MC = V.moodCol, { mix, rnd, hsh, n1, px, rect, disk, ell, soft, vgrad, hazeBottom, haze, crown, cloud, reflect } = VG;
  const SKY = { morning: ['#86bde6', '#c8e2f0', '#ffd6b4', '#ffe8c8'], day: ['#3b88de', '#68b0ec', '#a6d6f4', '#d6eef8'], sunset: ['#2f2f80', '#8a4a98', '#ee7c5c', '#ffc27a'], night: ['#040920', '#0a1642', '#162a5a', '#26386a'] };
  const FOG = { morning: '#ecddc8', day: '#c6e4ee', sunset: '#eaa098', night: '#1a2a58' };
  const RAMPS = {
    conc: ['#66727a', '#a2aeb2', '#d8ded8'], ivy: ['#143a2a', '#2c7640', '#84c456'], leaf: ['#1c5a3c', '#3c9a50', '#a8dc6a'], roof: ['#26364a', '#46607c', '#88a6be'], wood: ['#38261a', '#6a4830', '#a47a4a'],
    rust: ['#58301e', '#a05434', '#d88c58'], red: ['#681a1a', '#c4322a', '#f47a54'], water: ['#2a7490', '#5cb4c8', '#cdeff0'], glass: ['#2a4a62', '#6aa4be', '#e4fbff'], asph: ['#323c46', '#4e5d68', '#78888f'],
    plas: ['#b8b4a0', '#e6e2d0', '#ffffff'], teal: ['#1c6a68', '#2aa49a', '#8ae8d4'],
  };
  const pal = mood => { const T = { mood }, m = c => MC(c, mood); T.sky = SKY[mood].slice(); T.fog = FOG[mood]; for (const k in RAMPS) T[k] = RAMPS[k].map(m); T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .55 : 0; T.warm = '#ffd88a'; T.cloud = ['#9ab4d4', '#eef4fa', '#ffffff'].map(m); T.shaft = mood === 'sunset' ? '#ffc888' : '#fff2c8'; T.shaftA = ({ morning: .2, day: .13, sunset: .22, night: .05 })[mood]; return T; };

  /* ---------- cats ----------
     A cat is a few shaded blobs: body, head, ears, tail. Poses: sit, loaf, walk. They face right and mirror with d = -1. */
  const COATS = {
    calico: { r: ['#7a4a2a', '#e8a860', '#fff0d8'], alt: ['#14141c', '#2c2c3a', '#58587a'], alt2: ['#c8c8c8', '#f4f0e8', '#ffffff'], eye: '#80d870', w: '#fff4e0', nose: '#e88a8a' },
    tabby: { r: ['#8a4618', '#e08a38', '#ffc878'], alt: ['#6a300e', '#b8601e', '#e8a050'], eye: '#ffe27a', w: '#fff0d0', nose: '#e88a8a' },
    black: { r: ['#07070e', '#1c1c2a', '#464668'], eye: '#ffd24a', w: '#2c2c40', nose: '#6a4a5a' },
    grey: { r: ['#3e444e', '#848c98', '#c4cad2'], alt: ['#2c323a', '#626a76', '#9aa2ae'], eye: '#9ae8ff', w: '#e8ecf0', nose: '#e8a0a8' },
    white: { r: ['#98a4bc', '#eaeff6', '#ffffff'], eye: '#8ad8ff', w: '#ffffff', nose: '#f0a0b0' },
    siam: { r: ['#a08a74', '#eadcc4', '#fff8ec'], alt: ['#1c1816', '#3a302c', '#665850'], eye: '#7ac0ff', w: '#fff8ec', nose: '#6a4a4a' },
    shade: { r: ['#10141c', '#10141c', '#10141c'], eye: '#10141c', w: '#10141c', nose: '#10141c' },
  };
  COATS.calico.pat = (X, Y) => { const h = hsh(Math.floor(X / 4), Math.floor(Y / 3), 9); return h < .28 ? COATS.calico.alt : h < .5 ? COATS.calico.alt2 : null; };
  COATS.tabby.pat = (X, Y) => ((X + Y * 2) % 5 === 0 ? COATS.tabby.alt : null);
  COATS.grey.pat = (X, Y) => ((X * 2 + Y) % 6 === 0 ? COATS.grey.alt : null);
  COATS.siam.pat = (X, Y, b) => (b === 'head' || b === 'tail' || b === 'leg' ? COATS.siam.alt : null);
  function blob(c, cx, cy, rx, ry, K, b, nout) {
    const R = K.r, o = mix(R[0], '#000000', .4);
    if (!nout) ell(c, Math.round(cx), Math.round(cy), Math.round(rx) + 1, Math.round(ry) + 1, o);
    const X0 = Math.round(cx), Y0 = Math.round(cy), rxx = Math.max(1, Math.round(rx)), ryy = Math.max(1, Math.round(ry));
    for (let j = -ryy; j <= ryy; j++) { const w = Math.round(rxx * Math.sqrt(Math.max(0, 1 - (j * j) / (ryy * ryy + .01)))); for (let i = -w; i <= w; i++) { const t = -((i / (rxx + .5)) * .55 + (j / (ryy + .5)) * .85), rr = (K.pat && K.pat(X0 + i, Y0 + j, b)) || R; c.fillStyle = t > .42 ? rr[2] : t < -.28 ? rr[0] : rr[1]; c.fillRect(X0 + i, Y0 + j, 1, 1); } }
  }
  /* o: x,y (feet centre), d (1 right, -1 left), pose, K, s (scale), f, tail (phase), shut (eyes closed), a (alpha), inv (upside down), step (legs), glow */
  function cat(c, o) {
    const d = o.d || 1, K = o.K, s = o.s || 1, x = o.x, y = o.y, f = o.f || 0, R = K.r;
    c.save(); if (o.a != null) c.globalAlpha = o.a; if (o.inv) { c.translate(0, Math.round(y) * 2); c.scale(1, -1); }
    const B = (cx, cy, rx, ry, b) => blob(c, x + d * cx * s, y + cy * s, rx * s, ry * s, K, b);
    const P = (dx, dy, w, h, col) => { const ww = Math.max(1, Math.round(w * s)), hh = Math.max(1, Math.round(h * s)); rect(c, d > 0 ? x + dx * s : x - dx * s - ww + 1, y + dy * s, ww, hh, col); };
    const tail = (pts, col) => { for (let i = 0; i < pts.length; i++) { const p = pts[i]; P(p[0], p[1], 2, 2, i === pts.length - 1 ? R[0] : col); } };
    const eyes = (ex, ey, gap) => { if (o.shut) { P(ex, ey + 1, 2, 1, R[0]); P(ex + gap, ey + 1, 2, 1, R[0]); } else { P(ex, ey, 1, 2, K.eye); P(ex + gap, ey, 1, 2, K.eye); if (o.glow) { P(ex, ey, 1, 1, '#ffffff'); P(ex + gap, ey, 1, 1, '#ffffff'); } } };
    const ph = o.tail == null ? f / 5 : o.tail;
    if (o.pose === 'sit') {
      const tp = []; for (let i = 0; i < 7; i++) tp.push([-4 - i * .7 - Math.sin(i * .5 + ph) * 1.4, -1 - i * .35 - Math.pow(i / 6, 2) * 4]); tail(tp, R[1]);
      B(0, -5.5, 4.3, 5.5); P(0.6, -3, 2, 3, R[1]); P(0.6, -1, 2, 1, K.w); P(2.8, -1, 2, 1, K.w);
      B(1.6, -12.5, 4, 3.6, 'head'); P(-1.2, -17, 2, 2, R[1]); P(-.7, -18, 1, 1, R[0]); P(3.6, -17, 2, 2, R[1]); P(4.2, -18, 1, 1, R[0]); P(-.6, -16, 1, 1, K.nose); P(4.4, -16, 1, 1, K.nose);
      eyes(.4, -13.5, 3); P(4.6, -11, 1, 1, K.nose);
    } else if (o.pose === 'loaf') {
      P(-9, -3, 3, 2, R[0]); B(-1, -4, 7.6, 4.2); B(6.6, -6, 3.6, 3.3, 'head'); P(4.4, -10, 2, 2, R[1]); P(4.8, -11, 1, 1, R[0]); P(7.4, -10, 2, 2, R[1]); P(8, -11, 1, 1, R[0]); eyes(6.2, -6.8, 3); P(9.6, -5, 1, 1, K.nose); P(8, -1, 4, 1, K.w);
    } else {
      const st = o.step == null ? f : o.step, a = st % 2 ? 1 : -1;
      const tp = []; for (let i = 0; i < 8; i++) tp.push([-7 - Math.sin(i * .35) * 1.2 - i * .15, -8 - i * 1.1 + Math.sin(i * .5 + ph) * 1.2]); tail(tp, R[1]);
      P(-5.5 + a, -4, 1.6, 4, R[0]); P(3.6 - a, -4, 1.6, 4, R[0]); B(0, -7, 6, 3.3); P(-4.5 - a, -4, 1.6, 4, R[1]); P(4.8 + a, -4, 1.6, 4, R[1]); P(5.2 + a, -1, 2, 1, K.w);
      B(7, -10.2, 3.3, 3, 'head'); P(5, -13.5, 2, 2, R[1]); P(5.4, -14.5, 1, 1, R[0]); P(8, -13.5, 2, 2, R[1]); P(8.6, -14.5, 1, 1, R[0]); eyes(6.6, -11, 2.6); P(10, -9, 1, 1, K.nose);
    }
    c.restore();
  }

  /* ---------- painters ---------- */
  function sky(c, g, T, L) {
    const W = g.W, hz = L.hz, R = rnd(5);
    vgrad(c, g.x0, g.x1, g.y0, hz + 1, T.sky); rect(c, g.x0, hz, g.x1 - g.x0, g.y1 - hz, T.sky[3]);
    if (T.mood === 'night') { for (let i = 0; i < 120; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = g.y0 + Math.floor(R() * hz * .85); px(c, x, y, R() > .85 ? '#ffffff' : '#8fa4d8'); } const mx = Math.round(W * .2); disk(c, mx, 30, 8, '#f4f2dc'); disk(c, mx + 3, 28, 7, T.sky[1]); disk(c, mx - 2, 33, 1, '#d8d8c0'); }
    else if (T.mood === 'sunset') { disk(c, Math.round(W * .24), hz - 10, 9, '#fff0b0'); disk(c, Math.round(W * .24), hz - 10, 6, '#ffffe0'); }
    else if (T.mood === 'morning') { disk(c, Math.round(W * .78), hz - 14, 8, '#fff4cc'); disk(c, Math.round(W * .78), hz - 14, 5, '#ffffff'); }
    else { disk(c, Math.round(W * .3), Math.round(hz * .28), 7, '#fffbe4'); disk(c, Math.round(W * .3), Math.round(hz * .28), 4, '#ffffff'); }
    const n = Math.round((g.x1 - g.x0) / 38);
    for (let i = 0; i < n; i++) { const u = R(), y = Math.round(hz * (.18 + u * .72)), w = Math.round(30 + u * 70 + R() * 30), x = g.x0 + Math.round((i + R() * .8) / n * (g.x1 - g.x0)); cloud(c, x, y, w, Math.round(6 + u * 9), T.cloud, R); }
    if (T.mood === 'night') { c.globalAlpha = .55; rect(c, g.x0, hz - 6, g.x1 - g.x0, 8, T.sky[3]); c.globalAlpha = 1; }
  }
  /* the bay and what is left of the skyline */
  function tower(c, x, base, w, h, T, z, R, lit) {
    const body = haze(T.conc[1], T.fog, z), dk = haze(T.conc[0], T.fog, z), lt = haze(T.conc[2], T.fog, z), win = haze(T.glass[0], T.fog, z * .9), wl = haze(T.warm, T.fog, z * .5);
    rect(c, x, base - h, w, h, body); rect(c, x, base - h, 1, h, lt); rect(c, x + w - 1, base - h, 1, h, dk);
    for (let y = base - h + 3; y < base - 2; y += 3) for (let i = x + 2; i < x + w - 2; i += 3) px(c, i, y, hsh(i, y, 7) < lit ? wl : win);
    const nw = Math.max(3, Math.round(w * .35)); c.clearRect(x + Math.round(w * .45), base - h - 1, nw, 3 + Math.floor(R() * 4)); crown(c, x + Math.round(w * .3), base - h, 3 + Math.floor(R() * 2), [haze(T.ivy[0], T.fog, z), haze(T.ivy[1], T.fog, z), haze(T.ivy[2], T.fog, z)], R);
  }
  function portTower(c, x, base, h, T, z) {
    const S = [haze(T.glass[0], T.fog, z), haze(T.glass[1], T.fog, z), haze(T.glass[2], T.fog, z)];
    for (let y = 0; y < h; y++) { const u = y / h, w = Math.round(1 + (u < .42 ? u / .42 : (1 - u) / .58) * 7 * (u > .9 ? .3 : 1)); rect(c, x - w, base - y, w * 2 + 1, 1, S[1]); px(c, x - w, base - y, S[2]); px(c, x + w, base - y, S[0]); if (y % 7 === 0) rect(c, x - w, base - y, w * 2 + 1, 1, S[0]); }
    rect(c, x, base - h - 6, 1, 7, S[0]); px(c, x, base - h - 6, '#ff6a5a');
  }
  function far(c, g, T, L) {
    const W = g.W, hz = L.hz, fog = T.fog, R = rnd(3), z = .62;
    for (let y = hz; y < hz + 16; y++) { const u = (y - hz) / 16; c.fillStyle = mix(haze(T.water[2], fog, .25), haze(T.water[1], fog, .35), u); c.fillRect(g.x0, y, g.x1 - g.x0, 1); }
    for (let i = 0; i < 110; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = hz + 1 + Math.floor(R() * 13); rect(c, x, y, 2 + Math.floor(R() * 5), 1, haze(T.water[2], fog, .1)); }
    c.fillStyle = haze(T.ivy[0], fog, z + .05); c.fillRect(g.x0, hz + 14, g.x1 - g.x0, g.y1 - hz - 14);
    for (let x = g.x0; x < g.x1; x += 8 + Math.floor(R() * 14)) { const w = 6 + Math.floor(R() * 9), h = 16 + Math.floor(R() * 30); tower(c, x, hz + 15, w, h, T, z, R, T.lit * .5); x += w; }
    portTower(c, Math.round(W * .58), hz + 15, 62, T, .45);
    for (let i = 0; i < 4; i++) { const x = g.x0 + 10 + i * 34, cr = haze(T.rust[0], fog, .55); rect(c, x, hz - 10, 1, 25, cr); rect(c, x + 8, hz - 10, 1, 25, cr); rect(c, x - 3, hz - 11, 22, 1, cr); rect(c, x + 14, hz - 6, 1, 6, cr); }
    hazeBottom(c, g.x0, g.x1, hz + 4, hz + 26, fog, 0, .7);
  }
  /* danchi: long concrete blocks, balconies, ivy */
  function danchi(c, x, base, w, h, T, z, R, o) {
    const fog = T.fog, h_ = col => haze(col, fog, z), body = h_(T.conc[1]), slab = h_(T.conc[2]), dk = h_(T.conc[0]), win = h_(T.glass[0]), wl = h_(T.warm);
    rect(c, x, base - h, w, h, body); rect(c, x, base - h, w, 1, slab); rect(c, x + w - 2, base - h, 2, h, dk);
    for (let y = base - h + 2, k = 0; y < base - 6; y += 7, k++) {
      rect(c, x, y + 5, w, 2, slab); rect(c, x, y + 7, w, 1, dk);
      for (let i = x + 2; i < x + w - 6; i += 6) { const lit = hsh(i, k, 3) < T.lit * .3; rect(c, i, y + 1, 4, 3, lit ? wl : win); if (!lit) px(c, i, y + 1, h_(T.glass[1])); rect(c, i - 1, y + 4, 6, 1, dk); }
    }
    const sx = x + (o.stair || 0); rect(c, sx, base - h, 5, h, dk); for (let y = base - h + 4; y < base - 3; y += 7) rect(c, sx + 2, y, 1, 4, win);
    if (o.collapse) { const cw = Math.round(w * .2), ch = Math.round(h * .22); for (let i = 0; i < cw; i++) c.clearRect(x + w - cw + i, base - h, 1, Math.round(ch * (1 - i / cw) + R() * 4)); }
    const iv = [h_(T.ivy[0]), h_(T.ivy[1]), h_(T.ivy[2])];
    for (let i = x; i < x + w; i += 4 + Math.floor(R() * 5)) crown(c, i, base - h + 1, 3 + Math.floor(R() * 3), iv, R);
    for (let i = 0; i < w / 6; i++) { const sx2 = x + 3 + Math.floor(R() * (w - 6)), len = 6 + Math.floor(R() * h * .7); for (let j = 0; j < len; j++) { px(c, sx2 + Math.round(Math.sin(j / 4 + i) * 1.2), base - h + 3 + j, j % 5 === 4 ? iv[2] : j % 3 === 0 ? iv[0] : iv[1]); if (j % 4 === 2) px(c, sx2 + 1 + Math.round(Math.sin(j / 4 + i)), base - h + 3 + j, iv[1]); } }
    for (let i = 0; i < w / 3; i++) { const rx = x + 2 + Math.floor(R() * (w - 4)), ry = base - h + 6 + Math.floor(R() * (h - 10)); rect(c, rx, ry, 1, 3 + Math.floor(R() * 5), dk); }
    if (o.trees) for (let i = 0; i < 2; i++) { const tx = x + 8 + Math.floor(R() * (w - 16)); rect(c, tx, base - h - 8, 2, 9, h_(T.wood[1])); crown(c, tx, base - h - 9, 6, iv, R); }
  }
  /* the suspended monorail: a girder on pylons, one car hanging from it, stopped for good */
  function monorail(c, g, T, L, R) {
    const yb = L.rail, W = g.W, cc = [T.conc[0], T.conc[1], T.conc[2]], iv = T.ivy;
    for (let x = g.x0 + 40; x < g.x1; x += 112) { rect(c, x, yb, 6, L.hz + 30 - yb, cc[1]); rect(c, x, yb, 1, L.hz + 30 - yb, cc[2]); rect(c, x + 5, yb, 1, L.hz + 30 - yb, cc[0]); rect(c, x - 3, yb - 2, 12, 4, cc[1]); for (let j = 0; j < 8; j++) { px(c, x + 2 + Math.round(Math.sin(j) * 2), yb + 6 + j * 7, iv[1]); px(c, x + 3, yb + 7 + j * 7, iv[2]); } }
    rect(c, g.x0, yb - 3, g.x1 - g.x0, 5, cc[1]); rect(c, g.x0, yb - 3, g.x1 - g.x0, 1, cc[2]); rect(c, g.x0, yb + 2, g.x1 - g.x0, 1, cc[0]);
    for (let x = g.x0; x < g.x1; x += 7) px(c, x, yb - 2, cc[0]);
    const cx = Math.round(W * .36), w = 40, top = yb + 4;
    for (let i = 0; i < 4; i++) rect(c, cx + 5 + i * 10, yb + 2, 2, 4, T.rust[0]);
    rect(c, cx, top + 3, w, 14, T.plas[1]); rect(c, cx, top + 3, w, 1, T.plas[2]); rect(c, cx, top + 16, w, 1, T.plas[0]); rect(c, cx + w - 1, top + 3, 1, 14, T.plas[0]); rect(c, cx, top + 12, w, 2, T.teal[1]);
    for (let i = 0; i < 6; i++) { const wx = cx + 3 + i * 6, bust = i === 2 || i === 4; rect(c, wx, top + 5, 4, 5, T.glass[bust ? 0 : 1]); px(c, wx, top + 5, T.glass[2]); if (bust) { px(c, wx + 1, top + 7, T.glass[0]); px(c, wx + 2, top + 8, T.glass[2]); } }
    rect(c, cx + 1, top + 3, 3, 13, T.teal[0]); rect(c, cx + w - 4, top + 5, 2, 11, T.plas[0]);
    for (let x = cx; x < cx + w; x += 3 + Math.floor(R() * 3)) crown(c, x, top + 3, 3 + Math.floor(R() * 2), iv, R);
    for (let i = 0; i < 9; i++) { const sx = cx + 2 + Math.floor(R() * (w - 4)), len = 4 + Math.floor(R() * 12); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 3 + i)), top + 14 + j, j % 4 === 3 ? iv[2] : j % 2 ? iv[1] : iv[0]); }
    const ex = g.x0 + Math.round(W * .06); c.clearRect(g.x0, yb - 3, ex - g.x0, 6); for (let i = 0; i < 4; i++) { const len = 5 + Math.floor(R() * 8); for (let j = 0; j < len; j++) px(c, ex + 1 + i * 2 + Math.round(Math.sin(j / 3 + i) * 1.5), yb + 3 + j, j % 3 ? T.ivy[1] : '#222a32'); }
  }

  /* ---------- the stage ---------- */
  function wires(c) { /* the wires are live nodes */ }
  function konbini(c, x, base, T, R) {
    const w = 56, h = 28, wall = T.plas[1], wd = T.plas[0], lt = T.plas[2], gl = T.glass;
    rect(c, x, base - h, w, h, wall); rect(c, x, base - h, w, 1, lt); rect(c, x + w - 2, base - h, 2, h, wd);
    rect(c, x + 3, base - 21, w - 10, 17, T.lit > 0 ? '#3a4a52' : gl[0]);
    for (let i = 0; i < 3; i++) { rect(c, x + 3 + i * 15, base - 21, 1, 17, wd); }
    for (let y = base - 20; y < base - 6; y += 4) for (let i = x + 5; i < x + w - 8; i += 15) { rect(c, i + 1, y, 11, 1, T.lit > 0 ? '#ffe9b0' : gl[1]); for (let k = 0; k < 4; k++) rect(c, i + 1 + k * 3, y - 2, 2, 2, ['#f06a48', '#7ad0e8', '#f2d24a', '#9ad86a'][(i + k + y) % 4]); }
    rect(c, x - 2, base - 29, w + 4, 6, T.teal[1]); rect(c, x - 2, base - 29, w + 4, 1, T.teal[2]); rect(c, x - 2, base - 24, w + 4, 1, T.teal[0]);
    for (let i = 0; i < w + 4; i += 6) rect(c, x - 2 + i, base - 28, 3, 4, i % 12 ? T.plas[2] : T.red[1]);
    rect(c, x + w * .18, base - 40, w * .64, 11, T.plas[2]); rect(c, x + w * .18, base - 40, w * .64, 1, '#ffffff'); rect(c, x + w * .18, base - 30, w * .64, 1, T.plas[0]);
    const digs = { 2: ['ooo', '..o', 'ooo', 'o..', 'ooo'], 4: ['o.o', 'o.o', 'ooo', '..o', '..o'] }; let dx = x + w * .18 + 8; for (const dg of [2, 4]) { for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (digs[dg][j][i] === 'o') px(c, dx + i, base - 37 + j, T.red[1]); dx += 5; }
    rect(c, dx + 2, base - 38, 12, 1, T.teal[1]); rect(c, dx + 2, base - 36, 12, 1, T.teal[1]); rect(c, dx + 2, base - 34, 12, 1, T.teal[1]);
    for (let i = 0; i < 10; i++) { const sx = x - 2 + Math.floor(R() * (w + 4)), len = 4 + Math.floor(R() * 12); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 3 + i)), base - 23 + j, j % 4 === 3 ? T.ivy[2] : j % 2 ? T.ivy[1] : T.ivy[0]); }
    for (let i = x - 2; i < x + w + 2; i += 5 + Math.floor(R() * 4)) crown(c, i, base - 30, 3 + Math.floor(R() * 3), T.ivy, R);
    rect(c, x + w * .5 - 3, base - 11, 6, 11, T.lit > 0 ? '#ffe9b0' : gl[1]); rect(c, x + w * .5 - 3, base - 11, 1, 11, wd);
  }
  function vending(c, x, base, T, col, R) {
    rect(c, x, base - 15, 9, 15, T.conc[0]); rect(c, x + 1, base - 14, 7, 13, col[1]); rect(c, x + 1, base - 14, 7, 1, col[2]); rect(c, x + 1, base - 3, 7, 2, T.conc[0]);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) rect(c, x + 2 + i * 2, base - 13 + j * 3, 1, 2, ['#f2d24a', '#7ad0e8', '#f06a48', '#9ad86a', '#ffffff'][(i * 2 + j + Math.floor(R() * 5)) % 5]);
    rect(c, x + 6, base - 7, 1, 2, T.conc[2]);
  }
  function torii(c, x, base, T, R) {
    const r = T.red; for (const px0 of [0, 20]) { rect(c, x + px0, base - 30, 4, 30, r[1]); rect(c, x + px0, base - 30, 1, 30, r[2]); rect(c, x + px0 + 3, base - 30, 1, 30, r[0]); rect(c, x + px0 - 1, base - 3, 6, 3, T.conc[0]); }
    rect(c, x - 4, base - 33, 32, 3, r[1]); rect(c, x - 5, base - 35, 34, 2, r[0]); for (let i = 0; i < 4; i++) { px(c, x - 5 - i, base - 35 - Math.floor(i / 2), r[0]); px(c, x + 28 + i, base - 35 - Math.floor(i / 2), r[0]); } rect(c, x - 4, base - 33, 32, 1, r[2]);
    rect(c, x, base - 25, 24, 2, r[0]); rect(c, x + 11, base - 33, 2, 8, r[0]);
    for (let i = 0; i < 12; i++) { const sx = x + (i % 2 ? 1 : 21) + Math.floor(R() * 2), len = 5 + Math.floor(R() * 18); for (let j = 0; j < len; j++) px(c, sx + Math.round(Math.sin(j / 3 + i)), base - 3 - j, j % 4 === 3 ? T.ivy[2] : j % 2 ? T.ivy[1] : T.ivy[0]); }
  }
  function pole(c, x, base, h, T, R) {
    const w = 3; rect(c, x - 1, base - h, w + 1, h, T.conc[1]); rect(c, x - 1, base - h, 1, h, T.conc[2]); rect(c, x + w - 1, base - h, 1, h, T.conc[0]);
    rect(c, x - 7, base - h + 4, 15, 2, T.wood[1]); rect(c, x - 7, base - h + 4, 15, 1, T.wood[2]); rect(c, x - 5, base - h + 10, 11, 2, T.wood[1]);
    for (const dx of [-6, -2, 2, 6]) { rect(c, x + dx, base - h + 1, 1, 3, T.glass[1]); px(c, x + dx, base - h + 1, T.glass[2]); }
    for (const dx of [-4, 4]) { rect(c, x + dx, base - h + 7, 1, 3, T.glass[1]); }
    rect(c, x + 2, base - h + 16, 7, 9, T.conc[0]); rect(c, x + 2, base - h + 16, 7, 1, T.conc[1]); rect(c, x + 3, base - h + 25, 1, 2, '#222a32'); rect(c, x + 6, base - h + 25, 1, 2, '#222a32');
    for (let j = 0; j < 14; j++) px(c, x + Math.round(Math.sin(j / 2.4) * 1.5), base - 2 - j * 2, j % 3 ? T.ivy[1] : T.ivy[2]);
    for (let y = base - h + 30; y < base; y += 12) rect(c, x - 1, y, 3, 1, T.conc[0]);
  }
  function house(c, x, base, st, T, R) {
    const W2 = 46, wall = T.plas[1], wd = T.plas[0], beam = T.wood[0], bm = T.wood[1], roof = T.roof, lit = T.mood !== 'day';
    rect(c, x - 3, base, W2 + 8, 2, 'rgba(0,0,0,.2)');
    if (st === 0) { for (const sx of [x, x + W2]) { rect(c, sx, base - 8, 1, 9, bm); px(c, sx, base - 9, T.red[1]); } for (let i = 0; i <= W2; i += 2) px(c, x + i, base - 5 + (i % 4 ? 0 : 1), '#d8c8a0'); rect(c, x + 14, base - 14, 1, 14, bm); rect(c, x + 12, base - 15, 6, 3, T.plas[1]); }
    if (st < 5) { for (let k = 0; k < 5; k++) rect(c, x + W2 + 4, base - 1 - k, 9 - (k % 2), 1, k % 2 ? T.roof[2] : T.roof[1]); }
    if (st === 0) return;
    for (let i = 0; i < W2; i += 4) { rect(c, x + i, base - 3, 4, 3, i % 8 ? T.conc[1] : T.conc[2]); px(c, x + i, base - 3, T.conc[2]); px(c, x + i + 3, base - 1, T.conc[0]); }
    if (st === 1) return;
    const Hw = 17, top = base - 3 - Hw;
    for (const p of [0, 11, 23, 35, W2 - 1]) rect(c, x + p, top, 1, Hw, beam); rect(c, x, top, W2, 1, beam); rect(c, x, base - 4, W2, 1, beam);
    if (st >= 3) { const hh = st === 3 ? Math.round(Hw * .5) : Hw - 1; for (let j = 0; j < hh; j++) for (let i = 1; i < W2 - 1; i++) { if ([11, 23, 35].includes(i)) continue; px(c, x + i, base - 4 - j, (i + j) % 11 === 0 ? wd : j % 6 === 5 ? bm : wall); } }
    if (st >= 4) { rect(c, x - 4, base - 4, W2 + 8, 2, T.wood[2]); rect(c, x - 4, base - 2, W2 + 8, 1, T.wood[0]); }
    if (st < 4) return;
    const rH = 15;
    if (st === 4) { for (let k = 0; k < 8; k++) { rect(c, x - 3 + k * 3, top - k, 2, 1, beam); rect(c, x + W2 + 2 - k * 3 - 1, top - k, 2, 1, beam); } rect(c, x + W2 / 2 - 1, top - 9, 2, 9, beam); return; }
    for (let j = 0; j < rH; j++) { const w = Math.round((W2 / 2 + 8) * (1 - j / (rH + 3))); rect(c, x + W2 / 2 - w, top - j - 1, w * 2, 1, j % 3 === 2 ? roof[0] : j === rH - 1 ? roof[2] : roof[1]); px(c, x + W2 / 2 - w, top - j - 1, roof[2]); for (let i = -w + 2; i < w - 2; i += 3) if ((i + j * 2) % 6 === 0) px(c, x + W2 / 2 + i, top - j - 1, roof[0]); }
    rect(c, x - 8, top - 1, W2 + 16, 2, roof[0]); px(c, x - 9, top - 2, roof[2]); px(c, x + W2 + 8, top - 2, roof[2]); rect(c, x + W2 / 2 - 4, top - rH - 2, 8, 2, roof[0]); px(c, x + W2 / 2 - 4, top - rH - 3, T.wood[2]); px(c, x + W2 / 2 + 3, top - rH - 3, T.wood[2]);
    if (st === 5) return;
    for (const wx of [4, 27]) { rect(c, x + wx, base - 15, 7, 11, lit ? '#ffe2a0' : T.glass[1]); for (let k = 0; k < 3; k++) rect(c, x + wx + k * 2 + 1, base - 15, 1, 11, beam); rect(c, x + wx, base - 10, 7, 1, beam); }
    rect(c, x + 14, base - 14, 8, 10, T.wood[0]); rect(c, x + 14, base - 14, 8, 1, T.wood[1]); rect(c, x + 14, base - 14, 8, 4, T.roof[0]); for (let i = 0; i < 4; i++) rect(c, x + 15 + i * 2, base - 14, 1, 4, T.roof[1]); rect(c, x + 16, base - 9, 4, 5, lit ? '#ffe2a0' : T.glass[1]);
    rect(c, x + 38, base - 15, 1, 11, T.wood[1]); rect(c, x + 36, base - 18, 5, 4, T.red[1]); rect(c, x + 36, base - 18, 5, 1, T.red[2]); px(c, x + 38, base - 19, beam);
    if (st === 6) return;
    for (let i = 0; i < 7; i++) { const fx = x + 1 + i * 6; px(c, fx, base - 1, T.leaf[1]); px(c, fx, base - 2, ['#ff7aa8', '#ffe27a', '#ffffff', '#b88aff'][i % 4]); }
    for (let i = -6; i <= 12; i += 2) rect(c, x + W2 / 2 + i, top - rH + 1, 1, 2, i % 4 ? T.red[1] : '#ffffff');
  }
  /* the water: sky colour and light, with the sidewalk and everything on it mirrored in it */
  function flood(c, g, T, L) {
    const sw = L.sw, x0 = g.x0, x1 = g.x1, R = rnd(8);
    for (let y = sw; y < g.y1; y++) { const u = Math.min(1, (y - sw) / Math.max(10, g.H - sw)); c.fillStyle = mix(mix(T.water[1], T.sky[2], .35), T.water[0], u * .75); c.fillRect(x0, y, x1 - x0, 1); }
    reflect(c, g, sw, Math.min(60, g.y1 - sw), .62, j => Math.sin(j * .55) * (1 + j * .06));
    for (let y = sw + 1; y < g.y1; y++) { const wy = (y - sw); for (let x = x0 + ((y * 7) % 11); x < x1; x += 9 + (wy % 5)) { if (hsh(x, y, 5) < .55) { c.fillStyle = hsh(x, y, 6) < .5 ? T.water[2] : T.water[0]; c.globalAlpha = .5; c.fillRect(x, y, 2 + Math.floor(hsh(x, y, 7) * 6), 1); } } } c.globalAlpha = 1;
    rect(c, x0, sw, x1 - x0, 1, T.conc[0]); rect(c, x0, sw - 1, x1 - x0, 1, T.conc[2]);
  }
  function stage(c, g, T, L, st) {
    const R = rnd(11), W = g.W, sw = L.sw, side = sw - 2, x0 = g.x0, x1 = g.x1;
    /* the bank behind the sidewalk: grass over broken concrete, a fence, bushes */
    const by = sw - 24; for (let y = by; y < sw; y++) { c.fillStyle = y < by + 3 ? T.ivy[1] : T.asph[1]; c.fillRect(x0, y, x1 - x0, 1); }
    for (let y = by + 3; y < sw; y++) for (let x = x0 + (y * 5) % 3; x < x1; x += 3) { const v = hsh(x, y, 2); if (v < .3) { c.fillStyle = v < .12 ? T.asph[0] : T.asph[2]; c.fillRect(x, y, 1, 1); } }
    for (let x = x0; x < x1; x += 5 + Math.floor(R() * 7)) crown(c, x, by + 1, 3 + Math.floor(R() * 3), T.ivy, R);
    for (let x = x0 + 2; x < x1; x += 4) { rect(c, x, by - 6, 1, 7, T.conc[0]); } for (let y = by - 5; y < by; y += 3) rect(c, x0, y, x1 - x0, 1, mix(T.conc[0], T.conc[1], .4));
    for (let x = x0; x < x1; x += 14 + Math.floor(R() * 20)) { crown(c, x, by - 6, 4 + Math.floor(R() * 3), T.ivy, R); }
    if (L.wide) { konbini(c, L.shop.x, side - 3, T, R); for (let i = 0; i < 3; i++) vending(c, L.vend.x + i * 11, side - 1, T, [T.red, T.teal, T.roof][i], R); torii(c, L.torii.x, side - 2, T, R); }
    for (const p of L.poles) pole(c, p.x, side, p.h, T, R);
    house(c, L.house.x, side + 1, st, T, R);
    for (let y = side - 2; y < sw; y++) { c.fillStyle = T.asph[2]; c.fillRect(x0, y, x1 - x0, 1); }
    rect(c, x0, side - 2, x1 - x0, 1, T.conc[2]);
    for (let x = x0; x < x1; x += 3 + Math.floor(R() * 7)) { px(c, x, side - 1, T.ivy[1]); if (R() < .5) px(c, x, side - 2, T.ivy[2]); }
    for (let x = x0 + 5; x < x1; x += 17 + Math.floor(R() * 13)) rect(c, x, side + (x % 2), 5, 1, T.asph[0]);
    flood(c, g, T, L);
  }

  /* ---------- plants: each one sways, and leans when something passes ---------- */
  const PL = {
    pampas: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2; for (let i = -3; i <= 3; i++) { const h = 12 + (Math.abs(i) < 2 ? 5 : 0) + (i * 7 & 3); for (let j = 0; j < h; j++) { const lean = Math.round(sw * (j / h) * 2 + i * j * .12); px(c, n.x + i + lean, n.y - j, j > h - 4 ? T.plas[2] : T.leaf[(j + i) & 1 ? 1 : 0]); } if (i % 2 === 0) { const tx = n.x + i + Math.round(sw * 2 + i * h * .12); rect(c, tx - 1, n.y - h - 3, 3, 4, T.plas[1]); px(c, tx, n.y - h - 4, T.plas[2]); px(c, tx + 1, n.y - h - 2, '#ffffff'); } } },
    cosmos: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2; for (let k = -1; k <= 1; k++) { const h = 11 + k * 2 + (k === 0 ? 2 : 0), tx = n.x + k * 3 + Math.round(sw * 1.5); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round((tx - n.x - k * 2) * j / h), n.y - j, T.leaf[1]); const col = [['#ff7aa8', '#ffc8dc'], ['#ffffff', '#ffd0e8'], ['#d8508a', '#ff9ac0']][k + 1]; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) px(c, tx + dx, n.y - h + dy, (dx + dy) & 1 ? col[0] : col[1]); px(c, tx, n.y - h, '#ffe27a'); } },
    hydrangea: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .5) + n.kick; crown(c, n.x, n.y - 5, 6, T.leaf, rnd(n.seed)); const cs = [['#6a8ae8', '#a8c0ff'], ['#9a6ae0', '#d0b0ff'], ['#e07ab8', '#ffc0e0']][n.seed % 3]; for (let i = 0; i < 4; i++) { const hx = n.x - 5 + i * 3 + Math.round(sw), hy = n.y - 10 - (i % 2) * 3; for (let k = 0; k < 9; k++) px(c, hx + (k % 3) - 1, hy + Math.floor(k / 3) - 1, (k * 7 + i) % 3 ? cs[1] : cs[0]); } },
    lily: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2; for (let k = -1; k <= 1; k++) { const h = 9 + (k === 0 ? 3 : 0), tx = n.x + k * 3 + Math.round(sw); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round((tx - n.x - k * 2) * j / h), n.y - j, T.leaf[0]); for (let a = 0; a < 7; a++) { const an = a / 7 * 6.28; for (let r = 1; r <= 3; r++) px(c, tx + Math.round(Math.cos(an) * r * 1.2), n.y - h + Math.round(Math.sin(an) * r * 1.2) - 1, r === 3 ? '#ff6a4a' : '#e02a3a'); } } },
    lotus: (c, n, f, T) => { const b = Math.round(Math.sin(f / 8 + n.x) * .6 + n.kick * 1.5); ell(c, n.x, n.y + b, 6, 2, T.leaf[0]); ell(c, n.x - 1, n.y + b - 1, 5, 1, T.leaf[1]); px(c, n.x + 2, n.y + b - 1, T.leaf[2]); rect(c, n.x + 3, n.y + b, 3, 1, T.water[0]); if (n.bloom) { rect(c, n.x - 3, n.y - 8 + b, 1, 8, T.leaf[1]); for (const [dx, dy] of [[-2, -1], [2, -1], [0, -2], [-1, 0], [1, 0], [0, 0]]) px(c, n.x - 3 + dx, n.y - 9 + b + dy, dy < 0 ? '#ffc8e0' : '#ff8ac0'); px(c, n.x - 3, n.y - 8 + b, '#ffe27a'); } },
    glory: (c, n, f, T) => { for (let j = 0; j < 38; j++) { const yy = n.y - j * 1.2, xx = n.x + Math.round(Math.sin(j / 2.6) * 2.4 + ECO.sway(n.x, f, .3)); px(c, xx, yy, T.leaf[1]); if (j % 5 === 2) { px(c, xx + 1, yy - 1, T.leaf[2]); } if (j % 6 === 4) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(c, xx + dx + 2, yy + dy, '#5a7af0'); px(c, xx + 2, yy, '#ffffff'); } } },
    bamboo: (c, n, f, T) => { const sw = ECO.sway(n.x, f, .7) + n.kick * 1.5; for (let i = -2; i <= 2; i++) { const h = 30 + (i & 1) * 8 + ((i * 5) & 3); for (let j = 0; j < h; j++) { const lean = Math.round(sw * (j / h) * 2.4 + i * j * .04); rect(c, n.x + i * 3 + lean, n.y - j, 2, 1, j % 7 === 0 ? T.leaf[0] : T.leaf[1]); px(c, n.x + i * 3 + lean, n.y - j, T.leaf[2]); } const tx = n.x + i * 3 + Math.round(sw * 2.4 + i * h * .04); for (let k = 0; k < 4; k++) { rect(c, tx - 3 - k, n.y - h + 2 + k * 2, 4, 1, T.leaf[1]); rect(c, tx + 1 + k, n.y - h + 3 + k * 2, 4, 1, T.leaf[2]); } } },
    persimmon: (c, n, f, T) => { rect(c, n.x - 1, n.y - 20, 3, 20, T.wood[1]); rect(c, n.x - 1, n.y - 20, 1, 20, T.wood[2]); const R = rnd(31); for (const [dx, dy, r] of [[-7, -24, 6], [6, -25, 6], [0, -31, 7], [-1, -22, 5]]) crown(c, n.x + dx, n.y + dy, r, T.leaf, R); for (let i = 0; i < 7; i++) { const fx = n.x - 11 + Math.floor(R() * 22), fy = n.y - 30 + Math.floor(R() * 14); rect(c, fx, fy, 3, 3, '#f08a2a'); px(c, fx, fy, '#ffc060'); px(c, fx + 1, fy - 1, T.leaf[0]); } },
    dandelion: (c, n, f, T) => { const sw = ECO.sway(n.x, f) + n.kick * 2; for (let j = 0; j < 8; j++) px(c, n.x + Math.round(sw * j / 8), n.y - j, T.leaf[1]); const tx = n.x + Math.round(sw), ty = n.y - 10; for (let a = 0; a < 10; a++) { const an = a / 10 * 6.28; px(c, tx + Math.round(Math.cos(an) * 3), ty + Math.round(Math.sin(an) * 3), '#ffffff'); } px(c, tx, ty, '#e8f0ff'); if (n.kick > .5) for (let i = 0; i < 3; i++) px(c, tx + 4 + i * 2, ty - 2 - i, '#ffffff'); },
  };
  const PLN = { pampas: 'Pampas grass', cosmos: 'Cosmos', hydrangea: 'Hydrangea', lily: 'Spider lily', lotus: 'Lotus', glory: 'Morning glory', bamboo: 'Bamboo', persimmon: 'Persimmon tree', dandelion: 'Dandelion' };
  const PLS = { pampas: ['chime', 3], cosmos: ['chime', 5], hydrangea: ['rustle'], lily: ['rustle'], lotus: ['bloop'], glory: ['chime', 6], bamboo: ['jingle'], persimmon: ['rustle'], dandelion: ['sparkle'] };

  /* ---------- the cast ---------- */
  const GRID = (c, rows, x, y, cols, flip) => { const w = rows[0].length; for (let j = 0; j < rows.length; j++) for (let i = 0; i < w; i++) { const ch = rows[j][i]; if (ch === '.' || !cols[ch]) continue; rect(c, Math.round(x - w / 2) + (flip ? w - 1 - i : i), Math.round(y - rows.length) + j, 1, 1, cols[ch]); } };

  function build(g) {
    const W = g.W, H = g.H, T = g.T, L = g.L, R = rnd(41);
    const S = (id, o) => ECO.add(Object.assign({ id, kind: 'creature', hw: 7, hh: 8 }, o));
    const sw = L.sw, y0 = sw - 4;
    ECO.begin(g, {
      pulse: T.mood === 'day' ? '#fff0a0' : '#ffe27a', wave: '#ffe8a0', line: '#2a323a', bubble: { bg: '#fff8e6', edge: '#2a1a14', ink: ['#e0562a', '#2a8a6a', '#6a5ad8', '#d08a1a'] },
      route(l, u, p) { if (l.kind !== 'vine') return null; const a = l.a, b = l.b; return { x: a.x + (b.x - a.x) * u, y: sw - 2 + (a.y > sw ? 8 : 0) + Math.sin(u * Math.PI) * 1.5 + (b.y > sw ? (b.y - sw) * u : 0) }; },
      link(c, l, at, f, G) {
        const a = l.a, b = l.b, wire = l.kind === 'wire', len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(6, Math.round(len * (wire ? 1.1 : .5)));
        if (l.kind === 'talk' || l.kind === 'feed') { if (l.fl < .15) return; c.fillStyle = '#ffe27a'; c.globalAlpha = l.fl * .6; for (let i = 1; i < n; i += 2) { const q = at(l, i / n); c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; return; }
        if (l.kind === 'vine') { c.fillStyle = T.ivy[1]; c.globalAlpha = .55; for (let i = 0; i <= n; i++) { if (i % 3) continue; const q = at(l, i / n); c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; if (l.fl > .1) { c.fillStyle = '#d8ff8a'; c.globalAlpha = l.fl; for (let i = 0; i <= n; i += 2) { const q = at(l, i / n); c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; } return; }
        for (let i = 0; i <= n; i++) { const q = at(l, i / n); c.fillStyle = l.fl > .2 ? '#f6d890' : '#1c242c'; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); if (T.mood !== 'night') { c.fillStyle = '#6a7a86'; c.globalAlpha = .6; c.fillRect(Math.round(q.x), Math.round(q.y) - 1, 1, 1); c.globalAlpha = 1; } }
      },
      under(c, f, G, N) { /* every creature standing on the sidewalk is mirrored in the flood */
        for (const n of N) { if (n.kind !== 'creature' || !n.refl || n.hidden || !n.draw) continue; c.save(); c.translate(0, 2 * sw + 2); c.scale(1, -1); c.globalAlpha = .3; n.draw(c, n, f, G); c.restore(); }
      },
    });
    /* the Spirit: the Great Cat, a hill that breathes */
    const gc = L.cat;
    ECO.add({ id: 'spirit', kind: 'spirit', name: 'The Great Cat', x: gc.x, y: gc.y, hw: gc.w / 2, hh: gc.h * .55, snd: 'purr', magic: true, say: ['paw', 'heart', 'moon'], z: gc.y - 2, lift: gc.h * .5,
      draw(c, n, f) { greatCat(c, n, f, T, gc, R); }, glow: { col: '#ffcf7a', r: 60, a: T.mood === 'night' ? .22 : .08, dy: gc.h * .5 } });
    /* the poles, the machines, the shop, the torii and the house: the places the wires go */
    const poles = L.poles.map((p, i) => ECO.add({ id: 'pole' + i, kind: 'home', name: 'Utility pole', x: p.x, y: sw - 2, hw: 4, hh: p.h * .45, lift: p.h - 3, z: sw - 3, snd: 'jingle', draw() {} }));
    const homes = [];
    if (L.wide) {
      const shop = ECO.add({ id: 'shop', kind: 'home', name: 'Konbini', x: L.shop.x + 28, y: sw - 5, hw: 29, hh: 17, lift: 30, z: sw - 6, snd: 'jingle', draw() {}, glow: { col: '#fff0c0', r: 34, a: T.lit ? .32 : .05, dy: 12 } }); homes.push(shop);
      for (let i = 0; i < 3; i++) homes.push(ECO.add({ id: 'vend' + i, kind: 'home', name: 'Vending machine', x: L.vend.x + 4 + i * 11, y: sw - 3, hw: 5, hh: 8, lift: 14, z: sw - 4, snd: 'bloop', draw() {}, glow: { col: ['#ff9a8a', '#8af0e8', '#9ac8ff'][i], r: 15, a: T.lit ? .3 : .06, dy: 8 } }));
      homes.push(ECO.add({ id: 'torii', kind: 'home', name: 'Torii', x: L.torii.x + 12, y: sw - 4, hw: 15, hh: 16, lift: 34, z: sw - 5, snd: 'gong', draw() {} }));
    }
    const hs = ECO.add({ id: 'house', kind: 'house', name: 'Your house', x: L.house.x + 23, y: sw - 1, hw: 28, hh: 17, lift: 28, z: sw - 1, snd: 'knock', draw() {}, glow: () => (g.tk.stage() >= 6 ? { col: '#ffd890', r: 34, a: T.lit ? .6 : .12, dy: 12 } : null) }); homes.push(hs);
    /* wires between the poles, and from poles to everything on the ground */
    const wires = [], W_ = (a, b, sag) => { const l = ECO.link(a, b, { kind: 'wire', sag }); wires.push(l); return l; };
    const spirit = ECO.spirit();
    for (let i = 0; i < poles.length - 1; i++) { W_(poles[i], poles[i + 1], 5 + (i % 2) * 2); if (i % 2 === 0) { const l = W_(poles[i], poles[i + 1], 11); l.alt = true; } }
    W_(spirit, poles[poles.length - 1], 4);
    for (const h of homes) { let best = poles[0], bd = 1e9; for (const p of poles) { const d = Math.abs(p.x - h.x); if (d < bd) { bd = d; best = p; } } W_(best, h, 3); }
    /* plants */
    const plants = [];
    const P = (kind, x, y, o) => { const seed = Math.floor(R() * 9); const nd = ECO.add(Object.assign({ id: kind + plants.length, kind: 'plant', pk: kind, name: PLN[kind], x, y, hw: kind === 'bamboo' ? 8 : kind === 'persimmon' ? 10 : 5, hh: kind === 'bamboo' ? 14 : kind === 'persimmon' ? 14 : 7, snd: PLS[kind][0], sndK: PLS[kind][1], seed, z: y - 1, nohit: false, draw: (c, n, f) => PL[kind](c, n, f, T) }, o || {})); plants.push(nd); return nd; };
    const W1 = L.wide ? W : W;
    const span = (a, b, n, fn) => { for (let i = 0; i < n; i++) fn(a + (b - a) * ((i + .5) / n) + (R() - .5) * 8); };
    P('pampas', Math.round(W * .225), sw - 3); P('pampas', Math.round(W * .36), sw - 2); P('pampas', Math.round(W * .66), sw - 2);
    P('cosmos', Math.round(W * .275), sw - 3); P('cosmos', Math.round(W * .47), sw - 1); P('cosmos', Math.round(W * .8), sw - 3);
    P('hydrangea', Math.round(W * .3), sw - 5); P('hydrangea', Math.round(W * .62), sw - 3);
    P('lily', Math.round(W * .205), sw - 2); P('lily', Math.round(W * .55), sw - 1); P('lily', Math.round(W * .9), sw - 2);
    P('dandelion', Math.round(W * .41), sw - 1); P('dandelion', Math.round(W * .73), sw - 1);
    P('bamboo', Math.round(W * .985), sw - 3);
    if (L.wide) P('persimmon', Math.round(W * .255), sw - 6);
    P('glory', poles[0].x + 4, sw - 2);
    P('lotus', Math.round(W * .2), sw + 12, { bloom: true }); P('lotus', Math.round(W * .52), sw + 22); P('lotus', Math.round(W * .84), sw + 15, { bloom: true });
    /* plants are connected to the wires: each to its nearest place, by a vine along the ground */
    for (const p of plants) { let best = null, bd = 1e9; for (const h of homes.concat(poles)) { const d = Math.hypot(h.x - p.x, (h.y - p.y) * 2); if (d < bd) { bd = d; best = h; } } if (best) { const l = ECO.link(best, p, { kind: 'vine', sag: 2 }); l.low = true; } }
    /* creatures */
    mkCats(g, S, wires, poles, L);
    ECO.autoLinks({ noRoots: true });
  }
  function greatCat(c, n, f, T, gc, R) {
    const br = Math.round(Math.sin(f / 7) * 1.1), gw = gc.w, gh = gc.h, X = gc.x, B = gc.y;
    const K = { r: [T.ivy[0], T.ivy[1], mix(T.ivy[1], T.leaf[2], .55)], eye: '#ffcf7a', nose: '#e88a8a' };
    K.pat = (x, y) => { const h = hsh(Math.floor(x / 3), Math.floor(y / 3), 21); return h < .12 ? [T.conc[0], T.conc[1], T.conc[2]] : h > .9 ? [K.r[1], K.r[2], '#f4ffc8'] : null; };
    const bl = (cx, cy, rx, ry, b) => blob(c, X + cx, B + cy, rx, ry, K, b), hx = -gw * .3, hy = -gh * .3;
    /* tail first (behind), then the body, haunch, head, ears, paws */
    for (let i = 0; i < 16; i++) { const u = i / 15, tx = gw * .46 - u * gw * .5, ty = -3 - Math.sin(u * 3) * 3 + Math.sin(f / 9 + u * 3) * .8; bl(tx, ty, 3.2 - u * .6, 3.2 - u * .6); }
    bl(gw * .1, -gh * .36 - br * .5, gw * .4, gh * .38 + br * .5); bl(gw * .27, -gh * .3, gw * .2, gh * .3 + br * .4);
    bl(hx, hy, gw * .2, gh * .27, 'head');
    for (const [ex, sd] of [[hx - gw * .1, 0], [hx + gw * .07, 1]]) { const bw = Math.round(gw * .08), eh = Math.round(gh * .3); for (let j = 0; j < eh; j++) { const w = Math.max(1, Math.round(bw * (1 - j / eh))), x0 = Math.round(X + ex - w / 2 + (sd ? j * .15 : -j * .15)), y = Math.round(B + hy - gh * .22 - j); rect(c, x0 - 1, y, w + 2, 1, K.r[0]); rect(c, x0, y, w, 1, j < 3 ? K.r[1] : K.r[2]); if (j > 2 && w > 2) rect(c, x0 + 1, y, w - 2, 1, '#c8788a'); } }
    bl(hx - gw * .06, -3, 6, 3); bl(hx + gw * .12, -3, 6, 3);
    const ey = Math.round(B + hy - 1), ex0 = Math.round(X + hx - gw * .1), ex1 = Math.round(X + hx + gw * .1), glowE = T.mood === 'night' ? '#ffe9a0' : '#ffcf7a';
    for (const e of [ex0, ex1]) { rect(c, e - 3, ey, 6, 1, glowE); px(c, e - 4, ey - 1, glowE); px(c, e + 3, ey - 1, glowE); rect(c, e - 2, ey + 1, 4, 1, K.r[0]); }
    px(c, X + hx, ey + 4, '#f09ab0'); px(c, X + hx - 1, ey + 5, K.r[0]); px(c, X + hx + 1, ey + 5, K.r[0]);
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) for (let k = 0; k < 11; k++) px(c, X + hx + sd * (4 + k), ey + 5 + Math.round((i - 1) * k * .25 + Math.sin(f / 12 + i) * .4), k > 7 ? T.plas[2] : T.plas[1]);
    for (let i = 0; i < 8; i++) { const fx = X - gw * .1 + (hsh(i, 2, 2) - .3) * gw * .7, fy = B - gh * (.2 + hsh(i, 3, 3) * .55) - 2 + br; px(c, fx, fy, ['#ffffff', '#ff8ac0', '#ffe27a', '#8ad8ff'][i & 3]); px(c, fx + 1, fy, ['#ffffff', '#ff8ac0', '#ffe27a', '#8ad8ff'][i & 3]); }
    for (let k = 0; k < 4; k++) rect(c, Math.round(X + gw * .18 + k * 5), B - 2 - k * 2, 5, 2, T.conc[1]);
    const sx = Math.round(X + gw * .32), sy = Math.round(B - gh * .5 - br); rect(c, sx, sy - 16, 1, 16, T.red[0]); rect(c, sx + 7, sy - 16, 1, 16, T.red[0]); rect(c, sx - 2, sy - 17, 12, 2, T.red[1]); rect(c, sx - 1, sy - 13, 9, 1, T.red[0]);
  }

  function mkCats(g, S, wires, poles, L) {
    const T = g.T, W = g.W, sw = L.sw, y0 = sw - 3, say = ['paw', 'fish', 'heart', 'note', 'bell', 'moon', 'star'];
    const gcx = L.cat.x, gcy = L.cat.y, gh = L.cat.h, gw = L.cat.w;
    /* Mochi: a loaf that melts over the edge of the vending machines */
    const vx = L.wide ? L.vend.x : Math.round(W * .45), vy = sw - 3 - 15;
    S('mochi', { refl: true, name: 'Mochi, melting', x: vx + 16, y: vy, hw: 9, hh: 7, magic: true, say, snd: 'purr', z: sw - 3, noReflect: true,
      draw(c, n, f) { const K = COATS.calico, m = Math.sin(f / 14) * .5 + .5, drip = 2 + Math.round(m * 7); cat(c, { x: n.x, y: n.y, d: 1, pose: 'loaf', K, f, shut: true });
        for (let i = 0; i < 6; i++) { const dx = n.x - 7 + i * 2.6, len = Math.round(drip * (.4 + hsh(i, 3, 3) * .8) * (.6 + Math.sin(f / 9 + i) * .4)); for (let j = 0; j < len; j++) { const col = hsh(i, 5, 5) < .4 ? K.alt[1] : K.r[1]; rect(c, Math.round(dx), n.y - 1 + j, 2 - (j > len - 2 ? 1 : 0), 1, col); } if (len > 4) px(c, Math.round(dx), n.y + len - 1, K.r[2]); } } });
    /* Noodle: a cat draped over the wires, as long as the wire sags */
    const wl = wires[0], nl = wires.length > 1 ? wires[1] : wires[0];
    S('noodle', { name: 'Noodle', x: 0, y: 0, hw: 14, hh: 5, magic: true, say, snd: 'meow', wire: nl, u0: .3, u1: .72, z: sw - 30, noReflect: true,
      step(n, f) { const q = ECO.at(n.wire, .5); n.x = q.x; n.y = q.y + 6; },
      draw(c, n, f) { const K = COATS.grey, l = n.wire; const seg = 22, o = mix(K.r[0], '#000000', .45); for (let pass = 0; pass < 2; pass++) for (let i = 0; i <= seg; i++) { const u = n.u0 + (n.u1 - n.u0) * i / seg, q = ECO.at(l, u), wob = Math.sin(i * .7 + f / 6) * 1.4, rr = 2.6 - Math.abs(i / seg - .5) * .8; if (pass === 0) ell(c, Math.round(q.x), Math.round(q.y - 2 + wob), Math.round(rr) + 1, Math.round(rr) + 1, o); else blob(c, q.x, q.y - 2 + wob, rr, rr, K, null, true); }
        const hd = ECO.at(l, n.u1 + .04), tl = ECO.at(l, n.u0 - .05); blob(c, hd.x + 2, hd.y + 2 + Math.sin(f / 5) * 1.2, 3.4, 3.1, K, 'head'); rect(c, Math.round(hd.x), Math.round(hd.y) - 1, 2, 2, K.r[1]); rect(c, Math.round(hd.x) + 4, Math.round(hd.y) - 1, 2, 2, K.r[1]); rect(c, Math.round(hd.x) + 1, Math.round(hd.y) + 2, 1, 2, K.eye); rect(c, Math.round(hd.x) + 4, Math.round(hd.y) + 2, 1, 2, K.eye);
        for (let i = 0; i < 4; i++) { const q = ECO.at(l, n.u0 + (n.u1 - n.u0) * (.15 + i * .24)), len = 4 + (i & 1) * 2 + Math.round(Math.sin(f / 7 + i) * 1.3); rect(c, q.x - 1 + i % 2, q.y + 1, 2, len, K.r[1]); rect(c, q.x - 1 + i % 2, q.y + len, 2, 1, K.w); }
        for (let i = 0; i < 9; i++) { const sx = tl.x - Math.round(Math.sin(f / 8 + i * .3) * i * .35), sy = tl.y + 1 + i; rect(c, sx - 1, sy, 2, 1, i === 8 ? K.r[0] : K.r[1]); } } });
    /* Roof cat: walks upside down along the underside of the konbini canopy */
    const cwx = L.wide ? L.shop.x : Math.round(W * .45), cwy = sw - 5 - 24;
    S('ceil', { name: 'Upside-down cat', x: cwx + 10, y: cwy, hw: 9, hh: 8, magic: true, say, snd: 'meow', dir: 1, x0: cwx + 4, x1: cwx + 50, z: sw - 6, noReflect: true,
      step(n, f) { if (f % 2 === 0) { n.x += n.dir * (n.fl > .3 ? 0 : .8); if (n.x > n.x1) n.dir = -1; if (n.x < n.x0) n.dir = 1; } },
      draw(c, n, f) { cat(c, { x: n.x, y: n.y + 1, d: n.dir, pose: 'walk', K: COATS.black, f, glow: true, inv: true, tail: f / 4 }); },
      /* the tail drifts toward the ground like smoke, on its own */
    });
    /* Wall-walker: crosses the konbini wall and is only a shimmer while inside */
    const px0 = L.wide ? L.shop.x : Math.round(W * .45);
    S('phase', { name: 'Wall-walker', x: px0 + 56, y: sw - 4, hw: 8, hh: 8, magic: true, say, snd: 'meow', dir: -1, wa: px0 + 4, wb: px0 + 53, z: sw - 2, still: false,
      step(n, f) { if (f % 2 === 0) { n.x += n.dir * .9; if (n.x < px0 - 14) n.dir = 1; if (n.x > px0 + 74) n.dir = -1; } },
      draw(c, n, f) { const o = { x: n.x, y: n.y, d: n.dir, pose: 'walk', K: COATS.white, f, glow: true }; c.save(); c.beginPath(); c.rect(n.x - 20, n.y - 30, 40, 40); const wa = n.wa, wb = n.wb; c.restore();
        c.save(); c.beginPath(); c.rect(wa - 40, n.y - 40, 40, 60); c.rect(wb, n.y - 40, 60, 60); c.clip(); cat(c, o); c.restore();
        c.save(); c.beginPath(); c.rect(wa, n.y - 40, wb - wa, 60); c.clip(); c.globalAlpha = .38; cat(c, Object.assign({}, o, { K: COATS.siam })); c.globalAlpha = 1; if (n.x > wa && n.x < wb) { for (let i = 0; i < 4; i++) px(c, n.x + ((f * 3 + i * 7) % 15) - 7, n.y - 3 - ((f + i * 5) % 12), '#8ae8ff'); } c.restore(); } });
    /* a tower of three */
    const tx = L.wide ? L.torii.x - 16 : Math.round(W * .6);
    S('tower', { refl: true, name: 'Cat tower', x: tx, y: sw - 3, hw: 8, hh: 16, magic: true, say, snd: 'meow', z: sw - 2, 
      draw(c, n, f) { const w1 = Math.sin(f / 11) * 1.4, w2 = Math.sin(f / 8 + 1) * 2.4, w3 = Math.sin(f / 6 + 2) * 3.4; cat(c, { x: n.x + w1 * .3, y: n.y, d: 1, pose: 'loaf', K: COATS.tabby, s: 1, f, shut: true });
        cat(c, { x: n.x + w2 * .5, y: n.y - 8, d: -1, pose: 'sit', K: COATS.grey, s: .8, f }); const k = (f % 90) / 90, lean = k > .8 ? (k - .8) * 20 : 0; cat(c, { x: n.x + w3 + lean * 0, y: n.y - 22 - (k > .86 && k < .93 ? 2 : 0), d: 1, pose: 'sit', K: COATS.black, s: .62, f, glow: true }); } });
    /* the moon kitten: in orbit around the Great Cat's ear */
    const ex = gcx - gw * .36, ey = gcy - gh * .78;
    S('kitten', { name: 'Moon kitten', x: ex, y: ey, hw: 5, hh: 6, magic: true, say: ['moon', 'star', 'heart'], snd: 'chime', noReflect: true, z: gcy,
      step(n, f) { const a = f * .11, rx = 17, ry = 6; n.x = ex + Math.cos(a) * rx; n.y = ey - 6 + Math.sin(a) * ry; n.z = Math.sin(a) > 0 ? gcy + 3 : gcy - 6; n.dd = Math.cos(a + 1.57) > 0 ? 1 : -1; },
      draw(c, n, f) { cat(c, { x: n.x, y: n.y, d: n.dd, pose: 'walk', K: COATS.siam, s: .55, f, glow: true }); }, glow: { col: '#e8f0ff', r: 12, a: .28, dy: 4 } });
    /* the cat and its shadow, which go their own ways */
    const sx0 = L.house.x + 62;
    S('shadowcat', { refl: true, name: 'Cat and shadow', x: sx0, y: sw - 3, hw: 8, hh: 8, magic: true, say, snd: 'meow', z: sw - 2, sh: sx0, tg: sx0, noReflect: true,
      step(n, f) { if (f % 45 === 0) n.tg = sx0 + (Math.random() < .5 ? -1 : 1) * (10 + Math.random() * 26); n.sh += Math.sign(n.tg - n.sh) * Math.min(1.1, Math.abs(n.tg - n.sh)); },
      draw(c, n, f) { c.save(); c.globalAlpha = .55; c.translate(0, Math.round(n.y) + 1); c.scale(1, .3); cat(c, { x: n.sh + 3, y: 0, d: n.sh < n.x ? -1 : 1, pose: 'walk', K: COATS.shade, f: f + 1, s: 1.15 }); c.restore(); cat(c, { x: n.x, y: n.y, d: 1, pose: 'sit', K: COATS.siam, f, shut: f % 40 > 36 }); } });
    /* a cat that has stopped touching the ground */
    S('floater', { name: 'Drifting cat', x: gcx - gw * .75, y: sw - 22, hw: 8, hh: 10, magic: true, say: ['moon', 'star', 'bell', 'heart'], snd: 'hum', z: sw - 9, bx: gcx - gw * .75, noReflect: true,
      step(n, f) { n.x = n.bx + Math.sin(f / 52) * 22; n.y = sw - 30 + Math.sin(f / 13) * 3 + Math.sin(f / 31) * 2; },
      draw(c, n, f) { cat(c, { x: n.x, y: n.y, d: Math.cos(f / 52) > 0 ? 1 : -1, pose: 'sit', K: COATS.white, f, shut: true, glow: true }); for (let i = 0; i < 3; i++) { const t = (f * .5 + i * 7) % 16; px(c, n.x - 6 + i * 6, n.y + 3 + t * .7, '#bfe8ff'); } c.globalAlpha = .3; ell(c, Math.round(n.x), sw + 3, 7, 1, '#bfe8ff'); c.globalAlpha = 1; }, glow: { col: '#cfe8ff', r: 22, a: .3, dy: 8 } });
    /* crows on the wires; they flap off a little when startled */
    const crowRows = ['......aaa..', '.....aaaaee', '.....aakaa.', '..aaaaaaa..', '.aaaaaaaaa.', 'aabaaaaaa..', 'abbbaaaa...', '..aaaaa....', '...e.e.....'];
    const cc = { a: '#1a1a26', b: '#0c0c14', k: '#ffd27a', e: '#b8884a' };
    wires.slice(0, 2).forEach((wl2, i) => S('crow' + i, { name: 'Crow', x: 0, y: 0, hw: 6, hh: 7, say: ['bell', 'note', 'fish'], snd: 'caw', wire: wl2, u: .35 + i * .3, z: sw - 29, noReflect: true, hop: 0,
      step(n, f) { const q = ECO.at(n.wire, n.u); n.x = q.x; n.y = q.y; if (n.fl > .6) n.hop = 6; if (n.hop > 0) n.hop--; },
      draw(c, n, f) { const up = n.hop > 0 ? Math.round(Math.sin(n.hop / 6 * Math.PI) * 5) : 0; GRID(c, crowRows, n.x, n.y - up, cc, i === 1); if (up > 1) { rect(c, n.x - 7, n.y - up - 6, 5, 2, cc.a); rect(c, n.x + 3, n.y - up - 6, 5, 2, cc.a); } } }));
    /* koi in the flood */
    const koi = [['#ff8a3a', '#ffffff'], ['#ffffff', '#ff5a3a'], ['#2a2a38', '#ffcf7a']];
    koi.forEach((k, i) => S('koi' + i, { name: 'Koi', x: W * (.25 + i * .25), y: sw + 10 + i * 9, hw: 7, hh: 3, say: ['fish', 'drop', 'wave'], snd: 'splash', magic: i === 0, z: sw + 4 + i, cx: W * (.25 + i * .25), cy: sw + 10 + i * 9, ph: i * 2.1, noReflect: true,
      step(n, f) { const a = f * .045 + n.ph; n.x = n.cx + Math.sin(a) * 30; n.y = n.cy + Math.sin(a * 1.7) * 3; n.dd = Math.cos(a) > 0 ? 1 : -1; },
      draw(c, n, f) { const d = n.dd, tw = Math.round(Math.sin(f * .9)); c.globalAlpha = .9; for (let j = -3; j <= 3; j++) { const w = Math.round(2 * Math.sqrt(Math.max(0, 1 - (j / 3.6) * (j / 3.6)))); rect(c, n.x + j * d - (d > 0 ? 0 : 0), n.y - w + (j < -1 ? Math.round(tw * (-j - 1) * .3) : 0), 1, w * 2 + 1, (j + 9 + i) % 5 === 0 ? k[1] : (j > 0 ? k[0] : k[0])); } rect(c, n.x - 5 * d, n.y - 1 + tw, 2, 3, k[0]); px(c, n.x + 3 * d, n.y - 1, '#101018'); c.globalAlpha = .35; for (let r = 1; r < 3; r++) for (let t = 0; t < 8; t++) px(c, n.x - 6 * d - r * d * 2 + Math.round(Math.cos(t) * r * 1.4), n.y + Math.round(Math.sin(t) * r * .5), '#ffffff'); c.globalAlpha = 1; } }));
    /* a heron wading */
    const hrow = ['.......aaa', '......aaakee', '.......aa..', '.......a...', '......a....', '..aaaaa....', '.aaaaaaaa..', 'abaaaaaaa..', '..wwwww....', '....e.e....', '....e.e....', '....e.e....'];
    S('heron', { name: 'Heron', x: W * .6, y: sw + 18, hw: 6, hh: 10, say: ['fish', 'drop', 'wave'], snd: 'caw', z: sw + 8, noReflect: true, st: 0,
      step(n, f) { if (f % 40 === 0) n.st = Math.random() < .5 ? 1 : 0; if (n.st && f % 3 === 0) n.x += (n.x < W * .66 ? .6 : -.6); },
      draw(c, n, f) { GRID(c, hrow, n.x, n.y, { a: '#c8d4de', b: '#7a8894', k: '#101018', e: '#d8a840', w: '#f0f4f8' }, false); c.globalAlpha = .45; for (let i = 0; i < 6; i++) px(c, n.x - 5 + i * 2, n.y + 1, '#ffffff'); c.globalAlpha = 1; } });
    /* a tanuki who is waiting for something to open */
    S('tanuki', { refl: true, name: 'Tanuki', x: (L.wide ? L.vend.x - 10 : Math.round(W * .4)), y: sw - 2, hw: 6, hh: 8, magic: true, say: ['bell', 'note', 'drop', 'star'], snd: 'chitter', z: sw - 1,
      draw(c, n, f) { const x = n.x, y = n.y, K = { r: ['#3a2418', '#8a6240', '#c8a070'], eye: '#101018', nose: '#101018' }; blob(c, x - 6, y - 4, 3, 5, K); blob(c, x, y - 5, 5, 5, K); blob(c, x + 2, y - 11, 4, 3.4, K, 'head'); rect(c, x, y - 14, 2, 2, K.r[0]); rect(c, x + 4, y - 14, 2, 2, K.r[0]); rect(c, x, y - 12, 3, 2, '#14100c'); rect(c, x + 4, y - 12, 3, 2, '#14100c'); px(c, x + 1, y - 12, '#ffffff'); px(c, x + 5, y - 12, '#ffffff'); px(c, x + 7, y - 10, '#101018'); rect(c, x - 1, y - 1, 3, 1, '#14100c'); rect(c, x + 3, y - 1, 3, 1, '#14100c'); rect(c, x - 2, y - 17 - Math.round(Math.sin(f / 5) * .6), 5, 2, T.leaf[1]); px(c, x - 1, y - 18, T.leaf[2]); for (let i = 0; i < 6; i++) px(c, x - 9 + i, y - 6 + (i % 2) * 2, '#14100c'); } });
    /* dragonflies over the water */
    for (let i = 0; i < 2; i++) S('dragon' + i, { name: 'Dragonfly', x: W * (.3 + i * .35), y: sw + 6, hw: 5, hh: 4, say: ['wave', 'drop'], snd: 'chirp', magic: false, z: sw + 6, cx: W * (.3 + i * .35), ph: i * 3, noReflect: true,
      step(n, f) { n.x = n.cx + Math.sin(f / 9 + n.ph) * 24 + Math.sin(f / 4) * 2; n.y = sw + 4 + Math.sin(f / 7 + n.ph * 2) * 7 - (n.fl > .5 ? 6 : 0); },
      draw(c, n, f) { rect(c, n.x - 3, n.y, 7, 1, '#3aa8e8'); px(c, n.x + 4, n.y, '#ff6a4a'); const up = f % 2 ? -1 : 1; rect(c, n.x - 1, n.y - 1 + up, 3, 1, '#d8f4ff'); rect(c, n.x - 1, n.y + 1 - up, 3, 1, '#d8f4ff'); } });
  }

  VISTA.reg('chiba', {
    stageK: .55, eco: true,
    pal(mood) { return pal(mood); },
    layout(g) {
      const W = g.W, H = g.H, wide = W > 210, sw = Math.round(H * .78), hz = Math.round(H * .5);
      g.L = { W, H, wide, sw, hz, rail: Math.round(H * .27) };
      g.L.house = { x: wide ? Math.round(W * .035) : 2, y: sw };
      g.L.shop = { x: Math.round(W * .43) }; g.L.vend = { x: Math.round(W * .33) }; g.L.torii = { x: Math.round(W * .66) };
      const gw = wide ? Math.round(W * .3) : Math.round(W * .62), gh = Math.round(gw * .5);
      g.L.cat = { x: W - Math.round(gw / 2) - 4, y: sw - 1, w: gw, h: gh };
      g.L.poles = wide ? [{ x: Math.round(W * .015), h: 74 }, { x: Math.round(W * .32), h: 66 }, { x: Math.round(W * .64), h: 70 }, { x: Math.round(W * .93), h: 62 }] : [{ x: 3, h: 70 }, { x: Math.round(W * .45), h: 62 }];
      g.L.fairies = [];
      ECO.end(); build(g);
    },
    rays(g) { const W = g.W, out = []; if (g.mood === 'night') return out; for (let i = 0; i < 4; i++) out.push({ x: W * (.1 + i * .24), w: 10 + (i * 6) % 9, sk: .35, a: g.T.shaftA * 1.5, d: i * 2.1, col: g.T.shaft }); return out; },
    weather: { dir: 'up', cols: ['#ffffff', '#f4f8ff', '#ffe8c0'], glow: true, depths: [{ n: 7, size: 1, dur: 46, z: 1, seed: 6, op: .85 }, { n: 3, size: 2, dur: 30, z: 3, seed: 3, op: .7, blur: 1.2 }] },
    layers(g) {
      const T = g.T, L = g.L, st = () => g.tk.stage(), R = rnd(17), hz = L.hz, fog = T.fog;
      return [
        { id: 'sky', k: .04, paint: (c, g2) => sky(c, g2, T, L) },
        { id: 'far', k: .1, blur: 1, paint: (c, g2) => far(c, Object.assign({ H: g.H }, g2), T, L) },
        { id: 'danchi', k: .2, blur: .5, paint(c, g2) {
          const Rr = rnd(23), base = hz + 40, W = g.W; c.fillStyle = haze(T.ivy[0], fog, .36); c.fillRect(g2.x0, base - 4, g2.x1 - g2.x0, g2.y1 - base + 4);
          let x = g2.x0 + 6; for (let i = 0; x < g2.x1 + 20; i++) { const w = 54 + Math.floor(Rr() * 50), h = 40 + Math.floor(Rr() * 22); danchi(c, x, base, w, h, T, .34, Rr, { stair: Math.floor(Rr() * (w - 8)), collapse: i % 3 === 1, trees: i % 2 === 0 }); x += w + 6 + Math.floor(Rr() * 14); }
          for (let xx = g2.x0; xx < g2.x1; xx += 12 + Math.floor(Rr() * 14)) crown(c, xx, base - 2, 5 + Math.floor(Rr() * 4), [haze(T.ivy[0], fog, .3), haze(T.ivy[1], fog, .3), haze(T.ivy[2], fog, .3)], Rr);
          hazeBottom(c, g2.x0, g2.x1, base - 20, base + 2, fog, 0, .42);
        } },
        { id: 'rail', k: .34, paint(c, g2) {
          const Rr = rnd(29); monorail(c, Object.assign({ W: g.W }, g2), T, L, Rr);
          const base = hz + 46; c.fillStyle = T.ivy[0]; c.fillRect(g2.x0, base + 8, g2.x1 - g2.x0, g2.y1 - base - 8);
          for (let x = g2.x0; x < g2.x1; x += 22 + Math.floor(Rr() * 26)) { const h = 20 + Math.floor(Rr() * 22); rect(c, x, base - h + 8, 3, h, haze(T.wood[1], fog, .16)); for (const [dx, dy, r] of [[0, -h + 4, 9], [-8, -h + 12, 7], [8, -h + 12, 7]]) crown(c, x + dx, base + dy, r, [haze(T.ivy[0], fog, .16), haze(T.ivy[1], fog, .16), haze(T.ivy[2], fog, .16)], Rr); }
          for (let x = g2.x0; x < g2.x1; x += 7 + Math.floor(Rr() * 8)) crown(c, x, base + 8, 5, [haze(T.ivy[0], fog, .1), haze(T.ivy[1], fog, .1), haze(T.ivy[2], fog, .1)], Rr);
          hazeBottom(c, g2.x0, g2.x1, base - 8, base + 18, fog, 0, .2);
        } },
        { id: 'stage', k: .55, stage: true, live: true,
          paint(c, g2) { stage(c, Object.assign({ H: g.H, W: g.W }, g2), T, L, st()); },
          live(c, f, g2) { ECO.draw(c, f, g2); } },
        { id: 'near', k: .95, paint(c, g2) {
          const Rr = rnd(37), W = g.W;
          for (let x = g2.x0; x < g2.x1; x++) { const d = 4 + Math.round(2 * Math.sin(x / 9) + 1.5 * Math.sin(x / 3.7)); c.fillStyle = T.ivy[0]; c.fillRect(x, g2.y0, 1, d + 2 - g2.y0); c.fillStyle = T.ivy[1]; c.fillRect(x, g2.y0, 1, d - g2.y0); }
          for (let x = g2.x0; x < g2.x1; x += 4) if (Rr() < .5) disk(c, x, 2 + Math.floor(Rr() * 5), 2 + Math.floor(Rr() * 2), Rr() < .4 ? T.ivy[0] : Rr() < .6 ? T.ivy[1] : T.ivy[2]);
          for (let i = 0; i < 11; i++) { const x = Math.round(g2.x0 + Rr() * (g2.x1 - g2.x0)), len = Math.round(g.H * (.06 + Rr() * .24)); for (let j = 0; j < len; j++) { const xx = x + Math.round(Math.sin(j / 5 + i) * 1.6); px(c, xx, 6 + j, j % 6 === 5 ? T.ivy[2] : j % 3 === 0 ? T.ivy[0] : T.ivy[1]); if (j % 5 === 3) { px(c, xx + 1, 6 + j, T.ivy[2]); px(c, xx - 1, 6 + j + 1, T.ivy[1]); } } }
          pole(c, -2, g.H + 20, g.H + 24, T, Rr);
        } },
        { id: 'fg', k: 1.8, blur: 2.6, op: .94, paint(c, g2) {
          const Rr = rnd(7), W = g.W, H = g.H;
          for (const [x, s] of [[g2.x0 + 10, .9], [W - 12, 1]]) for (let i = -5; i <= 5; i++) { const h = Math.round((26 + (i * 7 & 7) * 2) * s); for (let j = 0; j < h; j++) { const lean = Math.round(i * j * .06 + (x > W / 2 ? -1 : 1) * j * .05); px(c, x + i * 2 + lean, H + 6 - j, j > h - 6 ? T.plas[2] : T.leaf[(i + j) & 1 ? 1 : 0]); } for (let k = 0; k < 4; k++) rect(c, x + i * 2 + Math.round(i * h * .06) - 2, H + 6 - h - 4 + k, 4, 2, mix(T.plas[1], T.leaf[2], .45)); }
          for (let i = 0; i < 9; i++) { const x = g2.x1 - 6 - Math.floor(Rr() * 40), y = 4 + Math.floor(Rr() * 30); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]]) px(c, x + dx, y + dy, '#5a7af0'); px(c, x, y, '#ffffff'); }
        } },
      ];
    },
    lights(f, g) {
      const T = g.T, L = g.L, n = g.mood === 'night', out = [], d = g.mood === 'day';
      const cw = Math.round(g.W * .36) + 20; out.push({ x: cw, y: L.rail + 14, r: 26, col: '#ffe2a0', a: n ? .5 : g.mood === 'sunset' ? .3 : .06 });
      out.push({ x: Math.round(g.W * .58), y: L.hz - 52, r: f % 12 < 6 ? 12 : 4, col: '#ff6a5a', a: n ? .9 : .2 });
      if (g.mood === 'sunset') out.push({ x: g.W * .24, y: L.hz - 10, r: 90, col: '#ff9a62', a: .32 }); if (g.mood === 'morning') out.push({ x: g.W * .78, y: L.hz - 14, r: 90, col: '#ffe2a0', a: .3 });
      if (d) out.push({ x: g.W * .3, y: L.hz * .28, r: 100, col: '#fff6d0', a: .26 });
      return out;
    },
  });
})();
