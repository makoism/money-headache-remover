/* An independent recomputation of the whole money model, written from the plain rules and NOT from the app's code.
   It reads only the raw saved plan (lines, goals, steps, once, items, cfg) and works in whole numbers.
   Then it compares everything the app's calcAll / goalInfo / jarsOf / receiptStats report. */
const vm = require('vm'), fs = require('fs');
const ctx = vm.createContext({ console, Math, JSON, Date });
vm.runInContext(fs.readFileSync(process.env.MODEL || '/home/claude/work/team/model.js', 'utf8') + '\n;this.__M={presetState,calcAll,goalInfo,jarsOf,statusOf,receiptStats,addReceipt,setVal,addLine,addGoal,updateGoal,updateLine,emergencyGoal,MONTHS,START,SAVE_FROM,SAMPLES,SPAN,JARS,cfg,roundUnit,round2,lineByKey,wholePercents,cleanSteps,cleanOnce,cleanItems,cleanCfg,fixes,trimPlay,viewOf,sheetCsv,sheetRows,purposeOf,pickMain,kindOfGoal,goalRows,wholePct,PURPOSE_VERBS};', ctx);
const M = ctx.__M;

/* ---------- the oracle ---------- */
const PAY_OF = { '₱': 30000, '¥': 200000, '€': 1650 };
const mIdx = ym => +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1);
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);           // whole numbers only
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
  const goalDefault = (g, ym) => {
    if (g.due) { const rest = Math.max(0, g.target - g.start); if (rest === 0) return 0; const ls = lastSave(g); if (ym > ls) return 0; const n = mIdx(ls) - mIdx(first) + 1; if (n < 1) return 0; return ceilDiv(rest, n * unit) * unit; }
    if (typeof g.monthly === 'number') return g.monthly;
    const rest = Math.max(0, g.target - g.start); if (rest === 0) return 0; return ceilDiv(rest, 12 * unit) * unit;
  };
  const goalValue = (g, ym) => { if (g.due && ym > lastSave(g)) return 0; return valueOf('goal:' + g.id, ym, () => goalDefault(g, ym)); };
  const lineValue = (l, ym) => valueOf(l.key, ym, () => l.def);
  const eg = goals.find(g => g.emergency) || null;
  const cap = g => g.emergency ? Math.max(g.stretch || 0, g.target) : g.target;
  let bank = M.cfg(S, 'bankStart');
  const bal = {}; goals.forEach(g => { bal[g.id] = g.start; });
  const reached = {}; const out = [];
  const freedLines = lines.filter(l => l.ends && l.redirect).map(l => ({ ends: l.ends, amt: lineValue(l, l.ends) }));
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
    goals.forEach(g => { if (g.target > 0 && reached[g.id] === undefined && bal[g.id] >= g.target) reached[g.id] = ym; });
    r.spent = {};
    goals.forEach(g => { r.spent[g.id] = 0; if (g.due && g.target > 0 && ym === dueM(g)) { r.spent[g.id] = Math.min(bal[g.id], g.target); bal[g.id] -= r.spent[g.id]; } });
    r.bal = Object.assign({}, bal); out.push(r);
  });
  return { rows: out, reached, lastSave, dueM, cap };
}
/* the status of one goal in one month, again from the plain rules */
function oracleGoal(S, O, id, ym) {
  const g = S.plan.goals.find(x => x.id === id), row = O.rows.find(r => r.ym === ym);
  const reached = O.reached[id] || null, ls = O.lastSave(g), dm = O.dueM(g);
  let state, need = null, slack = null, had = null;
  if (!(g.target > 0)) state = 'unset';
  else if (dm && ym >= dm) { had = O.rows.find(r => r.ym === dm).spent[id]; state = had >= g.target ? 'paid' : 'short'; }
  else if (ls) {
    state = reached && reached <= ls ? (row.bal[id] >= g.target ? 'full' : 'ontrack') : 'behind';
    slack = reached ? mIdx(ls) - mIdx(reached) : null;
    if (ym <= ls) need = Math.max(0, ceilDiv(Math.max(0, g.target - row.before[id]), mIdx(ls) - mIdx(ym) + 1));
  } else state = row.bal[id] >= g.target ? 'full' : (reached ? 'eta' : 'noeta');
  return { state, need, slack, had, reached };
}
/* whole percents that add to 100, by integer arithmetic: floor each share, give spare points to the biggest remainders (lower position wins a tie) */
function oraclePercents(vals, base) {
  const v = vals.map(x => Math.max(0, x)), sum = v.reduce((a, b) => a + b, 0);
  if (!(base > 0) || !(sum > 0)) return v.map(() => 0);
  const den = Math.min(sum, base), fl = v.map(x => Math.floor(x * 100 / den)), rem = v.map((x, i) => x * 100 - fl[i] * den);
  let spare = 100 - fl.reduce((a, b) => a + b, 0);
  v.map((x, i) => i).filter(i => v[i] > 0).sort((a, b) => rem[b] - rem[a] || a - b).slice(0, Math.max(0, spare)).forEach(i => { fl[i]++; });
  return fl;
}

