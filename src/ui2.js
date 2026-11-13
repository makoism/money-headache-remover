
/* ---------- bar and legend (hero and dock): the six jars ---------- */
const pc = x => Math.round(x * 100) + '%';
function paintBar(el, m, withLabels) {
  if (!el.children.length) el.innerHTML = JARS.map(j => `<div class="seg-b ${JARCLS[j.id]}" data-k="${j.id}" ${withLabels ? 'tabindex="0"' : ''}></div>`).join('') + `<div class="seg-b rest" data-k="rest" ${withLabels ? 'tabindex="0"' : ''}></div>`;
  const J = jarsOf(S, m), rest = Math.max(0, m.pool.left), names = [];
  J.list.forEach(j => {
    const d = $(`[data-k="${j.id}"]`, el);
    d.hidden = j.v <= 0; d.style.flexGrow = Math.max(j.v, 0);
    d.dataset.tip = `<i style="--c:${JARVAR[j.id]}"></i><b>${j.name}</b> ${fmt(j.v)}` + (J.income > 0 && !J.over ? `<br>${j.pct}% of pay` : '');
    d.setAttribute('aria-label', `${j.name} ${fmt(j.v)}`); if (j.v > 0) names.push(`${j.name} ${fmt(j.v)}`);
  });
  const r = $('[data-k="rest"]', el); r.hidden = rest <= 0; r.style.flexGrow = rest;
  r.dataset.tip = `<b>Left</b> ${fmt(rest)}` + (J.income > 0 ? `<br>${J.restPct}% of pay, unassigned` : ''); r.setAttribute('aria-label', `Left ${fmt(rest)}`);
  if (rest > 0) names.push('Left ' + fmt(rest));
  if (withLabels) el.setAttribute('aria-label', `Pay ${fmt(m.pool.in)} by jar: ` + names.join(', '));
}
function paintLegend(m) {
  const J = jarsOf(S, m), has = J.income > 0 && !J.over;
  const row = (cls, name, sub, v, p, neg) => `<div class="lg${neg ? ' neg' : ''}"><i class="${cls}"></i><span>${name}${sub ? `<small>${sub}</small>` : ''}</span><b>${fmt(v)}</b><em>${p}</em></div>`;
  $('#legend').classList.toggle('nopct', !has);
  const live = S.plan.goals.filter(g => g.target > 0 && m.g[g.id] && m.g[g.id].actual > 0).map(g => g.name);
  const ltsTag = live.length ? esc(live.slice(0, 2).join(', ') + (live.length > 2 ? ` and ${live.length - 2} more` : '')) : JARTAG.lts;
  $('#legend').innerHTML = J.list.map(j => row(JARCLS[j.id], j.name, j.id === 'lts' ? ltsTag : JARTAG[j.id], j.v, has ? j.pct + '%' : '')).join('')
    + (J.rest > 0 ? row('rest', 'Left', 'Unassigned', J.rest, has ? J.restPct + '%' : '') : '')
    + (J.short > 0 ? row('rest', 'Short by', 'Plan exceeds pay', J.short, '', true) : '');
}
/* one plain sentence under the table: how this month's bills sit against Eker's usual split, and whether every bit of pay has a purpose */
function jarNote(m) {
  const J = jarsOf(S, m); if (J.inn <= 0) return '';
  if (J.over) return `Plan exceeds pay by ${fmt(J.short)}, so percents are off. Lower a bill or jar.`;
  const nec = J.list[0], u = nec.usual;
  const lead = nec.pct > u + 1 ? `Necessities are ${nec.pct}% of pay, above Eker&rsquo;s usual ${u}%. Common. Keep the other jars going, even small: the habit matters more than the exact percent.`
    : nec.pct < u - 1 ? `Necessities are ${nec.pct}% of pay, under Eker&rsquo;s usual ${u}%. More room for the other jars.`
    : `Necessities are ${nec.pct}% of pay, in line with Eker&rsquo;s usual ${u}%.`;
  return lead;
}
const LTS_HINT = ' Each slider sets that goal’s amount this month. Leave them alone to use the computed amounts (from goal amounts and dates). Up takes from Left; down returns to Left.';

