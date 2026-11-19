/* ===== LEDGER (pure: no DOM, no storage, no clock) =====
   Step B1, written from wip/team/LEDGER_DESIGN.md and proved equal to the reference model tests/next/ledger_ref.js
   (tests/next/ledger_diff.js), with tests/next/ledger_conservation.js, ledger_fuzz.js and ledger_edge.js.
   Handoff and wiring notes: wip/team/LANE_ledger_core.md.

   Two lists and one rule.
     S.accounts   where money sits: bank, cash, ewallet, wallet, owedToYou (yours) and card, paylater, loan (owed)
     S.ledger     dated events, in the order they were added. It is never trimmed and never rewritten.
     places       what money is for: 'waiting', 'bills', 'free', one 'card:<id>' line per card paid in full, and every burrow id
   Every coin in a tracked account in the home currency is in exactly one place, so those accounts added up and the places added up
   are the same number: Total. What is owed sits in owed accounts, never in a place.
   NOTHING IS STORED AS A BALANCE. Every figure is added up from the events each time it is asked for.

   Money. Inside, every amount is a whole number of cents (hundredths), in every currency, so sums are exact. An event is given
   in money units (a: 12.34) or in cents (c: 1234); it is stored in cents only (c, c2, typed). Yen and the other currencies in
   LED_WHOLE have no cents: an amount with cents in them is refused. placesOf() answers in money units (cents / 100) for the screens.

   Days. The clock is never read here. A day is always passed in as 'YYYY-MM-DD'.

   Refusals. A wrong or unknown event is refused whole: nothing is recorded, the function returns false and ledgerWhy() gives
   { code, why }. The screens write their own words from the code.

   Every name in this file starts with ledger, LEDGER, led or LED, except the six the tests name: placesOf, periodOf, flows,
   migrate3831 (and ledgerFresh, ledgerAdd, ledgerUndo, ledgerRedo). So it can sit beside model.js in one script. */

const LEDGER_V = 1;   /* the shape of the saved ledger. A page that knows a lower number must not write over a higher one (ledgerMayWrite) */

/* ---- tables ---- */
const LED_KINDS = { open: 1, in: 1, borrow: 1, move: 1, spend: 1, hand: 1, transfer: 1, convert: 1, repay: 1, check: 1, adjust: 1 };
const LED_TYPES = { bank: 'yours', cash: 'yours', ewallet: 'yours', wallet: 'yours', owedToYou: 'yours', card: 'owed', paylater: 'owed', loan: 'owed' };
const LED_TWO = { borrow: 1, hand: 1, transfer: 1, convert: 1, repay: 1 };   /* kinds that name a second account */
const LED_WHOLE = { JPY: 1, '¥': 1, KRW: 1, '₩': 1, VND: 1, '₫': 1 };       /* currencies with no cents (code or the sign model.js uses) */
const LED_MAX_C = 1e13;                       /* the largest single amount, in cents (100 billion units). Sums stay exact far past this */
const LED_ID = /^[A-Za-z0-9_-]{1,24}$/;       /* account ids and place ids */
const LED_DAY = /^\d{4}-\d{2}-\d{2}$/;
const LED_SRC_FREE = { typed: 1, migration: 1 };   /* sources that may repeat. Any other src (a statement line, a receipt) is logged once only */
const LED_LOCKED = ['id', 'type', 'cur', 'inFull', 'tracked'];   /* account fields that cannot change once the account has events */
const LED_WORDS = {
  'no-ledger': 'There is no ledger here.',
  'newer': 'This copy was saved by a newer version of the app. Update the app before changing it.',
  'not-event': 'This is not an event.',
  'kind': 'Unknown kind of event.',
  'no-date': 'The event has no date.',
  'date': 'The date is not a real day. Use YYYY-MM-DD.',
  'future': 'That day has not come yet.',
  'amount': 'The amount is missing, is not a number, has more than two decimals or is too large.',
  'amount-sign': 'The amount must be more than zero.',
  'amount-zero': 'There is nothing to adjust: the amount is zero.',
  'amount-whole': 'This currency has no cents. Use a whole amount.',
  'amount-two': 'The amount was given twice (in units and in cents) and the two do not agree.',
  'typed': 'The typed balance is missing or is not a number.',
  'acct': 'The account is missing or unknown.',
  'acct2': 'The second account is missing or unknown.',
  'acct-same': 'The two accounts are the same.',
  'acct-type': 'This kind of event does not fit this type of account.',
  'acct-cur': 'The two accounts are in different currencies. Use convert.',
  'acct-cur-same': 'The two accounts are in the same currency. Use transfer.',
  'acct-closed': 'This account was closed before that day.',
  'place': 'The place is missing or its name is not allowed.',
  'place-same': 'The two places are the same.',
  'before-open': 'This is dated before the day the balance of this account was typed, so it is already inside that balance.',
  'open-twice': 'This account already has an opening balance there. Use check your bank to correct it.',
  'open-day': 'An account has one opening day. This opening balance has another date than the first.',
  'open-late': 'This account already has events before that day. Use check your bank instead of an opening balance.',
  'already': 'This line is already logged.',
  'nothing': 'There is nothing to undo.',
  'no-id': 'There is no event with that id.',
  'no-redo': 'There is nothing to put back.',
  'acct-new': 'The account needs an id (letters, digits, - or _), a type and a currency, and its id must not be in use.',
  'acct-locked': 'The type, currency and the way an account is counted cannot change once it has events.',
  'acct-open': 'This account still holds money or is still owed. Move it out or check it first.',
  'acct-later': 'This account has events after that day.',
  'setup': 'The setup is not usable: it needs a currency, and every account must be valid.',
  'mode': 'The mode must be track or wallet.',
  'paydays': 'Pay days are whole days of the month, from 1 to 31.',
  'cur-locked': 'The home currency cannot change once there are events.',
  'missing-accounts': 'Start fresh needs a typed balance for every account.',
  'old-copy': 'The saved copy to move is missing or unreadable.',
  'no-question': 'There is no open question for this account, or the answer is not yes or no.',
};
let LED_LAST = null;   /* the last refusal, for ledgerWhy() */

/* ---- small helpers ---- */
const ledNo = (code, more) => ({ ok: false, code, why: LED_WORDS[code] + (more ? ' (' + more + ')' : '') });
const ledFail = r => { LED_LAST = { code: r.code, why: r.why }; return false; };
/* why the last ledger call returned false: { code, why }, or null */
function ledgerWhy() { return LED_LAST; }
const ledIdOk = s => typeof s === 'string' && LED_ID.test(s) && !(s in {});
const ledPad = n => (n < 10 ? '0' : '') + n;
const ledDim = (y, m) => (m === 2 ? ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28) : (m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31));
function ledDayOk(d) {
  if (typeof d !== 'string' || !LED_DAY.test(d)) return false;
  const y = +d.slice(0, 4), m = +d.slice(5, 7), dd = +d.slice(8, 10);
  return y >= 1000 && m >= 1 && m <= 12 && dd >= 1 && dd <= ledDim(y, m);
}
/* day d of month m (m may run past 12 or below 1), held to the month's last day */
function ledYmd(y, m, d) { const i = y * 12 + (m - 1), yy = Math.floor(i / 12), mm = i - yy * 12 + 1; return yy + '-' + ledPad(mm) + '-' + ledPad(Math.min(d, ledDim(yy, mm))); }
const ledDate = e => (e && typeof e.date === 'string' ? e.date : '');   /* an event with no date counts from the very start */
/* money units (number or numeric text) to whole cents; null when it is not a usable amount */
function ledCents(v) {
  if (typeof v === 'string' && v.trim() !== '') v = +v;
  if (typeof v !== 'number' || !isFinite(v)) return null;
  const f = v * 100, c = Math.round(f);
  if (Math.abs(f - c) > 0.005 || Math.abs(c) > LED_MAX_C) return null;
  return c === 0 ? 0 : c;
}
/* one amount of an event: units field (a) or cents field (c). undefined = not given, null = not usable, 'two' = both and they differ */
function ledAmount(ev, unitsKey, centsKey) {
  const hasU = ev[unitsKey] != null, hasC = ev[centsKey] != null;
  if (!hasU && !hasC) return undefined;
  const u = hasU ? ledCents(ev[unitsKey]) : null, c = hasC ? (Number.isSafeInteger(ev[centsKey]) && Math.abs(ev[centsKey]) <= LED_MAX_C ? ev[centsKey] : null) : null;
  if (hasU && u === null) return null;
  if (hasC && c === null) return null;
  if (hasU && hasC && u !== c) return 'two';
  return hasU ? u : (c === 0 ? 0 : c);
}
const ledCopy = v => JSON.parse(JSON.stringify(v));

