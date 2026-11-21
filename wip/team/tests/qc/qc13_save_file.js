/* QC round 6 wording 8: one action had three names. Settings says "Save file", the Home backup notes said "Save a copy" and
   "Save a file instead", and the save status said "Save a copy in Settings". All of them run the same backup (bkRun), so all of
   them say "Save file".  Reads the source.  Run: node tests/qc/qc13_save_file.js */
const fs = require('fs'), d = __dirname + '/../../';
const files = fs.readdirSync(d).filter(f => /^ui\w*\.js$/.test(f)).concat(['body.html']), all = files.map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
const u43 = fs.readFileSync(d + 'ui43.js', 'utf8'), u0 = fs.readFileSync(d + 'ui0.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no "Save a copy" anywhere', !/Save a copy/.test(all));
ck('no "Save a file instead" anywhere', !/Save a file instead/.test(all));
const btns = u43.match(/<button[^>]*data-bk-now[^>]*>[^<]*<\/button>/g) || [];
ck('every Home backup button (data-bk-now) says Save file (' + btns.length + ' found)', btns.length >= 3 && btns.every(b => />Save file<\/button>$/.test(b)));
ck('the data-bk-now buttons run the same backup as Settings Save file', /\[data-bk-now\]'\)\) \{\s*const ok = bkRun/.test(u43) && /\$\('#bkSave'\)\.addEventListener\('click', \(\) => \{ bkRun\(\); \}\)/.test(fs.readFileSync(d + 'ui5.js', 'utf8')));
ck('Numbers restored says "Tap Save file to keep a backup as well."', u43.includes('Tap Save file to keep a backup as well.'));
ck('the save status says "Not saved. Tap Save file in Settings."', u0.includes("error: 'Not saved. Tap Save file in Settings.'"));
console.log(bad ? `qc13_save_file: ${bad} FAIL` : 'qc13_save_file: ALL PASS'); process.exit(bad ? 1 : 0);
