/* LEDGER FUZZ IN THE DESIGN'S OWN SHAPE (tests/next, 2026-11-19). The test B1 is built against, with ledger_conservation.js.
   EXPECTED TO FAIL (NOT BUILT) until the app has the ledger. Proved today against the reference:
     MODEL=tests/next/ledger_ref.js node tests/next/ledger_fuzz.js [count] [seed]      Ends with "LEDGER FUZZ PASS" or "... FAIL n".

   Where ledger_conservation.js runs side C's one-account lists, this runs wip/team/LEDGER_DESIGN.md as written: random people with
   several banks, e-wallets, cash, cards paid in full, a card's older balance held as a loan, pay-later, loans, money owed to them, an
   account in another currency, Wallet or Track mode, and every kind of event on random dates over four years, added in any order
   (statements imported late), with undo of the last event or of any event by id, redo, and save and reopen. After every step:
     I1 to I6 (ledger_personas_run.js): accounts, Total from both sides, This month, Owed, "for the card" = the card, other currencies
     I7  each account's check with the latest day (same day: the one added last) is the one shown, with its date:
         unexplained = typed - that account's events dated on or before the check's day. A check added later for an older day
         (a late statement) never replaces it
     I8  a move between places, a check, or a transfer between two accounts in Total never changes Total
     I9  undo and redo put every number back exactly; a saved and reopened copy shows the same numbers; the ledger holds exactly the
         events this test added and did not undo (nothing trimmed, nothing doubled)
     I11 months without a fixed window: pay day periods chain end to start with no gap, and each period's Total moves by exactly
         what came in minus what went out in it, years back or ahead (the ledger is never trimmed; a month is only a view)
     I12 handed to the wallet since pay day goes by the day of each event, not by the order they were added
     I13 money lent ("owed to you") sits in the place 'lent': a figure of its own, inside Total, never in Saved or the burrows
   A second block of people (same count, its own seed) adds the cases the first block never draws, so I2, I5 and I8 meet them:
     money sent abroad (convert from a home account), cash taken on a card paid in full (borrow onto it), a card paid in full paid
     from the wallet that is not tracked, and the place 'free' used in Wallet mode.
   A third block (same count, its own seed; ledger core third pass) adds what the money door lane found: moves into and out of
     the place 'lent' (G2), and money put back from the wallet into a tracked account (G4).
   Months dropped on load (E6) are tested by the E6 lane on side/e6-window-test, not here. */
const { loadModel, Report, Rand, cents } = require('./lib');
const { tools } = require('./ledger_personas_run');
const N = +(process.argv[2] || 300), SEED = +(process.argv[3] || 11);
let R = Rand(SEED), EXT = false, EXT3 = false;   /* EXT: the second block, with the extra cases. EXT3: the third block (also EXT) */
const ri = (a, b) => R.ri(a, b), pick = a => R.pick(a), chance = p => R.chance(p);
const rep = Report('ledger fuzz');
const M = loadModel();
const J = JSON.stringify;
if (!(M.ledgerFresh && M.ledgerAdd && M.ledgerUndo && M.ledgerRedo && M.placesOf && M.periodOf && M.flows)) {
  rep.missing('the ledger in the design shape: ledgerFresh, ledgerAdd, ledgerUndo (by id), ledgerRedo, placesOf, periodOf, flows (LEDGER_DESIGN.md)'); rep.end();
}
const { oracle, identities, acctDelta } = tools(M, rep);
const pad = n => (n < 10 ? '0' : '') + n;
const randDate = () => `${ri(2026, 2029)}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`;
const amt = () => pick([ri(1, 99), ri(100, 99999), ri(100000, 9999999), 4100000]) / 100;

