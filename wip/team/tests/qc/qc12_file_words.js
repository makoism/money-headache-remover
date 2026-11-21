/* QC round 5 data safety C2: after Choose file the message said "The file is read. Tap Load text, then tap it again" without saying
   the file's text is now in the box that Load text loads. It says so.  Reads the source.  Run: node tests/qc/qc12_file_words.js */
const s = require('fs').readFileSync(__dirname + '/../../ui5.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('the message says the file\'s text is in the box now', /The file is read and its text is in the box above\. Tap Load text, then tap it again/.test(s));
console.log(bad ? `qc12_file_words: ${bad} FAIL` : 'qc12_file_words: ALL PASS'); process.exit(bad ? 1 : 0);