/* ---- how the accounts are read ---- */
function ledCtx(S) {
  const by = Object.create(null);
  (S.accounts || []).forEach(a => { if (a && typeof a.id === 'string') by[a.id] = a; });
  const ui = S.ui || {};
  return { by, home: ui.cur, wallet: ui.freeMode === 'wallet' };
}
const ledOwed = a => !!a && LED_TYPES[a.type] === 'owed';
const ledYours = a => !!a && LED_TYPES[a.type] === 'yours';
/* in Total: yours, tracked, in the home currency */
const ledInTotal = (x, a) => ledYours(a) && a.tracked !== false && a.cur === x.home;
/* a card paid in full, in the home currency: it has a "for the card" line that always equals what is on the card */
const ledCardFull = (x, a) => !!a && a.type === 'card' && !!a.inFull && a.cur === x.home;
const ledLine = id => 'card:' + id;

/* WHAT ONE EVENT DOES, in cents: A = account changes, P = place changes. The whole design is this one function.
   In Wallet mode there is no Free to spend place (that money is handed out), so 'free' is read as 'waiting': a copy that was in
   Track mode and switched keeps every coin in sight. */
function ledApply(x, e, A, P) {
  const a1 = x.by[e.acct], a2 = x.by[e.acct2];
  const c = Number.isSafeInteger(e.c) ? e.c : 0;
  const acc = (id, v) => { if (v && id != null) A[id] = (A[id] || 0) + v; };
  const put = (p, v) => { if (!v) return; if (x.wallet && p === 'free') p = 'waiting'; P[p] = (P[p] || 0) + v; };
  switch (e.k) {
    case 'open':       /* a typed balance at the start. For an owed account: what is owed on that day */
      acc(e.acct, c);
      if (ledInTotal(x, a1)) put(e.place || 'waiting', c);
      else if (ledCardFull(x, a1)) { put(e.place || 'waiting', -c); put(ledLine(a1.id), c); }
      break;
    case 'in':         /* pay, refund, gift, grant, other money in */
      if (ledOwed(a1)) {   /* a refund onto a card or pay-later lowers what is owed */
        acc(e.acct, -c);
        if (ledCardFull(x, a1)) { put(ledLine(a1.id), -c); put(e.place || 'free', c); }
      } else { acc(e.acct, c); if (ledInTotal(x, a1)) put(e.place || 'waiting', c); }
      break;
    case 'borrow':     /* borrowed money lands in an account and is owed */
      acc(e.acct, c); acc(e.acct2, c);
      if (ledCardFull(x, a2)) {   /* cash taken on a card paid in full: it is set aside for the card bill at once */
        put(ledLine(a2.id), c); if (!ledInTotal(x, a1)) put(e.place || 'waiting', -c);
      } else if (ledInTotal(x, a1)) put(e.place || 'waiting', c);
      break;
    case 'move':       /* place to place. No account moves, Total stays */
      put(e.place, -c); put(e.place2, c);
      break;
    case 'spend':      /* spend, bill, family support, take out of a burrow; paid with acct */
      if (ledOwed(a1)) {
        acc(e.acct, c);
        if (ledCardFull(x, a1)) { put(e.place, -c); put(ledLine(a1.id), c); }   /* set aside for the card bill */
        /* pay-later and loans: bought with borrowed money, no place had it. The instalments are bills later */
      } else { acc(e.acct, -c); if (ledInTotal(x, a1)) put(e.place, -c); }
      break;
    case 'hand':       /* Wallet mode: Free to spend leaves the tracked accounts for the wallet */
      acc(e.acct, -c); acc(e.acct2, c);
      if (ledInTotal(x, a1) && !ledInTotal(x, a2)) put(e.place || 'waiting', -c);
      break;
    case 'transfer':   /* account to account, same currency: ATM, bank to e-wallet, lent, paid back to you */
      acc(e.acct, -c); acc(e.acct2, c);
      if (ledInTotal(x, a1) && !ledInTotal(x, a2)) put(e.place || 'waiting', -c);
      if (!ledInTotal(x, a1) && ledInTotal(x, a2)) put(e.place || 'waiting', c);
      break;
    case 'convert': {  /* one currency to another: c leaves the first account, c2 lands in the second */
      const c2 = Number.isSafeInteger(e.c2) ? e.c2 : 0;
      acc(e.acct, -c); acc(e.acct2, c2);
      if (ledInTotal(x, a1)) put(e.place || 'waiting', -c);
      if (ledInTotal(x, a2)) put(e.place || 'waiting', c2);
      break; }
    case 'repay':      /* card payment, instalment, paid back: the account down, what is owed down */
      acc(e.acct, -c); acc(e.acct2, -c);
      if (ledCardFull(x, a2)) {   /* a card paid in full is always paid out of its own line, so the line always equals the card */
        put(ledLine(a2.id), -c); if (!ledInTotal(x, a1)) put(e.place || 'waiting', c);   /* paid from outside Total: the money set aside is free again */
      } else if (ledInTotal(x, a1)) put(e.place || 'bills', -c);
      break;
    case 'adjust':     /* check your bank: the person accepts the difference. c is signed */
      acc(e.acct, c);
      if (ledOwed(a1)) { if (ledCardFull(x, a1)) { put(e.place || 'free', -c); put(ledLine(a1.id), c); } }
      else if (ledInTotal(x, a1)) put(e.place || 'free', c);
      break;
    /* check: moves no money */
  }
}
/* accounts and places added up from the events that pass keep (all of them when keep is not given) */
function ledSums(S, x, keep) {
  const A = Object.create(null), P = Object.create(null), L = S.ledger || [];
  (S.accounts || []).forEach(a => { if (a && typeof a.id === 'string') A[a.id] = 0; });
  for (let i = 0; i < L.length; i++) { const e = L[i]; if (!e || e.k === 'check' || (keep && !keep(e))) continue; ledApply(x, e, A, P); }
  return { A, P };
}
const ledSumAll = P => { let t = 0; for (const k in P) t += P[k]; return t; };
/* one account's balance from its events dated on or before day, in cents */
function ledBalanceOn(S, x, acct, day) { return ledSums(S, x, e => ledDate(e) <= day).A[acct] || 0; }

/* ===== making a ledger ===== */
/* a fresh, empty ledger. setup: { cur, mode: 'track' | 'wallet', payDays: [10], accounts: [{ id, name, type, cur, inFull, payDay, tracked }] }
   Returns the state, or false (ledgerWhy says why) when the setup cannot be used. */