/* ---------- the first-steps card ---------- */
const START_SUB = 'Sample numbers for one salary. Replace them with yours. Data stays in this browser.';
const BASICS_SUB = 'Name, currency, balance, look, saved data.';
const MAKE_CAP = 'Amounts are samples for one salary. Start at zero or type over them. Saved in this browser only. Nobody else sees it, including whoever shared this page.';
const START_STEPS = [
  ['pay', 'Enter pay', 'Type monthly take-home pay under Salary.', 'Go to Salary', 'data-open="a"'],
  ['bills', 'Check bills', 'Set each Necessities line to the real amount. Rename, remove or add lines.', 'Open Necessities', 'data-open="nec"'],
  ['goals', 'Set goals', 'Name each goal, its cost and its date.', 'Go to Goals', 'data-tab-go="goals"'],
  ['receipts', 'Log receipts', 'Add what you spent. Set a calendar reminder to make it a habit.', 'Go to Receipts', 'data-tab-go="receipts"'],
];
function renderStart() {
  /* the checklist now lives on Home as a single next step; the old card stays out of sight */
  $('#start').hidden = true;
  const mine = !!S.ui.setup && !S.ui.cleared, zero = S.ui.preset === 'blank' || !!S.ui.cleared;
  $('#basicsSub').textContent = BASICS_SUB;
  $('#makeCap').textContent = mine ? 'These are your numbers. Change them any time. Saved in this browser only; nobody else sees them.' : zero ? 'Everything starts at zero. Type over it. Saved in this browser only.' : MAKE_CAP;
  $('#blankBtn').hidden = zero; $('#showStart').hidden = !(S.ui.sampleHidden || S.ui.exactHidden); /* Zero all stays while there is anything to zero: Restore names it as the way to start over. Show first steps brings back a hidden Next card */ $('#tourOpen2').textContent = mine ? 'Tour' : 'Guided setup';
}

