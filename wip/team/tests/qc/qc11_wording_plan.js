/* QC round 4 wording (confusing): Plan told people to go to Plan ("Place it on Plan" on the Plan tab's summary; "To change it open
   Burrows under Plan" inside Plan > Burrows), Settings > Goal burrows said "Your burrows are in here" (Giving is a burrow too), and an
   unticked Emergency fund box in Trip's editor said "This is the one goal you can borrow from". Reads the source, no browser.
   Run: node tests/qc/qc11_wording_plan.js */
const fs = require('fs'), d = __dirname + '/../../', r = f => fs.readFileSync(d + f, 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('Plan\'s summary does not say "Place it on Plan"', !/Place it on Plan/.test(r('ui2.js')));
ck('the goal editor does not send people to Burrows under Plan', !/open Burrows under Plan/.test(r('ui1.js')) && /tap Change monthly amount/.test(r('ui1.js')));
ck('Goal burrows says "Your goals are in here"', !/Your burrows are in here/.test(r('model.js')) && /Your goals are in here/.test(r('model.js')));
ck('an unticked Emergency fund box says to tick it to make this the emergency fund', /Tick to make this your emergency fund/.test(r('ui1.js')));
console.log(bad ? `qc11_wording_plan: ${bad} FAIL` : 'qc11_wording_plan: ALL PASS'); process.exit(bad ? 1 : 0);
