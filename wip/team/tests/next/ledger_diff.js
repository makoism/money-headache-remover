/* LEDGER DIFFERENTIAL (tests/next, side N, 2026-11-19): the real ledger (wip/team/ledger.js) against the reference model
   (tests/next/ledger_ref.js). Thousands of random people and event lists go through both; every figure both give is compared to
   the cent after every step: places, burrows, card lines, accounts, Owed, other currencies, each account's check, undo (last and by
   id), redo, save and reopen, pay day periods and the flow of any span of days, and random 38.31 copies through migrate3831.
     node tests/next/ledger_diff.js [count] [seed]        Ends with "LEDGER DIFF PASS" or "... FAIL n".
   The lists stay inside what both models read the same way. Where ledger.js is stricter or differs on purpose, the list avoids it
   and tests/next/ledger_edge.js tests it alone (LANE_ledger_core.md "Where ledger.js differs from the reference"):
     - no event is dated before the opening balance of its account, and the place 'free' is not used in Wallet mode
     - "handed to the wallet since pay day" goes by day in ledger.js and by the order added in the reference, so it is compared with
       the reference run on the same events sorted by day */
const fs = require('fs'), path = require('path');
const { Report, Rand, cents } = require('./lib');
const REF = require('./ledger_ref');
const NAMES = ['ledgerFresh', 'ledgerAdd', 'ledgerUndo', 'ledgerRedo', 'placesOf', 'periodOf', 'flows', 'migrate3831', 'ledgerWhy', 'ledgerProof'];
const APP = new Function(fs.readFileSync(process.env.LEDGER_FILE || path.join(__dirname, '..', '..', 'ledger.js'), 'utf8') + ';\nreturn {' + NAMES.map(n => n + ': ' + n).join(', ') + '};')();
const N = +(process.argv[2] || 3000), R = Rand(+(process.argv[3] || 23));
const { ri, pick, chance } = R, J = JSON.stringify, rep = Report('ledger diff');
const pad = n => (n < 10 ? '0' : '') + n;

