#!/usr/bin/env node
// The look ahead, as a small reference model (foundation_review/SCHEMA_V3.md section 12).
//
// It reads one scenario (scenarios/*.json: accounts, income, bills, goals, plan,
// holidays, events) and an "as of" day, and returns every figure Home needs:
// bank today per account with its age, safe to spend (headline, per-account
// headroom, warnings, later on), days to next pay, due before next pay, not
// seen yet, each card's and loan's next payment, the places' money, total, and
// the check-in list and fillers.
//
// It follows DECISIONS_ROUND2.md sections A, B, F, G, H and I (I wins over
// anything earlier, then H). Where a line below carries a tag like [H3] or [B9], that decision is
// the reason for it. Plain code, no dependencies, every amount in whole minor
// units, every date a whole day number (D8). It is a reference for the engine
// and for tests, never loaded by the app.
'use strict';

const DIGITS = { JPY: 0, PHP: 2, USD: 2, EUR: 2, GBP: 2, CHF: 2 };
const HORIZON_MIN_DAYS = 45;      // SCHEMA 10.3 step 1
const LATER_ON_DAYS = 365;        // [B11] warnings look 12 months ahead
const NO_PAY_DUE_DAYS = 30;       // [F13] "due in the next 30 days"
const POSTING_WINDOW = 1;         // [F4] working days, unless the account says otherwise
const ROUGH_MARGIN = 0.10;        // [H9] a rough (est) line matches an import within 10%
const SPEND_TYPES = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };   // spendFrom defaults true (SCHEMA 10.3)
const OWED_TYPES = { card: 1, loan: 1, paylater: 1 };              // they own their payment day [B5, E6]
const END_OF_DAY = 'T24';         // an opening typed with no time covers its whole day (README rule 2)

// ---------- days (whole day numbers, D8) ----------
const MS = 86400000;
function dayNum(s) { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / MS); }
function dayStr(n) { return new Date(n * MS).toISOString().slice(0, 10); }
function weekdayOf(n) { return new Date(n * MS).getUTCDay(); }   // 0 is Sunday
function ymOf(n) { const d = new Date(n * MS); return [d.getUTCFullYear(), d.getUTCMonth() + 1]; }
// Day `day` of month m in year y; a day past the month's end, or 'last', is the month's last day (10.8).
function dayIn(y, m, day) {
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = day === 'last' ? last : Math.min(day, last);
  return Math.round(Date.UTC(y, m - 1, d) / MS);
}
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function short(n) { const d = new Date(n * MS); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }   // "27 Nov", for sums a person reads

