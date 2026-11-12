/* ---------- the fun parts of the guided setup ----------
   Sound effects (all made in the browser, no audio files), the subscriptions list, the loan toggle,
   the six jars in short, and the helpers that make the sliders easy to understand. */

/* ===== sound effects =====
   Every sound is a small recipe: (context, where to send it, when to start, an optional number). The same recipes play on the
   real speakers and in the silent test renderer, so the page can check that each one really makes sound. */
const SFXD = (() => {
  const d = {};
  const tone = (c, out, o) => {
    const osc = c.createOscillator(), g = c.createGain(), t = o.t, dur = o.dur || .1, vol = o.vol === undefined ? .2 : o.vol, atk = o.atk || .006;
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + dur + .03);
    return { osc, g };
  };
  const noise = (c, out, o) => {
    const len = Math.max(1, Math.floor(c.sampleRate * (o.dur + .05))), buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = o.t;
    src.buffer = buf; f.type = o.ft || 'bandpass'; f.Q.value = o.q || 1.2; f.frequency.setValueAtTime(o.f0, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .1, t + (o.atk || .02)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + o.dur + .05);
  };
  /* ----- the sound design: a forest, heard from a quiet room. Wind for moving, leaves for small steps,
     water drops for taps and saves, and once in a while, for the biggest moments, a bird far off. No beeps, no bells.
     Wind is low-passed noise sweeping up (forward) or down (back) with a very quiet low hum under the bigger ones.
     Leaves (rustle), drops and the bird are brighter, so they go to the bright output (o.hi, see SFX below). ----- */
  const air = (c, o, t, p) => noise(c, o, { t, dur: p.dur, f0: p.f0, f1: p.f1, ft: 'lowpass', q: p.q || .7, vol: p.vol, atk: p.atk || .1 });
  const hum = (c, o, t, p) => tone(c, o, { t, f: p.f, f2: p.f2, dur: p.dur, vol: p.vol, atk: p.atk || .12 });
  const hi = o => o.hi || o;
  /* leaves: noise in short grains of changing loudness (some grains silent), band-passed around 2 kHz, then a soft envelope */
  const rustle = (c, o, t, p) => {
    const sr = c.sampleRate, len = Math.max(1, Math.floor(sr * (p.dur + .05))), buf = c.createBuffer(1, len, sr), ch = buf.getChannelData(0);
    let i = 0; while (i < len) { const n = Math.floor(sr * (.004 + Math.random() * .012)), r = Math.random(), a = r < .3 ? 0 : r * r; for (let k = 0; k < n && i < len; k++, i++) ch[i] = (Math.random() * 2 - 1) * a; }
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = p.q || .9; f.frequency.setValueAtTime(p.f0 || 2100, t); if (p.f1) f.frequency.exponentialRampToValueAtTime(p.f1, t + p.dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p.vol, t + (p.atk || .06)); g.gain.exponentialRampToValueAtTime(0.0001, t + p.dur);
    src.connect(f); f.connect(g); g.connect(hi(o)); src.start(t); src.stop(t + p.dur + .05);
  };
  /* a water drop: a short tone whose pitch rises as it rings, then dies quickly (the way a drop sounds in a bowl) */
  const drop = (c, o, t, p) => {
    tone(c, hi(o), { t, f: p.f, f2: p.f * (p.rise || 1.9), dur: p.dur || .07, vol: p.vol, atk: .002 });
    noise(c, hi(o), { t, dur: .012, f0: p.f * 2, ft: 'bandpass', q: 1.2, vol: p.vol * .5, atk: .001 });
  };
  /* a bird far off: two soft falling whistles with a little waver, kept quiet and only on the biggest moments */
  const bird = (c, o, t, p) => {
    const note = (t0, f0, f1, dur, vol) => {
      const osc = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      osc.frequency.setValueAtTime(f0, t0); osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      lfo.frequency.value = 22; lg.gain.value = f0 * .012; lfo.connect(lg); lg.connect(osc.frequency);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .025); g.gain.setValueAtTime(vol, t0 + dur * .6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(hi(o)); osc.start(t0); lfo.start(t0); osc.stop(t0 + dur + .03); lfo.stop(t0 + dur + .03);
    };
    note(t, 2750, 2150, .16, p.vol); note(t + .21, 3050, 2350, .2, p.vol * .8);
  };
  /* ----- taps and switches: one small water drop. Very short and quiet, but clear. ----- */
  d.tap = (c, o, t) => drop(c, o, t, { f: 1150, rise: 1.8, dur: .06, vol: .2 });
  d.on = (c, o, t) => drop(c, o, t, { f: 1250, rise: 2.1, dur: .07, vol: .2 });
  d.off = (c, o, t) => drop(c, o, t, { f: 1100, rise: .62, dur: .07, vol: .18 });
  /* moving forward: wind rising, with leaves brushed on the way */
  d.next = (c, o, t) => { air(c, o, t, { dur: .46, f0: 240, f1: 760, vol: .32, atk: .14 }); hum(c, o, t, { f: 82, f2: 110, dur: .46, vol: .08 }); rustle(c, o, t + .04, { dur: .3, f0: 1900, f1: 2600, vol: .07, atk: .08 }); };
  d.back = (c, o, t) => { air(c, o, t, { dur: .34, f0: 640, f1: 230, vol: .26, atk: .05 }); rustle(c, o, t, { dur: .22, f0: 2400, f1: 1700, vol: .055, atk: .03 }); };
  d.type = (c, o, t) => air(c, o, t, { dur: .05, f0: 700, f1: 500, vol: .14, atk: .008 });
  /* a slider moving: a breath of air with one grain of leaves, higher as the value rises */
  d.tick = (c, o, t, v) => { air(c, o, t, { dur: .06, f0: 330 + Math.max(0, Math.min(100, +v || 0)) * 3, f1: 280, vol: .19, atk: .012 }); rustle(c, o, t, { dur: .05, f0: 2000 + Math.max(0, Math.min(100, +v || 0)) * 8, vol: .05, atk: .008 }); };
  d.whoosh = (c, o, t) => { air(c, o, t, { dur: .56, f0: 200, f1: 620, vol: .3, atk: .18 }); hum(c, o, t, { f: 70, f2: 94, dur: .56, vol: .07, atk: .18 }); rustle(c, o, t + .1, { dur: .36, f0: 1800, f1: 2500, vol: .07, atk: .12 }); };
  /* an entry was saved: a drop into still water, a low plop under it and a ripple of air */
  d.coin = (c, o, t) => { drop(c, o, t, { f: 620, rise: 2.2, dur: .1, vol: .42 }); hum(c, o, t + .03, { f: 170, f2: 115, dur: .18, vol: .1, atk: .01 }); air(c, o, t + .05, { dur: .4, f0: 320, f1: 700, vol: .2, atk: .12 }); };
  /* something added: a bubble */
  d.pop = (c, o, t) => { drop(c, o, t, { f: 380, rise: 2.4, dur: .06, vol: .2 }); air(c, o, t, { dur: .2, f0: 300, f1: 640, vol: .18, atk: .05 }); };
  /* a switch: a pebble set down on wood */
  d.thunk = (c, o, t) => { hum(c, o, t, { f: 120, f2: 64, dur: .24, vol: .22, atk: .012 }); noise(c, hi(o), { t, dur: .05, f0: 880, ft: 'bandpass', q: 5, vol: .12, atk: .002 }); air(c, o, t, { dur: .1, f0: 340, f1: 240, vol: .12, atk: .01 }); };
  /* a bigger step (a streak, a goal quarter): three drops climbing, wind and leaves under them */
  d.sparkle = (c, o, t) => {
    air(c, o, t, { dur: .72, f0: 280, f1: 1100, vol: .3, atk: .26 }); hum(c, o, t, { f: 92, f2: 140, dur: .72, vol: .08, atk: .26 });
    rustle(c, o, t + .05, { dur: .5, f0: 1800, f1: 2700, vol: .06, atk: .15 });
    drop(c, o, t + .08, { f: 780, rise: 1.9, dur: .09, vol: .14 }); drop(c, o, t + .24, { f: 980, rise: 1.9, dur: .09, vol: .13 }); drop(c, o, t + .42, { f: 1240, rise: 1.9, dur: .1, vol: .12 });
  };
  /* the biggest moments (setup done, goal funded, a badge): a slow swell of wind through the leaves, and one bird far off */
  d.fanfare = (c, o, t) => {
    air(c, o, t, { dur: 1.2, f0: 190, f1: 1000, vol: .5, atk: .5 });
    hum(c, o, t, { f: 62, f2: 92, dur: 1.2, vol: .2, atk: .5 });
    hum(c, o, t + .12, { f: 110, f2: 123, dur: 1.0, vol: .08, atk: .45 });
    hum(c, o, t + .12, { f: 165, f2: 185, dur: 1.0, vol: .045, atk: .45 });
    rustle(c, o, t + .15, { dur: .9, f0: 1700, f1: 2800, vol: .085, atk: .35 });
    bird(c, o, t + .5, { vol: .055 });
  };
  /* a small settle: a leaf coming to rest */
  d.soft = (c, o, t) => { air(c, o, t, { dur: .3, f0: 210, f1: 380, vol: .2, atk: .08 }); hum(c, o, t, { f: 116, f2: 134, dur: .3, vol: .035, atk: .08 }); rustle(c, o, t, { dur: .18, f0: 2200, f1: 1600, vol: .045, atk: .03 }); };
  /* the wind family (moving between pages, saving, finishing) is kept a little quieter; trim keeps the bright output alongside */
  const trim = (f, k) => (c, o, t, a) => { const g = c.createGain(); g.gain.value = k; g.connect(o); if (o.hi) { const h = c.createGain(); h.gain.value = k; h.connect(o.hi); g.hi = h; } f(c, g, t, a); };
  ['next', 'back', 'whoosh', 'coin', 'pop', 'thunk', 'sparkle', 'soft'].forEach(n => { d[n] = trim(d[n], .62); });
  d.fanfare = trim(d.fanfare, .66);
  return d;
})();
const SFX = (() => {
  let ctx = null, master = null, bright = null, tapT = 0; const last = {}; let lastBig = 0;
  const BIG = { next: 1, back: 1, coin: 1, sparkle: 1, fanfare: 1, whoosh: 1, soft: 1, pop: 1, thunk: 1 };
  const CLICK = { tap: 1, on: 1, off: 1 };
  const get = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try {
      ctx = new AC(); master = ctx.createGain(); master.gain.value = .5;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .4;
      const comp = ctx.createDynamicsCompressor(); master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
      bright = ctx.createGain(); bright.gain.value = .4;
      const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 5200; lp2.Q.value = .4;
      bright.connect(lp2); lp2.connect(comp);
      master.hi = bright; bright.hi = bright; /* recipes send leaves, drops and the bird to the bright output */
    } catch (e) { ctx = null; }
    return ctx;
  };
  const gaps = { type: 90, tick: 40, tap: 30, on: 30, off: 30 };
  const run = (name, arg) => {
    const c = get(); if (!c || !SFXD[name]) return;
    try { if (c.state === 'suspended') c.resume(); SFXD[name](c, CLICK[name] ? bright : master, c.currentTime + .005, arg); } catch (e) { /* sound is a bonus */ }
  };
  return {
    muted: () => !!(S.ui && S.ui.mute),
    ctx: () => get(),   /* the music shares this context (phones allow only a few) */
    state: () => (ctx ? ctx.state : 'none'),
    play(name, arg) {
      if (S.ui && S.ui.mute) return;
      const now = Date.now(); if (gaps[name] && last[name] && now - last[name] < gaps[name]) return; last[name] = now;
      /* a plain tap waits a moment and stays silent if a real progress sound plays for the same press */
      if (name === 'tap') {
        if (now - lastBig < 140) return;
        /* the audio engine is started inside the press itself: phones only allow that during a tap */
        const c = get(); try { if (c && c.state === 'suspended') c.resume(); } catch (e) { /* sound is a bonus */ }
        clearTimeout(tapT); tapT = setTimeout(() => { if (Date.now() - lastBig >= 140 && !(S.ui && S.ui.mute)) run('tap'); }, 45);
        return;
      }
      if (BIG[name]) lastBig = now;
      run(name, arg);
    },
  };
})();
if (/[?&]sfxtest\b/.test(location.search)) window.__sfx = SFXD;
const sfx = (n, a) => SFX.play(n, a);

