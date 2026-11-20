/* ===================== cards and loans, extra money, spending limits, last month, repeating spending ===================== */

/* ---------- cards and loans: Goals page card, Plan row, Home summary ---------- */
let DEBT_EDIT = null, DEBT_DRAFT = null, debtSig = '';
const debtMinToCover = d => Math.floor(d.balance * d.apr / 1200) + 1;
function debtFormHTML(d, isNew) {
  const id = esc(isNew ? 'new' : d.id), kinds = DEBT_KINDS.map(k => `<option value="${k}"${d.kind === k ? ' selected' : ''}>${DEBT_KIND_NAME[k]}</option>`).join('');
  return `<div class="gform dform" data-did="${id}">
    <div class="field"><label for="de-${id}-name">Name</label><input class="txt" id="de-${id}-name" data-d="name" type="text" value="${esc(d.name)}" maxlength="60" placeholder="BPI card"></div>
    <div class="field"><label for="de-${id}-kind">Type</label><div class="selbox"><select id="de-${id}-kind" data-d="kind">${kinds}</select></div></div>
    <div class="field"><label for="de-${id}-bal">Owed now</label><div class="inp"><span class="yen cs"></span><input id="de-${id}-bal" data-d="balance" type="number" inputmode="numeric" min="0" step="100" value="${d.balance === '' ? '' : d.balance}" placeholder="0"></div></div>
    <div class="field"><label for="de-${id}-apr">Interest rate, %</label><div class="rate"><input class="txt" id="de-${id}-apr" data-d="apr" type="text" inputmode="decimal" value="${d.apr === '' ? '' : esc(String(d.apr))}" placeholder="0" maxlength="6"><div class="selbox"><select id="de-${id}-per" data-per aria-label="Interest rate is per"><option value="year" selected>a year</option><option value="month">a month</option></select></div></div><p class="cap">Cards often show it per month, like 3.5, or per year, like 42, so pick what your statement says. Use 0 for money you owe a person.</p></div>
    <div class="field"><label for="de-${id}-min">Minimum a month</label><div class="inp"><span class="yen cs"></span><input id="de-${id}-min" data-d="min" type="number" inputmode="numeric" min="0" step="100" value="${d.min === '' ? '' : d.min}" placeholder="0"></div><p class="cap">The least you have to pay, and it's part of Bills and basics</p></div>
    <div class="field"><label for="de-${id}-extra">Extra a month</label><div class="inp"><span class="yen cs"></span><input id="de-${id}-extra" data-d="extra" type="number" inputmode="numeric" min="0" step="100" value="${d.extra === '' ? '' : d.extra}" placeholder="0"></div><p class="cap">On top of the minimum: it goes straight off what you owe so the interest drops</p></div>
    <p class="cap wide" id="de-${id}-msg" role="status"></p>
    <div class="row-btns wide">${isNew ? '<button type="button" class="btn small solid" data-dsave>Add</button><button type="button" class="btn small" data-dcancel>Cancel</button>'
      : `<button type="button" class="btn small solid" data-ddone>Done</button><button type="button" class="btn small warnbtn" data-ddel data-armkey="ddel-${id}">Remove</button>`}</div></div>`;
}
function debtCardHTML(d, r, x, i, first) {
  const id = esc(d.id), slot = SLOTS[i % SLOTS.length], open = DEBT_EDIT === d.id;
  const done = x.start <= 0, pct = x.paidPct;
  let stat, cls = 'plain', note = '';
  if (done) { cls = 'good'; stat = IC.ok + 'Paid off'; note = 'Nothing owed.'; }
  else if (r.never) { cls = 'bad'; stat = IC.bad + 'Not paid off'; note = `The payment doesn't cover the interest. Pay at least ${fmt(debtMinToCover(d))} a month.`; }
  else { cls = 'good'; stat = IC.ok + 'On the way'; note = `Paid off ${monthLabel(r.payoffYm)}.${r.totalInterest > 0 ? ' About ' + fmt(r.totalInterest) + ' interest in all.' : ''}`; }
  return `<div class="gcard dcard" id="dc-${id}" data-did="${id}" style="--c:var(--c${slot})">
    <div class="jhead"><span class="jarn"><i class="dot"></i><span>${esc(d.name)}</span></span><span class="jarv"><b>${fmt(x.start)}</b> owed</span></div>
    <div class="gbar" role="img" aria-label="${esc(d.name)}: ${x.paidPctWhole}% paid by the end of ${monthLabel(sel, true)}"><i class="fill" style="width:${pct * 100}%"></i></div>
    <div class="jfoot"><span class="jstat ${cls}">${stat}</span><span class="jart">${esc(note)}</span></div>
    <p class="gsave">${DEBT_KIND_NAME[d.kind]}${d.apr > 0 ? `, ${esc(String(d.apr))}% a year` : ''}. Pays <b>${fmt(x.pay)}</b> in ${monthLabel(sel, true)}${x.interest > 0 ? ` (${fmt(x.interest)} of it interest)` : ''}.</p>
    ${first && !done ? '<p class="gsave"><b>Put extra money here first.</b> It has the highest rate.</p>' : ''}
    <p class="gedit"><button type="button" class="link" data-dedit="${id}" aria-expanded="${open}">${open ? 'Close' : 'Edit'}</button></p>
    ${open ? debtFormHTML(d, false) : ''}</div>`;
}
function renderDebts() {
  const sec = $('#secDebts'); if (!sec) return;
  paintLim();
  const ds = debtsOf(S), m = C.byYm[sel], rows = ds.length ? debtRows(S, C) : [];
  const sample = sampleOn();
  sec.hidden = false;
  const sig = JSON.stringify([ds, DEBT_EDIT, DEBT_DRAFT, sel, sample, m.debts, rows.map(r => [r.payoffYm, r.never, r.totalInterest, r.first])]);
  const holding = sec.contains(document.activeElement) && document.activeElement.matches('input, select') && (DEBT_EDIT !== null || DEBT_DRAFT !== null);
  if (sig !== debtSig && !holding) {
    debtSig = sig;
    const cards = $('#debtCards');
    if (sample) cards.innerHTML = '<p class="cap">Finish the first steps, then add your cards and loans here.</p>';
    else cards.innerHTML = (ds.length ? ds.map((d, i) => debtCardHTML(d, rows[i], m.debts[d.id], i, rows[i].first)).join('') : '<p class="cap">Nothing here yet: add a card or loan to see when each is paid off and how much interest it costs</p>')
      + (DEBT_DRAFT ? `<div class="gcard dcard" data-did="new"><div class="jhead"><span class="jarn"><span>New card or loan</span></span></div>${debtFormHTML(DEBT_DRAFT, true)}</div>` : '');
    $('#addDebtBtn').hidden = sample || DEBT_DRAFT !== null || ds.length >= MAX_DEBTS;
    $('#debtMsg').textContent = ds.length >= MAX_DEBTS ? `You can have ${MAX_DEBTS} cards and loans at most, so remove one to add another` : '';
  }
  const owed = (m.debts && ds.length ? m.debtStart : 0) || 0;
  const free = rows.length && rows.every(r => !r.never) ? rows.reduce((a, r) => (r.payoffYm > a ? r.payoffYm : a), '') : '';
  $('#debtSub').textContent = !ds.length ? 'Cards and loans with interest, and their payments are part of Bills and basics'
    : `${fmt(owed)} owed at the start of ${monthLabel(sel, true)}. ${m.debtInterest > 0 ? fmt(m.debtInterest) + ' interest this month. ' : ''}${free ? 'Debt free ' + monthLabel(free) + '.' : rows.some(r => r.never) ? 'One of them isn\'t being paid off.' : ''}`;
  /* the Plan row */
  const row = document.querySelector('.row[data-id="debts"]'); if (row) row.hidden = !ds.length;
  const note = $('#jcap-debts'); if (note) note.textContent = ds.length ? `${fmt(m.debtMin)} minimums${m.debtExtra > 0 ? ' and ' + fmt(m.debtExtra) + ' extra' : ''}. Extra goes straight off what you owe.` : '';
}
function debtRead(form) {
  const g = k => form.querySelector(`[data-d="${k}"]`), num = k => { const v = Math.round(+g(k).value || 0); return Math.max(0, Math.min(1e9, v)); };
  const per = form.querySelector('[data-per]'), apr = parseFloat(String(g('apr').value).replace(',', '.')) * (per && per.value === 'month' ? 12 : 1);
  return { name: g('name').value.trim().slice(0, 60), kind: g('kind').value, balance: num('balance'), apr: isFinite(apr) ? Math.max(0, Math.min(100, Math.round(apr * 100) / 100)) : 0, min: num('min'), extra: num('extra') };
}
function debtsInit() {
  const sec = $('#secDebts'); if (!sec) return;
  sec.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'addDebtBtn') { DEBT_EDIT = null; DEBT_DRAFT = { id: '', name: '', kind: 'card', balance: '', apr: '', min: '', extra: '' }; debtSig = ''; renderDebts(); const f = sec.querySelector('[data-d="name"]'); if (f) f.focus(); return; }
    if (t.hasAttribute('data-dcancel')) { DEBT_DRAFT = null; debtSig = ''; renderDebts(); return; }
    if (t.hasAttribute('data-dsave')) {
      const form = t.closest('.dform'), v = debtRead(form), msg = $('#de-new-msg');
      if (!v.name) { msg.textContent = 'Give it a name.'; return; }
      if (!(v.balance > 0)) { msg.textContent = 'Enter how much is owed.'; return; }
      const d = { id: newId(S, 'd', x => debtsOf(S).some(q => q.id === x)), name: v.name, kind: v.kind, balance: v.balance, apr: v.apr, min: v.min, extra: v.extra };
      S.plan.debts = debtsOf(S).concat([d]); DEBT_DRAFT = null; DEBT_EDIT = null; debtSig = ''; persist(); restructure(); cheer('Added.'); return;
    }
    const ed = t.closest('[data-dedit]'); if (ed) { DEBT_EDIT = DEBT_EDIT === ed.dataset.dedit ? null : ed.dataset.dedit; debtSig = ''; renderDebts(); return; }
    if (t.hasAttribute('data-ddone')) { DEBT_EDIT = null; debtSig = ''; renderDebts(); return; }
    if (t.hasAttribute('data-ddel')) {
      const id = t.closest('.dform').dataset.did;
      const d0 = debtsOf(S).find(d => d.id === id), dn = d0 ? d0.name : 'This card or loan';
      confirmClick(t, `Tap again: removes ${dn} and its payments. You can undo for ${KEEP_DAYS} days.`, () => {
        const sn = snapNoCopy(); keepCopy(sn, `${dn} was removed.`); if (window.offerUndoG) window.offerUndoG(sn, `${dn} removed. You can undo for ${KEEP_DAYS} days.`);   /* 38.31 data safety round 3 */
        S.plan.debts = debtsOf(S).filter(d => d.id !== id); if (!S.plan.debts.length) delete S.plan.debts;
        delete S.steps['debt:' + id]; Object.keys(S.once).forEach(ym => { delete S.once[ym]['debt:' + id]; if (!Object.keys(S.once[ym]).length) delete S.once[ym]; });
        DEBT_EDIT = null; debtSig = ''; persist(); restructure();
      });
    }
  });
  /* an existing debt saves when a box is left; a new one waits for Add */
  sec.addEventListener('change', e => {
    const form = e.target.closest('.dform'); if (!form) return;
    if (form.dataset.did === 'new') { DEBT_DRAFT = Object.assign({}, DEBT_DRAFT, debtRead(form)); return; }
    const d = debtById(S, form.dataset.did); if (!d) return;
    const v = debtRead(form); if (!v.name) v.name = d.name;
    Object.assign(d, v); persist(); setTimeout(() => restructure(), 80);
  });
}

