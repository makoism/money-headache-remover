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
// [L merge q8] A now more than a day ahead of the newest `at` seen is held at that point plus 1 ms, and a
// warning is shown. The same cap holds a copy that arrives far ahead (receive, below) [M4].
function nextAtWarn(now, lastSeen) {
  if (lastSeen && ms(now) > ms(lastSeen) + DAY) return { at: write(ms(lastSeen) + 1, offsetOf(now)), warn: true };
  return { at: write(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetOf(now)), warn: false };
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
function pick(x, y) {
  [x, y] = heldPair(x, y);
  const win = winner(x, y);
  const out = Object.assign({}, win);   // whole record, unknown fields kept (section 0)
  for (const k of ['steps', 'rules']) if (Array.isArray(x[k]) && Array.isArray(y[k])) out[k] = mergeEntries(x[k], y[k]);
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
function mergeUi(a, b) {
  const out = { at: {} }, atA = Object.assign({}, a.at), atB = Object.assign({}, b.at), byA = a.by || {}, byB = b.by || {};
  const heldA = Object.assign({}, a.held), heldB = Object.assign({}, b.held);
  // [N1] A key held once keeps its held `at`: its mark is in `ui.held`, beside `ui.at` and `ui.by`.
  for (const k of Object.keys(heldA)) if (!heldB[k] && sameMoment(atB[k], heldA[k].came)) { atB[k] = heldA[k].at; heldB[k] = heldA[k]; }
  for (const k of Object.keys(heldB)) if (!heldA[k] && sameMoment(atA[k], heldB[k].came)) { atA[k] = heldB[k].at; heldA[k] = heldB[k]; }
  for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) {
    if (k === 'at' || k === 'by' || k === 'held') continue;
    let useB;
    if (!(k in a)) useB = true;
    else if (!(k in b)) useB = false;
    else {
      const d = msOr(atB[k]) - msOr(atA[k]), wa = byA[k] || '', wb = byB[k] || '';
      useB = d > 0 || (d === 0 && (wa !== wb ? wb > wa : canon(b[k]) > canon(a[k])));
    }
    out[k] = useB ? b[k] : a[k];
    const at = useB ? atB[k] : atA[k], by = useB ? byB[k] : byA[k];
    if (at) out.at[k] = at;
    if (by) (out.by = out.by || {})[k] = by;
    const mark = useB ? heldB[k] : heldA[k];
    if (mark) (out.held = out.held || {})[k] = mark;
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

// [M4, L merge q8] A copy that arrives with an `at` more than a day ahead of the newest `at` the receiving
// device has seen: that `at` is held at the newest seen plus 1 ms (in its own offset) and the warning is shown,
// as on the device's own write. Every `at` is held: records, `steps` and `rules` entries, and `ui.at` keys.
// [N1] A held `at` is marked `held: { came, at }` (for a `ui` key, in `ui.held`). A copy whose `at` is the
// `came` of the receiving device's own mark for the same thing was held already: it takes the held `at`
// again, is not held a second time, and shows no new warning. [N2] `told` is held the same way as `at`
// (a merge then keeps the earliest `told`, so a record keeps its first held `told`). `by` is left as it came.
// A device that has seen nothing holds nothing (as nextAt).
function holdArriving(copy, lastSeen, mine) {
  let warn = false;
  const held = JSON.parse(JSON.stringify(copy || {}));
  if (!lastSeen) return { copy: held, warn };
  const ahead = t => typeof t === 'string' && ms(t) > ms(lastSeen) + DAY;
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
function receive(mine, theirs, lastSeen) {
  const h = holdArriving(theirs, lastSeen, mine);
  return { copy: merge(mine, h.copy), warn: h.warn };
}

// A short story on several devices: edits (with a device clock) and syncs (merge one copy into another).
// A device given an `id` writes it as the record's `by` [L merge q1].
function devices({ devices: devs, copy, steps, show }) {
  const st = {};
  for (const [name, d] of Object.entries(devs)) st[name] = { id: d.id, lastSeen: d.lastSeen, copy: JSON.parse(JSON.stringify(copy || {})) };
  const seen = (d, t) => { if (t && (!d.lastSeen || ms(t) > ms(d.lastSeen))) d.lastSeen = t; };
  for (const s of steps) {
    if (s.sync) {   // the receiving device holds what arrives far ahead [M4]
      const from = st[s.sync], to = st[s.to], h = holdArriving(from.copy, to.lastSeen, to.copy);
      to.copy = merge(to.copy, h.copy); seen(to, newestAt(h.copy)); continue;
    }
    const d = st[s.on], at = nextAt(s.now, d.lastSeen), list = d.copy[s.edit.list] || (d.copy[s.edit.list] = []);
    const by = d.id ? { by: d.id } : {};
    const id = s.edit.make ? idFor(s.edit.make) : s.edit.id;   // [O2] a record written for a known moment
    const i = list.findIndex(r => r.id === id);
    if (i >= 0) list[i] = Object.assign({}, list[i], s.edit.set, by, { at });   // an edit moves `at`, never `told` [H1]
    else list.push(Object.assign({ id }, s.edit.set, by, { told: at, at }));   // `told` is set once, when made
    seen(d, at);
  }
  return st[show.on].copy[show.list].find(r => r.id === show.id);
}

function ask(question, input) {
  switch (question) {
    case 'next_at': return nextAt(input.now, input.lastSeen);
    case 'next_at_warn': return nextAtWarn(input.now, input.lastSeen);
    case 'newer': return newer(input.a, input.b);
    case 'merge': return merge(input.mine, input.theirs);
    case 'merge_symmetric': return canon(merge(input.mine, input.theirs)) === canon(merge(input.theirs, input.mine));
    case 'merge_same': return canon(merge(input.copy, input.copy)) === canon(merge(input.copy, {}));
    case 'came_back': return cameBack(input.mine, input.theirs);
    case 'receive': return receive(input.mine, input.theirs, input.lastSeen);
    case 'devices': return devices(input);
    case 'id_for': return idFor(input);
    case 'id_ok': return idOk(input.id);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, nextAt, nextAtWarn, newer, merge, mergeList, pick, winner, cameBack, holdArriving, receive, idFor, idOk };
