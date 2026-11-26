/* The check-in writer (SCHEMA_V3 7.1 to 7.3; DECISIONS_ROUND2 A2, A4, AP6, AS5, AS6, O2), pure. It works nothing out:
   it turns what the person ticked and typed into records. Taken over from app3/src/checkin_write.js (WIRING_PLAN step 8).
   checkIn(book, { day, told, newId, figures: { acct: amount }, ticked: [occ], amounts: { occ: amount },
                   expected: { occ: amount }, lands: { occ: day }, unticked: [import line id],
                   fillerPlace: { acct: place }, from, split, landed: { occ: day } })
   returns { checkins: [one record], events: [...] } and never changes the book:
     - each ticked item writes `set:<occ>` [O2]: pay as `in` with `stream` (it starts the period), a card payment as
       `repay` from its paying account, a bill or transfer as `spend` from its account, each with `settles` and the
       amount typed (or the expected one), dated the day it landed: `landed` when the person typed it, else its landing
       day (`lands`) or the check-in day, never on or before the account's previous check [BI1] (landedFrom gives the
       first day allowed; a typed day before it, or after the check-in day, is refused);
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
      const s = scheds[o.schedule], card = accts[o.schedule];
      // [BI1] the day it landed: never on or before the account's previous check (it was not in that figure); by
      // default its landing day, or the day after that check when the landing day is not after it
      const from = landedFrom(book, a, occ), typedDay = (a.landed || {})[occ];
      let date;
      if (typedDay) {
        if (typedDay > a.day) throw new Error(occ + ' cannot have landed after the check-in day: ' + typedDay);
        if (from && typedDay < from && !(from > a.day && typedDay === a.day)) throw new Error(occ + ' cannot have landed on or before the previous check: ' + typedDay);
        date = typedDay;
      } else {
        date = (a.lands || {})[occ] || a.day;
        if (from && date < from) date = from;
        if (date > a.day) date = a.day;
      }
      const rec = { id: I.built.set(occ), date, told: at, at, grp: cid, settles: [{ s: o.schedule, due: o.due }] };
      if (s && s.kind === 'income') Object.assign(rec, { k: 'in', sub: 'pay', acct: s.acct, a: amt, stream: s.id });
      else if (s) Object.assign(rec, { k: 'spend', acct: s.acct, a: amt });
      else if (card) Object.assign(rec, { k: 'repay', acct: card.payFrom || null, acct2: card.id, a: amt, a2: amt });
      else throw new Error('no schedule or account for ' + occ);
      events.push(rec); settled.push(rec.id);
    }
    const places = {};
    for (const acct of Object.keys(a.figures || {})) {
      if (!accts[acct]) throw new Error('no account ' + acct);
      const id = a.newId(), prev = prevCheck(book, acct);
      events.push(Object.assign({ id, k: 'check', acct, date: a.day, a: whole(a.figures[acct], 'the figure for ' + acct), told: at, at, grp: cid }, prev ? { prev } : {}));
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
  // [BI1] The first day an item ticked at this check-in can have landed: the day after its account's previous check
  // (the last check of that account dated before the check-in day, or that day and told before it), or null when the
  // account has none. A card payment goes by its paying account.
  function landedFrom(book, a, occ) {
    const o = I.occurrence(occ);
    if (!o) return null;
    const s = (book.schedules || []).find(x => x && !x.gone && x.id === o.schedule);
    const card = (book.accounts || []).find(x => x && !x.gone && x.id === o.schedule);
    const acct = s ? s.acct : card ? card.payFrom : null;
    if (!acct) return null;
    let prev = null;
    for (const e of book.events || []) {
      if (!e || e.gone || e.k !== 'check' || e.stmt || e.acct !== acct || !e.date || e.date > a.day) continue;
      if (e.date === a.day && a.told && e.told && e.told >= a.told) continue;
      if (prev === null || e.date > prev) prev = e.date;
    }
    if (prev === null) return null;
    const D = node ? require('./dates.js') : root.BurrowEngine.dates;
    return D.dayStr(D.dayNum(prev) + 1);
  }
  // [CHECKFIX FD1] The id of an account's latest live check as this device sees it (by date, then told, then id), or
  // null: a new check names it in `prev`, so a check removed on one device comes back only when another device wrote a
  // later check after it (ledger.js revive). Statement checks count.
  const toldNum = e => { const n = Date.parse(e.told || ''); return isNaN(n) ? Date.parse(String(e.told || e.date).slice(0, 10)) + (864e5 - 1) || 0 : n; };   // 'T24:00': the end of its day
  function latestCheck(book, acct) {
    let best = null, bk = 0;
    for (const e of book.events || []) {
      if (!e || e.gone || e.k !== 'check' || e.acct !== acct) continue;
      const k = toldNum(e);
      if (!best || e.date > best.date || (e.date === best.date && (k > bk || (k === bk && String(e.id) > String(best.id))))) { best = e; bk = k; }
    }
    return best;
  }
  const prevCheck = (book, acct) => { const c = latestCheck(book, acct); return c ? c.id : null; };
  function apply(book, out) {
    const b = JSON.parse(JSON.stringify(book));
    b.events = (b.events || []).concat(out.events);
    b.checkins = (b.checkins || []).concat(out.checkins);
    return b;
  }
  const api = { checkIn, apply, landedFrom, latestCheck, prevCheck };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).checkin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
