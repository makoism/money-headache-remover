/* ===== the cloud copy: an encrypted backup on the site's own server =====
   Everything is encrypted in this browser with a key made from a recovery code the person keeps. The server (functions/api/vault)
   stores only ciphertext under an id that is also made from the code, so the code is the only way in: not the owner of the site,
   not this page's author, nobody. Losing the code means the cloud copy cannot be opened; the numbers on the device are not affected.
   Available only when the page is served from its own address (see relayBase in ui41.js). Nothing here touches the money model. */
const VAULT_KEY = 'mhr-vault', VAULT_SALT = 'mhr2000-vault-v1', CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let vault = { code: '', rev: 0, on: false, failAt: 0 }, vaultTimer = 0, vaultBusy = false, vaultAgain = false, vaultKeys = null, vaultNote = null, vaultChecked = false;
function vaultLoadLocal() { try { const v = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); if (v && typeof v.code === 'string' && v.code) vault = { code: v.code, rev: +v.rev || 0, on: true, failAt: +v.failAt || 0 }; } catch (e) { /* none */ } }
function vaultSaveLocal() { try { if (vault.on) localStorage.setItem(VAULT_KEY, JSON.stringify(Object.assign({ code: vault.code, rev: vault.rev }, vault.failAt ? { failAt: vault.failAt } : {}))); else localStorage.removeItem(VAULT_KEY); } catch (e) { /* no storage */ } }
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
function vaultBehind() { if (!vault.failAt) vault.failAt = Date.now(); vaultSaveLocal(); paintVault(); if (tab === 'home') renderBackupNudge(); }
function vaultCaughtUp() { const was = vault.failAt; vault.failAt = 0; return !!was; }
async function vaultPush(force) {
  if (!vault.on) return;
  if (vaultBusy) { vaultAgain = true; return; }
  vaultBusy = true;
  try {
    const rev = S.rev || Date.now(); if (!force && rev <= vault.rev) return;
    if (!vaultAvailable()) { await relayHealth(true); if (!vaultAvailable()) { vaultBehind(); return; } }
    const k = await keysFor(vault.code), enc = await vaultEncrypt(k, JSON.stringify(S));
    const r = await vaultReq(k, 'PUT', Object.assign({ blob: enc.blob, iv: enc.iv, rev }, force ? { force: true } : {}));
    if (r.ok) { vault.rev = rev; vaultNote = null; const was = vaultCaughtUp(); vaultSaveLocal(); paintVault(); if (was && tab === 'home') renderBackupNudge(); }
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
    } else if (srv.rev < (S.rev || 0)) vaultQueue(true);
    else { vault.rev = srv.rev; vaultCaughtUp(); }
    vaultSaveLocal();
    }
  } catch (e) { /* offline */ }
  paintVault(); if (tab === 'home') renderBackupNudge();
}
/* asked: the person chose this copy on a screen that said what it is. Without that, a copy that is not newer than the numbers on this
   device is refused (LAUNCH_CHECKLIST E10: an old answer replayed by the browser, or a wrong clock, must not load over current numbers). */
