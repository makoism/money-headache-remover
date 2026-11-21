/* QC round 7 wording, confusing 6: with no card or loan added, Plan said "Cards and loans with interest, and their payments are part of
   Bills and basics." Now two sentences: "Cards and loans that charge interest. Their monthly payments are part of Bills and basics."
   Reads the source.  Run: node tests/qc/qc16_debt_sub.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readFileSync(d + 'ui7.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the empty cards and loans line is two plain sentences', src.includes("'Cards and loans that charge interest. Their monthly payments are part of Bills and basics.'"));
ck('"Cards and loans with interest, and their payments" is gone', !src.includes('Cards and loans with interest, and their payments'));
console.log(bad ? `qc16_debt_sub: ${bad} FAIL` : 'qc16_debt_sub: ALL PASS'); process.exit(bad ? 1 : 0);
