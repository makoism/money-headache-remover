const { M, oracle, oracleGoal } = require('/tmp/v25/oracle.js');
for (const cur of ['₱','¥','€']) {
  const S = M.presetState(cur), C = M.calcAll(S), O = oracle(S);
  console.log(cur, 'pay', C.byYm[M.START].a, 'bank', M.cfg(S,'bankStart'), 'min', M.cfg(S,'minBank'), 'ceiling', M.cfg(S,'ceiling'));
  S.plan.goals.forEach(g => { const gi = M.goalInfo(S, C, g.id, M.START), go = oracleGoal(S, O, g.id, M.START); console.log('  ', g.id.padEnd(7), 'target', g.target, 'start', g.start, 'due', g.due || '-', 'monthly', C.byYm[M.START].g[g.id].planned, '->', gi.state, 'full in', gi.reached, '| independent', go.state, go.reached); });
  const worst = C.months.reduce((a, m) => Math.min(a, m.bankEnd), 1e12), neg = C.months.filter(m => m.left < 0).length, stat = {}; C.months.forEach(m => { const s = M.statusOf(S, m); stat[s] = (stat[s] || 0) + 1; });
  console.log('   lowest bank', worst, 'months with negative left over', neg, 'status', JSON.stringify(stat), 'left over by month', C.months.map(m => m.left).filter((x, i) => i % 4 === 0).join(','));
}
