/* Shared helper for the tests in tests/next/ (written 2026-11-19 by side session C, before the features exist).
   These tests guard the work right after v1: the rolling month window (PLAN.md step 11) and step B1, the ledger and "check your bank"
   (PLAN.md step 12, DECISIONS.md "Process change" 4). They are EXPECTED TO FAIL until those features exist.

   Three kinds of result:
     PASS / FAIL   a rule the docs state plainly (each check names the doc it comes from)
     WAIT Qn       a check whose expected answer the docs do not give. It is neither passed nor failed: it prints the question number
                   in tests/next/SIDE_C_QUESTIONS.md. When Mako answers, turn the WAIT into a real check.
     NOT BUILT     the app has no hook for the feature yet. That counts as a failure, so the test fails until the feature exists.

   THE APP HOOKS. The tests never guess the app's names in more than one place: this file. When a feature is built, point the matching
   hook below at it (the names shown are suggestions; any names will do as long as the hook returns the shape described). */
const fs = require('fs'), path = require('path');
const TEAM = path.join(__dirname, '..', '..');

/* the model as a plain object, the same way tests/qc/fuzz_model.js loads it. extra: more names to export if the model has them */
const BASE = ['MONTHS', 'START', 'END', 'SAMPLES', 'presetState', 'freshState', 'blankState', 'calcAll', 'setVal', 'val', 'addLine', 'addGoal', 'updateGoal',
  'addReceipt', 'cleanPlan', 'cleanSteps', 'cleanOnce', 'cleanItems', 'cleanCfg', 'cleanReceipts', 'round2', 'ymIdx', 'ymFrom', 'ymAdd', 'LINE_JARS', 'setCurYm'];
/* names the new features may add. Missing ones come back undefined, never an error */
const MAYBE = ['setToday', 'monthsNow', 'migrateToLedger', 'ledgerAdd', 'ledgerUndo', 'placesOf', 'setFreeMode',
  /* the persona runs in ledger_conservation.js (LEDGER_DESIGN.md): */ 'ledgerFresh', 'ledgerRedo', 'migrate3831', 'LEDGER_V', 'periodOf', 'flows'];
function loadModel(file) {
  const src = fs.readFileSync(file || process.env.MODEL || path.join(TEAM, 'model.js'), 'utf8');
  const names = BASE.concat(MAYBE);
  return new Function(src + ';\nreturn {' + names.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ') + '};')();
}

/* ---- hook 1: the rolling month window (tests/next/window_fuzz.js) ----
   windowAt(M, 'YYYY-MM-DD') sets the app's idea of today and returns the list of months the app now covers, oldest first.
   Suggested: model.js gains setToday(ymd) and monthsNow(). Until then the hook falls back to the fixed MONTHS (Nov 2026 to Oct 2028),
   which ignores today, so the window checks FAIL for the real reason: the months do not move. */
function windowAt(M, ymd) {
  if (typeof M.setToday === 'function') { M.setToday(ymd); return typeof M.monthsNow === 'function' ? M.monthsNow() : M.MONTHS.slice(); }
  return M.MONTHS.slice();
}
const windowBuilt = M => typeof M.setToday === 'function';

/* ---- hook 2: the ledger (tests/next/ledger_conservation.js) ----
   LEDGER(M) returns null until the ledger exists, or an object:
     fresh(mode, start)   a state whose ledger holds only opening balances: start = { chest, <burrow id>: amount }; mode 'wallet' or 'track'
     add(S, ev)           records one event; ev is { t: 'pay', a } | { t: 'place', a, to } | { t: 'spend', a, from } | { t: 'takeout', a, from }
                          | { t: 'move', a, from, to } | { t: 'check', a }   (a in money units, cents allowed; places: 'chest', 'bills', 'free',
                          or a burrow id). Returns true if it was recorded.
     undo(S)              undoes the last event
     places(S)            { chest, bills, free, wallet, burrows: { id: amount }, total, thisMonth, unexplained }   (unexplained: from the last check)
   Suggested model names: placesOf(S), ledgerAdd(S, ev), ledgerUndo(S), setFreeMode(S, mode). */
function LEDGER(M) {
  if (!(M.placesOf && M.ledgerAdd && M.ledgerUndo)) return null;
  return {
    fresh(mode, start) { const S = M.freshState(); if (M.setFreeMode) M.setFreeMode(S, mode); else (S.ui.freeMode = mode);
      S.ledger = []; Object.keys(start).forEach(k => { if (start[k]) S.ledger.push({ t: 'open', to: k, a: start[k] }); }); return S; },
    add: (S, ev) => M.ledgerAdd(S, ev) !== false,
    undo: S => M.ledgerUndo(S),
    places: S => M.placesOf(S),
  };
}

/* ---- hook 3: migration, in the real page (tests/next/migration_fixtures.js) ----
   After the page loads an old saved copy, PAGE_HOOK runs inside the page (with ?sfxtest, so window.__t exists) and returns
   null until the ledger exists, or { ledger: S.ledger, places: <as in hook 2>, isOpening: [true/false per ledger event] }.
   Suggested: __t gains placesOf; an opening balance is an event with t === 'open'. */
const PAGE_HOOK = function () {
  const t = window.__t; if (!t || !t.S || !Array.isArray(t.S.ledger) || typeof t.placesOf !== 'function') return null;
  return { ledger: JSON.parse(JSON.stringify(t.S.ledger)), places: JSON.parse(JSON.stringify(t.placesOf(t.S))), isOpening: t.S.ledger.map(e => e && e.t === 'open') };
};

/* ---- results ---- */
function Report(name) {
  const r = { pass: 0, fail: 0, wait: {}, notBuilt: [], shown: 0 };
  r.ok = (cond, msg) => { if (cond) r.pass++; else { r.fail++; if (r.shown++ < 40) console.log('FAIL ' + msg); } };
  r.eq = (msg, a, b) => r.ok(a === b, msg + ': ' + JSON.stringify(a) + ' vs expected ' + JSON.stringify(b));
  r.waitQ = (q, msg) => { r.wait[q] = (r.wait[q] || 0) + 1; if (r.wait[q] === 1) console.log('WAIT ' + q + ' ' + msg); };
  r.notBuilt = [];
  r.missing = what => { r.notBuilt.push(what); console.log('NOT BUILT ' + what); };
  r.end = () => {
    const w = Object.keys(r.wait).sort();
    console.log(`${name}: ${r.pass} pass, ${r.fail} fail, ${r.notBuilt.length} not built` + (w.length ? `, waiting on ${w.join(' ')} (see SIDE_C_QUESTIONS.md)` : ''));
    const bad = r.fail + r.notBuilt.length;
    console.log(bad ? `${name.toUpperCase()} FAIL ${bad}` : `${name.toUpperCase()} PASS`);
    process.exit(bad ? 1 : 0);
  };
  return r;
}

/* a seeded random source, so a failure can be replayed with the same seed */
function Rand(seed) {
  let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  return { rnd, ri, pick: a => a[ri(0, a.length - 1)], chance: p => rnd() < p };
}
/* money as whole cents, so sums are exact */
const cents = x => Math.round(x * 100);

module.exports = { TEAM, loadModel, windowAt, windowBuilt, LEDGER, PAGE_HOOK, Report, Rand, cents };
