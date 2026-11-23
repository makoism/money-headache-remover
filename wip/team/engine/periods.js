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
   Totals count only the home currency in force on the period's first day. Plain browser JavaScript. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? null : root.BurrowEngine;
  const LA = node ? require('./lookahead.js') : E.lookahead;
  const I = node ? require('./ids.js') : E.ids;
  const L = node ? require('./ledger.js') : E.ledger;

  function periods(book, asOf, opts) {
    opts = opts || {};
    const r = LA.lookahead(book, asOf, Object.assign({}, opts, { periods: true }));
    if (!r.period) return { current: null, past: [] };
    const acct = {}; for (const a of book.accounts || []) if (a && !a.gone) acct[a.id] = a;
    const sched = {}; for (const s of book.schedules || []) if (s && !s.gone) sched[s.id] = s;
    const evs = (book.events || []).filter(e => e && !e.gone && e.date && e.date <= asOf);
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
  const api = { periods };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).periods = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
