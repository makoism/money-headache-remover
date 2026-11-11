
/* ---------- date and month pickers ----------
   The native pickers are replaced by one calendar that opens straight away, picks on a single tap and never waits for the field to lose focus.
   The original input or select stays in the page, hidden, so every existing handler still reads and listens to it. */
const DP = { pop: null, anchor: null, off: [], t: 0 };
const DP_FIRST = /^(en-US|en-PH|en-CA|ja|ko|zh|fil|tl|pt-BR|es-MX|he)/i.test(navigator.language || '') ? 0 : 1;
const DP_DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DP_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const DP_CHEV = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const dpIso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const dpParse = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? { y: +v.slice(0, 4), m: +v.slice(5, 7) - 1, d: +v.slice(8, 10) } : null);
const dpToday = () => { const n = new Date(); return dpIso(n.getFullYear(), n.getMonth(), n.getDate()); };
const dpCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function dpLabelFor(inp) {
  const v = inp.value;
  if (!v) return inp.required ? 'Pick a date' : 'No date';
  if (v === dpToday()) return 'Today';
  const p = dpParse(v); return p ? p.d + ' ' + MONTH_NAMES[p.m] + ' ' + p.y : v;
}
/* Only write when something changed. Writing the same text still counts as a DOM change, and dpWatch (below) reacts to every DOM change, so an unconditional write kept it looping at screen speed, which cost CPU while the page sat idle. */
const dpSet = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
function dpSync(root) {
  (root || document).querySelectorAll('input[data-dp]').forEach(i => { const b = i.nextElementSibling; if (b && b.classList.contains('dpb')) { dpSet(b.querySelector('.dpb-t'), dpLabelFor(i)); if (b.disabled !== i.disabled) b.disabled = i.disabled; } });
  (root || document).querySelectorAll('select[data-dp]').forEach(s => { const b = s.__btn; if (b) { const o = s.selectedOptions[0]; dpSet(b.querySelector('.dpb-t'), o ? o.textContent : ''); if (b.disabled !== s.disabled) b.disabled = s.disabled; } });
}
function enhanceDate(inp) {
  inp.dataset.dp = 'date'; inp.tabIndex = -1; inp.setAttribute('aria-hidden', 'true'); inp.classList.add('dp-native');
  const lab = inp.id ? document.querySelector(`label[for="${inp.id}"]`) : null;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'dpb';
  if (lab) { if (!lab.id) lab.id = inp.id + '-lab'; b.setAttribute('aria-labelledby', lab.id + ' ' + (b.id = inp.id + '-btn')); }
  b.innerHTML = `<span class="dpb-t"></span>${DP_ICON}`;
  inp.after(b);
  b.addEventListener('click', e => { e.preventDefault(); if (DP.pop && DP.anchor === b) closePop(); else openDate(inp, b); });
  dpSync(inp.parentNode);
}
const isMonthSelect = s => s.options.length >= 12 && Array.from(s.options).every(o => o.value === '' || /^\d{4}-\d{2}$/.test(o.value));
function enhanceMonth(sel) {
  sel.dataset.dp = 'month'; sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true'); sel.classList.add('dp-native');
  const wrap = sel.closest('.pick');
  if (wrap) {
    wrap.classList.add('dp-pick'); sel.__btn = wrap; wrap.setAttribute('role', 'button'); wrap.tabIndex = 0; wrap.setAttribute('aria-haspopup', 'dialog');
    wrap.addEventListener('click', e => { e.preventDefault(); if (DP.pop && DP.anchor === wrap) closePop(); else openMonth(sel, wrap); });
    wrap.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); openMonth(sel, wrap); } });
    return;
  }
  const b = document.createElement('button'); b.type = 'button'; b.className = 'dpb';
  const lab = sel.id ? document.querySelector(`label[for="${sel.id}"]`) : null;
  if (lab) { if (!lab.id) lab.id = sel.id + '-lab'; b.setAttribute('aria-labelledby', lab.id + ' ' + (b.id = sel.id + '-btn')); }
  else b.setAttribute('aria-label', sel.getAttribute('aria-label') || 'Choose a month');
  b.innerHTML = `<span class="dpb-t"></span>${DP_CHEV}`; sel.__btn = b;
  (sel.closest('.selbox') || sel).after(b);
  const box = sel.closest('.selbox'); if (box) box.classList.add('dp-hide');
  b.addEventListener('click', e => { e.preventDefault(); if (DP.pop && DP.anchor === b) closePop(); else openMonth(sel, b); });
  dpSync(sel.parentNode.parentNode || sel.parentNode);
}
function enhancePickers(root) {
  const r = root || document;
  r.querySelectorAll('input[type=date]:not([data-dp])').forEach(enhanceDate);
  r.querySelectorAll('select:not([data-dp])').forEach(s => { if (isMonthSelect(s)) enhanceMonth(s); });
  dpSync(r);
}

