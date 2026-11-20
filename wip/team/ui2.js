
/* ---------- bar and legend (hero and dock): the six jars ---------- */
function paintBar(el, m, withLabels) {
  if (!el.children.length) el.innerHTML = JARS.map(j => `<div class="seg-b ${JARCLS[j.id]}" data-k="${j.id}" ${withLabels ? 'tabindex="0"' : ''}></div>`).join('') + `<div class="seg-b rest" data-k="rest" ${withLabels ? 'tabindex="0"' : ''}></div>`;
  const J = jarsOf(S, m), rest = J.rest, names = [];
  J.list.forEach(j => {
    const d = $(`[data-k="${j.id}"]`, el);
    d.hidden = j.v <= 0; d.style.flexGrow = Math.max(j.v, 0);
    d.dataset.tip = `<i style="--c:${JARVAR[j.id]}"></i><b>${j.name}</b> ${fmt2(j.v)}` + (J.income > 0 && !J.over ? `<br>${j.pct}% of pay` : '');
    d.setAttribute('aria-label', `${j.name} ${fmt2(j.v)}`); if (j.v > 0) names.push(`${j.name} ${fmt2(j.v)}`);
  });
  const r = $('[data-k="rest"]', el); r.hidden = rest <= 0; r.style.flexGrow = rest;
  /* the Left piece: pay with no place, what spending past plan already used of it, and borrowed money, each the model's own amount (jarsOf) */
  const tipL = [];
  if (J.unplacedNet >= 0.5) tipL.push(J.restCover > 0 || J.usedOver >= 0.5 ? `${fmt2(J.unplacedNet)} not placed yet` + (J.income > 0 ? ` (${J.restPct}% of pay)` : '') : J.income > 0 ? `${J.restPct}% of pay, not placed yet` : '');
  if (J.usedOver >= 0.5) tipL.push(`${fmt2(J.usedOver)} used for spending past plan`);
  if (J.restCover > 0) tipL.push(J.unplaced >= 0.5 ? `${fmt2(J.restCover)} borrowed from the emergency fund` : J.restKept > 0 ? 'borrowed from the emergency fund, stays in the bank' : 'borrowed money, used for spending past plan');
  r.dataset.tip = `<b>Left</b> ${fmt2(rest)}` + tipL.filter(Boolean).map(x => '<br>' + x).join(''); r.setAttribute('aria-label', `Left ${fmt2(rest)}`);
  if (rest > 0) names.push('Left ' + fmt2(rest));
  if (withLabels) el.setAttribute('aria-label', `${fmt2(J.realPay)} pay${J.draw > 0 ? ' and ' + fmt2(J.draw) + ' borrowed' : ''}, by place: ` + names.join(', '));   /* borrowed money is not pay (38.31 number gate round 2) */
}
function paintLegend(m) {
  const st0 = statusOf(S, m), J = jarsOf(S, m), has = J.income > 0 && !J.over;
  const row = (cls, name, sub, v, p, neg) => `<div class="lg${neg ? ' neg' : ''}"><i class="${cls}"></i><span>${name}${sub ? `<small>${sub}</small>` : ''}</span><b>${fmt2(v)}</b><em>${p}</em></div>`;
  $('#legend').classList.toggle('nopct', !has);
  const live = S.plan.goals.filter(g => g.target > 0 && m.g[g.id] && m.g[g.id].actual > 0).map(g => g.name);
  const ltsTag = live.length ? esc(live.slice(0, 2).join(', ') + (live.length > 2 ? ` and ${live.length - 2} more` : '')) : JARTAG.lts;
  $('#legend').innerHTML = J.list.map(j => row(JARCLS[j.id], j.name, j.id === 'lts' ? ltsTag : JARTAG[j.id], j.v, has ? j.pct + '%' : '')).join('')
    + (J.unplacedNet >= 0.5 ? row('rest', 'Not placed yet', J.restCover > 0 || J.usedOver > 0 ? 'stays in the bank' : '', J.unplacedNet, has ? J.restPct + '%' : '') : '')
    + (J.usedOver >= 0.5 ? row('rest', 'Used for spending past plan', 'came out of pay with no place', J.usedOver, has ? J.usedOverPct + '%' : '') : '')
    /* borrowed money, one row for each thing it does, each with its own name (launch checklist Q3: two rows were both named "Borrowed") */
    + (J.rest > 0 && J.restKept >= 0.005 ? row('rest', 'Borrowed, stays in the bank', 'from the emergency fund', J.restKept, '') : '')
    + (J.rest > 0 && J.restSpent >= 0.005 ? row('rest', 'Borrowed, used for spending past plan', 'from the emergency fund', J.restSpent, '') : '')
    + (J.borrowUsed >= 0.5 ? row('rest', 'Borrowed, pays for part of this plan', 'from the emergency fund', J.borrowUsed, has && J.borrowUsedPct > 0 ? J.borrowUsedPct + '%' : '') : '')
    + (J.short > 0 ? row('rest', J.draw > 0 ? 'Still over after borrowing' : st0 === 'tight' ? 'Over pay by' : 'Short by', J.draw > 0 ? fmt2(J.draw) + ' borrowed from the emergency fund' + (st0 === 'tight' ? ', your balance covers the rest' : '') : st0 === 'tight' ? 'Your balance covers it' : 'Plan exceeds pay', J.short, '', true) : '');
}
/* one plain sentence under the table: how this month's bills sit against Eker's usual split, and whether every bit of pay has a purpose */
function jarNote(m) {
  const J = jarsOf(S, m); if (J.inn <= 0) return '';
  if (J.over) return `Your plan spends ${fmt(J.exceedsBy)} more than your pay${J.draw > 0 ? `. ${fmt(J.draw)} of that comes from your emergency fund` : ''}. Lower a bill or another place.`;
  const nec = J.list[0], u = nec.usual;
  /* a plan paid partly with borrowed money: the pay is the 100, and the percent past it is the borrowed money (launch checklist Q3: never "add up to 117%") */
  const borrowed = J.borrowUsedPct > 0 ? ` Your pay is 100%. The other ${J.borrowUsedPct}% is ${fmt(J.borrowUsed)} borrowed from your emergency fund.` : '';
  const others = J.list.slice(1).some(j => j.v > 0);
  /* no bills in the plan is blank, not low: never praised as "under the usual" (38.31 number gate, wording and novice round 3) */
  if (!(nec.v > 0)) return 'No bills planned yet - add rent, food and the rest under Money out.' + borrowed;
  const lead = nec.pct >= 100 ? `Bills and basics cost more than all of your pay this month.${borrowed ? '' : ' Lower a bill or add pay.'}`   /* 38.31 north-star round 2: never calm about this */
    : nec.pct > u + 1 ? `Bills and basics are ${nec.pct}% of pay, above the usual ${u}%.${others ? ' Keep putting something in the other places, even a small amount.' : ' Nothing is left for the other places this month.'}`
    : nec.pct < u - 1 ? `Bills and basics are ${nec.pct}% of pay, under the usual ${u}%, so there's more room for the other places.`
    : `Bills and basics are ${nec.pct}% of pay, which is about the usual ${u}%.`;
  return lead + borrowed;
}
const LTS_HINT = ' Each slider sets what goes into that goal this month, so sliding up takes from Left and sliding down gives it back. If you leave them alone the amounts are worked out from each goal’s amount and date.';

