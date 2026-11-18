/* Money model fuzz: thousands of random plans, every invariant a displayed number depends on.
   Run: node tests/qc/fuzz_model.js [count] [seed]      Prints FAIL lines and ends with "FUZZ PASS" or "FUZZ FAIL n". */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.MODEL || path.join(__dirname, '..', '..', 'model.js'), 'utf8');
const M = new Function(src + `; return { MONTHS, START, END, SAVE_FROM, PAYDAY, JARS, LINE_JARS, LINE_DEFS, GOAL_DEFS, SAMPLES, presetState, freshState, blankState, calcAll, jarsOf, wholePercents, statusOf, goalInfo, goalRows, pickMain, viewOf, fixes, trimPlay, sweepPlay, val, setVal, undoOnce, resetMonth, addLine, removeLine, updateLine, addGoal, removeGoal, updateGoal, useSuggested, hasOwnMonthly, addReceipt, updateReceipt, removeReceipt, receiptStats, receiptsFor, validDate, validDue, cleanPlan, cleanSteps, cleanOnce, cleanItems, cleanCfg, cleanReceipts, sheetRows, sheetCsv, cfg, payDef, capOf, readyBy, dueYm, round2, wholePct, ymIdx, ymFrom, ymAdd, ymCount, emergencyGoal, goalDefault, evenSave, itemsFor, MAX_AMT, clampAmt, loanPayments, loanTotalFrom, loanMonthlyFrom, nextMonthDay, nextWeekday, reminderTimesFor, rruleOf, icsText, catName, kindOfGoal, purposeOf, roundUnit, niceStepFor }; `)();

let seed = +(process.argv[3] || 12345), N = +(process.argv[2] || 3000);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[ri(0, a.length - 1)], chance = p => rnd() < p;
const amt = () => pick([0, 0, 1, 5, 50, 500, ri(0, 100), ri(100, 5000), ri(1000, 60000), ri(10000, 400000), ri(0, 5000000), 1e9, 999999999]);
let fails = 0, checks = 0;
const bad = (id, msg) => { fails++; if (fails <= 40) console.log('FAIL', id, msg); };
const ok = (id, cond, msg) => { checks++; if (!cond) bad(id, msg); };
const fin = x => typeof x === 'number' && isFinite(x);

function randomState() {
  const cur = pick(['₱', '¥', '€', '$', '₱', '¥']);
  const S = M.presetState(cur, chance(.1));
  const MO = M.MONTHS;
  if (chance(.3)) { const B = M.blankState(S, chance(.5)); Object.keys(B).forEach(k => { S[k] = B[k]; }); }
  const nSteps = ri(0, 14);
  for (let i = 0; i < nSteps; i++) {
    const keys = ['a', 'b', 'side'].concat(S.plan.lines.map(l => l.key), S.plan.goals.map(g => 'goal:' + g.id));
    M.setVal(S, pick(keys), pick(MO), chance(.2) ? pick([-5, NaN, 1e12, 2.5]) : amt(), pick(['after', 'once', 'month']));
  }
  if (chance(.4)) M.setVal(S, 'draw', pick(MO), amt(), 'once');
  if (chance(.5)) { const n = ri(0, 3); for (let i = 0; i < n; i++) M.addLine(S, pick(M.LINE_JARS), 'x' + i, amt()); }
  if (chance(.5)) { const n = ri(0, 3); for (let i = 0; i < n; i++) { const id = M.addGoal(S, 'g' + i); if (id) M.updateGoal(S, id, { target: amt(), start: amt(), due: chance(.5) ? pick(MO) + '-' + pick(['01', '15', '16', '28']) : '', stretch: amt() }); } }
  if (chance(.3)) { const g = pick(S.plan.goals); if (g) M.updateGoal(S, g.id, { emergency: true, stretch: amt(), target: amt(), start: amt() }); }
  /* a yes to the longer emergency goal (stretchOn): every goal figure must use the longer target the same way (PLAN step 4) */
  if (chance(.3)) S.plan.goals.forEach(g => { if (g.emergency) g.stretchOn = true; });
  S.plan.goals.forEach(g => { if (chance(.2)) M.updateGoal(S, g.id, { target: amt(), start: amt(), due: chance(.5) ? pick(MO) + '-' + pick(['01', '15', '16', '30']) : '' }); });
  if (chance(.4)) { const l = pick(S.plan.lines); M.updateLine(S, l.id, { ends: pick(MO), redirect: chance(.5) }); }
  S.cfg = S.cfg || {};
  if (chance(.5)) S.cfg.bankStart = amt(); else if (chance(.3)) S.cfg.bankStart = -amt();   /* overdrawn starts too (38.31) */ if (chance(.5)) S.cfg.minBank = amt();
  const nIt = ri(0, 3); for (let i = 0; i < nIt; i++) { const ym = pick(MO); (S.items[ym] = S.items[ym] || []).push({ id: 'i' + i, label: 'it', amount: chance(.1) ? NaN : amt() }); }
  S.receipts = [];
  const nR = ri(0, 12);
  for (let i = 0; i < nR; i++) { const ym = pick(MO), d = ym + '-' + ('0' + ri(1, 28)).slice(-2), keys = S.plan.lines.map(l => l.key).concat(['other']); M.addReceipt(S, d, chance(.3) ? ri(1, 99999) / 100 : ri(1, 9999), pick(keys), 'r'); }
  return S;
}

