/* ---------- the squirrel: stocking up the burrow ----------
   A short, quiet moment for the big steps: a squirrel hops in with one gold coin, looks at the burrow, crouches, tosses the coin in at the
   door, bounces for joy and hops away. It is drawn live from parts (tail, body, head, ears, arms, feet) in a small pixel picture with a
   dark outline added around the shape, so every frame is one clean sprite. Three looks (STY). It takes no taps, runs for about six seconds,
   then is gone, so nothing runs while the page sits idle. At most once every two and a half minutes, never for reduced motion.
   BUR (burrows.js) calls SQ.play(canvas, { x, y, coins }) on a burrow screen, where every add of money plays it. */
const SQ = (() => {
  const F = PAL.fur, K = PAL.ash;
  const STY = {
    A: { name: 'Classic', fur: F[3], hi: F[4], lo: F[2], cream: K[5], out: F[0], pink: PAL.rose[4], stripe: F[2], tip: F[5], hr: 5.7, hy: 5.1, br: 5.4, by: 6.2, tl: 1, tw: 1, ear: 2.5, big: 0 },
    B: { name: 'Chibi', fur: F[4], hi: F[5], lo: F[3], cream: K[5], out: F[0], pink: PAL.rose[4], stripe: F[3], tip: K[5], hr: 7.2, hy: 6.1, br: 4.8, by: 5.2, tl: .78, tw: 1.18, ear: 2.1, big: 1 },
    C: { name: 'Grey', fur: K[3], hi: K[4], lo: K[2], cream: K[5], out: K[0], pink: PAL.rose[4], stripe: K[2], tip: K[5], hr: 6, hy: 5.3, br: 5.6, by: 6.3, tl: 1.05, tw: 1.1, ear: 2.4, big: 0, puff: 1 },
  };
  const COIN = { c: PAL.gold[3], d: PAL.gold[1], w: PAL.gold[4], o: PAL.gold[0] };
  const SW = 44, SH = 46, OX = 22, OY = 42;                       /* the sprite sheet cell: the feet sit at (OX, OY) */
  let sp = null, sg = null, op = null, og = null;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  function init() { if (sp) return; sp = document.createElement('canvas'); sp.width = op0(SW); sp.height = SH; sg = sp.getContext('2d', { willReadFrequently: true }); op = document.createElement('canvas'); op.width = SW; op.height = SH; og = op.getContext('2d'); }
  const op0 = v => v;
  /* one filled pixel ellipse (centre in sprite units, feet at 0,0, up is negative) */
  function ell(cx, cy, rx, ry, col) { sg.fillStyle = col; const X = OX + cx, Y = OY + cy; for (let y = Math.floor(Y - ry); y <= Math.ceil(Y + ry); y++) { for (let x = Math.floor(X - rx); x <= Math.ceil(X + rx); x++) { const dx = (x + .5 - X) / rx, dy = (y + .5 - Y) / ry; if (dx * dx + dy * dy <= 1) sg.fillRect(x, y, 1, 1); } } }
  /* a part with a little form: a dark underlay, the fur colour, a light patch up and to the front */
  function blob(cx, cy, rx, ry, st, base) { ell(cx + .5, cy + .5, rx, ry, st.lo); ell(cx, cy, rx - .2, ry - .2, base || st.fur); ell(cx + rx * .18, cy - ry * .32, rx * .5, ry * .34, st.hi); }
  const px = (x, y, c) => { sg.fillStyle = c; sg.fillRect(Math.round(OX + x), Math.round(OY + y), 1, 1); };
  function coin(cx, cy, spin) { const w = Math.abs(Math.cos(spin)) > .5 ? 2.6 : 1.1; ell(cx, cy, w + 1, 3.6, COIN.o); ell(cx, cy, w, 2.7, COIN.d); ell(cx - .2, cy - .2, w - .6, 2.1, COIN.c); if (w > 2) px(cx - 1, cy - 1.5, COIN.w); }
  /* P: pose. sx, sy: squash and stretch of the body; lift: body raised; tail: sway; arms: 0 down, 1 raised high; hold: coin held; legs: 0 standing, 1 tucked in the air, -1 reaching;
     eye: 'o' open, '-' blink, '^' happy; mouth: 0 closed, 1 open; look: head turn up (negative) or down */
  function sprite(st, P, t) {
    init(); sg.clearRect(0, 0, SW, SH);
    const sx = P.sx || 1, sy = P.sy || 1, lift = P.lift || 0, hs = (t || 0) / 1000;
    /* the tail, back to front: a thick curl up and over the back, swaying with a lag toward the tip */
    const n = 12, tail = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1), sway = Math.sin(hs * 6 + u * 2.4 + (P.tail || 0)) * (1 + u * 1.6) * (P.tailAmp === undefined ? 1 : P.tailAmp);
      const x = -4.2 - Math.sin(u * 2.5) * 8.3 * st.tl + (u > .55 ? (u - .55) * 8.5 : 0) + sway * .6, y = -5.5 - u * 17 * st.tl * sy + lift + (P.tailLift || 0) * u;
      tail.push([x, y, (2.7 + Math.sin(u * 3.0) * 2.3) * st.tw * (1 - u * .22)]); }
    tail.forEach((q, i) => ell(q[0] + .6, q[1] + .6, q[2], q[2] * 1.05, st.lo));
    tail.forEach((q, i) => { const u = i / (n - 1); ell(q[0], q[1], q[2] - .2, (q[2] - .2) * 1.05, i % 4 === 3 && i < n - 1 ? st.stripe : st.fur); });
    tail.forEach((q, i) => { if (i > 1 && i < n - 1 && i % 4 !== 3) ell(q[0] + q[2] * .2, q[1] - q[2] * .35, q[2] * .5, q[2] * .32, st.hi); });
    const tp = tail[n - 1]; ell(tp[0] + .2, tp[1] - .2, tp[2] * .72, tp[2] * .72, st.tip);
    /* back foot */
    const air = P.legs || 0;
    blob(-2.8, -1.4 - (air > 0 ? 2.2 : 0), 3, 1.9, st);
    /* body */
    const bcx = 0, bcy = -7.3 + lift - (1 - sy) * -2, brx = st.br * sx, bry = st.by * sy;
    blob(bcx, bcy, brx, bry, st); ell(bcx + 1.6, bcy + 1.1, brx * .55, bry * .66, st.cream);
    /* front foot */
    blob(2.6, -1.3 - (air > 0 ? 2.8 : 0) + (air < 0 ? -.2 : 0), 3, 1.9, st);
    /* head */
    const look = P.look || 0, hx = 3.6 + (P.headX || 0), hy = -15.8 + lift + look * 1.4 - (1 - sy) * -2.4;
    /* ears with a little pink inside and a tuft */
    const e = st.ear; blob(hx - 3.1, hy - st.hy + .4, e - .3, e + .5, st); blob(hx + 2.4, hy - st.hy + .1, e - .3, e + .5, st);
    ell(hx - 3.1, hy - st.hy + 1, 1, 1.5, st.pink); ell(hx + 2.4, hy - st.hy + .7, 1, 1.5, st.pink);
    px(hx - 3.2, hy - st.hy - e - .8, st.lo); px(hx + 2.3, hy - st.hy - e - 1, st.lo);
    blob(hx, hy, st.hr, st.hy, st);
    if (st.puff) { ell(hx + 3.8, hy + 2.8, 3.2, 2.8, st.cream); ell(hx - 1.5, hy + 3, 2.6, 2.3, st.cream); } else ell(hx + 3.2, hy + 2.6, st.hr * .55, st.hy * .45, st.cream);
    /* the face: a big glossy eye with a bright spot, a blush, a tiny nose and mouth */
    const ex = hx + st.hr * .45, ey = hy - .5, big = st.big ? 1 : 0;
    if (P.eye === '^') { px(ex - 1, ey, st.out); px(ex, ey - 1, st.out); px(ex + 1, ey, st.out); px(ex - 2 - big, ey + 1, st.out); }
    else if (P.eye === '-') { px(ex - 1, ey + 1, st.out); px(ex, ey + 1, st.out); px(ex + 1, ey + 1, st.out); }
    else { sg.fillStyle = '#1a0f08'; sg.fillRect(Math.round(OX + ex - 1), Math.round(OY + ey - 1.5 - big), 2 + big, 3 + big * 2); px(ex + .2 - 1 + big * .5, ey - 1.5 - big, '#f6f2ea'); px(ex + .2 - 1 + big * .5, ey - .5, '#e6d8ff'); }
    px(ex - 3.4, ey + 2.6, st.pink); px(ex - 2.4, ey + 2.6, st.pink);
    px(hx + st.hr - .6, hy + 1, '#34200f'); px(hx + st.hr - 1.6, hy + 1, '#34200f');
    if (P.mouth) { px(hx + st.hr - 2.6, hy + 3.2, '#82325a'); px(hx + st.hr - 3.6, hy + 3.2, '#82325a'); px(hx + st.hr - 3.1, hy + 4.2, '#ee90b2'); } else { px(hx + st.hr - 2.6, hy + 3, '#7a4c28'); px(hx + st.hr - 3.6, hy + 3.4, '#7a4c28'); }
    /* arms and the coin: held in two little paws */
    const ar = P.arms || 0, ax = 3.2 + ar * 1.4, ay = -9.2 + lift - ar * 6.4;
    if (P.hold) { const cx = ax + 3.4, cy = ay + 1.2 - (P.holdLift || 0); coin(cx, cy, P.spin || 0); blob(cx - 3.4, cy + 2.6, 1.9, 1.6, st); blob(cx + 3.2, cy + 2.2, 1.9, 1.6, st); }
    else { blob(ax + 1, ay, 1.9, 2.2 + ar, st); }
    /* the outline: one dark pixel around the whole shape */
    const d = sg.getImageData(0, 0, SW, SH), a = d.data; og.clearRect(0, 0, SW, SH); og.drawImage(sp, 0, 0);
    og.fillStyle = st.out; const idx = (x, y) => (y * SW + x) * 4 + 3;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) { if (a[idx(x, y)] > 0) continue; if ((x > 0 && a[idx(x - 1, y)] > 0) || (x < SW - 1 && a[idx(x + 1, y)] > 0) || (y > 0 && a[idx(x, y - 1)] > 0) || (y < SH - 1 && a[idx(x, y + 1)] > 0)) og.fillRect(x, y, 1, 1); }
    return op;
  }
  /* ----- the little story, in milliseconds. The squirrel comes in from the right, so it faces left. ----- */
  const T = { hop: 1700, look: 2300, crouch: 2650, toss: 3150, land: 3500, joy: 4700, away: 6100 };
  function pose(t, W, dx) {
    const stopX = dx + 27, offX = W + 14, P = { dir: -1, x: stopX, y: 0, sx: 1, sy: 1, hold: true, eye: 'o', arms: 0, legs: 0, tail: 0, mouth: 0, tailAmp: 1, spin: 0 };
    const hopArc = (t0, t1, n, x0, x1) => { const u = clamp((t - t0) / (t1 - t0), 0, 1), k = u * n, i = Math.min(n - 1, Math.floor(k)), f = k - i; P.x = lerp(x0, x1, (i + ease(f > .85 ? 1 : f / .85 * 1)) / n);
      const air = f < .85 ? Math.sin(f / .85 * Math.PI) : 0; P.y = -air * 7; P.legs = air > .08 ? 1 : 0; P.sy = air > .08 ? 1.1 : f >= .85 ? .84 : 1; P.sx = air > .08 ? .93 : f >= .85 ? 1.1 : 1; };
    if (t < T.hop) { hopArc(0, T.hop, 5, offX, stopX); P.holdLift = 1.5; P.arms = 0; P.mouth = 1; P.tail = t / 140; }
    else if (t < T.look) { const u = (t - T.hop) / (T.look - T.hop); P.look = -.6 * Math.sin(u * Math.PI); P.eye = u > .45 && u < .55 ? '-' : 'o'; P.holdLift = 0; P.tail = t / 260; P.tailAmp = 1.4; }
    else if (t < T.crouch) { const u = ease((t - T.look) / (T.crouch - T.look)); P.sy = lerp(1, .78, u); P.sx = lerp(1, 1.14, u); P.holdLift = -1 * u; P.look = -.8 * u; P.tailLift = 2 * u; }
    else if (t < T.toss) { const u = (t - T.crouch) / (T.toss - T.crouch); const up = Math.sin(clamp(u * 1.4, 0, 1) * Math.PI / 2); P.sy = lerp(.78, 1.16, up); P.sx = lerp(1.14, .9, up); P.y = -Math.sin(clamp(u, 0, 1) * Math.PI) * 4; P.legs = u > .15 && u < .8 ? 1 : 0; P.arms = up; P.hold = u < .42; P.holdLift = 2 + up * 3; P.look = -.5; P.tail = 2; P.tailLift = 4 * (1 - u); if (u > .42) P.arms = 1 - (u - .42) * .6; }
    else if (t < T.land) { const u = (t - T.toss) / (T.land - T.toss); P.hold = false; P.sy = lerp(.9, 1, ease(u)); P.sx = lerp(1.1, 1, ease(u)); P.arms = Math.max(0, .5 - u); P.eye = u > .25 ? '^' : 'o'; P.mouth = 1; P.tailAmp = 1.8; P.tail = t / 120; }
    else if (t < T.joy) { const u = (t - T.land) / (T.joy - T.land), k = u * 3, f = k % 1; P.hold = false; const air = Math.sin(clamp(f / .8, 0, 1) * Math.PI); P.y = -air * 6.5; P.legs = air > .1 ? 1 : 0; P.sy = air > .1 ? 1.1 : f > .8 ? .86 : 1; P.sx = air > .1 ? .93 : f > .8 ? 1.1 : 1; P.arms = air > .1 ? .9 : .2; P.eye = '^'; P.mouth = 1; P.tailAmp = 2; P.tail = t / 90; }
    else { P.hold = false; P.dir = 1; const u = clamp((t - T.joy) / (T.away - T.joy), 0, 1); const hopped = u < .2 ? 0 : 1; if (hopped) { const uu = (u - .2) / .8, k = uu * 6, i = Math.floor(k), f = k - i; P.x = lerp(stopX, offX + 4, ease(uu * .35 + uu * .65)); const air = f < .85 ? Math.sin(f / .85 * Math.PI) : 0; P.y = -air * 6; P.legs = air > .08 ? 1 : 0; P.sy = air > .08 ? 1.1 : f >= .85 ? .85 : 1; P.sx = air > .08 ? .93 : f >= .85 ? 1.1 : 1; } else { P.x = stopX; P.eye = '^'; } P.tail = t / 140; }
    return P;
  }
  /* the toss arc of the coin, from the paws to the burrow door */
  function coinFlight(t, stopX, dx, base) { if (t < T.crouch + 330 || t > T.land) return null; const u = clamp((t - (T.crouch + 330)) / (T.land - T.crouch - 330), 0, 1); return { x: lerp(stopX + 1, dx, u), y: lerp(base - 17, base - 7, u) - Math.sin(u * Math.PI) * 15, spin: u * 14, u }; }
  const STAGE = { W: 120, H: 48 };
  /* draw one frame of the scene on g (already cleared): the squirrel and the coin in flight; the burrow is the caller's. */
  function frame(g, t, style, o) {
    o = o || {}; const W = o.W || STAGE.W, base = o.base || STAGE.H - 5, dx = o.dx || 26, st = STY[style] || STY.A, P = pose(t, W, dx);
    const spr = sprite(st, P, t);
    if (o.tint) { og.save(); og.globalCompositeOperation = 'source-atop'; og.fillStyle = o.tint.amb; og.fillRect(0, 0, SW, SH); const front = P.dir === -1, dr = front ? 1 : -1, x1 = front ? OX - 4 : OX + 4; og.fillStyle = o.tint.warm; [.35, .7, 1].forEach((al, i) => { og.globalAlpha = al; const xa = x1 + dr * i * 6, xb = i === 2 ? (front ? SW : 0) : xa + dr * 6; og.fillRect(Math.min(xa, xb), 0, Math.abs(xb - xa), SH); }); og.restore(); }
    if (o.shadow) { const air = Math.max(0, -P.y), rx = 7.5 - air * .35; g.fillStyle = `rgba(0,0,0,${Math.max(.12, .36 - air * .02)})`; for (let yy = -1; yy <= 1; yy++) { const w = Math.round(rx * (yy === 0 ? 1 : .76)); g.fillRect(Math.round(P.x - w), base + 1 + yy, w * 2, 1); } }
    g.save(); g.translate(Math.round(P.x), Math.round(base + P.y)); g.scale(P.dir === 1 ? 1 : -1, 1); g.drawImage(spr, -OX, -OY); g.restore();
    const cf = coinFlight(t, P.x, dx, base);
    if (cf) { const gg = sg; g.save(); g.translate(Math.round(cf.x), Math.round(cf.y)); const w = Math.abs(Math.cos(cf.spin)) > .5 ? 2 : 1; g.fillStyle = COIN.o; g.fillRect(-w - 1, -3, w * 2 + 2, 6); g.fillStyle = COIN.d; g.fillRect(-w, -2, w * 2, 4); g.fillStyle = COIN.c; g.fillRect(-w, -2, Math.max(1, w * 2 - 1), 3); if (w > 1) { g.fillStyle = COIN.w; g.fillRect(-1, -2, 1, 1); } g.restore(); }
    return P;
  }
  const END = 6200;
  /* the burrow for the small corner moment: a grassy hill with a round door, a few flowers and the coins stacked inside */
  const HC = { fur: '#d27a30', hill: '#43945f', hillD: '#1c5238', hillL: '#7cc489', door: '#1a0f08', frame: '#7a4c28', dirt: '#553318', pink: '#ee90b2', yel: '#fcd23c', coin: '#fcd23c', coinD: '#d27c32', coinW: '#fff1b0' };
  function burrow(g, cx, base, coins, glow) {
    const p = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
    const disk = (x, y, r, c) => { g.fillStyle = c; for (let yy = Math.floor(-r); yy <= r; yy++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy))); g.fillRect(Math.round(x - w), Math.round(y + yy), w * 2 || 1, 1); } };
    g.save(); g.beginPath(); g.rect(0, 0, 400, base + 1); g.clip();
    disk(cx, base, 17, HC.hillD); disk(cx, base + 1, 16, HC.hill); disk(cx - 4, base - 3, 10, HC.hill);
    for (let i = 0; i < 6; i++) p(cx - 12 + i * 2, base - 11 - (i % 3 === 1 ? 1 : 0), HC.hillL);
    p(cx - 11, base - 7, HC.hillL); p(cx - 10, base - 8, HC.hillL); p(cx + 10, base - 9, HC.hillL);
    p(cx - 13, base - 4, HC.pink); p(cx + 12, base - 3, HC.yel); p(cx + 9, base - 7, HC.pink);
    g.restore();
    g.fillStyle = HC.frame; g.fillRect(cx - 6, base - 13, 12, 14); g.fillRect(cx - 5, base - 14, 10, 1);
    g.fillStyle = HC.door; g.fillRect(cx - 5, base - 12, 10, 12); g.fillRect(cx - 4, base - 13, 8, 1);
    if (glow > 0) { g.globalAlpha = glow * .5; disk(cx, base - 5, 6, '#fcd23c'); g.globalAlpha = glow * .35; disk(cx, base - 5, 3, '#fff4a0'); g.globalAlpha = 1; }
    for (let i = 0; i < coins; i++) { const x = cx - 4 + (i % 4) * 2 + (i > 3 ? 1 : 0), y = base - 2 - Math.floor(i / 4) * 2; p(x, y, HC.coin); p(x + 1, y, HC.coin); p(x, y + 1, HC.coinD); p(x + 1, y + 1, HC.coinD); }
    g.fillStyle = HC.dirt; g.fillRect(0, base + 2, 400, 3);
  }
  /* the panel never sits over a number or a control (DECISIONS "v1 must be fully usable"). What is on screen is measured once: every visible control and every
     piece of text with a digit. The first free spot wins: bottom left, bottom right, top left, top right, at full size and then one step smaller. No free spot: no panel. */
  function spot(w, h) {
    const vis = e => !e.checkVisibility || e.checkVisibility({ visibilityProperty: true, opacityProperty: true }), on = q => q.width > 0 && q.height > 0 && q.bottom > 0 && q.top < innerHeight && q.right > 0 && q.left < innerWidth;
    const busy = [];
    document.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary').forEach(e => { const q = e.getBoundingClientRect(); if (on(q) && vis(e)) busy.push(q); });
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => /\d/.test(n.nodeValue) ? 1 : 3 }), rg = document.createRange();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { const pe = n.parentElement; if (!pe || pe.closest('script, style, [hidden]')) continue; rg.selectNodeContents(n); const q = rg.getBoundingClientRect(); if (on(q) && vis(pe)) busy.push(q); }
    const sb = 'env(safe-area-inset-bottom,0px)', st = 'env(safe-area-inset-top,0px)';
    for (const k of [1, .5]) {
      const W = Math.round(w * k), H = Math.round(h * k);
      const at = [[10, innerHeight - 8 - H, `left:10px;bottom:calc(8px + ${sb})`], [innerWidth - 10 - W, innerHeight - 8 - H, `right:10px;bottom:calc(8px + ${sb})`], [10, 8, `left:10px;top:calc(8px + ${st})`], [innerWidth - 10 - W, 8, `right:10px;top:calc(8px + ${st})`]];
      for (const [x, y, css] of at) { if (x < 0 || y < 0) continue; const hit = busy.some(q => q.left < x + W + 4 && q.right > x - 4 && q.top < y + H + 4 && q.bottom > y - 4); if (!hit) return { css, W, H }; }
    }
    return null;
  }
  /* the corner moment for a big step elsewhere in the app */
  let last = 0, busy = false, nShown = 0;
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function stash(style) {
    const now = Date.now(); if (busy || reduced() || now - last < 150000) return false; last = now; busy = true; const n = nShown++;
    setTimeout(() => {
      const W = STAGE.W, H = STAGE.H, sc = window.innerWidth < 1400 ? 2 : 3, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); if (!g) { busy = false; return; }
      const at = spot(W * sc, H * sc); if (!at) { busy = false; return; }   /* nothing free on this screen: the moment is still marked by the coins in the burrow */
      cv.setAttribute('aria-hidden', 'true'); cv.style.cssText = `position:fixed;${at.css};width:${at.W}px;height:${at.H}px;image-rendering:pixelated;pointer-events:none;z-index:70;background:var(--card,#2a3a2a);border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.25)`;
      /* the page scrolls under a fixed panel: if the person scrolls while it plays, it leaves rather than cover what comes under it */
      const gone = () => cv.remove(); addEventListener('scroll', gone, { once: true, passive: true });
      document.body.append(cv); const t0 = performance.now(); let coined = false, ph = 0;
      const tick = () => { const t = performance.now() - t0; if (t > END + 200 || !cv.isConnected) { cv.remove(); removeEventListener('scroll', gone); busy = false; return; }
        if (!coined && t > T.crouch + 700) { coined = true; try { sfx('coin'); } catch (e) { /* sound is a bonus */ } }
        const a = Math.min(1, t / 300) * (t > END - 300 ? Math.max(0, 1 - (t - (END - 300)) / 300) : 1);
        g.clearRect(0, 0, W, H); cv.style.opacity = a; g.globalAlpha = 1; const base = H - 5, cx = 26, landed = t > T.crouch + 700;
        burrow(g, cx, base, Math.min(7, n + 1) - (landed ? 0 : 1), Math.max(0, 1 - Math.abs(t - (T.crouch + 850)) / 700));
        frame(g, t, style || ['A', 'B', 'C'][STYPICK], { W, base, dx: cx }); g.globalAlpha = 1;
        setTimeout(() => requestAnimationFrame(tick), 40); };
      requestAnimationFrame(tick);
    }, 700);
    return true;
  }
  let STYPICK = 0;
  return { STY, T, frame, sprite, pose, END, STAGE, burrow, stash, pick(i) { STYPICK = i; } };
})();

