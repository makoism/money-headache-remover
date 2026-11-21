/* QC round 5 wording 12: four sentences on screen had no full stop (setup's bills step and its hints, the Settings minimum balance
   hint). Each ends with one.  Reads the source.  Run: node tests/qc/qc12_full_stops.js */
const fs = require('fs'), d = __dirname + '/../../', src = ['ui1.js', 'ui45s.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
for (const t of ["If one's missing you can add lines later", 'add it to Other pay each month on the Your money step', 'your money for fun', 'You get a warning when a month would end below this'])
  ck('"' + t + '" ends with a full stop', src.includes(t) && !new RegExp(t.replace(/[.*+?^${}()|[\]\\']/g, '.') + "[<'`]").test(src));
console.log(bad ? `qc12_full_stops: ${bad} FAIL` : 'qc12_full_stops: ALL PASS'); process.exit(bad ? 1 : 0);
