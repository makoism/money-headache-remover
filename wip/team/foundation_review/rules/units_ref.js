// Units (SCHEMA_V3 0, 3, 8 and 11; DECISIONS_ROUND2 B4, B8, H9, I2, L, M, N3, N4, O6, O, P4).
// A plain reference for the engine lane, checked by run_rules.js against rules/units.json.
// Open points name their question in units.json.
'use strict';
const { dayNum, dayStr } = require('./dates');

// [L units q1] The ISO 4217 minor-unit table ships with the page: decimals per active code. Codes ISO lists
// with no minor unit (gold, test and fund codes such as XAU, XTS, XDR) are left out, so they count as unknown.
// An unknown code is 2 decimals and the screen asks once (section 0). The table is checked against the
// published ISO list whenever the page ships.
const ZERO = 'BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF';
const THREE = 'BHD IQD JOD KWD LYD OMR TND';
const FOUR = 'CLF UYW';
const TWO = 'AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF '
  + 'CHE CHF CHW CNY COP COU CRC CUP CVE CZK DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GTQ GYD HKD HNL '
  + 'HTG HUF IDR ILS INR IRR JMD KES KGS KHR KPW KYD KZT LAK LBP LKR LRD LSL MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR '
  + 'MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD PAB PEN PGK PHP PKR PLN QAR RON RSD RUB SAR SBD SCR SDG SEK SGD SHP '
  + 'SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TOP TRY TTD TWD TZS UAH USD USN UZS VED VES WST XCD XCG YER ZAR ZMW ZWG';
const DECIMALS = {};
for (const [list, d] of [[ZERO, 0], [TWO, 2], [THREE, 3], [FOUR, 4]]) for (const code of list.split(' ')) DECIMALS[code] = d;

// A typed amount (text with a point for decimals) as whole minor units. Read as digits, never through a
// decimal number. An unknown code is 2 decimals and the screen asks once (section 0).
// [L units q2] More decimals than the currency has: rounded half up (on the size of the amount), and
// `rounded: true` so the screen says so.
function toMinor(text, cur) {
  const known = DECIMALS[cur] !== undefined, d = known ? DECIMALS[cur] : 2;
  const m = /^(-?)(\d+)(?:\.(\d*))?$/.exec(String(text).trim());
  if (!m) throw new Error('not an amount: ' + text);
  const frac = m[3] || '';
  let n = BigInt(m[2]) * 10n ** BigInt(d) + BigInt((frac + '0'.repeat(d)).slice(0, d) || 0);
  const rest = frac.slice(d);
  const rounded = rest.length > 0;
  if (rounded && Number(rest[0]) >= 5) n += 1n;   // half up: the first extra digit decides
  const out = { minor: Number(m[1] ? -n : n), decimals: d, ask: !known };
  if (rounded) out.rounded = true;
  return out;
}

// The code from what was given: a code is used; "$", "¥" and nothing at all are asked, never guessed [H9].
function currencyFor({ code } = {}) {
  if (code && DECIMALS[code] !== undefined) return { cur: code, ask: false };
  if (code) return { cur: code, ask: true };   // an unknown code: kept, asked once
  return { cur: null, ask: true };
}

// [L units q9] A saved amount that is not a whole number is kept as it is and flagged on load.
function loadAmount(a) { return { a, flag: !Number.isInteger(a) }; }

// [I2] One month's interest: balance x yearly rate (percent) / 12, half up to the minor unit, in whole numbers.
// Nothing on a balance at or below zero (a credit).
function interest(balance, apr) {
  if (!apr || balance <= 0) return 0;
  const k = BigInt(Math.round(apr * 10000)), den = 1200n * 10000n;
  return Number((2n * BigInt(balance) * k + den) / (2n * den));
}

