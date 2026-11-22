
/* ---------- receipts ---------- */
let rcHowSet = false, selByReceipt = false; /* the open month moved to follow a receipt logged for another month (Plan undoes that when opened) */
function prepareReceiptForm() {
  const d = $('#rcDate'); d.min = START + '-01'; d.max = END + '-31'; if (!d.value) d.value = todayStr();
}
function resetRcForm() {
  editRc = null; $('#rcAmt').value = ''; delete $('#rcAmt').dataset.neg; $('#rcNote').value = ''; syncOtherTitle('rcCat', 'rcNote'); $('#rcSave').textContent = 'Log spend'; $('#rcCancel').hidden = true;
  const ch = $('#rcChanging'); if (ch) { ch.hidden = true; ch.textContent = ''; }
}
/* the Edit form says which receipt it changes (QC round 8 novice confusing 1): amount, category, date; the year only when it is not this year */
function rcChangingText(r) {
  const yr = r.d.slice(0, 4) === todayStr().slice(0, 4);
  return `Changing: ${fmt2(r.a)}, ${catName(S, r)}, ${yr ? (+r.d.slice(8, 10)) + ' ' + MONTH_NAMES[+r.d.slice(5, 7) - 1] : dateLabel(r.d)}.`;
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
/* a receipt bigger than the whole month's pay is nearly always a typo (400000 for 40000): it is logged only on a second tap (38.31 number gate round 3) */
let bigArm = null, bigT = 0;
function bigOk(d, a, msg, btn) {
  const pay = ((C && C.byYm[d.slice(0, 7)]) || {}).inflow || 0;
  if (!(pay > 0) || !(a > pay)) return true;
  const k = d + '|' + a + '|' + btn.id; if (bigArm === k) { bigArm = null; clearTimeout(bigT); return true; }
  bigArm = k; clearTimeout(bigT); bigT = setTimeout(() => { bigArm = null; }, 6000);
  msg.textContent = `${fmt2(a)} is more than all of your pay in ${monthLabel(d.slice(0, 7))} (${fmt2(pay)}). Tap again to log it anyway, or check the amount.`; sfx('off'); return false;
}
/* the same receipt twice in a row is nearly always a double tap: it is logged only on a second tap */
function dupOk(d, a, c, n, msg, btn) {
  const key = 'dup' + d + a + c + n + btn.id;
  if (futureArm === key) { futureArm = null; clearTimeout(futureT); return true; }
  futureArm = key; clearTimeout(futureT); futureT = setTimeout(() => { futureArm = null; }, 6000);
  msg.textContent = 'You already logged this receipt (' + fmt2(wholeAmt(S, a)) + ', ' + dateLabel(d) + '). Tap again to log it twice, or change it.'; sfx('off'); return false;
}
const isDupRc = (d, a, c, n) => (S.receipts || []).some(r => r.d === d && r.a === wholeAmt(S, a) && r.c === (lineByKey(S, c) ? c : 'other') && (r.n || '') === (n || '').trim().slice(0, 80));
/* the part of an overspend the burrow's own pile covers, and the part that comes out of the bank */
const overCell = (r, m, f = fmt2) => {
  const O = overParts(m, r.jar, r.spent, r.plan), pile = O.pile, bank = O.bank;   /* the split is worked out in model.js */
  if (!O.soft) return `<span class="over">${f(O.over)} over</span>`;   /* "¥5,000 over" on every screen (38.31 number gate round 8, finding 2) */
  return (pile > 0 ? `<span class="pile">from the pile ${f(O.pile)}</span>` : '') + (pile > 0 && bank > 0 ? ', ' : '') + (bank > 0 ? `<span class="over">${f(O.bank)} over</span>` : '');
};
/* one row, one way of writing its amounts: all with cents when any has cents (38.31 number gate round 8, finding 4) */
const rowFmt = (r, m) => { const O = r.plan != null && r.spent > r.plan ? overParts(m, r.jar, r.spent, r.plan) : {}; return fmtSet(r.plan, r.spent, r.safe, r.plan != null ? leftOfPlan(r.plan, r.spent) : 0, O.over, O.pile, O.bank);
};
const pileOk = jar => { const b = HV && HV.map && HV.map.burrows.find(x => x.id === jar); return !!b && !b.over; };
function renderReceipts() {
  const m = C.byYm[sel], rs = receiptStats(S, sel), playPlan = m.jar.play, playSpent = rs.byJar.play || 0;
  setIdle($('#rcMonth'), sel);
  $('#rcTitle').textContent = 'Receipts, ' + monthLabel(sel);
  let sum = rs.count ? `${fmt2(rs.total)} spent, ${rs.count} receipt${rs.count === 1 ? '' : 's'}.` : sel === nowYm() ? 'No receipts this month.' : `No receipts in ${monthLabel(sel)}${sel > nowYm() ? ' yet' : ''}.`;   /* a picked month is named (QC round 4 north-star 1) */
  if (playPlan > 0 || playSpent > 0) {
    /* the third amount of the sentence, and the goal part, so every amount in it is written the same way (finding 4) */
    const third = playSpent > playPlan ? planCells(S, C, sel).playOver : m.counted > 0 ? m.counted : m.pendLeft > 0 ? m.pendLeft : m.pastLeft != null ? m.pastLeft : playSafeLeft(S, m, playSpent), f = fmtSet(rs.total, playPlan, playSpent, third, m.topup ? m.topup.used : 0, m.credit);
    sum = (rs.count ? `${f(rs.total)} spent, ${rs.count} receipt${rs.count === 1 ? '' : 's'}.` : sum) + ` Free to spend: ${f(playPlan)} planned, ${f(playSpent)} spent, ` + (playSpent > playPlan ? `${f(third)} over.` : (m.counted > 0 ? `${f(third)} not spent: ${m.topup && m.topup.used > 0 ? f(m.topup.used) + ' went to a goal' + (m.counted - m.topup.used > 0.004 ? ', ' + f(m.credit) + ' came back to the bank' : '') : 'came back to the bank'}.` : m.pendLeft > 0 ? `${f(third)} not logged as spent yet, and Home asks where it goes.` : m.pastLeft != null ? `${f(third)} not logged as spent yet.`   /* an ended month is never safe to spend (38.31 number gate round 8, finding 1) */ : `${f(third)}${playNotSafe(S, C, sel, ymd(new Date())) ? ' left, not safe to spend yet' : ' safe to spend'}.`));
  }
  $('#rcSum').textContent = sum;

  /* plan against spending, for every category that has a receipt (and the play money lines) */
  const rows = [], known = new Set();
  m.lines.forEach(x => { known.add(x.key); const sp = rs.byKey[x.key] || 0; if (sp > 0 || (x.jar === 'play' && x.on)) rows.push({ name: shownLine(x.name), jar: x.jar, plan: x.on ? x.v : 0, spent: sp, safe: x.key === 'envelope' && x.on ? playSafeLeft(S, m, rs.byJar.play || 0) : null }); });
  /* Other is planned by the month's one-time costs (money already set aside, model.js applyOverspend): only spending past them is over */
  Object.keys(rs.byKey).forEach(k => { if (!known.has(k)) { const r = rs.list.find(q => q.c === k), it = k === 'other' && m.itemsTotal > 0 ? m.itemsTotal : null; rows.push({ name: r ? catName(S, r) : 'Other', jar: 'other', plan: it, spent: rs.byKey[k] }); } });
  $('#rcCats').innerHTML = rs.count ? `<table class="plain"><thead><tr><th>Category</th><th>Plan</th><th>Spent</th><th>Left to spend</th></tr></thead><tbody>${(() => { const tf = rows.some(r => rowFmt(r, m) === fmtCents) ? fmtCents : fmt2; return rows.map(r => { const f = tf;   /* one table, one way of writing amounts (QC round 11 numbers 3) */ return `<tr><td>${esc(r.name)}</td><td>${f(r.plan == null ? 0 : r.plan)}</td><td>${f(r.spent)}</td><td>${r.plan == null ? `<span class="over">${f(r.spent)} over</span>` : r.spent > r.plan ? overCell(r, m, f) : (r.safe != null ? f(r.safe) : r.jar === 'ffa' ? 'saved' : f(leftOfPlan(r.plan, r.spent)))}</td></tr>`; }).join(''); })()}</tbody></table><p class="cap tnote">Lines with no receipts aren't listed, except Free to spend.</p>` : '';

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
    if (!validDate(d) || MONTHS.indexOf(d.slice(0, 7)) < 0) { msg.textContent = `Pick a date from ${monthLabel(START)} to ${monthLabel(END)}`; $('#rcDate').focus(); return; }
    { const bad = amtBad($('#rcAmt')); if (bad) { msg.textContent = bad; $('#rcAmt').focus(); return; } }   /* "1o0" is refused and stays in the box (QC round 10 numbers gate should-fix 1) */
    if ($('#rcAmt').dataset.neg) { msg.textContent = 'Type the amount without a minus sign, because a receipt is money you spent. For a refund, lower or delete the receipt it pays back.'; $('#rcAmt').value = ''; delete $('#rcAmt').dataset.neg; $('#rcAmt').focus(); return; }
    if (!(wholeAmt(S, a) > 0)) { msg.textContent = 'Type an amount'; $('#rcAmt').focus(); return; }
    if (wholeAmt(S, a) > 1e9) { msg.textContent = 'That amount is too big. The most is 1,000,000,000.'; $('#rcAmt').focus(); return; }
    /* a date after today is nearly always a slip of the finger: it is logged only on a second tap */
    if (d > todayStr() && !futureOk(d, msg, $('#rcSave'))) return;
    if (!editRc && isDupRc(d, a, c, n) && !dupOk(d, a, c, n, msg, $('#rcSave'))) return;
    if (!bigOk(d, wholeAmt(S, a), msg, $('#rcSave'))) { $('#rcAmt').focus(); return; }
    if (c === CAT_NEW) { msg.textContent = 'Add the new category, or pick one from the list.'; $('#rcNewName').focus(); return; }
    if (needTitle(c, n)) { msg.textContent = 'Add a short title, like “Vet bill”'; $('#rcNote').focus(); return; }
    S.ui.rcCat = c; const wasEdit = !!editRc;
    const firstRc = !(S.ui.done && S.ui.done.receipts);
    const was = wasEdit ? JSON.parse(JSON.stringify((S.receipts || []).find(x => x.id === editRc) || null)) : null;   /* the receipt as it was, for the edit's own Undo */
    let rid = null; if (wasEdit) updateReceipt(S, editRc, d, a, c, n); else { rid = addReceipt(S, d, a, c, n); markDone('receipts', true); }
    msg.textContent = (wasEdit ? 'Saved. ' : 'Logged. ') + fmt2(wholeAmt(S, a)) + ': ' + (c === 'other' ? 'Other' : (lineByKey(S, c) || { name: 'Other' }).name) + '.';
    resetRcForm(); persist();
    if (d.slice(0, 7) !== sel) { select(d.slice(0, 7)); selByReceipt = true; } else render(); /* the list follows the receipt, so it can be seen where it went; Plan goes back to this month on its own */
    $('#rcAmt').focus();
    if (!wasEdit) { rcUndo(rid, msg.textContent); afterLog(firstRc); }   /* one tap takes this receipt back out (38.31 data safety round) */
    /* QC round 10 numbers should-fix 8: after an edit the bar of an earlier "Logged" (which would remove the receipt) is replaced. It names
       what Undo does now: puts the receipt back as it was before the edit, and the receipt stays */
    else if (was && window.offerUndoG) { const now = wholeAmt(S, a), same = Math.abs((+was.a || 0) - now) < 0.005;
      window.offerUndoG('receipt', `Saved ${fmt2(now)}: ${c === 'other' ? 'Other' : (lineByKey(S, c) || { name: 'Other' }).name}. Undo puts back ${same ? 'the receipt as it was' : fmt2(+was.a || 0)}.`,
        () => { const i = (S.receipts || []).findIndex(x => x.id === was.id); if (i >= 0) S.receipts[i] = was; ['#hMsg', '#rcMsg'].forEach(q => { const e = $(q); if (e && /^Saved/.test(e.textContent)) e.textContent = ''; }); }, 8000); }
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
      { const ch = $('#rcChanging'); if (ch) { ch.textContent = rcChangingText(r); ch.hidden = false; } }
      render(); $('#rcForm').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#rcAmt').focus();
    } else if (del) { const r0 = (S.receipts || []).find(x => x.id === del.dataset.rcdel), copy = r0 ? JSON.parse(JSON.stringify(r0)) : null, what = r0 ? `${fmt2(r0.a)}, ${r0.c === 'other' ? 'Other' : (lineByKey(S, r0.c) || { name: r0.cn || 'Other' }).name}, ${dateLabel(r0.d)}` : 'this receipt';
      confirmClick(del, `Tap again: delete ${what}`, () => { if (editRc === del.dataset.rcdel) resetRcForm(); removeReceipt(S, del.dataset.rcdel);
        if (copy && window.offerUndoG) window.offerUndoG('receipt', `Deleted ${what}`, () => { if (!(S.receipts || []).some(x => x.id === copy.id)) S.receipts.push(copy); });   /* Undo puts back exactly this receipt (38.31 data safety round) */ { const mm = $('#rcMsg'); if (mm) mm.textContent = ''; } persist(); render(); }); }
  });
  $('#rcFields').addEventListener('change', e => { if (remindChange(e.target)) renderReceipts(); });
}
