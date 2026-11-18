/* ---------- Home: your burrow (step A of the bird's-eye view) ----------
   One picture and four numbers at the top of Home: where the money is, from the plan and the receipts. Visual first (Mako's rule): the pay is drawn as a strip that
   splits into its rooms with gold coins dropping onto each share, and a second strip shows where the money sits (bank or burrows). Numbers sit under the pictures.
   This month's two rooms (Bills and basics, Free to spend) are here; the burrows (goals, Education, Giving, Investing) are the next section, drawn by BUR.home.
   Every figure comes from V.map (model.js, mapOf). Until real balances arrive (pay day, a later step) the bank figure is the plan's balance at the end of the month and the page says so. */
/* what covers a plan bigger than the pay: the emergency fund first (what was borrowed), then the bank */
const coverText = (over, draw, bank, minB, below) => {
  const rest = round2(over - (draw || 0));
  return (draw > 0 ? fmt2(draw) + ' is borrowed from your emergency fund' + (rest < -0.5 ? ' (more than the gap, the extra stays in your bank)' : '') + '. ' : '') + (rest <= 0.5 ? '' : bank < 0 ? 'Your bank cannot cover ' + (draw > 0 ? 'the rest' : 'it') + ': it would end ' + fmt2(below) + ' below zero.' : bank < minB ? 'The bank covers ' + (draw > 0 ? 'the rest' : 'it') + ' but ends under your minimum.' : 'The bank covers ' + (draw > 0 ? 'the rest.' : 'the difference.'));
};
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
  const parts = [{ name: 'In the bank', amount: pb, c: 'var(--bankc)' }].concat(M.goalParts.map(g => ({ name: g.name, amount: Math.max(0, g.saved), c: gcol(g) })), M.burrows.map(r => ({ name: r.name, amount: r.amount, c: col(r.id) }))).filter(x => x.amount > 0);
  const wseg = parts.map(x => `<i style="flex:${x.amount};--c:${x.c}" title="${esc(x.name)} ${esc(fmt(x.amount))}"></i>`).join('');
  const wkey = (M.bankEnd < 0 ? `<li class="mp-neg"><i style="background:var(--bad)"></i>In the bank <b>${fmt2(M.bankEnd)}</b> (short)</li>` : '') + parts.map(x => `<li><i style="background:${x.c}"></i>${esc(x.name)} <b>${fmt2(x.amount)}</b></li>`).join('');
  const smp = '';   /* the one sample notice is the status line at the top of Home */
  const minB = cfg(S, 'minBank'), warn = !(M.bankEnd < minB) ? '' : M.bankEnd < 0 ? `<p class="mp-warn" role="status">Your bank would end ${fmt2(M.bankBelow)} below zero in ${esc(mon)}. ${M.overspent > 0 ? 'Spending is past what you planned.' : 'Your plan is bigger than your pay.'} Spend nothing more from Free to spend until you check your plan.</p>` : `<p class="mp-warn" role="status">Your bank ends at ${fmt2(M.bankEnd)} in ${esc(mon)}, under your safety minimum of ${fmt(minB)}. ${(() => { const pl = (M.month || []).find(x => x.id === 'play'); return pl && pl.amount < pl.planned - 0.5 ? 'Free to spend is lowered to match.' : 'Open Plan to pick a fix.'; })()}</p>`;
  put(el, `<h2 class="hb-h">Your burrow${typeof sampleOn === 'function' && sampleOn() ? ' <span class="smp-tag">Sample numbers</span>' : ''}</h2><p class="cap hb-what">Where your money is. This month's money is below, your burrows after it.</p>${smp}
    <details class="mp-pay"${renderMap.payOpen ? ' open' : ''}><summary class="mp-cap">Your pay in ${esc(mon)}, and where it goes</summary>
    <div class="mp-split" role="img" aria-label="Your pay in ${esc(mon)} splits into: ${esc(split.map(x => x.name + ' ' + fmt(x.amount)).join(', '))}">${seg}${planOver && placed > 0 ? `<b class="mp-past" style="width:${Math.min(100, planOver / placed * 100)}%" title="Planned past your pay ${esc(fmt(planOver))}"></b>` : ''}</div>
    <ul class="mp-key">${key}${planOver ? `<li><i style="background:var(--bad)"></i>Past your pay <b>${fmt(planOver)}</b></li>` : ''}</ul>${planOver ? `<p class="cap">Your plan places ${fmt(planOver)} more than your pay. ${coverText(planOver, dwn, M.bankEnd, cfg(S, 'minBank'), M.bankBelow)}</p>` : ''}
    <p class="mp-act"><button type="button" class="btn small" id="mpPay">Watch where your pay goes</button></p></details>
    <p class="mp-cap">Where your money sits at the end of ${esc(mon)}: the bank, your goals and your burrows</p>
    <div class="mp-where" role="img" aria-label="${esc(parts.map(x => x.name + ' ' + fmt(x.amount)).join(', '))}">${wseg}</div>
    <ul class="mp-key">${wkey}</ul>
    <ul class="mp-nums mp-four" aria-label="Your four numbers">${n4('Total', fmt2(M.total), 'bank and burrows, end of ' + mon, M.total < 0 ? 'bad' : '')}${n4('Free to spend', fmt2(M.month.find(r => r.id === 'play').amount), 'safe to spend in ' + mon)}${n4('Bills left', fmt2(M.billsLeft), 'still to pay in ' + mon)}${n4('Saved', fmt2(M.saved), 'in your burrows')}</ul>
    <p class="cap mp-proof">Bank ${fmt2(M.bankEnd)} + burrows ${fmt2(M.saved)} = <b>${fmt2(M.total)}</b> at the end of ${esc(mon)}. Burrow amounts include what you plan to add this month.${PF.pendAmount > 0 ? ' ' + fmt2(PF.pendAmount) + (PF.pendMonths.length === 1 ? ' of ' + FULL[+PF.pendMonths[0].slice(5) - 1] + "'s free to spend" : ' of free to spend from ' + PF.pendMonths.length + ' past months') + (typeof SWEEP_LATER !== 'undefined' && SWEEP_LATER && PF.pendMonths.every(q => SWEEP_LATER[q]) ? ' is left out until you answer. You chose Decide later, so Home asks again the next time you open the app.' : ' is left out until you answer the question on Home.') : ''}${M.overspent > 0 ? ' The bank is lowered by ' + fmt2(M.overspent) + ' you spent over plan.' : ''} This comes from your plan and your receipts and is not checked against your bank yet.${PF.ok ? ' Checked: what you started with, plus your pay, less what was spent, comes to the same total.' : ''}</p>
    ${PF.ok ? '' : `<p class="cap mp-bad" role="alert">These numbers do not add up. They are off by ${fmt2(PF.offBy)}. Nothing you entered is lost. Please tell Mako.</p>`}
    ${warn}
    <h3 class="mp-h">This month</h3><div class="hb-scene mp-rooms" id="mpRooms"></div>`);
  { const dp = el.querySelector('.mp-pay'); if (dp) dp.ontoggle = () => { renderMap.payOpen = dp.open; }; }
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
  ov.innerHTML = `<div class="pdv-in"><h2>Pay day</h2><p class="cap pdv-sub">${typeof sampleOn === 'function' && sampleOn() ? '<span class="smp-tag">Sample numbers</span> Sample pay of <b>' + esc(fmt(o.pay)) + '</b> in ' + esc(o.mon) + '. Enter your pay to see yours. Each coin' : 'Your pay of <b>' + esc(fmt(o.pay)) + '</b> in ' + esc(o.mon) + '. Each coin'} goes where your plan sends it.${o.over ? ' Your plan places ' + esc(fmt(o.over)) + ' more than your pay. ' + esc(coverText(o.over, o.draw, o.bank, o.minB, o.below)) : ''}</p>
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
  const finish = () => { rooms.forEach((r, i) => draw(i, 1, 1)); const shortBy = o.over > 0 ? fmt(o.over) : '', un = o.places.find(x => x.id === 'unplaced'), doneTxt = shortBy ? 'Your plan is ' + shortBy + ' bigger than your pay.' + ' ' + coverText(o.over, o.draw, o.bank, o.minB, o.below) : un ? fmt2(un.amount) + ' of your pay has no goal yet and stays in the bank.' : 'Every coin has a home.'; $('#pdvDone').textContent = doneTxt; $('#pdvDone').setAttribute('aria-label', doneTxt + ' ' + o.places.map(x => `${x.name} ${fmt(x.amount)}`).join(', ') + '.'); purse.parentElement.classList.add('empty'); purse.parentElement.querySelector('b').textContent = shortBy ? shortBy + ' short' : un ? fmt(un.amount) + ' not placed' : fmt(0) + ' left'; paintPurse(purse, false); };
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