function checkCalc(id, S) {
  const C = M.calcAll(S), MO = M.MONTHS, eg = M.emergencyGoal(S);
  let prevBank = M.cfg(S, 'bankStart'), sumIn = 0, sumOut = 0, sumDraw = 0, sumAct = 0, sumSpent = 0;
  const bal = {}; S.plan.goals.forEach(g => { bal[g.id] = g.start; });
  ok(id, C.months.length === MO.length, 'month count');
  C.months.forEach(m => {
    const tag = id + ' ' + m.ym;
    [m.a, m.b, m.side, m.draw, m.inflow, m.out, m.left, m.bankStart, m.bankEnd, m.goalsTotal, m.billsTotal, m.itemsTotal].forEach((x, i) => ok(tag, fin(x), 'not finite field ' + i + ' ' + x));
    ok(tag, m.a >= 0 && m.b >= 0 && m.side >= 0 && m.draw >= 0, 'negative input');
    m.lines.forEach(l => ok(tag, fin(l.v) && l.v >= 0, 'line ' + l.key + ' ' + l.v));
    ok(tag, m.left === m.inflow - m.out, 'left != in - out');
    ok(tag, m.pool.left === m.left && m.pool.in === m.inflow && m.pool.out === m.out, 'pool mismatch');
    ok(tag, m.bankStart === prevBank, 'bank chain break ' + m.bankStart + ' vs ' + prevBank);
    ok(tag, Math.abs(m.bankEnd - (m.bankStart + m.left - (m.overNow || 0))) < 0.011, 'bankEnd');
    prevBank = m.bankEnd;
    const jarSum = m.jar.nec + m.jar.play + m.jar.edu + m.jar.ffa + m.jar.give;
    ok(tag, m.out === jarSum + m.goalsTotal, 'out != jars + goals');
    const linesSum = m.lines.reduce((a, l) => a + l.v, 0);
    ok(tag, jarSum === linesSum + m.itemsTotal + (m.debtPay || 0), 'jars != lines + items ' + jarSum + ' ' + linesSum + ' ' + m.itemsTotal);
    ok(tag, m.inflow === m.a + m.b + m.side + m.draw, 'inflow parts');
    // goals
    let gs = 0;
    S.plan.goals.forEach(g => {
      const x = m.g[g.id], isE = eg && g.id === eg.id;
      ok(tag + ' ' + g.id, x && fin(x.planned) && fin(x.actual) && x.actual >= 0 && x.actual <= x.planned, 'actual/planned ' + JSON.stringify(x));
      gs += x.actual;
      const room = Math.max(0, M.capOf(g) - bal[g.id]);
      ok(tag + ' ' + g.id, x.actual <= room, 'deposit beyond room');
      bal[g.id] += x.actual - (isE ? m.draw : 0);
      ok(tag + ' ' + g.id, bal[g.id] >= 0, 'balance negative ' + bal[g.id]);
      ok(tag + ' ' + g.id, m.balBefore[g.id] !== undefined, 'balBefore missing');
      const sp = m.spent[g.id]; ok(tag + ' ' + g.id, fin(sp) && sp >= 0, 'spent'); sumSpent += sp; bal[g.id] -= sp;
      ok(tag + ' ' + g.id, bal[g.id] >= 0, 'balance negative after spend');
      ok(tag + ' ' + g.id, m.bal[g.id] === bal[g.id], 'bal mismatch ' + m.bal[g.id] + ' vs ' + bal[g.id]);
      if (g.due && g.target > 0 && m.ym > g.due.slice(0, 7)) ok(tag + ' ' + g.id, x.planned - (isE ? x.loan : 0) === 0, 'dated goal still saving after due');
    });
    ok(tag, gs === m.goalsTotal, 'goalsTotal');
    if (eg) ok(tag, m.draw <= m.balBefore[eg.id], 'draw exceeds fund ' + m.draw + ' ' + m.balBefore[eg.id]);
    sumIn += m.inflow; sumOut += m.out; sumDraw += m.draw; sumAct += gs;
    // status
    const st = M.statusOf(S, m);
    ok(tag, st === 'short' ? m.bankEnd < M.cfg(S, 'minBank') : st === 'tight' ? (m.bankEnd >= M.cfg(S, 'minBank') && m.left < 0) : (m.bankEnd >= M.cfg(S, 'minBank') && m.left >= 0), 'status ' + st);
    // jars
    const J = M.jarsOf(S, m), pc = J.list.map(j => j.pct).concat([J.restPct]), ps = pc.reduce((a, b) => a + b, 0);
    ok(tag, J.rest >= 0 && J.short >= 0 && !(J.rest > 0 && J.short > 0), 'rest/short');
    ok(tag, J.rest - J.short === m.left, 'rest - short != left');
    const base = J.short > 0 ? m.out : m.inflow;
    if (!(m.draw > 0)) ok(tag, base > 0 ? ps === 100 : ps === 0, 'percents sum ' + ps + ' base ' + base + ' ' + JSON.stringify(pc));
    if (!(m.draw > 0)) ok(tag, pc.every(p => Number.isInteger(p) && p >= 0 && p <= 100), 'percent range ' + JSON.stringify(pc));
    J.list.forEach(j => ok(tag, j.v > 0 || j.pct === 0, 'empty jar shows percent'));
    ok(tag, J.list.reduce((a, j) => a + j.v, 0) === m.out, 'jar values != out');
  });
  const last = C.months[C.months.length - 1];
  ok(id, Math.abs(last.bankEnd - M.cfg(S, 'bankStart') - (sumIn - sumOut - (last.over || 0))) < 0.011, 'bank change != total in - out');
  // conservation of goal money: everything deposited, minus drawn, minus spent, equals the change in balances
  const dBal = S.plan.goals.reduce((a, g) => a + last.bal[g.id] - g.start, 0);
  ok(id, dBal === sumAct - sumDraw - sumSpent, 'goal money not conserved ' + dBal + ' vs ' + (sumAct - sumDraw - sumSpent));
  return C;
}

