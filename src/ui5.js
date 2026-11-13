
/* ---------- wire up events ---------- */
function wire() {
  placeArt(); placePix();
  $$('[data-tab]').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
    b.addEventListener('keydown', e => {
      const bar = TAB_BAR.filter(n => { const x = $('#tab-' + n); return x && !x.hidden; }); /* only the tabs you can see */
      const i = bar.indexOf(b.dataset.tab); let j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % bar.length; else if (e.key === 'ArrowLeft') j = (i + bar.length - 1) % bar.length;
      if (i >= 0 && j >= 0) { e.preventDefault(); switchTab(bar[j], true); }
    });
  });
  $('#monthSel').addEventListener('change', e => select(e.target.value));
  $('#prevM').addEventListener('click', () => { const i = MONTHS.indexOf(sel); if (i > 0) select(MONTHS[i - 1]); });
  $('#nextM').addEventListener('click', () => { const i = MONTHS.indexOf(sel); if (i < MONTHS.length - 1) select(MONTHS[i + 1]); });
  $('#nameIn').addEventListener('input', e => { S.ui.name = cleanName(e.target.value); if (!S.ui.name) delete S.ui.name; persist(); render(); });
  $('#curSel').addEventListener('change', e => {
    const r = changeCurrency(e.target.value), z = presetKey(S) === 'blank';
    $('#curNote').textContent = r === 'all' ? (z ? 'All amounts zeroed for this currency. Enter your own.' : 'Sample amounts now match this currency.')
      : r === 'plan' ? (z ? 'Sample bills and goals zeroed for this currency. Pay and balances unchanged.' : 'Sample bills and goals now match this currency. Pay and balances unchanged.')
      : 'Amounts unchanged. Only the symbol changed.';
    if (r) restructure(); else render();
  });
  $('#hideSample').addEventListener('click', () => { S.ui.sampleHidden = true; persist(); render(); });
  $('#showStart').addEventListener('click', () => { delete S.ui.sampleHidden; delete S.ui.exactHidden; persist(); switchTab('home'); });
  /* buttons that jump somewhere, wherever they are on the page */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { openRow(o.dataset.open); return; }
    const t = e.target.closest('[data-tab-go]'); if (t) { switchTab(t.dataset.tabGo); return; }
    const s = e.target.closest('[data-scroll]'); if (s) { const el = document.getElementById(s.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  $('#monthTable').addEventListener('click', e => { const r = e.target.closest('tr[data-ym]'); if (r) { select(r.dataset.ym); switchTab('month'); } });
  $('#monthTable').addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('tr[data-ym]'); if (r) { select(r.dataset.ym); switchTab('month'); } } });

  /* the ledger: one handler for every number, and for editing the lines */
  const led = $('#ledger');
  led.addEventListener('input', e => {
    const t = e.target, d = t.dataset || {};
    if (d.k) onSet(d.k, t.classList.contains('amt-in') ? t.value.replace(/[^\d]/g, '') : t.value);
    else if (d.lname !== undefined && t.value.trim()) { updateLine(S, d.lname, { name: t.value }); persist(); }
  });
  led.addEventListener('focusin', e => { const t = e.target; if (t.classList && t.classList.contains('amt-in')) { t.value = String(val(S, t.dataset.k, sel)); t.select(); } });
  led.addEventListener('focusout', e => { const t = e.target; if (t.classList && t.classList.contains('amt-in')) render(); });
  led.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('amt-in')) e.target.blur(); });
  led.addEventListener('change', e => {
    const t = e.target, d = t.dataset || {};
    if (d.lname !== undefined) { const l = lineById(S, d.lname); updateLine(S, d.lname, { name: t.value }); if (l && l.jar === 'nec') markDone('bills'); persist(); restructure(); }
    else if (d.lends !== undefined) { updateLine(S, d.lends, { ends: t.value }); persist(); restructure(); }
    else if (d.lredir !== undefined) { updateLine(S, d.lredir, { redirect: t.checked }); persist(); render(); }
  });
  led.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'); if (ed) { editRow = editRow === ed.dataset.edit ? null : ed.dataset.edit; openId = ed.dataset.edit; restructure(); return; }
    const ld = e.target.closest('[data-ldel]'); if (ld) { confirmClick(ld, 'Tap again to remove', () => { const l = lineById(S, ld.dataset.ldel); if (l && l.jar === 'nec') markDone('bills', true); removeLine(S, ld.dataset.ldel); persist(); restructure(); }); return; }
    const h = e.target.closest('.row-h'); if (h && !e.target.closest('input')) { const id = h.closest('.row').dataset.id; setOpen(openId === id ? null : id); return; }
    const kp = e.target.closest('[data-keep]'); if (kp) { const o = S.once[sel]; if (o && o[kp.dataset.keep] !== undefined) setVal(S, kp.dataset.keep, sel, o[kp.dataset.keep], 'after'); persist(); render(); return; }
    const ua = e.target.closest('#undoAll'); if (ua) { delete S.once[sel]; persist(); render(); return; }
    const un = e.target.closest('[data-undo]'); if (un) { undoKey(un.dataset.undo); persist(); render(); return; }
    const del = e.target.closest('[data-del]'); if (del) { S.items[sel] = readItems().filter(i => i.id !== del.dataset.del); itemsSig = ''; persist(); render(); }
  });
  led.addEventListener('submit', e => {
    const f = e.target.closest('[data-addline]'), ai = e.target.closest('#addItem');
    if (f) {
      e.preventDefault(); const nm = $('input[type=text]', f), am = $('input[data-mny], input[type=number]', f);
      if (!nm.value.trim() && !(+am.value > 0)) { nm.focus(); return; }
      const id = addLine(S, f.dataset.addline, nm.value, +am.value); if (!id) return;
      if (f.dataset.addline === 'nec') markDone('bills');
      persist(); restructure(); const ni = $(`[data-lname="${id}"]`); if (ni) ni.focus();
      celebrate('small', 'Added.', $('button[type=submit]', f));
    } else if (ai) {
      e.preventDefault(); const l = $('#addLabel'), a = $('#addAmt'), amt = clampAmt(a.value);
      if (!amt) { a.focus(); return; }
      S.items[sel] = readItems().concat([{ id: 'x' + Date.now().toString(36), label: l.value.trim() || 'One-time cost', amount: amt }]);
      l.value = ''; a.value = ''; itemsSig = ''; persist(); render();
      celebrate('small', 'Added.', $('#addItem button[type=submit]') || $('#addItem'));
    }
  });
  $('#rowsOut').addEventListener('change', e => { if (e.target.closest('#items')) { S.items[sel] = readItems(); persist(); render(); } });
  $('#resetMonth').addEventListener('click', () => { resetMonth(S, sel); itemsSig = ''; persist(); render(); });
  $('#fixBtns').addEventListener('click', e => {
    const b = e.target.closest('[data-fx]'); if (!b) return; const f = b.dataset.fx, m = C.byYm[sel];
    if (f === 'trim') trimPlay(S, m, sel, +b.dataset.amt);
    else if (f === 'borrow') setVal(S, 'draw', sel, m.draw + (+b.dataset.amt), 'once');   /* what is already borrowed this month plus what is still missing */
    else if (f === 'unborrow') setVal(S, 'draw', sel, 0, 'once');
    sfx(f === 'unborrow' ? 'back' : 'next');
    persist(); render();
  });

  /* goals */
  const gc = $('#goalCards');
  gc.addEventListener('click', e => {
    if (e.target.closest('[data-adjust]')) { openRow('lts'); return; }
    const ge = e.target.closest('[data-gedit]'); if (ge) { editGoal = editGoal === ge.dataset.gedit ? null : ge.dataset.gedit; buildGoals(); render(); return; }
    const card = e.target.closest('[data-gid]'); if (!card) return; const id = card.dataset.gid;
    if (e.target.closest('[data-gdone]')) { editGoal = null; buildGoals(); render(); }
    else if (e.target.closest('[data-gnodate]')) { updateGoal(S, id, { due: '' }); markDone('goals', true); persist(); buildGoals(); render(); }
    else if (e.target.closest('[data-gauto]')) { useSuggested(S, id); sfx('next'); persist(); buildGoals(); render(); }
    else { const gd = e.target.closest('[data-gdel]'); if (gd) confirmClick(gd, 'Tap again to remove', () => { removeGoal(S, id); markDone('goals', true); if (editGoal === id) editGoal = null; persist(); restructure(); }); }
  });
  /* every keystroke saves; the page redraws on change so the cursor stays put while typing */
  const goalEdit = t => {
    const k = t.dataset && t.dataset.g, card = t.closest('[data-gid]'); if (!k || !card) return null; const id = card.dataset.gid;
    if (k === 'name') updateGoal(S, id, { name: t.value });
    else if (k === 'emergency') updateGoal(S, id, { emergency: t.checked });
    else if (k === 'due') updateGoal(S, id, { due: t.value });
    else updateGoal(S, id, { [k]: t.value });
    return k;
  };
  gc.addEventListener('input', e => {
    const t = e.target; if (!t.dataset || !t.dataset.g || t.type === 'checkbox') return;
    const k = goalEdit(t); if (!k) return; markDone('goals', true); persist();
    if (k === 'name') { const n = $('#jn-' + t.closest('[data-gid]').dataset.gid); if (n && t.value.trim()) n.textContent = t.value.trim(); }
    schedule();
  });
  gc.addEventListener('change', e => {
    const k = goalEdit(e.target); if (!k) return;
    markDone('goals'); persist();
    if (k === 'name' || k === 'emergency' || k === 'due') restructure(); else render();
    if (k === 'name') queueWins(true);
  });
  $('#addGoalBtn').addEventListener('click', () => openGoalWizard());

  /* the scroll wheel and trackpad scroll the page. They never change a number in a box. */
  addEventListener('wheel', e => { const t = e.target; if (t && t.tagName === 'INPUT' && (t.type === 'number' || t.type === 'range') && document.activeElement === t) t.blur(); }, { passive: true, capture: true });
  $('#themeSeg').addEventListener('click', e => { const b = e.target.closest('[data-theme-set]'); if (!b) return; setTheme(b.dataset.themeSet); sfx('tap'); });

  /* basics */
  SETF.forEach(f => { const go = e => onCfg(f.k, Math.max(0, Math.round(+e.target.value || 0))); $('#st-' + f.k).addEventListener('input', go); $('#st-' + f.k).addEventListener('change', go); });
  $('#redivide').addEventListener('click', () => { if (typeof openTour === 'function') openTour('jars', 'full'); });
  const copyBox = async (ta, msg) => {
    ta.focus(); ta.select();
    try { await navigator.clipboard.writeText(ta.value); msg.textContent = 'Copied.'; return true; } catch (e) { /* try the older way */ }
    try { if (document.execCommand('copy')) { msg.textContent = 'Copied.'; return true; } } catch (e) { /* fall through */ }
    msg.textContent = 'Press Ctrl+C (Cmd+C) to copy the selected text.';
    return false;
  };
  $('#rcCopy').addEventListener('click', () => copyBox($('#rcEventText'), $('#rcCopyMsg')));
  $('#bkCopy').addEventListener('click', () => { const ta = $('#bk'); ta.value = JSON.stringify(S); copyBox(ta, $('#bkMsg')).then(ok => { if (ok) markBackup(); }); });
  const loadBackup = () => {
    const msg = $('#bkMsg');
    try {
      const d = JSON.parse($('#bk').value);
      if (!d || typeof d !== 'object' || !d.steps || !d.once || !d.cfg) throw new Error('bad');
      const old = S; S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, old.ui, S.ui, { sampleHidden: true });
      if (!Array.isArray(d.receipts)) S.receipts = old.receipts;
      editRow = null; editGoal = null; editRc = null; itemsSig = ''; S.ui.bk = Date.now(); delete S.ui.bkLater; persist(); restructure(); msg.textContent = 'Loaded.'; sfx('next');
    } catch (e) { msg.textContent = 'Not a valid backup. Use the whole file, or paste all of the copied text.'; }
  };
  $('#bkLoad').addEventListener('click', loadBackup);
  /* a file for the person to keep. In the Claude viewer plain downloads are blocked, so the viewer's own save prompt is used there; elsewhere the browser downloads it. */
  const saveOut = async (name, text, mime, msg, alt) => {
    if (inArtifact()) {
      let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
      if (!dl || typeof dl.save !== 'function') { msg.textContent = 'Downloads are unavailable in this view.' + alt; return false; }
      try { await dl.save({ filename: name, data: text }); msg.textContent = 'Saved.'; sfx('next'); return true; }
      catch (e) { msg.textContent = e && e.code === 'declined' ? 'Not saved.' : 'Save failed.' + alt; return false; }
    }
    try {
      const blob = new Blob([text], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500); msg.textContent = 'Saved to downloads.'; sfx('next'); return true;
    } catch (e) { msg.textContent = 'File not saved by this browser.' + alt; return false; }
  };
  const stamp = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  /* the file save is shared with the reminder on Home (bkRun, ui43.js); a saved file counts as a backup */
  bkRun = async () => { const ok = await saveOut(`mhr2000-${stamp()}.json`, JSON.stringify(S), 'application/json', $('#bkMsg'), ' Use Copy text.'); if (ok) markBackup(); return ok; };
  $('#bkSave').addEventListener('click', () => { bkRun(); });
  $('#bkCsv').addEventListener('click', () => { let t; try { t = sheetCsv(S, calcAll(S)); } catch (e) { $('#bkMsg').textContent = 'Spreadsheet could not be built.'; return; } saveOut(`mhr2000-plan-${stamp()}.csv`, t, 'text/csv;charset=utf-8', $('#bkMsg'), ''); });
  $('#bkFileBtn').addEventListener('click', () => $('#bkFile').click());
  $('#bkFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0], msg = $('#bkMsg'); e.target.value = ''; if (!f) return;
    if (f.size > 20e6) { msg.textContent = 'File too large for a backup.'; return; }
    const r = new FileReader(); r.onerror = () => { msg.textContent = 'File unreadable. Try Copy text.'; };
    r.onload = () => { $('#bk').value = String(r.result || ''); loadBackup(); }; r.readAsText(f);
  });
  const twoStep = (b, armedText, run) => {
    let t = 0; const orig = b.textContent;
    b.addEventListener('click', () => {
      if (!t) { t = setTimeout(() => { t = 0; b.textContent = orig; }, 4000); b.textContent = armedText; return; }
      clearTimeout(t); t = 0; b.textContent = orig; run();
    });
  };
  /* Zero all and Restore samples replace every number: the copy before stays one tap away for 15 seconds */
  let undoSnap = null, undoT = 0;
  const offerUndo = (snap, txt) => { undoSnap = snap; $('#undoTxt').textContent = txt; $('#undoBar').hidden = false; clearTimeout(undoT); undoT = setTimeout(() => { $('#undoBar').hidden = true; undoSnap = null; }, 15000); };
  $('#undoGo').addEventListener('click', () => { if (!undoSnap) return; clearTimeout(undoT); $('#undoBar').hidden = true; S = normalize(JSON.parse(undoSnap)); undoSnap = null; editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = ''; sfx('back'); cheer('Your numbers are back.'); });
  const blank = () => { offerUndo(JSON.stringify(S), 'All numbers zeroed.'); S = blankState(S, sampleOn()); S.ui.cleared = true; delete S.ui.setup; delete S.ui.src; delete S.ui.imp; editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = 'All zero. Start with salary.'; select(START); if (tab !== 'month') switchTab('month'); };
  twoStep($('#blankBtn'), 'Tap again to zero all', blank);
  twoStep($('#blankTop'), 'Tap again to zero all', blank);
  twoStep($('#bkReset'), 'Tap again to restore', () => { offerUndo(JSON.stringify(S), 'Samples restored.'); const old = S, u = S.ui; S = presetState(u.cur); S.ui = Object.assign({}, u, { preset: S.ui.preset, sampleHidden: false, done: {} }); delete S.ui.cleared; delete S.ui.setup; delete S.ui.gset; delete S.ui.sb; delete S.ui.tourAt; delete S.ui.src; delete S.ui.imp; S.receipts = old.receipts; editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = 'Samples restored.'; });
  wireReceipts(); wireTour(); wireHelp(); wireHome(); wireScan(); wireAskAi(); wireSafe(); wireVault(); safe(() => DJ.wire(), null, 'dj'); safe(() => SCENE.start(), null, 'scene');

  /* tooltips */
  const bar = $('#bar');
  bar.addEventListener('pointermove', e => { const d = e.target.closest('.seg-b'); if (d && !d.hidden) showTip(d.dataset.tip, e.clientX, e.clientY); else hideTip(); });
  bar.addEventListener('pointerdown', e => { const d = e.target.closest('.seg-b'); if (d && !d.hidden) showTip(d.dataset.tip, e.clientX, e.clientY); });
  bar.addEventListener('pointerleave', hideTip);
  bar.addEventListener('focusin', e => { const d = e.target.closest('.seg-b'); if (d) { const r = d.getBoundingClientRect(); showTip(d.dataset.tip, r.left + r.width / 2, r.bottom); } });
  bar.addEventListener('focusout', hideTip);
  const cb = $('#chartbox');
  cb.addEventListener('pointermove', chartMove); cb.addEventListener('pointerdown', chartMove);
  cb.addEventListener('pointerleave', () => { hideTip(); const xh = $('#xh'); if (xh) xh.setAttribute('visibility', 'hidden'); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#bar,#chartbox')) hideTip(); });
  $('#roadToggle').addEventListener('click', e => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on));
    e.currentTarget.textContent = on ? 'Show as chart' : 'Show as table'; $('#roadTable').hidden = !on; $('#chartbox').hidden = on; $('#roadLegend').hidden = on;
  });
  /* mini summary when the hero scrolls out of view */
  const dock = $('#dock');
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { const en = es[0]; dock.classList.toggle('on', tab === 'month' && !en.isIntersecting && en.boundingClientRect.top < 0); }).observe($('#hero'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  /* the installable app: a newer version took over underneath; offer the reload, save first */
  addEventListener('mhr:update', () => { const u = $('#upd'); if (u) u.hidden = false; });
  if ($('#updGo')) $('#updGo').addEventListener('click', () => { flush(); location.reload(); });
  /* on the way out, write this tab's copy unless another tab has saved a newer one since (then this tab's is the stale one) */
  addEventListener('pagehide', () => { try { if (!storedIsNewer()) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* no storage */ } mirrorOut(); clearTimeout(vaultTimer); vaultPush(); });
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (MONTHS.includes(h) && h !== sel) select(h); else if (h.indexOf('move=') === 0) { moveRead(); if (moveIn) { if (!hasData(S)) moveApply(); else { if (tab !== 'home') switchTab('home'); renderBackupNudge(); } } } });
}


/* ---------- start ---------- */
function initialMonth() {
  const h = location.hash.slice(1); if (MONTHS.includes(h)) return h;
  const d = new Date(), ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  return ym < START ? START : ym > END ? END : ym;
}
loadLocal(); moveRead(); if (moveIn && !hasData(S)) { const d = moveIn; moveIn = null; S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, S.ui, { sampleHidden: true }); delete S.ui.noMove; S.ui.bk = Date.now(); S.ui.movedIn = true; }
buildStatic(); sel = initialMonth(); wire(); render(); dpWatch(); setSave('device');
startHelp();
if (!(S.ui && S.ui.toured)) openTour(S.ui.tourAt, 'full');
if (S.ui.movedIn) { delete S.ui.movedIn; persist(); cheer('Your numbers are here.'); }
recoverMirror().then(() => vaultCheck()); paintBk();
})();
