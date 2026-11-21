/* QC round 5 north-star 9: the setup "Balance now" placeholder "Rough is fine. Overdrawn? Type a minus" was cut off at 412 wide, and a
   placeholder is gone once typing starts. The placeholder is short and the minus hint is a line under the box.  Reads the source.
   Run: node tests/qc/qc12_bank_hint.js */
const s = require('fs').readFileSync(__dirname + '/../../ui45s.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('no long placeholder on Balance now', !/'Rough is fine\. Overdrawn\? Type a minus'/.test(s));
ck('the placeholder is "Rough is fine"', /moneyField\('tourBank', 'Balance now', [^)]*\), 'Rough is fine'\)/.test(s) || /'Balance now', S\.cfg\.bankStart !== undefined \? S\.cfg\.bankStart : '', 'Rough is fine'\)/.test(s));
ck('a line under the box says how to type an overdrawn balance', /id="tourBankCap"[^>]*>Overdrawn\? Type a minus first, like −200\.</.test(s));
console.log(bad ? `qc12_bank_hint: ${bad} FAIL` : 'qc12_bank_hint: ALL PASS'); process.exit(bad ? 1 : 0);
