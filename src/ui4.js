
/* ---------- receipts ---------- */
let rcHowSet = false, selByReceipt = false; /* the open month moved to follow a receipt logged for another month (Plan undoes that when opened) */
function prepareReceiptForm() {
  const d = $('#rcDate'); d.min = START + '-01'; d.max = END + '-31'; if (!d.value) d.value = todayStr();
}
function resetRcForm() {
  editRc = null; $('#rcAmt').value = ''; $('#rcNote').value = ''; syncOtherTitle('rcCat', 'rcNote'); $('#rcSave').textContent = 'Log receipt'; $('#rcCancel').hidden = true;
}
/* choosing "Other" asks for a title, so the receipt can say what it was; every other category keeps the optional note */
function syncOtherTitle(catId, noteId) {
  const cat = $('#' + catId), inp = $('#' + noteId); if (!cat || !inp) return;
  const other = cat.value === 'other', lab = inp.closest('.field') && inp.closest('.field').querySelector('label');
  if (lab) lab.innerHTML = other ? 'Title <span class="opt">(required)</span>' : 'Note';
  inp.placeholder = other ? 'Vet bill' : 'Where or what'; inp.required = other;
  inp.setAttribute('aria-required', String(other));
}
const needTitle = (c, n) => c === 'other' && !String(n || '').trim();
/* a receipt dated after today asks once; the same tap again within a few seconds logs it anyway */
let futureArm = null, futureT = 0;
function futureOk(d, msg, btn) {
  if (futureArm === d + btn.id) { futureArm = null; clearTimeout(futureT); return true; }
  futureArm = d + btn.id; clearTimeout(futureT); futureT = setTimeout(() => { futureArm = null; }, 6000);
  msg.textContent = `${dateLabel(d)} is in the future. Tap again to log it anyway, or change the date.`; sfx('off'); return false;
}
function renderReceipts() {
  const m = C.byYm[sel], rs = receiptStats(S, sel), playPlan = m.jar.play, playSpent = rs.byJar.play || 0;
  setIdle($('#rcMonth'), sel);
  $('#rcTitle').textContent = 'Receipts, ' + fullLabel(sel);
  let sum = rs.count ? `${fmt2(rs.total)} spent, ${rs.count} receipt${rs.count === 1 ? '' : 's'}.` : 'No receipts this month.';
  if (playPlan > 0 || playSpent > 0) sum += ` Play money: ${fmt2(playPlan)} planned, ${fmt2(playSpent)} spent, ` + (playSpent > playPlan ? `${fmt2(round2(playSpent - playPlan))} over.` : `${fmt2(round2(playPlan - playSpent))} left.`);
  $('#rcSum').textContent = sum;

  /* plan against spending, for every category that has a receipt (and the play money lines) */
  const rows = [], known = new Set();
  m.lines.forEach(x => { known.add(x.key); const sp = rs.byKey[x.key] || 0; if (sp > 0 || (x.jar === 'play' && x.on)) rows.push({ name: x.name, plan: x.on ? x.v : 0, spent: sp }); });
  Object.keys(rs.byKey).forEach(k => { if (!known.has(k)) { const r = rs.list.find(q => q.c === k); rows.push({ name: r ? catName(S, r) : 'Other', plan: null, spent: rs.byKey[k] }); } });
  $('#rcCats').innerHTML = rs.count ? `<table class="plain"><thead><tr><th>Category</th><th>Plan</th><th>Spent</th><th>Left</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.plan == null ? '' : fmt(r.plan)}</td><td>${fmt2(r.spent)}</td><td>${r.plan == null ? '' : r.spent > r.plan ? `<span class="over">over ${fmt2(round2(r.spent - r.plan))}</span>` : fmt2(round2(r.plan - r.spent))}</td></tr>`).join('')}</tbody></table><p class="cap tnote">Lines without receipts are not listed.</p>` : '';

  $('#rcList').innerHTML = rs.list.map(r => `<div class="rc${editRc === r.id ? ' on' : ''}" data-id="${esc(r.id)}"><div class="rc-main"><b>${fmt2(r.a)}</b><span class="rc-cat">${esc(r.c === 'other' && r.n ? 'Other: ' + r.n : catName(S, r))}</span></div>
    <div class="rc-sub"><span>${dateLabel(r.d)}</span>${r.n && r.c !== 'other' ? `<span class="rc-note">${esc(r.n)}</span>` : ''}${r.s ? `<span class="rc-acct">${esc(r.s)}</span>` : ''}</div>
    <div class="rc-act"><button type="button" class="link" data-rcedit="${esc(r.id)}">Edit</button><button type="button" class="link warn" data-rcdel="${esc(r.id)}" data-armkey="rc-${esc(r.id)}">Delete</button></div></div>`).join('');

  /* the reminder */
  const o = reminderOf();
  setIdle($('#rcFreq'), o.freq); setIdle($('#rcDay'), o.day); setIdle($('#rcDom'), o.dom); setIdle($('#rcTime'), o.time); remindShow($('#rcRemind'), o);
  { const box = $('#rcCal'); if (!box.firstChild) box.innerHTML = calBtnsInner(); calFill(box, o); }
  $('#rcEventText').value = calText(o);
  $('#rcWhen').textContent = reminderWhen(o);
}
function wireReceipts() {
  $('#rcForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = $('#rcDate').value, a = +$('#rcAmt').value, c = $('#rcCat').value, n = $('#rcNote').value, msg = $('#rcMsg');
    if (!validDate(d) || MONTHS.indexOf(d.slice(0, 7)) < 0) { msg.textContent = `Date must be ${monthLabel(START)} to ${monthLabel(END)}.`; $('#rcDate').focus(); return; }
    if (!(a > 0)) { msg.textContent = 'Enter an amount.'; $('#rcAmt').focus(); return; }
    /* a date after today is nearly always a slip of the finger: it is logged only on a second tap */
    if (d > todayStr() && !futureOk(d, msg, $('#rcSave'))) return;
    if (c === CAT_NEW) { msg.textContent = 'Add the new category, or pick one from the list.'; $('#rcNewName').focus(); return; }
    if (needTitle(c, n)) { msg.textContent = 'Add a short title, e.g. “Vet bill”.'; $('#rcNote').focus(); return; }
    S.ui.rcCat = c; const wasEdit = !!editRc;
    const firstRc = !(S.ui.done && S.ui.done.receipts);
    if (wasEdit) updateReceipt(S, editRc, d, a, c, n); else { addReceipt(S, d, a, c, n); markDone('receipts', true); }
    msg.textContent = (wasEdit ? 'Saved. ' : 'Logged. ') + fmt2(a) + ': ' + (c === 'other' ? 'Other' : (lineByKey(S, c) || { name: 'Other' }).name) + '.';
    resetRcForm(); persist();
    if (d.slice(0, 7) !== sel) { select(d.slice(0, 7)); selByReceipt = true; } else render(); /* the list follows the receipt, so it can be seen where it went; Plan goes back to this month on its own */
    $('#rcAmt').focus();
    if (!wasEdit) afterLog(firstRc);
  });
  $('#rcCat').addEventListener('change', () => { catPicked('rc'); syncOtherTitle('rcCat', 'rcNote'); $('#rcMsg').textContent = ''; });
  $('#rcCancel').addEventListener('click', () => { resetRcForm(); $('#rcMsg').textContent = ''; render(); });
  $('#rcMonth').addEventListener('change', e => select(e.target.value));
  $('#rcList').addEventListener('click', e => {
    const ed = e.target.closest('[data-rcedit]'), del = e.target.closest('[data-rcdel]');
    if (ed) {
      const r = S.receipts.find(x => x.id === ed.dataset.rcedit); if (!r) return;
      editRc = r.id; $('#rcDate').value = r.d; $('#rcAmt').value = r.a; $('#rcNote').value = r.n;
      const cat = $('#rcCat'); cat.value = Array.from(cat.options).some(o => o.value === r.c) ? r.c : 'other';
      syncOtherTitle('rcCat', 'rcNote'); $('#rcSave').textContent = 'Save changes'; $('#rcCancel').hidden = false; $('#rcMsg').textContent = '';
      render(); $('#rcForm').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#rcAmt').focus();
    } else if (del) confirmClick(del, 'Tap again to delete', () => { if (editRc === del.dataset.rcdel) resetRcForm(); removeReceipt(S, del.dataset.rcdel); persist(); render(); });
  });
  $('#rcFields').addEventListener('change', e => { if (remindChange(e.target)) renderReceipts(); });
}
