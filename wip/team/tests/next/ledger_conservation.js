/* LEDGER CONSERVATION (tests/next, side session C, 2026-11-19).
   EXPECTED TO FAIL until step B1 (the ledger and "check your bank") is built. PLAN.md section D step 12; HANDOFF.md section 5, step B:
   "Conservation tests: total always equals the sum of the places; undo restores exactly; every migration path" (migration is in
   tests/next/migration_fixtures.js).
   Run: node tests/next/ledger_conservation.js [count] [seed]      Ends with "LEDGER CONSERVATION PASS" or "... FAIL n".

   What it guards, in plain rules (HANDOFF.md section 4 "The rules"; DECISIONS.md decision 7; tests/qc/proof_formula.js):
   1. Every coin is in exactly one place. Total = Chest + This month + Burrows, after every single event, in Wallet and Track mode.
      This month = Bills left + Free to spend in Track mode. In Wallet mode Free to spend is in the wallet and outside Total.
   2. Worked out from the other side: Total = opening balances + every pay - everything that left (spending, take out, and in Wallet
      mode the Free to spend handed to the wallet). A move between places never changes Total.
   3. Taking money out of a burrow lowers that burrow only (rule 3). Pay lands in the Chest only. Spending lowers only the place it
      came from. Only the person's own events move money (rule 4).
   4. Undo restores exactly: every place, to the cent, and the ledger itself. Undoing every event returns to the opening balances.
   5. Balances are derived from the ledger, never stored separately (HANDOFF.md section 5, step B): a saved and reloaded copy shows the
      same places.
   6. Check your bank moves no money. It shows the difference between the typed balance and Total ("1,200 unexplained: add a receipt
      or adjust", HANDOFF.md section 4 "The rhythms").
   7. Cents are kept exactly: no amount drifts by a cent however many events there are (proof_formula.js: "to the cent").
   Where the docs do not say (spending more than a place holds, Wallet mode and check your bank, undo after reload, what Free to spend
   shows in Wallet mode), the check prints WAIT and the question is in SIDE_C_QUESTIONS.md.

   The reference below is written from the rules only, in whole cents. It is checked against itself on every run, so the test is
   trusted before the app exists. The app hook is LEDGER() in tests/next/lib.js. */
const { loadModel, LEDGER, Report, Rand, cents } = require('./lib');
const N = +(process.argv[2] || 400), R = Rand(+(process.argv[3] || 7));
const { ri, pick, chance } = R;
const rep = Report('ledger conservation');
const M = loadModel(), APP = LEDGER(M);
if (!APP) rep.missing('the ledger: model.js has no placesOf, ledgerAdd and ledgerUndo (hook LEDGER in tests/next/lib.js). Only the reference is checked');

