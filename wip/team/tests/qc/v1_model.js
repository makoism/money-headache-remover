/* LAUNCH_CHECKLIST.md v1 points checked on the model alone (no browser). Made-up numbers.
   A3  Money put toward a "Pay off a debt" goal is not savings: it stays out of Saved and Total, and the proof still adds up.
       The debt goal still shows what is paid off and what is still owed.
   A4  What is owed, in one figure: cards and loans still owed at the end of the month, plus what every debt goal still has to pay.
   Run: node tests/qc/v1_model.js        Ends with "V1 MODEL PASS" or "V1 MODEL FAIL n". */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.MODEL || path.join(__dirname, '..', '..', 'model.js'), 'utf8');
const M = new Function(src + `; return { MONTHS, presetState, calcAll, viewOf, proofOf, addGoal, updateGoal, round2, kindOfGoal }; `)();
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };

function plan(withDebtGoal, withCard) {
  const S = M.presetState('$', false);
  S.ui = S.ui || {}; S.ui.gk = S.ui.gk || {};
  const t = M.addGoal(S, 'Trip'); M.updateGoal(S, t, { target: 2000, start: 300 }); S.steps['goal:' + t] = [{ from: M.MONTHS[0], v: 100 }];
  if (withDebtGoal) {
    const id = M.addGoal(S, 'Car loan'); M.updateGoal(S, id, { target: 4000, start: 600 }); S.ui.gk[id] = 'debt';
    S.steps['goal:' + id] = [{ from: M.MONTHS[0], v: 250 }];
  }
  if (withCard) S.plan.debts = [{ id: 'd1', name: 'Card', kind: 'card', balance: 1800, apr: 18, min: 60, extra: 0 }];
  return S;
}
const ym = M.MONTHS[3];
const with0 = plan(false, false), withD = plan(true, false);
const C0 = M.calcAll(with0), CD = M.calcAll(withD);
const V0 = M.viewOf(with0, C0, ym), VD = M.viewOf(withD, CD, ym);
const dg = withD.plan.goals.find(g => g.name === 'Car loan');
ck('the debt goal is kind debt', dg && M.kindOfGoal(withD, dg) === 'debt');
const paid = M.round2(CD.byYm[ym].bal[dg.id]);
ck('the debt goal has money put toward it (' + paid + ')', paid > 600);
/* every other goal is the same in both plans, so Saved must be the same: the debt goal adds nothing to savings */
const otherSaved = M.round2(Object.keys(CD.byYm[ym].bal).filter(id => id !== dg.id).reduce((a, id) => a + CD.byYm[ym].bal[id], 0));
ck('A3 Saved leaves the debt goal out (goals saved ' + VD.map.goalsSaved + ', other goals ' + otherSaved + ')', Math.abs(VD.map.goalsSaved - otherSaved) < 0.005, VD.map.goalsSaved + ' vs ' + otherSaved);
ck('A3 Total = bank + burrows without the debt goal (' + VD.map.total + ')', Math.abs(VD.map.total - M.round2(VD.map.bankEnd + VD.map.saved)) < 0.005 && Math.abs(VD.map.saved - M.round2(otherSaved + VD.map.burrows.reduce((a, r) => a + r.amount, 0))) < 0.005);
ck('A3 the debt goal is marked as a debt for the picture (it is drawn as paid away, not as a pile)', VD.map.goalParts.some(g => g.id === dg.id && g.debt === true) && VD.map.goalParts.every(g => g.id === dg.id || g.debt === false), JSON.stringify(VD.map.goalParts));
ck('A3 the This month "Saved" total leaves it out too', Math.abs(VD.buckets.find(b => b.id === 'lts').total - otherSaved) < 0.005, VD.buckets.find(b => b.id === 'lts').total);
const pr = M.proofOf(withD, CD, ym);
ck('A3 the proof still adds up with a debt goal (off ' + pr.off + ')', pr.ok, JSON.stringify(pr));
const row = VD.goals.find(r => r.id === dg.id);
ck('A3 the debt goal row still says what is paid off (' + row.saved + ') and still owed (' + row.togo + ')', Math.abs(row.saved - paid) < 0.005 && Math.abs(row.togo - M.round2(4000 - paid)) < 0.005);
/* A4: owed */
ck('A4 nothing owed in a plan with no cards, loans or debt goals', V0.map.owed === 0, V0.map.owed);
ck('A4 owed counts what the debt goal still has to pay (' + VD.map.owed + ')', Math.abs(VD.map.owed - M.round2(4000 - paid)) < 0.005, VD.map.owed);
const withC = plan(false, true), CC = M.calcAll(withC), VC = M.viewOf(withC, CC, ym);
const cardLeft = CC.byYm[ym].debts.d1.bal;
ck('A4 owed counts the card still owed at the end of the month (' + VC.map.owed + ' = ' + cardLeft + ')', Math.abs(VC.map.owed - cardLeft) < 0.005 && cardLeft > 0, VC.map.owed + ' vs ' + cardLeft);
const both = plan(true, true), CB = M.calcAll(both), VB = M.viewOf(both, CB, ym);
ck('A4 owed adds cards and debt goals', Math.abs(VB.map.owed - M.round2(CB.byYm[ym].debts.d1.bal + VB.goals.find(r => r.kind === 'debt').togo)) < 0.005, VB.map.owed);
ck('A3 the proof adds up with a card and a debt goal', M.proofOf(both, CB, ym).ok);
console.log(bad ? 'V1 MODEL FAIL ' + bad : 'V1 MODEL PASS'); process.exit(bad ? 1 : 0);
