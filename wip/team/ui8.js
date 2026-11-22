/* ---------- Home: your burrow (step A of the bird's-eye view) ----------
   One picture and four numbers at the top of Home: where the money is, from the plan and the receipts. Visual first (Mako's rule): the pay is drawn as a strip that
   splits into its rooms with gold coins dropping onto each share, and a second strip shows where the money sits (bank or burrows). Numbers sit under the pictures.
   This month's two rooms (Bills and basics, Free to spend) are here; the burrows (goals, Education, Giving, Investing) are the next section, drawn by BUR.home.
   Every figure comes from V.map (model.js, mapOf). Until real balances arrive (pay day, a later step) the bank figure is the plan's balance at the end of the month and the page says so. */
/* what covers a plan bigger than the pay: the emergency fund first (what was borrowed), then the bank */
const coverText = (over, draw, bank, minB, below) => {
  const rest = round2(over - (draw || 0));
  return (draw > 0 ? fmt2(draw) + ' is borrowed from your emergency fund' + (rest < -0.5 ? ' and that\'s more than the gap so the extra stays in your bank' : '') + '. ' : '') + (rest <= 0.5 ? '' : bank < 0 ? 'Your bank can\'t cover ' + (draw > 0 ? 'the rest' : 'it') + ', it would end ' + fmt2(below) + ' below zero.' : bank < minB ? 'The bank covers ' + (draw > 0 ? 'the rest' : 'it') + ' but ends under your minimum.' : 'The bank covers ' + (draw > 0 ? 'the rest.' : 'the difference.'));
};
/* the four numbers stay on one line and shrink until they fit their card, so a very long amount never runs into the next card
   (38.31 layout round 3: 1,555,555,554 at 320 wide) */
