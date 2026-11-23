// Merging two copies and the hybrid clock (SCHEMA_V3 0 and 2.3; DECISIONS_ROUND2 D4, H1, H6, L).
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
// warning is shown. mg-q10: only on a device's own write.
function nextAtWarn(now, lastSeen) {
  if (lastSeen && ms(now) > ms(lastSeen) + DAY) return { at: write(ms(lastSeen) + 1, offsetOf(now)), warn: true };
  return { at: write(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetOf(now)), warn: false };
}
const nextAt = (now, lastSeen) => nextAtWarn(now, lastSeen).at;
function newer(a, b) { return ms(a) > ms(b) ? 'a' : ms(b) > ms(a) ? 'b' : 'same'; }

// ---------- merging ----------
function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const msOr = t => (t ? ms(t) : -Infinity);
// [L merge q2] `steps` and `rules` entries carry their own `at` and merge by `from`: the newer entry wins.
// mg-q11: the same `at`, the larger as sorted JSON text. mg-q9: an entry is never removed by the union.
function mergeEntries(a, b) {
  const byFrom = new Map();
  for (const e of a.concat(b)) {
    const had = byFrom.get(e.from);
    if (!had) { byFrom.set(e.from, e); continue; }
    const d = msOr(e.at) - msOr(had.at);
    if (d > 0 || (d === 0 && canon(e) > canon(had))) byFrom.set(e.from, e);
  }
  return [...byFrom.values()].sort((x, y) => (x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
}
// One record, two copies. Newest `at` wins; on the same `at` a copy with `gone` wins [H6]; then the larger
// `by`, the device part of the last writer [L merge q1]; with no `by`, the larger as sorted JSON text, so
// both devices agree. `told`: the earliest seen, never the winner's [H1, L merge q7]. The record's `at` is
// the winner's: it moves only when the record changes [L merge q3].
function pick(x, y) {
  let win;
  const ax = ms(x.at), ay = ms(y.at);
  if (ax !== ay) win = ax > ay ? x : y;
  else if (!!x.gone !== !!y.gone) win = x.gone ? x : y;
  else if ((x.by || '') !== (y.by || '')) win = (x.by || '') > (y.by || '') ? x : y;
  else win = canon(x) >= canon(y) ? x : y;
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
// [L merge q6] Shared `ui`: each key by its own `at` in `ui.at`. mg-q11: the same `at`, the larger value.
function mergeUi(a, b) {
  const out = { at: {} }, atA = a.at || {}, atB = b.at || {};
  for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) {
    if (k === 'at') continue;
    let useB;
    if (!(k in a)) useB = true;
    else if (!(k in b)) useB = false;
    else { const d = msOr(atB[k]) - msOr(atA[k]); useB = d > 0 || (d === 0 && canon(b[k]) > canon(a[k])); }
    out[k] = useB ? b[k] : a[k];
    const at = useB ? atB[k] : atA[k];
    if (at) out.at[k] = at;
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

// A short story on several devices: edits (with a device clock) and syncs (merge one copy into another).
// A device given an `id` writes it as the record's `by` [L merge q1].
function devices({ devices: devs, copy, steps, show }) {
  const st = {};
  for (const [name, d] of Object.entries(devs)) st[name] = { id: d.id, lastSeen: d.lastSeen, copy: JSON.parse(JSON.stringify(copy || {})) };
  const seen = (d, t) => { if (t && (!d.lastSeen || ms(t) > ms(d.lastSeen))) d.lastSeen = t; };
  for (const s of steps) {
    if (s.sync) { const from = st[s.sync], to = st[s.to]; to.copy = merge(to.copy, from.copy); seen(to, newestAt(from.copy)); continue; }
    const d = st[s.on], at = nextAt(s.now, d.lastSeen), list = d.copy[s.edit.list] || (d.copy[s.edit.list] = []);
    const by = d.id ? { by: d.id } : {};
    const i = list.findIndex(r => r.id === s.edit.id);
    if (i >= 0) list[i] = Object.assign({}, list[i], s.edit.set, by, { at });   // an edit moves `at`, never `told` [H1]
    else list.push(Object.assign({ id: s.edit.id }, s.edit.set, by, { told: at, at }));   // `told` is set once, when made
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
    case 'devices': return devices(input);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, nextAt, nextAtWarn, newer, merge, pick, cameBack };
