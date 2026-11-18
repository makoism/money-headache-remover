/* ---------- NK.den: a realm as a lit chamber ----------
   You look into one small room, a burrow or hollow or cavern or grotto, cut open like a doll's house. Four layers, back to front:
     sky + far   only visible through the round daylight door in the back wall (the one window onto the outside)
     wall        the back wall of the chamber, painted flat then lit by the chamber's coloured lights (lantern, door, Spirit)
     stage       floor, goal house, landmark (lit the same way), and every living thing (ECO draws them live)
     ring        the dark earth around the opening of the chamber, with the rim lit from inside, roots hanging in
     fg          a blurred leaf or root at the very edge, so it feels like you are peeking in
   A realm gives NK.den a definition D (same as NK.realm plus):
     cav{rx,ry,bump,ph}   door(L,H) -> {x,y,rx,ry}   lit(T,L,H) -> {Ls:[{x,y,r,a,col,sy}], amb:[r,g,b], ambStage:[r,g,b]}
     wallK(T) -> 5 albedo tones, dark..light       wallDeco(c,g,T,L,E)  before lighting     wallEmit(c,g,T,L,E)  after lighting (lamps, glowing things)
     floorK(T) -> 5 tones       groundDeco(c,g,T,L,H)       stageEmit(c,g,T,L)
     ringK(T) -> 4 tones        ringDeco(c,g,T,L,E)         doorFrame(T) -> 3 tones
   E is {cav, door, inDoor, cx, cy, rx, ry, sw}. */