// [H9] The real number of pays a schedule has in a calendar year, counted by the due date before any move
// [L units q3]. An every-N-weeks rule is counted over the whole year by its rhythm, back from its first date,
// in its first year too [L units q5].
function paysInYear(rule, year) {
  if (rule.rules) return paysInYearRules(rule.rules, year);
  if (rule.every === 'month') return 12 * rule.days.length;
  if (rule.every === 'weeks') {
    const step = 7 * rule.n, first = dayNum(year + '-01-01'), last = dayNum(year + '-12-31');
    let d = dayNum(rule.from);
    d -= Math.floor((d - first) / step) * step;   // the first date on the rhythm on or after 1 Jan
    let count = 0;
    for (; d <= last; d += step) count++;
    return count;
  }
  if (rule.every === 'months') return 12 / rule.n;
  throw new Error('no pay count for ' + rule.every);
}
// [O] A schedule whose rule changes during the year (`rules: [ { from, rule } ]`, H2): each due date is counted
// by the rule in force on it. The first rule counts back to 1 Jan by its rhythm (L units q5); a later rule
// counts from its own `from`.
function dueDatesIn(rule, year) {
  const first = dayNum(year + '-01-01'), last = dayNum(year + '-12-31'), out = [];
  if (rule.every === 'month') {
    for (let mo = 1; mo <= 12; mo++) for (const d of rule.days) {
      const end = new Date(Date.UTC(year, mo, 0)).getUTCDate();
      out.push(dayNum(year + '-' + String(mo).padStart(2, '0') + '-' + String(Math.min(d, end)).padStart(2, '0')));
    }
  } else if (rule.every === 'weeks') {
    const step = 7 * rule.n;
    let d = dayNum(rule.from);
    d -= Math.floor((d - first) / step) * step;
    for (; d <= last; d += step) out.push(d);
  } else throw new Error('no due dates for ' + rule.every);
  return out;
}
function paysInYearRules(rules, year) {
  const list = rules.slice().sort((a, b) => (a.from < b.from ? -1 : 1));
  let count = 0;
  list.forEach((r, i) => {
    const from = i === 0 ? -Infinity : dayNum(r.from), until = list[i + 1] ? dayNum(list[i + 1].from) : Infinity;
    count += dueDatesIn(r.rule, year).filter(d => d >= from && d < until).length;
  });
  return count;
}

// [O6] The home currency is dated: `home.curs: [ { from, cur } ]`. On a day, the latest entry dated on or
// before it. A change of home currency starts a new entry; history stays in its own currency.
function homeCurOn(curs, date) {
  let c = null;
  for (const h of curs.slice().sort((a, b) => (a.from < b.from ? -1 : 1))) if (h.from <= date) c = h.cur;
  return c === null ? curs[0].cur : c;
}

// [O, H9] The move's currency question, read from the raw stored 38.31 text (`frozen3831`). 38.28's clean-up
// writes ₱ and preset `legacy` into any copy with no currency, so ₱ with preset `legacy` (or with no preset)
// is asked, as is a copy with no `ui.cur` at all; "$" and "¥" are always asked [H9]. ₱ and € with a recorded
// choice are pesos and euros.
const SYMBOLS = { '₱': 'PHP', '€': 'EUR' };
function moveCurrency({ ui }) {
  const c = (ui || {}).cur, preset = (ui || {}).preset;
  if (typeof c !== 'string' || !c) return { cur: null, ask: true };
  if (DECIMALS[c] !== undefined) return { cur: c, ask: false };
  if (!SYMBOLS[c]) return { cur: null, ask: true };   // "$", "¥", anything unknown
  if (c === '₱' && (!preset || preset === 'legacy')) return { cur: null, ask: true };
  return { cur: SYMBOLS[c], ask: false };
}

// [L units q3] A period that crosses 31 Dec uses its start year's count.
function periodCount({ rule, periodFrom }) {
  const year = Number(periodFrom.slice(0, 4));
  return { year, pays: paysInYear(rule, year) };
}

