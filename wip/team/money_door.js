/* ===== THE MONEY DOOR (pure: no DOM, no storage, no clock) =====
   One door for many real-life situations (DECISIONS.md "After the concept review" point 3, LAUNCH_CHECKLIST.md section C):
   "Money came in" and "Money went out", each with a short list of kinds and one line saying what each is for.
   The kind decides what happens to the numbers. A kind never touches a number itself: it only turns the answers into
   ledger events and hands them to ledger.js (ledgerAddMany), so the one rule of the ledger holds for every kind.
   Words for a person: wip/team/MONEY_DOOR.md. Handoff: wip/team/LANE_money_door.md. Proof: tests/next/money_door_test.js.

   THE ANSWERS a kind may need (one object):
     amount    in money units (or cents: whole cents)                         every kind
     date      'YYYY-MM-DD' (when missing, the day passed in as today)        every kind
     account   id of the account the money landed in, left from, or was paid with
     who       the other side: the id of a loan, pay-later, card or "owed to you" account, or { name } for somebody new
               (Borrowed and Lent make the account). For Family support it is only a name kept with the event.
     to        Moved between my accounts: the account it went to
     landed    Moved between two currencies: how much arrived, in the currency of "to"
     place     what it is for or where it comes from: 'waiting', 'bills', 'free' or a burrow id. Every kind has a default.
               For "Saved to a burrow" place is the burrow, and from (default 'free') is where it comes from.
     second    Pay only: true for a second income, a bonus or 13th month pay that does not start a new month
     fromPay   Paid back a loan only: true when it was taken out of your pay before the pay landed (no account moves)
     src       where the line came from (a statement line id, a receipt id). The same src is never logged twice (A8).
     sure      true to log a line from a statement or receipt although one just like it is already there
     note      free words, kept with the event

   THE FIVE FIGURES every kind speaks about (doorFigures): Total, Free to spend, Bills left, Saved, Owed.
   Beside them: Waiting (pay not placed yet) and Lent (money owed to you: yours, inside Total, but not to spend).
   Lent is the place 'lent'. Every "Lent" puts the amount there and every "Paid back" takes it out, so it always equals
   the "owed to you" accounts. placesOf() counts that place among the burrows; doorFigures() takes it out of Saved.

   A WAY is how a kind lands for the accounts that were picked (paid from the bank, by card, with pay-later...).
   Each way is a row of whole numbers: how many times the amount each figure moves. place and place2 move the place that
   was named, forCard is the "for the card" line inside Bills left. The test holds every way to the cent.

   Every name here starts with door or DOOR, so the file can sit in the page after ledger.js. */

const doorL = (typeof ledgerAddMany === 'function' && typeof placesOf === 'function')
  ? { ledgerAddMany, ledgerAddAccount, ledgerUndo, ledgerRedo, ledgerWhy, placesOf }   /* in the page: ledger.js is in the same script */
  : require('./ledger.js');

const DOOR_LENT = 'lent';                                   /* the place that holds what is owed to you */
const DOOR_FIXED = { waiting: 1, bills: 1, free: 1 };       /* places that are not burrows */
const DOOR_PLACE = /^[A-Za-z0-9_-]{1,24}$/;
const DOOR_SRC_FREE = { typed: 1, migration: 1 };
const DOOR_MONEY_KINDS = { in: 1, borrow: 1, spend: 1, hand: 1, transfer: 1, convert: 1, repay: 1 };

/* ways shared by several kinds */
const DOOR_W_IN = {
  in:   { so: 'into an account that counts in Total', total: 1, place: 1 },
  out:  { so: 'into your wallet or another currency, beside Total' },
};
const DOOR_W_OUT = {
  in:   { so: 'paid from a bank, e-wallet or cash', total: -1, place: -1 },
  full: { so: 'paid by a card you pay in full: Total stays, the amount is set aside for the card bill', place: -1, forCard: 1, owed: 1 },
  owed: { so: 'paid with pay-later, a loan or a card you do not pay in full: no pile shrinks today, you owe more', owed: 1 },
  out:  { so: 'paid from your wallet or another currency, beside Total' },
};

/* THE TABLE. side, label, line (what it is for, as a person reads it), asks (what it needs), maybe (asked only when the
   person wants to change the default), say (how each question is worded), place (the default place), says (what the
   usual way does to the five figures) and ways. */