/* ----- the popover itself ----- */
function closePop(refocus) {
  const p = DP.pop; if (!p) return;
  DP.off.forEach(f => f()); DP.off = []; DP.pop = null;
  const a = DP.anchor; DP.anchor = null; if (a) { a.classList.remove('open'); a.setAttribute('aria-expanded', 'false'); }
  p.classList.remove('in'); p.classList.add('out'); setTimeout(() => p.remove(), dpCalm() ? 0 : 110);
  if (refocus && a && a.focus) try { a.focus({ preventScroll: true }); } catch (e) { /* gone */ }
}
function dpPlace() {
  const p = DP.pop, a = DP.anchor; if (!p || !a || !document.contains(a)) { closePop(); return; }
  const r = a.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight, vw = innerWidth, vh = innerHeight, gap = 8;
  let left = Math.min(Math.max(10, r.left + r.width / 2 - pw / 2), vw - pw - 10), top = r.bottom + gap, above = false;
  if (top + ph > vh - 10 && r.top - gap - ph > 10) { top = r.top - gap - ph; above = true; }
  else if (top + ph > vh - 10) top = Math.max(10, vh - ph - 10);
  p.style.left = left + 'px'; p.style.top = top + 'px'; p.style.transformOrigin = `${Math.max(12, Math.min(pw - 12, r.left + r.width / 2 - left))}px ${above ? '100%' : '0'}`;
}
function dpOpen(anchor, html, label) {
  closePop();
  const p = document.createElement('div'); p.className = 'dp'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', label); p.innerHTML = html;
  document.body.appendChild(p); DP.pop = p; DP.anchor = anchor; anchor.classList.add('open'); anchor.setAttribute('aria-expanded', 'true'); dpPlace();
  requestAnimationFrame(() => p.classList.add('in'));
  const out = e => { if (DP.pop && !DP.pop.contains(e.target) && !anchor.contains(e.target)) closePop(); };
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePop(true); } };
  const mv = () => dpPlace();
  document.addEventListener('pointerdown', out, true); document.addEventListener('keydown', key, true);
  addEventListener('resize', mv); document.addEventListener('scroll', mv, true);
  DP.off = [() => document.removeEventListener('pointerdown', out, true), () => document.removeEventListener('keydown', key, true), () => removeEventListener('resize', mv), () => document.removeEventListener('scroll', mv, true)];
  return p;
}
function dpCommit(el, v) {
  if (el.value !== v) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  dpSync(el.parentNode.parentNode || el.parentNode); dpSync(document);
  if (typeof sfx === 'function') sfx('tick', 50);
}

