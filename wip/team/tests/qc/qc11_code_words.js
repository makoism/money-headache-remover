/* QC round 4 data safety (confusing 2): the recovery code note said "It cannot be looked up again if you lose it and lose this device"
   without saying what that means. It says: then nobody can open the cloud copy, and only a backup file brings the numbers back.
   Reads the source, no browser.  Run: node tests/qc/qc11_code_words.js */
const s = require('fs').readFileSync(__dirname + '/../../ui42.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the code note says nobody can open the cloud copy then', /nobody can open the cloud copy/.test(s));
ck('the code note says only a backup file brings the numbers back', /only a backup file brings your numbers back/.test(s));
console.log(bad ? `qc11_code_words: ${bad} FAIL` : 'qc11_code_words: ALL PASS'); process.exit(bad ? 1 : 0);
