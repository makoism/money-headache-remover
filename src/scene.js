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
    /* layers of forest fading into the mist: the deeper, the paler */
    for (let k = 0; k < 3; k++) {
      const base = hz + 4 + k * 10, col = t.far[k], R2 = rnd(31 + k);
      /* tall trunks rising out of sight, thicker the nearer they stand, and low bushes between them */
      for (let x = -4; x < W + 6; x += 7 + k * 3 + Math.floor(R2() * 8)) { const w = 2 + k * 2 + Math.floor(R2() * 2); c.fillStyle = col; c.fillRect(x, 0, w, base + 40); c.fillRect(x - 1, base - 3, w + 2, 43); if (R2() < .5) { c.fillRect(x + w, Math.round(base * (.3 + R2() * .4)), 3 + k, 1); } }
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
    c.drawImage(vl, 0, 0);
  }
  function paintVeil() {
    const c = vx, bg = getComputedStyle(document.body).backgroundColor || 'rgb(12,26,21)', a0 = L.wide ? .62 : .6;
    c.clearRect(0, 0, W, H);
    for (let x = 0; x < W; x++) { const d = L.wide ? Math.min(x - L.cx0, L.cx1 - x) : 99; if (d < -8) continue; const k = L.wide ? Math.min(1, (d + 8) / 16) : 1; c.globalAlpha = a0 * k; c.fillStyle = bg; c.fillRect(x, 0, 1, H); }
    c.globalAlpha = 1;
  }
  function build() {
    if (!cv) return;
    layout(); cv.width = W; cv.height = H; cv.style.width = W * PX + 'px'; cv.style.height = H * PX + 'px';
    st.width = W; st.height = H; vl.width = W; vl.height = H; mood = pickMood(); T = TOD[mood]; document.documentElement.dataset.tod = mood;
    paint(); paintVeil(); draw();
  }
  function loop() { clearTimeout(timer); if (still || document.hidden || !cv) return; draw(); timer = setTimeout(loop, 166); }
  let rsT = 0;
  function start() {
    if (cv || !on()) return;
    still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    cv = document.createElement('canvas'); cv.id = 'scene'; cv.setAttribute('aria-hidden', 'true');
    cx = cv.getContext('2d'); st = document.createElement('canvas'); sx = st.getContext('2d'); vl = document.createElement('canvas'); vx = vl.getContext('2d');
    if (!cx || !sx || !vx) { cv = null; return; }
    document.body.prepend(cv); document.body.classList.add('scene-on');
    build(); loop();
  }
  function stop() { clearTimeout(timer); if (cv) cv.remove(); cv = null; document.body.classList.remove('scene-on'); delete document.documentElement.dataset.tod; }
  addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (cv) build(); }, 200); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cv) { if (pickMood() !== mood) build(); loop(); } });
  setInterval(() => { if (cv && !document.hidden && pickMood() !== mood) build(); }, 60000);
  return { start, stop, sync: () => (on() ? (cv ? build() : start()) : stop()), mood: () => mood, set(v) { if (v) delete S.ui.scene; else S.ui.scene = false; persist(); this.sync(); }, on };
})();