const DOOR = [
  /* ---------- Money came in ---------- */
  { id: 'pay', side: 'in', label: 'Pay', sub: 'pay',
    line: 'Your salary or what a client paid you - it waits until you give it a job',
    asks: ['amount', 'date', 'account'], maybe: ['second'], say: { account: 'Which account did it land in', second: 'Is this extra pay like a bonus or 13th month' },
    account: 'money', place: 'waiting',
    says: { total: 'up', free: 'same', bills: 'same', saved: 'same', owed: 'same' }, ways: DOOR_W_IN },
  { id: 'borrowed', side: 'in', label: 'Borrowed', sub: 'borrowed',
    line: 'Money someone lent you or a cash loan - you have it now and you owe it back',
    asks: ['amount', 'date', 'account', 'who'], maybe: [], say: { account: 'Which account did it land in', who: 'Who do you owe it to' },
    account: 'money', whoIs: 'owed', whoNew: 'loan', place: 'waiting',
    says: { total: 'up', free: 'same', bills: 'same', saved: 'same', owed: 'up' },
    ways: {
      'in>owed':  { so: 'from a person, a loan or a pay-later app', total: 1, place: 1, owed: 1 },
      'in>full':  { so: 'cash taken on a card you pay in full: it is set aside for the card bill at once', total: 1, forCard: 1, owed: 1 },
      'out>owed': { so: 'it landed in your wallet or another currency', owed: 1 },
      'out>full': { so: 'cash on a card you pay in full that went into your wallet: the bank still has to cover the card', forCard: 1, place: -1, owed: 1 },
    } },
  { id: 'paidback', side: 'in', label: 'Paid back', sub: 'paid back',
    line: 'Someone paid back what you lent them - it was yours all along so your total stays the same',
    asks: ['amount', 'date', 'account', 'who'], maybe: ['place'], say: { account: 'Which account did it land in', who: 'Who paid you back', place: 'What is it for now' },
    account: 'money', whoIs: 'lentTo', place: 'free',
    says: { total: 'same', free: 'up', bills: 'same', saved: 'same', owed: 'same' },
    ways: {
      in:  { so: 'it is yours to use again', place: 1, lent: -1 },
      out: { so: 'it landed in your wallet, which is outside Total', total: -1, lent: -1 },
    } },
  { id: 'refund', side: 'in', label: 'Refund', sub: 'refund',
    line: 'Money back for something you paid for - it goes back where it came from',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'Where did it come back to', place: 'What was it for' },
    account: 'any', place: 'free',
    says: { total: 'up', free: 'up', bills: 'same', saved: 'same', owed: 'same' },
    ways: {
      in:   { so: 'back into a bank, e-wallet or cash', total: 1, place: 1 },
      full: { so: 'back onto a card you pay in full: you owe less and the money set aside is free again', place: 1, forCard: -1, owed: -1 },
      owed: { so: 'back onto pay-later or a loan: you owe less', owed: -1 },
      out:  { so: 'back into your wallet or another currency, beside Total' },
    } },
  { id: 'gift', side: 'in', label: 'Gift', sub: 'gift',
    line: 'Money someone gave you, nothing to pay back',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'Which account did it land in', place: 'What is it for' },
    account: 'money', place: 'waiting',
    says: { total: 'up', free: 'same', bills: 'same', saved: 'same', owed: 'same' }, ways: DOOR_W_IN },
  { id: 'sold', side: 'in', label: 'Sold something', sub: 'sold',
    line: 'You sold something of yours and got paid',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'Which account did it land in', place: 'What is it for' },
    account: 'money', place: 'waiting',
    says: { total: 'up', free: 'same', bills: 'same', saved: 'same', owed: 'same' }, ways: DOOR_W_IN },
  { id: 'otherin', side: 'in', label: 'Other', sub: 'other in',
    line: 'Anything else that came in, like interest or a payout',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'Which account did it land in', place: 'What is it for' },
    account: 'money', place: 'waiting',
    says: { total: 'up', free: 'same', bills: 'same', saved: 'same', owed: 'same' }, ways: DOOR_W_IN },

  /* ---------- Money went out ---------- */
  { id: 'spent', side: 'out', label: 'Spent', sub: 'spend',
    line: 'Something you bought - it comes out of Free to spend unless you say otherwise',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'What did you pay with', place: 'Where does it come from' },
    account: 'any', place: 'free',
    says: { total: 'down', free: 'down', bills: 'same', saved: 'same', owed: 'same' }, ways: DOOR_W_OUT },
  { id: 'bill', side: 'out', label: 'Bill', sub: 'bill',
    line: 'Rent, power, phone, anything you have to pay - it comes out of Bills left',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'What did you pay with', place: 'Where does it come from' },
    account: 'any', place: 'bills',
    says: { total: 'down', free: 'same', bills: 'down', saved: 'same', owed: 'same' }, ways: DOOR_W_OUT },
  { id: 'family', side: 'out', label: 'Family support', sub: 'family support',
    line: 'Money you sent to family - it has its own line in your bills and a surprise ask can come from somewhere else',
    asks: ['amount', 'date', 'account'], maybe: ['who', 'place'], say: { account: 'What did you send it from', who: 'Who is it for', place: 'Where does it come from' },
    account: 'any', whoIs: 'name', place: 'bills',
    says: { total: 'down', free: 'same', bills: 'down', saved: 'same', owed: 'same' }, ways: DOOR_W_OUT },
  { id: 'lent', side: 'out', label: 'Lent', sub: 'lent',
    line: 'Money you lent or paid for someone who will pay you back - still yours but you can not spend it until it comes back',
    asks: ['amount', 'date', 'account', 'who'], maybe: ['place'], say: { account: 'What did you pay with', who: 'Who will pay you back', place: 'Where does it come from' },
    account: 'any', whoIs: 'lentTo', whoNew: 'owedToYou', place: 'free',
    says: { total: 'same', free: 'down', bills: 'same', saved: 'same', owed: 'same' },
    ways: {
      in:   { so: 'from a bank, e-wallet or cash', place: -1, lent: 1 },
      full: { so: 'paid by a card you pay in full: you owe the card, they owe you, and the card bill is set aside now', total: 1, place: -1, forCard: 1, lent: 1, owed: 1 },
      owed: { so: 'paid with pay-later or a loan: you owe it, they owe you', total: 1, lent: 1, owed: 1 },
      out:  { so: 'from your wallet, which was outside Total: what they owe you is inside it', total: 1, lent: 1 },
    } },
  { id: 'paidcard', side: 'out', label: 'Paid a card', sub: 'card payment',
    line: 'You paid your credit card bill - the money was already set aside so Free to spend does not move',
    asks: ['amount', 'date', 'account', 'who'], maybe: ['place'], say: { account: 'Which account did you pay from', who: 'Which card', place: 'Where does it come from' },
    account: 'money', whoIs: 'card', place: 'bills',
    says: { total: 'down', free: 'same', bills: 'down', saved: 'same', owed: 'down' },
    ways: {
      'in>full':  { so: 'a card you pay in full: it comes out of what was set aside for it', total: -1, forCard: -1, owed: -1 },
      'in>owed':  { so: 'a card you do not pay in full, or its older balance: it comes out of Bills left', total: -1, place: -1, owed: -1 },
      'out>full': { so: 'paid from your wallet: what the bank had set aside is free again', forCard: -1, place: 1, owed: -1 },
      'out>owed': { so: 'paid from your wallet or another currency', owed: -1 },
    } },
  { id: 'paidloan', side: 'out', label: 'Paid back a loan or pay-later', sub: 'instalment',
    line: 'An instalment or money you gave back - you owe less',
    asks: ['amount', 'date', 'account', 'who'], maybe: ['place', 'fromPay'], say: { account: 'Which account did you pay from', who: 'Which loan or who did you pay back', place: 'Where does it come from', fromPay: 'Was it taken out of your pay before it landed' },
    account: 'money', whoIs: 'loan', place: 'bills',
    says: { total: 'down', free: 'same', bills: 'down', saved: 'same', owed: 'down' },
    ways: {
      in:      { so: 'paid from a bank, e-wallet or cash', total: -1, place: -1, owed: -1 },
      out:     { so: 'paid from your wallet or another currency', owed: -1 },
      frompay: { so: 'taken out of your pay before it landed: no account moves', owed: -1 },
    } },
  { id: 'moved', side: 'out', label: 'Moved between my accounts', sub: 'moved',
    line: 'Bank to GCash, cash from the ATM, dollars brought home - same money in a different spot',
    asks: ['amount', 'date', 'account', 'to'], maybe: ['landed', 'place'], say: { account: 'Which account did it leave', to: 'Which account did it go to', landed: 'How much landed', place: 'Which place does it belong to' },
    account: 'money', to: 'money', place: 'waiting',
    says: { total: 'same', free: 'same', bills: 'same', saved: 'same', owed: 'same' },
    ways: {
      'in>in':   { so: 'between two accounts that count in Total' },
      hand:      { so: 'to your wallet (Wallet mode): handed out to spend', total: -1, place: -1, handed: 1 },
      'in>out':  { so: 'sent into another currency: it now sits beside Total', total: -1, place: -1 },
      'out>in':  { so: 'brought home from another currency or back from your wallet: it lands in Total at what arrived', total: 1, place: 1 },
      'out>out': { so: 'between two accounts beside Total' },
    } },
  { id: 'saved', side: 'out', label: 'Saved to a burrow', sub: 'saved',
    line: 'Money you put away for later - it leaves Free to spend and stays yours',
    asks: ['amount', 'date', 'place'], maybe: ['from', 'account', 'to'], say: { place: 'Which burrow', from: 'Where does it come from', account: 'Did it leave an account', to: 'Which account holds it now' },
    place: 'free',
    says: { total: 'same', free: 'down', bills: 'same', saved: 'up', owed: 'same' },
    ways: { move: { so: 'from one place to a burrow', place: -1, place2: 1 } } },
  { id: 'otherout', side: 'out', label: 'Other', sub: 'other out',
    line: 'Anything else that went out, like a fee',
    asks: ['amount', 'date', 'account'], maybe: ['place'], say: { account: 'What did you pay with', place: 'Where does it come from' },
    account: 'any', place: 'free',
    says: { total: 'down', free: 'down', bills: 'same', saved: 'same', owed: 'same' }, ways: DOOR_W_OUT },
];
const DOOR_BY = Object.create(null); DOOR.forEach(k => { DOOR_BY[k.id] = k; });
const DOOR_NONE = { so: 'everything in it is in another currency, beside Total and beside Owed' };
const DOOR_WORDS = {
  'kind': 'There is no such kind.',
  'no-ledger': 'There is no ledger here.',
  'ask': 'An answer is missing or can not be used.',
  'acct-kind': 'That account does not fit this kind.',
  'place-kind': 'That place can not be used here.',
  'seen': 'A line just like this one is already logged.',
};
const doorNo = (code, ask, more) => ({ ok: false, code, ask: ask || null, why: DOOR_WORDS[code] + (ask ? ' (' + ask + ')' : '') + (more ? ' ' + more : '') });

