/* QC round 6 wording polish: comma splices, two whole thoughts joined by only a comma. Each is two sentences now.
   Reads the source.  Run: node tests/qc/qc13_comma_splices.js */
const fs = require('fs'), d = __dirname + '/../../', src = ['ui45.js', 'ui6.js', 'model.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const pairs = [
  ["or skip it, it\\'s under Help too.", "Come back here when you\\'re done or skip it. It\\'s under Help too."],
  ['made up, replace them with yours.', 'The sample numbers are made up. Replace them with yours.'],
  ['Fun for you and your family, spend it', 'Fun for you and your family. Spend it on whatever you want.'],
  ['You never spend this, it grows', 'You never spend this. It grows over time.'],
  ['is Help, it has the video', 'The ? button at the bottom right of every screen is Help. It has the video and this setup.'],
  ['put it toward a goal, you can undo either one', 'Keep it in the bank or put it toward a goal. You can undo either one.'],
  ['in the bank, you can undo it', 'Keep it in the bank. You can undo it.'],
];
for (const [old, now] of pairs) { ck('gone: "' + old + '"', !src.includes(old)); ck('now: "' + now + '"', src.includes(now)); }
console.log(bad ? `qc13_comma_splices: ${bad} FAIL` : 'qc13_comma_splices: ALL PASS'); process.exit(bad ? 1 : 0);
