'use strict';
// A second, independent checker of the money rules (engine lane B).
//
// Written ONLY from the written rules: SCHEMA_V3.md (sections 3 to 9, 12, 13),
// DECISIONS_ROUND2.md (later sections win), SCHEMA.md 10.3 and the rules in
// scenarios/README.md as the decisions changed them. It never reads or calls the
// reference model or the engine. Its job is to catch mistakes the reference model
// and the engine share.
//
// Input: a saved copy in the scenario form (scenarios/README.md, "How to read a
// file"; SCHEMA_V3 section 13 maps each name to the saved shape) and an "as of"
// date. The ask is at the end of that day (README rule 1).
//
// Covered: bank, cash, e-wallet and savings accounts; cards with a known close day
// paid from an account (H3, I3, X6, F5, F7, F14, F18); pay monthly, every N weeks or
// weekly (move earlier, later or none, holidays and bank-closed days); monthly bills;
// spends, refunds, money in, transfers between own accounts, goals kept in an account
// (set aside, paid from), checks and their fillers (A3, A4, T2, X4), late and early
// pay (F8, H8), skipped bills, the plan's budget lines and Free to spend (B1, B2,
// I4, J4, O4, T4, units). Not covered (the checker refuses rather than guesses):
// loans, pay-later, interest, other currencies, imports, posted dates on bank lines,
// period-end answers, period starts without pay, notYet, closed accounts.
//
// Every figure is worked in whole minor units [SCHEMA_V3 0, Amounts] and given back
// in the file's own units (major units, as the scenario files write them).

const DECS = { JPY: 0, KRW: 0, VND: 0, ISK: 0, BHD: 3, KWD: 3, JOD: 3, OMR: 3, TND: 3, IQD: 3, LYD: 3 };
const decsOf = (cur) => (cur in DECS ? DECS[cur] : 2);