/* the Home card: what is owed, when it ends, where the next extra money should go */
function renderHomeDebts() {
  const el = $('#hDebts'); if (!el) return;
  const ds = debtsOf(S); if (!ds.length || sampleOn()) { el.hidden = true; return; }
  const ym = HV.ym, m = C.byYm[ym], rows = debtRows(S, C), owed = m.debtStart || 0;
  const free = rows.every(r => !r.never) ? rows.reduce((a, r) => (r.payoffYm > a ? r.payoffYm : a), '') : '';
  const first = rows.find(r => r.first), bad = rows.find(r => r.never);
  el.hidden = false;
  put(el, `<h2>Cards and loans</h2><p class="hs-lbl">Owed at the start of ${esc(monthLabel(ym, true))}</p><p class="hs-big" style="--n:${fmt(owed).length}">${fmt(owed)}</p>
    <p class="hs-sub">${m.debtPay > 0 ? `You pay <b>${fmt(m.debtPay)}</b> this month${m.debtInterest > 0 ? `, ${fmt(m.debtInterest)} of it interest` : ''}. ` : ''}${free ? `Debt free <b>${esc(monthLabel(free))}</b>.` : bad ? `<b>${esc(bad.name)}</b> isn't being paid off. Pay at least ${fmt(debtMinToCover(debtById(S, bad.id)))} a month.` : ''}</p>
    ${first && !bad ? `<p class="cap">Extra money goes to <b>${esc(first.name)}</b> first. It has the highest rate.</p>` : ''}
    <ul class="gdl">${rows.map(r => `<li><span class="gdn"><i class="dot" style="--c:var(--c${SLOTS[rows.indexOf(r) % SLOTS.length]})"></i>${esc(r.name)}</span><span class="gdw">${fmt(m.debts[r.id].start)}</span></li>`).join('')}</ul>
    <div class="row-btns"><button type="button" class="btn small" data-tab-go="goals">See details</button></div>`);
}

/* ---------- extra money: a bonus, a 13th month pay, a refund, a good freelance month ---------- */
let XM = null;
function xmDests() {
  const out = [{ t: 'bank', label: 'Keep it as a cushion' }];
  const live = S.plan.goals.filter(g => g.target > 0);
  live.forEach(g => out.push({ t: 'goal', id: g.id, label: (kindOfGoal(S, g) === 'debt' ? 'Pay toward ' : 'Add to ') + g.name }));
  debtsOf(S).forEach(d => { if (d.balance > 0) out.push({ t: 'debt', id: d.id, label: 'Pay down ' + d.name }); });
  if (S.plan.lines.some(l => l.jar === 'play')) out.push({ t: 'play', label: 'Spend it, free to spend' });
  if (S.plan.lines.some(l => l.jar === 'ffa')) out.push({ t: 'ffa', label: 'Investing' });
  return out;
}
function openExtra() {
  if (sampleOn()) { cheer('Finish the first steps first.'); return; }
  XM = { amt: '', dest: 0, ym: HV && HV.ym ? HV.ym : sel, ret: document.activeElement };
  let el = $('#xm');
  if (!el) {
    el = document.createElement('div'); el.id = 'xm'; el.className = 'gw xm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'xmT'); document.body.appendChild(el);
    el.addEventListener('click', xmClick);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeExtra(); } });
  }
  xmPaint(); el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); document.body.classList.add('gw-open');
  const f = $('#xmAmt'); if (f) f.focus();
}
function closeExtra() { const el = $('#xm'); if (el) { el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 200); } document.body.classList.remove('gw-open'); const r = XM && XM.ret; XM = null; if (r && r.focus) try { r.focus(); } catch (e) { /* gone */ } }
function xmPreview() {
  const ds = xmDests(), d = ds[XM.dest] || ds[0], amt = Math.round(+(($('#xmAmt') || {}).value) || 0);
  if (!(amt > 0)) return 'Enter the amount.';
  /* try it on a copy of the month changes, then put them back */
  const T = JSON.parse(JSON.stringify({ steps: S.steps, once: S.once })); let res;
  try { res = addExtraMoney(S, XM.ym, amt, d); } finally { S.once = T.once; S.steps = T.steps; }
  if (!res) return 'That one can\'t take extra money, pick another.';
  return res.toBank > 0 ? `${fmt(res.placed)} goes to: ${d.label.toLowerCase()}. ${fmt(res.toBank)} stays in the balance.` : `All ${fmt(res.placed || amt)} goes to: ${d.label.toLowerCase()}.`;
}
function xmPaint() {
  const el = $('#xm'); if (!el || !XM) return;
  const ds = xmDests(), mons = MONTHS.filter(x => x >= START).slice(0, MONTHS.length);
  el.innerHTML = `<div class="gw-scrim" data-xmno></div><div class="gw-card"><h2 id="xmT">Extra money came in</h2><p class="cap">Like a bonus or a 13th month pay: it's only added to ${esc(monthLabel(XM.ym))}</p>
    <div class="field"><label for="xmAmt">Amount</label><div class="inp"><span class="yen cs"></span><input id="xmAmt" type="number" inputmode="numeric" min="0" step="100" value="${XM.amt}" placeholder="0"></div></div>
    <div class="field"><label for="xmMon">Month</label><div class="selbox"><select id="xmMon">${mons.map(x => `<option value="${x}"${x === XM.ym ? ' selected' : ''}>${esc(monthLabel(x))}</option>`).join('')}</select></div></div>
    <div class="field"><label for="xmDest">Where should it go?</label><div class="selbox"><select id="xmDest">${ds.map((d, i) => `<option value="${i}"${i === XM.dest ? ' selected' : ''}>${esc(d.label)}</option>`).join('')}</select></div></div>
    <p class="cap" id="xmPrev" role="status"></p>
    <div class="row-btns"><button type="button" class="btn solid" data-xmok>Add</button><button type="button" class="btn" data-xmno>Cancel</button></div></div>`;
  const amt = $('#xmAmt'); const upd = () => { if (!XM) return; XM.amt = amt.value; $('#xmPrev').textContent = xmPreview(); };
  amt.addEventListener('input', upd); amt.addEventListener('change', upd);
  $('#xmMon').addEventListener('change', e => { if (!XM) return; XM.ym = e.target.value; upd(); });
  $('#xmDest').addEventListener('change', e => { if (!XM) return; XM.dest = +e.target.value; upd(); });
  upd();
}
function xmClick(e) {
  const b = e.target.closest('button, [data-xmno]'); if (!b) return;
  if (b.hasAttribute('data-xmno')) { closeExtra(); return; }
  if (b.hasAttribute('data-xmok')) {
    const amt = Math.round(+$('#xmAmt').value || 0), d = xmDests()[XM.dest];
    if (!(amt > 0)) { $('#xmPrev').textContent = 'Enter the amount.'; return; }
    const res = addExtraMoney(S, XM.ym, amt, d); if (!res) return;
    markDone('pay'); persist(); closeExtra(); render(); sfx('sparkle'); cheer(res.toBank > 0 ? 'Added and the rest stays in your bank' : 'Added.');
  }
}

/* ---------- pay that comes weekly, every two weeks or twice a month, or that changes: work out one monthly number ---------- */
const PAYF = [['month', 'Once a month', 1], ['twice', 'Twice a month', 2], ['two', 'Every two weeks', 26 / 12], ['week', 'Every week', 52 / 12]];
let PY = null;
function payMonthly(per, f) { const m = PAYF.find(x => x[0] === f) || PAYF[0]; return Math.round((+per || 0) * m[2]); }
function openPay() {
  if (sampleOn()) { cheer('Finish the first steps first.'); return; }
  PY = { f: 'month', amt: '', ym: HV && HV.ym ? HV.ym : sel, ret: document.activeElement };
  let el = $('#pay');
  if (!el) {
    el = document.createElement('div'); el.id = 'pay'; el.className = 'gw xm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'payT'); document.body.appendChild(el);
    el.addEventListener('click', payClick);
    el.addEventListener('input', payShow); el.addEventListener('change', payShow);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePay(); } });
  }
  el.innerHTML = `<div class="gw-scrim" data-payno></div><div class="gw-card"><h2 id="payT">Work out your monthly pay</h2><p class="cap">The plan works in months, so say how often you're paid and how much each time</p>
    <div class="field"><label for="payF">How often are you paid?</label><div class="selbox"><select id="payF">${PAYF.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('')}</select></div></div>
    <div class="field"><label for="payA">How much each time?</label><div class="inp"><span class="yen cs"></span><input id="payA" type="number" inputmode="numeric" min="0" step="100" placeholder="0"></div></div>
    <p class="cap" id="payRes" role="status">Enter the amount.</p>
    <p class="cap">If your pay changes from month to month, put in the least you usually get. When more comes in, use "Extra money came in" and choose where it goes.</p>
    <div class="row-btns"><button type="button" class="btn solid" data-payok>Use as my monthly pay</button><button type="button" class="btn" data-payno>Cancel</button></div></div>`;
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); document.body.classList.add('gw-open');
  const f = $('#payA'); if (f) f.focus();
}
function closePay() { const el = $('#pay'); if (el) { el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 200); } document.body.classList.remove('gw-open'); const r = PY && PY.ret; PY = null; if (r && r.focus) try { r.focus(); } catch (e) { /* gone */ } }
function payShow() { const r = $('#payRes'); if (!r || !PY) return; const a = +$('#payA').value || 0, f = $('#payF').value, m = payMonthly(a, f); r.textContent = a > 0 ? `That's about ${fmt(m)} a month.${f === 'two' || f === 'week' ? ' Some months you\'re paid an extra time, so plan with this number and treat that month as extra money.' : ''}` : 'Enter the amount.'; }
function payClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  if (b.hasAttribute('data-payno')) { closePay(); return; }
  if (b.hasAttribute('data-payok')) {
    const m = payMonthly(+$('#payA').value || 0, $('#payF').value); if (!(m > 0)) { $('#payRes').textContent = 'Enter the amount.'; return; }
    setVal(S, 'a', PY.ym, m, 'after'); markDone('pay'); persist(); closePay(); render(); sfx('sparkle'); cheer('Monthly pay set to ' + fmt(m) + '.');
  }
}

/* ---------- spending limits: every line against what was logged for it (Home, when switched on in Settings) ---------- */
function renderLimits() {
  const el = $('#hLimits'); if (!el) return;
  if (!S.ui.limits || sampleOn() || !HV) { el.hidden = true; return; }
  const L = limitsOf(S, C, HV.ym); if (!L.rows.length && !L.other) { el.hidden = true; return; }
  el.hidden = false;
  put(el, `<h2>Spending limits</h2><p class="hs-lbl">Each line against what you logged in ${esc(monthLabel(HV.ym, true))}</p>
    <ul class="lim">${L.rows.map(r => { const f = r.planned > 0 ? Math.min(1, r.spent / r.planned) : (r.spent > 0 ? 1 : 0); return `<li class="${r.over ? 'over' : ''}"><span class="ln">${esc(r.name)}</span><span class="lv">${r.over ? `${fmt2(r.overBy)} over` : `${fmt2(r.left)} left`}</span><span class="lb" role="img" aria-label="${esc(r.name)}: ${fmt2(r.spent)} of ${fmt(r.planned)}"><i style="width:${f * 100}%"></i></span><span class="ls">${fmt2(r.spent)} of ${fmt(r.planned)}</span></li>`; }).join('')}</ul>
    ${L.other > 0 ? `<p class="cap">${fmt2(L.other)} logged as Other has no limit.</p>` : ''}`);
}

/* ---------- last month ---------- */
function renderLookBack() {
  const el = $('#rcBack'); if (!el) return;
  const ym = sel, pm = MONTHS[MONTHS.indexOf(ym) - 1]; if (!pm || sampleOn() || !(pm < nowYm())) { el.hidden = true; return; }   /* only a month that has ended is looked back on (QC round 4 north-star 1) */
  const b = lookBack(S, C, pm); if (!b || !(b.inflow > 0) || !b.count) { el.hidden = true; return; }
  el.hidden = false;
  const names = { nec: 'Bills and basics', play: 'Free to spend', edu: 'Education', give: 'Giving' };
  const rows = b.jars.filter(j => j.planned > 0 || j.spent > 0).map(j => `<tr><th scope="row">${names[j.id]}</th><td>${fmt(j.planned)}</td><td>${j.spent > 0 ? fmt2(j.spent) : j.id === 'nec' ? 'in plan' : fmt(0)}</td></tr>`).join('');
  put(el, `<h2>Last month, ${esc(monthLabel(pm))}</h2>
    <p class="cap">${b.count} ${b.count === 1 ? 'receipt' : 'receipts'}, ${fmt2(b.logged)} logged. The balance went ${b.left >= 0 ? 'up' : 'down'} ${fmt2(b.change)}, from ${fmt2(b.bankStart)} to ${fmt2(b.bankEnd)}.</p>
    <div class="tablewrap"><table class="lbt"><thead><tr><th scope="col"></th><th scope="col">Planned</th><th scope="col">Spent</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${b.over.length ? `<p class="cap">Over the plan: ${b.over.slice(0, 3).map(r => `${esc(r.name)} by ${fmt2(r.overBy)}`).join(', ')}.</p>` : '<p class="cap">Nothing went over its plan.</p>'}
    <p class="cap">${b.goalsAdded > 0 ? `${fmt(b.goalsAdded)} went to goals. ` : ''}${b.debtPaid > 0 ? `${fmt(b.debtPaid)} went to cards and loans, ${fmt(b.interest)} of it interest. ` : ''}</p>`);
}

/* ---------- repeating spending ---------- */
let REC_OPEN = false;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function renderRecurring() {
  const el = $('#rcRepeat'); if (!el) return;
  if (sampleOn()) { el.hidden = true; return; }
  el.hidden = false;
  const rs = (S.plan.recurring || []);
  const cats = Array.from($('#rcCat').options).filter(o => o.value !== CAT_NEW);
  const list = rs.map(r => `<li><span><b>${fmt2(r.a)}</b> ${esc(r.n || (lineByKey(S, r.c) ? lineByKey(S, r.c).name : 'Other'))}</span><span class="cap">${r.every === 'week' ? 'Every ' + WEEKDAYS[r.on] : 'On day ' + r.on + ' of the month'}</span><button type="button" class="link warn" data-recdel="${esc(r.id)}" data-armkey="rec-${esc(r.id)}">Stop</button></li>`).join('');
  const sig = JSON.stringify([rs, REC_OPEN, cats.map(o => o.value + o.textContent)]); if (el.dataset.sig === sig) return;
  if (el.contains(document.activeElement) && document.activeElement.matches('input, select') && REC_OPEN) return;
  el.dataset.sig = sig;
  el.innerHTML = `<div class="head"><h2>Repeating spending</h2><p class="sub2">Like a gym fee or a weekly top-up: it gets logged for you on its day</p></div>
    ${rs.length ? `<ul class="recl">${list}</ul>` : '<p class="cap">None yet.</p>'}
    ${REC_OPEN ? `<form class="addrow rec-form" id="recForm" autocomplete="off">
      <div class="inp sm"><span class="yen cs"></span><input id="recAmt" type="number" inputmode="decimal" min="0" step="any" placeholder="Amount" aria-label="Amount"></div>
      <div class="selbox"><select id="recCat" aria-label="Category">${cats.map(o => `<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('')}</select></div>
      <input class="txt" id="recNote" type="text" maxlength="80" placeholder="Note (optional)" aria-label="Note">
      <div class="selbox"><select id="recEvery" aria-label="How often"><option value="week">Every week</option><option value="month">Every month</option></select></div>
      <div class="selbox"><select id="recOn" aria-label="Day"></select></div>
      <button class="btn small solid" type="submit">Repeat</button><button class="btn small" type="button" id="recCancel">Cancel</button></form>`
      : `<div class="row-btns"><button type="button" class="btn small" id="recAdd"${rs.length >= MAX_RECURRING ? ' disabled' : ''}>Add repeating spending</button></div>`}`;
  const ev = $('#recEvery'); if (ev) { const fillOn = () => { $('#recOn').innerHTML = ev.value === 'week' ? WEEKDAYS.map((n, i) => `<option value="${i}">${n}</option>`).join('') : Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}">Day ${i + 1}</option>`).join(''); }; fillOn(); ev.addEventListener('change', fillOn); }
}
function recurringInit() {
  const el = $('#rcRepeat'); if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'recAdd') { REC_OPEN = true; el.dataset.sig = ''; renderRecurring(); const a = $('#recAmt'); if (a) a.focus(); return; }
    if (b.id === 'recCancel') { REC_OPEN = false; el.dataset.sig = ''; renderRecurring(); return; }
    const del = b.closest('[data-recdel]'); if (del) confirmClick(del, 'Tap again to stop', () => { S.plan.recurring = (S.plan.recurring || []).filter(r => r.id !== del.dataset.recdel); if (!S.plan.recurring.length) delete S.plan.recurring; el.dataset.sig = ''; persist(); renderRecurring(); });
  });
  el.addEventListener('submit', e => {
    if (e.target.id !== 'recForm') return; e.preventDefault();
    const a = round2(+$('#recAmt').value || 0); if (!(a > 0)) { cheer('Enter an amount.'); return; }
    const every = $('#recEvery').value, on = +$('#recOn').value, c = $('#recCat').value, today = todayStr();
    const r = { id: newId(S, 'rp', x => (S.plan.recurring || []).some(q => q.id === x)), a, c: lineByKey(S, c) ? c : 'other', n: $('#recNote').value.trim().slice(0, 80), every, on, from: today, last: '' };
    S.plan.recurring = (S.plan.recurring || []).concat([r]); REC_OPEN = false; el.dataset.sig = '';
    const n = applyRecurring(S, today); persist(); render(); cheer(n ? 'Repeating, and today\'s was logged' : 'Repeating.');
  });
}

