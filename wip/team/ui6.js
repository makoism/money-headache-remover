
/* ===== HOME: the first screen after setup =====
   Order follows what people open the page for: log a receipt, see the next goal win, see free to spend left, keep the weekly streak.
   Everything on this screen reads the same plan as the other tabs. Nothing here is stored except the streak weeks, milestones and badges. */
const nowYm = () => { const d = new Date(), ym = d.getFullYear() + '-' + pad2(d.getMonth() + 1); return ym < START ? START : ym > END ? END : ym; };
setCurYm(nowYm);
const ymd = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
/* the Monday of the week a date falls in, as YYYY-MM-DD */
const wkOf = d => { const t = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return ymd(t); };
const wkAdd = (k, n) => { const t = new Date(k + 'T12:00:00'); t.setDate(t.getDate() + 7 * n); return ymd(t); };
const HI = {
  leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.6 19.4C4.4 11 10.2 4.8 20.2 4.2c.3 9.6-5.4 15.5-15.6 15.2z"/><path d="M5.8 18.2C9 13.4 12.6 9.6 18 6.6" fill="none" stroke="var(--bg)" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/><path d="M4.6 19.4L2.6 21.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l7.2 2.6v5.8c0 4.3-2.9 7.6-7.2 9.6-4.3-2-7.2-5.3-7.2-9.6V5.4z"/><path d="M8.6 11.8l2.5 2.5 4.4-4.9" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2.8h12v18.4l-2.4-1.6L13.2 21l-2.4-1.4L8.4 21 6 19.6z"/><path d="M9 8h6M9 11.5h6M9 15h3.5" stroke="var(--bg)" stroke-width="1.7" stroke-linecap="round"/></svg>',
  coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.3" fill="currentColor"/><path d="M12 6.6v10.8M9.2 9.4c0-1.1 1.2-1.9 2.8-1.9s2.8.8 2.8 1.9-1.2 1.7-2.8 2-2.8.9-2.8 2.1 1.2 1.9 2.8 1.9 2.8-.8 2.8-1.9" fill="none" stroke="var(--bg)" stroke-width="1.6" stroke-linecap="round"/></svg>',
  target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.3" fill="currentColor"/><circle cx="12" cy="12" r="5.8" fill="var(--bg)"/><circle cx="12" cy="12" r="2.8" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.3" fill="currentColor"/><path d="M7.6 12.4l3 3 5.9-6.6" fill="none" stroke="var(--bg)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  half: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.7a9.3 9.3 0 0 1 0 18.6z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" fill="currentColor"/><path d="M8.6 10.5V8a3.4 3.4 0 0 1 6.8 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  flower: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6.2" r="3.1" fill="currentColor"/><circle cx="17.8" cy="12" r="3.1" fill="currentColor"/><circle cx="12" cy="17.8" r="3.1" fill="currentColor"/><circle cx="6.2" cy="12" r="3.1" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="var(--bg)"/></svg>',
  drop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6c3.6 4.6 6.4 8.2 6.4 11.6a6.4 6.4 0 0 1-12.8 0c0-3.4 2.8-7 6.4-11.6z"/><path d="M9.2 14.6a3 3 0 0 0 2.4 2.9" fill="none" stroke="var(--bg)" stroke-opacity=".75" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

/* ---------- the weekly streak ----------
   A week counts when a receipt is added that week (the day it is added, not the receipt's own date) or "Nothing to log this week" is tapped.
   Four counted weeks in a row earn a shield. A shield covers one missed week, and only one can be held at a time. */
function streakInfo() {
  const list = (S.ui.wk || []).slice().sort(), W = new Set(list), now = wkOf(new Date());
  const out = { n: 0, best: 0, shield: false, run: 0, done: W.has(now), dots: [], first: list[0] || null };
  const st = {};
  if (list.length) {
    let streak = 0, run = 0, shield = false, guard = 0;
    for (let w = list[0]; w <= now && guard < 420; w = wkAdd(w, 1), guard++) {
      if (W.has(w)) { streak++; run++; st[w] = 'done'; if (run % 4 === 0) shield = true; out.best = Math.max(out.best, streak); }
      else if (w === now) st[w] = 'now';
      else if (shield) { shield = false; st[w] = 'shield'; }
      else { streak = 0; run = 0; st[w] = 'miss'; }
    }
    out.n = streak; out.shield = shield; out.run = run;
  }
  for (let i = 7; i >= 0; i--) { const k = wkAdd(now, -i); out.dots.push({ k, s: st[k] || (k === now ? 'now' : 'none') }); }
  return out;
}
function markWeek() {
  const k = wkOf(new Date()), w = S.ui.wk = S.ui.wk || [];
  if (w.indexOf(k) >= 0) return null;
  const before = streakInfo().n; w.push(k); w.sort(); if (w.length > 160) w.splice(0, w.length - 160);
  return { n: streakInfo().n, before };
}
const WK_MILE = [1, 4, 8, 12, 26, 52];
function afterLog(first, batch) {
  pulseBand();
  const r = markWeek(); persist(); render();
  /* a receipt that takes free to spend past its plan is not a moment to celebrate: the Over state on Home says it, and the log line stays plain */
  let over = false; try { const mm = HV && HV.map; over = !!(mm && mm.overspent > 0); } catch (e) { }
  if (over) { sfx('coin'); { const mm = HV.map, pl = mm.month.find(x => x.id === 'play'), bu = mm.burrows.find(x => x.over); const names = []; if (pl && pl.overBy > 0) names.push('Free to spend'); const nc = mm.month.find(x => x.id === 'nec'); if (nc && nc.overBy > 0) names.push('Bills and basics'); mm.burrows.filter(x => x.over).forEach(x => names.push(x.name)); cheer('Logged. ' + (names.length ? names.map(n => n + (n === 'Bills and basics' ? ' are' : ' is') + ' over').join(', ') + ' for this month.' : 'Over plan this month.')); }; return; }
  if (r) {
    const big = WK_MILE.indexOf(r.n) >= 0 && r.n > 1;
    sfx(big ? 'fanfare' : 'sparkle');
    celebrate(big ? 'med' : 'small', first || r.n === 1 ? 'Logged. Streak: week 1.' : `Logged. Streak: ${r.n} weeks.`);
    if (!over) SQ.stash();   /* a new streak week, or the very first receipt: the squirrel stocks the burrow */
  } else { sfx('coin'); celebrate('small', 'Logged.'); if ((batch >= 3 || first) && !over) SQ.stash(); }
}

/* ---------- badges ---------- */
const BADGES = [
  { id: 'rcpt1', n: 'First receipt', h: 'Log a receipt.', i: 'receipt', ok: () => (S.receipts || []).length >= 1 },
  { id: 'payin', n: 'Pay set', h: 'Enter your pay.', i: 'coin', ok: () => !!(S.ui.done && S.ui.done.pay) },
  { id: 'goal1', n: 'First burrow', h: 'Add a burrow with a goal amount.', i: 'target', ok: () => !!(S.ui.done && S.ui.done.goals) && S.plan.goals.some(g => g.target > 0) },
  { id: 'track', n: 'On track', h: 'A goal is on track.', i: 'check', ok: () => !!(S.ui.done && S.ui.done.goals) && S.plan.goals.some(g => { const s = goalInfo(S, C, g.id, nowYm()).state; return s === 'ontrack' || s === 'full'; }) },
  { id: 'half', n: 'Halfway', h: 'A goal reaches 50%.', i: 'half', ok: () => !!(S.ui.done && S.ui.done.goals) && goalRows(S, C, nowYm()).some(r => r.target > 0 && r.pctNow >= 50) },   /* what the goal holds now, not what the month plans (QC round 4 money accuracy B3) */
  { id: 'rcpt10', n: '10 receipts', h: 'Log 10 receipts.', i: 'star', ok: () => (S.receipts || []).length >= 10 },
  { id: 'wk4', n: '4 weeks', h: 'Log 4 weeks running.', i: 'leaf', ok: () => streakInfo().best >= 4 },
  { id: 'wk12', n: '12 weeks', h: 'Log 12 weeks running.', i: 'shield', ok: () => streakInfo().best >= 12 },
  { id: 'full', n: 'Goal full', h: 'A goal reaches its amount.', i: 'flower', ok: () => !!(S.ui.done && S.ui.done.goals) && goalRows(S, C, nowYm()).some(r => r.target > 0 && r.pctNow >= 100) },
  { id: 'topup', n: 'Top-up', h: 'Put unspent free to spend toward a goal.', i: 'drop', ok: () => !!(S.ui.sweep && Object.keys(S.ui.sweep).some(k => S.ui.sweep[k] && S.ui.sweep[k].amt > 0)) },
];
let badgeTimer = 0;
function checkBadges() {
  if (!C) return;
  const earned = BADGES.filter(b => { try { return b.ok(); } catch (e) { return false; } });
  if (!S.ui.bd) { S.ui.bd = {}; earned.forEach(b => { S.ui.bd[b.id] = true; }); return; }
  const fresh = earned.filter(b => !S.ui.bd[b.id]); if (!fresh.length) return;
  fresh.forEach(b => { S.ui.bd[b.id] = true; });
  persist(); clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => { const bm = C && C.byYm[nowYm()]; if ((HV && HV.map && HV.map.overspent > 0) || (bm && (bm.bankEnd < 0 || statusOf(S, bm) === 'short'))) { if (tab === 'home') renderBadges(); return; }   /* no cheering while the month is short or below zero: the badge waits in the list (38.31 north-star round 3) */ sfx('fanfare'); celebrate('med', fresh.length === 1 ? `Badge: ${fresh[0].n}.` : `${fresh.length} badges: ${fresh.map(b => b.n).join(', ')}.`); if (tab === 'home') renderBadges(); }, 900);
}