/* ---------- render ---------- */
function render() {
  C = calcAll(S);
  const m = C.byYm[sel], st = statusOf(S, m), floor = cfg(S, 'minBank'), mon = monthLabel(sel, true), L = m.pool.left;
  document.title = 'The Burrow';
  $('#curSel').value = (S.ui && S.ui.cur) || '₱'; renderStart();
  { const nm = (S.ui && S.ui.name) || '', hr = new Date().getHours(), hi = $('#hello'); hi.hidden = !nm; hi.textContent = nm; setIdle($('#nameIn'), nm); }

  /* month picker */
  const mi = MONTHS.indexOf(sel); $('#monthSel').value = sel; { const so = $('#monthSel').selectedOptions[0]; $('#monthTxt').textContent = so ? so.textContent : ''; } $('#prevM').disabled = mi <= 0; $('#nextM').disabled = mi >= MONTHS.length - 1;
  $('#payTxt').hidden = true;

  /* hero: play money, then one verdict */
  const pin = m.pool.in, play = m.jar.play, wk = roundTo(play / 4.35);
  $('#heroNum').textContent = fmt(play); $('#heroNum').style.setProperty('--n', String(fmt(play).length)); $('#heroWk').textContent = `About ${fmt(wk)} a week.`;
  const rs = receiptStats(S, sel), playSpent = rs.byJar.play || 0;
  $('#rcLine').innerHTML = !rs.count ? '<button type="button" class="link" data-tab-go="receipts">Add a receipt</button> to see actual spend.'
    : play > 0 ? `Receipts: ${fmt2(playSpent)} spent, ${playSpent > play ? fmt2(round2(playSpent - play)) + ' over' : fmt2(round2(play - playSpent)) + ' left'}. <button type="button" class="link" data-tab-go="receipts">See receipts</button>`
    : `Receipts: ${fmt2(rs.total)} spent. <button type="button" class="link" data-tab-go="receipts">See receipts</button>`;
  const chip = $('#chip'); chip.className = 'chip ' + st; chip.hidden = pin <= 0;
  chip.innerHTML = st === 'good' ? IC.ok + 'On plan' : st === 'tight' ? IC.warn + 'Tight month' : IC.bad + 'Short';
  const gap = Math.max(0, floor - m.bankEnd);
  let vt;
  if (pin <= 0) vt = 'Enter monthly take-home pay: tap Salary below.';
  else if (st === 'good') vt = (L < roundUnit(S) ? 'All pay assigned.' : `${fmt(L)} of pay unassigned.`) + (L >= pin * 0.08 ? ' Raise a goal or jar to use it, or keep it as a cushion.' : '');
  else if (st === 'tight') vt = `Month spends ${fmt(-L)} more than it brings in. Balance covers it and ends at ${fmt(m.bankEnd)}, at or above the ${fmt(floor)} minimum.`;
  else vt = `Balance would end at ${fmt(m.bankEnd)}, ${fmt(gap)} under the ${fmt(floor)} minimum. Pick a fix:`;
  if (m.draw > 0) vt += ` ${fmt(m.draw)} comes from the emergency fund.`;
  $('#verdict').textContent = vt;
  let btns = '';
  if (st !== 'good') fixes(S, m).forEach(f => {
    btns += f.id === 'trim' ? `<button type="button" class="btn small" data-fx="trim" data-amt="${f.amount}">Spend ${fmt(f.amount)} instead</button>`
      : `<button type="button" class="btn small" data-fx="borrow" data-amt="${f.amount}">Borrow ${fmt(f.amount)} from emergency fund</button>`;
  });
  if (m.draw > 0) btns += '<button type="button" class="btn small" data-fx="unborrow">Undo borrow</button>';
  $('#fixBtns').innerHTML = btns;

  /* where it goes */
  $('#whereTitle').textContent = `${fmt(m.pool.in)} pay, by jar`;
  paintBar($('#bar'), m, true); paintBar($('#dockBar'), m, false); paintLegend(m); $('#jarNote').innerHTML = jarNote(m);
  const el = $('#endline'); el.hidden = !(m.pool.out > m.pool.in); if (!el.hidden) el.style.left = (m.pool.in / m.pool.out * 100) + '%';
  $('#dockNum').textContent = fmt(L); $('#dockNum').style.color = L < 0 ? 'var(--bad)' : '';
  $('#dockTxt').textContent = `${L < 0 ? 'over in ' + mon : L < roundUnit(S) ? 'all assigned' : 'unassigned in ' + mon} · ${st === 'good' ? 'On plan' : st === 'tight' ? 'Tight' : 'Short'}`;

  /* the details */
  $('#inTotal').textContent = fmt(m.pool.in); $('#outTotal').textContent = fmt(m.pool.out);
  const lt = $('#leftTotal'); lt.textContent = fmt(L); lt.classList.toggle('neg', L < 0);
  $('#bankLine').textContent = `Balance: ${fmt(m.bankStart)} to ${fmt(m.bankEnd)} this month.`;
  $('#rowDraw').hidden = !(m.draw > 0); $('#ra-draw').textContent = fmt(m.draw);
  const amts = { a: m.a, b: m.b, side: m.side, nec: m.billsTotal, items: m.itemsTotal, lts: m.goalsTotal, play: m.jar.play, edu: m.jar.edu, ffa: m.jar.ffa, give: m.jar.give };
  const changed = {}, chgList = [], nextYm = MONTHS[MONTHS.indexOf(sel) + 1] || null;
  FIELDS.forEach(f => {
    const on = !f.ends || sel <= f.ends, v = on ? val(S, f.key, sel) : 0, inp = $('#i-' + f.fid);
    inp.disabled = !on; setIdle(inp, v); $('#e-' + f.fid).classList.toggle('off', !on);
    if (f.sl) {
      const P = payScale(), base = niceUp(f.sl.frac * P), stp = Math.max(1, stepOf(base / 150)), mx = Math.max(base, Math.ceil(v * 1.2 / stp) * stp), rg = $('#r-' + f.fid);
      rg.step = stp; rg.max = mx; rg.value = v; rg.style.setProperty('--p', Math.max(0, Math.min(100, v / mx * 100)) + '%');
      if (f.sl.mark) { const mk = $('#m-' + f.fid), at = cfg(S, 'ceiling'); mk.style.left = `calc(${at / mx * 100}% - 1px)`; mk.hidden = at <= 0 || at > mx; }
    }
    $('#n-' + f.fid).innerHTML = noteFor(f, m, v, on);
    const fs = on ? fstate(f.key) : null, k = $('#k-' + f.fid); k.hidden = !fs;
    if (fs) { $('#kt-' + f.fid).textContent = `Edited for ${mon} only. ${nextYm ? 'Back to ' + fmt(fs.u) + ' in ' + monthLabel(nextYm, true) + '.' : 'Usual: ' + fmt(fs.u) + '.'}`; changed[f.row] = true; chgList.push(`${f.label} ${fmt(fs.ov)} (usual ${fmt(fs.u)})`); }
  });
  if (m.draw > 0) chgList.push(`Borrowed ${fmt(m.draw)} from emergency fund`);
  if (S.items[sel] !== undefined) chgList.push('One-time costs edited');
  const cs = $('#chgSum'); cs.hidden = !chgList.length;
  if (chgList.length) $('#chgTxt').textContent = `Edited for ${fullLabel(sel)}: ${chgList.join(', ')}.` + (nextYm ? ` ${FULL[+nextYm.slice(5) - 1]} reverts to usual.` : '');
  $('#ledgerSub').textContent = `Tap an amount to edit it for ${fullLabel(sel)} only.` + (nextYm ? ` ${FULL[+nextYm.slice(5) - 1]} reverts to usual.` : '') + ' Tap a name to open.';
  [...IN_ROWS, ...JARROWS].forEach(r => {
    const a = $('#ra-' + r.id) || $('#h-' + r.id); if (a.tagName === 'INPUT') setIdle(a, fmt(amts[r.id])); else a.textContent = fmt(amts[r.id]);
    a.classList.toggle('zero', !amts[r.id]);
    $('#rc-' + r.id).hidden = !changed[r.id];
    const jc = $('#jcap-' + r.id); if (jc) jc.textContent = localize(r.cap) + (r.id === 'lts' ? LTS_HINT : '');
  });
  renderItems(m);

  safe(renderMonthTable, '#monthTable'); safe(() => renderGoals(m), '#goalCards'); safe(renderSettings, null, 'settings'); safe(homeView, null, 'homeView'); safe(renderBand, '#mgBand'); safe(renderHome, null, 'home'); safe(() => queueWins(false), null, 'wins'); safe(placePix, null, 'pix');
  $$('.cs').forEach(e => { e.textContent = sym(); });
  if (tab === 'goals') safe(drawRoad, '#chartbox', 'road');
  if (tab === 'receipts') safe(renderReceipts, null, 'receipts');
  if (typeof dpSync === 'function') dpSync();
}

