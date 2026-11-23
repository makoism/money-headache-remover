// Moving a saved copy from an older build (SCHEMA_V3 11 and 11.1; DECISIONS_ROUND2 E1, E4, E6, H9, I5, J2, K3, O, O watch, X1, X9, X watch).
// A plain reference for the engine lane, checked by run_rules.js against rules/move.json. The field list it follows is
// foundation_review/MOVE_FIELDS.md. Where the decisions leave a detail open, the reference does the plainest thing and
// move.json names the open question (no case depends on one; cases leave such a field out with `omit`).
'use strict';
const { dayNum, dayStr, weekday } = require('./dates');
const { moveCurrency, toMinor } = require('./units_ref');
const { merge } = require('./merge_ref');

// 38.31 plan.lines ids: the bills [11.1], the loan line [E6], the four lines that are plan.shares, and the jar of each
// budget line [11.1, B8]. Every other line (food, gas, card, custom) is a budget line.
const BILL_IDS = ['rent', 'util', 'net', 'phone', 'ins', 'subs'];
const SHARE_OF_LINE = { spend: 'free', learn: 'edu', invest: 'ffa', give: 'give' };
const SHARE_OF_KEY = { envelope: 'free', education: 'edu', invest: 'ffa', give: 'give' };
const JAR_PLACE = { nec: 'bills', play: 'free', edu: 'edu', give: 'give', ffa: 'ffa' };
const PAY_KEYS = ['a', 'b', 'side'];
// The built-in keys of every build (LINE_DEFS): a line with a built-in id uses its built-in key, any other `line:<id>`.
const BUILTIN_KEY = { rent: 'bill:rent', util: 'bill:util', food: 'bill:food', net: 'bill:net', phone: 'bill:phone', ins: 'bill:ins', subs: 'bill:subs',
  gas: 'bill:gas', loan: 'bill:loan', card: 'card', spend: 'envelope', learn: 'education', invest: 'invest', give: 'give' };
// [11.1] where each ui key goes. Shared screen answers follow the person; look, sound and tour stay on the device [D3].
const UI_SHARED = ['main', 'loans', 'subP', 'subO', 'subs', 'cardT', 'cardB', 'limits', 'noDebts', 'askNums', 'win', 'done', 'sb', 'bd', 'more', 'setup', 'cleared', 'src', 'full', 'home', 'mcOk'];
const UI_LOOK = ['mute', 'music', 'vol', 'dj', 'scene', 'seen', 'ms', 'mcSeen', 'vaultSeen', 'imp', 'bk', 'bkLater', 'sampleHidden', 'exactHidden', 'remindHidden', 'moreBillsHidden', 'rcCat', 'rcFreq', 'rcDom', 'rcDay', 'rcTime', 'gset', 'movedIn', 'noMove'];
const UI_TOUR = ['tourAt', 'toured', 'onb'];
const UI_USED = ['cur', 'preset', 'name', 'gk', 'accts', 'cats', 'wk', 'sweep', 'keep', 'keeps', 'preSplit', 'minAuto'];
const CFG_USED = ['bankStart', 'bankAt', 'bankNow', 'bankNowAt', 'minBank', 'ceiling', 'aims', 'planFrom'];
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
function basePlan(c) {
  const lines = LINE_DEFS.map(l => Object.assign({}, l)), goals = GOAL_DEFS(), g = id => goals.find(x => x.id === id);
  const loan = lines.find(l => l.id === 'loan');
  if (/^\d{4}-\d{2}$/.test(c.loanLast || '')) loan.ends = c.loanLast;
  if (typeof c.redirectLoan === 'boolean') loan.redirect = c.redirectLoan;
  const set = (id, k, v) => { if (typeof v === 'number' && v >= 0) g(id)[k] = v; };
  set('moving', 'target', c.moveTarget); set('moving', 'start', c.moveStart); set('travel', 'target', c.travelTarget); set('travel', 'start', c.travelStart);
  set('car', 'target', c.carTarget); set('car', 'start', c.carStart); set('rainy', 'start', c.rainyStart); set('rainy', 'target', c.rainyTarget); set('rainy', 'stretch', c.rainyStretch);
  if (/^\d{4}-\d{2}$/.test(c.moveMonth || '')) g('moving').due = c.moveMonth + '-01';
  if (/^\d{4}-\d{2}-\d{2}$/.test(c.carDue || '')) g('car').due = c.carDue;
  return { lines, goals };
}

