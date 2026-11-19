/* WIRING STEPS 2, 3 and 5: the new storage key, the guard on every save, upload and load, and the move on first load. Side P, 2026-11-19.
   Run: node wip/team/tests/next/wiring_store.js [-v]     (under a second; no page, no browser)
   Expected today: FAIL with "NOT BUILT: wip/team/lstore.js". The file is the storage glue of LEDGER_WIRING.md step 2: pure functions
   that are handed the storage object, so this test runs them with a storage made of a plain map.
   Proof that the test can pass: STORE=tests/next/wiring_store_sketch.js node tests/next/wiring_store.js
   HOOKS: if the page names these differently, change the names here and nowhere else. */
const HOOKS = { key: 'LEDGER_KEY', load: 'lsLoad', save: 'lsSave', move: 'lsMove', mayTake: 'lsMayTake', mayUpload: 'lsMayUpload' };
const fs = require('fs'), path = require('path'), vm = require('vm');
const TEAM = path.join(__dirname, '..', '..'), FILE = process.env.STORE ? path.resolve(TEAM, process.env.STORE) : path.join(TEAM, 'lstore.js');
const VERBOSE = process.argv.includes('-v'), J = v => JSON.parse(JSON.stringify(v)), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!fs.existsSync(FILE)) { console.log('NOT BUILT: wip/team/lstore.js (the storage glue, LEDGER_WIRING.md step 2)'); console.log('FAIL wiring_store'); process.exit(1); }
/* the glue is loaded the way the page loads it: after ledger.js, in one scope */
const ctx = vm.createContext({ console, module: { exports: {} } });
vm.runInContext(fs.readFileSync(path.join(TEAM, 'ledger.js'), 'utf8') + '\n' + fs.readFileSync(FILE, 'utf8') +
  '\n;globalThis.__T = { ' + Object.keys(HOOKS).map(k => k + ': typeof ' + HOOKS[k] + ' === "undefined" ? undefined : ' + HOOKS[k]).join(', ') + ', placesOf, ledgerProof, ledgerAdd, LEDGER_V };', ctx);
const T = ctx.__T, missing = Object.keys(HOOKS).filter(k => T[k] === undefined).map(k => HOOKS[k]);
if (missing.length) { console.log('NOT BUILT: ' + missing.join(', ')); console.log('FAIL wiring_store'); process.exit(1); }

let pass = 0, fail = 0; const fails = [];
const ok = (cond, what, more) => { if (cond) { pass++; if (VERBOSE) console.log('  ok   ' + what); } else { fail++; fails.push(what + (more ? '  [' + more + ']' : '')); } return !!cond; };
/* a storage made of a map, that counts what is written */
const storage = init => { const m = new Map(Object.entries(init || {})), w = [];
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { w.push(k); m.set(k, String(v)); }, removeItem: k => { w.push(k); m.delete(k); }, writes: w, map: m }; };
const DIR = path.join(__dirname, 'fixtures', 'wiring'), FX = fs.readdirSync(DIR).filter(f => /\.json$/.test(f)).sort().map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
const OLD = FX[0].key, NEW = T.key;

ok(typeof NEW === 'string' && NEW && NEW !== OLD, 'the ledger has its own storage key, not the 38.31 key', NEW + ' vs ' + OLD);

/* ---- the move on first load (step 5), for every saved 38.31 copy ---- */
for (const fx of FX) {
  const n = fx.name, oldText = JSON.stringify(fx.saved), st = storage({ [OLD]: oldText }), figures = { total: 5, saved: 2, free: 1, billsLeft: 2 };
  const r = T.load(st, fx.today, () => figures);
  if (!ok(r && r.from === 'moved' && r.copy, n + ': first load of a 38.31 copy moves it', r && r.from)) continue;
  const S = r.copy;
  ok(st.writes.length === 0 && st.getItem(OLD) === oldText, n + ': loading writes nothing, and the 38.31 copy under the old key is untouched');
  ok(S.ledgerV === T.LEDGER_V && Array.isArray(S.accounts) && Array.isArray(S.ledger) && T.ledgerProof(S).ok, n + ': the moved copy is a ledger and the one rule holds');
  ok(['plan', 'steps', 'once', 'items', 'cfg', 'receipts', 'cards'].every(k => same(S[k], fx.saved[k])), n + ': the plan, its settings, the receipts and the cards typed are all still there');
  ok(Object.keys(fx.saved.ui).every(k => same(S.ui[k], fx.saved.ui[k])), n + ': every screen setting is still there');
  const fr = J(S.frozen || {}); delete fr.frozenAt;
  ok(same(fr, fx.saved), n + ': the frozen copy is the saved 38.31 copy, whole');
  ok(S.oldFigures && same(S.oldFigures.plan, figures) && S.oldFigures.shownOnce === false, n + ': the old plan figures are kept, to show once');
  S.rev = (+S.rev || 0) + 1;
  ok(T.save(st, S) === 'saved' && same(st.writes, [NEW]) && st.getItem(OLD) === oldText, n + ': the first save writes the new key only');
  /* an old page opened later writes the old key with a higher rev. The ledger must not be moved again or changed by it */
  const later = J(fx.saved); later.rev = S.rev + 5000; if (later.cfg) later.cfg.bankNow = 1; st.setItem(OLD, JSON.stringify(later));
  const r2 = T.load(st, fx.today, () => figures);
  ok(r2.from === 'ledger' && same(T.placesOf(r2.copy), T.placesOf(S)) && same(r2.copy.frozen, S.frozen), n + ': after the move the old key is never read again, whatever an old page writes there', r2.from);
}