function ledgerFresh(setup) {
  setup = setup || {};
  if (typeof setup.cur !== 'string' || !setup.cur) return ledFail(ledNo('setup', 'no currency'));
  const mode = setup.mode == null ? 'track' : setup.mode;
  if (mode !== 'track' && mode !== 'wallet') return ledFail(ledNo('mode'));
  const days = setup.payDays == null ? [1] : ledPayDays(setup.payDays);
  if (!days) return ledFail(ledNo('paydays'));
  const S = { ui: { freeMode: mode, cur: setup.cur, payDays: days }, accounts: [], ledger: [], undone: [], removed: [], ledgerV: LEDGER_V, ledgerNext: 1 };
  const list = setup.accounts || [];
  if (!Array.isArray(list)) return ledFail(ledNo('setup', 'accounts is not a list'));
  for (let i = 0; i < list.length; i++) if (!ledgerAddAccount(S, list[i])) return false;
  LED_LAST = null;
  return S;
}
function ledPayDays(v) {
  if (!Array.isArray(v) || !v.length || v.length > 31) return null;
  const out = [];
  for (const d of v) { if (!Number.isInteger(d) || d < 1 || d > 31) return null; if (out.indexOf(d) < 0) out.push(d); }
  return out.sort((a, b) => a - b);
}
/* add an account. Unknown fields are kept. Returns the stored account or false */
function ledgerAddAccount(S, acct) {
  if (!S || !Array.isArray(S.accounts) || !S.ui) return ledFail(ledNo('no-ledger'));
  if ((+S.ledgerV || 0) > LEDGER_V) return ledFail(ledNo('newer'));
  if (!acct || typeof acct !== 'object' || Array.isArray(acct) || !ledIdOk(acct.id) || typeof LED_TYPES[acct.type] !== 'string' || !Object.prototype.hasOwnProperty.call(LED_TYPES, acct.type)) return ledFail(ledNo('acct-new'));
  if (S.accounts.some(a => a && a.id === acct.id)) return ledFail(ledNo('acct-new', 'id in use: ' + acct.id));
  if (acct.cur != null && (typeof acct.cur !== 'string' || !acct.cur)) return ledFail(ledNo('acct-new', 'currency'));
  if (acct.payDay != null && !(Number.isInteger(acct.payDay) && acct.payDay >= 1 && acct.payDay <= 31)) return ledFail(ledNo('paydays'));
  if (acct.closed != null && !ledDayOk(acct.closed)) return ledFail(ledNo('date'));
  const a = Object.assign({ cur: S.ui.cur, tracked: acct.type !== 'wallet', inFull: acct.type === 'card' }, ledCopy(acct));
  if (a.cur == null) a.cur = S.ui.cur;
  a.tracked = a.tracked !== false; a.inFull = !!a.inFull;
  if (typeof a.name !== 'string' || !a.name) a.name = a.id;
  S.accounts.push(a); LED_LAST = null;
  return a;
}
const ledUsed = (S, id) => (S.ledger || []).some(e => e && (e.acct === id || e.acct2 === id)) || (S.undone || []).some(u => u && (u.items || []).some(it => it.e && (it.e.acct === id || it.e.acct2 === id)));
/* change an account's name, pay day, preset and other notes. Its type, currency, inFull and tracked are locked once it has events,
   because changing them would silently change every past figure. Returns the account or false */
function ledgerEditAccount(S, id, patch) {
  const a = S && Array.isArray(S.accounts) ? S.accounts.find(q => q && q.id === id) : null;
  if (!a) return ledFail(ledNo('acct'));
  if ((+S.ledgerV || 0) > LEDGER_V) return ledFail(ledNo('newer'));
  if (!patch || typeof patch !== 'object') return ledFail(ledNo('acct-new'));
  if ('id' in patch && patch.id !== a.id) return ledFail(ledNo('acct-locked'));
  if ('closed' in patch) return ledFail(ledNo('acct-locked', 'use ledgerCloseAccount'));
  const used = ledUsed(S, id);
  for (const k of LED_LOCKED) if (k in patch && patch[k] !== a[k] && used) return ledFail(ledNo('acct-locked', k));
  if ('type' in patch && !Object.prototype.hasOwnProperty.call(LED_TYPES, patch.type)) return ledFail(ledNo('acct-new'));
  if ('cur' in patch && (typeof patch.cur !== 'string' || !patch.cur)) return ledFail(ledNo('acct-new', 'currency'));
  if (patch.payDay != null && !(Number.isInteger(patch.payDay) && patch.payDay >= 1 && patch.payDay <= 31)) return ledFail(ledNo('paydays'));
  Object.assign(a, ledCopy(patch));
  a.tracked = a.tracked !== false; a.inFull = !!a.inFull; LED_LAST = null;
  return a;
}
/* close an account on a day: hidden on the screens, never deleted, its events stay in every sum. Only an account that holds nothing
   (or is owed nothing) can be closed, and no event dated after the closing day is taken for it */
function ledgerCloseAccount(S, id, day) {
  const a = S && Array.isArray(S.accounts) ? S.accounts.find(q => q && q.id === id) : null;
  if (!a) return ledFail(ledNo('acct'));
  if ((+S.ledgerV || 0) > LEDGER_V) return ledFail(ledNo('newer'));
  if (!ledDayOk(day)) return ledFail(ledNo('date'));
  if (ledSums(S, ledCtx(S)).A[id]) return ledFail(ledNo('acct-open'));
  if (S.ledger.some(e => e && (e.acct === id || e.acct2 === id) && ledDate(e) > day)) return ledFail(ledNo('acct-later'));
  a.closed = day; LED_LAST = null;
  return a;
}
function ledgerReopenAccount(S, id) {
  const a = S && Array.isArray(S.accounts) ? S.accounts.find(q => q && q.id === id) : null;
  if (!a) return ledFail(ledNo('acct'));
  delete a.closed; LED_LAST = null;
  return a;
}
/* Track: Free to spend is a place. Wallet: it is handed out of the tracked accounts */
function ledgerSetMode(S, mode) {
  if (!S || !S.ui) return ledFail(ledNo('no-ledger'));
  if (mode !== 'track' && mode !== 'wallet') return ledFail(ledNo('mode'));
  S.ui.freeMode = mode; LED_LAST = null; return true;
}
function ledgerSetPayDays(S, days) {
  if (!S || !S.ui) return ledFail(ledNo('no-ledger'));
  const d = ledPayDays(days); if (!d) return ledFail(ledNo('paydays'));
  S.ui.payDays = d; LED_LAST = null; return true;
}

/* ===== events ===== */
/* Read one event against the ledger without recording it. Returns { ok: true, e } (e is the event as it would be stored, with no
   id yet) or { ok: false, code, why }. ev is never changed. today is the day to use when the event has no date of its own; when
   it is given, an event dated after it is refused. */