/* ===== a few small leaves, for sliders and switches ===== */
function sparkBurst(host, x, y, n, spread) {
  if (!host) return;
  const cols = leafColors();
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'), a = Math.random() * Math.PI * 2, r = (spread || 46) * (.45 + Math.random() * .75);
    s.className = 'spk'; s.setAttribute('aria-hidden', 'true');
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r - 10)}px;--s:${(.6 + Math.random() * .9).toFixed(2)};--c:${cols[(Math.random() * cols.length) | 0]};--d:${Math.round(Math.random() * 90)}ms;--r:${Math.round(Math.random() * 180 - 90)}deg`;
    host.appendChild(s); setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 900);
  }
}

/* ===== calendar apps ===== */
const CAL_APPS = [
  ['google', 'Google Calendar', o => gcalUrl(o)],
  ['apple', 'Apple Calendar', null],
  ['outlook', 'Outlook.com', o => outlookUrl(o)],
  ['m365', 'Microsoft 365', o => outlook365Url(o)],
  ['yahoo', 'Yahoo Calendar', o => yahooUrl(o)],
  ['ics', 'Samsung, Proton, other', null],
];
const calBtnsInner = () => CAL_APPS.map((a, i) => (a[2]
  ? `<a class="btn cal${i === 0 ? ' solid' : ''}" data-cal="${a[0]}" target="_blank" rel="noopener noreferrer" href="#">${a[1]}</a>`
  : `<button type="button" class="btn cal" data-cal="${a[0]}">${a[1]}</button>`)).join('');
function calFill(root, o) {
  if (!root) return;
  CAL_APPS.forEach(a => { const el = root.querySelector(`[data-cal="${a[0]}"]`); if (el && a[2]) el.href = a[2](o); });
  root.__cal = o;
  const ta = root.parentNode && root.parentNode.querySelector('.cal-manual textarea'); if (ta) ta.value = calText(o);
}
/* A published artifact runs inside a viewer that blocks plain file downloads, so there the Apple and other buttons show
   the event text to copy instead. In a saved copy of the page the file download works. */
const inArtifact = () => { try { return !!(window.claude && typeof window.claude.use === 'function'); } catch (e) { return false; } };
/* the schedule in words, for the line under the buttons and the text that gets copied. The time label comes from the page. */
function reminderWhen(o) {
  const f = o.freq || 'weekly', t = timeLabel(o.time);
  return f === 'daily' ? `every day at ${t}` : f === 'monthly' ? `${o.dom === DOM_LAST ? 'the last day' : 'the ' + ordinal(o.dom || 1)} of every month at ${t}`
    : f === 'biweekly' ? `every other ${DAY_NAMES[o.day]} at ${t}` : `every ${DAY_NAMES[o.day]} at ${t}`;
}
const calText = o => o.title + '\nRepeats ' + reminderWhen(o) + '\n' + PAGE_URL;
/* the reminder the person has picked, as the calendar functions want it */
function reminderOf() {
  const freq = REMIND_FREQS.some(x => x[0] === S.ui.rcFreq) ? S.ui.rcFreq : 'weekly', time = S.ui.rcTime || '18:00';
  return { freq, day: S.ui.rcDay !== undefined ? +S.ui.rcDay : 0, dom: S.ui.rcDom !== undefined ? +S.ui.rcDom : 1, time, today: new Date(),
    title: 'Update my M.H.R.2000 receipts', details: `Add ${REMIND_SPAN[freq]} receipts to M.H.R.2000 (The Money Headache Remover 2000): cash, card and e-wallet.\n` + PAGE_URL };
}
/* the same four fields in the tour and on the Receipts tab; p is the id prefix ("tour" or "rc") */
function remindFieldsHTML(p) {
  const o = reminderOf(), rep = o.freq === 'weekly' || o.freq === 'biweekly';
  const doms = Array.from({ length: 28 }, (_, i) => i + 1).concat([DOM_LAST]);
  return `<div class="remind-fields">
    <div class="field"><label for="${p}Freq">How often</label><div class="selbox"><select id="${p}Freq">${REMIND_FREQS.map(f => `<option value="${f[0]}"${f[0] === o.freq ? ' selected' : ''}>${f[1]}</option>`).join('')}</select></div></div>
    <div class="field rf-day"${rep ? '' : ' hidden'}><label for="${p}Day">On</label><div class="selbox"><select id="${p}Day">${DAY_NAMES.map((n, i) => `<option value="${i}"${i === o.day ? ' selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div class="field rf-dom"${o.freq === 'monthly' ? '' : ' hidden'}><label for="${p}Dom">On the</label><div class="selbox"><select id="${p}Dom">${doms.map(d => `<option value="${d}"${d === o.dom ? ' selected' : ''}>${d === DOM_LAST ? 'Last day' : ordinal(d)}</option>`).join('')}</select></div></div>
    <div class="field"><label for="${p}Time">At</label><input type="time" id="${p}Time" value="${esc(o.time)}"></div>
  </div>`;
}
/* a change to one of the four fields, from either place. Returns true when it was one of them. */
function remindChange(t) {
  const m = /^(tour|rc)(Freq|Day|Dom|Time)$/.exec(t.id || ''); if (!m) return false;
  const k = m[2], v = t.value;
  if (k === 'Freq') { if (!REMIND_FREQS.some(f => f[0] === v)) return true; S.ui.rcFreq = v; }
  else if (k === 'Day') S.ui.rcDay = Math.max(0, Math.min(6, +v || 0));
  else if (k === 'Dom') S.ui.rcDom = +v === DOM_LAST ? DOM_LAST : Math.max(1, Math.min(28, +v || 1));
  else if (/^\d{2}:\d{2}$/.test(v)) S.ui.rcTime = v;
  else return true;
  persist(); return true;
}
/* show only the fields that this frequency needs, and keep the two places in step */
function remindShow(root, o) {
  const d = $('.rf-day', root), m = $('.rf-dom', root); if (d) d.hidden = !(o.freq === 'weekly' || o.freq === 'biweekly'); if (m) m.hidden = o.freq !== 'monthly';
}
function calManual(root, o) {
  let box = root.parentNode.querySelector('.cal-manual');
  if (!box) {
    box = document.createElement('div'); box.className = 'cal-manual';
    box.innerHTML = '<p>No calendar file can be saved here. In your calendar app, add an event, set the same repeat, and paste this in.</p><textarea readonly rows="4" aria-label="Calendar event text" spellcheck="false"></textarea><div class="row-btns"><button type="button" class="btn small solid" data-calcopy>Copy event text</button><span class="msg" role="status"></span></div>';
    const nx = root.nextElementSibling; (nx && nx.classList.contains('cal-msg') ? nx : root).after(box);
  }
  box.querySelector('textarea').value = calText(o);
  return box;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-calcopy]'); if (!b) return;
  const box = b.closest('.cal-manual'), ta = box.querySelector('textarea'), msg = box.querySelector('.msg');
  ta.focus(); ta.select();
  try { await navigator.clipboard.writeText(ta.value); msg.textContent = 'Copied.'; return; } catch (er) { /* try the older way */ }
  try { if (document.execCommand('copy')) { msg.textContent = 'Copied.'; return; } } catch (er) { /* fall through */ }
  msg.textContent = 'Press Ctrl+C (Cmd+C) to copy the selected text.';
});
function calDownload(o) {
  try {
    const blob = new Blob([icsText(o)], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'receipts-reminder.ics'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    return true;
  } catch (e) { return false; }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cal]'); if (!b) return;
  sfx('next');
  if (b.tagName !== 'BUTTON') return;
  const root = b.closest('.cal-btns'), msg = root && root.nextElementSibling && root.nextElementSibling.classList.contains('cal-msg') ? root.nextElementSibling : null;
  if (!root || !root.__cal) return;
  if (inArtifact()) { if (msg) msg.textContent = ''; calManual(root, root.__cal).querySelector('textarea').focus({ preventScroll: true }); return; }
  const ok = calDownload(root.__cal);
  if (msg) msg.textContent = ok ? 'Saved receipts-reminder.ics. Open it to add the repeating event. If nothing happens, open it from your downloads.' : 'File not created here. Use the copy-text option.';
});

