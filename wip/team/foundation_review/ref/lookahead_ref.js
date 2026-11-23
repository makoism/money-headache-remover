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
// It follows DECISIONS_ROUND2.md sections A, B, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W and X (X and W win over anything earlier, then V, then U and T,
// then S, then R and Q, then P, then O, then N, then M, then L and K, then J, then I, then H). Where a line below carries a tag like [H3] or [B9], that decision is
// the reason for it. Plain code, no dependencies, every amount in whole minor
// units, every date a whole day number (D8). It is a reference for the engine
// and for tests, never loaded by the app.
'use strict';

const DIGITS = { JPY: 0, PHP: 2, USD: 2, EUR: 2, GBP: 2, CHF: 2 };
const HORIZON_MIN_DAYS = 45;      // SCHEMA 10.3 step 1
const LATER_ON_DAYS = 365;        // [B11] warnings look 12 months ahead
const NO_PAY_DUE_DAYS = 30;       // [F13] "due in the next 30 days"
const POSTING_WINDOW = 1;         // [F4] working days, unless the account says otherwise
const CARD_POSTING_WINDOW = 7;    // [L matching q4, M1] a card's default, in working days
const EARLY_SETTLE = 5;           // [L matching q2] an import may settle an expected item up to 5 working days early
// [H9, L matching q10] A rough (est) line matches an import within 10%: |a - b| <= 10% of the larger, compared
// exactly in minor units (difference x 10 <= the larger), never with a rounded margin.
const withinTenth = (a, b) => Math.abs(a - b) * 10 <= Math.max(a, b);
const OUT_KINDS = { spend: 1, bill_paid: 1 }, IN_KINDS = { pay_in: 1, money_in: 1, refund: 1 };
const dirOf = e => (OUT_KINDS[e.kind] ? 'out' : IN_KINDS[e.kind] ? 'in' : e.kind);   // 6.4 matches by direction
// [Q1] Records with two sides: money leaves `from` (the first side, `posted`) and reaches `to` or `card` (the
// second side, `posted2`).
const TWO_SIDED = { transfer: 1, repay: 1, card_payment: 1, borrow: 1, convert: 1 };
const reachOf = e => e.to || e.card;
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
// [T watch] `told` is compared as a moment, not as text: a time may carry its offset ('2026-12-14T09:30+08:00',
// 10:30 in Tokyo). A date with no time comes before every time that day (records on one day then keep their
// order in the file); 'T24' (an opening typed with no time) is the end of its day.
// [X9] "Start of day" and "end of day" are in the offset of the device that wrote the record, and so is a time
// with no offset of its own: a key may carry that device's offset after a '~' ('2026-11-22~+09:00'), added
// when the record is read (`zoned`). A key with no offset anywhere is read as before (every such time in one
// zone, so they compare among themselves as written).
const offsetMin = o => (!o || o === 'Z' ? 0 : (o[0] === '-' ? -1 : 1) * ((+o.slice(1, 3)) * 60 + (+o.slice(4, 6))));
function momentOf(k) {
  const mm = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2})(?::(\d{2}))?(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?)?(?:~([+-]\d{2}:\d{2}|Z))?$/.exec(String(k));
  if (!mm) return NaN;
  const zone = mm[6] || mm[7];   // the time's own offset, else the device's [X9]
  const day = dayNum(mm[1]) * MS - offsetMin(zone) * 60000;
  if (mm[2] === undefined) return day - 1;
  if (mm[2] === '24') return day + MS - 2;
  return day + ((+mm[2]) * 3600 + (+(mm[3] || 0)) * 60 + (+(mm[4] || 0))) * 1000 + (mm[5] ? Math.round(Number('0.' + mm[5]) * 1000) : 0);
}
// [X9] A key with no offset of its own takes the offset of the device that wrote it.
const offsetOf = k => { const mm = /(Z|[+-]\d{2}:\d{2})$/.exec(String(k || '').slice(10)); return mm ? mm[1] : null; };
const zoned = (k, zone) => (zone && !offsetOf(k) && !String(k).includes('~') ? String(k) + '~' + zone : String(k));
const keyCmp = (a, b) => momentOf(a) - momentOf(b);
function short(n) { const d = new Date(n * MS); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }   // "27 Nov", for sums a person reads

