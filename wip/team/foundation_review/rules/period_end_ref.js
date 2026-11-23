// Period end (SCHEMA_V3 7.4 and 9; DECISIONS_ROUND2 A7, F8, H8, L, M, N5).
// A plain reference for the engine lane, checked by run_rules.js against rules/period_end.json.
// Open points name their question in period_end.json.
'use strict';
const { dayNum, dayStr, addWorking } = require('./dates');

// Has the period ended, its last day, and does the question start with a check-in [A7].
// [N5] A new period the person started without the pay is saved as an event `{ k: 'periodStart', date }`.
// The live one (no `gone`) dated after this period's first day and on or before today starts the new period;
// one on or before the first day is what began this period (or an earlier one). The first one after the
// first day ends this period; a later one would end a later period.
function startedFromEvents(events, periodFrom, now) {
  const from = periodFrom ? dayNum(periodFrom) : -Infinity;
  const days = (events || []).filter(e => e.k === 'periodStart' && !e.gone && dayNum(e.date) > from && dayNum(e.date) <= now)
    .map(e => e.date).sort();
  return days.length ? days[0] : null;
}

function questionStart({ nextPay, checkins, today, spendFrom, postingDays, holidays, events, periodFrom }) {
  const now = dayNum(today);
  const startedFrom = startedFromEvents(events, periodFrom, now);
  const lands = dayNum(nextPay.lands || nextPay.due);
  const windowEnd = addWorking(lands, postingDays == null ? 1 : postingDays, holidays || []);
  const landed = nextPay.landed && dayNum(nextPay.landed) <= now;
  // [M7] The person started the new period without the pay: it starts on the day they chose. The late pay
  // stays expected until its posting window ends, then is "not seen yet" [H8].
  const started = !landed && startedFrom && dayNum(startedFrom) <= now;
  // [F8, H8] The period ends the day before the next pay lands; until it is seen it has not ended, even on
  // the period's last day [L period_end q2]. Past its posting window the check-in asks "did your pay
  // come?"; a "yes" writes the pay with the day it came, which ends the period [L period_end q3].
  if (!landed && !started) return now > windowEnd ? { ended: false, askPayCame: true } : { ended: false };
  const to = (started ? dayNum(startedFrom) : dayNum(nextPay.landed)) - 1;
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
function leftovers({ periodTo, places, answers }) {
  const out = { places: {}, moves: [] };
  const all = answers || [];
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
    for (const a of mine) if (!a.keep) out.moves.push({ k: 'move', date: periodTo, a: a.a, place: p.id, place2: a.to, told: a.told });
  }
  // A cover from Free to spend is a move out of it: list it once, under the place it covers (above).
  return out;
}

// [L period_end q5] Nothing left anywhere: one line, "nothing left this time", no question.
function screen({ places }) {
  return places.every(p => p.left === 0) ? { ask: false, line: 'nothing left this time' } : { ask: true };
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

// [L period_end q8] Two or more unanswered ends stay apart; each answer names its period's last day.
function leftoversEnds({ ends, answers }) {
  return ends.map(e => Object.assign({ periodTo: e.periodTo },
    leftovers({ periodTo: e.periodTo, places: e.places, answers: (answers || []).filter(a => a.period === e.periodTo) })));
}

function ask(question, input) {
  if (question === 'question_start') return questionStart(input);
  if (question === 'leftovers') return leftovers(input);
  if (question === 'screen') return screen(input);
  if (question === 'next_period') return nextPeriod(input);
  if (question === 'leftovers_ends') return leftoversEnds(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, questionStart, leftovers, screen, nextPeriod, leftoversEnds };