function person(t) {
  const mode = chance(.35) ? 'wallet' : 'track', A = [];
  const n = (k, lo, hi) => { const c = ri(lo, hi); for (let i = 1; i <= c; i++) A.push(k(i)); };
  n(i => ({ id: 'bank' + i, name: 'Bank ' + i, type: 'bank' }), 1, 3);
  n(i => ({ id: 'ew' + i, name: 'E-wallet ' + i, type: 'ewallet' }), 0, 2);
  n(() => ({ id: 'cash', name: 'Cash', type: 'cash' }), 0, 1);
  n(i => ({ id: 'card' + i, name: 'Card ' + i, type: 'card', inFull: true, payDay: ri(1, 28) }), 0, 2);
  n(() => ({ id: 'cardold', name: 'Card 1, older balance', type: 'loan' }), 0, 1);
  n(() => ({ id: 'pl', name: 'Pay-later', type: 'paylater' }), 0, 1);
  n(() => ({ id: 'loan', name: 'Loan', type: 'loan' }), 0, 1);
  n(() => ({ id: 'otu', name: 'Owed to me', type: 'owedToYou' }), 0, 1);
  n(() => ({ id: 'usd', name: 'Payoneer', type: 'bank', cur: 'USD' }), 0, 1);
  if (mode === 'wallet' || (EXT && chance(.5))) A.push({ id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false });
  return { cur: 'PHP', mode, accounts: A, payDays: pick([[1], [10], [15, 30], [25], [5, 20]]) };
}

