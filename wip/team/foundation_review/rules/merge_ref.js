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
// [AJ1] The schedule, place or account inside a built id is read by the one shared reader (rules/ids.js): an ordinary
// id (`set:k7qzpa-m2xq7ab9zt-41@2026-12-25`, `rm:k7qzpa-m2xq7ab9zt-9`), a moved one or a short made-up one.
const IDS = require('./ids');
const REF = IDS.REF, OCC = IDS.OCC;
const BUILT = new RegExp('^((set|auto|skip):' + OCC + '|pe:' + OCC + ':' + REF + '|ps:' + OCC + '|(rm|close):' + REF + '|close:' + REF + ':[1-9]\\d*)$');
const plainOk = id => typeof id === 'string' && (new RegExp('^' + IDS.ORDINARY + '$').test(id) || BUILT.test(id));
// [X1] `mv:<kind>:<38.31 id or key>`; [X2] `fee:` and the id of the transfer it belongs to (never a fee itself).
const MOVED = new RegExp('^' + IDS.MOVED + '$');
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
// [AJ2] A list whose entries carry `id` instead of `from` (pay-later `plans`) merges the same way by `id`.
function mergeEntries(a, b, key = 'from') {
  const byKey = new Map();
  for (const e of a.concat(b)) byKey.set(e[key], byKey.has(e[key]) ? winner(...heldPair(byKey.get(e[key]), e)) : e);
  return [...byKey.values()].sort((x, y) => (x[key] < y[key] ? -1 : x[key] > y[key] ? 1 : 0));
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
// [AI2] An entry list is found by its shape too: a field whose value is an array whose items all carry `from` and `at`
// merges entry by entry by `from`, so a list a later build adds (a field no build knows yet) merges entry by entry on
// older devices too. `steps`, `rules` and `extraSteps` are entry lists whatever they hold.
// [AJ2] An array whose items all carry `id` and `at` is an entry list too, merged by `id` (pay-later `plans`: two plans
// added on two devices both stay). The shape is judged on either copy, so a list empty on one side (a copy that never
// wrote to it) still merges entry by entry [AJ-confirm].
const ENTRY_LISTS = ['steps', 'rules', 'extraSteps'], KEYED = ['amounts', 'once'];
const isMap = x => !!x && typeof x === 'object' && !Array.isArray(x);
const shapeBy = key => v => Array.isArray(v) && v.length > 0 && v.every(e => isMap(e) && e[key] !== undefined && typeof e.at === 'string');
const entryShape = shapeBy('from'), idShape = shapeBy('id');
// The fields of two copies of a record that are entry lists, each with the key its entries merge by [L merge q2, AE1,
// AI2, AJ2]: `from` for `steps`, `rules`, `extraSteps` and any list shaped like them, else `id` for a list whose items
// all carry `id` and `at`.
function entryFields(x, y) {
  x = x || {}; y = y || {};
  const out = [];
  for (const k of new Set(Object.keys(x).concat(Object.keys(y)))) {
    if (ENTRY_LISTS.includes(k)) { if (Array.isArray(x[k]) || Array.isArray(y[k])) out.push([k, 'from']); continue; }
    // an array on one copy (or both) with the shape, and nothing but an array or nothing on the other
    if (![x[k], y[k]].every(v => v === undefined || Array.isArray(v))) continue;
    if (entryShape(x[k]) || entryShape(y[k])) out.push([k, 'from']);
    else if (idShape(x[k]) || idShape(y[k])) out.push([k, 'id']);
  }
  return out;
}
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
// [AL1] One shape for every record of separately edited fields: the shared `ui`, `home`, `plan.limits` and `imports.cats`.
// The value of each field is `{ v, at, by, gone }` (with its `held` mark once held), exactly like a keyed override key
// [AE1]; `home.curs` is an entry list inside it [AJ3]. Such a record has no `at` of its own. It is found by its shape,
// never by its name: a map with no `at` of its own whose values are field values, entry lists, or such maps again
// (`imports` holds `cats`). One handler settles keyed overrides and these records alike: a field value by `winner`
// (newer `at`, then `gone`, then the larger `by` [H6, M5]) with the held marks [N1], an entry list entry by entry
// [AI2, AJ2], a map with no `at` of its own key by key again. The same shape is what holding (`holdArriving`),
// restoring (`restoreKeyed`) and what a device has seen (`newestAt`) read [AL1, AL2]; nothing looks for the name `ui`.
const fieldValue = x => isMap(x) && typeof x.at === 'string';
function fieldsShape(x) {
  if (!isMap(x) || typeof x.at === 'string') return false;
  const vs = Object.values(x);
  return vs.some(v => !Array.isArray(v))
    && vs.every(v => fieldValue(v) || (Array.isArray(v) && (!v.length || entryShape(v) || idShape(v))) || fieldsShape(v));
}
const listKeyOf = (x, y) => ((idShape(x) || idShape(y)) && !(entryShape(x) || entryShape(y)) ? 'id' : 'from');
function mergeKeyed(a, b) {
  const out = {};
  for (const k of new Set(Object.keys(a || {}).concat(Object.keys(b || {})))) {
    const x = (a || {})[k], y = (b || {})[k];
    if (x === undefined || y === undefined) out[k] = x === undefined ? y : x;
    else if (Array.isArray(x) || Array.isArray(y)) out[k] = mergeEntries(Array.isArray(x) ? x : [], Array.isArray(y) ? y : [], listKeyOf(x, y));   // [AJ3] `home.curs`
    else if (isMap(x) && isMap(y) && !fieldValue(x) && !fieldValue(y)) out[k] = mergeKeyed(x, y);   // [AL1] `cats` inside `imports`
    else out[k] = isMap(x) && isMap(y) ? winner(...heldPair(x, y)) : winner({ v: x }, { v: y }).v;
  }
  return out;
}
function pick(x, y) {
  [x, y] = heldPair(x, y);
  const win = winner(x, y);
  const out = Object.assign({}, win);   // whole record, unknown fields kept (section 0)
  // [AE1] An entry list or a keyed map held by either copy is merged, never taken whole from the winner: nothing is
  // deleted (section 0), so a copy that lacks one never wrote it, and the other copy's entries and keys stay.
  for (const [k, key] of entryFields(x, y)) out[k] = mergeEntries(x[k] || [], y[k] || [], key);   // [AI2, AJ2] found by shape too
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
// Union of every list by id [D4]; single records with `at` by newest `at`; records of separately edited fields
// (shared `ui`, `home`, `plan.limits`, `imports`) field by field [AL1]; `plan` holds lists and `limits`.
function merge(mine, theirs, top = true) {
  const out = {};
  for (const k of new Set(Object.keys(mine || {}).concat(Object.keys(theirs || {})))) {
    const a = (mine || {})[k], b = (theirs || {})[k];
    if (top && k === 'rev') out[k] = Math.max(...[a, b].filter(x => typeof x === 'number')) + 1;   // [L merge q3, q5]
    else if (a === undefined || b === undefined) out[k] = Array.isArray(a || b) ? mergeList(a, b) : k === 'plan' ? merge(a, b, false) : (a === undefined ? b : a);
    else if (Array.isArray(a) || Array.isArray(b)) out[k] = mergeList(a, b);
    else if (k === 'plan') out[k] = merge(a, b, false);
    else if (fieldValue(a) && fieldValue(b)) out[k] = pick(a, b);   // a single record with its own `at`
    else if (isMap(a) && isMap(b) && (fieldsShape(a) || fieldsShape(b))) out[k] = mergeKeyed(a, b);   // [AL1] found by shape
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
// The newest `at` anywhere in a copy (what a device has seen after reading it). [AL2] Every `at` at any depth: records,
// entries, keyed override keys and the field values of `ui`, `home`, `plan.limits` and `imports.cats`, compared as
// moments. A held mark's `came` is not an `at`: the far-ahead time it came with is never seen [AI1].
function newestAt(copy) {
  let best = null;
  (function walk(x) {
    if (Array.isArray(x)) return x.forEach(walk);
    if (x && typeof x === 'object') {
      if (typeof x.at === 'string' && (!best || ms(x.at) > ms(best))) best = x.at;
      Object.values(x).forEach(walk);
    }
  })(copy);
  return best;
}

// [M4, AH1, AI1] A copy that arrives with an `at` more than a day ahead of the receiving device's own now: that `at` is
// held at that now plus 1 ms (in now's offset), never at the newest `at` seen, and the warning is shown. [AH1] Only the
// receiver's own now decides: a device back after weeks away takes in what was written meanwhile as it is, and what it
// holds lands at its own now, so a spend a fast clock wrote that morning reads as told after a check typed earlier that
// day and still counts [AI1]. Every `at` is held: records, entries of every entry list, keys of keyed maps, and [AL1] the
// field values of `ui`, `home`, `plan.limits` and `imports.cats`, each on its own, found by shape like any of these.
// [N1] A held `at` is marked `held: { came, at }` beside it (for a field value, inside it). A copy whose `at` is the
// `came` of the receiving device's own mark for the same thing was held already: it takes the held `at`
// again, is not held a second time, and shows no new warning. [N2] `told` is held the same way as `at`
// (a merge then keeps the earliest `told`, so a record keeps its first held `told`). `by` is left as it came.
// [AI1] A device that has seen nothing holds against its own now the same way: `lastSeen` plays no part.
function holdArriving(copy, lastSeen, mine, now) {
  let warn = false;
  const held = JSON.parse(JSON.stringify(copy || {}));
  if (!now) throw new Error('a copy that arrives is judged against the receiving device\'s own now [AH1]');
  const ahead = t => typeof t === 'string' && ms(t) > ms(now) + DAY;
  const cap = () => { warn = true; return write(ms(now) + 1, offsetOf(now)); };   // [AI1] the receiver's now plus 1 ms
  const holdAt = (x, mark) => {   // x has `at`; mark is mine's mark for the same thing, if any
    if (mark && sameMoment(x.at, mark.came)) { x.at = mark.at; x.held = mark; }
    else if (ahead(x.at)) { const came = x.at; x.at = cap(came); x.held = { came, at: x.at }; }
    if (ahead(x.told)) x.told = cap(x.told);   // [N2]
  };
  const twin = (list, v) => (Array.isArray(list) && v && typeof v === 'object'
    ? list.find(m => m && ((v.id !== undefined && m.id === v.id) || (v.id === undefined && v.from !== undefined && m.from === v.from))) : undefined);
  (function walk(x, m) {
    if (Array.isArray(x)) return x.forEach(v => walk(v, twin(m, v)));
    if (!x || typeof x !== 'object') return;
    m = m && typeof m === 'object' ? m : undefined;
    if (typeof x.at === 'string') holdAt(x, m && m.held);   // a record, an entry, a key or a field value [AL1]
    for (const [k, v] of Object.entries(x)) if (k !== 'at' && k !== 'held') walk(v, m && m[k]);
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
// An edit with `record` writes a record of separately edited fields instead (`ui`, `home`, `plan.limits`, `imports.cats`,
// named by its path): its fields, or one entry of its entry lists [AJ3, AL1].
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
    const d = st[s.on], at = nextAt(s.now, d.lastSeen);
    const by = d.id ? { by: d.id } : {};
    if (s.edit.record) {   // [AJ3, AL1] a record of separately edited fields: its fields, or an entry of one of its entry lists (`curs`, by `from`)
      // [AL1] each field set is written as a field value `{ v, at, by }` from the same clock, keeping its held mark [N1]
      // and dropping a `gone` (a value set again is not removed); no `told`: these records have none
      const parts = String(s.edit.record).split('.'), last = parts.pop();
      let o = d.copy; for (const p of parts) o = o[p] = Object.assign({}, o[p]);
      const rec = o[last] = Object.assign({}, o[last]);
      for (const [k, v] of Object.entries(s.edit.set || {})) { rec[k] = Object.assign({}, rec[k], { v }, by, { at }); delete rec[k].gone; }
      // a field taken back (Undo of a lesson, a key removed): its own `gone` (the day) with the same `at`, its value kept [AF3]
      for (const k of s.edit.remove || []) rec[k] = Object.assign({}, rec[k], by, { at, gone: String(s.now).slice(0, 10) });
      const e = s.edit.entry;
      if (e) {
        const list = (rec[e.list] || []).slice(), j = list.findIndex(x => x.from === e.from);
        const entry = Object.assign({}, j >= 0 ? list[j] : { from: e.from }, e.set, by, { at });
        if (j >= 0) list[j] = entry; else list.push(entry);
        rec[e.list] = list.sort((x, y) => (x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
      }
      seen(d, at); continue;
    }
    const list = listAt(d.copy, s.edit.list, true);
    const id = s.edit.make ? idFor(s.edit.make) : s.edit.id;   // [O2] a record written for a known moment
    const i = list.findIndex(r => r.id === id);
    if (i >= 0) list[i] = Object.assign({}, list[i], s.edit.set, by, { at });   // an edit moves `at`, never `told` [H1]
    else list.push(Object.assign({ id }, s.edit.set, by, { told: at, at }));   // `told` is set once, when made
    const k = s.edit.key;   // [AE1] a keyed override's key, written with its own `at` and `by` from the same clock
    if (k) { const r = list[i >= 0 ? i : list.length - 1]; r[k.map] = Object.assign({}, r[k.map], { [k.k]: Object.assign({}, (r[k.map] || {})[k.k], k.set, by, { at }) }); }
    seen(d, at);
  }
  if (show.record) return String(show.record).split('.').reduce((o, p) => (o || {})[p], st[show.on].copy);
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
// first one each record had [H1]. [AD8, AF3, AL1] The field values of the shared `ui`, `home`, `plan.limits` and
// `imports.cats` take the backup's values with a new `at` and `by`; one not in the backup is removed by its own `gone`. [AE5] A backup in the 38.31 format (a copy with
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
  const restoreEntries = (rk, ck, key) => {
    const mine = (rk || []).map(e => Object.assign({}, e, stamp));
    const newer = (ck || []).filter(e => !(rk || []).some(b => b[key] === e[key])).map(e => Object.assign({}, e, { gone: e.gone || day }, stamp));
    return mine.concat(newer).sort((x, y) => (x[key] < y[key] ? -1 : x[key] > y[key] ? 1 : 0));
  };
  // [AE1, AD8, AF3, AL1] One handler for every keyed map and every record of separately edited fields (the shared `ui`,
  // `home`, `plan.limits`, `imports.cats`): each key or field value of the backup with a new `at` and `by`, keeping the
  // held mark this device knows for it [N1]; one not in the backup keeps its value and is removed by its own `gone`;
  // an entry list inside (`home.curs`) as any record's [AJ3]; a map with no `at` of its own (`cats` in `imports`) again.
  const restoreKeyed = (bk, ck) => {
    bk = bk || {}; ck = ck || {};
    const o = {};
    for (const k of new Set(Object.keys(bk).concat(Object.keys(ck)))) {
      const b = bk[k], c = ck[k];
      if (Array.isArray(b) || Array.isArray(c)) o[k] = restoreEntries(Array.isArray(b) ? b : [], Array.isArray(c) ? c : [], listKeyOf(b, c));
      else if ((isMap(b) || isMap(c)) && !fieldValue(b) && !fieldValue(c)) o[k] = restoreKeyed(b, c);
      else if (b !== undefined) {
        o[k] = isMap(b) ? Object.assign({}, b, stamp) : b;
        const mark = isMap(b) && ((isMap(c) && c.held) || b.held); if (mark) o[k].held = mark;
      } else o[k] = isMap(c) ? Object.assign({}, c, { gone: c.gone || day }, stamp) : c;
    }
    return o;
  };
  const restoreRecord = (r, c) => {
    const o = Object.assign({}, r, stamp);
    const told = earliest(r.told, c && c.told); if (told) o.told = told;
    const mark = (c && c.held) || r.held; if (mark) o.held = mark;
    for (const [k, key] of entryFields(r, c)) o[k] = restoreEntries(r[k], c && c[k], key);   // [AI2, AJ2] found by shape, by `from` or `id`
    for (const k of keyedFields(r, c)) o[k] = restoreKeyed(r[k], c && c[k]);   // [AE1, AH5] every keyed map, found by its shape
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
      else if (fieldValue(b)) out[k] = restoreRecord(b, a);   // a single record with its own `at`
      else if (fieldsShape(b) || fieldsShape(a)) out[k] = restoreKeyed(b, a);   // [AL1] `ui`, `home`, `plan.limits`, `imports`, by shape
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
    case 'seen': return newestAt(input.copy);   // [AL2] what a device has seen after reading a copy
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, restore, mergeKeyed, keyedShape, fieldsShape, newestAt, isOldFormat, nextAt, nextAtWarn, clockAsk, newer, merge, mergeList, pick, winner, cameBack, holdArriving, receive, idFor, idOk };
