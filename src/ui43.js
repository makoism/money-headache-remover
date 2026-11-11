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
    if (LS_STATE !== 'ok') {
      const rec = await idbGet();
      let d = null; try { d = rec && typeof rec.json === 'string' ? JSON.parse(rec.json) : null; } catch (e) { d = null; }
      if (okBackup(d) && hasData(d) && pristine()) {
        S = upgradeLegacy(normalize(d)); editRow = null; editGoal = null; editRc = null; itemsSig = '';
        bkNote = { t: +rec.t || 0 };
        if (tourIsOpen) closeTour(false); else { persist(); restructure(); }
      }
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
function renderBackupNudge() {
  const el = $('#hBk'); if (!el) return; let html = '';
  const cloud = vaultAvailable();
  if (vaultNote && vaultNote.kind === 'newer') {
    const when = vaultNote.when ? new Date(vaultNote.when).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    html = `<div class="hn-t"><b>Newer copy in the cloud</b><span>Saved from another device${when ? ' on ' + when : ''}. Load it here, or keep this device's numbers and overwrite it.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-vault-load>Load it</button><button type="button" class="link" data-vault-keep>Keep mine</button></div>`;
  } else if (vault.on && cloud && !S.ui.vaultSeen && !bkNote) {
    html = `<div class="hn-t"><b>Save your recovery code</b><span>Your numbers are backed up to the cloud, encrypted. This code is the only way to open them on another phone.</span></div><div class="vault-wrap" data-vault-code></div>`;
  } else if (bkNote) {
    const when = bkNote.t ? new Date(bkNote.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    html = `<div class="hn-t"><b>Numbers restored</b><span>This page had lost its saved numbers. It loaded the copy kept in this browser${when ? ' from ' + when : ''}. Save a backup file to be safe.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-bk-now>Save a copy</button><button type="button" class="link" data-bk-ok>OK</button></div>`;
  } else if ((S.ui.done || {}).pay && !sampleOn() && $('#hNext').hidden) {
    const a = bkAge(), later = +S.ui.bkLater || 0;
    if (vault.on && cloud) html = '';
    else if ((a === null || a >= 21) && Date.now() - later > 7 * DAY_MS) {
      html = cloud
        ? `<div class="hn-t"><b>Back up your numbers</b><span>They live on this device only. Cloud backup keeps an encrypted copy that only you can open.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-vault-on>Turn on cloud backup</button><button type="button" class="link" data-bk-now>Save a file instead</button><button type="button" class="link" data-bk-later>Later</button></div>`
        : `<div class="hn-t"><b>${a === null ? 'Back up your numbers' : `Last backup: ${a} days ago`}</b><span>They live in this browser only. Save a file copy so nothing is lost.</span></div><div class="hn-b"><button type="button" class="btn small solid" data-bk-now>Save a copy</button><button type="button" class="link" data-bk-later>Later</button></div>`;
    }
  }
  el.hidden = !html; if (html) { put(el, html); const w = $('[data-vault-code]', el); if (w && !w.children.length) vaultShowCode(w, vault.code); }
}
function wireSafe() {
  $('#hBk').addEventListener('click', async e => {
    if (e.target.closest('[data-bk-later]')) { S.ui.bkLater = Date.now(); persist(); renderBackupNudge(); return; }
    if (e.target.closest('[data-bk-ok]')) { bkNote = null; renderBackupNudge(); return; }
    if (e.target.closest('[data-vault-on]')) { await vaultTurnOn(); sfx('next'); renderBackupNudge(); return; }
    if (e.target.closest('[data-vault-load]')) { await vaultLoadNewer(); return; }
    if (e.target.closest('[data-vault-keep]')) { vaultNote = null; vaultPush(true); paintVault(); renderBackupNudge(); return; }
    if (e.target.closest('[data-bk-now]')) {
      const ok = bkRun ? await bkRun() : false;
      cheer(ok ? 'Backup saved.' : 'Not saved. Settings has Copy text.');
      if (ok) bkNote = null; renderBackupNudge();
    }
  });
}
