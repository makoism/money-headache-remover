/* QC round 6 wording 7: Plan's sticky line said "¥80,000 of your pay not placed yet in Nov · Not placed yet", the same words twice.
   When the status word after the dot repeats what the sentence already says, it is left out.  Reads the source.
   Run: node tests/qc/qc14_dock_repeat.js */
const fs = require('fs'), src = fs.readFileSync(__dirname + '/../../ui2.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const line = (src.match(/\$\('#dockTxt'\)\.textContent = [^\n]*/) || [''])[0];
ck('the sticky line is found', line.length > 0);
ck('the status word is no longer glued on after the sentence in one template', !/\+ mon[^\n]*\} · \$\{/.test(line));
ck('the status word is left out when the sentence already says it', /dockS\.toLowerCase\(\)\.includes\(dockSt\.toLowerCase\(\)\)/.test(src));
ck('the status "Not placed yet" is still there for the other lines', /'Not placed yet'/.test(src));
console.log(bad ? `qc14_dock_repeat: ${bad} FAIL` : 'qc14_dock_repeat: ALL PASS'); process.exit(bad ? 1 : 0);
