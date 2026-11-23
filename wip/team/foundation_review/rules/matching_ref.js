// Matching an import to a typed line or an expected item (SCHEMA_V3 6.4; DECISIONS_ROUND2 A6, F4, H2, H9, L, M).
// A plain reference for the engine lane, checked by run_rules.js against rules/matching.json.
// Every amount is in whole minor units. Where the decisions leave a point open, the line says so and
// names the open question in matching.json.
'use strict';
const { dayNum, addWorking, subWorking } = require('./dates');

// Statement over screenshot over typed [A6]. A moved record ranks with typed.
const RANK = { typed: 0, move: 0, screenshot: 1, statement: 2 };
const rank = src => RANK[src || 'typed'];
const dayOf = l => dayNum(l.posted || l.date);   // by `posted` when there is one (6.4)
const EARLY = 5;   // [L matching q2] an import may settle an expected item up to 5 working days early

// The posting window of an account in working days [F4]: its own `postingDays`, else 7 for a card
// [L matching q4] and 1 for anything else. The card's 7 is working days, like the rest [M1].
function windowOf(ctx, acct) {
  const a = ctx.accounts[acct] || {};
  return a.postingDays != null ? a.postingDays : a.kind === 'card' ? 7 : 1;
}
const isCard = (ctx, acct) => (ctx.accounts[acct] || {}).kind === 'card';
// The days a line may be matched on: its posted date (else its date); on a card its buy date too [L matching q4].
function daysOf(ctx, l) {
  const d = [dayOf(l)];
  if (isCard(ctx, l.acct) && dayNum(l.date) !== d[0]) d.push(dayNum(l.date));
  return d;
}
// How far the new line is from an existing one in days, or null when it is outside the existing line's
// window. The window runs either side of the existing line's day [L matching q3].
function distance(ctx, existing, line) {
  const w = windowOf(ctx, existing.acct);
  let best = null;
  for (const dt of daysOf(ctx, existing)) for (const dl of daysOf(ctx, line)) {
    if (dl < subWorking(dt, w, ctx.holidays) || dl > addWorking(dt, w, ctx.holidays)) continue;
    const gap = Math.abs(dl - dt);
    if (best === null || gap < best) best = gap;
  }
  return best;
}

// Amount test against an existing line. A typed spend matches exactly, or when it is `est` within 10% of
// the larger amount, compared exactly in minor units [H9, L matching q10].
function amountFits(existing, a) {
  if (existing.est && rank(existing.src) === 0) return Math.abs(a - existing.a) * 10 <= Math.max(a, existing.a);
  return a === existing.a;
}
// Amount test against an expected item: within the schedule's `vary` [A6]. No `vary` is exact [L matching q1].
function amountFitsVary(item, a, ctx) {
  const vary = (ctx.schedules[item.s] || {}).vary || 0;
  return Math.abs(a - item.a) * 1000 <= item.a * Math.round(vary * 1000);
}

const nameOf = o => o.s + '@' + o.due;   // occurrence name [H2]
const toldMs = l => (l && l.told ? Date.parse(l.told) : Infinity);

// [L matching q9] A line's id for repeats: date, amount, direction and its count among the lines with those
// three in its own import (for lines already there, in its own source). Its src: type, file and line.
function giveIds(group) {
  const seen = {};
  for (const l of group) {
    const k = [l.date, l.a, l.dir].join('|');
    seen[k] = (seen[k] || 0) + 1;
    l.rid = k + '|' + seen[k];
  }
}
const srcKey = l => (l.file != null && l.line != null ? [l.src || 'typed', l.file, l.line].join('|') : null);

