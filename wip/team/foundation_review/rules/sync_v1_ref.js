// Version one sync (SCHEMA_V3 0 and 2.3; DECISIONS_ROUND2 AQ1 to AQ4, AP1 to AP3, AP6, AP7; DECISIONS.md "Phone and
// desktop in version one", Mako 23 Nov). A plain reference for the engine lane, checked by run_rules.js against
// rules/sync_v1.json and by fuzz_two_devices.js (AQ6). The rich merge (merge_ref.js) is the stage 2 spec [AQ5].
//
// What it does, in four parts:
// 1. [AQ1] The cloud copy carries a revision. The vault accepts a write only when it is based on the latest revision
//    (compare and swap). A device that is behind takes the latest first, joins it with its own copy, then writes.
// 2. [AQ2] Records join by id. Events have ids built from what they are where the app writes them for a known moment
//    (O2's `set:`, `auto:`, `pe:` ..., AP3's `imp:`, X1's `mv:`), so the same thing written on two devices is one record.
// 3. [AQ3] The join is three-way: each device keeps the copy it last synced (`base`). A record, or a field value of
//    `home`, `ui`, `plan.limits` or `imports.cats`, changed on one side only is taken from that side. Changed on both to
//    the same content (apart from `at`, `by`, `told`, `held`, `goneBy`, and `gone` read as yes or no) it is one record,
//    the newer, with the earliest `told`. Changed on both to different content it is asked: until the person picks, the
//    newer shows (`at`, then `gone`, then `by`, then the text: never "mine"), and every version is kept in
//    `kept:<record id or field path>` with `ask: true`, so Undo can bring any of them back. A list record is one item
//    whole (its `rules`, `steps` and keyed overrides with it); no field-by-field merge (stage 2, AQ5).
//    [AP7, AN7] One exception, because a guess is not the person's edit: for a shop's category, a person's lesson
//    beats a moved value, which beats a reader's guess; the lower one is kept, not asked.
// 4. [AQ4] After every sync the one-device checks run on the joined copy, and each failure is a question, never a silent
//    rule: X8 for every rule kind, read with the look ahead's own occurrence code [AP2]; a closed account holding money
//    (with AP1's closing check and its one reopen rule, which gives a notice); the main bank's minimum in two places
//    [AN3, AP5]; a place given out more than it holds [X5].
'use strict';
const M = require('./merge_ref');
const IDS = require('./ids');
const E = require('./edits_ref');
const LA = require('../ref/lookahead_ref');
const { dayNum, dayStr } = require('./dates');

const ms = t => Date.parse(t);
const isMap = x => !!x && typeof x === 'object' && !Array.isArray(x);
const fieldValue = x => isMap(x) && typeof x.at === 'string';
function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
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
const same = (x, y) => canon(content(x)) === canon(content(y));
const earliest = (...ts) => ts.filter(t => typeof t === 'string').sort((a, b) => ms(a) - ms(b) || (a < b ? -1 : a > b ? 1 : 0))[0];
const newest = (...ts) => ts.filter(t => typeof t === 'string').sort((a, b) => ms(b) - ms(a) || (a > b ? -1 : a < b ? 1 : 0))[0];

// [AP7, AN7] A field value's `src`: a person's lesson (or no `src`) 3, a moved value 2, a reader's guess 1.
const RANK = { reader: 1, moved: 2, person: 3 };
const rankOf = x => (fieldValue(x) && typeof x.src === 'string' && RANK[x.src] ? RANK[x.src] : 3);

