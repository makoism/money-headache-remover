/* ---------- start ---------- */
/* for the page tests: the book's door, read from outside the page's closure (the page never reads it) */
root3.BurrowApp3 = { E3, ACT3 };
/* the one tab switch: a button with data-tab="<name>" shows the panel with data-panel="<name>" and hides every other
   panel. A sheet open over Home (Check your bank) closes first, so its close cannot bring Home back beside the new tab. */
function showTab3(name) {
  const on = document.querySelector(`[data-panel="${name}"]`);
  if (!on) return;
  if (!$('#a3Check').hidden) closeCheck3();
  if (!$('#a3Checks').hidden) closeChecks3();
  if (on.hidden || $$('[data-panel]').some(p => p !== on && !p.hidden)) {
    for (const p of $$('[data-panel]')) p.hidden = p !== on;
    if (name === 'receipts') renderRc3();
    scrollTo(0, 0);
  }   // already shown alone: a second tap keeps what is typed
  for (const b of $$('[data-tab]')) { if (b.dataset.tab === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab3(b.dataset.tab); });
/* the yellow band on a try book, with the day box (a plain file has no address to carry ?today=) */
function tryBand3() {
  const t = $('#a3Try'); t.hidden = false;
  t.innerHTML = `<span>Made-up numbers shaped like a real month. Nothing you do here is saved</span>
    <label class="a3-day">Show the page as on <input type="date" id="a3Day" value="${esc3(E3.today())}"></label>
    <button type="button" class="a3-btn" id="a3TryOut">Set up with my own numbers</button>`;
  /* a cleared day box goes back to the day the page is showing: the box never sits empty over a page that shows a day */
  $('#a3Day').addEventListener('change', e => { if (!e.target.value) { e.target.value = E3.today(); return; } E3.setToday(e.target.value); if (!$('#a3Check').hidden) closeCheck3(); if (!$('#a3Checks').hidden) closeChecks3(); renderHome3(); });
  $('#a3TryOut').addEventListener('click', leaveTry3);
}
/* out of the made-up numbers: nothing of them is written; this device's own book shows when it keeps one, else the
   assistant on the first screen (AI_JOIN_FIXES I4: never the setup forms; "Set up on the screens instead" is there) */
async function leaveTry3() {
  if (SET3.open) closeSet3();
  if (REM3.open) closeRem3();
  if (!$('#a3Stmt').hidden) stmt3Close();
  showTab3('home');
  if (typeof PL3 === 'object') PL3.form = null;
  if (typeof RC3 === 'object') { RC3.edit = null; RC3.last = null; }
  const t = $('#a3Try'); t.hidden = true; t.innerHTML = '';
  await E3.leaveTry();
  if (typeof chat3Kept === 'function') await chat3Kept();   // the chat kept on this device, never the made-up visit's
  renderHome3();
  if (typeof renderChat3 === 'function') renderChat3();
}
(async () => {
  try { $('#a3Pix').innerHTML = pix('sprout', 2); } catch (e) { /* art is a nicety */ }
  await E3.load();
  if (E3.mode === 'try') tryBand3();
  BurrowScreens.messages.mount($('#a3Msg'), MSG3);
  renderHome3();
  /* [item 14] a setup left half way: back into it, with what was saved (src/setup3.js, the draft) */
  if (!E3.book && E3.mode === 'none' && await E3.rec('setup')) openSetup3();
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('#a3Check').hidden) closeCheck3(); if (!$('#a3Checks').hidden) closeChecks3(); });
  if (typeof startCloud3 === 'function') startCloud3();   // the cloud copy, when on: taken on opening (backup lane)
  if (typeof startChat3 === 'function') startChat3();   // the assistant panel (AI first)
  addEventListener('burrow3:other', redraw3);   // another tab saved (E3 joined it in): the one redraw; a receipt being typed keeps what was typed
})();
/* the one redraw after the book changed under the page (another tab saved, or the cloud copy was taken): Home, Receipts
   and Plan are drawn again; a receipt being typed keeps what was typed */
function redraw3() {
  renderHome3();
  if (typeof renderRc3 === 'function') { const k = rcKeep3(); renderRc3(); rcPut3(k); }
  if (typeof renderPlan3 === 'function') renderPlan3();
  if (typeof renderChat3 === 'function') renderChat3();
}
