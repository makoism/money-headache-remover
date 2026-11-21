
/* ---------- the first-open tour: welcome, the video, then the setup questions ---------- */
let tourN = 0, tourIsOpen = false, tourReturn = null, tourMode = 'full', TS = [], tourDir = 0;
const num0 = v => clampAmt(v, S);   /* decision 1: setup keeps typed cents too (yen whole); before, it rounded every currency (38.31 money accuracy round 2) */
const firstName = () => (S.ui && S.ui.name) || '';

/* a small house on a green hill, a tree beside it: the welcome and the goodbye. Drawn in the colours of the current look. */
function homeScene() {
  return `<svg class="tour-fig tour-scene" viewBox="0 0 320 118" role="img" aria-label="A small house on a green hill, with a tree beside it">
    <defs><linearGradient id="hsFade" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="hsMask"><rect width="320" height="118" fill="url(#hsFade)"/></mask></defs>
    <g mask="url(#hsMask)"><path d="M0 90 C60 64 118 70 170 82 C222 94 270 70 320 78 V118 H0 Z" fill="var(--accent)" opacity=".14"/>
    <path d="M0 108 C70 88 140 104 200 100 C250 97 290 86 320 96 V118 H0 Z" fill="var(--accent)" opacity=".3"/></g>
    <path d="M74 101 V70 M74 80 L64.5 69 M74 75 L83 65" fill="none" stroke="var(--accent)" stroke-width="2.8" stroke-linecap="round"/>
    <g fill="var(--accent)" opacity=".62"><circle cx="74" cy="55" r="17"/><circle cx="60" cy="64" r="11.5"/><circle cx="88.5" cy="63" r="11.5"/></g>
    <path d="M190 100 V80 L212 62 L234 80 V100" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M184 84 L212 60 L240 84" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <rect x="205.5" y="82" width="13" height="11.5" rx="2.5" fill="#ffd27a"/>
    <path d="M30 108 q2 -8 5 -12 M35 108 q0 -6 -3 -10 M131 108 q2 -7 4 -10 M136 108 q0 -5 -2 -8 M262 102 q2 -7 5 -10 M267 102 q1 -6 -2 -9 M292 99 q1 -5 3 -7" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
    <g fill="var(--accent)" opacity=".45"><path d="M256 36 q9 1 11 10 q-9 -1 -11 -10 Z"/><path d="M284 52 q7 1 8 8 q-7 -1 -8 -8 Z"/><path d="M20 58 q7 0 9 8 q-7 0 -9 -8 Z"/></g>
  </svg>`;
}
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/* choices on the welcome screens are real radio buttons, drawn as soft chips */
const TOUR_CURS = ['¥', '₱', '$', '€', '£', 'A$'];
const curName = c => c[1].indexOf(c[0] + ' ') === 0 ? c[1].slice(c[0].length + 1) : c[1];
const chip = (name, value, big, label, on) => `<label class="chip${on ? ' on' : ''}"><input type="radio" name="${name}" value="${esc(value)}"${on ? ' checked' : ''}>${big ? `<b>${esc(big)}</b>` : ''}<span>${esc(label)}</span></label>`;
function syncTourCur() {
  const cur = (S.ui && S.ui.cur) || '₱';
  $$('#tourBody input[name=tourCur]').forEach(i => { i.checked = i.value === cur; i.closest('.chip').classList.toggle('on', i.checked); });
  const more = $('#tourCurMore'); if (more) more.value = TOUR_CURS.indexOf(cur) < 0 ? cur : '';
}
function setTourCur(v) { if (!CURS.some(c => c[0] === v)) return;
  /* the minimum setup made by itself from the pay (a tenth) is made again from the pay in the new currency; one the person typed is kept
     (QC round 4 north-star agent check B1: Back, then Dollar, kept the yen 20000) */
  const autoMin = v !== S.ui.cur && S.ui.minAuto !== undefined && S.cfg.minBank === S.ui.minAuto;
  const changed = changeCurrency(v);
  if (autoMin && S.ui.cur === v) { delete S.cfg.minBank; delete S.ui.minAuto; persist(); }
  if (changed) restructure(); syncTourCur(); $$('#tour .cs').forEach(e => { e.textContent = sym(); }); }

/* The welcome video. HELLO_FILE is a small copy that sits next to the page and plays right on the screen, with HELLO_POSTER as its cover.
   HELLO_VIDEO is the full version on Google Drive (a Drive file link or a Loom share link both work): it is the "does not play?" link, and the
   card that takes over if the small copy cannot load. Leave all of them empty and the screen does not exist. */
const HELLO_VIDEO = 'https://drive.google.com/file/d/1wsx3AotNISeoWiqpy-gHPOJ0VVexNiKO/view?usp=drivesdk';
const HELLO_FILE = 'hello.mp4';
/* A sharper copy in the newer AV1 format, same size on disk. Browsers that can play it use it; the rest keep HELLO_FILE. */
const HELLO_FILE_HQ = 'hello-av1.mp4';
const HELLO_HQ_TYPE = 'video/mp4; codecs="av01.0.04M.08"';
const HELLO_POSTER = 'hello.jpg';
const HELLO_RATES = [1, 1.25, 1.5, 2, 2.5, 3];
let helloFailed = false, helloRate = 1, helloHqFailed = false;
/* The place that hosts this page's files answers every request with the whole file and ignores byte ranges. Chrome plays that, but
   Safari and every iPhone browser refuse to play a video without ranges. So on a web address the page downloads the video first,
   with a progress bar, and plays it from memory. Opened straight from a folder (file://) the plain video tag still works. */
