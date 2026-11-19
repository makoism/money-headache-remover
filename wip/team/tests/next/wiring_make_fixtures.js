/* MAKES the 38.31 saved copies the wiring tests move into the ledger (side P, 2026-11-19). Not a test.
   One command, from any folder:
       node wip/team/tests/next/wiring_make_fixtures.js                  (from origin/wip-38.31)
       node wip/team/tests/next/wiring_make_fixtures.js <git ref>        (later: the v1 candidate, for example origin/main)
       node wip/team/tests/next/wiring_make_fixtures.js --dir wip/team   (the working tree, once the page parts are on this branch)
   It loads the REAL model.js of that ref, and the page's own load code out of the real ui0.js (normalize, upgradeLegacy and the few
   names they use), builds each made-up person with the model's own functions the way the screens do, then lets normalize write the
   copy as the page would store it after one load and save. Nothing about the saved shape is typed in here by hand, so a renamed or
   new field in the v1 candidate shows up in the fixtures, and wiring_migrate.js then fails on it by name.
   Each fixture file: { made, name, about, today, saved, typed }.
     saved  the copy exactly as stored
     typed  what the person typed, written from THIS script's own inputs (never read back from saved): the answer the move must give
   Made-up numbers only. */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = path.join(__dirname, 'fixtures', 'wiring');
