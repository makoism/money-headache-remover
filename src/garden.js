/* ---------- the garden: nature grown into every box ----------
   A thin layer (.gnl) inside each page holds, for every box (header, tabs, every card), a container (.gdh) with:
     - vines: pixel vines grown along one or two edges of the box, from a corner, covering part of the edge. The stem, the leaves, the
       hanging tendrils and the small blossoms are drawn from the free depth along that edge, so they bend round the words and controls;
     - small things (flowers, plants, animals, hearts) set in the empty places of the box: the box is scanned for words, controls and
       coloured blocks, and a thing is only put where nothing is. A ground animal stands on the edge or on a block, a flyer hangs in the air.
   Every box draws its things from three shuffled decks, so nothing repeats from box to box until the whole library has been used.
   The picture follows the layout: it is redrawn when a box changes size, a page opens, or the cards are rebuilt (GD.queue()).
   Nothing runs by itself. The picture grows in once when it first scrolls into view; tapping a thing makes it react.
   Layers: the vines and things stand above the box (a soft shadow under each lifts them off the glass); the box is never covered:
   vines stay in free depth, things in free cells, so words and buttons keep every tap. */
const GD = (() => {
  const S = 3, OV = 2, D = 16;                 /* one cell is 3px; vines overhang the edge by 2 cells and reach at most 16 cells in */
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shuffled = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const FLY = /^(butterfly|bee|bluebird|robin|firefly|chick)/, ALL = () => [].concat(...Object.values(GARDEN_POOL));
  const sizeOf = n => gsSize(n);
  /* ---------- decks: one stable pick list per box ---------- */
  const decks = {}, picks = new Map();
  function deck(kind) {
    if (!decks[kind]) { const r = rng(hash('burrow-' + kind)); decks[kind] = { list: shuffled(kind === 'flora' ? GARDEN_POOL.flower.concat(GARDEN_POOL.plant) : GARDEN_POOL[kind], r), i: 0 }; }
    const d = decks[kind], n = d.list[d.i % d.list.length]; d.i++; return n;
  }
  function picksFor(key) {
    if (!picks.has(key)) { const r = rng(hash('p-' + key)); const flora = [deck('flora'), deck('flora'), deck('flora')], creature = [deck('creature'), deck('creature')], heart = r() < .5 ? deck('heart') : null, pool = GARDEN_POOL.flower.concat(GARDEN_POOL.plant), cre = GARDEN_POOL.creature;
      for (let i = 0; i < 6; i++) { const f = pool[Math.floor(r() * pool.length)]; if (!flora.includes(f)) flora.push(f); const c = cre[Math.floor(r() * cre.length)]; if (!creature.includes(c)) creature.push(c); }
      picks.set(key, { flora, creature, heart }); }
    return picks.get(key);
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
  const LEAFC = ['g', 'G', 'g', 'l', 'g'], BLOOM = ['p', 'w', 'v', 'b', 'o', 'r', 'y', 'q'];
  function vineStrip(r, N, avail, u0, u1) {
    const H = D + OV, grid = []; for (let i = 0; i < H; i++) grid.push(new Array(N).fill(''));
    const put = (u, v, ch, force) => { if (u < 0 || u >= N || v < -OV || v >= D) return false; if (v >= 0 && !force && v >= avail[u]) return false; grid[v + OV][u] = ch; return true; };
    const free = (u, v) => u >= 0 && u < N && v >= 0 && v < avail[u];
    const amp = .6 + r() * .9, fr = .12 + r() * .16, ph = r() * 6.3, ys = [];
    for (let u = u0; u < u1; u++) {
      const taper = Math.min(1, (u - u0) / 6, (u1 - 1 - u) / 6), cap = Math.max(0, Math.min(avail[u] - 1, 3));
      const y = Math.max(0, Math.min(cap, Math.round((amp + amp * Math.sin(ph + u * fr)) * Math.max(.35, taper)))); ys[u] = y;
      put(u, y, 'G', true); if (r() < .18) put(u, y - 1, 'g', true);
    }
    for (let u = u0 + 2 + Math.floor(r() * 3); u < u1 - 2; u += 3 + Math.floor(r() * 4)) {
      const y = ys[u] || 0, down = r() < .6, big = r() < .5 && avail[u] > 5, dv = down ? 1 : -1, ch = LEAFC[Math.floor(r() * LEAFC.length)];
      const dir = r() < .5 ? 1 : -1;
      const cells = big ? [[0, 1], [dir, 1], [dir, 2], [2 * dir, 2], [2 * dir, 3], [dir, 3]] : [[0, 1], [dir, 1], [dir, 2]];
      for (const [du, dd] of cells) put(u + du, y + dv * dd, ch);
      if (big) put(u + dir, y + dv * 2, 'l');
      /* a hanging tendril with something at the end */
      if (down && r() < .55) {
        const room = Math.max(0, avail[u] - y - 3), len = Math.min(room, 2 + Math.floor(r() * 9)); if (len >= 2) {
          let x = u; for (let k = 1; k <= len; k++) { if (k > 2 && r() < .22) x += r() < .5 ? -1 : 1; if (!free(x, y + k)) break; put(x, y + k, k % 3 === 0 ? 'g' : 'G'); }
          const e = Math.floor(r() * 4), ev = y + len; if (e === 0 && free(x, ev + 1)) { put(x, ev + 1, 'r'); put(x + 1, ev + 1, 'r'); put(x, ev + 2, 'R'); put(x + 1, ev + 2, 'R'); }
          else if (e === 1) { const c = BLOOM[Math.floor(r() * BLOOM.length)]; put(x, ev, 'y'); put(x - 1, ev, c); put(x + 1, ev, c); put(x, ev - 1, c); put(x, ev + 1, c); }
          else if (e === 2) { put(x + 1, ev, 'g'); put(x - 1, ev, 'g'); put(x + 2, ev + 1, 'l'); put(x - 2, ev + 1, 'l'); }
          else { put(x, ev + 1, 'g'); put(x + 1, ev + 1, 'l'); put(x - 1, ev + 2, 'g'); }
        }
      }
      /* a little blossom sitting on the stem */
      if (r() < .3) { const c = BLOOM[Math.floor(r() * BLOOM.length)], v = y + (down ? -1 : 1); if (v >= 0 && free(u, v)) { put(u, v, c); if (free(u + 1, v)) put(u + 1, v, 'y'); } }
    }
    /* a curl at the tip */
    const tu = u1 - 1, ty = ys[tu] || 0; if (tu - 2 > u0) { put(tu + 1, ty + 1, 'G'); put(tu + 1, ty + 2, 'G'); put(tu, ty + 2, 'g'); }
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
    const r = rng(hash('v-' + h.key)), pk = picksFor(h.key), gap = gapsFor(h, all), isBar = h.key === 'header' || h.key === 'tabs';
    if (box) box.remove(); box = document.createElement('div'); box.className = 'gdh'; box.dataset.k = h.key; layer.append(box);
    box._host = h.el; box.dataset.sig = sig; if (grown.has(h.key) || reduced()) box.classList.add('in');
    const taken = new Uint8Array(cols * rows); const takeRect = (i0, j0, i1, j1) => { for (let j = Math.max(0, j0); j <= Math.min(rows - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(cols - 1, i1); i++) taken[j * cols + i] = 1; };
    const blocked = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && (o.g[j * cols + i] || taken[j * cols + i]);
    /* vines: one or two edges with room, covering part of each */
    const longSide = Math.max(hr.width, hr.height), want = isBar ? 0 : Math.min(5, (r() < .75 ? 2 : 1) + Math.floor(longSide / 420)), edgeList = [], usedR = { top: [], bottom: [], left: [], right: [] }; let used = 0;
    const order = shuffled(['top', 'bottom', 'left', 'right'], r); for (let k = 0; k < want * 3; k++) edgeList.push(order[k % 4]);
    for (const e of edgeList) {
      if (used >= want) break; const horiz = e === 'top' || e === 'bottom';
      if (e === 'top' && gap.up < 8) continue; if (e === 'bottom' && gap.down < 8) continue;
      const av = profile(o, e), N = av.length, mean = av.reduce((a, b) => a + b, 0) / N; if (mean < 2.2 || N < 16) continue;
      const span = Math.round(N * (usedR[e].length ? .25 + r() * .3 : .4 + r() * .6)); let u0 = -1;
      for (let t = 0; t < 6 && u0 < 0; t++) { const c = Math.floor(r() * Math.max(1, N - span + 1)); if (!usedR[e].some(q => c < q[1] + 4 && c + span > q[0] - 4)) u0 = c; }
      if (u0 < 0) continue; const u1 = u0 + span; usedR[e].push([u0, u1]);
      const grid = vineStrip(r, N, av, u0, u1), sc = stripCanvas(grid, N, e); if (!sc) continue;
      const cv = sc.c; cv.className = 'gv gv-' + e; cv.style.width = sc.cw * S + 'px'; cv.style.height = sc.ch * S + 'px';
      const Z = (D + OV) * S;
      let lx = ox, ty = oy; if (e === 'top') ty = oy - OV * S; else if (e === 'bottom') ty = oy + hr.height + OV * S - Z; else if (e === 'left') lx = ox - OV * S; else lx = ox + hr.width + OV * S - Z;
      cv.style.left = Math.round(lx) + 'px'; cv.style.top = Math.round(ty) + 'px'; cv.style.setProperty('--d', Math.round(r() * 300) + 'ms');
      cv.style.transformOrigin = e === 'right' ? '100% 50%' : e === 'bottom' ? '50% 100%' : '0 0'; box.append(cv); used++;
      /* the vine's own cells are taken, so the small things keep off it */
      for (let v = 0; v < D + OV; v++) for (let u = 0; u < N; u++) { if (!grid[v][u]) continue; const vv = v - OV;
        const hi = e === 'top' ? u : e === 'bottom' ? u : e === 'left' ? vv : cols - 1 - vv, hj = e === 'top' ? vv : e === 'bottom' ? rows - 1 - vv : u; takeRect(hi - 1, hj - 1, hi + 1, hj + 1); }
    }
    /* things in the empty places */
    let freeC = 0; for (let i = 0; i < o.g.length; i++) if (!o.g[i] && !taken[i]) freeC++; const ratio = freeC / o.g.length;
    const list = []; const extra = isBar ? 0 : Math.min(4, Math.floor(hr.height / 320)), nCre = 1 + (extra > 1 ? 1 : 0), nFlo = isBar ? 0 : (ratio > .35 ? 2 : 1) + extra;
    for (let i = 0; i < nCre; i++) list.push(pk.creature[i]); for (let i = 0; i < nFlo; i++) list.push(pk.flora[i]); if (pk.heart && ratio > .1 && !isBar) list.push(pk.heart); if (ratio > .55 && nCre) list.push(pk.creature[1]);
    const stickUp = Math.max(0, Math.min(gap.up - 4, 14)), stickSide = 6, stickDown = Math.floor(Math.max(0, Math.min(gap.down - 4, 9)) / S) + 1;
    let delay = 0;
    list.forEach(name => {
      const sz = sizeOf(name); if (!sz) return; const fly = FLY.test(name), isCre = GARDEN_POOL.creature.includes(name), isHeart = GARDEN_POOL.heart.includes(name);
      for (const sc of (sz.w * 3 > cols * S * .6 ? [2] : [3, 2])) {
        const wC = Math.ceil(sz.w * sc / S), hC = Math.ceil(sz.h * sc / S); let best = null, bs = -1;
        const jMin = -Math.floor(Math.min(stickUp, sz.h * sc * .45) / S), iMin = -Math.floor(stickSide / S);
        for (let j = jMin; j <= rows - hC + stickDown; j += 1) for (let i = iMin; i <= cols - wC - iMin; i += 1) {
          let ok = true; for (let jj = Math.max(0, j); jj < Math.min(rows, j + hC) && ok; jj += 2) for (let ii = Math.max(0, i); ii < Math.min(cols, i + wC); ii += 2) if (blocked(ii, jj) || (ii + 1 < cols && blocked(ii + 1, jj))) { ok = false; break; }
          if (!ok) continue; if (j + hC - 1 >= 0 && j + hC - 1 < rows && blocked(i, j + hC - 1)) continue;
          let s = r() * .9; const atBottom = j + hC >= rows - 1, below = j + hC < rows && (blocked(i + (wC >> 1), j + hC) || blocked(i, j + hC) || blocked(i + wC - 1, j + hC));
          if (!fly && !isHeart && !(atBottom || below)) continue; if (!fly && !isHeart) s += 2.2; if (fly) s += (j > 1 && j + hC < rows - 1) ? 1 : 0; if (i <= 0 || i + wC >= cols) s += .5; if (j < 0) s += .6; if (isHeart) s += (i > cols * .5 ? .6 : 0);
          if (s > bs) { bs = s; best = [i, j]; }
        }
        if (!best) continue; const [i, j] = best; takeRect(i - 1, j - 1, i + wC, j + hC);
        const it = document.createElement('span'); it.className = 'gi ' + (fly ? 'gi-fly' : isCre ? 'gi-hop' : isHeart ? 'gi-pop' : 'gi-sway'); it.dataset.n = name;
        const px = sz.w * sc, py = sz.h * sc; it.style.cssText = `left:${Math.round(ox + i * S)}px;top:${Math.round(oy + j * S)}px;width:${px}px;height:${py}px;--d:${delay}ms`; delay += 140;
        if (GS[name] || GV[name]) it.style.backgroundImage = `url(${gsUrl(name)})`; else it.innerHTML = pix(name, sc).replace(/ style="[^"]*"/, ' style="width:100%;height:100%"');
        box.append(it); break;
      }
    });
    if (!box.children.length) box.remove(); else io && io.observe(h.el);
  }
  const grown = new Set(), seen = new WeakSet(); let io = null, ro = null, qT = 0, running = false, ready = false;
  function run() {
    if (running) return; running = true;
    try {
      const hs = hostsOf(); hs.forEach(h => { picksFor(h.key); h.rect = h.el.getBoundingClientRect(); });
      hs.forEach(h => { try { paint(h, hs); } catch (e) { /* one box failing leaves the others alone */ } });
      $$('.gnl').forEach(l => l.querySelectorAll('.gdh').forEach(b => { if (!hs.some(h => h.el === b._host)) b.remove(); }));
      if (ro) { const see = e => { if (e && !seen.has(e)) { seen.add(e); ro.observe(e); } }; hs.forEach(h => see(h.el)); see(document.querySelector('.wrap')); $$('.wrap [role=tabpanel]').forEach(see); } /* each element once: observing again would fire at once and loop */
    } finally { running = false; }
  }
  function queue() { clearTimeout(qT); qT = setTimeout(() => requestAnimationFrame(run), 90); }
  /* reactions: a tap on any thing */
  function react(it) {
    if (reduced() || it.classList.contains('act')) return; it.classList.add('act'); setTimeout(() => it.classList.remove('act'), 1300);
    if (it.classList.contains('gi-pop')) { const h = document.createElement('i'); h.className = 'gheart'; h.style.backgroundImage = `url(${gsUrl('heartP')})`; h.style.left = it.offsetLeft + it.offsetWidth / 2 - 6 + 'px'; h.style.top = it.offsetTop - 4 + 'px'; it.parentElement.append(h); setTimeout(() => h.remove(), 1300); }
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
  return { init, queue, run, picks };
})();
