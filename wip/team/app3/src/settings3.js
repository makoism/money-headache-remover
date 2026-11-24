/* ---------- Settings (DECISIONS_ROUND2 D2, D5, D7, E2, BD5, BE3) ----------
   One sheet: the currency shown, this device's storage line (store/persist.js), the backup file (src/backup3.js) and the
   cloud copy (src/cloud3_page.js adds its own card when it is in the page). Nothing here works out money.
   A try book shows the currency only: nothing about it is saved, backed up or sent.
   Restoring keeps the copy on this device whole first (E3.rec('copy'), the store's kept store), so Put it back can
   bring it back. */
const SET3 = { open: false, restore: null, was: null };
const setMsg3 = (text, bad) => { const el = $('#a3SetMsg'); if (el) { el.textContent = text || ''; el.classList.toggle('a3-bad', !!bad); el.hidden = !text; } };
/* a whole copy kept before a replace, in the store's own kept store [D2]; gives its id, or null when it could not be kept */
async function keepCopy3(why) {
  if (!E3.book) return null;
  return (await E3.rec('copy', { copy: JSON.parse(JSON.stringify(E3.book)), why })) || null;
}
/* replace this device's book; the old one is kept first when there is one. Gives true when saved. */
async function replaceBook3(next, why) {
  const had = !!E3.book;
  if (had && !(await keepCopy3(why))) return false;
  const ok = await E3.replace(next);
  if (ok && !had && typeof BurrowPersist === 'object') BurrowPersist.afterSetup().catch(() => {});   // the first book on this device [D7]
  if (ok) renderHome3();
  return ok;
}
/* setup calls this once it has saved the first book [D7] */
function afterSetup3() { return typeof BurrowPersist === 'object' ? BurrowPersist.afterSetup() : Promise.resolve(null); }

