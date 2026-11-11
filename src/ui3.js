
/* ---------- chart ---------- */
function drawRoad() {
  const gs = S.plan.goals, tg = $('#roadToggle');
  const nothing = !gs.length || !gs.some(g => g.target > 0 || C.months.some(m => m.bal[g.id] > 0));
  /* with nothing to draw, say so plainly instead of showing an empty chart */
  if (nothing) {
    geom = null; tg.hidden = true; $('#roadLegend').hidden = true; $('#roadTable').hidden = true; $('#roadTable').innerHTML = '';
    const cb = $('#chartbox'); cb.hidden = false; cb.innerHTML = '<p class="cap">No goals to chart. Give a goal an amount and it plots here.</p>'; return;
  }
  const asTable = tg.getAttribute('aria-pressed') === 'true';
  tg.hidden = false; $('#roadLegend').hidden = asTable; $('#chartbox').hidden = asTable; $('#roadTable').hidden = !asTable;
  const cw = $('#chartbox').clientWidth, W = Math.max(300, Math.min(720, cw || 720)), small = W < 520;
  const H = small ? 300 : 310, L = small ? 44 : 50, R = 14, T = 34, B = 30, n = C.months.length;
  const series = gs.map(g => ({ g, v: C.months.map(m => m.bal[g.id]) }));
  const mx = Math.max(1, ...series.flatMap(s => s.v), ...gs.map(g => g.target));
  const step = stepOf(mx / 4), top = Math.ceil(mx / step) * step;
  const X = i => L + i * (W - L - R) / (n - 1), Y = v => T + (1 - v / top) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of your goals from ${monthLabel(START)} to ${monthLabel(END)}. A table view is available."><title>The road ahead</title>`;
  for (let v = 0; v <= top; v += step) s += `<line class="${v === 0 ? 'axis-l' : 'grid-l'}" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${fmtAxis(v)}</text>`;
  C.months.forEach((m, i) => { if (i % (small ? 6 : 3) === 0) s += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${monthLabel(m.ym, true)}${m.ym.slice(5) === '01' || i === 0 ? ' ' + m.ym.slice(2, 4) : ''}</text>`; });
  const si = MONTHS.indexOf(sel); s += `<line x1="${X(si)}" x2="${X(si)}" y1="${T}" y2="${H - B}" stroke="var(--ink)" stroke-width="2" opacity=".35"/>`;
  const placed = [];
  series.forEach(se => {
    const d = se.v.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    s += `<path d="${d}" fill="none" stroke="var(--c${se.g.slot})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const pk = se.v.indexOf(Math.max(...se.v)), px = X(pk), py = Y(se.v[pk]), lw = se.g.name.length * 7.4 + 12;
    const bx = [px - lw / 2, py - 24, px + lw / 2, py - 6];
    const ok = bx[0] > 0 && bx[2] < W && placed.every(p => bx[2] < p[0] || bx[0] > p[2] || bx[3] < p[1] || bx[1] > p[3]);
    s += `<circle cx="${px}" cy="${py}" r="4.5" fill="var(--c${se.g.slot})" stroke="var(--card)" stroke-width="2"/>`;
    if (ok) { placed.push(bx); s += `<text class="lbl-d" x="${px}" y="${py - 11}" text-anchor="middle">${esc(se.g.name)}</text>`; }
  });
  s += `<g id="xh" visibility="hidden"><line id="xhl" y1="${T}" y2="${H - B}" stroke="var(--ink)" stroke-width="1.5"/>${series.map(se => `<circle class="xd" r="5" fill="var(--c${se.g.slot})" stroke="var(--card)" stroke-width="2"/>`).join('')}</g></svg>`;
  $('#chartbox').innerHTML = s; geom = { W, L, R, n, X, Y };
  $('#roadTable').innerHTML = `<table><thead><tr><th>Month</th>${gs.map(g => `<th>${esc(g.name)}</th>`).join('')}</tr></thead><tbody>${C.months.map(m => `<tr data-ym="${m.ym}"><td>${monthLabel(m.ym)}</td>${gs.map(g => `<td>${fmt(m.bal[g.id])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
let lastCw = 0;
addEventListener('resize', () => { if (tab !== 'goals') return; const w = $('#chartbox').clientWidth; if (w && Math.abs(w - lastCw) > 24) { lastCw = w; drawRoad(); } });
function chartMove(e) {
  if (!geom) return; const svg = $('#chartbox svg'); if (!svg) return;
  const gs = S.plan.goals, r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * geom.W;
  const i = Math.max(0, Math.min(geom.n - 1, Math.round((x - geom.L) / ((geom.W - geom.L - geom.R) / (geom.n - 1)))));
  const m = C.months[i], xh = $('#xh'), xl = $('#xhl'); xh.setAttribute('visibility', 'visible');
  xl.setAttribute('x1', geom.X(i)); xl.setAttribute('x2', geom.X(i));
  $$('.xd').forEach((c, k) => { c.setAttribute('cx', geom.X(i)); c.setAttribute('cy', geom.Y(m.bal[gs[k].id])); });
  showTip(`<b>${monthLabel(m.ym)}</b><br>` + gs.map(g => `<i style="--c:var(--c${g.slot})"></i>${esc(g.name)} ${fmt(m.bal[g.id])}`).join('<br>'), e.clientX, e.clientY);
}

/* ---------- tooltip ---------- */
function showTip(html, x, y) {
  const t = $('#tip'); t.innerHTML = html; t.classList.add('on');
  const w = t.offsetWidth, h = t.offsetHeight; let l = x + 14, tp = y + 14;
  if (l + w > innerWidth - 8) l = x - w - 14; if (l < 8) l = 8; if (tp + h > innerHeight - 8) tp = y - h - 14; if (tp < 8) tp = 8;
  t.style.left = l + 'px'; t.style.top = tp + 'px';
}
const hideTip = () => $('#tip').classList.remove('on');


/* ---------- tabs and rows ---------- */
function switchTab(t, focus) {
  const prev = tab; tab = t; disarm();
  const lit = t === 'months' || t === 'goals' ? 'month' : t === 'basics' ? '' : t;
  $$('[data-tab]').forEach(b => { const on = b.dataset.tab === lit; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  $$('.subnav [data-sub]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sub === t)));
  $('#gearBtn').classList.toggle('on', t === 'basics');
  TABS.forEach(n => { const p = $('#p-' + n); p.hidden = n !== t; if (n === t && prev !== t) { p.classList.remove('tab-in'); void p.offsetWidth; p.classList.add('tab-in'); } });
  hideTip(); if (t !== 'month') $('#dock').classList.remove('on'); if (t === 'receipts') { prepareReceiptForm(); scanInit(); } render(); scrollTo({ top: 0 });
  if (prev !== t) sfx('whoosh', 0.5);
  if (!focus && S.ui.toured && !tourIsOpen) maybeTabTour(t);
}
function setOpen(id) {
  openId = id;
  $$('.row[data-id]').forEach(r => { const on = r.dataset.id === id; r.classList.toggle('open', on); const t = $('.row-t', r); if (t) t.setAttribute('aria-expanded', String(on)); const b = $('.row-b', r); if (b) b.hidden = !on; });
}
function openRow(id) {
  if (tab !== 'month') switchTab('month');
  setOpen(id);
  const r = $(`.row[data-id="${id}"]`); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
