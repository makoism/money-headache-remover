/* E6 (LAUNCH_CHECKLIST.md): THE MONTH WINDOW IS A VIEW ONLY. NOTHING IS TRIMMED.
   Side lane J, 2026-11-19. Made-up numbers only. Pure node, no browser, under a second.
   Run: node tests/qc/e6_window.js          Ends with "E6 WINDOW PASS" or "E6 WINDOW FAIL n".
   EXPECTED TO FAIL until the E6 fix lands (see LANE_e6.md). Each loss is printed as
       LOSS <function>: <what was dropped>   [<which made-up plan>]

   What it proves, with fixed made-up plans:
     A. loading a saved copy never drops a month of typed amounts, a one-time cost, a repeating item, a receipt, a goal date or a loan end
        that falls outside the months the app shows today
     B. load, save, reload (three times) keeps the same
     C. copies shaped like older versions keep the same (and side C's 19 real old-build copies, when tests/next/fixtures is there)
     D. a device whose clock jumps forward two years and back keeps everything, and every month shows the same figures to the cent
     E. a plan that already runs past the last month the app knows keeps everything
     F. importing statements or receipts never drops a row because of its date
     G. repeating spending never skips a due date for good
     H. keeping the outside months changes no number inside the window (the window is a view)

   How it loads the app: the real model.js and stmt.js, plus the real load code cut out of ui0.js by name (normalize, upgradeLegacy,
   todayStr) and the real import check cut out of ui46.js (askClean). Nothing is copied by hand, so the test follows the app.
   How it moves the window: if model.js has setToday(ymd) (the hook side C named in tests/next/lib.js) it is used. Until then the
   START and END line of model.js is rewritten in memory only, which is what a rolling window would do on a later day.
   This test is the fixed, named half. The random half is side C's tests/next/window_fuzz.js (branch side/after-v1-tests). */
const fs = require('fs'), path = require('path');
const TEAM = path.join(__dirname, '..', '..');
/* E6_MODEL and E6_UI46 point at another copy of those two files (used to try a fix before it goes into the app) */
const OTHER = { 'model.js': process.env.E6_MODEL, 'ui46.js': process.env.E6_UI46 };
const read = f => fs.readFileSync(OTHER[f] || path.join(TEAM, f), 'utf8');
const J = JSON.stringify, clone = o => JSON.parse(J(o));

let bad = 0, losses = 0;
const ck = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond || !extra ? '' : '  ' + extra)); if (!cond) bad++; };
/* the same loss found again in the same part (after a second load, say) is counted but printed once */
const shown = new Set();
const loss = (fn, what, plan) => { const k = plan.slice(0, 2) + fn + what; if (shown.has(k)) return; shown.add(k); losses++; console.log(`LOSS ${fn}: ${what}   [${plan}]`); };

/* ---------- the app, loaded as a plain object ---------- */
/* one top-level declaration cut out of a source file by its name: "const NAME = ...;" on one line, or "function NAME(" down to its closing brace */
function cut(src, file, name) {
  const lines = src.split('\n');
  let i = lines.findIndex(l => l.startsWith('function ' + name + '('));
  if (i >= 0) { let j = i; if (!/\}\s*$/.test(lines[i]) || lines[i].split('{').length !== lines[i].split('}').length) { j = lines.findIndex((l, k) => k > i && l === '}'); } if (j < 0) throw new Error(`${file}: function ${name} has no end`); return lines.slice(i, j + 1).join('\n'); }
  i = lines.findIndex(l => l.startsWith('const ' + name + ' ='));
  if (i >= 0) return lines[i];
  throw new Error(`${file}: ${name} not found (the app changed; update the list in tests/qc/e6_window.js)`);
}
const UI0 = ['HOPES', 'cleanName', 'cleanSubName', 'TABS', 'cleanWin', 'stable', 'legacyState', 'INCOME_KEYS', 'todayStr', 'normalize', 'planIsSample', 'swapPlanTo', 'upgradeLegacy'];
const UI46 = ['fromYm', 'askClean'];
const NAMES = ['MONTHS', 'START', 'END', 'calcAll', 'freshState', 'presetState', 'setVal', 'val', 'addGoal', 'updateGoal', 'updateLine', 'addReceipt', 'applyRecurring', 'receiptStats',
  'cleanOnce', 'cleanItems', 'cleanRecurring', 'cleanReceipts', 'cleanPlan', 'cleanSteps', 'validDate', 'ymAdd', 'ymIdx', 'ymFrom',
  'stmtCleanRows', 'stmtMerge', 'stmtReceipts', 'normalize', 'upgradeLegacy', 'todayStr', 'askClean', 'setToday', 'monthsNow'];
