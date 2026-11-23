'use strict';
// Runs oracle_v2 against the hand-worked asks in foundation_review/scenarios/ (worked by
// hand from the written rules, never by the reference model). Files that use something the
// checker does not cover are refused and counted, never guessed.
// node wip/team/checker/self_test.js [file.json ...] [-v]
const fs = require('fs');
const path = require('path');
const { oracle, Refused } = require('./oracle_v2.js');

const dir = path.join(__dirname, '..', 'foundation_review', 'scenarios');
const args = process.argv.slice(2);
const verbose = args.includes('-v');
const files = args.filter((a) => a.endsWith('.json'));
const list = files.length ? files : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

const Q = ['bank_today', 'safe_to_spend', 'headline', 'days_to_next_pay', 'due_before_next_pay', 'card_due', 'total'];

function pick(r, a) {
  switch (a.question) {
    case 'bank_today': return r.accounts[a.account] && r.accounts[a.account].bank;
    case 'safe_to_spend': return r.accounts[a.account] && r.accounts[a.account].headroom;
    case 'headline': return r.headline;
    case 'days_to_next_pay': return r.daysToNextPay;
    case 'due_before_next_pay': return r.dueBeforeNextPay;
    case 'card_due': return r.cards[a.account];
    case 'total': return r.total;
  }
}
function same(exp, got) {
  if (exp === null || typeof exp !== 'object') return Number(exp) === Number(got) || exp === got;
  if (!got || typeof got !== 'object') return false;
  if (Array.isArray(exp)) return Array.isArray(got) && exp.length === got.length && exp.every((x, i) => same(x, got[i]));
  return Object.keys(exp).every((k) => same(exp[k], got[k]));
}

let pass = 0, fail = 0, refusedAsks = 0;
const refusedFiles = {};
for (const f of list) {
  const sc = JSON.parse(fs.readFileSync(path.join(dir, path.basename(f)), 'utf8'));
  for (const a of sc.asks || []) {
    if (!Q.includes(a.question)) continue;
    if (a.at === 'start of day') { refusedAsks += 1; continue; }
    let r;
    try { r = oracle(sc, a.date); } catch (e) {
      if (e instanceof Refused) { refusedAsks += 1; refusedFiles[f] = e.message; continue; }
      throw new Error(f + ' ' + a.id + ': ' + e.stack);
    }
    let got = pick(r, a);
    if (a.question === 'due_before_next_pay' && got) {
      // the order of items landing on one day is not a money rule: line them up as expected
      const order = (a.expected.items || []).map((x) => x.item);
      got = Object.assign({}, got, { items: got.items.slice().sort((x, y) => x.lands.localeCompare(y.lands) || order.indexOf(x.item) - order.indexOf(y.item)) });
    }
    if (same(a.expected, got)) { pass += 1; if (verbose) console.log('ok  ', f, a.id); }
    else {
      fail += 1;
      console.log('FAIL', f, a.id, a.question, a.account || '', '\n  expected', JSON.stringify(a.expected), '\n  got     ', JSON.stringify(got), '\n  why     ', typeof a.why === 'string' ? a.why.slice(0, 300) : '');
    }
  }
}
if (verbose) for (const [f, m] of Object.entries(refusedFiles)) console.log('refused', f, m);
console.log(`self test: ${pass} pass, ${fail} fail, ${refusedAsks} asks refused (outside what the checker covers)`);
process.exit(fail ? 1 : 0);