function person() {
  const cur = pick(['PHP', 'PHP', 'JPY', 'EUR']), mode = chance(.35) ? 'wallet' : 'track', A = [];
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
  if (mode === 'wallet' || chance(.2)) A.push({ id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false });
  return { cur, mode, accounts: A, payDays: pick([[1], [10], [15, 30], [25], [5, 20], [31], [29, 30, 31]]) };
}
function maker(setup) {
  const whole = setup.cur === 'JPY', day0 = '2026-01-01'; let clock = 0;
  const amtIn = c => { const raw = pick([ri(1, 99), ri(100, 99999), ri(100000, 9999999), 4100000, 1, 99999999999]); const w = whole && c !== 'USD' ? raw * 100 : raw; return w / 100; };
  const sorted = chance(.4);   /* some people log as it happens, the others import statements late, in any order */
  const date = () => { if (!sorted) return `${ri(2026, 2029)}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`; clock += ri(0, 9); const t = new Date(Date.UTC(2026, 0, 1 + clock)); return t.toISOString().slice(0, 10); };
  const A = setup.accounts, of = (...ts) => A.filter(a => ts.includes(a.type) && a.cur == null && a.tracked !== false);
  const home = of('bank', 'ewallet', 'cash'), inTot = of('bank', 'ewallet', 'cash', 'owedToYou'), owed = of('card', 'paylater', 'loan');
  const cards = of('card'), loans = of('paylater', 'loan'), usd = A.filter(a => a.cur === 'USD'), wal = A.filter(a => a.id === 'wallet');
  const places = ['waiting', 'bills', 'emergency', 'trip', 'give'].concat(setup.mode === 'track' ? ['free'] : []);
  const curOf = id => (A.find(a => a.id === id) || {}).cur || setup.cur, amt = id => amtIn(curOf(id));
  const event = () => {
    const d = date(), r = R.rnd(), sgn = () => (chance(.4) ? -1 : 1);
    if (r < .13) { const a = pick(home.concat(usd, wal)).id; return { k: 'in', sub: pick(['pay', 'pay', 'refund', 'gift']), acct: a, a: amt(a), date: d, place: pick(places), startsPeriod: chance(.2) ? false : undefined }; }
    if (r < .19 && cards.length) { const a = pick(cards).id; return { k: 'in', sub: 'refund', acct: a, a: amt(a), date: d, place: pick(places) }; }
    if (r < .21 && loans.length) { const a = pick(loans).id; return { k: 'in', sub: 'refund', acct: a, a: amt(a), date: d }; }
    if (r < .26 && loans.length) return { k: 'borrow', acct: pick(home.concat(wal)).id, acct2: pick(loans).id, a: amt(), date: d, place: chance(.5) ? pick(places) : undefined };
    if (r < .4) { const p = pick(places); return { k: 'move', a: amt(), date: d, place: p, place2: pick(places.filter(q => q !== p)) }; }
    if (r < .6) { const a = pick(home.concat(owed, usd, wal)).id; return { k: 'spend', sub: pick(['spend', 'bill', 'family support', 'take out']), acct: a, a: amt(a), date: d, place: pick(places) }; }
    if (r < .65 && wal.length) return { k: 'hand', acct: pick(home).id, acct2: 'wallet', a: amt(), date: d, place: chance(.5) ? pick(places) : undefined };
    if (r < .71 && inTot.concat(wal).length > 1) { const all = inTot.concat(wal), q = pick(all); return { k: 'transfer', acct: q.id, acct2: pick(all.filter(z => z !== q)).id, a: amt(), date: d, place: chance(.5) ? pick(places) : undefined }; }
    if (r < .75 && usd.length) return { k: 'convert', acct: usd[0].id, acct2: pick(home).id, a: amtIn('USD'), a2: amt(), date: d, place: chance(.3) ? pick(places) : undefined };
    if (r < .84 && owed.length) { const o = pick(owed); return { k: 'repay', acct: pick(home).id, acct2: o.id, a: amt(), date: d, place: chance(.5) ? undefined : pick(places) }; }
    if (r < .94) { const a = pick(A).id; return { k: 'check', acct: a, typedA: amt(a) * sgn(), date: d }; }
    const a = pick(A).id; return { k: 'adjust', acct: a, a: amt(a) * sgn(), date: d, place: pick(places) };
  };
  return { event, day0, amt };
}
/* every figure both models give, in cents, in one fixed order */
function figures(p, skipHanded) {
  const c = v => cents(v || 0), o = {}, flat = (name, obj) => Object.keys(obj || {}).sort().forEach(k => { if (c(obj[k])) o[name + '.' + k] = c(obj[k]); });
  ['waiting', 'bills', 'billsOnly', 'forCards', 'saved', 'thisMonth', 'total', 'have', 'owed'].forEach(k => { o[k] = c(p[k]); });
  if (!skipHanded) { o.free = c(p.free); o.wallet = c(p.wallet); }
  flat('burrow', p.burrows); flat('card', p.cards); flat('acct', p.accounts); flat('foreign', p.foreign);
  Object.keys(p.checks || {}).sort().forEach(k => { o['check.' + k] = [c(p.checks[k].typed), c(p.checks[k].unexplained)]; });
  return o;
}
function firstDiff(a, b) { for (const k of Object.keys(Object.assign({}, a, b))) if (J(a[k]) !== J(b[k])) return `${k}: ledger.js ${J(a[k])}, reference ${J(b[k])}`; return ''; }
const byDay = L => L.map((e, i) => [e, i]).sort((p, q) => (p[0].date < q[0].date ? -1 : p[0].date > q[0].date ? 1 : p[1] - q[1])).map(p => p[0]);