/* ---------- how a number is worked out ---------- */
function openWhy(kind) {
  if (!HV || !C) return;
  const V = HV, ym = V.ym, m = C.byYm[ym], p = V.play, floor = cfg(S, 'minBank'), mon = monthLabel(ym, true);
  let title, rows = [], foot = '';
  if (kind === 'room:play') kind = 'free';
  if (kind === 'room:nec') {
    const M = V.map, rsn = receiptStats(S, ym).byJar.nec || 0;
    title = 'Bills and basics';
    const nr = M.month.find(x => x.id === 'nec'), ov = nr && nr.overBy > 0 ? nr.overBy : 0;
    rows = [[`Planned for ${mon}`, fmt(M.billsPlanned)], ['Logged so far', (rsn > 0.004 ? '−' : '') + fmt2(rsn)]]; if (ov) rows.push(['Logged past a bill\'s plan, still due', '+' + fmt2(ov)]); rows.push(['Left to pay', fmt(M.billsLeft)]);
    foot = 'Rent, bills, food, card payments and one-time costs. Logged is every receipt in a Bills and basics line this month.';
  } else if (/^room:(edu|give|ffa)$/.test(kind)) {
    const r = V.map.burrows.find(x => 'room:' + x.id === kind);
    if (!r) return;
    title = r.name;
    rows = [[`Planned for ${mon}`, fmt(r.monthly)], ['Planned since the start of your plan', fmt(r.planned)]];
    if (r.id !== 'ffa' || r.logged > 0) rows.push(['Logged', (r.logged > 0 ? '−' : '') + fmt2(r.logged)]);
    rows.push([r.over ? 'Logged more than planned' : 'In this burrow', r.over ? fmt2(r.loggedPast) : fmt(r.amount)]);
    foot = r.id === 'ffa' ? 'Money you invest and don\'t spend' : 'Money that piles up. What you log here comes out of the pile and doesn\'t touch your monthly bills.';
  } else if (kind === 'free') {
    const fo = freeOf(S, V.month, p), held = fo.held, freeLeft = fo.free;
    title = 'Free to spend';
    rows = [[`Free to spend planned for ${mon}`, fmt(p.planned)], [`Logged in Free to spend (${p.count} ${p.count === 1 ? 'receipt' : 'receipts'})`, (p.spent > 0.004 ? '−' : '') + fmt2(p.spent)]];   /* no minus in front of zero (38.31 north-star round 4) */
    if (held > 0) rows.push(['Held back so the balance stays above your minimum', '−' + fmt(held)]);
    rows.push(['Free to spend', fmt2(freeLeft)]);
    const notSafe = playNotSafe(S, C, ym, ymd(new Date())) && !sampleOn();   /* the same rule as the top of Home: no per week or per day figure to spend while the bank cannot cover it (QC round 4 north-star 4) */
    if (notSafe) rows.push(['Not safe to spend yet', 'Your bank is less than your bills still to pay and Free to spend']);
    else if (p.perWeek != null) rows.push([`Per week for the ${plural(p.daysLeft, 'day')} left`, fmtAbout(V.cells.perWeek)]);
    if (!notSafe && p.daysLeft > 0 && freeLeft > 0) rows.push(['Per day', fmtAbout(V.cells.perDay)]);
    foot = (notSafe ? 'It becomes safe to spend when your pay lands: then tap Check your bank on Home and type the new balance. ' : '') + 'Planned is the Free to spend total on the Plan page. Logged is every receipt in Free to spend this month.';
  } else {
    title = 'Where you stand in ' + mon;
    rows = [['Pay and other money in', fmt(m.inflow)], ['Bills, one-time costs and card payments', '−' + fmt(m.jar.nec)], ['Goal burrows', '−' + fmt(m.goalsTotal)], ['Free to spend, Education, Investing, Giving', '−' + fmt(V.cells.otherPlaces)], ['Left in the month', (m.left < 0 ? '−' : '') + fmt2(V.cells.leftAbs)], ['Balance at the start', fmt2(m.bankStart)]].concat((m.overNow || 0) > 0.004 ? [['Spent past the plan so far', '−' + fmt2(m.overNow)]] : [], (m.credit || 0) > 0.004 ? [['Free to spend not spent, back in the bank', '+' + fmt2(m.credit)]] : [], [['Balance at the end', fmt2(m.bankEnd)], ['Your minimum balance', fmt(floor)]]);
    foot = m.bankEnd < floor ? 'The balance ends under your minimum, so the month is short.' : m.left < 0 ? 'The month spends more than comes in, but the balance covers it.' : 'Everything planned fits in your pay.';
    if ((m.overNow || 0) > 0.004) foot += ' Spending past the plan came out of the bank.';   /* the rows add up: start + left + past the plan + back = end (QC round 4 numbers B2) */
  }
  let el = $('#why');
  if (!el) {
    el = document.createElement('div'); el.id = 'why'; el.className = 'gw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'whyT'); document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target.closest('[data-whyno]')) closeWhy(); });
    el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeWhy(); } });
  }
  el.dataset.ret = ''; el._ret = document.activeElement;
  el.innerHTML = `<div class="gw-scrim" data-whyno></div><div class="gw-card"><h2 id="whyT">${esc(title)}</h2><dl class="whyl">${rows.map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl><p class="cap">${esc(foot)}</p><div class="row-btns"><button type="button" class="btn solid" data-whyno>Close</button></div></div>`;
  el.hidden = false; requestAnimationFrame(() => el.classList.add('on')); document.body.classList.add('gw-open');
  const c = el.querySelector('.btn'); if (c) c.focus();
}
function closeWhy() { const el = $('#why'); if (!el) return; el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 200); document.body.classList.remove('gw-open'); if (el._ret && el._ret.focus) try { el._ret.focus(); } catch (e) { /* gone */ } }