function fitFour() {
  document.querySelectorAll('#hMap .mp-four b').forEach(b => {
    b.style.fontSize = ''; let fs = parseFloat(getComputedStyle(b).fontSize) || 24;
    for (let i = 0; i < 20 && b.scrollWidth > b.clientWidth + 1 && fs > 12; i++) { fs -= 1; b.style.fontSize = fs + 'px'; }
  });
}
addEventListener('resize', () => requestAnimationFrame(fitFour), { passive: true });
function renderMap() {
  const el = $('#hMap'), V = HV; if (!el) return;
  if (!V || !V.map || !(V.month.inflow > 0)) { el.hidden = true; return; }
  const M = V.map, mon = monthLabel(V.ym, true);
  /* the proof: where the money sits against where it came from, worked out apart (model.js proofOf). A miss is shown, never hidden. */
  const PF = proofOf(S, C, V.ym, M); if (!PF.ok && !renderMap.told) { renderMap.told = true; logErr('proof', new Error('numbers off by ' + PF.off + ' in ' + V.ym)); }
  el.hidden = false;
  const n = (l, v, cls) => `<li class="mp-n${cls ? ' ' + cls : ''}"><span class="mp-l">${esc(l)}</span><b>${v}</b></li>`;
  /* version one: the four numbers (Mako, 2026-11-18), each the model's own (mapOf): total, free to spend, bills left, saved */
  const n4 = (l, v, sub, cls) => `<li class="mp-n${cls ? ' ' + cls : ''}"><span class="mp-l">${esc(l)}</span><b>${v}</b><small>${esc(sub)}</small></li>`;
  const SPL = { nec: 'Bills and basics', play: 'Free to spend', edu: 'Education', give: 'Giving', ffa: 'Investing' };
  const col = id => JARVAR[id], gcol = g => `var(--c${g.slot})`;
  /* the goals share of the pay is drawn goal by goal, each in its own colour, so it matches the Goals list and the graph */
  const split = [];
  M.split.forEach(x => { if (x.id !== 'lts') split.push({ id: x.id, name: SPL[x.id], amount: x.amount, c: col(x.id) }); else M.goalParts.filter(g => g.plan > 0).forEach(g => split.push({ id: 'goal:' + g.id, name: g.name, amount: g.plan, c: gcol(g) })); });
  /* the strip always adds up to the real pay: pay the plan has not placed is its own piece, and a plan bigger than the pay says so */
  const dwn = (C && C.byYm[V.ym] && C.byYm[V.ym].draw) || 0, placed = M.placed, usedOver = M.usedOver, gapPay = M.payGap;   /* the pay strip's amounts come from the model (mapOf) */
  if (gapPay > 0.5) split.push({ id: 'unplaced', name: 'Not placed yet, stays in the bank', amount: gapPay, c: 'var(--bankc)' });
  if (usedOver > 0.5) split.push({ id: 'usedover', name: 'Used for spending past plan', amount: usedOver, c: 'var(--bad)' });
  const planOver = M.planOver;
  const seg = split.map(x => `<i class="mp-seg" data-drop="pay:${esc(x.id)}" style="flex:${x.amount};--c:${x.c}" title="${esc(x.name)} ${esc(fmt(x.amount))}"></i>`).join('');
  const key = split.map(x => `<li><i style="background:${x.c}"></i>${esc(x.name)} <b>${fmt(x.amount)}</b></li>`).join('');
  const pb = M.bankEnd > 0 ? M.bankEnd : 0;
  const BANK_END = 'Bank at month end';   /* its own name: "In your bank now" is the typed figure, this one is the plan's (H1 walk, finding 1) */
  const parts = [{ name: BANK_END, amount: pb, c: 'var(--bankc)', part: 'bank' }].concat(M.goalParts.filter(g => !g.debt).map(g => ({ name: g.name, amount: Math.max(0, g.saved), c: gcol(g), note: g.noGoal ? ' (no goal yet)' : '' }))   /* a debt goal is paid away, not a pile (LAUNCH_CHECKLIST A3) */, M.burrows.map(r => ({ name: r.name, amount: r.amount, c: col(r.id) }))).filter(x => x.amount > 0);
  const wseg = parts.map(x => `<i style="flex:${x.amount};--c:${x.c}" title="${esc(x.name)} ${esc(fmt(x.amount))}"></i>`).join('');
  const wkey = (M.bankEnd < 0 ? `<li class="mp-neg" data-part="bank"><i style="background:var(--bad)"></i>${BANK_END} <b>${fmt2(M.bankEnd)}</b> (short)</li>` : '') + parts.map(x => `<li${x.part ? ` data-part="${x.part}"` : ''}><i style="background:${x.c}"></i>${esc(x.name)} <b>${fmt2(x.amount)}</b>${x.note || ''}</li>`).join('');
  /* every Home figure says whether it is what the bank shows now or what the plan expects (LAUNCH_CHECKLIST A1) */
  const PLN = '<em class="ntag plan">planned</em>', NOW = '<em class="ntag now">now</em>';
  /* the now block, first (LAUNCH_CHECKLIST A1 and A5): the bank as typed, with its day, the cards and what is on them, and the bank after the
     cards are paid. Typed figures only, from model.js nowOf; the question to type the bank again; a card can be added or updated */
  const NW = nowOf(S), smpOn = typeof sampleOn === 'function' && sampleOn(), hasBank = NW.bank !== null && !smpOn, asking = renderMap.ask || !hasBank;
  const dayTxt = at => at ? `${+at.slice(8, 10)} ${MONTH_NAMES[+at.slice(5, 7) - 1]}${+at.slice(0, 4) !== new Date().getFullYear() ? ' ' + at.slice(0, 4) : ''}` : '';
  const ce = renderMap.card, cEdit = ce && ce !== 'new' ? NW.cards.find(k => k.id === ce) : null;
  const cardForm = ce ? `<div class="mp-ask mp-cardf"><p class="mp-now-h">${cEdit ? 'Update ' + esc(cEdit.name) : 'Add a card'}</p>
      <label for="mpCardName">Card name</label><input class="txt" id="mpCardName" type="text" maxlength="40" value="${cEdit ? esc(cEdit.name) : ''}" placeholder="Card">
      <label for="mpCardOwed">What's on the card now</label><p class="cap">Open the card's app and type the full amount it shows, not only the minimum.</p><div class="inp"><span class="yen cs">${esc(sym())}</span><input id="mpCardOwed" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="${cEdit ? esc(String(cEdit.owed)) : ''}"></div>
      <label for="mpCardDay">Day of the month you pay it</label><input class="txt" id="mpCardDay" type="number" inputmode="numeric" min="1" max="31" step="1" placeholder="10" value="${cEdit && cEdit.payDay ? cEdit.payDay : ''}">
      <div class="mp-askrow"><button type="button" class="btn solid small" id="mpCardSave">Save</button><button type="button" class="btn small" id="mpCardNo">Cancel</button>${cEdit ? '<button type="button" class="btn small" id="mpCardDel">Remove</button>' : ''}</div></div>` : '';
  const cardRows = NW.cards.length && !smpOn ? `<ul class="mp-cards">${NW.cards.map(k => `<li><span><b>${esc(k.name)}</b>: ${fmt2(k.owed)} on it${k.payDay ? `, paid on the ${ordinal(k.payDay)}` : ''}${k.at ? ` <small>(entered ${dayTxt(k.at)})</small>` : ''}</span><button type="button" class="link" data-card="${esc(k.id)}">Update</button></li>`).join('')}</ul>
      ${hasBank ? `<p class="mp-after">What's on the cards is already spent. Bank after the cards are paid: <b class="${NW.afterCards < 0 ? 'bad' : ''}">${fmt2(NW.afterCards)}</b></p>` : ''}` : '';
  const playRoom = (M.month || []).find(r => r.id === 'play'), notSafe = hasBank && playRoom && playRoom.notCovered;   /* QC10 numbers blocker 3 */
  const nowCard = `<div class="mp-now"><p class="mp-now-h">In your bank ${NOW}</p>${hasBank ? `<b class="mp-now-v${NW.bank < 0 ? ' bad' : ''}">${fmt2(NW.bank)}</b>${NW.bankAt ? `<p class="cap mp-fresh">Balance you entered on ${dayTxt(NW.bankAt)}</p>` : ''}` : ''}
    ${asking ? `<div class="mp-ask"><label for="mpBankIn">What does your bank app show today?</label><p class="cap">Open your bank app and type the balance it shows, plus any cash you keep at home.</p>
      <div class="mp-askrow"><div class="inp"><span class="yen cs">${esc(sym())}</span><input id="mpBankIn" type="number" inputmode="text" data-neg="ok" step="any" placeholder="${hasBank ? esc(NW.bank.toLocaleString('en-US', { maximumFractionDigits: 2 })) : '0'}" value=""></div><button type="button" class="btn solid small" id="mpBankSave">Save</button></div>${hasBank ? '<button type="button" class="link" id="mpBankNo">Keep the old balance</button>' : ''}</div>` : ''}
    ${cardRows}${hasBank && !smpOn && playRoom && playRoom.nowBelow ? `<p class="mp-after">Your bank${playRoom.nowCards ? ' after the cards are paid' : ''} is below zero today${notSafe ? ', so Free to spend is planned, not safe to spend yet' : ''}. Wait for pay before spending.</p>` : notSafe ? `<p class="mp-after">Your bank${NW.cards.length ? ' after the cards' : ''} is less than your bills still to pay and Free to spend, so Free to spend is planned, not safe to spend yet.</p>` : ''}${cardForm}
    ${!asking || !ce ? `<p class="mp-act">${asking ? '' : '<button type="button" class="btn small" id="mpCheck">Check your bank</button>'}${ce || smpOn ? '' : ` <button type="button" class="btn small" id="mpCardAdd">${NW.cards.length ? 'Add another card' : 'Add a card you pay in full'}</button>`}</p>` : ''}</div>`;
  /* the bank and card boxes carry the currency sign as they are drawn: this HTML is put in after the page fills its .cs spans (QC round 8 north-star gate 4) */
  /* what is owed, in one line, only when something is (A4) */
  const oweLine = M.owed > 0 ? `<p class="cap mp-owe">You owe ${fmt2(M.owed)} at the end of ${esc(mon)} ${PLN}: cards, loans and debt burrows.</p>` : '';
  const smp = '';   /* the one sample notice is the status line at the top of Home */
  const minB = cfg(S, 'minBank'), warn = !(M.bankEnd < minB) ? '' : M.bankEnd < 0 ? `<p class="mp-warn" role="status">Your bank would end ${fmt2(M.bankBelow)} below zero in ${esc(mon)}. ${(() => { const z = (V.month && V.month.belowZero) || {}, why = [];   /* only the causes the model knows: a start below zero is not "a plan bigger than pay" (38.31 money accuracy round 4) */ if (z.startBelow > 0) why.push(`It starts the month ${fmt2(z.startBelow)} below zero.`); if (z.planGap > 0) why.push('Your plan is bigger than your pay.'); if (M.overspent > 0) why.push('You\'ve spent more than you planned.'); return why.join(' ') || 'Open Plan to see the month.'; })()} ${(() => { const pl = (M.month || []).find(x => x.id === 'play'); return pl && pl.amount > 0.004 ? `Keep Free to spend to the ${fmt2(pl.amount)} shown, or open Plan to pick a fix.` : 'Don\'t spend any more from Free to spend until you check your plan.'; })()}${(((M.month || []).find(x => x.id === 'play') || {}).planned > 0) ? ' This counts your planned Free to spend as already spent.' : ''}</p>`   /* only when some is planned (QC round 7 money accuracy polish 2) */ : `<p class="mp-warn" role="status">Your bank ends at ${fmt2(M.bankEnd)} in ${esc(mon)}, under your minimum balance of ${fmt(minB)}. ${(() => { const pl = (M.month || []).find(x => x.id === 'play'); return pl && pl.amount < pl.planned - 0.5 ? 'Free to spend is lowered to match.' : 'Open Plan to pick a fix.'; })()}</p>`;
  put(el, `<h2 class="hb-h">Your burrow${typeof sampleOn === 'function' && sampleOn() ? ' <span class="smp-tag">Sample numbers</span>' : ''}</h2><p class="cap hb-what">Where your money is. Your bank now, then this month, then your burrows.</p>${smp}
    ${nowCard}
    <h3 class="mp-h">This month ${PLN}</h3><div class="hb-scene mp-rooms" id="mpRooms"></div>
    <details class="mp-pay"${renderMap.payOpen ? ' open' : ''}><summary class="mp-cap">Your pay in ${esc(mon)}, and where it goes</summary>
    <div class="mp-split" role="img" aria-label="Your pay in ${esc(mon)} splits into: ${esc(split.map(x => x.name + ' ' + fmt(x.amount)).join(', '))}">${seg}${planOver && placed > 0 ? `<b class="mp-past" style="width:${Math.min(100, planOver / placed * 100)}%" title="Planned past your pay ${esc(fmt(planOver))}"></b>` : ''}</div>
    <ul class="mp-key">${key}${planOver ? `<li><i style="background:var(--bad)"></i>Past your pay <b>${fmt(planOver)}</b></li>` : ''}</ul>${planOver ? `<p class="cap">Your plan is ${fmt(planOver)} more than your pay. ${coverText(planOver, dwn, M.bankEnd, cfg(S, 'minBank'), M.bankBelow)}</p>` : ''}
    <p class="mp-act"><button type="button" class="btn small" id="mpPay">Watch where your pay goes</button></p></details>
    <p class="mp-cap mp-where-h">Where your money sits at the end of ${esc(mon)}: the bank and your <span class="ntag-keep">burrows ${PLN}</span></p>
    <div class="mp-where" role="img" aria-label="${esc(parts.map(x => x.name + ' ' + fmt(x.amount)).join(', '))}">${wseg}</div>
    <ul class="mp-key">${wkey}</ul><p class="cap mp-from" data-planfrom>${BANK_END} is planned from ${fmt2(V.month.bankStart)}, the balance your plan starts ${esc(mon)} with.${hasBank && (NW.bank !== V.month.bankStart || NW.cards.length) ? ` Your bank now is ${fmt2(NW.bank)}${NW.cards.length ? `, ${fmt2(NW.afterCards)} after the cards are paid` : ''}${(NW.cards.length ? NW.afterCards : NW.bank) !== V.month.bankStart ? ', so the two can differ' : ''}.` : ''}</p>${oweLine}
    <ul class="mp-nums mp-four" aria-label="Your four numbers">${n4('Total', fmt2(M.total), 'planned for the end of ' + mon + ': bank and burrows', M.total < 0 ? 'bad' : '')}${(M.free < 0 ? n4('Free to spend', fmt2(M.month.find(r => r.id === 'play').overBy), 'over in ' + mon   /* "¥5,000 over", no minus with the word over (38.31 number gate round 8, finding 2) */   /* spent past the plan already: real money, so not called planned */, 'bad') : (playRoom && playRoom.held > 0 ? n4('Free to spend', fmt2(playRoom.planLeft), 'planned: left in ' + mon + ', ' + fmt2(playRoom.amount) + ' safe to spend')   /* part is held back for the minimum: the planned figure stays on Home (QC round 10 money accuracy blocker 1) */ : n4('Free to spend', fmt2(M.month.find(r => r.id === 'play').amount), ((M.month.find(r => r.id === 'play') || {}).notCovered ? 'planned: left in ' + mon + ', not safe to spend yet' : 'planned: left to spend in ' + mon))   /* what is left, not the monthly plan (QC10 round 3 numbers blocker 1) */))   /* one figure, as the chest below shows it (38.31 north-star round 2) */}${n4('Bills left', fmt2(M.billsLeft), 'planned: still to pay in ' + mon)}${n4('Saved', fmt2(M.saved), 'planned: what your burrows will hold by the end of ' + mon + ', with this month\'s saving')}</ul>
    <p class="cap mp-proof">Bank ${fmt2(M.bankEnd)} + burrows ${fmt2(M.saved)} = <b>${fmt2(M.total)}</b> at the end of ${esc(mon)}.${PF.pendAmount > 0 ? ' ' + fmt2(PF.pendAmount) + ' of Free to spend is left out until you answer' + (typeof SWEEP_LATER !== 'undefined' && SWEEP_LATER && PF.pendMonths.every(q => SWEEP_LATER[q]) ? ' and Home asks again next time.' : (() => { const eg = typeof stretchAsk === 'function' ? stretchAsk() : null; return eg ? ` the month-end question, which comes after the ${esc(eg.name)} question on Home.` : ' the question on Home.'; })()) : ''}</p>
    ${PF.ok ? '' : `<p class="cap mp-bad" role="alert">These numbers do not add up. They are off by ${fmt2(PF.offBy)}. Nothing you entered is lost. Please tell Mako.</p>`}
    ${warn}`);
  { const ck = $('#mpCheck'); if (ck) ck.onclick = () => { renderMap.ask = true; sfx('tap'); renderMap(); const i = $('#mpBankIn'); if (i) i.focus(); };
    const no = $('#mpBankNo'); if (no) no.onclick = () => { renderMap.ask = false; renderMap(); };
    const sv = $('#mpBankSave'), inp = $('#mpBankIn');
    if (sv && inp) { /* the box opens empty with the balance as its grey hint (a filled box turned 1200 plus a typed 1150 into 12001150); saving it empty keeps that balance, checked today */
      const go = () => { const keep = inp.value === '' && hasBank && !(inp.validity && inp.validity.badInput); if (!keep && (inp.value === '' || !isFinite(+inp.value))) { cheer('Type the balance your bank app shows, in numbers'); inp.focus(); return; } renderMap.ask = false; ACT.setBankNow(keep ? NW.bank : inp.value); sfx('tap'); cheer((keep ? 'Kept: ' + fmt2(nowOf(S).bank) + ' in your bank, checked today.' : 'Bank updated: ' + fmt2(nowOf(S).bank) + ' today.') + (smpOn ? ' It shows here once you use your own numbers.' : '')); };
      sv.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; } }
  { const ad = $('#mpCardAdd'); if (ad) ad.onclick = () => { renderMap.card = 'new'; renderMap(); const i = $('#mpCardName'); if (i) i.focus(); const sv = $('#mpCardSave'); if (sv) sv.scrollIntoView({ block: 'nearest' }); };   /* Save in sight too, clear of the Help strip and an Undo bar */
    el.querySelectorAll('[data-card]').forEach(b => { b.onclick = () => { renderMap.card = b.dataset.card; renderMap(); const i = $('#mpCardOwed'); if (i) i.focus(); }; });
    const cn = $('#mpCardNo'); if (cn) cn.onclick = () => { renderMap.card = null; renderMap(); };
    const cd = $('#mpCardDel'); if (cd) cd.onclick = () => { const id = renderMap.card; renderMap.card = null; ACT.removeCard(id); cheer('Card removed'); };
    const cs = $('#mpCardSave'); if (cs) cs.onclick = () => { const o = $('#mpCardOwed'), dy = $('#mpCardDay'), nm = $('#mpCardName');
      if (o.value === '' || !isFinite(+o.value) || +o.value < 0) { cheer('Type what\'s on the card now, in numbers'); o.focus(); return; }
      const pd = dy.value === '' ? null : Math.round(+dy.value); if (pd !== null && !(pd >= 1 && pd <= 31)) { cheer('Type the day of the month you pay it, 1 to 31'); dy.focus(); return; }
      const id = renderMap.card === 'new' ? null : renderMap.card; renderMap.card = null; ACT.setCard(id, { name: nm.value, owed: o.value, payDay: pd }); sfx('tap'); cheer('Card saved'); }; }
  { const dp = el.querySelector('.mp-pay'); if (dp) dp.ontoggle = () => { renderMap.payOpen = dp.open; }; }
  requestAnimationFrame(fitFour);
  BUR.dropCoins(el.querySelector('.mp-split'));
  const pb2 = $('#mpPay'); if (pb2) pb2.onclick = () => payDay({ pay: (M.payReal || dwn > 0) ? M.payReal : placed,   /* model.js mapOf payReal (the screen's own realPay was moved there and this line was missed) */ over: planOver, draw: dwn, bank: M.bankEnd, below: M.bankBelow, minB: cfg(S, 'minBank'), mon, places: split });
  BUR.monthRooms($('#mpRooms'));
}

