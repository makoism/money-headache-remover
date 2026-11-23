#!/usr/bin/env node
// The look ahead, as a small reference model (foundation_review/SCHEMA_V3.md section 9).
//
// It reads one scenario (scenarios/*.json: accounts, income, bills, goals,
// holidays, events) and an "as of" day, and returns every figure Home needs:
// bank today per account with its age, safe to spend (headline, per-account
// headroom, warnings, later on), days to next pay, due before next pay, not
// seen yet, each card's next payment, total, and the filler for a check-in.
//
// It follows DECISIONS_ROUND2.md sections A, B and F. Where a line below
// carries a tag like [F14] or [B9], that decision is the reason for it.
// Plain code, no dependencies, every amount in whole minor units, every date
// a whole day number (D8). It is a reference for the engine and for tests,
// never loaded by the app.
'use strict';

const DIGITS = { JPY: 0, PHP: 2, USD: 2, EUR: 2, GBP: 2, CHF: 2 };
const HORIZON_MIN_DAYS = 45;      // SCHEMA 10.3 step 1
const LATER_ON_DAYS = 365;        // [B11] warnings look 12 months ahead
const NO_PAY_DUE_DAYS = 30;       // [F13] "due in the next 30 days"
const POSTING_WINDOW = 1;         // [F4] working days, unless the account says otherwise
const SPEND_TYPES = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };   // spendFrom defaults true (SCHEMA 10.3)

// ---------- days (whole day numbers, D8) ----------
const MS = 86400000;
function dayNum(s) { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / MS); }
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
  return { working, shift, addWorking };
}

// ---------- expected items ----------
// Every occurrence of a schedule between two days. The item id uses the due day
// before any move (`rent@2026-12-27`), so a holiday table change never breaks it [B8, A5].
function occurrences(s, kind, cal, from, to, cur) {
  const sc = s.schedule || {}, out = [];
  const start = sc.from ? Math.min(from, dayNum(sc.from)) : from;
  const first = sc.from ? dayNum(sc.from) : -Infinity;
  const amountFor = d => minor(s.amount_by_day ? s.amount_by_day[String(d)] : s.amount, cur);
  const add = (due, amt) => {
    if (due < first || (sc.count && out.length >= sc.count)) return;
    out.push({ id: s.id + '@' + dayStr(due), sid: s.id, kind, acct: s.account, to: s.to,
      due, land: cal.shift(due, s.weekend_holiday), amount: amt, startsPeriod: !!s.starts_period, name: s.name });
  };
  if (sc.frequency === 'monthly') {
    const days = sc.days || [sc.day];
    let [y, m] = ymOf(start);
    for (let due = dayIn(y, m, 1); due <= to; m++, due = dayIn(y, m, 1)) {
      for (const d of days) add(dayIn(y, m, d), amountFor(d));
    }
  } else if (sc.frequency === 'every_n_months') {
    let [y, m] = ymOf(dayNum(sc.from));
    for (let due = dayIn(y, m, sc.day); due <= to; m += sc.n, due = dayIn(y, m, sc.day)) add(due, amountFor(sc.day));
  } else if (sc.frequency === 'every_n_weeks' || sc.frequency === 'weekly') {
    const step = 7 * (sc.n || 1);
    let due = sc.from ? dayNum(sc.from) : start;
    if (!sc.from) while (weekdayOf(due) !== WEEKDAYS[sc.weekday]) due++;
    for (; due <= to; due += step) add(due, amountFor());
  }
  // 'none' (no fixed day): no future money is expected [B4]
  return out.filter(o => o.land >= from || o.due >= from).sort((a, b) => a.land - b.land || (a.id < b.id ? -1 : 1));
}

