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
  /* [monthrule2 1b, coordinator's ruling way c; M31, M38, M44] a pay ticked after its due day: when did it come in? The due
     day is picked, so one tap goes on as before; Today, or another day in a date box. Asked once per pay, on this sheet */
  const isPay = it => (E3.book.schedules || []).some(s => s && !s.gone && s.kind === 'income' && s.id === BurrowEngine.ids.scheduleOf(it));
  const came = {}; for (const o of list) if (!from[o.item] && o.lands < day && isPay(o.item)) came[o.item] = { pick: 'due', min: BurrowEngine.checkin.landedFrom(E3.book, { day }, o.item) || '' };
  check3 = { day, list, from, came, sure: {}, ver: ACT3.ver() };   // [STALE_SHEET_PLAN] the book as this sheet saw it
  const wd = d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T00:00:00Z').getUTCDay()] + ' ' + day3(d, yr);
  const cameRow = (o, i) => (came[o.item] ? `<fieldset class="a3-field a3-came" data-camein="${esc3(o.item)}"><legend class="a3-q">When did it come in?</legend>
      <div class="a3-segs"><button type="button" class="a3-seg a3-seg-s" data-came="due" aria-pressed="true">${esc3(wd(o.lands))} (the due day)</button><button type="button" class="a3-seg a3-seg-s" data-came="today" aria-pressed="false">Today, ${esc3(wd(day))}</button><button type="button" class="a3-seg a3-seg-s" data-came="other" aria-pressed="false">Another day</button></div>
      <input class="a3-in" type="date" id="a3cm${i}" aria-label="The day ${esc3(E3.occName(o.item))} came in" data-cameday="${esc3(o.item)}" value="${esc3(o.lands)}"${came[o.item].min ? ` min="${esc3(came[o.item].min)}"` : ''} max="${esc3(day)}" hidden></fieldset>` : '');
  const landedRow = (o, i) => (from[o.item] ? `<div class="a3-field a3-landed"><label for="a3l${i}">Landed on</label>
      <input class="a3-in" type="date" id="a3l${i}" data-landed="${esc3(o.item)}" value="${esc3(from[o.item])}" min="${esc3(from[o.item])}" max="${esc3(day)}"></div>` : '');
  const rows = list.map((o, i) => `<div class="a3-tick" data-item="${esc3(o.item)}">
      <input type="checkbox" id="a3t${i}" checked aria-describedby="a3d${i}">
      <label for="a3t${i}"><span>${esc3(E3.occName(o.item))}</span><span class="when" id="a3d${i}">${esc3(day3(o.lands, yr))}, ${esc3(E3.nameOf(o.account))}</span></label>
      <input class="a3-in" data-amount type="text" inputmode="decimal" autocomplete="off" aria-label="Amount for ${esc3(E3.occName(o.item))}" data-amt="${esc3(o.item)}" value="${SM.toInput(o.amount, E3.curOf(o.account))}">
      ${landedRow(o, i)}
      ${cameRow(o, i)}
    </div>`).join('');
  const figs = Object.keys(r.accounts).map(id => `<div class="a3-field"><label for="a3f-${esc3(id)}">What does ${esc3(E3.nameOf(id))} show today?</label>
      <input class="a3-in" data-amount type="text" inputmode="decimal" autocomplete="off" id="a3f-${esc3(id)}" data-bankfig="${esc3(id)}" placeholder="${esc3(SM.symbol(r.accounts[id].currency).trim())}">
      <p class="a3-sub">Leave it blank if you have not looked. <span data-expected="${esc3(id)}"></span></p><p class="a3-warn" data-gap="${esc3(id)}" aria-live="polite" hidden></p>
      <div class="a3-gapask" data-gapask="${esc3(id)}" hidden><p class="a3-sub" data-gapq="${esc3(id)}"></p><button type="button" class="a3-btn" data-gapyes="${esc3(id)}">Yes, that was it</button></div>
      <div class="a3-gapopt" data-gapopt="${esc3(id)}" hidden><label><input type="checkbox" data-gapspend="${esc3(id)}"> Log it as a spend now, on</label>
        <select class="a3-in a3-sel" data-gapline="${esc3(id)}" aria-label="Which line the spend goes on">${rcOptions3(rcFors3(), 'line:free')}</select></div></div>`).join('');
  /* each card's figure, typed like the bank figure (DECISIONS.md "Mako's own money"): optional, blank means not checked;
     a typed figure is a check on the card, written by the engine's check-in writer */
  const cardFigs = Object.keys(r.cards || {}).map(id => `<div class="a3-field"><label for="a3c-${esc3(id)}">What is on ${esc3(E3.nameOf(id))} now?</label>
      <input class="a3-in" data-amount type="text" inputmode="decimal" autocomplete="off" id="a3c-${esc3(id)}" data-cardfig="${esc3(id)}" placeholder="${esc3(SM.symbol(E3.curOf(id)).trim())}">
      <p class="a3-sub">Leave it blank if you have not looked. <span data-expected="${esc3(id)}"></span></p><p class="a3-warn" data-gap="${esc3(id)}" aria-live="polite" hidden></p>
      <div class="a3-gapask" data-payask="${esc3(id)}" hidden><p class="a3-sub" data-payq="${esc3(id)}"></p><button type="button" class="a3-btn" data-payyes="${esc3(id)}">Yes, tick it</button></div></div>`).join('');
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
  sheet.querySelectorAll('[data-bankfig]').forEach(el => BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(el.dataset.bankfig), optional: true, allowMinus: true }));   // [M47] a bank can be below zero
  sheet.querySelectorAll('[data-cardfig]').forEach(el => BurrowScreens.inputs.bind(el, { kind: 'amount', code: E3.curOf(el.dataset.cardfig), optional: true }));
  sheet.querySelectorAll('input, select').forEach(el => { el.addEventListener('input', checkPreview3); el.addEventListener('change', checkPreview3); });
  sheet.querySelectorAll('[data-gapyes]').forEach(el => el.addEventListener('click', () => { check3.sure[el.dataset.gapyes] = true; checkPreview3(); }));
  /* [card payment question] Yes ticks that card's payment on the list above; what is typed stays */
  sheet.querySelectorAll('[data-payyes]').forEach(el => el.addEventListener('click', () => {
    const o = (check3.payAsk || {})[el.dataset.payyes]; if (!o) return;
    const row = [...sheet.querySelectorAll('.a3-tick')].find(x => x.dataset.item === o.item), box = row && row.querySelector('input[type=checkbox]');
    if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); }
    checkPreview3();
  }));
  sheet.querySelectorAll('[data-came]').forEach(el => el.addEventListener('click', () => {
    const box = el.closest('[data-camein]'), c = check3.came[box.dataset.camein];
    c.pick = el.dataset.came;
    box.querySelectorAll('[data-came]').forEach(x => x.setAttribute('aria-pressed', String(x === el)));
    const d = box.querySelector('[data-cameday]'); d.hidden = c.pick !== 'other'; if (!d.hidden) d.focus();
    checkPreview3();
  }));
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
    const id = el.dataset.bankfig;
    if (!el.value.trim()) continue;   // [qc-controls run 1 blocker 3] blank: not looked at today, nothing written for it, as for a card
    const v = typedBank3(el.value, E3.curOf(id));
    if (v === null) { if (strict) return bad(typedSlip3(el.value, E3.curOf(id)) || `Type what ${E3.nameOf(id)} shows today, as an amount, or leave it blank`, el); continue; }
    figures[id] = v;
  }
  for (const el of sheet.querySelectorAll("[data-cardfig]")) {
    const id = el.dataset.cardfig;
    if (!el.value.trim()) continue;   // blank: this card is not checked
    const v = typed3(el.value, E3.curOf(id));
    if (v === null) { if (strict) return bad(typedSlip3(el.value, E3.curOf(id)) || `Type what is on ${E3.nameOf(id)} now, as an amount, or leave it blank`, el); continue; }
    figures[id] = v;
  }
  const ticked = [], amounts = {}, expected = {}, lands = {}, landed = {};
  for (const o of check3.list) {
    expected[o.item] = o.amount; lands[o.item] = o.lands;
    const row = [...sheet.querySelectorAll('.a3-tick')].find(x => x.dataset.item === o.item);
    if (!row || !row.querySelector('input[type=checkbox]').checked) continue;
    const v = typed3(row.querySelector('[data-amt]').value, E3.curOf(o.account));
    if (v === null) { if (strict) return bad(typedSlip3(row.querySelector('[data-amt]').value, E3.curOf(o.account)) || `Type the amount for ${E3.occName(o.item)}`, row.querySelector('[data-amt]')); continue; }
    ticked.push(o.item); if (v !== o.amount) amounts[o.item] = v;
    const ld = row.querySelector('[data-landed]');
    if (ld) {
      if (!ld.value || ld.value < check3.from[o.item] || ld.value > check3.day) { if (strict) return bad(`${E3.occName(o.item)} was not in your last check, so it landed between ${day3(check3.from[o.item], check3.day.slice(0, 4))} and today`, ld); continue; }
      landed[o.item] = ld.value;
    }
    const c = (check3.came || {})[o.item];
    if (c && c.pick === 'today') landed[o.item] = check3.day;
    if (c && c.pick === 'other') {
      const cd = row.querySelector('[data-cameday]');
      if (!cd.value || cd.value > check3.day || (c.min && cd.value < c.min)) { if (strict) return bad(`Pick the day ${E3.occName(o.item)} came in, ${c.min ? `between ${day3(c.min, check3.day.slice(0, 4))} and today` : 'today or before'}`, cd); continue; }
      landed[o.item] = cd.value;
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
/* [card payment question; coordinator 24 Nov, M11, M27] a card's payment left unticked while the card shows far less than
   the app had: most likely the payment did go out. Asked when ticking it would leave a smaller gap on that card than
   the card showing "less than the app had" does now (both gaps are the engine's, for the book each choice would make;
   nothing is worked out here). Gives { cardId: the list item to tick } for the cards to ask about. */
function payAsks3(d, r1) {
  const out = {};
  for (const id of Object.keys(r1.cards || {})) {
    if (!(id in d.figures)) continue;
    const f = (r1.cards[id].fillers || []).slice(-1)[0];
    if (!f || f.day !== check3.day || !(f.less > 0)) continue;
    const o = check3.list.find(x => !d.ticked.includes(x.item) && (BurrowEngine.ids.occurrence(x.item) || {}).schedule === id);
    if (!o) continue;
    let r2; try { r2 = checkView3(checkOut3(Object.assign({}, d, { ticked: d.ticked.concat([o.item]) }))); } catch (e) { continue; }
    const g = ((r2.cards[id] || {}).fillers || []).slice(-1)[0];
    if (g && g.day === check3.day && g.less < f.less && g.more < f.less) out[id] = o;
  }
  return out;
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
    if (a) el.textContent = `Expected now ${money3(a.bank, a.currency)}, ` + (BurrowScreens.status.notChecked(E3.book, id, check3.day) ? 'not checked yet' : `last checked ${money3(a.checked, a.currency)} on ${day3(a.asOf, yr)}`);   // [qc-novice C7]
    /* [BM4, BL5] a card in credit is written the way Home writes it, "in credit ¥3,000", never with a minus */
    else if (r0.cards[id]) { const c = E3.lastCheckOf(id, check3.day), k = r0.cards[id]; el.textContent = `Expected now ${k.credit ? label3('inCredit').toLowerCase() + ' ' + money3(k.credit, E3.curOf(id)) : money3(k.owedNow, E3.curOf(id))}${c ? `, last checked ${money3(c.a, E3.curOf(id))} on ${day3(c.date, yr)}` : ''}`; }
  }
  check3.payAsk = payAsks3(d, r1);
  for (const el of sheet.querySelectorAll('[data-payask]')) {
    const id = el.dataset.payask, o = check3.payAsk[id];
    el.hidden = !o;
    sheet.querySelector(`[data-payq="${id}"]`).textContent = o ? `Did ${E3.occName(o.item)}'s payment of ${money3(o.amount, E3.curOf(o.account))} go out on ${day3(o.lands, yr)}?` : '';
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
  /* every box blank and nothing ticked: nothing to save, said so; Cancel is still there */
  if (!Object.keys(d.figures).length && !d.ticked.length) { err.textContent = 'Nothing to save yet. Type what a bank or card shows today, or tick what came in'; const f = sheet.querySelector('[data-bankfig]'); if (f) f.focus(); return; }
  /* [card payment question] asked first, once: Save again saves it as typed, so nobody is trapped */
  const asks = Object.keys(check3.payAsk || {}), askKey = asks.join(' ');
  if (asks.length && check3.payAsked !== askKey) {
    check3.payAsked = askKey;
    const names = asks.map(id => E3.nameOf(id));
    err.textContent = `${names.join(' and ')} ${names.length > 1 ? 'show' : 'shows'} far less than the app had, and ${names.length > 1 ? 'their payments are' : 'its payment is'} not ticked. Answer the question under ${names.length > 1 ? 'each' : 'it'}, or press Save again to save it as it is`;
    const q = sheet.querySelector('[data-payask]:not([hidden]) button'); if (q) q.focus();
    return;
  }
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
  /* [LISTFIX B1] saved with the card question still open, the gap is counted as spending all the same: the words say so */
  const words = Object.keys(d.figures).map(id => { const g = gapWords3(before, id, day); return !g ? '' : logged[id] ? `${g.text.split('. ')[0]}, now logged as a spend on ${logged[id]}` : g.loss && g.ask.length ? `${g.text}. It counts as spending` : g.text; }).filter(Boolean);
  /* act3 is the only door: the check-in is one step, with its Undo bar */
  const said = [E3.mode === 'try' ? 'Bank checked. Made-up numbers, so nothing is saved' : 'Bank checked'].concat(words).join('. ');
  /* the gap found is worked out from the whole book: if anything changed somewhere else since the sheet opened, nothing is
     saved and the sheet is drawn again from the book as it is now [M6, M61] */
  const r = await ACT3.addRecords('Check your bank', out, { undo: said, ver: check3.ver });
  if (!r.ok && r.why === 'other') { if (typeof BACK3 === 'object') BACK3.forget(); closeCheck3(); openCheck3(); $('#a3CheckErr').textContent = r.text; return; }
  if (!r.ok) { err.textContent = r.text; return; }
  closeCheck3(); renderHome3();
}