/* ---------- Settings switch and page wiring ---------- */
function paintLim() { const b = $('#setLim'); if (!b) return; const on = S.ui.limits === true; b.setAttribute('aria-checked', String(on)); $('#limTxt').textContent = on ? 'On' : 'Off'; }
(function () {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-xm]')) { openExtra(); return; }
    if (e.target.closest('[data-pay]')) { openPay(); return; }
    const w = e.target.closest('[data-why]'); if (w) openWhy(w.dataset.why);
  });
  const lim = $('#setLim'); if (lim) lim.addEventListener('click', () => { if (S.ui.limits === true) delete S.ui.limits; else S.ui.limits = true; persist(); render(); });
  /* switching "a year" / "a month" converts the number in the box, so the same rate is shown either way */
  document.addEventListener('change', e => {
    const s = e.target.closest && e.target.closest('[data-per]'); if (!s) return;
    const f = s.closest('.dform'), box = f && f.querySelector('[data-d="apr"]'); if (!box) return;
    const v = parseFloat(String(box.value).replace(',', '.')); if (!isFinite(v)) return;
    box.value = String(Math.round((s.value === 'month' ? v / 12 : v * 12) * 100) / 100);
  });
  debtsInit(); recurringInit();
  /* repeating spending that came due since the last visit is logged when the page opens and when it comes back to the front */
  const due = () => {
    if (!S.plan || !S.plan.recurring || !S.plan.recurring.length) return;
    let n = 0; try { n = applyRecurring(S, todayStr()); } catch (e) { n = 0; }
    if (n > 0) { persist(); render(); cheer(n === 1 ? 'Logged 1 repeating payment' : 'Logged ' + n + ' repeating payments'); }
  };
  setTimeout(due, 600);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) due(); });
})();