function ledgerTry(S, ev, today) {
  if (!S || !Array.isArray(S.ledger) || !Array.isArray(S.accounts) || !S.ui) return ledNo('no-ledger');
  if ((+S.ledgerV || 0) > LEDGER_V) return ledNo('newer');
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return ledNo('not-event');
  const k = ev.k;
  if (typeof k !== 'string' || LED_KINDS[k] !== 1 || !Object.prototype.hasOwnProperty.call(LED_KINDS, k)) return ledNo('kind', String(k));
  if (today != null && !ledDayOk(today)) return ledNo('date', 'the day passed in');
  const date = ev.date != null ? ev.date : today;
  if (date == null) return ledNo('no-date');
  if (!ledDayOk(date)) return ledNo('date');
  if (today != null && date > today) return ledNo('future');
  const x = ledCtx(S);

  /* accounts */
  let a1 = null, a2 = null;
  if (k !== 'move') {
    a1 = typeof ev.acct === 'string' ? x.by[ev.acct] : null; if (!a1) return ledNo('acct', String(ev.acct));
    if (LED_TWO[k] === 1) {
      a2 = typeof ev.acct2 === 'string' ? x.by[ev.acct2] : null; if (!a2) return ledNo('acct2', String(ev.acct2));
      if (a1 === a2) return ledNo('acct-same');
      if (k === 'convert') { if (a1.cur === a2.cur) return ledNo('acct-cur-same'); } else if (a1.cur !== a2.cur) return ledNo('acct-cur');
      if (!ledYours(a1)) return ledNo('acct-type', 'the first account must be one that holds money');
      if ((k === 'borrow' || k === 'repay') && !ledOwed(a2)) return ledNo('acct-type', 'the second account must be a card, pay-later or loan');
      if ((k === 'hand' || k === 'transfer' || k === 'convert') && !ledYours(a2)) return ledNo('acct-type', 'the second account must be one that holds money');
      if (k === 'hand' && a2.tracked !== false) return ledNo('acct-type', 'money is handed to a wallet that is not tracked');
    }
  }

  /* amounts */
  let c = ledAmount(ev, 'a', 'c'), c2, typed;
  if (k === 'check') {
    typed = ledAmount(ev, 'typedA', 'typed');
    if (typed === undefined || typed === null) return ledNo('typed');
    if (typed === 'two') return ledNo('amount-two');
    c = undefined;
  } else {
    if (c === undefined || c === null) return ledNo('amount');
    if (c === 'two') return ledNo('amount-two');
    if (k === 'adjust') { if (c === 0) return ledNo('amount-zero'); }
    else if (k !== 'open' && !(c > 0)) return ledNo('amount-sign');
    if (k === 'convert') {
      c2 = ledAmount(ev, 'a2', 'c2');
      if (c2 === undefined || c2 === null) return ledNo('amount', 'what arrived');
      if (c2 === 'two') return ledNo('amount-two');
      if (!(c2 > 0)) return ledNo('amount-sign');
    }
  }
  const whole = cur => LED_WHOLE[cur] === 1 && Object.prototype.hasOwnProperty.call(LED_WHOLE, cur);
  const cur1 = a1 ? a1.cur : x.home;
  if (whole(cur1) && ((c !== undefined && c % 100 !== 0) || (typed !== undefined && typed % 100 !== 0))) return ledNo('amount-whole');
  if (c2 !== undefined && whole(a2.cur) && c2 % 100 !== 0) return ledNo('amount-whole');

  /* places. A "for the card" line is never named by hand: it always equals the card */
  if (ev.place != null && !ledIdOk(ev.place)) return ledNo('place', String(ev.place));
  if (k === 'move') {
    if (!ledIdOk(ev.place) || !ledIdOk(ev.place2)) return ledNo('place');
    if (ev.place === ev.place2) return ledNo('place-same');
  } else if (k === 'spend' && ev.place == null && (ledInTotal(x, a1) || ledCardFull(x, a1))) return ledNo('place', 'what was this for');

  /* closed accounts, the opening day, and lines already logged */
  const touched = [a1, a2].filter(Boolean);
  for (const a of touched) if (typeof a.closed === 'string' && date > a.closed) return ledNo('acct-closed', a.id);
  const L = S.ledger;
  if (k === 'open') {
    const at = ev.place || 'waiting';
    for (const q of L) {
      if (!q || (q.acct !== a1.id && q.acct2 !== a1.id)) continue;
      if (q.k === 'open') { if ((q.place || 'waiting') === at) return ledNo('open-twice'); if (ledDate(q) !== date) return ledNo('open-day'); }
      else if (ledDate(q) < date) return ledNo('open-late');
    }
  } else if (touched.length) {
    for (const q of L) if (q && q.k === 'open' && date < ledDate(q) && touched.some(a => a.id === q.acct)) return ledNo('before-open', q.acct);
  }
  if (typeof ev.src === 'string' && LED_SRC_FREE[ev.src] !== 1 && L.some(q => q && q.src === ev.src)) return ledNo('already', ev.src);

  /* the event as stored: every field given is kept (also ones this version does not know), amounts in cents only */
  const e = ledCopy(ev);
  delete e.a; delete e.a2; delete e.typedA; delete e.c; delete e.c2; delete e.typed; delete e.id;
  e.k = k; e.date = date;
  if (c !== undefined) e.c = c;
  if (c2 !== undefined) e.c2 = c2;
  if (typed !== undefined) e.typed = typed;
  return { ok: true, e };
}
function ledPush(S, e, grp) {
  if (!Number.isSafeInteger(S.ledgerNext) || S.ledgerNext < 1) S.ledgerNext = ledNextId(S);
  e.id = S.ledgerNext++; if (grp != null) e.grp = grp;
  S.ledger.push(e);
  return e;
}
const ledNextId = S => { let m = 0; const see = e => { if (e && Number.isSafeInteger(e.id) && e.id > m) m = e.id; };
  (S.ledger || []).forEach(see); (S.undone || []).forEach(u => (u && u.items || []).forEach(it => see(it.e))); (S.removed || []).forEach(see); return m + 1; };
/* a new event ends redo (L2). The undone events are not thrown away: they move to S.removed, outside every sum */
function ledEndRedo(S) {
  if (!Array.isArray(S.undone)) S.undone = [];
  if (!S.undone.length) return;
  if (!Array.isArray(S.removed)) S.removed = [];
  S.undone.forEach(u => (u && u.items || []).forEach(it => { if (it.e) S.removed.push(it.e); }));
  S.undone = [];
}
/* record one event. Returns the stored event, or false with nothing recorded (ledgerWhy says why) */
function ledgerAdd(S, ev, today) {
  const r = ledgerTry(S, ev, today);
  if (!r.ok) return ledFail(r);
  const e = ledPush(S, r.e); ledEndRedo(S); LED_LAST = null;
  return e;
}
/* record several events as one step: all of them or none. They share a group mark (grp), so one undo takes them all back.
   Returns the stored events or false */
function ledgerAddMany(S, evs, today) {
  if (!Array.isArray(evs) || !evs.length) return ledFail(ledNo('not-event'));
  if (!S || !Array.isArray(S.ledger)) return ledFail(ledNo('no-ledger'));
  const n0 = S.ledger.length, next0 = S.ledgerNext, out = [];
  let grp = null;
  for (const ev of evs) {
    const r = ledgerTry(S, ev, today);
    if (!r.ok) { S.ledger.length = n0; S.ledgerNext = next0; return ledFail(r); }
    const e = ledPush(S, r.e); if (grp === null) grp = e.id;
    if (evs.length > 1) e.grp = grp;
    out.push(e);
  }
  ledEndRedo(S); LED_LAST = null;
  return out;
}
/* undo: the last event (or the one with this id) leaves the ledger and is kept in S.undone, which is saved with the ledger, so undo
   and redo survive closing the page and a restore. Events recorded as one step leave together. Returns the events taken out, or false */
function ledgerUndo(S, id) {
  if (!S || !Array.isArray(S.ledger)) return ledFail(ledNo('no-ledger'));
  if ((+S.ledgerV || 0) > LEDGER_V) return ledFail(ledNo('newer'));
  const L = S.ledger;
  let i = L.length - 1;
  if (id != null) { i = L.findIndex(e => e && e.id === id); if (i < 0) return ledFail(ledNo('no-id', String(id))); }
  if (i < 0) return ledFail(ledNo('nothing'));
  const grp = L[i] && L[i].grp, idx = [];
  if (grp != null) L.forEach((e, j) => { if (e && e.grp === grp) idx.push(j); }); else idx.push(i);
  const items = idx.map(j => ({ e: L[j], at: j }));
  for (let j = idx.length - 1; j >= 0; j--) L.splice(idx[j], 1);
  if (!Array.isArray(S.undone)) S.undone = [];
  S.undone.push({ items }); LED_LAST = null;
  return items.map(it => it.e);
}
/* redo: the last undone step goes back where it was. Returns the events put back, or false */
function ledgerRedo(S) {
  if (!S || !Array.isArray(S.ledger)) return ledFail(ledNo('no-ledger'));
  if ((+S.ledgerV || 0) > LEDGER_V) return ledFail(ledNo('newer'));
  if (!Array.isArray(S.undone) || !S.undone.length) return ledFail(ledNo('no-redo'));
  const u = S.undone[S.undone.length - 1], items = (u && u.items || []).filter(it => it && it.e), x = ledCtx(S);
  for (const it of items) {
    const e = it.e;
    if ((e.acct != null && !x.by[e.acct]) || (e.acct2 != null && !x.by[e.acct2])) return ledFail(ledNo('acct'));
    if (typeof e.src === 'string' && LED_SRC_FREE[e.src] !== 1 && S.ledger.some(q => q && q.src === e.src)) return ledFail(ledNo('already', e.src));
  }
  S.undone.pop();
  items.slice().sort((p, q) => p.at - q.at).forEach(it => { S.ledger.splice(Math.min(it.at, S.ledger.length), 0, it.e); });
  LED_LAST = null;
  return items.map(it => it.e);
}
/* true when a line from a statement or a receipt (its src) is already in the ledger (A8: "already logged") */
function ledgerHas(S, src) { return typeof src === 'string' && LED_SRC_FREE[src] !== 1 && (S.ledger || []).some(q => q && q.src === src); }

/* ===== reading the numbers ===== */
/* Every figure, added up from the ledger. day (optional): only events dated on or before it count ("as of that day").
   Amounts are in money units. The same names as the reference model, plus afterCards, foreignOwed, below and mode:
     waiting, bills (Bills left, with every "for the card" line), billsOnly, forCards, cards { cardId: set aside },
     free (Track: the place. Wallet: handed to the wallet since the last pay that started a month), wallet (handed, in both modes),
     burrows { id: amount }, saved, thisMonth, total, have (the tracked home accounts added up; always equal to total),
     owed (cards + pay-later + loans in the home currency), afterCards (have less every "for the card" line),
     foreign { cur: amount } and foreignOwed { cur: amount } (kept beside Total, never in it), accounts { id: balance },
     checks { acctId: { typed, unexplained, date, id } } (that account's check with the latest day; same day: the one added last),
     below [place ids under zero, to show in amber], mode */
