const { M, randomState, rnd, pick, ri } = require('/tmp/v25/oracle.js');
let n = 0, bad = 0, offered = 0; const fail = m => { bad++; if (bad < 12) console.log('FAIL', m); };
for (let t = 0; t < 3000; t++) {
  const S0 = randomState(), C0 = M.calcAll(S0);
  for (const ym of [M.MONTHS[0], M.MONTHS[7], M.MONTHS[20]]) {
    const m0 = C0.byYm[ym]; if (M.statusOf(S0, m0) !== 'short') continue;
    const fx = M.fixes(S0, m0); const floor = M.cfg(S0, 'minBank'), gap = Math.max(0, floor - m0.bankEnd);
    fx.forEach(f => {
      offered++; n++;
      const S = JSON.parse(JSON.stringify(S0)), C = M.calcAll(S), m = C.byYm[ym];
      if (f.id === 'trim') { M.trimPlay(S, m, ym, f.amount); const m2 = M.calcAll(S).byYm[ym]; if (m2.jar.play !== f.amount) fail('trim: play is ' + m2.jar.play + ' not ' + f.amount); if (m2.bankEnd < floor) fail('trim did not fix the month ' + ym + ' bankEnd ' + m2.bankEnd + ' floor ' + floor); if (m2.jar.play > m.jar.play) fail('trim raised play'); }
      else { M.setVal(S, 'draw', ym, m.draw + f.amount, 'once'); const C2 = M.calcAll(S), m2 = C2.byYm[ym], eg = M.emergencyGoal(S);
        if (m2.draw !== m.draw + f.amount) fail('borrow: draw is ' + m2.draw + ' not ' + (m.draw + f.amount));
        if (m2.bankEnd < floor && m2.draw < m.draw + f.amount) fail('borrow was cut short');
        if (m2.bankEnd < floor && f.amount !== Math.max(0, m.balBefore[eg.id] - m.draw)) fail('borrow left month short although the fund had more: end ' + m2.bankEnd + ' floor ' + floor + ' amount ' + f.amount + ' room ' + (m.balBefore[eg.id] - m.draw));
        if (C2.byYm[ym].bal[eg.id] < 0) fail('fund went negative'); }
    });
  }
}
console.log(n + ' offered fixes applied, ' + bad + ' failures');