/* ---------- next win ---------- */
const monthsTo = ym => ymIdx(ym) - ymIdx(nowYm());
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
let HG = null, HGD = false;
/* redraw a card only when its markup changed, so animations and hover state survive the many redraws */
const put = (el, html) => { if (el.__h !== html) { el.innerHTML = html; el.__h = html; pixKeep(el); } };
/* the graph is drawn at the card's real width so its text stays readable on a phone */
function heroW() { const el = $('#hHero'); if (!el || !el.clientWidth) return HW || 520; const cs = getComputedStyle(el), pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0); return HW = Math.max(260, Math.min(680, Math.round(el.clientWidth - pad))); }
let HW = 0;
function heroGraph(g) {
  const id = g.id, ym0 = nowYm(), i0 = MONTHS.indexOf(ym0), reached = C.reached[id];
  const ir = reached ? Math.max(i0, MONTHS.indexOf(reached)) : MONTHS.length - 1;
  const pts = [C.byYm[ym0].balBefore[id]];
  for (let k = i0; k <= ir; k++) pts.push(Math.min(C.months[k].bal[id] + (C.months[k].spent[id] || 0), Math.max(g.target, 1) * 1.04));
  const n = pts.length, W = heroW(), H = 168, L = 10, R = 14, T = 26, B = 28, top = Math.max(g.target, ...pts) * 1.06;
  const X = i => L + i * (W - L - R) / Math.max(1, n - 1), Y = v => T + (1 - v / top) * (H - T - B);
  const line = pts.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
  const area = line + `L${X(n - 1).toFixed(1)} ${Y(0)}L${X(0).toFixed(1)} ${Y(0)}Z`;
  const rb = readyBy(g), di = rb ? MONTHS.indexOf(rb) - i0 + 1 : -1;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(g.name)}: ${fmt(pts[0])} saved at the start of ${monthLabel(ym0)}, ${reached ? 'full in ' + monthLabel(reached) : 'not full within ' + SPAN}, goal ${fmt(g.target)}"><title>${esc(g.name)} progress</title>`;
  s += `<line class="hg-g" x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}"/><line class="hg-t" x1="${L}" x2="${W - R}" y1="${Y(g.target)}" y2="${Y(g.target)}"/><text class="hg-x" x="${W - R}" y="${Y(g.target) - 7}" text-anchor="end">Goal ${fmt(g.target)}</text>`;
  if (di > 0 && di < n) s += `<line class="hg-d" x1="${X(di)}" x2="${X(di)}" y1="${T - 6}" y2="${H - B}"/><text class="hg-x" x="${X(di)}" y="${H - 9}" text-anchor="${di > n * .75 ? 'end' : 'middle'}">Needed by</text>`;
  s += `<path class="hg-a" d="${area}" style="--c:var(--c${g.slot})"/><path class="hg-l${HGD ? '' : ' draw'}" d="${line}" style="--c:var(--c${g.slot})"/>`; HGD = true;
  s += `<circle class="hg-p" cx="${X(0)}" cy="${Y(pts[0])}" r="5" style="--c:var(--c${g.slot})"/><text class="hg-x" x="${X(0)}" y="${H - 9}" text-anchor="start">Start of ${monthLabel(ym0, true)}</text>`;   /* the first point is the balance before this month's saving; every other "saved" figure is after it (S5) */
  if (reached) s += `<circle class="hg-p big" cx="${X(n - 1)}" cy="${Y(pts[n - 1])}" r="6.5" style="--c:var(--c${g.slot})"/><text class="hg-x" x="${X(n - 1)}" y="${di > 0 && Math.abs(di - (n - 1)) < 2 ? H - 20 : H - 9}" text-anchor="end">Full ${monthLabel(reached, true)} ${reached.slice(0, 4)}</text>`;
  s += `<circle id="hgM" class="hg-p" r="5.5" cx="-20" cy="-20" style="--c:var(--c${g.slot})"/></svg>`;
  HG = { pts, X, Y, W, n, i0, g };
  return s;
}
/* the numbers are still the invented ones: pay, bills and goals have not all been set by the person, and the plan was not cleared */
const sampleOn = () => sampleShown(S);   /* one rule, in model.js */
/* the first thing on Home: where you stand this month, in one plain statement. Every figure comes from the month view; nothing is worked out here. */
function renderStatus() {
  const el = $('#hStatus'), V = HV, m = V && V.month; if (!el || !m) return;
  const u = roundUnit(S), mon = monthLabel(V.ym, true), floor = cfg(S, 'minBank');
  let cls, word, line;
  if (!(m.inflow > 0)) { if (m.left < 0 || m.bankEnd < 0) { cls = 'tight'; word = 'No pay entered';   /* amber, never red (decision 2) */ line = m.left < 0 ? `Your plan spends ${fmt(V.cells.planSpend)} in ${mon} and no pay is entered, so your bank would end at ${fmt(m.bankEnd)}. Add your monthly pay under Plan.` : `You logged spending in ${mon} with no pay entered, so your bank would end at ${fmt2(m.bankEnd)}. Add your monthly pay under Plan.`; } else { cls = ''; word = 'No plan yet'; line = 'Add your monthly pay to start.'; } }
  else if (sampleOn()) { const d = S.ui.done || {}; cls = ''; word = 'Sample numbers'; line = d.pay && d.bills ? 'Pay and bills are yours but the burrows are still made up: add one below' : 'These numbers are made up: do the step below to put yours in'; }
  else if (m.status === 'good') { cls = 'good'; word = V.play && V.play.planned > 0 && V.play.left < 0 ? 'Over free to spend' : 'You are okay'; if (word !== 'You are okay') cls = 'tight'; const nOv = V.map && V.map.month.find(r => r.id === 'nec'), nOvT = nOv && nOv.overBy > 0 ? ` Bills and basics are ${fmt2(nOv.overBy)} over.` : ''; const pl = nOvT + (V.play && V.play.planned > 0 ? (V.play.left > 0 ? ` ${fmt2(V.play.left)} is free to spend.` : V.play.left < 0 ? ` Free to spend is ${fmt2(V.play.overBy)} over.` : ' Free to spend is used up.') : ''); const unp = V.cells.unplaced; line = !nOvT && unp >= u ? `${fmt2(unp)} of your pay is not placed yet and your bills are covered, so give it a goal or a place or just leave it in the bank.${pl}` : m.left < u && ((C.byYm[V.ym] || {}).out - (C.byYm[V.ym] || { jar: {} }).jar.nec) <= 0 ? `Bills use all of your pay so nothing is set aside yet` : (nOvT ? `Bills went past the plan.${pl}` : `Bills are covered and burrows are planned for.${pl}`); { const OB = (V.month && V.month.overBits) || {}, ON = { other: 'Other', ffa: 'Investing', edu: 'Education', give: 'Giving' }, ext = Object.keys(ON).filter(j => OB[j] > 0).map(j => ` ${ON[j]} is ${fmt2(OB[j])} over.`).join('');   /* every place past the plan is named, so the parts add up to what the bank is lowered by (38.31 number gate round 3) */
    if (ext) { line += ext; if (word !== 'You are okay') { cls = 'tight'; word = 'Over plan'; } } }   /* with nothing else over, the total and "came out of your bank" lead the line below */
    if (nOvT) { cls = 'tight'; word = 'Over plan'; } }
  else if (m.status === 'tight') { cls = 'tight'; word = 'Tight month'; const dw = ((C.byYm[V.ym] || {}).draw) || 0; line = `Plans ${fmt(V.cells.overPay)} more than your pay${dw > 0 ? ', ' + fmt(dw) + ' of it from your emergency fund' : ''}. Your balance covers it, ending ${mon} at ${fmt(m.bankEnd)}.`; }
  else if (m.belowZero) {
    /* decision 2 (Mako, 2026-11-18): below zero is one plain amber line with the month, the amount and the causes the model knows (viewOf().month.belowZero).
       Never red, never "cushion", and nothing about unpaid bills: the model does not know that */
    const z = m.belowZero, why = [];
    if (z.planGap > 0) why.push(`${mon} plans ${fmt2(z.planGap)} more than comes in`);
    if (z.overNow > 0) why.push(`${fmt2(z.overNow)} went past the plan this month`);
    cls = 'tight'; word = 'Below zero';
    line = `Your bank ends ${mon} at ${fmt2(m.bankEnd)}.`
      + (z.startBelow > 0 ? ` It starts the month at ${fmt2(m.bankStart)}${z.adds > 0 ? `, and ${mon} adds ${fmt2(z.adds)}` : ''}.` + (z.overBefore > 0 ? ` Spending past the plan in earlier months took ${fmt2(z.overBefore)}.` : '') : '')
      + (z.takes > 0 && why.length ? ` ${why.join(', and ')}.` : '')   /* each cause starts with the month name or an amount */
      + ' Open Plan to see the month.';
  }
  else if (m.status === 'short' && m.bankChange > 0.004) { cls = 'tight'; word = 'Building your cushion';   /* only when the month really adds (38.31 round: it said "adds to it" when it added nothing) */ line = `Your bank is under your safety minimum of ${fmt(floor)}, but ${mon} adds to it. It will end at ${fmt(m.bankEnd)}. You can change the minimum in Settings.`; }
  else { cls = 'short'; word = 'Short'; line = `Not enough for ${mon}. Your bank would end at ${fmt(m.bankEnd)}, under your safety minimum of ${fmt(floor)}. Change it in Settings, or open Plan to fix the month.`; }
  if (m.status === 'good' && word === 'You are okay' && (m.overNow || 0) > 0.004) { word = 'Over plan'; cls = 'tight'; line = `${fmt2(m.overNow)} went past the plan this month and came out of your bank. ` + line; }
  let wk = '';
  if (cls && $('#hNext').hidden) wk = streakInfo().done ? '<p class="hst-w on">You logged receipts this week.</p>' : '<p class="hst-w">Nothing logged this week yet, log by Sunday</p>';
  /* the next three months, so one tight month ahead is never a surprise */
  let ahead = '';
  if (cls && !sampleOn()) {
    const i0 = MONTHS.indexOf(V.ym), bad = [];
    const said = x => `${monthLabel(x, true)}${x.slice(0, 4) !== V.ym.slice(0, 4) && MONTHS.indexOf(x) - i0 > 3 ? ' ' + x.slice(0, 4) : ''}`;
    for (let k = 1; k <= 3 && i0 >= 0 && i0 + k < MONTHS.length; k++) { const x = MONTHS[i0 + k], mx = C.byYm[x]; if (!mx) continue; const st = statusOf(S, mx); if (st === 'short') bad.push(`${said(x)} ${mx.bankEnd < 0 ? 'ends below zero' : mx.left < 0 ? 'is short' : 'ends under your minimum'}`); else if (st === 'tight') bad.push(`${said(x)} is tight`); }
    /* nothing in the next three months: the first later month that ends below zero or under the minimum is still named (QC round 4 north-star 3) */
    if (!bad.length && i0 >= 0) for (let k = 4; i0 + k < MONTHS.length; k++) { const x = MONTHS[i0 + k], mx = C.byYm[x]; if (mx && statusOf(S, mx) === 'short') { bad.push(`${said(x)} ${mx.bankEnd < 0 ? 'ends below zero' : mx.left < 0 ? 'is short' : 'ends under your minimum'}`); break; } }
    if (i0 >= 0 && i0 + 1 < MONTHS.length && !(m.over > 0.004 && !bad.length)) ahead = `<p class="hst-w${bad.length ? ' warn' : ' on'}">${bad.length ? 'Coming up: ' + bad.join(', ') + '. Open Plan to see why.' : 'The next 3 months look fine.'}</p>`;
  }
  put(el, `<span class="chip ${cls}">${cls === 'good' ? IC.ok : cls ? IC.warn : ''}${word}</span><p class="hst-l">${line}</p>${ahead}${wk}${m.inflow > 0 && !sampleOn() ? '<p class="cap hs-more"><button type="button" class="link" data-why="status">How is this worked out?</button></p>' : ''}`);
  el.hidden = false;
}
/* last month's unspent free to spend: once the month is logged (four receipts or more, or a statement), what was not spent can go toward a goal.
   One offer per month, kept until the person answers it or the month after has gone by. */