/* ---------- the squirrel (Elthen's pixel squirrel, sqpx.js): draws its frames with the palette. Used for the add-money trips and the forest floor. Frames: idle0-5, run0-7, runc0-7 (coin in mouth), nut0-1 (holding the coin). ---------- */
const SQP = (() => {
  const cache = {}, col = () => ({ 0: '#2f2f2e', 1: '#694129', 2: '#825235', 3: '#a67354', a: '#e4e4e4', b: '#c2bdbd', x: PAL.gold[1], y: PAL.gold[3], z: PAL.gold[4] });   /* the artist's own browns, kept as drawn: Mako chose this squirrel */
  function img(name) {
    if (cache[name]) return cache[name]; const rows = SQPX[name]; if (!rows) return null; const w = Math.max(...rows.map(r => r.length)), h = rows.length, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), c = col(); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const k = r[x]; if (k === '.') continue; g.fillStyle = c[k]; g.fillRect(x, y, 1, 1); } });
    return (cache[name] = cv);
  }
  /* (x, y) is the middle of the feet; flip faces it left; a soft contact shadow lies under the feet */
  function draw(g, name, x, y, flip, shadow) {
    const cv = img(name); if (!cv) return; x = Math.round(x); y = Math.round(y);
    if (shadow !== false) { g.save(); g.globalAlpha = .3; g.fillStyle = PAL.night[0]; const w = Math.round(cv.width * .42); g.fillRect(x - w, y, w * 2, 1); g.fillRect(x - w + 2, y + 1, w * 2 - 4, 1); g.restore(); }
    g.save(); g.translate(x, y - cv.height); if (flip) { g.scale(-1, 1); g.drawImage(cv, -Math.round(cv.width * .5), 0); } else g.drawImage(cv, -Math.round(cv.width * .5), 0); g.restore();
  }
  let tc = null;
  /* the same, but dimmed toward a colour (the time of day), by drawing through a small scratch canvas */
  function drawTint(g, name, x, y, flip, tint, a) {
    const cv = img(name); if (!cv) return; if (!tc) tc = document.createElement('canvas'); tc.width = cv.width; tc.height = cv.height; const t = tc.getContext('2d'); t.clearRect(0, 0, tc.width, tc.height); t.drawImage(cv, 0, 0);
    t.globalCompositeOperation = 'source-atop'; t.fillStyle = tint; t.globalAlpha = a; t.fillRect(0, 0, tc.width, tc.height); x = Math.round(x); y = Math.round(y);
    g.save(); g.globalAlpha = .3; g.fillStyle = 'rgba(0,0,0,1)'; const w = Math.round(cv.width * .4); g.fillRect(x - w, y, w * 2, 1); g.restore();
    g.save(); g.translate(x, y - cv.height); if (flip) g.scale(-1, 1); g.drawImage(tc, -Math.round(cv.width * .5), 0); g.restore();
  }
  return { img, draw, drawTint };
})();
if (/[?&]sqtest\b/.test(location.search)) window.__sq = SQ;   /* test hook only */