/* ---- reading accounts the way the ledger does ---- */
const doorOwedType = a => !!a && (a.type === 'card' || a.type === 'paylater' || a.type === 'loan');
const doorYours = a => !!a && (a.type === 'bank' || a.type === 'cash' || a.type === 'ewallet' || a.type === 'wallet' || a.type === 'owedToYou');
function doorCtx(S) {
  const by = Object.create(null); (S.accounts || []).forEach(a => { if (a && typeof a.id === 'string') by[a.id] = a; });
  return { by, home: (S.ui || {}).cur, wallet: (S.ui || {}).freeMode === 'wallet' };
}
/* in: counts in Total. out: yours but beside Total (the wallet, another currency). full: a card paid in full. owed: any other
   owed account in the home currency. beside: owed in another currency */
function doorCls(x, a) {
  if (doorOwedType(a)) return a.cur !== x.home ? 'beside' : (a.type === 'card' && a.inFull ? 'full' : 'owed');
  return doorYours(a) && a.tracked !== false && a.cur === x.home ? 'in' : 'out';
}
const doorFits = (what, a) => !!a && (what === 'money' ? doorYours(a) && a.type !== 'owedToYou'
  : what === 'any' ? (doorYours(a) && a.type !== 'owedToYou') || doorOwedType(a)
  : what === 'owed' ? doorOwedType(a)
  : what === 'lentTo' ? a.type === 'owedToYou'
  : what === 'card' ? a.type === 'card'
  : what === 'loan' ? doorOwedType(a) && !(a.type === 'card' && a.inFull)
  : false);
