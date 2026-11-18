/* ---------- Elder Grove, Frost Hollow and Hearth Hollow ----------
   Elder Grove: two huge sunlit trunks, red mushrooms in the moss, a log cabin that you build, deer, foxes and fireflies. The right trunk is the Elder Oak, with a warm hollow.
   Frost Hollow: snow pines in blue distance, an aurora at night, a snowy log cabin, a frozen pond, white foxes and hares, one lit window.
   Hearth Hollow: the inside of a mossy cave. A warm back wall with a shelf, a round window and hanging lanterns, boulders at the sides, and the Hearth,
   a stone fireplace whose flame is the realm's spirit. Everything here is built from the shared kit in vs_extra.js (NK.lib.ex). */
(() => {
  const { mix, rnd, hsh, px, rect, disk, ell } = VG, F = NK.forest, P = NK2.PSY, WD = NK.lib.wd, SH = NK.lib.sh, X = NK.lib.ex;
  const { mkPal, stars, BE, quad, quadSpec, catSpec, deer, antlers, owl, bunny, hog, hollowEmit, nestLantern, nestDoor, mote, shroomsAt, twoTrunks, nearGen, farRows, lightPts, mk } = X;
  const STONE = ['#4e5a64', '#8a98a0', '#c0cac8', '#e8f0ee'];
  /* a creature that works: the same shaded body with a cloth shirt, for the folk of a realm */
  const FOLK = (spec, ci) => BE((n, f, T) => Object.assign({ eye: '#0c0c14' }, spec(n, f, T)));
  const shirt = (T, ci) => { const cl = T.cloth[ci], r = (c, x, y, w, h, col) => rect(c, x, y, w, h, col); return (c, x, y, d, f2, by) => { r(c, x - 4, by - 1, 8, 5, cl[1]); r(c, x - 4, by - 1, 8, 1, cl[2]); r(c, x - 4, by + 2, 8, 1, cl[0]); }; };
  const foxFolk = (K, tailK, ci) => FOLK((n, f, T) => ({ K, rx: 7, ry: 5, leg: 3, head: { dx: 7, dy: -2, r: 4 }, ears: [{ dx: -1, dy: -4, w: 3, h: 4, tilt: -1 }, { dx: 2, dy: -4, w: 3, h: 4, tilt: 1 }], tail: { dx: 9, dy: 0, r: 3.4, ry: 2.4, K: tailK || K }, snout: { dx: 3, dy: 1, w: 3, h: 2, K: K[3] }, belly: K[3], extra: shirt(T, ci) }));
  const bearFolk = (K, ci) => FOLK((n, f, T) => ({ K, rx: 10, ry: 7, leg: 3, head: { dx: 9, dy: -2, r: 5 }, ears: [{ dx: -2, dy: -4, w: 3, h: 3, round: 1 }, { dx: 3, dy: -4, w: 3, h: 3, round: 1 }], tail: { dx: 10, dy: 1, r: 2 }, snout: { dx: 4, dy: 1, w: 3, h: 3, K: K[3] }, extra: shirt(T, ci) }));
  const catFolk = (K, ci) => BE((n, f, T) => Object.assign({ eye: '#0c0c14' }, catSpec(K, { rx: 7, ry: 5, head: { dx: 7, dy: -3, r: 4, ry: 3.5 }, extra: shirt(T, ci) })));

  /* the same walk for every folk: tend, carry, give, go in, talk, sit */
  const gardener = [{ to: { crop: 0 }, act: 'tend', t: 8, say: 'leaf' }, { to: { crop: 1 }, act: 'tend', t: 8 }, { to: { crop: 2 }, act: 'carry', take: 'basket', t: 4 }, { to: 'store', act: 'give', t: 5 }, { to: 'store', act: 'enter', t: 14 }, { to: { u: .45 }, act: 'talk', t: 8, say: 'sun' }];
  const waterer = [{ to: 'water', act: 'carry', take: 'bucket', t: 5 }, { to: { crop: 0 }, act: 'tend', t: 8, say: 'drop' }, { to: 'water', act: 'carry', take: 'bucket', t: 5 }, { to: { crop: 1 }, act: 'tend', t: 8 }, { to: 'water', act: 'carry', take: 'bucket', t: 5 }, { to: { crop: 2 }, act: 'tend', t: 8, say: 'drop' }];
  const picker = [{ to: { plant: 'berry' }, act: 'carry', take: 'apple', t: 6, say: 'heart' }, { to: 'store', act: 'give', t: 5 }, { to: { crop: 2 }, act: 'tend', t: 8 }, { to: { nest: 1 }, act: 'look', t: 8 }, { to: 'house', act: 'enter', t: 18 }];
  const elderTasks = [{ to: { u: .8 }, act: 'sit', t: 40 }, { to: { u: .8 }, act: 'talk', t: 10, say: 'leaf', reply: 'heart' }, { to: 'spirit', act: 'tend', t: 12, say: 'heart' }];
  const GRASS = ['#2f6a34', '#4a8a3c', '#6aaa48', '#98cc58'], HEDGE = ['#124a2c', '#1e7a3a', '#3ea048', '#7ad060'];
  const hoverAnim = (id, name, o) => Object.assign({ id, name, mode: 'hover', air: true, hw: 5, hh: 5 }, o);

  /* ======================= Elder Grove ======================= */
  const GSKY = { morning: ['#7ab8e0', '#c4e0d0', '#ffe8b8', '#fff4d0'], day: ['#5ab4e8', '#9ad4f0', '#d8ecc8', '#fff4c0'], sunset: ['#3a3a8a', '#b8607a', '#f4a060', '#ffd890'], night: ['#06122a', '#0e2446', '#1a3c58', '#2a5468'] };
  const GFOG = { morning: '#d8e4c0', day: '#c8e0b8', sunset: '#e8a898', night: '#142a3c' };
  const GR = Object.assign({}, WD.RAMPS, {
    moss: ['#143a18', '#2a6a2a', '#58a040', '#a0d060'], leaf: ['#0c2a14', '#1c5a26', '#3a8a36', '#88c858'], bark: ['#2a1a12', '#5a3e2a', '#8a6444', '#c09a68'], grass: GRASS, hedge: HEDGE, stone: STONE,
    cwall: ['#3a2416', '#5a3e26', '#7a5a38', '#a07a4c'], croof: ['#4a2a18', '#7a4a28', '#a86e3a', '#d09a5c'], ctrim: ['#2a1a10', '#5a3a20', '#8a5e34'], cap: ['#7a1418', '#c83028', '#f05a40', '#ffa888'],
  });
  const CAPR = ['#7a1418', '#c83028', '#f05a40', '#ffa888'];
  const palG = mkPal({ sky: GSKY.day, glow: ['#fffbe0', '#ffe890'], fog: GFOG.day, farA: '#a8d098', farB: '#74b070', farC: '#3e8050', rimC: '#f4f8b0', land: ['#2a6a38', '#3e8a44', '#62aa52'], cap: CAPR, stem: ['#8a8478', '#c8c4b4', '#ecead8', '#ffffff'], leafO: ['#b8501a', '#e07a22', '#f8a838', '#ffd060'] },
    { sky: GSKY.night, glow: ['#fff6d0', '#8ab0e0'], glowA: .8, fog: GFOG.night, farA: '#1c4a52', farB: '#12383e', farC: '#0a2830', rimC: '#5a9aa0', cap: CAPR, shroomA: .35 });
  const FSG = {
    pal: palG, heartDy: 10, waterDy: 26,
    geom(L, sw) { L.shrooms = shroomsAt(L, L.lx, sw).slice(0, 6).concat([{ x: L.spirit.x - 40, y: sw + 12, r: 5, h: 10 }]); },
    skyExtra(c, g, Q, L, gx, gy) { stars(c, g, Q, g.H, 70); },
    far: (Q, L, H, gx) => farRows(Q, H, { c: { fn: F.oak, h: 120, w: 6 } }),
    floor(c, g, Q, L, H) {
      const sw = L.sw, top = sw - 8, R = F.rnd(9);
      F.floor(c, g, Q, L, top); F.fogBand(c, g, Q.fog, top - 10, top + 8, 0, .4);
      for (let i = 0; i < 12; i++) F.mound(c, Q, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 11, top + 2 + (i % 2) * 2, 7 + (i * 7) % 6, 2.2, 40 + i);
      F.leaves(c, g, Q, L, 40, 17, top + 3);
      for (let i = 0; i < 80; i++) { const x = g.x0 + R() * (g.x1 - g.x0), y = top + 3 + R() * (H - top), t = (y - top) / (H - top); F.R_(c, x, y, .5 + t, .5 + t * .5, ['#ffffff', '#ffe870', '#fff6c8', '#ffb0a0'][i % 4]); }
      F.pool(c, Q, L, Q.water); F.plot(c, Q, L);
      twoTrunks(c, g, Q, L, H, { moss: .1 });
    },
    near: nearGen,
    lights: (f, g, L) => { const a = g.mood === 'night' ? .4 : g.mood === 'sunset' ? .22 : .08, o = []; for (const m of L.shrooms) if (m.r > 3) o.push({ x: m.x, y: m.y - m.h * .7, r: 12, col: '#ff7a5a', a: a * .8 }); o.push({ x: L.spirit.x, y: L.sw - 10, r: 38, col: '#ffd890', a: a * 1.3 + .04 }); return o; },
  };
  const antG = ['#6a4a2a', '#a07848'];
  mk({
    FS: FSG, S: T => ({ wall: T.cwall, roof: T.croof, trim: T.ctrim, stone: T.stone, logs: true, chimney: true, glow: '#ffd88a', door: '#4a2a14', flowers: ['#ffe870', '#ff8a6a'] }),
    D: {
      id: 'grove', houseName: 'Your log cabin', hutName: 'The root cellar', spiritH: .6, windowCol: '#ffd890', pulse: '#ffe8a0', waveCol: '#ffe8a0',
      sky: GSKY, fog: GFOG, ramps: GR, bubble: { bg: '#fffbe8', edge: '#3a2a10', ink: ['#2a9a4a', '#e0702a', '#2a8ad8', '#8a4ad0'] },
      pal(T, mood, MC) { T.cloth = SH.CLOTH.map(r => r.map(h => MC(h, mood))); T.orange = ['#c85a12', '#f08a20', '#ffc050', '#fff0c0']; T.green = SH.GREEN.map(h => MC(h, mood, .3)); return T; },
      spiritPaint: (c, L, T) => hollowEmit(c, L.spirit.x, L.sw - 10, '#fff2b8', '#ffa850', T, '#1a0e06'),
      weather: { dir: 'up', cols: ['#fff6c8', '#ffe8a0'], glow: true, depths: [{ n: 10, size: 1, dur: 42, z: 1, seed: 6, op: .7 }, { n: 3, size: 1, dur: 28, z: 3, seed: 3, op: .6, blur: 1 }] },
      spirit: { name: 'The Elder Oak', snd: 'hum', sndK: 1, say: ['leaf', 'sun', 'heart', 'drop'], hw: 30, hh: 70, glow: T => ({ col: '#ffe0a0', r: 44, a: T.mood === 'night' ? .16 : .06, dy: 14 }),
        draw(c, n, f, T, L) { const x = L.spirit.x, y = L.sw - 10; P.mandala(c, x, y - 1, 5, f, { step: 1, petals: 5, speed: 90, wave: .8, spin: 2 }); if (n.fl > .1) for (let i = 0; i < 8; i++) { const a = f / 5 + i * .785; px(c, x + Math.cos(a) * (14 + i * 2), y + Math.sin(a * 1.3) * 18, P.col(i / 8 + f / 60, .9, .75)); } } },
      nests: [{ dx: -3, yf: .78, name: 'Squirrel door' }, { dx: 4, yf: .5, name: 'Owl door' }], nestDraw: nestDoor,
      plants: [
        { k: 'sun', name: SH.PLN.sun, p: .12, row: 10, hh: 18, snd: 'rustle', crop: true, draw: SH.PL.sun }, { k: 'lav', name: SH.PLN.lav, p: .5, row: 10, snd: 'rustle', crop: true, draw: SH.PL.lav }, { k: 'tulip', name: SH.PLN.tulip, p: .88, row: 10, snd: 'rustle', crop: true, draw: SH.PL.tulip },
        { k: 'daisy', name: SH.PLN.daisy, u: .13, row: 24, draw: SH.PL.daisy }, { k: 'fern', name: SH.PLN.fern, u: .56, row: 30, hw: 10, hh: 20, snd: 'rustle', draw: SH.PL.fern }, { k: 'berry', name: SH.PLN.berry, u: .8, row: 15, draw: SH.PL.berry }, { k: 'clover', name: 'Clover', u: .62, row: 27, draw: WD.PD.clover },
        { k: 'primrose', name: 'Primroses', u: .3, row: 22, snd: 'chime', sndK: 1, draw: WD.PD.primrose }, { k: 'bramble', name: 'Bramble', u: .02, row: 8, draw: WD.PD.bramble }, { k: 'spore', name: SH.PLN.spore, u: .36, row: 28, hw: 10, hh: 12, snd: 'chime', sndK: 3, draw: SH.PL.spore },
      ],
      animals: [
        { id: 'stag', name: 'Elder stag', mode: 'walk', u: .7, row: 14, range: 14, spd: .8, hw: 12, hh: 16, magic: true, say: ['sun', 'heart', 'leaf'], snd: 'chime', sndK: 7, glow: T => ({ col: '#ffe0a0', r: 16, a: T.lit * .3 + .08, dy: 10 }), draw: deer(['#4a2c12', '#8a5a2a', '#c08a4a', '#f0d8a8'], { extra: antlers('#a88458', '#f0d8a8') }) },
        { id: 'doe', name: 'Doe', mode: 'walk', u: .4, row: 17, range: 12, spd: .7, hw: 11, hh: 14, say: ['leaf', 'heart', 'sun'], snd: 'snuffle', draw: deer(['#5a3414', '#a8682c', '#d8924a', '#f4dca8'], {}) },
        { id: 'fox', name: 'Fox', mode: 'walk', u: .2, row: 22, range: 16, hw: 10, hh: 9, say: ['moon', 'heart', 'leaf'], snd: 'yip', draw: quad(['#7a2a0c', '#d8762a', '#f0a050', '#fff0d8'], { tail: { dx: 11, dy: -1, r: 3.6, ry: 2.6, K: ['#7a2a0c', '#d8762a', '#f0a050', '#fff0d8'] } }) },
        { id: 'hare', name: 'Hare', mode: 'hop', u: .09, row: 11, hw: 6, hh: 8, say: ['leaf', 'heart', 'drop'], snd: 'squeak', draw: bunny(SH.FUR.rabbit) },
        hoverAnim('songbird', 'Blue songbird', { u: .5, dy: -46, hw: 7, hh: 6, snd: 'chirp', say: ['note', 'sun', 'heart'], hover: { dy: -46, rx: 38, ry: 8, sx: 41, sy: 23, jy: .5 }, draw: SH.songbird }),
        hoverAnim('butterfly', 'Mandala butterfly', { u: .4, dy: -26, hw: 8, hh: 7, snd: 'flutter', magic: true, say: ['star', 'heart', 'note', 'leaf'], hover: { dy: -26, rx: 48, ry: 12, sx: 37, sy: 17, jx: .8, jy: 1 }, draw: SH.butterfly, glow: T => ({ col: '#a0e8ff', r: 12, a: T.lit * .3 + .05, dy: 4 }) }),
        { id: 'snail', name: 'Prism snail', mode: 'crawl', u: .2, row: 31, range: 30, hw: 7, hh: 7, spd: .4, every: 4, snd: 'bloop', magic: true, say: ['star', 'heart', 'note'], draw: SH.snail, glow: T => ({ col: '#c8a0ff', r: 12, a: T.lit * .25 + .06, dy: 5 }) },
        hoverAnim('fly0', 'Firefly', { u: .3, dy: -16, hw: 4, hh: 4, hover: { dy: -16, rx: 28, ry: 10, sx: 17, sy: 11 }, say: ['star', 'sun'], snd: 'chime', sndK: 5, glow: T => ({ col: '#fff8a0', r: 9, a: T.lit * .5 + .08, dy: 0 }), draw: WD.A.fly }),
      ],
      folk: [
        { id: 'fox', name: 'Fox forager', rank: 3, cloth: 0, draw: foxFolk(['#7a2a0c', '#d8762a', '#f0a050', '#fff0d8'], null, 0), u: .55, hw: 8, hh: 12, snd: 'yip', tasks: gardener },
        { id: 'rabbit', name: 'Rabbit picker', rank: 4, cloth: 2, draw: SH.folkDraw(SH.rabbit), u: .6, hw: 8, hh: 14, snd: 'snuffle', tasks: picker },
        { id: 'elder', name: 'Old hedgehog', rank: 5, cloth: 3, draw: SH.folkDraw(SH.hedgehog), u: .9, lane: 1, elder: true, hw: 11, hh: 12, snd: 'snuffle', tasks: elderTasks },
      ],
      sprites: { n: 2, name: 'Light mote', col: '#ffe8a0', r: 11, a: .2, say: ['leaf', 'drop', 'sun', 'heart', 'star'], draw: mote('#ffe27a', '#fff8d0') },
    },
  });

  /* ======================= Frost Hollow ======================= */
  const SNOW = ['#9ab0c8', '#c8dcec', '#e8f2fa', '#ffffff'];
  const FKY = { morning: ['#8ab8d8', '#c4dcea', '#f4e8d8', '#fff4e0'], day: ['#7ab0d8', '#a8d0ec', '#d4e8f4', '#f4f8fc'], sunset: ['#2e3070', '#8a5a94', '#f0a09a', '#ffd8a8'], night: ['#040a20', '#0a1a3e', '#14305a', '#244e7c'] };
  const FFOG = { morning: '#d4e0ec', day: '#c8dcec', sunset: '#d8a8b8', night: '#1a3052' };
  const FR = Object.assign({}, WD.RAMPS, {
    moss: ['#2a6a60', '#3a8a70', '#58a888', '#98d0b0'], leaf: ['#0e3032', '#1a504a', '#2e7a62', '#68b898'], bark: ['#2a2030', '#4a3c4a', '#6e5c68', '#a4909a'], stone: ['#4a5a72', '#8098b4', '#bcd0e4', '#f0f8ff'], water: ['#3a7ab0', '#6ab0d8', '#b0e0f4', '#f4ffff'], bloom: ['#3a6ab0', '#6a9ae0', '#a8caf8', '#e8f4ff'], petal: ['#6a8ac8', '#a8c0f0', '#d4e0ff', '#ffffff'], glow: ['#2a8ac0', '#5ac4e8', '#a8f0ff', '#f0ffff'],
    cwall: ['#3a2a22', '#5e4434', '#80644a', '#a8885e'], croof: ['#3a4a62', '#5a7494', '#8aa8c8', '#c4dcf0'], ctrim: ['#241a18', '#4a3426', '#745038'], grass: GRASS, hedge: HEDGE,
  });
  const palF = mkPal({ sky: FKY.day, glow: ['#ffffff', '#dff0ff'], fog: FFOG.day, farA: '#a8c4dc', farB: '#7ea0c0', farC: '#4a6e92', rimC: '#ffffff', land: ['#9ab4cc', '#b8cee0', '#dceaf6'], pine: ['#1e4a4c', '#2e6a62', '#4a8e7a', '#88c0a8'], snow: SNOW,
    moss: ['#7a92b0', '#a8c0d8', '#d0e2f2', '#f4faff', '#ffffff'], dirt: ['#5a6a80', '#8498b0', '#aabccc', '#cddae8', '#e8f0f8'], verge: ['#8aa4c0', '#b0c8de', '#d4e4f2', '#f0f8ff'], fern: ['#143a3a', '#246058', '#3a8a72', '#68b898', '#a0d8bc'],
    bark: ['#2a2030', '#4a3c4a', '#6e5c68', '#94808a', '#b8a4ac'], water: ['#3a7ab0', '#6ab0d8', '#b0e0f4', '#f4ffff'], cap: ['#3a6aa8', '#6aa0d8', '#a8d4f4', '#e8f8ff'], leafO: ['#a8c4e0', '#cadcf0', '#e8f2fa', '#ffffff'] },
  { sky: FKY.night, glow: ['#cfe8ff', '#5a8ad0'], glowA: .9, fog: FFOG.night, farA: '#2a4a72', farB: '#1c3a5e', farC: '#10284a', rimC: '#7aa8d8', land: ['#1c3050', '#2c4a72', '#4a6a96'], pine: ['#06141e', '#0c2a30', '#164a44', '#2a7060'], snow: ['#243a5c', '#3a5880', '#6a8cb4', '#bcd4ec'],
    moss: ['#1c2c48', '#2c4468', '#48688c', '#7a9cc0', '#b8d4ec'], dirt: ['#10182c', '#1c2a46', '#2c4062', '#44628a', '#6a88ae'], verge: ['#10203a', '#1c3858', '#2c5478', '#4a7aa0'], fern: ['#061c20', '#0c3434', '#165048', '#2a7860', '#4aa088'],
    bark: ['#0c0a14', '#1c1626', '#30283c', '#4a3e58', '#6a5a7c'], water: ['#061c42', '#0e4478', '#2a80b8', '#c0f0ff'], cap: ['#1a4a8a', '#3a7ad0', '#7ab4f0', '#d8f0ff'], leafO: ['#2a5a8a', '#4a8ac0', '#8ac0e8', '#e8f8ff'], shroomA: .4 });
  const aurora = (c, g, Q, H) => { if (!Q.isNight) return; c.save(); for (let x = g.x0; x < g.x1; x += 1) { const t = (x - g.x0) / (g.x1 - g.x0), y0 = H * .1 + Math.sin(x / 37 + 1) * 9 + Math.sin(x / 13) * 3, len = H * .17 * (.6 + .4 * Math.sin(x / 23)); for (let k = 0; k < len; k += 1) { const u = k / len; c.globalAlpha = .34 * (1 - u) * (.5 + .5 * Math.sin(x / 9 + k / 6)); F.R_(c, x, y0 + k, 1, 1, mix('#5affc8', '#a08aff', t * .7 + u * .3)); } } c.restore(); };
  const bigPine = (c, g, Q, L, x, base, h, w, seed) => { const t = Math.max(8, Math.round(w * 1.4)); F.R_(c, x - t / 2, base, t, 24, Q.bark[1]); F.R_(c, x - t / 2, base, 2, 24, Q.bark[3]); F.R_(c, x + t / 2 - 2, base, 2, 24, Q.bark[0]); F.pine(c, x, base, h, w, Q.pine[1], Q.snow[2], 1, seed, null); };
  const FSF = {
    pal: palF, heartDy: 10, waterDy: 25, waterU: .26,
    geom(L, sw) { L.shrooms = []; },
    skyExtra(c, g, Q, L, gx, gy) { stars(c, g, Q, g.H, 80); aurora(c, g, Q, g.H); },
    far: (Q, L, H, gx) => [
      { k: .09, blur: .8, trees: { seed: 3, n: 12, fn: F.pine, base: Math.round(H * .5), jit: 4, h: 110, w: 3.6, col: Q.farA, rim: Q.rimC }, fog: [.25, .56, null, .55] },
      { k: .16, blur: .5, trees: { seed: 5, n: 8, fn: F.pine, base: Math.round(H * .56), jit: 5, h: 130, w: 5, col: Q.farB, rim: Q.rimC }, fog: [.4, .62, null, .5] },
      { k: .26, trees: { seed: 8, n: 5, fn: F.pine, base: Math.round(H * .6), jit: 5, h: 150, w: 7, col: Q.farC, rim: Q.rimC }, paint: (c, g2, Q2, L2, H2) => F.farGround(c, g2, Q2, H2), fog: [.5, .66, null, .45] },
    ],
    floor(c, g, Q, L, H) {
      const sw = L.sw, top = sw - 8, lx = L.lx, rx = L.spirit.x, R = F.rnd(5);
      F.floor(c, g, Q, L, top); F.fogBand(c, g, Q.fog, top - 10, top + 8, 0, .5);
      for (let i = 0; i < 14; i++) F.mound(c, Q, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 13, top + 2 + (i % 2) * 2, 8 + (i * 7) % 7, 2.4, 40 + i);
      for (let i = 0; i < 70; i++) { const x = g.x0 + R() * (g.x1 - g.x0), y = top + 3 + R() * (H - top), t = (y - top) / (H - top); F.R_(c, x, y, 1 + t * 2, .5, Q.snow[3]); }
      F.pool(c, Q, L, Q.water); F.plot(c, Q, L);
      bigPine(c, g, Q, L, lx + 4, sw - 14, H * .95, 9, 21); bigPine(c, g, Q, L, rx, sw - 14, H * .95, 9, 22);
      for (let i = 0; i < 9; i++) F.mound(c, Q, lx - 8 + i * 9, sw + 9 + (i % 2), 6, 2.2, 200 + i); for (let i = 0; i < 9; i++) F.mound(c, Q, rx - 36 + i * 9, sw + 10 + (i % 2), 6, 2.2, 220 + i);
    },
    near(c, g, Q, L, H) { const lx = Math.max(g.x0 + 10, L.x0 - 24); for (let i = 0; i < 9; i++) F.frond(c, Q, lx + (i - 4) * 2.4, H + 4, -Math.PI / 2 + (i - 4) * .22, 20 + (i % 4) * 5, 50 + i); for (let i = 0; i < 6; i++) F.mound(c, Q, g.x0 + 10 + i * (g.x1 - g.x0 - 20) / 5, H + 2, 14, 5, 300 + i); },
    lights: (f, g, L) => { const a = g.mood === 'night' ? .5 : g.mood === 'sunset' ? .3 : .12; return [{ x: L.spirit.x, y: L.sw - 10, r: 40, col: '#ffd890', a: a * 1.1 + .04 }, { x: L.house.x + 19, y: L.sw - 10, r: 34, col: '#ffd890', a: a * (g.mood === 'night' ? 1 : .5) }, { x: L.water.x, y: L.water.y, r: 36, col: '#a8f0ff', a: a * .5 }]; },
  };
  const arcK = ['#8aa0b8', '#d0e0f0', '#f0f8ff', '#ffffff'], hareW = ['#8a98b4', '#c8d4e8', '#eaf2fa', '#ffffff'], owlW = ['#8a98b0', '#d0dae8', '#f0f6fc', '#ffffff'], stagW = ['#4a4058', '#8a7a98', '#bcb0cc', '#eee8f4'];
  mk({
    FS: FSF, S: T => ({ wall: T.cwall, roof: T.croof, trim: T.ctrim, stone: T.stone, logs: true, snow: true, chimney: true, glow: '#ffd88a', door: '#3a2414', flowers: ['#ffffff', '#a8d4f4'] }),
    D: {
      id: 'frost', houseName: 'Your snow cabin', hutName: 'The woodshed', spiritH: .6, windowCol: '#ffd890', pulse: '#d8f4ff', waveCol: '#d8f4ff',
      sky: FKY, fog: FFOG, ramps: FR, bubble: { bg: '#f4fbff', edge: '#10304a', ink: ['#2a78c8', '#6a5ad0', '#1aa0c0', '#d05a98'] },
      pal(T, mood, MC) { T.cloth = SH.CLOTH.map(r => r.map(h => MC(h, mood))); T.orange = ['#2a6aa8', '#4a9ad8', '#8ad0f4', '#e0f8ff']; return T; },
      spiritPaint: (c, L, T) => hollowEmit(c, L.spirit.x, L.sw - 10, '#fff2b8', '#ffa850', T, '#1a0e06'),
      weather: { dir: 'down', cols: ['#ffffff', '#d8f0ff'], glow: false, depths: [{ n: 26, size: 1, dur: 16, z: 1, seed: 6, op: .8 }, { n: 12, size: 2, dur: 11, z: 3, seed: 3, op: .75, blur: 1 }] },
      spirit: { name: 'The Lantern Pine', snd: 'hum', sndK: 3, say: ['star', 'moon', 'heart', 'leaf'], hw: 30, hh: 70, glow: T => ({ col: '#ffe0a0', r: 44, a: T.mood === 'night' ? .16 : .06, dy: 14 }),
        draw(c, n, f, T, L) { const x = L.spirit.x, y = L.sw - 10; P.mandala(c, x, y - 1, 5, f, { step: 1, petals: 6, speed: 90, wave: .8, spin: 2 }); if (n.fl > .1) for (let i = 0; i < 8; i++) { const a = f / 5 + i * .785; px(c, x + Math.cos(a) * (14 + i * 2), y + Math.sin(a * 1.3) * 18, P.col(i / 8 + f / 60, .9, .8)); } } },
      nests: [{ dx: -26, yf: .62, name: 'Ice lantern' }, { dx: 26, yf: .58, name: 'Ice lantern' }], nestDraw: nestLantern('#e8ffff', '#8ad0f8', ['#3a6ab0', '#6a9ae0', '#a8caf8']),
      plants: [
        { k: 'bluebell', name: 'Frostbells', p: .15, row: 10, snd: 'chime', sndK: 2, crop: true, draw: WD.PD.bluebell }, { k: 'glowcap', name: 'Ice caps', p: .5, row: 10, snd: 'chime', sndK: 4, crop: true, draw: WD.PD.glowcap }, { k: 'moonflower', name: 'Snow moonflower', p: .85, row: 10, snd: 'chime', sndK: 6, crop: true, draw: WD.PD.moonflower },
        { k: 'fern', name: 'Frost fern', u: .2, row: 6, draw: WD.PD.fern }, { k: 'lily', name: 'Snowdrops', u: .27, row: 22, snd: 'chime', sndK: 5, draw: WD.PD.lily }, { k: 'foxglove', name: 'Winter foxglove', u: .05, row: 24, snd: 'chime', sndK: 3, draw: WD.PD.foxglove },
        { k: 'primrose', name: 'Primroses', u: .44, row: 24, snd: 'chime', sndK: 1, draw: WD.PD.primrose }, { k: 'bramble', name: 'Winter berries', u: .31, row: 9, draw: WD.PD.bramble }, { k: 'clover', name: 'Frost clover', u: .62, row: 27, draw: WD.PD.clover }, { k: 'vine', name: 'Ice vine', u: .78, row: 8, draw: WD.PD.vine },
      ],
      animals: [
        { id: 'fox', name: 'Arctic fox', mode: 'walk', u: .22, row: 15, range: 18, hw: 10, hh: 9, say: ['moon', 'heart', 'leaf'], snd: 'yip', draw: quad(arcK, { tail: { dx: 11, dy: -1, r: 3.6, ry: 2.6, K: arcK } }) },
        { id: 'hare', name: 'Snow hare', mode: 'hop', u: .09, row: 11, hw: 6, hh: 8, say: ['leaf', 'heart', 'drop'], snd: 'squeak', draw: bunny(hareW) },
        { id: 'stag', name: 'Frost stag', mode: 'walk', u: .7, row: 14, range: 14, spd: .8, hw: 12, hh: 16, magic: true, say: ['star', 'heart', 'moon'], snd: 'chime', sndK: 7, glow: T => ({ col: '#c8ecff', r: 16, a: T.lit * .3 + .1, dy: 10 }), draw: deer(stagW, { extra: antlers('#e8f4ff', '#ffffff') }) },
        { id: 'owl', name: 'Snowy owl', mode: 'still', u: .78, dy: -34, hw: 8, hh: 11, say: ['moon', 'star', 'heart'], snd: 'hoot', air: true, draw: owl(owlW) },
        hoverAnim('songbird', 'Snow bunting', { u: .5, dy: -46, hw: 7, hh: 6, snd: 'chirp', say: ['note', 'sun', 'heart'], hover: { dy: -46, rx: 38, ry: 8, sx: 41, sy: 23, jy: .5 }, draw: SH.songbird }),
        { id: 'snail', name: 'Ice snail', mode: 'crawl', u: .27, row: 30, range: 8, hw: 6, hh: 6, say: ['leaf', 'drop', 'moon'], snd: 'bloop', magic: true, draw: SH.snail },
        hoverAnim('moth', 'Aurora moth', { u: .5, dy: -44, magic: true, hw: 6, hh: 5, hover: { dy: -44, rx: 40, ry: 14, sx: 36, sy: 21, jy: 1 }, say: ['star', 'moon', 'heart'], snd: 'flutter', glow: T => ({ col: '#a8ffe0', r: 14, a: T.lit * .35 + .1, dy: 2 }), draw: WD.A.moth }),
        hoverAnim('fly0', 'Ice mote', { u: .3, dy: -16, hw: 4, hh: 4, hover: { dy: -16, rx: 28, ry: 10, sx: 17, sy: 11 }, say: ['star', 'sun'], snd: 'chime', sndK: 5, glow: T => ({ col: '#d8f4ff', r: 9, a: T.lit * .5 + .08, dy: 0 }), draw: WD.A.fly }),
      ],
      folk: [
        { id: 'fox', name: 'White fox', rank: 3, cloth: 1, draw: foxFolk(arcK, arcK, 1), u: .55, hw: 8, hh: 12, snd: 'yip', tasks: gardener },
        { id: 'hare', name: 'Snow hare', rank: 2, cloth: 0, draw: BE((n, f, T) => Object.assign({}, SH.rabbit(n, f, T), { K: hareW })), u: .5, hw: 8, hh: 14, snd: 'snuffle', tasks: waterer },
        { id: 'elder', name: 'Old bear', rank: 5, cloth: 3, draw: bearFolk(['#4a3a34', '#7a665a', '#a8907e', '#d4c0ac'], 3), u: .9, lane: 1, elder: true, hw: 12, hh: 14, snd: 'snuffle', tasks: elderTasks },
      ],
      sprites: { n: 2, name: 'Frost wisp', col: '#c8ecff', r: 12, a: .22, say: ['leaf', 'drop', 'star', 'heart', 'moon'], draw: WD.wisp },
    },
  });

  /* ======================= Hearth Hollow ======================= */
  const HSKY = { morning: ['#6a4a3a', '#8a6446', '#b08856', '#d8b070'], day: ['#5a4030', '#7a5a3c', '#a08052', '#d0a868'], sunset: ['#3a2430', '#6a3c3c', '#a8643c', '#e0985a'], night: ['#120a0e', '#22141a', '#3a2024', '#58342c'] };
  const HFOG = { morning: '#6a5040', day: '#5a4434', sunset: '#4a3030', night: '#1a1014' };
  const HR = Object.assign({}, WD.RAMPS, {
    moss: ['#14301a', '#24521e', '#3a7a2a', '#70a448'], leaf: ['#0c2814', '#1c4a22', '#2e7430', '#6aa44a'], bark: ['#2a1a10', '#5a3a22', '#8a5e38', '#c0925c'], wood: ['#3a2418', '#6a4428', '#a06c3c', '#d0a064'], stone: ['#3e3430', '#74645c', '#a8988c', '#d8ccbc'], grass: GRASS, hedge: HEDGE,
    cwall: ['#3a2416', '#5a3a22', '#7e5a34', '#a88050'], croof: ['#5a2a1a', '#8a4428', '#b86c3c', '#e09c5c'], ctrim: ['#2a1810', '#5a3a1e', '#8a5e30'], rock: ['#1c1410', '#34261c', '#52402e', '#7a6444', '#a08a5e'],
  });
  const ROCK = {
    day: ['#241a14', '#3e2e22', '#5e4a34', '#86704c', '#b09a68'], night: ['#0c0808', '#1a1210', '#2c201a', '#443226', '#64503a'],
  };
  const palH = mkPal({ sky: HSKY.day, glow: ['#fff0c0', '#ffc070'], glowA: .7, fog: HFOG.day, farA: '#6a5440', farB: '#54402e', farC: '#3e2e22', rimC: '#d8b070', land: ['#3a2a1c', '#4e3a26', '#684c30'], rock: ROCK.day, moss: ['#1c3a1a', '#2e5a24', '#4a7c32', '#80ac50', '#b0d078'], dirt: ['#2a1c12', '#4a3320', '#6e4e30', '#946c40', '#b48c58'], verge: ['#1e3a1c', '#2e5a26', '#46783a', '#6a9a50'], cap: ['#8a3a0e', '#d8761a', '#f8a838', '#ffe27a'], leafO: ['#b8501a', '#e07a22', '#f8a838', '#ffd060'] },
  { sky: HSKY.night, glow: ['#ffd890', '#a05a30'], glowA: .55, fog: HFOG.night, farA: '#2a1a1c', farB: '#201416', farC: '#160e10', rimC: '#a86a3c', land: ['#120c0a', '#1c1410', '#2a1e16'], rock: ROCK.night, moss: ['#0c1c10', '#16341a', '#244e22', '#3a7030', '#5a9444'], dirt: ['#0e0806', '#1c120c', '#2e1e14', '#46301e', '#5e4228'], verge: ['#0c1a10', '#16301a', '#244a26', '#386a3a'], cap: ['#8a3a0e', '#d8761a', '#f8a838', '#ffe27a'], leafO: ['#a8480e', '#d86a14', '#f09a24', '#ffc850'], shroomA: .5 });
  const boulder = (c, Q, x, y, rx, ry, seed) => { F.blob(c, x, y, rx + 1.2, ry + 1.2, Q.rock[0]); F.blob(c, x, y, rx, ry, Q.rock[2]); F.blob(c, x - rx * .22, y - ry * .2, rx * .72, ry * .7, Q.rock[3]); F.blob(c, x - rx * .34, y - ry * .42, rx * .38, ry * .3, Q.rock[4]); F.blob(c, x, y - ry * .86, rx * .8, ry * .28, Q.moss[2]); F.blob(c, x - rx * .12, y - ry * .94, rx * .5, ry * .16, Q.moss[3]); };
  const FSH = {
    pal: palH, heartDy: 10, waterDy: 26,
    geom(L, sw) { L.shrooms = [{ x: L.lx + 30, y: sw + 12, r: 5, h: 10 }, { x: L.lx + 40, y: sw + 15, r: 3.5, h: 7 }, { x: L.lx + 50, y: sw + 12, r: 4, h: 8 }]; L.lamps = [{ x: L.cx - 40, y: sw - 50 }, { x: L.cx + 70, y: sw - 56 }]; },
    far: (Q, L, H, gx) => [
      { k: .09, paint: (c, g2, Q2, L2, H2) => { const R = F.rnd(5), cx = gx; for (let y = g2.y0; y < g2.y1; y += .5) for (let x = g2.x0; x < g2.x1; x += .5) { const n = F.vn(x * 1.1, y * 1.1, 7, 3), d = Math.hypot((x - cx) / (g2.W * .55), (y - H2 * .42) / (H2 * .7)), t = Math.max(0, Math.min(1, 1 - d * .95 + (n - .5) * .4)); F.R_(c, x, y, .5, .5, F.pick(Q2.rock, t, x, y)); }
        for (let i = 0; i < 46; i++) { const x = g2.x0 + R() * (g2.x1 - g2.x0), y = R() * H2 * .62; F.blob(c, x, y, 3 + R() * 6, 2 + R() * 3, Q2.rock[1 + Math.floor(R() * 3)]); } } },
      { k: .16, paint: (c, g2, Q2, L2, H2) => { const sw = L2.sw, cx = gx;
        /* a round window in the wall: the weather outside */
        F.blob(c, cx + 46, H2 * .22, 17, 17, Q2.rock[0]); F.blob(c, cx + 46, H2 * .22, 15, 15, Q2.isNight ? '#142a58' : '#a8d8f0'); if (Q2.isNight) { F.blob(c, cx + 51, H2 * .2, 4, 4, '#f4f2dc'); F.blob(c, cx + 53, H2 * .19, 3.4, 3.4, '#142a58'); } else F.blob(c, cx + 41, H2 * .19, 4, 4, '#fffbe4'); F.R_(c, cx + 31, H2 * .22 - .5, 30, 1, Q2.rock[0]); F.R_(c, cx + 46 - .5, H2 * .22 - 15, 1, 30, Q2.rock[0]);
        /* a long shelf with jars and books */
        const sy = sw - 40; F.R_(c, cx - 118, sy, 80, 2.4, '#5a3a20'); F.R_(c, cx - 118, sy, 80, .8, '#8a5e38'); for (let i = 0; i < 9; i++) { const x = cx - 114 + i * 8.6, h = 5 + (i * 3 % 5), col = ['#d8683a', '#8ad060', '#f0c040', '#7ab4e8', '#c8a0e8'][i % 5]; if (i % 3 === 2) { F.R_(c, x, sy - h - 1, 3, h + 1, ['#6a2a22', '#22407a', '#3a5a2a'][i % 3]); F.R_(c, x, sy - h - 1, 1, h + 1, '#ffffff22'); } else { F.R_(c, x, sy - h, 5, h, col); F.R_(c, x, sy - h, 5, 1.2, '#ffffff66'); F.R_(c, x + 1, sy - h - 1.6, 3, 1.6, '#8a5e38'); } }
        /* herbs hanging from a beam */
        F.R_(c, cx + 62, 2, 1, 14, '#5a3a20'); for (let i = 0; i < 4; i++) { F.R_(c, cx + 62 + i * 6 - 6, 14 + (i % 2), 4, 8, ['#4a7a3a', '#6a9a48', '#8a6a3a', '#4a7a3a'][i]); } } },
      { k: .26, paint: (c, g2, Q2, L2, H2) => { const sw = L2.sw; for (const side of [-1, 1]) { const bx = side < 0 ? g2.x0 + 10 : g2.x1 - 10; for (let i = 0; i < 5; i++) boulder(c, Q2, bx + side * (-i * 4), sw - 20 - i * 24 + (i % 2) * 6, 28 - i * 2, 20, 7 + i); } } },
    ],
    floor(c, g, Q, L, H) {
      const sw = L.sw, top = sw - 8, lx = L.lx, rx = L.spirit.x, R = F.rnd(5);
      F.floor(c, g, Q, L, top); F.fogBand(c, g, Q.fog, top - 10, top + 8, 0, .3);
      for (let i = 0; i < 10; i++) F.mound(c, Q, g.x0 + 8 + i * (g.x1 - g.x0 - 16) / 9, top + 2 + (i % 2) * 2, 7 + (i * 7) % 6, 2.2, 40 + i);
      F.pool(c, Q, L, Q.water); F.plot(c, Q, L);
      /* a round rug in front of the hearth */
      F.blob(c, rx - 22, sw + 20, 26, 7, '#4a1a18'); F.blob(c, rx - 22, sw + 19.6, 24, 6, '#8a3a28'); F.blob(c, rx - 22, sw + 19.4, 18, 4.4, '#c8683a'); F.blob(c, rx - 22, sw + 19.2, 10, 2.4, '#f0b060');
      /* boulders at the left, where the cabin leans against the wall */
      boulder(c, Q, lx + 6, sw + 2, 20, 18, 3); boulder(c, Q, lx - 14, sw + 10, 16, 12, 4);
      for (const m of L.shrooms) F.shroom(c, m.x, m.y, m.r, m.h, Q, Math.round(m.x * 7), true);
      /* the hearth: a stone chimney breast, a dark opening, a mantel */
      const hw = 24, top2 = 6; for (let y = top2; y < sw + 6; y += 2) for (let x = rx - hw; x < rx + hw; x += 4) { const o = (Math.floor(y / 2) % 2) * 2, c0 = Q.rock[2 + ((x + y) % 3 === 0 ? 1 : 0)]; F.R_(c, x + o, y, 3.6, 1.8, c0); F.R_(c, x + o, y, 3.6, .6, Q.rock[4]); F.R_(c, x + o, y + 1.6, 3.6, .4, Q.rock[0]); }
      F.R_(c, rx - hw - 4, sw - 34, hw * 2 + 8, 3, Q.rock[1]); F.R_(c, rx - hw - 4, sw - 34, hw * 2 + 8, 1, Q.rock[4]);
      F.R_(c, rx - 12, sw - 22, 24, 28, '#0a0504'); F.blob(c, rx, sw - 22, 12, 8, '#0a0504'); F.R_(c, rx - 12, sw + 4, 24, 2, Q.rock[3]);
      for (let i = 0; i < 6; i++) F.R_(c, rx - 10 + i * 3.4, sw + 3.2 - (i % 2), 3, 2.4, '#6a3a1a');
    },
    near(c, g, Q, L, H) {
      /* the cave roof: dark rock with an uneven edge, roots and moss hanging */
      const R = F.rnd(11), wide = L.wide;
      for (let x = g.x0; x < g.x1; x += .5) { const e = 8 + Math.sin(x / 31) * 4 + Math.sin(x / 11) * 2 + F.vn(x, 3, 9, 4) * 3; F.R_(c, x, g.y0, .5, e, Q.rock[0]); F.R_(c, x, g.y0 + e - 1.4, .5, .8, Q.rock[2]); }
      for (let i = 0; i < 18; i++) { const x = g.x0 + R() * (g.x1 - g.x0), len = 6 + R() * 22; for (let j = 0; j < len; j++) F.R_(c, x + Math.sin(j / 4 + i) * 1.2, 10 + j, 1, 1, j % 5 === 4 ? Q.moss[3] : Q.moss[1]); }
      for (let i = 0; i < 6; i++) F.bigLeaf(c, Q, g.x1 - 8 + (i - 3) * 4, H + 3, -Math.PI / 2 + (i - 3) * .3, 14 + (i % 3) * 3, 3.2, 30 + i);
      for (let i = 0; i < 8; i++) F.frond(c, Q, g.x0 + 18 + i * 2.4, H + 4, -Math.PI / 2 + (i - 4) * .2, 20 + (i % 4) * 5, 50 + i);
    },
    lights: (f, g, L) => { const a = g.mood === 'night' ? .55 : g.mood === 'sunset' ? .45 : .3, fl = .9 + .1 * Math.sin(f / 5) + .05 * Math.sin(f / 2.3), o = [{ x: L.spirit.x, y: L.sw - 14, r: 90, col: '#ff9a40', a: a * 1.4 * fl }, { x: L.spirit.x - 22, y: L.sw + 20, r: 70, col: '#ff9a40', a: a * .7 * fl }]; for (const l of L.lamps) o.push({ x: l.x, y: l.y, r: 40, col: '#ffcf70', a: a * 1.1 }); for (const m of L.shrooms) o.push({ x: m.x, y: m.y - m.h * .7, r: 12, col: '#ffb050', a: a * .6 }); return o; },
  };
  const hearthFlame = (c, n, f, T, L) => { const x = L.spirit.x, y = L.sw + 3, t = f / 5;
    for (let k = -4; k <= 4; k++) { const h = 10 + 7 * Math.sin(t + k * 1.7) + (4 - Math.abs(k)) * 2.4 + (n.fl > .1 ? 6 : 0); for (let j = 0; j < h; j++) { const u = j / h, w = Math.max(0, 1.6 * (1 - u) + (j < 3 ? .6 : 0)), col = u < .25 ? '#fff6c0' : u < .55 ? '#ffc840' : u < .85 ? '#f06a1a' : '#b8300e'; rect(c, x + k * 2.2 - w / 2 + Math.sin(t + k + j * .2) * u * 1.4, y - j, w + .4, 1, col); } }
    for (let i = 0; i < 5; i++) { const a = (f / 40 + i * .37) % 1; px(c, x - 8 + i * 4 + Math.sin(f / 7 + i) * 3, y - 14 - a * 28, P.col(i * .13 + f / 100, .9, .65)); } };
  const tabby = ['#3a2410', '#7a4a22', '#b87c3c', '#f0d8a8'], cubK = ['#2a1810', '#5a3a22', '#8a6038', '#c8a070'], hareH = ['#4a3a30', '#8a7260', '#c0a890', '#ece0cc'], owlH = ['#3a2410', '#7a5a38', '#a88458', '#ecd8b4'];
  mk({
    FS: FSH, S: T => ({ wall: T.cwall, roof: T.croof, trim: T.ctrim, stone: T.stone, logs: true, chimney: false, glow: '#ffd88a', door: '#4a2a14', flowers: ['#ffd070', '#ff9a6a'] }),
    D: {
      id: 'hollow', houseName: 'Your nook', hutName: 'The pantry', spiritH: .6, windowCol: '#ffd890', pulse: '#ffc070', waveCol: '#ffc070',
      sky: HSKY, fog: HFOG, ramps: HR, bubble: { bg: '#fff6e4', edge: '#3a2210', ink: ['#c8581a', '#2a9a4a', '#2a8ad8', '#8a4ad0'] },
      pal(T, mood, MC) { T.cloth = SH.CLOTH.map(r => r.map(h => MC(h, mood))); T.orange = ['#c85a12', '#f08a20', '#ffc050', '#fff0c0']; T.green = SH.GREEN.map(h => MC(h, mood, .3)); return T; },
      spiritPaint: () => { },
      weather: { dir: 'up', cols: ['#ffd890', '#ffb060'], glow: true, depths: [{ n: 10, size: 1, dur: 30, z: 1, seed: 4, op: .8 }, { n: 3, size: 1, dur: 20, z: 3, seed: 8, op: .7, blur: 1 }] },
      spirit: { name: 'The Hearth', snd: 'hum', sndK: 0, say: ['sun', 'heart', 'star', 'note'], hw: 30, hh: 50, glow: T => ({ col: '#ffa850', r: 50, a: T.mood === 'night' ? .2 : .1, dy: 6 }), draw: hearthFlame },
      nests: [{ dx: -34, yf: .78, name: 'Wall lantern' }, { dx: 30, yf: .5, name: 'Wall lantern' }], nestDraw: nestLantern('#fff6c0', '#ff9a30', ['#6a3a1e', '#8a5e30', '#a88458']),
      plants: [
        { k: 'glowcap', name: 'Amber caps', p: .15, row: 10, snd: 'chime', sndK: 4, crop: true, draw: WD.PD.glowcap }, { k: 'carrot', name: SH.PLN.carrot, p: .5, row: 10, snd: 'rustle', crop: true, draw: SH.PL.carrot }, { k: 'cabbage', name: SH.PLN.cabbage, p: .85, row: 10, snd: 'rustle', crop: true, draw: SH.PL.cabbage },
        { k: 'fern', name: SH.PLN.fern, u: .56, row: 30, hw: 10, hh: 20, snd: 'rustle', draw: SH.PL.fern }, { k: 'lav', name: SH.PLN.lav, u: .2, row: 26, draw: SH.PL.lav }, { k: 'clover', name: 'Clover', u: .62, row: 27, draw: WD.PD.clover }, { k: 'primrose', name: 'Primroses', u: .44, row: 24, snd: 'chime', sndK: 1, draw: WD.PD.primrose },
        { k: 'lily', name: 'Lily of the valley', u: .27, row: 22, snd: 'chime', sndK: 5, draw: WD.PD.lily }, { k: 'berry', name: SH.PLN.berry, u: .8, row: 15, draw: SH.PL.berry }, { k: 'spore', name: SH.PLN.spore, u: .36, row: 28, hw: 10, hh: 12, snd: 'chime', sndK: 3, draw: SH.PL.spore },
      ],
      animals: [
        { id: 'cat', name: 'Hearth cat', mode: 'walk', u: .66, row: 24, range: 14, spd: .7, hw: 9, hh: 9, magic: true, say: ['heart', 'sun', 'note'], snd: 'purr', glow: T => ({ col: '#ffc070', r: 12, a: T.lit * .25 + .08, dy: 6 }), draw: BE(catSpec(tabby, {})) },
        { id: 'cub', name: 'Bear cub', mode: 'walk', u: .22, row: 18, range: 14, spd: .6, hw: 10, hh: 10, say: ['heart', 'leaf', 'drop'], snd: 'snuffle', draw: quad(cubK, { rx: 8, ry: 6, leg: 3, head: { dx: 8, dy: -2, r: 4 }, ears: [{ dx: -2, dy: -4, w: 3, h: 3, round: 1 }, { dx: 3, dy: -4, w: 3, h: 3, round: 1 }], tail: { dx: 9, dy: 1, r: 1.6 }, snout: { dx: 3, dy: 1, w: 3, h: 3, K: cubK[3] }, legs: [-5, -2, 2, 5] }) },
        { id: 'hare', name: 'Hare', mode: 'hop', u: .09, row: 11, hw: 6, hh: 8, say: ['leaf', 'heart', 'drop'], snd: 'squeak', draw: bunny(hareH) }, { id: 'owl', name: 'Owl', mode: 'still', u: .45, dy: -44, hw: 8, hh: 11, say: ['moon', 'star', 'heart'], snd: 'hoot', air: true, draw: owl(owlH) },
        { id: 'toad', name: 'Toad', mode: 'hop', u: .55, row: 30, hw: 6, hh: 7, say: ['drop', 'leaf', 'note'], snd: 'ribbit', draw: SH.toad }, { id: 'snail', name: 'Prism snail', mode: 'crawl', u: .27, row: 31, range: 8, hw: 6, hh: 6, say: ['leaf', 'drop', 'moon'], snd: 'bloop', magic: true, draw: SH.snail },
        hoverAnim('ember', 'Ember sprite', { u: .6, dy: -30, magic: true, hw: 5, hh: 5, hover: { dy: -30, rx: 34, ry: 14, sx: 30, sy: 19, jy: 1 }, say: ['star', 'sun', 'heart'], snd: 'chime', sndK: 6, glow: T => ({ col: '#ffb050', r: 12, a: T.lit * .4 + .15, dy: 0 }), draw: WD.A.fly }),
        hoverAnim('fly0', 'Firefly', { u: .3, dy: -16, hw: 4, hh: 4, hover: { dy: -16, rx: 28, ry: 10, sx: 17, sy: 11 }, say: ['star', 'sun'], snd: 'chime', sndK: 5, glow: T => ({ col: '#fff8a0', r: 9, a: T.lit * .5 + .08, dy: 0 }), draw: WD.A.fly }),
      ],
      folk: [
        { id: 'mouse', name: 'Mouse baker', rank: 3, cloth: 0, draw: SH.folkDraw(SH.mouse), u: .55, hw: 8, hh: 12, snd: 'squeak', tasks: gardener },
        { id: 'mole', name: 'Mole waterer', rank: 2, cloth: 1, draw: SH.folkDraw(SH.mole), u: .5, hw: 8, hh: 12, snd: 'snuffle', tasks: waterer },
        { id: 'elder', name: 'Old cat', rank: 5, cloth: 3, draw: catFolk(['#4a3a30', '#8a7260', '#c0a890', '#ece0cc'], 3), u: .9, lane: 1, elder: true, hw: 11, hh: 12, snd: 'purr', tasks: elderTasks },
      ],
      sprites: { n: 2, name: 'Ember', col: '#ffb050', r: 11, a: .22, say: ['sun', 'drop', 'heart', 'star'], draw: mote('#ff9a30', '#fff0b0') },
    },
  });
})();
