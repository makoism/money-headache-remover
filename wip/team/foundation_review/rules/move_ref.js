// Moving a saved copy from an older build (SCHEMA_V3 11 and 11.1; DECISIONS_ROUND2 E1, E4, E6, H9, I5, J2, K3, O, O watch,
// X1, X9, X watch, Y1 to Y28, Z3, Z5, Z6).
// A plain reference for the engine lane, checked by run_rules.js against rules/move.json. The field list it follows is
// foundation_review/MOVE_FIELDS.md, which also names the `mv:` kinds. Where Y and Z leave a detail open, the reference
// does the least it can and move.json names the open question.
'use strict';
const { dayNum, dayStr, weekday } = require('./dates');
const { moveCurrency, toMinor, onceFromMonth } = require('./units_ref');
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
// [Y5] The older cfg figures: loanLast and redirectLoan go to the loan; each goal figure is used only when the plan has
// no goal with that id. Every one of them is decided, so none is listed.
const CFG_OLD = ['loanLast', 'redirectLoan', 'moveMonth', 'carDue', 'moveTarget', 'moveStart', 'travelTarget', 'travelStart', 'carTarget', 'carStart', 'rainyStart', 'rainyTarget', 'rainyStretch'];
const FIGURES_OF = { moving: ['moveTarget', 'moveStart', 'moveMonth'], travel: ['travelTarget', 'travelStart'], car: ['carTarget', 'carStart', 'carDue'], rainy: ['rainyStart', 'rainyTarget', 'rainyStretch'] };
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
// [Y13] The copy's last save: the IndexedDB second copy's `t`, else the stored `rev` when it is a time (38.31 saves
// max(now, rev + 1), a moment in ms; older builds a count), else the move's own time.
function lastSave({ idb, copy, now, offset }) {
  if (idb && idb.t != null) return typeof idb.t === 'number' ? isoAt(idb.t, offset) : idb.t;
  if (copy && typeof copy.rev === 'number' && copy.rev >= 1e12) return isoAt(copy.rev, offset);
  return now;
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
// The due day in a month of a rule the person answered. Only a monthly rule on one day is modelled; any other rule
// gives no single occurrence for a month (open question in move.json). A day past the month's end is its last day.
function dueIn(rule, ym) {
  if (!rule || rule.every !== 'month' || !Array.isArray(rule.days) || rule.days.length !== 1) return null;
  const last = Number(lastDayOf(ym).slice(8));
  return ym + '-' + String(Math.min(Number(rule.days[0]), last)).padStart(2, '0');
}
// [Y10] A dated goal's monthly set-aside as 38.31 works it out (model.js evenSave, goalDefault): what is still missing,
// spread evenly over the months from the plan's first month to its last saving month (the due month when the due day is
// after 38.31's PAYDAY, 15, else the month before), rounded up to 38.31's unit (100, 10 or 5 by the largest monthly pay).
const M_START = '2026-11', M_END = '2028-10', PAYDAY = 15;
const ymIdx = ym => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5)) - 1;
function evenSave(copy, g, ym) {
  const steps = isMap(copy.steps) ? copy.steps : {}, once = isMap(copy.once) ? copy.once : {}, cfg = isMap(copy.cfg) ? copy.cfg : {};
  const t = Math.max(0, (g.target || 0) - (g.start || 0)); if (t <= 0) return 0;
  const rb = Number(g.due.slice(8, 10)) > PAYDAY ? g.due.slice(0, 7) : ymAdd(g.due.slice(0, 7), -1);
  if (ym > rb) return 0;
  const pf = typeof cfg.planFrom === 'string' && cfg.planFrom >= M_START && cfg.planFrom <= M_END ? cfg.planFrom : M_START;
  if (ym < pf) return 0;
  const n = ymIdx(rb) - ymIdx(pf) + 1; if (n < 1) return 0;
  let pay = 0;
  for (let i = ymIdx(M_START); i <= ymIdx(M_END); i++) {
    const m = Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
    const val = k => (isMap(once[m]) && typeof once[m][k] === 'number' ? once[m][k] : inForce(steps[k], m) || 0);
    pay = Math.max(pay, val('a') + val('b') + val('side'));
  }
  const u = pay >= 20000 ? 100 : pay >= 5000 ? 10 : 5;
  return Math.ceil(t / n / u) * u;
}