/* a receipt just logged can be taken back out with one tap, for as long as the Undo bar shows (38.31 data safety round). Only that receipt goes */
function rcUndo(id, txt) { if (id && window.offerUndoG) window.offerUndoG('receipt', txt, () => { removeReceipt(S, id); ['#hMsg', '#rcMsg'].forEach(q => { const e = $(q); if (e && /^Logged/.test(e.textContent)) e.textContent = ''; }); }, 8000); }   /* the Logged line goes with the receipt (QC10 round 3 numbers blocker 2) */   /* 8 seconds: it sits over the numbers that just changed */
let SWEPT = null;
function sweepOffer() {
  const d = S.ui.done || {}; if (!(d.pay && d.bills && d.goals) || sampleOn()) return null;
  const i = MONTHS.indexOf(nowYm()); if (i < 1) return null;
  for (let k = i - 1; k >= 0; k--) {
    const pm = MONTHS[k]; if (sweepAns(S, pm) || (SWEEP_LATER && SWEEP_LATER[pm])) continue;
    const m = C.byYm[pm], left = m.pendLeft || 0; if (!(left >= 0.01)) continue;
    const goals = goalRows(S, C, pm).filter(r => r.live && r.pct < 100 && r.target > 0 && r.togo > 0);
    const main = goals.length ? (pickMain(S, goals) || goals[0]) : null;
    return { pm, left, goals, main, now: MONTHS[i], n: receiptStats(S, pm).count };
  }
  return null;
}
let SWEEP_LATER = null;   /* "decide later": asked again on the next page load */
function renderNext() {
  const el = $('#hNext'), d = S.ui.done || {}; let step = null, month = null;
  /* the Emergency fund is full: ask once whether to keep saving toward the longer goal */
  if (!step && HV && C) { const eg = emergencyGoal(S); if (eg && eg.stretchOn === undefined && eg.stretch > eg.target && eg.target > 0) { let gi = null; try { gi = goalInfo(S, C, eg.id, HV.ym); } catch (e) { } if (gi && gi.state === 'full') step = [`${eg.name} is full`, `It reached ${fmt(eg.target)}. Keep saving toward your long-term goal of ${fmt(eg.stretch)}?`, 'Keep saving', 'data-stretch="yes"', '', 'data-stretch="no"']; } }
  if (!S.ui.sampleHidden) {
    if (!d.pay) step = ['Next: enter pay', 'The plan starts from monthly pay.', 'Enter pay', 'data-open="a"'];
    else if (!d.bills) step = ['Next: check bills', 'Set each bill to the real amount.', 'Open bills', 'data-open="nec"'];
    else if (!d.goals) step = ['Next: add a burrow', 'Pick something to save for.', 'Add a burrow', 'data-gw'];
    else if (!step && !(S.receipts || []).length && !sweepOffer() && !SWEPT) step = ['Next: log spend', 'Enter an amount in Log spend, then tap Log.', 'Log spend', 'data-focus="hAmt"'];
  }
  /* a month to close comes first (it is timely); then, for typed numbers, the statements that make them exact */
  /* a sweep just made: say so, with Undo, until the next page load */
  if (SWEPT && SWEPT.id && !sweepAns(S, SWEPT.pm)) SWEPT = null;
  if (SWEPT && !(S.ui.sweep && S.ui.sweep[SWEPT.pm])) SWEPT = null;
  /* receipts logged later can use up the money the answer was about: then there is nothing left to report (the same rule as after a reload), never "0 counted" */
  if (SWEPT && C && !((C.byYm[SWEPT.pm] || {}).counted > 0)) SWEPT = null;
  /* after a reload, an answer made in the last 3 days still shows with Undo */
  if (!SWEPT && S.ui.sweep && !sweepOffer()) { const k = Object.keys(S.ui.sweep).filter(q => S.ui.sweep[q].t && Date.now() - S.ui.sweep[q].t < 3 * 864e5 && C.byYm[q] && C.byYm[q].counted > 0).sort().pop(); if (k) { const e = S.ui.sweep[k]; SWEPT = { pm: k, id: e.id || null, to: e.id ? undefined : 'bank', amt: e.amt, note: `From ${FULL[+k.slice(5) - 1]}'s free to spend.${e.id ? '' : ' The bank figure now includes it.'}` }; } }
  if (!step && SWEPT) {
    const g = SWEPT.id ? goalById(S, SWEPT.id) : null, mm = C.byYm[SWEPT.pm] || {}, used = (mm.topup && mm.topup.used) || 0, cnt = mm.counted || 0, rest = mm.credit || 0, nm = FULL[+SWEPT.pm.slice(5) - 1];
    let body;
    if (g && used > 0) { let gi = null; try { gi = goalInfo(S, C, g.id, nowYm()); } catch (e) { } const rd = C.reached[g.id]; body = gi ? (gi.pct >= 1 ? dw(S, g, `${g.name} is full.`) : dw(S, g, `${fmt(gi.togo)} to go.${rd ? ` Full ${monthLabel(rd)}.` : ''}`)) : ''; body += (g.why ? ' ' + g.why + '.' : '') + (rest > 0.004 ? ` The other ${fmt2(rest)} stays in the bank.` : ''); }
    else if (g) body = `From ${nm}'s free to spend. ${g.name} had no room left, so it stays in the bank.`;
    else body = `From ${nm}'s free to spend. The bank figure now includes it.`;
    step = [g && used > 0 ? `${fmt2(used)} put toward ${g.name}` : `${fmt2(cnt)} counted in the bank`, body, 'Undo', 'data-sweepundo'];
  }
  let sw = null;
  if (!step && (sw = sweepOffer())) {
    const nm = FULL[+sw.pm.slice(5) - 1], one = sw.goals.length === 1, nowNm = FULL[+sw.now.slice(5) - 1];
    const pick = sw.goals.length > 1 ? `<select class="inp sm" data-sweepgoal aria-label="Which goal">${sw.goals.map(r => `<option value="${esc(r.id)}"${r.id === sw.main.id ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select>` : '';
    step = [`${nm}: ${fmt2(sw.left)} of Free to spend isn't logged as spent`, `Your bank balance doesn't include it yet. ${sw.n < 4 ? (sw.n === 0 ? 'No receipts are logged' : sw.n === 1 ? 'Only 1 receipt is logged' : `Only ${sw.n} receipts are logged`) + ', so this may be spending you haven\'t logged yet. ' : ''}${sw.goals.length ? 'Count it in the bank or put it toward a goal, you can undo either one.' : 'Count it in the bank, you can undo it.'}`   /* no goal button when no goal has room, so no goal in the words (QC10 numbers should-fix 2) */, `Count ${fmt2(sw.left)} in the bank`, `data-sweepbank="${sw.pm}"`, pick];
  }
  if (!step && d.pay && d.bills && S.ui.src !== 'import' && !S.ui.exactHidden && !sampleOn()) { const can = typeof askFn !== 'undefined' && !!askFn; step = ['Make it exact', can ? 'Upload 2 or 3 months of statements, screenshots of the bank app work too, and the numbers become exact and your history fills in' : 'Bring in 2 or 3 months of statements with an AI app, screenshots of the bank app work too, and the numbers become exact and your history fills in', can ? 'Upload' : 'Use an AI app', 'data-exact']; }
  if (!step && d.pay && d.bills && S.ui.full !== true && !S.ui.moreBillsHidden && !sampleOn() && necLines().filter(l => val(S, l.key, nowYm()) > 0).length < 4) step = ['Next: add your other bills', 'Utilities, internet, phone and transport: rough numbers are fine', 'Open bills', 'data-open="nec"', '', 'data-hidebills'];
  if (!step && d.pay && d.bills && !S.ui.noDebts && !(S.plan.debts && S.plan.debts.length) && !sampleOn() && !backupDue()) step = ['Next: do you owe on a card or loan?', 'Add it and the burrow works out the interest, the payoff date and which to pay first.', 'Add a card or loan', 'data-debtgo', '', 'data-nodebts'];
  if (!step && (S.receipts || []).length && !S.ui.remindHidden && !sampleOn() && !backupDue()) step = ['Set a weekly reminder', 'Put a reminder in your calendar so you log for a few minutes each week and the numbers stay right', 'Set reminder', 'data-remindgo'];
  /* version one (Mako, 2026-11-18): Home shows one next action. These suggestions are useful but never urgent, so they sit behind More and
     Log spend stays the action; "Next: log spend" is the Log spend card itself */
  el.dataset.v1 = !step ? '' : step[3] === 'data-focus="hAmt"' ? 'log' : ['data-exact', 'data-open="nec"', 'data-debtgo', 'data-remindgo'].indexOf(step[3]) >= 0 && d.pay && d.bills && d.goals ? 'later' : 'now';
  el.hidden = !step; if (!step) return;
  const left = ['pay', 'bills', 'goals', 'receipts'].filter(k => !d[k]).length;
  const exact = step[3] === 'data-exact';
  const swept = step[3] === 'data-sweepundo', sweep = !!sw && step[3].indexOf('data-sweepbank=') === 0;
  const tail = swept ? '' : month && month.left > 0 ? `<button type="button" class="link" data-mcok="${month.pm}">It was not spent</button><button type="button" class="link" data-hidemonth="${month.pm}">Hide</button>` : sweep ? `${sw.main ? `<button type="button" class="link" data-sweep="${sw.pm}">${sw.goals.length === 1 ? 'Put it toward ' + esc(sw.main.name) : 'Put it toward the goal'}</button>` : ''}<button type="button" class="link" data-closego="${sw.pm}">Open ${FULL[+sw.pm.slice(5) - 1]} receipts</button><button type="button" class="link" data-sweephide="${sw.pm}">Decide later</button>` : `<button type="button" class="link" ${month ? `data-hidemonth="${month.pm}"` : exact ? 'data-hideexact' : step[3] === 'data-remindgo' ? 'data-hideremind' : step[5] || 'data-hidenext'}>${step[5] === 'data-stretch="no"' ? 'Stop here' : 'Hide'}</button>`;
  put(el, `<div class="hn-t"><b>${step[0]}</b><span>${step[1]}${month || exact || sweep || swept || step[5] || step[3] === 'data-remindgo' ? '' : ' ' + (left === 1 ? '1 step left.' : left + ' steps left.')}</span></div><div class="hn-b">${step[4] || ''}<button type="button" class="btn small ${swept ? '' : 'solid'}" ${step[3]}>${step[2]}</button>${tail}</div>`);
}
/* an answer was just given. With no other month waiting, the card says so with Undo, as before. With another month still waiting
   (Home says its money is "left out until you answer the question on Home"), that question takes the card straight away, as it does
   after a reload, and the answer just given is said in the Undo bar instead, so it can still be taken back */
function sweptSay(sw, msg, big) {
  C = calcAll(S);
  if (!sweepOffer() || !window.offerUndoG) { SWEPT = sw; if (big) celebrate('med', msg); else cheer(msg); return; }
  SWEPT = null;
  window.offerUndoG('sweep', msg, () => { if (S.ui.sweep) { delete S.ui.sweep[sw.pm]; if (!Object.keys(S.ui.sweep).length) delete S.ui.sweep; } });
}
/* put last month's unspent free to spend toward the chosen goal: one undoable change, then the new date is said out loud */
function doSweep(pm) {
  const o = sweepOffer(); if (!o || o.pm !== pm || !o.main) { render(); return; }
  const sel = $('#hNext [data-sweepgoal]'), id = sel && goalById(S, sel.value) ? sel.value : o.main.id, g = goalById(S, id);
  const before = C.reached[id] || null, lastIx = MONTHS.length - 1;
  const moved = topupFit(S, C, pm, id);   /* model.js: last month's unspent amount, cut to the goal's room */
  if (!(moved > 0)) { cheer('Nothing to move.'); return; }
  S.ui.sweep = Object.assign({}, S.ui.sweep, { [pm]: { amt: moved, id, t: Date.now() } }); persist();
  const C2 = calcAll(S), after = C2.reached[id] || null, gi = goalInfo(S, C2, id, nowYm());
  let note = '';
  if (gi.pct >= 1) note = dw(S, g, `${g.name} is full.`);
  else if (after && before && after < before) { const n = ymIdx(before) - ymIdx(after); note = `Full ${monthLabel(after)}, ${plural(n, 'month')} sooner.`; }
  else note = dw(S, g, `${fmt(gi.togo)} to go.${after ? ` Full ${monthLabel(after)}.` : ''}`);
  sfx('coin'); SQ.stash();
  sweptSay({ pm, id, amt: moved, note: `${note}${g.why ? ' ' + g.why + '.' : ''}` }, `${g.name}: +${fmt(moved)}. ${note}`, true);
  render();
}
/* last month's unspent free to spend kept in the bank, or added to this month's free to spend: one undoable change, said out loud */
function doRelease(pm) {
  const o = sweepOffer(); if (!o || o.pm !== pm) { render(); return; }
  S.ui.sweep = Object.assign({}, S.ui.sweep, { [pm]: { amt: o.left, to: 'bank', t: Date.now() } }); persist();
  const nm = FULL[+pm.slice(5) - 1];
  sfx('coin'); sweptSay({ pm, id: null, to: 'bank', amt: o.left, note: `From ${nm}'s free to spend. The bank figure now includes it.` }, `${fmt2(o.left)} counted in the bank.`); render();
}
function undoSweep() {
  if (!SWEPT) return; const pm = SWEPT.pm;
    if (S.ui.sweep) { delete S.ui.sweep[pm]; if (!Object.keys(S.ui.sweep).length) delete S.ui.sweep; }
  SWEPT = null; persist(); sfx('back'); cheer('Undone.'); render();
}
function renderStreak() {
  const el = $('#hStreak'), s = streakInfo(), now = new Date(), dow = (now.getDay() + 6) % 7, toSun = 6 - dow;
  const dots = s.dots.map((d, i) => {
    const lab = { done: 'Logged', shield: 'Shield used', miss: 'Missed', now: 'This week', none: '' }[d.s];
    return `<li class="wd ${d.s}${i === 7 ? ' cur' : ''}" title="Week of ${dateLabel(d.k)}: ${lab || 'No streak yet'}"><span class="wd-i" aria-hidden="true">${d.s === 'done' ? HI.leaf : d.s === 'shield' ? HI.shield : ''}</span><span class="sr">Week of ${dateLabel(d.k)}: ${lab || 'nothing'}</span></li>`;
  }).join('');
  const toShield = 4 - (s.run % 4);
  let line;
  if (s.done) line = s.n > 1 ? `Week done. Streak: ${s.n} weeks.` : 'Week done. Log next week to extend.';
  else if (s.n > 0) line = `Streak: week ${s.n}, log by Sunday.` + (toSun <= 1 ? ' Last day.' : ` ${plural(toSun + 1, 'day')} left.`);
  else line = 'No streak yet, log one receipt this week to start one';
  const sh = s.shield ? `<p class="hst-sh on">${HI.shield}<span>Shield ready, it covers one missed week</span></p>` : s.n > 0 || s.run > 0 ? `<p class="hst-sh">${HI.shield}<span>${plural(toShield, 'week')} to the next shield.</span></p>` : '';
  put(el, `<h2>Streak</h2><div class="hst-top"><span class="hst-fl${s.n > 0 ? ' lit' : ''}" aria-hidden="true">${HI.leaf}</span><p class="hst-n"><b>${s.n}</b><span>${s.n === 1 ? 'week' : 'weeks'}</span></p></div>
    <p class="hst-line">${line}</p><ol class="wdots" aria-label="Last 8 weeks">${dots}</ol>${sh}
    <div class="row-btns">${s.done ? '' : '<button type="button" class="btn small" data-checkin>Nothing to log</button>'}${s.best > s.n ? `<span class="hst-best">Best: ${plural(s.best, 'week')}</span>` : ''}</div>`);
  paintTopStreak(s);
}
/* the streak by the title, on every page: the leaf and the number of weeks */
function paintTopStreak(s) {
  const b = $('#topStreak'); if (!b) return; s = s || streakInfo();
  const h = `${HI.leaf}<b>${s.n}</b>`; if (b.__h !== h) { b.innerHTML = h; b.__h = h; }
  b.classList.toggle('lit', s.n > 0); b.setAttribute('aria-label', `Streak: ${plural(s.n, 'week')}. ${s.done ? 'This week is logged.' : 'Log a receipt this week to keep it.'}`); b.title = s.done ? 'This week is logged' : s.n ? 'Log a receipt this week to keep it' : 'Log one receipt this week to start a streak';
}
function renderBadges() {
  const el = $('#hBadges'), bd = S.ui.bd || {}, n = BADGES.filter(b => bd[b.id]).length;
  put(el, `<div class="hgl-h"><h2>Badges</h2><span class="hb-n">${n} of ${BADGES.length}</span></div><ul class="hbs">${BADGES.map(b => { const on = !!bd[b.id]; return `<li class="hb${on ? ' on' : ''}"><span class="hb-i" aria-hidden="true">${on ? HI[b.i] : HI.lock}</span><b>${b.n}</b><span>${on ? 'Earned' : b.h}</span></li>`; }).join('')}</ul>`);
}
/* ---------- what the screens show: one view of the numbers (viewOf in the model), drawn here ---------- */
let HV = null;
const homeView = () => (HV = viewOf(S, C, nowYm(), ymd(new Date())));
/* the sentence under a goal: a line Claude wrote for this exact name, otherwise the built-in wording */
function purposeFor(g) { if (!g) return ''; const w = S.ui && S.ui.win && S.ui.win[g.id]; return w && w.n === g.name && typeof w.t === 'string' && w.t ? w.t : purposeOf(S, g); }
const monthsText = r => dwr(r, monthsText0(r));
const monthsText0 = r => r.pct >= 100 ? 'Full' : r.reached ? (r.months <= 0 ? 'Full this month' : plural(r.months, 'month') + ' to go') : 'No date at this pace';
const monthsShort = r => r.state === 'paid' ? 'Paid' : r.state === 'short' ? 'Short' : r.state === 'unset' ? 'No amount' : r.pct >= 100 ? (r.pctNow >= 100 ? 'Done' : 'This month') : r.reached ? (r.months <= 0 ? 'This month' : plural(r.months, 'month')) : r.grows === false ? 'Not growing' : 'Over ' + SPAN;
const fracOf = r => (r.target > 0 ? Math.min(1, Math.max(0, r.saved / r.target)) : 0);
function renderHero() {
  const el = $('#hHero'), r = HV.main;
  if (!r) {
    try { SCENE.progress(0); } catch (e) { /* the world is a bonus */ }
    el.className = 'card hwin empty';
    /* a goal that exists but has no amount yet (the setup was left early) is not "no goal": it asks for its amount */
    const unset = S.plan.goals.filter(g => !(g.target > 0));
    if (unset.length) put(el, `<div class="hw-empty"><h2>${esc(unset[0].name)} has no amount yet</h2><p>Set the amount to see what each month adds and when it's full</p><button type="button" class="btn solid" data-gset="${esc(unset[0].id)}">Set amount</button></div>`);
    else put(el, `<div class="hw-empty"><h2>No burrow yet</h2><p>Add a burrow to see what each month adds and when it's full</p><button type="button" class="btn solid" data-gw>Add a burrow</button></div>`);
    return;
  }
  const g = goalById(S, r.id), pct = r.pct, fr = fracOf(r);   /* the percent is the end of this month's, as on every Home figure (goal_agree); the amount is saved now (QC round 4 novice B1) */
  if (!g) return;
  try { SCENE.progress(pct); } catch (e) { /* the world is a bonus */ }
  const purpose = g.why || purposeFor(g); /* view and plan out of step for a moment (a goal just removed); the next restructure redraws */
  let chip = '', sub = '', fix = '';
  if (r.pct >= 100 || r.state === 'full') chip = '<span class="chip good">' + IC.ok + 'Full</span>';
  else if (r.state === 'ontrack') { chip = '<span class="chip good">' + IC.ok + 'On track</span>'; sub = `Needed by ${dateLabel(g.due)}. ${r.slack === 0 ? 'On time.' : plural(r.slack, 'month') + ' spare.'}`; }
  else if (r.state === 'behind') { chip = '<span class="chip tight">' + IC.warn + 'Behind</span>'; sub = `Needed by ${dateLabel(g.due)}.` + (r.need != null ? ` Save about ${fmt(r.need)} a month.` : ''); fix = '<button type="button" class="btn small" data-open="lts">Change monthly amount</button>'; }
  else if (r.state === 'noeta') { chip = '<span class="chip tight">' + IC.warn + 'Slow</span>'; sub = 'Raise the monthly amount to finish sooner.'; fix = '<button type="button" class="btn small" data-open="lts">Change monthly amount</button>'; }
  const when = dwr(r, r.pct >= 100 ? 'Full.' : r.reached ? (r.months <= 0 ? 'Full <b>this month</b>.' : `<b>${plural(r.months, 'month')}</b> to go. Full ${fullLabel(r.reached)}.`) : 'Not full within ' + SPAN + ' at this pace.');
  const ms = [25, 50, 75].map(p => `<span class="ms${pct >= p ? ' hit' : ''}" style="left:${p}%"></span>`).join('');
  /* what moves it: this month's deposit and what is still to go, so progress reads as motion, not a percent */
  const mg = C.byYm[HV.ym] && C.byYm[HV.ym].g[g.id], put1 = mg ? mg.actual : 0, togo = r.togo;
  const adds = r.pct < 100 && r.live ? `<p class="hw-add">${put1 > 0 ? `<b>+${fmt(put1)}</b> planned this month. ` : ''}${dwr(r, fmt(togo) + ' to go.')}</p>` : '';
  el.className = 'card hwin';
  put(el, `<p class="hw-k">Main goal: ${esc(g.name)}</p>
    <h2 class="hw-p">${esc(purpose)}</h2>
    <p class="hw-when">${when}</p>
    <div class="hw-bar" role="img" aria-label="${pct} percent of ${esc(g.name)} saved" style="--c:var(--c${g.slot})"><i class="fill" style="width:${fr * 100}%"></i>${ms}</div>
    <div class="hw-nums"><span><b>${fmt(r.savedNow)}</b> ${r.kind === 'debt' ? 'paid off' : 'saved'} now, of ${fmt(r.target)}</span><span>${pct}%${r.saved !== r.savedNow ? ` at the end of ${monthLabel(HV.ym, true)}` : ''}</span></div>
    ${adds}${chip}
    <details class="hw-more"><summary>Forecast</summary>${sub ? `<p class="hw-sub">${sub}</p>` : ''}${r.reached ? `<div class="hw-graph" id="hGraph">${heroGraph(g)}</div>` : ''}<div class="row-btns">${fix}<button type="button" class="btn small" data-tab-go="goals">Edit burrows</button></div></details>`);
  /* a milestone is celebrated once, the first time the plan passes it */
  const hit = pct >= 100 ? 4 : pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0, ms0 = S.ui.ms = S.ui.ms || {};
  if (ms0[g.id] === undefined) { ms0[g.id] = hit; persist(); }
  else if (hit > (ms0[g.id] || 0)) { ms0[g.id] = hit; persist(); sfx(hit === 4 ? 'fanfare' : 'sparkle'); SQ.stash(); celebrate(hit === 4 ? 'big' : 'med', hit === 4 ? `${g.name}: full.${g.why ? ' ' + g.why + '.' : ''}` : `${g.name}: ${[0, 25, 50, 75, 100][hit]}%.${g.why && hit >= 2 ? ' ' + g.why + '.' : ''}`); }
}
/* the free to spend: a small pixel chest painted into the corner of the card, in the same palette and light as the burrows (flat tones, no outlines, a warm line of gold under the lid) */
function chestArt(gold) {
  const W = 30, H = 24, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), B = PAL.bark, K = PAL.stone, G = PAL.gold, M = PAL.moss;
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); }, rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  g.globalAlpha = .28; rect(3, 22, 25, 1, PAL.night[0]); rect(5, 23, 21, 1, PAL.night[0]); g.globalAlpha = 1;                 /* contact shadow */
  rect(3, 12, 25, 10, B[2]); rect(3, 12, 25, 1, B[3]); rect(3, 20, 25, 2, B[1]);                                                  /* the body */
  for (let x = 8; x < 26; x += 6) rect(x, 13, 1, 7, B[1]);                                                                         /* plank seams */
  const lid = [[8, 14], [6, 18], [5, 20], [4, 22], [4, 22], [3, 24]];                                                                /* the lid, a low dome: [start, width] per row from the top */
  lid.forEach(([s, w], i) => { const y = 6 + i; rect(s, y, w, 1, i < 2 ? B[3] : B[2]); px(s + w - 1, y, B[1]); if (i === 0) rect(s + 2, y, w - 4, 1, B[4]); });
  rect(3, 11, 25, 1, B[1]);
  if (gold) { rect(4, 12, 23, 1, G[2]); rect(9, 12, 12, 1, G[3]); }                                                               /* gold shows under the lid */
  [7, 21].forEach(x => { rect(x, 8, 2, 14, K[3]); rect(x, 8, 1, 14, K[4]); px(x + 1, 21, K[2]); });                                /* iron bands */
  rect(13, 11, 4, 5, G[3]); rect(13, 11, 4, 1, G[4]); rect(13, 15, 4, 1, G[1]); px(14, 13, PAL.night[0]); px(15, 13, PAL.night[0]); px(14, 14, PAL.night[0]);   /* the lock */
  if (gold) { [[0, 20], [1, 21], [28, 21], [27, 20]].forEach(([x, y]) => { rect(x, y, 2, 1, G[3]); px(x, y, G[4]); }); }               /* a few coins on the ground */
  px(25, 5, M[3]); px(26, 6, M[2]); px(24, 6, M[4]);                                                                                /* moss on the lid */
  return cv.toDataURL();
}
/* the rough-total box in the chest: one play-money entry dated today */
(function () {
  const el = $('#hSpend'); if (!el) return;
  el.addEventListener('submit', e => {
    if (!e.target.closest('#gapForm')) return; e.preventDefault();
    const a = clampAmt($('#gapAmt').value); if (!(a > 0)) { $('#gapAmt').focus(); return; }
    const opt = Array.from($('#hCat').options).find(o => /play/i.test(o.textContent) && o.value !== CAT_NEW);
    const r = ACT.addReceipts([{ d: todayStr(), a, c: opt ? opt.value : $('#hCat').value, n: 'Rough total' }]); if (r !== false) { sfx('coin'); render(); }
  });
})();
function renderSpend() {
  const el = $('#hSpend'), p = HV.play, ym = HV.ym, V = HV, m = V.month, b = id => V.buckets.find(x => x.id === id);
  const art0 = `<img class="chest-art" alt="" aria-hidden="true" src="${chestArt(p.left > 0)}">`;
  const head = `${art0}<h2>Free to spend</h2><p class="cap chest-what">Spend this on whatever you want, it starts fresh each month</p>`;
  if (!(m.inflow > 0)) { put(el, `${head}<p class="hs-ok">Add your monthly pay and this shows what's free to spend and whether your bills are covered.</p><div class="row-btns"><button type="button" class="btn small" data-open="a">Add pay</button></div>`); return; }
  const smp = '';   /* the one sample notice is the status line at the top of Home */
  /* a few quiet days: one box to add a rough total, so a gap never makes the numbers lie */
  const lastD = (S.receipts || []).reduce((a, r) => (r.d > a ? r.d : a), ''), today = todayStr();
  const gapN = lastD && !sampleOn() && lastD.slice(0, 7) === ym ? Math.floor((Date.parse(today) - Date.parse(lastD)) / 864e5) : 0;
  const gapBox = gapN >= 3 && today.slice(0, 7) === ym ? `<form class="gapbar" id="gapForm" autocomplete="off"><p class="cap">Nothing logged for ${gapN} days. If you spent something add a rough total.</p><div class="gaprow"><div class="inp"><span class="yen cs"></span><input id="gapAmt" type="number" inputmode="decimal" min="0" step="any" placeholder="0" aria-label="Rough total spent since ${esc(lastD)}"></div><button type="submit" class="btn small">Add</button></div></form>` : '';
const links = `<p class="cap hs-more"><button type="button" class="link" data-xm>Extra money came in?</button> <button type="button" class="link" data-why="free">How is this worked out?</button></p>`;
  /* necessities: a plain yes or no, with the number behind it */
  const nec = b('nec'), covered = m.inflow >= nec.planned;
  const necRoom = V.map && V.map.month.find(r => r.id === 'nec'), necOver = necRoom && necRoom.overBy > 0 ? necRoom.overBy : 0;
  const necTile = necOver > 0 ? `<li class="bk over" style="--c:${JARVAR.nec}"><span class="bk-n"><i></i>Bills and basics</span><b>Over</b><span class="bk-s">${fmt2(necOver)} past what a bill was planned for in ${monthLabel(ym, true)}. ${necRoom && necRoom.amount > 0 ? fmt2(necRoom.amount) + ' of your bills are still to pay. ' : ''}${fmt2(nec.spent)} logged of ${fmt(nec.planned)} planned.</span></li>` : `<li class="bk${covered ? ' ok' : ' over'}" style="--c:${JARVAR.nec}"><span class="bk-n"><i></i>Bills and basics</span><b>${covered ? 'Covered' : 'Short'}</b><span class="bk-s">${covered ? (m.status === 'short' && m.left < 0 ? `Bills fit in your pay, but the whole month is short.` : C.byYm[ym] && C.byYm[ym].bankEnd < 0 ? `Bills fit in your pay, but spending past plan leaves the bank below zero.` : `${m.inflow - ((C.byYm[ym] && C.byYm[ym].draw) || 0) >= nec.planned ? 'Your pay is enough for' : 'Your pay and money borrowed from the emergency fund cover'} ${fmt(nec.planned)} of bills in ${monthLabel(ym, true)}${nec.spent > 0 ? `. ${fmt2(nec.spent)} logged.` : ''}`) : `Pay is ${fmt(V.cells.billsOverPay)} under the bills${(C.byYm[ym] && C.byYm[ym].draw) > 0 ? ', even with ' + fmt(C.byYm[ym].draw) + ' borrowed from the emergency fund' : ''}.`}</span></li>`;
  /* spent past this month's plan: the burrow's own pile covers what it can, the rest comes out of the bank (the same split as the Receipts table) */
  const WHAT = { edu: 'For courses and books.', give: 'For charity and gifts.' };
  const bankPart = x => ((V.cells && V.cells[x.id]) || { bank: 0 }).bank;   /* the part of a pile overspend the bank pays (model.js viewOf cells) */
  const pileCovers = x => x.left < 0 && bankPart(x) < 0.005;
  const tile = x0 => { const x = x0, T = (V.cells && V.cells[x.id]) || { over: 0, bank: 0, pile: 0 }, o = T.over, bk = T.bank, pl = T.pile, mon = monthLabel(ym, true);
    const sub = x.planned <= 0 ? '' : o > 0 ? `${fmt(o)} more than the ${fmt(x.planned)} for ${mon}. ` + (bk < 0.005 ? 'All of it came from the pile. ' : pl > 0 ? `${fmt(pl)} came from the pile, ${fmt2(bk)} is over and comes out of the bank. ` : `It comes out of the bank. `) : 'left of the ' + fmt(x.planned) + ' for ' + mon + '. ';
    return `<li class="bk${bk >= 0.005 ? ' over' : ''}" style="--c:${JARVAR[x.id]}"><span class="bk-n"><i></i>${esc(x.name)}</span><b>${o > 0 ? (bk >= 0.005 ? '−' + fmt2(bk) : fmt2(0)) : fmt2(x.left)}</b><span class="bk-s">${sub}${WHAT[x.id] || ''}</span></li>`; };
  const tiles = `<ul class="bkl chl">${necTile}${tile(b('edu'))}${tile(b('give'))}</ul>${V.otherSpent > 0 ? `<p class="cap">${fmt2(V.otherSpent)} logged as Other, so it didn't come out of a pile</p>` : ''}`;
  if (p.planned <= 0 && p.spent <= 0) { put(el, `${head}<p class="hs-lbl">Free to spend in ${monthLabel(ym)}</p><p class="hs-big zero">${fmt(0)}</p><p class="cap">No free to spend planned for ${monthLabel(ym)}.</p><div class="row-btns"><button type="button" class="btn small" data-open="play">Set in Plan</button></div>${smp}${sampleOn() ? '' : links}${tiles}`); return; }
  /* free to spend can never be more than the plan can afford: when the month would end under the safety minimum, that gap is held back */
  const fo = freeOf(S, m, p), held = fo.held, freeLeft = fo.free;
  const wk = p.perWeek != null && freeLeft > 0 ? `<b>${fmtAbout(V.cells.perWeek)}</b> a week to stay inside it for the ${plural(p.daysLeft, 'day')} left.` : `${plural(p.daysLeft, 'day')} left.`;
  const chip = p.over ? `<span class="chip short">${IC.bad}Over</span>` : p.ahead ? `<span class="chip tight">${IC.warn}Ahead of pace</span>` : `<span class="chip good">${IC.ok}On pace</span>`;

  const playRm = ((V.map && V.map.month) || []).find(r => r.id === 'play'), notSafe = !!(playRm && playRm.notCovered && !sampleOn());   /* the same rule as the top of Home (QC10 round 2 numbers should-fix 4) */
  const free = !p.over && p.planned > 0 && m.status === 'good' && !sampleOn() && !notSafe;
  put(el, `${head}<p class="hs-lbl">${p.over ? 'Over free to spend in ' : 'Free to spend in '}${monthLabel(ym)}</p><p class="hs-big${p.over ? ' neg' : ''}" style="--n:${fmt2(freeLeft).length}">${fmt2(freeLeft)}</p>
    <div class="hs-bar${p.over ? ' over' : ''}" role="img" aria-label="${fmt2(p.spent)} of ${fmt(p.planned)} spent"><i style="width:${p.frac * 100}%"></i><span class="pace" style="left:${p.dayFrac * 100}%"></span></div><p class="cap hs-key">The bar is what you've spent and the mark is how far through the month you are</p>
    <p class="hs-sub">${p.count ? `Spent ${fmt2(p.spent)} of ${fmt(p.planned)}.` : `Nothing logged yet. ${fmt(p.planned)} planned.`} ${p.over ? '' : wk}${!p.over && freeLeft > 0 && p.daysLeft > 0 ? ` About <b>${fmtAbout(V.cells.perDay)}</b> a day.` : ''}</p>${p.over && freeLeft < 0 ? `<p class="hs-ok warn">${fmt2(V.cells.freeOver)} came out of your bank, so don't spend any more from Free to spend this month.</p>` : ''}${held > 0 ? `<p class="hs-ok warn">${fmt(held)} is held back because spending it would leave your bank under your ${fmt(cfg(S, 'minBank'))} minimum.</p>` : ''}${p.count || p.over ? chip : ''}${notSafe ? `<p class="hs-sub">Not safe to spend yet: your bank${nowOf(S).cards.length ? ' after the cards' : ''} is less than your bills still to pay and Free to spend.</p>` : ''}${free ? `<p class="hs-ok">Bills and burrows are planned for, so this part is free to spend.${V.main && V.main.live && V.main.pct < 100 ? ` What's left at month end can go toward ${esc(goalById(S, V.main.id).name)}.` : ''}</p>` : ''}${gapBox}${smp}${sampleOn() ? '' : links}${tiles}`);
}
/* a row opens to show its details; which ones are open survives a redraw */
const HOPEN = new Set();
function goalRowHtml(r) {
  const g = goalById(S, r.id), main = HV.main && HV.main.id === r.id;
  if (!g) return '';
  const st = r.state === 'ontrack' || r.state === 'full' || r.state === 'paid' ? 'good' : r.state === 'behind' || r.state === 'noeta' || r.state === 'short' ? 'warn' : 'plain';
  const stw = { ontrack: 'On track', full: r.kind === 'debt' ? 'Paid off' : 'Full', paid: 'Paid', short: 'Short', behind: 'Behind', noeta: 'Slow', eta: r.kind === 'debt' ? 'Paying' : 'Filling', unset: 'Unset', none: '' }[r.state] || '';
  const eta = r.state === 'paid' ? `Paid ${dateLabel(g.due)}` : r.state === 'short' ? `Had ${fmt(r.had)} of ${fmt(g.target)}` : r.state === 'unset' ? 'No amount' : r.reached ? dwr(r, `Full ${monthLabel(r.reached)}`) : dwr(r, `Not full in ${SPAN}`);
  /* the small line is the reason in the person's words; a stock purpose that only repeats the name gives way to the numbers */
  const pp = purposeFor(g), small = g.why || (pp.toLowerCase().indexOf(String(g.name).toLowerCase()) === 0 && r.target > 0 ? `${fmt(r.saved)} of ${fmt(r.target)}` : pp);
  return `<li class="gd"><details data-hgid="${esc(r.id)}"${HOPEN.has(r.id) ? ' open' : ''} style="--c:var(--c${g.slot})"><summary><i class="dot"></i><span class="gd-t"><b>${esc(g.name)}</b><small>${esc(small)}</small></span><span class="gd-m${main ? ' main' : ''}">${esc(monthsShort(r))}</span></summary>
    <div class="gd-b"><div class="hg-b" role="img" aria-label="${r.pct} percent"><i style="width:${fracOf(r) * 100}%"></i></div>
    <p class="gd-n"><span>${fmt(r.saved)} of ${fmt(r.target)}</span><span>${esc(eta)}</span></p>${stw ? `<p class="gd-c"><em class="${st}">${stw}</em>${main ? '<span class="gd-main">Main goal</span>' : ''}</p>` : (main ? '<p class="gd-c"><span class="gd-main">Main goal</span></p>' : '')}
    <div class="row-btns"><button type="button" class="btn small" data-tab-go="goals">Edit goal</button>${!main && r.live ? `<button type="button" class="btn small" data-main="${esc(r.id)}">Set as main goal</button>` : ''}</div></div></details></li>`;
}
function renderGoalsHome() {
  const el = $('#hGoals'), rows = HV.goals, gs = S.plan.goals;
  put(el, `<div class="hgl-h"><h2>Burrows</h2>${gs.length < MAX_GOALS ? '<button type="button" class="btn small solid" data-gw>Add a burrow</button>' : ''}</div>` + (gs.length ? `<ul class="gdl">${rows.map(goalRowHtml).join('')}</ul>${goalsGraph()}` : '<p class="cap">No burrows yet, add one and it shows up here</p>'));
}
/* one graph for every goal still being saved for: each line is the share of that goal saved by the plan, month by month, so a big goal and a small one share a graph.
   A line stops at the month its goal is full. */
let GG = null, GGD = false;
function goalsGraph() {
  GG = null;
  const ym0 = HV.ym, i0 = MONTHS.indexOf(ym0), lastI = MONTHS.length - 1, live = HV.goals.filter(r => r.live);
  if (live.length < 2) return '';
  const ser = live.map(r => {
    const g = goalById(S, r.id), ir = r.reached ? Math.max(i0, MONTHS.indexOf(r.reached)) : lastI, v = [C.byYm[ym0].balBefore[g.id]];
    for (let k = i0; k <= ir; k++) v.push(C.months[k].bal[g.id] + (C.months[k].spent[g.id] || 0));
    return { g, reached: r.reached, v: v.map(x => Math.max(0, Math.min(x, g.target))) };
  });
  const n = Math.max(...ser.map(s => s.v.length)), W = heroW(), H = 200, L = 40, R = 12, T = 14, B = 28;
  const X = i => L + i * (W - L - R) / Math.max(1, n - 1), Y = f => T + (1 - f) * (H - T - B), f = (s, i) => s.v[i] / s.g.target;
  const step = Math.max(1, Math.ceil((n - 1) / 4)), ticks = [];
  for (let i = 0; i < n; i += step) ticks.push(i);
  if (ticks[ticks.length - 1] !== n - 1) { if (n - 1 - ticks[ticks.length - 1] < step * .6) ticks.pop(); ticks.push(n - 1); }
  const tl = i => i === 0 ? 'Now' : monthLabel(MONTHS[i0 + i - 1], true) + ' ' + MONTHS[i0 + i - 1].slice(2, 4);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc('Share of each goal saved, month by month: ' + ser.map(x => x.g.name + (x.reached ? ', full in ' + monthLabel(x.reached) : ', not full within ' + SPAN)).join('; '))}"><title>All your goals</title>`;
  [0, .5, 1].forEach(p => { s += `<line class="${p === 1 ? 'gg-t' : 'gg-g'}" x1="${L}" x2="${W - R}" y1="${Y(p)}" y2="${Y(p)}"/><text class="gg-x" x="${L - 8}" y="${Y(p) + 4}" text-anchor="end">${p * 100}%</text>`; });
  ticks.forEach(i => { s += `<text class="gg-x" x="${X(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${tl(i)}</text>`; });
  ser.forEach(x => {
    const line = x.v.map((_, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(f(x, i)).toFixed(1)).join('');
    s += `<g data-id="${esc(x.g.id)}" data-v="${x.v.join(',')}" style="--c:var(--c${x.g.slot})"><path class="gg-l${GGD ? '' : ' draw'}" d="${line}"/>` + (x.reached ? `<circle class="gg-p" cx="${X(x.v.length - 1).toFixed(1)}" cy="${Y(1)}" r="5.5"/>` : '') + '</g>';
  });
  GGD = true;
  s += `<line id="ggX" class="gg-c" x1="-20" x2="-20" y1="${T}" y2="${H - B}"/>` + ser.map((x, k) => `<circle id="ggD${k}" class="gg-p" r="4.5" cx="-20" cy="-20" style="--c:var(--c${x.g.slot})"/>`).join('') + '</svg>';
  GG = { ser, X, Y, W, n, i0, L, R, f, tl };
  return `<details class="gg-wrap" id="ggWrap"${HOPEN.has('*graph') ? ' open' : ''}><summary>See every goal on one graph</summary><div class="gg" id="hGGraph">${s}</div></details>`;
}
const ggPct = (v, t) => v >= t ? 100 : Math.min(99, Math.floor(v / t * 100));
function ggMove(e) {
  if (!GG) return; const svg = $('#hGGraph svg'); if (!svg) return;
  const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * GG.W, st = (GG.W - GG.L - GG.R) / Math.max(1, GG.n - 1);
  const i = Math.max(0, Math.min(GG.n - 1, Math.round((x - GG.L) / st))), cx = $('#ggX');
  if (cx) { cx.setAttribute('x1', GG.X(i)); cx.setAttribute('x2', GG.X(i)); }
  const rows = GG.ser.map((s, k) => {
    const j = Math.min(i, s.v.length - 1), v = s.v[j], d = $('#ggD' + k);
    if (d) { d.setAttribute('cx', GG.X(j)); d.setAttribute('cy', GG.Y(v / s.g.target)); }
    return `<i style="--c:var(--c${s.g.slot})"></i><b>${esc(s.g.name)}</b> ${fmt(v)} of ${fmt(s.g.target)} (${v >= s.g.target ? 'full' : ggPct(v, s.g.target) + '%'})`;
  });
  showTip(`<b>${i === 0 ? 'Now' : monthLabel(MONTHS[GG.i0 + i - 1]) + ' (end)'}</b><br>${rows.join('<br>')}`, e.clientX, e.clientY);
}
function ggClear() { hideTip(); const cx = $('#ggX'); if (cx) { cx.setAttribute('x1', -20); cx.setAttribute('x2', -20); } $$('#hGGraph circle[id^="ggD"]').forEach(d => d.setAttribute('cx', -20)); }
/* Investing is the one pot that only grows: money you invest and never spend, so it sits with the goals, not in the chest */
function renderBuckets() {
  /* retired in 38.29: Investing is now a room in the Burrows section of Home */
  const el = $('#hBuckets'); if (el) el.hidden = true; return;
  const V = HV, f = V.buckets.find(x => x.id === 'ffa'); if (!f) return;
  if (!(V.month.inflow > 0) || !(f.planned > 0 || f.total > 0)) { el.hidden = true; return; }
  el.hidden = false;
  put(el, `<h2>Investing</h2><p class="hs-lbl">Planned this month. Invested and never spent.</p><p class="hs-big" style="--n:${fmt(f.planned).length}">${fmt(f.planned)}</p><p class="hs-sub">${f.total > f.planned ? `<b>${fmt(f.total)}</b> planned in total so far. ` : ''}It only grows, and one day it pays you.</p>${sampleOn() ? '<p class="cap">Sample numbers.</p>' : ''}`);
}
/* the reminder under the tabs on every other page: what you are working toward, how close it is, and what is left to spend */
function renderBand() {
  const el = $('#mgBand'); if (!el) return;
  const V = HV, r = V && V.main;
  if (!r || tab === 'home' || tab === 'basics') { el.hidden = true; return; }
  const g = goalById(S, r.id), p = V.play, when = dwr(r, r.pct >= 100 ? 'Full' : r.reached ? (r.months <= 0 ? 'This month' : plural(r.months, 'month') + ' to go') : r.grows === false ? 'Not growing: nothing goes in' : 'Over ' + SPAN);
  if (!g) { el.hidden = true; return; }
  const purpose = g.why || g.name;
  put(el, `<span class="mg-l" style="--c:var(--c${g.slot})"><i class="dot"></i><b>${esc(purpose)}</b><em>${when}</em></span><span class="mg-bar" aria-hidden="true" style="--c:var(--c${g.slot})"><i style="width:${fracOf(r) * 100}%"></i></span><span class="mg-s">${sampleOn() ? 'Sample numbers. ' : ''}${V.map.free < 0 ? 'Free to spend: ' + fmt2(V.cells.freeOver) + ' over' : 'Free to spend: ' + fmt2(V.map.free) + ' left'}, ${monthLabel(V.ym, true)}</span>`);
  el.setAttribute('aria-label', `Main goal: ${g.name}${g.why ? ', ' + g.why : ''}. ${when}. ${V.map.free < 0 ? 'Free to spend ' + fmt2(V.cells.freeOver) + ' over' : 'Free to spend ' + fmt2(V.map.free) + ' left'}. Tap for Home.`);
  el.hidden = false;
}
/* A custom goal gets a line of its own from Claude ("You can go surfing") when this page is open from its Claude link. Only the goal's name is sent.
   Anywhere else, or if Claude says no, the built-in wording stays. Each name is tried once per visit; the answer is kept with the plan. */
let winBusy = false; const winTried = {};
const winCustom = g => { const k = kindOfGoal(S, g); return !g.emergency && g.name && !(PURPOSE_OF_KIND[k] && g.name === GOAL_DEFAULT_NAME[k]); };
async function queueWins(connect) {
  if (winBusy || !inArtifact()) return;
  const todo = () => S.plan.goals.filter(g => winCustom(g) && !(S.ui.win && S.ui.win[g.id] && S.ui.win[g.id].n === g.name) && !winTried[g.id + '|' + g.name]);
  if (!todo().length) return;
  winBusy = true;
  try {
    if (!askFn) { if (!connect) return; await connectAsk(); }
    if (!askFn) return;
    for (const g of todo().slice(0, 6)) {
      winTried[g.id + '|' + g.name] = true;
      const name = g.name.replace(/["\r\n\\]+/g, ' ').trim().slice(0, 60);
      const ask = `You write one short status line for a budgeting page. Someone is saving up for: "${name}". Write what having this money allows, as a plain statement of 2 to 6 words, like a label on a machine. No period, no numbers, no emoji, no quotes, no "you". Examples: "Buy a surfboard" becomes "Ready to surf". "Japan with the family" becomes "Japan trip paid". "New laptop" becomes "Laptop paid for". Reply with only the line.`;
      try {
        const r = await askFn([{ role: 'user', content: ask }], { cache: false, modelTier: 'quick' });
        const t = cleanWin(String((r && r.text) || '').split('\n').filter(x => x.trim())[0] || '');
        const cur = goalById(S, g.id);
        if (t && cur && cur.name === g.name) { S.ui.win = Object.assign({}, S.ui.win, { [g.id]: { n: g.name, t } }); persist(); render(); }
      } catch (e) { if (e && ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'cancelled'].indexOf(e.code) >= 0) break; }
    }
  } finally { winBusy = false; }
}
function pulseBand() { [$('#mgBand'), $('#hSpend'), $('#hHero')].forEach(e => { if (!e) return; e.classList.remove('pulse'); void e.offsetWidth; e.classList.add('pulse'); }); }
function syncQuick() {
  const rc = $('#rcCat'), hc = $('#hCat'), sig = rc.innerHTML;
  if (hc.dataset.sig !== sig) { const keep = hc.value || S.ui.rcCat || rc.value; hc.innerHTML = sig; hc.dataset.sig = sig; hc.value = Array.from(hc.options).some(o => o.value === keep) ? keep : rc.value; }
  if (hc.value !== CAT_NEW) hc.dataset.prev = hc.value;
  syncOtherTitle('hCat', 'hNote');
  const d = $('#hDate'); d.min = START + '-01'; d.max = END + '-31'; if (!d.value) { d.value = todayStr(); if (typeof dpSync === 'function') dpSync($('#hQuick')); }
}
/* what Home can show, in the usual order. S.ui.home (set through ACT.setHome, for example by the assistant) reorders or hides these cards;
   the status, next-step and backup cards always stay on top. */
const HOME_SECTIONS = ['play', 'log', 'goal', 'goals', 'debts', 'limits', 'jars', 'more'];
const HOME_EL = { goal: 'hHero', play: 'hSpend', log: 'hQuick', goals: 'hGoals', debts: 'hDebts', limits: 'hLimits', jars: 'hBuckets', more: 'hMore' };
let homeOrderSig = '';
function applyHomeOrder() {
  const order = Array.isArray(S.ui.home) && S.ui.home.length ? S.ui.home.filter(id => HOME_SECTIONS.indexOf(id) >= 0) : HOME_SECTIONS;
  const sig = order.join(); if (sig === homeOrderSig) return; homeOrderSig = sig;
  const panel = $('#p-home'); if (!panel) return;
  HOME_SECTIONS.forEach(id => { const el = $('#' + HOME_EL[id]); if (el) el.hidden = order.indexOf(id) < 0; });
  order.forEach(id => { const el = $('#' + HOME_EL[id]); if (el) panel.append(el); });
}
const FOOT_SAMPLE = 'Not financial advice. The sample numbers are made up, replace them with yours.', FOOT_OWN = 'Not financial advice.';
function paintFoot() { const el = $('#footNote'); if (!el) return; const t = sampleOn() ? FOOT_SAMPLE : FOOT_OWN; if (el.textContent !== t) el.textContent = t; }
function renderHome() {
  if (!C) return;
  checkBadges(); paintSnd(); paintBk(); paintFoot();
  if (tab !== 'home') return;
  applyHomeOrder();
  safe(renderMap, '#hMap'); safe(renderNext, '#hNext'); safe(() => BUR.home(), '#hBur'); safe(renderBackupNudge, '#hBk'); safe(renderStatus, '#hStatus'); safe(syncQuick, null, 'quick'); safe(renderHero, '#hHero'); safe(renderSpend, '#hSpend'); safe(renderGoalsHome, '#hGoals'); safe(renderHomeDebts, '#hDebts'); safe(renderLimits, '#hLimits'); safe(renderBuckets, '#hBuckets'); safe(renderStreak, '#hStreak'); safe(renderBadges, '#hBadges');
  safe(homeV1, null, 'v1');
  placePix(); /* the pixel plants, back in their corners after the cards were redrawn */
}
/* ---------- version one Home (Mako, 2026-11-18): the picture, the four numbers and one next action; everything else waits behind More ----------
   Nothing is deleted: every card is still drawn and still works, it is only out of sight until it is needed or the person taps More.
   The one action, in this order: the new-address banner, a step from renderNext that matters now, the backup reminder; with none of these,
   the Log spend card is the action. The status line shows only when it says something needs attention (or that the numbers are samples). */
let HOME_ALL = false, QUICK_OPEN = false;
const V1_EXTRA = ['hHero', 'hSpend', 'hGoals', 'hDebts', 'hLimits', 'hBuckets', 'hMore'];
function homeV1() {
  const panel = $('#p-home'); if (!panel) return;
  const nx = $('#hNext'), bk = $('#hBk'), acts = [$('#moveBanner'), bk && bk.dataset.urgent ? bk : null, nx && nx.dataset.v1 === 'now' ? nx : null, bk].filter(e => e && !e.hidden);
  const action = acts[0] || null, logIsNext = !action;
  ['moveBanner', 'hBk', 'hNext'].forEach(id => { const e = $('#' + id); if (e) e.classList.toggle('v1x', e !== action && !(HOME_ALL && e.dataset.v1 === 'later')); });
  /* the Log spend card sits right under the action place, above the burrows, whenever it is the action or was opened */
  const q = $('#hQuick'), bur = $('#hBur');
  if (q && bur && q.nextElementSibling !== bur) panel.insertBefore(q, bur);
  if (q) q.classList.toggle('v1x', !(logIsNext || QUICK_OPEN || HOME_ALL));
  V1_EXTRA.forEach(id => { const e = $('#' + id); if (e) e.classList.toggle('v1x', !HOME_ALL); });
  const st = $('#hStatus'); if (st) st.classList.toggle('v1x', !HOME_ALL && !!st.querySelector('.chip.good') && !st.querySelector('.hst-w.warn'));   /* a month coming up short keeps the card on Home (QC round 4 north-star 3) */
  /* the burrow amounts include this month's planned saving: say so on the heading, as every Home figure does (LAUNCH_CHECKLIST A1) */
  const bh = $('#hBur .hb-h'); if (bh && !bh.querySelector('.ntag')) bh.insertAdjacentHTML('beforeend', ' <em class="ntag plan">planned</em>');
  let mb = $('#hMoreBtn');
  if (!mb) { mb = document.createElement('button'); mb.type = 'button'; mb.id = 'hMoreBtn'; mb.className = 'btn hv1-more'; mb.addEventListener('click', () => { HOME_ALL = !HOME_ALL; sfx('tap'); renderHome(); }); }
  if (bur && mb.previousElementSibling !== bur) bur.after(mb);
  mb.textContent = HOME_ALL ? 'Show less' : 'More: Free to spend, goals, cards, streak'; mb.setAttribute('aria-expanded', String(HOME_ALL));
}

/* ---------- add a goal: what, how much, by when ---------- */
let GW = null;
const GW_QUICK = [['6 months', 6], ['1 year', 12], ['2 years', 23], ['No date', 0]];
const gwKinds = () => GOAL_KINDS.filter(k => !(k.em && S.plan.goals.some(g => g.emergency)));
function gwDate(months) { const d = new Date(); d.setMonth(d.getMonth() + months); let s = ymd(d); const hi = END + '-28'; if (s > hi) s = hi; return s; }
function gwPlan() {
  const cost = clampAmt(GW.cost), saved = clampAmt(GW.saved), rem = Math.max(0, cost - saved), u = roundUnit(S);
  if (!(cost > 0)) return { txt: 'Enter the cost to see the monthly amount.' };
  if (rem <= 0) return { txt: GW.kind && GW.kind.debt ? 'Already paid off in full.' : 'Already saved in full. Shows as full.', ok: true };
  if (GW.due && !GW.kind.em) {
    const rb = readyBy({ due: GW.due }), n = rb ? ymCount(planFromOf(S), rb) : 0;
    if (n < 1) return { txt: 'Too soon to save anything by then. Pick a later date.', bad: true };
    return { txt: `${GW.kind && GW.kind.debt ? 'Pay about' : 'Save about'} <b>${fmt(wizardMonthly(S, GW.cost, GW.saved, n))}</b> a month for ${plural(n, 'month')}. ${GW.kind && GW.kind.debt ? 'Paid off' : 'Ready'} by ${dateLabel(GW.due)}.`, ok: true };
  }
  return { txt: `No date, so the plan assumes 12 months. About <b>${fmt(wizardMonthly(S, GW.cost, GW.saved, 12))}</b> a month.`, ok: true };
}
function openGoalWizard() {
  if (S.plan.goals.length >= MAX_GOALS) { cheer(`Limit: ${MAX_GOALS} burrows.`); return; }
  GW = { step: 0, kind: null, name: '', why: '', cost: '', saved: '', due: '', ret: document.activeElement, dir: 0 };
  let el = $('#gw');
  if (!el) {
    el = document.createElement('div'); el.id = 'gw'; el.className = 'gw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'gwT'); document.body.appendChild(el);
    el.addEventListener('click', gwClick); el.addEventListener('input', gwInput);
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeGoalWizard(); return; }
      if (e.key === 'Enter' && e.target.matches('input') && !e.target.closest('.dpb')) { e.preventDefault(); gwNext(); return; }
      if (e.key === 'Tab') { const f = $$('button:not([disabled]), input:not([type=hidden]):not(.dp-native), select:not(.dp-native), [href]', el).filter(x => x.offsetParent); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
  }
  el.hidden = false; paintGW(); requestAnimationFrame(() => el.classList.add('on')); sfx('whoosh');
  document.body.classList.add('gw-open');
}
function closeGoalWizard(done) {
  const el = $('#gw'); if (!el || el.hidden) return;
  el.classList.remove('on'); document.body.classList.remove('gw-open');
  setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 200);
  if (GW && GW.ret && GW.ret.focus && !done) try { GW.ret.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  GW = null;
}
function paintGW() {
  const el = $('#gw'), g = GW, k = g.kind, steps = 3;
  const dots = `<ol class="gw-dots" aria-label="Step ${g.step + 1} of ${steps}">${[0, 1, 2].map(i => `<li class="${i < g.step ? 'done' : i === g.step ? 'on' : ''}"></li>`).join('')}</ol>`;
  let t, body, nextTxt = 'Next';
  if (g.step === 0) {
    t = 'Goal type';
    body = `<div class="gw-chips" role="group" aria-label="Goal type">${gwKinds().map(x => `<button type="button" class="gw-chip${k && k.k === x.k ? ' on' : ''}" data-kind="${x.k}" aria-pressed="${!!(k && k.k === x.k)}"><b>${x.pick}</b><span>${x.hint}</span></button>`).join('')}</div>
      <div class="field"><label for="gwName">Name</label><input class="txt" id="gwName" type="text" maxlength="60" value="${esc(g.name)}" placeholder="${esc(S.plan.goals.some(x => /japan trip/i.test(x.name)) ? 'Name it' : 'Japan trip')}"></div>
      <div class="field"><label for="gwWhy">Why (optional)</label><input class="txt" id="gwWhy" type="text" maxlength="80" value="${esc(g.why)}" placeholder="Why it matters, in your words"><p class="cap">It shows with the goal so you keep seeing why</p></div>`;
  } else if (g.step === 1) {
    t = 'Amount';
    body = `<div class="field"><label for="gwCost">${k && k.debt ? 'Total owed' : 'Total cost'}</label><div class="inp"><span class="yen cs"></span><input id="gwCost" type="number" inputmode="numeric" min="0" step="any" value="${esc(g.cost)}" placeholder="0"></div>${k && k.cost ? `<p class="cap">${k.cost}</p>` : ''}</div>
      <div class="field"><label for="gwSaved">${k && k.debt ? 'Already paid off' : 'Already saved'}</label><div class="inp"><span class="yen cs"></span><input id="gwSaved" type="number" inputmode="numeric" min="0" step="any" value="${esc(g.saved)}" placeholder="0"></div></div>`;
  } else {
    t = k && k.em ? 'Plan' : 'Date'; nextTxt = 'Add a burrow';
    body = (k && k.em ? '' : `<div class="field"><label for="gwDue">${k && k.debt ? 'Paid off by' : 'Needed by'}</label><input type="date" id="gwDue" value="${esc(g.due)}" min="${todayStr()}" max="${END}-28"></div>
      <div class="gw-quick" role="group" aria-label="Quick dates">${GW_QUICK.map(q => `<button type="button" class="chipbtn${(q[1] === 0 ? !g.due : g.due === gwDate(q[1])) ? ' on' : ''}" data-q="${q[1]}">${q[0]}</button>`).join('')}</div>`)
      + `<p class="gw-plan" id="gwPlan" aria-live="polite"></p>`;
  }
  el.innerHTML = `<div class="gw-scrim" data-gwx></div><div class="gw-card"><div class="gw-top">${dots}<button type="button" class="ask-x" data-gwx aria-label="Close">&times;</button></div>
    <h2 id="gwT">${t}</h2><div class="gw-body ${g.dir > 0 ? 'in-r' : g.dir < 0 ? 'in-l' : ''}">${body}</div>
    <p class="cap gw-hint" id="gwHint" role="status"></p>
    <div class="gw-foot">${g.step > 0 ? '<button type="button" class="btn" data-gwback>Back</button>' : '<span></span>'}<button type="button" class="btn solid" id="gwNext" data-gwnext>${nextTxt}</button></div></div>`;
  $$('.cs', el).forEach(e => { e.textContent = sym(); });
  gwRefresh();
  const f = $(g.step === 0 ? '#gwName' : g.step === 1 ? '#gwCost' : '#gwDue', el); if (f && g.step !== 0) setTimeout(() => { if (g && f.focus) f.focus({ preventScroll: true }); }, 60);
  g.dir = 0;
}
function gwRefresh() {
  const g = GW, el = $('#gw'); if (!g || !el) return;
  const n = $('#gwNext'); if (!n) return;
  /* the button stays tappable: a tap too early says what is missing instead of doing nothing */
  let wait = '';
  if (g.step === 0) wait = !g.kind ? 'Pick a goal type first.' : !g.name.trim() ? 'Give the goal a name.' : '';
  else if (g.step === 1) wait = !(+g.cost > 0) ? (g.kind && g.kind.debt ? 'Enter how much you owe.' : 'Enter the total cost.') : '';
  else { const p = gwPlan(), pe = $('#gwPlan'); if (pe) { pe.innerHTML = p.txt; pe.classList.toggle('bad', !!p.bad); } wait = p.bad ? 'Change the date or the amount first.' : !(+g.cost > 0) ? 'Enter the total cost.' : ''; }
  n.classList.toggle('dim', !!wait); n.setAttribute('aria-disabled', String(!!wait)); n.dataset.wait = wait;
  const h = $('#gwHint'); if (h && !wait) h.textContent = '';
  if (typeof dpSync === 'function') dpSync(el);
}
function gwInput(e) {
  const g = GW, t = e.target; if (!g) return;
  if (t.id === 'gwName') g.name = t.value; else if (t.id === 'gwWhy') g.why = t.value; else if (t.id === 'gwCost') g.cost = t.value; else if (t.id === 'gwSaved') g.saved = t.value;
  else if (t.id === 'gwDue') { g.due = t.value; $$('.gw-quick .chipbtn').forEach(b => { const q = +b.dataset.q; b.classList.toggle('on', q === 0 ? !g.due : g.due === gwDate(q)); }); }
  gwRefresh();
}
function gwNext() {
  const g = GW; if (!g) return; const n = $('#gwNext'); if (n && n.dataset.wait) { sfx('off'); const h = $('#gwHint'); if (h) h.textContent = n.dataset.wait; return; }
  if (g.step < 2) { g.step++; g.dir = 1; sfx('next'); paintGW(); return; }
  gwFinish();
}
function gwFinish() {
  const g = GW, k = g.kind; if (!g || !k) return;
  /* the goal already leading Home stays the main goal; a new one does not take its place unasked */
  if (!(S.ui.main && goalById(S, S.ui.main)) && HV && HV.main && goalById(S, HV.main.id)) S.ui.main = HV.main.id;
  const id = addGoal(S, g.name.trim() || k.name); if (!id) { closeGoalWizard(); return; }
  updateGoal(S, id, { target: g.cost, start: g.saved || 0, due: k.em ? '' : g.due, why: g.why || '' });
  if (k.em) updateGoal(S, id, { emergency: true });
  S.ui.gk = S.ui.gk || {}; S.ui.gk[id] = k.k; markDone('goals', true); persist();
  closeGoalWizard(true); editGoal = null; restructure(); queueWins(true);
  const gi = goalInfo(S, C, id, nowYm());
  sfx('fanfare');
  celebrate('big', gi.reached ? `Goal added. ${S.plan.goals.find(x => x.id === id).name}: full ${monthLabel(gi.reached)}.` : 'Goal added.');
  if (tab !== 'home' && tab !== 'goals') switchTab('home');
}
function gwClick(e) {
  const g = GW; if (!g) return;
  if (e.target.closest('[data-gwx]')) { closeGoalWizard(); return; }
  const kd = e.target.closest('[data-kind]');
  if (kd) {
    const x = GOAL_KINDS.find(y => y.k === kd.dataset.kind); if (!x) return;
    const prev = g.kind; if (!g.name.trim() || (prev && g.name === prev.name)) g.name = x.name; g.kind = x; sfx('tap');
    $$('.gw-chip').forEach(b => { const on = b === kd; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const nm = $('#gwName'); if (nm) nm.value = g.name; gwRefresh(); return;
  }
  const q = e.target.closest('[data-q]');
  if (q) { const m = +q.dataset.q; g.due = m ? gwDate(m) : ''; const di = $('#gwDue'); if (di) di.value = g.due; sfx('tap'); $$('.gw-quick .chipbtn').forEach(b => b.classList.toggle('on', b === q)); gwRefresh(); return; }
  if (e.target.closest('[data-gwback]')) { if (g.step > 0) { g.step--; g.dir = -1; sfx('back'); paintGW(); } return; }
  if (e.target.closest('[data-gwnext]')) gwNext();
}

/* ---------- wiring ---------- */
function wireHome() {
  if ('ResizeObserver' in window) { let last = 0; new ResizeObserver(() => { const w = $('#hHero').clientWidth; if (w && Math.abs(w - last) > 2) { last = w; if (HV && C && tab === 'home') { homeView(); renderHero(); renderGoalsHome(); } } }).observe($('#hHero')); }
  $('#hForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = $('#hDate').value || todayStr(), a = +$('#hAmt').value, c = $('#hCat').value, n = $('#hNote').value, msg = $('#hMsg');
    if ($('#hAmt').dataset.neg) { msg.textContent = 'Type the amount without a minus sign because a receipt is money you spent. For a refund, lower or delete the receipt it pays back.'; $('#hAmt').value = ''; delete $('#hAmt').dataset.neg; $('#hAmt').focus(); sfx('off'); return; }
    if (!(wholeAmt(S, a) > 0)) { msg.textContent = 'Enter an amount.'; $('#hAmt').focus(); sfx('off'); return; }
    if (wholeAmt(S, a) > 1e9) { msg.textContent = 'That amount is too big. The most is 1,000,000,000.'; $('#hAmt').focus(); sfx('off'); return; }
    if (!validDate(d) || MONTHS.indexOf(d.slice(0, 7)) < 0) { msg.textContent = `Date must be ${monthLabel(START)} to ${monthLabel(END)}.`; return; }
    if (d > todayStr() && !futureOk(d, msg, $('#hSave'))) { const dt = $('.hmore'); if (dt) dt.open = true; return; }
    if (c === CAT_NEW) { msg.textContent = 'Add the new category, or pick one from the list.'; $('#hNewName').focus(); sfx('off'); return; }
    if (isDupRc(d, a, c, n) && !dupOk(d, a, c, n, msg, $('#hSave'))) return;
    if (!bigOk(d, wholeAmt(S, a), msg, $('#hSave'))) { $('#hAmt').focus(); return; }
    if (needTitle(c, n)) { const dt = $('.hmore'); if (dt) dt.open = true; msg.textContent = 'Add a short title, like “Vet bill”'; $('#hNote').focus(); sfx('off'); return; }
    const first = !(S.receipts || []).length, nm = c === 'other' ? 'Other' : shownLine((lineByKey(S, c) || { name: 'Other' }).name);
    const rid = addReceipt(S, d, a, c, n); S.ui.rcCat = c; markDone('receipts', true);
    $('#hAmt').value = ''; delete $('#hAmt').dataset.neg; $('#hNote').value = ''; syncOtherTitle('hCat', 'hNote'); $('#hDate').value = todayStr(); if (typeof dpSync === 'function') dpSync($('#hQuick'));
    msg.textContent = `Logged ${fmt2(wholeAmt(S, a))}: ${nm}.`;
    persist(); render(); afterLog(first); $('#hAmt').focus();
    rcUndo(rid, `Logged ${fmt2(wholeAmt(S, a))}: ${nm}.`);   /* one tap takes this receipt back out (38.31 data safety round) */
  });
  $('#hAmt').addEventListener('input', () => { $('#hMsg').textContent = ''; });
  /* a minus sign typed first is refused with a plain reason, never quietly turned into spending */
  ['hAmt', 'rcAmt'].forEach(id => { const el = $('#' + id); if (!el) return; const flag = s => { if (/^\s*[-\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/.test(s)) el.dataset.neg = '1'; };
    el.addEventListener('keydown', e => { if ((e.key === '-' || e.key === '\u2212') && (el.selectionStart || 0) === 0) el.dataset.neg = '1'; });
    el.addEventListener('beforeinput', e => { if ((el.selectionStart || 0) === 0 && e.data) flag(e.data); });
    el.addEventListener('paste', e => { try { flag((e.clipboardData || window.clipboardData).getData('text')); } catch (x) { } });
    el.addEventListener('input', e => { if (!NATIVE_VALUE.get.call(el).trim() && /^delete/.test(e.inputType || '')) delete el.dataset.neg;
      /* any change to the amount, even a refused paste that puts the same figure back, takes back a "Tap again" warning: only a tap made
         after reading the warning about the figure in the box logs it (QC8_NUMBERS_SHOULD_FIX SF4) */
      const armed = bigArm || (futureArm && futureArm.indexOf('dup') === 0); bigArm = null; clearTimeout(bigT); if (futureArm && futureArm.indexOf('dup') === 0) { futureArm = null; clearTimeout(futureT); }
      const m = $(id === 'rcAmt' ? '#rcMsg' : '#hMsg'); if (armed && m && /Tap again/.test(m.textContent)) m.textContent = ''; }); });
  $('#hCat').addEventListener('change', () => { catPicked('h'); syncOtherTitle('hCat', 'hNote'); $('#hMsg').textContent = ''; if ($('#hCat').value === 'other') { const dt = $('.hmore'); if (dt) dt.open = true; const hn = $('#hNote'); if (hn) hn.focus(); } });
  $('#p-home').addEventListener('click', e => {
    if (e.target.closest('[data-gw]')) { openGoalWizard(); return; }
    /* a goal without an amount: open its editor on Goals, scrolled into view */
    const gs = e.target.closest('[data-gset]'); if (gs) { editGoal = gs.dataset.gset; buildGoals(); switchTab('goals'); const ed = $(`#goalCards [data-gid="${gs.dataset.gset}"]`); if (ed) requestAnimationFrame(() => { ed.scrollIntoView({ block: 'start', behavior: 'smooth' }); const f = $('input[data-g="target"]', ed); if (f) f.focus({ preventScroll: true }); }); return; }
    if (e.target.closest('[data-checkin]')) { const r = markWeek(); persist(); render(); sfx('sparkle'); if (r) celebrate(WK_MILE.indexOf(r.n) >= 0 && r.n > 1 ? 'med' : 'small', r.n > 1 ? `Checked in. Streak: ${r.n} weeks.` : 'Checked in. Streak: week 1.'); return; }
    if (e.target.closest('[data-hidenext]')) { S.ui.sampleHidden = true; persist(); render(); return; }
    const mg = e.target.closest('[data-closego]'); if (mg) { location.hash = '#' + mg.dataset.closego; const tb = document.querySelector('[data-tab="receipts"]'); if (tb) tb.click(); return; }
    const mo = e.target.closest('[data-mcok]'); if (mo) { S.ui.mcOk = Object.assign({}, S.ui.mcOk, { [mo.dataset.mcok]: true }); persist(); sfx('coin'); render(); return; }
    const hm = e.target.closest('[data-hidemonth]'); if (hm) { S.ui.mcSeen = hm.dataset.hidemonth; persist(); render(); return; }
    if (e.target.closest('[data-hideexact]')) { S.ui.exactHidden = true; persist(); render(); return; }
    if (e.target.closest('[data-nodebts]')) { S.ui.noDebts = true; persist(); render(); return; }
    if (e.target.closest('[data-debtgo]')) { switchTab('goals'); setTimeout(() => { const b = document.getElementById('addDebtBtn'); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } }, 160); return; }
    if (e.target.closest('[data-hidebills]')) { S.ui.moreBillsHidden = true; persist(); render(); return; }
    if (e.target.closest('[data-hideremind]')) { S.ui.remindHidden = true; persist(); render(); return; }
    if (e.target.closest('[data-remindgo]')) { S.ui.remindHidden = true; persist(); switchTab('receipts'); setTimeout(() => { const r = document.getElementById('rcRemind'); if (r) r.scrollIntoView({ block: 'start' }); }, 120); return; }
    const sh = e.target.closest('[data-sweephide]'); if (sh) { SWEEP_LATER = Object.assign({}, SWEEP_LATER, { [sh.dataset.sweephide]: true }); sfx('tap'); render(); return; }
    const sk = e.target.closest('[data-sweepbank]'); if (sk) { doRelease(sk.dataset.sweepbank); return; }
    const stb = e.target.closest('[data-stretch]'); if (stb) { const eg = emergencyGoal(S); if (eg) { eg.stretchOn = stb.dataset.stretch === 'yes'; if (eg.stretchOn) eg.stretchFrom = nowYm(); else delete eg.stretchFrom; persist(); render(); }   /* a yes counts from this month (QC8 SF5) */ return; }
    const sb = e.target.closest('[data-sweep]'); if (sb) { doSweep(sb.dataset.sweep); return; }
    if (e.target.closest('[data-sweepundo]')) { undoSweep(); return; }
    if (e.target.closest('[data-exact]')) { impOnly = true; openTour('source', 'full'); return; }
    const f = e.target.closest('[data-focus]'); if (f) { if (f.dataset.focus === 'hAmt' && !QUICK_OPEN) { QUICK_OPEN = true; homeV1(); } const t = document.getElementById(f.dataset.focus); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.focus({ preventScroll: true }); } }
  });
  const hero = $('#hHero'), move = e => {
    if (!HG) return; const svg = $('#hGraph svg'); if (!svg) return;
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * HG.W, step = (HG.W - 24) / Math.max(1, HG.n - 1);
    const i = Math.max(0, Math.min(HG.n - 1, Math.round((x - 10) / step))), v = HG.pts[i], mk = $('#hgM');
    if (mk) { mk.setAttribute('cx', HG.X(i)); mk.setAttribute('cy', HG.Y(v)); }
    showTip(`<b>${i === 0 ? 'Now' : monthLabel(MONTHS[HG.i0 + i - 1]) + ' (end)'}</b><br>${fmt(v)} of ${fmt(HG.g.target)}`, e.clientX, e.clientY);
  };
  hero.addEventListener('pointermove', e => { if (e.target.closest('#hGraph')) move(e); else { hideTip(); const mk = $('#hgM'); if (mk) mk.setAttribute('cx', -20); } });
  hero.addEventListener('pointerleave', () => { hideTip(); const mk = $('#hgM'); if (mk) mk.setAttribute('cx', -20); });
  const gl = $('#hGoals'); gl.addEventListener('pointermove', e => { if (e.target.closest('#hGGraph')) ggMove(e); else ggClear(); }); gl.addEventListener('pointerleave', ggClear);
  gl.addEventListener('toggle', e => { const d = e.target; if (d.dataset && d.dataset.hgid) { if (d.open) HOPEN.add(d.dataset.hgid); else HOPEN.delete(d.dataset.hgid); } else if (d.id === 'ggWrap') { if (d.open) HOPEN.add('*graph'); else HOPEN.delete('*graph'); } }, true);
  $('#p-home').addEventListener('click', e => { const b = e.target.closest('[data-main]'); if (!b) return; S.ui.main = b.dataset.main; persist(); render(); sfx('next'); cheer('Main goal set.'); });
  /* small sounds for taps, quiet while muted and until the first tap */
  document.addEventListener('click', e => { const b = e.target.closest('.tabs [role=tab], .btn, .chipbtn, .hg, summary'); if (b && !b.closest('#tour') && !b.hasAttribute('data-cal')) sfx('tap'); });
}

/* ===== money boxes: commas as you type, the cursor at the end when a screen fills one in =====
   Every amount box (the ones with the currency sign in front) becomes a text box that shows 12,345.
   Its .value still reads back as a plain number, so nothing else in the page has to know. */
const NATIVE_VALUE = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
const COMMA_DEC = ['€', 'R$', 'kr', 'zł', 'R']; /* currencies usually written with a decimal comma */
const withCommas = s => { s = String(s == null ? '' : s); const m = s.match(/^(-?)(\d*)(\.\d*)?$/); return m ? m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (m[3] || '') : s; };
/* sums typed in an amount box: 1200+300, 500*2, 2,400/3. Plain arithmetic only, never run as code. A trailing sign is ignored while typing. */
const MONEY_OP = /[+*\/x\u00d7\u2212-]/;
function evalMoney(src) {
  const t = String(src).replace(/,/g, '').replace(/\s+/g, '').replace(/[x\u00d7]/gi, '*').replace(/\u2212/g, '-').replace(/[+\-*\/.]+$/, '');
  if (!t || !/^[0-9.+\-*\/()]+$/.test(t)) return null;
  let i = 0;
  const num = () => { const m = /^\d*\.?\d+|^\d+\.?/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); };
  const atom = () => { if (t[i] === '(') { i++; const v = expr(); if (t[i] !== ')') throw 0; i++; return v; } return num(); };
  const term = () => { let v = atom(); while (t[i] === '*' || t[i] === '/') { const o = t[i++], r = atom(); v = o === '*' ? v * r : (r === 0 ? NaN : v / r); } return v; };
  const expr = () => { let v = term(); while (t[i] === '+' || t[i] === '-') { const o = t[i++], r = term(); v = o === '+' ? v + r : v - r; } return v; };
  try { const v = expr(); if (i !== t.length || !isFinite(v) || v < 0) return null; return Math.round(v * 100) / 100; } catch (e) { return null; }
}
const hasMoneyOp = raw => MONEY_OP.test(String(raw).replace(/^\s*-/, '').replace(/,/g, ''));
const isMoneyBox = el => !!el && el.tagName === 'INPUT' && el.type === 'number' && !!el.parentElement && el.parentElement.classList.contains('inp') && !!el.parentElement.querySelector(':scope > .yen');
function caretEnd(el) {
  if (!el || el.readOnly || el.disabled || el.value === '') return;
  try {
    if (el.type === 'number') { const v = el.value; el.value = ''; el.value = v; }
    else if (el.setSelectionRange) { const n = NATIVE_VALUE.get.call(el).length; el.setSelectionRange(n, n); }
  } catch (err) { /* some boxes do not allow it */ }
}
function moneyUp(el) {
  if (el.dataset.mny) return;
  const v = el.value;
  el.dataset.mny = '1'; el.type = 'text'; el.setAttribute('autocomplete', 'off');
  if (!el.getAttribute('inputmode')) el.setAttribute('inputmode', 'decimal');
  Object.defineProperty(el, 'value', { configurable: true, get() { const r = NATIVE_VALUE.get.call(this); if (hasMoneyOp(r)) { const v = evalMoney(r); return v === null ? (this._mnyOK !== undefined ? this._mnyOK : '') : String(v); } return r.replace(/,/g, ''); }, set(x) { const n = +x; NATIVE_VALUE.set.call(this, withCommas(x !== '' && x != null && isFinite(n) && Math.abs(n - Math.round(n)) >= 0.005 ? n.toFixed(2) : x)); } });   /* an amount the page puts in a box shows its cents as two digits, 400.50 not 400.5 (decision 1) */
  NATIVE_VALUE.set.call(el, withCommas(v));
}
function moneyUpAll(root) { $$('input[type=number]', root || document).forEach(el => { if (isMoneyBox(el)) moneyUp(el); }); }
function moneyTyped(el, ev) {
  if (el._refuse && Date.now() < el._refuse) { NATIVE_VALUE.set.call(el, el._mnyPrev !== undefined ? el._mnyPrev : ''); return; }   /* after a refused minus, the rest of that typing is ignored until the person leaves the box */
  let raw = NATIVE_VALUE.get.call(el); if (hasMoneyOp(raw)) return;
  /* a letter is never dropped in silence (12O typed for 120 would become 12): the box keeps what it had and says why (38.31 QC round 2) */
  { const lt = /[A-Za-z]/.exec(raw); if (lt) { try { cheer(`Numbers only: "${lt[0]}" wasn't added, check the amount`); } catch (x) { } NATIVE_VALUE.set.call(el, el._mnyPrev !== undefined ? el._mnyPrev : ''); return; } }
  /* a minus sign is never kept; the person is told, so a refund typed as -500 is not quietly turned into +500 (receipt boxes refuse it themselves) */
  const negOK = el.dataset.neg === 'ok' || el.id === 'rcAmt' || el.id === 'hAmt';   /* a receipt box keeps a typed minus in sight, so Log can say why it is refused instead of logging +500 (38.31 number gate round 3) */
  if ((el.id === 'rcAmt' || el.id === 'hAmt')) { if (/^\s*[-\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/.test(raw)) el.dataset.neg = '1'; else delete el.dataset.neg; }   /* the bank balance box takes a minus: an overdrawn account (38.31 QC round 3) */
  if (negOK) raw = raw.replace(/^\s*[\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/, '-');
  if (!negOK && /^\s*[-\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/.test(raw) && el.id !== 'rcAmt' && el.id !== 'hAmt') { try { cheer('Amounts take no minus sign. The old amount stays.'); } catch (x) { } NATIVE_VALUE.set.call(el, el._mnyPrev !== undefined ? el._mnyPrev : ''); el._refuse = Date.now() + 2500; try { el.blur(); } catch (x) { } return; }
  { const big = parseFloat(raw.replace(/[^\d.]/g, '')); if (big > 1e9 && el.id !== 'rcAmt' && el.id !== 'hAmt') { try { cheer(`That amount is too big. The most is 1,000,000,000. ${el._mnyAtFocus ? 'The old amount stays.' : 'Type it again.'}`); } catch (x) { } el._refuse = Date.now() + 2500; NATIVE_VALUE.set.call(el, el._mnyAtFocus !== undefined ? el._mnyAtFocus : ''); el._mnyPrev = el._mnyAtFocus; el.dispatchEvent(new Event('input', { bubbles: true })); return;   /* a typo is refused and the amount from before this typing comes back, never the largest amount (38.31 data safety round) */ } } const pos = el.selectionStart == null ? raw.length : el.selectionStart;
  /* a comma typed by hand: a decimal point where the currency writes decimals that way (12,50 euro), otherwise a thousands separator
     (1,200 pesos is twelve hundred, never one peso twenty) and the box regroups it on its own */
  let at = pos; if (ev && ev.data === ',' && raw.charAt(pos - 1) === ',') { const dec = COMMA_DEC.indexOf(sym()) >= 0; raw = raw.slice(0, pos - 1) + (dec ? '.' : '') + raw.slice(pos); if (!dec) at = pos - 1; }
  const sig = t => t.replace(/[^\d.]/g, '');
  let all = sig(raw), n = sig(raw.slice(0, at)).length;
  /* a third digit after the point, or a second point, is never cut off in silence: 1.234,56 typed in euros became 1.23 (38.31 money accuracy round 4) */
  { const d1 = all.indexOf('.'); if (d1 >= 0 && (all.indexOf('.', d1 + 1) >= 0 || all.length - d1 - 1 > 2)) { try { cheer(`Only two digits after the point. For thousands, leave the separator out: 1234${COMMA_DEC.indexOf(sym()) >= 0 ? ',' : '.'}56.`); } catch (x) { } NATIVE_VALUE.set.call(el, el._mnyPrev !== undefined ? el._mnyPrev : ''); return; } }
  const dot = all.indexOf('.');
  if (dot >= 0) all = all.slice(0, dot) + '.' + all.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  n = Math.min(n, all.length);
  const neg = negOK && /^\s*-/.test(raw); if (neg) n++;
  const out = (neg ? '-' : '') + withCommas(all);
  if (out === NATIVE_VALUE.get.call(el)) return;
  let k = 0, i = 0; for (; i < out.length && k < n; i++) if (out.charAt(i) !== ',') k++;
  NATIVE_VALUE.set.call(el, out);
  try { el.setSelectionRange(i, i); } catch (err) { /* ignore */ }
}
document.addEventListener('focusin', e => { const el = e.target; if (el && el.dataset && el.dataset.mny) { el._mnyPrev = NATIVE_VALUE.get.call(el); el._mnyAtFocus = el._mnyPrev; el._mnyOK = String(el._mnyPrev).replace(/,/g, ''); if (hasMoneyOp(el._mnyOK)) el._mnyOK = ''; } }, true);
/* the value before each edit, so a refused entry can put it back */
document.addEventListener('beforeinput', e => { const el = e.target; if (el && el.dataset && el.dataset.mny && !(el._refuse && Date.now() < el._refuse)) el._mnyPrev = NATIVE_VALUE.get.call(el); }, true);
/* a Japanese keyboard types full-width digits, signs and points: read them as the plain ones */
const FULLW = s => String(s).replace(/[\uFF10-\uFF19]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48)).replace(/\uFF0E/g, '.').replace(/\uFF0C/g, ',').replace(/\uFF0B/g, '+').replace(/[\uFF0A\u2217]/g, '*').replace(/[\uFF0F\u00F7\u2215]/g, '/').replace(/\uFF08/g, '(').replace(/\uFF09/g, ')').replace(/\uFF58/g, 'x').replace(/[\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/g, '-');
function normFull(el) {
  if (!el || el.tagName !== 'INPUT' || el.disabled || (el.type !== 'text' && el.type !== 'number' && el.type !== 'search')) return;
  const mny = !!(el.dataset && el.dataset.mny), amt = el.classList && el.classList.contains('amt-in'), rc = el.id === 'rcAmt' || el.id === 'hAmt';
  if (!mny && !amt && !rc) return;
  const cur = mny ? NATIVE_VALUE.get.call(el) : el.value;
  if (!/[\uFF10-\uFF19\uFF0E\uFF0C\uFF0B\uFF0A\u2217\uFF0F\u00F7\u2215\uFF08\uFF09\uFF58\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/.test(cur)) return;
  const nv = FULLW(cur), pos = el.selectionStart;
  if (rc && /^\s*-/.test(nv)) el.dataset.neg = '1';
  if (mny) NATIVE_VALUE.set.call(el, nv); else el.value = nv;
  try { el.setSelectionRange(pos, pos); } catch (x) { }
}
document.addEventListener('input', e => { if (!e.isComposing) normFull(e.target); }, true);
document.addEventListener('compositionend', e => { const el = e.target; normFull(el); if (el && el.dispatchEvent) el.dispatchEvent(new Event('input', { bubbles: true })); }, true);
document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.mny && !e.isComposing) moneyTyped(el, e); }, true);
/* leaving the box turns the sum into its answer */
document.addEventListener('focusout', e => { const el = e.target; if (el && el.dataset && el.dataset.mny && hasMoneyOp(NATIVE_VALUE.get.call(el))) { const v = evalMoney(NATIVE_VALUE.get.call(el)); if (v === null) { try { cheer('That sum doesn\'t work out to an amount so the old amount stays'); } catch (x) { } } NATIVE_VALUE.set.call(el, v === null ? withCommas(el._mnyOK || '') : withCommas(String(v))); el.dispatchEvent(new Event('change', { bubbles: true })); } }, true);
(function () {
  let pt = null, ptT = 0;
  ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => document.addEventListener(ev, e => { pt = e.target; ptT = Date.now(); }, true));
  /* a finger or mouse that picks its own spot is left alone; a screen that puts the cursor in a filled box gets it moved to the end */
  document.addEventListener('focusin', e => {
    const t = e.target; if (!t || t.tagName !== 'INPUT' || (t.type !== 'number' && t.type !== 'text')) return;
    if (pt && Date.now() - ptT < 700 && pt.nodeType === 1) { const lb = pt.closest && pt.closest('label'); if (t === pt || t.contains(pt) || (lb && lb.contains(t))) return; }
    caretEnd(t); requestAnimationFrame(() => { if (document.activeElement === t) caretEnd(t); });
  });
  if (document.body) {
    moneyUpAll(document);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'INPUT') { if (isMoneyBox(n)) moneyUp(n); } else if (n.querySelector) moneyUpAll(n);
    }))).observe(document.body, { childList: true, subtree: true });
  }
})();
