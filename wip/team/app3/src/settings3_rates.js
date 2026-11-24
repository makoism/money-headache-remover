/* ---------- Settings: Rates (stage 2 S5, STAGE2_PLAN 2.4, corrections 2, 3 and 2') ----------
   For each currency an account is held in other than the home one: type "1 USD is ___ JPY" from a day (today by
   default). Each one is a `rates` record through act3 (the one write door), the rate kept as the typed decimal text,
   never a number. Nothing is fetched from the internet. The rates typed are listed, latest first. Joined in
   settings3.js by the card and its wiring. Words are drafts for Mako's copy pass (FOR_MAKO.md). */
function rateCurs3() {
  const home = E3.home();
  return [...new Set(((E3.book && E3.book.accounts) || []).filter(a => a && !a.gone && a.cur && a.cur !== home).map(a => a.cur))].sort();
}
function ratesCard3() {
  if (!E3.book || E3.mode === 'try') return '';
  const curs = rateCurs3(), home = E3.home();
  if (!curs.length) return '';
  const yr = E3.today().slice(0, 4);
  const list = ((E3.book.rates || []).filter(x => x && !x.gone)).slice()
    .sort((x, y) => (x.from !== y.from ? (x.from < y.from ? 1 : -1) : String(x.at) < String(y.at) ? 1 : -1))
    .map(x => `<li data-set="rate">1 ${esc3(x.cur)} = ${esc3(x.rate)} ${esc3(x.to)} from ${esc3(day3(x.from, yr))}</li>`).join('');
  return `<div class="a3-card" data-card="rates"><h2>Rates</h2>
    <p class="a3-next">For the Total on Home, about how much your money in another currency is in ${esc3(home)}. Type the rate your bank or exchange gave you.</p>
    <div class="a3-field"><label for="a3RateCur">Currency</label><select class="a3-in a3-sel" id="a3RateCur">${curs.map(c => `<option value="${esc3(c)}">${esc3(c)}</option>`).join('')}</select></div>
    <div class="a3-field"><label for="a3Rate" id="a3RateL">1 ${esc3(curs[0])} is how many ${esc3(home)}</label><input class="a3-in a3-text" id="a3Rate" inputmode="decimal" autocomplete="off"></div>
    <div class="a3-field"><label for="a3RateFrom">From</label><input class="a3-in" id="a3RateFrom" type="date" value="${esc3(E3.today())}"></div>
    <p class="a3-warn a3-bad" id="a3RateErr" role="alert" hidden></p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3RateSave">Keep this rate</button></div>
    ${list ? `<ul class="a3-rows a3-sub">${list}</ul>` : ''}</div>`;
}
function wireRates3() {
  if (!$('#a3RateSave')) return;
  const home = E3.home(), err = $('#a3RateErr');
  $('#a3RateCur').addEventListener('change', () => { $('#a3RateL').textContent = `1 ${$('#a3RateCur').value} is how many ${home}`; });
  $('#a3RateSave').addEventListener('click', async () => {
    const text = $('#a3Rate').value.trim(), from = $('#a3RateFrom').value;
    const say = words => { err.textContent = words; err.hidden = false; };
    /* a positive decimal with a point, kept as typed: never turned into a number, so nothing is lost */
    if (!/^\d+(\.\d+)?$/.test(text) || !/[1-9]/.test(text)) return say('Type the rate as a number above 0, with a point for decimals, like 150.25');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return say('Pick the day this rate is from');
    const res = await ACT3.run('Rate', w => { w.add('rates', { from, cur: $('#a3RateCur').value, to: home, rate: text, src: 'typed' }); }, { undo: 'Rate kept' });
    if (!res.ok) return say(res.text || 'This could not be kept. Nothing changed');
    closeSet3(); openSet3();
  });
}
