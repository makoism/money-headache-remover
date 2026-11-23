'use strict';
// Seeded random lives, each asked on several days, worked out by the independent checker
// (oracle_v2.js, written from the written rules) and by the reference model
// (foundation_review/ref/lookahead_ref.js). Every difference is printed; nothing is
// summed up as "all good" while one is left [LESSONS lesson 2].
//
// node wip/team/checker/fuzz_vs_ref.js [--seeds 2000] [--from 1] [--seed N] [--units plain] [--out file.json] [-v]
const fs = require('fs');
const path = require('path');
const { genLife } = require('./life_gen.js');
const { oracle, Refused } = require('./oracle_v2.js');
const { lookahead } = require('../foundation_review/ref/lookahead_ref.js');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const N = Number(arg('--seeds', 2000));
const FROM = Number(arg('--from', 1));
const ONE = arg('--seed', null);
const units = arg('--units', 'written');
// --as-ref units,placeFloor,currentMonthly,plannedToday,plannedLate,creditWaits,openingLanding,carryOneStep: let the checker copy the reference's reading on
// those points, so the differences that are left belong to the other classes (DIFFERENCES.md).
const asRef = (arg('--as-ref', '') || '').split(',').filter(Boolean);
const OPTS = { units };
if (asRef.includes('placeFloor')) OPTS.placeFloor = false;
if (asRef.includes('currentMonthly')) OPTS.currentMonthly = true;
if (asRef.includes('plannedToday')) OPTS.plannedToday = false;
if (asRef.includes('plannedLate')) OPTS.plannedLate = false;
if (asRef.includes('creditWaits')) OPTS.creditWaits = true;
if (asRef.includes('openingLanding')) OPTS.openingLanding = true;
if (asRef.includes('carryOneStep')) OPTS.carryOneStep = true;
if (asRef.includes('units')) OPTS.units = 'plain';
const outFile = arg('--out', null);
const verbose = argv.includes('-v');

const near = (a, b) => typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-6 : a === b;

function compare(sc, day) {
  const diffs = [];
  let o, r;
  try { o = oracle(sc, day, OPTS); } catch (e) {
    if (e instanceof Refused) return { refused: e.message };
    return { diffs: [{ field: 'checker threw', mine: e.message, ref: null }] };
  }
  try { r = lookahead(sc, day); } catch (e) { return { diffs: [{ field: 'reference threw', mine: null, ref: String(e.message).split('\n')[0] }] }; }
  // the reference gives whole minor units; the checker gives the file's own units
  const dec = sc.currency === 'JPY' ? 0 : 2;
  const U = (x) => (typeof x === 'number' ? Number((x / Math.pow(10, dec)).toFixed(dec)) : x);
  for (const id of Object.keys(o.accounts)) {
    const ra = r.accounts && r.accounts[id];
    if (!ra) { diffs.push({ field: 'account missing', account: id }); continue; }
    if (!near(o.accounts[id].bank, U(ra.bank))) diffs.push({ field: 'bank_today', account: id, mine: o.accounts[id].bank, ref: U(ra.bank) });
    if (!near(o.accounts[id].headroom, U(ra.headroom))) diffs.push({ field: 'safe_to_spend', account: id, mine: o.accounts[id].headroom, ref: U(ra.headroom), mineLowest: o.accounts[id].lowestDay, refLowest: ra.lowestDay });
  }
  if (!near(o.headline, U(r.safeToSpend.headline))) diffs.push({ field: 'headline', mine: o.headline, ref: U(r.safeToSpend.headline), mineFree: o.freeLeft });
  const od = o.daysToNextPay || {}, rd = r.daysToNextPay || {};
  if (od.days !== rd.days || od.next_pay !== rd.next_pay || od.item !== rd.item || !!od.late !== !!rd.late) diffs.push({ field: 'days_to_next_pay', mine: od, ref: { days: rd.days, next_pay: rd.next_pay, item: rd.item, late: rd.late } });
  const key = (x) => x.item + ' ' + x.lands + ' ' + Number(x.amount).toFixed(2);
  const om = o.dueBeforeNextPay.items.map(key).sort(), rm = (r.dueBeforeNextPay.items || []).map((x) => key(Object.assign({}, x, { amount: U(x.amount) }))).sort();
  if (om.join('|') !== rm.join('|') || !near(o.dueBeforeNextPay.total, U(r.dueBeforeNextPay.total))) {
    diffs.push({ field: 'due_before_next_pay', onlyMine: om.filter((x) => !rm.includes(x)), onlyRef: rm.filter((x) => !om.includes(x)), mineTotal: o.dueBeforeNextPay.total, refTotal: U(r.dueBeforeNextPay.total) });
  }
  for (const cid of Object.keys(o.cards)) {
    const mc = o.cards[cid], rc0 = (r.cards[cid] || {}).next || {}, rc = Object.assign({}, rc0, { amount: U(rc0.amount) });
    const f = ['amount', 'payment_date', 'statement', 'closed_on', 'closes_on'];
    if (f.some((k) => !near(mc[k], rc[k]))) diffs.push({ field: 'card_due', account: cid, mine: mc, ref: f.reduce((a, k) => ((a[k] = rc[k]), a), {}) });
  }
  if (!near(o.total, U(r.total.amount))) diffs.push({ field: 'total', mine: o.total, ref: U(r.total.amount) });
  return { diffs };
}

const seeds = ONE ? [Number(ONE)] : Array.from({ length: N }, (_, i) => FROM + i);
let agreeSeeds = 0, diffSeeds = 0, refusedAsks = 0, asks = 0;
const byField = {};
const report = [];
for (const seed of seeds) {
  const sc = genLife(seed);
  let seedDiffs = [];
  for (const day of sc.askDays) {
    const res = compare(sc, day);
    if (res.refused) { refusedAsks += 1; continue; }
    asks += 1;
    for (const d of res.diffs) { d.day = day; seedDiffs.push(d); byField[d.field] = (byField[d.field] || 0) + 1; }
  }
  if (seedDiffs.length) {
    diffSeeds += 1;
    report.push({ seed, diffs: seedDiffs });
    if (verbose || ONE) for (const d of seedDiffs) console.log('seed', seed, JSON.stringify(d));
  } else agreeSeeds += 1;
}
if (outFile) fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(`fuzz (${OPTS.units} units${asRef.length ? ', as the reference on ' + asRef.join(', ') : ''}): ${seeds.length} seeds, ${asks} asks (${refusedAsks} refused by the checker)`);
console.log(`seeds that agree on every ask: ${agreeSeeds}; seeds with a difference: ${diffSeeds}`);
console.log('differences by figure:', JSON.stringify(byField));
process.exit(diffSeeds ? 1 : 0);
