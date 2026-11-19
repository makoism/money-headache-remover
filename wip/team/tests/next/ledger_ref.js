/* LEDGER REFERENCE MODEL (tests only, side session for step B1, 2026-11-19). Not app code.
   A tiny, plain version of the design in wip/team/LEDGER_DESIGN.md, so the design is proved on paper before any app code.
   It is written as a plain script (no require, no module) so tests/next/lib.js loadModel() can load it in place of model.js:
     MODEL=tests/next/ledger_ref.js node tests/next/ledger_conservation.js
   Money is kept as whole cents inside; the API takes money units with cents (12.34), like the app.

   Two lists, one rule:
     accounts  where money sits (bank, card paid in full, wallet or cash, e-wallet, pay-later, loan, owed to you), each with a currency
     places    what money is for (waiting, bills, free, one "for the card" line per card paid in full, every burrow)
   Every coin in a tracked home-currency account is in exactly one place:  sum of those accounts = sum of places = Total.
   Owed money (cards, pay-later, loans) is held as owed accounts, never as a place. */

const LEDGER_V = 1;
const ASSET = { bank: 1, cash: 1, ewallet: 1, wallet: 1, owedToYou: 1 };
const OWED = { card: 1, paylater: 1, loan: 1 };
const toC = x => Math.round((+x || 0) * 100);
const fromC = c => c / 100;
const reserveOf = id => 'card:' + id;

/* a fresh state. setup: { cur, mode: 'track'|'wallet', accounts: [{ id, name, type, cur, inFull, payDay, tracked }] } */
function ledgerFresh(setup) {
  setup = setup || {};
  const S = { ui: { freeMode: setup.mode || 'track', cur: setup.cur || 'PHP' }, accounts: [], ledger: [], undone: [], ledgerV: LEDGER_V, nextId: 1 };
  const accts = setup.accounts || [{ id: 'bank', name: 'Bank', type: 'bank' }, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false }];
  accts.forEach(a => S.accounts.push(Object.assign({ cur: S.ui.cur, tracked: a.type !== 'wallet', inFull: a.type === 'card' }, a)));
  return S;
}
/* the shape tests/next/lib.js LEDGER() expects */
function freshState() { return ledgerFresh({}); }
function setFreeMode(S, mode) { S.ui.freeMode = mode; }

const acctOf = (S, id) => S.accounts.find(a => a.id === id) || null;
const isHome = (S, a) => a && a.cur === S.ui.cur;
const inTotal = (S, a) => a && ASSET[a.type] && a.tracked !== false && isHome(S, a);

/* side C's event shape ({ t, a, to, from }) is read as the design's shape, so their random lists run unchanged */
function norm(S, e) {
  if (e.k) return e;
  const pl = p => (p === 'chest' ? 'waiting' : p);
  const c = toC(e.a);
  switch (e.t) {
    case 'open': return { k: 'open', acct: 'bank', c, place: pl(e.to) };
    case 'pay': return { k: 'in', sub: 'pay', acct: 'bank', c, place: 'waiting' };
    case 'place': if (e.to === 'free' && S.ui.freeMode === 'wallet') return { k: 'hand', acct: 'bank', acct2: 'wallet', c, place: 'waiting' };
      return { k: 'move', c, place: 'waiting', place2: pl(e.to) };
    case 'spend': return { k: 'spend', acct: 'bank', c, place: pl(e.from) };
    case 'takeout': return { k: 'spend', sub: 'takeout', acct: 'bank', c, place: pl(e.from) };
    case 'move': return { k: 'move', c, place: pl(e.from), place2: pl(e.to) };
    case 'check': return { k: 'check', acct: 'bank', typed: c };
  }
  return null;
}

