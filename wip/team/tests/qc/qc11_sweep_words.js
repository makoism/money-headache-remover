/* QC round 4 wording (confusing): the month-end question said "Your bank balance doesn't include it yet." about unspent Free to spend.
   The money is in the bank; it is the plan that counted it as spent. Reads the source, no browser.
   Run: node tests/qc/qc11_sweep_words.js */
const fs = require('fs'), s = fs.readFileSync(__dirname + '/../../ui6.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the question no longer says the bank does not include it', !/Your bank balance doesn't include it yet/.test(s));
ck('it says the plan counted it as spent', /The plan counted it as spent\./.test(s));
console.log(bad ? `qc11_sweep_words: ${bad} FAIL` : 'qc11_sweep_words: ALL PASS'); process.exit(bad ? 1 : 0);