function move(input) {
  const raw = typeof input.raw === 'string' ? input.raw : JSON.stringify(madeCopy(input));
  const copy = JSON.parse(raw);   // [O] the raw stored text, never a cleaned copy
  const ui = isMap(copy.ui) ? copy.ui : {}, cfg = isMap(copy.cfg) ? copy.cfg : {};
  const answers = input.answers || {};
  const now = input.now, offset = input.offset || now.slice(-6);
  const saved = lastSave({ idb: input.idb, copy, now, offset }), savedDay = saved.slice(0, 10);
  const moveDay = now.slice(0, 10), moveYm = moveDay.slice(0, 7);   // [Y21] the move month is the calendar month the move runs in
  const unplaced = [], asks = [], held = [], zero = [], rounded = [];
  // [O, H9] the currency first: asked before any amount is converted.
  const mc = moveCurrency({ ui });
  const cur = mc.ask ? answers.cur || null : mc.cur;
  if (!cur) return { v: 3, asks: [{ q: 'currency' }], waiting: 'currency', frozen3831: raw };
  if (mc.ask) asks.push({ q: 'currency', answer: cur });
  // [Y23] An amount with more decimals than its currency is rounded half up and flagged.
  const amt = (x, path) => { const r = toMinor(String(x), cur); if (r.rounded && path && !rounded.includes(path)) rounded.push(path); return r.minor; };
  const sample = sampleShown(Object.assign({ preset: 'legacy' }, ui));
  const hasPlan = isMap(copy.plan) && Array.isArray(copy.plan.lines) && Array.isArray(copy.plan.goals);
  let plan = hasPlan ? copy.plan : basePlan(cfg);
  if (hasPlan) {   // [Y5] an older goal figure is used only for a sample goal the plan does not have
    const have = new Set(plan.goals.map(g => (g || {}).id));
    const extra = GOAL_DEFS().filter(g => !have.has(g.id) && FIGURES_OF[g.id].some(k => cfg[k] !== undefined)).map(g => withFigures(g, cfg));
    if (extra.length) plan = Object.assign({}, plan, { goals: plan.goals.concat(extra) });
  }
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
  let loanAcct = null, loanPending = false, mainRule = null;
  const pending = [];   // events written after the accounts' openings and before the receipts (period-end answers)
  if (!sample) {
    const gk = isMap(ui.gk) ? ui.gk : {};
    const emergency = (plan.goals || []).find(g => g && g.emergency);
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
    // [Y2] the main pay stream's answered rule names the periods (budget `once`, period-end answers).
    const payRule = k => (answers.pay || {})[k];
    const hasA = (Array.isArray(steps.a) || Object.keys(once).some(ym => isMap(once[ym]) && typeof once[ym].a === 'number')) && !zeroAll(0, steps.a, once, 'a');
    mainRule = hasA ? payRule('a') || null : null;
    const occOf = due => 'mv:pay:steps.a@' + due;
    // [11.1, T1, units-78, Z5] a one-month amount of a budget line is keyed by the first period starting in that month,
    // else the period holding that month's first day.
    const onceKey = ym => {
      if (!dueIn(mainRule, ym)) return null;
      const pays = [-1, 0, 1].map(n => dueIn(mainRule, ymAdd(ym, n))).map(d => ({ occ: occOf(d), lands: d }));
      return onceFromMonth({ ym, pays });
    };
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
        for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number') {
          const due = dueIn(rule, ym);
          if (due) (s.amounts = s.amounts || {})[due] = amt(once[ym][key], 'once.' + ym + '.' + key); else held.push('once.' + ym + '.' + key);
        }
        schedules.push(s);
        lineOfKey[key] = { place: 'bills', line: id };
      } else {
        const id = 'mv:line:' + l.id, o = {};
        for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number') {
          const k = onceKey(ym);
          if (k) o[k] = amt(once[ym][key], 'once.' + ym + '.' + key); else held.push('once.' + ym + '.' + key);
        }
        budgets.push(Object.assign({ id, name: l.name, place: JAR_PLACE[l.jar] || 'bills', cur, per: 'month', steps: st }, Object.keys(o).length ? { once: o } : {}, extra));
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
      }
    }
    // [Y2] steps a, b and side: three income streams into the main bank; only the salary starts periods. A month's
    // amount is `amounts` on that month's occurrence, once the day is answered.
    for (const k of PAY_KEYS) {
      const has = Array.isArray(steps[k]) || Object.keys(once).some(ym => isMap(once[ym]) && typeof once[ym][k] === 'number');
      if (!has) continue;
      if (zeroAll(0, steps[k], once, k)) { zero.push('steps.' + k); continue; }   // [Y25] 0 every month
      const inf = inForce(steps[k], openYm), rule = payRule(k);
      const s = { id: 'mv:pay:steps.' + k, kind: 'income', name: PAY_NAME[k], cur, acct: bank, startsPeriod: k === 'a', steps: stepList(steps[k], inf === undefined ? 0 : inf, openYm, D0, amt, 'steps.' + k) };
      asks.push(Object.assign({ q: 'payDay', pay: k }, rule ? { answer: rule } : {}));
      if (rule) s.rules = [{ from: D0, rule }];
      for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][k] === 'number') {
        const due = dueIn(rule, ym);
        if (due) (s.amounts = s.amounts || {})[due] = amt(once[ym][k], 'once.' + ym + '.' + k); else held.push('once.' + ym + '.' + k);
      }
      schedules.push(s);
    }
    for (const k of Object.keys(SHARE_OF_KEY)) lineOfKey[k] = { place: SHARE_OF_KEY[k] };
    // [11.1, Y3, Y10] plan.shares: the share lines and each goal's set-aside, one entry from the opening, then one per later
    // month with a step (from its first day). A dated goal's set-aside (38.31's evenSave) counts from the move day: when
    // the opening is before the move day, an entry starts that day.
    const goalKeys = (plan.goals || []).filter(g => g && goalPlace[g.id] && (steps['goal:' + g.id] || (!g.due && typeof g.monthly === 'number') || (isDay(g.due) && evenSave(copy, g, moveYm) > 0)));
    const valAt = (key, ym, dflt) => { const v = inForce(steps[key], ym); return v === undefined ? dflt : v; };
    const entry = (ym, from, idPart, dated) => {
      const e = { id: 'mv:share:' + idPart, from, cur };
      for (const s of shareLines) { e[s.field] = amt(valAt(s.key, ym, s.def), 'steps.' + s.key); (e.per = e.per || {})[s.field] = 'month'; }
      const gs = {};
      for (const g of goalKeys) {
        const dflt = isDay(g.due) ? (dated ? evenSave(copy, g, moveYm) : undefined) : g.monthly;
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
    for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym])) for (const k of Object.keys(once[ym])) if (!onceDone(k)) unplaced.push('once.' + ym + '.' + k);
    // [11.1, H9, Y21, Y24] items[ym]: a once schedule on the month's first day; in the move month (the calendar month the
    // move runs in), a first day before the opening becomes the day after it. A note becomes the schedule's name.
    for (const ym of Object.keys(items).sort()) for (const it of Array.isArray(items[ym]) ? items[ym] : []) if (isMap(it) && typeof it.amount === 'number') {
      let date = ym + '-01';
      if (ym === moveYm && dayNum(date) < dayNum(D0)) date = dayStr(dayNum(D0) + 1);
      const note = typeof it.note === 'string' && it.note.trim() ? it.note.trim() : null;
      if (note && typeof it.label === 'string' && it.label) unplaced.push('items.' + ym + '.' + it.id + '.label');
      schedules.push({ id: 'mv:item:' + ym + ':' + it.id, kind: 'once', name: note || it.label || 'One-time cost', cur, acct: bank, rules: [{ from: date, rule: { every: 'once', date } }], steps: [{ from: date, amount: amt(it.amount, 'items.' + ym + '.' + it.id + '.amount') }] });
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
    // [Y8] ui.sweep after the opening: `pe:<the occurrence of the period starting in that month>:free`, dated the period's
    // last day; 'bank' moves to Waiting, 'next' keeps (a move to the place itself), 'hide' writes nothing. Told at the
    // answer's own time (`t`) when it has one, else at the copy's last save.
    if (isMap(ui.sweep)) for (const ym of Object.keys(ui.sweep).sort()) if (/^\d{4}-\d{2}$/.test(ym) && dayNum(lastDayOf(ym)) >= dayNum(D0)) {
      const v = ui.sweep[ym];
      if (!isMap(v) || v.hide === true) continue;
      if (!(v.to === 'bank' || v.to === 'next') || typeof v.amt !== 'number') { unplaced.push('ui.sweep.' + ym); continue; }   // the older { amt, id }: open
      const due = dueIn(mainRule, ym), next = dueIn(mainRule, ymAdd(ym, 1));
      if (!due) { held.push('ui.sweep.' + ym); continue; }
      pending.push({ id: 'pe:' + occOf(due) + ':free', k: 'periodEnd', date: dayStr(dayNum(next) - 1), place: 'free',
        moves: [{ to: v.to === 'bank' ? 'waiting' : 'free', a: amt(v.amt, 'ui.sweep.' + ym + '.amt') }], told: typeof v.t === 'number' ? isoAt(v.t, offset) : saved });
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
  events.push(...pending);
  // ---- receipts [11.1, 6.3, I5, J2, Y14, Y20]: every one in the raw text (no 5,000 cap), told at the start of their day.
  for (const r of Array.isArray(copy.receipts) ? copy.receipts : []) if (r && typeof r.id === 'string') {
    const acctS = typeof r.s === 'string' && acctByName[r.s];
    if (typeof r.s === 'string' && r.s && !acctS) unplaced.push('receipts.' + r.id + '.s');   // names no account: open
    const note = typeof r.n === 'string' && r.n ? { note: r.n } : {};   // [Y14] the note moves unchanged
    const base = { id: 'mv:rc:' + r.id, date: r.d, a: amt(r.a, 'receipts.' + r.id + '.a'), acct: acctS || bank };
    let e;
    if (r.c === 'bill:loan' && (loanAcct || loanPending)) {   // [Y20] a repay on the matched loan
      e = Object.assign({ id: base.id, k: 'repay', date: r.d, a: base.a, acct: base.acct, acct2: loanAcct }, note);
      if (!loanAcct) held.push('receipts.' + r.id);
    } else e = Object.assign({ id: base.id, k: 'spend', date: r.d, a: base.a, acct: base.acct }, catOf(r.c, lineOfKey), note);
    events.push(Object.assign(e, { src: { type: 'move', id: r.id }, told: startOf(r.d, offset) }));
    for (const k of Object.keys(r)) if (!RC_KNOWN.includes(k)) unplaced.push('receipts.' + r.id + '.' + k);
  }
  // [Y9] every debt's payment day is asked
  for (const id of debtAccts) asks.push({ q: 'debtDay', acct: id });

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
    asks, unplaced: unplaced.sort(), held: held.sort(), zero: zero.sort(), rounded: rounded.sort(), sample, saved, frozen3831: raw };
  if (!sample && (typeof cfg.ceiling === 'number' || isMap(cfg.aims))) out.plan.limits = Object.assign({}, typeof cfg.ceiling === 'number' ? { ceiling: amt(cfg.ceiling, 'cfg.ceiling') } : {}, isMap(cfg.aims) ? { aims: cfg.aims } : {}, { cur });
  return out;
}