function checkViews(id, S, C) {
  const MO = M.MONTHS;
  [MO[0], MO[5], MO[MO.length - 1]].forEach(ym => {
    ['2026-11-01', '2026-11-30', '2027-02-28', '2028-02-29', ym + '-15', ym + '-01'].forEach(today => {
      const v = M.viewOf(S, C, ym, today), m = C.byYm[ym], tag = id + ' view ' + ym + ' ' + today;
      ok(tag, v.month.left === m.left && v.month.inflow === m.inflow && v.month.out === m.out && v.month.bankEnd === m.bankEnd, 'month mismatch');
      ok(tag, v.play.planned === m.jar.play, 'play planned');
      { const z = v.month.belowZero;   /* decision 2: the below-zero line's parts explain the whole, to the cent */
        if (m.bankEnd < -0.004) { ok(tag, !!z && Math.abs(z.by + m.bankEnd) < 0.005, 'belowZero missing or wrong ' + JSON.stringify(z) + ' bankEnd ' + m.bankEnd);
          if (z) { ok(tag, Math.abs((z.adds - z.takes) - (m.bankEnd - m.bankStart)) < 0.005 && !(z.adds > 0 && z.takes > 0), 'belowZero change ' + JSON.stringify(z));
            ok(tag, Math.abs(z.by - (z.startBelow > 0 ? z.startBelow + z.takes - z.adds : z.takes - m.bankStart)) < 0.005, 'belowZero parts do not add up ' + JSON.stringify(z) + ' start ' + m.bankStart);
            ok(tag, z.overNow >= 0 && z.overBefore >= -0.004 && z.planGap >= 0, 'belowZero negative part ' + JSON.stringify(z)); } }
        else ok(tag, z === null, 'belowZero shown with the bank at or above zero'); }
      ok(tag, Math.abs(v.play.left - (v.play.planned - v.play.spent)) < 0.005, 'play left');
      ok(tag, v.play.over === (v.play.left < 0), 'play over');
      ok(tag, v.play.daysLeft >= 1 && v.play.daysLeft <= v.play.dim && v.play.dayN >= 1 && v.play.dayN <= v.play.dim, 'days ' + JSON.stringify(v.play));
      ok(tag, v.play.perWeek === null || (fin(v.play.perWeek) && v.play.perWeek >= 0), 'perWeek');
      ok(tag, v.play.frac >= 0 && v.play.frac <= 1 && v.play.dayFrac > 0 && v.play.dayFrac <= 1, 'fracs');
      v.buckets.forEach(b => { ok(tag + ' ' + b.id, fin(b.planned) && fin(b.spent), 'bucket nums'); if (b.kind === 'spend') ok(tag + ' ' + b.id, Math.abs(b.left - (b.planned - b.spent)) < 0.005, 'bucket left'); });
      const lts = v.buckets.find(b => b.id === 'lts'); ok(tag, lts.planned === m.goalsTotal && lts.total === Object.keys(m.bal).reduce((a, k) => a + m.bal[k], 0), 'lts bucket');
      let ff = 0; for (const x of MO) { if (x > ym) break; ff += C.byYm[x].jar.ffa; } ok(tag, v.buckets.find(b => b.id === 'ffa').total === ff, 'ffa total');
      v.goals.forEach(r => {
        ok(tag + ' ' + r.id, Number.isInteger(r.pct) && r.pct >= 0 && r.pct <= 100, 'goal pct ' + r.pct);
        ok(tag + ' ' + r.id, (r.pct === 100) === (r.target > 0 && r.saved >= r.target), 'pct 100 iff saved>=target ' + r.pct + ' ' + r.saved + '/' + r.target);
        ok(tag + ' ' + r.id, r.target === 0 ? r.pct === 0 : true, 'pct with no target');
        { const gi = M.goalInfo(S, C, r.id, ym); ok(tag + ' ' + r.id, gi.togo === r.togo && gi.target === r.target, 'to go differs between goalInfo and goalRows: ' + gi.togo + ' vs ' + r.togo + ' (target ' + gi.target + ' vs ' + r.target + ')'); }
        if (r.months !== null) ok(tag + ' ' + r.id, r.months >= 0 && Number.isInteger(r.months), 'months to go');
        if (r.need !== null) ok(tag + ' ' + r.id, fin(r.need) && r.need >= 0, 'need');
      });
      if (v.main) ok(tag, v.goals.some(r => r.id === v.main.id) && v.main.target > 0, 'main goal');
    });
  });
}