/* the big trunk both the Heart Tree and the willow stand on: ridged bark lit from the left, roots across the floor, moss in the folds */
NK.bigTrunk = (c, x, base, K, MK, o) => {
  o = o || {}; const { px, rect, ell, rnd, hsh } = VG, w0 = o.w || 8;
  NK.shadow(c, x, base, w0 * 3.4, .32);
  for (let y = -6; y <= base; y++) {
    const t = (base - y) / base, hw = w0 + Math.round(Math.pow(1 - Math.min(1, (base - y) / 26), 3) * 7) + Math.round(Math.sin(y / 23) * 1.2) + (t > .9 ? 3 : 0);
    for (let xx = -hw; xx <= hw; xx++) { const u = xx / hw, ridge = NK2.vn(xx * 1.7 + 40, y * .09, 1, 6), k = (u < -.55 ? 2.9 : u < -.1 ? 2.1 : u < .4 ? 1.3 : .35) + (ridge - .5) * 1.6 + (hsh(xx, y >> 1, 3) - .5) * .5; c.fillStyle = K[Math.max(0, Math.min(3, Math.round(k)))]; c.fillRect(x + xx, y, 1, 1); }
    px(c, x - hw, y, K[0]); px(c, x + hw, y, K[0]);
  }
  for (const [dx, d, len] of [[-8, -1, 34], [8, 1, 36], [-4, -1, 22], [5, 1, 24], [-10, -1, 18]]) for (let j = 0; j < len; j++) { const yy = base - Math.floor(j / 11), w = Math.max(1, 4 - Math.floor(j / 8)); rect(c, x + dx + d * j, yy - w + 1, 1, w + 1, j % 5 ? K[1] : K[0]); rect(c, x + dx + d * j, yy - w, 1, 1, K[2]); }
  for (let k = 0; k < 7; k++) { const ry = base - 22 - k * 13, sd = k & 1 ? 1 : -1; ell(c, x + sd * (w0 - 1), ry, 3, 2, MK[1 + (k & 1)]); px(c, x + sd * (w0 - 1) - 1, ry - 1, MK[3]); }
  for (let k = 0; k < 6; k++) { const yy = 8 + k * 6; for (let j = 0; j < 10 + k * 3; j++) px(c, x + (k & 1 ? 1 : -1) * (w0 + j), yy + Math.round(j * .45), K[1 + (j % 3 === 0 ? 1 : 0)]); }
};
NK.den = D => {
  const { rnd, hsh, px, rect, disk, ell, mix } = VG;
  D.rim = null;
  const geomIn = D.geom;
  D.geom = (L, G0, H) => {
    const W = G0.W, c = D.cav || {}, rx = Math.min(Math.round(W * .5) - (L.wide ? 6 : 2), c.rx || 126), ry = Math.round(H * (c.ry || .47)), cy = Math.round(H * (c.cy || .5));
    const cav = NK2.shape({ cx: L.cx, cy, rx, ry, bump: c.bump == null ? .07 : c.bump, ph: c.ph });
    const dr = D.door(L, H), inDoor = (x, y) => { const a = (x - dr.x) / dr.rx, b = (y - dr.y) / dr.ry, r = a * a + b * b; return r; };
    L.E = { cav, door: dr, inDoor, cx: L.cx, cy, rx, ry, sw: L.sw, W, H };
    if (geomIn) geomIn(L, G0, H);
  };
  D.layersFn = (g, { T, L, H, stageLayer }) => {
    const E = L.E, W = g.W, sw = L.sw, LT = D.lit(T, L, H), Ls = LT.Ls, cav = E.cav, door = E.door;
    const wk = D.wallK(T), fk = D.floorK(T), rk = D.ringK(T), dk = D.doorFrame ? D.doorFrame(T) : [wk[1], wk[2], wk[3]];
    const wallLayer = {
      id: 'wall', k: .3, paint(c, g2) {
        const R = rnd(21);
        for (let y = g2.y0; y < g2.y1; y++) for (let x = g2.x0; x < g2.x1; x++) {
          const s = cav(x, y), dd = E.inDoor(x, y); if (s >= 1.02 || dd < 1) continue;
          let col;
          if (dd < 1.22) col = dk[dd < 1.09 ? 0 : dd < 1.16 ? 1 : 2];
          else {
            const v = NK2.vn(x, y, 11, 3) * .55 + NK2.vn(x, y, 4, 7) * .3 + NK2.vn(x, y, 2, 9) * .15 + (y - sw) * .002, ed = Math.max(0, s - .78) * 1.6;
            const k = Math.max(0, Math.min(.999, v * 1.05 - ed * .5 + (hsh(x, y, 4) - .5) * .12));
            col = wk[Math.floor(k * wk.length)];
          }
          c.fillStyle = col; c.fillRect(x, y, 1, 1);
        }
        if (D.wallDeco) D.wallDeco(c, g2, T, L, E, R);
        NK2.light(c, g2, Ls, LT.amb, { steps: LT.steps || 6, gain: LT.gain });
        if (D.wallEmit) D.wallEmit(c, g2, T, L, E, R);
      },
    };
    const stagePaint = stageLayer.paint;
    const stageL = Object.assign({}, stageLayer, {
      paint(c, g2) {
        stagePaint(c, g2);
        NK2.light(c, g2, Ls, LT.ambStage || LT.amb.map(v => v + .22), { steps: LT.steps || 6, gain: LT.gain, y0: sw - 60 });
        if (D.stageEmit) D.stageEmit(c, g2, T, L);
      },
    });
    const ringLayer = {
      id: 'ring', k: .95, paint(c, g2) {
        const R = rnd(31);
        for (let y = g2.y0; y < g2.y1; y++) for (let x = g2.x0; x < g2.x1; x++) {
          const s = cav(x, y); if (s < 1) continue;
          const dist = (s - 1) * E.rx, k = NK2.vn(x, y, 6, 5) * .6 + NK2.vn(x, y, 2, 8) * .4, ed = dist < 2 ? 3 : dist < 4 ? 2 : (k > .55 ? 1 : 0);
          c.fillStyle = rk[Math.min(rk.length - 1, ed)]; c.fillRect(x, y, 1, 1);
        }
        if (D.ringDeco) D.ringDeco(c, g2, T, L, E, R);
        NK2.light(c, g2, Ls.map(l => Object.assign({}, l, { a: l.a * .75 })), LT.ambRing || LT.amb.map(v => v * .55), { steps: 5, gain: 1.25 });
      },
    };
    return [
      D.skyLive ? { id: 'sky', k: .04, paint: (c, g2) => D.paintSky(c, g2, T, L), live: (c, f, g2) => D.skyLive(c, f, g2, T, L) } : { id: 'sky', k: .04, paint: (c, g2) => D.paintSky(c, g2, T, L) },
      { id: 'far', k: .12, blur: 1, paint: (c, g2) => D.paintFar(c, g2, T, L) },
      wallLayer, ...(D.liveBack ? [{ id: 'wallLive', k: .3, paint() {}, live: (c, f, g2) => D.liveBack(c, f, g2, T, L, E) }] : []), stageL, ringLayer,
      { id: 'fg', k: 1.8, blur: 2.6, op: .9, paint: (c, g2) => D.fg(c, g2, T, L, H, g.W) },
    ];
  };
  if (!D.ground) D.ground = (c, g, T, L, H) => {
    const sw = L.sw, fk = D.floorK(T);
    for (let y = sw - 2; y < g.y1; y++) { const t = (y - sw) / (H - sw + 6); for (let x = g.x0; x < g.x1; x++) { const n = NK2.vn(x, y * 2, 7, 4) * .5 + NK2.vn(x, y, 2, 6) * .3 + t * .25 + (y - sw < 2 ? -.2 : 0), k = Math.max(0, Math.min(.999, n * 1.15 - .1)); c.fillStyle = fk[Math.floor(k * fk.length)]; c.fillRect(x, y, 1, 1); } }
    if (D.groundDeco) D.groundDeco(c, g, T, L, H);
  };
  NK.realm(D);
};
