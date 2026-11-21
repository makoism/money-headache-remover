/* QC round 8 wording polish: the setup currency step's line about stopping read "Finish later at the top stops here and keeps what you
   typed, and Guided setup under Help opens it again." It says what to tap first now: "Tap Finish later at the top to stop. What you
   typed is kept. Guided setup in Help opens it again."  Reads the source.  Run: node tests/qc/qc21_setup_words.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readFileSync(d + 'ui45.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the old line is gone', !src.includes('Finish later at the top stops here'));
ck('the new line is on the currency step', src.includes('Tap Finish later at the top to stop. What you typed is kept. Guided setup in Help opens it again.'));
console.log(bad ? `qc21_setup_words: ${bad} FAIL` : 'qc21_setup_words: ALL PASS'); process.exit(bad ? 1 : 0);
