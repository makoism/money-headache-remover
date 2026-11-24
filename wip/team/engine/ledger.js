/* The Burrow engine: the ledger (LEDGER_DESIGN.md; SCHEMA_V3 sections 3, 4, 6). Ported from side/ledger-wiring ledger.js
   and adapted to the saved shape version 3: amounts are whole minor units in `a` (and `a2`, what arrived), a borrow names
   the card or loan in `acct` and where the money went in `acct2` [O5, Q3], a repay may have no paying account [Q watch],
   a fee is its own record that moves only a place [S5 fix], period-end answers are one record per place [P2], removed
   records (`gone`) count for nothing, and fillers carry no amount (the look ahead works them out) [A3].

   Two lists and one rule. Accounts say where money sits, places what it is for. Every coin in a tracked account in the
   home currency is in exactly one place, so the accounts added up and the places added up are the same number: Total.
   Each card paid in full in the home currency has a "for the card" line equal to what is on it. Nothing is stored as a
   balance: every figure is added up from dated events. Plain browser JavaScript, no dependencies. */
(function (root) {
  'use strict';
  const TYPES = { bank: 'yours', cash: 'yours', ewallet: 'yours', wallet: 'yours', owedToYou: 'yours', investment: 'yours',
    card: 'owed', paylater: 'owed', loan: 'owed' };
  const TWO = { borrow: 1, hand: 1, transfer: 1, convert: 1, repay: 1 };
  const owed = a => !!a && TYPES[a.type] === 'owed';
  const yours = a => !!a && TYPES[a.type] === 'yours';
  const live = e => e && !e.gone;
  const fieldValue = f => (f && typeof f === 'object' && 'v' in f ? f.v : f);   // [AL1] a field value `{ v, at, by }`

  // The home currency in force on a day (latest `home.curs` entry on or before it; before the first, the first) [O6].
  function homeOn(book, day) {
    const curs = ((book.home || {}).curs || []).filter(live).slice().sort((p, q) => (p.from < q.from ? -1 : 1));
    let c = curs.length ? curs[0].cur : null;
    for (const h of curs) if (day == null || h.from <= day) c = h.cur;
    return c;
  }
  // [stage 2 S5, STAGE2_PLAN corrections 2, 3, 2'] The rate in force for `cur` into `to` on a day (YYYY-MM-DD): of the
  // live `rates` records for the pair in either direction with `from` on or before the day, the latest by `from`, then
  // `at`, then id. `inverse` is true when that record runs the other way (1 `to` is `rate` `cur`). Null when none.
  // [S6] A conversion (`convert`, or a `transfer` or `repay` between two currencies, both amounts above zero) is a rate
  // too, worked out from the event each time as an exact ratio: 1 <what left> is a2 x 10^(its exponent) / (a x 10^(the
  // other's)) <what arrived>, dated by the event, `src: 'convert'`. `shown` is the rate in the asked direction, rounded
  // for display only (units.shownRate).
  // [second review, F3] a saved rate must be a decimal string above zero ('150.25'); any other is skipped by rateOn
  // and listed by badRates ({ id, rate }), never thrown
  const goodRate = r => typeof r.rate === 'string' && /^\d+(\.\d+)?$/.test(r.rate) && /[1-9]/.test(r.rate);
  const badRates = book => ((book && book.rates) || []).filter(r => live(r) && !goodRate(r)).map(r => ({ id: r.id, rate: r.rate }));
  function rateOn(book, cur, to, day) {
    const U = typeof module === 'object' && module.exports ? require('./units.js') : root.BurrowEngine.units;
    const pair = r => live(r) && typeof r.from === 'string' && r.from <= day && ((r.cur === cur && r.to === to) || (r.cur === to && r.to === cur));
    const s = v => String(v == null ? '' : v);
    const acc = {}; for (const a of (book && book.accounts) || []) if (live(a) && a.id) acc[a.id] = a;
    const fromEvents = ((book && book.events) || []).filter(e => live(e) && (e.k === 'convert' || e.k === 'transfer' || e.k === 'repay')
      && acc[e.acct] && acc[e.acct2] && acc[e.acct].cur !== acc[e.acct2].cur && Number.isInteger(e.a) && Number.isInteger(e.a2) && e.a > 0 && e.a2 > 0)
      .map(e => { const x = acc[e.acct].cur, y = acc[e.acct2].cur;
        return { id: e.id, from: e.date, at: e.at, cur: x, to: y, src: 'convert',
          rate: (BigInt(e.a2) * 10n ** BigInt(U.decimals(x))) + '/' + (BigInt(e.a) * 10n ** BigInt(U.decimals(y))) }; });
    const when = r => { const k = Date.parse(r.at); return isNaN(k) ? -8.64e15 : k; };   // `at` as a moment, its offset read
    const list = ((book && book.rates) || []).filter(goodRate).concat(fromEvents).filter(pair).sort((p, q) => (p.from !== q.from ? (p.from < q.from ? -1 : 1)
      : when(p) !== when(q) ? when(p) - when(q) : s(p.id) < s(q.id) ? -1 : s(p.id) > s(q.id) ? 1 : 0));
    const r = list.pop();
    return r ? { id: r.id, from: r.from, rate: r.rate, inverse: r.cur !== cur, src: r.src || 'typed', shown: U.shownRate(r.rate, r.cur !== cur) } : null;
  }
  function ctx(book, day) {
    const by = Object.create(null);
    for (const a of book.accounts || []) if (a && typeof a.id === 'string' && !a.gone) by[a.id] = a;
    const lines = Object.create(null);
    for (const l of ((book.plan || {}).budgets || [])) if (live(l)) lines[l.id] = l;
    const fees = Object.create(null);   // transfer id -> its live fee record
    for (const e of book.events || []) if (live(e) && e.k === 'spend' && e.of) fees[e.of] = e;
    return { by, lines, fees, home: homeOn(book, day), wallet: fieldValue((book.home || {}).mode) === 'wallet' };
  }
  const inTotal = (x, a) => yours(a) && a.tracked !== false && a.cur === x.home;
  const cardFull = (x, a) => !!a && a.type === 'card' && a.inFull !== false && a.cur === x.home;
  const cardLine = id => 'card:' + id;

  // The change one event makes to each account, in the account's own sign: what it holds for yours, what is owed for
  // owed accounts. [[id, change], ...]. A fee record moves no account [S5 fix]; a check, a skip, a period start, a filler
  // and a period-end answer move none.
  function accountMoves(e, by) {
    const out = [], a = e.a || 0, a2 = e.a2 != null ? e.a2 : a;
    const add = (id, v) => { if (id != null && v) out.push([id, v]); };
    const sign = id => (owed(by[id]) ? -1 : 1);   // money into an owed account lowers what is owed
    switch (e.k) {
      case 'open': add(e.acct, a); break;
      case 'in': add(e.acct, sign(e.acct) * a); break;
      case 'spend': if (!e.of) add(e.acct, -sign(e.acct) * a); break;
      case 'adjust': add(e.acct, a); break;
      case 'transfer': case 'convert': case 'borrow': case 'hand':
        add(e.acct, -sign(e.acct) * a); add(e.acct2, sign(e.acct2) * a2); break;
      case 'repay': add(e.acct, -a); add(e.acct2, -a2); break;
      default: break;
    }
    return out;
  }

  // What one event does: A (accounts) and P (places), in minor units. In Wallet mode `free` is read as Waiting.
  function apply(x, e, A, P) {
    const a1 = x.by[e.acct], a2 = x.by[e.acct2], c = e.a || 0, c2 = e.a2 != null ? e.a2 : c;
    for (const [id, v] of accountMoves(e, x.by)) A[id] = (A[id] || 0) + v;
    const put = (p, v) => { if (!v) return; if (x.wallet && p === 'free') p = 'waiting'; P[p] = (P[p] || 0) + v; };
    const spendPlace = () => e.place || (e.line && x.lines[e.line] && x.lines[e.line].place) || 'free';
    switch (e.k) {
      case 'open': {
        if (inTotal(x, a1)) {   // [B2, B6] one figure split by place, the rest in Waiting
          const sp = e.split || {};
          let rest = c;
          for (const pid in sp.places || {}) { put(pid, sp.places[pid]); rest -= sp.places[pid]; }
          for (const lid in sp.lines || {}) { put((x.lines[lid] && x.lines[lid].place) || 'bills', sp.lines[lid]); rest -= sp.lines[lid]; }
          if (sp.free != null) { put('free', sp.free); rest -= sp.free; }
          put('waiting', rest);
        } else if (cardFull(x, a1)) { put(e.place || 'waiting', -c); put(cardLine(a1.id), c); }
        break;
      }
      case 'in':
        if (owed(a1)) { if (cardFull(x, a1)) { put(cardLine(a1.id), -c); put(e.place || 'free', c); } }   // a refund onto a card
        else if (inTotal(x, a1)) put(e.place || 'waiting', c);
        break;
      case 'borrow':   // [O5, Q3] acct: the card or loan; acct2: where the money went
        if (cardFull(x, a1)) { put(cardLine(a1.id), c); put(e.place || 'waiting', (inTotal(x, a2) ? c2 : 0) - c); }
        else if (inTotal(x, a2)) put(e.place || 'waiting', c2);
        break;
      case 'move': put(e.place || 'waiting', -c); put(e.place2 || 'waiting', c); break;   // [T7] from `place` to `place2`
      case 'spend':
        if (e.of) break;   // [S5 fix] the fee record: its transfer takes the fee from this record's place
        if (owed(a1)) { if (cardFull(x, a1)) { put(spendPlace(), -c); put(cardLine(a1.id), c); } }
        else if (inTotal(x, a1)) put(spendPlace(), -c);
        break;
      case 'hand': if (inTotal(x, a1) && !inTotal(x, a2)) put(e.place || 'waiting', -c); break;
      case 'transfer': {
        if (owed(a1)) {   // [O5] money out of a card or loan is read as a borrow
          if (cardFull(x, a1)) { put(cardLine(a1.id), c); put(e.place || 'waiting', (inTotal(x, a2) ? c2 : 0) - c); }
          else if (inTotal(x, a2)) put(e.place || 'waiting', c2);
          break;
        }
        const i1 = inTotal(x, a1), i2 = inTotal(x, a2);
        if (i1 && !i2) put(e.place || 'waiting', -c);
        if (!i1 && i2) put(e.place || 'waiting', c2);
        if (i1 && i2 && c !== c2) {   // [Q2] the difference is a fee, from the place its record names, else Free to spend
          const f = x.fees[e.id];
          put((f && f.place) || 'free', -(c - c2));
        }
        break;
      }
      case 'convert':
        if (inTotal(x, a1)) put(e.place || 'waiting', -c);
        if (inTotal(x, a2)) put(e.place || 'waiting', c2);
        break;
      case 'repay':
        if (cardFull(x, a2)) { put(cardLine(a2.id), -c2); if (!inTotal(x, a1)) put(e.place || 'waiting', c2); if (inTotal(x, a1) && c !== c2) put('free', -(c - c2)); }
        else if (inTotal(x, a1)) put(e.place || 'bills', -c);
        break;
      case 'adjust':   // [T7] its account by its signed `a`, and Free to spend or the place it names
        if (owed(a1)) { if (cardFull(x, a1)) { put(e.place || 'free', -c); put(cardLine(a1.id), c); } }
        else if (inTotal(x, a1)) put(e.place || 'free', c);
        break;
      case 'periodEnd':   // [P2] one record per place holding its moves; a cover `{ from, a }` fills this place
        for (const mv of e.moves || []) {
          if (mv.from) { put(mv.from, -mv.a); put(e.place, mv.a); }
          else if (mv.to !== e.place) { put(e.place, -mv.a); put(mv.to || 'waiting', mv.a); }
        }
        break;
      default: break;   // check, skip, periodStart, filler: no money
    }
  }

  // Accounts and places added up from the live events `keep` lets through (all of them when not given).
  function sums(book, x, keep) {
    const A = Object.create(null), P = Object.create(null);
    for (const a of book.accounts || []) if (a && typeof a.id === 'string') A[a.id] = 0;
    for (const e of book.events || []) if (live(e) && (!keep || keep(e))) apply(x, e, A, P);
    return { A, P };
  }
  // Every figure, as of `day` (events dated on or before it; all of them when not given), in minor units.
  function placesOf(book, day) {
    const x = ctx(book, day), { A, P } = sums(book, x, day != null ? (e => !e.date || e.date <= day) : null);
    let have = 0, forCards = 0, owedHome = 0;
    const foreign = {}, cards = {}, accounts = {};
    for (const id in x.by) {
      const a = x.by[id], b = A[id] || 0;
      accounts[id] = b;
      if (cardFull(x, a)) { cards[id] = P[cardLine(id)] || 0; forCards += cards[id]; }
      if (inTotal(x, a)) have += b;
      else if (owed(a)) { if (a.cur === x.home) owedHome += b; }
      else if (a.cur !== x.home) foreign[a.cur] = (foreign[a.cur] || 0) + b;
    }
    const places = {};
    let total = 0;
    for (const k of Object.keys(P).sort()) { places[k] = P[k]; total += P[k]; }
    return { accounts, places, cards, forCards, total, have, owed: owedHome, afterCards: have - forCards, foreign, home: x.home };
  }
  // The one rule, checked: places add up to the tracked home accounts, and each card line equals its card.
  function proof(book) {
    const p = placesOf(book), bad = [];
    for (const id in p.cards) if (p.cards[id] !== (p.accounts[id] || 0)) bad.push(id);
    return { ok: p.total === p.have && !bad.length, total: p.total, have: p.have, cards: bad };
  }

  const api = { TYPES, TWO, owed, yours, live, fieldValue, homeOn, rateOn, badRates, ctx, accountMoves, apply, sums, placesOf, proof };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).ledger = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
