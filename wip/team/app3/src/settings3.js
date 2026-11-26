/* ---------- Settings (DECISIONS_ROUND2 D2, D5, D7, E2, BD5, BE3) ----------
   One sheet: the currency shown, this device's storage line (store/persist.js), the backup file (src/backup3.js) and the
   cloud copy (src/cloud3_page.js adds its own card when it is in the page). Nothing here works out money.
   A try book shows the currency only: nothing about it is saved, backed up or sent.
   Restoring keeps the copy on this device whole first (E3.rec('copy'), the store's kept store), so Put it back can
   bring it back. A restore and Put it back save the copy BACKUP3.restamp makes (every record brought back with a new
   `at` and this device's `by`, what it lacks marked gone), so with the cloud copy on it wins the join on the next send
   and reaches the other devices; before either, the person is told so (FOR_MAKO "Open: a restore while the cloud copy
   is on"). */
const SET3 = { open: false, restore: null, was: null, dropped: null };
const setMsg3 = (text, bad) => { const el = $('#a3SetMsg'); if (el) { el.textContent = text || ''; el.classList.toggle('a3-bad', !!bad); el.hidden = !text; } };
/* a whole copy kept before a replace, in the store's own kept store [D2]; gives its id, or null when it could not be kept */
async function keepCopy3(why, pin) {
  if (!E3.book) return null;
  return (await E3.rec('copy', Object.assign({ copy: JSON.parse(JSON.stringify(E3.book)), why }, pin ? { pin: true } : {}))) || null;
}
/* replace this device's book; the old one is kept first when there is one. Gives true when saved. */
async function replaceBook3(next, why, pin) {
  const had = !!E3.book;
  if (had && !(await keepCopy3(why, pin))) return false;
  const ok = await E3.replace(next);
  if (ok && !had && typeof BurrowPersist === 'object') BurrowPersist.afterSetup().catch(() => {});   // the first book on this device [D7]
  if (ok) renderHome3();
  return ok;
}
/* a restore or Put it back: restamped over this device's copy and the copy last synced with the cloud, then saved as one
   replace, the copy here kept first */
const OTHERS3 = 'This replaces what is on your other devices too after the next send.';
async function cloudOn3() { return typeof cloudState3 === 'function' && E3.mode !== 'try' && !!(await cloudState3()).on; }
/* A restore (not Put it back) with no pinned copy yet pins the copy it keeps: the money from before the first restore
   stays, past the store's newest 5, until the person drops it */
async function restoreBook3(copy, why, opts) {
  const st = typeof cloudState3 === 'function' ? await cloudState3() : null;
  const next = BACKUP3.restamp(copy, E3.book, { by: String(E3.newId()).split('-')[0], day: E3.today(), also: st && st.on && st.base ? [st.base] : [] });
  const pin = !(opts && opts.back) && !((await E3.rec('copies')) || []).some(c => c.pin);
  return replaceBook3(next, why, pin);
}
/* setup calls this once it has saved the first book [D7] */
function afterSetup3() { return typeof BurrowPersist === 'object' ? BurrowPersist.afterSetup() : Promise.resolve(null); }