const helloBlob = () => /^https?:$/.test(location.protocol) && typeof fetch === 'function' && typeof URL.createObjectURL === 'function';
const HELLO_BYTES = { 'hello.mp4': 19806005, 'hello-av1.mp4': 20658068 };
const helloUrls = {};
let helloLoad = null;
function helloGet(file, onPct) {
  if (helloUrls[file]) { onPct(100); return Promise.resolve(helloUrls[file]); }
  if (!helloLoad || helloLoad.file !== file) {
    helloStop();
    const ac = typeof AbortController === 'function' ? new AbortController() : null, st = { file, pct: 0, subs: [], ac };
    st.p = (async () => {
      const r = await fetch(file, ac ? { signal: ac.signal } : {});
      if (!r.ok) throw new Error('http ' + r.status);
      const total = +r.headers.get('content-length') || HELLO_BYTES[file] || 0;
      let blob;
      if (r.body && r.body.getReader) {
        const rd = r.body.getReader(), parts = []; let got = 0;
        for (;;) {
          const x = await rd.read(); if (x.done) break;
          parts.push(x.value); got += x.value.length;
          st.pct = total ? Math.min(99, Math.round(got / total * 100)) : 0; st.subs.forEach(f => f(st.pct));
        }
        blob = new Blob(parts, { type: 'video/mp4' });
      } else blob = new Blob([await r.arrayBuffer()], { type: 'video/mp4' });
      if (blob.size < 100000) throw new Error('short file');
      helloUrls[file] = URL.createObjectURL(blob); st.pct = 100; st.subs.forEach(f => f(100));
      return helloUrls[file];
    })();
    st.p.then(() => { if (helloLoad === st) helloLoad = null; }, () => { if (helloLoad === st) helloLoad = null; });
    helloLoad = st;
  }
  helloLoad.subs.push(onPct); onPct(helloLoad.pct);
  return helloLoad.p;
}
function helloStop() { if (helloLoad && helloLoad.ac) { try { helloLoad.ac.abort(); } catch (e) { /* already done */ } } helloLoad = null; }
const helloVideo = (() => {
  let m = /^https:\/\/drive\.google\.com\/file\/d\/([\w-]{10,80})\/view(\?[\w=&%.-]*)?$/.exec(HELLO_VIDEO);
  if (m) return { watch: 'https://drive.google.com/file/d/' + m[1] + '/view' };
  m = /^https:\/\/(www\.)?loom\.com\/share\/([\w-]+)(\?[\w=&%.-]*)?$/.exec(HELLO_VIDEO);
  if (m) return { watch: 'https://www.loom.com/share/' + m[2] };
  return null;
})();
const helloFileOk = /^[\w.-]+\.mp4$/.test(HELLO_FILE) && /^[\w.-]+\.(jpg|png)$/.test(HELLO_POSTER);
const hasHello = !!(helloVideo || helloFileOk);
const helloHqOk = () => {
  if (helloHqFailed || !/^[\w.-]+\.mp4$/.test(HELLO_FILE_HQ)) return false;
  try { return document.createElement('video').canPlayType(HELLO_HQ_TYPE) !== ''; } catch (e) { return false; }
};
const helloSrc = () => (helloHqOk() ? HELLO_FILE_HQ : HELLO_FILE);
/* the hello video sits in a garden: a vine garland around the frame (one corner piece, turned four ways), Mako's handwritten note with
   an arrow pointing at it, and a few pixel flowers at its foot */
