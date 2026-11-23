/* The Burrow engine: the move of a copy saved by an older build into the saved shape version 3 (SCHEMA_V3 11 and 11.1;
   foundation_review/MOVE_FIELDS.md; DECISIONS_ROUND2 E1, E4, E6, H9, I5, J2, K3, O, X1, X9, Y1 to Y28, Z3, Z5, Z6, AA1 to
   AA13, AB1, AB2, AB rows, AC1 to AC8, AD1, AD2, AD4, AD5, AE1 to AE5, AF1, AG1, AG2, AL1, AL3 to AL5, AN3, AN7, AO7).
   Ported once from the frozen reference rules/move_ref.js (WIRING_PLAN R2) and checked on every case of rules/move.json
   (engine/test/move.test.js); from now on only this copy is fixed. It reads the raw text of a 38.31 copy and of a 38.28
   copy (the live build: `rev` a count, no cards, no bankNow, no ui.minAuto) alike, and of every older build back to 25.0
   (the same fields, fewer of them). The old text is kept whole (`frozen3831`, stored as `mv:frozen:<device>`); every
   field lands in the new book, is listed (`unplaced`, `zero`), or is one MOVE_FIELDS says needs no place.
   Every amount is whole minor units; every record has a built id `mv:<kind>:<38.31 id or field path>` [X1, Y28, Z].
   The merge of two devices' moves is not here: moveTwo and moveLater take the merge as an argument until the engine has
   its own (lane A). Plain browser JavaScript; uses dates.js and units.js. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const D = node ? require('./dates.js') : root.BurrowEngine.dates;
  const U = node ? require('./units.js') : root.BurrowEngine.units;
  const { dayNum, dayStr, weekday } = D;
  const ms = t => D.moment(t);   // a full time with its offset, as milliseconds

  // 38.31 plan.lines ids: the bills [11.1], the loan line [E6], the four lines that are plan.shares, and the place of each
  // budget line's jar [11.1, B8]. Every other line (food, gas, card, custom) is a budget line.
  const BILL_IDS = ['rent', 'util', 'net', 'phone', 'ins', 'subs'];
  const SHARE_OF_LINE = { spend: 'free', learn: 'edu', invest: 'ffa', give: 'give' };
  const SHARE_OF_KEY = { envelope: 'free', education: 'edu', invest: 'ffa', give: 'give' };
  const JAR_PLACE = { nec: 'bills', play: 'free', edu: 'edu', give: 'give', ffa: 'ffa' };
  // [Y2] The three pay amounts and the names 38.31 shows for them. Only the salary starts periods.
  const PAY_KEYS = ['a', 'b', 'side'];
  const PAY_NAME = { a: 'Salary', b: 'Second pay', side: 'Side pay' };
  const PAY_A = 'mv:pay:steps.a';
  // The built-in keys of every build (LINE_DEFS): a line with a built-in id uses its built-in key, any other `line:<id>`.
  const BUILTIN_KEY = { rent: 'bill:rent', util: 'bill:util', food: 'bill:food', net: 'bill:net', phone: 'bill:phone', ins: 'bill:ins', subs: 'bill:subs',
    gas: 'bill:gas', loan: 'bill:loan', card: 'card', spend: 'envelope', learn: 'education', invest: 'invest', give: 'give' };
  const keyOfLine = l => BUILTIN_KEY[(l || {}).id] || 'line:' + (l || {}).id;
  // [11.1, D3, Y15] where each ui key goes: shared screen answers follow the person; look, sound, tour and coach marks
  // stay on the device.
  const UI_SHARED = ['main', 'loans', 'subP', 'subO', 'subs', 'cardT', 'cardB', 'limits', 'noDebts', 'askNums', 'win', 'done', 'sb', 'bd', 'more', 'setup', 'cleared', 'src', 'full', 'home', 'mcOk'];
  const UI_LOOK = ['mute', 'music', 'vol', 'dj', 'scene', 'ms', 'mcSeen', 'vaultSeen', 'imp', 'bk', 'bkLater', 'sampleHidden', 'exactHidden', 'remindHidden', 'moreBillsHidden', 'rcCat', 'rcFreq', 'rcDom', 'rcDay', 'rcTime', 'gset', 'movedIn', 'noMove'];
  const UI_TOUR = ['tourAt', 'toured', 'onb', 'seen'];
  const UI_USED = ['cur', 'preset', 'name', 'gk', 'accts', 'cats', 'wk', 'sweep', 'keep', 'keeps', 'preSplit', 'minAuto'];
  const CFG_USED = ['bankStart', 'bankAt', 'bankNow', 'bankNowAt', 'minBank', 'ceiling', 'aims', 'planFrom'];
  // [Y5, AA8, AA9] the older cfg figures: decided, so never listed.
  const CFG_OLD = ['loanLast', 'redirectLoan', 'moveMonth', 'carDue', 'moveTarget', 'moveStart', 'travelTarget', 'travelStart', 'carTarget', 'carStart', 'rainyStart', 'rainyTarget', 'rainyStretch'];
  const TOP_USED = ['v', 'rev', 'steps', 'once', 'items', 'cfg', 'ui', 'plan', 'receipts', 'cards'];
  const RC_KNOWN = ['id', 'd', 'a', 'c', 'cn', 'n', 's'];
  const GOAL_KNOWN = ['id', 'name', 'target', 'start', 'due', 'slot', 'monthly', 'why', 'emergency', 'stretch', 'stretchOn', 'stretchFrom'];
  // [AC6] the words appended to a receipt on the loan line when there is no loan
  const LOAN_GONE = '(moved: loan line removed)';
  // [AD1] the day from which 38.31 writes ui.minAuto with a minimum it fills in
  const MIN_AUTO_FROM = '2026-11-20';
  // 38.31's window and pay day, for the set-asides it worked out itself [Y10, AA11]
  const M_START = '2026-11', M_END = '2028-10', PAYDAY = 15;

  // Every build's sample plan (LINE_DEFS and GOAL_DEFS, the original peso sample): a copy with no plan is read as every
  // build reads it (basePlan), these with the older cfg goal figures on top.
  const LINE_DEFS = [['rent', 'nec', 'Rent or mortgage', 7000], ['util', 'nec', 'Utilities', 1750], ['food', 'nec', 'Food and groceries', 5500], ['net', 'nec', 'Internet', 1200],
    ['phone', 'nec', 'Phone', 500], ['ins', 'nec', 'Insurance and contributions', 1000], ['subs', 'nec', 'Subscriptions', 500], ['gas', 'nec', 'Transport', 1800],
    ['loan', 'nec', 'Loan or debt payment', 0], ['card', 'nec', 'Other card spending', 0], ['spend', 'play', 'Free to spend', 3500], ['learn', 'edu', 'Courses and books', 3500],
    ['invest', 'ffa', 'Investing', 3500], ['give', 'give', 'Giving', 1750]].map(([id, jar, name, def]) => ({ id, jar, name, def }));
  const GOAL_DEFS = () => [
    { id: 'moving', name: 'Home or move', target: 16000, start: 0, due: '2028-03-01', slot: 4 },
    { id: 'travel', name: 'Trip', target: 8000, start: 0, due: '', monthly: 500, slot: 5 },
    { id: 'car', name: 'Yearly cost', target: 3500, start: 0, due: '2027-06-15', slot: 6 },
    { id: 'rainy', name: 'Emergency fund', target: 57750, start: 25000, due: '', monthly: 1500, emergency: true, stretch: 115500, slot: 7 }];
  function withFigures(g, c) {
    const set = (k, v) => { if (typeof v === 'number' && v >= 0) g[k] = v; };
    if (g.id === 'moving') { set('target', c.moveTarget); set('start', c.moveStart); if (/^\d{4}-\d{2}$/.test(c.moveMonth || '')) g.due = c.moveMonth + '-01'; }
    if (g.id === 'travel') { set('target', c.travelTarget); set('start', c.travelStart); }
    if (g.id === 'car') { set('target', c.carTarget); set('start', c.carStart); if (/^\d{4}-\d{2}-\d{2}$/.test(c.carDue || '')) g.due = c.carDue; }
    if (g.id === 'rainy') { set('start', c.rainyStart); set('target', c.rainyTarget); set('stretch', c.rainyStretch); }
    return g;
  }
  function basePlan(c) {
    const lines = LINE_DEFS.map(l => Object.assign({}, l)), goals = GOAL_DEFS().map(g => withFigures(g, c));
    const loan = lines.find(l => l.id === 'loan');
    if (/^\d{4}-\d{2}$/.test(c.loanLast || '')) loan.ends = c.loanLast;
    if (typeof c.redirectLoan === 'boolean') loan.redirect = c.redirectLoan;
    return { lines, goals };
  }

  // ---------- small helpers ----------
  const isMap = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const isDay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const isYm = s => typeof s === 'string' && /^\d{4}-\d{2}$/.test(s);
  const ymIdx = ym => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5)) - 1;
  const ymAdd = (ym, n) => { const i = ymIdx(ym) + n; return Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0'); };
  const lastDayOf = ym => dayStr(dayNum(ymAdd(ym, 1) + '-01') - 1);
  const byField = (x, y) => (x.field < y.field ? -1 : x.field > y.field ? 1 : 0);
  const byId = (x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
  const clone = x => JSON.parse(JSON.stringify(x));
  // Moments [section 0, X9]: written in the moving device's offset.
  // Worked out by arithmetic, never through Date [D8].
  function isoAt(t, offset) {
    const x = t + D.offsetMin(offset) * 60000, day = Math.floor(x / D.MS), p = (n, w) => String(n).padStart(w || 2, '0');
    let r = x - day * D.MS;
    const h = Math.floor(r / 3600000); r -= h * 3600000;
    const mi = Math.floor(r / 60000); r -= mi * 60000;
    const s = Math.floor(r / 1000);
    return dayStr(day) + 'T' + p(h) + ':' + p(mi) + ':' + p(s) + '.' + p(r - s * 1000, 3) + offset;
  }
  const startOf = (day, offset) => day + 'T00:00:00.000' + offset;
  const endOf = (day, offset) => day + 'T23:59:59.999' + offset;
  const earlier = (a, b) => (ms(a) <= ms(b) ? a : b);
  // A sorted-key text of a value.
  function canon(x) {
    if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
    return JSON.stringify(x);
  }
  // The merge's rule for one record [H6, L merge q1]: newer `at`; on the same `at` the one with `gone`; then the larger
  // `by`; then the larger sorted text. And the D4 clock: the larger of now and the newest seen plus 1 ms, in now's offset.
  // (Kept here until the engine has its merge; they must stay the merge's own rules.)
  const msOr = t => (typeof t === 'string' && !Number.isNaN(ms(t)) ? ms(t) : -Infinity);
  function winner(x, y) {
    const d = msOr(x.at) - msOr(y.at);
    if (d) return d > 0 ? x : y;
    if (!!x.gone !== !!y.gone) return x.gone ? x : y;
    if ((x.by || '') !== (y.by || '')) return (x.by || '') > (y.by || '') ? x : y;
    return canon(x) >= canon(y) ? x : y;
  }
  const offsetText = t => { const o = D.offsetOf(t); return !o || o === 'Z' ? '+00:00' : o; };
  const nextAt = (now, lastSeen) => isoAt(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetText(now));
  // [AN7] the shop-key form the statement reader and the person write (`k:` trimmed, spaces collapsed, lowercased)
  const catKey = s => 'k:' + String(s).trim().replace(/\s+/g, ' ').toLowerCase();

  // [O, H9] The currency, read from the raw copy. 38.28's clean-up writes ₱ and preset `legacy` into any copy with no
  // currency, so ₱ with preset `legacy` (or none) is asked, as is no `ui.cur`; "$", "¥" and anything unknown are asked.
  const SYMBOLS = { '₱': 'PHP', '€': 'EUR' };
  function moveCurrency(ui) {
    const c = (ui || {}).cur, preset = (ui || {}).preset;
    if (typeof c !== 'string' || !c) return { cur: null, ask: true };
    if (U.known(c)) return { cur: c, ask: false };
    if (!SYMBOLS[c]) return { cur: null, ask: true };
    if (c === '₱' && (!preset || preset === 'legacy')) return { cur: null, ask: true };
    return { cur: SYMBOLS[c], ask: false };
  }

  // [Y13, AA10] The copy's last save: the later of the IndexedDB second copy's `t` and the stored `rev` when it is a time
  // (38.31 saves max(now, rev + 1) in ms; 38.28 and older a count); either one alone; else the move's own time.
  function lastSave({ idb, copy, now, offset }) {
    const t = idb && idb.t != null ? (typeof idb.t === 'number' ? isoAt(idb.t, offset) : idb.t) : null;
    const r = copy && typeof copy.rev === 'number' && copy.rev >= 1e12 ? isoAt(copy.rev, offset) : null;
    if (t && r) return ms(r) > ms(t) ? r : t;
    return t || r || now;
  }
  // every build's rule (sampleOn): the sample shows until pay, bills and goals are done, unless cleared or blank
  function sampleShown(ui) { const d = ui.done || {}, zero = ui.preset === 'blank' || !!ui.cleared; return !zero && !(d.pay && d.bills && d.goals); }
  // 38.31's amount for a key in a month (model.js val, steps part): the latest step from that month or before.
  function inForce(steps, ym) { let best = null; for (const s of steps || []) if (s && s.from <= ym && (!best || s.from > best.from)) best = s; return best ? best.v : undefined; }
  // [11.1, Y3] The amount in force in the opening month is the first entry, from the opening; each later step an entry
  // from its month's first day. Steps before the opening stay in frozen3831 only.
  function stepList(steps, first, openYm, D0, amt, path) {
    const out = [{ from: D0, amount: amt(first, path) }];
    for (const s of (steps || []).slice().sort((a, b) => (a.from < b.from ? -1 : 1))) if (s.from > openYm) out.push({ from: s.from + '-01', amount: amt(s.v, path) });
    return out;
  }
  // [Y25] A line (or pay amount) that is 0 every month.
  function zeroAll(def, steps, once, key) {
    if (def > 0) return false;
    if ((steps || []).some(s => s && s.v !== 0)) return false;
    return !Object.keys(once).some(ym => isMap(once[ym]) && typeof once[ym][key] === 'number' && once[ym][key] !== 0);
  }
  // [AA4] The due days in a month of an answered rule (monthly on days, every N weeks); a day past the month's end is
  // its last day. Any other rule gives none, so what waits for it stays in `pendingMove`.
  function duesIn(rule, ym) {
    if (!rule) return [];
    const last = Number(lastDayOf(ym).slice(8));
    if (rule.every === 'month' && Array.isArray(rule.days)) return [...new Set(rule.days.map(d => ym + '-' + String(Math.min(Number(d), last)).padStart(2, '0')))].sort();
    if (rule.every === 'weeks' && isDay(rule.from) && rule.n > 0) {
      const step = 7 * rule.n, first = dayNum(ym + '-01'), end = dayNum(lastDayOf(ym)), out = [];
      let d = dayNum(rule.from); d += Math.ceil((first - d) / step) * step;
      for (; d <= end; d += step) out.push(dayStr(d));
      return out;
    }
    return [];
  }
  // [AA4] The period holding a day: from the latest due on or before it to the day before the next.
  function periodHolding(rule, day) {
    const ym = day.slice(0, 7); let start = null, next = null;
    for (let k = 0; k < 13 && !start; k++) { const l = duesIn(rule, ymAdd(ym, -k)).filter(d => d <= day); if (l.length) start = l[l.length - 1]; }
    for (let k = 0; k < 13 && !next; k++) { const l = duesIn(rule, ymAdd(ym, k)).filter(d => d > day); if (l.length) next = l[0]; }
    return start && next ? { start, last: dayStr(dayNum(next) - 1) } : null;
  }
  // [AB2, L units q4] An amount spread over a list, the leftover minor units to the earliest.
  function spread(a, list) { const parts = U.spread(a, list.length), out = {}; list.forEach((k, i) => { out[k] = parts[i]; }); return out; }
  // [T1, Z5, AB2] A one-month amount of a budget line or share replaces the month's total: spread over the periods
  // starting in that month (keyed by the pay that starts each), the leftover to the earliest; with none starting in it,
  // the period holding its first day takes it all.
  function onceSpreadOf(stream, rule, ym, a) {
    const lands = [-1, 0, 1].reduce((l, n) => l.concat(duesIn(rule, ymAdd(ym, n))), []).sort();
    let list = lands.filter(d => d.slice(0, 7) === ym);
    if (!list.length) { const h = lands.filter(d => d <= ym + '-01').pop(); list = h ? [h] : []; }
    return list.length ? spread(a, list.map(d => stream + '@' + d)) : {};
  }
  // 38.31's rounding unit (model.js roundUnit): 100, 10 or 5 by the largest monthly pay in its window.
  function roundUnit(copy) {
    const steps = isMap(copy.steps) ? copy.steps : {}, once = isMap(copy.once) ? copy.once : {};
    let pay = 0;
    for (let i = ymIdx(M_START); i <= ymIdx(M_END); i++) {
      const m = Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
      const val = k => (isMap(once[m]) && typeof once[m][k] === 'number' ? once[m][k] : inForce(steps[k], m) || 0);
      pay = Math.max(pay, val('a') + val('b') + val('side'));
    }
    return pay >= 20000 ? 100 : pay >= 5000 ? 10 : 5;
  }
  const planFromOf = cfg => (typeof cfg.planFrom === 'string' && cfg.planFrom >= M_START && cfg.planFrom <= M_END ? cfg.planFrom : M_START);
  // [Y10] A dated goal's monthly set-aside as 38.31 worked it out (evenSave): what is missing, over the months from the
  // plan's first month to its last saving month, rounded up to its unit.
  function evenSave(copy, g, ym) {
    const cfg = isMap(copy.cfg) ? copy.cfg : {};
    const t = Math.max(0, (g.target || 0) - (g.start || 0)); if (t <= 0) return 0;
    const rb = Number(g.due.slice(8, 10)) > PAYDAY ? g.due.slice(0, 7) : ymAdd(g.due.slice(0, 7), -1);
    if (ym > rb) return 0;
    const pf = planFromOf(cfg);
    if (ym < pf) return 0;
    const n = ymIdx(rb) - ymIdx(pf) + 1; if (n < 1) return 0;
    const u = roundUnit(copy);
    return Math.ceil(t / n / u) * u;
  }
  // [AA11] A goal with no date and no monthly: 38.31's figure (goalDefault), a twelfth of what is missing toward its cap.
  function undatedFigure(copy, g, ym) {
    const cfg = isMap(copy.cfg) ? copy.cfg : {};
    if (ym < M_START || ym < planFromOf(cfg)) return 0;
    const cap = g.emergency && g.stretchOn === true && !(g.stretchFrom && ym < g.stretchFrom) ? Math.max(g.stretch || 0, g.target || 0) : g.target || 0;
    const rem = Math.max(0, cap - (g.start || 0)); if (rem <= 0) return 0;
    const u = roundUnit(copy);
    return Math.ceil(rem / 12 / u) * u;
  }
  // [AN7, AO7] ui.cats keys in the shop-key form; two keys that become one keep the later, the join listed.
  const catsOf = cats => Object.fromEntries(Object.entries(cats).map(([k, v]) => [catKey(k), v]));
  function catsJoined(cats) {
    const by = {};
    for (const k of Object.keys(cats)) (by[catKey(k)] = by[catKey(k)] || []).push(k);
    return Object.keys(by).sort().filter(k => by[k].length > 1).map(k => ({ key: k, kept: by[k][by[k].length - 1], dropped: by[k].slice(0, -1) }));
  }
  // [Y20] A receipt's (or self-logged spend's) category.
  function catOf(c, lineOfKey) {
    if (c === 'other') return { place: 'free', line: 'other' };
    if (typeof c === 'string' && /^bill:(rent|util|net|phone|ins|subs)$/.test(c)) return lineOfKey[c] ? Object.assign({}, lineOfKey[c]) : { place: 'bills' };
    return lineOfKey[c] ? Object.assign({}, lineOfKey[c]) : {};
  }

  // ---------- the move ----------
  // input: { raw (the stored text) or copy, now (ISO with offset), offset?, idb? ({ t }), answers? }.
  // Returns the new book in memory with the move's own view: asks, unplaced, zero, rounded, morePays, catsJoined, sample,
  // saved, frozen3831 (the raw text), device. `stored` gives what is saved.
  function move(input) {
    const raw = typeof input.raw === 'string' ? input.raw : JSON.stringify(input.copy);
    const copy = JSON.parse(raw);   // [O] the raw stored text, never a cleaned copy
    const ui = isMap(copy.ui) ? copy.ui : {}, cfg = isMap(copy.cfg) ? copy.cfg : {};
    const answers = input.answers || {};
    const now = input.now, offset = input.offset || now.slice(-6);
    const saved = lastSave({ idb: input.idb, copy, now, offset }), savedDay = saved.slice(0, 10);
    const moveDay = now.slice(0, 10), moveYm = moveDay.slice(0, 7);   // [Y21]
    const unplaced = [], asks = [], zero = [], rounded = [];
    // [O, H9] the currency first, before any amount is converted
    const mc = moveCurrency(ui);
    const cur = mc.ask ? answers.cur || null : mc.cur;
    if (!cur) return { v: 3, asks: [{ q: 'currency' }], waiting: 'currency', frozen3831: raw };
    if (mc.ask) asks.push({ q: 'currency', answer: cur });
    // [Y23] more decimals than the currency has: rounded half up and listed
    const amt = (x, path) => { const r = U.toMinor(String(x), cur); if (r.rounded && path && !rounded.includes(path)) rounded.push(path); return r.minor; };
    const sample = sampleShown(Object.assign({ preset: 'legacy' }, ui));
    const hasPlan = isMap(copy.plan) && Array.isArray(copy.plan.lines) && Array.isArray(copy.plan.goals);
    const plan = hasPlan ? copy.plan : basePlan(cfg);   // [Y5, AA9]
    const steps = isMap(copy.steps) ? copy.steps : {}, once = isMap(copy.once) ? copy.once : {}, items = isMap(copy.items) ? copy.items : {};

    // ---- the bank figures [11.1, Y1, Y22]: each a dated check; the oldest opens the bank
    let figures = [];
    for (const [k, at] of [['bankStart', 'bankAt'], ['bankNow', 'bankNowAt']]) if (typeof cfg[k] === 'number') {
      const dated = isDay(cfg[at]), day = dated ? cfg[at] : savedDay;
      figures.push({ key: k, a: amt(cfg[k], 'cfg.' + k), date: day, told: dated ? earlier(endOf(day, offset), saved) : saved, stale: !dated });
    }
    if (figures.length === 2 && figures[0].date === figures[1].date) figures = [figures[1]];   // [Y22] bankNow wins
    figures.sort((x, y) => dayNum(x.date) - dayNum(y.date));
    const D0 = figures.length ? figures[0].date : savedDay, openYm = D0.slice(0, 7);
    const bank = figures.length ? 'mv:acct:cfg' : null;
    if (!bank) asks.push({ q: 'bankFigure' });   // [Y19]
    const home = { curs: [{ from: D0, cur }], main: { acct: bank, min: null } };   // [Y18, AL3]
    // [MAKO M1, AD1, AF1] the minimum: kept when typed, dropped and asked when automatic, asked showing it when unknown
    if (!sample && typeof cfg.minBank === 'number') {
      const oldBuild = (typeof copy.rev === 'number' && copy.rev < 1e12) || savedDay < MIN_AUTO_FROM;
      const old = amt(cfg.minBank, 'cfg.minBank');
      if (ui.minAuto !== undefined ? cfg.minBank === ui.minAuto : oldBuild) asks.push({ q: 'minBank' });
      else if (ui.minAuto !== undefined) home.main.min = { a: old, cur };
      else if (answers.minBank !== undefined) {
        asks.push({ q: 'minBank', shown: old, answer: answers.minBank });
        home.main.min = typeof answers.minBank === 'number' ? { a: answers.minBank, cur } : null;
      } else { asks.push({ q: 'minBank', shown: old }); home.main.min = { a: old, cur, asked: true }; }
    }

    const accounts = [], events = [], places = [], schedules = [], budgets = [], shares = [], debtAccts = [];
    if (bank) accounts.push({ id: bank, name: 'Bank', type: 'bank', cur, confirm: true });   // [Y26]
    // [11.1, Y18] ui.accts: accounts with their names; a wallet is an e-wallet unless named as cash
    const acctByName = {};
    for (const a of Array.isArray(ui.accts) ? ui.accts : []) if (a && typeof a.name === 'string') {
      const id = 'mv:acct:' + a.id;
      const type = a.kind === 'card' ? 'card' : a.kind === 'wallet' ? (/\bcash\b/i.test(a.name) ? 'cash' : 'ewallet') : 'bank';
      accounts.push({ id, name: a.name, type, cur, confirm: true });
      acctByName[a.name] = id;
    }
    // [11.1, Y1] cards[] (38.31): pay-in-full cards opened with a check of `owed` dated `at`
    for (const c of Array.isArray(copy.cards) ? copy.cards : []) if (c && typeof c.id === 'string') {
      const id = 'mv:card:' + c.id, day = isDay(c.at) ? c.at : savedDay, told = isDay(c.at) ? earlier(endOf(day, offset), saved) : saved;
      accounts.push({ id, name: c.name, type: 'card', cur, payDay: c.payDay == null ? null : c.payDay, cutDay: null, inFull: true, payFrom: bank, confirm: true });
      acctByName[c.name] = id;
      const owed = amt(typeof c.owed === 'number' ? c.owed : 0, 'cards.' + c.id + '.owed');
      events.push({ id: 'mv:open:card:' + c.id, k: 'open', date: day, acct: id, a: owed, told }, { id: 'mv:check:card:' + c.id, k: 'check', date: day, acct: id, a: owed, told });
    }

    // ---- the plan, unless the sample is still shown [Y16]
    const goalPlace = {}, lineOfKey = {}, ownAccount = {};
    let loanAcct = null, loanPending = false, loanAnswered = false, loanDropped = false;
    const pend = [];   // [AA5] what waits for a pay, bill or payment day
    if (!sample) {
      const gk = isMap(ui.gk) ? ui.gk : {};
      const emergency = (plan.goals || []).find(g => g && g.emergency);
      // [AA12, AC3] a loan the move makes asks its rate and minimum; until answered 0 and the old payment, `terms: 'asked'`
      const terms = (acc, oldMonthly) => {
        const ans = (answers.loanTerms || {})[acc.id];
        asks.push(Object.assign({ q: 'loanTerms', acct: acc.id }, ans !== undefined ? { answer: ans } : {}));
        if (ans === undefined) Object.assign(acc, { apr: 0, minRule: { fixed: oldMonthly }, terms: 'asked' });
        else if (ans === 'dontKnow') Object.assign(acc, { apr: 0, minRule: { fixed: oldMonthly } });
        else if (isMap(ans)) Object.assign(acc, { apr: ans.apr, minRule: { fixed: amt(ans.min, 'answers.loanTerms.' + acc.id + '.min') } });
      };
      const goalMonthly = g => { const v = inForce(steps['goal:' + g.id], openYm); return v !== undefined ? v : isDay(g.due) ? evenSave(copy, g, moveYm) : typeof g.monthly === 'number' ? g.monthly : g.due ? 0 : undatedFigure(copy, g, openYm); };
      // [11.1, Y9] plan.debts: loan or card accounts; `debt:<id>` steps their extraSteps; payment day asked
      for (const d of Array.isArray(plan.debts) ? plan.debts : []) if (d && typeof d.id === 'string') {
        const id = 'mv:debt:' + d.id, key = 'debt:' + d.id, ex = inForce(steps[key], openYm);
        const rec = { id, name: d.name, type: d.kind === 'card' ? 'card' : 'loan', cur, apr: d.apr || 0, minRule: { fixed: amt(d.min || 0, 'plan.debts.' + d.id + '.min') },
          extraSteps: stepList(steps[key], ex === undefined ? d.extra || 0 : ex, openYm, D0, amt, 'steps.' + key), payDay: null, payFrom: bank, confirm: true };
        if (d.kind === 'card') Object.assign(rec, { inFull: false, cutDay: null });
        accounts.push(rec); debtAccts.push(id);
        const bal = amt(d.balance || 0, 'plan.debts.' + d.id + '.balance');
        events.push({ id: 'mv:open:debt:' + d.id, k: 'open', date: D0, acct: id, a: bal, told: saved }, { id: 'mv:check:debt:' + d.id, k: 'check', date: D0, acct: id, a: bal, told: saved });
      }
      // [11.1] plan.goals: places; ui.gk gives the kind
      for (const g of plan.goals || []) if (g && typeof g.id === 'string') {
        const id = 'mv:place:' + g.id, kind = g.emergency ? 'emergency' : gk[g.id] === 'debt' ? 'payoff' : 'goal';
        const p = { id, name: g.name, kind, target: amt(g.target || 0, 'plan.goals.' + g.id + '.target'), due: isDay(g.due) ? g.due : null, cur, slot: g.slot };
        if (kind === 'payoff') {
          // [Y11, Z6] it pays the debt of its name, else a new loan; its saved so far is the loan's `paidBefore`
          let loan = accounts.find(a => debtAccts.includes(a.id) && a.name === g.name);
          if (!loan) {
            loan = { id: 'mv:debt:plan.goals.' + g.id, name: g.name, type: 'loan', cur, payDay: null, payFrom: bank, confirm: true };
            accounts.push(loan); debtAccts.push(loan.id); asks.push({ q: 'loanBalance', acct: loan.id });
            terms(loan, amt(goalMonthly(g), 'plan.goals.' + g.id + '.monthly'));
          }
          p.pays = loan.id;
          if (g.start > 0) loan.paidBefore = amt(g.start, 'plan.goals.' + g.id + '.start');
        } else {
          p.keptIn = { acct: bank, mode: 'inBank' };
          if (g.start > 0) {
            // [Y17, Z3, AA13] every goal with money is asked where it is; until answered it is in the bank
            const ans = (answers.goalMoney || {})[g.id];
            asks.push(Object.assign({ q: 'goalMoney', place: id }, ans !== undefined ? { answer: ans } : {}));
            if (isMap(ans)) {
              const aid = 'mv:acct:plan.goals.' + g.id, money = amt(g.start, 'plan.goals.' + g.id + '.start');
              accounts.push({ id: aid, name: ans.name, type: ans.type, cur, confirm: true });
              events.push({ id: 'mv:open:plan.goals.' + g.id, k: 'open', date: D0, acct: aid, a: money, told: saved }, { id: 'mv:check:plan.goals.' + g.id, k: 'check', date: D0, acct: aid, a: money, told: saved });
              p.keptIn = { acct: aid, mode: 'ownAccount' }; ownAccount[g.id] = true;
            }
          }
        }
        if (g.emergency) { p.emergency = true; p.stretch = amt(g.stretch || 0, 'plan.goals.' + g.id + '.stretch'); if (typeof g.stretchOn === 'boolean') p.stretchOn = g.stretchOn; if (typeof g.stretchFrom === 'string') p.stretchFrom = g.stretchFrom; }
        if (typeof g.why === 'string' && g.why) p.why = g.why;
        for (const k of Object.keys(g)) if (!GOAL_KNOWN.includes(k) && ['string', 'number', 'boolean'].includes(typeof g[k])) p[k] = g[k];   // unknown plain fields kept
        places.push(p); goalPlace[g.id] = id;
      }
      const payRule = k => (answers.pay || {})[k];
      // [11.1] plan.lines
      let loanLine = null;
      const shareLines = [];
      for (const l of plan.lines || []) if (l && typeof l.id === 'string') {
        const key = keyOfLine(l), inf = inForce(steps[key], openYm), first = inf === undefined ? l.def || 0 : inf;
        if (zeroAll(l.def || 0, steps[key], once, key)) {   // [Y25, Y4]
          zero.push('plan.lines.' + l.id);
          if (l.id === 'loan') for (const k of ['loanLast', 'redirectLoan']) if (cfg[k] !== undefined) zero.push('cfg.' + k);
          continue;
        }
        let endsYm = isYm(l.ends) ? l.ends : null, redirectOn = !!l.redirect;
        if (l.id === 'loan' && hasPlan && !endsYm && isYm(cfg.loanLast || '')) { endsYm = cfg.loanLast; if (typeof cfg.redirectLoan === 'boolean' && l.redirect === undefined) redirectOn = cfg.redirectLoan; }   // [Y5, AA8]
        const ends = endsYm ? lastDayOf(endsYm) : null;   // [Y6]
        const redirect = ends && redirectOn ? (emergency ? goalPlace[emergency.id] : null) : null;
        if (l.id === 'loan') { loanLine = { l, key, first, ends, redirect }; continue; }
        if (SHARE_OF_LINE[l.id]) { shareLines.push({ key, field: SHARE_OF_LINE[l.id], def: l.def || 0 }); continue; }
        const extra = Object.assign({}, ends ? { ends } : {}, redirect ? { redirect } : {});
        const st = stepList(steps[key], first, openYm, D0, amt, 'steps.' + key);
        if (BILL_IDS.includes(l.id)) {
          // [Y7, AD4] a bill schedule; its one-month amount waits for its day
          const id = 'mv:bill:' + l.id, rule = (answers.billDay || {})[l.id], s = Object.assign({ id, kind: 'bill', name: l.name, cur, acct: bank, place: 'bills', steps: st }, extra);
          asks.push(Object.assign({ q: 'billDay', bill: id }, rule ? { answer: rule } : {}));
          if (rule) s.rules = [{ from: D0, rule }];
          if (rule && !(rule.every === 'month' && Array.isArray(rule.days) && rule.days.length === 1)) s.per = 'month';
          for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number')
            pend.push({ field: 'once.' + ym + '.' + key, waits: id, to: 'amounts', ym, a: amt(once[ym][key], 'once.' + ym + '.' + key) });
          schedules.push(s);
          lineOfKey[key] = { place: 'bills', line: id };
        } else {
          const id = 'mv:line:' + l.id;
          for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number')
            pend.push({ field: 'once.' + ym + '.' + key, waits: PAY_A, to: 'once', line: id, ym, a: amt(once[ym][key], 'once.' + ym + '.' + key) });
          budgets.push(Object.assign({ id, name: l.name, place: JAR_PLACE[l.jar] || 'bills', cur, per: 'month', steps: st }, extra));
          lineOfKey[key] = { line: id };
        }
      }
      // [E6, Y4] the "Loan or debt payment" line: matched to a loan, dropped, or a loan of its own
      if (loanLine) {
        const ans = answers.loanLine, debts = accounts.filter(a => a.id.startsWith('mv:debt:') && !a.id.startsWith('mv:debt:plan.'));
        const fill = acc => Object.assign(acc, { minRule: { fixed: amt(loanLine.first, 'steps.bill:loan') }, steps: stepList(steps[loanLine.key], loanLine.first, openYm, D0, amt, 'steps.bill:loan') },
          loanLine.ends ? { ends: loanLine.ends } : {}, loanLine.redirect ? { redirect: loanLine.redirect } : {});
        if (ans !== undefined) {
          asks.push({ q: 'loanLine', answer: ans });
          const acc = accounts.find(a => a.id === 'mv:debt:' + ans);
          if (ans !== 'drop' && acc) { fill(acc); loanAcct = acc.id; }
          if (debts.length) { loanAnswered = true; loanDropped = ans === 'drop'; }
        } else if (debts.length) { asks.push({ q: 'loanLine' }); loanPending = true; }
        else {
          const acc = fill({ id: 'mv:debt:plan.lines.loan', name: loanLine.l.name, type: 'loan', cur });
          Object.assign(acc, { payDay: null, payFrom: bank, confirm: true });
          accounts.push(acc); debtAccts.push(acc.id); asks.push({ q: 'loanBalance', acct: acc.id }); loanAcct = acc.id;
          terms(acc, amt(loanLine.first, 'steps.bill:loan'));
        }
      }
      // [Y2, AB2, AC1] steps a, b and side: three income streams into the main bank, each a monthly total
      for (const k of PAY_KEYS) {
        const has = Array.isArray(steps[k]) || Object.keys(once).some(ym => isMap(once[ym]) && typeof once[ym][k] === 'number');
        if (!has) continue;
        if (zeroAll(0, steps[k], once, k)) { zero.push('steps.' + k); continue; }
        const inf = inForce(steps[k], openYm), rule = payRule(k);
        const s = { id: 'mv:pay:steps.' + k, kind: 'income', name: PAY_NAME[k], cur, acct: bank, startsPeriod: k === 'a', per: 'month', steps: stepList(steps[k], inf === undefined ? 0 : inf, openYm, D0, amt, 'steps.' + k) };
        asks.push(Object.assign({ q: 'payDay', pay: k }, rule ? { answer: rule } : {}));
        if (rule) s.rules = [{ from: D0, rule }];
        for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][k] === 'number')
          pend.push({ field: 'once.' + ym + '.' + k, waits: s.id, to: 'amounts', ym, a: amt(once[ym][k], 'once.' + ym + '.' + k) });
        schedules.push(s);
      }
      for (const k of Object.keys(SHARE_OF_KEY)) lineOfKey[k] = { place: SHARE_OF_KEY[k] };
      // [11.1, Y3, Y10, AA11] plan.shares: one entry from the opening, then one per later month with a step; a dated
      // goal's set-aside counts from the move day
      const goalKeys = (plan.goals || []).filter(g => g && goalPlace[g.id] && (steps['goal:' + g.id] || (!g.due && typeof g.monthly === 'number') || (isDay(g.due) && evenSave(copy, g, moveYm) > 0)
        || (!g.due && typeof g.monthly !== 'number' && undatedFigure(copy, g, openYm) > 0)));
      const valAt = (key, ym, dflt) => { const v = inForce(steps[key], ym); return v === undefined ? dflt : v; };
      const entry = (ym, from, idPart, dated) => {
        const e = { id: 'mv:share:' + idPart, from, cur };
        for (const s of shareLines) { e[s.field] = amt(valAt(s.key, ym, s.def), 'steps.' + s.key); (e.per = e.per || {})[s.field] = 'month'; }
        const gs = {};
        for (const g of goalKeys) {
          const dflt = isDay(g.due) ? (dated ? evenSave(copy, g, moveYm) : undefined) : typeof g.monthly === 'number' ? g.monthly : g.due ? undefined : undatedFigure(copy, g, ym);
          const v = valAt('goal:' + g.id, ym, dflt); if (v !== undefined) gs[goalPlace[g.id]] = amt(v, 'steps.goal:' + g.id);
        }
        if (Object.keys(gs).length) e.goals = gs;
        return e;
      };
      if (shareLines.length || goalKeys.length) {
        const fromMove = dayNum(moveDay) > dayNum(D0);
        shares.push(entry(openYm, D0, 'steps', !fromMove));
        const later = new Set();
        for (const k of shareLines.map(x => x.key).concat(goalKeys.map(g => 'goal:' + g.id))) for (const s of steps[k] || []) if (s.from > openYm) later.add(s.from);
        const list = [...later].map(ym => ({ ym, from: ym + '-01', id: 'steps.' + ym }));
        if (fromMove && goalKeys.some(g => isDay(g.due))) list.push({ ym: moveYm, from: moveDay, id: 'plan.goals' });
        for (const x of list.sort((a, b) => dayNum(a.from) - dayNum(b.from))) shares.push(entry(x.ym, x.from, x.id, dayNum(x.from) >= dayNum(moveDay)));
      }
      // steps keys with nothing to apply them to (a removed line): listed
      const known = new Set(Object.keys(lineOfKey).concat(['bill:loan'], PAY_KEYS, (plan.lines || []).map(keyOfLine),
        (plan.goals || []).map(g => 'goal:' + (g || {}).id), (plan.debts || []).map(d => 'debt:' + (d || {}).id)));
      for (const k of Object.keys(steps)) if (!known.has(k)) unplaced.push('steps.' + k);
      const onceDone = k => PAY_KEYS.includes(k) || (lineOfKey[k] && lineOfKey[k].line) || ((plan.lines || []).some(l => l && keyOfLine(l) === k && zero.includes('plan.lines.' + l.id)));
      // [AA6, AC5, AC7, AD2] the other one-month amounts: shares, goals, the draw, a debt's, the loan line's
      const fund = emergency ? goalPlace[emergency.id] : null;
      for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym])) for (const k of Object.keys(once[ym])) {
        if (onceDone(k)) continue;
        const field = 'once.' + ym + '.' + k, v = once[ym][k], base = typeof v === 'number' ? { field, ym, a: amt(v, field) } : null;
        if (base && SHARE_OF_KEY[k] && shares.length) pend.push(Object.assign({ waits: PAY_A, to: 'shares', share: SHARE_OF_KEY[k] }, base));
        else if (base && k.startsWith('goal:') && goalPlace[k.slice(5)] && shares.length) pend.push(Object.assign({ waits: PAY_A, to: 'shares', goal: goalPlace[k.slice(5)] }, base));
        else if (base && k === 'draw' && fund) pend.push(Object.assign({ waits: PAY_A, to: 'move', place: fund }, base));
        else if (base && k.startsWith('debt:') && debtAccts.includes('mv:debt:' + k.slice(5))) pend.push(Object.assign({ waits: 'mv:debt:' + k.slice(5), to: 'amounts' }, base));
        else if (base && k === 'bill:loan' && (loanAcct || loanPending)) pend.push(Object.assign({ waits: loanAcct || 'loanLine', to: 'amounts' }, base));
        else if (base && k === 'bill:loan' && loanDropped) { zero.push(field); pend.push(Object.assign({ waits: 'loanLine', to: 'amounts', done: true }, base)); }
        else unplaced.push(field);
      }
      // [11.1, H9, Y21, AA2] items[ym]: a once schedule on the month's first day (in the move month, after the opening)
      for (const ym of Object.keys(items).sort()) for (const it of Array.isArray(items[ym]) ? items[ym] : []) if (isMap(it) && typeof it.amount === 'number') {
        let date = ym + '-01';
        if (ym === moveYm && dayNum(date) < dayNum(D0)) date = dayStr(dayNum(D0) + 1);
        const note = typeof it.note === 'string' && it.note.trim() ? it.note.trim() : null;
        schedules.push(Object.assign({ id: 'mv:item:' + ym + ':' + it.id, kind: 'once', name: (typeof it.label === 'string' && it.label) || 'One-time cost' }, note ? { note } : {},
          { cur, acct: bank, rules: [{ from: date, rule: { every: 'once', date } }], steps: [{ from: date, amount: amt(it.amount, 'items.' + ym + '.' + it.id + '.amount') }] }));
      }
      // [11.1, H9, Y20] plan.recurring: autoSpend schedules
      for (const r of Array.isArray(plan.recurring) ? plan.recurring : []) if (r && typeof r.id === 'string') {
        let from = r.from, rule;
        if (r.every === 'week') { let n = dayNum(from); while (weekday(n) !== r.on) n++; from = dayStr(n); rule = { every: 'weeks', n: 1, from }; }
        else rule = { every: 'month', days: [r.on] };
        const s = Object.assign({ id: 'mv:auto:' + r.id, kind: 'autoSpend', name: r.n || '', cur, acct: bank }, catOf(r.c, lineOfKey), { from, rules: [{ from, rule }], steps: [{ from, amount: amt(r.a, 'plan.recurring.' + r.id + '.a') }] });
        if (isDay(r.last)) s.last = r.last;
        schedules.push(s);
      }
      // [Y8, AA3, AA4, AB2, AC8] ui.sweep after the opening: the period-end answer of the period holding that month's
      // last day; it waits for the salary's day and for that period to have ended
      if (isMap(ui.sweep)) for (const ym of Object.keys(ui.sweep).sort()) if (isYm(ym) && dayNum(lastDayOf(ym)) >= dayNum(D0)) {
        const v = ui.sweep[ym];
        if (!isMap(v) || v.hide === true) continue;
        const field = 'ui.sweep.' + ym;
        const older = v.to === undefined && typeof v.id === 'string';
        const to = v.to === 'bank' ? 'waiting' : v.to === 'next' ? 'free' : older ? goalPlace[v.id] || 'waiting' : undefined;
        if (!to || typeof v.amt !== 'number') { unplaced.push(field); continue; }
        const mv = Object.assign({ to, a: amt(v.amt, field + '.amt') }, older && !goalPlace[v.id] ? { toPlace: true } : {});
        pend.push({ field, waits: PAY_A, to: 'periodEnd', ym, place: 'free', moves: [mv], told: typeof v.t === 'number' ? isoAt(v.t, offset) : saved });
      }
    }
    if (sample) for (const k of Object.keys(SHARE_OF_KEY)) lineOfKey[k] = { place: SHARE_OF_KEY[k] };

    // ---- the bank opening [B6, B7, 11.1]: the oldest figure; goal money kept in the bank is its split
    if (bank) {
      const split = {};
      for (const g of plan.goals || []) if (!sample && g && goalPlace[g.id] && g.start > 0 && !ownAccount[g.id] && places.find(p => p.id === goalPlace[g.id]).kind !== 'payoff') split[goalPlace[g.id]] = amt(g.start, 'plan.goals.' + g.id + '.start');
      const f0 = figures[0];
      events.unshift(Object.assign({ id: 'mv:open:cfg', k: 'open', date: f0.date, acct: bank, a: f0.a }, Object.keys(split).length ? { split } : {}, { told: f0.told }),
        // [WIRING_PLAN F2] a figure with no day of its own (38.28 has no bankAt) is dated the copy's last save and marked
        // `stale`, so it is never shown as the bank today
        ...figures.map(f => Object.assign({ id: 'mv:check:cfg.' + f.key, k: 'check', date: f.date, acct: bank, a: f.a, told: f.told }, f.stale ? { stale: true } : {})));
    }
    // ---- receipts [11.1, I5, J2, Y14, Y20, AA1, AA7, AC2, AC6]: every one in the raw text, told at the start of its day
    for (const r of Array.isArray(copy.receipts) ? copy.receipts : []) if (r && typeof r.id === 'string') {
      const acctS = typeof r.s === 'string' && acctByName[r.s];
      let n = typeof r.n === 'string' ? r.n : '';
      if (typeof r.s === 'string' && r.s && !acctS) n = n ? n + '; paid from: ' + r.s : 'paid from: ' + r.s;
      const note = n ? { note: n } : {};
      const base = { id: 'mv:rc:' + r.id, date: r.d, a: amt(r.a, 'receipts.' + r.id + '.a'), acct: acctS || bank };
      const listRest = () => { for (const k of Object.keys(r)) if (!RC_KNOWN.includes(k)) unplaced.push('receipts.' + r.id + '.' + k); };
      const waitRc = () => ({ field: 'receipts.' + r.id, waits: 'loanLine', to: 'repay', event: Object.assign({ id: base.id, k: 'repay', date: r.d, a: base.a, acct: base.acct }, note, { src: { type: 'move', id: r.id }, told: startOf(r.d, offset) }) });
      if (r.c === 'bill:loan' && loanPending) { pend.push(waitRc()); listRest(); continue; }
      if (r.c === 'bill:loan' && loanAnswered) pend.push(Object.assign(waitRc(), { done: true }));
      let e;
      if (r.c === 'bill:loan' && loanAcct) e = Object.assign({ id: base.id, k: 'repay', date: r.d, a: base.a, acct: base.acct, acct2: loanAcct }, note);
      else if (r.c === 'bill:loan') e = Object.assign({ id: base.id, k: 'spend', date: r.d, a: base.a, acct: base.acct, place: 'bills', line: 'loan' }, { note: n ? n + ' ' + LOAN_GONE : LOAN_GONE });
      else e = Object.assign({ id: base.id, k: 'spend', date: r.d, a: base.a, acct: base.acct }, catOf(r.c, lineOfKey), note);
      events.push(Object.assign(e, { src: { type: 'move', id: r.id }, told: startOf(r.d, offset) }));
      listRest();
    }
    // [Y9] every debt's payment day is asked
    for (const id of debtAccts) {
      const day = (answers.debtDay || {})[id.slice('mv:debt:'.length)];
      asks.push(Object.assign({ q: 'debtDay', acct: id }, day != null ? { answer: day } : {}));
      if (day != null) accounts.find(a => a.id === id).payDay = day;
    }

    // ---- ui, cfg and top-level fields
    const shared = {}, look = {}, tour = {};
    for (const k of Object.keys(ui)) {
      if (UI_SHARED.includes(k)) shared[k] = ui[k];
      else if (UI_LOOK.includes(k)) look[k] = ui[k];
      else if (UI_TOUR.includes(k)) tour[k] = ui[k];
      else if (!UI_USED.includes(k)) { shared[k] = ui[k]; unplaced.push('ui.' + k); }
    }
    for (const k of Object.keys(cfg)) if (!CFG_USED.includes(k) && !CFG_OLD.includes(k)) unplaced.push('cfg.' + k);
    for (const k of Object.keys(copy)) if (!TOP_USED.includes(k)) unplaced.push('top.' + k);

    const out = { v: 3, home, people: typeof ui.name === 'string' && ui.name ? [{ id: 'mv:person:ui.name', name: ui.name }] : [],
      accounts, places, schedules, events,
      plan: { shares, budgets }, imports: isMap(ui.cats) ? { cats: catsOf(ui.cats) } : {}, ui: shared,
      device: { look, tour, opens: Array.isArray(ui.wk) ? ui.wk : [] },
      asks, unplaced: unplaced.sort(), zero: zero.sort(), rounded: rounded.sort(),
      catsJoined: isMap(ui.cats) ? catsJoined(ui.cats) : [],
      sample, saved, frozen3831: raw };
    // [11.1, O6, AL5] the ceiling with its currency and `per: 'month'`; aims are shares
    if (!sample && (typeof cfg.ceiling === 'number' || isMap(cfg.aims))) out.plan.limits = Object.assign({}, typeof cfg.ceiling === 'number' ? { ceiling: { a: amt(cfg.ceiling, 'cfg.ceiling'), cur, per: 'month' } } : {}, isMap(cfg.aims) ? { aims: cfg.aims } : {});
    out.morePays = [];   // [AE4, AG2]
    out.pendingMove = applyPending(out, pend.map(x => Object.assign({ id: 'mv:pend:' + x.field }, x)), moveDay);
    out.morePays.sort();
    out.needs = needs(out);
    return out;
  }

  // [WIRING_PLAN F2] What the old copy cannot answer, for the screens to ask after the move. Worked out from the records,
  // so it reads a stored book the same as the move's own output. Each entry names the record it is about (`ref`):
  //   bankToday   the main bank has no figure dated by the person (38.28: bankStart only, marked `stale`), or none at all
  //   cards       no card account at all (38.28 kept no cards): which cards are paid from the bank
  //   cardDays    a card with no payment day or no close day (`missing` lists which)
  //   billDay     a bill with no due day (no rule)
  //   cardLine    the "Other card spending" budget line: is it really these card payments? [E6 for cards]
  function needs(book) {
    const out = [], main = fieldVal((book.home || {}).main) || {}, bank = main.acct || null;
    const live = r => r && !r.gone;
    const checks = (book.events || []).filter(e => live(e) && e.k === 'check' && bank && e.acct === bank);
    if (!checks.length || checks.every(e => e.stale)) out.push({ q: 'bankToday', ref: bank });
    const cards = (book.accounts || []).filter(a => live(a) && a.type === 'card');
    if (!cards.length) out.push({ q: 'cards', ref: bank });
    for (const c of cards) {
      const missing = ['payDay', 'cutDay'].filter(k => c[k] == null);
      if (missing.length) out.push({ q: 'cardDays', ref: c.id, missing });
    }
    for (const s of book.schedules || []) if (live(s) && s.kind === 'bill' && !(s.rules || []).some(live)) out.push({ q: 'billDay', ref: s.id });
    for (const b of (book.plan || {}).budgets || []) if (live(b) && b.id === 'mv:line:card') out.push({ q: 'cardLine', ref: b.id });
    return out;
  }
  const fieldVal = f => (isMap(f) && 'v' in f ? f.v : f);   // [AL1] a stored field value `{ v, at, by }`

  // ---------- what waits for a day [AA5, AB rows, AD5, AE1, AE4, AG2] ----------
  function ruleOf(out, id) {
    const s = (out.schedules || []).find(x => x.id === id);
    if (s) return s.rules && s.rules.length ? s.rules[s.rules.length - 1].rule : null;
    const a = (out.accounts || []).find(x => x.id === id);
    return a && a.payDay != null ? { every: 'month', days: [a.payDay] } : null;
  }
  // Each entry is a record `mv:pend:<field path>`; what has its day is written now (and kept marked `gone`), the rest is
  // returned. What an answer at this move settles (`done`) is kept `gone` too.
  function applyPending(out, pend, moveDay) {
    const all = [], evs = [];
    for (const p of pend.slice().sort(byField)) {
      if (p.done) { const q = Object.assign({}, p); delete q.done; all.push(Object.assign(q, { gone: moveDay })); continue; }
      const rule = ruleOf(out, p.waits);
      all.push(rule && writePending(out, p, rule, evs, moveDay) ? Object.assign({}, p, { gone: moveDay }) : p);
    }
    if (evs.length) { const i = out.events.findIndex(e => /^mv:rc:/.test(e.id)); out.events.splice(i < 0 ? out.events.length : i, 0, ...evs); }
    return all;
  }
  const entries = m => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { amount: v }]));
  // [AE4, AG2] usual pays: the days a monthly rule names; every N weeks 52 / N / 12 rounded down, at least 1
  function usualPays(rule) {
    if (rule.every === 'month' && Array.isArray(rule.days)) return new Set(rule.days.map(Number)).size;
    if (rule.every === 'weeks' && rule.n > 0) return Math.max(1, Math.floor(52 / rule.n / 12));
    return Infinity;
  }
  function noteMore(out, p, n, rule) { if (n > usualPays(rule) && out.morePays && !out.morePays.includes(p.field)) out.morePays.push(p.field); }
  function writePending(out, p, rule, evs, moveDay) {
    const dueOf = key => key.slice(key.lastIndexOf('@') + 1);
    if (p.to === 'amounts') {   // [Y2, AB2, AD4, AE3] spread per pay; [Y7, AC5, AC7] that month's first occurrence, whole
      const rec = out.schedules.find(s => s.id === p.waits) || out.accounts.find(a => a.id === p.waits);
      const dues = duesIn(rule, p.ym); if (!dues.length) return false;
      const each = rec.kind === 'income' || rec.per === 'month';
      Object.assign(rec.amounts = rec.amounts || {}, entries(each ? spread(p.a, dues) : { [dues[0]]: p.a }));
      if (each) noteMore(out, p, dues.length, rule);
      return true;
    }
    if (p.to === 'periodEnd') {   // [Y8, AA4, AB2] the period holding that month's last day, once it has ended
      const per = periodHolding(rule, lastDayOf(p.ym)); if (!per || dayNum(per.last) >= dayNum(moveDay)) return false;
      evs.push({ id: 'pe:' + p.waits + '@' + per.start + ':' + p.place, k: 'periodEnd', date: per.last, place: p.place, moves: p.moves, told: p.told, src: { type: 'move', id: p.field } });
      return true;
    }
    const keys = onceSpreadOf(p.waits, rule, p.ym, p.a), list = Object.keys(keys); if (!list.length) return false;
    if (p.to === 'once' || p.to === 'shares') noteMore(out, p, list.length, rule);
    if (p.to === 'once') { const b = out.plan.budgets.find(x => x.id === p.line); Object.assign(b.once = b.once || {}, entries(keys)); return true; }
    if (p.to === 'shares') {   // [AA6, AB2] on the entry in force on each period's pay day, keyed by its occurrence
      for (const key of list) {
        let e = out.plan.shares[0];
        for (const x of out.plan.shares) if (dayNum(x.from) <= dayNum(dueOf(key))) e = x;
        const o = (e.once = e.once || {})[key] = (e.once || {})[key] || {};
        if (p.share) o[p.share] = keys[key]; else (o.goals = o.goals || {})[p.goal] = keys[key];
      }
      return true;
    }
    if (p.to === 'move') {   // [AA6, AC4] the draw: out of the fund's place to Waiting, on the first period's pay day
      evs.push({ id: 'mv:draw:once.' + p.ym, k: 'move', date: dueOf(list[0]), place: p.place, a: p.a, told: out.saved });
      return true;
    }
    return false;
  }

  // ---------- answers after the move [AA5, AC2, AB rows, AD5] ----------
  const LISTS = [['people'], ['accounts'], ['places'], ['schedules'], ['events'], ['plan', 'shares'], ['plan', 'budgets']];
  const listOf = (o, path) => path.reduce((x, k) => (x || {})[k], o) || [];
  // `later`: pay, billDay, debtDay, loanLine answered after the move. Every record they changed carries the answer's `at`;
  // each waiting entry they wrote is kept `gone` with it.
  function moveAnswer(input) {
    const later = input.later || {}, at = input.answeredAt || input.now, stampBy = input.by ? { by: input.by } : {};
    const before = move(input), ans = Object.assign({}, input.answers || {});
    for (const k of ['pay', 'billDay', 'debtDay']) if (later[k]) ans[k] = Object.assign({}, ans[k] || {}, later[k]);
    if (later.loanLine !== undefined) ans.loanLine = later.loanLine;
    const out = move(Object.assign({}, input, { answers: ans }));
    for (const path of LISTS) for (const r of listOf(out, path)) {
      const b = listOf(before, path).find(x => x.id === r.id);
      if (b && canon(b) !== canon(r)) Object.assign(r, { at }, stampBy);
    }
    const still = new Set(out.pendingMove.map(p => p.id)), wasLive = new Set(before.pendingMove.filter(p => !p.gone).map(p => p.id));
    for (const p of out.pendingMove) if (p.gone && wasLive.has(p.id)) Object.assign(p, { gone: at.slice(0, 10), at }, stampBy);
    for (const p of before.pendingMove) if (!still.has(p.id)) out.pendingMove.push(Object.assign({}, p, { gone: at.slice(0, 10), at }, stampBy));
    out.pendingMove.sort(byField);
    return out;
  }

  // ---------- stamping and storing [section 0, X1, AB1, AE1, AL1, AN7] ----------
  // A moved record carries the copy's last save as `at`, never the move moment, so any later real edit wins.
  function stampKeys(r, saved, by) {
    const o = Object.assign({}, r), st = e => Object.assign({}, e, { at: e.at || saved, by: e.by || by });
    for (const k of ['amounts', 'once']) if (isMap(o[k])) o[k] = Object.fromEntries(Object.entries(o[k]).map(([key, e]) => [key, st(e)]));
    if (Array.isArray(o.extraSteps)) o.extraSteps = o.extraSteps.map(st);
    return o;
  }
  function stamp(m, now, by, saved) {
    const rec = r => stampKeys(Object.assign({ told: saved }, r, { at: r.at || saved, by: r.by || by }), saved, by);
    m.frozen = [{ id: 'mv:frozen:' + by, raw: m.frozen3831 }];   // the raw old text, kept per device [AB1]
    for (const k of ['people', 'accounts', 'places', 'schedules', 'events', 'frozen', 'pendingMove']) m[k] = (m[k] || []).map(rec);
    m.plan.shares = m.plan.shares.map(rec); m.plan.budgets = m.plan.budgets.map(rec);
    const fields = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, { v, at: saved, by }]));
    if (m.plan.limits) m.plan.limits = fields(m.plan.limits);
    const curs = (m.home.curs || []).map(e => Object.assign({}, e, { at: e.at || saved, by: e.by || by }));
    m.home = Object.assign(fields(Object.fromEntries(Object.entries(m.home).filter(([k]) => k !== 'curs'))), { curs });
    m.ui = fields(m.ui);
    if (isMap(m.imports) && isMap(m.imports.cats)) m.imports = Object.assign({}, m.imports, { cats: Object.fromEntries(Object.entries(m.imports.cats).map(([k, v]) => [k, { v, src: 'person', at: saved, by }])) });
    m.rev = ms(now); m.at = now;
    return m;
  }
  const VIEW_ONLY = ['device', 'needs', 'asks', 'unplaced', 'zero', 'rounded', 'morePays', 'catsJoined', 'sample', 'saved', 'frozen3831'];
  // One device's move as it is stored (`by` its device part): answered later when `later` is given; the move's own view
  // and the device-only parts dropped. A move still waiting for the currency gives no book (null).
  function stored(d) {
    const o = d.later ? moveAnswer(d) : move(d);
    if (o.waiting) return null;
    const m = stamp(o, d.now, d.by, o.saved);
    for (const k of VIEW_ONLY) delete m[k];
    return m;
  }
  // [AE5] A 38.31-format backup restored after the move: moved, every record stamped with the restore's `at`.
  function movedBackup({ copy, raw, answers, now, by, at }) {
    const o = move({ copy, raw, answers, now, idb: null }), m = stamp(o, now, by, at);
    for (const k of VIEW_ONLY) delete m[k];
    return m;
  }
  // [AE5 reading] a backup is in the old format when it has an old field and no `v: 3`
  const isOldCopy = c => isMap(c) && c.v !== 3 && ['cfg', 'steps', 'once', 'receipts', 'items', 'cards'].some(k => k in c);
  // [AB1] A device that finds a moved copy in the cloud takes it and adds only the ids it lacks.
  function adopt(cloud, mine) {
    const out = clone(cloud);
    const add = (to, from) => { const have = new Set(to.map(r => r.id)); for (const r of from) if (!have.has(r.id)) to.push(r); to.sort(byId); };
    for (const k of Object.keys(mine)) if (Array.isArray(mine[k])) add(out[k] = out[k] || [], mine[k]);
    for (const k of ['shares', 'budgets']) add(out.plan[k] = out.plan[k] || [], (mine.plan || {})[k] || []);
    return out;
  }
  // [X1, Y12, AB1] The move on two devices. `merge(a, b)` is the engine's merge of two copies (passed in until the
  // engine has its own).
  function moveTwo({ phone, desktop, cloud }, merge) {
    const p = stored(phone), d = stored(desktop);
    return cloud ? adopt(p, d) : merge(p, d);
  }
  // [AB1] The phone moves and is used (`edits`, each with its own `at`); then the desktop moves.
  function moveLater({ phone, edits, desktop, cloud }, merge) {
    const p = stored(phone);
    for (const e of edits || []) {
      const r = e.record ? e.record.split('.').reduce((o, k) => (o[k] = o[k] || {}), p) : listOf(p, e.list.split('.')).find(x => x.id === e.id);
      for (const k of e.unset || []) delete r[k];
      if (e.record) { for (const [k, v] of Object.entries(e.set || {})) r[k] = Object.assign({ v }, e.src ? { src: e.src } : {}, { at: e.at, by: phone.by }); }
      else Object.assign(r, e.set, { at: e.at, by: phone.by });
    }
    const d = stored(desktop);
    return cloud ? adopt(p, d) : merge(p, d);
  }

  // ---------- a day answered on a stored copy [AE2, AG1] ----------
  // Each live waiting entry whose day is now known is applied once by this device and written `gone`. What it writes
  // carries the entry's `at` and is judged as the merge judges it, record by record and key by key; a restored entry
  // writes with the D4 clock. `rules` gives each answered day by its schedule or account.
  function newestAt(x, best) {
    if (Array.isArray(x)) for (const v of x) best = newestAt(v, best);
    else if (isMap(x)) for (const [k, v] of Object.entries(x)) {
      if (k === 'at' && typeof v === 'string' && !Number.isNaN(ms(v)) && (!best || ms(v) > ms(best))) best = v;
      else best = newestAt(v, best);
    }
    return best;
  }
  function applyWaiting({ copy, rules, moveDay, answeredAt: rawAt, by, lastSeen }) {
    const out = clone(copy), before = clone(copy);
    const seen = newestAt(copy, lastSeen || null), answeredAt = seen && ms(seen) >= ms(rawAt) ? nextAt(seen, seen) : rawAt;
    const day = rawAt.slice(0, 10), changed = new Set();
    for (const id of Object.keys(rules || {})) {
      const s = (out.schedules || []).find(x => x.id === id), a = (out.accounts || []).find(x => x.id === id);
      if (s) { s.rules = [{ from: (s.steps && s.steps[0] && s.steps[0].from) || moveDay, rule: rules[id], at: answeredAt, by }]; changed.add(s); }
      else if (a && rules[id].every === 'month') { a.payDay = rules[id].days[0]; changed.add(a); }
    }
    const noKeys = r => { const o = clone(r); delete o.amounts; delete o.once; return o; };
    const KEYED = [['schedules'], ['accounts'], ['plan', 'budgets'], ['plan', 'shares']];
    for (const p of out.pendingMove || []) {
      if (p.gone) continue;
      const rule = ruleOf(out, p.waits); if (!rule) continue;
      const scratch = { schedules: (before.schedules || []).map(noKeys), accounts: (before.accounts || []).map(noKeys),
        plan: { budgets: ((before.plan || {}).budgets || []).map(noKeys), shares: ((before.plan || {}).shares || []).map(noKeys) }, events: [], saved: p.at };
      const evs = [];
      if (!writePending(scratch, p, rule, evs, moveDay)) continue;
      const at = p.told && ms(p.at) > ms(p.told) ? answeredAt : p.at;
      for (const ev of evs) {
        const i = (out.events = out.events || []).findIndex(x => x.id === ev.id), old = i >= 0 ? out.events[i] : null;
        const rec = Object.assign({}, ev, { told: old ? old.told : ev.told || p.at, at, by });
        if (old && winner(old, rec) === old) continue;
        if (i >= 0) out.events[i] = rec; else out.events.push(rec);
      }
      for (const path of KEYED) for (const sr of listOf(scratch, path)) for (const k of ['amounts', 'once']) {
        if (!isMap(sr[k])) continue;
        const target = listOf(out, path).find(x => x.id === sr.id);
        for (const key of Object.keys(sr[k])) {
          const have = isMap(target[k]) ? target[k][key] : undefined, val = sr[k][key];
          if (isMap(have) && (ms(have.at) > ms(at) || (ms(have.at) === ms(at) && have.gone))) continue;
          const same = isMap(have) && !have.gone && ms(have.at) === ms(at);
          (target[k] = target[k] || {})[key] = Object.assign({}, same ? have : {}, val, { at, by });
          changed.add(target);
        }
      }
      Object.assign(p, { gone: day, at: answeredAt, by });
    }
    for (const r of changed) Object.assign(r, { at: answeredAt, by });
    return out;
  }

  const api = { move, moveAnswer, applyWaiting, stored, stamp, movedBackup, adopt, moveTwo, moveLater, lastSave, moveCurrency, isOldCopy, duesIn, catKey, needs };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).move = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