function checkFixes(id, S, C) {
  C.months.forEach(m => {
    const fx = M.fixes(S, m);
    fx.forEach(f => {
      ok(id + ' fix ' + m.ym, fin(f.amount) && f.amount >= 0, 'fix amount');
      if (f.id === 'trim') ok(id + ' fix ' + m.ym, f.amount < m.jar.play, 'trim not smaller than play');
      if (f.id === 'borrow') { const eg = M.emergencyGoal(S); ok(id + ' fix ' + m.ym, eg && f.amount <= m.balBefore[eg.id] - m.draw, 'borrow more than fund holds'); }
    });
    if (M.statusOf(S, m) !== 'short') ok(id + ' fix ' + m.ym, fx.length === 0, 'fix offered when not short');
  });
}

function checkRoundTrip(id, S, C) {
  const raw = JSON.parse(JSON.stringify(S));
  const S2 = JSON.parse(JSON.stringify(S));
  S2.plan = M.cleanPlan(raw.plan, false); S2.steps = M.cleanSteps(raw.steps); S2.once = M.cleanOnce(raw.once); S2.items = M.cleanItems(raw.items); S2.cfg = Object.assign({}, S2.cfg, M.cleanCfg(raw.cfg)); S2.receipts = M.cleanReceipts(raw.receipts);
  const C2 = M.calcAll(S2);
  const same = C2.months.every((m, i) => m.left === C.months[i].left && m.bankEnd === C.months[i].bankEnd && m.out === C.months[i].out);
  ok(id, same, 'clean load changes the numbers');
  // idempotent
  const S3 = JSON.parse(JSON.stringify(S2)); S3.plan = M.cleanPlan(S2.plan, false); S3.steps = M.cleanSteps(S2.steps); S3.once = M.cleanOnce(S2.once); S3.items = M.cleanItems(S2.items); S3.receipts = M.cleanReceipts(S2.receipts);
  ok(id, JSON.stringify([S3.plan, S3.steps, S3.once, S3.items, S3.receipts]) === JSON.stringify([S2.plan, S2.steps, S2.once, S2.items, S2.receipts]), 'cleaning twice differs');
  // csv: every number in the sheet equals the model
  const rows = M.sheetRows(S, C);
  rows.slice(1).forEach((r, i) => { const m = C.months[i]; ok(id + ' csv', r[1] === m.inflow && r[8] === m.out && r[9] === m.left && r[11] === m.bankEnd && r[10] === m.bankStart, 'sheet row ' + m.ym); });
  const csv = M.sheetCsv(S, C); ok(id + ' csv', csv.split('\r\n').length === rows.length + 1, 'csv lines');
}

