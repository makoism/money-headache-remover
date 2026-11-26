/* The Burrow engine: the version one sync (SCHEMA_V3 0 and 2.3; DECISIONS_ROUND2 AQ1 to AQ4, AT, AW, BA3, BD5).
   Ported once from the frozen reference foundation_review/rules/sync_v1_ref.js (AX2: the engine is the only
   implementation from here; the reference stays as the spec). Checked by engine/test/sync.test.js against every case of
   rules/sync_v1.json, and by the two-device fuzz (rules/fuzz_two_devices.js) run on this file.
   What it does: the cloud copy's revision (compare and swap) [AQ1]; records joined by id [AQ2]; a three-way join against
   the copy the device last synced, where the same item changed two ways on two devices is asked and every version is kept
   in `keptVersions` [AQ3, AW7]; the one-device checks after a sync, each failure a question [AQ4]; the answers.
   What changed from the reference, nothing else: the occurrence code is the engine's own (schedules.js dueDays reads the
   saved rule kinds), the few pieces of merge_ref.js, edits_ref.js and rules/ids.js it used are copied in below, and
   text is turned into bytes with TextEncoder (no Buffer), so it runs in the page.
   Plain browser JavaScript; uses dates.js, ids.js and schedules.js. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const D = node ? require('./dates.js') : root.BurrowEngine.dates;
  const IDS = node ? require('./ids.js') : root.BurrowEngine.ids;
  const SC = node ? require('./schedules.js') : root.BurrowEngine.schedules;
  const LG = node ? require('./ledger.js') : root.BurrowEngine.ledger;
  const { dayNum, dayStr } = D;
  const { ORDINARY, MOVED: MOVED_TEXT, REF, DATE } = IDS;

  // ---------- from merge_ref.js: the hybrid clock, which copy wins, the named dues, ids [D4, H6, O2, O3, X1, X2] ----------
  const M = (() => {
    const ms = t => Date.parse(t);
    const msOr = t => (t ? ms(t) : -Infinity);
    function offsetOf(t) { const m = /([+-])(\d\d):(\d\d)$/.exec(t); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0; }
    function write(msValue, offsetMin) {
      const d = new Date(msValue + offsetMin * 60000);
      const p = (n, w = 2) => String(n).padStart(w, '0');
      const o = Math.abs(offsetMin);
      return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}`
        + (offsetMin < 0 ? '-' : '+') + p(Math.floor(o / 60)) + ':' + p(o % 60);
    }
    // The `at` a device writes: the larger of now and (newest seen + 1 ms), in now's offset [D4, AH1].
    const nextAt = (now, lastSeen) => write(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetOf(now));
    function canon(x) {
      if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
      if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
      return JSON.stringify(x);
    }
    // The newer `at`; on the same `at` the copy with `gone` [H6]; then the larger `by` [M5]; then the larger as text.
    function winner(x, y) {
      const d = msOr(x.at) - msOr(y.at);
      if (d) return d > 0 ? x : y;
      if (!!x.gone !== !!y.gone) return x.gone ? x : y;
      if ((x.by || '') !== (y.by || '')) return (x.by || '') > (y.by || '') ? x : y;
      return canon(x) >= canon(y) ? x : y;
    }
    // The newest `at` anywhere in a copy [AL2].
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
    // The due days a copy names for one schedule: settled, period-end and period-start ids, keyed amounts, `once` keys.
    function namedDues(copy, sid) {
      const out = new Set(), take = n => { const o = IDS.occurrence(n); if (o && o.schedule === sid) out.add(o.due); };
      for (const e of copy.events || []) {
        if (e.gone) continue;
        for (const x of [].concat(e.settles || [])) take(x && typeof x === 'object' ? x.s + '@' + x.due : x);
        if (/^(pe|ps):/.test(String(e.id))) take(String(e.id).slice(3));
      }
      const s = (copy.schedules || []).find(x => x.id === sid) || {};
      for (const [d, v] of Object.entries(s.amounts || {})) if (!(v && v.gone)) out.add(d);
      const plan = copy.plan || {};
      for (const r of [].concat(plan.budgets || [], plan.shares || [])) for (const [k, v] of Object.entries((r && r.once) || {})) if (!(v && v.gone)) take(k);
      return [...out].sort();
    }
    const OCC = REF + '@' + DATE;
    const BUILT = new RegExp('^((set|auto|skip):' + OCC + '|pe:' + OCC + ':' + REF + '|ps:' + OCC + '|(rm|close):' + REF + '|close:' + REF + ':[1-9]\\d*)$');
    const ORD = new RegExp('^' + ORDINARY + '$'), MOVED = new RegExp('^' + MOVED_TEXT + '$');
    const plainOk = id => typeof id === 'string' && (ORD.test(id) || BUILT.test(id));
    const idOk = id => typeof id === 'string' && (plainOk(id) || MOVED.test(id) || (id.startsWith('fee:') && plainOk(id.slice(4))));
    return { nextAt, winner, newestAt, namedDues, idOk };
  })();
  // ---------- from edits_ref.js [AN3]: a main bank whose own `minBank` is set holds one figure in two places ----------
  function minOk({ home, accounts }) {
    const m = home && home.main && home.main.v ? home.main.v.acct : null;
    const a = (accounts || []).find(x => x.id === m);
    return a && a.minBank != null ? { refused: true, account: m, field: 'minBank' } : { ok: true };
  }

  const ms = t => Date.parse(t);
  const isMap = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const fieldValue = x => isMap(x) && typeof x.at === 'string';
  // A list of records (every item with a string `id`, ids all different) is a set by id: its order is never a change
  // (section 0; sync_v1 sy-59, the fuzz's first failure). Any other list keeps its order.
  function canon(x) {
    if (Array.isArray(x)) {
      const byId = x.length > 1 && x.every(i => isMap(i) && typeof i.id === 'string') && new Set(x.map(i => i.id)).size === x.length;
      return '[' + (byId ? x.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) : x).map(canon).join(',') + ']';
    }
    if (isMap(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
    return JSON.stringify(x);
  }
  const C = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  // ---------- what counts as the same content [AQ3] ----------
  // When and by whom are not content. `gone` is read as yes or no (two removals on different days are one removal).
  const NOT_CONTENT = new Set(['at', 'by', 'told', 'held', 'goneBy']);
  function content(x) {
    if (Array.isArray(x)) return x.map(content);
    if (!isMap(x)) return x;
    const o = {};
    for (const k of Object.keys(x)) {
      if (NOT_CONTENT.has(k)) continue;
      if (k === 'gone') { if (x.gone) o.gone = true; continue; }
      o[k] = content(x[k]);
    }
    return o;
  }
  // [AP3] An import line's `src` (the file it was read from, the dates that file covers) is not content either: the id says
  // which line it is, so the same line read from a mid-month CSV on one device and the month's PDF on the other is one
  // record (sync_v1 sy-58, found by the fuzz's first design).
  function contentOf(x) {
    const o = content(x);
    if (isMap(x) && typeof x.id === 'string' && x.id.startsWith('imp:')) delete o.src;
    return o;
  }
  const same = (x, y) => canon(contentOf(x)) === canon(contentOf(y));
  const earliest = (...ts) => ts.filter(t => typeof t === 'string').sort((a, b) => ms(a) - ms(b) || (a < b ? -1 : a > b ? 1 : 0))[0];
  const newest = (...ts) => ts.filter(t => typeof t === 'string').sort((a, b) => ms(b) - ms(a) || (a > b ? -1 : a < b ? 1 : 0))[0];

  // [AP7, AN7] A field value's `src`: a person's lesson (or no `src`) 3, a moved value 2, a reader's guess 1.
  const RANK = { reader: 1, moved: 2, person: 3 };
  const rankOf = x => (fieldValue(x) && typeof x.src === 'string' && RANK[x.src] ? RANK[x.src] : 3);

  // The versions kept for one item: one per content, each its newest instance, listed by `at` (then text) [AQ3].
  function versionsOf(list) {
    const byContent = new Map();
    for (const v of list) {
      const k = canon(contentOf(v));
      byContent.set(k, byContent.has(k) ? M.winner(byContent.get(k), v) : v);
    }
    return [...byContent.values()].sort((a, b) => ms(a.at) - ms(b.at) || (canon(a) < canon(b) ? -1 : 1));
  }
  function keptRecord(of, where, versions, ask, both) {
    const vs = versionsOf(versions), last = vs.reduce((w, v) => (!w || M.winner(w, v) === v ? v : w), null);
    return Object.assign({ id: 'kept:' + of, of, in: where, versions: vs, ask }, both ? { both } : {}, { told: earliest(...vs.map(v => v.told || v.at)), at: last.at, by: last.by });
  }
  // [AW6] A record changed on two devices in different fields: "keep both" is offered, the base with each device's changed
  // fields (each list entry keeps its own `at` and `by`), the newer `at` and `by`, the earliest `told`.
  function keepBoth(b, m, t) {
    if (!isMap(b) || !isMap(m) || !isMap(t) || m.gone || t.gone) return null;
    const keys = new Set([...Object.keys(b), ...Object.keys(m), ...Object.keys(t)].filter(k => !NOT_CONTENT.has(k)));
    const changed = x => [...keys].filter(k => canon(content(x[k])) !== canon(content(b[k])));
    const cm = changed(m), ct = changed(t);
    if (!cm.length || !ct.length || cm.some(k => ct.includes(k))) return null;
    const w = M.winner(m, t), o = C(b);
    for (const k of cm) { if (m[k] === undefined) delete o[k]; else o[k] = C(m[k]); }
    for (const k of ct) { if (t[k] === undefined) delete o[k]; else o[k] = C(t[k]); }
    const told = earliest(m.told, t.told);
    return Object.assign(o, told ? { told } : {}, { at: w.at, by: w.by });
  }
  // [AW6] Check-ins that differ only in their `settled` lists are joined three ways: what either device ticked since the base
  // is added, what either unticked is taken off.
  // [CHECKFIX] and its `fillerPlace` account by account: two devices changing where the gap went for different accounts
  // keep both; one account changed on one side takes that side's; changed on both, the newer write's
  function joinSettled(b, m, t) {
    const strip = x => { const o = content(x); delete o.settled; delete o.fillerPlace; return canon(o); };
    if (!isMap(m) || !isMap(t) || m.gone || t.gone || strip(m) !== strip(t)) return null;
    const bs = new Set((b && b.settled) || []), mset = new Set(m.settled || []), ts = new Set(t.settled || []);
    const all = [...new Set([...bs, ...mset, ...ts])].filter(x => (bs.has(x) ? mset.has(x) && ts.has(x) : mset.has(x) || ts.has(x))).sort();
    const w = M.winner(m, t), told = earliest(m.told, t.told);
    const bf = (b && b.fillerPlace) || {}, mf = m.fillerPlace || {}, tf = t.fillerPlace || {}, places = {};
    for (const k of [...new Set([...Object.keys(bf), ...Object.keys(mf), ...Object.keys(tf)])].sort()) {
      const mc = mf[k] !== bf[k], tc = tf[k] !== bf[k];
      const v = mc && tc ? (w === m ? mf[k] : tf[k]) : mc ? mf[k] : tf[k];
      if (v != null) places[k] = v;
    }
    const o = Object.assign(C(w), { settled: all }, told ? { told } : {});
    if (Object.keys(places).length) o.fillerPlace = places; else delete o.fillerPlace;
    return o;
  }
  // Two copies of one kept record changed on both sides (both answered, or answered and asked again): every version
  // stays; whether it is still asked, and its `at` and `by`, come from the newer [AQ3].
  function joinKept(x, y) {
    const w = M.winner(x, y);
    return Object.assign({}, w, { versions: versionsOf(x.versions.concat(y.versions)), told: earliest(x.told, y.told) });
  }
  // A conflict found in this sync, added to the kept record the item may already have.
  function addConflict(existing, fresh) {
    if (!existing) return fresh;
    const vs = versionsOf(existing.versions.concat(fresh.versions));
    const at = newest(existing.at, fresh.at), by = at === existing.at ? existing.by : fresh.by;
    return Object.assign({}, existing, { versions: vs, ask: existing.ask || fresh.ask, told: earliest(existing.told, fresh.told), at, by });
  }

  // ---------- the three-way join [AQ2, AQ3] ----------
  // One item: its copy on the base, on mine and on theirs. A side that lacks it never changed it (nothing is deleted).
  function item(of, where, b, m, t, isRecord, conflicts) {
    if (m === undefined) m = b;
    if (t === undefined) t = b;
    if (m === undefined) return C(t);
    if (t === undefined) return C(m);
    if (canon(m) === canon(t)) return C(m);
    const mChanged = b === undefined || canon(m) !== canon(b), tChanged = b === undefined || canon(t) !== canon(b);
    if (!tChanged) return C(m);
    if (!mChanged) return C(t);
    const join = shown => {
      const o = C(shown);
      if (isRecord) { const told = earliest(m.told, t.told); if (told) o.told = told; }   // [H1] the first heard
      return o;
    };
    if (same(m, t)) return join(M.winner(m, t));
    if (where === 'checkins') { const j = joinSettled(b, m, t); if (j) return j; }   // [AW6]
    // [AW1] A record a statement line replaced (`goneBy` an `imp:` line), otherwise as the other side has it: the matching
    // write stands, nothing is asked (one device matched it, or the join did).
    const matched = (x, y) => x.gone && String(x.goneBy || '').startsWith('imp:') && !y.gone && same(Object.assign({}, x, { gone: undefined, goneBy: undefined }), y);
    if (isRecord && matched(m, t)) return join(m);
    if (isRecord && matched(t, m)) return join(t);
    // [AW6] A closing transfer written on both devices is worked out again from the joined events (after the join, below):
    // both versions are kept for Undo, nothing is asked.
    if (where === 'events' && /^close:/.test(String(of))) { conflicts.push({ of, where, versions: [m, t], ask: false, recompute: true }); return join(M.winner(m, t)); }
    const rm = rankOf(m), rt = rankOf(t);
    const higher = rm > rt ? m : t;
    const byRank = rm !== rt && !higher.gone;   // [AP7] a guess never replaces a lesson that was not taken back
    conflicts.push({ of, where, versions: [m, t], ask: !byRank, both: !byRank && isRecord ? keepBoth(b, m, t) : null });
    return join(byRank ? higher : M.winner(m, t));
  }
  const isRecords = (...ls) => ls.every(l => l === undefined || (Array.isArray(l) && l.every(r => isMap(r) && typeof r.id === 'string')));
  function records(where, b, m, t, conflicts) {
    const index = l => new Map((l || []).map(r => [r.id, r]));
    const B = index(b), Mi = index(m), Ti = index(t), out = [];
    for (const id of [...new Set([...Mi.keys(), ...Ti.keys()])].sort()) out.push(item(id, where, B.get(id), Mi.get(id), Ti.get(id), true, conflicts));
    return out;
  }
  function plain(b, m, t) {
    if (m === undefined) return C(t);
    if (t === undefined || canon(m) === canon(t)) return C(m);
    if (canon(t) === canon(b)) return C(m);
    if (canon(m) === canon(b)) return C(t);
    return canon(m) >= canon(t) ? C(m) : C(t);   // two plain values with no `at`: the larger as text, as AN1
  }
  function walk(b, m, t, path, top, conflicts) {
    b = b || {}; m = m || {}; t = t || {};
    const out = {};
    for (const k of new Set(Object.keys(m).concat(Object.keys(t)))) {
      if (top && k === 'keptVersions') continue;
      const x = m[k], y = t[k], z = b[k], p = path ? path + '.' + k : k;
      if (top && k === 'journal') { out[k] = joinJournal(x, y); continue; }
      if (top && (k === 'rev' || k === 'v') && (typeof x === 'number' || typeof y === 'number')) out[k] = Math.max(...[x, y].filter(n => typeof n === 'number'));
      else if (top && k === 'at' && (typeof x === 'string' || typeof y === 'string')) out[k] = newest(x, y);   // when the copy was saved
      else if (Array.isArray(x) || Array.isArray(y)) out[k] = isRecords(x, y, z) ? records(p, z, x, y, conflicts) : item(p, path, z, x, y, false, conflicts);
      else if (fieldValue(x) || fieldValue(y)) out[k] = item(p, path, z, x, y, false, conflicts);   // one settings item
      else if (isMap(x) || isMap(y)) out[k] = walk(isMap(z) ? z : {}, isMap(x) ? x : {}, isMap(y) ? y : {}, p, false, conflicts);   // `home`, `ui`, `plan`, `imports`
      else out[k] = plain(z, x, y);
    }
    return out;
  }
  // [BZ1] The Undo journal (app3/src/act3.js): one entry per step a device made. Joined by id from both copies, never a
  // question; the same entry on both: the one marked undone (then the one with more records moved since); the latest
  // JOURNAL_KEEP by moment, so a step dropped on both sides is not brought back by the base.
  const JOURNAL_KEEP = 200;
  function joinJournal(x, y) {
    const by = new Map();
    for (const j of [].concat(Array.isArray(x) ? x : [], Array.isArray(y) ? y : [])) {
      if (!isMap(j) || typeof j.id !== 'string') continue;
      const had = by.get(j.id);
      if (!had) { by.set(j.id, j); continue; }
      const score = e => (e.undone ? 2e9 : 0) + Object.keys(e.moved || {}).length;
      if (score(j) > score(had) || (score(j) === score(had) && canon(j) > canon(had))) by.set(j.id, j);
    }
    const mMs = j => { const v = ms(j.moment); return isNaN(v) ? -Infinity : v; };
    return [...by.values()].sort((a, b) => mMs(a) - mMs(b) || (a.id < b.id ? -1 : 1)).slice(-JOURNAL_KEEP).map(C);
  }
  function sync(base, mine, theirs) {
    const conflicts = [];
    const out = walk(base, mine, theirs, '', true, conflicts);
    // The kept records themselves: changed on one side, taken; on both, joined (every version stays) [AQ3].
    const index = c => new Map(((c || {}).keptVersions || []).map(r => [r.id, r]));
    const B = index(base), Mi = index(mine), Ti = index(theirs), kept = new Map();
    for (const id of new Set([...Mi.keys(), ...Ti.keys()])) {
      let x = Mi.get(id), y = Ti.get(id); const z = B.get(id);
      if (x === undefined) x = z; if (y === undefined) y = z;
      if (x === undefined || y === undefined) { kept.set(id, C(x || y)); continue; }
      const xc = z === undefined || canon(x) !== canon(z), yc = z === undefined || canon(y) !== canon(z);
      kept.set(id, C(canon(x) === canon(y) || !yc ? x : !xc ? y : joinKept(x, y)));
    }
    for (const c of conflicts) {
      const fresh = keptRecord(c.of, c.where, c.versions, c.ask, c.both);
      kept.set(fresh.id, addConflict(kept.get(fresh.id), fresh));
    }
    for (const c of conflicts.filter(x => x.recompute)) {
      recomputeClosing(out, c.of);
      // the figure worked out is not a version of its own: joining again adds nothing
      const now = out.events.find(e => e.id === c.of), k = kept.get('kept:' + c.of);
      if (now && k) { k.versions = k.versions.filter(v => !same(v, now)); if (!k.versions.length) kept.delete('kept:' + c.of); }
    }
    if (kept.size) out.keptVersions = [...kept.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
    rematch(out, mine, theirs);
    return out;
  }

  // ---------- after the join: matching again, closings worked out again [AW1, AW6] ----------
  // [AW1] 6.4 matching runs again between import lines and typed or `set:` records that came from the other device (an import
  // on one side only, a record on the other side only): the same account and direction, the same amount (a rough `est` one
  // within 10%), inside the account's posting window either side of the record's day (1 working day, a card 7), or the same
  // occurrence settled. Closest day first, then the earliest `told`, then the id. The record is `gone`, `goneBy` the line, with
  // the newer `at` and `by` of the two (so both devices write the same); the line keeps the record's `told` [O1] and takes its
  // `settles` when it has none.
  const isImp = e => String(e.id).startsWith('imp:');
  const dirOf = e => (e.k === 'spend' ? 'out' : e.k === 'in' || e.k === 'refund' ? 'in' : null);
  const occs = e => [].concat(e.settles || []).map(o => (isMap(o) ? o.s + '@' + o.due : String(o)));
  function rematch(out, mine, theirs) {
    const evs = out.events;
    if (!Array.isArray(evs)) return;
    const ids = c => new Set(((c || {}).events || []).map(e => e.id));
    const Mi = ids(mine), Ti = ids(theirs);
    const accts = new Map((out.accounts || []).map(a => [a.id, a]));
    const win = id => { const a = accts.get(id) || {}; return a.postingDays != null ? a.postingDays : a.type === 'card' ? 7 : 1; };   // [BZ4] an account's kind is its `type`
    const fits = (t, a) => (t.est ? Math.abs(a - t.a) * 10 <= Math.max(a, t.a) : a === t.a);
    const imps = evs.filter(e => !e.gone && isImp(e) && dirOf(e) && e.acct2 == null && typeof e.date === 'string')
      .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : x.id < y.id ? -1 : 1));
    for (const imp0 of imps) {
      const imp = evs.find(e => e.id === imp0.id);
      const inM = Mi.has(imp.id), inT = Ti.has(imp.id);
      if (inM === inT) continue;   // read on both devices (or neither): each device matched it on its own
      const own = inM ? Mi : Ti, other = inM ? Ti : Mi, d = dayNum(imp.date), w = win(imp.acct);
      const io = occs(imp);
      const hits = evs.filter(t => !t.gone && !isImp(t) && t.acct2 == null && dirOf(t) === dirOf(imp) && t.acct === imp.acct
        && other.has(t.id) && !own.has(t.id) && typeof t.date === 'string'
        && ((io.length && occs(t).some(o => io.includes(o))) || (fits(t, Number(imp.a)) && d >= CAL.subWorking(dayNum(t.date), w) && d <= CAL.addWorking(dayNum(t.date), w))))
        .sort((x, y) => Math.abs(dayNum(x.date) - d) - Math.abs(dayNum(y.date) - d) || ms(x.told) - ms(y.told) || (x.id < y.id ? -1 : 1));
      if (!hits.length) continue;
      const t = hits[0], wn = M.winner(imp, t);
      evs[evs.indexOf(t)] = Object.assign({}, t, { gone: String(wn.at).slice(0, 10), goneBy: imp.id, at: wn.at, by: wn.by });
      const told = earliest(imp.told, t.told);
      evs[evs.indexOf(imp)] = Object.assign({}, imp, told ? { told } : {}, !io.length && t.settles ? { settles: C(t.settles) } : {});
    }
  }
  // [AW6] A closing transfer written on both devices: its amount is worked out again from the joined events, what the account
  // holds at its closing before the closing's own records.
  function recomputeClosing(out, of) {
    const i = (out.events || []).findIndex(e => e.id === of);
    if (i < 0) return;
    const rec = out.events[i], id = String(of).slice('close:'.length).split(':')[0];
    const a = live(out.accounts).find(x => x.id === id);
    if (!a || !a.closed) return;
    const fig = figureAtClose(a, live(out.events).filter(e => names(e, id) && typeof e.date === 'string' && !isClosing(e, id)));
    if (fig === null) return;
    out.events[i] = Object.assign({}, rec, { a: rec.acct === id ? fig : -fig });
  }

  // ---------- the revision [AQ1] ----------
  function push({ cloud, baseRev }) {
    return baseRev === cloud.rev ? { accepted: true, rev: cloud.rev + 1 } : { accepted: false, rev: cloud.rev };
  }
  const noRev = c => { const o = Object.assign({}, c); delete o.rev; return o; };
  // One device syncs: behind, it takes the latest first and joins it with its own; then it writes when its copy differs
  // from the cloud's. Its `base` becomes what the cloud holds.
  const hasData = c => !!c && ['accounts', 'schedules', 'events'].some(k => live(c[k]).length);
  // [AW2] A device with its own data and no `sync.base` meeting a cloud copy with data: nothing is joined. Which whole copy to
  // keep is asked (`kept:copy`); the cloud's copy shows meanwhile, and both wait in `keptVersions`, written so either device
  // can answer.
  function wholeCopyQuestion(own, cloudCopy) {
    const strip = c => { const o = C(c); delete o.rev; delete o.keptVersions; return o; };
    const out = C(cloudCopy), vs = [strip(own), strip(cloudCopy)].sort((a, b) => ms(a.at) - ms(b.at) || (canon(a) < canon(b) ? -1 : 1));
    const last = vs[vs.length - 1];
    out.keptVersions = (cloudCopy.keptVersions || []).filter(k => k.id !== 'kept:copy').concat([{ id: 'kept:copy', of: 'copy', in: '', versions: vs, ask: true,
      told: earliest(...vs.map(v => v.at)), at: last.at, by: (last.home && last.home.main && last.home.main.by) || null }]).sort((a, b) => (a.id < b.id ? -1 : 1));
    return out;
  }
  function syncDevice(device, cloud) {
    let copy = device.copy, merged = false;
    if ((device.base === undefined || device.base === null) && hasData(device.copy) && hasData(cloud.copy) && canon(noRev(device.copy)) !== canon(noRev(cloud.copy))) {
      const p = push({ cloud, baseRev: cloud.rev }), written = Object.assign(wholeCopyQuestion(device.copy, cloud.copy), { rev: p.rev });
      return { merged: false, pushed: true, rev: p.rev, device: { copy: written, base: C(written), baseRev: p.rev }, cloud: { rev: p.rev, copy: C(written) } };
    }
    if (device.baseRev !== cloud.rev) { copy = sync(device.base, device.copy, cloud.copy); merged = true; }
    if (canon(noRev(copy)) === canon(noRev(cloud.copy))) {
      return { merged, pushed: false, rev: cloud.rev, device: { copy: C(cloud.copy), base: C(cloud.copy), baseRev: cloud.rev }, cloud };
    }
    const p = push({ cloud, baseRev: cloud.rev });   // based on the latest now
    const written = Object.assign(C(copy), { rev: p.rev });
    return { merged, pushed: true, rev: p.rev, device: { copy: written, base: C(written), baseRev: p.rev }, cloud: { rev: p.rev, copy: C(written) } };
  }
  // [AW5] A refused write: the device took `fetched` and joined; before its write landed the cloud moved on to `cloudNow`. It
  // saves the joined copy with `fetched` as its base before pushing, so the retry joins against the copy it took.
  function race({ device, fetched, cloudNow }) {
    const joined = device.baseRev === fetched.rev ? C(device.copy) : sync(device.base, device.copy, fetched.copy);
    const refused = !push({ cloud: cloudNow, baseRev: fetched.rev }).accepted;
    const r = syncDevice({ copy: joined, base: C(fetched.copy), baseRev: fetched.rev }, cloudNow);
    return { refused, rev: r.rev, copy: r.device.copy };
  }
  function casStory({ cloud, devices, steps }) {
    const st = C(devices); let cl = C(cloud);
    const out = [];
    for (const name of steps) {
      const r = syncDevice(st[name], cl);
      st[name] = r.device; cl = r.cloud;
      out.push({ device: name, merged: r.merged, pushed: r.pushed, rev: r.rev });
    }
    const same = Object.values(st).every(d => canon(noRev(d.copy)) === canon(noRev(cl.copy)));
    return { steps: out, same, rev: cl.rev };
  }

  // ---------- the one-device checks after a sync [AQ4] ----------
  const live = l => (l || []).filter(r => r && !r.gone);
  // [AP2] The look ahead's own occurrence code, for every rule kind of the saved shape (section 5). No holiday table is in
  // the saved copy, so the last working day is read on weekends only here.
  // The engine's own dueDays (schedules.js) reads the saved rule kinds directly; 'none' has no day ever due [B4].
  const CAL = SC.calendar(null, { holidays: [], bankClosed: [] });
  const RULE_KINDS = ['month', 'weeks', 'months', 'monthsList', 'year', 'lastWorkday', 'once'];
  const laRule = r => (r && RULE_KINDS.includes(r.every) ? r : null);
  function makes(rule, due) {
    const r = laRule(rule), n = dayNum(due);
    return !!r && SC.dueDays(r, n - 400, n, CAL).some(x => x.due === n);
  }
  function firstFrom(rule, day) {
    const r = laRule(rule), n = dayNum(day);
    if (!r) return null;
    const d = SC.dueDays(r, n, n + 800, CAL).map(x => x.due).filter(x => x >= n).sort((a, b) => a - b)[0];
    return d === undefined ? null : dayStr(d);
  }
  // [X8, AP2] Every settled or named occurrence must be one its rule (the entry in force on its due date) makes.
  function x8Questions(copy) {
    const out = [];
    for (const s of live(copy.schedules)) {
      const entries = live(s.rules).sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
      if (!entries.length) continue;
      const failing = new Map();
      for (const d of M.namedDues(copy, s.id)) {
        const gov = entries.filter(e => e.from <= d).pop() || entries[0];
        if (!makes(gov.rule, d)) failing.set(gov, (failing.get(gov) || []).concat(d));
      }
      for (const [gov, dues] of failing) {
        const due = dues.sort().pop(), first = gov === entries[0];
        // [AW3, correcting AT2] X8's offer is the day after the settled occurrence for a monthly or weekly rule; for any other
        // rule it is the day after the old rule's next occurrence after the last settled one, so nothing is paid twice in a cycle.
        const old = entries.filter(e => e.from < gov.from).pop();
        const cycle = old && old.rule && !['month', 'weeks', 'lastWorkday'].includes(old.rule.every) ? firstFrom(old.rule, dayStr(dayNum(due) + 1)) : null;
        const offer = first ? null : dayStr(dayNum(cycle || due) + 1);
        out.push({ q: 'x8', schedule: s.id, due, from: gov.from, offer, next: offer && firstFrom(gov.rule, offer) });
      }
    }
    return out;
  }
  // [AP1] Closed accounts. One reopen rule for the look ahead and the sync: any event or check dated after the closing day
  // reopens the account, with a notice. Else the account must hold nothing at its closing: the closing's check (the latest
  // figure dated the closing day) holds everything dated on or before the closing day, whatever its `told`; the closing's
  // own records (`close:<account>`, `close:<account>:<n>`) move money out after it. A check before the closing day holds
  // what is dated before its day, and on its day what was told before it [AN4]. A failure is a question [AQ4, P6].
  const OWED = { card: 1, loan: 1, paylater: 1 };
  const names = (e, id) => [e.acct, e.acct2, e.card].includes(id);
  function delta(e, a) {
    const sign = OWED[a.type] ? -1 : 1, amt = Number(e.a) || 0;   // [BZ4] `type`, never `kind`
    let d = 0;
    if (e.k === 'in' || e.k === 'refund') { if (e.acct === a.id) d += amt; }
    else if (e.k === 'spend') { if (e.acct === a.id) d -= amt; }
    else if (e.k === 'adjust') { if (e.acct === a.id) d += amt; }
    else if (['transfer', 'convert', 'repay', 'borrow'].includes(e.k)) {
      if (e.acct === a.id) d -= amt;
      if (e.acct2 === a.id) d += e.a2 != null ? Number(e.a2) : amt;
    }
    return sign * d;
  }
  const isClosing = (e, id) => e.id === 'close:' + id || String(e.id).startsWith('close:' + id + ':');
  function figureAtClose(a, evs) {
    const cd = dayNum(a.closed);
    const bases = evs.filter(e => (e.k === 'check' || e.k === 'open') && e.acct === a.id && dayNum(e.date) <= cd)
      .sort((x, y) => dayNum(x.date) - dayNum(y.date) || ms(x.told) - ms(y.told));
    const base = bases[bases.length - 1];
    if (!base) return null;
    const closingCheck = dayNum(base.date) === cd;
    let fig = Number(base.a) || 0;
    for (const e of evs) {
      if (e === base || e.k === 'check' || e.k === 'open' || dayNum(e.date) > cd) continue;
      const d = dayNum(e.date), bd = dayNum(base.date);
      const after = isClosing(e, a.id) ? true : closingCheck ? false : d > bd || (d === bd && ms(e.told) > ms(base.told));
      if (after) fig += delta(e, a);
    }
    return fig;
  }
  function closedChecks(copy) {
    const questions = [], notices = [];
    for (const a of live(copy.accounts)) {
      if (!a.closed) continue;
      const evs = live(copy.events).filter(e => names(e, a.id) && typeof e.date === 'string');
      // [AV1] a zero check after the closing day reopens nothing
      if (evs.some(e => dayNum(e.date) > dayNum(a.closed) && !(e.k === 'check' && !Number(e.a)))) { notices.push({ account: a.id, notice: 'reopened', closed: a.closed }); continue; }
      const fig = figureAtClose(a, evs);
      if (fig !== null && fig !== 0) questions.push({ q: 'closed', account: a.id, left: fig });
    }
    return { questions, notices };
  }
  // [AN3, AP5] The main bank's minimum lives only in `home.main`.
  function minimumQuestions(copy) {
    const r = minOk({ home: copy.home, accounts: copy.accounts });
    if (!r.refused) return [];
    const main = copy.home.main.v, a = (copy.accounts || []).find(x => x.id === r.account);
    return [{ q: 'minimum', account: r.account, main: main.min == null ? null : main.min, own: a.minBank }];
  }
  // [X5] A place cannot give out more than it holds. A place's figure is added up from events: moves (`place` it leaves,
  // `place2` it reaches, none: Waiting), period-end answers' moves, spends and adjusts naming it (section 4). Free to spend
  // is worked out by the engine and is not judged here. The question offers to undo the newest moves out until it holds.
  function placeFigures(copy) {
    const fig = new Map(), add = (p, a) => { if (p) fig.set(p, (fig.get(p) || 0) + a); };
    const evs = live(copy.events);
    for (const e of evs) {
      const a = Number(e.a) || 0;
      if (e.k === 'move') { add(e.place, -a); add(e.place2 || 'waiting', a); }
      else if (e.k === 'periodEnd' && e.place) for (const mv of e.moves || []) { add(e.place, -(Number(mv.a) || 0)); add(mv.to, Number(mv.a) || 0); }
      else if (e.k === 'spend' && e.place) add(e.place, -a);
      else if (e.k === 'adjust' && e.place) add(e.place, a);
    }
    return fig;
  }
  function sharesQuestions(copy) {
    const fig = placeFigures(copy), evs = live(copy.events);
    const out = [];
    for (const [p, f] of [...fig].sort((x, y) => (x[0] < y[0] ? -1 : 1))) {
      if (p === 'free' || f >= 0) continue;
      const outs = evs.filter(e => e.k === 'move' && e.place === p).sort((x, y) => ms(y.at) - ms(x.at) || (x.id < y.id ? 1 : -1));
      const undoFrom = list => { const u = []; let g = f; for (const o of list) { if (g >= 0) break; u.push(o.id); g += Number(o.a) || 0; } return u; };
      // [AW6] either placing may give way: the newest first (`undo`), or the oldest first (`undoOlder`)
      out.push({ q: 'shares', place: p, over: -f, undo: undoFrom(outs), undoOlder: undoFrom(outs.slice().reverse()) });
    }
    return out;
  }
  const keyOf = q => q.schedule || q.account || q.place || q.of || '';
  function mainQuestion(copy, which, mins) {
    const kv = id => (copy.keptVersions || []).find(k => k.id === id);
    const mk = which.find(q => q.of === 'home.main');
    const banks = new Set([].concat(mk ? kv(mk.kept).versions.map(v => v.v && v.v.acct) : [], copy.home && copy.home.main ? [copy.home.main.v.acct] : [], mins.map(q => q.account)).filter(Boolean));
    const accts = which.filter(q => kv(q.kept).in === 'accounts' && banks.has(q.of) && new Set(kv(q.kept).versions.map(v => canon(v.minBank === undefined ? null : v.minBank))).size > 1);
    const parts = (mk ? 1 : 0) + accts.length + mins.length;
    if (parts < 2 || !(mk || mins.length)) return null;
    const kept = [].concat(mk ? [mk.kept] : [], accts.map(q => q.kept)).sort();
    const acct = mins.length ? mins[0].account : accts.length ? accts[0].of : copy.home.main.v.acct;
    const a = (copy.accounts || []).find(x => x.id === acct) || {};
    const options = [...new Set([].concat(...kept.map(id => kv(id).versions.map(v => v.by))))].filter(Boolean).sort();
    return { q: 'main', account: acct, kept, main: copy.home.main.v.min == null ? null : copy.home.main.v.min, own: a.minBank == null ? null : a.minBank, options };
  }
  function afterSync(copy) {
    const c = closedChecks(copy);
    // [BZ3] a removed account, line or schedule a live record names is back (ledger.js revive, the look ahead's rule)
    for (const x of LG.revive(copy).revived) c.notices.push({ [x.kind]: x.id, notice: 'revived', by: x.by });
    let which = (copy.keptVersions || []).filter(k => k.ask).map(k => ({ q: 'which', of: k.of, kept: k.id }));
    let mins = minimumQuestions(copy);
    // [AW4, AT3] A main-bank switch and a minimum change meeting at a sync are one question: the `which` about `home.main`, the
    // `which` about the bank it names (or named) and the minimum check, shown together; the person picks one device's view.
    const mainQ = mainQuestion(copy, which, mins);
    if (mainQ) { which = which.filter(q => !mainQ.kept.includes(q.kept)); mins = []; }
    const questions = [].concat(x8Questions(copy), c.questions, mins, sharesQuestions(copy), which, mainQ ? [mainQ] : [])
      .sort((a, b) => (a.q < b.q ? -1 : a.q > b.q ? 1 : keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0));
    return { questions, notices: c.notices };
  }

  // ---------- answers ----------
  function stampFor(copy, now, by, lastSeen) {
    const seen = newest(lastSeen, M.newestAt(copy));
    return { at: M.nextAt(now, seen), by };
  }
  function at(copy, path, make) {
    let o = copy;
    for (const p of path.split('.')) { if (o[p] === undefined && make) o[p] = {}; o = o[p]; if (o === undefined) return undefined; }
    return o;
  }
  // [AQ3] The person picks one kept version (or, later, Undo picks another): written as an edit with the device's own
  // clock; every version stays kept, the one shown before it too when it was edited since.
  function answer({ copy, of, pick, now, by, lastSeen }) {
    const out = C(copy), stamp = stampFor(out, now, by, lastSeen);
    const k = (out.keptVersions || []).find(r => r.of === of);
    if (!k) throw new Error('nothing kept for ' + of);
    if (of === 'copy') {   // [AW2] the whole copy picked: every list and setting from it; the kept versions stay
      const v = k.versions[pick], kv = out.keptVersions;
      for (const key of Object.keys(out)) if (key !== 'rev' && key !== 'keptVersions') delete out[key];
      Object.assign(out, C(v), { keptVersions: kv });
      Object.assign(k, { ask: false }, stamp);
      return out;
    }
    const v = pick === 'both' ? k.both : k.versions[pick];   // [AW6] "keep both"
    if (!v) throw new Error('no version ' + pick + ' kept for ' + of);
    const holder = at(out, k.in, false);
    let current;
    if (Array.isArray(holder)) {
      const i = holder.findIndex(r => r.id === of);
      current = holder[i];
      const told = earliest(current && current.told, v.told);
      holder[i] = Object.assign(C(v), stamp); if (told) holder[i].told = told;
    } else {
      const key = of.slice(k.in.length + 1);
      current = holder[key];
      holder[key] = Object.assign(C(v), stamp);
    }
    const vs = current && !k.versions.some(x => same(x, current)) ? versionsOf(k.versions.concat([current])) : k.versions;
    Object.assign(k, { versions: vs, ask: false }, stamp);
    return out;
  }
  // [AQ4] Answering a check question: each answer is an edit with the device's own clock.
  function answerCheck({ copy, question: q, pick, now, by, lastSeen }) {
    const out = C(copy), stamp = stampFor(out, now, by, lastSeen), day = String(now).slice(0, 10);
    if (q.q === 'x8') {
      const s = out.schedules.find(x => x.id === q.schedule);
      const e = s.rules.find(x => !x.gone && x.from === q.from);
      s.rules = s.rules.map(x => (x === e ? Object.assign({}, x, { gone: day }, stamp) : x));
      // 'offer': the change starts the day after what is settled (X8's offer); 'back': the change is taken back
      if (pick === 'offer' && q.offer && !s.rules.some(x => !x.gone && x.from === q.offer)) s.rules.push(Object.assign({ from: q.offer, rule: e.rule }, stamp));
      s.rules.sort((x, y) => (x.from < y.from ? -1 : x.from > y.from ? 1 : 0));
      Object.assign(s, stamp);
    } else if (q.q === 'closed') {
      const a = out.accounts.find(x => x.id === q.account);
      if (pick === 'reopen') Object.assign(a, { closed: null }, stamp);
      else if (pick === 'move') {   // what is left goes to the main bank, dated the closing day, as the closing's next record [S3]
        const n = out.events.filter(e => isClosing(e, a.id)).length + 1;
        const main = out.home.main.v.acct;
        const rec = q.left > 0 ? { acct: a.id, acct2: main, a: q.left } : { acct: main, acct2: a.id, a: -q.left };
        out.events.push(Object.assign({ id: 'close:' + a.id + ':' + n, k: 'transfer', date: a.closed }, rec, { told: stamp.at }, stamp));
      }
    } else if (q.q === 'minimum') {
      const a = out.accounts.find(x => x.id === q.account);
      const min = pick === 'own' ? a.minBank : out.home.main.v.min;
      out.home.main = Object.assign({}, out.home.main, { v: { acct: q.account, min } }, stamp);
      Object.assign(a, { minBank: null }, stamp);
    } else if (q.q === 'main') {   // [AW4] one device's view: its version of each kept item, then the minimum from that view
      let cur = out;
      for (const id of q.kept) {
        const k = cur.keptVersions.find(x => x.id === id);
        const vs = k.versions.map((v, i) => ({ v, i })).filter(x => x.v.by === pick);
        const i = vs.length ? vs.reduce((w, x) => (M.winner(w.v, x.v) === x.v ? x : w)).i : k.versions.length - 1;
        cur = answer({ copy: cur, of: k.of, pick: i, now, by, lastSeen });
      }
      const mq = minimumQuestions(cur)[0];
      if (mq) { const a = cur.accounts.find(x => x.id === mq.account); cur = answerCheck({ copy: cur, question: mq, pick: a.by === pick && a.minBank ? 'own' : 'main', now, by, lastSeen }); }
      return cur;
    } else if (q.q === 'shares') {
      if (pick === 'undoOlder') out.events = out.events.map(e => ((q.undoOlder || []).includes(e.id) ? Object.assign({}, e, { gone: day }, stamp) : e));
      if (pick === 'undo') out.events = out.events.map(e => (q.undo.includes(e.id) ? Object.assign({}, e, { gone: day }, stamp) : e));
    } else throw new Error('no answer for ' + q.q);
    return out;
  }

  // ---------- ids [AP3, AQ3] ----------
  const IMPORTED = new RegExp('^imp:' + REF + ':(?:ref:[A-Za-z0-9%._~-]+|' + DATE + ':\\d+:(?:in|out):[1-9]\\d*)$'), KEPT = /^kept:[^\s].*$/;
  const idOk = id => typeof id === 'string' && (M.idOk(id) || IMPORTED.test(id) || KEPT.test(id));
  function refPart(ref) {
    return Array.from(new TextEncoder().encode(String(ref))).map(b => (/[A-Za-z0-9._~-]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%' + b.toString(16).toUpperCase().padStart(2, '0'))).join('');
  }
  // [AP3] The ids of one statement's lines on one account: the statement's own reference, else date, amount, direction
  // and the line's count among the statement's lines with the same three.
  function impIds({ account, lines }) {
    const seen = new Map();
    return lines.map(l => {
      if (l.ref) return 'imp:' + account + ':ref:' + refPart(l.ref);
      const k = l.date + ':' + l.a + ':' + l.dir;
      seen.set(k, (seen.get(k) || 0) + 1);
      return 'imp:' + account + ':' + k + ':' + seen.get(k);
    });
  }

  // ---------- the shop key [AP7] ----------
  // 38.31's `stmtNorm` (src/stmt.js), used by the reader and the move alike, with `k:` in front [AN7].
  function stmtNorm(text) {
    let s = String(text || '').toLowerCase().replace(/[0-9*#]+/g, ' ').replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!s) return '?';
    const words = s.split(' ').slice(0, 3); s = words.join(' ');
    if (words.length === 1 && s.length > 12) s = s.slice(0, 12);
    return s;
  }
  const catKey = t => 'k:' + stmtNorm(t);
  // [AP7] On one device: a value is written over another only when it ranks the same or higher (person over moved over
  // reader), or the other was taken back.
  function catLearn({ cats, writes }) {
    const o = C(cats || {});
    for (const w of writes || []) {
      const k = catKey(w.shop), cur = o[k];
      if (isMap(cur) && !cur.gone && RANK[w.src] < rankOf(cur)) continue;
      o[k] = { v: w.v, src: w.src, at: w.at, by: w.by };
    }
    return o;
  }

  const show = (copy, keys) => (keys ? Object.fromEntries(keys.filter(k => copy[k] !== undefined).map(k => [k, copy[k]])) : copy);
  function ask(question, input) {
    switch (question) {
      case 'push': return push(input);
      case 'sync_device': { const r = syncDevice(input.device, input.cloud); return Object.assign({ merged: r.merged, pushed: r.pushed, rev: r.rev, copy: show(r.device.copy, input.show) }, input.questions ? { questions: afterSync(r.device.copy).questions } : {}); }
      case 'race': { const r = race(input); return { refused: r.refused, rev: r.rev, questions: afterSync(r.copy).questions, copy: show(r.copy, input.show) }; }
      case 'cas_story': return casStory(input);
      case 'sync': return show(sync(input.base, input.mine, input.theirs), input.show);
      case 'sync_symmetric': return canon(sync(input.base, input.mine, input.theirs)) === canon(sync(input.base, input.theirs, input.mine));
      case 'sync_again': {
        const m = sync(input.base, input.mine, input.theirs), c = canon(m);
        return canon(sync(m, m, m)) === c && canon(sync(input.base, m, input.theirs)) === c && canon(sync(input.base, input.mine, m)) === c;
      }
      case 'sync_check': return afterSync(sync(input.base, input.mine, input.theirs));
      case 'after_sync': return afterSync(input.copy);
      case 'answer': return show(answer(input), input.show);
      case 'answer_check': { const r = answerCheck(input); return Object.assign(show(r, input.show), afterSync(r)); }
      case 'imp_ids': return impIds(input);
      case 'id_ok': return input.ids.map(idOk);
      case 'cat_key': return (input.texts || []).map(catKey);
      case 'cat_learn': return catLearn(input);
    }
    throw new Error('unknown question ' + question);
  }

  const api = { ask, race, rematch, mainQuestion, laRule, CAL, placeFigures, sync, push, syncDevice, casStory, afterSync, answer, answerCheck, x8Questions, closedChecks, minimumQuestions, sharesQuestions, makes, firstFrom, figureAtClose, impIds, idOk, catKey, catLearn, stmtNorm, content, same, canon, hasData };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).sync = api;
})(typeof window !== 'undefined' ? window : globalThis);
