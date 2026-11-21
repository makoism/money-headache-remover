/* QC round 7 wording, confusing 5: setup's Emergency fund said "you can borrow from it in a short month". Now "when a month runs short".
   Reads the source.  Run: node tests/qc/qc16_runs_short.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readFileSync(d + 'ui45s.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the emergency fund says "borrow from it when a month runs short"', src.includes('borrow from it when a month runs short.'));
ck('"borrow from it in a short month" is gone', !src.includes('borrow from it in a short month'));
console.log(bad ? `qc16_runs_short: ${bad} FAIL` : 'qc16_runs_short: ALL PASS'); process.exit(bad ? 1 : 0);
