// Merging two copies and the hybrid clock (SCHEMA_V3 0 and 2.3; DECISIONS_ROUND2 D4, H1, H6).
// A plain reference for the engine lane, checked by run_rules.js against rules/merge.json.
// Open points name their question in merge.json.
'use strict';

// ---------- the hybrid clock [D4] ----------
// A time is ISO with its offset, for example 2026-11-23T10:00:00.000+09:00. Compared as a moment.
const ms = t => Date.parse(t);   // a full ISO time with an offset; never a bare date (D8)
function offsetOf(t) { const m = /([+-])(\d\d):(\d\d)$/.exec(t); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0; }
function write(msValue, offsetMin) {
  const d = new Date(msValue + offsetMin * 60000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  const o = Math.abs(offsetMin);
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}`
    + (offsetMin < 0 ? '-' : '+') + p(Math.floor(o / 60)) + ':' + p(o % 60);
}
// The `at` a device writes: the larger of now and (newest seen + 1 ms), in now's offset. mg-q8: no cap.
function nextAt(now, lastSeen) { return write(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetOf(now)); }
function newer(a, b) { return ms(a) > ms(b) ? 'a' : ms(b) > ms(a) ? 'b' : 'same'; }

// ---------- merging ----------
function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
// One record, two copies. Newest `at` wins; on the same `at` a copy with `gone` wins [H6]; else the
// tie-break both devices agree on (mg-q1). `told`: the oldest seen, never the winner's [H1]. mg-q7.
function pick(x, y) {
  let win;
  const ax = ms(x.at), ay = ms(y.at);
  if (ax !== ay) win = ax > ay ? x : y;
  else if (!!x.gone !== !!y.gone) win = x.gone ? x : y;
  else win = canon(x) >= canon(y) ? x : y;
  const out = Object.assign({}, win);   // whole record, unknown fields kept (mg-q2)
  const told = [x.told, y.told].filter(Boolean).sort((a, b) => ms(a) - ms(b))[0];
  if (told) out.told = told;
  return out;
}
function mergeList(a, b) {
  const byId = new Map();
  for (const r of (a || []).concat(b || [])) byId.set(r.id, byId.has(r.id) ? pick(byId.get(r.id), r) : Object.assign({}, r));
  return [...byId.values()].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}
// Union of every list by id [D4]; single records with `at` by newest `at`; `plan` holds both kinds.
function merge(mine, theirs) {
  const out = {};
  for (const k of new Set(Object.keys(mine || {}).concat(Object.keys(theirs || {})))) {
    const a = (mine || {})[k], b = (theirs || {})[k];
    if (a === undefined || b === undefined) out[k] = Array.isArray(a || b) ? mergeList(a, b) : k === 'plan' ? merge(a, b) : (a === undefined ? b : a);
    else if (Array.isArray(a) || Array.isArray(b)) out[k] = mergeList(a, b);
    else if (k === 'plan') out[k] = merge(a, b);
    else if (a && b && typeof a === 'object' && a.at && b.at) out[k] = pick(a, b);
    else out[k] = a;   // mg-q6: no `at` to compare; mg-q5: `rev` is not worked out here
  }
  return out;
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
function devices({ devices: devs, copy, steps, show }) {
  const st = {};
  for (const [name, d] of Object.entries(devs)) st[name] = { lastSeen: d.lastSeen, copy: JSON.parse(JSON.stringify(copy || {})) };
  const seen = (d, t) => { if (t && (!d.lastSeen || ms(t) > ms(d.lastSeen))) d.lastSeen = t; };
  for (const s of steps) {
    if (s.sync) { const from = st[s.sync], to = st[s.to]; to.copy = merge(to.copy, from.copy); seen(to, newestAt(from.copy)); continue; }
    const d = st[s.on], at = nextAt(s.now, d.lastSeen), list = d.copy[s.edit.list] || (d.copy[s.edit.list] = []);
    const i = list.findIndex(r => r.id === s.edit.id);
    if (i >= 0) list[i] = Object.assign({}, list[i], s.edit.set, { at });   // an edit moves `at`, never `told` [H1]
    else list.push(Object.assign({ id: s.edit.id }, s.edit.set, { told: at, at }));   // `told` is set once, when made
    seen(d, at);
  }
  return st[show.on].copy[show.list].find(r => r.id === show.id);
}

function ask(question, input) {
  switch (question) {
    case 'next_at': return nextAt(input.now, input.lastSeen);
    case 'newer': return newer(input.a, input.b);
    case 'merge': return merge(input.mine, input.theirs);
    case 'merge_symmetric': return canon(merge(input.mine, input.theirs)) === canon(merge(input.theirs, input.mine));
    case 'merge_same': return canon(merge(input.copy, input.copy)) === canon(merge(input.copy, {}));
    case 'devices': return devices(input);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, nextAt, newer, merge, pick };
