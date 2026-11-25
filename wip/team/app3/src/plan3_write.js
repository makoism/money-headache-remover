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
  const BUILD = node ? require('../../engine/build_book.js') : root.BurrowEngine.build;
  const PAY_NEEDS_AMOUNT = BUILD.PAY_NEEDS_AMOUNT;
  const SC = Object.assign({}, node ? require('../../engine/schedules.js') : root.BurrowEngine.schedules, { dayNum: (node ? require('../../engine/dates.js') : root.BurrowEngine.dates).dayNum, dayStr: (node ? require('../../engine/dates.js') : root.BurrowEngine.dates).dayStr });
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
  /* [qc-foundation confirm, yearly bills] x.every: 'month' (default, `day`), 'year' (`month` 1 to 12 and `day`, or `date`
     'MM-DD'), 'months' (every `n` months from `start`, the day of one), as build_book writes them */
  const DAYS_IN = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 };
  function billRule(x) {
    const every = x.every || 'month';
    if (every === 'month') return { every: 'month', days: [dayOfMonth(x.day)] };
    if (every === 'year') {
      const m = x.date ? Number(String(x.date).slice(0, 2)) : Number(x.month), d = x.date ? Number(String(x.date).slice(3)) : x.day;
      if (!(Number.isInteger(m) && m >= 1 && m <= 12)) bad('Pick the month it is due');
      if (!(Number.isInteger(d) && d >= 1 && d <= DAYS_IN[m])) bad('Pick a day that month has');
      return { every: 'year', date: String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') };
    }
    if (every === 'months') {
      if (!(Number.isInteger(x.n) && x.n >= 1 && x.n <= 24)) bad('Every how many months?');
      if (!DAY.test(x.start || '')) bad('Pick the day of one of them');
      return { every: 'months', n: x.n, from: x.start };
    }
    return bad('Pick how often it is due');
  }
  function addBill(w, x) {
    const name = nameOk(x.name), a = amountOk(x.amount, 'the amount'), rule = billRule(x), acct = x.acct || mainOf(w);
    if (!(w.book.accounts || []).some(y => live(y) && y.id === acct)) bad('Pick the account it is paid from');
    sameName(A3.listOf(w.book, 'schedules').filter(s => s.kind === 'bill'), name);
    const id = w.add('schedules', { kind: 'bill', name, acct, cur: home(w), shift: x.shift || 'after', from: x.from || w.today,
      rules: [{ from: null, rule }], steps: [{ from: null, amount: a }] });
    const r = find(w, 'schedules', id); stampNew(r, 'rules'); stampNew(r, 'steps');
    return id;
  }
  /* [slice 6] how often, as the pay form offers it: a day each month, every 1, 2, 3 or 4 weeks from the day of one pay;
     [slice 6b] also two days each month, and no fixed pay */
  const EVERY = { month: 1, days: 1, weeks1: 1, weeks2: 1, weeks3: 1, weeks4: 1, none: 1 };
  const everyWords = { weeks1: 'every week', weeks2: 'every 2 weeks', weeks3: 'every 3 weeks', weeks4: 'every 4 weeks', month: 'once a month', days: 'on two days each month' };
  function sameRule(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  const dayOrLast = d => (d === 'last' ? d : dayOfMonth(d));
  /* x: { name, amount, day, day2, from, every?, start?, lines? } ; an amount, a day or how often changes from `from`,
     never before what a record names [X8]. [slice 6] When the pay that starts the period changes how often it lands,
     every line and Free to spend counted each pay is asked about: `lines` { <line id> | 'free': its amount each pay from
     then }; an amount other than today's is a new step (a new Free to spend entry) from the same day.
     [slice 6b] To no fixed pay: from `from` there are no pay periods; each line and Free to spend counted each pay is
     asked about as an amount a month (a new step; Free to spend a new entry a month), from that day. From no fixed pay
     to a day or every few weeks: the new rule and the pay's amount start with its first pay on or after `from` (until
     that pay is ticked the plan runs by the day), the pay starts the period when no other pay does, and each line and
     Free to spend is asked about as an amount each pay, from that pay (a line a month becomes a line each pay). */
  /* [qc-foundation F4, BY] startsPeriod is one undated flag: the live pay holding it (other than `but`), and whether a
     pay's newest rule (by its `from`) has a fixed day */
  /* [BZ2] which pay starts the periods is dated: the pay holding it on a day (engine/schedules.js periodHolder). Moving it
     is a new entry { from, at, by } on the pay taking it, never an edit of the old pay, so the old pay's past periods
     stay its own. A new entry is never dated before the newest entry any pay has (BQ2), or it would lose for good. */
  const holderOn = (w, day) => SC.periodHolder(A3.listOf(w.book, 'schedules').filter(live), day);
  const ended = (y, day) => !!y.ends && y.ends <= day;
  const newestFrom = w => { let m = ''; for (const y of A3.listOf(w.book, 'schedules').filter(live)) for (const x of (Array.isArray(y.startsPeriod) ? y.startsPeriod : [])) if (x && !x.gone && x.from && x.from > m) m = x.from; return m; };
  const entriesOf = y => (y.startsPeriod === true ? [{ from: null }] : Array.isArray(y.startsPeriod) ? y.startsPeriod : []);
  const takeEntry = (w, y, from) => { const nf = newestFrom(w); return entriesOf(y).concat([{ from: nf > from ? nf : from }]); };
  const fixedNow = y => { const l = (y.rules || []).filter(r => r && !r.gone).slice().sort((p, q) => (p.from || '') < (q.from || '') ? -1 : (p.from || '') > (q.from || '') ? 1 : 0); return ((l.pop() || {}).rule || {}).every !== 'none'; };
  function changeBill(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id];
    const ch = {};
    let rhythm = null;
    const wasNone = !!(v.rule && v.rule.every === 'none');
    if (x.every != null && x.every !== '') {
      if (!EVERY[x.every]) bad('Pick how often it lands');
      if (x.every === 'none') rhythm = { every: 'none' };
      else if (x.every === 'month') rhythm = { every: 'month', days: [dayOfMonth(x.day != null ? x.day : (v.rule && v.rule.days ? v.rule.days[0] : null))] };
      else if (x.every === 'days') {
        if (x.day2 == null || x.day2 === '') bad('Pick the second day it lands');
        const d1 = dayOrLast(x.day), d2 = dayOrLast(x.day2);
        rhythm = { every: 'month', days: d1 === d2 ? [d1] : [d1, d2] };
      } else { if (!DAY.test(x.start || '')) bad('Pick the day of one pay, the last one or the next one'); const n = Number(x.every.slice(5)); rhythm = { every: 'weeks', n, from: BUILD.weeksAnchor(x.start, DAY.test(x.from || '') ? x.from : v.changeFrom, n) }; }
      if (sameRule(rhythm, v.rule)) rhythm = null;
    }
    const toNone = !!rhythm && rhythm.every === 'none', fromNone = !!rhythm && wasNone;
    if (x.name != null && x.name !== s.name) { ch.name = nameOk(x.name); sameName(A3.listOf(w.book, 'schedules').filter(y => y.kind === s.kind), ch.name, id); }
    let from = x.from || v.changeFrom;
    if (s.kind === 'income' && x.amount === 0) bad(PAY_NEEDS_AMOUNT);   // [BL1] a pay always has an amount
    if (fromNone && x.amount == null && v.amount == null) bad(PAY_NEEDS_AMOUNT);
    const dayMoved = x.every == null && x.day != null && !(v.rule && v.rule.every === 'month' && v.rule.days.length === 1 && v.rule.days[0] === x.day);
    if ((x.amount != null && x.amount !== v.amount) || dayMoved || rhythm) {
      if (!DAY.test(from)) bad('Pick the day the change starts');
      if (from < v.changeFrom) bad('The change can start on ' + v.changeFrom + ' at the earliest: an earlier one is already paid or noted');
      /* [slice 6b] from no fixed pay: the new rule and the pay's amount start with its first pay on or after `from` */
      if (fromNone) {
        const probe = Object.assign({}, s, { rules: (s.rules || []).concat([{ from, rule: rhythm }]) });
        from = PE.firstLanding(Object.assign({}, w.book, { schedules: [probe] }), id, from) || from;
        if (s.shift === 'none') ch.shift = 'before';
        /* [qc-foundation F4, BZ2] the flag comes here, from its first pay, when the pay holding it has no fixed day now or
           has ended */
        const h = holderOn(w, w.today);
        if (!h || (h.id !== id && (!fixedNow(h) || ended(h, w.today)))) ch.startsPeriod = takeEntry(w, s, from);
      }
      if ((x.amount != null && x.amount !== v.amount) || (fromNone && x.amount != null)) ch.steps = (s.steps || []).concat([{ from, amount: amountOk(x.amount, 'the amount') }]);
      if (dayMoved) ch.rules = (s.rules || []).concat([{ from, rule: { every: 'month', days: [dayOfMonth(x.day)] } }]);
      if (rhythm) ch.rules = (s.rules || []).concat([{ from, rule: rhythm }]);
    }
    if (!Object.keys(ch).length) bad('Nothing changed');
    /* [slice 6] the pay that starts the period changes how often it lands: each line counted each pay is asked about;
       [slice 6b] from no fixed pay, each line and Free to spend a month */
    const starts = (holderOn(w, w.today) || {}).id === id || !!ch.startsPeriod;
    const perPay = !rhythm || !starts ? [] : fromNone ? linesEachMonth(w) : linesEachPay(w);
    if (perPay.length) {
      const got = x.lines || {};
      const missing = perPay.filter(l => got[l.key] == null), names = missing.map(l => l.name).join(' and ');
      if (missing.length) bad(toNone ? `Your pay will have no fixed day. How much a month from then for ${names}?` : `Your pay will land ${everyWords[x.every]}. How much each pay from then for ${names}?`);
    }
    const r = w.edit('schedules', id, ch);
    if (ch.startsPeriod) stampNew(r, 'startsPeriod');
    if (ch.steps) stampNew(r, 'steps');
    if (ch.rules) stampNew(r, 'rules');
    /* the new amounts start with the pay period that holds the change day: from the last pay landing on or before it;
       [slice 6b] to no fixed pay, from the change day; from no fixed pay, from its first pay */
    const lineFrom = toNone || fromNone ? from : perPay.length ? PE.lastLanding(w.book, id, from) || from : from;
    /* [BQ2] never before the newest entry it has: the later of that day and the newest entry's `from` (an entry from an
       earlier day would lose to it, the one in force being chosen by `from`) */
    const newest = list => list.filter(e => live(e) && e.from != null).map(e => e.from).sort().pop() || null;
    const fromFor = l => { const n = l.key === 'free' ? newest(A3.listOf(w.book, 'shares').filter(e => e.free != null)) : newest((l.rec && l.rec.steps) || []); return n && n > lineFrom ? n : lineFrom; };
    for (const l of perPay) {
      const a = x.lines[l.key];
      /* [slice 6b] a line a month becomes a line each pay (with no fixed pay its past is by the day, which does not read `per`) */
      const perFlip = fromNone && l.rec && l.rec.per === 'month';
      /* Free to spend changes its kind (a month, each pay) with a new entry, even at the same amount */
      const freeKind = l.key === 'free' && (toNone || fromNone);
      if (a === l.amount && !perFlip && !freeKind) continue;
      amountOk(a, `the amount ${toNone ? 'a month' : 'each pay'} for ${l.name}`);
      if (l.key === 'free') w.add('shares', { from: fromFor(l), cur: home(w), per: { free: toNone ? 'month' : 'pay' }, free: a, goals: {} });
      else { const e = w.edit('budgets', l.key, Object.assign({ steps: (l.rec.steps || []).concat([{ from: fromFor(l), amount: a }]) }, perFlip ? { per: 'pay' } : {})); stampNew(e, 'steps'); }
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
  /* [slice 6b] with no fixed pay: each line (not a weekly one) and Free to spend, with its amount a month today: the
     record's own amount in force (a lookup, schedules.stepOn, as Plan shows it) */
  function linesEachMonth(w) {
    const n = SC.dayNum(w.today);
    const out = A3.listOf(w.book, 'budgets').filter(l => live(l) && l.per !== 'week' && !(l.ends && l.ends <= w.today))
      .map(l => ({ key: l.id, name: l.name, amount: SC.stepOn(l, n), rec: l })).filter(l => l.amount);
    /* [BQ2] the entry in force: by `from`, ties broken by `at` */
    const fr = A3.listOf(w.book, 'shares').filter(x => live(x) && x.free != null && (!x.from || x.from <= w.today))
      .sort((p, q) => ((p.from || '') < (q.from || '') ? -1 : (p.from || '') > (q.from || '') ? 1 : (p.at || '') < (q.at || '') ? -1 : (p.at || '') > (q.at || '') ? 1 : 0)).pop();
    if (fr && fr.free) out.push({ key: 'free', name: 'Free to spend', amount: fr.free });
    return out;
  }
  /* the last day it is due; nothing is due after it [SCHEMA 5 `ends`] */
  function endBill(w, id, x) {
    const s = find(w, 'schedules', id), v = PE.scheduleView(w.book, w.today)[id], last = (x && x.last) || w.today;
    if (!DAY.test(last)) bad('Pick the last day');
    if (v.lastNamed && last < v.lastNamed) bad('It can end on ' + v.lastNamed + ' at the earliest: that one is already paid or noted');
    w.edit('schedules', id, { ends: last });
    /* [BZ2, qc-foundation confirm finding 1] "my job ended": the pay holding the flag after its last day hands it, dated
       the day after, to another live pay with a fixed day that has not ended; with none, it keeps it until a pay is added */
    const next = SC.dayAfter(last), h = s.kind === 'income' ? holderOn(w, next) : null;
    if (h && h.id === id) {
      const other = A3.listOf(w.book, 'schedules').find(y => live(y) && y.id !== id && y.kind === 'income' && fixedNow(y) && !ended(y, last));
      if (other) { const r = w.edit('schedules', other.id, { startsPeriod: takeEntry(w, other, next) }); stampNew(r, 'startsPeriod'); }
    }
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

  /* ---- a pay and an account added after setup (AI_FIRST_PLAN corrections BV5, BV2.11, BV2.12) ---- */
  /* x: { name, amount, every: 'month' | 'days' | 'weeks1'..'weeks4' | 'none', day, day2, start, shift?, acct?, lines? }.
     From today, as addBill [BV2.11]; the rhythm as build_book writes it (every n weeks stepped back to on or before
     today). No fixed day: no amount needed, never starts the period [B4]. The first pay with a fixed day in a book with
     none is added with no fixed day and then changed to its day through changeBill, so it starts the period from its
     first pay and each line and Free to spend is asked about as an amount each pay, as changeBill does [BV5]. */
  function addPay(w, x) {
    const name = nameOk(x.name), acct = x.acct || mainOf(w);
    if (!EVERY[x.every]) bad('Pick how often it lands');
    if (!(w.book.accounts || []).some(y => live(y) && y.id === acct && y.type !== 'card' && y.type !== 'loan')) bad('Pick the account it lands in');
    sameName(A3.listOf(w.book, 'schedules').filter(s => s.kind === 'income'), name);
    const none = x.every === 'none';
    if (!none && (x.amount == null || x.amount === 0)) bad(PAY_NEEDS_AMOUNT);
    const amount = x.amount == null ? null : amountOk(x.amount, 'the amount');
    let rule = { every: 'none' };
    if (x.every === 'month') rule = { every: 'month', days: [dayOfMonth(x.day)] };
    else if (x.every === 'days') { if (x.day2 == null || x.day2 === '') bad('Pick the second day it lands'); const d1 = dayOrLast(x.day), d2 = dayOrLast(x.day2); rule = { every: 'month', days: d1 === d2 ? [d1] : [d1, d2] }; }
    else if (!none) { if (!DAY.test(x.start || '')) bad('Pick the day of one pay, the last one or the next one'); const n = Number(x.every.slice(5)); rule = { every: 'weeks', n, from: BUILD.weeksAnchor(x.start, w.today, n) }; }
    /* [qc-foundation F4, BZ2] it starts the pay periods, from today, when no pay with a fixed day does now: the pay holding
       the flag has no fixed day now, or has ended. The old pay keeps its own flag, so its past periods stay */
    const holder = holderOn(w, w.today), first = !none && (!holder || !fixedNow(holder) || ended(holder, w.today));
    /* [BV5] as changeBill from no fixed pay: each line and Free to spend counted a month is asked about as an amount
       each pay, from this pay's first landing */
    const monthly = first && (!holder || !fixedNow(holder)) ? linesEachMonth(w) : [];   // [BZ2] after an ended pay with a fixed day, lines stay each pay
    const got = x.lines || {}, missing = monthly.filter(l => got[l.key] == null);
    if (missing.length) bad(`Your pay will land ${everyWords[x.every]}. How much each pay from then for ${missing.map(l => l.name).join(' and ')}?`);
    const id = w.add('schedules', Object.assign({ kind: 'income', name, acct, cur: home(w), shift: none ? 'none' : x.shift || 'before', from: w.today,
      rules: [{ from: null, rule }], steps: [{ from: null, amount }] }, first ? { startsPeriod: takeEntry(w, {}, w.today) } : {}));
    const r = find(w, 'schedules', id); stampNew(r, 'rules'); stampNew(r, 'steps'); if (first) stampNew(r, 'startsPeriod');
    if (monthly.length) {
      const from = PE.firstLanding(w.book, id, w.today) || w.today;
      for (const l of monthly) {
        const a = amountOk(got[l.key], 'the amount each pay for ' + l.name);
        if (l.key === 'free') w.add('shares', { from, cur: home(w), per: { free: 'pay' }, free: a, goals: {} });
        else { const e = w.edit('budgets', l.key, Object.assign({ steps: (l.rec.steps || []).concat([{ from, amount: a }]) }, l.rec.per === 'month' ? { per: 'pay' } : {})); stampNew(e, 'steps'); }
      }
    }
    return id;
  }
  /* x: { name, type: 'bank' | 'cash' | 'ewallet' | 'wallet', amount, min?, moved: true | false, date?, from?, afterFigure? }.
     `from` is the account the money came from (the main bank by default); on the day of that account's figure,
     `afterFigure` says whether it was moved after the person looked (before: the figure already left it out). `moved` answers
     "Is this new money, or moved from <main bank> since <the day of its last figure>?" [qc-foundation F3a]. Not moved
     since then (new money, or moved before that figure, which already left it out): the account opens with its amount
     and a check of it today, nothing taken off the main bank. Moved since then: the account opens at 0 and is checked at 0
     at the end of the day before the move, then one transfer from the main bank on the move day, as addGoal and setAside do [BV2.12,
     F3c]; never both. A move day before the main bank's last figure is refused [F3b]. */
  const SN3 = node ? require('../../screens/names.js') : root.BurrowScreens.names;
  const OWN_KINDS = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };
  function addAccount(w, x) {
    const name = nameOk(x.name), type = x.type || 'bank';
    if (!OWN_KINDS[type]) bad(type === 'card' ? 'Add a card with Add a card' : type === 'loan' ? 'Add a loan with Add a loan' : 'Pick a bank, cash, an e-wallet or a wallet');
    if (!(Number.isInteger(x.amount) && x.amount >= 0)) bad('Type what it holds today, zero or more');
    /* [qc-foundation confirm, watch] moved from any live bank, cash or e-wallet of your own; the main bank by default */
    const from = x.from || mainOf(w);
    if (!(w.book.accounts || []).some(y => live(y) && !y.closed && y.id === from && OWN_KINDS[y.type])) bad('Pick the bank the money came from');
    /* that account's last figure typed (its own check, never a statement's) */
    const last = (w.book.events || []).filter(e => live(e) && e.k === 'check' && !e.stmt && e.acct === from && e.date <= w.today).map(e => e.date).sort().pop() || w.today;
    const since = last === w.today ? 'today' : SN3.dayLabel(last, last.slice(0, 4) !== w.today.slice(0, 4));
    if (x.moved !== true && x.moved !== false) bad('Is this new money, or moved from ' + nameOf(w, from) + ' since ' + since + '?');
    sameName(w.book.accounts || [], name);
    const date = x.moved ? x.date || w.today : w.today;
    if (!DAY.test(date) || date > w.today) bad('Pick the day it was moved, today or before');
    if (x.moved && date < last) bad('That day is before ' + nameOf(w, from) + "'s figure of " + since + ', which already left it out. Add it as not moved since then');
    /* [qc-foundation confirm 4] moved on the day of that figure: before the person looked, the figure already left it out */
    if (x.moved && date === last && x.afterFigure !== true && x.afterFigure !== false) bad('Was it moved before or after you looked at ' + nameOf(w, from) + (last === w.today ? ' today' : ' on ' + since) + '?');
    const moved = x.moved && !(date === last && x.afterFigure === false);
    const rec = { name, type, cur: home(w), owner: null };
    if (x.min != null && x.min !== '') rec.minBank = { a: amountOk(x.min, 'the amount to keep'), cur: home(w) };
    const id = w.add('accounts', rec);
    /* moved: it opens with 0 at the end of the day before the move, so the move (told now, on its own day) comes after
       the opening whatever day it was; an opening dated the move day and told later would already hold it [AN4] */
    const openDay = moved ? SC.dayStr(SC.dayNum(date) - 1) : w.today;
    w.add('events', { k: 'open', acct: id, date: openDay, a: moved ? 0 : x.amount });
    w.add('events', { k: 'check', acct: id, date: openDay, a: moved ? 0 : x.amount });
    if (moved && x.amount > 0) w.add('events', { k: 'transfer', date, a: x.amount, acct: from, acct2: id, src: { type: 'typed' } });
    return id;
  }

  /* [E1, M13] a bank, cash or e-wallet renamed, and its own Keep at least (minBank: blank clears it). The main bank's
     Keep at least lives in home.main and is changed in Settings (E5). Its figure changes at Check your bank. x: { name?, min? } */
  function changeAccount(w, id, x) {
    const a = find(w, 'accounts', id), ch = {};
    if (!OWN_KINDS[a.type]) bad(a.type === 'card' || a.type === 'loan' ? 'Change a card or a loan on Plan, under Cards and loans' : 'That account cannot be changed here');
    if (a.closed) bad(a.name + ' is closed');
    if (x.name != null && String(x.name).trim() !== a.name) { ch.name = nameOk(x.name); sameName(w.book.accounts || [], ch.name, id); }
    if (x.min !== undefined) {
      const was = a.minBank ? a.minBank.a : null, now = x.min === '' || x.min === null || x.min === 0 ? null : x.min;
      if (now !== was) {
        if (id === mainOf(w)) bad('Keep at least for your main bank is in Settings');
        ch.minBank = now === null ? null : { a: amountOk(now, 'the amount to keep'), cur: a.cur || home(w) };
      }
    }
    if (!Object.keys(ch).length) bad('Nothing changed');
    w.edit('accounts', id, ch);
    return id;
  }

  /* [E2, M13, M45, M61] closing a bank, cash or e-wallet that is not the main bank (CONTROLS_PLAN section 3, P6, R3, R4).
     x.to: the account its money goes to (one of your own, open, same currency), or 'spent' when the money is not there
     any more. One step: each bill, pay, card and loan paid from it or into it moves to x.to (the main bank when its money
     was spent); when spent, a final check of 0 today (the gap counts as spending, as at Check your bank), else the move of
     all it holds today (the engine's figure) to x.to, which leaves it at 0; then `closed` today. Refused below zero (move money in first), with a goal or a budget
     line kept in it, or for the main bank (later, CONTROLS_PLAN slice 13). Its history stays; Reopen undoes the close. */
  const linksTo = (w, id) => {
    const out = [];
    for (const s of A3.listOf(w.book, 'schedules')) if (live(s) && s.acct === id && !(s.ends && s.ends < w.today)) out.push({ list: 'schedules', rec: s, field: 'acct' });
    for (const a of w.book.accounts || []) if (live(a) && !a.closed && a.payFrom === id) out.push({ list: 'accounts', rec: a, field: 'payFrom' });
    return out;
  };
  const keptIn = (w, id) => (w.book.places || []).filter(g => live(g) && g.keptIn && g.keptIn.acct === id).map(g => g.name)
    .concat(A3.listOf(w.book, 'budgets').filter(l => live(l) && l.acct === id && !(l.ends && l.ends < w.today)).map(l => l.name));
  function closeAccount(w, id, x) {
    const a = find(w, 'accounts', id);
    if (!OWN_KINDS[a.type]) bad(a.type === 'loan' ? 'Close a loan on its own sheet' : 'Close a card on its own sheet');
    if (id === mainOf(w)) bad('Your main bank is where pay lands, so it cannot be closed here yet');
    if (a.closed) bad(a.name + ' is already closed');
    const k = keptIn(w, id);
    if (k.length) bad(k.join(' and ') + (k.length > 1 ? ' are' : ' is') + ' kept in ' + a.name + '. Change or remove ' + (k.length > 1 ? 'them' : 'it') + ' first');
    const spent = x && x.to === 'spent', to = spent ? mainOf(w) : x && x.to;
    const dest = !spent && (w.book.accounts || []).find(y => live(y) && y.id === to && y.id !== id && !y.closed && OWN_KINDS[y.type] && (y.cur || home(w)) === (a.cur || home(w)));
    if (!spent && !dest) bad('Pick where its money goes: another account of yours, or "it is not there any more"');
    const v = LA.lookahead(w.book, w.today).accounts[id], held = v && v.bank != null ? v.bank : 0;
    if (held < 0) bad(a.name + ' is below zero. Move money into it first, then close it');
    for (const l of linksTo(w, id)) w.edit(l.list, l.rec.id, { [l.field]: to });
    if (spent) w.add('events', { k: 'check', acct: id, date: w.today, a: 0 });
    else if (held > 0) w.add('events', { k: 'transfer', date: w.today, a: held, acct: id, acct2: to, src: { type: 'typed' } });
    w.edit('accounts', id, { closed: w.today });
    return id;
  }
  function reopenAccount(w, id) {
    const a = find(w, 'accounts', id);
    if (!a.closed) bad(a.name + ' is not closed');
    w.edit('accounts', id, { closed: null });
    return id;
  }
  /* [E2] an account added by mistake: true remove, only while nothing but its own adding step names it (its opening, its
     check, the move that filled it), no bill, pay, card, loan, goal or line uses it, and it is not the main bank. The
     account and those records are marked gone; Undo puts them back whole */
  function removeAccount(w, id) {
    const a = find(w, 'accounts', id);
    if (!OWN_KINDS[a.type]) bad('Remove a card or a loan on its own sheet');
    if (id === mainOf(w)) bad('Your main bank is where pay lands, so it cannot be removed');
    const uses = linksTo(w, id).map(l => l.rec.name).concat(keptIn(w, id));
    if (uses.length) bad(uses.join(' and ') + ' use' + (uses.length > 1 ? '' : 's') + ' ' + a.name + '. Change ' + (uses.length > 1 ? 'them' : 'it') + ' first, or close ' + a.name + ' instead');
    const on = (w.book.events || []).filter(e => live(e) && (e.acct === id || e.acct2 === id));
    if (on.some(e => e.grp !== a.grp || !(e.k === 'open' || e.k === 'check' || e.k === 'transfer'))) bad(a.name + ' has history. Close it instead: its history stays');
    for (const e of on) w.remove('events', e.id);
    w.remove('accounts', id);
    return id;
  }

  const api = { addPay, addAccount, changeAccount, closeAccount, reopenAccount, removeAccount, linesEachPay, linesEachMonth, addLine, changeLine, endLine, setFree, addBill, changeBill, changeOnce, endBill, addGoal, changeGoal, setAside, takeOut, addLoan, addCard, changeOwed, closeLoan };
  if (node) module.exports = api;
  else root.PLAN3W = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