/* ---------- random plans ---------- */
let seed = +(process.env.SEED || 1);
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)], ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
function randomState() {
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
    if (g.emergency) { g.stretch = rnd() < .5 ? ri(0, g.target * 3) : g.stretch; if (rnd() < .2) g.due = ''; }
    if (!g.due && rnd() < .5) g.monthly = ri(0, Math.round(pay * .3));
    if (rnd() < .5) M.setVal(S, 'goal:' + g.id, pick(M.MONTHS), ri(0, Math.round(pay * .4)), rnd() < .6 ? 'after' : 'once');
    if (rnd() < .3) M.setVal(S, 'goal:' + g.id, pick(M.MONTHS), ri(0, Math.round(pay * .4)), 'after');
  });
  if (rnd() < .4) S.items[pick(M.MONTHS)] = [{ id: 'i1', label: 'x', amount: ri(0, pay) }, { id: 'i2', label: 'y', amount: ri(0, Math.round(pay / 3)) }];
  if (rnd() < .4) M.setVal(S, 'draw', pick(M.MONTHS), ri(0, pay * 2), 'once');
  if (rnd() < .2) M.setVal(S, 'draw', pick(M.MONTHS), ri(0, pay * 2), 'once');
  return S;
}

module.exports = { M, oracle, oracleGoal, oraclePercents, randomState, rnd, pick, ri, setSeed: v => { seed = v; } };
if (require.main !== module) return;
/* ---------- compare ---------- */
let fails = [], checks = 0;
const eq = (ctxMsg, a, b) => { checks++; if (a !== b && !(Number.isNaN(a) && Number.isNaN(b))) { if (fails.length < 40) fails.push(ctxMsg + ': app ' + JSON.stringify(a) + ' vs independent ' + JSON.stringify(b)); else fails.length++; } };
const N = +(process.env.N || 3000); const DBG = process.env.DBG ? process.env.DBG.split(',') : [];
for (let t = 0; t < N; t++) {
  const S = randomState(), tag = '#' + t + ' ' + S.ui.cur;
  const stab = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
  const sortSteps = o => { const r = {}; Object.keys(o).forEach(k => { r[k] = o[k].slice().sort((a, b) => (a.from < b.from ? -1 : 1)); }); return r; };
  eq(tag + ' steps survive cleaning', stab(M.cleanSteps(S.steps)), stab(sortSteps(S.steps))); eq(tag + ' once survives cleaning', stab(M.cleanOnce(S.once)), stab(Object.fromEntries(Object.entries(S.once).filter(([k, v]) => Object.keys(v).length))));
  eq(tag + ' items survive cleaning', stab(M.cleanItems(S.items)), stab(S.items)); eq(tag + ' cfg survives cleaning', stab(M.cleanCfg(S.cfg)), stab(S.cfg));
  const C = M.calcAll(S), O = oracle(S);
  O.rows.forEach((r, i) => {
    const m = C.months[i], p = tag + ' ' + r.ym + ' ';
    ['a', 'b', 'side', 'draw', 'inflow', 'goalsTotal', 'left', 'bankStart', 'bankEnd'].forEach(k => eq(p + k, m[k], r[k]));
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
    const J = M.jarsOf(S, m), inn = r.inflow, outv = r.outflow, rest = Math.max(0, inn - outv), short = Math.max(0, outv - inn), base = short > 0 ? outv : inn;
    const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest];
    const pc = oraclePercents(vals, base);
    J.list.forEach((j, k) => { eq(p + 'jar amount ' + j.id, j.v, vals[k]); eq(p + 'jar pct ' + j.id, j.pct, pc[k]); });
    eq(p + 'rest', J.rest, rest); eq(p + 'restPct', J.restPct, pc[6]); eq(p + 'short', J.short, short);
    if (DBG.indexOf(String(t) + ' ' + r.ym) >= 0) console.log('DBG', t, r.ym, JSON.stringify({ vals, base, inn, outv, rest, short, app: J.list.map(j => j.pct).concat([J.restPct]), orc: pc, appBase: J.income }));
    const sumPct = pc.reduce((a, b) => a + b, 0); checks++; if (base > 0 && sumPct !== 100) { if (fails.length < 40) fails.push(p + 'percents add to ' + sumPct); }
  });
  /* the bank rolls forward exactly by what is left each month */
  let b = M.cfg(S, 'bankStart'); C.months.forEach(m => { b += m.left; }); eq(tag + ' final bank', C.months[C.months.length - 1].bankEnd, b);
  /* nothing is created or lost inside the goals: start + saved - withdrawn - spent = what is left */
  S.plan.goals.forEach(g => { let tot = g.start; C.months.forEach(m => { tot += m.g[g.id].actual - (g.emergency ? m.draw : 0) - m.spent[g.id]; }); eq(tag + ' ' + g.id + ' goal money conserved', C.months[C.months.length - 1].bal[g.id], tot); });
}
console.log('random plans', N, '| comparisons', checks, '| mismatches', fails.length);
fails.slice(0, 40).forEach(f => console.log(' ', f));
process.exit(fails.length ? 1 : 0);
