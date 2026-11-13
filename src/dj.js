/* ---------- sound in the top bar: one tap to mute, a volume, and a small music station ----------
   Sources: Forest (the quiet piece made in the browser, music.js), GREEN by Hiroshi Yoshimura (1986), or no music.
   GREEN streams the official release (the label's uploads on YouTube) through YouTube's own player, which must stay visible
   while it plays, so it sits in a small dock at the bottom left with its cover; hiding the dock pauses it. Nothing is loaded
   from YouTube until GREEN is chosen. The volume (S.ui.vol, 0 to 100) sets the sound effects, the forest music and the player.
   More albums: add an entry to ALBUMS. */
const ALBUMS = {
  green: { title: 'GREEN', by: 'Hiroshi Yoshimura', year: 1986, tracks: [['nQkdHvIP0zg', 'CREEK'], ['xOQjZ-PFE1o', 'FEEL'], ['OSOPJ8UbOYg', 'SHEEP'], ['pFoF2Og6AXw', 'SLEEP'], ['TO8kwMJuSvU', 'GREEN'], ['1O58bqXvAsE', 'FEET'], ['67oSBxOEzZ8', 'STREET'], ['ffWtJPbkVNc', 'TEEVEE']] },
};
function djSrc() { return S.ui.music === false ? 'off' : (S.ui.dj && ALBUMS[S.ui.dj.src] ? S.ui.dj.src : 'forest'); }
const volOf = () => (typeof S.ui.vol === 'number' ? Math.max(0, Math.min(100, S.ui.vol)) : 80);
const DJ = (() => {
  let yt = null, ytReady = false, apiP = null, want = false, playing = false, wasPlaying = false;
  const alb = () => ALBUMS[djSrc()] || null;
  const idx = () => { const a = alb(); const i = S.ui.dj && +S.ui.dj.i; return a && i >= 0 && i < a.tracks.length ? i : 0; };
  const ICON = {
    on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zM20 6v12l-10-6z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 6h2v12h-2zM4 6v12l10-6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>',
  };
  /* ---------- YouTube's player, loaded on demand ---------- */
  function api() {
    if (window.YT && YT.Player) return Promise.resolve();
    if (apiP) return apiP;
    apiP = new Promise((res, rej) => {
      const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { if (prev) try { prev(); } catch (e) { /* theirs */ } res(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; s.onerror = () => { apiP = null; rej(new Error('offline')); };
      document.head.appendChild(s);
    });
    return apiP;
  }
  function ensure() {
    if (yt) return Promise.resolve();
    $('#djDock').hidden = false; paintDock('Loading…');
    return api().then(() => new Promise(res => {
      yt = new YT.Player('djYt', { width: 200, height: 200, host: 'https://www.youtube-nocookie.com', videoId: alb().tracks[idx()][0],
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, iv_load_policy: 3, fs: 0 },
        events: {
          onReady: () => { ytReady = true; try { yt.setVolume(volOf()); if (S.ui.mute) yt.mute(); } catch (e) { /* not yet */ } res(); },
          onStateChange: e => { playing = e.data === 1; if (e.data === 0) step(1); paint(); },
          onError: () => { step(1); },
        } });
    })).catch(() => { yt = null; $('#djDock').hidden = true; setSrc('forest', true); const n = $('#djNote'); if (n) n.textContent = 'GREEN could not load (it streams from YouTube and needs the internet). Forest plays meanwhile.'; });
  }
  function load(i, go) {
    const a = alb(); if (!a) return;
    S.ui.dj = { src: djSrc(), i }; persist();
    if (!yt || !ytReady) { if (go) { want = true; ensure().then(() => load(i, want)); } paint(); return; }
    try { if (go) yt.loadVideoById(a.tracks[i][0]); else yt.cueVideoById(a.tracks[i][0]); } catch (e) { /* player gone */ }
    paint();
  }
  const step = d => { const a = alb(); if (!a) return; load((idx() + d + a.tracks.length) % a.tracks.length, true); };
  function play() { const a = alb(); if (!a || S.ui.mute) return; want = true; if (!ytReady) { ensure().then(() => { if (want) load(idx(), true); }); return; } try { yt.playVideo(); } catch (e) { /* gone */ } }
  function pause() { want = false; if (yt && ytReady) try { yt.pauseVideo(); } catch (e) { /* gone */ } }
  /* ---------- choosing the source ---------- */
  function setSrc(src, quiet) {
    const n = $('#djNote'); if (n) n.textContent = '';
    if (src === 'off') { S.ui.music = false; pause(); }
    else { delete S.ui.music; S.ui.dj = { src, i: src === (S.ui.dj && S.ui.dj.src) ? idx() : 0 }; if (src === 'forest') pause(); }
    persist(); MUSIC.sync();
    if (ALBUMS[src] && !quiet) play();
    $('#djDock').hidden = !ALBUMS[djSrc()] || !yt; paint();
  }
  function setVol(v) {
    S.ui.vol = Math.round(Math.max(0, Math.min(100, v))); persist();
    SFX.vol(); if (yt && ytReady) try { yt.setVolume(volOf()); } catch (e) { /* gone */ }
    paint();
  }
  function setMute(m) {
    if (m) { S.ui.mute = true; wasPlaying = playing; pause(); if (yt && ytReady) try { yt.mute(); } catch (e) { /* gone */ } }
    else { delete S.ui.mute; if (yt && ytReady) try { yt.unMute(); } catch (e) { /* gone */ } if (wasPlaying) play(); }
    persist(); MUSIC.sync(); SFX.vol(); paint();
    paintSnd();
  }
  /* ---------- painting ---------- */
  function paintDock(msg) {
    const a = alb(), i = idx(), d = $('#djDockT'); if (!d) return;
    d.innerHTML = msg ? `<span class="cap">${esc(msg)}</span>` : a ? `<b>${esc(a.tracks[i][1])}</b><span>${esc(a.by)}, ${esc(a.title)}</span>` : '';
    $('#djDockPlay').innerHTML = playing ? ICON.pause : ICON.play; $('#djDockPlay').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }
  function paint() {
    const m = !!S.ui.mute, v = volOf(), src = djSrc();
    const b = $('#sndBtn'); if (b) { b.innerHTML = m || v === 0 ? ICON.off : ICON.on; b.setAttribute('aria-label', m ? 'Sound off. Tap to turn on' : 'Sound on. Tap to mute'); b.setAttribute('aria-pressed', String(m)); b.classList.toggle('off', m); }
    const n = $('#djBtn'); if (n) { n.innerHTML = ICON.note; n.classList.toggle('lit', playing || (src === 'forest' && !m && MUSIC.playing())); }
    const pnl = $('#dj'); if (!pnl || pnl.hidden) { paintDock(); return; }
    $('#djMute').textContent = m ? 'Sound off' : 'Sound on'; $('#djMute').setAttribute('aria-pressed', String(m)); $('#djMute').classList.toggle('off', m);
    const r = $('#djVol'); if (document.activeElement !== r) r.value = v; $('#djVolN').textContent = v;
    $$('[data-djsrc]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.djsrc === src)));
    const a = alb(), i = idx(), box = $('#djAlb');
    if (a) {
      box.hidden = false;
      box.innerHTML = `<div class="dj-now"><div><b>${esc(a.tracks[i][1])}</b><span>${esc(a.by)}, ${esc(a.title)} (${a.year})</span></div>
        <div class="dj-ctl"><button type="button" class="dj-i" data-djstep="-1" aria-label="Previous track">${ICON.prev}</button><button type="button" class="dj-i big" data-djplay aria-label="${playing ? 'Pause' : 'Play'}">${playing ? ICON.pause : ICON.play}</button><button type="button" class="dj-i" data-djstep="1" aria-label="Next track">${ICON.next}</button></div></div>
        <ol class="dj-list">${a.tracks.map((t, k) => `<li><button type="button" data-djtrack="${k}"${k === i ? ' aria-current="true"' : ''}><span>${k + 1}</span>${esc(t[1])}</button></li>`).join('')}</ol>
        <p class="cap">Streams the official release through YouTube's player, shown at the bottom left while it plays.</p>`;
    } else { box.hidden = true; box.innerHTML = ''; }
    $('#djScene').checked = SCENE.on();
    paintDock();
  }
  function open() { const p = $('#dj'); p.hidden = false; $('#djBtn').setAttribute('aria-expanded', 'true'); paint(); sfx('tap'); setTimeout(() => $('#djMute').focus({ preventScroll: true }), 0); }
  function close() { const p = $('#dj'); if (p.hidden) return; p.hidden = true; $('#djBtn').setAttribute('aria-expanded', 'false'); }
  function wire() {
    $('#djDockPrev').innerHTML = ICON.prev; $('#djDockNext').innerHTML = ICON.next; $('#djDockPlay').innerHTML = ICON.play;
    $('#sndBtn').addEventListener('click', () => setMute(!S.ui.mute));
    $('#djBtn').addEventListener('click', e => { e.stopPropagation(); if ($('#dj').hidden) open(); else close(); });
    $('#djMute').addEventListener('click', () => setMute(!S.ui.mute));
    $('#djVol').addEventListener('input', e => setVol(+e.target.value));
    $('#djScene').addEventListener('change', e => SCENE.set(e.target.checked));
    $('#dj').addEventListener('click', e => {
      e.stopPropagation();
      const s = e.target.closest('[data-djsrc]'); if (s) { setSrc(s.dataset.djsrc); return; }
      const t = e.target.closest('[data-djtrack]'); if (t) { load(+t.dataset.djtrack, true); return; }
      const st = e.target.closest('[data-djstep]'); if (st) { step(+st.dataset.djstep); return; }
      if (e.target.closest('[data-djplay]')) { if (playing) pause(); else play(); }
    });
    $('#djDockPlay').addEventListener('click', () => { if (playing) pause(); else play(); });
    $('#djDockPrev').addEventListener('click', () => step(-1));
    $('#djDockNext').addEventListener('click', () => step(1));
    $('#djDockHide').addEventListener('click', () => { pause(); $('#djDock').hidden = true; });
    document.addEventListener('click', e => { if (!$('#dj').hidden && !e.target.closest('#dj, #djBtn')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#dj').hidden) { close(); $('#djBtn').focus(); } });
    /* the hello video and the album never play over each other */
    document.addEventListener('play', e => { if (e.target && e.target.id === 'tourVid' && playing) { wasPlaying = true; pause(); } }, true);
    /* a saved choice of GREEN starts on the first tap, like the forest music */
    const first = () => { document.removeEventListener('click', first, true); if (ALBUMS[djSrc()] && !S.ui.mute && !tourIsOpen) play(); };
    document.addEventListener('click', first, true);
    paint();
  }
  return { wire, paint, setMute, setVol, setSrc, playing: () => playing, close };
})();
