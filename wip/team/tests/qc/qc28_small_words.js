/* QC round 9 wording polish 16 and 17: "Add card or loan" next to "Add a burrow" becomes "Add a card or loan" (the button and the
   two places that name it); the Home bank box hint ends with a full stop; "If you spent something add a rough total" gets its comma.
   Reads the source (screen words only, comments removed).  Run: node tests/qc/qc28_small_words.js */
const fs = require('fs'), d = __dirname + '/../../';
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };
const files = fs.readdirSync(d).filter(f => /^ui.*\.js$/.test(f)).concat(['body.html']);
const src = files.map(f => fs.readFileSync(d + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')).join('\n');
ck('no "Add card or loan" without "a"', !/Add card or loan/.test(src), (src.match(/.{30}Add card or loan.{10}/) || [])[0]);
ck('the button says "Add a card or loan"', /id="addDebtBtn">Add a card or loan</.test(src));
ck('the bank box hint ends with a full stop', /plus any cash you keep at home\.</.test(src), (src.match(/plus any cash you keep at home.{3}/) || [])[0]);
ck('"If you spent something, add a rough total."', /If you spent something, add a rough total\./.test(src) && !/If you spent something add/.test(src));
console.log(bad ? `qc28_small_words: ${bad} FAIL` : 'qc28_small_words: ALL PASS'); process.exit(bad ? 1 : 0);