const WINDOW_LINE = /const START = '(\d{4}-\d{2})', END = '(\d{4}-\d{2})'/;
const pad = n => (n < 10 ? '0' : '') + n;
const ymShift = (ym, n) => { const i = +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1) + n; return Math.floor(i / 12) + '-' + pad(i % 12 + 1); };
let HOW = '';
/* the app as it would run on the day `today` (YYYY-MM-DD). shift: how many months the window has moved by that day */
function app(today, shift) {
  let model = read('model.js');
  const ui0 = read('ui0.js'), ui46 = read('ui46.js');
  const hasHook = /\bfunction setToday\(|\bconst setToday =/.test(model);
  if (!hasHook && shift) {
    const m = model.match(WINDOW_LINE);
    if (!m) throw new Error('model.js: the START and END line changed and there is no setToday(ymd). Update WINDOW_LINE in tests/qc/e6_window.js');
    model = model.replace(WINDOW_LINE, `const START = '${ymShift(m[1], shift)}', END = '${ymShift(m[2], shift)}'`);
  }
  HOW = hasHook ? 'model.js setToday(ymd)' : 'START and END rewritten in memory (no setToday yet)';
  /* the device clock: new Date() with nothing in it gives `today`; a date built from a text or numbers is the real thing */
  const RealDate = Date, at = new RealDate(today + 'T12:00:00').getTime();
  class Clock extends RealDate { constructor(...a) { if (a.length) super(...a); else super(at); } static now() { return at; } }
  const src = model + '\n' + read('stmt.js') + '\nlet S = freshState();\n' + UI0.map(n => cut(ui0, 'ui0.js', n)).join('\n') + '\n' + UI46.map(n => cut(ui46, 'ui46.js', n)).join('\n') +
    '\nconst __api = {' + NAMES.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ') + '};\n__api.setS = x => { S = x; };\nif (__api.setToday) __api.setToday(' + J(today) + ');\nreturn __api;';
  const A = new Function('Date', src)(Clock);
  A.today = today; A.months = typeof A.monthsNow === 'function' ? A.monthsNow() : A.MONTHS.slice();
  /* load a saved copy the way the page does (ui0.js loadLocal), and save it the way the page does (flush: the plan as JSON text) */
  A.load = text => A.upgradeLegacy(A.normalize(JSON.parse(text)));
  A.save = S => J(S);
  return A;
}

