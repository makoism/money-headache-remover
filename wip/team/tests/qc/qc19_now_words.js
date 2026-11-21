/* QC round 7 north-star 1: Explain this tab, step 1, said "Everything else on Home is planned from it" about In your bank now, but the
   plan starts from the balance given in setup (until Mako decides on Check your bank vs the plan's start). The step says what is true.
   Reads the source.  Run: node tests/qc/qc19_now_words.js */
const s = require('fs').readFileSync(__dirname + '/../../ui48.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no "Everything else on Home is planned from it"', !/Everything else on Home is planned from it/.test(s));
ck('it says the rest of Home is the plan, from the balance in setup', /The rest of Home is your plan, worked out from the balance you gave in setup/.test(s));
console.log(bad ? `qc19_now_words: ${bad} FAIL` : 'qc19_now_words: ALL PASS'); process.exit(bad ? 1 : 0);