function doorCents(ans) {
  if (ans.cents != null) return Number.isSafeInteger(ans.cents) ? ans.cents : null;
  let v = ans.amount; if (typeof v === 'string' && v.trim() !== '') v = +v;
  if (typeof v !== 'number' || !isFinite(v)) return null;
  const f = v * 100, c = Math.round(f);
  return Math.abs(f - c) > 0.005 ? null : c;
}
const doorPlaceOk = p => typeof p === 'string' && DOOR_PLACE.test(p) && p !== DOOR_LENT && !(p in {});
const doorBurrowOk = p => doorPlaceOk(p) && DOOR_FIXED[p] !== 1;
const doorDayNo = d => { const t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); return Math.round(t / 864e5); };
const doorSrcGroup = s => (s.lastIndexOf(':') > 0 ? s.slice(0, s.lastIndexOf(':')) : s);

/* ---- the lists a screen shows ---- */
function doorKinds(side) { return DOOR.filter(k => !side || k.side === side); }
function doorKind(id) { return DOOR_BY[id] || null; }
/* which accounts can answer each question of a kind, for this person: { account: [ids], who: [ids], to: [ids], canAddWho } */
function doorChoices(S, kindId) {
  const k = DOOR_BY[kindId]; if (!k || !S || !Array.isArray(S.accounts)) return null;
  const open = S.accounts.filter(a => a && typeof a.id === 'string' && !a.closed), ids = what => open.filter(a => doorFits(what, a)).map(a => a.id);
  return { account: k.account ? ids(k.account) : [], who: k.whoIs && k.whoIs !== 'name' ? ids(k.whoIs) : [], to: k.to ? ids(k.to) : [], canAddWho: !!k.whoNew };
}
/* what a way does to the five figures, in words: { total, free, bills, saved, owed }, each 'up', 'down' or 'same'.
   place: the place named (default: the kind's own). mode: 'wallet' reads 'free' as waiting, like the ledger */