/* ---------- what must still be there after a load ---------- */
const okAmt = v => typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1e9;
/* every loss between a saved copy and what came back, each named with the function that dropped it. Only sound entries are expected back */
function compare(saved, got, plan) {
  let n = 0; const L = (fn, what) => { n++; loss(fn, what, plan); };
  Object.keys(saved.once || {}).sort().forEach(ym => Object.keys(saved.once[ym]).forEach(k => { const v = saved.once[ym][k]; if (!okAmt(v)) return;
    if (!got.once || !got.once[ym] || got.once[ym][k] !== v) L('cleanOnce', `the amount ${v} typed for ${k} in ${ym}`); }));
  Object.keys(saved.items || {}).sort().forEach(ym => (saved.items[ym] || []).forEach(it => { if (!okAmt(it.amount)) return;
    const g = got.items && got.items[ym] && got.items[ym].find(x => x.id === it.id); if (!g || g.amount !== it.amount) L('cleanItems', `the one-time cost "${it.label}" ${it.amount} in ${ym}`); }));
  ((saved.plan && saved.plan.recurring) || []).forEach(r => { const g = ((got.plan && got.plan.recurring) || []).find(x => x.id === r.id);
    if (!g) L('cleanRecurring', `the repeating item "${r.n}" ${r.a} (starts ${r.from})`);
    else { if (g.from !== r.from) L('cleanRecurring', `the start date of the repeating item "${r.n}": saved ${r.from}, came back ${g.from}`); if (g.a !== r.a) L('cleanRecurring', `the amount of the repeating item "${r.n}": saved ${r.a}, came back ${g.a}`); } });
  (saved.receipts || []).forEach(r => { const g = (got.receipts || []).find(x => x.id === r.id);
    if (!g || g.d !== r.d || g.a !== r.a) L('cleanReceipts', `the receipt ${r.id} of ${r.a} dated ${r.d}`); });
  ((saved.plan && saved.plan.goals) || []).forEach(g0 => { if (!g0.due) return; const g = ((got.plan && got.plan.goals) || []).find(x => x.id === g0.id);
    if (!g || g.due !== g0.due) L('cleanPlan (validDue)', `the date ${g0.due} of the goal "${g0.name}"` + (g ? `, came back "${g.due}"` : '')); });
  ((saved.plan && saved.plan.lines) || []).forEach(l0 => { if (!l0.ends) return; const l = ((got.plan && got.plan.lines) || []).find(x => x.id === l0.id);
    if (!l || l.ends !== l0.ends) L('cleanPlan (line ends)', `the last payment month ${l0.ends} of "${l0.name}"`); });
  return n;
}
/* the figures a month shows, in whole cents */
const cents = x => Math.round(x * 100);
function figures(m) {
  const f = { inflow: cents(m.inflow), out: cents(m.out), left: cents(m.left), bankStart: cents(m.bankStart), bankEnd: cents(m.bankEnd), goalsTotal: cents(m.goalsTotal) };
  Object.keys(m.jar).forEach(j => { f['jar.' + j] = cents(m.jar[j]); }); Object.keys(m.bal || {}).forEach(g => { f['goal.' + g] = cents(m.bal[g]); });
  return f;
}
function firstDiff(A, Ca, Cb, months) {
  for (const ym of months) { const a = Ca.byYm[ym], b = Cb.byYm[ym]; if (!a || !b) return `${ym} is not shown`; const fa = figures(a), fb = figures(b);
    for (const k of Object.keys(fa)) if (fa[k] !== fb[k]) return `${ym} ${k}: ${fa[k] / 100} before, ${fb[k] / 100} after`; }
  return '';
}

/* ---------- the made-up plans ---------- */
const NOW = '2026-11-20', A0 = app(NOW, 0);
const W0 = A0.months[0], W1 = A0.months[A0.months.length - 1];          /* the first and last month shown today */
const before = n => ymShift(W0, -n), after = n => ymShift(W1, n);
const mid = A0.months[3], late = A0.months[A0.months.length - 2];

/* an ordinary plan made today, through the app's own functions, all inside today's window */
function planInside() {
  const A = A0, S = A.presetState('$');
  S.cfg.bankStart = 2345.67; S.ui.done = { pay: true, bills: true };
  A.setVal(S, 'a', W0, 3100, 'after'); A.setVal(S, 'bill:rent', W0, 1200.5, 'after');
  A.setVal(S, 'bill:food', mid, 432.1, 'once'); A.setVal(S, 'side', late, 250, 'once'); A.setVal(S, 'bill:util', W1, 88, 'once');
  S.items[mid] = [{ id: 'i1', label: 'Bike repair', amount: 75.25 }]; S.items[W1] = [{ id: 'i2', label: 'Visa fee', amount: 140 }];
  A.addReceipt(S, W0 + '-18', 12.4, 'envelope', 'made-up coffee'); A.addReceipt(S, mid + '-03', 60, 'bill:food', 'made-up market'); A.addReceipt(S, W1 + '-27', 9.99, 'envelope', 'made-up app');
  S.plan.recurring = [{ id: 'q1', a: 15, c: 'envelope', n: 'made-up gym', every: 'month', on: 5, from: W0 + '-05', last: '' }];
  S.plan.goals[0].due = ymShift(W0, 14) + '-20';
  return S;
}
/* months, items, receipts and dates on both sides of the window, as a later version, an older version or an earlier day would have saved them */
function addOutside(S, tag) {
  S.once[before(2)] = { 'bill:food': 411 }; S.once[before(14)] = { a: 2900, 'bill:rent': 1100 };
  S.once[after(1)] = { 'bill:food': 455.5 }; S.once[after(30)] = { side: 600 };
  S.items[before(1)] = [{ id: 'o1', label: 'Old dentist bill', amount: 210 }]; S.items[after(3)] = [{ id: 'o2', label: 'Future flight', amount: 890.4 }];
  S.receipts.push({ id: 'ob1', d: before(3) + '-14', a: 23.5, c: 'envelope', cn: 'Free to spend', n: 'made-up, before the window' });
  S.receipts.push({ id: 'oa1', d: after(4) + '-02', a: 48, c: 'bill:food', cn: 'Food and groceries', n: 'made-up, after the window' });
  S.plan.recurring = (S.plan.recurring || []).concat([
    { id: 'qb', a: 9, c: 'envelope', n: 'made-up magazine', every: 'month', on: 12, from: before(5) + '-12', last: before(1) + '-12' },
    { id: 'qa', a: 30, c: 'envelope', n: 'made-up class', every: 'week', on: 2, from: after(2) + '-01', last: '' }]);
  return S;
}
function planOutside() { const S = addOutside(planInside()); S.plan.goals[1].due = after(5) + '-01'; const loan = S.plan.lines.find(l => l.id === 'loan'); loan.def = 300; loan.ends = after(7); return S; }

