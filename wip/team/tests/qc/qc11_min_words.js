/* QC round 4 north-star agent check C3 and novice C3: one setting, two names (Home "safety minimum", Plan and Settings "minimum balance"),
   and the "How is this worked out?" panel showed "Your minimum balance" without saying what it is. One name, minimum balance, and the
   panel says what it is for. Reads the source, no browser.  Run: node tests/qc/qc11_min_words.js */
const fs = require('fs'), dir = __dirname + '/../../';
const files = fs.readdirSync(dir).filter(f => /^(ui[0-9a-z]*|burrows)\.js$/.test(f));
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 300)); } };
const said = files.flatMap(f => (fs.readFileSync(dir + f, 'utf8').match(/[`'][^`'\n]*safety minimum[^`'\n]*[`']/g) || []).map(x => f + ': ' + x.slice(0, 80)));
ck('no screen text says "safety minimum"', said.length === 0, said);
ck('the How is this worked out panel says what the minimum balance is', /the least you want in the bank/i.test(fs.readFileSync(dir + 'ui7.js', 'utf8')));
console.log(bad ? `qc11_min_words: ${bad} FAIL` : 'qc11_min_words: ALL PASS'); process.exit(bad ? 1 : 0);
