// Matching an import to a typed line or an expected item (SCHEMA_V3 6.4; DECISIONS_ROUND2 A6, F4, H2, H9).
// A plain reference for the engine lane, checked by run_rules.js against rules/matching.json.
// Every amount is in whole minor units. Where the decisions leave a point open, the line says so and
// names the open question in matching.json.
'use strict';
const { dayNum, addWorking } = require('./dates');

// Statement over screenshot over typed [A6]. A moved record ranks with typed.
const RANK = { typed: 0, move: 0, screenshot: 1, statement: 2 };
const rank = src => RANK[src || 'typed'];
const dayOf = l => dayNum(l.posted || l.date);   // by `posted` when there is one (6.4)

// Is `when` inside the window that starts on day `from`: from .. from + postingDays working days [F4].
function inWindow(from, when, ctx, acct) {
  const pd = (ctx.accounts[acct] || {}).postingDays;
  return when >= from && when <= addWorking(from, pd == null ? 1 : pd, ctx.holidays);   // match-q3: never before
}

// Amount test against an existing line. A typed spend matches exactly, or within 10% when it is `est` [H9].
// match-q10: compared exactly (difference x 10 <= amount), no rounding of the margin.
function amountFits(existing, a) {
  if (existing.est && rank(existing.src) === 0) return Math.abs(a - existing.a) * 10 <= existing.a;
  return a === existing.a;
}
// Amount test against an expected item: within the schedule's `vary` [A6]. match-q1: no vary is exact.
function amountFitsVary(item, a, ctx) {
  const vary = (ctx.schedules[item.s] || {}).vary || 0;
  return Math.abs(a - item.a) * 1000 <= item.a * Math.round(vary * 1000);
}

const nameOf = o => o.s + '@' + o.due;   // occurrence name [H2]

function applyImports(input) {
  const ctx = { accounts: input.accounts || {}, holidays: input.holidays || [], schedules: input.schedules || {} };
  const lines = (input.lines || []).map((l, i) => Object.assign({ order: i }, l, { settles: [].concat(l.settles || []) }));
  const expected = input.expected || [];
  const live = () => lines.filter(l => !l.gone);
  const settledNames = () => new Set([].concat(...live().map(l => l.settles)));
  const byDateThenOrder = (x, y) => dayOf(x) - dayOf(y) || x.order - y.order;   // match-q7

  for (const imp of input.imports || []) {
    for (const raw of imp.lines) {
      const line = Object.assign({}, raw, { acct: raw.acct || imp.acct, src: imp.src, order: lines.length, settles: [] });
      const when = dayOf(line);
      const same = live().filter(t => t.acct === line.acct && t.dir === line.dir && inWindow(dayOf(t), when, ctx, t.acct));
      // 1. A live line of higher rank already holds this money: the new line is the one that goes.
      const higher = same.filter(t => rank(t.src) > rank(line.src) && t.a === line.a).sort(byDateThenOrder)[0];
      if (higher) { line.gone = true; line.goneBy = higher.id; lines.push(line); continue; }
      // 2. A live line of lower rank that matches is replaced (gone, goneBy this line) [A6].
      //    match-q6: a typed line is tried before an expected item. match-q9: equal rank never replaces.
      const lower = same.filter(t => rank(t.src) < rank(line.src) && amountFits(t, line.a)).sort(byDateThenOrder)[0];
      if (lower) {
        lower.gone = true; lower.goneBy = line.id;
        line.settles = lower.settles.slice();   // match-q5: the settle moves to the line that replaced it
        lines.push(line); continue;
      }
      // 3. An unsettled expected item it matches is settled by it (6.4, last point). match-q2: not before `lands`.
      const done = settledNames();
      const item = expected.filter(o => !done.has(nameOf(o)) && o.acct === line.acct && o.dir === line.dir
        && inWindow(dayNum(o.lands), when, ctx, o.acct) && amountFitsVary(o, line.a, ctx))
        .sort((x, y) => dayNum(x.lands) - dayNum(y.lands))[0];
      if (item) line.settles = [nameOf(item)];
      lines.push(line);   // 4. otherwise a new line
    }
  }
  return lines;
}

// [H9] The same amount typed on two devices on the same day for the same place. Offered, never removed.
const deviceOf = id => String(id).split('-')[0];
function possibleDoubles(lines) {
  const typed = lines.filter(l => !l.gone && rank(l.src) === 0 && l.src !== 'move');
  const pairs = [];
  for (let i = 0; i < typed.length; i++) for (let j = i + 1; j < typed.length; j++) {
    const x = typed[i], y = typed[j];
    const placeX = x.place || x.line, placeY = y.place || y.line;   // match-q11
    if (x.date === y.date && x.a === y.a && x.dir === y.dir && placeX === placeY && deviceOf(x.id) !== deviceOf(y.id))   // match-q13: by date
      pairs.push([x.id, y.id].sort());
  }
  return pairs.sort();
}

function ask(question, input) {
  if (question === 'possible_doubles') return possibleDoubles(input.lines || []);
  const out = applyImports(input);
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

module.exports = { ask, applyImports, possibleDoubles };