const BURROWS = ['emergency', 'trip', 'edu', 'give', 'invest'];
const J = JSON.stringify;
/* ---- the reference, in whole cents ---- */
function refStart(mode, start) {
  const P = { chest: start.chest || 0, bills: 0, free: 0, wallet: 0 }; BURROWS.forEach(b => { P[b] = start[b] || 0; });
  return { mode, P, came: Object.values(P).reduce((a, b) => a + b, 0), left: 0, unexplained: null, stack: [] };
}
function refAdd(L, e) {
  const P = L.P; L.stack.push(J({ P, came: L.came, left: L.left, unexplained: L.unexplained }));
  if (e.t === 'pay') { P.chest += e.a; L.came += e.a; }
  else if (e.t === 'place') { P.chest -= e.a; if (e.to === 'free' && L.mode === 'wallet') { P.wallet += e.a; L.left += e.a; } else P[e.to] += e.a; }
  else if (e.t === 'spend' || e.t === 'takeout') { P[e.from] -= e.a; L.left += e.a; }
  else if (e.t === 'move') { P[e.from] -= e.a; P[e.to] += e.a; }
  else if (e.t === 'check') { L.unexplained = e.a - refPlaces(L).total; }
}
function refUndo(L) { const s = JSON.parse(L.stack.pop()); L.P = s.P; L.came = s.came; L.left = s.left; L.unexplained = s.unexplained; }
function refPlaces(L) {
  const P = L.P, burrows = {}; BURROWS.forEach(b => { burrows[b] = P[b]; });
  const saved = BURROWS.reduce((a, b) => a + P[b], 0), thisMonth = P.bills + (L.mode === 'track' ? P.free : 0);
  return { chest: P.chest, bills: P.bills, free: L.mode === 'track' ? P.free : 0, wallet: P.wallet, burrows, thisMonth, total: P.chest + thisMonth + saved, unexplained: L.unexplained };
}
/* a random event the rules allow, never taking more than a place holds (that case is a question: L1) */
function randomEvent(L) {
  const P = L.P, mode = L.mode, a = max => (max <= 0 ? 0 : pick([1, max, ri(1, max), ri(1, Math.min(max, 999)), Math.floor(max / 3) || 1]));
  const placeTo = ['bills', 'free'].concat(BURROWS), r = R.rnd();
  if (r < .18) return { t: 'pay', a: pick([ri(1, 30000000), ri(1, 99) , 4100000, ri(1, 999999)]) };
  if (r < .45 && P.chest > 0) return { t: 'place', a: a(P.chest), to: pick(placeTo) };
  if (r < .65) { const from = pick(mode === 'track' ? ['bills', 'free'] : ['bills']); if (P[from] > 0) return { t: 'spend', a: a(P[from]), from }; }
  if (r < .75) { const from = pick(BURROWS); if (P[from] > 0) return { t: 'takeout', a: a(P[from]), from }; }
  if (r < .9) { const from = pick(['chest', 'bills'].concat(mode === 'track' ? ['free'] : [], BURROWS)), to = pick(placeTo.filter(x => x !== from && !(mode === 'wallet' && x === 'free')));
    if (P[from] > 0) return { t: 'move', a: a(P[from]), from, to }; }
  return { t: 'check', a: Math.max(0, refPlaces(L).total + pick([0, 0, 120000, -ri(1, 50000), ri(1, 99)])) };
}
const toApp = e => Object.assign({}, e, { a: e.a / 100 });   /* the app takes money units with cents */
function appCents(p) {
  const b = {}; BURROWS.forEach(k => { b[k] = cents((p.burrows || {})[k] || 0); });
  return { chest: cents(p.chest), bills: cents(p.bills), free: cents(p.free || 0), wallet: cents(p.wallet || 0), burrows: b, thisMonth: cents(p.thisMonth), total: cents(p.total), unexplained: p.unexplained == null ? null : cents(p.unexplained) };
}
function same(tag, app, ref, mode) {
  const keys = ['chest', 'bills', 'thisMonth', 'total'].concat(mode === 'track' ? ['free'] : []);
  for (const k of keys) if (app[k] !== ref[k]) return rep.ok(false, `${tag}: ${k} is ${app[k] / 100}, the rules give ${ref[k] / 100}`);
  for (const b of BURROWS) if (app.burrows[b] !== ref.burrows[b]) return rep.ok(false, `${tag}: burrow ${b} is ${app.burrows[b] / 100}, the rules give ${ref.burrows[b] / 100}`);
  rep.ok(true, '');
}
function identity(tag, p, mode) {
  const saved = BURROWS.reduce((a, b) => a + p.burrows[b], 0);
  rep.ok(p.total === p.chest + p.thisMonth + saved, `${tag}: Total ${p.total / 100} is not Chest + This month + Burrows (${p.chest / 100} + ${p.thisMonth / 100} + ${saved / 100})`);
  rep.ok(p.thisMonth === p.bills + (mode === 'track' ? p.free : 0), `${tag}: This month ${p.thisMonth / 100} is not Bills left` + (mode === 'track' ? ' + Free to spend' : ' (Free to spend is in the wallet, outside Total)'));
}

