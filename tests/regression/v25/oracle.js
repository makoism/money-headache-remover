/* An independent recomputation of the whole money model, written from the plain rules and NOT from the app's code.
   It reads only the raw saved plan (lines, goals, steps, once, items, cfg, debts, receipts) and works in whole numbers (receipts in whole cents).
   Then it compares everything the app's calcAll / goalInfo / jarsOf / receiptStats report, including spending past plan (oracleOverspend),
   the piles Home draws (oraclePiles), and the month-end answers: unspent Free to spend of a past month counted in the bank or put toward a goal.
   The goal ledger and the bank are kept in whole cents, so a top-up that carries a receipt's cents can never pick up a float error. */
const vm = require('vm'), fs = require('fs');
const ctx = vm.createContext({ console, Math, JSON, Date });
vm.runInContext(fs.readFileSync(process.env.MODEL || '/home/claude/work/team/model.js', 'utf8') + '\n;this.__M={debtRows,limitsOf,lookBack,addExtraMoney,debtsOf,presetState,calcAll,goalInfo,jarsOf,statusOf,receiptStats,addReceipt,setVal,addLine,addGoal,updateGoal,updateLine,emergencyGoal,MONTHS,START,SAVE_FROM,SAMPLES,SPAN,JARS,cfg,roundUnit,round2,lineByKey,wholePercents,cleanSteps,cleanOnce,cleanItems,cleanCfg,fixes,trimPlay,sweepPlay,topupFit,removeGoal,viewOf,sheetCsv,sheetRows,purposeOf,pickMain,kindOfGoal,goalRows,wholePct,PURPOSE_VERBS,setCurYm:typeof setCurYm!=="undefined"?setCurYm:null,proofOf:typeof proofOf!=="undefined"?proofOf:null,planCells:typeof planCells!=="undefined"?planCells:null};', ctx);
const M = ctx.__M;

/* ---------- the oracle ---------- */
const PAY_OF = { '₱': 30000, '¥': 200000, '€': 1650 };
const mIdx = ym => +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1);
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);           // whole numbers only
const ymOf = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
/* Cards and loans (38.26), recounted from the plain rules in whole numbers.
   Each month: interest is added to what is owed, then the payment comes off.
   - The yearly rate is a percent with at most two decimals, so it is counted here in hundredths of a percent (A = rate x 100, a whole number).
     A month's interest is owed x rate / 12 / 100 = owed x A / 120000, rounded to the nearest whole amount (a half rounds up). Nothing owed, no interest.
   - The payment is the minimum plus the month's extra (the extra is the plan's extra, or a change for this month or from a month on; never below 0),
     but never more than what is owed after interest.
   - What is owed at the end is what was owed + interest - payment.
   - The payments are part of Bills and basics (money that leaves), but not of the bills total (the bill lines).
   Pay-off month: the first month the balance is 0. If that is past the page's months, the last month's extra keeps going, month by month,
   for at most 50 years; a month whose payment does not beat its interest means it is never paid off. */
const debtMonth = (owed, A, min, extra) => {
  const interest = owed > 0 ? Math.floor((2 * owed * A + 120000) / 240000) : 0;
  const pay = Math.min(owed + interest, min + extra);
  return { start: owed, interest, extra, pay, bal: owed + interest - pay };
};
const rateA = d => Math.round(d.apr * 100);
/* Month-end answers (38.30 S1, QC8, QC10 rules), recounted from the plain words. opt.cur is the month the app takes as now.
   - The question is asked only once pay, bills and goals are the person's own (ui.done) and at least one receipt is logged (anywhere), and
     only about a month before now. Until then a past month's Free to spend is taken as spent, as planned.
   - What is left: the month's Free to spend lines as planned (a line that has ended plans 0), less what was logged on them that month,
     never below 0, rounded down to whole yen in yen (to the cent otherwise).
   - No answer yet: that is the open question (r.pendLeftC). "Decide later and hide" (hide): nothing changes, as if no question was asked.
   - Any other answer (counted in the bank, or put toward a goal): what is left NOW is counted (r.countedC). It is worked out again from the
     receipts every time, so a receipt logged after the answer makes it smaller; the stored amount is not what is counted.
   - Toward a goal: the stored amount (to the cent), but never more than what is left. The goal takes it only into the room it still has
     after this month's own saving: room = its cap this month (the target, or the longer goal from the month the person said yes) less what
     it held at the start of the month, less this month's deposit. A goal that is gone, or full, takes nothing. (r.topup.usedC)
   - Whatever the goal did not take goes to the bank (r.creditC = counted - used), on top of the month's planned left over.
   - The plan lines stay as planned: a top-up is extra money for the goal, not part of the month's goals total or money out. */
/* The plan's first month (QC round 4 money accuracy B1): cfg.planFrom when it is one of the page's months, otherwise the page's first
   month. A month before it is not lived in the plan: no pay, no other pay, no money from the emergency fund, every line 0, no one-time
   costs, no debt payment and no interest (what is owed stays as typed), no goal money, no month-end question. The balance typed is the
   bank at the start of the plan's first month, and a goal with a date spreads what it still needs from that month. */