function placesOf(S, day) {
  const x = ledCtx(S), keep = day != null ? (e => ledDate(e) <= day) : null, L = S.ledger || [];
  const { A, P } = ledSums(S, x, keep);
  let reserve = 0, have = 0, owed = 0; const cards = {}, accounts = {}, foreign = {}, foreignOwed = {}, fC = Object.create(null), foC = Object.create(null);
  (S.accounts || []).forEach(a => {
    if (!a || typeof a.id !== 'string') return;
    const b = A[a.id] || 0; accounts[a.id] = b / 100;
    if (ledCardFull(x, a)) { const v = P[ledLine(a.id)] || 0; cards[a.id] = v / 100; reserve += v; }
    if (ledInTotal(x, a)) have += b;
    else if (ledOwed(a)) { if (a.cur === x.home) owed += b; else foC[a.cur] = (foC[a.cur] || 0) + b; }
    else if (a.cur !== x.home) fC[a.cur] = (fC[a.cur] || 0) + b;
    /* what is left: yours, home currency, not tracked (the wallet). Shown in accounts only */
  });
  for (const k in fC) foreign[k] = fC[k] / 100;
  for (const k in foC) foreignOwed[k] = foC[k] / 100;
  const burrows = {}, below = []; let saved = 0;
  Object.keys(P).sort().forEach(k => {
    if (P[k] < 0) below.push(k);
    if (k === 'waiting' || k === 'bills' || k === 'free' || k.indexOf('card:') === 0) return;
    burrows[k] = P[k] / 100; saved += P[k];
  });
  const waiting = P.waiting || 0, billsOnly = P.bills || 0, bills = billsOnly + reserve, freeP = x.wallet ? 0 : (P.free || 0);
  const thisMonth = bills + freeP, total = waiting + thisMonth + saved;
  /* handed to the wallet since the last pay that started a month, by day (same day: in the order added) */
  let handed = 0;
  if (L.some(e => e && e.k === 'hand')) {
    const order = []; L.forEach((e, i) => { if (e && (!keep || keep(e)) && (e.k === 'hand' || (e.k === 'in' && e.sub === 'pay' && e.startsPeriod !== false))) order.push([e, i]); });
    order.sort((p, q) => (ledDate(p[0]) < ledDate(q[0]) ? -1 : ledDate(p[0]) > ledDate(q[0]) ? 1 : p[1] - q[1]));
    order.forEach(p => { if (p[0].k === 'hand') handed += Number.isSafeInteger(p[0].c) ? p[0].c : 0; else handed = 0; });
  }
  /* check your bank, per account: the typed balance less that account's events dated on or before the check's day. The check
     shown is the one with the latest day (same day: the one added last), never just the one added last: a statement imported
     later can hold an older check, and that old gap must not show as today's */
  const last = Object.create(null), checks = {};
  L.forEach(e => { if (e && e.k === 'check' && typeof e.acct === 'string' && (!keep || keep(e)) && (!last[e.acct] || ledDate(e) >= ledDate(last[e.acct]))) last[e.acct] = e; });
  for (const id in last) { const e = last[id], t = Number.isSafeInteger(e.typed) ? e.typed : 0;
    checks[id] = { typed: t / 100, unexplained: (t - ledBalanceOn(S, x, id, ledDate(e))) / 100, date: ledDate(e), id: e.id }; }
  return {
    waiting: waiting / 100, bills: bills / 100, billsOnly: billsOnly / 100, forCards: reserve / 100, cards,
    free: (x.wallet ? handed : freeP) / 100, wallet: handed / 100, burrows, saved: saved / 100,
    thisMonth: thisMonth / 100, total: total / 100, have: have / 100, owed: owed / 100, afterCards: (have - reserve) / 100,
    foreign, foreignOwed, accounts, checks, below, mode: x.wallet ? 'wallet' : 'track',
  };
}
/* the one rule, checked: { ok, total, have, cards: [ids whose line is not what the card shows] }, in cents. ok must always be true */
function ledgerProof(S) {
  const x = ledCtx(S), { A, P } = ledSums(S, x); let have = 0; const bad = [];
  (S.accounts || []).forEach(a => { if (!a) return; if (ledInTotal(x, a)) have += A[a.id] || 0; if (ledCardFull(x, a) && (P[ledLine(a.id)] || 0) !== (A[a.id] || 0)) bad.push(a.id); });
  const total = ledSumAll(P);
  return { ok: total === have && !bad.length, total, have, cards: bad };
}
/* each card as the screen shows it: one card, two lines. now = this month's spending (set aside in full), older = the older balance
   held like a loan (an account with of: <card id>), in money units */
function ledgerCardLines(S, day) {
  const x = ledCtx(S), A = ledSums(S, x, day != null ? (e => ledDate(e) <= day) : null).A;
  return (S.accounts || []).filter(a => a && a.type === 'card').map(a => {
    const old = (S.accounts || []).filter(o => o && o.of === a.id && ledOwed(o));
    return { id: a.id, name: a.name, payDay: a.payDay, inFull: !!a.inFull, closed: a.closed || null, now: (A[a.id] || 0) / 100,
      older: old.reduce((t, o) => t + (A[o.id] || 0), 0) / 100, olderIds: old.map(o => o.id) };
  });
}

/* ===== months as views ===== */
/* The ledger is never trimmed; a month is only a view. It runs from one pay day to the next (S.ui.payDays, for example [10] or
   [15, 30]; [1] is the calendar month). A pay day past the end of a short month falls on its last day.
   periodOf(S, 'YYYY-MM-DD') gives { from, to }: from is the first day, to is the first day of the next one (not included). */
function periodOf(S, date) {
  if (!ledDayOk(date)) return ledFail(ledNo('date'));
  const days = ledPayDays((S && S.ui && S.ui.payDays) || [1]) || [1];
  const y = +date.slice(0, 4), m = +date.slice(5, 7), starts = [];
  for (let dm = -1; dm <= 1; dm++) days.forEach(d => { const s = ledYmd(y, m + dm, d); if (starts.indexOf(s) < 0) starts.push(s); });
  starts.sort();
  let from = starts[0], to = starts[1];
  for (let i = 0; i < starts.length; i++) if (starts[i] <= date) { from = starts[i]; to = starts[i + 1]; }
  return { from, to };
}
/* what moved in a span of days (from included, to not; to may be null for "until the end"): what came into Total, what went out,
   and Total and Owed at both ends, in money units. totalEnd - totalStart is always cameIn - wentOut. */
function flows(S, from, to) {
  const x = ledCtx(S), L = S.ledger || [];
  let cameIn = 0, wentOut = 0;
  for (const e of L) {
    if (!e || e.k === 'check' || e.k === 'move') continue;
    const d0 = ledDate(e); if (!(d0 >= from && (to == null || d0 < to))) continue;
    const A = Object.create(null); ledApply(x, e, A, Object.create(null));
    let d = 0; for (const id in A) if (ledInTotal(x, x.by[id])) d += A[id];
    if (d > 0) cameIn += d; else wentOut -= d;
  }
  const at = keep => { const s = ledSums(S, x, keep); let o = 0; (S.accounts || []).forEach(a => { if (a && ledOwed(a) && a.cur === x.home) o += s.A[a.id] || 0; }); return { total: ledSumAll(s.P), owed: o }; };
  const a = at(e => ledDate(e) < from), b = at(to == null ? null : (e => ledDate(e) < to));
  return { from, to, cameIn: cameIn / 100, wentOut: wentOut / 100, totalStart: a.total / 100, totalEnd: b.total / 100, owedStart: a.owed / 100, owedEnd: b.owed / 100 };
}

/* ===== check your bank ===== */
/* What a typed balance would show, without recording anything: { ok, typed, balance, unexplained } in money units.
   balance is that account's events dated on or before day. For a card or a loan, the balance is what is owed. */
