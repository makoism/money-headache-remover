// Matching an import to a typed line or an expected item (SCHEMA_V3 6.4; DECISIONS_ROUND2 A6, F4, H2, H9, L, M, O1, Q1, Q2, Q6).
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
// [Q1] A two-sided record (transfer, repay, borrow, convert) has `acct2`: money leaves `acct` (side 1) and
// reaches `acct2` (side 2), `a2` being what arrived when it differs [Q2].
const twoSided = l => l.acct2 != null;
const sideAmount = (l, n) => (n === 1 ? l.a : l.a2 != null ? l.a2 : l.a);
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
  // [Q1] The sides an import line attached to: record id -> { 1: {...}, 2: {...} }, each with what a repeat is
  // checked against (rank, line id, src) and what the answer shows (posted date, source).
  const sides = {};
  const sideOf = (t, n) => (sides[t.id] || {})[n];
  // [Q6] Lines that may settle an expected item (step 3), with the import and stretch (`grp`) they came in.
  const settleable = [];

  for (const imp of input.imports || []) {
    const incoming = imp.lines.map(raw => Object.assign({}, raw, { acct: raw.acct || imp.acct, src: imp.src, file: imp.file, settles: [] }));
    giveIds(incoming);
    for (const line of incoming) {
      line.order = lines.length;
      // 0. An equal-rank repeat with the same line id or the same src is dropped, never added [L matching q9].
      const repeat = live().some(t => t.acct === line.acct && rank(t.src) === rank(line.src)
        && (t.rid === line.rid || (srcKey(t) !== null && srcKey(t) === srcKey(line))))
        // [Q1] a line already attached to a side of a two-sided record repeats the same way
        || Object.values(sides).some(ss => Object.values(ss).some(x => x.acct === line.acct && x.rank === rank(line.src)
          && (x.rid === line.rid || (x.srcKey !== null && x.srcKey === srcKey(line)))));
      if (repeat) { dropped.push(line.id); continue; }
      const same = live().filter(t => !twoSided(t) && t.acct === line.acct && t.dir === line.dir)
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
        if (lower.t.told) line.told = lower.t.told;   // [O1] it keeps the typed line's `told`, so a check that held that line holds it
        lines.push(line); continue;
      }
      // 2b. [Q1] It meets one side of a live two-sided record: a money-out line on the side money leaves
      //    (`acct`, by `a`), a money-in line on the side it reaches (`acct2`, by `a2`), inside the posting window
      //    either side of the record's date, the side not yet attached by a line of the same or higher rank.
      //    It attaches: it sets that side's posted date and source and is not a record of its own; the record
      //    is never replaced. Several fit: the closest date, then the earliest `told`.
      const sideFits = (t, n) => {
        if (!twoSided(t) || (n === 1 ? t.acct : t.acct2) !== line.acct || line.dir !== (n === 1 ? 'out' : 'in') || sideAmount(t, n) !== line.a) return false;
        const had = sideOf(t, n);
        return !had || had.rank < rank(line.src);
      };
      const meets = [];
      for (const t of live()) for (const n of [1, 2]) {
        if (!sideFits(t, n)) continue;
        const gap = distance(ctx, Object.assign({}, t, { acct: line.acct, posted: undefined }), line);
        if (gap !== null) meets.push({ t, n, gap });
      }
      const meet = closest(meets);
      if (meet) {
        (sides[meet.t.id] = sides[meet.t.id] || {})[meet.n] = { acct: line.acct, rank: rank(line.src), rid: line.rid, srcKey: srcKey(line),
          posted: line.posted || line.date, src: { type: line.src, file: line.file, line: line.line } };
        continue;
      }
      // 3. Settling an expected item waits for the whole import [Q6], below.
      line.grp = imp.grp; line.imp = imp.id;
      settleable.push(line);
      lines.push(line);   // 4. a new line
    }
    // 3. [Q6] Across one import, each unsettled expected item (in landing order) is settled by the line nearest
    //    its landing day, then nearest its amount, then the first listed (6.4, last point), when it lands from
    //    5 working days before the item's landing day to the end of its posting window [L matching q2]. A later
    //    import in the same check-in stretch (the same `grp`) joins the earlier one's lines, so a nearer line
    //    moves the settle. Lines of another stretch keep what they settle (matching-open-2).
    const pool = settleable.filter(l => !l.gone && (l.imp === imp.id || (imp.grp != null && l.grp === imp.grp)));
    for (const l of pool) l.settles = [];
    const done = settledNames();
    for (const o of expected.slice().sort((x, y) => dayNum(x.lands) - dayNum(y.lands))) {
      if (done.has(nameOf(o))) continue;
      const lands = dayNum(o.lands), from = subWorking(lands, EARLY, ctx.holidays), to = addWorking(lands, windowOf(ctx, o.acct), ctx.holidays);
      let best = null;
      for (const l of pool) {
        if (l.settles.length || l.acct !== o.acct || l.dir !== o.dir || !amountFitsVary(o, l.a, ctx)) continue;
        const ds = daysOf(ctx, l).filter(d => d >= from && d <= to);
        if (!ds.length) continue;
        const c = { l, gap: Math.min(...ds.map(d => Math.abs(d - lands))), off: Math.abs(l.a - o.a) };
        if (!best || c.gap < best.gap || (c.gap === best.gap && (c.off < best.off || (c.off === best.off && l.order < best.l.order)))) best = c;
      }
      if (best) { best.l.settles = [nameOf(o)]; done.add(nameOf(o)); }
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
  // [Q1] What each attached side now holds.
  const attached = {};
  for (const [id, ss] of Object.entries(sides)) {
    const a = attached[id] = {};
    if (ss[1]) { a.posted = ss[1].posted; a.src = ss[1].src; }
    if (ss[2]) { a.posted2 = ss[2].posted; a.src2 = ss[2].src; }
  }
  return { lines, dropped, attached };
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
  const { lines: out, dropped, attached } = applyImports(input);
  if (question === 'import_sides') {   // [Q1]
    const importIds = new Set([].concat(...(input.imports || []).map(f => f.lines.map(l => l.id))));
    const gone = {};
    for (const l of out) if (l.gone) gone[l.id] = l.goneBy;
    return { attached, gone, live: out.filter(l => !l.gone && importIds.has(l.id)).map(l => l.id).sort() };
  }
  if (question === 'import_dropped') return dropped.slice().sort();
  if (question === 'import_told') {   // [O1] each live imported line's `told`
    const importIds = new Set([].concat(...(input.imports || []).map(f => f.lines.map(l => l.id))));
    const told = {};
    for (const l of out) if (!l.gone && importIds.has(l.id)) told[l.id] = l.told;
    return told;
  }
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
