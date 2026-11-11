const { M, randomState } = require('/tmp/v25/oracle.js');
let shown = 0;
for (let t = 0; t < 3000 && shown < 3; t++) {
  const S0 = randomState(), C0 = M.calcAll(S0);
  for (const ym of [M.MONTHS[0], M.MONTHS[7], M.MONTHS[20]]) {
    const m0 = C0.byYm[ym]; if (M.statusOf(S0, m0) !== 'short') continue;
    const f = M.fixes(S0, m0).find(x => x.id === 'borrow'); if (!f) continue;
    const S = JSON.parse(JSON.stringify(S0)), m = M.calcAll(S).byYm[ym], eg = M.emergencyGoal(S), floor = M.cfg(S, 'minBank');
    M.setVal(S, 'draw', ym, m.draw + f.amount, 'once'); const m2 = M.calcAll(S).byYm[ym];
    if (m2.bankEnd >= floor || f.amount === Math.max(0, m.balBefore[eg.id] - m.draw)) continue;
    shown++;
    console.log(ym, 'floor', floor, 'bankEnd before', m.bankEnd, 'after', m2.bankEnd, 'borrow', f.amount, 'draw before', m.draw, 'after', m2.draw);
    console.log('  eg before:', JSON.stringify({ bal: m.balBefore[eg.id], planned: m.g[eg.id].planned, actual: m.g[eg.id].actual, cap: Math.max(eg.stretch || 0, eg.target) }), 'after:', JSON.stringify({ planned: m2.g[eg.id].planned, actual: m2.g[eg.id].actual }));
    console.log('  other goals total actual before/after', M.calcAll(S0).byYm[ym].goalsTotal - m.g[eg.id].actual, m2.goalsTotal - m2.g[eg.id].actual, '| inflow before/after', m.inflow, m2.inflow, 'out before/after', m.out, m2.out);
  }
}
