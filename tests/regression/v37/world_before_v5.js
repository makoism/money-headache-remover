/* ---------- the world: the pages live on a scroll that a hand raises over the scene ----------
   With the scenery on, the app opens onto the world. Home, Receipts and Plan are wooden signs standing in it; tapping one makes a
   hand lift a scroll with that page on it. Close (or Escape) lowers it again. With the scenery off the pages sit in the plain
   column as before. "Open the pages when I start" in Settings skips the walk through the world. */
const WORLD = (() => {
  let tmr = 0, was = null;
  const B = document.body, reduce = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const HAND = ["...oooooooooooooooooooooo...",
    "..olllllllllllllllllllllllo.",
    "..olwwwwwwwwwwwwwwwwwwwwwdo.",
    "..olwwwwwwwwwwwwwwwwwwwwwdo.",
    "..olwwwwwwwwwggggwwwwwwwwdo.",
    "..olwwwwwwwwgGGGGgwwwwwwwdo.",
    "..olwwwwwwwggGggGggwwwwwwdo.",
    "..olwwwwwwwgGgGGgGgwwwwwwdo.",
    "..olwwwwwwwggGgggGggwwwwwdo.",
    "..olwwwwwwwwgGGGGgwwwwwwwdo.",
    "..olwwwwwwwwwggggwwwwwwwwdo.",
    "..olwwwwwwwwwwwwwwwwwwwwwdo.",
    "..oddddddddddddddddddddddo..",
    "...ooooooooooooooooooooooo..",
    "....oksssssssssssssssssko...",
    ".ooooksssssssssssssksskkoo..",
    ".osskssssssssssssskssskssso.",
    ".ossssssssssssssskssskssso..",
    "..osssssssssssssskssskssso..",
    "..oskskskskssssssksskkssko..",
    "...osososososssssssssko.....",
    "....ooooooooooooooooo.......",
    ".....orrrrrrrrrrrrro........",
    ".....orrRRrrrrrrrrro........",
    ".....orrRRrrrrrrrrro........",
    ".....orrrrrrrrrrrrro........",
    "....occccccccccccccco.......",
    "....ooooooooooooooooo.......",
    ".....orrrrrrrrrrrrro........",
    ".....orrrrrrrrrrrrro........",
    ".....orrrrrrrrrrrrro........",
    ".....orrrrrrrrrrrrro........"];
  const HC = { o: '#2b1a10', l: '#c99a64', w: '#8a5a37', d: '#5e3d25', g: '#ffe9a0', G: '#fff8d2', s: '#e8b98a', k: '#c48f63', r: 'var(--robe, #4b3f8f)', R: 'color-mix(in srgb, var(--robe, #4b3f8f) 70%, #ffffff)', c: '#e9d9b6' };
  /* the hand is drawn here as pixels: a wooden tablet with a glowing rune in an open palm, a sleeve below */
  function drawHand() {
    const el = $('#handFx'); if (!el) return; let p = '';
    HAND.forEach((row, y) => { let x = 0; while (x < row.length) { const ch = row[x]; if (!HC[ch]) { x++; continue; } let n = 1; while (row[x + n] === ch) n++; p += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${HC[ch]}"/>`; x += n; } });
    el.innerHTML = `<svg viewBox="0 0 28 ${HAND.length}" shape-rendering="crispEdges">${p}</svg>`;
  }
  const pref = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, setPref = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* private mode */ } };
  const plain = () => pref('mhr-layout') === 'plain', startOpen = () => pref('mhr-start') === 'open';
  const HANDS = ["..............oo....",".............osso...","............ossko...","...........osskkoo..","..........osskskso..","........ooosksssko..",".......osssssssssko.","......ossssssssssko.",".....osssssssssssko.","....ossssssssssssko.","...orrcsssssssssko..","..orrRrcssssssskoo..",".orrrrrrcsssssko....","orrRrrrrrcsssko.....","orrrrrrrrrcoo.......","oorrrrrrrro........."];
  /* ---------- the orb: the hands hold a light, and the light holds the little controls ----------
     On the wide scene the music, sound, settings and streak buttons stand in a ring round an orb held in two pixel hands. They are the
     same buttons that sit in the title bar in the plain layout (moved, not copied), so everything they do is unchanged. */
  const ORB = [['topStreak', 'Streak'], ['djBtn', 'Music'], ['sndBtn', 'Sound'], ['gearBtn', 'Settings']];
  let orbEl = null, marks = {};
  function handsSvg() {
    const W = HANDS[0].length, pal = { o: '#2b1a10', s: '#e8b98a', k: '#c48f63', r: 'var(--robe, #4b3f8f)', R: 'color-mix(in srgb, var(--robe, #4b3f8f) 70%, #ffffff)', c: '#e9d9b6' };
    let p = ''; HANDS.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (!pal[ch]) continue; p += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>`; } });
    return `<svg viewBox="0 0 ${W * 2 + 14} ${HANDS.length}" shape-rendering="crispEdges"><g>${p}</g><g transform="translate(${W * 2 + 14} 0) scale(-1 1)">${p}</g></svg>`;
  }
  function orbMake() {
    if (orbEl) return;
    orbEl = document.createElement('div'); orbEl.id = 'orb'; orbEl.className = 'orb';
    orbEl.innerHTML = `<div class="orb-ring" id="orbRing" role="group" aria-label="Controls"></div><button type="button" class="orb-ball" id="orbBtn" aria-haspopup="true" aria-expanded="false" aria-controls="orbRing" aria-label="Open the orb: streak, music, sound, settings, ask, help"><i></i></button><div class="orb-hands" aria-hidden="true">${handsSvg()}</div><p class="orb-cap" id="orbCap">Tap the light</p>`;
    document.body.append(orbEl);
    $('#orbBtn').addEventListener('click', e => { e.stopPropagation(); orbToggle(); });
    $('#orbRing').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.id !== 'sndBtn') setTimeout(() => orbToggle(false), 60); orbEl.classList.add('cast'); setTimeout(() => orbEl && orbEl.classList.remove('cast'), 600); sfx('sparkle'); });
    document.addEventListener('click', e => { if (orbEl && orbEl.classList.contains('open') && !e.target.closest('#orb')) orbToggle(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && orbEl && orbEl.classList.contains('open')) { orbToggle(false); const b = $('#orbBtn'); if (b) b.focus(); } });
  }
  function orbToggle(v) {
    if (!orbEl) return; const open = typeof v === 'boolean' ? v : !orbEl.classList.contains('open');
    orbEl.classList.toggle('open', open); $('#orbBtn').setAttribute('aria-expanded', String(open)); if (open) { sfx('sparkle'); const cap = $('#orbCap'); if (cap) cap.hidden = true; try { localStorage.setItem('mhr-orb', '1'); } catch (e) { /* private mode */ } }
  }
  function orbPlace() {
    const want = on();
    if (want) {
      orbMake(); const ring = $('#orbRing'); orbEl.hidden = false;
      ORB.forEach(([id, lab]) => { const b = document.getElementById(id); if (!b || ring.contains(b)) return; const m = document.createComment('orb:' + id); b.replaceWith(m); marks[id] = m; b.dataset.lab = lab; ring.append(b); });
      if (!$('#orbAsk')) { [['orbAsk', 'Ask', 'askBtn', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>'], ['orbHelp', 'Help', 'helpBtn', '<b style="font-size:20px">?</b>']].forEach(([id, lab, real, ico]) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'orb-proxy'; b.dataset.lab = lab; b.setAttribute('aria-label', lab); b.innerHTML = ico; b.addEventListener('click', () => { const r = document.getElementById(real); if (r) r.click(); }); ring.append(b); }); }
      try { if (localStorage.getItem('mhr-orb')) { const cap = $('#orbCap'); if (cap) cap.hidden = true; } } catch (e) { /* private mode */ }
    } else if (orbEl) {
      ORB.forEach(([id]) => { const b = document.getElementById(id), m = marks[id]; if (b && m && m.parentNode) { m.replaceWith(b); delete b.dataset.lab; delete marks[id]; } });
      orbEl.classList.remove('open'); orbEl.hidden = true; ['orbAsk', 'orbHelp'].forEach(i => { const e = document.getElementById(i); if (e) e.remove(); });
    }
  }
  const on = () => B.classList.contains('world'), isShut = () => B.classList.contains('shut');
  function open(quiet) {
    if (!on() || !isShut()) return;
    clearTimeout(tmr); B.classList.remove('shut', 'closing');
    if (!quiet && !reduce()) { B.classList.add('opening'); tmr = setTimeout(() => B.classList.remove('opening'), 1400); sfx('whoosh'); }
    scrollTo({ top: 0 });
  }
  function close() {
    if (!on() || isShut()) return;
    clearTimeout(tmr);
    const fin = () => { B.classList.remove('closing', 'opening'); B.classList.add('shut'); scrollTo({ top: 0 }); const t = $('.tabs [aria-selected="true"]'); if (t && document.activeElement && $('#scroll').contains(document.activeElement)) try { t.focus({ preventScroll: true }); } catch (e) { /* gone */ } };
    if (reduce()) { fin(); return; }
    B.classList.add('closing'); sfx('soft'); tmr = setTimeout(fin, 380);
  }
  /* a scene has just started or stopped */
  function sync(isOn) {
    isOn = !!isOn && !plain(); B.classList.toggle('world', isOn);
    if (!isOn) { was = isShut(); B.classList.remove('shut', 'opening', 'closing'); return; }
    if (was === null ? !startOpen() : was) B.classList.add('shut');
    was = null;
  }
  /* after the hello and setup: step out into the world */
  function settle() { if (on() && !startOpen()) { clearTimeout(tmr); B.classList.remove('opening', 'closing'); B.classList.add('shut'); scrollTo({ top: 0 }); } }
  /* the two switches in Settings */
  function paintSw() {
    const a = $('#setWorld'), s = $('#setStart'); if (!a) return;
    a.setAttribute('aria-checked', String(!plain())); $('#worldTxt').textContent = plain() ? 'Off' : 'On';
    s.setAttribute('aria-checked', String(startOpen())); $('#startTxt').textContent = startOpen() ? 'On' : 'Off'; $('#startRow').hidden = plain();
  }
  function wire() {
    drawHand(); paintSw();
    $('#setWorld').addEventListener('click', () => { setPref('mhr-layout', plain() ? '' : 'plain'); paintSw(); sync(B.classList.contains('scene-on') || B.classList.contains('scene-phone')); SCENE.sync(); sfx('tap'); });
    $('#setStart').addEventListener('click', () => { setPref('mhr-start', startOpen() ? '' : 'open'); paintSw(); sfx('tap'); });
    $('#scrollX').addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || e.defaultPrevented || !on() || isShut()) return;
      if (document.body.classList.contains('touring')) return;
      if (document.querySelector('.dj:not([hidden]), .ask:not([hidden]), .cam:not([hidden]), .tour:not([hidden])')) return;
      const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      close();
    });
  }
  return { plain, open, close, sync: isOn => { sync(isOn); orbPlace(); }, settle, wire, isOn: on, isShut };
})();