/* ===== subscriptions: tick what you pay and type what each one costs you =====
   The grey line under each name is a typical price, checked in November 2026, in the currency chosen for the page:
   yen shows Japan, pesos show the Philippines, anything else shows US dollars. A service with no local entry falls back to its US line,
   and the line always names the country. It is only a hint: prices differ by plan, and the amount is always typed by the person.
   Columns: id, name, US hint, Japan hint, Philippines hint. A missing entry means "use the US line". */
const SUBS = [
  ['netflix', 'Netflix', '$8.99 with ads, $19.99 Standard, $26.99 Premium', '¥890 with ads, ¥1,590 Standard, ¥2,290 Premium', '₱169 Mobile, ₱279 Basic. Standard and Premium cost more'],
  ['disney', 'Disney+', '$12.49 with ads, $21.49 no ads', '¥1,250 Standard, ¥1,670 Premium', '₱289 Basic, ₱599 Premium'],
  ['hulu', 'Hulu', '$12.49 with ads, $21.49 no ads', '¥1,320', 'Not sold in the Philippines'],
  ['hbo', 'HBO Max', '$10.99 Basic, $18.49 Standard, $22.99 Premium', '¥1,000 Standard, ¥1,400 Premium', '₱149 Mobile, ₱269 Standard, ₱399 Ultimate'],
  ['prime', 'Amazon Prime', '$14.99, or $139 a year', '¥600, or ¥5,900 a year', '₱249 for Prime Video, or ₱1,669 a year'],
  ['appletv', 'Apple TV', '$14.99', '¥1,200'],
  ['paramount', 'Paramount+', '$8.99 Essential, $13.99 Premium', 'Ended in Japan in March 2026'],
  ['youtube', 'YouTube Premium', '$15.99 Individual, $26.99 Family', '¥1,280 Individual, ¥2,280 Family', 'From ₱189 Individual, ₱379 Family'],
  ['spotify', 'Spotify', '$12.99 Individual, $21.99 Family', '¥1,080 Individual, ¥1,880 Family', '₱169 Individual, ₱279 Family'],
  ['applemusic', 'Apple Music', '$11.99 Individual, $19.99 Family', '¥1,180 Individual, ¥1,980 Family', '₱169 Individual'],
  ['chatgpt', 'ChatGPT', '$8 Go, $20 Plus', '¥1,400 Go, ¥3,000 Plus', '₱300 Go, ₱999 Plus'],
  ['claude', 'Claude', '$20 Pro, or $17 a month if paid yearly', '$20 Pro, billed in dollars plus 10% tax, about ¥3,300'],
  ['m365', 'Microsoft 365', '$9.99 Personal, $12.99 Family', '¥2,130 Personal, ¥2,740 Family'],
  ['icloud', 'iCloud+', '$0.99 for 50GB, $2.99 for 200GB, $9.99 for 2TB', '¥180 for 50GB, ¥540 for 200GB, ¥1,800 for 2TB', '₱59 for 50GB, ₱199 for 200GB, ₱699 for 2TB'],
  ['gone', 'Google One', '$1.99 for 100GB, $9.99 for 2TB', '¥290 for 100GB, ¥1,450 for 2TB', '₱119 for 100GB, ₱599 for 2TB'],
  ['xbox', 'Xbox Game Pass', '$9.99 Essential, $14.99 Premium, $22.99 Ultimate', '¥850 Essential, ¥1,300 Premium, ¥1,550 Ultimate', '₱225 PC Game Pass. Ultimate is about ₱1,300'],
  ['psplus', 'PlayStation Plus', '$10.99 Essential, $16.99 Extra, $19.99 Premium', '¥850 Essential, ¥1,300 Extra, ¥1,550 Premium'],
  ['switch', 'Switch Online', '$19.99 a year, or $49.99 with Expansion Pack', '¥3,000 a year, or ¥5,900 with Expansion Pack', 'New in the Philippines in Nov 2026. Check the shop for the price'],
  ['adobe', 'Adobe Creative Cloud', '$19.99 Photography, $54.99 Standard, $69.99 Pro', '¥2,380 Photography, ¥6,480 Standard, ¥9,080 Pro'],
];
/* the grey line for one service, in the page's currency, always naming the country it is for */
const subHint = s => {
  const c = sym(), j = c === '¥', p = c === '₱', loc = j ? s[3] : p ? s[4] : null;
  /* a price line gets the country in front; a plain sentence ("Not sold in ...") already says it */
  return typeof loc === 'string' && loc ? (/^(?:From\s)?[¥₱$]/.test(loc) ? `${j ? 'Japan' : 'Philippines'} ${loc}` : loc) : `US ${s[2]}`;
};
const SUB_MAX_O = 12;
const cents2 = v => Math.round(v * 100) / 100;
const numF = v => { const n = parseFloat(v); return isFinite(n) && n > 0 ? Math.min(n, MAX_AMT) : 0; };
/* what the screen starts from: the ticks, what each costs, and the "something else" lines.
   An older version kept only a total, so that total shows as one line and nothing is lost or counted twice. */
