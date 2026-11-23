/* ---------- Check your bank (WIRING_PLAN 1.1 item 3, step 9) ----------
   Lists every expected item since the last check (res.checkIn.toConfirm), ticked, with its amount editable; asks what
   each bank shows today; Save writes the records through the check-in writer, and Home is drawn again. The gap is the
   engine's filler (A3), never written here. One input behaviour: a tap on an amount selects it, so typing replaces it. */
let check3 = null;
function openCheck3() {
  const day = E3.today(), yr = day.slice(0, 4), r = E3.view(day), list = r.checkIn.toConfirm;
  check3 = { day, list };
  const rows = list.map((o, i) => `<div class="a3-tick" data-item="${esc3(o.item)}">
      <input type="checkbox" id="a3t${i}" checked aria-describedby="a3d${i}">
      <label for="a3t${i}"><span>${esc3(E3.occName(o.item))}</span><span class="when" id="a3d${i}">${esc3(day3(o.lands, yr))}, ${esc3(E3.nameOf(o.account))}</span></label>
      <input class="a3-in" type="text" inputmode="decimal" autocomplete="off" aria-label="Amount for ${esc3(E3.occName(o.item))}" data-amt="${esc3(o.item)}" value="${SM.toInput(o.amount, E3.curOf(o.account))}">
    </div>`).join('');
  const figs = Object.keys(r.accounts).map(id => `<div class="a3-field"><label for="a3f-${esc3(id)}">What does ${esc3(E3.nameOf(id))} show today?</label>
      <input class="a3-in" type="text" inputmode="decimal" autocomplete="off" id="a3f-${esc3(id)}" data-bankfig="${esc3(id)}" placeholder="${esc3(SM.symbol(r.accounts[id].currency).trim())}">
      <p class="a3-sub">Last time ${money3(r.accounts[id].bank, r.accounts[id].currency)} on ${esc3(day3(r.accounts[id].asOf, yr))}</p></div>`).join('');
  const sheet = $('#a3Check');
  sheet.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3CheckT">Check your bank</h1>
    <section class="a3-card"><h2>${esc3(label3('checkInList'))} since ${esc3(day3(r.checkIn.since, yr))}</h2>${list.length ? '<p class="a3-sub">Untick anything that has not gone through yet. Change an amount if it was different</p>' + rows : '<p class="a3-sub">Nothing was due since then</p>'}</section>
    <section class="a3-card"><h2>Your bank today</h2>${figs}<p class="a3-err" id="a3CheckErr"></p></section>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CheckSave">Save</button><button type="button" class="a3-btn" id="a3CheckX">Back</button></div>
  </div>`;
  sheet.hidden = false; $('#a3Home').hidden = true; scrollTo(0, 0);
  /* one input behaviour (screens/inputs.js): the first tap selects, so typing replaces; read through money.js when left */
  sheet.querySelectorAll('[data-amt]').forEach(el => { const o = list.find(x => x.item === el.dataset.amt); BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(o.account) }); });
  sheet.querySelectorAll('[data-bankfig]').forEach(el => BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(el.dataset.bankfig), optional: true }));
  $('#a3CheckX').addEventListener('click', closeCheck3);
  $('#a3CheckSave').addEventListener('click', saveCheck3);
  const first = sheet.querySelector("[data-bankfig]"); if (first) first.focus();
}
function closeCheck3() { $('#a3Check').hidden = true; $('#a3Home').hidden = false; $('#a3Check').innerHTML = ''; check3 = null; const b = $('#a3CheckGo'); if (b) b.focus(); }
async function saveCheck3() {
  if (!check3) return;
  const sheet = $('#a3Check'), err = $('#a3CheckErr');
  const figures = {};
  for (const el of sheet.querySelectorAll("[data-bankfig]")) {
    const id = el.dataset.bankfig, v = typed3(el.value, E3.curOf(id));
    if (v === null) { err.textContent = `Type what ${E3.nameOf(id)} shows today, as an amount`; el.focus(); return; }
    figures[id] = v;
  }
  const ticked = [], amounts = {}, expected = {}, lands = {};
  for (const o of check3.list) {
    expected[o.item] = o.amount; lands[o.item] = o.lands;
    const row = [...sheet.querySelectorAll('.a3-tick')].find(x => x.dataset.item === o.item);
    if (!row || !row.querySelector('input[type=checkbox]').checked) continue;
    const v = typed3(row.querySelector('[data-amt]').value, E3.curOf(o.account));
    if (v === null) { err.textContent = `Type the amount for ${E3.occName(o.item)}`; row.querySelector('[data-amt]').focus(); return; }
    ticked.push(o.item); if (v !== o.amount) amounts[o.item] = v;
  }
  const out = CHECKIN3.checkIn(E3.book, { day: check3.day, told: E3.told(), newId: E3.newId, figures, ticked, unticked: [], amounts, expected, lands });
  const ok = await E3.write(out);
  if (!ok) { err.textContent = 'This could not be saved on this device. Nothing changed'; return; }
  closeCheck3(); renderHome3();
  msg3(E3.mode === 'try' ? 'Done. These are made-up numbers, so nothing is saved' : 'Saved');
}