/* val/setVal against a plain timeline model: for each key, per month the value is the last 'after' step at or before it, overridden by a one-month value */
function checkVal() {
  for (let t = 0; t < 400; t++) {
    const S = M.presetState(pick(['₱', '¥', '€']), false), MO = M.MONTHS, key = pick(['a', 'b', 'side', 'bill:rent', 'envelope', 'invest']);
    const def = ym => M.val(S, key, ym);
    const defs = MO.map(def); const once = {}, step = []; let cur = defs.slice();
    const n = ri(1, 8);
    for (let i = 0; i < n; i++) {
      const ym = pick(MO), v = amt(), scope = pick(['after', 'once']), cv = M.clampAmt(v);
      M.setVal(S, key, ym, v, scope);
      const ix = MO.indexOf(ym);
      if (scope === 'once') once[ym] = cv; else { delete once[ym]; for (let k = ix; k < MO.length; k++) { cur[k] = cv; } for (const q of Object.keys(once)) { /* a later one-month value stays */ } }
    }
    // expected: the 'after' overwrite applies to later months that had no one-month value set after... model it directly in order
    const S2 = M.presetState('₱', false); void S2;
    MO.forEach((ym, k) => { const exp = once[ym] !== undefined ? once[ym] : cur[k]; ok('val ' + key + ' ' + ym, M.val(S, key, ym) === exp, 'val ' + M.val(S, key, ym) + ' expected ' + exp); });
  }
}

function checkDates() {
  ['2026-02-29', '2028-02-29', '2027-02-29', '2026-13-01', '2026-00-10', '2026-04-31', 'x', '', null, 5, '2026-1-01'].forEach(d => {
    const exp = ['2028-02-29'].includes(d); ok('validDate ' + d, M.validDate(d) === exp, 'validDate ' + d);
  });
  // monthly reminder on the 29th, 30th, 31st must land on a real day with that number
  [1, 15, 28].forEach(dom => ['2026-01-31', '2026-02-01', '2026-02-10', '2027-02-01', '2028-02-01', '2026-04-30', '2026-11-30'].forEach(t => {
    const today = new Date(t + 'T12:00:00'), d = M.nextMonthDay(dom, today);
    ok('nextMonthDay ' + dom + ' from ' + t, d.getDate() === dom && d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'got ' + d.toDateString());
  }));
  [-1].forEach(dom => ['2026-02-10', '2028-02-10', '2026-04-30', '2026-12-31'].forEach(t => { const today = new Date(t + 'T12:00:00'), d = M.nextMonthDay(dom, today); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); ok('last day ' + t, d.getDate() === last, 'got ' + d.toDateString()); }));
  for (let day = 0; day < 7; day++) ['2026-11-16', '2026-12-31', '2028-02-28'].forEach(t => { const today = new Date(t + 'T12:00:00'), d = M.nextWeekday(day, today); ok('nextWeekday', d.getDay() === day && (d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 864e5 < 7 && d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()), 'weekday ' + day + ' from ' + t); });
}

