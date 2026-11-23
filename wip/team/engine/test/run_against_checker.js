#!/usr/bin/env node
// Runs the engine against the independent checker (checker/oracle_v2.js, written from the written rules) on the
// checker's seeded lives (checker/life_gen.js), the same figures its fuzz_vs_ref.js compares: bank today and safe to
// spend per account, the headline, days to next pay, due before next pay, each card's next payment and the total.
// Each life is turned into the saved shape version 3 the same way as the scenario files (scenario_to_book.js).
// The checker is not part of this branch: point at a folder holding it, for example one made with
//   git archive origin/lane/checker-b wip/team/checker | tar -x -C <folder>
// Usage: node run_against_checker.js --checker <folder>/wip/team/checker [--seeds 2000] [--from 1] [--seed N] [-v] [--out f.json]
// Any difference fails the run; the last line never says all agree when one does not (LESSONS lesson 2).
'use strict';
const fs = require('fs');
const path = require('path');
const { convert } = require('./scenario_to_book.js');
const { lookahead } = require('../lookahead.js');
const U = require('../units.js');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const dir = path.resolve(arg('--checker', path.join(__dirname, '..', '..', 'checker')));
if (!fs.existsSync(path.join(dir, 'oracle_v2.js'))) {
  console.error(`No checker at ${dir}. Bring it into a folder outside the branch and pass --checker <folder>/wip/team/checker.`);
  process.exit(2);
}
const { genLife } = require(path.join(dir, 'life_gen.js'));
const { oracle, Refused } = require(path.join(dir, 'oracle_v2.js'));
const N = Number(arg('--seeds', 2000)), FROM = Number(arg('--from', 1)), ONE = arg('--seed', null);
const outFile = arg('--out', null), verbose = argv.includes('-v');
const near = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-6 : a === b);

function compare(sc, day) {
  const diffs = [];
  let o, r;
  try { o = oracle(sc, day, { units: 'written' }); } catch (e) {
    if (e instanceof Refused) return { refused: e.message };
    return { diffs: [{ field: 'checker threw', mine: null, checker: e.message }] };
  }
  try { const c = convert(sc); r = lookahead(c.book, day, c.opts); } catch (e) { return { diffs: [{ field: 'engine threw', engine: String(e.message).split('\n')[0] }] }; }
  // the engine gives whole minor units; the checker the file's own units
  const M = (x, cur) => (typeof x === 'number' ? Number((x / Math.pow(10, U.decimals(cur || sc.currency))).toFixed(4)) : x);
  for (const id of Object.keys(o.accounts)) {
    const ra = r.accounts && r.accounts[id];
    if (!ra) { diffs.push({ field: 'account missing', account: id }); continue; }
    if (!near(o.accounts[id].bank, M(ra.bank))) diffs.push({ field: 'bank_today', account: id, checker: o.accounts[id].bank, engine: M(ra.bank) });
    if (!near(o.accounts[id].headroom, M(ra.headroom))) diffs.push({ field: 'safe_to_spend', account: id, checker: o.accounts[id].headroom, engine: M(ra.headroom), checkerLowest: o.accounts[id].lowestDay, engineLowest: ra.lowestDay, engineWhy: ra.why });
  }
  if (!near(o.headline, M(r.safeToSpend.headline))) diffs.push({ field: 'headline', checker: o.headline, engine: M(r.safeToSpend.headline), checkerFree: o.freeLeft });
  const od = o.daysToNextPay || {}, rd = r.daysToNextPay || {};
  if (od.days !== rd.days || od.next_pay !== rd.next_pay || od.item !== rd.item || !!od.late !== !!rd.late) diffs.push({ field: 'days_to_next_pay', checker: od, engine: { days: rd.days, next_pay: rd.next_pay, item: rd.item, late: rd.late } });
  const key = x => x.item + ' ' + x.lands + ' ' + Number(x.amount).toFixed(2);
  const om = o.dueBeforeNextPay.items.map(key).sort(), rm = (r.dueBeforeNextPay.items || []).map(x => key(Object.assign({}, x, { amount: M(x.amount) }))).sort();
  if (om.join('|') !== rm.join('|') || !near(o.dueBeforeNextPay.total, M(r.dueBeforeNextPay.total)))
    diffs.push({ field: 'due_before_next_pay', onlyChecker: om.filter(x => !rm.includes(x)), onlyEngine: rm.filter(x => !om.includes(x)), checkerTotal: o.dueBeforeNextPay.total, engineTotal: M(r.dueBeforeNextPay.total) });
  for (const cid of Object.keys(o.cards)) {
    const mc = o.cards[cid], rc0 = ((r.cards || {})[cid] || {}).next || {}, rc = Object.assign({}, rc0, { amount: M(rc0.amount) });
    const f = ['amount', 'payment_date', 'statement', 'closed_on', 'closes_on'];
    if (f.some(k => !near(mc[k], rc[k]))) diffs.push({ field: 'card_due', account: cid, checker: mc, engine: f.reduce((a, k) => ((a[k] = rc[k]), a), {}) });
  }
  if (!near(o.total, M(r.total.amount))) diffs.push({ field: 'total', checker: o.total, engine: M(r.total.amount) });
  return { diffs };
}

const seeds = ONE ? [Number(ONE)] : Array.from({ length: N }, (_, i) => FROM + i);
let agree = 0, differ = 0, refused = 0, asks = 0;
const byField = {}, report = [];
for (const seed of seeds) {
  const sc = genLife(seed);
  const seedDiffs = [];
  for (const day of sc.askDays) {
    const res = compare(sc, day);
    if (res.refused) { refused++; continue; }
    asks++;
    for (const d of res.diffs) { d.day = day; seedDiffs.push(d); byField[d.field] = (byField[d.field] || 0) + 1; }
  }
  if (seedDiffs.length) {
    differ++;
    report.push({ seed, diffs: seedDiffs });
    if (verbose || ONE) for (const d of seedDiffs) console.log('seed', seed, JSON.stringify(d));
  } else agree++;
}
if (outFile) fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(`engine against the checker: ${seeds.length} seeds, ${asks} asks (${refused} refused by the checker)`);
console.log(`seeds that agree on every ask: ${agree}; seeds with a difference: ${differ}`);
console.log('differences by figure:', JSON.stringify(byField));
console.log(differ ? 'NOT ALL SEEDS AGREE' : 'ALL SEEDS AGREE');
process.exit(differ ? 1 : 0);