/* ---------- A. one load ---------- */
console.log(`E6: the month window is a view only. Today is ${NOW}; the app shows ${W0} to ${W1}.`);
{
  const saved = planOutside(), got = A0.load(J(saved));
  const n = compare(saved, got, 'A: outside months, one load');
  ck('A. one load keeps every month, one-time cost, repeating item, receipt, goal date and loan end outside the window', n === 0, n + ' lost');
  ck('A. amounts that run in steps (pay from a month on) outside the window are kept', J(A0.cleanSteps({ a: [{ from: before(20), v: 2500 }, { from: after(6), v: 3300 }] })) === J({ a: [{ from: before(20), v: 2500 }, { from: after(6), v: 3300 }] }));
}

/* ---------- B. load, save, reload, three times ---------- */
{
  const saved = planOutside(); let text = J(saved), n = 0, texts = [];
  for (let i = 1; i <= 3; i++) { const S = A0.load(text); n += compare(saved, S, 'B: load ' + i + ' of 3'); text = A0.save(S); texts.push(text); }
  ck('B. load, save and reload three times loses nothing', n === 0, n + ' lost');
  ck('B. the second and third saves are the same text (a load changes nothing more)', texts[1] === texts[2]);
}

/* ---------- C. copies shaped like older versions ---------- */
{
  /* before plans were saved: no plan, no receipts list, goal starts in the settings, peso sample, a month from before the first one shown */
  const old1 = { v: 1, steps: { a: [{ from: before(2), v: 30000 }] }, once: { [before(2)]: { 'bill:food': 5100 }, [before(1)]: { side: 1500 }, [W0]: { 'bill:util': 1900 } },
    items: { [before(1)]: [{ id: 'x0', label: 'Old repair', amount: 800 }] }, cfg: { bankStart: 15000, rainyStart: 4000, loanLast: after(2) } };
  /* a build before repeating spending and before cents: whole amounts, receipts from before the window, a plan with a goal date before it */
  const old2 = clone(planInside()); delete old2.plan.recurring; old2.ui = { cur: '₱' }; old2.rev = 1;
  old2.once[before(4)] = { 'bill:rent': 9000 }; old2.items[before(4)] = [{ id: 'x1', label: 'Old school fee', amount: 2500 }];
  old2.receipts.push({ id: 'rold', d: before(4) + '-09', a: 120, c: 'envelope', cn: 'Play money', n: '' });
  old2.plan.goals[0].due = before(1) + '-25';
  let n = 0;
  [['C: older copy without a plan', old1], ['C: older copy, whole amounts', old2]].forEach(([tag, d]) => { const S1 = A0.load(J(d)), S2 = A0.load(A0.save(S1)); n += compare(d, S1, tag + ', first load'); n += compare(d, S2, tag + ', after a save and reload'); });
  ck('C. copies shaped like older versions keep every month, cost, receipt and date outside the window', n === 0, n + ' lost');
  /* side C's real old-build copies (tests/next/fixtures, branch side/after-v1-tests), when they are in this checkout: the same rule on each */
  const fx = path.join(TEAM, 'tests', 'next', 'fixtures');
  const files = fs.existsSync(fx) ? fs.readdirSync(fx).filter(f => /^v.*\.json$/.test(f)) : [];
  if (files.length) {
    let m = 0;
    files.forEach(f => { const d = JSON.parse(JSON.parse(fs.readFileSync(path.join(fx, f), 'utf8')).saved); d.once = d.once || {}; d.items = d.items || {};
      d.once[before(2)] = { 'bill:food': 411 }; d.once[after(1)] = { side: 77 }; d.items[after(3)] = [{ id: 'o2', label: 'Future flight', amount: 890 }];
      m += compare(d, A0.load(A0.save(A0.load(J(d)))), 'C: side C fixture ' + f); });
    ck(`C. side C's ${files.length} real old-build copies, each with outside months added, keep them through load, save, reload`, m === 0, m + ' lost');
  } else console.log('NOTE C. tests/next/fixtures (side C, branch side/after-v1-tests) is not in this checkout: the real old-build copies were not run');
}

