/* QC round 5 data safety C4: the newer-cloud-copy note said "Whichever you pick, the other one is kept for 3 days", but Keep mine
   replaces the cloud copy and keeps nothing of it here. The note says what each button keeps.  Reads the source.
   Run: node tests/qc/qc12_newer_words.js */
const s = require('fs').readFileSync(__dirname + '/../../ui42.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no "Whichever you pick, the other one is kept"', !/Whichever you pick, the other one is kept/.test(s));
ck('Load: the numbers here are kept with Undo', /If you load it, the numbers here are kept for \$\{KEEP_DAYS\} days and Undo brings them back\./.test(s));
ck('Keep mine: they replace the cloud copy and the other device is asked first', /If you keep yours, they replace the cloud copy, and the other device asks before it loads them\./.test(s));
console.log(bad ? `qc12_newer_words: ${bad} FAIL` : 'qc12_newer_words: ALL PASS'); process.exit(bad ? 1 : 0);
