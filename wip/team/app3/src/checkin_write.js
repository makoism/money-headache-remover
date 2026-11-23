/* The check-in writer, pure (SCHEMA_V3 7.1 and 7.2; DECISIONS_ROUND2 A2, AS5, O2).
   TODO(lane A): WIRING_PLAN step 8 puts this in engine/checkin.js. Until it lands, slice 1 uses this one; when it lands,
   app3 calls the engine's and this file is removed. It works nothing out: it turns what the person ticked and typed
   into records.
   checkIn(book, { day, told, newId, figures: { acct: amount }, ticked: [occ], unticked: [occ], amounts: { occ: amount } })
   returns { checkins: [one record], events: [...] } and never changes the book:
     - each ticked item writes `set:<occ>` [O2]: pay as `in` with `stream` (it starts the period), a card payment as
       `repay` from its paying account, a bill as `spend`, each with `settles` and the amount typed (or the expected one);
     - each typed figure writes a `check` on the check-in day;
     - every record carries `grp: <check-in id>`; the check-in lists its figures and what it settled.
   An item left unticked writes nothing: it stays expected. (`unticked` on a check-in is for imported lines [U2, AS5];
   slice 1 has none.) Amounts are whole minor units. apply(book, out) gives a new book with the records added. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const I = node ? require('../../engine/ids.js') : root.BurrowEngine.ids;
  const whole = (v, what) => { if (!Number.isInteger(v)) throw new Error(what + ' is not a whole amount in minor units: ' + v); return v; };

  function checkIn(book, a) {
    const cid = a.newId();
    const at = a.told;
    const accts = {}; for (const x of book.accounts || []) if (!x.gone) accts[x.id] = x;
    const scheds = {}; for (const s of book.schedules || []) if (!s.gone) scheds[s.id] = s;
    const events = [], settled = [], figures = [];
    for (const occ of a.ticked || []) {
      const o = I.occurrence(occ);
      if (!o) throw new Error('not an occurrence: ' + occ);
      const expected = (a.expected || {})[occ];
      const amt = whole(occ in (a.amounts || {}) ? a.amounts[occ] : expected, 'the amount of ' + occ);
      const base = { id: I.built.set(occ), date: (a.lands || {})[occ] || a.day, told: at, at, grp: cid, settles: [{ s: o.schedule, due: o.due }] };
      const s = scheds[o.schedule], card = accts[o.schedule];
      if (s && s.kind === 'income') Object.assign(base, { k: 'in', sub: 'pay', acct: s.acct, a: amt, stream: s.id });
      else if (s) Object.assign(base, { k: 'spend', acct: s.acct, a: amt });
      else if (card) Object.assign(base, { k: 'repay', acct: card.payFrom || null, acct2: card.id, a: amt, a2: amt });
      else throw new Error('no schedule or account for ' + occ);
      events.push(base); settled.push(base.id);
    }
    for (const acct of Object.keys(a.figures || {})) {
      const id = a.newId();
      events.push({ id, k: 'check', acct, date: a.day, a: whole(a.figures[acct], 'the figure for ' + acct), told: at, at, grp: cid });
      figures.push({ acct, check: id, typedA: a.figures[acct] });
    }
    const rec = { id: cid, date: a.day, told: at, at, figures, settled };
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
  else root.CHECKIN3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