// [H9] A monthly amount over the year's pays: amount x 12 / N, so the year adds up exactly. The leftover
// minor units go to the earliest pays of the year [L units q4].
function perPayList(monthly, pays) {
  const T = monthly * 12, base = Math.floor(T / pays), extra = T - base * pays, list = [];
  for (let k = 1; k <= pays; k++) list.push(base + (k <= extra ? 1 : 0));
  return list;
}
function perPay(monthly, pays) {
  const list = perPayList(monthly, pays), low = Math.min(...list), high = Math.max(...list);
  return { pays, low, high, highCount: high === low ? 0 : list.filter(x => x === high).length, yearTotal: list.reduce((t, x) => t + x, 0) };
}
// [N3] A period gets the amount of the pay that starts it: that pay's place in the list of its own year's
// pays, the year by its unshifted due date [L units q3], the leftover units on the earliest pays [L units q4].
// So a period that starts on 31 Dec with its pay due 1 Jan (moved earlier) gets the next year's first amount
// (N3 replaces M8's start year here). `due` is the pay's unshifted due date, on the schedule's rhythm.
function payNumber(rule, due) {
  const year = Number(due.slice(0, 4)), d = dayNum(due);
  if (rule.every === 'weeks') {
    const step = 7 * rule.n, first = dayNum(year + '-01-01');
    if (((d - dayNum(rule.from)) % step + step) % step) throw new Error(due + ' is not on the rhythm');
    return Math.floor((d - first) / step) + 1;
  }
  if (rule.every === 'month') {
    const days = rule.days.slice().sort((a, b) => a - b), i = days.indexOf(Number(due.slice(8, 10)));
    if (i < 0) throw new Error(due + ' is not a pay day');
    return (Number(due.slice(5, 7)) - 1) * days.length + i + 1;
  }
  throw new Error('no pay number for ' + rule.every);
}
// [P4] A schedule whose rule changes during the year: each rule gets its own months. The monthly amount
// covers the months the rule is in force in that year (the first rule from 1 Jan), spread over that rule's
// pays (its due dates in those months, counted as paysInYearRules does), the leftover minor units on that
// rule's earliest pays [L units q4]. So the year adds up to 12 months. A rule that starts on a day other
// than the 1st [R2]: the month of the change goes to the rule in force on its first day, and the new rule's
// months start the next month; its pays still follow the new rule (every due date from its `from` is one of its
// pays, one in the month of the change included).
function spread(total, pays) {
  const base = Math.floor(total / pays), extra = total - base * pays, list = [];
  for (let k = 1; k <= pays; k++) list.push(base + (k <= extra ? 1 : 0));
  return list;
}
function rulesParts(rules, year, monthly) {
  const list = rules.slice().sort((a, b) => (a.from < b.from ? -1 : 1));
  const first = dayNum(year + '-01-01'), next = dayNum((year + 1) + '-01-01'), parts = [];
  const monthOf = n => { const s = dayStr(n); return Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7)) - 1; };
  // [R2] The first month a rule's amounts cover: the month of its `from` when that is the 1st, else the next one.
  const firstMonth = n => monthOf(n) + (dayStr(n).slice(8) === '01' ? 0 : 1);
  list.forEach((r, i) => {
    const start = Math.max(i === 0 ? -Infinity : dayNum(r.from), first);
    const end = Math.min(list[i + 1] ? dayNum(list[i + 1].from) : Infinity, next);
    if (start >= end) return;
    const months = (end === next ? monthOf(next) : firstMonth(end)) - (start === first ? monthOf(first) : firstMonth(start));
    const dues = dueDatesIn(r.rule, year).filter(d => d >= start && d < end);
    parts.push({ from: dayStr(start), months, total: monthly * months, dues, list: spread(monthly * months, dues.length) });
  });
  return parts;
}
function perPayRules({ rule, year, monthly }) {
  const parts = rulesParts(rule.rules, year, monthly).map(p => {
    const low = Math.min(...p.list), high = Math.max(...p.list);
    return { from: p.from, months: p.months, pays: p.dues.length, total: p.total, low, high, highCount: high === low ? 0 : p.list.filter(x => x === high).length };
  });
  return { parts, yearTotal: parts.reduce((t, p) => t + p.total, 0) };
}
function periodPerPay({ rule, due, monthly }) {
  if (rule.rules) {   // [P4] the pay's place among its own rule's pays
    const year = Number(due.slice(0, 4)), d = dayNum(due);
    const part = rulesParts(rule.rules, year, monthly).find(p => p.dues.includes(d));
    if (!part) throw new Error(due + ' is not a pay day');
    const pay = part.dues.indexOf(d) + 1;
    return { year, from: part.from, pays: part.dues.length, pay, amount: part.list[pay - 1] };
  }
  const year = Number(due.slice(0, 4)), pays = paysInYear(rule, year), pay = payNumber(rule, due);
  return { year, pays, pay, amount: perPayList(monthly, pays)[pay - 1] };
}

