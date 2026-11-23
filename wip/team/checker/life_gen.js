'use strict';
// Seeded random lives in the scenario form (scenarios/README.md), for fuzz_vs_ref.js.
// Every amount is made up. Ids look like the ones the app really makes
// (`<device>-<session>-<counter>`, SCHEMA_V3 section 0) [LESSONS lesson 3, AJ1].
//
// A life: a main bank, maybe an e-wallet, cash and a savings account backing a goal,
// zero to two cards with close and payment days, pay every month, every two weeks or
// weekly (maybe a second job that starts no period), monthly bills, spends, refunds,
// transfers between own accounts, money in, set-asides, check-ins with a gap, pay that
// lands early or late (or not at all), bills paid late or skipped, card payments in
// full, in part or late, and a plan (budget lines and Free to spend) half the time.

const { dn, ds } = require('./oracle_v2.js');

function rng(seed) {
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.pick = (xs) => xs[Math.floor(f() * xs.length)];
  f.chance = (p) => f() < p;
  return f;
}
const ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';
const weekday = (n) => ((n % 7) + 7 + 4) % 7;
const WDN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ymd = (n) => { const t = new Date(n * 86400000); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
function dayIn(y, m, day) {
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  const L = lastDay(y, m);
  const d = day === 'last' ? L : Math.min(Number(day), L);
  return dn(y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'));
}

function genLife(seed, opts) {
  opts = opts || {};
  const R = rng(seed * 7919 + 17);
  const idStr = (n) => { let s = ''; for (let i = 0; i < n; i++) s += ALNUM[R.int(0, 35)]; return s; };
  const dev = idStr(6), sess = idStr(10);
  let ctr = 0;
  const nid = () => dev + '-' + sess + '-' + (++ctr);

  const cur = R.pick(['JPY', 'PHP', 'JPY']);
  const dec = cur === 'JPY' ? 0 : 2;
  const K = cur === 'JPY' ? 1 : 0.02; // pesos are about a fiftieth of yen in these made-up lives
  const amt = (yen, cents) => { // a made-up amount in the currency's major units
    let v = yen * K;
    if (dec === 0) return Math.round(v / 100) * 100;
    v = Math.round(v);
    if (cents && R.chance(0.3)) v += R.int(1, 99) / 100;
    return Number(v.toFixed(2));
  };

  const S = dn('2026-11-01') + R.int(0, 420);
  const days = opts.days || 100;
  const END = S + days;

  // holidays and bank-closed days in the window, never on the setup day
  const holidays = { country: 'XX', dates: [], bank_closed: [] };
  const hset = new Set();
  for (let i = 0, n = R.int(2, 6); i < n; i++) { const d = S + R.int(1, days + 60); if (!hset.has(d)) { hset.add(d); holidays.dates.push({ date: ds(d), name: 'Holiday' }); } }
  if (R.chance(0.3)) { const d = S + R.int(1, days); if (!hset.has(d)) { hset.add(d); holidays.bank_closed.push({ date: ds(d), name: 'Banks closed' }); } }
  holidays.dates.sort((a, b) => a.date.localeCompare(b.date));
  const working = (n) => { const w = weekday(n); return w !== 0 && w !== 6 && !hset.has(n); };
  const shift = (n, rule) => { if (rule === 'move earlier') while (!working(n)) n -= 1; else if (rule === 'move later') while (!working(n)) n += 1; return n; };

  // ---------- accounts ----------
  const accounts = [];
  const bank = { id: nid(), name: 'Main bank', kind: 'bank', currency: cur, minimum: R.chance(0.5) ? 0 : amt(R.pick([10000, 20000, 50000])), opening: { date: ds(S), amount: amt(R.int(150, 900) * 1000, true) } };
  accounts.push(bank);
  const bal = {}; bal[bank.id] = bank.opening.amount;
  let ew = null, cash = null, sav = null;
  if (R.chance(0.5)) { ew = { id: nid(), name: 'E-wallet', kind: 'ewallet', currency: cur, minimum: 0, opening: { date: ds(S), amount: amt(R.int(1, 40) * 1000, true) } }; accounts.push(ew); bal[ew.id] = ew.opening.amount; }
  if (R.chance(0.6)) { cash = { id: nid(), name: 'Cash', kind: 'cash', currency: cur, minimum: 0, opening: { date: ds(S), amount: amt(R.int(2, 30) * 1000) } }; accounts.push(cash); bal[cash.id] = cash.opening.amount; }
  if (R.chance(0.25)) { sav = { id: nid(), name: 'Savings', kind: 'bank', currency: cur, minimum: 0, spend_from: false, opening: { date: ds(S), amount: amt(R.int(50, 400) * 1000) } }; accounts.push(sav); bal[sav.id] = sav.opening.amount; }
  const moneyAccts = accounts.slice();

  // ---------- cards ----------
  const cards = [];
  for (let i = 0, n = R.pick([0, 1, 1, 2]); i < n; i++) {
    const pm = R.chance(0.2) ? 2 : 1;
    const cd = R.pick([5, 10, 15, 20, 25, 'last', 'last']);
    let payDay;
    if (cd === 'last') payDay = R.pick([4, 10, 11, 26, 27]);
    else payDay = R.int(1, cd - 1);
    const payFrom = ew && R.chance(0.2) ? ew.id : bank.id;
    const card = { id: nid(), name: 'Card ' + (i + 1), kind: 'card', currency: cur, statement_close_day: cd, payment: { day: payDay, months_after_close: pm, from: payFrom, pays: 'in full', weekend_holiday: R.pick(['move later', 'move later', 'move earlier', 'none']) }, opening: { date: ds(S) } };
    // close days and payment days
    const closeAfter = (day) => { let [y, m] = ymd(day); for (;;) { const c = dayIn(y, m, cd); if (c > day) return c; m += 1; if (m > 12) { m = 1; y += 1; } } };
    const closeBefore = (day) => { let [y, m] = ymd(day); for (;;) { const c = dayIn(y, m, cd); if (c < day) return c; m -= 1; if (m < 1) { m = 12; y -= 1; } } };
    const dueOf = (c) => { const [y, m] = ymd(c); return dayIn(y, m + pm, payDay); };
    if (closeBefore(S + 1) === S) { /* set up on a close day: keep it, the opening holds that close */ }
    const C0 = closeBefore(S); // strictly before the setup day
    const D0 = dueOf(C0), L0 = shift(D0, card.payment.weekend_holiday);
    const since = amt(R.int(0, 60) * 1000, true);
    const g = { card, closeAfter, dueOf, lines: [], payRule: card.payment.weekend_holiday, stmts: [] };
    if (pm === 2 || R.chance(0.15)) {
      card.opening.current = since; // no last statement typed [X6]
      g.lines.push({ day: S, a: since });
      g.firstClose = closeAfter(S);
      g.carry = 0;
    } else {
      const A0 = amt(R.int(0, 80) * 1000, true);
      if (D0 <= S || L0 <= S) {
        card.opening.statement = { closed: ds(C0), amount: A0, paid: true };
        card.opening.current = since;
      } else {
        const ans = R.pick([true, false, false, 'dont_know']);
        if (ans === true) { card.opening.statement = { closed: ds(C0), paid: true }; if (R.chance(0.5)) card.opening.statement.amount = A0; card.opening.current = since; }
        else if (ans === false) { card.opening.statement = { closed: ds(C0), amount: A0, paid: false }; card.opening.current = Number((A0 + since).toFixed(dec)); g.stmts.push({ close: C0, due: D0, land: L0, amt: A0, paid: 0 }); }
        else { card.opening.statement = { closed: ds(C0), paid: 'dont_know' }; card.opening.current = Number((A0 + since).toFixed(dec)); g.stmts.push({ close: C0, due: D0, land: L0, amt: Number((A0 + since).toFixed(dec)), paid: 0 }); g.dk = true; }
      }
      if (!g.dk) g.lines.push({ day: S, a: since });
      g.firstClose = closeAfter(C0 === S ? S : C0);
    }
    accounts.push(card);
    cards.push(g);
  }

  // ---------- pay ----------
  const income = [];
  const payKind = R.pick(['monthly', 'monthly', 'every_n_weeks', 'weekly']);
  const pay = { id: nid(), name: 'Pay', account: bank.id, currency: cur, amount: 0, schedule: null, weekend_holiday: R.pick(['move earlier', 'move earlier', 'move later', 'none']), starts_period: true };
  if (payKind === 'monthly') { pay.schedule = { frequency: 'monthly', day: R.pick([10, 15, 20, 25, 25, 28, 31]) }; pay.amount = amt(R.int(180, 450) * 1000, true); }
  else if (payKind === 'every_n_weeks') {
    const wd = R.pick([4, 5, 5]);
    let f = S - R.int(1, 30); while (weekday(f) !== wd) f -= 1;
    pay.schedule = { frequency: 'every_n_weeks', n: 2, weekday: WDN[wd], from: ds(f) };
    pay.amount = amt(R.int(90, 220) * 1000, true);
  } else { pay.schedule = { frequency: 'weekly', weekday: WDN[R.pick([4, 5, 5])] }; pay.amount = amt(R.int(40, 110) * 1000); }
  income.push(pay);
  if (R.chance(0.25)) income.push({ id: nid(), name: 'Side job', account: ew && R.chance(0.5) ? ew.id : bank.id, currency: cur, amount: amt(R.int(20, 80) * 1000), schedule: { frequency: 'monthly', day: R.pick([5, 10, 20, 30]) }, weekend_holiday: R.pick(['move earlier', 'move later', 'none']), starts_period: false });

  // ---------- bills ----------
  const bills = [];
  const billNames = ['Rent', 'Power and water', 'Phone', 'Internet', 'Gym', 'Insurance', 'Streaming'];
  for (let i = 0, n = R.int(2, 5); i < n; i++) {
    const big = i === 0;
    bills.push({ id: nid(), name: billNames[i], account: ew && R.chance(0.15) ? ew.id : bank.id, currency: cur, amount: amt(big ? R.int(50, 120) * 1000 : R.int(2, 15) * 1000, true), schedule: { frequency: 'monthly', day: R.pick([1, 1, 5, 10, 15, 20, 25, 27, 28, 30, 31]) }, weekend_holiday: R.pick(['move later', 'move later', 'none', 'move earlier']) });
  }

  // ---------- goals and plan ----------
  const goals = [];
  let trip = null, rainy = null;
  if (R.chance(0.4)) { trip = { id: nid(), name: 'Trip', kept_in: bank.id, opening: { date: ds(S), amount: amt(R.int(10, 100) * 1000) } }; goals.push(trip); }
  if (sav) { rainy = { id: nid(), name: 'Rainy day', kept_in: sav.id, opening: { date: ds(S), amount: amt(R.int(10, 50) * 1000) } }; goals.push(rainy); }
  let plan = null;
  const lineIds = [];
  if (R.chance(opts.planShare === undefined ? 0.5 : opts.planShare)) {
    plan = { lines: [], free: { per: 'month', amount: amt(R.int(30, 90) * 1000) } };
    for (const nm of ['Food', 'Transport'].slice(0, R.int(0, 2))) { const id = nid(); plan.lines.push({ id, name: nm, per: 'month', amount: amt(R.int(10, 60) * 1000) }); lineIds.push(id); }
    const r = R();
    if (r < 0.3) bank.opening.split = { free: Number((plan.free.amount * R.int(2, 10) / 10).toFixed(dec)) };
    else if (r < 0.45 && plan.lines.length) bank.opening.split = { lines: { [plan.lines[0].id]: Number((plan.lines[0].amount / 2).toFixed(dec)) } };
  }

  // ---------- what happens, day by day ----------
  const byDay = {}; // day -> list of events (unordered)
  const add = (d, e) => { (byDay[d] = byDay[d] || []).push(e); };
  const late = R() < 0.6; // this life has late or missing items
  function occsOf(s, lo, hi) {
    const out = [];
    const sch = s.schedule;
    if (sch.frequency === 'monthly') {
      let [y, m] = ymd(lo); m -= 1;
      for (;;) { const n = dayIn(y, m, sch.day); if (n > hi) break; if (n >= lo) out.push(n); m += 1; if (m > 12) { m = 1; y += 1; } }
    } else {
      const step = sch.frequency === 'weekly' ? 7 : 14;
      let a = sch.from ? dn(sch.from) : lo; if (!sch.from) while (weekday(a) !== WDN.indexOf(sch.weekday)) a += 1;
      for (let n = a + Math.ceil((lo - a) / step) * step; n <= hi; n += step) out.push(n);
    }
    return out.map((due) => ({ due, land: shift(due, s.weekend_holiday) }));
  }
  for (const s of income) {
    for (const o of occsOf(s, S - 40, END)) {
      if (o.due <= S || o.land <= S) continue; // inside the opening
      const r = R();
      let d = o.land, told = null;
      if (late && r < 0.12) d = o.land + R.int(1, 4);
      else if (r < 0.2) d = o.land - R.int(1, 2);
      else if (late && r < 0.25) continue; // never seen
      if (d <= S) d = S + 1;
      if (R.chance(0.1)) told = d + 1;
      add(d, { kind: 'pay_in', account: s.account, amount: s.amount, settles: s.id + '@' + ds(o.due), _told: told });
    }
  }
  for (const s of bills) {
    for (const o of occsOf(s, S - 40, END)) {
      if (o.due <= S || o.land <= S) continue;
      const r = R();
      if (late && r < 0.06) { add(o.land, { kind: 'skip', account: s.account, settles: s.id + '@' + ds(o.due) }); continue; }
      if (late && r < 0.09) continue; // never paid
      let d = o.land;
      if (late && r < 0.2) d = o.land + R.int(1, 5);
      let a = s.amount;
      if (s.name === 'Power and water' && R.chance(0.5)) a = Number((a * (0.85 + R() * 0.3)).toFixed(dec));
      add(d, { kind: 'bill_paid', account: s.account, amount: a, settles: s.id + '@' + ds(o.due), _told: R.chance(0.08) ? d + 1 : null });
    }
  }

  // everyday spending, refunds, transfers, money in, set-asides
  const lineFor = () => (plan ? (lineIds.length && R.chance(0.5) ? R.pick(lineIds) : 'free') : null);
  for (let d = S + 1; d <= END; d++) {
    const n = R.int(0, 3);
    for (let i = 0; i < n; i++) {
      const r = R();
      const line = lineFor();
      if (r < 0.35) add(d, Object.assign({ kind: 'spend', account: bank.id, amount: amt(R.int(5, 120) * 100, true) }, line ? { line } : {}));
      else if (r < 0.55 && cards.length) {
        const c = R.pick(cards);
        const e = Object.assign({ kind: 'spend', account: c.card.id, amount: amt(R.int(5, 300) * 100, true) }, line ? { line } : {});
        if (R.chance(0.25)) e.posted = ds(d + R.int(1, 3));
        add(d, e);
      } else if (r < 0.7 && cash) add(d, Object.assign({ kind: 'spend', account: cash.id, amount: amt(R.int(3, 40) * 100) }, line ? { line } : {}));
      else if (r < 0.8 && ew) add(d, Object.assign({ kind: 'spend', account: ew.id, amount: amt(R.int(3, 60) * 100, true) }, line ? { line } : {}));
    }
    if (R.chance(0.03) && cards.length) { const c = R.pick(cards); const e = { kind: 'refund', account: c.card.id, amount: amt(R.int(5, 200) * 100, true) }; if (plan && R.chance(0.3)) e.line = lineFor(); if (R.chance(0.3)) e.posted = ds(d + R.int(0, 2)); add(d, e); }
    if (R.chance(0.02)) { const e = { kind: 'refund', account: bank.id, amount: amt(R.int(5, 100) * 100, true) }; if (plan && R.chance(0.4)) e.line = lineFor(); add(d, e); }
    if (R.chance(0.02)) add(d, { kind: 'money_in', account: R.pick(moneyAccts.filter((a) => a !== sav)).id, amount: amt(R.int(1, 30) * 1000) });
    if (cash && R.chance(0.08)) add(d, { kind: 'transfer', from: R.chance(0.8) || !ew ? bank.id : ew.id, to: cash.id, amount: amt(R.int(5, 30) * 1000) });
    if (ew && R.chance(0.06)) add(d, { kind: 'transfer', from: bank.id, to: ew.id, amount: amt(R.int(2, 20) * 1000) });
    if (sav && R.chance(0.03)) add(d, { kind: 'transfer', from: bank.id, to: sav.id, amount: amt(R.int(10, 50) * 1000) });
    if (trip && R.chance(0.04)) add(d, { kind: 'set_aside', account: bank.id, goal: trip.id, amount: amt(R.int(5, 20) * 1000) });
    if (trip && R.chance(0.015)) add(d, { kind: 'spend', account: bank.id, goal: trip.id, amount: amt(R.int(5, 60) * 1000) });
    if (rainy && R.chance(0.01)) add(d, { kind: 'spend', account: sav.id, goal: rainy.id, amount: amt(R.int(5, 40) * 1000) });
  }

  // cards: the generator's own rough ledger, to know what to pay. A payment in full, in part, or a few days late.
  // Statements and payments are worked out as the days go, so the card events come in the day loop below.
  const cardState = cards.map((g) => ({ g, next: g.firstClose, open: g.lines.reduce((t, l) => t + l.a, 0), carry: 0 }));

  // check-ins: every 5 to 15 days on a few money accounts
  const checkDays = new Set();
  for (let d = S + R.int(3, 12); d <= END; d += R.int(5, 15)) checkDays.add(d);

  // ---------- emit in date order, a random order within a day ----------
  const events = [];
  const pending = []; // card payments to place later
  const r2 = (x) => Number(x.toFixed(dec));
  let curDay = S;
  for (let d = S + 1; d <= END; d++) {
    curDay = d;
    const list = (byDay[d] || []).slice();
    for (const p of pending.filter((p) => p.day === d)) list.push(p.e);
    // shuffle
    for (let i = list.length - 1; i > 0; i--) { const j = R.int(0, i); [list[i], list[j]] = [list[j], list[i]]; }
    if (checkDays.has(d)) {
      for (const acct of moneyAccts) {
        if (acct === sav && !R.chance(0.3)) continue;
        if (acct !== bank && !R.chance(0.6)) continue;
        list.splice(R.int(0, list.length), 0, { kind: 'check', account: acct.id, _check: true });
      }
    }
    for (const e of list) {
      if (e._check) {
        const app = bal[e.account];
        let gap = 0;
        const r = R();
        if (r < 0.55) gap = r2(Math.abs(app) * R() * 0.03);
        else if (r < 0.65 && app > 0) gap = -r2(Math.min(app * 0.02, 2000 * K) * R());
        const fig = r2(app - gap);
        bal[e.account] = fig;
        events.push({ id: nid(), date: ds(d), kind: 'check', account: e.account, amount: fig });
        continue;
      }
      const ev = Object.assign({ id: nid(), date: ds(d) }, e);
      if (ev._told) ev.told = ds(ev._told);
      delete ev._told;
      // the generator's running balance for check figures
      const dl = (id, x) => { if (bal[id] !== undefined) bal[id] = r2(bal[id] + x); };
      if (ev.kind === 'spend' || ev.kind === 'bill_paid') dl(ev.account, -ev.amount);
      else if (ev.kind === 'refund' || ev.kind === 'money_in' || ev.kind === 'pay_in') dl(ev.account, ev.amount);
      else if (ev.kind === 'transfer') { dl(ev.from, -ev.amount); dl(ev.to, ev.amount); }
      else if (ev.kind === 'card_payment') dl(ev.from, -ev.amount);
      for (const cs of cardState) {
        if (ev.account === cs.g.card.id && (ev.kind === 'spend' || ev.kind === 'refund')) {
          const pd = ev.posted ? dn(ev.posted) : d;
          const x = ev.kind === 'spend' ? ev.amount : -ev.amount;
          if (pd <= cs.next) cs.open = r2(cs.open + x); else (cs.later = cs.later || []).push({ pd, x });
        }
      }
      events.push(ev);
    }
    // card closes at the end of the day: plan the payment of the statement
    for (const cs of cardState) {
      const g = cs.g;
      // an opening statement still to pay
      for (const st of g.stmts) {
        if (st.planned) continue;
        st.planned = true;
        planPay(g, st);
      }
      if (d === cs.next) {
        const amtSt = r2(cs.open + cs.carry);
        cs.carry = 0;
        const due = g.dueOf(d), land = shift(due, g.payRule);
        cs.open = 0;
        cs.next = g.closeAfter(d);
        for (const l of cs.later || []) if (l.pd <= cs.next) cs.open = r2(cs.open + l.x);
        cs.later = (cs.later || []).filter((l) => l.pd > cs.next);
        if (amtSt > 0) {
          const paid = planPay(g, { close: d, due, land, amt: amtSt });
          if (paid < amtSt) cs.carry = r2(amtSt - paid);
        } else cs.carry = amtSt; // a credit carries
      }
    }
  }
  function planPay(g, st) {
    if (st.land > END) return st.amt;
    const r = R();
    let a = st.amt, day = st.land;
    if (r < 0.1) a = r2(st.amt * (0.5 + R() * 0.4));
    else if (late && r < 0.2) day = st.land + R.int(1, 4);
    if (day <= curDay) day = curDay + 1; // never on a day already written
    pending.push({ day, e: { kind: 'card_payment', from: g.card.payment.from, card: g.card.id, amount: a, settles: g.card.id + '@' + ds(st.due) } });
    return a;
  }

  // ---------- asks ----------
  const asks = new Set([S, S + 1]);
  for (let i = 0; i < (opts.asks || 8); i++) asks.add(S + R.int(1, days));
  // pay days and the days around them are where the rules bite
  const p0 = occsOf(pay, S + 1, END).slice(0, 3);
  for (const o of p0) { asks.add(o.land); asks.add(o.land + 1); asks.add(o.land - 1); }
  const askDays = [...asks].filter((d) => d >= S && d <= END).sort((a, b) => a - b).map(ds);

  return {
    life: 'fuzz-' + seed,
    title: 'Fuzz life ' + seed,
    currency: cur,
    window: { from: ds(S), to: ds(END) },
    main_bank: bank.id,
    holidays,
    accounts,
    income,
    bills,
    goals,
    plan: plan || undefined,
    events,
    askDays,
  };
}

module.exports = { genLife };
