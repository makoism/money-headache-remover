/* QC round 5 wording 13: "Bills and basics are 55% of pay, which is about the usual 55%." said the percent twice. When the share is about
   the usual one the sentence says so once: "Bills and basics are 55% of pay, about the usual share."  Reads the source, no browser.
   Run: node tests/qc/qc12_usual_share.js */
const s = require('fs').readFileSync(__dirname + '/../../ui2.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no "which is about the usual ${u}%"', !/which is about the usual \$\{u\}%/.test(s));
ck('it says "about the usual share"', /of pay, about the usual share\./.test(s));
console.log(bad ? `qc12_usual_share: ${bad} FAIL` : 'qc12_usual_share: ALL PASS'); process.exit(bad ? 1 : 0);