/* ---- the guard (step 3) ---- */
{ const base = T.move(J(FX[0].saved), FX[0].today, null); base.rev = 10;
  const newer = J(base); newer.ledgerV = T.LEDGER_V + 1; newer.rev = 5; newer.fromTheFuture = { kept: true }; const newerText = JSON.stringify(newer);
  let st = storage({ [NEW]: newerText });
  const mine = J(base); mine.rev = 999999;
  ok(T.save(st, mine) === 'newer' && st.writes.length === 0 && st.getItem(NEW) === newerText, 'a stored ledger from a newer page is never written over, whatever the rev', String(T.save(st, mine)));
  const r = T.load(st, FX[0].today);
  ok(r.from === 'newer' && r.copy === null && st.writes.length === 0, 'loading a ledger from a newer page gives "newer" (update the app) and no copy to work on', r.from);
  ok(T.mayTake(newer) === 'newer', 'a newer copy from another tab, the cloud, a backup file or the mirror is refused');
  ok(T.mayTake(J(FX[0].saved)) === 'old', 'a 38.31 copy from the cloud or a backup file is told apart: it is moved first, never loaded as it is');
  ok(T.mayTake(base) === 'ok', 'a ledger copy of this version may be taken');
  ok(T.mayUpload(newer) === false, 'an upload never replaces a cloud copy made by a newer page');
  ok(T.mayUpload(null) === true && T.mayUpload(J(FX[0].saved)) === true && T.mayUpload(base) === true, 'an upload may replace no copy, a 38.31 copy or a ledger copy of this version');
  /* the rev rule stays */
  st = storage({ [NEW]: JSON.stringify(Object.assign(J(base), { rev: 50 })) }); const before = st.getItem(NEW);
  ok(T.save(st, Object.assign(J(base), { rev: 49 })) !== 'saved' && st.getItem(NEW) === before, 'a copy another tab saved with a higher rev is not written over');
  ok(T.save(st, Object.assign(J(base), { rev: 51 })) === 'saved', 'a higher rev saves');
  /* a damaged stored ledger is kept for rescue: no silent second move over it, no write */
  st = storage({ [OLD]: JSON.stringify(FX[0].saved), [NEW]: '{"ledgerV":1,"ledger":[{' });
  const rd = T.load(st, FX[0].today);
  ok(rd.from === 'damaged' && T.save(st, mine) !== 'saved' && st.getItem(NEW) === '{"ledgerV":1,"ledger":[{', 'a damaged stored ledger is not moved over and not written over', rd.from);
  /* a copy with no ledger is never saved under the new key (a bug elsewhere must not store a plan there and block the move) */
  st = storage({}); ok(T.save(st, J(FX[0].saved)) !== 'saved' && st.writes.length === 0, 'a copy without a ledger is never saved under the new key');
  /* a new person */
  ok(T.load(storage({}), FX[0].today).from === 'none', 'nothing stored: a new person, nothing to move');
  /* fields this page does not know come through a load and a save */
  const odd = J(base); odd.zz9 = { a: 1 }; odd.accounts[0].zz9 = 'kept'; if (odd.ledger[0]) odd.ledger[0].zz9 = 7; odd.rev = 60;
  st = storage({ [NEW]: JSON.stringify(odd) }); const lo = T.load(st, FX[0].today); lo.copy.rev = 61; T.save(st, lo.copy); const back = JSON.parse(st.getItem(NEW));
  ok(same(back.zz9, { a: 1 }) && back.accounts[0].zz9 === 'kept' && (!odd.ledger[0] || back.ledger[0].zz9 === 7), 'fields a newer page added (on the copy, an account, an event) survive a load and a save');
}

fails.forEach(x => console.log('FAIL ' + x));
console.log((fail ? 'FAIL' : 'PASS') + ' wiring_store: ' + (pass + fail) + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
