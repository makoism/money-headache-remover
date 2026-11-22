/* QC round 14 wording confusing 2 and data safety confusing 2: after Choose file, the button to tap was called "Load text", though the
   person picked a file. The button loads a backup either way (a file read into the box, or pasted text), so it is called Load backup, and
   every line that names it says the same. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
ck('the button is called Load backup', /id="bkLoad">Load backup</.test(html));
ck('no line names a Load text button', !/Load text/.test(html), (html.match(/.{0,60}Load text.{0,20}/g) || []).join(' | '));
ck('the steps say Choose file, then Load backup', /Tap <b>Choose file<\/b> and pick your backup\. Then tap <b>Load backup<\/b>, and tap it again to confirm\./.test(html));
console.log(bad ? 'qc34_load_backup: ' + bad + ' FAIL' : 'qc34_load_backup: ALL PASS'); process.exit(bad ? 1 : 0);
