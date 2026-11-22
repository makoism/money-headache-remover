/* QC round 14 wording polish 1: Plan, Explain this tab, step 1 ("The big number is this month's Free to spend and it's yours to spend on
   whatever you want") had no full stop. Every Explain this tab step ends with one. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const steps = [...html.matchAll(/\['#[A-Za-z][^'\n]*', '[^'\n]+', '((?:[^'\\\n]|\\.)+)'\]/g)].map(m => m[1]).filter(t => !/^#[0-9a-f]{3,6}$/i.test(t));
ck('Explain this tab steps are found', steps.length > 20, steps.length);
const open = steps.filter(t => !/[.!?:)]$/.test(t.trim()));
ck('every step ends with a full stop', open.length === 0, open.join(' | '));
console.log(bad ? 'qc34_help_stop: ' + bad + ' FAIL' : 'qc34_help_stop: ALL PASS'); process.exit(bad ? 1 : 0);
