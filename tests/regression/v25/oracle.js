/* An independent recomputation of the whole money model, written from the plain rules and NOT from the app's code.
   It reads only the raw saved plan (lines, goals, steps, once, items, cfg) and works in whole numbers.
   Then it compares everything the app's calcAll / goalInfo / jarsOf / receiptStats report. */
const vm = require('vm'), fs = require('fs');
const ctx = vm.createContext({ console, Math, JSON, Date });
vm.runInContext(fs.readFileSync(process.env.MODEL || '/home/claude/work/team/model.js', 'utf8') + '\n;this.__M={debtRows,limitsOf,lookBack,addExtraMoney,debtsOf,presetState,calcAll,goalInfo,jarsOf,statusOf,receiptStats,addReceipt,setVal,addLine,addGoal,updateGoal,updateLine,emergencyGoal,MONTHS,START,SAVE_FROM,SAMPLES,SPAN,JARS,cfg,roundUnit,round2,lineByKey,wholePercents,cleanSteps,cleanOnce,cleanItems,cleanCfg,fixes,trimPlay,viewOf,sheetCsv,sheetRows,purposeOf,pickMain,kindOfGoal,goalRows,wholePct,PURPOSE_VERBS,setCurYm:typeof setCurYm!=="undefined"?setCurYm:null,proofOf:typeof proofOf!=="undefined"?proofOf:null,planCells:typeof planCells!=="undefined"?planCells:null};', ctx);
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
function oracle(S) {
  const months = M.MONTHS, first = months[0];
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
  const cap = g => (g.emergency && g.stretchOn === true) ? Math.max(g.stretch || 0, g.target) : g.target;
  let bank = M.cfg(S, 'bankStart');
  const bal = {}; goals.forEach(g => { bal[g.id] = g.start; });
  const reached = {}; const out = [];
  const freedLines = lines.filter(l => l.ends && l.redirect).map(l => ({ ends: l.ends, amt: lineValue(l, l.ends) }));
  const debts = (S.plan && Array.isArray(S.plan.debts)) ? S.plan.debts : [], owed = {};
  debts.forEach(d => { owed[d.id] = d.balance; });
  months.forEach(ym => {
    const r = { ym };
    r.a = valueOf('a', ym, () => payDefault); r.b = valueOf('b', ym, () => 0); r.side = valueOf('side', ym, () => 0);
    r.draw = eg ? Math.min(valueOf('draw', ym, () => 0), Math.max(0, bal[eg.id])) : 0;
    r.jar = { nec: 0, play: 0, edu: 0, ffa: 0, give: 0 };
    r.lineVals = lines.map(l => { const on = !l.ends || ym <= l.ends; return { key: l.key, name: l.name, jar: l.jar, on, v: on ? lineValue(l, ym) : 0 }; });
    r.lineVals.forEach(x => { r.jar[x.jar] += x.v; });
    r.bills = r.jar.nec;
    r.items = (S.items[ym] || []).reduce((s, i) => s + (+i.amount || 0), 0);
    r.jar.nec += r.items;
    r.debts = {}; r.debtPay = 0; r.debtInterest = 0; r.debtStart = 0; r.debtMin = 0;
    debts.forEach(d => {
      const x = debtMonth(owed[d.id], rateA(d), d.min, Math.max(0, valueOf('debt:' + d.id, ym, () => d.extra)));
      /* how much of the first balance is paid off by the end of this month, as a whole percent (a half rounds up), never below 0; nothing owed at first counts as all paid */
      x.paidPctWhole = d.balance > 0 ? Math.max(0, Math.min(100, Math.floor((200 * (d.balance - x.bal) + d.balance) / (2 * d.balance)))) : 100;
      owed[d.id] = x.bal; r.debts[d.id] = x;
      r.debtPay += x.pay; r.debtInterest += x.interest; r.debtStart += x.start; r.debtMin += Math.min(d.min, x.start + x.interest);
    });
    r.debtOwed = debts.reduce((a, d) => a + owed[d.id], 0); r.debtExtra = r.debtPay - r.debtMin;
    r.jar.nec += r.debtPay;
    const freed = freedLines.reduce((s, f) => s + (ym > f.ends ? f.amt : 0), 0);
    r.before = Object.assign({}, bal); r.g = {}; r.goalsTotal = 0;
    goals.forEach(g => {
      const isE = !!(eg && g.id === eg.id);
      const planned = goalValue(g, ym) + (isE ? freed : 0);
      const room = Math.max(0, cap(g) - bal[g.id]);
      const actual = Math.min(planned, room);
      r.g[g.id] = { planned, actual }; r.goalsTotal += actual;
    });
    r.inflow = r.a + r.b + r.side + r.draw;
    r.outflow = r.jar.nec + r.jar.play + r.jar.edu + r.jar.ffa + r.jar.give + r.goalsTotal;
    r.left = r.inflow - r.outflow;
    r.bankStart = bank; bank += r.left; r.bankEnd = bank;
    goals.forEach(g => { bal[g.id] += r.g[g.id].actual - (eg && g.id === eg.id ? r.draw : 0); });
    goals.forEach(g => { if (g.target > 0 && reached[g.id] === undefined && bal[g.id] >= cap(g)) reached[g.id] = ym; });
    r.spent = {};
    goals.forEach(g => { r.spent[g.id] = 0; if (g.due && g.target > 0 && ym === dueM(g)) { r.spent[g.id] = Math.min(bal[g.id], g.target); bal[g.id] -= r.spent[g.id]; } });
    r.bal = Object.assign({}, bal); out.push(r);
  });
  oracleOverspend(S, out, lines);
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
/* 38.30 rule, recounted from the plain words and in whole cents: money spent past what a month planned comes out of the bank and stays out in every later month.
   Only when at least one receipt exists. Per month:
   - Bills and basics are judged line by line: what was logged on a line past that line's plan (a line that has ended plans 0).
   - Other: what was logged as Other past the month's one-time costs (a one-time cost is money already set aside for it).
   - Free to spend and Investing: what was logged past the month's plan for them.
   - Education and Giving are burrows that keep what is not spent: each holds the plans so far minus what was logged on it.
     If a burrow would drop below zero, that part comes out of the bank and the burrow is empty, not negative.
   r.bankPlanned keeps the bank before this rule; r.bankStart and r.bankEnd become the real bank. */
function oracleOverspend(S, rows, lines) {
  const C = x => Math.round((+x || 0) * 100), rc = S.receipts || [];
  rows.forEach(r => { r.bankPlanned = r.bankEnd; r.overNow = 0; r.over = 0; r.ovB = {}; });
  if (!rc.length) return;
  const jarOfKey = k => { const l = lines.find(x => x.key === k); return l ? l.jar : 'other'; };
  const stock = { edu: 0, give: 0 }; let cum = 0;
  rows.forEach(r => {
    const byKey = {}, byJar = {};
    rc.filter(x => String(x.d).slice(0, 7) === r.ym).forEach(x => { byKey[x.c] = (byKey[x.c] || 0) + C(x.a); const j = jarOfKey(x.c); byJar[j] = (byJar[j] || 0) + C(x.a); });
    let inc = 0;
    r.lineVals.filter(l => l.jar === 'nec').forEach(l => { inc += Math.max(0, (byKey[l.key] || 0) - C(l.v)); });
    inc += Math.max(0, (byJar.other || 0) - C(r.items));
    inc += Math.max(0, (byJar.play || 0) - C(r.jar.play));
    inc += Math.max(0, (byJar.ffa || 0) - C(r.jar.ffa));
    ['edu', 'give'].forEach(j => { stock[j] += C(r.jar[j]) - (byJar[j] || 0); if (stock[j] < 0) { inc += -stock[j]; r.ovB[j] = -stock[j] / 100; stock[j] = 0; } });   /* r.ovB: the part the bank paid this month */
    r.bankStart = (C(r.bankStart) - cum) / 100; cum += inc; r.overNow = inc / 100; r.over = cum / 100; r.bankEnd = (C(r.bankEnd) - cum) / 100;
  });
}
/* the status of one goal in one month, again from the plain rules */
function oracleGoal(S, O, id, ym) {
  const g = S.plan.goals.find(x => x.id === id), row = O.rows.find(r => r.ym === ym);
  const reached = O.reached[id] || null, ls = O.lastSave(g), dm = O.dueM(g);
  const T = O.cap(g);   /* 38.30 rule: every goal is judged against its cap (the target, or the longer goal once the person said yes) */
  let state, need = null, slack = null, had = null;
  if (!(T > 0)) state = 'unset';
  else if (dm && ym >= dm) { had = O.rows.find(r => r.ym === dm).spent[id]; state = had >= T ? 'paid' : 'short'; }
  else if (ls) {
    state = reached && reached <= ls ? (row.bal[id] >= T ? 'full' : 'ontrack') : 'behind';
    slack = reached ? mIdx(ls) - mIdx(reached) : null;
    if (ym <= ls) need = Math.max(0, ceilDiv(Math.max(0, T - row.before[id]), mIdx(ls) - mIdx(ym) + 1));
  } else state = row.bal[id] >= T ? 'full' : (reached ? 'eta' : 'noeta');
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
    if (g.emergency) { g.stretch = rnd() < .5 ? ri(0, g.target * 3) : g.stretch; if (rnd() < .2) g.due = ''; if (rnd() < .5) g.stretchOn = true; }
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

module.exports = { M, oracle, oracleGoal, oraclePercents, randomState, rnd, pick, ri, setSeed: v => { seed = v; } };
if (require.main !== module) return;
/* ---------- compare ---------- */
let fails = [], checks = 0;
const eq = (ctxMsg, a, b) => { checks++; if (a !== b && !(Number.isNaN(a) && Number.isNaN(b))) { if (fails.length < 40) fails.push(ctxMsg + ': app ' + JSON.stringify(a) + ' vs independent ' + JSON.stringify(b)); else fails.length++; } };
const N = +(process.env.N || 3000); const DBG = process.env.DBG ? process.env.DBG.split(',') : [];
for (let t = 0; t < N; t++) {
  const S = randomState({ debts: true }), tag = '#' + t + ' ' + S.ui.cur;
  if (t % 5 === 3) S.cfg.bankStart = -(1 + (t * 7919) % 250000);   /* every fifth plan starts overdrawn (38.31); kept out of randomState so the golden screens draw the same plans */
  const stab = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
  const sortSteps = o => { const r = {}; Object.keys(o).forEach(k => { r[k] = o[k].slice().sort((a, b) => (a.from < b.from ? -1 : 1)); }); return r; };
  eq(tag + ' steps survive cleaning', stab(M.cleanSteps(S.steps)), stab(sortSteps(S.steps))); eq(tag + ' once survives cleaning', stab(M.cleanOnce(S.once)), stab(Object.fromEntries(Object.entries(S.once).filter(([k, v]) => Object.keys(v).length))));
  eq(tag + ' items survive cleaning', stab(M.cleanItems(S.items)), stab(S.items)); eq(tag + ' cfg survives cleaning', stab(M.cleanCfg(S.cfg)), stab(S.cfg));
  const C = M.calcAll(S), O = oracle(S);
  O.rows.forEach((r, i) => {
    const m = C.months[i], p = tag + ' ' + r.ym + ' ';
    ['a', 'b', 'side', 'draw', 'inflow', 'goalsTotal', 'left', 'bankStart', 'bankEnd'].forEach(k => eq(p + k, m[k], r[k]));
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
    /* the jars and their percents */
    /* 38.30 rule: percents are shares of real pay, never of money borrowed from the emergency fund; borrowed money that is left over is not pay waiting to be placed */
    const J = M.jarsOf(S, m), inn = r.inflow, outv = r.outflow, rest = Math.max(0, inn - outv), short = Math.max(0, outv - inn), realPay = inn - r.draw, base = short > 0 ? outv : (r.draw > 0 && realPay > 0 ? realPay : inn);
    const borrowedLeft = Math.min(rest, r.draw);
    const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest - borrowedLeft];
    const pc = oraclePercents(vals, base);
    J.list.forEach((j, k) => { eq(p + 'jar amount ' + j.id, j.v, vals[k]); eq(p + 'jar pct ' + j.id, j.pct, pc[k]); });
    eq(p + 'rest', J.rest, rest); eq(p + 'borrowed left', J.restCover, borrowedLeft); eq(p + 'restPct', J.restPct, pc[6]); eq(p + 'short', J.short, short);
    if (DBG.indexOf(String(t) + ' ' + r.ym) >= 0) console.log('DBG', t, r.ym, JSON.stringify({ vals, base, inn, outv, rest, short, app: J.list.map(j => j.pct).concat([J.restPct]), orc: pc, appBase: J.income }));
    /* places + not placed = 100 + borrowed, always: the borrowed part is the emergency-fund money the plan uses up, as a whole percent of real pay */
    const borrowUsed = short > 0 ? 0 : Math.max(0, r.draw - borrowedLeft), sumPct = pc.reduce((a, b) => a + b, 0);
    const expBorrowPct = borrowUsed > 0 && base === realPay ? Math.floor((borrowUsed * 200 + base) / (2 * base)) : 0;
    eq(p + 'borrowed used', J.borrowUsed, borrowUsed); eq(p + 'borrowed used pct', J.borrowUsedPct, Math.max(0, sumPct - 100));
    const sumAll = vals.reduce((a, b) => a + b, 0);
    checks++; if (base > 0 && sumAll >= base && sumPct !== 100 + expBorrowPct) { if (fails.length < 40) fails.push(p + 'percents add to ' + sumPct + ', expected ' + (100 + expBorrowPct)); }
    checks++; if (base > 0 && sumAll < base && sumPct > 100) { if (fails.length < 40) fails.push(p + 'percents add to ' + sumPct + ' with less than the base placed'); }
    eq(p + 'placed pct', J.placedPct, sumPct - pc[6]);
  });
  /* cards and loans: pay-off month, never, totals, and which to pay first */
  const DR = M.debtRows(S, C);
  eq(tag + ' debt rows', DR.length, O.debtRows.length);
  O.debtRows.forEach((o, k) => { const a = DR[k] || {}; ['id', 'payoffYm', 'never', 'totalInterest', 'totalPaid', 'first', 'done'].forEach(f => eq(tag + ' ' + o.id + ' row ' + f, a[f], o[f])); });
  /* the bank rolls forward exactly by what is left each month */
  let b = M.cfg(S, 'bankStart'); C.months.forEach(m => { b += m.left; }); eq(tag + ' final bank', C.months[C.months.length - 1].bankEnd, b);
  /* nothing is created or lost inside the goals: start + saved - withdrawn - spent = what is left */
  S.plan.goals.forEach(g => { let tot = g.start; C.months.forEach(m => { tot += m.g[g.id].actual - (g.emergency ? m.draw : 0) - m.spent[g.id]; }); eq(tag + ' ' + g.id + ' goal money conserved', C.months[C.months.length - 1].bal[g.id], tot); });
}
console.log('random plans', N, '| comparisons', checks, '| mismatches', fails.length);
fails.slice(0, 40).forEach(f => console.log(' ', f));
process.exit(fails.length ? 1 : 0);