/* the second block only: the cases where Total or a card line can break. null when this person has no account for the case drawn */
function extraEvent(setup) {
  const A = setup.accounts, of = (...ts) => A.filter(a => ts.includes(a.type) && a.cur == null && a.tracked !== false);
  const home = of('bank', 'ewallet', 'cash'), cards = of('card'), usd = A.filter(a => a.cur === 'USD'), wal = A.filter(a => a.id === 'wallet');
  const places = ['waiting', 'bills', 'emergency', 'trip', 'give', 'free'];
  const date = randDate(), a = amt(), r = R.rnd(), maybe = () => (chance(.5) ? pick(places) : undefined);
  if (r < .25) return usd.length ? { k: 'convert', acct: pick(home).id, acct2: usd[0].id, a, a2: amt(), date, place: maybe() } : null;   /* money sent abroad */
  if (r < .5) return cards.length ? { k: 'borrow', acct: pick(home.concat(wal)).id, acct2: pick(cards).id, a, date, place: maybe() } : null;   /* cash on a card */
  if (r < .75) return cards.length && wal.length ? { k: 'repay', acct: 'wallet', acct2: pick(cards).id, a, date, place: maybe() } : null;   /* card paid from the wallet */
  if (setup.mode !== 'wallet') return null;
  const q = R.rnd();                                                                              /* 'free' in Wallet mode */
  if (q < .3) return { k: 'move', a, date, place: pick(places.slice(0, 5)), place2: 'free' };
  if (q < .5) return { k: 'move', a, date, place: 'free', place2: pick(places.slice(0, 5)) };
  if (q < .7) return { k: 'in', sub: 'gift', acct: pick(home).id, a, date, place: 'free' };
  if (q < .85) return { k: 'spend', sub: 'spend', acct: pick(home).id, a, date, place: 'free' };
  if (cards.length) return { k: 'in', sub: 'refund', acct: pick(cards).id, a, date };             /* no place: lands in Free to spend */
  return { k: 'adjust', acct: pick(home).id, a: a * (chance(.5) ? -1 : 1), date };
}
/* the third block only (ledger core, third pass): money lent has its own place 'lent' (G2). null when nothing fits */
function thirdEvent(setup) {
  const places = ['waiting', 'bills', 'emergency', 'trip', 'give'].concat(setup.mode === 'track' ? ['free'] : []);
  const date = randDate(), a = amt();
  /* G4: money handed to the wallet, and money put back from the wallet into a tracked account */
  const home = setup.accounts.filter(q => ['bank', 'ewallet', 'cash'].includes(q.type) && q.cur == null && q.tracked !== false);
  if (setup.accounts.some(q => q.id === 'wallet') && chance(.5)) return chance(.55) ? { k: 'transfer', sub: 'put back', acct: 'wallet', acct2: pick(home).id, a, date, place: chance(.5) ? pick(places) : undefined }
    : chance(.6) ? { k: 'hand', acct: pick(home).id, acct2: 'wallet', a, date, place: pick(places) } : { k: 'in', sub: 'pay', acct: pick(home).id, a, date, place: 'waiting' };
  return chance(.6) ? { k: 'move', sub: 'lent', a, date, place: pick(places), place2: 'lent' } : { k: 'move', sub: 'paid back', a, date, place: 'lent', place2: pick(places) };
}
function randomEvent(setup) {
  if (EXT3 && chance(.25)) { const x = thirdEvent(setup); if (x) return x; }
  if (EXT && chance(.35)) { const x = extraEvent(setup); if (x) return x; }
  const A = setup.accounts, of = (...ts) => A.filter(a => ts.includes(a.type) && a.cur == null && a.tracked !== false);
  const home = of('bank', 'ewallet', 'cash'), inTot = of('bank', 'ewallet', 'cash', 'owedToYou'), owed = of('card', 'paylater', 'loan');
  const cards = of('card'), loans = of('paylater', 'loan'), usd = A.filter(a => a.cur === 'USD');
  const places = ['waiting', 'bills', 'emergency', 'trip', 'give'].concat(setup.mode === 'track' ? ['free'] : []);
  const date = randDate(), a = amt(), r = R.rnd();
  if (r < .14) return { k: 'in', sub: pick(['pay', 'refund', 'gift']), acct: pick(home.concat(usd)).id, a, date, place: pick(places) };
  if (r < .2 && cards.length) return { k: 'in', sub: 'refund', acct: pick(cards).id, a, date, place: pick(places) };
  if (r < .26 && loans.length) return { k: 'borrow', acct: pick(home).id, acct2: pick(loans).id, a, date };
  if (r < .4) { const p = pick(places); return { k: 'move', a, date, place: p, place2: pick(places.filter(x => x !== p)) }; }
  if (r < .6) return { k: 'spend', sub: pick(['spend', 'bill', 'family support', 'take out']), acct: pick(home.concat(owed)).id, a, date, place: pick(places) };
  if (r < .64 && setup.mode === 'wallet') return { k: 'hand', acct: pick(home).id, acct2: 'wallet', a, date, place: pick(places) };
  if (r < .7 && inTot.length > 1) { const x = pick(inTot); return { k: 'transfer', acct: x.id, acct2: pick(inTot.filter(y => y !== x)).id, a, date }; }
  if (r < .74 && usd.length) return { k: 'convert', acct: usd[0].id, acct2: pick(home).id, a, a2: amt(), date };
  if (r < .84 && owed.length) { const o = pick(owed); return { k: 'repay', acct: pick(home).id, acct2: o.id, a, date, place: o.type === 'card' && chance(.7) ? undefined : pick(places) }; }
  if (r < .94) return { k: 'check', acct: pick(A).id, typedA: amt() * (chance(.2) ? -1 : 1), date };
  return { k: 'adjust', acct: pick(A).id, a: amt() * (chance(.5) ? -1 : 1), date, place: pick(places) };
}

/* I7 worked out here: the balance a check compares with */
function checkBal(setup, list, chk, accts) {
  const ci = list.indexOf(chk); let b = 0;
  list.forEach((e, i) => { if (e === chk || e.k === 'check') return; if (e.date && chk.date ? e.date <= chk.date : i < ci) b += acctDelta(e, accts)[chk.acct] || 0; });
  return b;
}

/* I12 worked out here: handed to the wallet since the last pay that started a month, by day (same day: in the order added).
   Money put back from the wallet (a transfer from the wallet that is not tracked into a tracked bank, e-wallet or cash account) takes away from it,
   never below zero (G4) */
