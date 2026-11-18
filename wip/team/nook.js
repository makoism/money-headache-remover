/* ---------- the nook kit ----------
   Every realm is a small secluded place, the kind you find by pushing leaves aside: an enclosing wall of the realm's own material
   (leaves, old stone, coral, ivy and concrete, cloud) with one irregular opening, three of them nested so you look down a short tunnel;
   a small clearing inside with a landmark (the Spirit), a few huts, and folk who live there. This file holds what they share:
     NK.geom      where the clearing sits (x0..x1, ground line sw), NK.u(L, v) maps 0..1 into the clearing
     NK.frame     the enclosing wall with its opening, scalloped by clumps, lit on the rim, hung with vines or roots
     NK.leaves / rock / coral / puff    the clump painters the frame uses; NK.trunk, NK.tufts, NK.shadow, NK.window, NK.smoke
     NK.folk      the little people: a routine (go to a place, do a job, carry something, go in, come out, talk) run by ECO
   The drawing rules, learned from looking at good pixel scenes: four tones per material with the hue shifting (shadow cooler, light
   warmer); the light comes from the top left; edges against light get a one pixel rim; dark shapes frame a bright centre; things that
   touch the ground get a soft contact shadow; warm lit windows against cool surroundings. */
const NK = (() => {
  const { mix, rnd, hsh, px, rect, disk, ell } = VG;
  function geom(g) {
    const W = g.W, H = g.H, wide = W > 150, cw = Math.min(Math.round(W * (wide ? .56 : .9)), 140), cx = Math.round(W / 2);
    return { W, H, wide, cx, cw, x0: cx - Math.round(cw / 2), x1: cx + Math.round(cw / 2), sw: Math.round(H * .62), hz: Math.round(H * .44) };
  }
  const u = (L, v) => Math.round(L.x0 + v * (L.x1 - L.x0));

  /* ---- clump painters: (c, x, y, r, ramp[dark..light], R) ---- */
  function leaves(c, x, y, r, K, R) {
    const n = Math.max(3, Math.round(r * .9));
    const pts = []; for (let i = 0; i < n; i++) pts.push([x + Math.round((R() - .5) * r * 1.3), y + Math.round((R() - .5) * r * 1.0), Math.max(2, Math.round(r * (.5 + R() * .35)))]);
    for (const [px_, py_, rr] of pts) disk(c, px_, py_, rr, K[0]);
    for (const [px_, py_, rr] of pts) disk(c, px_ - 1, py_ - 1, Math.max(1, rr - 1), K[1]);
    for (const [px_, py_, rr] of pts) if (rr > 2) { disk(c, px_ - 2, py_ - 2, Math.max(1, Math.round(rr * .55)), K[2]); }
    for (const [px_, py_, rr] of pts) { px(c, px_ - rr + 1, py_ - rr + 1, K[3 % K.length]); if (rr > 3) { px(c, px_ - 2, py_ - rr + 1, K[3 % K.length]); px(c, px_ + 1, py_ - rr + 2, K[2]); } }
    for (let i = 0; i < n; i++) px(c, x - r + Math.floor(R() * r * 2), y - r * .4 + Math.floor(R() * r * 1.3), K[0]);
  }
  function rock(c, x, y, r, K, R) {
    const w = Math.round(r * (1.4 + R() * .8)), h = Math.round(r * (1 + R() * .5));
    rect(c, x - w / 2, y - h / 2, w, h, K[1]); rect(c, x - w / 2, y - h / 2, w, 1, K[3 % K.length]); rect(c, x - w / 2, y - h / 2, 1, h, K[2]); rect(c, x + w / 2 - 1, y - h / 2 + 1, 1, h - 1, K[0]); rect(c, x - w / 2 + 1, y + h / 2 - 1, w - 1, 1, K[0]);
    if (R() < .6) rect(c, x - w / 2 + 2, y - h / 2 + 2 + Math.floor(R() * (h - 4)), Math.max(2, w - 5), 1, K[0]);
  }
  function coral(c, x, y, r, K, R) {
    const arms = 3 + Math.floor(R() * 3);
    for (let a = 0; a < arms; a++) { let cx = x, cy = y, ang = -1.57 + (a - arms / 2) * .6 + (R() - .5) * .4; const L2 = Math.round(r * (.8 + R() * .8)); for (let k = 0; k < L2; k++) { cx += Math.cos(ang); cy += Math.sin(ang); ang += (R() - .5) * .4; px(c, cx, cy, K[1]); px(c, cx + 1, cy, K[0]); if (k > L2 - 3) px(c, cx, cy, K[3 % K.length]); if (k > 3 && R() < .2) { px(c, cx - 1, cy - 1, K[2]); } } disk(c, cx, cy, 1, K[3 % K.length]); }
    disk(c, x, y, Math.max(2, r >> 1), K[1]); px(c, x - 1, y - 1, K[2]);
  }
  function puff(c, x, y, r, K, R) {
    const n = 3 + Math.floor(R() * 2), pts = []; for (let i = 0; i < n; i++) pts.push([x + Math.round((i - n / 2) * r * .6), y + Math.round((R() - .5) * r * .5), Math.round(r * (.6 + R() * .35))]);
    for (const [a, b, rr] of pts) disk(c, a, b, rr, K[0]); for (const [a, b, rr] of pts) disk(c, a - 1, b - 1, Math.max(1, rr - 1), K[1]); for (const [a, b, rr] of pts) disk(c, a - 2, b - 2, Math.max(1, rr - 3), K[2]);
  }
  const CL = { leaf: leaves, rock, coral, puff };

  /* ---- the enclosing wall: everything outside an irregular opening is wall; the rim is lit, the depth is dark ---- */
  function frame(c, g, o) {
    const R = rnd(o.seed), K = o.ramp, cx = o.cx, cy = o.cy, rx = o.rx, ry = o.ry, ph = [R() * 6, R() * 6, R() * 6], clump = CL[o.clump || 'leaf'], bite = o.bite || .14;
    const edgeAt = a => 1 + (Math.sin(a * 3 + ph[0]) * .5 + Math.sin(a * 5 + ph[1]) * .3 + Math.sin(a * 9 + ph[2]) * .2) * bite + (o.flat ? Math.max(0, Math.sin(a)) * o.flat : 0);
    const mn = Math.min(rx, ry);
    for (let y = g.y0; y < g.y1; y++) for (let x = g.x0; x < g.x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.hypot(dx, dy); if (d < .6) continue;
      const t = edgeAt(Math.atan2(dy, dx)); if (d <= t) continue;
      const dd = (d - t) * mn; let k = dd < 2 ? 2 : dd < 7 ? 1 : 0; const h = hsh(x >> 1, y >> 1, o.seed);
      if (h < .22 && k > 0) k--; else if (h > .93 && k < 2) k++;
      c.fillStyle = K[k]; c.fillRect(x, y, 1, 1);
    }
    /* scalloped rim and interior texture */
    const n = Math.round((rx + ry) * .9);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283, t = edgeAt(a), x = Math.round(cx + Math.cos(a) * rx * (t + .02)), y = Math.round(cy + Math.sin(a) * ry * (t + .02));
      if (x < g.x0 - 8 || x > g.x1 + 8 || y < g.y0 - 8 || y > g.y1 + 8) continue; clump(c, x, y, 3 + Math.floor(R() * (o.r || 4)), K, R);
    }
    const area = (g.x1 - g.x0) * (g.y1 - g.y0), m = Math.round(area / (o.tex || 140));
    for (let i = 0; i < m; i++) { const x = g.x0 + Math.floor(R() * (g.x1 - g.x0)), y = g.y0 + Math.floor(R() * (g.y1 - g.y0)), dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.hypot(dx, dy); if (d < edgeAt(Math.atan2(dy, dx)) + .12) continue; clump(c, x, y, 3 + Math.floor(R() * 3), [K[0], K[0], K[1], K[1]], R); }
    if (o.hang) { for (let i = 0; i < (o.hangN || 9); i++) { const a = -3.1 + R() * 3, t = edgeAt(a), x = Math.round(cx + Math.cos(a) * rx * t), y = Math.round(cy + Math.sin(a) * ry * t); o.hang(c, x, y, R); } }
    if (o.after) o.after(c, g, edgeAt);
  }

  /* ---- small things ---- */
  function shadow(c, x, y, rx, a) { c.globalAlpha = a == null ? .28 : a; ell(c, x, y, rx, Math.max(1, Math.round(rx * .28)), '#000000'); c.globalAlpha = 1; }
  function tufts(c, x0, x1, y, K, R, dens, h) { for (let x = x0; x < x1; x++) if (R() < (dens || .3)) { const hh = 1 + Math.floor(R() * (h || 3)), col = K[1 + (R() < .5 ? 1 : 0)]; for (let j = 0; j < hh; j++) px(c, x + (j > 1 ? (R() < .5 ? -1 : 1) : 0), y - j, j === hh - 1 ? K[2] : col); } }
  function trunk(c, x, base, h, w, K, R, o) {
    o = o || {};
    for (let y = 0; y < h; y++) { const u_ = y / h, ww = Math.round(w * (1 + (1 - u_) * (o.flare || .35) * (y < h * .18 ? 2 : .4))) , lean = Math.round(Math.sin(u_ * 3 + (o.ph || 0)) * (o.sway || 1.5)), x0 = x - ww + lean;
      rect(c, x0, base - y, ww * 2, 1, K[1]); rect(c, x0, base - y, Math.max(1, Math.round(ww * .45)), 1, K[2]); px(c, x0, base - y, K[3 % K.length]); rect(c, x0 + ww * 2 - Math.max(2, Math.round(ww * .5)), base - y, Math.max(2, Math.round(ww * .5)), 1, K[0]);
      if (hsh(y, x, 5) < .2) px(c, x0 + 2 + Math.floor(hsh(y, 2, x) * (ww * 2 - 4)), base - y, K[0]); }
    for (const d of [-1, 1]) for (let j = 0; j < 7; j++) { rect(c, x + d * (w + j) - (d < 0 ? 1 : 0), base - 1 - Math.floor(j / 3), 1, 2 + Math.floor((7 - j) / 3), j > 3 ? K[0] : K[1]); }
  }
  function window_(c, x, y, w, h, lit, K) { rect(c, x - 1, y - 1, w + 2, h + 2, K[0]); rect(c, x, y, w, h, lit ? K[3] : K[1]); if (lit) { rect(c, x, y, w, 1, K[3]); px(c, x + 1, y + 1, '#ffffff'); } rect(c, x + Math.floor(w / 2), y, 1, h, K[0]); }
  function smoke(c, x, y, f, col) { for (let i = 0; i < 6; i++) { const t = ((f / 6 + i * 1.7) % 10) / 10; c.globalAlpha = (1 - t) * .55; px(c, x + Math.sin(t * 6 + i) * 2 + t * 3, y - t * 18, col); } c.globalAlpha = 1; }

  /* ---- folk ----
     spec: { id, name, tasks:[{to, act, t, take, say}], draw(c, n, f, T), spd, hw, hh, say, snd, sndK, lane, mv }
     to: an ECO node, a number (x), or a function(n) returning either.  act: walk (just go), tend (bend over a plant: it wakes), carry (take
     spec.take here; the next 'give' hands it over), give (hand over to the node: it lights up), enter (go into a hut and stay t frames, its window glows),
     talk (turn to the nearest other folk and trade a glyph), look (stand and look around), sit.
     Moves at 6 steps a second like everything in the live pass. */
  function folk(S, L, o) {
    const lane = o.lane == null ? 2 : o.lane, y = L.sw + 2 + lane * 3;
    return S(o.id, Object.assign({ kind: 'creature', folk: true, hw: o.hw || 5, hh: o.hh || 11, y, z: y, dir: 1, ti: 0, ph: 'go', tm: 0, carry: null, pose: '', mvk: false, spd: .9, tasks: [], lift: -2 }, o, {
      step(n, f) {
        if (n.hold && n.hold > 0) { n.hold--; return; }
        const T = n.tasks[n.ti % n.tasks.length]; if (!T) return;
        const tg = typeof T.to === 'function' ? T.to(n) : T.to, tx = tg == null ? n.x : (typeof tg === 'number' ? tg : tg.x);
        const wy = T.y != null ? T.y : (tg && typeof tg === 'object' && tg.y != null ? (tg.kind ? Math.max(L.sw + 3, tg.y + 3) : tg.y) : y); if (!n.hidden) { n.y += Math.max(-.6, Math.min(.6, wy - n.y)); n.z = n.y; }
        if (n.ph === 'go') {
          n.hidden = false; const dx = tx - n.x; n.pose = ''; if (Math.abs(dx) <= (n.spd || .9) + .1) { n.x = tx; n.ph = 'do'; n.tm = T.t || 6; n.mvk = false; if (T.act === 'carry' && T.take) n.carry = T.take; if (T.act === 'enter' && tg && tg.kind) { n.hidden = true; tg.lit = 1; } }
          else { n.dir = dx > 0 ? 1 : -1; n.x += n.dir * (n.spd || .9); n.mvk = true; if (o.mv === 'float') n.y = y + Math.sin(f / 7 + n.x * .1) * 1.5; }
        } else {
          n.tm--; const a = T.act;
          if (a === 'tend') { n.pose = 'tend'; if (n.tm === Math.round((T.t || 6) / 2) && tg && tg.kind) { tg.en = 1; tg.fl = 1; tg.kick = 1; ECO.spark(tg.x, tg.y - 6, 7, '#d8ffa0', .5, .6); if (T.say) ECO.say(n, T.say, false); } }
          else if (a === 'give') { n.pose = 'give'; if (n.tm === 1) { n.carry = null; if (tg && tg.kind) { tg.fl = 1; tg.kick = 1; tg.stock = (tg.stock || 0) + 1; } ECO.spark(tx, n.y - 8, 6, '#ffe9a0', .5, .5); } }
          else if (a === 'talk') { n.pose = 'talk'; if (n.tm === Math.round((T.t || 8) / 2)) { let b = null, bd = 28; for (const c2 of ECO.kind('creature')) { if (c2 === n || !c2.folk || c2.hidden) continue; const d = Math.abs(c2.x - n.x); if (d < bd) { bd = d; b = c2; } } ECO.say(n, T.say || 'note', false); if (b) { b.hold = 6; b.dir = n.x < b.x ? -1 : 1; setTimeout(() => ECO.say(b, T.reply || 'heart', false), 600); } } }
          else if (a === 'sit' || a === 'look') n.pose = a;
          else if (a === 'enter') { n.hidden = true; if (n.tm <= 0 && tg && tg.kind) tg.lit = 0; }
          if (n.tm <= 0) { n.ph = 'go'; n.ti++; n.pose = ''; if (a === 'enter') n.hidden = false; }
        }
      },
    }));
  }
  return { geom, u, frame, leaves, rock, coral, puff, shadow, tufts, trunk, window: window_, smoke, folk, CL };
})();
