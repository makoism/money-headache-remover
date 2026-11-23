#!/usr/bin/env node
// Runs every case in rules/*.json through its reference (rules/<area>_ref.js) and prints PASS or FAIL per case.
// These are the rule areas SCHEMA_V3 section 12 keeps outside the reference model [H7]:
// matching, period end, merge and units, and accounts (closing, P6). Each spec holds its cases (input, hand-worked expected, why)
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

// Compare as text with keys sorted, so key order never matters.
function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
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
  summary.push(`${spec.area}: ${p} passed, ${f} failed, ${q} open questions`);
  pass += p; fail += f; open += q;
}
console.log('\n' + summary.join('\n'));
console.log(fail ? `FAILED: ${fail} of ${pass + fail} cases failed` : `All ${pass} cases passed (${open} open questions listed, none tested)`);
process.exit(fail ? 1 : 0);