let events = 0;
for (let t = 0; t < N; t++) {
  const setup = person(), tag0 = `#${t} ${setup.cur} ${setup.mode}`, mk = maker(setup);
  let a = APP.ledgerFresh(setup), b = REF.ledgerFresh(JSON.parse(J(setup))); b.ui.payDays = setup.payDays;
  if (!a) { rep.ok(false, `${tag0}: ledger.js refused the setup: ${J(APP.ledgerWhy())}`); continue; }
  const same = tag => {
    const pa = APP.placesOf(a), pb = REF.placesOf(b);
    const fa = figures(pa, true), fb = figures(pb, true), d = firstDiff(fa, fb);
    rep.ok(!d, `${tag}: ${d}`);
    /* handed to the wallet since pay day: by day */
    const ph = REF.placesOf(Object.assign({}, b, { ledger: byDay(b.ledger) }));
    rep.ok(cents(pa.wallet) === cents(ph.wallet) && cents(pa.free) === cents(ph.free), `${tag}: handed to the wallet is ${pa.wallet}, the reference by day gives ${ph.wallet}`);
    rep.ok(a.ledger.length === b.ledger.length && a.ledger.every((e, i) => e.id === b.ledger[i].id && e.k === b.ledger[i].k && e.c === b.ledger[i].c), `${tag}: the two ledgers do not hold the same events in the same order`);
    const pr = APP.ledgerProof(a); rep.ok(pr.ok, `${tag}: ledgerProof says the one rule is broken ${J(pr)}`);
  };
  const both = (tag, e) => { const ra = APP.ledgerAdd(a, e), rb = REF.ledgerAdd(b, JSON.parse(J(e))); events++;
    rep.ok(!!ra && !!rb, `${tag}: recorded by ledger.js ${!!ra} (${J(APP.ledgerWhy())}), by the reference ${!!rb}`); return !!ra && !!rb; };
  setup.accounts.forEach(ac => { if (chance(.8)) both(tag0 + ' open ' + ac.id, { k: 'open', acct: ac.id, a: mk.amt(ac.id) * (chance(.1) ? -1 : 1) * (chance(.05) ? 0 : 1), date: mk.day0, place: chance(.7) ? 'waiting' : 'emergency' }); });
  same(tag0 + ' opening');
  const steps = ri(0, 45); let undone = 0;
  for (let k = 0; k < steps; k++) {
    const r = R.rnd(); let tag = `${tag0} step ${k + 1}`;
    if (r < .07 && a.ledger.length) { tag += ' undo'; rep.ok(!!APP.ledgerUndo(a) === !!REF.ledgerUndo(b), tag + ': undo'); undone++; }
    else if (r < .12 && a.ledger.length) { const id = a.ledger[ri(0, a.ledger.length - 1)].id; tag += ' undo id ' + id; rep.ok(!!APP.ledgerUndo(a, id) === !!REF.ledgerUndo(b, id), tag + ': undo by id'); undone++; }
    else if (r < .18 && undone) { tag += ' redo'; rep.ok(!!APP.ledgerRedo(a) === !!REF.ledgerRedo(b), tag + ': redo'); undone--; }
    else if (r < .21) { tag += ' reopen'; a = JSON.parse(J(a)); b = JSON.parse(J(b)); }
    else { const e = mk.event(); tag += ' ' + J(e); if (both(tag, e)) undone = 0; }
    same(tag);
  }
  /* months as views and the flow of any span */
  for (let q = 0; q < 4; q++) {
    const d = `${ri(2025, 2030)}-${pad(ri(1, 12))}-${pad(ri(1, 31))}`.replace(/-(02)-(29|30|31)$/, '-02-28').replace(/-(04|06|09|11)-31$/, '-$1-30');
    const pa = APP.periodOf(a, d), pb = REF.periodOf(b, d);
    rep.ok(J(pa) === J(pb), `${tag0}: periodOf ${d} pay days ${J(setup.payDays)}: ledger.js ${J(pa)}, reference ${J(pb)}`);
    const span = chance(.5) && pa ? [pa.from, pa.to] : [d, chance(.2) ? null : `${ri(2026, 2030)}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`];
    const fa = APP.flows(a, span[0], span[1]), fb = REF.flows(b, span[0], span[1]);
    const cf = f => J(['cameIn', 'wentOut', 'totalStart', 'totalEnd', 'owedStart', 'owedEnd'].map(k => cents(f[k])));
    rep.ok(cf(fa) === cf(fb), `${tag0}: flows ${span}: ledger.js ${cf(fa)}, reference ${cf(fb)}`);
  }
}
/* random 38.31 copies through migrate3831 */
for (let t = 0; t < Math.max(200, N / 5); t++) {
  const cur = pick(['PHP', 'JPY', 'EUR']), u = () => (cur === 'JPY' ? ri(0, 900000) : ri(0, 90000000) / 100);
  const old = { cur, freeMode: pick(['track', 'wallet', undefined]), bankStart: u() * (chance(.15) ? -1 : 1), bankAt: chance(.8) ? `2026-11-${pad(ri(1, 19))}` : undefined,
    cards: Array.from({ length: ri(0, 3) }, (_, i) => ({ name: 'Card ' + i, owed: chance(.2) ? 0 : u(), payDay: ri(1, 28) })),
    goals: Array.from({ length: ri(0, 4) }, (_, i) => ({ id: 'g' + i, start: chance(.2) ? 0 : u() })), planFigures: { bankEnd: u() } };
  const a = APP.migrate3831(JSON.parse(J(old)), '2026-11-20'), b = REF.migrate3831(JSON.parse(J(old)), '2026-11-20'), tag = `migration #${t} ${J(old)}`;
  if (!a) { rep.ok(false, `${tag}: ledger.js refused: ${J(APP.ledgerWhy())}`); continue; }
  const d = firstDiff(figures(APP.placesOf(a)), figures(REF.placesOf(b)));
  rep.ok(!d, `${tag}: ${d}`);
  rep.ok(a.ledger.length === b.ledger.length && a.ledger.every(e => e.k === 'open'), `${tag}: not the same opening balances`);
  rep.ok(J(Object.assign({}, a.frozen, { frozenAt: undefined })) === J(old), `${tag}: the frozen copy is not the saved copy unchanged`);
}
console.log(`${N} people, ${events} events through both models`);
rep.end();