// ---------- amounts ----------
function minor(x, cur) { return Math.round(x * Math.pow(10, DIGITS[cur] === undefined ? 2 : DIGITS[cur])); }
// [I2] Interest for one month on a balance: balance x yearly rate (percent) / 12, rounded half up to
// the minor unit. Nothing on a balance at or below zero. Whole-number maths, so x.5 always goes up.
function interestOn(bal, apr) {
  if (!apr || bal <= 0) return 0;
  const k = BigInt(Math.round(apr * 10000)), den = 1200n * 10000n;
  return Number((2n * BigInt(bal) * k + den) / (2n * den));
}
function fmt(n, cur) {
  const d = DIGITS[cur] === undefined ? 2 : DIGITS[cur];
  const neg = n < 0; n = Math.abs(n);
  const whole = String(Math.floor(n / Math.pow(10, d))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = d ? '.' + String(n % Math.pow(10, d)).padStart(d, '0') : '';
  return (neg ? '-' : '') + whole + frac;
}

// ---------- the calendar: working days and the weekend and holiday rule [F17] ----------
function makeCalendar(h) {
  const closed = new Set([...(h.dates || []), ...(h.bank_closed || [])].map(x => dayNum(x.date)));
  const working = n => { const w = weekdayOf(n); return w !== 0 && w !== 6 && !closed.has(n); };
  function shift(n, rule) {
    if (rule === 'move earlier') while (!working(n)) n--;
    else if (rule === 'move later') while (!working(n)) n++;
    return n;
  }
  function addWorking(n, k) { while (k > 0) { n++; if (working(n)) k--; } return n; }
  function lastWorking(y, m) { let n = dayIn(y, m, 'last'); while (!working(n)) n--; return n; }
  return { working, shift, addWorking, lastWorking };
}

// ---------- expected items ----------
// The due days of one rule from `start` to `to`, before any move. `key` picks an amount_by_day entry.
function dueDays(r, start, to, cal) {
  const out = [];
  const f = r.frequency;
  if (f === 'monthly') {
    const days = r.days || [r.day];
    let [y, m] = ymOf(start);
    for (; dayIn(y, m, 1) <= to; m++) for (const d of days) out.push({ due: dayIn(y, m, d), key: d });
  } else if (f === 'every_n_months') {
    let [y, m] = ymOf(dayNum(r.from));
    for (; dayIn(y, m, r.day) <= to; m += r.n) out.push({ due: dayIn(y, m, r.day), key: r.day });
  } else if (f === 'every_n_weeks' || f === 'weekly') {
    let due = r.from ? dayNum(r.from) : start;
    if (!r.from) while (weekdayOf(due) !== WEEKDAYS[r.weekday]) due++;
    for (; due <= to; due += 7 * (r.n || 1)) out.push({ due });
  } else if (f === 'months_list') {                       // [H7] monthsList: one day in some months of each year
    for (let [y] = ymOf(start); dayIn(y, 1, 1) <= to; y++) for (const mo of r.months) out.push({ due: dayIn(y, mo, r.day) });
  } else if (f === 'yearly') {                            // [H7] year: one date each year, 'MM-DD'
    const [mo, d] = r.date.split('-').map(Number);
    for (let [y] = ymOf(start); dayIn(y, 1, 1) <= to; y++) out.push({ due: dayIn(y, mo, d) });
  } else if (f === 'last_workday') {                      // [H7] the last working day of each month (needs no move)
    for (let [y, m] = ymOf(start); dayIn(y, m, 1) <= to; m++) out.push({ due: cal.lastWorking(y, m) });
  } else if (f === 'once') {                              // [H7] once
    out.push({ due: dayNum(r.date) });
  }
  // 'none' (no fixed day): no future money is expected [B4]
  return out;
}

// [H2] A schedule holds from a date: its first rule, then each change from its own date. An edit never
// rewrites an occurrence before its date. Every occurrence is named by its schedule and its due date
// before any move (`rent@2026-12-27`), everywhere: links, amounts and item ids [B8, H2].
function occurrences(s, kind, cal, from, to, cur) {
  const parts = [{ from: -Infinity, rule: s.schedule || {}, amount: s.amount }]
    .concat((s.changes || []).map(c => ({ from: dayNum(c.from), rule: c.schedule, amount: c.amount != null ? c.amount : s.amount })))
    .sort((a, b) => a.from - b.from);
  const first = s.schedule && s.schedule.from ? dayNum(s.schedule.from) : -Infinity;
  const count = s.schedule && s.schedule.count;
  const out = [];
  parts.forEach((p, i) => {
    const until = parts[i + 1] ? parts[i + 1].from : Infinity;
    const start = p.rule.from ? Math.min(from, dayNum(p.rule.from)) : Math.max(from, p.from);
    for (const { due, key } of dueDays(p.rule, start, to, cal)) {
      if (due < p.from || due >= until || due < first || (count && out.length >= count)) continue;
      const amt = minor(s.amount_by_day ? s.amount_by_day[String(key)] : p.amount, cur);
      out.push({ id: s.id + '@' + dayStr(due), sid: s.id, kind, acct: s.account, to: s.to, place: s.place,
        due, land: p.rule.frequency === 'last_workday' ? due : cal.shift(due, s.weekend_holiday),
        amount: amt, startsPeriod: !!s.starts_period, name: s.name });
    }
  });
  return out.filter(o => o.land >= from || o.due >= from).sort((a, b) => a.land - b.land || (a.id < b.id ? -1 : 1));
}

// What a minimum rule asks on a balance: { pct, floor } or { fixed }, never more than the balance [H7].
function minPay(rule, bal, cur) {
  if (!rule) return bal;
  const want = rule.fixed != null ? minor(rule.fixed, cur) : Math.max(minor(rule.floor || 0, cur), Math.round(bal * rule.pct / 100));
  return Math.min(bal, want);
}
// The planned extra on a day: the latest `extra_steps` entry that has started [H7, B5].
function extraOn(steps, day, cur) {
  let x = 0;
  for (const st of steps || []) if (dayNum(st.from) <= day) x = minor(st.amount, cur);
  return x;
}

// ---------- the model ----------
// sc: a scenario object. asOf: 'YYYY-MM-DD'. opts.at: 'end of day' (default) or 'start of day'.
// opts.plan (optional): { lines: [{ name, acct, per, amount, left }], free: { acct, per, amount, left } },
// in minor units; with no opts.plan it is worked out from sc.plan and the opening split [B2].
// opts.mostlyBeforePay: the person's answer to the filler question [A4].
function lookahead(sc, asOf, opts = {}) {
  const at = opts.at || 'end of day';
  const today = dayNum(asOf);
  const knownTo = at === 'start of day' ? today - 1 : today;   // events the app has heard of by now
  const cal = makeCalendar(sc.holidays || {});
  const home = sc.currency;
  const acct = {}; for (const a of sc.accounts) acct[a.id] = a;
  const cur = id => acct[id].currency;
  const openDay = id => dayNum(acct[id].opening.date);
  const isOwed = id => !!(acct[id] && OWED_TYPES[acct[id].kind]);
  const m = (x, id) => minor(x, id ? cur(id) : home);
  const postingDays = id => acct[id].posting_days == null ? POSTING_WINDOW : acct[id].posting_days;
  const res = { asOf, at, accounts: {}, cards: {}, owed: {}, places: {}, warnings: [], laterOn: [] };

  // ----- events the app knows of [H1, F24] -----
  // `told` is when the app first heard of a record (a date, or a date and a time; null: never). It orders
  // records on the same day; with no time, records keep the order they are listed in. Every amount is
  // turned into minor units here: `a` in the currency of the side it leaves, `a2` of the side it reaches [H5].
  // [I5] A record moved from 38.31 is told at its own time when it has one, else at the copy's last save;
  // records on one day keep the old list order (the order in the file).
  const events = [];
  (sc.events || []).forEach((e, i) => {
    if (e.told === null) return;
    const key = String(e.told || (e.moved ? e.own_time || sc.moved_copy.saved : e.date));
    if (dayNum(key) > knownTo || dayNum(e.date) > knownTo) return;
    const x = Object.assign({}, e, { day: dayNum(e.date), key, idx: i });
    const side = e.account || e.from;
    if (side && acct[side] && e.amount != null) x.a = m(e.amount, side);
    if (e.amount_out != null) x.a = m(e.amount_out, e.from);
    const other = e.card || e.to;
    if (other && acct[other]) x.a2 = e.amount_in != null ? m(e.amount_in, other) : m(e.amount, other);
    events.push(x);
  });

  // [A6, H9] An imported line (statement or screenshot) replaces the typed line it matches: same account and
  // kind, its posting day within the account's posting window from the typed day, and the same amount, or
  // within 10% when the typed line is rough (`est`). The typed line is gone (goneBy the import).
  // Matching to expected items and the statement-over-screenshot rank are in matching's own test file.
  for (const imp of events.filter(e => e.source && e.source !== 'typed')) {
    const when = imp.posted ? dayNum(imp.posted) : imp.day;
    const hit = events.find(t => !t.gone && (!t.source || t.source === 'typed') && t.kind === imp.kind && t.account === imp.account
      && when >= t.day && when <= cal.addWorking(t.day, postingDays(t.account))
      && (t.est ? Math.abs(imp.a - t.a) <= Math.round(t.a * ROUGH_MARGIN) : imp.a === t.a));
    if (hit) { hit.gone = true; hit.goneBy = imp.id; }
  }
  const live = () => events.filter(e => !e.gone);
  const settledBy = {};
  for (const e of live()) for (const s of [].concat(e.settles || [])) settledBy[s] = e;

  // ----- expected items from schedules -----
  const earliest = Math.min(...sc.accounts.map(a => dayNum(a.opening.date))) - 70;
  const farEnd = today + LATER_ON_DAYS + 62;
  const items = [];
  for (const s of sc.income || []) if (acct[s.account]) items.push(...occurrences(s, 'income', cal, earliest, farEnd, cur(s.account)));
  for (const s of sc.bills || []) {
    const kind = s.kind === 'transfer' ? 'transfer' : s.kind === 'auto_spend' ? 'auto' : 'bill';
    items.push(...occurrences(s, kind, cal, earliest, farEnd, cur(s.account)));
  }
  // An item due or landing on or before its account's opening is inside the opening figure [rule 2],
  // unless setup was told it has not gone out yet [F20].
  const covered = o => {
    const od = openDay(o.acct), notOut = acct[o.acct].opening.not_gone_out || [];
    return (o.land <= od || o.due <= od) && !notOut.includes(o.id);
  };
  for (const o of items) o.settled = !!settledBy[o.id] || covered(o);
  // [B5, H7] autoSpend logs itself: on its landing day it writes its own spend, unless something settled it.
  for (const o of items.filter(x => x.kind === 'auto' && !x.settled && x.land <= knownTo)) {
    events.push({ id: 'auto:' + o.id, kind: 'spend', account: o.acct, a: o.amount, day: o.land, key: dayStr(o.land), idx: -1, settles: o.id });
    o.settled = true;
  }
  const billPlace = {}; for (const s of sc.bills || []) if (s.place) billPlace[s.id] = s.place;

  // [F12] One stream starts periods: the first income entered that starts one and has a day.
  const periodStream = (sc.income || []).find(s => s.starts_period && s.schedule && s.schedule.frequency !== 'none' && acct[s.account]);
  const windowEnd = o => cal.addWorking(o.land, postingDays(o.acct));
  // [G3, H8] Past its landing day but inside the posting window: late, still expected, still counted.
  const lateExpected = o => o.land < today && today <= windowEnd(o);
  const pays = periodStream ? items.filter(o => o.sid === periodStream.id) : [];
  const nextPays = pays.filter(o => !o.settled && (o.land >= today || lateExpected(o)));   // [F3, H8]

  // ----- bank today per account [A1, B7, H1] -----
  const delta = (e, id) => {
    switch (e.kind) {
      case 'pay_in': case 'money_in': case 'refund': return e.account === id ? e.a : 0;
      case 'spend': case 'bill_paid': return e.account === id ? -e.a : 0;
      case 'card_payment': case 'repay': return e.from === id ? -e.a : 0;   // [H5] the paying side takes what left it
      case 'transfer': case 'convert': return e.from === id ? -e.a : e.to === id ? e.a2 : 0;
      default: return 0;   // set_aside and skip move no money; checks set a base, below
    }
  };
  // [H1] Is event e already inside a check (or the opening) of account id? Events dated before the check's
  // day are; on its day, those the app heard of before it. A bank line with a posting date counts by that date.
  // [I1] An "available" bank check already has pending debits off: every event dated on or before its day
  // is inside it. A "current" check, and one that does not say, follows the H1 rule above.
  function inside(e, c, id) {
    if (c.avail === 'available') return e.day <= c.day;
    const d = e.posted && e.account === id && !isOwed(id) ? dayNum(e.posted) : e.day;
    if (d !== c.day) return d < c.day;
    return e.key < c.key || (e.key === c.key && e.idx < c.idx);
  }
  const openingOf = id => ({ day: openDay(id), key: acct[id].opening.told || acct[id].opening.date + END_OF_DAY, idx: -1 });
  const byTime = (x, y) => x.day - y.day || (x.key < y.key ? -1 : x.key > y.key ? 1 : x.idx - y.idx);
  function bankInfo(id) {
    let base = Object.assign(openingOf(id), { amount: m(acct[id].opening.amount, id) });
    const checks = live().filter(e => e.kind === 'check' && e.account === id).sort(byTime);
    const moves = live().filter(e => delta(e, id) !== 0);
    const fillers = [];
    for (const c of checks) {
      // [A3] the filler is worked out every time: what the events say minus what the check shows.
      // [H1] Two check-ins on one day: the later one's stretch starts at the earlier one.
      // [I1] An event can be inside an earlier available check and not yet inside a later current one
      // (a debit not posted yet): it is added back, so it is not lost.
      const computed = base.amount + moves.filter(e => inside(e, c, id) && !inside(e, base, id)).reduce((t, e) => t + delta(e, id), 0)
        - moves.filter(e => inside(e, base, id) && !inside(e, c, id)).reduce((t, e) => t + delta(e, id), 0);
      const amount = m(c.amount, id);
      fillers.push(makeFiller(id, c.day > base.day ? base.day + 1 : c.day, c.day, computed - amount));
      base = { day: c.day, key: c.key, idx: c.idx, avail: c.avail, amount };
    }
    const bank = base.amount + moves.filter(e => !inside(e, base, id)).reduce((t, e) => t + delta(e, id), 0);
    return { bank, asOfDay: base.day, fillers };
  }

  // [A3, A4] The filler for a stretch from `first` to `last` (whole days). Split by days at each period start
  // in the stretch, or all to the older period when the person says "mostly before pay".
  // Positive means more went out than was logged.
  function makeFiller(id, first, last, amount) {
    const starts = live().filter(e => e.kind === 'pay_in' && periodStream && [].concat(e.settles || []).some(s => s.startsWith(periodStream.id + '@')) && e.day > first && e.day <= last).map(e => e.day); // [F8]
    const cuts = [first, ...starts, last + 1];
    const days = last - first + 1;
    const parts = [];
    let given = 0;
    for (let i = 0; i < cuts.length - 1; i++) {
      const n = cuts[i + 1] - cuts[i];
      const share = opts.mostlyBeforePay ? (i === 0 ? amount : 0) : i === cuts.length - 2 ? amount - given : Math.round(amount * n / days);
      given += share;
      parts.push({ from: dayStr(cuts[i]), to: dayStr(cuts[i + 1] - 1), days: n, amount: share });
    }
    return { account: id, from: dayStr(first), to: dayStr(last), amount, parts };
  }

  // ----- cards [F5, F6, F7, F14, F18, H3, H4, H7] -----
  function cardInfo(id) {
    const c = acct[id], op = c.opening, pay = c.payment;
    const notSure = c.statement_close_day == null;   // [H4] close day "not sure"
    const st = op.statement || null;
    const payOf = due => ({ id: id + '@' + dayStr(due), due, land: cal.shift(due, pay.weekend_holiday) });
    const payAfterClose = cl => { const [y, mo] = ymOf(cl); return payOf(dayIn(y, mo + pay.months_after_close, pay.day)); };
    // What a payment is planned to be: in full, or for a card that carries a balance, its minimum plus any planned extra [H7].
    const planned = (amt, day) => c.carries ? Math.min(amt, minPay(pay.min_rule, amt, cur(id)) + extraOn(pay.extra_steps, day, cur(id))) : amt;
    // Lines by posting day. A posting day the app has not seen yet is unknown: the buy day is used [F18].
    const open = openingOf(id);
    const carried0 = st && !st.paid ? m(st.amount, id) : 0;
    const lines = [{ day: openDay(id), amount: m(op.current, id) - carried0, what: 'opening' }];
    const payments = [];
    for (const e of live()) {
      if (inside(e, open, id)) continue;
      if (e.account === id && (e.kind === 'spend' || e.kind === 'refund')) {
        const posted = e.posted && dayNum(e.posted) <= knownTo ? dayNum(e.posted) : e.day;
        lines.push({ day: posted, amount: e.kind === 'spend' ? e.a : -e.a });   // [F5] a refund lowers the cycle it posts in
      }
      if ((e.kind === 'card_payment' && e.card === id) || (e.kind === 'repay' && e.to === id)) payments.push({ day: e.day, amount: e.a2, settles: [].concat(e.settles || []) });   // [H5] what arrived
    }
    const sClose = st ? dayNum(st.closed) : null;
    const closes = [];
    if (!notSure) { const [y, mo] = ymOf(sClose); for (let k = 1; k < 30; k++) closes.push(dayIn(y, mo + k, c.statement_close_day)); }   // [F6] a close day never moves

    // [H3, I2, I3] The statements, worked out close by close up to `last`, with what each still holds on `upTo`.
    // A statement is what was carried over, plus interest on it, plus the lines in the cycle, less payments
    // and refunds since the last close. Carried over is only what is left of statements whose payment day
    // has come by this close [I3]: a statement still waiting for its payment day stays on its own and is
    // never folded into the next one. Interest is added at the close on what is carried over, x apr / 12,
    // rounded half up [I2]. A payment goes to the statement it settles (or the one that statement was
    // carried into), then to the oldest statement still owing, then to the open cycle; so a statement still
    // waiting keeps its own payment too. With one payment a month and the payment day before the next
    // close, this is exactly H3.
    function statementsTo(last, upTo) {
      const list = [];
      if (notSure) return { list, open: 0 };
      list.push(Object.assign(payAfterClose(sClose), { close: sClose, amount: m(st.amount, id), left: carried0, interest: 0, into: null }));
      const evs = lines.map(l => ({ day: l.day, line: l.amount })).concat(payments.map(p => ({ day: p.day, pay: p.amount, settles: p.settles })))
        .sort((x, z) => x.day - z.day);
      let open = 0, i = 0;
      const apply = until => {
        for (; i < evs.length && evs[i].day <= until; i++) {
          const ev = evs[i];
          if (ev.line != null) { open += ev.line; continue; }
          let left = ev.pay;
          const named = ev.settles.map(sid => list.find(b => b.id === sid)).filter(Boolean).map(b => { while (b.into) b = b.into; return b; });
          for (const b of named.concat(list)) {
            if (left <= 0) break;
            if (b.into || b.left <= 0) continue;
            const take = Math.min(left, b.left);
            b.left -= take; left -= take;
          }
          open -= left;
        }
      };
      for (const cl of closes) {
        if (cl > last) break;
        apply(cl);
        const folding = list.filter(b => !b.into && b.land <= cl);
        const carried = folding.reduce((t, b) => t + b.left, 0);
        const interest = interestOn(carried, c.apr);
        const amount = carried + interest + open;
        const nb = Object.assign(payAfterClose(cl), { close: cl, amount, left: amount, interest, into: null });
        for (const b of folding) { b.into = nb; b.leftAtFold = b.left; b.left = 0; }
        list.push(nb);
        open = 0;
      }
      apply(upTo);
      return { list, open };
    }
    // [H3, I2] Owed at the end of a day: what was carried at the opening, plus every line and the interest
    // added at each close by then, less every payment.
    const interestTo = day => statementsTo(day, day).list.reduce((t, b) => t + b.interest, 0);
    const owedAt = day => carried0 + lines.filter(l => l.day <= day).reduce((t, l) => t + l.amount, 0)
      - payments.filter(p => p.day <= day).reduce((t, p) => t + p.amount, 0) + (notSure ? 0 : interestTo(day));
    const stmtAmount = cl => { const b = statementsTo(cl, cl).list.find(x => x.close === cl); return b ? b.amount : owedAt(cl); };
    // A card check sets the statement it names and what is owed now; the gaps are its fillers [A3].
    const fillers = [];
    for (const e of live().filter(x => x.kind === 'card_check' && x.account === id)) {
      let gap = 0;
      if (e.statement) {
        const cl = dayNum(e.statement.closed);
        const g = m(e.statement.amount, id) - stmtAmount(cl);
        if (g) lines.push({ day: cl, amount: g, what: 'filler' });
        gap += g;
      }
      const g2 = m(e.current, id) - owedAt(e.day);
      if (g2) lines.push({ day: e.day, amount: g2, what: 'filler' });
      gap += g2;
      fillers.push({ account: id, day: e.date, amount: gap });
    }
    const owedNow = owedAt(knownTo) + lines.filter(l => l.day > knownTo).reduce((t, l) => t + l.amount, 0);

    // The points where something fell due: each closed statement, or with the close day not sure, each
    // payment day gone by (everything owed then is due, so each one holds the one before) [H4]. Then the
    // next one, still to come. `basis` is what a point still holds: for a statement carried into a later
    // one, what it held when it was carried.
    const points = [];
    let nextPoint = null;
    if (!notSure) {
      const S = statementsTo(knownTo, knownTo);
      for (const b of S.list) points.push(Object.assign(b, { closed: b.close, basis: b.into ? b.leftAtFold : b.left,
        paid: b.close === sClose ? (st.paid || !!settledBy[b.id]) : !!settledBy[b.id] }));
      const nc = closes.find(cl => cl > knownTo);
      if (nc != null) nextPoint = Object.assign(payAfterClose(nc), { closes: nc });
    } else {
      const [y, mo] = ymOf(openDay(id));
      for (let k = 0; k < 40 && !nextPoint; k++) {
        const p = payOf(dayIn(y, mo + k, pay.day));
        if (p.land <= openDay(id) || p.due <= openDay(id)) continue;   // inside the opening
        if (p.land < today) {
          const prev = points[points.length - 1];
          const pt = Object.assign(p, { amount: owedAt(p.land), paid: !!settledBy[p.id], into: null, left: owedAt(p.land) });
          pt.basis = pt.amount;
          if (prev) prev.into = pt;
          points.push(pt);
        } else if (!settledBy[p.id]) nextPoint = p;
      }
    }
    // [H3, I6] Each unpaid point asks only what an older unpaid one carried into it does not already ask,
    // so nothing counts twice. A statement at or below zero is a credit carried on: nothing is due and no
    // item is made.
    const unpaid = [];
    for (const p of points) p.held = 0;
    let stillAsked = 0, projCarried = 0;
    for (const p of points) {
      const item = !p.paid && p.basis > 0;
      if (item) {
        p.part = c.carries ? planned(p.amount, p.due) : Math.max(0, p.basis - p.held);
        p.asks = c.carries ? p.part : p.basis;
        unpaid.push(p);
      }
      const asked = !item ? 0 : c.carries ? p.part + p.held : p.basis;
      if (p.into) p.into.held += asked;
      else {
        stillAsked += asked;
        // [I2] what will be carried into the next close once the asked payments are made, for its interest
        if (!notSure && nextPoint && p.land <= nextPoint.closes) projCarried += p.left - asked;
      }
    }
    const label = notSure ? 'all owed' : null;
    const rest = Math.max(0, owedNow - stillAsked + (nextPoint && !notSure ? interestOn(projCarried, c.apr) : 0));
    const nextAmount = nextPoint ? planned(rest, nextPoint.due) : 0;
    // What comes off the paying account, and when: each unpaid point on its payment day, the rest on the
    // next payment day [F14]. Close day not sure: everything owed on the next payment day [H4].
    const walkItems = unpaid.map(p => ({ land: p.land, amount: p.part, label: c.name + (notSure ? ', all owed' : ' statement closed ' + short(p.closed)) }));
    if (nextPoint) walkItems.push({ land: nextPoint.land, amount: nextAmount, label: c.name + (notSure ? ', all owed' : ' still open, closes ' + short(nextPoint.closes)) });
    // The next payment the card screen shows [F7]: the oldest unpaid point, else the next one "so far".
    const next = unpaid.length
      ? { item: unpaid[0].id, amount: unpaid[0].asks, payment_date: dayStr(unpaid[0].land), statement: label || 'closed', closed_on: unpaid[0].closed != null ? dayStr(unpaid[0].closed) : undefined }
      : nextPoint && { item: nextPoint.id, amount: nextAmount, payment_date: dayStr(nextPoint.land), statement: label || 'open', closes_on: nextPoint.closes != null ? dayStr(nextPoint.closes) : undefined };
    const cardItems = unpaid.map(p => ({ id: p.id, due: p.due, land: p.land, amount: p.part, statement: label || 'closed' }));
    if (nextPoint) cardItems.push({ id: nextPoint.id, due: nextPoint.due, land: nextPoint.land, amount: nextAmount, statement: label || 'open' });
    return { owedNow, statements: points, next, walkItems, cardItems, fillers, payFrom: pay.from };
  }

  // ----- loans and pay-later: an owed account that owns its payment [B5, E6, F19, H7] -----
  // Each month on its payment day: the usual amount (or what the minimum rule asks on what is owed),
  // plus any planned extra, never more than what is still owed.
  // [I2] On each payment day, interest is added first on what was owed before that day's payment
  // (owed x apr / 12, rounded half up), then the payment is asked on what is owed. Payment days gone by
  // add it to what is owed now, paid or not; payment days to come add it in the look ahead.
  function loanInfo(id) {
    const a = acct[id], pay = a.payment, c = cur(id), open = openingOf(id);
    const repays = live().filter(e => e.kind === 'repay' && e.to === id && !inside(e, open, id)).sort((x, z) => x.day - z.day);
    const days = [];
    const [y, mo] = ymOf(openDay(id));
    for (let k = 0; ; k++) {
      const due = dayIn(y, mo + k, pay.day);
      if (due > farEnd) break;
      const land = cal.shift(due, pay.weekend_holiday);
      if (land <= openDay(id) || due <= openDay(id)) continue;
      days.push({ due, land, iid: id + '@' + dayStr(due) });
    }
    let owed = m(a.opening.owed, id), r = 0;
    for (const d of days) {
      if (d.land > knownTo) break;
      while (r < repays.length && repays[r].day < d.land) owed -= repays[r++].a2;
      owed += interestOn(owed, a.apr);
    }
    while (r < repays.length) owed -= repays[r++].a2;
    const owedNow = owed;
    const loanItems = [];
    let left = owedNow;
    for (const { due, land, iid } of days) {
      if (left <= 0) break;
      if (land > knownTo) left += interestOn(left, a.apr);
      if (settledBy[iid]) continue;
      const amt = Math.min(left, (pay.amount != null ? minor(pay.amount, c) : minPay(pay.min_rule, left, c)) + extraOn(pay.extra_steps, due, c));
      left -= amt;
      loanItems.push({ id: iid, sid: id, kind: 'loan', acct: pay.from, card: id, due, land, amount: amt, settled: false, name: a.name });
    }
    return { owedNow, loanItems, next: loanItems[0] ? { item: loanItems[0].id, amount: loanItems[0].amount, payment_date: dayStr(loanItems[0].land) } : null };
  }

  // ----- everything per account -----
  const banks = {}, cards = {}, loans = {};
  for (const a of sc.accounts) {
    if (a.kind === 'card') cards[a.id] = cardInfo(a.id);
    else if (isOwed(a.id)) loans[a.id] = loanInfo(a.id);
    else banks[a.id] = bankInfo(a.id);
  }
  // Card and loan payment items join the expected items (for due, not seen yet and the check-in list).
  for (const id in cards) for (const ci of cards[id].cardItems) items.push(Object.assign({ kind: 'card', acct: cards[id].payFrom, card: id, settled: false }, ci));
  for (const id in loans) items.push(...loans[id].loanItems);
  const out = o => o.kind !== 'income';
  const fallsDue = o => o.kind !== 'card' || o.statement !== 'open';   // an open statement is not due yet [F7]

  // ----- places: goals and the other kept places, money already set aside [F22, B6, B10, H7] -----
  // A place's money: the opening split (or the goal's opening), plus what was set aside, less what was paid
  // from it: a spend naming it, or a bill whose schedule is paid from it. It never holds less than nothing:
  // paying past it comes from the account's other money.
  const fromPlace = e => e.goal || [].concat(e.settles || []).map(s => billPlace[s.split('@')[0]]).find(Boolean);
  const keptIn = {};
  for (const g of sc.goals || []) {
    const split = ((acct[g.kept_in].opening.split || {}).goals || {})[g.id];
    let amt = split != null ? m(split, g.kept_in) : g.opening && dayNum(g.opening.date) <= knownTo ? m(g.opening.amount, g.kept_in) : 0;
    for (const e of live()) {
      if (e.kind === 'set_aside' && e.goal === g.id) amt += m(e.amount, g.kept_in);
      if ((e.kind === 'spend' || e.kind === 'bill_paid') && fromPlace(e) === g.id) amt -= e.a;   // [H7] paying from a place
    }
    amt = Math.max(0, amt);
    // [E5, H7] A place that refills is next due on the next occurrence of its bill that is not settled yet.
    const nextOf = g.for_bill && items.find(o => o.sid === g.for_bill && !o.settled);
    const due = g.refill && nextOf ? dayStr(nextOf.due) : g.due || (nextOf ? dayStr(nextOf.due) : null);
    res.places[g.id] = { kept: amt, due, account: g.kept_in };
    (keptIn[g.kept_in] = keptIn[g.kept_in] || []).push({ id: g.id, name: g.name, amount: amt });
  }

  // ----- the plan: what is left of this period's budget lines and Free to spend [B1, B2] -----
  // The period started with the last pay of the period stream; before any, the opening split holds what
  // was left at setup [B2]. A spend names its `line` (`free` is Free to spend).
  const plan = opts.plan || planNow();
  function planNow() {
    if (!sc.plan) return {};
    const started = live().filter(e => e.kind === 'pay_in' && periodStream && [].concat(e.settles || []).some(s => s.startsWith(periodStream.id + '@'))).map(e => e.day);
    const lastPay = started.length ? Math.max(...started) : null;
    // [B2, I4] What the opening holds for a line or Free to spend: what the split names, else a share by
    // days left: the days from the setup day to the period's last day, both counted, over the period's days.
    // Each line is rounded down to the minor unit; what that leaves goes to Free to spend, which is then
    // rounded down too. With no period (no fixed pay) the whole amount, as before [B4].
    const opening = {};
    function openingShares(acctId) {
      if (opening[acctId]) return opening[acctId];
      const split = acct[acctId].opening.split || {}, od = openDay(acctId), out = { lines: {}, free: null };
      const before = pays.filter(o => o.land <= od).sort((x, z) => x.land - z.land), after = pays.filter(o => o.land > od).sort((x, z) => x.land - z.land);
      const share = before.length && after.length ? { d: after[0].land - od, D: after[0].land - before[before.length - 1].land } : null;
      let leftOver = 0;   // in minor units x D: what rounding down the lines left
      for (const l of (sc.plan.lines || []).filter(x => x.account === acctId)) {
        const typed = (split.lines || {})[l.id], amount = m(l.amount, acctId);
        if (typed != null) out.lines[l.id] = m(typed, acctId);
        else if (share) { out.lines[l.id] = Math.floor(amount * share.d / share.D); leftOver += amount * share.d - out.lines[l.id] * share.D; }
        else out.lines[l.id] = amount;
      }
      const f = sc.plan.free;
      if (f && f.account === acctId) {
        const amount = m(f.amount, acctId);
        out.free = split.free != null ? m(split.free, acctId) : share ? Math.floor((amount * share.d + leftOver) / share.D) : amount;
      }
      return (opening[acctId] = out);
    }
    const leftOf = (lineId, acctId, amount) => {
      const atOpening = lineId === 'free' ? openingShares(acctId).free : openingShares(acctId).lines[lineId];
      const fromOpening = lastPay === null || lastPay <= openDay(acctId);
      const start = fromOpening ? (atOpening != null ? atOpening : amount) : amount;
      const open = openingOf(acctId);
      const spent = live().filter(e => e.kind === 'spend' && e.line === lineId && e.account === acctId && !inside(e, open, acctId) && (fromOpening || e.day >= lastPay)).reduce((t, e) => t + e.a, 0);
      return start - spent;
    };
    const lines = (sc.plan.lines || []).map(l => ({ name: l.name, acct: l.account, per: l.per, amount: m(l.amount, l.account), left: leftOf(l.id, l.account, m(l.amount, l.account)) }));
    const f = sc.plan.free;
    const free = f && { name: 'Free to spend', acct: f.account, per: f.per, amount: m(f.amount, f.account), left: leftOf('free', f.account, m(f.amount, f.account)) };
    return { lines, free };
  }

  // ----- the horizon (SCHEMA 10.3 step 1, [B4]) -----
  let horizon;
  if (periodStream) {
    const second = nextPays[1] || nextPays[0];
    horizon = Math.max(second ? second.land : today, today + HORIZON_MIN_DAYS);
  } else {
    horizon = today + HORIZON_MIN_DAYS;
    for (const s of sc.bills || []) {
      const fut = items.filter(o => o.sid === s.id && !o.settled && o.land >= today);
      if (fut[1]) horizon = Math.max(horizon, fut[1].land);
    }
  }
  res.horizon = dayStr(horizon);

  // ----- planned spending of later periods (10.3 step 2, [B1, B3, B4]) -----
  // Units (SCHEMA 8, H9: 26 or 27 pays a year) are in their own test file; this is the plain form.
  const perPeriod = (x, startDay, endDay) => {
    if (x.per === 'week') return Math.round(x.amount * (endDay - startDay) / 7);
    if (x.per === 'month' && periodStream && periodStream.schedule.frequency !== 'monthly') return Math.round(x.amount * 12 / paysAYear(periodStream));
    return x.amount;
  };
  function plannedFor(id) {
    const list = [];
    const lines = (plan.lines || []).filter(l => l.acct === id);
    if (plan.free && plan.free.acct === id) lines.push(Object.assign({ name: 'Free to spend' }, plan.free));
    if (!lines.length) return list;
    if (periodStream) {
      const starts = nextPays.filter(p => p.land > today);
      starts.forEach((p, i) => {
        const end = starts[i + 1] ? starts[i + 1].land : p.land + 30;
        for (const l of lines) list.push({ land: p.land, amount: perPeriod(l, p.land, end), label: l.name + ' for the period from ' + short(p.land) });
      });
    } else {
      // [B4] no fixed pay: a monthly amount spread by day, whole units, carried so nothing is lost
      for (const l of lines) {
        const perDay = (l.per === 'week' ? l.amount * 52 : l.amount * 12) / 365;
        let carried = 0;
        for (let d = today + 1; d <= today + LATER_ON_DAYS; d++) {
          const want = Math.round(perDay * (d - today)) - carried;
          carried += want;
          if (want) list.push({ land: d, amount: want, label: l.name + ' (by day)' });
        }
      }
    }
    return list;
  }

  // ----- the walk, one account at a time [B3, B9, F1, F2, F3, F9, F14, H5, H7, H8] -----
  function walk(id, end, minimum) {
    const start = banks[id].bank;
    const why = [{ label: acct[id].name + ' today', amount: start }];
    let bal = start;
    const placeLeft = {};
    for (const g of keptIn[id] || []) { bal -= g.amount; placeLeft[g.id] = g.amount; why.push({ label: g.name + ', kept in it', amount: -g.amount }); }
    if (periodStream) for (const l of (plan.lines || []).filter(x => x.acct === id && x.left)) { bal -= l.left; why.push({ label: l.name + ' left this period', amount: -l.left }); }   // [B1]; no fixed pay: by day instead [B4]
    const steps = [];   // { day, order, amount, label }  order: 0 income, 1 bills, 2 planned spending
    for (const o of items) {
      if (o.settled) continue;
      if (o.kind === 'income' && o.acct === id && (o.land >= today || lateExpected(o)) && o.land <= end) steps.push({ day: Math.max(o.land, today), order: 0, amount: o.amount, label: o.name + ' ' + short(o.land) + (o.land < today ? ', late, still expected' : '') });
      if (['bill', 'transfer', 'auto', 'loan'].includes(o.kind) && o.acct === id && o.land <= end) {
        // [H7] a bill paid from a place takes what the place still holds first; only the rest is new
        const fromIt = o.place && placeLeft[o.place] ? Math.min(placeLeft[o.place], o.amount) : 0;
        if (fromIt) placeLeft[o.place] -= fromIt;
        steps.push({ day: Math.max(o.land, today), order: 1, amount: -(o.amount - fromIt), label: o.name + ' ' + short(o.land) + (o.land < today ? ', late' : '') });
      }
      if (o.kind === 'transfer' && o.to === id && o.land >= today && o.land <= end) steps.push({ day: o.land, order: 0, amount: o.amount, label: o.name + ' in ' + short(o.land) });
    }
    for (const cid in cards) {
      if (cards[cid].payFrom !== id) continue;
      if (cur(cid) !== cur(id)) continue;   // [H5] another currency: left out of the walk and warned, below
      for (const w of cards[cid].walkItems) {
        if (!w.amount) continue;
        const day = Math.min(Math.max(w.land, today), end);   // [F14] beyond the horizon: off at its end
        steps.push({ day, order: 1, amount: -Math.max(0, w.amount), label: w.label + ', paid ' + short(w.land) + (w.land > end ? ', taken at the horizon end' : '') });
      }
    }
    for (const p of plannedFor(id)) if (p.land <= end) steps.push({ day: p.land, order: 2, amount: -p.amount, label: p.label });
    steps.sort((a, b) => a.day - b.day || a.order - b.order);
    let low = bal, lowDay = today, lowAt = 0, firstBelowZero = null;
    for (let i = 0; i < steps.length; i++) {
      bal += steps[i].amount;
      const endOfDay = !steps[i + 1] || steps[i + 1].day !== steps[i].day;
      if (!endOfDay) continue;
      if (bal < low) { low = bal; lowDay = steps[i].day; lowAt = i + 1; }
      if (bal < 0 && firstBelowZero === null) firstBelowZero = steps[i].day;
    }
    for (let i = 0; i < lowAt; i++) why.push({ label: steps[i].label, amount: steps[i].amount });
    why.push({ label: 'minimum', amount: -minimum });
    return { lowest: low, lowestDay: lowDay, headroom: low - minimum, why, firstBelowZero };
  }

  for (const id in banks) {
    const a = acct[id], minimum = m(a.minimum || 0, id);
    const w = walk(id, horizon, minimum);
    const r = res.accounts[id] = {
      bank: banks[id].bank, asOf: dayStr(banks[id].asOfDay), ageDays: today - banks[id].asOfDay,   // [A1, F24]
      currency: a.currency, minimum, lowest: w.lowest, lowestDay: dayStr(w.lowestDay), headroom: w.headroom,
      spendFrom: a.spend_from != null ? a.spend_from : !!SPEND_TYPES[a.kind] && a.currency === home,
      why: whyText(w.why, w.headroom, a.currency), fillers: banks[id].fillers };
    if (w.headroom < 0) res.warnings.push({ account: id, code: 'below_minimum', day: r.lowestDay, short: -w.headroom, text: `${a.name} goes ${fmt(-w.headroom, a.currency)} below its minimum on ${r.lowestDay}` });   // [F9]
    const later = walk(id, today + LATER_ON_DAYS, 0);   // [B11]
    if (later.firstBelowZero !== null && later.firstBelowZero > horizon) res.laterOn.push({ account: id, day: dayStr(later.firstBelowZero), text: `Later on: ${a.name} goes below zero in ${dayStr(later.firstBelowZero).slice(0, 7)}` });
  }
  for (const id in cards) {
    const k = cards[id];
    res.cards[id] = { owedNow: k.owedNow, next: k.next, statements: k.statements.map(s => ({ closed: s.closed != null ? dayStr(s.closed) : undefined, amount: s.amount, payment: dayStr(s.land), paid: s.paid })), fillers: k.fillers };
    // [H5] Until stage 2: a card paid from an account in another currency is warned about, never converted.
    if (cur(id) !== cur(k.payFrom)) res.warnings.push({ account: k.payFrom, card: id, code: 'card_other_currency', text: `${acct[id].name} (${cur(id)}) is paid from ${acct[k.payFrom].name} (${cur(k.payFrom)}): it is not taken off safe to spend until it is paid` });
  }
  for (const id in loans) res.owed[id] = { owedNow: loans[id].owedNow, next: loans[id].next };

  // ----- safe to spend: one headline [F9, B9, G2, SCHEMA 10.3 step 5] -----
  const homeSpend = Object.keys(res.accounts).filter(id => res.accounts[id].spendFrom && res.accounts[id].currency === home);
  const up = homeSpend.reduce((t, id) => t + Math.max(0, res.accounts[id].headroom), 0);
  const shortfalls = Object.keys(res.accounts).filter(id => res.accounts[id].currency === home).reduce((t, id) => t + Math.max(0, -res.accounts[id].headroom), 0);
  const cap = plan.free && plan.free.left != null ? plan.free.left : null;
  const raw = up - shortfalls;
  const oldest = Object.keys(res.accounts).reduce((d, id) => Math.min(d, dayNum(res.accounts[id].asOf)), today);
  res.safeToSpend = { headline: Math.max(0, cap === null ? raw : Math.min(cap, raw)), shortfall: Math.max(0, -raw), cappedByFreeToSpend: cap !== null && cap < raw, oldestInput: dayStr(oldest) };   // [A1]

  // ----- days to next pay [F3, F8, F12, F13, H8] -----
  const np = nextPays[0];
  res.daysToNextPay = np ? { days: np.land - today, next_pay: dayStr(np.land), item: np.id, late: np.land < today || undefined } : { days: null };
  if (!periodStream) {   // [B4] "lasts about N weeks": the spending accounts together, planned spending by day
    const lastDay = homeSpend.map(id => walk(id, today + LATER_ON_DAYS, res.accounts[id].minimum).firstBelowZero);
    res.lastsAboutWeeks = plan.lines || plan.free ? Math.floor((Math.min(...lastDay.map(d => d === null ? today + LATER_ON_DAYS : d)) - today) / 7) : null;
  }

  // ----- due before next pay [F7, F13, F21, F23, H8] -----
  // While the next pay is late, it is still the next pay: nothing lands between today and it.
  const until = np ? np.land : today + NO_PAY_DUE_DAYS;
  const due = items.filter(o => out(o) && !o.settled && o.land >= today && o.land < until && o.amount)
    .sort((a, b) => a.land - b.land || (a.acct < b.acct ? -1 : 1));
  res.dueBeforeNextPay = { until: dayStr(until), byAccount: groupBy(due, 'acct'), items: due.map(itemOut), total: due.reduce((t, o) => t + o.amount, 0) };

  // ----- not seen yet, and still inside the posting window [F3, F4, F23, F24, G3, H8] -----
  const past = items.filter(o => !o.settled && o.land < today && fallsDue(o) && o.amount);
  const late = past.filter(o => today > windowEnd(o)).sort((a, b) => a.land - b.land);
  res.notSeenYet = { items: late.map(o => Object.assign(itemOut(o), { direction: o.kind === 'income' ? 'in' : 'out' })),
    money_in: late.filter(o => o.kind === 'income').reduce((t, o) => t + o.amount, 0),
    money_out: late.filter(out).reduce((t, o) => t + o.amount, 0) };
  res.mayStillPost = past.filter(o => today <= windowEnd(o)).map(o => Object.assign(itemOut(o), { postsBy: dayStr(windowEnd(o)) }));

  // ----- total [F10, F11] -----
  const totalIds = Object.keys(res.accounts);   // owed to you is inside Total (LEDGER_DESIGN)
  const homeTotal = totalIds.filter(id => res.accounts[id].currency === home).reduce((t, id) => t + res.accounts[id].bank, 0);
  const beside = {};
  for (const id of totalIds) if (res.accounts[id].currency !== home) beside[res.accounts[id].currency] = (beside[res.accounts[id].currency] || 0) + res.accounts[id].bank;
  const cardsOwed = Object.keys(cards).filter(id => cur(id) === home).reduce((t, id) => t + cards[id].owedNow, 0);
  res.total = { amount: homeTotal, beside, afterCards: homeTotal - cardsOwed };

  // ----- the check-in [A1, A2] -----
  // What the check-in lists first: every expected item due since the last check-in, ticked by default.
  // autoSpends are not on it: they logged themselves.
  const lastCheckIn = Math.min(...Object.keys(banks).map(id => banks[id].asOfDay));
  res.checkIn = { since: dayStr(lastCheckIn), toConfirm: items.filter(o => !o.settled && o.land > lastCheckIn && o.land <= today && fallsDue(o) && o.amount).map(itemOut) };
  return res;
}

function itemOut(o) { return { item: o.id, lands: dayStr(o.land), amount: o.amount, account: o.acct, statement: o.kind === 'card' ? o.statement : undefined }; }
function groupBy(list, k) { const g = {}; for (const x of list) (g[x[k]] = g[x[k]] || []).push(x.id); return g; }
function paysAYear(s) {
  const f = s.schedule.frequency;
  if (f === 'weekly') return 52;
  if (f === 'every_n_weeks') return 52 / s.schedule.n;
  if (f === 'monthly') return 12 * (s.schedule.days || [1]).length;
  if (f === 'every_n_months') return 12 / s.schedule.n;
  return 12;
}
// The walk as a sum a person can check: "312,000 (bank today) - 100,000 (trip) ... = 17,000".
function whyText(parts, result, cur) {
  const terms = parts.filter(p => p.amount !== 0 || p.label === 'minimum').map((p, i) => {
    const sign = p.amount < 0 || p.label === 'minimum' ? '- ' : i ? '+ ' : '';
    return `${sign}${fmt(Math.abs(p.amount), cur)} (${p.label.replace(/[()]/g, '')})`;
  });
  return terms.join(' ') + ' = ' + fmt(result, cur);
}

module.exports = { lookahead, dayNum, dayStr, minor, fmt, makeCalendar };
