/* ---------- burrows: one full-screen picture per savings bucket ----------
   A burrow is a savings goal (Rainy day, a trip, a big purchase) shown as a house in a hill in the middle of the forest scene, with its own
   look (a LOOK below: the time of day, the burrow's painting, and a live layer of weather, light and creatures drawn over the scene).
   Coins fill the door as the goal fills (pct of target). Tap the burrow for a small pop-up: saved, goal, how full and a button to add money.
   It only reads the plan (goalRows); nothing here is stored or changed. `#burrow=<goalId>` in the address opens one on load.
   A LOOK is { mood, w, h, paint(g, pct, t, k), fx: { init(k), draw(g, t, k) } }. k carries the geometry (see geom()). */
const BUR = (() => {
  let grc = null, SIGNR = null, el = null, cv = null, g = null, fxc = null, fg = null, rc = null, rg = null, bgc = null, bgg = null, bg0 = null, bg0g = null, clc = null, clg = null, bgPct = -1, pop = null, cur = null, tm = 0, k = null, t0 = 0, stockT = -1, stockStyle = 'A', pulseAt = 0, stockExtra = 0, forcePct = -1;
  const LOOKS = {};
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rows = () => { try { return goalRows(S, C, nowYm()).filter(r => r.live && r.target > 0); } catch (e) { return []; } };
  const lookOf = r => r.emergency ? 'rainy' : 'plain';
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  /* the plain look: a small mossy mound with big pixels (24 x 18, shown at 5x). One round hole in the middle of it where the money piles up as the goal fills.
     Few shapes, flat tones. Every burrow is a little different (the seed is made from the goal's id): the mound's width and height, the size and
     place of the hole, the shade of the moss, the tuft, the flower, a stone. See ART_GUIDE.md section 0, the nature rule, and its simple-icons line. */
  const seedOf = str => { let h = 7; for (const c of String(str || 'x')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) % 9973 + 1; };
  LOOKS.plain = { mood: '', w: 24, h: 18,
    paint(g, pct, t, k, night, seed) {
      const W = 24, H = 18, cx = 12, base = 15, rn = rng((seed || 1) * 977 + 13), B = PXK.B, M = PAL.moss, E = PAL.bark;
      const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); };
      /* the moss shade differs a little: greener, bluer or yellower */
      const sh = rn() * 3 | 0, off = sh === 0 ? 0 : sh === 1 ? -1 : 1, base0 = night ? 1 : 2, mo = [0, 1, 2, 3].map(i => M[Math.max(1, Math.min(6, base0 + i + off))]);
      const so = night ? [E[0], E[1], E[2]] : [E[1], E[2], E[3]];
      const pk = cx + Math.round((rn() - .5) * 2), hm = 13 + Math.round(rn()), half = 10.5 + Math.round(rn() * 1.4);
      const hh = []; for (let x = 0; x < W; x++) { const u = Math.abs(x - pk) / (x < pk ? half - .5 : half); hh[x] = u >= 1 ? 0 : Math.round(hm * Math.pow(1 - u * u, .8)); }
      for (let x = 0; x < W; x++) { const top = base - hh[x]; if (hh[x] < 1) continue; const lit = x < pk ? 0 : 1;
        for (let y = top; y <= base; y++) { const d = y - top, gd = 2 + Math.round(4 * Math.pow(hh[x] / hm, 1.3));
          if (d < gd) px(x, y, d < 1 ? mo[lit ? 3 : 2] : d < 2 ? mo[lit ? 2 : 1] : mo[lit ? 1 : 0]); else px(x, y, d > gd + 3 ? so[0] : d > gd + 1 ? so[1] : so[2]); } }
      /* the hole: a circle, a ring of earth around it, dark inside, the coins piled from the bottom */
      const r = 4 + rn() * .6, hx = cx + Math.round((rn() - .5) * 2), hy = base - 5.5, d2 = (x, y) => Math.hypot(x - hx, y - hy);
      for (let y = Math.floor(hy - r - 2); y <= Math.ceil(hy + r + 2); y++) for (let x = Math.floor(hx - r - 2); x <= Math.ceil(hx + r + 2); x++) { const d = d2(x, y); if (d <= r) px(x, y, night ? PAL.night[0] : E[0]); else if (d <= r + 1.15) px(x, y, y < hy - r * .2 ? E[1] : E[2]); }
      const lv = Math.round(Math.min(1, pct) * (2 * r - 1));
      PXK.halo(g, hx, hy + 1, 6, PAL.ember[4], .08 + .14 * Math.min(1, pct), .9);
      for (let y = Math.floor(hy + r); y > hy + r - Math.max(lv, 1) - .5; y--) for (let x = Math.floor(hx - r); x <= Math.ceil(hx + r); x++) { if (d2(x, y) > r || (y > hy + r - .5 && lv < 1)) continue; const top = y <= hy + r - lv; px(x, y, top ? PAL.gold[4] : y % 3 === 0 ? PAL.gold[2] : PAL.gold[3]); }
      if (lv < 1) px(hx, Math.round(hy + r - 1), PAL.ember[4]);
      /* a tuft, a flower, sometimes a stone, each on its own side */
      const s1 = rn() < .5 ? -1 : 1, gx = cx + s1 * (8 + (rn() * 2 | 0)), gh = 2 + (rn() * 2 | 0);
      for (let i = 0; i < gh; i++) { px(gx, base - i + 1, mo[i === gh - 1 ? 3 : 2]); if (gh > 2 && i < gh - 1) px(gx + 1, base - i + 1, mo[2]); }
      px(cx - s1 * (7 + (rn() * 2 | 0)), base - 1, [PAL.rose[4], PAL.gold[4], PAL.violet[4], PAL.ash[5]][rn() * 4 | 0]);
      if (rn() < .5) { const sx = cx - s1 * 9; px(sx, base, PAL.stone[3]); px(sx + 1, base, PAL.stone[2]); px(sx, base - 1, PAL.stone[4]); }
      for (let y = base + 1; y < H; y++) for (let x = 2; x < W - 2; x++) { const d = y - base, e = Math.min(x - 2, W - 3 - x); if (d > 1 && (e < 3 || B[y & 3][x & 3] > e + 5)) continue; px(x, y, d === 1 ? so[2] : so[1]); }
    }, fx: null };
  /* ---------- the stage: sizes, geometry, the loop ---------- */
  function build() {
    el = document.createElement('section'); el.id = 'burrowView'; el.setAttribute('aria-label', 'Burrow');
    el.innerHTML = '<button type="button" class="bv-back" aria-label="Back to home">Home</button><canvas class="bv-bg0" aria-hidden="true"></canvas><div class="bv-cloudwrap"><canvas class="bv-clouds" aria-hidden="true"></canvas></div><canvas class="bv-bg" aria-hidden="true"></canvas><canvas class="bv-ground" aria-hidden="true"></canvas><div class="bv-stage"><canvas class="bv-cv" aria-hidden="true"></canvas></div><canvas class="bv-fx" aria-hidden="true"></canvas><canvas class="bv-rain" aria-hidden="true"></canvas><button type="button" class="bv-sign" aria-label="Back to the burrow" title="Back to the burrow"></button><div class="bv-pop" hidden></div><button type="button" class="bv-nav bv-prev" aria-label="Previous burrow">&#8249;</button><button type="button" class="bv-nav bv-next" aria-label="Next burrow">&#8250;</button><nav class="bv-dots" aria-label="Burrows"></nav>';
    document.body.append(el); cv = el.querySelector('.bv-cv'); g = cv.getContext('2d'); fxc = el.querySelector('.bv-fx'); fg = fxc.getContext('2d'); rc = el.querySelector('.bv-rain'); rg = rc.getContext('2d'); bgc = el.querySelector('.bv-bg'); bgg = bgc.getContext('2d'); bg0 = el.querySelector('.bv-bg0'); bg0g = bg0.getContext('2d'); clc = el.querySelector('.bv-clouds'); grc = el.querySelector('.bv-ground'); clg = clc.getContext('2d'); pop = el.querySelector('.bv-pop');
    el.querySelector('.bv-back').addEventListener('click', close);
    el.querySelector('.bv-sign').addEventListener('click', close);
    el.querySelector('.bv-prev').addEventListener('click', () => step(-1)); el.querySelector('.bv-next').addEventListener('click', () => step(1));
    let sx0 = 0, sy0 = 0; el.addEventListener('pointerdown', e => { sx0 = e.clientX; sy0 = e.clientY; }); el.addEventListener('pointerup', e => { const dx = e.clientX - sx0, dy = e.clientY - sy0; if (Math.abs(dx) > 70 && Math.abs(dy) < 60 && !e.target.closest('.bv-pop, .bv-back, .bv-nav, .bv-dots')) step(dx < 0 ? 1 : -1); });
    document.addEventListener('keydown', e => { if (!cur) return; if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });
    el.querySelector('.bv-stage').addEventListener('click', () => { pop.hidden = !pop.hidden; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur) close(); });
    addEventListener('resize', () => { if (cur) { layout(); } });
    document.addEventListener('visibilitychange', () => { if (cur && !document.hidden) loop(); });
  }
  /* ---------- the way back: a signpost and a short road, PAINTED INTO each burrow's own world (never laid over it) ----------
     The art is drawn by drawRoad and drawSign into the same pixel grid, palette, light and layering as the rest of the world: the road is the world's
     earth with a ragged grass verge and ruts, the post has a contact shadow and grass over its foot, the wood is lit by the world's own light, and the rain
     falls in front of it. The HTML button (.bv-sign) is only an invisible hit area placed over the painted sign. See ART_GUIDE.md section 0. */
  const GL = { B: ['##.', '#.#', '##.', '#.#', '##.'], A: ['.#.', '#.#', '###', '#.#', '#.#'], C: ['.##', '#..', '#..', '#..', '.##'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], H: ['#.#', '#.#', '###', '#.#', '#.#'], E: ['###', '#..', '##.', '#..', '###'], U: ['#.#', '#.#', '#.#', '#.#', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'], W: ['#.#', '#.#', '#.#', '###', '#.#'] };
  const hsh = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263 + 1013, 1274126177); h ^= h >>> 13; return ((Math.imul(h, 1103515245) >>> 0) % 1000) / 1000; };
  /* o: { x1, y1, w1 (far end), x2, y2, w2 (near end), bend, night, wet } */
  function drawRoad(g, o) {
    const E = PAL.bark, Mo = PAL.moss, B = PXK.B, earth = o.night ? [E[0], E[1], E[2]] : [E[1], E[2], E[3]], n = Math.max(1, o.y2 - o.y1), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    const at = t => ({ xc: o.x1 + (o.x2 - o.x1) * Math.pow(t, o.bend || 1.5), w: o.w1 + (o.w2 - o.w1) * Math.pow(t, 1.25) });
    for (let y = o.y1; y <= o.y2; y++) { const t = (y - o.y1) / n, { xc, w } = at(t), xa = Math.round(xc - w / 2), xb = Math.round(xc + w / 2);
      for (let x = xa - 2; x <= xb + 2; x++) { const d = Math.min(x - xa, xb - x), h = hsh(x, y);
        if (d < -1) continue;
        if (d < 0) { if (h < .5) px(x, y, Mo[2]); continue; }
        if (d < 2) { px(x, y, h < .45 ? Mo[2] : h < .7 ? earth[0] : earth[1]); continue; }
        let c = earth[1]; if (B[y & 3][x & 3] > 11 && h > .5) c = earth[2]; if (h < .06) c = earth[0];
        if (t > .4 && (Math.abs(x - (xc - w * .25)) < .6 || Math.abs(x - (xc + w * .25)) < .6)) c = earth[0];
        if (h > .985) c = PAL.stone[3];
        if (o.wet && h > .86 && (x + y) % 2 === 0) c = PAL.rain[1];
        px(x, y, c); } }
    /* a puddle in the road that holds a little sky, when it is wet */
    if (o.wet) { const t = .66, { xc, w } = at(t), py = Math.round(o.y1 + t * n), pw = Math.max(3, Math.round(w * .28)); for (let y = -1; y <= 1; y++) for (let x = -pw; x <= pw; x++) if ((x / pw) ** 2 + (y / 1.4) ** 2 <= 1) px(Math.round(xc - w * .1) + x, py + y, y < 0 ? PAL.rain[2] : PAL.rain[1]); }
    return at;
  }
  /* o: { night, lit: -1 (light from the left) | 0 | 1 (from the right), wet, narrow }. (bx, by) is the foot of the post. Returns the hit rectangle. */
  function drawSign(g, bx, by, o) {
    const E = PAL.bark, Mo = PAL.moss, G = PAL.gold, night = !!o.night, lit = o.lit || 0, narrow = !!o.narrow, px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); };
    const wd = night ? [E[0], E[1], E[2], E[3]] : [E[1], E[2], E[3], E[4]], bw = narrow ? 40 : 58, bh = narrow ? 24 : 17, top = by - (o.gap == null ? 14 : o.gap) - bh, left = bx - Math.round(narrow ? 22 : 32);
    /* contact shadow on the ground */
    g.globalAlpha = .34; g.fillStyle = PAL.night[0]; for (let y = -1; y <= 1; y++) for (let x = -7; x <= 7; x++) if ((x / 7) ** 2 + (y / 1.6) ** 2 <= 1) g.fillRect(bx + x + (lit ? -lit * 2 : 0), by + y, 1, 1); g.globalAlpha = 1;
    /* the post: lit on one side, dark on the other, with grain */
    for (let y = top + bh - 2; y <= by; y++) { px(bx - 1, y, lit === 1 ? wd[1] : wd[2]); px(bx, y, wd[1]); px(bx + 1, y, lit === 1 ? wd[2] : wd[0]); if (hsh(bx, y) < .18) px(bx, y, wd[0]); }
    if (lit) for (let y = top + bh; y <= by; y += 1) px(bx + lit, y, wd[2]);
    px(bx - 2, by, wd[0]); px(bx + 2, by, wd[0]);
    /* the board: an arrow pointing left, with plank seams, grain, nails, moss on top and a rim of the world's light */
    const tip = narrow ? 4 : 5, mid = top + (bh >> 1);
    for (let y = top; y < top + bh; y++) { const x0 = left + Math.max(0, tip - Math.abs(y - mid)), x1 = left + bw - 1;
      for (let x = x0; x <= x1; x++) { const h = hsh(x, y); let c = wd[1];
        if (y === top) c = wd[3]; else if (y === top + bh - 1) c = wd[0]; else if ((y - top) % 5 === 0) c = wd[0]; else if (h < .08) c = wd[0]; else if (h > .94) c = wd[2];
        if (x === x0 && y !== top && y !== top + bh - 1) c = wd[2]; if (x === x1) c = lit === 1 ? wd[2] : wd[0];
        if (lit === 1 && x === x1 - 1 && y > top && y < top + bh - 1) c = wd[2]; if (lit === -1 && x === x0 + 1 && y > top) c = wd[2];
        px(x, y, c); } }
    [[left + bw - 4, top + 2], [left + bw - 4, top + bh - 3], [left + (narrow ? 10 : 12), top + 2]].forEach(([x, y]) => px(x, y, PAL.ash[3]));
    for (let x = left + 8; x < left + bw - 3; x++) { const h = hsh(x, 7); if (h < .42) { px(x, top - 1, Mo[h < .2 ? 3 : 2]); if (h < .12) px(x, top - 2, Mo[3]); } }
    if (o.wet) for (let x = left + 6; x < left + bw - 2; x++) if (hsh(x, 9) < .1) px(x, top + bh, PAL.rain[2]);
    /* its words (the small pixel alphabet), a little dry-brushed, and the arrow */
    const ink = G[3], word = (str, x, y) => { for (const ch of str) { if (GL[ch]) GL[ch].forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') px(x + i, y + j, ink); }); x += 4; } };
    if (narrow) { word('BACK', left + 13, top + 3); word('TO THE', left + 13, top + 9); word('BURROW', left + 13, top + 15); for (let i = 0; i < 5; i++) px(left + 5 + i, mid, ink); px(left + 6, mid - 1, ink); px(left + 6, mid + 1, ink); px(left + 7, mid - 2, ink); px(left + 7, mid + 2, ink); }
    else { word('BACK TO', left + 15, top + 3); word('THE BURROW', left + 15, top + 9); for (let i = 0; i < 6; i++) px(left + 6 + i, mid, ink); px(left + 7, mid - 1, ink); px(left + 7, mid + 1, ink); px(left + 8, mid - 2, ink); px(left + 8, mid + 2, ink); }
    /* grass and a fern growing over the foot of the post, in front of it */
    for (let i = -6; i <= 6; i++) { const h = hsh(bx + i, 3); if (h < .62) { const len = 2 + Math.round(h * 6); for (let j = 0; j < len; j++) px(bx + i + (j > 2 ? (i < 0 ? -1 : 1) : 0), by + 1 - j, Mo[j === len - 1 ? 4 : j > 1 ? 3 : 2]); } }
    return { x: left - 1, y: top - 2, w: bw + 3, h: by - top + 4 };
  }
  /* the world for a look that has no picture of its own: the forest. The road is the same earth as the mound, leaving from its foot toward the viewer, in
     the forest's own light (the time of day tints it) with the grass of the forest growing over its edges and over the foot of the post. */
  function groundPaint(g, k) {
    const W = k.W, H = k.H, phone = W < 120, narrow = true, x0 = Math.round(k.x0 + 12), y0 = Math.round(k.ground) - 3, night = false, tod = document.documentElement.dataset.tod || 'day';
    g.clearRect(0, 0, W, H);
    const at = drawRoad(g, { x1: x0, y1: y0, w1: 5, x2: Math.round(x0 - Math.min(W * .3, 60)), y2: H + 2, w2: 34, bend: 1.5, night, wet: false });
    const t = .62, c = at(t), by = phone ? H - 3 : Math.round(y0 + t * (H + 2 - y0)), bx = phone ? 25 : Math.max(25, Math.round(c.xc - c.w / 2 - 5));
    const hit = drawSign(g, bx, by, { night, lit: 0, wet: false, narrow, gap: phone ? 3 : 14 });
    /* tall grass of the forest in front of the road's edges and across its near corners, so the road sits in the meadow and not on it */
    { const Mo = PAL.moss, blade = (x, y, h, lean) => { for (let i = 0; i < h; i++) { g.fillStyle = Mo[i === h - 1 ? 5 : i > h * .5 ? 4 : 3]; g.fillRect(x + Math.round(lean * Math.pow(i / h, 2) * 3), y - i, 1, 1); } };
      for (let i = 0; i < 26; i++) { const u = .25 + hsh(i, 11) * .75, cc = at(u), side = i % 2 ? 1 : -1, x = Math.round(cc.xc + side * (cc.w / 2 + (hsh(i, 12) - .5) * 4)), y = Math.round(y0 + u * (H + 2 - y0)), n = 3 + Math.floor(hsh(i, 13) * 4); for (let q = 0; q < n; q++) { const bxx = x + q - (n >> 1); if (bxx >= hit.x - 1 && bxx <= hit.x + hit.w && y + 1 >= hit.y && y - 8 <= hit.y + hit.h) continue; blade(bxx, y + 1, 4 + Math.round(hsh(i + q, 14) * (4 + u * 8)), (hsh(i, q) - .5) * 2.4); } } }
    /* the forest's light over it: the same tint the scene is under */
    const tint = { night: 'rgba(14,28,70,.42)', sunset: 'rgba(255,140,60,.16)', morning: 'rgba(255,200,150,.08)' }[tod];
    if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    return hit;
  }
  /* the invisible hit area goes exactly over the painted sign */
  function placeSign() { const b = el.querySelector('.bv-sign'); if (!SIGNR || !k) { b.style.display = 'none'; return; } b.style.display = 'block'; b.style.left = SIGNR.x * k.S + 'px'; b.style.top = SIGNR.y * k.S + 'px'; b.style.width = SIGNR.w * k.S + 'px'; b.style.height = SIGNR.h * k.S + 'px'; }
  function placeGround(L) { if (L.bg) { grc.style.display = 'none'; SIGNR = L.sign ? L.sign() : null; } else { grc.style.display = 'block'; grc.width = k.W; grc.height = k.H; grc.style.width = k.W * k.S + 'px'; grc.style.height = k.H * k.S + 'px'; SIGNR = groundPaint(grc.getContext('2d'), k); } placeSign(); }
  /* sizes: one art pixel is S screen pixels; the weather layer uses the same pixel. The burrow stands on the ground at 80% of the height. */
  function layout() {
    const L = LOOKS[LK], vw = innerWidth, vh = innerHeight, S = Math.max(2, Math.min(Math.round(vh / 150), Math.floor(vw * .94 / L.w)));
    cv.width = L.w; cv.height = L.h; cv.style.width = L.w * S + 'px'; cv.style.height = L.h * S + 'px';
    const stage = el.querySelector('.bv-stage'), baseY = Math.round(vh * .8); stage.style.top = (baseY - L.h * S + (L.sink || 0) * S) + 'px'; stage.style.left = Math.round(vw / 2 - L.w * S / 2) + 'px';
    const Wf = Math.ceil(vw / S), Hf = Math.ceil(vh / S); fxc.width = Wf; fxc.height = Hf; fxc.style.width = Wf * S + 'px'; fxc.style.height = Hf * S + 'px';
    /* the rain is drawn finer than the house, so the drops are thin */
    const Sr = S, Wr = Math.ceil(vw / Sr), Hr = Math.ceil(vh / Sr); rc.width = Wr; rc.height = Hr; rc.style.width = Wr * Sr + 'px'; rc.style.height = Hr * Sr + 'px';
    const left = Math.round(vw / 2 - L.w * S / 2) / S, top = (baseY - L.h * S + (L.sink || 0) * S) / S;
    k = { S, Sr, Wr, Hr, f: S / Sr, W: Wf, H: Hf, x0: left, y0: top, ground: baseY / S, vw, vh, wide: vw >= 760, rnd: rng(7) };
    pop.style.cssText = k.wide ? `left:${Math.round(vw / 2 + L.w * S / 2 + 18)}px;top:${Math.round(vh * .34)}px;transform:none` : `left:50%;top:max(56px,calc(env(safe-area-inset-top) + 52px));transform:translateX(-50%)`;
    if (L.fx) L.fx.init(k);
    placeGround(L);
    /* a look with its own world covers the forest scene; the clouds drift on a picture twice as wide */
    const has = !!L.bg; el.classList.toggle('has-bg', has);
    if (has) { bg0.width = Wf; bg0.height = Hf; bg0.style.width = Wf * S + 'px'; bg0.style.height = Hf * S + 'px'; bgc.width = Wf; bgc.height = Hf; bgc.style.width = Wf * S + 'px'; bgc.style.height = Hf * S + 'px'; clc.width = Wf * 2; clc.height = Hf; clc.style.width = Wf * 2 * S + 'px'; clc.style.height = Hf * S + 'px'; clc.parentNode.style.setProperty('--cw', Wf * S + 'px'); bgPct = -1; }
  }
  let LK = 'plain';
  function fill() {
    const all = rows(), r = all.find(x => x.id === cur) || all[0]; if (!r) return;
    cur = r.id; const pct = Math.min(1, r.saved / r.target); LK = LOOKS[lookOf(r)] ? lookOf(r) : 'plain';
    pop.innerHTML = `<h2>${esc(r.name)}</h2><p class="bv-n"><b>${fmt(r.saved)}</b> of ${fmt(r.target)}</p><div class="bv-bar" role="img" aria-label="${Math.round(pct * 100)} percent full"><i style="width:${Math.round(pct * 100)}%"></i></div><p class="bv-s">${Math.round(pct * 100)}% full</p><button type="button" class="btn bv-add">Add money</button>`;
    pop.querySelector('.bv-add').addEventListener('click', e => { e.stopPropagation(); close(); switchTab('receipts'); });
    el.querySelector('.bv-dots').innerHTML = all.map(x => `<button type="button" data-b="${esc(x.id)}" aria-label="${esc(x.name)}" aria-current="${x.id === cur}"></button>`).join('');
    el.querySelectorAll('.bv-dots button').forEach(b => b.addEventListener('click', () => open(b.dataset.b)));
    try { if (!LOOKS[LK].bg) SCENE.look(LOOKS[LK].mood || ''); } catch (e) { /* the world is a bonus */ }
    return { pct, r };
  }
  function frame(now) {
    const L = LOOKS[LK], t = now - t0, rr = rows().find(x => x.id === cur); if (!rr) return;
    const pct = Math.min(1, Math.max(0, (forcePct >= 0 ? forcePct : rr.saved / rr.target) + stockExtra));
    if (L.bg && Math.floor(pct * 10) !== bgPct) { bgPct = Math.floor(pct * 10); L.bg(bg0g, clg, bgg, k, pct); if (L.sign) { SIGNR = L.sign(); placeSign(); } }
    g.clearRect(0, 0, L.w, L.h); L.paint(g, pct, t, k, false, seedOf(cur));
    fg.clearRect(0, 0, k.W, k.H); rg.clearRect(0, 0, k.Wr, k.Hr);
    if (L.fx) L.fx.draw(fg, t, k, { rg, pct, pulse: pulseAt, stock: stockT >= 0 ? now - stockT : -1, style: stockStyle });
    if (stockT >= 0) {
      const dt = now - stockT; if (dt > SQ.END + 200) { stockT = -1; stockExtra = 0; }
      else { const door = L.door ? L.door(k) : { x: k.x0 + L.w / 2 }; if (dt > SQ.T.crouch + 700) stockExtra = .035 * Math.min(1, (dt - SQ.T.crouch - 700) / 400); fg.save(); SQ.frame(fg, dt, stockStyle, { W: k.W, base: Math.round(k.ground) - 1, dx: Math.round(door.x), tint: L.tint, shadow: true }); fg.restore(); }
    }
  }
  function loop() { clearTimeout(tm); if (!cur || document.hidden) return; frame(performance.now()); tm = setTimeout(loop, reduced() ? 400 : 66); }
  function step(d) { const all = rows(); if (all.length < 2) return; const i = all.findIndex(x => x.id === cur); open(all[(i + d + all.length) % all.length].id); }
  function open(id) {
    if (el && !el.hidden && cur && cur !== id && !reduced()) { el.style.opacity = 0; clearTimeout(tm); setTimeout(() => { open2(id); el.style.opacity = 1; }, 240); return; }
    open2(id);
  }
  function open2(id) {
    if (!el) build(); cur = id; const f = fill(); if (!f) { cur = null; return; }
    document.body.classList.add('bv-on'); el.hidden = false; pop.hidden = false; t0 = performance.now(); layout(); loop();
  }
  function close() { cur = null; clearTimeout(tm); if (el) el.hidden = true; document.body.classList.remove('bv-on'); try { SCENE.look(''); } catch (e) { } }
  /* the squirrel stocks the burrow: call this after money has gone into the burrow */
  function stock(style) { if (!cur) return; stockT = performance.now(); stockStyle = style || 'A'; pulseAt = stockT + SQ.T.crouch + 700; }
  /* ---------- Home: one picture with a burrow for each savings bucket, how full it is, a short note and the play money number ---------- */
  function home() {
    const el0 = document.querySelector('#hBur'); if (!el0) return; const all = rows();
    if (!all.length) { el0.hidden = true; return; } el0.hidden = false;
    const pc = r => Math.min(1, r.saved / r.target), full = all.find(r => pc(r) >= 1), near = all.filter(r => pc(r) < 1).sort((a, b) => pc(b) - pc(a))[0];
    let note = full ? `${full.name} is full.` : near ? `${near.name} is closest, ${Math.round(pc(near) * 100)}% full.` : '';
    let wk = ''; try { wk = streakInfo().done ? 'This week: receipts logged.' : 'No receipts logged this week yet.'; } catch (e) { }
    let play = ''; try { const f = planFacts(); if (f && typeof f.play === 'number') play = `Play money left this month: <b>${fmt(f.play)}</b>`; } catch (e) { }
    el0.innerHTML = '<div class="hb-scene">' + all.map(r => `<button type="button" class="hb-b" data-b="${esc(r.id)}" aria-label="${esc(r.name)}, ${Math.round(pc(r) * 100)} percent full. Open"><canvas width="24" height="18" aria-hidden="true"></canvas><span class="hb-n">${esc(r.name)}</span><span class="hb-bar"><i style="width:${Math.round(pc(r) * 100)}%"></i></span><span class="hb-p">${Math.round(pc(r) * 100)}% full</span></button>`).join('') + '</div>'
      + `<p class="hb-note">${esc(note)} ${esc(wk)}</p>` + (play ? `<p class="hb-play">${play}</p>` : '');
    el0.querySelectorAll('.hb-b').forEach((bt, i) => { const r = all[i], c = bt.querySelector('canvas').getContext('2d'); LOOKS.plain.paint(c, pc(r), 0, null, lookOf(r) === 'rainy', seedOf(r.id)); });
    if (!el0._w) { el0._w = 1; el0.addEventListener('click', e => { const bt = e.target.closest('.hb-b'); if (bt) open(bt.dataset.b); }); }
  }
  function boot() { const m = location.hash.match(/burrow=([\w-]+)/); if (m) setTimeout(() => open(m[1]), 1200); }
  if (/[?&]burrowtest\b/.test(location.search)) window.__bur = { LOOKS, seedOf, open, close, rows, stock, k: () => k, force: p => { forcePct = p; } };
  return { open, close, boot, rows, stock, home, step, LOOKS, rng, drawRoad, drawSign };
})();
