/* ---------- Check your bank (WIRING_PLAN 1.1 item 3, step 9) ----------
   Lists every expected item since the last check (res.checkIn.toConfirm), ticked, with its amount editable; asks what
   each bank shows today and, optionally, what is on each card now (blank means not checked); Save writes the records through the check-in writer, and Home is drawn again. The gap is the
   engine's filler (A3), never written here. One input behaviour: a tap on an amount selects it, so typing replaces it. */
let check3 = null;
function openCheck3() {
  const day = E3.today(), yr = day.slice(0, 4), r = E3.view(day), list = r.checkIn.toConfirm;
  /* [BI1] an item left unticked at an earlier check-in did not land before that check: the sheet asks the day it landed,
     the day after that check by default (the engine's landedFrom gives it) */
  const from = {}; for (const o of list) { const f = BurrowEngine.checkin.landedFrom(E3.book, { day }, o.item); if (f && o.lands < f) from[o.item] = f > day ? day : f; }
  check3 = { day, list, from, sure: {} };
  const landedRow = (o, i) => (from[o.item] ? `<div class="a3-field a3-landed"><label for="a3l${i}">Landed on</label>
      <input class="a3-in" type="date" id="a3l${i}" data-landed="${esc3(o.item)}" value="${esc3(from[o.item])}" min="${esc3(from[o.item])}" max="${esc3(day)}"></div>` : '');
  const rows = list.map((o, i) => `<div class="a3-tick" data-item="${esc3(o.item)}">
      <input type="checkbox" id="a3t${i}" checked aria-describedby="a3d${i}">
      <label for="a3t${i}"><span>${esc3(E3.occName(o.item))}</span><span class="when" id="a3d${i}">${esc3(day3(o.lands, yr))}, ${esc3(E3.nameOf(o.account))}</span></label>
      <input class="a3-in" type="text" inputmode="decimal" autocomplete="off" aria-label="Amount for ${esc3(E3.occName(o.item))}" data-amt="${esc3(o.item)}" value="${SM.toInput(o.amount, E3.curOf(o.account))}">
      ${landedRow(o, i)}
    </div>`).join('');
  const figs = Object.keys(r.accounts).map(id => `<div class="a3-field"><label for="a3f-${esc3(id)}">What does ${esc3(E3.nameOf(id))} show today?</label>
      <input class="a3-in" type="text" inputmode="decimal" autocomplete="off" id="a3f-${esc3(id)}" data-bankfig="${esc3(id)}" placeholder="${esc3(SM.symbol(r.accounts[id].currency).trim())}">
      <p class="a3-sub" data-expected="${esc3(id)}"></p><p class="a3-warn" data-gap="${esc3(id)}" aria-live="polite" hidden></p>
      <div class="a3-gapask" data-gapask="${esc3(id)}" hidden><p class="a3-sub" data-gapq="${esc3(id)}"></p><button type="button" class="a3-btn" data-gapyes="${esc3(id)}">Yes, that was it</button></div>
      <div class="a3-gapopt" data-gapopt="${esc3(id)}" hidden><label><input type="checkbox" data-gapspend="${esc3(id)}"> Log it as a spend now, on</label>
        <select class="a3-in a3-sel" data-gapline="${esc3(id)}" aria-label="Which line the spend goes on">${rcOptions3(rcFors3(), 'line:free')}</select></div></div>`).join('');
  /* each card's figure, typed like the bank figure (DECISIONS.md "Mako's own money"): optional, blank means not checked;
     a typed figure is a check on the card, written by the engine's check-in writer */
  const cardFigs = Object.keys(r.cards || {}).map(id => `<div class="a3-field"><label for="a3c-${esc3(id)}">What is on ${esc3(E3.nameOf(id))} now?</label>
      <input class="a3-in" type="text" inputmode="decimal" autocomplete="off" id="a3c-${esc3(id)}" data-cardfig="${esc3(id)}" placeholder="${esc3(SM.symbol(E3.curOf(id)).trim())}">
      <p class="a3-sub">Leave it blank if you have not looked. <span data-expected="${esc3(id)}"></span></p><p class="a3-warn" data-gap="${esc3(id)}" aria-live="polite" hidden></p></div>`).join('');
  const sheet = $('#a3Check');
  sheet.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3CheckT">Check your bank</h1>
    <section class="a3-card"><h2>${esc3(label3('checkInList'))} since ${esc3(day3(r.checkIn.since, yr))}</h2>${list.length ? '<p class="a3-sub">Untick anything that has not gone through yet. Change an amount if it was different</p>' + rows : '<p class="a3-sub">Nothing was due since then</p>'}</section>
    <section class="a3-card"><h2>Your bank today</h2>${figs}${cardFigs ? '<h2>Your cards today</h2>' + cardFigs : ''}<p class="a3-err" id="a3CheckErr"></p></section>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CheckSave">Save</button><button type="button" class="a3-btn" id="a3CheckX">Back</button></div>
  </div>`;
  sheet.hidden = false; $('#a3Home').hidden = true; scrollTo(0, 0);
  /* one input behaviour (screens/inputs.js): the first tap selects, so typing replaces; read through money.js when left */
  sheet.querySelectorAll('[data-amt]').forEach(el => { const o = list.find(x => x.item === el.dataset.amt); BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(o.account) }); });
  sheet.querySelectorAll('[data-bankfig]').forEach(el => BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(el.dataset.bankfig), optional: true }));
  sheet.querySelectorAll('[data-cardfig]').forEach(el => BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(el.dataset.cardfig), optional: true }));
  sheet.querySelectorAll('input, select').forEach(el => { el.addEventListener('input', checkPreview3); el.addEventListener('change', checkPreview3); });
  sheet.querySelectorAll('[data-gapyes]').forEach(el => el.addEventListener('click', () => { check3.sure[el.dataset.gapyes] = true; checkPreview3(); }));
  checkPreview3();
  $('#a3CheckX').addEventListener('click', closeCheck3);
  $('#a3CheckSave').addEventListener('click', saveCheck3);
  const first = sheet.querySelector("[data-bankfig]"); if (first) first.focus();
}
function closeCheck3() { $('#a3Check').hidden = true; $('#a3Home').hidden = false; $('#a3Check').innerHTML = ''; check3 = null; const b = $('#a3CheckGo'); if (b) b.focus(); }
/* what the sheet holds, as the check-in writer's arguments. strict: a figure or amount that is not an amount is an error
   with the box it is in; otherwise such a figure is left out (the preview while typing) */
function readCheck3(strict) {
  const sheet = $('#a3Check'), figures = {}, bad = (text, el) => ({ bad: text, el });
  for (const el of sheet.querySelectorAll("[data-bankfig]")) {
    const id = el.dataset.bankfig, v = typed3(el.value, E3.curOf(id));
    if (v === null) { if (strict) return bad(`Type what ${E3.nameOf(id)} shows today, as an amount`, el); continue; }
    figures[id] = v;
  }
  for (const el of sheet.querySelectorAll("[data-cardfig]")) {
    const id = el.dataset.cardfig;
    if (!el.value.trim()) continue;   // blank: this card is not checked
    const v = typed3(el.value, E3.curOf(id));
    if (v === null) { if (strict) return bad(`Type what is on ${E3.nameOf(id)} now, as an amount, or leave it blank`, el); continue; }
    figures[id] = v;
  }
  const ticked = [], amounts = {}, expected = {}, lands = {}, landed = {};
  for (const o of check3.list) {
    expected[o.item] = o.amount; lands[o.item] = o.lands;
    const row = [...sheet.querySelectorAll('.a3-tick')].find(x => x.dataset.item === o.item);
    if (!row || !row.querySelector('input[type=checkbox]').checked) continue;
    const v = typed3(row.querySelector('[data-amt]').value, E3.curOf(o.account));
    if (v === null) { if (strict) return bad(`Type the amount for ${E3.occName(o.item)}`, row.querySelector('[data-amt]')); continue; }
    ticked.push(o.item); if (v !== o.amount) amounts[o.item] = v;
    const ld = row.querySelector('[data-landed]');
    if (ld) {
      if (!ld.value || ld.value < check3.from[o.item] || ld.value > check3.day) { if (strict) return bad(`${E3.occName(o.item)} was not in your last check, so it landed between ${day3(check3.from[o.item], check3.day.slice(0, 4))} and today`, ld); continue; }
      landed[o.item] = ld.value;
    }
  }
  return { figures, ticked, amounts, expected, lands, landed };
}
const checkOut3 = d => BurrowEngine.checkin.checkIn(E3.book, { day: check3.day, told: E3.told(), newId: E3.newId, figures: d.figures, ticked: d.ticked, unticked: [], amounts: d.amounts, expected: d.expected, lands: d.lands, landed: d.landed });
const checkView3 = out => BurrowEngine.lookahead.lookahead(BurrowEngine.checkin.apply(E3.book, out), check3.day);
/* [NS-FIX 2] the gap a typed figure leaves, in words, from the engine's filler for this check (never worked out here):
   a bank that shows less than the app had lost money nobody logged, and that counts as spending */
function gapWords3(r, id, day) {
  const a = r.accounts[id], k = r.cards[id];
  if (a) {
    const f = (a.fillers || []).slice(-1)[0];
    if (!f || f.to !== day) return null;
    /* [BK4] with close days not sure, a card payment ticked in this check is asked about first: the gap may be the card */
    const ask = check3.sure[id] ? [] : askCards3(id);
    if (f.amount > 0) return { loss: f.amount, ask, text: `${money3(f.amount, a.currency)} more left your bank than you logged${ask.length ? '' : '. It counts as spending'}` };
    /* [BK4] a gain goes to the gain question (the engine's gain_to_ask), never to spending */
    const asks = (r.warnings || []).some(w => w.code === 'gain_to_ask' && w.account === id && w.day === day);
    if (f.gain > 0) return { text: `${money3(f.gain, a.currency)} more came into your bank than you logged${asks ? '. You will be asked if that figure is right' : ''}` };
    return null;
  }
  const f = k && (k.fillers || []).slice(-1)[0];
  if (!f || f.day !== day) return null;
  if (f.more > 0) return { text: `${money3(f.more, E3.curOf(id))} more on ${E3.nameOf(id)} than you logged. It counts as spending` };
  if (f.less > 0) return { text: `${money3(f.less, E3.curOf(id))} less on ${E3.nameOf(id)} than the app had. It comes off your spending` };
  return null;
}
/* [BK4] the card payments ticked in this check from that bank whose close day is not sure ("all owed"): "Was Card A's
   payment ¥54,000?" is asked before the gap is called spending */
function askCards3(id) {
  const rows = [...$('#a3Check').querySelectorAll('.a3-tick')], rowOf = o => rows.find(x => x.dataset.item === o.item);
  return check3.list.filter(o => o.account === id && o.statement === 'all owed' && rowOf(o) && rowOf(o).querySelector('input[type=checkbox]').checked)
    .map(o => { const v = typed3(rowOf(o).querySelector('[data-amt]').value, E3.curOf(id)); return `Was ${E3.occName(o.item)}'s payment ${money3(v === null ? o.amount : v, E3.curOf(id))}?`; });
}
/* while typing: what the app expects each figure to be now, with what is ticked (the engine on the book the check-in
   would make with no figure), and the gap each typed figure leaves (the engine on the book with the figures) */
