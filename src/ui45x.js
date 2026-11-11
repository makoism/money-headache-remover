/* ---------- the fun parts of the guided setup ----------
   Sound effects (all made in the browser, no audio files), the subscriptions list, the loan toggle with its goblin,
   the shrine of the six jars, and the helpers that make the sliders easy to understand. */

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
  /* a voice: a buzzing wave shaped by two vowel filters, so "heh" and "ha" sound like a small throat */
  const voice = (c, out, o) => {
    const t = o.t, osc = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), mix = c.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(o.f, t); osc.frequency.linearRampToValueAtTime(o.f2 || o.f, t + o.dur);
    lfo.frequency.value = o.vib || 28; lg.gain.value = o.vd || 10; lfo.connect(lg); lg.connect(osc.frequency);
    f1.type = 'bandpass'; f1.frequency.value = o.a1 || 700; f1.Q.value = 5; f2.type = 'bandpass'; f2.frequency.value = o.a2 || 1700; f2.Q.value = 7; mix.gain.value = 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .5, t + .012); g.gain.setValueAtTime(o.vol || .5, t + Math.max(.014, o.dur - .035)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(f1); osc.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g); g.connect(out);
    osc.start(t); lfo.start(t); osc.stop(t + o.dur + .03); lfo.stop(t + o.dur + .03);
    if (!o.nobreath) noise(c, out, { t: t - .02 > 0 ? t - .02 : t, dur: .035, f0: 3500, ft: 'highpass', q: .5, vol: .012, atk: .005 });
  };
  /* ----- the sound design: deep, soft air, like wind going past in the next room. No beeps, no bells. -----
     Every sound is low-passed noise sweeping up (forward) or down (back), with a very quiet low hum under the bigger ones.
     The page keeps the whole thing well under a normal system sound. */
  const air = (c, o, t, p) => noise(c, o, { t, dur: p.dur, f0: p.f0, f1: p.f1, ft: 'lowpass', q: p.q || .7, vol: p.vol, atk: p.atk || .1 });
  const hum = (c, o, t, p) => tone(c, o, { t, f: p.f, f2: p.f2, dur: p.dur, vol: p.vol, atk: p.atk || .12 });
  /* ----- the click family: pressing a button, flipping a switch. Very short, quiet, but clear and snappy:
     a tiny dry tick (a few thousandths of a second of band-passed noise) with a small knock tone under it.
     It goes to its own brighter output (see SFX below), because the soft low-pass that suits the whooshes would smear it. ----- */
  const click = (c, o, t, p) => {
    noise(c, o, { t, dur: .02, f0: p.f, ft: 'bandpass', q: 1.4, vol: p.vol, atk: .0015 });
    tone(c, o, { t, f: p.k, f2: p.k2, dur: .055, vol: p.kv, atk: .002 });
  };
  d.tap = (c, o, t) => click(c, o, t, { f: 2400, k: 820, k2: 560, vol: .42, kv: .1 });
  d.on = (c, o, t) => click(c, o, t, { f: 3000, k: 700, k2: 1000, vol: .4, kv: .1 });
  d.off = (c, o, t) => click(c, o, t, { f: 1900, k: 760, k2: 480, vol: .36, kv: .09 });
  d.next = (c, o, t) => { air(c, o, t, { dur: .46, f0: 240, f1: 760, vol: .32, atk: .14 }); hum(c, o, t, { f: 82, f2: 110, dur: .46, vol: .08 }); };
  d.back = (c, o, t) => air(c, o, t, { dur: .34, f0: 640, f1: 230, vol: .26, atk: .05 });
  d.type = (c, o, t) => air(c, o, t, { dur: .05, f0: 700, f1: 500, vol: .14, atk: .008 });
  d.tick = (c, o, t, v) => air(c, o, t, { dur: .06, f0: 330 + Math.max(0, Math.min(100, +v || 0)) * 3, f1: 280, vol: .19, atk: .012 });
  d.whoosh = (c, o, t) => { air(c, o, t, { dur: .56, f0: 200, f1: 620, vol: .3, atk: .18 }); hum(c, o, t, { f: 70, f2: 94, dur: .56, vol: .07, atk: .18 }); };
  /* an entry was saved: one clear forward whoosh with a soft low thump landing under it */
  d.coin = (c, o, t) => { air(c, o, t, { dur: .5, f0: 260, f1: 820, vol: .24, atk: .15 }); hum(c, o, t + .16, { f: 104, f2: 66, dur: .26, vol: .1, atk: .03 }); };
  d.pop = (c, o, t) => { air(c, o, t, { dur: .2, f0: 300, f1: 640, vol: .24, atk: .05 }); hum(c, o, t, { f: 130, f2: 180, dur: .2, vol: .04, atk: .05 }); };
  d.thunk = (c, o, t) => { hum(c, o, t, { f: 120, f2: 64, dur: .24, vol: .22, atk: .012 }); air(c, o, t, { dur: .1, f0: 340, f1: 240, vol: .14, atk: .01 }); };
  /* a bigger step (a streak, a goal quarter): longer, a little higher, still only air */
  d.sparkle = (c, o, t) => { air(c, o, t, { dur: .72, f0: 280, f1: 1100, vol: .36, atk: .26 }); hum(c, o, t, { f: 92, f2: 140, dur: .72, vol: .09, atk: .26 }); };
  /* the biggest moments (setup done, goal funded, a badge): a slow low swell that opens up and settles */
  d.fanfare = (c, o, t) => {
    air(c, o, t, { dur: 1.2, f0: 190, f1: 1000, vol: .5, atk: .5 });
    hum(c, o, t, { f: 62, f2: 92, dur: 1.2, vol: .2, atk: .5 });
    hum(c, o, t + .12, { f: 110, f2: 123, dur: 1.0, vol: .08, atk: .45 });
    hum(c, o, t + .12, { f: 165, f2: 185, dur: 1.0, vol: .045, atk: .45 });
  };
  d.soft = (c, o, t) => { air(c, o, t, { dur: .3, f0: 210, f1: 380, vol: .2, atk: .08 }); hum(c, o, t, { f: 116, f2: 134, dur: .3, vol: .035, atk: .08 }); };
  /* "heh heh heh heh heee": four quick breaths, each a little higher, ending on a squeak (kept quiet) */
  d.giggle = (c, o, t) => {
    for (let k = 0; k < 4; k++) voice(c, o, { t: t + k * .125, f: 300 + k * 26, f2: 270 + k * 26, dur: .075, vol: .1, a1: 650, a2: 1750, vib: 30, vd: 9 });
    voice(c, o, { t: t + .55, f: 420, f2: 640, dur: .2, vol: .09, a1: 380, a2: 2200, vib: 22, vd: 14 });
  };
  /* "mwah ha ha ha haaa": a low start, then slower falling laughs (kept quiet) */
  d.laugh = (c, o, t) => {
    voice(c, o, { t, f: 200, f2: 150, dur: .26, vol: .11, a1: 520, a2: 1100, vib: 12, vd: 7 });
    [[.34, 235, 190], [.55, 215, 170], [.76, 195, 150]].forEach(p => voice(c, o, { t: t + p[0], f: p[1], f2: p[2], dur: .13, vol: .1, a1: 800, a2: 1250, vib: 26, vd: 8 }));
    voice(c, o, { t: t + .98, f: 185, f2: 110, dur: .34, vol: .1, a1: 780, a2: 1200, vib: 14, vd: 9 });
  };
  /* the whoosh family (moving between pages, saving, finishing) is a little quieter than before */
  const trim = (f, k) => (c, o, t, a) => { const g = c.createGain(); g.gain.value = k; g.connect(o); f(c, g, t, a); };
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

