/* QC round 4 wording (polish) and VOICE.md Part D 2: "free to spend" was lowercase where it names the place (the Top-up badge, Add money,
   an Ask chip, "Over free to spend", "No free to spend planned"). A glossary word keeps its capitals. ("is free to spend" as plain words
   stays.) Reads the source, no browser.  Run: node tests/qc/qc11_fts_caps.js */
const fs = require('fs'), d = __dirname + '/../../';
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x)); } };
const all = ['ui2.js', 'ui6.js', 'ui7.js', 'ui46.js', 'burrows.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
for (const phrase of ['Over free to spend', 'unspent free to spend toward', 'From free to spend', 'Cut my free to spend', 'No free to spend planned', 'Spend it, free to spend'])
  ck('no "' + phrase + '"', !all.includes(phrase));
console.log(bad ? `qc11_fts_caps: ${bad} FAIL` : 'qc11_fts_caps: ALL PASS'); process.exit(bad ? 1 : 0);
