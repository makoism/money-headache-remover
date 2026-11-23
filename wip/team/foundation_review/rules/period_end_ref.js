// Period end (SCHEMA_V3 7.4 and 9; DECISIONS_ROUND2 A7, F8, H8).
// A plain reference for the engine lane, checked by run_rules.js against rules/period_end.json.
// Open points name their question in period_end.json.
'use strict';
const { dayNum, dayStr } = require('./dates');

// Has the period ended, its last day, and does the question start with a check-in [A7].
function questionStart({ nextPay, checkins, today }) {
  // [F8, H8] the period ends the day before the next pay lands; until it lands (late) it has not ended.
  // pe-q2, pe-q3: only a landed pay ends it.
  if (!nextPay.landed || dayNum(nextPay.landed) > dayNum(today)) return { ended: false };
  const to = dayNum(nextPay.landed) - 1;
  // [A7] fresh: a check-in dated in the last 3 days (to - 2 .. to). pe-q1: a check-in after the end does not count.
  const fresh = (checkins || []).some(d => dayNum(d) >= to - 2 && dayNum(d) <= to);
  return { ended: true, periodTo: dayStr(to), startsWithCheckIn: !fresh };
}

// Money left at the period's end waits in its place, "to decide", until answered [A7].
// Answers are move events dated the period's last day (7.4), told when they were answered.
function leftovers({ periodTo, places, answers }) {
  const out = { places: {}, moves: [] };
  for (const p of places) {
    const mine = (answers || []).filter(a => a.place === p.id);
    const decided = mine.reduce((t, a) => t + a.a, 0);
    if (p.left <= 0) {   // pe-q4, pe-q5: no money to place
      if (mine.length) throw new Error('an answer for ' + p.id + ', which has nothing left');
      out.places[p.id] = { left: p.left, decided: 0, toDecide: 0, state: 'nothing left' };
      continue;
    }
    if (decided > p.left) throw new Error('answers for ' + p.id + ' are more than is left');   // pe-q10
    const toDecide = p.left - decided;
    out.places[p.id] = { left: p.left, decided, toDecide, state: toDecide ? 'to decide' : 'decided' };
    for (const a of mine) out.moves.push({ k: 'move', date: periodTo, a: a.a, place: p.id, place2: a.to, told: a.told });
  }
  return out;
}

function ask(question, input) {
  if (question === 'question_start') return questionStart(input);
  if (question === 'leftovers') return leftovers(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, questionStart, leftovers };
