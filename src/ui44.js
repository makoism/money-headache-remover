
/* ---------- a little celebration: confetti and a one-line cheer ----------
   Big for the first paycheck and for finishing the setup, medium for each setup step, small for adding things.
   With reduced motion switched on there is no confetti, only the cheer. */
const CHEERS = {
  pay: 'Pay entered.',
  bills: 'Bills checked.',
  goals: 'Goal set.',
  receipts: 'First receipt logged.',
};
const CONF = { parts: [], raf: 0, last: 0, tick: 0, cheerT: 0 };
const confettiColors = () => { const cs = getComputedStyle(document.documentElement), c = [1, 2, 3, 4, 5, 6, 7].map(i => cs.getPropertyValue('--c' + i).trim()).filter(Boolean); return c.concat(['#ffd27a', '#ffffff']); };
function cheer(msg) {
  const el = $('#cheer'); if (!el || !msg) return;
  el.textContent = msg; el.classList.add('on'); clearTimeout(CONF.cheerT);
  CONF.cheerT = setTimeout(() => { el.classList.remove('on'); CONF.cheerT = setTimeout(() => { if (!el.classList.contains('on')) el.textContent = ''; }, 500); }, 3400);
}
function celebrate(size, msg, from) {
  cheer(msg);
  const cv = $('#confetti'); if (!cv || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const now = Date.now(); if (size === 'small' && now - CONF.last < 900) return; CONF.last = now;
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1), cols = confettiColors(), r = Math.random;
  if (!CONF.parts.length) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
  const add = (x, y, ang, spd) => CONF.parts.push({
    x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, w: 6 + r() * 5, h: 3 + r() * 4, round: r() < .3, rot: r() * 6.28, vr: (r() - .5) * .35,
    tilt: r() * 6.28, vt: .08 + r() * .14, color: cols[Math.floor(r() * cols.length)], life: 0, max: 120 + r() * 70,
  });
  if (size === 'big') {
    for (let i = 0; i < 60; i++) { add(W * .1, H + 8, -1.57 + .55 + (r() - .5) * .7, 13 + r() * 9); add(W * .9, H + 8, -1.57 - .55 + (r() - .5) * .7, 13 + r() * 9); }
    for (let i = 0; i < 40; i++) add(r() * W, -12 - r() * 60, 1.57 + (r() - .5) * .5, 1 + r() * 2);
  } else {
    let x = W / 2, y = H * .72;
    if (from && from.getBoundingClientRect) { const b = from.getBoundingClientRect(); if (b.width) { x = b.left + b.width / 2; y = b.top + b.height / 2; } }
    const n = size === 'med' ? 70 : 28, sp = size === 'med' ? 12 : 8;
    for (let i = 0; i < n; i++) add(x, y, -1.57 + (r() - .5) * 1.7, sp * (.5 + r()));
  }
  if (!CONF.raf) { CONF.tick = performance.now(); CONF.raf = requestAnimationFrame(confettiFrame); }
}
function confettiFrame(t) {
  const cv = $('#confetti'), ctx = cv.getContext('2d'), H = innerHeight, dt = Math.min(2.5, (t - CONF.tick) / 16.67 || 1); CONF.tick = t;
  ctx.clearRect(0, 0, cv.width, cv.height);
  CONF.parts = CONF.parts.filter(p => {
    p.life += dt; p.vy = Math.min(9, p.vy + .34 * dt); p.vx *= Math.pow(.985, dt); p.vy *= Math.pow(.992, dt);
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.tilt += p.vt * dt;
    if (p.life > p.max || p.y > H + 30) return false;
    const fade = p.life > p.max * .7 ? 1 - (p.life - p.max * .7) / (p.max * .3) : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, fade); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.tilt)); ctx.fillStyle = p.color;
    if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h * .7, 0, 6.28); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore(); return true;
  });
  if (CONF.parts.length) CONF.raf = requestAnimationFrame(confettiFrame); else { CONF.raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
}
/* the first time each setup step is done */
function afterDone(k) {
  if (tourIsOpen) return; /* the tour celebrates on its own */
  const d = S.ui.done || {}, all = START_STEPS.every(s => d[s[0]]);
  if (all) celebrate('big', 'Setup complete. All four steps done.');
  else celebrate('med', CHEERS[k]);
}
