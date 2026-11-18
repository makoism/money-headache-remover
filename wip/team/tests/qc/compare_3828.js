/* PLAN step 8: a plan saved by the live 38.28 loads into 38.31; every bank figure is compared month by month, and every difference must be
   explained to the cent by a named rule, recounted here from the plain words (none of 38.31's code is used for the explanation):
     38.30 rule: spending past the plan is real money. It comes out of the bank in the month it happens and stays out in every later month.
     "Past the plan" per month: Free to spend logged past its plan; each bill line logged past its own amount; Other logged past the month's
     one-time costs; Investing logged past its plan; Education and Giving logged past what their pile holds (their unspent plan carries over).
   The 38.28 model is tests/fixtures/model_3828.js, taken from main (the live build). Made-up numbers only (decision 9).
   Run: node tests/qc/compare_3828.js            prints the table, the explanation and COMPARE PASS / COMPARE FAIL */
const fs = require('fs'), path = require('path');
const load = (file, names) => new Function(fs.readFileSync(file, 'utf8') + `; return { ${names} };`)();
const OLD = load(path.join(__dirname, '..', 'fixtures', 'model_3828.js'), 'presetState, setVal, addReceipt, calcAll, MONTHS, linesOf, goalsOf, val');
const NEW = load(path.join(__dirname, '..', '..', 'model.js'), 'calcAll, MONTHS, cleanSteps, cleanOnce, cleanItems, cleanCfg, cleanPlan, cleanReceipts, val');

/* ---- a plan as 38.28 saves it: yen, made-up numbers of the shape of a real one ---- */
const S0 = OLD.presetState('¥');
S0.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S0.ui.sampleHidden = true;
S0.cfg.bankStart = 180000; S0.cfg.minBank = 50000;
OLD.setVal(S0, 'a', '2026-11', 285000, 'after');
const L = k => S0.plan.lines.find(l => l.key === k);
const bill = S0.plan.lines.filter(l => l.jar === 'nec'), play = S0.plan.lines.find(l => l.jar === 'play'), edu = S0.plan.lines.find(l => l.jar === 'edu');
OLD.setVal(S0, bill[0].key, '2026-11', 92000, 'after');            /* rent */
OLD.setVal(S0, bill[1].key, '2026-11', 38000, 'after');            /* food */
OLD.setVal(S0, play.key, '2026-11', 30000, 'after');
S0.items = { '2027-01': [{ id: 'it1', label: 'Dentist', amount: 15000 }] };
const R = [   /* date, amount, line key or jar, the person's words */
  ['2026-11-08', 12500, play.key, 'Free to spend'], ['2026-11-20', 9800, play.key, 'Free to spend'],
  ['2026-12-03', 21000, play.key, 'Free to spend'], ['2026-12-18', 19500, play.key, 'Free to spend'],      /* December: 10,500 past its 30,000 */
  ['2027-01-09', 44000, bill[1].key, 'food'],                                                             /* January: food 6,000 past its 38,000 */
  ['2027-01-12', 18000, 'other', 'Other'],                                                                /* January: Other 3,000 past the 15,000 one-time cost */
  ['2027-01-25', 26000, play.key, 'Free to spend'],
  ['2027-02-14', edu ? 9000 : 0, edu ? edu.key : play.key, 'course'],
];
R.forEach(([d, a, c, n]) => { if (a > 0) OLD.addReceipt(S0, d, a, c, n); });
const saved = JSON.parse(JSON.stringify(S0));   /* exactly what 38.28 keeps in the browser */

