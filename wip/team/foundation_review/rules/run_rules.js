#!/usr/bin/env node
// Runs every case in rules/*.json through its reference (rules/<area>_ref.js) and prints PASS or FAIL per case.
// These are the rule areas SCHEMA_V3 section 12 keeps outside the reference model [H7]:
// matching, period end, merge and units, accounts (closing, P6), and edits (what setup and an edit may save: X3, X8, W3). Each spec holds its cases (input, hand-worked expected, why)
// and its open questions (points the decisions do not settle; no case depends on them).
// Usage: node run_rules.js [area ...] [--open]   (--open also prints every open question)
// Any FAIL, a spec with no reference, or a reference that throws makes the run fail; the last line
// never says all passed when one did not (LESSONS lesson 2).
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const showOpen = args.includes('--open');
const named = args.filter(a => !a.startsWith('--'));
const specs = fs.readdirSync(__dirname).filter(f => f.endsWith('.json')).sort()
  .filter(f => !named.length || named.includes(f.replace(/\.json$/, '')));

// Compare as text with keys sorted, so key order never matters. A list of records (every item an object with an
// `id`) is compared in id order: the merge keeps records by id, and their order in a list means nothing [AJ1:
// with ordinary ids, `dsk001-...` and `k7qzpa-...` sort apart from short made-up ids].
function canon(x) {
  if (Array.isArray(x)) {
    const byId = x.length > 1 && x.every(i => i && typeof i === 'object' && typeof i.id === 'string');
    return '[' + (byId ? x.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : x).map(canon).join(',') + ']';
  }
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}

let pass = 0, fail = 0, open = 0;
const summary = [];
for (const file of specs) {
  const spec = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
  const refPath = path.join(__dirname, spec.area + '_ref.js');
  let ref = null;
  try { ref = require(refPath); } catch (e) { console.log(`FAIL ${file}: no reference ${path.basename(refPath)} (${e.message})`); fail++; continue; }
  console.log(`\n== ${spec.area}: ${spec.title}`);
  let p = 0, f = 0;
  for (const c of spec.cases) {
    if (!c.why || c.expected === undefined) { console.log(`FAIL ${c.id}: the case has no expected result or no why`); f++; continue; }
    const input = Object.assign({}, spec.defaults || {}, c.input);
    let got;
    try { got = ref.ask(c.question, input); } catch (e) { got = { threw: e.message }; }
    if (canon(got) === canon(c.expected)) { console.log(`PASS ${c.id}  ${c.title}`); p++; }
    else { console.log(`FAIL ${c.id}  ${c.title}\n     expected ${canon(c.expected)}\n     got      ${canon(got)}`); f++; }
  }
  const q = (spec.open || []).length;
  if (showOpen) for (const o of spec.open || []) console.log(`OPEN ${o.id}  ${o.question}\n     the reference: ${o.ref_does}`);
  const s2 = spec.cases.filter(c => c.stage === 2).length;   // [AQ5] the rich merge's cases, kept as the stage 2 spec
  summary.push(`${spec.area}: ${p} passed${s2 ? ` (${s2} cases stage 2)` : ''}, ${f} failed, ${q} open questions`);
  pass += p; fail += f; open += q;
}
console.log('\n' + summary.join('\n'));
console.log(fail ? `FAILED: ${fail} of ${pass + fail} cases failed` : `All ${pass} cases passed (${open} open questions listed, none tested)`);
// [AJ1] The realistic-ids check runs every time: the same cases with every short made-up id in the ordinary form.
// Its own last line says how that run went; either run failing fails this one.
let realOk = true;
if (!process.env.REALISTIC_IDS_INNER) { console.log(''); realOk = require('../realistic_ids.js').run(['rules']); }
process.exit(fail || !realOk ? 1 : 0);