/* ---------- the first-steps card ---------- */
const START_SUB = 'These are sample numbers for one salary, replace them with yours. Your data stays in this browser.';
const BASICS_SUB = 'Name, currency, balance, look, saved data.';
const MAKE_CAP = 'The amounts are samples for one salary, so start at zero or type over them. They\'re saved in this browser only and nobody else sees them, including whoever shared this page.';
const START_STEPS = [
  ['pay', 'Enter pay', 'Type your monthly take-home pay under Salary', 'Go to Salary', 'data-open="a"'],
  ['bills', 'Check bills', 'Put your real amount on each Monthly bills line, and rename, remove or add lines as you go', 'Open Monthly bills', 'data-open="nec"'],
  ['goals', 'Set up burrows', 'Give each goal a name, what it costs and a date', 'Go to Goals', 'data-tab-go="goals"'],
  ['receipts', 'Log receipts', 'Add what you spent, and set a reminder in your calendar so you keep doing it', 'Go to Receipts', 'data-tab-go="receipts"'],
];
function renderStart() {
  /* the checklist now lives on Home as a single next step; the old card stays out of sight */
  $('#start').hidden = true;
  const mine = !!S.ui.setup && !S.ui.cleared, zero = S.ui.preset === 'blank' || !!S.ui.cleared;
  $('#basicsSub').textContent = BASICS_SUB;
  $('#makeCap').textContent = mine ? 'These are your numbers and you can change them any time. They\'re saved in this browser only and nobody else sees them.' : zero ? 'Everything starts at zero, so type over it. It\'s saved in this browser only.' : MAKE_CAP;
  { const so = typeof sampleOn === 'function' && sampleOn(); ['#payBtn', '#xmBtn'].forEach(s => { const b = $(s); if (b) b.hidden = so; }); }
  { const rb = $('#bkReset'); if (rb && !rb.dataset.armed) rb.textContent = SAMPLES[(S.ui && S.ui.cur) || '₱'] ? 'Restore samples' : 'Clear my plan'; }
  $('#blankBtn').hidden = zero; { const zh = $('#zeroHint'); if (zh) zh.hidden = zero; } $('#showStart').hidden = !(S.ui.sampleHidden || S.ui.exactHidden); /* Set all to zero stays while there is anything to zero: Restore names it as the way to start over. Show first steps brings back a hidden Next card */ $('#tourOpen2').textContent = mine ? 'Tour' : 'Guided setup';
}

