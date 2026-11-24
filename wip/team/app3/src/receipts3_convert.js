/* ---------- Receipts: money moved into another currency (stage 2 S6, STAGE2_PLAN 2.4 step 2) ----------
   When "Moved" goes between two accounts in different currencies, the form also asks what arrived, in the To
   account's currency. The record is the move with `a2` (what arrived, SCHEMA_V3 6.2), and the engine reads the rate
   from it (ledger.rateOn, "from your own conversion"). Joined in receipts3.js by the field, the draft and the wiring.
   Words are drafts for Mako's copy pass (FOR_MAKO.md). */
function rcArrivedHtml3(e) {
  const v = e && e.a2 != null ? SM.toInput(e.a2, E3.curOf(e.acct2)) : '';
  return `<div class="a3-field" data-q="arrived" hidden><label for="rcAmt2" id="rcAmt2L">What arrived</label><input class="a3-in" data-amount type="text" inputmode="decimal" autocomplete="off" id="rcAmt2" value="${esc3(v)}"></div>`;
}
/* the field shows only when From and To are in different currencies, named by the To account's currency */
function rcArrivedShow3() {
  const f = document.querySelector('#rcForm [data-q=arrived]');
  if (!f || !$('#rcFrom') || !$('#rcTo')) return;
  const to = $('#rcTo').value, two = E3.curOf($('#rcFrom').value) !== E3.curOf(to);
  f.hidden = !two;
  $('#rcAmt2L').textContent = `What arrived in ${E3.nameOf(to)}, in ${E3.curOf(to)}`;
}
function rcArrivedWire3() {
  if (!$('#rcAmt2')) return;
  BurrowScreens.inputs.bind($('#rcAmt2'), { kind: 'amount', get code() { return E3.curOf($('#rcTo').value); }, optional: true });
  $('#rcTo').addEventListener('change', rcArrivedShow3);
  rcArrivedShow3();
}
/* { a2 } for a move between two currencies, {} for one currency, or { bad: words } */
function rcArrived3(from, to) {
  if (E3.curOf(from) === E3.curOf(to)) return {};
  const a2 = typed3($('#rcAmt2').value, E3.curOf(to));
  return a2 === null || a2 === 0 ? { bad: `Type what arrived in ${E3.nameOf(to)}, in ${E3.curOf(to)}` } : { a2 };
}