/* ===== a little confetti of stars, for sliders and switches ===== */
const STAR_COLORS = ['#ffd84a', '#ff7ac6', '#7ad7ff', '#9cff7a', '#c59bff', '#ffb36b'];
function sparkBurst(host, x, y, n, spread) {
  if (!host) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'), a = Math.random() * Math.PI * 2, r = (spread || 46) * (.45 + Math.random() * .75);
    s.className = 'spk'; s.setAttribute('aria-hidden', 'true');
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r - 10)}px;--s:${(.6 + Math.random() * .9).toFixed(2)};--c:${STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0]};--d:${Math.round(Math.random() * 90)}ms;--r:${Math.round(Math.random() * 180 - 90)}deg`;
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
  if (Math.abs(saved - Math.max(0, t - b)) >= 0.5) { t = saved; b = 0; }
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
function cardLeave() {
  const t = inum('tourCardT'), b = inum('tourCardB'), am = $('#tourAmt');
  if (am && am.value === '' && t > 0) { const r = cents2(Math.max(0, t - b)); am.value = r > 0 ? r : ''; }
  if (t > 0) S.ui.cardT = cents2(t); else delete S.ui.cardT;
  if (b > 0) S.ui.cardB = cents2(b); else delete S.ui.cardB;
}

/* ===== the goblin ===== */
function goblinSVG() {
  return `<div class="gob" id="gob" aria-hidden="true"><span class="gob-bub">Hm</span>
  <svg viewBox="0 0 130 112" width="130" height="112" focusable="false">
    <defs><linearGradient id="gbSk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd36b"/><stop offset="1" stop-color="#5fa84a"/></linearGradient>
    <linearGradient id="gbCl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a4a8c"/><stop offset="1" stop-color="#3a2f63"/></linearGradient></defs>
    <path class="gb-hump" d="M4 112 C0 70 14 34 46 28 C64 25 76 38 80 54 L82 112 Z" fill="url(#gbCl)"/>
    <path d="M18 70 C26 52 38 44 52 42" fill="none" stroke="#7a68b4" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>
    <path d="M20 92 C28 80 40 76 52 78" fill="none" stroke="#7a68b4" stroke-width="2.5" stroke-linecap="round" opacity=".4"/>
    <g class="gb-head">
      <path d="M62 44 L24 26 L58 66 Z" fill="#6fb552"/><path d="M58 47 L33 33 L56 62 Z" fill="#e7a39b"/>
      <path d="M102 42 L128 24 L106 66 Z" fill="#6fb552"/><path d="M103 47 L120 32 L106 61 Z" fill="#e7a39b"/>
      <ellipse cx="84" cy="52" rx="26" ry="24" fill="url(#gbSk)"/>
      <path d="M62 38 C70 30 96 28 106 40" fill="none" stroke="#4d9238" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <path class="gb-nose" d="M86 50 C106 50 122 60 116 74 C112 82 100 80 96 70 C92 66 88 62 86 58 Z" fill="#86cd63"/>
      <path d="M96 72 C104 78 112 76 114 70" fill="none" stroke="#4d9238" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="104" cy="70" rx="2.6" ry="1.9" fill="#3d7a2c"/>
      <g class="gb-eyes"><path d="M66 46 C71 41 80 41 83 46 C78 49 70 50 66 46 Z" fill="#fff6b0"/><path d="M89 44 C93 39 102 40 104 45 C100 48 93 49 89 44 Z" fill="#fff6b0"/>
        <circle class="gb-p" cx="79" cy="45.5" r="2.7" fill="#1d1630"/><circle class="gb-p" cx="100.5" cy="44.6" r="2.7" fill="#1d1630"/></g>
      <path d="M64 43 C71 38 80 38 84 44" fill="none" stroke="#3d7a2c" stroke-width="3.4" stroke-linecap="round"/><path d="M89 41 C94 36 103 37 106 43" fill="none" stroke="#3d7a2c" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M62 31 L70 38" stroke="#3d7a2c" stroke-width="3" stroke-linecap="round" opacity="0"/>
      <path class="gb-mouth" d="M68 64 C80 80 100 78 108 62 C96 70 80 70 68 64 Z" fill="#3b1a2e"/>
      <path d="M74 66 L77 72 L80 67 Z" fill="#fff"/><path d="M90 68 L93 74 L96 67 Z" fill="#fff"/><path d="M82 69 L84 73 L86 69 Z" fill="#fff" opacity=".9"/>
    </g>
    <g class="gb-hands" fill="#78c156" stroke="#4d9238" stroke-width="1.2">
      <rect x="46" y="96" width="9" height="16" rx="4.5"/><rect x="56" y="93" width="9" height="19" rx="4.5"/><rect x="66" y="96" width="9" height="16" rx="4.5"/>
      <rect x="92" y="96" width="9" height="16" rx="4.5"/><rect x="102" y="93" width="9" height="19" rx="4.5"/><rect x="112" y="96" width="9" height="16" rx="4.5"/>
    </g>
  </svg></div>`;
}
let gobN = 0, gobT = 0;
function gobReact() {
  const g = $('#gob'); if (!g) return;
  gobN++;
  const laugh = gobN % 2 === 0, bub = $('.gob-bub', g), say = laugh ? ['Ha', 'Ha ha'] : ['Hm', 'Heh', 'Ha'];
  if (bub) bub.textContent = say[((gobN / 2) | 0) % say.length];
  g.classList.remove('pop', 'lol'); void g.offsetWidth; g.classList.add('pop'); if (laugh) g.classList.add('lol');
  sfx(laugh ? 'laugh' : 'giggle');
  clearTimeout(gobT); gobT = setTimeout(() => { g.classList.remove('pop', 'lol'); }, laugh ? 1800 : 1400);
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
    <span class="lt${swOn ? ' on' : ''}" data-lt="total">Total</span></div>${goblinSVG()}</div>
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
    gobReact();
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

/* ===== sliders that explain themselves ===== */
const SPF = { jar: { base: null, last: -1, t: 0 }, goal: { base: null, last: -1, t: 0 } };
function spTouch(kind, vals, i, repaint) {
  const f = SPF[kind]; if (!f.base) f.base = vals.slice(); f.last = i; clearTimeout(f.t);
  f.t = setTimeout(() => { f.base = null; f.last = -1; repaint(); }, 2600);
}
const spDeltas = (kind, vals) => { const f = SPF[kind]; return f.base ? vals.map((v, k) => v - (f.base[k] || 0)) : vals.map(() => 0); };
function spWhy(kind, names, vals, total) {
  const f = SPF[kind], ds = spDeltas(kind, vals), m = f.last;
  if (!f.base || m < 0 || !ds[m]) return `Shares always total <b>${total}%</b>. Raise one and the others shrink; lower one and the others grow.`;
  const others = ds.map((x, k) => [k, x]).filter(p => p[0] !== m && p[1] !== 0).map(p => `${esc(names[p[0]])} ${p[1] > 0 ? '+' : '−'}${Math.abs(p[1])}%`).join(', ');
  return ds[m] > 0 ? `<b>${esc(names[m])}</b> +${ds[m]}%. Others adjusted${others ? ': ' + others : ''}.`
    : `<b>${esc(names[m])}</b> −${-ds[m]}%. Others adjusted${others ? ': ' + others : ''}.`;
}
const PENCIL = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.6 3.4a1.8 1.8 0 0 1 2.6 2.6L7.4 14.8 4 15.6l.8-3.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const pctPill = (attr, i, label, max) => `<label class="pctp"><input type="number" inputmode="numeric" min="0" max="${max}" step="1" data-${attr}="${i}" aria-label="${esc(label)}, percent of pay"><b>%</b>${PENCIL}</label>`;
/* paint one list of shares; "kind" is jar or goal */
function spPaint(kind, o) {
  const ds = spDeltas(kind, o.vals), f = SPF[kind], act = document.activeElement;
  o.vals.forEach((v, i) => {
    const row = $(o.row(i)); if (!row) return;
    const pi = $('.pctp input', row); if (pi && pi !== act) pi.value = v; else if (pi && +pi.value !== v && pi.value !== '') pi.value = v;
    const r = $('.rng input', row); if (r) { r.value = v; r.style.setProperty('--p', (o.total > 0 ? v / o.total * 100 : 0) + '%'); }
    const m = $('.split-m', row); if (m) m.textContent = o.money(i);
    const s = $('.split-s', row); if (s && o.note) s.textContent = o.note(i);
    const d = $('.dlt', row);
    if (d) { const x = ds[i]; d.textContent = x ? (x > 0 ? '+' : '−') + Math.abs(x) + '%' : ''; d.className = 'dlt' + (x > 0 ? ' up' : x < 0 ? ' down' : ''); }
    row.classList.toggle('moved', f.last === i && !!f.base);
  });
  const pot = $(o.pot); if (pot) $$('i', pot).forEach((seg, i) => { seg.style.flexGrow = Math.max(o.vals[i], 0.0001); });
  const why = $(o.why); if (why) why.innerHTML = spWhy(kind, o.names, o.vals, o.total);
}
/* a short flash on every share that changed, and a few stars from the thumb that is being dragged */
function spFlash(o, before, after, moved, fromRange) {
  after.forEach((v, i) => {
    const row = $(o.row(i)); if (!row || i === moved || v === before[i]) return;
    row.classList.remove('gain', 'lose'); void row.offsetWidth; row.classList.add(v > before[i] ? 'gain' : 'lose');
  });
  const row = $(o.row(moved)); if (!row) return;
  const bump = $('.pctp', row); if (bump) { bump.classList.remove('bump'); void bump.offsetWidth; bump.classList.add('bump'); }
  if (fromRange) {
    const r = $('.rng input', row), host = $('.rng', row); if (!r || !host) return;
    const now = Date.now(); if (now - (spFlash.t || 0) < 70) return; spFlash.t = now;
    const w = host.getBoundingClientRect().width, fr = (+r.max > 0 ? after[moved] / +r.max : 0);
    sparkBurst(host, 14 + fr * (w - 28), 22, 3, 34);
  }
}
const SPLIT_SPEC = {
  jar: () => ({ row: i => `[data-jrow="${i}"]`, vals: jarVals, total: jarRest, money: i => fmt(jarMoney(i)) + ' a month', pot: '#jarPot', why: '#jarWhy', names: JAR5.map(j => JAR_LABEL[j]) }),
  goal: () => ({ row: i => `[data-grow="${i}"]`, vals: gsPct, total: 100, money: i => fmt(splitMoney(i)) + ' a month', note: i => splitNoteFor(i), pot: '#goalPot', why: '#splitWhy', names: S.plan.goals.map(g => g.name) }),
};
function splitApply(kind, i, p, fromRange) {
  const o = SPLIT_SPEC[kind](), before = o.vals.slice(), next = rebalance(before, i, p, o.total);
  spTouch(kind, before, i, () => (kind === 'jar' ? paintJars() : paintSplit()));
  if (kind === 'jar') jarVals = next; else gsPct = next;
  if (kind === 'jar') paintJars(); else paintSplit();
  spFlash(SPLIT_SPEC[kind](), before, next, i, fromRange);
  if (fromRange) sfx('tick', o.total > 0 ? next[i] / o.total * 100 : 0); else sfx('type');
}

/* ===== the shrine ===== */
const SHRINE_FILE = '';   /* put a picture file name here (next to the page) to show it in place of the drawn shrine */
const SHRINE_LINES = {
  nec: 'Bills and essentials. Paid first.', lts: 'Saved now, spent later.', play: 'Spend freely. No guilt.',
  edu: 'Books, courses, skills.', ffa: 'Invested. Not spent.', give: 'Gifts and donations.',
};
const SHRINE_SHORT = { nec: 'NEEDS', lts: 'SAVE', play: 'PLAY', edu: 'LEARN', ffa: 'FREEDOM', give: 'GIVE' };
function shrineJar(j, i, x, y) {
  const c = JARVAR[j.id], cl = `shj${i}`;
  return `<g class="shr-jar" data-sj="${i}" role="button" tabindex="0" aria-label="${esc(j.name)} jar" transform="translate(${x} ${y})">
    <circle class="shr-halo" cx="40" cy="62" r="54" fill="url(#shHalo)" style="--c:${c}"/>
    <g class="shr-rays" opacity=".55">${[0, 30, 60, 90, 120, 150].map(a => `<rect x="39" y="-14" width="2" height="152" fill="${c}" transform="rotate(${a} 40 62)" opacity=".55"/>`).join('')}</g>
    <clipPath id="${cl}"><path d="M14 28 H66 V34 C74 38 78 46 78 58 V96 C78 106 72 112 62 112 H18 C8 112 2 106 2 96 V58 C2 46 6 38 14 34 Z"/></clipPath>
    <path d="M14 28 H66 V34 C74 38 78 46 78 58 V96 C78 106 72 112 62 112 H18 C8 112 2 106 2 96 V58 C2 46 6 38 14 34 Z" fill="#ffffff" fill-opacity=".14" stroke="#fff" stroke-width="2.4"/>
    <g clip-path="url(#${cl})"><rect x="0" y="48" width="80" height="70" fill="${c}"/>
      <g filter="url(#shMelt)"><rect x="0" y="48" width="80" height="70" fill="url(#shLiq)" opacity=".85"/>
        <use href="#dog" x="${4 + (i % 3) * 4}" y="52" width="26" height="26" opacity=".85" transform="rotate(${-12 + i * 9} 20 66)"/>
        <use href="#dog" x="40" y="70" width="30" height="30" opacity=".8" transform="rotate(${14 - i * 7} 55 85)"/>
        <use href="#eye" x="8" y="86" width="24" height="16" opacity=".9"/><use href="#eye" x="46" y="52" width="20" height="14" opacity=".85"/></g></g>
    <path d="M10 40 C8 56 8 74 10 92" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <rect x="9" y="12" width="62" height="18" rx="5" fill="url(#shGold)" stroke="#7a4b00" stroke-width="1.6"/><path d="M14 18 H66" stroke="#fff" stroke-width="1.6" opacity=".6"/>
    <rect x="14" y="64" width="52" height="22" rx="4" fill="#fffbe6" stroke="#2b1a4a" stroke-width="1.5"/><text x="40" y="79.5" text-anchor="middle" class="shr-lbl">${SHRINE_SHORT[j.id]}</text>
    <g class="shr-flame" transform="translate(40 128)"><path d="M0 -14 C6 -6 5 0 0 3 C-5 0 -6 -6 0 -14 Z" fill="#ffd84a"/><path d="M0 -8 C3 -4 2.5 -1 0 1 C-2.5 -1 -3 -4 0 -8 Z" fill="#ff7a3a"/></g>
    <ellipse cx="40" cy="132" rx="30" ry="5" fill="#2b1a4a" opacity=".5"/>
  </g>`;
}
function shrineArt() {
  if (SHRINE_FILE && /^[\w.-]+\.(jpg|png|webp)$/.test(SHRINE_FILE)) return `<div class="shr"><img class="shr-img" src="${esc(SHRINE_FILE)}" alt="The six jars"></div>`;
  const dogs = [[18, 20, 40, -10], [120, 8, 30, 14], [250, 28, 44, 8], [320, 4, 32, -16], [70, 150, 36, 20], [196, 160, 30, -8], [302, 150, 40, 12], [10, 290, 34, 6], [150, 300, 42, -14], [290, 296, 32, 18]];
  return `<div class="shr" id="shrine"><svg viewBox="0 0 360 330" role="img" aria-label="The six jars">
  <defs>
    <radialGradient id="shBg" cx=".5" cy=".5" r=".2" spreadMethod="repeat"><stop offset="0" stop-color="#ff2fa8"/><stop offset=".25" stop-color="#ffb000"/><stop offset=".5" stop-color="#19e6a6"/><stop offset=".75" stop-color="#3a5bff"/><stop offset="1" stop-color="#ff2fa8"/></radialGradient>
    <radialGradient id="shHalo"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="shLiq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#ff7ac6" stop-opacity=".35"/><stop offset="1" stop-color="#7ad7ff" stop-opacity=".5"/></linearGradient>
    <linearGradient id="shGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".5" stop-color="#e0a020"/><stop offset="1" stop-color="#9a5f00"/></linearGradient>
    <filter id="shWarp" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".011 .018" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="shMelt" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="turbulence" baseFrequency=".05 .09" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
    <symbol id="dog" viewBox="0 0 40 40"><ellipse cx="8" cy="18" rx="6" ry="11" fill="#6b3b1e"/><ellipse cx="32" cy="18" rx="6" ry="11" fill="#6b3b1e"/><ellipse cx="20" cy="20" rx="13" ry="14" fill="#d9a066"/><circle cx="14.5" cy="16" r="4" fill="#fff"/><circle cx="25.5" cy="16" r="4" fill="#fff"/><circle cx="15.2" cy="16.4" r="2.1" fill="#1b0f2e"/><circle cx="25" cy="16.4" r="2.1" fill="#1b0f2e"/><ellipse cx="20" cy="26" rx="7" ry="5.4" fill="#f3d3a6"/><ellipse cx="20" cy="23.4" rx="3.2" ry="2.2" fill="#1b0f2e"/><path d="M20 25.6 V28 M16 28.4 Q20 31.5 24 28.4" fill="none" stroke="#1b0f2e" stroke-width="1.1" stroke-linecap="round"/><path d="M17.4 29.6 Q20 35 22.6 29.6 Z" fill="#ff6f91"/></symbol>
    <symbol id="eye" viewBox="0 0 30 20"><path d="M1 10 C7 1 23 1 29 10 C23 19 7 19 1 10 Z" fill="#fff" stroke="#2b1a4a" stroke-width="1.4"/><circle cx="15" cy="10" r="6.2" fill="#19a7ff"/><circle cx="15" cy="10" r="3.2" fill="#12062b"/><circle cx="17" cy="8" r="1.3" fill="#fff"/></symbol>
  </defs>
  <g class="shr-bg"><g filter="url(#shWarp)"><rect x="-40" y="-40" width="440" height="410" fill="url(#shBg)"/>
    ${dogs.map(d => `<use href="#dog" x="${d[0]}" y="${d[1]}" width="${d[2]}" height="${d[2]}" opacity=".6" transform="rotate(${d[3]} ${d[0] + d[2] / 2} ${d[1] + d[2] / 2})"/>`).join('')}</g></g>
  <rect x="8" y="170" width="344" height="8" rx="4" fill="#2b1a4a" opacity=".55"/>
  <rect x="0" y="0" width="360" height="330" fill="none" stroke="#2b1a4a" stroke-width="6" rx="14"/>
  ${JARS.map((j, i) => shrineJar(j, i, 12 + (i % 3) * 112, i < 3 ? 22 : 178)).join('')}
  <text x="180" y="22" text-anchor="middle" class="shr-meme">THE SIX JARS</text>
  </svg></div>`;
}
function shrineBody() {
  return `<p>Based on T. Harv Eker&rsquo;s jar system.</p>
  ${shrineArt()}
  <ul class="shr-list">${JARS.map((j, i) => `<li data-sj="${i}"><i class="dot" style="--c:${JARVAR[j.id]}"></i><span><b>${esc(j.name)}</b> ${esc(SHRINE_LINES[j.id])}</span></li>`).join('')}</ul>
  <p class="cap">Source: Secrets of the Millionaire Mind. Fan page, not affiliated with him.</p>`;
}
function shrinePoke(i) {
  const g = $(`.shr-jar[data-sj="${i}"]`), host = $('#shrine'); sfx(i % 2 ? 'coin' : 'pop');
  if (g && host) { g.classList.remove('poke'); void g.getBoundingClientRect(); g.classList.add('poke'); const r = g.getBoundingClientRect(), h = host.getBoundingClientRect(); sparkBurst(host, r.left - h.left + r.width / 2, r.top - h.top + r.height / 2, 10, 50); }
  $$('.shr-list li').forEach(li => li.classList.toggle('lit', +li.dataset.sj === i));
}

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
  if (el.closest('#gob')) { gobReact(); return true; }
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
  if (el.closest('#jarReset')) { jarVals = lr(JAR5.map(j => JARS.find(x => x.id === j).usual), jarRest); SPF.jar.base = null; SPF.jar.last = -1; paintJars(); sfx('whoosh'); autosave(); return true; }
  if (el.closest('#splitReset')) { S.plan.goals.forEach(g => forgetKey(S, 'goal:' + g.id)); splitInit(); paintSplit(); sfx('whoosh'); autosave(); return true; }
  const sj = el.closest('.shr-jar, .shr-list li'); if (sj) { shrinePoke(+sj.dataset.sj); return true; }
  return false;
}