const isMap = o => !!o && typeof o === 'object' && !Array.isArray(o);
const isDay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const lastDayOf = ym => dayStr(dayNum((Number(ym.slice(5)) === 12 ? (Number(ym.slice(0, 4)) + 1) + '-01' : ym.slice(0, 5) + String(Number(ym.slice(5)) + 1).padStart(2, '0')) + '-01') - 1);
// [X9] the start of a day is in the offset of the device that writes the record.
const startOf = (day, offset) => day + 'T00:00:00.000' + offset;
// [sample] every build's rule (sampleOn): the sample shows until pay, bills and goals are done, unless the copy was cleared or is blank.
function sampleShown(ui) { const d = ui.done || {}, zero = ui.preset === 'blank' || !!ui.cleared; return !zero && !(d.pay && d.bills && d.goals); }
// 38.31's amount for a key in a month (model.js val, steps part): the latest step from that month or before, else none.
function inForce(steps, ym) { let best = null; for (const s of steps || []) if (s && s.from <= ym && (!best || s.from > best.from)) best = s; return best ? best.v : undefined; }
// [11.1] steps after the opening month become entries "from that month's first pay", written `firstPay:<ym>` until the pay
// schedule is answered (open question mv-q3). The amount in force in the opening month is the first entry, from the opening.
function stepList(steps, first, openYm, D0, amt) {
  const out = [{ from: D0, amount: amt(first) }];
  for (const s of (steps || []).slice().sort((a, b) => (a.from < b.from ? -1 : 1))) if (s.from > openYm) out.push({ from: 'firstPay:' + s.from, amount: amt(s.v) });
  return out;
}

