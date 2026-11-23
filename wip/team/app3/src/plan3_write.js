/* ---------- plan3_write: the Plan tab's steps, written through act3 (SCHEMA_V3 sections 3, 4, 5 and 8) ----------
   Each function is one step for ACT3.run(label, w => PLAN3W.<name>(w, ...)): it turns what the person typed into plan
   records and works nothing out (the engine does: engine/periods.js scheduleView gives each schedule's first day a
   change may start [X8]). Every record gets its id, told, at, by and grp from act3. A change never edits the past:
     - an amount or a day from a date is a new `steps` or `rules` entry with its own `at` and `by` [H2, L merge q2];
     - one pay period only is a `once` key named by the pay that starts the period [B8, T1, AE1];
     - Free to spend from a date is a new `plan.shares` entry [SCHEMA 8];
     - ending a line is a step to nothing from the next period, the line kept with `ends` so past periods still show it;
       ending a bill sets `ends` (nothing is due after it) and never ends before an occurrence a record names [X8];
     - a goal is a place kept in the bank by default, or in its own account [Mako 23 Nov, V1]; setting money aside is a
       `move` into it (and for its own account, a `transfer` there first);
     - a loan is an account that owns its payment day [B5, E6], opened with what is owed today.
   Plain browser JavaScript; in node, require('./plan3_write.js'). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const A3 = node ? require('./act3.js') : root.BurrowAct3;
  const LA = node ? require('../../engine/lookahead.js') : root.BurrowEngine.lookahead;
  const PE = node ? require('../../engine/periods.js') : root.BurrowEngine.periods;
  const G = node ? require('../../engine/ledger.js') : root.BurrowEngine.ledger;
  const bad = text => { throw new A3.Bad(text); };
  const live = x => x && !x.gone;
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  const amountOk = (a, what) => { if (!Number.isInteger(a) || !(a > 0)) bad('Type ' + what + ' above zero'); return a; };
  const nameOk = n => { const s = String(n == null ? '' : n).trim(); if (!s) bad('Type a name'); if (s.length > 60) bad('Keep the name to 60 letters'); return s; };
  const dayOfMonth = d => { if (!(Number.isInteger(d) && d >= 1 && d <= 31)) bad('Pick a day of the month, 1 to 31'); return d; };
  const home = w => G.homeOn(w.book, w.today);
  const mainOf = w => (G.fieldValue((w.book.home || {}).main) || {}).acct;
  const find = (w, list, id) => { const r = A3.listOf(w.book, list).find(x => x && x.id === id); if (!live(r)) bad('That is not in your plan any more'); return r; };
  /* stamp the entries this step added with the record's own `at` and `by` (each entry carries its own) */
  const stampNew = (rec, field) => { const x = rec[field].slice(-1)[0]; x.at = rec.at; x.by = rec.by; return rec; };
  const period = w => { const p = LA.lookahead(w.book, w.today).period; if (!p) bad('Your plan needs a pay day first'); return p; };
  const sameName = (list, name, id) => { if (list.some(x => live(x) && x.id !== id && String(x.name).toLowerCase() === name.toLowerCase())) bad('There is already one called ' + name); };

  /* ---- budget lines and Free to spend ---- */
  function addLine(w, x) {
    const name = nameOk(x.name), a = amountOk(x.amount, 'an amount');
    sameName(A3.listOf(w.book, 'budgets'), name);
    if (name.toLowerCase() === 'free to spend') bad('Free to spend is already in your plan. Change its amount instead');
    const id = w.add('budgets', { name, place: 'bills', cur: home(w), per: 'pay', from: w.today, steps: [{ from: null, amount: a }] });
    stampNew(find(w, 'budgets', id), 'steps');
    return id;
  }
  /* when: 'now' (this pay period and after), 'next' (from the next pay period), 'once' (this pay period only) */
  function changeLine(w, id, x) {
    const l = find(w, 'budgets', id), a = x.amount === 0 ? 0 : amountOk(x.amount, 'an amount'), p = period(w);
    const ch = {};
    if (x.name != null && x.name !== l.name) { ch.name = nameOk(x.name); sameName(A3.listOf(w.book, 'budgets'), ch.name, id); }
    /* 'now' is a step from today (the next periods) and a once key for this one: the engine reads a step only from a
       period start it has recorded, and the period holding the setup day has none */
    if (x.when === 'once' || x.when === 'now') {
      if (!p.startsWith) bad('This pay period has no pay to name it by yet. Change it from the next one');
      ch.once = Object.assign({}, l.once || {}, { [p.startsWith]: { amount: a } });
    }
    if (x.when === 'now' || x.when === 'next') ch.steps = (l.steps || []).concat([{ from: w.today, amount: a }]);
    else if (x.when !== 'once' && !ch.name) bad('Pick when the change starts');
    const r = w.edit('budgets', id, ch);
    if (ch.steps) stampNew(r, 'steps');
    if (ch.once) Object.assign(r.once[p.startsWith], { at: r.at, by: r.by });
    return id;
  }
  function endLine(w, id) {
    const l = find(w, 'budgets', id);
    if (l.ends) bad(l.name + ' has already ended');
    const r = w.edit('budgets', id, { steps: (l.steps || []).concat([{ from: w.today, amount: 0 }]), ends: w.today });
    stampNew(r, 'steps');
    return id;
  }
  function setFree(w, x) {
    const a = x.amount === 0 ? 0 : amountOk(x.amount, 'an amount'), shares = A3.listOf(w.book, 'shares').filter(s => live(s) && s.free != null);
    if (x.when === 'once') {
      const p = period(w), s = shares.slice(-1)[0];
      if (!s) bad('Set Free to spend first');
      if (!p.startsWith) bad('This pay period has no pay to name it by yet. Change it from the next one');
      const r = w.edit('shares', s.id, { once: Object.assign({}, s.once || {}, { [p.startsWith]: { free: a } }) });
      Object.assign(r.once[p.startsWith], { at: r.at, by: r.by });
      return s.id;
    }
    const rec = { from: shares.length ? w.today : null, cur: home(w), per: { free: 'pay' }, free: a, goals: {} };
    const p = shares.length && x.when === 'now' ? period(w) : null;   // 'now': this period too, as a once key (see changeLine)
    if (p && p.startsWith) rec.once = { [p.startsWith]: { free: a } };
    const id = w.add('shares', rec);
    if (rec.once) { const r = find(w, 'shares', id); Object.assign(r.once[p.startsWith], { at: r.at, by: r.by }); }
    return id;
  }

  /* ---- bills ---- */
  function addBill(w, x) {
    const name = nameOk(x.name), a = amountOk(x.amount, 'the amount'), d = dayOfMonth(x.day), acct = x.acct || mainOf(w);
    if (!(w.book.accounts || []).some(y => live(y) && y.id === acct)) bad('Pick the account it is paid from');
    sameName(A3.listOf(w.book, 'schedules').filter(s => s.kind === 'bill'), name);
    const id = w.add('schedules', { kind: 'bill', name, acct, cur: home(w), shift: x.shift || 'after', from: x.from || w.today,
      rules: [{ from: null, rule: { every: 'month', days: [d] } }], steps: [{ from: null, amount: a }] });
    const r = find(w, 'schedules', id); stampNew(r, 'rules'); stampNew(r, 'steps');
    return id;
  }
  /* x: { name, amount, day, from } ; an amount or a day changes from `from`, never before what a record names [X8] */
  function changeBill(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id];
    const ch = {};
    if (x.name != null && x.name !== s.name) { ch.name = nameOk(x.name); sameName(A3.listOf(w.book, 'schedules').filter(y => y.kind === s.kind), ch.name, id); }
    const from = x.from || v.changeFrom;
    if ((x.amount != null && x.amount !== v.amount) || (x.day != null && !(v.rule && v.rule.every === 'month' && v.rule.days.length === 1 && v.rule.days[0] === x.day))) {
      if (!DAY.test(from)) bad('Pick the day the change starts');
      if (from < v.changeFrom) bad('The change can start on ' + v.changeFrom + ' at the earliest: an earlier one is already paid or noted');
      if (x.amount != null && x.amount !== v.amount) ch.steps = (s.steps || []).concat([{ from, amount: amountOk(x.amount, 'the amount') }]);
      if (x.day != null && !(v.rule && v.rule.every === 'month' && v.rule.days.length === 1 && v.rule.days[0] === x.day)) ch.rules = (s.rules || []).concat([{ from, rule: { every: 'month', days: [dayOfMonth(x.day)] } }]);
    }
    if (!Object.keys(ch).length) bad('Nothing changed');
    const r = w.edit('schedules', id, ch);
    if (ch.steps) stampNew(r, 'steps');
    if (ch.rules) stampNew(r, 'rules');
    return id;
  }
  /* the last day it is due; nothing is due after it [SCHEMA 5 `ends`] */
  function endBill(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id], last = (x && x.last) || w.today;
    if (!DAY.test(last)) bad('Pick the last day');
    if (v.lastNamed && last < v.lastNamed) bad('It can end on ' + v.lastNamed + ' at the earliest: that one is already paid or noted');
    w.edit('schedules', id, { ends: last });
    return s.id;
  }

  /* ---- goals ---- */
  function addGoal(w, x) {
    const name = nameOk(x.name), target = amountOk(x.target, 'the goal amount'), cur = home(w);
    if (x.due != null && x.due !== '' && (!DAY.test(x.due) || x.due <= w.today)) bad('Pick a target date after today, or leave it empty');
    sameName(A3.listOf(w.book, 'places'), name);
    let acct = mainOf(w), mode = 'inBank';
    if (x.mode === 'ownAccount') {
      mode = 'ownAccount';
      if (x.acct) { acct = x.acct; if (!(w.book.accounts || []).some(y => live(y) && y.id === acct && y.type === 'bank')) bad('Pick the account it is kept in'); }
      else {   // a new account of its own, opened today with nothing in it
        acct = w.add('accounts', { name: nameOk(x.acctName || name + ' account'), type: 'bank', cur, owner: null });
        w.add('events', { k: 'open', acct, date: w.today, a: 0 });
        w.add('events', { k: 'check', acct, date: w.today, a: 0 });
      }
    }
    const rec = { name, kind: 'goal', target, cur, keptIn: { acct, mode } };
    if (x.due) rec.due = x.due;
    return w.add('places', rec);
  }
  function changeGoal(w, id, x) {
    const g = find(w, 'places', id), ch = {};
    if (x.name != null && x.name !== g.name) { ch.name = nameOk(x.name); sameName(A3.listOf(w.book, 'places'), ch.name, id); }
    if (x.target != null && x.target !== g.target) ch.target = amountOk(x.target, 'the goal amount');
    if (x.due !== undefined && (x.due || null) !== (g.due || null)) {
      if (x.due && (!DAY.test(x.due) || x.due <= w.today)) bad('Pick a target date after today, or leave it empty');
      ch.due = x.due || null;
    }
    if (!Object.keys(ch).length) bad('Nothing changed');
    w.edit('places', id, ch);
    return id;
  }
  /* money set aside today: a `move` into the goal; kept in its own account, the money goes there first */
  function setAside(w, id, x) {
    const g = find(w, 'places', id), a = amountOk(x.amount, 'an amount'), k = g.keptIn || {};
    if (k.mode === 'ownAccount') {
      const from = x.from || mainOf(w);
      if (from === k.acct) bad('Pick the account the money comes from');
      w.add('events', { k: 'transfer', date: w.today, a, acct: from, acct2: k.acct, src: { type: 'typed' } });
    }
    w.add('events', { k: 'move', date: w.today, a, acct: k.acct || mainOf(w), place2: id, src: { type: 'typed' } });
    return id;
  }

  /* ---- loans, and the days of a card (each owns its payment day [B5, E6]) ---- */
  function addLoan(w, x) {
    const name = nameOk(x.name), owed = amountOk(x.owed, 'what is owed'), pay = amountOk(x.amount, 'the usual payment'), d = dayOfMonth(x.payDay);
    const payFrom = x.payFrom || mainOf(w);
    sameName((w.book.accounts || []), name);
    const id = w.add('accounts', { name, type: 'loan', cur: home(w), owner: null, payDay: d, shift: x.shift || 'after', payFrom, amount: pay });
    w.add('events', { k: 'open', acct: id, date: w.today, a: owed });
    w.add('events', { k: 'check', acct: id, date: w.today, a: owed });
    return id;
  }
  function changeOwed(w, id, x) {
    const a = find(w, 'accounts', id), ch = {};
    if (a.type !== 'loan' && a.type !== 'card') bad('That is not a card or a loan');
    if (x.name != null && x.name !== a.name) { ch.name = nameOk(x.name); sameName(w.book.accounts || [], ch.name, id); }
    if (x.payDay != null && x.payDay !== a.payDay) ch.payDay = dayOfMonth(x.payDay);
    if (a.type === 'loan' && x.amount != null && x.amount !== a.amount) ch.amount = amountOk(x.amount, 'the usual payment');
    if (a.type === 'card' && x.cutDay !== undefined && x.cutDay !== a.cutDay) ch.cutDay = x.cutDay === null ? null : dayOfMonth(x.cutDay);
    if (!Object.keys(ch).length) bad('Nothing changed');
    w.edit('accounts', id, ch);
    return id;
  }

  const api = { addLine, changeLine, endLine, setFree, addBill, changeBill, endBill, addGoal, changeGoal, setAside, addLoan, changeOwed };
  if (node) module.exports = api;
  else root.PLAN3W = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
