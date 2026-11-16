/* ---------- the Rainy Day burrow ----------
   It is raining and you are safe. A round-doored house in a mossy hill at dusk: a warm lit door with the coins heaped inside (as full as the
   goal is), round windows, a leaf over the door, a lantern, a chimney with smoke. The rain falls on the hill and runs off it and never gets
   in; puddles show the door's gold light. A frog sits under a lily leaf, a mouse holds a leaf umbrella, a snail with a glowing shell crawls
   past, mushrooms glow, wisps drift. Every so often the house "breathes": the lights swell, the wisps swirl to the door and the creatures
   look that way. The same happens when the squirrel stocks the burrow. A far flash of lightning now and then makes the lamplight feel warmer. */
(() => {
  const R = BUR.LOOKS, W = 96, H = 72, GY = 68, CX = 48;
  const HILL = ['#0c2119', '#13382a', '#13382a', '#1c5238', '#2a7250', '#43945f'];
  const WOOD = ['#553318', '#7a4c28', '#9a5222', '#a06c3c'];
  const STONE = ['#2f3f4c', '#4b5f6e', '#7a726a', '#7d9cc4'];
  const GOLD = ['#7a4c28', '#dc9c1e', '#fcd23c', '#fff1b0'];
  const ROOM = ['#1a0f08', '#34200f', '#5e2e12', '#a06c3c', '#d27c32', '#f0aa5e'];
  let A = null, B = null;                       /* cached pictures: the hill and path, and the door frame, leaf, windows, lantern, chimney */
  const px = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); };
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w, h); };
  const ellPx = (g, cx, cy, rx, ry, c) => { g.fillStyle = c; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1); } };
  const doorHW = y => y >= 56 ? 10 : Math.round(Math.sqrt(Math.max(0, 100 - (56 - y) * (56 - y))));
  const BAY = [[0, 2], [3, 1]];
  function mk() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function buildA() {
    A = mk(); const g = A.getContext('2d'), rnd = BUR.rng(11), inE = (x, y) => ((x + .5 - CX) / 45) ** 2 + ((y + .5 - GY) / 43) ** 2 <= 1;
    /* a value noise so the moss is patchy */
    const N = []; for (let i = 0; i < 24 * 20; i++) N.push(rnd());
    const noise = (x, y) => { const fx = x / 4, fy = y / 4, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, a = N[(iy % 20) * 24 + (ix % 24)], b = N[(iy % 20) * 24 + ((ix + 1) % 24)], c = N[((iy + 1) % 20) * 24 + (ix % 24)], d = N[((iy + 1) % 20) * 24 + ((ix + 1) % 24)]; return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty; };
    for (let y = 24; y <= GY; y++) for (let x = 0; x < W; x++) {
      if (!inE(x, y)) continue; const nx = (x + .5 - CX) / 45, ny = (GY - y) / 43;
      let l = .5 - .26 * ny - .16 * nx + (noise(x * 1.3, y * 1.6) - .5) * .5 + (rnd() - .5) * .08 + .14 * Math.exp(-(((x - 30) / 14) ** 2 + ((y - 42) / 10) ** 2));
      l += BAY[y & 1][x & 1] * .025; const i = Math.max(0, Math.min(5, Math.floor(l * 6))); px(g, x, y, HILL[i]);
    }
    /* the rim: a dark line round the hill and a pale grass fringe above it */
    for (let y = 22; y <= GY; y++) for (let x = 0; x < W; x++) { if (inE(x, y)) continue; if (inE(x - 1, y) || inE(x + 1, y) || inE(x, y + 1)) { px(g, x, y, '#06130e'); } }
    for (let x = 4; x < W - 4; x++) { let y = 22; while (y < GY && !inE(x, y)) y++; if (y < GY && rnd() < .55) { const h = 1 + (rnd() * 3 | 0); for (let j = 1; j <= h; j++) px(g, x + (j > 2 ? (rnd() < .5 ? -1 : 1) : 0), y - j, j === h ? HILL[5] : HILL[4]); } }
    /* tufts, ferns and little glowing bluebells on the hill */
    for (let i = 0; i < 46; i++) { const x = 5 + (rnd() * 86 | 0), y = 30 + (rnd() * 36 | 0); if (!inE(x, y) || (x > 34 && x < 62 && y > 38) || (y > 46 && (Math.abs(x - 22) < 6 || Math.abs(x - 74) < 6))) continue; const c = HILL[3 + (rnd() * 3 | 0)]; px(g, x, y, c); px(g, x, y - 1, c); if (rnd() < .5) px(g, x + 1, y - 2, c); }
    [[16, 60], [26, 63], [70, 62], [80, 58], [58, 42], [36, 41], [12, 52], [84, 50]].forEach(([x, y], i) => { if (!inE(x, y)) return; px(g, x, y, '#34206c'); px(g, x, y - 1, i % 2 ? '#a2c8ee' : '#bca0f4'); px(g, x, y + 1, HILL[2]); });
    /* stepping stones to the door, wet and shining */
    [[40, 69, 4.4, 1.6], [54, 70, 5, 1.7], [47, 71, 3.6, 1.2], [31, 69, 3, 1.2], [65, 69, 3.4, 1.2]].forEach(([cx, cy, rx, ry]) => { ellPx(g, cx, cy, rx, ry, STONE[1]); ellPx(g, cx - .4, cy - .3, rx - .9, ry - .5, STONE[2]); px(g, cx - 1, cy - 1, STONE[3]); });
    /* the dirt under the ground line */
    for (let y = GY + 1; y < H; y++) for (let x = 0; x < W; x++) px(g, x, y, y === GY + 1 ? '#221e1e' : (x * 7 + y * 3) % 11 === 0 ? '#34200f' : '#1a0f08');
  }
  function buildB() {
    B = mk(); const g = B.getContext('2d');
    /* the door frame: a round-topped ring of wood with iron studs */
    for (let y = 43; y <= GY; y++) { const ho = doorHW(y + 2) + 2 > 12 ? 12 : doorHW(y + 2) + 2, hi = doorHW(y); for (let x = CX - ho; x < CX + ho; x++) { if (Math.abs(x - CX + .5) < hi && y > 45) continue; const l = x < CX - 4 ? 3 : x < CX ? 2 : 1; px(g, x, y, WOOD[Math.min(3, l + (y % 5 === 0 ? -1 : 0))]); } }
    for (let y = 46; y < 56; y += 3) { px(g, CX - 11, y, '#f0aa5e'); px(g, CX + 10, y, '#7a726a'); }
    rect(g, CX - 13, GY - 1, 26, 2, STONE[2]); rect(g, CX - 13, GY - 1, 26, 1, STONE[3]);
    /* round windows with a cross, each in a ring of wood */
    [[22, 54], [74, 54]].forEach(([x, y]) => { ellPx(g, x, y, 5.6, 5.6, WOOD[0]); ellPx(g, x, y, 5, 5, WOOD[2]); ellPx(g, x, y, 3.8, 3.8, '#2c1408'); ellPx(g, x - 1, y - 1, 1, 1, WOOD[3]); });
    /* the leaf over the door: a broad curved leaf with a pale vein, dripping at its tip */
    for (let x = 30; x <= 68; x++) { const u = (x - 30) / 38, top = 46 - Math.sin(u * Math.PI) * 8 + u * 3, th = Math.sin(Math.min(1, u * 1.05) * Math.PI) * 4.6 + .6;
      for (let y = Math.floor(top); y <= top + th; y++) { const v = (y - top) / th; px(g, x, y, v < .25 ? '#7cc489' : v < .6 ? '#43945f' : v < .85 ? '#2a7250' : '#1c5238'); }
      if (u > .05 && u < .92) px(g, x, Math.round(top + th * .42), '#c0eba8'); px(g, x, Math.floor(top) - 1, '#0c2119'); }
    for (let i = 0; i < 5; i++) px(g, 66 + i * .5, 49 + i, '#43945f');
    /* the lantern on its post */
    rect(g, 11, 56, 2, 12, WOOD[1]); rect(g, 10, 55, 4, 1, '#1b2530'); rect(g, 9, 49, 6, 1, '#1b2530'); rect(g, 9, 50, 1, 5, '#1b2530'); rect(g, 14, 50, 1, 5, '#1b2530'); rect(g, 9, 55, 6, 1, '#1b2530'); rect(g, 11, 47, 2, 2, '#1b2530'); px(g, 12, 46, '#1b2530');
    /* the chimney: stones and a cap */
    for (let y = 27; y < 36; y++) for (let x = 70; x < 76; x++) px(g, x, y, ((x + (y >> 1)) % 3 === 0) ? STONE[0] : (x === 70 ? STONE[2] : STONE[1])); rect(g, 69, 26, 8, 2, STONE[2]); rect(g, 69, 26, 8, 1, STONE[3]);
  }
  /* the door's room: a warm glow from the middle, a hanging lamp, a rug, a cushion; then the heap of coins on the floor, as high as the goal is full */
  function room(g, pct, t, I) {
    const fl = 1 + .05 * Math.sin(t / 90) + .04 * Math.sin(t / 37 + 1), cxm = CX, cym = 60;
    for (let y = 46; y < GY; y++) { const hw = doorHW(y); for (let x = CX - hw; x < CX + hw; x++) { const d = Math.hypot((x - cxm) / 11, (y - cym) / 15) / fl; let v = Math.max(0, 1.0 - d) * I * .92 + BAY[y & 1][x & 1] * .03; if (y > 63) v *= .8; px(g, x, y, ROOM[Math.max(0, Math.min(5, Math.floor(v * 6)))]); } }
    for (let x = CX - 9; x < CX + 9; x++) px(g, x, 64, '#34200f'); rect(g, CX - 6, 65, 12, 2, '#82325a'); rect(g, CX - 6, 65, 12, 1, '#bc5886');
    rect(g, CX - 1, 46, 1, 3, '#2c1408'); ellPx(g, CX - .5, 50, 2.2, 1.8, '#fff1b0'); ellPx(g, CX - .5, 50, 1.2, 1, '#f6f2ea');
    ellPx(g, CX - 7, 63.5, 2.6, 2, '#5e42a0'); ellPx(g, CX - 7.3, 63, 1.4, 1, '#8c6cd0');
    const Hc = Math.round(Math.max(0, Math.min(1, pct)) * 19); if (Hc <= 0) return;
    for (let x = CX - 10; x < CX + 10; x++) { const top = Hc - Math.round(Math.pow(Math.abs(x + .5 - CX) / 10, 2.1) * Math.min(Hc, 8)); for (let j = 0; j < top; j++) { const y = GY - 1 - j; if (Math.abs(x + .5 - CX) > doorHW(y)) continue; const edge = j === top - 1, band = (y + (x >> 2)) % 3; px(g, x, y, edge ? GOLD[3] : band === 0 ? GOLD[1] : band === 1 ? GOLD[2] : ((x * 3 + y * 2) % 7 === 0 ? GOLD[3] : GOLD[2])); if (j === 0) px(g, x, y, GOLD[0]); if (edge && top > 1) px(g, x, y - 1, GOLD[0]); } }
    for (let i = 0; i < 4; i++) { const x = CX - 8 + ((i * 7 + Math.floor(t / 700)) * 5) % 16, top = Hc - Math.round(Math.pow(Math.abs(x + .5 - CX) / 10, 2.1) * Math.min(Hc, 8)); if (top > 0 && ((t / 160 + i * 3) | 0) % 9 === 0) { const y = GY - top; px(g, x, y, '#f6f2ea'); px(g, x - 1, y, '#fff1b0'); px(g, x + 1, y, '#fff1b0'); px(g, x, y - 1, '#fff1b0'); } }
  }
  R.rainy = { mood: 'night', w: W, h: H, sink: 4,
    door: k => ({ x: k.x0 + CX }),
    paint(g, pct, t, k) {
      if (!A) { buildA(); buildB(); } const I = 1 + .25 * pulseEnv(t);
      g.drawImage(A, 0, 0); room(g, pct, t, I); g.drawImage(B, 0, 0);
      const fl = 1 + .07 * Math.sin(t / 110) + .05 * Math.sin(t / 43 + 2);
      [[22, 54], [74, 54]].forEach(([x, y], i) => { const v = Math.max(0, Math.min(5, Math.floor((.8 + .12 * Math.sin(t / 300 + i * 2) * fl + .15 * pulseEnv(t)) * 6))); ellPx(g, x, y, 3.8, 3.8, ROOM[v]); ellPx(g, x - .5, y - .5, 1.7, 1.7, ROOM[5]); rect(g, x - 4, y, 9, 1, WOOD[1]); rect(g, x, y - 4, 1, 9, WOOD[1]); });
      rect(g, 10, 50, 4, 5, '#ffd470'); rect(g, 11, 51, 2, 3, fl > 1.04 ? '#f6f2ea' : '#fff1b0'); px(g, 12, 49, '#f6a944');
    } };

  /* ---------- the world behind the burrow: it replaces the forest scene on this screen ----------
     Painted once per size (and again when the fund passes a tenth, because the fuller it is the calmer the sky): storm sky and moon, a layer of
     far trees in mist, nearer trees, a mossy wet ground with a stone path to the door, puddles all the way across, two framing trunks with ivy,
     fern fronds at the corners and a leafy canopy at the top. On a wide screen there is an owl's branch on the left and a toadstool house on
     the right. Clouds are a second picture that drifts across slowly. */
  const BAY4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = (c, a) => a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  let PUDS = [], OWL = null, HOUSE = null;

  /* ---------- the lake in front of the door: a small rain-pocked pond with stepping stones to the door, lily pads and reeds. The fish and the
     glints are drawn by the fx layer. Everything is placed, not scattered: the pads sit in groups away from the stones. ---------- */
  let LAKE = null;
  function lake(g, W, H, gy, cx, rnd, moonX) {
    const B = BAY4, N = PAL.night, M = PAL.moss, top = gy + 7, bot = H - 5, ry = Math.max(8, (bot - top) / 2), cy = top + ry, rx = Math.min(W * .43, 64), ph = rnd() * 6.28;
    const half = (y, k) => { const dy = (y - cy) / ry, e = Math.sqrt(Math.max(0, 1 - dy * dy)); return rx * e * (1 + .05 * Math.sin(y * .6 + ph) + .035 * Math.sin(y * .21 + ph * 2)) + k; };
    const water = (x, y) => Math.abs(x - cx) <= half(y, 0) - .5;
    for (let y = Math.floor(top - 2); y <= bot + 2; y++) { const ho = half(y, 3.2), hw = half(y, 0); if (ho < 1.5) continue;
      for (let x = Math.ceil(cx - ho); x <= cx + ho; x++) { const d = Math.abs(x - cx) - hw;
        if (d > 0) { if (d > 2 && B[y & 3][x & 3] > 8) continue; px(g, x, y, (x * 7 + y * 3) % 5 === 0 ? PAL.bark[1] : x < cx ? M[2] : M[1]); continue; }
        const v = (y - top) / (2 * ry), lv = Math.max(.9, 3.3 - 2.3 * v), ci = Math.floor(lv), idx = Math.min(4, ci + ((lv - ci) * 16 > B[y & 3][x & 3] ? 1 : 0)); px(g, x, y, N[idx]); } }
    /* sky and moon lying on the water in short dashes, in groups */
    for (let n = 0; n < 5; n++) { const y = Math.round(top + 3 + rnd() * (2 * ry - 8)), x = Math.round(cx + (rnd() - .5) * rx * 1.5); for (let m = 0; m < 3; m++) { const yy = y + m * 2, xx = x + Math.round((rnd() - .5) * 4), len = 3 + (rnd() * 6 | 0); if (!water(xx, yy) || !water(xx + len, yy) || !water(xx - 1, yy)) continue; rect(g, xx, yy, len, 1, N[4]); px(g, xx + (len >> 1), yy, N[5]); } }
    if (moonX > cx - rx * .8 && moonX < cx + rx * .8) for (let m = 0; m < 4; m++) { const y = top + 4 + m * 3, len = 5 - m; if (water(moonX - 3, y) && water(moonX + 4, y)) rect(g, Math.round(moonX - len / 2), y, len, 1, N[6]); }
    /* stepping stones across, nearer = bigger, with the wet ring round each and a little moss on some */
    const n = Math.max(5, Math.min(9, Math.round(2 * ry / 8))), stones = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1), y = top + 3 + t * (2 * ry - 9), x = cx + Math.sin(i * 1.9 + ph) * 5 + (rnd() - .5) * 1.6, sr = 3 + t * 5, sy = 1.2 + t * 1.7; stones.push([x, y, sr, sy]);
      for (let a = 0; a < 14; a++) { const an = a / 14 * 6.283, rxx = sr + 1.8, ryy = sy + 1; if (Math.sin(an) > -.2) px(g, x + Math.cos(an) * rxx, y + Math.sin(an) * ryy + .8, N[4]); }
      ellPx(g, x, y + .9, sr + .8, sy + .6, N[0]); ellPx(g, x, y, sr, sy, PAL.stone[1]); ellPx(g, x, y - .3, sr - .8, sy - .4, PAL.stone[2]); ellPx(g, x - sr * .2, y - sy * .5, sr * .5, sy * .3, PAL.stone[3]); px(g, x - sr * .45, y - sy * .55, PAL.stone[4]);
      if (i % 3 === 1) { px(g, x + sr * .3, y - sy * .6, M[3]); px(g, x + sr * .3 + 1, y - sy * .6, M[4]); px(g, x + sr * .3 + 2, y - sy * .4, M[3]); } }
    /* lily pads in groups of three, a notch cut in each, a flower on two */
    const pads = [], nearStone = (x, y) => stones.some(([sx, sy, sr, sh]) => Math.abs(y - sy) < sh + 4 && Math.abs(x - sx) < sr + 8);
    let flowers = 0;
    for (let gI = 0; gI < 3; gI++) { for (let tr = 0; tr < 12; tr++) { const bx = cx + (rnd() - .5) * rx * 1.5, by = top + 5 + rnd() * (2 * ry - 12); if (!water(bx - 9, by) || !water(bx + 9, by) || nearStone(bx, by)) continue;
      for (let m = 0; m < 3; m++) { const x = bx + (m ? (m === 1 ? -6 : 5) : 0) + (rnd() - .5) * 2, y = by + (m ? (m === 1 ? 2 : -1.5) : 0), r = 3 + rnd() * 1.4, h = 1.3 + rnd() * .5; if (!water(x - r, y) || !water(x + r, y) || nearStone(x, y)) continue; pads.push([x, y, r, h]);
        ellPx(g, x, y + .5, r + .6, h + .5, M[1]); ellPx(g, x, y, r, h, M[3]); ellPx(g, x - 1, y - .5, r - 1.4, h - .6, M[4]); const sd = rnd() < .5 ? -1 : 1; px(g, x + sd * (r - 1), y, N[2]); px(g, x + sd * r, y, N[2]); px(g, x + sd * (r - 1), y - 1, N[2]);
        if (flowers < 2 && m === 0) { flowers++; px(g, x, y - 1, PAL.rose[4]); px(g, x - 1, y - 1, PAL.rose[3]); px(g, x + 1, y - 1, PAL.rose[3]); px(g, x, y - 2, PAL.rose[5]); px(g, x, y, PAL.ember[5]); } }
      break; } }
    /* reeds, straight, in two stands on the shore */
    [-1, 1].forEach((sd, si) => { const rxp = cx + sd * (half(cy + 2, 0) + 4 + si * 2), ryp = cy + 3; for (let b = 0; b < 5; b++) { const x = rxp + sd * (b * 1.3 - 2), hgt = 7 + (rnd() * 6 | 0); for (let j = 0; j < hgt; j++) px(g, x, ryp - j, j > hgt - 3 && b % 2 === 0 ? PAL.bark[2] : M[b % 2 ? 3 : 2]); if (b % 2 === 0) { rect(g, x, ryp - hgt - 2, 1, 3, PAL.bark[2]); px(g, x, ryp - hgt - 2, PAL.bark[3]); } } });
    const sparks = []; for (let i = 0; i < 16; i++) { const y = top + 2 + rnd() * (2 * ry - 5), x = cx + (rnd() - .5) * rx * 1.7; if (water(x, y)) sparks.push([Math.round(x), Math.round(y), rnd() * 6.28]); }
    LAKE = { cx, cy, rx, ry, top, bot, pads, stones, sparks }; PUDS.push([cx, cy, rx * .86, ry * .86]);
  }
  function bg(g0, cg, g, k, pct) {
    const W = k.W, H = k.H, gy = Math.round(k.ground), cx = Math.round(k.x0 + CX), rnd = BUR.rng(21), calm = Math.max(0, Math.min(1, pct)), wide = W >= 200;
    const top = mixc([6, 11, 24], [22, 24, 58], calm), mid = mixc([18, 31, 52], [58, 48, 92], calm), hor = mixc([38, 60, 78], [156, 104, 108], calm * .85);
    const img = g0.createImageData(W, gy + 2), d = img.data;
    for (let y = 0; y < gy + 2; y++) for (let x = 0; x < W; x++) { const t = Math.min(1, y / gy), c = t < .55 ? mixc(top, mid, t / .55) : mixc(mid, hor, (t - .55) / .45), b = (BAY4[y & 3][x & 3] / 16 - .5) * 7, i = (y * W + x) * 4; d[i] = c[0] + b; d[i + 1] = c[1] + b; d[i + 2] = c[2] + b; d[i + 3] = 255; }
    g0.putImageData(img, 0, 0); g.clearRect(0, 0, W, H);
    const gi = g.createImageData(W, H - gy), gd = gi.data;
    for (let y = 0; y < H - gy; y++) for (let x = 0; x < W; x++) { const t = y / Math.max(1, H - gy), b = (BAY4[y & 3][x & 3] / 16 - .5) * 5, i = (y * W + x) * 4; gd[i] = 14 - 6 * t + b; gd[i + 1] = 34 - 14 * t + b; gd[i + 2] = 26 - 10 * t + b; gd[i + 3] = 255; }
    g.putImageData(gi, 0, gy);
    /* moon, stars when the storm is over */
    const mx = Math.round(W * .2), my = Math.round(gy * .2);
    PXK.halo(g0, mx, my, 40, PAL.night[6], .26 + calm * .12);
    ellPx(g0, mx, my, 6, 6, '#dff0ff'); ellPx(g0, mx - 1.6, my + 1, 1.5, 1.5, '#a4bcc8'); ellPx(g0, mx + 2, my - 2, 1.1, 1.1, '#a4bcc8'); ellPx(g0, mx + 1.4, my + 2.6, .9, .9, '#a4bcc8');
    if (calm > .55) { const n = Math.round(70 * (calm - .5) * 2), A = Math.min(1, (calm - .55) * 3); for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * gy * .62; g0.fillStyle = `rgba(230,238,255,${(.3 + rnd() * .7) * A})`; g0.fillRect(x | 0, y | 0, 1, 1); if (rnd() < .12) { g0.fillRect((x | 0) - 1, y | 0, 3, 1); g0.fillRect(x | 0, (y | 0) - 1, 1, 3); } } }
    /* clouds on their own wide picture (twice the width so it can drift and wrap) */
    cg.clearRect(0, 0, W * 2, H); const nC = Math.round(10 * (1 - .65 * calm)), cC = ['#0a1424', '#1b3150', '#2b4a72'];
    for (let i = 0; i < nC; i++) { const x = (i + rnd() * .8) / nC * W, y = gy * (.06 + rnd() * .36), w = 40 + rnd() * 60, h = 8 + rnd() * 9;
      for (const off of [0, W]) { for (let pass = 0; pass < 3; pass++) { const dy = [1.2, 0, -1.4][pass], sh = [1, .94, .7][pass]; for (let j = 0; j < 6; j++) { const u = j / 5, px0 = x + off + (u - .5) * w, py0 = y + Math.sin(j * 2.3 + i) * h * .22, rx = w * .22 * (.75 + (j * 37 % 5) / 10), ry = h * .5 * (.75 + (j * 17 % 4) / 8) * sh; ellPx(cg, px0, py0 + dy + ry * .3, rx, ry, cC[pass]); } } } }
    /* trees: one layer of far conifers in mist, one of nearer round-crowned trees */
    const conifer = (x, base, h, w, col, hi) => { const top = base - h; for (let y = top; y < base - 3; y++) { let half = Math.round((y - top) / h * w / 2 + ((y - top) % 4 === 0 ? 1.2 : 0)); g.fillStyle = col; g.fillRect(x - half, y, half * 2 + 1, 1); g.fillStyle = hi; g.fillRect(x - half, y, 1, 1); } g.fillStyle = col; g.fillRect(x - 1, base - 4, 2, 4); };
    const mist = (y0, y1, a, c) => { for (let y = y0; y < y1; y++) { g.fillStyle = rgb(c, a * (y - y0) / (y1 - y0)); g.fillRect(0, y, W, 1); } };
    for (let x = -4; x < W + 6; x += 5 + (rnd() * 4 | 0)) conifer(x, gy - 1, 26 + rnd() * 30, 11 + rnd() * 7, '#111f36', '#1b3150');
    mist(gy - 24, gy, .42, [58, 88, 112]);
    for (let x = -2; x < W + 10; x += 12 + (rnd() * 10 | 0)) { const h = 30 + rnd() * 26, w = 13 + rnd() * 8, ty = gy + 1 - h;
      g.fillStyle = '#0b1118'; g.fillRect(x - 1, ty + h * .4, 3, h * .6); for (let j = 0; j < 5; j++) { const px0 = x + (rnd() - .5) * w, py0 = ty + rnd() * h * .34; ellPx(g, px0, py0 + 1, w * .32, h * .15, '#0b1118'); ellPx(g, px0 - 1, py0, w * .32, h * .15, '#0a2630'); ellPx(g, px0 - 2, py0 - 2, w * .16, h * .07, '#10424e'); } }
    mist(gy - 14, gy + 2, .26, [48, 80, 98]);
    /* the ground: wet moss, tufts and shine; a stone path from the door that widens toward you */
    for (let y = gy; y < H; y++) { const t = (y - gy) / Math.max(1, H - gy); for (let x = 0; x < W; x++) { const r = rnd(); if (r < .045) px(g, x, y, t < .5 ? '#1c5238' : '#13382a'); else if (r < .06) px(g, x, y, '#0c2119'); }
      if (rnd() < .5) { const len = 3 + (rnd() * 9 | 0), xx = rnd() * W | 0; g.fillStyle = `rgba(150,190,225,${.05 + .06 * (1 - t)})`; g.fillRect(xx, y, len, 1); } }
    for (let i = 0; i < 34; i++) { const x = rnd() * W | 0, y = gy + 2 + (rnd() * (H - gy - 3) | 0), h = 2 + (rnd() * 3 | 0); g.fillStyle = '#1c5238'; for (let j = 0; j < h; j++) g.fillRect(x + (j > 1 ? 1 : 0), y - j, 1, 1); g.fillStyle = '#2a7250'; g.fillRect(x + (h > 2 ? 1 : 0), y - h, 1, 1); }
    PUDS = [];
    for (let i = 0; i < 8; i++) { const t = rnd(), x = rnd() * W, y = gy + 8 + t * (H - gy - 12), rx = 5 + t * 16 + rnd() * 5; if (Math.abs(x - cx) < 26 && y < gy + 14) continue; PUDS.push([x, y, rx, rx * .2 + .6]); ellPx(g, x, y, rx, rx * .2 + .6, 'rgba(12,30,48,.62)'); ellPx(g, x, y - .4, rx - 2, rx * .2, rgb(mixc(hor, [90, 130, 180], .4), .32)); }
    lake(g, W, H, gy, cx, rnd, mx);
    /* framing trunks: grooved bark in three tones, moss, knots, roots, and a thin rim of the door's light on the inner edge */
    const tw = wide ? 19 : 9;
    for (const side of [-1, 1]) { const x0 = side < 0 ? -3 : W - tw, x1 = side < 0 ? tw : W + 3;
      for (let y = 0; y <= gy + 6; y++) for (let x = x0; x < x1; x++) { const u = (x - x0) / (x1 - x0), inner = side < 0 ? u : 1 - u, v = (x * 5 + ((x * 73 + (y >> 4) * 151) % 17 < 2 ? 3 : 0)) % 9; let c = v < 2 ? '#06130e' : v < 5 ? '#0c2119' : v < 7 ? '#13382a' : '#13382a'; if (inner > .86) c = inner > .94 ? '#2a7250' : '#1c5238'; else if (inner > .7 && v > 6) c = '#1c5238'; if (inner < .1) c = '#06130e'; px(g, x, y, c); }
      for (let i = 0; i < 9; i++) { const mxp = side < 0 ? rnd() * tw * .6 : W - rnd() * tw * .6, myp = rnd() * (gy + 4); ellPx(g, mxp, myp, 1.5 + rnd() * 2.5, 2 + rnd() * 4, '#1c5238'); ellPx(g, mxp - .5, myp - 1, 1, 2, '#43945f'); }
      for (let i = 0; i < 3; i++) { const kx = side < 0 ? 3 + rnd() * (tw - 8) : W - tw + 3 + rnd() * (tw - 8), ky = 20 + rnd() * (gy - 40); ellPx(g, kx, ky, 2.2, 3, '#06130e'); ellPx(g, kx, ky + .4, 1.4, 2.2, '#0c2119'); }
      for (let i = 0; i < 4; i++) { const rx = side < 0 ? tw + 1 + i * 2 : W - tw - 1 - i * 2; for (let j = 0; j < 4 - i; j++) px(g, rx + side * i * .5, gy + 4 + j - i, '#0c2119'); }
    }
    const bY = Math.round(gy * .36), bL = Math.min(30, Math.round(W * .13));
    if (wide) { rect(g, tw - 2, bY, bL, 3, '#1b2530'); rect(g, tw - 2, bY, bL, 1, '#1c5238'); rect(g, tw + bL - 4, bY - 1, 5, 2, '#0c2119'); for (let i = 0; i < 4; i++) ellPx(g, tw + bL + i * 2 - 2, bY - 3 + (i % 2) * 5, 4, 2.4, i % 2 ? '#2a7250' : '#1c5238'); OWL = { x: tw + Math.round(bL * .5), y: bY }; } else OWL = null;
    /* ivy hanging from the canopy, with a few blue bells glowing in it */
    for (let i = 0; i < 9; i++) { const x = rnd() * W | 0, len = 6 + (rnd() * 18 | 0); for (let j = 0; j < len; j++) { px(g, x + (j % 7 < 3 ? 0 : 1), j, '#13382a'); if (j % 4 === 2) { px(g, x - 1, j, '#2a7250'); px(g, x + 2, j, '#43945f'); } } if (rnd() < .5) { px(g, x, len, '#a2c8ee'); px(g, x, len - 1, '#8c6cd0'); } }
    /* a toadstool house on a wide screen, its round window lit by the fx layer */
    if (wide) { const hx = W - tw - 40, hb = gy + 3; HOUSE = { x: hx, y: hb - 9 }; rect(g, hx - 5, hb - 13, 10, 13, '#d8d2c8'); rect(g, hx - 5, hb - 13, 2, 13, '#d8d2c8'); rect(g, hx + 3, hb - 13, 2, 13, '#aaa298'); ellPx(g, hx, hb - 17, 17, 8, '#521e3c'); ellPx(g, hx, hb - 17.6, 16.2, 7.2, '#82325a'); ellPx(g, hx - 4, hb - 20, 8, 3, '#bc5886');
      [[-9, -19, 1.6], [-2, -22, 1.4], [6, -20, 1.8], [11, -16, 1.2], [1, -17, 1]].forEach(([ox, oy, r]) => ellPx(g, hx + ox, hb + oy, r, r * .8, '#ffc8d8')); ellPx(g, hx, hb - 8, 3.8, 3.8, '#34200f'); rect(g, hx - 2, hb - 5, 5, 5, '#553318'); px(g, hx + 1, hb - 3, '#cc9a62'); } else HOUSE = null;
    /* fern fronds in the front corners, and a canopy across the top */
    const fern = (ox, oy, dir, n, L) => { for (let f = 0; f < n; f++) { const a = (f / (n - 1) - .5) * 2.2 + dir * .5, len = L * (.7 + .3 * Math.cos(a * 1.3)); for (let s = 0; s < len; s += 1) { const x = ox + Math.sin(a) * s + dir * s * s * .01, y = oy - Math.cos(a) * s * .8 + s * s * .012; px(g, x, y, '#0c2119'); if (s % 2 === 0 && s > 4) { const lf = 4 * (1 - s / len) + 1; for (let q = 1; q <= lf; q++) { px(g, x + Math.cos(a) * q, y + Math.sin(a) * q * .6 + q * .3, s % 4 ? '#13382a' : '#1c5238'); px(g, x - Math.cos(a) * q, y - Math.sin(a) * q * .6 + q * .3, '#0c2119'); } } } } };
    fern(8, H - 1, 1, 6, wide ? 34 : 24); fern(Math.round(W * .2), H - 1, -1, 5, wide ? 22 : 16); fern(W - 9, H - 1, -1, 6, wide ? 34 : 24); fern(Math.round(W * .84), H - 1, 1, 5, wide ? 22 : 16);
    for (let x = -6; x < W + 8; x += 7 + (rnd() * 5 | 0)) { const r = 6 + rnd() * 8; ellPx(g, x, 1, r, 5 + rnd() * 4, '#06130e'); ellPx(g, x - 1, -1, r * .8, 4, '#0c2119'); }
    for (let x = 0; x < W; x += 3 + (rnd() * 6 | 0)) { const h = 10 + (rnd() * 14 | 0); for (let j = 0; j < h; j++) px(g, x, 6 + j, j > h - 3 ? '#1c5238' : '#0c2119'); }
  }
  R.rainy.bg = bg; R.rainy.puds = () => PUDS; R.rainy.lake = () => LAKE; R.rainy.owl = () => OWL; R.rainy.house = () => HOUSE;

  /* ---------- the live layer: weather, light, creatures ---------- */
  const rn = BUR.rng(5);
  let F = null;
  const pulseEnv = t => { const now = performance.now(); let e = 0; if (F) { const u = (now - F.lastPulse) / 2800; if (u >= 0 && u < 1) e = Math.sin(u * Math.PI); } return Math.max(0, e); };
  function init(k) {
    const n = Math.round(k.Wr * k.Hr / 150), drops = [];
    for (let i = 0; i < n; i++) drops.push(newDrop(k, true, i % 3 === 0));
    const wisps = [], nW = k.W >= 200 ? 15 : 9; for (let i = 0; i < nW; i++) wisps.push({ a: rn() * 6.28, sp: .18 + rn() * .3, rx: i < 9 ? 30 + rn() * 34 : 72 + rn() * 44, ry: i < 9 ? 12 + rn() * 22 : 16 + rn() * 28, cy: -26 - rn() * 12, ph: rn() * 6.28, warm: i % 2 === 0 || i < 5 });
    F = { drops, wisps, splashes: [], ripples: [], smoke: [], nextSmoke: 0, nextFlash: 9000 + rn() * 8000, flash: -1, lastPulse: performance.now() - 5000, nextPulse: 6000, last: performance.now(), sn: { x: 0, dir: 1, ph: 0 } };
  }
  function newDrop(k, anywhere, far) { return { x: rn() * (k.Wr + 24) - 8, y: anywhere ? rn() * k.Hr : -6 - rn() * 20, v: far ? 46 + rn() * 20 : 76 + rn() * 34, far, end: (k.ground - 3 + rn() * (k.H - k.ground + 3)) * k.f }; }
  const WIND = .2;
  function shields(k) { const x0 = k.x0, gy = k.ground; return [{ cx: x0 + CX, cy: gy, rx: 45, ry: 43 }, { cx: x0 + 15, cy: gy - 9, rx: 8, ry: 2.6 }, { cx: x0 + 81, cy: gy - 9, rx: 7, ry: 2.2 }]; }

  /* fish under the lake surface (they hide under pads and stones), glints on the water and the odd fish coming up to ripple the top */
  function lakeFx(g, t, k, dt, pe) {
    const L = LAKE; if (!L) return;
    if (!F.fish) F.fish = [[PAL.ember[3], .55, 6], [PAL.ember[4], .5, 5], [PAL.ash[4], .42, 5], [PAL.ember[2], .5, 4]].map((f, i) => ({ x: L.cx + (i - 1.5) * 15, y: L.cy + (i % 2 ? -1 : 1) * L.ry * .3, a: i * 1.7 + .4, sp: 6 + rn() * 4, c: f[0], al: f[1], len: f[2], ph: rn() * 6.28, up: 3 + rn() * 9 }));
    const hid = (x, y) => L.pads.some(p => ((x - p[0]) / (p[2] + .5)) ** 2 + ((y - p[1]) / (p[3] + .5)) ** 2 < 1) || L.stones.some(p => ((x - p[0]) / (p[2] + 1)) ** 2 + ((y - p[1]) / (p[3] + 1)) ** 2 < 1);
    F.fish.forEach(f => {
      f.a += Math.sin(t / 1300 + f.ph) * dt * .9; const ex = (f.x - L.cx) / (L.rx * .78), ey = (f.y - L.cy) / (L.ry * .78);
      if (ex * ex + ey * ey > 1) { const to = Math.atan2((L.cy - f.y) / .45, L.cx - f.x); let d = to - f.a; d = Math.atan2(Math.sin(d), Math.cos(d)); f.a += d * dt * 2.6; }
      f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt * .45;
      f.up -= dt; if (f.up < 0) { f.up = 9 + rn() * 8; if (F.ripples.length < 26) F.ripples.push({ x: f.x, y: f.y, age: 0, rx: 5 }); }
      for (let i = 0; i < f.len; i++) { const wv = Math.sin(t / 170 + f.ph - i * .7) * .7 * (i / f.len + .2), x = f.x - Math.cos(f.a) * i * .95, y = f.y - Math.sin(f.a) * i * .45 + wv; if (hid(x, y)) continue; g.fillStyle = f.c; g.globalAlpha = f.al * (i === 0 ? 1.25 : 1 - i / f.len * .45); g.fillRect(Math.round(x), Math.round(y), 1, 1); if (i === 1) g.fillRect(Math.round(x), Math.round(y) + 1, 1, 1); }
      const tx = f.x - Math.cos(f.a) * f.len, ty = f.y - Math.sin(f.a) * f.len * .45; if (!hid(tx, ty)) { g.fillRect(Math.round(tx), Math.round(ty - 1 + (Math.sin(t / 120 + f.ph) > 0 ? 0 : 1)), 1, 2); } g.globalAlpha = 1; });
    L.sparks.forEach(([x, y, p0], i) => { const a = Math.sin(t / 520 + p0 * 3 + i); if (a > .86 && !hid(x, y)) { g.fillStyle = 'rgba(223,240,255,.7)'; g.fillRect(x, y, 1, 1); if (a > .95) { g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); } } });
  }
  function draw(g, t, k, st) {
    const now = performance.now(), dt = Math.min(.12, (now - F.last) / 1000); F.last = now;
    const x0 = k.x0, y0 = k.y0, gy = k.ground, dx = x0 + CX;
    if (now > F.lastPulse + F.nextPulse) { F.lastPulse = now; F.nextPulse = 10000 + rn() * 5000; }
    if (st.pulse && Math.abs(now - st.pulse) < 80) F.lastPulse = now;
    const pe = pulseEnv(t), fl = 1 + .06 * Math.sin(t / 90) + .04 * Math.sin(t / 37 + 1) + .03 * Math.sin(t / 210);
    /* lightning: a faint far flash */
    if (now > F.nextFlash) { F.flash = now; F.nextFlash = now + 14000 + rn() * 14000; }
    const fa = F.flash >= 0 ? (now - F.flash < 110 ? .13 : now - F.flash > 200 && now - F.flash < 290 ? .07 : 0) : 0;
    /* warm light on the ground and air (added to the scene) */
    g.save(); g.globalCompositeOperation = 'lighter';
    const glow = (cx, cy, r, a, sy) => PXK.halo(g, cx, cy, r, PAL.ember[4], a, sy);
    glow(dx, gy - 10, 46 + 10 * pe, (.2 + .1 * pe) * fl); glow(dx, gy + 3, 48, (.24 + .1 * pe) * fl, .3); glow(x0 + 12, gy - 18, 15, .26 * fl); glow(x0 + 22, y0 + 54, 11, .16 + .05 * pe); glow(x0 + 74, y0 + 54, 11, .16 + .05 * pe);
    g.restore();
    /* puddles: dark water with a sky sheen and the door's light lying on it in a wobbling streak */
    const pud = [[x0 + 28, gy + 5, 13, 2.1], [x0 + 70, gy + 6.5, 10, 1.7], [dx, gy + 10, 17, 2.6]];
    pud.forEach(([cx, cy, rx, ry], i) => { ellPx(g, cx, cy, rx, ry, 'rgba(16,36,58,.42)'); ellPx(g, cx, cy - .5, rx - 2.5, ry - 1, 'rgba(90,130,180,.28)'); });
    for (let j = 0; j < 9; j++) { const y = gy + 8 + j, w = Math.max(1.5, 8 - j * .7) + 1.5 * Math.sin(t / 260 + j), wob = Math.sin(t / 190 + j * 1.7) * (1 + j * .12); g.fillStyle = `rgba(255,190,90,${Math.max(.05, .34 - j * .035) * fl})`; g.fillRect(Math.round(dx - w + wob), y, Math.round(w * 2), 1); }
    lakeFx(g, t, k, dt, pe);
    /* glowing mushrooms */
    [[x0 + 3, gy + 3], [x0 + 91, gy + 2]].forEach(([mx, my], gi) => { const ps = .5 + .5 * Math.sin(t / 900 + gi * 2); PXK.halo(g, mx, my - 4, 12, PAL.teal[4], .18 + .12 * ps);
      [[0, 6, 2.4], [-4, 4, 1.8], [3.5, 3.5, 1.5]].forEach(([ox, h, r]) => { rect(g, mx + ox, my - h, 1, h, '#dff0ff'); ellPx(g, mx + ox + .5, my - h, r, r * .7, '#2a9a98'); ellPx(g, mx + ox + .3, my - h - .3, r * .7, r * .4, '#5ccfc0'); px(g, mx + ox - 1, my - h, '#dff0ff'); }); });
    const shd = (x, y, rx) => { ellPx(g, x, y, rx, rx * .26, 'rgba(0,0,0,.38)'); ellPx(g, x, y, rx * .6, rx * .16, 'rgba(0,0,0,.2)'); };
    shd(x0 + 15, gy + 6.4, 8); shd(x0 + 81, gy + 6.4, 6.4);
    /* the frog under a lily leaf, left of the door */
    const fx = x0 + 15, fy = gy + 6, br = Math.sin(t / 700) * .4, blink = (t % 4200) < 140, rib = (t % 7300) / 1000, puff = rib > 5.6 && rib < 6.1 ? Math.sin((rib - 5.6) / .5 * Math.PI) : 0, look = pe > .3 ? 1 : 0;
    ellPx(g, fx, fy - 3.4, 6.2, 3.6 + br, '#2a7250'); ellPx(g, fx - .3, fy - 3.8, 5.6, 3.1 + br, '#43945f'); ellPx(g, fx - 1.5, fy - 5, 3, 1.3, '#7cc489'); ellPx(g, fx + 1.5, fy - 2, 3.4, 1.6, '#c0eba8');
    if (puff) ellPx(g, fx + 3.4, fy - 2, 2 + puff * 1.4, 1.6 + puff, '#fff1b0');
    ellPx(g, fx - 5, fy - 1.2, 2.4, 1.5, '#2a7250'); ellPx(g, fx + 4, fy - .9, 2, 1.1, '#2a7250');
    [-2.4, 2.8].forEach((ox, i) => { ellPx(g, fx + ox, fy - 7.4, 1.9, 1.9, '#43945f'); if (blink) rect(g, fx + ox - 1, fy - 7, 3, 1, '#1c5238'); else { ellPx(g, fx + ox, fy - 7.4, 1.4, 1.4, '#fcd23c'); px(g, fx + ox + look * .6, fy - 7.6, '#1a0f08'); px(g, fx + ox - .6, fy - 8.2, '#f6f2ea'); } });
    px(g, fx + 5.8, fy - 3.4, '#1c5238'); px(g, fx + 4.8, fy - 3, '#1c5238'); if (rib > 5.5 && rib < 6.6) { const u = (rib - 5.5) / 1.1; px(g, fx + 7 + u * 2, fy - 9 - u * 7, '#dff0ff'); px(g, fx + 8 + u * 2, fy - 10 - u * 7, '#dff0ff'); px(g, fx + 8 + u * 2, fy - 11 - u * 7, '#dff0ff'); }
    rect(g, fx + 4, fy - 15, 1, 10, '#2a7250'); ellPx(g, fx + 2, fy - 16, 8.4, 2.7, '#1c5238'); ellPx(g, fx + 2, fy - 16.5, 7.8, 2.1, '#43945f'); ellPx(g, fx + 1, fy - 17, 5, 1, '#7cc489'); for (let i = -5; i < 6; i++) px(g, fx + 2 + i, fy - 16.5, '#7cc489');
    /* the mouse with a leaf umbrella, right of the door */
    const mx = x0 + 81, my = gy + 6, sw = Math.sin(t / 520), tw = (t % 5200) < 160 ? 1 : 0;
    for (let i = 0; i < 9; i++) px(g, mx - 5 - i * .9, my - 1.5 - Math.sin(i / 8 * 3 + t / 600) * 1.6 - i * .15, '#ffc8d8');
    ellPx(g, mx, my - 3, 4.4, 3.2, '#76909f'); ellPx(g, mx + .5, my - 3.5, 3.8, 2.7, '#a4bcc8'); ellPx(g, mx + 1, my - 2, 2.4, 1.6, '#f6f2ea'); ellPx(g, mx + 3.2, my - 5.4, 3, 2.7, '#a4bcc8'); ellPx(g, mx + 3.8, my - 4.6, 1.8, 1.2, '#f6f2ea');
    ellPx(g, mx + 1.2, my - 8.7 - tw, 2.1, 2.2, '#76909f'); ellPx(g, mx + 1.2, my - 8.5 - tw, 1.2, 1.4, '#ee90b2'); ellPx(g, mx + 4.6, my - 8.9, 2.1, 2.2, '#76909f'); ellPx(g, mx + 4.6, my - 8.7, 1.2, 1.4, '#ee90b2');
    if (pe > .3 || (t % 3600) > 160) { px(g, mx + 5, my - 6, '#1a0f08'); px(g, mx + 5, my - 6.8, '#f6f2ea'); } else rect(g, mx + 4, my - 6, 2, 1, '#555');
    px(g, mx + 6.2, my - 4.6, '#ee90b2'); px(g, mx + 7.2, my - 4.4, '#d8d2c8'); px(g, mx + 7.2, my - 5.2, '#d8d2c8');
    ellPx(g, mx - 2, my - .6, 1.6, 1, '#ee90b2'); ellPx(g, mx + 3, my - .6, 1.6, 1, '#ee90b2'); rect(g, mx + 4, my - 12, 1, 8, '#7a4c28');
    const tilt = sw * 1.2; ellPx(g, mx + 4 + tilt, my - 13.3, 7.4, 2.4, '#1c5238'); ellPx(g, mx + 4 + tilt, my - 13.8, 6.8, 1.9, '#43945f'); for (let i = -5; i < 6; i++) px(g, mx + 4 + tilt + i, my - 13.8, '#7cc489');
    /* the snail with a glowing shell, crossing the stones */
    const sn = F.sn; sn.x += sn.dir * dt * 1.6; if (sn.x > 22) sn.dir = -1; if (sn.x < -22) sn.dir = 1;
    const sx = dx + sn.x, sy = gy + 3, d = sn.dir, sp = .5 + .5 * Math.sin(t / 700); shd(sx, sy + .4, 5.2);
    ellPx(g, sx, sy - 1, 4.4, 1.4, '#f0aa5e'); ellPx(g, sx + d * 3.6, sy - 2.2, 1.8, 1.6, '#d8d2c8'); px(g, sx + d * 4.6, sy - 4, '#d8d2c8'); px(g, sx + d * 3.2, sy - 4.2 - (Math.sin(t / 400) > 0 ? 1 : 0), '#d8d2c8'); px(g, sx + d * 4.6, sy - 5, '#1a0f08'); px(g, sx + d * 3.2, sy - 5.4 - (Math.sin(t / 400) > 0 ? 1 : 0), '#1a0f08');
    ellPx(g, sx - d * 1, sy - 4, 3.2, 3.2, '#5e42a0'); ellPx(g, sx - d * 1.2, sy - 4.2, 2.5, 2.5, `rgb(${150 + 40 * sp | 0},${110 + 40 * sp | 0},${230})`); ellPx(g, sx - d * 1.4, sy - 4.4, 1.2, 1.2, '#e6d8ff'); px(g, sx - d * 3, sy - 6, '#f6f2ea');
    PXK.halo(g, sx, sy - 4, 9, PAL.violet[4], .2 + .15 * sp);
    /* the owl on the branch, left; it turns its eyes to the door at the breath */
    const ow = R.rainy.owl(); if (ow) { const ox = ow.x, oy = ow.y - 1, ob = Math.sin(t / 900) * .3, bl = (t % 5600) < 150, tn = pe > .3 ? 1 : (Math.sin(t / 5000) > .93 ? -1 : 0);
      ellPx(g, ox, oy - 5.5, 4.6, 5.6 + ob, '#34200f'); ellPx(g, ox - .2, oy - 6, 4, 5, '#7a4c28'); ellPx(g, ox - 1, oy - 7.5, 2, 2.4, '#7a726a'); ellPx(g, ox, oy - 4, 2.8, 3.4, '#aaa298');
      [[-1, -5.5], [1, -5.5], [0, -4], [-1, -2.6], [1, -2.6]].forEach(([a, b]) => px(g, ox + a, oy + b, '#7a726a')); ellPx(g, ox - 4.3, oy - 5, 1.3, 3.6, '#34200f'); ellPx(g, ox + 4.3, oy - 5, 1.3, 3.6, '#34200f');
      ellPx(g, ox, oy - 10.4, 4.9, 3.8, '#7a4c28'); ellPx(g, ox - 1.2, oy - 11.6, 2.6, 1.4, '#7a726a'); [[-4, -13], [-3, -14], [4, -13], [3, -14]].forEach(([a, b]) => px(g, ox + a, oy + b, '#553318'));
      [-2.3, 2.3].forEach(o => { ellPx(g, ox + o, oy - 10.2, 2.5, 2.5, '#f0aa5e'); if (bl) rect(g, ox + o - 1.5, oy - 10.4, 3, 1, '#221e1e'); else { ellPx(g, ox + o, oy - 10.2, 1.8, 1.8, '#fcd23c'); px(g, ox + o + tn * .8, oy - 10.4, '#1a0f08'); px(g, ox + o + tn * .8, oy - 9.6, '#1a0f08'); px(g, ox + o - .6, oy - 11.1, '#f6f2ea'); } });
      px(g, ox, oy - 8.9, '#dc9c1e'); px(g, ox, oy - 8.1, '#d27a30'); rect(g, ox - 2, oy - 1, 1, 1, '#d27c32'); rect(g, ox + 1, oy - 1, 1, 1, '#d27c32');
      PXK.halo(g, ox, oy - 10, 9, PAL.ember[5], .16); }
    /* the neighbour's toadstool house: a round window, flickering */
    const hs = R.rainy.house(); if (hs) { const f2 = 1 + .08 * Math.sin(t / 130 + 1) + .05 * Math.sin(t / 57), wy = hs.y + 1; ellPx(g, hs.x, wy, 3.6, 3.6, '#7a4c28'); ellPx(g, hs.x, wy, 2.8, 2.8, f2 > 1.05 ? '#fff1b0' : '#ffd470'); rect(g, hs.x - 3, wy, 7, 1, '#7a4c28'); rect(g, hs.x, wy - 3, 1, 7, '#7a4c28');
      PXK.halo(g, hs.x, wy, 16, PAL.ember[4], .26 * f2); }
    /* smoke from the chimney, drifting off with the wind */
    if (now > F.nextSmoke) { F.smoke.push({ x: x0 + 73, y: y0 + 25, vx: 3 + rn() * 3, vy: -8 - rn() * 3, age: 0, big: pe > .2 }); F.nextSmoke = now + (pe > .2 ? 380 : 900); }
    F.smoke = F.smoke.filter(s => (s.age += dt) < 4.6); F.smoke.forEach(s => { s.x += (s.vx + s.age * 2) * dt; s.y += s.vy * dt * (1 - s.age / 6); const u = s.age / 4.6, r = 1.3 + u * (s.big ? 4.6 : 3.4), a = .3 * (1 - u); ellPx(g, s.x, s.y, r, r * .85, `rgba(150,176,206,${a})`); ellPx(g, s.x - r * .25, s.y - r * .3, r * .55, r * .45, `rgba(190,210,230,${a * .8})`); });
    /* wisps of light drifting through the rain; at the breath they swirl to the door */
    F.wisps.forEach(w => { w.a += dt * w.sp * (1 + pe * 2.4); const k2 = 1 - pe * .6, ox = Math.cos(w.a) * w.rx * k2, oy = Math.sin(w.a * 1.3 + w.ph) * w.ry * k2, wx = dx + ox, wy = gy + w.cy * (1 - pe * .5) + oy;
      const c1 = w.warm ? '255,212,112' : '168,242,224'; PXK.halo(g, wx, wy, 6, w.warm ? PAL.ember[5] : PAL.teal[5], .5);
      for (let i = 3; i >= 1; i--) { const ta = w.a - i * .12 * w.sp * 4; px(g, dx + Math.cos(ta) * w.rx * k2, gy + w.cy * (1 - pe * .5) + Math.sin(ta * 1.3 + w.ph) * w.ry * k2, `rgba(${c1},${.5 - i * .13})`); }
      rect(g, Math.round(wx), Math.round(wy), 2, 2, w.warm ? '#fff1b0' : '#f6f2ea'); });
    /* rain: drawn on a finer canvas (units f times smaller). Far drops are small and pale, near drops longer; they stop on the hill and the leaves and splash */
    const rg = st.rg, f = k.f, sh = shields(k).map(s => ({ cx: s.cx * f, cy: s.cy * f, rx: s.rx * f, ry: s.ry * f })), col = ['rgba(108,146,188,.45)', 'rgba(162,200,238,.8)'], pudR = pud.concat(PUDS).map(p => [p[0] * f, p[1] * f, p[2] * f, p[3] * f]);
    const act = st.pct >= 1 ? 0 : Math.round(F.drops.length * (1 - .7 * st.pct));
    F.drops.forEach((d, di) => {
      if (di >= act) return; d.y += d.v * dt; d.x += d.v * WIND * dt; let hit = false, hy = d.y;
      for (const s of sh) { const a = (d.x - s.cx) / s.rx, b = (d.y - s.cy) / s.ry; if (a * a + b * b < 1 && d.y < s.cy + (s.ry > 20 * f ? 0 : 3 * f)) { hit = true; break; } }
      if (!hit && d.y >= d.end) { hit = true; hy = d.end; for (const p of pudR) { const a = (d.x - p[0]) / p[2], b = (hy - p[1]) / p[3]; if (a * a + b * b < 1 && F.ripples.length < 26) F.ripples.push({ x: d.x / f, y: hy / f, age: 0, rx: p[2] / f }); } }
      if (hit) { if (F.splashes.length < 70 && !d.far) F.splashes.push({ x: d.x, y: d.y, age: 0 }); const nd = newDrop(k, false, d.far); d.x = nd.x; d.y = nd.y; d.v = nd.v; d.end = nd.end; return; }
      const len = d.far ? 2 : 4; rg.fillStyle = col[d.far ? 0 : 1]; for (let i = 0; i < len; i++) rg.fillRect(Math.round(d.x - i * WIND), Math.round(d.y - i), 1, 1);
      if (!d.far) { rg.fillStyle = 'rgba(223,240,255,.95)'; rg.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); }
    });
    F.splashes = F.splashes.filter(s => (s.age += dt) < .26); F.splashes.forEach(s => { const u = s.age / .26; rg.fillStyle = `rgba(200,225,250,${.85 * (1 - u)})`; rg.fillRect(Math.round(s.x - 1 - u * 3), Math.round(s.y - u * 3), 1, 1); rg.fillRect(Math.round(s.x + 1 + u * 3), Math.round(s.y - u * 3), 1, 1); rg.fillRect(Math.round(s.x), Math.round(s.y - 1 - u * 4), 1, 1); });
    F.ripples = F.ripples.filter(r => (r.age += dt) < .8); F.ripples.forEach(r => { const u = r.age / .8, rx = 1.5 + u * 5, ry = rx * .32; g.fillStyle = `rgba(190,220,250,${.6 * (1 - u)})`; for (let a2 = 0; a2 < 12; a2++) { const an = a2 / 12 * 6.283; g.fillRect(Math.round(r.x + Math.cos(an) * rx), Math.round(r.y + Math.sin(an) * ry), 1, 1); } });
    /* drops from the leaf tip and from the umbrellas */
    [[x0 + 66.5, y0 + 49, 0], [x0 + 10, gy - 9, 1.1], [x0 + 88, gy - 8, 2.2]].forEach(([lx, ly, ph]) => { const u = ((t / 700 + ph) % 1); if (u < .85) { g.fillStyle = 'rgba(190,225,255,.9)'; g.fillRect(Math.round(lx), Math.round(ly + u * u * 16), 1, 2); } });
    if (fa) { g.fillStyle = `rgba(190,210,255,${fa})`; g.fillRect(0, 0, k.W, k.H); }
  }
  R.rainy.fx = { init, draw }; R.rainy.tint = { amb: 'rgba(44,76,160,.2)', warm: 'rgba(255,176,84,.3)' };
})();