function openSet3() {
  if (SET3.open) return;
  SET3.open = true; SET3.restore = null;
  const sheet = $('#a3Set'), tryBook = E3.mode === 'try';
  const cur = E3.book ? E3.home() : null;
  const money = `<div class="a3-card" data-card="money"><h2>Money</h2>
      <p class="a3-next">${cur ? `Amounts are shown in <b data-set="cur">${esc3(cur)}</b>.` : 'The currency is chosen in setup.'}</p>
      ${cur ? '<p class="a3-sub">It stays the same once money is written down.</p>' : ''}</div>`;
  const tryNote = `<p class="a3-later" data-set="trynote">Made-up numbers: nothing here is saved, backed up or sent.</p>`;
  const device = `<div class="a3-card" data-card="device"><h2>This device</h2>
      <p class="a3-next" id="a3Space">Checking what this device keeps.</p>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3Persist" hidden>Ask the browser to keep it</button></div></div>`;
  const backup = `<div class="a3-card" data-card="backup"><h2>Backup file</h2>
      <p class="a3-next">A backup file is your own copy of your money, to keep anywhere. Restoring one replaces the money on this device; what is here now is kept first, so Put it back can bring it back.</p>
      <label class="a3-check"><input type="checkbox" id="a3BkLock"> Lock it with a code</label>
      <div class="a3-field" id="a3BkCodeF" hidden><label for="a3BkCode">Code for this file</label>
        <input class="a3-in a3-text" id="a3BkCode" type="password" autocomplete="new-password" aria-describedby="a3BkCodeH">
        <p class="a3-sub" id="a3BkCodeH">At least 6 letters or digits. Without it the file cannot be opened, and nobody can get it back.</p></div>
      <div class="a3-actions">
        <button type="button" class="a3-btn solid" id="a3BkSave"${E3.book ? '' : ' disabled'}>Save a backup file</button>
        <button type="button" class="a3-btn" id="a3BkLoad">Restore from a file</button>
        <input type="file" id="a3BkFile" accept=".json,.gz,application/json,application/gzip" hidden>
      </div>
      <div id="a3BkAsk"></div>
      <div id="a3BkKept"></div></div>`;
  const cloud = typeof cloudCard3 === 'function' ? cloudCard3() : '';
  sheet.innerHTML = `<div class="a3-sheet-in">
      <h1 id="a3SetT">Settings</h1>
      <p class="a3-warn" id="a3SetMsg" role="status" hidden></p>
      ${money}${ratesCard3()}${tryBook ? tryNote : `${device}${backup}${cloud}`}
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3SetClose">Done</button></div></div>`;
  /* over whatever shows (the panels and the tab bar), put back as they were on Done */
  SET3.was = [...document.querySelectorAll('[data-panel], .a3-tabs, #a3Check, #a3StmtBar, #a3Stmt')].map(el => [el, el.hidden]);
  SET3.was.forEach(([el]) => { el.hidden = true; }); sheet.hidden = false;
  $('#a3SetClose').addEventListener('click', closeSet3);
  wireRates3();   // [stage 2 S5] Rates (settings3_rates.js)
  if (!tryBook) {
    paintSpace3();
    $('#a3Persist').addEventListener('click', async () => { await BurrowPersist.askToKeep(); paintSpace3(); });
    $('#a3BkLock').addEventListener('change', e => { $('#a3BkCodeF').hidden = !e.target.checked; if (e.target.checked) $('#a3BkCode').focus(); });
    $('#a3BkSave').addEventListener('click', saveBackup3);
    $('#a3BkLoad').addEventListener('click', () => { $('#a3BkFile').value = ''; $('#a3BkFile').click(); });
    $('#a3BkFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) readBackup3(f, ''); });
    paintKept3();
    if (typeof wireCloud3 === 'function') wireCloud3();
  }
  $('#a3SetT').focus && $('#a3SetT').setAttribute('tabindex', '-1');
  $('#a3SetT').focus();
}
function closeSet3() {
  SET3.open = false; SET3.restore = null;
  $('#a3Set').hidden = true; $('#a3Set').innerHTML = '';
  (SET3.was || []).forEach(([el, h]) => { el.hidden = h; }); SET3.was = null;
  const b = $('#a3SetGo'); if (b) b.focus();
}
/* the first screen's "I already use the burrow on another device": Settings, with the cloud code box open and the
   backup file's Restore beside it (draft words, FOR_MAKO copy pass) */
async function fromOther3() {
  openSet3();
  $('#a3SetT').insertAdjacentHTML('afterend', `<p class="a3-next" data-set="other">Type the cloud code from your other device, or restore a backup file you saved there</p>`);
  for (let i = 0; i < 40 && SET3.open && !$('#a3CloudHave'); i++) await new Promise(r => setTimeout(r, 25));   // the cloud card paints after it reads its state
  if (SET3.open && $('#a3CloudHave') && typeof haveCode3 === 'function') haveCode3();
}
async function paintSpace3() {
  const el = $('#a3Space'); if (!el || typeof BurrowPersist !== 'object') return;
  const s = await BurrowPersist.space();
  if (!SET3.open) return;
  el.textContent = s.words;
  $('#a3Persist').hidden = s.persisted !== false;
}
async function saveBackup3() {
  const lock = $('#a3BkLock').checked, code = lock ? $('#a3BkCode').value : '';
  if (lock && !BACKUP3.codeOk(code)) { setMsg3(BACKUP3.WORDS.short, true); $('#a3BkCode').focus(); return; }
  const m = await BACKUP3.make(E3.book, { code, day: E3.today() });
  if (!m.ok) { setMsg3(m.words, true); return; }
  const url = URL.createObjectURL(new Blob([m.text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = m.name; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  $('#a3BkCode').value = '';
  setMsg3(`Saved ${m.name}${lock ? ', locked with your code' : ''}. Keep it somewhere safe, away from this device.`);
}
/* a chosen file: locked ones ask for the code; anything readable asks before it replaces the money here */
async function readBackup3(file, code) {
  const r = await BACKUP3.read(file, { code });
  const ask = $('#a3BkAsk');
  if (!r.ok && r.locked) {
    ask.innerHTML = `<div class="a3-field"><label for="a3BkOpen">Code for this file</label>
        <input class="a3-in a3-text" id="a3BkOpen" type="password" autocomplete="off">
        <p class="a3-err" id="a3BkOpenErr" role="alert">${r.why === 'key' ? esc3(r.words) : ''}</p></div>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3BkOpenGo">Open it</button><button type="button" class="a3-btn" id="a3BkOpenNo">Cancel</button></div>`;
    $('#a3BkOpenGo').addEventListener('click', () => readBackup3(file, $('#a3BkOpen').value));
    $('#a3BkOpen').addEventListener('keydown', e => { if (e.key === 'Enter') readBackup3(file, $('#a3BkOpen').value); });
    $('#a3BkOpenNo').addEventListener('click', () => { ask.innerHTML = ''; });
    $('#a3BkOpen').focus();
    return;
  }
  if (!r.ok) { ask.innerHTML = ''; setMsg3(r.words, true); return; }
  SET3.restore = r.copy;
  const n = (r.copy.events || []).filter(e => e && !e.gone).length;
  ask.innerHTML = `<p class="a3-warn" data-set="restoreask">${E3.book ? 'This replaces the money on this device with the backup. What is here now is kept, and Put it back brings it back.' : 'This puts the money from the backup on this device.'} The backup holds ${n} record${n === 1 ? '' : 's'}.</p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3BkGo">Restore it</button><button type="button" class="a3-btn" id="a3BkNo">Cancel</button></div>`;
  $('#a3BkGo').addEventListener('click', async () => {
    const ok = await replaceBook3(SET3.restore, 'Before a backup was restored');
    SET3.restore = null; ask.innerHTML = '';
    setMsg3(ok ? 'Restored from the backup file.' : 'This could not be saved on this device. Nothing changed.', !ok);
    paintKept3();
    const save = $('#a3BkSave'); if (save) save.disabled = !E3.book;
  });
  $('#a3BkNo').addEventListener('click', () => { SET3.restore = null; ask.innerHTML = ''; });
}
async function paintKept3() {
  const el = $('#a3BkKept'); if (!el) return;
  const list = (await E3.rec('copies')) || [];
  if (!SET3.open) return;
  const last = list[0];
  el.innerHTML = last ? `<p class="a3-sub" data-set="kept">${esc3(last.why)}, ${esc3(day3(last.at.slice(0, 10), E3.today().slice(0, 4)))} ${esc3(last.at.slice(11, 16))}: the money that was here is kept.</p>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3BkBack">Put it back</button></div>` : '';
  if (last) $('#a3BkBack').addEventListener('click', async () => {
    const k = await E3.rec(last.id);
    if (!k || !k.copy) { setMsg3('That kept copy is gone. Nothing changed.', true); return; }
    const ok = await replaceBook3(k.copy, 'Before a kept copy was put back');
    setMsg3(ok ? 'Put back. The money that was here a moment ago is kept too.' : 'This could not be saved on this device. Nothing changed.', !ok);
    paintKept3();
  });
}
/* the header's Settings button and Escape, without touching the start file */
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#a3SetGo')) openSet3(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && SET3.open && !SET3.restore) closeSet3(); });
