// What setup and an edit may save (SCHEMA_V3 4, 5 and 8; DECISIONS_ROUND2 X3, X8, W3, F20, H2, T1, B8, O6).
// A plain reference for the engine lane, checked by run_rules.js against rules/edits.json.
'use strict';
const { dayNum, dayStr } = require('./dates');

// [X8] A schedule change (a `rules` or `steps` entry from a date) can never start on or before its latest settled
// or named occurrence: a settle (`settles`), a `once` key, an `amounts` key, a period-end answer `pe:<occurrence>:...`
// or a period start `ps:<occurrence>`. Only the changed schedule's own occurrences count. The edit offers the first
// day after that occurrence's due date [H2: an occurrence is named by its due date before any move].
function changeFrom({ schedule, wanted, settles, once, amounts, pe, ps }) {
  const names = [].concat(settles || [], Object.keys(once || {}),
    Object.keys(amounts || {}).map(d => schedule + '@' + d),
    (pe || []).map(id => String(id).split(':')[1]), (ps || []).map(id => String(id).slice(3)));
  const due = names.map(n => String(n).match(/^([a-z0-9_]+)@(\d{4}-\d{2}-\d{2})$/)).filter(mm => mm && mm[1] === schedule).map(mm => mm[2]).sort();
  const latest = due[due.length - 1];
  if (!latest || dayNum(wanted) > dayNum(latest)) return { ok: true };
  return { refused: true, latest: schedule + '@' + latest, offer: dayStr(dayNum(latest) + 1) };
}

// [W3] In version one a goal's own account must be in the home currency in force [O6]; another currency is stage 2.
function ownAccount({ home, account }) {
  return account.cur === home ? { ok: true } : { refused: { account: account.id, cur: account.cur, stage: 2 } };
}

// [X3, F20] Setup asks, for each pay and bill due after the last pay up to and including the setup day, whether it
// has gone out (or come in) yet; a pay due that day is asked first, then the rest by due date. Each one answered
// "not yet" is saved in the opening's `notYet`.
function notYetAsks({ setup, lastPay, items }) {
  const from = dayNum(lastPay), to = dayNum(setup);
  const asked = (items || []).filter(x => dayNum(x.due) > from && dayNum(x.due) <= to);
  const first = asked.filter(x => x.kind === 'income' && dayNum(x.due) === to);
  const rest = asked.filter(x => !first.includes(x)).sort((x, y) => dayNum(x.due) - dayNum(y.due));
  return first.concat(rest).map(x => x.occ);
}

function ask(question, input) {
  if (question === 'change_from') return changeFrom(input);
  if (question === 'own_account') return ownAccount(input);
  if (question === 'not_yet_asks') return notYetAsks(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, changeFrom, ownAccount, notYetAsks };
