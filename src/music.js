
/* ---------- music for the setup ----------
   A quiet, slow, original piece in the spirit of Japanese environmental music, made in the browser while the guided setup is open:
   a soft pad that changes chord every so often, a sparse melody of bell-like notes with echoes, wind far off and the odd water drop.
   Nothing is recorded or downloaded, and no two listens are the same. Browsers allow sound only after a tap, so it starts on the first
   tap inside the setup, goes quiet while the hello video plays, fades out when the setup closes, and Music on/off (top of the setup,
   or Settings) switches it off on this device. Sound off silences it too. */
const MUSIC = (() => {
  const ROOT = 174.61;                                   /* F3; everything is tuned from here */
  const DEG = [0, 2, 4, 7, 9, 11];                       /* F G A C D E: the major pentatonic plus the seventh */
  /* chord voicings in semitones from the root: Fmaj7, Dm7, Cadd9, Bbmaj7, Am7 */
  const CHORDS = [[0, 4, 7, 11], [-3, 0, 4, 7], [-5, -1, 2, 9], [-7, -3, 0, 4], [-8, -1, 2, 4]];
  const LEVEL = .45;                                      /* the whole piece sits well under the sound effects */
  const hz = st => ROOT * Math.pow(2, st / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* the graph: bus (fades) -> gentle low-pass -> out. Melody and drops also feed two echoes that feed back through a low-pass. */
  function build(c, out) {
    const bus = c.createGain(); bus.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; lp.Q.value = .3;
    bus.connect(lp); lp.connect(out);
    const echo = c.createGain(); echo.gain.value = .55;
    [[.52, .36], [.79, .27]].forEach(([time, fb]) => {
      const d = c.createDelay(2), g = c.createGain(), f = c.createBiquadFilter();
      d.delayTime.value = time; g.gain.value = fb; f.type = 'lowpass'; f.frequency.value = 1700;
      echo.connect(d); d.connect(f); f.connect(g); g.connect(d); d.connect(bus);
    });
    /* wind far off: a loop of noise through a low-pass that drifts, with a slow swell */
    const len = Math.floor(c.sampleRate * 4), nb = c.createBuffer(1, len, c.sampleRate), ch = nb.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const wind = c.createBufferSource(), wf = c.createBiquadFilter(), wg = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), lfo2 = c.createOscillator(), lg2 = c.createGain();
    wind.buffer = nb; wind.loop = true; wf.type = 'lowpass'; wf.frequency.value = 380; wf.Q.value = .6; wg.gain.value = .016;
    lfo.frequency.value = .04; lg.gain.value = 150; lfo.connect(lg); lg.connect(wf.frequency);
    lfo2.frequency.value = .023; lg2.gain.value = .007; lfo2.connect(lg2); lg2.connect(wg.gain);
    wind.connect(wf); wf.connect(wg); wg.connect(bus);
    const nodes = [wind, lfo, lfo2]; nodes.forEach(n => n.start());
    const st = { c, bus, echo, nodes, pad: [], chord: 0, nextChord: 0, nextNote: 0, nextDrop: 0, idx: 7, on: true };
    return st;
  }
  /* one pad voice: two slightly detuned waves through a soft low-pass, slow in, slow out */
  const PAD = .011, ATK = 2.8, REL = 4;
  function padVoice(st, f, t) {
    const c = st.c, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 640;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(PAD, t + ATK);
    g.connect(lp); lp.connect(st.bus);
    const oscs = [-5, 5].map(cents => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = cents; o.connect(g); o.start(t); return o; });
    /* the level at any moment is known from the envelope itself, so a release can start from the right value (also in the offline check) */
    const at = t2 => (t2 >= t + ATK ? PAD : 0.0001 * Math.pow(PAD / 0.0001, Math.max(0, t2 - t) / ATK));
    return { g, oscs, release: t2 => { g.gain.cancelScheduledValues(t2); g.gain.setValueAtTime(at(t2), t2); g.gain.exponentialRampToValueAtTime(0.0001, t2 + REL); oscs.forEach(o => o.stop(t2 + REL + .2)); } };
  }
  function changeChord(st, t) {
    let k; do { k = Math.floor(Math.random() * CHORDS.length); } while (k === st.chord && CHORDS.length > 1);
    st.chord = k; st.pad.forEach(v => v.release(t)); st.pad = CHORDS[k].map(s => padVoice(st, hz(s), t));
    st.nextChord = t + rnd(9, 15);
  }
  /* a bell-like note: a sine with a touch of octave and twelfth that fade sooner, into the room and the echoes */
  function bell(st, f, t, v) {
    const c = st.c, parts = [[1, 1, rnd(2.2, 3.6)], [2, .22, .7], [3, .07, .3]];
    parts.forEach(([m, a, d]) => {
      const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * a, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(st.bus); g.connect(st.echo); o.start(t); o.stop(t + d + .05);
    });
  }
  function drop(st, t) {
    const c = st.c, o = c.createOscillator(), g = c.createGain(), f0 = rnd(800, 1300);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.9, t + .07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.03, t + .003); g.gain.exponentialRampToValueAtTime(0.0001, t + .08);
    o.connect(g); g.connect(st.bus); g.connect(st.echo); o.start(t); o.stop(t + .12);
  }
  /* the melody walks the scale a step or two at a time and mostly lands on a note of the chord */
  function nextNote(st, t) {
    let i = st.idx + pick([-2, -1, -1, 1, 1, 2, 3, -3]);
    if (i < 2) i = 2 + Math.floor(Math.random() * 3); if (i > 15) i = 15 - Math.floor(Math.random() * 3);
    const chordPcs = CHORDS[st.chord].map(s => ((s % 12) + 12) % 12);
    const pc = j => DEG[((j % 6) + 6) % 6];
    if (Math.random() < .65 && chordPcs.indexOf(pc(i)) < 0) { for (const dlt of [1, -1, 2, -2]) { if (i + dlt >= 2 && i + dlt <= 15 && chordPcs.indexOf(pc(i + dlt)) >= 0) { i += dlt; break; } } }
    st.idx = i;
    const f = hz(12 + DEG[i % 6] + 12 * Math.floor(i / 6)), v = rnd(.035, .08);
    bell(st, f, t, v);
    if (Math.random() < .2) { const j = Math.max(2, Math.min(15, i + pick([-1, 1, 2]))); bell(st, hz(12 + DEG[j % 6] + 12 * Math.floor(j / 6)), t + rnd(.35, .6), v * .75); }
    st.nextNote = t + (Math.random() < .3 ? rnd(1.1, 2) : rnd(2.2, 5));
  }
  /* schedule everything that falls before `until` */
  function step(st, until) {
    if (!st.nextChord) { st.nextChord = st.c.currentTime + .05; st.nextNote = st.nextChord + rnd(1.5, 3); st.nextDrop = st.nextChord + rnd(6, 12); }
    while (st.nextChord < until) changeChord(st, st.nextChord);
    while (st.nextNote < until) nextNote(st, st.nextNote);
    while (st.nextDrop < until) { drop(st, st.nextDrop); st.nextDrop += rnd(8, 18); }
  }
  function tearDown(st, t) {
    st.pad.forEach(v => v.release(t)); st.pad = [];
    st.nodes.forEach(n => { try { n.stop(t + 4.5); } catch (e) { /* already stopped */ } });
    setTimeout(() => { try { st.bus.disconnect(); } catch (e) { /* gone */ } }, 5000);
  }

  /* ----- the live player ----- */
  let st = null, timer = 0, level = 0;
  const allowed = () => !!(S && S.ui) && !S.ui.mute && S.ui.music !== false;
  const videoPlaying = () => { const v = $('#tourVid'); return !!v && !v.paused && !v.ended; };
  function tick() {
    if (!st) return;
    const c = st.c, now = c.currentTime;
    step(st, now + .6);
    const want = videoPlaying() ? 0 : 1;
    if (want !== level) { level = want; st.bus.gain.cancelScheduledValues(now); st.bus.gain.setValueAtTime(st.bus.gain.value, now); st.bus.gain.linearRampToValueAtTime(want * LEVEL, now + (want ? 3 : 1)); }
  }
  let waking = false;
  function start() {
    if (st || !allowed() || !tourIsOpen) return;
    const c = SFX.ctx(); if (!c) return;
    if (c.state !== 'running') {                      /* before the first tap the browser keeps it suspended; resume and come back */
      if (waking) return; waking = true;
      try { c.resume().then(() => { waking = false; if (c.state === 'running') start(); }, () => { waking = false; }); } catch (e) { waking = false; }
      return;
    }
    try { st = build(c, c.destination); } catch (e) { st = null; return; }
    level = 0; tick(); timer = setInterval(tick, 250);
  }
  function stop(quick) {
    if (!st) return;
    clearInterval(timer); timer = 0;
    const s = st, now = s.c.currentTime; st = null;
    s.bus.gain.cancelScheduledValues(now); s.bus.gain.setValueAtTime(s.bus.gain.value, now); s.bus.gain.linearRampToValueAtTime(0, now + (quick ? .4 : 1.6));
    tearDown(s, now + (quick ? .4 : 1.6));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(true); else if (tourIsOpen) start(); });
  return {
    on: () => !(S && S.ui && S.ui.music === false),
    playing: () => !!st,
    level: () => level,                                                /* 1, or 0 while the hello video plays */
    wake: () => { if (allowed() && tourIsOpen) start(); },            /* called on taps inside the setup */
    sync: () => { if (!allowed()) stop(); else if (tourIsOpen) start(); },
    tourClosed: () => stop(),
    setOn(v) { if (v) delete S.ui.music; else S.ui.music = false; persist(); this.sync(); },
    /* for the offline check: schedule `seconds` of music into a given context and output */
    render(c, out, seconds) { const s = build(c, out); s.bus.gain.setValueAtTime(LEVEL, 0); step(s, seconds); return s; },
  };
})();
if (/[?&]sfxtest\b/.test(location.search)) window.__music = MUSIC;
if (/[?&]sfxtest\b/.test(location.search)) { window.__S = () => S; window.__ls = () => LS_STATE; window.__tour = () => tourIsOpen; }
