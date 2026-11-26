/* ---------- the shared screen pieces, in short names (wip/team/screens/, lane D) ----------
   money.js writes and reads amounts, names.js gives every label and day, status.js the one verdict, inputs.js the one
   box behaviour, provenance.js the typed-or-sample mark, messages.js the one message band. No sums here. */
const SM = BurrowScreens.money, SN = BurrowScreens.names;
/* [BL4] one way of writing cents per screen, the sum lines included: a screen draws itself through screen3(draw); every
   amount written while it draws is noted, and when any has cents the screen draws again with cents on every amount
   ("$0.00" over "= $0.00", never "$0"). Outside a screen's drawing each amount or sentence keeps its own rule. */
const CENTS3 = { on: false, seen: false };
function note3(amounts, cur) { if (!CENTS3.on && amounts.some(n => SM.hasCents(n, cur))) CENTS3.seen = true; }
const money3 = (minor, cur) => { note3([minor], cur); return SM.format(minor, cur, CENTS3.on ? { cents: true } : {}); };
/* the one formatter for a sentence: the screen's rule when it has cents, else the sentence's own */
function fmt3(cur, amounts) { note3(amounts, cur); return CENTS3.on ? (n => SM.format(n, cur, { cents: true })) : SM.formatter(cur, amounts); }
function sum3(parts, result, cur) { note3(parts.map(x => x.amount).concat([result]), cur); return SM.sumLine(parts, result, cur, CENTS3.on ? { cents: true } : undefined); }
function screen3(draw) {
  CENTS3.on = false; CENTS3.seen = false;
  draw();
  if (!CENTS3.seen) return;
  CENTS3.on = true;
  try { draw(); } finally { CENTS3.on = false; }
}
/* a typed amount as whole minor units, or null (never rounded; a minus is refused) */
function typed3(text, cur) { const r = SM.parse(text, cur); return r.ok ? r.minor : null; }
/* [M47, K29] what a bank shows today can be below zero: the one box where a minus is read (a bank only, never a card,
   a pay or a bill), as whole minor units or null */
/* [qc-numbers run 1 B4] a comma not in a thousands place ("1,0000"): the question to show in place of the box's own
   words, "Did you mean ¥1,000 or ¥10,000?", or null for any other text */
/* [qc-numbers run 1 POLISH] too many decimals says so at Save too, in the box's own words (screens/inputs.js) */
function typedSlip3(text, cur) {
  const r = SM.parse(text, cur, { allowMinus: true });
  if (r.ok) return null;
  if (r.reason === 'commas') return `Did you mean ${r.means.map(n => money3(n, cur)).join(' or ')}?`;
  return r.reason === 'decimals' ? BurrowScreens.inputs.commit(text, { code: cur, allowMinus: true }).message : null;
}
function typedBank3(text, cur) { const r = SM.parse(text, cur, { allowMinus: true }); return r.ok ? r.minor : null; }
/* '2026-12-10' as '10 Dec', with the year when it is not the shown day's year */
const day3 = (s, thisYear) => (s ? SN.dayLabel(s, !!thisYear && s.slice(0, 4) !== thisYear) : '');
const label3 = (key, ctx) => SN.label(key, ctx);
/* [slice 6] a schedule's rhythm in words, one function for every screen: "day 10 each month", "day 15 and the last day
   each month", "every 2 weeks, on Fridays", "every 3 months, on day 15", "each year in May and Nov, on day 31", "each
   year on 1 Mar", "once, on 10 Jan 2027", "the last working day of each month", "no fixed day". `yr` is this year. */
const WEEKDAYS3 = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const MONTH_SHORT3 = { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' };
function rhythmWords3(rule, yr) {
  const r = rule || {}, D = BurrowEngine.dates;
  const dayWord = d => (d === 'last' ? 'the last day' : 'day ' + d);
  const and = list => (list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list.slice(-1)[0] : list[0] || '');
  switch (r.every) {
    case 'month': return `${and((r.days || [r.day]).map(dayWord))} each month`;
    case 'weeks': return `${r.n === 1 || !r.n ? 'every week' : `every ${r.n} weeks`}, on ${WEEKDAYS3[D.weekday(D.dayNum(r.from))]}`;
    case 'months': return `every ${r.n === 1 ? 'month' : `${r.n} months`}, on ${dayWord(r.day != null ? r.day : +r.from.slice(8, 10))}`;
    case 'monthsList': return `each year in ${and(r.months.map(m => MONTH_SHORT3[m]))}, on ${dayWord(r.day)}`;
    case 'year': return `each year on ${day3('2000-' + r.date, '2000')}`;
    case 'once': return `once, on ${day3(r.date, yr)}`;
    case 'lastWorkday': return 'the last working day of each month';
    default: return 'no fixed day';
  }
}
/* [S1] a period by its dates; on the day its pay lands and counts (res.period.payToday) it runs "to today's pay", never
   "10 Nov to 10 Dec" beside a safe to spend that already counts that pay */
const period3 = p => (p.payToday ? SN.periodLabel(p.start, p.end).split(' to ')[0] + ' to today\'s pay' : SN.periodLabel(p.start, p.end));
const esc3 = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* a figure on screen: its engine path (data-figure, checked by names and provenance), its amount (data-amt) */
const fig3 = (path, minor, cur, tag) => `<${tag || 'span'} data-figure="${esc3(path)}" data-amt="${minor}">${money3(minor, cur)}</${tag || 'span'}>`;
/* [NS-FIX 4, BM1] a line taken over, in one set of words for Plan and Receipts: "¥1,076 over Food. It comes out of what
   your bank can spare" (the over part is paid from what the bank can spare; safe to spend does not change for it)
   (the amount already written by the screen's formatter, the engine's `over`) */
const overWords3 = (name, overText) => `${overText} over ${name}. It comes out of what your bank can spare`;
/* [NS-FIX 5] a heading with the one help piece's "?" beside it (never inside it) and its hidden lines under it */
const HELP3 = BurrowScreens.help;
const helpHead3 = (h2, keys, ctx) => `<div class="a3-head">${h2}${HELP3.button([].concat(keys)[0])}</div>${HELP3.text(keys, ctx)}`;
const MSG3 = BurrowScreens.messages.createQueue();
const msg3 = text => MSG3.post({ kind: 'toast', key: 'a3', text });