/* the Money card's words, in one place: drawn when the sheet opens and again when the book changes under it [S23] */
function setMoney3() {
  const cur = E3.book ? E3.home() : null;
  return `<h2>Money</h2>
      <p class="a3-next">${cur ? `Amounts are shown in <b data-set="cur">${esc3(cur)}</b>.` : 'The currency is chosen in setup.'}</p>
      ${cur ? '<p class="a3-sub">It stays the same once money is written down</p>' : ''}`;
}
function openSet3() {
  if (SET3.open) return;
  SET3.open = true; SET3.restore = null;
  const sheet = $('#a3Set'), tryBook = E3.mode === 'try';
  const money = `<div class="a3-card" data-card="money">${setMoney3()}</div>`;
  const tryNote = `<p class="a3-later" data-set="trynote">Made-up numbers: nothing here is saved, backed up or sent.</p>`;
  const device = `<div class="a3-card" data-card="device"><h2>This device</h2>
      <p class="a3-next" id="a3Space">Checking what this device keeps.</p>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3Persist" hidden>Ask the browser to keep it</button></div></div>`;
  const backup = `<div class="a3-card" data-card="backup"><h2>Backup file</h2>
      <p class="a3-next">A backup file is your own copy of your money, to keep anywhere. Restoring one replaces the money on this device. What is here now is kept first, so Put it back can bring it back.</p>
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
  const word = '<div class="a3-card" data-card="word" id="a3SetWord"></div>';
  /* [AI_JOIN_FIXES J] the assistant's error log, on this device only */
  const ailog = `<div class="a3-card" data-card="ailog"><h2>The assistant's error log</h2>
      <p class="a3-sub">When a message to the assistant fails, this device notes when, what kind of message, the error and the server's answer. Never your words or any money figures. Copy it to send to whoever helps you</p>
      <div class="a3-actions"><button type="button" class="a3-btn" id="a3AiLogCopy">Copy the assistant's error log</button><button type="button" class="a3-btn" id="a3AiLogClear">Clear</button></div></div>`;   // the code word for the AI: a device thing, shown for a try book too
  sheet.innerHTML = `<div class="a3-sheet-in">
      <h1 id="a3SetT">Settings</h1>
      <p class="a3-warn" id="a3SetMsg" role="status" hidden></p>
      ${money}${tryBook ? tryNote : `${device}${backup}${cloud}`}${word}${tryBook ? '' : ailog}
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3SetClose">Done</button></div></div>`;
  /* over whatever shows (the panels and the tab bar), put back as they were on Done */
  SET3.was = [...document.querySelectorAll('[data-panel], .a3-tabs, #a3Check, #a3StmtBar, #a3Stmt')].map(el => [el, el.hidden]);
  SET3.was.forEach(([el]) => { el.hidden = true; }); sheet.hidden = false;
  $('#a3SetClose').addEventListener('click', closeSet3);
  paintWord3();
  if (!tryBook) {
    $('#a3AiLogCopy').addEventListener('click', async () => {
      const log = (await E3.rec('aiLog')) || [];
      const t = chat3LogText(log);
      try { await navigator.clipboard.writeText(t); setMsg3(log.length ? 'Copied. Paste it where you need it.' : 'Copied. The log is empty.'); } catch (e) { setMsg3('Could not copy here. Nothing in the log was changed.', true); }
    });
    $('#a3AiLogClear').addEventListener('click', async () => {
      const was = (await E3.rec('aiLog')) || [];
      await E3.rec('aiLog', []);
      MSG3.post({ kind: 'undo', key: 'act3', text: "The assistant's error log is cleared", action: { label: 'Undo', run: async () => { await E3.rec('aiLog', was); MSG3.post({ kind: 'toast', key: 'act3', text: 'Undone' }); } } });
    });
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
  SET3.open = false; SET3.restore = null; SET3.dropped = null;   // a dropped copy is held for Undo only while Settings is open
  $('#a3Set').hidden = true; $('#a3Set').innerHTML = '';
  (SET3.was || []).forEach(([el, h]) => { el.hidden = h; }); SET3.was = null;
  if (SET3.stale) { SET3.stale = false; redrawTabs3(); }
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
/* the code word for the AI (stmt3_ai.js keeps it on this device only): change it or clear it */
function paintWord3() {
  const el = $('#a3SetWord'); if (!el) return;
  const w = STMT3_AI.word();
  el.innerHTML = `<h2>Code word for the AI</h2>
    <p class="a3-next" data-set="word">${w ? 'A code word is kept on this device only. It is never in your backup file or cloud copy, and goes only to this page\'s own server.' : 'No code word is kept on this device. One is needed only when the page\'s owner asks for it.'}</p>
    <div class="a3-field"><label for="a3SetWordIn">${w ? 'New code word' : 'Code word'}</label>
      <input class="a3-in a3-text" id="a3SetWordIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    <div class="a3-actions"><button type="button" class="a3-btn" id="a3SetWordKeep">${w ? 'Change it' : 'Keep it'}</button>${w ? '<button type="button" class="a3-btn" id="a3SetWordClear">Clear it</button>' : ''}</div>`;
  const keep = () => {
    const v = $('#a3SetWordIn').value.trim();
    if (!v) { setMsg3('Type the code word first.', true); $('#a3SetWordIn').focus(); return; }
    STMT3_AI.setWord(v); paintWord3(); setMsg3('The code word is kept on this device.');
  };
  $('#a3SetWordKeep').addEventListener('click', keep);
  $('#a3SetWordIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); keep(); } });
  if (w) $('#a3SetWordClear').addEventListener('click', () => { STMT3_AI.setWord(''); paintWord3(); setMsg3('The code word is cleared from this device.'); });
  paintAiOff3();
}
/* [C5] when this page's own server says its AI is off (/api/health, ai false, or the relay's own "off" answer to the
   assistant), Settings says so in the panel's words (AI_JOIN_FIXES G: one wording); no server, no line */
async function paintAiOff3() {
  const h = await STMT3_AI.health(), el = $('#a3SetWord');
  const off = (h && h.ai === false) || (h && typeof CHAT3 === 'object' && CHAT3.off === true);
  if (!SET3.open || !el || !off || el.querySelector('[data-set=aioff]')) return;
  el.insertAdjacentHTML('afterbegin', `<p class="a3-warn" data-set="aioff">${esc3(CHAT3_WORDS.offLine)}. Everything else still works</p>`);
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
  const on = await cloudOn3(), n = (r.copy.events || []).filter(e => e && !e.gone).length, others = on && E3.book ? ' ' + OTHERS3 : '';
  const s = E3.book ? BACKUP3.since(r.copy, E3.book) : null;
  /* [M7; qc-data-safety B2] records in the backup dated or told after today (a clock that was ahead): said before the yes */
  const nAhead = typeof rcAhead3 === 'function' ? rcAhead3(r.copy).length : 0;
  const aheadSay = nAhead ? ` ${nAhead === 1 ? '1 of them is' : nAhead + ' of them are'} dated after today. They do not count until their day, and Receipts lists them.` : '';
  const after = E3.book ? `<br>Anything you logged after this backup was made goes${on ? ', on every device' : ' from this device'}${s.n ? `: ${things3(s.n)} here now ${s.n === 1 ? 'is' : 'are'} not in it ${kinds3(s)}` : ''}.${s.changed ? ` ${things3(s.changed)} here now ${s.changed === 1 ? 'goes back to how the backup has it' : 'go back to how the backup has them'}.` : ''}${s.back && s.back.n ? ` ${things3(s.back.n)} in the backup and not here now ${s.back.n === 1 ? 'comes' : 'come'} back ${kinds3(s.back)}.` : ''} Put it back brings it back.` : '';
  ask.innerHTML = `<p class="a3-warn" data-set="restoreask">${E3.book ? 'This replaces the money on this device with the backup. What is here now is kept, and Put it back brings it back.' : 'This puts the money from the backup on this device.'} The backup holds ${n} record${n === 1 ? '' : 's'}.${aheadSay}${others}${after}</p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3BkGo">Restore it</button><button type="button" class="a3-btn" id="a3BkNo">Cancel</button></div>`;
  $('#a3BkGo').addEventListener('click', async () => {
    const ok = await restoreBook3(SET3.restore, 'Before a backup was restored');
    SET3.restore = null; ask.innerHTML = '';
    setMsg3(ok ? 'Restored from the backup file.' : 'This could not be saved on this device. Nothing changed.', !ok);
    paintKept3();
    const save = $('#a3BkSave'); if (save) save.disabled = !E3.book;
  });
  $('#a3BkNo').addEventListener('click', () => { SET3.restore = null; ask.innerHTML = ''; });
}
/* the one line before Put it back and Drop it: how many things, in which kinds (counts from BACKUP3.since, no sums) */
const things3 = n => (n === 1 ? '1 thing' : n + ' things');
const kinds3 = s => '(' + [s.money ? 'money in or out: ' + s.money : '', s.checks ? 'bank checks: ' + s.checks : '', s.other ? 'other: ' + s.other : ''].filter(Boolean).join(', ') + ')';
function backWords3(s, on) {
  const all = s.all, where = on ? ', on every device after the next send' : ', from this device';
  if (!all) return 'Put this copy back? Nothing was added or changed since it was kept. What is here now is kept first, with its own Put it back.';
  const added = s.n ? `${things3(s.n)} added since it was kept ${s.n === 1 ? 'goes' : 'go'} ${kinds3(s)}` : 'Nothing was added since it was kept';
  const b = s.back || { n: 0 };
  const changed = s.changed ? `${b.n ? ',' : ', and'} ${things3(s.changed)} changed since ${s.changed === 1 ? 'goes back to how it was' : 'go back to how they were'}` : '';
  /* [qc-foundation point 6] what the copy holds that is not here now (taken out since, by a restore or a remove) comes back */
  const back = b.n ? `, and ${things3(b.n)} taken out since ${b.n === 1 ? 'comes' : 'come'} back ${kinds3(b)}` : '';
  return `Put this copy back? ${added}${changed}${back}${where}. What is here now is kept first, and its own Put it back brings ${all === 1 ? 'it' : 'them'} back.`;
}
function dropWords3(s) {
  return `Drop this copy? It is the only copy of the money from before your first restore${s.n ? `, with ${things3(s.n)} that ${s.n === 1 ? 'is' : 'are'} not in the money here now ${kinds3(s)}` : ''}. Undo brings it back while Settings stays open, and after that nothing can.`;
}
/* a copy dropped while Settings is open: one line with Undo, which keeps it again as it was (its own time, pinned) */
const dropped3 = () => (SET3.dropped ? `<p class="a3-sub" data-set="dropped">Dropped that kept copy. <button type="button" class="a3-btn" id="a3BkUndrop">Undo</button></p>` : '');
async function undrop3() {
  const k = SET3.dropped; if (!k) return;
  const ok = await E3.rec('copy', { copy: k.copy, why: k.why, pin: true, at: k.at });
  if (ok) SET3.dropped = null;
  setMsg3(ok ? 'That kept copy is back.' : 'It could not be kept again on this device. Undo is still here.', !ok);
  paintKept3();
}
/* every kept whole copy, newest first, each with its time and its own Put it back; the pinned one (from before the
   first restore) also offers Drop it. Both ask first, in one line: what goes and how to get it back (M6: ask first for
   deletes). A dropped copy is held until Settings closes, so Undo can keep it again as it was (M14)
   (draft words, FOR_MAKO copy pass) */
async function paintKept3() {
  const el = $('#a3BkKept'); if (!el) return;
  const list = (await E3.rec('copies')) || [], others = (await cloudOn3()) ? ' ' + OTHERS3 : '';
  if (!SET3.open) return;
  const wire = () => { const u = $('#a3BkUndrop'); if (u) u.addEventListener('click', undrop3); };
  if (!list.length) { el.innerHTML = dropped3(); wire(); return; }
  el.innerHTML = `${dropped3()}<p class="a3-sub" data-set="keptnote">The money that was here before each restore is kept. Put it back brings that money back.${others}</p>
    <ul class="a3-rows">${list.map((c, i) => `<li data-kept="${esc3(c.id)}"${c.pin ? ' data-pin="1"' : ''}><span data-set="kept">${esc3(c.why)}, ${esc3(day3(c.at.slice(0, 10), E3.today().slice(0, 4)))} ${esc3(c.at.slice(11, 16))}${c.pin ? '. Kept until you drop it' : ''}</span>
      <button type="button" class="a3-btn" data-back${i === 0 ? ' id="a3BkBack"' : ''}>Put it back</button>${c.pin ? '<button type="button" class="a3-btn" data-drop>Drop it</button>' : ''}</li>`).join('')}</ul>
    <div id="a3BkKeptAsk"></div>`;
  wire();
  const ask = $('#a3BkKeptAsk');
  const question = (name, words, yes, go) => {
    const id = name === 'back' ? 'a3BkBack' : 'a3BkDrop';
    ask.innerHTML = `<p class="a3-warn" data-set="${name}ask">${esc3(words)}</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="${id}Go">${yes}</button><button type="button" class="a3-btn" id="${id}No">Cancel</button></div>`;
    $('#' + id + 'Go').addEventListener('click', go);
    $('#' + id + 'No').addEventListener('click', () => { ask.innerHTML = ''; });
    $('#' + id + 'No').focus();
  };
  for (const li of el.querySelectorAll('[data-kept]')) {
    const id = li.dataset.kept;
    li.querySelector('[data-back]').addEventListener('click', async () => {
      const k = await E3.rec(id);
      if (!k || !k.copy) { setMsg3('That kept copy is gone. Nothing changed.', true); return; }
      question('back', backWords3(BACKUP3.since(k.copy, E3.book), await cloudOn3()), 'Put it back', async () => {
        const ok = await restoreBook3(k.copy, 'Before a kept copy was put back', { back: true });
        setMsg3(ok ? 'Put back. The money that was here a moment ago is kept too.' : 'This could not be saved on this device. Nothing changed.', !ok);
        paintKept3();
      });
    });
    const drop = li.querySelector('[data-drop]');
    if (drop) drop.addEventListener('click', async () => {
      const k = await E3.rec(id);
      if (!k || !k.copy) { setMsg3('That kept copy is gone. Nothing changed.', true); return; }
      question('drop', dropWords3(BACKUP3.since(E3.book, k.copy)), 'Drop it', async () => {
        const ok = await E3.rec('drop', id);
        setMsg3(ok ? '' : 'That kept copy could not be dropped. Nothing changed.', !ok);
        if (ok) SET3.dropped = k;
        paintKept3();
      });
    });
  }
}
/* [C9, S23] the book was replaced or joined while Settings was open (a restore, Put it back, the cloud copy): the sheet's
   own Money card and Save button are drawn again at once, and Receipts and Plan are drawn again when the sheet closes
   (they are hidden under it, and a hidden panel does not draw). Home is drawn by whoever replaced the book. */
function redrawTabs3() {
  if (typeof renderRc3 === 'function' && E3.book) { try { const k = rcKeep3(); renderRc3(); rcPut3(k); } catch (e) { /* Receipts draws itself on its next tap */ } }
  if (typeof renderPlan3 === 'function') { try { renderPlan3(); } catch (e) { /* the plan lane's own */ } }
}
E3.onSaved(() => {
  if (!SET3.open) return;
  SET3.stale = true;
  const m = $('#a3Set [data-card=money]'), save = $('#a3BkSave');
  if (m) m.innerHTML = setMoney3();
  if (save) save.disabled = !E3.book;
});
/* the header's Settings button and Escape, without touching the start file */
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#a3SetGo')) openSet3(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && SET3.open && !SET3.restore) closeSet3(); });