/* ---- 38.31 loads it the way the page does (the money parts of ui0.js normalize) ---- */
const S1 = { v: saved.v, rev: saved.rev, ui: Object.assign({}, saved.ui), steps: NEW.cleanSteps(saved.steps), once: NEW.cleanOnce(saved.once), items: NEW.cleanItems(saved.items), cfg: NEW.cleanCfg(saved.cfg) };
S1.plan = NEW.cleanPlan(saved.plan, S1.cfg); S1.receipts = NEW.cleanReceipts(saved.receipts);
let bad = 0; const say = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) bad++; };
say(JSON.stringify(S1.steps) === JSON.stringify(saved.steps) && JSON.stringify(S1.once) === JSON.stringify(saved.once) && JSON.stringify(S1.items) === JSON.stringify(saved.items), 'the saved plan loads unchanged: every typed amount, one-month change and one-time cost');
say(S1.receipts.length === saved.receipts.length && S1.receipts.reduce((a, r) => a + r.a, 0) === saved.receipts.reduce((a, r) => a + r.a, 0), `every receipt loads (${S1.receipts.length}, total ¥${saved.receipts.reduce((a, r) => a + r.a, 0).toLocaleString('en-US')})`);

/* ---- the plain recount of spending past the plan ---- */
const CO = OLD.calcAll(saved), CN = NEW.calcAll(S1);
const lineOf = key => S1.plan.lines.find(l => l.key === key);
const pile = { edu: 0, give: 0 }; let cum = 0;
const rows = [];
for (const ym of NEW.MONTHS.slice(0, 8)) {
  const rc = S1.receipts.filter(r => r.d.slice(0, 7) === ym), by = {}; rc.forEach(r => { by[r.c] = (by[r.c] || 0) + r.a; });
  const jarOf = c => (lineOf(c) ? lineOf(c).jar : c), byJar = {}; rc.forEach(r => { const j = jarOf(r.c); byJar[j] = (byJar[j] || 0) + r.a; });
  const planned = j => S1.plan.lines.filter(l => l.jar === j).reduce((a, l) => a + NEW.val(S1, l.key, ym), 0);
  let past = Math.max(0, (byJar.play || 0) - planned('play'));
  S1.plan.lines.filter(l => l.jar === 'nec').forEach(l => { past += Math.max(0, (by[l.key] || 0) - NEW.val(S1, l.key, ym)); });
  const items = ((S1.items[ym]) || []).reduce((a, i) => a + i.amount, 0); past += Math.max(0, (by.other || 0) - items);
  past += Math.max(0, (byJar.ffa || 0) - planned('ffa'));
  ['edu', 'give'].forEach(j => { pile[j] += planned(j) - (byJar[j] || 0); if (pile[j] < 0) { past += -pile[j]; pile[j] = 0; } });
  cum += past;
  const o = CO.byYm[ym].bankEnd, n = CN.byYm[ym].bankEnd, diff = Math.round((n - o) * 100) / 100;
  rows.push({ ym, o, n, diff, past, cum, left: Math.round((diff + cum) * 100) / 100 });
}
const F = x => (x < 0 ? '-' : '') + '¥' + Math.abs(x).toLocaleString('en-US');
console.log('\nmonth     bank in 38.28   bank in 38.31   difference   past the plan that month   past the plan so far   not explained');
rows.forEach(r => console.log(`${r.ym}   ${F(r.o).padStart(13)}   ${F(r.n).padStart(13)}   ${F(r.diff).padStart(10)}   ${F(r.past).padStart(24)}   ${F(r.cum).padStart(20)}   ${F(r.left).padStart(13)}`));
rows.forEach(r => say(Math.abs(r.left) < 0.005, `${r.ym}: the difference ${F(r.diff)} is exactly the spending past the plan so far (${F(r.cum)}), the 38.30 rule`));
/* goals do not change: goal money is never touched by spending (the same plan, the same deposits) */
const gOK = rows.every(r => Object.keys(CO.byYm[r.ym].bal).every(id => Math.abs(CO.byYm[r.ym].bal[id] - CN.byYm[r.ym].bal[id]) < 0.005));
say(gOK, 'every goal balance is the same in both versions, every month');
console.log(bad ? 'COMPARE FAIL ' + bad : 'COMPARE PASS'); process.exit(bad ? 1 : 0);
