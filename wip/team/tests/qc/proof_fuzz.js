/* The proof, on thousands of random plans: for every month, where the money sits (bank + goals + piles) equals where it came from
   (start + pay - everything that left), to the cent. Random pay, bills, goals with dates, an emergency fund with borrowing, one-time costs,
   cards and loans, receipts in every category with cents, months spent past plan, and month-end answers (kept in the bank, put toward a goal).
   Run: node tests/qc/proof_fuzz.js [count] [seed]     Ends with "PROOF PASS" or "PROOF FAIL n". Needs nothing but model.js. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.MODEL || path.join(__dirname, '..', '..', 'model.js'), 'utf8');
const M = new Function(src + '; return { MONTHS, presetState, calcAll, viewOf, proofOf, setVal, addLine, addGoal, updateGoal, updateLine, setCurYm, cfg, LINE_JARS, lineByKey };')();
let seed = +(process.argv[3] || 21); const N = +(process.argv[2] || 1500);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[ri(0, a.length - 1)], chance = p => rnd() < p;
let checks = 0, fails = 0; const bad = (id, msg) => { fails++; if (fails <= 30) console.log('FAIL', id, msg); };

function plan() {
  const cur = pick(['¥', '₱', '€', '$', '¥', '₱']), S = M.presetState(cur, false), MO = M.MONTHS;
  const pay = ri(500, 400000), money = () => pick([0, ri(0, 200), ri(0, Math.round(pay / 4)), ri(0, pay)]);
  M.setVal(S, 'a', MO[0], pay, 'after');
  if (chance(.3)) M.setVal(S, 'side', pick(MO), money(), pick(['after', 'once']));
  if (chance(.5)) { const n = ri(1, 3); for (let i = 0; i < n; i++) M.addLine(S, pick(M.LINE_JARS), 'x' + i, money()); }
  S.plan.lines.forEach(l => { if (chance(.6)) M.setVal(S, l.key, pick(MO), money(), pick(['after', 'once'])); if (chance(.15)) M.updateLine(S, l.id, { ends: pick(MO), redirect: chance(.5) }); });
  if (chance(.5)) { const n = ri(1, 2); for (let i = 0; i < n; i++) { const id = M.addGoal(S, 'g' + i); if (id) M.updateGoal(S, id, { target: money() * 3, start: money(), due: chance(.5) ? pick(MO) + '-' + pick(['01', '15', '16', '28']) : '' }); } }
  S.plan.goals.forEach(g => { if (chance(.4)) M.updateGoal(S, g.id, { target: money() * 4, start: money() }); if (g.emergency) { if (chance(.5)) g.stretch = money() * 6; if (chance(.4)) g.stretchOn = true; } if (chance(.4)) M.setVal(S, 'goal:' + g.id, pick(MO), money(), pick(['after', 'once'])); });
  if (chance(.4)) M.setVal(S, 'draw', pick(MO.slice(0, 8)), money(), 'once');
  if (chance(.4)) { const ym = pick(MO.slice(0, 8)); S.items[ym] = [{ id: 'i1', label: 'x', amount: money() }]; }
  if (chance(.3)) { S.plan.debts = [{ id: 'd0', name: 'card', kind: 'card', balance: money() * 5, apr: pick([0, 12, 24]), min: money(), extra: pick([0, money()]) }]; }
  if (chance(.5)) S.cfg.bankStart = money() * 3; if (chance(.3)) S.cfg.minBank = money();
  /* receipts over the first months: every category, cents outside yen, sometimes far past the plan */
  const upTo = ri(0, 9), keys = S.plan.lines.map(l => l.key).concat(['other', 'other']);
  S.receipts = []; const nR = pick([0, 0, 3, 12, 40]);
  for (let i = 0; i < nR; i++) { const ym = MO[ri(0, upTo)], a = cur === '¥' ? pick([1, 120, 980, ri(1, pay)]) : pick([0.01, 0.5, 19.99, ri(1, pay * 100) / 100]); S.receipts.push({ id: 'r' + i, d: ym + '-' + ('0' + ri(1, 28)).slice(-2), a: chance(.1) ? a * 5 : a, c: pick(keys), n: '' }); }
  /* "today" and month-end answers for past months */
  const curIdx = ri(0, 11); S.ui = Object.assign(S.ui || {}, { done: { pay: true, bills: true, goals: true, receipts: true } });
  if (chance(.15)) S.ui.done.goals = false;
  S.ui.sweep = {};
  for (let i = 0; i < curIdx; i++) { const r = rnd(); if (r < .3) S.ui.sweep[MO[i]] = { amt: pick([1, 300, money() + 1]), to: 'bank' }; else if (r < .55 && S.plan.goals.length) S.ui.sweep[MO[i]] = { amt: pick([1, 300, money() + 1, 1e7]), id: pick(S.plan.goals).id }; else if (r < .65) S.ui.sweep[MO[i]] = { hide: true }; }
  return { S, cur: MO[curIdx] };
}
for (let t = 0; t < N; t++) {
  const { S, cur } = plan(); M.setCurYm(() => cur);
  let C; try { C = M.calcAll(S); } catch (e) { bad('#' + t, 'calcAll threw ' + e.message); continue; }
  M.MONTHS.forEach((ym, i) => {
    if (i > 13 && i % 5) return;
    let P; try { P = M.proofOf(S, C, ym); } catch (e) { bad('#' + t + ' ' + ym, 'proofOf threw ' + e.message); return; }
    checks++; if (!P.ok) bad('#' + t + ' ' + S.ui.cur + ' ' + ym + ' (today ' + cur + ')', `sits ${P.sits} but came to ${P.came}: off by ${P.off}${P.partsOk ? '' : ' (bank + goals + piles is not the total)'}`);
    checks++; if (!(isFinite(P.sits) && isFinite(P.came))) bad('#' + t + ' ' + ym, 'not a number');
  });
}
M.setCurYm(null);
console.log(`plans ${N} | months proved ${checks / 2} | failures ${fails}`);
console.log(fails ? 'PROOF FAIL ' + fails : 'PROOF PASS');
process.exit(fails ? 1 : 0);
