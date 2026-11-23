// Period end (SCHEMA_V3 7.4 and 9; DECISIONS_ROUND2 A7, F8, H8, L, M, N5, O2, O, P2, P3, P5, T1).
// A plain reference for the engine lane, checked by run_rules.js against rules/period_end.json.
// Open points name their question in period_end.json.
'use strict';
const { dayNum, dayStr, addWorking } = require('./dates');
const { mergeList, idFor } = require('./merge_ref');

// Has the period ended, its last day, and does the question start with a check-in [A7].
// [T1] A period is named by the occurrence of the pay that starts it (`period`, for example `pay@2026-11-10`),
// never by a day that can move. A new period the person started without the pay is saved as
// `{ k: 'periodStart', id: 'ps:<the occurrence it stands in for>', date }` [N5]: two phones make one record, the
// newer `at` wins. Only the period start for the next pay's occurrence (`nextPay.occ`) ends this period; one for
// the pay that began it does not. Period-end answers carry `period` and `date` (the period's last day when
// answered). This period ends: at the date of its answers when it has any (a period with answers keeps its end,
// so a moved settle, a corrected pay date or an undone pay never moves it); else the day before the period start
// for the next pay; else the day before the next pay lands. Once the end is fixed, the late pay settles its
// occurrence but starts no new period.
const ms = t => Date.parse(t);
function periodStartFor(events, occ, now) {
  let best = null;
  for (const e of events || []) {
    if (e.k !== 'periodStart' || e.gone || e.id !== 'ps:' + occ) continue;
    if (!best || ms(e.at) > ms(best.at)) best = e;   // [T1] one record: the newer `at` wins
  }
  return best && dayNum(best.date) <= now ? best : null;
}

function questionStart({ nextPay, checkins, today, spendFrom, postingDays, holidays, events, answers, period }) {
  const now = dayNum(today);
  const occ = nextPay.occ || 'pay@' + nextPay.due;
  const ps = periodStartFor(events, occ, now);
  const fixedBy = (answers || []).filter(a => a.period === period && a.date && !a.gone).map(a => dayNum(a.date));
  const lands = dayNum(nextPay.lands || nextPay.due);
  const windowEnd = addWorking(lands, postingDays == null ? 1 : postingDays, holidays || []);
  const landed = nextPay.landed && dayNum(nextPay.landed) <= now;
  // [F8, H8] The period ends the day before the next pay lands; until it is seen it has not ended, even on
  // the period's last day [L period_end q2]. Past its posting window the check-in asks "did your pay
  // come?"; a "yes" writes the pay with the day it came, which ends the period [L period_end q3].
  // [M7] The person started the new period without the pay: it starts on the day they chose. The late pay
  // stays expected until its posting window ends, then is "not seen yet" [H8].
  if (!landed && !ps && !fixedBy.length) return now > windowEnd ? { ended: false, askPayCame: true } : { ended: false };
  const to = fixedBy.length ? Math.min(...fixedBy) : ps ? dayNum(ps.date) - 1 : dayNum(nextPay.landed) - 1;
  const started = !landed;
  // [A7] Fresh: the check-ins dated in the last 3 days (to - 2 .. to), or after the end up to today; one after
  // the end has its stretch split by days at the pay (A4) [L period_end q1]. Fresh only when every spend-from
  // account was typed [L period_end q9], counting those check-ins together [M6]; a check-in given as a date
  // typed them all.
  const recent = (checkins || []).filter(c => {
    const d = dayNum(typeof c === 'string' ? c : c.date);
    return d >= to - 2 && d <= now;
  });
  const typed = new Set([].concat(...recent.map(c => (typeof c === 'string' ? spendFrom || [] : c.accounts || []))));
  const fresh = recent.length > 0 && (!spendFrom || spendFrom.every(a => typed.has(a)));
  const out = { ended: true, periodTo: dayStr(to), startsWithCheckIn: !fresh };
  if (started) out.pay = now > windowEnd ? 'not seen yet' : 'late, expected';
  return out;
}

