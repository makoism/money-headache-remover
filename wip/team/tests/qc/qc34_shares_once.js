/* QC round 14 north star 2: setup's "Split the rest" said "These shares are a starting point, change them to fit you" (inside "Where your
   pay goes, in short") right above "These shares are only a start. Drag a slider or tap a percent to change it...". It says it once. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
ck('the short line is gone', !/These shares are a starting point/.test(html));
ck('the line with what to do stays', /These shares are only a start\. Drag a slider or tap a percent to change it/.test(html));
console.log(bad ? 'qc34_shares_once: ' + bad + ' FAIL' : 'qc34_shares_once: ALL PASS'); process.exit(bad ? 1 : 0);