function checkPreview3() {
  if (!check3) return;
  const sheet = $('#a3Check'), d = readCheck3(false), yr = check3.day.slice(0, 4);
  let r0, r1;
  try { r0 = checkView3(checkOut3(Object.assign({}, d, { figures: {} }))); r1 = checkView3(checkOut3(d)); } catch (e) { return; }
  for (const el of sheet.querySelectorAll('[data-expected]')) {
    const id = el.dataset.expected, a = r0.accounts[id];
    if (a) el.textContent = `Expected now ${money3(a.bank, a.currency)}, last checked ${money3(a.checked, a.currency)} on ${day3(a.asOf, yr)}`;
    else if (r0.cards[id]) { const c = E3.lastCheckOf(id, check3.day); el.textContent = `Expected now ${money3(r0.cards[id].owedNow, E3.curOf(id))}${c ? `, last checked ${money3(c.a, E3.curOf(id))} on ${day3(c.date, yr)}` : ''}`; }
  }
  for (const el of sheet.querySelectorAll('[data-gap]')) {
    const id = el.dataset.gap, g = id in d.figures ? gapWords3(r1, id, check3.day) : null;
    el.textContent = g ? g.text : ''; el.hidden = !g;
    const opt = sheet.querySelector(`[data-gapopt="${id}"]`), ask = sheet.querySelector(`[data-gapask="${id}"]`);
    const asking = !!(g && g.loss && g.ask && g.ask.length);
    if (ask) { ask.hidden = !asking; sheet.querySelector(`[data-gapq="${id}"]`).textContent = asking ? g.ask.join(' ') : ''; }
    if (opt) opt.hidden = !(g && g.loss) || asking;
  }
}
async function saveCheck3() {
  if (!check3) return;
  const sheet = $('#a3Check'), err = $('#a3CheckErr');
  const d = readCheck3(true);
  if (d.bad) { err.textContent = d.bad; d.el.focus(); return; }
  const out = checkOut3(d), day = check3.day;
  /* a gap the person logs as a spend now: one spend on the line picked, for the engine's gap, dated the check's day and
     marked inside its figure (dayInside, BK4), written with the check-in (the same moment and group), so the gap is gone
     and the spend is never counted twice */
  const before = checkView3(out), logged = {};
  for (const id of Object.keys(d.figures)) {
    const box = sheet.querySelector(`[data-gapspend="${id}"]`), g = box && box.checked ? gapWords3(before, id, day) : null;
    if (!g || !g.loss) continue;
    const f = sheet.querySelector(`[data-gapline="${id}"]`).value, e = { id: E3.newId(), k: 'spend', date: day, a: g.loss, acct: id, note: 'Found at a bank check', src: { type: 'typed' }, dayInside: true, told: out.checkins[0].told, grp: out.checkins[0].id };
    if (f.startsWith('place:')) e.place = f.slice(6); else e.line = f.slice(5);
    out.events.push(e); logged[id] = rcForName3(e);
  }
  const words = Object.keys(d.figures).map(id => { const g = gapWords3(before, id, day); return !g ? '' : logged[id] ? `${g.text.split('. ')[0]}, now logged as a spend on ${logged[id]}` : g.text; }).filter(Boolean);
  /* act3 is the only door: the check-in is one step, with its Undo bar */
  const said = [E3.mode === 'try' ? 'Bank checked. Made-up numbers, so nothing is saved' : 'Bank checked'].concat(words).join('. ');
  const r = await ACT3.addRecords('Check your bank', out, { undo: said });
  if (!r.ok) { err.textContent = r.text; return; }
  closeCheck3(); renderHome3();
}
