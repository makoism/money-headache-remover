// Moving a saved copy from an older build (SCHEMA_V3 11 and 11.1; DECISIONS_ROUND2 E1, E4, E6, H9, I5, J2, K3, O, O watch,
// X1, X9, X watch, Y1 to Y28, Z3, Z5, Z6, AA1 to AA13, AB1, AB2, AB rows, AC1 to AC8).
// A plain reference for the engine lane, checked by run_rules.js against rules/move.json. The field list it follows is
// foundation_review/MOVE_FIELDS.md, which also names the `mv:` kinds. Where Y to AA leave a detail open, the reference
// does the least it can and move.json names the open question.
'use strict';
const { dayNum, dayStr, weekday } = require('./dates');
const { moveCurrency, toMinor, onceSpread, periodPerPay } = require('./units_ref');
const { merge } = require('./merge_ref');

// 38.31 plan.lines ids: the bills [11.1], the loan line [E6], the four lines that are plan.shares, and the jar of each
// budget line [11.1, B8]. Every other line (food, gas, card, custom) is a budget line.
const BILL_IDS = ['rent', 'util', 'net', 'phone', 'ins', 'subs'];
const SHARE_OF_LINE = { spend: 'free', learn: 'edu', invest: 'ffa', give: 'give' };
const SHARE_OF_KEY = { envelope: 'free', education: 'edu', invest: 'ffa', give: 'give' };
const JAR_PLACE = { nec: 'bills', play: 'free', edu: 'edu', give: 'give', ffa: 'ffa' };
// [Y2] The three pay amounts and the names 38.31 shows for them (ui1.js IN_ROWS). Only the salary starts periods.
const PAY_KEYS = ['a', 'b', 'side'];
const PAY_NAME = { a: 'Salary', b: 'Second pay', side: 'Side pay' };
// The built-in keys of every build (LINE_DEFS): a line with a built-in id uses its built-in key, any other `line:<id>`.
const BUILTIN_KEY = { rent: 'bill:rent', util: 'bill:util', food: 'bill:food', net: 'bill:net', phone: 'bill:phone', ins: 'bill:ins', subs: 'bill:subs',
  gas: 'bill:gas', loan: 'bill:loan', card: 'card', spend: 'envelope', learn: 'education', invest: 'invest', give: 'give' };
// [11.1] where each ui key goes. Shared screen answers follow the person; look, sound, tour and coach marks stay on the
// device [D3]. [Y15] Tour and coach keys are tour keys (`seen` holds the tabs whose coach marks were shown, ui48.js).
const UI_SHARED = ['main', 'loans', 'subP', 'subO', 'subs', 'cardT', 'cardB', 'limits', 'noDebts', 'askNums', 'win', 'done', 'sb', 'bd', 'more', 'setup', 'cleared', 'src', 'full', 'home', 'mcOk'];
const UI_LOOK = ['mute', 'music', 'vol', 'dj', 'scene', 'ms', 'mcSeen', 'vaultSeen', 'imp', 'bk', 'bkLater', 'sampleHidden', 'exactHidden', 'remindHidden', 'moreBillsHidden', 'rcCat', 'rcFreq', 'rcDom', 'rcDay', 'rcTime', 'gset', 'movedIn', 'noMove'];
const UI_TOUR = ['tourAt', 'toured', 'onb', 'seen'];
const UI_USED = ['cur', 'preset', 'name', 'gk', 'accts', 'cats', 'wk', 'sweep', 'keep', 'keeps', 'preSplit', 'minAuto'];
const CFG_USED = ['bankStart', 'bankAt', 'bankNow', 'bankNowAt', 'minBank', 'ceiling', 'aims', 'planFrom'];
// [Y5, AA8, AA9] The older cfg figures: loanLast and redirectLoan go to the loan when its line has none of its own; each
// goal figure is read only for a copy with no plan (a plan without that goal means it was removed). Every one of them is
// decided, so none is listed.
const CFG_OLD = ['loanLast', 'redirectLoan', 'moveMonth', 'carDue', 'moveTarget', 'moveStart', 'travelTarget', 'travelStart', 'carTarget', 'carStart', 'rainyStart', 'rainyTarget', 'rainyStretch'];
const TOP_USED = ['v', 'rev', 'steps', 'once', 'items', 'cfg', 'ui', 'plan', 'receipts', 'cards'];
const RC_KNOWN = ['id', 'd', 'a', 'c', 'cn', 'n', 's'];
const GOAL_KNOWN = ['id', 'name', 'target', 'start', 'due', 'slot', 'monthly', 'why', 'emergency', 'stretch', 'stretchOn', 'stretchFrom'];
// Every build's sample plan (LINE_DEFS and GOAL_DEFS, the original peso sample). A copy with no plan is read the way
// every build reads it (basePlan): these, with the older cfg goal figures on top.
const LINE_DEFS = [['rent', 'nec', 'Rent or mortgage', 7000], ['util', 'nec', 'Utilities', 1750], ['food', 'nec', 'Food and groceries', 5500], ['net', 'nec', 'Internet', 1200],
  ['phone', 'nec', 'Phone', 500], ['ins', 'nec', 'Insurance and contributions', 1000], ['subs', 'nec', 'Subscriptions', 500], ['gas', 'nec', 'Transport', 1800],
  ['loan', 'nec', 'Loan or debt payment', 0], ['card', 'nec', 'Other card spending', 0], ['spend', 'play', 'Free to spend', 3500], ['learn', 'edu', 'Courses and books', 3500],
  ['invest', 'ffa', 'Investing', 3500], ['give', 'give', 'Giving', 1750]].map(([id, jar, name, def]) => ({ id, jar, name, def }));
const GOAL_DEFS = () => [
  { id: 'moving', name: 'Home or move', target: 16000, start: 0, due: '2028-03-01', slot: 4 },
  { id: 'travel', name: 'Trip', target: 8000, start: 0, due: '', monthly: 500, slot: 5 },
  { id: 'car', name: 'Yearly cost', target: 3500, start: 0, due: '2027-06-15', slot: 6 },
  { id: 'rainy', name: 'Emergency fund', target: 57750, start: 25000, due: '', monthly: 1500, emergency: true, stretch: 115500, slot: 7 }];
// The older cfg goal figures on one sample goal (every build's basePlan).
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

