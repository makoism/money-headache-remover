/* QC round 7 wording, confusing 4: setup's Split the rest said "All 50% of your pay here is given out." Now "All of this 50% is placed."
   (the percent is the split's total). Reads the source.  Run: node tests/qc/qc16_split_placed.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readFileSync(d + 'ui45x.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the full split says "All of this N% is placed."', src.includes('`All of this <b>${o.total}%</b> is placed.`'));
ck('"of your pay here is given out" is gone', !src.includes('of your pay here is given out'));
console.log(bad ? `qc16_split_placed: ${bad} FAIL` : 'qc16_split_placed: ALL PASS'); process.exit(bad ? 1 : 0);
