/* QC round 12 numbers gate B2: Edit goal with saved 100.50 and target 4951.20 stored 101 and 4951, so the goal card and Home's total were off
   by cents. Goal amounts keep what was typed, the same as the bank and receipts; yen stays whole. Made-up numbers.
   Run: node tests/qc/qc32_goal_cents.js */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../model.js'), 'utf8');
const M = new Function(src + ';return {presetState,updateGoal,addGoal,calcAll,MONTHS};')();
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw)); } };
const S = M.presetState('$'); S.ui.done = { pay: true, bills: true, goals: true, receipts: true };
let g = S.plan.goals.find(x => !x.emergency); if (!g) { const id = M.addGoal(S, 'Trip'); g = S.plan.goals.find(x => x.id === id); }
M.updateGoal(S, g.id, { start: '100.50', target: '4951.20' });
ck('saved so far keeps cents (100.50)', g.start === 100.5, g.start);
ck('target keeps cents (4951.20)', g.target === 4951.2, g.target);
M.updateGoal(S, g.id, { start: 0.005 + 10.004 });
ck('a third decimal is rounded to the cent', g.start === 10.01, g.start);
const C = M.calcAll(S); ck('the plan still works it out (start is in the balance)', Math.abs(C.byYm[M.MONTHS[0]].bal[g.id] * 100 - Math.round(C.byYm[M.MONTHS[0]].bal[g.id] * 100)) < 1e-6, C.byYm[M.MONTHS[0]].bal[g.id]);
const Y = M.presetState('¥'); const gy = Y.plan.goals[0]; M.updateGoal(Y, gy.id, { start: '100.5', target: '4951.2' });
ck('yen stays whole', Number.isInteger(gy.start) && Number.isInteger(gy.target), [gy.start, gy.target]);
console.log(bad ? `qc32_goal_cents: ${bad} FAIL` : 'qc32_goal_cents: ALL PASS'); process.exit(bad ? 1 : 0);