function ledgerUnexplained(S, acct, typedA, day) {
  const r = ledgerTry(S, { k: 'check', acct, typedA, date: day });
  if (!r.ok) { ledFail(r); return r; }
  const bal = ledBalanceOn(S, ledCtx(S), acct, day);
  return { ok: true, typed: r.e.typed / 100, balance: bal / 100, unexplained: (r.e.typed - bal) / 100 };
}
/* record a check: the typed balance of one account on a day. Moves no money. Returns { ok, unexplained, event } or false */
function ledgerCheck(S, acct, typedA, day, more) {
  const e = ledgerAdd(S, Object.assign({}, more || {}, { k: 'check', acct, typedA, date: day }));
  if (!e) return false;
  return { ok: true, unexplained: (e.typed - ledBalanceOn(S, ledCtx(S), acct, day)) / 100, event: e };
}
/* accept the difference: a check and, when there is a difference, an adjust for exactly that amount, recorded as one step.
   place: where the difference lands (default Free to spend in Track, Waiting in Wallet). Returns { ok, unexplained, events } or false */
function ledgerAccept(S, acct, typedA, day, place, sub) {
  const r = ledgerTry(S, { k: 'check', acct, typedA, date: day });
  if (!r.ok) return ledFail(r);
  const diff = r.e.typed - ledBalanceOn(S, ledCtx(S), acct, day);
  const evs = [{ k: 'check', acct, typed: r.e.typed, date: day, src: 'typed' }];
  if (diff) { const ad = { k: 'adjust', sub: sub || 'accepted', acct, c: diff, date: day, src: 'typed' }; if (place != null) ad.place = place; evs.push(ad); }
  const out = ledgerAddMany(S, evs);
  return out ? { ok: true, unexplained: diff / 100, events: out } : false;
}
/* start fresh from today (after a missed month): a check and an adjust on every account, as one step.
   typed: { acctId: balance } for every account that is open and tracked (the wallet that is not tracked is left out, L3).
   place: where the differences land (default 'waiting', which may go below zero and is then shown in amber).
   Returns { ok, adjusted: { acctId: difference }, events } or false. Nothing is recorded unless every balance is usable. */
function ledgerStartFresh(S, typed, day, place) {
  if (!S || !Array.isArray(S.accounts)) return ledFail(ledNo('no-ledger'));
  if (!typed || typeof typed !== 'object') return ledFail(ledNo('missing-accounts'));
  const x = ledCtx(S), evs = [], adjusted = {}, need = S.accounts.filter(a => a && a.tracked !== false && !(typeof a.closed === 'string' && a.closed < day));
  const missing = need.filter(a => typed[a.id] == null).map(a => a.id);
  if (missing.length) return ledFail(ledNo('missing-accounts', missing.join(', ')));
  for (const id of Object.keys(typed)) {
    if (typed[id] == null) continue;
    const r = ledgerTry(S, { k: 'check', acct: id, typedA: typed[id], date: day });
    if (!r.ok) return ledFail(r);
    const diff = r.e.typed - ledBalanceOn(S, x, id, day);
    evs.push({ k: 'check', sub: 'start fresh', acct: id, typed: r.e.typed, date: day, src: 'typed' });
    if (diff) evs.push({ k: 'adjust', sub: 'start fresh', acct: id, c: diff, place: place || 'waiting', date: day, src: 'typed' });
    adjusted[id] = diff / 100;
  }
  if (!evs.length) return ledFail(ledNo('missing-accounts'));
  const out = ledgerAddMany(S, evs);
  return out ? { ok: true, adjusted, events: out } : false;
}
/* a card paid in full starts to carry part of its balance: that part moves to "<card>, older balance", an account held like a loan
   (made here the first time, with of: <card id>). The money that was set aside for that part goes back to place (default Bills left),
   where the instalments are paid from. One step. Returns { ok, account, events } or false */
function ledgerCarryOver(S, cardId, amount, day, place) {
  const card = S && Array.isArray(S.accounts) ? S.accounts.find(a => a && a.id === cardId) : null;
  if (!card || card.type !== 'card' || !card.inFull) return ledFail(ledNo('acct-type', 'a card paid in full'));
  const c = ledCents(amount); if (c === null || !(c > 0)) return ledFail(ledNo('amount-sign'));
  let old = S.accounts.find(a => a && a.of === cardId && a.type === 'loan' && !a.closed), made = false;
  if (!old) {
    let id = (cardId + '_old').slice(0, 24), n = 1; while (S.accounts.some(a => a && a.id === id)) id = (cardId.slice(0, 18) + '_old' + (++n));
    old = ledgerAddAccount(S, { id, name: card.name + ', older balance', type: 'loan', cur: card.cur, payDay: card.payDay, of: cardId });
    if (!old) return false; made = true;
  }
  const out = ledgerAddMany(S, [
    { k: 'adjust', sub: 'older balance', acct: cardId, c: -c, place: place || 'bills', date: day, src: 'typed' },
    { k: 'adjust', sub: 'older balance', acct: old.id, c, date: day, src: 'typed' }]);
  if (!out) { if (made) S.accounts.splice(S.accounts.indexOf(old), 1); return false; }
  return { ok: true, account: old, events: out };
}

/* ===== two small extensions for real cards (LANE_ledger_core.md "Design gaps"). They read or use what is already there and change
   no figure placesOf gives ===== */
/* THE CUT-OFF DAY. A card may carry cutDay (the statement day of the month) beside payDay. On a day, what is on the card splits in two:
     due    what the last statement asked for (everything on the card up to the last cut-off) less what was paid or refunded since
     later  spent after the cut-off: owed and set aside already, but due a month later
   due + later is always what is on the card. Without cutDay everything is due. Returns { ok, onCard, due, later, cutoff } in money
   units (cutoff: the last statement day, or null), or false. */
function ledgerCardDue(S, cardId, day) {
  const a = S && Array.isArray(S.accounts) ? S.accounts.find(q => q && q.id === cardId) : null;
  if (!a || !ledOwed(a)) return ledFail(ledNo('acct-type', 'a card'));
  if (!ledDayOk(day)) return ledFail(ledNo('date'));
  const x = ledCtx(S), now = ledBalanceOn(S, x, cardId, day); LED_LAST = null;
  if (!(Number.isInteger(a.cutDay) && a.cutDay >= 1 && a.cutDay <= 31)) return { ok: true, onCard: now / 100, due: now / 100, later: 0, cutoff: null };
  const y = +day.slice(0, 4), m = +day.slice(5, 7); let cut = ledYmd(y, m, a.cutDay); if (cut > day) cut = ledYmd(y, m - 1, a.cutDay);
  /* since the cut-off: what was added to the card (later), and what took it down (paid or refunded, which meets the statement first) */
  let up = 0, down = 0;
  for (const e of S.ledger) { if (!e || e.k === 'check' || !(ledDate(e) > cut && ledDate(e) <= day)) continue;
    const A = Object.create(null); ledApply(x, e, A, Object.create(null)); const d = A[cardId] || 0; if (d > 0) up += d; else down -= d; }
  const statement = now - up + down, due = Math.max(0, statement - down) + Math.min(0, statement), later = now - due;
  return { ok: true, onCard: now / 100, due: due / 100, later: later / 100, cutoff: cut };
}
/* AN INSTALMENT ON A CARD. The plan is its own owed account (type paylater, of: <card id>) that holds the months still to come; the
   buy is a spend on it, which touches no place. Each month this moves one part from the plan onto the card, where it is set aside
   like any card spending (default from Bills left). What is owed in all does not change. One step. Returns the events or false. */
function ledgerInstalment(S, planId, cardId, amount, day, place) {
  const c = ledCents(amount); if (c === null || !(c > 0)) return ledFail(ledNo('amount-sign'));
  const x = ledCtx(S || {}), p = x.by[planId], card = x.by[cardId];
  if (!p || !card || !ledOwed(p) || card.type !== 'card' || p === card) return ledFail(ledNo('acct-type', 'a plan and its card'));
  return ledgerAddMany(S, [
    { k: 'adjust', sub: 'instalment', acct: planId, c: -c, date: day, src: 'typed' },
    { k: 'adjust', sub: 'instalment', acct: cardId, c, place: place || 'bills', date: day, src: 'typed' }]);
}

