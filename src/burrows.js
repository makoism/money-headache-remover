/* ---------- burrows: one full-screen picture per savings bucket ----------
   A burrow is a savings goal (Rainy day, a trip, a big purchase) shown as a house in a hill in the middle of the forest scene, with its own
   look (a LOOK below: the time of day, the burrow's painting, and a live layer of weather, light and creatures drawn over the scene).
   Coins fill the door as the goal fills (pct of target). Tap the burrow for a small pop-up: saved, goal, how full and a button to add money.
   It only reads the plan (goalRows); nothing here is stored or changed. `#burrow=<goalId>` in the address opens one on load.
   A LOOK is { mood, w, h, paint(g, pct, t, k), fx: { init(k), draw(g, t, k) } }. k carries the geometry (see geom()). */
const BUR = (() => {
  let el = null, cv = null, g = null, fxc = null, fg = null, rc = null, rg = null, bgc = null, bgg = null, bg0 = null, bg0g = null, clc = null, clg = null, bgPct = -1, pop = null, cur = null, tm = 0, k = null, t0 = 0, stockT = -1, stockStyle = 'A', pulseAt = 0, stockExtra = 0, forcePct = -1;
  const LOOKS = {};
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rows = () => { try { return goalRows(S, C, nowYm()).filter(r => r.live && r.target > 0); } catch (e) { return []; } };
  const lookOf = r => r.emergency ? 'rainy' : 'plain';
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  /* the plain look: a small mossy mound with big pixels (24 x 18, shown at 5x), close to the favicon. Few shapes, flat tones: a mound, an arched door,
     a warm light, the coins as a heap as high as the goal is full, one tuft, one flower. Not symmetric: the peak, the lean of the door, the tuft and
     the flower differ for every burrow (the seed is made from the goal's id). See ART_GUIDE.md section 0, the nature rule, and its simple-icons line. */
  const seedOf = str => { let h = 7; for (const c of String(str || 'x')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) % 9973 + 1; };
  LOOKS.plain = { mood: '', w: 24, h: 18,
    paint(g, pct, t, k, night, seed) {
      const W = 24, H = 18, cx = 12, base = 15, rn = rng((seed || 1) * 977 + 13), B = PXK.B, M = PAL.moss, E = PAL.bark;
      const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); };
      const mo = night ? [M[1], M[2], M[3], M[4]] : [M[2], M[3], M[4], M[5]], so = night ? [E[0], E[1], E[2]] : [E[1], E[2], E[3]];
      const pk = cx + Math.round((rn() - .5) * 3), hm = 10 + Math.round(rn()), wl = 10 + Math.round(rn()), wr = 10 + Math.round(rn());
      const hh = []; for (let x = 0; x < W; x++) { const u = x < pk ? (pk - x) / wl : (x - pk) / wr; hh[x] = u >= 1 ? 0 : Math.round(hm * Math.pow(1 - u * u, .85)); }
      for (let x = 0; x < W; x++) { const top = base - hh[x]; if (hh[x] < 1) continue; const lit = x < pk ? 0 : 1;
        for (let y = top; y <= base; y++) { const d = y - top, gd = 2 + Math.round(4 * Math.pow(hh[x] / hm, 1.3));
          if (d < gd) px(x, y, d < 1 ? mo[lit ? 3 : 2] : d < 2 ? mo[lit ? 2 : 1] : mo[lit ? 1 : 0]); else px(x, y, d > gd + 3 ? so[0] : d > gd + 1 ? so[1] : so[2]); } }
      const OW = 3, OH = 8, lean = rn() < .5 ? -1 : 1, yt = base - OH + OW, inside = (x, y) => y >= yt ? Math.abs(x - cx) <= OW - 1 + (y >= yt + 1 ? 0 : 0) : Math.abs(x - cx - (yt - y > 1 ? lean : 0)) <= Math.max(0, OW - 1 - (yt - y > 1 ? 1 : 0));
      for (let y = base - OH; y <= base; y++) for (let x = cx - OW; x <= cx + OW; x++) { if (inside(x, y)) px(x, y, night ? PAL.night[0] : E[0]); else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1)) px(x, y, x > cx ? E[2] : E[1]); }
      const cH = Math.round(Math.min(1, pct) * (OH - 3)), top0 = Math.max(1, cH);
      for (let x = cx - OW + 1; x <= cx + OW - 1; x++) for (let y = 0; y < top0; y++) { const yy = base - y; if (inside(x, yy)) px(x, yy, y === top0 - 1 ? PAL.gold[4] : PAL.gold[3]); }
      if (cH < 2) px(cx, base - 2, PAL.ember[4]);
      const s1 = rn() < .5 ? -1 : 1, gx = cx + s1 * 8;
      [[0, 3], [1, 2]].forEach(([o, h]) => { for (let i = 0; i < h; i++) px(gx + o, base - i + 1, mo[i === h - 1 ? 3 : 2]); });
      px(cx - s1 * 7, base - 1, [PAL.rose[4], PAL.gold[4], PAL.violet[4]][rn() * 3 | 0]);
      for (let y = base + 1; y < H; y++) for (let x = 2; x < W - 2; x++) { const d = y - base, e = Math.min(x - 2, W - 3 - x); if (d > 1 && (e < 3 || B[y & 3][x & 3] > e + 5)) continue; px(x, y, d === 1 ? so[2] : so[1]); }
    }, fx: null };
  /* ---------- the stage: sizes, geometry, the loop ---------- */
  function build() {
    el = document.createElement('section'); el.id = 'burrowView'; el.setAttribute('aria-label', 'Burrow');
    el.innerHTML = '<button type="button" class="bv-back" aria-label="Back to home">Home</button><canvas class="bv-bg0" aria-hidden="true"></canvas><div class="bv-cloudwrap"><canvas class="bv-clouds" aria-hidden="true"></canvas></div><canvas class="bv-bg" aria-hidden="true"></canvas><div class="bv-stage"><canvas class="bv-cv" aria-hidden="true"></canvas></div><canvas class="bv-fx" aria-hidden="true"></canvas><canvas class="bv-rain" aria-hidden="true"></canvas><div class="bv-pop" hidden></div><button type="button" class="bv-nav bv-prev" aria-label="Previous burrow">&#8249;</button><button type="button" class="bv-nav bv-next" aria-label="Next burrow">&#8250;</button><nav class="bv-dots" aria-label="Burrows"></nav>';
    document.body.append(el); cv = el.querySelector('.bv-cv'); g = cv.getContext('2d'); fxc = el.querySelector('.bv-fx'); fg = fxc.getContext('2d'); rc = el.querySelector('.bv-rain'); rg = rc.getContext('2d'); bgc = el.querySelector('.bv-bg'); bgg = bgc.getContext('2d'); bg0 = el.querySelector('.bv-bg0'); bg0g = bg0.getContext('2d'); clc = el.querySelector('.bv-clouds'); clg = clc.getContext('2d'); pop = el.querySelector('.bv-pop');
    el.querySelector('.bv-back').addEventListener('click', close);
    el.querySelector('.bv-prev').addEventListener('click', () => step(-1)); el.querySelector('.bv-next').addEventListener('click', () => step(1));
    let sx0 = 0, sy0 = 0; el.addEventListener('pointerdown', e => { sx0 = e.clientX; sy0 = e.clientY; }); el.addEventListener('pointerup', e => { const dx = e.clientX - sx0, dy = e.clientY - sy0; if (Math.abs(dx) > 70 && Math.abs(dy) < 60 && !e.target.closest('.bv-pop, .bv-back, .bv-nav, .bv-dots')) step(dx < 0 ? 1 : -1); });
    document.addEventListener('keydown', e => { if (!cur) return; if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });
    el.querySelector('.bv-stage').addEventListener('click', () => { pop.hidden = !pop.hidden; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur) close(); });
    addEventListener('resize', () => { if (cur) { layout(); } });
    document.addEventListener('visibilitychange', () => { if (cur && !document.hidden) loop(); });
  }
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
    if (L.bg && Math.floor(pct * 10) !== bgPct) { bgPct = Math.floor(pct * 10); L.bg(bg0g, clg, bgg, k, pct); }
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
  return { open, close, boot, rows, stock, home, step, LOOKS, rng };
})();
