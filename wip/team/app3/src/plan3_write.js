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
     - a loan is an account that owns its payment day [B5, E6], opened with what is owed today; a card added after
       setup is the same shape setup writes, opened with what is on it today (QC F1).
   Plain browser JavaScript; in node, require('./plan3_write.js'). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const A3 = node ? require('./act3.js') : root.BurrowAct3;
  const LA = node ? require('../../engine/lookahead.js') : root.BurrowEngine.lookahead;
  const PE = node ? require('../../engine/periods.js') : root.BurrowEngine.periods;
  const G = node ? require('../../engine/ledger.js') : root.BurrowEngine.ledger;
  const bad = text => { throw new A3.Bad(text); };
  const PAY_NEEDS_AMOUNT = (node ? require('../../engine/build_book.js') : root.BurrowEngine.build).PAY_NEEDS_AMOUNT;
  const live = x => x && !x.gone;
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  const amountOk = (a, what) => { if (!Number.isInteger(a) || !(a > 0)) bad('Type ' + what + ' above zero'); return a; };
  const nameOk = n => { const s = String(n == null ? '' : n).trim(); if (!s) bad('Type a name'); if (s.length > 60) bad('Keep the name to 60 letters'); return s; };
  const dayOfMonth = d => { if (!(Number.isInteger(d) && d >= 1 && d <= 31)) bad('Pick a day of the month, 1 to 31'); return d; };
  const home = w => G.homeOn(w.book, w.today);
  const SMF = node ? require('../../screens/money.js') : root.BurrowScreens.money;
  const nameOf = (w, acctId) => ((w.book.accounts || []).find(y => y.id === acctId) || {}).name || 'That account';
  const mainOf = w => (G.fieldValue((w.book.home || {}).main) || {}).acct;
  const find = (w, list, id) => { const r = A3.listOf(w.book, list).find(x => x && x.id === id); if (!live(r)) bad('That is not in your plan any more'); return r; };
  /* stamp the entries this step added with the record's own `at` and `by` (each entry carries its own) */
  const stampNew = (rec, field) => { const x = rec[field].slice(-1)[0]; x.at = rec.at; x.by = rec.by; return rec; };
  const period = w => { const p = LA.lookahead(w.book, w.today).period; if (!p) bad('Your plan needs a pay day first'); return p; };
  /* [slice 6, B4] with no fixed pay there are no pay periods: lines and Free to spend are each month, by the day */
  const noPay = w => !LA.lookahead(w.book, w.today).period;
  const sameName = (list, name, id) => { if (list.some(x => live(x) && x.id !== id && String(x.name).toLowerCase() === name.toLowerCase())) bad('There is already one called ' + name); };

  /* ---- budget lines and Free to spend ---- */
  function addLine(w, x) {
    const name = nameOk(x.name), a = amountOk(x.amount, 'an amount');
    sameName(A3.listOf(w.book, 'budgets'), name);
    if (name.toLowerCase() === 'free to spend') bad('Free to spend is already in your plan. Change its amount instead');
    const id = w.add('budgets', { name, place: 'bills', cur: home(w), per: noPay(w) ? 'month' : 'pay', from: w.today, steps: [{ from: null, amount: a }] });
    stampNew(find(w, 'budgets', id), 'steps');
    return id;
  }
  /* when: 'now' (this pay period and after), 'next' (from the next pay period), 'once' (this pay period only) */
  function changeLine(w, id, x) {
    const l = find(w, 'budgets', id), a = x.amount == null || x.amount === 0 ? x.amount : amountOk(x.amount, 'an amount');
    /* [slice 6] no fixed pay: a change counts from today */
    if (noPay(w)) {
      if (x.when === 'once') bad('With no pay day, a change counts from today on');
      x = Object.assign({}, x, { when: 'today' });
    }
    const p = x.when === 'today' ? { start: w.today } : period(w);
    const ch = {};
    if (x.name != null && x.name !== l.name) { ch.name = nameOk(x.name); sameName(A3.listOf(w.book, 'budgets'), ch.name, id); }
    /* 'now' is a step from this period's first day: it counts in this period and after [V, BF] */
    if (a == null) { if (!ch.name) bad('Nothing changed'); }
    else if (x.when === 'once') {
      if (!p.startsWith) bad('This pay period has no pay to name it by yet. Change it from the next one');
      ch.once = Object.assign({}, l.once || {}, { [p.startsWith]: { amount: a } });
    }
    if (a != null && (x.when === 'now' || x.when === 'next' || x.when === 'today')) ch.steps = (l.steps || []).concat([{ from: x.when === 'now' || x.when === 'today' ? p.start : w.today, amount: a }]);
    else if (a != null && x.when !== 'once') bad('Pick when the change starts');
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
    // 'now': from this period's first day [V]; [BJ2] the first amount too carries its day, never null
    const none = noPay(w), from = x.when === 'now' && !none ? period(w).start : w.today;
    return w.add('shares', { from, cur: home(w), per: { free: none ? 'month' : 'pay' }, free: a, goals: {} });
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
  /* [slice 6] how often, as the pay form offers it: a day each month, or every 1, 2 or 4 weeks from the day of one pay */
  const EVERY = { month: 1, weeks1: 1, weeks2: 1, weeks4: 1 };
  const everyWords = { weeks1: 'every week', weeks2: 'every 2 weeks', weeks4: 'every 4 weeks', month: 'once a month' };
  function sameRule(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  /* x: { name, amount, day, from, every?, start?, lines? } ; an amount, a day or how often changes from `from`, never
     before what a record names [X8]. [slice 6] When the pay that starts the period changes how often it lands, every
     line and Free to spend counted each pay is asked about: `lines` { <line id> | 'free': its amount each pay from
     then }; an amount other than today's is a new step (a new Free to spend entry) from the same day. */
  function changeBill(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id];
    const ch = {};
    let rhythm = null;
    if (x.every != null && x.every !== '') {
      if (!EVERY[x.every]) bad('Pick how often it lands');
      if (x.every === 'month') rhythm = { every: 'month', days: [dayOfMonth(x.day != null ? x.day : (v.rule && v.rule.days ? v.rule.days[0] : null))] };
      else { if (!DAY.test(x.start || '')) bad('Pick the day of one pay, the last one or the next one'); rhythm = { every: 'weeks', n: Number(x.every.slice(5)), from: x.start }; }
      if (sameRule(rhythm, v.rule)) rhythm = null;
    }
    if (x.name != null && x.name !== s.name) { ch.name = nameOk(x.name); sameName(A3.listOf(w.book, 'schedules').filter(y => y.kind === s.kind), ch.name, id); }
    const from = x.from || v.changeFrom;
    if (s.kind === 'income' && x.amount === 0) bad(PAY_NEEDS_AMOUNT);   // [BL1] a pay always has an amount
    const dayMoved = x.every == null && x.day != null && !(v.rule && v.rule.every === 'month' && v.rule.days.length === 1 && v.rule.days[0] === x.day);
    if ((x.amount != null && x.amount !== v.amount) || dayMoved || rhythm) {
      if (!DAY.test(from)) bad('Pick the day the change starts');
      if (from < v.changeFrom) bad('The change can start on ' + v.changeFrom + ' at the earliest: an earlier one is already paid or noted');
      if (x.amount != null && x.amount !== v.amount) ch.steps = (s.steps || []).concat([{ from, amount: amountOk(x.amount, 'the amount') }]);
      if (dayMoved) ch.rules = (s.rules || []).concat([{ from, rule: { every: 'month', days: [dayOfMonth(x.day)] } }]);
      if (rhythm) ch.rules = (s.rules || []).concat([{ from, rule: rhythm }]);
    }
    if (!Object.keys(ch).length) bad('Nothing changed');
    /* [slice 6] the pay that starts the period changes how often it lands: each line counted each pay is asked about */
    const perPay = rhythm && s.startsPeriod ? linesEachPay(w) : [];
    if (perPay.length) {
      const got = x.lines || {};
      const missing = perPay.filter(l => got[l.key] == null);
      if (missing.length) bad(`Your pay will land ${everyWords[x.every]}. How much each pay from then for ${missing.map(l => l.name).join(' and ')}?`);
    }
    const r = w.edit('schedules', id, ch);
    if (ch.steps) stampNew(r, 'steps');
    if (ch.rules) stampNew(r, 'rules');
    for (const l of perPay) {
      const a = x.lines[l.key];
      if (a === l.amount) continue;
      amountOk(a, 'the amount each pay for ' + l.name);
      if (l.key === 'free') w.add('shares', { from, cur: home(w), per: { free: 'pay' }, free: a, goals: {} });
      else { const e = w.edit('budgets', l.key, { steps: (l.rec.steps || []).concat([{ from, amount: a }]) }); stampNew(e, 'steps'); }
    }
    return id;
  }
  /* the lines and Free to spend counted each pay today, with today's amount (the engine's period) */
  function linesEachPay(w) {
    const p = LA.lookahead(w.book, w.today).period;
    if (!p) return [];
    const out = (p.lines || []).filter(l => l.per === 'pay' && l.amount).map(l => ({ key: l.id, name: l.name, amount: l.amount, rec: A3.listOf(w.book, 'budgets').find(b => b.id === l.id) }));
    if (p.free && p.free.amount && p.free.per === 'pay') out.push({ key: 'free', name: 'Free to spend', amount: p.free.amount });
    return out;
  }
  /* the last day it is due; nothing is due after it [SCHEMA 5 `ends`] */
  function endBill(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id], last = (x && x.last) || w.today;
    if (!DAY.test(last)) bad('Pick the last day');
    if (v.lastNamed && last < v.lastNamed) bad('It can end on ' + v.lastNamed + ' at the earliest: that one is already paid or noted');
    w.edit('schedules', id, { ends: last });
    return s.id;
  }

  /* one occurrence changed: an `amounts` key on its due date (before any move), with its own at and by [B8, AE1];
     only an occurrence still to come that no record names yet [X8] */
  function changeOnce(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id], a = amountOk(x.amount, 'the amount');
    if (!DAY.test(x.due || '')) bad('Pick which one');
    if (v.lastNamed && x.due <= v.lastNamed) bad('That one is already paid or noted');
    const D = node ? require('../../engine/dates.js') : root.BurrowEngine.dates, S = node ? require('../../engine/schedules.js') : root.BurrowEngine.schedules;
    const acct = (w.book.accounts || []).find(y => y.id === s.acct) || {};
    const cal = S.calendar(acct.country || G.fieldValue((w.book.home || {}).country) || null);
    const occ = S.occurrences(s, cal, D.dayNum(x.due), D.dayNum(x.due)).find(o => D.dayStr(o.due) === x.due);
    if (!occ) bad(x.due + ' is not a day ' + s.name + ' is due');
    const r = w.edit('schedules', id, { amounts: Object.assign({}, s.amounts || {}, { [x.due]: { amount: a } }) });
    Object.assign(r.amounts[x.due], { at: r.at, by: r.by });
    return id;
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
    /* [BM2, replaces BL2's rule] never more than the bank the money is in (or comes from) can spare through the next
       pay: the engine's canSetAside (the real-money walk's lowest point before it, less what is already set aside) */
    const res = LA.lookahead(w.book, w.today), from = k.mode === 'ownAccount' ? x.from || mainOf(w) : k.acct || mainOf(w), spare = (res.accounts[from] || {}).canSetAside || 0;
    if (a > spare) bad(nameOf(w, from) + ' can spare ' + SMF.format(spare, (w.book.accounts || []).find(y => y.id === from).cur) + ' to set aside before your next pay: what it holds at its lowest until then, less what is already set aside in it');
    /* [BM2] past the goal's target: asked first (why 'ask'); the screen offers "anyway", which writes it */
    const need = (res.places[id] || {}).toGo;
    if (!x.anyway && need != null && a > need) {
      const cur = g.cur || (w.book.accounts || []).find(y => y.id === from).cur;
      const q = new A3.Bad(need > 0 ? `That is more than ${g.name} needs (${SMF.format(need, cur)}). Set aside ${SMF.format(a, cur)} anyway?`
        : `${g.name} already has all it needs (${SMF.format(g.target, cur)}). Set aside ${SMF.format(a, cur)} anyway?`);
      q.why = 'ask';
      throw q;
    }
    if (k.mode === 'ownAccount') {
      if (from === k.acct) bad('Pick the account the money comes from');
      w.add('events', { k: 'transfer', date: w.today, a, acct: from, acct2: k.acct, src: { type: 'typed' } });
    }
    w.add('events', { k: 'move', date: w.today, a, acct: k.acct || mainOf(w), place2: id, src: { type: 'typed' } });
    return id;
  }

  /* money taken back out of a goal: a `move` out of it to Waiting [T7], never more than it holds; from its own
     account, the money goes back to the bank too */
  function takeOut(w, id, x) {
    const g = find(w, 'places', id), a = amountOk(x.amount, 'an amount'), k = g.keptIn || {};
    const held = (LA.lookahead(w.book, w.today).places[id] || {}).kept || 0;
    if (a > held) bad(g.name + ' holds less than that');
    w.add('events', { k: 'move', date: w.today, a, acct: k.acct || mainOf(w), place: id, src: { type: 'typed' } });
    if (k.mode === 'ownAccount') w.add('events', { k: 'transfer', date: w.today, a, acct: k.acct, acct2: x.to || mainOf(w), src: { type: 'typed' } });
    return id;
  }

  /* a paid-off loan closes: a final check of nothing on its closing day, and `closed` [SCHEMA 3, P6, R3]; one that
     still owes is refused (its last payment is ticked at Check your bank first) */
  function closeLoan(w, id) {
    const a = find(w, 'accounts', id);
    if (a.type !== 'loan') bad('Only a loan closes here');
    if (a.closed) bad(a.name + ' is already closed');
    const o = LA.lookahead(w.book, w.today).owed[id];
    if (o && o.owedNow !== 0) bad(a.name + ' still owes money. Tick its last payment at Check your bank first');
    w.add('events', { k: 'check', acct: id, date: w.today, a: 0 });
    w.edit('accounts', id, { closed: w.today });
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
  /* a card added after setup (QC F1), the same shape setup writes (engine/build_book.js): it owns its payment day, is
     paid in full from the main bank, and opens with what is on it today; close day null is "not sure" (all that is owed
     is due on each payment day) [H4] */
  const SHIFTS = { after: 1, before: 1, none: 1 };
  function addCard(w, x) {
    const name = nameOk(x.name), d = dayOfMonth(x.payDay);
    if (!(Number.isInteger(x.owed) && x.owed >= 0)) bad('Type what is on it now, zero or more');
    const cutDay = x.cutDay == null || x.cutDay === '' || x.cutDay === 'not sure' ? null : x.cutDay === 'last' ? 'last' : dayOfMonth(x.cutDay);
    const shift = x.shift == null ? 'after' : x.shift;
    if (!SHIFTS[shift]) bad('Pick what happens on a weekend or holiday');
    const payFrom = x.payFrom || mainOf(w);
    sameName((w.book.accounts || []), name);
    const id = w.add('accounts', { name, type: 'card', cur: home(w), owner: null, inFull: true, cutDay, payDay: d, payMonths: 1, shift, payFrom });
    w.add('events', { k: 'open', acct: id, date: w.today, a: x.owed });
    w.add('events', { k: 'check', acct: id, date: w.today, a: x.owed });
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

  const api = { linesEachPay, addLine, changeLine, endLine, setFree, addBill, changeBill, changeOnce, endBill, addGoal, changeGoal, setAside, takeOut, addLoan, addCard, changeOwed, closeLoan };
  if (node) module.exports = api;
  else root.PLAN3W = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
