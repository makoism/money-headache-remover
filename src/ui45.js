
/* ---------- the first-open tour: welcome, the video, then the setup questions ---------- */
let tourN = 0, tourIsOpen = false, tourReturn = null, tourMode = 'full', TS = [], tourDir = 0;
const num0 = v => clampAmt(v);
const firstName = () => (S.ui && S.ui.name) || '';

/* a small house at dusk with one warm window: the welcome and the goodbye */
function homeScene() {
  return `<svg class="tour-fig tour-scene" viewBox="44 30 232 108" role="img" aria-label="A small house at dusk with one warm, lit window">
    <defs><linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2347"/><stop offset="1" stop-color="#4a4a82"/></linearGradient>
    <radialGradient id="hsGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="150" rx="22" fill="url(#hsSky)"/>
    <g fill="#fff"><circle cx="38" cy="26" r="1.5" opacity=".8"/><circle cx="84" cy="14" r="1.1" opacity=".7"/><circle cx="124" cy="30" r="1.3" opacity=".6"/><circle cx="236" cy="16" r="1.6" opacity=".85"/><circle cx="284" cy="42" r="1.2" opacity=".7"/><circle cx="262" cy="22" r="1" opacity=".6"/><circle cx="206" cy="38" r="1.1" opacity=".55"/><circle cx="70" cy="44" r="1.3" opacity=".75"/><circle cx="118" cy="40" r="1.1" opacity=".6"/><circle cx="96" cy="58" r="1" opacity=".5"/><circle cx="238" cy="48" r="1.4" opacity=".8"/><circle cx="256" cy="38" r="1.1" opacity=".6"/></g>
    <path d="M0 116 Q80 94 160 110 T320 102 V150 H0 Z" fill="#2d3366"/><path d="M0 132 Q100 118 190 130 T320 126 V150 H0 Z" fill="#232853"/>
    <circle cx="148" cy="99" r="54" fill="url(#hsGlow)"/>
    <rect x="180" y="46" width="12" height="24" fill="#2c3263"/><path d="M186 41 q-6 -4.5 0 -9" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
    <rect x="116" y="72" width="88" height="56" rx="4" fill="#4b5190"/><polygon points="106,76 160,40 214,76" fill="#2c3263"/>
    <rect x="132" y="86" width="30" height="26" rx="3" fill="#ffd27a"/><path d="M147 86 V112 M132 99 H162" stroke="#c98a2e" stroke-width="2" opacity=".7"/>
    <path d="M176 128 V108 a8 8 0 0 1 16 0 V128 Z" fill="#2c3263"/><circle cx="188" cy="118" r="1.4" fill="#ffd27a"/>
    <rect x="62" y="108" width="4" height="22" fill="#232853"/><circle cx="64" cy="102" r="15" fill="#2f6a6e"/><circle cx="58" cy="109" r="9" fill="#2b5f63"/>
  </svg>`;
}
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

/* choices on the welcome screens are real radio buttons, drawn as soft chips */
const TOUR_CURS = ['₱', '$', '€', '£', '¥', 'A$'];
const curName = c => c[1].indexOf(c[0] + ' ') === 0 ? c[1].slice(c[0].length + 1) : c[1];
const chip = (name, value, big, label, on) => `<label class="chip${on ? ' on' : ''}"><input type="radio" name="${name}" value="${esc(value)}"${on ? ' checked' : ''}>${big ? `<b>${esc(big)}</b>` : ''}<span>${esc(label)}</span></label>`;
function syncTourCur() {
  const cur = (S.ui && S.ui.cur) || '₱';
  $$('#tourBody input[name=tourCur]').forEach(i => { i.checked = i.value === cur; i.closest('.chip').classList.toggle('on', i.checked); });
  const more = $('#tourCurMore'); if (more) more.value = TOUR_CURS.indexOf(cur) < 0 ? cur : '';
}
function setTourCur(v) { if (!CURS.some(c => c[0] === v)) return; if (changeCurrency(v)) restructure(); syncTourCur(); $$('#tour .cs').forEach(e => { e.textContent = sym(); }); }

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
const helloPlayer = () => { const f = helloSrc(), blob = helloBlob(), have = !blob || !!helloUrls[f], src = blob ? helloUrls[f] || '' : f; return `<div class="tour-vframe${have ? '' : ' loading'}" id="tourVF"><video id="tourVid" preload="metadata" playsinline poster="${esc(HELLO_POSTER)}"${src ? ` src="${esc(src)}"` : ''} aria-label="A short hello video"></video><button type="button" class="tour-play" id="tourPlay" aria-label="Play the video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></button><div class="tour-load" id="tourLoad" role="status"><span>Getting the video ready <em id="tourLoadPct" aria-hidden="true">0%</em></span><i aria-hidden="true"><b id="tourLoadBar"></b></i></div></div>
  <div class="tour-speed" id="tourSpeed" role="group" aria-label="Playback speed"><span>Speed</span>${HELLO_RATES.map(r => `<button type="button" data-rate="${r}" aria-pressed="${r === helloRate}">${r}x</button>`).join('')}</div>`; };