function handedByDay(list, accts) {
  const inT = id => { const a = accts[id]; return !!a && a.cur == null && a.tracked !== false && ['bank', 'ewallet', 'cash'].includes(a.type); };   /* lending from the wallet (to an "owed to you" account) is not a put-back */
  const back = e => e.k === 'transfer' && accts[e.acct] && accts[e.acct].tracked === false && accts[e.acct].cur == null && inT(e.acct2);
  const order = []; list.forEach((e, i) => { if (e.k === 'hand' || back(e) || (e.k === 'in' && e.sub === 'pay' && e.startsPeriod !== false)) order.push([e, i]); });
  order.sort((p, q) => (p[0].date < q[0].date ? -1 : p[0].date > q[0].date ? 1 : p[1] - q[1]));
  let h = 0; order.forEach(p => { if (p[0].k === 'hand') h += cents(p[0].a); else if (p[0].k === 'transfer') h = Math.max(0, h - cents(p[0].a)); else h = 0; });
  return h;
}

/* I13 worked out here: what the place 'lent' holds, from the moves into it and out of it */
function lentByMoves(list) { let v = 0; list.forEach(e => { if (e.k === 'move') { if (e.place2 === 'lent') v += cents(e.a); if (e.place === 'lent') v -= cents(e.a); } }); return v; }

