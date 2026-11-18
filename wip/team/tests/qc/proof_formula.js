/* THE PROOF FORMULA (Mako, 2026-11-18), written as a test before the step B code that will have to pass it.
   Run: node tests/qc/proof_formula.js [count] [seed]      Ends with "PROOF FORMULA PASS" or "PROOF FORMULA FAIL n".

   Every coin is in exactly one place, and no coin is ever counted twice:

     Total = Chest + This month + Burrows

     Chest       new pay waiting on pay day, not placed yet (empty the rest of the time)
     This month  Bills left to pay + Free to spend          (Free to spend is INSIDE This month, never added again)
     Burrows     every goal + Education + Giving + Investing

   Two modes for Free to spend (Wallet is the default, Track is a switch):
     Track mode   Free to spend is a tracked balance. It is part of This month and of Total. Logged spending lowers it.
     Wallet mode  Free to spend goes to the person's wallet when pay is placed. From then on it is "in your wallet", not tracked:
                  it is NOT part of This month or of Total, and the proof line does not count it. (Inferred from HANDOFF.md section 4:
                  "in your wallet (Wallet mode, not tracked)". Mako can flip it.)

   And the proof itself, worked out from the other side (from the events, never from the places):
     Total = what was there at the start + every pay that came in - everything that left
     where "left" is: spending logged from Bills and basics or Free to spend (Track), money taken out of a burrow for its purpose,
     and, in Wallet mode only, the Free to spend handed to the wallet. A move between places (Chest to a room, room to room) never changes Total.

   The four numbers under the picture are Total, Free to spend, Bills left, Saved. They are different views: Total is NOT their sum.
   (Total = Chest + Bills left + Free to spend [Track only] + Saved; in Wallet mode Free to spend is shown but is outside Total.)

   Until step B exists, this file checks a small reference ledger written here from the rules above, on random event lists.
   When the app gains its ledger (S.ledger) and a places function, add it to APP below: the app must agree with the reference to the cent. */
let seed = +(process.argv[3] || 7); const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[ri(0, a.length - 1)];
const N = +(process.argv[2] || 3000);
const BURROWS = ['emergency', 'trip', 'edu', 'give', 'invest'];
let fails = 0, checks = 0; const fail = m => { if (fails++ < 20) console.log('FAIL ' + m); };
const eq = (m, a, b) => { checks++; if (a !== b) fail(m + ': ' + a + ' vs ' + b); };

/* the reference: whole cents, every place one integer */
function ledgerRun(mode, events, start) {
  const P = { chest: 0, bills: 0, free: 0, wallet: 0 }; BURROWS.forEach(b => { P[b] = start[b] || 0; }); P.chest = start.chest || 0;
  let came = Object.values(P).reduce((a, b) => a + b, 0), left = 0;
  for (const e of events) {
    if (e.t === 'pay') { P.chest += e.a; came += e.a; }
    else if (e.t === 'place') { const a = Math.min(e.a, P.chest); P.chest -= a; if (e.to === 'free' && mode === 'wallet') { P.wallet += a; left += a; } else P[e.to] += a; }
    else if (e.t === 'spend') { const a = Math.min(e.a, P[e.from]); P[e.from] -= a; left += a; }
    else if (e.t === 'takeout') { const a = Math.min(e.a, P[e.from]); P[e.from] -= a; left += a; }
    else if (e.t === 'move') { const a = Math.min(e.a, P[e.from]); P[e.from] -= a; P[e.to] += a; }
  }
  return { P, came, left };
}
function placesOf(mode, P) {
  const thisMonth = P.bills + (mode === 'track' ? P.free : 0), burrows = BURROWS.reduce((a, b) => a + P[b], 0);
  return { chest: P.chest, thisMonth, burrows, total: P.chest + thisMonth + burrows,
    four: { total: P.chest + thisMonth + burrows, free: mode === 'track' ? P.free : P.wallet, billsLeft: P.bills, saved: burrows } };
}
const APP = null;   /* step B: (mode, events, start) => the app's places, in the same shape as placesOf */

for (let t = 0; t < N; t++) {
  const mode = rnd() < .5 ? 'wallet' : 'track';
  const start = { chest: ri(0, 1) ? 0 : ri(0, 50000) }; BURROWS.forEach(b => { start[b] = ri(0, 3) ? ri(0, 200000) : 0; });
  const ev = [], n = ri(0, 40), placeTo = ['bills', 'free'].concat(BURROWS);
  for (let k = 0; k < n; k++) {
    const r = rnd(), a = ri(1, 300000);
    if (r < .2) ev.push({ t: 'pay', a });
    else if (r < .5) ev.push({ t: 'place', a, to: pick(placeTo) });
    else if (r < .75) ev.push({ t: 'spend', a, from: mode === 'track' ? pick(['bills', 'free']) : 'bills' });
    else if (r < .85) ev.push({ t: 'takeout', a, from: pick(BURROWS) });
    else { const from = pick(placeTo.concat(['chest'])), to = pick(placeTo.filter(x => x !== from && !(mode === 'wallet' && x === 'free'))); if (!(mode === 'wallet' && from === 'free')) ev.push({ t: 'move', a, from, to }); }
  }
  const { P, came, left } = ledgerRun(mode, ev, start), pl = placesOf(mode, P), tag = '#' + t + ' ' + mode;
  /* 1. the identity, from both sides */
  eq(tag + ' Total = start + pay - left', pl.total, came - left);
  /* 2. no coin counted twice: every tracked coin is in exactly one of Chest, This month, Burrows */
  const tracked = Object.keys(P).filter(k => k !== 'wallet' && !(mode === 'wallet' && k === 'free')).reduce((a, k) => a + P[k], 0);
  eq(tag + ' each coin in one place', pl.chest + pl.thisMonth + pl.burrows, tracked);
  /* 3. Free to spend is inside This month in Track mode and outside Total in Wallet mode */
  if (mode === 'track') eq(tag + ' This month includes Free to spend', pl.thisMonth, P.bills + P.free);
  else { eq(tag + ' wallet money is outside Total', pl.total, tracked); eq(tag + ' nothing is tracked under Free to spend in Wallet mode', P.free, 0); }
  /* 4. the four numbers are views, not parts: adding all four would count Free to spend (Track) or Bills twice */
  eq(tag + ' Total = Chest + Bills left + Free to spend (Track only) + Saved', pl.four.total, pl.chest + pl.four.billsLeft + (mode === 'track' ? pl.four.free : 0) + pl.four.saved);
  /* 5. nothing negative */
  checks++; if (Object.values(P).some(v => v < 0)) fail(tag + ' a place went below zero');
  if (APP) { const a = APP(mode, ev, start); ['chest', 'thisMonth', 'burrows', 'total'].forEach(k => eq(tag + ' app ' + k, a[k], pl[k])); }
}
/* the double count Mako found (HANDOFF.md before 2026-11-18): adding Free to spend again on top of This month must not equal Total */
{ const P = { chest: 0, bills: 4000000, free: 1800000, wallet: 0 }; BURROWS.forEach(b => { P[b] = 1000000; }); const pl = placesOf('track', P);
  checks++; if (pl.chest + pl.thisMonth + P.free + pl.burrows === pl.total) fail('the old formula (Chest + This month + Free to spend + Burrows) would count Free to spend twice and still pass'); }
console.log('event lists', N, '| checks', checks, '| app ledger', APP ? 'checked' : 'not built yet (step B)');
console.log(fails ? 'PROOF FORMULA FAIL ' + fails : 'PROOF FORMULA PASS');
process.exit(fails ? 1 : 0);