function subsModel(lineTotal) {
  const legacy = !('subP' in S.ui) && !('subO' in S.ui);
  const ids = Array.isArray(S.ui.subs) ? S.ui.subs.filter(id => SUBS.some(s => s[0] === id)) : [];
  const P = S.ui.subP && typeof S.ui.subP === 'object' ? S.ui.subP : {};
  const O = Array.isArray(S.ui.subO) ? S.ui.subO.map(o => ({ n: o.n || '', a: o.a || 0 })) : [];
  if (legacy) return { ids: [], P: {}, O: lineTotal > 0 ? [{ n: 'Subscriptions', a: lineTotal }] : [] };
  const sum = cents2(ids.reduce((x, id) => x + (P[id] || 0), 0) + O.reduce((x, o) => x + o.a, 0));
  /* the plan was changed somewhere else since: keep the difference as its own line */
  if (lineTotal - sum > 0.51 && O.length < SUB_MAX_O) O.push({ n: 'Other', a: cents2(lineTotal - sum) });
  return { ids, P, O };
}
const subsSum = m => cents2(m.ids.reduce((x, id) => x + (m.P[id] || 0), 0) + m.O.reduce((x, o) => x + o.a, 0));
function subsRows(m) {
  return `<div class="tour-chips one subs-list" role="group" aria-label="Subscriptions">${SUBS.map(s => {
    const k = m.ids.indexOf(s[0]) >= 0, a = m.P[s[0]] || '';
    return `<div class="sub-row${k ? ' on' : ''}"><label class="chip multi${k ? ' on' : ''}"><input type="checkbox" name="tourSub" value="${s[0]}"${k ? ' checked' : ''}><b>${esc(s[1])}</b><span>${esc(subHint(s))}</span></label>
      <div class="sub-amt"${k ? '' : ' hidden'}><div class="inp sm"><span class="yen cs"></span><input type="number" inputmode="decimal" min="0" step="any" data-subamt="${s[0]}" aria-label="${esc(s[1])}, monthly cost" placeholder="Monthly cost" value="${a}"></div></div></div>`;
  }).join('')}</div>`;
}
const subOtherRow = (o, i) => `<div class="sub-o" data-so="${i}">
  <div class="field"><label for="soN${i}">Name</label><div class="inp sm"><input id="soN${i}" class="so-n" type="text" maxlength="30" spellcheck="false" placeholder="Name" value="${esc(o.n)}"></div></div>
  <div class="field"><label for="soA${i}">Monthly</label><div class="inp sm"><span class="yen cs"></span><input id="soA${i}" class="so-a" type="number" inputmode="decimal" min="0" step="any" placeholder="Amount" value="${o.a > 0 ? o.a : ''}"></div></div>
  <button type="button" class="so-x" data-sox="${i}">Remove</button></div>`;
