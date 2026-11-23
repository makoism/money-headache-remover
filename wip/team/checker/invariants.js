'use strict';
// Invariant checks over the checker's seeded lives (life_gen.js) [DECISIONS_ROUND2 AZ4]. They need no hand answer: each is
// a thing that must hold whatever the life, read from what a model gives back. Run on the engine (wip/team/engine) and on
// the reference (ref/lookahead_ref.js, frozen as the spec, AX2).
//   1. bank today equals the last check (or the opening) plus what has settled since;
//   2. safe to spend is never more than bank today minus what is due before the next pay, minus the minimum (an account
//      with other money still to come in before the next pay, or whose next pay is due today or late, is not judged:
//      that money is counted in the walk);
//   3. no amount is ever fractional in minor units;
//   4. a period's end is never before today while its pay is late (the engine's `period`; the reference has none).
// Any failure fails the run, and the last line says so [LESSONS lesson 2].
//
// node wip/team/checker/invariants.js [--seeds 2000] [--from 1] [--model engine|ref|both] [-v]
const path = require('path');
const { genLife } = require('./life_gen.js');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const N = Number(arg('--seeds', 2000)), FROM = Number(arg('--from', 1)), which = arg('--model', 'both'), verbose = argv.includes('-v');
const team = path.join(__dirname, '..');

const models = [];
if (which === 'ref' || which === 'both') {
  const { lookahead } = require(path.join(team, 'foundation_review', 'ref', 'lookahead_ref.js'));
  models.push({ name: 'reference', run: (sc, day) => lookahead(sc, day) });
}
if (which === 'engine' || which === 'both') {
  const { convert } = require(path.join(team, 'engine', 'test', 'scenario_to_book.js'));
  const { lookahead } = require(path.join(team, 'engine', 'lookahead.js'));
  models.push({ name: 'engine', run: (sc, day) => { const c = convert(sc); return lookahead(c.book, day, c.opts); } });
}

const dn = s => Math.round(Date.parse(String(s).slice(0, 10) + 'T00:00:00Z') / 86400000);
const decimals = cur => ({ JPY: 0 }[cur] !== undefined ? 0 : 2);

// 1. The bank figure worked out on its own: the latest check of the account known by the day (or the opening), plus every
// money record after it. A record on the check's own day is not judged (H1 orders a day by `told`), so such a pair is skipped.
function delta(e, id) {
  switch (e.kind) {
    case 'spend': case 'bill_paid': return e.account === id ? -e.amount : 0;
    case 'refund': case 'money_in': case 'pay_in': return e.account === id ? e.amount : 0;
    case 'card_payment': return e.from === id ? -e.amount : 0;
    case 'transfer': return (e.to === id ? e.amount : 0) - (e.from === id ? e.amount : 0);
    default: return 0;
  }
}
function bankByHand(sc, id, day) {
  const a = sc.accounts.find(x => x.id === id), T = dn(day);
  const known = (sc.events || []).filter(e => e.told !== null && !e.gone && dn(e.date) <= T && (!e.told || dn(e.told) <= T));
  const checks = known.filter(e => e.kind === 'check' && e.account === id && dn(e.date) > dn(a.opening.date));
  const last = checks.sort((x, y) => dn(x.date) - dn(y.date)).pop();
  const anchorDay = last ? dn(last.date) : dn(a.opening.date);
  let bank = last ? last.amount : a.opening.amount;
  for (const e of known) {
    if (e.kind === 'check') continue;
    const d = delta(e, id);
    if (!d) continue;
    if (dn(e.date) === anchorDay && last) return null;   // same day as the check: H1, not judged here
    if (dn(e.date) > anchorDay) bank += d;
  }
  return Math.round(bank * Math.pow(10, decimals(sc.currency)));
}

