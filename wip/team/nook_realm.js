/* ---------- NK.realm: the shared skeleton of a realm nook ----------
   Every realm is the same small world told in its own material: a clearing seen through three nested walls, a goal house on the left that
   the person's progress builds in eight stages, a hut (the store) beside it, a work patch in the middle where the folk tend things, a
   water point in front, and the Spirit (the realm's landmark) on the right with homes hanging in or around it. Folk run routines between
   those places, the Spirit's light sprites wake plants and feed animals, animals graze, hover or hop, and nothing draws a connecting line.
   A realm is a definition D; this file turns it into a VISTA set. What D holds (all painters are in viewport units, the clearing L comes from NK.geom):
     id, sky{mood:[4 colours]}, fog{mood}, ramps{name:[colours]}, pal(T, mood, MC) for extras, bubble{bg,edge,ink[]},
     wall{ramps(T)->[back,mid,near], clump:'leaf|rock|coral|puff', hang(T), flat}, paintSky(c,g,T,L), paintFar(c,g,T,L),
     ground(c,g,T,L,H)  floor, path, water point, work-patch bed;  spiritPaint(c,L,T)  the landmark;  housePaint(c,x,base,st,T)  the goal house;
     hutPaint(c,x,base,T), rim(T)->ramp for the bushes that stand on the ground at the edge, fg(c,g,T,L,H,W), liveExtra(c,f,T,L),
     spirit{name,snd,sndK,say,draw(c,n,f,T,L),glow(T)}, hutName, nests[{dx,yf,name}] + nestDraw(c,n,f,T,i,lit),
     plants[{k,name,u|p,row,hw,hh,snd,sndK,crop,draw(c,n,f,T)}], animals[{id,name,mode,u,row,range,hw,hh,say,snd,sndK,magic,draw(c,n,f,T)}],
     folk[{id,name,rank,cloth,draw,tasks,u,lane,elder,mv}], sprites{n,draw(c,n,f,T,i),col,r}, heart(L)->{x,y}, lights(f,g,L), rays(g,L), weather. */
{ const { rnd, hsh, px, rect } = VG;

/* ---- shared ground painters (K = ramp dark..light) ---- */
NK.floor = (c, g, L, H, K, o) => {
  o = o || {}; const sw = L.sw, cx = L.cx;
  for (let y = sw - 3; y < g.y1; y++) {
    const hw = L.cw * .5 + 14 + (y - sw) * 1.25, u_ = Math.min(1, Math.max(0, (y - sw) / (H - sw + 6)));
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { const nn = hsh(x >> 2, y >> 1, o.seed || 3), lx = Math.sin(x / 23 + y / 9) * .12, k = u_ * (o.depth == null ? .75 : o.depth) + lx + (nn - .5) * .22; c.fillStyle = k < .16 ? K[3] : k < .42 ? K[2] : k < .7 ? K[1] : K[0]; c.fillRect(x, y, 1, 1); }
  }
};
NK.stream = (c, g, L, H, K, o) => {
  o = o || {}; const sw = L.sw, by = L.water.y + 1, bh = o.h || 6, x0 = g.x0, x1 = g.x1, R = rnd(5), bank = o.bank || [K[1], K[3]];
  for (let y = by; y < by + bh; y++) for (let x = x0; x < x1; x++) { const k = (y - by) / bh, w = hsh(x >> 2, y, 4); c.fillStyle = k < .2 ? K[3] : w < .15 ? K[3] : k < .6 ? K[2] : K[1]; c.fillRect(x, y, 1, 1); if (hsh(x, y, 5) < .05) { c.fillStyle = o.glint || '#ffffff'; c.fillRect(x, y, 2, 1); } }
  for (let x = x0; x < x1; x++) { c.fillStyle = bank[1]; c.fillRect(x, by - 1, 1, 1); c.fillStyle = bank[0]; c.fillRect(x, by + bh, 1, 1); }
  if (o.stones) for (let i = 0; i < 9; i++) NK.rock(c, L.x0 - 10 + Math.floor(R() * (L.x1 - L.x0 + 20)), by + bh + 1, 2 + Math.floor(R() * 2), o.stones, R);
};
NK.path = (c, g, L, H, K, o) => {
  o = o || {}; const sw = L.sw;
  for (let y = sw + 1; y < g.y1; y++) { const t = (y - sw) / (H - sw), pw = 4 + t * 10, pcx = NK.u(L, .36 + Math.sin(t * 2.2) * .06); for (let x = Math.round(pcx - pw); x < pcx + pw; x++) { const e = Math.abs(x - pcx) / pw; if (o.stepping && ((x + y * 3) % 9 > 5 || e > .9)) continue; c.fillStyle = e > .85 ? K[1] : hsh(x, y, 8) < .25 ? K[3] : K[2]; c.fillRect(x, y, 1, 1); } }
};
NK.bridge = (c, L, K) => { const by = L.water.y + 1, bx = NK.u(L, .36); for (let i = 0; i < 6; i++) { rect(c, bx - 10 + i * 4, by - 2, 4, 9, i % 2 ? K[1] : K[2]); rect(c, bx - 10 + i * 4, by - 2, 4, 1, K[3]); rect(c, bx - 10 + i * 4 + 3, by - 2, 1, 9, K[0]); } };
NK.bed = (c, L, K, o) => { o = o || {}; const sw = L.sw, gx0 = L.patch.x0, gx1 = L.patch.x1; for (let r = 0; r < 4; r++) { const yy = sw + 6 + r * 4; for (let x = gx0; x < gx1; x++) { c.fillStyle = (x + r) % 3 ? K[1] : K[2]; c.fillRect(x, yy, 1, 3); c.fillStyle = K[0]; c.fillRect(x, yy + 3, 1, 1); } } };
NK.fence = (c, L, K) => { const sw = L.sw, gx0 = L.patch.x0, gx1 = L.patch.x1; for (let x = gx0 - 2; x <= gx1 + 2; x += 4) { rect(c, x, sw - 3, 2, 9, K[1]); rect(c, x, sw - 3, 1, 9, K[2]); px(c, x, sw - 4, K[3]); } rect(c, gx0 - 2, sw - 1, gx1 - gx0 + 6, 1, K[2]); rect(c, gx0 - 2, sw + 2, gx1 - gx0 + 6, 1, K[1]); };
NK.sprinkle = (c, L, H, cols, n, seed) => { const R = rnd(seed || 9), sw = L.sw; for (let i = 0; i < n; i++) px(c, L.x0 + Math.floor(R() * (L.x1 - L.x0)), sw + 5 + Math.floor(R() * (H - sw - 5)), cols[i % cols.length]); };
NK.tuftRows = (c, g, L, H, K, R) => { const sw = L.sw, cx = L.cx; for (let y = sw + 3; y < g.y1; y += 4) NK.tufts(c, cx - L.cw * .6 - (y - sw), cx + L.cw * .6 + (y - sw), y, K, R, .025 + (y - sw) * .0012, 2 + Math.floor((y - sw) / 14)); };
}
NK.realm = D => {
  const V = window.__VSET, MC = V.moodCol, { mix, rnd, hsh, px, rect, disk, ell } = VG;
  const pal = mood => {
    const T = { mood }, m = c => MC(c, mood);
    T.sky = D.sky[mood].slice(); T.fog = D.fog[mood]; for (const k in D.ramps) T[k] = D.ramps[k].map(m);
    T.lit = mood === 'night' ? 1 : mood === 'sunset' ? .55 : mood === 'morning' ? .2 : 0;
    T.cloud = (D.cloud || ['#a8c4dc', '#f4f8fa', '#ffffff']).map(m); T.shaft = D.shaft ? D.shaft[mood] : (mood === 'sunset' ? '#ffc888' : '#fff6c8'); T.shaftA = ({ morning: .2, day: .15, sunset: .22, night: .06 })[mood] * (D.shaftK == null ? 1 : D.shaftK);
    return D.pal ? D.pal(T, mood, MC) || T : T;
  };
  const frameG = (id, k, o, blur, L) => ({ id, k, blur, paint: (c, g2) => NK.frame(c, g2, Object.assign({ clump: D.wall.clump || 'leaf', cx: L.cx }, o)) });
  function stage(c, g, T, L, st) {
    const R = rnd(11), sw = L.sw, H = g.H;
    D.ground(c, g, T, L, H);
    if (D.spiritPaint) D.spiritPaint(c, L, T);
    if (D.hutPaint) D.hutPaint(c, L.hut.x, sw + 2, T, L);
    D.housePaint(c, L.house.x, sw + 1, st, T, L);
    if (D.extra) D.extra(c, g, T, L, H);
    if (!D.rim) return;
    const K = D.rim(T), clump = NK.CL[D.wall.clump || 'leaf'];
    for (const side of [-1, 1]) for (let i = 0; i < 26; i++) { const ex = side < 0 ? L.x0 - 16 : L.x1 + 16, xx = ex + side * (i * 3.6 + (R() - .5) * 3), r = 7 + Math.floor(R() * 7), yy = sw + 10 - Math.round(i * 1.3) + Math.floor(R() * 8); clump(c, Math.round(xx), yy, r, K, R); }
  }
  /* the magical "you can touch this": a glint sweeps over the cap, small stars wink on it, and a ring opens when the hint is up. It is brighter until the person has used the menu once, and stays quietly alive after that. */
  function menuShine(c, n, f, m, i) {
    const used = ECO.menuUsed(), hot = Date.now() - (n.hint || 0) < 6000, hv = Date.now() - (n.hov || 0) < 500, ry = m.r * .74, cy = m.y - m.h - ry * .1, A = (used && !hot && !hv ? .45 : 1) * (n.q || 1), quiet = !!n.q, per = hot ? 80 : used ? 400 + i * 80 : 210 + i * 45, t = ((f + i * 61) % per) / per;
    c.save(); c.globalCompositeOperation = 'lighter';
    /* a slow breathing halo behind the cap */
    const br = .5 + .5 * Math.sin(f / 14 + i * 2), g0 = c.createRadialGradient(m.x, cy, 1, m.x, cy, m.r * 1.5); g0.addColorStop(0, 'rgba(255,226,150,' + ((.16 + .16 * br) * A + (hv ? .2 : 0)) + ')'); g0.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g0; c.fillRect(m.x - m.r * 1.6, cy - m.r * 1.6, m.r * 3.2, m.r * 3.2);
    /* a soft glint sweeps across the cap */
    if ((t < .3 && !quiet) || hv) { const u = hv ? ((f / 3) % 10) / 10 : t / .3, sx = m.x - m.r * 1.1 + u * m.r * 2.4; c.save(); c.beginPath(); c.ellipse(m.x, cy - ry * .12, m.r * .8, ry * .5, 0, 0, 6.3); c.clip(); const g1 = c.createLinearGradient(sx - m.r * .5, 0, sx + m.r * .5, 0); g1.addColorStop(0, 'rgba(255,255,255,0)'); g1.addColorStop(.5, 'rgba(255,255,235,' + (.55 * A) + ')'); g1.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g1; c.fillRect(m.x - m.r, cy - ry, m.r * 2, ry * 2); c.restore(); }
    /* little stars wink on and off */
    const k = Math.floor((f + i * 17) / 28), ph = ((f + i * 17) % 28) / 28;
    if (((!used && !quiet) || hot || hv) && ph < .75) { const a = hsh(k, i, 7) * 6.28, rr = Math.sqrt(hsh(k, i, 9)) * .8, sx = Math.round(m.x + Math.cos(a) * m.r * rr), sy = Math.round(cy - Math.abs(Math.sin(a)) * ry * rr), s = Math.sin(ph / .75 * Math.PI); c.globalAlpha = s * .95; c.fillStyle = '#fff6d0'; c.fillRect(sx, sy, 1, 1); if (s > .45) { c.globalAlpha = s * .6; c.fillRect(sx - 1, sy, 3, 1); c.fillRect(sx, sy - 1, 1, 3); } }
    /* the hint: a ring opens around the cap */
    if (hot) { const u = ((f + i * 9) % 50) / 50; c.globalAlpha = (1 - u) * .8; c.strokeStyle = '#ffe6a0'; c.lineWidth = 1; c.beginPath(); c.ellipse(m.x, cy, m.r + 1 + u * 7, ry + 1 + u * 5, 0, 0, 6.3); c.stroke(); }
    c.restore();
  }
  function buildAll(g) {
    const H = g.H, T = g.T, L = g.L, R = rnd(61), sw = L.sw, sp0 = L.spirit;
    const S = (id, o) => ECO.add(Object.assign({ id, kind: 'creature', hw: 7, hh: 7 }, o));
    ECO.begin(g, { pulse: D.pulse || '#ffffff', wave: D.waveCol || '#ffffff', link() {}, bubble: D.bubble });
    const sd = D.spirit, heart = D.heart ? D.heart(L, T) : { x: sp0.x - 1, y: sw - 14 };
    const sp = ECO.add({ id: 'spirit', kind: 'spirit', name: sd.name, x: sp0.x, y: sw + 2, hw: sd.hw || 30, hh: sd.hh || sp0.h * .55, snd: sd.snd || 'hum', sndK: sd.sndK || 1, magic: true, say: sd.say, z: sw - 4, lift: -2, noReflect: true, draw: (c, n, f) => sd.draw ? sd.draw(c, n, f, T, L) : 0, glow: sd.glow ? sd.glow(T, L) : null });
    const house = ECO.add({ id: 'house', kind: 'house', name: D.houseName || 'Your home', x: L.house.x + (D.houseW || 38) / 2, y: sw, hw: 15, hh: 8, step(n) { const st = g.tk.stage(); n.hw = st < 2 ? 15 : (D.houseW || 38) / 2 + 2; n.hh = st < 2 ? 8 : 16; }, z: sw - 1, snd: 'knock', draw() {}, lift: -2, glow: () => (g.tk.stage() >= 6 ? { col: D.windowCol || '#ffd890', r: 34, a: T.lit ? .6 : .12, dy: 12 } : null) });
    const hut = ECO.add({ id: 'hut', kind: 'home', name: D.hutName || 'The store', x: L.hut.x + (D.hutW || 16) / 2, y: sw + 2, hw: 10, hh: 8, z: sw - 1, snd: 'knock', draw() {}, lift: -2, glow: n => (n.lit ? { col: D.windowCol || '#ffd890', r: 18, a: .5, dy: 5 } : null) });
    const nests = (D.nests || []).map((nd, i) => ECO.add({ id: 'nest' + i, kind: 'home', name: nd.name, x: sp0.x + nd.dx, y: nd.y != null ? nd.y : sw - sp0.h * nd.yf + 14, hw: 8, hh: 8, z: sw - 2, snd: nd.snd || 'chime', sndK: 5 + i, lit: 0, draw: (c, n, f) => D.nestDraw(c, n, f, T, i, !!(n.lit || T.lit > .4)), glow: n => ((n.lit || T.lit > .4) ? { col: D.windowCol || '#ffe2a0', r: 12, a: .5, dy: 8 } : null) }));
    /* the menu lives in the world: the three biggest mushrooms (or the lanterns, where a realm has none) open Home, Receipts and Plan.
       Hover names the page, a tap opens it; the tab bar stays as the plain way in. */
    const SV = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
    const ICO = { home: SV('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'), receipts: SV('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'), month: SV('<path d="M12 3l2.6 5.6 6 .7-4.4 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.4 9.3l6-.7z"/>'),
      streak: SV('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-.5-5 1-8z"/>'), music: SV('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'), sound: SV('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>'), settings: SV('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'), ask: SV('<path d="M4 5h16v11H9l-5 4z"/>'), help: SV('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17v.1"/>') };
    { const TABS = ['home', 'receipts', 'month'], open = tab => () => { if (!document.body.classList.contains('shut')) return; const b = document.querySelector('.tabs [data-tab="' + tab + '"]'); if (b) setTimeout(() => { ECO.hideTip(); b.click(); }, 350); };
      const spots = (L.shrooms || []).filter(m => m.r >= 5).sort((a, b) => b.r - a.r).slice(0, 3);
      if (spots.length >= 3) spots.forEach((m, i) => { const nd = ECO.add({ id: 'menu' + i, kind: 'menu', name: TABS[i], x: m.x, y: m.y, hw: m.r + 2, hh: Math.max(5, (m.h + m.r * .74) / 2 + 1), z: sw - 3, snd: 'chime', sndK: 2 + i * 2, draw: (c, n, f) => menuShine(c, n, f, m, i), lift: -2, glow: n => { const hot = Date.now() - (n.hov || 0) < 500, hint = Date.now() - (n.hint || 0) < 6000, k = ECO.menuUsed() ? 0 : 1; return { col: hot ? '#ffe090' : '#ffc060', r: m.r * (hot ? 6 : 4.5), a: hot ? .6 : hint ? .3 + .2 * Math.sin(Date.now() / 220) : .06 + k * (.1 + .07 * Math.sin(Date.now() / 600 + i * 2)), dy: m.h }; } }); nd.menu = TABS[i]; nd.ico = ICO[TABS[i]]; nd.tap = open(TABS[i]); });
      else nests.slice(0, 3).forEach((nd, i) => { nd.menu = TABS[i]; nd.tap = open(TABS[i]); }); }
    /* the small controls live on the small mushrooms: hover shows the icon and its name, a tap does what the button does */
    if (L.tools) { const q = id => document.getElementById(id), tx = b => (b ? b.textContent.trim() : '');
      const TL = [['topStreak', 'Streak', 'streak', b => tx(b) ? tx(b) : ''], ['sndBtn', 'Sound', 'sound', b => (b && b.getAttribute('aria-pressed') === 'true' ? 'off' : 'on')], ['djBtn', 'Music', 'music', () => ''], ['gearBtn', 'Settings', 'settings', () => ''], ['askBtn', 'Ask', 'ask', () => ''], ['helpBtn', 'Help', 'help', () => '']];
      L.tools.forEach((m, i) => { const t = TL[i]; if (!t) return; const [bid, nm, ik, st] = t;
        const nd = ECO.add({ id: 'tool' + i, kind: 'menu', name: nm, x: m.x, y: m.y, hw: Math.max(m.r + 2, 5), hh: Math.max(5, (m.h + m.r * .74) / 2 + 1), z: sw - 3, snd: 'chime', sndK: 1 + i, q: .55, draw: (c, n, f) => menuShine(c, n, f, m, i + 3), lift: -1.5, glow: n => { const hot = Date.now() - (n.hov || 0) < 500; return { col: hot ? '#ffe090' : '#ffc060', r: m.r * (hot ? 7 : 4), a: hot ? .55 : .05 + .03 * Math.sin(Date.now() / 700 + i), dy: m.h }; } });
        nd.tool = { ico: ICO[ik], say: () => { const v = st(q(bid)); return nm + (v ? ' · ' + v : ''); } }; nd.tap = () => { const go = () => { const b = q(bid); if (b) setTimeout(() => b.click(), 90); }; let done = false; const once = () => { if (done) return; done = true; document.removeEventListener('pointerup', once, true); document.removeEventListener('pointercancel', once, true); go(); }; document.addEventListener('pointerup', once, true); document.addEventListener('pointercancel', once, true); setTimeout(once, 900); }; /* a finger tap: wait until the finger is up, so the click that ends the tap cannot land on the panel that just opened */ /* after this click has finished, so a panel that closes on an outside click is not shut at once */ }); }
    const plants = [], crops = [], px_ = (pd) => pd.p != null ? L.patch.x0 + pd.p * (L.patch.x1 - L.patch.x0) : NK.u(L, pd.u);
    for (const pd of D.plants) {
      if (L.hideNarrow && !L.wide && pd.wideOnly) continue;
      const seed = Math.floor(R() * 9), nd = ECO.add({ id: pd.k + plants.length, kind: 'plant', pk: pd.k, name: pd.name, x: Math.round(px_(pd)), y: sw + (pd.row == null ? 4 : pd.row), hw: pd.hw || 8, hh: pd.hh || 8, snd: pd.snd || 'rustle', sndK: pd.sndK, seed, z: sw + (pd.row == null ? 4 : pd.row), en: 0, lift: -2, draw: (c, n, f) => pd.draw(c, n, f, T), glow: pd.glow ? ((n, f) => pd.glow(n, T, f)) : undefined, step(n) { n.en = Math.max(0, (n.en || 0) - .012); } });
      plants.push(nd); if (pd.crop) crops.push(nd);
    }
    const R_ = to => {
      if (to == null) return null; if (typeof to === 'function' || typeof to === 'number') return to; if (typeof to === 'object' && to.kind) return to;
      if (to === 'water') return L.water; if (to === 'store' || to === 'hut') return hut; if (to === 'house') return house; if (to === 'spirit') return sp;
      if (to.crop != null) return crops[to.crop % crops.length]; if (to.plant) return () => plants.find(p => p.pk === to.plant) || hut; if (to.nest != null) return nests[to.nest % nests.length] || sp; if (to.u != null) return NK.u(L, to.u); if (to.x != null) return to.x;
      return to;
    };
    if (crops.length || D.folk.every(fd => !fd.needCrops)) for (const fd of D.folk) {
      NK.folk(S, L, Object.assign({}, fd, { x: fd.u != null ? NK.u(L, fd.u) : L.cx, tasks: fd.tasks.map(t => Object.assign({}, t, { to: R_(t.to) })), draw: (c, n, f) => fd.draw(c, n, f, T), say: fd.say || ['leaf', 'sun', 'drop', 'heart', 'note'], snd: fd.snd || 'chirp', sndK: fd.rank || 1, hw: fd.hw || 5, hh: fd.hh || 11, glow: fd.glow ? () => fd.glow(T) : null }));
    }
    const say = D.sprites.say || ['leaf', 'drop', 'sun', 'heart', 'star'], rnd_ = a => a[Math.floor(Math.random() * a.length)], hx = heart.x, hy = heart.y, SP = D.sprites;
    for (let i = 0; i < (L.wide ? SP.n : Math.max(1, SP.n >> 1)); i++) S('sprite' + i, { name: SP.name || 'Light sprite', x: hx, y: hy, hw: 5, hh: 7, magic: true, say, snd: 'chime', sndK: i * 2 + 1, z: sw + 8, ph: 'idle', tm: 6 + i * 13, noReflect: true, tgt: null, spr: true,
      step(n, f) {
        n.tm--; if (n.ph === 'idle') { n.x = hx + Math.sin(f / 13 + i * 1.3) * 10; n.y = hy + Math.sin(f / 7 + i) * 4; if (n.tm <= 0) { const pool = plants.concat(ECO.kind('creature').filter(c2 => !c2.spr && !c2.folk && !c2.hidden)); n.tgt = pool[Math.floor(Math.random() * pool.length)]; n.ph = 'fly'; n.tm = 18; n.fx = n.x; n.fy = n.y; } }
        else if (n.ph === 'fly') { const u = 1 - n.tm / 18, t = n.tgt; n.x = n.fx + (t.x - n.fx) * u + Math.sin(u * 9) * 2; n.y = n.fy + ((t.y - (t.hh || 6)) - n.fy) * u - Math.sin(u * Math.PI) * 10; if (n.tm <= 0) { t.en = 1; t.fl = 1; t.kick = 1; ECO.spark(t.x, t.y - (t.hh || 6), 9, SP.col || '#ffffff', .7, .5); if (t.kind === 'creature') ECO.say(t, rnd_(say), false); n.ph = 'back'; n.tm = 20; n.fx = n.x; n.fy = n.y; } }
        else if (n.ph === 'back') { const u = 1 - n.tm / 20; n.x = n.fx + (hx - n.fx) * u; n.y = n.fy + (hy - n.fy) * u - Math.sin(u * Math.PI) * 8; if (n.tm <= 0) { n.ph = 'idle'; n.tm = 30 + Math.floor(Math.random() * 80); sp.fl = .8; } }
      },
      draw: (c, n, f) => SP.draw(c, n, f, T, i), glow: { col: SP.col || '#ffffff', r: SP.r || 11, a: T.lit * .4 + (SP.a == null ? .2 : SP.a), dy: 4 } });
    D.animals.forEach((ad, ai) => {
      const x = ad.u != null ? NK.u(L, ad.u) : L.cx, y = ad.dy != null ? sw + ad.dy : ad.y != null ? ad.y : sw + (ad.row == null ? 8 : ad.row), rg = ad.range == null ? 16 : ad.range;
      const base = { id: ad.id, name: ad.name, x, y, hw: ad.hw || 7, hh: ad.hh || 7, say: ad.say || ['leaf', 'heart', 'note'], snd: ad.snd || 'snuffle', sndK: ad.sndK, z: y, magic: !!ad.magic, dd: ad.dir || 1, x0: x - rg, x1: x + rg, gz: 0, ph: ai * 3, st: 0, noReflect: !!ad.air, draw: (c, n, f) => ad.draw(c, n, f, T) };
      if (ad.glow) base.glow = ad.glow(T);
      if (ad.mode === 'walk') base.step = (n, f) => { if (n.fl < .3 && f % (ad.every || 6) === 0) { n.gz = (n.gz + 1) % 8; if (n.gz > 4) { n.x += n.dd * (ad.spd || 1.2); if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } } };
      else if (ad.mode === 'crawl') base.step = (n, f) => { if (f % (ad.every || 5) === 0 && n.fl < .3) { n.x += n.dd * (ad.spd || .5); if (n.x > n.x1) n.dd = -1; if (n.x < n.x0) n.dd = 1; } };
      else if (ad.mode === 'hop') base.step = (n, f) => { if (f % 30 === 0 && n.fl < .3) n.st = Math.random() < .55 ? 1 : 0; };
      else if (ad.mode === 'hover') { const hv = ad.hover || {}; base.step = (n, f) => { n.x = x + Math.sin(f / (hv.sx || 31) + n.ph) * (hv.rx || 30) + Math.sin(f / 5 + n.ph) * (hv.jx || 0); n.y = (hv.dy != null ? sw + hv.dy : hv.cy != null ? hv.cy : y) + Math.sin(f / (hv.sy || 17) + n.ph) * (hv.ry || 8) + Math.sin(f / 4) * (hv.jy || 0); n.dd = Math.cos(f / (hv.sx || 31) + n.ph) >= 0 ? 1 : -1; n.z = Math.max(sw - 10, n.y); }; }
      S(ad.id, base);
    });
    if (D.after) D.after(g, L);
  }
  VISTA.reg(D.id, {
    stageK: .55, eco: true,
    pal, weather: D.weather || { dir: 'up', cols: ['#ffffff'], glow: true, depths: [{ n: 8, size: 1, dur: 40, z: 1, seed: 6, op: .85 }, { n: 3, size: 2, dur: 26, z: 3, seed: 3, op: .75, blur: 1.2 }] },
    layout(g) {
      const G0 = NK.geom(g), H = g.H, w = D.houseW || 38;
      g.L = Object.assign(G0, { house: { x: G0.x0 - 4 }, hut: { x: 0 }, patch: { x0: 0, x1: 0 }, spirit: { x: 0, h: Math.round(H * (D.spiritH || .4)) }, water: { x: 0, y: 0 }, fairies: [] });
      const L = g.L; L.hut.x = NK.u(L, .38); L.patch = { x0: NK.u(L, .47), x1: NK.u(L, .47) + (L.wide ? 42 : 28) }; L.spirit.x = NK.u(L, L.wide ? .9 : .84); L.water = { x: NK.u(L, .5), y: L.sw + Math.round((H - L.sw) * .5) - 1 };
      if (!L.wide) { L.house.x = L.x0 - 10; L.hut.x = NK.u(L, .4); }
      if (D.geom) D.geom(L, G0, H);
      ECO.end(); buildAll(g);
    },
    rays(g) { if (D.rays) return D.rays(g, g.L); const out = []; if (g.mood === 'night') return out; for (let i = 0; i < 3; i++) out.push({ x: g.L.cx - 40 + i * 34, w: 7 + i * 2, sk: .3, a: g.T.shaftA, d: i * 2.2, col: g.T.shaft }); return out; },
    layers(g) {
      const T = g.T, L = g.L, H = g.H, st = () => { const q = /[?&]stage=([0-7])\b/.exec(location.search); return q ? +q[1] : g.tk.stage(); };
      const stageLayer = { id: 'stage', k: .56, stage: true, live: true, paint: (c, g2) => stage(c, Object.assign({ W: g.W, H: g.H }, g2), T, L, st()), live(c, f, g2) { ECO.draw(c, f, g2); if (D.liveExtra) D.liveExtra(c, f, T, L); if (NK.forest && D.depth !== false) NK.forest.depth(c, g.mood); } };
      if (D.layersFn) return D.layersFn(g, { T, L, H, stageLayer });
      const W2 = D.wall.ramps(T);
      return [
        { id: 'sky', k: .04, paint: (c, g2) => D.paintSky(c, g2, T, L) },
        { id: 'far', k: .12, blur: 1, paint: (c, g2) => D.paintFar(c, g2, T, L) },
        frameG('wallB', .24, { seed: 5, cy: Math.round(H * .44), rx: Math.round(L.cw * .34), ry: Math.round(H * .3), ramp: W2[0], bite: .14, r: 4, hang: D.wall.hang && D.wall.hang(T), hangN: 5, flat: D.wall.flat, after: D.wall.after && ((c, g2, e) => D.wall.after(c, g2, T, L, 0, e)) }, .8, L),
        frameG('wallM', .4, { seed: 9, cy: Math.round(H * .5), rx: Math.round(L.cw * .5), ry: Math.round(H * .4), ramp: W2[1], bite: .13, r: 5, hang: D.wall.hang && D.wall.hang(T), hangN: 8, flat: D.wall.flat, after: D.wall.after && ((c, g2, e) => D.wall.after(c, g2, T, L, 1, e)) }, 0, L),
        { id: 'stage', k: .56, stage: true, live: true, paint: (c, g2) => stage(c, Object.assign({ W: g.W, H: g.H }, g2), T, L, st()), live(c, f, g2) { ECO.draw(c, f, g2); if (D.liveExtra) D.liveExtra(c, f, T, L); } },
        frameG('wallN', .95, { seed: 13, cy: Math.round(H * .56), rx: Math.round(L.cw * .78), ry: Math.round(H * .58), ramp: W2[2], bite: .1, r: 6, tex: 90, hang: D.wall.hang && D.wall.hang(T), hangN: 12, after: D.wall.after && ((c, g2, e) => D.wall.after(c, g2, T, L, 2, e)) }, 0, L),
        { id: 'fg', k: 1.8, blur: 2.6, op: .92, paint: (c, g2) => D.fg(c, g2, T, L, H, g.W) },
      ];
    },
    lights(f, g) { return D.lights ? D.lights(f, g, g.L) : []; },
  });
};