const helloCard = () => helloVideo
  ? `<div class="row-btns"><a class="tour-video" id="tourVideo" target="_blank" rel="noopener noreferrer" href="${esc(helloVideo.watch)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" opacity=".18"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg><span><b>Watch the video</b><small>Opens in a new tab</small></span></a></div>`
  : '<p class="cap">Video did not load. Skip it and continue.</p>';
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
  /* with no player the transcript is the whole text on one long screen, so it starts folded */
  if (!synced) return `<details class="tx-fold"><summary>Read the transcript</summary><section class="tx plain" id="tourTx" aria-label="Transcript"><div class="tx-h"><b>Transcript</b><button type="button" class="link" id="txNow" hidden>Back to now</button></div>${list}</section></details>`;
  return `<section class="tx" id="tourTx" aria-label="Transcript"><div class="tx-h"><b>Transcript</b><button type="button" class="link" id="txNow" hidden>Back to now</button></div>${list}</section>`;
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

const TOUR = [
  { id: 'hello', part: PART.welcome, title: 'Welcome', next: 'Continue',
    body: () => `${homeScene()}
      <p>Know where your money stands, and what it is working toward.</p>
      <ul class="tour-get"><li>Your month on one screen.</li><li>Play money you can spend with no guilt.</li><li>Each goal, and the date you reach it.</li></ul>
      <p class="cap">Setup takes about ten minutes, one question at a time. Stop any time.</p>
      <p class="tour-safe">${LOCK}<span>Data stays in this browser. Nobody else can see it.</span></p>
      <p class="cap tour-restore" id="tourRestore" hidden><button type="button" class="link" id="tourRestoreBtn">Used this before on another phone? Enter your recovery code.</button></p>
      <div class="tour-restore-in" id="tourRestoreIn" hidden><div class="row-btns inv-row"><input class="txt" id="tourVaultIn" type="text" autocomplete="off" spellcheck="false" placeholder="MHR-XXXX-XXXX-XXXX-XXXX-XXXX" aria-label="Recovery code" maxlength="40"><button type="button" class="btn small solid" id="tourVaultUse">Load</button></div><p class="cap" id="tourVaultMsg" role="status"></p></div>
      <div class="tour-fields"><div class="field"><label for="tourName">First name <span class="opt">(optional)</span></label><div class="inp"><input id="tourName" type="text" maxlength="24" autocomplete="given-name" spellcheck="false" placeholder="First name" value="${esc(firstName())}"></div></div></div>`,
    after: () => {
      /* the recovery link shows only where a cloud copy can exist; typing a code loads it and closes the setup */
      relayHealth().then(h => { const p = $('#tourRestore'); if (p && h && h.vault && tourMode === 'full' && pristine()) p.hidden = false; });
      const b = $('#tourRestoreBtn'); if (b) b.addEventListener('click', () => { $('#tourRestoreIn').hidden = false; $('#tourRestore').hidden = true; $('#tourVaultIn').focus(); });
      const go = async () => { const ok = await vaultRestore($('#tourVaultIn').value, $('#tourVaultMsg')); if (ok) cheer('Welcome back.'); };
      const u = $('#tourVaultUse'); if (u) { u.addEventListener('click', go); $('#tourVaultIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }); }
    },
    leave: () => { const el = $('#tourName'); if (el) { const n = cleanName(el.value); if (n) S.ui.name = n; else delete S.ui.name; persist(); } } },
  { id: 'currency', part: PART.welcome, title: 'Currency',
    body: () => {
      const cur = (S.ui && S.ui.cur) || '₱', pick = CURS.filter(c => TOUR_CURS.indexOf(c[0]) >= 0).sort((x, y) => TOUR_CURS.indexOf(x[0]) - TOUR_CURS.indexOf(y[0])), rest = CURS.filter(c => TOUR_CURS.indexOf(c[0]) < 0);
      return `<div class="tour-chips" role="radiogroup" aria-label="Currency">${pick.map(c => chip('tourCur', c[0], c[0], curName(c), c[0] === cur)).join('')}</div>
      <div class="field tour-more"><label for="tourCurMore">Other currency</label><div class="selbox"><select id="tourCurMore"><option value="">Choose currency</option>${rest.map(c => `<option value="${esc(c[0])}"${c[0] === cur ? ' selected' : ''}>${esc(c[1])}</option>`).join('')}</select></div></div>`;
    } },
  ...(hasHello ? [{ id: 'video', part: PART.welcome, title: 'Intro video', next: () => (tourMode === 'full' ? 'Start setup' : 'Next'),
    body: () => {
      const player = helloFileOk && !helloFailed;
      return `<p>A short video from Mako, who built this.</p>
      ${player ? helloPlayer() : helloCard()}
      <p class="cap">${player
        ? 'About six minutes. Also under Help.' + (helloVideo ? ` <a id="tourVideo" target="_blank" rel="noopener noreferrer" href="${esc(helloVideo.watch)}">Not playing? Open on Google Drive.</a>` : '')
        : 'About six minutes. Return here when done, or skip. Also under Help.'}</p>
      ${txHTML(player)}`;
    } }] : []),
  STEP_SOURCE, STEP_REVIEW,
  ...[STEP_PAY, STEP_EXTRA, STEP_BANK, STEP_FLOOR, STEP_BILLS].map(s => Object.assign({}, s, { skipIf: importApplied })),
  { dyn: true, setup: true, skipIf: importApplied, steps: () => chosenBills().map(billStep) },
  { id: 'jobs', part: PART.jars, title: 'Six jars',
    body: () => {
      return `<p>Bills are the first jar: Necessities. The rest of your pay is divided between the other five. Usual shares of take-home pay:</p>
      <div class="tour-fig"><div class="bar tour-bar" role="img" aria-label="Pay split into six jars">${JARS.map(j => `<div class="seg-b ${JARCLS[j.id]}" style="flex-grow:${j.usual * 100}"></div>`).join('')}</div>
      <div class="legend">${JARS.map(j => `<span><i class="${JARCLS[j.id]}"></i>${j.name} ${Math.round(j.usual * 100)}%</span>`).join('')}</div></div>
      <p class="cap">Shares are a guide, not a rule. Next: what each jar is for, then split your own pay.</p>`;
    } },
  { id: 'shrine', part: PART.jars, title: 'Jar purposes', body: shrineBody },
  STEP_JARS,
  STEP_TOOLPICK, { dyn: true, setup: true, steps: () => (S.ui.gset ? S.plan.goals : [{ id: 'rainy' }]).map(g => goalStep(g.id)) }, STEP_SPLIT,
  STEP_REVEAL,
  { id: 'remind', part: PART.habit, title: 'Set a reminder',
    body: () => `<p>The plan only works if it matches real spending. Choose how often to be reminded to log receipts. Weekly is a good start.${askImg ? ' Screenshots work too: give them to Ask Claude under Help and check the result.' : ''}</p>
      <div class="tour-fig tour-remind">${remindFieldsHTML('tour')}
      <div class="cal-btns" id="tourCal">${calBtnsInner()}</div><p class="cal-msg cap" id="tourCalMsg" role="status"></p>
      <p class="cap">${inArtifact() ? 'Google Calendar repeats it. Outlook, Microsoft 365 and Yahoo open a one-time event: set the repeat there. Apple and others show text to copy.' : 'Google Calendar and the downloaded file repeat it. Outlook, Microsoft 365 and Yahoo open a one-time event: set the repeat there.'} Set for <span id="tourWhen"></span>.</p></div>` },
  { id: 'ready', part: PART.habit, title: () => (firstName() ? `Setup done, ${esc(firstName())}.` : 'Setup done.'), last: true,
    next: () => (S.ui.setup ? 'View month' : 'Go to bills'),
    body: () => {
      if (S.ui.setup) {
        const f = planFacts();
        const line = f.st === 'over' ? `Plan exceeds pay by <b>${fmt(-f.L)}</b>. No play money yet. Lower a bill under Plan.`
          : f.play <= 0 ? 'No play money in the plan. Raise the Play line under Plan.'
          : f.st === 'spare' ? `Play money <b>${fmt(f.play)}</b> a month. <b>${fmt(f.L)}</b> of pay is unassigned: raise a goal or add to play money.`
          : `Play money <b>${fmt(f.play)}</b> a month, to spend without guilt. All other pay is assigned.`;
        const V = viewOf(S, f.C, nowYm(), ymd(new Date())), r = V.main, mg = r ? goalById(S, r.id) : null;
        const goal = mg ? `Main goal: <b>${esc(mg.name)}</b>. ${r.pct >= 100 ? 'Full.' : r.reached ? (r.months <= 0 ? 'Full <b>this month</b>.' : `<b>${plural(r.months, 'month')}</b> to go. Full ${fullLabel(r.reached)}.`) : 'Not full within ' + SPAN + ' at this pace.'}` : '';
        const ok = f.st === 'even' || f.st === 'spare';
        return `${homeScene()}${ok ? `<p class="tour-st"><span class="chip good">${IC.ok}On plan</span></p>` : ''}<p>Your month:</p>${ledgerHTML(f)}<p>${line}</p>${goal ? `<p>${goal}</p>` : ''}
        <p>Plan: edit any line. Receipts: log what you spend, so this stays true. Help (bottom right) replays this tour and shows each tab.</p>`;
      }
      const m = calcAll(S).byYm[sel], pay = m.a + m.b + m.side, L = m.pool.left;
      const zero = S.ui.preset === 'blank' || !!S.ui.cleared;
      const msg = !(S.ui.done && S.ui.done.pay) || pay <= 0 ? (zero ? 'Pay skipped. Everything is zero until you add numbers.' : 'Pay skipped. Numbers are samples until you add yours.')
        : L > 0 ? `Pay entered. <b>${fmt(L)}</b> is unassigned: raise a goal or add to play money.`
        : L < 0 ? `Pay entered. The sample plan exceeds pay by <b>${fmt(-L)}</b> because bills are still samples. Enter your real bills next.`
        : 'Pay entered. All of it is assigned.';
      return `${homeScene()}<p>${msg}</p>
      <p>${zero ? 'Bills and goals are empty. Open Plan, Necessities, and enter what you pay.' : 'Bills and goals are still samples. Open Plan, Necessities, and set each line. Or use <b>Zero all</b> in Settings.'}</p>
      <p>Help (bottom right) replays this tour and the setup.</p>`;
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
  $('#tourPart').textContent = pend ? `${t.part} · ${first + 1}` : `${t.part} · ${first + 1} of ${count}`;
  const keys = TS.map(x => x.part).filter((p, i, a) => a.indexOf(p) === i), at = keys.indexOf(t.part);
  $('#tourDots').innerHTML = keys.map((k, i) => `<i class="${i < at ? 'past' : i === at ? 'on' : ''}"><b style="width:${i < at ? 100 : i > at ? 0 : Math.round((first + 1) / count * 100)}%"></b></i>`).join('');
  $('#tourDots').setAttribute('aria-label', pend ? `${t.part}, step ${first + 1}` : `${t.part}, step ${first + 1} of ${count}`);
  tourTouched = false;
  const body = $('#tourBody'); body.innerHTML = `<h2 id="tourTitle" tabindex="-1">${title}</h2>${t.body()}`;
  moneyUpAll(body);
  body.classList.remove('in-r', 'in-l'); if (dir) { void body.offsetWidth; body.classList.add(dir > 0 ? 'in-r' : 'in-l'); }
  const hasSetup = tourMode === 'full' && same.some(x => x.setup);
  $('#tourSkip').textContent = hasSetup ? 'Finish later' : 'Skip tour'; $('#tourPartSkip').hidden = !hasSetup;
  $('#tourBack').hidden = tourN === 0; $('.tour-foot').classList.toggle('last', !!t.last);
  const nx = $('#tourNext'); nx.textContent = (typeof t.next === 'function' ? t.next() : t.next) || 'Next'; $('#tourAlt').hidden = !(t.last && !S.ui.setup);
  paintSnd();
  $$('#tour .cs').forEach(e => { e.textContent = sym(); });
  if (t.id === 'remind') tourReminder();
  if (t.id === 'video') wireHello(); else helloStop();
  if (t.after) t.after();
  if (t.show) t.show();
  if (t.id !== 'reveal') { const ch = $('#cheer'); if (ch && ch.classList.contains('on')) { clearTimeout(CONF.cheerT); ch.classList.remove('on'); } }
  if (tourMode === 'full') { S.ui.tourAt = t.id; persist(); }
  $('#tour').classList.toggle('welcome', t.part === PART.welcome || !!t.last);
  const f = t.focus ? $(t.focus, $('#tourBody')) : null; (f || $('#tourTitle')).focus({ preventScroll: true }); $('#tour').scrollTop = 0;
}
function paintSnd() {
  const on = !(S.ui && S.ui.mute), b = $('#tourSnd'), sw = $('#setSnd');
  if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Sound on. Turn off' : 'Sound off. Turn on'); b.classList.toggle('off', !on); b.textContent = on ? 'Sound on' : 'Sound off'; }
  if (sw) { sw.setAttribute('aria-checked', String(on)); const t = $('#sndTxt'); if (t) t.textContent = on ? 'On' : 'Off'; }
}
function toggleSnd() { if (S.ui.mute) delete S.ui.mute; else S.ui.mute = true; persist(); paintSnd(); sfx('tap'); }
function tourReminder() {
  const o = reminderOf(); remindShow($('#tourBody'), o);
  calFill($('#tourCal'), o);
  $('#tourWhen').textContent = reminderWhen(o);
}
function showTourShell() { $('#tour').hidden = false; $('.wrap').inert = true; $('#dock').inert = true; helpAside(true); }
/* at: the id of the screen to open on. mode: 'full' asks the questions, 'replay' only shows the screens. */
function openTour(at, mode) {
  tourMode = mode || (S.ui.setup ? 'replay' : 'full'); tourIsOpen = true; tourReturn = document.activeElement; tourN = 0; TS = []; buildSteps();
  let i = typeof at === 'string' ? TS.findIndex(s => s.id === at) : -1;
  if (i < 0 && tourMode === 'full' && S.ui.toured) { const want = S.ui.tourAt && TS.some(s => s.id === S.ui.tourAt && s.setup) ? S.ui.tourAt : 'pay'; i = TS.findIndex(s => s.id === want); }
  tourN = Math.max(0, i); showTourShell(); renderTour(0); sfx('whoosh');
}
function closeTour(toBills, done) {
  pauseHello(); helloStop(); tourIsOpen = false; clearTimeout(asT);
  S.ui.toured = true; if (done) delete S.ui.tourAt;
  persist();
  $('#tour').hidden = true; $('.wrap').inert = false; $('#dock').inert = false; helpAside(false);
  TS = [];
  restructure();
  if (toBills) { S.ui.seen = Object.assign(S.ui.seen || {}, { month: true }); switchTab('month'); openRow('nec'); }
  else {
    scrollTo({ top: 0 });
    if (done) { if (tab !== 'home') switchTab('home'); else maybeTabTour('home'); }
    else if (tourReturn && tourReturn.focus) try { tourReturn.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  }
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
  pauseHello(); autosave(true);
  const cur = TS[tourN];
  if (cur.leave) cur.leave(d);
  if (d > 0 && cur.last) { closeTour(!S.ui.setup, true); sfx('fanfare'); return; }
  buildSteps();
  let nx = tourN + d;
  if (tourJump) { const j = TS.findIndex(s => s.id === tourJump); tourJump = null; if (j >= 0) nx = j; }
  tourN = Math.max(0, Math.min(TS.length - 1, nx)); renderTour(d); sfx(d > 0 ? 'next' : 'back');
  if (d > 0 && TS[tourN].id === 'reveal' && havePay()) { celebrate('big', 'Play money, one number.'); sfx('fanfare'); }
}
function gotoStep(id) { buildSteps(); const i = TS.findIndex(x => x.id === id); if (i < 0) return; tourN = i; renderTour(1); sfx('next'); }
/* jump to the first screen of the next part, keeping whatever was typed on this one */
function skipPart() {
  if (tourMode !== 'full') return;
  const cur = TS[tourN]; if (cur.leave && !cur.pick) cur.leave(0);
  buildSteps();
  const i = TS.findIndex((s, k) => k > tourN && s.part !== cur.part);
  if (i < 0) { closeTour(false); return; }
  tourN = i; renderTour(1); sfx('next');
}
function leaveTour() { autosave(true); closeTour(false); }
function wireTour() {
  $('#tourNext').addEventListener('click', () => tourStep(1));
  $('#tourBack').addEventListener('click', () => tourStep(-1));
  $('#tourAlt').addEventListener('click', () => closeTour(false, true));
  $('#tourSkip').addEventListener('click', leaveTour);
  $('#tourPartSkip').addEventListener('click', skipPart);
  $('#tourSnd').addEventListener('click', toggleSnd); $('#setSnd').addEventListener('click', toggleSnd);
  const body = $('#tourBody');
  body.addEventListener('input', e => { tourTouched = true; tourExtraInput(e); autosave(); });
  body.addEventListener('click', e => { if (!tourExtraClick(e) && e.target.closest('button:not(.tx-l), a.btn')) sfx('tap'); });
  body.addEventListener('change', e => {
    const t = e.target; tourTouched = true;
    if (remindChange(t)) { tourReminder(); sfx('tap'); }
    else if (t.name === 'tourCur') { setTourCur(t.value); sfx('tap'); }
    else if (t.id === 'tourCurMore') { if (t.value) setTourCur(t.value); sfx('tap'); }
    else if (t.name === 'tourBill' || t.name === 'tourGoalPick') { t.closest('.chip').classList.toggle('on', t.checked); sfx(t.checked ? 'on' : 'off'); }
    else if (t.name === 'tourEm') { $$('#tourBody input[name=tourEm]').forEach(i => i.closest('.chip').classList.toggle('on', i.checked)); $('#tourEmCap').innerHTML = emCap(+t.value); sfx('tap'); }
    else tourExtraChange(e);
    autosave();
  });
  body.addEventListener('focusout', () => autosave());
  $('#tour').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); leaveTour(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.shr-jar')) { e.preventDefault(); shrinePoke(+e.target.closest('.shr-jar').dataset.sj); return; }
    if (e.key === 'Enter' && e.target.matches('[data-subamt], .so-n, .so-a, #tourCardT, #tourCardB')) { e.preventDefault(); e.target.blur(); return; }
    if (e.key === 'Enter' && e.target.matches('#tourBody input:not([type=range]):not([type=checkbox]):not([type=radio])')) { e.preventDefault(); tourStep(1); return; }
    if (e.key !== 'Tab') return;
    const f = tourFocusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement.id === 'tourTitle')) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* a closed tab or a phone that locks the screen must not lose the last thing typed */
  window.addEventListener('pagehide', () => autosave(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosave(true); });
  $('#tourOpen').addEventListener('click', () => openTour('hello', 'replay'));
  $('#tourOpen2').addEventListener('click', () => openTour(0));
  $('#setupOpen').addEventListener('click', () => openTour(undefined, 'full'));
}
