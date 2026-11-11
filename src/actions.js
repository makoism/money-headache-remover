/* ===== ACTIONS: the one door for changing the numbers =====
   The model (model.js) holds the arithmetic and the small mutation primitives. This file wraps them as named, checked,
   undoable actions, so that the screens, the guided setup, the statement import and the assistant all change the plan the
   same way and every change can be taken back. Nothing here computes money: it only moves values into S and redraws.

   Use: ACT.tx('label', () => { ACT.setPay(3200); ACT.setLine('rent', 1500); }) runs one undoable transaction (one save, one redraw).
   A single ACT.* call outside tx() is its own transaction. ACT.undo() takes back the last one. ACT.summary() reads the key numbers. */
const UNDO_MAX = 12, UI_SNAP = ['sb', 'subs', 'subP', 'subO', 'cardT', 'cardB', 'loans', 'more', 'gk', 'win', 'done', 'name', 'cur', 'home', 'hopes', 'cleared', 'preset', 'sampleHidden'];
let txDepth = 0, txTouched = false, undoStack = [];
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function snapState() {
  const ui = {}; UI_SNAP.forEach(k => { if (S.ui[k] !== undefined) ui[k] = clone(S.ui[k]); });
  return { steps: clone(S.steps), once: clone(S.once), items: clone(S.items), cfg: clone(S.cfg), plan: clone(S.plan), ui, receipts: clone(S.receipts || []), ids: new Set((S.receipts || []).map(r => r.id)) };
}
function restoreState(snap, postIds) {
  S.steps = clone(snap.steps); S.once = clone(snap.once); S.items = clone(snap.items); S.cfg = clone(snap.cfg); S.plan = clone(snap.plan);
  UI_SNAP.forEach(k => { if (snap.ui[k] !== undefined) S.ui[k] = clone(snap.ui[k]); else delete S.ui[k]; });
  /* receipts logged after the transaction stay */
  const later = (S.receipts || []).filter(r => !postIds.has(r.id));
  S.receipts = clone(snap.receipts).concat(later);
}
const ACT = {
  /* ---- transactions ---- */
  tx(label, fn) {
    if (txDepth) { txDepth++; try { return fn(); } finally { txDepth--; } }
    const before = snapState(); txDepth = 1; txTouched = false; let out;
    try { out = fn(); } finally { txDepth = 0; }
    const postIds = new Set((S.receipts || []).map(r => r.id));
    const changed = JSON.stringify([S.steps, S.once, S.items, S.cfg, S.plan, S.receipts]) !== JSON.stringify([before.steps, before.once, before.items, before.cfg, before.plan, before.receipts])
      || UI_SNAP.some(k => JSON.stringify(S.ui[k]) !== JSON.stringify(before.ui[k]));
    if (changed) { undoStack.push({ label: String(label || 'change'), before, postIds, at: Date.now() }); if (undoStack.length > UNDO_MAX) undoStack.shift(); }
    ACT.commit();
    return out;
  },
  /* save and redraw once. Inside a transaction the outer call does it. */
  commit() { if (txDepth) { txTouched = true; return; } editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist(); restructure(); },
  canUndo() { return undoStack.length > 0; },
  lastLabel() { return undoStack.length ? undoStack[undoStack.length - 1].label : ''; },
  undo() {
    const u = undoStack.pop(); if (!u) return false;
    restoreState(u.before, u.postIds); ACT.commit(); return true;
  },
  /* forget the undo history, for example after a restore from a backup */
  clearUndo() { undoStack = []; },

  /* ---- income and balance ---- */
  setPay(amount, scope, ym) { return ACT.setIncome('a', amount, scope, ym); },
  setIncome(key, amount, scope, ym) {
    if (['a', 'b', 'side'].indexOf(key) < 0) throw new Error('unknown income ' + key);
    return ACT.tx('income', () => { setVal(S, key, ym || START, clampAmt(amount), scope === 'month' ? 'month' : 'after'); if (key === 'a' && clampAmt(amount) > 0) markDone('pay', true); });
  },
  setBalance(v) { return ACT.tx('balance', () => { S.cfg.bankStart = clampAmt(v); }); },
  setMinBalance(v) { return ACT.tx('minimum balance', () => { S.cfg.minBank = clampAmt(v); }); },
  setCeiling(v) { return ACT.tx('spending ceiling', () => { S.cfg.ceiling = clampAmt(v); }); },

  /* ---- lines (bills and the other jars) ---- */
  setLine(key, amount, scope, ym) {
    const l = lineByKey(S, key); if (!l) throw new Error('unknown line ' + key);
    return ACT.tx('line', () => { setVal(S, key, ym || START, clampAmt(amount), scope === 'month' ? 'month' : 'after'); if (l.jar === 'nec') markDone('bills', true); });
  },
  renameLine(id, name) { return ACT.tx('rename', () => updateLine(S, id, { name: cleanSubName(name) })); },
  setLineEnds(id, ends, redirect) { return ACT.tx('last payment', () => updateLine(S, id, Object.assign({ ends: ends || '' }, redirect === undefined ? {} : { redirect: !!redirect }))); },
  addLine(jar, name, amount) { return ACT.tx('add line', () => addLine(S, jar, cleanSubName(name), clampAmt(amount))); },
  removeLine(id) { return ACT.tx('remove line', () => removeLine(S, id)); },

  /* ---- goals ---- */
  addGoal(g) {
    return ACT.tx('add goal', () => {
      const id = addGoal(S, cleanSubName(g && g.name)); if (!id) return null;
      const patch = {}; ['target', 'start', 'due', 'emergency', 'stretch'].forEach(k => { if (g && g[k] !== undefined) patch[k] = g[k]; });
      updateGoal(S, id, patch);
      if (g && g.kind) { S.ui.gk = Object.assign({}, S.ui.gk, { [id]: g.kind }); }
      if (g && g.monthly !== undefined && g.monthly !== null) setVal(S, 'goal:' + id, START, clampAmt(g.monthly), 'after');
      markDone('goals', true); return id;
    });
  },
  updateGoal(id, patch) { if (!goalById(S, id)) throw new Error('unknown goal ' + id); return ACT.tx('goal', () => updateGoal(S, id, Object.assign({}, patch, patch && patch.name !== undefined ? { name: cleanSubName(patch.name) } : {}))); },
  removeGoal(id) { return ACT.tx('remove goal', () => removeGoal(S, id)); },
  /* a goal's monthly saving: an amount, or null to go back to the suggested amount */
  setGoalSaving(id, amount, scope, ym) {
    if (!goalById(S, id)) throw new Error('unknown goal ' + id);
    return ACT.tx('goal saving', () => { if (amount === null || amount === undefined) useSuggested(S, id); else setVal(S, 'goal:' + id, ym || START, clampAmt(amount), scope === 'month' ? 'month' : 'after'); });
  },

  /* ---- jars ---- */
  setAims(aims) {
    return ACT.tx('jar split', () => { const a = {}; JARS.forEach(j => { const v = +(aims && aims[j.id]); a[j.id] = isFinite(v) && v >= 0 && v <= 1 ? v : aimsOf(S)[j.id]; }); S.cfg.aims = a; });
  },

  /* ---- receipts ---- */
  addReceipts(list) {
    return ACT.tx('receipts', () => { const ids = []; (list || []).forEach(r => { const id = addReceipt(S, r.d, r.a, r.c, r.n); if (id) ids.push(id); }); if (ids.length) markDone('receipts', true); return ids; });
  },
  removeReceipts(ids) { return ACT.tx('remove receipts', () => { (ids || []).forEach(id => removeReceipt(S, id)); }); },

  /* ---- about the person and the page ---- */
  setName(name) { return ACT.tx('name', () => { const n = cleanName(name); if (n) S.ui.name = n; else delete S.ui.name; }); },
  setCurrency(cur) { return ACT.tx('currency', () => { if (typeof cur === 'string' && cur && cur.length <= 4) S.ui.cur = cur; }); },
  /* what Home shows and in what order: a list of section ids (see HOME_SECTIONS in ui6.js); unknown ids are dropped, missing ones hidden */
  setHome(order) {
    return ACT.tx('home layout', () => {
      const ok = Array.isArray(order) ? order.filter((id, i) => HOME_SECTIONS.indexOf(id) >= 0 && order.indexOf(id) === i) : [];
      if (!ok.length || ok.join() === HOME_SECTIONS.join()) delete S.ui.home; else S.ui.home = ok;
    });
  },

  /* ---- reading ---- */
  /* the key numbers of one month, for before/after comparisons: nothing here is computed, it is read from the model */
  summary(ym) {
    const C2 = calcAll(S), m = C2.byYm[ym || nowYm()], V = viewOf(S, C2, ym || nowYm(), ymd(new Date()));
    return {
      month: ym || nowYm(), income: m.pool.in, left: m.pool.left, bankEnd: m.bankEnd, status: statusOf(S, m), play: m.jar.play,
      jars: jarsOf(S, m).list.map(j => ({ id: j.id, name: j.name, amount: j.v, pct: j.pct })),
      goals: V.goals.map(r => ({ id: r.id, name: r.name, target: r.target, saved: r.saved, monthly: val(S, 'goal:' + r.id, ym || nowYm()), pct: r.pct, state: r.state, reached: r.reached || null, months: r.months, due: r.due || '' })),
    };
  },
};
