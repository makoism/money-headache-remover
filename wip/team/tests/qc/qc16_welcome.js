/* QC round 7 wording, confusing 8: the Welcome said "the burrow shows you how much is really free to spend and saves up for the things you
   want", but the app does not save money itself. Now "Put in your pay and bills. The Burrow shows what is free to spend and helps you save
   for the things you want." Reads the source.  Run: node tests/qc/qc16_welcome.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readFileSync(d + 'ui45.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the Welcome says what the app does and that you do the saving', src.includes('<p class="tour-what">Put in your pay and bills. The Burrow shows what is free to spend and helps you save for the things you want.</p>'));
ck('"saves up for the things you want" is gone', !src.includes('saves up for the things you want'));
ck('"really free to spend" is gone', !src.includes('really free to spend'));
console.log(bad ? `qc16_welcome: ${bad} FAIL` : 'qc16_welcome: ALL PASS'); process.exit(bad ? 1 : 0);