/* ---------- render ---------- */
function render() {
  C = calcAll(S);
  const m = C.byYm[sel], st = statusOf(S, m), floor = cfg(S, 'minBank'), mon = monthLabel(sel, true), L = m.pool.left;
  document.title = 'the burrow';
  $('#curSel').value = (S.ui && S.ui.cur) || '₱'; renderStart();
  { const nm = (S.ui && S.ui.name) || '', hr = new Date().getHours(), hi = $('#hello'); hi.hidden = !nm; hi.textContent = nm; setIdle($('#nameIn'), nm); }

  /* month picker */
  const mi = MONTHS.indexOf(sel); $('#monthSel').value = sel; { const so = $('#monthSel').selectedOptions[0]; $('#monthTxt').textContent = so ? so.textContent : ''; } $('#prevM').disabled = mi <= 0; $('#nextM').disabled = mi >= MONTHS.length - 1;
  $('#payTxt').hidden = true;

  /* hero: free to spend, then one verdict */
  const PC = planCells(S, C, sel);   /* the worked-out amounts for this screen come from the model */
  const pin = m.pool.in, play = m.jar.play, wk = weekOf(play);
  try { const mr = HV && HV.map && HV.map.month.find(r => r.id === 'play'); if (mr) BUR.roomCv($('#heroRoomW'), mr, 'play'); } catch (e) { /* the number still shows */ }
  const rs = receiptStats(S, sel), playSpent = rs.byJar.play || 0, playLeft = round2(play - playSpent), heroShow = freeOf(S, { left: m.left, bankStart: m.bankStart, bankEnd: m.bankEnd, over: m.over || 0, status: st }, { left: playLeft }).free, heroTxt = (playSpent > 0 || heroShow !== play) ? fmt2(heroShow) : fmt(heroShow);
  $('#heroNum').textContent = heroTxt; $('#heroNum').style.setProperty('--n', String(heroTxt.length)); $('#heroNum').style.color = heroShow < 0 ? 'var(--bad)' : '';
  $('#heroWk').textContent = (playSpent > 0 || heroShow !== play) ? `Planned ${fmt(play)} this month, about ${fmtAbout(wk)} a week.` : `Planned: about ${fmtAbout(wk)} a week across the whole month.`;
  $('#rcLine').innerHTML = !rs.count ? '<button type="button" class="link" data-tab-go="receipts">Log spend</button> to see what you really spent.'
    : play > 0 ? `Receipts: ${fmt2(playSpent)} spent, ${playSpent > play ? fmt2(PC.playOver) + ' over' : (m.counted > 0 ? fmt2(m.counted) + ' not spent' + (m.topup && m.topup.used > 0 ? ', ' + fmt2(m.topup.used) + ' went to a goal' : ', came back to the bank') : m.pendLeft > 0 ? fmt2(m.pendLeft) + ' not logged as spent yet, Home asks where it goes' : fmt2(playSafeLeft(S, m, playSpent)) + ' safe to spend')}. <button type="button" class="link" data-tab-go="receipts">See receipts</button>`
    : playSpent > 0 ? `Receipts: ${fmt2(playSpent)} spent from Free to spend, which has no plan this month. <button type="button" class="link" data-tab-go="receipts">See receipts</button>`
    : `Receipts: nothing spent from Free to spend. <button type="button" class="link" data-tab-go="receipts">See receipts</button>`;
  const Lun = PC.unplaced;   /* pay with no place, less what spending past plan already took from it */
  const chip = $('#chip'); chip.className = 'chip ' + st; chip.hidden = pin <= 0;
  const overFree = playSpent > play && play >= 0 && rs.count > 0, overAny = !overFree && (m.overNow || 0) > 0.004;
  if (overFree || overAny) { chip.className = 'chip short'; chip.innerHTML = IC.bad + (overFree && !((m.overNec || 0) > 0.004) ? 'Over free to spend' : 'Over plan'); }
  else if (Lun >= roundUnit(S) && st === 'good') { chip.className = 'chip tight'; chip.innerHTML = IC.warn + 'Not placed yet'; }
  else chip.innerHTML = st === 'good' ? IC.ok + 'On plan' : st === 'tight' ? IC.warn + 'Tight month' : IC.bad + 'Short';
  const gap = PC.bankGap;
  let vt;
  if (pin <= 0) vt = 'Tap Salary below and type your monthly take-home pay';
  else if (st === 'good') vt = (Lun < 0.005 ? 'All pay is placed.' :   /* exact: a small amount not placed is named, never called placed (38.31 money accuracy round 3) */ `${fmt2(Lun)} of pay not placed yet.`) + (Lun >= pin * 0.08 ? ' Raise a goal or another place to use it, or leave it where it is.' : '');
  else if (st === 'tight') vt = `This month you spend ${fmt2(PC.overPay)} more than your pay${m.draw > 0 ? ', ' + fmt2(m.draw) + ' of it borrowed' : ''}. Your balance covers it and ends at ${fmt2(m.bankEnd)}, so it doesn't go under your ${fmt2(floor)} minimum balance. You can change that in Settings.`;
  else vt = (floor > 0 ? `Balance would end at ${fmt2(m.bankEnd)}, ${fmt2(gap)} under your ${fmt2(floor)} minimum balance. You can change that in Settings.` : `Balance would end at ${fmt2(m.bankEnd)}, below zero.`) + (fixes(S, m).length ? ' Pick a fix:' : ' Lower a cost or add pay to fix it.');
  if (m.draw > 0) vt += ` ${fmt2(m.draw)} is borrowed from the emergency fund.`;
  $('#verdict').textContent = vt;
  let btns = '';
  if (st !== 'good') fixes(S, m).forEach(f => {
    btns += f.id === 'trim' ? `<button type="button" class="btn small" data-fx="trim" data-amt="${f.amount}">Spend ${fmt2(f.amount)} instead</button>`
      : `<button type="button" class="btn small" data-fx="borrow" data-amt="${f.amount}">Borrow ${fmt2(f.amount)} from emergency fund</button>`;
  });
  if (m.draw > 0) btns += '<button type="button" class="btn small" data-fx="unborrow">Undo borrow</button>';
  $('#fixBtns').innerHTML = btns;

  /* where it goes */
  $('#whereTitle').textContent = m.draw > 0 ? `${fmt2(PC.pay)} pay and ${fmt2(m.draw)} borrowed, by place` : `${fmt2(m.pool.in)} pay, by place`;
  paintBar($('#bar'), m, true); paintBar($('#dockBar'), m, false); paintLegend(m); $('#jarNote').innerHTML = jarNote(m);
  const el = $('#endline'); el.hidden = !(m.pool.out > PC.pay); if (!el.hidden) el.style.left = (PC.pay / m.pool.out * 100) + '%';   /* "Pay ends" marks the pay itself; borrowed money is not pay (38.31 north-star round 4) */
  $('#dock').hidden = tab !== 'month';   /* this line is Plan's own summary of the month picked on Plan: on Home and every other tab it is not part of the page at all (it used to sit above them, slid out of sight, and read as Home's first line) */
  const dw = m.draw || 0, Ld = PC.dock;   /* borrowed money is not pay, and pay that spending past plan already used is not left (model.js planCells) */
  const bankOnly = pin <= 0 && L >= 0 && m.bankEnd < 0;   /* spending with no pay entered: the bank shortfall still shows */
  const allPlaced = pin > 0 && !bankOnly && Math.abs(Ld) < 0.005;   /* every coin placed: say so, not "$0 not placed yet" (38.31 novice round 3) */
  const covered = Ld < 0 && dw > 0 && dw >= -Ld - 0.004;   /* more planned than pay, all of it borrowed from the emergency fund: on plan, so not alarm red (38.31 north-star round 3) */
  $('#dockNum').textContent = allPlaced ? '' : bankOnly ? fmt2(PC.bankBelowZero) : pin > 0 || L < 0 ? fmt2(PC.dockAbs) : ''; $('#dockNum').style.color = (Ld < 0 && !covered) || bankOnly ? 'var(--bad)' : covered ? 'var(--warn)' : '';
  $('#dockTxt').textContent = pin <= 0 ? (L < 0 ? 'planned with no pay entered in ' + mon + '. Add your pay in Plan.' : bankOnly ? 'below zero in the bank at the end of ' + mon + ', with no pay entered. Add your pay in Plan.' : 'No plan yet. Add your pay in Plan.') : `${Ld < 0 ? (sampleOn() && !(S.ui.done || {}).pay ? 'more planned than the sample pay in ' : 'more planned than your pay in ') + mon + (dw > 0 ? ', ' + fmt(dw) + ' borrowed from your emergency fund' : '') : (allPlaced ? (sampleOn() && !(S.ui.done || {}).pay ? 'All of the sample pay has a place in ' : 'All of your pay has a place in ') : sampleOn() && !(S.ui.done || {}).pay ? 'of the sample pay not placed yet in ' : 'of your pay not placed yet in ') + mon   /* S6: one word, "not placed yet" (38.29 glossary) */} · ${overFree && !((m.overNec || 0) > 0.004) ? 'Over free to spend' : overFree || overAny ? 'Over plan' : Ld >= roundUnit(S) && st === 'good' ? 'Place it on Plan' : st === 'good' ? 'On plan' : st === 'tight' ? 'Tight' : 'Short'}`;

  /* the details */
  $('#inTotal').textContent = fmt2(m.pool.in); $('#outTotal').textContent = fmt2(m.pool.out);
  { const oc = $('#outCounted'); const cn = m.counted || 0, tu = (m.topup && m.topup.used) || 0, tg = tu > 0 ? goalById(S, m.topup.id) : null;
    oc.hidden = !(cn > 0); if (cn > 0) oc.textContent = `${fmt2(cn)} of this month's Free to spend wasn't spent. ${tu > 0 && tg ? `${fmt2(tu)} went to ${tg.name}${cn - tu > 0.004 ? ' and ' + fmt2(m.credit) + ' came back to the bank' : ''}` : 'It came back to the bank'}, so the bank ends higher than the numbers above.`; }
  const lt = $('#leftTotal'); lt.textContent = fmt2(L); lt.classList.toggle('neg', L < 0);
  const ovr = m.over || 0;
  $('#bankLine').textContent = ovr > 0 ? `Bank ends at ${fmt2(m.bankEnd)}: ${fmt2(m.bankPlanned)} planned, less ${fmt2(ovr)} spent over plan so far.` : (Math.abs(m.bankStart - m.bankEnd) < 0.5 ? `Bank stays at ${fmt2(m.bankEnd)} this month.` : `Bank goes from ${fmt2(m.bankStart)} to ${fmt2(m.bankEnd)} this month.`);
  $('#rowDraw').hidden = !(m.draw > 0); $('#ra-draw').textContent = fmt(m.draw);
  const amts = { a: m.a, b: m.b, side: m.side, nec: m.billsTotal, items: m.itemsTotal, debts: m.debtPay, lts: m.goalsTotal, play: m.jar.play, edu: m.jar.edu, ffa: m.jar.ffa, give: m.jar.give };
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
    if (fs) { $('#kt-' + f.fid).textContent = `Edited for ${mon} only. ${nextYm ? 'Back to ' + fmt2(fs.u) + ' in ' + monthLabel(nextYm, true) + '.' : 'Usual: ' + fmt2(fs.u) + '.'}`; changed[f.row] = true; chgList.push(`${f.label} ${fmt2(fs.ov)} (usual ${fmt2(fs.u)})`); }
  });
  if (m.draw > 0) chgList.push(`Borrowed ${fmt(m.draw)} from emergency fund`);
  if (S.items[sel] !== undefined) chgList.push('One-time costs edited');
  const cs = $('#chgSum'); cs.hidden = !chgList.length;
  if (chgList.length) $('#chgTxt').textContent = `Edited for ${fullLabel(sel)}: ${chgList.join(', ')}.` + (nextYm ? ` ${FULL[+nextYm.slice(5) - 1]} goes back to normal.` : '');
  $('#ledgerSub').textContent = `Tap an amount to edit it for ${fullLabel(sel)} only.` + (nextYm ? ` ${FULL[+nextYm.slice(5) - 1]} goes back to normal.` : '') + ' Tap a name to open.';
  [...IN_ROWS, ...JARROWS].forEach(r => {
    const a = $('#ra-' + r.id) || $('#h-' + r.id); if (a.tagName === 'INPUT') setIdle(a, fmt2(amts[r.id]));   /* a typed amount shows its cents (decision 1) */ else a.textContent = fmt(amts[r.id]);
    a.classList.toggle('zero', !amts[r.id]);
    $('#rc-' + r.id).hidden = !changed[r.id];
    const jc = $('#jcap-' + r.id); if (jc && r.id !== 'debts') jc.textContent = localize(r.cap) + (r.id === 'lts' ? LTS_HINT : '');
  });
  renderItems(m);

  safe(renderMonthTable, '#monthTable'); safe(() => renderGoals(m), '#goalCards'); safe(renderDebts, '#secDebts'); safe(renderLookBack, '#rcBack'); safe(renderRecurring, '#rcRepeat'); safe(renderSettings, null, 'settings'); safe(homeView, null, 'homeView'); safe(renderBand, '#mgBand'); safe(renderHome, null, 'home'); safe(() => queueWins(false), null, 'wins'); safe(placePix, null, 'pix');
  $$('.cs').forEach(e => { e.textContent = sym(); });
  if (tab === 'goals') safe(drawRoad, '#chartbox', 'road');
  if (tab === 'receipts') safe(renderReceipts, null, 'receipts');
  if (typeof dpSync === 'function') dpSync();
}

