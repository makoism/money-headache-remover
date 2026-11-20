/* QC round 4 novice C2: one setting, two words: Plan said "The mark is your $580 ceiling." and "Above the $580 ceiling." while Settings
   calls it "Free to spend cap". One word: cap. Reads the source, no browser.  Run: node tests/qc/qc11_cap_word.js */
const fs = require('fs'), dir = __dirname + '/../../';
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x)); } };
const ui2 = fs.readFileSync(dir + 'ui2.js', 'utf8'), ui1 = fs.readFileSync(dir + 'ui1.js', 'utf8'), ui4a = fs.readFileSync(dir + 'ui4a.js', 'utf8');
ck('Plan says "cap", not "ceiling"', !/\} ceiling\./.test(ui2) && /Free to spend cap/.test(ui2), (ui2.match(/.{0,40}\} (ceiling|cap)\..{0,10}/g) || []));
ck('the Plan slider mark is titled with the cap', !/title="Your ceiling"/.test(ui1));
ck('Ask is told "Free to spend cap", not "spending ceiling"', !/spending ceiling/.test(ui4a));
console.log(bad ? `qc11_cap_word: ${bad} FAIL` : 'qc11_cap_word: ALL PASS'); process.exit(bad ? 1 : 0);