const args = process.argv.slice(2), dirAt = args.indexOf('--dir');
const DIR = dirAt >= 0 ? args[dirAt + 1] : null, REF = DIR ? null : (args[0] || 'origin/wip-38.31');
const read = f => (DIR ? fs.readFileSync(path.resolve(ROOT, DIR, f), 'utf8')
  : cp.execFileSync('git', ['-C', ROOT, 'show', REF + ':wip/team/' + f], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const die = m => { console.log('CANNOT MAKE FIXTURES: ' + m); process.exit(2); };
let model, ui0, version, commit = '';
try { model = read('model.js'); ui0 = read('ui0.js'); version = read('VERSION').split('\n')[0].trim(); } catch (e) { die('model.js, ui0.js or VERSION not readable from ' + (DIR || REF) + ' (git fetch origin wip-38.31 first?)'); }
if (REF) { try { commit = cp.execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', REF], { encoding: 'utf8' }).trim(); } catch (e) { /* no commit id */ } }

/* one top-level declaration out of a page file, by name: a one-line const, or a function up to its closing brace in column 0 */
function take(src, name) {
  const lines = src.split('\n');
  const i = lines.findIndex(l => new RegExp('^(?:const|let|var|function)\\s+' + name + '\\b').test(l));
  if (i < 0) die('ui0.js has no top-level "' + name + '" any more. The load code moved: update NEED in this script.');
  if (/^function/.test(lines[i]) && !/\}\s*$/.test(lines[i])) { let j = i; while (j < lines.length && lines[j] !== '}') j++; return lines.slice(i, j + 1).join('\n'); }
  return lines[i];
}
/* what normalize and upgradeLegacy use from ui0.js. If the v1 candidate needs one more, the run stops with its name (ReferenceError) */
const NEED = ['KEY', 'HOPES', 'cleanName', 'cleanSubName', 'TABS', 'cleanWin', 'normalize', 'stable', 'legacyState', 'INCOME_KEYS', 'planIsSample', 'swapPlanTo', 'upgradeLegacy'];
const ctx = vm.createContext({ console });
/* a fixed clock inside the page code, so ids are the same on every run and a refresh only differs where the page differs */
vm.runInContext('{ let n = 0; const T0 = Date.UTC(2026, 10, 18, 3, 0, 0); Date.now = () => T0 + (n++) * 1000; }', ctx);
try { vm.runInContext(model, ctx, { filename: 'model.js' }); vm.runInContext(NEED.map(n => take(ui0, n)).join('\n'), ctx, { filename: 'ui0.js (parts)' }); }
catch (e) { die('the page code did not load: ' + e.message); }
const M = vm.runInContext(`({ presetState, setBankNow, setBankBalance, cleanCards, addGoal, updateGoal, setVal, addReceipt, clampAmt, clampBank, debtsOf, nowOf, calcAll, viewOf, mapOf, kindOfGoal, normalize, upgradeLegacy, planIsSample, START, KEY,
  DEBT_KINDS, MAX_DEBTS, newId, debtById })`, ctx);
const J = v => JSON.parse(JSON.stringify(v)), day = s => new Date(s + 'T12:00:00');

/* ----- the same steps the screens take (actions.js ACT.*, ui7.js for debts), on the model's own functions ----- */
function person(cur) {
  const S = M.presetState(cur), typed = { cur, bank: null, bankAt: null, bankKind: 'none', cards: [], burrows: [], loans: [], debtGoals: [], sampleOnly: true };
  const api = {
    S, typed,
    /* setup: "start from zero" is not needed here; a person who types goals has edited the sample */
    pay(v) { M.setVal(S, 'a', M.START, M.clampAmt(v, S), 'after'); return api; },
    bankSetup(v, on) { M.setBankBalance(S, M.clampBank(v, S), day(on)); typed.bank = v; typed.bankAt = on; typed.bankKind = 'setup'; return api; },      /* ACT.setBalance */
    bankSetupNoDay(v) { S.cfg.bankStart = M.clampBank(v, S); typed.bank = v; typed.bankAt = null; typed.bankKind = 'setup, no day'; return api; },          /* a copy saved before the day existed */
    bankNow(v, on) { M.setBankNow(S, M.clampBank(v, S), day(on)); typed.bank = v; typed.bankAt = on; typed.bankKind = 'now'; return api; },                /* ACT.setBankNow */
    card(name, owed, payDay, on) {                                                                                                                       /* ACT.setCard */
      const list = M.cleanCards(S.cards), row = { id: 'k' + Date.now().toString(36), name, owed: M.clampAmt(owed, S), payDay, at: on };
      list.push(row); S.cards = M.cleanCards(list); typed.cards.push({ id: row.id, name, owed, payDay, at: on }); return api; },
    clearSampleGoals() { S.plan.goals.forEach(g => { M.updateGoal(S, g.id, { start: 0 }); }); S.ui.cleared = true; typed.sampleOnly = false; return api; },
    goalStart(id, start) { M.updateGoal(S, id, { start }); typed.burrows.push({ id, start }); typed.sampleOnly = false; return api; },
    goal(name, target, start, kind) {                                                                                                                    /* ACT.addGoal */
      const id = M.addGoal(S, name); M.updateGoal(S, id, { target, start }); if (kind) S.ui.gk = Object.assign({}, S.ui.gk, { [id]: kind });
      if (kind === 'debt') typed.debtGoals.push({ id, name, target, paid: start, owed: target - start }); else typed.burrows.push({ id, start });
      typed.sampleOnly = false; return api; },
    debt(name, kind, balance, apr, min) {                                                                                                                /* ui7.js "Add a card or loan" */
      const d = { id: M.newId(S, 'd', x => M.debtById(S, x)), name, kind, balance, apr, min, extra: 0 };
      S.plan.debts = M.debtsOf(S).concat([d]); typed.loans.push({ id: d.id, name, kind, owed: balance, apr, min }); return api; },
    receipt(d, a, c) { M.addReceipt(S, d, a, c, ''); return api; },
    name(n) { S.ui.name = n; return api; },
  };
  return api;
}

const TODAY = '2026-11-20';
const SHAPES = [
  ['mako', 'One bank typed on Home, two cards paid in full on the 10th and the 11th, pay on one day, yen. The shape v1 must fit.',
    () => person('¥').name('Mika').clearSampleGoals().pay(412000).bankSetup(298000, '2026-11-01').bankNow(352340, '2026-11-18')
      .card('Card A', 61200, 10, '2026-11-18').card('Card B', 23450, 11, '2026-11-17').goalStart('rainy', 180000).receipt('2026-11-12', 3480, 'bill:food')],
  ['loan', 'A loan and money owed to a person in Cards and loans, a card with interest there too, and one card paid in full. Pesos.',
    () => person('₱').name('Jun').clearSampleGoals().pay(38500).bankNow(21730.55, '2026-11-19').card('Card P', 4310.25, 5, '2026-11-19')
      .debt('Home credit', 'loan', 46000, 18.5, 2300).debt('Tita Bing', 'personal', 5000, 0, 500).debt('Card R', 'card', 12900, 42, 650)],
  ['debtgoal', 'A goal of kind "pay off a debt" (A3): 30,000 to pay, 12,000 paid so far. And an ordinary goal with a start.',
    () => person('₱').name('Ria').clearSampleGoals().pay(29000).bankNow(15200, '2026-11-16').goal('Laptop loan', 30000, 12000, 'debt').goal('Trip home', 20000, 6100, 'travel')],
  ['nobank', 'Nothing typed for the bank at all: no balance, no day. One card typed. A currency with no sample.',
    () => person('$').name('Sam').card('Card S', 310.4, 28, '2026-11-15').goalStart('rainy', 900)],
  ['euro', 'Another currency with cents everywhere, and a bank below zero (overdrawn).',
    () => person('€').name('Lou').clearSampleGoals().pay(1845.5).bankNow(-212.37, '2026-11-18').card('Carte', 78.9, 4, '2026-11-18').goalStart('rainy', 1250).debt('Prêt auto', 'loan', 6400, 3.9, 180)],
  ['old', 'An old copy without the new fields: a balance typed in setup with no day, goal starts, receipts; no bank now, no cards.',
    () => person('₱').name('Aiko').clearSampleGoals().pay(41000).bankSetupNoDay(23400).goalStart('rainy', 6100).goalStart('travel', 2750).receipt('2026-11-05', 120, 'bill:food').receipt('2026-11-05', 350, 'bill:food')],
  ['setupday', 'A balance typed in setup with its day, never checked on Home since. No cards.',
    () => person('¥').name('Ken').clearSampleGoals().pay(250000).bankSetup(143000, '2026-11-03').goalStart('travel', 40000)],
  ['sample', 'The sample plan, untouched but for one thing: the bank typed on Home. The sample has an invented emergency fund start; nobody typed it.',
    () => person('¥').bankNow(87000, '2026-11-19')],
];

fs.mkdirSync(OUT, { recursive: true });
fs.readdirSync(OUT).filter(f => /\.json$/.test(f)).forEach(f => fs.unlinkSync(path.join(OUT, f)));
let made = 0;
for (const [name, about, build] of SHAPES) {
  let p; try { p = build(); } catch (e) { die(name + ': ' + e.message); }
  /* what the page stores after one load and save of this state */
  const saved = J(M.upgradeLegacy(M.normalize(J(p.S)))); saved.rev = 1795000000000;
  /* what the v1 Home "now" block shows for it, from the model's own nowOf: the first screen the ledger takes over */
  const now = M.nowOf(saved), sampleStill = !!M.planIsSample(saved);
  if (sampleStill !== p.typed.sampleOnly) die(name + ': the page says planIsSample is ' + sampleStill + ' but the script expected ' + p.typed.sampleOnly);
  const fx = { made: { by: 'wiring_make_fixtures.js', from: DIR ? 'dir ' + DIR : REF, commit, version }, name, about, today: TODAY, key: M.KEY,
    saved, typed: p.typed, homeNow: { bank: now.bank, bankAt: now.bankAt, cardsOwed: now.cardsOwed, afterCards: now.afterCards } };
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(fx, null, 1) + '\n'); made++;
}
console.log(made + ' fixtures written to tests/next/fixtures/wiring from ' + (DIR ? DIR : REF + (commit ? ' (' + commit + ')' : '')) + ', page version ' + version);