const fromMako = () => `<p class="from-mako" aria-label="From Mako"><span>from Mako</span><svg class="fm-arrow" viewBox="0 0 76 46" aria-hidden="true"><path d="M3 9c14-7 30-4 42 7 8 7 13 15 18 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 37c4 2 8 3 11 3-1-3-2-7-1-11" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></p>`;
const garden = inner => `<div class="vgarden">${['tl', 'tr', 'bl', 'br'].map(k => `<span class="art art-corner vg-${k}" aria-hidden="true">${ART.corner}</span>`).join('')}<span class="vg-pix vg-pix-l" aria-hidden="true">${pix('tulip', 2)}${pix('clover', 2)}</span><span class="vg-pix vg-pix-r" aria-hidden="true">${pix('daisy', 2)}${pix('sprout', 2)}</span>${inner}</div>`;
/* a plant on every setup screen: a step names its own, or takes its part's; it steps aside when the words reach it (fitTourArt) */
const ART_BY_PART = { [PART.welcome]: '',   /* no floating vine in the setup dialog (38.31 art director round 2: not from a corner, not on the pixel grid) */ [PART.money]: 'twig', [PART.bills]: 'fern', [PART.jars]: 'sprout', [PART.goals]: 'flower', [PART.spend]: 'branch' };
const helloPlayer = () => { const f = helloSrc(), blob = helloBlob(), have = !blob || !!helloUrls[f], src = blob ? helloUrls[f] || '' : f; return `${fromMako()}${garden(`<div class="tour-vframe${have ? '' : ' loading'}" id="tourVF"><video id="tourVid" preload="metadata" playsinline poster="${esc(HELLO_POSTER)}"${src ? ` src="${esc(src)}"` : ''} aria-label="A short hello video"></video><button type="button" class="tour-play" id="tourPlay" aria-label="Play the video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></button><div class="tour-load" id="tourLoad" role="status"><span>Getting the video ready <em id="tourLoadPct" aria-hidden="true">0%</em></span><i aria-hidden="true"><b id="tourLoadBar"></b></i></div></div>`)}
  <div class="tour-speed" id="tourSpeed" role="group" aria-label="Playback speed"><span>Speed</span>${HELLO_RATES.map(r => `<button type="button" data-rate="${r}" aria-pressed="${r === helloRate}">${r}x</button>`).join('')}</div>`; };
const helloCard = () => helloVideo
  ? `${fromMako()}<div class="row-btns"><a class="tour-video" id="tourVideo" target="_blank" rel="noopener noreferrer" href="${esc(helloVideo.watch)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" opacity=".18"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg><span><b>Watch the video</b><small>Opens in a new tab</small></span></a></div>`
  : '<p class="cap">The video didn\'t load, so skip it and carry on.</p>';
function pauseHello() { const v = $('#tourVid'); if (v) try { v.pause(); } catch (e) { /* gone */ } }
function wireHello() {
  const v = $('#tourVid'), f = $('#tourVF'), play = $('#tourPlay'); if (!v || !f || !play) return;
  const fail = () => { if (helloFailed) return; helloFailed = true; if (tourIsOpen && TS[tourN] && TS[tourN].id === 'video') renderTour(); };
  /* the sharper copy would not load or decode: switch to the standard copy, keep the place and speed, and only give up if that fails too */
  const fallBack = () => {
    if (helloHqFailed || helloSrc() !== HELLO_FILE_HQ) return false;
    helloHqFailed = true;
    const at = v.currentTime || 0, wasPlaying = !v.paused;
    const swap = url => {
      const el = $('#tourVid'); if (!el) return;
      el.src = url; el.load();
      el.addEventListener('loadedmetadata', function once() { el.removeEventListener('loadedmetadata', once); try { if (at > 0) el.currentTime = at; } catch (e) { /* starts from the top */ } setRate(helloRate); if (wasPlaying) { const p = el.play(); if (p && p.catch) p.catch(() => {}); } });
    };
    if (helloBlob()) { f.classList.add('loading'); fetchFile(HELLO_FILE, swap); } else swap(HELLO_FILE);
    return true;
  };
  /* download a copy and hand it to the video tag; a progress bar shows meanwhile */
  const fetchFile = (file, then) => {
    helloGet(file, pct => { const t = $('#tourLoadPct'), b = $('#tourLoadBar'); if (t) t.textContent = pct + '%'; if (b) b.style.width = pct + '%'; })
      .then(url => { const ff = $('#tourVF'); if (!ff) return; ff.classList.remove('loading'); then(url); })
      .catch(err => { if (err && err.name === 'AbortError') return; if (!(helloSrc() === HELLO_FILE_HQ && fallBack())) fail(); });
  };
  const setRate = r => {
    try { v.defaultPlaybackRate = r; v.playbackRate = r; } catch (e) { /* keeps the old speed */ }
    helloRate = Math.abs(v.playbackRate - r) < 0.01 ? r : v.playbackRate;
    $$('#tourSpeed button').forEach(b => b.setAttribute('aria-pressed', String(Math.abs(+b.dataset.rate - helloRate) < 0.01)));
  };
  v.addEventListener('error', () => { if (!fallBack()) fail(); });
  v.addEventListener('play', () => { f.classList.add('playing'); v.controls = true; setRate(helloRate); });
  v.addEventListener('ended', () => { f.classList.remove('playing'); v.controls = false; });
  play.addEventListener('click', () => { const p = v.play(); if (p && p.catch) p.catch(err => { if (err && err.name !== 'AbortError' && err.name !== 'NotAllowedError' && !fallBack()) fail(); }); });
  $('#tourSpeed').addEventListener('click', e => { const b = e.target.closest('[data-rate]'); if (b) setRate(+b.dataset.rate); });
  setRate(helloRate);
  if (helloBlob() && !v.getAttribute('src')) fetchFile(helloSrc(), url => { const el = $('#tourVid'); if (el && !el.getAttribute('src')) { el.src = url; el.load(); setRate(helloRate); } });
  wireTx(v);
}

/* a transcript under the video, one line at a time, that follows the video like a lyrics view */
function txHTML(synced) {
  const tag = synced ? 'button type="button"' : 'p', end = synced ? 'button' : 'p';
  const list = `<div class="tx-list" id="txList">${TRANSCRIPT.map((l, i) => `<${tag} class="tx-l" data-t="${l[0]}" data-i="${i}">${esc(l[1])}</${end}>`).join('')}</div>`;
  /* the transcript starts folded either way, so the first page is the video; open, it follows the sound when there is a player */
  return `<details class="tx-fold"><summary>Transcript</summary><section class="tx${synced ? '' : ' plain'}" id="tourTx" aria-label="Transcript"><div class="tx-h"><b>Transcript</b><button type="button" class="link" id="txNow" hidden>Back to now</button></div>${list}</section></details>`;
}
function wireTx(v) {
  const list = $('#txList'), now = $('#txNow'); if (!list || !now || !list.querySelector('button.tx-l')) return;
  const lines = $$('.tx-l', list), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let follow = true, cur = -1, prog = 0;
  const goTo = (i, smooth) => { prog = Date.now(); list.scrollTo({ top: Math.max(0, lines[i].offsetTop - 10), behavior: smooth && !calm ? 'smooth' : 'auto' }); };
  const activeAt = t => { let a = -1; for (let i = 0; i < TRANSCRIPT.length; i++) { if (TRANSCRIPT[i][0] <= t + 0.2) a = i; else break; } return a; };
  const update = () => {
    const a = activeAt(v.currentTime); if (a === cur) return; cur = a;
    lines.forEach((el, i) => { el.classList.toggle('on', i === a); el.classList.toggle('past', i < a); });
    if (a >= 0 && follow) goTo(a, true);
  };
  ['timeupdate', 'seeked', 'play'].forEach(ev => v.addEventListener(ev, update));
  const leaveFollow = () => { if (Date.now() - prog < 500 || !follow) return; follow = false; now.hidden = false; };
  ['wheel', 'touchmove', 'keydown'].forEach(ev => list.addEventListener(ev, leaveFollow, { passive: true }));
  list.addEventListener('click', e => {
    const b = e.target.closest('.tx-l'); if (!b) return;
    try { v.currentTime = +b.dataset.t; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (err) { /* stays where it was */ }
    follow = true; now.hidden = true; cur = -1; update(); sfx('tap');
  });
  now.addEventListener('click', () => { follow = true; now.hidden = true; if (cur >= 0) goTo(cur, true); sfx('tap'); });
  update();
}

/* the recovery-code link on the first screen: shows only where a cloud copy can exist; a code loads the numbers and closes the setup */
const restoreHTML = () => `<p class="cap tour-restore" id="tourRestore" hidden>Used this before on another phone? <button type="button" class="link" id="tourRestoreBtn">Enter your recovery code</button></p>
      <div class="tour-restore-in" id="tourRestoreIn" hidden><div class="row-btns inv-row"><input class="txt" id="tourVaultIn" type="text" autocomplete="off" spellcheck="false" placeholder="MHR-XXXX-XXXX-XXXX-XXXX-XXXX" aria-label="Recovery code" maxlength="40"><button type="button" class="btn small solid" id="tourVaultUse">Find my copy</button></div><p class="cap" id="tourVaultMsg" role="status"></p><div class="tour-found" id="tourVaultFound" hidden></div></div>`;
function wireRestore() {
  relayHealth().then(h => { const p = $('#tourRestore'); if (p && h && h.vault && tourMode === 'full' && pristine()) p.hidden = false; });
  const b = $('#tourRestoreBtn'); if (b) b.addEventListener('click', () => { $('#tourRestoreIn').hidden = false; $('#tourRestore').hidden = true; $('#tourVaultIn').focus(); });
  /* the same two steps as Settings, Cloud copy, I have a code (ui42.js vaultFlow): find the copy and show what was found, then load it */
  const go = async () => {
    const m = $('#tourVaultMsg'), box = $('#tourVaultFound'); box.hidden = true; box.innerHTML = ''; m.textContent = 'Looking…';
    const f = await vaultFind($('#tourVaultIn').value); if (!$('#tourVaultMsg')) return;
    if (f.err) { m.textContent = f.err; return; }
    if (f.older) { m.textContent = 'The cloud copy is older than the numbers on this device, so nothing was loaded. To load it anyway go to Settings, find Cloud copy and tap I have a code.'; return; }
    m.textContent = '';
    box.innerHTML = `<p data-vf-found>${vaultFoundLine(f)}</p><p>This device has no numbers of its own yet, so nothing is replaced.</p><div class="row-btns"><button type="button" class="btn small solid" id="tourVaultLoad">Load</button><button type="button" class="link" id="tourVaultNo">Cancel</button></div>`; box.hidden = false;
    $('#tourVaultNo').addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; });
    $('#tourVaultLoad').addEventListener('click', async () => {
      try { await vaultUse(f, false); m.textContent = 'Loaded.'; box.hidden = true; sfx('next'); setTimeout(() => cheer('Welcome back. Your numbers are here, and this phone now shares the cloud copy: every change is sent by itself.'), 400); }   /* said after setup closes, so it is seen (QC10 round 3 north-star 4) */
      catch (e) { m.textContent = 'That copy could not be loaded. Nothing was changed.'; }
    });
    sfx('next');
  };
  const u = $('#tourVaultUse'); if (u) { u.addEventListener('click', go); $('#tourVaultIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }); }
}
const TOUR = [
  /* the first screen is the video and nothing else: Mako says what this is and what to do. A copy without the video starts at the next screen. */
  { id: 'video', part: PART.welcome, title: 'Welcome', next: 'Next', skipIf: () => !hasHello, art: () => '',
    body: () => {
      const player = helloFileOk && !helloFailed;
      return `<p class="tour-what">Put in your pay and bills. The Burrow shows what is free to spend and helps you save for the things you want.</p>${player ? helloPlayer() : helloCard()}
      <p class="cap">${player
        ? 'Six minutes from Mako, who made this. It\'s under Help too.' + (helloVideo ? ` <a id="tourVideo" target="_blank" rel="noopener noreferrer" href="${esc(helloVideo.watch)}">Not playing? Open on Google Drive.</a>` : '')
        : 'Six minutes from Mako, who made this. Come back here when you\'re done or skip it. It\'s under Help too.'}</p>
      ${txHTML(player)}
      ${restoreHTML()}`;
    },
    after: wireRestore },
  { id: 'currency', part: PART.welcome, title: 'Currency', art: 'sprig',
    body: () => {
      const cur = (S.ui && S.ui.cur) || '₱', pick = CURS.filter(c => TOUR_CURS.indexOf(c[0]) >= 0).sort((x, y) => TOUR_CURS.indexOf(x[0]) - TOUR_CURS.indexOf(y[0])), rest = CURS.filter(c => TOUR_CURS.indexOf(c[0]) < 0);
      return `${hasHello ? '' : homeScene()}<div class="tour-chips" role="radiogroup" aria-label="Currency">${pick.map(c => chip('tourCur', c[0], c[0], curName(c), c[0] === cur)).join('')}</div>
      <div class="field tour-more"><label for="tourCurMore">Other currency</label><div class="selbox"><select id="tourCurMore"><option value="">Choose currency</option>${rest.map(c => `<option value="${esc(c[0])}"${c[0] === cur ? ' selected' : ''}>${esc(c[1])}</option>`).join('')}</select></div></div>
      <div class="tour-fields"><div class="field"><label for="tourName">First name <span class="opt">(optional)</span></label><div class="inp"><input id="tourName" type="text" maxlength="24" autocomplete="given-name" spellcheck="false" placeholder="First name" value="${esc(firstName())}"></div></div></div>
      <p class="cap">Your numbers stay in this browser and nobody else can see them.</p>
      <p class="cap">${quickSetup() ? 'The first setup is short, just your pay, rent, food and an emergency fund. Finish later at the top stops here and keeps what you typed, and Guided setup under Help opens it again. <button type="button" class="link" id="tourFull">Use the longer setup</button>' : 'Longer setup is on: every bill and goal.'}</p>
      ${hasHello ? '' : restoreHTML()}`;
    },
    after: () => { if (!hasHello) wireRestore(); const f = $('#tourFull'); if (f) f.addEventListener('click', () => { S.ui.full = true; persist(); buildSteps(); f.replaceWith(document.createTextNode('Longer setup is on: every bill and goal.')); }); },
    leave: () => { const el = $('#tourName'); if (el) { const n = cleanName(el.value); if (n) S.ui.name = n; else delete S.ui.name; persist(); } } },
  /* the statements are the setup. The typed screens follow only for what the statements did not answer, or when they were skipped. */
  STEP_CHAT, STEP_SOURCE, STEP_REVIEW,
  STEP_MONEY, STEP_BILLS,
  { dyn: true, setup: true, skipIf: () => importApplied(), steps: () => chosenBills().map(billStep) },
  STEP_JARS,
  STEP_TOOLPICK, { dyn: true, setup: true, steps: () => (S.ui.gset ? S.plan.goals : [{ id: 'rainy' }]).map(g => goalStep(g.id)) }, STEP_SPLIT,
  STEP_REVEAL,
  { id: 'ready', part: PART.spend, title: () => (firstName() ? `Setup done, ${esc(firstName())}` : 'Setup done'), last: true,
    next: () => (S.ui.setup ? 'Done' : 'Go to bills'),
    body: () => {
      if (S.ui.setup) {
        const f = planFacts();
        const line = f.st === 'over' ? `The plan is <b>${fmt2(f.shortBy)}</b> more than your pay.${f.play > 0 ? ` Free to spend is ${fmt2(f.play)}, but the month still comes up short.` : ' Nothing is free to spend yet.'} Under Plan you can lower a bill or a goal, or add more pay.`
          : f.play <= 0 ? 'There\'s nothing in Free to spend in the plan, so raise the Free to spend line under Plan.'
          : f.st === 'spare' ? `Free to spend <b>${fmt2(f.play)}</b> a month. <b>${fmt2(f.L)}</b> of pay is not placed yet, so raise a goal or add to Free to spend.`
          : `Free to spend <b>${fmt2(f.play)}</b> a month, and it's yours to spend on whatever you want. All your other pay is placed.`;
        const V = viewOf(S, f.C, nowYm(), ymd(new Date())), r = V.main, mg = r ? goalById(S, r.id) : null;
        /* the last screen lands on the destination: the goal, the reason in the person's words, when it is full and what each month adds */
        const when0 = r ? (r.pct >= 100 ? 'Full.' : r.reached ? (r.months <= 0 ? 'Full <b>this month</b>.' : `Full <b>${fullLabel(r.reached)}</b>, ${plural(r.months, 'month')} from now.`) : 'Not full within ' + SPAN + ' at this pace.') : '';
        const when = mg ? dw(S, mg, when0) : when0;
        const dep = r ? f.C.byYm[nowYm()].g[r.id].actual : 0;
        const goal = mg ? `<div class="tour-goal" style="--c:var(--c${mg.slot})"><p class="tour-goal-k">Main goal</p><p class="tour-goal-n">${esc(mg.name)}</p>${mg.why ? `<p class="tour-goal-w">${esc(mg.why)}</p>` : ''}
          <div class="hg-b" role="img" aria-label="${r.pct} percent"><i style="width:${Math.min(100, r.pct)}%"></i></div>
          <p class="tour-goal-l"><b>${fmt2(r.savedNow)}</b> saved now${r.saved !== r.savedNow ? `, <b>${fmt2(r.saved)}</b> by the end of ${monthLabel(nowYm(), true)}` : ''}, of ${fmt2(r.target)}.${dep > 0 && r.pct < 100 ? ` Your plan adds <b>${fmt2(dep)}</b> a month.` : ''} ${when}</p></div>` : '';
        const ok = f.st === 'even' || f.st === 'spare';
        /* on the app's own address: one tap keeps an encrypted copy in the cloud, so a lost phone does not mean lost numbers */
        const cloud = typeof vaultAvailable === 'function' && vaultAvailable() && !(vault && vault.on)
          ? `<div class="tour-cloud" id="tourCloud">${LOCK}<div><b>Keep a copy in the cloud</b><p class="cap">Your numbers live in this browser. A cloud copy keeps a second one, locked with a recovery code only you have. On a new phone or after the browser is cleared you open the Burrow, tap Enter your recovery code, type the code in, tap Find my copy, then tap Load and they come back.</p>
            <div class="row-btns"><button type="button" class="btn small solid" id="tourVaultOn">Keep a copy in the cloud</button><span class="cap">Or do it later in Settings, find Cloud copy and tap Keep a copy in the cloud.</span></div><div class="tour-vault-code" id="tourVaultCode"></div></div></div>` : '';
        return `${homeScene()}${ok ? (f.st === 'spare' ? `<p class="tour-st"><span class="chip tight">${IC.warn}Pay not placed</span></p>` : `<p class="tour-st"><span class="chip good">${IC.ok}On plan</span></p>`) : ''}${goal}<p>Your month:</p>${ledgerHTML(f)}<p>${line}</p>
        <p>After setup, the Receipts tab at the top is where you log what you spend or upload each month's statement, and that keeps these numbers true. Whatever is left of Free to spend at the end of the month can go into a goal. The ? button at the bottom right of Home, Receipts, Plan and Settings is Help. It has the video and this setup.</p>${cloud}`;
      }
      const PF = planFactsOf(S, calcAll(S), sel, true), pay = PF.pay, L = PF.L;   /* model.js */
      const zero = S.ui.preset === 'blank' || !!S.ui.cleared;
      const dn = S.ui.done || {}, billsIn = !!dn.bills || Array.isArray(S.ui.sb); /* the bill screens were answered (even if left at zero) */
      const msg = !dn.pay || pay <= 0 ? (billsIn ? 'No pay yet, so Free to spend, the other places and the goals stay at 0 until you add it. To add it go to Plan, then Month, Details, Money in and Salary, or tap Help and then Guided setup to come back here.' : zero ? 'You skipped pay, so everything is zero until you add numbers.' : 'No pay yet, so the numbers are samples. To add yours go to Plan, then Month, Details, Money in and Salary, or tap Help and then Guided setup to come back here.')
        : L > 0 ? `Pay entered. <b>${fmt2(L)}</b> is not placed yet, so raise a goal or add to Free to spend.`
        : L < 0 ? `Pay entered. The ${billsIn ? 'plan' : 'sample plan'} is <b>${fmt2(PF.shortBy)}</b> more than your pay${billsIn ? '' : ' because bills are still samples'}. ${billsIn ? 'Lower a bill under Plan.' : 'Enter your real bills next.'}`
        : 'Pay entered. All of it is placed.';
      const bills = zero && !(necTotal() > 0) ? 'Bills and burrows are empty, so open Plan, go to Monthly bills and enter what you pay.'
        : billsIn ? (necTotal() > 0 ? 'Your bills are in. If a line is still at zero you can set it under Plan in Monthly bills.' : 'Your bills are all at zero so far, so set each line under Plan in Monthly bills.')
        : 'Bills and burrows are still samples. Open Plan, go to Monthly bills and set each line, or use <b>Set all to zero</b> in Settings.';
      return `${homeScene()}<p>${msg}</p>
      <p>${bills}</p>
      <p>Help at the bottom right has the video and the setup.</p>`;
    },
    after: () => {
      const b = $('#tourVaultOn'); if (!b) return;
      b.addEventListener('click', async () => {
        b.disabled = true;
        try { const code = await vaultTurnOn(); b.closest('.row-btns').hidden = true; vaultShowCode($('#tourVaultCode'), code); sfx('next'); } catch (e) { b.disabled = false; return; }
        /* the code is the last thing on the screen and the footer floats over the end of it: bring it fully into view */
        const t = $('#tourScroll'); requestAnimationFrame(() => t.scrollTo({ top: t.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
      });
    } },
];

/* the steps for the tour that is open now: the setup screens only in the full tour, and the bills and goals you chose */
let tourJump = null; /* set by a step's leave to name the screen that comes next, instead of the one after it */
function buildSteps() {
  const keep = TS[tourN] && TS[tourN].id; TS = [];
  TOUR.forEach(s => {
    if (s.setup && tourMode !== 'full') return;
    if (s.skipIf && s.skipIf()) return;
    if (s.dyn) { s.steps().forEach(x => TS.push(x)); return; }
    if (s.when && !s.when()) return;
    TS.push(s);
  });
  if (keep) { const i = TS.findIndex(x => x.id === keep); if (i >= 0) tourN = i; }
  tourN = Math.max(0, Math.min(TS.length - 1, tourN));
}

function tourFocusables() { return $$('#tour button:not([hidden]), #tour a[href], #tour input, #tour select').filter(e => !e.disabled && e.offsetParent !== null); }
function renderTour(dir) {
  const t = TS[tourN], title = typeof t.title === 'function' ? t.title() : t.title;
  const same = TS.filter(x => x.part === t.part), first = same.indexOf(t), count = same.length;
  /* until the person has ticked which bills or goals they have, the length of the part is not known yet, so the label leaves the total out */
  const pend = same.some((x, i) => x.pick && i >= first) || (t.id === 'pay' && !payNow());
  const keys = Object.values(PART).filter(k => TS.some(x => x.part === k)), at = Math.max(0, keys.indexOf(t.part));   /* only parts this setup has, so the count never skips a number (38.31 wording and layout round 3) */
  /* one count for the whole setup, the same as the progress bar: one segment per part */
  $('#tourPart').textContent = t.part;   /* no "of N": the count could change mid-setup (Mako, 2026-11-19); the dots show progress */
  $('#tourDots').innerHTML = keys.map((k, i) => `<i class="${i < at ? 'past' : i === at ? 'on' : ''}"><b style="width:${i < at ? 100 : i > at ? 0 : Math.round((first + 1) / count * 100)}%"></b></i>`).join('');
  $('#tourDots').setAttribute('aria-label', `${t.part}, setup progress`);
  tourTouched = false;
  const body = $('#tourBody'); body.innerHTML = `<h2 id="tourTitle" tabindex="-1">${title}</h2>${t.body()}`;
  const kind = typeof t.art === 'function' ? t.art() : t.art !== undefined ? t.art : ART_BY_PART[t.part]; $('#tourArt').innerHTML = kind ? art(kind) : '';
  moneyUpAll(body); requestAnimationFrame(fitTourArt);
  body.classList.remove('in-r', 'in-l'); if (dir) { void body.offsetWidth; body.classList.add(dir > 0 ? 'in-r' : 'in-l'); }
  const setupRun = tourMode === 'full' && TS.some(x => x.setup);
  $('#tourSkip').textContent = setupRun ? 'Finish later' : 'Skip'; $('#tourSkip').hidden = !!t.last && setupRun;
  $('#tourBack').hidden = tourN === 0; $('.tour-foot').classList.toggle('last', !!t.last); $('#tour').classList.toggle('last', !!t.last);
  const nx = $('#tourNext'), label = typeof t.next === 'function' ? t.next() : t.next; nx.hidden = label === false; nx.textContent = label || 'Next'; nx.classList.toggle('solid', !t.nextPlain); $('#tourAlt').hidden = !(t.last && !S.ui.setup);
  paintSnd();
  $$('#tour .cs').forEach(e => { e.textContent = sym(); });
  if (t.id === 'video') wireHello(); else helloStop();
  if (t.after) t.after();
  if (t.show) t.show();
  if (t.id !== 'reveal') { const ch = $('#cheer'); if (ch && ch.classList.contains('on')) { clearTimeout(CONF.cheerT); ch.classList.remove('on'); } }
  if (tourMode === 'full') { S.ui.tourAt = t.id; persist(); }
  $('#tour').classList.toggle('welcome', t.part === PART.welcome || !!t.last);
  const f = t.focus ? $(t.focus, $('#tourBody')) : null; (f || $('#tourTitle')).focus({ preventScroll: true }); $('#tourScroll').scrollTop = 0;
}
function paintSnd() {
  const on = !(S.ui && S.ui.mute), b = $('#tourSnd'), sw = $('#setSnd');
  if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Sound on. Turn off' : 'Sound off. Turn on'); b.classList.toggle('off', !on); b.textContent = on ? 'Sound on' : 'Sound off'; }
  if (sw) { sw.setAttribute('aria-checked', String(on)); const t = $('#sndTxt'); if (t) t.textContent = on ? 'On' : 'Off'; }
}
function toggleSnd() { DJ.setMute(!S.ui.mute); sfx('tap'); }
function syncSoundSwitch() { paintSnd(); }
/* the setup's art sits low in the column. When a screen's words or fields reach down to where it sits (short windows, long screens),
   the art steps aside instead of lying over them. Measured with offsets, which ignore the slide-in animation. */
function fitTourArt() {
  const a = $('#tourArt .art'); if (!a) return;
  const body = $('#tourBody');
  const ax = a.offsetLeft, ay = a.offsetTop, ax2 = ax + a.offsetWidth, ay2 = ay + a.offsetHeight;
  const hit = [...body.children].some(el => {
    const x = body.offsetLeft + el.offsetLeft, y = body.offsetTop + el.offsetTop, x2 = x + el.offsetWidth, y2 = y + el.offsetHeight;
    return el.offsetWidth > 0 && y2 > ay && y < ay2 && x2 > ax && x < ax2;
  });
  a.classList.toggle('aside', hit);
}
function paintMus() {
  const on = MUSIC.on(), b = $('#tourMus'), sw = $('#setMus');
  if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Music on. Turn off' : 'Music off. Turn on'); b.classList.toggle('off', !on); b.textContent = on ? 'Music on' : 'Music off'; }
  if (sw) { sw.setAttribute('aria-checked', String(on)); const t = $('#musTxt'); if (t) t.textContent = on ? 'On' : 'Off'; }
}
function toggleMus() { DJ.setSrc(MUSIC.on() ? 'off' : (S.ui.dj && S.ui.dj.src) || 'forest', true); sfx('tap'); }
function showTourShell() { $('#tour').hidden = false; $('.wrap').inert = true; $('#dock').inert = true; helpAside(true); }
/* at: the id of the screen to open on. mode: 'full' asks the questions, 'replay' only shows the screens. */
function openTour(at, mode) {
  tourMode = mode || (S.ui.setup ? 'replay' : 'full'); tourIsOpen = true; document.body.classList.add('touring'); tourReturn = document.activeElement; tourN = 0; TS = []; buildSteps();
  let i = typeof at === 'string' ? TS.findIndex(s => s.id === at) : -1;
  if (i < 0 && tourMode === 'full' && S.ui.toured) { const want = S.ui.tourAt && TS.some(s => s.id === S.ui.tourAt && s.setup) ? S.ui.tourAt : 'source'; i = TS.findIndex(s => s.id === want); }
  tourN = Math.max(0, i); showTourShell(); renderTour(0); sfx('whoosh'); MUSIC.wake();
}
let RESPLIT_SNAP = null;   /* the copy taken when Re-split pay opens the setup steps, so closing them can offer Undo */
/* Guided setup run again over a plan the person already has (38.31 data safety round: it changed pay and saved amounts with no copy and no Undo):
   the same copy as Re-split pay, kept in the saved plan too, so Undo is offered when setup closes, or after a reload if the page was closed part-way */
/* a copy of the numbers from before a big change (setup run again, a backup loaded), kept in the saved plan for 3 days so Undo survives a reload
   (38.31 data safety round 2). Only the newest is kept, and a copy never holds an older copy inside it */
const KEEP_DAYS = 3;
function snapNoCopy() { const c = JSON.parse(JSON.stringify(S)); if (c.ui) { delete c.ui.keep; delete c.ui.preSplit; } return JSON.stringify(c); }
function keepCopy(snap, why) { S.ui.keep = { snap, t: Date.now(), why }; }
function openSetupWithCopy(at, mode) {
  if (typeof hasData === 'function' && hasData(S) && !RESPLIT_SNAP) { RESPLIT_SNAP = snapNoCopy(); S.ui.preSplit = RESPLIT_SNAP; persist(); }
  openTour(at, mode);
}
function closeTour(toBills, done) {
  pauseHello(); helloStop(); tourIsOpen = false; document.body.classList.remove('touring'); clearTimeout(asT); MUSIC.tourClosed();
  S.ui.toured = true; if (done) delete S.ui.tourAt;
  persist();
  $('#tour').hidden = true; $('.wrap').inert = false; $('#dock').inert = false; helpAside(false);
  TS = [];
  restructure();
  if (RESPLIT_SNAP) { const sn = RESPLIT_SNAP; RESPLIT_SNAP = null; delete S.ui.preSplit;
    let changed = false; try { const o = JSON.parse(sn); changed = JSON.stringify([o.plan, o.steps, o.once, o.items, o.cfg]) !== JSON.stringify([S.plan, S.steps, S.once, S.items, S.cfg]); } catch (e) { }
    if (changed) { keepCopy(sn, 'Setup changed your plan.'); if (window.offerUndoG) window.offerUndoG(sn, `Setup changed your plan. You can undo for ${KEEP_DAYS} days.`); }
    persist(); }
  if (toBills) { S.ui.seen = Object.assign(S.ui.seen || {}, { month: true }); switchTab('month'); openRow('nec'); }
  else {
    scrollTo({ top: 0 }); if (done) WORLD.settle();
    if (done && tab !== 'home' && !WORLD.isOn()) switchTab('home');
    else if (tourReturn && tourReturn.focus) try { tourReturn.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  }
  /* nothing to return to (the first setup): the keyboard starts at the tabs, not at the floating Ask and Help pills (38.31 layout round 3) */
  if (!document.activeElement || document.activeElement === document.body || $('#tour').contains(document.activeElement)) { const tb = $('[role="tab"][aria-selected="true"]') || $('#tab-home'); if (tb) try { tb.focus({ preventScroll: true }); } catch (e) { /* hidden */ } }
}
/* every change on the screen is written straight away, so closing, reloading or tapping somewhere else never loses it */
let asT = 0;
function autosave(now) {
  clearTimeout(asT);
  const run = () => {
    if (!tourIsOpen || tourMode !== 'full') return;
    const cur = TS[tourN]; if (!cur || !cur.leave) return;
    try { if (cur.pick) { if (tourTouched) cur.leave(1); } else cur.leave(0); } catch (e) { /* the next change tries again */ }
  };
  if (now) run(); else asT = setTimeout(run, 200);
}
function tourStep(d) {
  if (!tourIsOpen || !TS[tourN]) return;   /* a second tap on Done after the tour has closed */
  pauseHello(); autosave(true);
  const cur = TS[tourN];
  if (!cur) return;
  if (cur.leave) { cur.leave(d); schedule(); }   /* the header behind setup follows what was just typed: "your pay", not "the sample pay" (38.31 number gate round 3) */
  if (d > 0 && cur.last) { closeTour(!S.ui.setup, true); sfx('fanfare'); return; }
  /* opened from Home only to make the numbers exact: done after the review (or the skip) */
  if (d > 0 && impOnly && (cur.id === 'source' || cur.id === 'review')) { impOnly = false; tourJump = null; closeTour(false, true); sfx('fanfare'); return; }
  const was = TS.map(s => s.id), at = was.indexOf(cur.id);
  buildSteps();
  let nx = tourN + d;
  if (TS[tourN] !== cur) {
    /* the screen just left is gone from the list (a review once applied, a step whose condition changed): step from where it stood */
    if (d > 0) { nx = TS.findIndex(s => was.indexOf(s.id) < 0 || was.indexOf(s.id) > at); if (nx < 0) nx = TS.length - 1; }
    else { nx = 0; TS.forEach((s, i) => { if (was.indexOf(s.id) >= 0 && was.indexOf(s.id) < at) nx = i; }); }
  }
  if (tourJump) { const j = TS.findIndex(s => s.id === tourJump); tourJump = null; if (j >= 0) nx = j; }
  tourN = Math.max(0, Math.min(TS.length - 1, nx)); renderTour(d); sfx(d > 0 ? 'next' : 'back');
  if (d > 0 && TS[tourN].id === 'reveal' && havePay()) { const f = planFacts(); if (f.st !== 'over' && f.play > 0) { celebrate('big', 'This is yours to spend.'); sfx('fanfare'); } }
}
function gotoStep(id) { buildSteps(); const i = TS.findIndex(x => x.id === id); if (i < 0) return; tourN = i; renderTour(1); sfx('next'); }
function leaveTour() { autosave(true); closeTour(false); }
function wireTour() {
  $('#tourNext').addEventListener('click', () => tourStep(1));
  $('#tourBack').addEventListener('click', () => tourStep(-1));
  $('#tourAlt').addEventListener('click', () => closeTour(false, true));
  $('#tourSkip').addEventListener('click', leaveTour);
  $('#tourSnd').addEventListener('click', toggleSnd); $('#setSnd').addEventListener('click', toggleSnd);
  $('#tourMus').addEventListener('click', toggleMus); $('#setMus').addEventListener('click', toggleMus); paintMus();
  addEventListener('resize', () => { if (tourIsOpen) fitTourArt(); });
  const body = $('#tourBody');
  body.addEventListener('input', e => { tourTouched = true; tourExtraInput(e); autosave(); });
  body.addEventListener('click', e => { if (!tourExtraClick(e) && e.target.closest('button:not(.tx-l), a.btn')) sfx('tap'); });
  body.addEventListener('change', e => {
    const t = e.target; tourTouched = true;
    if (t.name === 'tourCur') { setTourCur(t.value); sfx('tap'); }
    else if (t.id === 'tourCurMore') { if (t.value) setTourCur(t.value); sfx('tap'); }
    else if (t.name === 'tourBill' || t.name === 'tourGoalPick') { t.closest('.chip').classList.toggle('on', t.checked); sfx(t.checked ? 'on' : 'off'); }
    else if (t.name === 'tourEm') { $$('#tourBody input[name=tourEm]').forEach(i => i.closest('.chip').classList.toggle('on', i.checked)); $('#tourEmCap').innerHTML = emCap(+t.value); sfx('tap'); }
    else tourExtraChange(e);
    autosave();
  });
  body.addEventListener('focusout', () => autosave());
  $('#tour').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); leaveTour(); return; }
    if (e.key === 'Enter' && e.target.matches('[data-subamt], .so-n, .so-a, #tourCardT, #tourCardB')) { e.preventDefault(); e.target.blur(); return; }
    if (e.key === 'Enter' && e.target.matches('#onbIn')) { e.preventDefault(); const v = e.target.value; e.target.value = ''; onbAsk(v); return; }
    if (e.key === 'Enter' && e.target.matches('[data-onbname]')) { e.preventDefault(); const g = $('#onbGo'); if (g) g.click(); return; }
    if (e.key === 'Enter' && e.target.matches('#tourBody input:not([type=range]):not([type=checkbox]):not([type=radio]):not(#tourVaultIn)')) { e.preventDefault(); tourStep(1); return; }   /* Enter in the recovery code box finds the copy, it does not move setup on (QC10 round 2) */
    if (e.key !== 'Tab') return;
    const f = tourFocusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement.id === 'tourTitle')) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* a closed tab or a phone that locks the screen must not lose the last thing typed */
  window.addEventListener('pagehide', () => autosave(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosave(true); });
  $('#tourOpen2').addEventListener('click', () => openSetupWithCopy(0));

}