// [B8] What one pay period gets by `per`. payKind is the period stream's rule: 'month', 'weeks', 'none'.
function periodAmount({ per, amount, payKind, periodDays }) {
  if (payKind === 'none') {
    if (per === 'pay') return amount;   // [L units q7] each money-in event
    throw new Error('no fixed pay: by_day_dates for per month, week_by_day for per week');
  }
  if (per === 'pay') return amount;
  if (per === 'month' && payKind === 'month') return amount;   // a monthly rule with one day (twice a month uses per_pay with 24)
  if (per === 'week') return Math.floor(amount * periodDays / 7);   // [L units q6] rounded down per period, a rate
  throw new Error('per month with pay that is not monthly: per_pay with the year\'s count');
}

// [B4] No fixed pay: the monthly amount x 12 / 365 a day, the total rounded down. Kept for whole-day sums
// with no dates; by_day_dates is the rule [L units q7].
function byDay(monthly, days) { return Math.floor(monthly * 12 * days / 365); }
// [L units q7] No fixed pay, over dated days: a year of 365 or 366 days; each day gets monthly x 12 / days
// in the year, rounded down; the month's last day also gets the remainder, so the month comes to its share
// (monthly x 12 x days in the month / days in the year, rounded down). Nothing carries to the next month [M10].
function byDayDates({ monthly, from, to }) {
  const T = monthly * 12, lastDays = {};
  let total = 0, daily = null;
  for (let n = dayNum(from); n <= dayNum(to); n++) {
    const s = dayStr(n), y = Number(s.slice(0, 4)), mo = Number(s.slice(5, 7));
    const yearDays = dayNum((y + 1) + '-01-01') - dayNum(y + '-01-01');
    const day = Math.floor(T / yearDays);
    if (daily === null) daily = day;
    const next = dayStr(n + 1);
    let amount = day;
    if (Number(next.slice(5, 7)) !== mo) {   // the month's last day
      const monthDays = Number(s.slice(8, 10));
      amount = Math.floor(T * monthDays / yearDays) - day * (monthDays - 1);
      lastDays[s] = amount;
    }
    total += amount;
  }
  return { total, days: dayNum(to) - dayNum(from) + 1, daily, lastDays };
}

// [M9] No fixed pay, `per: week`: a seventh of the week's amount each day, rounded down, and the remainder on
// the week's last day. weekByDay gives the two amounts; weekByDayDates puts them on dates.
function weekByDay(weekly) {
  const daily = Math.floor(weekly / 7);
  return { daily, lastDay: weekly - daily * 6 };
}
// [N4] A week ends on the seventh day counted from when the line started (the line's start is day 1), not on
// a Sunday or a Saturday. Days before the line started are not asked.
function weekByDayDates({ weekly, lineFrom, from, to }) {
  const { daily, lastDay } = weekByDay(weekly), start = dayNum(lineFrom), lastDays = {};
  if (dayNum(from) < start) throw new Error('from ' + from + ' is before the line started');
  let total = 0;
  for (let n = dayNum(from); n <= dayNum(to); n++) {
    const last = (n - start) % 7 === 6;
    if (last) lastDays[dayStr(n)] = lastDay;
    total += last ? lastDay : daily;
  }
  return { total, days: dayNum(to) - dayNum(from) + 1, daily, lastDays };
}

