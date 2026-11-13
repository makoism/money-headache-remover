/* ---------- the sounds of the world ----------
   A quiet bed under everything, different in every realm (a waterfall and wind in the Fairy Woods, low resonant drones and glass in
   Crystal Deep, a deep pressure hum and bubbles under the sea, wind and small birds in the Green, cicadas, wind chimes, a far train and
   cats in Chiba, slow pads in the Dreaming), little events scattered over it, and the voice of everything you tap. Built from noise and plain oscillators through the same output as every other sound, so the
   volume slider and the mute switch rule it. It starts only after the first tap (browsers insist), ducks while the scroll is open
   so the words stay calm, and stops while the tab is hidden. */
const AMBI = (() => {
  let armed = false, ctx = null, bed = null, bedGain = null, realm = 'wood', mood = 'day', level = 1, evT = 0, running = false, nb = null, nodes = [];
  const muted = () => (typeof SFX !== 'undefined' ? SFX.muted() : true);
  const get = () => { const c = armed && typeof SFX !== 'undefined' ? SFX.ctx() : null; if (!c) return null; ctx = c; return c; };
  const out = () => (typeof SFX !== 'undefined' ? SFX.out() : null);
  const noise = c => { if (nb) return nb; const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; l = l * .97 + w * .03; d[i] = w * .6 + l * 6; } nb = b; return b; };
  const pan = (c, x) => { if (!c.createStereoPanner) return null; const p = c.createStereoPanner(); p.pan.value = Math.max(-.9, Math.min(.9, (x - .5) * 1.8)); return p; };
  /* a tone with an envelope, gliding from f0 to f1 */
  function tone(o) {
    const c = get(), dst = out(); if (!c || !dst || muted()) return; const t0 = c.currentTime + (o.at || 0) + .01, osc = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(), p = pan(c, o.x == null ? .5 : o.x);
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f0, t0); if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur);
    lp.type = 'lowpass'; lp.frequency.value = o.lp || 6000; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime((o.vol || .1) * level2(), t0 + (o.atk || .01)); g.gain.exponentialRampToValueAtTime(.0001, t0 + o.dur);
    osc.connect(lp); lp.connect(g); if (p) { g.connect(p); p.connect(dst); } else g.connect(dst);
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.f0 * .04; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + o.dur + .05); }
    osc.start(t0); osc.stop(t0 + o.dur + .05);
  }
  function burst(o) {
    const c = get(), dst = out(); if (!c || !dst || muted()) return; const t0 = c.currentTime + (o.at || 0) + .01, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), p = pan(c, o.x == null ? .5 : o.x);
    s.buffer = noise(c); s.loop = true; f.type = o.ft || 'bandpass'; f.frequency.value = o.f; f.Q.value = o.q || 1; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime((o.vol || .1) * level2(), t0 + (o.atk || .005)); g.gain.exponentialRampToValueAtTime(.0001, t0 + o.dur);
    s.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(dst); } else g.connect(dst); s.start(t0, Math.random()); s.stop(t0 + o.dur + .05);
  }
  const level2 = () => 1;
  const PENTA = [0, 2, 4, 7, 9];
  const note = (k, base) => (base || 440) * Math.pow(2, (PENTA[k % 5] + 12 * Math.floor(k / 5)) / 12);
  /* the voices: what each thing says when it speaks or is tapped */
  const V = {
    squeak: (x, v) => { tone({ f0: 1900, f1: 2700, dur: .09, vol: .09 * v, x, atk: .004 }); tone({ f0: 2100, f1: 3000, dur: .07, vol: .06 * v, x, at: .1 }); },
    ribbit: (x, v) => { tone({ f0: 170, f1: 120, dur: .09, vol: .16 * v, type: 'square', lp: 700, x }); tone({ f0: 190, f1: 130, dur: .1, vol: .14 * v, type: 'square', lp: 700, x, at: .11 }); },
    hoot: (x, v) => { tone({ f0: 360, f1: 320, dur: .34, vol: .13 * v, x, atk: .06 }); tone({ f0: 330, f1: 280, dur: .5, vol: .13 * v, x, at: .45, atk: .06 }); },
    chitter: (x, v) => { for (let i = 0; i < 6; i++) tone({ f0: 2300 + i * 80, f1: 1800, dur: .035, vol: .06 * v, x, at: i * .05, type: 'square', lp: 4000 }); },
    caw: (x, v) => { tone({ f0: 440, f1: 300, dur: .26, vol: .1 * v, type: 'sawtooth', lp: 1400, x, atk: .02 }); },
    yip: (x, v) => { tone({ f0: 700, f1: 1100, dur: .1, vol: .1 * v, x }); tone({ f0: 1100, f1: 800, dur: .12, vol: .1 * v, x, at: .1 }); },
    crackle: (x, v) => { for (let i = 0; i < 5; i++) burst({ f: 2500 + Math.random() * 2500, q: 2, dur: .03, vol: .1 * v, x, at: i * .045 + Math.random() * .03, ft: 'highpass' }); },
    bloop: (x, v) => { tone({ f0: 280, f1: 760, dur: .13, vol: .14 * v, x, atk: .01 }); },
    chime: (x, v, k) => { const f0 = note(k == null ? Math.floor(Math.random() * 7) : k, 523); tone({ f0, dur: 1.3, vol: .11 * v, x, atk: .004 }); tone({ f0: f0 * 2.01, dur: .7, vol: .04 * v, x, atk: .004 }); tone({ f0: f0 * 3.02, dur: .35, vol: .02 * v, x, atk: .004 }); },
    flutter: (x, v) => { for (let i = 0; i < 4; i++) burst({ f: 3200, q: 3, dur: .07, vol: .06 * v, x, at: i * .08 }); },
    buzz: (x, v) => { tone({ f0: 200, f1: 230, dur: .4, vol: .06 * v, type: 'sawtooth', lp: 1200, x, vib: 38 }); },
    chirp: (x, v) => { for (let i = 0; i < 3; i++) tone({ f0: 3000 + i * 300, f1: 4200 + i * 200, dur: .07, vol: .07 * v, x, at: i * .1, atk: .005 }); },
    snuffle: (x, v) => { burst({ f: 700, q: .8, dur: .2, vol: .1 * v, x, ft: 'lowpass' }); burst({ f: 900, q: .8, dur: .16, vol: .08 * v, x, at: .24, ft: 'lowpass' }); },
    splash: (x, v) => { burst({ f: 1500, q: .6, dur: .26, vol: .12 * v, x, ft: 'lowpass' }); tone({ f0: 500, f1: 180, dur: .12, vol: .08 * v, x }); },
    knock: (x, v) => { for (let i = 0; i < 2; i++) { tone({ f0: 170, f1: 110, dur: .08, vol: .2 * v, x, at: i * .14 }); burst({ f: 900, q: 3, dur: .03, vol: .1 * v, x, at: i * .14 }); } },
    rustle: (x, v) => { burst({ f: 2500, q: .9, dur: .2, vol: .1 * v, x, atk: .03 }); },
    meow: (x, v) => { tone({ f0: 620, f1: 980, dur: .16, vol: .09 * v, x, atk: .03, lp: 3000, vib: 6 }); tone({ f0: 980, f1: 520, dur: .26, vol: .09 * v, x, at: .16, atk: .01, lp: 2600 }); },
    purr: (x, v) => { tone({ f0: 38, dur: .9, vol: .12 * v, x, atk: .2, type: 'sawtooth', lp: 220, vib: 22 }); },
    jingle: (x, v) => { for (let i = 0; i < 4; i++) tone({ f0: 1800 + i * 330 + Math.random() * 90, dur: .9, vol: .035 * v, x, at: i * .09, atk: .003 }); },
    hum: (x, v, k) => { const f0 = note(k == null ? Math.floor(Math.random() * 5) : k, 196); tone({ f0, dur: 1.8, vol: .07 * v, x, atk: .5, vib: 4.5 }); tone({ f0: f0 * 1.5, dur: 1.5, vol: .03 * v, x, atk: .6, vib: 3.2 }); },
    gong: (x, v) => { tone({ f0: 110, dur: 3.2, vol: .09 * v, x, atk: .01 }); tone({ f0: 221, dur: 2.2, vol: .05 * v, x, atk: .01 }); tone({ f0: 333, dur: 1.4, vol: .03 * v, x, atk: .01 }); },
    whale: (x, v) => { tone({ f0: 90, f1: 150, dur: 2.4, vol: .06 * v, x, atk: .8, vib: 3 }); tone({ f0: 150, f1: 70, dur: 2.4, vol: .05 * v, x, at: 2.2, atk: .6 }); },
    glass: (x, v, k) => { const f0 = note(k == null ? Math.floor(Math.random() * 7) : k, 880); tone({ f0, dur: 2, vol: .06 * v, x, atk: .002 }); tone({ f0: f0 * 2.76, dur: 1, vol: .025 * v, x, atk: .002 }); tone({ f0: f0 * 5.4, dur: .5, vol: .012 * v, x, atk: .002 }); },
    train: (x, v) => { tone({ f0: 330, f1: 310, dur: 1.4, vol: .035 * v, x, atk: .5, type: 'sawtooth', lp: 900 }); tone({ f0: 415, f1: 390, dur: 1.4, vol: .03 * v, x, atk: .5, type: 'sawtooth', lp: 900 }); },
    sparkle: (x, v) => { for (let i = 0; i < 4; i++) tone({ f0: note(i + 3, 660), dur: .5, vol: .05 * v, x, at: i * .07, atk: .004 }); },
  };
  function sound(n, x, v, k) { if (muted() || !V[n]) return; if (ctx && ctx.state === 'suspended') return; V[n](x == null ? .5 : x, v == null ? 1 : v, k); }

  /* the bed: a waterfall that never stops, wind that comes and goes, and each realm's air */
  function startBed() {
    const c = get(), dst = out(); if (!c || !dst || bed || c.state !== 'running') return;
    bed = c.createGain(); bed.gain.value = 0; bed.connect(dst); nodes = [];
    const mk = (type, f, q, vol, lfo) => { const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(bed); s.start(0, Math.random()); nodes.push(s);
      if (lfo) { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = lfo; og.gain.value = vol * .7; o.connect(og); og.connect(g.gain); o.start(); nodes.push(o); } return { fl, g }; };
    const R = realm, osc = (f, vol, lfo, type, lf) => { const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = vol; if (lfo) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfo; lg.gain.value = vol * (lf || .5); l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l); } o.connect(g); g.connect(bed); o.start(); nodes.push(o); };
    if (R === 'wood') { mk('bandpass', 900, .5, .05); mk('lowpass', 300, .3, .08); mk('highpass', 3000, .6, .006); mk('bandpass', 420, .9, .028, .09); }
    else if (R === 'crystal') { mk('lowpass', 220, .4, .07, .05); mk('bandpass', 1900, 3, .006, .07); osc(55, .035, .08); osc(82.4, .02, .11); osc(110, .012, .06); }
    else if (R === 'sea') { mk('lowpass', 260, .3, .1, .06); mk('bandpass', 600, .8, .02, .13); mk('highpass', 5000, .5, .004, .21); osc(49, .04, .05); osc(73.4, .02, .07); }
    else if (R === 'shire') { mk('bandpass', 420, .9, .035, .08); mk('highpass', 3200, .6, .005, .12); mk('bandpass', 1500, 1.2, .004, .17); osc(98, .008, .09); }
    else if (R === 'rune') { mk('bandpass', 700, .6, .04, .08); mk('lowpass', 260, .3, .06, .05); mk('highpass', 3500, .5, .008, .2); osc(73.4, .02, .07); osc(110, .01, .1); }
    else if (R === 'grove') { mk('bandpass', 500, .9, .035, .08); mk('highpass', 3200, .6, .005, .12); mk('bandpass', 1500, 1.2, .004, .17); osc(110, .008, .09); }
    else if (R === 'hollow') { mk('lowpass', 220, .3, .06, .04); mk('bandpass', 2100, 5, .006, .6); mk('highpass', 4200, .8, .004, 1.3); osc(98, .012, .06); }
    else if (R === 'frost') { mk('bandpass', 300, .5, .05, .06); mk('highpass', 4500, .5, .006, .08); osc(130.8, .01, .05); osc(196, .006, .08); }
    else if (R === 'chiba') { mk('bandpass', 380, .8, .03, .07); mk('bandpass', 4300, 6, .012, .31); mk('bandpass', 5200, 7, .008, .23); mk('lowpass', 160, .3, .05, .04); }
    else { mk('lowpass', 400, .4, .05, .04); osc(65.4, .03, .06); osc(98, .02, .08); osc(130.8, .014, .05); osc(196, .008, .07); }
    bed.gain.setTargetAtTime(.9 * level, c.currentTime, 1.4);
    running = true; schedule();
  }
  function stopBed() {
    const c = ctx; if (!bed || !c) { running = false; clearTimeout(evT); return; } const b = bed, ns = nodes; bed = null; nodes = []; running = false; clearTimeout(evT);
    try { b.gain.setTargetAtTime(0, c.currentTime, .3); } catch (e) { /* closed */ } setTimeout(() => { ns.forEach(n => { try { n.stop(); } catch (e) { /* done */ } }); try { b.disconnect(); } catch (e) { /* done */ } }, 1200);
  }
  /* little events over the bed, different for each realm and each time of day */
  function schedule() {
    clearTimeout(evT); if (!running) return;
    evT = setTimeout(() => { if (!muted() && !document.hidden && ctx && ctx.state === 'running') event(); schedule(); }, 1400 + Math.random() * 3600);
  }
  function event() {
    const x = Math.random(), night = mood === 'night', R = realm, p = Math.random(), v = level;
    if (R === 'wood') { if (night) { if (p < .65) for (let i = 0; i < 3; i++) tone({ f0: 4300, dur: .05, vol: .018 * v, x, at: i * .07, type: 'square', lp: 5000 }); else V.hoot(x, .5 * v); } else { if (p < .5) V.chirp(x, .6 * v); else if (p < .75) V.chirp(x, .4 * v); else V.rustle(x, .5 * v); } }
    else if (R === 'crystal') { if (p < .45) V.glass(x, .6 * v); else if (p < .75) V.hum(x, .5 * v); else if (p < .9) V.chime(x, .3 * v); else V.gong(x, .3 * v); }
    else if (R === 'sea') { if (p < .4) V.bloop(x, .5 * v); else if (p < .7) V.hum(x, .6 * v); else if (p < .9) V.glass(x, .35 * v); else V.whale(x, .5 * v); }
    else if (R === 'shire') { if (night) { if (p < .6) for (let i = 0; i < 4; i++) tone({ f0: 4300, dur: .05, vol: .016 * v, x, at: i * .08, type: 'square', lp: 5000 }); else V.hoot(x, .4 * v); } else if (p < .4) V.chirp(x, .6 * v); else if (p < .65) V.chirp(x, .4 * v); else if (p < .85) V.chime(x, .25 * v); else V.buzz(x, .3 * v); }
    else if (R === 'rune') { if (night && p < .3) V.hoot(x, .5 * v); else if (p < .6) V.glass(x, .4 * v); else if (p < .85) V.chime(x, .35 * v); else V.hum(x, .5 * v); }
    else if (R === 'grove') { if (night) { if (p < .5) V.hoot(x, .4 * v); else V.chime(x, .25 * v); } else if (p < .5) V.chirp(x, .6 * v); else if (p < .8) V.chirp(x, .4 * v); else V.chime(x, .25 * v); }
    else if (R === 'hollow') { if (p < .4) V.hum(x, .45 * v); else if (p < .7) V.chime(x, .3 * v); else if (p < .85) V.bloop(x, .3 * v); else V.hoot(x, .3 * v); }
    else if (R === 'frost') { if (p < .45) V.glass(x, .45 * v); else if (p < .7) V.chime(x, .3 * v); else if (p < .85) V.hum(x, .4 * v); else V.hoot(x, .35 * v); }
    else if (R === 'chiba') { if (p < .3) V.meow(x, .6 * v); else if (p < .45) V.purr(x, .5 * v); else if (p < .62) V.jingle(x, .7 * v); else if (p < .74) V.caw(x, .35 * v); else if (p < .82) V.train(x, .5 * v); else if (p < .92) V.meow(x, .4 * v); else V.rustle(x, .5 * v); }
    else { V.chime(x, .4 * v); }
  }
  function sync() {
    const c = get(); const want = !muted() && !document.hidden && document.body.classList.contains('scene-on') && !!c;
    if (want && !running && c.state === 'running') startBed(); else if (!want && running) stopBed();
  }
  /* the scroll is open: the world turns down so the words stay calm */
  function duck(open) { level = open ? .38 : 1; if (bed && ctx) bed.gain.setTargetAtTime(.9 * level, ctx.currentTime, .5); }
  function setRealm(r, m) { const ch = r !== realm; realm = r; mood = m; if (ch && running) { stopBed(); setTimeout(sync, 1400); } }
  const wake = () => { armed = true; const c = get(); if (c && c.state === 'suspended' && !muted()) { try { c.resume(); } catch (e) { /* later */ } } setTimeout(sync, 200); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive: true }));
  setInterval(sync, 1500); document.addEventListener('visibilitychange', () => setTimeout(sync, 100));
  return { sound, sync, duck, setRealm, V, running: () => running };
})();
