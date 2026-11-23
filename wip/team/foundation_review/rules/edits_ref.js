// What setup and an edit may save (SCHEMA_V3 4, 5 and 8; DECISIONS_ROUND2 X3, X8, W3, F20, H2, T1, B8, O6).
// A plain reference for the engine lane, checked by run_rules.js against rules/edits.json.
'use strict';
const { dayNum, dayStr } = require('./dates');

// [X8] A schedule change (a `rules` or `steps` entry from a date) can never start on or before its latest settled
// or named occurrence: a settle (`settles`), a `once` key, an `amounts` key, a period-end answer `pe:<occurrence>:...`
// or a period start `ps:<occurrence>`. Only the changed schedule's own occurrences count. The edit offers the first
// day after that occurrence's due date [H2: an occurrence is named by its due date before any move].
// [AH2] Every occurrence name is read with built and moved schedule ids alike (`mv:pay:steps.a@2026-12-25`,
// `pe:mv:pay:steps.a@2026-12-25:free`, `ps:mv:...`), so X8 protects moved schedules too.
// [AH3] Keyed overrides are read in the AE1 shape (`{ amount, at, by, gone }`): a removed key (`gone`) names nothing.
// [AJ1] Occurrence names are read by the one shared reader (rules/ids.js), so ordinary ids (`k7qzpa-m2xq7ab9zt-41@...`)
// count, and a schedule id is read whole: `...-4@` never counts for `...-41`.
// [AJ5] When everything in the way is a one-off amount of the schedule itself (a live `amounts` key on or after the
// wanted day, a December bonus), the edit also offers to move or remove those amounts (`amounts`, by date, and
// `amountsOffer`), so a new employer's pay day can still be entered. A settle, a `once` key, a `pe:` or `ps:` record on
// or after the wanted day cannot be moved: then the refusal and its day are all that is offered.
// [AK3] A budget line's or a share's `once` key named by the pay is offered the same way (`once`, the occurrence names,
// each once however many lines and shares hold it). `once` may be one map or a list of maps, one per line or share.
// [AK2] With the new rule given (`rule`, from the wanted day), "move" takes each offered amount or key to the new rule's
// first occurrence in the same month (`moveTo`, old name to new name). [AL6] A month with no occurrence of the new rule on
// or after the wanted day sends it to the new rule's next occurrence (a 25 Dec bonus, the new pay day the 10th from
// 15 Dec: 10 Jan). When two land on one occurrence, or one lands on an occurrence that already has its own amount or
// key, the offer shows them together and the person picks add or replace (`together`, `togetherOffer`).
const { occurrence } = require('./ids');
const ymAdd = (ym, n) => { const i = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1 + n; return String(Math.floor(i / 12)) + '-' + String(i % 12 + 1).padStart(2, '0'); };
const { duesIn } = require('./move_ref');
const liveKeys = map => Object.keys(map || {}).filter(k => !(map[k] && typeof map[k] === 'object' && map[k].gone));
function changeFrom({ schedule, wanted, rule, settles, once, amounts, pe, ps }) {
  const own = names => names.map(occurrence).filter(o => o && o.schedule === schedule).map(o => o.due);
  const fixed = own([].concat(settles || [],
    (pe || []).map(id => String(id).replace(/^pe:/, '')), (ps || []).map(id => String(id).replace(/^ps:/, ''))));
  const onceDue = [...new Set(own([].concat(...[].concat(once || []).map(liveKeys))))];   // [AK3]
  const oneOff = liveKeys(amounts);
  const due = fixed.concat(onceDue, oneOff).sort();
  const latest = due[due.length - 1];
  if (!latest || dayNum(wanted) > dayNum(latest)) return { ok: true };
  const out = { refused: true, latest: schedule + '@' + latest, offer: dayStr(dayNum(latest) + 1) };
  const inWay = d => dayNum(d) >= dayNum(wanted);
  if (fixed.some(inWay)) return out;
  const am = oneOff.filter(inWay).sort(), on = onceDue.filter(inWay).sort();
  if (am.length) out.amounts = am;   // [AJ5]
  if (on.length) out.once = on.map(d => schedule + '@' + d);   // [AK3]
  out.amountsOffer = ['move', 'remove'];
  if (rule) {   // [AK2] the new rule's first occurrence in the same month, on or after the wanted day
    // [AL6] none in that month on or after the wanted day: the new rule's next occurrence (the first on or after the
    // wanted day, in a later month; looked for up to 24 months on)
    const to = d => { for (let i = 0; i < 24; i++) { const x = duesIn(rule, ymAdd(d.slice(0, 7), i)).find(y => dayNum(y) >= dayNum(wanted)); if (x) return x; } return null; };
    out.moveTo = {};
    for (const d of am) out.moveTo[d] = to(d);
    for (const d of on) { const t = to(d); out.moveTo[schedule + '@' + d] = t && schedule + '@' + t; }
    // [AL6] two amounts or keys landing on one occurrence (one of them may be that occurrence's own): the offer shows
    // them together and the person picks add or replace (`together`, each target with what lands on it, in date order)
    const together = {};
    for (const [from, t] of Object.entries(out.moveTo)) if (t) (together[t] = together[t] || []).push(from);
    for (const t of Object.keys(together)) if (together[t].length < 2) delete together[t]; else together[t].sort();
    if (Object.keys(together).length) { out.together = together; out.togetherOffer = ['add', 'replace']; }
  }
  return out;
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

// [AB3] A card (or pay-later or loan) set up between a statement's close and its payment day: setup asks the question and
// saves the answer as a statement check [J5]. [AE6] The question is "Has your last card statement already left your bank?"
// (`q: 'leftBank'`), with the line that an automatic debit counts as not yet until the day it comes out
// (`line: 'autoDebitNotYet'`): yes means the money has left the bank. The saved field is unchanged: yes, paid (no amount
// asked); no (not yet), unpaid with the amount asked, the box filled in with everything owed on a card [AD6] and with that
// month's usual payment on a loan or pay-later [AF2]; don't know, unpaid holding everything owed, so it is all due on the
// next payment day (as H4), or on a loan or pay-later that month's usual payment [AD7].
// `closeDay` is a day of the month or 'last'; the payment is on `payDay`, `monthsAfterClose` months after the close.
// Day `d` (or 'last') of month m of year y, as a day number; a day past the month's end is its last day.
function dayOfMonth(y, m, d) {
  const ym = i => String(Math.floor(i / 12)) + '-' + String(i % 12 + 1).padStart(2, '0');
  const i = y * 12 + m - 1, first = dayNum(ym(i) + '-01'), last = dayNum(ym(i + 1) + '-01') - 1;
  return d === 'last' ? last : Math.min(first + Number(d) - 1, last);
}
function statementAsk({ setup, kind, closeDay, payDay, monthsAfterClose, owed, usual, answer, amount }) {
  const s = dayNum(setup), y = Number(setup.slice(0, 4)), m = Number(setup.slice(5, 7));
  let close = dayOfMonth(y, m, closeDay);
  if (close > s) close = dayOfMonth(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1, closeDay);   // the latest close on or before setup
  const cy = Number(dayStr(close).slice(0, 4)), cm = Number(dayStr(close).slice(5, 7)) + (monthsAfterClose || 1);
  const pay = dayOfMonth(cy + Math.floor((cm - 1) / 12), ((cm - 1) % 12) + 1, payDay);
  if (!(s < pay)) return { asked: false };   // [X6] no statement waits for its payment day
  const st = { stmt: true, stmtDate: dayStr(close), stmtPay: dayStr(pay) };
  const debt = kind === 'loan' || kind === 'paylater', q = { asked: true, q: 'leftBank', line: 'autoDebitNotYet' };
  if (answer === 'yes') return Object.assign(q, { saved: Object.assign(st, { paid: true }) });
  // [AD6, AF2] "No, not yet" asks the amount, filled with everything owed on a card and with that month's usual payment
  // (`usual`) on a loan or pay-later; left as it is, that is the statement.
  if (answer === 'no') { const filled = debt ? usual : owed; return Object.assign(q, { filled, saved: Object.assign(st, { paid: false, a: typeof amount === 'number' ? amount : filled }) }); }
  // [AD7] On a loan or pay-later "don't know" means that month's usual payment (`usual`) is due on the next payment day.
  if (answer === 'dontKnow') return Object.assign(q, { saved: Object.assign(st, { paid: false, a: debt ? usual : owed }) });
  return q;
}
// [AB, MAKO M1] Setup asks once, "Keep at least ___ in your bank?", the box empty; skipping means no minimum.
function minAsk({ cur, typed }) {
  return { asked: true, filled: null, minBank: typeof typed === 'number' ? { a: typed, cur } : null };
}

function ask(question, input) {
  if (question === 'statement_ask') return statementAsk(input);
  if (question === 'min_ask') return minAsk(input);
  if (question === 'change_from') return changeFrom(input);
  if (question === 'own_account') return ownAccount(input);
  if (question === 'not_yet_asks') return notYetAsks(input);
  throw new Error('unknown question ' + question);
}

module.exports = { ask, changeFrom, ownAccount, notYetAsks, statementAsk, minAsk };
