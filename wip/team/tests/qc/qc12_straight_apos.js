/* QC round 5 wording 14: one screen said "partner’s" with a curly apostrophe; every other word uses a straight one. No curly
   apostrophes in the app's words.  Reads the source.  Run: node tests/qc/qc12_straight_apos.js */
const fs = require('fs'), d = __dirname + '/../../';
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x) console.log('     saw ' + x); } };
for (const f of fs.readdirSync(d).filter(f => /^(ui\w*|model|burrows|actions)\.js$/.test(f))) {
  const hits = fs.readFileSync(d + f, 'utf8').split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.includes('’'));
  ck(f + ': no curly apostrophes', hits.length === 0, hits.map(([n, l]) => n + ': ' + l.slice(Math.max(0, l.indexOf('’') - 30), l.indexOf('’') + 10)).join(' | '));
}
console.log(bad ? `qc12_straight_apos: ${bad} FAIL` : 'qc12_straight_apos: ALL PASS'); process.exit(bad ? 1 : 0);
