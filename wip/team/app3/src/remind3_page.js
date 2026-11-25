/* ---------- Reminders (the old app's Reminder card, model.js and its screen, on the new engine) ----------
   Check-in reminders on chosen days (the day after pay lands and the middle of each pay period, both by default) and
   bill reminders a chosen number of days before each bill leaves the bank, put in the phone's own calendar: a calendar
   file (.ics, every dated reminder for the next year, made on this device and opened by the calendar app), or a Google
   or Outlook link. Nothing is sent anywhere by this page and nothing is saved: the choices start fresh each time. The
   events carry words only, never an amount. The days are REMIND3's (src/remind3.js), from the engine's calendars.
   This file chooses, writes and places; it never adds, takes away or rounds. */
const REM3 = { open: false, was: null, afterPay: true, mid: true, before: 2, time: '09:00', off: {} };
const REM3_BEFORE = [[0, 'On the day'], [1, '1 day before'], [2, '2 days before'], [3, '3 days before'], [5, '5 days before'], [7, 'A week before']];
const REM3_KIND = { afterPay: 'After pay lands', mid: 'Middle of the pay period' };

function rem3Data() {
  const day = E3.today();
  const checkins = REMIND3.checkins(E3.book, day, { afterPay: REM3.afterPay, mid: REM3.mid });
  const all = REMIND3.bills(E3.book, day, { before: REM3.before });
  const bills = all.filter(b => !REM3.off[b.id]);
  return { day, checkins, all, bills, events: REMIND3.events({ checkins, bills, time: REM3.time }) };
}
function openRem3() {
  if (REM3.open) return;
  if (!E3.book) { msg3('Set up first'); return; }
  REM3.open = true;
  const sheet = $('#a3Rem');
  sheet.innerHTML = `<div class="a3-sheet-in">
    <h1 id="a3RemT">Reminders</h1>
    <div class="a3-card" data-card="rem-check"><h2>Check your bank</h2>
      <p class="a3-next">A reminder to open the app and check your bank. It keeps safe to spend true</p>
      <label class="a3-check"><input type="checkbox" id="a3RemAfter"${REM3.afterPay ? ' checked' : ''}> The day after pay lands</label>
      <label class="a3-check"><input type="checkbox" id="a3RemMid"${REM3.mid ? ' checked' : ''}> The middle of each pay period</label>
      <p class="a3-sub" id="a3RemNext" data-rem="next"></p></div>
    <div class="a3-card" data-card="rem-bills"><h2>Bills</h2>
      <div class="a3-field"><label for="a3RemBefore">Remind me</label>
        <select class="a3-in a3-sel" id="a3RemBefore">${REM3_BEFORE.map(([v, t]) => `<option value="${v}"${v === REM3.before ? ' selected' : ''}>${esc3(t)}</option>`).join('')}</select></div>
      <div id="a3RemBills"></div></div>
    <div class="a3-card" data-card="rem-time"><div class="a3-field"><label for="a3RemTime">At</label>
      <input class="a3-in a3-text" type="time" id="a3RemTime" value="${esc3(REM3.time)}"></div></div>
    <div class="a3-card" data-card="rem-add"><h2>Add to your calendar</h2>
      <p class="a3-next" data-rem="what">Nothing is sent anywhere. The calendar file is made on this phone and your calendar app opens it. The reminders say what is due, never an amount.</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3RemIcs">Save the calendar file</button></div>
      <p class="a3-sub" id="a3RemCount"></p>
      <p class="a3-sub">Google Calendar repeats each one. Outlook adds the next one only. The calendar file has every one for the next year, moved for weekends and holidays.</p>
      <ul class="a3-rows" id="a3RemLinks"></ul></div>
    <div class="a3-actions"><button type="button" class="a3-btn" id="a3RemClose">Close</button></div>
  </div>`;
  REM3.was = [...document.querySelectorAll('[data-panel], .a3-tabs, #a3Check, #a3StmtBar, #a3Stmt, #a3Set, #a3Setup')].map(el => [el, el.hidden]);
  REM3.was.forEach(([el]) => { el.hidden = true; }); sheet.hidden = false;
  $('#a3RemAfter').addEventListener('change', e => { REM3.afterPay = e.target.checked; rem3Paint(); });
  $('#a3RemMid').addEventListener('change', e => { REM3.mid = e.target.checked; rem3Paint(); });
  $('#a3RemBefore').addEventListener('change', e => { REM3.before = Number(e.target.value); rem3Paint(); });
  $('#a3RemTime').addEventListener('change', e => { REM3.time = e.target.value || '09:00'; rem3Paint(); });
  $('#a3RemBills').addEventListener('change', e => { const c = e.target.closest('[data-rembill]'); if (!c) return; REM3.off[c.dataset.rembill] = !c.checked; rem3Paint(); });
  $('#a3RemIcs').addEventListener('click', rem3Save);
  $('#a3RemClose').addEventListener('click', closeRem3);
  rem3Paint(); scrollTo(0, 0); $('#a3RemAfter').focus();
}
function closeRem3() {
  if (!REM3.open) return;
  REM3.open = false;
  $('#a3Rem').hidden = true; $('#a3Rem').innerHTML = '';
  (REM3.was || []).forEach(([el, h]) => { el.hidden = h; }); REM3.was = null;
  const b = $('#a3RemGo'); if (b) b.focus();
}
function rem3Paint() {
  const d = rem3Data(), yr = d.day.slice(0, 4);
  const c = d.checkins;
  $('#a3RemNext').textContent = c.why ? c.why : c.items.length ? 'Next: ' + c.items.slice(0, 3).map(x => day3(x.day, yr)).join(', ') : 'Pick a day above for check-in reminders';
  $('#a3RemBills').innerHTML = d.all.length ? d.all.map(b => `<label class="a3-check" data-rembillrow="${esc3(b.id)}"><input type="checkbox" data-rembill="${esc3(b.id)}"${REM3.off[b.id] ? '' : ' checked'}> <span>${esc3(b.name)}<br><span class="a3-sub">next reminder ${esc3(day3(b.items[0].day, yr))}, due ${esc3(day3(b.items[0].lands, yr))}</span></span></label>`).join('')
    : '<p class="a3-sub">No bills with a day in your plan</p>';
  $('#a3RemCount').textContent = d.events.length ? `${d.events.length} reminders in the file` : 'Nothing picked yet';
  $('#a3RemIcs').disabled = !d.events.length;
  const series = [];
  for (const k of ['afterPay', 'mid']) { const e = d.events.find(x => x.kind === k); if (e) series.push({ key: k, name: 'Check your bank: ' + REM3_KIND[k].toLowerCase(), e }); }
  for (const b of d.bills) { const e = d.events.find(x => x.kind === 'bill' && x.title.indexOf(b.name + ' is due') === 0); if (e) series.push({ key: 'bill:' + b.id, name: b.name, e }); }
  $('#a3RemLinks').innerHTML = series.map(s => `<li data-remlink="${esc3(s.key)}"><span>${esc3(s.name)}</span><span class="a3-rem-go"><a href="${esc3(REMIND3.gcal(s.e))}" target="_blank" rel="noopener" data-rem="google">Google</a> <a href="${esc3(REMIND3.outlook(s.e))}" target="_blank" rel="noopener" data-rem="outlook">Outlook</a></span></li>`).join('');
}
function rem3Save() {
  const d = rem3Data();
  if (!d.events.length) return;
  const blob = new Blob([REMIND3.ics(d.events, { now: new Date().toISOString() })], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'burrow-reminders.ics'; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  msg3('Calendar file saved. Open it to add the reminders');
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#a3RemGo')) openRem3(); });
document.addEventListener('click', e => { if (REM3.open && e.target.closest && e.target.closest('#a3SetGo, #a3AskGo')) closeRem3(); }, true);   // another sheet over Reminders: Reminders closes first
document.addEventListener('keydown', e => { if (e.key === 'Escape' && REM3.open) closeRem3(); });