async function vaultApply(k, srv, asked) {
  if (!asked && !pristine() && !(srv.rev > (S.rev || 0))) throw new Error('older');
  const d = JSON.parse(await vaultDecrypt(k, srv.blob, srv.iv));
  if (!okBackup(d)) throw new Error('bad');
  /* the numbers on this device are kept as a local copy, with Undo, before the cloud copy replaces them (LAUNCH_CHECKLIST E1): the device
     clock decides "newer", so the copy loaded can be the wrong one */
  const old = S, oldSnap = snapNoCopy(); S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, S.ui, { sampleHidden: true }); if (!Array.isArray(d.receipts)) S.receipts = old.receipts;
  S.rev = srv.rev; vault.rev = srv.rev; vaultNote = null; vaultCaughtUp();
  keepCopy(oldSnap, 'The cloud copy replaced the numbers on this device.');
  editRow = null; editGoal = null; editRc = null; itemsSig = '';
  if (tourIsOpen) closeTour(false); else { flush(); restructure(); }
  S.ui.bk = Date.now(); delete S.ui.bkLater;
  if (window.offerUndoG) window.offerUndoG(oldSnap, `Cloud copy loaded. Your numbers from before are kept: you can undo for ${KEEP_DAYS} days.`);
}
async function vaultLoadNewer() {
  if (!vaultNote || vaultNote.kind !== 'newer') return;
  try { const k = await keysFor(vault.code), r = await vaultReq(k, 'GET'); if (r.ok) { await vaultApply(k, r.j); cheer('Loaded the newer copy.'); sfx('next'); } else cheer('Could not reach the cloud copy. Nothing was changed.'); }
  catch (e) { if (e && e.message === 'older') { vaultNote = null; cheer('The copy in the cloud is not newer than the numbers here, so nothing was loaded.'); } else cheer('Could not load the cloud copy. Nothing was changed.'); }
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
  await relayHealth(true); if (!vaultAvailable()) return { err: 'The cloud cannot be reached from here right now. Check the connection and try again.' };
  try {
    const k = await keysFor(code), r = await vaultReq(k, 'GET');
    if (r.status === 404) return { err: 'No cloud copy for this code. Check every character against the code on your other device.' };
    if (!r.ok) return { err: 'Could not reach the cloud copy. Try again.' };
    let d; try { d = JSON.parse(await vaultDecrypt(k, r.j.blob, r.j.iv)); } catch (e) { d = null; }
    if (!d || !okBackup(d)) return { err: 'That copy could not be opened with this code.' };
    return { code, k, srv: r.j, n: Array.isArray(d.receipts) ? d.receipts.length : 0, older: !pristine() && !(r.j.rev > (S.rev || 0)) };
  } catch (e) { return { err: 'Could not reach the cloud copy. Try again.' }; }
}
/* load a found copy and tie this device to it */
async function vaultUse(f, asked) {
  const before = vault;
  try { vault = { code: f.code, rev: 0, on: true, failAt: 0 }; vaultKeys = f.k; await vaultApply(f.k, f.srv, asked); vaultSaveLocal(); return true; }
  catch (e) { vault = before; vaultKeys = null; vaultSaveLocal(); throw e; }
}
/* one sentence on a copy that vaultFind found: when it was saved and how much is in it (Settings and the welcome screen both show it before loading) */
function vaultFoundLine(v) { const n = v.n; return `It was saved ${esc(vaultWhen(v.srv.updated || v.srv.rev))} and has ${n} receipt${n === 1 ? '' : 's'} in it.`; }
/* ---------- what Settings shows ---------- */
const SAVED_LOCAL = 'Data is stored in this browser on this device only. Your numbers are sent only when you use Ask and tick the box to include them. A second copy is kept here in case the first goes missing, and is loaded on its own if so. It does not move to other devices. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of numbers and receipts.';
const SAVED_CLOUD = 'Data is stored in this browser, with a second copy here in case the first goes missing, and an encrypted cloud copy (Cloud copy below) that follows every save. Clearing site data removes the two copies on this device; the recovery code brings the cloud copy back. A backup file is your own copy of numbers and receipts.';
const vaultWhen = t => t ? new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
/* one sentence on whether the cloud copy has everything; the same words in Settings, in the steps and on Home */
function vaultBehindText() { return vault.failAt ? `The cloud copy is behind. Changes made since ${vaultWhen(vault.failAt)} are on this device only. It tries again by itself on your next change, or tap Send now.` : ''; }
function vaultSentText() { return vault.failAt ? vaultBehindText() : vault.rev ? `Sent ${vaultWhen(vault.rev)}. The cloud copy has everything on this device.` : 'Sending the first copy…'; }
function paintVault() {
  const box = $('#vaultBox'); if (!box) return;
  const can = vaultAvailable();
  box.hidden = !can && !vault.on;
  const cap = $('#savedCap'); if (cap) { const t = vault.on ? SAVED_CLOUD : SAVED_LOCAL; if (cap.textContent !== t) cap.textContent = t; }
  if (box.hidden) return;
  const st = $('#vaultState'), code = $('#vaultCode'), behind = $('#vaultBehind'), newer = !!(vaultNote && vaultNote.kind === 'newer');
  if (!vault.on) { st.textContent = 'Off. Your numbers live on this device only.'; code.hidden = true; }
  else {
    const when = vaultWhen(vault.rev);
    st.textContent = vaultNote && vaultNote.kind === 'bad' ? 'The cloud copy does not accept this code any more. Turn off and on again to start a new one.'
      : newer ? `A newer copy is in the cloud (from another device${vaultNote.when ? ', saved ' + vaultWhen(vaultNote.when) : ''}). Load it here, or keep the numbers on this device and send them over it. Whichever you pick, the other is kept for ${KEEP_DAYS} days when it is replaced here.`
      : !can && !vault.failAt ? 'On, but the cloud cannot be reached from here right now.'
      : when ? `On. Last sent ${when}.` : vault.failAt ? 'On. The first copy has not been sent yet.' : 'On. Sending the first copy…';
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
  el.innerHTML = `<p class="vault-code" id="vaultCodeTxt">${esc(codeShow(code))}</p><p class="cap">This code is the key to your cloud copy. You type it once on every other phone or browser. It cannot be looked up again if you lose it and lose this device, so save it now: paste it in your notes or password app, or send it to yourself.</p><div class="row-btns"><button type="button" class="btn small solid" id="vaultCopy">Copy code</button><button type="button" class="btn small" id="vaultSaved">I saved it</button><span class="msg" id="vaultCopyMsg" role="status"></span></div>`;
  $('#vaultCopy', el).addEventListener('click', () => copyText(codeShow(code), $('#vaultCopyMsg', el), 'Copied.'));
  $('#vaultSaved', el).addEventListener('click', () => { S.ui.vaultSeen = true; persist(); sfx('tap'); if (el.dataset.vfStep) { vaultFlow('here'); return; } el.innerHTML = '<p class="cap">Code saved. Show code brings it back.</p>'; if (tab === 'home') renderBackupNudge(); });
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
  const here = !pristine(), mine = S.rev ? vaultWhen(S.rev) : '';
  const body = {
    what: () => `<h5>What the cloud copy is</h5><p>A second copy of your numbers, kept on the Burrow's server, so they are not only on this device.</p><p>It is locked with a code that only you get. Nobody else can read it, not even the person who shared this app with you.</p><p>You use it to get your numbers onto a new phone or another browser, or to get them back if this one is cleared or lost.</p><div class="row-btns"><button type="button" class="btn small solid" data-vf-next>Next: get my code</button><button type="button" class="link" data-vf-cancel>Not now</button></div>`,
    code: () => `<h5>Your recovery code</h5><div data-vf-code data-vf-step-code></div>`,
    here: () => `<h5>On this device: nothing more to do</h5><p>Every change you make is sent to the cloud copy by itself, a few seconds later. Settings always shows when it was last sent, and says so if a send did not go through.</p><p class="vf-sent" data-vf-sent role="status"></p><div class="row-btns"><button type="button" class="btn small solid" data-vf-next>Next: another phone or browser</button></div>`,
    other: () => `<h5>To get your numbers on another phone or browser</h5><ol><li>Open the Burrow there${/^https?:$/.test(location.protocol) ? `: <b>${esc(location.host)}</b>` : ''}.</li><li>On the welcome screen tap <b>Enter your recovery code</b>. If the welcome screen is gone: Settings (the gear), Cloud copy, <b>I have a code</b>.</li><li>Type or paste your code, then tap <b>Find my copy</b>.</li><li>It shows what it found. Tap <b>Load</b>, and your numbers are there.</li></ol><p>From then on both devices share the one copy. A change on one shows up on the other the next time you open it there. If both changed, the app asks which to keep, and keeps the other for ${KEEP_DAYS} days.</p><div class="row-btns"><button type="button" class="btn small solid" data-vf-done>Done</button></div>`,
    enter: () => `<h5>Bring your numbers to this device</h5><p>You need the recovery code from the device that already has your numbers. On that device: Settings, Cloud copy, <b>Show code</b>.</p><div class="row-btns inv-row"><input class="txt" id="vaultIn" type="text" autocomplete="off" spellcheck="false" placeholder="MHR-XXXX-XXXX-XXXX-XXXX-XXXX" aria-label="Recovery code" maxlength="40"><button type="button" class="btn small solid" id="vaultUse">Find my copy</button></div><p class="msg" id="vaultMsg" role="status"></p><p class="cap">Nothing on this device changes yet. The next step shows what was found first.</p><div class="row-btns"><button type="button" class="link" data-vf-cancel>Cancel</button></div>`,
    found: () => { const v = vaultFound;
      return `<h5>Found your copy</h5><p data-vf-found>${vaultFoundLine(v)}</p>`
        + (v.older ? `<p class="vf-warn" data-vf-older><b>Careful: this cloud copy is older than the numbers on this device</b>${mine ? ' (last changed ' + esc(mine) + ')' : ''}. Loading it takes this device back to that older copy.</p>`
          : here ? `<p>Loading it replaces the numbers on this device${mine ? ' (last changed ' + esc(mine) + ')' : ''}.</p>` : '<p>This device has no numbers of its own yet, so nothing is replaced.</p>')
        + (here ? `<p>The numbers that are here now are kept for ${KEEP_DAYS} days, with Undo, in case this is not what you wanted.</p>` : '')
        + `<div class="row-btns"><button type="button" class="btn small${v.older ? '' : ' solid'}" id="vaultLoad">${v.older ? 'Load the older copy anyway' : 'Load'}</button>${here ? `<button type="button" class="btn small${v.older ? ' solid' : ''}" id="vaultKeepHere">Keep what is here</button>` : '<button type="button" class="link" data-vf-cancel>Cancel</button>'}<span class="msg" id="vaultLoadMsg" role="status"></span></div>`; },
    loaded: () => `<h5>Done. Your numbers are on this device</h5><p>This device now shares the cloud copy. Every change here is sent by itself, and changes from your other device show up when you open the app.</p><p>Your code stays the same. <b>Show code</b> brings it back.</p><div class="row-btns"><button type="button" class="btn small solid" data-vf-done>Done</button></div>`
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
  on('#vaultLoad', async () => { try { await vaultUse(vaultFound, true); vaultFlow('loaded'); sfx('next'); } catch (e) { const m = $('#vaultLoadMsg'); if (m) m.textContent = 'That copy could not be loaded. Nothing was changed.'; } });
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
  $('#vaultRetry').addEventListener('click', () => { vaultPush(); sfx('tap'); });
  $('#vaultShow').addEventListener('click', () => { const c = $('#vaultCode'); if (!$('#vaultFlow').hidden) vaultFlowClose(); if (c.querySelector('#vaultCodeTxt')) { c.innerHTML = ''; return; } vaultShowCode(c, vault.code); });
  $('#vaultOff').addEventListener('click', async () => {
    const b = $('#vaultOff'); if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tap again: delete the cloud copy'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Turn off'; }, 4000); return; }
    b.dataset.armed = ''; b.textContent = 'Turn off'; vaultFlowClose(); await vaultTurnOff(true); $('#vaultCode').innerHTML = ''; cheer('Cloud copy deleted. Numbers stay on this device.'); sfx('back');
  });
  $('#vaultLoadNewer').addEventListener('click', vaultLoadNewer);
  $('#vaultKeepMine').addEventListener('click', () => { vaultNote = null; vaultPush(true); paintVault(); if (tab === 'home') renderBackupNudge(); });
}
/* test hook (only with ?sfxtest): the cloud copy functions, so a test can apply a made-up record without reaching the cloud */
if (/[?&]sfxtest\b/.test(location.search)) window.__vault = { keysFor, vaultEncrypt, vaultApply };