// The versions kept for one item: one per content, each its newest instance, listed by `at` (then text) [AQ3].
function versionsOf(list) {
  const byContent = new Map();
  for (const v of list) {
    const k = canon(content(v));
    byContent.set(k, byContent.has(k) ? M.winner(byContent.get(k), v) : v);
  }
  return [...byContent.values()].sort((a, b) => ms(a.at) - ms(b.at) || (canon(a) < canon(b) ? -1 : 1));
}
function keptRecord(of, where, versions, ask) {
  const vs = versionsOf(versions), last = vs.reduce((w, v) => (!w || M.winner(w, v) === v ? v : w), null);
  return { id: 'kept:' + of, of, in: where, versions: vs, ask, told: earliest(...vs.map(v => v.told || v.at)), at: last.at, by: last.by };
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
  const rm = rankOf(m), rt = rankOf(t);
  const higher = rm > rt ? m : t;
  const byRank = rm !== rt && !higher.gone;   // [AP7] a guess never replaces a lesson that was not taken back
  conflicts.push({ of, where, versions: [m, t], ask: !byRank });
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
    if (top && k === 'kept') continue;
    const x = m[k], y = t[k], z = b[k], p = path ? path + '.' + k : k;
    if (top && (k === 'rev' || k === 'v') && (typeof x === 'number' || typeof y === 'number')) out[k] = Math.max(...[x, y].filter(n => typeof n === 'number'));
    else if (top && k === 'at' && (typeof x === 'string' || typeof y === 'string')) out[k] = newest(x, y);   // when the copy was saved
    else if (Array.isArray(x) || Array.isArray(y)) out[k] = isRecords(x, y, z) ? records(p, z, x, y, conflicts) : item(p, path, z, x, y, false, conflicts);
    else if (fieldValue(x) || fieldValue(y)) out[k] = item(p, path, z, x, y, false, conflicts);   // one settings item
    else if (isMap(x) || isMap(y)) out[k] = walk(isMap(z) ? z : {}, isMap(x) ? x : {}, isMap(y) ? y : {}, p, false, conflicts);   // `home`, `ui`, `plan`, `imports`
    else out[k] = plain(z, x, y);
  }
  return out;
}
function sync(base, mine, theirs) {
  const conflicts = [];
  const out = walk(base, mine, theirs, '', true, conflicts);
  // The kept records themselves: changed on one side, taken; on both, joined (every version stays) [AQ3].
  const index = c => new Map(((c || {}).kept || []).map(r => [r.id, r]));
  const B = index(base), Mi = index(mine), Ti = index(theirs), kept = new Map();
  for (const id of new Set([...Mi.keys(), ...Ti.keys()])) {
    let x = Mi.get(id), y = Ti.get(id); const z = B.get(id);
    if (x === undefined) x = z; if (y === undefined) y = z;
    if (x === undefined || y === undefined) { kept.set(id, C(x || y)); continue; }
    const xc = z === undefined || canon(x) !== canon(z), yc = z === undefined || canon(y) !== canon(z);
    kept.set(id, C(canon(x) === canon(y) || !yc ? x : !xc ? y : joinKept(x, y)));
  }
  for (const c of conflicts) {
    const fresh = keptRecord(c.of, c.where, c.versions, c.ask);
    kept.set(fresh.id, addConflict(kept.get(fresh.id), fresh));
  }
  if (kept.size) out.kept = [...kept.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  return out;
}

// ---------- the revision [AQ1] ----------
function push({ cloud, baseRev }) {
  return baseRev === cloud.rev ? { accepted: true, rev: cloud.rev + 1 } : { accepted: false, rev: cloud.rev };
}
const noRev = c => { const o = Object.assign({}, c); delete o.rev; return o; };
// One device syncs: behind, it takes the latest first and joins it with its own; then it writes when its copy differs
// from the cloud's. Its `base` becomes what the cloud holds.
function syncDevice(device, cloud) {
  let copy = device.copy, merged = false;
  if (device.baseRev !== cloud.rev) { copy = sync(device.base, device.copy, cloud.copy); merged = true; }
  if (canon(noRev(copy)) === canon(noRev(cloud.copy))) {
    return { merged, pushed: false, rev: cloud.rev, device: { copy: C(cloud.copy), base: C(cloud.copy), baseRev: cloud.rev }, cloud };
  }
  const p = push({ cloud, baseRev: cloud.rev });   // based on the latest now
  const written = Object.assign(C(copy), { rev: p.rev });
  return { merged, pushed: true, rev: p.rev, device: { copy: written, base: C(written), baseRev: p.rev }, cloud: { rev: p.rev, copy: C(written) } };
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
const CAL = LA.makeCalendar({ dates: [], bank_closed: [] });
function laRule(r) {
  if (!r) return null;
  switch (r.every) {
    case 'month': return { frequency: 'monthly', days: r.days };
    case 'weeks': return { frequency: 'every_n_weeks', n: r.n, from: r.from };
    case 'months': return { frequency: 'every_n_months', n: r.n, day: r.day, from: r.from };
    case 'monthsList': return { frequency: 'months_list', months: r.months, day: r.day };
    case 'year': return { frequency: 'yearly', date: r.date };
    case 'lastWorkday': return { frequency: 'last_workday' };
    case 'once': return { frequency: 'once', date: r.date };
    default: return null;   // 'none': no day is ever due [B4]
  }
}
function makes(rule, due) {
  const r = laRule(rule), n = dayNum(due);
  return !!r && LA.dueDays(r, n - 400, n, CAL).some(x => x.due === n);
}
function firstFrom(rule, day) {
  const r = laRule(rule), n = dayNum(day);
  if (!r) return null;
  const d = LA.dueDays(r, n, n + 800, CAL).map(x => x.due).filter(x => x >= n).sort((a, b) => a - b)[0];
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
      const offer = first ? null : dayStr(dayNum(due) + 1);   // X8's own offer: the day after
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
  const sign = OWED[a.kind] ? -1 : 1, amt = Number(e.a) || 0;
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
    if (evs.some(e => dayNum(e.date) > dayNum(a.closed))) { notices.push({ account: a.id, notice: 'reopened', closed: a.closed }); continue; }
    const fig = figureAtClose(a, evs);
    if (fig !== null && fig !== 0) questions.push({ q: 'closed', account: a.id, left: fig });
  }
  return { questions, notices };
}
// [AN3, AP5] The main bank's minimum lives only in `home.main`.
function minimumQuestions(copy) {
  const r = E.minOk({ home: copy.home, accounts: copy.accounts });
  if (!r.refused) return [];
  const main = copy.home.main.v, a = (copy.accounts || []).find(x => x.id === r.account);
  return [{ q: 'minimum', account: r.account, main: main.min == null ? null : main.min, own: a.minBank }];
}
// [X5] A place cannot give out more than it holds. A place's figure is added up from events: moves (`place` it leaves,
// `place2` it reaches, none: Waiting), period-end answers' moves, spends and adjusts naming it (section 4). Free to spend
// is worked out by the engine and is not judged here. The question offers to undo the newest moves out until it holds.
function sharesQuestions(copy) {
  const fig = new Map(), add = (p, a) => { if (p) fig.set(p, (fig.get(p) || 0) + a); };
  const evs = live(copy.events);
  for (const e of evs) {
    const a = Number(e.a) || 0;
    if (e.k === 'move') { add(e.place, -a); add(e.place2 || 'waiting', a); }
    else if (e.k === 'periodEnd' && e.place) for (const mv of e.moves || []) { add(e.place, -(Number(mv.a) || 0)); add(mv.to, Number(mv.a) || 0); }
    else if (e.k === 'spend' && e.place) add(e.place, -a);
    else if (e.k === 'adjust' && e.place) add(e.place, a);
  }
  const out = [];
  for (const [p, f] of [...fig].sort((x, y) => (x[0] < y[0] ? -1 : 1))) {
    if (p === 'free' || f >= 0) continue;
    const outs = evs.filter(e => e.k === 'move' && e.place === p).sort((x, y) => ms(y.at) - ms(x.at) || (x.id < y.id ? 1 : -1));
    const undo = []; let g = f;
    for (const o of outs) { if (g >= 0) break; undo.push(o.id); g += Number(o.a) || 0; }
    out.push({ q: 'shares', place: p, over: -f, undo });
  }
  return out;
}
const keyOf = q => q.schedule || q.account || q.place || q.of || '';
function afterSync(copy) {
  const c = closedChecks(copy);
  const which = (copy.kept || []).filter(k => k.ask).map(k => ({ q: 'which', of: k.of, kept: k.id }));
  const questions = [].concat(x8Questions(copy), c.questions, minimumQuestions(copy), sharesQuestions(copy), which)
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
  const k = (out.kept || []).find(r => r.of === of);
  if (!k) throw new Error('nothing kept for ' + of);
  const v = k.versions[pick];
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
  } else if (q.q === 'shares') {
    if (pick === 'undo') out.events = out.events.map(e => (q.undo.includes(e.id) ? Object.assign({}, e, { gone: day }, stamp) : e));
  } else throw new Error('no answer for ' + q.q);
  return out;
}

// ---------- ids [AP3, AQ3] ----------
const IMPORTED = new RegExp('^' + IDS.IMPORTED + '$'), KEPT = new RegExp('^' + IDS.KEPT + '$');
const idOk = id => typeof id === 'string' && (M.idOk(id) || IMPORTED.test(id) || KEPT.test(id));
function refPart(ref) {
  return Array.from(Buffer.from(String(ref), 'utf8')).map(b => (/[A-Za-z0-9._~-]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%' + b.toString(16).toUpperCase().padStart(2, '0'))).join('');
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
    case 'sync_device': { const r = syncDevice(input.device, input.cloud); return { merged: r.merged, pushed: r.pushed, rev: r.rev, copy: show(r.device.copy, input.show) }; }
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

module.exports = { ask, sync, push, syncDevice, casStory, afterSync, answer, answerCheck, x8Questions, closedChecks, minimumQuestions, sharesQuestions, makes, firstFrom, figureAtClose, impIds, idOk, catKey, catLearn, stmtNorm, content, same, canon };
