// Accounts: closing (SCHEMA_V3 3 and 5; DECISIONS_ROUND2 O, P6).
// A plain reference for the engine lane, checked by run_rules.js against rules/accounts.json.
// Open points name their question in accounts.json.
'use strict';
const { dayNum } = require('./dates');

// [O] An account with history is closed, never deleted: closing writes a final `check` and sets `closed`.
// [P6] It closes only when its final figure is zero or moved out by the transfers the closing asks for
// (dated the closing day); otherwise it is refused, with what is still in it shown. Its schedules (paid from
// it, landing in it, or a transfer into it) end on the closing day, unless they already end on or before it.
function close({ account, date, figure, transfers, schedules }) {
  const out = (transfers || []).reduce((t, x) => t + x.a, 0);
  if (figure - out !== 0) return { refused: { account, left: figure - out } };
  const events = [{ k: 'check', date, acct: account, a: figure }]
    .concat((transfers || []).map(x => ({ k: 'transfer', date, acct: account, acct2: x.to, a: x.a })));
  const ends = {};
  for (const s of schedules || []) {
    if (s.acct !== account && s.acct2 !== account) continue;
    if (s.ends && dayNum(s.ends) <= dayNum(date)) continue;
    ends[s.id] = date;
  }
  return { closed: date, events, ends };
}

function ask(question, input) {
  if (question === 'close') return close(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, close };
