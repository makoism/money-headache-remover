/* The check-in writer (SCHEMA_V3 7.1 to 7.3; DECISIONS_ROUND2 A2, A4, AP6, AS5, AS6, O2), pure. It works nothing out:
   it turns what the person ticked and typed into records. Taken over from app3/src/checkin_write.js (WIRING_PLAN step 8).
   checkIn(book, { day, told, newId, figures: { acct: amount }, ticked: [occ], amounts: { occ: amount },
                   expected: { occ: amount }, lands: { occ: day }, unticked: [import line id],
                   fillerPlace: { acct: place }, from, split })
   returns { checkins: [one record], events: [...] } and never changes the book:
     - each ticked item writes `set:<occ>` [O2]: pay as `in` with `stream` (it starts the period), a card payment as
       `repay` from its paying account, a bill or transfer as `spend` from its account, each with `settles` and the
       amount typed (or the expected one), dated the day it landed (or the check-in day);
     - each typed figure writes a `check` on the check-in day;
     - every record carries `grp: <check-in id>`; the check-in lists its figures, what it settled, the imported lines
       the person unticked [U2, AS5], each account's filler place for an account typed in it [AS6], its stretch start
       (`from`, AP6) and the "mostly before pay" answer (`split`, A4) when given.
   An item left unticked writes nothing: it stays expected. Amounts are whole minor units. apply(book, out) gives a new
   book with the records added. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const I = node ? require('./ids.js') : root.BurrowEngine.ids;
  const whole = (v, what) => { if (!Number.isInteger(v)) throw new Error(what + ' is not a whole amount in minor units: ' + v); return v; };

  function checkIn(book, a) {
    const cid = a.newId();
    const at = a.told;
    const accts = {}; for (const x of book.accounts || []) if (x && !x.gone) accts[x.id] = x;
    const scheds = {}; for (const s of book.schedules || []) if (s && !s.gone) scheds[s.id] = s;
    const events = [], settled = [], figures = [];
    for (const occ of a.ticked || []) {
      const o = I.occurrence(occ);
      if (!o) throw new Error('not an occurrence: ' + occ);
      const typed = a.amounts && Object.prototype.hasOwnProperty.call(a.amounts, occ);
      const amt = whole(typed ? a.amounts[occ] : (a.expected || {})[occ], 'the amount of ' + occ);
      const rec = { id: I.built.set(occ), date: (a.lands || {})[occ] || a.day, told: at, at, grp: cid, settles: [{ s: o.schedule, due: o.due }] };
      const s = scheds[o.schedule], card = accts[o.schedule];
      if (s && s.kind === 'income') Object.assign(rec, { k: 'in', sub: 'pay', acct: s.acct, a: amt, stream: s.id });
      else if (s) Object.assign(rec, { k: 'spend', acct: s.acct, a: amt });
      else if (card) Object.assign(rec, { k: 'repay', acct: card.payFrom || null, acct2: card.id, a: amt, a2: amt });
      else throw new Error('no schedule or account for ' + occ);
      events.push(rec); settled.push(rec.id);
    }
    const places = {};
    for (const acct of Object.keys(a.figures || {})) {
      if (!accts[acct]) throw new Error('no account ' + acct);
      const id = a.newId();
      events.push({ id, k: 'check', acct, date: a.day, a: whole(a.figures[acct], 'the figure for ' + acct), told: at, at, grp: cid });
      figures.push({ acct, check: id, typedA: a.figures[acct] });
      if (a.fillerPlace && a.fillerPlace[acct]) places[acct] = a.fillerPlace[acct];
    }
    const rec = { id: cid, date: a.day, told: at, at, figures, settled };
    if ((a.unticked || []).length) rec.unticked = a.unticked.slice();
    if (Object.keys(places).length) rec.fillerPlace = places;
    if (a.from) rec.from = a.from;
    if (a.split === 'days' || a.split === 'before') rec.split = a.split;
    if (a.by) { rec.by = a.by; for (const e of events) e.by = a.by; }
    return { checkins: [rec], events };
  }
  function apply(book, out) {
    const b = JSON.parse(JSON.stringify(book));
    b.events = (b.events || []).concat(out.events);
    b.checkins = (b.checkins || []).concat(out.checkins);
    return b;
  }
  const api = { checkIn, apply };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).checkin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
