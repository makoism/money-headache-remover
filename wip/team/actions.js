/* ===== ACTIONS: the one door for changing the numbers =====
   The model (model.js) holds the arithmetic and the small mutation primitives. This file wraps them as named, checked,
   undoable actions, so that the screens, the guided setup, the statement import and the assistant all change the plan the
   same way and every change can be taken back. Nothing here computes money: it only moves values into S and redraws.

   Use: ACT.tx('label', () => { ACT.setPay(3200); ACT.setLine('rent', 1500); }) runs one undoable transaction (one save, one redraw).
   A single ACT.* call outside tx() is its own transaction. ACT.undo() takes back the last one. ACT.summary() reads the key numbers. */
const UNDO_MAX = 12, UI_SNAP = ['sb', 'subs', 'subP', 'subO', 'cardT', 'cardB', 'loans', 'more', 'gk', 'win', 'done', 'name', 'cur', 'home', 'hopes', 'cleared', 'preset', 'sampleHidden', 'ms'];
/* NOBODY LOSES DATA, the ACT door (LANE_act_keep.md). An action that can replace or remove many values at once keeps the 3-day copy the
   screens keep (S.ui.keep, ui45.js keepCopy), so Undo is still there after a reload: ACT.tx called from outside (the assistant's Apply,
   setup from statements), every removal, and the top-up family (Add money on a burrow). An action that sets ONE typed value passes ONE
   and keeps no copy: its Undo lasts for the visit, and a small edit never pushes out the copy of a big change (there is one slot).
   The copy remembers which receipts the action itself added, so a late Undo keeps every receipt logged after it. */
const ONE = { one: true };
const KEEP_WHY = { assistant: 'Ask changed your plan.', 'setup from statements': 'Setup from your statements changed your plan.', 'remove goal': 'A burrow was removed.', 'remove line': 'A line was removed from your plan.',
  'remove receipts': 'Receipts were deleted.', 'remove card': 'A card was removed.', 'top-up': 'Unspent money was moved.', 'undo top-up': 'Money was taken back out of a burrow.' };
