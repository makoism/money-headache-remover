
/* ===== HOME: the first screen after setup =====
   Order follows what people open the page for: log a receipt, see the next goal win, see play money left, keep the weekly streak.
   Everything on this screen reads the same plan as the other tabs. Nothing here is stored except the streak weeks, milestones and badges. */
const nowYm = () => { const d = new Date(), ym = d.getFullYear() + '-' + pad2(d.getMonth() + 1); return ym < START ? START : ym > END ? END : ym; };
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
function afterLog(first) {
  pulseBand();
  const r = markWeek(); persist(); render();
  if (r) {
    const big = WK_MILE.indexOf(r.n) >= 0 && r.n > 1;
    sfx(big ? 'fanfare' : 'sparkle');
    celebrate(big ? 'med' : 'small', first || r.n === 1 ? 'Logged. Streak: week 1.' : `Logged. Streak: ${r.n} weeks.`);
  } else { sfx('coin'); celebrate('small', 'Logged.'); }
}

/* ---------- badges ---------- */
const BADGES = [
  { id: 'rcpt1', n: 'First receipt', h: 'Log a receipt.', i: 'receipt', ok: () => (S.receipts || []).length >= 1 },
  { id: 'payin', n: 'Pay set', h: 'Enter your pay.', i: 'coin', ok: () => !!(S.ui.done && S.ui.done.pay) },
  { id: 'goal1', n: 'First goal', h: 'Add a goal with an amount.', i: 'target', ok: () => !!(S.ui.done && S.ui.done.goals) && S.plan.goals.some(g => g.target > 0) },
  { id: 'track', n: 'On track', h: 'A goal is on track.', i: 'check', ok: () => !!(S.ui.done && S.ui.done.goals) && S.plan.goals.some(g => { const s = goalInfo(S, C, g.id, nowYm()).state; return s === 'ontrack' || s === 'full'; }) },
  { id: 'half', n: 'Halfway', h: 'A goal reaches 50%.', i: 'half', ok: () => !!(S.ui.done && S.ui.done.goals) && S.plan.goals.some(g => g.target > 0 && goalInfo(S, C, g.id, nowYm()).pct >= 0.5) },
  { id: 'rcpt10', n: '10 receipts', h: 'Log 10 receipts.', i: 'star', ok: () => (S.receipts || []).length >= 10 },
  { id: 'wk4', n: '4 weeks', h: 'Log 4 weeks running.', i: 'leaf', ok: () => streakInfo().best >= 4 },
  { id: 'wk12', n: '12 weeks', h: 'Log 12 weeks running.', i: 'shield', ok: () => streakInfo().best >= 12 },
];
let badgeTimer = 0;
function checkBadges() {
  if (!C) return;
  const earned = BADGES.filter(b => { try { return b.ok(); } catch (e) { return false; } });
  if (!S.ui.bd) { S.ui.bd = {}; earned.forEach(b => { S.ui.bd[b.id] = true; }); return; }
  const fresh = earned.filter(b => !S.ui.bd[b.id]); if (!fresh.length) return;
  fresh.forEach(b => { S.ui.bd[b.id] = true; });
  persist(); clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => { sfx('fanfare'); celebrate('med', fresh.length === 1 ? `Badge: ${fresh[0].n}.` : `${fresh.length} badges: ${fresh.map(b => b.n).join(', ')}.`); if (tab === 'home') renderBadges(); }, 900);
}