function move(input) {
  const raw = typeof input.raw === 'string' ? input.raw : JSON.stringify(madeCopy(input));
  const copy = JSON.parse(raw);   // [O] the raw stored text, never a cleaned copy
  const ui = isMap(copy.ui) ? copy.ui : {}, cfg = isMap(copy.cfg) ? copy.cfg : {};
  const saved = input.saved, offset = input.offset || saved.slice(-6), savedDay = saved.slice(0, 10);
  const unplaced = [], asks = [];
  // [O, H9] the currency first: asked before any amount is converted.
  const mc = moveCurrency({ ui });
  const cur = mc.ask ? (input.answers || {}).cur || null : mc.cur;
  if (!cur) return { v: 3, asks: [{ q: 'currency' }], waiting: 'currency', frozen3831: raw };
  if (mc.ask) asks.push({ q: 'currency', answer: cur });
  const amt = x => toMinor(String(x), cur).minor;
  const sample = sampleShown(Object.assign({ preset: 'legacy' }, ui));
  const hasPlan = isMap(copy.plan) && Array.isArray(copy.plan.lines) && Array.isArray(copy.plan.goals);
  const plan = hasPlan ? copy.plan : basePlan(cfg);
  const steps = isMap(copy.steps) ? copy.steps : {}, once = isMap(copy.once) ? copy.once : {}, items = isMap(copy.items) ? copy.items : {};

  // ---- the bank figures [11.1, H9, J2, K3]: each a dated check; the oldest opens the bank. bankAt and bankNowAt are days
  // with no time: told at the start of that day (open question mv-q1); with no day, dated to the last saved day and told at the save.
  const figures = [];
  for (const [k, at] of [['bankStart', 'bankAt'], ['bankNow', 'bankNowAt']]) if (typeof cfg[k] === 'number') {
    const day = isDay(cfg[at]) ? cfg[at] : savedDay;
    figures.push({ key: k, a: amt(cfg[k]), date: day, told: isDay(cfg[at]) ? startOf(day, offset) : saved });
  }
  figures.sort((x, y) => dayNum(x.date) - dayNum(y.date));
  const D0 = figures.length ? figures[0].date : savedDay, openYm = D0.slice(0, 7);
  const bank = figures.length ? 'mv:acct:cfg' : null;
  const home = { curs: [{ from: D0, cur }], minBank: null, mainBank: bank };
  // [11.1, MAKO M1] the minimum only when typed: one the app filled in itself (ui.minAuto) is dropped.
  if (!sample && typeof cfg.minBank === 'number' && !(ui.minAuto !== undefined && cfg.minBank === ui.minAuto)) home.minBank = { a: amt(cfg.minBank), cur };

  const accounts = [], events = [], places = [], schedules = [], budgets = [], shares = [];
  if (bank) accounts.push({ id: bank, name: 'Bank', type: 'bank', cur, confirm: true });
  // [11.1] ui.accts: accounts by name and type (a statement import's `bank`, `card`, `wallet`).
  const acctByName = {};
  for (const a of Array.isArray(ui.accts) ? ui.accts : []) if (a && typeof a.name === 'string') {
    const id = 'mv:acct:' + a.id;
    accounts.push({ id, name: a.name, type: a.kind === 'wallet' ? 'ewallet' : a.kind === 'card' ? 'card' : 'bank', cur, confirm: true });
    acctByName[a.name] = id;
  }
  // [11.1] cards[]: pay-in-full cards, opened with a check of `owed` dated `at`.
  for (const c of Array.isArray(copy.cards) ? copy.cards : []) if (c && typeof c.id === 'string') {
    const id = 'mv:card:' + c.id, day = isDay(c.at) ? c.at : savedDay, told = isDay(c.at) ? startOf(day, offset) : saved;
    accounts.push({ id, name: c.name, type: 'card', cur, payDay: c.payDay == null ? null : c.payDay, cutDay: null, inFull: true, payFrom: bank, confirm: true });
    acctByName[c.name] = id;
    const owed = amt(typeof c.owed === 'number' ? c.owed : 0);
    events.push({ id: 'mv:open:card:' + c.id, k: 'open', date: day, acct: id, a: owed, told }, { id: 'mv:check:card:' + c.id, k: 'check', date: day, acct: id, a: owed, told });
  }

  // ---- the plan, unless the sample is still shown (never moved as real, requirements 1c)
  const goalPlace = {}, lineOfKey = {};
  if (!sample) {
    const gk = isMap(ui.gk) ? ui.gk : {};
    const emergency = (plan.goals || []).find(g => g && g.emergency);
    // [11.1] plan.debts: a loan or card account opened at `balance`; `debt:<id>` steps become its extraSteps.
    for (const d of Array.isArray(plan.debts) ? plan.debts : []) if (d && typeof d.id === 'string') {
      const id = 'mv:debt:' + d.id, key = 'debt:' + d.id, ex = inForce(steps[key], openYm);
      const rec = { id, name: d.name, type: d.kind === 'card' ? 'card' : 'loan', cur, apr: d.apr || 0, minRule: { fixed: amt(d.min || 0) },
        extraSteps: stepList(steps[key], ex === undefined ? d.extra || 0 : ex, openYm, D0, amt), payDay: null, payFrom: bank, confirm: true };
      if (d.kind === 'card') Object.assign(rec, { inFull: false, cutDay: null });
      accounts.push(rec);
      events.push({ id: 'mv:open:debt:' + d.id, k: 'open', date: D0, acct: id, a: amt(d.balance || 0), told: saved },
        { id: 'mv:check:debt:' + d.id, k: 'check', date: D0, acct: id, a: amt(d.balance || 0), told: saved });
    }
    // [11.1] plan.goals: places; ui.gk gives the kind; `start` is part of the bank's opening split, and the move asks where it is [X watch].
    for (const g of plan.goals || []) if (g && typeof g.id === 'string') {
      const id = 'mv:place:' + g.id, kind = g.emergency ? 'emergency' : gk[g.id] === 'debt' ? 'payoff' : 'goal';
      const p = { id, name: g.name, kind, target: amt(g.target || 0), due: isDay(g.due) ? g.due : null, cur, slot: g.slot };
      if (kind === 'payoff') p.pays = null;   // which account it pays: open question mv-q11
      else p.keptIn = { acct: bank, mode: 'inBank' };
      if (g.emergency) { p.emergency = true; p.stretch = amt(g.stretch || 0); if (typeof g.stretchOn === 'boolean') p.stretchOn = g.stretchOn; if (typeof g.stretchFrom === 'string') p.stretchFrom = g.stretchFrom; }
      if (typeof g.why === 'string' && g.why) p.why = g.why;
      for (const k of Object.keys(g)) if (!GOAL_KNOWN.includes(k) && ['string', 'number', 'boolean'].includes(typeof g[k])) p[k] = g[k];   // unknown plain fields kept
      places.push(p); goalPlace[g.id] = id;
      if (kind !== 'payoff' && g.start > 0) asks.push({ q: 'goalMoney', place: id });
    }
    // [11.1] plan.lines
    let loanLine = null;
    const shareLines = [];   // [ { key, field, def } ] the four share lines present
    for (const l of plan.lines || []) if (l && typeof l.id === 'string') {
      const key = BUILTIN_KEY[l.id] || 'line:' + l.id, inf = inForce(steps[key], openYm), first = inf === undefined ? l.def || 0 : inf;
      const ends = typeof l.ends === 'string' && /^\d{4}-\d{2}$/.test(l.ends) ? lastDayOf(l.ends) : null;
      const redirect = ends && l.redirect ? (emergency ? goalPlace[emergency.id] : null) : null;
      if (l.id === 'loan') { loanLine = { l, key, first, ends }; continue; }
      if (SHARE_OF_LINE[l.id]) { shareLines.push({ key, field: SHARE_OF_LINE[l.id], def: l.def || 0 }); continue; }   // the four shares, below
      const extra = Object.assign({}, ends ? { ends } : {}, redirect ? { redirect } : {});
      if (BILL_IDS.includes(l.id)) {
        const id = 'mv:bill:' + l.id;
        schedules.push(Object.assign({ id, kind: 'bill', name: l.name, cur, acct: bank, place: 'bills', steps: stepList(steps[key], first, openYm, D0, amt) }, extra));
        asks.push({ q: 'billDay', bill: id });   // [11.1] until answered, due on the period's first day
        lineOfKey[key] = { place: 'bills' };
      } else {
        const id = 'mv:line:' + l.id, o = {};
        for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym]) && typeof once[ym][key] === 'number') o['firstPay:' + ym] = amt(once[ym][key]);
        budgets.push(Object.assign({ id, name: l.name, place: JAR_PLACE[l.jar] || 'bills', cur, per: 'month', steps: stepList(steps[key], first, openYm, D0, amt) }, Object.keys(o).length ? { once: o } : {}, extra));
        lineOfKey[key] = { line: id };
      }
    }
    for (const k of Object.keys(SHARE_OF_KEY)) lineOfKey[k] = { place: SHARE_OF_KEY[k] };
    // [E6] the "Loan or debt payment" line is matched to a loan account, or dropped with the person's OK; never both.
    if (loanLine) {
      const ans = (input.answers || {}).loanLine;
      if (!ans) asks.push({ q: 'loanLine' });
      else if (ans !== 'drop') {
        const acc = accounts.find(a => a.id === 'mv:debt:' + ans);
        if (acc) { acc.amount = amt(loanLine.first); if (loanLine.ends) acc.ends = loanLine.ends; if (steps[loanLine.key]) unplaced.push('steps.' + loanLine.key); }
      }
    }
    // [11.1] plan.shares: the four share lines and each goal's monthly set-aside, one entry from the opening, then one per later month with a step.
    const goalKeys = (plan.goals || []).filter(g => g && goalPlace[g.id] && (steps['goal:' + g.id] || (!g.due && typeof g.monthly === 'number')));
    const valAt = (key, ym, dflt) => { const v = inForce(steps[key], ym); return v === undefined ? dflt : v; };
    const entry = (ym, from, idPart) => {
      const e = { id: 'mv:share:' + idPart, from, cur };
      for (const s of shareLines) { e[s.field] = amt(valAt(s.key, ym, s.def)); (e.per = e.per || {})[s.field] = 'month'; }
      const gs = {}; for (const g of goalKeys) { const v = valAt('goal:' + g.id, ym, g.due ? undefined : g.monthly); if (v !== undefined) gs[goalPlace[g.id]] = amt(v); }
      if (Object.keys(gs).length) e.goals = gs;
      return e;
    };
    if (shareLines.length || goalKeys.length) {
      shares.push(entry(openYm, D0, 'first'));
      const later = new Set();
      for (const k of shareLines.map(x => x.key).concat(goalKeys.map(g => 'goal:' + g.id))) for (const s of steps[k] || []) if (s.from > openYm) later.add(s.from);
      for (const ym of [...later].sort()) shares.push(entry(ym, 'firstPay:' + ym, ym));
    }
    // steps and once keys with no target [MOVE_FIELDS: no target]
    const known = new Set(Object.keys(lineOfKey).concat(['bill:loan'], (plan.goals || []).map(g => 'goal:' + (g || {}).id), (plan.debts || []).map(d => 'debt:' + (d || {}).id)));
    for (const k of Object.keys(steps)) {
      if (PAY_KEYS.includes(k)) { unplaced.push('steps.' + k); if ((steps[k] || []).some(s => s && s.v > 0)) asks.push({ q: 'payDay', pay: k }); }
      else if (!known.has(k)) unplaced.push('steps.' + k);
    }
    for (const ym of Object.keys(once).sort()) if (ym >= openYm && isMap(once[ym])) for (const k of Object.keys(once[ym])) if (!(lineOfKey[k] && lineOfKey[k].line)) unplaced.push('once.' + ym + '.' + k);
    // [11.1, H9] items[ym]: a once schedule on the month's first day; in the opening month, a first day before the opening becomes the day after it.
    for (const ym of Object.keys(items).sort()) for (const it of Array.isArray(items[ym]) ? items[ym] : []) if (isMap(it) && typeof it.amount === 'number') {
      let date = ym + '-01';
      if (ym === openYm && dayNum(date) < dayNum(D0)) date = dayStr(dayNum(D0) + 1);
      const s = { id: 'mv:item:' + ym + ':' + it.id, kind: 'once', name: it.label || 'One-time cost', cur, acct: bank, rules: [{ from: date, rule: { every: 'once', date } }], steps: [{ from: date, amount: amt(it.amount) }] };
      if (typeof it.note === 'string' && it.note) s.note = it.note;
      schedules.push(s);
    }
    // [11.1, H9] plan.recurring: autoSpend; a weekly one starts on the first `on` weekday on or after `from`.
    for (const r of Array.isArray(plan.recurring) ? plan.recurring : []) if (r && typeof r.id === 'string') {
      let from = r.from, rule;
      if (r.every === 'week') { let n = dayNum(from); while (weekday(n) !== r.on) n++; from = dayStr(n); rule = { every: 'weeks', n: 1, from }; }
      else rule = { every: 'month', days: [r.on] };
      const s = Object.assign({ id: 'mv:auto:' + r.id, kind: 'autoSpend', name: r.n || '', cur, acct: bank }, lineOfKey[r.c] || {}, { from, rules: [{ from, rule }], steps: [{ from, amount: amt(r.a) }] });
      if (isDay(r.last)) s.last = r.last;
      schedules.push(s);
    }
  }

  // ---- the bank opening [B6, B7, 11.1]: the oldest figure opens it; goal money kept in the bank is its split.
  if (bank) {
    const split = {};
    for (const g of plan.goals || []) if (!sample && g && goalPlace[g.id] && g.start > 0 && places.find(p => p.id === goalPlace[g.id]).kind !== 'payoff') split[goalPlace[g.id]] = amt(g.start);
    const f0 = figures[0];
    events.unshift(Object.assign({ id: 'mv:open:cfg', k: 'open', date: f0.date, acct: bank, a: f0.a }, Object.keys(split).length ? { split } : {}, { told: f0.told }),
      ...figures.map(f => ({ id: 'mv:check:' + f.key, k: 'check', date: f.date, acct: bank, a: f.a, told: f.told })));
  }
  // ---- receipts [11.1, 6.3, I5, J2]: spend events, every one in the raw text (no 5,000 cap), told at the start of their day.
  const lk = lineOfKey;
  for (const r of Array.isArray(copy.receipts) ? copy.receipts : []) if (r && typeof r.id === 'string') {
    const acctS = typeof r.s === 'string' && acctByName[r.s];
    const note = [r.cn, r.n, typeof r.s === 'string' && !acctS ? r.s : ''].filter(x => typeof x === 'string' && x).join('; ');
    const e = Object.assign({ id: 'mv:rc:' + r.id, k: 'spend', date: r.d, a: amt(r.a), acct: acctS || bank }, lk[r.c] || {}, note ? { note } : {}, { src: { type: 'move', id: r.id }, told: startOf(r.d, offset) });
    events.push(e);
    for (const k of Object.keys(r)) if (!RC_KNOWN.includes(k)) unplaced.push('receipts.' + r.id + '.' + k);
  }

  // ---- ui, cfg and top-level fields
  const shared = {}, look = {}, tour = {};
  for (const k of Object.keys(ui)) {
    if (UI_SHARED.includes(k)) shared[k] = ui[k];
    else if (UI_LOOK.includes(k)) look[k] = ui[k];
    else if (UI_TOUR.includes(k)) tour[k] = ui[k];
    else if (!UI_USED.includes(k)) { shared[k] = ui[k]; unplaced.push('ui.' + k); }   // any field not listed: kept on the shared ui, listed
  }
  // [P2, 11.1] month-end answers: those for a month ending before the opening stay in frozen3831 only; a later one needs the
  // pay occurrence that started its period (open question mv-q8) and is listed.
  if (isMap(ui.sweep)) for (const ym of Object.keys(ui.sweep).sort()) if (/^\d{4}-\d{2}$/.test(ym) && dayNum(lastDayOf(ym)) >= dayNum(D0)) unplaced.push('ui.sweep.' + ym);
  for (const k of Object.keys(cfg)) if (!CFG_USED.includes(k) && !(CFG_OLD.includes(k) && !hasPlan)) unplaced.push('cfg.' + k);
  for (const k of Object.keys(copy)) if (!TOP_USED.includes(k)) unplaced.push('top.' + k);

  const out = { v: 3, home, people: typeof ui.name === 'string' && ui.name ? [{ id: 'mv:person:name', name: ui.name }] : [],
    accounts, places, schedules, events,
    plan: { shares, budgets }, imports: isMap(ui.cats) ? { cats: ui.cats } : {}, ui: shared,
    device: { look, tour, opens: Array.isArray(ui.wk) ? ui.wk : [] },
    asks, unplaced: unplaced.sort(), sample, frozen3831: raw };
  if (!sample && (typeof cfg.ceiling === 'number' || isMap(cfg.aims))) out.plan.limits = Object.assign({}, typeof cfg.ceiling === 'number' ? { ceiling: amt(cfg.ceiling) } : {}, isMap(cfg.aims) ? { aims: cfg.aims } : {}, { cur });
  return out;
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

