/* ===== the cloud copy: an encrypted backup on the site's own server =====
   Everything is encrypted in this browser with a key made from a recovery code the person keeps. The server (functions/api/vault)
   stores only ciphertext under an id that is also made from the code, so the code is the only way in: not the owner of the site,
   not this page's author, nobody. Losing the code means the cloud copy cannot be opened; the numbers on the device are not affected.
   Available only when the page is served from its own address (see relayBase in ui41.js). Nothing here touches the money model. */
const VAULT_KEY = 'mhr-vault', VAULT_SALT = 'mhr2000-vault-v1', CODE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let vault = { code: '', rev: 0, on: false }, vaultTimer = 0, vaultBusy = false, vaultAgain = false, vaultKeys = null, vaultNote = null, vaultChecked = false;
function vaultLoadLocal() { try { const v = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); if (v && typeof v.code === 'string' && v.code) vault = { code: v.code, rev: +v.rev || 0, on: true }; } catch (e) { /* none */ } }
function vaultSaveLocal() { try { if (vault.on) localStorage.setItem(VAULT_KEY, JSON.stringify({ code: vault.code, rev: vault.rev })); else localStorage.removeItem(VAULT_KEY); } catch (e) { /* no storage */ } }
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
function vaultQueue(soon) { if (!vault.on || !vaultAvailable()) return; clearTimeout(vaultTimer); vaultTimer = setTimeout(vaultPush, soon ? 50 : 3000); }
async function vaultPush(force) {
  if (!vault.on || !vaultAvailable()) return;
  if (vaultBusy) { vaultAgain = true; return; }
  vaultBusy = true;
  try {
    const rev = S.rev || Date.now(); if (!force && rev <= vault.rev) return;
    const k = await keysFor(vault.code), enc = await vaultEncrypt(k, JSON.stringify(S));
    const r = await vaultReq(k, 'PUT', Object.assign({ blob: enc.blob, iv: enc.iv, rev }, force ? { force: true } : {}));
    if (r.ok) { vault.rev = rev; vaultNote = null; vaultSaveLocal(); paintVault(); }
    else if (r.status === 409) { vaultNote = { kind: 'newer', rev: r.j.rev, when: r.j.updated }; paintVault(); if (tab === 'home') renderBackupNudge(); }
    else if (r.status === 403) { vaultNote = { kind: 'bad' }; paintVault(); }
  } catch (e) { /* offline: the next save tries again */ }
  finally { vaultBusy = false; if (vaultAgain) { vaultAgain = false; vaultQueue(); } }
}
/* on opening: if a newer copy sits in the cloud (another device wrote it), load it when this page has nothing of its own, otherwise ask */
async function vaultCheck() {
  if (vaultChecked) return; vaultChecked = true;
  if (!vault.on) { paintVault(); return; }
  await relayHealth(); if (!vaultAvailable()) { paintVault(); return; }
  try {
    const k = await keysFor(vault.code), r = await vaultReq(k, 'GET');
    if (r.status === 404) { vaultQueue(true); return; }
    if (r.status === 403) { vaultNote = { kind: 'bad' }; paintVault(); return; }
    if (!r.ok) return;
    const srv = r.j;
    if (srv.rev > (S.rev || 0)) {
      if (pristine()) { await vaultApply(k, srv); bkNote = null; }
      else { vaultNote = { kind: 'newer', rev: srv.rev, when: srv.updated }; if (tab === 'home') renderBackupNudge(); }
    } else if (srv.rev < (S.rev || 0)) vaultQueue(true);
    else vault.rev = srv.rev;
    vaultSaveLocal();
  } catch (e) { /* offline */ }
  paintVault();
}
async function vaultApply(k, srv) {
  const d = JSON.parse(await vaultDecrypt(k, srv.blob, srv.iv));
  if (!okBackup(d)) throw new Error('bad');
  const old = S; S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, S.ui, { sampleHidden: true }); if (!Array.isArray(d.receipts)) S.receipts = old.receipts;
  S.rev = srv.rev; vault.rev = srv.rev; vaultNote = null;
  editRow = null; editGoal = null; editRc = null; itemsSig = '';
  if (tourIsOpen) closeTour(false); else { flush(); restructure(); }
  S.ui.bk = Date.now(); delete S.ui.bkLater;
}
async function vaultLoadNewer() {
  if (!vaultNote || vaultNote.kind !== 'newer') return;
  try { const k = await keysFor(vault.code), r = await vaultReq(k, 'GET'); if (r.ok) { await vaultApply(k, r.j); cheer('Loaded the newer copy.'); sfx('next'); } }
  catch (e) { cheer('Could not load the cloud copy.'); }
  paintVault(); if (tab === 'home') renderBackupNudge();
}
/* turn on: a new code, shown once; the person must say they saved it */
async function vaultTurnOn() {
  const code = newCode(); vault = { code, rev: 0, on: true }; vaultKeys = null; vaultSaveLocal();
  S.ui.vaultSeen = false; persist(); paintVault(); vaultQueue(true);
  return code;
}
async function vaultTurnOff(deleteCloud) {
  if (deleteCloud && vault.on) { try { const k = await keysFor(vault.code); await vaultReq(k, 'DELETE'); } catch (e) { /* best effort */ } }
  vault = { code: '', rev: 0, on: false }; vaultKeys = null; vaultNote = null; vaultSaveLocal(); delete S.ui.vaultSeen; persist(); paintVault();
}
/* restore with a code typed in: used on a new phone, or after losing the numbers */
async function vaultRestore(raw, msgEl) {
  const code = codeClean(raw); if (!codeValid(code)) { msgEl.textContent = 'The code is 20 letters and digits, like MHR-XXXX-XXXX-XXXX-XXXX-XXXX.'; return false; }
  await relayHealth(); if (!vaultAvailable()) { msgEl.textContent = 'Cloud backup is not available from here.'; return false; }
  msgEl.textContent = 'Checking…';
  try {
    const k = await keysFor(code), r = await vaultReq(k, 'GET');
    if (r.status === 404) { msgEl.textContent = 'No cloud copy for this code. Check every character.'; return false; }
    if (!r.ok) { msgEl.textContent = 'Could not reach the cloud copy. Try again.'; return false; }
    vault = { code, rev: 0, on: true }; vaultKeys = k;
    await vaultApply(k, r.j); vaultSaveLocal(); msgEl.textContent = 'Loaded.'; sfx('next'); return true;
  } catch (e) { vault = { code: '', rev: 0, on: false }; vaultKeys = null; vaultSaveLocal(); msgEl.textContent = 'That copy could not be opened with this code.'; return false; }
}
/* ---------- what Settings shows ---------- */
function paintVault() {
  const box = $('#vaultBox'); if (!box) return;
  const can = vaultAvailable();
  box.hidden = !can && !vault.on;
  if (box.hidden) return;
  const st = $('#vaultState'), code = $('#vaultCode');
  if (!vault.on) { st.textContent = 'Off. Your numbers live on this device only.'; code.hidden = true; }
  else {
    const when = vault.rev ? new Date(vault.rev).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    st.textContent = vaultNote && vaultNote.kind === 'bad' ? 'The cloud copy does not accept this code any more. Turn off and on again to start a new one.'
      : vaultNote && vaultNote.kind === 'newer' ? 'A newer copy is in the cloud (from another device).'
      : !can ? 'On, but the cloud cannot be reached from here right now.'
      : when ? `On. Last sent ${when}.` : 'On. Sending the first copy…';
    code.hidden = false;
  }
  $('#vaultOn').hidden = vault.on; $('#vaultOff').hidden = !vault.on; $('#vaultShow').hidden = !vault.on; $('#vaultLoadNewer').hidden = !(vaultNote && vaultNote.kind === 'newer');
  $('#vaultKeepMine').hidden = !(vaultNote && vaultNote.kind === 'newer');
}
function vaultShowCode(el, code) {
  el.innerHTML = `<p class="vault-code" id="vaultCodeTxt">${esc(codeShow(code))}</p><p class="cap">This code is the only way to open your cloud copy on another phone or after losing this one. Save it in your notes or password app. It cannot be recovered.</p><div class="row-btns"><button type="button" class="btn small solid" id="vaultCopy">Copy code</button><button type="button" class="btn small" id="vaultSaved">I saved it</button><span class="msg" id="vaultCopyMsg" role="status"></span></div>`;
  $('#vaultCopy', el).addEventListener('click', () => copyText(codeShow(code), $('#vaultCopyMsg', el), 'Copied.'));
  $('#vaultSaved', el).addEventListener('click', () => { S.ui.vaultSeen = true; persist(); el.innerHTML = '<p class="cap">Code saved. Show code brings it back.</p>'; if (tab === 'home') renderBackupNudge(); sfx('tap'); });
}
function wireVault() {
  vaultLoadLocal();
  const box = $('#vaultBox'); if (!box) return;
  $('#vaultOn').addEventListener('click', async () => { const code = await vaultTurnOn(); vaultShowCode($('#vaultCode'), code); sfx('next'); });
  $('#vaultShow').addEventListener('click', () => { const c = $('#vaultCode'); if (c.querySelector('#vaultCodeTxt')) { c.innerHTML = ''; return; } vaultShowCode(c, vault.code); });
  $('#vaultOff').addEventListener('click', async () => {
    const b = $('#vaultOff'); if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tap again: delete the cloud copy'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Turn off'; }, 4000); return; }
    b.dataset.armed = ''; b.textContent = 'Turn off'; await vaultTurnOff(true); $('#vaultCode').innerHTML = ''; cheer('Cloud copy deleted. Numbers stay on this device.'); sfx('back');
  });
  $('#vaultLoadNewer').addEventListener('click', vaultLoadNewer);
  $('#vaultKeepMine').addEventListener('click', () => { vaultNote = null; vaultPush(true); paintVault(); if (tab === 'home') renderBackupNudge(); });
  $('#vaultUse').addEventListener('click', async () => { const ok = await vaultRestore($('#vaultIn').value, $('#vaultMsg')); if (ok) { $('#vaultIn').value = ''; paintVault(); } });
  $('#vaultIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#vaultUse').click(); } });
}
