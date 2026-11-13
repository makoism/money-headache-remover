/* ---------- the scenery: deep in an ancient, magical forest, behind the whole page ----------
   One small canvas (about 200 pixels tall, scaled up crisp) fixed behind everything. The still parts (layers of misty forest,
   shafts of light, giant mossy trunks with roots, the canopy with hanging moss, standing stones, the overgrown cottage, the
   waterfall cliff, the fairy ring) are painted once into a second canvas whenever the window size or the time of day changes;
   only the living parts (fairies, runes, the waterfall, mist, the stag and the deer, smoke, motes, dew, stars) are drawn on top,
   six times a second, and nothing runs while the tab is hidden. Reduced motion gets one still frame.
   Four moods by the local clock: morning (5 to 10), day (10 to 16), sunset (16 to 19), night.
   The middle column, where the page sits, gets a soft veil of the page colour so words stay easy to read; the sides stay vivid.
   Test hook: ?tod=morning|day|sunset|night fixes the mood. */
const SCENE = (() => {
  const TOD = {
    morning: { sky: ['#8fbfb2', '#c6e0cc', '#efdcae'], fog: '#d8ecdc', far: ['#7da595', '#5d8a79', '#3f6a5a'], trunk: '#4d3d2f', trunkD: '#352a20', trunkL: '#6e5a44', moss: '#6fae5a', mossL: '#9bd27c', mossD: '#3f7a3f', leaf: '#2f6a43', leafD: '#1e4a31', ground: '#3f7a45', groundD: '#2c5a34', groundL: '#62a058', stone: '#8d978f', stoneD: '#5f6a63', stoneL: '#b0bab1', rune: '#a8f4ff', water: '#c8f2f2', water2: '#86d4dc', foam: '#ffffff', shaft: '#fff4c8', shaftA: .16, win: '#ffe1a0', lit: .6, smoke: '#eef2ee', fairy: ['#ffd6f0', '#c8f7ff', '#fff1a8', '#e2ccff'], motes: 36, mist: .26, stars: false, dew: true, glowA: .45 },
    day: { sky: ['#76b9c4', '#acd9cc', '#d9eecb'], fog: '#cbe8d8', far: ['#6f9e88', '#52836c', '#376650'], trunk: '#524130', trunkD: '#3a2d21', trunkL: '#735e46', moss: '#6db85c', mossL: '#9cd97e', mossD: '#3e8040', leaf: '#2e7647', leafD: '#1d5232', ground: '#46864a', groundD: '#30663a', groundL: '#68a85c', stone: '#929c95', stoneD: '#636e67', stoneL: '#b6c0b8', rune: '#9ff0ff', water: '#bdf0f4', water2: '#78cfe0', foam: '#ffffff', shaft: '#fffbe0', shaftA: .14, win: '#e8f4f0', lit: .15, smoke: '#f4f6f4', fairy: ['#ffe0f4', '#d2fbff', '#fff6b8', '#e8d6ff'], motes: 26, mist: .16, stars: false, dew: false, glowA: .3 },
    sunset: { sky: ['#4b3f7c', '#b4648c', '#f4a86a'], fog: '#e8b8c6', far: ['#87648a', '#654a70', '#46344f'], trunk: '#3f2d29', trunkD: '#2b1f1c', trunkL: '#5c4339', moss: '#6f8f55', mossL: '#94b06c', mossD: '#45603c', leaf: '#33443d', leafD: '#222f2b', ground: '#3f5039', groundD: '#2c3a29', groundL: '#5a6d4c', stone: '#8a7f8a', stoneD: '#5d5262', stoneL: '#ac9fab', rune: '#ffc8f0', water: '#f6c0a0', water2: '#c98aa6', foam: '#ffece0', shaft: '#ffd6a0', shaftA: .18, win: '#ffc86a', lit: 1, smoke: '#dcbcc6', fairy: ['#ffc0e0', '#ffd890', '#ffb0b0', '#e0b8ff'], motes: 40, mist: .24, stars: false, dew: false, glowA: .6 },
    night: { sky: ['#060b1f', '#0f1b3b', '#1b2b54'], fog: '#2c4370', far: ['#1b2a48', '#142138', '#0e192b'], trunk: '#22191b', trunkD: '#160f12', trunkL: '#31272a', moss: '#1f4a3c', mossL: '#2f6a55', mossD: '#163a2f', leaf: '#0f2a24', leafD: '#09201b', ground: '#13291f', groundD: '#0c1d16', groundL: '#1e3d2e', stone: '#3a4556', stoneD: '#262f3d', stoneL: '#4e5b70', rune: '#6affd8', water: '#4a7cbc', water2: '#2f528c', foam: '#c8e0ff', shaft: '#b8d0ff', shaftA: .1, win: '#ffd27a', lit: 1, smoke: '#4a5a7a', fairy: ['#7affd8', '#c8ff9a', '#9ad8ff', '#f0b8ff'], motes: 56, mist: .3, stars: true, dew: false, glowA: 1 },
  };
  const DEER = [
    ['..........a..a', '...........aa.', '..........bbb.', '.........bbkbw', '.........bbbb.', '.........bb...', '.wbbbbbbbbb...', '.bbbbbbbbbb...', '.bwwwwwbbbb...', '.b.b....b.b...', '.d.d....d.d...'],
    ['..............', '..............', '..............', '..............', '..............', '..............', '.wbbbbbbbbb...', '.bbbbbbbbbbb..', '.bwwwwwbbbbbba', '.b.b....b.bbaa', '.d.d....d.dbk.'],
  ];
  /* the spirit stag: tall antlers, pale, looking out over the clearing */
  const STAG = ['.......a.a.a..', '........aaa...', '.....a..a.....', '......aaaa.a..', '.........aaa..', '.........bbbb.', '........bbbkbw', '........bbbb..', '........bbb...', '.wbbbbbbbbb...', '.bbbbbbbbbb...', '.bbbbbbbbbb...', '..b.b...b.b...', '..b.b...b.b...', '..d.d...d.d...'];
  let cv = null, cx = null, st = null, sx = null, vl = null, vx = null, W = 0, H = 0, PX = 3, T = null, mood = '', timer = 0, frame = 0, L = null, still = false;
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const pickMood = () => {
    const q = (location.search.match(/[?&]tod=(morning|day|sunset|night)\b/) || [])[1]; if (q) return q;
    const h = new Date().getHours(); return h >= 5 && h < 10 ? 'morning' : h >= 10 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'sunset' : 'night';
  };
  const on = () => !(S && S.ui && S.ui.scene === false);
  const grid = (c, x, y, rows, pal, flip) => { for (let j = 0; j < rows.length; j++) { const row = rows[j]; for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || !pal[ch]) continue; c.fillStyle = pal[ch]; c.fillRect(Math.round(x + (flip ? row.length - 1 - i : i)), Math.round(y + j), 1, 1); } } };
  const disk = (c, x0, y0, rad, col) => { c.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  const glow = (c, x, y, r, col, a) => { for (let k = r; k >= 1; k--) { c.globalAlpha = a * (1 - k / (r + 1)) * .5; disk(c, x, y, k, col); } c.globalAlpha = 1; };

  /* ---------- the layout ---------- */
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    PX = Math.max(2, Math.round(vh / 200)); W = Math.ceil(vw / PX); H = Math.ceil(vh / PX);
    const col = Math.min(W, Math.ceil(800 / PX)), side = Math.max(0, (W - col) / 2), wide = side >= 46;
    const R = rnd(7), hz = Math.round(H * .62);
    L = { col, side, wide, hz, cx0: side, cx1: W - side, floor: Math.round(H * .8) };
    L.hut = { x: wide ? Math.max(18, Math.round(side * .3)) : 4, y: Math.round(H * .8) };
    L.fall = { x: wide ? Math.round(W - side * .5) : W - 10, top: Math.round(hz - (wide ? 52 : 34)), bot: Math.round(H * .79), w: wide ? 8 : 5 };
    L.pool = { x: L.fall.x + Math.round(L.fall.w / 2), y: L.fall.bot + 3, rx: wide ? 22 : 11, ry: 4 };
    L.stones = wide ? [{ x: Math.round(W - side * .86), y: Math.round(H * .83), h: 16 }, { x: Math.round(W - side * .74), y: Math.round(H * .845), h: 11 }, { x: Math.round(side * .82), y: Math.round(H * .82), h: 13 }] : [{ x: W - 22, y: Math.round(H * .85), h: 10 }];
    L.ring = { x: wide ? Math.round(side * .62) : 18, y: Math.round(H * .9) };
    L.stag = wide ? { x: Math.round(W - side * .98) + 2, y: Math.round(H * .8) - 15 } : null;
    L.deer = wide ? [{ x: Math.round(side * .72) + 4, y: Math.round(H * .8) - 11, flip: false, ph: 0 }] : [];
    L.stars = []; for (let i = 0; i < Math.round(W * H / 300); i++) L.stars.push([Math.floor(R() * W), Math.floor(R() * hz * .6), R()]);
    L.shafts = []; for (let i = 0; i < (wide ? 5 : 3); i++) { const left = i % 2 === 0; L.shafts.push({ x: wide ? (left ? R() * side * .9 : W - side * .9 + R() * side * .8) : R() * W, w: 6 + R() * 10, sk: .35 + R() * .2 }); }
    L.fairies = []; const nf = wide ? 9 : 4;
    for (let i = 0; i < nf; i++) { const left = i % 2 === 0; L.fairies.push({ cx: wide ? (left ? side * (.2 + R() * .7) : W - side * (.2 + R() * .7)) : R() * W, cy: H * (.45 + R() * .4), rx: 6 + R() * 14, ry: 3 + R() * 8, sp: .03 + R() * .04, ph: R() * 6.28, c: i % 4, trail: [] }); }
    L.motes = []; L.dew = []; L.mist = [];
    for (let i = 0; i < 70; i++) L.dew.push([Math.floor(R() * W), Math.round(L.floor - 2 + R() * (H - L.floor)), Math.floor(R() * 40)]);
    for (let i = 0; i < 5; i++) L.mist.push({ x: R() * W, y: L.floor - 8 + R() * 16, w: 30 + R() * 50, v: .05 + R() * .08 });
  }

  /* ---------- the still layer ---------- */
  function paint() {
    const c = sx, t = T, R = rnd(11), hz = L.hz;
    c.clearRect(0, 0, W, H);
    /* sky, seen through the canopy */
    for (let y = 0; y < H; y++) { const f = Math.min(1, y / hz), seg = f < .55 ? 0 : 1, lf = seg ? (f - .55) / .45 : f / .55; c.fillStyle = mix(t.sky[seg], t.sky[seg + 1], Math.round(lf * 8) / 8); c.fillRect(0, y, W, 1); }
    if (t.stars) for (const s of L.stars) { c.fillStyle = s[2] > .85 ? '#ffffff' : '#9fb0d8'; c.fillRect(s[0], s[1], 1, 1); }
    if (mood === 'night') { const mx = L.wide ? Math.round(L.side * .35) : 12; glow(c, mx, 22, 16, '#c8d6ff', .7); disk(c, mx, 22, 7, '#f2f0d8'); disk(c, mx + 3, 20, 6, t.sky[1]); }
    /* layers of forest fading into the mist: the deeper, the paler. Every tree is its own: crooked, leaning, forked, twisted,
       with branches, hanging vines, knots and moss, and vines drape from one tree to the next. The middle layer is softened with a haze. */
    for (let k = 0; k < 3; k++) {
      const base = hz + 4 + k * 10, hz2 = [.1, .3, .04][k], col = mixh(t.far[k], t.fog, hz2), R2 = rnd(31 + k), trees = [];
      for (let x = -4; x < W + 6; x += 12 + k * 4 + Math.floor(R2() * 13)) trees.push(farTree(c, x, base, k, col, t, R2));
      for (let i = 1; i < trees.length; i++) if (R2() < .55 && trees[i].x - trees[i - 1].x < 46) drapeVine(c, trees[i - 1], trees[i], col, t, R2);
      for (let x = -4; x < W + 6; x += 4 + Math.floor(R2() * 5)) disk(c, x, base - 2, 3 + k + Math.floor(R2() * 3), col);
      c.globalAlpha = t.mist; c.fillStyle = t.fog; c.fillRect(0, base - 6, W, 10); c.globalAlpha = 1;
    }
    /* the forest floor: moss, ferns */
    c.fillStyle = t.ground; c.fillRect(0, L.floor, W, H - L.floor);
    c.fillStyle = t.groundD; c.fillRect(0, L.floor, W, 1);
    for (let y = L.floor + 1; y < H; y++) for (let x = (y * 7) % 4; x < W; x += 4) { const v = R(); if (v < .35) { c.fillStyle = v < .17 ? t.groundD : t.groundL; c.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < Math.round(W / 6); i++) fern(c, Math.floor(R() * W), L.floor + 2 + Math.floor(R() * (H - L.floor - 4)), t, R);
    /* shafts of light through the canopy */
    for (const s of L.shafts) { c.globalAlpha = t.shaftA; c.fillStyle = t.shaft; for (let y = 0; y < L.floor + 6; y++) c.fillRect(Math.round(s.x + y * s.sk), y, Math.round(s.w), 1); c.globalAlpha = 1; }
    /* the carved cliff and the glowing pool */
    const F = L.fall, cl = F.x - 14, cr = F.x + F.w + 16, prof = [];
    for (let x = cl; x < cr; x++) { const e = Math.min(x - cl, cr - 1 - x); prof.push(F.top - 2 + Math.max(0, 9 - e * 2) + Math.round(Math.sin(x * 1.7) * 1.5)); }
    for (let x = cl; x < cr; x++) { const top = prof[x - cl]; c.fillStyle = t.stoneD; c.fillRect(x, top, 1, F.bot - top + 3); }
    const nS = Math.round((cr - cl) * (F.bot - F.top) / 16);
    for (let i = 0; i < nS; i++) { const x = cl + 1 + Math.floor(R() * (cr - cl - 2)), y = F.top + Math.floor(R() * (F.bot - F.top)); if (y < prof[x - cl] + 2) continue; const w = 2 + Math.floor(R() * 4), h = 1 + Math.floor(R() * 3); c.fillStyle = t.stone; c.fillRect(x, y, w, h); c.fillStyle = t.stoneL; c.fillRect(x, y, w - 1, 1); }
    for (let x = cl; x < cr; x++) { const top = prof[x - cl]; c.fillStyle = t.moss; c.fillRect(x, top - 1, 1, 3); if (R() < .45) { c.fillStyle = R() < .5 ? t.mossD : t.moss; c.fillRect(x, top + 2, 1, 3 + Math.floor(R() * 12)); } }
    for (let i = 0; i < 4; i++) rune(c, cl + 3 + Math.floor(R() * (cr - cl - 8)), F.top + 10 + Math.floor(R() * (F.bot - F.top - 20)), t, .55);
    const P = L.pool; glow(c, P.x, P.y, P.rx, t.water2, t.glowA * .6);
    c.fillStyle = t.water2; for (let y = -P.ry; y <= P.ry; y++) { const w = Math.round(P.rx * Math.sqrt(1 - (y * y) / (P.ry * P.ry))); c.fillRect(P.x - w, P.y + y, w * 2, 1); }
    c.fillStyle = t.water; for (let y = -P.ry + 1; y < P.ry; y++) { const w = Math.round((P.rx - 3) * Math.sqrt(1 - (y * y) / (P.ry * P.ry))); c.fillRect(P.x - w, P.y + y, w * 2, 1); }
    /* standing stones, mossy, carved with runes */
    for (const s of L.stones) standing(c, s.x, s.y, s.h, t, R);
    /* the overgrown cottage */
    hut(c, L.hut.x, L.hut.y, t, R);
    /* giant ancient trunks framing both sides, roots over the floor */
    const tw = L.wide ? Math.max(18, Math.round(L.side * .28)) : 7;
    trunk(c, -Math.round(tw * .35), tw, t, R); trunk(c, W - Math.round(tw * .65), tw, t, R);
    if (L.wide) { trunk(c, Math.round(L.side * .96) - 6, Math.round(tw * .45), t, R, true); trunk(c, Math.round(W - L.side) - 2, Math.round(tw * .5), t, R, true); }
    /* the fairy ring */
    ring(c, L.ring.x, L.ring.y, t);
    /* a canopy across the top, with hanging moss and vines */
    for (let x = 0; x < W; x++) { const d = 9 + Math.round(4 * Math.sin(x / 11) + 3 * Math.sin(x / 4.1)); c.fillStyle = t.leafD; c.fillRect(x, 0, 1, d + 3); c.fillStyle = t.leaf; c.fillRect(x, 0, 1, d); }
    for (let x = 0; x < W; x += 3) { if (R() < .7) disk(c, x, 4 + Math.floor(R() * 9), 2 + Math.floor(R() * 3), R() < .4 ? t.leafD : R() < .6 ? t.leaf : t.moss); }
    const strands = L.wide ? Math.round(L.side / 4) : 8;
    for (let i = 0; i < strands; i++) { const left = i % 2 === 0, x = L.wide ? (left ? Math.round(R() * L.side) : Math.round(W - R() * L.side)) : Math.round(R() * W); hang(c, x, 4, Math.round(H * (.12 + R() * (L.wide ? .55 : .15))), t, R); }
    if (L.wide) foreground(c, t, R);
  }
  /* ONE FAR TREE. Five kinds (plain, crooked, leaning, forked, twisted), each with its own width, bends, flared roots, knots,
     moss, side branches ending in leaf clumps, and vines hanging from the branches. Returns where vines can be tied. */
  function farTree(c, x, base, k, col, t, R) {
    const dk = mixh(col, '#000000', k === 1 ? .08 : .2), r = R(), type = r < .22 ? 'plain' : r < .42 ? 'crook' : r < .6 ? 'lean' : r < .8 ? 'fork' : 'twist';
    let w = 2 + k * 2 + Math.floor(R() * 3); if (R() < .12) w += 3;
    const lean = (type === 'lean' ? (R() < .5 ? -1 : 1) * (.18 + R() * .22) : (R() - .5) * .1), amp = type === 'crook' ? 5 + R() * 8 : type === 'twist' ? 2 + R() * 2 : 1 + R() * 2, per = 16 + R() * 22, ph = R() * 6.28;
    const off = dy => lean * dy + amp * Math.sin(dy / per + ph) - amp * Math.sin(ph), moss = mixh(t.far[k], t.mossD, .35), hz = mixh(col, t.fog, .5), A = [];
    const bot = base + 40, soft = k === 1;
    const bar = (X, Y, ww, cc) => { c.fillStyle = cc; c.fillRect(X, Y, ww, 1); };
    for (let y = 0; y < bot; y++) {
      const dy = base - y, o = off(dy), fl = y > base - 7 ? Math.floor((y - (base - 7)) / 2.5) : 0, ww = w + fl;
      let X = Math.round(x + o - ww / 2);
      if (type === 'twist') { const sw = Math.round(Math.sin(dy / 5 + ph) * (w * .8)); bar(X + sw, y, Math.max(1, ww - 1), col); bar(X - sw, y, Math.max(1, ww - 1), col); }
      else bar(X, y, ww, col);
      if (soft) { c.globalAlpha = .3; bar(X - 1, y, 1, hz); bar(X + ww, y, 1, hz); c.globalAlpha = .15; bar(X - 2, y, 1, hz); bar(X + ww + 1, y, 1, hz); c.globalAlpha = 1; }
      if (R() < .035 && y < base - 4) { c.fillStyle = moss; c.fillRect(X, y, 1, 2 + Math.floor(R() * 4)); }
    }
    /* a knot or two, and a hollow */
    for (let i = 0, n = 1 + Math.floor(R() * 2); i < n; i++) { const y = Math.round(base * (.25 + R() * .6)), o = off(base - y); c.fillStyle = mixh(col, '#000000', .35); c.fillRect(Math.round(x + o - 1), y, 2, 3); }
    /* branches: out and up from the trunk, bending, with twigs and a leaf clump on the end */
    const nb = 2 + Math.floor(R() * (3 + k));
    for (let i = 0; i < nb; i++) {
      const dy0 = base * (.12 + R() * .8), y0 = Math.round(base - dy0), side = R() < .5 ? -1 : 1, len = 7 + Math.floor(R() * (10 + k * 6)), rise = .25 + R() * .9, th = k > 0 && R() < .5 ? 2 : 1;
      let bx = x + off(dy0) + side * w * .4, by = y0, wob = R() * 6.28; if (type === 'crook' && R() < .5) wob += 2;
      for (let j = 0; j < len; j++) {
        bx += side * (.85 + Math.sin(j / 3 + wob) * .35); by -= rise * (.4 + j / len) + Math.sin(j / 4 + wob) * .2;
        bar(Math.round(bx), Math.round(by), 1, dk); if (th > 1 && j < len * .6) bar(Math.round(bx), Math.round(by) + 1, 1, dk);
        if (j > 3 && j % 5 === 0 && R() < .7) { const sd = R() < .5 ? 1 : -1; for (let q = 1; q <= 2 + Math.floor(R() * 3); q++) bar(Math.round(bx + side * q * .7), Math.round(by - sd * q * .7), 1, dk); }
      }
      const ex = Math.round(bx), ey = Math.round(by);
      for (let q = 0, m = 2 + Math.floor(R() * 3); q < m; q++) disk(c, ex + Math.round((R() - .5) * 6), ey + Math.round((R() - .6) * 4), 1 + Math.floor(R() * 2) + (k > 0 ? 1 : 0), R() < .5 ? dk : mixh(col, t.leafD, .4));
      A.push({ x: ex, y: ey });
      if (R() < .6) hangVine(c, ex, ey, 8 + Math.floor(R() * 24), dk, t, R);
    }
    /* the fork: a second trunk leaves the first and climbs away from it */
    if (type === 'fork') {
      const dy0 = base * (.35 + R() * .3), side = R() < .5 ? -1 : 1; let fx = x + off(dy0), fy = base - dy0; const wf = Math.max(1, w - 1);
      for (let j = 0; fy > -2; j++) { fx += side * Math.max(.1, .75 - j * .02); fy -= 1; bar(Math.round(fx - wf / 2), Math.round(fy), wf, col); }
    }
    for (let i = 0, n = 1 + Math.floor(R() * 2); i < n; i++) hangVine(c, Math.round(x + off(base * (.2 + R() * .5)) + (R() - .5) * w), Math.round(base * (.1 + R() * .3)), 10 + Math.floor(R() * 26), col, t, R);
    A.push({ x: Math.round(x + off(base * .55)), y: Math.round(base * .45) });
    return { x, A };
  }
  function hangVine(c, x, y, len, col, t, R) {
    const sw = (R() - .5) * 2, ph = R() * 6.28, lc = mixh(col, t.leafD, .4);
    for (let i = 0; i < len; i++) { const X = Math.round(x + Math.sin(i / 6 + ph) * sw * 1.5), Y = y + i; c.fillStyle = col; c.fillRect(X, Y, 1, 1); if (i > 3 && i % 4 === 0 && R() < .7) { c.fillStyle = lc; c.fillRect(X + (i % 8 === 0 ? 1 : -1), Y, 1, 1); } }
  }
  /* a vine slung between two trees: a sagging curve with a few leaves */
  function drapeVine(c, a, b, col, t, R) {
    const p = a.A[Math.floor(R() * a.A.length)], q = b.A[Math.floor(R() * b.A.length)], n = Math.max(6, Math.abs(q.x - p.x)), sag = 4 + R() * 9, lc = mixh(col, t.leafD, .4);
    for (let i = 0; i <= n; i++) { const u = i / n, X = Math.round(p.x + (q.x - p.x) * u), Y = Math.round(p.y + (q.y - p.y) * u + sag * 4 * u * (1 - u)); c.fillStyle = col; c.fillRect(X, Y, 1, 1); if (i % 6 === 3 && R() < .7) { c.fillStyle = lc; c.fillRect(X, Y + 1, 1, 2); } }
  }
  /* THE NEAR LAYER of the forest, painted last: dark ferns arching up from the bottom corners, big leaves hanging into the top
     corners, all darker than anything behind them and rim-lit, so the scene has a front, a middle and a far. */
  function frond(c, x, y, len, dir, col, hi) {
    let px = x, py = y;
    for (let i = 0; i < len; i++) {
      const a = i / len; px += dir * (.9 - a * .3); py -= 1.25 * (1 - a * 1.15);
      const X = Math.round(px), Y = Math.round(py); put(c, X, Y, col); put(c, X, Y + 1, col);
      if (i > 3 && i % 2 === 0) { const n = Math.round(7 * Math.sin(a * 3.1) + 2); for (let k = 1; k <= n; k++) { put(c, X + dir * Math.round(k * .5), Y - Math.round(k * .85), k === n ? hi : col); put(c, X + dir * Math.round(k * .85), Y + Math.round(k * .6), col); } }
    }
  }
  function hangLeaf(c, x, len, dir, col, hi) {
    for (let i = 0; i < len; i++) { const w = Math.round(3.2 * Math.sin(Math.PI * (i + 2) / (len + 4)) + 1), o = Math.round(Math.sin(i / 9) * 2 * dir); for (let k = 0; k < w; k++) put(c, x + o + k - (w >> 1), i, k === 0 ? hi : col); put(c, x + o, i, mixh(col, '#000000', .25)); }
  }
  function foreground(c, t, R) {
    const dark = mixh(t.leafD, '#000000', .5), hi = mixh(t.mossL, '#000000', .3);
    for (const [x, dir] of [[1, 1], [Math.round(L.side * .2), 1], [W - 2, -1], [W - Math.round(L.side * .2), -1]]) for (let k = 0; k < 3; k++) frond(c, x + k * dir * 2, H - 1, 22 + Math.floor(R() * 18), dir * (k === 1 ? -1 : 1), dark, hi);
    for (const [x0, dir] of [[2, 1], [W - 3, -1]]) for (let k = 0; k < 5; k++) hangLeaf(c, x0 + dir * k * 5 + Math.floor(R() * 3), 14 + Math.floor(R() * 20), dir, dark, hi);
    L.bokeh = []; for (let i = 0; i < 8; i++) { const left = i % 2 === 0; L.bokeh.push({ x: left ? R() * L.side : W - R() * L.side, y: H * (.2 + R() * .65), r: 3 + Math.floor(R() * 3), sp: .01 + R() * .015, ph: R() * 6.28, c: t.fairy[i % 4] }); }
  }
  function fern(c, x, y, t, R) { c.fillStyle = R() < .5 ? t.moss : t.mossD; c.fillRect(x, y - 3, 1, 3); c.fillRect(x - 1, y - 2, 1, 1); c.fillRect(x + 1, y - 2, 1, 1); c.fillRect(x - 2, y - 1, 1, 1); c.fillRect(x + 2, y - 1, 1, 1); }
  function rune(c, x, y, t, a) { c.globalAlpha = a; c.fillStyle = t.rune; c.fillRect(x, y, 1, 3); c.fillRect(x + 1, y + 1, 1, 1); c.fillRect(x + 2, y, 1, 1); c.fillRect(x + 2, y + 2, 1, 1); c.globalAlpha = 1; }
  function standing(c, x, y, h, t, R) {
    const w = Math.max(5, Math.round(h * .45));
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 1, y, w + 3, 2);
    for (let j = 0; j < h; j++) { const ww = w - (j < 2 ? 2 - j : 0); c.fillStyle = j < 3 ? t.stoneL : t.stone; c.fillRect(x + (w - ww) / 2, y - h + j, ww, 1); }
    c.fillStyle = t.stoneD; c.fillRect(x + w - 1, y - h + 2, 1, h - 2);
    c.fillStyle = t.moss; c.fillRect(x, y - h, w, 1); for (let i = 0; i < w; i++) if (R() < .6) c.fillRect(x + i, y - h + 1, 1, 1 + Math.floor(R() * Math.min(5, h / 3)));
    c.fillStyle = t.mossD; c.fillRect(x - 1, y - 2, w + 2, 2);
    rune(c, x + Math.floor(w / 2) - 1, y - Math.round(h * .55), t, .7);
  }
  function trunk(c, x, w, t, R, back) {
    const base = Math.round(L.floor + (back ? 2 : 8));
    for (let xx = 0; xx < w; xx++) { const edge = Math.min(xx, w - 1 - xx); c.fillStyle = edge < 1 ? t.trunkD : (xx % 5 === 2 ? t.trunkL : t.trunk); c.fillRect(x + xx, 0, 1, base); }
    for (let i = 0; i < w * 4; i++) { c.fillStyle = t.trunkD; c.fillRect(x + 1 + Math.floor(R() * (w - 2)), Math.floor(R() * base), 1, 3 + Math.floor(R() * 6)); }
    for (let i = 0; i < w * 5; i++) { const xx = x + Math.floor(R() * w), yy = Math.floor(base - Math.pow(R(), 1.6) * base); c.fillStyle = R() < .5 ? t.moss : t.mossL; c.fillRect(xx, yy, 1 + Math.floor(R() * 2), 1 + Math.floor(R() * 3)); }
    for (let k = 0; k < 4; k++) { let rx = x + Math.round(w * (k < 2 ? .1 : .9)), ry = base - 4; const dir = k < 2 ? -1 : 1, len = Math.round(w * (.5 + R() * .6)); for (let s = 0; s < len; s++) { rx += dir; if (s % 3 === 0) ry += 1; c.fillStyle = t.trunk; c.fillRect(rx, ry, 1, Math.max(1, 3 - Math.floor(s / (len / 3)))); if (R() < .3) { c.fillStyle = t.moss; c.fillRect(rx, ry - 1, 1, 1); } } }
    if (w > 12) { const hx = x + Math.round(w * .45), hy = Math.round(base * .45); c.fillStyle = t.trunkD; c.fillRect(hx - 2, hy - 3, 5, 6); c.globalAlpha = .5 * t.glowA + .2; c.fillStyle = t.rune; c.fillRect(hx - 1, hy - 1, 3, 3); c.globalAlpha = 1; }
  }
  function hang(c, x, y0, len, t, R) {
    let vx = x; const ph = R() * 6, moss = R() < .5;
    for (let y = y0; y < len; y++) {
      vx = x + Math.round(Math.sin(y / 10 + ph) * 1.5);
      if (moss) { c.fillStyle = (y % 3) ? t.mossD : t.moss; c.fillRect(vx, y, 1, 1); if (y % 2 === 0 && R() < .5) c.fillRect(vx + (R() < .5 ? -1 : 1), y, 1, 1); }
      else { c.fillStyle = t.leafD; c.fillRect(vx, y, 1, 1); if (y % 4 === 0) { c.fillStyle = (y % 8) ? t.moss : t.leaf; c.fillRect(vx + ((y / 4) % 2 ? 1 : -2), y, 2, 2); } }
      if (y % 19 === 11 && R() < .6) { c.fillStyle = ['#f6b8d8', '#fff2c0', '#c8b8ff'][Math.floor(R() * 3)]; c.fillRect(vx - 1, y, 1, 1); c.fillRect(vx + 1, y, 1, 1); c.fillRect(vx, y - 1, 1, 1); c.fillRect(vx, y + 1, 1, 1); c.fillStyle = '#fff6c0'; c.fillRect(vx, y, 1, 1); }
    }
  }
  function ring(c, x, y, t) {
    const n = 9; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, mx = Math.round(x + Math.cos(a) * 11), my = Math.round(y + Math.sin(a) * 3);
      glow(c, mx, my - 2, 3, t.rune, t.glowA * .5);
      c.fillStyle = '#efe6d6'; c.fillRect(mx, my - 2, 1, 2); c.fillStyle = mood === 'night' ? '#7affd8' : i % 2 ? '#e6736a' : '#c48ad8'; c.fillRect(mx - 1, my - 3, 3, 1); c.fillRect(mx, my - 4, 1, 1); }
  }
  function hut(c, x, base, t, R) {
    const w = 28, hW = 15;
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x - 3, base, w + 8, 2);
    for (let j = 0; j < hW; j++) { c.fillStyle = j % 3 === 2 ? t.trunkD : mix(t.stone, t.trunk, .35); c.fillRect(x, base - hW + j, w, 1); }
    for (let i = 0; i < 18; i++) { c.fillStyle = t.stoneL; c.fillRect(x + 1 + Math.floor(R() * (w - 3)), base - hW + 1 + Math.floor(R() * (hW - 2)), 2, 1); }
    for (let j = 0; j < 12; j++) { const ww = w + 8 - Math.round(j * 1.6); c.fillStyle = j % 3 === 0 ? t.mossD : t.moss; c.fillRect(x - 4 + Math.round(j * .8), base - hW - 1 - j, ww, 1); }
    for (let i = 0; i < w + 8; i += 2) if (R() < .7) { c.fillStyle = R() < .5 ? t.mossD : t.moss; c.fillRect(x - 4 + i, base - hW, 1, 1 + Math.floor(R() * 4)); }
    c.fillStyle = '#efe6d6'; c.fillRect(x + 4, base - hW - 8, 1, 2); c.fillStyle = '#e6736a'; c.fillRect(x + 3, base - hW - 9, 3, 1);
    c.fillStyle = '#efe6d6'; c.fillRect(x + 19, base - hW - 5, 1, 2); c.fillStyle = '#c48ad8'; c.fillRect(x + 18, base - hW - 6, 3, 1);
    c.fillStyle = t.trunkD; c.fillRect(x + 21, base - hW - 15, 3, 7);
    disk(c, x + 7, base - 6, 4, t.trunkD); c.fillStyle = t.trunkD; c.fillRect(x + 3, base - 6, 9, 6); c.fillStyle = '#f6d860'; c.fillRect(x + 9, base - 4, 1, 1);
    const lit = t.lit > .3; if (lit) glow(c, x + 20, base - 9, 7, t.win, .5 * t.lit);
    disk(c, x + 20, base - 9, 3, lit ? t.win : mix(t.win, t.trunk, .4)); c.fillStyle = t.trunkD; c.fillRect(x + 20, base - 12, 1, 7); c.fillRect(x + 17, base - 9, 7, 1);
    for (let k = 0; k < 4; k++) { const vx = x + 2 + k * 7; for (let y = base - hW; y < base - 2 - (k % 2) * 4; y++) { const o = Math.round(Math.sin(y / 3 + k)); c.fillStyle = t.mossD; c.fillRect(vx + o, y, 1, 1); if (y % 3 === 0) { c.fillStyle = t.mossL; c.fillRect(vx + o + 1, y, 1, 1); } } }
    c.fillStyle = t.trunkD; c.fillRect(x + w + 3, base - 9, 1, 9); if (t.lit > 0) glow(c, x + w + 3, base - 10, 4, '#ffd27a', .6 * t.lit); c.fillStyle = t.lit > 0 ? '#ffd27a' : '#c9a35a'; c.fillRect(x + w + 2, base - 11, 3, 3);
    c.fillStyle = t.stone; for (let i = 0; i < 5; i++) c.fillRect(x + 6 + i * 4, base + 2 + (i % 2), 3, 1);
  }

  /* ---------- the living layer ---------- */
  function draw() {
    if (!cx || !st) return;
    const c = cx, t = T, f = frame++;
    c.drawImage(st, 0, 0);
    if (t.stars) for (let i = 0; i < L.stars.length; i += 6) { const s = L.stars[i]; if ((f + i) % 23 < 3) { c.fillStyle = '#ffffff'; c.fillRect(s[0] - 1, s[1], 3, 1); c.fillRect(s[0], s[1] - 1, 1, 3); } }
    const F = L.fall;
    c.fillStyle = t.water2; c.fillRect(F.x, F.top, F.w, F.bot - F.top);
    for (let x = 0; x < F.w; x++) { const o = ((f * 2 - x * 5) % 7 + 7) % 7; for (let y = F.top - 7 + o; y < F.bot; y += 7) { const y0 = Math.max(F.top, y), y1 = Math.min(F.bot, y + 4); if (y1 <= y0) continue; c.fillStyle = t.foam; c.fillRect(F.x + x, y0, 1, Math.min(2, y1 - y0)); if (y1 - y0 > 2) { c.fillStyle = t.water; c.fillRect(F.x + x, y0 + 2, 1, y1 - y0 - 2); } } }
    for (let i = 0; i < 7; i++) { const ox = Math.round(Math.sin(f / 3 + i) * (F.w / 2 + 3)), oy = (f + i * 3) % 5; c.fillStyle = t.foam; c.fillRect(F.x + F.w / 2 + ox, F.bot - oy, 2, 1); }
    const P = L.pool; for (let i = 0; i < 5; i++) { const x = P.x - P.rx + 4 + ((f * 2 + i * 13) % (P.rx * 2 - 8)); if ((f + i) % 5 < 3) { c.fillStyle = t.foam; c.fillRect(x, P.y - 1 + (i % 3), 3, 1); } }
    /* runes on the stones breathe in and out */
    const br = .45 + .45 * Math.sin(f / 9);
    for (const s of L.stones) { const w = Math.max(5, Math.round(s.h * .45)); c.globalAlpha = br * t.glowA * .6; c.fillStyle = t.rune; c.fillRect(s.x + Math.floor(w / 2) - 2, s.y - Math.round(s.h * .55) - 1, 5, 5); c.globalAlpha = 1; }
    const hx = L.hut.x + 22, hy = L.hut.y - 30; c.fillStyle = t.smoke;
    for (let i = 0; i < 5; i++) { const age = (f + i * 9) % 45, yy = hy - age * .6, xx = hx + Math.sin((age + i) / 6) * 2 + age * .12; c.globalAlpha = Math.max(0, .5 - age / 70); const s = 2 + Math.floor(age / 15); c.fillRect(Math.round(xx), Math.round(yy), s, s); }
    c.globalAlpha = 1;
    const pal = { b: mood === 'night' ? '#5a4a46' : '#a8714a', d: mood === 'night' ? '#3e3230' : '#7a4f32', w: '#f1e6d6', k: '#1e1a18', a: '#d9c3a0' };
    for (const d of L.deer) { const up = (f + d.ph) % 64 > 46; grid(c, d.x, d.y, DEER[up ? 0 : 1], pal, d.flip); }
    if (L.stag) { const g = .3 + .2 * Math.sin(f / 11); glow(c, L.stag.x + 7, L.stag.y + 7, 10, '#d8f4ff', g * (mood === 'day' ? .6 : 1.2)); grid(c, L.stag.x, L.stag.y, STAG, { b: '#eef4f6', d: '#c8d6dc', w: '#ffffff', k: '#2a3a48', a: '#bff4ff' }, true); }
    for (const m of L.mist) { m.x += m.v; if (m.x > W + m.w) m.x = -m.w; c.globalAlpha = t.mist * .7; c.fillStyle = t.fog; c.fillRect(Math.round(m.x), Math.round(m.y), Math.round(m.w), 3); c.fillRect(Math.round(m.x + 6), Math.round(m.y - 2), Math.round(m.w * .6), 2); c.globalAlpha = 1; }
    if (t.dew) for (const d of L.dew) { if ((f + d[2]) % 40 < 2) { c.fillStyle = '#ffffff'; c.fillRect(d[0], d[1], 1, 1); c.globalAlpha = .6; c.fillRect(d[0] - 1, d[1], 3, 1); c.fillRect(d[0], d[1] - 1, 1, 3); c.globalAlpha = 1; } }
    /* fairies: a bright body, beating wings, a halo and a trail of sparkles */
    for (const fy of L.fairies) {
      const a = fy.ph + f * fy.sp, x = Math.round(fy.cx + Math.cos(a) * fy.rx + Math.sin(a * 2.3) * 3), y = Math.round(fy.cy + Math.sin(a * 1.4) * fy.ry), col = t.fairy[fy.c];
      fy.trail.push([x, y]); if (fy.trail.length > 7) fy.trail.shift();
      for (let i = 0; i < fy.trail.length - 1; i++) { if ((f + i) % 2) continue; c.globalAlpha = .12 + i * .07; c.fillStyle = col; c.fillRect(fy.trail[i][0], fy.trail[i][1] + 1, 1, 1); }
      glow(c, x, y, 5, col, .9); c.globalAlpha = .7; c.fillStyle = col; c.fillRect(x - 1, y - 1, 3, 3);
      c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(x, y, 2, 2);
      const up = f % 2; c.globalAlpha = .9; c.fillStyle = '#eafcff'; c.fillRect(x - 2, y - 2 - up, 2, 2); c.fillRect(x + 2, y - 2 - up, 2, 2); c.fillRect(x - 3, y - 1, 1, 1); c.fillRect(x + 4, y - 1, 1, 1); c.globalAlpha = 1;
    }
    while (L.motes.length < t.motes) L.motes.push({ x: Math.random() * W, y: L.hz * .5 + Math.random() * (H - L.hz * .5), v: .06 + Math.random() * .18, p: Math.random() * 40, c: t.fairy[Math.floor(Math.random() * t.fairy.length)] });
    for (const m of L.motes) {
      m.y -= m.v; m.x += Math.sin((f + m.p) / 9) * .3; if (m.y < 8) { m.y = H - 2; m.x = Math.random() * W; }
      const tw = (f + m.p) % 30; if (tw > 24) continue;
      c.fillStyle = m.c; c.globalAlpha = .85; c.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      if (tw < 6) { c.globalAlpha = .4; c.fillRect(Math.round(m.x) - 1, Math.round(m.y), 3, 1); c.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 3); }
    }
    c.globalAlpha = 1;
    if (L.bokeh) for (const b of L.bokeh) { const a = b.ph + f * b.sp; glow(c, Math.round(b.x + Math.sin(a) * 6), Math.round(b.y + Math.cos(a * .8) * 4), b.r, b.c, .3 + .12 * Math.sin(a * 2)); }
    c.drawImage(vl, 0, 0);
  }
  function paintVeil() {
    const c = vx, bg = getComputedStyle(document.body).backgroundColor || 'rgb(12,26,21)', a0 = L.wide ? .62 : .6;
    c.clearRect(0, 0, W, H);
    for (let x = 0; x < W; x++) { const d = L.wide ? Math.min(x - L.cx0, L.cx1 - x) : 99; if (d < -8) continue; const k = L.wide ? Math.min(1, (d + 8) / 16) : 1; c.globalAlpha = a0 * k; c.fillStyle = bg; c.fillRect(x, 0, 1, H); }
    c.globalAlpha = 1;
  }

  /* ---------- on a phone: nothing behind the words ----------
   Two pieces, each built in layers so there is a near and a far to them.
   THE SIGN (top): a limb of the old tree across the top with two ropes, a dark carved board hanging from it, moss over its
   top edge and vines in front of its corners. The board's face is one flat dark panel so the words and buttons stay easy to
   read; all the wood grain lives in the frame around it. It is painted into the header's own background, so it scrolls away with it.
   THE ROCKS (bottom, fixed): far, hazy rocks and ferns behind; a heap of mossy boulders in the middle with an arched hollow
   cut into it exactly around Ask and Help (measured, so it follows any phone), lit from inside and floored with a slab; a
   brook running along the top of the heap, spilling down its face into a stream that crosses the bottom; and in front,
   dark boulders and blades of grass that overlap the ends of the water. Only the water, the foam and a few fireflies move. */
  const PHONE = 720;
  let mode = '', bot = null, bx = null, bst = null, bsx = null, bfg = null, bfx = null, BW = 0, BH = 42, B = null, signRO = null, botRO = null, signKey = '';
  const isPhone = () => innerWidth < PHONE;
  const mixh = (a, b, t) => { const A = hex(a), C = hex(b); return '#' + A.map((v, i) => Math.round(v + (C[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const put = (c, x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
  const WOOD = { morning: ['#8a5d39', '#7a5031', '#946543', '#5a3a22', '#33200f'], day: ['#8e603b', '#7d5333', '#9a6a46', '#5c3c23', '#33200f'], sunset: ['#7e4f36', '#6e432d', '#88583d', '#4e3021', '#2c1a0e'], night: ['#4f3a2e', '#443227', '#594236', '#30231b', '#1b130d'] };

  /* ----- the sign ----- */
  function paintSign() {
    const top = document.querySelector('.wrap > .top'); if (!top) return;
    const r = top.getBoundingClientRect(), P = 3, w = Math.max(24, Math.round(r.width / P)), h = Math.max(26, Math.round(r.height / P));
    const key = w + 'x' + h + mood; if (key === signKey) return; signKey = key;
    const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; const g = cv2.getContext('2d'); if (!g) return;
    const t = T, wd = WOOD[mood], R = rnd(5), Z = 6, S = 4, y0 = Z, y1 = h - S;           /* limb zone, shadow zone, the board between */
    /* BACK: the limb across the top, thick at the left and thinning, with its leaves behind the ropes */
    const limb = x => 3 + Math.round((1 - x / w) * 2);
    for (let x = 0; x < w; x++) { const th = limb(x), by = 1 + Math.round(Math.sin(x / 17) * .8); g.fillStyle = t.trunkD; g.fillRect(x, by, 1, th + 1); g.fillStyle = t.trunk; g.fillRect(x, by, 1, th - 1); g.fillStyle = t.trunkL; g.fillRect(x, by, 1, 1); if (R() < .12) { g.fillStyle = t.trunkD; g.fillRect(x, by + 1, 1, 2); } }
    for (let i = 0; i < 9; i++) { const x = Math.floor(R() * w), y = 1 + Math.floor(R() * 3); g.fillStyle = R() < .5 ? t.moss : t.mossD; g.fillRect(x, y, 2 + Math.floor(R() * 3), 1); }
    for (let i = 0; i < Math.round(w / 9); i++) { const x = 2 + Math.floor(R() * (w - 4)), y = 0 + Math.floor(R() * 3); disk(g, x, y, 2, i % 3 ? t.leafD : t.leaf); if (R() < .6) { g.fillStyle = t.mossL; g.fillRect(x - 1, y - 1, 1, 1); } }
    /* ropes: two twisted strands from the limb to the board, with a knot where they meet it */
    for (const rx of [Math.round(w * .17), Math.round(w * .83)]) { for (let y = 3; y <= y0 + 1; y++) { g.fillStyle = y % 2 ? '#c8a874' : '#8c6d44'; g.fillRect(rx, y, 1, 1); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(rx + 1, y, 1, 1); } g.fillStyle = '#d8bc88'; g.fillRect(rx - 1, y0, 3, 2); g.fillStyle = '#7c6038'; g.fillRect(rx - 1, y0 + 1, 3, 1); }
    /* MID: the board. A frame of wood with grain, and inside it one dark flat panel where everything is written */
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(3, y1, w - 6, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(4, y1 + 2, w - 8, 1);    /* its shadow on the page */
    for (let y = y0; y < y1; y++) { for (let x = 0; x < w; x++) { g.fillStyle = (y - y0) % 5 < 2 ? wd[0] : (y - y0) % 5 < 4 ? wd[1] : wd[3]; g.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < w; i++) { if (R() < .5) { g.fillStyle = R() < .5 ? wd[2] : wd[3]; g.globalAlpha = .5; g.fillRect(i, y0 + Math.floor(R() * (y1 - y0)), 2 + Math.floor(R() * 5), 1); g.globalAlpha = 1; } }
    g.fillStyle = wd[2]; g.fillRect(0, y0, w, 1); g.fillRect(0, y0, 1, y1 - y0);                       /* lit edges, top and left */
    g.fillStyle = wd[4]; g.fillRect(0, y1 - 1, w, 1); g.fillRect(w - 1, y0, 1, y1 - y0);                /* shaded edges, bottom and right */
    const px0 = 3, py0 = y0 + 3, px1 = w - 3, py1 = y1 - 3, plate = mixh(wd[4], '#000000', .15);
    g.fillStyle = plate; g.fillRect(px0, py0, px1 - px0, py1 - py0);
    g.fillStyle = mixh(plate, '#000000', .5); g.fillRect(px0, py0, px1 - px0, 1); g.fillRect(px0, py0, 1, py1 - py0);        /* the panel is sunk into the frame */
    g.fillStyle = mixh(plate, wd[2], .3); g.fillRect(px0, py1 - 1, px1 - px0, 1); g.fillRect(px1 - 1, py0, 1, py1 - py0);
    /* NEAR: round-log ends at the corners, moss over the top edge, vines hanging in front of the frame */
    for (const [x, y] of [[2, y0 + 2], [w - 3, y0 + 2], [2, y1 - 3], [w - 3, y1 - 3]]) { disk(g, x, y, 2, '#c9a273'); g.fillStyle = '#8a643e'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    for (let x = 0; x < w; x++) { const d = R() < .5 ? 1 : R() < .5 ? 2 : R() < .75 ? 3 : 4; for (let k = 0; k < d; k++) { g.fillStyle = k === 0 ? (R() < .4 ? t.mossL : t.moss) : (R() < .5 ? t.mossD : t.moss); g.fillRect(x, y0 - 1 + k, 1, 1); } }
    for (let i = 0; i < Math.round(w / 20); i++) { const x = 5 + Math.floor(R() * (w - 10)); g.fillStyle = i % 2 ? '#f4d6e6' : '#fff4c0'; g.fillRect(x, y0 - 2, 1, 1); g.fillStyle = '#ffffff'; g.fillRect(x + 1, y0 - 2, 1, 1); }
    for (const vx0 of [1, w - 2]) { const dir = vx0 < 8 ? 1 : -1, len = 10 + Math.floor(R() * 5); for (let y = y0; y < y0 + len; y++) { const o = Math.round(Math.sin(y / 2.2 + vx0) * 1); g.fillStyle = t.mossD; g.fillRect(vx0 + o, y, 1, 1); if ((y - y0) % 3 === 1) { g.fillStyle = t.moss; g.fillRect(vx0 + o + dir, y, 1, 1); g.fillStyle = t.mossL; g.fillRect(vx0 + o + dir * 2, y, 1, 1); } } }
    top.style.setProperty('--sign', `url(${cv2.toDataURL()})`);
  }

  /* ----- one boulder: lit from the upper left, shaded rim, cracks, a moss cap. tone > 0 pushes it back into the haze ----- */
  function boulder(c, cx, cy, rx, ry, t, R, o) {
    o = o || {}; const tone = o.tone || 0, dk0 = o.dark || 0;
    const m = col => mixh(tone ? mixh(col, t.fog, tone) : col, '#000000', dk0);
    const base = m(t.stone), dk = m(mixh(t.stoneD, '#000000', .3)), mid = m(mixh(t.stone, t.stoneD, .55)), lt = m(t.stoneL), hi = m(mixh(t.stoneL, '#ffffff', .4));
    const mo = [m(t.moss), m(t.mossD), m(t.mossL)];
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (o.clip && !o.clip(x, y)) continue;
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny, wob = (((x * 7 + y * 13) % 5) - 2) * .04;
      if (d > 1 + wob) continue;
      const sh = -(nx * .55 + ny * .85);
      let col = sh > .6 ? hi : sh > .22 ? lt : sh > -.12 ? base : sh > -.5 ? mid : dk;
      if (d > .74) col = sh > .5 ? mid : dk;               /* a dark outline all round, so every stone reads as its own */
      else if (d > .6 && sh < -.2) col = dk;
      else if (R() < .025) col = R() < .5 ? dk : lt;
      put(c, x, y, col);
    }
    if (!o.clip && R() < .7) { let px = cx + (R() - .5) * rx, py = cy - ry * .3; for (let i = 0, n = Math.round(ry * .9); i < n; i++) { px += (R() - .45) * 1.3; py += .9; put(c, Math.round(px), Math.round(py), dk); } }
    if (o.moss !== false && (o.moss === true || R() < .4)) for (let x = x0; x <= x1; x++) {
      const nx = (x + .5 - cx) / rx; if (Math.abs(nx) > .8) continue;
      const topY = Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - nx * nx))) + 1, depth = 1 + (R() < .35 ? 1 : 0) + (R() < .08 ? 2 : 0);
      for (let k = 0; k < depth; k++) { if (o.clip && !o.clip(x, topY + k)) continue; put(c, x, topY + k, k === 0 ? (R() < .25 ? mo[2] : mo[0]) : mo[1]); }
    }
  }
  function layoutBot() {
    const P = 3; BW = Math.ceil(innerWidth / P); BH = 42;
    const top = innerHeight - BH * P, yF = BH - 8, R = rnd(9);
    const rect = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 10 ? r : null; };
    const rs = [rect('askBtn'), rect('helpBtn')].filter(Boolean); let hy0, niches;
    /* one niche per button, a stride of stone round each: two units of air at the sides, three above */
    if (rs.length) {
      hy0 = Math.max(6, Math.floor((Math.min.apply(null, rs.map(r => r.top)) - top) / P) - 3);
      niches = rs.map(r => { const x0 = Math.max(3, Math.floor(r.left / P) - 2), x1 = Math.min(BW - 3, Math.ceil(r.right / P) + 2); return { x0, x1, rr: Math.max(3, Math.min(10, Math.floor((x1 - x0) / 2.2), Math.floor((yF - hy0) / 2))) }; });
    } else { hy0 = yF - 20; niches = [{ x0: BW - 70, x1: BW - 46, rr: 10 }, { x0: BW - 38, x1: BW - 5, rr: 10 }]; }
    const hx0 = Math.min.apply(null, niches.map(n => n.x0)), hx1 = Math.max.apply(null, niches.map(n => n.x1));
    B = { yF, hy0, niches, hx0, hx1, flies: [] };
    /* the skyline of the heap: tall around the niches, lumpy everywhere (never a straight line), falling away to either side */
    B.mtop = x => { const out = x < hx0 ? hx0 - x : x > hx1 ? x - hx1 : 0, k = Math.max(0, 1 - out / 22), e = k * k * (3 - 2 * k); const lumps = Math.sin(x / 2.7) * 1.3 + Math.sin(x / 6.3 + 1.3) * 2.1 + Math.sin(x / 12.1 + .4) * 2.8; return Math.max(4, Math.round(BH - 17 - e * (BH - 17 - (hy0 - 9)) + lumps * (.6 + .8 * e))); };
    B.hollow = (x, y) => {
      if (y < hy0 || y >= yF) return false;
      for (const n of niches) { if (x < n.x0 || x > n.x1) continue; const q = y - hy0; if (q >= n.rr) return true; const dx = n.rr - Math.sqrt(Math.max(0, n.rr * n.rr - (n.rr - q) * (n.rr - q))); if (x >= n.x0 + dx && x <= n.x1 - dx) return true; }
      return false;
    };
    B.cx = hx0 > 40 ? Math.min(hx0 - 16, 30) : 0;                  /* where the brook leaves the heap, if there is room left of the niches */
    for (let i = 0; i < 6; i++) { const n = niches[i % niches.length]; B.flies.push({ cx: n.x0 + (n.x1 - n.x0) * (.15 + R() * .7), cy: hy0 + 4 + R() * (yF - hy0 - 8), rx: 3 + R() * 5, ry: 1 + R() * 3, sp: .035 + R() * .04, ph: R() * 6.28, c: i % 4 }); }
  }
  function paintBot() {
    const c = bsx, t = T, R = rnd(13), { yF, hy0, hx0, hx1, niches } = B, clipOut = (x, y) => !B.hollow(x, y);
    c.clearRect(0, 0, BW, BH);
    /* FAR: a hazy wall of rock behind everything, a little higher than the heap, with ferns on its crest */
    const farTop = x => Math.max(2, B.mtop(x) - 5 - Math.round(Math.sin(x / 5 + 2) * 1.5));
    for (let x = 0; x < BW; x++) for (let y = farTop(x); y < BH; y++) put(c, x, y, mixh(mixh(t.stoneD, t.fog, .5), t.far[1], .25));
    for (let i = 0, n = Math.round(BW / 8); i < n; i++) { const x = Math.round((i + R() * .8) * 8), rx = 3.5 + R() * 3, cy = Math.max(rx * .75 + 2, farTop(x) + rx * .6 + R() * 3); boulder(c, x, cy, rx, rx * .75, t, R, { tone: .6, moss: true }); }
    for (let x = 1; x < BW; x += 3 + Math.floor(R() * 4)) { const y = farTop(x) + 2, col = mixh(t.mossD, t.fog, .45); put(c, x, y - 3, col); put(c, x - 1, y - 2, col); put(c, x + 1, y - 2, col); put(c, x, y - 2, col); put(c, x - 2, y - 1, col); put(c, x + 2, y - 1, col); }
    /* MID: the heap. Dark crevices first, then boulders row by row so the nearer ones overlap the farther ones */
    for (let x = 0; x < BW; x++) for (let y = B.mtop(x); y < BH; y++) put(c, x, y, mixh(t.stoneD, '#000000', .6));
    for (let yy = 0; yy < BH + 6; yy += 4) {
      let x = -6 + R() * 4;
      while (x < BW + 8) { const rx = 4.5 + R() * 4, ry = rx * (.72 + R() * .15), cy = yy + R() * 2; if (cy - ry * .75 >= B.mtop(Math.round(x)) - 1.5 && cy - ry < BH) boulder(c, x, cy, rx, ry, t, R); x += rx * 1.45 + R() * 2.5; }
    }
    /* a crown of bigger stones on top, of different sizes and set at different heights, so the skyline is made of rocks and not a line */
    for (let x = 2 + R() * 6; x < BW; x += 9 + R() * 12) { const rx = 3.5 + R() * 4.5, ry = rx * (.7 + R() * .25), cy = Math.max(ry + 2, B.mtop(Math.round(x)) + ry * (.1 + R() * .5)); boulder(c, x, cy, rx, ry, t, R, { moss: R() < .55 }); }
    /* the niches: cut out, then made into rooms: a back wall, dim stones, a glow, a mossy ceiling */
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    for (let y = hy0; y < yF; y++) for (let x = hx0; x <= hx1; x++) if (B.hollow(x, y)) c.fillRect(x, y, 1, 1);
    c.globalCompositeOperation = 'source-over';
    const wall = mixh(t.groundD, '#000000', .85), wallLo = mixh(t.groundD, '#000000', .6);
    for (let y = hy0; y < yF; y++) for (let x = hx0; x <= hx1; x++) if (B.hollow(x, y)) put(c, x, y, mixh(wall, wallLo, (y - hy0) / (yF - hy0)));
    for (const n of niches) {
      const w = n.x1 - n.x0;
      for (let i = 0, k = Math.max(2, Math.round(w / 9)); i < k; i++) boulder(c, n.x0 + 3 + R() * (w - 6), yF - 3 - R() * 5, 2.6 + R() * 2.4, 2.4 + R() * 1.6, t, R, { tone: .5, dark: .35, clip: B.hollow });
      const gc = t.lit > .3 ? t.win : t.fairy[1], ga = t.lit > .3 ? .55 : .34, gx = (n.x0 + n.x1) / 2, gy = yF - 6, gr = w * .7;
      for (let y = hy0; y < yF; y++) for (let x = n.x0; x <= n.x1; x++) { if (!B.hollow(x, y)) continue; const d = Math.hypot((x - gx) / gr, (y - gy) / (gr * .6)); if (d >= 1) continue; c.globalAlpha = ga * (1 - d) * (1 - d); put(c, x, y, gc); }
      c.globalAlpha = 1;
    }
    /* the frame: stones set round each opening like an arch (a keystone on top, blocks down the sides), clipped to the opening */
    for (const n of niches) {
      const cxA = (n.x0 + n.x1) / 2, topY = x => { let y = hy0; while (y < yF && !B.hollow(x, y)) y++; return y; };
      for (let x = n.x0 + 1; x < n.x1; x += (x < n.x0 + n.rr || x > n.x1 - n.rr) ? 3 : 5) { const y = topY(Math.round(x)); if (y >= yF) continue; boulder(c, x, y - 2.2 - R() * .8, 3.6 + R() * 1.4, 3 + R() * .8, t, R, { clip: clipOut, moss: R() < .3 }); }
      boulder(c, cxA, topY(Math.round(cxA)) - 3.2, 5.6, 4.3, t, R, { clip: clipOut, moss: false });
      for (const sx of [n.x0 - 2.2, n.x1 + 2.2]) for (let y = yF - 2.5; y > hy0 + n.rr - 1; y -= 5.5) boulder(c, sx + (R() - .5), y, 3 + R() * .8, 3.2 + R() * .6, t, R, { clip: clipOut, moss: R() < .25 });
    }
    /* the edge of every opening: a dark inner rim, so it reads as depth rather than a hole cut in a picture */
    for (let y = hy0; y < yF; y++) for (let x = hx0; x <= hx1; x++) { if (!B.hollow(x, y)) continue; if (!B.hollow(x - 1, y) || !B.hollow(x + 1, y) || !B.hollow(x, y - 1)) { c.globalAlpha = .75; put(c, x, y, '#06100c'); c.globalAlpha = 1; } }
    for (let x = hx0; x <= hx1; x++) { let y = hy0; while (y < yF && !B.hollow(x, y)) y++; if (y >= yF) continue; const len = 1 + Math.floor(R() * 3) + (R() < .2 ? 3 : 0); for (let k = 0; k < len; k++) put(c, x, y + 1 + k, k === len - 1 && R() < .5 ? t.mossL : (R() < .5 ? t.moss : t.mossD)); }
    for (const n of niches) {
      const gx = (n.x0 + n.x1) / 2;
      for (const fx of [n.x0 + 3, n.x1 - 3]) { fern(c, fx, yF - 1, t, R); fern(c, fx + (fx < gx ? 3 : -3), yF - 1, t, R); }
      for (const mx of [n.x0 + 6, Math.round(gx), n.x1 - 6]) { const col = mood === 'night' ? '#7affd8' : '#f0a8c8'; c.globalAlpha = .5; put(c, mx - 1, yF - 3, col); put(c, mx + 1, yF - 3, col); c.globalAlpha = 1; put(c, mx, yF - 2, '#efe6d6'); put(c, mx, yF - 3, col); put(c, mx - 1, yF - 4, col); put(c, mx, yF - 4, col); put(c, mx + 1, yF - 4, col); }
    }
    /* the slab the buttons stand on: lit top, shaded front, moss at its feet */
    for (let x = hx0 - 3; x <= hx1 + 3; x++) { put(c, x, yF, mixh(t.stoneL, '#ffffff', .15)); put(c, x, yF + 1, t.stone); }
    for (let x = hx0 - 3; x <= hx1 + 3; x++) if (!B.hollow(x, yF - 1) ? false : R() < .5) put(c, x, yF - 1, R() < .5 ? t.moss : t.mossD);
    for (let x = hx0 - 3; x <= hx1 + 3; x += 2) if (R() < .5) put(c, x, yF + 2, mixh(t.stoneD, '#000000', .3));
    /* the crest of the heap: tufts of grass, a few small flowers, ivy hanging over the arches */
    for (let x = 1; x < BW - 1; x++) { if (R() < .55) continue; const y = B.mtop(x), n = 1 + Math.floor(R() * 2); for (let k = 1; k <= n; k++) put(c, x, y - k, k === n ? t.moss : t.mossD); if (R() < .06) put(c, x, y - n - 1, ['#f4d6e6', '#fff4c0', '#d8c8ff'][Math.floor(R() * 3)]); }
    /* the stream's bed across the bottom, under the slab */
    for (let y = yF + 2; y < BH - 1; y++) for (let x = 0; x < BW; x++) put(c, x, y, mixh(mixh(t.water2, t.groundD, .55), '#000000', (y - yF - 2) * .03));
    for (let x = 0; x < BW; x++) { put(c, x, BH - 1, mixh(t.stoneD, '#000000', .35)); if (R() < .3) put(c, x, BH - 1, mixh(t.stone, '#000000', .3)); }
  }
  /* the nearest layer: dark boulders and grass that overlap the ends of the water. Painted separately so the moving water goes under it. */
  function paintFg() {
    const c = bfx, t = T, R = rnd(17), { yF } = B; c.clearRect(0, 0, BW, BH);
    boulder(c, 1, BH - 9, 13, 10, t, R, { dark: .22 }); boulder(c, 17, BH - 3, 7, 4.5, t, R, { dark: .2 });
    boulder(c, BW - 2, BH - 3, 10, 4.8, t, R, { dark: .2, moss: true }); boulder(c, BW - 16, BH - 1, 6, 3, t, R, { dark: .2 });
    for (let x = 0; x < BW; x++) { if (R() < .5) continue; const n = 2 + Math.floor(R() * 3), lean = R() < .5 ? -1 : 1; for (let k = 0; k < n; k++) { const col = k === n - 1 ? mixh(t.mossL, '#000000', .1) : (R() < .5 ? mixh(t.moss, '#000000', .25) : mixh(t.mossD, '#000000', .1)); put(c, x + (k > 1 ? lean : 0), BH - 1 - k, col); } }
    for (const fx of [5, 24, BW - 7]) { for (let k = 0; k < 7; k++) { const col = k > 4 ? t.mossL : k > 2 ? t.moss : t.mossD; put(c, fx - Math.round(k * .6), BH - 5 - k, col); put(c, fx + Math.round(k * .6), BH - 5 - k, col); } put(c, fx, BH - 5, t.mossD); }
  }
  function drawBot() {
    if (!bx || !bst || !B) return;
    const c = bx, t = T, f = frame++, { yF, hx0, hx1 } = B, y0 = yF + 2, y1 = BH - 1;
    c.drawImage(bst, 0, 0);
    /* the brook along the crest of the heap, spilling down its face where the ridge ends */
    if (B.cx) {
      const cx = B.cx, top = B.mtop(cx);
      for (let x = 0; x <= cx + 3; x++) { const y = B.mtop(x) - 1; put(c, x, y - 1, mixh(t.water, t.water2, .4)); put(c, x, y, ((x + f) % 7 < 3) ? t.foam : t.water); put(c, x, y + 1, t.water2); }
      for (let x = -1; x < 4; x++) { for (let y = top; y < y0; y++) { const o = ((f * 2 + y + x * 3) % 6); put(c, cx + x, y, x === -1 || x === 3 ? t.water2 : o < 2 ? t.foam : o < 4 ? t.water : t.water2); } }
      for (let i = 0; i < 9; i++) { const a = (f * 1.2 + i * 7) % 12, sx = cx + 1 + Math.round((i % 2 ? 1 : -1) * (a * .6 + 1)), sy = y0 - 1 - Math.round(Math.sin(a / 12 * 3.14) * 4); if (a < 11) put(c, sx, sy, t.foam); }
    }
    /* the stream: slides to the right, brighter where it is shallow, darker in the slab's shadow */
    for (let y = y0; y < y1; y++) {
      const rowI = y - y0; c.fillStyle = rowI === 0 ? mixh(t.water2, '#000000', .35) : rowI === 1 ? mixh(t.water2, '#000000', .12) : t.water2; c.fillRect(0, y, BW, 1);
      if (rowI > 0) { const sp = 1 + (rowI % 2), off = (f * sp + rowI * 7) % 13; for (let x = off - 13; x < BW; x += 13) { c.fillStyle = rowI === 2 ? t.water : mixh(t.water, t.water2, .35); c.fillRect(x, y, 3 + (rowI % 2), 1); } }
    }
    for (let i = 0; i < 12; i++) { const x = (i * 11 + f * 2) % BW, y = y0 + 1 + (i % 3); if ((f + i) % 6 < 2) put(c, x, y, t.foam); }
    c.drawImage(bfg, 0, 0);
    for (const fy of B.flies) { const a = fy.ph + f * fy.sp, x = Math.round(fy.cx + Math.cos(a) * fy.rx), y = Math.round(fy.cy + Math.sin(a * 1.3) * fy.ry), col = t.fairy[fy.c]; glow(c, x, y, 3, col, .85); put(c, x, y, '#ffffff'); }
  }
  function buildPhone() {
    if (!bot) return;
    layoutBot(); mood = pickMood(); T = TOD[mood]; document.documentElement.dataset.tod = mood;
    for (const k of [bot, bst, bfg]) { k.width = BW; k.height = BH; }
    bot.style.width = BW * 3 + 'px'; bot.style.height = BH * 3 + 'px';
    paintBot(); paintFg(); drawBot(); signKey = ''; paintSign();
  }
  function startPhone() {
    bot = document.createElement('canvas'); bot.id = 'sceneBot'; bot.setAttribute('aria-hidden', 'true');
    bx = bot.getContext('2d'); bst = document.createElement('canvas'); bsx = bst.getContext('2d'); bfg = document.createElement('canvas'); bfx = bfg.getContext('2d');
    if (!bx || !bsx || !bfx) { bot = null; return; }
    document.body.append(bot); document.body.classList.add('scene-phone');
    buildPhone(); loop();
    const top = document.querySelector('.wrap > .top');
    if (top && window.ResizeObserver) { signRO = new ResizeObserver(() => paintSign()); signRO.observe(top); }
    /* the hollow follows the buttons: when they change size, the rocks are rebuilt around them */
    const row = document.querySelector('.help-row'); if (row && window.ResizeObserver) { botRO = new ResizeObserver(() => { if (bot) { layoutBot(); paintBot(); paintFg(); drawBot(); } }); botRO.observe(row); }
  }
  function stopPhone() {
    if (signRO) signRO.disconnect(); signRO = null; if (botRO) botRO.disconnect(); botRO = null;
    if (bot) bot.remove(); bot = null; bx = null; document.body.classList.remove('scene-phone');
    const top = document.querySelector('.wrap > .top'); if (top) top.style.removeProperty('--sign'); signKey = '';
  }
  function build() {
    if (!cv) return;
    layout(); cv.width = W; cv.height = H; cv.style.width = W * PX + 'px'; cv.style.height = H * PX + 'px';
    st.width = W; st.height = H; vl.width = W; vl.height = H; mood = pickMood(); T = TOD[mood]; document.documentElement.dataset.tod = mood;
    paint(); paintVeil(); draw();
  }
  function loop() { clearTimeout(timer); if (still || document.hidden || !(cv || bot)) return; if (bot) drawBot(); else draw(); timer = setTimeout(loop, 166); }
  let rsT = 0;
  function start() {
    if (cv || bot || !on()) return;
    still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    mode = isPhone() ? 'phone' : 'wide'; if (mode === 'phone') { startPhone(); return; }
    cv = document.createElement('canvas'); cv.id = 'scene'; cv.setAttribute('aria-hidden', 'true');
    cx = cv.getContext('2d'); st = document.createElement('canvas'); sx = st.getContext('2d'); vl = document.createElement('canvas'); vx = vl.getContext('2d');
    if (!cx || !sx || !vx) { cv = null; return; }
    document.body.prepend(cv); document.body.classList.add('scene-on');
    build(); loop();
  }
  function stop() { clearTimeout(timer); stopPhone(); if (cv) cv.remove(); cv = null; document.body.classList.remove('scene-on'); delete document.documentElement.dataset.tod; }
  addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (!cv && !bot) return; if ((isPhone() ? 'phone' : 'wide') !== mode) { stop(); start(); } else if (bot) buildPhone(); else build(); }, 200); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && (cv || bot)) { if (pickMood() !== mood) (bot ? buildPhone() : build()); loop(); } });
  setInterval(() => { if ((cv || bot) && !document.hidden && pickMood() !== mood) (bot ? buildPhone() : build()); }, 60000);
  return { start, stop, sync: () => (on() ? (cv ? build() : bot ? buildPhone() : start()) : stop()), mood: () => mood, set(v) { if (v) delete S.ui.scene; else S.ui.scene = false; persist(); this.sync(); }, on };
})();
