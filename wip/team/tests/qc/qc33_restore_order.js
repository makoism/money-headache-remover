// QC round 13 wording 9: the Restore steps say "Tap Choose file ... Then tap Load backup", so Choose file comes first.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
const a = html.indexOf('id="bkFileBtn"'), b = html.indexOf('id="bkLoad"');
const ok = a > 0 && b > 0 && a < b;
console.log((ok ? 'PASS' : 'FAIL') + ' Restore: Choose file comes before Load backup, as the steps say');
console.log(ok ? 'qc33_restore_order: ALL PASS' : 'qc33_restore_order: 1 FAIL'); process.exit(ok ? 0 : 1);