function doorSays(kindId, wayKey, place, mode) {
  const k = DOOR_BY[kindId]; if (!k) return null;
  const w = wayKey === 'beside' ? DOOR_NONE : k.ways[wayKey || Object.keys(k.ways)[0]]; if (!w) return null;
  const n = doorWayMoves(w, 1, place || k.place, kindId === 'saved' ? 'aBurrow' : null, mode), word = v => (v > 0 ? 'up' : v < 0 ? 'down' : 'same');
  return { total: word(n.total), free: word(n.free), bills: word(n.bills), saved: word(n.saved), owed: word(n.owed) };
}
/* one way, one amount (cents), the places named: what each figure moves by, in cents */
function doorWayMoves(w, c, place, place2, mode) {
  const n = { total: 0, free: 0, bills: 0, saved: 0, owed: 0, waiting: 0, lent: 0, handed: 0 };
  const put = (p, v) => { if (!v) return; if (p === 'waiting' || (p === 'free' && mode === 'wallet')) n.waiting += v; else if (p === 'free') n.free += v; else if (p === 'bills') n.bills += v; else n.saved += v; };
  n.total = (w.total || 0) * c; n.owed = (w.owed || 0) * c; n.lent = (w.lent || 0) * c; n.bills += (w.forCard || 0) * c; n.handed = (w.handed || 0) * c;
  put(place, (w.place || 0) * c); put(place2, (w.place2 || 0) * c);
  return n;
}

/* ---- the figures ---- */
/* The five figures and what sits beside them, in money units, from placesOf(). Saved leaves out what is lent.
   Track: total = waiting + bills + free + saved + lent. Wallet: free is what was handed out since pay day (outside Total),
   so total = waiting + bills + saved + lent. */
function doorFigures(S, day) {
  const p = doorL.placesOf(S, day), lentC = Math.round(((p.burrows || {})[DOOR_LENT] || 0) * 100), burrows = {};
  Object.keys(p.burrows || {}).forEach(id => { if (id !== DOOR_LENT) burrows[id] = p.burrows[id]; });
  return { total: p.total, free: p.free, bills: p.bills, saved: (Math.round(p.saved * 100) - lentC) / 100, owed: p.owed,
    waiting: p.waiting, lent: lentC / 100, forCards: p.forCards, afterCards: p.afterCards, burrows, cards: p.cards,
    beside: p.foreign, owedBeside: p.foreignOwed, accounts: p.accounts, below: p.below, mode: p.mode };
}
const DOOR_FIG = ['total', 'free', 'bills', 'saved', 'owed', 'waiting', 'lent'];
const doorDiff = (a, b) => { const d = {}; DOOR_FIG.forEach(f => { d[f] = (Math.round(b[f] * 100) - Math.round(a[f] * 100)) / 100; }); return d; };

/* ---- from answers to ledger events ---- */
/* Reads the answers for one kind against this person's accounts. Changes nothing. Returns
     { ok: true, kind, events: [ledger events, to be recorded as one step], parts: [{ way, c, place, place2 }], make: account to add first, or null }
   or { ok: false, code, ask, why }: code 'ask' names the answer that is missing or unusable (ask: 'amount', 'account', 'who'...). */
