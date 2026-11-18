/* ---------- the realms of the layered world ----------
   Each realm is a "set": a palette for the four moods of the day, a layout (where the horizon, the floor, the house and the water sit),
   and a list of layers back to front, each with a depth factor k (how much it slides when you look around), a touch of blur, and a
   painter. Realms are built to be different places, not the same place in other colours: different shapes of land, different heroes,
   different light, different weather, different animals. See vista.js for how the layers are stacked and lit. */
(() => {
  const { mix, rnd, hsh, fbm, n1, px, rect, disk, ell, soft, ridge, hazeBottom, vgrad, crown, broadTree, pine, shroom, boulder, tuft, cloud, dith, bay, haze } = VG;
  const MOODS = ['morning', 'day', 'sunset', 'night'];
  /* turn a day colour into the mood's colour: morning warms a little, sunset goes plum and warm, night goes deep blue with a lifted cool edge */
  const moodCol = (c, mood, k) => { k = k || 1; if (mood === 'day') return c; if (mood === 'morning') return mix(c, '#ffe2b8', .13 * k); if (mood === 'sunset') return mix(mix(c, '#5c2a5a', .2 * k), '#ff9a62', .07 * k); return mix(mix(c, '#0b1236', .6 * k), '#2a4a9a', .06 * k); };
  /* a palette from a realm's recipe: sky and fog per mood, ramps (dark, mid, light) for each material. Everything LIFE and the old cliff painters read is filled in too. */
  function mkPal(B, mood) {
    const m = c => moodCol(c, mood), ramp = r => r.map(m), T = {};
    T.sky = B.sky[mood].slice(); T.fog = B.fog[mood]; T.mood = mood;
    for (const k of Object.keys(B.ramps)) T[k + 'R'] = ramp(B.ramps[k]);
    const R = B.ramps; T.leaf = m(R.leaf[1]); T.leafD = m(R.leaf[0]); T.moss = m(R.moss[1]); T.mossD = m(R.moss[0]); T.mossL = m(R.moss[2]);
    T.ground = m(R.ground[1]); T.groundD = m(R.ground[0]); T.groundL = m(R.ground[2]); T.trunk = m(R.trunk[1]); T.trunkD = m(R.trunk[0]); T.trunkL = m(R.trunk[2]);
    T.stone = m(R.stone[1]); T.stoneD = m(R.stone[0]); T.stoneL = m(R.stone[2]);
    T.far = [0, 1, 2].map(i => haze(m(R.leaf[0]), T.fog, .35 + i * .18)).reverse();
    const w = B.water; T.water = m(w[1]); T.water2 = m(w[0]); T.waterD = mix(m(w[0]), '#000000', .35); T.waterL = mix(m(w[2]), '#ffffff', .25); T.foam = mood === 'night' ? mix(m(w[2]), '#ffffff', .5) : '#f4fffb';
    T.fairy = B.fairy.slice(); T.shaft = m(B.shaft); T.shaftA = ({ morning: .2, day: .14, sunset: .2, night: .1 })[mood]; T.rune = B.rune; T.glowA = mood === 'night' ? 1 : mood === 'sunset' ? .7 : .35;
    T.stars = mood === 'night'; T.smoke = m(B.smoke || '#d8e0d8'); T.mist = ({ morning: .34, day: .22, sunset: .3, night: .3 })[mood]; T.win = '#ffe9a0'; T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .6 : 0; T.motes = mood === 'night' ? 26 : mood === 'sunset' ? 16 : 8;
    return T;
  }

  /* a band of forest: trunks with crowns high up. kind: broad | pine | shroom. depth z (0 near .. 1 far) sets the haze. */
  function forestBand(c, g, o) {
    const R = rnd(o.seed), cols = o.cols, T = g.T;
    for (let x = g.x0 - 6; x < g.x1 + 6; x += o.gap + Math.floor(R() * o.gapJ)) {
      const h = Math.round(o.hMin + R() * (o.hMax - o.hMin)), w = Math.round(o.wMin + R() * (o.wMax - o.wMin));
      if (o.kind === 'pine') pine(c, x, o.base, h, Math.round(w * 2.2), cols.leaf, R, o.snow);
      else if (o.kind === 'shroom') shroom(c, x, o.base, h, Math.round(w * 2.6), { stem: cols.trunk, cap: cols.leaf }, R, { spots: 2, spot: cols.spot });
      else broadTree(c, x, o.base, h, w, { trunk: cols.trunk, leaf: cols.leaf }, R, { crown: o.crown || Math.round(w * 2.3), limbs: o.limbs });
    }
  }

  /* what the stage always draws live: creatures and plants, fairies, drifting fog, motes */
  function commonLive(c, f, g) {
    const T = g.T, L = g.L, W = g.W, H = g.H;
    LIFE.draw(c, f, g.mood);
    for (const fy of L.fairies) {
      const a = fy.ph + f * fy.sp, x = Math.round(fy.cx + Math.cos(a) * fy.rx + Math.sin(a * 2.3) * 3), y = Math.round(fy.cy + Math.sin(a * 1.4) * fy.ry), col = T.fairy[fy.c % T.fairy.length]; fy._x = x; fy._y = y;
      fy.trail = fy.trail || []; fy.trail.push([x, y]); if (fy.trail.length > 7) fy.trail.shift();
      for (let i = 0; i < fy.trail.length - 1; i++) { if ((f + i) % 2) continue; c.globalAlpha = .12 + i * .07; c.fillStyle = col; c.fillRect(fy.trail[i][0], fy.trail[i][1] + 1, 1, 1); }
      c.globalAlpha = .7; c.fillStyle = col; c.fillRect(x - 1, y - 1, 3, 3); c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(x, y, 2, 2);
      const up = f % 2; c.globalAlpha = .9; c.fillStyle = '#eafcff'; c.fillRect(x - 2, y - 2 - up, 2, 2); c.fillRect(x + 2, y - 2 - up, 2, 2); c.fillRect(x - 3, y - 1, 1, 1); c.fillRect(x + 4, y - 1, 1, 1); c.globalAlpha = 1;
    }
    const mo = L.motes = L.motes || [];
    while (mo.length < T.motes) mo.push({ x: Math.random() * W, y: L.hz * .5 + Math.random() * (H - L.hz * .5), v: .06 + Math.random() * .18, p: Math.random() * 40, c: T.fairy[Math.floor(Math.random() * T.fairy.length)] });
    for (const m of mo) { m.y -= m.v; m.x += Math.sin((f + m.p) / 9) * .3; if (m.y < 8) { m.y = H - 2; m.x = Math.random() * W; } const tw = (f + m.p) % 30; if (tw > 24) continue; c.fillStyle = m.c; c.globalAlpha = .85; c.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); if (tw < 6) { c.globalAlpha = .4; c.fillRect(Math.round(m.x) - 1, Math.round(m.y), 3, 1); c.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 3); } c.globalAlpha = 1; }
  }
  /* fairies, shared by every layout */
  function makeFairies(g, n, x0, x1, y0, y1) { const R = rnd(13), out = []; for (let i = 0; i < n; i++) out.push({ cx: x0 + R() * (x1 - x0), cy: y0 + R() * (y1 - y0), rx: 6 + R() * 14, ry: 3 + R() * 8, sp: .03 + R() * .04, ph: R() * 6.28, c: i % 4, trail: [] }); return out; }
  window.__VSET = { moodCol, mkPal, forestBand, commonLive, makeFairies, MOODS };
})();
