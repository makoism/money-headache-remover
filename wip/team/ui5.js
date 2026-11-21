
/* ---------- wire up events ---------- */
function wire() {
  placeArt(); placePix(); GD.init();
  $$('[data-tab]').forEach(b => {
    /* a person changing tab is done with a small message about what just happened: that Undo bar goes (launch checklist Q7). The Undo
       of a big change (a 3-day copy) stays until it is tapped, closed or replaced by another Undo (QC round 6 data safety B1) */
    const byHand = () => { const u = $('#undoBar'); if (b.dataset.tab !== tab && !u.dataset.stay) u.hidden = true; };
    b.addEventListener('click', () => { byHand(); switchTab(b.dataset.tab); });
    b.addEventListener('keydown', e => {
      const bar = TAB_BAR.filter(n => { const x = $('#tab-' + n); return x && !x.hidden; }); /* only the tabs you can see */
      const i = bar.indexOf(b.dataset.tab); let j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % bar.length; else if (e.key === 'ArrowLeft') j = (i + bar.length - 1) % bar.length;
      if (i >= 0 && j >= 0) { e.preventDefault(); { const u = $('#undoBar'); if (!u.dataset.stay) u.hidden = true; } switchTab(bar[j], true); }
    });
  });
  $('#monthSel').addEventListener('change', e => select(e.target.value));
  $('#prevM').addEventListener('click', () => { const i = MONTHS.indexOf(sel); if (i > 0) select(MONTHS[i - 1]); });
  $('#nextM').addEventListener('click', () => { const i = MONTHS.indexOf(sel); if (i < MONTHS.length - 1) select(MONTHS[i + 1]); });
  $('#nameIn').addEventListener('input', e => { S.ui.name = cleanName(e.target.value); if (!S.ui.name) delete S.ui.name; persist(); render(); });
  $('#curSel').addEventListener('change', e => {
    const r = changeCurrency(e.target.value), z = presetKey(S) === 'blank';
    $('#curNote').textContent = r === 'all' ? (z ? 'All amounts are set to zero for this currency, so type in your own.' : 'Sample amounts now match this currency.')
      : r === 'plan' ? (z ? 'The sample bills and burrows are set to zero for this currency. Your pay and receipts didn\'t change.' : 'The sample bills and burrows now match this currency. Your pay and receipts didn\'t change.')
      : 'The amounts didn\'t change, only the symbol did.';
    if (r) restructure(); else render();
  });
  $('#hideSample').addEventListener('click', () => { S.ui.sampleHidden = true; persist(); render(); });
  $('#showStart').addEventListener('click', () => { delete S.ui.sampleHidden; delete S.ui.exactHidden; persist(); switchTab('home'); });
  /* buttons that jump somewhere, wherever they are on the page */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { openRow(o.dataset.open); return; }
    if (e.target.closest('[data-streak]')) { switchTab('home'); const m = $('#hMore'); if (m) m.open = true; const el = $('#hStreak'); if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); return; }
    const t = e.target.closest('[data-tab-go]'); if (t) { switchTab(t.dataset.tabGo); return; }
    const s = e.target.closest('[data-scroll]'); if (s) { const el = document.getElementById(s.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  $('#monthTable').addEventListener('click', e => { const r = e.target.closest('tr[data-ym]'); if (r) { select(r.dataset.ym); switchTab('month'); } });
  $('#monthTable').addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('tr[data-ym]'); if (r) { select(r.dataset.ym); switchTab('month'); } } });

  /* the ledger: one handler for every number, and for editing the lines */
  const led = $('#ledger');
  led.addEventListener('input', e => {
    const t = e.target, d = t.dataset || {};
    if (d.k) { if (t.classList.contains('amt-in') && t._refuse && Date.now() < t._refuse) { t.value = String(val(S, d.k, sel)); return; }
    if (t.classList.contains('amt-in') && /^\s*[-\u2212\u2013\uFF0D\u30FC\u2010-\u2015]/.test(t.value)) { t._refuse = Date.now() + 2500; try { cheer('Type the amount without a minus sign, the old amount stays'); } catch (x) { } t.value = String(val(S, d.k, sel)); t.blur(); return; } if (t.classList.contains('amt-in') && !hasMoneyOp(t.value) && parseFloat(t.value.replace(/[^\d.]/g, '')) > 1e9) { try { cheer('That amount is too big. The most is 1,000,000,000. The old amount stays.'); } catch (x) { } t._refuse = Date.now() + 2500; if (t._orig !== undefined) { t.value = String(t._orig); onSet(d.k, t._orig); } return; }   /* refused: the amount from before this typing comes back, never the largest amount (38.31 data safety round) */ if (t.classList.contains('amt-in') && hasMoneyOp(t.value)) { const sv = evalMoney(t.value); if (sv !== null && sv >= 0) onSet(d.k, sv); } else onSet(d.k, t.classList.contains('amt-in') ? t.value.replace(/[^\d.]/g, '').replace(/^(\d*\.\d*).*$/, '$1') : t.value); }
    else if (d.lname !== undefined && t.value.trim()) { updateLine(S, d.lname, { name: t.value }); persist(); }
  });
  led.addEventListener('focusin', e => { const t = e.target; if (t.classList && t.classList.contains('amt-in')) { t._orig = val(S, t.dataset.k, sel); t.value = String(t._orig); t.select(); } });
  led.addEventListener('focusout', e => { const t = e.target; if (t.classList && t.classList.contains('amt-in')) {
    /* a typed sum that does not come out as an amount (below zero, divided by zero) puts the old amount back */
    if (t.dataset.k && hasMoneyOp(t.value) && evalMoney(t.value) === null && t._orig !== undefined) { try { cheer('That sum doesn\'t work out to an amount so the old amount stays'); } catch (x) { } if (val(S, t.dataset.k, sel) !== t._orig) onSet(t.dataset.k, t._orig); }
    render(); } });
  /* decision 5: leaving the box ends a first entry; say once that it is now the usual amount */
  led.addEventListener('focusout', () => { if (FIRST_EDIT) { FIRST_EDIT = null; setTimeout(() => { try { cheer('Saved as the usual amount for every month.'); } catch (x) { } }, 1200); } });   /* after the first-pay badge line, so neither hides the other */
  led.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('amt-in')) e.target.blur(); });
  led.addEventListener('change', e => {
    const t = e.target, d = t.dataset || {};
    if (d.lname !== undefined) { const l = lineById(S, d.lname); updateLine(S, d.lname, { name: t.value }); if (l && l.jar === 'nec') markDone('bills'); persist(); restructure(); }
    else if (d.lends !== undefined) { updateLine(S, d.lends, { ends: t.value }); persist(); restructure(); }
    else if (d.lredir !== undefined) { updateLine(S, d.lredir, { redirect: t.checked }); persist(); render(); }
  });
  led.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'); if (ed) { editRow = editRow === ed.dataset.edit ? null : ed.dataset.edit; openId = ed.dataset.edit; restructure(); return; }
    const ld = e.target.closest('[data-ldel]'); if (ld) { const l0 = lineById(S, ld.dataset.ldel), ln = l0 ? l0.name : 'This line'; confirmClick(ld, `Tap again: removes ${ln} from every month. You can undo for ${KEEP_DAYS} days.`, () => { const sn = snapNoCopy(); keepCopy(sn, `${ln} was removed.`); offerUndo(sn, `${ln} removed. You can undo for ${KEEP_DAYS} days.`); const l = lineById(S, ld.dataset.ldel); if (l && l.jar === 'nec') markDone('bills', true); removeLine(S, ld.dataset.ldel); persist(); restructure(); }); return; }
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
      e.preventDefault(); const l = $('#addLabel'), a = $('#addAmt'), amt = clampAmt(a.value, S);
      if (!amt) { a.focus(); return; }
      S.items[sel] = readItems().concat([{ id: 'x' + Date.now().toString(36), label: l.value.trim() || 'One-time cost', amount: amt }]);
      l.value = ''; a.value = ''; itemsSig = ''; persist(); render();
      celebrate('small', 'Added.', $('#addItem button[type=submit]') || $('#addItem'));
    }
  });
  $('#rowsOut').addEventListener('change', e => { if (e.target.closest('#items')) { S.items[sel] = readItems(); persist(); render(); } });
  $('#resetMonth').addEventListener('click', e => confirmClick(e.currentTarget, `Tap again: removes the edits you made for this month. Receipts stay. You can undo for ${KEEP_DAYS} days.`, () => { const snR = snapNoCopy(); { const ym0 = sel, o0 = S.once[ym0] ? JSON.parse(JSON.stringify(S.once[ym0])) : undefined, i0 = S.items[ym0] !== undefined ? JSON.parse(JSON.stringify(S.items[ym0])) : undefined; offerUndo('reset', 'Month reset.', () => { if (o0 !== undefined) S.once[ym0] = o0; else delete S.once[ym0]; if (i0 !== undefined) S.items[ym0] = i0; else delete S.items[ym0]; }); } resetMonth(S, sel); keepCopy(snR, `${fullLabel(sel)} was reset.`); itemsSig = ''; persist(); render(); }));   /* a 3-day copy like every other big change (38.31 data safety round 4) */
  $('#fixBtns').addEventListener('click', e => {
    const b = e.target.closest('[data-fx]'); if (!b) return; const f = b.dataset.fx, m = C.byYm[sel];
    if (f === 'trim') trimPlay(S, m, sel, +b.dataset.amt);
    else if (f === 'borrow') setVal(S, 'draw', sel, m.draw + (+b.dataset.amt), 'once');   /* what is already borrowed this month plus what is still missing */
    else if (f === 'unborrow') setVal(S, 'draw', sel, 0, 'once');
    else if (f === 'borrowfit') setVal(S, 'draw', sel, +b.dataset.amt, 'once');   /* only what the plan needs now (QC8 SF6) */
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
    else { const gd = e.target.closest('[data-gdel]'); if (gd) { const g0 = goalById(S, id), r0 = HV && HV.goals ? HV.goals.find(r => r.id === id) : null, nm = g0 ? g0.name : 'This goal', mg0 = HV && C.byYm[HV.ym] && C.byYm[HV.ym].g[id], plan0 = mg0 ? mg0.actual : 0, saved0 = r0 && r0.savedNow > 0 ? r0.savedNow : 0, what = nm + (plan0 > 0 ? ` and its ${fmt2(plan0)} planned this month` : '');   /* saved now and planned apart (QC round 4 data safety 3); the saved money stops being counted, so it says so (QC round 6 data safety C2) */   /* names what goes, keeps a copy (38.31 data safety round 3) */
      confirmClick(gd, `Tap again: removes ${what}.${saved0 > 0 ? ` Its ${fmt2(saved0)} saved stops being counted. Move it to another burrow first if you still have it.` : ''} You can undo for ${KEEP_DAYS} days.`, () => { const sn = snapNoCopy(); removeGoal(S, id); keepCopy(sn, `${nm} was removed.`); offerUndo(sn, `${nm} removed. You can undo for ${KEEP_DAYS} days.`); markDone('goals', true); if (editGoal === id) editGoal = null; persist(); restructure(); }); } }
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
  SETF.forEach(f => { const go = e => onCfg(f.k, +e.target.value || 0); $('#st-' + f.k).addEventListener('input', go); $('#st-' + f.k).addEventListener('change', go); });
  $('#redivide').addEventListener('click', e => confirmClick(e.currentTarget, `Tap again: opens the setup steps. They can replace your goals and saved amounts. You can undo for ${KEEP_DAYS} days.`, () => openSetupWithCopy('jars', 'full')));
  const copyBox = async (ta, msg) => {
    ta.focus(); ta.select();
    try { await navigator.clipboard.writeText(ta.value); msg.textContent = 'Copied.'; return true; } catch (e) { /* try the older way */ }
    try { if (document.execCommand('copy')) { msg.textContent = 'Copied.'; return true; } } catch (e) { /* fall through */ }
    msg.textContent = 'Press Ctrl+C, or Cmd+C on a Mac, to copy the selected text.';
    return false;
  };
  $('#rcCopy').addEventListener('click', () => copyBox($('#rcEventText'), $('#rcCopyMsg')));
  $('#bkCopy').addEventListener('click', () => { const ta = $('#bk'); ta.value = JSON.stringify(S); copyBox(ta, $('#bkMsg')).then(ok => { if (ok) markBackup(); }); });
  /* the text is checked before anything asks to replace the numbers (QC round 5 wording B1) */
  const BK_BAD = "This isn't a backup. Paste the whole text from Copy text, or tap Choose file.", bkOK = t => { try { const d = JSON.parse(t); return !!(d && typeof d === 'object' && d.steps && d.once && d.cfg); } catch (e) { return false; } };
  const loadBackup = () => {
    const msg = $('#bkMsg');
    try {
      const d = JSON.parse($('#bk').value);
      if (!d || typeof d !== 'object' || !d.steps || !d.once || !d.cfg) throw new Error('bad');
      const old = S, oldSnap = snapNoCopy(); offerUndo(oldSnap, `Backup loaded. You can undo for ${KEEP_DAYS} days.`); S = upgradeLegacy(normalize(d)); S.ui = Object.assign({}, old.ui, S.ui, { sampleHidden: true }); keepCopy(oldSnap, 'A backup replaced your numbers.');
      if (!Array.isArray(d.receipts)) S.receipts = old.receipts;
      editRow = null; editGoal = null; editRc = null; itemsSig = ''; S.ui.bk = Date.now(); delete S.ui.bkLater; persist(); restructure(); msg.textContent = 'Loaded.'; sfx('next');
    } catch (e) { msg.textContent = BK_BAD; }
  };
  /* a file for the person to keep. In the Claude viewer plain downloads are blocked, so the viewer's own save prompt is used there; elsewhere the browser downloads it. */
  const saveOut = async (name, text, mime, msg, alt0) => {
    const base = t => { msg.textContent = t; };   /* a function is the other way out when no file can be saved (J-009): it runs, then says what it did */
    const out = async t => { base(t + (typeof alt0 === 'function' ? await alt0() : alt0)); return false; };
    if (inArtifact()) {
      let dl = null; try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
      if (!dl || typeof dl.save !== 'function') return out('This view can\'t download files.');
      try { await dl.save({ filename: name, data: text }); msg.textContent = 'Saved.'; sfx('next'); return true; }
      catch (e) { if (e && e.code === 'declined') { base('Not saved.'); return false; } return out('The save didn\'t work so try it again.'); }
    }
    try {
      const blob = new Blob([text], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500); msg.textContent = 'Saved to downloads.'; sfx('next'); return true;
    } catch (e) { return out('This browser didn\'t save the file so try it again.'); }
  };
  /* Export spreadsheet with no way to save a file: the same table goes to the clipboard, tab separated, so it pastes into cells (J-009) */
  const csvCopy = async () => {
    try { const t = sheetRows(S, calcAll(S)).map(r => r.map(c => String(c == null ? '' : c).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n'); await navigator.clipboard.writeText(t); return ' The table was copied instead, so you can paste it into Sheets or Excel.'; }
    catch (e) { return ' The table could not be copied either. Copy text, above, still keeps your numbers.'; }
  };
  const stamp = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  /* the file save is shared with the reminder on Home (bkRun, ui43.js); a saved file counts as a backup */
  bkRun = async () => { const ok = await saveOut(`mhr2000-${stamp()}.json`, JSON.stringify(S), 'application/json', $('#bkMsg'), ' Use Copy text.'); if (ok) markBackup(); return ok; };
  $('#bkSave').addEventListener('click', () => { bkRun(); });
  $('#bkCsv').addEventListener('click', () => { let t; try { t = sheetCsv(S, calcAll(S)); } catch (e) { $('#bkMsg').textContent = 'The spreadsheet couldn\'t be made. Try again. If it still won\'t, Save file above still backs up your numbers.'; return; } saveOut(`mhr2000-plan-${stamp()}.csv`, t, 'text/csv;charset=utf-8', $('#bkMsg'), csvCopy); });
  $('#bkFileBtn').addEventListener('click', () => $('#bkFile').click());
  $('#bkFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0], msg = $('#bkMsg'); e.target.value = ''; if (!f) return;
    if (f.size > 20e6) { msg.textContent = 'That file is too big to be a backup.'; return; }
    const r = new FileReader(); r.onerror = () => { msg.textContent = 'That file couldn\'t be read. Tap Choose file and pick it again, or paste the backup text in the box and tap Load text.'; };
    r.onload = () => { const t = String(r.result || ''); $('#bk').value = t; let ok = false; try { const d = JSON.parse(t); ok = !!(d && typeof d === 'object' && d.steps && d.once && d.cfg); } catch (e) { } $('#bkMsg').textContent = ok ? `The file is read and its text is in the box above. Tap Load text, then tap it again to replace the numbers here with what's in the file. You can undo for ${KEEP_DAYS} days.` : "That file isn't a backup. Pick the file Save file made, or paste the whole text from Copy text."; }; r.readAsText(f);   /* a picked file never replaces anything on its own (38.31 data safety round 2) */
  });
  const twoStep = (b, armedText, run, check) => {
    let t = 0, orig = '', armedAt = 0;
    b.addEventListener('click', () => {
      if (!t && check && check() === false) return;   /* nothing to ask about: check() said why */
      if (t && Date.now() - armedAt < 600) return;   /* a double tap never confirms: the warning gets read first (38.31 data safety round 4) */
      if (!t) { armedAt = Date.now(); orig = b.textContent; b.dataset.armed = '1'; t = setTimeout(() => { t = 0; b.textContent = orig; delete b.dataset.armed; }, 4000); b.textContent = typeof armedText === 'function' ? armedText() : armedText; return; }
      clearTimeout(t); t = 0; b.textContent = orig; delete b.dataset.armed; run();
    });
  };
  /* Set all to zero and Restore samples replace every number: a copy of before is kept for KEEP_DAYS days */
  let undoSnap = null, undoT = 0;
  let undoFn = null;
  /* a big change (a copy of before, or a month reset) keeps its Undo bar until it is tapped, closed or replaced by another Undo, also
     across tab changes; a small one (a receipt, an answer about last month's money) goes by itself (QC round 6 data safety B1) */
  const offerUndo = (snap, txt, fn, ms) => { undoFn = fn || null; undoSnap = snap; $('#undoTxt').textContent = txt; const u = $('#undoBar'); u.hidden = false; clearTimeout(undoT);
    { const c = $('#cheer'), r = u.getBoundingClientRect(); if (c && c.classList.contains('on') && r.height && !document.body.classList.contains('touring')) c.style.bottom = Math.round(innerHeight - r.top + 8) + 'px'; }   /* a message already up moves above the bar, however tall the bar is */
    if (!ms && snap !== 'receipt' && snap !== 'sweep') { u.dataset.stay = '1'; return; }
    delete u.dataset.stay; undoT = setTimeout(() => { u.hidden = true; undoSnap = null; undoFn = null; }, ms || 30000); };
  /* while the Undo bar is up, a box or button that scrolls itself into view stays clear of it as well as of the Help strip (the bar of a
     big change stays across tabs, so it can sit over a form: the Add a card Save, QC round 6 merge) */
  { const ub = $('#undoBar'), pad = () => { const r = !ub.hidden && ub.getClientRects().length ? ub.getBoundingClientRect() : null; document.documentElement.style.scrollPaddingBottom = r && r.height ? Math.round(innerHeight - r.top + 8) + 'px' : ''; };
    new MutationObserver(pad).observe(ub, { attributes: true, attributeFilter: ['hidden'] }); addEventListener('resize', pad); }
  const undoHide = () => { clearTimeout(undoT); const u = $('#undoBar'); u.hidden = true; delete u.dataset.stay; undoSnap = null; undoFn = null; };
  $('#undoX').addEventListener('click', undoHide);   /* Close: the copy from before stays in Settings, Put them back, for its days */
  window.offerUndoG = offerUndo;
  /* the setup steps were opened by Re-split pay and the page was closed part-way: the copy from before is still one tap away */
  if (S.ui && S.ui.preSplit && !tourIsOpen) { const sn = S.ui.preSplit; delete S.ui.preSplit; keepCopy(sn, 'Setup was changing your plan.'); persist(); }
  /* the copy from before a big change is offered again on every open for 3 days, then let go */
  if (S.ui && S.ui.keep) { const k = S.ui.keep; if (!(typeof k.snap === 'string' && +k.t > 0) || Date.now() - k.t > KEEP_DAYS * 864e5) { delete S.ui.keep; persist(); } else offerUndo(k.snap, `${k.why || 'Your numbers changed.'} You can undo until ${dateLabel(ymd(new Date(+k.t + KEEP_DAYS * 864e5)))}.${k.cloud && !k.act ? ' Undo also stops sharing the cloud copy on this device.' : ''}`, k.act ? () => restoreKept(k.snap, k.added) : k.cloud ? () => { vaultUndoLoad(); S = normalize(JSON.parse(k.snap)); } : null); }   /* a copy an action kept: Undo keeps the receipts logged since (actions.js restoreKept) */
  $('#keepBack').addEventListener('click', () => {
    const k = S.ui && S.ui.keep; if (!(k && typeof k.snap === 'string')) return;
    const cur = snapNoCopy(); undoHide();
    if (k.act) restoreKept(k.snap, k.added); else { if (k.cloud) vaultUndoLoad(); S = normalize(JSON.parse(k.snap)); }   /* a cloud load: stop sharing first (QC round 5 data safety B1) */
    keepCopy(cur, 'You put back the numbers from before.');   /* what was there is kept in its place, so this can be undone too */
    editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = ''; sfx('back');
    cheer(`Your numbers from before are back. What was there is kept for ${KEEP_DAYS} days.`);
  });
  $('#undoGo').addEventListener('click', () => { if (!undoSnap) return; const fn = undoFn, sn = undoSnap; undoHide(); if (fn) fn(); else S = normalize(JSON.parse(sn)); editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = ''; sfx('back'); cheer('Your numbers are back.'); });
  const blank = () => { const sn0 = snapNoCopy(); offerUndo(sn0, `All your numbers are set to zero. You can undo for ${KEEP_DAYS} days.`); S = blankState(S, sampleOn()); S.ui.cleared = true; delete S.ui.setup; delete S.ui.src; delete S.ui.imp; keepCopy(sn0, 'Your numbers were set to zero.'); editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = 'Everything is at zero now, start with your pay';   /* a 3-day copy like every other big change (38.31 data safety round 4) */ select(START); if (tab !== 'month') switchTab('month'); };
  twoStep($('#blankBtn'), `Tap again: clears pay, bills, goals, saved amounts and your balance. Receipts stay. You can undo for ${KEEP_DAYS} days.`, blank);
  twoStep($('#blankTop'), `Tap again: clears pay, bills, goals, saved amounts and your balance. Receipts stay. You can undo for ${KEEP_DAYS} days.`, blank);
  /* the confirm says how old the backup is and what is in it, from its own saved time and receipts (QC round 7 data safety confusing 3) */
  const bkAsk = () => {
    let d = null; try { d = JSON.parse($('#bk').value); } catch (e) { d = null; }
    const t = d && +d.rev > 946684800000 ? new Date(+d.rev) : null, n = d && Array.isArray(d.receipts) ? d.receipts.length : -1;
    const day = t ? ' from ' + t.getDate() + ' ' + t.toLocaleString('en-US', { month: 'short' }) + (t.getFullYear() !== new Date().getFullYear() ? ' ' + t.getFullYear() : '') : '';
    const has = n < 0 ? '' : n === 0 ? ', which has no receipts' : `, which has ${n} receipt${n === 1 ? '' : 's'}`;
    return `Tap again: replaces your numbers here with the backup${day}${has}. You can undo for ${KEEP_DAYS} days.`;
  };
  twoStep($('#bkLoad'), bkAsk, loadBackup, () => { if (bkOK($('#bk').value)) return true; $('#bkMsg').textContent = BK_BAD; return false; });
  twoStep($('#setupOpen'), `Tap again: setup can change your pay, bills, goals and saved amounts. You can undo for ${KEEP_DAYS} days.`, () => openSetupWithCopy(undefined, 'full'));   /* both ask first, and keep a copy (38.31 data safety round 2) */
  /* only some currencies have samples; for the rest this button clears the plan, and every word says so (38.31 data safety round 3) */
  const hasSamples = () => !!SAMPLES[(S.ui && S.ui.cur) || '₱'];
  twoStep($('#bkReset'), () => hasSamples() ? `Tap again: puts the sample pay, bills and burrows in place of yours. Receipts stay. You can undo for ${KEEP_DAYS} days.` : `Tap again: clears your pay, bills, goals and balance. Receipts stay. You can undo for ${KEEP_DAYS} days.`, () => { const smp = hasSamples(), sn0 = snapNoCopy(); offerUndo(sn0, `${smp ? 'Samples restored' : 'Plan cleared'}. You can undo for ${KEEP_DAYS} days.`); const old = S, u = S.ui; S = presetState(u.cur); S.ui = Object.assign({}, u, { preset: S.ui.preset, sampleHidden: false, done: {} }); delete S.ui.cleared; delete S.ui.setup; delete S.ui.gset; delete S.ui.sb; delete S.ui.tourAt; delete S.ui.src; delete S.ui.imp; S.receipts = old.receipts; keepCopy(sn0, smp ? 'Samples replaced your numbers.' : 'Your plan was cleared.'); editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); $('#bkMsg').textContent = smp ? 'Samples restored.' : 'Plan cleared.'; });
  wireReceipts(); safe(() => BUR.boot(), null, 'burrow'); wireTour(); wireHelp(); wireHome(); wireScan(); wireAskAi(); wireSafe(); wireVault(); safe(() => DJ.wire(), null, 'dj'); safe(() => SCENE.start(), null, 'scene'); safe(() => WORLD.wire(), null, 'world');

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
