/* QC round 7 novice B1: the setup-done text said "The ? button at the bottom right of every screen is Help." but setup and an
   open burrow have no ? button. The words now name the screens that have it.  Reads the source.  Run: node tests/qc/qc17_help_where.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readdirSync(d).filter(f => /\.js$/.test(f) && !/^test_/.test(f)).map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('gone: "bottom right of every screen"', !src.includes('bottom right of every screen'));
ck('now: "The ? button at the bottom right of Home, Receipts, Plan and Settings is Help. It has the video and this setup."',
  src.includes('The ? button at the bottom right of Home, Receipts, Plan and Settings is Help. It has the video and this setup.'));
console.log(bad ? `qc17_help_where: ${bad} FAIL` : 'qc17_help_where: ALL PASS'); process.exit(bad ? 1 : 0);
