/* QC round 6 wording polish: six notes on screen had no full stop (the Cards and loans note, the Receipts note about unlisted
   lines, the Repeating spending note, the Free to spend cap hint, the note under a goal's why and the cloud copy note at the end of
   setup). Each ends with one.  Reads the source.  Run: node tests/qc/qc13_full_stops.js */
const fs = require('fs'), d = __dirname + '/../../', src = ['ui1.js', 'ui4.js', 'ui45.js', 'ui45s.js', 'ui6.js', 'ui7.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
for (const t of ['and their payments are part of Bills and basics', "aren't listed, except Free to spend", 'it gets logged for you on its day',
  'shown as a mark on the Free to spend bar in Plan', 'so you keep seeing why', 'find Cloud copy and tap Keep a copy in the cloud'])
  ck('"' + t + '" ends with a full stop', src.includes(t) && !new RegExp(t.replace(/[.*+?^${}()|[\]\\']/g, '.') + "[<'`]").test(src));
console.log(bad ? `qc13_full_stops: ${bad} FAIL` : 'qc13_full_stops: ALL PASS'); process.exit(bad ? 1 : 0);