// ---------- dates: whole day numbers only [D8] ----------
function dn(s) {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
function ds(n) {
  const t = new Date(n * 86400000);
  return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0');
}
const ymd = (n) => { const t = new Date(n * 86400000); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };
const weekday = (n) => ((n % 7) + 7 + 4) % 7; // 0 Sunday; day 0 (1970-01-01) was a Thursday
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
// A day 29 to 31 falls on the month's last day in a shorter month [SCHEMA_V3 3, 10.8]; 'last' is the last day.
function dayIn(y, m, day) {
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  const L = lastDay(y, m);
  const d = day === 'last' ? L : Math.min(Number(day), L);
  return dn(y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'));
}
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

class Refused extends Error {}
function refuse(msg) { throw new Refused(msg); }

function oracle(sc, asOfStr, opts) {
  opts = opts || {};
  const units = opts.units || 'written'; // 'written' (SCHEMA_V3 8, units rules) or 'plain' (L q8: 52 / n pays a year)
  // Switches that copy another reading, used only to sort differences into classes (fuzz_vs_ref.js --as-ref):
  //   placeFloor true: a place never goes below nothing (H7 as first written; AU2 and LEDGER_DESIGN L1 let it go below zero,
  //     holding nothing in the walk, which is the default now)
  //   currentMonthly true: the period running now gets the whole monthly amount (the opening one shared by days left), whatever the pay rhythm
  //     (SCHEMA_V3 8 units and I4: every period gets its own amount, monthly x 12 / the pays in that year)
  //   plannedToday false: no planned spending for a period whose pay is due today and not in yet (SCHEMA.md 10.3 step 2 counts it)
  //   plannedLate false: none either for a period whose late pay is still counted today [H8] (SCHEMA.md 10.3 step 2 counts it)
  //   openingLanding true: a pay inside the opening that lands after the setup day starts no period (see the starts below)
  //   carryOneStep true: an unpaid older item is taken out of the statement it was carried into only, not out of a later one
  //     that statement's rest was carried into in turn (I3: nothing is counted twice)
  //   creditWaits true: a credit statement waits for its own payment day before it is carried (H3 carries it to the next statement)
  const placeFloor = opts.placeFloor === true, currentMonthly = !!opts.currentMonthly, plannedToday = opts.plannedToday !== false;
  const plannedLate = opts.plannedLate !== false, creditWaits = !!opts.creditWaits, openingLanding = !!opts.openingLanding, carryOneStep = !!opts.carryOneStep;
  if (sc.pendingMove || sc.keptVersions) refuse('waiting amounts (pendingMove, keptVersions)');
  const cur = sc.currency;
  const D = decsOf(cur);
  const M = (x) => Math.round(Number(x) * Math.pow(10, D));
  const out = (n) => (D === 0 ? n : Number((n / Math.pow(10, D)).toFixed(D)));
  const T = dn(asOfStr);

  // ---------- working days [F17, README rule 3] ----------
  const closed = new Set();
  const hol = sc.holidays || {};
  for (const h of hol.dates || []) closed.add(dn(h.date));
  for (const h of hol.bank_closed || []) closed.add(dn(h.date));
  const working = (n) => { const w = weekday(n); return w !== 0 && w !== 6 && !closed.has(n); };
  function shift(n, rule) {
    if (rule === 'move earlier') { while (!working(n)) n -= 1; }
    else if (rule === 'move later') { while (!working(n)) n += 1; }
    return n;
  }
  // The posting window: postingDays working days after the landing day [F4, H8].
  function windowEnd(n, days) {
    let k = 0;
    while (k < days) { n += 1; if (working(n)) k += 1; }
    return n;
  }

  // ---------- accounts ----------
  const accts = {};
  for (const a of sc.accounts) {
    if (a.currency && a.currency !== cur) refuse('another currency: ' + a.id);
    if (!['bank', 'cash', 'ewallet', 'wallet', 'card'].includes(a.kind)) refuse('account kind ' + a.kind);
    if (a.closed) refuse('closed account');
    if (a.kind === 'card' && (a.statement_close_day === null || a.statement_close_day === undefined)) refuse('close day not sure');
    if (a.kind === 'card' && (a.carries || a.apr)) refuse('card that carries a balance');
    const o = a.opening || {};
    if (o.told || o.moved || o.not_yet) refuse('opening told, moved or not yet');
    accts[a.id] = {
      raw: a, id: a.id, kind: a.kind, open: dn(o.date),
      min: M(a.minimum || 0),
      spendFrom: a.spend_from !== undefined ? !!a.spend_from : ['bank', 'cash', 'ewallet', 'wallet'].includes(a.kind),
      postingDays: a.posting_days || (a.kind === 'card' ? 7 : 1),
    };
  }
  const mainBank = sc.main_bank || (sc.accounts.find((a) => a.kind === 'bank') || sc.accounts.find((a) => a.kind !== 'card')).id;
  const isMoney = (id) => accts[id] && accts[id].kind !== 'card';

  // ---------- events the app knows by the ask (README "How to read a file") ----------
  const evs = [];
  (sc.events || []).forEach((e, i) => {
    if (e.told === null) return; // never heard of
    const toldDay = e.told ? dn(e.told) : dn(e.date);
    if (dn(e.date) > T || toldDay > T) return;
    if (e.gone) return;
    if (e.source || e.est || e.moved || e.own_time || e.bal || e.unticked || e.ticked) refuse('imports, rough or moved lines');
    if (e.told && /[+-]\d\d:\d\d$|Z$/.test(e.told.slice(10))) refuse('told with an offset');
    const ok = ['spend', 'refund', 'money_in', 'pay_in', 'bill_paid', 'card_payment', 'transfer', 'skip', 'check', 'set_aside'];
    if (!ok.includes(e.kind)) refuse('event kind ' + e.kind);
    if (e.kind === 'check' && (e.avail || e.gain || e.filler_place)) refuse('check with avail, gain or filler place');
    if (e.kind === 'set_aside' && (e.from_place || e.to_place_of)) refuse('set aside from a place');
    if (e.amount_out !== undefined || e.amount_in !== undefined) refuse('a and a2');
    if (e.of) refuse('fee record');
    if (e.posted && !(accts[e.account] && accts[e.account].kind === 'card')) refuse('posted on a bank line');
    evs.push(Object.assign({}, e, { i, d: dn(e.date), amt: e.amount === undefined ? 0 : M(e.amount) }));
  });

  // ---------- schedules and their occurrences [H2, README rules 2 to 4] ----------
  const scheds = [];
  for (const s of sc.income || []) scheds.push({ raw: s, dir: 'in', id: s.id });
  for (const s of sc.bills || []) {
    if (s.kind) refuse('bill kind ' + s.kind);
    scheds.push({ raw: s, dir: 'out', id: s.id });
  }
  for (const s of scheds) {
    const r = s.raw;
    if (r.currency && r.currency !== cur) refuse('schedule in another currency');
    if (r.changes || r.amounts || r.amount_by_day || r.ends || r.place || r.vary || r.per) refuse('schedule extras on ' + r.id);
    s.acct = r.account;
    s.amt = M(r.amount);
    s.shiftRule = r.weekend_holiday || 'none';
    s.sch = r.schedule;
    if (!['monthly', 'every_n_weeks', 'weekly', 'every_n_months'].includes(s.sch.frequency)) refuse('frequency ' + s.sch.frequency);
    if (s.dir === 'in' && s.sch.frequency === 'every_n_months') refuse('pay every N months');
    if (s.sch.days || s.sch.count) refuse('monthly days or count');
  }
  // Due dates (unshifted) of a schedule rhythm in [lo, hi], ignoring its `from` (L q5 counts a year by the rhythm).
  function rhythm(sch, lo, hi) {
    const outD = [];
    if (sch.frequency === 'monthly') {
      let [y, m] = ymd(lo); m -= 1;
      for (;;) {
        const n = dayIn(y, m, sch.day);
        if (n > hi) break;
        if (n >= lo) outD.push(n);
        m += 1; if (m > 12) { m = 1; y += 1; }
      }
    } else if (sch.frequency === 'every_n_months') {
      const [fy, fm] = ymd(dn(sch.from));
      for (let k = 0; ; k++) {
        const n = dayIn(fy, fm + k * sch.n, sch.day);
        if (n > hi) break;
        if (n >= lo) outD.push(n);
      }
    } else {
      const step = sch.frequency === 'weekly' ? 7 : 7 * sch.n;
      let anchor;
      if (sch.from) anchor = dn(sch.from);
      else { anchor = lo; while (weekday(anchor) !== WD[sch.weekday]) anchor += 1; }
      if (sch.weekday && weekday(anchor) !== WD[sch.weekday]) refuse('weekday does not match from');
      let n = anchor + Math.ceil((lo - anchor) / step) * step;
      for (; n <= hi; n += step) outD.push(n);
    }
    return outD;
  }
  function occs(s, lo, hi) {
    let from = s.sch.from ? dn(s.sch.from) : -Infinity;
    return rhythm(s.sch, Math.max(lo, from === -Infinity ? lo : from), hi).map((due) => ({
      s, due, land: shift(due, s.shiftRule), name: s.id + '@' + ds(due),
    }));
  }

  // Settled: named by a known event [rule 4], or inside the opening of its account [rule 2;
  // SCHEMA_V3 3: "every other item due or landing on or before the opening is inside it"].
  const settledBy = {};
  for (const e of evs) {
    if (!e.settles) continue;
    const list = Array.isArray(e.settles) ? e.settles : [e.settles];
    for (const nm of list) settledBy[nm] = e;
  }
  const isSettled = (o, openDay) => !!settledBy[o.name] || o.due <= openDay || o.land <= openDay;

  // ---------- money accounts: bank today [rule 5, H1, B7, AN4] ----------
  // The change an event makes to a money account.
  function delta(e, id) {
    switch (e.kind) {
      case 'spend': case 'bill_paid': return e.account === id ? -e.amt : 0;
      case 'refund': case 'money_in': case 'pay_in': return e.account === id ? e.amt : 0;
      case 'card_payment': return e.from === id ? -e.amt : 0;
      case 'transfer': return (e.to === id ? e.amt : 0) - (e.from === id ? e.amt : 0);
      default: return 0;
    }
  }
  // An event is inside an anchor (the opening or a check) of the same account: dated
  // before its day, or on its day and listed before it (no times: file order) [H1, AN4].
  // The opening with no time covers its whole day [README H files, SCHEMA_V3 13].
  const insideOpening = (e, a) => e.d <= a.open;
  // Same day: `told` decides when both have a time, else the order in the file [H1, README H files].
  // A record with no `told` was heard of on its date. Told on a later day than the check: after it.
  const toldOf = (x) => x.told || x.date;
  const toldBefore = (e, c) => {
    const te = toldOf(e), tc = toldOf(c);
    if (te.slice(0, 10) !== tc.slice(0, 10)) return te.slice(0, 10) < tc.slice(0, 10);
    return te.length > 10 && tc.length > 10 ? te < tc : e.i < c.i;
  };
  const insideCheck = (e, c) => e.d < c.d || (e.d === c.d && toldBefore(e, c));

  const money = {};
  for (const id of Object.keys(accts)) {
    const a = accts[id];
    if (a.kind === 'card') continue;
    const checks = evs.filter((e) => e.kind === 'check' && e.account === id).sort((x, y) => x.d - y.d || x.i - y.i);
    const moving = evs.filter((e) => e.kind !== 'check' && delta(e, id) !== 0 && !insideOpening(e, a));
    // Fillers: app figure at a check minus the check's figure, for the stretch from the day
    // after the last anchor (the same day when it was earlier that day) to the check [A3, H1, 7.3].
    const fillers = [];
    let fig = M(a.raw.opening.amount), anchor = { d: a.open, i: -1, isOpen: true };
    for (const c of checks) {
      if (c.d < a.open || (c.d === a.open)) refuse('a check on or before the opening day');
      let app = fig;
      for (const e of moving) {
        const inNew = insideCheck(e, c);
        const inOld = anchor.isOpen ? false : insideCheck(e, anchor);
        if (inNew && !inOld) app += delta(e, id);
      }
      const gap = app - M(c.amount);
      fillers.push({ acct: id, check: c, amt: gap, app, from: anchor.d === c.d ? c.d : anchor.d + 1, to: c.d });
      fig = M(c.amount); anchor = c;
    }
    let bank = fig, asOfDay = anchor.d;
    for (const e of moving) if (anchor.isOpen ? true : !insideCheck(e, anchor)) bank += delta(e, id);
    money[id] = { bank, asOf: asOfDay, fillers };
  }

  // ---------- goals kept in an account [B6, H7, SCHEMA_V3 4] ----------
  const goals = {};
  for (const g of sc.goals || []) {
    if (g.refill || g.for_bill || g.mode || g.removed || g.kind) refuse('goal extras');
    const keptIn = g.kept_in;
    let kept = 0;
    if (g.opening && g.opening.amount) kept = M(g.opening.amount);
    goals[g.id] = { id: g.id, keptIn, kept };
  }
  for (const a of sc.accounts) {
    const sp = a.opening && a.opening.split;
    if (sp && sp.goals) for (const gid of Object.keys(sp.goals)) goals[gid].kept += M(sp.goals[gid]);
  }
  const evDated = evs.slice().sort((x, y) => x.d - y.d || x.i - y.i);
  for (const e of evDated) {
    if (e.kind === 'set_aside') {
      if (e.d <= accts[e.account].open) continue; // inside the opening split
      goals[e.goal].kept += e.amt;
    } else if (e.kind === 'spend' && e.goal) {
      if (e.d <= accts[e.account].open) continue;
      // A place never holds less than nothing: paying past it takes the rest from the account's other money [H7].
      goals[e.goal].kept -= placeFloor ? Math.min(goals[e.goal].kept, e.amt) : e.amt;
    }
  }

  // ---------- the period stream and periods [F8, F12, H8, SCHEMA_V3 9] ----------
  const incomes = scheds.filter((s) => s.dir === 'in');
  const P = incomes.find((s) => s.raw.starts_period) || incomes[0];
  if (!P) refuse('no pay');
  const pOpen = accts[P.acct].open;
  const pWin = accts[P.acct].postingDays;
  // Expected pay occurrences of the period stream at T: unsettled, landing today or later,
  // or late but inside the posting window (late, expected) [H8, G4].
  function expectedPays(fromDay) {
    const list = [];
    for (const o of occs(P, fromDay - 62, fromDay + 800)) {
      if (isSettled(o, pOpen)) continue;
      if (o.land >= fromDay) list.push(o);
      else if (windowEnd(o.land, pWin) >= fromDay) list.push(o);
    }
    return list.sort((x, y) => x.land - y.land || x.due - y.due);
  }
  const expPays = expectedPays(T);

  // Period starts known at T: the pay occurrence inside the opening (its landing), then each
  // known pay of the stream, on the day it landed (early or late) [F8].
  const starts = [];
  {
    const before = occs(P, pOpen - 400, pOpen + 12).filter((o) => o.due <= pOpen || o.land <= pOpen);
    before.sort((x, y) => x.land - y.land || x.due - y.due);
    const lastIn = before.pop();
    // A pay due on or before the setup day is inside the opening, so it came in by then: its period
    // started by the setup day even when its calendar landing is later [rule 2, F8; the rules do not
    // say this case outright, DIFFERENCES.md]. --as-ref openingLanding copies the reference: the period
    // before keeps running until the next pay is seen.
    if (lastIn && lastIn.land > pOpen && openingLanding) {
      const prev = before.pop();
      if (prev) starts.push({ day: prev.land, occ: prev, opening: true });
    } else if (lastIn && !settledBy[lastIn.name]) starts.push({ day: Math.min(lastIn.land, pOpen), occ: lastIn, opening: true });
    for (const e of evs) {
      if (e.kind !== 'pay_in' || !e.settles) continue;
      const nm = Array.isArray(e.settles) ? e.settles[0] : e.settles;
      if (nm.split('@')[0] !== P.id) continue;
      const due = dn(nm.split('@')[1]);
      if (due <= pOpen || shift(due, P.shiftRule) <= pOpen) continue; // inside the opening
      starts.push({ day: e.d, occ: { s: P, due, land: shift(due, P.shiftRule), name: nm } });
    }
    starts.sort((x, y) => x.day - y.day || x.occ.due - y.occ.due);
  }
  if (!starts.length) refuse('no period start');
  const curStart = starts.filter((s) => s.day <= T).pop();
  if (!curStart) refuse('ask before the first period');
  // The period running at T ends the day before the next expected pay of the stream lands.
  // The occurrence after a given one of the stream (by due date).
  const nextOcc = (occ) => occs(P, occ.due + 1, occ.due + 400)[0];


  // ---------- plan amounts per period [SCHEMA_V3 8 units, B8, N3, L q3 to q5, L q8] ----------
  const plan = sc.plan || null;
  const lines = [];
  let free = null;
  if (plan) {
    for (const l of plan.lines || []) {
      if (l.per !== 'month' || l.changes || l.currency || l.once) refuse('line extras');
      lines.push({ id: l.id, acct: l.account || mainBank, amt: M(l.amount) });
    }
    if (plan.free) {
      if (plan.free.per !== 'month' || plan.free.changes || plan.free.once) refuse('free extras');
      free = { id: 'free', acct: plan.free.account || mainBank, amt: M(plan.free.amount) };
    }
  }
  // A line on a card is reserved from the card's paying account [O4].
  const reserveAcct = (acct) => (accts[acct] && accts[acct].kind === 'card' ? accts[acct].raw.payment.from : acct);
  // What a period started by pay occurrence `occ` gets of a monthly amount.
  function periodAmount(monthly, occ) {
    if (P.sch.frequency === 'monthly') return monthly;
    const [y] = ymd(occ.due);
    const yearDues = rhythm(P.sch, dn(y + '-01-01'), dn(y + '-12-31'));
    const n = yearDues.length;
    if (units === 'plain') {
      // L q8: the reference keeps a plain form, 52 / n pays a year, each period rounded on its own (rounding not written; to the nearest unit, as the fuzz found).
      const perYear = P.sch.frequency === 'weekly' ? 52 : 52 / P.sch.n;
      return Math.round((monthly * 12) / perYear);
    }
    const total = monthly * 12;
    const base = Math.floor(total / n);
    const left = total - base * n;
    const idx = yearDues.indexOf(occ.due);
    if (idx < 0) refuse('pay not on its rhythm');
    return base + (idx < left ? 1 : 0); // leftover minor units to the earliest pays of the year [L units q4]
  }

  // The current period's amounts: the opening's split for the opening period [B2, I4, J4], else the units rule.
  function periodBudget(start, forGainTest) {
    const res = { lines: {}, free: 0 };
    const full = currentMonthly && !forGainTest ? (x) => x : (x) => periodAmount(x, start.occ);
    const fullOpen = full;
    if (!start.opening) {
      for (const l of lines) res.lines[l.id] = full(l.amt);
      if (free) res.free = full(free.amt);
      return res;
    }
    const nxt = nextOcc(start.occ);
    const pStart = start.day, pEnd = nxt.land - 1;
    const Dd = pEnd - pStart + 1;
    const d = pEnd - accts[mainBank].open + 1; // days left: setup day to the period's last day, both counted
    const split = (accts[mainBank].raw.opening || {}).split || {};
    for (const a of sc.accounts) if (a.id !== mainBank && a.opening && a.opening.split && (a.opening.split.lines || a.opening.split.free !== undefined)) refuse('split on another account');
    let leftoverNum = 0; // lines' rounding leftovers, in units of 1/Dd minor unit
    for (const l of lines) {
      if (split.lines && split.lines[l.id] !== undefined) { res.lines[l.id] = M(split.lines[l.id]); continue; }
      const num = fullOpen(l.amt) * d;
      res.lines[l.id] = Math.floor(num / Dd);
      leftoverNum += num - res.lines[l.id] * Dd;
    }
    if (free) {
      if (split.free !== undefined) res.free = M(split.free); // typed: it stands; leftovers stay in Waiting [J4]
      else res.free = Math.floor((fullOpen(free.amt) * d + leftoverNum) / Dd); // own share plus the leftovers, rounded down [I4]
    }
    return res;
  }

  // Spent so far this period [O4, T4, T5, T watch]: spends with the line on every account,
  // after the opening, dated from the period's first day to today; a refund with a line gives back.
  const budget = periodBudget(curStart);
  const spent = {};
  const openOf = (e) => accts[e.account || e.from] ? accts[e.account || e.from].open : -Infinity;
  for (const e of evs) {
    // [AU other points] In a life with a plan, a spend with no line (no goal, settling nothing) counts against Free to spend.
    if (!e.line && free && e.kind === 'spend' && !e.goal && !e.settles && e.d >= curStart.day && e.d <= T && e.d > openOf(e)) { spent.free = (spent.free || 0) + e.amt; continue; }
    if (!e.line) continue;
    if (e.d < curStart.day || e.d > T) continue;
    if (e.d <= openOf(e)) continue; // before the opening: not in spent so far [SCHEMA_V3 3]
    if (e.kind === 'spend') spent[e.line] = (spent[e.line] || 0) + e.amt;
    else if (e.kind === 'refund') spent[e.line] = (spent[e.line] || 0) - e.amt;
    else refuse('line on ' + e.kind);
  }
  // The filler is spending from Free to spend, split by days at a period start [A4, T2];
  // the older period's part rounded, the newer gets the rest.
  let fillerHere = 0;
  const allStarts = starts.map((s) => s.day);
  for (const id of Object.keys(money)) {
    for (const f of money[id].fillers) {
      // A large gain is held, never placed, until answered [O, X4].
      if (f.amt < 0) {
        const pf = periodBudget(starts.filter((s) => s.day <= f.to).pop() || curStart, true).free;
        if (-f.amt > pf || -f.amt * 5 > f.app) continue;
      }
      // the part of the stretch in the current period
      const cuts = allStarts.filter((x) => x > f.from && x <= f.to);
      let parts = [];
      let lo = f.from;
      for (const c of cuts) { parts.push([lo, c - 1]); lo = c; }
      parts.push([lo, f.to]);
      const total = f.to - f.from + 1;
      let given = 0;
      parts.forEach((p, k) => {
        const days = p[1] - p[0] + 1;
        const share = k === parts.length - 1 ? f.amt - given : Math.round((f.amt * days) / total);
        given += share;
        if (p[0] >= curStart.day && p[1] <= T + 400) fillerHere += share;
      });
    }
  }
  const lineLeft = {};
  for (const l of lines) lineLeft[l.id] = Math.max(0, budget.lines[l.id] - (spent[l.id] || 0)); // overspent: nothing left [T4]
  const freeLeft = free ? budget.free - (spent.free || 0) - fillerHere : null;

  // ---------- cards [H3, I3, X6, F5, F7, F14, F18, README rule 7] ----------
  const cards = {};
  for (const id of Object.keys(accts)) {
    const a = accts[id];
    if (a.kind !== 'card') continue;
    const r = a.raw, pay = r.payment;
    if (pay.pays && pay.pays !== 'in full') refuse('card pays ' + pay.pays);
    const cd = r.statement_close_day, pm = pay.months_after_close === undefined ? 1 : pay.months_after_close;
    const shiftRule = pay.weekend_holiday || 'none';
    const closeAfter = (day) => { // the first close strictly after `day`; the close day never moves [F6]
      let [y, m] = ymd(day);
      for (;;) { const n = dayIn(y, m, cd); if (n > day) return n; m += 1; if (m > 12) { m = 1; y += 1; } }
    };
    const dueOf = (close) => { const [y, m] = ymd(close); return dayIn(y, m + pm, pay.day); };
    const mk = (close) => { const due = dueOf(close); return { close, due, land: shift(due, shiftRule), name: id + '@' + ds(due), amt: 0, rem: 0, settled: false, carried: false, item: true }; };
    const o = r.opening;
    const stmts = [];
    let lastClose;
    const lineList = []; // { day, amt } card lines by posting date
    if (o.statement) {
      const st = mk(dn(o.statement.closed));
      // "don't know": unpaid, holding everything owed, all due on the next payment day [AB3]
      const dk = o.statement.paid === 'dont_know';
      st.amt = dk ? M(o.current) : M(o.statement.amount || 0);
      st.rem = st.amt;
      if (o.statement.paid === true || st.due <= a.open || st.land <= a.open) { st.settled = true; st.rem = 0; }
      if (st.amt <= 0) st.item = false;
      stmts.push(st);
      lastClose = st.close;
      const openPart = M(o.current) - (o.statement.paid === true ? 0 : st.amt);
      if (openPart) lineList.push({ day: a.open, amt: openPart });
    } else {
      if (o.statements) refuse('several opening statements');
      lastClose = null;
      if (M(o.current)) lineList.push({ day: a.open, amt: M(o.current) }); // X6: the first close after the opening holds it
    }
    for (const e of evs) {
      if (e.account !== id) continue;
      const day = e.posted ? dn(e.posted) : e.d;
      if (e.d <= a.open) continue; // inside the opening's figure
      if (e.kind === 'spend') lineList.push({ day, amt: e.amt });
      else if (e.kind === 'refund') lineList.push({ day, amt: -e.amt });
      else if (e.kind === 'check') refuse('card check');
      else refuse('card event ' + e.kind);
    }
    const pays = evs.filter((e) => e.kind === 'card_payment' && e.card === id).sort((x, y) => x.d - y.d || x.i - y.i);
    for (const p of pays) if (p.d <= a.open) refuse('card payment inside the opening');

    // Walk closes in order to well past the ask; payments and lines by day, a payment or line
    // on a close day before the close.
    let openBal = 0;
    let cursor = lastClose === null ? a.open : lastClose;
    const farEnd = T + 800;
    const allocate = (p) => {
      let left = p.amt;
      const nm = Array.isArray(p.settles) ? p.settles[0] : p.settles;
      let target = nm ? stmts.find((s) => s.name === nm) : null;
      if (nm && !target) refuse('payment names no statement ' + nm);
      if (target) {
        target.settled = true;
        while (target.carried) target = target.carriedInto;
        const take = Math.max(0, Math.min(left, target.rem));
        target.rem -= take; left -= take;
      }
      for (const s of stmts) { if (left <= 0) break; if (s.carried || s.rem <= 0) continue; const take = Math.min(left, s.rem); s.rem -= take; left -= take; }
      if (left > 0) openBal -= left; // then the open cycle
    };
    let pi = 0;
    const linesSorted = lineList.slice().sort((x, y) => x.day - y.day);
    let li = 0;
    for (;;) {
      const c = closeAfter(cursor);
      if (c > farEnd) break;
      // events up to and including the close day
      while (li < linesSorted.length && linesSorted[li].day <= c) { openBal += linesSorted[li].amt; li += 1; }
      while (pi < pays.length && pays[pi].d <= c) { allocate(pays[pi]); pi += 1; }
      const st = mk(c);
      // carried over: what is left of statements not paid by their own payment day, and credits [H3, I3]
      let carry = 0;
      for (const s of stmts) {
        if (s.carried) continue;
        // after the ask, an unsettled item is paid in the walk; only a settled remainder carries
        const passed = c <= T ? s.land <= c : (s.settled && s.land <= c);
        if ((s.rem < 0 && (!creditWaits || c > T || s.land <= c)) || (s.rem > 0 && passed)) {
          // an unpaid item keeps asking what it held; the newer item asks only the rest [I3]
          if (!s.settled && s.item && s.rem > 0) s.itemCap = s.rem;
          carry += s.rem; s.carried = true; s.carriedInto = st; s.rem = 0;
        }
      }
      st.amt = openBal + carry;
      st.rem = st.amt;
      st.future = c > T;
      if (st.amt <= 0) st.item = false; // a credit: nothing due, no item
      stmts.push(st);
      openBal = 0;
      cursor = c;
    }
    while (pi < pays.length) { allocate(pays[pi]); pi += 1; }
    // Settled names from the opening rule [rule 2]
    for (const s of stmts) if (s.due <= a.open || s.land <= a.open) s.settled = true;
    cards[id] = { id, payFrom: pay.from, stmts, postingDays: a.postingDays };
  }

  // Items each card asks, as seen at T: closed statements with an open item, and the open
  // cycles (still open: the amount posted so far) on their payment day [F7, F14, F18].
  function cardItems(cid) {
    const c = cards[cid];
    const res = [];
    for (const s of c.stmts) s.used = 0;
    const head = (s) => { while (s.carried) s = s.carriedInto; return s; };
    for (const s of c.stmts) {
      if (!s.item || s.settled) continue;
      let amount;
      if (s.carried) {
        if (!s.itemCap) continue;
        if (carryOneStep) { amount = s.itemCap; s.carriedInto.used += amount; } // the reference's reading
        else {
          const h = head(s);
          amount = Math.max(0, Math.min(s.itemCap, h.rem - h.used)); // what the older one holds
          h.used += amount;
        }
      } else amount = s.rem - s.used; // what the older ones do not already hold
      if (amount <= 0) continue;
      res.push({ name: s.name, due: s.due, land: s.land, amt: amount, closed: !s.future, close: s.close, card: cid });
    }
    return res.sort((x, y) => x.land - y.land);
  }

  // ---------- the walk, per money account [SCHEMA.md 10.3, B1, B3, B9, F2, F3, F14, G1, H8] ----------
  // Horizon: the later of the second next pay that starts a period and today + 45 days [G1].
  // [BJ1] a pay due today, left unticked at a check made today, is not seen: not counted (BH1 over G4)
  const leftToday = (acctId, o) => o.land === T && evs.some(e => e.kind === 'check' && e.account === acctId && e.d === T);
  const H = Math.max(expPays.length >= 2 ? expPays[1].land : T + 45, T + 45);
  const futureStarts = []; // expected pays of the stream within the horizon: planned spending of that period
  for (const o of occs(P, T - 62, H + 12)) {
    if (isSettled(o, pOpen)) continue;
    let day;
    if (o.land >= T && !leftToday(P.acct, o)) day = o.land;
    else continue; // [BH1, replaces H8 for safe to spend] a late pay is not counted; its period has not started [BJ1: nor one left at a check today]
    if (day > H) continue;
    if (!plannedToday && day === T && o.land === T) continue;
    if (!plannedLate && day === T && o.land < T) continue;
    futureStarts.push({ day, occ: o });
  }
  // a period whose pay is inside the opening but lands after the ask still starts in the walk
  for (const st of starts) if (st.day > T && st.day <= H) futureStarts.push({ day: st.day, occ: st.occ });

  const accountsOut = {};
  let sumHead = 0, shortfall = 0;
  for (const id of Object.keys(money)) {
    const a = accts[id];
    const items = []; // { day, order, amt }
    for (const s of scheds) {
      if (s.acct !== id) continue;
      const win = a.postingDays;
      for (const o of occs(s, Math.max(a.open - 400, T - 400), H + 12)) {
        if (isSettled(o, a.open)) continue;
        if (s.dir === 'in') {
          if (o.land >= T && !leftToday(id, o)) items.push({ day: o.land, order: 0, amt: s.amt, what: o.name });
          // [BH1] money not yet seen never counts toward safe to spend: a late pay is left out until it is ticked
        } else {
          items.push({ day: Math.max(o.land, T), order: 1, amt: -s.amt, what: o.name }); // a late bill still goes out today [rule 10]
        }
      }
    }
    for (const cid of Object.keys(cards)) {
      if (cards[cid].payFrom !== id) continue;
      for (const it of cardItems(cid)) {
        const day = Math.min(Math.max(it.land, T), H); // beyond the horizon: at its end [F14]
        items.push({ day, order: 1, amt: -it.amt, what: it.name });
      }
    }
    for (const fs of futureStarts) {
      for (const l of lines) if (reserveAcct(l.acct) === id) items.push({ day: fs.day, order: 2, amt: -periodAmount(l.amt, fs.occ), what: 'line ' + l.id });
      if (free && reserveAcct(free.acct) === id) items.push({ day: fs.day, order: 2, amt: -periodAmount(free.amt, fs.occ), what: 'free' });
    }
    // today: goals kept in it, and what is left of this period's budget lines on it [B1]
    let start = money[id].bank;
    for (const g of Object.values(goals)) if (g.keptIn === id) start -= Math.max(0, g.kept);
    for (const l of lines) if (reserveAcct(l.acct) === id) start -= lineLeft[l.id];
    let bal = start, lowest = start, lowestDay = T, lowAt = 0;
    items.sort((x, y) => x.day - y.day || x.order - y.order);
    let k = 0;
    for (let day = T; day <= H; day++) {
      let any = false;
      while (k < items.length && items[k].day === day) { bal += items[k].amt; k += 1; any = true; }
      if (any && bal < lowest) { lowest = bal; lowestDay = day; lowAt = k; }
    }
    // The checker's own working, for a person to read: what comes off today, then each step to the lowest day.
    const steps = [{ what: 'bank today', amt: money[id].bank, day: ds(T) }, { what: 'kept and left this period', amt: start - money[id].bank, day: ds(T) }]
      .concat(items.slice(0, lowAt).map((x) => ({ what: x.what, amt: x.amt, day: ds(x.day) })), [{ what: 'minimum', amt: -a.min, day: '' }]);
    const headroom = lowest - a.min;
    accountsOut[id] = { bank: out(money[id].bank), asOf: ds(money[id].asOf), headroom: out(headroom), lowest: out(lowest), lowestDay: ds(lowestDay), steps: steps.map((x) => Object.assign({}, x, { amt: out(x.amt) })) };
    if (a.spendFrom && headroom > 0) sumHead += headroom;
    if (headroom < 0) shortfall += -headroom;
  }

  // ---------- the headline [SCHEMA.md 10.3 step 5, F9, B9, G2] ----------
  let headline = sumHead - shortfall;
  if (freeLeft !== null) headline = Math.min(headline, freeLeft);
  headline = Math.max(0, headline);

  // ---------- days to next pay [F3, F8, F12, H8] ----------
  let daysToNextPay = null;
  if (expPays.length) {
    const np = expPays[0];
    // [WIRING_PLAN F4] days to next pay is never below zero, a late pay included (it is shown as late)
    daysToNextPay = { days: Math.max(0, np.land - T), next_pay: ds(np.land), item: np.name };
    if (np.land < T) daysToNextPay.late = true;
  }

  // ---------- due before next pay [F7, F13, F21, F23, I6] ----------
  const dueItems = [];
  if (expPays.length) {
    // up to the day before the next pay; [BH1] while it is late it is not counted, so up to the pay after it
    const stop = expPays[0].land >= T ? expPays[0].land : (expPays.find(p => p.land >= T) || expPays[0]).land;
    for (const s of scheds) {
      if (s.dir !== 'out') continue;
      for (const o of occs(s, T - 12, stop + 12)) {
        if (isSettled(o, accts[s.acct].open)) continue;
        if (o.land >= T && o.land < stop) dueItems.push({ item: o.name, lands: o.land, due: o.due, amount: s.amt });
      }
    }
    for (const cid of Object.keys(cards)) {
      for (const it of cardItems(cid)) if (it.land >= T && it.land < stop) dueItems.push({ item: it.name, lands: it.land, due: it.due, amount: it.amt, statement: it.closed ? 'closed' : 'open' });
    }
  }
  dueItems.sort((x, y) => x.lands - y.lands || x.due - y.due);
  const dueBeforeNextPay = {
    items: dueItems.map((x) => Object.assign({ item: x.item, lands: ds(x.lands), amount: out(x.amount) }, x.statement ? { statement: x.statement } : {})),
    total: out(dueItems.reduce((t, x) => t + x.amount, 0)),
  };

  // ---------- card due [F7, H3, README "card_due"] ----------
  const cardDue = {};
  for (const cid of Object.keys(cards)) {
    const its = cardItems(cid).filter((x) => x.closed);
    if (its.length) {
      const x = its[0];
      cardDue[cid] = { amount: out(x.amt), payment_date: ds(x.land), statement: 'closed', closed_on: ds(x.close) };
    } else {
      const op = cards[cid].stmts.find((s) => s.future);
      cardDue[cid] = { amount: out(Math.max(0, op.amt)), payment_date: ds(op.land), statement: 'open', closes_on: ds(op.close) };
    }
  }

  // ---------- total [F10, F11, README rule 13] ----------
  let total = 0;
  for (const id of Object.keys(money)) total += money[id].bank;

  return {
    accounts: accountsOut,
    headline: out(headline),
    freeLeft: freeLeft === null ? null : out(freeLeft),
    daysToNextPay,
    dueBeforeNextPay,
    cards: cardDue,
    total: out(total),
    horizon: ds(H),
    period: { start: ds(curStart.day), occ: curStart.occ.name },
  };
}

module.exports = { oracle, Refused, dn, ds };