// 3. Every amount a model gives back, in minor units: whole numbers only.
function fractions(r) {
  const bad = [];
  const look = (x, where) => { if (typeof x === 'number' && !Number.isInteger(x)) bad.push(where + ' ' + x); };
  for (const [id, a] of Object.entries(r.accounts || {})) for (const k of ['bank', 'lowest', 'headroom', 'minimum']) look(a[k], id + '.' + k);
  look((r.safeToSpend || {}).headline, 'headline');
  for (const it of (r.dueBeforeNextPay || {}).items || []) look(it.amount, 'due ' + it.item);
  look((r.dueBeforeNextPay || {}).total, 'due total');
  for (const [id, c] of Object.entries(r.cards || {})) { look((c.next || {}).amount, id + '.next'); look(c.owedNow, id + '.owedNow'); }
  look((r.total || {}).amount, 'total');
  for (const [id, p] of Object.entries(r.places || {})) look(p.kept, 'place ' + id);
  const per = r.period || {};
  for (const l of [].concat(per.lines || [], per.free ? [per.free] : [])) { look(l.amount, 'period ' + (l.id || 'free')); look(l.left, 'period left ' + (l.id || 'free')); }
  return bad;
}

const stats = {}, fails = {};
const seen = k => { stats[k] = (stats[k] || 0) + 1; };
const fail = (m, k, d) => { const key = m + ': ' + k; (fails[key] = fails[key] || []).push(d); };
for (let seed = FROM; seed < FROM + N; seed++) {
  const sc = genLife(seed);
  const period = (sc.income || []).find(s => s.starts_period) || (sc.income || [])[0];
  for (const day of sc.askDays) {
    for (const m of models) {
      let r;
      try { r = m.run(sc, day); } catch (e) { fail(m.name, 'threw', seed + ' ' + day + ' ' + String(e.message).split('\n')[0]); continue; }
      const T = dn(day);
      for (const [id, a] of Object.entries(r.accounts || {})) {
        // 1.
        const hand = bankByHand(sc, id, day);
        if (hand === null) seen(m.name + ' bank: same day as a check, not judged');
        else { seen(m.name + ' bank judged'); if (hand !== a.bank) fail(m.name, '1 bank today is not the last check plus what settled since', `seed ${seed} ${day} ${id}: ${a.bank} against ${hand}`); }
        // 2.
        const np = r.daysToNextPay && r.daysToNextPay.next_pay;
        const otherIn = (sc.income || []).some(s => s !== period && s.account === id);
        if (!np || dn(np) <= T || otherIn || (period && period.account !== id && (sc.income || []).some(s => s.account === id))) { seen(m.name + ' safe to spend: not judged'); continue; }
        const due = ((r.dueBeforeNextPay || {}).items || []).filter(x => x.account === id).reduce((t, x) => t + x.amount, 0);
        seen(m.name + ' safe to spend judged');
        if (a.headroom > a.bank - due - (a.minimum || 0)) fail(m.name, '2 safe to spend is more than bank less due before pay less the minimum', `seed ${seed} ${day} ${id}: ${a.headroom} > ${a.bank} - ${due} - ${a.minimum || 0}`);
      }
      // 3.
      for (const b of fractions(r)) fail(m.name, '3 a fractional amount in minor units', `seed ${seed} ${day} ${b}`);
      // 4.
      const per = r.period;
      if (per && per.nextPay && per.nextPay.state === 'late') {
        seen(m.name + ' period with a late pay judged');
        if (per.end && dn(per.end) < T) fail(m.name, '4 the period ends before today while its pay is late', `seed ${seed} ${day}: ends ${per.end}`);
      }
    }
  }
}
console.log(`invariants on ${N} seeds (${FROM} to ${FROM + N - 1}), ${models.map(m => m.name).join(' and ')}`);
console.log('checked: ' + JSON.stringify(stats));
const keys = Object.keys(fails);
for (const k of keys) { console.log(`FAIL ${k}: ${fails[k].length} times`); for (const d of fails[k].slice(0, verbose ? 50 : 3)) console.log('  ' + d); }
console.log(keys.length ? `INVARIANTS FAILED: ${keys.length} kinds` : 'every invariant holds');
process.exit(keys.length ? 1 : 0);
