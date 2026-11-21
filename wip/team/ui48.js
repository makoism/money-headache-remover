
/* ===== coach marks: a short spotlight tour of a tab, pointing at the real parts of the page =====
   Only when asked for: Help, "Explain this tab". Skippable at any step. */
const COACH = {
  /* Home, card by card: why it matters first, then what to tap. The walk goes top to bottom as the page has them, and a card that is
     not on screen is skipped (QC round 6 north-star gate 4: it showed only Log spend) */
  home: [
    ['#hMap .mp-now', 'In your bank now', 'This is the one number that\'s real today. Everything else on Home is planned from it, so keep it fresh. Open your bank app and type what it shows. After that, tap Check your bank once a week.'],
    ['#mpRooms', 'This month', 'This month\'s money, split by what it\'s for. Bills and basics come first. Free to spend is what\'s left for you. Tap a room to see how its number is worked out.'],
    ['#hMap .mp-where', 'Where your money sits', 'All your money at the end of the month in one bar: the bank and each burrow. A bigger piece holds more. The list under it gives each amount.'],
    ['#hMap .mp-four li:nth-child(1)', 'Total', 'Everything you\'ll have at the end of the month, bank and burrows together. Planned means it\'s what your plan expects, not what\'s there today. If Total grows each month, you\'re getting ahead.'],
    ['#hMap .mp-four li:nth-child(2)', 'Free to spend', 'What\'s left this month for whatever you want. Bills and saving are already taken out. Planned means the plan has room for it. Safe to spend means your bank has the money now too. If it says not safe to spend yet, wait for your pay or check your bank.'],
    ['#hMap .mp-four li:nth-child(3)', 'Bills left', 'Bills you still have to pay this month, from your plan. Keep this much in the bank until they go out.'],
    ['#hMap .mp-four li:nth-child(4)', 'Saved', 'What your burrows will hold at the end of the month, with this month\'s saving added. This money already has a job, so it\'s not for spending.'],
    ['#hMap .mp-proof', 'How it adds up', 'Bank plus burrows makes the Total. You can check the sum yourself. If it ever doesn\'t add up, Home tells you right here.'],
    ['#hStatus', 'Where you stand', 'One line on how this month is going. If something\'s off, it says what to do about it.'],
    ['#moveBanner', 'New address', 'The app has its own address. Tap the button to open it there and bring your numbers along. Not now hides this.'],
    ['#hBk', 'Keep your numbers', 'A note about where your numbers are kept, like a backup or a copy on another device. Read it and tap its button if it fits.'],
    ['#hNext', 'Next step', 'The one thing worth doing now to make the plan match your real money. Tap its button and it walks you through it.'],
    ['#hQuick', 'Log spend', 'Logging what you spend keeps the plan true to your real money. Type the amount, pick a category and tap Log spend. Do it as you spend or once a week.'],
    ['#hBur', 'Burrows', 'A burrow is money with a job, like a trip or an emergency fund. It piles up month by month and the bar shows how full it is. Tap a burrow to open it.'],
    ['#hMoreBtn', 'More', 'Home shows what matters today and keeps the rest out of the way. Tap More to see your main goal, Free to spend, your goals, cards and your streak. Show less hides them again.'],
    ['#hHero', 'Main goal', 'The one thing you\'re saving for most, in your own words. It shows what this month adds and how many months are left. Tap Forecast for the graph.'],
    ['#hSpend', 'Free to spend', 'The money you use this month. The big number is yours to spend on whatever you want. Under it you can see if Bills and basics are covered and what\'s left for Education and Giving. Whatever\'s left at the end of the month can go into a goal.'],
    ['#hGoals', 'Your goals', 'Each goal and how far along it is. Tap a burrow to open it. From there you can edit it or make it your main burrow.'],
    ['#hDebts', 'Cards and loans', 'What you owe and the month you\'re debt free if you keep paying. Extra money goes to the highest rate first. Tap See details for each one.'],
    ['#hLimits', 'Spending limits', 'Each line of your plan against what you logged this month. A full bar means that line is used up.'],
    ['#hBuckets', 'Investing', 'Money you invest and don\'t spend. Goals and debt live in the burrows at the top.'],
    ['#hMore', 'Streak, badges, pages', 'Your weekly streak, your badges and links to the other pages. Tap it to open.'],
    ['#askBtn', 'Ask', 'Ask any money question here. It knows your plan and can make changes once you approve them.'],
  ],
  receipts: [
    ['#scan', 'Scan receipts', 'Claude reads your receipt photos and sorts each one into a category, and nothing gets added until you\'ve checked it.'],
    ['#rcForm', 'Manual entry', 'Type the date, amount and category. If you\'re not sure of the category pick Other and change it later.'],
    ['#rcMonthCard', 'Plan vs spend', 'What you planned, what you spent and what\'s left in each category'],
    ['#rcRemind', 'Reminder', 'Pick a schedule, then add a repeating calendar event.'],
  ],
  goals: [
    ['#goalCards .gcard', 'Goal', 'The bar shows how full it should be by now if you stick to the plan. Edit goal changes the name, amount or date.'],
    ['#addGoalBtn', 'Add a burrow', 'Three steps: you pick the type, the goal amount and the date'],
    ['#chartbox', 'Forecast', 'This shows every goal month by month. Hover over a month or tap it to read it.'],
  ],
  month: [
    ['#hero', 'Free to spend', 'The big number is this month\'s Free to spend and it\'s yours to spend on whatever you want'],
    ['#where', 'Pay by place', 'Your pay split into six places. Hover over a colour or tap it to see the amount.'],
    ['#ledger', 'Details', 'Tap a row to open it and enter a new amount. It only changes this month unless you choose Keep for later months.'],
  ],
  months: [
    ['#monthTable', 'All months', 'Tap a month to open it. Short means your balance falls under the minimum that month.'],
  ],
  basics: [
    ['#st-bankStart', 'Balance', 'Your balance right now. It warns you when a month would end under the minimum.'],
    ['#themeSeg', 'Look', 'Light, Dark or Auto, which follows the device. It\'s set for this browser only.'],
    ['#jarList', 'Six places', 'The usual split, as a guide. Your real split comes from the amounts in each place.'],
    ['#bkArea', 'Saved data', 'Your numbers live in this browser. Tap Save file every now and then to keep a backup, and you can load it here or on another device.'],
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
function openTabTour(t) {
  const list = (COACH[t] || []).map(x => ({ el: $(x[0]), t: x[1], b: x[2] })).filter(s => coVisible(s.el));
  if (t === 'home') list.sort((a, b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);   /* Home moves its cards around (Log spend, More, the order Ask sets): walk them as they sit */
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