// Money left at the period's end waits in its place, "to decide", until answered [A7].
// Answers are move events dated the period's last day (7.4), told when they were answered.
// An answer is a move to another place `{ place, to, a }`, "keep it here" `{ place, keep: true, a }`
// [L period_end q6], or for an overspent place a cover `{ place, from: 'free'|'waiting', a }` [L period_end q4].
// [AB watch] An answer the move wrote from a 38.31 month-end answer (`moved: true`; its record's `src` names the field) is
// never refused: it is capped at what its place still holds after the person's own answers, and the rest of the place
// waits "to decide" as usual. A capped answer with nothing left to take is dropped. [AC8] `toPlace` rides on its move.
function capMoved(places, answers) {
  const left = {}; for (const p of places) left[p.id] = Math.max(0, p.left);
  const from = a => (a.from ? a.from : a.place);
  for (const a of answers) if (!a.moved) left[from(a)] = (left[from(a)] || 0) - a.a;
  const out = [];
  for (const a of answers) {
    if (!a.moved) { out.push(a); continue; }
    const take = Math.min(a.a, Math.max(0, left[from(a)] || 0));
    left[from(a)] = (left[from(a)] || 0) - take;
    if (take > 0) out.push(Object.assign({}, a, { a: take }));
  }
  return out;
}
function leftovers({ periodTo, places, answers }) {
  const out = { places: {}, moves: [] };
  const all = capMoved(places, answers || []);
  const refuse = (place, left) => ({ refused: { place, left } });   // [L period_end q10]
  // What each place gives: its own moves and keeps, and the covers taken from it.
  const givenFrom = id => all.filter(a => (a.place === id && !a.from) || a.from === id).reduce((t, a) => t + a.a, 0);
  for (const p of places) {
    const mine = all.filter(a => a.place === p.id);
    if (p.left < 0) {
      // [L period_end q4] Overspent: shown with how much over, covered from what is left in Free to spend,
      // then Waiting, as the person picks.
      const over = -p.left, covered = mine.reduce((t, a) => t + a.a, 0);
      if (mine.some(a => !a.from)) throw new Error('an answer for ' + p.id + ', which is overspent');
      if (covered > over) return refuse(p.id, over);
      out.places[p.id] = { left: p.left, over, covered, toCover: over - covered, state: covered < over ? 'over' : 'covered' };
      for (const a of mine) out.moves.push({ k: 'move', date: periodTo, a: a.a, place: a.from, place2: p.id, told: a.told });
      continue;
    }
    if (p.left === 0) {   // nothing to place [L period_end q5]
      if (mine.length || givenFrom(p.id)) return refuse(p.id, 0);
      out.places[p.id] = { left: 0, decided: 0, kept: 0, toDecide: 0, state: 'nothing left' };
      continue;
    }
    if (givenFrom(p.id) > p.left) return refuse(p.id, p.left);   // [L period_end q10]
    const kept = mine.filter(a => a.keep).reduce((t, a) => t + a.a, 0);
    const decided = givenFrom(p.id) - kept;
    const toDecide = p.left - decided - kept;
    out.places[p.id] = { left: p.left, decided, kept, toDecide, state: toDecide ? 'to decide' : 'decided' };
    for (const a of mine) if (!a.keep) out.moves.push(Object.assign({ k: 'move', date: periodTo, a: a.a, place: p.id, place2: a.to }, a.toPlace ? { toPlace: true } : {}, { told: a.told }));
  }
  // A cover from Free to spend is a move out of it: list it once, under the place it covers (above).
  return out;
}

// [L period_end q5] Nothing left anywhere: one line, "nothing left this time", no question.
// [AD3] A month-end answer the move kept waiting for this period (`waiting`, in the answers' shape) is offered as the
// default, capped at what its place holds (L q10, as capMoved; a capped one with nothing left is dropped). The person
// confirms or changes it; what they confirm is their own answer.
function screen({ places, waiting }) {
  if (places.every(p => p.left === 0)) return { ask: false, line: 'nothing left this time' };
  const offered = capMoved(places, (waiting || []).map(a => Object.assign({}, a, { moved: true }))).map(a => { const o = Object.assign({}, a); delete o.moved; return o; });
  return offered.length ? { ask: true, offered } : { ask: true };
}

