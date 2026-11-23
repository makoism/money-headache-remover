// Units (SCHEMA_V3 0, 3 and 8; DECISIONS_ROUND2 B4, B8, H9, I2, L).
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
// [L units q3] A period that crosses 31 Dec uses its start year's count. units-q10.
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

// [B8] What one pay period gets by `per`. payKind is the period stream's rule: 'month', 'weeks', 'none'.
function periodAmount({ per, amount, payKind, periodDays }) {
  if (payKind === 'none') {
    if (per === 'pay') return amount;   // [L units q7] each money-in event
    throw new Error('no fixed pay: by_day_dates (units-q11 for per week)');
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
// (monthly x 12 x days in the month / days in the year, rounded down: units-q12).
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

function ask(question, input) {
  switch (question) {
    case 'to_minor': return toMinor(input.text, input.cur);
    case 'currency_for': return currencyFor(input);
    case 'load_amount': return loadAmount(input.a);
    case 'interest': return interest(input.balance, input.apr);
    case 'pays_in_year': return paysInYear(input.rule, input.year);
    case 'period_count': return periodCount(input);
    case 'per_pay': return perPay(input.monthly, input.pays);
    case 'per_pay_list': return perPayList(input.monthly, input.pays);
    case 'period_amount': return periodAmount(input);
    case 'by_day': return byDay(input.monthly, input.days);
    case 'by_day_dates': return byDayDates(input);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, DECIMALS, toMinor, currencyFor, loadAmount, interest, paysInYear, periodCount, perPayList, perPay, periodAmount, byDay, byDayDates };
