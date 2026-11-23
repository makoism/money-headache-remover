#!/usr/bin/env node
// Checks the scenario specs in this folder: each file's shape, and that every
// "why" sum adds up to its expected figure. It does not run any engine.
// Usage: node check_specs.js [file.json ...]   (no arguments: every .json here)
'use strict';
const fs = require('fs');
const path = require('path');

const DIGITS = { JPY: 0, PHP: 2, USD: 2, EUR: 2 };
const KINDS = ['bank', 'cash', 'ewallet', 'card', 'loan', 'paylater'];
const EVENT_KINDS = ['pay_in', 'money_in', 'spend', 'refund', 'bill_paid', 'card_payment', 'transfer', 'convert', 'set_aside', 'check', 'card_check', 'skip', 'repay', 'borrow'];   // borrow: cash taken on a card [O5]
const QUESTIONS = ['bank_today', 'safe_to_spend', 'days_to_next_pay', 'due_before_next_pay', 'not_seen_yet', 'card_due', 'total', 'not_explained',
  'check_in_list', 'may_still_post', 'owed_now', 'headline', 'place', 'warnings', 'total_after_cards'];
const WE_RULES = ['move earlier', 'move later', 'none'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TOLD = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;   // a date, or a date and a time [H1]

let errors = 0;
function bad(file, where, msg) { errors++; console.log(`FAIL ${file} ${where}: ${msg}`); }

function isDate(s) { return typeof s === 'string' && DATE.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
function dayNum(s) { return Math.round(Date.parse(s + 'T00:00:00Z') / 86400000); }

// Turn "1,234.50" into whole minor units for a currency with `d` decimals.
function toMinor(txt, d) {
  const clean = txt.replace(/,/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) return NaN;
  if (parts[1] !== undefined && parts[1].length > d) return NaN;
  const frac = (parts[1] || '').padEnd(d, '0');
  return Number(parts[0]) * Math.pow(10, d) + (d ? Number(frac) : 0);
}
function numMinor(n, d) { return Math.round(n * Math.pow(10, d)); }
function decimalsOk(n, d) { return Math.abs(n * Math.pow(10, d) - Math.round(n * Math.pow(10, d))) < 1e-6; }

function stripParens(s) {
  let out = '', depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out;
}

// Evaluates one "why" string. Returns { lhs, rhs } in minor units (or days), or { error }.
function evalWhy(why, d) {
  if (typeof why !== 'string') return { error: 'why is not a string' };
  const plain = stripParens(why);
  const eq = plain.lastIndexOf('=');
  if (eq < 0) return { error: 'no "=" in why' };
  const left = plain.slice(0, eq).trim();
  const right = plain.slice(eq + 1).trim();
  // Date difference: "2026-12-10 - 2026-11-20 = 20"
  const dm = left.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/);
  if (dm) {
    if (!/^\d+$/.test(right)) return { error: `right side "${right}" is not a whole number of days` };
    return { lhs: dayNum(dm[1]) - dayNum(dm[2]), rhs: Number(right), days: true };
  }
  if (/^none$/i.test(left)) {
    const r = toMinor(right, d);
    return isNaN(r) ? { error: `bad right side "${right}"` } : { lhs: 0, rhs: r };
  }
  if (!/^[\s\d,.+-]+$/.test(left)) return { error: `left side has words outside brackets: "${left}"` };
  const tokens = left.replace(/\s+/g, '').match(/[+-]?[\d,.]+/g);
  if (!tokens || tokens.join('') !== left.replace(/\s+/g, '')) return { error: `cannot read left side "${left}"` };
  let sum = 0;
  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    let sign = 1;
    if (t[0] === '-') { sign = -1; t = t.slice(1); } else if (t[0] === '+') t = t.slice(1);
    else if (i > 0) return { error: `missing + or - before "${t}"` };
    if (!/^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(t)) return { error: `bad number "${t}"` };
    const v = toMinor(t, d);
    if (isNaN(v)) return { error: `"${t}" has more decimals than the currency allows` };
    sum += sign * v;
  }
  const neg = right.startsWith('-');
  const r = toMinor(neg ? right.slice(1) : right, d);
  if (isNaN(r) || !/^-?[\d,]+(\.\d+)?$/.test(right)) return { error: `bad right side "${right}"` };
  return { lhs: sum, rhs: neg ? -r : r };
}