/* ===== a saved copy ===== */
/* May this page write over a stored copy? Never when the stored ledger is of a newer shape than this file knows. */
function ledgerMayWrite(stored) { return !(stored && typeof stored === 'object' && (+stored.ledgerV || 0) > LEDGER_V); }
/* Make a loaded copy safe to add up, in place. It only fills what is missing and sets aside what cannot be read; it never drops a
   field it does not know, and it never touches a copy from a newer version. Returns { ok, moved } or { ok: false, code, why }.
   An event or account that cannot be read moves to S.ledgerBad (kept and saved, outside every sum) with the reason. */
function ledgerClean(S) {
  if (!S || typeof S !== 'object') return ledNo('no-ledger');
  if ((+S.ledgerV || 0) > LEDGER_V) return ledNo('newer');
  if (!S.ui || typeof S.ui !== 'object') S.ui = {};
  if (S.ui.freeMode !== 'track' && S.ui.freeMode !== 'wallet') S.ui.freeMode = 'track';
  S.ui.payDays = ledPayDays(S.ui.payDays) || [1];
  const bad = Array.isArray(S.ledgerBad) ? S.ledgerBad : []; let moved = 0;
  const seen = Object.create(null);
  S.accounts = (Array.isArray(S.accounts) ? S.accounts : []).filter(a => {
    const ok = a && typeof a === 'object' && ledIdOk(a.id) && Object.prototype.hasOwnProperty.call(LED_TYPES, a.type) && !seen[a.id];
    if (!ok) { bad.push({ what: 'account', why: 'acct-new', it: a }); moved++; return false; }
    seen[a.id] = 1;
    if (typeof a.cur !== 'string' || !a.cur) a.cur = S.ui.cur;
    a.tracked = a.tracked !== false; a.inFull = a.type === 'card' ? a.inFull !== false : !!a.inFull;
    if (a.closed != null && !ledDayOk(a.closed)) delete a.closed;
    return true;
  });
  const ids = Object.create(null), int = v => Number.isSafeInteger(v);
  const readable = e => {
    if (!e || typeof e !== 'object' || LED_KINDS[e.k] !== 1 || !Object.prototype.hasOwnProperty.call(LED_KINDS, e.k)) return 'kind';
    if (!ledDayOk(e.date)) return 'date';
    if (e.k !== 'move' && !seen[e.acct]) return 'acct';
    if (LED_TWO[e.k] === 1 && !seen[e.acct2]) return 'acct2';
    if (e.k === 'check' ? !int(e.typed) : !int(e.c)) return 'amount';
    if (e.k === 'convert' && !int(e.c2)) return 'amount';
    if (e.k === 'move' && (!ledIdOk(e.place) || !ledIdOk(e.place2))) return 'place';
    if (e.place != null && !ledIdOk(e.place)) return 'place';
    return '';
  };
  S.ledger = (Array.isArray(S.ledger) ? S.ledger : []).filter(e => { const why = readable(e); if (why) { bad.push({ what: 'event', why, it: e }); moved++; return false; } return true; });
  S.undone = (Array.isArray(S.undone) ? S.undone : []).filter(u => u && Array.isArray(u.items) && u.items.length && u.items.every(it => it && !readable(it.e) && int(it.at)));
  if (!Array.isArray(S.removed)) S.removed = [];
  let next = ledNextId(S);
  S.ledger.forEach(e => { if (!int(e.id) || ids[e.id]) e.id = next++; ids[e.id] = 1; });
  S.ledgerNext = Math.max(int(S.ledgerNext) ? S.ledgerNext : 1, next, ledNextId(S));
  if (bad.length) S.ledgerBad = bad;
  S.ledgerV = LEDGER_V;
  return { ok: true, moved };
}

/* ===== moving a saved 38.31 copy (E5) ===== */
/* The typed figures of a real 38.31 saved copy (the app's S), read into the plain shape migrate3831 works from. Nothing is worked
   out: only figures a person typed are read. The bank is cfg.bankNow on cfg.bankNowAt ("bank now"). A copy without it falls back to
   cfg.bankStart on cfg.bankAt (the bank at the start of the first month) and marks the bank account confirm, so the first check
   asks. Cards are S.cards [{ id, name, owed, payDay, at }]; goal starts are plan.goals [{ id, start }]; plan.debts become loans. */
function ledgerRead3831(saved) {
  const cfg = saved.cfg && typeof saved.cfg === 'object' ? saved.cfg : {}, ui = saved.ui && typeof saved.ui === 'object' ? saved.ui : {}, plan = saved.plan && typeof saved.plan === 'object' ? saved.plan : {};
  const now = cfg.bankNow != null, arr = v => (Array.isArray(v) ? v.filter(q => q && typeof q === 'object') : []);
  return { cur: ui.cur, freeMode: ui.freeMode, payDays: ui.payDays,
    bankStart: now ? cfg.bankNow : cfg.bankStart, bankAt: now ? cfg.bankNowAt : cfg.bankAt, bankConfirm: !now,
    cards: arr(saved.cards).map(c => ({ id: c.id, name: c.name, owed: c.owed, payDay: c.payDay, at: c.at })),
    /* the kind of a goal is in ui.gk[goalId], not on the goal. A goal of kind 'debt' (A3) is money owed: target less what was paid */
    goals: arr(plan.goals).map(g => ({ id: g.id, start: g.start, target: g.target, name: g.name, kind: ui.gk && typeof ui.gk === 'object' ? ui.gk[g.id] : undefined })),
    /* Cards and loans. The real fields are { id, name, kind, balance, apr, min, extra } (model.js cleanDebts): the balance is
       balance, there is no pay day and no date. apr, min and extra stay with the plan */
    debts: arr(plan.debts).map(d => ({ id: d.id, name: d.name, kind: d.kind, owed: d.balance })) };
}
/* migrate3831(old, today). old is a real 38.31 saved copy (it has cfg or plan; read by ledgerRead3831), or the plain shape:
     { cur, freeMode, payDays, bankStart, bankAt, cards: [{ id, name, owed, payDay, at }], goals: [{ id, start, target, name, kind }],
       debts: [{ id, name, kind, owed, payDay, at }], planFigures }
   today: the day of the move. Only typed figures move: the bank figure (with its date) opens the bank; each typed card balance opens
   that card and sets the same amount aside for it; goal starts open their burrows in "Savings from your old plan", an account the
   first check asks the person to confirm; debts open loan accounts. S.frozen is a copy of old, whole, that is never written again,
   and S.oldFigures holds the old plan's figures to show once. A figure that cannot be read is left out and listed in
   S.oldFigures.notes, never guessed. Returns the new ledger state, or false. */