/* ---------- Pay day: your pay as gold coins that fall from the purse into each place (Mako's visual-first rule) ----------
   For now it replays the plan: every coin of this month's pay lands in the place the plan gives it, the amount counting up and the pile growing as the coins arrive.
   Step B makes it the real thing (the paycheck is entered here and each coin is recorded). Quiet when the person asks for less motion: it shows the end at once. */
function payDay(o) {
  let ov = $('#pdv');
  if (!ov) { ov = document.createElement('div'); ov.id = 'pdv'; ov.className = 'pdv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Pay day'); document.body.appendChild(ov); }
  const total = o.places.reduce((a, x) => a + x.amount, 0) || 1, maxA = Math.max(...o.places.map(x => x.amount), 1);
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  ov.innerHTML = `<div class="pdv-in"><h2>Pay day</h2><p class="cap pdv-sub">${typeof sampleOn === 'function' && sampleOn() ? '<span class="smp-tag">Sample numbers</span> Sample pay of <b>' + esc(fmt(o.pay)) + '</b> in ' + esc(o.mon) + ', enter your pay to see yours. Each coin' : 'Your pay of <b>' + esc(fmt(o.pay)) + '</b> in ' + esc(o.mon) + '. Each coin'} goes where your plan sends it.${o.over ? ' Your plan is ' + esc(fmt(o.over)) + ' more than your pay. ' + esc(coverText(o.over, o.draw, o.bank, o.minB, o.below)) : ''}</p>
    <div class="pdv-stage" id="pdvStage"><div class="pdv-purse"><b>${esc(fmt(o.pay))}</b><canvas width="24" height="18" aria-hidden="true"></canvas></div>
    <div class="pdv-row">${o.places.map((x, i) => `<div class="pdv-room" data-i="${i}"><canvas width="24" height="18" aria-hidden="true"></canvas><i class="pdv-dot" style="background:${x.c}"></i><span class="pdv-n">${esc(x.name)}</span><b class="pdv-a">${esc(fmt(0))}</b></div>`).join('')}</div></div>
    <p class="pdv-done" id="pdvDone" aria-live="polite"></p><div class="pdv-btns">${typeof sampleOn === 'function' && sampleOn() ? '<button type="button" class="btn small" id="pdvEnter">Enter pay</button>' : ''}<button type="button" class="btn small" id="pdvAgain">Watch again</button><button type="button" class="btn small solid" id="pdvClose">Done</button></div></div>`;
  ov.hidden = false; document.body.classList.add('pdv-on');
  const stage = $('#pdvStage'), purse = ov.querySelector('.pdv-purse canvas'), rooms = [...ov.querySelectorAll('.pdv-room')];
  /* the pay purse has a picture of its own, used nowhere else: a tied leather pouch with one coin showing; goals use the same hill burrow as Home */
  const paintPurse = (cv, full) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 24, 18); const B = PAL.bark, G = PAL.gold, px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); }, row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); };
    if (!full) { row(16, 7, 16, B[0]); return; }
    row(16, 6, 17, B[0]); for (let y = 8; y <= 15; y++) { const w = 3 + Math.round(Math.sin((y - 8) / 7 * Math.PI) * 3) + (y > 11 ? 1 : 0), x0 = 12 - w - 2, x1 = 11 + w + 2; row(y, x0, x1, B[0]); row(y, x0 + 1, x1 - 1, B[3]); px(x0 + 1, y, B[4]); px(x0 + 2, y, B[4]); px(x1 - 1, y, B[2]); }
    row(7, 9, 14, B[0]); row(6, 8, 15, B[0]); row(6, 9, 14, B[2]); row(7, 10, 13, B[1]);   /* the gathered neck */
    row(8, 8, 15, G[1]); px(11, 8, G[3]); px(12, 8, G[3]);                                 /* the tie */
    for (let y = 3; y <= 5; y++) row(y, 10, 13, y === 3 ? B[0] : B[1]); px(11, 4, G[3]); px(12, 4, G[4]); px(11, 5, G[2]); px(12, 5, G[2]);   /* a coin peeking out */ };
  const paint = (cv, fill, kind, seed) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 24, 18); if (kind === 'goal') BUR.LOOKS.plain.paint(g, fill, 0, null, false, seed); else BUR.LOOKS.room.paint(g, fill, kind, seed); };
  const kindOf = x => /^goal:/.test(x.id) ? 'goal' : x.id;
  const shown = o.places.map(() => 0);
  const draw = (i, landed, n) => { const x = o.places[i], _s = (shown[i] = n ? x.amount * landed / n : x.amount), _l = Math.max(0, o.pay - shown.reduce((a, b) => a + b, 0)); if (n && landed) purse.parentElement.querySelector('b').textContent = fmt(_l) + ' left'; const fill = Math.sqrt(x.amount / maxA) * (n ? landed / n : 1); paint(rooms[i].querySelector('canvas'), landed ? Math.max(fill, .12) : 0, kindOf(x), 7 + i * 13); rooms[i].querySelector('.pdv-a').textContent = fmt(n ? x.amount * landed / n : x.amount); };
  paintPurse(purse, true);
  const finish = () => { rooms.forEach((r, i) => draw(i, 1, 1)); const shortBy = o.over > 0 ? fmt(o.over) : '', un = o.places.find(x => x.id === 'unplaced'), doneTxt = shortBy ? 'Your plan is ' + shortBy + ' bigger than your pay.' + ' ' + coverText(o.over, o.draw, o.bank, o.minB, o.below) : un ? fmt2(un.amount) + ' of your pay is not placed yet and stays in the bank.' : 'Every coin has a home.'; $('#pdvDone').textContent = doneTxt; $('#pdvDone').setAttribute('aria-label', doneTxt + ' ' + o.places.map(x => `${x.name} ${fmt(x.amount)}`).join(', ') + '.'); purse.parentElement.classList.add('empty'); purse.parentElement.querySelector('b').textContent = shortBy ? shortBy + ' short' : un ? fmt(un.amount) + ' not placed' : fmt(0) + ' left'; paintPurse(purse, false); };
  let raf = 0, run = 0;
  const close = () => { run++; cancelAnimationFrame(raf); ov.hidden = true; document.body.classList.remove('pdv-on'); ov.querySelectorAll('.pdv-coin').forEach(c => c.remove()); document.removeEventListener('keydown', esc_); const b = $('#mpPay'); if (b) b.focus(); };
  const esc_ = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc_);
  $('#pdvClose').onclick = close; $('#pdvClose').focus();
  { const en = $('#pdvEnter'); if (en) en.onclick = () => { close(); try { openRow('a'); } catch (e) { } }; }
  const play = () => {
    const id = ++run; cancelAnimationFrame(raf); ov.querySelectorAll('.pdv-coin').forEach(c => c.remove()); $('#pdvDone').textContent = ''; purse.parentElement.classList.remove('empty'); purse.parentElement.querySelector('b').textContent = fmt(o.pay); paintPurse(purse, true);
    if (calm) { finish(); return; }
    const sr = stage.getBoundingClientRect(), pr = purse.getBoundingClientRect(), url = BUR.coinUrl();
    const sx = pr.left + pr.width / 2 - sr.left - 9, sy = pr.top + pr.height * .8 - sr.top;
    const plan = []; o.places.forEach((x, i) => { const n = Math.max(3, Math.min(9, Math.round(x.amount / total * 28))); const rr = rooms[i].getBoundingClientRect(); for (let k = 0; k < n; k++) plan.push({ i, k, n, tx: rr.left + rr.width / 2 - sr.left - 9 + ((k % 3) - 1) * 6, ty: rr.top - sr.top + 20 }); });
    /* interleave so every place gets coins from the start, not one place at a time */
    plan.sort((a, b) => a.k - b.k || a.i - b.i);
    const landed = o.places.map(() => 0), T0 = performance.now(), GAP = 90, FLY = 1000;
    plan.forEach((c, j) => { const el = document.createElement('i'); el.className = 'pdv-coin'; el.style.backgroundImage = `url(${url})`; el.style.opacity = '0'; stage.appendChild(el); c.el = el; c.t = j * GAP; c.done = false; });
    const step = now => {
      if (id !== run) return; const t = now - T0; let left = 0;
      plan.forEach(c => {
        if (c.done) return; const u = (t - c.t) / FLY; if (u < 0) { left++; return; }
        if (u >= 1) { c.done = true; c.el.remove(); landed[c.i]++; draw(c.i, landed[c.i], c.n); if ((landed[c.i] + c.i) % 2 === 0) { try { sfx('coin'); } catch (e) { /* quiet */ } } return; }
        left++; const e = u * u * (3 - 2 * u), q = v => Math.round(v / 4) * 4;
        c.el.style.opacity = '1'; c.el.style.transform = `translate(${q(sx + (c.tx - sx) * e)}px, ${q(sy + (c.ty - sy) * u - Math.sin(u * Math.PI) * 26)}px)`;
      });
      if (left) raf = requestAnimationFrame(step); else finish();
    };
    rooms.forEach((r, i) => draw(i, 0, 1)); rooms.forEach((r, i) => { r.querySelector('.pdv-a').textContent = fmt(0); });
    raf = requestAnimationFrame(step);
  };
  $('#pdvAgain').onclick = play; setTimeout(play, 250);
}
