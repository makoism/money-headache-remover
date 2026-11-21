/* QC round 4 novice P4: the Monthly bills step (tick boxes only, no amounts) said "rough numbers are fine". It says the amounts come
   next. Reads the source, no browser.  Run: node tests/qc/qc11_bills_tick.js */
const s = require('fs').readFileSync(__dirname + '/../../ui45s.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the tick step does not talk about numbers it does not have', !/untick the ones you don't, rough numbers are fine/.test(s));
ck('it says the amounts come next', /You type a rough amount for each one next/.test(s));
console.log(bad ? `qc11_bills_tick: ${bad} FAIL` : 'qc11_bills_tick: ALL PASS'); process.exit(bad ? 1 : 0);
