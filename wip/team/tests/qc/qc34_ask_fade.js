/* QC round 14 layout confusing 2: on a phone the Ask suggestion row scrolls sideways with its scrollbar hidden, and the last chip is cut at
   the panel edge ("Where") with nothing saying there is more. The row fades out at its right edge, so a cut chip reads as "more this way". */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.env.PAGE || path.join(__dirname, '../../../money-map-team.html'), 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const m = html.match(/@media \(max-width: 520px\) \{ \.ask-sug \{([^}]*)\}/);
ck('the phone rule for the Ask row is found', !!m);
if (m) { ck('it still scrolls sideways', /overflow-x: auto/.test(m[1])); ck('it fades at the right edge', /mask-image: linear-gradient\(to right/.test(m[1]), m[1]); }
console.log(bad ? 'qc34_ask_fade: ' + bad + ' FAIL' : 'qc34_ask_fade: ALL PASS'); process.exit(bad ? 1 : 0);
