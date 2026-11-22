/* QC round 14 data safety confusing 3: after loading an older cloud copy over a phone's own numbers, the Undo bar said "Undo also stops
   sharing the cloud copy on this device." without saying whether the cloud copy changes. Undo never sends anything over that copy
   (ui42.js), so the bar says so. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
ck('the kept-change bar says Undo puts the old numbers back and the cloud copy stays', /Undo puts your old numbers back here\. The cloud copy stays as it is, and this device stops using it\./.test(html));
ck('the old line is gone', !/Undo also stops sharing the cloud copy on this device/.test(html));
console.log(bad ? 'qc34_undo_cloud: ' + bad + ' FAIL' : 'qc34_undo_cloud: ALL PASS'); process.exit(bad ? 1 : 0);