function migrate3831(old, today, figures, more) {
  if (!old || typeof old !== 'object' || Array.isArray(old)) return ledFail(ledNo('old-copy'));
  if (!ledDayOk(today)) return ledFail(ledNo('date', 'the day of the move'));
  /* the old plan's figures come in beside the copy (figures), never inside it: a real saved copy is frozen whole, byte for byte,
     and none of its keys is read as the figures. Only the plain shape may still carry its own planFigures */
  const whole3831 = old, real = (old.cfg && typeof old.cfg === 'object') || (old.plan && typeof old.plan === 'object');
  const planFigures = figures != null ? figures : (real ? null : old.planFigures);
  if (real) old = ledgerRead3831(old);
  /* ONLY TYPED FIGURES MOVE. A plan that is still the untouched sample holds invented figures (the sample emergency fund start, the
     sample debts). The copy cannot say so by itself; the page can (planIsSample in ui0.js) and hands it over as more.planIsSample.
     Then nothing of plan.goals and plan.debts moves. The bank figure and the cards typed on Home are not part of the plan: they move */
  const sample = !!more && more.planIsSample === true;
  if (sample) old = Object.assign({}, old, { goals: [], debts: [] });
  const cur = typeof old.cur === 'string' && old.cur ? old.cur : null;
  if (!cur) return ledFail(ledNo('old-copy', 'no currency'));
  const S = ledgerFresh({ cur, mode: old.freeMode === 'wallet' ? 'wallet' : 'track', payDays: ledPayDays(old.payDays) || [1], accounts: [{ id: 'bank', name: 'Bank', type: 'bank' }] });
  if (!S) return false;
  S.frozen = ledCopy(whole3831); S.frozen.frozenAt = today;
  if (old.bankConfirm) S.accounts[0].confirm = true;
  const notes = [], whole = LED_WHOLE[cur] === 1;
  const amt = (v, what) => { let c = ledCents(v == null ? 0 : v); if (c === null) { notes.push(what + ': not a usable amount, left out'); return 0; }
    if (whole && c % 100 !== 0) { c = Math.round(c / 100) * 100; notes.push(what + ': cents dropped, this currency has none'); } return c; };
  const dayOr = d => (ledDayOk(d) && d <= today ? d : today), payDay = d => (Number.isInteger(d) && d >= 1 && d <= 31 ? d : undefined);
  const list = v => (Array.isArray(v) ? v.filter(q => q && typeof q === 'object') : []);
  const add = ev => { if (!ledgerAdd(S, Object.assign({ src: 'migration' }, ev))) notes.push((ev.acct || '') + ': ' + (LED_LAST ? LED_LAST.why : 'refused')); };
  const bank = amt(old.bankStart, 'bank');
  if (bank) add({ k: 'open', acct: 'bank', c: bank, place: 'waiting', date: dayOr(old.bankAt) });
  const allGoals = list(old.goals).map((g, i) => Object.assign({}, g, { i, debt: g.kind === 'debt' }));
  const goals = allGoals.filter(g => !g.debt).map(g => ({ id: ledIdOk(g.id) ? g.id : 'goal' + (g.i + 1), c: amt(g.start, 'goal ' + g.id) })).filter(g => g.c);
  if (goals.length) {
    ledgerAddAccount(S, { id: 'oldsavings', name: 'Savings from your old plan', type: 'bank', confirm: true });
    const seen = {}; goals.forEach(g => { if (seen[g.id]) { notes.push('goal ' + g.id + ': listed twice, the second is left out'); return; } seen[g.id] = 1; add({ k: 'open', acct: 'oldsavings', c: g.c, place: g.id, date: today }); });
  }
  /* names compared for "is this the same card?": spaces at the ends, runs of spaces and capitals do not matter */
  const nameKey = v => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').toLowerCase() : ''), homeCards = [], questions = [];
  list(old.cards).forEach((cd, i) => {
    const id = ledIdOk(cd.id) && !S.accounts.some(q => q.id === cd.id) ? cd.id : 'card' + (i + 1), a = { id, name: typeof cd.name === 'string' && cd.name ? cd.name : 'Card ' + (i + 1), type: 'card', inFull: true }; if (payDay(cd.payDay)) a.payDay = cd.payDay;
    ledgerAddAccount(S, a); const c = amt(cd.owed, a.name); if (c) add({ k: 'open', acct: id, c, place: 'waiting', date: dayOr(cd.at) });
    homeCards.push({ key: nameKey(cd.name), id, c });
  });
  /* an owed account for a debt of the old plan. It keeps the plan's own id (as its account id when that is free and usable, and
     always in the field named by key), so the plan, which keeps the rate and the payments, and the ledger name the same debt */
  const used = id => S.accounts.some(q => q.id === id);
  const owedAcct = (key, planId, stem, name, more) => {
    let id = planId; if (!ledIdOk(id) || used(id)) { let n = 1; while (used(stem + n)) n++; id = stem + n; }
    const a = Object.assign({ id, name: typeof name === 'string' && name ? name : 'Loan ' + id, type: 'loan' }, more || {});
    if (planId != null) a[key] = planId;
    return ledgerAddAccount(S, a);
  };
  /* a goal of kind "pay off a debt" (A3) is not savings: it is a loan of its target less what was paid so far. Both were typed.
     Nothing is set aside for it and it touches no place, so it is in Owed and never in Saved or Total */
  const debtGoals = () => allGoals.filter(g => g.debt).forEach(g => {
    const what = 'debt goal ' + g.id, t = ledCents(g.target == null ? NaN : g.target);
    const a = owedAcct('goal', g.id, 'goal', g.name);
    if (t === null) { notes.push(what + ': no usable target, left out'); return; }
    const c = Math.max(0, amt(g.target, what) - amt(g.start, what)); if (c) add({ k: 'open', acct: a.id, c, date: today });
  });
  list(old.debts).forEach(d => {
    const more = {}; if (payDay(d.payDay)) more.payDay = d.payDay; if (typeof d.kind === 'string' && d.kind) more.kind = d.kind;
    /* IS THIS THE SAME CARD? A debt of kind card (a card with interest, in Cards and loans) and a card typed on Home (paid in full)
       can be one card typed in two places. The old model does not link them, so the move does not guess. When the two share a name
       it asks: the question goes to S.oldFigures.questions for the once-screen, and until it is answered (ledgerSameCard) only the
       card typed on Home counts, because that figure has a day. The debt has its account, empty and marked confirm, so it is not
       owed twice and the plan's debt still has its place in the ledger */
    const twin = d.kind === 'card' && nameKey(d.name) ? homeCards.find(k => k.key === nameKey(d.name)) : null, c0 = twin ? amt(d.owed, typeof d.name === 'string' ? d.name : 'debt') : 0;
    if (twin && c0) more.confirm = true;
    const a = owedAcct('debt', d.id, 'loan', d.name, more);
    if (twin && c0) { questions.push({ code: 'same-card', debt: d.id == null ? null : d.id, acct: a.id, card: twin.id, name: a.name, held: c0 / 100, cardOwed: twin.c / 100, day: today, answer: null }); return; }
    const c = twin ? 0 : amt(d.owed, a.name); if (c) add({ k: 'open', acct: a.id, c, date: dayOr(d.at) });
  });
  debtGoals();
  S.oldFigures = { shownOnce: false, plan: planFigures == null ? null : ledCopy(planFigures), notes, sample, questions };
  S.undone = []; LED_LAST = null;
  return S;
}

/* The answer to "is this the same card?" (a question migrate3831 left in S.oldFigures.questions). acctId: the debt's account.
     same === true    one card typed twice. It is owed once: the figure typed on Home stays, the figure from Cards and loans is not
                      added. The debt's account is tied to the card (of: <card id>), so it is that card's older balance line, empty
                      until the person carries a balance (ledgerCarryOver uses it)
     same === false   two cards. The debt opens with the figure that waited, on the day of the move
   A question is answered once. Returns the question, or false */
function ledgerSameCard(S, acctId, same) {
  if (!S || !Array.isArray(S.accounts) || !Array.isArray(S.ledger)) return ledFail(ledNo('no-ledger'));
  if ((+S.ledgerV || 0) > LEDGER_V) return ledFail(ledNo('newer'));
  const qs = S.oldFigures && Array.isArray(S.oldFigures.questions) ? S.oldFigures.questions : [];
  const q = qs.find(x => x && x.code === 'same-card' && x.acct === acctId && x.answer == null), a = S.accounts.find(x => x && x.id === acctId);
  if (!q || !a || (same !== true && same !== false)) return ledFail(ledNo('no-question'));
  if (same) a.of = q.card;
  else if (!ledgerAdd(S, { k: 'open', acct: acctId, a: q.held, date: q.day, src: 'migration' })) return false;
  delete a.confirm; q.answer = same ? 'same' : 'other'; LED_LAST = null;
  return q;
}

/* when loaded with require() too (tests); in the page this line does nothing */
if (typeof module !== 'undefined' && module.exports) module.exports = { LEDGER_V, ledgerFresh, ledgerAdd, ledgerAddMany, ledgerTry, ledgerWhy, ledgerUndo, ledgerRedo, ledgerHas,
  placesOf, ledgerProof, ledgerCardLines, periodOf, flows, ledgerUnexplained, ledgerCheck, ledgerAccept, ledgerStartFresh, ledgerCarryOver,
  ledgerAddAccount, ledgerEditAccount, ledgerCloseAccount, ledgerReopenAccount, ledgerSetMode, ledgerSetPayDays, ledgerMayWrite, ledgerClean, ledgerRead3831, migrate3831,
  ledgerCardDue, ledgerInstalment, ledgerSameCard };
