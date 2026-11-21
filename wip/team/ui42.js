/* ===== the cloud copy: an encrypted backup on the site's own server =====
   Everything is encrypted in this browser with a key made from a recovery code the person keeps. The server (functions/api/vault)
   stores only ciphertext under an id that is also made from the code, so the code is the only way in: not the owner of the site,
   not this page's author, nobody. Losing the code means the cloud copy cannot be opened; the numbers on the device are not affected.
   Available only when the page is served from its own address (see relayBase in ui41.js). Nothing here touches the money model. */
const VAULT_KEY = 'mhr-vault', VAULT_SALT = 'mhr2000-vault-v1', CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let vault = { code: '', rev: 0, on: false, failAt: 0 }, vaultTimer = 0, vaultBusy = false, vaultAgain = false, vaultKeys = null, vaultNote = null, vaultChecked = false;
function vaultLoadLocal() { try { const v = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); if (v && typeof v.code === 'string' && v.code) vault = { code: v.code, rev: +v.rev || 0, on: true, failAt: +v.failAt || 0, local: +v.local || 0 }; } catch (e) { /* none */ } }
function vaultSaveLocal() { try { if (vault.on) localStorage.setItem(VAULT_KEY, JSON.stringify(Object.assign({ code: vault.code, rev: vault.rev }, vault.failAt ? { failAt: vault.failAt } : {}, vault.local ? { local: vault.local } : {}))); else localStorage.removeItem(VAULT_KEY); } catch (e) { /* no storage */ } }
const vaultAvailable = () => !!(relayInfo && relayInfo.vault);
/* MHR-XXXX-XXXX-XXXX-XXXX-XXXX: 20 letters and digits that are hard to misread, about 99 bits */
function newCode() { const b = crypto.getRandomValues(new Uint8Array(20)); let s = ''; for (let i = 0; i < 20; i++) s += CODE_ALPHA[b[i] % CODE_ALPHA.length]; return s; }
const codeShow = c => 'MHR-' + c.match(/.{1,4}/g).join('-');
function codeClean(v) { const s = String(v || '').toUpperCase().replace(/^MHR/, '').replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1'); return s; }
const codeValid = c => /^[A-Z0-9]{20}$/.test(c);
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = u8 => Array.from(u8, x => x.toString(16).padStart(2, '0')).join('');
/* code -> {id, token, key}. PBKDF2 makes guessing slow; HKDF splits the result into three independent values. */
async function keysFor(code) {
  if (vaultKeys && vaultKeys.code === code) return vaultKeys;
  const enc = new TextEncoder(), sub = crypto.subtle;
  const base = await sub.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
  const root = await sub.deriveBits({ name: 'PBKDF2', salt: enc.encode(VAULT_SALT), iterations: 150000, hash: 'SHA-256' }, base, 256);
  const hk = await sub.importKey('raw', root, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const part = info => sub.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) }, hk, 256);
  const key = await sub.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode('enc') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  vaultKeys = { code, id: hex(new Uint8Array(await part('id'))), token: hex(new Uint8Array(await part('token'))), key };
  return vaultKeys;
}
async function vaultEncrypt(k, text) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k.key, new TextEncoder().encode(text)); return { blob: b64(new Uint8Array(ct)), iv: b64(iv) }; }
async function vaultDecrypt(k, blob, iv) { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, k.key, unb64(blob)); return new TextDecoder().decode(pt); }
async function vaultReq(k, method, body, query) {
  const r = await fetch(relayBase() + '/api/vault/' + k.id + (query || ''), { method, headers: Object.assign({ 'x-vault-token': k.token }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined, signal: timeoutSignal(20000), keepalive: !!(body && body.blob && body.blob.length < 60000) });
  let j = null; try { j = await r.json(); } catch (e) { j = null; }
  return { status: r.status, ok: r.ok, j: j || {} };
}
/* write the current numbers to the cloud. Called after every save, a few seconds later; one write at a time. */
function vaultQueue(soon) { if (!vault.on) return; clearTimeout(vaultTimer); vaultTimer = setTimeout(vaultPush, soon ? 50 : 3000); }
/* LAUNCH_CHECKLIST E9: a save that did not reach the cloud is never silent. failAt is when the cloud copy first fell behind; it is kept
   with the code, so it is still said after a reload, and it is cleared by the next save that works. */
/* triedAt: when a Send now tap last failed, so the tap shows on screen (QC round 7 data safety confusing 2). Kept in memory only */
let vaultTapped = false;
function vaultRetryNow() { vaultTapped = true; vaultPush(); }
function vaultBehind() { if (!vault.failAt) { vault.failAt = Date.now(); vault.triedAt = 0; } if (vaultTapped) { vaultTapped = false; vault.triedAt = Date.now(); } vaultSaveLocal(); paintVault(); if (tab === 'home') renderBackupNudge(); }
function vaultCaughtUp() { const was = vault.failAt; vault.failAt = 0; vault.triedAt = 0; vaultTapped = false; return !!was; }
async function vaultPush(force) {
  if (!vault.on) return;
  if (vaultBusy) { vaultAgain = true; return; }
  vaultBusy = true;
  try {
    const rev = S.rev || Date.now(); if (!force && (rev <= vault.rev || rev === vault.local)) return;   /* local: the revision here that is the cloud copy as loaded; nothing to send */
    if (!vaultAvailable()) { await relayHealth(true); if (!vaultAvailable()) { vaultBehind(); return; } }
    const k = await keysFor(vault.code), enc = await vaultEncrypt(k, JSON.stringify(S));
    const r = await vaultReq(k, 'PUT', Object.assign({ blob: enc.blob, iv: enc.iv, rev }, vault.rev ? { base: vault.rev } : {}, force ? { force: true } : {}));   /* base: the cloud revision this device last loaded or sent; the server refuses the send when it holds another one, so a phone with an older copy never writes over a newer one without asking (QC round 4 north-star 5) */
    if (r.ok) { vault.rev = rev; vault.local = rev; vaultNote = null; const was = vaultCaughtUp(); vaultSaveLocal(); paintVault(); if (was && tab === 'home') renderBackupNudge(); }
    else if (r.status === 409) { vaultNote = { kind: 'newer', rev: r.j.rev, when: r.j.updated }; paintVault(); if (tab === 'home') renderBackupNudge(); }
    else if (r.status === 403) { vaultNote = { kind: 'bad' }; paintVault(); }
    else vaultBehind();
  } catch (e) { vaultBehind(); /* no connection: the next save tries again, and the screen says the cloud copy is behind */ }
  finally { vaultBusy = false; if (vaultAgain) { vaultAgain = false; vaultQueue(); } }
}
/* on opening: if a newer copy sits in the cloud (another device wrote it), load it when this page has nothing of its own, otherwise ask */
async function vaultCheck() {
  if (vaultChecked) return; vaultChecked = true;
  if (!vault.on) { paintVault(); relayHealth().then(() => { paintVault(); if (tab === 'home' && typeof renderBackupNudge === 'function') renderBackupNudge(); }).catch(() => { /* no server here */ }); return; }   /* a return visit still learns that the cloud copy is on offer; nothing about the person is sent */
  await relayHealth(); if (!vaultAvailable()) { paintVault(); if (vault.failAt && tab === 'home') renderBackupNudge(); return; }
  try {
    const k = await keysFor(vault.code), r = await vaultReq(k, 'GET');
    if (r.status === 404) vaultQueue(true);
    else if (r.status === 403) vaultNote = { kind: 'bad' };
    else if (r.ok) {
    const srv = r.j;
    if (srv.rev > (S.rev || 0)) {
      if (pristine()) { await vaultApply(k, srv); bkNote = null; }
      else { vaultNote = { kind: 'newer', rev: srv.rev, when: srv.updated }; if (tab === 'home') renderBackupNudge(); }
    } else if (srv.rev < (S.rev || 0) && !(srv.rev === vault.rev && S.rev === vault.local)) vaultQueue(true);
    else if (srv.rev < (S.rev || 0)) vaultCaughtUp();   /* the numbers here are the cloud copy as loaded */
    else { vault.rev = srv.rev; vaultCaughtUp(); }
    vaultSaveLocal();
    }
  } catch (e) { /* offline */ }
  paintVault(); if (tab === 'home') renderBackupNudge();
}
/* asked: the person chose this copy on a screen that said what it is. Without that, a copy that is not newer than the numbers on this
   device is refused (LAUNCH_CHECKLIST E10: an old answer replayed by the browser, or a wrong clock, must not load over current numbers). */
async function vaultApply(k, srv, asked, prevVault) {
  if (!asked && !pristine() && !(srv.rev > (S.rev || 0))) throw new Error('older');
  const d = JSON.parse(await vaultDecrypt(k, srv.blob, srv.iv));
  if (!okBackup(d)) throw new Error('bad');
  /* the numbers on this device are kept as a local copy, with Undo, before the cloud copy replaces them (LAUNCH_CHECKLIST E1): the device
     clock decides "newer", so the copy loaded can be the wrong one */
  /* strictly nothing typed here: no receipts or setup (pristine), no settings, monthly or one-time amounts, and the plan as a fresh
     page has it. Anything typed is kept with Undo (v1_cloud_keep E1: a typed balance alone must not be lost) */
  const wasEmpty = pristine() && !Object.keys(S.cfg || {}).length && !Object.keys(S.steps || {}).length && !Object.keys(S.once || {}).length && !Object.keys(S.items || {}).length && JSON.stringify(S.plan) === JSON.stringify(freshState().plan);   /* a phone with no numbers of its own has nothing to go back to: no Undo, so one tap can never send sample numbers over the only cloud copy (QC10 north-star F2) */
  const old = S, oldSnap = snapNoCopy(); S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, S.ui, { sampleHidden: true }); if (!Array.isArray(d.receipts)) S.receipts = old.receipts;
  /* the local revision never goes back: the device's second copy holds the old numbers at their own revision, and a lower one here let it win
     on the next open, then send the old numbers over the cloud copy (QC round 4 data safety 1). The cloud revision is kept apart in vault.rev */
  S.rev = Math.max(srv.rev, (+old.rev || 0) + 1, (typeof LOADED_REV === 'number' ? LOADED_REV : 0) + 1); vault.rev = srv.rev; vault.local = S.rev; vaultNote = null; vaultCaughtUp();
  if (!wasEmpty) keepCopy(oldSnap, 'The cloud copy replaced the numbers on this device.');
  /* a phone that was not sharing this cloud copy: how it was sharing before is kept on this device (never in the numbers, which are sent),
     so an Undo after a reload, or Put them back, stops sharing the cloud copy like the Undo right after the load (QC round 5 data safety B1) */
  if (!wasEmpty && prevVault && prevVault.code !== vault.code) { S.ui.keep.cloud = 1; try { localStorage.setItem(VAULT_KEY + '-before', JSON.stringify(prevVault.on && prevVault.code ? { code: prevVault.code, rev: prevVault.rev || 0, local: prevVault.local || 0 } : {})); } catch (e) { /* no storage */ } }
  editRow = null; editGoal = null; editRc = null; itemsSig = '';
  /* closing setup saves (a new revision) but changes nothing of the loaded copy: that revision is still the cloud copy, so it is not sent
     back as a newer one (QC round 6 north-star 3: the first phone was then offered its own older numbers, and Load it dropped its latest change) */
  if (tourIsOpen) { closeTour(false); vault.local = S.rev; vaultSaveLocal(); } else { flush(); restructure(); }
  /* a cloud load is not a backup file: "Last backup" stays what the copy says (QC10 north-star F4) */
  if (wasEmpty) { try { cheer('Cloud copy loaded.'); } catch (e) { } }
  else if (prevVault && prevVault.code !== vault.code && window.offerUndoG) {
    /* this phone was not sharing this cloud copy before the load: Undo puts its own numbers back and goes back to how it was sharing (or
       not) before, so nothing is ever sent over the other phone's copy (QC10 round 2 north-star finding 1) */
    const pv = Object.assign({}, prevVault);
    window.offerUndoG(oldSnap, `Cloud copy loaded. The numbers this phone had are kept for ${KEEP_DAYS} days. Undo puts them back on this phone and stops sharing the cloud copy here.`,
      () => { clearTimeout(vaultTimer); vault = pv; vaultKeys = null; vaultNote = null; vaultSaveLocal(); S = normalize(JSON.parse(oldSnap)); vaultFlowClose(); setTimeout(() => { try { cheer('Your own numbers are back. This phone no longer shares the cloud copy, and the cloud copy is unchanged.'); } catch (e) { } }, 50); });   /* the Done panel closes (QC10 round 3 north-star 1) */
  }
  else if (window.offerUndoG) window.offerUndoG(oldSnap, `Cloud copy loaded. The numbers this phone had are kept for ${KEEP_DAYS} days. Undo puts them back here and in the cloud copy.`);
}
/* Undo of a cloud load from the kept copy: back to how this phone was sharing before the load (or not sharing), then its own numbers */
function vaultUndoLoad() {
  let pv = null; try { pv = JSON.parse(localStorage.getItem(VAULT_KEY + '-before') || 'null'); localStorage.removeItem(VAULT_KEY + '-before'); } catch (e) { /* no storage */ }
  clearTimeout(vaultTimer); vault = pv && pv.code ? { code: pv.code, rev: +pv.rev || 0, on: true, failAt: 0, local: +pv.local || 0 } : { code: '', rev: 0, on: false, failAt: 0 };
  vaultKeys = null; vaultNote = null; vaultSaveLocal();
  paintVault();   /* Settings says Off right away, not after another reload (QC round 6 data safety confusing 1) */
}
async function vaultLoadNewer() {
  if (!vaultNote || vaultNote.kind !== 'newer') return;
  try { const k = await keysFor(vault.code), r = await vaultReq(k, 'GET'); if (r.ok) { await vaultApply(k, r.j, true); cheer('Loaded the newer copy.'); sfx('next'); } else cheer('Couldn\'t reach the cloud copy so nothing was changed. Check the connection and try again.'); }
  catch (e) { if (e && e.message === 'older') { vaultNote = null; cheer('The cloud copy isn\'t newer than the numbers here, so nothing was loaded.'); } else cheer('Couldn\'t load the cloud copy so nothing was changed. Try again, or tap Keep mine to keep the numbers on this device.'); }
  paintVault(); if (tab === 'home') renderBackupNudge();
}
/* turn on: a new code, shown once; the person must say they saved it */
async function vaultTurnOn() {
  const code = newCode(); vault = { code, rev: 0, on: true, failAt: 0 }; vaultKeys = null; vaultSaveLocal();
  S.ui.vaultSeen = false; persist(); paintVault(); vaultQueue(true);
  return code;
}
async function vaultTurnOff(deleteCloud) {
  if (deleteCloud && vault.on) { try { const k = await keysFor(vault.code); await vaultReq(k, 'DELETE'); } catch (e) { /* best effort */ } }
  vault = { code: '', rev: 0, on: false, failAt: 0 }; vaultKeys = null; vaultNote = null; vaultSaveLocal(); delete S.ui.vaultSeen; persist(); paintVault();
}
/* look for the cloud copy a typed code opens, and open it, without changing anything on this device.
   Gives { err } with a plain sentence, or { code, k, srv, n (receipts in it), older (it is not newer than the numbers here) } */