const subsReadO = () => $$('#subsOthers .sub-o').map(r => ({ n: cleanSubName($('.so-n', r).value), a: cents2(numF($('.so-a', r).value)) }));
function subsPaintO(arr, focusLast) {
  const w = $('#subsOthers'); if (!w) return;
  w.innerHTML = arr.map(subOtherRow).join('');
  $$('#subsOthers .cs').forEach(e => { e.textContent = sym(); }); moneyUpAll(w);
  const b = $('#subsAddO'); if (b) { b.textContent = arr.length ? 'Add another' : 'Add something else'; b.hidden = arr.length >= SUB_MAX_O; }
  if (focusLast && arr.length) { const n = $$('#subsOthers .so-n').pop(); if (n) n.focus(); }
  subsRecalc();
}
/* ticked ones and the lines under "something else" add up into the total */
function subsRecalc() {
  const am = $('#tourAmt'); if (!am) return;
  let t = 0;
  $$('#tourBody input[name=tourSub]:checked').forEach(c => { const i = $(`#tourBody input[data-subamt="${c.value}"]`); if (i) t += numF(i.value); });
  $$('#subsOthers .so-a').forEach(i => { t += numF(i.value); });
  t = cents2(t); am.value = t > 0 ? t : '';
}
function subsLeave() {
  const ids = [], P = {};
  $$('#tourBody input[name=tourSub]:checked').forEach(c => { ids.push(c.value); const i = $(`#tourBody input[data-subamt="${c.value}"]`), a = i ? numF(i.value) : 0; if (a > 0) P[c.value] = cents2(a); });
  const O = subsReadO().filter(o => o.n || o.a > 0).slice(0, SUB_MAX_O);
  S.ui.subs = ids;
  if (Object.keys(P).length) S.ui.subP = P; else delete S.ui.subP;
  if (O.length) S.ui.subO = O; else delete S.ui.subO;
}

/* ===== the credit card line: what the statement says, minus the bills already counted ===== */
function cardModel(saved) {
  let t = S.ui.cardT || 0, b = S.ui.cardB || 0;
  /* the calculator is shown again only while it agrees with the saved amount (or nothing was saved yet) */
  if (saved > 0 && Math.abs(saved - Math.max(0, t - b)) >= 0.5) { t = saved; b = 0; }
  return { t, b };
}
function cardRecalc() {
  const t = inum('tourCardT'), b = inum('tourCardB'), cap = $('#cardCap'), use = $('#cardUse'); if (!cap || !use) return;
  const r = cents2(Math.max(0, t - b));
  cap.textContent = t > 0 ? (b >= t ? 'The listed bills cover the whole statement: nothing extra to count.' : `Card spending: ${fmt(r)} a month.`) : '';
  use.hidden = !(t > 0); use.textContent = r > 0 ? `Use ${fmt(r)}` : 'Use 0';
}
function cardUse() {
  const am = $('#tourAmt'); if (!am) return;
  const r = cents2(Math.max(0, inum('tourCardT') - inum('tourCardB'))); am.value = r > 0 ? r : ''; tourTouched = true; sfx('tap'); autosave();
}
function cardLeave(d) {
  const t = inum('tourCardT'), b = inum('tourCardB'), am = $('#tourAmt');
  /* only on a real move (Next or Back), never on the autosave while typing: the box must not freeze a half-typed total */
  if (d && am && am.value === '' && t > 0) { const r = cents2(Math.max(0, t - b)); am.value = r > 0 ? r : ''; }
  if (t > 0) S.ui.cardT = cents2(t); else delete S.ui.cardT;
  if (b > 0) S.ui.cardB = cents2(b); else delete S.ui.cardB;
}