/* these have their own Undo on the screen they are used on, so the bar does not also show in the same visit (it does after a reload) */
const KEEP_QUIET = { assistant: 1, 'top-up': 1, 'undo top-up': 1 };
/* Undo from a copy an action kept: the numbers from before it, plus every receipt logged since that the action did not add itself */
function restoreKept(snap, added) {
  const d = normalize(JSON.parse(snap)), had = new Set((d.receipts || []).map(r => r.id)), own = new Set(added || []);
  const later = (S.receipts || []).filter(r => !had.has(r.id) && !own.has(r.id));
  S = d; S.receipts = (S.receipts || []).concat(later); undoStack = [];
}
let txDepth = 0, txTouched = false, undoStack = [], drawOwed = false, drawTimer = 0;
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function snapState() {
  const ui = {}; UI_SNAP.forEach(k => { if (S.ui[k] !== undefined) ui[k] = clone(S.ui[k]); });
  return { steps: clone(S.steps), once: clone(S.once), items: clone(S.items), cfg: clone(S.cfg), plan: clone(S.plan), cards: clone(S.cards), ui, receipts: clone(S.receipts || []), ids: new Set((S.receipts || []).map(r => r.id)) };
}
function restoreState(snap, postIds) {
  S.steps = clone(snap.steps); S.once = clone(snap.once); S.items = clone(snap.items); S.cfg = clone(snap.cfg); S.plan = clone(snap.plan); if (snap.cards === undefined) delete S.cards; else S.cards = clone(snap.cards);
  UI_SNAP.forEach(k => { if (snap.ui[k] !== undefined) S.ui[k] = clone(snap.ui[k]); else delete S.ui[k]; });
  /* receipts logged after the transaction stay */
  const later = (S.receipts || []).filter(r => !postIds.has(r.id));
  S.receipts = clone(snap.receipts).concat(later);
}
const one = (label, fn) => ACT.tx(label, fn, ONE);
const ACT = {
  /* ---- transactions ---- */
  tx(label, fn, one, whyText) {
    if (txDepth) { txDepth++; try { return fn(); } finally { txDepth--; } }
    const keeps = one !== ONE && typeof snapNoCopy === 'function', kept = keeps ? snapNoCopy() : null;
    const before = snapState(); txDepth = 1; txTouched = false; let out;
    try { out = fn(); } finally { txDepth = 0; }
    const postIds = new Set((S.receipts || []).map(r => r.id));
    const changed = JSON.stringify([S.steps, S.once, S.items, S.cfg, S.plan, S.receipts, S.cards]) !== JSON.stringify([before.steps, before.once, before.items, before.cfg, before.plan, before.receipts, before.cards])
      || UI_SNAP.some(k => JSON.stringify(S.ui[k]) !== JSON.stringify(before.ui[k]));
    if (changed) {
      const u = { label: String(label || 'change'), before, postIds, at: Date.now() };
      if (keeps) {
        const had = before.ids, added = (S.receipts || []).filter(r => !had.has(r.id)).map(r => r.id), why = whyText || KEEP_WHY[label] || 'Your plan was changed.';
        keepCopy(kept, why); S.ui.keep.act = 1; if (added.length) S.ui.keep.added = added; u.keptAt = S.ui.keep.t;
        if (!KEEP_QUIET[label] && window.offerUndoG) window.offerUndoG(kept, `${why} You can undo for ${KEEP_DAYS} days.`, () => restoreKept(kept, added));
      }
      undoStack.push(u); if (undoStack.length > UNDO_MAX) undoStack.shift();
    }
    ACT.commit();
    return out;
  },
  /* save and redraw once. Inside a transaction the outer call does it. */
  commit() {
    if (txDepth) { txTouched = true; return; } editRow = null; editGoal = null; editRc = null; itemsSig = ''; persist();
    /* F4: while a burrow's own screen covers the page, the page behind is hidden, so its redraw (most of a tap's work on a slow phone) waits.
       The numbers are worked out now (the burrow screen reads C); the hidden page is redrawn a moment later, or at the latest when the burrow closes. */
    if (document.body.classList.contains('bv-on')) { C = calcAll(S); drawOwed = true; clearTimeout(drawTimer); drawTimer = setTimeout(ACT.drawNow, 1500); return; }
    drawOwed = false; clearTimeout(drawTimer); restructure();
  },
  /* redraw the page now if a redraw was put off (burrows.js calls this when a burrow closes) */
  drawNow() { clearTimeout(drawTimer); if (!drawOwed) return false; drawOwed = false; restructure(); return true; },
  canUndo() { return undoStack.length > 0; },
  lastLabel() { return undoStack.length ? undoStack[undoStack.length - 1].label : ''; },
  undo() {
    const u = undoStack.pop(); if (!u) return false;
    restoreState(u.before, u.postIds);
    /* the copy that action kept is let go with it, so a change already taken back is not offered again after a reload */
    if (u.keptAt && S.ui.keep && S.ui.keep.t === u.keptAt) delete S.ui.keep;
    ACT.commit(); return true;
  },
  /* forget the undo history, for example after a restore from a backup */
  clearUndo() { undoStack = []; },

  /* ---- income and balance ---- */
  setPay(amount, scope, ym) { return ACT.setIncome('a', amount, scope, ym); },
  setIncome(key, amount, scope, ym) {
    if (['a', 'b', 'side'].indexOf(key) < 0) throw new Error('unknown income ' + key);
    return one('income', () => { setVal(S, key, ym || START, clampAmt(amount, S), scope === 'month' ? 'month' : 'after'); if (key === 'a' && clampAmt(amount, S) > 0) markDone('pay', true); });
  },
  setBalance(v) { return one('balance', () => { setBankBalance(S, clampBank(v, S)); }); },   /* a bank balance may be below zero (overdrawn), as in Settings */
  /* A1: what the bank app shows today, kept apart from bankStart (model.js setBankNow) */
  setBankNow(v) { return one('bank now', () => { setBankNow(S, clampBank(v, S)); }); },
  /* A5: a pay-in-full card, what is on it now and the day it is paid; id null adds one */
  setCard(id, o) { return one('card', () => { const list = cleanCards(S.cards); const d = new Date(), at = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    const row = { id: id || ('k' + Date.now().toString(36)), name: o.name, owed: clampAmt(o.owed, S), payDay: o.payDay, at };
    const i = list.findIndex(k => k.id === id); if (i >= 0) list[i] = row; else list.push(row); S.cards = cleanCards(list); }); },
  removeCard(id) { return ACT.tx('remove card', () => { S.cards = cleanCards(S.cards).filter(k => k.id !== id); }); },
  setMinBalance(v) { return one('minimum balance', () => { S.cfg.minBank = clampAmt(v, S); }); },
  setCeiling(v) { return one('spending ceiling', () => { S.cfg.ceiling = clampAmt(v, S); }); },

  /* ---- lines (bills and the other jars) ---- */
  setLine(key, amount, scope, ym) {
    const l = lineByKey(S, key); if (!l) throw new Error('unknown line ' + key);
    return one('line', () => { setVal(S, key, ym || START, clampAmt(amount, S), scope === 'month' ? 'month' : 'after'); if (l.jar === 'nec') markDone('bills', true); });
  },
  renameLine(id, name) { return one('rename', () => updateLine(S, id, { name: cleanSubName(name) })); },
  setLineEnds(id, ends, redirect) { return one('last payment', () => updateLine(S, id, Object.assign({ ends: ends || '' }, redirect === undefined ? {} : { redirect: !!redirect }))); },
  addLine(jar, name, amount) { return one('add line', () => addLine(S, jar, cleanSubName(name), clampAmt(amount, S))); },
  removeLine(id) { return ACT.tx('remove line', () => removeLine(S, id)); },

  /* ---- goals ---- */
  addGoal(g) {
    return one('add goal', () => {
      const id = addGoal(S, cleanSubName(g && g.name)); if (!id) return null;
      const patch = {}; ['target', 'start', 'due', 'emergency', 'stretch'].forEach(k => { if (g && g[k] !== undefined) patch[k] = g[k]; });
      updateGoal(S, id, patch);
      if (g && g.kind) { S.ui.gk = Object.assign({}, S.ui.gk, { [id]: g.kind }); }
      if (g && g.monthly !== undefined && g.monthly !== null) setVal(S, 'goal:' + id, START, clampAmt(g.monthly, S), 'after');
      markDone('goals', true); return id;
    });
  },
  updateGoal(id, patch) { if (!goalById(S, id)) throw new Error('unknown goal ' + id); return one('goal', () => updateGoal(S, id, Object.assign({}, patch, patch && patch.name !== undefined ? { name: cleanSubName(patch.name) } : {}))); },
  removeGoal(id) { return ACT.tx('remove goal', () => removeGoal(S, id)); },
  /* a goal's monthly saving: an amount, or null to go back to the suggested amount */
  setGoalSaving(id, amount, scope, ym) {
    if (!goalById(S, id)) throw new Error('unknown goal ' + id);
    return one('goal saving', () => { if (amount === null || amount === undefined) useSuggested(S, id); else setVal(S, 'goal:' + id, ym || START, clampAmt(amount, S), scope === 'month' ? 'month' : 'after'); });
  },

  /* a month's unspent play money put toward a goal, for that month only (see sweepPlay); returns what was moved */
  sweep(ym, goalId, amount) {
    if (!goalById(S, goalId)) throw new Error('unknown goal ' + goalId); if (MONTHS.indexOf(ym) < 0) throw new Error('unknown month ' + ym);
    return ACT.tx('top-up', () => sweepPlay(S, ym, goalId, amount), null, 'Money was added to a burrow.');
  },

  /* put back what a sweep moved, and only that */
  unsweep(ym, goalId, amount, cuts) { return ACT.tx('undo top-up', () => unsweepPlay(S, ym, goalId, amount, cuts)); },

  /* a month's unspent play money kept in the bank, or added to a later month's free to spend (see releasePlay); returns what was moved */
  release(ym, to, toYm, amount) {
    if (MONTHS.indexOf(ym) < 0) throw new Error('unknown month ' + ym); if (to === 'next' && MONTHS.indexOf(toYm) < 0) throw new Error('unknown month ' + toYm);
    return ACT.tx('top-up', () => releasePlay(S, ym, to === 'next' ? 'next' : 'bank', toYm, amount));
  },

  /* ---- jars ---- */
  setAims(aims) {
    return one('jar split', () => { const a = {}; JARS.forEach(j => { const v = +(aims && aims[j.id]); a[j.id] = isFinite(v) && v >= 0 && v <= 1 ? v : aimsOf(S)[j.id]; }); S.cfg.aims = a; });
  },

  /* ---- receipts ---- */
  addReceipts(list) {
    return one('receipts', () => { const ids = []; (list || []).forEach(r => { const id = addReceipt(S, r.d, r.a, r.c, r.n); if (id) ids.push(id); }); if (ids.length) markDone('receipts', true); return ids; });
  },
  removeReceipts(ids) { return ACT.tx('remove receipts', () => { (ids || []).forEach(id => removeReceipt(S, id)); }); },

  /* ---- about the person and the page ---- */
  setName(name) { return one('name', () => { const n = cleanName(name); if (n) S.ui.name = n; else delete S.ui.name; }); },
  setCurrency(cur) { return one('currency', () => { if (typeof cur === 'string' && cur && cur.length <= 4) S.ui.cur = cur; }); },
  /* what Home shows and in what order: a list of section ids (see HOME_SECTIONS in ui6.js); unknown ids are dropped, missing ones hidden */
  setHome(order) {
    return one('home layout', () => {
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