/* ---------- D. the device clock jumps forward two years, then back ---------- */
{
  const made = planInside(), text0 = A0.save(A0.load(J(made))), base = JSON.parse(text0), C0 = A0.calcAll(A0.load(text0));
  const FWD = ymShift(NOW.slice(0, 7), 24) + NOW.slice(7), A2 = app(FWD, 24);
  console.log(`     D. clock set to ${FWD}: the app shows ${A2.months[0]} to ${A2.months[A2.months.length - 1]} (${HOW})`);
  ck('D. with the clock two years on, that month is one the app shows', A2.months.indexOf(FWD.slice(0, 7)) >= 0, `it shows ${A2.months[0]} to ${A2.months[A2.months.length - 1]}`);
  const S2 = A2.load(text0), n1 = compare(base, S2, 'D: loaded with the clock two years on');
  ck('D. loading with the clock two years on keeps the whole plan', n1 === 0, n1 + ' lost');
  const text2 = A2.save(S2);                                        /* the page saves on its own (any edit, or the save on leaving) */
  const A3 = app(NOW, 0), S3 = A3.load(text2), n2 = compare(base, S3, 'D: clock set back, after the save made two years on');
  ck('D. back on the right day, after that save, the whole plan is still there', n2 === 0, n2 + ' lost');
  const diff = firstDiff(A3, C0, A3.calcAll(S3), A0.months);
  ck('D. back on the right day every month shows the same figures to the cent', diff === '', diff);
  ck('D. and the saved copy is the same text as before the clock moved', A3.save(S3) === text0);
}

/* ---------- E. a plan that already runs past the last month the app knows ---------- */
{
  const S = planInside();
  S.once[after(1)] = { a: 3400, 'bill:rent': 1300 }; S.once[after(8)] = { 'bill:food': 510 }; S.items[after(3)] = [{ id: 'e1', label: 'Moving van', amount: 640 }];
  S.receipts.push({ id: 'er1', d: after(4) + '-03', a: 19.5, c: 'envelope', cn: 'Free to spend', n: 'made-up, entered by a later version' });
  S.plan.recurring.push({ id: 'eq', a: 45, c: 'envelope', n: 'made-up lessons', every: 'month', on: 5, from: after(3) + '-05', last: '' });
  S.plan.goals[1].due = after(5) + '-01'; const loan = S.plan.lines.find(l => l.id === 'loan'); loan.def = 300; loan.ends = after(7);
  const saved = clone(S), got = A0.load(A0.save(A0.load(J(saved)))), n = compare(saved, got, 'E: plan past the last month');
  ck(`E. a plan that runs past ${W1} keeps every later month, cost, repeating item, receipt, goal date and loan end`, n === 0, n + ' lost');
}