// [Y20] A receipt's (or a self-logged spend's) category: a budget line's key is that line; a share's key its place; a bill
// key the place bills with that bill's line; `other` Free to spend with line `other`. bill:loan is a repay (above).
function catOf(c, lineOfKey) {
  if (c === 'other') return { place: 'free', line: 'other' };
  if (typeof c === 'string' && /^bill:(rent|util|net|phone|ins|subs)$/.test(c)) return lineOfKey[c] ? Object.assign({}, lineOfKey[c]) : { place: 'bills' };
  return lineOfKey[c] ? Object.assign({}, lineOfKey[c]) : {};
}

// A test helper only: `make.receipts` adds that many plain receipts to the copy, so a case can hold 5,002 receipts without listing them.
function madeCopy({ copy, make }) {
  const c = JSON.parse(JSON.stringify(copy));
  if (make && make.receipts) { const m = make.receipts; c.receipts = (c.receipts || []).concat(Array.from({ length: m.count }, (_, i) => ({ id: 'g' + (i + 1), d: m.d, a: m.a, c: m.c, cn: '', n: '' }))); }
  return c;
}

// [section 0, X1] the stamps a device writes: `told` (once; the events have their own), `at` and `by` on every record, `at`
// and `by` per shared ui key; the copy's `rev` is max(now, rev + 1) with no old rev (11.1).
function stamp(m, now, by, saved) {
  const rec = r => Object.assign({ told: saved }, r, { at: now, by });
  for (const k of ['people', 'accounts', 'places', 'schedules', 'events']) m[k] = (m[k] || []).map(rec);
  m.plan.shares = m.plan.shares.map(rec); m.plan.budgets = m.plan.budgets.map(rec);
  if (m.plan.limits) Object.assign(m.plan.limits, { at: now, by });
  Object.assign(m.home, { at: now, by });
  m.ui.at = {}; m.ui.by = {}; for (const k of Object.keys(m.ui)) if (k !== 'at' && k !== 'by') { m.ui.at[k] = now; m.ui.by[k] = by; }
  m.rev = Date.parse(now); m.at = now;
  return m;
}