function openDate(inp, anchor) {
  const min = inp.min || '', max = inp.max || '', cur = dpParse(inp.value) || dpParse(dpToday());
  let vy = cur.y, vm = cur.m, mode = 'days', fy = null, dir = 0;
  const clampMonth = () => {
    const mn = dpParse(min), mx = dpParse(max);
    if (mn && (vy < mn.y || (vy === mn.y && vm < mn.m))) { vy = mn.y; vm = mn.m; }
    if (mx && (vy > mx.y || (vy === mx.y && vm > mx.m))) { vy = mx.y; vm = mx.m; }
  };
  clampMonth();
  const pop = dpOpen(anchor, '', 'Choose a date');
  pop.classList.add('dp-date');
  const inRange = iso => (!min || iso >= min) && (!max || iso <= max);
  const monthOk = (y, m) => { const a = dpIso(y, m, 1), b = dpIso(y, m, 28); return (!max || a <= max) && (!min || dpIso(y, m, 31) >= min); };
  function paint() {
    const sel = inp.value, today = dpToday();
    if (mode === 'months') {
      pop.innerHTML = `<div class="dp-h"><button type="button" class="dp-n" data-y="-1" aria-label="Previous year">${'<svg viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</button><b class="dp-t">${fy}</b><button type="button" class="dp-n" data-y="1" aria-label="Next year"><svg viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
        <div class="dp-mg">${MONTH_NAMES.map((n, i) => `<button type="button" data-mi="${i}" class="${fy === vy && i === vm ? 'on' : ''}"${monthOk(fy, i) ? '' : ' disabled'}>${n}</button>`).join('')}</div>`;
      dpPlace(); return;
    }
    const first = new Date(vy, vm, 1), lead = (first.getDay() - DP_FIRST + 7) % 7, dim = new Date(vy, vm + 1, 0).getDate(), cells = [];
    for (let i = 0; i < 42; i++) { const dt = new Date(vy, vm, 1 - lead + i); cells.push(dt); }
    const week = []; for (let i = 0; i < 7; i++) week.push(DP_DOW[(DP_FIRST + i) % 7]);
    pop.innerHTML = `<div class="dp-h"><button type="button" class="dp-n" data-m="-1" aria-label="Previous month"><svg viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button type="button" class="dp-t" data-pickm aria-label="Choose month and year">${FULL[vm]} ${vy}${DP_CHEV}</button>
      <button type="button" class="dp-n" data-m="1" aria-label="Next month"><svg viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      <div class="dp-w">${week.map(w => `<span>${w}</span>`).join('')}</div>
      <div class="dp-g${dir > 0 ? ' sl-l' : dir < 0 ? ' sl-r' : ''}" role="grid">${cells.map(dt => { const iso = dpIso(dt.getFullYear(), dt.getMonth(), dt.getDate()), out = dt.getMonth() !== vm, ok = inRange(iso);
        return `<button type="button" role="gridcell" data-d="${iso}" tabindex="${iso === (inp.value && dpParse(inp.value) && inp.value.slice(0, 7) === dpIso(vy, vm, 1).slice(0, 7) ? inp.value : dpIso(vy, vm, 1)) ? 0 : -1}" class="${out ? 'out' : ''}${iso === today ? ' today' : ''}${iso === sel ? ' on' : ''}"${ok ? '' : ' disabled'}${iso === sel ? ' aria-selected="true"' : ''}>${dt.getDate()}</button>`; }).join('')}</div>
      <div class="dp-f">${!inp.required && inp.value ? '<button type="button" class="dp-l" data-clear>No date</button>' : '<span></span>'}${inRange(today) ? '<button type="button" class="dp-l" data-today>Today</button>' : ''}</div>`;
    dir = 0; dpPlace();
  }
  const go = n => { dir = n; vm += n; if (vm < 0) { vm = 11; vy--; } if (vm > 11) { vm = 0; vy++; } clampMonth(); paint(); if (typeof sfx === 'function') sfx('tick', 30); };
  pop.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    if (t.dataset.m) { go(+t.dataset.m); return; }
    if (t.dataset.y) { fy += +t.dataset.y; paint(); return; }
    if (t.dataset.mi !== undefined) { vy = fy; vm = +t.dataset.mi; clampMonth(); mode = 'days'; dir = 0; paint(); return; }
    if (t.hasAttribute('data-pickm')) { fy = vy; mode = mode === 'months' ? 'days' : 'months'; paint(); return; }
    if (t.dataset.d) { dpCommit(inp, t.dataset.d); closePop(true); return; }
    if (t.hasAttribute('data-today')) { dpCommit(inp, dpToday()); closePop(true); return; }
    if (t.hasAttribute('data-clear')) { dpCommit(inp, ''); closePop(true); }
  });
  pop.addEventListener('keydown', e => {
    const c = e.target.closest('[data-d]'); if (!c || mode !== 'days') return;
    const d = dpParse(c.dataset.d); let n = null;
    if (e.key === 'ArrowLeft') n = -1; else if (e.key === 'ArrowRight') n = 1; else if (e.key === 'ArrowUp') n = -7; else if (e.key === 'ArrowDown') n = 7;
    if (n === null) { if (e.key === 'PageDown') { e.preventDefault(); go(1); } else if (e.key === 'PageUp') { e.preventDefault(); go(-1); } return; }
    e.preventDefault(); const nd = new Date(d.y, d.m, d.d + n), iso = dpIso(nd.getFullYear(), nd.getMonth(), nd.getDate()); if (!inRange(iso)) return;
    if (nd.getMonth() !== vm) { vy = nd.getFullYear(); vm = nd.getMonth(); dir = n > 0 ? 1 : -1; paint(); }
    const t = pop.querySelector(`[data-d="${iso}"]`); if (t) { pop.querySelectorAll('[data-d]').forEach(x => { x.tabIndex = -1; }); t.tabIndex = 0; t.focus(); }
  });
  paint();
  const f = pop.querySelector('.on') || pop.querySelector('.today') || pop.querySelector('[data-d]:not(.out):not(:disabled)'); if (f) { f.tabIndex = 0; try { f.focus({ preventScroll: true }); } catch (e) { /* fine */ } }
}

