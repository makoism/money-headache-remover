/* Found by the oracle (2026-11-21): goal balances were added as floats and never rounded to the cent. Saving 10.74, 64.21 and 25.05 toward
   a 100.00 goal left 99.99999999999999, so the goal was never full. Every goal balance is a whole number of cents. Made-up numbers in euros.
   Run: node tests/qc/qc10_cents_goal.js */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../model.js'), 'utf8');
const M = new Function(src + ';return {presetState,calcAll,MONTHS,setVal,goalInfo,addGoal};')();
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw)); } };
const [NOV, DEC, JAN] = M.MONTHS;
const S = M.presetState('€'); S.ui.done = { pay: true, bills: true, goals: true, receipts: true };
let g = S.plan.goals.find(x => !x.emergency); if (!g) { const id = M.addGoal(S, 'Trip'); g = S.plan.goals.find(x => x.id === id); }
g.target = 100; g.start = 0; g.monthly = 0; g.due = '';
[[NOV, 10.74], [DEC, 64.21], [JAN, 25.05]].forEach(([ym, v]) => M.setVal(S, 'goal:' + g.id, ym, v, 'once'));
const C = M.calcAll(S), b = C.byYm[JAN].bal[g.id], gi = M.goalInfo(S, C, g.id, JAN);
ck('three savings add to exactly 100.00', b === 100, b);
ck('every goal balance is a whole number of cents', M.MONTHS.slice(0, 6).every(ym => Object.values(C.byYm[ym].bal).every(v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9)), C.byYm[JAN].bal);
ck('the goal is full in Jan', gi.state === 'full' || C.reached[g.id] === JAN, { state: gi.state, reached: C.reached[g.id] });
console.log(bad ? `qc10_cents_goal: ${bad} FAIL` : 'qc10_cents_goal: ALL PASS'); process.exit(bad ? 1 : 0);