const isMap = o => !!o && typeof o === 'object' && !Array.isArray(o);
const isDay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const ymAdd = (ym, n) => { const i = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5)) - 1 + n; return Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0'); };
const lastDayOf = ym => dayStr(dayNum(ymAdd(ym, 1) + '-01') - 1);
// Moments [section 0, X9]: written with the moving device's offset.
const offMin = o => (o === 'Z' ? 0 : (o[0] === '-' ? -1 : 1) * (Number(o.slice(1, 3)) * 60 + Number(o.slice(4, 6))));
function isoAt(ms, offset) {
  const d = new Date(ms + offMin(offset) * 60000), p = (n, w) => String(n).padStart(w || 2, '0');
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + 'T' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + '.' + p(d.getUTCMilliseconds(), 3) + offset;
}
const startOf = (day, offset) => day + 'T00:00:00.000' + offset;
const endOf = (day, offset) => day + 'T23:59:59.999' + offset;
const earlier = (a, b) => (Date.parse(a) <= Date.parse(b) ? a : b);
// [Y13, AA10] The copy's last save: the later of the IndexedDB second copy's `t` and the stored `rev` when it is a time
// (38.31 saves max(now, rev + 1), a moment in ms; older builds a count); either one alone; else the move's own time.
function lastSave({ idb, copy, now, offset }) {
  const t = idb && idb.t != null ? (typeof idb.t === 'number' ? isoAt(idb.t, offset) : idb.t) : null;
  const r = copy && typeof copy.rev === 'number' && copy.rev >= 1e12 ? isoAt(copy.rev, offset) : null;
  if (t && r) return Date.parse(r) > Date.parse(t) ? r : t;
  return t || r || now;
}
// [sample] every build's rule (sampleOn): the sample shows until pay, bills and goals are done, unless the copy was cleared or is blank.
function sampleShown(ui) { const d = ui.done || {}, zero = ui.preset === 'blank' || !!ui.cleared; return !zero && !(d.pay && d.bills && d.goals); }
// 38.31's amount for a key in a month (model.js val, steps part): the latest step from that month or before, else none.
function inForce(steps, ym) { let best = null; for (const s of steps || []) if (s && s.from <= ym && (!best || s.from > best.from)) best = s; return best ? best.v : undefined; }
// [11.1, Y3] The amount in force in the opening month is the first entry, from the opening; each later step is an entry from
// the first day of its month. Steps before the opening are not entries of their own (they stay in frozen3831 only).
function stepList(steps, first, openYm, D0, amt, path) {
  const out = [{ from: D0, amount: amt(first, path) }];
  for (const s of (steps || []).slice().sort((a, b) => (a.from < b.from ? -1 : 1))) if (s.from > openYm) out.push({ from: s.from + '-01', amount: amt(s.v, path) });
  return out;
}
// [Y25] A line (or a pay amount) that is 0 in every month: no usual amount, every step 0 and every one-month amount 0.
function zeroAll(def, steps, once, key) {
  if (def > 0) return false;
  if ((steps || []).some(s => s && s.v !== 0)) return false;
  return !Object.keys(once).some(ym => isMap(once[ym]) && typeof once[ym][key] === 'number' && once[ym][key] !== 0);
}
// [AA4] The due days in a month of a rule the person answered (monthly on one or more days, every N weeks); a day past
// the month's end is its last day. Any other rule gives none here, so what waits for it stays in `pendingMove`.
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
const firstDue = (rule, ym) => duesIn(rule, ym)[0] || null;
// [AA4] The period holding a day: from the latest due on or before it to the day before the next due.
function periodHolding(rule, day) {
  const ym = day.slice(0, 7); let start = null, next = null;
  for (let k = 0; k < 13 && !start; k++) { const l = duesIn(rule, ymAdd(ym, -k)).filter(d => d <= day); if (l.length) start = l[l.length - 1]; }
  for (let k = 0; k < 13 && !next; k++) { const l = duesIn(rule, ymAdd(ym, k)).filter(d => d > day); if (l.length) next = l[0]; }
  return start && next ? { start, last: dayStr(dayNum(next) - 1) } : null;
}
// [11.1, T1, Z5, AA4, AB2] A one-month amount of a budget line or a share replaces that month's total: spread over the
// periods starting in that month (keyed by the pay that starts each), the leftover minor units to the earliest; with no
// period starting in it, the period holding that month's first day takes it all (units_ref onceSpread).
function onceSpreadOf(stream, rule, ym, a) {
  const pays = [-1, 0, 1].reduce((l, n) => l.concat(duesIn(rule, ymAdd(ym, n))), []).map(d => ({ occ: stream + '@' + d, lands: d }));
  return onceSpread({ ym, a, pays });
}
// [AB2] An amount spread over a list, the leftover minor units to the earliest.
function spread(a, list) { const base = Math.floor(a / list.length), extra = a - base * list.length, out = {}; list.forEach((k, i) => { out[k] = base + (i < extra ? 1 : 0); }); return out; }
// [Y10] A dated goal's monthly set-aside as 38.31 works it out (model.js evenSave, goalDefault): what is still missing,
// spread evenly over the months from the plan's first month to its last saving month (the due month when the due day is
// after 38.31's PAYDAY, 15, else the month before), rounded up to 38.31's unit (100, 10 or 5 by the largest monthly pay).
const M_START = '2026-11', M_END = '2028-10', PAYDAY = 15;
const ymIdx = ym => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5)) - 1;
function evenSave(copy, g, ym) {
  const cfg = isMap(copy.cfg) ? copy.cfg : {};
  const t = Math.max(0, (g.target || 0) - (g.start || 0)); if (t <= 0) return 0;
  const rb = Number(g.due.slice(8, 10)) > PAYDAY ? g.due.slice(0, 7) : ymAdd(g.due.slice(0, 7), -1);
  if (ym > rb) return 0;
  const pf = typeof cfg.planFrom === 'string' && cfg.planFrom >= M_START && cfg.planFrom <= M_END ? cfg.planFrom : M_START;
  if (ym < pf) return 0;
  const n = ymIdx(rb) - ymIdx(pf) + 1; if (n < 1) return 0;
  const u = roundUnit(copy);
  return Math.ceil(t / n / u) * u;
}
// 38.31's unit (model.js roundUnit): 100, 10 or 5 by the largest monthly pay in its window.
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
// [AA11] A goal with no date and no monthly: 38.31's figure (model.js goalDefault), a twelfth of what is still missing
// toward its cap (the Emergency fund's longer target when said yes to, from its month), rounded up to 38.31's unit.
function undatedFigure(copy, g, ym) {
  const cfg = isMap(copy.cfg) ? copy.cfg : {};
  const pf = typeof cfg.planFrom === 'string' && cfg.planFrom >= M_START && cfg.planFrom <= M_END ? cfg.planFrom : M_START;
  if (ym < M_START || ym < pf) return 0;
  const cap = g.emergency && g.stretchOn === true && !(g.stretchFrom && ym < g.stretchFrom) ? Math.max(g.stretch || 0, g.target || 0) : g.target || 0;
  const rem = Math.max(0, cap - (g.start || 0)); if (rem <= 0) return 0;
  const u = roundUnit(copy);
  return Math.ceil(rem / 12 / u) * u;
}

