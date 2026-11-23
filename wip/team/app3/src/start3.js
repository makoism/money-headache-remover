/* ---------- start ---------- */
(async () => {
  try { $('#a3Pix').innerHTML = pix('sprout', 2); } catch (e) { /* art is a nicety */ }
  await E3.load();
  if (E3.mode === 'try') {
    const t = $('#a3Try'); t.hidden = false;
    t.textContent = 'Made-up numbers shaped like a real month. Nothing you do here is saved' + (new URLSearchParams(location.search).get('today') ? '. Shown as on ' + day3(E3.today(), 'any') : '');
  }
  BurrowScreens.messages.mount($('#a3Msg'), MSG3);
  renderHome3();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#a3Check').hidden) closeCheck3(); });
  if (typeof startCloud3 === 'function') startCloud3();   // the cloud copy, when on: taken on opening (backup lane)
})();