// [B8, T1] A one-period override (`plan.budgets[].once`) is keyed by the occurrence of the pay that starts the
// period (`pay@2027-01-10`), never by the period's start day, which is not known until the pay lands.
// [AE1, AH3] Each key is a keyed override `{ amount, at, by, gone }`: a removed key (`gone`) is not read.
function periodAmountOnce({ amount, once, period }) {
  const k = once ? once[period] : undefined;
  if (k === undefined || k === null) return amount;
  if (typeof k !== 'object' || typeof k.amount !== 'number') throw new Error(`once[${period}] is not in the keyed override shape { amount, at, by, gone } [AE1, AH3]`);
  return k.gone ? amount : k.amount;
}

// [X watch: the stale 11.1 row] A 38.31 one-month amount (`once[ym]`) goes to the first period starting in that month:
// `once` is keyed by the occurrence of the pay that starts it [T1], the first pay landing in that month. [Z5] When no
// period starts in that month, it goes to the period holding that month's first day: the latest pay landing on or before it.
function onceFromMonth({ ym, pays }) {
  const byLand = (pays || []).slice().sort((x, y) => (x.lands < y.lands ? -1 : x.lands > y.lands ? 1 : 0));
  const first = byLand.filter(p => String(p.lands).slice(0, 7) === ym)[0];
  if (first) return first.occ;
  const holding = byLand.filter(p => String(p.lands) <= ym + '-01').pop();
  return holding ? holding.occ : null;
}

// [AB2] A one-month amount replaces that month's total: spread over the periods starting in that month (by landing),
// the leftover minor units to the earliest, as the units rule does with a year's pays [L units q4]. With no period
// starting in it, the period holding its first day takes the whole amount [Z5]. Returns { occurrence: amount }.
function onceSpread({ ym, a, pays }) {
  const byLand = (pays || []).slice().sort((x, y) => (x.lands < y.lands ? -1 : x.lands > y.lands ? 1 : 0));
  let list = byLand.filter(p => String(p.lands).slice(0, 7) === ym).map(p => p.occ);
  if (!list.length) { const k = onceFromMonth({ ym, pays }); list = k ? [k] : []; }
  const out = {};
  if (!list.length) return out;
  const base = Math.floor(a / list.length), extra = a - base * list.length;
  list.forEach((occ, i) => { out[occ] = base + (i < extra ? 1 : 0); });
  return out;
}

function ask(question, input) {
  switch (question) {
    case 'once_spread': return onceSpread(input);
    case 'period_amount_once': return periodAmountOnce(input);
    case 'once_from_month': return onceFromMonth(input);
    case 'to_minor': return toMinor(input.text, input.cur);
    case 'currency_for': return currencyFor(input);
    case 'load_amount': return loadAmount(input.a);
    case 'interest': return interest(input.balance, input.apr);
    case 'pays_in_year': return paysInYear(input.rule, input.year);
    case 'period_count': return periodCount(input);
    case 'period_per_pay': return periodPerPay(input);
    case 'week_by_day': return weekByDay(input.weekly);
    case 'week_by_day_dates': return weekByDayDates(input);
    case 'per_pay': return perPay(input.monthly, input.pays);
    case 'per_pay_list': return perPayList(input.monthly, input.pays);
    case 'per_pay_rules': return perPayRules(input);
    case 'period_amount': return periodAmount(input);
    case 'by_day': return byDay(input.monthly, input.days);
    case 'by_day_dates': return byDayDates(input);
    case 'home_cur_on': return homeCurOn(input.curs, input.date);
    case 'move_currency': return moveCurrency(input);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, onceFromMonth, onceSpread, periodAmountOnce, perPayRules, homeCurOn, moveCurrency, paysInYearRules, DECIMALS, toMinor, currencyFor, loadAmount, interest, paysInYear, periodCount, perPayList, perPay, payNumber, periodPerPay, periodAmount, weekByDay, weekByDayDates, byDay, byDayDates };
