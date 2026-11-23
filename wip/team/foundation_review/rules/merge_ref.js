// Merging two copies and the hybrid clock (SCHEMA_V3 0 and 2.3; DECISIONS_ROUND2 D4, H1, H6, L, M, N1, N2, O2, O3, Q5, Q7, S3).
// A plain reference for the engine lane, checked by run_rules.js against rules/merge.json.
// Open points name their question in merge.json.
'use strict';

// ---------- the hybrid clock [D4] ----------
// A time is ISO with its offset, for example 2026-11-23T10:00:00.000+09:00. Compared as a moment.
const ms = t => Date.parse(t);   // a full ISO time with an offset; never a bare date (D8)
const DAY = 86400000;
function offsetOf(t) { const m = /([+-])(\d\d):(\d\d)$/.exec(t); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0; }
function write(msValue, offsetMin) {
  const d = new Date(msValue + offsetMin * 60000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  const o = Math.abs(offsetMin);
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}`
    + (offsetMin < 0 ? '-' : '+') + p(Math.floor(o / 60)) + ':' + p(o % 60);
}
// The `at` a device writes: the larger of now and (newest seen + 1 ms), in now's offset [D4].
// [AH1] A device's own write uses its own clock: a long gap since the last write is normal and never held (L merge
// q8's cap is withdrawn). The device's own clock is questioned only by D8: before anything is written, a date more
// than one day back from the last open (`lastDay`, device storage `clock.lastSeen`) or more than 40 days ahead of
// it asks the person (`warn`). Once the date is confirmed the write takes the clock as it is.
const dayOf = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };
function clockAsk(today, lastDay) {
  if (!lastDay) return null;
  const d = dayOf(today) - dayOf(lastDay);
  return d < -1 ? 'back' : d > 40 ? 'ahead' : null;   // [D8] one day back allowed; more than 40 days ahead asks
}
function nextAtWarn(now, lastSeen, lastDay) {
  return { at: write(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetOf(now)), warn: clockAsk(String(now).slice(0, 10), lastDay) !== null };
}
const nextAt = (now, lastSeen) => nextAtWarn(now, lastSeen).at;
function newer(a, b) { return ms(a) > ms(b) ? 'a' : ms(b) > ms(a) ? 'b' : 'same'; }

// ---------- ids [section 0, O2, O3] ----------
// [O2] A record the app writes for a known moment gets an id built from what it is, so two devices writing
// the same moment make one record and the merge keeps the newest `at`: a settlement `set:<occurrence>`, a
// self-logged spend `auto:<schedule>@<due>`, a period-end answer `pe:<the occurrence that started the period>:<place>`,
// a period started without the pay `ps:<the occurrence it stands in for>` (its chosen day is a field) [T1]. [Q7] A removed place's move to Waiting `rm:<place>`, a closing's transfer
// or write-off `close:<account>`, and with several records `close:<account>:1`, `:2`, in order [S3]. [Q5] The skip
// written when a self-logged spend is removed `skip:<occurrence>`.
function idFor(w) {
  if (w.k === 'set') return 'set:' + w.s + '@' + w.due;
  if (w.k === 'auto') return 'auto:' + w.s + '@' + w.due;
  if (w.k === 'skip') return 'skip:' + w.s + '@' + w.due;
  if (w.k === 'pe') return 'pe:' + w.period + ':' + w.place;   // [T1] never a day that can move
  if (w.k === 'ps') return 'ps:' + w.occurrence;
  if (w.k === 'rm') return 'rm:' + w.place;
  if (w.k === 'close') return 'close:' + w.acct + (w.n ? ':' + w.n : '');   // [S3] n: the record's place in a closing that writes several
  // [X1] A record the move writes is named by what it came from, `mv:<kind>:<38.31 id or key>`, so the phone and the
  // desktop, each running the move on the same 38.31 copy, write one record after the merge. [X2] A fee record is
  // named by its transfer, `fee:<transfer id>`, so two phones ticking one transfer write one fee.
  if (w.k === 'mv') return 'mv:' + w.kind + ':' + w.key;
  if (w.k === 'fee') return 'fee:' + w.of;
  throw new Error('no built id for ' + w.k);
}
// [O3] Every other id is `<device part>-<session part>-<counter>`: the device part 6 characters, the session
// part 10 random characters (letters and digits) drawn on each page open, the counter from 1. The device
// part is letters and digits too (the schema's own example is `k7qzpa`).
// [X1, Y28] A record the move wrote is `mv:<kind>:<38.31 id, key or field path>`, and the ids built from what a record is
// may name one: a moved schedule's occurrence (`set:mv:pay:steps.a@2026-12-25`), a moved place or account
// (`pe:mv:pay:steps.a@2026-11-25:mv:place:trip`, `rm:mv:place:trip`, `close:mv:acct:cfg:2`).
const MV = 'mv:[a-z]+:[A-Za-z0-9_.:-]+';
const REF = '(?:[a-z0-9_]+|' + MV + ')';   // a schedule, place or account id inside a built id
const OCC = REF + '@\\d{4}-\\d{2}-\\d{2}';
const BUILT = new RegExp('^((set|auto|skip):' + OCC + '|pe:' + OCC + ':' + REF + '|ps:' + OCC + '|(rm|close):' + REF + '|close:' + REF + ':[1-9]\\d*)$');
const plainOk = id => typeof id === 'string' && (/^[a-z0-9]{6}-[a-z0-9]{10}-[1-9]\d*$/.test(id) || BUILT.test(id));
// [X1] `mv:<kind>:<38.31 id or key>`; [X2] `fee:` and the id of the transfer it belongs to (never a fee itself).
const MOVED = new RegExp('^' + MV + '$');
const idOk = id => typeof id === 'string' && (plainOk(id) || MOVED.test(id) || (id.startsWith('fee:') && plainOk(id.slice(4))));

// ---------- merging ----------
function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const msOr = t => (t ? ms(t) : -Infinity);
// [N1] A record held once keeps its held `at`. A held copy carries `held: { came, at }`: the `at` it came with
// and the `at` it was held at (an edit keeps the mark, as any field). A copy of the same record whose `at` is
// that `came` is the same far-ahead write, so it counts at the held `at` and takes the mark. So the fast device
// takes the held value when the merged copy comes back, and its copy arriving again is never held a second time.
const sameMoment = (a, b) => typeof a === 'string' && typeof b === 'string' && ms(a) === ms(b);
function takeHeld(r, mark) { return Object.assign({}, r, { at: mark.at, held: mark }); }
function heldPair(x, y) {
  if (x.held && !y.held && sameMoment(y.at, x.held.came)) return [x, takeHeld(y, x.held)];
  if (y.held && !x.held && sameMoment(x.at, y.held.came)) return [takeHeld(x, y.held), y];
  return [x, y];
}
// Which of two copies of one thing wins: the newer `at`; on the same `at` the copy with `gone` [H6]; then the
// larger `by`, the device part of the last writer [L merge q1, M5]; with no `by`, the larger as sorted JSON
// text, so both devices agree.
function winner(x, y) {
  const d = msOr(x.at) - msOr(y.at);
  if (d) return d > 0 ? x : y;
  if (!!x.gone !== !!y.gone) return x.gone ? x : y;
  if ((x.by || '') !== (y.by || '')) return (x.by || '') > (y.by || '') ? x : y;
  return canon(x) >= canon(y) ? x : y;
}
// [L merge q2] `steps` and `rules` entries carry their own `at` and merge by `from`. [M3] An entry is removed
// by its own `gone` with its own `at`, and the removed entry stays in the list, so the union cannot bring it
// back; it is settled like a record (winner). [M5] Each entry carries its own `by` beside its `at`.
function mergeEntries(a, b) {
  const byFrom = new Map();
  for (const e of a.concat(b)) byFrom.set(e.from, byFrom.has(e.from) ? winner(...heldPair(byFrom.get(e.from), e)) : e);
  return [...byFrom.values()].sort((x, y) => (x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
}
// One record, two copies. Newest `at` wins; on the same `at` a copy with `gone` wins [H6]; then the larger
// `by`, the device part of the last writer [L merge q1]; with no `by`, the larger as sorted JSON text, so
// both devices agree. `told`: the earliest seen, never the winner's [H1, L merge q7]. The record's `at` is
// the winner's: it moves only when the record changes [L merge q3].
// [AE1] Keyed overrides: `amounts` (schedules, loans) and `once` (budget lines, `plan.shares` entries) are maps whose every
// key is an entry with its own `at`, `by` and `gone` (and `held` mark): they merge key by key, as `steps` entries merge by
// `from`. `extraSteps` (loans) is an entry list like `steps`.
// [AH5] A keyed map is found by its shape, not by a list of names: a field whose value is a map whose values all carry
// `at` merges key by key, so a map a later build adds (a field no build knows yet) merges key by key on older devices
// too. `amounts` and `once` are keyed whatever they hold.
const ENTRY_LISTS = ['steps', 'rules', 'extraSteps'], KEYED = ['amounts', 'once'];
const isMap = x => !!x && typeof x === 'object' && !Array.isArray(x);
const keyedShape = v => isMap(v) && Object.keys(v).length > 0 && Object.values(v).every(e => isMap(e) && typeof e.at === 'string');
const META = ['held'];
// The fields of two copies of a record that are keyed maps [AE1, AH5].
function keyedFields(x, y) {
  x = x || {}; y = y || {};
  return [...new Set(Object.keys(x).concat(Object.keys(y)))].filter(k => {
    if (META.includes(k) || ENTRY_LISTS.includes(k)) return false;
    if (KEYED.includes(k)) return isMap(x[k]) || isMap(y[k]);
    // a map on one copy (or both) whose values all carry `at`, and nothing but a map or nothing on the other
    return (keyedShape(x[k]) || keyedShape(y[k])) && [x[k], y[k]].every(v => v === undefined || isMap(v));
  });
}
function mergeKeyed(a, b) {
  const out = {};
  for (const k of new Set(Object.keys(a || {}).concat(Object.keys(b || {})))) {
    const x = (a || {})[k], y = (b || {})[k];
    out[k] = x === undefined ? y : y === undefined ? x : (isMap(x) && isMap(y) ? winner(...heldPair(x, y)) : winner({ v: x }, { v: y }).v);
  }
  return out;
}
function pick(x, y) {
  [x, y] = heldPair(x, y);
  const win = winner(x, y);
  const out = Object.assign({}, win);   // whole record, unknown fields kept (section 0)
  // [AE1] An entry list or a keyed map held by either copy is merged, never taken whole from the winner: nothing is
  // deleted (section 0), so a copy that lacks one never wrote it, and the other copy's entries and keys stay.
  for (const k of ENTRY_LISTS) if (Array.isArray(x[k]) || Array.isArray(y[k])) out[k] = mergeEntries(x[k] || [], y[k] || []);
  for (const k of keyedFields(x, y)) out[k] = mergeKeyed(x[k], y[k]);
  const told = [x.told, y.told].filter(Boolean).sort((a, b) => ms(a) - ms(b))[0];
  if (told) out.told = told;
  return out;
}
function mergeList(a, b) {
  const byId = new Map();
  for (const r of (a || []).concat(b || [])) byId.set(r.id, byId.has(r.id) ? pick(byId.get(r.id), r) : Object.assign({}, r));
  return [...byId.values()].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}
// [L merge q6] Shared `ui`: each key by its own `at` in `ui.at`. [M5] Each key's `by` is in `ui.by`, beside
// its `at`: on the same `at` the larger `by` wins; with no `by`, the larger value as sorted JSON text.
// [AF3] A key is removed by its own `gone` in `ui.gone` (the day), beside its `at` and `by`; its value stays. On the same
// `at` a removed key wins [H6], before `by`; a key put back with Undo has no `gone` and a newer `at`.
function mergeUi(a, b) {
  const out = { at: {} }, atA = Object.assign({}, a.at), atB = Object.assign({}, b.at), byA = a.by || {}, byB = b.by || {};
  const goneA = a.gone || {}, goneB = b.gone || {};
  const heldA = Object.assign({}, a.held), heldB = Object.assign({}, b.held);
  // [N1] A key held once keeps its held `at`: its mark is in `ui.held`, beside `ui.at` and `ui.by`.
  for (const k of Object.keys(heldA)) if (!heldB[k] && sameMoment(atB[k], heldA[k].came)) { atB[k] = heldA[k].at; heldB[k] = heldA[k]; }
  for (const k of Object.keys(heldB)) if (!heldA[k] && sameMoment(atA[k], heldB[k].came)) { atA[k] = heldB[k].at; heldA[k] = heldB[k]; }
  for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) {
    if (k === 'at' || k === 'by' || k === 'held' || k === 'gone') continue;
    let useB;
    if (!(k in a)) useB = true;
    else if (!(k in b)) useB = false;
    else {
      const d = msOr(atB[k]) - msOr(atA[k]), wa = byA[k] || '', wb = byB[k] || '';
      useB = d > 0 || (d === 0 && (!!goneA[k] !== !!goneB[k] ? !!goneB[k] : wa !== wb ? wb > wa : canon(b[k]) > canon(a[k])));
    }
    out[k] = useB ? b[k] : a[k];
    const at = useB ? atB[k] : atA[k], by = useB ? byB[k] : byA[k];
    if (at) out.at[k] = at;
    if (by) (out.by = out.by || {})[k] = by;
    const mark = useB ? heldB[k] : heldA[k];
    if (mark) (out.held = out.held || {})[k] = mark;
    const gone = useB ? goneB[k] : goneA[k];
    if (gone) (out.gone = out.gone || {})[k] = gone;
  }
  return out;
}
// Union of every list by id [D4]; single records with `at` by newest `at`; `plan` holds both kinds.
function merge(mine, theirs, top = true) {
  const out = {};
  for (const k of new Set(Object.keys(mine || {}).concat(Object.keys(theirs || {})))) {
    const a = (mine || {})[k], b = (theirs || {})[k];
    if (top && k === 'rev') out[k] = Math.max(...[a, b].filter(x => typeof x === 'number')) + 1;   // [L merge q3, q5]
    else if (a === undefined || b === undefined) out[k] = Array.isArray(a || b) ? mergeList(a, b) : k === 'plan' ? merge(a, b, false) : (a === undefined ? b : a);
    else if (Array.isArray(a) || Array.isArray(b)) out[k] = mergeList(a, b);
    else if (k === 'plan') out[k] = merge(a, b, false);
    else if (k === 'ui' && a && b && typeof a === 'object') out[k] = mergeUi(a, b);
    else if (a && b && typeof a === 'object' && a.at && b.at) out[k] = pick(a, b);
    else out[k] = a;   // no `at` to compare
  }
  return out;
}
// [L merge q4] Records removed in `mine` that the merge brings back (a newer edit from the other copy):
// the next check-in shows them as "came back".
function cameBack(mine, theirs) {
  const merged = merge(mine, theirs), ids = [];
  for (const k of Object.keys(mine || {})) {
    if (!Array.isArray(mine[k])) continue;
    for (const r of mine[k]) if (r.gone && (merged[k] || []).some(m => m.id === r.id && !m.gone)) ids.push(r.id);
  }
  return ids.sort();
}
// The newest `at` anywhere in a copy (what a device has seen after reading it).
function newestAt(copy) {
  let best = null;
  (function walk(x) {
    if (Array.isArray(x)) return x.forEach(walk);
    if (x && typeof x === 'object') { if (typeof x.at === 'string' && (!best || ms(x.at) > ms(best))) best = x.at; Object.values(x).forEach(walk); }
  })(copy);
  return best;
}

// [M4, AH1] A copy that arrives with an `at` more than a day ahead of the receiving device's own now: that `at` is held
// at the newest `at` the device has seen plus 1 ms (in its own offset) and the warning is shown. [AH1] Only the
// receiver's own now decides: a device back after weeks away takes in what was written meanwhile as it is. Which
// value a held `at` takes is M4's (the newest seen plus 1 ms); SCHEMA_V3 section 14 asks whether AH1 changes it. Every `at` is held: records, `steps` and `rules` entries, and `ui.at` keys.
// [N1] A held `at` is marked `held: { came, at }` (for a `ui` key, in `ui.held`). A copy whose `at` is the
// `came` of the receiving device's own mark for the same thing was held already: it takes the held `at`
// again, is not held a second time, and shows no new warning. [N2] `told` is held the same way as `at`
// (a merge then keeps the earliest `told`, so a record keeps its first held `told`). `by` is left as it came.
// A device that has seen nothing holds nothing (as nextAt).
function holdArriving(copy, lastSeen, mine, now) {
  let warn = false;
  const held = JSON.parse(JSON.stringify(copy || {}));
  if (!now) throw new Error('a copy that arrives is judged against the receiving device\'s own now [AH1]');
  if (!lastSeen) return { copy: held, warn };
  const ahead = t => typeof t === 'string' && ms(t) > ms(now) + DAY;
  const cap = t => { warn = true; return write(ms(lastSeen) + 1, offsetOf(t)); };
  const holdAt = (x, mark) => {   // x has `at`; mark is mine's mark for the same thing, if any
    if (mark && sameMoment(x.at, mark.came)) { x.at = mark.at; x.held = mark; }
    else if (ahead(x.at)) { const came = x.at; x.at = cap(came); x.held = { came, at: x.at }; }
    if (ahead(x.told)) x.told = cap(x.told);   // [N2]
  };
  const twin = (list, v) => (Array.isArray(list) && v && typeof v === 'object'
    ? list.find(m => m && ((v.id !== undefined && m.id === v.id) || (v.id === undefined && v.from !== undefined && m.from === v.from))) : undefined);
  (function walk(x, m, key) {
    if (Array.isArray(x)) return x.forEach(v => walk(v, twin(m, v)));
    if (!x || typeof x !== 'object') return;
    m = m && typeof m === 'object' ? m : undefined;
    if (key === 'ui' && x.at && typeof x.at === 'object') {
      const marks = (m && m.held) || {};
      for (const k of Object.keys(x.at)) {
        const mark = marks[k], t = x.at[k];
        if (mark && sameMoment(t, mark.came)) { x.at[k] = mark.at; (x.held = x.held || {})[k] = mark; }
        else if (ahead(t)) { x.at[k] = cap(t); (x.held = x.held || {})[k] = { came: t, at: x.at[k] }; }
      }
      return;
    }
    if (typeof x.at === 'string') holdAt(x, m && m.held);
    for (const [k, v] of Object.entries(x)) if (k !== 'at' && k !== 'held') walk(v, m && m[k], k);
  })(held, mine);
  return { copy: held, warn };
}
// Receiving a copy: hold what arrives far ahead [M4], then merge it in.
function receive(mine, theirs, lastSeen, now) {
  const h = holdArriving(theirs, lastSeen, mine, now);
  return { copy: merge(mine, h.copy), warn: h.warn };
}

// A short story on several devices: edits (with a device clock) and syncs (merge one copy into another).
// A device given an `id` writes it as the record's `by` [L merge q1]. A list may be nested (`plan.budgets`).
function listAt(copy, name, make) {
  const parts = String(name).split('.'); let o = copy;
  for (const p of parts.slice(0, -1)) o = o[p] || (make ? (o[p] = {}) : {});
  const last = parts[parts.length - 1];
  return o[last] || (make ? (o[last] = []) : []);
}
function devices({ devices: devs, copy, steps, show }) {
  const st = {};
  for (const [name, d] of Object.entries(devs)) st[name] = { id: d.id, lastSeen: d.lastSeen, copy: JSON.parse(JSON.stringify(copy || {})) };
  const seen = (d, t) => { if (t && (!d.lastSeen || ms(t) > ms(d.lastSeen))) d.lastSeen = t; };
  for (const s of steps) {
    if (s.sync) {   // the receiving device holds what arrives more than a day ahead of its own now (`now` on the step) [M4, AH1]
      const from = st[s.sync], to = st[s.to], h = holdArriving(from.copy, to.lastSeen, to.copy, s.now);
      to.copy = merge(to.copy, h.copy); seen(to, newestAt(h.copy)); continue;
    }
    const d = st[s.on], at = nextAt(s.now, d.lastSeen), list = listAt(d.copy, s.edit.list, true);
    const by = d.id ? { by: d.id } : {};
    const id = s.edit.make ? idFor(s.edit.make) : s.edit.id;   // [O2] a record written for a known moment
    const i = list.findIndex(r => r.id === id);
    if (i >= 0) list[i] = Object.assign({}, list[i], s.edit.set, by, { at });   // an edit moves `at`, never `told` [H1]
    else list.push(Object.assign({ id }, s.edit.set, by, { told: at, at }));   // `told` is set once, when made
    const k = s.edit.key;   // [AE1] a keyed override's key, written with its own `at` and `by` from the same clock
    if (k) { const r = list[i >= 0 ? i : list.length - 1]; r[k.map] = Object.assign({}, r[k.map], { [k.k]: Object.assign({}, (r[k.map] || {})[k.k], k.set, by, { at }) }); }
    seen(d, at);
  }
  return listAt(st[show.on].copy, show.list).find(r => r.id === show.id);
}

// [AB watch, AE5] Restoring an older backup while the cloud copy is on. A union merge would bring back everything newer
// at the next sync, so the restore writes: `gone` (the restore's day) with a new `at` for every record newer than the
// backup (not in it), and the backup's records with a new `at`, so the merge keeps the restore. [AE5] The new `at` is
// the D4 clock (`nextAt`: the larger of now and the newest `at` this device has seen plus 1 ms), never the raw time, so
// a device whose clock is behind still restores all of it. It covers every list alike: records with built ids (`set:`,
// `pe:`, `mv:draw:`), `pendingMove` entries and the frozen texts. Inside a restored record the `steps`, `rules` and
// `extraSteps` entries merge by their own `at` [L merge q2], so the backup's entries get the new `at` too and an entry
// not in the backup is removed by its own `gone` [M3]; each key of a keyed override (`amounts`, `once`) likewise [AE1].
// A restore is an edit, so a record keeps the held mark this device knows for it [N1] (its own, else the backup's),
// and a far-ahead copy of it still in the cloud counts at its held `at` and cannot beat the restore. `told` stays the
// first one each record had [H1]. [AD8, AF3] The shared `ui` keys take the backup's values with a new `at` and `by`; a
// key not in the backup is removed by its own `gone` in `ui.gone`. [AE5] A backup in the 38.31 format (a copy with
// `cfg`, `steps`, `once`, `receipts`, `items` or `cards` and no `v: 3`) is moved first (move_ref, with the person's
// answers to the move's questions), and every record it gives is stamped with the restore.
const OLD_KEYS = ['cfg', 'steps', 'once', 'receipts', 'items', 'cards'];
const isOldFormat = b => isMap(b) && b.v !== 3 && OLD_KEYS.some(k => k in b);
function restore({ current, backup, now, by, lastSeen, answers }) {
  // [D4, AH1] What the device has seen includes its own copy: the stamp is newer than every `at` in it.
  const seen = [lastSeen, newestAt(current)].filter(Boolean).sort((a, b) => ms(b) - ms(a))[0];
  const at = nextAt(now, seen), day = String(now).slice(0, 10), stamp = { at, by };
  if (isOldFormat(backup)) backup = require('./move_ref').movedBackup({ copy: backup, answers, now, by, at });
  const earliest = (...t) => t.filter(Boolean).sort((a, b) => ms(a) - ms(b))[0];
  const restoreRecord = (r, c) => {
    const o = Object.assign({}, r, stamp);
    const told = earliest(r.told, c && c.told); if (told) o.told = told;
    const mark = (c && c.held) || r.held; if (mark) o.held = mark;
    for (const k of ENTRY_LISTS) if (Array.isArray(r[k]) || (c && Array.isArray(c[k]))) {
      const mine = (r[k] || []).map(e => Object.assign({}, e, stamp));
      const newer = ((c && c[k]) || []).filter(e => !(r[k] || []).some(b => b.from === e.from)).map(e => Object.assign({}, e, { gone: e.gone || day }, stamp));
      o[k] = mine.concat(newer).sort((x, y) => (x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
    }
    for (const k of keyedFields(r, c)) {   // [AE1, AH5] every keyed map, found by its shape
      const bk = r[k] || {}, ck = (c && c[k]) || {}, m = {};
      for (const key of Object.keys(bk)) m[key] = Object.assign({}, bk[key], stamp);
      for (const key of Object.keys(ck)) if (!(key in bk)) m[key] = Object.assign({}, ck[key], { gone: ck[key].gone || day }, stamp);
      o[k] = m;
    }
    return o;
  };
  const restoreList = (cur, bak) => {
    const have = new Map((bak || []).map(r => [r.id, r])), out = [];
    for (const r of bak || []) out.push(restoreRecord(r, (cur || []).find(x => x.id === r.id)));
    for (const r of cur || []) if (!have.has(r.id)) out.push(Object.assign({}, r, { gone: r.gone || day }, stamp));
    return out.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  };
  const walk = (cur, bak) => {
    const out = {};
    for (const k of new Set(Object.keys(cur || {}).concat(Object.keys(bak || {})))) {
      const a = (cur || {})[k], b = (bak || {})[k];
      if (Array.isArray(a) || Array.isArray(b)) out[k] = restoreList(a, b);
      else if (k === 'plan') out[k] = walk(a, b);
      else if (b && typeof b === 'object' && typeof b.at === 'string') out[k] = restoreRecord(b, a);   // home, plan.limits
      else if (k === 'ui' && b && typeof b === 'object') {   // [AD8] the backup's values, each with a new `at` and `by`; [AF3] the rest `gone`
        const META = ['at', 'by', 'held', 'gone'], keys = Object.keys(b).filter(x => !META.includes(x));
        const extra = Object.keys(a || {}).filter(x => !META.includes(x) && !keys.includes(x));
        const o = Object.assign({}, b);
        for (const x of extra) o[x] = a[x];
        const all = keys.concat(extra);
        o.at = Object.fromEntries(all.map(x => [x, at])); o.by = Object.fromEntries(all.map(x => [x, by]));
        const gone = Object.assign({}, b.gone); for (const x of extra) gone[x] = ((a && a.gone) || {})[x] || day;
        if (Object.keys(gone).length) o.gone = gone; else delete o.gone;
        const held = Object.assign({}, b.held, (a && a.held) || {}); for (const x of Object.keys(held)) if (!all.includes(x)) delete held[x];
        if (Object.keys(held).length) o.held = held; else delete o.held;
        out[k] = o;
      }
      else if (b !== undefined) out[k] = b;   // the rest: the backup's as it is
    }
    return out;
  };
  return walk(current, backup);
}

function ask(question, input) {
  switch (question) {
    case 'restore': { const r = restore(input); return input.show ? Object.fromEntries(input.show.map(k => [k, r[k]])) : r; }
    case 'restore_merge': { const r = restore(input); return { mine_first: merge(r, input.cloud), theirs_first: merge(input.cloud, r) }; }
    case 'next_at': return nextAt(input.now, input.lastSeen);
    case 'next_at_warn': return nextAtWarn(input.now, input.lastSeen, input.lastDay);
    case 'clock_ask': return clockAsk(input.today, input.lastDay);
    case 'newer': return newer(input.a, input.b);
    case 'merge': return merge(input.mine, input.theirs);
    case 'merge_symmetric': return canon(merge(input.mine, input.theirs)) === canon(merge(input.theirs, input.mine));
    case 'merge_same': return canon(merge(input.copy, input.copy)) === canon(merge(input.copy, {}));
    case 'came_back': return cameBack(input.mine, input.theirs);
    case 'receive': return receive(input.mine, input.theirs, input.lastSeen, input.now);
    case 'devices': return devices(input);
    case 'id_for': return idFor(input);
    case 'id_ok': return idOk(input.id);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, restore, mergeKeyed, keyedShape, isOldFormat, nextAt, nextAtWarn, clockAsk, newer, merge, mergeList, pick, winner, cameBack, holdArriving, receive, idFor, idOk };
