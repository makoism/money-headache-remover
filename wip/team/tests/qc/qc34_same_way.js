/* QC round 14 wording polish 3: on Receipts, with the AI reading off, Use your own AI said "The reply gets checked and listed for you to go
   through the same way." Nothing above it says what "the same way" is. Off, the line ends at "listed for you to go through." On, it still
   points at the buttons above. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const m = html.match(/lede\.textContent = off \? '((?:[^'\\]|\\.)*)'/);
ck('the AI-off lede is found', !!m);
if (m) { ck('it does not say "the same way"', !/same way/.test(m[1]), m[1]); ck('it ends with "listed for you to go through."', /listed for you to go through\.$/.test(m[1]), m[1]); }
console.log(bad ? 'qc34_same_way: ' + bad + ' FAIL' : 'qc34_same_way: ALL PASS'); process.exit(bad ? 1 : 0);