// ---------- amounts ----------
function minor(x, cur) { return Math.round(x * Math.pow(10, DIGITS[cur] === undefined ? 2 : DIGITS[cur])); }
// [AE1, AH3] A keyed override (`amounts`, `once`) is read in its saved shape, `{ amount, at, by, gone }`: a removed key
// (`gone`) is not read, so the occurrence takes its usual amount again. Any other shape is refused, so no reader is
// written against plain numbers again (confirm_review_4 item 3).
function keyLive(map, k) {
  const v = map ? map[k] : undefined;
  if (v === undefined || v === null) return null;
  if (typeof v !== 'object' || typeof v.amount !== 'number') throw new Error(`the key ${k} is not in the keyed override shape { amount, at, by, gone } [AE1, AH3]`);
  return v.gone ? null : v;
}
const keyAmount = (map, k) => { const v = keyLive(map, k); return v ? v.amount : null; };
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
  function subWorking(n, k) { while (k > 0) { n--; if (working(n)) k--; } return n; }
  function lastWorking(y, m) { let n = dayIn(y, m, 'last'); while (!working(n)) n--; return n; }
  return { working, shift, addWorking, subWorking, lastWorking };
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
  // [SCHEMA 5, X watch] `ends`: nothing is due after it (its money may be redirected to a place, `redirect`, which is
  // planned money and moves nothing [F22]). `amounts`: one occurrence changed, keyed by its due date before any move [B8].
  const ends = s.ends ? dayNum(s.ends) : Infinity;
  const out = [];
  parts.forEach((p, i) => {
    const until = parts[i + 1] ? parts[i + 1].from : Infinity;
    const start = p.rule.from ? Math.min(from, dayNum(p.rule.from)) : Math.max(from, p.from);
    for (const { due, key } of dueDays(p.rule, start, to, cal)) {
      if (due < p.from || due >= until || due < first || due > ends || (count && out.length >= count)) continue;
      const one = keyAmount(s.amounts, dayStr(due));   // [AE1, AH3] a removed key is not read
      const amt = minor(one != null ? one : s.amount_by_day ? s.amount_by_day[String(key)] : p.amount, cur);
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
  for (const st of steps || []) if (!st.gone && dayNum(st.from) <= day) x = minor(st.amount, cur);   // [AE1] a removed entry counts for nothing
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
  const home = homeOn(sc, today);   // [O6] the home currency in force today
  const acct = {}; for (const a of sc.accounts) acct[a.id] = a;
  // [O watch: country per account] An account with its own holiday table (its country's) uses it for its
  // own items, card payment days and posting windows; every other account uses the home table.
  const cals = {};
  const calOf = id => (acct[id] && acct[id].holidays ? (cals[id] = cals[id] || makeCalendar(acct[id].holidays)) : cal);
  // [O4] A budget line or Free to spend with no account is on the main bank (`home.mainBank`). A line on a
  // card is reserved from the card's paying account, so the money is held once, where it will leave from.
  const lineAcct = l => l.account || sc.main_bank;
  const moneyAcct = id => (acct[id] && acct[id].kind === 'card' ? acct[id].payment.from : id);
  const cur = id => acct[id].currency;
  const openDay = id => dayNum(acct[id].opening.date);
  const isOwed = id => !!(acct[id] && OWED_TYPES[acct[id].kind]);
  const m = (x, id) => minor(x, id ? cur(id) : home);
  // [F4, L matching q4] An account's posting window in working days: its own, else 7 for a card, else 1.
  const postingDays = id => acct[id].posting_days != null ? acct[id].posting_days : acct[id].kind === 'card' ? CARD_POSTING_WINDOW : POSTING_WINDOW;
  const res = { asOf, at, accounts: {}, cards: {}, owed: {}, places: {}, warnings: [], laterOn: [] };

  // ----- events the app knows of [H1, F24] -----
  // `told` is when the app first heard of a record (a date, or a date and a time; null: never). It orders
  // records on the same day; with no time, records keep the order they are listed in. Every amount is
  // turned into minor units here: `a` in the currency of the side it leaves, `a2` of the side it reaches [H5].
  // [I5, J2] A record moved from 38.31 is told at its own time when it has one. With no time, a moved
  // receipt is told at the start of its day (so one dated on or before the moved bank figure's day is
  // inside that figure), and a moved bank figure at the copy's last save. At the same moment, moved
  // receipts come before moved figures (see `inside`).
  // [K3] A moved bank figure with no date of its own (38.31 `bankNow` with no `bankNowAt`) is dated to the
  // copy's last saved day, like a `bankStart` with no `bankAt` [H9].
  const isFigure = e => e.kind === 'check' || e.kind === 'card_check';
  const movedZone = (sc.moved_copy && offsetOf(sc.moved_copy.saved)) || sc.device_offset;   // [X9]
  const events = [];
  (sc.events || []).forEach((e, i) => {
    if (e.told === null) return;
    const date = e.date || (e.moved && isFigure(e) ? sc.moved_copy.saved.slice(0, 10) : e.date);
    // [X9] A moved record's day starts in the moving device's offset (the copy's last save carries it); any other
    // record's in the offset of the person's device (`device_offset`).
    const key = zoned(String(e.told || (e.moved ? e.own_time || (isFigure(e) ? sc.moved_copy.saved : date) : date)), e.moved ? movedZone : sc.device_offset);
    if (dayNum(key) > knownTo || dayNum(date) > knownTo) return;
    const x = Object.assign({}, e, { date, day: dayNum(date), key, idx: i });
    // [Q1] An imported line read as a two-sided record names the statement it came from (`account`); with
    // none it is the leaving side's.
    if (e.source && e.source !== 'typed' && !x.account && x.from) x.account = x.from;
    // [S2] The settle an imported line saved when it was read is worked out again below, so a nearer line read
    // later (in any check-in stretch) moves it, and the period start with it; a settle the person ticked at a
    // check-in (`ticked`: the check-in's `settled` names the line) stays.
    if (e.source && e.source !== 'typed' && e.settles && !e.ticked) { x.savedSettles = e.settles; delete x.settles; }
    // [U2] The person unticked, on the check-in list, the settle this imported line made: it settles nothing.
    if (e.unticked) x.untick = true;
    const side = x.account || e.from;
    if (side && acct[side] && e.amount != null) x.a = m(e.amount, side);
    if (e.amount_out != null) x.a = m(e.amount_out, e.from);
    const other = e.card || e.to;
    if (other && acct[other]) x.a2 = e.amount_in != null ? m(e.amount_in, other) : m(e.amount, other);
    // [Q4] A pay in another currency than its account keeps its original amount as a2, in the schedule's currency.
    if (e.amount2 != null) {
      const sid = String([].concat(e.settles || [])[0] || '').split('@')[0], s = (sc.income || []).find(y => y.id === sid);
      x.a2 = minor(e.amount2, (s && s.currency) || home);
    }
    events.push(x);
  });
  // [Q5] Removing a self-logged spend writes `skip:<occurrence>`: the occurrence did not happen, on every
  // device. A self-logged spend of an occurrence that has a live skip (another device's copy that came back
  // in a merge, auto_removed.json auto-03) does not count.
  const autoSched = {}; for (const s of sc.bills || []) if (s.kind === 'auto_spend') autoSched[s.id] = true;
  const skipped = new Set([].concat(...events.filter(e => e.kind === 'skip' && !e.gone).map(e => [].concat(e.settles || []))));
  for (const e of events) {
    const occ = [].concat(e.settles || []).find(o => skipped.has(o) && autoSched[String(o).split('@')[0]]);
    if (!e.gone && e.kind === 'spend' && occ) { e.gone = true; e.goneBy = 'skip:' + occ; }
  }

  // [A6, H9, L matching q3 to q7, q10] An imported line (statement or screenshot) replaces the typed line it
  // matches: same account and direction (6.4), the same amount, or within 10% of the larger when the typed
  // line is rough (`est`), and inside the account's posting window either side of the typed day [q3]: by its
  // posted date, and on a card by its buy date too [q4]. Several match: the closest date, then the earliest
  // `told` [q7]. The typed line is gone (goneBy the import) and the import takes over its `settles` [q5, q6].
  // The statement-over-screenshot rank, repeats and the possible double are in the rules files
  // (rules/matching.json); this model meets imports only with typed lines, one side of a two-sided record [Q1]
  // and expected items.
  const isImport = e => e.source && e.source !== 'typed';
  const importDays = imp => {
    const d = [imp.posted ? dayNum(imp.posted) : imp.day];
    if (acct[imp.account] && acct[imp.account].kind === 'card' && imp.day !== d[0]) d.push(imp.day);
    return d;
  };
  for (const imp of events.filter(isImport)) {
    const w = postingDays(imp.account), ical = calOf(imp.account);
    const near = t => {
      let best = null;
      for (const d of importDays(imp)) {
        if (d < ical.subWorking(t.day, w) || d > ical.addWorking(t.day, w)) continue;
        best = best === null ? Math.abs(d - t.day) : Math.min(best, Math.abs(d - t.day));
      }
      return best;
    };
    const hits = events.filter(t => !t.gone && !isImport(t) && dirOf(t) === dirOf(imp) && t.account === imp.account
      && (t.est ? withinTenth(imp.a, t.a) : imp.a === t.a)).map(t => ({ t, gap: near(t) })).filter(x => x.gap !== null)
      .sort((x, y) => x.gap - y.gap || keyCmp(x.t.key, y.t.key) || x.t.idx - y.t.idx);
    if (hits.length) {
      const hit = hits[0].t;
      hit.gone = true; hit.goneBy = imp.id;
      if (hit.settles && !imp.settles && !imp.untick) imp.settles = hit.settles;
      imp.key = hit.key; imp.idx = hit.idx;   // [O1] it keeps the typed line's `told`, so a check that held the typed line holds it
    } else imp.unmatched = true;
  }
  // [Q1] An imported line that met no typed line and meets one side of a two-sided record (transfer, repay,
  // borrow, convert) attaches to it: a money-out line on the side money leaves (by `a`), a money-in line on the
  // side it reaches (by `a2`), inside the line's account's posting window either side of the record's day. It
  // sets that side's posted date (`posted`, or `posted2` for the second side) and source, and is never counted
  // again: the record is not replaced. Several fit: the closest date, then the earliest `told`.
  // [S1] A side of a rough (`est`) record is met by a line within 10% and takes the line's amount; the other side
  // keeps its typed amount, and in one currency the difference is a fee on the sender [Q2] (Free to spend, or
  // the place a fee record names [S5]). A side of a record that is not rough is met only by its own amount.
  for (const imp of events.filter(e => isImport(e) && e.unmatched)) {
    const id = imp.account, w = postingDays(id), ical = calOf(id);
    const dir = TWO_SIDED[imp.kind] ? (imp.from === id ? 'out' : 'in') : dirOf(imp);
    const amountFits = (t, a) => (t.est ? withinTenth(imp.a, a) : imp.a === a);
    const fits = t => {
      if (t.gone || isImport(t) || !TWO_SIDED[t.kind]) return null;
      if (dir === 'out' && t.from === id && !t.attached1 && amountFits(t, t.a)) return 1;
      if (dir === 'in' && reachOf(t) === id && !t.attached2 && amountFits(t, t.a2)) return 2;
      return null;
    };
    const hits = [];
    for (const t of events) {
      const sideNo = fits(t);
      if (!sideNo) continue;
      let gap = null;
      for (const d of importDays(imp)) if (d >= ical.subWorking(t.day, w) && d <= ical.addWorking(t.day, w)) gap = gap === null ? Math.abs(d - t.day) : Math.min(gap, Math.abs(d - t.day));
      if (gap !== null) hits.push({ t, sideNo, gap });
    }
    hits.sort((x, y) => x.gap - y.gap || keyCmp(x.t.key, y.t.key) || x.t.idx - y.t.idx);
    if (!hits.length) continue;
    const { t, sideNo } = hits[0], posted = imp.posted || imp.date;
    if (sideNo === 1) { t.posted = posted; t.src = imp.source; t.attached1 = imp.id; t.a = imp.a; }        // [S1] the side takes the line's amount
    else { t.posted2 = posted; t.src2 = imp.source; t.attached2 = imp.id; t.a2 = imp.a; }
    // [U1] In one currency a rough record never has more arrive than left: when the line makes it so, both sides
    // take the line's amount unless the other side has its own line. No fee is written.
    if (t.est && acct[t.from] && acct[reachOf(t)] && cur(t.from) === cur(reachOf(t)) && t.a2 > t.a) {
      if (sideNo === 1 && !t.attached2) t.a2 = t.a;
      else if (sideNo === 2 && !t.attached1) t.a = t.a2;
    }
    imp.gone = true; imp.goneBy = t.id; imp.unmatched = false;
  }
  const live = () => events.filter(e => !e.gone);
  // [S5] A fee is its own spend record linked to its transfer (`of: <transfer id>`), with the place the person
  // picked (a goal), else Free to spend. It moves no money of its own: what left the sending account is the
  // transfer's `a`, taken off once [Q2]. It counts only while its transfer is live.
  const feeOf = e => (e.kind === 'spend' && e.of ? events.find(t => t.id === e.of && !t.gone && TWO_SIDED[t.kind]) || null : null);
  const isFee = e => !!feeOf(e);
  // [S5 fix] A transfer's `a` is what left, the fee included; the fee record moves only the place, never the
  // account, also when its transfer is gone (it then counts nowhere).
  const isFeeRecord = e => e.kind === 'spend' && !!e.of;
  const settledBy = {};
  for (const e of live()) for (const s of [].concat(e.settles || [])) settledBy[s] = e;

  // [X8] A schedule change can never start on or before its latest settled or named occurrence (a settle, a `once`
  // or `amounts` key, a `pe:` or `ps:` record) at the time it is made: the edit offers the first day after it
  // (rules/edits.json). So in a saved copy every settled or named occurrence is one the schedule makes; a copy where
  // one names an occurrence a change took away (c8: pay moved to the 25th "from 1 Dec" after the 10 Dec pay was
  // settled) is refused here, as a closing that leaves money is [P6].
  const named = sid => {
    const out = [];
    // [X1, Y28] a schedule id may be a moved one (`mv:pay:steps.a@2026-12-25`)
    const take = o => { const mm = String(o).match(/^((?:mv:[a-z]+:[A-Za-z0-9_.:-]+)|[a-z0-9_]+)@(\d{4}-\d{2}-\d{2})/); if (mm && mm[1] === sid) out.push(mm[2]); };
    for (const e of live()) {
      for (const o of [].concat(e.settles || [], e.savedSettles || [])) take(o);
      if (e.kind === 'period_end_answer' || e.kind === 'period_start') take(String(e.id).replace(/^(pe|ps):/, ''));
    }
    const sch = (sc.income || []).concat(sc.bills || []).find(x => x.id === sid) || {};
    // [AH3] only live keys name an occurrence: a removed `amounts` or `once` key names nothing
    for (const d of Object.keys(sch.amounts || {})) if (keyLive(sch.amounts, d)) out.push(d);
    for (const l of ((sc.plan || {}).lines || []).concat((sc.plan || {}).free ? [sc.plan.free] : [])) for (const o of Object.keys(l.once || {})) if (!(l.once[o] && l.once[o].gone)) take(o);
    return out;
  };
  for (const s of (sc.income || []).concat(sc.bills || [])) {
    if (!(s.changes || []).length || !acct[s.account]) continue;
    const first = Math.min(...s.changes.map(c => dayNum(c.from)));
    const late = named(s.id).filter(d => dayNum(d) >= first);
    if (!late.length) continue;
    const days = late.map(dayNum), made = new Set(occurrences(s, 'check', calOf(s.account), Math.min(...days), Math.max(...days), s.currency || cur(s.account)).map(o => o.id));
    for (const d of late) if (!made.has(s.id + '@' + d)) throw new Error(`${s.id}@${d} is settled or named, but a change of ${s.name} from ${dayStr(first)} no longer makes it: a change never starts on or before its latest settled or named occurrence [X8]`);
  }

  // ----- expected items from schedules -----
  const earliest = Math.min(...sc.accounts.map(a => dayNum(a.opening.date))) - 70;
  const farEnd = today + LATER_ON_DAYS + 62;
  const items = [];
  // [Q4] Money in another currency than its account (a schedule `currency` that differs) is in the schedule's
  // currency: it is not counted in the walk until stage 2, and is warned about.
  for (const s of sc.income || []) {
    if (!acct[s.account]) continue;
    const other = !!s.currency && s.currency !== cur(s.account);
    for (const o of occurrences(s, 'income', calOf(s.account), earliest, farEnd, s.currency || cur(s.account))) items.push(Object.assign(o, other ? { otherCur: true, currency: s.currency } : { otherCur: false }));
    if (other) res.warnings.push({ account: s.account, code: 'income_other_currency', schedule: s.id,
      text: `${s.name} (${s.currency}) lands in ${acct[s.account].name} (${cur(s.account)}): it is not counted until it arrives` });
  }
  for (const s of sc.bills || []) {
    const kind = s.kind === 'transfer' ? 'transfer' : s.kind === 'auto_spend' ? 'auto' : 'bill';
    // [Q2] A transfer schedule may carry `fee`: what leaves the paying account is the amount and the fee
    // (`amount`), what arrives is the amount (`amount2`).
    const fee = s.fee ? m(s.fee, s.account) : 0;
    for (const o of occurrences(s, kind, calOf(s.account), earliest, farEnd, cur(s.account))) items.push(fee ? Object.assign(o, { amount: o.amount + fee, amount2: o.amount, fee }) : o);
  }
  // [P6] A closed account's schedules (paid from it, landing in it, or a transfer into it) end on the closing
  // day: nothing due after it is expected. The closing is known once its day is.
  const closedOn = id => acct[id] && acct[id].closed && dayNum(acct[id].closed) <= knownTo ? dayNum(acct[id].closed) : null;
  for (let i = items.length - 1; i >= 0; i--) {
    const ends = [closedOn(items[i].acct), closedOn(items[i].to)].filter(x => x !== null);
    if (ends.length && items[i].due > Math.min(...ends)) items.splice(i, 1);
  }
  // [L matching q1, q2] An imported line that replaced no typed line and settles nothing may settle an unsettled
  // pay or bill of its account and direction with the exact amount (or within the schedule's `vary`), when it
  // lands from 5 working days before the item's landing day to the end of its posting window.
  // [Q6] Items are taken in landing order; each is settled by the line nearest its landing day, then the line
  // nearest its amount, then the earliest `told`. Every import the model knows is looked at together, so a
  // later import with a nearer line moves the settle, in the same check-in stretch or a later one [S2]; a
  // settle the person ticked at a check-in is not worked out again (it keeps its `settles`, above).
  const varyOf = {}; for (const s of (sc.income || []).concat(sc.bills || [])) varyOf[s.id] = s.vary || 0;
  const freeLines = live().filter(e => e.unmatched && !e.settles);
  // [AA14] An item setup was told had not gone through, whose posting window had already ended before setup (Z2), is
  // settled by a matching line at any later date: its posting window does not apply until it is settled.
  const pastAtSetup = x => ((acct[x.acct] && acct[x.acct].opening.not_yet) || []).includes(x.id)
    && calOf(x.acct).addWorking(x.land, postingDays(x.acct)) < openDay(x.acct);
  for (const x of items.slice().sort((a, b) => a.land - b.land || (a.id < b.id ? -1 : 1))) {
    if (settledBy[x.id]) continue;
    const xcal = calOf(x.acct), from = xcal.subWorking(x.land, EARLY_SETTLE), to = pastAtSetup(x) ? Infinity : xcal.addWorking(x.land, postingDays(x.acct));
    let best = null;
    for (const imp of freeLines) {
      if (imp.settles || imp.untick || imp.account !== x.acct || (x.kind === 'income' ? 'in' : 'out') !== dirOf(imp)
        || Math.abs(imp.a - x.amount) * 1000 > x.amount * Math.round(varyOf[x.sid] * 1000)) continue;
      const ds = importDays(imp).filter(d => d >= from && d <= to);
      if (!ds.length) continue;
      const c = { imp, gap: Math.min(...ds.map(d => Math.abs(d - x.land))), off: Math.abs(imp.a - x.amount) };
      const better = !best || c.gap - best.gap || c.off - best.off || keyCmp(imp.key, best.imp.key) || imp.idx - best.imp.idx;
      if (better === true || better < 0) best = c;
    }
    if (best) { best.imp.settles = x.id; best.imp.byImport = true; settledBy[x.id] = best.imp; }   // [U2] byImport: listed as already matched
  }
  // An item due or landing on or before its account's opening is inside the opening figure [rule 2],
  // unless setup was told it has not gone out (or come in) yet: the opening's `notYet` [F20, X3].
  const notYetOf = id => (acct[id] && acct[id].opening.not_yet) || [];
  const isNotYet = o => notYetOf(o.acct).includes(o.id);
  const covered = o => {
    const od = openDay(o.acct);
    return (o.land <= od || o.due <= od) && !isNotYet(o);
  };
  for (const o of items) o.settled = !!settledBy[o.id] || covered(o);
  // [B5, H7] autoSpend logs itself: on its landing day it writes its own spend, unless something settled it.
  // [O2] Its id is built from what it is, `auto:<schedule>@<due>`, so two devices writing it make one record.
  for (const o of items.filter(x => x.kind === 'auto' && !x.settled && x.land <= knownTo)) {
    events.push({ id: 'auto:' + o.id, kind: 'spend', account: o.acct, a: o.amount, day: o.land, key: zoned(dayStr(o.land), sc.device_offset), idx: -1, settles: o.id });
    o.settled = true;
  }
  // [O1] An imported line that replaced no typed line, or a spend that logs itself (written whenever the app
  // was next opened), dated on a check's day or the setup day counts as inside that figure, whatever its
  // `told`. A printed running balance (`src.bal`) decides instead when it can (see `inside`). An import that
  // settles an item setup was told had not gone out yet stays outside the opening [F20].
  for (const e of events) {
    if (e.gone) continue;
    if ((isImport(e) && e.unmatched) || [].concat(e.settles || []).some(x => autoSched[String(x).split('@')[0]])) e.dayInside = true;
  }
  const billPlace = {}; for (const s of sc.bills || []) if (s.place) billPlace[s.id] = s.place;

  // [F12] One stream starts periods: the first income entered that starts one and has a day.
  const periodStream = (sc.income || []).find(s => s.starts_period && s.schedule && s.schedule.frequency !== 'none' && acct[s.account]);
  const windowEnd = o => calOf(o.acct).addWorking(o.land, postingDays(o.acct));
  // [G3, H8] Past its landing day but inside the posting window: late, still expected, still counted.
  // [Z2] An item setup was told had not gone through, whose posting window had already ended before setup, still counts
  // as expected (late, in the walk) until it is seen (settled) or the person says it will not come (a skip).
  const stillExpected = o => isNotYet(o) && windowEnd(o) < openDay(o.acct);
  const lateExpected = o => o.land < today && (today <= windowEnd(o) || stillExpected(o));
  const pays = periodStream ? items.filter(o => o.sid === periodStream.id) : [];
  // [F8, A2] Money in that settles a pay of the period stream starts a period: ticked (pay_in), or an imported
  // line that settled it (money_in) [Q6].
  const startsPeriod = e => (e.kind === 'pay_in' || e.kind === 'money_in') && !!periodStream && [].concat(e.settles || []).some(s => String(s).startsWith(periodStream.id + '@'));
  const nextPays = pays.filter(o => !o.settled && (o.land >= today || lateExpected(o)));   // [F3, H8]
  // [T1, T6] Period starts are in the model. A period is named by the occurrence of the period stream's pay that
  // starts it. It starts on the day of a live period start record for that occurrence (`ps:<occurrence>`, the day
  // the person chose); else the day after the last day its period-end answers give the period before it (a period
  // with answers keeps its end: a moved settle or a corrected date never moves it); else the day the money that
  // settles the occurrence lands. Once a period's end is fixed, the late pay settles its occurrence and starts no
  // new period.
  const psOf = {}, peEnd = {};
  for (const e of live()) {
    if (e.kind === 'period_start' && e.day <= knownTo) psOf[String(e.id).slice(3)] = e.day;
    // `pe:<occurrence>:<place>`; the occurrence may name a moved schedule and the place a moved place [X1, Y28]
    if (e.kind === 'period_end_answer') { const occ = (/^pe:(.+?@\d{4}-\d{2}-\d{2}):/.exec(String(e.id)) || [])[1]; peEnd[occ] = Math.min(peEnd[occ] == null ? Infinity : peEnd[occ], e.day); }
  }
  const periodStartDays = [];
  pays.slice().sort((x, y) => x.due - y.due).forEach((o, i, list) => {
    const prev = list[i - 1], s = settledBy[o.id];
    const d = psOf[o.id] != null ? psOf[o.id] : prev && peEnd[prev.id] != null ? peEnd[prev.id] + 1 : s && startsPeriod(s) ? s.day : null;
    if (d !== null && d <= knownTo) periodStartDays.push(d);
  });

  // ----- bank today per account [A1, B7, H1] -----
  const delta = (e, id) => {
    switch (e.kind) {
      case 'pay_in': case 'money_in': case 'refund': return e.account === id ? e.a : 0;
      case 'spend': case 'bill_paid': return e.account === id && !isFeeRecord(e) ? -e.a : 0;   // [S5, S5 fix] a fee record moves no money
      case 'adjust': return e.account === id ? e.a : 0;   // [T7] an accepted difference, signed
      case 'card_payment': case 'repay': return e.from === id ? -e.a : 0;   // [H5] the paying side takes what left it
      case 'transfer': case 'convert': case 'borrow': return e.from === id ? -e.a : e.to === id ? e.a2 : 0;   // [O5] borrow: cash taken on a card
      default: return 0;   // set_aside and skip move no money; checks set a base, below
    }
  };
  // [H1] Is event e already inside a check (or the opening) of account id? Events dated before the check's
  // day are; on its day, those the app heard of before it. A bank line with a posting date counts by that date.
  // [I1, J3] An "available" bank check already has pending debits off: it holds every event dated before its
  // day by the buy date (posted or not), and on its day those told before it. A spend told after it comes
  // after it, whatever the check kind. A "current" check, and one that does not say, follows the H1 rule.
  // [J2] At the same moment, a moved receipt comes before a moved figure.
  // [O1] On a check's day (or the setup day) a running balance decides first, then an unmatched import or a
  // self-logged spend is inside the figure, then `told` as before.
  // [Q1] On a two-sided record each side has its own posted date: `posted` for the side money leaves, `posted2`
  // for the side it reaches.
  const postedOn = (e, id) => (e.account === id || e.from === id ? e.posted : reachOf(e) === id ? e.posted2 : null);
  const dayFor = (e, c, id) => { const p = c.avail !== 'available' && !isOwed(id) && postedOn(e, id); return p ? dayNum(p) : e.day; };
  function inside(e, c, id) {
    // [AB4] A line that settles an occurrence in the opening's `notYet` comes after the opening, whatever its date.
    if (c.opening && notGoneOut(e, id)) return false;
    const d = dayFor(e, c, id);
    if (d !== c.day) return d < c.day;
    const byBal = balOrder(e, c, id);
    if (byBal !== null) return byBal;
    if (e.dayInside && !(c.opening && notGoneOut(e, id))) return true;
    const kc = keyCmp(e.key, c.key);   // [T watch] as moments
    if (kc) return kc < 0;
    if (e.moved && c.moved && !isFigure(e)) return true;
    return e.idx < c.idx;
  }
  // [O1] The statement's running balance after each line (`src.bal`) places a check among that day's lines:
  // the lines up to the one whose balance is the check's figure are inside it, the rest after it. When the
  // balance before the day's first line is the figure, none is inside. When no balance is the figure, it
  // decides nothing (null) and the day rule above holds.
  function balOrder(e, c, id) {
    const fig = c.a != null ? c.a : c.amount;
    if (e.bal == null || e.account !== id || isOwed(id) || fig == null) return null;
    const same = live().filter(x => isImport(x) && x.bal != null && x.account === id && dayFor(x, c, id) === c.day).sort((x, y) => x.idx - y.idx);
    let j = null;
    same.forEach((x, k) => { if (m(x.bal, id) === fig) j = k; });
    if (j === null && same.length && m(same[0].bal, id) - delta(same[0], id) === fig) j = -1;
    return j === null ? null : same.indexOf(e) <= j;
  }
  const notGoneOut = (e, id) => [].concat(e.settles || []).some(x => notYetOf(id).includes(x));   // [F20, X3]
  // [J2] A moved bank figure with no time of its own is told at the copy's last save.
  const openingOf = id => {
    const op = acct[id].opening;
    // [X9] An opening typed with no time covers its whole day in the setup device's offset.
    return { day: openDay(id), key: zoned(op.told || (op.moved ? sc.moved_copy.saved : op.date + END_OF_DAY), op.moved ? movedZone : sc.device_offset), idx: -1, moved: !!op.moved, opening: true };
  };
  const byTime = (x, y) => x.day - y.day || keyCmp(x.key, y.key) || x.idx - y.idx;
  function bankInfo(id) {
    let base = Object.assign(openingOf(id), { amount: m(acct[id].opening.amount, id) });
    // [Z1] A check whose large gain was answered "wrong" is removed (the app marks it gone) and the figure is asked again:
    // it counts nowhere, and the account asks for a new figure until a later check is typed.
    const checks = live().filter(e => e.kind === 'check' && e.account === id && e.gain !== 'wrong').sort(byTime);
    const wrong = events.filter(e => e.kind === 'check' && e.account === id && e.gain === 'wrong').sort(byTime).pop();
    const askAgain = !!wrong && !checks.some(c => byTime(c, wrong) > 0);
    const moves = live().filter(e => delta(e, id) !== 0);
    const fillers = [];
    let lastGap = null;
    for (const c of checks) {
      // [A3] the filler is worked out every time: what the events say minus what the check shows.
      // [H1] Two check-ins on one day: the later one's stretch starts at the earlier one.
      // [I1] An event can be inside an earlier available check and not yet inside a later current one
      // (a debit not posted yet): it is added back, so it is not lost.
      const computed = base.amount + moves.filter(e => inside(e, c, id) && !inside(e, base, id)).reduce((t, e) => t + delta(e, id), 0)
        - moves.filter(e => inside(e, base, id) && !inside(e, c, id)).reduce((t, e) => t + delta(e, id), 0);
      const amount = m(c.amount, id);
      // [T2] the place picked; [X4] what the app had, the gain and the gain question's state, for `heldGain`
      fillers.push(Object.assign(makeFiller(id, c.day > base.day ? base.day + 1 : c.day, c.day, computed - amount), c.filler_place ? { place: c.filler_place } : {},
        { had: computed, gain: amount - computed, answer: c.gain || null }));
      base = { day: c.day, key: c.key, idx: c.idx, avail: c.avail, moved: c.moved, amount };
      lastGap = { day: c.day, had: computed, gain: amount - computed, answer: c.gain || null };
    }
    const bank = base.amount + moves.filter(e => !inside(e, base, id)).reduce((t, e) => t + delta(e, id), 0);
    return { bank, asOfDay: base.day, fillers, lastGap, askAgain: askAgain ? wrong.day : null };
  }

  // [A3, A4] The filler for a stretch from `first` to `last` (whole days). Split by days at each period start
  // in the stretch, or all to the older period when the person says "mostly before pay".
  // Positive means more went out than was logged.
  function makeFiller(id, first, last, amount) {
    const starts = periodStartDays.filter(d => d > first && d <= last).sort((x, y) => x - y);   // [F8, T6]
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
    const c = acct[id], op = c.opening, pay = c.payment, cal = calOf(id);
    const notSure = c.statement_close_day == null;   // [H4] close day "not sure"
    // [J5] The opening may hold several unpaid statements, oldest first, each with its amount, close date
    // and payment day; or one last statement, paid or not, whose payment day comes from the card's rule.
    // [AB3] Set up between the close and its payment day, setup asked "Is the last statement paid?": yes saves a paid
    // statement with no amount (it holds nothing); no saves it unpaid with its amount; "dont_know" counts everything owed
    // as that statement, so it is all due on the next payment day (the safe side, as H4).
    const sts = (op.statements || (op.statement ? [op.statement] : [])).map(x => (x.paid === 'dont_know' ? Object.assign({}, x, { amount: op.current, paid: false })
      : x.amount === undefined ? Object.assign({}, x, { amount: 0 }) : x));
    const st = sts.length ? sts[sts.length - 1] : null;   // the latest close before the opening
    const payOf = due => ({ id: id + '@' + dayStr(due), due, land: cal.shift(due, pay.weekend_holiday) });
    const payAfterClose = cl => { const [y, mo] = ymOf(cl); return payOf(dayIn(y, mo + pay.months_after_close, pay.day)); };
    // What a payment is planned to be: in full, or for a card that carries a balance, its minimum plus any planned extra [H7].
    const planned = (amt, day) => c.carries ? Math.min(amt, minPay(pay.min_rule, amt, cur(id)) + extraOn(pay.extra_steps, day, cur(id))) : amt;
    // Lines by posting day. A posting day the app has not seen yet is unknown: the buy day is used [F18].
    const open = openingOf(id);
    const carried0 = sts.filter(x => !x.paid).reduce((t, x) => t + m(x.amount, id), 0);
    const lines = [{ day: openDay(id), amount: m(op.current, id) - carried0, what: 'opening' }];
    const payments = [];
    for (const e of live()) {
      if (inside(e, open, id)) continue;
      if (e.account === id && (e.kind === 'spend' || e.kind === 'refund') && !isFeeRecord(e)) {
        const posted = e.posted && dayNum(e.posted) <= knownTo ? dayNum(e.posted) : e.day;
        lines.push({ day: posted, amount: e.kind === 'spend' ? e.a : -e.a });   // [F5] a refund lowers the cycle it posts in
      }
      // [O5] Money out of a card (a cash advance, cash taken, a closed card's credit sent back) is a card line:
      // what is owed moves, and the payment follows. `cashApr` is stored for stage 2 and not used here.
      if ((e.kind === 'transfer' || e.kind === 'borrow') && e.from === id) lines.push({ day: e.day, amount: e.a });
      if ((e.kind === 'card_payment' && e.card === id) || (e.kind === 'repay' && e.to === id)) payments.push({ day: e.day, amount: e.a2, settles: [].concat(e.settles || []) });   // [H5] what arrived
    }
    // [Q3] A card instalment buy is saved on its own pay-later account `of` this card: each part is a card line
    // on its day, once that day has come, so the card is due only the parts posted. The parts not yet posted are
    // walked on their posting dates (the walk, [S4]).
    for (const pa of sc.accounts.filter(x => x.of === id)) for (const pt of planParts(pa)) if (pt.due <= knownTo && pt.due > openDay(id) && pt.due > openDay(pa.id)) lines.push({ day: pt.due, amount: pt.amount, what: 'plan part' });
    // [X6] A card with a known close day and no typed last statement: the first close after the opening holds the
    // opening balance plus what came after; the statements follow from there. So the close days run from the last
    // close on or before the opening day.
    const lastCloseBy = d => { const [y, mo] = ymOf(d), here = dayIn(y, mo, c.statement_close_day); return here <= d ? here : dayIn(y, mo - 1, c.statement_close_day); };
    const sClose = st ? dayNum(st.closed) : notSure ? null : lastCloseBy(openDay(id));
    // [F6] A close day never moves. [X7] Nothing is made only up to a fixed horizon: close days run as far as any
    // question asks (the farthest day the model looks at, then one more close).
    const closes = [];
    if (!notSure) { const [y, mo] = ymOf(sClose); for (let k = 1; ; k++) { const cl = dayIn(y, mo + k, c.statement_close_day); closes.push(cl); if (cl > farEnd) break; } }

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
      for (const x of sts) {   // [J5] each statement at the opening, with its own payment day when typed
        const cl = dayNum(x.closed);
        list.push(Object.assign(x.payment_day ? payOf(dayNum(x.payment_day)) : payAfterClose(cl),
          { close: cl, amount: m(x.amount, id), left: x.paid ? 0 : m(x.amount, id), interest: 0, into: null, paidAtOpening: !!x.paid }));
      }
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
    const owedBare = day => carried0 + lines.filter(l => l.day <= day).reduce((t, l) => t + l.amount, 0)
      - payments.filter(p => p.day <= day).reduce((t, p) => t + p.amount, 0);
    // [J1] Close day not sure and the card carries a balance: interest on each payment day after the opening,
    // added before that day's payment, on what was owed at the end of the day before (the interest added
    // on earlier payment days included), x apr / 12, rounded half up [I2]. It is on everything owed before
    // that day's payment, spending since the last payment day included, as on a loan [K1]
    // (percent_min_interest.json pmin-08).
    const notSureDays = [];
    if (notSure && c.carries && c.apr) {
      const [y, mo] = ymOf(openDay(id));
      for (let k = 0; ; k++) {   // [X7] as far as any question asks
        const p = payOf(dayIn(y, mo + k, pay.day));
        if (p.due > farEnd) break;
        if (p.land > openDay(id) && p.due > openDay(id)) notSureDays.push(p.land);
      }
    }
    const notSureInterestTo = day => {
      let t = 0;
      for (const d of notSureDays) { if (d > day) break; t += interestOn(owedBare(d - 1) + t, c.apr); }
      return t;
    };
    const owedAt = day => owedBare(day) + (notSure ? notSureInterestTo(day) : interestTo(day));
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
        paid: b.paidAtOpening || !!settledBy[b.id] }));
      const nc = closes.find(cl => cl > knownTo);
      if (nc != null) nextPoint = Object.assign(payAfterClose(nc), { closes: nc });
    } else {
      const [y, mo] = ymOf(openDay(id));
      for (let k = 0; !nextPoint; k++) {   // [X7] as far as any question asks
        const p = payOf(dayIn(y, mo + k, pay.day));
        if (p.due > farEnd) break;
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
    // What the next payment is worked out on. A card with a close day: the projected interest at its next
    // close [I2]. Close day not sure and carrying a balance: the interest of the next payment day on everything
    // owed before it [J1, K1], added first, so a percent minimum is worked out on the balance including it [K2].
    const owedBefore = owedNow - stillAsked;
    const nextInterest = !nextPoint ? 0 : !notSure ? interestOn(projCarried, c.apr) : c.carries ? interestOn(owedBefore, c.apr) : 0;
    const rest = Math.max(0, owedBefore + nextInterest);
    const nextAmount = nextPoint ? planned(rest, nextPoint.due) : 0;
    // What comes off the paying account, and when: each unpaid point on its payment day, the rest on the
    // next payment day [F14]. Close day not sure: everything owed on the next payment day [H4].
    const walkItems = unpaid.map(p => ({ land: p.land, amount: p.part, label: c.name + (notSure ? ', all owed' : ' statement closed ' + short(p.closed)) }));
    // [T3] Bills and self-logged spends paid by this card that are still to come (or late, inside the card's posting
    // window: on today) are future card lines. They are never in what is owed now; in the walk each comes off the
    // paying account on the payment day of the statement it falls in (close day not sure: the first payment day on
    // or after it). In the open statement they join its payment; a later statement's lines are their own walk items,
    // taken only inside the walk (never at the horizon's end). A card that carries a balance takes only those of
    // its open statement, into what its next payment is planned on.
    let nextExp = 0;
    for (const o of items) {
      if (o.acct !== id || (o.kind !== 'bill' && o.kind !== 'auto') || o.settled || !o.amount || !(o.land >= today || lateExpected(o))) continue;
      const day = Math.max(o.land, today);
      let p;
      if (!notSure) { const cl = closes.find(x => x >= day); if (cl == null) continue; p = Object.assign(payAfterClose(cl), { closes: cl }); }
      else { const [y, mo] = ymOf(day); for (let k = 0; k < 3; k++) { p = payOf(dayIn(y, mo + k, pay.day)); if (p.land >= day) break; } }
      if (nextPoint && p.id === nextPoint.id) nextExp += o.amount;
      else if (!c.carries && (!nextPoint || p.land > nextPoint.land)) walkItems.push({ land: p.land, amount: o.amount, future: true, label: c.name + ', ' + o.name + ' ' + short(o.land) });
    }
    if (nextPoint) walkItems.push({ land: nextPoint.land, amount: nextExp ? planned(rest + nextExp, nextPoint.due) : nextAmount, label: c.name + (notSure ? ', all owed' : ' still open, closes ' + short(nextPoint.closes)) });
    // The next payment the card screen shows [F7]: the oldest unpaid point, else the next one "so far".
    const next = unpaid.length
      ? { item: unpaid[0].id, amount: unpaid[0].asks, payment_date: dayStr(unpaid[0].land), statement: label || 'closed', closed_on: unpaid[0].closed != null ? dayStr(unpaid[0].closed) : undefined }
      : nextPoint && { item: nextPoint.id, amount: nextAmount, payment_date: dayStr(nextPoint.land), statement: label || 'open', closes_on: nextPoint.closes != null ? dayStr(nextPoint.closes) : undefined };
    const cardItems = unpaid.map(p => ({ id: p.id, due: p.due, land: p.land, amount: p.part, statement: label || 'closed' }));
    if (nextPoint) cardItems.push({ id: nextPoint.id, due: nextPoint.due, land: nextPoint.land, amount: nextAmount, statement: label || 'open' });
    return { owedNow, statements: points, next, walkItems, cardItems, fillers, payFrom: pay.from };
  }

  // ----- loans and pay-later: an owed account that owns its payment [B5, E6, F19, H7] -----
  // Each month on its payment day: the usual amount (or what the minimum rule asks on what is owed), or with a
  // plans list the parts of every plan due by that day [Q3], plus any planned extra, never more than what is
  // still owed.
  // [I2] On each payment day, interest is added first on what was owed before that day's payment
  // (owed x apr / 12, rounded half up), then the payment is asked on what is owed. Payment days gone by
  // add it to what is owed now, paid or not; payment days to come add it in the look ahead.
  // [Q3] A borrow (or a transfer) from a loan or pay-later account, and a spend on it, raise what it owes; a
  // refund on it lowers it. A payment day gone by asks on what was owed then, so a day before a draw asks
  // nothing. A pay-later account `of` a card has no payment of its own: its parts are posted to the card
  // (cardInfo) and each lowers what the plan owes on its day.
  function loanInfo(id) {
    const a = acct[id], pay = a.payment || {}, c = cur(id), open = openingOf(id), cal = calOf(id);
    const changes = [];
    for (const e of live()) {
      if (inside(e, open, id)) continue;
      if ((e.kind === 'borrow' || e.kind === 'transfer') && e.from === id) changes.push({ day: e.day, d: e.a });
      if (e.kind === 'spend' && e.account === id && !isFeeRecord(e)) changes.push({ day: e.day, d: e.a });
      if (e.kind === 'refund' && e.account === id) changes.push({ day: e.day, d: -e.a });
      if ((e.kind === 'repay' && e.to === id) || (e.kind === 'card_payment' && e.card === id)) changes.push({ day: e.day, d: -e.a2 });
    }
    const parts = planParts(a);
    if (a.of) for (const pt of parts) if (pt.due <= knownTo && pt.due > openDay(id) && pt.due > openDay(a.of)) changes.push({ day: pt.due, d: -pt.amount });
    changes.sort((x, z) => x.day - z.day);
    const days = [];
    const [y, mo] = ymOf(openDay(id));
    for (let k = 0; !a.of; k++) {
      const due = dayIn(y, mo + k, pay.day);
      if (due > farEnd) break;
      const land = cal.shift(due, pay.weekend_holiday);
      if (land <= openDay(id) || due <= openDay(id)) continue;
      // [AB3] Set up between its statement and its payment day and answered "paid": that payment was made before setup.
      // "No" and [AD7] "dont_know" leave it expected: that month's usual payment on that payment day, not the whole balance.
      const ls = a.opening.statement;
      if (ls && ls.paid === true && ls.payment_day === dayStr(due)) continue;
      days.push({ due, land, iid: id + '@' + dayStr(due) });
    }
    let owed = m(a.opening.owed, id), r = 0;
    for (const d of days) {
      if (d.land > knownTo) break;
      while (r < changes.length && changes[r].day < d.land) owed += changes[r++].d;
      owed += interestOn(owed, a.apr);
      d.owedThen = owed;
    }
    while (r < changes.length) owed += changes[r++].d;
    const owedNow = owed;
    // What a payment day asks: with plans, every plan's parts due after the payment day before and up to this one.
    // [AC5] A payment's own amount (`amounts`, a moved debt's one-month amount) is that payment, whole: in place of the
    // usual amount or minimum and any planned extra.
    const own = d => { const a = keyAmount(pay.amounts, dayStr(d.due)); return a != null ? minor(a, c) : null; };   // [AE1, AH3]
    const asks = (d, i, bal) => own(d) != null ? own(d) : (parts.length
      ? parts.filter(pt => pt.due <= d.due && (i === 0 || pt.due > days[i - 1].due)).reduce((t, pt) => t + pt.amount, 0)
      : pay.amount != null ? minor(pay.amount, c) : minPay(pay.min_rule, bal, c)) + extraOn(pay.extra_steps, d.due, c);
    const loanItems = [];
    let unpaid = 0, left = null;
    for (let i = 0; i < days.length; i++) {
      const d = days[i], past = d.land <= knownTo;
      let bal;
      if (past) bal = Math.min(d.owedThen, owedNow) - unpaid;
      else { if (left === null) left = owedNow - unpaid; if (left <= 0) break; left += interestOn(left, a.apr); bal = left; }
      if (bal <= 0 || settledBy[d.iid]) continue;
      const amt = Math.min(bal, asks(d, i, bal));
      if (amt <= 0) continue;
      if (past) unpaid += amt; else left -= amt;
      loanItems.push({ id: d.iid, sid: id, kind: 'loan', acct: pay.from, card: id, due: d.due, land: d.land, amount: amt, settled: false, name: a.name });
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
  // [W2] A card, loan or pay-later payment in another currency than its paying account is listed apart in its own
  // currency and left out of the totals of due before next pay, not seen yet and the check-in list, as pay in
  // another currency is (S6).
  const otherOf = id => (acct[id] && cur(id) !== cur(id in cards ? cards[id].payFrom : (acct[id].payment || {}).from) ? { otherCur: true, currency: cur(id) } : { otherCur: false });
  for (const id in cards) for (const ci of cards[id].cardItems) items.push(Object.assign({ kind: 'card', acct: cards[id].payFrom, card: id, settled: false }, ci, otherOf(id)));
  for (const id in loans) for (const li of loans[id].loanItems) items.push(Object.assign(li, otherOf(id)));
  const out = o => o.kind !== 'income';
  const fallsDue = o => o.kind !== 'card' || o.statement !== 'open';   // an open statement is not due yet [F7]

  // [O watch, X4] A check-in figure above what the app had by more than the period's Free to spend, or by more than
  // 20% of what the app had, is a large gain. It is held, not placed in any place, until the person answers that
  // the figure is right: its filler counts nowhere (not in Free to spend, a line or a place). The figure stands as
  // the account's bank figure meanwhile. An investment's rise is a market move, never asked [T watch].
  function freePeriodAmount() {
    const f = sc.plan && sc.plan.free;
    if (!periodStream || !f) return null;
    const fid = moneyAcct(lineAcct(f)), started = periodStartDays.length ? Math.max(...periodStartDays) : null;
    const coming = nextPays.filter(p => p.land > today);
    return perPeriod({ per: f.per, amount: m(amountFor(f, started), fid) }, coming[0] ? coming[0].land : today, coming[1] ? coming[1].land : (coming[0] ? coming[0].land : today) + 30);
  }
  const largeGain = (id, g) => {
    if (!g || g.gain <= 0 || acct[id].kind === 'investment') return false;
    const fp = freePeriodAmount();
    return (fp !== null && g.gain > fp) || g.gain * 5 > g.had;
  };
  const heldGain = (id, f) => largeGain(id, f) && f.answer !== 'right';
  // ----- places: goals and the other kept places, money already set aside [F22, B6, B10, H7] -----
  // A place's money: the opening split (or the goal's opening), plus what was set aside, less what was paid
  // from it: a spend naming it, or a bill whose schedule is paid from it. It never holds less than nothing:
  // paying past it comes from the account's other money.
  const fromPlace = e => e.goal || [].concat(e.settles || []).map(s => billPlace[s.split('@')[0]]).find(Boolean);
  const fromPlaceOf = e => e.from_place || (e.from && !acct[e.from] ? e.from : null);   // [T7] the place a move leaves
  const keptIn = {};
  // [X5] Placing money to place is a share-out from a limited amount: after a merge two placings (from two phones)
  // can add up to more than was to place. They are checked again: the newest (`at`, else `told`) gives way, until
  // the rest fit (P3 made general). A placing that gave way places nothing; the phone that wrote it says so.
  const gaveWay = new Set();
  function placeBalance(g) {
    // [V1] A goal whose money was moved to its own account (`kept_in` now names that account) is counted there; its
    // opening split stays on the account it was typed on, so the split is looked for on every account. The account
    // it left no longer holds it, so it gets no warning for it.
    const splitOn = sc.accounts.find(a => (((a.opening || {}).split || {}).goals || {})[g.id] != null);
    const split = splitOn ? splitOn.opening.split.goals[g.id] : null;
    let amt = split != null ? m(split, splitOn.id) : g.opening && dayNum(g.opening.date) <= knownTo ? m(g.opening.amount, g.kept_in) : 0;
    for (const e of live()) {
      if (e.kind === 'set_aside' && e.goal === g.id && !gaveWay.has(e.id)) amt += m(e.amount, g.kept_in);
      if ((e.kind === 'spend' || e.kind === 'bill_paid') && fromPlace(e) === g.id && (!isFeeRecord(e) || isFee(e))) amt -= e.a;   // [H7] paying from a place; [S5] a fee only while its transfer is live
      if (e.kind === 'set_aside' && fromPlaceOf(e) === g.id) amt -= m(e.amount, g.kept_in);   // [T7] a move out of a place lowers it
      if (e.kind === 'adjust' && e.goal === g.id) amt += e.a;   // [T7] an accepted difference naming this place
      // [P2, Q watch] A period-end answer is one record per place holding its moves: a move to this place fills
      // it; the answer of this place gives what it moves elsewhere (a move to itself is "keep it here").
      if (e.kind === 'period_end_answer') for (const mv of e.moves || []) {
        if (mv.to === g.id && e.place !== g.id) amt += m(mv.amount, g.kept_in);
        if (e.place === g.id && mv.to !== g.id) amt -= m(mv.amount, g.kept_in);
      }
    }
    // [T2] A filler the person placed on this place at the check-in comes out of it.
    for (const bid in banks) for (const f of banks[bid].fillers) if (f.place === g.id && !heldGain(bid, f)) amt -= f.amount;   // [X4] a held gain places nothing
    return Math.max(0, amt);
  }
  const placings = g => live().filter(e => (e.kind === 'set_aside' || e.kind === 'place_money') && e.to_place_of === g.id);
  for (const g of (sc.goals || []).filter(x => x.removed && dayNum(x.removed) <= knownTo)) {
    const list = placings(g).sort((x, y) => keyCmp(x.at || x.key, y.at || y.key) || x.idx - y.idx);
    let total = list.reduce((t, e) => t + e.a, 0);
    const limit = placeBalance(g);
    while (total > limit && list.length) { const newest = list.pop(); gaveWay.add(newest.id); total -= newest.a; }
  }
  for (const g of sc.goals || []) {
    const amt = placeBalance(g);
    // [P1] A place removed with money in it moved that money to Waiting, marked "to place": it stays out of
    // safe to spend until the person places it. A set aside naming it (`to_place_of`) places part of it in
    // another place; what is still to place is held in the walk like a kept place.
    if (g.removed && dayNum(g.removed) <= knownTo) {
      // [R1] It may also be placed in Free to spend (`place_money` into `free`), where it counts in safe to spend
      // again (planNow adds it to Free to spend), or kept in Waiting on purpose (into `waiting`), where it is no
      // longer to place and still does not count: it stays held in the walk.
      const mine = placings(g).filter(e => !gaveWay.has(e.id));   // [X5]
      const placed = mine.reduce((t, e) => t + e.a, 0);
      const keptWaiting = mine.filter(e => e.kind === 'place_money' && e.into === 'waiting').reduce((t, e) => t + e.a, 0);
      const toPlace = Math.max(0, amt - placed);
      (res.toPlace = res.toPlace || {})[g.id] = Object.assign({ amount: toPlace, keptInWaiting: keptWaiting, account: g.kept_in },
        placings(g).some(e => gaveWay.has(e.id)) ? { gaveWay: placings(g).filter(e => gaveWay.has(e.id)).map(e => e.id) } : {});
      if (keptWaiting) (keptIn[g.kept_in] = keptIn[g.kept_in] || []).push({ id: g.id + ':waiting', name: g.name, label: g.name + "'s money, kept in Waiting on purpose", amount: keptWaiting });
      if (toPlace) (keptIn[g.kept_in] = keptIn[g.kept_in] || []).push({ id: g.id, name: g.name, label: g.name + "'s money, in Waiting to place", amount: toPlace });
      continue;
    }
    // [E5, H7] A place that refills is next due on the next occurrence of its bill that is not settled yet.
    const nextOf = g.for_bill && items.find(o => o.sid === g.for_bill && !o.settled);
    const due = g.refill && nextOf ? dayStr(nextOf.due) : g.due || (nextOf ? dayStr(nextOf.due) : null);
    res.places[g.id] = { kept: amt, due, account: g.kept_in };
    (keptIn[g.kept_in] = keptIn[g.kept_in] || []).push({ id: g.id, name: g.name, amount: amt });
  }

  // ----- the plan: what is left of this period's budget lines and Free to spend [B1, B2] -----
  // The period started with the last pay of the period stream; before any, the opening split holds what
  // was left at setup [B2]. A spend names its `line` (`free` is Free to spend).
  // [T watch: plan.shares] A change to a line's or Free to spend's amount (`changes: [ { made, amount } ]`) applies
  // from the first period start after the day it was made. [V] A change made on a period's first day applies to
  // that period.
  function amountFor(x, start) {
    let a = x.amount;
    for (const ch of (x.changes || []).slice().sort((p, q) => dayNum(p.made) - dayNum(q.made))) if (start !== null && start !== undefined && dayNum(ch.made) <= start) a = ch.amount;
    return a;
  }
  const plan = opts.plan || planNow();
  function planNow() {
    if (!sc.plan) return {};
    const started = periodStartDays;   // [T6]
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
      for (const l of (sc.plan.lines || []).filter(x => moneyAcct(lineAcct(x)) === acctId)) {   // [O4] a card's line: its paying account's split
        const typed = (split.lines || {})[l.id], amount = m(l.amount, acctId);
        if (typed != null) out.lines[l.id] = m(typed, acctId);
        else if (share) { out.lines[l.id] = Math.floor(amount * share.d / share.D); leftOver += amount * share.d - out.lines[l.id] * share.D; }
        else out.lines[l.id] = amount;
      }
      const f = sc.plan.free;
      if (f && moneyAcct(lineAcct(f)) === acctId) {
        const amount = m(f.amount, acctId);
        out.free = split.free != null ? m(split.free, acctId) : share ? Math.floor((amount * share.d + leftOver) / share.D) : amount;
      }
      return (opening[acctId] = out);
    }
    // [T watch: closing the main bank] A line's opening split stays on the account it was typed on, also after the
    // line moved to another account (the closing moved it to the new main bank).
    const splitAt = lineId => sc.accounts.find(a => a.opening.split && (lineId === 'free' ? a.opening.split.free != null : (a.opening.split.lines || {})[lineId] != null));
    const leftOf = (lineId, acctId, amount) => {
      const sa = splitAt(lineId), moved = sa && sa.id !== acctId;
      const atOpening = moved ? m(lineId === 'free' ? sa.opening.split.free : sa.opening.split.lines[lineId], sa.id)
        : lineId === 'free' ? openingShares(acctId).free : openingShares(acctId).lines[lineId];
      const fromOpening = lastPay === null || lastPay <= openDay(moved ? sa.id : acctId);
      const start = fromOpening ? (atOpening != null ? atOpening : amount) : amount;
      // [O4] Spent so far counts the line's spends on every account (food bought on the card too), each outside
      // its own account's opening. [O watch: refund] A refund the person gave back to the line (it names the
      // line) gives back to it; a refund that names no line does not.
      // [T5] Only spends in the line's own currency count; a spend in another currency on a home line is listed
      // apart with a warning until stage 2.
      const inLine = e => e.line === lineId && e.account && !inside(e, openingOf(e.account), e.account) && (fromOpening || e.day >= lastPay);
      const counts = e => inLine(e) && cur(e.account) === cur(acctId);
      for (const e of live().filter(x => x.kind === 'spend' && !isFeeRecord(x) && inLine(x) && cur(x.account) !== cur(acctId)))
        res.warnings.push({ account: e.account, code: 'spend_other_currency', line: lineId, event: e.id,
          text: `${fmt(e.a, cur(e.account))} ${cur(e.account)} on ${lineId === 'free' ? 'Free to spend' : lineId} is listed apart: it is not counted until stage 2` });
      // [T2] The filler is spending: each part of a filler (A4) in this period comes out of Free to spend, or out of
      // the line the person picked for it at the check-in, signed: a filler below zero (a pending hold dropped, a
      // spend logged twice) gives back, so a hold and its return add up to nothing (pending_hold hold-05). Only in
      // this line's currency [T5]; an investment's gap is a market move, never a filler [B10]. A card check's
      // filler is spending on the card the same way.
      let filled = 0;
      for (const bid in banks) {
        if (acct[bid].kind === 'investment' || cur(bid) !== cur(acctId)) continue;
        for (const f of banks[bid].fillers) if ((f.place || 'free') === lineId && !heldGain(bid, f))   // [X4] a held gain places nothing
          for (const pt of f.parts) if (fromOpening || dayNum(pt.from) >= lastPay) filled += pt.amount;
      }
      if (lineId === 'free') for (const cid in cards) {
        if (cur(cid) !== cur(acctId)) continue;
        for (const f of cards[cid].fillers) if (fromOpening || dayNum(f.day) >= lastPay) filled += f.amount;
      }
      const spent = live().filter(e => e.kind === 'spend' && !isFeeRecord(e) && counts(e)).reduce((t, e) => t + e.a, 0)
        - live().filter(e => e.kind === 'refund' && counts(e)).reduce((t, e) => t + e.a, 0) + filled;
      if (lineId !== 'free') return start - spent;
      // [Q2] A two-sided record in one currency where less arrived than left: the difference is a fee, a spend
      // from the sending account on the line `fees`, in Free to spend unless its fee record names another place
      // (a goal), which then pays it [S5].
      const inPeriod = (e, id) => !inside(e, openingOf(id), id) && (fromOpening || e.day >= lastPay);
      const elsewhere = new Set(live().filter(f => isFee(f) && f.goal).map(f => f.of));
      const fees = live().filter(e => TWO_SIDED[e.kind] && acct[e.from] && acct[reachOf(e)] && cur(e.from) === cur(reachOf(e)) && cur(e.from) === cur(acctId) && e.a > e.a2 && inPeriod(e, e.from) && !elsewhere.has(e.id))
        .reduce((t, e) => t + e.a - e.a2, 0);
      // [R1] Money to place that the person put in Free to spend counts in it again.
      const placed = live().filter(e => e.kind === 'place_money' && e.into === 'free' && !gaveWay.has(e.id) && inPeriod(e, e.account)).reduce((t, e) => t + e.a, 0);   // [X5]
      // [T7] An accepted difference (`adjust`) naming no place comes out of (or goes into) Free to spend.
      const adjusted = live().filter(e => e.kind === 'adjust' && !e.goal && acct[e.account] && cur(e.account) === cur(acctId) && inPeriod(e, e.account)).reduce((t, e) => t + e.a, 0);
      return start - spent - fees + placed + adjusted;
    };
    const lines = (sc.plan.lines || []).map(l => { const id = moneyAcct(lineAcct(l)), a = m(amountFor(l, lastPay), id); return { name: l.name, acct: id, per: l.per, amount: a, left: leftOf(l.id, id, a), src: l }; });
    const f = sc.plan.free, fid = f && moneyAcct(lineAcct(f)), fa = f && m(amountFor(f, lastPay), fid);
    const free = f && { name: 'Free to spend', acct: fid, per: f.per, amount: fa, left: leftOf('free', fid, fa), src: f };
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
  function perPeriod(x, startDay, endDay) {
    if (x.per === 'week') return Math.round(x.amount * (endDay - startDay) / 7);
    if (x.per === 'month' && periodStream && periodStream.schedule.frequency !== 'monthly') return Math.round(x.amount * 12 / paysAYear(periodStream));
    return x.amount;
  }
  function plannedFor(id) {
    const list = [];
    const lines = (plan.lines || []).filter(l => l.acct === id);
    if (plan.free && plan.free.acct === id) lines.push(Object.assign({ name: 'Free to spend' }, plan.free));
    if (!lines.length) return list;
    if (periodStream) {
      const starts = nextPays.filter(p => p.land > today);
      starts.forEach((p, i) => {
        const end = starts[i + 1] ? starts[i + 1].land : p.land + 30;
        for (const l of lines) list.push({ land: p.land, amount: perPeriod(l.src ? { per: l.per, amount: m(amountFor(l.src, p.land), id) } : l, p.land, end), label: l.name + ' for the period from ' + short(p.land) });
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
    for (const g of keptIn[id] || []) { bal -= g.amount; placeLeft[g.id] = g.amount; why.push({ label: g.label || g.name + ', kept in it', amount: -g.amount }); }
    // [B1]; no fixed pay: by day instead [B4]. [T4] An overspent line counts as nothing left: the overspend has
    // already left the account.
    if (periodStream) for (const l of (plan.lines || []).filter(x => x.acct === id && x.left)) { const left = Math.max(0, l.left); bal -= left; why.push({ label: l.name + ' left this period', amount: -left }); }
    const steps = [];   // { day, order, amount, label }  order: 0 income, 1 bills, 2 planned spending
    for (const o of items) {
      if (o.settled) continue;
      if (o.kind === 'income' && o.acct === id && !o.otherCur && (o.land >= today || lateExpected(o)) && o.land <= end) steps.push({ day: Math.max(o.land, today), order: 0, amount: o.amount, label: o.name + ' ' + short(o.land) + (o.land < today ? ', late, still expected' : '') });
      if (o.kind === 'loan' && cur(o.card) !== cur(id)) continue;   // [V2] a loan in another currency: like a card (H5), warned below
      if (['bill', 'transfer', 'auto', 'loan'].includes(o.kind) && o.acct === id && o.land <= end) {
        // [H7] a bill paid from a place takes what the place still holds first; only the rest is new
        const fromIt = o.place && placeLeft[o.place] ? Math.min(placeLeft[o.place], o.amount) : 0;
        if (fromIt) placeLeft[o.place] -= fromIt;
        steps.push({ day: Math.max(o.land, today), order: 1, amount: -(o.amount - fromIt), label: o.name + ' ' + short(o.land) + (o.land < today ? ', late' : '') });
      }
      if (o.kind === 'transfer' && o.to === id && o.land >= today && o.land <= end) steps.push({ day: o.land, order: 0, amount: o.amount2 != null ? o.amount2 : o.amount, label: o.name + ' in ' + short(o.land) });   // [Q2] what arrives
    }
    for (const cid in cards) {
      if (cards[cid].payFrom !== id) continue;
      if (cur(cid) !== cur(id)) continue;   // [H5] another currency: left out of the walk and warned, below
      for (const w of cards[cid].walkItems) {
        if (!w.amount) continue;
        if (w.future && w.land > end) continue;   // [T3] a later statement's card line: only inside the walk
        const day = Math.min(Math.max(w.land, today), end);   // [F14] beyond the horizon: off at its end
        steps.push({ day, order: 1, amount: -Math.max(0, w.amount), label: w.label + ', paid ' + short(w.land) + (w.land > end ? ', taken at the horizon end' : '') });
      }
    }
    // [S4] The parts of a card plan (a pay-later account `of` a card paid from this account) not yet posted are
    // walked on their posting dates, never more than the plan still owes, so they reach "Later on" too [B11]. The
    // card's own items hold only the parts already posted, so no part is taken twice.
    for (const pa of sc.accounts.filter(x => x.of && cards[x.of] && cards[x.of].payFrom === id && cur(x.of) === cur(id))) {
      let left = loans[pa.id] ? loans[pa.id].owedNow : 0;
      for (const pt of planParts(pa)) {
        if (pt.due <= knownTo || pt.due <= openDay(pa.of) || pt.due <= openDay(pa.id) || left <= 0) continue;
        const amt = Math.min(pt.amount, left);
        left -= amt;
        if (pt.due <= end) steps.push({ day: Math.max(pt.due, today), order: 1, amount: -amt, label: pa.name + ', part posted ' + short(pt.due) });
      }
    }
    for (const p of plannedFor(id)) if (p.land <= end) steps.push({ day: p.land, order: 2, amount: -p.amount, label: p.label });
    steps.sort((a, b) => a.day - b.day || a.order - b.order);
    let low = bal, lowDay = today, lowAt = 0, firstBelowZero = null, belowBal = null;
    for (let i = 0; i < steps.length; i++) {
      bal += steps[i].amount;
      const endOfDay = !steps[i + 1] || steps[i + 1].day !== steps[i].day;
      if (!endOfDay) continue;
      if (bal < low) { low = bal; lowDay = steps[i].day; lowAt = i + 1; }
      if (bal < 0 && firstBelowZero === null) { firstBelowZero = steps[i].day; belowBal = bal; }
    }
    for (let i = 0; i < lowAt; i++) why.push({ label: steps[i].label, amount: steps[i].amount });
    why.push({ label: 'minimum', amount: -minimum });
    return { lowest: low, lowestDay: lowDay, headroom: low - minimum, why, firstBelowZero, belowBal };
  }

  const backsGoal = id => (sc.goals || []).some(g => g.kept_in === id && g.mode === 'own_account' && !(g.removed && dayNum(g.removed) <= knownTo));
  // [T watch] Money into a closed account after its closing day reopens it, with a notice. Its schedules stay ended.
  const reopened = id => closedOn(id) !== null && live().some(e => e.day > closedOn(id) && delta(e, id) > 0);
  for (const id in banks) {
    // [P6] An account is closed only when its final figure is zero or moved out by the transfer the closing
    // asks for; a closed account holds nothing, has no minimum and is not counted in safe to spend.
    const closed = closedOn(id) !== null && !reopened(id);
    if (reopened(id)) res.warnings.push({ account: id, code: 'reopened', text: `${acct[id].name} was closed; money came into it, so it is open again` });
    if (closed && banks[id].bank !== 0) throw new Error(`${acct[id].name} is closed with ${fmt(banks[id].bank, cur(id))} in it: a closing is refused unless its figure is zero or moved out [P6]`);
    const a = acct[id], minimum = closed ? 0 : m(a.minimum || 0, id);
    const w = walk(id, horizon, minimum);
    const r = res.accounts[id] = {
      bank: banks[id].bank, asOf: dayStr(banks[id].asOfDay), ageDays: today - banks[id].asOfDay,   // [A1, F24]
      currency: a.currency, minimum, lowest: w.lowest, lowestDay: dayStr(w.lowestDay), headroom: w.headroom,
      // [SCHEMA 3, confirmed in W] An account that backs a goal (a goal kept in it as its own account) is not spent from
      // unless the person says so (`spend_from`).
      spendFrom: closed ? false : a.spend_from != null ? a.spend_from : !!SPEND_TYPES[a.kind] && a.currency === home && !backsGoal(id),
      why: whyText(w.why, w.headroom, a.currency), fillers: banks[id].fillers };
    if (w.headroom < 0) res.warnings.push({ account: id, code: 'below_minimum', day: r.lowestDay, short: -w.headroom, text: `${a.name} goes ${fmt(-w.headroom, a.currency)} below its minimum on ${r.lowestDay}` });   // [F9]
    const later = walk(id, today + LATER_ON_DAYS, 0);   // [B11]
    if (later.firstBelowZero !== null && later.firstBelowZero > horizon) res.laterOn.push({ account: id, day: dayStr(later.firstBelowZero), balance: later.belowBal, text: `Later on: ${a.name} goes below zero in ${dayStr(later.firstBelowZero).slice(0, 7)}` });
  }
  // [O watch: a wrong figure at a check-in] A check-in figure above what the app had for the account by more
  // than the period's Free to spend, or by more than 20% of what the app had, is asked about, not placed. The
  // latest check of each account is looked at; the figure stands as the bank figure until answered.
  // [X4] The question's state is saved on the check (`gain`: asked, right or wrong); answered right, it is not asked again.
  for (const id in banks) {
    if (banks[id].askAgain !== null) res.warnings.push({ account: id, code: 'check_again', day: dayStr(banks[id].askAgain),
      text: `The ${acct[id].name} figure of ${dayStr(banks[id].askAgain)} was wrong: what does it show now?` });   // [Z1]
    const g = banks[id].lastGap;
    if (g && largeGain(id, g) && g.answer !== 'right') res.warnings.push({ account: id, code: 'gain_to_ask', day: dayStr(g.day), gain: g.gain,
      text: `${acct[id].name} shows ${fmt(g.gain, cur(id))} more than the app had: was that figure right?` });
  }
  for (const id in cards) {
    const k = cards[id];
    res.cards[id] = { owedNow: k.owedNow, next: k.next, statements: k.statements.map(s => ({ closed: s.closed != null ? dayStr(s.closed) : undefined, amount: s.amount, payment: dayStr(s.land), paid: s.paid })), fillers: k.fillers };
    // [H5] Until stage 2: a card paid from an account in another currency is warned about, never converted.
    if (cur(id) !== cur(k.payFrom)) res.warnings.push({ account: k.payFrom, card: id, code: 'card_other_currency', text: `${acct[id].name} (${cur(id)}) is paid from ${acct[k.payFrom].name} (${cur(k.payFrom)}): it is not taken off safe to spend until it is paid` });
  }
  for (const id in loans) {
    res.owed[id] = { owedNow: loans[id].owedNow, next: loans[id].next };
    // [V2] A loan or pay-later account paid from an account in another currency is handled like a card (H5): left
    // out of the walk and warned about, never converted, until stage 2.
    const from = (acct[id].payment || {}).from;
    if (from && acct[from] && cur(id) !== cur(from)) res.warnings.push({ account: from, loan: id, code: 'loan_other_currency', text: `${acct[id].name} (${cur(id)}) is paid from ${acct[from].name} (${cur(from)}): it is not taken off safe to spend until it is paid` });
  }

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
  res.dueBeforeNextPay = { until: dayStr(until), byAccount: groupBy(due, 'acct'), items: due.map(itemOut), total: due.filter(o => !o.otherCur).reduce((t, o) => t + o.amount, 0) };   // [W2]

  // ----- not seen yet, and still inside the posting window [F3, F4, F23, F24, G3, H8] -----
  const past = items.filter(o => !o.settled && o.land < today && fallsDue(o) && o.amount);
  const late = past.filter(o => today > windowEnd(o) && !stillExpected(o)).sort((a, b) => a.land - b.land);   // [Z2]
  // [S6] Pay in another currency is listed in its own currency and left out of the totals.
  res.notSeenYet = { items: late.map(o => Object.assign(itemOut(o), { direction: o.kind === 'income' ? 'in' : 'out' })),
    money_in: late.filter(o => o.kind === 'income' && !o.otherCur).reduce((t, o) => t + o.amount, 0),
    money_out: late.filter(o => out(o) && !o.otherCur).reduce((t, o) => t + o.amount, 0) };   // [W2]
  res.mayStillPost = past.filter(o => today <= windowEnd(o) || stillExpected(o))
    .map(o => Object.assign(itemOut(o), today <= windowEnd(o) ? { postsBy: dayStr(windowEnd(o)) } : { stillExpected: true }));   // [Z2]

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
  // [S6] Pay in another currency is listed apart, in its own currency, and is not in the list's total.
  // [X3] An item setup was told had not gone out or come in yet is on the list too while its account has had no
  // check-in since the opening (the setup day's pay, a bill due before setup): it landed before the opening.
  const sinceOpening = o => isNotYet(o) && banks[o.acct] && banks[o.acct].asOfDay === openDay(o.acct);
  const listed = items.filter(o => !o.settled && (o.land > lastCheckIn || sinceOpening(o)) && o.land <= today && fallsDue(o) && o.amount);
  // [U2] Settles an import made since the last check-in are listed as already matched, ticked; the person can
  // untick one (the line then settles nothing, and the item is back on the list to confirm).
  const matched = items.filter(o => settledBy[o.id] && settledBy[o.id].byImport && o.land > lastCheckIn && o.land <= today && o.amount);
  res.checkIn = { since: dayStr(lastCheckIn), toConfirm: listed.filter(o => !o.otherCur).map(itemOut), apart: listed.filter(o => o.otherCur).map(itemOut), matched: matched.map(itemOut) };
  return res;
}

// [O6] The home currency in force on a day: the latest `home_curs` entry dated on or before it, else the
// file's own currency (the first entry).
function homeOn(sc, day) {
  let c = sc.currency;
  for (const h of sc.home_curs || []) if (dayNum(h.from) <= day) c = h.cur;
  return c;
}
// [Q3] A loan's or pay-later account's plans list: each plan's parts, monthly from its `first` date (a day 29
// to 31 on the month's last day in a shorter month), each with its amount in minor units.
function planParts(a) {
  const out = [];
  for (const pl of a.plans || []) {
    const f = dayNum(pl.first), [y, mo] = ymOf(f), d = Number(pl.first.slice(8, 10));
    for (let k = 0; k < pl.count; k++) out.push({ plan: pl.id, due: dayIn(y, mo + k, d), amount: minor(pl.amount, a.currency) });
  }
  return out.sort((x, z) => x.due - z.due);
}
// [S6] An item in another currency than its account (pay in dollars into a yen bank) carries that currency.
function itemOut(o) { return { item: o.id, lands: dayStr(o.land), amount: o.amount, account: o.acct, statement: o.kind === 'card' ? o.statement : undefined, currency: o.otherCur ? o.currency : undefined }; }
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
