/* ---------- the scenery: a cozy pixel-art forest behind the whole page ----------
   One small canvas (about 200 pixels tall, scaled up crisp) fixed behind everything. The still parts (sky, hills, trees, the hut,
   the cliff, rocks, vines, flowers) are painted once into a second canvas whenever the window size or the time of day changes;
   only the living parts (waterfall, deer, birds, smoke, clouds, magic motes, dew, stars) are drawn on top, six times a second,
   and nothing runs while the tab is hidden. Reduced motion gets one still frame.
   Four moods by the local clock: morning (5 to 10), day (10 to 16), sunset (16 to 19), night.
   The middle column, where the page sits, gets a soft veil of the page colour so words stay easy to read; the sides stay vivid.
   Test hook: ?tod=morning|day|sunset|night fixes the mood. */
const SCENE = (() => {
  const TOD = {
    morning: { sky: ['#8fbfe4', '#cfe0ec', '#f8d9b6'], sun: '#fff1c4', glow: '#fff3d6', far: '#a7bccb', near: '#86a3a8', treeFar: '#6a927f', tree: '#3f7a55', treeD: '#2c5a3e', grass: '#86c46e', grassD: '#64a75a', grassL: '#a6d982', water: '#c6eaf4', water2: '#94d0e4', foam: '#ffffff', rock: '#a3aaa6', rockD: '#737b78', rockL: '#c7ccc8', wood: '#9a6a44', woodD: '#6e4a2e', roof: '#5f7a4a', roofD: '#465c37', win: '#ffe3a0', deer: '#a8714a', deerD: '#7a4f32', bird: '#4a5a66', cloud: '#ffffff', cloudD: '#f3e2d6', mote: ['#fff6c8', '#ffffff', '#ffe0f0'], motes: 26, dew: true, stars: false, lit: .5, smoke: '#e9ecef' },
    day: { sky: ['#4fa6e6', '#8ccbee', '#cdebf6'], sun: '#fffbe0', glow: '#fffbe8', far: '#9cc2d6', near: '#76a6b0', treeFar: '#559673', tree: '#3b8a52', treeD: '#2a6a3e', grass: '#7fca6c', grassD: '#5aa950', grassL: '#a4dc7f', water: '#a6e4f6', water2: '#6cc3e6', foam: '#ffffff', rock: '#a0a8a6', rockD: '#6f7876', rockL: '#c9cfcc', wood: '#a06e46', woodD: '#704c2f', roof: '#5e8248', roofD: '#466636', win: '#cfe8f0', deer: '#b07a50', deerD: '#7e5434', bird: '#3b4650', cloud: '#ffffff', cloudD: '#e2eef6', mote: ['#fffbd0', '#ffffff', '#d8fff0'], motes: 16, dew: false, stars: false, lit: 0, smoke: '#f2f4f5' },
    sunset: { sky: ['#3f4a8a', '#c66f8e', '#f7b267'], sun: '#ffd27a', glow: '#ffe2a8', far: '#8a6a8f', near: '#634d72', treeFar: '#46465e', tree: '#2f4a44', treeD: '#22363a', grass: '#6f8a52', grassD: '#536f45', grassL: '#8fa662', water: '#f4b996', water2: '#c98a9a', foam: '#ffe9d6', rock: '#8a7f86', rockD: '#5f5560', rockL: '#ad9fa4', wood: '#8a5a3a', woodD: '#5e3c26', roof: '#4f5a3c', roofD: '#3a442c', win: '#ffc86a', deer: '#9a6440', deerD: '#6a4228', bird: '#2a2238', cloud: '#ffc9a8', cloudD: '#e89a9a', mote: ['#ffd9a0', '#ffb3c8', '#fff2c0'], motes: 30, dew: false, stars: false, lit: 1, smoke: '#d9b9c0' },
    night: { sky: ['#081129', '#14244a', '#253a66'], sun: '#f2f0d8', glow: '#c8d6ff', far: '#25365a', near: '#1b2a46', treeFar: '#14283a', tree: '#123029', treeD: '#0b201d', grass: '#1d3d33', grassD: '#142e28', grassL: '#285044', water: '#4a6fa6', water2: '#2f4f86', foam: '#c8dcff', rock: '#3a4556', rockD: '#252e3c', rockL: '#4f5c70', wood: '#4a3424', woodD: '#33241a', roof: '#24331f', roofD: '#1a2617', win: '#ffd27a', deer: '#5a4a46', deerD: '#3e3230', bird: '#0b1020', cloud: '#2f3f66', cloudD: '#25345a', mote: ['#c8ff9a', '#7affd0', '#fff6b0'], motes: 44, dew: false, stars: true, lit: 1, smoke: '#4a5a7a' },
  };
  const DEER = [
    ['..........a..a', '...........aa.', '..........bbb.', '.........bbkbw', '.........bbbb.', '.........bb...', '.wbbbbbbbbb...', '.bbbbbbbbbb...', '.bwwwwwbbbb...', '.b.b....b.b...', '.d.d....d.d...'],
    ['..............', '..............', '..............', '..............', '..............', '..............', '.wbbbbbbbbb...', '.bbbbbbbbbbb..', '.bwwwwwbbbbbba', '.b.b....b.bbaa', '.d.d....d.dbk.'],
  ];
  const BIRD = [['k...k', '.k.k.', '..k..'], ['.....', 'kk.kk', '..k..']];
  let cv = null, cx = null, st = null, sx = null, vl = null, vx = null, W = 0, H = 0, PX = 3, T = null, mood = '', timer = 0, frame = 0, L = null, rng = null, still = false;
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const pickMood = () => {
    const q = (location.search.match(/[?&]tod=(morning|day|sunset|night)\b/) || [])[1]; if (q) return q;
    const h = new Date().getHours(); return h >= 5 && h < 10 ? 'morning' : h >= 10 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'sunset' : 'night';
  };
  const on = () => !(S && S.ui && S.ui.scene === false);
  const r = (c, x, y, w, h) => { c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const grid = (c, x, y, rows, pal, flip) => { for (let j = 0; j < rows.length; j++) { const row = rows[j]; for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || !pal[ch]) continue; c.fillStyle = pal[ch]; c.fillRect(Math.round(x + (flip ? row.length - 1 - i : i)), Math.round(y + j), 1, 1); } } };
  const disk = (c, x0, y0, rad, col) => { c.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };

  /* ---------- the layout: where things stand, from the window's shape ---------- */
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    PX = Math.max(2, Math.round(vh / 200)); W = Math.ceil(vw / PX); H = Math.ceil(vh / PX);
    const col = Math.min(W, Math.ceil(800 / PX)), side = Math.max(0, (W - col) / 2), wide = side >= 46;
    const hz = Math.round(H * (wide ? .6 : .55));                       /* the horizon */
    rng = rnd(7);
    L = { col, side, wide, hz, cx0: side, cx1: W - side };
    L.hut = { x: wide ? Math.max(4, Math.round(side * .22)) : 2, y: Math.round(H * .78) };
    L.fall = { x: wide ? Math.round(W - side * .5) : W - 10, top: Math.round(hz - (wide ? 46 : 30)), bot: Math.round(H * .8), w: wide ? 9 : 5 };
    L.pond = { x: L.fall.x + Math.round(L.fall.w / 2), y: L.fall.bot + 3, rx: wide ? 24 : 12, ry: 4 };
    L.deer = wide ? [{ x: Math.round(side * .62), y: Math.round(H * .8) - 11, flip: false, ph: 0 }, { x: Math.round(W - side * .86), y: Math.round(H * .84) - 11, flip: true, ph: 37 }] : [];
    L.stars = []; for (let i = 0; i < Math.round(W * H / 260); i++) L.stars.push([Math.floor(rng() * W), Math.floor(rng() * hz * .9), rng()]);
    L.motes = []; L.dew = []; L.birds = []; L.clouds = []; L.flies = [];
    for (let i = 0; i < 6; i++) L.clouds.push({ x: rng() * W, y: 6 + rng() * hz * .35, s: 4 + Math.round(rng() * 5), v: .04 + rng() * .05 });
    for (let i = 0; i < 70; i++) L.dew.push([Math.floor(rng() * W), Math.round(hz + 6 + rng() * (H - hz - 8)), Math.floor(rng() * 40)]);
    L.flowers = []; for (let i = 0; i < Math.round(W / 4); i++) L.flowers.push([Math.floor(rng() * W), Math.round(hz + 8 + rng() * (H - hz - 10)), Math.floor(rng() * 4)]);
  }

  /* ---------- the still layer ---------- */
  function paint() {
    const c = sx, t = T, R = rnd(11);
    c.clearRect(0, 0, W, H);
    /* sky in dithered bands */
    const hz = L.hz, bands = 9;
    for (let y = 0; y < hz + 2; y++) {
      const f = y / (hz + 2), seg = f < .55 ? 0 : 1, lf = seg ? (f - .55) / .45 : f / .55, a = t.sky[seg], b = t.sky[seg + 1];
      const q = lf * bands, lo = Math.floor(q), fr = q - lo;
      const c0 = mix(a, b, lo / bands), c1 = mix(a, b, Math.min(1, (lo + 1) / bands));
      c.fillStyle = c0; c.fillRect(0, y, W, 1);
      if (fr > .5) { c.fillStyle = c1; for (let x = (y & 1); x < W; x += 2) c.fillRect(x, y, 1, 1); }
    }
    /* stars (the twinkling ones are drawn live) */
    if (t.stars) for (const s of L.stars) { c.fillStyle = s[2] > .85 ? '#ffffff' : '#9fb0d8'; c.fillRect(s[0], s[1], 1, 1); }
    /* sun or moon with a halo */
    const sp = { morning: [.2, .34], day: [.88, .12], sunset: [.82, .5], night: [.12, .16] }[mood], sxp = L.wide ? Math.round(sp[0] < .5 ? L.side * sp[0] * 2.4 : W - (W - sp[0] * W) * 1.6) : Math.round(W * sp[0]), syp = Math.round(hz * sp[1] * 1.6);
    disk(c, sxp, syp, mood === 'sunset' ? 13 : 10, mix(t.sky[1], t.glow, .35)); disk(c, sxp, syp, mood === 'sunset' ? 9 : 7, t.sun);
    if (mood === 'night') { disk(c, sxp + 3, syp - 2, 6, mix(t.sky[1], t.sky[2], .5)); }
    /* far and near hills */
    const ridge = (base, amp, k, col, seed) => { const RR = rnd(seed), p1 = RR() * 9, p2 = RR() * 9; c.fillStyle = col; for (let x = 0; x < W; x++) { const h = Math.round(base - amp * (.55 * Math.sin(x / k + p1) + .3 * Math.sin(x / (k * .37) + p2) + .15 * Math.sin(x / (k * .13)))); c.fillRect(x, h, 1, H - h); } };
    ridge(hz - 10, 12, 34, t.far, 3); ridge(hz - 2, 9, 22, t.near, 5);
    /* a far line of small pines */
    for (let x = -4; x < W + 4; x += 3 + Math.floor(R() * 3)) pine(c, x, hz + 2, 6 + Math.floor(R() * 6), t.treeFar, t.treeFar);
    /* the meadow */
    c.fillStyle = t.grass; c.fillRect(0, hz + 1, W, H - hz);
    for (let y = hz + 1; y < H; y++) for (let x = (y * 7) % 5; x < W; x += 5) { const v = R(); if (v < .32) { c.fillStyle = v < .16 ? t.grassD : t.grassL; c.fillRect(x, y, 1, 1); } }
    /* the cliff and the pond under the waterfall */
    const F = L.fall;
    const cl = F.x - 14, cr = F.x + F.w + 16, prof = [];
    for (let x = cl; x < cr; x++) { const e = Math.min(x - cl, cr - 1 - x); prof.push(F.top - 2 + Math.max(0, 8 - e * 2) + Math.round(Math.sin(x * 1.7) * 1.5)); }
    for (let x = cl; x < cr; x++) { const top = prof[x - cl]; c.fillStyle = t.rockD; c.fillRect(x, top, 1, F.bot - top + 2); }
    /* stones of every size, lit from the top left, with cracks */
    const nS = Math.round((cr - cl) * (F.bot - F.top) / 18);
    for (let i = 0; i < nS; i++) { const x = cl + 1 + Math.floor(R() * (cr - cl - 2)), y = F.top + Math.floor(R() * (F.bot - F.top)); if (y < prof[x - cl] + 2) continue; const w = 2 + Math.floor(R() * 4), h = 1 + Math.floor(R() * 3); c.fillStyle = t.rock; c.fillRect(x, y, w, h); c.fillStyle = t.rockL; c.fillRect(x, y, w - 1, 1); }
    c.fillStyle = mix(t.rockD, '#000000', .25); for (let i = 0; i < nS / 3; i++) { const x = cl + 2 + Math.floor(R() * (cr - cl - 4)), y = F.top + 4 + Math.floor(R() * (F.bot - F.top - 4)); c.fillRect(x, y, 1, 2 + Math.floor(R() * 3)); }
    for (let x = cl; x < cr; x++) { const top = prof[x - cl]; c.fillStyle = t.grass; c.fillRect(x, top - 1, 1, 2 + (x % 3 === 0 ? 1 : 0)); if (R() < .35) { c.fillStyle = t.grassD; c.fillRect(x, top + 1 + Math.floor(R() * 8), 1, 2 + Math.floor(R() * 3)); } }
    const P = L.pond; c.fillStyle = t.water2; for (let y = -P.ry; y <= P.ry; y++) { const w = Math.round(P.rx * Math.sqrt(1 - (y * y) / (P.ry * P.ry))); c.fillRect(P.x - w, P.y + y, w * 2, 1); }
    c.fillStyle = t.water; for (let y = -P.ry + 1; y < P.ry; y++) { const w = Math.round((P.rx - 3) * Math.sqrt(1 - (y * y) / (P.ry * P.ry))); c.fillRect(P.x - w, P.y + y, w * 2, 1); }
    /* big trees at both edges and at the inner edge of each side, behind the hut */
    const big = (x, h, y) => pine(c, x, y || Math.round(H * .86), h, t.tree, t.treeD);
    big(-8, 74); big(W - 7, 78); if (L.wide) { big(Math.round(L.side * .9), 50, Math.round(H * .8)); big(Math.round(W - L.side * .12), 58); big(Math.round(L.side * .08), 40, L.hut.y - 6); }
    /* the hut, in front */
    hut(c, L.hut.x, L.hut.y, t);
    /* flowers and mushrooms in the grass */
    const FL = ['#f6a9c0', '#ffffff', '#f6d860', '#b9a6f2'];
    for (const f of L.flowers) { c.fillStyle = t.grassD; c.fillRect(f[0], f[1], 1, 2); c.fillStyle = mood === 'night' ? mix(FL[f[2]], t.grass, .55) : FL[f[2]]; c.fillRect(f[0], f[1] - 1, 1, 1); }
    for (let i = 0; i < 9; i++) { const x = Math.floor(R() * W), y = Math.round(L.hz + 14 + R() * (H - L.hz - 18)); mushroom(c, x, y, t); }
    /* rocks along the bottom edge, spilling off it */
    for (let x = -6; x < W + 6; x += 9 + Math.floor(R() * 12)) rock(c, x, H - 2 - Math.floor(R() * 4), 4 + Math.floor(R() * 6), t, R);
    /* vines hanging from the top at both sides */
    const vines = L.wide ? Math.max(3, Math.round(L.side / 13)) : 3;
    for (let i = 0; i < vines; i++) { vine(c, Math.round(2 + R() * (L.wide ? L.side * .9 : 10)), Math.round(H * (.18 + R() * (L.wide ? .5 : .2))), t, R); vine(c, Math.round(W - 3 - R() * (L.wide ? L.side * .9 : 10)), Math.round(H * (.18 + R() * (L.wide ? .5 : .2))), t, R); }
    /* a leafy garland across the very top */
    for (let x = 0; x < W; x += 2) { const y = Math.round(1.5 + Math.sin(x / 7) * 1.5 + (R() < .3 ? 1 : 0)); c.fillStyle = R() < .5 ? t.tree : t.grass; c.fillRect(x, 0, 2, y + 1); }
  }
  /* the veil over the column where the page sits, laid over everything each frame so nothing living shows through bright */
  function paintVeil() {
    const c = vx, bg = getComputedStyle(document.body).backgroundColor || 'rgb(12,26,21)', a0 = L.wide ? .62 : .6;
    c.clearRect(0, 0, W, H);
    for (let x = 0; x < W; x++) {
      const d = L.wide ? Math.min(x - L.cx0, L.cx1 - x) : 99; if (d < -8) continue;
      const k = L.wide ? Math.min(1, (d + 8) / 16) : 1; c.globalAlpha = a0 * k; c.fillStyle = bg; c.fillRect(x, 0, 1, H);
    }
    c.globalAlpha = 1;
  }
  function pine(c, x, base, h, col, colD) {
    for (let j = 0; j < h; j++) { const w = Math.max(1, Math.round((j / h) * h * .42 + ((j % 4) === 3 ? -1 : 0))); c.fillStyle = (j % 4 === 0) ? colD : col; c.fillRect(x - w + 2, base - h + j, w * 2, 1); }
    c.fillStyle = colD; c.fillRect(x + 1, base, 2, Math.max(1, Math.round(h / 10)));
  }
  function rock(c, x, y, s, t, R) {
    for (let j = -s; j <= 0; j++) { const w = Math.round(s * 1.3 * Math.sqrt(1 - (j * j) / (s * s))); c.fillStyle = j < -s * .55 ? t.rockL : j < -1 ? t.rock : t.rockD; c.fillRect(x - w, y + j, w * 2 + 1, 1); }
    c.fillStyle = t.grassD; for (let i = 0; i < s; i++) if (R() < .6) c.fillRect(x - s + Math.floor(R() * s * 2), y - s + Math.floor(R() * 2), 2, 1);
    c.fillRect(x - Math.round(s * 1.3) - 1, y, Math.round(s * 2.6) + 3, 2);
  }
  function mushroom(c, x, y, t) {
    const night = mood === 'night'; c.fillStyle = '#efe6d6'; c.fillRect(x, y - 2, 1, 2);
    c.fillStyle = night ? '#7affd0' : '#e6736a'; c.fillRect(x - 1, y - 3, 3, 1); c.fillRect(x, y - 4, 1, 1);
    if (night) { c.globalAlpha = .3; c.fillRect(x - 2, y - 4, 1, 1); c.fillRect(x + 2, y - 4, 1, 1); c.fillRect(x, y - 6, 1, 1); c.globalAlpha = 1; }
  }
  function vine(c, x, len, t, R) {
    let vx = x; const ph = R() * 6;
    for (let y = 0; y < len; y++) {
      vx = x + Math.round(Math.sin(y / 9 + ph) * 2); c.fillStyle = t.treeD; c.fillRect(vx, y, 1, 1);
      if (y % 4 === 0) { const s = (y / 4) % 2 ? 1 : -2; c.fillStyle = (y % 8) ? t.grass : t.tree; c.fillRect(vx + s, y, 2, 2); }
      if (y % 17 === 9 && R() < .7) { c.fillStyle = R() < .5 ? '#f6a9c0' : '#fff2c0'; c.fillRect(vx - 1, y, 1, 1); c.fillRect(vx + 1, y, 1, 1); c.fillRect(vx, y - 1, 1, 1); c.fillRect(vx, y + 1, 1, 1); c.fillStyle = '#f6d860'; c.fillRect(vx, y, 1, 1); }
    }
    c.fillStyle = t.grassL; c.fillRect(vx - 1, len, 3, 2);
  }
  function hut(c, x, base, t) {
    const w = 30, hW = 16;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 2, base, w + 6, 2);
    /* log walls */
    for (let j = 0; j < hW; j++) { c.fillStyle = j % 3 === 2 ? t.woodD : t.wood; c.fillRect(x, base - hW + j, w, 1); }
    c.fillStyle = t.woodD; c.fillRect(x - 1, base - hW, 2, hW); c.fillRect(x + w - 1, base - hW, 2, hW);
    /* roof with moss and a little chimney */
    c.fillStyle = t.woodD; c.fillRect(x + 21, base - hW - 16, 4, 10);
    for (let j = 0; j < 13; j++) { const ww = w + 6 - Math.round(j * 1.45); c.fillStyle = j % 3 === 0 ? t.roofD : t.roof; c.fillRect(x - 3 + Math.round(j * .72), base - hW - 1 - j, ww, 1); }
    c.fillStyle = t.grassL; for (let i = 0; i < w + 6; i += 3) c.fillRect(x - 3 + i, base - hW - 1, 2, 1);
    /* door, window, lantern */
    c.fillStyle = t.woodD; c.fillRect(x + 4, base - 10, 6, 10); c.fillStyle = '#f6d860'; c.fillRect(x + 8, base - 5, 1, 1);
    const lit = t.lit > 0; c.fillStyle = lit ? t.win : mix(t.win, t.wood, .3); c.fillRect(x + 16, base - 11, 7, 6);
    c.fillStyle = t.woodD; c.fillRect(x + 19, base - 11, 1, 6); c.fillRect(x + 16, base - 8, 7, 1);
    if (lit) { c.globalAlpha = .22 * t.lit; c.fillStyle = t.win; c.fillRect(x + 12, base - 15, 15, 14); c.fillRect(x + 14, base, 11, 4); c.globalAlpha = 1; }
    c.fillStyle = t.woodD; c.fillRect(x + 12, base - 9, 1, 3); c.fillStyle = lit ? '#ffd27a' : '#c9a35a'; c.fillRect(x + 11, base - 6, 3, 3);
    /* a path, a flower pot, a woodpile */
    c.fillStyle = mix(t.grass, '#d9c3a0', .45); for (let i = 0; i < 10; i++) c.fillRect(x + 5 + i, base + 1 + Math.floor(i / 3), 4, 1);
    c.fillStyle = '#c4703f'; c.fillRect(x + 25, base - 3, 3, 3); c.fillStyle = '#f6a9c0'; c.fillRect(x + 25, base - 5, 1, 1); c.fillRect(x + 27, base - 5, 1, 1); c.fillStyle = t.grassL; c.fillRect(x + 26, base - 4, 1, 1);
    c.fillStyle = t.woodD; for (let i = 0; i < 3; i++) c.fillRect(x - 6 + i * 2, base - 3 + (i % 2), 2, 3 - (i % 2));
  }

  /* ---------- the living layer ---------- */
  function draw() {
    if (!cx || !st) return;
    const c = cx, t = T, f = frame++;
    c.drawImage(st, 0, 0);
    /* twinkling stars */
    if (t.stars) for (let i = 0; i < L.stars.length; i += 7) { const s = L.stars[i]; if ((f + i) % 23 < 3) { c.fillStyle = '#ffffff'; c.fillRect(s[0] - 1, s[1], 3, 1); c.fillRect(s[0], s[1] - 1, 1, 3); } }
    /* clouds */
    /* clouds and birds keep to the sides on a wide screen (the page sits in the middle) */
    if (L.wide) { c.save(); c.beginPath(); c.rect(0, 0, L.cx0 - 2, H); c.rect(L.cx1 + 2, 0, W - L.cx1, H); c.clip(); }
    for (const k of L.clouds) { k.x += k.v; if (k.x > W + 20) k.x = -20; cloud(c, k.x, k.y, k.s, t); }
    /* the waterfall: stripes running down, foam, mist, and a little rainbow on bright mornings */
    const F = L.fall;
    c.fillStyle = t.water2; c.fillRect(F.x, F.top, F.w, F.bot - F.top);
    for (let x = 0; x < F.w; x++) { const o = ((f * 2 - x * 5) % 7 + 7) % 7; for (let y = F.top - 7 + o; y < F.bot; y += 7) { const y0 = Math.max(F.top, y), y1 = Math.min(F.bot, y + 4); if (y1 <= y0) continue; c.fillStyle = t.foam; c.fillRect(F.x + x, y0, 1, Math.min(2, y1 - y0)); if (y1 - y0 > 2) { c.fillStyle = t.water; c.fillRect(F.x + x, y0 + 2, 1, y1 - y0 - 2); } } }
    for (let i = 0; i < 6; i++) { const ox = Math.round(Math.sin(f / 3 + i) * (F.w / 2 + 2)), oy = (f + i * 3) % 4; c.fillStyle = t.foam; c.fillRect(F.x + F.w / 2 + ox, F.bot - oy, 2, 1); }
    if (mood === 'morning' || mood === 'day') { const RB = ['#ff9a9a', '#ffd28a', '#fff59a', '#a8f0a8', '#9ad8ff', '#c8a8ff']; c.globalAlpha = .35; for (let i = 0; i < RB.length; i++) { c.fillStyle = RB[i]; for (let a = 0; a < 18; a++) { const ang = Math.PI + a / 17 * Math.PI, rr = 12 - i; c.fillRect(Math.round(F.x + F.w / 2 + Math.cos(ang) * rr), Math.round(F.bot - 4 + Math.sin(ang) * rr * .7), 1, 1); } } c.globalAlpha = 1; }
    /* pond shimmer */
    const P = L.pond; c.fillStyle = t.foam; for (let i = 0; i < 4; i++) { const x = P.x - P.rx + 4 + ((f * 2 + i * 13) % (P.rx * 2 - 8)); if ((f + i) % 5 < 3) c.fillRect(x, P.y - 1 + (i % 3), 3, 1); }
    /* smoke from the chimney */
    const hx = L.hut.x + 22, hy = L.hut.y - 16 - 16; c.fillStyle = t.smoke;
    for (let i = 0; i < 5; i++) { const age = (f + i * 9) % 45, yy = hy - age * .6, xx = hx + Math.sin((age + i) / 6) * 2 + age * .12; c.globalAlpha = Math.max(0, .55 - age / 70); const s = 2 + Math.floor(age / 15); c.fillRect(Math.round(xx), Math.round(yy), s, s); }
    c.globalAlpha = 1;
    /* deer grazing: head down a while, then up to look around, tail flicking */
    const pal = { b: t.deer, d: t.deerD, w: '#f1e6d6', k: '#1e1a18', a: '#d9c3a0' };
    for (const d of L.deer) { const cyc = (f + d.ph) % 64, up = cyc > 46; grid(c, d.x, d.y, DEER[up ? 0 : 1], pal, d.flip); }
    /* birds crossing (not at night) */
    if (mood !== 'night') {
      if (L.birds.length < 3 && f % 40 === 0) { const R = Math.random; L.birds.push({ x: -6, y: 8 + R() * L.hz * .4, v: .7 + R() * .5, p: Math.floor(R() * 4) }); }
      for (const b of L.birds) { b.x += b.v; b.y += Math.sin((f + b.p) / 5) * .15; grid(c, b.x, b.y, BIRD[((f + b.p) >> 1) % 2], { k: t.bird }); }
      L.birds = L.birds.filter(b => b.x < W + 6);
    }
    if (L.wide) c.restore();
    /* butterflies near the hut by day */
    if (mood === 'morning' || mood === 'day') for (let i = 0; i < 3; i++) { const bx = L.hut.x + 36 + Math.sin((f + i * 20) / 11) * 14 + i * 9, by = L.hut.y - 8 + Math.cos((f + i * 7) / 7) * 5; c.fillStyle = ['#f6a9c0', '#fff2c0', '#b9a6f2'][i]; const o = (f + i) % 4 < 2 ? 1 : 0; c.fillRect(Math.round(bx) - 1, Math.round(by) - o, 1, 1 + o); c.fillRect(Math.round(bx) + 1, Math.round(by) - o, 1, 1 + o); }
    /* morning dew glints */
    if (t.dew) for (const d of L.dew) { if ((f + d[2]) % 40 < 2) { c.fillStyle = '#ffffff'; c.fillRect(d[0], d[1], 1, 1); c.globalAlpha = .6; c.fillRect(d[0] - 1, d[1], 3, 1); c.fillRect(d[0], d[1] - 1, 1, 3); c.globalAlpha = 1; } }
    /* magic: motes drifting up and twinkling, fireflies at night */
    while (L.motes.length < t.motes) L.motes.push({ x: Math.random() * W, y: L.hz + Math.random() * (H - L.hz), v: .08 + Math.random() * .2, p: Math.random() * 40, c: t.mote[Math.floor(Math.random() * t.mote.length)] });
    for (const m of L.motes) {
      m.y -= m.v; m.x += Math.sin((f + m.p) / 9) * .3; if (m.y < 4) { m.y = H - 2; m.x = Math.random() * W; }
      const tw = (f + m.p) % 30; if (tw > 24) continue;
      c.fillStyle = m.c; c.globalAlpha = .9; c.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      if (tw < 6) { c.globalAlpha = .45; c.fillRect(Math.round(m.x) - 1, Math.round(m.y), 3, 1); c.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 3); }
    }
    c.globalAlpha = 1;
    c.drawImage(vl, 0, 0);
  }
  function cloud(c, x, y, s, t) { c.fillStyle = t.cloudD; c.fillRect(Math.round(x - s), Math.round(y + 1), s * 3, 2); c.fillStyle = t.cloud; c.fillRect(Math.round(x - s + 1), Math.round(y), s * 3 - 2, 2); c.fillRect(Math.round(x), Math.round(y - 2), s, 2); c.fillRect(Math.round(x + s * .9), Math.round(y - 1), s, 1); }

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
  setInterval(() => { if (cv && !document.hidden && pickMood() !== mood) build(); }, 60000);   /* the mood changes with the hour */
  return { start, stop, sync: () => (on() ? (cv ? build() : start()) : stop()), mood: () => mood, set(v) { if (v) delete S.ui.scene; else S.ui.scene = false; persist(); this.sync(); }, on };
})();