// ---------- the model ----------
// sc: a scenario object. asOf: 'YYYY-MM-DD'. opts.at: 'end of day' (default) or 'start of day'.
// opts.plan (optional, see SCHEMA_V3 section 6): { lines: [{ name, acct, per, amount, left }], free: { left, per, amount } }.
// opts.mostlyBeforePay: the person's answer to the filler question [A4].
function lookahead(sc, asOf, opts = {}) {
  const at = opts.at || 'end of day';
  const today = dayNum(asOf);
  const knownTo = at === 'start of day' ? today - 1 : today;   // events the app has heard of by now
  const cal = makeCalendar(sc.holidays || {});
  const home = sc.currency;
  const plan = opts.plan || {};
  const acct = {}; for (const a of sc.accounts) acct[a.id] = a;
  const cur = id => acct[id].currency;
  const openDay = id => dayNum(acct[id].opening.date);
  const isCard = id => acct[id] && acct[id].kind === 'card';
  const m = (x, id) => minor(x, id ? cur(id) : home);

  // Events the app knows of: told on or before now (told null: never) [rule 5, F24].
  const events = (sc.events || []).filter(e => {
    if (e.told === null) return false;
    return dayNum(e.told || e.date) <= knownTo && dayNum(e.date) <= knownTo;
  }).map(e => Object.assign({}, e, { day: dayNum(e.date) }));
  const settledBy = {};
  for (const e of events) for (const s of [].concat(e.settles || [])) settledBy[s] = e;

  // ----- expected items from schedules -----
  const earliest = Math.min(...sc.accounts.map(a => dayNum(a.opening.date))) - 70;
  const farEnd = today + LATER_ON_DAYS + 62;
  let items = [];
  for (const s of sc.income || []) if (acct[s.account]) items.push(...occurrences(s, 'income', cal, earliest, farEnd, cur(s.account)));
  for (const s of sc.bills || []) items.push(...occurrences(s, s.kind === 'transfer' ? 'transfer' : 'bill', cal, earliest, farEnd, cur(s.account)));
  // An item due or landing on or before its account's opening is inside the opening figure [rule 2],
  // unless setup was told it has not gone out yet [F20].
  const covered = o => {
    const od = openDay(o.acct), notOut = acct[o.acct].opening.not_gone_out || [];
    return (o.land <= od || o.due <= od) && !notOut.includes(o.id);
  };
  for (const o of items) o.settled = !!settledBy[o.id] || covered(o);

  // [F12] One stream starts periods: the first income entered that starts one and has a day.
  const periodStream = (sc.income || []).find(s => s.starts_period && s.schedule && s.schedule.frequency !== 'none' && acct[s.account]);
  const pays = periodStream ? items.filter(o => o.sid === periodStream.id) : [];
  const nextPays = pays.filter(o => !o.settled && o.land >= today);   // [F3] a pay past its date is not next

  // ----- bank today per account: latest check (or opening) plus what happened since [rule 5, A1] -----
  const delta = (e, id) => {
    const a = m(e.amount || 0, id);
    if (e.day <= openDay(id)) return 0;   // [B7] before the opening: the opening figure holds it (`pre`, worked out, never stored)
    switch (e.kind) {
      case 'pay_in': case 'money_in': case 'refund': return e.account === id ? (isCard(id) ? -a : a) : 0;
      case 'spend': case 'bill_paid': return e.account === id ? (isCard(id) ? a : -a) : 0;
      case 'card_payment': return e.from === id ? -a : e.card === id ? -a : 0;
      case 'transfer': return e.from === id ? -a : e.to === id ? a : 0;
      case 'convert': return e.from === id ? -m(e.amount_out, id) : e.to === id ? m(e.amount_in, id) : 0;
      default: return 0;   // set_aside moves no money; checks set a base, below
    }
  };
  // The balance an account would show at the end of `day` from the events alone, starting at a base.
  function runFrom(id, baseDay, baseAmt, day) {
    let b = baseAmt;
    for (const e of events) if (e.day > baseDay && e.day <= day) b += delta(e, id);
    return b;
  }
  const checksOf = id => events.filter(e => e.kind === 'check' && e.account === id);
  function bankInfo(id) {
    const a = acct[id];
    let base = { day: openDay(id), amount: m(a.opening.amount, id), what: 'opening' };
    const fillers = [];
    for (const c of checksOf(id)) {
      // [A3] the filler is worked out every time: what the events say minus what the check shows
      const computed = runFrom(id, base.day, base.amount, c.day);
      fillers.push(makeFiller(id, base.day, c.day, computed - m(c.amount, id)));
      base = { day: c.day, amount: m(c.amount, id), what: 'check' };
    }
    return { bank: runFrom(id, base.day, base.amount, knownTo), asOfDay: base.day, fillers };
  }

  // [A3, A4] The filler for a stretch: from the day after the last check-in to this one.
  // Split by days at each period start in the stretch, or all to the older period when the
  // person says "mostly before pay". Positive means more went out than was logged.
  function makeFiller(id, fromDay, toDay, amount) {
    const starts = events.filter(e => e.kind === 'pay_in' && periodStream && [].concat(e.settles || []).some(s => s.startsWith(periodStream.id + '@')) && e.day > fromDay + 1 && e.day <= toDay).map(e => e.day); // [F8] the period starts on the day the pay lands
    const cuts = [fromDay + 1, ...starts, toDay + 1];
    const days = toDay - fromDay;
    const parts = [];
    let given = 0;
    for (let i = 0; i < cuts.length - 1; i++) {
      const n = cuts[i + 1] - cuts[i];
      const last = i === cuts.length - 2;
      const share = opts.mostlyBeforePay ? (i === 0 ? amount : 0) : last ? amount - given : Math.round(amount * n / days);
      given += share;
      parts.push({ from: dayStr(cuts[i]), to: dayStr(cuts[i + 1] - 1), days: n, amount: share });
    }
    return { account: id, from: dayStr(fromDay + 1), to: dayStr(toDay), amount, parts };
  }

  // ----- cards [F5, F6, F7, F14, F18] -----
  function cardInfo(id) {
    const c = acct[id], op = c.opening, pay = c.payment;
    const closeOf = (y, mo) => dayIn(y, mo, c.statement_close_day);    // [F6] a close day never moves
    const payItem = close => {
      const [y, mo] = ymOf(close);
      const due = dayIn(y, mo + pay.months_after_close, pay.day);
      const iid = id + '@' + dayStr(due);
      return { id: iid, due, land: cal.shift(due, pay.weekend_holiday) };
    };
    const S = m(op.statement.amount, id), sClose = dayNum(op.statement.closed);
    const openPart = m(op.current, id) - (op.statement.paid ? 0 : S);
    // Lines by posting day. A posting day the app has not seen yet is unknown: the buy day is used [F18].
    const lines = [{ day: openDay(id), amount: openPart, what: 'opening' }];
    const payments = [];
    for (const e of events) {
      if (e.day <= openDay(id)) continue;
      if (e.account === id && (e.kind === 'spend' || e.kind === 'refund')) {
        const posted = e.posted && dayNum(e.posted) <= knownTo ? dayNum(e.posted) : e.day;
        lines.push({ day: posted, amount: e.kind === 'spend' ? m(e.amount, id) : -m(e.amount, id) });   // [F5] a refund lowers the cycle it posts in
      }
      if (e.kind === 'card_payment' && e.card === id) payments.push({ day: e.day, amount: m(e.amount, id) });
    }
    // Closes from the opening statement on.
    const closes = [];
    if (c.statement_close_day != null) {
      let [y, mo] = ymOf(sClose);
      for (let k = 1; k < 30; k++) closes.push(closeOf(y, mo + k));
    }
    const stmtAmount = close => {
      if (close === sClose) return S;
      const prev = closes[closes.indexOf(close) - 1] || sClose;
      return lines.filter(l => l.day > prev && l.day <= close).reduce((t, l) => t + l.amount, 0);
    };
    const owedAt = day => (op.statement.paid ? 0 : S) + lines.filter(l => l.day <= day).reduce((t, l) => t + l.amount, 0)
      - payments.filter(p => p.day <= day).reduce((t, p) => t + p.amount, 0);
    // A card check sets the statement it names and what is owed now; the gaps are its fillers [A3].
    const fillers = [];
    for (const e of events.filter(x => x.kind === 'card_check' && x.account === id)) {
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
    // Statements: the opening one and every close up to now. Paid when its payment item is settled.
    const statements = [];
    const allCloses = [sClose, ...closes];
    for (const cl of allCloses) {
      if (cl > knownTo) break;
      const p = payItem(cl);
      const paid = cl === sClose ? (op.statement.paid || !!settledBy[p.id]) : !!settledBy[p.id];
      statements.push({ closed: cl, amount: stmtAmount(cl), item: p.id, due: p.due, land: p.land, paid });
    }
    const unpaid = statements.filter(s => !s.paid);
    const openClose = allCloses.find(cl => cl > knownTo);
    const open = c.statement_close_day == null ? null : { closes: openClose, amount: owedNow - unpaid.reduce((t, s) => t + s.amount, 0), ...pick(payItem(openClose)) };
    // What comes off the paying account, and when: each statement on its payment day, the open part
    // on the payment day after its close [F14]. Close day "not sure": everything on the next payment day.
    let walkItems;
    if (c.statement_close_day == null) {
      const [y, mo] = ymOf(today);
      let p = null;
      for (let k = 0; k < 3 && !p; k++) { const due = dayIn(y, mo + k, pay.day); const it = { id: id + '@' + dayStr(due), due, land: cal.shift(due, pay.weekend_holiday) }; if (it.land >= today && !settledBy[it.id]) p = it; }
      walkItems = [{ id: p.id, land: p.land, amount: owedNow, label: c.name + ', all owed, close day not known' }];
    } else {
      walkItems = unpaid.map(s => ({ id: s.item, land: s.land, amount: s.amount, label: c.name + ' statement closed ' + short(s.closed) }))
        .concat([{ id: open.id, land: open.land, amount: open.amount, label: c.name + ' still open, closes ' + short(open.closes), open: true }]);
    }
    // The next payment the card screen shows [F7]: the oldest unpaid statement, else the open one "so far".
    const next = unpaid.length
      ? { item: unpaid[0].item, amount: unpaid[0].amount, payment_date: dayStr(unpaid[0].land), statement: 'closed', closed_on: dayStr(unpaid[0].closed) }
      : open && { item: open.id, amount: open.amount, payment_date: dayStr(open.land), statement: 'open', closes_on: dayStr(open.closes) };
    return { owedNow, statements, unpaid, open, next, walkItems, fillers, payFrom: pay.from };
  }
  const pick = p => ({ id: p.id, due: p.due, land: p.land });

  // ----- everything per account -----
  const banks = {}, cards = {};
  for (const a of sc.accounts) {
    if (a.kind === 'card') cards[a.id] = cardInfo(a.id);
    else banks[a.id] = bankInfo(a.id);
  }
  // Card payment items join the expected items (for due, not seen yet and the check-in list).
  for (const id in cards) {
    for (const s of cards[id].unpaid) items.push({ id: s.item, kind: 'card', acct: cards[id].payFrom, card: id, due: s.due, land: s.land, amount: s.amount, settled: false, statement: 'closed' });
    const o = cards[id].open;
    if (o) items.push({ id: o.id, kind: 'card', acct: cards[id].payFrom, card: id, due: o.due, land: o.land, amount: o.amount, settled: false, statement: 'open' });
  }
  const out = o => o.kind !== 'income';
  const windowEnd = o => cal.addWorking(o.land, acct[o.acct].posting_days == null ? POSTING_WINDOW : acct[o.acct].posting_days);

  // ----- goals and other kept places: money already set aside [F22, B6, B10] -----
  const keptIn = {};
  for (const g of sc.goals || []) {
    let amt = g.opening && dayNum(g.opening.date) <= knownTo ? m(g.opening.amount, g.kept_in) : 0;
    for (const e of events) if (e.kind === 'set_aside' && e.goal === g.id) amt += m(e.amount, g.kept_in);
    (keptIn[g.kept_in] = keptIn[g.kept_in] || []).push({ name: g.name, amount: amt });
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

  // ----- planned spending of later periods (10.3 step 2, [B1, B3, B4], units 10.4) -----
  const perPeriod = (x, startDay, endDay) => {
    const days = endDay - startDay;
    if (x.per === 'week') return Math.round(x.amount * days / 7);
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

  // ----- the walk, one account at a time [B3, B9, F1, F2, F3, F9, F14] -----
  function walk(id, end, minimum) {
    const start = banks[id].bank;
    const why = [{ label: acct[id].name + ' today', amount: start }];
    let bal = start;
    for (const g of keptIn[id] || []) { bal -= g.amount; why.push({ label: g.name + ', kept in it', amount: -g.amount }); }
    if (periodStream) for (const l of (plan.lines || []).filter(x => x.acct === id && x.left)) { bal -= l.left; why.push({ label: l.name + ' left this period', amount: -l.left }); }   // [B1]; no fixed pay: by day instead [B4]
    const steps = [];   // { day, order, amount, label }  order: 0 income, 1 bills, 2 planned spending
    for (const o of items) {
      if (o.settled) continue;
      if (o.kind === 'income' && o.acct === id && o.land >= today && o.land <= end) steps.push({ day: o.land, order: 0, amount: o.amount, label: o.name + ' ' + short(o.land) });
      if ((o.kind === 'bill' || o.kind === 'transfer') && o.acct === id && o.land <= end) steps.push({ day: Math.max(o.land, today), order: 1, amount: -o.amount, label: o.name + ' ' + short(o.land) + (o.land < today ? ', late' : '') });
      if (o.kind === 'transfer' && o.to === id && o.land >= today && o.land <= end) steps.push({ day: o.land, order: 0, amount: o.amount, label: o.name + ' in ' + short(o.land) });
    }
    for (const cid in cards) {
      if (cards[cid].payFrom !== id) continue;
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

  const res = { asOf, at, horizon: dayStr(horizon), accounts: {}, cards: {}, warnings: [], laterOn: [] };
  for (const id in banks) {
    const a = acct[id], minimum = m(a.minimum || 0, id);
    const w = walk(id, horizon, minimum);
    const r = res.accounts[id] = {
      bank: banks[id].bank, asOf: dayStr(banks[id].asOfDay), ageDays: today - banks[id].asOfDay,   // [A1, F24]
      currency: a.currency, minimum, lowest: w.lowest, lowestDay: dayStr(w.lowestDay), headroom: w.headroom,
      spendFrom: a.spend_from != null ? a.spend_from : !!SPEND_TYPES[a.kind] && a.currency === home,
      why: whyText(w.why, w.headroom, a.currency), fillers: banks[id].fillers };
    if (w.headroom < 0) res.warnings.push({ account: id, day: r.lowestDay, short: -w.headroom, text: `${a.name} goes ${fmt(-w.headroom, a.currency)} below its minimum on ${r.lowestDay}` });   // [F9]
    const later = walk(id, today + LATER_ON_DAYS, 0);   // [B11]
    if (later.firstBelowZero !== null && later.firstBelowZero > horizon) res.laterOn.push({ account: id, day: dayStr(later.firstBelowZero), text: `Later on: ${a.name} goes below zero in ${dayStr(later.firstBelowZero).slice(0, 7)}` });
  }
  for (const id in cards) res.cards[id] = { owedNow: cards[id].owedNow, next: cards[id].next, statements: cards[id].statements.map(s => ({ closed: dayStr(s.closed), amount: s.amount, payment: dayStr(s.land), paid: s.paid })), fillers: cards[id].fillers };

  // ----- safe to spend: one headline [F9, B9, SCHEMA 10.3 step 5] -----
  const homeSpend = Object.keys(res.accounts).filter(id => res.accounts[id].spendFrom && res.accounts[id].currency === home);
  const up = homeSpend.reduce((t, id) => t + Math.max(0, res.accounts[id].headroom), 0);
  const shortfalls = Object.keys(res.accounts).filter(id => res.accounts[id].currency === home).reduce((t, id) => t + Math.max(0, -res.accounts[id].headroom), 0);
  const cap = plan.free && plan.free.left != null ? plan.free.left : null;
  const raw = up - shortfalls;
  const oldest = Object.keys(res.accounts).reduce((d, id) => Math.min(d, dayNum(res.accounts[id].asOf)), today);
  res.safeToSpend = { headline: Math.max(0, cap === null ? raw : Math.min(cap, raw)), shortfall: Math.max(0, -raw), cappedByFreeToSpend: cap !== null && cap < raw, oldestInput: dayStr(oldest) };   // [A1]

  // ----- days to next pay [F3, F8, F12, F13] -----
  res.daysToNextPay = nextPays[0] ? { days: nextPays[0].land - today, next_pay: dayStr(nextPays[0].land), item: nextPays[0].id } : { days: null };
  if (!periodStream) {   // [B4] "lasts about N weeks": the spending accounts together, planned spending by day
    const lastDay = homeSpend.map(id => walk(id, today + LATER_ON_DAYS, res.accounts[id].minimum).firstBelowZero);
    res.lastsAboutWeeks = plan.lines || plan.free ? Math.floor((Math.min(...lastDay.map(d => d === null ? today + LATER_ON_DAYS : d)) - today) / 7) : null;
  }

  // ----- due before next pay [F7, F13, F21, F23] -----
  const until = nextPays[0] ? nextPays[0].land : today + NO_PAY_DUE_DAYS;
  const due = items.filter(o => out(o) && !o.settled && o.land >= today && o.land < until && o.amount)
    .sort((a, b) => a.land - b.land || (a.acct < b.acct ? -1 : 1));
  res.dueBeforeNextPay = { until: dayStr(until), byAccount: groupBy(due, 'acct'), items: due.map(itemOut), total: due.reduce((t, o) => t + o.amount, 0) };

  // ----- not seen yet, and still inside the posting window [F3, F4, F23, F24] -----
  const past = items.filter(o => !o.settled && o.land < today && (o.kind !== 'card' || o.statement === 'closed'));
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
  const lastCheckIn = Math.min(...Object.keys(banks).map(id => banks[id].asOfDay));
  res.checkIn = { since: dayStr(lastCheckIn), toConfirm: items.filter(o => !o.settled && o.land > lastCheckIn && o.land <= today && (o.kind !== 'card' || o.statement === 'closed')).map(itemOut) };
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
