
/* ===== coach marks: a short spotlight tour of a tab, pointing at the real parts of the page =====
   Opens by itself the first time a tab is visited after setup. Skippable at any step, and always available from Help, "Show me around this tab". */
const COACH = {
  home: [
    ['#hStatus', 'Where you stand', 'Read this first. On plan: this month fits your pay and your balance stays above your minimum.'],
    ['#hHero', 'Main goal', 'What the money pays for and the months left. Tap Forecast for the graph.'],
    ['#hSpend', 'Play money', 'What is left to spend this month. Spend it on fun, no guilt.'],
    ['#hQuick', 'Log spend', 'Enter an amount, pick a category, tap Log. Do it as you spend or weekly.'],
    ['#hGoals', 'Goals', 'Tap a goal to open it. Edit it or set it as main goal.'],
    ['#hBuckets', 'Jars', 'Left to spend in spending jars. Total saved in saving jars.'],
    ['#askBtn', 'Ask', 'Any money question, any time. It knows your plan and can make changes you approve.'],
  ],
  receipts: [
    ['#scan', 'Scan receipts', 'Claude reads receipt photos and files each one. You review before anything is added.'],
    ['#rcForm', 'Manual entry', 'Date, amount, category. Unsure of the category? Pick Other and change it later.'],
    ['#rcMonthCard', 'Plan vs spend', 'Per category: planned, spent, left.'],
    ['#rcRemind', 'Reminder', 'Pick a schedule, then add a repeating calendar event.'],
  ],
  goals: [
    ['#goalCards .gcard', 'Goal', 'Bar = how full by plan. Edit goal changes name, amount or date.'],
    ['#addGoalBtn', 'Add goal', 'Three steps: type, amount, date.'],
    ['#chartbox', 'Forecast', 'Every goal, month by month. Hover or tap to read a month.'],
  ],
  month: [
    ['#hero', 'Play money', 'The big number is this month’s play money: yours to spend, no guilt.'],
    ['#where', 'Pay by jar', 'Six jars. Hover or tap a colour for the amount.'],
    ['#ledger', 'Details', 'Tap a row to open it and enter a new amount. Applies to this month only, until you choose Keep for later months.'],
  ],
  months: [
    ['#monthTable', 'All months', 'Tap a month to open it. Short = balance falls under the minimum.'],
  ],
  basics: [
    ['#st-bankStart', 'Balance', 'Current balance. Warns when a month would end under the minimum.'],
    ['#themeSeg', 'Look', 'Light, Dark or Auto (follows the device). This browser only.'],
    ['#jarList', 'Six jars', 'Eker’s usual split, as a guide. Your real split comes from the amounts in each jar.'],
    ['#bkArea', 'Saved data', 'Numbers live in this browser only. Save a file copy regularly. Restore it here or on another device.'],
  ],
};
const CO = { steps: [], i: 0, open: false, tab: '', ret: null, raf: 0 };
const coCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const coVisible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
function coBuild() {
  let el = $('#co'); if (el) return el;
  el = document.createElement('div'); el.id = 'co'; el.className = 'co'; el.hidden = true;
  el.innerHTML = `<div class="co-block" data-coblock></div><div class="co-hole" id="coHole"></div>
    <div class="co-pop" id="coPop" role="dialog" aria-labelledby="coT" aria-describedby="coB"><i class="co-arrow" id="coArrow"></i>
      <p class="co-n" id="coN"></p><h2 id="coT"></h2><p id="coB"></p>
      <div class="co-foot"><button type="button" class="link" id="coSkip">Skip</button><span class="tour-gap"></span><button type="button" class="btn small" id="coBack">Back</button><button type="button" class="btn small solid" id="coNext">Next</button></div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => {
    if (e.target.closest('#coNext')) coGo(1); else if (e.target.closest('#coBack')) coGo(-1);
    else if (e.target.closest('#coSkip')) coClose(true);
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); coClose(true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); coGo(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); coGo(-1); }
    else if (e.key === 'Tab') { const f = $$('button', $('#coPop')).filter(b => !b.hidden && !b.disabled); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  const again = () => { if (CO.open && !CO.raf) CO.raf = requestAnimationFrame(() => { CO.raf = 0; coPlace(); }); };
  addEventListener('resize', again); document.addEventListener('scroll', again, true);
  return el;
}
function maybeTabTour(t) {
  if (!COACH[t] || CO.open || tourIsOpen || ($('#gw') && !$('#gw').hidden)) return;
  if (S.ui.seen && S.ui.seen[t]) return;
  setTimeout(() => { if (tab === t && !CO.open && !tourIsOpen && !(S.ui.seen && S.ui.seen[t])) openTabTour(t); }, 520);
}
function openTabTour(t) {
  const list = (COACH[t] || []).map(x => ({ el: $(x[0]), t: x[1], b: x[2] })).filter(s => coVisible(s.el));
  if (!list.length || CO.open) { if (!list.length) cheer('Nothing to show on this tab yet.'); return; }
  const el = coBuild(); CO.steps = list; CO.i = 0; CO.open = true; CO.tab = t; CO.ret = document.activeElement; CO.y0 = scrollY;
  el.hidden = false; el.classList.remove('on'); document.body.classList.add('co-open');
  coShow(0, true); requestAnimationFrame(() => el.classList.add('on'));
}
function coGo(d) {
  const n = CO.i + d; if (n < 0) return;
  if (n >= CO.steps.length) { coClose(true); return; }
  sfx(d > 0 ? 'next' : 'back'); CO.i = n; coShow(d, false);
}
function coShow(dir, first) {
  const s = CO.steps[CO.i], last = CO.i === CO.steps.length - 1, pop = $('#coPop'), box = $('#co');
  box.classList.add('mv'); clearTimeout(CO.mv); CO.mv = setTimeout(() => box.classList.remove('mv'), 460);
  $('#coN').textContent = `${CO.i + 1} of ${CO.steps.length}`; $('#coT').textContent = s.t; $('#coB').textContent = s.b;
  $('#coBack').hidden = CO.i === 0; $('#coNext').textContent = last ? 'Done' : 'Next'; $('#coSkip').hidden = last;
  pop.classList.remove('swap'); void pop.offsetWidth; if (!first) pop.classList.add('swap');
  /* bring the target into view, then follow it while the page scrolls */
  const r = s.el.getBoundingClientRect(), vh = innerHeight, phone = innerWidth < 640;
  const want = r.height > vh * .55 ? 76 : phone ? 84 : Math.max(76, (vh - r.height) / 2);
  const dy = r.top - want, pinned = (() => { let e = s.el; while (e && e !== document.body) { if (getComputedStyle(e).position === 'fixed') return true; e = e.parentElement; } return false; })();
  if (!pinned && Math.abs(dy) > 4) scrollBy({ top: dy, behavior: coCalm() || first ? 'auto' : 'smooth' });
  coPlace(); let n = 0; const tick = () => { if (!CO.open || n++ > 40) return; coPlace(); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  if (first) { const nb = $('#coNext'); setTimeout(() => nb && nb.focus({ preventScroll: true }), 80); } else $('#coNext').focus({ preventScroll: true });
}
function coPlace() {
  const s = CO.steps[CO.i]; if (!CO.open || !s) return;
  if (!document.contains(s.el)) { coClose(false); return; }
  const r = s.el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, pad = 8, hole = $('#coHole'), pop = $('#coPop'), arrow = $('#coArrow');
  const t = Math.max(6, r.top - pad), l = Math.max(6, r.left - pad), b = Math.min(vh - 6, r.bottom + pad), rt = Math.min(vw - 6, r.right + pad);
  hole.style.left = l + 'px'; hole.style.top = t + 'px'; hole.style.width = Math.max(0, rt - l) + 'px'; hole.style.height = Math.max(0, b - t) + 'px';
  const phone = vw < 640, pw = pop.offsetWidth, ph = pop.offsetHeight;
  pop.classList.toggle('sheet', phone);
  if (phone) {
    pop.style.left = '10px'; pop.style.width = (vw - 20) + 'px';
    const mid = (t + b) / 2, dockTop = mid > vh * .52;
    pop.style.top = dockTop ? '10px' : 'auto'; pop.style.bottom = dockTop ? 'auto' : 'calc(10px + env(safe-area-inset-bottom, 0px))';
    arrow.hidden = true; return;
  }
  arrow.hidden = false; pop.style.bottom = 'auto'; pop.style.width = '';
  let y = b + 16, below = true;
  if (y + ph > vh - 12) { y = t - 16 - ph; below = false; }
  if (y < 12) { y = Math.max(12, Math.min(vh - ph - 12, vh - ph - 12)); below = true; arrow.hidden = true; }
  const x = Math.max(12, Math.min(vw - pw - 12, r.left + r.width / 2 - pw / 2));
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  arrow.className = 'co-arrow ' + (below ? 'up' : 'down'); arrow.style.left = Math.max(18, Math.min(pw - 30, r.left + r.width / 2 - x - 6)) + 'px';
}
function coClose(mark) {
  if (!CO.open) return;
  const el = $('#co'); CO.open = false;
  if (mark && CO.tab) { S.ui.seen = S.ui.seen || {}; S.ui.seen[CO.tab] = true; persist(); }
  el.classList.remove('on'); document.body.classList.remove('co-open');
  setTimeout(() => { if (!CO.open) el.hidden = true; }, coCalm() ? 0 : 220);
  if (CO.ret && CO.ret.focus && document.contains(CO.ret)) try { CO.ret.focus({ preventScroll: true }); } catch (e) { /* gone */ }
  if (CO.y0 != null && Math.abs(scrollY - CO.y0) > 40) scrollTo({ top: CO.y0, behavior: coCalm() ? 'auto' : 'smooth' });
  CO.y0 = null; if (mark) sfx('soft');
}
