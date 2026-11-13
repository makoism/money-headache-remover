/* ---------- nook2: the den renderer ----------
   A realm is a cutaway: you are looking into a small chamber (a burrow, a hollow, a cavern, a grotto) lit from inside. What makes it read as hi-bit
   pixel art rather than a speckled picture is how it is lit: every wall and floor pixel is shaded by its distance to the chamber's lights (a lantern,
   the daylight door, the Spirit), posterised to the four or five steps of a hue-shifted ramp, with a 4x4 ordered dither only where two steps meet.
   Cool dark ramps in the corners, warm light near the lamps. Large simple shapes (blobs lit from the top left with a dark outline), not noise.
     NK2.vn          smooth value noise            NK2.shape     the bumpy chamber outline: s < 1 is inside
     NK2.paintLit    fill pixels from a field, lit by a list of lights through a ramp
     NK2.blob        an ellipse lit from the top left with an outline     NK2.root   a tapering curved root or vine
     NK2.dens        the standard den: back wall with a daylight door, outer ring of earth, floor */
const NK2 = (() => {
  const { mix, rnd, hsh, px, rect, disk, ell } = VG;
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const vn = (x, y, s, seed) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), h = (a, b) => hsh(a, b, seed || 1); return (h(x0, y0) * (1 - u) + h(x0 + 1, y0) * u) * (1 - v) + (h(x0, y0 + 1) * (1 - u) + h(x0 + 1, y0 + 1) * u) * v; };
  const shape = o => { const ph = o.ph || [1.3, 4.1, 2.2]; return (x, y) => { const dx = (x - o.cx) / o.rx, dy = (y - o.cy) / o.ry, a = Math.atan2(dy, dx), e = 1 + (Math.sin(a * 3 + ph[0]) * .5 + Math.sin(a * 5 + ph[1]) * .3 + Math.sin(a * 9 + ph[2]) * .2) * (o.bump == null ? .1 : o.bump) + (o.flat ? Math.max(0, Math.sin(a)) * o.flat : 0); return Math.hypot(dx, dy) / e; }; };
  /* light at a point: sum of soft falloffs, each {x,y,r,a,sy} (sy squashes the vertical reach) */
  const lightAt = (x, y, Ls) => { let v = 0; for (const l of Ls) { const dx = x - l.x, dy = (y - l.y) / (l.sy || 1), d = Math.sqrt(dx * dx + dy * dy); if (d < l.r) { const t = 1 - d / l.r; v += l.a * t * t * (1.2 - .2 * t); } } return v; };
  const pick = (v, ramp, x, y) => { const n = ramp.length, t = Math.max(0, Math.min(.999, v)) * (n - 1), lo = Math.floor(t), fr = t - lo; return ramp[lo + (fr > (B4[(x & 3) + (y & 3) * 4] + .5) / 16 ? 1 : 0)] || ramp[n - 1]; };
  /* fill every pixel of g where field(x,y) returns a tone 0..1 (or null to skip) */
  function paintLit(c, g, field, Ls, ramp, o) {
    o = o || {}; const amb = o.amb == null ? .18 : o.amb;
    for (let y = g.y0; y < g.y1; y++) for (let x = g.x0; x < g.x1; x++) { const t = field(x, y); if (t == null) continue; const v = amb + t + lightAt(x, y, Ls); c.fillStyle = pick(v, ramp, x, y); c.fillRect(x, y, 1, 1); }
  }
  /* an ellipse lit from the top left: rim darkest, then a lit crown, a small highlight, optional outline */
  function blob(c, cx, cy, rx, ry, K, o) {
    o = o || {}; const n = K.length - 1, ol = o.outline === false ? null : (o.outline || K[0]);
    for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
      const nx = x / rx, ny = y / ry, d = nx * nx + ny * ny; if (d > 1.18) continue;
      if (d > 1) { if (ol) { c.fillStyle = ol; c.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); } continue; }
      const nz = Math.sqrt(Math.max(0, 1 - d)), lt = -nx * .5 - ny * .62 + nz * .55, v = (lt + .35) / 1.45 + (o.tone ? o.tone(x, y) : 0);
      c.fillStyle = pick(v * (n + .6) / n, K, Math.round(cx + x), Math.round(cy + y)); c.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
    if (o.hi !== false && rx > 2) { px(c, Math.round(cx - rx * .4), Math.round(cy - ry * .5), K[n]); }
  }
  /* a root or vine: a wandering path that tapers, dark under, lit on its upper left */
  function root(c, x, y, len, ang, w, K, R, o) {
    o = o || {}; let a = ang, cx = x, cy = y;
    for (let i = 0; i < len; i++) {
      const t = i / len, ww = Math.max(1, Math.round(w * (1 - t * .8)));
      for (let k = -ww; k <= ww; k++) { const px_ = Math.round(cx + Math.cos(a + 1.57) * k), py_ = Math.round(cy + Math.sin(a + 1.57) * k), s = k / ww; c.fillStyle = s < -.4 ? K[2] : s > .4 ? K[0] : K[1]; c.fillRect(px_, py_, 1, 1); }
      if (ww >= 2 && i % 5 === 0) { c.fillStyle = K[3] || K[2]; c.fillRect(Math.round(cx - Math.cos(a + 1.57) * (ww - 1)), Math.round(cy - Math.sin(a + 1.57) * (ww - 1)), 1, 1); }
      a += (R() - .5) * (o.wob || .35) + (o.pull || 0); cx += Math.cos(a); cy += Math.sin(a);
      if (o.fork && i === Math.floor(len * .5) && w > 1.5) root(c, cx, cy, Math.floor(len * .5), a + (R() < .5 ? -.7 : .7), w * .6, K, R, { wob: o.wob, pull: o.pull });
    }
    return [cx, cy];
  }

  /* ---- colour: hsl without pink. Hues run orange > yellow > lime > green > cyan > blue > violet and back, never through magenta ---- */
  const hsl = (h, s, l) => { h = ((h % 360) + 360) % 360 / 360; const a = s * Math.min(l, 1 - l), k = n => (n + h * 12) % 12, f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
  const tri = t => { t = t - Math.floor(t); return 1 - Math.abs(2 * t - 1); };
  const hue = t => 18 + tri(t) * 268;
  const PSY = {
    hsl, hue, tri,
    col: (t, s, l) => hsl(hue(t), s == null ? .85 : s, l == null ? .6 : l),
    /* concentric rings with petals, hue running outward and over time */
    mandala(c, cx, cy, R, f, o) {
      o = o || {}; const pet = o.petals || 8, sp = o.spin == null ? 1 : o.spin, ry = o.sy || 1;
      for (let r = 2; r <= R; r += (o.step || 2)) {
        const n = Math.ceil(Math.PI * 2 * r * .8), col = hsl(hue(r / R * (o.span || .8) + f / (o.speed || 140) + (o.h0 || 0)), o.s == null ? .9 : o.s, o.l == null ? .62 : o.l);
        c.fillStyle = col;
        for (let i = 0; i < n; i++) { if (o.dots && (i & 1)) continue; const a = i / n * 6.2832 + f / 90 * sp * (r & 2 ? 1 : -1) * .3, w = Math.sin(a * pet + r * .25) * (o.wave == null ? 1.4 : o.wave), rr = r + w; c.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * ry), 1, 1); }
      }
    },
    /* a faceted prism standing on a base: left face light, middle mid, right dark, a bright edge and tip, a dark outline */
    crystal(c, x, base, w, h, t, K, o) {
      o = o || {}; const hw = w / 2, OL = o.ol || K[0];
      for (let j = 0; j < h; j++) { const u = j / h, wj = u > .72 ? hw * (1 - (u - .72) / .28) + .5 : hw, sx = Math.round(t * h * u), xl = Math.round(x - wj + sx), xr = Math.round(x + wj + sx); for (let xx = xl; xx < xr; xx++) { const a = (xx - xl) / Math.max(1, xr - xl); c.fillStyle = a < .3 ? K[2] : a < .62 ? K[1] : K[0]; c.fillRect(xx, base - j, 1, 1); } c.fillStyle = OL; c.fillRect(xl - 1, base - j, 1, 1); c.fillRect(xr, base - j, 1, 1); if (j % 5 === 2) { c.fillStyle = K[3]; c.fillRect(xl, base - j, 1, 1); } }
      const tx = Math.round(x + t * h); c.fillStyle = OL; c.fillRect(tx, base - h, 1, 1); c.fillStyle = K[3]; c.fillRect(tx, base - h + 1, 1, 2); c.fillStyle = OL; c.fillRect(Math.round(x - hw + 0), base, Math.round(w), 1);
      if (o.core) { c.fillStyle = o.core; c.fillRect(Math.round(x + t * h * .4), base - Math.round(h * .55), 1, Math.round(h * .3)); }
    },
    spiral(c, cx, cy, R, turns, f, o) { o = o || {}; const n = Math.round(R * turns * 3); for (let i = 0; i < n; i++) { const t = i / n, a = t * turns * 6.2832 + f / (o.spin || 60), r = t * R; c.fillStyle = o.col || hsl(hue(t + f / 160 + (o.h0 || 0)), .9, .62); c.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * (o.sy || 1)), 1, 1); } },
    /* flowing ribbons of light, bands of cycling hue */
    ribbons(c, f, x0, x1, y0, amp, count, o) {
      o = o || {}; const th = o.th || 2;
      for (let b = 0; b < count; b++) { c.globalAlpha = o.a == null ? .5 : o.a; for (let x = x0; x < x1; x += 1) { const y = y0 + b * (o.gap || 4) + Math.sin(x / (o.len || 22) + f / (o.speed || 30) + b * .9) * amp + Math.sin(x / 9 - f / 40 + b) * amp * .35; if (o.ok && !o.ok(x, Math.round(y))) continue; c.fillStyle = hsl(hue(x / (o.span || 260) + b * .09 + f / 220 + (o.h0 || 0)), .9, o.l == null ? .62 : o.l); c.fillRect(x, Math.round(y), 1, th); } }
      c.globalAlpha = 1;
    },
    /* a glowing toadstool whose cap cycles through the spectrum */
    shroom(c, x, y, h, w, f, seed, o) {
      o = o || {}; const t = seed * .137 + f / (o.speed || 190), hc = hsl(hue(t), .85, .55), hl = hsl(hue(t), .8, .8), hd = hsl(hue(t), .8, .3), st = '#e8dcc4', sd = '#a89878';
      rect_(c, x - 1, y - h, 3, h, st); rect_(c, x + 1, y - h, 1, h, sd);
      for (let j = 0; j < w; j++) { const hh = Math.round(w * .62 * Math.sqrt(Math.max(0, 1 - (j * j) / (w * w + .1)))); rect_(c, x - j, y - h - hh, 1, hh + 1, hc); rect_(c, x + j, y - h - hh, 1, hh + 1, hc); }
      for (let j = -w; j <= w; j++) { const hh = Math.round(w * .62 * Math.sqrt(Math.max(0, 1 - (j * j) / (w * w + .1)))); px_(c, x + j, y - h - hh, hl); px_(c, x + j, y - h + 1, hd); }
      for (const [dx, dy] of [[-w * .45, .25], [w * .15, .4], [w * .5, .2], [-w * .1, .12]]) px_(c, x + dx, y - h - w * .62 * dy, '#ffffff');
    },
  };
  const rect_ = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const px_ = (c, x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); };

  /* ---- the lighting pass: this is what makes the burrow look lit and not just coloured.
     Paint a layer flat in its natural colours, then multiply every pixel by the light that reaches it. Lights are coloured, fall off smoothly and are quantised to a few
     steps with an ordered dither, so the result keeps a limited, hand-placed look: warm pools by the lanterns, cool dark in the corners. A light is {x,y,r,a,col:[r,g,b],sy}. */
  function light(c, g, Ls, amb, o) {
    o = o || {}; const w = g.x1 - g.x0, h = g.y1 - g.y0, im = c.getImageData(0, 0, w, h), d = im.data, S = o.steps || 6, gain = o.gain || 1.2, y0 = o.y0 == null ? -1e9 : o.y0;
    for (let y = 0; y < h; y++) {
      const Y = y + g.y0; if (Y < y0) continue;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4; if (d[i + 3] < 8) continue; const X = x + g.x0; let lr = amb[0], lg = amb[1], lb = amb[2];
        for (let k = 0; k < Ls.length; k++) { const l = Ls[k], dx = X - l.x, dy = (Y - l.y) / (l.sy || 1), dd = dx * dx + dy * dy; if (dd < l.r * l.r) { const t = 1 - Math.sqrt(dd) / l.r, q = l.a * t * t * (1.2 - .2 * t); lr += l.col[0] * q; lg += l.col[1] * q; lb += l.col[2] * q; } }
        const th = (B4[(X & 3) + (Y & 3) * 4] + .5) / 16, qr = Math.floor(lr * S + th) / S, qg = Math.floor(lg * S + th) / S, qb = Math.floor(lb * S + th) / S, hot = Math.max(0, Math.max(qr, qg, qb) - 1.05) * 70;
        d[i] = Math.min(255, d[i] * qr * gain + hot); d[i + 1] = Math.min(255, d[i + 1] * qg * gain + hot); d[i + 2] = Math.min(255, d[i + 2] * qb * gain + hot);
      }
    }
    c.putImageData(im, 0, 0);
  }

  /* ---- a chunky creature from parameters: a lit body, a head, ears, tail, legs. Every animal in every realm is built from this so they share one way of being lit and outlined.
     o: K ramp (dark..light), rx ry (body), leg, head {r,dx,dy,K}, ears [{dx,dy,w,h,K,tilt}], tail {dx,dy,r,K}, eye, snout {dx,dy,w,h,K}, spots, extra(c,x,y,d,f,by) */
  function beast(c, n, f, o) {
    const d = n.dd || n.dir || 1, x = Math.round(n.x), y = Math.round(n.y), K = o.K, OL = o.ol || K[0], moving = o.mv != null ? o.mv : (n.gz > 4 || n.mvk), st = moving ? ((f >> 1) & 1) : 0, hop = n.st ? -Math.abs(Math.round(Math.sin(f / 3) * 3)) : 0;
    const leg = o.leg == null ? 2 : o.leg, rx = o.rx, ry = o.ry, by = y - leg - ry + hop + (o.bob ? Math.round(Math.sin(f / (o.bob)) * 1) : 0), hd = o.head;
    if (!o.air) { c.globalAlpha = .3; ell_(c, x, y, rx + 1, 1, '#000000'); c.globalAlpha = 1; }
    if (o.back) o.back(c, x, y, d, f, by);
    if (o.tail) { const t = o.tail; blob(c, x - d * t.dx, by + t.dy, t.r, t.ry || t.r, t.K || K, { hi: false }); }
    if (leg > 0) for (const lx of o.legs || [-rx * .55, rx * .5]) { rect_(c, x + lx * d - 1 + (st ? 1 : -1) * (lx > 0 ? 1 : -1) * (moving ? 1 : 0), y - leg, 2, leg + 0, K[0]); px_(c, x + lx * d + (st ? 1 : -1) * (lx > 0 ? 1 : -1) * (moving ? 1 : 0), y - leg, K[1]); }
    const tend = n.pose === 'tend', talk = n.pose === 'talk';
    const hx = x + d * hd.dx + (tend ? d * 2 : 0), hy = by + hd.dy + (tend ? 3 : talk && (f % 6 < 3) ? -1 : 0);
    if (o.earsBehind !== false) for (const e of o.ears || []) ear_(c, hx + d * e.dx, hy + e.dy, e, d, e.K || K);
    blob(c, x, by, rx, ry, K, { tone: o.tone });
    if (o.belly) { c.fillStyle = o.belly; for (let j = 0; j < ry * .6; j++) for (let i = -Math.round(rx * .5); i <= Math.round(rx * .5); i++) if (i * i / (rx * rx * .25) + j * j / (ry * ry * .36) < 1) c.fillRect(x + i + d * 1, by + ry * .35 - j * .6 + 0, 1, 1); }
    blob(c, hx, hy, hd.r, hd.ry || hd.r, hd.K || K, { hi: false });
    if (o.snout) { const s = o.snout; rect_(c, hx + d * s.dx - (d < 0 ? s.w - 1 : 0), hy + s.dy, s.w, s.h, s.K || K[2]); px_(c, hx + d * (s.dx + (d > 0 ? s.w - 1 : 0)), hy + s.dy, o.nose || '#1a1014'); }
    const ex = hx + d * (hd.r * .5 | 0) + (o.eyeDx || 0) * d, ey = hy - (hd.ry || hd.r) * .15 + (o.eyeDy || 0); px_(c, ex, ey, o.eye || '#101018'); if (!o.noGlint) px_(c, ex + d * (o.eyeBig ? 1 : 0), ey - 1, '#ffffff');
    if (o.eyeBig) { px_(c, ex + d, ey, o.eye || '#101018'); }
    for (const e of o.ears2 || []) ear_(c, hx + d * e.dx, hy + e.dy, e, d, e.K || K);
    if (o.spots) for (const [dx, dy, col] of o.spots) px_(c, x + dx * d, by + dy, col);
    if (o.extra) o.extra(c, x, y, d, f, by, hx, hy);
    const cr = n.carry; if (cr) { const cx_ = x + d * (rx + 2), cy_ = by + ry - 3; if (cr === 'basket') { rect_(c, cx_ - 3, cy_ - 1, 7, 4, '#2a1a10'); rect_(c, cx_ - 2, cy_, 5, 2, '#b08040'); px_(c, cx_ - 1, cy_ - 1, '#ff8a2a'); px_(c, cx_ + 1, cy_ - 1, '#9ad85a'); px_(c, cx_, cy_ - 2, '#ff8a2a'); } else if (cr === 'bucket') { rect_(c, cx_ - 2, cy_ - 1, 6, 5, '#10202a'); rect_(c, cx_ - 1, cy_, 4, 3, '#8aa0aa'); rect_(c, cx_ - 1, cy_, 4, 1, '#78bef0'); } else if (cr === 'apple') { disk_(c, cx_, cy_, 2, '#3a0e08'); disk_(c, cx_, cy_, 1, '#e8402a'); px_(c, cx_ - 1, cy_ - 1, '#ffa890'); } else { disk_(c, cx_, cy_, 2, '#2a2a10'); disk_(c, cx_, cy_, 1, '#ffe27a'); } }
  }
  const disk_ = (c, x0, y0, rad, col) => { c.fillStyle = col; for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(Math.max(0, rad * rad - y * y))); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  const ell_ = (c, x0, y0, rx, ry, col) => { c.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + .01)))); c.fillRect(Math.round(x0 - w), Math.round(y0 + y), w * 2 + 1, 1); } };
  function ear_(c, x, y, e, d, K) { const w = e.w || 2, h = e.h || 4, tl = (e.tilt || 0) * d; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(w * (1 - j / (h + 1) * (e.round ? .3 : .9)))), xo = Math.round(tl * j / h); rect_(c, x - Math.floor(ww / 2) + xo, y - j, ww, 1, j < 1 ? K[1] : K[2]); px_(c, x - Math.floor(ww / 2) + xo - 1, y - j, K[0]); px_(c, x - Math.floor(ww / 2) + xo + ww, y - j, K[0]); } px_(c, x + Math.round(tl), y - h, K[0]); if (e.in) px_(c, x + Math.round(tl * .5), y - Math.floor(h / 2), e.in); }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  return { vn, shape, lightAt, pick, paintLit, blob, root, smooth, B4, PSY, light, beast, hsl, hue };
})();