// [L period_end q6, q7] What a place holds in the new period: the new amount, plus what was kept (it adds on
// top), plus what still waits to decide. Only the new amount and what was kept count in safe to spend.
function nextPeriod(input) {
  const r = leftovers(input);
  if (r.refused) return r;
  const out = {};
  for (const p of input.places) {
    const e = r.places[p.id];
    if (!e || p.left < 0) continue;
    out[p.id] = { holds: p.next + e.kept + e.toDecide, spendable: p.next + e.kept, toDecide: e.toDecide };
  }
  return out;
}

// [L period_end q8] Two or more unanswered ends stay apart; each answer names its period. [T1] A period is named
// by the occurrence of the pay that started it (`period`), so an answer still answers its period when the
// period's last day moves.
function leftoversEnds({ ends, answers }) {
  return ends.map(e => Object.assign({ period: e.period, periodTo: e.periodTo },
    leftovers({ periodTo: e.periodTo, places: e.places, answers: (answers || []).filter(a => a.period === e.period) })));
}

// [P2, T1] A period-end answer is one record per place, `pe:<the occurrence that started the period>:<place>`, holding all its moves:
// `{ place, moves: [ { to, a } ], told, at, by }`. A move to the place itself is "keep it here" (no move
// event, L period_end q6); for an overspent place the moves are its covers, `{ from, a }` (a cover is saved
// under the line it covers, O reading). Turned into single answers, the shape `leftovers` reads:
function flatten(records) {
  const out = [];
  for (const r of records || []) {
    if (!r.moves) { out.push(r); continue; }
    for (const m of r.moves) {
      const one = m.from ? { place: r.place, from: m.from, a: m.a } : m.to === r.place ? { place: r.place, keep: true, a: m.a } : { place: r.place, to: m.to, a: m.a };
      if (r.told) one.told = r.told;
      out.push(one);
    }
  }
  return out;
}

// [O2] The same place answered on two phones is one record after the merge (newest `at` whole, earliest
// `told`), so moves are never mixed from two records [P2]. Records for different places both stay, so the
// refusal is checked again on the merged answers [L period_end q10]. [P3] When they add up to more than is
// left, the record with the newer `at` among those that give from that place gives way: its moves are undone
// (the record is marked `gone`, goneBy the record kept) and the device that wrote it says "An answer from
// your other device was used. Check it." at its next open. Repeated until nothing is refused.
const NOTICE = 'An answer from your other device was used. Check it.';
function leftoversMerged({ period, periodTo, places, mine, theirs }) {
  const named = list => {
    const seen = new Set();
    return (list || []).map(a => {
      const id = idFor({ k: 'pe', period, place: a.place });   // [T1]
      if (seen.has(id)) throw new Error('two records for ' + a.place + ' on one device: an answer is one record per place [P2]');
      seen.add(id);
      return Object.assign({ id }, a);
    });
  };
  let live = mergeList(named(mine), named(theirs)).filter(a => !a.gone);
  const gaveWay = [], ms = t => Date.parse(t);
  for (;;) {
    const r = leftovers({ periodTo, places, answers: flatten(live) });
    if (!r.refused) {
      if (!gaveWay.length) return r;
      const to = [...new Set(gaveWay.map(g => g.by))];
      return Object.assign(r, { gaveWay, notice: to.length === 1 ? { to: to[0], text: NOTICE } : to.map(t => ({ to: t, text: NOTICE })) });
    }
    const id = r.refused.place;
    const gives = live.filter(x => x.place === id || x.from === id || (x.moves || []).some(m => m.from === id));
    if (gives.length < 2) return r;   // not two answers adding up: refused as before [L period_end q10]
    const newest = gives.reduce((n, x) => (ms(x.at) > ms(n.at) || (ms(x.at) === ms(n.at) && x.id > n.id) ? x : n));
    gaveWay.push({ id: newest.id, by: newest.by });
    live = live.filter(x => x !== newest);
  }
}

