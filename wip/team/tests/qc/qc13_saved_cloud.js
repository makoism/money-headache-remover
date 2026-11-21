/* QC round 6 data safety C3: Settings Saved data said "Neither one moves to other devices." right above Cloud copy, with the cloud
   copy off. When the cloud copy can be turned on (its box shows), it says "Neither one moves to other devices unless you turn on
   Cloud copy below." When it can't (no cloud here, the box is hidden), the sentence stays as it was, since there is nothing below
   to turn on.  Reads the source.  Run: node tests/qc/qc13_saved_cloud.js */
const fs = require('fs'), d = __dirname + '/../../', s = fs.readFileSync(d + 'ui42.js', 'utf8'), body = fs.readFileSync(d + 'body.html', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const get = k => { const m = s.match(new RegExp('const ' + k + " = '((?:[^'\\\\]|\\\\.)*)'")); return m ? m[1] : null; };
const local = get('SAVED_LOCAL'), off = get('SAVED_LOCAL_OFF');
ck('SAVED_LOCAL (no cloud here) keeps "Neither one moves to other devices."', !!local && local.includes('Neither one moves to other devices. '));
ck('SAVED_LOCAL_OFF says "Neither one moves to other devices unless you turn on Cloud copy below."', !!off && off.includes('Neither one moves to other devices unless you turn on Cloud copy below. '));
ck('the two differ only in that sentence', !!local && !!off && off === local.replace('Neither one moves to other devices.', 'Neither one moves to other devices unless you turn on Cloud copy below.'));
ck('paintVault: cloud on -> SAVED_CLOUD, off and the box shows -> SAVED_LOCAL_OFF, else SAVED_LOCAL', /const t = vault\.on \? SAVED_CLOUD : can \? SAVED_LOCAL_OFF : SAVED_LOCAL;/.test(s));
ck('the Cloud copy box is below the Saved data note in Settings', body.indexOf('id="savedCap"') > 0 && body.indexOf('id="vaultBox"') > body.indexOf('id="savedCap"'));
console.log(bad ? `qc13_saved_cloud: ${bad} FAIL` : 'qc13_saved_cloud: ALL PASS'); process.exit(bad ? 1 : 0);
