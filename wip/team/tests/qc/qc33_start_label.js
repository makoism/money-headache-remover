/* QC round 13 north star 1: after Check your bank on Home ($4,500), Settings still called the plan's start figure ($1,500) "Money today ...
   What you have right now ... Update it whenever you check your bank". Two figures claimed to be what you have now, and following the
   Settings advice moved the plan's start (pay counted twice). The field is named for what it is and points to Check your bank. */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const m = html.match(/\{ k: 'bankStart', label: '((?:[^'\\]|\\.)*)', hint: '((?:[^'\\]|\\.)*)' \}/);
ck('the Settings start balance field is found', !!m);
if (m) {
  ck('its name is not "Money today"', !/Money today/.test(m[1]), m[1]);
  ck('its name says it is where the plan starts', /plan/i.test(m[1]) && /start/i.test(m[1]), m[1]);
  ck('its help never says it is what you have right now', !/right now/.test(m[2]), m[2]);
  ck('its help never says to update it whenever you check your bank', !/whenever you check your bank/.test(m[2]), m[2]);
  ck('its help points to Check your bank on Home for today\'s balance', /Check your bank/.test(m[2]) && /Home/.test(m[2]), m[2]);
}
ck('no screen text says Money today', !/Money today/.test(html.replace(/\/\*[\s\S]*?\*\//g, '')), (html.match(/.{0,40}Money today.{0,40}/g) || []).slice(0, 3).join(' | '));
console.log(bad ? 'qc33_start_label: ' + bad + ' FAIL' : 'qc33_start_label: ALL PASS'); process.exit(bad ? 1 : 0);