/* ---------- next win ---------- */
const monthsTo = ym => ymIdx(ym) - ymIdx(nowYm());
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
let HG = null, HGD = false;
/* redraw a card only when its markup changed, so animations and hover state survive the many redraws */
const put = (el, html) => { if (el.__h !== html) { el.innerHTML = html; el.__h = html; } };
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
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(g.name)}: ${fmt(pts[0])} saved now, ${reached ? 'full in ' + monthLabel(reached) : 'not full within ' + SPAN}, goal ${fmt(g.target)}"><title>${esc(g.name)} progress</title>`;
  s += `<line class="hg-g" x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}"/><line class="hg-t" x1="${L}" x2="${W - R}" y1="${Y(g.target)}" y2="${Y(g.target)}"/><text class="hg-x" x="${W - R}" y="${Y(g.target) - 7}" text-anchor="end">Goal ${fmt(g.target)}</text>`;
  if (di > 0 && di < n) s += `<line class="hg-d" x1="${X(di)}" x2="${X(di)}" y1="${T - 6}" y2="${H - B}"/><text class="hg-x" x="${X(di)}" y="${H - 9}" text-anchor="${di > n * .75 ? 'end' : 'middle'}">Needed by</text>`;
  s += `<path class="hg-a" d="${area}" style="--c:var(--c${g.slot})"/><path class="hg-l${HGD ? '' : ' draw'}" d="${line}" style="--c:var(--c${g.slot})"/>`; HGD = true;
  s += `<circle class="hg-p" cx="${X(0)}" cy="${Y(pts[0])}" r="5" style="--c:var(--c${g.slot})"/><text class="hg-x" x="${X(0)}" y="${H - 9}" text-anchor="start">Now</text>`;
  if (reached) s += `<circle class="hg-p big" cx="${X(n - 1)}" cy="${Y(pts[n - 1])}" r="6.5" style="--c:var(--c${g.slot})"/><text class="hg-x" x="${X(n - 1)}" y="${di > 0 && Math.abs(di - (n - 1)) < 2 ? H - 20 : H - 9}" text-anchor="end">${monthLabel(reached, true)} ${reached.slice(2, 4)}</text>`;
  s += `<circle id="hgM" class="hg-p" r="5.5" cx="-20" cy="-20" style="--c:var(--c${g.slot})"/></svg>`;
  HG = { pts, X, Y, W, n, i0, g };
  return s;
}
/* the numbers are still the invented ones: pay, bills and goals have not all been set by the person, and the plan was not cleared */
const sampleOn = () => { const d = S.ui.done || {}, zero = S.ui.preset === 'blank' || !!S.ui.cleared; return !zero && !(d.pay && d.bills && d.goals); };
/* the first thing on Home: where you stand this month, in one plain statement. Every figure comes from the month view; nothing is worked out here. */
function renderStatus() {
  const el = $('#hStatus'), V = HV, m = V && V.month; if (!el || !m) return;
  const u = roundUnit(S), mon = monthLabel(V.ym, true), floor = cfg(S, 'minBank');
  let cls, word, line;
  if (!(m.inflow > 0)) { cls = ''; word = 'No plan yet'; line = 'Add your monthly pay to start.'; }
  else if (sampleOn()) { const d = S.ui.done || {}; cls = ''; word = 'Sample numbers'; line = d.pay && d.bills ? 'Pay and bills are yours. The goals are still invented. Add a goal below.' : 'Invented figures for now. Finish the step below to make them yours.'; }
  else if (m.status === 'good') { cls = 'good'; word = 'On plan'; line = `${m.left < u ? 'All pay assigned.' : fmt(m.left) + ' of pay unassigned.'} Balance ends ${mon} at ${fmt(m.bankEnd)}.`; }
  else if (m.status === 'tight') { cls = 'tight'; word = 'Tight month'; line = `Spends ${fmt(-m.left)} more than comes in. Balance covers it and ends ${mon} at ${fmt(m.bankEnd)}.`; }
  else { cls = 'short'; word = 'Short'; line = `Balance would end ${mon} at ${fmt(m.bankEnd)}, under your ${fmt(floor)} minimum. Open Plan to fix it.`; }
  let wk = '';
  if (cls && $('#hNext').hidden) wk = streakInfo().done ? '<p class="hst-w on">This week: receipts logged.</p>' : '<p class="hst-w">This week: nothing logged yet. Log by Sunday.</p>';
  put(el, `<span class="chip ${cls}">${cls === 'good' ? IC.ok : cls ? IC.warn : ''}${word}</span><p class="hst-l">${line}</p>${wk}`);
  el.hidden = false;
}
/* the first days of a month: last month is only complete once what was spent is in; a statement does it in one go */
function monthToClose() {
  const d = S.ui.done || {}; if (!(d.pay && d.bills) || sampleOn()) return null;
  const today = todayStr(), i = MONTHS.indexOf(today.slice(0, 7)); if (+today.slice(8, 10) > 10 || i < 1) return null;
  const pm = MONTHS[i - 1]; if (S.ui.mcSeen === pm) return null;
  const n = receiptsFor(S, pm).length; return n < 4 ? { pm, n } : null;
}
function renderNext() {
  const el = $('#hNext'), d = S.ui.done || {}; let step = null, month = null;
  if (!S.ui.sampleHidden) {
    if (!d.pay) step = ['Next: enter pay', 'The plan starts from monthly pay.', 'Enter pay', 'data-open="a"'];
    else if (!d.bills) step = ['Next: check bills', 'Set each bill to the real amount.', 'Open bills', 'data-open="nec"'];
    else if (!d.goals) step = ['Next: add a goal', 'Pick something to save for.', 'Add goal', 'data-gw'];
    else if (!(S.receipts || []).length) step = ['Next: log a receipt', 'Enter an amount in Log spend, then tap Log.', 'Log receipt', 'data-focus="hAmt"'];
  }
  /* a month to close comes first (it is timely); then, for typed numbers, the statements that make them exact */
  if (!step && (month = monthToClose())) { const nm = FULL[+month.pm.slice(5) - 1]; step = [`Next: finish ${nm}`, `${month.n ? plural(month.n, 'receipt') + ' logged' : 'Nothing logged'} for ${nm}. Log what you spent, or upload the month's statement under Receipts.`, 'Receipts', 'data-tab-go="receipts"']; }
  if (!step && d.pay && d.bills && S.ui.src !== 'import' && !S.ui.exactHidden && !sampleOn()) step = ['Make it exact', 'Upload 2 or 3 months of statements (screenshots of the bank app work). The numbers become exact and your history fills in.', 'Upload', 'data-exact'];
  el.hidden = !step; if (!step) return;
  const left = ['pay', 'bills', 'goals', 'receipts'].filter(k => !d[k]).length;
  const exact = step[3] === 'data-exact';
  put(el, `<div class="hn-t"><b>${step[0]}</b><span>${step[1]}${month || exact ? '' : ' ' + (left === 1 ? '1 step left.' : left + ' steps left.')}</span></div><div class="hn-b"><button type="button" class="btn small solid" ${step[3]}>${step[2]}</button><button type="button" class="link" ${month ? `data-hidemonth="${month.pm}"` : exact ? 'data-hideexact' : 'data-hidenext'}>Hide</button></div>`);
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
  else if (s.n > 0) line = `Streak: ${s.n} wk. Log by Sunday.` + (toSun <= 1 ? ' Last day.' : ` ${plural(toSun + 1, 'day')} left.`);
  else line = 'No streak. Log one receipt this week to start.';
  const sh = s.shield ? `<p class="hst-sh on">${HI.shield}<span>Shield ready. Covers one missed week.</span></p>` : s.n > 0 || s.run > 0 ? `<p class="hst-sh">${HI.shield}<span>${plural(toShield, 'week')} to the next shield.</span></p>` : '';
  put(el, `<h2>Streak</h2><div class="hst-top"><span class="hst-fl${s.n > 0 ? ' lit' : ''}" aria-hidden="true">${HI.leaf}</span><p class="hst-n"><b>${s.n}</b><span>${s.n === 1 ? 'week' : 'weeks'}</span></p></div`); put(el, `<h2>Streak</h2><div class="hst-top"><span class="hst-fl${s.n > 0 ? ' lit' : ''}" aria-hidden="true">${HI.leaf}</span><p class="hst-n"><b>${s.n}</b><span>${s.n === 1 ? 'week' : 'weeks'}</span></p></div>
    <p class="hst-line">${line}</p><ol class="wdots" aria-label="Last 8 weeks">${dots}</ol>${sh}
    <div class="row-btns">${s.done ? '' : '<button type="button" class="btn small" data-checkin>Nothing to log</button>'}${s.best > s.n ? `<span class="hst-best">Best: ${plural(s.best, 'week')}</span>` : ''}</div>`);
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
const monthsText = r => r.pct >= 100 ? 'Full' : r.reached ? (r.months <= 0 ? 'Full this month' : plural(r.months, 'month') + ' to go') : 'No date at this pace';
const monthsShort = r => r.state === 'paid' ? 'Paid' : r.state === 'short' ? 'Short' : r.state === 'unset' ? 'No amount' : r.pct >= 100 ? 'Done' : r.reached ? (r.months <= 0 ? 'This month' : plural(r.months, 'month')) : 'Over ' + SPAN;
const fracOf = r => (r.target > 0 ? Math.min(1, Math.max(0, r.saved / r.target)) : 0);
function renderHero() {
  const el = $('#hHero'), r = HV.main;
  if (!r) {
    el.className = 'card hwin empty';
    put(el, `<div class="hw-empty"><h2>No goal set</h2><p>Add a goal to see what it unlocks and when.</p><button type="button" class="btn solid" data-gw>Add goal</button></div>`);
    return;
  }
  const g = goalById(S, r.id), purpose = purposeFor(g), pct = r.pct, fr = fracOf(r);
  if (!g) return; /* view and plan out of step for a moment (a goal just removed); the next restructure redraws */
  let chip = '', sub = '', fix = '';
  if (r.pct >= 100 || r.state === 'full') chip = '<span class="chip good">' + IC.ok + 'Full</span>';
  else if (r.state === 'ontrack') { chip = '<span class="chip good">' + IC.ok + 'On track</span>'; sub = `Needed by ${dateLabel(g.due)}. ${r.slack === 0 ? 'On time.' : plural(r.slack, 'month') + ' spare.'}`; }
  else if (r.state === 'behind') { chip = '<span class="chip tight">' + IC.warn + 'Behind</span>'; sub = `Needed by ${dateLabel(g.due)}.` + (r.need != null ? ` Save about ${fmt(r.need)} a month.` : ''); fix = '<button type="button" class="btn small" data-open="lts">Change monthly amount</button>'; }
  else if (r.state === 'noeta') { chip = '<span class="chip tight">' + IC.warn + 'Slow</span>'; sub = 'Raise the monthly amount to finish sooner.'; fix = '<button type="button" class="btn small" data-open="lts">Change monthly amount</button>'; }
  const when = r.pct >= 100 ? 'Full.' : r.reached ? (r.months <= 0 ? 'Full <b>this month</b>.' : `<b>${plural(r.months, 'month')}</b> to go. Full ${fullLabel(r.reached)}.`) : 'Not full within ' + SPAN + ' at this pace.';
  const ms = [25, 50, 75].map(p => `<span class="ms${pct >= p ? ' hit' : ''}" style="left:${p}%"></span>`).join('');
  el.className = 'card hwin';
  put(el, `<p class="hw-k">Main goal: ${esc(g.name)}</p>
    <h2 class="hw-p">${esc(purpose)}</h2>
    <p class="hw-when">${when}</p>
    <div class="hw-bar" role="img" aria-label="${pct} percent of ${esc(g.name)} saved" style="--c:var(--c${g.slot})"><i class="fill" style="width:${fr * 100}%"></i>${ms}</div>
    <div class="hw-nums"><span><b>${fmt(r.saved)}</b> of ${fmt(r.target)}</span><span>${pct}%</span></div>
    ${chip}
    <details class="hw-more"><summary>Forecast</summary>${sub ? `<p class="hw-sub">${sub}</p>` : ''}${r.reached ? `<div class="hw-graph" id="hGraph">${heroGraph(g)}</div>` : ''}<div class="row-btns">${fix}<button type="button" class="btn small" data-tab-go="goals">Edit goals</button></div></details>`);
  /* a milestone is celebrated once, the first time the plan passes it */
  const hit = pct >= 100 ? 4 : pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0, ms0 = S.ui.ms = S.ui.ms || {};
  if (ms0[g.id] === undefined) { ms0[g.id] = hit; persist(); }
  else if (hit > (ms0[g.id] || 0)) { ms0[g.id] = hit; persist(); sfx(hit === 4 ? 'fanfare' : 'sparkle'); celebrate(hit === 4 ? 'big' : 'med', hit === 4 ? `${g.name}: full.` : `${g.name}: ${hit * 25}%.`); }
}
function renderSpend() {
  const el = $('#hSpend'), p = HV.play, ym = HV.ym;
  if (p.planned <= 0 && p.spent <= 0) { put(el, `<h2>Play money</h2><p class="hs-big zero">${fmt(0)}</p><p class="cap">No play money planned for ${monthLabel(ym)}.</p><div class="row-btns"><button type="button" class="btn small" data-open="play">Set in Plan</button></div>`); return; }
  const chip = p.over ? `<span class="chip short">${IC.bad}Over</span>` : p.ahead ? `<span class="chip tight">${IC.warn}Ahead of pace</span>` : `<span class="chip good">${IC.ok}On pace</span>`;
  const wk = p.perWeek != null ? `<b>${fmt(p.perWeek)}</b> a week, ${plural(p.daysLeft, 'day')} left.` : `${plural(p.daysLeft, 'day')} left.`;
  const covered = !p.over && p.planned > 0 && HV.month.status === 'good' && !sampleOn();
  put(el, `<h2>Play money</h2><p class="hs-big${p.over ? ' neg' : ''}" style="--n:${fmt2(p.left).length}">${fmt2(p.left)}</p><p class="hs-lbl">${p.over ? 'Over in ' : 'Left in '}${monthLabel(ym)}</p>
    <div class="hs-bar${p.over ? ' over' : ''}" role="img" aria-label="${fmt2(p.spent)} of ${fmt(p.planned)} spent"><i style="width:${p.frac * 100}%"></i><span class="pace" style="left:${p.dayFrac * 100}%"></span></div>
    <p class="hs-sub">${p.count ? `Spent ${fmt2(p.spent)} of ${fmt(p.planned)}.` : `Nothing logged yet. ${fmt(p.planned)} planned.`} ${p.over ? '' : wk}</p>${p.count || p.over ? chip : ''}${covered ? '<p class="hs-ok">Bills and goals are planned for. This part is free to spend.</p>' : ''}${art('grass')}`);
}
/* a row opens to show its details; which ones are open survives a redraw */
const HOPEN = new Set();
function goalRowHtml(r) {
  const g = goalById(S, r.id), main = HV.main && HV.main.id === r.id;
  if (!g) return '';
  const st = r.state === 'ontrack' || r.state === 'full' || r.state === 'paid' ? 'good' : r.state === 'behind' || r.state === 'noeta' || r.state === 'short' ? 'warn' : 'plain';
  const stw = { ontrack: 'On track', full: 'Full', paid: 'Paid', short: 'Short', behind: 'Behind', noeta: 'Slow', eta: 'Filling', unset: 'Unset', none: '' }[r.state] || '';
  const eta = r.state === 'paid' ? `Paid ${dateLabel(g.due)}` : r.state === 'short' ? `Had ${fmt(r.had)} of ${fmt(g.target)}` : r.state === 'unset' ? 'No amount' : r.reached ? `Full ${monthLabel(r.reached)}` : `Not full in ${SPAN}`;
  return `<li class="gd"><details data-hgid="${esc(r.id)}"${HOPEN.has(r.id) ? ' open' : ''} style="--c:var(--c${g.slot})"><summary><i class="dot"></i><span class="gd-t"><b>${esc(g.name)}</b><small>${esc(purposeFor(g))}</small></span><span class="gd-m${main ? ' main' : ''}">${esc(monthsShort(r))}</span></summary>
    <div class="gd-b"><div class="hg-b" role="img" aria-label="${r.pct} percent"><i style="width:${fracOf(r) * 100}%"></i></div>
    <p class="gd-n"><span>${fmt(r.saved)} of ${fmt(r.target)}</span><span>${esc(eta)}</span></p>${stw ? `<p class="gd-c"><em class="${st}">${stw}</em>${main ? '<span class="gd-main">Main goal</span>' : ''}</p>` : (main ? '<p class="gd-c"><span class="gd-main">Main goal</span></p>' : '')}
    <div class="row-btns"><button type="button" class="btn small" data-tab-go="goals">Edit goal</button>${!main && r.live ? `<button type="button" class="btn small" data-main="${esc(r.id)}">Set as main goal</button>` : ''}</div></div></details></li>`;
}
function renderGoalsHome() {
  const el = $('#hGoals'), rows = HV.goals, gs = S.plan.goals;
  put(el, `<div class="hgl-h"><h2>Goals</h2>${gs.length < MAX_GOALS ? '<button type="button" class="btn small solid" data-gw>Add goal</button>' : ''}</div>` + (gs.length ? `<ul class="gdl">${rows.map(goalRowHtml).join('')}</ul>${goalsGraph()}` : '<p class="cap">No goals. Add one to list it here.</p>'));
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
/* the six jars: what is left in the ones you spend from, and what has built up in the ones you save in */
function renderBuckets() {
  const el = $('#hBuckets'), V = HV;
  const tile = b => b.kind === 'save'
    ? `<li class="bk" style="--c:${JARVAR[b.id]}"><span class="bk-n"><i></i>${esc(b.name)}</span><b>${fmt(b.total)}</b><span class="bk-s">Saved so far${b.planned > 0 ? `. +${fmt(b.planned)} this month` : ''}</span></li>`
    : `<li class="bk${b.left < 0 ? ' over' : ''}" style="--c:${JARVAR[b.id]}"><span class="bk-n"><i></i>${esc(b.name)}</span><b>${fmt2(b.left)}</b><span class="bk-s">${b.left < 0 ? 'Over' : 'Left'} of ${fmt(b.planned)}, ${monthLabel(V.ym, true)}</span></li>`;
  put(el, `<h2>Jars</h2><ul class="bkl">${V.buckets.map(tile).join('')}</ul>${V.otherSpent > 0 ? `<p class="cap">${fmt2(V.otherSpent)} logged as Other. Not taken from a jar.</p>` : ''}`);
}
/* the reminder under the tabs on every other page: what you are working toward, how close it is, and what is left to spend */
function renderBand() {
  const el = $('#mgBand'); if (!el) return;
  const V = HV, r = V && V.main;
  if (!r || tab === 'home' || tab === 'basics') { el.hidden = true; return; }
  const g = goalById(S, r.id), p = V.play, purpose = purposeFor(g), when = r.pct >= 100 ? 'Full' : r.reached ? (r.months <= 0 ? 'This month' : plural(r.months, 'month') + ' to go') : 'Over ' + SPAN;
  if (!g) { el.hidden = true; return; }
  put(el, `<span class="mg-l" style="--c:var(--c${g.slot})"><i class="dot"></i><b>${esc(purpose)}</b><em>${when}</em></span><span class="mg-bar" aria-hidden="true" style="--c:var(--c${g.slot})"><i style="width:${fracOf(r) * 100}%"></i></span><span class="mg-s">${p.over ? fmt2(Math.abs(p.left)) + ' over play money' : fmt2(p.left) + ' play money left'}, ${monthLabel(V.ym, true)}</span>`);
  el.setAttribute('aria-label', `Main goal: ${purpose}. ${when}. ${p.over ? fmt2(Math.abs(p.left)) + ' over play money' : fmt2(p.left) + ' play money left'}. Tap for Home.`);
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
const HOME_SECTIONS = ['goal', 'play', 'log', 'goals', 'jars', 'more'];
const HOME_EL = { goal: 'hHero', play: 'hSpend', log: 'hQuick', goals: 'hGoals', jars: 'hBuckets', more: 'hMore' };
let homeOrderSig = '';
function applyHomeOrder() {
  const order = Array.isArray(S.ui.home) && S.ui.home.length ? S.ui.home.filter(id => HOME_SECTIONS.indexOf(id) >= 0) : HOME_SECTIONS;
  const sig = order.join(); if (sig === homeOrderSig) return; homeOrderSig = sig;
  const panel = $('#p-home'); if (!panel) return;
  HOME_SECTIONS.forEach(id => { const el = $('#' + HOME_EL[id]); if (el) el.hidden = order.indexOf(id) < 0; });
  order.forEach(id => { const el = $('#' + HOME_EL[id]); if (el) panel.append(el); });
}
const FOOT_SAMPLE = 'Not financial advice. Sample numbers are invented. Replace them with yours.', FOOT_OWN = 'Not financial advice.';
function paintFoot() { const el = $('#footNote'); if (!el) return; const t = sampleOn() ? FOOT_SAMPLE : FOOT_OWN; if (el.textContent !== t) el.textContent = t; }
function renderHome() {
  if (!C) return;
  checkBadges(); paintSnd(); paintBk(); paintFoot();
  if (tab !== 'home') return;
  applyHomeOrder();
  renderNext(); renderBackupNudge(); renderStatus(); syncQuick(); renderHero(); renderSpend(); renderGoalsHome(); renderBuckets(); renderStreak(); renderBadges();
}

/* ---------- add a goal: what, how much, by when ---------- */
let GW = null;
const GW_QUICK = [['6 months', 6], ['1 year', 12], ['2 years', 23], ['No date', 0]];
const gwKinds = () => GOAL_KINDS.filter(k => !(k.em && S.plan.goals.some(g => g.emergency)));
function gwDate(months) { const d = new Date(); d.setMonth(d.getMonth() + months); let s = ymd(d); const hi = END + '-28'; if (s > hi) s = hi; return s; }
function gwPlan() {
  const cost = clampAmt(GW.cost), saved = clampAmt(GW.saved), rem = Math.max(0, cost - saved), u = roundUnit(S);
  if (!(cost > 0)) return { txt: 'Enter the cost to see the monthly amount.' };
  if (rem <= 0) return { txt: 'Already saved in full. Shows as full.', ok: true };
  if (GW.due && !GW.kind.em) {
    const rb = readyBy({ due: GW.due }), n = rb ? ymCount(SAVE_FROM, rb) : 0;
    if (n < 1) return { txt: 'Too soon to save anything by then. Pick a later date.', bad: true };
    return { txt: `Save about <b>${fmt(Math.ceil(rem / n / u) * u)}</b> a month for ${plural(n, 'month')}. Ready by ${dateLabel(GW.due)}.`, ok: true };
  }
  return { txt: `No date: plan assumes 12 months. About <b>${fmt(Math.ceil(rem / 12 / u) * u)}</b> a month.`, ok: true };
}
function openGoalWizard() {
  if (S.plan.goals.length >= MAX_GOALS) { cheer(`Limit: ${MAX_GOALS} goals.`); return; }
  GW = { step: 0, kind: null, name: '', cost: '', saved: '', due: '', ret: document.activeElement, dir: 0 };
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
      <div class="field"><label for="gwName">Name</label><input class="txt" id="gwName" type="text" maxlength="60" value="${esc(g.name)}" placeholder="Japan trip"></div>`;
  } else if (g.step === 1) {
    t = 'Amount';
    body = `<div class="field"><label for="gwCost">${k && k.cost ? 'Total cost' : 'Total cost'}</label><div class="inp"><span class="yen cs"></span><input id="gwCost" type="number" inputmode="numeric" min="0" step="any" value="${esc(g.cost)}" placeholder="0"></div>${k && k.cost ? `<p class="cap">${k.cost}</p>` : ''}</div>
      <div class="field"><label for="gwSaved">Already saved</label><div class="inp"><span class="yen cs"></span><input id="gwSaved" type="number" inputmode="numeric" min="0" step="any" value="${esc(g.saved)}" placeholder="0"></div></div>`;
  } else {
    t = k && k.em ? 'Plan' : 'Date'; nextTxt = 'Add goal';
    body = (k && k.em ? '' : `<div class="field"><label for="gwDue">Needed by</label><input type="date" id="gwDue" value="${esc(g.due)}" min="${todayStr()}" max="${END}-28"></div>
      <div class="gw-quick" role="group" aria-label="Quick dates">${GW_QUICK.map(q => `<button type="button" class="chipbtn${(q[1] === 0 ? !g.due : g.due === gwDate(q[1])) ? ' on' : ''}" data-q="${q[1]}">${q[0]}</button>`).join('')}</div>`)
      + `<p class="gw-plan" id="gwPlan" aria-live="polite"></p>`;
  }
  el.innerHTML = `<div class="gw-scrim" data-gwx></div><div class="gw-card"><div class="gw-top">${dots}<button type="button" class="ask-x" data-gwx aria-label="Close">&times;</button></div>
    <h2 id="gwT">${t}</h2><div class="gw-body ${g.dir > 0 ? 'in-r' : g.dir < 0 ? 'in-l' : ''}">${body}</div>
    <div class="gw-foot">${g.step > 0 ? '<button type="button" class="btn" data-gwback>Back</button>' : '<span></span>'}<button type="button" class="btn solid" id="gwNext" data-gwnext>${nextTxt}</button></div></div>`;
  $$('.cs', el).forEach(e => { e.textContent = sym(); });
  gwRefresh();
  const f = $(g.step === 0 ? '#gwName' : g.step === 1 ? '#gwCost' : '#gwDue', el); if (f && g.step !== 0) setTimeout(() => { if (g && f.focus) f.focus({ preventScroll: true }); }, 60);
  g.dir = 0;
}
function gwRefresh() {
  const g = GW, el = $('#gw'); if (!g || !el) return;
  const n = $('#gwNext'); if (!n) return;
  if (g.step === 0) n.disabled = !(g.kind && g.name.trim());
  else if (g.step === 1) n.disabled = !(+g.cost > 0);
  else { const p = gwPlan(), pe = $('#gwPlan'); if (pe) { pe.innerHTML = p.txt; pe.classList.toggle('bad', !!p.bad); } n.disabled = !!p.bad || !(+g.cost > 0); }
  if (typeof dpSync === 'function') dpSync(el);
}
function gwInput(e) {
  const g = GW, t = e.target; if (!g) return;
  if (t.id === 'gwName') g.name = t.value; else if (t.id === 'gwCost') g.cost = t.value; else if (t.id === 'gwSaved') g.saved = t.value;
  else if (t.id === 'gwDue') { g.due = t.value; $$('.gw-quick .chipbtn').forEach(b => { const q = +b.dataset.q; b.classList.toggle('on', q === 0 ? !g.due : g.due === gwDate(q)); }); }
  gwRefresh();
}
function gwNext() {
  const g = GW; if (!g) return; const n = $('#gwNext'); if (n && n.disabled) { sfx('off'); return; }
  if (g.step < 2) { g.step++; g.dir = 1; sfx('next'); paintGW(); return; }
  gwFinish();
}
function gwFinish() {
  const g = GW, k = g.kind; if (!g || !k) return;
  const id = addGoal(S, g.name.trim() || k.name); if (!id) { closeGoalWizard(); return; }
  updateGoal(S, id, { target: g.cost, start: g.saved || 0, due: k.em ? '' : g.due });
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
    if (!(a > 0)) { msg.textContent = 'Enter an amount.'; $('#hAmt').focus(); sfx('off'); return; }
    if (!validDate(d) || MONTHS.indexOf(d.slice(0, 7)) < 0) { msg.textContent = `Date must be ${monthLabel(START)} to ${monthLabel(END)}.`; return; }
    if (c === CAT_NEW) { msg.textContent = 'Add the new category, or pick one from the list.'; $('#hNewName').focus(); sfx('off'); return; }
    if (needTitle(c, n)) { const dt = $('.hmore'); if (dt) dt.open = true; msg.textContent = 'Add a short title, e.g. “Vet bill”.'; $('#hNote').focus(); sfx('off'); return; }
    const first = !(S.receipts || []).length, nm = c === 'other' ? 'Other' : (lineByKey(S, c) || { name: 'Other' }).name;
    addReceipt(S, d, a, c, n); S.ui.rcCat = c; markDone('receipts', true);
    $('#hAmt').value = ''; $('#hNote').value = ''; syncOtherTitle('hCat', 'hNote'); $('#hDate').value = todayStr(); if (typeof dpSync === 'function') dpSync($('#hQuick'));
    msg.textContent = `Logged ${fmt2(a)}: ${nm}.`;
    persist(); render(); afterLog(first); $('#hAmt').focus();
  });
  $('#hAmt').addEventListener('input', () => { $('#hMsg').textContent = ''; });
  $('#hCat').addEventListener('change', () => { catPicked('h'); syncOtherTitle('hCat', 'hNote'); $('#hMsg').textContent = ''; if ($('#hCat').value === 'other') { const dt = $('.hmore'); if (dt) dt.open = true; const hn = $('#hNote'); if (hn) hn.focus(); } });
  $('#p-home').addEventListener('click', e => {
    if (e.target.closest('[data-gw]')) { openGoalWizard(); return; }
    if (e.target.closest('[data-checkin]')) { const r = markWeek(); persist(); render(); sfx('sparkle'); if (r) celebrate(WK_MILE.indexOf(r.n) >= 0 && r.n > 1 ? 'med' : 'small', r.n > 1 ? `Checked in. Streak: ${r.n} weeks.` : 'Checked in. Streak: week 1.'); return; }
    if (e.target.closest('[data-hidenext]')) { S.ui.sampleHidden = true; persist(); render(); return; }
    const hm = e.target.closest('[data-hidemonth]'); if (hm) { S.ui.mcSeen = hm.dataset.hidemonth; persist(); render(); return; }
    if (e.target.closest('[data-hideexact]')) { S.ui.exactHidden = true; persist(); render(); return; }
    if (e.target.closest('[data-exact]')) { impOnly = true; openTour('source', 'full'); return; }
    const f = e.target.closest('[data-focus]'); if (f) { const t = document.getElementById(f.dataset.focus); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.focus({ preventScroll: true }); } }
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
const withCommas = s => { s = String(s == null ? '' : s); const m = s.match(/^(\d*)(\.\d*)?$/); return m ? m[1].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (m[2] || '') : s; };
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
  Object.defineProperty(el, 'value', { configurable: true, get() { return NATIVE_VALUE.get.call(this).replace(/,/g, ''); }, set(x) { NATIVE_VALUE.set.call(this, withCommas(x)); } });
  NATIVE_VALUE.set.call(el, withCommas(v));
}
function moneyUpAll(root) { $$('input[type=number]', root || document).forEach(el => { if (isMoneyBox(el)) moneyUp(el); }); }
function moneyTyped(el, ev) {
  let raw = NATIVE_VALUE.get.call(el); const pos = el.selectionStart == null ? raw.length : el.selectionStart;
  /* a comma typed by hand is somebody's decimal point */
  let at = pos; if (ev && ev.data === ',' && raw.charAt(pos - 1) === ',') raw = raw.slice(0, pos - 1) + '.' + raw.slice(pos);
  const sig = t => t.replace(/[^\d.]/g, '');
  let all = sig(raw), n = sig(raw.slice(0, at)).length;
  const dot = all.indexOf('.');
  if (dot >= 0) all = all.slice(0, dot) + '.' + all.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  n = Math.min(n, all.length);
  const out = withCommas(all);
  if (out === NATIVE_VALUE.get.call(el)) return;
  let k = 0, i = 0; for (; i < out.length && k < n; i++) if (out.charAt(i) !== ',') k++;
  NATIVE_VALUE.set.call(el, out);
  try { el.setSelectionRange(i, i); } catch (err) { /* ignore */ }
}
document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.mny && !e.isComposing) moneyTyped(el, e); }, true);
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
