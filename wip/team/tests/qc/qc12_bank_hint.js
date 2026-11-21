/* QC round 5 north-star 9: the setup "Balance now" placeholder "Rough is fine. Overdrawn? Type a minus" was cut off at 412 wide, and a
   placeholder is gone once typing starts. The placeholder is short and the minus hint is a line under the box.  Reads the source.
   Run: node tests/qc/qc12_bank_hint.js */
const s = require('fs').readFileSync(__dirname + '/../../ui45s.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no long placeholder on Balance now', !/'Rough is fine\. Overdrawn\? Type a minus'/.test(s));
ck('the placeholder is "Rough is fine"', /moneyField\('tourBank', 'Balance now', [^\n]*?, 'Rough is fine'\)/.test(s));   /* the value expression changed in 0d762a2 (a sample start is not shown as the person's own); only the placeholder is checked here */
ck('a line under the box says how to type an overdrawn balance', /id="tourBankCap"[^>]*>Overdrawn\? Type a minus first, like −200\.</.test(s));
console.log(bad ? `qc12_bank_hint: ${bad} FAIL` : 'qc12_bank_hint: ALL PASS'); process.exit(bad ? 1 : 0);