/* ===== loans: each month or total amount ===== */
const loanOf = id => (S.ui.loans && S.ui.loans[id]) || {};
const noteOf = l => (l.note ? localize(l.note) : '');
let loanDriver = 'month';
function loanBody(l) {
  const lo = loanOf(l.id), swOn = lo.m === 'total', monthly = val(S, l.key, START), n = loanPayments(l.ends);
  const tot = lo.t || (monthly > 0 && n > 0 ? loanTotalFrom(monthly, n) : '');
  loanDriver = swOn ? 'total' : 'month';
  return `<p>${LOAN_NOTE}</p>
  <div class="loan-top"><div class="loan-tg${swOn ? ' tot' : ''}" id="loanTg"><span class="lt${swOn ? '' : ' on'}" data-lt="month">Monthly</span>
    <button type="button" class="sw" id="loanSw" role="switch" aria-checked="${swOn}" aria-label="Enter total instead of monthly amount"><i></i></button>
    <span class="lt${swOn ? ' on' : ''}" data-lt="total">Total</span></div></div>
  <div class="tour-fields loan-fields ${swOn ? 'm-tot' : 'm-month'}" id="loanFields">
    <div class="lf" data-lf="name">${textField('tourLName', 'Name', l.name)}</div>
    <div class="lf" data-lf="month">${moneyField('tourAmt', 'Monthly', monthly)}</div>
    <div class="lf" data-lf="total">${moneyField('tourTot', 'Total left', tot)}</div>
    <div class="lf"><div class="field"><label for="tourEnds">Last payment</label><div class="selbox"><select id="tourEnds">${monthOptions(l.ends)}</select></div></div></div>
    <p class="cap" id="loanCalc"></p>
  </div>`;
}
const LOAN_NOTE = 'Enter the monthly payment, or switch and enter the total left. Set the last payment month and the other value is filled in.';
function loanSync() {
  const am = $('#tourAmt'), to = $('#tourTot'), en = $('#tourEnds'), cap = $('#loanCalc'); if (!am || !to || !en || !cap) return;
  const n = loanPayments(en.value), plural = n === 1 ? '' : 's';
  if (loanDriver === 'month') {
    const m = num0(am.value);
    if (n > 0) to.value = m > 0 ? loanTotalFrom(m, n) : '';
    cap.innerHTML = !(m > 0) ? '' : n > 0 ? `${n} payment${plural}, <b>${fmt(loanTotalFrom(m, n))}</b> in all.` : 'Set the last payment month to get the total.';
  } else {
    const t = num0(to.value);
    if (n > 0) { const m = loanMonthlyFrom(t, n); am.value = t > 0 ? m : ''; cap.innerHTML = t > 0 ? `${n} payment${plural} of about <b>${fmt(m)}</b>${m * n !== t ? ', last one slightly smaller' : ''}.` : ''; }
    else cap.innerHTML = t > 0 ? 'Set the last payment month to get the monthly amount.' : '';
  }
}
function loanSetMode(mode, fx) {
  const sw = $('#loanSw'), tg = $('#loanTg'), f = $('#loanFields'); if (!sw || !tg || !f) return;
  const on = mode === 'total';
  if (loanDriver === mode && sw.getAttribute('aria-checked') === String(on)) return;
  sw.setAttribute('aria-checked', String(on)); tg.classList.toggle('tot', on); f.classList.toggle('m-tot', on); f.classList.toggle('m-month', !on);
  $$('.lt', tg).forEach(b => b.classList.toggle('on', b.dataset.lt === mode));
  loanDriver = mode;
  if (fx) {
    sfx('thunk'); sfx('sparkle');
    tg.classList.remove('zap'); void tg.offsetWidth; tg.classList.add('zap'); setTimeout(() => tg.classList.remove('zap'), 900);
    const r = sw.getBoundingClientRect(), h = tg.getBoundingClientRect();
    sparkBurst(tg, r.left - h.left + r.width / 2, r.top - h.top + r.height / 2, 18, 70);
  }
  const inp = $(on ? '#tourTot' : '#tourAmt'); if (inp) inp.focus({ preventScroll: true });
  loanSync();
}
function loanLeave(l) {
  const sw = $('#loanSw'); if (!sw) return;
  const m = inum('tourAmt'), t = inum('tourTot'), tot = sw.getAttribute('aria-checked') === 'true';
  setVal(S, l.key, START, m, 'after');
  const en = $('#tourEnds'); if (en) updateLine(S, l.id, { ends: en.value });
  const nm = $('#tourLName'); if (nm && nm.value.trim()) updateLine(S, l.id, { name: nm.value });
  const loans = Object.assign({}, S.ui.loans), ent = {}; if (tot) ent.m = 'total'; if (t > 0) ent.t = t;
  if (Object.keys(ent).length) loans[l.id] = ent; else delete loans[l.id];
  if (Object.keys(loans).length) S.ui.loans = loans; else delete S.ui.loans;
}

/* ===== adding another one of the same thing ===== */
const MORE_KINDS = { loan: { add: 'Add another loan or debt', name: 'Loan or debt', title: 'Next loan or debt payment' }, ins: { add: 'Add another insurance', name: 'Insurance', title: 'Next insurance' } };
const moreKind = id => (S.ui.more && S.ui.more[id]) || null;
function addAnotherBill(kind, afterId) {
  if (!MORE_KINDS[kind] || !lineById(S, kind)) return null;
  const n = Object.keys(S.ui.more || {}).filter(k => S.ui.more[k] === kind && lineById(S, k)).length + 2;
  const id = addLine(S, 'nec', `${MORE_KINDS[kind].name} ${n}`, 0); if (!id) return null;
  const ls = S.plan.lines, i = ls.findIndex(l => l.id === id), j = ls.findIndex(l => l.id === afterId);
  if (i >= 0 && j >= 0 && i !== j + 1) { const x = ls.splice(i, 1)[0]; ls.splice(j + (j < i ? 1 : 0), 0, x); }
  S.ui.more = Object.assign({}, S.ui.more, { [id]: kind }); persist();
  return id;
}
const GOAL_NOUN = { travel: 'trip', moving: 'home or move', buy: 'purchase', car: 'yearly cost', other: 'goal' };
const goalKindOf = id => GOAL_KINDS.find(x => x.id === id) || GOAL_KINDS.find(x => x.k === (S.ui.gk || {})[id]) || null;
function addAnotherGoal(fromId) {
  const k = goalKindOf(fromId); if (!k || k.em || S.plan.goals.length >= MAX_GOALS) return null;
  const same = S.plan.goals.filter(g => { const kk = goalKindOf(g.id); return kk && kk.k === k.k; }).length + 1;
  const id = addGoal(S, `${k.name} ${same}`); if (!id) return null;
  const gs = S.plan.goals, i = gs.findIndex(g => g.id === id), j = gs.findIndex(g => g.id === fromId);
  if (i >= 0 && j >= 0 && i !== j + 1) { const x = gs.splice(i, 1)[0]; gs.splice(j + (j < i ? 1 : 0), 0, x); }
  S.ui.gk = Object.assign({}, S.ui.gk, { [id]: k.k }); S.ui.gset = true; persist();
  return id;
}