/* ---------- F. importing statements and receipts ---------- */
{
  const S = A0.load(J(planInside())); A0.setS(S);
  /* the reply the import reads (ui46.js askClean): three months of a statement from before the first month shown, one inside, one after the last */
  const rows = [[before(3) + '-14', 1250], [before(2) + '-02', 43.2], [before(1) + '-28', 18], [W0 + '-07', 22], [after(1) + '-03', 31]];
  const p = A0.askClean({ summary: 'made-up statement', receipts: rows.map(([date, amount]) => ({ date, amount, category: 'envelope', note: 'made-up row' })) });
  rows.forEach(([d, a]) => { if (!p.receipts.some(r => r.d === d && r.a === a)) loss('askClean (ui46.js, import from files and photos)', `the statement row of ${a} dated ${d}`, 'F: import'); });
  ck('F. the import keeps every statement row whatever its date (none set aside as "outside")', p.receipts.length === rows.length && p.outside === 0, `${p.receipts.length} of ${rows.length} kept, ${p.outside} set aside as outside ${W0} to ${W1}`);
  /* the statement setup (stmt.js): rows to receipts, then logged with addReceipt (ui45v.js) */
  const raw = { kind: 'bank', account: 'Made-up Bank 1234', rows: rows.map(([date, amount]) => ({ date, amount, dir: 'out', text: 'MADE UP SHOP' })) };
  const readOf = A => A.stmtCleanRows(raw, 'made-up.csv', ymShift(W1, 2) + '-15');
  const rc = A0.stmtReceipts(A0.stmtMerge([readOf(A0)]).rows, () => 'play');
  const S2 = A0.load(J(planInside())), n0 = S2.receipts.length; rc.forEach(r => { if (!A0.addReceipt(S2, r.d, r.a, r.c, r.n)) loss('addReceipt (statement setup)', `the statement row of ${r.a} dated ${r.d}`, 'F: statement setup'); });
  ck('F. the statement setup turns every row into a receipt whatever its date', rc.length === rows.length && S2.receipts.length === n0 + rows.length, `${rc.length} rows read, ${S2.receipts.length - n0} logged, of ${rows.length}`);
  const back = A0.load(A0.save(S2)); ck('F. and those receipts are still there after a save and reload', back.receipts.length === S2.receipts.length, `${back.receipts.length} of ${S2.receipts.length}`);
}

/* ---------- G. repeating spending never skips a due date for good ---------- */
{
  const run = (tag, r, today) => {
    const S = A0.load(J(planInside())); S.plan.recurring = [Object.assign({ c: 'envelope', every: 'month', last: '' }, r)]; const S1 = A0.load(A0.save(S));
    const r1 = S1.plan.recurring[0]; if (!r1) { loss('cleanRecurring', `the repeating item "${r.n}"`, tag); return 1; }
    /* the days it falls due after the last one already logged, worked out here apart from the app */
    const due = []; for (let ym = r.from.slice(0, 7); ym <= today.slice(0, 7) && due.length < 60; ym = ymShift(ym, 1)) { const d = ym + '-' + pad(r.on); if (d >= r.from && d <= today && d > (r.last || '')) due.push(d); }
    A0.applyRecurring(S1, today);
    const logged = new Set(S1.receipts.filter(x => x.a === r.a && x.n === r.n).map(x => x.d)), last = S1.plan.recurring[0].last || '';
    let n = 0; due.forEach(d => { if (!logged.has(d) && last >= d) { n++; loss('applyRecurring', `the ${r.a} "${r.n}" due ${d} was never logged, and the item now counts it as done (last = ${last})`, tag); } });
    return n;
  };
  /* the page keeps today inside the window (ui0.js todayStr), so the first case cannot happen from a screen yet. It will the day the window moves */
  const n = run('G: repeating item, due dates past the last month', { id: 'g1', a: 21, n: 'made-up bus pass', on: 9, from: ymShift(W1, -1) + '-09' }, after(3) + '-20') +
            run('G: repeating item that started before the first month, logged up to last month', { id: 'g2', a: 13, n: 'made-up paper', on: 4, from: before(2) + '-04', last: before(1) + '-04' }, ymShift(W0, 1) + '-20');
  ck('G. a repeating item logs every due date, or leaves it to be logged later; none is skipped for good', n === 0, n + ' skipped');
}

/* ---------- H. keeping the outside months changes no number inside the window ---------- */
{
  const inside = A0.load(J(planInside())), both = A0.load(J(addOutside(planInside())));
  const diff = firstDiff(A0, A0.calcAll(inside), A0.calcAll(both), A0.months);
  ck('H. months, costs and receipts kept outside the window change no figure inside it', diff === '', diff);
  const rs = A0.receiptStats(both, mid), rs0 = A0.receiptStats(inside, mid);
  ck('H. and no receipt total inside it', cents(rs.total) === cents(rs0.total), `${rs0.total} without, ${rs.total} with`);
}

console.log(`e6 window: ${losses} ${losses === 1 ? 'loss' : 'losses'} printed above, ${bad} ${bad === 1 ? 'check' : 'checks'} failed`);
console.log(bad ? 'E6 WINDOW FAIL ' + bad : 'E6 WINDOW PASS');
process.exit(bad ? 1 : 0);