function move(input) {
  const raw = typeof input.raw === 'string' ? input.raw : JSON.stringify(madeCopy(input));
  const copy = JSON.parse(raw);   // [O] the raw stored text, never a cleaned copy
  const ui = isMap(copy.ui) ? copy.ui : {}, cfg = isMap(copy.cfg) ? copy.cfg : {};
  const answers = input.answers || {};
  const now = input.now, offset = input.offset || now.slice(-6);
  const saved = lastSave({ idb: input.idb, copy, now, offset }), savedDay = saved.slice(0, 10);
  const moveDay = now.slice(0, 10), moveYm = moveDay.slice(0, 7);   // [Y21] the move month is the calendar month the move runs in
  const unplaced = [], asks = [], zero = [], rounded = [];
  // [O, H9] the currency first: asked before any amount is converted.
  const mc = moveCurrency({ ui });
  const cur = mc.ask ? answers.cur || null : mc.cur;
  if (!cur) return { v: 3, asks: [{ q: 'currency' }], waiting: 'currency', frozen3831: raw };
  if (mc.ask) asks.push({ q: 'currency', answer: cur });
  // [Y23] An amount with more decimals than its currency is rounded half up and flagged.
  const amt = (x, path) => { const r = toMinor(String(x), cur); if (r.rounded && path && !rounded.includes(path)) rounded.push(path); return r.minor; };
  const sample = sampleShown(Object.assign({ preset: 'legacy' }, ui));
  const hasPlan = isMap(copy.plan) && Array.isArray(copy.plan.lines) && Array.isArray(copy.plan.goals);
  // [Y5, AA9] the older cfg goal figures are read only for a copy with no plan (every build's basePlan); a plan without a
  // goal means the person removed it, and an older figure never brings it back.
  const plan = hasPlan ? copy.plan : basePlan(cfg);
  const steps = isMap(copy.steps) ? copy.steps : {}, once = isMap(copy.once) ? copy.once : {}, items = isMap(copy.items) ? copy.items : {};

  // ---- the bank figures [11.1, H9, J2, K3, Y1, Y22]: each a dated check; the oldest opens the bank. bankAt and bankNowAt
  // are days with no time: told at the end of that day, or at the copy's last save when that is earlier [Y1].
  let figures = [];
  for (const [k, at] of [['bankStart', 'bankAt'], ['bankNow', 'bankNowAt']]) if (typeof cfg[k] === 'number') {
    const dated = isDay(cfg[at]), day = dated ? cfg[at] : savedDay;
    figures.push({ key: k, a: amt(cfg[k], 'cfg.' + k), date: day, told: dated ? earlier(endOf(day, offset), saved) : saved });
  }
  if (figures.length === 2 && figures[0].date === figures[1].date) figures = [figures[1]];   // [Y22] the same day: bankNow wins
  figures.sort((x, y) => dayNum(x.date) - dayNum(y.date));
  const D0 = figures.length ? figures[0].date : savedDay, openYm = D0.slice(0, 7);
  // [Y28] Records with no 38.31 id are named by their field path: the bank's account, opening and checks come from cfg.
  const bank = figures.length ? 'mv:acct:cfg' : null;
  if (!bank) asks.push({ q: 'bankFigure' });   // [Y19] asked at the first check-in; safe to spend shows nothing until then
  const home = { curs: [{ from: D0, cur }], minBank: null, mainBank: bank };   // [Y18] the typed bank figure is the main bank
  // [11.1, MAKO M1] the minimum only when typed: one the app filled in itself (ui.minAuto) is dropped.
  if (!sample && typeof cfg.minBank === 'number' && !(ui.minAuto !== undefined && cfg.minBank === ui.minAuto)) home.minBank = { a: amt(cfg.minBank, 'cfg.minBank'), cur };

  const accounts = [], events = [], places = [], schedules = [], budgets = [], shares = [], debtAccts = [];
  if (bank) accounts.push({ id: bank, name: 'Bank', type: 'bank', cur, confirm: true });   // [Y26]
  // [11.1, Y18] ui.accts: accounts with their names; a wallet is an e-wallet unless it is named as cash.
  const acctByName = {};
  for (const a of Array.isArray(ui.accts) ? ui.accts : []) if (a && typeof a.name === 'string') {
    const id = 'mv:acct:' + a.id;
    const type = a.kind === 'card' ? 'card' : a.kind === 'wallet' ? (/\bcash\b/i.test(a.name) ? 'cash' : 'ewallet') : 'bank';
    accounts.push({ id, name: a.name, type, cur, confirm: true });
    acctByName[a.name] = id;
  }
  // [11.1, Y1] cards[]: pay-in-full cards, opened with a check of `owed` dated `at`, told at the end of that day.
  for (const c of Array.isArray(copy.cards) ? copy.cards : []) if (c && typeof c.id === 'string') {
    const id = 'mv:card:' + c.id, day = isDay(c.at) ? c.at : savedDay, told = isDay(c.at) ? earlier(endOf(day, offset), saved) : saved;
    accounts.push({ id, name: c.name, type: 'card', cur, payDay: c.payDay == null ? null : c.payDay, cutDay: null, inFull: true, payFrom: bank, confirm: true });
    acctByName[c.name] = id;
    const owed = amt(typeof c.owed === 'number' ? c.owed : 0, 'cards.' + c.id + '.owed');
    events.push({ id: 'mv:open:card:' + c.id, k: 'open', date: day, acct: id, a: owed, told }, { id: 'mv:check:card:' + c.id, k: 'check', date: day, acct: id, a: owed, told });
  }

  // ---- the plan, unless the sample is still shown (never moved as real, requirements 1c, Y16)
  const goalPlace = {}, lineOfKey = {}, ownAccount = {};
  let loanAcct = null, loanPending = false;
  const pend = [];   // [AA5] what waits for a pay, bill or payment day: written by applyPending once that day is known
  if (!sample) {
    const gk = isMap(ui.gk) ? ui.gk : {};
    const emergency = (plan.goals || []).find(g => g && g.emergency);
    // [AA12] a loan the move makes asks its yearly rate and minimum; "don't know" is rate 0 and the old monthly payment
    // as a fixed minimum. [AC3] Until answered it holds the same, marked as asked (`terms: 'asked'`).
    const terms = (acc, oldMonthly) => {
      const ans = (answers.loanTerms || {})[acc.id];
      asks.push(Object.assign({ q: 'loanTerms', acct: acc.id }, ans !== undefined ? { answer: ans } : {}));
      if (ans === undefined) Object.assign(acc, { apr: 0, minRule: { fixed: oldMonthly }, terms: 'asked' });
      else if (ans === 'dontKnow') Object.assign(acc, { apr: 0, minRule: { fixed: oldMonthly } });
      else if (isMap(ans)) Object.assign(acc, { apr: ans.apr, minRule: { fixed: amt(ans.min, 'answers.loanTerms.' + acc.id + '.min') } });
    };
    // a goal's monthly set-aside in force at the opening, as 38.31 worked it out [Y10, AA11]
    const goalMonthly = g => { const v = inForce(steps['goal:' + g.id], openYm); return v !== undefined ? v : isDay(g.due) ? evenSave(copy, g, moveYm) : typeof g.monthly === 'number' ? g.monthly : g.due ? 0 : undatedFigure(copy, g, openYm); };
    // [11.1, Y9] plan.debts: a loan or card account opened at `balance`; `debt:<id>` steps become its extraSteps. Its
    // payment day is asked; a card's close day is "not sure" and it is not paid in full; kind `personal` is a loan.
    for (const d of Array.isArray(plan.debts) ? plan.debts : []) if (d && typeof d.id === 'string') {
      const id = 'mv:debt:' + d.id, key = 'debt:' + d.id, ex = inForce(steps[key], openYm);
      const rec = { id, name: d.name, type: d.kind === 'card' ? 'card' : 'loan', cur, apr: d.apr || 0, minRule: { fixed: amt(d.min || 0, 'plan.debts.' + d.id + '.min') },
        extraSteps: stepList(steps[key], ex === undefined ? d.extra || 0 : ex, openYm, D0, amt, 'steps.' + key), payDay: null, payFrom: bank, confirm: true };
      if (d.kind === 'card') Object.assign(rec, { inFull: false, cutDay: null });
      accounts.push(rec); debtAccts.push(id);
      const bal = amt(d.balance || 0, 'plan.debts.' + d.id + '.balance');
      events.push({ id: 'mv:open:debt:' + d.id, k: 'open', date: D0, acct: id, a: bal, told: saved }, { id: 'mv:check:debt:' + d.id, k: 'check', date: D0, acct: id, a: bal, told: saved });
    }
    // [11.1] plan.goals: places; ui.gk gives the kind.
    for (const g of plan.goals || []) if (g && typeof g.id === 'string') {
      const id = 'mv:place:' + g.id, kind = g.emergency ? 'emergency' : gk[g.id] === 'debt' ? 'payoff' : 'goal';
      const p = { id, name: g.name, kind, target: amt(g.target || 0, 'plan.goals.' + g.id + '.target'), due: isDay(g.due) ? g.due : null, cur, slot: g.slot };
      if (kind === 'payoff') {
        // [Y11] it pays the debt with the same name, else a new loan account whose balance is asked. [Z6] Its "saved so far"
        // was paid: never opened as savings, kept on that loan as what was paid before the move.
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
          // [Y17] every goal with money is asked where it is. Until answered it is kept in the bank (the safe side) [Z3].
          const ans = (answers.goalMoney || {})[g.id];
          asks.push(Object.assign({ q: 'goalMoney', place: id }, ans !== undefined ? { answer: ans } : {}));
          if (isMap(ans)) {   // "another account": an account the person names, opened with the money; kept there [11.1]
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
    // [Y2, AA4] each pay stream's answered rhythm; the salary's names the periods (budget and share `once`, period-end answers).
    const payRule = k => (answers.pay || {})[k];
    // [11.1] plan.lines
    let loanLine = null;
    const shareLines = [];   // [ { key, field, def } ] the four share lines present
    for (const l of plan.lines || []) if (l && typeof l.id === 'string') {
      const key = BUILTIN_KEY[l.id] || 'line:' + l.id, inf = inForce(steps[key], openYm), first = inf === undefined ? l.def || 0 : inf;
      if (zeroAll(l.def || 0, steps[key], once, key)) {   // [Y25, Y4] 0 every month: not moved, listed in the move summary
        zero.push('plan.lines.' + l.id);
        if (l.id === 'loan') for (const k of ['loanLast', 'redirectLoan']) if (cfg[k] !== undefined) zero.push('cfg.' + k);
        continue;
      }
      let endsYm = typeof l.ends === 'string' && /^\d{4}-\d{2}$/.test(l.ends) ? l.ends : null, redirectOn = !!l.redirect;
      // [Y5] with a plan, cfg.loanLast and redirectLoan go to the loan when its line has none of its own
      if (l.id === 'loan' && hasPlan && !endsYm && /^\d{4}-\d{2}$/.test(cfg.loanLast || '')) { endsYm = cfg.loanLast; if (typeof cfg.redirectLoan === 'boolean' && l.redirect === undefined) redirectOn = cfg.redirectLoan; }
      const ends = endsYm ? lastDayOf(endsYm) : null;   // [Y6] a line's `ends` month becomes its last day
      const redirect = ends && redirectOn ? (emergency ? goalPlace[emergency.id] : null) : null;
      if (l.id === 'loan') { loanLine = { l, key, first, ends, redirect }; continue; }
      if (SHARE_OF_LINE[l.id]) { shareLines.push({ key, field: SHARE_OF_LINE[l.id], def: l.def || 0 }); continue; }   // the four shares, below
      const extra = Object.assign({}, ends ? { ends } : {}, redirect ? { redirect } : {});
      const st = stepList(steps[key], first, openYm, D0, amt, 'steps.' + key);
      if (BILL_IDS.includes(l.id)) {
        // [Y7] a bill's steps are its schedule's steps; a bill's one-month amount is `amounts` on that month's occurrence.
        const id = 'mv:bill:' + l.id, rule = (answers.billDay || {})[l.id], s = Object.assign({ id, kind: 'bill', name: l.name, cur, acct: bank, place: 'bills', steps: st }, extra);
        asks.push(Object.assign({ q: 'billDay', bill: id }, rule ? { answer: rule } : {}));   // [11.1] until answered, due on the period's first day
        if (rule) s.rules = [{ from: D0, rule }];
        for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number')
          pend.push({ field: 'once.' + ym + '.' + key, waits: id, to: 'amounts', ym, a: amt(once[ym][key], 'once.' + ym + '.' + key) });   // [AA5]
        schedules.push(s);
        lineOfKey[key] = { place: 'bills', line: id };
      } else {
        const id = 'mv:line:' + l.id;
        for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number')
          pend.push({ field: 'once.' + ym + '.' + key, waits: PAY_A, to: 'once', line: id, ym, a: amt(once[ym][key], 'once.' + ym + '.' + key) });   // [AA5]
        budgets.push(Object.assign({ id, name: l.name, place: JAR_PLACE[l.jar] || 'bills', cur, per: 'month', steps: st }, extra));
        lineOfKey[key] = { line: id };
      }
    }
    // [E6, Y4] the "Loan or debt payment" line is matched to a loan account, or dropped with the person's OK; never both.
    // Matched, its amount is the loan's fixed minRule, its steps the loan's payment steps, its redirect the loan's at its
    // end. With no debt to match, it is a loan account of its own whose balance is asked.
    if (loanLine) {
      const ans = answers.loanLine, debts = accounts.filter(a => a.id.startsWith('mv:debt:') && !a.id.startsWith('mv:debt:plan.'));
      const fill = acc => Object.assign(acc, { minRule: { fixed: amt(loanLine.first, 'steps.bill:loan') }, steps: stepList(steps[loanLine.key], loanLine.first, openYm, D0, amt, 'steps.bill:loan') },
        loanLine.ends ? { ends: loanLine.ends } : {}, loanLine.redirect ? { redirect: loanLine.redirect } : {});
      if (ans !== undefined) {
        asks.push({ q: 'loanLine', answer: ans });
        const acc = accounts.find(a => a.id === 'mv:debt:' + ans);
        if (ans !== 'drop' && acc) { fill(acc); loanAcct = acc.id; }
      } else if (debts.length) { asks.push({ q: 'loanLine' }); loanPending = true; }
      else {
        const acc = fill({ id: 'mv:debt:plan.lines.loan', name: loanLine.l.name, type: 'loan', cur });
        Object.assign(acc, { payDay: null, payFrom: bank, confirm: true });
        accounts.push(acc); debtAccts.push(acc.id); asks.push({ q: 'loanBalance', acct: acc.id }); loanAcct = acc.id;
        terms(acc, amt(loanLine.first, 'steps.bill:loan'));
      }
    }
    // [Y2] steps a, b and side: three income streams into the main bank; only the salary starts periods. A month's
    // amount is `amounts` on that month's occurrence, once the day is answered.
    for (const k of PAY_KEYS) {
      const has = Array.isArray(steps[k]) || Object.keys(once).some(ym => isMap(once[ym]) && typeof once[ym][k] === 'number');
      if (!has) continue;
      if (zeroAll(0, steps[k], once, k)) { zero.push('steps.' + k); continue; }   // [Y25] 0 every month
      const inf = inForce(steps[k], openYm), rule = payRule(k);
      // [AB2, AC1] 38.31 pay is a monthly total: every moved stream is `per: 'month'`.
      const s = { id: 'mv:pay:steps.' + k, kind: 'income', name: PAY_NAME[k], cur, acct: bank, startsPeriod: k === 'a', per: 'month', steps: stepList(steps[k], inf === undefined ? 0 : inf, openYm, D0, amt, 'steps.' + k) };
      asks.push(Object.assign({ q: 'payDay', pay: k }, rule ? { answer: rule } : {}));
      if (rule) s.rules = [{ from: D0, rule }];
      for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][k] === 'number')
        pend.push({ field: 'once.' + ym + '.' + k, waits: s.id, to: 'amounts', ym, a: amt(once[ym][k], 'once.' + ym + '.' + k) });   // [AA5, AB2] spread over that month's pays
      schedules.push(s);
    }
    for (const k of Object.keys(SHARE_OF_KEY)) lineOfKey[k] = { place: SHARE_OF_KEY[k] };
    // [11.1, Y3, Y10] plan.shares: the share lines and each goal's set-aside, one entry from the opening, then one per later
    // month with a step (from its first day). A dated goal's set-aside (38.31's evenSave) counts from the move day: when
    // the opening is before the move day, an entry starts that day.
    // [AA11] a goal with no date and no monthly takes the figure 38.31 worked out for it.
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
    // steps and once keys with no target [MOVE_FIELDS: no target]
    const known = new Set(Object.keys(lineOfKey).concat(['bill:loan'], PAY_KEYS, (plan.lines || []).map(l => BUILTIN_KEY[(l || {}).id] || 'line:' + (l || {}).id),
      (plan.goals || []).map(g => 'goal:' + (g || {}).id), (plan.debts || []).map(d => 'debt:' + (d || {}).id)));
    for (const k of Object.keys(steps)) if (!known.has(k)) unplaced.push('steps.' + k);
    const onceDone = k => PAY_KEYS.includes(k) || (lineOfKey[k] && lineOfKey[k].line) || ((plan.lines || []).some(l => l && (BUILTIN_KEY[l.id] || 'line:' + l.id) === k && zero.includes('plan.lines.' + l.id)));
    // [AA6] the shares' and goals' one-month amounts are `once` on that period's plan.shares entry; the draw is a move out of
    // the Emergency fund's place in that period; a debt's is that month's payment occurrence `amounts`. Each waits [AA5].
    const fund = emergency ? goalPlace[emergency.id] : null;
    for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym])) for (const k of Object.keys(once[ym])) {
      if (onceDone(k)) continue;
      const field = 'once.' + ym + '.' + k, v = once[ym][k], base = typeof v === 'number' ? { field, ym, a: amt(v, field) } : null;
      if (base && SHARE_OF_KEY[k] && shares.length) pend.push(Object.assign({ waits: PAY_A, to: 'shares', share: SHARE_OF_KEY[k] }, base));
      else if (base && k.startsWith('goal:') && goalPlace[k.slice(5)] && shares.length) pend.push(Object.assign({ waits: PAY_A, to: 'shares', goal: goalPlace[k.slice(5)] }, base));
      else if (base && k === 'draw' && fund) pend.push(Object.assign({ waits: PAY_A, to: 'move', place: fund }, base));
      else if (base && k.startsWith('debt:') && debtAccts.includes('mv:debt:' + k.slice(5))) pend.push(Object.assign({ waits: 'mv:debt:' + k.slice(5), to: 'amounts' }, base));   // [AC5] the whole payment
      // [AC7] the loan line's one-month amount: that month's payment `amounts` on the loan the line is; while the loan
      // question is not answered it waits for it. Dropped, it has no target here (move.json mv-q51).
      else if (base && k === 'bill:loan' && (loanAcct || loanPending)) pend.push(Object.assign({ waits: loanAcct || 'loanLine', to: 'amounts' }, base));
      else unplaced.push(field);
    }
    // [11.1, H9, Y21, Y24] items[ym]: a once schedule on the month's first day; in the move month (the calendar month the
    // move runs in), a first day before the opening becomes the day after it. [AA2] The label is the schedule's name
    // ("One-time cost" when none), the note its note.
    for (const ym of Object.keys(items).sort()) for (const it of Array.isArray(items[ym]) ? items[ym] : []) if (isMap(it) && typeof it.amount === 'number') {
      let date = ym + '-01';
      if (ym === moveYm && dayNum(date) < dayNum(D0)) date = dayStr(dayNum(D0) + 1);
      const note = typeof it.note === 'string' && it.note.trim() ? it.note.trim() : null;
      schedules.push(Object.assign({ id: 'mv:item:' + ym + ':' + it.id, kind: 'once', name: (typeof it.label === 'string' && it.label) || 'One-time cost' }, note ? { note } : {}, { cur, acct: bank, rules: [{ from: date, rule: { every: 'once', date } }], steps: [{ from: date, amount: amt(it.amount, 'items.' + ym + '.' + it.id + '.amount') }] }));
    }
    // [11.1, H9] plan.recurring: autoSpend; a weekly one starts on the first `on` weekday on or after `from`. Its category
    // maps as a receipt's does (the spends it logs are receipts, Y20).
    for (const r of Array.isArray(plan.recurring) ? plan.recurring : []) if (r && typeof r.id === 'string') {
      let from = r.from, rule;
      if (r.every === 'week') { let n = dayNum(from); while (weekday(n) !== r.on) n++; from = dayStr(n); rule = { every: 'weeks', n: 1, from }; }
      else rule = { every: 'month', days: [r.on] };
      const s = Object.assign({ id: 'mv:auto:' + r.id, kind: 'autoSpend', name: r.n || '', cur, acct: bank }, catOf(r.c, lineOfKey), { from, rules: [{ from, rule }], steps: [{ from, amount: amt(r.a, 'plan.recurring.' + r.id + '.a') }] });
      if (isDay(r.last)) s.last = r.last;
      schedules.push(s);
    }
    // [Y8, AA3, AA4] ui.sweep after the opening: `pe:<the salary occurrence starting the period holding that month's last
    // day>:free`, dated the period's last day; 'bank' moves to Waiting, 'next' keeps (a move to the place itself), the
    // older `{ amt, id }` moves to goal `id` (to Waiting as "to place" when the plan has no such goal, AC8), 'hide' writes
    // nothing. Told at the answer's own time (`t`) when it has one, else at the copy's last save. It waits for the
    // salary's day [AA5], and [AB2] for a period not ended at the move it keeps waiting (that period's own question comes).
    if (isMap(ui.sweep)) for (const ym of Object.keys(ui.sweep).sort()) if (/^\d{4}-\d{2}$/.test(ym) && dayNum(lastDayOf(ym)) >= dayNum(D0)) {
      const v = ui.sweep[ym];
      if (!isMap(v) || v.hide === true) continue;
      const field = 'ui.sweep.' + ym;
      const older = v.to === undefined && typeof v.id === 'string';
      const to = v.to === 'bank' ? 'waiting' : v.to === 'next' ? 'free' : older ? goalPlace[v.id] || 'waiting' : undefined;
      if (!to || typeof v.amt !== 'number') { unplaced.push(field); continue; }   // an unknown shape
      // [AC8] a goal the plan no longer has: to Waiting, as "to place"
      const mv = Object.assign({ to, a: amt(v.amt, field + '.amt') }, older && !goalPlace[v.id] ? { toPlace: true } : {});
      pend.push({ field, waits: PAY_A, to: 'periodEnd', ym, place: 'free', moves: [mv], told: typeof v.t === 'number' ? isoAt(v.t, offset) : saved });
    }
  }
  if (sample) for (const k of Object.keys(SHARE_OF_KEY)) lineOfKey[k] = { place: SHARE_OF_KEY[k] };

  // ---- the bank opening [B6, B7, 11.1]: the oldest figure opens it; goal money kept in the bank is its split.
  if (bank) {
    const split = {};
    for (const g of plan.goals || []) if (!sample && g && goalPlace[g.id] && g.start > 0 && !ownAccount[g.id] && places.find(p => p.id === goalPlace[g.id]).kind !== 'payoff') split[goalPlace[g.id]] = amt(g.start, 'plan.goals.' + g.id + '.start');
    const f0 = figures[0];
    events.unshift(Object.assign({ id: 'mv:open:cfg', k: 'open', date: f0.date, acct: bank, a: f0.a }, Object.keys(split).length ? { split } : {}, { told: f0.told }),
      ...figures.map(f => ({ id: 'mv:check:cfg.' + f.key, k: 'check', date: f.date, acct: bank, a: f.a, told: f.told })));
  }
  // ---- receipts [11.1, 6.3, I5, J2, Y14, Y20]: every one in the raw text (no 5,000 cap), told at the start of their day.
  for (const r of Array.isArray(copy.receipts) ? copy.receipts : []) if (r && typeof r.id === 'string') {
    const acctS = typeof r.s === 'string' && acctByName[r.s];
    // [Y14] the note moves unchanged; [AA1] an `s` that names no account is added to it as "paid from: <s>"
    let n = typeof r.n === 'string' ? r.n : '';
    if (typeof r.s === 'string' && r.s && !acctS) n = n ? n + '; paid from: ' + r.s : 'paid from: ' + r.s;
    const note = n ? { note: n } : {};
    const base = { id: 'mv:rc:' + r.id, date: r.d, a: amt(r.a, 'receipts.' + r.id + '.a'), acct: acctS || bank };
    let e;
    if (r.c === 'bill:loan' && loanPending) {   // [AC2] a repay whose loan is not known yet waits for the loan question
      pend.push({ field: 'receipts.' + r.id, waits: 'loanLine', to: 'repay', event: Object.assign({ id: base.id, k: 'repay', date: r.d, a: base.a, acct: base.acct }, note, { src: { type: 'move', id: r.id }, told: startOf(r.d, offset) }) });
      for (const k of Object.keys(r)) if (!RC_KNOWN.includes(k)) unplaced.push('receipts.' + r.id + '.' + k);
      continue;
    }
    if (r.c === 'bill:loan' && loanAcct) e = Object.assign({ id: base.id, k: 'repay', date: r.d, a: base.a, acct: base.acct, acct2: loanAcct }, note);   // [Y20] a repay on the matched loan
    else if (r.c === 'bill:loan') e = Object.assign({ id: base.id, k: 'spend', date: r.d, a: base.a, acct: base.acct, place: 'bills', line: 'loan' }, { note: n ? n + ' ' + LOAN_GONE : LOAN_GONE });   // [AA7, AC6] no loan
    else e = Object.assign({ id: base.id, k: 'spend', date: r.d, a: base.a, acct: base.acct }, catOf(r.c, lineOfKey), note);
    events.push(Object.assign(e, { src: { type: 'move', id: r.id }, told: startOf(r.d, offset) }));
    for (const k of Object.keys(r)) if (!RC_KNOWN.includes(k)) unplaced.push('receipts.' + r.id + '.' + k);
  }
  // [Y9] every debt's payment day is asked (answered by the debt's 38.31 id, or the field path of a loan the move made)
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
    else if (!UI_USED.includes(k)) { shared[k] = ui[k]; unplaced.push('ui.' + k); }   // any field not listed: kept on the shared ui, listed
  }
  for (const k of Object.keys(cfg)) if (!CFG_USED.includes(k) && !CFG_OLD.includes(k)) unplaced.push('cfg.' + k);
  for (const k of Object.keys(copy)) if (!TOP_USED.includes(k)) unplaced.push('top.' + k);

  const out = { v: 3, home, people: typeof ui.name === 'string' && ui.name ? [{ id: 'mv:person:ui.name', name: ui.name }] : [],
    accounts, places, schedules, events,
    plan: { shares, budgets }, imports: isMap(ui.cats) ? { cats: ui.cats } : {}, ui: shared,
    device: { look, tour, opens: Array.isArray(ui.wk) ? ui.wk : [] },
    asks, unplaced: unplaced.sort(), zero: zero.sort(), rounded: rounded.sort(), sample, saved, frozen3831: raw };
  if (!sample && (typeof cfg.ceiling === 'number' || isMap(cfg.aims))) out.plan.limits = Object.assign({}, typeof cfg.ceiling === 'number' ? { ceiling: amt(cfg.ceiling, 'cfg.ceiling') } : {}, isMap(cfg.aims) ? { aims: cfg.aims } : {}, { cur });
  // [AA5, AB rows] what has its day is written now; the rest stays on the copy, each entry a record `mv:pend:<field path>`
  out.pendingMove = applyPending(out, pend.map(x => Object.assign({ id: 'mv:pend:' + x.field }, x)), moveDay);
  return out;
}