function oracle(S, opt) {
  const months = M.MONTHS, pf = (S.cfg && typeof S.cfg.planFrom === 'string' && months.indexOf(S.cfg.planFrom) >= 0) ? S.cfg.planFrom : months[0], first = pf;
  const C = x => Math.round((+x || 0) * 100), U = c => c / 100;
  const preset = (S.ui && S.ui.preset) || 'legacy';
  const payDefault = preset === 'blank' ? 0 : PAY_OF[preset] !== undefined ? PAY_OF[preset] : 35000;
  const valueOf = (key, ym, dflt) => {
    if (S.once[ym] && S.once[ym][key] !== undefined) return S.once[ym][key];
    const st = S.steps[key]; if (st) { let best = null; st.forEach(s => { if (s.from <= ym && (best === null || s.from > best.from)) best = s; }); if (best) return best.v; }
    return dflt();
  };
  const goals = S.plan.goals, lines = S.plan.lines;
  const dueM = g => g.due ? g.due.slice(0, 7) : null;
  const lastSave = g => { if (!g.due) return null; const m = dueM(g), d = +g.due.slice(8, 10); return d > 15 ? m : (() => { const i = mIdx(m) - 1; return Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0'); })(); };
  const pays = months.map(ym => valueOf('a', ym, () => payDefault) + valueOf('b', ym, () => 0) + valueOf('side', ym, () => 0));
  const unit = Math.max.apply(null, pays) >= 20000 ? 100 : Math.max.apply(null, pays) >= 5000 ? 10 : 5;
  const capFor = g => (g.emergency && g.stretchOn === true) ? Math.max(g.stretch || 0, g.target) : g.target;
  const goalDefault = (g, ym) => {
    if (g.due) { const rest = Math.max(0, g.target - g.start); if (rest === 0) return 0; const ls = lastSave(g); if (ym > ls) return 0; const n = mIdx(ls) - mIdx(first) + 1; if (n < 1) return 0; return ceilDiv(rest, n * unit) * unit; }
    if (typeof g.monthly === 'number') return g.monthly;
    const rest = Math.max(0, capFor(g) - g.start); if (rest === 0) return 0; return ceilDiv(rest, 12 * unit) * unit;
  };
  const goalValue = (g, ym) => { if (g.due && ym > lastSave(g)) return 0; return valueOf('goal:' + g.id, ym, () => goalDefault(g, ym)); };
  const lineValue = (l, ym) => valueOf(l.key, ym, () => l.def);
  const eg = goals.find(g => g.emergency) || null;
  /* 38.30 rule: the Emergency fund stops at its target unless the person said yes to the longer goal (stretchOn) */
  const cap = (g, ym) => (g.emergency && g.stretchOn === true && !(ym && g.stretchFrom && ym < g.stretchFrom)) ? Math.max(g.stretch || 0, g.target) : g.target;   /* QC8 SF5: a yes counts from its month */
  let bank = C(M.cfg(S, 'bankStart'));
  const bal = {}; goals.forEach(g => { bal[g.id] = C(g.start); });   /* in cents */
  const reached = {}; const out = [];
  const freedLines = lines.filter(l => l.ends && l.redirect).map(l => ({ ends: l.ends, amt: C(lineValue(l, l.ends)) }));
  const debts = (S.plan && Array.isArray(S.plan.debts)) ? S.plan.debts : [], owed = {};
  debts.forEach(d => { owed[d.id] = d.balance; });
  /* month-end answers */
  const done = (S.ui && S.ui.done) || {}, rcAll = S.receipts || [], yen = !!(S.ui && S.ui.cur === '¥'), answers = (S.ui && S.ui.sweep) || {};
  const asks = !!(opt && opt.cur) && !!(done.pay && done.bills && done.goals) && rcAll.length > 0;
  const jarOfKey = k => { const l = lines.find(x => x.key === k); return l ? l.jar : 'other'; };
  months.forEach(ym => {
    const r = { ym }, before = ym < pf; if (before) r.notLived = true;
    r.a = before ? 0 : valueOf('a', ym, () => payDefault); r.b = before ? 0 : valueOf('b', ym, () => 0); r.side = before ? 0 : valueOf('side', ym, () => 0);
    const drawC = eg && !before ? Math.min(C(valueOf('draw', ym, () => 0)), Math.max(0, bal[eg.id])) : 0;
    r.draw = U(drawC);
    r.jar = { nec: 0, play: 0, edu: 0, ffa: 0, give: 0 };
    r.lineVals = lines.map(l => { const on = !l.ends || ym <= l.ends; return { key: l.key, name: l.name, jar: l.jar, on, v: on && !before ? lineValue(l, ym) : 0 }; });
    r.lineVals.forEach(x => { r.jar[x.jar] += x.v; });
    r.bills = r.jar.nec;
    r.items = before ? 0 : (S.items[ym] || []).reduce((s, i) => s + (+i.amount || 0), 0);
    r.jar.nec += r.items;
    r.debts = {}; r.debtPay = 0; r.debtInterest = 0; r.debtStart = 0; r.debtMin = 0;
    debts.forEach(d => {
      const x = before ? { start: owed[d.id], interest: 0, extra: 0, pay: 0, bal: owed[d.id] } : debtMonth(owed[d.id], rateA(d), d.min, Math.max(0, valueOf('debt:' + d.id, ym, () => d.extra)));
      /* how much of the first balance is paid off by the end of this month, as a whole percent (a half rounds up), never below 0; nothing owed at first counts as all paid */
      x.paidPctWhole = d.balance > 0 ? Math.max(0, Math.min(100, Math.floor((200 * (d.balance - x.bal) + d.balance) / (2 * d.balance)))) : 100;
      owed[d.id] = x.bal; r.debts[d.id] = x;
      r.debtPay += x.pay; r.debtInterest += x.interest; r.debtStart += x.start; r.debtMin += Math.min(d.min, x.start + x.interest);
    });
    r.debtOwed = debts.reduce((a, d) => a + owed[d.id], 0); r.debtExtra = r.debtPay - r.debtMin;
    r.jar.nec += r.debtPay;
    /* the month-end answer for this month, if it is one the app asks about */
    let topup = null;
    if (asks && ym < opt.cur) {
      const en = answers[ym] || null;
      if (!(en && en.hide)) {
        let leftC = r.lineVals.filter(x => x.jar === 'play').reduce((s, x) => s + C(x.v), 0)
          - rcAll.filter(x => String(x.d).slice(0, 7) === ym && jarOfKey(x.c) === 'play').reduce((s, x) => s + C(x.a), 0);
        if (yen) leftC = Math.floor(leftC / 100) * 100;
        leftC = Math.max(0, leftC);
        if (!en) r.pendLeftC = leftC;
        else { r.countedC = leftC; if (en.id && leftC > 0) topup = { id: en.id, amtC: Math.min(C(en.amt), leftC), usedC: 0 }; }
      }
    }
    const freedC = freedLines.reduce((s, f) => s + (ym > f.ends ? f.amt : 0), 0);
    r.beforeC = Object.assign({}, bal); r.g = {}; let goalsTotalC = 0;
    goals.forEach(g => {
      const isE = !!(eg && g.id === eg.id);
      const plannedC = before ? 0 : C(goalValue(g, ym)) + (isE ? freedC : 0);
      const roomC = Math.max(0, cap(g, ym) * 100 - bal[g.id]);
      const actualC = Math.min(plannedC, roomC);
      const upC = topup && topup.id === g.id ? Math.min(topup.amtC, roomC - actualC) : 0;   /* only the room left after this month's own saving */
      if (upC > 0) topup.usedC = upC;
      r.g[g.id] = { planned: U(plannedC), actual: U(actualC), up: U(upC), plannedC, actualC, upC }; goalsTotalC += actualC;
    });
    r.goalsTotal = U(goalsTotalC);
    r.inflow = r.a + r.b + r.side + r.draw;
    r.outflow = r.jar.nec + r.jar.play + r.jar.edu + r.jar.ffa + r.jar.give + r.goalsTotal;
    r.left = r.inflow - r.outflow;
    r.topup = topup ? { id: topup.id, amt: U(topup.amtC), used: U(topup.usedC), amtC: topup.amtC, usedC: topup.usedC } : null;
    r.creditC = r.countedC !== undefined ? r.countedC - (topup ? topup.usedC : 0) : 0;
    r.pendLeft = r.pendLeftC === undefined ? undefined : U(r.pendLeftC); r.counted = r.countedC === undefined ? undefined : U(r.countedC); r.credit = U(r.creditC);
    r.bankStart = U(bank); bank += C(r.left) + r.creditC; r.bankEnd = U(bank);
    goals.forEach(g => { bal[g.id] += r.g[g.id].actualC + r.g[g.id].upC - (eg && g.id === eg.id ? drawC : 0); });
    goals.forEach(g => { if (g.target > 0 && reached[g.id] === undefined && cap(g, ym) === cap(g) && bal[g.id] >= cap(g, ym) * 100) reached[g.id] = ym; });
    r.spent = {}; r.spentC = {};
    goals.forEach(g => { let s = 0; if (g.due && g.target > 0 && ym === dueM(g)) { s = Math.min(bal[g.id], g.target * 100); bal[g.id] -= s; } r.spentC[g.id] = s; r.spent[g.id] = U(s); });
    r.balC = Object.assign({}, bal);
    r.before = {}; r.bal = {}; goals.forEach(g => { r.before[g.id] = U(r.beforeC[g.id]); r.bal[g.id] = U(bal[g.id]); });
    out.push(r);
  });
  oracleOverspend(S, out, lines);
  oraclePiles(S, out, lines);
  return { rows: out, reached, lastSave, dueM, cap, debtRows: oracleDebtRows(debts, out, months) };
}
/* each card or loan: pay-off month, never, interest and payments up to the pay-off, and which one to pay first */
function oracleDebtRows(debts, rows, months) {
  const res = debts.map(d => {
    let payoffYm = null, interest = 0, paid = 0, never = false;
    for (const r of rows) { const x = r.debts[d.id]; interest += x.interest; paid += x.pay; if (x.bal === 0) { payoffYm = r.ym; break; } }
    if (payoffYm === null) {
      const lx = rows[rows.length - 1].debts[d.id], A = rateA(d); let bal = lx.bal, i = mIdx(months[months.length - 1]), n = 0;
      while (bal > 0) {
        if (n >= 600) { never = true; break; }
        const x = debtMonth(bal, A, d.min, lx.extra);
        if (x.pay <= x.interest) { never = true; break; }
        interest += x.interest; paid += x.pay; bal = x.bal; i++; n++;
      }
      if (!never) payoffYm = ymOf(i);
    }
    return { id: d.id, payoffYm, never, totalInterest: interest, totalPaid: paid, first: false, done: d.balance <= 0 };
  });
  /* pay first: the highest rate; the same rate, the smaller balance; then the id. Only said when two or more are still owed. */
  const open = res.map((x, k) => [x, debts[k]]).filter(([x]) => !x.done).sort(([, a], [, b]) => rateA(b) - rateA(a) || a.balance - b.balance || (a.id < b.id ? -1 : 1));
  if (open.length > 1) open[0][0].first = true;
  return res;
}
/* Receipts and spending past plan (38.30 and 38.31 rules), recounted from the plain words. Every amount here is a whole number of cents; it is
   turned back into money (cents / 100) only when it is handed over, so nothing can pick up a float error along the way.
   Receipts:
   - A receipt counts in the month of its date; one dated outside the page's months counts in no month.
   - Its place is the line it was logged on. Logged as Other, or on a line that is no longer in the plan, it is Other.
   - r.rs is what the month's receipts add up to: the total, how many, by line (as logged) and by place.
   Spending past plan, only once at least one receipt exists (anywhere). Per month:
   - Bills and basics are judged line by line: what was logged on a line past that line's plan (a line that has ended plans 0).
     A big grocery bill does not use up the rent that was not logged. (r.overNec)
   - Other: what was logged as Other past the month's one-time costs (a one-time cost is money already set aside for it).
   - Free to spend and Investing: what was logged past the month's plan for the place as a whole (all its lines together).
   - Education and Giving keep what is not spent: each holds the plans so far minus what was logged on it, from the first month.
     If one would drop below zero, that part comes out of the bank and it is empty, not negative. (r.ovB: the part the bank paid this month)
   - r.overBits: the part past plan, place by place, only the places above zero; they add up to r.overNow.
   - r.billsLeft: Bills and basics still to pay: each bill line's plan not yet logged (never below 0), the one-time costs not yet logged as
     Other, and the card and loan payments (nothing is ever logged against those).
   - Spending under plan changes nothing. Spending past plan comes out of the bank in its month and stays out in every later month:
     r.overNow is this month's part, r.over the total so far, r.bankPlanned the bank the plan alone gives; r.bankStart and r.bankEnd become
     the real bank (the plan's figure less everything past plan before this month, and up to and including it). */
function oracleOverspend(S, rows, lines) {
  const C = x => Math.round((+x || 0) * 100), U = c => c / 100, rc = S.receipts || [], has = rc.length > 0;
  const inMoney = o => Object.keys(o).reduce((a, k) => (a[k] = U(o[k]), a), {});
  const jarOfKey = k => { const l = lines.find(x => x.key === k); return l ? l.jar : 'other'; };
  const kept = { edu: 0, give: 0 }; let cum = 0;
  rows.forEach(r => {
    const byKey = {}, byJar = {}; let total = 0, count = 0;
    rc.forEach(x => { if (String(x.d).slice(0, 7) !== r.ym) return; const a = C(x.a), j = jarOfKey(x.c); total += a; count++; byKey[x.c] = (byKey[x.c] || 0) + a; byJar[j] = (byJar[j] || 0) + a; });
    r.rs = { total: U(total), count, byKey: inMoney(byKey), byJar: inMoney(byJar) };
    const logged = j => byJar[j] || 0;
    let now = 0; r.ovB = {};
    if (has && !r.notLived) {   /* a month before the plan's first month: its receipts were spent before the balance was typed, so nothing is past plan */
      const bills = r.lineVals.filter(l => l.jar === 'nec');
      const parts = {
        nec: bills.reduce((s, l) => s + Math.max(0, (byKey[l.key] || 0) - C(l.v)), 0),
        other: Math.max(0, logged('other') - C(r.items)),
        play: Math.max(0, logged('play') - C(r.jar.play)),
        ffa: Math.max(0, logged('ffa') - C(r.jar.ffa)),
        edu: 0, give: 0
      };
      ['edu', 'give'].forEach(j => { kept[j] += C(r.jar[j]) - logged(j); if (kept[j] < 0) { parts[j] = -kept[j]; r.ovB[j] = U(-kept[j]); kept[j] = 0; } });
      now = Object.keys(parts).reduce((s, k) => s + parts[k], 0);
      r.overNec = U(parts.nec);
      r.overBits = {}; Object.keys(parts).forEach(k => { if (parts[k] > 0) r.overBits[k] = U(parts[k]); });
      r.billsLeft = U(bills.reduce((s, l) => s + Math.max(0, C(l.v) - (byKey[l.key] || 0)), 0) + Math.max(0, C(r.items) - logged('other')) + C(r.debtPay));
    }
    const plannedEnd = C(r.bankEnd);
    r.bankPlanned = U(plannedEnd); r.bankStart = U(C(r.bankStart) - cum);
    cum += now; r.overNow = U(now); r.over = U(cum); r.bankEnd = U(plannedEnd - cum);
  });
}
/* The piles Home draws for Education, Giving and Investing (mapOf's burrows), recounted from the plain words in whole cents.
   Each is a running total from the first month up to and including the month shown:
   - Education and Giving: what each month planned for the place goes in, what was logged on it comes out. A month that ends below zero was
     paid from the bank in that month, so the pile starts the next month at zero (never taken twice). The month shown may be below zero:
     then the pile shows 0 and says by how much it is over.
   - Investing is money put in and never spent: a month adds its plan, or what was logged if that is more (logging is the plan being done;
     anything past the plan came from the bank). It never goes below zero.
   - planned and logged are the totals so far; loggedPast is logged less planned.
   - A pile is listed when the month plans something for it or it holds money. */
function oraclePiles(S, rows, lines) {
  const C = x => Math.round((+x || 0) * 100), rc = S.receipts || [];
  const jarOfKey = k => { const l = lines.find(x => x.key === k); return l ? l.jar : 'other'; };
  const run = { edu: 0, ffa: 0, give: 0 }, pl = { edu: 0, ffa: 0, give: 0 }, lg = { edu: 0, ffa: 0, give: 0 };
  rows.forEach(r => {
    const logged = { edu: 0, ffa: 0, give: 0 };
    rc.forEach(x => { if (String(x.d).slice(0, 7) !== r.ym) return; const j = jarOfKey(x.c); if (logged[j] !== undefined) logged[j] += C(x.a); });
    r.piles = {};
    ['edu', 'ffa', 'give'].forEach(j => {
      const plan = C(r.jar[j]);
      pl[j] += plan; lg[j] += logged[j];
      run[j] += j === 'ffa' ? Math.max(plan, logged[j]) : plan - logged[j];
      const now = run[j];
      r.piles[j] = { amountC: Math.max(0, now), overByC: Math.max(0, -now), plannedC: pl[j], loggedC: lg[j], loggedPastC: lg[j] - pl[j], listed: plan > 0 || now > 0 };
      if (now < 0) run[j] = 0;
    });
  });
}
/* the status of one goal in one month, again from the plain rules */
function oracleGoal(S, O, id, ym) {
  const g = S.plan.goals.find(x => x.id === id), row = O.rows.find(r => r.ym === ym);
  const reached = O.reached[id] || null, ls = O.lastSave(g), dm = O.dueM(g);
  const T = O.cap(g, ym);   /* 38.30 rule: every goal is judged against its cap (the target, or the longer goal once the person said yes) */
  let state, need = null, slack = null, had = null;
  if (!(T > 0)) state = 'unset';
  else if (dm && ym >= dm) { const sp = O.rows.find(r => r.ym === dm).spentC[id]; had = sp / 100; state = sp >= T * 100 ? 'paid' : 'short'; }
  else if (ls) {
    state = reached && reached <= ls ? (row.balC[id] >= T * 100 ? 'full' : 'ontrack') : 'behind';
    slack = reached ? mIdx(ls) - mIdx(reached) : null;
    /* what is still missing, spread over the months left, rounded up to a whole amount (the balance can carry cents after a top-up) */
    if (ym <= ls) need = Math.max(0, ceilDiv(Math.max(0, T * 100 - row.beforeC[id]), (mIdx(ls) - mIdx(ym) + 1) * 100));
  } else state = row.balC[id] >= T * 100 ? 'full' : (reached ? 'eta' : 'noeta');
  return { state, need, slack, had, reached };
}
/* whole percents that add to 100, by integer arithmetic: floor each share, give spare points to the biggest remainders (lower position wins a tie) */
function oraclePercents(vals, base) {
  /* 38.31 rule: the shares are parts of the base; the whole percents add up to the rounded total (100 when the shares fill the base, more when a
     plan is paid partly with borrowed money). Integer arithmetic only. */
  const v = vals.map(x => Math.max(0, x)), sum = v.reduce((a, b) => a + b, 0);
  if (!(base > 0) || !(sum > 0)) return v.map(() => 0);
  const T = Math.floor((sum * 200 + base) / (2 * base));            // the total in whole percents, rounded half up
  const fl = v.map(x => Math.floor(x * T / sum)), rem = v.map((x, i) => x * T - fl[i] * sum);
  const spare = T - fl.reduce((a, b) => a + b, 0);
  v.map((x, i) => i).filter(i => v[i] > 0).sort((a, b) => rem[b] - rem[a] || a - b).slice(0, Math.max(0, spare)).forEach(i => { fl[i]++; });
  return fl;
}

/* ---------- random plans ---------- */
let seed = +(process.env.SEED || 1);
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)], ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
function randomState(opt) {
  const cur = pick(['₱', '¥', '€', '$', '£', '₱', '¥', '€']), S = M.presetState(cur, rnd() < .1);
  const scale = M.SAMPLES[cur] ? M.SAMPLES[cur].pay : pick([800, 3000, 12000, 90000]);
  const pay = Math.round((0.1 + rnd() * 3) * scale);
  if (rnd() < .8) M.setVal(S, 'a', M.START, pay, 'after');
  if (rnd() < .3) M.setVal(S, 'b', pick(M.MONTHS), ri(0, Math.round(pay / 2)), 'after');
  if (rnd() < .2) M.setVal(S, 'side', pick(M.MONTHS), ri(0, Math.round(pay / 3)), rnd() < .5 ? 'once' : 'after');
  if (rnd() < .6) M.setVal(S, 'a', pick(M.MONTHS), Math.round(pay * (.5 + rnd())), 'after');
  if (rnd() < .5) S.cfg.bankStart = ri(0, pay * 4); if (rnd() < .3) S.cfg.minBank = ri(0, pay);
  if (rnd() < .3 && S.plan.lines.length < 30) { const l = M.addLine(S, pick(['nec', 'play', 'edu', 'ffa', 'give']), 'x', 0); }
  S.plan.lines.forEach(l => {
    if (rnd() < .7) M.setVal(S, l.key, pick(M.MONTHS), ri(0, Math.round(pay * (l.jar === 'nec' ? .3 : .15))), rnd() < .7 ? 'after' : 'once');
    if (rnd() < .5) M.setVal(S, l.key, pick(M.MONTHS), ri(0, Math.round(pay * .2)), rnd() < .5 ? 'after' : 'once');
    if (l.id === 'loan' && rnd() < .6) { l.def = ri(1, Math.round(pay * .3)); l.ends = pick(M.MONTHS.slice(0, 22)); if (rnd() < .6) l.redirect = true; }
  });
  while (S.plan.goals.length < 6 && rnd() < .3) { const id = M.addGoal(S, 'g'); if (id) M.updateGoal(S, id, { target: ri(0, pay * 6) }); }
  S.plan.goals.forEach(g => {
    if (rnd() < .6) { g.target = ri(0, pay * 8); } if (rnd() < .6) { g.start = ri(0, Math.max(1, Math.round(g.target * 1.3))); }
    if (!g.emergency && rnd() < .5) { const ym = pick(M.MONTHS), d = pick([1, 10, 14, 15, 16, 17, 28]); g.due = ym + '-' + String(d).padStart(2, '0'); }
    else if (!g.emergency && rnd() < .4) g.due = '';
    if (g.emergency) { g.stretch = rnd() < .5 ? ri(0, g.target * 3) : g.stretch; if (rnd() < .2) g.due = ''; if (rnd() < .5) { g.stretchOn = true; const r2 = rngOf(seed * 7 + 13); if (r2() < .5) g.stretchFrom = M.MONTHS[Math.floor(r2() * M.MONTHS.length)]; } }   /* stretchFrom from its own stream: drawing it from rnd() shifted every later plan, so the golden screens drew new plans (13 of 14 MISSING) */
    if (!g.due && rnd() < .5) g.monthly = ri(0, Math.round(pay * .3));
    if (rnd() < .5) M.setVal(S, 'goal:' + g.id, pick(M.MONTHS), ri(0, Math.round(pay * .4)), rnd() < .6 ? 'after' : 'once');
    if (rnd() < .3) M.setVal(S, 'goal:' + g.id, pick(M.MONTHS), ri(0, Math.round(pay * .4)), 'after');
  });
  if (rnd() < .4) S.items[pick(M.MONTHS)] = [{ id: 'i1', label: 'x', amount: ri(0, pay) }, { id: 'i2', label: 'y', amount: ri(0, Math.round(pay / 3)) }];
  if (rnd() < .4) M.setVal(S, 'draw', pick(M.MONTHS), ri(0, pay * 2), 'once');
  if (rnd() < .2) M.setVal(S, 'draw', pick(M.MONTHS), ri(0, pay * 2), 'once');
  /* cards and loans (made-up numbers): only when asked, so the plans other tests draw (and the golden screens) stay the same */
  if (opt && opt.debts && rnd() < .6) {
    S.plan.debts = [];
    const nd = ri(1, 4);
    for (let i = 0; i < nd; i++) {
      const bal = pick([0, ri(1, 99), ri(100, pay), ri(pay, pay * 12), 20000 * ri(1, 40), 40000, ri(1, 1e9)]);
      const apr = pick([0, 0, 1.5, 12, 12.99, 17.25, 19.9, 24, 29.99, 36, 60, 99.99, 100, ri(1, 9999) / 100]);
      const min = pick([0, ri(1, 50), ri(0, Math.round(pay * .2)), Math.round(bal * apr / 1200), Math.round(bal / ri(1, 30))]);
      S.plan.debts.push({ id: 'd' + i, name: 'Debt ' + i, kind: pick(['card', 'loan', 'personal']), balance: bal, apr, min, extra: pick([0, 0, ri(1, Math.round(pay * .2) + 1)]) });
      if (rnd() < .4) M.setVal(S, 'debt:d' + i, pick(M.MONTHS), pick([0, ri(0, Math.round(pay * .5))]), rnd() < .5 ? 'once' : 'after');
      if (rnd() < .2) M.setVal(S, 'debt:d' + i, pick(M.MONTHS), ri(0, pay), 'after');
    }
  }
  return S;
}
/* Random receipts for a plan, from their own random stream R (so the plans themselves, and every other test that draws plans, stay the same).
   They are aimed at the plan as this file reads it: well under a plan, exactly at it, one cent (one yen) past it, past it, far past it,
   several receipts that add up to exactly the plan, small amounts on lines that plan nothing, Other with and without one-time costs,
   a line that is no longer in the plan, and a few dated outside the page's months. Logged with the app's own addReceipt, as a person would. */
function randomReceipts(S, R) {
  const rp = a => a[Math.floor(R() * a.length)], rr = (a, b) => a + Math.floor(R() * (b - a + 1));
  const n = rp([0, 0, 1, 3, 6, 12, 25, 40]); if (!n) return 0;
  const rows = oracle(S).rows, yen = S.ui && S.ui.cur === '¥', step = yen ? 100 : 1;
  const months = []; for (let k = rr(1, 5); k > 0; k--) months.push(R() < .5 ? rp(M.MONTHS.slice(0, 4)) : rp(M.MONTHS));
  const keys = S.plan.lines.map(l => l.key).concat(['other', 'other']);
  const money = c => (yen ? Math.round(c / 100) : c / 100);
  const log = (ym, c, cents) => {
    cents = Math.max(step, Math.round(cents / step) * step);
    const d = ym + '-' + String(rr(1, 28)).padStart(2, '0');
    if (c === 'line:gone') { (S.receipts = S.receipts || []).push({ id: 'rg' + S.receipts.length, d, a: money(cents), c, cn: 'Gone', n: '' }); return; }
    M.addReceipt(S, d, money(cents), c, R() < .3 ? 'note' : '');
  };
  /* a careful person: every receipt fits in what is still left of its plan that month (exactly all of it, sometimes), so nothing goes past plan */
  const careful = R() < .35, left = {};
  for (let i = 0; i < n; i++) {
    const ym = rp(months), r = rows.find(x => x.ym === ym), c = R() < .06 ? 'line:gone' : rp(keys);
    const lv = r.lineVals.find(x => x.key === c), plan = 100 * (lv ? lv.v : r.items);
    if (careful) {
      const k = ym + (lv ? c : 'other'), rem = left[k] === undefined ? plan : left[k];
      if (rem < step) continue;
      const a = R() < .3 ? rem : Math.max(step, Math.floor(rem * R() / step) * step);
      left[k] = rem - a; log(ym, c, a); continue;
    }
    const mode = plan > 0 ? rp(['under', 'under', 'exact', 'cent', 'past', 'far', 'small', 'split']) : rp(['small', 'small', 'past']);
    const odd = yen ? 0 : rr(0, 99);
    if (mode === 'under') log(ym, c, Math.floor(plan * (.05 + R() * .9)) + odd);
    else if (mode === 'exact') log(ym, c, plan);
    else if (mode === 'cent') log(ym, c, plan + step);
    else if (mode === 'past') log(ym, c, (plan > 0 ? Math.floor(plan * (1.05 + R() * .8)) : rr(1, 3000) * 100) + odd);
    else if (mode === 'far') log(ym, c, Math.floor(plan * (2 + R() * 4)) + odd);
    else if (mode === 'small') log(ym, c, rr(1, 5000) * step);
    else { const k = rr(2, 3), each = Math.floor(plan / k / step) * step; for (let q = 1; q < k; q++) log(ym, c, each); log(ym, c, plan - each * (k - 1) + (R() < .5 ? step : 0)); }
  }
  if (R() < .15) log(rp(['2026-10', '2025-03', '2028-11', '2029-01']), rp(keys), rr(1, 90000) * step);   /* dated outside the page: counts nowhere */
  return (S.receipts || []).length;
}
const rngOf = s => { let x = (s >>> 0) % 4294967296; return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296; };

module.exports = { M, oracle, oracleGoal, oraclePercents, randomState, randomReceipts, rngOf, rnd, pick, ri, setSeed: v => { seed = v; } };
if (require.main !== module) return;
/* ---------- compare ---------- */
let fails = [], checks = 0;
const eq = (ctxMsg, a, b) => { checks++; if (a !== b && !(Number.isNaN(a) && Number.isNaN(b))) { if (fails.length < 40) fails.push(ctxMsg + ': app ' + JSON.stringify(a) + ' vs independent ' + JSON.stringify(b)); else fails.length++; } };
const N = +(process.env.N || 3000), RC = { plans: 0, months: 0, underMonths: 0, overMonths: 0, pileMonths: 0, pileCovered: 0 }; const DBG = process.env.DBG ? process.env.DBG.split(',') : [];
const ME = { plans: 0, open: 0, bank: 0, goal: 0, used: 0, cents: 0, stretch: 0, cut: 0, gone: 0, hide: 0, stale: 0, fits: 0, feeds: 0, feedsCut: 0, pileOver: 0, ffaPast: 0 };
/* an app amount against the independent one in whole cents (undefined stays undefined: the app has no such figure that month); a mismatch is said in money */
const ec = (msg, a, bC) => eq(msg, a === undefined || a === null ? undefined : Math.round(a * 100) / 100, bC === undefined || bC === null ? undefined : bC / 100);
/* the piles Home draws for one month (mapOf's burrows, read through viewOf as Home reads them), field by field */
function comparePiles(S, C, r, p) {
  const B = M.viewOf(S, C, r.ym).map.burrows;
  ['edu', 'ffa', 'give'].forEach(j => {
    const a = B.find(x => x.id === j), o = r.piles[j], q = p + 'pile ' + j + ' ';
    eq(q + 'listed', !!a, o.listed); if (!a || !o.listed) return;
    ec(q + 'balance', a.amount, o.amountC); ec(q + 'over by', a.overBy, o.overByC); eq(q + 'over', a.over, o.overByC > 0);
    ec(q + 'planned so far', a.planned, o.plannedC); ec(q + 'logged so far', a.logged, o.loggedC); ec(q + 'logged past plan', a.loggedPast, o.loggedPastC);
    if (o.overByC > 0) ME.pileOver++; if (j === 'ffa' && o.loggedPastC > 0) ME.ffaPast++;
  });
}
/* Month-end answers on a copy of the plan, from their own random stream R (the plans themselves stay the same).
   1. Free to spend of a month moved into a burrow with the app's sweepPlay, as the burrow screen does; the amount moved is checked against
      the rule (no more than asked, rounded down to the cent or whole yen; no more than the month's Free to spend as planned; no more than the
      room the goal has after that month's own saving), and the plan after it against what the move promises.
   2. A month the app takes as now, and the questions answered from the latest past month back, as Home asks them: some left open, some
      counted in the bank, some put toward a goal with the amount the app's topupFit gives (checked against the rule), some hidden, and some
      odd answers a saved copy may still hold (an amount that no longer fits, a goal that is gone, a month not yet past).
   3. Changes after answering, so answers go stale: receipts logged later, the longer emergency goal said yes or no to (from a month or not),
      a target lowered, a goal removed, every receipt deleted.
   Then every month is compared: the open question, what was counted, the top-up (goal, amount, used), the credit to the bank, the bank,
   every goal (deposit, top-up, balance before and after, spent, full date, status) and the piles.
   Known app issue, left visible on purpose (found 2026-11-20, SEED=7 plan #264): the app adds goal money as floats and never rounds the
   balance to the cent, so cents that do not add up exactly (10.74 + 64.21 + 25.05 into a goal of 100) leave it at 99.99999999999999:
   never full, or full a month late. The same happens with typed savings in cents. */
function monthEndCase(S0, R, tag) {
  const rp = a => a[Math.floor(R() * a.length)], rr = (a, b) => a + Math.floor(R() * (b - a + 1)), cc = x => Math.round(x * 100);
  const V = JSON.parse(JSON.stringify(S0)), MS = M.MONTHS, yen = V.ui.cur === '¥';
  if (!(V.receipts || []).length && R() < .7) randomReceipts(V, R);
  const ci = R() < .06 ? 0 : rr(1, MS.length - 1), cur = MS[ci];
  V.ui.done = { pay: R() > .04, bills: R() > .04, goals: R() > .04 };
  const sweepAt = (pm, e) => { V.ui.sweep = Object.assign({}, V.ui.sweep, { [pm]: e }); };
  const playC = r => r.lineVals.filter(x => x.jar === 'play').reduce((s, x) => s + cc(x.v), 0);
  const roomAfterC = (O, r, g, ym) => Math.max(0, O.cap(g, ym) * 100 - r.beforeC[g.id] - r.g[g.id].actualC);
  /* 1. burrow feeds */
  let Of = null;   /* the independent figures for the plan as it stands (each feed's "after" is the next one's "before") */
  for (let f = rp([0, 0, 1, 2, 3]); f > 0; f--) {
    const ym = R() < .5 ? cur : rp(MS.slice(0, ci + 1)), k = MS.indexOf(ym), O = Of || (Of = oracle(V)), r = O.rows[k];
    const open = V.plan.goals.filter(g => g.target > 0 && !(g.due && ym >= O.dueM(g)));   /* the burrows the screen offers: set, and not yet spent on its date */
    if (!open.length) continue;
    const g = rp(open), pC = playC(r), roomC = roomAfterC(O, r, g, ym), q = tag + ' feed ' + ym + ' ' + g.id + ' ';
    const how = rp(['room', 'play', 'under', 'under', 'over', 'cents', 'tiny', 'zero', 'neg', 'huge']);
    const mil = how === 'room' ? roomC * 10 : how === 'play' ? pC * 10 : how === 'under' ? Math.floor(Math.min(roomC, pC) * R()) * 10 + (yen ? 0 : rr(0, 9))
      : how === 'over' ? (Math.max(roomC, pC) + rr(1, 50000)) * 10 : how === 'cents' ? rr(1, 999999) * (yen ? 1000 : 10) + (yen ? 0 : rr(0, 9)) : how === 'tiny' ? rr(1, 15)
      : how === 'zero' ? 0 : how === 'neg' ? -rr(1, 100000) : 1e15;   /* the amount asked, in thousandths */
    const askedC = yen ? Math.floor(mil / 1000) * 100 : Math.floor(mil / 10), exp = Math.max(0, Math.min(askedC, pC, roomC));
    const moved = M.sweepPlay(V, ym, g.id, mil / 1000);
    ec(q + 'moved', moved, exp); ME.feeds++; if (exp < askedC && exp > 0) ME.feedsCut++;
    Of = oracle(V); const r2 = Of.rows[k];
    eq(q + 'free to spend after', playC(r2), pC - exp); eq(q + 'goal deposit after', r2.g[g.id].plannedC, r.g[g.id].plannedC + exp);
    eq(q + 'goal saved after', r2.g[g.id].actualC, r.g[g.id].actualC + exp); eq(q + 'left over unchanged', cc(r2.left), cc(r.left));
  }
  M.setCurYm(() => cur);
  try {
    /* 2. the answers, latest past month first. An answer only changes its own month and the months after it, so the figures worked out
       before the first answer still hold for every earlier month when its turn comes (they are all compared again at the end) */
    const Cn = M.calcAll(V), On = oracle(V, { cur });
    for (let k = ci - 1; k >= 0; k--) {
      const pm = MS[k], kind = rp(['none', 'bank', 'bank', 'goal', 'goal', 'goal', 'goal', 'hide', 'odd']);
      if (kind === 'none') continue;
      if (kind === 'hide') { sweepAt(pm, { hide: true }); continue; }
      const m = Cn.byYm[pm], O = On, r = O.rows[k];
      ec(tag + ' ' + pm + ' left to answer (before)', m.pendLeft, r.pendLeftC);
      if (kind === 'odd') {
        const amt = yen ? rr(1, 999999) : rr(1, 9999999) / 100, gs = V.plan.goals;
        const e = rp([{ amt, to: 'bank' }, { amt, id: 'gone' }].concat(gs.length ? [{ amt, id: rp(gs).id }, { amt: yen ? 1 : 0.01, id: rp(gs).id }, { amt: amt * 1000, id: rp(gs).id }] : []));
        e.t = 1; sweepAt(R() < .2 ? rp(MS.slice(ci)) : pm, e); continue;
      }
      if (!(r.pendLeftC >= 1)) continue;   /* nothing is asked when nothing is left */
      if (kind === 'bank') { sweepAt(pm, { amt: m.pendLeft, to: 'bank', t: 1 }); continue; }
      /* the goals Home offers: set, not full at the end of that month, still being saved for; now and then any goal */
      const open = V.plan.goals.filter(g => g.target > 0 && r.balC[g.id] < O.cap(g, pm) * 100 && !(g.due && pm >= O.dueM(g)));
      const pool = open.length && R() < .9 ? open : V.plan.goals; if (!pool.length) continue;
      const g = rp(pool), fit = M.topupFit(V, Cn, pm, g.id);
      ec(tag + ' ' + pm + ' ' + g.id + ' top-up fits', fit, Math.min(r.pendLeftC, roomAfterC(O, r, g, pm))); ME.fits++;
      if (fit > 0) sweepAt(pm, { amt: fit, id: g.id, t: 1 });
    }
    /* 3. changes after answering */
    if (R() < .4 && ci > 0) for (let n = rr(1, 3), O3 = oracle(V); n > 0; n--) {
      const pm = rp(MS.slice(0, ci)), keys = V.plan.lines.filter(l => l.jar === 'play').map(l => l.key).concat(['other']), r = O3.rows[MS.indexOf(pm)];
      const a = rp([rr(1, 50), Math.max(1, Math.round(r.jar.play * R())), r.jar.play, r.jar.play * 2 + 1]) + (yen ? 0 : rr(0, 99) / 100);
      M.addReceipt(V, pm + '-' + String(rr(1, 28)).padStart(2, '0'), a, rp(keys), '');
    }
    const eg = V.plan.goals.find(g => g.emergency);
    if (eg && R() < .25) { const v = rp([true, true, false, undefined]); if (v === undefined) delete eg.stretchOn; else eg.stretchOn = v; if (R() < .6) eg.stretchFrom = rp(MS); else delete eg.stretchFrom; if (R() < .5) eg.stretch = rr(0, Math.max(1, eg.target * 3)); }
    if (V.plan.goals.length && R() < .15) { const g = rp(V.plan.goals); M.updateGoal(V, g.id, { target: Math.floor(g.target * R()) }); }
    if (V.plan.goals.length && R() < .08) M.removeGoal(V, rp(V.plan.goals).id);
    if (R() < .04) V.receipts = [];
    /* compare */
    const C = M.calcAll(V), O = oracle(V, { cur }), last = C.months[C.months.length - 1];
    if (O.rows.some(r => r.pendLeftC !== undefined || r.countedC !== undefined)) ME.plans++;
    let bankC = cc(M.cfg(V, 'bankStart'));
    O.rows.forEach((r, i) => {
      const m = C.months[i], p = tag + ' now ' + cur + ', ' + r.ym + ' ', en = (V.ui.sweep || {})[r.ym];
      ec(p + 'left to answer', m.pendLeft, r.pendLeftC); ec(p + 'counted', m.counted, r.countedC);
      eq(p + 'top-up goal', m.topup ? m.topup.id : null, r.topup ? r.topup.id : null);
      ec(p + 'top-up amount', m.topup ? m.topup.amt : undefined, r.topup ? r.topup.amtC : undefined); ec(p + 'top-up used', m.topup ? m.topup.used : 0, r.topup ? r.topup.usedC : 0);
      ec(p + 'credit', m.credit, r.creditC);
      ['draw', 'inflow', 'goalsTotal', 'left', 'bankStart', 'bankPlanned', 'bankEnd', 'overNow', 'over'].forEach(k => ec(p + k, m[k], cc(r[k])));
      /* nothing is lost at month end: what was counted is what the goal took plus what went to the bank */
      checks++; if (m.counted !== undefined && cc(m.counted) !== cc((m.topup && m.topup.used) || 0) + cc(m.credit)) { if (fails.length < 40) fails.push(p + 'counted is not used + credit'); }
      bankC += cc(m.left) + cc(m.credit) - cc(m.overNow);
      V.plan.goals.forEach(g => {
        const a = m.g[g.id], o = r.g[g.id], q = p + g.id + ' ';
        ec(q + 'planned', a.planned, o.plannedC); ec(q + 'actual', a.actual, o.actualC); ec(q + 'top-up', a.up || 0, o.upC);
        ec(q + 'before', m.balBefore[g.id], r.beforeC[g.id]); ec(q + 'bal', m.bal[g.id], r.balC[g.id]); ec(q + 'spent', m.spent[g.id], r.spentC[g.id]);
        const gi = M.goalInfo(V, C, g.id, r.ym), go = oracleGoal(V, O, g.id, r.ym);
        eq(q + 'state', gi.state, go.state); eq(q + 'need', gi.need, go.need); eq(q + 'slack', gi.slack, go.slack); ec(q + 'had', gi.had, go.had === null ? undefined : cc(go.had)); eq(q + 'reached', gi.reached, go.reached);
      });
      eq(p + 'status', M.statusOf(V, m), r.bankEnd < M.cfg(V, 'minBank') ? 'short' : (r.left < 0 ? 'tight' : 'good'));
      if (!S0.receipts || !S0.receipts.length) comparePiles(V, C, r, p);   /* the piles were compared on the plan itself; here only when this copy got its first receipts */
      if (r.pendLeftC !== undefined) ME.open++; if (en && en.hide && r.ym < cur) ME.hide++;
      if (r.countedC !== undefined && !r.topup) ME.bank++;
      if (r.topup) {
        const g = V.plan.goals.find(x => x.id === r.topup.id);
        ME.goal++; if (r.topup.usedC > 0) ME.used++; if (r.topup.usedC % 100) ME.cents++; if (r.topup.usedC < r.topup.amtC) ME.cut++; if (!g) ME.gone++;
        if (g && g.emergency && g.stretchOn === true && g.stretchFrom && O.cap(g, r.ym) !== O.cap(g)) ME.stretch++;   /* before the yes counts, the fund stops at its target */
      }
      if (r.countedC !== undefined && en && typeof en.amt === 'number' && r.countedC < cc(en.amt)) ME.stale++;
    });
    eq(tag + ' month-end final bank', cc(last.bankEnd), bankC);
    V.plan.goals.forEach(g => { let tot = cc(g.start); C.months.forEach(m => { tot += cc(m.g[g.id].actual) + cc(m.g[g.id].up || 0) - (g.emergency ? cc(m.draw) : 0) - cc(m.spent[g.id]); }); eq(tag + ' ' + g.id + ' month-end goal money conserved', cc(last.bal[g.id]), tot); });
  } finally { M.setCurYm(null); }
}
for (let t = 0; t < N; t++) {
  const S = randomState({ debts: true }), tag = '#' + t + ' ' + S.ui.cur;
  if (t % 5 === 3) S.cfg.bankStart = -(1 + (t * 7919) % 250000);
  if (t % 4 === 1) S.cfg.planFrom = M.MONTHS[1 + (t * 31) % 6];   /* a quarter of the plans start after the first month (setup in a later month) */   /* every fifth plan starts overdrawn (38.31); kept out of randomState so the golden screens draw the same plans */
  const nRc = randomReceipts(S, rngOf(+(process.env.SEED || 1) * 1000003 + t * 7919 + 17));   /* most plans also get receipts, from their own random stream */
  if (nRc) RC.plans++;
  const stab = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
  const sortSteps = o => { const r = {}; Object.keys(o).forEach(k => { r[k] = o[k].slice().sort((a, b) => (a.from < b.from ? -1 : 1)); }); return r; };
  eq(tag + ' steps survive cleaning', stab(M.cleanSteps(S.steps)), stab(sortSteps(S.steps))); eq(tag + ' once survives cleaning', stab(M.cleanOnce(S.once)), stab(Object.fromEntries(Object.entries(S.once).filter(([k, v]) => Object.keys(v).length))));
  eq(tag + ' items survive cleaning', stab(M.cleanItems(S.items)), stab(S.items)); eq(tag + ' cfg survives cleaning', stab(M.cleanCfg(S.cfg)), stab(S.cfg));
  const C = M.calcAll(S), O = oracle(S);
  O.rows.forEach((r, i) => {
    const m = C.months[i], p = tag + ' ' + r.ym + ' ';
    ['a', 'b', 'side', 'draw', 'inflow', 'goalsTotal', 'left', 'bankStart', 'bankEnd'].forEach(k => eq(p + k, m[k], r[k]));
    /* receipts and spending past plan */
    ['bankPlanned', 'overNow', 'over'].forEach(k => eq(p + k, m[k], r[k]));
    const rs = M.receiptStats(S, r.ym);
    eq(p + 'receipts total', rs.total, r.rs.total); eq(p + 'receipts count', rs.count, r.rs.count);
    eq(p + 'receipts by line', stab(rs.byKey), stab(r.rs.byKey)); eq(p + 'receipts by place', stab(rs.byJar), stab(r.rs.byJar));
    if (nRc) {
      eq(p + 'bills past plan', m.overNec, r.overNec); eq(p + 'bills left', m.billsLeftM, r.billsLeft);
      eq(p + 'past plan by place', stab(m.overBits), stab(r.overBits)); eq(p + 'bank paid for an empty pile', stab(m.ovB), stab(r.ovB));
    }
    if (r.overNow > 0) RC.overMonths++; if (r.rs.count) RC.months++; if (r.rs.count && r.overNow === 0) RC.underMonths++; if (Object.keys(r.ovB).length) RC.pileMonths++;
    if (['edu', 'give'].some(j => (r.rs.byJar[j] || 0) > r.jar[j] && !r.ovB[j])) RC.pileCovered++;   /* past the month's plan, but what was kept from earlier months covered it */
    ['debtPay', 'debtInterest', 'debtOwed', 'debtStart', 'debtMin', 'debtExtra'].forEach(k => eq(p + k, m[k] === undefined ? 0 : m[k], r[k]));
    (S.plan.debts || []).forEach(d => ['start', 'interest', 'extra', 'pay', 'bal', 'paidPctWhole'].forEach(k => eq(p + d.id + ' debt ' + k, m.debts[d.id][k], r.debts[d.id][k])));
    eq(p + 'out', m.out, r.outflow); eq(p + 'billsTotal', m.billsTotal, r.bills); eq(p + 'itemsTotal', m.itemsTotal, r.items);
    ['nec', 'play', 'edu', 'ffa', 'give'].forEach(j => eq(p + 'jar ' + j, m.jar[j], r.jar[j]));
    S.plan.goals.forEach(g => {
      eq(p + g.id + ' planned', m.g[g.id].planned, r.g[g.id].planned); eq(p + g.id + ' actual', m.g[g.id].actual, r.g[g.id].actual);
      eq(p + g.id + ' bal', m.bal[g.id], r.bal[g.id]); eq(p + g.id + ' spent', m.spent[g.id], r.spent[g.id]); eq(p + g.id + ' before', m.balBefore[g.id], r.before[g.id]);
      /* things that must always be true */
      checks++; if (r.bal[g.id] < 0 || r.bal[g.id] > Math.max(O.cap(g), g.start)) { if (fails.length < 40) fails.push(p + g.id + ' balance out of range ' + r.bal[g.id] + ' cap ' + O.cap(g)); }
      if (g.due && r.ym > O.lastSave(g)) { checks++; if (m.g[g.id].planned !== 0) { if (fails.length < 40) fails.push(p + g.id + ' still saving after its date: ' + m.g[g.id].planned); } }
      const gi = M.goalInfo(S, C, g.id, r.ym), go = oracleGoal(S, O, g.id, r.ym);
      eq(p + g.id + ' state', gi.state, go.state); eq(p + g.id + ' need', gi.need, go.need); eq(p + g.id + ' slack', gi.slack, go.slack); eq(p + g.id + ' had', gi.had, go.had); eq(p + g.id + ' reached', gi.reached, go.reached);
    });
    eq(p + 'status', M.statusOf(S, m), r.bankEnd < M.cfg(S, 'minBank') ? 'short' : (r.left < 0 ? 'tight' : 'good'));
    /* the piles Home draws; and with no month taken as now, nothing is asked or counted at month end */
    comparePiles(S, C, r, p);
    eq(p + 'no month-end figures', [m.pendLeft, m.counted, m.topup, m.credit].join('|'), '|||0');
    /* the jars and their percents */
    /* 38.30 rule: percents are shares of real pay, never of money borrowed from the emergency fund; borrowed money that is left over is not pay waiting to be placed */
    const J = M.jarsOf(S, m), inn = r.inflow, outv = r.outflow, rest = Math.max(0, inn - outv), short = Math.max(0, outv - inn), realPay = inn - r.draw, base = short > 0 ? outv : (r.draw > 0 && realPay > 0 ? realPay : inn);
    const borrowedLeft = Math.min(rest, r.draw);
    /* spending past plan this month is paid first from pay that had no place (its own share, next to "not placed"), then from borrowed
       emergency money still in the bank; borrowed money it does not use stays in the bank. Worked in whole cents (receipts carry cents). */
    const cents = x => Math.round(x * 100), overC = cents(r.overNow), unplacedC = cents(rest) - cents(borrowedLeft), usedOverC = Math.min(unplacedC, overC);
    const keptC = Math.max(0, cents(borrowedLeft) - Math.max(0, overC - unplacedC));
    const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest - borrowedLeft];
    const valsC = vals.slice(0, 6).map(cents).concat([unplacedC - usedOverC, usedOverC]);
    const pc = oraclePercents(valsC, cents(base));
    J.list.forEach((j, k) => { eq(p + 'jar amount ' + j.id, j.v, vals[k]); eq(p + 'jar pct ' + j.id, j.pct, pc[k]); });
    eq(p + 'rest', J.rest, rest); eq(p + 'borrowed left', J.restCover, borrowedLeft); eq(p + 'restPct', J.restPct, pc[6]); eq(p + 'short', J.short, short);
    eq(p + 'pay used past plan', cents(J.usedOver), usedOverC); eq(p + 'pay used past plan pct', J.usedOverPct, pc[7]);
    eq(p + 'borrowed kept', cents(J.restKept), keptC); eq(p + 'borrowed spent past plan', cents(J.restSpent), cents(borrowedLeft) - keptC);
    eq(p + 'not placed after spending past plan', cents(J.unplacedNet), unplacedC - usedOverC);
    if (DBG.indexOf(String(t) + ' ' + r.ym) >= 0) console.log('DBG', t, r.ym, JSON.stringify({ vals, base, inn, outv, rest, short, app: J.list.map(j => j.pct).concat([J.restPct, J.usedOverPct]), orc: pc, appBase: J.income }));
    /* places + not placed = 100 + borrowed, always: the borrowed part is the emergency-fund money the plan uses up, as a whole percent of real pay */
    const borrowUsed = short > 0 ? 0 : Math.max(0, r.draw - borrowedLeft), sumPct = pc.reduce((a, b) => a + b, 0);
    const expBorrowPct = borrowUsed > 0 && base === realPay ? Math.floor((borrowUsed * 200 + base) / (2 * base)) : 0;
    eq(p + 'borrowed used', J.borrowUsed, borrowUsed); eq(p + 'borrowed used pct', J.borrowUsedPct, Math.max(0, sumPct - 100));
    const sumAll = valsC.reduce((a, b) => a + b, 0), baseC = cents(base);
    checks++; if (base > 0 && sumAll >= baseC && sumPct !== 100 + expBorrowPct) { if (fails.length < 40) fails.push(p + 'percents add to ' + sumPct + ', expected ' + (100 + expBorrowPct)); }
    checks++; if (base > 0 && sumAll < baseC && sumPct > 100) { if (fails.length < 40) fails.push(p + 'percents add to ' + sumPct + ' with less than the base placed'); }
    eq(p + 'placed pct', J.placedPct, sumPct - pc[6] - pc[7]);
  });
  /* cards and loans: pay-off month, never, totals, and which to pay first */
  const DR = M.debtRows(S, C);
  eq(tag + ' debt rows', DR.length, O.debtRows.length);
  O.debtRows.forEach((o, k) => { const a = DR[k] || {}; ['id', 'payoffYm', 'never', 'totalInterest', 'totalPaid', 'first', 'done'].forEach(f => eq(tag + ' ' + o.id + ' row ' + f, a[f], o[f])); });
  /* the bank rolls forward exactly by what is left each month, less what was spent past plan (in whole cents) */
  const cc = x => Math.round(x * 100), last = C.months[C.months.length - 1];
  let b = cc(M.cfg(S, 'bankStart')), ov = 0; C.months.forEach(m => { b += cc(m.left) - cc(m.overNow); ov += cc(m.overNow); });
  eq(tag + ' final bank', cc(last.bankEnd), b); eq(tag + ' spent past plan adds up', cc(last.over), ov);
  /* nothing is created or lost inside the goals: start + saved - withdrawn - spent = what is left */
  S.plan.goals.forEach(g => { let tot = g.start; C.months.forEach(m => { tot += m.g[g.id].actual - (g.emergency ? m.draw : 0) - m.spent[g.id]; }); eq(tag + ' ' + g.id + ' goal money conserved', C.months[C.months.length - 1].bal[g.id], tot); });
  /* month-end answers and burrow feeds, on a copy, from their own random stream */
  monthEndCase(S, rngOf(+(process.env.SEED || 1) * 2000029 + t * 104729 + 91), tag);
}
/* the first line ends with the mismatch count (verify.sh reads it there) */
console.log('random plans', N, '(' + RC.plans + ' with receipts: ' + RC.months + ' months logged, ' + RC.underMonths + ' all within plan, ' + RC.overMonths + ' past plan, ' + RC.pileCovered + ' kept money covered, ' + RC.pileMonths + ' bank paid for an empty pile) | comparisons', checks, '| mismatches', fails.length);
console.log('piles: ' + ME.pileOver + ' months a pile is over, ' + ME.ffaPast + ' months Investing logged past plan | burrow feeds ' + ME.feeds + ' (' + ME.feedsCut + ' cut to fit) | month-end: ' + ME.plans + ' plans asked, ' + ME.open + ' months open, ' + ME.bank + ' counted in the bank, ' + ME.goal + ' toward a goal (' + ME.used + ' used, ' + ME.cents + ' with cents, ' + ME.stretch + ' before a longer-goal yes counts, ' + ME.cut + ' cut by the room, ' + ME.gone + ' goal gone), ' + ME.hide + ' hidden, ' + ME.stale + ' less left than answered, ' + ME.fits + ' top-up fits checked');
fails.slice(0, 40).forEach(f => console.log(' ', f));
process.exit(fails.length ? 1 : 0);