// [O] An old statement read after the period-end answer: the answer stays (its moves are unchanged). The
// spending it adds, dated in that period, comes out of the place: what was really left is the left at the
// answer less that spending. What still waited to decide shrinks first; [P5] the money kept for the next
// period never does. What the answers gave beyond what was really left is shown as "found later" at the next
// check-in, where the person picks where it comes from: Waiting or this period's Free to spend. Each pick
// (`covers`: `{ place, from, a, date, told }`) is a move into the place dated the check-in day. A pick from
// anywhere else is refused, and so are picks adding up to more than was found later [L period_end q10].
const COVER_FROM = ['waiting', 'free'];
function foundLater({ periodTo, places, answers, later, covers }) {
  const r = leftovers({ periodTo, places, answers: flatten(answers) });
  if (r.refused) return r;
  const out = { places: {}, moves: r.moves.slice() };
  for (const p of places) {
    const e = r.places[p.id];
    if (!e || p.left < 0) continue;
    const extra = (later || []).filter(x => x.place === p.id).reduce((t, x) => t + x.a, 0);
    const left = p.left - extra, given = e.decided + e.kept, found = Math.max(0, given - left);
    const o = out.places[p.id] = { left, given, kept: e.kept, toDecide: Math.max(0, left - given), foundLater: found };
    const mine = (covers || []).filter(c => c.place === p.id);
    for (const c of mine) if (!COVER_FROM.includes(c.from)) return { refused: { place: p.id, from: c.from } };
    const covered = mine.reduce((t, c) => t + c.a, 0);
    if (covered > found) return { refused: { place: p.id, left: found } };
    if (!found) continue;
    Object.assign(o, { covered, toCover: found - covered });
    if (found > covered) o.coverFrom = COVER_FROM.slice();
    for (const c of mine) out.moves.push({ k: 'move', date: c.date, a: c.a, place: c.from, place2: p.id, told: c.told });
  }
  return out;
}

// [X5] P3 made general: every share-out from a limited amount (placing money to place, covering an overspend found
// later, period-end answers) is checked again after a merge. The two copies' share-outs are merged by id (an edited
// one is one record, its newer copy whole [D4]); when they add up to more than there is (`limit`), the one with the
// newest `at` gives way, repeated until the rest fit. The device that wrote one that gave way says so at its next open.
function shareOutMerged({ limit, mine, theirs }) {
  let live = mergeList(mine, theirs).filter(x => !x.gone);
  const gaveWay = [];
  const sum = () => live.reduce((t, x) => t + x.a, 0);
  while (sum() > limit && live.length) {
    const newest = live.reduce((n, x) => (ms(x.at) > ms(n.at) || (ms(x.at) === ms(n.at) && x.id > n.id) ? x : n));
    gaveWay.push({ id: newest.id, by: newest.by });
    live = live.filter(x => x !== newest);
  }
  const out = { kept: live.map(x => x.id).sort() };
  if (!gaveWay.length) return out;
  const to = [...new Set(gaveWay.map(g => g.by))];
  return Object.assign(out, { gaveWay, notice: to.length === 1 ? { to: to[0], text: NOTICE } : to.map(t => ({ to: t, text: NOTICE })) });
}

// [X watch: the stale 11.1 row] A 38.31 month-end answer (`ui.sweep`), dated its period's last day, becomes the record
// `pe:<the occurrence of the pay that started that period>:<place>` [T1]: the period holding its last day started with
// the latest pay landing on or before that day.
function sweepId({ place, periodTo, pays }) {
  const to = dayNum(periodTo);
  const start = (pays || []).filter(p => dayNum(p.lands) <= to).sort((x, y) => dayNum(x.lands) - dayNum(y.lands)).pop();
  if (!start) return null;
  return idFor({ k: 'pe', period: start.occ, place });
}

function ask(question, input) {
  if (question === 'share_out_merged') return shareOutMerged(input);
  if (question === 'sweep_id') return sweepId(input);
  if (question === 'question_start') return questionStart(input);
  if (question === 'leftovers_merged') return leftoversMerged(input);
  if (question === 'found_later') return foundLater(input);
  if (question === 'leftovers') return leftovers(input);
  if (question === 'screen') return screen(input);
  if (question === 'next_period') return nextPeriod(input);
  if (question === 'leftovers_ends') return leftoversEnds(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, questionStart, leftovers, screen, nextPeriod, leftoversEnds, leftoversMerged, foundLater, shareOutMerged, sweepId };