function applyImports(input) {
  const ctx = { accounts: input.accounts || {}, holidays: input.holidays || [], schedules: input.schedules || {} };
  const lines = (input.lines || []).map((l, i) => Object.assign({ order: i }, l, { settles: [].concat(l.settles || []) }));
  const groups = {};
  for (const l of lines) { const g = (l.src || 'typed') + '|' + (l.file || ''); (groups[g] = groups[g] || []).push(l); }
  Object.values(groups).forEach(giveIds);
  const expected = input.expected || [];
  const dropped = [];
  const statements = [];   // the statement imports read so far, with their own dates [L matching q8, M2]
  const live = () => lines.filter(l => !l.gone);
  const settledNames = () => new Set([].concat(...live().map(l => l.settles)));
  // [L matching q7] Several lines match: the closest date wins, then the earliest `told`, then the first listed.
  const closest = list => list.sort((x, y) => x.gap - y.gap || toldMs(x.t) - toldMs(y.t) || x.t.order - y.t.order)[0];

  for (const imp of input.imports || []) {
    const incoming = imp.lines.map(raw => Object.assign({}, raw, { acct: raw.acct || imp.acct, src: imp.src, file: imp.file, settles: [] }));
    giveIds(incoming);
    for (const line of incoming) {
      line.order = lines.length;
      // 0. An equal-rank repeat with the same line id or the same src is dropped, never added [L matching q9].
      const repeat = live().some(t => t.acct === line.acct && rank(t.src) === rank(line.src)
        && (t.rid === line.rid || (srcKey(t) !== null && srcKey(t) === srcKey(line))));
      if (repeat) { dropped.push(line.id); continue; }
      const same = live().filter(t => t.acct === line.acct && t.dir === line.dir)
        .map(t => ({ t, gap: distance(ctx, t, line) })).filter(x => x.gap !== null);
      // 1. A live line of higher rank already holds this money: the new line is the one that goes.
      const higher = closest(same.filter(x => rank(x.t.src) > rank(line.src) && x.t.a === line.a));
      if (higher) { line.gone = true; line.goneBy = higher.t.id; lines.push(line); continue; }
      // 2. A live line of lower rank that matches is replaced (gone, goneBy this line) [A6]. A typed line is
      //    tried before an expected item, and the import takes over its `settles` [L matching q5, q6].
      //    A screenshot line a statement replaces is goneBy the statement import [L matching q8].
      //    Equal rank never replaces (a repeat was dropped above).
      const lower = closest(same.filter(x => rank(x.t.src) < rank(line.src) && amountFits(x.t, line.a)));
      if (lower) {
        lower.t.gone = true;
        lower.t.goneBy = line.src === 'statement' && lower.t.src === 'screenshot' ? imp.id : line.id;
        line.settles = lower.t.settles.slice();
        lines.push(line); continue;
      }
      // 3. An unsettled expected item it matches is settled by it (6.4, last point), when it lands from 5
      //    working days before the item's landing day to the end of its posting window [L matching q2].
      const done = settledNames();
      const item = expected.filter(o => {
        if (done.has(nameOf(o)) || o.acct !== line.acct || o.dir !== line.dir || !amountFitsVary(o, line.a, ctx)) return false;
        const lands = dayNum(o.lands), from = subWorking(lands, EARLY, ctx.holidays), to = addWorking(lands, windowOf(ctx, o.acct), ctx.holidays);
        return daysOf(ctx, line).some(d => d >= from && d <= to);
      }).sort((x, y) => dayNum(x.lands) - dayNum(y.lands))[0];
      if (item) line.settles = [nameOf(item)];
      lines.push(line);   // 4. otherwise a new line
    }
    // [L matching q8] A statement removes every screenshot line inside its own dates, matched or not,
    // goneBy the statement import. [M2] A screenshot read after the statement, inside its dates, is removed
    // too, goneBy the statement import; one that matched a statement line already went, goneBy that line
    // (step 1, match-20, match-46).
    if (imp.src === 'statement' && imp.from && imp.to) statements.push(imp);
    for (const st of statements) {
      for (const t of live()) {
        if (t.acct === st.acct && t.src === 'screenshot' && dayOf(t) >= dayNum(st.from) && dayOf(t) <= dayNum(st.to)) { t.gone = true; t.goneBy = st.id; }
      }
    }
  }
  return { lines, dropped };
}

// [H9] The same amount typed on two devices on the same day for the same place. Offered, never removed.
// "Same place" is the place, else the budget line [L matching q11]; "same day" is the spend's date
// [L matching q13]. A pair the person called "both are real" is not offered again [L matching q12].
const deviceOf = id => String(id).split('-')[0];
const notDouble = (x, y) => (x.notDouble || []).includes(y.id) || (y.notDouble || []).includes(x.id);
function possibleDoubles(lines) {
  const typed = lines.filter(l => !l.gone && rank(l.src) === 0 && l.src !== 'move');
  const pairs = [];
  for (let i = 0; i < typed.length; i++) for (let j = i + 1; j < typed.length; j++) {
    const x = typed[i], y = typed[j];
    const placeX = x.place || x.line, placeY = y.place || y.line;
    if (x.date === y.date && x.a === y.a && x.dir === y.dir && placeX === placeY && deviceOf(x.id) !== deviceOf(y.id) && !notDouble(x, y))
      pairs.push([x.id, y.id].sort());
  }
  return pairs.sort();
}
// [L matching q12] "Both are real" is kept as `notDouble: [id]` on the newer record (the later `told`).
function notDoubleMark(lines, pair) {
  const [x, y] = pair.map(id => lines.find(l => l.id === id));
  const newer = toldMs(y) >= toldMs(x) ? y : x, older = newer === y ? x : y;
  return { id: newer.id, notDouble: (newer.notDouble || []).concat(older.id) };
}

function ask(question, input) {
  if (question === 'possible_doubles') return possibleDoubles(input.lines || []);
  if (question === 'not_double_mark') return notDoubleMark(input.lines || [], input.pair);
  const { lines: out, dropped } = applyImports(input);
  if (question === 'import_dropped') return dropped.slice().sort();
  if (question === 'import_counts') {
    const importIds = new Set([].concat(...(input.imports || []).map(f => f.lines.map(l => l.id))));
    return { goneCount: out.filter(l => l.gone).length, liveImportLines: out.filter(l => !l.gone && importIds.has(l.id)).length };
  }
  if (question === 'import') {
    const gone = {}, settled = {};
    for (const l of out) {
      if (l.gone) gone[l.id] = l.goneBy;
      else for (const s of l.settles) settled[s] = l.id;
    }
    return { gone, settled };
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, applyImports, possibleDoubles, notDoubleMark, windowOf, amountFits, EARLY };