// [X1, Y12] The move run on two devices, each on its own stored copy: built `mv:` ids make one record of each after the
// merge (merge_ref.merge: per id the newest `at` wins, the earliest `told` is kept). Device-only parts are not merged.
function moveTwo({ phone, desktop }) {
  const one = d => { const o = move(d); const m = stamp(o, d.now, d.by, o.saved); for (const k of ['device', 'asks', 'unplaced', 'held', 'zero', 'rounded', 'sample', 'saved', 'frozen3831']) delete m[k]; return m; };
  return merge(one(phone), one(desktop));
}

function ids(out) {
  const all = [];
  for (const k of ['people', 'accounts', 'places', 'schedules', 'events']) for (const r of out[k] || []) all.push(r.id);
  for (const k of ['shares', 'budgets']) for (const r of (out.plan || {})[k] || []) all.push(r.id);
  return all.sort();
}
function view(out, { show, omit }) {
  let o = out;
  if (show) { o = {}; for (const k of show) if (k === 'tally') o.tally = tally(out); else if (k === 'ids') o.ids = ids(out); else if (k.includes('.')) { const [a, b] = k.split('.'); o[k] = (out[a] || {})[b]; } else o[k] = out[k]; }
  if (omit) { const strip = x => Array.isArray(x) ? x.map(strip) : isMap(x) ? Object.fromEntries(Object.entries(x).filter(([k]) => !omit.includes(k)).map(([k, v]) => [k, strip(v)])) : x; o = strip(o); }
  return o;
}
function tally(out) { const sp = (out.events || []).filter(e => e.k === 'spend'); return { spends: sp.length, a: sp.reduce((t, e) => t + e.a, 0) }; }

function ask(question, input) {
  if (question === 'move') return view(move(input), input);
  if (question === 'move_two') return view(moveTwo(input), input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, move, moveTwo, lastSave };
