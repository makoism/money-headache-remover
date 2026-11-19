/* WIRING STEPS 1, 3, 4, 6, 7: the page parts call the ledger and the guard. Side P, 2026-11-19.
   Run: node wip/team/tests/next/wiring_page.js [step]      (instant; reads the page parts in wip/team as text, no browser)
   Expected today: FAIL on every step. Each check names its step in LEDGER_WIRING.md, so the main session can run one step:
       node wip/team/tests/next/wiring_page.js 3
   These are checks of the source, the cheapest thing that fails for the right reason before a page test exists. They only say a
   call is there. Each step in LEDGER_WIRING.md also names the page test that proves what the person sees. */
const fs = require('fs'), path = require('path');
const TEAM = path.join(__dirname, '..', '..'), ONLY = process.argv[2] || '';
const src = f => { try { return fs.readFileSync(path.join(TEAM, f), 'utf8'); } catch (e) { return ''; } };
/* the body of one top-level function or one ACT method, as text ('' when it is not there) */
const body = (file, name) => { const t = src(file), i = t.search(new RegExp('(^|\\n)\\s*(async\\s+)?(function\\s+)?' + name + '\\s*\\(')); if (i < 0) return ''; const j = t.indexOf('\n}', i); return t.slice(i, j < 0 ? i + 4000 : j + 2); };
let pass = 0, fail = 0;
const ok = (step, cond, what) => { if (ONLY && String(step) !== ONLY) return; if (cond) pass++; else { fail++; console.log('FAIL step ' + step + ': ' + what); } };
const build = src('build.sh'), order = (a, b) => build.indexOf(a) >= 0 && build.indexOf(b) >= 0 && build.indexOf(a) < build.indexOf(b);

/* step 1: the ledger is in the page */
ok(1, order('model.js', ' ledger.js') && order(' ledger.js', 'ui0.js'), 'build.sh puts ledger.js in the page, after model.js and before ui0.js');
ok(1, /ledger_core_all\.sh/.test(src('check.sh')), 'check.sh runs tests/next/ledger_core_all.sh (the proofs and the name clash check)');
/* step 2: the storage glue is in the page */
ok(2, fs.existsSync(path.join(TEAM, 'lstore.js')) && order(' ledger.js', 'lstore.js') && order('lstore.js', 'ui0.js'), 'lstore.js exists and build.sh puts it after ledger.js and before ui0.js');
ok(2, /wiring_store\.js/.test(src('check.sh')) || /wiring_store\.js/.test(src('tests/verify.sh')), 'wiring_store.js runs in check.sh or tests/verify.sh');
/* step 3: one guard for everything that writes or takes a whole copy */
const all = ['ui0.js', 'ui41.js', 'ui42.js', 'ui43.js', 'ui5.js'].map(src).join('\n');
ok(3, !/localStorage\.setItem\(\s*KEY\b/.test(all) || /lsSave\(/.test(body('ui0.js', 'flush')), 'flush saves through lsSave (ui0.js)');
ok(3, (src('ui5.js').match(/localStorage\.setItem\(\s*KEY\b/g) || []).length === 0 && /lsSave\(|flush\(/.test((src('ui5.js').match(/addEventListener\('pagehide'[^\n]*/) || [''])[0]), 'the save on leaving the page (ui5.js pagehide) goes through lsSave too, not straight to localStorage');
ok(3, /lsMayTake\(/.test(body('ui0.js', 'adoptOther')), 'a copy from another tab passes lsMayTake (ui0.js adoptOther)');
ok(3, /lsMayUpload\(/.test(body('ui42.js', 'vaultPush')), 'every cloud upload passes lsMayUpload, forced ones too (ui42.js vaultPush)');
ok(3, /lsMayTake\(/.test(body('ui42.js', 'vaultApply')), 'a cloud copy passes lsMayTake before it replaces anything (ui42.js vaultApply)');
ok(3, /lsMayTake\(/.test(src('ui43.js')), 'the mirror copy passes lsMayTake (ui43.js)');
ok(3, /lsMayTake\(/.test(src('ui5.js')), 'a backup file passes lsMayTake (ui5.js restore)');
ok(3, /lsMayTake\(/.test(src('ui41.js')), 'a copy moved in by link passes lsMayTake (ui41.js)');
/* step 4: the ledger actions */
const act = src('actions.js');
['moneyIn', 'moneyOut', 'place', 'transfer', 'payCard', 'check', 'accept', 'startFresh', 'ledgerUndo', 'ledgerRedo'].forEach(n => ok(4, new RegExp('\\b' + n + '\\s*\\(').test(act), 'ACT.' + n + ' exists (actions.js)'));
{ const snap = body('actions.js', 'snapState') + body('actions.js', 'restoreState');
  ok(4, /ledgerAdd\(/.test(act) && !/\b(accounts|ledger|undone|removed|ledgerNext)\b/.test(snap), 'the plan undo snapshot (snapState, restoreState) does not hold the ledger: ledger undo is ledgerUndo'); }
/* step 5: the move on first load */
ok(5, /lsLoad\(/.test(body('ui0.js', 'loadLocal')), 'loadLocal loads through lsLoad (the new key first, then the move)');
ok(5, /wiring_migrate\.js/.test(src('check.sh')) || /wiring_migrate\.js/.test(src('tests/verify.sh')), 'wiring_migrate.js runs in check.sh or tests/verify.sh');
ok(5, /oldFigures/.test(['ui1.js', 'ui2.js', 'ui3.js', 'ui4.js', 'ui5.js', 'ui6.js', 'ui7.js', 'ui8.js'].map(src).join('\n')), 'a screen shows S.oldFigures once (the old plan beside the new figures)');
/* step 6: Home reads the ledger */
ok(6, /placesOf\(/.test(body('model.js', 'nowOf')) || /placesOf\(/.test(src('ui6.js')), 'the Home now block reads placesOf (bank, cards, bank after the cards)');
ok(6, /ledgerAccept\(|ACT\.accept\(|ACT\.check\(/.test(body('actions.js', 'setBankNow')), 'typing the bank on Home records a check in the ledger (ACT.setBankNow)');
ok(6, /ledger(Accept|AddAccount|EditAccount)\(|ACT\.accept\(/.test(body('actions.js', 'setCard')), 'typing a card on Home goes to its card account (ACT.setCard)');
/* step 7: statements once */
ok(7, /ledgerHas\(/.test(src('stmt.js') + src('ui45u.js')), 'statement import asks ledgerHas before logging a line (A8)');
/* step 8: no cap that drops data */
ok(8, !/raw\.slice\(0,\s*5000\)/.test(body('model.js', 'cleanReceipts')), 'cleanReceipts no longer keeps only the first 5,000 (E14)');

console.log((fail ? 'FAIL' : 'PASS') + ' wiring_page' + (ONLY ? ' step ' + ONLY : '') + ': ' + (pass + fail) + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