// [X1] The move run on two devices, each on its own stored copy: built `mv:` ids make one record of each after the merge
// (merge_ref.merge: per id the newest `at` wins, the earliest `told` is kept). Device-only parts are not merged.
function moveTwo({ phone, desktop }) {
  const one = d => { const m = stamp(move(d), d.now, d.by, d.saved); for (const k of ['device', 'asks', 'unplaced', 'sample', 'frozen3831']) delete m[k]; return m; };
  return merge(one(phone), one(desktop));
}

function view(out, { show, omit }) {
  let o = out;
  if (show) { o = {}; for (const k of show) if (k === 'tally') o.tally = tally(out); else if (k.includes('.')) { const [a, b] = k.split('.'); o[k] = (out[a] || {})[b]; } else o[k] = out[k]; }
  if (omit) { const strip = x => Array.isArray(x) ? x.map(strip) : isMap(x) ? Object.fromEntries(Object.entries(x).filter(([k]) => !omit.includes(k)).map(([k, v]) => [k, strip(v)])) : x; o = strip(o); }
  return o;
}
function tally(out) { const sp = (out.events || []).filter(e => e.k === 'spend'); return { spends: sp.length, a: sp.reduce((t, e) => t + e.a, 0) }; }

function ask(question, input) {
  if (question === 'move') return view(move(input), input);
  if (question === 'move_two') return view(moveTwo(input), input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, move, moveTwo };