function checkSum(file, where, why, expectedMinor, d, isDays) {
  const r = evalWhy(why, d);
  if (r.error) return bad(file, where, r.error + `  [${why}]`);
  if (r.lhs !== r.rhs) bad(file, where, `sum does not add up: left gives ${r.lhs}, right says ${r.rhs}  [${why}]`);
  if (r.rhs !== expectedMinor) bad(file, where, `why ends in ${r.rhs}, expected figure is ${expectedMinor}${isDays ? ' days' : ' (minor units)'}`);
  if (!!r.days !== !!isDays) bad(file, where, isDays ? 'days answer needs a date difference why' : 'money answer has a date difference why');
}

function checkAnswer(file, where, q, expected, why, d, askDate) {
  if (q === 'days_to_next_pay') {
    if (!expected || typeof expected !== 'object' || !('days' in expected)) return bad(file, where, 'expected needs { days, next_pay }');
    if (expected.days === null || expected.late) {
      if (typeof why !== 'string' || why.includes('=')) bad(file, where, 'no next pay or a late pay: why should be words with no sum');
      if (expected.late && (!isDate(expected.next_pay) || dayNum(expected.next_pay) - dayNum(askDate) !== expected.days || expected.days > 0)) bad(file, where, 'a late pay needs next_pay on or before the ask date and days = next_pay minus the ask date');
      return;
    }
    if (!isDate(expected.next_pay)) bad(file, where, 'next_pay is not a date');
    else if (dayNum(expected.next_pay) - dayNum(askDate) !== expected.days) bad(file, where, 'next_pay minus the ask date is not days');
    return checkSum(file, where, why, expected.days, d, true);
  }
  if (q === 'not_seen_yet') {
    if (!expected || !Array.isArray(expected.items)) return bad(file, where, 'expected needs items, money_in, money_out');
    if (!why || typeof why !== 'object') return bad(file, where, 'why must be { money_in, money_out }');
    let inn = 0, out = 0;
    for (const it of expected.items) {
      if (!isDate(it.lands) || typeof it.amount !== 'number' || !['in', 'out'].includes(it.direction)) bad(file, where, `item ${it.item} needs lands, amount, direction in/out`);
      if (isDate(it.lands) && dayNum(it.lands) >= dayNum(askDate)) bad(file, where, `item ${it.item} lands on or after the ask date, so it is not late`);
      if (it.direction === 'in') inn += numMinor(it.amount, d); else out += numMinor(it.amount, d);
    }
    if (inn !== numMinor(expected.money_in, d)) bad(file, where, 'items in do not add to money_in');
    if (out !== numMinor(expected.money_out, d)) bad(file, where, 'items out do not add to money_out');
    checkSum(file, where + ' money_in', why.money_in, numMinor(expected.money_in, d), d);
    checkSum(file, where + ' money_out', why.money_out, numMinor(expected.money_out, d), d);
    return;
  }
  if (q === 'due_before_next_pay') {
    if (!expected || !Array.isArray(expected.items) || typeof expected.total !== 'number') return bad(file, where, 'expected needs items and total');
    let s = 0;
    for (const it of expected.items) {
      if (!isDate(it.lands) || typeof it.amount !== 'number') bad(file, where, `item ${it.item} needs lands and amount`);
      else if (dayNum(it.lands) < dayNum(askDate)) bad(file, where, `item ${it.item} lands before the ask date (that is not seen yet, not due)`);
      s += numMinor(it.amount, d);
    }
    if (s !== numMinor(expected.total, d)) bad(file, where, 'items do not add to total');
    return checkSum(file, where, why, numMinor(expected.total, d), d);
  }
  if (q === 'check_in_list') {
    if (!expected || !Array.isArray(expected.items) || typeof expected.total !== 'number') return bad(file, where, 'expected needs items and total');
    let s = 0;
    for (const it of expected.items) {
      if (!isDate(it.lands) || typeof it.amount !== 'number') bad(file, where, `item ${it.item} needs lands and amount`);
      else if (dayNum(it.lands) > dayNum(askDate)) bad(file, where, `item ${it.item} lands after the ask date (a check-in only lists what has landed)`);
      s += numMinor(it.amount, d);
    }
    if (s !== numMinor(expected.total, d)) bad(file, where, 'items do not add to total');
    return checkSum(file, where, why, numMinor(expected.total, d), d);
  }
  if (q === 'may_still_post') {
    if (!expected || !Array.isArray(expected.items)) return bad(file, where, 'expected needs items');
    for (const it of expected.items) if (!isDate(it.lands) || typeof it.amount !== 'number' || dayNum(it.lands) >= dayNum(askDate)) bad(file, where, `item ${it.item} needs lands before the ask date and an amount`);
    if (typeof why !== 'string') bad(file, where, 'why should be words');
    return;
  }
  if (q === 'warnings') {
    if (!Array.isArray(expected) || expected.some(w => !w.account || !w.code)) return bad(file, where, 'expected is a list of { account, code }');
    if (typeof why !== 'string' || why.includes('=')) bad(file, where, 'why should be words with no sum');
    return;
  }
  if (q === 'place') {
    if (!expected || typeof expected.kept !== 'number' || !isDate(expected.due)) return bad(file, where, 'expected needs kept and due');
    return checkSum(file, where, why, numMinor(expected.kept, d), d);
  }
  if (q === 'card_due') {
    if (!expected || typeof expected.amount !== 'number' || !isDate(expected.payment_date) || !['open', 'closed', 'all owed'].includes(expected.statement)) return bad(file, where, 'expected needs amount, payment_date, statement open/closed/all owed');
    return checkSum(file, where, why, numMinor(expected.amount, d), d);
  }
  if (typeof expected !== 'number') return bad(file, where, 'expected must be a number');
  if (!decimalsOk(expected, d)) bad(file, where, 'expected has more decimals than the currency allows');
  return checkSum(file, where, why, numMinor(expected, d), d);
}

