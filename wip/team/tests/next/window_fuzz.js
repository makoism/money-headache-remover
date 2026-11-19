/* ROLLING MONTH WINDOW FUZZ (tests/next, side session C, 2026-11-19).
   EXPECTED TO FAIL until the rolling window is built (PLAN.md section D, step 11: "right after 38.31 ships and before step B").
   Run: node tests/next/window_fuzz.js [count] [seed]      Ends with "WINDOW FUZZ PASS" or "WINDOW FUZZ FAIL n".

   What it guards, in plain rules:
   1. The months move with today's date. Today the app only knows Nov 2026 to Oct 2028 (model.js START and END; PLAN.md section C:
      "After Oct 2028 there are no months"). With the window, today's month is always one of the app's months, and there are months
      after it to plan (PLAN.md step 11: "Nothing unknown about future months").
   2. Every saved plan keeps its numbers when the window moves. A month that is in the window before and after the move shows the same
      pay, bills, goal money, money left, bank at the start and bank at the end, to the cent (DECISIONS.md "The numbers": one dataset,
      everything derives from it; priority 1: accuracy and stability like a spreadsheet).
   3. Nothing before or after is lost. Amounts typed for a month that leaves the window, extra costs, receipts and settings stay in the
      saved copy, and when today moves back over that month they show again exactly (DECISIONS.md priority 1: "Nobody loses data").
      Note: today model.js cleanOnce and cleanItems drop any month outside MONTHS when a saved copy loads, so a moving window would lose
      them unless that changes.
   How far back and ahead the window reaches is not in the docs: see SIDE_C_QUESTIONS.md W1 to W3. Those checks print WAIT.
   The app hook is windowAt() in tests/next/lib.js. */
const { loadModel, windowAt, windowBuilt, Report, Rand, cents } = require('./lib');
const N = +(process.argv[2] || 300), R = Rand(+(process.argv[3] || 20261119));
const { rnd, ri, pick, chance } = R;
const rep = Report('window fuzz');
const M = loadModel();
if (!windowBuilt(M)) rep.missing('the rolling window: model.js has no setToday(ymd) (hook windowAt in tests/next/lib.js). The checks below run on the fixed months and fail where they move');

const ymOf = d => d.slice(0, 7);
const dayIn = ym => ym + '-' + String(ri(1, 28)).padStart(2, '0');
const amt = () => pick([0, 1, 50, ri(100, 5000), ri(1000, 60000), ri(10000, 400000), ri(1, 99999) / 100]);
const J = JSON.stringify;

/* the figures a month shows, as whole cents, so two runs compare exactly */
function figures(m) {
  const f = { inflow: cents(m.inflow), out: cents(m.out), left: cents(m.left), bankStart: cents(m.bankStart), bankEnd: cents(m.bankEnd), goalsTotal: cents(m.goalsTotal), draw: cents(m.draw || 0) };
  Object.keys(m.jar).forEach(j => { f['jar.' + j] = cents(m.jar[j]); });
  Object.keys(m.bal || {}).forEach(g => { f['goal.' + g] = cents(m.bal[g]); });
  return f;
}
function sameFigures(tag, a, b) {
  const fa = figures(a), fb = figures(b), keys = new Set(Object.keys(fa).concat(Object.keys(fb)));
  let ok = true; for (const k of keys) if (fa[k] !== fb[k]) { ok = false; rep.ok(false, `${tag} ${a.ym} ${k}: ${fa[k] / 100} before the move, ${fb[k] / 100} after`); break; }
  if (ok) rep.ok(true, '');
}

/* a random plan, made the way a person makes one: through the model's own functions, inside the months the app showed that day */
function randomPlan(months) {
  const S = M.presetState(pick(['¥', '₱', '$', '€', '¥']));
  if (chance(.5)) S.cfg.bankStart = pick([0, ri(0, 300000), -ri(1, 50000), ri(1, 9999999) / 100]);
  const keys = () => ['a', 'b', 'side'].concat(S.plan.lines.map(l => l.key), S.plan.goals.map(g => 'goal:' + g.id));
  for (let i = ri(0, 12); i > 0; i--) M.setVal(S, pick(keys()), pick(months), amt(), pick(['after', 'once', 'month']));
  for (let i = ri(0, 2); i > 0; i--) { const id = M.addGoal(S, 'w' + i); if (id) M.updateGoal(S, id, { target: amt(), start: amt(), due: chance(.5) ? dayIn(pick(months)) : '' }); }
  for (let i = ri(0, 3); i > 0; i--) { const ym = pick(months); S.items[ym] = (S.items[ym] || []).concat([{ id: 'i' + i, label: 'Repair', amount: amt() || 1 }]); }
  const cats = S.plan.lines.map(l => l.key);
  for (let i = ri(0, 8); i > 0; i--) M.addReceipt(S, dayIn(pick(months)), ri(1, 500000) / 100, pick(cats), 'made-up ' + i);
  return S;
}
/* the saved copy as the page keeps it, cleaned again by the load code (the same functions ui0.js normalize() calls) */
function reload(S) {
  const d = JSON.parse(J(S));
  return Object.assign(d, { steps: M.cleanSteps(d.steps), once: M.cleanOnce(d.once), items: M.cleanItems(d.items), cfg: M.cleanCfg(d.cfg), plan: M.cleanPlan(d.plan), receipts: M.cleanReceipts(d.receipts) });
}