// [Y20] A receipt's (or a self-logged spend's) category: a budget line's key is that line; a share's key its place; a bill
// key the place bills with that bill's line; `other` Free to spend with line `other`. bill:loan is a repay (above).
function catOf(c, lineOfKey) {
  if (c === 'other') return { place: 'free', line: 'other' };
  if (typeof c === 'string' && /^bill:(rent|util|net|phone|ins|subs)$/.test(c)) return lineOfKey[c] ? Object.assign({}, lineOfKey[c]) : { place: 'bills' };
  return lineOfKey[c] ? Object.assign({}, lineOfKey[c]) : {};
}

const PAY_A = 'mv:pay:steps.a';
// [AC6] the words the move appends to a receipt on the loan line when there is no loan
const LOAN_GONE = '(moved: loan line removed)';
function ruleOf(out, id) {
  const s = (out.schedules || []).find(x => x.id === id);
  if (s) return s.rules && s.rules.length ? s.rules[s.rules.length - 1].rule : null;
  const a = (out.accounts || []).find(x => x.id === id);
  return a && a.payDay != null ? { every: 'month', days: [a.payDay] } : null;
}
// [AA5, AB rows] `pendingMove`: each entry is a record `mv:pend:<field path>` [Y28] naming the 38.31 field it came from,
// the schedule or account whose day it waits for (`waits`; `loanLine` for the loan question, AC2), and what it becomes
// (`to`). Entries whose day is known are written, in field order; the rest are returned. Everything written has a built
// id or lands on a keyed field, so a second device applying the same entry writes the same record [AB rows].
function applyPending(out, pend, moveDay) {
  const left = [], evs = [];
  for (const p of pend.slice().sort((x, y) => (x.field < y.field ? -1 : x.field > y.field ? 1 : 0))) {
    const rule = ruleOf(out, p.waits);
    if (!rule || !writePending(out, p, rule, evs, moveDay)) left.push(p);
  }
  if (evs.length) { const i = out.events.findIndex(e => /^mv:rc:/.test(e.id)); out.events.splice(i < 0 ? out.events.length : i, 0, ...evs); }
  return left;
}
function writePending(out, p, rule, evs, moveDay) {
  if (p.to === 'amounts') {
    const rec = out.schedules.find(s => s.id === p.waits) || out.accounts.find(a => a.id === p.waits);
    const dues = duesIn(rule, p.ym); if (!dues.length) return false;
    // [Y2, AB2] pay: the month's total, spread over that month's pays; [Y7] a bill's and [AC5, AC7] a debt's or the loan
    // line's: that month's (first) occurrence, whole.
    Object.assign(rec.amounts = rec.amounts || {}, rec.kind === 'income' ? spread(p.a, dues) : { [dues[0]]: p.a });
    return true;
  }
  if (p.to === 'periodEnd') {   // [Y8, AA4] the period holding that month's last day; [AB2] only once it has ended at the move
    const per = periodHolding(rule, lastDayOf(p.ym)); if (!per || dayNum(per.last) >= dayNum(moveDay)) return false;
    evs.push({ id: 'pe:' + p.waits + '@' + per.start + ':' + p.place, k: 'periodEnd', date: per.last, place: p.place, moves: p.moves, told: p.told, src: { type: 'move', id: p.field } }); return true;
  }
  const keys = onceSpreadOf(p.waits, rule, p.ym, p.a), list = Object.keys(keys); if (!list.length) return false;
  const dueOf = key => key.slice(key.lastIndexOf('@') + 1);
  if (p.to === 'once') { const b = out.plan.budgets.find(x => x.id === p.line); Object.assign(b.once = b.once || {}, keys); return true; }   // [AB2] spread
  if (p.to === 'shares') {   // [AA6, AB2] on the entry in force on each period's pay day, keyed by its occurrence
    for (const key of list) {
      let e = out.plan.shares[0];
      for (const x of out.plan.shares) if (dayNum(x.from) <= dayNum(dueOf(key))) e = x;
      const o = (e.once = e.once || {})[key] = (e.once || {})[key] || {};
      if (p.share) o[p.share] = keys[key]; else (o.goals = o.goals || {})[p.goal] = keys[key];
    }
    return true;
  }
  if (p.to === 'move') {   // [AA6, AC4] the draw: a move out of the fund's place (no place2: Waiting, where that period's plan
    // places it), dated the pay day of the first period starting that month; its built id `mv:draw:once.<ym>` [AB rows]
    evs.push({ id: 'mv:draw:once.' + p.ym, k: 'move', date: dueOf(list[0]), place: p.place, a: p.a, told: out.saved }); return true;
  }
  return false;
}
// A sorted-key text of a value, to see which records an answer changed.
function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const LISTS = [['people'], ['accounts'], ['places'], ['schedules'], ['events'], ['plan', 'shares'], ['plan', 'budgets']];
const listOf = (o, path) => path.reduce((x, k) => (x || {})[k], o) || [];
// [AA5, AC2, AB rows] The answers given after the move (`later`: pay, billDay by line id, debtDay by debt id, loanLine):
// the move with them, as if answered at the move (the move's own day still decides which periods had ended, AB2). Every
// record they changed carries the answer's `at` (`answeredAt`); a record they wrote from a waiting entry (a draw, a
// month-end answer, a receipt) is a moved record and carries the copy's last save like the rest [AB1], so a later real
// edit of it on another device still wins. Each `pendingMove` entry they wrote is kept, marked `gone` (the answer's day)
// with the answer's `at`, so a device still holding it takes the removal at the merge.
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
  const still = new Set(out.pendingMove.map(p => p.id));
  for (const p of before.pendingMove) if (!still.has(p.id)) out.pendingMove.push(Object.assign({}, p, { gone: at.slice(0, 10), at }, stampBy));
  out.pendingMove.sort((x, y) => (x.field < y.field ? -1 : x.field > y.field ? 1 : 0));
  return out;
}
// [AA4] Each pay's amount on a due day: `amounts` first, else the step in force; a stream kept as monthly totals gets
// monthly x 12 / the pays in that year, the leftover minor units on the year's earliest pays (units_ref periodPerPay).
function payAmounts(out, payAt) {
  const r = {};
  for (const id of Object.keys(payAt || {})) {
    const s = (out.schedules || []).find(x => x.id === id); if (!s) continue;
    r[id] = {};
    for (const due of payAt[id]) {
      let rule = null, step = null;
      for (const x of s.rules || []) if (x.from <= due) rule = x.rule;
      for (const x of s.steps || []) if (x.from <= due) step = x.amount;
      r[id][due] = s.amounts && s.amounts[due] != null ? s.amounts[due] : s.per === 'month' && rule ? periodPerPay({ rule, due, monthly: step }).amount : step;
    }
  }
  return r;
}