function noteFor(f, m, v, on) {
  if (f.kind === 'goal') return goalNote(f.gid, m);
  if (f.kind === 'debt') { const d = debtById(S, f.did), x = d && m.debts[d.id]; return x ? `Minimum ${fmt(d.min)} is already included. This month it pays ${fmt(x.pay)}${x.interest > 0 ? `, ${fmt(x.interest)} of it interest` : ''}. Owed after: ${fmt(x.bal)}.` : ''; }
  let t = f.note ? esc(localize(f.note)) + ' ' : '';
  if (f.ends) t += on ? (v > 0 ? `Last payment ${monthLabel(f.ends)}.` : '') : 'Paid off.';
  if (f.sl && f.sl.mark) { const ceil = cfg(S, 'ceiling'); if (ceil > 0) t += (m.jar.play > ceil ? ` <b>Above the ${fmt(ceil)} ceiling.</b>` : ` The mark is your ${fmt(ceil)} ceiling.`); }
  return t.trim();
}
function goalNote(gid, m) {
  const g = goalById(S, gid); if (!g) return '';
  const gi = goalInfo(S, C, gid, sel), gm = m.g[gid], tg = g.target, cap = capOf(g); let t = '';
  if (tg <= 0) return 'Open Plan, then Goals, and set the goal amount';
  if (gm && gm.actual < gm.planned && gm.planned > 0) t += `Needs only <b>${fmt(gm.actual)}</b> this month. `;
  if (g.due) {
    if (gi.state === 'paid') t += `Paid in ${monthLabel(dueYm(g))}.`;
    else if (gi.state === 'short') t += `Date passed ${monthLabel(dueYm(g))}. Had <b>${fmt(gi.had)}</b> of ${fmt(tg)}.`;
    else {
      t += `Due <b>${dateLabel(g.due)}</b>. `;
      if (gi.state === 'ontrack') t += `Full <b>${monthLabel(gi.reached)}</b>${gi.slack === 0 ? ', on time.' : `, ${gi.slack} month${gi.slack === 1 ? '' : 's'} early.`}` + (gi.need != null ? ` Needs about ${fmt(gi.need)} a month.` : '');
      else if (gi.state === 'behind') t += dw(S, g, `At this pace: ${gi.reached ? 'full <b>' + monthLabel(gi.reached) + '</b>' : 'not full within ' + SPAN}. Too late.`) + (gi.need != null ? ` Needs about <b>${fmt(gi.need)}</b> a month.` : '');
      else if (gi.state === 'full') t += dw(S, g, 'Full.');
    }
  } else if (g.emergency) {
    t += gi.state === 'full' ? `Past ${fmt(tg)}${cap > tg ? `, heading to ${fmt(cap)}` : ''}.` : gi.reached ? `Reaches ${fmt(tg)} <b>${monthLabel(gi.reached)}</b>${cap > tg ? `, then continues to ${fmt(cap)}` : ''}.` : `Not at ${fmt(tg)} within ${SPAN} at this pace.`;
  } else t += dw(S, g, gi.state === 'full' ? 'Full.' : gi.reached ? `Full <b>${monthLabel(gi.reached)}</b>.` : `Not full within ${SPAN} at this pace.`);
  if (g.emergency) {
    if (m.billsTotal > 0) t += ` ${fmt(tg)} = ${+(tg / m.billsTotal).toFixed(1)} months of necessities` + (cap > tg ? `; ${fmt(cap)} = ${+(cap / m.billsTotal).toFixed(1)}` : '') + '.';
    if (gm && gm.loan > 0) t += ` Includes ${fmt(gm.loan)} from an ended payment.`;
  }
  return t;
}