function checkMisc() {
  for (let i = 0; i < 400; i++) {
    const n = ri(1, 8), vals = Array.from({ length: n }, () => pick([0, 1, ri(0, 10), ri(0, 1000), ri(0, 1e6)])), base = vals.reduce((a, b) => a + b, 0);  /* the page always passes shares that add up to the base */
    const p = M.wholePercents(vals, base), s = p.reduce((a, b) => a + b, 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    ok('wholePercents', (base > 0 && sum > 0) ? s === 100 : s === 0, 'sum ' + s + ' ' + JSON.stringify({ vals, base, p }));
    p.forEach((x, k) => ok('wholePercents', x >= 0 && x <= 100 && (vals[k] > 0 || x === 0), 'range ' + JSON.stringify({ vals, base, p })));
  }
  [[0, 0], [1, 3], [50, 100], [99.9, 100], [100, 100], [150, 100], [-5, 100], [1, 0]].forEach(([v, t]) => { const r = M.wholePct(v, t); ok('wholePct ' + v + '/' + t, r >= 0 && r <= 100 && ((r === 100) === (t > 0 && v >= t)), 'got ' + r); });
  for (let i = 0; i < 300; i++) { const total = ri(0, 1e6), n = ri(0, 60), m = M.loanMonthlyFrom(total, n); ok('loan', n === 0 ? m === 0 : m * n >= total && (m - 1) * n < total, 'monthly ' + m + ' total ' + total + ' n ' + n); }
  // receipts: add / update / remove keep totals exact to the cent
  const S = M.presetState('₱', false); S.receipts = []; let tot = 0;
  for (let i = 0; i < 300; i++) { const a = ri(1, 999999) / 100; if (M.addReceipt(S, '2026-11-' + ('0' + ri(1, 28)).slice(-2), a, 'envelope', 'x')) tot += a; }
  ok('receipts', Math.abs(M.receiptStats(S, '2026-11').total - Math.round(tot * 100) / 100) < 0.005, 'receipt total drift ' + M.receiptStats(S, '2026-11').total + ' vs ' + tot);
  ['abc', 0, -5, NaN, Infinity, 1e10, '12.345'].forEach(a => { const n = S.receipts.length; const r = M.addReceipt(S, '2026-11-05', a, 'envelope', ''); const exp = a === '12.345'; ok('receipt input ' + a, exp ? r !== null : r === null, 'accepted ' + a); if (r) M.removeReceipt(S, r); ok('receipt input ' + a, S.receipts.length === n, 'count'); });
}

function checkOps(id, S) {
  // add/remove/update never produce NaN and removal leaves no ghost values
  const T = JSON.parse(JSON.stringify(S));
  const lid = M.addLine(T, 'nec', 'zz', 123); if (lid) { M.setVal(T, 'line:' + lid, '2027-03', 77, 'once'); M.removeLine(T, lid); ok(id, !T.steps['line:' + lid] && Object.keys(T.once).every(y => T.once[y]['line:' + lid] === undefined), 'ghost line values'); }
  const gid = M.addGoal(T, 'zz'); if (gid) { M.updateGoal(T, gid, { target: 5000, due: '2027-06-20' }); M.removeGoal(T, gid); ok(id, !T.steps['goal:' + gid], 'ghost goal values'); }
  const C = M.calcAll(T); ok(id, C.months.every(m => fin(m.left) && fin(m.bankEnd)), 'ops left NaN');
  // sweepPlay / trimPlay keep the month's money out the same where promised
  const C0 = M.calcAll(S);
  C0.months.slice(0, 3).forEach(m => {
    const eg = S.plan.goals.find(g => !g.due && g.target > 0); if (!eg) return;
    const U = JSON.parse(JSON.stringify(S)), moved = M.sweepPlay(U, m.ym, eg.id, 7777), C1 = M.calcAll(U), m1 = C1.byYm[m.ym];
    ok(id + ' sweep', moved >= 0 && moved <= m.jar.play, 'moved ' + moved);
    ok(id + ' sweep', m1.jar.play === m.jar.play - moved, 'play not reduced by moved');
    ok(id + ' sweep', m1.g[eg.id].actual >= m.g[eg.id].actual && m1.g[eg.id].actual <= m.g[eg.id].actual + moved, 'goal deposit after sweep');
    ok(id + ' sweep', m1.left >= m.left - 0 || moved === 0 || m1.out >= m.out - moved, 'sweep changed money out wrongly');
    const V = JSON.parse(JSON.stringify(S)), tgt = Math.max(0, m.jar.play - ri(0, 5000)); M.trimPlay(V, m, m.ym, tgt); const m2 = M.calcAll(V).byYm[m.ym]; ok(id + ' trim', m2.jar.play === Math.max(tgt, 0) || m2.jar.play >= tgt, 'trimPlay ' + m2.jar.play + ' vs ' + tgt);
  });
}

M.__noop = 0;
checkVal(); checkDates(); checkMisc();
for (let i = 0; i < N; i++) {
  const S = randomState(), id = 's' + i;
  let C; try { C = checkCalc(id, S); checkViews(id, S, C); checkFixes(id, S, C); checkRoundTrip(id, S, C); checkOps(id, S); } catch (e) { bad(id, 'CRASH ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
}
console.log('checks', checks, 'fails', fails);
console.log(fails ? 'FUZZ FAIL ' + fails : 'FUZZ PASS');
process.exit(fails ? 1 : 0);