// A test helper only: `make.receipts` adds that many plain receipts to the copy, so a case can hold 5,002 receipts without listing them.
function madeCopy({ copy, make }) {
  const c = JSON.parse(JSON.stringify(copy));
  if (make && make.receipts) { const m = make.receipts; c.receipts = (c.receipts || []).concat(Array.from({ length: m.count }, (_, i) => ({ id: 'g' + (i + 1), d: m.d, a: m.a, c: m.c, cn: '', n: '' }))); }
  return c;
}

// [section 0, X1, AB1] the stamps a device writes: `told` (once; the events have their own), `at` and `by` on every record,
// `at` and `by` per shared ui key; the copy's `rev` is max(now, rev + 1) with no old rev (11.1). [AB1] A moved record
// carries the copy's last save as `at` (AA10), never the move moment, so any later real edit wins; a record an answer
// after the move changed keeps that answer's `at`. The raw 38.31 text is kept per device, as the record `mv:frozen:<by>`;
// `pendingMove` entries are records too [AB rows].
function stamp(m, now, by, saved) {
  const rec = r => Object.assign({ told: saved }, r, { at: r.at || saved, by: r.by || by });
  m.frozen = [{ id: 'mv:frozen:' + by, raw: m.frozen3831 }];
  for (const k of ['people', 'accounts', 'places', 'schedules', 'events', 'frozen', 'pendingMove']) m[k] = (m[k] || []).map(rec);
  m.plan.shares = m.plan.shares.map(rec); m.plan.budgets = m.plan.budgets.map(rec);
  if (m.plan.limits) Object.assign(m.plan.limits, { at: saved, by });
  Object.assign(m.home, { at: saved, by });
  m.ui.at = {}; m.ui.by = {}; for (const k of Object.keys(m.ui)) if (k !== 'at' && k !== 'by') { m.ui.at[k] = saved; m.ui.by[k] = by; }
  m.rev = Date.parse(now); m.at = now;
  return m;
}
// One device's move as it is stored: answered later when `later` is given; device-only parts dropped.
function stored(d) {
  const o = d.later ? moveAnswer(d) : move(d), m = stamp(o, d.now, d.by, o.saved);
  for (const k of ['device', 'asks', 'unplaced', 'zero', 'rounded', 'sample', 'saved', 'frozen3831']) delete m[k];
  return m;
}
// [AB1] A device that finds a moved copy in the cloud takes it and adds only the ids it lacks; it never overwrites.
function adopt(cloud, mine) {
  const out = JSON.parse(JSON.stringify(cloud));
  const add = (to, from) => { const have = new Set(to.map(r => r.id)); for (const r of from) if (!have.has(r.id)) to.push(r); to.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)); };
  for (const k of Object.keys(mine)) if (Array.isArray(mine[k])) add(out[k] = out[k] || [], mine[k]);
  for (const k of ['shares', 'budgets']) add(out.plan[k] = out.plan[k] || [], (mine.plan || {})[k] || []);
  return out;
}
// [X1, Y12, AB1] The move run on two devices, each on its own stored copy. With `cloud`, the desktop found the phone's
// moved copy in the cloud and takes it [AB1]; else both moved on their own and the copies meet in the merge
// (merge_ref.merge: per id the newest `at` wins, the earliest `told` is kept).
function moveTwo({ phone, desktop, cloud }) {
  const p = stored(phone), d = stored(desktop);
  return cloud ? adopt(p, d) : merge(p, d);
}
// [AB1] The phone moves and is used for a while (`edits`: records changed with their own `at`, `unset` for fields an
// edit takes away); then the desktop moves.
function moveLater({ phone, edits, desktop, cloud }) {
  const p = stored(phone);
  for (const e of edits || []) {
    const r = listOf(p, e.list.split('.')).find(x => x.id === e.id);
    for (const k of e.unset || []) delete r[k];   // an Undo of a removal: the record again, with a newer `at` [H6]
    Object.assign(r, e.set, { at: e.at, by: phone.by });
  }
  const d = stored(desktop);
  return cloud ? adopt(p, d) : merge(p, d);
}

