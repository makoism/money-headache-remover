/* ---------- burrows: one full-screen picture per savings bucket ----------
   A burrow is a savings goal (Rainy day, a trip, a big purchase) shown as a house in a hill in the middle of the forest scene, with its own
   look (a LOOK below: the time of day, the burrow's painting, and a live layer of weather, light and creatures drawn over the scene).
   Coins fill the door as the goal fills (pct of target). Tap the burrow for a small pop-up: saved, goal, how full and a button to add money.
   It only reads the plan (goalRows); nothing here is stored or changed. `#burrow=<goalId>` in the address opens one on load.
   A LOOK is { mood, w, h, paint(g, pct, t, k), fx: { init(k), draw(g, t, k) } }. k carries the geometry (see geom()). */
const BUR = (() => {
  let anim = null, sparks = [], danceT = -1, grc = null, SIGNR = null, el = null, cv = null, g = null, fxc = null, fg = null, rc = null, rg = null, bgc = null, bgg = null, bg0 = null, bg0g = null, clc = null, clg = null, bgPct = -1, pop = null, cur = null, tm = 0, k = null, t0 = 0, stockT = -1, stockStyle = 'A', pulseAt = 0, stockExtra = 0, forcePct = -1;
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
      const pk = 11 + (rn() * 2 | 0), hm = 13 + Math.round(rn()), half = 9.5 + Math.round(rn() * 1.2);
      const hh = []; for (let x = 0; x < W; x++) { const u = Math.abs(x - pk) / half; hh[x] = u >= 1 ? 0 : Math.round(hm * Math.pow(1 - u * u, .8)); }
      for (let x = 0; x < W; x++) { const top = base - hh[x]; if (hh[x] < 1) continue; const lit = x < pk ? 0 : 1;
        for (let y = top; y <= base; y++) { const d = y - top, gd = 2 + Math.round(4 * Math.pow(hh[x] / hm, 1.3));
          if (d < gd) px(x, y, d < 1 ? mo[lit ? 3 : 2] : d < 2 ? mo[lit ? 2 : 1] : mo[lit ? 1 : 0]); else px(x, y, d > gd + 3 ? so[0] : d > gd + 1 ? so[1] : so[2]); } }
      /* the hole: a circle, a ring of earth around it, dark inside, the coins piled from the bottom */
      const r = 4 + rn() * .6, hx = pk, hy = base - 5.5, d2 = (x, y) => Math.hypot(x - hx, y - hy);
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
  /* ---------- the rooms: a chamber dug in the earth with a pile of coins in it, for money that is not a goal (Bills and basics, Free to spend, Education, Giving, Investing).
     24 x 18 art pixels, shown at 5x like the mounds. Soil is bark, coins are gold, and each room has one small thing of its own in one more ramp (a house, a pouch, a book, a heart,
     a sprout), so every tile uses three ramps. The pile climbs in five steps. Each room is a little different (seed from its id): the hollow's size and lean, a root, a stone in the soil. ---------- */
  const GLYPH = {
    nec:  { ramp: 'ember',  rows: ['..l..', '.lml.', 'lmmml', 'mdodm', 'mmmmm'] },
    play: { ramp: 'gold',   rows: ['.m.m.', '.lml.', 'lmmmd', 'mmmdd', '.mdd.'] },
    edu:  { ramp: 'rain', rows: ['lmmm.', 'mlllm', 'mlllm', 'mlllm', 'dmmm.'] },
    give: { ramp: 'ash',    rows: ['.l.l.', 'lmmmd', 'mmmmd', '.mmd.', '..d..'] },
    pay:  { ramp: 'gold',   rows: ['.lll.', 'lmmml', 'mmhmm', 'mmmmd', '.ddd.'] },
    goal: { ramp: 'teal',   rows: ['..l..', '.lml.', 'lmmml', '..d..', '..d..'] },
    ffa:  { ramp: 'moss',   rows: ['l...l', 'mm.mm', '.mmm.', '..m..', '..d..'] }
  };
  /* Free to spend is a treasure chest: an open wooden chest with iron bands and a gold lock, coins heaped in the mouth. The heap climbs in five steps (fill 0 to 1).
     24 x 18 art pixels, bark for the wood, stone for the iron, gold for the coins and lock, a 1 px outline in the darkest bark, light from the top left. */
  const paintChest = (g, fill) => {
    const B = PAL.bark, G = PAL.gold, S = PAL.stone; g.clearRect(0, 0, 24, 18);
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    const row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); };
    /* contact shadow */
    row(17, 4, 19, B[0]);
    /* the open lid, seen from inside: outline, dark wood, a lighter panel, an iron rim on top */
    for (let y = 1; y <= 8; y++) { const x0 = y === 1 ? 5 : 4, x1 = y === 1 ? 18 : 19; row(y, x0, x1, B[0]); }
    for (let y = 2; y <= 8; y++) { const x0 = y === 2 ? 6 : 5, x1 = y === 2 ? 17 : 18; row(y, x0, x1, B[1]); }
    for (let y = 3; y <= 7; y++) row(y, 7, 16, B[2]);
    row(3, 7, 16, B[3]); px(7, 3, B[4]); px(8, 3, B[4]);   /* a lit top edge on the panel */
    row(2, 6, 17, S[3]); row(2, 6, 8, S[4]);               /* the iron rim of the lid */
    /* the coin heap in the mouth, climbing in five steps, then a few sparkles */
    const lv = fill > 0 ? Math.max(1, Math.round(Math.min(1, fill) * 5)) : 0, W = [14, 12, 9, 6, 3];
    for (let r = 0; r < lv; r++) { const w = W[r], x0 = 12 - (w >> 1), y = 8 - r;
      for (let i = 0; i < w; i++) px(x0 + i, y, r === lv - 1 ? G[3] : (i + r) % 3 === 0 ? G[1] : G[2]); }
    if (lv > 0) { px(10 + (lv > 2 ? 1 : 0), 8 - lv, G[4]); if (lv > 3) px(13, 8 - lv + 1, G[4]); } else px(11, 8, G[1]);
    /* the chest body: outline, planks lit from the left, vertical plank lines */
    for (let y = 9; y <= 16; y++) row(y, 2, 21, B[0]);
    for (let y = 9; y <= 15; y++) { row(y, 3, 20, B[3]); px(3, y, B[4]); px(4, y, B[4]); px(20, y, B[2]); px(19, y, B[2]); }
    row(9, 3, 20, B[4]);                                    /* the lit rim where the lid meets the box */
    for (let y = 10; y <= 15; y++) { px(10, y, B[2]); px(14, y, B[2]); }
    row(15, 3, 20, B[2]);                                   /* the foot in shade */
    /* two iron bands, with a bright edge on the left of each */
    [[5, 6], [17, 18]].forEach(([a, b]) => { for (let y = 9; y <= 15; y++) { px(a, y, S[4]); px(b, y, S[2]); } px(a, 9, S[4]); px(b, 9, S[3]); px(a, 15, S[3]); px(b, 15, S[1]); });
    /* the gold lock with a keyhole */
    for (let y = 11; y <= 14; y++) row(y, 11, 13, G[3]); row(11, 11, 13, G[4]); row(14, 11, 13, G[2]);
    px(12, 12, B[0]); px(12, 13, B[0]);
    /* rim studs on the band tops */
    px(5, 9, G[4]); px(18, 9, G[3]);
  };
  LOOKS.room = { w: 24, h: 18,
    paint(g, fill, kind, seed, over) { this.paint0(g, fill, kind, seed); if (over) { const R = PAL.rose, px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); }; for (let i = 0; i < 5; i++) { px(17 + i, 1 + i, R[4]); px(21 - i, 1 + i, R[4]); } px(19, 3, R[5]); } },
    paint0(g, fill, kind, seed) {
      if (kind === 'play') { paintChest(g, fill); return; }
      const W = 24, H = 18, rn = rng((seed || 1) * 733 + 29), B = PAL.bark, G = PAL.gold;
      const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); };
      /* the soil block: uneven top, rounded foot, lit from the top left */
      const top = []; for (let x = 0; x < W; x++) top[x] = 2 + ((Math.sin(x * .9 + rn() * 6) + 1) * .9 | 0) + (x < 2 || x > W - 3 ? 2 : 0);
      for (let x = 1; x < W - 1; x++) for (let y = top[x]; y < H - 1; y++) {
        const foot = y > H - 3 && (x < 3 || x > W - 4); if (foot) continue;
        const d = y - top[x]; px(x, y, d < 1 ? B[4] : d < 3 ? B[3] : d < 8 ? B[2] : B[1]);
      }
      /* a stone and a root, each on its own side */
      const s1 = rn() < .5 ? -1 : 1, sx = 12 + s1 * (8 + (rn() * 2 | 0)), sy = 14 - (rn() * 2 | 0);
      px(sx, sy, B[5]); px(sx + 1, sy, B[4]); px(sx, sy - 1, B[5]);
      const rx0 = 12 - s1 * (6 + (rn() * 3 | 0)); for (let i = 0; i < 4; i++) px(rx0 + i * (-s1), 3 + (i > 1 ? 1 : 0), B[4]);
      /* the hollow: an oval, a rim of lighter earth, dark inside */
      const hx = 12 + (rn() < .5 ? 0 : (rn() < .5 ? -1 : 1)), hy = 10, rxh = 7.5 + rn() * .8, ryh = 5.2 + rn() * .5, inH = (x, y, k) => ((x - hx) / (rxh + k)) ** 2 + ((y - hy) / (ryh + k)) ** 2 <= 1;
      for (let y = 2; y < H; y++) for (let x = 0; x < W; x++) { if (inH(x, y, 0)) px(x, y, B[0]); else if (inH(x, y, .9)) px(x, y, B[4]); }
      /* the thing that belongs to this room, five by five, in the upper part of the hollow */
      const gl = GLYPH[kind] || GLYPH.nec, R = PAL[gl.ramp], map = { l: R[4], m: R[3], d: R[2], o: G[3] };
      gl.rows.forEach((row, j) => { for (let i = 0; i < 5; i++) { const c = row[i]; if (c !== '.') px(hx - 2 + i, 4 + j, map[c]); } });
      /* the coins: a pile that climbs in five steps, wide at the foot */
      const lv = fill > 0 ? Math.max(1, Math.round(Math.min(1, fill) * 5)) : 0, foot = hy + 5;
      for (let r = 0; r < lv; r++) { const w = Math.max(2, 11 - r * 2 - (r > 2 ? 1 : 0)); for (let i = 0; i < w; i++) { const x = hx - (w >> 1) + i, y = foot - r; if (!inH(x, y, -.3)) continue; px(x, y, r === lv - 1 ? G[3] : (i + r) % 3 === 0 ? G[1] : G[2]); } }
      if (lv > 0) { px(hx - 1 + (rn() * 3 | 0), foot - lv, G[4]); if (lv > 2) px(hx + 2, foot - lv + 1, G[4]); }
      else { px(hx, foot, G[1]); } /* an empty room keeps one dim coin on the floor */
    } };
  /* the small gold coin (5 x 5 art pixels, palette gold) used by the coin drops; one data URL, made once */
  let coinUrl_ = ''; const coinUrl = () => { if (coinUrl_) return coinUrl_; const c = document.createElement('canvas'); c.width = 5; c.height = 5; const g = c.getContext('2d'), G = PAL.gold, rows = ['.rrr.', 'rlhfr', 'rhffr', 'rffdr', '.rrr.'], map = { r: G[1], l: G[4], h: G[3], f: G[2], d: G[1] };
    rows.forEach((row, y) => { for (let x = 0; x < 5; x++) { const k = row[x]; if (k !== '.') { g.fillStyle = map[k]; g.fillRect(x, y, 1, 1); } } }); return (coinUrl_ = c.toDataURL()); };
  const HUE = { nec: 'stone', lts: 'teal', play: 'ember', edu: 'violet', give: 'rose', ffa: 'moss' };
  const hue = id => (PAL[HUE[id]] || PAL.stone)[id === 'ffa' ? 4 : 3];
  /* coins that fall into a room or a share of the pay, once per page load per place, when it first scrolls into view. Quiet when the person asks for less motion (the CSS stops it). */
  const dropped = new Set();
  let dropIO = null;
  function dropCoins(root) {
    if (!root || !root.querySelectorAll) return; const url = coinUrl();
    root.style.setProperty('--coin', `url(${url})`);
    root.querySelectorAll('[data-drop]').forEach((el, i) => {
      const key = el.dataset.drop; if (dropped.has(key) || el.querySelector('.cd') || el.classList.contains('is-over')) return;
      const go = () => { if (dropped.has(key)) return; dropped.add(key); for (let k = 0; k < 3; k++) { const c = document.createElement('i'); c.className = 'cd'; c.style.setProperty('--d', (i * 0.12 + k * 0.28).toFixed(2) + 's'); c.style.setProperty('--x', (38 + k * 12 + (i % 3) * 2) + '%'); c.setAttribute('aria-hidden', 'true'); el.appendChild(c); setTimeout(() => c.remove(), 2600 + i * 120); } };
      if ('IntersectionObserver' in window) { dropIO = dropIO || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { dropIO.unobserve(e.target); e.target._go && e.target._go(); } }), { threshold: .6 }); el._go = go; dropIO.observe(el); } else go();
    });
  }
  const roomCv = (el, r, kind) => { const c = el.querySelector('canvas'); if (!c) return; LOOKS.room.paint(c.getContext('2d'), kind === 'play' && (r.overBy > 0 || r.over) ? 0 : r.fill, kind, seedOf(kind + (r.id || '')), !!(r.overBy > 0 || r.over)); };
  /* ---------- adding money without leaving the burrow: a small panel in the pop-up. The money comes from this month's unspent play money (the same top-up
     the plan already has, so it is one undoable change). Then the coins drop into the burrow one by one, with sounds, and the little animals dance. ---------- */
  function playLeft() { try { const ym = nowYm(), m = calcAll(S).byYm[ym], spent = (receiptStats(S, ym).byJar || {}).play || 0; return Math.max(0, Math.floor((m.jar.play - spent) * 100) / 100); } catch (e) { return 0; } }
  function addPanel(r) {
    const left = playLeft(), room = Math.max(0, Math.ceil(r.target - r.saved)), cap = moveCap(r.target, r.saved, left);
    const nice = v => { const st = cap > 20000 ? 1000 : cap > 4000 ? 500 : cap > 800 ? 100 : 10; return Math.max(1, Math.min(cap, Math.round(v / st) * st)); };
    const chips = [...new Set([nice(cap * .25), nice(cap * .5), cap])].filter(v => v > 0 && v <= cap);
    if (!(cap > 0)) { pop.innerHTML = `<h2>${esc(r.name)}</h2><p class="bv-s">${room <= 0 ? 'This burrow is full.' : 'No free-to-spend money left this month to move here.'}</p><button type="button" class="link bv-no">Back</button>`; pop.querySelector('.bv-no').addEventListener('click', e => { e.stopPropagation(); fill(); }); return; }
    pop.innerHTML = `<h2>Add to ${esc(r.name)}</h2><p class="bv-n">From free to spend: <b>${fmt(left)}</b> left this month</p>`
      + `<div class="bv-chips">${chips.map(v => `<button type="button" class="chip" data-v="${v}">${fmt(v)}</button>`).join('')}</div>`
      + `<label class="bv-amt"><span class="sr">Amount</span><input type="number" inputmode="numeric" min="1" max="${cap}" step="1" placeholder="Amount"></label>`
      + `<div class="bv-row"><button type="button" class="btn bv-go">Add</button><button type="button" class="link bv-no">Back</button></div><p class="bv-s bv-msg" role="status"></p>`;
    const inp = pop.querySelector('input'), msg = pop.querySelector('.bv-msg');
    pop.querySelectorAll('.chip').forEach(c => c.addEventListener('click', e => { e.stopPropagation(); inp.value = c.dataset.v; inp.focus(); }));
    pop.querySelector('.bv-no').addEventListener('click', e => { e.stopPropagation(); fill(); });
    const go = e => { if (e) e.stopPropagation(); const v = Math.floor(+inp.value); if (!(v >= 1 && v <= cap)) { msg.textContent = `Enter an amount from 1 to ${fmt(cap)}.`; return; } feed(r, v); };
    pop.querySelector('.bv-go').addEventListener('click', go); inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go(); });
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { /* fine */ } }, 0);
  }
  function feed(r, v) {
    const before = Math.min(1, r.saved / r.target); let moved = 0;
    try { moved = ACT.sweep(nowYm(), r.id, v); } catch (e) { moved = 0; }
    if (!(moved > 0)) { const m = pop.querySelector('.bv-msg'); if (m) m.textContent = 'That could not be added.'; return; }
    try { render(); } catch (e) { /* the page behind redraws on its own */ }
    const r2 = rows().find(x => x.id === r.id) || r, to = Math.min(1, r2.saved / r2.target), n = Math.max(2, Math.min(5, Math.round(1 + (to - before) * 10)));
    pop.innerHTML = `<h2>${esc(r.name)}</h2><p class="bv-n"><b>+${fmt(moved)}</b></p><p class="bv-s">Going in.</p>`;
    if (reduced()) { fill(); return; }
    anim = { from: before, to, t0: performance.now(), n, shown: before, landed: 0, moved, full: to >= 1, id: r.id };
  }
  function undoAdd() { try { ACT.undo(); render(); } catch (e) { /* nothing to undo */ } fill(); }
  /* ---------- the stage: sizes, geometry, the loop ---------- */
  function build() {
    el = document.createElement('section'); el.id = 'burrowView'; el.setAttribute('aria-label', 'Burrow');
    el.innerHTML = '<canvas class="bv-bg0" aria-hidden="true"></canvas><div class="bv-cloudwrap"><canvas class="bv-clouds" aria-hidden="true"></canvas></div><canvas class="bv-bg" aria-hidden="true"></canvas><canvas class="bv-ground" aria-hidden="true"></canvas><div class="bv-stage"><canvas class="bv-cv" aria-hidden="true"></canvas></div><canvas class="bv-fx" aria-hidden="true"></canvas><canvas class="bv-rain" aria-hidden="true"></canvas><button type="button" class="bv-sign" aria-label="Back home" title="Back home"></button><div class="bv-pop" hidden></div><button type="button" class="bv-nav bv-prev" aria-label="Previous burrow">&#8249;</button><button type="button" class="bv-nav bv-next" aria-label="Next burrow">&#8250;</button><nav class="bv-dots" aria-label="Burrows"></nav>';
    document.body.append(el); cv = el.querySelector('.bv-cv'); g = cv.getContext('2d'); fxc = el.querySelector('.bv-fx'); fg = fxc.getContext('2d'); rc = el.querySelector('.bv-rain'); rg = rc.getContext('2d'); bgc = el.querySelector('.bv-bg'); bgg = bgc.getContext('2d'); bg0 = el.querySelector('.bv-bg0'); bg0g = bg0.getContext('2d'); clc = el.querySelector('.bv-clouds'); grc = el.querySelector('.bv-ground'); clg = clc.getContext('2d'); pop = el.querySelector('.bv-pop');
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
  const GL = { M: ['#.#', '###', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], A: ['.#.', '#.#', '###', '#.#', '#.#'], C: ['.##', '#..', '#..', '#..', '.##'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], H: ['#.#', '#.#', '###', '#.#', '#.#'], E: ['###', '#..', '##.', '#..', '###'], U: ['#.#', '#.#', '#.#', '#.#', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'], W: ['#.#', '#.#', '#.#', '###', '#.#'] };
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
    const wd = night ? [E[0], E[1], E[2], E[3]] : [E[1], E[2], E[3], E[4]], bw = narrow ? 40 : 58, bh = narrow ? 19 : 17, top = by - (o.gap == null ? 14 : o.gap) - bh, left = bx - Math.round(narrow ? 22 : 32);
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
    if (narrow) { word('BACK', left + 13, top + 4); word('HOME', left + 13, top + 11); for (let i = 0; i < 5; i++) px(left + 5 + i, mid, ink); px(left + 6, mid - 1, ink); px(left + 6, mid + 1, ink); px(left + 7, mid - 2, ink); px(left + 7, mid + 2, ink); }
    else { word('BACK', left + 15, top + 3); word('HOME', left + 15, top + 9); for (let i = 0; i < 6; i++) px(left + 6 + i, mid, ink); px(left + 7, mid - 1, ink); px(left + 7, mid + 1, ink); px(left + 8, mid - 2, ink); px(left + 8, mid + 2, ink); }
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
    pop.innerHTML = `<h2>${esc(r.name)}</h2><p class="bv-n"><b>${fmt(r.saved)}</b> ${r.kind === 'debt' ? 'paid of' : 'of'} ${fmt(r.target)}</p><div class="bv-bar" role="img" aria-label="${r.pct} percent ${r.kind === 'debt' ? 'paid off' : 'full'}"><i style="width:${r.pct}%"></i></div><p class="bv-s">${r.pct}% ${r.kind === 'debt' ? 'paid off. ' + fmt(r.togo) + ' still owed' : 'full'}</p><button type="button" class="btn bv-add">${r.kind === 'debt' ? 'Add a payment' : 'Add money'}</button>`;
    pop.querySelector('.bv-add').addEventListener('click', e => { e.stopPropagation(); addPanel(r); });
    el.querySelector('.bv-dots').innerHTML = all.map(x => `<button type="button" data-b="${esc(x.id)}" aria-label="${esc(x.name)}" aria-current="${x.id === cur}"></button>`).join('');
    el.querySelectorAll('.bv-dots button').forEach(b => b.addEventListener('click', () => open(b.dataset.b)));
    try { if (!LOOKS[LK].bg) SCENE.look(LOOKS[LK].mood || ''); } catch (e) { /* the world is a bonus */ }
    return { pct, r };
  }
  /* the coins: they fall one after another from above the door into the hole; each landing makes a sound and a small spark; the pile rises with them */
  function stepAnim(now, dpt) {
    const a = anim, e = now - a.t0, TL = 1600, LAND = 1250;
    let landed = 0; for (let i = 0; i < a.n; i++) if (e >= i * TL + LAND) landed++;
    if (landed > a.landed) { for (let i = a.landed; i < landed; i++) { try { sfx('coin'); } catch (x) { /* quiet */ } sparks.push({ x: dpt.x, y: dpt.y + 2, t0: now }); } a.landed = landed; }
    a.shown = a.from + (a.to - a.from) * (landed / a.n);
    if (e > (a.n - 1) * TL + TL + 200) { const full = a.full; anim = null; danceT = now; pulseAt = now; try { sfx(full ? 'fanfare' : 'sparkle'); } catch (x) { /* quiet */ }
      for (let i = 0; i < 10; i++) sparks.push({ x: dpt.x + (i - 5) * 5, y: dpt.y - 6 - (i % 3) * 4, t0: now + i * 60 });
      fill(); const m = document.createElement('p'); m.className = 'bv-s'; m.innerHTML = `Added. <button type="button" class="link bv-undo">Undo</button>`; pop.append(m); m.querySelector('.bv-undo').addEventListener('click', ev => { ev.stopPropagation(); undoAdd(); }); }
  }
  /* the squirrel brings one gold coin per trip: it runs in from alternating sides with the coin in its mouth, sits by the door, throws the coin in, and runs off */
  function drawCoins(g2, now, dpt, k) {
    if (anim) {
      const e = now - anim.t0, TL = 1600, small = LK === 'plain', i = Math.floor(e / TL), u = e - i * TL, rf = ms => Math.floor(u / ms) % 8, nf = Math.floor(u / 220) & 1, idl = Math.floor(u / 260) % 6;
      if (i >= 0 && i < anim.n) {
        const side = i % 2 ? 1 : -1, stopX = dpt.x + side * (small ? 11 : 17), startX = side < 0 ? -16 : k.W + 16, fy = dpt.y + (small ? 12 : 17), face = side > 0;
                if (u < 800) { const t = 1 - Math.pow(1 - u / 800, 1.6), x = startX + (stopX - startX) * t; SQP.draw(g2, 'runc' + rf(90), x, fy, face); }
        else if (u < 1000) SQP.draw(g2, 'nut' + nf, stopX, fy, face);
        else if (u < 1250) { SQP.draw(g2, 'idle' + idl, stopX, fy, face); const t = (u - 1000) / 250, cx = stopX + (dpt.x - stopX) * t, cy = fy - 9 - Math.sin(t * Math.PI) * 9 + (dpt.y - fy + 9) * t * t;
          g2.fillStyle = PAL.gold[1]; g2.fillRect(Math.round(cx), Math.round(cy) + 1, 3, 1); g2.fillStyle = PAL.gold[3]; g2.fillRect(Math.round(cx), Math.round(cy), 3, 1); g2.fillStyle = PAL.gold[4]; g2.fillRect(Math.round(cx), Math.round(cy), 1, 1); }
        else if (u < 1380) SQP.draw(g2, 'idle' + idl, stopX, fy, face);
        else { const t = (u - 1380) / 220, x = stopX + (startX - stopX) * Math.pow(Math.min(1, t), 1.8); SQP.draw(g2, 'run' + rf(80), x, fy, !face); }
      }
      PXK.halo(g2, dpt.x, dpt.y, 12, PAL.gold[4], .1 + .08 * Math.sin(e / 140)); }
    sparks = sparks.filter(s => now - s.t0 < 700);
    sparks.forEach(s => { const u = (now - s.t0) / 700; if (u < 0) return; g2.globalAlpha = 1 - u; g2.fillStyle = PAL.gold[4]; const r2 = 1 + Math.round(u * 5), y = Math.round(s.y - u * 8); g2.fillRect(s.x, y, 1, 1); g2.fillRect(s.x - r2, y + 1, 1, 1); g2.fillRect(s.x + r2, y + 1, 1, 1); g2.fillRect(s.x, y - r2 + 1, 1, 1); g2.globalAlpha = 1; });
  }
  function frame(now) {
    const L = LOOKS[LK], t = now - t0, rr = rows().find(x => x.id === cur); if (!rr) return;
    const door = L.door ? L.door(k) : { x: k.x0 + L.w / 2 }, dpt = { x: Math.round(door.x), y: Math.round(L.doorY ? L.doorY(k) : LK === 'plain' ? k.y0 + 10 : k.ground - 12) };
    if (anim) stepAnim(now, dpt);
    const pct = anim ? Math.min(1, anim.shown) : Math.min(1, Math.max(0, (forcePct >= 0 ? forcePct : rr.saved / rr.target) + stockExtra));
    if (L.bg && Math.floor(pct * 10) !== bgPct) { bgPct = Math.floor(pct * 10); L.bg(bg0g, clg, bgg, k, pct); if (L.sign) { SIGNR = L.sign(); placeSign(); } }
    g.clearRect(0, 0, L.w, L.h); L.paint(g, pct, t, k, false, seedOf(cur));
    fg.clearRect(0, 0, k.W, k.H); rg.clearRect(0, 0, k.Wr, k.Hr);
    if (L.fx) L.fx.draw(fg, t, k, { rg, pct, pulse: pulseAt, stock: stockT >= 0 ? now - stockT : -1, style: stockStyle, dance: danceT >= 0 ? now - danceT : -1 });
    drawCoins(fg, now, dpt, k);
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
    if (!el) build(); anim = null; cur = id; const f = fill(); if (!f) { cur = null; return; }
    document.body.classList.add('bv-on'); el.hidden = false; pop.hidden = false; t0 = performance.now(); layout(); loop();
  }
  function close() { cur = null; clearTimeout(tm); if (el) el.hidden = true; document.body.classList.remove('bv-on'); try { SCENE.look(''); } catch (e) { } }
  /* the squirrel stocks the burrow: call this after money has gone into the burrow */
  function stock(style) { if (!cur) return; stockT = performance.now(); stockStyle = style || 'A'; pulseAt = stockT + SQ.T.crouch + 700; }
  /* ---------- Home: one picture with a burrow for each savings bucket, how full it is, a short note and the play money number ---------- */
  function home() {
    const el0 = document.querySelector('#hBur'); if (!el0) return; const all = rows().slice().sort((a, b) => (b.emergency ? 1 : 0) - (a.emergency ? 1 : 0)); /* the emergency fund is always first */
    const rooms = (typeof HV !== 'undefined' && HV && HV.map && HV.map.burrows) || [];
    if (!all.length && !rooms.length) { el0.hidden = true; return; } el0.hidden = false;
    const pc = r => Math.min(1, r.saved / r.target), full = all.find(r => pc(r) >= 1), near = all.filter(r => pc(r) < 1).sort((a, b) => pc(b) - pc(a))[0];
    const dw = r => r.kind === 'debt' ? 'paid off' : 'full'; let note = full ? (full.kind === 'debt' ? `${full.name} is paid off.` : `${full.name} is full.`) : near ? `${near.name} is the most ${dw(near)}, ${near.pct}%.` : '';
    let wk = ''; try { wk = streakInfo().done ? 'You logged receipts this week.' : 'No receipts logged this week yet.'; } catch (e) { }
    const goalTile = r => `<button type="button" class="hb-b" data-b="${esc(r.id)}" aria-label="${esc(r.name)}, ${fmt(r.saved)}, ${r.pct} percent ${dw(r)}. Open"><canvas width="24" height="18" aria-hidden="true"></canvas><span class="hb-n">${esc(r.name)}</span><span class="hb-bar"><i style="width:${Math.round(pc(r) * 100)}%"></i></span><span class="hb-p">${fmt(r.saved)}, ${r.pct}% ${dw(r)}</span></button>`;
    const roomTile = r => `<button type="button" class="hb-b" data-drop="room:${esc(r.id)}" data-room="${esc(r.id)}" aria-label="${esc(r.name)}, ${fmt(r.amount)}, ${esc(r.sub)}. How it is worked out"><canvas width="24" height="18" aria-hidden="true"></canvas><span class="hb-n">${esc(r.name)}</span><span class="hb-p">${fmt(r.amount)}</span><span class="hb-p">${esc(r.sub)}</span></button>`;
    el0.innerHTML = '<h2 class="hb-h">Burrows</h2><p class="cap hb-what">Money that piles up over months: goals, Education, Giving and Investing. The numbers include what you plan to add this month.</p><div class="hb-scene">' + all.map(goalTile).join('') + rooms.map(roomTile).join('') + '</div>'
      + `<p class="hb-note">${esc(note)} ${esc(wk)}</p>`;
    el0.querySelectorAll('.hb-b[data-b]').forEach(bt => { const r = all.find(x => x.id === bt.dataset.b); if (r) LOOKS.plain.paint(bt.querySelector('canvas').getContext('2d'), pc(r), 0, null, lookOf(r) === 'rainy', seedOf(r.id)); });
    el0.querySelectorAll('.hb-b[data-room]').forEach(bt => { const r = rooms.find(x => x.id === bt.dataset.room); if (r) roomCv(bt, r, r.id); });
    dropCoins(el0);
    if (!el0._w) { el0._w = 1; el0.addEventListener('click', e => { const bt = e.target.closest('.hb-b'); if (!bt) return; if (bt.dataset.room) { try { openWhy('room:' + bt.dataset.room); } catch (x) { } return; } open(bt.dataset.b); }); }
  }
  /* This month's two rooms for the top of Home: Bills and basics, and Free to spend. Same tiles as the burrows, one panel. */
  function monthRooms(el) {
    const M = HV && HV.map; if (!el || !M) return;
    const txt = r => { const f = r.id === 'nec' || r.id === 'play' ? fmt2 : fmt; return r.overBy && r.amount > 0 ? [f(r.amount), r.sub + ', ' + f(r.overBy) + ' over'] : r.overBy ? ['−' + f(r.overBy), 'over'] : [f(r.amount), r.sub]; };
    el.innerHTML = M.month.map(r => { const t = txt(r); return `<button type="button" class="hb-b${r.overBy ? ' is-over' : ''}" data-drop="room:${esc(r.id)}" data-room="${esc(r.id)}" aria-label="${esc(r.name)}, ${esc(t[0])}, ${esc(t[1])}. How it is worked out"><canvas width="24" height="18" aria-hidden="true"></canvas><span class="hb-n">${esc(r.name)}</span><span class="hb-p">${t[0]}</span><span class="hb-p">${esc(t[1])}</span></button>`; }).join('');
    el.querySelectorAll('.hb-b[data-room]').forEach(bt => { const r = M.month.find(x => x.id === bt.dataset.room); if (r) roomCv(bt, r, r.id); });
    dropCoins(el);
    if (!el._w) { el._w = 1; el.addEventListener('click', e => { const bt = e.target.closest('.hb-b[data-room]'); if (bt) { try { openWhy('room:' + bt.dataset.room); } catch (x) { } } }); }
  }
  function boot() { const m = location.hash.match(/burrow=([\w-]+)/); if (m) setTimeout(() => open(m[1]), 1200); }
  if (/[?&]burrowtest\b/.test(location.search)) window.__bur = { LOOKS, seedOf, open, close, rows, stock, k: () => k, force: p => { forcePct = p; } };
  return { open, close, boot, rows, stock, home, monthRooms, dropCoins, hue, coinUrl, roomCv, step, LOOKS, rng, drawRoad, drawSign };
})();
