/* QC round 7 wording polish: five error texts said what went wrong and not what to do next ("No connection.", "No text came back.",
   "That could not be added.", "That copy could not be opened with this code.") or used jargon ("No JSON in the answer."). Each now ends
   with a next step. Reads the source.  Run: node tests/qc/qc16_error_steps.js */
const fs = require('fs'), d = __dirname + '/../../', src = ['ui41.js', 'ui42.js', 'burrows.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const pairs = [
  ["'No connection.'", "'No connection. Check the internet and try again.'"],
  ["'No text came back.'", "'No text came back. Try again.'"],
  ["'That could not be added.'", "'That could not be added. Try again.'"],
  ["'That copy could not be opened with this code.'", "'That copy could not be opened with this code. Check the code for a typo and try again.'"],
  ['No JSON', "'The answer had no numbers in it. Try again.'"],
];
for (const [old, now] of pairs) { ck('gone: ' + old, !src.includes(old)); ck('now: ' + now, src.includes(now)); }
console.log(bad ? `qc16_error_steps: ${bad} FAIL` : 'qc16_error_steps: ALL PASS'); process.exit(bad ? 1 : 0);