function noteFor(f, m, v, on) {
  if (f.kind === 'goal') return goalNote(f.gid, m);
  let t = f.note ? esc(localize(f.note)) + ' ' : '';
  if (f.ends) t += on ? (v > 0 ? `Last payment ${monthLabel(f.ends)}.` : '') : 'Paid off.';
  if (f.sl && f.sl.mark) { const ceil = cfg(S, 'ceiling'); if (ceil > 0) t += (m.jar.play > ceil ? ` <b>Above the ${fmt(ceil)} ceiling.</b>` : ` Mark = ${fmt(ceil)} ceiling.`); }
  return t.trim();
}
function goalNote(gid, m) {
  const g = goalById(S, gid); if (!g) return '';
  const gi = goalInfo(S, C, gid, sel), gm = m.g[gid], tg = g.target, cap = capOf(g); let t = '';
  if (tg <= 0) return 'Set the goal amount under Plan, Goals.';
  if (gm && gm.actual < gm.planned && gm.planned > 0) t += `Needs only <b>${fmt(gm.actual)}</b> this month. `;
  if (g.due) {
    if (gi.state === 'paid') t += `Paid in ${monthLabel(dueYm(g))}.`;
    else if (gi.state === 'short') t += `Date passed ${monthLabel(dueYm(g))}. Had <b>${fmt(gi.had)}</b> of ${fmt(tg)}.`;
    else {
      t += `Due <b>${dateLabel(g.due)}</b>. `;
      if (gi.state === 'ontrack') t += `Full <b>${monthLabel(gi.reached)}</b>${gi.slack === 0 ? ', on time.' : `, ${gi.slack} month${gi.slack === 1 ? '' : 's'} early.`}` + (gi.need != null ? ` Needs about ${fmt(gi.need)} a month.` : '');
      else if (gi.state === 'behind') t += `At this pace: ${gi.reached ? 'full <b>' + monthLabel(gi.reached) + '</b>' : 'not full within ' + SPAN}. Too late.` + (gi.need != null ? ` Needs about <b>${fmt(gi.need)}</b> a month.` : '');
      else if (gi.state === 'full') t += 'Full.';
    }
  } else if (g.emergency) {
    t += gi.state === 'full' ? `Past ${fmt(tg)}${cap > tg ? `, heading to ${fmt(cap)}` : ''}.` : gi.reached ? `Reaches ${fmt(tg)} <b>${monthLabel(gi.reached)}</b>${cap > tg ? `, then continues to ${fmt(cap)}` : ''}.` : `Not at ${fmt(tg)} within ${SPAN} at this pace.`;
  } else t += gi.state === 'full' ? 'Full.' : gi.reached ? `Full <b>${monthLabel(gi.reached)}</b>.` : `Not full within ${SPAN} at this pace.`;
  if (g.emergency) {
    if (m.billsTotal > 0) t += ` ${fmt(tg)} = ${+(tg / m.billsTotal).toFixed(1)} months of necessities` + (cap > tg ? `; ${fmt(cap)} = ${+(cap / m.billsTotal).toFixed(1)}` : '') + '.';
    if (gm && gm.loan > 0) t += ` Includes ${fmt(gm.loan)} from an ended payment.`;
  }
  return t;
}