for (let block = 0; block < 3; block++) {
if (block === 1) { R = Rand(SEED + 1000); EXT = true; }
if (block === 2) { R = Rand(SEED + 2000); EXT = true; EXT3 = true; }
for (let t = 0; t < N; t++) {
  const setup = person(t), tag0 = `${EXT3 ? 'y' : EXT ? 'x' : ''}#${t} ${setup.mode} ${setup.accounts.map(a => a.id).join(',')}`;
  let S = M.ledgerFresh(setup); S.ui.payDays = setup.payDays;
  const mine = [], redo = [];   /* what this test added, in ledger order, and what it undid */
  setup.accounts.forEach(a => { if (chance(.8)) { const e = { k: 'open', acct: a.id, a: amt(), date: '2026-01-01', place: 'waiting' }; if (M.ledgerAdd(S, e)) mine.push(e); } });
  const accts = oracle(setup, []).accts;
  const nSteps = ri(5, 70);
  for (let k = 0; k < nSteps; k++) {
    const r = R.rnd(); let tag = `${tag0} step ${k + 1}`;
    const before = M.placesOf(S), beforeJ = J(before);
    if (r < .08 && mine.length) {                       /* undo the last event */
      tag += ' undo'; M.ledgerUndo(S); redo.push({ e: mine.pop(), after: beforeJ });
    } else if (r < .14 && mine.length) {                /* undo any event by id */
      const i = ri(0, mine.length - 1), id = S.ledger[i].id; tag += ' undo id ' + id;
      rep.ok(M.ledgerUndo(S, id) !== false, `${tag}: undo by id refused`); mine.splice(i, 1); redo.length = 0;
    } else if (r < .18 && redo.length) {                /* redo puts the last undo back exactly */
      tag += ' redo'; const u = redo.pop(); M.ledgerRedo(S); mine.push(u.e);
      rep.ok(J(M.placesOf(S)) === u.after, `${tag}: I9 redo did not put every number back`);
    } else if (r < .22) {                               /* save and reopen */
      tag += ' reload'; S = JSON.parse(J(S)); rep.ok(J(M.placesOf(S)) === beforeJ, `${tag}: I9 a reopened copy shows different numbers`);
    } else {
      const e = randomEvent(setup); tag += ' ' + J(e);
      if (!M.ledgerAdd(S, e)) { rep.ok(false, `${tag}: the design could not record this event`); continue; }
      mine.push(e); redo.length = 0;
      const p = M.placesOf(S);
      const inT = id => { const a = accts[id]; return a && a.cur === setup.cur && a.tracked !== false && !['card', 'paylater', 'loan'].includes(a.type); };
      if (e.k === 'move' || e.k === 'check' || (e.k === 'transfer' && inT(e.acct) && inT(e.acct2))) rep.ok(cents(p.total) === cents(before.total), `${tag}: I8 a ${e.k} changed Total`);
    }
    /* the ledger holds exactly what was added and not undone */
    rep.ok(S.ledger.length === mine.length && S.ledger.every((x, i) => x.k === mine[i].k && x.date === mine[i].date && cents(x.a || x.c / 100 || 0) === cents(mine[i].a || 0) || (x.c != null && x.c === cents(mine[i].a || 0))), `${tag}: I9 the ledger is not exactly the events added and not undone`);
    identities(tag, setup, S, mine);
    /* I7: on each account, the check with the latest day (same day: the one added last), never just the one added last */
    const p = M.placesOf(S), last = {};
    mine.forEach(e => { if (e.k === 'check' && (!last[e.acct] || e.date >= last[e.acct].date)) last[e.acct] = e; });
    for (const id in last) {
      rep.ok(p.checks[id].date === last[id].date, `${tag}: I7 ${id} shows the check of ${p.checks[id].date}, the latest day checked is ${last[id].date}`);
      rep.ok(cents(p.checks[id].unexplained) === cents(last[id].typedA) - checkBal(setup, mine, last[id], accts), `${tag}: I7 ${id} unexplained ${p.checks[id].unexplained} is not typed - its events up to ${last[id].date}`);
    }
    /* I13: money lent is its own figure, outside Saved and outside the burrows, inside Total (I3) */
    rep.ok(cents(p.lent || 0) === lentByMoves(mine), `${tag}: I13 owed to you (the place lent) shows ${p.lent}, the moves give ${lentByMoves(mine) / 100}`);
    /* I12: handed to the wallet since pay day, by day */
    const hb = handedByDay(mine, setup.accounts.reduce((o, q) => { o[q.id] = q; return o; }, {}));
    rep.ok(cents(p.wallet) === hb && (setup.mode !== 'wallet' || cents(p.free) === hb), `${tag}: I12 handed to the wallet since pay day shows ${p.wallet}, by day it is ${hb / 100}`);
  }
  /* I11: months as views. Walk pay day periods from before the first event to after the last */
  const dates = mine.map(e => e.date).filter(Boolean).sort();
  if (dates.length) {
    let per = M.periodOf(S, dates[0]), guard = 0, first = null, lastEnd = null;
    const endDate = dates[dates.length - 1];
    while (guard++ < 200) {
      const f = M.flows(S, per.from, per.to);
      if (!first) first = f;
      if (lastEnd != null) rep.ok(cents(f.totalStart) === cents(lastEnd), `${tag0}: I11 the period from ${per.from} does not start where the last one ended`);
      rep.ok(cents(f.totalEnd) - cents(f.totalStart) === cents(f.cameIn) - cents(f.wentOut), `${tag0}: I11 ${per.from} to ${per.to}: Total moved ${(cents(f.totalEnd) - cents(f.totalStart)) / 100}, in minus out is ${(cents(f.cameIn) - cents(f.wentOut)) / 100}`);
      lastEnd = f.totalEnd;
      if (per.to > endDate) break;
      const next = M.periodOf(S, per.to); rep.ok(next.from === per.to, `${tag0}: I11 a gap between ${per.to} and ${next.from}`); per = next;
    }
    rep.ok(cents(lastEnd) === cents(M.placesOf(S).total), `${tag0}: I11 the last period does not end at today's Total`);
  }
  /* undo everything: back to nothing but the opening balances, then to nothing at all */
  while (mine.length && mine[mine.length - 1].k !== 'open') { M.ledgerUndo(S); mine.pop(); }
  identities(tag0 + ' after undoing every event but the openings', setup, S, mine);
}
}
rep.end();
