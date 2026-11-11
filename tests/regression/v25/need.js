const { M, randomState, rnd, pick } = require('/tmp/v25/oracle.js');
let n = 0, bad = 0;
for (let t = 0; t < 4000; t++) {
  const S = randomState(), C = M.calcAll(S);
  S.plan.goals.forEach(g => {
    if (!g.due || g.emergency || !(g.target > 0)) return;
    const ym = pick(M.MONTHS.slice(0, 10)); const gi = M.goalInfo(S, C, g.id, ym);
    if (gi.state !== 'behind' || gi.need == null) return;
    const S2 = JSON.parse(JSON.stringify(S)), key = 'goal:' + g.id;
    if (S2.steps[key]) S2.steps[key] = S2.steps[key].filter(s => s.from < ym);
    Object.keys(S2.once).forEach(k => { if (k >= ym && S2.once[k][key] !== undefined) delete S2.once[k][key]; });
    M.setVal(S2, key, ym, gi.need, 'after'); n++;
    const C2 = M.calcAll(S2), gi2 = M.goalInfo(S2, C2, g.id, ym);
    if (!(gi2.state === 'ontrack' || gi2.state === 'full')) { bad++; if (bad < 8) console.log('need did not get the goal on track', ym, g.due, JSON.stringify({ need: gi.need, state2: gi2.state, reached: gi2.reached, rb: gi2.readyBy })); }
  });
}
console.log(n + ' behind goals given their "needed" amount, ' + bad + ' still not on track');