function openMonth(sel, anchor) {
  const opts = Array.from(sel.options), groups = {}, none = opts.find(o => o.value === '');
  opts.filter(o => o.value).forEach(o => { const y = o.value.slice(0, 4); (groups[y] = groups[y] || []).push(o); });
  const cur = sel.value, now = typeof nowYm === 'function' ? nowYm() : '';
  const pop = dpOpen(anchor, '', 'Choose a month'); pop.classList.add('dp-month');
  pop.innerHTML = (none ? `<button type="button" class="dp-none${cur === '' ? ' on' : ''}" data-v="">${esc(none.textContent)}</button>` : '')
    + Object.keys(groups).sort().map(y => `<div class="dp-y"><b>${y}</b><div class="dp-mg">${groups[y].map(o => `<button type="button" data-v="${o.value}" class="${o.value === cur ? 'on' : ''}${o.value === now ? ' today' : ''}">${MONTH_NAMES[+o.value.slice(5, 7) - 1]}</button>`).join('')}</div></div>`).join('');
  dpPlace();
  pop.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; dpCommit(sel, b.dataset.v); closePop(true); });
  const on = pop.querySelector('.on'); if (on) { on.scrollIntoView({ block: 'nearest' }); try { on.focus({ preventScroll: true }); } catch (e) { /* fine */ } }
  pop.addEventListener('keydown', e => {
    const bs = Array.from(pop.querySelectorAll('button')), i = bs.indexOf(document.activeElement); if (i < 0) return;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[e.key]; if (!step) return;
    e.preventDefault(); const n = bs[Math.max(0, Math.min(bs.length - 1, i + step))]; if (n) n.focus();
  });
}

/* pick up every date field and month list that appears, whenever it appears */
let dpQueued = false;
function dpWatch() {
  enhancePickers();
  new MutationObserver(() => { if (dpQueued) return; dpQueued = true; requestAnimationFrame(() => { dpQueued = false; enhancePickers(); }); }).observe(document.body, { childList: true, subtree: true });
}