/* what one event does: account deltas and place deltas, in cents. The whole design is this one function. */
function effect(S, e) {
  const A = {}, P = {}, add = (o, k, v) => { if (v) o[k] = (o[k] || 0) + v; };
  const a1 = acctOf(S, e.acct), a2 = acctOf(S, e.acct2), c = e.c || 0;
  switch (e.k) {
    case 'open':          /* a typed balance becomes an opening balance. Owed accounts: what is owed now */
      add(A, e.acct, c);
      if (inTotal(S, a1)) add(P, e.place || 'waiting', c);
      else if (a1 && a1.type === 'card' && a1.inFull) { add(P, e.place || 'waiting', -c); add(P, reserveOf(a1.id), c); }
      break;
    case 'in':            /* pay, refund, gift, paid back to you, other money in */
      if (a1 && OWED[a1.type]) {   /* a refund onto a card or pay-later lowers what is owed (found by the Japan persona) */
        add(A, e.acct, -c);
        if (a1.type === 'card' && a1.inFull) { add(P, reserveOf(a1.id), -c); add(P, e.place || 'free', c); }
      } else { add(A, e.acct, c); if (inTotal(S, a1)) add(P, e.place || 'waiting', c); }
      break;
    case 'borrow':        /* borrowed money lands in an account and is owed */
      add(A, e.acct, c); add(A, e.acct2, c); if (inTotal(S, a1)) add(P, e.place || 'waiting', c); break;
    case 'move':          /* place to place: no account moves, Total stays */
      add(P, e.place, -c); add(P, e.place2, c); break;
    case 'spend':         /* spend, bill, family support, take out of a burrow; paid with acct */
      if (a1 && OWED[a1.type]) {
        add(A, e.acct, c);
        if (a1.type === 'card' && a1.inFull) { add(P, e.place, -c); add(P, reserveOf(a1.id), c); }   /* money set aside for the card bill */
        /* pay-later and loans: bought with borrowed money, no place had it; the instalments are bills later */
      } else { add(A, e.acct, -c); if (inTotal(S, a1)) add(P, e.place, -c); }
      break;
    case 'hand':          /* Wallet mode: Free to spend leaves the tracked accounts for the wallet */
      add(A, e.acct, -c); add(A, e.acct2, c); if (inTotal(S, a1) && !inTotal(S, a2)) add(P, e.place || 'waiting', -c); break;
    case 'transfer':      /* account to account, same currency (ATM, bank to GCash, lending: bank to "owed to you") */
      add(A, e.acct, -c); add(A, e.acct2, c);
      if (inTotal(S, a1) && !inTotal(S, a2)) add(P, e.place || 'waiting', -c);
      if (!inTotal(S, a1) && inTotal(S, a2)) add(P, e.place || 'waiting', c);
      break;
    case 'convert':       /* foreign account to home account: c leaves in the foreign currency, c2 lands at home */
      add(A, e.acct, -c); add(A, e.acct2, e.c2); if (inTotal(S, a2)) add(P, e.place || 'waiting', e.c2); break;
    case 'repay':         /* card payment, pay-later instalment, loan payment: account down, owed down */
      add(A, e.acct, -c); add(A, e.acct2, -c);
      if (inTotal(S, a1)) add(P, e.place || (a2 && a2.type === 'card' && a2.inFull ? reserveOf(a2.id) : 'bills'), -c);
      break;
    case 'adjust':        /* after check your bank: the person accepts the difference. c is signed */
      if (a1 && OWED[a1.type]) { add(A, e.acct, c); if (a1.type === 'card' && a1.inFull) { add(P, e.place || 'free', -c); add(P, reserveOf(a1.id), c); } }
      else { add(A, e.acct, c); if (inTotal(S, a1)) add(P, e.place || 'free', c); }
      break;
    case 'check': break;   /* moves no money */
  }
  return { A, P };
}

/* balances are always worked out from the ledger, never stored */
function balances(S, upto) {
  const A = {}, P = {}; let unexplained = null, checks = {};
  S.accounts.forEach(a => { A[a.id] = 0; });
  const L = upto == null ? S.ledger : S.ledger.slice(0, upto);
  for (const raw of L) {
    const e = norm(S, raw); if (!e) continue;
    if (e.k === 'check') { const u = e.typed - (A[e.acct] || 0); checks[e.acct] = { typed: e.typed, unexplained: u, date: e.date }; if (e.acct === 'bank' || unexplained === null) unexplained = u; continue; }
    const f = effect(S, e);
    for (const k in f.A) A[k] = (A[k] || 0) + f.A[k];
    for (const k in f.P) P[k] = (P[k] || 0) + f.P[k];
  }
  return { A, P, unexplained, checks };
}

