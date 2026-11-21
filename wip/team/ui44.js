
/* ---------- a little celebration: falling leaves and a one-line cheer ----------
   Big for the first paycheck and for finishing the setup (leaves fall across the whole screen), medium for each setup step
   and small for adding things (a handful tossed up from the button). With reduced motion switched on there are no leaves, only the cheer. */
const CHEERS = {
  pay: 'Pay entered.',
  bills: 'Bills checked.',
  goals: 'Goal set.',
  receipts: 'First receipt logged.',
};
const CONF = { parts: [], raf: 0, last: 0, tick: 0, cheerT: 0 };
/* leaf colours follow the look: the greens of the current theme, two fixed mid greens and one gold leaf */
const leafColors = () => { const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim(); return [v('--accent'), v('--accent-h'), v('--good'), '#5db98a', '#3a9a68', v('--warn')].filter(Boolean); };
/* one message at a time, each shown long enough to read: a message that comes while another one is fresh waits its turn (QC round 4
   novice P1: "Badge: First receipt." was lost under "Logged. Streak: week 1.") */
let CHEER_Q = [], CHEER_QT = 0;
function cheer(msg) {
  const el = $('#cheer'); if (!el || !msg) return;
  const fresh = el.classList.contains('on') && el.textContent && el.textContent !== msg && Date.now() - (CONF.cheerAt || 0) < 1800;
  const isBadge = t => /^(Badge: |\d+ badges: )/.test(t || '');
  /* only a badge waits its turn; a message about what the person just did shows at once, and a badge on screen waits instead */
  if (fresh && !isBadge(msg) && isBadge(el.textContent)) { if (CHEER_Q.indexOf(el.textContent) < 0) CHEER_Q.unshift(el.textContent); }
  else if (fresh && isBadge(msg)) { if (CHEER_Q.indexOf(msg) < 0) CHEER_Q.push(msg); clearTimeout(CHEER_QT); CHEER_QT = setTimeout(() => { const n = CHEER_Q.shift(); if (n) { CONF.cheerAt = 0; cheer(n); } }, 1800 - (Date.now() - (CONF.cheerAt || 0))); return; }
  /* in setup the message sits just above Back, Next or Done, however tall that row is (H1 walk, finding 11); while the Undo bar is up it
     sits just above the bar, never behind it */
  { const ft = document.body.classList.contains('touring') && $('.tour-foot'), r = ft && ft.getBoundingClientRect(), ub = $('#undoBar'), ur = ub && !ub.hidden && ub.getClientRects().length ? ub.getBoundingClientRect() : null;
    el.style.bottom = r && r.height ? Math.round(innerHeight - r.top + 8) + 'px' : ur && ur.height ? Math.round(innerHeight - ur.top + 8) + 'px' : ''; }
  el.textContent = msg; el.classList.add('on'); CONF.cheerAt = Date.now(); clearTimeout(CONF.cheerT);
  CONF.cheerT = setTimeout(() => { el.classList.remove('on'); CONF.cheerT = setTimeout(() => { if (!el.classList.contains('on')) el.textContent = ''; }, 500); }, 3400);
  if (CHEER_Q.length) { clearTimeout(CHEER_QT); CHEER_QT = setTimeout(() => { const n = CHEER_Q.shift(); if (n) { CONF.cheerAt = 0; cheer(n); } }, 1800); }
}
function celebrate(size, msg, from) {
  cheer(msg);
  /* small and medium moments are the cheer line only: nothing flies over the words. Leaves and the peeking animal are kept for the big moments. */
  if (size !== 'big') return;
  peek('axolotl');
  const cv = $('#confetti'); if (!cv || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const now = Date.now(); if (size === 'small' && now - CONF.last < 900) return; CONF.last = now;
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1), cols = leafColors(), r = Math.random;
  if (!CONF.parts.length) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
  /* one leaf: a length and a half width, a slow tumble (rot), a flip (tilt) and a side-to-side sway */
  const add = (x, y, ang, spd) => CONF.parts.push({
    x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, w: 10 + r() * 7, h: 2.6 + r() * 2, rot: r() * 6.28, vr: (r() - .5) * .14,
    tilt: r() * 6.28, vt: .04 + r() * .08, sway: r() * 6.28, sw: .5 + r() * 1.1, color: cols[Math.floor(r() * cols.length)], life: 0, max: 190 + r() * 110,
  });
  if (size === 'big') {
    for (let i = 0; i < 110; i++) add(r() * W, -16 - r() * H * .5, 1.57 + (r() - .5) * .6, .6 + r() * 1.4);
  } else {
    let x = W / 2, y = H * .72;
    if (from && from.getBoundingClientRect) { const b = from.getBoundingClientRect(); if (b.width) { x = b.left + b.width / 2; y = b.top + b.height / 2; } }
    const n = size === 'med' ? 44 : 18, sp = size === 'med' ? 6.5 : 4.5;
    for (let i = 0; i < n; i++) add(x, y, -1.57 + (r() - .5) * 1.9, sp * (.5 + r()));
  }
  if (!CONF.raf) { CONF.tick = performance.now(); CONF.raf = requestAnimationFrame(leafFrame); }
}
function leafFrame(t) {
  const cv = $('#confetti'), ctx = cv.getContext('2d'), H = innerHeight, dt = Math.min(2.5, (t - CONF.tick) / 16.67 || 1); CONF.tick = t;
  ctx.clearRect(0, 0, cv.width, cv.height);
  CONF.parts = CONF.parts.filter(p => {
    p.life += dt; p.vy = Math.min(3.8, p.vy + .11 * dt); p.vx *= Math.pow(.975, dt);
    p.x += (p.vx + Math.sin(p.sway + p.life * .06) * p.sw) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.tilt += p.vt * dt;
    if (p.life > p.max || p.y > H + 30) return false;
    const fade = p.life > p.max * .7 ? 1 - (p.life - p.max * .7) / (p.max * .3) : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, fade); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.tilt)); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.moveTo(-p.w / 2, 0); ctx.quadraticCurveTo(0, -p.h * 2, p.w / 2, 0); ctx.quadraticCurveTo(0, p.h * 2, -p.w / 2, 0); ctx.fill();
    ctx.strokeStyle = p.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-p.w / 2, 0); ctx.lineTo(-p.w / 2 - 3, 0); ctx.stroke();
    ctx.restore(); return true;
  });
  if (CONF.parts.length) CONF.raf = requestAnimationFrame(leafFrame); else { CONF.raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
}
/* the first time each setup step is done */
function afterDone(k) {
  if (tourIsOpen) return; /* the tour celebrates on its own */
  const d = S.ui.done || {}, all = START_STEPS.every(s => d[s[0]]);
  if (all) celebrate('big', 'Setup is done, that\'s all four steps');
  else celebrate('med', CHEERS[k]);
}
/* any tap puts a message away, so it never sits over words someone is reading; the message itself never takes a tap meant for a button under it (38.31 north-star round 3) */
document.addEventListener('pointerdown', () => { const el = document.getElementById('cheer'); if (el && el.classList.contains('on') && Date.now() - (CONF.cheerAt || 0) > 600) { el.classList.remove('on'); clearTimeout(CONF.cheerT); } }, true);
/* setup: whatever gets the focus is moved clear of the faded strip above Back and Next, and of the top edge (H1 walk, finding 11).
   The strip is 80px (style.css .tour-scroll mask); a field taller than the room is left alone */
document.addEventListener('focusin', e => {
  const sc = document.getElementById('tourScroll'), t = e.target; if (!sc || !t || !sc.contains(t) || !t.getBoundingClientRect) return;
  if (!t.matches('input, select, textarea') && !t.matches(':focus-visible')) return;   /* a button pressed by a finger is not moved under it: the move swallowed the first tap on Load (QC10 round 2) */
  const fix = () => { const q = t.getBoundingClientRect(), s = sc.getBoundingClientRect(), low = s.bottom - 88; if (q.height > low - s.top) return;
    if (q.bottom > low) sc.scrollTop += Math.ceil(q.bottom - low); else if (q.top < s.top + 4) sc.scrollTop -= Math.ceil(s.top + 4 - q.top); };
  fix(); setTimeout(fix, 120);
});
