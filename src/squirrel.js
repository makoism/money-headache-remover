/* ---------- the squirrel: stocking up the burrow ----------
   A short, quiet moment for the big steps only: a streak week starting, a batch of receipts going in, a goal passing a quarter, spare money
   moved into a goal. A squirrel runs in with one gold coin, tosses it into the burrow door, hops for joy, and runs off. It is a small canvas
   in the bottom corner that takes no taps. It runs for about five seconds and then is gone, so nothing runs while the page sits idle.
   It never repeats within two and a half minutes, and it does not play for people who ask their device for reduced motion. */
const SQ = (() => {
  const W = 100, H = 38, SC = 3, GY = H - 4, DX = 24;      /* the picture is 100 x 38 pixels, shown at 3x; the ground is 4 up from the bottom; the burrow door is at x=24 */
  const C = { fur: '#c9772f', furD: '#7e4118', furL: '#e9a45a', cream: '#f7e3bb', eye: '#1b1008', nose: '#3a1f12', coin: '#f6c945', coinD: '#c48a22', coinW: '#fff6c0',
    hill: '#2f8c4c', hillD: '#1d5e36', hillL: '#72d076', door: '#150b05', frame: '#6e4529', dirt: '#4b3421', pink: '#ff90b8', yel: '#ffd84a' };
  let last = 0, busy = false, nShown = 0, cv = null, g = null;
  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const disk = (cx, cy, r, c) => { g.fillStyle = c; for (let y = Math.floor(-r); y <= r; y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 || 1, 1); } };
  const lim = (a, b, t) => a + (b - a) * t;
  /* the burrow: a grassy hill with a round door, a few flowers, and the coins stacked inside */
  function burrow(alpha, glow, coins) {
    g.globalAlpha = alpha;
    const cx = DX, base = GY + 1;
    g.save(); g.beginPath(); g.rect(0, 0, W, GY + 1); g.clip();
    disk(cx, base, 17, C.hillD); disk(cx, base + 1, 16, C.hill); disk(cx - 4, base - 3, 10, C.hill);
    for (let i = 0; i < 6; i++) px(cx - 12 + i * 2, base - 11 - (i % 3 === 1 ? 1 : 0) + Math.abs(i - 2) * .4, C.hillL);
    px(cx - 11, base - 7, C.hillL); px(cx - 10, base - 8, C.hillL); px(cx + 10, base - 9, C.hillL);
    px(cx - 13, base - 4, C.pink); px(cx + 12, base - 3, C.yel); px(cx + 9, base - 7, C.pink);
    g.restore();
    /* the door */
    g.fillStyle = C.frame; g.fillRect(cx - 6, base - 13, 12, 14); g.fillRect(cx - 5, base - 14, 10, 1);
    g.fillStyle = C.door; g.fillRect(cx - 5, base - 12, 10, 12); g.fillRect(cx - 4, base - 13, 8, 1);
    if (glow > 0) { g.globalAlpha = alpha * glow * .5; disk(cx, base - 5, 6, '#ffcf55'); g.globalAlpha = alpha * glow * .35; disk(cx, base - 5, 3, '#fff0a0'); g.globalAlpha = alpha; }
    for (let i = 0; i < coins; i++) { const x = cx - 4 + (i % 4) * 2 + (i > 3 ? 1 : 0), y = base - 2 - Math.floor(i / 4) * 2; px(x, y, C.coin); px(x + 1, y, C.coin); px(x, y + 1, C.coinD); px(x + 1, y + 1, C.coinD); }
    px(cx - 4, base - 2, C.coinW);
    g.globalAlpha = 1;
  }
  function coinSprite(x, y, spin) { const w = Math.abs(Math.cos(spin)) > .45 ? 3 : 1; g.fillStyle = C.coinD; g.fillRect(Math.round(x - 1), Math.round(y - 1), w + 1, 4); g.fillStyle = C.coin; g.fillRect(Math.round(x - 1), Math.round(y - 1), w, 3); if (w > 1) px(x - 1, y - 1, C.coinW); }
  /* the squirrel, facing right (flip for left); (x, y) is its feet; pose: run | sit; ph is the step phase; lift is how high the coin is held */
  function squirrel(x, y, dir, pose, ph, t, coinHeld, lift) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(dir, 1);
    const w = Math.sin(t / 90) * 1.1, step = pose === 'run' ? Math.sin(ph) : 0;
    /* the tail: a thick curl rising behind, tipped forward over the back, with a little wag */
    for (let i = 0; i < 10; i++) { const u = i / 9, tx = -3 - Math.sin(u * 2.6) * 6.5 + (u > .6 ? (u - .6) * 7 : 0) + w * u, ty = -3 - u * 13 + (pose === 'run' ? -step * .4 : 0), r = 3.4 - Math.abs(u - .45) * 1.4;
      disk(tx, ty, r + 1, C.furD); }
    for (let i = 0; i < 10; i++) { const u = i / 9, tx = -3 - Math.sin(u * 2.6) * 6.5 + (u > .6 ? (u - .6) * 7 : 0) + w * u, ty = -3 - u * 13 + (pose === 'run' ? -step * .4 : 0), r = 3.4 - Math.abs(u - .45) * 1.4;
      disk(tx, ty, r, i > 6 ? C.furL : C.fur); }
    /* legs */
    if (pose === 'run') { disk(-3 + step * 2.2, -1, 1.6, C.furD); disk(3 - step * 2.2, -1 - Math.max(0, -step) * 1.6, 1.6, C.furD); }
    else { disk(-2, -1, 2, C.furD); disk(3, -1, 2, C.furD); }
    /* body and belly */
    disk(0, -5.5, 5.4, C.furD); disk(0, -5.5, 4.4, C.fur); disk(2, -4.5, 2.9, C.cream);
    /* head, cheek, ears */
    disk(3.5, -11.5, 4.9, C.furD); disk(3.5, -11.5, 3.9, C.fur); disk(5.2, -10, 1.9, C.cream);
    disk(1.2, -15.6, 1.7, C.furD); disk(1.2, -15.6, .9, C.fur); disk(5.8, -15.8, 1.7, C.furD); disk(5.8, -15.8, .9, C.fur); px(1.2, -16, C.nose); px(5.8, -16.2, C.nose);
    px(5.6, -12.3, C.eye); px(5.6, -13.1, '#ffffff'); px(8, -10.6, C.nose);
    /* the coin, held up in two little paws */
    if (coinHeld) { const cy = -6.5 - lift; px(5, cy + 2, C.furD); px(8, cy + 2, C.furD); coinSprite(7, cy, 0); px(5, cy + 1, C.fur); px(8, cy + 1, C.fur); }
    g.restore();
  }
  function frame(t0, now, n) {
    const t = now - t0; g.clearRect(0, 0, W, H);
    const a = Math.min(1, t / 350) * (t > 4900 ? Math.max(0, 1 - (t - 4900) / 400) : 1);
    let coins = Math.min(7, n + 1), glow = 0, parts = [];
    const ground = GY, stopX = DX + 25, offX = W + 10;
    let sx = offX, pose = 'run', dir = -1, hop = 0, held = true, lift = 0, ph = t / 55;
    if (t < 1500) sx = lim(offX, stopX, ease(t / 1500));                        /* running in, coin in paws */
    else if (t < 2150) { sx = stopX; pose = 'sit'; lift = ease((t - 1500) / 500) * 2.5; }   /* stops, lifts the coin */
    else if (t < 2650) { sx = stopX; pose = 'sit'; held = false; lift = 0; hop = 0; }
    else if (t < 3500) { sx = stopX; pose = 'sit'; held = false; const u = (t - 2650) / 850; hop = Math.abs(Math.sin(u * Math.PI * 2)) * 4; }   /* two happy hops */
    else { held = false; dir = 1; sx = lim(stopX, offX, ease((t - 3500) / 1300)); pose = 'run'; ph = t / 45; }   /* turns and runs off */
    /* the toss: the coin flies from the paws into the door */
    const toss = (t - 2150) / 500;
    burrow(a, glow = Math.max(0, 1 - Math.abs(t - 2750) / 700) * (t > 2650 ? 1 : 0), t > 2700 ? coins : coins - 1);
    g.globalAlpha = a;
    squirrel(sx, ground - hop, dir, pose, ph, t, held, lift);
    if (toss > 0 && toss < 1) { const x0 = stopX + 2, y0 = ground - 9, x1 = DX, y1 = ground - 6, u = ease(toss); coinSprite(lim(x0, x1, u), lim(y0, y1, u) - Math.sin(u * Math.PI) * 10, toss * 12); }
    /* sparkles where it lands */
    if (t > 2650 && t < 3400) { const u = (t - 2650) / 750; for (let i = 0; i < 7; i++) { const an = i * 0.9 + .3, rr = u * (6 + (i % 3) * 3), sx2 = DX + Math.cos(an) * rr, sy2 = ground - 7 + Math.sin(an) * rr * .8; g.globalAlpha = a * (1 - u); px(sx2, sy2, i % 2 ? C.coinW : C.coin); if (i % 3 === 0) { px(sx2 - 1, sy2, C.coinW); px(sx2 + 1, sy2, C.coinW); } } g.globalAlpha = 1; }
    g.globalAlpha = 1;
  }
  function stash() {
    const now = Date.now(); if (busy || reduced() || now - last < 150000) return false; last = now; busy = true; const n = nShown++;
    setTimeout(() => {
      cv = document.createElement('canvas'); cv.width = W; cv.height = H; g = cv.getContext('2d'); if (!g) { busy = false; return; }
      cv.setAttribute('aria-hidden', 'true'); cv.style.cssText = `position:fixed;left:10px;bottom:calc(8px + env(safe-area-inset-bottom,0px));width:${W * SC}px;height:${H * SC}px;image-rendering:pixelated;pointer-events:none;z-index:70`;
      document.body.append(cv); const t0 = performance.now(); let coined = false;
      const tick = () => { const now2 = performance.now(), t = now2 - t0; if (t > 5300 || !cv.isConnected) { cv.remove(); busy = false; return; }
        if (!coined && t > 2650) { coined = true; try { sfx('coin'); } catch (e) { /* sound is a bonus */ } }
        frame(t0, now2, n); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, 700);
    return true;
  }
  return { stash };
})();
if (/[?&]sqtest\b/.test(location.search)) window.__sq = SQ;   /* test hook only */