function doorPlan(S, kindId, ans, today) {
  const k = DOOR_BY[kindId]; if (!k) return doorNo('kind');
  if (!S || !Array.isArray(S.accounts) || !Array.isArray(S.ledger) || !S.ui) return doorNo('no-ledger');
  ans = ans || {};
  const x = doorCtx(S), c = doorCents(ans);
  if (c === null || !(c > 0)) return doorNo('ask', 'amount');
  const date = ans.date != null ? ans.date : today; if (typeof date !== 'string') return doorNo('ask', 'date');
  if (ans.place != null && !doorPlaceOk(ans.place)) return doorNo('place-kind', 'place');
  const place = ans.place != null ? ans.place : k.place;

  /* the accounts */
  let acct = null, who = null, to = null, make = null;
  const noAcct = kindId === 'saved' || (kindId === 'paidloan' && ans.fromPay === true);
  if (k.account && !noAcct) {
    acct = typeof ans.account === 'string' ? x.by[ans.account] : null; if (!acct) return doorNo('ask', 'account');
    if (!doorFits(k.account, acct)) return doorNo('acct-kind', 'account');
  }
  if (k.to) {
    to = typeof ans.to === 'string' ? x.by[ans.to] : null; if (!to) return doorNo('ask', 'to');
    if (!doorFits(k.to, to) || to === acct) return doorNo('acct-kind', 'to');
  }
  if (k.whoIs && k.whoIs !== 'name') {
    if (typeof ans.who === 'string') who = x.by[ans.who] || null;
    else if (ans.who && typeof ans.who === 'object' && typeof ans.who.name === 'string' && ans.who.name.trim() && k.whoNew) {
      const name = ans.who.name.trim(), type = k.whoNew === 'loan' && ans.who.type === 'paylater' ? 'paylater' : k.whoNew, cur = acct ? acct.cur : x.home;
      who = (S.accounts || []).find(a => a && a.type === type && !a.closed && a.cur === cur && typeof a.name === 'string' && a.name.toLowerCase() === name.toLowerCase()) || null;
      if (!who) {
        const stem = (type === 'owedToYou' ? 'lent_' : 'owe_') + (name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'x'); let id = stem, n = 1;
        while (x.by[id]) id = stem + '_' + (++n);
        who = make = { id, name, type, cur }; if (type !== 'owedToYou') make.inFull = false;
      }
    }
    if (!who) return doorNo('ask', 'who');
    if (!doorFits(k.whoIs, who)) return doorNo('acct-kind', 'who');
    if (who === acct) return doorNo('acct-kind', 'who');
  }
  const ac = acct ? doorCls(x, acct) : null, wc = who ? doorCls(x, who) : null, tc = to ? doorCls(x, to) : null;

  /* fields every event of this step carries */
  const base = { date, sub: k.sub, door: k.id };
  if (typeof ans.note === 'string' && ans.note) base.note = ans.note;
  if (k.whoIs === 'name' && typeof ans.who === 'string' && ans.who) base.who = ans.who;
  const E = (o) => Object.assign({}, base, o), events = [], parts = [];
  const part = (way, cc, p, p2) => parts.push({ way, c: cc, place: p == null ? null : p, place2: p2 == null ? null : p2 });

  switch (kindId) {
    case 'pay': case 'gift': case 'sold': case 'otherin': {
      const e = E({ k: 'in', acct: acct.id, c, place });
      if (kindId === 'pay') { e.sub = 'pay'; e.startsPeriod = ans.second !== true; }
      events.push(e); part(ac, c, place); break; }
    case 'refund':
      events.push(E({ k: 'in', acct: acct.id, c, place })); part(ac, c, place); break;
    case 'borrowed':
      events.push(E({ k: 'borrow', acct: acct.id, acct2: who.id, c, place }));
      part(wc === 'beside' ? 'beside' : ac + '>' + wc, c, place); break;
    case 'paidback':
      if (wc === 'in' && ac === 'in') { events.push(E({ k: 'transfer', acct: who.id, acct2: acct.id, c }), E({ k: 'move', c, place: DOOR_LENT, place2: place })); part('in', c, place); }
      else if (wc === 'in') { events.push(E({ k: 'transfer', acct: who.id, acct2: acct.id, c, place: DOOR_LENT })); part('out', c); }
      else if (ac === 'out') { events.push(E({ k: 'transfer', acct: who.id, acct2: acct.id, c })); part('beside', c); }
      else return doorNo('acct-kind', 'who');
      break;
    case 'spent': case 'bill': case 'family': case 'otherout':
      events.push(E({ k: 'spend', acct: acct.id, c, place })); part(ac, c, place); break;
    case 'lent':
      if (wc !== 'in' && !(wc === 'out' && (ac === 'out' || ac === 'beside'))) return doorNo('acct-kind', 'who');
      if (wc === 'out') { events.push(E(ac === 'out' ? { k: 'transfer', acct: acct.id, acct2: who.id, c } : { k: 'borrow', acct: who.id, acct2: acct.id, c })); part('beside', c); }
      else if (ac === 'in') { events.push(E({ k: 'transfer', acct: acct.id, acct2: who.id, c }), E({ k: 'move', c, place, place2: DOOR_LENT })); part('in', c, place); }
      else if (ac === 'out') { events.push(E({ k: 'transfer', acct: acct.id, acct2: who.id, c, place: DOOR_LENT })); part('out', c); }
      else if (ac === 'full') { events.push(E({ k: 'borrow', acct: who.id, acct2: acct.id, c }), E({ k: 'move', c, place, place2: DOOR_LENT })); part('full', c, place); }
      else if (ac === 'owed') { events.push(E({ k: 'borrow', acct: who.id, acct2: acct.id, c, place: DOOR_LENT })); part('owed', c); }
      else return doorNo('acct-kind', 'account');
      break;
    case 'paidcard': {
      /* what is on the card now is paid first; what is left over goes to the card's older balance (an account with of: <card>),
         and anything beyond that stays on the card as a credit */
      const bal = doorL.placesOf(S).accounts, cents = id => Math.round((bal[id] || 0) * 100);
      const older = (S.accounts || []).filter(a => a && a.of === who.id && doorOwedType(a) && !a.closed && a.cur === who.cur && cents(a.id) > 0);
      let left = c; const pay = [];
      const first = older.length ? Math.min(left, Math.max(cents(who.id), 0)) : left;
      if (first > 0) { pay.push([who, first]); left -= first; }
      for (const o of older) { if (!(left > 0)) break; const v = Math.min(left, cents(o.id)); pay.push([o, v]); left -= v; }
      if (left > 0) { if (pay.length && pay[0][0] === who) pay[0][1] += left; else pay.unshift([who, left]); }
      for (const [a, v] of pay) {
        const cls = doorCls(x, a), e = E({ k: 'repay', acct: acct.id, acct2: a.id, c: v });
        if (cls === 'full') { if (ac === 'out') { e.place = ans.place != null ? ans.place : 'waiting'; part('out>full', v, e.place); } else part('in>full', v); }
        else if (cls === 'beside') part('beside', v);
        else { e.place = place; part(ac + '>owed', v, ac === 'in' ? place : null); }
        events.push(e);
      }
      break; }
    case 'paidloan':
      if (ans.fromPay === true) { events.push(E({ k: 'adjust', sub: 'taken from pay', acct: who.id, c: -c })); part(wc === 'beside' ? 'beside' : 'frompay', c); }
      else { events.push(E({ k: 'repay', acct: acct.id, acct2: who.id, c, place })); part(wc === 'beside' ? 'beside' : ac, c, ac === 'in' ? place : null); }
      break;
    case 'moved':
      if (acct.cur === to.cur) {
        if (ac === 'in' && tc === 'out') { events.push(E({ k: 'hand', acct: acct.id, acct2: to.id, c, place })); part('hand', c, place); }
        else { events.push(E({ k: 'transfer', acct: acct.id, acct2: to.id, c, place })); part(ac + '>' + tc, c, ac === 'out' && tc === 'in' ? place : null); }
      } else {
        const c2 = doorCents({ amount: ans.landed, cents: ans.landedCents }); if (c2 === null || !(c2 > 0)) return doorNo('ask', 'landed');
        events.push(E({ k: 'convert', acct: acct.id, acct2: to.id, c, c2, place }));
        if (ac === 'in') part('in>out', c, place); else if (tc === 'in') part('out>in', c2, place); else part('out>out', c);
      }
      break;
    case 'saved': {
      if (!doorBurrowOk(ans.place)) return doorNo(ans.place == null ? 'ask' : 'place-kind', 'place');
      const from = ans.from != null ? ans.from : 'free';
      if (!doorPlaceOk(from) || from === ans.place) return doorNo('place-kind', 'from');
      if (ans.account != null || ans.to != null) {   /* the money also changed account (bank to a savings account) */
        const a = x.by[ans.account], b = x.by[ans.to];
        if (!a || !b) return doorNo('ask', !a ? 'account' : 'to');
        if (a === b || !doorFits('money', a) || !doorFits('money', b) || doorCls(x, a) !== 'in' || doorCls(x, b) !== 'in') return doorNo('acct-kind', 'to', 'Use Moved between my accounts first.');
        events.push(E({ k: 'transfer', acct: a.id, acct2: b.id, c }));
      }
      events.push(E({ k: 'move', c, place: from, place2: ans.place })); part('move', c, from, ans.place);
      break; }
    default: return doorNo('kind');
  }
  if (typeof ans.src === 'string' && ans.src) events[0].src = ans.src;
  return { ok: true, kind: k.id, events, parts, make };
}