function placesOf(S) {
  const { A, P, unexplained, checks } = balances(S);
  const mode = S.ui.freeMode;
  let reserve = 0, cards = {}; const burrows = {};
  for (const k in P) {
    if (k.startsWith('card:')) { reserve += P[k]; cards[k.slice(5)] = fromC(P[k]); }
    else if (!['waiting', 'bills', 'free'].includes(k)) burrows[k] = P[k];
  }
  const waiting = P.waiting || 0, bills = (P.bills || 0) + reserve, free = mode === 'track' ? (P.free || 0) : 0;
  const saved = Object.values(burrows).reduce((a, b) => a + b, 0);
  const thisMonth = bills + free, total = waiting + thisMonth + saved;
  let have = 0, owed = 0; const foreign = {}, accounts = {};
  S.accounts.forEach(a => {
    const b = A[a.id] || 0; accounts[a.id] = fromC(b);
    if (inTotal(S, a)) have += b; else if (OWED[a.type]) owed += b; else if (!isHome(S, a)) foreign[a.cur] = fromC((toC(foreign[a.cur] || 0)) + b);
  });
  /* L4: in Wallet mode Free to spend shows what was handed to the wallet since the last pay day */
  let handed = 0; for (const raw of S.ledger) { const e = norm(S, raw); if (!e) continue; if (e.k === 'in' && e.sub === 'pay') handed = 0; if (e.k === 'hand') handed += e.c; }
  const ch = {}; for (const k in checks) ch[k] = { typed: fromC(checks[k].typed), unexplained: fromC(checks[k].unexplained) };
  return {
    chest: fromC(waiting), waiting: fromC(waiting), bills: fromC(bills), billsOnly: fromC(P.bills || 0), forCards: fromC(reserve), cards,
    free: mode === 'track' ? fromC(P.free || 0) : fromC(handed), wallet: fromC(handed),
    burrows: Object.fromEntries(Object.entries(burrows).map(([k, v]) => [k, fromC(v)])), saved: fromC(saved),
    thisMonth: fromC(thisMonth), total: fromC(total), have: fromC(have), owed: fromC(owed), foreign, accounts,
    unexplained: unexplained == null ? null : fromC(unexplained), checks: ch,
  };
}

/* add one event. Returns false (and records nothing) only for an event the design cannot read */
function ledgerAdd(S, ev) {
  const e = Object.assign({}, ev);
  if (e.k) { if (e.a != null && e.c == null) e.c = toC(e.a); if (e.a2 != null) e.c2 = toC(e.a2); if (e.typedA != null) e.typed = toC(e.typedA); delete e.a; delete e.a2; delete e.typedA; }
  const n = norm(S, e); if (!n) return false;
  if (n.acct && !acctOf(S, n.acct)) return false;
  if (n.acct2 && !acctOf(S, n.acct2)) return false;
  if (n.k === 'move' && n.place === n.place2) return false;
  e.id = S.nextId++; S.ledger.push(e); S.undone = [];
  return true;
}
/* undo: the last event leaves the ledger but is kept in S.undone (saved with the ledger, so it survives a reload: L2) */
function ledgerUndo(S, id) {
  let i = S.ledger.length - 1;
  if (id != null) i = S.ledger.findIndex(e => e.id === id);
  if (i < 0) return false;
  const [e] = S.ledger.splice(i, 1); S.undone.push({ e, at: i }); return true;
}
function ledgerRedo(S) { const u = S.undone.pop(); if (!u) return false; S.ledger.splice(Math.min(u.at, S.ledger.length), 0, u.e); return true; }

/* E5: a saved 38.31 copy moves into the ledger.
   old: { cur, bankStart, bankAt, cards: [{ name, owed, payDay }], goals: [{ id, start }], plan: {...} } (made-up shape of the 38.31 save) */
function migrate3831(old, today) {
  const S = ledgerFresh({ cur: old.cur, mode: old.freeMode || 'track', accounts: [{ id: 'bank', name: 'Bank', type: 'bank' }] });
  S.frozen = JSON.parse(JSON.stringify(old)); S.frozen.frozenAt = today;   /* a frozen copy, never written again */
  const goalSum = (old.goals || []).reduce((a, g) => a + toC(g.start), 0);
  if (goalSum) S.accounts.push({ id: 'oldsavings', name: 'Savings from your old plan', type: 'bank', cur: S.ui.cur, tracked: true, confirm: true });
  (old.cards || []).forEach((c, i) => S.accounts.push({ id: 'card' + (i + 1), name: c.name, type: 'card', cur: S.ui.cur, inFull: true, payDay: c.payDay, tracked: true }));
  if (old.bankStart) ledgerAdd(S, { k: 'open', acct: 'bank', a: old.bankStart, place: 'waiting', date: old.bankAt || today });
  (old.goals || []).forEach(g => { if (toC(g.start)) ledgerAdd(S, { k: 'open', acct: 'oldsavings', a: g.start, place: g.id, date: today }); });
  (old.cards || []).forEach((c, i) => { if (toC(c.owed)) ledgerAdd(S, { k: 'open', acct: 'card' + (i + 1), a: c.owed, place: 'waiting', date: c.at || today }); });
  S.oldFigures = { shownOnce: false, plan: old.planFigures || null };   /* the old plan's figures, shown once beside the new ones */
  S.undone = [];
  return S;
}

/* when loaded with require() too */
if (typeof module !== 'undefined' && module.exports) module.exports = { LEDGER_V, ledgerFresh, freshState, setFreeMode, ledgerAdd, ledgerUndo, ledgerRedo, placesOf, balances, effect, migrate3831, toC, fromC };
