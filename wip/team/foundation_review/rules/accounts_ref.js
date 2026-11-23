// Accounts: closing (SCHEMA_V3 3 and 5; DECISIONS_ROUND2 O, P6, Q7, the Q watch item (write-off), R3, R4, R5, S3, T watch (the main bank)).
// A plain reference for the engine lane, checked by run_rules.js against rules/accounts.json.
// Open points name their question in accounts.json.
'use strict';
const { dayNum } = require('./dates');

// [O] An account with history is closed, never deleted: closing writes a final `check` and sets `closed`.
// [P6] It closes only when its final figure is zero or moved out by the transfers the closing asks for
// (dated the closing day); otherwise it is refused, with what is still in it shown. Its schedules (paid from
// it, landing in it, or a transfer into it) end on the closing day, unless they already end on or before it.
// [R4] Closing the account a card is paid from, or a place is kept in, first asks for the new account for each
// (`newLinks`) and moves the link; until each has one, the closing is refused with what still `needs` one.
// [R3] A card, loan or pay-later account that still owes money (`figure` above zero), or a bank below zero,
// cannot be closed until it is at zero: refused, with the payment that gets it there offered (a repay from its
// `payFrom`, or for a bank a transfer in from an account the person picks).
// [Q watch item] A balance that cannot be moved out may be written off as a spend (`writeOff`).
// [Q7] The closing's transfer or write-off has the built id `close:<account>`. [S3] A closing that writes several
// records names them `close:<account>:1`, `:2`, in the order written (the transfers as listed, then the write-off).
const OWED = { card: 1, loan: 1, paylater: 1 };
// [T watch decided] Closing the main bank (`mainBank`) asks for the new main bank (`newLinks.mainBank`) and moves
// every link to it: `home.mainBank`, the budget lines and Free to spend held on it (their `acct` is it, or none:
// the main bank), and the pay schedules landing in it, which move instead of ending. Bills paid from it end (P6).
function close({ account, kind, payFrom, date, figure, transfers, writeOff, schedules, links, newLinks, mainBank, lines, free }) {
  const linked = [].concat((links || {}).cards || [], (links || {}).places || [], mainBank ? ['mainBank'] : []);
  const needs = linked.filter(x => !(newLinks || {})[x]);
  if (needs.length) return { refused: { account, needs } };
  if (OWED[kind] && figure > 0) return { refused: { account, owes: figure, offer: { k: 'repay', acct: payFrom, acct2: account, a: figure } } };
  if (!OWED[kind] && figure < 0 && !(transfers || []).length) return { refused: { account, left: figure, offer: { k: 'transfer', acct2: account, a: -figure } } };
  const out = (transfers || []).reduce((t, x) => t + x.a, 0) + (writeOff || 0);
  if (figure - out !== 0) return { refused: { account, left: figure - out } };
  const recs = (transfers || []).map(x => ({ k: 'transfer', date, acct: account, acct2: x.to, a: x.a }))
    .concat(writeOff ? [{ k: 'spend', date, acct: account, a: writeOff }] : []);
  const events = [{ k: 'check', date, acct: account, a: figure }]
    .concat(recs.map((r, i) => Object.assign({ id: 'close:' + account + (recs.length > 1 ? ':' + (i + 1) : '') }, r)));
  const ends = {}, moved = {};
  const nb = mainBank ? newLinks.mainBank : null;
  const onIt = a => a === account || a == null;
  if (nb) {
    moved.mainBank = nb;
    for (const l of lines || []) if (onIt(l.acct)) (moved.lines = moved.lines || {})[l.id] = nb;
    if (free && onIt(free.acct)) moved.free = nb;
  }
  for (const s of schedules || []) {
    if (nb && s.kind === 'income' && s.acct === account) { (moved.schedules = moved.schedules || {})[s.id] = nb; continue; }
    if (s.acct !== account && s.acct2 !== account) continue;
    if (s.ends && dayNum(s.ends) <= dayNum(date)) continue;
    ends[s.id] = date;
  }
  return Object.assign({ closed: date, events, ends }, linked.length ? { links: Object.assign({}, newLinks) } : {}, nb ? { moved } : {});
}

function ask(question, input) {
  if (question === 'close') return close(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, close };
