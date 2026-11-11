const { M, randomState, rnd, pick, ri } = require('/tmp/v25/oracle.js');
let n = 0, bad = 0;
for (let t = 0; t < 6000; t++) {
  const S = M.presetState(pick(['₱', '¥', '€', '$']));
  const g = S.plan.goals.find(x => !x.emergency); g.target = ri(1, 3e6); g.start = rnd() < .3 ? ri(0, g.target * 1.2) : 0;
  const ym = pick(M.MONTHS), d = pick([1, 9, 15, 16, 20, 28]); g.due = ym + '-' + String(d).padStart(2, '0');
  const pay = ri(500, 900000); M.setVal(S, 'a', M.START, pay, 'after');
  delete S.steps['goal:' + g.id];
  const C = M.calcAll(S), gi = M.goalInfo(S, C, g.id, M.START); n++;
  const rb = M.goalInfo(S, C, g.id, M.START).readyBy;
  if (rb >= M.START && g.target > g.start && !(gi.state === 'ontrack' || gi.state === 'full' || gi.state === 'paid')) { bad++; if (bad < 8) console.log('default amount did not get a dated goal on time', g.due, g.target, g.start, gi.state, gi.reached, rb); }
  if (g.target <= g.start && !(gi.state === 'full' || gi.state === 'paid' || gi.state === 'short')) { bad++; if (bad < 8) console.log('already-funded goal state', gi.state, g.due); }
}
console.log(n + ' dated goals with only the default monthly amount, ' + bad + ' not on time');
