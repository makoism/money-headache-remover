/* ---------- keeping the numbers safe ----------
   The main copy is localStorage (see flush in ui0.js). A second copy is kept in IndexedDB, written at the same moments.
   When the page opens and the main copy is missing or unreadable, the second copy is loaded and Home says so.
   Also here: when the last backup file was saved, and a quiet reminder on Home. Nothing in this file touches the money model.
   Every call into the browser's database is optional: when it is unavailable or slow the page carries on as before. */
const IDB_NAME = 'money-map-safe', IDB_KEY = 'state', DAY_MS = 864e5;
let idbP = null, mirrorReady = false, mirrorBusy = false, mirrorAgain = false, bkNote = null, bkRun = null;
const timed = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
function idbOpen() {
  if (!idbP) idbP = timed(new Promise(res => {
    try {
      if (!window.indexedDB) { res(null); return; }
      const rq = indexedDB.open(IDB_NAME, 1);
      rq.onupgradeneeded = () => { try { rq.result.createObjectStore('kv'); } catch (e) { /* open reports the problem */ } };
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  }), 3000);
  return idbP;
}
const idbRun = (mode, fn) => idbOpen().then(db => !db ? null : timed(new Promise(res => {
  try {
    const tx = db.transaction('kv', mode), rq = fn(tx.objectStore('kv'));
    tx.oncomplete = () => res(mode === 'readonly' ? { v: rq.result } : { ok: true }); tx.onerror = tx.onabort = () => res(null);
  } catch (e) { res(null); }
}), 3000));
const idbGet = () => idbRun('readonly', st => st.get(IDB_KEY)).then(r => (r && r.v) || null);
const idbPut = rec => idbRun('readwrite', st => st.put(rec, IDB_KEY)).then(r => !!(r && r.ok));
/* write the second copy. Skipped until the start-up check below has run, so a fresh empty page can never overwrite a good copy before it is read. */
function mirrorOut(done) {
  if (!mirrorReady) return;
  if (mirrorBusy) { mirrorAgain = true; return; }
  let rec; try { rec = { rev: S.rev || 0, t: Date.now(), json: JSON.stringify(S) }; } catch (e) { return; }
  mirrorBusy = true;
  idbPut(rec).then(ok => { mirrorBusy = false; if (done) done(ok); if (mirrorAgain) { mirrorAgain = false; mirrorOut(done); } });
}
/* something real was entered (pay, a receipt, a finished setup, a cleared plan); an untouched page has nothing worth restoring */
const hasData = d => !!d && ((d.receipts || []).length > 0 || Object.keys((d.ui || {}).done || {}).length > 0 || !!(d.ui || {}).setup || !!(d.ui || {}).cleared);
const pristine = () => hasData(S) === false;
const okBackup = d => !!d && typeof d === 'object' && !!d.steps && !!d.once && !!d.cfg;
async function recoverMirror() {
  try {
    const rec = await idbGet();
    let d = null; try { d = rec && typeof rec.json === 'string' ? JSON.parse(rec.json) : null; } catch (e) { d = null; }
    /* the main copy is missing or damaged: the second copy brings everything back (only on an untouched page).
       Or the main copy loaded fine but is older: a save to it failed (storage full or blocked) while the second copy took it, so the second copy
       is the newer truth. Taken only if nothing changed on this page since it loaded (38.31 data safety round: a receipt logged while the main
       save failed was shown as saved, then lost on reload) */
    const lost = LS_STATE !== 'ok' && okBackup(d) && hasData(d) && pristine();
    const newer = LS_STATE === 'ok' && okBackup(d) && +rec.rev > (+S.rev || 0) && (+S.rev || 0) === LOADED_REV;
    if (lost || newer) {
      S = upgradeLegacy(normalize(d)); editRow = null; editGoal = null; editRc = null; itemsSig = '';
      bkNote = { t: +rec.t || 0 };
      if (tourIsOpen) closeTour(false); else { persist(); restructure(); }
    }
  } catch (e) { window.__restoreErr = String(e && e.stack || e); /* the second copy is only a help */ }
  mirrorReady = true; mirrorOut();
}

/* ---------- when the last backup file was saved, and the reminder ---------- */
const bkAge = () => { const t = +S.ui.bk || 0; return t ? Math.max(0, Math.floor((Date.now() - t) / DAY_MS)) : null; };
function markBackup() { S.ui.bk = Date.now(); delete S.ui.bkLater; persist(); paintBk(); if (tab === 'home') renderBackupNudge(); }
function paintBk() {
  const el = $('#bkWhen'); if (!el) return; const a = bkAge();
  el.textContent = a === null ? 'Last backup: never.' : a === 0 ? 'Last backup: today.' : `Last backup: ${a === 1 ? '1 day' : a + ' days'} ago.`;
}
/* a backup is due: numbers in, no cloud copy, none saved for three weeks, and Later not pressed this week */
function backupDue() {
  if (!(S.ui.done || {}).pay || sampleOn() || (vault.on && vaultAvailable())) return false;
  const a = bkAge(), later = +S.ui.bkLater || 0;
  return (a === null || a >= 21) && Date.now() - later > 7 * DAY_MS;
}
function renderBackupNudge() {
  const el = $('#hBk'); if (!el) return; let html = '';
  const cloud = vaultAvailable();
  renderMoveBanner();
  if (moveIn) {
    html = `<div class="hn-t"><b>Numbers arrived from the Claude link</b><span>${hasData(S) ? 'This page already has numbers of its own. Replace them with the ones that just arrived?' : 'Load them here?'}</span></div><div class="hn-b"><button type="button" class="btn small solid" data-move-load>${hasData(S) ? 'Replace with the arrived numbers' : 'Load them'}</button><button type="button" class="link" data-move-no>Keep what is here</button></div>`;
  } else if (vaultNote && vaultNote.kind === 'newer') {
    const when = vaultWhen(vaultNote.when);
    html = `<div class="hn-t"><b>Newer copy in the cloud</b><span>Saved from another device${when ? ' on ' + when : ''}. Tap Load it to load it here, or Keep mine to keep this device's numbers and send them to the cloud in its place.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-vault-load>Load it</button><button type="button" class="link" data-vault-keep>Keep mine</button></div>`;
  } else if (vault.on && vault.failAt) {
    /* LAUNCH_CHECKLIST E9: a cloud save that failed is said on Home too, until a save works */
    html = `<div class="hn-t"><b>The cloud copy is behind</b><span>Changes made since ${vaultWhen(vault.failAt)} are on this device only. It tries again by itself on your next change.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-vault-retry>Send now</button></div>`;
  } else if (vault.on && cloud && !S.ui.vaultSeen && !bkNote) {
    html = `<div class="hn-t"><b>Save your recovery code</b><span>Your numbers have an encrypted cloud copy now. This code is the only way to open it on another phone.</span></div><div class="vault-wrap" data-vault-code></div>`;
  } else if (bkNote) {
    const when = bkNote.t ? vaultWhen(bkNote.t).split(',')[0] : '';
    html = `<div class="hn-t"><b>Numbers restored</b><span>This page lost its saved numbers so it loaded the copy kept in this browser${when ? ' from ' + when : ''}. Tap Save a copy to keep a backup file as well.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-bk-now>Save a copy</button><button type="button" class="link" data-bk-ok>OK</button></div>`;
  } else if (backupDue() && $('#hNext').hidden) {
    const a = bkAge();
    {
      html = cloud
        ? `<div class="hn-t"><b>Back up your numbers</b><span>They live on this device only. A cloud copy keeps them safe, locked with a code only you have.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-vault-on>Keep a copy in the cloud</button><button type="button" class="link" data-bk-now>Save a file instead</button><button type="button" class="link" data-bk-later>Later</button></div>`
        : `<div class="hn-t"><b>${a === null ? 'Back up your numbers' : `Last backup: ${a} days ago`}</b><span>They live in this browser only. Save a file copy so nothing is lost.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-bk-now>Save a copy</button><button type="button" class="link" data-bk-later>Later</button></div>`;
    }
  }
  /* a notice about the saved numbers themselves (arrived, newer in the cloud, cloud behind, restored) is never left behind another Home action */
  const urgent = !!(moveIn || (vaultNote && vaultNote.kind === 'newer') || (vault.on && vault.failAt) || bkNote);
  if (urgent && html) el.dataset.urgent = '1'; else delete el.dataset.urgent;
  if (el.hidden !== !html || urgent) setTimeout(() => { try { if (tab === 'home' && typeof homeV1 === 'function') homeV1(); } catch (e) { /* drawn on the next render */ } }, 0);
  el.hidden = !html; if (html) { put(el, html); const w = $('[data-vault-code]', el); if (w && !w.children.length) vaultShowCode(w, vault.code); }
}
/* the install hint: only where the page has an address of its own, and not once it already runs as an installed app */
function paintInstall() {
  const box = $('#installBox'); if (!box) return;
  let standalone = false; try { standalone = (matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) { standalone = false; }
  box.hidden = !(/^https?:$/.test(location.protocol) && !inArtifact() && !standalone);
}
function wireSafe() {
  paintInstall();
  $('#moveBanner').addEventListener('click', e => { if (e.target.closest('[data-move-hide]')) { S.ui.noMove = true; persist(); renderMoveBanner(); } else if (e.target.closest('#moveGo')) sfx('next'); });
  $('#hBk').addEventListener('click', async e => {
    if (e.target.closest('[data-bk-later]')) { S.ui.bkLater = Date.now(); persist(); renderBackupNudge(); return; }
    if (e.target.closest('[data-bk-ok]')) { bkNote = null; renderBackupNudge(); return; }
    if (e.target.closest('[data-move-load]')) { moveApply(); renderBackupNudge(); return; }
    if (e.target.closest('[data-move-no]')) { moveIn = null; renderBackupNudge(); return; }
    if (e.target.closest('[data-vault-retry]')) { vaultPush(); sfx('tap'); return; }
    /* the cloud copy is turned on in Settings, where it explains itself one step at a time (E15) */
    if (e.target.closest('[data-vault-on]')) { switchTab('basics'); vaultFlow('what'); sfx('next'); return; }
    if (e.target.closest('[data-vault-load]')) { await vaultLoadNewer(); return; }
    if (e.target.closest('[data-vault-keep]')) { vaultNote = null; vaultPush(true); paintVault(); renderBackupNudge(); return; }
    if (e.target.closest('[data-bk-now]')) {
      const ok = bkRun ? await bkRun() : false;
      cheer(ok ? 'Backup saved.' : 'Not saved. Go to Settings, tap Copy text and paste it into a note instead.');
      if (ok) bkNote = null; renderBackupNudge();
    }
  });
}
