/* ---------- Crystal Deep Woods: a ruined chamber under the old forest ----------
   An old stone hall has sunk into the roots of a forest that never sees the sun. Moss and ivy hold up what is left of the arches; crystal grows out of every crack
   and lights the room from inside. A tall crystal, the Singing Spire, runs from the floor into the ceiling and splits its own light into slow rainbows across the walls.
   The Pale Ones live here: tall, white, weightless people who float a little above the floor, tend the crystal blooms, carry shards to the reliquary and sit by the
   Spire to listen. A stag with crystal antlers, a salamander that glows, bats, a spider on a line of light, a beetle and a slug all live off the glow-ferns and moss.
   The psychedelic part: crystal blooms turn through every colour, the Spire throws moving rainbows, and the runes on the pillars are mandalas. */
(() => {
  const { mix, rnd, hsh, px, rect, disk, ell, vgrad, hazeBottom, haze, crown } = VG, P = NK2.PSY;
  const SKY = { morning: ['#2e6a70', '#58a09a', '#98c8a8', '#d8ecc0'], day: ['#1e5a6a', '#3e8a90', '#7cb8a8', '#c0e0b8'], sunset: ['#1a1a4a', '#5a3a6a', '#b0605a', '#e8a868'], night: ['#02060e', '#061424', '#0c2438', '#143448'] };
  const FOG = { morning: '#7cb0a4', day: '#5a9a94', sunset: '#8a5a70', night: '#0a1c2c' };
  const RAMPS = {
    relic: ['#2a3a36', '#4a625a', '#7a9488', '#b4ccc0'], cry: ['#0e5a6a', '#2ab0c4', '#82ecf0', '#e8ffff'], cry2: ['#2a2a7a', '#5a52c8', '#a094f0', '#ece8ff'], cry3: ['#7a5a0e', '#d0a020', '#f4d860', '#fff8d0'],
    moss: ['#0e3a28', '#1c6a40', '#3a9a56', '#78d078'], fern: ['#082a22', '#124a3a', '#1f7a56', '#58c08a'], soil: ['#10201c', '#1c342c', '#2c4e40', '#3e6a58'], water: ['#082a4a', '#14507a', '#2a86a8', '#80e0e8'], bark: ['#10100e', '#2a241e', '#4a3e30', '#78644c'], wood: ['#2a2a26', '#4a4a40', '#76766a', '#a8a898'], stone: ['#2a3a36', '#4a625a', '#7a9488', '#b4ccc0'],
    wall: ['#1a3830', '#244a3c', '#32604c', '#427a5e', '#589a74'], floor: ['#123228', '#1a4636', '#265c46', '#327458', '#439070'], ring: ['#020806', '#050f0b', '#0a1913', '#142a21'], ghost: ['#7aa8b8', '#b8dce8', '#e8f8ff', '#ffffff'], leaf: ['#082a22', '#124a3a', '#1f7a56', '#58c08a'], thatch: ['#7a5a0e', '#d0a020', '#f4d860', '#fff8d0'], grass: ['#0e3a28', '#1c6a40', '#3a9a56', '#78d078'], hedge: ['#082a22', '#124a3a', '#1f7a56', '#58c08a'],
  };
  const FOLKC = [['#4a8aa8', '#a8e0f0'], ['#6a5ac0', '#c8b8ff'], ['#c0a030', '#fff0a0'], ['#4aa890', '#a8f0d8']];

  function sky(c, g, T, L) {
    const R = rnd(5), hz = L.hz; vgrad(c, g.x0, g.x1, g.y0, g.y1, [T.sky[0], T.sky[1], T.sky[2], T.sky[3]]);
    for (let i = 0; i < 70; i++) px(c, g.x0 + Math.floor(R() * (g.x1 - g.x0)), g.y0 + Math.floor(R() * hz), R() > .85 ? '#ffffff' : '#7ab8c8');
    disk(c, L.cx - 6, 34, 8, '#e8fff4'); disk(c, L.cx - 3, 32, 7, T.sky[1]);
    if (T.mood === 'night') P.ribbons(c, 0, g.x0, g.x1, 22, 6, 3, { a: .3, gap: 7, len: 30, th: 3, l: .55 });
  }
  function far(c, g, T, L) {
    const R = rnd(3), fog = T.fog, base = L.hz + 24, z = .5;
    for (let x = g.x0; x < g.x1; x++) { const ry = base - Math.round(9 * (Math.sin(x / 26 + .6) * .5 + Math.sin(x / 11 + 2) * .25 + .6)); for (let y = ry; y < g.y1; y++) { c.fillStyle = haze(y - ry < 1 ? T.moss[2] : T.moss[0], fog, z); c.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < 18; i++) { const x = g.x0 + 4 + i * ((g.x1 - g.x0 - 8) / 18) + Math.floor(R() * 5), w = 2 + Math.floor(R() * 3), top = 8 + Math.floor(R() * 44); for (let y = top; y < base + 6; y++) rect(c, x, y, w, 1, haze(T.bark[1 + (y % 9 < 1 ? 1 : 0)], fog, z)); for (let k = 0; k < 4; k++) disk(c, x + w / 2 + (k - 1.5) * 4, top + 2 + (k & 1) * 3, 3, haze(T.fern[1], fog, z)); }
    for (let i = 0; i < 6; i++) { const x = g.x0 + 10 + Math.floor(R() * (g.x1 - g.x0 - 20)), h = 10 + Math.floor(R() * 14); P.crystal(c, x, base + 4, 5, h, (R() - .5) * .3, [haze(T.cry[0], fog, .25), haze(T.cry[1], fog, .25), haze(T.cry[2], fog, .25), '#ffffff']); }
    hazeBottom(c, g.x0, g.x1, L.hz - 6, L.hz + 36, fog, 0, .8);
  }

  /* ---- the crystal house: shards grow stage by stage around a stone arch ---- */
  const SHARDS = [[-3, 5, 9, .1, 0], [-24, 6, 12, -.3, 1], [23, 6, 14, .3, 1], [-17, 9, 22, -.15, 2], [17, 10, 26, .12, 2], [-9, 11, 30, -.05, 4], [9, 11, 33, .06, 4], [0, 10, 42, 0, 5]];
  function home(c, x, base, st, T, L) {
    const cx = x + 20, S = T.stone; NK.shadow(c, cx, base, 26, .32);
    if (st === 0) { for (const sx of [x + 3, x + 37]) { rect(c, sx, base - 8, 1, 8, S[1]); px(c, sx, base - 9, T.cry[2]); } for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; rect(c, cx + Math.cos(a) * 12, base - 2 + Math.sin(a) * 2, 2, 1, S[2]); } P.crystal(c, cx, base, 5, 9, .1, T.cry); return; }
    for (let i = 0; i < 40; i += 5) { rect(c, x + i, base - 4, 5, 4, i % 10 ? S[1] : S[2]); px(c, x + i, base - 4, S[3]); rect(c, x + i, base - 1, 5, 1, S[0]); }
    const Ks = [T.cry, T.cry2, T.cry];
    for (let i = 0; i < SHARDS.length; i++) { const [dx, w, h, t, s0] = SHARDS[i]; if (st >= s0 + (s0 === 0 ? 1 : 0) && !(s0 === 0)) P.crystal(c, cx + dx, base - 3, w, h, t, Ks[i % 3]); else if (s0 === 0 && st < 3) P.crystal(c, cx + dx, base - 3, w, h, t, T.cry); }
    if (st >= 3) {
      const aw = 7, ah = 20; rect(c, cx - aw - 2, base - ah - 2, aw * 2 + 4, ah + 2, S[0]); for (let j = 0; j < ah; j++) { const w = j > ah - 7 ? Math.round(aw * Math.sqrt(1 - Math.pow((j - (ah - 7)) / 7, 2))) : aw; rect(c, cx - w, base - 3 - j, w * 2, 1, st >= 6 ? '#ffe0a0' : '#0a1410'); }
      rect(c, cx - aw - 2, base - 3, 2, 2, S[2]); rect(c, cx - aw - 2, base - ah - 2, 2, ah, S[1]); px(c, cx - aw - 2, base - ah - 2, S[3]);
      if (st >= 6) { rect(c, cx - 2, base - 12, 4, 9, '#fff4d0'); px(c, cx - 1, base - 11, '#ffffff'); }
    }
    if (st >= 7) { for (const dx of [-16, 16]) { rect(c, cx + dx, base - 33, 1, 5, T.wood[1]); P.crystal(c, cx + dx, base - 28, 3, 5, 0, T.cry3); } rect(c, cx - 3, base - 25, 7, 1, T.cry[3]); px(c, cx, base - 24, T.cry[2]); }
  }
  function reliquary(c, x, base, T) {
    const S = T.stone, w = 18, h = 18; NK.shadow(c, x + w / 2, base, 11, .3);
    for (let yy = 4; yy < h; yy++) { const hw = Math.round(w / 2 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, yy - h * .45) / (h * .55), 2)))); rect(c, x + w / 2 - hw - 1, base - yy, hw * 2 + 2, 1, S[1]); }
    for (let yy = 4; yy < h - 1; yy++) { const hw = Math.round((w / 2 - 1) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, yy - h * .45) / (h * .55), 2)))); rect(c, x + w / 2 - hw, base - yy, hw * 2, 1, '#0a1410'); }
    rect(c, x + 3, base - 7, w - 5, 1, S[2]); for (let i = 0; i < 3; i++) { disk(c, x + 5 + i * 4, base - 10, 1, [T.cry[2], T.cry2[2], T.cry3[2]][i]); px(c, x + 5 + i * 4, base - 11, '#ffffff'); }
    rect(c, x + 1, base - 3, w - 1, 3, S[2]); px(c, x + 1, base - 3, S[3]); rect(c, x + 1, base - 1, w - 1, 1, S[0]);
  }
  function spire(c, L, T) {
    const x = L.spirit.x, base = L.sw + 2, h = L.sw + 6; NK.shadow(c, x, base, 24, .32);
    for (const [dx, w, hh, t] of [[-20, 6, 26, -.35], [23, 7, 32, .3], [-12, 9, 44, -.2], [14, 10, 54, .14]]) P.crystal(c, x + dx, base, w, hh, t, RAMPS.cry2);
    P.crystal(c, x, base, 18, h, 0, RAMPS.cry);
    for (let k = 0; k < 5; k++) { const yy = base - 14 - k * 18; rect(c, x - 8, yy, 17, 1, T.cry[3]); }
  }
  function spireEmit(c, L, T) { const x = L.spirit.x; rect(c, x - 1, L.sw - 40, 2, 38, '#ffffff'); rect(c, x - 2, L.sw - 36, 1, 30, RAMPS.cry[3]); rect(c, x + 1, L.sw - 36, 1, 30, RAMPS.cry[2]); }

  /* ---- plants ---- */
  const sw_ = (n, f, a) => ECO.sway(n.x, f, a == null ? 1 : a) + n.kick * 1.5;
  const PL = {
    fern: (c, n, f, T) => { const s = sw_(n, f, .5) * .5, e = n.en || 0; for (const [dx, h, d] of [[-6, 12, -1], [0, 17, 1], [6, 10, -1]]) { let cx = n.x + dx, cy = n.y; for (let j = 0; j < h; j++) { px(c, cx, cy, j > h - 4 ? T.cry[2] : T.fern[3]); if (j > 3 && j % 3 === 0) { px(c, cx - 1, cy, T.fern[2]); px(c, cx + 1, cy, T.fern[2]); } cy -= 1; cx += Math.round(Math.sin(j / h * 3) * .6 * d + s * j / h * .3); } for (let t = 0; t < 12; t++) { const a = t * .7 + 3.4, r = 3 - t * .2; px(c, cx + Math.cos(a) * r * d, cy + Math.sin(a) * r, t > 7 ? '#d8ffff' : T.cry[2]); } } if (e > .3) px(c, n.x, n.y - 22, '#ffffff'); },
    bloom: (c, n, f, T) => { const s = sw_(n, f, .6) * .5, e = n.en || 0, h = 10 + Math.round(e * 3), t = n.seed * .17 + f / 170, K = [P.hsl(P.hue(t), .85, .22), P.hsl(P.hue(t), .85, .45), P.hsl(P.hue(t), .85, .68), P.hsl(P.hue(t), .6, .92)]; for (let j = 0; j < h; j++) px(c, n.x + Math.round(s * j / h), n.y - j, T.fern[2]); const hx = n.x + Math.round(s), hy = n.y - h; for (const [dx, hh, tl] of [[-4, 6, -.5], [4, 6, .5], [-2, 8, -.2], [2, 8, .2], [0, 9, 0]]) P.crystal(c, hx + dx, hy + 2, 3, hh + Math.round(e * 2), tl, K); },
    reed: (c, n, f, T) => { const s = sw_(n, f, .8), e = n.en || 0; for (let k = -3; k <= 3; k++) { const h = 13 + (k & 1) * 6 + Math.round(e * 3); for (let j = 0; j < h; j++) px(c, n.x + k * 2 + Math.round(s * j / h), n.y - j, j > h - 3 ? '#e8ffff' : T.ghost[1]); disk(c, n.x + k * 2 + Math.round(s), n.y - h, 1, P.col(k * .08 + f / 160, .9, .75)); } },
    bell: (c, n, f, T) => { const e = n.en || 0; for (const [dx, h, r, s2] of [[-6, 5, 3, 1], [1, 8, 4, 2], [8, 5, 3, 3]]) P.shroom(c, n.x + dx, n.y, h + Math.round(e * 2), r, f * .6, n.seed + s2, { speed: 300 }); },
    orchid: (c, n, f, T) => { const s = sw_(n, f, .5), e = n.en || 0; for (let k = -2; k <= 2; k++) { const h = 7 + (k & 1) * 4 + Math.round(e * 2), bx = n.x + k * 3 + Math.round(s * .5); for (let j = 0; j < h; j++) px(c, n.x + k * 3 + Math.round(s * .5 * j / h), n.y - j, T.fern[2]); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(c, bx + dx, n.y - h + dy, '#f0ffff'); px(c, bx, n.y - h, '#7ae8ff'); } },
    thorn: (c, n, f, T) => { const e = n.en || 0; for (let j = 0; j < 22; j++) { const x = n.x + Math.round(Math.sin(j / 3) * 3); px(c, x, n.y - j, T.bark[2]); if (j % 4 === 1) { px(c, x - 1, n.y - j, T.bark[1]); px(c, x + 2, n.y - j - 1, T.bark[1]); } if (j % 6 === 5) { disk(c, x, n.y - j - 1, 1, P.col(j * .05 + f / 120, .9, .65)); px(c, x, n.y - j - 2, '#ffffff'); } } },
    moss: (c, n, f, T) => { for (let k = -4; k <= 4; k++) { const bx = n.x + k * 2, a = .5 + .5 * Math.sin(f / 30 + k); ell(c, bx, n.y - 1, 3, 1, T.moss[2]); c.globalAlpha = .5 + a * .5; px(c, bx - 1, n.y - 2, T.moss[3]); px(c, bx + 1, n.y - 2, '#e8ffd0'); c.globalAlpha = 1; } },
    pod: (c, n, f, T) => { const e = n.en || 0; for (const [dx, r] of [[-5, 3], [3, 4], [9, 2]]) { const rr = r + (e > .3 ? 1 : 0); ell(c, n.x + dx, n.y - rr, rr, rr, T.fern[1]); ell(c, n.x + dx - 1, n.y - rr - 1, rr - 1, rr - 1, T.fern[3]); px(c, n.x + dx - 1, n.y - rr - 2, '#e8ffd0'); if (e > .3 || (f + dx * 9) % 90 < 12) for (let i = 0; i < 4; i++) px(c, n.x + dx + (i - 1.5) * 2, n.y - rr * 2 - 2 - ((f + i * 5) % 8), '#d8ffa0'); } },
    ivy: (c, n, f, T) => { const e = n.en || 0; rect(c, n.x - 2, n.y - 18, 5, 18, T.relic[1]); rect(c, n.x - 2, n.y - 18, 1, 18, T.relic[3]); rect(c, n.x - 3, n.y - 19, 7, 2, T.relic[2]); for (let j = 0; j < 17; j++) { const x = n.x + Math.round(Math.sin(j / 2.5) * 2.5); px(c, x, n.y - j, T.moss[2]); if (j % 3 === 0) { px(c, x - 1, n.y - j, T.moss[3]); px(c, x + 1, n.y - j - 1, T.moss[1]); } if (j % 6 === 4 && e > .1) px(c, x, n.y - j, '#d8ffa0'); } },
  };
  const PN = { fern: 'Glow ferns', bloom: 'Crystal blooms', reed: 'Glass reeds', bell: 'Bellcap mushrooms', orchid: 'Ghost orchids', thorn: 'Lantern thorn', moss: 'Moonmoss', pod: 'Spore pods', ivy: 'Relic ivy' };
  const PD = (k, o) => Object.assign({ k, name: PN[k], draw: PL[k], snd: 'rustle' }, o);

  /* ---- the Pale Ones: tall, white, weightless ---- */
  function pale(c, n, f, T) {
    const x = Math.round(n.x), d = n.dir, fl = Math.round(Math.sin(f / 9 + n.x * .1) * 1.5) - 5, y = Math.round(n.y) + fl, tend = n.pose === 'tend' ? 3 : 0, K = T.ghost, ac = FOLKC[(n.cloth || 0) % 4];
    c.globalAlpha = .22; NK.shadow(c, x, n.y, 4, .6); c.globalAlpha = 1;
    for (let j = 0; j < 10; j++) { const w = 1 + Math.round(j * .38), sx = Math.round(Math.sin(f / 6 + j * .6) * (j > 6 ? 1.5 : 0)) + (n.mvk ? -d * Math.round(j * .2) : 0); rect(c, x - w + 1 + sx, y - 10 + j + 0, w * 2 - 1, 1, j < 3 ? K[3] : j < 7 ? K[2] : K[1]); px(c, x - w + sx, y - 10 + j, ac[0]); px(c, x + w + sx, y - 10 + j, ac[0]); }
    for (let j = 0; j < 6; j++) { c.globalAlpha = .6 - j * .09; px(c, x + Math.round(Math.sin(f / 5 + j) * 2) - d * j, y + j, K[2]); c.globalAlpha = 1; }
    const hx = x + d * tend, hy = y - 17 + tend; rect(c, x - 1, y - 17 + tend, 3, 8 - tend, K[2]);
    disk(c, hx, hy, 3, '#2a5a6a'); disk(c, hx, hy, 2, K[3]); px(c, hx - 1, hy - 1, '#ffffff'); px(c, hx + d, hy, '#20e0ff'); px(c, hx + d * 2, hy, '#20e0ff'); px(c, hx - d, hy, '#20e0ff');
    for (let k = 0; k < 4; k++) { const a = f / 12 + k * 1.57; px(c, hx + Math.cos(a) * 5, hy - 5 + Math.sin(a) * 1.2, ac[1]); }
    const hand = n.pose === 'tend' ? [d * 5, y - 4] : n.pose === 'give' ? [d * 5, y - 10] : n.pose === 'talk' ? [d * 5, y - 13 + (f % 4 < 2 ? 1 : 0)] : [d * 4, y - 8 + Math.round(Math.sin(f / 8))];
    for (let k = 1; k <= 4; k++) px(c, x + Math.round(hand[0] * k / 4), Math.round(y - 12 + (hand[1] - (y - 12)) * k / 4), K[2]); px(c, x + hand[0], hand[1], K[3]);
    if (n.carry) P.crystal(c, x + hand[0] + d * 1, hand[1] + 1, 3, 6, 0, n.carry === 'shard' ? T.cry : T.cry3);
    if (n.elder) for (let k = 0; k < 4; k++) px(c, hx - 2 + k, hy - 4, ac[1]);
  }

  /* ---- animals ---- */
  const A = {
    stag: (c, n, f, T) => { const d = n.dd || 1, x = Math.round(n.x), y = Math.round(n.y), step = n.gz > 4 && ((f >> 1) & 1); const K = ['#2a3a3a', '#6a8a84', '#a8c8bc', '#e0f0e8'];
      NK2.beast(c, n, f, { K, rx: 8, ry: 4, leg: 6, head: { dx: 9, dy: -5, r: 3 }, ears: [{ dx: -2, dy: -3, w: 2, h: 3, tilt: -1 }], tail: { dx: 8, dy: -1, r: 1, K }, snout: { dx: 3, dy: 1, w: 3, h: 2, K: K[2] }, mv: n.gz > 4, extra: (c2, x2, y2, dd, f2, by, hx, hy) => { for (const [dx, h, t] of [[-1, 9, -.3], [2, 11, .35]]) P.crystal(c2, hx + dd * dx, hy - 3, 3, h, t * dd, [T.cry[0], T.cry[1], T.cry[2], T.cry[3]]); for (let i = 0; i < 3; i++) px(c2, x2 - dd * (3 - i * 3), by - 2 + (i & 1), T.cry[2]); } }); },
    salamander: (c, n, f, T) => { const d = n.dd || 1, x = Math.round(n.x), y = Math.round(n.y); NK.shadow(c, x, y, 7, .3); for (let i = 0; i < 14; i++) { const bx = x - d * (i - 7), by = y - 2 + Math.round(Math.sin(i / 2 + f / 6)); rect(c, bx, by, 1, 2, i % 3 === 0 ? '#1a4a5a' : '#2a7a8a'); if (i % 3 === 1) px(c, bx, by - 1, P.col(i * .06 + f / 140, .9, .62)); } for (const i of [3, 10]) { px(c, x - d * (i - 7), y + 1, '#1a4a5a'); px(c, x - d * (i - 7) + 1, y + 1, '#1a4a5a'); } disk(c, x + d * 8, y - 2, 2, '#2a7a8a'); px(c, x + d * 9, y - 3, '#ffffff'); px(c, x + d * 9, y - 3, '#fff08a'); },
    beetle: (c, n, f, T) => { const d = n.dd || 1, x = Math.round(n.x), y = Math.round(n.y), w = ((f >> 2) & 1); NK.shadow(c, x, y, 5, .3); for (const lx of [-3, 0, 3]) { px(c, x + lx, y, '#0a1410'); px(c, x + lx + (w ? 1 : -1), y - 1, '#0a1410'); } NK2.blob(c, x, y - 3, 5, 3, ['#08202a', '#1a5a6a', '#2a9aaa', '#8af0f0'], { hi: false }); P.crystal(c, x - d, y - 5, 3, 6, .2, T.cry2); disk(c, x + d * 5, y - 3, 1, '#0a1410'); px(c, x + d * 6, y - 5, '#0a1410'); },
    bat: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), w = Math.abs(Math.sin(f / 2.5)); disk(c, x, y, 2, '#201830'); px(c, x - 1, y - 3, '#201830'); px(c, x + 1, y - 3, '#201830'); px(c, x, y, '#ff8a4a'); for (const s of [-1, 1]) for (let i = 1; i <= 7; i++) { const wy = y - Math.round(w * (i * .8)) + (i > 4 ? 2 : 0); px(c, x + s * i, wy, i > 5 ? '#4a3a6a' : '#2a2040'); px(c, x + s * i, wy + 1, '#2a2040'); } },
    moth: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y), fl = Math.abs(Math.sin(f / 3)), wx = Math.max(2, Math.round(7 * (.35 + fl * .65))), t = f / 110 + n.ph; for (const s of [-1, 1]) for (let j = -4; j <= 4; j++) { const w = Math.round(wx * Math.sqrt(Math.max(0, 1 - j * j / 22))); for (let i = 1; i <= w; i++) px(c, x + s * i, y + j - 1, i === w ? '#f4ffff' : i > w - 2 ? '#c8f0f8' : '#eaffff'); disk(c, x + s * Math.round(wx * .55), y - 1, 1, P.col(t, .95, .55)); px(c, x + s * Math.round(wx * .55), y - 1, '#ffffff'); } rect(c, x, y - 3, 1, 6, '#90a8b0'); },
    slug: (c, n, f, T) => { const d = n.dd || 1, x = Math.round(n.x), y = Math.round(n.y); for (let i = 0; i < 9; i++) { const a = .3 + .3 * Math.sin(f / 10 - i), h = i < 3 ? 2 : 3; rect(c, x - d * (i - 4), y - h, 1, h, mix('#1a6a5a', '#8af0d0', a * .4)); c.globalAlpha = .3; px(c, x - d * (i + 4), y, '#8af0d0'); c.globalAlpha = 1; } px(c, x + d * 5, y - 3, '#a0ffe0'); px(c, x + d * 6, y - 4, '#a0ffe0'); },
    spider: (c, n, f, T) => { const x = Math.round(n.x), y = Math.round(n.y); for (let j = -60; j < 0; j++) { c.globalAlpha = .35; px(c, x, y + j, '#b8f0ff'); c.globalAlpha = 1; } disk(c, x, y, 2, '#1a1228'); px(c, x - 1, y - 1, '#7ad0ff'); px(c, x + 1, y - 1, '#7ad0ff'); for (const s of [-1, 1]) for (let i = 1; i <= 3; i++) { px(c, x + s * (i + 1), y - 1 + (i > 1 ? i - 1 : 0), '#1a1228'); px(c, x + s * (i + 1), y + 1 + (i > 2 ? 1 : 0), '#1a1228'); } },
  };
  const shardSprite = (c, n, f, T, i) => { const x = Math.round(n.x), y = Math.round(n.y), b = Math.round(Math.sin(f / 4 + i)); c.globalAlpha = .4; disk(c, x, y + b, 4, T.cry[2]); c.globalAlpha = 1; for (let k = -3; k <= 3; k++) { const w = 3 - Math.abs(k); rect(c, x - w, y + b + k, w * 2 + 1, 1, k < -1 ? T.cry[3] : T.cry[2]); } px(c, x, y + b, '#ffffff'); for (let k = 0; k < 4; k++) { const a = f / 6 + k * 1.57 + i; px(c, x + Math.cos(a) * 6, y + b + Math.sin(a) * 3, P.col(k / 4 + f / 90 + i * .2, .95, .7)); } };


  /* ---- the painted wood (NK.forest): dark cold trunks, crystal growing from the roots, the Spire on the right ---- */
  const CFS = (() => {
    const F = NK.forest, N = {
      sky: ['#02101a', '#052a36', '#0a4c58', '#16787c'], glow: ['#d8fff4', '#38c8c0'], glowA: .9, fog: '#083e4a', farA: '#14606a', farB: '#0c4a56', farC: '#06303c', rimC: '#3a9ca8', land: ['#041c1e', '#08342e', '#0e4a3c'],
      bark: ['#06121a', '#102830', '#1c4448', '#2c6468', '#4a8a88'], moss: ['#06241c', '#0e4a38', '#1a7050', '#34a070', '#6cd0a0'], dirt: ['#08181a', '#10302e', '#1c4c46', '#2e6c62', '#448a7c'], verge: ['#03141a', '#082c2c', '#0e4a40', '#166052'],
      leafO: ['#2a5a9a', '#5a8ae0', '#a8c8ff', '#e8f4ff'], fern: ['#04201c', '#0c4036', '#166450', '#2a8c6c', '#58bc9c'], cap: ['#1a6a8a', '#3ab8d4', '#8aecf4', '#e8ffff'], stem: ['#486a74', '#98c0c8', '#d8eef0', '#ffffff'], dot: '#ffffff',
      beetle: ['#0a1230', '#2a48a0', '#9ac0ff'], water: ['#06283a', '#0c5a78', '#38a8c8', '#c0f4f8'], cry: ['#0e5a6a', '#2ab0c4', '#82ecf0', '#e8ffff'], cry2: ['#2a2a7a', '#5a52c8', '#a898ff', '#e8e0ff'], shroomA: .45,
    };
    const lift = (a, col, t) => a.map(c => VG.mix(c, col, t));
    const pal = mood => {
      if (mood === 'night') return N; const B = F.pal(mood), t = mood === 'sunset' ? '#b070a0' : '#78b8b8', k = mood === 'day' ? .4 : .32;
      return Object.assign({}, B, { bark: lift(N.bark, t, k), moss: B.moss, leafO: N.leafO, cap: N.cap, stem: N.stem, dot: '#ffffff', beetle: N.beetle, cry: N.cry, cry2: N.cry2, dirt: lift(N.dirt, t, k * .8), land: lift(N.land, t, k * .6), verge: lift(N.verge, t, k * .5), water: mood === 'day' ? ['#1a6a90', '#4aa8c8', '#a0e4f0', '#f0ffff'] : B.water });
    };
    return {
      pal, heartDy: 20, nightRays: false,
      geom(L, sw) { const lx = L.lx; L.shrooms = [{ x: lx + 30, y: sw - 10, r: 8, h: 18 }, { x: lx + 44, y: sw - 4, r: 5, h: 10 }, { x: lx + 20, y: sw + 10, r: 6, h: 12 }, { x: lx + 35, y: sw + 12, r: 4.5, h: 9 }, { x: lx + 58, y: sw + 14, r: 7.5, h: 9 }, { x: lx + 66, y: sw + 15, r: 3, h: 5 }, { x: lx + 12, y: sw + 14, r: 3, h: 5 }, { x: lx - 6, y: sw - 2, r: 3, h: 5 }]; },
      far: (Q, L, H, gx) => [
        { k: .09, blur: .8, trees: { seed: 3, n: 11, fn: F.pillar, base: Math.round(H * .5), jit: 4, h: 100, w: 2.6, col: Q.farA, tuft: Q.farA }, fog: [.25, .56] },
        { k: .16, blur: .5, trees: { seed: 5, n: 8, fn: F.pillar, base: Math.round(H * .56), jit: 5, h: 104, w: 4, col: Q.farB, tuft: Q.farB }, fog: [.4, .62] },
        { k: .26, trees: { seed: 8, n: 5, fn: F.pillar, base: Math.round(H * .6), jit: 5, h: 108, w: 6, col: Q.farC, rim: Q.rimC, tuft: Q.farC }, paint: (c, g2, Q2, L2, H2) => F.farGround(c, g2, Q2, H2), fog: [.5, .66, null, .45] },
      ],
      floor(c, g, Q, L, H) {
        const sw = L.sw, top = sw - 8, lx = L.lx, rx = L.spirit.x;
        F.floor(c, g, Q, L, top); F.fogBand(c, g, Q.fog, top - 10, top + 8, 0, .5);
        for (let i = 0; i < 12; i++) F.mound(c, Q, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 11, top + 2 + (i % 2) * 2, 7 + (i * 7) % 6, 2.2, 40 + i);
        F.leaves(c, g, Q, L, 70, 17, top + 3); F.pool(c, Q, L, Q.water); F.plot(c, Q, L);
        F.trunk(c, g, Q, { x: lx, base: sw + 6, w0: 10, w1: 19, flare: 18, seed: 4, light: 1, lean: -2, sway: 2, moss: .1 });
        F.root(c, Q, { x: lx + 12, y: sw - 1, dir: 1, len: 46, arch: 11, drop: 10, w: 6, seed: 3 }); F.root(c, Q, { x: lx + 8, y: sw + 13, dir: -1, len: 28, arch: 4, drop: 5, w: 4.2, seed: 6 });
        F.crystalCluster(c, lx + 48, sw + 6, 36, Q.cry, Q.cry2, 3); F.crystalCluster(c, lx + 8, sw + 15, 20, Q.cry2, Q.cry, 4);
        for (const m of L.shrooms.slice().sort((a, b) => a.y - b.y)) F.shroom(c, m.x, m.y, m.r, m.h, Q, Math.round(m.x * 7), m.r > 6);
        /* relic stones standing in the mid distance, each with a glyph that glows */
        for (const [dx, h] of [[-22, 14], [26, 11]]) { const x = L.cx + dx, y = sw - 3; F.blob(c, x, y + 1, 5, 1.6, Q.bark[0]); for (let j = 0; j < h; j += .5) F.R_(c, x - 3.2 + (j > h - 2 ? 1 : 0), y - j, 6.4 - (j > h - 2 ? 2 : 0), .5, F.pick(Q.bark, .55 + (F.vn(x, j * 3, 5, 3) - .5) * .5, x, j)); F.R_(c, x - .5, y - h * .55, 1, 3, Q.cry[3]); F.R_(c, x - 1.5, y - h * .55 + 1, 3, .5, Q.cry[2]); }
        F.trunk(c, g, Q, { x: rx + 40, base: sw + 4, w0: 7, w1: 12, flare: 10, seed: 9, light: -1, lean: 2, sway: 1, moss: .12 });
        for (const [dx, w, hh, t, K, K2] of [[-24, 7, 40, -.35, Q.cry2, Q.cry], [26, 8, 50, .3, Q.cry2, Q.cry], [-13, 11, 76, -.2, Q.cry, Q.cry2], [15, 12, 92, .14, Q.cry, Q.cry2]]) F.prism(c, rx + dx, sw + 5, w, hh, t * .5, K, 1);
        F.prism(c, rx, sw + 6, 22, sw + 70, 0, Q.cry, 1); F.root(c, Q, { x: rx - 16, y: sw + 3, dir: -1, len: 44, arch: 7, drop: 9, w: 5, seed: 9 }); F.root(c, Q, { x: rx + 18, y: sw + 5, dir: 1, len: 36, arch: 6, drop: 6, w: 4.4, seed: 11 });
        const R = F.rnd(77); for (let i = 0; i < 6; i++) { const x = L.cx - 36 + R() * 88, y = sw + 12 + R() * (H - sw - 22); F.beetle(c, x, y, Q, R() < .5 ? -1 : 1); }
      },
      near(c, g, Q, L, H) {
        const lx = Math.max(g.x0 + 10, L.x0 - 24), rx = Math.min(g.x1 - 10, L.x1 + 34);
        F.root(c, Q, { x: g.x1 + 6, y: H - 14, dir: -1, len: L.wide ? 80 : 40, arch: 4, drop: 5, w: 5.5, seed: 21 });
        for (let i = 0; i < 7; i++) F.bigLeaf(c, Q, rx + (i - 3) * 5, H + 3, -Math.PI / 2 + (i - 3) * .32, 13 + (i % 3) * 3, 3.2 + (i % 2), 30 + i);
        for (let i = 0; i < 12; i++) F.frond(c, Q, lx + (i - 6) * 2.2, H + 4, -Math.PI / 2 + (i - 6) * .2, 22 + (i % 4) * 5, 50 + i);
        F.crystalCluster(c, g.x0 + 12, H + 4, 22, Q.cry2, Q.cry, 8); F.leaves(c, { x0: g.x0, x1: g.x1, H: g.H }, Q, L, 18, 33, H - 14);
      },
      lights(f, g, L) { const a = g.mood === 'night' ? .5 : g.mood === 'sunset' ? .3 : .14, o = []; for (const m of L.shrooms) o.push({ x: m.x, y: m.y - m.h * .7, r: m.r * 4.4, col: '#7af0f8', a: a * (.88 + .12 * Math.sin(f / 8 + m.x)) }); o.push({ x: L.lx + 48, y: L.sw - 8, r: 34, col: '#7ae8f0', a }); o.push({ x: L.spirit.x, y: L.sw - 30, r: 44, col: '#a8f4ff', a: a * .6 }); return o; },
    };
  })();

  const D = {
    id: 'crystal', houseName: 'Your crystal home', houseW: 42, hutName: 'The reliquary', hutW: 18, spiritH: .56, windowCol: '#fff0c0',
    sky: SKY, fog: FOG, ramps: RAMPS, bubble: { bg: '#eefcff', edge: '#0e3a44', ink: ['#2a9ab0', '#6a5ac8', '#c09a20', '#1a6a8a'] }, pulse: '#a8f4ff', waveCol: '#a8f4ff',
    pal(T, mood, MC) { T.ghost = RAMPS.ghost.map(c => MC(c, mood, .2)); return T; },
    wall: { clump: 'rock', ramps: T => [T.moss, T.moss, T.moss] },
    cav: { rx: 124, ry: .47, bump: .07, ph: [2.3, 0.4, 3.9] },
    door: (L, H) => ({ x: NK.u(L, .5), y: Math.round(H * .3), rx: L.wide ? 21 : 16, ry: L.wide ? 34 : 27 }),
    geom(L, G0, H) { const sw = L.sw; L.lamps = [{ x: L.house.x + 20, y: sw - 70, h: .1 }, { x: L.hut.x + 9, y: sw - 52, h: .45 }, { x: NK.u(L, L.wide ? .72 : .64), y: sw - 80, h: .7 }, { x: NK.u(L, .08), y: sw - 38, h: .3 }]; L.heart = { x: L.spirit.x, y: sw - 20 }; },
    lit(T, L, H) {
      const m = T.mood, dr = L.E.door, sw = L.sw, k = { morning: { amb: [.3, .44, .44], dc: [.7, 1, .9], da: .6 }, day: { amb: [.34, .48, .48], dc: [.7, 1, .9], da: .62 }, sunset: { amb: [.3, .28, .4], dc: [1, .6, .5], da: .7 }, night: { amb: [.22, .3, .46], dc: [.4, .8, 1], da: .55 } }[m];
      const la = m === 'night' ? 1.15 : .9, Ls = [{ x: dr.x, y: dr.y + 8, r: 90, a: k.da, col: k.dc, sy: 1.2 }, { x: dr.x + 6, y: sw + 16, r: 56, a: k.da * .8, col: k.dc, sy: .45 }];
      for (const l of L.lamps) { const col = P.hsl && l.h > .5 ? [.7, .6, 1] : [.4, .9, 1]; Ls.push({ x: l.x, y: l.y, r: 52, a: la, col }); Ls.push({ x: l.x, y: sw + 12, r: 50, a: la * .5, col, sy: .4 }); }
      Ls.push({ x: L.heart.x, y: L.heart.y, r: 96, a: 1.1, col: [.6, .95, 1] }); Ls.push({ x: L.heart.x - 12, y: sw + 14, r: 76, a: .7, col: [.6, .95, 1], sy: .45 });
      return { Ls, amb: k.amb, ambStage: k.amb.map(v => v * .8 + .05) };
    },
    wallK: T => T.wall, floorK: T => T.floor, ringK: T => T.ring, doorFrame: T => [T.relic[2], T.relic[1], T.relic[0]],
    wallDeco(c, g, T, L, E, R) {
      const sw = L.sw, S = T.relic;
      /* ribs of a fallen vault */
      for (const [cx, ry] of [[E.cx - 20, 86], [E.cx + 30, 70]]) for (let a = 3.3; a < 6.1; a += .006) { const x = Math.round(cx + Math.cos(a) * 100), y = Math.round(sw - 14 + Math.sin(a) * ry); if (E.cav(x, y) > .98 || E.inDoor(x, y) < 1.3) continue; for (let k = 0; k < 4; k++) { c.fillStyle = k === 0 ? S[3] : k < 3 ? S[2] : S[0]; c.fillRect(x, y + k, 1, 1); } }
      /* two pillars */
      for (const px_ of [E.cx - 100, E.cx + 96]) { if (E.cav(px_, 50) > .95 && E.cav(px_, sw) > .95) continue; for (let y = 4; y < sw + 4; y++) { if (E.cav(px_, y) > .99) continue; rect(c, px_ - 5, y, 10, 1, S[1]); rect(c, px_ - 5, y, 3, 1, S[2]); rect(c, px_ + 3, y, 2, 1, S[0]); if (hsh(px_, y, 4) < .12) px(c, px_ - 4 + Math.floor(hsh(y, 2, 3) * 7), y, S[0]); } rect(c, px_ - 7, sw - 2, 14, 4, S[2]); rect(c, px_ - 7, sw - 2, 14, 1, S[3]); }
      for (const [dx, dy, r] of [[-100, 56, 10], [96, 40, 8], [-58, 26, 6]]) { const cx = E.cx + dx, cy = dy; if (E.cav(cx, cy) > .92) continue; P.mandala(c, cx, cy, r, 0, { step: 2, dots: false, s: .55, l: .5, petals: 5, wave: .6, span: 1.2 }); }
      for (let i = 0; i < 40; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 4 + Math.floor(R() * (sw + 8)), s = E.cav(x, y); if (s > .97 || (s < .7 && R() < .8) || E.inDoor(x, y) < 1.4) continue; NK2.blob(c, x, y, 3 + Math.floor(R() * 5), 2 + Math.floor(R() * 2), T.moss, { outline: false, hi: false }); }
      for (let i = 0; i < 14; i++) { const x = E.cx - E.rx + 8 + Math.round(R() * (E.rx * 2 - 16)); let y = 0; while (y < 60 && E.cav(x, y) >= 1) y++; if (y >= 60) continue; NK2.root(c, x, y - 2, 14 + Math.floor(R() * 34), 1.57 + (R() - .5) * .6, 1.6 + R() * 1.4, [T.bark[0], T.bark[1], T.bark[2], T.bark[3]], R, { wob: .3, fork: R() < .4 }); }
    },
    wallEmit(c, g, T, L, E, R) {
      for (const l of L.lamps) { const x = l.x, y = l.y, K = l.h > .5 ? RAMPS.cry2 : RAMPS.cry; for (let j = 0; j < Math.max(0, y - 14); j++) { if (j % 3 === 0) px(c, x, j, T.bark[1]); } for (const [dx, w, h, t] of [[-4, 4, 8, -.3], [4, 4, 9, .3], [0, 5, 13, 0]]) P.crystal(c, x + dx, y + 8, w, h, t, K); rect(c, x, y - 1, 1, 6, '#ffffff'); }
      for (let i = 0; i < 26; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = 10 + Math.floor(R() * (L.sw + 6)); if (E.cav(x, y) > .94 || E.inDoor(x, y) < 1.5) continue; px(c, x, y, P.col(hsh(x, y, 5), .85, .7)); }
    },
    paintSky: sky, paintFar: far,
    groundDeco(c, g, T, L, H) {
      const R = rnd(11), sw = L.sw;
      NK.tuftRows(c, g, L, H, [T.moss[0], T.moss[2], T.moss[3]], R);
      for (let i = 0; i < 24; i++) { const fx = L.x0 + Math.floor(R() * (L.x1 - L.x0)), fy = sw + 5 + Math.floor(R() * (H - sw - 5)); px(c, fx, fy, ['#e8ffff', '#7ae8ff', '#c8b8ff', '#fff0a0'][i & 3]); }
      NK.path(c, g, L, H, [T.relic[0], T.relic[1], T.relic[2], T.relic[3]], { stepping: true });
      NK.stream(c, g, L, H, T.water, { stones: T.relic, bank: [T.soil[1], T.moss[2]] }); NK.bridge(c, L, T.relic); NK.bed(c, L, T.soil); NK.fence(c, L, T.relic);
    },
    spiritPaint: (c, L, T) => spireEmit(c, L, T), hutPaint: (c, x, base, T) => reliquary(c, x, base, T), housePaint: (c, x, base, st, T, L) => home(c, x, base, st, T, L),
    stageEmit(c, g, T, L) { spireEmit(c, L, T); },
    ringDeco(c, g, T, L, E, R) {
      const K = [T.fern[0], T.fern[1], T.fern[1], T.fern[2]];
      for (let i = 0; i < 44; i++) { const a = R() * 6.283, x = Math.round(E.cx + Math.cos(a) * E.rx * 1.02), y = Math.round(E.cy + Math.sin(a) * E.ry * 1.02); if (E.cav(x, y) < .99) continue; NK.leaves(c, x, y, 3 + Math.floor(R() * 4), K, R); }
      for (let i = 0; i < 8; i++) { const x = E.cx - E.rx + 10 + Math.round(R() * (E.rx * 2 - 20)); let y = 0; while (y < 60 && E.cav(x, y) >= 1) y++; if (y >= 60) continue; for (let j = 0; j < 8 + R() * 26; j++) px(c, x + Math.round(Math.sin(j / 4 + x) * 1.2), y + j, j % 6 === 5 ? T.cry[2] : T.fern[1]); }
    },
    fg(c, g2, T, L, H, W) { const Rr = rnd(7), K = [T.fern[0], T.fern[1], T.fern[1], T.fern[2]]; for (const side of [-1, 1]) for (let i = 0; i < 5; i++) NK.leaves(c, side < 0 ? g2.x0 + 4 + i * 5 : g2.x1 - 4 - i * 5, H - 6 + Math.floor(Rr() * 14) - i * 7, 10 + Math.floor(Rr() * 6), K, Rr); for (let i = 0; i < 8; i++) NK.leaves(c, L.x0 + Math.floor(Rr() * (L.x1 - L.x0)), H + 8 + Math.floor(Rr() * 6), 8 + Math.floor(Rr() * 5), K, Rr); },
    spirit: { name: 'The Singing Spire', snd: 'gong', sndK: 1, say: ['star', 'note', 'heart', 'moon'], hw: 28, hh: 70, glow: T => ({ col: '#a8f4ff', r: 50, a: T.mood === 'night' ? .2 : .08, dy: 20 }),
      draw(c, n, f, T, L) { const x = L.spirit.x, y = L.sw - 20; for (let k = 0; k < 3; k++) { const a = -2.5 + k * .9 + Math.sin(f / 70 + k) * .05; c.globalAlpha = .12 + (n.fl > .1 ? .25 : 0); for (let r = 10; r < 96; r += 1) { const xx = Math.round(x + Math.cos(a) * r), yy = Math.round(y + Math.sin(a) * r * .8); c.fillStyle = P.hsl(P.hue(k / 7 + f / 200 + r / 400), .9, .65); c.fillRect(xx, yy - 1, 1, 3); } c.globalAlpha = 1; } P.mandala(c, x, y, 5, f, { step: 1, petals: 6, speed: 80, wave: .6 }); } },
    nests: [{ dx: -22, yf: .72, name: 'Shard lantern' }, { dx: 24, yf: .5, name: 'Shard lantern' }],
    nestDraw(c, n, f, T, i, lit) { const x = Math.round(n.x), y = Math.round(n.y); P.crystal(c, x, y + 2, 5, 9, i ? .2 : -.2, i ? T.cry2 : T.cry); if (lit) { px(c, x, y - 3, '#ffffff'); px(c, x, y - 2, '#ffffff'); } },
    plants: [
      PD('bloom', { p: .1, row: 10, crop: 1, snd: 'chime', sndK: 3, hh: 16 }), PD('reed', { p: .5, row: 10, crop: 1, snd: 'glass', sndK: 2 }), PD('bell', { p: .9, row: 10, crop: 1, hw: 10, hh: 12, snd: 'chime', sndK: 5 }), PD('orchid', { p: .12, row: 18, crop: 1, snd: 'chime', sndK: 6 }), PD('bloom', { p: .5, row: 18, crop: 1, snd: 'chime', sndK: 4, hh: 16 }), PD('pod', { p: .9, row: 18, crop: 1, snd: 'bloop' }),
      PD('fern', { u: .06, row: 24, hh: 20 }), PD('fern', { u: .38, row: 6, hh: 20 }), PD('moss', { u: .27, row: 22 }), PD('moss', { u: .62, row: 29 }), PD('thorn', { u: .44, row: 7, hh: 24 }), PD('ivy', { u: .82, row: 14, hh: 20 }), PD('orchid', { u: .95, row: 22 }), PD('reed', { u: .2, row: 28, snd: 'glass', sndK: 4 }), PD('bell', { u: .74, row: 26, hw: 10, hh: 12, snd: 'chime', sndK: 7 }), PD('bloom', { u: .15, row: 14, hh: 16, snd: 'chime', sndK: 8 }),
    ],
    animals: [
      { id: 'stag', name: 'Crystal stag', mode: 'walk', u: .72, row: 15, range: 14, spd: .7, hw: 12, hh: 18, magic: true, snd: 'chime', sndK: 7, say: ['star', 'moon', 'heart'], draw: A.stag, glow: T => ({ col: '#a8f4ff', r: 18, a: T.lit * .3 + .08, dy: 12 }) },
      { id: 'salamander', name: 'Glow salamander', mode: 'crawl', u: .3, row: 30, range: 22, spd: .5, every: 3, hw: 9, hh: 5, snd: 'chitter', say: ['drop', 'leaf'], draw: A.salamander },
      { id: 'beetle', name: 'Shard beetle', mode: 'crawl', u: .6, row: 26, range: 14, spd: .4, every: 4, hw: 7, hh: 7, snd: 'knock', say: ['star', 'drop'], draw: A.beetle },
      { id: 'bat', name: 'Cave bat', mode: 'hover', u: .4, dy: -60, hw: 8, hh: 5, air: true, snd: 'chitter', say: ['moon', 'note'], hover: { dy: -60, rx: 46, ry: 14, sx: 21, sy: 13, jy: 1 }, draw: A.bat },
      { id: 'moth', name: 'Ghost moth', mode: 'hover', u: .5, dy: -36, hw: 9, hh: 7, air: true, magic: true, snd: 'flutter', say: ['star', 'heart', 'moon'], hover: { dy: -36, rx: 44, ry: 12, sx: 39, sy: 19, jy: .8 }, draw: A.moth, glow: T => ({ col: '#e8ffff', r: 14, a: T.lit * .35 + .08, dy: 2 }) },
      { id: 'slug', name: 'Glow slug', mode: 'crawl', u: .15, row: 21, range: 10, spd: .3, every: 5, hw: 6, hh: 5, snd: 'bloop', say: ['drop', 'leaf'], draw: A.slug, glow: T => ({ col: '#8af0d0', r: 9, a: T.lit * .3 + .05, dy: 2 }) },
      { id: 'spider', name: 'Lantern spider', mode: 'hover', u: .3, dy: -48, hw: 6, hh: 6, air: true, snd: 'chitter', say: ['star', 'note'], hover: { dy: -42, rx: 3, ry: 8, sx: 50, sy: 30 }, draw: A.spider, glow: T => ({ col: '#7ad0ff', r: 9, a: T.lit * .2 + .04, dy: 0 }) },
    ],
    folk: [
      { id: 'tender', name: 'Pale gardener', rank: 3, cloth: 0, draw: pale, u: .55, hw: 7, hh: 20, snd: 'hum', needCrops: true, mv: 'float', tasks: [{ to: { crop: 0 }, act: 'tend', t: 8, say: 'star' }, { to: { crop: 1 }, act: 'tend', t: 8 }, { to: { crop: 4 }, act: 'carry', take: 'shard', t: 4 }, { to: 'store', act: 'give', t: 5 }, { to: 'store', act: 'enter', t: 14 }, { to: { u: .45 }, act: 'talk', t: 8, say: 'note' }] },
      { id: 'drawer', name: 'Pale keeper of light', rank: 2, cloth: 1, draw: pale, u: .5, hw: 7, hh: 20, snd: 'hum', needCrops: true, mv: 'float', tasks: [{ to: 'water', act: 'carry', take: 'shard', t: 5 }, { to: { crop: 2 }, act: 'tend', t: 8, say: 'drop' }, { to: 'water', act: 'carry', take: 'shard', t: 5 }, { to: { crop: 3 }, act: 'tend', t: 8 }, { to: 'water', act: 'carry', take: 'shard', t: 5 }, { to: { crop: 5 }, act: 'tend', t: 8, say: 'star' }] },
      { id: 'gatherer', name: 'Pale gatherer', rank: 4, cloth: 2, draw: pale, u: .6, hw: 7, hh: 20, snd: 'hum', needCrops: true, mv: 'float', tasks: [{ to: { plant: 'ivy' }, act: 'carry', take: 'gold', t: 6, say: 'heart' }, { to: 'store', act: 'give', t: 5 }, { to: { plant: 'thorn' }, act: 'tend', t: 8 }, { to: { nest: 1 }, act: 'look', t: 8 }, { to: 'house', act: 'enter', t: 18 }] },
      { id: 'elder', name: 'Elder of the Pale', rank: 5, cloth: 3, draw: pale, u: .88, lane: 1, elder: true, hw: 8, hh: 20, snd: 'gong', needCrops: true, mv: 'float', tasks: [{ to: { u: .8 }, act: 'sit', t: 40 }, { to: { u: .8 }, act: 'talk', t: 10, say: 'note', reply: 'star' }, { to: 'spirit', act: 'tend', t: 12, say: 'moon' }] },
    ],
    sprites: { n: 4, name: 'Shard wisp', col: '#a8f4ff', r: 11, a: .22, draw: shardSprite, say: ['star', 'note', 'moon', 'heart'] },
    weather: { dir: 'up', cols: ['#e8ffff', '#a8f4ff', '#c8b8ff'], glow: true, depths: [{ n: 10, size: 1, dur: 44, z: 1, seed: 6, op: .8 }, { n: 3, size: 1, dur: 28, z: 3, seed: 3, op: .7, blur: 1 }] },
    heart: (L, T) => ({ x: L.spirit.x, y: L.sw - 20 }),
    rays(g, L) { if (g.mood === 'night') return []; const d = L.E.door, out = []; for (let i = 0; i < 3; i++) out.push({ x: d.x - 12 + i * 12, w: 6 + i * 2, sk: .3, a: g.T.shaftA * 1.1, d: i * 2.2, col: '#d0fff0' }); return out; },
  };
  NK.forest.compose(D, CFS);
  NK.realm(D);
})();