function renderGoals(m) {
  const J = jarsOf(S, m), lj = J.list.find(x => x.id === 'lts'), inc = J.income, gs = S.plan.goals;
  $('#goalsSub').textContent = gs.length ? `Goals get ${fmt(lj.v)} this month` + (inc > 0 && !J.over ? `, ${lj.pct}% of pay.` : '.') : 'No goals. Add one to see when it is reached.';
  
  $('#secRoad').hidden = !gs.length;
  gs.forEach(g => {
    const c = $('#jc-' + g.id); if (!c) return;
    const gi = goalInfo(S, C, g.id, sel), cap = capOf(g);
    const pct = cap > 0 ? Math.min(1, gi.bal / cap) : 0, gb = $('.gbar', c);
    $('#jn-' + g.id).textContent = g.name; const jw = $('#jw-' + g.id); if (jw) jw.textContent = g.why || '';
    $('.fill', gb).style.width = (pct * 100) + '%'; gb.setAttribute('aria-label', `${g.name}: ${Math.round(pct * 100)}% of ${fmt(cap)}`);
    const tick = $('.gtick', gb); if (g.emergency && cap > gi.target && gi.target > 0) { tick.style.left = `calc(${gi.target / cap * 100}% - 1px)`; tick.hidden = false; } else tick.hidden = true;
    $('#jv-' + g.id).innerHTML = gi.target > 0 ? `<b>${fmt(gi.bal)}</b> planned of ${fmt(gi.target)}` : '<b>No goal amount yet</b>';
    const js = $('#js-' + g.id); let cls = 'plain', ic = IC.clock, tx = '', note = '';
    if (gi.state === 'ontrack') { cls = 'good'; ic = IC.ok; tx = 'On track'; note = `Full ${monthLabel(gi.reached)}`; }
    else if (gi.state === 'behind') { cls = 'warn'; ic = IC.warn; tx = 'Behind'; note = gi.need != null ? `Needs ${fmt(gi.need)} a month` : 'Not ready in time'; }
    else if (gi.state === 'full') { cls = 'good'; ic = IC.ok; tx = 'Full'; }
    else if (gi.state === 'paid') { cls = 'good'; ic = IC.ok; tx = 'Paid'; note = `Due ${dateLabel(g.due)}`; }
    else if (gi.state === 'short') { cls = 'warn'; ic = IC.warn; tx = 'Short'; note = `Had ${fmt(gi.had)} of ${fmt(g.target)} by ${dateLabel(g.due)}`; }
    else if (gi.state === 'eta') { tx = 'Filling'; note = `Full ${monthLabel(gi.reached)}`; }
    else if (gi.state === 'noeta') { tx = 'Slow'; note = `Not full within ${SPAN}`; }
    else { tx = 'Unset'; note = 'Edit goal to add an amount'; }
    js.className = 'jstat ' + cls; js.innerHTML = ic + tx; $('#jt-' + g.id).textContent = note;
    const gm = m.g[g.id], put = gm.actual;
    $('#gs-' + g.id).innerHTML = `Held now: <b>${fmt(g.start)}</b>. ` + (put > 0 ? `Plan adds <b>${fmt(put)}</b> in ${monthLabel(sel, true)}.` : `Plan adds nothing in ${monthLabel(sel, true)}.`);
  });
}

