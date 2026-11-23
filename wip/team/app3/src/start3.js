/* ---------- start ---------- */
(async () => {
  try { $('#a3Pix').innerHTML = pix('sprout', 2); } catch (e) { /* art is a nicety */ }
  await E3.load();
  if (E3.mode === 'try') {
    const t = $('#a3Try'); t.hidden = false;
    t.textContent = 'Made-up numbers shaped like a real month. Nothing you do here is saved.' + (new URLSearchParams(location.search).get('today') ? ' Shown as on ' + day3(E3.today()) + ' ' + E3.today().slice(0, 4) + '.' : '');
  }
  renderHome3();
})();