/* ===== the split sliders: each one moves on its own =====
   Shares of one pot: the five jars share what the bills leave, the goals share the goal jar. A slider changes only its own share.
   What is not given out waits as "unassigned" (the hatched end of the pot and the line under it); a slider pushed past what is
   unassigned stops there. Spread it shares the unassigned part by the current shares; Give it to puts all of it in one. */
const SPF = { jar: { last: -1, from: 0, hit: false, t: 0 }, goal: { last: -1, from: 0, hit: false, t: 0 } };
function spTouch(kind, vals, i, repaint) {
  const f = SPF[kind]; if (f.last !== i) f.from = vals[i]; f.last = i; clearTimeout(f.t);
  f.t = setTimeout(() => { f.last = -1; f.hit = false; repaint(); }, 2600);
}
function spWhy(kind, names, vals, total, moneyOf) {
  const f = SPF[kind], free = total - sumOf(vals), m = f.last;
  if (m >= 0 && f.hit && vals[m] === f.from) return `<b>${esc(names[m])}</b> can only take what is unassigned, and nothing is. Lower another one first.`;
  if (m >= 0 && vals[m] !== f.from) { const d = vals[m] - f.from; return `<b>${esc(names[m])}</b> ${d > 0 ? '+' : '−'}${Math.abs(d)}%${f.hit ? ': all that was unassigned. To go further, lower another one.' : `. Unassigned now <b>${free}%</b>${free > 0 ? ` (${moneyOf(free)})` : ''}.`}`; }
  return `Each slider moves on its own. Lower one and the difference waits as unassigned; raise one and it takes from there. Shares total <b>${total}%</b>.`;
}
const PENCIL = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.6 3.4a1.8 1.8 0 0 1 2.6 2.6L7.4 14.8 4 15.6l.8-3.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const pctPill = (attr, i, label, max) => `<label class="pctp"><input type="number" inputmode="numeric" min="0" max="${max}" step="1" data-${attr}="${i}" aria-label="${esc(label)}, percent of pay"><b>%</b>${PENCIL}</label>`;
/* paint one list of shares; "kind" is jar or goal */
function spPaint(kind, o) {
  const f = SPF[kind], act = document.activeElement, free = o.total - sumOf(o.vals);
  o.vals.forEach((v, i) => {
    const row = $(o.row(i)); if (!row) return;
    const pi = $('.pctp input', row); if (pi && pi !== act) pi.value = v; else if (pi && +pi.value !== v && pi.value !== '') pi.value = v;
    const r = $('.rng input', row); if (r) { r.value = v; r.style.setProperty('--p', (o.total > 0 ? v / o.total * 100 : 0) + '%'); }
    const m = $('.split-m', row); if (m) m.textContent = o.money(i);
    const s = $('.split-s', row); if (s && o.note) s.textContent = o.note(i);
    const d = $('.dlt', row);
    if (d) { const x = f.last === i ? v - f.from : 0; d.textContent = x ? (x > 0 ? '+' : '−') + Math.abs(x) + '%' : ''; d.className = 'dlt' + (x > 0 ? ' up' : x < 0 ? ' down' : ''); }
    row.classList.toggle('moved', f.last === i && v !== f.from);
  });
  const pot = $(o.pot); if (pot) { $$('i', pot).forEach((seg, i) => { seg.style.flexGrow = Math.max(i < o.vals.length ? o.vals[i] : free, 0.0001); }); }
  const pool = $(o.pool);
  if (pool) { pool.classList.toggle('has', free > 0); $('.pool-t', pool).innerHTML = free > 0 ? `Unassigned <b>${free}%</b> · ${o.moneyOf(free)}` : 'All of it is given out.'; }
  const why = $(o.why); if (why) why.innerHTML = spWhy(kind, o.names, o.vals, o.total, o.moneyOf);
}
/* a short bump on the share that moved, a flash on the pool line, and a few leaves from the thumb being dragged */
function spFlash(o, before, after, moved, fromRange) {
  const row = $(o.row(moved)); if (!row) return;
  const bump = $('.pctp', row); if (bump && after[moved] !== before[moved]) { bump.classList.remove('bump'); void bump.offsetWidth; bump.classList.add('bump'); }
  const pool = $(o.pool); if (pool && after[moved] !== before[moved]) { pool.classList.remove('flash'); void pool.offsetWidth; pool.classList.add('flash'); }
  if (fromRange && after[moved] !== before[moved]) {
    const r = $('.rng input', row), host = $('.rng', row); if (!r || !host) return;
    const now = Date.now(); if (now - (spFlash.t || 0) < 70) return; spFlash.t = now;
    const w = host.getBoundingClientRect().width, fr = (+r.max > 0 ? after[moved] / +r.max : 0);
    sparkBurst(host, 14 + fr * (w - 28), 22, 3, 34);
  }
}
const SPLIT_SPEC = {
  jar: () => ({ row: i => `[data-jrow="${i}"]`, vals: jarVals, total: jarRest, money: i => fmt(jarMoney(i)) + ' a month', moneyOf: pct => fmt(jarMoneyOf(pct)), pot: '#jarPot', pool: '#jarPool', why: '#jarWhy', names: JAR5.map(j => JAR_LABEL[j]) }),
  goal: () => ({ row: i => `[data-grow="${i}"]`, vals: gsPct, total: 100, money: i => fmt(splitMoney(i)) + ' a month', moneyOf: pct => fmt(gsMoneyOf(pct)), note: i => splitNoteFor(i), pot: '#goalPot', pool: '#goalPool', why: '#splitWhy', names: S.plan.goals.map(g => g.name) }),
};
const spSet = (kind, next) => { if (kind === 'jar') jarVals = next; else gsPct = next; if (kind === 'jar') paintJars(); else paintSplit(); };
function splitApply(kind, i, p, fromRange) {
  const o = SPLIT_SPEC[kind](), before = o.vals.slice(), mv = moveShare(before, i, p, o.total);
  spTouch(kind, before, i, () => (kind === 'jar' ? paintJars() : paintSplit()));
  SPF[kind].hit = mv.hit;
  spSet(kind, mv.out);
  spFlash(SPLIT_SPEC[kind](), before, mv.out, i, fromRange);
  if (mv.hit && mv.out[i] === before[i]) { if (fromRange) sfx('thunk'); return; }
  if (fromRange) sfx('tick', o.total > 0 ? mv.out[i] / o.total * 100 : 0); else sfx('type');
}
/* the unassigned part: spread it by the current shares, or give all of it to one share */
function splitSpread(kind) { const o = SPLIT_SPEC[kind](); if (o.total - sumOf(o.vals) <= 0) return; SPF[kind].last = -1; spSet(kind, spreadFree(o.vals, o.total)); sfx('whoosh'); autosave(); }
function splitGive(kind, i) { const o = SPLIT_SPEC[kind](), free = o.total - sumOf(o.vals); if (!(free > 0) || !(i >= 0 && i < o.vals.length)) return; const before = o.vals.slice(), next = before.slice(); next[i] += free; spTouch(kind, before, i, () => (kind === 'jar' ? paintJars() : paintSplit())); SPF[kind].hit = false; spSet(kind, next); spFlash(SPLIT_SPEC[kind](), before, next, i, false); sfx('coin'); autosave(); }

