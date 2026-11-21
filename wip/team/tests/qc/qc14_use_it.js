/* QC round 6 wording 6: Plan's month verdict said "Raise a goal or another place to use it, or leave it where it is." It now says
   "To use it, raise a goal or another place. Or leave it in the bank."  Reads the source.  Run: node tests/qc/qc14_use_it.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readdirSync(d).filter(f => /^ui.*\.js$/.test(f)).map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the old line is gone', !src.includes('Raise a goal or another place to use it'));
ck('the new line is there', src.includes('To use it, raise a goal or another place. Or leave it in the bank.'));
console.log(bad ? `qc14_use_it: ${bad} FAIL` : 'qc14_use_it: ALL PASS'); process.exit(bad ? 1 : 0);
