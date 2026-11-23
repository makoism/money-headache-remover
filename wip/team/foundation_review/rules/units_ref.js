// Units (SCHEMA_V3 0, 3 and 8; DECISIONS_ROUND2 B4, B8, H9, I2).
// A plain reference for the engine lane, checked by run_rules.js against rules/units.json.
// Open points name their question in units.json.
'use strict';
const { dayNum } = require('./dates');

// The currency table: decimals per ISO code. units-q1: a short ISO 4217 list.
const DECIMALS = { JPY: 0, KRW: 0, VND: 0, PHP: 2, USD: 2, EUR: 2, GBP: 2, CHF: 2, CAD: 2, AUD: 2, SGD: 2, KWD: 3, BHD: 3 };

// A typed amount (text with a point for decimals) as whole minor units. Read as digits, never through a
// decimal number. An unknown code is 2 decimals and the screen asks once (section 0).
function toMinor(text, cur) {
  const known = DECIMALS[cur] !== undefined, d = known ? DECIMALS[cur] : 2;
  const m = /^(-?)(\d+)(?:\.(\d*))?$/.exec(String(text).trim());
  if (!m) throw new Error('not an amount: ' + text);
  const frac = m[3] || '';
  if (frac.length > d) throw new Error(`${text} has more decimals than ${cur} has`);   // units-q2: refused
  const n = Number(m[2]) * Math.pow(10, d) + Number((frac + '0'.repeat(d)).slice(0, d) || 0);
  return { minor: m[1] ? -n : n, decimals: d, ask: !known };
}

// The code from what was given: a code is used; "$", "¥" and nothing at all are asked, never guessed [H9].
function currencyFor({ code } = {}) {
  if (code && DECIMALS[code] !== undefined) return { cur: code, ask: false };
  if (code) return { cur: code, ask: true };   // an unknown code: kept, asked once
  return { cur: null, ask: true };
}

// [I2] One month's interest: balance x yearly rate (percent) / 12, half up to the minor unit, in whole numbers.
// Nothing on a balance at or below zero (a credit).
function interest(balance, apr) {
  if (!apr || balance <= 0) return 0;
  const k = BigInt(Math.round(apr * 10000)), den = 1200n * 10000n;
  return Number((2n * BigInt(balance) * k + den) / (2n * den));
}

// [H9] The real number of pays a schedule has in a calendar year. units-q3: by the due date before any move.
// units-q5: an every-N-weeks rule is counted over the whole year by its rhythm, back from its first date.
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

// [H9] A monthly amount over the year's pays: amount x 12 / N, spread so the year adds up exactly.
// units-q4: pay k gets floor(T x k / N) - floor(T x (k - 1) / N).
function perPayList(monthly, pays) {
  const T = monthly * 12, list = [];
  for (let k = 1; k <= pays; k++) list.push(Math.floor(T * k / pays) - Math.floor(T * (k - 1) / pays));
  return list;
}
function perPay(monthly, pays) {
  const list = perPayList(monthly, pays), low = Math.min(...list), high = Math.max(...list);
  return { pays, low, high, highCount: high === low ? 0 : list.filter(x => x === high).length, yearTotal: list.reduce((t, x) => t + x, 0) };
}

// [B8] What one pay period gets by `per`. payKind is the period stream's rule: 'month', 'weeks', 'none'.
function periodAmount({ per, amount, payKind, periodDays }) {
  if (payKind === 'none') throw new Error('no fixed pay: by_day');
  if (per === 'pay') return amount;
  if (per === 'month' && payKind === 'month') return amount;   // a monthly rule with one day (twice a month uses per_pay with 24)
  if (per === 'week') return Math.round(amount * periodDays / 7);   // units-q6: half up, nothing carried
  throw new Error('per month with pay that is not monthly: per_pay with the year\'s count');
}

// [B4] No fixed pay: the monthly amount x 12 / 365 a day. units-q7: the total rounded down once.
function byDay(monthly, days) { return Math.floor(monthly * 12 * days / 365); }

function ask(question, input) {
  switch (question) {
    case 'to_minor': return toMinor(input.text, input.cur);
    case 'currency_for': return currencyFor(input);
    case 'interest': return interest(input.balance, input.apr);
    case 'pays_in_year': return paysInYear(input.rule, input.year);
    case 'per_pay': return perPay(input.monthly, input.pays);
    case 'period_amount': return periodAmount(input);
    case 'by_day': return byDay(input.monthly, input.days);
  }
  throw new Error('unknown question ' + question);
}

module.exports = { ask, DECIMALS, toMinor, currencyFor, interest, paysInYear, perPayList, perPay, periodAmount, byDay };
