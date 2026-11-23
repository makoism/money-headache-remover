/* The Burrow engine: periods, the running one and the ones gone by, built from what happened (SCHEMA_V3 section 9;
   WIRING_PLAN Q4, slice 2). A period is a view, never stored: it runs from the pay that starts it to the day before the
   next one [F8, T1]. The look ahead works out the period starts and each line's amount and what is left (one engine);
   this file asks it for them and lists what happened inside each period from the events.
   periods(book, asOf, opts) returns
     { current: <the period running now> or null (no fixed pay [B4]),
       past: [ <each period gone by, newest first> ] }
   each period: { start, end, startsWith, lines: [{ id, name, acct, per, amount, start, spent, left }],
                  free: { acct, per, amount, start, spent, left } or null,
                  moneyIn: { items: [{ id, date, amount, schedule, acct }], total },
                  billsPaid: { items: [...], total }, cardPayments: { items: [{ id, date, amount, card, acct }], total } }
   `start` on a line is what it began the period with (the opening share in the period holding the opening); `spent` is
   what it began with less what is left (the check-in gap counted as spending [T2], refunds given back [O], fees [Q2]).
   opts: the look ahead's opts, and `from` (a day): leave out periods that ended before it.
   Totals count only the home currency in force on the period's first day. Plain browser JavaScript.
   Which records a period lists: by date, never by `told` (section 9: changing the pay schedule moves no event, it only
   regroups them; a receipt logged late belongs to the period its date is in, as the look ahead's lines count it).
   O1 and AN4 decide which records a check's figure holds, not which period a record is in, so they do not move a
   record between periods. `told` only limits what the app had heard of by the day asked, as in the look ahead. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? null : root.BurrowEngine;
  const LA = node ? require('./lookahead.js') : E.lookahead;
  const I = node ? require('./ids.js') : E.ids;
  const L = node ? require('./ledger.js') : E.ledger;
  const D0 = node ? require('./dates.js') : E.dates;

  function periods(book, asOf, opts) {
    opts = opts || {};
    const r = LA.lookahead(book, asOf, Object.assign({}, opts, { periods: true }));
    if (!r.period) return { current: null, past: [] };
    const acct = {}; for (const a of book.accounts || []) if (a && !a.gone) acct[a.id] = a;
    const sched = {}; for (const s of book.schedules || []) if (s && !s.gone) sched[s.id] = s;
    // what the app had heard of by then, as the look ahead counts it: dated and told by the day asked (the day before,
    // at its start); a record belongs to the period its date falls in, whenever it was told [section 9]
    const knownTo = opts.at === 'start of day' ? D0.dayStr(D0.dayNum(asOf) - 1) : asOf;
    // [BI2] each record once: a statement line matched to a typed or ticked record is one record (LA.countOnce)
    const evs = LA.countOnce(book, r).filter(e => e.date && e.date <= knownTo && String(e.told || e.date).slice(0, 10) <= knownTo);
    const firstSched = e => { const o = (e.settles || [])[0]; return o ? (typeof o === 'string' ? I.scheduleOf(o) : o.s) : null; };
    function happened(start, end) {
      const home = L.homeOn(book, start);
      const inside = evs.filter(e => e.date >= start && (end === null || e.date <= end));
      const list = (keep, shape) => {
        const items = inside.filter(keep).map(shape).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
        return { items, total: items.filter(x => (acct[x.acct] || {}).cur === home).reduce((t, x) => t + x.amount, 0) };
      };
      return {
        moneyIn: list(e => e.k === 'in' && e.sub !== 'refund' && acct[e.acct] && !L.owed(acct[e.acct]),
          e => ({ id: e.id, date: e.date, amount: e.a, schedule: e.stream || firstSched(e), acct: e.acct })),
        billsPaid: list(e => e.k === 'spend' && sched[firstSched(e)] && sched[firstSched(e)].kind === 'bill',
          e => ({ id: e.id, date: e.date, amount: e.a, schedule: firstSched(e), acct: e.acct })),
        cardPayments: list(e => e.k === 'repay' && acct[e.acct2] && acct[e.acct2].type === 'card',
          e => ({ id: e.id, date: e.date, amount: e.a, card: e.acct2, acct: e.acct })),
      };
    }
    const cur = Object.assign({ start: r.period.start, end: r.period.end, startsWith: r.period.startsWith },
      { lines: r.periodNow.lines, free: r.periodNow.free }, happened(r.period.start, null));
    const past = (r.periods || []).filter(p => !opts.from || p.end >= opts.from).map(p => Object.assign({}, p, happened(p.start, p.end))).reverse();
    return { current: cur, past };
  }
  /* What the Plan tab shows of each schedule (pay, bills, transfers) on a day, worked out by the engine's calendars:
     scheduleView(book, asOf) -> { <schedule id>: { kind, amount (the usual amount in force on the day), rule (the rule
       in force), next: { due, land, amount } or null (the first occurrence landing or due on or after the day that no record dated by then settles),
       lastNamed: the latest due date a record names (a settle, an `amounts` key, a period start or end), or null,
       changeFrom: the first day a change may start [X8]: the day itself, or the day after lastNamed when that is later,
       outstanding: [{ due, land, amount, state: 'late'|'notSeen'|'unticked' }] what has landed and is not settled,
       oldest first, listed before `next` [BJ5] } }   (opts3: the look ahead's opts) */
  function scheduleView(book, asOf, opts3) {
    const S = node ? require('./schedules.js') : E.schedules, D = node ? require('./dates.js') : E.dates;
    const today = D.dayNum(asOf), out = {};
    const acct = {}; for (const a of book.accounts || []) if (a && !a.gone) acct[a.id] = a;
    const country = L.fieldValue((book.home || {}).country) || null;
    const named = {}, done = new Set();
    // [BJ5] what has landed and is not settled, by the look ahead: not seen (past its posting window), late (inside
    // it) or unticked (left at a check-in, or due today); listed before the next one
    const r = LA.lookahead(book, asOf, opts3 || {});
    const notSeen = new Set(r.notSeenYet.items.map(i => i.item)), late = new Set(r.mayStillPost.map(i => i.item));
    const open = {};
    for (const o of r.checkIn.toConfirm.concat(r.checkIn.apart || [])) {
      const sid = I.scheduleOf(o.item), due = (I.occurrence(o.item) || {}).due;
      (open[sid] = open[sid] || []).push({ due, land: o.lands, amount: o.amount, state: notSeen.has(o.item) ? 'notSeen' : late.has(o.item) ? 'late' : 'unticked', id: o.item });
    }
    const name = (sid, due) => { if (sid && due && (!named[sid] || due > named[sid])) named[sid] = due; };
    for (const e of book.events || []) {
      if (!e || e.gone) continue;
      for (const o of e.settles || []) { const x = typeof o === 'string' ? I.occurrence(o) : { schedule: o.s, due: o.due }; if (x) { name(x.schedule, x.due); if (!e.date || e.date <= asOf) done.add(x.schedule + "@" + x.due); } }
      const oc = I.periodOcc(e.id); if (oc) { const x = I.occurrence(oc); name(x.schedule, x.due); }
    }
    for (const s of book.schedules || []) {
      if (!s || s.gone) continue;
      for (const k of Object.keys(s.amounts || {})) if (S.keyLive(s.amounts, k)) name(s.id, k);
      const cal = S.calendar((acct[s.acct] && acct[s.acct].country) || country);
      const outstanding = (open[s.id] || []).sort((x, y) => (x.land < y.land ? -1 : 1));
      const occ = S.occurrences(s, cal, today, today + 400).find(o => !done.has(o.id) && !outstanding.some(x => x.id === o.id)) || null;
      const rules = (s.rules || []).filter(x => x && !x.gone);
      let rule = null; rules.forEach((x, i) => { if (i === 0 || x.from == null || D.dayNum(x.from) <= today) rule = x.rule; });
      const last = named[s.id] || null, after = last ? D.dayNum(last) + 1 : -Infinity;
      out[s.id] = { kind: s.kind, amount: S.stepOn(s, today), rule, ends: s.ends || null,
        outstanding: outstanding.map(x => ({ due: x.due, land: x.land, amount: x.amount, state: x.state })),
        next: occ ? { due: D.dayStr(occ.due), land: D.dayStr(occ.land), amount: occ.amount } : null,
        lastNamed: last, changeFrom: D.dayStr(Math.max(today, after)) };
    }
    return out;
  }
  const api = { periods, scheduleView };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).periods = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