/* what the plan says each figure will move by (money units), from the table alone. The test holds the ledger to this */
function doorExpect(S, plan) {
  const k = DOOR_BY[plan.kind], mode = (S.ui || {}).freeMode === 'wallet' ? 'wallet' : 'track', sum = { total: 0, free: 0, bills: 0, saved: 0, owed: 0, waiting: 0, lent: 0, handed: 0 };
  plan.parts.forEach(p => { const n = doorWayMoves(p.way === 'beside' ? DOOR_NONE : k.ways[p.way] || {}, p.c, p.place, p.place2, mode); for (const f in sum) sum[f] += n[f]; });
  for (const f in sum) sum[f] = sum[f] / 100;
  return sum;
}

/* ---- A8: nothing counted twice ---- */
/* Events already in the ledger that look like the same money as this plan: the same amount on the same account, on the same
   day (within 3 days when either one moves money between two accounts: two statements show one transfer on their own days).
   A line from the same statement or receipt file (the same src up to its last ':') is never a twin of its neighbours. */
function doorSeen(S, plan, src) {
  const out = [], grp = typeof src === 'string' && DOOR_SRC_FREE[src] !== 1 ? doorSrcGroup(src) : null;
  const sides = e => { const s = []; if (e.acct != null) s.push([e.acct, e.c]); if (e.acct2 != null) s.push([e.acct2, e.k === 'convert' ? e.c2 : e.c]); return s; };
  for (const q of S.ledger || []) {
    if (!q || DOOR_MONEY_KINDS[q.k] !== 1 || typeof q.date !== 'string') continue;
    if (grp !== null && typeof q.src === 'string' && DOOR_SRC_FREE[q.src] !== 1 && doorSrcGroup(q.src) === grp) continue;
    const qs = sides(q);
    const hit = plan.events.some(e => {
      if (DOOR_MONEY_KINDS[e.k] !== 1) return false;
      const far = Math.abs(doorDayNo(e.date) - doorDayNo(q.date)), two = e.acct2 != null || q.acct2 != null;
      if (far > (two ? 3 : 0)) return false;
      return sides(e).some(a => qs.some(b => a[0] === b[0] && a[1] === b[1]));
    });
    if (hit) out.push(q);
  }
  return out;
}

