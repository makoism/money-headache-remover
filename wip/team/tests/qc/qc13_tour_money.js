/* QC round 6 wording 5: the Your money step said "add it later on Plan", but the balance is on Home and in Settings, not on Plan.
   It says "Not sure? Leave it blank and add it later on Home."  Reads the source.  Run: node tests/qc/qc13_tour_money.js */
const s = require('fs').readFileSync(__dirname + '/../../ui45s.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no "add it later on Plan"', !/add it later on Plan/.test(s));
ck('says "Not sure? Leave it blank and add it later on Home."', s.includes('<p class="cap">Not sure? Leave it blank and add it later on Home.</p>'));
console.log(bad ? `qc13_tour_money: ${bad} FAIL` : 'qc13_tour_money: ALL PASS'); process.exit(bad ? 1 : 0);