function renderGoals(m) {
  const J = jarsOf(S, m), lj = J.list.find(x => x.id === 'lts'), inc = J.income, gs = S.plan.goals;
  $('#goalsSub').textContent = gs.length ? `Goals get ${fmt(lj.v)} this month` + (inc > 0 && !J.over ? `, ${lj.pct}% of pay.` : '.') : 'No burrows yet - add one to see when you\'ll reach it';
  
  $('#secRoad').hidden = !gs.length;
  gs.forEach(g => {
    const c = $('#jc-' + g.id); if (!c) return;
    const gi = goalInfo(S, C, g.id, sel), cap = capOf(g);
    const pct = gi.pct, gb = $('.gbar', c);
    $('#jn-' + g.id).textContent = g.name; const jw = $('#jw-' + g.id); if (jw) jw.textContent = g.why || '';
    $('.fill', gb).style.width = (pct * 100) + '%'; gb.setAttribute('aria-label', `${g.name}: ${gi.pctWhole}% of ${fmt(cap)}`);
    const tick = $('.gtick', gb); if (g.emergency && cap > gi.target && gi.target > 0) { tick.style.left = `calc(${gi.target / cap * 100}% - 1px)`; tick.hidden = false; } else tick.hidden = true;
    $('#jv-' + g.id).innerHTML = gi.target > 0 ? dw(S, g, `<b>${fmt(gi.bal)}</b> of ${fmt(gi.target)}`) : '<b>No goal amount yet</b>';
    const js = $('#js-' + g.id); let cls = 'plain', ic = IC.clock, tx = '', note = '';
    if (gi.state === 'ontrack') { cls = 'good'; ic = IC.ok; tx = 'On track'; note = `Full ${monthLabel(gi.reached)}`; }
    else if (gi.state === 'behind') { cls = 'warn'; ic = IC.warn; tx = 'Behind'; note = gi.need != null ? `Needs ${fmt(gi.need)} a month` : 'Not ready in time'; }
    else if (gi.state === 'full') { cls = 'good'; ic = IC.ok; tx = 'Full'; }
    else if (gi.state === 'paid') { cls = 'good'; ic = IC.ok; tx = 'Paid'; note = `Due ${dateLabel(g.due)}`; }
    else if (gi.state === 'short') { cls = 'warn'; ic = IC.warn; tx = 'Short'; note = `Had ${fmt(gi.had)} of ${fmt(g.target)} by ${dateLabel(g.due)}`; }
    else if (gi.state === 'eta') { tx = 'Filling'; note = `Full ${monthLabel(gi.reached)}`; }
    else if (gi.state === 'noeta') { tx = 'Slow'; note = `Not full within ${SPAN}`; }
    else { tx = 'Unset'; note = 'Edit goal to add an amount'; }
    tx = dw(S, g, tx); note = dw(S, g, note);
    js.className = 'jstat ' + cls; js.innerHTML = ic + tx; $('#jt-' + g.id).textContent = note;
    const gm = m.g[g.id], put = gm.actual;
    $('#gs-' + g.id).innerHTML = `${dw(S, g, 'Saved so far')}: <b>${fmt(m.balBefore && m.balBefore[g.id] !== undefined ? m.balBefore[g.id] : g.start)}</b>. ` + (put > 0 ? `Plan adds <b>${fmt2(put)}</b> in ${monthLabel(sel, true)}.` : gm.up > 0 ? '' : `Plan adds nothing in ${monthLabel(sel, true)}.`) + (gm.up > 0 ? ` <b>${fmt2(gm.up)}</b> from unspent Free to spend, as you chose.` : '') + (g.emergency && m.draw > 0 ? ` <b>${fmt(m.draw)}</b> borrowed in ${monthLabel(sel, true)}.` : '');
  });
}

