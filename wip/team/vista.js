/* ---------- the world engine: depth, light and weather ----------
   The picture is a stack of separate canvases, back to front: sky, three hazy distances, the middle ground, the stage (where the
   cliff, the houses and the creatures are), then the near things and last the big blurred leaves almost in your face. Each is its own
   element, so the browser's compositor slides them past each other by different amounts when you move the pointer or tilt the phone
   (parallax, with no JavaScript per frame) and a slow idle sway keeps the place breathing. Far and near layers carry a touch of blur and
   haze (depth of field). On top of the stage sits a light canvas drawn with glows (screen blend) so lanterns, lava, mushrooms and
   fairies really light what is around them, plus god rays and weather that fall or rise on their own CSS clocks.
   The crisp parts are drawn once into low-res canvases (about 200 units tall, scaled up with hard edges); the soft parts are smooth.
   A realm is a "set" (see vsets.js) that says what each layer paints; any layer can be swapped for authored art later.
   Live drawing (water, creatures, glows) runs six times a second and never while the tab is hidden. */
const VISTA = (() => {
  const A = 5;                       /* how far the camera swings (units) at depth factor 1 */
  const SETS = {};
  let root = null, stack = null, G = null, set = null, LY = [], stage = null, glowCv = null, glowCx = null, fx = null, cam = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, f = 0, still = false, wired = false, lastMv = 0, PXs = 3;
  const reduce = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  function lay(def, z) {
    const k = def.k, pad = Math.ceil(A * k) + 3, padY = Math.ceil(A * k * .5) + 2, w = G.W + pad * 2, h = G.H + padY * 2, res = def.live ? 1 : (def.res || 1);
    const wrap = mk('div', 'vk'), cv = mk('canvas', 'vc'); cv.width = w * res; cv.height = h * res;
    wrap.style.cssText = `left:${-pad * G.PX}px;top:${-padY * G.PX}px;width:${w * G.PX}px;height:${h * G.PX}px;z-index:${z}`;
    cv.style.cssText = `width:${w * G.PX}px;height:${h * G.PX}px;` + (def.blur ? `filter:blur(${def.blur}px);` : '') + (def.op != null ? `opacity:${def.op};` : '');
    if (!still && def.sway !== 0) { const sw = Math.max(.6, k * 1.4) * G.PX; cv.style.setProperty('--sw', sw + 'px'); cv.style.animationDuration = (11 + (z * 3.7) % 9) + 's'; cv.classList.add('vsway'); }
    wrap.append(cv); stack.append(wrap);
    const L = { def, k, pad, padY, wrap, cv, cx: cv.getContext('2d'), w, h, res };
    if (def.live) { L.base = mk('canvas'); L.base.width = w; L.base.height = h; L.bx = L.base.getContext('2d'); }
    return L;
  }
  /* paint one layer. Origin moves so painters work in viewport units (x from -pad to W+pad). */
  function paintLayer(L) {
    const c = L.live ? L.bx : L.cx; c.clearRect(0, 0, L.w * L.res, L.h * L.res); c.save(); if (L.res > 1) c.scale(L.res, L.res); c.translate(L.pad, L.padY);
    const g = Object.assign({}, G, { x0: -L.pad, x1: G.W + L.pad, y0: -L.padY, y1: G.H + L.padY, pad: L.pad, padY: L.padY });
    L.def.paint(c, g); c.restore();
    if (L.live) { L.cx.clearRect(0, 0, L.w, L.h); L.cx.drawImage(L.base, 0, 0); }
  }
  function build(o) {
    destroy();
    still = reduce(); PXs = o.PX;
    set = SETS[o.realm] || SETS.wood;
    G = { W: o.W, H: o.H, PX: o.PX, mood: o.mood, realm: o.realm, R: VG.rnd, tk: o.tk || {} };
    G.T = set.pal(o.mood, G.tk); G.L = {}; ECO.end(); set.layout(G); if (!set.eco) LIFE.init(G.L, G.W, G.H, G.T, o.realm, o.mood);
    root = mk('div'); root.id = 'vista'; root.setAttribute('aria-hidden', 'true'); stack = mk('div', 'vstack'); root.append(stack);
    root.style.background = G.T.sky[0];
    const defs = set.layers(G); LY = []; let z = 1, glowAt = defs.findIndex(d => d.stage) + 1;
    defs.forEach((d, i) => {
      if (i === glowAt) { addOverlays(z); z += 6; }
      const L = lay(d, z++); L.live = !!d.live; if (d.live) { L.base = mk('canvas'); L.base.width = L.w; L.base.height = L.h; L.bx = L.base.getContext('2d'); }
      LY.push(L); if (d.stage) stage = L; if (d.fx) L.wrap.classList.add('vfx'); paintLayer(L);
    });
    weather(z + 2);
    const vg = mk('div', 'vvig'); vg.style.zIndex = z + 20; root.append(vg);
    document.body.prepend(root); document.body.classList.add('scene-on');
    G.L.fairies = G.L.fairies || []; moveTo(0, 0, true); wire(); tick(0);
  }
  /* light, rays: sit just above the stage, move with it */
  function addOverlays(z) {
    const k = set.stageK || .55, pad = Math.ceil(A * k) + 3, padY = Math.ceil(A * k * .5) + 2, w = G.W + pad * 2, h = G.H + padY * 2;
    const wrap = mk('div', 'vk vlight'); wrap.style.cssText = `left:${-pad * G.PX}px;top:${-padY * G.PX}px;width:${w * G.PX}px;height:${h * G.PX}px;z-index:${z}`;
    glowCv = mk('canvas', 'vglow'); glowCv.width = w; glowCv.height = h; glowCv.style.cssText = `width:${w * G.PX}px;height:${h * G.PX}px`; glowCx = glowCv.getContext('2d'); glowCv._pad = pad; glowCv._padY = padY;
    wrap.append(glowCv);
    const rays = mk('div', 'vrays'); wrap.append(rays);
    for (const r of (typeof set.rays === 'function' ? set.rays(G) : (set.rays || []))) { const e = mk('i'); const x = (r.x + pad) * G.PX, wd = r.w * G.PX; e.style.cssText = `left:${x}px;width:${wd}px;height:${(G.H * .95) * G.PX}px;top:${padY * G.PX}px;opacity:${r.a};transform:skewX(${-r.sk * 40}deg);animation-delay:${-r.d || 0}s;background:linear-gradient(to bottom,${r.col || G.T.shaft},transparent 88%)`; rays.append(e); }
    stack.append(wrap); LY.push({ wrap, k, glow: true, pad, padY, cv: glowCv });
  }
  /* weather that falls or rises on its own CSS clock: one tile of dots per depth, moved by the compositor */
  function weather(z) {
    const W = set.weather; if (!W) return; fx = [];
    for (const d of W.depths) {
      const TW = 72, TH = 96, tile = mk('canvas'); tile.width = TW; tile.height = TH; const c = tile.getContext('2d'), R = VG.rnd(d.seed || 5);
      for (let i = 0; i < d.n; i++) { const x = Math.floor(R() * TW), y = Math.floor(R() * TH), s = d.size, col = W.cols[Math.floor(R() * W.cols.length)]; c.fillStyle = col; c.globalAlpha = d.a == null ? 1 : d.a; c.fillRect(x, y, s, s); if (s > 1 && R() < .5) c.fillRect(x - 1, y + 1, s + 2, Math.max(1, s - 1)); if (W.glow && R() < .25) { c.globalAlpha = .35; c.fillRect(x - 1, y, s + 2, s); } }
      c.globalAlpha = 1; const url = tile.toDataURL();
      const e = mk('div', 'vwx'), up = W.dir === 'up'; e.style.cssText = `z-index:${z + d.z};opacity:${d.op == null ? 1 : d.op};${d.blur ? `filter:blur(${d.blur}px);` : ''}`;
      const inner = mk('div'); const th = TH * G.PX, tw = TW * G.PX;
      inner.style.cssText = `position:absolute;left:0;right:0;top:${up ? 0 : -th}px;height:calc(100% + ${th}px);background:url(${url});background-size:${tw}px ${th}px;image-rendering:pixelated;--th:${th}px;animation:${up ? 'vrise' : 'vfall'} ${d.dur}s linear infinite;${W.sway ? '' : ''}`;
      if (still) inner.style.animation = 'none';
      e.append(inner); root.append(e);
    }
  }
  function destroy() { ECO.end(); if (root) root.remove(); root = null; stack = null; LY = []; stage = null; glowCv = null; glowCx = null; fx = null; document.body.classList.remove('scene-on'); }

  /* camera */
  function moveTo(x, y, snap) {
    cam.x = x; cam.y = y;
    for (const L of LY) { const tx = -x * L.k * A * G.PX, ty = -y * L.k * A * .5 * G.PX; L.wrap.style.transition = snap || still ? 'none' : ''; L.wrap.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`; }
  }
  function wire() {
    if (wired) return; wired = true;
    const move = (px, py) => { if (!root || still) return; const n = Date.now(); if (n - lastMv < 45) return; lastMv = n; tgt.x = Math.max(-1, Math.min(1, (px / innerWidth - .5) * 2)); tgt.y = Math.max(-1, Math.min(1, (py / innerHeight - .5) * 2)); moveTo(tgt.x, tgt.y); };
    document.addEventListener('pointermove', e => move(e.clientX, e.clientY), { passive: true });
    window.addEventListener('deviceorientation', e => { if (!root || still || e.gamma == null) return; const n = Date.now(); if (n - lastMv < 45) return; lastMv = n; tgt.x = Math.max(-1, Math.min(1, e.gamma / 28)); tgt.y = Math.max(-1, Math.min(1, ((e.beta || 45) - 50) / 40)); moveTo(tgt.x, tgt.y); }, { passive: true });
  }
  /* where the stage layer sits right now in screen pixels (so a tap lands on the right thing) */
  function shift() { return stage ? { x: -cam.x * stage.k * A * PXs, y: -cam.y * stage.k * A * .5 * PXs } : { x: 0, y: 0 }; }

  /* the six-per-second live pass */
  function tick(fr) {
    if (!root || !stage) return; f = fr == null ? f + 1 : fr; const T = G.T;
    for (const L of LY) {
      if (!L.def || !L.def.live) continue;
      const c = L.cx; c.clearRect(0, 0, L.w, L.h); c.drawImage(L.base, 0, 0); c.save(); c.translate(L.pad, L.padY);
      const g = Object.assign({}, G, { x0: -L.pad, x1: G.W + L.pad, y0: -L.padY, y1: G.H + L.padY, pad: L.pad, padY: L.padY });
      c.__ox = L.pad; c.__oy = L.padY; L.def.live(c, f, g); c.restore();
    }
    if (glowCx) {
      const c = glowCx, p = glowCv._pad, py = glowCv._padY; c.clearRect(0, 0, glowCv.width, glowCv.height); c.globalCompositeOperation = 'lighter'; c.save(); c.translate(p, py);
      const ls = (set.lights ? set.lights(f, G) : []).concat(ECO.on() ? ECO.lights() : []); for (const l of ls) VG.soft(c, l.x, l.y, l.r, l.col, l.a);
      for (const fy of G.L.fairies) if (fy._x != null) VG.soft(c, fy._x, fy._y, 11, T.fairy[fy.c % T.fairy.length], G.mood === 'day' ? .22 : .5);
      c.restore(); c.globalCompositeOperation = 'source-over';
    }
  }
  const repaintStage = () => { if (stage) { paintLayer(stage); tick(); } };
  const stageCtx = () => stage ? { c: stage.cx, ox: stage.pad, oy: stage.padY } : null;
  return { SETS, build, tick, destroy, shift, stageCtx, repaintStage, on: () => !!root, reg: (id, s) => { SETS[id] = s; }, get G() { return G; }, get set() { return set; }, get still() { return still; } };
})();