/* one line per jar, for the fold on the split screen */
const JAR_LINES = {
  nec: 'Bills and essentials. Paid first.', lts: 'Saved now, spent later.', play: 'Spend freely. No guilt.',
  edu: 'Books, courses, skills.', ffa: 'Invested. Not spent.', give: 'Gifts and donations.',
};

/* ===== subscriptions: ticking opens that one's amount box ===== */
function subsToggle(t) {
  const row = t.closest('.sub-row'), box = row && $('.sub-amt', row), inp = row && $('input[data-subamt]', row);
  if (!row) return;
  row.classList.toggle('on', t.checked); t.closest('.chip').classList.toggle('on', t.checked);
  if (box) box.hidden = !t.checked;
  sfx(t.checked ? 'on' : 'off');
  subsRecalc();
  if (t.checked && inp) inp.focus();
}

/* ===== one place for what the setup screens do on typing, tapping and picking ===== */
function tourExtraInput(e) {
  const t = e.target, d = t.dataset || {};
  if (d.jar !== undefined) { splitApply('jar', +d.jar, +t.value, true); return true; }
  if (d.split !== undefined) { splitApply('goal', +d.split, +t.value, true); return true; }
  if (d.jpct !== undefined) { if (t.value !== '') splitApply('jar', +d.jpct, +t.value, false); return true; }
  if (d.gpct !== undefined) { if (t.value !== '') splitApply('goal', +d.gpct, +t.value, false); return true; }
  if (t.id === 'tourAmt' && $('#loanSw')) { loanDriver = 'month'; loanSync(); return true; }
  if (t.id === 'tourTot') { loanDriver = 'total'; loanSync(); return true; }
  if (d.subamt !== undefined || t.classList.contains('so-a')) { subsRecalc(); return true; }
  if (t.classList.contains('so-n')) return true;
  if (t.id === 'tourCardT' || t.id === 'tourCardB') { cardRecalc(); return true; }
  return false;
}
function tourExtraChange(e) {
  const t = e.target, d = t.dataset || {};
  if (t.id === 'tourEnds' && $('#loanSw')) { loanSync(); return true; }
  if (d.give !== undefined) { if (t.value !== '') { splitGive(d.give, +t.value); t.value = ''; } return true; }
  if (d.jpct !== undefined) { paintJars(); return true; }
  if (d.gpct !== undefined) { paintSplit(); return true; }
  if (t.name === 'tourSub') { subsToggle(t); return true; }
  return false;
}
function tourExtraClick(e) {
  const el = e.target;
  const sw = el.closest('#loanSw'), lt = el.closest('.lt');
  if (sw) { loanSetMode(sw.getAttribute('aria-checked') === 'true' ? 'month' : 'total', true); return true; }
  if (lt) { loanSetMode(lt.dataset.lt, true); return true; }
  if (el.closest('#cardUse')) { cardUse(); return true; }
  if (el.closest('#subsAddO')) { const arr = subsReadO(); if (arr.length < SUB_MAX_O) { arr.push({ n: '', a: 0 }); sfx('pop'); subsPaintO(arr, true); autosave(); } return true; }
  const sx = el.closest('.so-x');
  if (sx) { const arr = subsReadO(); arr.splice(+sx.dataset.sox, 1); sfx('off'); subsPaintO(arr); const ab = $('#subsAddO'); if (ab && !ab.hidden) ab.focus(); autosave(); return true; }
  const mb = el.closest('[data-more]');
  if (mb) {
    autosave(true); const cur = TS[tourN], from = cur && cur.id.indexOf('bill-') === 0 ? cur.id.slice(5) : mb.dataset.more;
    const id = addAnotherBill(mb.dataset.more, from); if (id) { sfx('pop'); gotoStep('bill-' + id); }
    return true;
  }
  const mg = el.closest('[data-moreg]');
  if (mg) { autosave(true); const id = addAnotherGoal(mg.dataset.moreg); if (id) { sfx('pop'); gotoStep('goal-' + id); } return true; }
  const sp = el.closest('[data-spread]'); if (sp) { splitSpread(sp.dataset.spread); return true; }
  if (el.closest('#jarReset')) { jarVals = lr(JAR5.map(j => JARS.find(x => x.id === j).usual), jarRest); SPF.jar.last = -1; SPF.jar.hit = false; paintJars(); sfx('whoosh'); autosave(); return true; }
  if (el.closest('#splitReset')) { S.plan.goals.forEach(g => forgetKey(S, 'goal:' + g.id)); splitInit(); SPF.goal.last = -1; SPF.goal.hit = false; paintSplit(); sfx('whoosh'); autosave(); return true; }
  return false;
}
