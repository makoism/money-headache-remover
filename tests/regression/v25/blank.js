const vm = require('vm'), fs = require('fs');
const { M, randomState } = require('/tmp/v25/oracle.js');
const ctx = vm.createContext({ console, Math, JSON, Date });
vm.runInContext(fs.readFileSync('/home/claude/work/team/model.js', 'utf8') + '\n;this.__B={blankState};', ctx);
let bad = 0, n = 0;
for (let i = 0; i < 400; i++) {
  const S = randomState(), B = ctx.__B.blankState(S), C = M.calcAll(B);
  C.months.forEach(m => { n++; const all = [m.a, m.b, m.side, m.draw, m.inflow, m.out, m.left, m.bankStart, m.bankEnd, m.goalsTotal, m.itemsTotal, m.jar.nec, m.jar.play, m.jar.edu, m.jar.ffa, m.jar.give];
    if (all.some(x => x !== 0)) { bad++; if (bad < 5) console.log('non-zero in blank', i, m.ym, JSON.stringify(all)); } });
  B.plan.goals.forEach(g => { const gi = M.goalInfo(B, C, g.id, M.START); if (gi.state !== 'unset') { bad++; if (bad < 5) console.log('goal not unset', gi.state); } });
}
console.log(n + ' blank-month checks, ' + bad + ' failures');