function ids(out) {
  const all = [];
  for (const k of ['people', 'accounts', 'places', 'schedules', 'events']) for (const r of out[k] || []) all.push(r.id);
  for (const k of ['shares', 'budgets']) for (const r of (out.plan || {})[k] || []) all.push(r.id);
  return all.sort();
}
function view(out, { show, omit, payAt, pick }) {
  let o = out;
  if (show || pick) o = {};
  for (const k of show || []) if (k === 'tally') o.tally = tally(out); else if (k === 'ids') o.ids = ids(out); else if (k === 'frozenIds') o.frozenIds = (out.frozen || []).map(r => r.id).sort(); else if (k === 'pendingMoveIds') o.pendingMoveIds = (out.pendingMove || []).filter(r => !r.gone).map(r => r.id).sort();
    else if (k === 'payAmounts') o.payAmounts = payAmounts(out, payAt); else if (k.includes('.')) { const [a, b] = k.split('.'); o[k] = (out[a] || {})[b]; } else o[k] = out[k];
  // `pick`: [list, id, field] of single records, shown as "list id field"
  if (pick) { o.pick = {}; for (const [l, id, f] of pick) { const r = listOf(out, l.split('.')).find(x => x.id === id); o.pick[l + ' ' + id + ' ' + f] = r && r[f] !== undefined ? r[f] : null; } }
  if (omit) { const strip = x => Array.isArray(x) ? x.map(strip) : isMap(x) ? Object.fromEntries(Object.entries(x).filter(([k]) => !omit.includes(k)).map(([k, v]) => [k, strip(v)])) : x; o = strip(o); }
  return o;
}
function tally(out) { const sp = (out.events || []).filter(e => e.k === 'spend'); return { spends: sp.length, a: sp.reduce((t, e) => t + e.a, 0) }; }

function ask(question, input) {
  if (question === 'move') return view(move(input), input);
  if (question === 'move_two') return view(moveTwo(input), input);
  if (question === 'move_answer') return view(moveAnswer(input), input);
  if (question === 'move_later') return view(moveLater(input), input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, move, moveTwo, moveAnswer, moveLater, adopt, stamp, lastSave };
