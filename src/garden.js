/* ---------- the garden: quiet nature on the cards ----------
   A thin layer (.gnl) inside each page holds, for each box, a container (.gdh) with:
     - one vine of its own kind (ivy, morning glory, wisteria, bramble, fern, clover) along an edge, bending round the words and controls;
     - a thin border vine along another edge, hugging the rim, swelling now and then into a bigger tuft; and sometimes a second one;
     - on a few cards, one small plant (sprout, berries, leaves) standing in free room at the right side of the card.
   A box with no good place for something gets nothing. Nothing is clickable: the layer takes no taps, so words and buttons keep every one.
   The picture follows the layout: it is redrawn when a box changes size, a page opens, or the cards are rebuilt (GD.queue()). */
const GD = (() => {
  const S = 3, OV = 2, D = 16;                 /* one cell is 3px; vines overhang the edge by 2 cells and reach at most 16 cells in */
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shuffled = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sizeOf = n => gsSize(n), ALLN = () => [].concat(...Object.values(GARDEN_POOL));
  /* ---------- what each card gets ---------- */
  const SPECIES = {
    ivy: { thick: 1, leaf: ['G', 'g', 'G', 'l'], big: .65, tend: .5, end: ['leaf', 'leaf', 'berry'], bloom: [], bp: 0, edges: ['left', 'right'] },
    glory: { thick: 1, leaf: ['g', 'l', 'g'], big: .5, tend: .5, end: ['trumpet', 'leaf'], bloom: ['b', 'v', 'b', 'q'], bp: .5, edges: ['right', 'left', 'top'] },
    wisteria: { leaf: ['g', 'G'], big: .15, tend: .9, long: 1, end: ['cluster'], bloom: ['v', 'p'], bp: .1, edges: ['top'] },
    bramble: { thick: 1, leaf: ['G', 'g'], big: .45, tend: .45, end: ['berry', 'berry', 'leaf'], bloom: ['w', 'q'], bp: .35, edges: ['bottom', 'left'] },
    fern: { leaf: ['g', 'l', 'G'], big: 0, tend: .9, end: ['frond'], bloom: [], bp: 0, edges: ['top', 'right'] },
    clover: { leaf: ['g', 'l'], big: 0, tend: .3, end: ['leaf'], bloom: ['p', 'w', 'q'], bp: .4, clover: true, edges: ['bottom', 'top'] },
  };
  const PLAN = {
    hNext: { plant: 'sprout' }, hHero: { vine: 'glory' }, hGoals: { vine: 'wisteria' }, hBuckets: { plant: 'berries' }, hMore: { plant: 'leafpair' },
    scan: { vine: 'fern' }, where: { vine: 'clover' }, ledger: { vine: 'ivy' },
  };
  const usedPlants = new Set(), extra = {};
  function planFor(key) {
    if (PLAN[key]) return PLAN[key];
    if (!extra[key]) { const r = rng(hash('plan-' + key)), names = Object.keys(SPECIES); extra[key] = { vine: names[Math.floor(r() * names.length)] }; }
    return extra[key];
  }
  /* ---------- finding the free room in a box ---------- */
  const SOLID = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'IMG', 'svg', 'CANVAS', 'PROGRESS', 'VIDEO', 'SUMMARY']);
  function occupy(host, hr) {
    const cols = Math.ceil(hr.width / S), rows = Math.ceil(hr.height / S), g = new Uint8Array(cols * rows);
    const mark = (q, m) => {
      const x0 = Math.max(0, Math.floor((q.left - hr.left - m) / S)), x1 = Math.min(cols - 1, Math.floor((q.right - hr.left + m) / S));
      const y0 = Math.max(0, Math.floor((q.top - hr.top - m) / S)), y1 = Math.min(rows - 1, Math.floor((q.bottom - hr.top + m) / S));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y * cols + x] = 1;
    };
    const rg = document.createRange(), walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let n; while ((n = walk.nextNode())) {
      if (!n.textContent.trim()) continue; const pe = n.parentElement; if (!pe || pe.closest('svg')) continue;
      rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width && q.height) mark(q, 5);
    }
    for (const el of host.querySelectorAll('*')) {
      if ((el.closest('svg') && el.tagName !== 'svg') || el.closest('.gnl')) continue;
      const q = el.getBoundingClientRect(); if (!q.width || !q.height) continue;
      if (SOLID.has(el.tagName)) { mark(q, 4); continue; }
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor), a = m ? (m[1].split(',').length > 3 ? parseFloat(m[1].split(',')[3]) : 1) : 0;
      if (a > .04 || cs.backgroundImage !== 'none' || (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') || (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none')) mark(q, 3);
    }
    return { g, cols, rows };
  }
  /* free depth from an edge, per cell along it (in cells), capped at D */
  function profile(o, edge) {
    const { g, cols, rows } = o, n = edge === 'top' || edge === 'bottom' ? cols : rows, out = new Array(n), depthMax = edge === 'top' || edge === 'bottom' ? rows : cols;
    for (let u = 0; u < n; u++) {
      let d = 0; while (d < D && d < depthMax) {
        const x = edge === 'top' || edge === 'bottom' ? u : (edge === 'left' ? d : cols - 1 - d), y = edge === 'top' ? d : edge === 'bottom' ? rows - 1 - d : u;
        if (g[y * cols + x]) break; d++;
      }
      out[u] = d;
    }
    return out;
  }
  /* ---------- the vine ---------- */
  function vineStrip(r, N, avail, u0, u1, sp, lvl, lite) {
    const H = D + OV, grid = []; for (let i = 0; i < H; i++) grid.push(new Array(N).fill(''));
    const put = (u, v, ch, force) => { if (u < 0 || u >= N || v < -OV || v >= D) return false; if (v >= 0 && !force && v >= avail[u]) return false; grid[v + OV][u] = ch; return true; };
    const free = (u, v) => u >= 0 && u < N && v >= 0 && v < avail[u];
    const amp = .9 + r() * 1.1, fr = .1 + r() * .14, ph = r() * 6.3, ys = [], bp = sp.bp * (1 + lvl * .7), pickB = () => sp.bloom[Math.floor(r() * sp.bloom.length)];
    for (let u = u0; u < u1; u++) {
      const taper = Math.min(1, (u - u0) / 6, (u1 - 1 - u) / 6), cap = Math.max(0, Math.min(avail[u] - 1, 4));
      let y;
      if (lite) { /* hugs the rim, now and then swelling into a tuft that reaches further in */
        const bump = Math.max(0, Math.sin((u - u0) / Math.max(8, u1 - u0) * 3.14 * 2 + ph)) * Math.max(0, cap - 1) * .9 * taper;
        y = Math.max(-1, Math.min(Math.max(0, cap), Math.round(-.4 + .9 * (1 + Math.sin(ph + u * fr)) * Math.max(.4, taper) + bump)));
      } else y = Math.max(0, Math.min(cap, Math.round((amp + amp * Math.sin(ph + u * fr)) * Math.max(.35, taper))));
      ys[u] = y;
      put(u, y, 'G', true); if (sp.thick && free(u, y + 1)) put(u, y + 1, 'G'); if (r() < .18) put(u, y - 1, 'g', true);
    }
    for (let u = u0 + 2 + Math.floor(r() * 2); u < u1 - 2; u += 2 + Math.floor(r() * 3)) {
      const y = ys[u] || 0, down = lite ? y >= 0 && r() < .6 : r() < .6, big = r() < sp.big && avail[u] > 5, dv = down ? 1 : -1, ch = sp.leaf[Math.floor(r() * sp.leaf.length)], dir = r() < .5 ? 1 : -1;
      if (sp.clover) { const cy = y + dv * 2; put(u, y + dv, 'G'); put(u, cy, 'g'); put(u - 1, cy, 'l'); put(u + 1, cy, 'l'); put(u, cy + dv, 'l'); }
      else { const cells = big ? [[0, 1], [dir, 1], [2 * dir, 1], [0, 2], [dir, 2], [2 * dir, 2], [dir, 3], [2 * dir, 3], [dir, 4]] : [[0, 1], [dir, 1], [0, 2], [dir, 2]]; for (const [du, dd] of cells) put(u + du, y + dv * dd, ch); put(u + dir, y + dv * 2, 'l'); }
      /* a hanging tendril, ending in the species' own way */
      if (down && r() < sp.tend && (!lite || y >= 2)) {
        const room = Math.max(0, avail[u] - y - 3), len = Math.min(room, sp.long ? 4 + Math.floor(r() * 8) : 2 + Math.floor(r() * 7)); if (len >= 2) {
          let x = u; for (let k = 1; k <= len; k++) { if (k > 2 && r() < .22) x += r() < .5 ? -1 : 1; if (!free(x, y + k)) break; put(x, y + k, k % 3 === 0 ? 'g' : 'G'); if (sp.end[0] === 'frond' && k % 2 === 0) { put(x - 1, y + k, 'l'); put(x + 1, y + k, 'g'); } }
          const ev = y + len, e = sp.end[Math.floor(r() * sp.end.length)];
          if (e === 'berry' && free(x, ev + 1)) { put(x, ev + 1, 'r'); put(x + 1, ev + 1, 'r'); put(x, ev + 2, 'R'); put(x + 1, ev + 2, 'R'); }
          else if (e === 'trumpet') { const c = pickB(); put(x - 1, ev + 1, c); put(x, ev + 1, c); put(x + 1, ev + 1, c); put(x, ev + 2, 'y'); }
          else if (e === 'cluster') { put(x - 1, ev + 1, 'v'); put(x, ev + 1, 'p'); put(x + 1, ev + 1, 'v'); put(x - 1, ev + 2, 'V'); put(x, ev + 2, 'v'); put(x, ev + 3, 'V'); }
          else if (e === 'frond') { put(x, ev + 1, 'l'); put(x - 1, ev + 1, 'g'); put(x + 1, ev + 1, 'g'); }
          else { put(x + 1, ev, 'g'); put(x - 1, ev, 'g'); put(x + 2, ev + 1, 'l'); put(x - 2, ev + 1, 'l'); }
        }
      }
      /* a blossom sitting on the stem */
      if (sp.bloom.length && r() < bp) { const c = pickB(), v = y + (down ? -1 : 1); if (v >= 1 && free(u, v + (down ? 1 : -1))) { put(u, v, 'y'); put(u - 1, v, c); put(u + 1, v, c); put(u, v - 1, c); put(u, v + 1, c); } }
    }
    /* a curl at the tip */
    const tu = u1 - 1, ty = ys[tu] || 0; if (tu - 2 > u0 && !sp.clover) { put(tu + 1, ty + 1, 'G'); put(tu + 1, ty + 2, 'G'); put(tu, ty + 2, 'g'); }
    return grid;
  }
  /* transposes a strip grid for an edge into canvas cells: [col,row] -> char */
  function stripCanvas(grid, N, edge) {
    const H = D + OV, horiz = edge === 'top' || edge === 'bottom', cw = horiz ? N : H, ch = horiz ? H : N;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d'), cells = [];
    if (!x) return null;
    for (let v = 0; v < H; v++) for (let u = 0; u < N; u++) {
      const k = grid[v][u]; if (!k) continue;
      const cx = horiz ? u : edge === 'left' ? v : H - 1 - v, cy = edge === 'top' ? v : edge === 'bottom' ? H - 1 - v : u;
      x.fillStyle = GP[k]; x.fillRect(cx, cy, 1, 1); cells.push([cx, cy]);
    }
    return { c, cells, cw, ch };
  }
  /* ---------- putting a box together ---------- */
  const hostsOf = () => {
    const out = []; const w = document.querySelector('.wrap'); if (!w) return out;
    const top = w.querySelector(':scope > header.top'), tabs = w.querySelector(':scope > .tabs');
    if (top) out.push({ el: top, key: 'header' }); if (tabs) out.push({ el: tabs, key: 'tabs' });
    $$('.wrap [role=tabpanel]').forEach(pg => { pg.querySelectorAll('.card, .hnext').forEach((c, i) => { if (c.parentElement.closest('.card, .hnext')) return; out.push({ el: c, key: c.id || (pg.id + ':' + i) }); }); });
    ['dj', 'cam', 'rep'].forEach(id => { const e = document.getElementById(id); if (e) out.push({ el: e, key: id, dlg: true }); });
    return out;
  };
  const layerOf = el => { const pg = el.getAttribute('role') === 'dialog' ? el : (el.closest('[role=tabpanel]') || document.querySelector('.wrap')); let l = pg.querySelector(':scope > .gnl'); if (!l) { l = document.createElement('div'); l.className = 'gnl'; l.setAttribute('aria-hidden', 'true'); pg.append(l); } return l; };
  const gapsFor = (h, all) => {
    const r = h.rect; let up = 14, down = 14;
    for (const o of all) { if (o === h || !o.rect || !o.rect.width) continue; if (!(o.rect.left < r.right && o.rect.right > r.left)) continue;
      if (o.rect.bottom <= r.top + 1) up = Math.min(up, Math.max(0, r.top - o.rect.bottom)); else if (o.rect.top >= r.bottom - 1) down = Math.min(down, Math.max(0, o.rect.top - r.bottom)); }
    return { up, down };
  };
  /* where a box sits inside its layer's page, from layout offsets (a page that is mid-slide or scaled does not skew it) */
  function offsetIn(el, root) { if (el === root) return { x: 0, y: 0 }; let x = 0, y = 0, e = el; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return e === root ? { x, y } : null; }
  function paint(h, all) {
    const layer = layerOf(h.el); let box = layer.querySelector(':scope > .gdh[data-k="' + h.key + '"]');
    const hr = h.rect = h.el.getBoundingClientRect(), vis = !h.el.closest('[hidden]') && hr.width > 20 && hr.height > 20;
    if (!vis) { if (box) box.remove(); return; }
    const sig = [Math.round(hr.width), Math.round(hr.height), h.sig || ''].join('|');
    const L = layer.getBoundingClientRect(), off = offsetIn(h.el, layer.parentElement), ox = off ? off.x : hr.left - L.left, oy = off ? off.y : hr.top - L.top, o = occupy(h.el, hr), { cols, rows } = o;
    const r = rng(hash('v-' + h.key)), gap = gapsFor(h, all), isBar = h.key === 'header' || h.key === 'tabs';
    if (box) box.remove(); box = document.createElement('div'); box.className = 'gdh'; box.dataset.k = h.key; layer.append(box);
    box._host = h.el; box.dataset.sig = sig; if (grown.has(h.key) || reduced()) box.classList.add('in');
    const taken = new Uint8Array(cols * rows); const takeRect = (i0, j0, i1, j1) => { for (let j = Math.max(0, j0); j <= Math.min(rows - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(cols - 1, i1); i++) taken[j * cols + i] = 1; };
    const blocked = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && (o.g[j * cols + i] || taken[j * cols + i]);
    /* a vine, if this card's plan is a vine: one edge, a part of it, grown further each time it is tapped */
    const plan = planFor(h.key);
    const usedEdges = new Set();
    const placeVine = (spn, lite) => {
      const base = SPECIES[spn], vsp = lite ? Object.assign({}, base, { big: 0, bp: base.bp * .5, tend: Math.min(base.tend, .5) }) : base; let placed = false;
      const order = (lite ? shuffled(['bottom', 'left', 'right', 'top'], r) : base.edges.concat(shuffled(['top', 'bottom', 'left', 'right'], r).filter(e => !base.edges.includes(e)))).filter(e => !usedEdges.has(e));
      for (const e of order) {
        if (e === 'top' && gap.up < (lite ? 4 : 8)) continue; if (e === 'bottom' && gap.down < (lite ? 4 : 8)) continue;
        const av = profile(o, e), N = av.length, mean = av.reduce((a, b) => a + b, 0) / N; if (N < 16 || (!lite && mean < 2.2)) continue;
        const vk = h.key + '|' + e + (lite ? '|b' : ''), vr = rng(hash('vine-' + vk)), span0 = Math.round(N * (lite ? .2 + vr() * .24 : .34 + vr() * .26)), u0 = Math.floor(vr() * Math.max(1, N - span0 - 2)), u1 = u0 + span0;
        const grid = vineStrip(vr, N, av, u0, u1, vsp, 0, lite), sc = stripCanvas(grid, N, e); if (!sc) continue;
        const cv = sc.c; cv.className = 'gv gv-' + e; cv.dataset.vk = vk; cv.dataset.sp = spn; cv.style.width = sc.cw * S + 'px'; cv.style.height = sc.ch * S + 'px';
        const Z = (D + OV) * S;
        let lx = ox, ty = oy; if (e === 'top') ty = oy - OV * S; else if (e === 'bottom') ty = oy + hr.height + OV * S - Z; else if (e === 'left') lx = ox - OV * S; else lx = ox + hr.width + OV * S - Z;
        cv.style.left = Math.round(lx) + 'px'; cv.style.top = Math.round(ty) + 'px'; cv.style.setProperty('--d', Math.round(r() * 300) + 'ms');
        cv.style.transformOrigin = e === 'right' ? '100% 50%' : e === 'bottom' ? '50% 100%' : '0 0';
        box.append(cv); usedEdges.add(e);
        for (let v = 0; v < D + OV; v++) for (let u = 0; u < N; u++) { if (!grid[v][u]) continue; const vv = v - OV;
          const hi = e === 'top' ? u : e === 'bottom' ? u : e === 'left' ? vv : cols - 1 - vv, hj = e === 'top' ? vv : e === 'bottom' ? rows - 1 - vv : u; takeRect(hi - 1, hj - 1, hi + 1, hj + 1); }
        placed = true; break;
      }
      return placed;
    };
    if (!isBar) {
      if (plan.vine) placeVine(plan.vine, false);
      const names = Object.keys(SPECIES), lr = rng(hash('lite-' + h.key));
      const pk = names[Math.floor(lr() * names.length)]; placeVine(pk === 'wisteria' ? 'ivy' : pk, true);
      if (lr() < .3) placeVine('clover', true);
    }
    /* the plant: one, standing on the floor of the card near a corner, or on a block inside it, on the side that leaves the other corner clear */
    if (!isBar && plan.plant) {
      let planted = false;
      const name = plan.plant, sz = sizeOf(name), side = hash(h.key) & 1, stickUp = 0, stickDown = 0;
      if (sz) for (const sc of (sz.w * 3 > cols * S * .6 || hr.height < 70 ? [2] : hr.height > 200 ? [4, 3, 2] : [3, 2])) {
        const wC = Math.ceil(sz.w * sc / S), hC = Math.ceil(sz.h * sc / S); let best = null, bs = -1;
        const jMin = -Math.floor(Math.min(stickUp, sz.h * sc * .45) / S), iMin = 0;
        for (let j = jMin; j <= rows - hC + stickDown; j += 1) for (let i = iMin; i <= cols - wC - iMin; i += 1) {
          let ok = true; for (let jj = Math.max(0, j); jj < Math.min(rows, j + hC) && ok; jj += 2) for (let ii = Math.max(0, i); ii < Math.min(cols, i + wC); ii += 2) if (blocked(ii, jj) || (ii + 1 < cols && blocked(ii + 1, jj))) { ok = false; break; }
          if (!ok || i + wC / 2 < cols * .62) continue; if (j + hC - 1 >= 0 && j + hC - 1 < rows && blocked(i, j + hC - 1)) continue;
          const onFloor = j + hC >= rows - 1, onBlock = !onFloor && j + hC < rows && (blocked(i + (wC >> 1), j + hC) || blocked(i, j + hC) || blocked(i + wC - 1, j + hC));
          if (!(onFloor || onBlock)) continue;
          const cx = Math.min(i, cols - i - wC) / cols; let s = r() * .4 + (onFloor ? 3 - cx * 5 : 1.2 - cx); if (j < 0) s += .5;
          if (s > bs) { bs = s; best = [i, j]; }
        }
        if (!best || bs < .5) continue; const [i, j] = best;
        const it = document.createElement('span'); it.className = 'gi gi-sway'; it.dataset.n = name;
        const px = sz.w * sc, py = sz.h * sc; it.style.cssText = `left:${Math.round(ox + i * S)}px;top:${Math.round(oy + j * S)}px;width:${px}px;height:${py}px;--d:0ms`;
        if (GS[name] || GV[name]) it.style.backgroundImage = `url(${gsUrl(name)})`; else it.innerHTML = pix(name, sc).replace(/ style="[^"]*"/, ' style="width:100%;height:100%"');
        box.append(it); planted = true; break;
      }
    }
    if (!box.children.length) box.remove(); else io && io.observe(h.el);
  }
  const grown = new Set(), seen = new WeakSet(); let io = null, ro = null, qT = 0, running = false, ready = false, grew = '';
  /* the boxes are drawn a few at a time, so that no single stretch of work holds the page up */
  let again = false;
  function run() {
    if (running) { again = true; return; } running = true; again = false;
    let hs = [], i = 0;
    try { hs = hostsOf(); hs.forEach(h => { h.rect = h.el.getBoundingClientRect(); }); } catch (e) { running = false; return; }
    const finish = () => {
      try {
        $$('.gnl').forEach(l => l.querySelectorAll('.gdh').forEach(b => { if (!hs.some(h => h.el === b._host)) b.remove(); }));
        if (ro) { const see = e => { if (e && !seen.has(e)) { seen.add(e); ro.observe(e); } }; hs.forEach(h => see(h.el)); see(document.querySelector('.wrap')); $$('.wrap [role=tabpanel]').forEach(see); } /* each element once: observing again would fire at once */
      } finally { running = false; if (again) queue(); }
    };
    const step = () => {
      const t0 = performance.now();
      while (i < hs.length && performance.now() - t0 < 12) { const h = hs[i++]; try { paint(h, hs); } catch (e) { /* one box failing leaves the others alone */ } }
      if (i < hs.length) requestAnimationFrame(step); else finish();
    };
    step();
  }
  function queue() { clearTimeout(qT); qT = setTimeout(() => requestAnimationFrame(run), 90); }
  /* a tap on a plant sways it */
  function react(it) {
    if (reduced() || it.classList.contains('act')) return; it.classList.add('act'); setTimeout(() => it.classList.remove('act'), 1100);
  }
  function init() {
    if (ready) return; ready = true;
    io = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; $$('.gnl .gdh').forEach(b => { if (b._host === e.target) { b.classList.add('in'); grown.add(b.dataset.k); } }); })) : null;
    ro = window.ResizeObserver ? new ResizeObserver(() => queue()) : null;
    addEventListener('resize', queue);
    document.addEventListener('pointerdown', e => { const it = e.target.closest && e.target.closest('.gi'); if (it) react(it); }, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
    queue();
  }
  return { init, queue, run };
})();