function checkFile(fp) {
  const file = path.basename(fp);
  let s;
  try { s = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return bad(file, 'file', 'not valid JSON: ' + e.message); }
  for (const k of ['life', 'title', 'story', 'currency', 'window', 'holidays', 'accounts', 'income', 'bills', 'goals', 'events', 'asks']) {
    if (!(k in s)) bad(file, 'top', `missing "${k}"`);
  }
  if (!(s.currency in DIGITS)) bad(file, 'currency', `unknown currency ${s.currency}`);
  // [O6] The home currency may change on a date: `home_curs` lists { from, cur }, oldest first, the first from the file's start.
  if (s.home_curs !== undefined) {
    if (!Array.isArray(s.home_curs) || !s.home_curs.length || s.home_curs[0].cur !== s.currency) bad(file, 'home_curs', 'a list of { from, cur }, the first in the file\'s currency [O6]');
    let prev = '';
    for (const h of s.home_curs || []) {
      if (!isDate(h.from) || !(h.cur in DIGITS) || h.from <= prev) bad(file, 'home_curs', 'each entry needs a later from date and a known cur [O6]');
      prev = h.from;
    }
  }
  const homeOn = day => (s.home_curs || []).filter(h => h.from <= day).reduce((c, h) => h.cur, s.currency);
  if (!s.window || !isDate(s.window.from) || !isDate(s.window.to)) bad(file, 'window', 'needs from and to dates');
  for (const h of [...((s.holidays || {}).dates || []), ...((s.holidays || {}).bank_closed || [])]) if (!isDate(h.date)) bad(file, 'holidays', `bad date ${h.date}`);

  const acc = {};
  for (const a of s.accounts || []) {
    const w = `account ${a.id}`;
    if (!a.id || acc[a.id]) bad(file, w, 'missing or repeated id');
    acc[a.id] = a;
    if (!KINDS.includes(a.kind)) bad(file, w, `kind must be one of ${KINDS}`);
    if (!(a.currency in DIGITS)) bad(file, w, `unknown currency ${a.currency}`);
    const d = DIGITS[a.currency];
    if (!a.opening || !isDate(a.opening.date)) { bad(file, w, 'opening needs a date'); continue; }
    if (a.apr !== undefined && !(typeof a.apr === 'number' && a.apr >= 0 && ['card', 'loan', 'paylater'].includes(a.kind))) bad(file, w, 'apr is a yearly rate in percent, on a card, loan or pay-later [I2]');
    if (a.opening.told !== undefined && !(TOLD.test(a.opening.told) && a.opening.told.slice(0, 10) === a.opening.date)) bad(file, w, 'opening.told must be the opening date, with or without a time');
    if (a.opening.moved !== undefined && !(a.opening.moved === true && a.opening.told === undefined && s.moved_copy && TOLD.test(s.moved_copy.saved || '') && s.moved_copy.saved.slice(0, 10) >= a.opening.date)) bad(file, w, 'a moved opening with no time of its own needs moved_copy.saved on or after its date, and no told [J2]');
    if (a.kind === 'loan' || a.kind === 'paylater') {
      const p = a.payment || {};
      if (typeof a.opening.owed !== 'number' || !decimalsOk(a.opening.owed, d)) bad(file, w, 'opening.owed must be an amount');
      if (!Number.isInteger(p.day) || !WE_RULES.includes(p.weekend_holiday) || !(s.accounts || []).some(x => x.id === p.from)) bad(file, w, 'payment needs day, weekend_holiday and from (an account)');
      if (typeof p.amount !== 'number' && !p.min_rule) bad(file, w, 'payment needs amount or min_rule');
    } else if (a.kind === 'card') {
      const notSure = a.statement_close_day === null;   // close day "not sure" [H4]
      if (!(Number.isInteger(a.statement_close_day) || a.statement_close_day === 'last' || notSure)) bad(file, w, 'statement_close_day must be a day, "last" or null (not sure)');
      const p = a.payment || {};
      if (!Number.isInteger(p.day) || (!notSure && !Number.isInteger(p.months_after_close)) || !WE_RULES.includes(p.weekend_holiday)) bad(file, w, 'payment needs day, months_after_close (unless the close day is not sure), weekend_holiday');
      if (!p.from || !(p.from in acc) && !(s.accounts || []).some(x => x.id === p.from)) bad(file, w, 'payment.from must be an account');
      const sts = a.opening.statements;   // [J5] several unpaid statements, each with its payment day
      if (sts !== undefined) {
        if (a.opening.statement !== undefined || notSure || !Array.isArray(sts) || !sts.length) bad(file, w, 'opening.statements is a list, instead of opening.statement, on a card with a close day [J5]');
        else {
          let prev = '';
          for (const x of sts) {
            if (!isDate(x.closed) || typeof x.amount !== 'number' || x.paid !== false || !isDate(x.payment_day) || x.payment_day <= x.closed || x.closed > a.opening.date) bad(file, w, 'each of opening.statements needs closed (on or before the opening), amount, paid: false and a payment_day after its close [J5]');
            if (x.closed <= prev) bad(file, w, 'opening.statements must be oldest first');
            prev = x.closed;
          }
        }
      } else {
        const st = a.opening.statement;
        if ((st || !notSure) && (!st || !isDate(st.closed) || typeof st.amount !== 'number' || typeof st.paid !== 'boolean')) bad(file, w, 'opening.statement needs closed, amount, paid (it may be left out only when the close day is not sure)');
      }
      if (a.carries && !(p.min_rule || typeof p.amount === 'number')) bad(file, w, 'a card that carries a balance needs payment.min_rule');
      if (typeof a.opening.current !== 'number' || !decimalsOk(a.opening.current, d)) bad(file, w, 'opening.current must be an amount');
    } else {
      if (typeof a.opening.amount !== 'number' || !decimalsOk(a.opening.amount, d)) bad(file, w, 'opening.amount must be an amount');
      if (typeof a.minimum !== 'number') bad(file, w, 'minimum must be a number');
    }
  }

  const sched = new Set(Object.keys(acc).filter(id => ['card', 'loan', 'paylater'].includes(acc[id].kind)));
  for (const list of ['income', 'bills']) {
    for (const x of s[list] || []) {
      const w = `${list} ${x.id}`;
      if (!x.id || sched.has(x.id)) bad(file, w, 'missing or repeated id');
      sched.add(x.id);
      if (!x.schedule || !x.schedule.frequency) bad(file, w, 'needs a schedule with a frequency');
      for (const c of x.changes || []) if (!isDate(c.from) || !c.schedule || !c.schedule.frequency) bad(file, w, 'each change needs from (a date) and a schedule');
      if (!WE_RULES.includes(x.weekend_holiday)) bad(file, w, `weekend_holiday must be one of ${WE_RULES}`);
      if (!(x.account in acc) && !(list === 'income' && x.account === 'any')) bad(file, w, `account ${x.account} not found`);
      if (list === 'income' && typeof x.starts_period !== 'boolean') bad(file, w, 'starts_period must be true or false');
    }
  }
  const goals = new Set((s.goals || []).map(g => g.id));
  for (const g of s.goals || []) if (!(g.kept_in in acc)) bad(file, `goal ${g.id}`, 'kept_in must be an account');

  let last = '';
  const ids = new Set();
  for (const e of s.events || []) {
    const w = `event ${e.id}`;
    if (!e.id || ids.has(e.id)) bad(file, w, 'missing or repeated id');
    ids.add(e.id);
    // [K3] A moved bank figure with no date of its own (38.31 bankNow with no bankNowAt) is dated to the copy's
    // last saved day; the file leaves its date out and the model dates it.
    const undatedFigure = e.date === undefined && e.moved === true && e.kind === 'check' && e.own_time === undefined && e.told === undefined;
    if (undatedFigure && !(s.moved_copy && TOLD.test(s.moved_copy.saved || ''))) { bad(file, w, 'an undated moved figure needs moved_copy.saved [K3]'); continue; }
    const date = undatedFigure ? s.moved_copy.saved.slice(0, 10) : e.date;
    if (!isDate(date)) { bad(file, w, 'bad date'); continue; }
    if (date < last) bad(file, w, 'events are not in date order');
    last = date;
    if (!EVENT_KINDS.includes(e.kind)) bad(file, w, `kind must be one of ${EVENT_KINDS}`);
    for (const k of ['account', 'from', 'to', 'card']) if (e[k] !== undefined && !(e[k] in acc)) bad(file, w, `${k} ${e[k]} is not an account`);
    if (e.goal !== undefined && !goals.has(e.goal)) bad(file, w, `goal ${e.goal} not found`);
    if (e.settles !== undefined) {
      const m = String(e.settles).match(/^([a-z0-9_]+)@(\d{4}-\d{2}-\d{2})$/);
      if (!m || !sched.has(m[1])) bad(file, w, `settles "${e.settles}" must be <schedule id>@<date>`);
    }
    if ('told' in e && e.told !== null && !(TOLD.test(e.told) && isDate(e.told.slice(0, 10)))) bad(file, w, 'told must be a date, a date and time, or null');
    if (e.posted !== undefined && !isDate(e.posted)) bad(file, w, 'posted must be a date');
    if (e.avail !== undefined && !(e.kind === 'check' && ['available', 'current'].includes(e.avail))) bad(file, w, 'avail is only on a bank check, "available" or "current" [I1]');
    if (e.own_time !== undefined && !(e.moved === true && TOLD.test(e.own_time) && e.own_time.length > 10)) bad(file, w, 'own_time is a date and time, only on a moved record [I5]');
    if (e.moved === true && !(s.moved_copy && TOLD.test(s.moved_copy.saved || '') && s.moved_copy.saved.length > 10)) bad(file, w, 'a moved record needs the top-level moved_copy.saved (a date and time) [I5]');
    const amtAcc = acc[e.account || e.from || e.card];
    const d = amtAcc ? DIGITS[amtAcc.currency] : DIGITS[s.currency];
    if (e.kind === 'skip') {
      if (e.settles === undefined) bad(file, w, 'a skip needs settles');
    } else if ('amount_out' in e || e.kind === 'convert') {
      if (typeof e.amount_out !== 'number' || typeof e.amount_in !== 'number') bad(file, w, 'convert needs amount_out and amount_in');
    } else if (e.kind === 'card_check') {
      if (typeof e.current !== 'number') bad(file, w, 'card_check needs current');
    } else if (typeof e.amount !== 'number' || e.amount < 0 || !decimalsOk(e.amount, d)) bad(file, w, 'amount must be a positive amount in the account currency');
  }

  const askIds = new Set();
  for (const a of s.asks || []) {
    const w = `ask ${a.id}`;
    if (!a.id || askIds.has(a.id)) bad(file, w, 'missing or repeated id');
    askIds.add(a.id);
    if (!isDate(a.date)) { bad(file, w, 'bad date'); continue; }
    if (s.window && (a.date < s.window.from || a.date > s.window.to)) bad(file, w, 'date outside the window');
    if (a.at !== undefined && !['start of day', 'end of day'].includes(a.at)) bad(file, w, 'at must be "start of day" or "end of day"');
    if (!QUESTIONS.includes(a.question)) { bad(file, w, `question must be one of ${QUESTIONS}`); continue; }
    if (['bank_today', 'safe_to_spend', 'card_due', 'not_explained', 'owed_now', 'place'].includes(a.question) && !(a.account in acc)) bad(file, w, 'needs an account');
    if (a.question === 'place' && !goals.has(a.place)) bad(file, w, 'needs a place (a goal id)');
    if (a.from !== undefined && !isDate(a.from)) bad(file, w, 'from must be a date');
    if (a.on !== undefined && !(a.question === 'not_explained' && isDate(a.on) && a.on <= a.date)) bad(file, w, 'on is the day of the check a not_explained ask is about, on or before the ask date [O1]');
    if (a.question === 'card_due' && acc[a.account] && acc[a.account].kind !== 'card') bad(file, w, 'card_due needs a card account');
    const d = DIGITS[(acc[a.account] || {}).currency || homeOn(a.date)];
    checkAnswer(file, w, a.question, a.expected, a.why, d, a.date);
    // An open question (Q7), or a decision (I5) whose earlier reading an alt keeps
    for (const q of a.rule_questions || []) if (!/^[A-Z]\d+$/.test(q)) bad(file, w, `rule question ${q} is not like Q7 or I5`);
    for (const [q, alt] of Object.entries(a.alt || {})) {
      if (!(a.rule_questions || []).includes(q)) bad(file, w, `alt ${q} is not in rule_questions`);
      if (!alt.rule) bad(file, w + ` alt ${q}`, 'needs a rule');
      checkAnswer(file, w + ` alt ${q}`, a.question, alt.expected, alt.why, d, a.date);
    }
  }
  return (s.asks || []).length;
}

const dir = __dirname;
const files = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f));
let asks = 0;
for (const f of files) {
  const before = errors;
  const n = checkFile(f) || 0;
  asks += n;
  console.log(`${errors === before ? 'ok  ' : 'BAD '} ${path.basename(f)}: ${n} asks`);
}
console.log(errors ? `${errors} problem(s)` : `all good: ${files.length} files, ${asks} asks`);
process.exit(errors ? 1 : 0);