function renderItems(m) {
  const list = m.items, sig = sel + '|' + list.map(i => i.id).join(',');
  $('#itemsSub').textContent = `One-time costs in ${monthLabel(sel)}. Taken from that month’s money.`;
  if (sig !== itemsSig) {
    itemsSig = sig;
    $('#items').innerHTML = list.length ? list.map(i => `<div class="item" data-id="${esc(i.id)}"><input class="txt" type="text" value="${esc(i.label)}" aria-label="Name" maxlength="60">
      <div class="inp sm"><span class="yen cs"></span><input type="number" inputmode="numeric" min="0" step="100" value="${+i.amount || 0}" aria-label="Amount"></div>
      <button type="button" class="btn small" data-del="${esc(i.id)}" aria-label="Remove ${esc(i.label)}">Remove</button>${i.note ? `<span class="nt">${esc(i.note)}</span>` : ''}</div>`).join('') : '<p class="cap">None this month.</p>';
  }
}
function readItems() {
  return $$('#items .item').map(r => {
    const id = r.dataset.id, old = (C.byYm[sel].items.find(i => i.id === id) || {});
    return { id, label: $('.txt', r).value.trim() || 'Untitled', amount: clampAmt($('input[data-mny], input[type=number]', r).value), note: old.note };
  });
}

function renderSettings() {
  SETF.forEach(f => setIdle($('#st-' + f.k), cfg(S, f.k)));
  /* the Restore box starts empty: it is for pasting a copy in. Copy text fills it when the clipboard is not allowed. */
}

function renderMonthTable() {
  const word = { good: 'On plan', tight: 'Tight', short: 'Short' }, icon = { good: IC.ok, tight: IC.warn, short: IC.bad };
  const fullIn = {}; S.plan.goals.forEach(g => { const r = C.reached[g.id]; if (g.target > 0 && r) (fullIn[r] = fullIn[r] || []).push(g); });
  const rows = C.months.map(m => {
    const st = statusOf(S, m), gs = fullIn[m.ym] || [];
    const marks = gs.map(g => `<span class="mt-g" style="--c:var(--c${g.slot})" title="${esc(g.name)} full">${HI.leaf}<span>${esc(g.name)} full</span></span>`).join('');
    return `<tr data-ym="${m.ym}" class="${m.ym === sel ? 'on' : ''}" tabindex="0" aria-label="${fullLabel(m.ym)}: ${word[st]}${gs.length ? ', ' + gs.map(g => g.name + ' full').join(', ') : ''}"><td>${monthLabel(m.ym)}${marks}</td><td class="${m.pool.left < 0 ? 'neg' : ''}">${fmt(m.pool.left)}</td><td class="${m.bankEnd < cfg(S, 'minBank') ? 'neg' : ''}">${fmt(m.bankEnd)}</td><td><span class="st ${st}">${icon[st]}<span class="stw">${word[st]}</span></span></td></tr>`;
  }).join('');
  $('#monthTable').innerHTML = `<table><thead><tr><th>Month</th><th>Left</th><th>Bank, month end</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}
