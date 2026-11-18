/* ---------- Shared kit for the extra painted realms, and Rune Wood ----------
   Rune Wood is a blue night forest by a stream. Two huge trunks carry glowing runes, the right one has a hollow that is lit from inside (the Rune Oak),
   a stone cabin is built on the left, and runekeepers (small blue fairies) carry water from the stream to the glowing plants. A wolf with a rune on its flank,
   a stag with glowing antlers and a moth made of light are the magic.
   NK.lib.ex holds what the other extra realms use: mk (a realm from a spec), quad/BE/antlers/owl (shaded animals), the palette maker and generic floors. */
(() => {
  const { mix, rnd, hsh, px, rect, disk, ell } = VG, F = NK.forest, P = NK2.PSY, WD = NK.lib.wd, SH = NK.lib.sh;
  const tint = (o, col, a) => typeof o === 'string' ? mix(o, col, a) : Array.isArray(o) ? o.map(v => tint(v, col, a)) : o;

  /* a palette per realm: a day set and a night set laid over the shared forest palette; morning and sunset are the day set warmed */
  const mkPal = (day, night) => mood => {
    const B = F.pal(mood);
    if (mood === 'night') return Object.assign({}, B, night, { isNight: true });
    const d = Object.assign({}, B, day);
    if (mood === 'day') return d;
    const col = mood === 'sunset' ? '#ff8a5a' : '#ffe6b0', a = mood === 'sunset' ? .3 : .12;
    for (const k of ['fog', 'farA', 'farB', 'farC', 'rimC', 'land', 'verge', 'dirt', 'moss', 'fern', 'bark', 'water', 'cap', 'stem', 'snow', 'pine']) if (day[k]) d[k] = tint(day[k], col, a);
    if (day.sky) d.sky = B.sky.map((c, i) => mix(c, day.sky[i], .3));
    return d;
  };
  const stars = (c, g, Q, H, n) => { if (!Q.isNight) return; c.save(); c.globalAlpha = .6; for (let i = 0; i < (n || 70); i++) F.R_(c, g.x0 + hsh(i, 3, 91) * (g.x1 - g.x0), g.y0 + hsh(i, 5, 92) * H * .34, .5, .5, i % 5 ? '#cfe4ff' : '#ffffff'); c.restore(); };

  /* ---- shaded animals from NK2.beast ---- */
  const BE = s => (c, n, f, T) => NK2.beast(c, n, f, typeof s === 'function' ? s(n, f, T) : s);
  const quadSpec = (K, o) => Object.assign({ K, rx: 9, ry: 5, leg: 4, head: { dx: 9, dy: -2, r: 4, ry: 3.5 }, ears: [{ dx: -1, dy: -4, w: 3, h: 4, tilt: -1 }, { dx: 2, dy: -4, w: 3, h: 4, tilt: 1 }], tail: { dx: 10, dy: -1, r: 3, ry: 2 }, snout: { dx: 4, dy: 1, w: 4, h: 3, K: K[3] }, legs: [-6, -3, 3, 6], belly: K[3] }, o), quad = (K, o) => BE(quadSpec(K, o));
  const ANT = [[2, -4], [2, -5], [3, -6], [3, -7], [4, -8], [1, -8], [0, -9], [4, -10], [-2, -4], [-2, -5], [-3, -6], [-3, -7], [-4, -8], [-1, -8], [-4, -10]];
  const antlers = (col, tip) => (c, x, y, d, f, by, hx, hy) => { for (const [ax, ay] of ANT) px(c, hx + ax, hy + ay, ay < -9 ? tip : col); };
  const neck = K => (c, x, y, d, f, by) => { for (let i = 0; i < 9; i++) rect(c, x + d * (7 + Math.round(i * .3)) - 1, by - 1 - i, 3, 1, i < 3 ? K[1] : K[2]); };
  const deer = (K, o) => quad(K, Object.assign({ rx: 9, ry: 5, leg: 9, head: { dx: 12, dy: -9, r: 3.5, ry: 3 }, tail: { dx: 9, dy: -2, r: 1.6 }, ears: [{ dx: -2, dy: -3, w: 3, h: 3, tilt: -1 }, { dx: 2, dy: -3, w: 3, h: 3, tilt: 1 }], snout: { dx: 3, dy: 1, w: 3, h: 2, K: K[3] }, back: neck(K), legs: [-6, -4, 4, 6] }, o));
  const owl = K => (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), blink = f % 70 < 3; rect(c, x - 8, y + 1, 18, 2, T.bark[1]); rect(c, x - 8, y + 1, 18, 1, T.bark[2]);
    for (const [dx, dy, w, h, col] of [[-3, -9, 7, 9, K[1]], [-3, -9, 2, 9, K[2]], [-2, -3, 5, 4, K[3]], [-3, -11, 2, 2, K[1]], [2, -11, 2, 2, K[0]], [-4, -7, 2, 6, K[0]], [4, -7, 2, 6, K[0]]]) rect(c, x + dx, y + dy, w, h, col);
    for (const ex of [-2, 1]) { rect(c, x + ex, y - 8, 3, 3, '#fff0a0'); if (!blink) px(c, x + ex + 1, y - 7, '#101018'); else rect(c, x + ex, y - 7, 3, 1, K[0]); } px(c, x, y - 5, '#f0a030'); if (T.lit > .4) { c.globalAlpha = .3; disk(c, x, y - 7, 6, '#fff0a0'); c.globalAlpha = 1; } };
  const bunny = K => BE((n, f, T) => Object.assign({}, SH.rabbit(n, f, T), { K, extra: null }));
  const hog = K => BE((n, f, T) => Object.assign({}, SH.hedgehog(n, f, T), { K, extra: null }));
  const catSpec = (K, o) => quadSpec(K, Object.assign({ rx: 6, ry: 4, leg: 3, head: { dx: 6, dy: -3, r: 3.5, ry: 3 }, ears: [{ dx: -1, dy: -4, w: 3, h: 4, tilt: -1 }, { dx: 2, dy: -4, w: 3, h: 4, tilt: 1 }], tail: null, snout: { dx: 3, dy: 1, w: 2, h: 2, K: K[3] }, legs: [-3, -1, 2, 4], back(c, x, y, d, f, by) { for (let j = 0; j < 10; j++) rect(c, x - d * (6 + (j < 4 ? j : 3)) - (d < 0 ? 1 : 0), by + 2 - (j > 3 ? j - 3 : 0) + Math.round(Math.sin(f / 14 + j * .3) * (j > 5 ? 1 : 0)), 2, 2, j % 3 ? K[1] : K[2]); } }, o)), cat = (K, o) => BE(catSpec(K, o));

  /* the lit hollow in a trunk: an arched door from dark rim to a glow */
  function hollowEmit(c, x, hy, top, bot, T, edge) {
    for (let j = -8; j <= 8; j++) { const w = j < -3 ? Math.round(2 + (j + 8) * .5) : 4; rect(c, x - w - 1, hy + j, w * 2 + 2, 1, edge || '#04101c'); }
    for (let j = -7; j <= 8; j++) { const w = j < -3 ? Math.round(1 + (j + 8) * .5) : 3; rect(c, x - w, hy + j, w * 2, 1, mix(top, bot, Math.max(0, (j + 7) / 15))); }
    rect(c, x - 1, hy - 4, 1, 3, '#ffffff'); rect(c, x - 4, hy + 9, 9, 1, T.stone[1]); px(c, x - 4, hy + 9, T.stone[3]);
  }
  const nestLantern = (top, bot, dark) => (c, n, f, T, i, lit) => { const x = Math.round(n.x), y = Math.round(n.y), sw = Math.round(Math.sin(f / 14 + i) * .7); for (let j = 0; j < 7; j++) px(c, x + sw, y - 15 + j, T.leaf[3]);
    for (let j = -5; j <= 6; j++) { const w = Math.round(5 * Math.sqrt(1 - Math.pow(j / 7, 2))); rect(c, x - w + sw, y + j - 5, w * 2, 1, '#06101c'); }
    for (let j = -4; j <= 5; j++) { const w = Math.round(4 * Math.sqrt(1 - Math.pow(j / 6.5, 2))); rect(c, x - w + sw, y + j - 5, w * 2, 1, lit ? mix(top, bot, (j + 4) / 9) : dark[j > 0 ? 0 : 1]); }
    rect(c, x - 1 + sw, y - 11, 3, 1, T.bark[1]); px(c, x - 1 + sw, y - 3, lit ? '#ffffff' : dark[2]); };
  const nestDoor = (c, n, f, T, i, lit) => { const x = Math.round(n.x), y = Math.round(n.y); disk(c, x, y - 2, 5, '#1a1208'); disk(c, x, y - 2, 4, '#5a4026'); disk(c, x, y - 2, 3, lit ? '#ffcf70' : '#120a06'); rect(c, x - 3, y - 2, 7, 1, '#1a1208'); if (lit) { px(c, x - 1, y - 4, '#ffffff'); px(c, x + 1, y - 3, '#fff0b0'); } else px(c, x - 2, y - 4, '#a88458'); rect(c, x - 3, y + 3, 7, 1, T.stone[1]); px(c, x - 3, y + 3, T.stone[3]); };
  const mote = (col, core) => (c, n, f, T, i) => { const x = Math.round(n.x), y = Math.round(n.y), b = Math.round(Math.sin(f / 4 + i)); c.globalAlpha = .35; disk(c, x, y + b, 4, col); c.globalAlpha = 1; disk(c, x, y + b, 2, col); disk(c, x, y + b, 1, core || '#ffffff'); px(c, x, y + b, '#ffffff'); for (let j = 1; j < 5; j++) { c.globalAlpha = .45 - j * .08; px(c, x - j - 1, y + b + Math.round(Math.sin(f / 4 + i + j)) + (j > 2 ? 1 : 0), col); } c.globalAlpha = 1; };
  const fgLeaves = (c, g2, T, L, H) => { const Rr = rnd(7), K = [T.leaf[0], T.leaf[1], T.leaf[1], T.leaf[2]];
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) NK.leaves(c, side < 0 ? g2.x0 + 4 + i * 5 : g2.x1 - 4 - i * 5, H - 6 + Math.floor(Rr() * 14) - i * 7, 10 + Math.floor(Rr() * 6), K, Rr);
    for (let i = 0; i < 8; i++) NK.leaves(c, L.x0 + Math.floor(Rr() * (L.x1 - L.x0)), H + 8 + Math.floor(Rr() * 6), 8 + Math.floor(Rr() * 5), K, Rr); };
  const shroomsAt = (L, lx, sw) => [{ x: lx + 26, y: sw - 12, r: 10, h: 22 }, { x: lx + 41, y: sw - 5, r: 6, h: 12 }, { x: lx + 9, y: sw - 9, r: 3.5, h: 6 }, { x: lx + 22, y: sw + 9, r: 7, h: 14 }, { x: lx + 37, y: sw + 11, r: 5.5, h: 11 }, { x: lx + 58, y: sw + 14, r: 8.5, h: 10 }, { x: lx + 4, y: sw + 5, r: 3.5, h: 6 }];

  /* two big trunks (the left one carries the cabin's side of the clearing, the right one is the Spirit), their roots, and the mushrooms at the foot */
  function twoTrunks(c, g, Q, L, H, o) {
    o = o || {}; const sw = L.sw, lx = L.lx, rx = L.spirit.x;
    F.trunk(c, g, Q, { x: lx, base: sw + 6, w0: 11, w1: 21, flare: 20, seed: o.seedL || 4, light: 1, lean: -2, sway: 2, moss: o.moss == null ? .08 : o.moss });
    F.root(c, Q, { x: lx + 12, y: sw - 1, dir: 1, len: 50, arch: 13, drop: 10, w: 6.5, seed: 3 }); F.root(c, Q, { x: lx + 8, y: sw + 13, dir: -1, len: 30, arch: 4, drop: 5, w: 4.5, seed: 6 });
    if (o.shrooms !== false) for (const m of L.shrooms.slice().sort((a, b) => a.y - b.y)) F.shroom(c, m.x, m.y, m.r, m.h, Q, Math.round(m.x * 7), m.r > 6);
    F.trunk(c, g, Q, { x: rx, base: sw + 6, w0: 13, w1: 22, flare: 14, seed: o.seedR || 8, light: -1, lean: 3, sway: 2, moss: o.moss == null ? .12 : o.moss });
    F.root(c, Q, { x: rx - 12, y: sw + 3, dir: -1, len: 52, arch: 9, drop: 10, w: 5.5, seed: 9 }); F.root(c, Q, { x: rx + 12, y: sw + 4, dir: 1, len: 44, arch: 8, drop: 7, w: 5.2, seed: 11 });
    if (o.beetles !== false) { const R = F.rnd(77); for (let i = 0; i < 4; i++) F.beetle(c, L.cx - 36 + R() * 88, sw + 12 + R() * (H - sw - 22), Q, R() < .5 ? -1 : 1); }
  }
  const nearGen = (c, g, Q, L, H) => {
    const wide = L.wide, lx = Math.max(g.x0 + 10, L.x0 - 24), rx = Math.min(g.x1 - 10, L.x1 + 34);
    F.root(c, Q, { x: g.x1 + 6, y: H - 14, dir: -1, len: wide ? 80 : 40, arch: 4, drop: 5, w: 5.5, seed: 21 });
    for (let i = 0; i < 7; i++) F.bigLeaf(c, Q, rx + (i - 3) * 5, H + 3, -Math.PI / 2 + (i - 3) * .32, 13 + (i % 3) * 3, 3.2 + (i % 2), 30 + i);
    for (let i = 0; i < 12; i++) F.frond(c, Q, lx + (i - 6) * 2.2, H + 4, -Math.PI / 2 + (i - 6) * .2, 22 + (i % 4) * 5, 50 + i);
    for (let i = 0; i < 5; i++) F.bigLeaf(c, Q, g.x0 + 4 + i * 4, H - 2 - i * 3, -.9 - i * .12, 12, 3, 70 + i);
    F.leaves(c, { x0: g.x0, x1: g.x1, H: g.H }, Q, L, 26, 33, H - 14);
  };
  const farRows = (Q, H, o) => [
    { k: .09, blur: .8, trees: Object.assign({ seed: 3, n: 12, depth: 2, base: Math.round(H * .5), jit: 4, h: 120, w: 2.8, col: Q.farA, tuft: Q.farA }, o.a), fog: [.25, .56, null, .55] },
    { k: .16, blur: .5, trees: Object.assign({ seed: 5, n: 8, depth: 2, base: Math.round(H * .56), jit: 5, h: 130, w: 4.2, col: Q.farB, tuft: Q.farB }, o.b), fog: [.4, .62, null, .5] },
    { k: .26, trees: Object.assign({ seed: 8, n: 5, depth: 3, base: Math.round(H * .6), jit: 5, h: 140, w: 6, col: Q.farC, rim: Q.rimC, tuft: Q.farC }, o.c), paint: (c, g2, Q2, L2, H2) => F.farGround(c, g2, Q2, H2), fog: [.5, .66, null, .45] },
  ];
  const lightPts = (f, g, L, o) => { const a = g.mood === 'night' ? .5 : g.mood === 'sunset' ? .3 : .12, out = []; for (const m of L.shrooms) out.push({ x: m.x, y: m.y - m.h * .7, r: m.r * 4.4, col: o.shroom || '#ff9a30', a: a * (.88 + .12 * Math.sin(f / 8 + m.x)) }); for (const s of (L.rspots || [])) out.push({ x: s.x, y: s.y, r: 24, col: o.rune, a: a * 1.2 }); out.push({ x: L.spirit.x, y: L.sw - 10, r: 38, col: o.heart, a: a * .9 }); return out; };

  /* ---- build a realm from a spec ---- */
  function mk(o) {
    const D = Object.assign({
      houseW: 38, hutW: 16, spiritH: .6, windowCol: '#ffd890', pulse: '#ffffff', waveCol: '#ffffff', wall: { clump: 'leaf', ramps: T => [T.leaf, T.leaf, T.leaf] },
      paintSky() { }, paintFar() { }, fg: fgLeaves, heart: L => L.heart, nestDraw: nestDoor,
      weather: { dir: 'up', cols: ['#e8ffff', '#a8f0ff', '#fff6c8'], glow: true, depths: [{ n: 10, size: 1, dur: 36, z: 1, seed: 4, op: .8 }, { n: 3, size: 1, dur: 24, z: 3, seed: 8, op: .7, blur: 1 }] },
    }, o.D);
    D.hutPaint = (c, x, base, T) => F.shed(c, x, base, T, o.S(T)); D.housePaint = (c, x, base, st, T) => F.cabin(c, x, base, st, T, o.S(T)); D.stageEmit = (c, g, T, L) => D.spiritPaint(c, L, T);
    F.compose(D, o.FS); NK.realm(D); return D;
  }
  NK.lib = Object.assign(NK.lib || {}, { ex: { tint, mkPal, stars, BE, quadSpec, catSpec, quad, antlers, neck, deer, owl, bunny, hog, cat, hollowEmit, nestLantern, nestDoor, mote, fgLeaves, shroomsAt, twoTrunks, nearGen, farRows, lightPts, mk } });

  /* ======================= Rune Wood ======================= */
  const RUNE = '#9af4ff', ECHO = '#0c3a6a';
  const SKY = { morning: ['#6aa4d8', '#a0c8e8', '#e4e8d0', '#fff2d0'], day: ['#5a9ee0', '#90c4ec', '#c4e0f0', '#e8f4f4'], sunset: ['#2a2a6a', '#7a4a8a', '#e88a70', '#ffc890'], night: ['#040a24', '#0a1c52', '#123a82', '#2060a8'] };
  const FOG = { morning: '#b8d4e8', day: '#a0c4e0', sunset: '#c890a0', night: '#0e2e66' };
  const RAMPS = Object.assign({}, WD.RAMPS, {
    moss: ['#041a24', '#0a3a48', '#16606a', '#46a498'], leaf: ['#031428', '#0a2c4c', '#154a70', '#4a9ac0'], bark: ['#0a0e22', '#1c2644', '#34466e', '#6c88b4'], water: ['#061e4a', '#0e4a8c', '#2a8ad0', '#b8f0ff'],
    stone: ['#242e48', '#4a5c84', '#8098c0', '#c8dcf4'], glow: ['#1a7ab0', '#3ab8e0', '#8ae8f8', '#e8ffff'], bloom: ['#3a2a8a', '#6a5ad0', '#a8a0f0', '#e0dcff'], petal: ['#4a3aa8', '#8a7af0', '#c0b8ff', '#ffffff'],
    cwall: ['#1a2236', '#2e3c5c', '#4a5c84', '#7890b8'], croof: ['#0c1e3c', '#1c4478', '#3a74b8', '#8ac0f0'], ctrim: ['#080e1c', '#2e2a58', '#5a50a0'],
  });
  const palR = mkPal({
    sky: SKY.day, glow: ['#fffbe8', '#cce8ff'], fog: FOG.day, farA: '#90b4d8', farB: '#6a94c0', farC: '#3a6a98', rimC: '#d0ecff', land: ['#2a5a6a', '#3a7a7c', '#58987c'], bark: ['#1c2030', '#34405c', '#586a8a', '#8498b4', '#aec0d8'], moss: ['#145a4a', '#2a8a6a', '#52b08a', '#8cd8a8', '#c8f4c8'],
    dirt: ['#2a2c3c', '#464a5e', '#686e82', '#8c92a4', '#b0b6c4'], verge: ['#124a4a', '#1e6a62', '#34907c', '#58b898'], fern: ['#0e4a44', '#1e7a68', '#38a88a', '#68d0a8', '#a8f0c8'], cap: ['#2a7aa8', '#4ab0d8', '#8ae0f4', '#d8faff'], water: ['#2a6ca8', '#58a8d4', '#a0dcf0', '#f0ffff'], leafO: ['#2a7a9a', '#4ab0d0', '#8ae0f0', '#d8faff'],
  }, {
    sky: SKY.night, glow: ['#bfe4ff', '#4a8ae0'], glowA: .95, fog: FOG.night, farA: '#1c4c8a', farB: '#12386e', farC: '#0a2452', rimC: '#4a8ae0', land: ['#040e2a', '#0a1e48', '#12306a'], bark: ['#080c1c', '#141c38', '#243258', '#3a4c7c', '#566ca0'], moss: ['#041a24', '#0a3040', '#14505a', '#2a7c78', '#52a898'],
    dirt: ['#080c1a', '#121a30', '#1e2a4a', '#304068', '#445a88'], verge: ['#04101e', '#0a2234', '#123c4a', '#1c5a5e'], fern: ['#041828', '#0a3040', '#145058', '#247c78', '#4aa89a'], cap: ['#1a6a9a', '#2aa8d8', '#6ad8f8', '#c8f8ff'], water: ['#061e4a', '#0e4a8c', '#2a8ad0', '#b8f0ff'], leafO: ['#0e6a9a', '#1ea0d0', '#4ad0f0', '#a8f0ff'], shroomA: .5,
  });
  const FS = {
    pal: palR, heartDy: 10, waterDy: 26,
    geom(L, sw) { L.shrooms = shroomsAt(L, L.lx, sw).slice(0, 6); const lx = L.lx, rx = L.spirit.x; L.rspots = [{ x: lx + 1, y: sw - 62 }, { x: lx - 2, y: sw - 36 }, { x: rx - 3, y: sw - 60 }, { x: rx + 4, y: sw - 36 }]; },
    skyExtra(c, g, Q, L, gx, gy) { stars(c, g, Q, g.H, 90); },
    far: (Q, L, H, gx) => farRows(Q, H, {}),
    floor(c, g, Q, L, H) {
      const sw = L.sw, top = sw - 8, lx = L.lx, rx = L.spirit.x, R = F.rnd(5);
      F.floor(c, g, Q, L, top); F.fogBand(c, g, Q.fog, top - 10, top + 8, 0, .5);
      for (let i = 0; i < 12; i++) F.mound(c, Q, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 11, top + 2 + (i % 2) * 2, 7 + (i * 7) % 6, 2.2, 40 + i);
      F.leaves(c, g, Q, L, 50, 17, top + 3);
      /* the stream across the front of the clearing, with the light of the runes on it */
      F.stream(c, g, Q, L.water.y - 3, 7, 5);
      for (let i = 0; i < 8; i++) F.mound(c, Q, g.x0 + 6 + i * (g.x1 - g.x0 - 12) / 7, L.water.y + 5 + (i % 2), 3 + (i % 3), 1.2, 90 + i);
      F.plot(c, Q, L);
      twoTrunks(c, g, Q, L, H, { moss: .05 });
      F.runes(c, lx, 6, sw - 26, RUNE, ECHO, 3, 7); F.runes(c, rx, 6, sw - 30, RUNE, ECHO, 8, 8);
    },
    near: nearGen,
    lights: (f, g, L) => { const o = lightPts(f, g, L, { shroom: '#5ad0ff', rune: '#5ac8ff', heart: '#8ae8f8' }), a = g.mood === 'night' ? .4 : .1; o.push({ x: g.W * .62, y: L.water.y, r: 60, col: '#5ab0ff', a }); return o; },
  };
  const wolfK = ['#0a1430', '#243a66', '#4a6ea8', '#c8dcff'], stagK = ['#1c1838', '#443a78', '#7a6cb8', '#d0c8f4'], owlK = ['#1c2646', '#46567e', '#7a8cb4', '#d8e4f4'], hareK = ['#3a4660', '#8a98b4', '#c4d0e4', '#f4f8ff'];
  const runeMark = (c, x, y, d, f, by) => { const a = .6 + .4 * Math.sin(f / 18); c.globalAlpha = a; for (const [dx, dy] of [[0, -2], [0, -1], [0, 0], [1, 0], [-1, -2], [-1, 1]]) px(c, x + dx - 1, by + dy, RUNE); c.globalAlpha = 1; };
  const dressR = [['#1a3a8a', '#3a78d8', '#8ac0ff'], ['#3a2a8a', '#6a5ad0', '#b0a0ff'], ['#0a5a7a', '#1aa0c0', '#8af0f8'], ['#4a4a8a', '#8a8ad0', '#d0d0ff']];
  mk({
    FS, S: T => ({ wall: T.cwall, roof: T.croof, trim: T.ctrim, stone: T.stone, shingle: true, chimney: true, glow: '#9af4ff', door: '#1a2a5a', flowers: ['#9af4ff', '#b0a0ff'] }),
    D: {
      id: 'rune', houseName: 'Your stone cabin', hutName: 'The rune cache', spiritH: .6, windowCol: '#8ae8ff', pulse: '#8ae8ff', waveCol: '#8ae8ff',
      sky: SKY, fog: FOG, ramps: RAMPS, bubble: { bg: '#eef6ff', edge: '#0c2a5a', ink: ['#2a78d8', '#8a5ad0', '#1aa0c0', '#d05a98'] },
      pal(T, mood, MC) { T.dress = dressR.map(r => r.map(h => MC(h, mood))); T.orange = ['#0a6a9a', '#1ea0d0', '#5ad0f0', '#c8f8ff']; T.cloth = SH.CLOTH.map(r => r.map(h => MC(h, mood))); return T; },
      spiritPaint: (c, L, T) => hollowEmit(c, L.spirit.x, L.sw - 10, '#e8ffff', '#4ab8f0', T, '#04101c'),
      spirit: { name: 'The Rune Oak', snd: 'hum', sndK: 2, say: ['leaf', 'star', 'heart', 'moon'], hw: 30, hh: 70, glow: T => ({ col: '#8ae8ff', r: 44, a: T.mood === 'night' ? .16 : .06, dy: 14 }),
        draw(c, n, f, T, L) { const x = L.spirit.x, y = L.sw - 10; P.mandala(c, x, y - 1, 5, f, { step: 1, petals: 6, speed: 80, wave: .6, spin: 2 }); if (n.fl > .1) for (let i = 0; i < 6; i++) { const a = f / 5 + i * 1.05; px(c, x + Math.cos(a) * (14 + i * 3), y + Math.sin(a * 1.3) * 14, P.col(i / 6 + f / 60, .9, .8)); } } },
      nests: [{ dx: -26, yf: .62, name: 'Rune lantern' }, { dx: 2, yf: .5, name: 'Rune lantern' }, { dx: 26, yf: .58, name: 'Rune lantern' }],
      nestDraw: nestLantern('#e8ffff', '#4ab8f0', ['#3a2a8a', '#6a5ad0', '#a8a0f0']),
      plants: [
        { k: 'glowcap', name: 'Glowcap mushrooms', p: .15, row: 10, snd: 'chime', sndK: 4, crop: true, draw: WD.PD.glowcap }, { k: 'bluebell', name: 'Bluebells', p: .5, row: 10, snd: 'chime', sndK: 2, crop: true, draw: WD.PD.bluebell }, { k: 'moonflower', name: 'Moonflower', p: .85, row: 10, snd: 'chime', sndK: 6, crop: true, draw: WD.PD.moonflower },
        { k: 'toadstool', name: 'Toadstools', u: .08, row: 20, snd: 'knock', draw: WD.PD.toadstool }, { k: 'foxglove', name: 'Foxglove', u: .05, row: 24, snd: 'chime', sndK: 3, draw: WD.PD.foxglove }, { k: 'fern', name: 'Fern', u: .2, row: 6, draw: WD.PD.fern }, { k: 'lily', name: 'Lily of the valley', u: .27, row: 22, snd: 'chime', sndK: 5, draw: WD.PD.lily },
        { k: 'bramble', name: 'Bramble', u: .31, row: 9, draw: WD.PD.bramble }, { k: 'primrose', name: 'Primroses', u: .44, row: 24, snd: 'chime', sndK: 1, draw: WD.PD.primrose }, { k: 'vine', name: 'Hanging vine', u: .78, row: 8, draw: WD.PD.vine }, { k: 'clover', name: 'Clover', u: .62, row: 26, draw: WD.PD.clover },
      ],
      animals: [
        { id: 'wolf', name: 'Rune wolf', mode: 'walk', u: .22, row: 15, range: 18, spd: .8, hw: 11, hh: 10, magic: true, say: ['moon', 'star', 'heart'], snd: 'yip', glow: T => ({ col: '#8ae8ff', r: 14, a: T.lit * .3 + .08, dy: 6 }), draw: quad(wolfK, { extra: runeMark }) },
        { id: 'stag', name: 'Rune stag', mode: 'walk', u: .7, row: 14, range: 14, spd: .8, hw: 12, hh: 16, magic: true, say: ['star', 'heart', 'moon', 'leaf'], snd: 'chime', sndK: 7, glow: T => ({ col: '#8ae8ff', r: 16, a: T.lit * .3 + .1, dy: 10 }), draw: deer(stagK, { extra: antlers('#9af4ff', '#ffffff') }) },
        { id: 'hare', name: 'Hare', mode: 'hop', u: .09, row: 11, hw: 6, hh: 8, say: ['leaf', 'heart', 'drop'], snd: 'squeak', draw: bunny(hareK) }, { id: 'owl', name: 'Owl', mode: 'still', u: .78, dy: -34, hw: 8, hh: 11, say: ['moon', 'star', 'heart'], snd: 'hoot', air: true, draw: owl(owlK) },
        { id: 'toad', name: 'Toad', mode: 'hop', u: .55, row: 30, hw: 6, hh: 7, say: ['drop', 'leaf', 'note'], snd: 'ribbit', draw: SH.toad }, { id: 'snail', name: 'Prism snail', mode: 'crawl', u: .27, row: 31, range: 8, hw: 6, hh: 6, say: ['leaf', 'drop', 'moon'], snd: 'bloop', magic: true, draw: SH.snail },
        { id: 'moth', name: 'Light moth', mode: 'hover', u: .5, dy: -44, magic: true, air: true, hw: 6, hh: 5, hover: { dy: -44, rx: 40, ry: 14, sx: 36, sy: 21, jy: 1 }, say: ['star', 'moon', 'heart'], snd: 'flutter', glow: T => ({ col: '#a8f0ff', r: 14, a: T.lit * .35 + .1, dy: 2 }), draw: WD.A.moth },
        { id: 'fly0', name: 'Firefly', mode: 'hover', u: .3, dy: -16, air: true, hw: 4, hh: 4, hover: { dy: -16, rx: 28, ry: 10, sx: 17, sy: 11 }, say: ['star', 'sun'], snd: 'chime', sndK: 5, glow: T => ({ col: '#a8f0ff', r: 9, a: T.lit * .5 + .08, dy: 0 }), draw: WD.A.fly },
      ],
      folk: [
        { id: 'dewer', name: 'Water keeper', rank: 2, cloth: 1, draw: WD.fairy, u: .5, glow: WD.FSTYLE.glow, tasks: [{ to: 'water', act: 'carry', take: 'dew', t: 5 }, { to: { crop: 0 }, act: 'tend', t: 8, say: 'drop' }, { to: 'water', act: 'carry', take: 'dew', t: 5 }, { to: { crop: 1 }, act: 'tend', t: 8 }, { to: 'water', act: 'carry', take: 'dew', t: 5 }, { to: { crop: 2 }, act: 'tend', t: 8, say: 'drop' }] },
        { id: 'lighter', name: 'Lantern keeper', rank: 3, cloth: 2, draw: WD.fairy, u: .55, glow: WD.FSTYLE.glow, tasks: [{ to: { crop: 1 }, act: 'tend', t: 8, say: 'star' }, { to: { nest: 1 }, act: 'look', t: 10, say: 'moon' }, { to: { u: .45 }, act: 'carry', take: 'lantern', t: 4 }, { to: 'store', act: 'give', t: 5 }, { to: 'store', act: 'enter', t: 16 }] },
        { id: 'elder', name: 'Old rune keeper', rank: 5, cloth: 3, draw: WD.fairy, u: .84, lane: 1, elder: true, glow: WD.FSTYLE.glow, tasks: [{ to: { u: .8 }, act: 'sit', t: 40 }, { to: { u: .8 }, act: 'talk', t: 10, say: 'leaf', reply: 'heart' }, { to: 'spirit', act: 'tend', t: 12, say: 'star' }] },
      ],
      sprites: { n: 2, name: 'Rune wisp', col: '#8ae8ff', r: 12, a: .22, draw: WD.wisp, say: ['leaf', 'drop', 'star', 'heart', 'moon'] },
    },
  });
})();
