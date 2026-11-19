/* A SKETCH of the storage glue (wiring step 2), tests only. It is NOT the page file: the main session writes wip/team/lstore.js.
   It exists to prove wiring_store.js can pass:  STORE=tests/next/wiring_store_sketch.js node tests/next/wiring_store.js
   (that run passes today: 86 checks).
   It may be copied as the starting point. Pure: no DOM, no clock; the storage object and the day are handed in.
   Uses from ledger.js: LEDGER_V, ledgerMayWrite, ledgerClean, migrate3831. */
const LEDGER_KEY = 'burrow-ledger-v1';          /* the new key. The old key ('money-map-template-v2') is read once and never written */
const LS_OLD_KEY = 'money-map-template-v2';
const LS_FIELDS = ['accounts', 'ledger', 'undone', 'removed', 'ledgerV', 'ledgerNext', 'ledgerBad', 'frozen', 'oldFigures'];
const lsParse = t => { try { const d = JSON.parse(t); return d && typeof d === 'object' && !Array.isArray(d) ? d : null; } catch (e) { return null; } };
/* a whole copy arriving from anywhere (another tab, the cloud, a backup file, the mirror, a move link):
   'newer' = made by a newer page, refuse and say "update the app"; 'old' = a 38.31 copy, move it first (lsMove); 'ok' */
function lsMayTake(d) { if (!d || typeof d !== 'object') return 'bad'; if (!ledgerMayWrite(d)) return 'newer'; return (+d.ledgerV || 0) >= 1 ? 'ok' : 'old'; }
/* may this page replace the copy on the server? serverCopy: the decrypted copy there, or null when there is none */
function lsMayUpload(serverCopy) { return ledgerMayWrite(serverCopy); }
/* a 38.31 copy becomes a ledger copy: everything it had stays (the plan goes on working), the ledger fields are added.
   figures: the old plan's figures to show once (from the model, worked out by the page before the move) */
function lsMove(saved, today, figures) {
  const L = migrate3831(JSON.parse(JSON.stringify(saved)), today); if (!L) return false;
  const out = JSON.parse(JSON.stringify(saved));
  LS_FIELDS.forEach(k => { if (L[k] !== undefined) out[k] = L[k]; });
  out.ui = Object.assign({}, out.ui, { freeMode: L.ui.freeMode, payDays: L.ui.payDays });
  out.frozen = JSON.parse(JSON.stringify(saved)); out.frozen.frozenAt = today;      /* the saved copy, whole, whatever was handed over beside it */
  if (figures != null) out.oldFigures.plan = JSON.parse(JSON.stringify(figures));
  return out;
}
/* load: { from, copy }. from: 'ledger' (the new key), 'moved' (first load: the old key read once and moved; nothing is written yet),
   'none' (a new person), 'newer' (the stored ledger is from a newer page: show "update the app", never save), 'damaged' */
function lsLoad(store, today, figuresOf) {
  const raw = store.getItem(LEDGER_KEY);
  if (raw != null) {
    const d = lsParse(raw); if (!d) return { from: 'damaged', copy: null };
    if (!ledgerMayWrite(d)) return { from: 'newer', copy: null };
    const r = ledgerClean(d); return r.ok ? { from: 'ledger', copy: d } : { from: 'damaged', copy: null };
  }
  const old = lsParse(store.getItem(LS_OLD_KEY) || ''); if (!old) return { from: 'none', copy: null };
  const copy = lsMove(old, today, figuresOf ? figuresOf(old) : null);
  return copy ? { from: 'moved', copy } : { from: 'damaged', copy: null };
}
/* save: 'saved', or why not: 'newer' (stored ledgerV is higher), 'behind' (another tab saved a higher rev), 'damaged', 'error'.
   Only LEDGER_KEY is ever written */
function lsSave(store, S) {
  try {
    const raw = store.getItem(LEDGER_KEY);
    if (raw != null) { const d = lsParse(raw); if (!d) return 'damaged'; if (!ledgerMayWrite(d)) return 'newer'; if ((+d.rev || 0) > (+S.rev || 0)) return 'behind'; }
    if (!((+S.ledgerV || 0) >= 1)) return 'error';
    store.setItem(LEDGER_KEY, JSON.stringify(S)); return 'saved';
  } catch (e) { return 'error'; }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { LEDGER_KEY, lsMayTake, lsMayUpload, lsMove, lsLoad, lsSave };