async function vaultFind(raw) {
  const code = codeClean(raw); if (!codeValid(code)) return { err: 'The code is 20 letters and digits, like MHR-XXXX-XXXX-XXXX-XXXX-XXXX. Check that none is missing.' };
  await relayHealth(true); if (!vaultAvailable()) return { err: 'The cloud can\'t be reached from here right now. Check the connection and try again.' };
  try {
    const k = await keysFor(code), r = await vaultReq(k, 'GET');
    if (r.status === 404) return { err: 'There\'s no cloud copy for this code. Check every character against the code you saved, or on your other device go to Settings, find Cloud copy and tap Show code.' };
    if (!r.ok) return { err: 'Could not reach the cloud copy. Try again.' };
    let d; try { d = JSON.parse(await vaultDecrypt(k, r.j.blob, r.j.iv)); } catch (e) { d = null; }
    if (!d || !okBackup(d)) return { err: 'That copy could not be opened with this code. Check the code for a typo and try again.' };
    return { code, k, srv: r.j, n: Array.isArray(d.receipts) ? d.receipts.length : 0, older: !pristine() && !(r.j.rev > (S.rev || 0)) };
  } catch (e) { return { err: 'Could not reach the cloud copy. Try again.' }; }
}
/* load a found copy and tie this device to it */
async function vaultUse(f, asked) {
  const before = vault;
  try { vault = { code: f.code, rev: 0, on: true, failAt: 0 }; vaultKeys = f.k; await vaultApply(f.k, f.srv, asked, before); vaultSaveLocal(); return true; }
  catch (e) { vault = before; vaultKeys = null; vaultSaveLocal(); throw e; }
}
/* one sentence on a copy that vaultFind found: when it was saved and how much is in it (Settings and the welcome screen both show it before loading) */
function vaultFoundLine(v, sec) { const n = v.n; return `It was saved ${esc(vaultWhen(v.srv.updated || v.srv.rev, sec))} and has ${n} receipt${n === 1 ? '' : 's'} in it.`; }
/* ---------- what Settings shows ---------- */
const SAVED_LOCAL = 'Your numbers are saved in this browser on this device only. They only leave it when you ask for that: Ask sends them with your question while the box is ticked, and reading a statement or a receipt photo sends that file to Claude. A second copy is kept here in case the first goes missing, and it loads by itself if that happens. Neither one moves to other devices. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of your numbers and receipts and you make one with Save file below.';
const SAVED_LOCAL_OFF = 'Your numbers are saved in this browser on this device only. They only leave it when you ask for that: Ask sends them with your question while the box is ticked, and reading a statement or a receipt photo sends that file to Claude. A second copy is kept here in case the first goes missing, and it loads by itself if that happens. Neither one moves to other devices unless you turn on Cloud copy below. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of your numbers and receipts and you make one with Save file below.';   /* cloud copy off but it can be turned on: point at it (QC round 6 data safety C3) */
const SAVED_CLOUD = 'Your numbers are saved in this browser, with a second copy here in case the first goes missing, and a locked cloud copy that follows every save. It\'s under Cloud copy below. Clearing site data removes the two copies on this device, and your recovery code brings the cloud copy back. A backup file is your own copy of your numbers and receipts.';
const vaultWhen = (t, sec) => { if (!t) return ''; const d = new Date(t); return d.getDate() + ' ' + d.toLocaleString('en-US', { month: 'short' }) + ', ' + d.toLocaleString('en-US', Object.assign({ hour: 'numeric', minute: '2-digit' }, sec ? { second: '2-digit' } : {})); };   /* day then month, like every other date. sec: with seconds, for two times in the same minute */
/* one sentence on whether the cloud copy has everything; the same words in Settings, in the steps and on Home */
const vaultClock = t => new Date(t).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });   /* the time part of vaultWhen */
const vaultTriedText = () => vault.triedAt ? `Tried again at ${vaultClock(vault.triedAt)}. Still no connection. Your numbers are safe on this device.` : '';
function vaultBehindText() { return vault.failAt ? `The cloud copy is behind. Changes made since ${vaultWhen(vault.failAt)} are on this device only. ${vaultTriedText() || 'It tries again by itself on your next change, or tap Send now.'}` : ''; }
function vaultSentText() { return vault.failAt ? vaultBehindText() : vault.rev ? `Sent ${vaultWhen(vault.rev)}. The cloud copy has everything on this device.` : 'Sending the first copy…'; }
function paintVault() {
  const box = $('#vaultBox'); if (!box) return;
  const can = vaultAvailable();
  box.hidden = !can && !vault.on;
  const cap = $('#savedCap'); if (cap) { const t = vault.on ? SAVED_CLOUD : can ? SAVED_LOCAL_OFF : SAVED_LOCAL; if (cap.textContent !== t) cap.textContent = t; }
  if (typeof renderStart === 'function' && paintVault.on !== vault.on) { paintVault.on = vault.on; renderStart(); }   /* Reset and setup says where the numbers are saved: it follows the cloud copy turning on or off */
  if (box.hidden) return;
  const st = $('#vaultState'), code = $('#vaultCode'), behind = $('#vaultBehind'), newer = !!(vaultNote && vaultNote.kind === 'newer');
  if (!vault.on) { st.textContent = 'Off. Your numbers live on this device only.'; code.hidden = true; }
  else {
    const when = vaultWhen(vault.rev);
    st.textContent = vaultNote && vaultNote.kind === 'bad' ? 'The cloud copy doesn\'t accept this code any more. Tap Turn off, then Keep a copy in the cloud to start a new one.'
      : newer ? `There's a newer copy in the cloud from another device${vaultNote.when ? ', saved ' + vaultWhen(vaultNote.when) : ''}. Tap Load the newer copy to load it here, or Keep mine to keep the numbers on this device and send them to the cloud in its place. If you load it, the numbers here are kept for ${KEEP_DAYS} days and Undo brings them back. If you keep yours, they replace the cloud copy, and the other device asks before it loads them.`
      : !can && !vault.failAt ? 'On, but the cloud can\'t be reached from here right now.'
      : when ? `On. Last sent ${when}.` : vault.failAt ? 'On. The first copy hasn\'t been sent yet.' : 'On. Sending the first copy…';
    code.hidden = false;
  }
  const bt = vault.on && !newer ? vaultBehindText() : ''; behind.hidden = !bt; if (behind.textContent !== bt) behind.textContent = bt;
  const flow = $('#vaultFlow'), open = !flow.hidden;
  $('#vaultOn').hidden = vault.on || open; $('#vaultHave').hidden = vault.on || open;
  $('#vaultOff').hidden = !vault.on; $('#vaultShow').hidden = !vault.on; $('#vaultHow').hidden = !vault.on; $('#vaultRetry').hidden = !bt;
  $('#vaultLoadNewer').hidden = !newer; $('#vaultKeepMine').hidden = !newer;
  const sent = $('[data-vf-sent]', flow); if (sent) { const t = vaultSentText(); if (sent.textContent !== t) sent.textContent = t; }
}
function vaultShowCode(el, code) {
  el.innerHTML = `<p class="vault-code" id="vaultCodeTxt">${esc(codeShow(code))}</p><p class="cap">This code is the key to your cloud copy and you type it once on every other phone or browser. Any phone or browser that has your numbers shows it again under Settings, Cloud copy, Show code. If you lose the code and every device, nobody can open the cloud copy, and only a backup file brings your numbers back. So save it now. Tap Copy code and paste it in your notes or password app, or send it to yourself, then tap I saved it.</p><div class="row-btns"><button type="button" class="btn small solid" id="vaultCopy">Copy code</button><button type="button" class="btn small" id="vaultSaved">I saved it</button><span class="msg" id="vaultCopyMsg" role="status"></span></div>`;
  $('#vaultCopy', el).addEventListener('click', () => copyText(codeShow(code), $('#vaultCopyMsg', el), 'Copied.'));
  $('#vaultSaved', el).addEventListener('click', () => { S.ui.vaultSeen = true; persist(); sfx('tap'); if (el.dataset.vfStep) { vaultFlow('here'); return; } el.innerHTML = '<p class="cap">Code saved. Tap Show code to see it again.</p>'; if (tab === 'home') renderBackupNudge(); });
}
/* ---------- LAUNCH_CHECKLIST E15: the cloud copy explains itself, one step at a time ----------
   Two ways in. Keep a copy: what it is, the code, what happens on this device, what to do on another phone or browser.
   I have a code: type it, see what was found before anything is replaced, done. Each step is one panel in #vaultFlow. */
