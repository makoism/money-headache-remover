/* ---------- ECO: the living network every new realm is built on ----------
   Every realm is one living thing. It has a Spirit (a tree, a crystal heart, a great old jelly, a hill that breathes) and everything
   in it, every plant, every creature, every home, is connected to it and to each other. They talk. A creature says something (a little
   glyph in a bubble: a heart, a leaf, a drop, a note, a coin), the nearest one answers, and a bead of light runs along the link between
   them. Tap anything and it answers; every sound the app makes (a coin, a page turned, a streak) sends a wave out from the Spirit that
   the whole realm feels. A realm gives ECO its nodes (what they look like and how they move) and how its links look (roots in the soil,
   glowing threads in the water, wires on the poles); ECO runs the talking, the waves and the touch.
   Drawn in the stage's live layer six times a second; nothing here runs while the tab is hidden. */
const ECO = (() => {
  let G = null, N = [], LK = [], PU = [], BU = [], WV = [], PT = [], hooks = {}, f = 0, on = false, tipEl = null, nextTalk = 0, gust = 0, sy = 0;
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const amb = (n, x, v, k) => { try { if (typeof AMBI !== 'undefined' && n) AMBI.sound(n, Math.max(0, Math.min(1, x / (G ? G.W : 1))), v, k); } catch (e) { /* sound is a bonus */ } };
  /* the glyphs creatures speak in: five by five */
  const GL = {
    heart: ['.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'], leaf: ['...oo', '..ooo', '.ooo.', 'ooo..', 'o....'], drop: ['..o..', '.ooo.', 'ooooo', 'ooooo', '.ooo.'],
    note: ['..ooo', '..o.o', '..o..', 'oo...', 'oo...'], star: ['..o..', 'ooooo', '.ooo.', 'oo.oo', 'o...o'], coin: ['.ooo.', 'o...o', 'o.o.o', 'o...o', '.ooo.'],
    spiral: ['ooooo', 'o...o', 'o.o.o', 'o.o.o', 'o.ooo'], eye: ['.....', '.ooo.', 'o.o.o', '.ooo.', '.....'], fish: ['.....', 'oo.oo', 'ooooo', 'oo.oo', '.....'],
    sun: ['o.o.o', '.ooo.', 'ooooo', '.ooo.', 'o.o.o'], moon: ['.ooo.', 'oo...', 'oo...', 'oo...', '.ooo.'], key: ['.oo..', 'o..o.', '.oo..', '.o...', '.oo..'],
    house: ['..o..', '.ooo.', 'ooooo', 'o.o.o', 'ooooo'], wave: ['.....', '.o.o.', 'o.o.o', '.....', '.....'], paw: ['o.o.o', '.....', '.ooo.', 'ooooo', '.o.o.'],
    fire: ['..o..', '.oo..', '.ooo.', 'ooooo', '.ooo.'], bell: ['..o..', '.ooo.', '.ooo.', 'ooooo', '..o..'], dot: ['.....', '.ooo.', '.ooo.', '.ooo.', '.....'], rain: ['o...o', '.o.o.', 'o...o', '.o.o.', 'o...o'],
  };
  const GLK = Object.keys(GL);
  const glyph = (c, g, x, y, col) => { const s = GL[g] || GL.dot; c.fillStyle = col; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (s[j][i] === 'o') c.fillRect(x + i, y + j, 1, 1); };

  function begin(g, h) { G = g; hooks = h || {}; N = []; LK = []; PU = []; BU = []; WV = []; PT = []; f = 0; on = true; nextTalk = 12; gust = 0; }
  function end() { on = false; N = []; LK = []; PU = []; BU = []; WV = []; PT = []; if (tipEl) tipEl.classList.remove('show'); }
  function add(n) { n.hw = n.hw || 6; n.hh = n.hh || 6; n.fl = 0; n.kick = 0; n.say = n.say || []; n.ox = n.x; n.oy = n.y; N.push(n); return n; }
  function link(a, b, o) { const l = Object.assign({ a, b, w: 1, fl: 0, sag: 0, col: null }, o || {}); LK.push(l); return l; }
  const kind = k => N.filter(n => n.kind === k);
  const spirit = () => N.find(n => n.kind === 'spirit');
  /* wire the realm: every plant to the Spirit, every creature to its nearest plant and to its nearest neighbour, homes to the Spirit */
  function autoLinks(o) {
    o = o || {}; const sp = spirit(), plants = kind('plant'), cr = kind('creature'), homes = kind('home');
    const nearest = (n, arr, skip) => { let best = null, bd = 1e9; for (const m of arr) { if (m === n || (skip && skip(m))) continue; const d = Math.hypot(m.x - n.x, (m.y - n.y) * 1.6); if (d < bd) { bd = d; best = m; } } return best; };
    if (sp && !o.noRoots) for (const p of plants) link(sp, p, { kind: 'root', sag: o.sag });
    if (sp && !o.noRoots) for (const h of homes) link(sp, h, { kind: 'root', sag: o.sag });
    for (const c of cr) { const p = nearest(c, plants); if (p) link(p, c, { kind: 'feed' }); const q = nearest(c, cr); if (q && !LK.some(l => (l.a === c && l.b === q) || (l.a === q && l.b === c))) link(c, q, { kind: 'talk' }); }
    if (sp && !o.noRoots) { const far = cr.slice().sort((a, b) => Math.hypot(a.x - sp.x, a.y - sp.y) - Math.hypot(b.x - sp.x, b.y - sp.y)).slice(0, 3); for (const c of far) link(sp, c, { kind: 'root' }); }
  }
  const pos = l => { const A = l.a, B = l.b; return { x1: A.x, y1: A.y - (A.lift == null ? A.hh * .5 : A.lift), x2: B.x, y2: B.y - (B.lift == null ? B.hh * .5 : B.lift) }; };
  function at(l, u) {
    const p = pos(l); if (hooks.route) { const r = hooks.route(l, u, p); if (r) return r; }
    const sag = l.sag || (hooks.sag != null ? hooks.sag : 0), len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
    return { x: p.x1 + (p.x2 - p.x1) * u, y: p.y1 + (p.y2 - p.y1) * u + Math.sin(u * Math.PI) * sag * Math.min(1, len / 60) };
  }
  const pulse = (l, back, col, sp) => { if (PU.length < 28 && l) PU.push({ l, u: back ? 1 : 0, v: (back ? -1 : 1) * (sp || (.07 + Math.random() * .05)), col: col || (hooks.pulse || '#ffffff') }); };
  function say(n, g, reply) {
    if (!n) return; if (!BU.some(b => b.n === n) && BU.length >= (G.W > 210 ? 2 : 1)) { n.fl = Math.max(n.fl, .6); return; } BU = BU.filter(b => b.n !== n); BU.push({ n, g: g || rnd(n.say.length ? n.say : GLK), t: 0, life: 22 }); n.fl = Math.max(n.fl, .6);
    amb(n.snd, n.x, .45, n.sndK); if (n.talk) n.talk(n);
    if (reply !== false) {
      const cs = LK.filter(l => (l.a === n || l.b === n) && l.kind !== 'root'); if (cs.length) { const l = rnd(cs), other = l.a === n ? l.b : l.a; pulse(l, l.b === n, hooks.pulse, .1); l.fl = 1; setTimeout(() => { if (on && N.includes(other)) { if (other.kind === 'creature') say(other, rnd(other.say.length ? other.say : GLK), false); else { other.fl = 1; other.kick = 1; } } }, 700); }
    }
  }
  function wave(x, y, col, power, nolight) { WV.push({ x, y, r: 2, col: col || hooks.wave || '#ffffff', max: (power || 1) * Math.max(G.W * .55, 120), hit: new Set(), nolight }); if (WV.length > 4) WV.shift(); }
  function spark(x, y, n, col, sp, up) { for (let i = 0; i < n && PT.length < 220; i++) { const a = Math.random() * 6.283, s = (.3 + Math.random()) * (sp || 1); PT.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up || 0), t: 8 + Math.floor(Math.random() * 8), m: 16, col }); } }

  /* the Spirit breathes: a slow wave now and then, and a creature speaks now and then */
  function life() {
    if (f >= nextTalk) {
      nextTalk = f + 90 + Math.floor(Math.random() * 150); const cs = kind('creature').filter(c => !c.hidden);
      if (cs.length && Math.random() < .5) say(rnd(cs));
      const sp = spirit(); if (sp && Math.random() < .3) { wave(sp.x, sp.y, hooks.wave, .8); sp.fl = 1; amb(sp.snd, sp.x, .35, sp.sndK); }
      const ls = LK.filter(l => l.kind === 'root'); if (ls.length && Math.random() < .8) pulse(rnd(ls), Math.random() < .3, hooks.pulse);
    }
  }
  function step() {
    gust *= .88; if (gust < .02) gust = 0;
    for (const n of N) { n.fl *= .8; if (n.fl < .03) n.fl = 0; n.kick *= .82; if (n.kick < .03) n.kick = 0; if (n.step) n.step(n, f, G); }
    const cr = kind('creature'), pl = kind('plant');
    for (const c of cr) { if (c.still || c.hidden) continue; for (const p of pl) if (Math.abs(p.x - c.x) < 6 && Math.abs(p.y - c.y) < 5 && p.kick < .5) p.kick = 1; }
    for (const l of LK) { l.fl *= .85; if (l.fl < .03) l.fl = 0; }
    for (const p of PU) { p.u += p.v; if (p.u >= 1 || p.u <= 0) { p.dead = true; const to = p.v > 0 ? p.l.b : p.l.a; to.fl = Math.max(to.fl, .8); to.kick = Math.max(to.kick, .6); if (to.kind === 'plant' && hooks.fed) hooks.fed(to, p); p.l.fl = 1; } }
    PU = PU.filter(p => !p.dead);
    for (const w of WV) { const pr = w.r; w.r += 5; for (const n of N) { if (w.hit.has(n)) continue; const d = Math.hypot(n.x - w.x, (n.y - w.y) * 2.1); if (d <= w.r) { w.hit.add(n); n.fl = 1; n.kick = 1; if (n.kind === 'creature' && Math.random() < .1) say(n, rnd(n.say.length ? n.say : GLK), false); if (n.kind === 'plant' && hooks.fed) hooks.fed(n, { col: w.col }); } } }
    WV = WV.filter(w => w.r < w.max);
    for (const b of BU) b.t++; BU = BU.filter(b => b.t < b.life);
    for (const p of PT) { p.x += p.vx; p.y += p.vy; p.vy += .02; p.t--; } PT = PT.filter(p => p.t > 0);
    life();
  }
  function bubble(c, b, T) {
    const n = b.n, u = b.t / b.life, pop = Math.min(1, b.t / 2.5), fade = u > .82 ? (1 - u) / .18 : 1, w = 11, h = 9, bx = Math.round(n.x - w / 2), by = Math.round(n.y - (n.bh || n.hh * 2) - 12 - (1 - pop) * 3 - Math.sin(b.t / 3) * .6);
    const B = hooks.bubble || {}; c.globalAlpha = fade * pop;
    c.fillStyle = B.edge || '#1b2a24'; c.fillRect(bx + 1, by, w - 2, h); c.fillRect(bx, by + 1, w, h - 2); c.fillRect(Math.round(n.x) - 1, by + h, 3, 1); c.fillRect(Math.round(n.x), by + h + 1, 1, 1);
    c.fillStyle = B.bg || '#f2f8ee'; c.fillRect(bx + 1, by + 1, w - 2, h - 2); c.fillRect(Math.round(n.x) - 1, by + h - 1, 3, 1); c.fillRect(Math.round(n.x), by + h, 1, 1);
    glyph(c, b.g, bx + 3, by + 2, (B.ink && B.ink[GLK.indexOf(b.g) % B.ink.length]) || '#2a6a4a'); c.globalAlpha = 1;
  }
  const sortKey = n => n.z != null ? n.z : n.y;
  function draw(c, fr, g) {
    if (!on) return; f = fr; step();
    if (hooks.under) hooks.under(c, f, g, N);
    for (const l of LK) { if (hooks.link) hooks.link(c, l, at, f, g); else defLink(c, l); }
    const order = N.slice().sort((a, b) => sortKey(a) - sortKey(b));
    for (const n of order) if (!n.hidden && n.draw) n.draw(c, n, f, g);
    for (const p of PU) { const q = at(p.l, p.u); c.fillStyle = p.col; c.globalAlpha = .9; c.fillRect(Math.round(q.x) - 1, Math.round(q.y) - 1, 2, 2); c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
    for (const w of WV) { const a = Math.max(0, 1 - w.r / w.max), rx = w.r, ry = w.r * .3, n = Math.max(16, Math.round(rx * .9)); c.fillStyle = w.col; c.globalAlpha = a * .75; for (let i = 0; i < n; i++) { const t = i / n * 6.283; if ((i + (f >> 1)) % 3) continue; c.fillRect(Math.round(w.x + Math.cos(t) * rx), Math.round(w.y + Math.sin(t) * ry), 1, 1); } c.globalAlpha = 1; }
    for (const p of PT) { c.globalAlpha = Math.min(1, p.t / 6); c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } c.globalAlpha = 1;
    for (const b of BU) bubble(c, b, g.T);
    if (hooks.over) hooks.over(c, f, g, N);
  }
  function defLink(c, l) { const col = l.col || (hooks.line || '#ffffff'), len = Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y), n = Math.max(6, Math.round(len / 2.5)); c.fillStyle = col; for (let i = 1; i < n; i++) { if (i % 2) continue; const q = at(l, i / n); c.globalAlpha = .18 + l.fl * .6; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1; }
  /* light for the glow canvas: flashing nodes, glowing things, beads, and the waves' fronts */
  function lights() {
    const out = [];
    for (const n of N) { if (n.hidden) continue; const gl = typeof n.glow === 'function' ? n.glow(n, f) : n.glow; if (gl) out.push({ x: n.x, y: n.y - (gl.dy == null ? n.hh : gl.dy), r: gl.r * (1 + n.fl * .5), col: gl.col, a: gl.a * (1 + n.fl * .9) }); else if (n.fl > .25) out.push({ x: n.x, y: n.y - n.hh, r: 14, col: hooks.pulse || '#ffffff', a: n.fl * .4 }); }
    for (const p of PU) { const q = at(p.l, p.u); out.push({ x: q.x, y: q.y, r: 9, col: p.col, a: .5 }); }
    for (const w of WV) { if (w.nolight) continue; const a = Math.max(0, 1 - w.r / w.max); for (let i = 0; i < 8; i++) { const t = i / 8 * 6.283 + w.r * .01; out.push({ x: w.x + Math.cos(t) * w.r, y: w.y + Math.sin(t) * w.r * .3, r: 12, col: w.col, a: a * .12 }); } }
    const dk = G && G.mood === 'day' ? .3 : G && G.mood === 'morning' ? .55 : 1; if (dk < 1) for (const o of out) o.a *= dk;
    return out;
  }
  /* touch */
  function find(ax, ay) { let best = null, bd = 1; for (const n of N) { if (n.hidden || n.nohit) continue; const d = Math.hypot((ax - n.x) / n.hw, (ay - (n.y - n.hh)) / n.hh); if (d < bd) { bd = d; best = n; } } return best; }
  let menuUsed = false; try { menuUsed = !!localStorage.getItem('mhr-menu-used'); } catch (e) { /* private mode */ }
  const markUsed = () => { if (menuUsed) return; menuUsed = true; try { localStorage.setItem('mhr-menu-used', '1'); } catch (e) { /* private mode */ } };
  function hideTip() { if (tipEl) { clearTimeout(tipEl._t); tipEl.classList.remove('show'); } }
  function label(txt, x, y, ms, ico) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'lifetip'; document.body.append(tipEl); }
    tipEl.textContent = ''; if (ico) { const i = document.createElement('span'); i.className = 'ico'; i.innerHTML = ico; tipEl.append(i); } tipEl.append(document.createTextNode(txt)); tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; tipEl.classList.add('show'); clearTimeout(tipEl._t); tipEl._t = setTimeout(() => tipEl.classList.remove('show'), ms || 1800);
  }
  function hit(cx, cy, PX) {
    if (!on) return false; const ax = cx / PX, ay = cy / PX, n = find(ax, ay); if (!n) return false;
    if (n.tool) setTimeout(() => label(n.tool.say(), cx, cy - 26, 0, n.tool.ico), 120); else if (!n.menu) label(n.name, cx, cy - 26, 0, n.ico); n.fl = 1; n.kick = 1.4; if (n.menu) markUsed(); if (n.tap) n.tap(n); amb(n.snd, n.x, 1, n.sndK);
    if (n.kind === 'spirit') { wave(n.x, n.y, hooks.wave, 1.4); for (const c of kind('creature')) setTimeout(() => { if (on) say(c, rnd(c.say.length ? c.say : GLK), false); }, 200 + Math.random() * 900); }
    else if (n.kind === 'creature') { say(n); wave(n.x, n.y, hooks.wave, .35); }
    else if (n.kind === 'plant') { const l = LK.find(q => q.b === n && q.a.kind === 'spirit'); if (l) pulse(l, false, hooks.pulse, .09); spark(n.x, n.y - n.hh, 8, hooks.pulse || '#fff', .7, .3); }
    else if (n.kind === 'house') { spark(n.x, n.y - n.hh, 12, '#ffd27a', .9, .5); const b = document.querySelector('.tabs [data-tab="home"]'); if (b && document.body.classList.contains('shut')) setTimeout(() => b.click(), 350); }
    else { wave(n.x, n.y, hooks.wave, .4); const l = LK.find(q => q.a === n || q.b === n); if (l) pulse(l, l.b === n, hooks.pulse, .09); }
    return true;
  }
  /* hovering a menu thing (a mushroom, a lantern) names the page it opens; everything else just shows the poke cursor */
  const hover = (cx, cy, PX) => {
    if (!on) return false; const n = find(cx / PX, cy / PX); if (!n) return false;
    if (n.tool) { label(n.tool.say(), cx, cy - 26, 0, n.tool.ico); n.hov = Date.now(); }
    else if (n.menu) { const b = document.querySelector('.tabs [data-tab="' + n.menu + '"]'); if (b) label(b.firstChild ? b.firstChild.textContent.trim() + (b.dataset.cap ? ' · ' + b.dataset.cap : '') : n.name, cx, cy - 26, 0, n.ico); n.hov = Date.now(); markUsed(); }
    return true;
  };
  /* every sound the app makes is something that happens here */
  function onSfx(s) {
    if (!on) return; const sp = spirit(), cr = kind('creature'), ox = sp ? sp.x : G.W / 2, oy = sp ? sp.y : G.H * .7;
    if (s === 'whoosh' || s === 'next' || s === 'back') { gust = Math.min(1.6, gust + 1); if (hooks.gust) hooks.gust(1); wave(G.W * (.3 + Math.random() * .4), G.H * .8, hooks.wave, .5, true); }
    else if (s === 'coin') { wave(ox, oy, '#fff1a8', 1); if (sp) sp.fl = 1; const ls = LK.filter(l => l.kind === 'root'); for (let i = 0; i < 3 && ls.length; i++) setTimeout(() => { if (on) pulse(rnd(ls), false, '#fff1a8', .1); }, i * 240); for (const c of cr.slice(0, 4)) setTimeout(() => { if (on) say(c, 'coin', false); }, 500 + Math.random() * 700); amb(sp && sp.snd, ox, .6, sp && sp.sndK); }
    else if (s === 'sparkle' || s === 'fanfare') { const big = s === 'fanfare'; wave(ox, oy, hooks.wave, big ? 1.6 : 1); if (big) setTimeout(() => { if (on) wave(ox, oy, '#fff1a8', 1.6); }, 500); if (sp) sp.fl = 1; for (const c of cr) if (c.magic || big) setTimeout(() => { if (on) { say(c, rnd(['star', 'heart', 'sun', 'note']), false); spark(c.x, c.y - c.hh, 5, '#fff1a8', .8, .5); } }, 250 + Math.random() * 900); for (const l of LK.filter(q => q.kind === 'root')) pulse(l, false, '#fff1a8', .1); }
    else if (s === 'soft') { wave(ox, oy, hooks.wave, .6); for (const c of cr) if (Math.random() < .5) setTimeout(() => { if (on) say(c, 'moon', false); }, 400 + Math.random() * 900); }
    else if (s === 'pop' || s === 'tap' || s === 'tick' || s === 'type' || s === 'thunk' || s === 'off') { const ls = LK; if (ls.length && Math.random() < (s === 'tap' ? .7 : .4)) pulse(rnd(ls), Math.random() < .5, hooks.pulse, .1); if (s === 'pop' || s === 'thunk') { const n = rnd(N); if (n) { n.fl = 1; n.kick = 1; } } }
  }
  /* helpers for drawing */
  const sway = (x, fr, amp) => Math.sin(fr / 9 + x * .07) * (amp == null ? 1 : amp) + gust * 1.6;
  return { tip: label, hideTip, menuUsed: () => menuUsed, at, begin, end, add, link, autoLinks, kind, spirit, draw, lights, hit, hover, onSfx, say, wave, spark, pulse, glyph, GL, GLK, sway, nodes: () => N, links: () => LK, on: () => on, gust: () => gust, set gust(v) { gust = v; } };
})();

if (/[?&]lifetest\b/.test(location.search)) window.__ECO = ECO;