/* ---- recording, undo ---- */
/* Record one kind. Returns
     { ok: true, kind, events (as stored), parts, made (the account added for a new "who", or null), before, after, moved, seen }
   before and after are doorFigures; moved is after less before; seen lists ids of events that look like the same money
   (a hint for a line typed by hand). A line that comes from a statement or receipt (src) and has a twin is NOT recorded:
   { ok: false, code: 'seen', seen: [ids] }, unless sure is true. Any refusal records nothing. */
function doorApply(S, kindId, ans, today) {
  const plan = doorPlan(S, kindId, ans, today); if (!plan.ok) return plan;
  ans = ans || {};
  const twins = doorSeen(S, plan, ans.src).map(e => e.id);
  if (twins.length && typeof ans.src === 'string' && DOOR_SRC_FREE[ans.src] !== 1 && ans.sure !== true) return Object.assign(doorNo('seen'), { seen: twins });
  let made = null;
  if (plan.make) { made = doorL.ledgerAddAccount(S, plan.make); if (!made) { const w = doorL.ledgerWhy() || {}; return { ok: false, code: w.code, ask: 'who', why: w.why, from: 'ledger' }; } }
  const before = doorFigures(S), out = doorL.ledgerAddMany(S, plan.events, today);
  if (!out) {
    const w = doorL.ledgerWhy() || {};
    if (made) S.accounts.splice(S.accounts.indexOf(made), 1);   /* the account made a moment ago goes too: a refusal leaves nothing behind */
    return { ok: false, code: w.code, ask: null, why: w.why, from: 'ledger' };
  }
  const after = doorFigures(S);
  return { ok: true, kind: plan.kind, events: out, parts: plan.parts, made, before, after, moved: doorDiff(before, after), seen: twins };
}
/* what a kind would do, without recording it: the same answer as doorApply, worked out on a copy */
function doorPreview(S, kindId, ans, today) { return doorApply(JSON.parse(JSON.stringify(S)), kindId, ans, today); }
/* undo and redo are the ledger's own: one step of the door is one step there, however many events it holds.
   An account made for a new "who" stays, empty, so redo still works; it holds nothing and can be closed. */
function doorUndo(S, id) { return id == null ? doorL.ledgerUndo(S) : doorL.ledgerUndo(S, id); }
function doorRedo(S) { return doorL.ledgerRedo(S); }

if (typeof module !== 'undefined' && module.exports) module.exports = { DOOR, DOOR_LENT, doorKinds, doorKind, doorChoices, doorSays, doorWayMoves, doorFigures,
  doorPlan, doorExpect, doorSeen, doorApply, doorPreview, doorUndo, doorRedo };