let vaultFound = null;
const VF_STEPS = { on: ['what', 'code', 'here', 'other'], have: ['enter', 'found', 'loaded'] };
function vaultFlowClose() { const f = $('#vaultFlow'); if (!f) return; f.hidden = true; f.innerHTML = ''; vaultFound = null; paintVault(); }
function vaultFlow(step, solo) {
  const f = $('#vaultFlow'); if (!f) return;
  const path = VF_STEPS.on.indexOf(step) >= 0 ? VF_STEPS.on : VF_STEPS.have, dots = solo ? '' : `<p class="vf-dots" aria-hidden="true">${path.map(x => `<i${x === step ? ' class="on"' : ''}></i>`).join('')}</p>`;
  /* the cloud copy and the numbers here changed in the same minute: both times show seconds, so they don't look the same (QC round 7 data safety confusing 4) */
  const sec = !!(vaultFound && vaultFound.srv && S.rev && Math.floor((vaultFound.srv.updated || vaultFound.srv.rev) / 60000) === Math.floor(S.rev / 60000));
  const here = !pristine(), mine = S.rev ? vaultWhen(S.rev, sec) : '';
  const body = {
    what: () => `<h5>What the cloud copy is</h5><p>It's a second copy of your numbers, kept on the Burrow's server, so they're not only on this device.</p><p>It's locked with a code that only you get, so nobody else can read it, not even the person who shared this app with you.</p><p>You use it to get your numbers onto a new phone or another browser, or to get them back if this one is cleared or lost.</p><div class="row-btns"><button type="button" class="btn small solid" data-vf-next>Next: get my code</button><button type="button" class="link" data-vf-cancel>Not now</button></div>`,
    code: () => `<h5>Your recovery code</h5><div data-vf-code data-vf-step-code></div>`,
    here: () => `<h5>On this device: nothing more to do</h5><p>Every change you make is sent to the cloud copy by itself a few seconds later. Settings always shows when it was last sent and tells you if a send didn't go through.</p><p class="vf-sent" data-vf-sent role="status"></p><div class="row-btns"><button type="button" class="btn small solid" data-vf-next>Next: another phone or browser</button></div>`,
    other: () => `<h5>To get your numbers on another phone or browser</h5><ol><li>Open the Burrow there${/^https?:$/.test(location.protocol) ? `: <b>${esc(location.host)}</b>` : ''}.</li><li>On the welcome screen tap <b>Enter your recovery code</b>. If the welcome screen is gone, tap the gear for Settings, find Cloud copy and tap <b>I have a code</b>.</li><li>Type or paste your code, then tap <b>Find my copy</b>.</li><li>It shows what it found. Tap <b>Load</b>, and your numbers are there.</li></ol><p>From then on both devices share the one copy, so a change on one shows up on the other the next time you open it there. If both changed the app asks which to keep and keeps the other for ${KEEP_DAYS} days.</p><div class="row-btns"><button type="button" class="btn small solid" data-vf-done>Done</button></div>`,
    enter: () => `<h5>Bring your numbers to this device</h5><p>You need the recovery code from the device that already has your numbers. On that device go to Settings, find Cloud copy and tap <b>Show code</b>.</p><div class="row-btns inv-row"><input class="txt" id="vaultIn" type="text" autocomplete="off" spellcheck="false" placeholder="MHR-XXXX-XXXX-XXXX-XXXX-XXXX" aria-label="Recovery code" maxlength="40"><button type="button" class="btn small solid" id="vaultUse">Find my copy</button></div><p class="msg" id="vaultMsg" role="status"></p><p class="cap">Nothing on this device changes yet. The next step shows what was found first.</p><div class="row-btns"><button type="button" class="link" data-vf-cancel>Cancel</button></div>`,
    found: () => { const v = vaultFound;
      return `<h5>Found your copy</h5><p data-vf-found>${vaultFoundLine(v, sec)}</p>`
        + (v.older ? `<p class="vf-warn" data-vf-older><b>Careful: this cloud copy is older than the numbers on this device</b>${mine ? ' (last changed ' + esc(mine) + ')' : ''}. Loading it takes this device back to that older copy.</p>`
          : here ? `<p>Loading it replaces the numbers on this device${mine ? ' (last changed ' + esc(mine) + ')' : ''}.</p>` : '<p>This device has no numbers of its own yet, so nothing is replaced.</p>')
        + (here ? `<p>The numbers that are here now are kept for ${KEEP_DAYS} days, with Undo, in case this isn't what you wanted.</p>` : '')
        + `<div class="row-btns"><button type="button" class="btn small${v.older ? '' : ' solid'}" id="vaultLoad">${v.older ? 'Load the older copy anyway' : 'Load'}</button>${here ? `<button type="button" class="btn small${v.older ? ' solid' : ''}" id="vaultKeepHere">Keep what is here</button>` : '<button type="button" class="link" data-vf-cancel>Cancel</button>'}<span class="msg" id="vaultLoadMsg" role="status"></span></div>`; },
    loaded: () => `<h5>Done. Your numbers are on this device</h5><p>This device now shares the cloud copy. Every change here is sent by itself, and changes from your other device show up when you open the app.</p><p>Your code stays the same. Tap <b>Show code</b> to see it again.</p><div class="row-btns"><button type="button" class="btn small solid" data-vf-done>Done</button></div>`
  }[step];
  if (!body) return;
  $('#vaultCode').innerHTML = '';
  f.innerHTML = `<div class="vf-step" data-vf-step="${step}">${dots}${body()}</div>`; f.hidden = false;
  const on = (sel, fn) => { const e = $(sel, f); if (e) e.addEventListener('click', fn); };
  if (step === 'code') { const el = $('[data-vf-code]', f); el.dataset.vfStep = '1'; vaultShowCode(el, vault.code); }
  on('[data-vf-cancel]', () => { vaultFlowClose(); sfx('back'); });
  on('[data-vf-done]', () => { vaultFlowClose(); sfx('tap'); });
  on('[data-vf-next]', async () => {
    if (step === 'what') { if (!vault.on) await vaultTurnOn(); vaultFlow('code'); sfx('next'); return; }
    vaultFlow(path[path.indexOf(step) + 1]); sfx('next');
  });
  if (step === 'enter') {
    const go = async () => { const m = $('#vaultMsg'); m.textContent = 'Looking…'; const r = await vaultFind($('#vaultIn').value); if (!$('#vaultMsg')) return; if (r.err) { m.textContent = r.err; return; } vaultFound = r; vaultFlow('found'); sfx('next'); };
    on('#vaultUse', go); $('#vaultIn', f).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }
  on('#vaultKeepHere', () => { vaultFlowClose(); cheer('Nothing was changed. Your numbers here stay as they are.'); sfx('back'); });
  on('#vaultLoad', async () => { try { await vaultUse(vaultFound, true); vaultFlow('loaded'); sfx('next'); } catch (e) { const m = $('#vaultLoadMsg'); if (m) m.textContent = 'That copy couldn\'t be loaded so nothing was changed. Try again, or load a backup file under Restore below.'; } });
  paintVault();
  /* bring the step into view; the heading takes focus so a screen reader reads the new step */
  const h = $('h5', f); if (h) { h.tabIndex = -1; try { h.focus({ preventScroll: true }); } catch (e) { /* older browsers */ } }
  requestAnimationFrame(() => { try { f.scrollIntoView({ block: 'nearest' }); } catch (e) { /* none */ } });
}
function wireVault() {
  vaultLoadLocal();
  const box = $('#vaultBox'); if (!box) return;
  $('#vaultOn').addEventListener('click', () => { vaultFlow('what'); sfx('next'); });
  $('#vaultHave').addEventListener('click', () => { vaultFlow('enter'); sfx('next'); const i = $('#vaultIn'); if (i) i.focus(); });
  $('#vaultHow').addEventListener('click', () => { const f = $('#vaultFlow'); if (!f.hidden && $('[data-vf-step="other"]', f)) { vaultFlowClose(); return; } vaultFlow('other', true); });
  $('#vaultRetry').addEventListener('click', () => { vaultRetryNow(); sfx('tap'); });
  $('#vaultShow').addEventListener('click', () => { const c = $('#vaultCode'); if (!$('#vaultFlow').hidden) vaultFlowClose(); if (c.querySelector('#vaultCodeTxt')) { c.innerHTML = ''; return; } vaultShowCode(c, vault.code); });
  $('#vaultOff').addEventListener('click', async () => {
    const b = $('#vaultOff'); if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tap again: delete the cloud copy'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Turn off'; }, 4000); return; }
    b.dataset.armed = ''; b.textContent = 'Turn off'; vaultFlowClose(); await vaultTurnOff(true); $('#vaultCode').innerHTML = ''; cheer('Cloud copy deleted. Your numbers stay on this device.'); sfx('back');
  });
  $('#vaultLoadNewer').addEventListener('click', vaultLoadNewer);
  $('#vaultKeepMine').addEventListener('click', () => { vaultNote = null; vaultPush(true); paintVault(); if (tab === 'home') renderBackupNudge(); });
}
/* test hook (only with ?sfxtest): the cloud copy functions, so a test can apply a made-up record without reaching the cloud */
if (/[?&]sfxtest\b/.test(location.search)) window.__vault = { keysFor, vaultEncrypt, vaultApply };