/* 1. the months follow today, including far past Oct 2028 */
const TODAYS = ['2026-11-19', '2027-06-01', '2028-10-31', '2028-11-01', '2029-03-15', '2031-01-10', '2035-12-31'];
for (let i = 0; i < 20; i++) TODAYS.push(dayIn(M.ymFrom(M.ymIdx('2026-11') + ri(0, 120))));
const spans = new Set();
for (const t of TODAYS) {
  const ms = windowAt(M, t), ym = ymOf(t);
  rep.ok(ms.indexOf(ym) >= 0, `today ${t}: its month ${ym} is one of the app's months (they run ${ms[0]} to ${ms[ms.length - 1]})`);
  rep.ok(ms.some(x => x > ym), `today ${t}: there are months after today to plan`);
  rep.ok(ms.every((x, i) => i === 0 || M.ymIdx(x) === M.ymIdx(ms[i - 1]) + 1), `today ${t}: the months are in order with none missing`);
  spans.add(ms.length + ' months, ' + (ms.indexOf(ym) >= 0 ? ms.indexOf(ym) + ' before today' : 'today outside'));
}
rep.waitQ('W1', 'how many months back and ahead the window holds (seen: ' + [...spans].slice(0, 4).join('; ') + ')');

/* 2 and 3. numbers kept and nothing lost when the window moves, on random plans */
for (let t = 0; t < N; t++) {
  const t0 = dayIn(M.ymFrom(M.ymIdx('2026-11') + ri(0, 40))), m0 = windowAt(M, t0);
  /* the plan as saved and loaded once on the day it was made: the base everything later is compared with */
  const saved = J(reload(randomPlan(m0))), C0 = M.calcAll(JSON.parse(saved)), tag = `#${t} plan made ${t0}`;
  const k = pick([1, 2, 6, 12, ri(1, 36), ri(24, 60)]), t1 = dayIn(M.ymAdd(ymOf(t0), k)), m1 = windowAt(M, t1);
  rep.ok(m1.indexOf(ymOf(t1)) >= 0, `${tag}: after today moved ${k} months to ${t1}, that month is shown`);
  /* the same plan, loaded on the later day */
  const S1 = reload(JSON.parse(saved)), C1 = M.calcAll(S1);
  for (const ym of m0.filter(x => m1.indexOf(x) >= 0)) if (C0.byYm[ym] && C1.byYm[ym]) sameFigures(tag + ' moved ' + k + ' months:', C0.byYm[ym], C1.byYm[ym]);
  /* nothing before the new window, or after it, was dropped from the saved copy */
  const d0 = JSON.parse(saved);
  ['steps', 'once', 'items', 'receipts', 'cfg', 'plan'].forEach(part => rep.ok(J(S1[part]) === J(d0[part]), `${tag}: ${part} kept in full after loading on ${t1} (` + (part === 'once' || part === 'items' ? 'months ' + Object.keys(d0[part]).filter(ym => !S1[part][ym]).join(' ') + ' lost' : 'changed') + ')'));
  /* today moves back (a phone clock set wrong, or a backup opened on an old device): every month comes back exactly */
  windowAt(M, t0);
  const S2 = reload(JSON.parse(J(S1))), C2 = M.calcAll(S2);
  rep.ok(J(C2.months.map(m => m.ym)) === J(C0.months.map(m => m.ym)), `${tag}: back on ${t0} the same months show`);
  for (const ym of m0) if (C0.byYm[ym] && C2.byYm[ym]) sameFigures(tag + ' back again:', C0.byYm[ym], C2.byYm[ym]);
  /* a month that left the window: what the person typed for it is still there */
  const gone = m0.filter(x => m1.indexOf(x) < 0);
  if (gone.length && Object.keys(d0.once).some(ym => gone.indexOf(ym) >= 0)) rep.ok(Object.keys(d0.once).filter(ym => gone.indexOf(ym) >= 0).every(ym => J(S1.once[ym]) === J(d0.once[ym])), `${tag}: amounts typed for months that left the window are kept`);
}
/* what the app shows for months that left the window (a look back, or nothing) is not in the docs */
rep.waitQ('W2', 'what the person sees for a month that has left the window (Look back, a summary line, or nothing)');
rep.waitQ('W3', 'which month the bank start belongs to once the first month has left the window');
rep.end();