function renderItems(m) {
  const list = m.items, sig = sel + '|' + list.map(i => i.id).join(',');
  $('#itemsSub').textContent = `One-time costs in ${monthLabel(sel)}, taken out of that month’s money`;
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
    return { id, label: $('.txt', r).value.trim() || 'Untitled', amount: clampAmt($('input[data-mny], input[type=number]', r).value, S), note: old.note };
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
    const bk = m.bankEnd, grew = (m.overNow || 0) > 0.004;
    const st = grew ? 'short' : statusOf(S, m), gs = fullIn[m.ym] || [];
    const marks = gs.map(g => `<span class="mt-g" style="--c:var(--c${g.slot})" title="${esc(g.name)} full">${HI.leaf}<span>${esc(g.name)} full</span></span>`).join('');
    /* the same verdict as this month's own Plan view: pay with no place is "Not placed yet", never "On plan" (38.31 novice round 4) */
    const pcm = planCells(S, C, m.ym), np = m.pool.left < 0 ? m.pool.left : pcm.unplaced;   /* the Month card's own figure: pay with no place, less what spending past plan already used (38.31 number gate round 4) */
    const unp = !grew && st === 'good' && pcm.unplaced >= roundUnit(S);
    const wd = grew ? 'Over plan' : unp ? 'Not placed yet' : word[st];
    return `<tr data-ym="${m.ym}" class="${m.ym === sel ? 'on' : ''}" tabindex="0" aria-label="${fullLabel(m.ym)}: ${wd}${gs.length ? ', ' + gs.map(g => g.name + ' full').join(', ') : ''}"><td>${monthLabel(m.ym)}${marks}</td><td class="${np < 0 ? 'neg' : ''}">${fmt2(np)}</td><td class="${bk < cfg(S, 'minBank') ? 'neg' : ''}">${fmt2(bk)}</td><td><span class="st ${unp ? 'tight' : st}">${unp ? IC.warn : icon[st]}<span class="stw">${wd}</span></span></td></tr>`;
  }).join('');
  $('#monthTable').innerHTML = `<table><thead><tr><th>Month</th><th>Not placed</th><th>Bank, month end</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}