for (let t = 0; t < N; t++) {
  const mode = chance(.5) ? 'wallet' : 'track', tag0 = `#${t} ${mode}`;
  const start = { chest: chance(.5) ? 0 : ri(0, 5000000) }; BURROWS.forEach(b => { start[b] = chance(.7) ? pick([ri(0, 20000000), ri(1, 99), 0]) : 0; });
  const L = refStart(mode, start), openRef = J(refPlaces(L));
  let S = null; if (APP) { S = APP.fresh(mode, Object.fromEntries(Object.entries(start).map(([k, v]) => [k, v / 100]))); same(tag0 + ' opening balances', appCents(APP.places(S)), refPlaces(L), mode); }
  const n = ri(0, 60), done = [];
  for (let k = 0; k < n; k++) {
    const e = randomEvent(L), tag = `${tag0} event ${k + 1} ${J(e)}`;
    const before = refPlaces(L); refAdd(L, e); const ref = refPlaces(L);
    /* the reference against the rules, every event */
    identity(tag + ' (reference)', ref, mode);
    rep.ok(ref.total === L.came - L.left, `${tag} (reference): Total is not opening + pay - what left`);
    rep.ok(Object.values(L.P).every(v => v >= 0), `${tag} (reference): a place went below zero`);
    if (e.t === 'move' || e.t === 'check' || (e.t === 'place' && !(mode === 'wallet' && e.to === 'free'))) rep.ok(ref.total === before.total, `${tag} (reference): a ${e.t} changed Total`);
    if (!APP) continue;
    const appBefore = appCents(APP.places(S));
    const okAdd = APP.add(S, toApp(e)); rep.ok(okAdd, `${tag}: the app did not record the event`); if (!okAdd) { refUndo(L); continue; }
    const p = appCents(APP.places(S));
    done.push({ e, after: p });
    identity(tag, p, mode); same(tag, p, ref, mode);
    if (e.t === 'takeout') rep.ok(Object.keys(p).every(k => k === 'burrows' || k === 'total' || k === 'unexplained' || p[k] === appBefore[k]) && BURROWS.every(b => b === e.from || p.burrows[b] === appBefore.burrows[b]), `${tag}: taking out of ${e.from} changed another place (rule 3)`);
    if (e.t === 'check') {
      if (mode === 'track') { rep.ok(p.unexplained === ref.unexplained, `${tag}: unexplained shows ${p.unexplained / 100}, typed minus Total is ${ref.unexplained / 100}`); rep.ok(p.total === before.total, `${tag}: check your bank moved money`); }
      else rep.waitQ('L3', 'in Wallet mode, what check your bank compares the typed balance with');
    }
    /* undo restores exactly, now and then in the middle */
    if (chance(.25)) {
      APP.undo(S); refUndo(L); const u = appCents(APP.places(S));
      rep.ok(J(u) === J(appBefore), `${tag}: undo did not restore every place exactly`); same(tag + ' after undo', u, refPlaces(L), mode);
      APP.add(S, toApp(e)); refAdd(L, e);   /* put it back and carry on */
    }
  }
  if (!APP) continue;
  /* 5. balances come from the ledger: a saved and reloaded copy shows the same places */
  const S2 = JSON.parse(J(S)); rep.ok(J(appCents(APP.places(S2))) === J(appCents(APP.places(S))), `${tag0}: a saved and reloaded copy shows different places`);
  if (done.length) rep.waitQ('L2', 'whether Undo still works after the page is closed and opened again');
  /* 4. undo every event, back to the opening balances */
  for (let k = done.length - 1; k >= 0; k--) { APP.undo(S); refUndo(L); }
  const back = appCents(APP.places(S)), open = JSON.parse(openRef);
  same(`${tag0} after undoing all ${done.length} events`, back, open, mode);
  rep.ok(Array.isArray(S.ledger) && S.ledger.every(e => e.t === 'open'), `${tag0}: after undoing everything the ledger still holds other events`);
}
/* the double count Mako found: adding Free to spend on top of This month must not give Total (proof_formula.js) */
{ const L = refStart('track', { chest: 0, emergency: 100000 }); refAdd(L, { t: 'pay', a: 500000 }); refAdd(L, { t: 'place', a: 200000, to: 'bills' }); refAdd(L, { t: 'place', a: 90000, to: 'free' });
  const p = refPlaces(L); rep.ok(p.chest + p.thisMonth + p.free + 100000 !== p.total, 'the old formula (Chest + This month + Free to spend + Burrows) would also pass'); }
/* spending more than a place holds: the docs say spending past the plan is real money, but not which place it comes from */
rep.waitQ('L1', 'spending more than Bills or Free to spend holds: refused, taken from the Chest, or the place goes below zero');
rep.waitQ('L4', 'what the Free to spend number shows in Wallet mode (handed out this month, or since the last pay day)');
rep.end();
