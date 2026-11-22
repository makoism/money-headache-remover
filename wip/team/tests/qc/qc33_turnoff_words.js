/* QC round 13 data safety confusing 1: Settings, Cloud copy, Turn off asked only "Tap again: delete the cloud copy", without saying that the
   code stops working and that the numbers on this device stay. The ask says both before the second tap. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const m = html.match(/\$\('#vaultOff'\); if \(b\.dataset\.armed !== '1'\) \{ b\.dataset\.armed = '1'; b\.textContent = '([^']*)'/);
ck('the Turn off ask is found', !!m);
if (m) { ck('it says the code stops working', /code/.test(m[1]), m[1]); ck('it says the numbers on this device stay', /stay/.test(m[1]) && /(here|this device)/.test(m[1]), m[1]); ck('it still asks for a second tap', /^Tap again/.test(m[1]), m[1]); }
console.log(bad ? 'qc33_turnoff_words: ' + bad + ' FAIL' : 'qc33_turnoff_words: ALL PASS'); process.exit(bad ? 1 : 0);
