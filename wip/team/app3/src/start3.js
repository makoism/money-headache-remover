/* ---------- start ---------- */
/* the yellow band on a try book, with the day box (a plain file has no address to carry ?today=) */
function tryBand3() {
  const t = $('#a3Try'); t.hidden = false;
  t.innerHTML = `<span>Made-up numbers shaped like a real month. Nothing you do here is saved</span>
    <label class="a3-day">Show the page as on <input type="date" id="a3Day" value="${esc3(E3.today())}"></label>`;
  $('#a3Day').addEventListener('change', e => { E3.setToday(e.target.value); if (!$('#a3Check').hidden) closeCheck3(); renderHome3(); });
}
(async () => {
  try { $('#a3Pix').innerHTML = pix('sprout', 2); } catch (e) { /* art is a nicety */ }
  await E3.load();
  if (E3.mode === 'try') tryBand3();
  BurrowScreens.messages.mount($('#a3Msg'), MSG3);
  renderHome3();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#a3Check').hidden) closeCheck3(); });
})();
